import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { getCurrentUser, requireRole } from '../lib/auth.js';

export default async function enrollmentsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // GET enrollments (Admin only)
  fastify.get('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const queryParams = request.query as any;
    const status = queryParams.status;
    const courseId = queryParams.course_id;

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
    return reply.send({ enrollments });
  });

  // POST create enrollment (Public & Admin)
  fastify.post('/', async (request, reply) => {
    const body = request.body as any;
    const { course_id, student_name, student_email, student_phone, notes, preferred_schedule } = body;

    if (!course_id || !student_name || !student_email || !student_phone) {
      return reply.status(400).send({ error: 'Informations requises manquantes' });
    }

    const course = db.prepare('SELECT id, price, max_capacity, title_fr FROM courses WHERE id = ?').get(course_id) as any;
    if (!course) {
      return reply.status(404).send({ error: 'Formation introuvable' });
    }

    let student = db.prepare('SELECT id FROM users WHERE email = ?').get(student_email.toLowerCase().trim()) as any;
    if (!student) {
      const insertUser = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, status)
        VALUES (?, ?, 'DISABLED_NO_LOGIN_ACCOUNT', 'student', ?, 'active')
      `);
      const userRes = insertUser.run(student_name.trim(), student_email.toLowerCase().trim(), student_phone.trim());
      student = { id: userRes.lastInsertRowid };

      db.prepare(`
        INSERT INTO student_profiles (user_id, learning_goals, admin_notes)
        VALUES (?, ?, ?)
      `).run(student.id, preferred_schedule ? `Horaire souhaité: ${preferred_schedule}` : '', notes || '');
    }

    const existing = db.prepare(`
      SELECT id FROM enrollments 
      WHERE student_id = ? AND course_id = ? AND status NOT IN ('cancelled', 'completed')
    `).get(student.id, course_id);

    if (existing) {
      return reply.status(409).send({ error: 'Vous êtes déjà inscrit à cette session de formation' });
    }

    const insertEnrollment = db.prepare(`
      INSERT INTO enrollments (
        student_id, course_id, status, payment_status,
        amount_due, amount_paid, notes
      )
      VALUES (?, ?, 'new', 'pending', ?, 0, ?)
    `);

    const result = insertEnrollment.run(student.id, course_id, course.price, notes || preferred_schedule ? `[Horaire: ${preferred_schedule}] ${notes || ''}` : '');

    return reply.send({
      success: true,
      enrollment_id: result.lastInsertRowid,
      message: 'Demande d\'inscription enregistrée avec succès. Notre équipe vous contactera.',
    });
  });

  // PUT update enrollment status (Admin only)
  fastify.put('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const body = request.body as any;
    const { id, status, payment_status, notes } = body;

    if (!id) {
      return reply.status(400).send({ error: 'ID requis' });
    }

    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id) as any;
    if (!enrollment) {
      return reply.status(404).send({ error: 'Inscription introuvable' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (payment_status) {
      updates.push('payment_status = ?');
      values.push(payment_status);
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
      .run(user.id, 'UPDATE_ENROLLMENT', 'enrollment', id, `Updated enrollment ID ${id}: status=${status || enrollment.status}`);

    return reply.send({ success: true });
  });
}
