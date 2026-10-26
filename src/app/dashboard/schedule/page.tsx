'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Calendar,
  Clock,
  Plus,
  Video,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  ExternalLink,
} from 'lucide-react';

export default function ScheduleManagePage() {
  const { t, locale, dir } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New session modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/fas-si7-live');
  const [sessionType, setSessionType] = useState('group');
  const [error, setError] = useState('');
  const [conflictWarning, setConflictWarning] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Attendance modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const loadData = async () => {
    try {
      const [sRes, cRes, tRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/courses'),
        fetch('/api/teachers'),
      ]);
      const sData = await sRes.json();
      const cData = await cRes.json();
      const tData = await tRes.json();

      setSessions(sData.sessions || []);
      setCourses(cData.courses || []);
      setTeachers(tData.teachers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setCourseId(courses[0]?.id || '');
    setTeacherId(teachers[0]?.id || '');
    setTitleFr('Séance d\'immersion orale et débat');
    setTitleAr('حصة تفاعلية للمحادثة والنقاش');
    // Default to tomorrow 18:30 to 20:30
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setStartTime(`${dateStr}T18:30`);
    setEndTime(`${dateStr}T20:30`);
    setMeetingUrl('https://meet.google.com/fas-si7-live');
    setSessionType('group');
    setError('');
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setConflictWarning(null);

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: Number(courseId),
          teacher_id: Number(teacherId),
          title_fr: titleFr,
          title_ar: titleAr,
          start_time: startTime.replace('T', ' ') + ':00',
          end_time: endTime.replace('T', ' ') + ':00',
          meeting_url: meetingUrl,
          session_type: sessionType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        loadData();
      } else {
        if (res.status === 409) {
          setConflictWarning(data.conflict);
          setError(data.error);
        } else {
          setError(data.error || 'Erreur lors de la programmation');
        }
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const openAttendanceModal = async (session: any) => {
    setActiveSession(session);
    setAttendanceModalOpen(true);
    setLoadingAttendance(true);

    try {
      const res = await fetch(`/api/schedule/attendance?session_id=${session.id}`);
      const data = await res.json();
      setAttendanceRecords(data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleMarkAttendance = async (studentId: number, status: string) => {
    try {
      await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.id,
          student_id: studentId,
          status,
        }),
      });

      setAttendanceRecords((prev) =>
        prev.map((rec) =>
          rec.student_id === studentId ? { ...rec, attendance_status: status } : rec
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_schedule')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'الجدول الزمني للحصص، كشف تضارب المواعيد، وروابط غرف الفيديو وتسجيل الحضور'
              : 'Planning des séances, détection des conflits et gestion des présences'}
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary btn-sm">
          <Plus size={16} />
          <span>{locale === 'ar' ? 'برمجة حصة جديدة' : 'Programmer une séance'}</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الحصة والتاريخ' : 'Séance & Date'}</th>
                <th>{locale === 'ar' ? 'الدورة واللغة' : 'Formation'}</th>
                <th>{locale === 'ar' ? 'الأستاذ' : 'Formateur'}</th>
                <th>{locale === 'ar' ? 'غرفة اللقاء' : 'Lien Direct'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Statut'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'الحضور' : 'Présences'}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                        {locale === 'ar' ? s.title_ar : s.title_fr}
                      </p>
                      <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <Clock size={13} />
                        {s.start_time}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary" style={{ marginBottom: '0.2rem' }}>
                      {s.language_name_fr}
                    </span>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{locale === 'ar' ? s.course_title_ar : s.course_title_fr}</p>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.teacher_name}</span>
                  </td>
                  <td>
                    {s.meeting_url ? (
                      <a
                        href={s.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline btn-sm"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem', color: '#10B981' }}
                      >
                        <Video size={13} />
                        <span>Google Meet</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className={s.status === 'completed' ? 'badge badge-success' : 'badge badge-secondary'}>
                      {s.status === 'completed' ? (locale === 'ar' ? 'مكتملة' : 'Terminée') : (locale === 'ar' ? 'مجدولة' : 'Planifiée')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => openAttendanceModal(s)}
                      className="btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem' }}
                    >
                      <UserCheck size={14} color="var(--primary)" />
                      <span>{locale === 'ar' ? 'كشف الحضور' : 'Présences'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Session with CONFLICT DETECTION */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {locale === 'ar' ? 'برمجة حصة تعليمية جديدة' : 'Programmer une Séance'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSession}>
              <div className="modal-body">
                {/* Conflict Alert Warning */}
                {conflictWarning && (
                  <div
                    style={{
                      backgroundColor: 'var(--danger-light)',
                      border: '1.5px solid var(--danger)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                      color: 'var(--danger)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                      <AlertTriangle size={18} />
                      <span>{locale === 'ar' ? 'تحذير تضارب في جدول الأستاذ !' : 'Conflit d\'horaire détecté !'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>
                  </div>
                )}

                {error && !conflictWarning && (
                  <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الدورة' : 'Formation'} *</label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="form-select"
                      required
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.flag_emoji} {c.title_fr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الأستاذ المشرف' : 'Formateur'} *</label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="form-select"
                      required
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'عنوان الحصة بالفرنسية' : 'Titre de la séance'} *</label>
                  <input
                    type="text"
                    required
                    value={titleFr}
                    onChange={(e) => setTitleFr(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'وقت البداية' : 'Début'} *</label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'وقت النهاية' : 'Fin'} *</label>
                    <input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'رابط اللقاء (Google Meet / Zoom)' : 'Lien de la visioconférence'}</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    className="form-input"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? '...' : locale === 'ar' ? 'تأكيد وبرمجة' : 'Valider & Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Attendance Tracking */}
      {attendanceModalOpen && activeSession && (
        <div className="modal-overlay" onClick={() => setAttendanceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                  {locale === 'ar' ? 'تسجيل حضور الطلاب' : 'Feuille de Présence'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {activeSession.title_fr} • {activeSession.start_time}
                </p>
              </div>
              <button onClick={() => setAttendanceModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {loadingAttendance ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>{locale === 'ar' ? 'جاري التحميل...' : 'Chargement...'}</div>
              ) : attendanceRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  {locale === 'ar' ? 'لا يوجد طلاب مؤكدون في هذا الفوج حتى الآن.' : 'Aucun étudiant confirmé dans ce cours pour le moment.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {attendanceRecords.map((rec) => (
                    <div
                      key={rec.student_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.1rem',
                        backgroundColor: 'var(--bg-warm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                          {rec.student_name}
                        </p>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rec.student_email}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(rec.student_id, 'present')}
                          className={rec.attendance_status === 'present' ? 'badge badge-success' : 'btn-outline btn-sm'}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          {locale === 'ar' ? 'حاضر' : 'Présent'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(rec.student_id, 'absent')}
                          className={rec.attendance_status === 'absent' ? 'badge badge-danger' : 'btn-outline btn-sm'}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          {locale === 'ar' ? 'غائب' : 'Absent'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(rec.student_id, 'late')}
                          className={rec.attendance_status === 'late' ? 'badge badge-warning' : 'btn-outline btn-sm'}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          {locale === 'ar' ? 'متأخر' : 'Retard'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setAttendanceModalOpen(false)} className="btn-primary btn-sm">
                {locale === 'ar' ? 'إغلاق وحفظ' : 'Fermer & Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
