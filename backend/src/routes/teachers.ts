import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';

export default async function teachersRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // GET teachers
  fastify.get('/', async (request, reply) => {
    const teachers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar, u.status,
        tp.bio_ar, tp.bio_fr, tp.qualifications_ar, tp.qualifications_fr,
        tp.specialties_ar, tp.specialties_fr, tp.languages_spoken,
        tp.hourly_rate, tp.weekly_availability
      FROM users u
      LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
      WHERE u.role = 'teacher' AND u.status = 'active'
      ORDER BY u.id ASC
    `).all() as any[];

    const getCourses = db.prepare(`
      SELECT c.id, c.title_fr, c.title_en, c.title_ar, c.level, tl.flag_emoji, tl.name_fr
      FROM course_teachers ct
      JOIN courses c ON c.id = ct.course_id
      JOIN teaching_languages tl ON tl.id = c.language_id
      WHERE ct.teacher_user_id = ? AND c.is_archived = 0
    `);

    for (const teacher of teachers) {
      teacher.courses = getCourses.all(teacher.id);
    }

    return reply.send({ teachers });
  });
}
