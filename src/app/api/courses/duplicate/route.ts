import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { course_id } = await request.json();
    if (!course_id) {
      return NextResponse.json({ error: 'ID du cours requis' }, { status: 400 });
    }

    const db = getDb();
    const original = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id) as any;
    if (!original) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newSlug = `${original.slug}-copie-${randomSuffix}`;
    const newTitleFr = `${original.title_fr} (Copie)`;
    const newTitleAr = `${original.title_ar} (نسخة)`;
    const newTitleEn = original.title_en ? `${original.title_en} (Copy)` : `${original.title_fr} (Copy)`;

    const insert = db.prepare(`
      INSERT INTO courses (
        language_id, title_ar, title_fr, title_en, slug, description_ar, description_fr, description_en,
        level, format, price, currency, duration_weeks, hours_total, max_capacity,
        prerequisites_ar, prerequisites_fr, prerequisites_en, objectives_ar, objectives_fr, objectives_en,
        schedule_info_ar, schedule_info_fr, schedule_info_en, featured, is_published, is_archived
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `);

    const result = insert.run(
      original.language_id,
      newTitleAr,
      newTitleFr,
      newTitleEn,
      newSlug,
      original.description_ar,
      original.description_fr,
      original.description_en || original.description_fr || '',
      original.level,
      original.format,
      original.price,
      original.currency,
      original.duration_weeks,
      original.hours_total,
      original.max_capacity,
      original.prerequisites_ar,
      original.prerequisites_fr,
      original.prerequisites_en || original.prerequisites_fr || '',
      original.objectives_ar,
      original.objectives_fr,
      original.objectives_en || original.objectives_fr || '',
      original.schedule_info_ar,
      original.schedule_info_fr,
      original.schedule_info_en || original.schedule_info_fr || '',
      0 // Not featured by default
    );

    const newId = result.lastInsertRowid;

    // Copy teacher assignments
    const teachers = db.prepare('SELECT teacher_user_id FROM course_teachers WHERE course_id = ?').all(course_id) as { teacher_user_id: number }[];
    const assign = db.prepare('INSERT INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
    for (const t of teachers) {
      assign.run(newId, t.teacher_user_id);
    }

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'DUPLICATE_COURSE', 'course', newId, `Duplicated course from ID ${course_id} to ${newId}`);

    return NextResponse.json({ success: true, newCourseId: newId });
  } catch (error) {
    console.error('Error duplicating course:', error);
    return NextResponse.json({ error: 'Erreur lors de la duplication' }, { status: 500 });
  }
}
