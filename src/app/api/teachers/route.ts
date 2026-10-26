import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const db = getDb();
    const query = `
      SELECT u.id, u.name, u.email, u.phone, u.avatar, u.status,
             tp.bio_ar, tp.bio_fr, tp.qualifications_ar, tp.qualifications_fr,
             tp.specialties_ar, tp.specialties_fr, tp.languages_spoken,
             tp.weekly_availability, tp.hourly_rate
      FROM users u
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      WHERE u.role = 'teacher' AND u.status != 'suspended'
      ORDER BY u.id ASC
    `;
    const teachers = db.prepare(query).all() as any[];

    // Attach courses
    const getCourses = db.prepare(`
      SELECT c.id, c.title_ar, c.title_fr, tl.name_fr as lang_name
      FROM course_teachers ct
      JOIN courses c ON c.id = ct.course_id
      JOIN teaching_languages tl ON tl.id = c.language_id
      WHERE ct.teacher_user_id = ?
    `);

    for (const t of teachers) {
      t.courses = getCourses.all(t.id);
    }

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Erreur de chargement des enseignants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { name, email, password, phone, bio_ar, bio_fr, qualifications_ar, qualifications_fr, specialties_ar, specialties_fr, languages_spoken, hourly_rate } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nom et email obligatoires' }, { status: 400 });
    }

    const db = getDb();
    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync(password || 'teacher123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar, status)
      VALUES (?, ?, ?, 'teacher', ?, '/avatars/teacher-default.jpg', 'active')
    `);

    const result = insertUser.run(name, email, passHash, phone || '');
    const newUserId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO teacher_profiles (user_id, bio_ar, bio_fr, qualifications_ar, qualifications_fr, specialties_ar, specialties_fr, languages_spoken, hourly_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newUserId,
      bio_ar || '',
      bio_fr || '',
      qualifications_ar || '',
      qualifications_fr || '',
      specialties_ar || '',
      specialties_fr || '',
      languages_spoken || '',
      hourly_rate || 2500
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'CREATE_TEACHER', 'user', newUserId, `Added teacher: ${name}`);

    return NextResponse.json({ success: true, id: newUserId });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { id, name, email, phone, bio_ar, bio_fr, qualifications_ar, qualifications_fr, specialties_ar, specialties_fr, languages_spoken, hourly_rate, status } = body;

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
      WHERE id = ? AND role = 'teacher'
    `).run(name, email, phone, status, id);

    db.prepare(`
      INSERT INTO teacher_profiles (user_id, bio_ar, bio_fr, qualifications_ar, qualifications_fr, specialties_ar, specialties_fr, languages_spoken, hourly_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        bio_ar = COALESCE(excluded.bio_ar, bio_ar),
        bio_fr = COALESCE(excluded.bio_fr, bio_fr),
        qualifications_ar = COALESCE(excluded.qualifications_ar, qualifications_ar),
        qualifications_fr = COALESCE(excluded.qualifications_fr, qualifications_fr),
        specialties_ar = COALESCE(excluded.specialties_ar, specialties_ar),
        specialties_fr = COALESCE(excluded.specialties_fr, specialties_fr),
        languages_spoken = COALESCE(excluded.languages_spoken, languages_spoken),
        hourly_rate = COALESCE(excluded.hourly_rate, hourly_rate)
    `).run(id, bio_ar, bio_fr, qualifications_ar, qualifications_fr, specialties_ar, specialties_fr, languages_spoken, hourly_rate);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'UPDATE_TEACHER', 'user', id, `Updated teacher ID ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}
