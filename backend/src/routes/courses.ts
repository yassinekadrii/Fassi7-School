import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { requireRole } from '../lib/auth.js';

export default async function coursesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // GET courses
  fastify.get('/', async (request, reply) => {
    const queryParams = request.query as any;
    const languageId = queryParams.language_id;
    const level = queryParams.level;
    const format = queryParams.format;
    const search = queryParams.search;
    const publishedOnly = queryParams.published_only === 'true';

    let query = `
      SELECT c.*, 
        tl.name_ar as language_name_ar,
        tl.name_fr as language_name_fr,
        tl.name_en as language_name_en,
        tl.flag_emoji,
        tl.code as language_code,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      JOIN teaching_languages tl ON tl.id = c.language_id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status IN ('accepted', 'awaiting_payment', 'confirmed')
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

    const getTeachers = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.email 
      FROM course_teachers ct
      JOIN users u ON u.id = ct.teacher_user_id
      WHERE ct.course_id = ?
    `);

    for (const course of courses) {
      course.teachers = getTeachers.all(course.id);
    }

    return reply.send({ courses });
  });

  // POST create course
  fastify.post('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const body = request.body as any;

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
      return reply.status(400).send({ error: 'Champs obligatoires manquants (langue, titres, slug, prix)' });
    }

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

    if (teacher_ids && Array.isArray(teacher_ids)) {
      const assign = db.prepare('INSERT OR IGNORE INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
      for (const tId of teacher_ids) {
        assign.run(newCourseId, tId);
      }
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'CREATE_COURSE', 'course', newCourseId, `Created course: ${title_fr}`);

    return reply.send({ success: true, id: newCourseId });
  });

  // POST duplicate course
  fastify.post('/duplicate', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const { course_id } = request.body as any;

    if (!course_id) {
      return reply.status(400).send({ error: 'ID du cours requis' });
    }

    const original = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id) as any;
    if (!original) {
      return reply.status(404).send({ error: 'Cours introuvable' });
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
      0
    );

    const newId = result.lastInsertRowid;

    const teachers = db.prepare('SELECT teacher_user_id FROM course_teachers WHERE course_id = ?').all(course_id) as { teacher_user_id: number }[];
    const assign = db.prepare('INSERT INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
    for (const t of teachers) {
      assign.run(newId, t.teacher_user_id);
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'DUPLICATE_COURSE', 'course', newId, `Duplicated course ID ${course_id} to new course ID ${newId}`);

    return reply.send({ success: true, new_course_id: newId, slug: newSlug });
  });

  // PUT update course
  fastify.put('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const body = request.body as any;
    const { id, teacher_ids, ...fields } = body;

    if (!id) {
      return reply.status(400).send({ error: 'ID requis' });
    }

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

    if (teacher_ids && Array.isArray(teacher_ids)) {
      db.prepare('DELETE FROM course_teachers WHERE course_id = ?').run(id);
      const assign = db.prepare('INSERT INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
      for (const tId of teacher_ids) {
        assign.run(id, tId);
      }
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'UPDATE_COURSE', 'course', id, `Updated course ID ${id}`);

    return reply.send({ success: true });
  });
}
