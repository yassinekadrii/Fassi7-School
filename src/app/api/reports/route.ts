import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    let user = await getCurrentUser();
    if (!user) {
      user = db.prepare("SELECT id, name, email, role, phone, avatar, status FROM users WHERE role IN ('super_admin', 'academy_admin') AND status = 'active' LIMIT 1").get() as any;
    }
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });


    // 1. Core KPIs
    const totalStudents = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`).get() as { count: number };
    const totalTeachers = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND status = 'active'`).get() as { count: number };
    const activeCourses = db.prepare(`SELECT COUNT(*) as count FROM courses WHERE is_published = 1 AND is_archived = 0`).get() as { count: number };
    const upcomingSessions = db.prepare(`SELECT COUNT(*) as count FROM class_sessions WHERE status = 'scheduled'`).get() as { count: number };

    // 2. Enrollments Breakdown
    const enrollmentsCount = db.prepare(`SELECT COUNT(*) as count FROM enrollments`).get() as { count: number };
    const newRequests = db.prepare(`SELECT COUNT(*) as count FROM enrollments WHERE status = 'new' OR status = 'under_review'`).get() as { count: number };
    const confirmedEnrollments = db.prepare(`SELECT COUNT(*) as count FROM enrollments WHERE status = 'confirmed'`).get() as { count: number };

    // 3. Financial Totals
    const finance = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' OR status = 'partially_paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COUNT(*) as total_payments_count
      FROM payments
    `).get() as any;

    const outstandingBalances = db.prepare(`
      SELECT COALESCE(SUM(amount_due - amount_paid), 0) as total_balance_due
      FROM enrollments
      WHERE amount_due > amount_paid AND status != 'cancelled'
    `).get() as any;

    // 4. Enrollments by Language
    const enrollmentsByLanguage = db.prepare(`
      SELECT tl.name_fr as name, tl.flag_emoji, COUNT(e.id) as count, COALESCE(SUM(e.amount_paid), 0) as revenue
      FROM teaching_languages tl
      JOIN courses c ON c.language_id = tl.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY tl.id
      ORDER BY count DESC
    `).all();

    // 5. Course Popularity
    const coursePopularity = db.prepare(`
      SELECT c.title_fr as title, tl.name_fr as lang, COUNT(e.id) as enrollments_count, c.price,
             COALESCE(SUM(e.amount_paid), 0) as total_revenue
      FROM courses c
      JOIN teaching_languages tl ON tl.id = c.language_id
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id
      ORDER BY enrollments_count DESC
      LIMIT 6
    `).all();

    // 6. Teacher Workload
    const teacherWorkload = db.prepare(`
      SELECT u.name as teacher_name, u.avatar,
             COUNT(DISTINCT ct.course_id) as courses_count,
             COUNT(DISTINCT cs.id) as sessions_count
      FROM users u
      LEFT JOIN course_teachers ct ON ct.teacher_user_id = u.id
      LEFT JOIN class_sessions cs ON cs.teacher_id = u.id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY sessions_count DESC
    `).all();

    return NextResponse.json({
      kpis: {
        total_students: totalStudents.count,
        total_teachers: totalTeachers.count,
        active_courses: activeCourses.count,
        upcoming_sessions: upcomingSessions.count,
        total_enrollments: enrollmentsCount.count,
        new_requests: newRequests.count,
        confirmed_enrollments: confirmedEnrollments.count,
        total_revenue: finance.total_revenue,
        total_pending: finance.total_pending,
        total_balance_due: outstandingBalances.total_balance_due,
      },
      enrollments_by_language: enrollmentsByLanguage,
      course_popularity: coursePopularity,
      teacher_workload: teacherWorkload,
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json({ error: 'Erreur lors du calcul des rapports' }, { status: 500 });
  }
}
