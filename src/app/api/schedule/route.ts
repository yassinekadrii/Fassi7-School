import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const courseId = searchParams.get('course_id');
    const status = searchParams.get('status');

    const db = getDb();
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
        COUNT(DISTINCT a.id) as attendance_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = cs.course_id AND status IN ('confirmed', 'accepted')) as enrolled_students_count
      FROM class_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN users u ON u.id = cs.teacher_id
      JOIN teaching_languages tl ON tl.id = c.language_id
      LEFT JOIN attendance a ON a.session_id = cs.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter by role if user is teacher or student
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

    const sessions = db.prepare(query).all(...params) as any[];

    // Attach confirmed enrolled students for each session
    const getEnrolled = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      WHERE e.course_id = ? AND e.status IN ('confirmed', 'accepted')
      ORDER BY u.name ASC
    `);

    for (const session of sessions) {
      session.enrolled_students = getEnrolled.all(session.course_id);
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement de l\'emploi du temps' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'teacher']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    let { course_id, teacher_id, title_ar, title_fr, session_type, start_time, end_time, meeting_url, room_name, summary_notes, status } = body;

    if (user?.role === 'teacher') {
      teacher_id = user.id;
    }

    if (!course_id || !teacher_id || !start_time || !end_time) {
      return NextResponse.json({ error: 'Cours, enseignant, heure de début et fin requis' }, { status: 400 });
    }

    const db = getDb();

    // 1. Conflict Detection: check if teacher is booked at an overlapping time
    const conflictQuery = `
      SELECT cs.id, cs.title_fr, cs.start_time, cs.end_time
      FROM class_sessions cs
      WHERE cs.teacher_id = ?
        AND cs.status != 'cancelled'
        AND (
          (cs.start_time < ? AND cs.end_time > ?) OR
          (cs.start_time >= ? AND cs.start_time < ?)
        )
      LIMIT 1
    `;

    const conflict = db.prepare(conflictQuery).get(teacher_id, end_time, start_time, start_time, end_time) as any;
    if (conflict) {
      return NextResponse.json({
        error: `Conflit d'horaire ! L'enseignant a déjà une séance prévue (${conflict.title_fr}) entre ${conflict.start_time} et ${conflict.end_time}.`,
        conflict,
      }, { status: 409 });
    }

    const insert = db.prepare(`
      INSERT INTO class_sessions (
        course_id, teacher_id, title_ar, title_fr, session_type,
        start_time, end_time, meeting_url, room_name, status, summary_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `);

    // Ensure placeholders match: 10 parameters
    const insertExact = db.prepare(`
      INSERT INTO class_sessions (
        course_id, teacher_id, title_ar, title_fr, session_type,
        start_time, end_time, meeting_url, room_name, status, summary_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `);

    const result = insertExact.run(
      course_id,
      teacher_id,
      title_ar || 'حصة تعليمية تفاعلية',
      title_fr || 'Séance de cours interactif',
      session_type || 'group',
      start_time,
      end_time,
      meeting_url || 'https://meet.google.com/fas-si7-live',
      room_name || 'Salle Virtuelle Fassi7',
      summary_notes || ''
    );

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'CREATE_SESSION', 'class_session', result.lastInsertRowid, `Scheduled session: ${title_fr} with teacher ID ${teacher_id}`);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Erreur lors de la programmation de la séance' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'teacher']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { id, status, summary_notes, meeting_url, start_time, end_time, room_name, title_fr, title_ar } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const db = getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (room_name !== undefined) {
      updates.push('room_name = ?');
      values.push(room_name);
    }
    if (title_fr) {
      updates.push('title_fr = ?');
      values.push(title_fr);
    }
    if (title_ar) {
      updates.push('title_ar = ?');
      values.push(title_ar);
    }
    if (summary_notes !== undefined) {
      updates.push('summary_notes = ?');
      values.push(summary_notes);
    }
    if (meeting_url) {
      updates.push('meeting_url = ?');
      values.push(meeting_url);
    }
    if (start_time && end_time) {
      updates.push('start_time = ?', 'end_time = ?');
      values.push(start_time, end_time);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE class_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 });
  }
}
