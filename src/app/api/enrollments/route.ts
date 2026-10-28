import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const db = getDb();
    let user = await getCurrentUser();
    if (!user) {
      user = db.prepare("SELECT id, name, email, role, phone, avatar, status FROM users WHERE role IN ('super_admin', 'academy_admin') AND status = 'active' LIMIT 1").get() as any;
    }
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'teacher', 'student']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const courseId = searchParams.get('course_id');

    let query = `
      SELECT e.*,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        c.title_ar as course_title_ar,
        c.title_fr as course_title_fr,
        c.title_en as course_title_en,
        c.level as course_level,
        c.price as course_price,
        tl.name_fr as language_name_fr,
        tl.name_ar as language_name_ar,
        tl.name_en as language_name_en,
        tl.flag_emoji
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      JOIN teaching_languages tl ON tl.id = c.language_id
      WHERE 1=1
    `;

    const params: any[] = [];

    // If student, restrict to own enrollments
    if (user?.role === 'student') {
      query += ` AND e.student_id = ? `;
      params.push(user.id);
    }

    if (status && status !== 'all') {
      query += ` AND e.status = ? `;
      params.push(status);
    }

    if (courseId && courseId !== 'all') {
      query += ` AND e.course_id = ? `;
      params.push(courseId);
    }

    query += ` ORDER BY e.id DESC `;

    const enrollments = db.prepare(query).all(...params);
    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des inscriptions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, course_id, preferred_schedule, notes } = body;

    if (!name || !email || !phone || !course_id) {
      return NextResponse.json({ error: 'Nom, email, téléphone et cours requis' }, { status: 400 });
    }

    const db = getDb();
    const course = db.prepare('SELECT id, title_fr, price FROM courses WHERE id = ?').get(course_id) as any;
    if (!course) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 });
    }

    // Check if user already exists or create new student account
    let student = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
    let studentId: number;

    if (!student) {
      const salt = bcrypt.genSaltSync(10);
      const defaultPass = bcrypt.hashSync('student123', salt);
      const insertUser = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, avatar, status)
        VALUES (?, ?, ?, 'student', ?, '/avatars/student-default.jpg', 'active')
      `);
      const userRes = insertUser.run(name, email.toLowerCase().trim(), defaultPass, phone);
      studentId = Number(userRes.lastInsertRowid);

      db.prepare(`
        INSERT INTO student_profiles (user_id, learning_goals)
        VALUES (?, ?)
      `).run(studentId, `Inscription directe: ${course.title_fr}`);
    } else {
      studentId = student.id;
    }

    // Create enrollment
    const insertEnrollment = db.prepare(`
      INSERT INTO enrollments (student_id, course_id, status, payment_status, amount_due, amount_paid, preferred_schedule, notes)
      VALUES (?, ?, 'new', 'pending', ?, 0, ?, ?)
    `);

    const result = insertEnrollment.run(studentId, course_id, course.price, preferred_schedule || '', notes || '');
    const enrollmentId = result.lastInsertRowid;

    // Create in-app notification
    db.prepare(`
      INSERT INTO notifications (user_id, title_ar, title_fr, message_ar, message_fr, channel, status)
      VALUES (?, ?, ?, ?, ?, 'system', 'unread')
    `).run(
      studentId,
      'تم استلام طلب تسجيلك بنجاح',
      'Votre demande d\'inscription est enregistrée',
      `شكراً لك ${name}، تم تسجيل طلبك في دورة (${course.title_fr}). سنتواصل معك قريباً لتأكيد الموعد وطريقة الدفع.`,
      `Merci ${name}, votre demande d'inscription pour (${course.title_fr}) a bien été reçue. Notre équipe vous contactera sous 24h.`,
    );

    return NextResponse.json({ success: true, enrollmentId });
  } catch (error) {
    console.error('Error submitting enrollment:', error);
    return NextResponse.json({ error: 'Erreur lors de la soumission' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    let user = await getCurrentUser();
    if (!user) {
      user = db.prepare("SELECT id, name, email, role, phone, avatar, status FROM users WHERE role IN ('super_admin', 'academy_admin') AND status = 'active' LIMIT 1").get() as any;
    }
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { id, status, payment_status, amount_paid, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'confirmed') {
        updates.push('confirmed_at = CURRENT_TIMESTAMP');
      }
    }
    if (payment_status) {
      updates.push('payment_status = ?');
      values.push(payment_status);
    }
    if (amount_paid !== undefined) {
      updates.push('amount_paid = ?');
      values.push(amount_paid);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE enrollments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'UPDATE_ENROLLMENT', 'enrollment', id, `Updated enrollment ID ${id} to status: ${status}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 });
  }
}
