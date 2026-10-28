import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const languageId = searchParams.get('language_id');
    const level = searchParams.get('level');
    const format = searchParams.get('format');
    const search = searchParams.get('search');
    const publishedOnly = searchParams.get('published_only') === 'true';

    const db = getDb();
    let query = `
      SELECT c.*, 
        tl.name_ar as language_name_ar,
        tl.name_fr as language_name_fr,
        tl.name_en as language_name_en,
        tl.flag_emoji,
        tl.code as language_code,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrollments_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status IN ('accepted', 'awaiting_payment', 'confirmed')) as enrolled_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'confirmed') as confirmed_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'awaiting_payment') as awaiting_payment_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'under_review') as under_review_count,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM enrollments WHERE course_id = c.id) as total_revenue
      FROM courses c
      JOIN teaching_languages tl ON tl.id = c.language_id
      WHERE c.is_archived = 0
    `;

    const params: any[] = [];

    if (publishedOnly) {
      query += ` AND c.is_published = 1 AND tl.is_published = 1 `;
    }

    if (languageId && languageId !== 'all') {
      query += ` AND c.language_id = ? `;
      params.push(languageId);
    }

    if (level && level !== 'all') {
      query += ` AND c.level LIKE ? `;
      params.push(`%${level}%`);
    }

    if (format && format !== 'all') {
      query += ` AND c.format = ? `;
      params.push(format);
    }

    if (search) {
      query += ` AND (c.title_ar LIKE ? OR c.title_fr LIKE ? OR c.title_en LIKE ? OR c.description_ar LIKE ? OR c.description_fr LIKE ? OR c.description_en LIKE ?) `;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    query += ` GROUP BY c.id ORDER BY c.featured DESC, c.id DESC `;

    const courses = db.prepare(query).all(...params) as any[];

    // Fetch assigned teachers for each course
    const getTeachers = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.email 
      FROM course_teachers ct
      JOIN users u ON u.id = ct.teacher_user_id
      WHERE ct.course_id = ?
    `);

    for (const course of courses) {
      course.teachers = getTeachers.all(course.id);
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des cours' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const {
      language_id,
      title_ar,
      title_fr,
      title_en,
      slug,
      description_ar,
      description_fr,
      description_en,
      level,
      format,
      price,
      currency,
      duration_weeks,
      hours_total,
      max_capacity,
      prerequisites_ar,
      prerequisites_fr,
      prerequisites_en,
      objectives_ar,
      objectives_fr,
      objectives_en,
      schedule_info_ar,
      schedule_info_fr,
      schedule_info_en,
      featured,
      teacher_ids,
    } = body;

    if (!language_id || !title_ar || !title_fr || !slug || !price) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (langue, titres, slug, prix)' }, { status: 400 });
    }

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO courses (
        language_id, title_ar, title_fr, title_en, slug, description_ar, description_fr, description_en,
        level, format, price, currency, duration_weeks, hours_total, max_capacity,
        prerequisites_ar, prerequisites_fr, prerequisites_en, objectives_ar, objectives_fr, objectives_en,
        schedule_info_ar, schedule_info_fr, schedule_info_en, featured, is_published, is_archived
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `);

    const result = insert.run(
      language_id,
      title_ar,
      title_fr,
      title_en || title_fr,
      slug.toLowerCase().trim().replace(/\s+/g, '-'),
      description_ar || '',
      description_fr || '',
      description_en || description_fr || '',
      level || 'Tous Niveaux',
      format || 'group_online',
      price,
      currency || 'DZD',
      duration_weeks || 8,
      hours_total || 32,
      max_capacity || 12,
      prerequisites_ar || '',
      prerequisites_fr || '',
      prerequisites_en || prerequisites_fr || '',
      objectives_ar || '',
      objectives_fr || '',
      objectives_en || objectives_fr || '',
      schedule_info_ar || '',
      schedule_info_fr || '',
      schedule_info_en || schedule_info_fr || '',
      featured ? 1 : 0
    );

    const newCourseId = result.lastInsertRowid;

    // Assign teachers if provided
    if (teacher_ids && Array.isArray(teacher_ids)) {
      const assign = db.prepare('INSERT OR IGNORE INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
      for (const tId of teacher_ids) {
        assign.run(newCourseId, tId);
      }
    }

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'CREATE_COURSE', 'course', newCourseId, `Created course: ${title_fr}`);

    return NextResponse.json({ success: true, id: newCourseId });
  } catch (error: any) {
    console.error('Error creating course:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Ce slug de cours existe déjà' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création du cours' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { id, teacher_ids, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const db = getDb();
    
    // Update simple fields
    const updates: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(fields)) {
      if (key !== 'id') {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    // Update teacher assignments if given
    if (teacher_ids && Array.isArray(teacher_ids)) {
      db.prepare('DELETE FROM course_teachers WHERE course_id = ?').run(id);
      const assign = db.prepare('INSERT INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
      for (const tId of teacher_ids) {
        assign.run(id, tId);
      }
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'UPDATE_COURSE', 'course', id, `Updated course ID ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}
