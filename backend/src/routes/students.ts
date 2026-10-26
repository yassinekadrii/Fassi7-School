import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { requireRole } from '../lib/auth.js';

export default async function studentsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // Admin only
  fastify.get('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const queryParams = request.query as any;
    const search = queryParams.search;

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.avatar, u.status, u.created_at,
        sp.city, sp.learning_goals, sp.admin_notes,
        COUNT(DISTINCT e.id) as total_enrollments,
        COALESCE(SUM(e.amount_paid), 0) as total_paid
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN enrollments e ON e.student_id = u.id
      WHERE u.role = 'student'
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR sp.city LIKE ?) `;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ` GROUP BY u.id ORDER BY u.id DESC `;

    const students = db.prepare(query).all(...params) as any[];

    const getEnrollments = db.prepare(`
      SELECT e.id, e.status, e.payment_status, c.title_fr, c.title_en, c.title_ar, tl.flag_emoji
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      JOIN teaching_languages tl ON tl.id = c.language_id
      WHERE e.student_id = ?
    `);

    for (const student of students) {
      student.courses = getEnrollments.all(student.id);
    }

    return reply.send({ students });
  });
}
