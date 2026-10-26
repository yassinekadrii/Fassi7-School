import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { requireRole } from '../lib/auth.js';

export default async function inquiriesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // GET inquiries (Admin only)
  fastify.get('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const queryParams = request.query as any;
    const status = queryParams.status;

    let query = `
      SELECT ci.*,
        c.title_ar as course_title_ar,
        c.title_fr as course_title_fr,
        c.title_en as course_title_en
      FROM contact_inquiries ci
      LEFT JOIN courses c ON c.id = ci.course_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (status && status !== 'all') {
      query += ` AND ci.status = ? `;
      params.push(status);
    }

    query += ` ORDER BY ci.id DESC `;

    const inquiries = db.prepare(query).all(...params);
    return reply.send({ inquiries });
  });

  // POST create inquiry (Public)
  fastify.post('/', async (request, reply) => {
    const body = request.body as any;
    const { full_name, email, phone, preferred_language, course_id, subject, message } = body;

    if (!full_name || !email || !phone || !message) {
      return reply.status(400).send({ error: 'Champs obligatoires manquants' });
    }

    const insert = db.prepare(`
      INSERT INTO contact_inquiries (
        full_name, email, phone, preferred_language, course_id, subject, message, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    `);

    const result = insert.run(
      full_name.trim(),
      email.toLowerCase().trim(),
      phone.trim(),
      preferred_language || 'fr',
      course_id || null,
      subject || 'Demande d\'information générale',
      message.trim()
    );

    return reply.send({
      success: true,
      id: result.lastInsertRowid,
      message: 'Votre message a été transmis avec succès. Notre équipe vous répondra rapidement.',
    });
  });

  // PUT update inquiry status (Admin only)
  fastify.put('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const { id, status, admin_reply_notes } = request.body as any;

    if (!id) {
      return reply.status(400).send({ error: 'ID requis' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (admin_reply_notes !== undefined) {
      updates.push('admin_reply_notes = ?');
      values.push(admin_reply_notes);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE contact_inquiries SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return reply.send({ success: true });
  });
}
