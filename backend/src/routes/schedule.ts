import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { getCurrentUser, requireRole } from '../lib/auth.js';

export default async function scheduleRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // GET class sessions
  fastify.get('/', async (request, reply) => {
    const user = await getCurrentUser(request);
    const queryParams = request.query as any;
    const teacherId = queryParams.teacher_id;
    const courseId = queryParams.course_id;
    const status = queryParams.status;

    let query = `
      SELECT cs.*,
        c.title_ar as course_title_ar,
        c.title_fr as course_title_fr,
        c.title_en as course_title_en,
        c.level as course_level,
        u.name as teacher_name,
        u.email as teacher_email,
        tl.name_fr as language_name_fr,
        tl.name_ar as language_name_ar,
        tl.name_en as language_name_en,
        COUNT(DISTINCT a.id) as attendance_count
      FROM class_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN users u ON u.id = cs.teacher_id
      JOIN teaching_languages tl ON tl.id = c.language_id
      LEFT JOIN attendance a ON a.session_id = cs.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (user?.role === 'teacher') {
      query += ` AND cs.teacher_id = ? `;
      params.push(user.id);
    } else if (user?.role === 'student') {
      query += ` AND cs.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ? AND status = 'confirmed') `;
      params.push(user.id);
    }

    if (teacherId && teacherId !== 'all') {
      query += ` AND cs.teacher_id = ? `;
      params.push(teacherId);
    }

    if (courseId && courseId !== 'all') {
      query += ` AND cs.course_id = ? `;
      params.push(courseId);
    }

    if (status && status !== 'all') {
      query += ` AND cs.status = ? `;
      params.push(status);
    }

    query += ` GROUP BY cs.id ORDER BY cs.start_time ASC `;

    const sessions = db.prepare(query).all(...params);
    return reply.send({ sessions });
  });

  // POST create session (Admin only)
  fastify.post('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const body = request.body as any;
    const { course_id, teacher_id, title_ar, title_fr, session_date, start_time, end_time, meeting_link, session_notes } = body;

    if (!course_id || !teacher_id || !session_date || !start_time || !end_time) {
      return reply.status(400).send({ error: 'Champs requis manquants' });
    }

    const startDateTime = `${session_date} ${start_time}:00`;
    const endDateTime = `${session_date} ${end_time}:00`;

    const insert = db.prepare(`
      INSERT INTO class_sessions (
        course_id, teacher_id, title_ar, title_fr,
        start_time, end_time, meeting_link, session_notes, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `);

    const result = insert.run(
      course_id,
      teacher_id,
      title_ar || 'حصة تدريبية',
      title_fr || 'Séance de cours',
      startDateTime,
      endDateTime,
      meeting_link || 'https://meet.google.com/new',
      session_notes || null
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'CREATE_SESSION', 'class_session', result.lastInsertRowid, `Scheduled session for course ${course_id}`);

    return reply.send({ success: true, id: result.lastInsertRowid });
  });

  // GET attendance for a session
  fastify.get('/attendance', async (request, reply) => {
    const { session_id } = request.query as any;
    if (!session_id) {
      return reply.status(400).send({ error: 'Session ID requis' });
    }

    const session = db.prepare('SELECT course_id FROM class_sessions WHERE id = ?').get(session_id) as any;
    if (!session) {
      return reply.status(404).send({ error: 'Séance introuvable' });
    }

    const students = db.prepare(`
      SELECT u.id as student_id, u.name as student_name, u.email as student_email,
        COALESCE(a.status, 'present') as attendance_status,
        a.notes as attendance_notes
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      LEFT JOIN attendance a ON a.student_id = u.id AND a.session_id = ?
      WHERE e.course_id = ? AND e.status IN ('accepted', 'confirmed')
    `).all(session_id, session.course_id);

    return reply.send({ students });
  });

  // POST save attendance
  fastify.post('/attendance', { preHandler: [requireRole(['super_admin', 'academy_admin', 'teacher'])] }, async (request, reply) => {
    const { session_id, records } = request.body as any;

    if (!session_id || !Array.isArray(records)) {
      return reply.status(400).send({ error: 'Données d\'assiduité incomplètes' });
    }

    const upsert = db.prepare(`
      INSERT INTO attendance (session_id, student_id, status, notes)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(session_id, student_id) 
      DO UPDATE SET status = excluded.status, notes = excluded.notes
    `);

    for (const r of records) {
      upsert.run(session_id, r.student_id, r.status || 'present', r.notes || null);
    }

    db.prepare('UPDATE class_sessions SET status = "completed" WHERE id = ?').run(session_id);

    return reply.send({ success: true, count: records.length });
  });
}
