'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { GraduationCap, Calendar, BookOpen, Video, ExternalLink, UserCheck, Clock, X } from 'lucide-react';

export default function TeacherPortalPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { locale, t } = useLanguage();

  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Attendance modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    async function loadTeacherData() {
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();
        const list = data.sessions || [];
        if (user && user.role === 'teacher') {
          const mine = list.filter((s: any) => s.teacher_id === user.id);
          setSessions(mine.length > 0 ? mine : list);
        } else {
          setSessions(list);
        }
      } catch (err) {
        console.error('Error fetching teacher sessions:', err);
      } finally {
        setLoadingData(false);
      }
    }

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

  const openAttendanceModal = async (s: any) => {
    setActiveSession(s);
    setAttendanceModalOpen(true);
    setLoadingAttendance(true);

    try {
      const res = await fetch(`/api/schedule/attendance?session_id=${s.id}`);
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 900,
              }}
            >
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.3rem' }}>
                <GraduationCap size={13} />
                {locale === 'ar' ? 'فضاء الأستاذ المعتمد' : locale === 'en' ? 'Certified Teacher Portal' : 'Espace Enseignant Certifié'}
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? `أهلاً بك، ${user?.name}` : locale === 'en' ? `Welcome, ${user?.name}` : `Bienvenue, ${user?.name}`}
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {user?.email} • {locale === 'ar' ? 'أكاديمية فصيح للغات' : locale === 'en' ? 'Fassi7 Language Academy' : 'Académie Fassi7'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-warm)', padding: '3.5rem 0', flex: 1 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2.5rem' }}>
            {/* Upcoming Sessions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <Calendar size={22} color="var(--primary)" />
                <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900 }}>
                  {locale === 'ar' ? 'جدول حصصي القادمة' : locale === 'en' ? 'My Upcoming Sessions' : 'Mon Emploi du Temps'}
                </h2>
              </div>

              {sessions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'لا توجد حصص مجدولة لك حالياً.' : locale === 'en' ? 'No sessions scheduled for you currently.' : 'Aucune séance programmée pour le moment.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sessions.map((s) => (
                    <div key={s.id} className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <span className="badge badge-primary" style={{ marginBottom: '0.3rem' }}>
                            {s.language_name_fr}
                          </span>
                          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                            {locale === 'ar' ? s.title_ar : s.title_fr}
                          </h3>
                        </div>
                        <span className={s.status === 'completed' ? 'badge badge-success' : 'badge badge-secondary'}>
                          {s.status === 'completed'
                            ? (locale === 'ar' ? 'مكتملة' : locale === 'en' ? 'Completed' : 'Terminée')
                            : (locale === 'ar' ? 'مجدولة' : locale === 'en' ? 'Scheduled' : 'Planifiée')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                        <Clock size={16} />
                        <span>{s.start_time}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openAttendanceModal(s)}
                          className="btn-primary btn-sm"
                          style={{ gap: '0.4rem' }}
                        >
                          <UserCheck size={15} />
                          <span>{locale === 'ar' ? 'تسجيل الحضور' : locale === 'en' ? 'Attendance Sheet' : 'Feuille de présence'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Assigned Courses */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <BookOpen size={22} color="var(--secondary)" />
                <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900 }}>
                  {locale === 'ar' ? 'الدورات المسندة إليّ' : locale === 'en' ? 'My Assigned Courses' : 'Mes Formations Assignées'}
                </h2>
              </div>

              {courses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'لم يتم تعيين دورات لك بعد.' : locale === 'en' ? 'No courses assigned to you yet.' : 'Aucun cours assigné actuellement.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {courses.map((c) => (
                    <div key={c.id} className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className="badge badge-secondary">{c.level}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {c.duration_weeks} sem • {c.hours_total}h
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--dark-brown)' }}>
                        {locale === 'ar' ? c.title_ar : c.title_fr}
                      </h3>

                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.6' }}>
                        {locale === 'ar' ? c.description_ar : c.description_fr}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.85rem', fontSize: '0.85rem' }}>
                        <span>
                          {locale === 'ar' ? 'الطلاب المسجلون:' : locale === 'en' ? 'Enrolled:' : 'Inscrits :'} <strong>{c.enrolled_count || 0}</strong> / {c.max_capacity}
                        </span>
                        <span className="badge badge-success">
                          {locale === 'ar' ? 'فوج نشط' : locale === 'en' ? 'Active Cohort' : 'Session Active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Attendance Modal */}
      {attendanceModalOpen && activeSession && (
        <div className="modal-overlay" onClick={() => setAttendanceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                  {locale === 'ar' ? 'تسجيل حضور الطلاب' : locale === 'en' ? 'Student Attendance Sheet' : 'Feuille de Présence'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {activeSession.title_fr}
                </p>
              </div>
              <button onClick={() => setAttendanceModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {loadingAttendance ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>{locale === 'ar' ? 'جاري التحميل...' : locale === 'en' ? 'Loading...' : 'Chargement...'}</div>
              ) : attendanceRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  {locale === 'ar' ? 'لا يوجد طلاب مسجلون في هذا الفوج حتى الآن.' : locale === 'en' ? 'No students enrolled in this cohort yet.' : 'Aucun étudiant trouvé.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem' }}>{rec.student_name}</p>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rec.student_email}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(rec.student_id, 'present')}
                          className={rec.attendance_status === 'present' ? 'badge badge-success' : 'btn-outline btn-sm'}
                        >
                          {locale === 'ar' ? 'حاضر' : locale === 'en' ? 'Present' : 'Présent'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(rec.student_id, 'absent')}
                          className={rec.attendance_status === 'absent' ? 'badge badge-danger' : 'btn-outline btn-sm'}
                        >
                          {locale === 'ar' ? 'غائب' : locale === 'en' ? 'Absent' : 'Absent'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setAttendanceModalOpen(false)} className="btn-primary btn-sm">
                {locale === 'ar' ? 'حفظ وإغلاق' : locale === 'en' ? 'Save & Close' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
