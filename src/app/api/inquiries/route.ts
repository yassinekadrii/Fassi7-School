import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const db = getDb();
    const inquiries = db.prepare(`
      SELECT ci.*, c.title_fr as course_title_fr
      FROM contact_inquiries ci
      LEFT JOIN courses c ON c.id = ci.course_id
      ORDER BY ci.id DESC
    `).all();

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des demandes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, phone, preferred_language, course_id, subject, message } = body;

    if (!full_name || !email || !phone || !message) {
      return NextResponse.json({ error: 'Nom, email, téléphone et message requis' }, { status: 400 });
    }

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO contact_inquiries (full_name, email, phone, preferred_language, course_id, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP)
    `);

    const result = insert.run(
      full_name,
      email,
      phone,
      preferred_language || '',
      course_id || null,
      subject || 'Demande d\'information générale',
      message
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du message' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { id, status, admin_reply_notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE contact_inquiries 
      SET status = COALESCE(?, status),
          admin_reply_notes = COALESCE(?, admin_reply_notes)
      WHERE id = ?
    `).run(status, admin_reply_notes, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 });
  }
}
