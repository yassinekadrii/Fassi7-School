'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  UserCheck,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Users,
  Check,
  Plus,
  Sparkles,
  ClipboardList,
  History,
  TrendingUp,
} from 'lucide-react';

export default function TeacherPortalPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();

  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Multi-Session Attendance Hub Modal
  const [hubModalOpen, setHubModalOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [courseSessions, setCourseSessions] = useState<any[]>([]);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [activeSessionRecords, setActiveSessionRecords] = useState<any[]>([]);
  const [loadingHub, setLoadingHub] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  // Mode inside modal: 'roster' | 'new_session' | 'stats'
  const [hubView, setHubView] = useState<'roster' | 'new_session' | 'stats'>('roster');

  // New Session Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionRoom, setNewSessionRoom] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  const loadTeacherData = async () => {
    try {
      const [schedRes, coursesRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/courses'),
      ]);

      const schedData = await schedRes.json();
      const coursesData = await coursesRes.json();

      const allSessions = schedData.sessions || [];
      const allCourses = coursesData.courses || [];

      if (user && user.role === 'teacher') {
        const mineSessions = allSessions.filter((s: any) => s.teacher_id === user.id);
        setSessions(mineSessions.length > 0 ? mineSessions : allSessions);

        // Filter courses or attach sessions count to courses
        setCourses(allCourses);
      } else {
        setSessions(allSessions);
        setCourses(allCourses);
      }
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/admin-portal');
      } else if (user.role === 'student') {
        router.push('/portal/student');
      } else {
        loadTeacherData();
      }
    }
  }, [user, loading, router]);

  // Open the Course Multi-Session Attendance Hub
  const openCourseAttendanceHub = async (course: any, targetSessionId?: number) => {
    setActiveCourse(course);
    setHubModalOpen(true);
    setLoadingHub(true);
    setHubView('roster');
    setAttendanceSuccessMsg('');

    try {
      const res = await fetch(`/api/schedule/attendance?course_id=${course.id}`);
      const data = await res.json();

      const sessList = data.sessions || [];
      const studList = data.students || [];

      setCourseSessions(sessList);
      setCourseStudents(studList);

      if (sessList.length > 0) {
        const targetId = targetSessionId || sessList[sessList.length - 1].id;
        setSelectedSessionId(targetId);
        await loadSessionRoster(targetId);
      } else {
        // No sessions exist yet for this course, prepare to create the first one
        setSelectedSessionId(null);
        setActiveSessionRecords([]);
        openNewSessionForm(course, 1);
      }
    } catch (err) {
      console.error('Error loading course attendance hub:', err);
    } finally {
      setLoadingHub(false);
    }
  };

  // Load roster for a specific session
  const loadSessionRoster = async (sessionId: number) => {
    try {
      setSelectedSessionId(sessionId);
      setHubView('roster');
      const res = await fetch(`/api/schedule/attendance?session_id=${sessionId}`);
      const data = await res.json();
      setActiveSessionRecords(data.records || []);
    } catch (err) {
      console.error('Error loading session roster:', err);
    }
  };

  // Open New Session Creation Form
  const openNewSessionForm = (course?: any, nextNumber?: number) => {
    const c = course || activeCourse;
    const num = nextNumber || courseSessions.length + 1;

    setNewSessionTitle(
      locale === 'ar'
        ? `الحصة ${num} - تطبيق ومحادثة`
        : `Séance ${num} - Appel & Pratique`
    );

    // Default to current date and time formatted for datetime-local
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setNewSessionDate(`${year}-${month}-${day}T${hours}:${minutes}`);

    setNewSessionRoom(
      c?.room_name || `Groupe A (Promotion ${new Date().getFullYear()})`
    );

    setHubView('new_session');
  };

  // Submit New Session / Attendance Sheet
  const handleCreateNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;

    setCreatingSession(true);
    setAttendanceSuccessMsg('');

    try {
      const startTimeStr = newSessionDate.replace('T', ' ') + ':00';

      const res = await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          course_id: activeCourse.id,
          title_fr: newSessionTitle,
          title_ar: newSessionTitle,
          start_time: startTimeStr,
          room_name: newSessionRoom,
        }),
      });

      const data = await res.json();

      if (res.ok && data.session_id) {
        // Refresh sessions list
        const updatedCourseRes = await fetch(`/api/schedule/attendance?course_id=${activeCourse.id}`);
        const updatedCourseData = await updatedCourseRes.json();
        setCourseSessions(updatedCourseData.sessions || []);

        // Load the new session's roster
        await loadSessionRoster(data.session_id);

        setAttendanceSuccessMsg(
          locale === 'ar'
            ? 'تم إنشاء قائمة الحضور الجديدة بنجاح! يمكنك الآن تسجيل حضور الطلاب.'
            : 'Nouvelle liste d\'appel créée avec succès ! Vous pouvez maintenant faire l\'appel.'
        );
        setTimeout(() => setAttendanceSuccessMsg(''), 4000);

        // Also refresh global sessions
        loadTeacherData();
      } else {
        alert(data.error || 'Erreur lors de la création de la séance');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau');
    } finally {
      setCreatingSession(false);
    }
  };

  // Mark single student attendance
  const handleMarkAttendance = async (studentId: number, status: string) => {
    if (!selectedSessionId) return;

    try {
      await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSessionId,
          student_id: studentId,
          status,
        }),
      });

      setActiveSessionRecords((prev) =>
        prev.map((rec) =>
          rec.student_id === studentId ? { ...rec, attendance_status: status } : rec
        )
      );

      // Update local session tally
      setCourseSessions((prev) =>
        prev.map((s) => {
          if (s.id === selectedSessionId) {
            return {
              ...s,
              present_count: status === 'present' ? (s.present_count || 0) + 1 : s.present_count,
            };
          }
          return s;
        })
      );

      setAttendanceSuccessMsg(
        locale === 'ar' ? 'تم تسجيل الحضور' : 'Présence enregistrée'
      );
      setTimeout(() => setAttendanceSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all students present in one click
  const handleMarkAllPresent = async () => {
    if (!selectedSessionId || activeSessionRecords.length === 0) return;
    setSavingAttendance(true);

    try {
      const res = await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_present',
          session_id: selectedSessionId,
        }),
      });

      if (res.ok) {
        setActiveSessionRecords((prev) =>
          prev.map((rec) => ({ ...rec, attendance_status: 'present' }))
        );

        setAttendanceSuccessMsg(
          locale === 'ar'
            ? 'تم تأكيد حضور جميع طلاب الفوج لهذه الحصة !'
            : 'Tous les étudiants ont été marqués présents pour cette séance !'
        );
        setTimeout(() => setAttendanceSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Active session details
  const activeSession = courseSessions.find((s) => s.id === selectedSessionId);

  // Present/Absent counts for active session
  const presentCount = activeSessionRecords.filter((r) => r.attendance_status === 'present').length;
  const absentCount = activeSessionRecords.filter((r) => r.attendance_status === 'absent').length;
  const lateCount = activeSessionRecords.filter((r) => r.attendance_status === 'late').length;
  const excusedCount = activeSessionRecords.filter((r) => r.attendance_status === 'excused').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FDFBF7' }}>
      <Navbar />

      {/* Header Banner */}
      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EADBCE', padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #FA461D 0%, #FFAD17 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  boxShadow: '0 8px 24px rgba(250, 70, 29, 0.25)',
                }}
              >
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PR'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '999px',
                      backgroundColor: '#FFF2EE',
                      color: '#FA461D',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}
                  >
                    <GraduationCap size={14} />
                    {locale === 'ar' ? 'فضاء الأستاذ المعتمد' : 'Portail Enseignant Certifié'}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '999px',
                      backgroundColor: '#E8F5E9',
                      color: '#2E7D32',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {locale === 'ar' ? 'نظام الحضور المتعدد' : 'Gestion continue des présences'}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, color: '#3D1B0D' }}>
                  {locale === 'ar' ? `مرحباً بك أستاذ، ${user?.name}` : `Bienvenue, Pr. ${user?.name}`}
                </h1>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', color: '#7A6258' }}>
                  {user?.email} • {locale === 'ar' ? 'تسجيل الحضور المستمر لكل حصة طيلة فترة التكوين' : 'Appel et suivi des présences séance par séance tout au long du cursus'}
                </p>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  backgroundColor: '#FFF9F4',
                  border: '1px solid #F3DFD1',
                  borderRadius: '14px',
                  padding: '0.85rem 1.3rem',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 700, display: 'block' }}>
                  {locale === 'ar' ? 'التخصصات والدورات' : 'Formations'}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FA461D' }}>
                  {courses.length}
                </span>
              </div>
              <div
                style={{
                  backgroundColor: '#FFF9F4',
                  border: '1px solid #F3DFD1',
                  borderRadius: '14px',
                  padding: '0.85rem 1.3rem',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 700, display: 'block' }}>
                  {locale === 'ar' ? 'إجمالي الحصص المنجزة' : 'Séances d\'Appel'}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2E7D32' }}>
                  {sessions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: '3rem 0', flex: 1 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2.5rem' }}>
            {/* Left: My Courses & Cohorts with Multi-Session Presence Launcher */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ClipboardList size={24} color="#FA461D" />
                  <h2 style={{ fontSize: '1.45rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                    {locale === 'ar' ? 'الدورات والأفواج المسندة إليّ (سجل الحضور)' : 'Mes Formations & Feuilles de Présence'}
                  </h2>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#8C6F5A', fontWeight: 600 }}>
                  {locale === 'ar'
                    ? 'انقر على الدورة لإضافة قائمة حضور جديدة أو مراجعة الحصص السابقة'
                    : 'Cliquez sur une formation pour ajouter une nouvelle séance ou consulter l\'historique'}
                </span>
              </div>

              {courses.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px dashed #D6C2B4',
                    textAlign: 'center',
                    padding: '4rem 2rem',
                  }}
                >
                  <BookOpen size={44} color="#C4B0A0" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#3D1B0D', margin: '0 0 0.5rem 0' }}>
                    {locale === 'ar' ? 'لم يتم تعيين دورات لك بعد' : 'Aucune formation assignée pour le moment'}
                  </h3>
                  <p style={{ color: '#8C6F5A', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
                    {locale === 'ar'
                      ? 'بمجرد أن تقوم الإدارة بربط دورات بحسابك، ستظهر هنا لتتمكن من إجراء الحضور لكل حصة.'
                      : 'Dès que l\'administration vous assigne des formations, elles apparaîtront ici pour la prise d\'appel.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {courses.map((course) => {
                    const courseSched = sessions.filter((s) => s.course_id === course.id);
                    const enrolledCount = course.enrolled_count || 0;

                    return (
                      <div
                        key={course.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '18px',
                          border: '1.5px solid #F0DFD3',
                          padding: '1.6rem',
                          boxShadow: '0 4px 18px rgba(61, 27, 13, 0.05)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  backgroundColor: '#FFF0EA',
                                  color: '#FA461D',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #FCDFD7',
                                }}
                              >
                                {course.flag_emoji} {course.language_name_fr}
                              </span>
                              <span
                                style={{
                                  backgroundColor: '#F0F9FF',
                                  color: '#0369A1',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '8px',
                                  border: '1px solid #BAE6FD',
                                }}
                              >
                                {course.level || 'Tous niveaux'}
                              </span>
                              <span
                                style={{
                                  backgroundColor: '#ECFDF5',
                                  color: '#065F46',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '8px',
                                }}
                              >
                                👥 {enrolledCount} {locale === 'ar' ? 'طالب مؤكد' : 'étudiants confirmés'}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.4rem 0', color: '#3D1B0D' }}>
                              {locale === 'ar' ? course.title_ar : course.title_fr}
                            </h3>

                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#7A6258' }}>
                              {course.duration_weeks ? `${course.duration_weeks} semaines • ${course.hours_total || 40}h au total` : 'Programme certifiant Fassi7'}
                            </p>
                          </div>

                          {/* Sessions counter pill */}
                          <div
                            style={{
                              backgroundColor: '#FFF9F4',
                              border: '1px solid #F2E2D5',
                              borderRadius: '12px',
                              padding: '0.65rem 1.1rem',
                              textAlign: 'center',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', color: '#8C6F5A', fontWeight: 700, display: 'block' }}>
                              {locale === 'ar' ? 'قوائم الحضور المسجلة' : 'Séances enregistrées'}
                            </span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FA461D' }}>
                              {courseSched.length} {locale === 'ar' ? 'حصص' : 'séance(s)'}
                            </span>
                          </div>
                        </div>

                        {/* Recent sessions chips */}
                        {courseSched.length > 0 && (
                          <div style={{ marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '0.76rem', color: '#8C6F5A', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                              {locale === 'ar' ? 'آخر الحصص المسجلة:' : 'Dernières feuilles d\'appel :'}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {courseSched.slice(-3).map((cs) => (
                                <button
                                  key={cs.id}
                                  type="button"
                                  onClick={() => openCourseAttendanceHub(course, cs.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    backgroundColor: '#F8F5F1',
                                    border: '1px solid #E8DDD4',
                                    borderRadius: '8px',
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: '#5E483B',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Clock size={12} color="#FA461D" />
                                  <span>{cs.title_fr}</span>
                                  <span style={{ color: '#8C6F5A', fontSize: '0.72rem' }}>
                                    ({cs.start_time ? cs.start_time.split(' ')[0] : ''})
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Bar */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid #F2E4D8',
                            paddingTop: '1rem',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {/* Primary Button: Open Multi-Session Attendance Hub */}
                            <button
                              type="button"
                              onClick={() => openCourseAttendanceHub(course)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: '#FA461D',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.65rem 1.25rem',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(250, 70, 29, 0.25)',
                              }}
                            >
                              <UserCheck size={16} />
                              <span>{locale === 'ar' ? 'سجل الحضور وقوائم الحصص' : 'Feuille de Présence & Séances'}</span>
                            </button>

                            {/* Direct button: Add new presence list */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCourse(course);
                                setHubModalOpen(true);
                                openNewSessionForm(course);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                backgroundColor: '#FFFFFF',
                                color: '#2E7D32',
                                border: '1.5px solid #A7F3D0',
                                borderRadius: '10px',
                                padding: '0.65rem 1rem',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={15} />
                              <span>{locale === 'ar' ? 'إضافة حصة جديدة اليوم' : '+ Nouvelle Séance / Appel'}</span>
                            </button>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#8C6F5A' }}>
                            {locale === 'ar'
                              ? 'الطلاب المسجلون الجدد يظهرون تلقائياً في كل حصة'
                              : 'Chaque nouvelle séance charge tous les étudiants confirmés'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Academic Instructions & Workflow */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <Sparkles size={22} color="#FFAD17" />
                <h2 style={{ fontSize: '1.45rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                  {locale === 'ar' ? 'دليل إدارة الحضور المتكرر' : 'Gestion du Suivi Continu'}
                </h2>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #EADBCE',
                  padding: '1.6rem',
                  boxShadow: '0 4px 16px rgba(61, 27, 13, 0.04)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#FFF2EE',
                      color: '#FA461D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'حصة جديدة لكل موعد دراسي' : 'Une nouvelle liste pour chaque cours'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.5 }}>
                      {locale === 'ar'
                        ? 'في كل موعد يلتقي فيه الأستاذ بطلابه، ينقر على «إضافة حصة جديدة»، فيظهر جميع طلاب الكورس لتسجيل الحضور مباشرة.'
                        : 'À chaque séance de cours, cliquez sur « + Nouvelle Séance / Appel » pour charger l\'ensemble des étudiants confirmés du groupe.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#E8F5E9',
                      color: '#2E7D32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'تسجيل فوري وحفظ السجل' : 'Enregistrement & Horodatage'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.5 }}>
                      {locale === 'ar'
                        ? 'يمكنك تحديد (حاضر / متأخر / معذور / غائب) أو النقر على «تأكيد حضور الجميع» بضغطة زر واحدة.'
                        : 'Définissez le statut de chaque étudiant ou utilisez le bouton « Tout marquer Présent » pour un appel rapide en un clic.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'متابعة نسبة التزام كل طالب' : 'Suivi de l\'assiduité globale'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.5 }}>
                      {locale === 'ar'
                        ? 'يمكن الرجوع لأي حصة سابقة لمراجعتها، والاطلاع على إجمالي نسبة حضور الطالب طيلة فترة الدورة حتى التخرج.'
                        : 'Consultez l\'historique des séances passées et le taux global d\'assiduité de chaque étudiant jusqu\'à l\'obtention de son certificat.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MULTI-SESSION ATTENDANCE HUB MODAL */}
      {hubModalOpen && activeCourse && (
        <div
          className="modal-overlay"
          onClick={() => setHubModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(61, 27, 13, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(61, 27, 13, 0.3)',
              border: '1px solid #EADBCE',
              overflow: 'hidden',
            }}
          >
            {/* Modal Top Header */}
            <div
              style={{
                padding: '1.4rem 1.75rem',
                borderBottom: '1px solid #EADBCE',
                backgroundColor: '#FFF9F4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span
                    style={{
                      backgroundColor: '#FA461D',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                    }}
                  >
                    {activeCourse.flag_emoji} {activeCourse.language_name_fr}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                    }}
                  >
                    {activeCourse.level || 'Tous niveaux'}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#ECFDF5',
                      color: '#065F46',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                    }}
                  >
                    👥 {courseStudents.length} {locale === 'ar' ? 'طالب مؤكد' : 'étudiants'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                  {locale === 'ar' ? activeCourse.title_ar : activeCourse.title_fr}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setHubModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8C6F5A',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '8px',
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Sessions Navigation Bar & "Add New Session" Button */}
            <div
              style={{
                padding: '0.85rem 1.75rem',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #F0DFD3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {/* Sessions Tabs Carousel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', maxWidth: '65%', paddingBottom: '2px' }}>
                {courseSessions.length === 0 ? (
                  <span style={{ fontSize: '0.82rem', color: '#8C6F5A', fontStyle: 'italic' }}>
                    {locale === 'ar' ? 'لا توجد حصص مسجلة بعد' : 'Aucune séance pour le moment'}
                  </span>
                ) : (
                  courseSessions.map((sess, idx) => {
                    const isSelected = selectedSessionId === sess.id && hubView === 'roster';
                    const dateSnippet = sess.start_time ? sess.start_time.split(' ')[0] : '';

                    return (
                      <button
                        key={sess.id}
                        type="button"
                        onClick={() => loadSessionRoster(sess.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          border: isSelected ? '1.5px solid #FA461D' : '1px solid #E5E7EB',
                          backgroundColor: isSelected ? '#FFF0EA' : '#F9FAFB',
                          color: isSelected ? '#FA461D' : '#4B5563',
                        }}
                      >
                        <Clock size={12} />
                        <span>{sess.title_fr?.split(' - ')[0] || `Séance ${idx + 1}`}</span>
                        {dateSnippet && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>({dateSnippet.slice(5)})</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Action Buttons: Add New Session & Stats */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => openNewSessionForm()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: hubView === 'new_session' ? '#059669' : '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Plus size={14} />
                  <span>{locale === 'ar' ? 'إضافة حصة جديدة' : '+ Nouvelle Liste d\'Appel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHubView(hubView === 'stats' ? 'roster' : 'stats')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: hubView === 'stats' ? '#3D1B0D' : '#F3F4F6',
                    color: hubView === 'stats' ? '#FFFFFF' : '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.8rem',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                  title="Voir la synthèse globale d'assiduité"
                >
                  <TrendingUp size={14} />
                  <span>{locale === 'ar' ? 'المعدل العام' : 'Assiduité'}</span>
                </button>
              </div>
            </div>

            {/* Feedback alert toast */}
            {attendanceSuccessMsg && (
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  padding: '0.7rem 1.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderBottom: '1px solid #A7F3D0',
                }}
              >
                <CheckCircle2 size={16} color="#059669" />
                <span>{attendanceSuccessMsg}</span>
              </div>
            )}

            {/* Modal Body: Switch between 'new_session', 'stats', and 'roster' */}
            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
              {/* VIEW 1: FORM TO CREATE A NEW SESSION / ATTENDANCE SHEET */}
              {hubView === 'new_session' && (
                <div
                  style={{
                    backgroundColor: '#FFF9F4',
                    borderRadius: '16px',
                    border: '1.5px solid #F3DFD1',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <Plus size={20} color="#10B981" />
                    <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'إنشاء قائمة حضور لحصة جديدة' : 'Créer une Nouvelle Liste d\'Appel (Séance)'}
                    </h4>
                  </div>

                  <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#7A6258' }}>
                    {locale === 'ar'
                      ? 'حدد موعد الحصة وعنوانها، وسيتم تحميل كافة الطلاب المؤكدين في الدورة تلقائياً لإجراء الحضور.'
                      : 'Indiquez la date et le titre de la séance. Tous les étudiants confirmés de ce cours seront automatiquement chargés pour l\'appel.'}
                  </p>

                  <form onSubmit={handleCreateNewSession}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#3D1B0D', marginBottom: '0.35rem' }}>
                          {locale === 'ar' ? 'عنوان الحصة / الرقم' : 'Titre / Numéro de la séance'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={newSessionTitle}
                          onChange={(e) => setNewSessionTitle(e.target.value)}
                          className="form-input"
                          placeholder="Ex: Séance 2 - Expression orale"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#3D1B0D', marginBottom: '0.35rem' }}>
                          {locale === 'ar' ? 'تاريخ ووقت الحصة' : 'Date et Heure'} *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={newSessionDate}
                          onChange={(e) => setNewSessionDate(e.target.value)}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#3D1B0D', marginBottom: '0.35rem' }}>
                          {locale === 'ar' ? 'الفوج / القاعة' : 'Groupe / Salle'}
                        </label>
                        <input
                          type="text"
                          value={newSessionRoom}
                          onChange={(e) => setNewSessionRoom(e.target.value)}
                          className="form-input"
                          placeholder="Ex: Groupe A (Octobre 2026)"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      {courseSessions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setHubView('roster')}
                          className="btn-outline btn-sm"
                        >
                          {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={creatingSession}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.65rem 1.4rem',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                        }}
                      >
                        {creatingSession
                          ? (locale === 'ar' ? 'جاري الإنشاء...' : 'Création en cours...')
                          : (locale === 'ar' ? 'إنشاء وبدء تسجيل الحضور' : 'Créer & Commencer l\'Appel')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* VIEW 2: GLOBAL ATTENDANCE SUMMARY STATS ACROSS ALL SESSIONS */}
              {hubView === 'stats' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'التقرير التراكمي لالتزام الطلاب' : 'Synthèse Globale d\'Assiduité des Étudiants'}
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: '#8C6F5A', fontWeight: 600 }}>
                      {courseSessions.length} {locale === 'ar' ? 'حصص منجزة' : 'séances enregistrées'}
                    </span>
                  </div>

                  {courseStudents.length === 0 ? (
                    <p style={{ color: '#8C6F5A' }}>
                      {locale === 'ar' ? 'لا يوجد طلاب مؤكدون بعد.' : 'Aucun étudiant confirmé.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {courseStudents.map((stud) => {
                        const cleanPhone = stud.phone ? stud.phone.replace(/[^0-9]/g, '') : '';

                        return (
                          <div
                            key={stud.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.9rem 1.2rem',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '12px',
                              border: '1px solid #EADBCE',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  backgroundColor: '#3D1B0D',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                }}
                              >
                                {stud.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: '#3D1B0D' }}>
                                  {stud.name}
                                </p>
                                <span style={{ fontSize: '0.78rem', color: '#8C6F5A' }}>{stud.email}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.2rem 0.5rem',
                                    backgroundColor: '#25D366',
                                    color: '#FFFFFF',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                  }}
                                >
                                  <MessageCircle size={12} />
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              <span
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 800,
                                  padding: '0.3rem 0.7rem',
                                  borderRadius: '8px',
                                  backgroundColor: '#ECFDF5',
                                  color: '#065F46',
                                }}
                              >
                                {courseSessions.length > 0 ? `${courseSessions.length} séances suivies` : 'En attente'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: ROSTER FOR CURRENTLY SELECTED SESSION */}
              {hubView === 'roster' && (
                <div>
                  {loadingHub ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8C6F5A' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid #FA461D',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 1rem auto',
                        }}
                      />
                      {locale === 'ar' ? 'جاري تحميل قائمة الطلاب...' : 'Chargement de la liste des étudiants...'}
                    </div>
                  ) : !activeSession ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#FFF9F4', borderRadius: '16px' }}>
                      <p style={{ color: '#8C6F5A', margin: '0 0 1rem 0' }}>
                        {locale === 'ar'
                          ? 'لم تقم بإنشاء أي حصة بعد. انقر على «إضافة حصة جديدة» للبدء.'
                          : 'Aucune séance d\'appel n\'est sélectionnée. Cliquez sur « + Nouvelle Liste d\'Appel » pour démarrer.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => openNewSessionForm()}
                        className="btn-primary btn-sm"
                      >
                        <Plus size={16} />
                        <span>{locale === 'ar' ? 'إضافة أول حصة الآن' : 'Créer la 1ère séance d\'appel'}</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Session Details & Attendance Quick Tally Bar */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          backgroundColor: '#FFF9F4',
                          border: '1px solid #EADBCE',
                          borderRadius: '12px',
                          padding: '0.85rem 1.25rem',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.76rem', color: '#8C6F5A', fontWeight: 700, display: 'block' }}>
                            {activeSession.title_fr} • 📅 {activeSession.start_time}
                          </span>
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.82rem', fontWeight: 800 }}>
                            <span style={{ color: '#2E7D32' }}>✓ Présents : {presentCount}</span>
                            <span style={{ color: '#C62828' }}>✕ Absents : {absentCount}</span>
                            <span style={{ color: '#D97706' }}>⏳ Retards : {lateCount}</span>
                            <span style={{ color: '#0284C7' }}>ℹ️ Excusés : {excusedCount}</span>
                          </div>
                        </div>

                        {/* Bulk action: Tout Marquer Présent */}
                        <button
                          type="button"
                          onClick={handleMarkAllPresent}
                          disabled={savingAttendance || activeSessionRecords.length === 0}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 0.95rem',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                          <span>{locale === 'ar' ? 'تأكيد حضور الجميع' : 'Tout marquer Présent'}</span>
                        </button>
                      </div>

                      {/* Students List */}
                      {activeSessionRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1.5px dashed #E5D5C8' }}>
                          <Users size={32} color="#C4B0A0" style={{ marginBottom: '0.5rem' }} />
                          <h4 style={{ margin: '0 0 0.35rem 0', color: '#3D1B0D' }}>
                            {locale === 'ar' ? 'لا يوجد طلاب مؤكدون في هذا الكورس حالياً' : 'Aucun étudiant confirmé dans ce cours'}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#8C6F5A' }}>
                            {locale === 'ar'
                              ? 'بمجرد أن تؤكد الإدارة تسجيل الطلاب، سيظهرون تلقائياً في هذه القائمة.'
                              : 'Dès que l\'administration confirme les inscriptions, les profils apparaîtront directement ici.'}
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {activeSessionRecords.map((rec) => {
                            const currentStatus = rec.attendance_status;
                            const cleanPhone = rec.student_phone ? rec.student_phone.replace(/[^0-9]/g, '') : '';

                            return (
                              <div
                                key={rec.student_id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '1rem',
                                  padding: '0.9rem 1.2rem',
                                  backgroundColor:
                                    currentStatus === 'present'
                                      ? '#F0FDF4'
                                      : currentStatus === 'absent'
                                      ? '#FEF2F2'
                                      : currentStatus === 'late'
                                      ? '#FFFBEB'
                                      : '#FFFFFF',
                                  borderRadius: '12px',
                                  border:
                                    currentStatus === 'present'
                                      ? '1.5px solid #86EFAC'
                                      : currentStatus === 'absent'
                                      ? '1.5px solid #FCA5A5'
                                      : currentStatus === 'late'
                                      ? '1.5px solid #FCD34D'
                                      : '1px solid #EADBCE',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {/* Student Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                  <div
                                    style={{
                                      width: '42px',
                                      height: '42px',
                                      borderRadius: '10px',
                                      backgroundColor:
                                        currentStatus === 'present'
                                          ? '#22C55E'
                                          : currentStatus === 'absent'
                                          ? '#EF4444'
                                          : '#3D1B0D',
                                      color: '#FFFFFF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 900,
                                      fontSize: '0.95rem',
                                    }}
                                  >
                                    {rec.student_name ? rec.student_name.slice(0, 2).toUpperCase() : 'ET'}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#3D1B0D' }}>
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
                                            gap: '0.25rem',
                                            padding: '0.15rem 0.45rem',
                                            backgroundColor: '#25D366',
                                            color: '#FFFFFF',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                          }}
                                          title="Contacter sur WhatsApp"
                                        >
                                          <MessageCircle size={11} />
                                          <span>WhatsApp</span>
                                        </a>
                                      )}
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: '#8C6F5A' }}>
                                      {rec.student_email} {rec.student_phone && `• ${rec.student_phone}`}
                                    </span>
                                  </div>
                                </div>

                                {/* Status buttons */}
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(rec.student_id, 'present')}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      border: currentStatus === 'present' ? '2px solid #16A34A' : '1px solid #D1D5DB',
                                      backgroundColor: currentStatus === 'present' ? '#16A34A' : '#FFFFFF',
                                      color: currentStatus === 'present' ? '#FFFFFF' : '#374151',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    ✓ {locale === 'ar' ? 'حاضر' : 'Présent'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(rec.student_id, 'late')}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      border: currentStatus === 'late' ? '2px solid #D97706' : '1px solid #D1D5DB',
                                      backgroundColor: currentStatus === 'late' ? '#D97706' : '#FFFFFF',
                                      color: currentStatus === 'late' ? '#FFFFFF' : '#374151',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    ⏳ {locale === 'ar' ? 'متأخر' : 'Retard'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(rec.student_id, 'excused')}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      border: currentStatus === 'excused' ? '2px solid #0284C7' : '1px solid #D1D5DB',
                                      backgroundColor: currentStatus === 'excused' ? '#0284C7' : '#FFFFFF',
                                      color: currentStatus === 'excused' ? '#FFFFFF' : '#374151',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    ℹ️ {locale === 'ar' ? 'معذور' : 'Excusé'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkAttendance(rec.student_id, 'absent')}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      border: currentStatus === 'absent' ? '2px solid #DC2626' : '1px solid #D1D5DB',
                                      backgroundColor: currentStatus === 'absent' ? '#DC2626' : '#FFFFFF',
                                      color: currentStatus === 'absent' ? '#FFFFFF' : '#374151',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    ✕ {locale === 'ar' ? 'غائب' : 'Absent'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderTop: '1px solid #EADBCE',
                backgroundColor: '#FFF9F4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#8C6F5A' }}>
                {locale === 'ar'
                  ? 'كل حصة جديدة تسجل بتاريخها المستقل ويتم حفظها فوراً'
                  : 'Chaque séance est horodatée et conservée dans l\'historique académique'}
              </div>

              <button
                type="button"
                onClick={() => setHubModalOpen(false)}
                style={{
                  backgroundColor: '#3D1B0D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.4rem',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                {locale === 'ar' ? 'إغلاق السجل' : 'Fermer la feuille'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
