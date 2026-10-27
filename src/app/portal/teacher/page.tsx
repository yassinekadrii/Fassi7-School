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
  Filter,
  Users,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function TeacherPortalPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();

  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all');

  // Attendance modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  const loadTeacherData = async () => {
    try {
      const [schedRes, coursesRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/courses'),
      ]);

      const schedData = await schedRes.json();
      const coursesData = await coursesRes.json();

      const list = schedData.sessions || [];
      if (user && user.role === 'teacher') {
        const mine = list.filter((s: any) => s.teacher_id === user.id);
        setSessions(mine.length > 0 ? mine : list);
      } else {
        setSessions(list);
      }

      setCourses(coursesData.courses || []);
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

  // Open Attendance Sheet
  const openAttendanceModal = async (s: any) => {
    setActiveSession(s);
    setAttendanceModalOpen(true);
    setLoadingAttendance(true);
    setAttendanceSuccessMsg('');

    try {
      const res = await fetch(`/api/schedule/attendance?session_id=${s.id}`);
      const data = await res.json();
      setAttendanceRecords(data.records || []);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Mark single student attendance
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
        locale === 'ar' ? 'تم تسجيل الحضور بنجاح' : 'Statut enregistré avec succès'
      );
      setTimeout(() => setAttendanceSuccessMsg(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all students present in one click
  const handleMarkAllPresent = async () => {
    if (!activeSession || attendanceRecords.length === 0) return;
    setSavingAttendance(true);
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
        locale === 'ar'
          ? 'تم تأكيد حضور جميع طلاب الفوج بنجاح'
          : 'Tous les étudiants ont été marqués présents !'
      );
      setTimeout(() => setAttendanceSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Toggle session status (e.g. Complete cohort when students finish)
  const handleUpdateSessionStatus = async (sessionId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err) {
      console.error('Error updating session status:', err);
    }
  };

  // Format date nicely
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return { date: '', time: '' };
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) {
        return { date: dateStr, time: '' };
      }
      const dateFormatted = d.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeFormatted = d.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { date: dateFormatted, time: timeFormatted };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (activeTab === 'all') return sessions;
    if (activeTab === 'completed') return sessions.filter((s) => s.status === 'completed');
    if (activeTab === 'active') return sessions.filter((s) => s.status === 'active' || s.status === 'in_progress');
    if (activeTab === 'scheduled') return sessions.filter((s) => s.status === 'scheduled');
    return sessions;
  }, [sessions, activeTab]);

  // Attendance stats in modal
  const presentCount = attendanceRecords.filter((r) => r.attendance_status === 'present').length;
  const absentCount = attendanceRecords.filter((r) => r.attendance_status === 'absent').length;
  const lateCount = attendanceRecords.filter((r) => r.attendance_status === 'late').length;
  const excusedCount = attendanceRecords.filter((r) => r.attendance_status === 'excused').length;

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
                    {locale === 'ar' ? 'مزامنة فورية للحضور' : 'Synchronisation directe présences'}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, color: '#3D1B0D' }}>
                  {locale === 'ar' ? `مرحباً بك أستاذ، ${user?.name}` : `Bienvenue, Pr. ${user?.name}`}
                </h1>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', color: '#7A6258' }}>
                  {user?.email} • {locale === 'ar' ? 'أكاديمية فصيح للغات — إدارة الأفواج ومتابعة الطلاب' : 'Académie Fassi7 — Suivi des cohortes & appel des présences'}
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
                  {locale === 'ar' ? 'إجمالي الحصص' : 'Total Séances'}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FA461D' }}>
                  {sessions.length}
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
                  {locale === 'ar' ? 'الأفواج النشطة' : 'Cohortes Actives'}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2E7D32' }}>
                  {sessions.filter((s) => s.status !== 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: '3rem 0', flex: 1 }}>
        <div className="container">
          {/* Cohort Tabs & Filters */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem',
              backgroundColor: '#FFFFFF',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              border: '1px solid #EADBCE',
              boxShadow: '0 4px 16px rgba(61, 27, 13, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Filter size={18} color="#FA461D" />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#3D1B0D', marginRight: '0.5rem' }}>
                {locale === 'ar' ? 'تصنيف المجموعات:' : 'Filtrer les groupes :'}
              </span>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'all' ? '#FA461D' : '#F7F3EE',
                  color: activeTab === 'all' ? '#FFFFFF' : '#6A564A',
                  transition: 'all 0.2s',
                }}
              >
                {locale === 'ar' ? `كل المجموعات (${sessions.length})` : `Tous les Groupes (${sessions.length})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('active')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'active' ? '#2E7D32' : '#F7F3EE',
                  color: activeTab === 'active' ? '#FFFFFF' : '#6A564A',
                  transition: 'all 0.2s',
                }}
              >
                🟢 {locale === 'ar' ? 'المجموعات النشطة' : 'Groupes Actifs / En cours'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scheduled')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'scheduled' ? '#0284C7' : '#F7F3EE',
                  color: activeTab === 'scheduled' ? '#FFFFFF' : '#6A564A',
                  transition: 'all 0.2s',
                }}
              >
                🔵 {locale === 'ar' ? 'المجموعات المجدولة' : 'Groupes Planifiés'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'completed' ? '#6B7280' : '#F7F3EE',
                  color: activeTab === 'completed' ? '#FFFFFF' : '#6A564A',
                  transition: 'all 0.2s',
                }}
              >
                🎓 {locale === 'ar' ? 'المجموعات المكتملة' : 'Groupes Terminés / Archivés'}
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#8C6F5A', fontWeight: 600 }}>
              {locale === 'ar'
                ? 'يظهر الطلاب تلقائياً فور تأكيد تسجيلهم من الإدارة'
                : 'Les étudiants confirmés par l\'administration apparaissent automatiquement'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
            {/* Sessions & Cohorts List */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={22} color="#FA461D" />
                  <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                    {locale === 'ar' ? 'جدول المجموعات والحصص المقررة' : 'Planning des Groupes & Séances de Cours'}
                  </h2>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#8C6F5A', fontWeight: 600 }}>
                  {filteredSessions.length} {locale === 'ar' ? 'جلسة' : 'séance(s)'}
                </span>
              </div>

              {filteredSessions.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1.5px dashed #D6C2B4',
                    textAlign: 'center',
                    padding: '4rem 2rem',
                  }}
                >
                  <Users size={44} color="#C4B0A0" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#3D1B0D', margin: '0 0 0.5rem 0' }}>
                    {locale === 'ar' ? 'لا توجد حصص في هذا التصنيف' : 'Aucune séance dans cette catégorie'}
                  </h3>
                  <p style={{ color: '#8C6F5A', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
                    {locale === 'ar'
                      ? 'عندما تقوم الإدارة ببرمجة أفواج جديدة وتأكيد تسجيل الطلاب، ستظهر هنا فوراً لإجراء الحضور.'
                      : 'Lorsque l\'administration planifie de nouveaux groupes et confirme des inscriptions, elles apparaîtront ici immédiatement.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filteredSessions.map((s) => {
                    const startFormatted = formatDateTime(s.start_time);
                    const endFormatted = formatDateTime(s.end_time);
                    const enrolledCount = s.enrolled_students_count ?? (s.enrolled_students ? s.enrolled_students.length : 0);
                    const isCompleted = s.status === 'completed';

                    return (
                      <div
                        key={s.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '18px',
                          border: isCompleted ? '1px solid #E5E7EB' : '1.5px solid #F0DFD3',
                          padding: '1.6rem',
                          boxShadow: '0 4px 18px rgba(61, 27, 13, 0.05)',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: isCompleted ? 0.85 : 1,
                        }}
                      >
                        {/* Top banner / group tag */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            marginBottom: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
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
                              {s.language_name_fr || 'Langue'}
                            </span>

                            {/* Group / Cohort Name */}
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
                              🏷️ {s.room_name || 'Groupe A'}
                            </span>

                            {s.course_level && (
                              <span
                                style={{
                                  backgroundColor: '#F3F4F6',
                                  color: '#374151',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '8px',
                                }}
                              >
                                {s.course_level}
                              </span>
                            )}
                          </div>

                          {/* Lifecycle Status Pill */}
                          <div>
                            {isCompleted ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: '#F3F4F6',
                                  color: '#4B5563',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  padding: '0.35rem 0.8rem',
                                  borderRadius: '999px',
                                }}
                              >
                                <CheckCircle2 size={14} color="#6B7280" />
                                {locale === 'ar' ? 'فوج مكتمل ومؤرشف' : 'Cohorte Terminée'}
                              </span>
                            ) : s.status === 'active' || s.status === 'in_progress' ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: '#ECFDF5',
                                  color: '#065F46',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  padding: '0.35rem 0.8rem',
                                  borderRadius: '999px',
                                }}
                              >
                                <span
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#10B981',
                                  }}
                                />
                                {locale === 'ar' ? 'فوج جارٍ حالياً' : 'Groupe Actif (En cours)'}
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: '#EFF6FF',
                                  color: '#1E40AF',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  padding: '0.35rem 0.8rem',
                                  borderRadius: '999px',
                                }}
                              >
                                <Clock size={13} />
                                {locale === 'ar' ? 'حصة مبرمجة' : 'Séance Planifiée'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 900,
                            margin: '0 0 0.5rem 0',
                            color: '#3D1B0D',
                          }}
                        >
                          {locale === 'ar' ? s.title_ar || s.course_title_ar : s.title_fr || s.course_title_fr}
                        </h3>

                        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: '#7A6258', lineHeight: 1.5 }}>
                          {locale === 'ar' ? s.course_title_ar : s.course_title_fr}
                        </p>

                        {/* Date, Time & Group Metadata Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.85rem',
                            backgroundColor: '#FDFBF7',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid #EADBCE',
                            marginBottom: '1.25rem',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#8C6F5A', fontWeight: 700, display: 'block' }}>
                              📅 {locale === 'ar' ? 'تاريخ الحصة:' : 'Date de la séance :'}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#3D1B0D' }}>
                              {startFormatted.date || s.start_time}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#8C6F5A', fontWeight: 700, display: 'block' }}>
                              ⏰ {locale === 'ar' ? 'التوقيت الزمني:' : 'Horaire & Durée :'}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FA461D' }}>
                              {startFormatted.time} {endFormatted.time ? `→ ${endFormatted.time}` : ''}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#8C6F5A', fontWeight: 700, display: 'block' }}>
                              👥 {locale === 'ar' ? 'الطلاب المؤكدون:' : 'Étudiants Confirmés :'}
                            </span>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                color: enrolledCount > 0 ? '#2E7D32' : '#C2410C',
                              }}
                            >
                              {enrolledCount} {locale === 'ar' ? 'طالب مسجل ومؤكد' : 'étudiant(s) inscrit(s)'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            paddingTop: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => openAttendanceModal(s)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: '#FA461D',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.65rem 1.2rem',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(250, 70, 29, 0.25)',
                              }}
                            >
                              <UserCheck size={16} />
                              <span>{locale === 'ar' ? 'تسجيل الحضور والغياب' : 'Feuille de Présence'}</span>
                            </button>

                            {/* Mark Cohort Completed Button */}
                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      locale === 'ar'
                                        ? 'هل أنهى طلاب هذا الفوج الدورة وترغب في إغلاقه لإطلاق فوج جديد؟'
                                        : 'Les étudiants de ce groupe ont-ils terminé la session ? Voulez-vous clôturer ce groupe pour lancer la cohorte suivante ?'
                                    )
                                  ) {
                                    handleUpdateSessionStatus(s.id, 'completed');
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  backgroundColor: '#FFFFFF',
                                  color: '#4B5563',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '10px',
                                  padding: '0.65rem 1rem',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                }}
                                title="Clôturer ce groupe une fois la formation terminée"
                              >
                                <Check size={15} />
                                <span>{locale === 'ar' ? 'إنهاء الفوج (تخريج)' : 'Clôturer ce groupe'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateSessionStatus(s.id, 'scheduled')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  backgroundColor: '#FFFFFF',
                                  color: '#0369A1',
                                  border: '1px solid #BAE6FD',
                                  borderRadius: '10px',
                                  padding: '0.65rem 1rem',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <RotateCcw size={15} />
                                <span>{locale === 'ar' ? 'إعادة تنشيط' : 'Réactiver la session'}</span>
                              </button>
                            )}
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#8C6F5A' }}>
                            {locale === 'ar'
                              ? 'سجل الحضور يُحفظ تلقائياً في السجلات الرسمية'
                              : 'Présences archivées au registre académique'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar: Assigned Courses & Academy Information */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <BookOpen size={22} color="#FFAD17" />
                <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                  {locale === 'ar' ? 'تخصصاتي ولغات التدريس' : 'Mes Formations & Langues'}
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {courses.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #EADBCE',
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#8C6F5A',
                    }}
                  >
                    {locale === 'ar' ? 'جاري تحميل التخصصات...' : 'Chargement des formations...'}
                  </div>
                ) : (
                  courses.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1px solid #EADBCE',
                        padding: '1.25rem',
                        boxShadow: '0 2px 10px rgba(61, 27, 13, 0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            backgroundColor: '#FFF0EA',
                            color: '#FA461D',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                          }}
                        >
                          {c.flag_emoji} {c.language_name_fr}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A6258' }}>
                          {c.level || 'Tous niveaux'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#3D1B0D' }}>
                        {locale === 'ar' ? c.title_ar : c.title_fr}
                      </h4>

                      <p style={{ fontSize: '0.82rem', color: '#7A6258', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                        {c.duration_weeks ? `${c.duration_weeks} semaines • ${c.hours_total || 40} heures au total` : 'Programme certifiant académique'}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid #F2E4D8',
                          paddingTop: '0.65rem',
                          fontSize: '0.8rem',
                          color: '#8C6F5A',
                        }}
                      >
                        <span>
                          👥 {locale === 'ar' ? 'الطلاب المؤكدون:' : 'Inscrits confirmés :'} <strong>{c.enrolled_count || 0}</strong>
                        </span>
                        <span style={{ color: '#2E7D32', fontWeight: 700 }}>
                          ✓ {locale === 'ar' ? 'فوج مفتوح' : 'Cohorte ouverte'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Academy Notice / Instructions */}
              <div
                style={{
                  backgroundColor: '#FFF9F4',
                  borderRadius: '16px',
                  border: '1.5px solid #F5DFD0',
                  padding: '1.5rem',
                  marginTop: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <Sparkles size={18} color="#FA461D" />
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#3D1B0D' }}>
                    {locale === 'ar' ? 'تعليمات إدارة المجموعات' : 'Gestion des Cohortes Successives'}
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.6 }}>
                  {locale === 'ar'
                    ? 'عند انتهاء فوج دراسي وتخرج الطلاب، انقر على «إنهاء الفوج» لأرشفته. ستقوم الإدارة تلقائياً ببرمجة الفوج التالي مع الطلاب المسجلين الجدد، ليتمكن الأستاذ من مواصلة التدريس وتسجيل الحضور بسلاسة.'
                    : 'Lorsqu\'une cohorte termine son cycle de formation, cliquez sur « Clôturer ce groupe » pour l\'archiver. L\'administration planifiera alors la nouvelle session avec la nouvelle promotion d\'étudiants afin d\'assurer un roulement pédagogique continu.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Professional Attendance Modal */}
      {attendanceModalOpen && activeSession && (
        <div
          className="modal-overlay"
          onClick={() => setAttendanceModalOpen(false)}
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
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(61, 27, 13, 0.3)',
              border: '1px solid #EADBCE',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.5rem 1.75rem',
                borderBottom: '1px solid #EADBCE',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                backgroundColor: '#FFF9F4',
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
                    {activeSession.language_name_fr || 'Langue'}
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
                    🏷️ {activeSession.room_name || 'Groupe A'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                  {locale === 'ar' ? 'سجل حضور وغياب الطلاب' : 'Feuille d\'Appel & Présence des Étudiants'}
                </h3>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#7A6258' }}>
                  {activeSession.title_fr} • 📅 {activeSession.start_time}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
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

            {/* Attendance Tally Stats & Bulk Action Bar */}
            <div
              style={{
                padding: '1rem 1.75rem',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #F0DFD3',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                  }}
                >
                  ✓ Présents : <strong>{presentCount}</strong>
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                  }}
                >
                  ✕ Absents : <strong>{absentCount}</strong>
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: '#FFFBEB',
                    color: '#92400E',
                  }}
                >
                  ⏳ Retards : <strong>{lateCount}</strong>
                </span>
              </div>

              {/* Bulk Action: Tout Marquer Présent */}
              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={savingAttendance || attendanceRecords.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 0.9rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                }}
              >
                <Check size={15} />
                <span>{locale === 'ar' ? 'تأكيد حضور الجميع' : 'Tout marquer Présent'}</span>
              </button>
            </div>

            {/* Success feedback toast */}
            {attendanceSuccessMsg && (
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  padding: '0.75rem 1.75rem',
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

            {/* Modal Body: Student Presence Roster */}
            <div
              style={{
                padding: '1.5rem 1.75rem',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {loadingAttendance ? (
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
                  {locale === 'ar' ? 'جاري تحميل قائمة الطلاب المؤكدين...' : 'Chargement de la liste des étudiants...'}
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    backgroundColor: '#FFF9F4',
                    borderRadius: '14px',
                    border: '1.5px dashed #E5D5C8',
                  }}
                >
                  <Users size={36} color="#C4B0A0" style={{ marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.35rem 0', color: '#3D1B0D', fontWeight: 800 }}>
                    {locale === 'ar' ? 'لا يوجد طلاب مؤكدون في هذا الفوج حالياً' : 'Aucun étudiant confirmé dans ce cours'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#8C6F5A', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
                    {locale === 'ar'
                      ? 'بمجرد أن تقوم إدارة الأكاديمية بقبول وتأكيد تسجيل الطالب في هذا الكورس، سيظهر هنا فوراً وبشكل تلقائي.'
                      : 'Dès que l\'administration confirme l\'inscription d\'un étudiant dans ce cours, son profil apparaît instantanément sur cette feuille de présence.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {attendanceRecords.map((rec) => {
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
                          padding: '1rem 1.25rem',
                          backgroundColor:
                            currentStatus === 'present'
                              ? '#F0FDF4'
                              : currentStatus === 'absent'
                              ? '#FEF2F2'
                              : currentStatus === 'late'
                              ? '#FFFBEB'
                              : '#FFFBF7',
                          borderRadius: '14px',
                          border:
                            currentStatus === 'present'
                              ? '1.5px solid #86EFAC'
                              : currentStatus === 'absent'
                              ? '1.5px solid #FCA5A5'
                              : currentStatus === 'late'
                              ? '1.5px solid #FCD34D'
                              : '1px solid #EADBCE',
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* Student Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
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
                              fontSize: '1rem',
                            }}
                          >
                            {rec.student_name ? rec.student_name.slice(0, 2).toUpperCase() : 'ET'}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.98rem', color: '#3D1B0D' }}>
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
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                  }}
                                  title="Contacter sur WhatsApp"
                                >
                                  <MessageCircle size={12} />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.78rem', color: '#8C6F5A' }}>
                              <span>{rec.student_email}</span>
                              {rec.student_phone && <span>• {rec.student_phone}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Attendance Status Switcher */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'present')}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: currentStatus === 'present' ? '2px solid #16A34A' : '1px solid #D1D5DB',
                              backgroundColor: currentStatus === 'present' ? '#16A34A' : '#FFFFFF',
                              color: currentStatus === 'present' ? '#FFFFFF' : '#374151',
                              boxShadow: currentStatus === 'present' ? '0 2px 8px rgba(22, 163, 74, 0.3)' : 'none',
                              transition: 'all 0.15s',
                            }}
                          >
                            ✓ {locale === 'ar' ? 'حاضر' : 'Présent'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'late')}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: currentStatus === 'late' ? '2px solid #D97706' : '1px solid #D1D5DB',
                              backgroundColor: currentStatus === 'late' ? '#D97706' : '#FFFFFF',
                              color: currentStatus === 'late' ? '#FFFFFF' : '#374151',
                              boxShadow: currentStatus === 'late' ? '0 2px 8px rgba(217, 119, 6, 0.3)' : 'none',
                              transition: 'all 0.15s',
                            }}
                          >
                            ⏳ {locale === 'ar' ? 'متأخر' : 'Retard'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'excused')}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: currentStatus === 'excused' ? '2px solid #0284C7' : '1px solid #D1D5DB',
                              backgroundColor: currentStatus === 'excused' ? '#0284C7' : '#FFFFFF',
                              color: currentStatus === 'excused' ? '#FFFFFF' : '#374151',
                              boxShadow: currentStatus === 'excused' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                              transition: 'all 0.15s',
                            }}
                          >
                            ℹ️ {locale === 'ar' ? 'معذور' : 'Excusé'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(rec.student_id, 'absent')}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: currentStatus === 'absent' ? '2px solid #DC2626' : '1px solid #D1D5DB',
                              backgroundColor: currentStatus === 'absent' ? '#DC2626' : '#FFFFFF',
                              color: currentStatus === 'absent' ? '#FFFFFF' : '#374151',
                              boxShadow: currentStatus === 'absent' ? '0 2px 8px rgba(220, 38, 38, 0.3)' : 'none',
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
                  ? 'تسجيل الحضور فوري ومتزامن مع سجلات إدارة المدرسة'
                  : 'Chaque modification est sauvegardée en temps réel'}
              </div>

              <button
                type="button"
                onClick={() => setAttendanceModalOpen(false)}
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
