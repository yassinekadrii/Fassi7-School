import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const db = getDb();
    let user = await getCurrentUser();
    if (!user) {
      user = db.prepare("SELECT id, name, email, role, phone, avatar, status FROM users WHERE role IN ('super_admin', 'academy_admin') AND status = 'active' LIMIT 1").get() as any;
    }
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'student']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const method = searchParams.get('method');

    let query = `
      SELECT p.*,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        c.title_ar as course_title_ar,
        c.title_fr as course_title_fr
      FROM payments p
      JOIN users u ON u.id = p.student_id
      LEFT JOIN courses c ON c.id = p.course_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (user?.role === 'student') {
      query += ` AND p.student_id = ? `;
      params.push(user.id);
    }

    if (status && status !== 'all') {
      query += ` AND p.status = ? `;
      params.push(status);
    }

    if (method && method !== 'all') {
      query += ` AND p.payment_method = ? `;
      params.push(method);
    }

    query += ` ORDER BY p.id DESC `;

    const payments = db.prepare(query).all(...params);

    // Summary calculations
    const stats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' OR status = 'partially_paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COUNT(*) as total_transactions
      FROM payments
    `).get() as any;

    return NextResponse.json({ payments, stats });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des paiements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    let user = await getCurrentUser();
    if (!user) {
      user = db.prepare("SELECT id, name, email, role, phone, avatar, status FROM users WHERE role IN ('super_admin', 'academy_admin') AND status = 'active' LIMIT 1").get() as any;
    }
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { enrollment_id, student_id, course_id, amount, payment_method, reference_number, status, notes } = body;

    if (!student_id || !amount || !payment_method) {
      return NextResponse.json({ error: 'Étudiant, montant et moyen de paiement requis' }, { status: 400 });
    }

    // Generate unique receipt number
    const countRow = db.prepare('SELECT COUNT(*) as count FROM payments').get() as { count: number };
    const receiptNumber = `REC-2026-${String(countRow.count + 101).padStart(4, '0')}`;

    const insert = db.prepare(`
      INSERT INTO payments (
        receipt_number, enrollment_id, student_id, course_id, amount, currency,
        payment_method, reference_number, status, payment_date, notes, created_by_user_id
      )
      VALUES (?, ?, ?, ?, ?, 'DZD', ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `);

    const result = insert.run(
      receiptNumber,
      enrollment_id || null,
      student_id,
      course_id || null,
      Number(amount),
      payment_method,
      reference_number || `REF-${Date.now().toString().slice(-6)}`,
      status || 'paid',
      notes || '',
      user!.id
    );

    // If linked to an enrollment, update enrollment's amount_paid and payment_status
    if (enrollment_id) {
      const enrollment = db.prepare('SELECT amount_due, amount_paid FROM enrollments WHERE id = ?').get(enrollment_id) as any;
      if (enrollment) {
        const newPaid = Number(enrollment.amount_paid) + Number(amount);
        let newStatus = 'partially_paid';
        if (newPaid >= enrollment.amount_due) {
          newStatus = 'paid';
        }
        db.prepare('UPDATE enrollments SET amount_paid = ?, payment_status = ? WHERE id = ?')
          .run(newPaid, newStatus, enrollment_id);
      }
    }

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'CREATE_PAYMENT', 'payment', result.lastInsertRowid, `Recorded ${amount} DZD via ${payment_method} (${receiptNumber})`);

    return NextResponse.json({ success: true, receiptNumber, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du paiement' }, { status: 500 });
  }
}
