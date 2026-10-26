import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { requireRole } from '../lib/auth.js';

export default async function paymentsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // GET payments
  fastify.get('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const queryParams = request.query as any;
    const paymentMethod = queryParams.method;
    const status = queryParams.status;

    let query = `
      SELECT pr.*,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        c.title_ar as course_title_ar,
        c.title_fr as course_title_fr,
        c.title_en as course_title_en,
        tl.name_fr as language_name_fr,
        tl.name_ar as language_name_ar,
        tl.name_en as language_name_en,
        admin.name as created_by_name
      FROM payment_receipts pr
      JOIN users u ON u.id = pr.student_id
      LEFT JOIN courses c ON c.id = pr.course_id
      LEFT JOIN teaching_languages tl ON tl.id = c.language_id
      LEFT JOIN users admin ON admin.id = pr.created_by_user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (paymentMethod && paymentMethod !== 'all') {
      query += ` AND pr.payment_method = ? `;
      params.push(paymentMethod);
    }

    if (status && status !== 'all') {
      query += ` AND pr.status = ? `;
      params.push(status);
    }

    query += ` ORDER BY pr.id DESC `;

    const receipts = db.prepare(query).all(...params);
    return reply.send({ receipts });
  });

  // GET receipt by ID
  fastify.get('/receipt/:id', async (request, reply) => {
    const { id } = request.params as any;

    const receipt = db.prepare(`
      SELECT pr.*,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        c.title_ar as course_title_ar,
        c.title_fr as course_title_fr,
        c.title_en as course_title_en,
        c.level as course_level,
        c.format as course_format,
        tl.name_fr as language_name_fr,
        tl.name_ar as language_name_ar,
        tl.name_en as language_name_en,
        admin.name as created_by_name
      FROM payment_receipts pr
      JOIN users u ON u.id = pr.student_id
      LEFT JOIN courses c ON c.id = pr.course_id
      LEFT JOIN teaching_languages tl ON tl.id = c.language_id
      LEFT JOIN users admin ON admin.id = pr.created_by_user_id
      WHERE pr.id = ?
    `).get(id) as any;

    if (!receipt) {
      return reply.status(404).send({ error: 'Reçu de paiement introuvable' });
    }

    return reply.send({ receipt });
  });

  // POST create payment & receipt
  fastify.post('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const body = request.body as any;

    const {
      enrollment_id,
      student_id,
      course_id,
      amount,
      payment_method,
      reference_number,
      notes,
    } = body;

    if (!amount || (!student_id && !enrollment_id)) {
      return reply.status(400).send({ error: 'Champs requis manquants (montant, étudiant/inscription)' });
    }

    let finalStudentId = student_id;
    let finalCourseId = course_id;

    if (enrollment_id) {
      const enrollment = db.prepare('SELECT student_id, course_id, amount_due, amount_paid FROM enrollments WHERE id = ?').get(enrollment_id) as any;
      if (enrollment) {
        finalStudentId = enrollment.student_id;
        finalCourseId = enrollment.course_id;

        const newPaid = (enrollment.amount_paid || 0) + Number(amount);
        const newStatus = newPaid >= enrollment.amount_due ? 'paid' : 'partially_paid';
        const enrollmentStatus = newPaid >= enrollment.amount_due ? 'confirmed' : 'awaiting_payment';

        db.prepare(`
          UPDATE enrollments 
          SET amount_paid = ?, payment_status = ?, status = ?
          WHERE id = ?
        `).run(newPaid, newStatus, enrollmentStatus, enrollment_id);
      }
    }

    const year = new Date().getFullYear();
    const countRes = db.prepare('SELECT COUNT(*) as count FROM payment_receipts').get() as { count: number };
    const seq = String((countRes?.count || 0) + 1).padStart(4, '0');
    const receiptNumber = `REC-${year}-${seq}`;

    const insertReceipt = db.prepare(`
      INSERT INTO payment_receipts (
        receipt_number, enrollment_id, student_id, course_id,
        amount, currency, payment_method, reference_number,
        status, notes, created_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, 'DZD', ?, ?, 'paid', ?, ?)
    `);

    const result = insertReceipt.run(
      receiptNumber,
      enrollment_id || null,
      finalStudentId,
      finalCourseId || null,
      Number(amount),
      payment_method || 'baridimob',
      reference_number || null,
      notes || null,
      user.id
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'RECORD_PAYMENT', 'payment_receipt', result.lastInsertRowid, `Recorded ${amount} DZD payment via ${payment_method} (${receiptNumber})`);

    return reply.send({
      success: true,
      receipt_id: result.lastInsertRowid,
      receipt_number: receiptNumber,
    });
  });
}
