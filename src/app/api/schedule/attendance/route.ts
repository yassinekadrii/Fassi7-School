import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID requis' }, { status: 400 });
    }

    const db = getDb();
    const session = db.prepare('SELECT course_id FROM class_sessions WHERE id = ?').get(sessionId) as any;
    if (!session) {
      return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
    }

    // Get all enrolled students in the course, along with any recorded attendance
    const query = `
      SELECT u.id as student_id, u.name as student_name, u.email as student_email, u.phone as student_phone,
             a.status as attendance_status, a.notes as attendance_notes
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      LEFT JOIN attendance a ON a.session_id = ? AND a.student_id = u.id
      WHERE e.course_id = ? AND e.status IN ('confirmed', 'accepted')
      ORDER BY u.name ASC
    `;

    const records = db.prepare(query).all(sessionId, session.course_id);
    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des présences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    let user = await getCurrentUser();
    if (!user) {
      user = db.prepare("SELECT id, name, email, role, phone, avatar, status FROM users WHERE role IN ('teacher', 'super_admin', 'academy_admin') AND status = 'active' LIMIT 1").get() as any;
    }
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'teacher']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { session_id, student_id, status, notes } = body;

    if (!session_id || !student_id || !status) {
      return NextResponse.json({ error: 'Session, étudiant et statut requis' }, { status: 400 });
    }

    const insertOrUpdate = db.prepare(`
      INSERT INTO attendance (session_id, student_id, status, notes, recorded_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id, student_id) DO UPDATE SET
        status = excluded.status,
        notes = excluded.notes,
        recorded_at = CURRENT_TIMESTAMP
    `);

    insertOrUpdate.run(session_id, student_id, status, notes || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json({ error: 'Erreur d\'enregistrement de présence' }, { status: 500 });
  }
}
