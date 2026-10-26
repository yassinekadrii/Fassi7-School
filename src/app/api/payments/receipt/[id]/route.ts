import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'student']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { id } = await params;
    const db = getDb();

    const receipt = db.prepare(`
      SELECT p.*,
        u.name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        c.title_ar as course_title_ar,
        c.title_fr as course_title_fr,
        c.level as course_level,
        c.price as course_total_price,
        tl.name_fr as language_name_fr,
        tl.name_ar as language_name_ar,
        e.amount_due,
        e.amount_paid
      FROM payments p
      JOIN users u ON u.id = p.student_id
      LEFT JOIN courses c ON c.id = p.course_id
      LEFT JOIN teaching_languages tl ON tl.id = c.language_id
      LEFT JOIN enrollments e ON e.id = p.enrollment_id
      WHERE p.id = ? OR p.receipt_number = ?
    `).get(id, id) as any;

    if (!receipt) {
      return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 });
    }

    // Security check: students can only see their own receipts
    if (user?.role === 'student' && receipt.student_id !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé à ce reçu' }, { status: 403 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement du reçu' }, { status: 500 });
  }
}
