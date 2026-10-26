import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { requireRole } from '../lib/auth.js';

export default async function reportsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // Admin only
  fastify.get('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    // 1. Total revenue
    const revenueRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_revenue, COUNT(*) as total_payments
      FROM payment_receipts
      WHERE status = 'paid'
    `).get() as any;

    // 2. Total active students
    const studentsRow = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as active_students
      FROM enrollments
      WHERE status IN ('accepted', 'confirmed')
    `).get() as any;

    // 3. Total active enrollments
    const enrollmentsRow = db.prepare(`
      SELECT COUNT(*) as active_enrollments
      FROM enrollments
      WHERE status NOT IN ('cancelled', 'completed')
    `).get() as any;

    // 4. Revenue by language
    const languageStats = db.prepare(`
      SELECT 
        tl.name_fr,
        tl.name_ar,
        tl.name_en,
        tl.flag_emoji,
        COUNT(DISTINCT e.id) as enrollments_count,
        COALESCE(SUM(pr.amount), 0) as total_revenue
      FROM teaching_languages tl
      LEFT JOIN courses c ON c.language_id = tl.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN payment_receipts pr ON pr.course_id = c.id AND pr.status = 'paid'
      WHERE tl.is_published = 1
      GROUP BY tl.id
      ORDER BY total_revenue DESC
    `).all();

    // 5. Recent enrollments
    const recentEnrollments = db.prepare(`
      SELECT e.id, e.status, e.payment_status, e.created_at,
        u.name as student_name,
        c.title_fr as course_title_fr,
        c.title_en as course_title_en,
        c.title_ar as course_title_ar
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      ORDER BY e.id DESC
      LIMIT 5
    `).all();

    return reply.send({
      overview: {
        total_revenue: revenueRow.total_revenue,
        total_payments: revenueRow.total_payments,
        active_students: studentsRow.active_students,
        active_enrollments: enrollmentsRow.active_enrollments,
      },
      language_stats: languageStats,
      recent_enrollments: recentEnrollments,
    });
  });
}
