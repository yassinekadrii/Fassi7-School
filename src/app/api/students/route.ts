import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'teacher']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const db = getDb();
    const query = `
      SELECT u.id, u.name, u.email, u.phone, u.avatar, u.status, u.created_at,
             sp.birth_date, sp.city, sp.native_language, sp.learning_goals, sp.admin_notes,
             COALESCE(SUM(e.amount_due), 0) as total_due,
             COALESCE(SUM(e.amount_paid), 0) as total_paid
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN enrollments e ON e.student_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.id DESC
    `;
    const students = db.prepare(query).all() as any[];

    // Fetch enrollments for each student
    const getEnrollments = db.prepare(`
      SELECT e.id, e.status, e.payment_status, e.amount_due, e.amount_paid, e.enrolled_at,
             c.title_ar, c.title_fr, tl.name_fr as language_name
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      JOIN teaching_languages tl ON tl.id = c.language_id
      WHERE e.student_id = ?
    `);

    for (const s of students) {
      s.enrollments = getEnrollments.all(s.id);
      s.balance = s.total_due - s.total_paid;
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Erreur de chargement des étudiants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { name, email, phone, city, native_language, learning_goals, admin_notes, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nom et email obligatoires' }, { status: 400 });
    }

    const db = getDb();
    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync(password || 'student123', salt);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar, status)
      VALUES (?, ?, ?, 'student', ?, '/avatars/student-default.jpg', 'active')
    `);

    const result = insert.run(name, email, passHash, phone || '');
    const newStudentId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO student_profiles (user_id, city, native_language, learning_goals, admin_notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(newStudentId, city || 'Alger', native_language || 'Arabe', learning_goals || '', admin_notes || '');

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'CREATE_STUDENT', 'user', newStudentId, `Created student account for ${name}`);

    return NextResponse.json({ success: true, id: newStudentId });
  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Cet email est déjà enregistré' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création de l\'étudiant' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { id, name, email, phone, city, native_language, learning_goals, admin_notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status)
      WHERE id = ? AND role = 'student'
    `).run(name, email, phone, status, id);

    db.prepare(`
      INSERT INTO student_profiles (user_id, city, native_language, learning_goals, admin_notes)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        city = COALESCE(excluded.city, city),
        native_language = COALESCE(excluded.native_language, native_language),
        learning_goals = COALESCE(excluded.learning_goals, learning_goals),
        admin_notes = COALESCE(excluded.admin_notes, admin_notes)
    `).run(id, city, native_language, learning_goals, admin_notes);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'UPDATE_STUDENT', 'user', id, `Updated student ID ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}
