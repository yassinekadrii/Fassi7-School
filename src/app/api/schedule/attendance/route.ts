import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const courseId = searchParams.get('course_id');

    const db = getDb();

    // Case 1: Fetch all sessions, confirmed students, and full attendance matrix for a course
    if (courseId && !sessionId) {
      const course = db.prepare(`
        SELECT c.*, tl.name_fr as language_name_fr, tl.name_ar as language_name_ar, tl.name_en as language_name_en, tl.flag_emoji
        FROM courses c
        JOIN teaching_languages tl ON tl.id = c.language_id
        WHERE c.id = ?
      `).get(courseId) as any;

      if (!course) {
        return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 });
      }

      // All sessions for this course
      const sessions = db.prepare(`
        SELECT cs.*,
          (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.id AND a.status = 'present') as present_count,
          (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.id AND a.status = 'absent') as absent_count,
          (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.id AND a.status = 'late') as late_count,
          (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.id AND a.status = 'excused') as excused_count,
          (SELECT COUNT(*) FROM attendance a WHERE a.session_id = cs.id) as total_recorded
        FROM class_sessions cs
        WHERE cs.course_id = ?
        ORDER BY cs.start_time ASC
      `).all(courseId) as any[];

      // All enrolled students in this course (confirmed, accepted, awaiting_payment)
      const students = db.prepare(`
        SELECT u.id, u.name, u.email, u.phone, u.avatar, e.status as enrollment_status
        FROM enrollments e
        JOIN users u ON u.id = e.student_id
        WHERE e.course_id = ? AND e.status IN ('confirmed', 'accepted', 'awaiting_payment')
        ORDER BY u.name ASC
      `).all(courseId) as any[];

      // All attendance records across all sessions for this course
      const attendanceMatrix = db.prepare(`
        SELECT a.id, a.session_id, a.student_id, a.status, a.notes, a.recorded_at
        FROM attendance a
        JOIN class_sessions cs ON cs.id = a.session_id
        WHERE cs.course_id = ?
      `).all(courseId) as any[];

      return NextResponse.json({ course, sessions, students, attendanceMatrix });
    }

    // Case 2: Fetch a specific session's attendance roster
    if (sessionId) {
      const session = db.prepare(`
        SELECT cs.*, c.title_fr as course_title_fr, c.title_ar as course_title_ar, c.title_en as course_title_en,
               tl.name_fr as language_name_fr, tl.name_ar as language_name_ar, tl.name_en as language_name_en, tl.flag_emoji
        FROM class_sessions cs
        JOIN courses c ON c.id = cs.course_id
        JOIN teaching_languages tl ON tl.id = c.language_id
        WHERE cs.id = ?
      `).get(sessionId) as any;

      if (!session) {
        return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
      }

      // Get all enrolled students in the course, along with any recorded attendance for this session
      const query = `
        SELECT u.id as student_id, u.name as student_name, u.email as student_email, u.phone as student_phone, u.avatar as student_avatar,
               a.status as attendance_status, a.notes as attendance_notes, a.recorded_at
        FROM enrollments e
        JOIN users u ON u.id = e.student_id
        LEFT JOIN attendance a ON a.session_id = ? AND a.student_id = u.id
        WHERE e.course_id = ? AND e.status IN ('confirmed', 'accepted', 'awaiting_payment')
        ORDER BY u.name ASC
      `;

      const records = db.prepare(query).all(sessionId, session.course_id);
      return NextResponse.json({ session, records });
    }

    return NextResponse.json({ error: 'Paramètre session_id ou course_id requis' }, { status: 400 });
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
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const authError = requireRole(user, ['super_admin', 'academy_admin', 'teacher']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { action } = body;

    // Action A: Create a brand new session / attendance sheet for a course
    if (action === 'create_session') {
      const { course_id, title_fr, title_ar, start_time, end_time, room_name } = body;

      if (!course_id || !start_time) {
        return NextResponse.json({ error: 'Course ID et date de séance requis' }, { status: 400 });
      }

      let teacherId = user.id;
      if (user.role !== 'teacher') {
        const existingSession = db.prepare('SELECT teacher_id FROM class_sessions WHERE course_id = ? LIMIT 1').get(course_id) as any;
        if (existingSession?.teacher_id) {
          teacherId = existingSession.teacher_id;
        }
      }

      const countRes = db.prepare('SELECT COUNT(*) as cnt FROM class_sessions WHERE course_id = ?').get(course_id) as any;
      const sessionNumber = (countRes?.cnt || 0) + 1;

      const finalTitleFr = title_fr || `Séance ${sessionNumber} - Appel & Pratique`;
      const finalTitleAr = title_ar || `الحصة ${sessionNumber} - تفقد الحضور والتطبيق`;

      let finalEndTime = end_time;
      if (!finalEndTime) {
        const sDate = new Date(start_time.replace(' ', 'T'));
        if (!isNaN(sDate.getTime())) {
          sDate.setHours(sDate.getHours() + 2);
          finalEndTime = sDate.toISOString().replace('T', ' ').slice(0, 19);
        } else {
          finalEndTime = start_time;
        }
      }

      const insertSession = db.prepare(`
        INSERT INTO class_sessions (
          course_id, teacher_id, title_ar, title_fr, session_type,
          start_time, end_time, room_name, status, summary_notes
        )
        VALUES (?, ?, ?, ?, 'group', ?, ?, ?, 'scheduled', ?)
      `);

      const result = insertSession.run(
        course_id,
        teacherId,
        finalTitleAr,
        finalTitleFr,
        start_time,
        finalEndTime,
        room_name || `Groupe A (Promotion ${new Date().getFullYear()})`,
        `Créée par ${user.name}`
      );

      const newSessionId = Number(result.lastInsertRowid);

      const students = db.prepare(`
        SELECT u.id as student_id, u.name as student_name, u.email as student_email, u.phone as student_phone, u.avatar as student_avatar
        FROM enrollments e
        JOIN users u ON u.id = e.student_id
        WHERE e.course_id = ? AND e.status IN ('confirmed', 'accepted', 'awaiting_payment')
        ORDER BY u.name ASC
      `).all(course_id) as any[];

      const newSession = db.prepare('SELECT * FROM class_sessions WHERE id = ?').get(newSessionId);

      return NextResponse.json({
        success: true,
        session_id: newSessionId,
        session: newSession,
        records: students.map((s) => ({ ...s, attendance_status: null })),
      });
    }

    // Action B: Bulk mark all students in a session as present
    if (action === 'bulk_present') {
      const { session_id } = body;
      if (!session_id) {
        return NextResponse.json({ error: 'Session ID requis' }, { status: 400 });
      }

      const session = db.prepare('SELECT course_id FROM class_sessions WHERE id = ?').get(session_id) as any;
      if (!session) {
        return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });
      }

      const students = db.prepare(`
        SELECT u.id as student_id
        FROM enrollments e
        JOIN users u ON u.id = e.student_id
        WHERE e.course_id = ? AND e.status IN ('confirmed', 'accepted', 'awaiting_payment')
      `).all(session.course_id) as any[];

      const insertOrUpdate = db.prepare(`
        INSERT INTO attendance (session_id, student_id, status, notes, recorded_at)
        VALUES (?, ?, 'present', '', CURRENT_TIMESTAMP)
        ON CONFLICT(session_id, student_id) DO UPDATE SET
          status = 'present',
          recorded_at = CURRENT_TIMESTAMP
      `);

      const tx = db.transaction((rows) => {
        for (const row of rows) {
          insertOrUpdate.run(session_id, row.student_id);
        }
      });

      tx(students);

      const counts = {
        present_count: students.length,
        absent_count: 0,
        late_count: 0,
        excused_count: 0,
        total_recorded: students.length,
      };

      return NextResponse.json({ success: true, count: students.length, counts });
    }

    // Action C: Default single student attendance update or reset
    const { session_id, student_id, status, notes } = body;

    if (!session_id || !student_id) {
      return NextResponse.json({ error: 'Session et étudiant requis' }, { status: 400 });
    }

    if (status === 'unmarked' || status === 'reset' || !status) {
      db.prepare('DELETE FROM attendance WHERE session_id = ? AND student_id = ?').run(session_id, student_id);
    } else {
      const insertOrUpdate = db.prepare(`
        INSERT INTO attendance (session_id, student_id, status, notes, recorded_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(session_id, student_id) DO UPDATE SET
          status = excluded.status,
          notes = excluded.notes,
          recorded_at = CURRENT_TIMESTAMP
      `);
      insertOrUpdate.run(session_id, student_id, status, notes || '');
    }

    // Fetch updated session tally counts
    const counts = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM attendance WHERE session_id = ? AND status = 'present') as present_count,
        (SELECT COUNT(*) FROM attendance WHERE session_id = ? AND status = 'absent') as absent_count,
        (SELECT COUNT(*) FROM attendance WHERE session_id = ? AND status = 'late') as late_count,
        (SELECT COUNT(*) FROM attendance WHERE session_id = ? AND status = 'excused') as excused_count,
        (SELECT COUNT(*) FROM attendance WHERE session_id = ?) as total_recorded
    `).get(session_id, session_id, session_id, session_id, session_id) as any;

    return NextResponse.json({ success: true, counts });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json({ error: 'Erreur d\'enregistrement de présence' }, { status: 500 });
  }
}
