'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Calendar,
  Clock,
  Plus,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Users,
  MessageCircle,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function ScheduleManagePage() {
  const { t, locale, dir } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all');

  // New session modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [roomName, setRoomName] = useState('Groupe A (Promotion Automne)');
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
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

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
    setRoomName('Groupe A - Promotion Active');
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
          room_name: roomName,
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

  const handleUpdateStatus = async (sessionId: number, newStatus: string) => {
    try {
      await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          status: newStatus,
        }),
      });

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openAttendanceModal = async (session: any) => {
    setActiveSession(session);
    setAttendanceModalOpen(true);
    setLoadingAttendance(true);
    setAttendanceSuccessMsg('');

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

      setAttendanceSuccessMsg(
        locale === 'ar' ? 'تم تسجيل الحضور' : locale === 'en' ? 'Attendance recorded' : 'Présence enregistrée'
      );
      setTimeout(() => setAttendanceSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!activeSession || attendanceRecords.length === 0) return;
    try {
      await Promise.all(
        attendanceRecords.map((rec) =>
          fetch('/api/schedule/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: activeSession.id,
              student_id: rec.student_id,
              status: 'present',
            }),
          })
        )
      );

      setAttendanceRecords((prev) =>
        prev.map((rec) => ({ ...rec, attendance_status: 'present' }))
      );

      setAttendanceSuccessMsg(
        locale === 'ar' ? 'تم تأكيد حضور الجميع' : locale === 'en' ? 'All marked present' : 'Tous les étudiants marqués présents'
      );
      setTimeout(() => setAttendanceSuccessMsg(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSessions = useMemo(() => {
    if (statusFilter === 'all') return sessions;
    if (statusFilter === 'completed') return sessions.filter((s) => s.status === 'completed');
    if (statusFilter === 'active') return sessions.filter((s) => s.status === 'active' || s.status === 'in_progress');
    if (statusFilter === 'scheduled') return sessions.filter((s) => s.status === 'scheduled');
    return sessions;
  }, [sessions, statusFilter]);

  const presentCount = attendanceRecords.filter((r) => r.attendance_status === 'present').length;
  const absentCount = attendanceRecords.filter((r) => r.attendance_status === 'absent').length;
  const lateCount = attendanceRecords.filter((r) => r.attendance_status === 'late').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_schedule')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'إدارة الأفواج المتتالية، جدول الحصص، وتتبع حضور الطلاب المؤكدين'
              : locale === 'en'
              ? 'Cohort management, session schedules, and student attendance tracking'
              : 'Gestion des cohortes successives, planning des séances et suivi des présences'}
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary btn-sm" style={{ gap: '0.4rem' }}>
          <Plus size={16} />
          <span>{locale === 'ar' ? 'إطلاق فوج / برمجة حصة' : locale === 'en' ? 'Launch Cohort / Schedule Session' : 'Lancer une Cohorte / Programmer'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '14px',
          border: '1px solid #EADBCE',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Filter size={16} color="#FA461D" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3D1B0D', marginRight: '0.25rem' }}>
            {locale === 'ar' ? 'تصفية الأفواج:' : locale === 'en' ? 'Filter Cohorts:' : 'Filtrer les cohortes :'}
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: statusFilter === 'all' ? '#FA461D' : '#F7F3EE',
              color: statusFilter === 'all' ? '#FFFFFF' : '#6A564A',
            }}
          >
            {locale === 'ar' ? `الكل (${sessions.length})` : locale === 'en' ? `All (${sessions.length})` : `Tous (${sessions.length})`}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: statusFilter === 'active' ? '#2E7D32' : '#F7F3EE',
              color: statusFilter === 'active' ? '#FFFFFF' : '#6A564A',
            }}
          >
            🟢 {locale === 'ar' ? 'الأفواج الجارية' : locale === 'en' ? 'In Progress' : 'En cours'}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('scheduled')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: statusFilter === 'scheduled' ? '#0284C7' : '#F7F3EE',
              color: statusFilter === 'scheduled' ? '#FFFFFF' : '#6A564A',
            }}
          >
            🔵 {locale === 'ar' ? 'المجدولة' : locale === 'en' ? 'Scheduled' : 'Planifiées'}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: statusFilter === 'completed' ? '#6B7280' : '#F7F3EE',
              color: statusFilter === 'completed' ? '#FFFFFF' : '#6A564A',
            }}
          >
            🎓 {locale === 'ar' ? 'المكتملة / المتخرجة' : locale === 'en' ? 'Completed' : 'Terminées'}
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#8C6F5A' }}>
          {locale === 'ar'
            ? 'تأكيد تسجيل الطالب ينقله آلياً لقائمة أستاذ الدورة'
            : locale === 'en'
            ? 'Confirming a student automatically syncs them to the teacher roll call'
            : 'La confirmation d\'un étudiant le synchronise directement avec le formateur'}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الفوج والحصة' : locale === 'en' ? 'Cohort & Session' : 'Cohorte & Séance'}</th>
                <th>{locale === 'ar' ? 'تاريخ وتوقيت الانعقاد' : locale === 'en' ? 'Date & Timing' : 'Date & Horaires'}</th>
                <th>{locale === 'ar' ? 'الدورة واللغة' : locale === 'en' ? 'Course & Language' : 'Formation'}</th>
                <th>{locale === 'ar' ? 'الأستاذ المشرف' : locale === 'en' ? 'Faculty Lead' : 'Formateur'}</th>
                <th>{locale === 'ar' ? 'الطلاب المؤكدون' : locale === 'en' ? 'Enrolled Students' : 'Étudiants'}</th>
                <th>{locale === 'ar' ? 'حالة الفوج' : locale === 'en' ? 'Cohort Status' : 'Statut'}</th>
                <th style={{ textAlign: 'right' }}>{locale === 'ar' ? 'الإجراءات' : locale === 'en' ? 'Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'لا توجد حصص في هذه الفئة' : locale === 'en' ? 'No sessions scheduled in this filter' : 'Aucune séance trouvée dans cette catégorie'}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const enrolledCount = s.enrolled_students_count ?? (s.enrolled_students ? s.enrolled_students.length : 0);
                  const isCompleted = s.status === 'completed';

                  return (
                    <tr key={s.id} style={{ opacity: isCompleted ? 0.75 : 1 }}>
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                backgroundColor: '#E0F2FE',
                                color: '#0369A1',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                              }}
                            >
                              🏷️ {s.room_name || 'Groupe A'}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                            {locale === 'ar' ? (s.title_ar || s.title_fr) : locale === 'en' ? (s.title_en || s.title_fr) : s.title_fr}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--dark-brown)', display: 'block' }}>
                            📅 {s.start_time ? s.start_time.split(' ')[0] : 'Date'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                            <Clock size={12} />
                            {s.start_time ? s.start_time.split(' ')[1]?.slice(0, 5) : ''} → {s.end_time ? s.end_time.split(' ')[1]?.slice(0, 5) : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ marginBottom: '0.2rem' }}>
                          {s.language_name_fr}
                        </span>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>
                          {locale === 'ar' ? s.course_title_ar : locale === 'en' ? (s.course_title_en || s.course_title_fr) : s.course_title_fr}
                        </p>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#3D1B0D' }}>{s.teacher_name}</span>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: '#8C6F5A' }}>{s.teacher_email}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '8px',
                            backgroundColor: enrolledCount > 0 ? '#ECFDF5' : '#FFF7ED',
                            color: enrolledCount > 0 ? '#065F46' : '#C2410C',
                          }}
                        >
                          <Users size={13} />
                          {enrolledCount} {locale === 'ar' ? 'مؤكد' : locale === 'en' ? 'confirmed' : 'confirmé(s)'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={s.status || 'scheduled'}
                          onChange={(e) => handleUpdateStatus(s.id, e.target.value)}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.6rem',
                            borderRadius: '8px',
                            border: '1px solid #D1D5DB',
                            backgroundColor:
                              s.status === 'completed'
                                ? '#F3F4F6'
                                : s.status === 'active'
                                ? '#ECFDF5'
                                : '#EFF6FF',
                            color:
                              s.status === 'completed'
                                ? '#4B5563'
                                : s.status === 'active'
                                ? '#065F46'
                                : '#1E40AF',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="scheduled">{locale === 'ar' ? 'مجدولة / قادمة' : locale === 'en' ? 'Scheduled / Upcoming' : 'Planifiée / À venir'}</option>
                          <option value="active">{locale === 'ar' ? 'جارية حالياً' : locale === 'en' ? 'Live / Active' : 'En cours / Actif'}</option>
                          <option value="completed">{locale === 'ar' ? 'مكتملة ومختتمة' : locale === 'en' ? 'Completed / Closed' : 'Terminée / Clôturée'}</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => openAttendanceModal(s)}
                          className="btn-outline btn-sm"
                          style={{ gap: '0.35rem', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                        >
                          <UserCheck size={14} />
                          <span>{locale === 'ar' ? 'حضور الفوج' : locale === 'en' ? 'Roll Call' : 'Présences'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Session / Launch Cohort with CONFLICT DETECTION */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900 }}>
                  {locale === 'ar' ? 'إطلاق فوج جديد وبرمجة حصة' : locale === 'en' ? 'Launch New Cohort / Session' : 'Lancer une Nouvelle Cohorte / Séance'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {locale === 'ar'
                    ? 'حدد اسم الفوج ومواعيد الانعقاد والأستاذ المسؤول'
                    : locale === 'en'
                    ? 'Define cohort name, class timings, target course and faculty lead'
                    : 'Définissez le nom du groupe, la formation et l\'enseignant responsable'}
                </p>
              </div>
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
                      <span>{locale === 'ar' ? 'تحذير تضارب في جدول الأستاذ !' : locale === 'en' ? 'Faculty Schedule Conflict Detected!' : 'Conflit d\'horaire détecté !'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>
                  </div>
                )}

                {error && !conflictWarning && (
                  <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                {/* Cohort / Group Name */}
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'اسم الفوج / المجموعة' : locale === 'en' ? 'Cohort / Group Name' : 'Nom de la Cohorte / Groupe'} *</label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Groupe A (Octobre 2026), Groupe B (Cours du Soir)..."
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {locale === 'ar'
                      ? 'عند انتهاء فوج معين، يمكن إنشاء فوج جديد لتدريس طلاب الدفعة القادمة'
                      : locale === 'en'
                      ? 'Allows launching subsequent cohorts once a student cycle is completed'
                      : 'Permet de gérer les roulements successifs lorsque les étudiants finissent leur cycle'}
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الدورة' : locale === 'en' ? 'Course' : 'Formation'} *</label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="form-select"
                      required
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.flag_emoji} {locale === 'ar' ? c.title_ar : locale === 'en' ? (c.title_en || c.title_fr) : c.title_fr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الأستاذ المشرف' : locale === 'en' ? 'Faculty Lead' : 'Formateur'} *</label>
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
                  <label className="form-label">{locale === 'ar' ? 'عنوان الحصة' : locale === 'en' ? 'Session Title' : 'Titre de la séance'} *</label>
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
                    <label className="form-label">{locale === 'ar' ? 'وقت البداية' : locale === 'en' ? 'Start Time' : 'Début'} *</label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'وقت النهاية' : locale === 'en' ? 'End Time' : 'Fin'} *</label>
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
                  <label className="form-label">{locale === 'ar' ? 'رابط القاعة الافتراضية' : locale === 'en' ? 'Virtual Meeting Link' : 'Lien visioconférence'}</label>
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
                  {submitting ? '...' : locale === 'ar' ? 'تأكيد وإطلاق الفوج' : locale === 'en' ? 'Confirm & Launch Cohort' : 'Valider & Lancer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Attendance Tracking */}
      {attendanceModalOpen && activeSession && (
        <div className="modal-overlay" onClick={() => setAttendanceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span className="badge badge-primary">{activeSession.language_name_fr}</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                    🏷️ {activeSession.room_name || 'Groupe A'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900 }}>
                  {locale === 'ar' ? 'سجل حضور وغياب الطلاب' : locale === 'en' ? 'Student Attendance Sheet' : 'Feuille de Présence des Étudiants'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {activeSession.title_fr} • 📅 {activeSession.start_time}
                </p>
              </div>
              <button onClick={() => setAttendanceModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Attendance quick bar */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                backgroundColor: '#FFF9F4',
                borderBottom: '1px solid #EADBCE',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 800 }}>
                <span style={{ color: '#2E7D32' }}>✓ {locale === 'ar' ? 'حاضرون' : locale === 'en' ? 'Present' : 'Présents'} : {presentCount}</span>
                <span style={{ color: '#C62828' }}>✕ {locale === 'ar' ? 'غائبون' : locale === 'en' ? 'Absent' : 'Absents'} : {absentCount}</span>
                <span style={{ color: '#D97706' }}>⏳ {locale === 'ar' ? 'متأخرون' : locale === 'en' ? 'Late' : 'Retards'} : {lateCount}</span>
              </div>

              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={attendanceRecords.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.8rem',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <Check size={14} />
                <span>{locale === 'ar' ? 'تأكيد حضور الجميع' : locale === 'en' ? 'Mark All Present' : 'Tout marquer Présent'}</span>
              </button>
            </div>

            {attendanceSuccessMsg && (
              <div style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '0.6rem 1.5rem', fontSize: '0.82rem', fontWeight: 700 }}>
                {attendanceSuccessMsg}
              </div>
            )}

            <div className="modal-body">
              {loadingAttendance ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>{locale === 'ar' ? 'جاري التحميل...' : locale === 'en' ? 'Loading roll call...' : 'Chargement...'}</div>
              ) : attendanceRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {locale === 'ar' ? 'لا يوجد طلاب مؤكدون في هذا الكورس حالياً.' : locale === 'en' ? 'No confirmed students in this course yet.' : 'Aucun étudiant confirmé dans ce cours.'}
                  </p>
                  <small>
                    {locale === 'ar'
                      ? 'قم بتأكيد تسجيل الطالب من قسم «الطلاب» وسيظهر هنا تلقائياً'
                      : locale === 'en'
                      ? 'Confirm student registrations from the Students section to display them here'
                      : 'Validez les inscriptions depuis la section Étudiants pour les faire apparaître ici'}
                  </small>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {attendanceRecords.map((rec) => {
                    const cleanPhone = rec.student_phone ? rec.student_phone.replace(/[^0-9]/g, '') : '';
                    return (
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
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                              {rec.student_name}
                            </p>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  padding: '0.1rem 0.4rem',
                                  backgroundColor: '#25D366',
                                  color: '#FFFFFF',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                }}
                              >
                                <MessageCircle size={10} />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {rec.student_email} {rec.student_phone && `• ${rec.student_phone}`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'present')}
                            className={rec.attendance_status === 'present' ? 'badge badge-success' : 'btn-outline btn-sm'}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            ✓ {locale === 'ar' ? 'حاضر' : locale === 'en' ? 'Present' : 'Présent'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'late')}
                            className={rec.attendance_status === 'late' ? 'badge badge-warning' : 'btn-outline btn-sm'}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            ⏳ {locale === 'ar' ? 'متأخر' : locale === 'en' ? 'Late' : 'Retard'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'excused')}
                            className={rec.attendance_status === 'excused' ? 'badge badge-primary' : 'btn-outline btn-sm'}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            ℹ️ {locale === 'ar' ? 'معذور' : locale === 'en' ? 'Excused' : 'Excusé'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'absent')}
                            className={rec.attendance_status === 'absent' ? 'badge badge-danger' : 'btn-outline btn-sm'}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            ✕ {locale === 'ar' ? 'غائب' : locale === 'en' ? 'Absent' : 'Absent'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setAttendanceModalOpen(false)} className="btn-primary btn-sm">
                {locale === 'ar' ? 'إغلاق وحفظ' : locale === 'en' ? 'Close & Save' : 'Fermer & Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
