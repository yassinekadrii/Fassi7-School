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
  Printer,
  Download,
  Search,
  FileSpreadsheet,
  Award,
  Filter,
} from 'lucide-react';
import {
  getLocalizedCourseTitle,
  getLocalizedCourseDesc,
  getLocalizedCourseLevel,
} from '@/lib/courseHelpers';
import { ExportDropdown } from '@/components/ExportDropdown';
import { exportTableToPDF } from '@/lib/exportHelpers';

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
  const [attendanceMatrix, setAttendanceMatrix] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [activeSessionRecords, setActiveSessionRecords] = useState<any[]>([]);
  const [loadingHub, setLoadingHub] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  // Mode inside modal: 'roster' | 'full_course' | 'new_session' | 'stats'
  const [hubView, setHubView] = useState<'roster' | 'full_course' | 'new_session' | 'stats'>('roster');

  // Full Course Attendance Filters & Cell Editing
  const [fullCourseSearch, setFullCourseSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'certified' | 'warning' | 'critical'>('all');
  const [editingCell, setEditingCell] = useState<{
    studentId: number;
    sessionId: number;
    studentName: string;
    sessionTitle: string;
    currentStatus: string | null;
  } | null>(null);

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

      setSessions(allSessions);
      setCourses(allCourses);
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
  const openCourseAttendanceHub = async (
    course: any,
    targetSessionId?: number,
    initialView: 'roster' | 'full_course' | 'new_session' | 'stats' = 'roster'
  ) => {
    setActiveCourse(course);
    setHubModalOpen(true);
    setLoadingHub(true);
    setHubView(initialView);
    setAttendanceSuccessMsg('');
    setFullCourseSearch('');
    setStatusFilter('all');
    setEditingCell(null);

    try {
      const res = await fetch(`/api/schedule/attendance?course_id=${course.id}`);
      const data = await res.json();

      const sessList = data.sessions || [];
      const studList = data.students || [];
      const matrix = data.attendanceMatrix || [];

      setCourseSessions(sessList);
      setCourseStudents(studList);
      setAttendanceMatrix(matrix);

      if (sessList.length > 0) {
        const targetId = targetSessionId || sessList[sessList.length - 1].id;
        setSelectedSessionId(targetId);
        if (initialView === 'roster') {
          await loadSessionRoster(targetId);
        }
      } else {
        setSelectedSessionId(null);
        setActiveSessionRecords([]);
        if (initialView === 'roster') {
          openNewSessionForm(course, 1);
        }
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
        : locale === 'en'
        ? `Session ${num} - Attendance & Practice`
        : `Séance ${num} - Appel & Pratique`
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setNewSessionDate(`${year}-${month}-${day}T${hours}:${minutes}`);

    setNewSessionRoom(
      c?.room_name ||
        (locale === 'ar'
          ? `الفوج أ (دفعة ${new Date().getFullYear()})`
          : locale === 'en'
          ? `Group A (Promotion ${new Date().getFullYear()})`
          : `Groupe A (Promotion ${new Date().getFullYear()})`)
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
        // Refresh sessions list and attendance matrix
        const updatedCourseRes = await fetch(`/api/schedule/attendance?course_id=${activeCourse.id}`);
        const updatedCourseData = await updatedCourseRes.json();
        setCourseSessions(updatedCourseData.sessions || []);
        setAttendanceMatrix(updatedCourseData.attendanceMatrix || []);

        // Load the new session's roster
        await loadSessionRoster(data.session_id);

        setAttendanceSuccessMsg(
          locale === 'ar'
            ? 'تم إنشاء قائمة الحضور الجديدة بنجاح! يمكنك الآن تسجيل حضور الطلاب.'
            : locale === 'en'
            ? 'New attendance sheet created successfully! You can now mark student attendance.'
            : 'Nouvelle liste d\'appel créée avec succès ! Vous pouvez maintenant faire l\'appel.'
        );
        setTimeout(() => setAttendanceSuccessMsg(''), 4000);

        loadTeacherData();
      } else {
        alert(
          data.error ||
          (locale === 'ar'
            ? 'حدث خطأ أثناء إنشاء الحصة'
            : locale === 'en'
            ? 'Error creating session'
            : 'Erreur lors de la création de la séance')
        );
      }
    } catch (err) {
      console.error(err);
      alert(locale === 'ar' ? 'خطأ في الاتصال بالشبكة' : locale === 'en' ? 'Network error' : 'Erreur réseau');
    } finally {
      setCreatingSession(false);
    }
  };

  // Mark single student attendance (works both in single session and full matrix)
  const handleMarkAttendance = async (studentId: number, status: string, sessionIdOverride?: number) => {
    const sId = sessionIdOverride || selectedSessionId;
    if (!sId) return;

    try {
      const res = await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sId,
          student_id: studentId,
          status,
        }),
      });

      const data = await res.json();

      // 1. Update active session records if current session is selected
      if (sId === selectedSessionId) {
        setActiveSessionRecords((prev) =>
          prev.map((rec) =>
            rec.student_id === studentId
              ? { ...rec, attendance_status: status === 'reset' ? null : status }
              : rec
          )
        );
      }

      // 2. Update attendanceMatrix state
      setAttendanceMatrix((prev) => {
        const existingIdx = prev.findIndex((m) => m.session_id === sId && m.student_id === studentId);
        if (status === 'reset') {
          return prev.filter((_, idx) => idx !== existingIdx);
        }
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], status };
          return updated;
        } else {
          return [...prev, { session_id: sId, student_id: studentId, status, recorded_at: new Date().toISOString() }];
        }
      });

      // 3. Update courseSessions tallies
      if (data.counts) {
        setCourseSessions((prev) =>
          prev.map((s) => {
            if (s.id === sId) {
              return {
                ...s,
                present_count: data.counts.present_count,
                absent_count: data.counts.absent_count,
                late_count: data.counts.late_count,
                excused_count: data.counts.excused_count,
                total_recorded: data.counts.total_recorded,
              };
            }
            return s;
          })
        );
      }

      setAttendanceSuccessMsg(
        locale === 'ar'
          ? 'تم تسجيل الحضور وحفظه في السجل بنجاح'
          : locale === 'en'
          ? 'Attendance recorded and saved successfully'
          : 'Présence enregistrée et conservée avec succès'
      );
      setTimeout(() => setAttendanceSuccessMsg(''), 2500);

      if (editingCell) {
        setEditingCell(null);
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  };

  // Mark all students present in one click
  const handleMarkAllPresent = async (sessionIdOverride?: number) => {
    const sId = sessionIdOverride || selectedSessionId;
    if (!sId) return;
    setSavingAttendance(true);

    try {
      const res = await fetch('/api/schedule/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_present',
          session_id: sId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (sId === selectedSessionId) {
          setActiveSessionRecords((prev) =>
            prev.map((rec) => ({ ...rec, attendance_status: 'present' }))
          );
        }

        // Update attendanceMatrix for this session
        setAttendanceMatrix((prev) => {
          const studentIds = courseStudents.map((s) => s.id);
          const otherRecords = prev.filter((m) => m.session_id !== sId);
          const newRecords = studentIds.map((sid) => ({
            session_id: sId,
            student_id: sid,
            status: 'present',
            recorded_at: new Date().toISOString(),
          }));
          return [...otherRecords, ...newRecords];
        });

        if (data.counts) {
          setCourseSessions((prev) =>
            prev.map((s) => (s.id === sId ? { ...s, ...data.counts } : s))
          );
        }

        setAttendanceSuccessMsg(
          locale === 'ar'
            ? 'تم تأكيد حضور جميع طلاب الفوج لهذه الحصة وحفظها !'
            : locale === 'en'
            ? 'All students marked present for this session and saved!'
            : 'Tous les étudiants ont été marqués présents et enregistrés pour cette séance !'
        );
        setTimeout(() => setAttendanceSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error bulk marking present:', err);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Export full attendance sheet to CSV (Excel compatible)
  const handleExportCSV = () => {
    if (!activeCourse || courseStudents.length === 0) return;

    const headers = [
      locale === 'ar' ? 'رقم الطالب' : locale === 'en' ? 'Student ID' : 'ID Etudiant',
      locale === 'ar' ? 'اسم الطالب' : locale === 'en' ? 'Student Name' : 'Nom Etudiant',
      locale === 'ar' ? 'البريد الإلكتروني' : locale === 'en' ? 'Email' : 'Email',
      locale === 'ar' ? 'الهاتف' : locale === 'en' ? 'Phone' : 'Telephone',
      ...courseSessions.map((s, idx) => `S${idx + 1} (${s.start_time ? s.start_time.split(' ')[0] : ''})`),
      locale === 'ar' ? 'إجمالي الحضور' : locale === 'en' ? 'Total Attended' : 'Total Presences',
      locale === 'ar' ? 'نسبة الحضور %' : locale === 'en' ? 'Attendance Rate %' : 'Taux Presence %',
      locale === 'ar' ? 'الأهلية للشهادة' : locale === 'en' ? 'Eligibility' : 'Eligibilite',
    ];

    const rows = courseStudents.map((stud) => {
      let attendedCount = 0;
      const sessionStatuses = courseSessions.map((sess) => {
        const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
        const st = rec ? rec.status : 'unrecorded';
        if (st === 'present' || st === 'late') attendedCount++;
        return st;
      });

      const totalSess = courseSessions.length;
      const rate = totalSess > 0 ? Math.round((attendedCount / totalSess) * 100) : 0;
      const eligibility = rate >= 80 ? 'Certified' : rate >= 60 ? 'Warning' : 'Ineligible';

      return [
        stud.id,
        `"${(stud.name || '').replace(/"/g, '""')}"`,
        stud.email || '',
        stud.phone || '',
        ...sessionStatuses,
        `${attendedCount}/${totalSess}`,
        `${rate}%`,
        eligibility,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeTitle = (activeCourse.title_en || activeCourse.title_fr || 'course').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Fassi7_Attendance_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print attendance register
  const handlePrintRegister = () => {
    window.print();
  };

  // Export full attendance matrix to PDF
  const handleExportPDF = () => {
    if (!activeCourse || courseStudents.length === 0) return;

    const courseTitle = locale === 'ar' ? (activeCourse.title_ar || activeCourse.title_fr) : locale === 'en' ? (activeCourse.title_en || activeCourse.title_fr) : (activeCourse.title_fr || activeCourse.title_en);
    const headers = [
      '#',
      locale === 'ar' ? 'اسم الطالب' : locale === 'en' ? 'Student Name' : 'Nom Étudiant',
      locale === 'ar' ? 'الهاتف' : locale === 'en' ? 'Phone' : 'Téléphone',
      ...courseSessions.map((_, idx) => `S${idx + 1}`),
      locale === 'ar' ? 'الحضور' : locale === 'en' ? 'Attendance' : 'Total',
      locale === 'ar' ? 'النسبة %' : locale === 'en' ? 'Rate %' : 'Taux %',
      locale === 'ar' ? 'الشهادة' : locale === 'en' ? 'Certificate' : 'Éligibilité'
    ];

    const rows = courseStudents.map((stud, idx) => {
      let attendedCount = 0;
      const sessionCols = courseSessions.map((sess) => {
        const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
        const st = rec ? rec.status : 'unrecorded';
        if (st === 'present' || st === 'late') attendedCount++;
        const symbol = st === 'present' ? '✓' : st === 'late' ? '⏱' : st === 'excused' ? 'E' : st === 'absent' ? '✗' : '—';
        return {
          content: symbol,
          align: 'center' as const,
          badge: (st === 'present' ? 'success' : st === 'absent' ? 'danger' : st === 'late' ? 'warning' : 'default') as 'success' | 'danger' | 'warning' | 'default'
        };
      });

      const totalSess = courseSessions.length;
      const rate = totalSess > 0 ? Math.round((attendedCount / totalSess) * 100) : 0;
      const isEligible = rate >= 80;

      return [
        String(idx + 1),
        { content: stud.name || '—', align: (locale === 'ar' ? 'right' : 'left') as 'right' | 'left' },
        stud.phone || '—',
        ...sessionCols,
        `${attendedCount}/${totalSess}`,
        `${rate}%`,
        { 
          content: isEligible 
            ? (locale === 'ar' ? 'مؤهل للشهادة' : locale === 'en' ? 'Eligible' : 'Certifié') 
            : (locale === 'ar' ? 'غير مستوفٍ' : locale === 'en' ? 'Not Eligible' : 'Non éligible'), 
          badge: (isEligible ? 'success' : 'warning') as 'success' | 'warning'
        }
      ];
    });

    exportTableToPDF({
      title: locale === 'ar' 
        ? `سجل ومصفوفة الحضور: ${courseTitle}` 
        : locale === 'en'
        ? `Roll Call & Attendance Matrix: ${courseTitle}`
        : `Registre Matriciel d'Assiduité: ${courseTitle}`,
      subtitle: `${user?.name || (locale === 'ar' ? 'د. يوسف بلقاسم' : 'Dr. Youcef Belkacem')} • ${courseSessions.length} ${locale === 'ar' ? 'حصص منجزة' : locale === 'en' ? 'sessions recorded' : 'séances enregistrées'} • ${courseStudents.length} ${locale === 'ar' ? 'طالب مسجل' : locale === 'en' ? 'students' : 'apprenants'}`,
      docReference: `FS-ATT-CRS${activeCourse.id}-${new Date().getFullYear()}`,
      locale,
      orientation: 'landscape',
      summaryPills: [
        { label: locale === 'ar' ? 'إجمالي الحصص' : locale === 'en' ? 'Total Sessions' : 'Total Séances', value: courseSessions.length },
        { label: locale === 'ar' ? 'الطلاب' : locale === 'en' ? 'Roster' : 'Effectif', value: courseStudents.length },
        { label: locale === 'ar' ? 'الحد الأدنى للشهادة' : locale === 'en' ? 'Certificate Minimum' : 'Seuil Requis', value: '80%', color: '#16A34A' }
      ],
      headers,
      rows,
      notes: locale === 'ar'
        ? 'الرموز: (✓) حاضر • (✗) غائب • (⏱) متأخر • (E) معذور. يتطلب تسليم الشهادة 80% حضور كحد أدنى.'
        : locale === 'en'
        ? 'Legend: (✓) Present • (✗) Absent • (⏱) Late • (E) Excused. Minimum attendance required for certificate: 80%.'
        : 'Légende: (✓) Présent • (✗) Absent • (⏱) En retard • (E) Justifié. Taux minimal requis pour l\'attestation : 80%.'
    });
  };

  // Filtered students for full course view
  const filteredStudents = useMemo(() => {
    return courseStudents.filter((stud) => {
      const matchSearch =
        fullCourseSearch.trim() === '' ||
        stud.name.toLowerCase().includes(fullCourseSearch.toLowerCase()) ||
        stud.email.toLowerCase().includes(fullCourseSearch.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;

      let attended = 0;
      courseSessions.forEach((sess) => {
        const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
        if (rec && (rec.status === 'present' || rec.status === 'late')) attended++;
      });
      const totalSess = courseSessions.length;
      const rate = totalSess > 0 ? (attended / totalSess) * 100 : 0;

      if (statusFilter === 'certified') return rate >= 80;
      if (statusFilter === 'warning') return rate >= 60 && rate < 80;
      if (statusFilter === 'critical') return rate < 60;
      return true;
    });
  }, [courseStudents, courseSessions, attendanceMatrix, fullCourseSearch, statusFilter]);

  // Overall course attendance rate calculation
  const overallCourseStats = useMemo(() => {
    if (courseSessions.length === 0 || courseStudents.length === 0) {
      return { avgRate: 0, eligibleCount: 0, totalPresents: 0, totalPossible: 0 };
    }

    let totalPresents = 0;
    let eligibleCount = 0;

    courseStudents.forEach((stud) => {
      let studPresents = 0;
      courseSessions.forEach((sess) => {
        const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
        if (rec && (rec.status === 'present' || rec.status === 'late')) {
          studPresents++;
          totalPresents++;
        }
      });
      const studRate = (studPresents / courseSessions.length) * 100;
      if (studRate >= 80) eligibleCount++;
    });

    const totalPossible = courseSessions.length * courseStudents.length;
    const avgRate = totalPossible > 0 ? Math.round((totalPresents / totalPossible) * 100) : 0;

    return { avgRate, eligibleCount, totalPresents, totalPossible };
  }, [courseSessions, courseStudents, attendanceMatrix]);

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
                    {locale === 'ar' ? 'فضاء الأستاذ المعتمد' : locale === 'en' ? 'Certified Instructor Portal' : 'Portail Enseignant Certifié'}
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
                    {locale === 'ar' ? 'نظام الحضور الشامل والمتعدد' : locale === 'en' ? 'Master Attendance & Session Tracking' : 'Suivi continu & Registre général'}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, color: '#3D1B0D' }}>
                  {locale === 'ar' ? `مرحباً بك أستاذ، ${user?.name}` : locale === 'en' ? `Welcome, Pr. ${user?.name}` : `Bienvenue, Pr. ${user?.name}`}
                </h1>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.9rem', color: '#7A6258' }}>
                  {user?.email} • {locale === 'ar' ? 'تسجيل الحضور المستمر وعرض السجل الشامل لكل حصص الدورة' : locale === 'en' ? 'Session-by-session roll call and complete course attendance register' : 'Appel séance par séance et consultation du registre complet d\'émargement'}
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
                  {locale === 'ar' ? 'التخصصات والدورات' : locale === 'en' ? 'Assigned Courses' : 'Formations'}
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
                  {locale === 'ar' ? 'إجمالي الحصص المنجزة' : locale === 'en' ? 'Total Sessions' : 'Séances d\'Appel'}
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
      <section style={{ padding: '2.5rem 0', flex: 1 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Left: Courses and Attendance Registers */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <BookOpen size={22} color="#FA461D" />
                  <h2 style={{ fontSize: '1.45rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                    {locale === 'ar' ? 'دوراتي وقوائم الحضور التراكمية' : locale === 'en' ? 'My Courses & Attendance Sheets' : 'Mes Formations & Feuilles de Présence'}
                  </h2>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#8C6F5A' }}>
                  {locale === 'ar'
                    ? 'اختر دورة لفتح سجل الحضور الشامل أو تسجيل حصة جديدة'
                    : locale === 'en'
                    ? 'Click any course to take roll call or view full course attendance'
                    : 'Cliquez sur une formation pour faire l\'appel ou ouvrir le registre complet'}
                </span>
              </div>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#8C6F5A' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid #FA461D',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem auto',
                    }}
                  />
                  {locale === 'ar' ? 'جاري تحميل الدورات وقوائم الحضور...' : locale === 'en' ? 'Loading courses and attendance sheets...' : 'Chargement des formations et feuilles d\'appel...'}
                </div>
              ) : courses.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    border: '1px solid #EADBCE',
                  }}
                >
                  <Calendar size={48} color="#D1C2B8" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', color: '#3D1B0D', margin: '0 0 0.5rem 0' }}>
                    {locale === 'ar' ? 'لا توجد دورات مسندة حالياً' : locale === 'en' ? 'No courses assigned yet' : 'Aucune formation assignée'}
                  </h3>
                  <p style={{ color: '#7A6258', margin: 0, fontSize: '0.9rem' }}>
                    {locale === 'ar'
                      ? 'ستظهر هنا المقررات المعتمدة المسندة إليك لإجراء الحضور المستمر.'
                      : locale === 'en'
                      ? 'Courses assigned to you for session tracking will appear here.'
                      : 'Les formations qui vous sont attribuées apparaîtront ici.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {courses.map((course) => {
                    const courseSched = sessions.filter((s) => s.course_id === course.id);
                    const enrolledCount = course.enrolled_count || 0;
                    const localizedTitle = getLocalizedCourseTitle(course, locale);
                    const localizedLevel = getLocalizedCourseLevel(course.level, locale);
                    const languageLabel =
                      locale === 'ar'
                        ? course.language_name_ar
                        : locale === 'en'
                        ? course.language_name_en || course.language_name_fr
                        : course.language_name_fr;

                    return (
                      <div
                        key={course.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          border: '1.5px solid #EADBCE',
                          padding: '1.6rem',
                          boxShadow: '0 4px 16px rgba(61, 27, 13, 0.04)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                              <span
                                style={{
                                  backgroundColor: '#FFF0EA',
                                  color: '#FA461D',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '8px',
                                }}
                              >
                                {course.flag_emoji} {languageLabel}
                              </span>
                              <span
                                style={{
                                  backgroundColor: '#F0F9FF',
                                  color: '#0369A1',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '8px',
                                }}
                              >
                                {localizedLevel}
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
                                👥 {enrolledCount} {locale === 'ar' ? 'طالب مؤكد' : locale === 'en' ? 'confirmed students' : 'étudiants confirmés'}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.4rem 0', color: '#3D1B0D' }}>
                              {localizedTitle}
                            </h3>

                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#7A6258' }}>
                              {course.duration_weeks
                                ? (locale === 'ar'
                                    ? `${course.duration_weeks} أسابيع • ${course.hours_total || 40} ساعة إجمالاً`
                                    : locale === 'en'
                                    ? `${course.duration_weeks} weeks • ${course.hours_total || 40}h total`
                                    : `${course.duration_weeks} semaines • ${course.hours_total || 40}h au total`)
                                : (locale === 'ar' ? 'برنامج معتمد من فصيح' : locale === 'en' ? 'Fassi7 Certified Program' : 'Programme certifiant Fassi7')}
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
                              {locale === 'ar' ? 'قوائم الحضور المسجلة' : locale === 'en' ? 'Recorded Sessions' : 'Séances enregistrées'}
                            </span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FA461D' }}>
                              {courseSched.length} {locale === 'ar' ? 'حصص' : locale === 'en' ? 'session(s)' : 'séance(s)'}
                            </span>
                          </div>
                        </div>

                        {/* Recent sessions chips */}
                        {courseSched.length > 0 && (
                          <div style={{ marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '0.76rem', color: '#8C6F5A', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                              {locale === 'ar' ? 'آخر الحصص المسجلة:' : locale === 'en' ? 'Recent attendance sheets:' : 'Dernières feuilles d\'appel :'}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {courseSched.slice(-3).map((cs) => (
                                <button
                                  key={cs.id}
                                  type="button"
                                  onClick={() => openCourseAttendanceHub(course, cs.id, 'roster')}
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
                                  <span>{locale === 'ar' ? (cs.title_ar || cs.title_fr) : locale === 'en' ? (cs.title_en || cs.title_fr) : cs.title_fr}</span>
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
                            {/* Button 1: Daily Session Roll Call */}
                            <button
                              type="button"
                              onClick={() => openCourseAttendanceHub(course, undefined, 'roster')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: '#FA461D',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.65rem 1.15rem',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(250, 70, 29, 0.25)',
                              }}
                            >
                              <UserCheck size={16} />
                              <span>{locale === 'ar' ? 'تسجيل حضور حصة' : locale === 'en' ? 'Session Roll Call' : 'Faire l\'Appel par Séance'}</span>
                            </button>

                            {/* Button 2: FULL COURSE ATTENDANCE REGISTER */}
                            <button
                              type="button"
                              onClick={() => openCourseAttendanceHub(course, undefined, 'full_course')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: '#1E293B',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.65rem 1.15rem',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(30, 41, 59, 0.25)',
                              }}
                            >
                              <FileSpreadsheet size={16} color="#38BDF8" />
                              <span>{locale === 'ar' ? 'سجل الحضور الشامل للدورة' : locale === 'en' ? 'Full Course Attendance' : 'Registre Général d\'Émargement'}</span>
                            </button>

                            {/* Button 3: Add new session */}
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
                              <span>{locale === 'ar' ? 'إضافة حصة جديدة' : locale === 'en' ? '+ New Session' : '+ Nouvelle Séance'}</span>
                            </button>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#8C6F5A' }}>
                            {locale === 'ar'
                              ? 'يتم حفظ جميع التغييرات تلقائياً في السجل الأكاديمي'
                              : locale === 'en'
                              ? 'All marks are saved persistently to academic records'
                              : 'Tous les enregistrements sont sauvegardés automatiquement'}
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
                  {locale === 'ar' ? 'دليل إدارة الحضور المتكرر' : locale === 'en' ? 'Continuous Attendance Guide' : 'Gestion du Suivi Continu'}
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
                      {locale === 'ar' ? 'قائمة جديدة لكل حصة' : locale === 'en' ? 'New Sheet per Session' : 'Une nouvelle liste pour chaque cours'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.5 }}>
                      {locale === 'ar'
                        ? 'في كل حصة، اضغط على «+ إضافة حصة جديدة» لتحميل كافة الطلاب المسجلين بالفوج تلقائياً.'
                        : locale === 'en'
                        ? 'For each lecture, click "+ New Session" to automatically load all registered students.'
                        : 'À chaque séance de cours, cliquez sur « + Nouvelle Séance » pour charger l\'ensemble des étudiants confirmés du groupe.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#ECFDF5',
                      color: '#065F46',
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
                      {locale === 'ar' ? 'حفظ الحضور فوراً واسترجاعه' : locale === 'en' ? 'Persistent Save & Review' : 'Enregistrement & Horodatage'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.5 }}>
                      {locale === 'ar'
                        ? 'حدد حالة الطالب (حاضر، متأخر، معذور، غائب) أو اضغط «تأكيد حضور الجميع». كل اختيار يُحفظ فوراً في قاعدة البيانات ويمكنك مراجعته دائماً.'
                        : locale === 'en'
                        ? 'Mark each student (Present, Late, Excused, Absent) or click "Mark All Present". Every change is saved immediately to the database.'
                        : 'Définissez le statut de chaque étudiant ou utilisez le bouton « Tout marquer Présent ». Chaque choix est enregistré en temps réel et consultable à tout moment.'}
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
                      {locale === 'ar' ? 'السجل الشامل للدورة وطباعته' : locale === 'en' ? 'Master Course Attendance & Print' : 'Registre Général & Impression'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.5 }}>
                      {locale === 'ar'
                        ? 'في نهاية الدورة أو بأي وقت، افتح «سجل الحضور الشامل» لعرض جدول كامل بكافة الحصص والنسب، مع إمكانية الطباعة الرسمية وتصدير إكسل.'
                        : locale === 'en'
                        ? 'At any time or at course completion, open the "Full Course Attendance" view to see all sessions in one master grid, print official sheets, or export to Excel.'
                        : 'À la fin du cours ou à tout moment, ouvrez le « Registre Général » pour visualiser la matrice complète de toutes les séances, imprimer la feuille officielle ou exporter en Excel.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MULTI-SESSION & MASTER ATTENDANCE MODAL */}
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
              maxWidth: hubView === 'full_course' ? '1200px' : '900px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(61, 27, 13, 0.3)',
              border: '1px solid #EADBCE',
              overflow: 'hidden',
              transition: 'max-width 0.2s ease',
            }}
          >
            {/* Modal Top Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
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
                    {activeCourse.flag_emoji}{' '}
                    {locale === 'ar'
                      ? activeCourse.language_name_ar
                      : locale === 'en'
                      ? activeCourse.language_name_en || activeCourse.language_name_fr
                      : activeCourse.language_name_fr}
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
                    {getLocalizedCourseLevel(activeCourse.level, locale)}
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
                    👥 {courseStudents.length} {locale === 'ar' ? 'طالب مؤكد' : locale === 'en' ? 'confirmed students' : 'étudiants confirmés'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                  {getLocalizedCourseTitle(activeCourse, locale)}
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

            {/* Main Navigation Tab Bar inside Modal */}
            <div
              style={{
                padding: '0.75rem 1.75rem',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #F0DFD3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              {/* Primary View Switcher Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Tab: Session Roll Call */}
                <button
                  type="button"
                  onClick={() => {
                    setHubView('roster');
                    if (courseSessions.length > 0 && !selectedSessionId) {
                      loadSessionRoster(courseSessions[courseSessions.length - 1].id);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: hubView === 'roster' ? '1.5px solid #FA461D' : '1px solid #E5E7EB',
                    backgroundColor: hubView === 'roster' ? '#FFF2EE' : '#F9FAFB',
                    color: hubView === 'roster' ? '#FA461D' : '#4B5563',
                  }}
                >
                  <UserCheck size={15} />
                  <span>{locale === 'ar' ? 'تفقد الحضور اليومي' : locale === 'en' ? 'Session Roll Call' : 'Feuille d\'Appel (Séance)'}</span>
                </button>

                {/* Tab: FULL MASTER ATTENDANCE REGISTER */}
                <button
                  type="button"
                  onClick={() => setHubView('full_course')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: hubView === 'full_course' ? '1.5px solid #0284C7' : '1px solid #E5E7EB',
                    backgroundColor: hubView === 'full_course' ? '#F0F9FF' : '#F9FAFB',
                    color: hubView === 'full_course' ? '#0369A1' : '#4B5563',
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>{locale === 'ar' ? 'سجل الحضور الشامل للدورة' : locale === 'en' ? 'Full Course Attendance' : 'Registre Général du Cours'}</span>
                </button>

                {/* Tab: Stats */}
                <button
                  type="button"
                  onClick={() => setHubView('stats')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: hubView === 'stats' ? '1.5px solid #3D1B0D' : '1px solid #E5E7EB',
                    backgroundColor: hubView === 'stats' ? '#3D1B0D' : '#F9FAFB',
                    color: hubView === 'stats' ? '#FFFFFF' : '#4B5563',
                  }}
                >
                  <TrendingUp size={15} />
                  <span>{locale === 'ar' ? 'إحصائيات الالتزام' : locale === 'en' ? 'Overview' : 'Statistiques'}</span>
                </button>
              </div>

              {/* Action Button: Add New Session */}
              <div>
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
                    padding: '0.5rem 0.95rem',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Plus size={15} />
                  <span>{locale === 'ar' ? 'إضافة حصة جديدة' : locale === 'en' ? '+ New Attendance Sheet' : '+ Nouvelle Feuille d\'Appel'}</span>
                </button>
              </div>
            </div>

            {/* When in Roster mode: Secondary bar for Session Selector Carousel */}
            {hubView === 'roster' && courseSessions.length > 0 && (
              <div
                style={{
                  padding: '0.65rem 1.75rem',
                  backgroundColor: '#FBF9F7',
                  borderBottom: '1px solid #F0DFD3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  overflowX: 'auto',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {locale === 'ar' ? 'اختر الحصة:' : locale === 'en' ? 'Select Session:' : 'Séance :'}
                </span>
                {courseSessions.map((sess, idx) => {
                  const isSelected = selectedSessionId === sess.id;
                  const dateSnippet = sess.start_time ? sess.start_time.split(' ')[0] : '';
                  const sessionLabel =
                    (locale === 'ar' ? sess.title_ar : sess.title_fr)?.split(' - ')[0] ||
                    (locale === 'ar' ? `الحصة ${idx + 1}` : locale === 'en' ? `Session ${idx + 1}` : `Séance ${idx + 1}`);

                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => loadSessionRoster(sess.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        border: isSelected ? '1.5px solid #FA461D' : '1px solid #E5E7EB',
                        backgroundColor: isSelected ? '#FA461D' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#4B5563',
                      }}
                    >
                      <Clock size={12} />
                      <span>{sessionLabel}</span>
                      {dateSnippet && (
                        <span style={{ fontSize: '0.7rem', opacity: isSelected ? 0.9 : 0.7 }}>
                          ({dateSnippet.slice(5)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

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

            {/* Modal Body */}
            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
              {/* VIEW 1: FULL COURSE MASTER ATTENDANCE REGISTER */}
              {hubView === 'full_course' && (
                <div>
                  {/* Top KPI Cards for full course */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.85rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#0369A1', fontWeight: 700, display: 'block' }}>
                        {locale === 'ar' ? 'إجمالي الحصص المنظمة' : locale === 'en' ? 'Total Sessions' : 'Séances Totales'}
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7' }}>
                        {courseSessions.length}
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, display: 'block' }}>
                        {locale === 'ar' ? 'معدل الحضور العام للفوج' : locale === 'en' ? 'Overall Attendance Rate' : 'Taux Global de Présence'}
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16A34A' }}>
                        {overallCourseStats.avgRate}%
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 700, display: 'block' }}>
                        {locale === 'ar' ? 'المؤهلون للشهادة (≥80%)' : locale === 'en' ? 'Certificate Eligible (≥80%)' : 'Éligibles Certificat (≥80%)'}
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#D97706' }}>
                        {overallCourseStats.eligibleCount} / {courseStudents.length}
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#FFF2EE', border: '1px solid #FFCCBC', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#FA461D', fontWeight: 700, display: 'block' }}>
                        {locale === 'ar' ? 'الطلاب المقيدون' : locale === 'en' ? 'Enrolled Students' : 'Étudiants Inscrits'}
                      </span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FA461D' }}>
                        {courseStudents.length}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Search Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      backgroundColor: '#FFF9F4',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #EADBCE',
                    }}
                  >
                    {/* Search student */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '240px', flex: 1 }}>
                      <Search size={16} color="#8C6F5A" />
                      <input
                        type="text"
                        value={fullCourseSearch}
                        onChange={(e) => setFullCourseSearch(e.target.value)}
                        placeholder={
                          locale === 'ar'
                            ? 'بحث عن طالب بالاسم أو البريد...'
                            : locale === 'en'
                            ? 'Search student by name or email...'
                            : 'Rechercher un étudiant par nom ou email...'
                        }
                        style={{
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: '0.85rem',
                          width: '100%',
                          color: '#3D1B0D',
                        }}
                      />
                    </div>

                    {/* Filter status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#374151',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="all">{locale === 'ar' ? 'جميع الطلاب' : locale === 'en' ? 'All Students' : 'Tous les étudiants'}</option>
                        <option value="certified">{locale === 'ar' ? 'المؤهلون للشهادة (≥80%)' : locale === 'en' ? 'Eligible (≥80%)' : 'Éligibles (≥80%)'}</option>
                        <option value="warning">{locale === 'ar' ? 'تحذير غياب (60-79%)' : locale === 'en' ? 'Warning (60-79%)' : 'Avertissement (60-79%)'}</option>
                        <option value="critical">{locale === 'ar' ? 'غير مؤهلين (<60%)' : locale === 'en' ? 'Critical (<60%)' : 'Non validé (<60%)'}</option>
                      </select>

                      {/* Print Official Sheet Button */}
                      <button
                        type="button"
                        onClick={handlePrintRegister}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#FFFFFF',
                          color: '#1E293B',
                          border: '1.5px solid #CBD5E1',
                          borderRadius: '8px',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                        title={locale === 'ar' ? 'طباعة السجل الرسمي للحضور' : locale === 'en' ? 'Print Official Attendance Register' : 'Imprimer la Fiche d\'Émargement'}
                      >
                        <Printer size={14} />
                        <span>{locale === 'ar' ? 'طباعة السجل' : locale === 'en' ? 'Print Register' : 'Imprimer'}</span>
                      </button>

                      {/* Export Dropdown with CSV & PDF */}
                      <ExportDropdown
                        onExportCSV={handleExportCSV}
                        onExportPDF={handleExportPDF}
                      />
                    </div>
                  </div>

                  {/* MASTER ATTENDANCE MATRIX TABLE */}
                  {courseStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px dashed #E5D5C8' }}>
                      <Users size={36} color="#C4B0A0" style={{ marginBottom: '0.5rem' }} />
                      <h4 style={{ margin: 0, color: '#3D1B0D' }}>
                        {locale === 'ar' ? 'لا يوجد طلاب مسجلون في هذه الدورة بعد' : locale === 'en' ? 'No students enrolled in this course yet' : 'Aucun étudiant inscrit dans cette formation'}
                      </h4>
                    </div>
                  ) : courseSessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px dashed #E5D5C8' }}>
                      <Calendar size={36} color="#C4B0A0" style={{ marginBottom: '0.5rem' }} />
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#3D1B0D' }}>
                        {locale === 'ar' ? 'لم يتم إنشاء أي حصة لهذه الدورة بعد' : locale === 'en' ? 'No sessions created yet for this course' : 'Aucune séance enregistrée pour cette formation'}
                      </h4>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#8C6F5A' }}>
                        {locale === 'ar' ? 'ابدأ بإنشاء أول حصة تفقد حضور للفوج.' : locale === 'en' ? 'Start by creating your first session roll call.' : 'Commencez par créer la première séance d\'appel.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => openNewSessionForm()}
                        className="btn-primary btn-sm"
                      >
                        <Plus size={15} />
                        <span>{locale === 'ar' ? 'إنشاء أول حصة الآن' : locale === 'en' ? 'Create First Session' : 'Créer la Première Séance'}</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #EADBCE' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8F5F1', borderBottom: '2px solid #EADBCE' }}>
                            <th style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: 900, color: '#3D1B0D', minWidth: '220px' }}>
                              {locale === 'ar' ? 'الطالب' : locale === 'en' ? 'Student' : 'Étudiant'}
                            </th>
                            {courseSessions.map((sess, sIdx) => {
                              const dateStr = sess.start_time ? sess.start_time.split(' ')[0] : '';
                              return (
                                <th
                                  key={sess.id}
                                  style={{
                                    padding: '0.75rem 0.65rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 900,
                                    color: '#3D1B0D',
                                    textAlign: 'center',
                                    minWidth: '95px',
                                    borderInline: '1px solid #F0E6DD',
                                  }}
                                  title={`${sess.title_fr} - ${sess.start_time}`}
                                >
                                  <div style={{ whiteSpace: 'nowrap' }}>
                                    {locale === 'ar' ? `الحصة ${sIdx + 1}` : locale === 'en' ? `Session ${sIdx + 1}` : `S${sIdx + 1}`}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#8C6F5A', fontWeight: 600 }}>
                                    {dateStr ? dateStr.slice(5) : ''}
                                  </div>
                                </th>
                              );
                            })}
                            <th style={{ padding: '0.85rem 0.85rem', fontSize: '0.8rem', fontWeight: 900, color: '#3D1B0D', textAlign: 'center', minWidth: '95px' }}>
                              {locale === 'ar' ? 'الحضور' : locale === 'en' ? 'Attended' : 'Présences'}
                            </th>
                            <th style={{ padding: '0.85rem 0.85rem', fontSize: '0.8rem', fontWeight: 900, color: '#3D1B0D', textAlign: 'center', minWidth: '95px' }}>
                              {locale === 'ar' ? 'النسبة' : locale === 'en' ? 'Rate' : 'Taux'}
                            </th>
                            <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 900, color: '#3D1B0D', textAlign: 'center', minWidth: '130px' }}>
                              {locale === 'ar' ? 'الأهلية للشهادة' : locale === 'en' ? 'Certificate Status' : 'Statut Certificat'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((stud, rIdx) => {
                            let attended = 0;
                            const totalSess = courseSessions.length;

                            courseSessions.forEach((sess) => {
                              const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
                              if (rec && (rec.status === 'present' || rec.status === 'late')) {
                                attended++;
                              }
                            });

                            const rate = totalSess > 0 ? Math.round((attended / totalSess) * 100) : 0;
                            const cleanPhone = stud.phone ? stud.phone.replace(/[^0-9]/g, '') : '';

                            return (
                              <tr
                                key={stud.id}
                                style={{
                                  borderBottom: '1px solid #F0DFD3',
                                  backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#FCFAF7',
                                  transition: 'background-color 0.15s',
                                }}
                              >
                                {/* Student Info Column */}
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <div
                                      style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '8px',
                                        backgroundColor: '#3D1B0D',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {stud.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#3D1B0D' }}>
                                          {stud.name}
                                        </span>
                                        {cleanPhone && (
                                          <a
                                            href={`https://wa.me/${cleanPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#25D366' }}
                                            title="WhatsApp"
                                          >
                                            <MessageCircle size={13} />
                                          </a>
                                        )}
                                      </div>
                                      <span style={{ fontSize: '0.74rem', color: '#8C6F5A', display: 'block' }}>
                                        {stud.email}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Session Attendance Cells */}
                                {courseSessions.map((sess) => {
                                  const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
                                  const currentStatus = rec ? rec.status : null;

                                  const cellBg =
                                    currentStatus === 'present'
                                      ? '#DCFCE7'
                                      : currentStatus === 'late'
                                      ? '#FEF3C7'
                                      : currentStatus === 'excused'
                                      ? '#E0F2FE'
                                      : currentStatus === 'absent'
                                      ? '#FEE2E2'
                                      : '#F3F4F6';

                                  const cellColor =
                                    currentStatus === 'present'
                                      ? '#166534'
                                      : currentStatus === 'late'
                                      ? '#92400E'
                                      : currentStatus === 'excused'
                                      ? '#0369A1'
                                      : currentStatus === 'absent'
                                      ? '#991B1B'
                                      : '#6B7280';

                                  const cellBorder =
                                    currentStatus === 'present'
                                      ? '#86EFAC'
                                      : currentStatus === 'late'
                                      ? '#FCD34D'
                                      : currentStatus === 'excused'
                                      ? '#BAE6FD'
                                      : currentStatus === 'absent'
                                      ? '#FCA5A5'
                                      : '#E5E7EB';

                                  const cellLabel =
                                    currentStatus === 'present'
                                      ? (locale === 'ar' ? 'حاضر' : locale === 'en' ? 'Present' : 'Présent')
                                      : currentStatus === 'late'
                                      ? (locale === 'ar' ? 'متأخر' : locale === 'en' ? 'Late' : 'Retard')
                                      : currentStatus === 'excused'
                                      ? (locale === 'ar' ? 'معذور' : locale === 'en' ? 'Excused' : 'Excusé')
                                      : currentStatus === 'absent'
                                      ? (locale === 'ar' ? 'غائب' : locale === 'en' ? 'Absent' : 'Absent')
                                      : '-';

                                  return (
                                    <td
                                      key={sess.id}
                                      style={{
                                        padding: '0.6rem 0.4rem',
                                        textAlign: 'center',
                                        borderInline: '1px solid #F0E6DD',
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingCell({
                                            studentId: stud.id,
                                            sessionId: sess.id,
                                            studentName: stud.name,
                                            sessionTitle: sess.title_fr,
                                            currentStatus,
                                          })
                                        }
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '0.3rem 0.55rem',
                                          borderRadius: '6px',
                                          fontSize: '0.74rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          backgroundColor: cellBg,
                                          color: cellColor,
                                          border: `1px solid ${cellBorder}`,
                                          minWidth: '65px',
                                          transition: 'transform 0.1s',
                                        }}
                                        title={locale === 'ar' ? 'اضغط لتعديل حضور هذا الطالب في هذه الحصة' : locale === 'en' ? 'Click to change attendance' : 'Cliquez pour modifier la présence'}
                                      >
                                        {currentStatus === 'present' && '✓ '}
                                        {currentStatus === 'late' && '⏳ '}
                                        {currentStatus === 'excused' && 'ℹ️ '}
                                        {currentStatus === 'absent' && '✕ '}
                                        <span>{cellLabel}</span>
                                      </button>
                                    </td>
                                  );
                                })}

                                {/* Attended Count */}
                                <td style={{ padding: '0.75rem 0.65rem', textAlign: 'center', fontWeight: 900, fontSize: '0.88rem', color: '#3D1B0D' }}>
                                  {attended} / {totalSess}
                                </td>

                                {/* Attendance Percentage */}
                                <td style={{ padding: '0.75rem 0.65rem', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '0.25rem 0.6rem',
                                      borderRadius: '999px',
                                      fontWeight: 900,
                                      fontSize: '0.8rem',
                                      backgroundColor: rate >= 80 ? '#DCFCE7' : rate >= 60 ? '#FEF3C7' : '#FEE2E2',
                                      color: rate >= 80 ? '#166534' : rate >= 60 ? '#92400E' : '#991B1B',
                                    }}
                                  >
                                    {rate}%
                                  </span>
                                </td>

                                {/* Certificate Status Badge */}
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                  {rate >= 80 ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '8px',
                                        backgroundColor: '#ECFDF5',
                                        color: '#065F46',
                                        fontSize: '0.76rem',
                                        fontWeight: 800,
                                      }}
                                    >
                                      <Award size={13} />
                                      {locale === 'ar' ? 'مؤهل للشهادة' : locale === 'en' ? 'Eligible' : 'Validé'}
                                    </span>
                                  ) : rate >= 60 ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '8px',
                                        backgroundColor: '#FFFBEB',
                                        color: '#B45309',
                                        fontSize: '0.76rem',
                                        fontWeight: 800,
                                      }}
                                    >
                                      <AlertCircle size={13} />
                                      {locale === 'ar' ? 'تحذير غياب' : locale === 'en' ? 'Warning' : 'Attention'}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: '8px',
                                        backgroundColor: '#FEF2F2',
                                        color: '#B91C1C',
                                        fontSize: '0.76rem',
                                        fontWeight: 800,
                                      }}
                                    >
                                      ✕ {locale === 'ar' ? 'غير مؤهل' : locale === 'en' ? 'Ineligible' : 'Non validé'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Summary Footer Row */}
                        <tfoot>
                          <tr style={{ backgroundColor: '#F8F5F1', borderTop: '2px solid #EADBCE', fontWeight: 900 }}>
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#3D1B0D' }}>
                              {locale === 'ar' ? 'نسبة حضور كل حصة:' : locale === 'en' ? 'Session Presence Rate:' : 'Taux de présence / séance :'}
                            </td>
                            {courseSessions.map((sess) => {
                              const presentInSess = attendanceMatrix.filter(
                                (m) => m.session_id === sess.id && (m.status === 'present' || m.status === 'late')
                              ).length;
                              const sessRate = courseStudents.length > 0 ? Math.round((presentInSess / courseStudents.length) * 100) : 0;
                              return (
                                <td
                                  key={sess.id}
                                  style={{
                                    padding: '0.75rem 0.5rem',
                                    textAlign: 'center',
                                    fontSize: '0.76rem',
                                    color: '#0369A1',
                                    borderInline: '1px solid #F0E6DD',
                                  }}
                                >
                                  {sessRate}%
                                </td>
                              );
                            })}
                            <td colSpan={3} style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#166534' }}>
                              {locale === 'ar' ? `المعدل العام للدورة: ${overallCourseStats.avgRate}%` : locale === 'en' ? `Overall Course Average: ${overallCourseStats.avgRate}%` : `Moyenne Globale: ${overallCourseStats.avgRate}%`}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: FORM TO CREATE A NEW SESSION / ATTENDANCE SHEET */}
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
                      {locale === 'ar' ? 'إنشاء قائمة حضور لحصة جديدة' : locale === 'en' ? 'Create New Attendance Sheet (Session)' : 'Créer une Nouvelle Liste d\'Appel (Séance)'}
                    </h4>
                  </div>

                  <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#7A6258' }}>
                    {locale === 'ar'
                      ? 'حدد موعد الحصة وعنوانها، وسيتم تحميل كافة الطلاب المؤكدين في الدورة تلقائياً لإجراء الحضور.'
                      : locale === 'en'
                      ? 'Enter the session date and title. All confirmed students will be automatically loaded for roll call.'
                      : 'Indiquez la date et le titre de la séance. Tous les étudiants confirmés de ce cours seront automatiquement chargés pour l\'appel.'}
                  </p>

                  <form onSubmit={handleCreateNewSession}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#3D1B0D', marginBottom: '0.35rem' }}>
                          {locale === 'ar' ? 'عنوان الحصة / الرقم' : locale === 'en' ? 'Session Title / Number' : 'Titre / Numéro de la séance'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={newSessionTitle}
                          onChange={(e) => setNewSessionTitle(e.target.value)}
                          className="form-input"
                          placeholder={
                            locale === 'ar'
                              ? 'مثال: الحصة 2 - محادثة وتطبيق'
                              : locale === 'en'
                              ? 'e.g., Session 2 - Speaking & Practice'
                              : 'Ex: Séance 2 - Expression orale'
                          }
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#3D1B0D', marginBottom: '0.35rem' }}>
                          {locale === 'ar' ? 'تاريخ ووقت الحصة' : locale === 'en' ? 'Date & Time' : 'Date et Heure'} *
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
                          {locale === 'ar' ? 'الفوج / القاعة' : locale === 'en' ? 'Group / Room' : 'Groupe / Salle'}
                        </label>
                        <input
                          type="text"
                          value={newSessionRoom}
                          onChange={(e) => setNewSessionRoom(e.target.value)}
                          className="form-input"
                          placeholder={
                            locale === 'ar'
                              ? 'مثال: الفوج أ (أكتوبر 2026)'
                              : locale === 'en'
                              ? 'e.g., Group A (October 2026)'
                              : 'Ex: Groupe A (Octobre 2026)'
                          }
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
                          {locale === 'ar' ? 'إلغاء' : locale === 'en' ? 'Cancel' : 'Annuler'}
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
                          ? (locale === 'ar' ? 'جاري الإنشاء...' : locale === 'en' ? 'Creating...' : 'Création en cours...')
                          : (locale === 'ar' ? 'إنشاء وبدء تسجيل الحضور' : locale === 'en' ? 'Create & Start Roll Call' : 'Créer & Commencer l\'Appel')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* VIEW 3: STATS OVERVIEW ACROSS SESSIONS */}
              {hubView === 'stats' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'التقرير التراكمي لالتزام الطلاب' : locale === 'en' ? 'Cumulative Student Attendance Summary' : 'Synthèse Globale d\'Assiduité des Étudiants'}
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: '#8C6F5A', fontWeight: 600 }}>
                      {courseSessions.length} {locale === 'ar' ? 'حصص منجزة' : locale === 'en' ? 'sessions completed' : 'séances enregistrées'}
                    </span>
                  </div>

                  {courseStudents.length === 0 ? (
                    <p style={{ color: '#8C6F5A' }}>
                      {locale === 'ar' ? 'لا يوجد طلاب مؤكدون بعد.' : locale === 'en' ? 'No confirmed students yet.' : 'Aucun étudiant confirmé.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {courseStudents.map((stud) => {
                        const cleanPhone = stud.phone ? stud.phone.replace(/[^0-9]/g, '') : '';
                        let studPresents = 0;
                        courseSessions.forEach((sess) => {
                          const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
                          if (rec && (rec.status === 'present' || rec.status === 'late')) studPresents++;
                        });
                        const rate = courseSessions.length > 0 ? Math.round((studPresents / courseSessions.length) * 100) : 0;

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

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
                                  backgroundColor: rate >= 80 ? '#ECFDF5' : rate >= 60 ? '#FFFBEB' : '#FEF2F2',
                                  color: rate >= 80 ? '#065F46' : rate >= 60 ? '#B45309' : '#B91C1C',
                                }}
                              >
                                {studPresents} / {courseSessions.length} ({rate}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 4: ROSTER FOR CURRENTLY SELECTED SESSION */}
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
                      {locale === 'ar' ? 'جاري تحميل قائمة الطلاب...' : locale === 'en' ? 'Loading student roster...' : 'Chargement de la liste des étudiants...'}
                    </div>
                  ) : !activeSession ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#FFF9F4', borderRadius: '16px' }}>
                      <p style={{ color: '#8C6F5A', margin: '0 0 1rem 0' }}>
                        {locale === 'ar'
                          ? 'لم تقم بإنشاء أي حصة بعد. انقر على «إضافة حصة جديدة» للبدء.'
                          : locale === 'en'
                          ? 'No session selected. Click "+ New Attendance Sheet" to get started.'
                          : 'Aucune séance d\'appel n\'est sélectionnée. Cliquez sur « + Nouvelle Liste d\'Appel » pour démarrer.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => openNewSessionForm()}
                        className="btn-primary btn-sm"
                      >
                        <Plus size={16} />
                        <span>{locale === 'ar' ? 'إضافة أول حصة الآن' : locale === 'en' ? 'Create 1st session roll call' : 'Créer la 1ère séance d\'appel'}</span>
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
                            {(locale === 'ar' ? activeSession.title_ar : activeSession.title_fr) || activeSession.title_fr} • 📅 {activeSession.start_time}
                          </span>
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.82rem', fontWeight: 800, flexWrap: 'wrap' }}>
                            <span style={{ color: '#2E7D32' }}>✓ {locale === 'ar' ? 'حاضرون' : locale === 'en' ? 'Present' : 'Présents'} : {presentCount}</span>
                            <span style={{ color: '#C62828' }}>✕ {locale === 'ar' ? 'غائبون' : locale === 'en' ? 'Absent' : 'Absents'} : {absentCount}</span>
                            <span style={{ color: '#D97706' }}>⏳ {locale === 'ar' ? 'متأخرون' : locale === 'en' ? 'Late' : 'Retards'} : {lateCount}</span>
                            <span style={{ color: '#0284C7' }}>ℹ️ {locale === 'ar' ? 'معذورون' : locale === 'en' ? 'Excused' : 'Excusés'} : {excusedCount}</span>
                          </div>
                        </div>

                        {/* Bulk action: Tout Marquer Présent */}
                        <button
                          type="button"
                          onClick={() => handleMarkAllPresent()}
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
                          <span>{locale === 'ar' ? 'تأكيد حضور الجميع' : locale === 'en' ? 'Mark All Present' : 'Tout marquer Présent'}</span>
                        </button>
                      </div>

                      {/* Students List */}
                      {activeSessionRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1.5px dashed #E5D5C8' }}>
                          <Users size={32} color="#C4B0A0" style={{ marginBottom: '0.5rem' }} />
                          <h4 style={{ margin: '0 0 0.35rem 0', color: '#3D1B0D' }}>
                            {locale === 'ar' ? 'لا يوجد طلاب مؤكدون في هذا الكورس حالياً' : locale === 'en' ? 'No confirmed students in this course yet' : 'Aucun étudiant confirmé dans ce cours'}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#8C6F5A' }}>
                            {locale === 'ar'
                              ? 'بمجرد أن تؤكد الإدارة تسجيل الطلاب، سيظهرون تلقائياً في هذه القائمة.'
                              : locale === 'en'
                              ? 'Once the administration confirms student registrations, they will automatically appear here.'
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
                                      : currentStatus === 'excused'
                                      ? '#F0F9FF'
                                      : '#FFFFFF',
                                  borderRadius: '12px',
                                  border:
                                    currentStatus === 'present'
                                      ? '1.5px solid #86EFAC'
                                      : currentStatus === 'absent'
                                      ? '1.5px solid #FCA5A5'
                                      : currentStatus === 'late'
                                      ? '1.5px solid #FCD34D'
                                      : currentStatus === 'excused'
                                      ? '1.5px solid #BAE6FD'
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
                                          title="WhatsApp"
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
                                    ✓ {locale === 'ar' ? 'حاضر' : locale === 'en' ? 'Present' : 'Présent'}
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
                                    ⏳ {locale === 'ar' ? 'متأخر' : locale === 'en' ? 'Late' : 'Retard'}
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
                                    ℹ️ {locale === 'ar' ? 'معذور' : locale === 'en' ? 'Excused' : 'Excusé'}
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
                                    ✕ {locale === 'ar' ? 'غائب' : locale === 'en' ? 'Absent' : 'Absent'}
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
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#8C6F5A' }}>
                {locale === 'ar'
                  ? 'يتم تخزين جميع السجلات محلياً وفورياً لضمان الحفظ والمتابعة الدائمة'
                  : locale === 'en'
                  ? 'All attendance sheets and marks are saved persistently to academic records'
                  : 'Toutes les feuilles et statuts d\'émargement sont conservés de manière pérenne'}
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
                {locale === 'ar' ? 'إغلاق السجل' : locale === 'en' ? 'Close Sheet' : 'Fermer la feuille'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK INLINE CELL EDITOR MODAL (When clicking any cell in Full Attendance Matrix) */}
      {editingCell && (
        <div
          onClick={() => setEditingCell(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#1E293B' }}>
                  {editingCell.studentName}
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {editingCell.sessionTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#475569' }}>
              {locale === 'ar' ? 'اختر حالة الحضور لهذا الطالب في هذه الحصة:' : locale === 'en' ? 'Select attendance status for this session:' : 'Définissez le statut de présence pour cette séance :'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => handleMarkAttendance(editingCell.studentId, 'present', editingCell.sessionId)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: editingCell.currentStatus === 'present' ? '2px solid #16A34A' : '1px solid #BBF7D0',
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                }}
              >
                ✓ {locale === 'ar' ? 'حاضر' : locale === 'en' ? 'Present' : 'Présent'}
              </button>

              <button
                type="button"
                onClick={() => handleMarkAttendance(editingCell.studentId, 'late', editingCell.sessionId)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: editingCell.currentStatus === 'late' ? '2px solid #D97706' : '1px solid #FDE68A',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                }}
              >
                ⏳ {locale === 'ar' ? 'متأخر' : locale === 'en' ? 'Late' : 'Retard'}
              </button>

              <button
                type="button"
                onClick={() => handleMarkAttendance(editingCell.studentId, 'excused', editingCell.sessionId)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: editingCell.currentStatus === 'excused' ? '2px solid #0284C7' : '1px solid #BAE6FD',
                  backgroundColor: '#E0F2FE',
                  color: '#0369A1',
                }}
              >
                ℹ️ {locale === 'ar' ? 'معذور' : locale === 'en' ? 'Excused' : 'Excusé'}
              </button>

              <button
                type="button"
                onClick={() => handleMarkAttendance(editingCell.studentId, 'absent', editingCell.sessionId)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: editingCell.currentStatus === 'absent' ? '2px solid #DC2626' : '1px solid #FECACA',
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                }}
              >
                ✕ {locale === 'ar' ? 'غائب' : locale === 'en' ? 'Absent' : 'Absent'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
              <button
                type="button"
                onClick={() => handleMarkAttendance(editingCell.studentId, 'reset', editingCell.sessionId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {locale === 'ar' ? 'إلغاء التحديد (لم يسجل)' : locale === 'en' ? 'Reset (Unrecorded)' : 'Effacer (Non noté)'}
              </button>

              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="btn-outline btn-sm"
              >
                {locale === 'ar' ? 'إغلاق' : locale === 'en' ? 'Close' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-SPECIFIC CSS RULES & OFFICIAL ACADEMIC PRINTABLE SHEET */}
      <style jsx global>{`
        @media screen {
          #print-section {
            display: none !important;
          }
        }
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          nav, footer, .modal-overlay, button, input, select, section {
            display: none !important;
          }
          #print-section {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm !important;
          }
          #print-section table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #print-section th, #print-section td {
            border: 1px solid #333333 !important;
            padding: 6px 8px !important;
            color: #000000 !important;
          }
          #print-section th {
            background-color: #f3f4f6 !important;
          }
        }
      `}</style>

      {/* HIDDEN PRINT-SECTION: TRIGGERED ONLY WHEN PRINTING */}
      {activeCourse && (
        <div id="print-section">
          {/* Academy Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                FASSI7 LANGUAGE ACADEMY
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#333333' }}>
                Direction Pédagogique & Contrôle de l'Assiduité Académique
              </p>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: '#555555' }}>
                Registre Officiel d'Émargement et de Suivi de Présence Continue
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>
                Année Académique {new Date().getFullYear()} / {new Date().getFullYear() + 1}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#666666', display: 'block' }}>
                Édité le {new Date().toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR')}
              </span>
            </div>
          </div>

          {/* Course Details Block */}
          <div style={{ border: '1px solid #CCCCCC', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#FAFAFA' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                  Formation & Niveau
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 900 }}>
                  {getLocalizedCourseTitle(activeCourse, locale)} ({getLocalizedCourseLevel(activeCourse.level, locale)})
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                  Enseignant Titulaire
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 900 }}>
                  {user?.name || 'Dr. Youcef Belkacem'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                  Volume & Séances
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 900 }}>
                  {courseSessions.length} Séances Enregistrées • {courseStudents.length} Étudiants
                </span>
              </div>
            </div>
          </div>

          {/* Printable Matrix Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr>
                <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  {locale === 'ar' ? 'اسم الطالب الكامل' : locale === 'en' ? 'Student Full Name' : "Nom & Prénom de l'Étudiant"}
                </th>
                <th style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}>
                  {locale === 'ar' ? 'الاتصال / البريد' : locale === 'en' ? 'Contact / Email' : 'Contact / Email'}
                </th>
                {courseSessions.map((sess, idx) => (
                  <th key={sess.id} style={{ textAlign: 'center', width: '55px', fontSize: '0.75rem' }}>
                    {locale === 'ar' ? `ح${idx + 1}` : `S${idx + 1}`}
                    <div style={{ fontSize: '0.65rem', fontWeight: 'normal' }}>
                      {sess.start_time ? sess.start_time.split(' ')[0].slice(5) : ''}
                    </div>
                  </th>
                ))}
                <th style={{ textAlign: 'center', width: '70px' }}>
                  {locale === 'ar' ? 'المجموع' : locale === 'en' ? 'Total' : 'Total'}
                </th>
                <th style={{ textAlign: 'center', width: '65px' }}>
                  {locale === 'ar' ? 'النسبة' : locale === 'en' ? 'Rate' : 'Taux'}
                </th>
                <th style={{ textAlign: 'center', width: '90px' }}>
                  {locale === 'ar' ? 'الشهادة' : locale === 'en' ? 'Certificate' : 'Certificat'}
                </th>
                <th style={{ textAlign: 'center', width: '110px' }}>
                  {locale === 'ar' ? 'التوقيع' : locale === 'en' ? 'Signature' : 'Émargement'}
                </th>
              </tr>
            </thead>
            <tbody>
              {courseStudents.map((stud, idx) => {
                let attended = 0;
                courseSessions.forEach((sess) => {
                  const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
                  if (rec && (rec.status === 'present' || rec.status === 'late')) attended++;
                });
                const totalS = courseSessions.length;
                const rate = totalS > 0 ? Math.round((attended / totalS) * 100) : 0;
                const isCertified = rate >= 80;

                return (
                  <tr key={stud.id}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 800, textAlign: locale === 'ar' ? 'right' : 'left' }}>{stud.name}</td>
                    <td style={{ fontSize: '0.78rem', textAlign: locale === 'ar' ? 'right' : 'left' }}>{stud.email}</td>
                    {courseSessions.map((sess) => {
                      const rec = attendanceMatrix.find((m) => m.session_id === sess.id && m.student_id === stud.id);
                      const st = rec ? rec.status : '-';
                      const markText =
                        st === 'present' ? 'P' : st === 'late' ? 'R' : st === 'excused' ? 'E' : st === 'absent' ? 'A' : '-';
                      return (
                        <td key={sess.id} style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          {markText}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 800 }}>
                      {attended} / {totalS}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 900 }}>
                      {rate}%
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.78rem' }}>
                      {isCertified ? (locale === 'ar' ? 'مؤهل' : locale === 'en' ? 'Passed' : 'Validé') : rate >= 60 ? (locale === 'ar' ? 'إنذار' : locale === 'en' ? 'Warning' : 'Avert.') : (locale === 'ar' ? 'غير مؤهل' : locale === 'en' ? 'Failed' : 'Ajourné')}
                    </td>
                    <td style={{ textAlign: 'center' }}></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Légende */}
          <div style={{ fontSize: '0.75rem', color: '#555555', marginBottom: '2.5rem' }}>
            <strong>{locale === 'ar' ? 'دليل الرموز :' : locale === 'en' ? 'Legend:' : 'Légende :'}</strong>{' '}
            {locale === 'ar'
              ? 'P = حاضر (✓) • R = متأخر (⏳) • E = معذور (ℹ️) • A = غائب (✕) • شرط الحصول على شهادة فصيح الرسمية: نسبة حضور لا تقل عن 80%.'
              : locale === 'en'
              ? 'P = Present (✓) • R = Late (⏳) • E = Excused (ℹ️) • A = Absent (✕) • Fassi7 Official Certificate Requirement: Minimum 80% attendance.'
              : "P = Présent (✓) • R = Retard (⏳) • E = Excusé (ℹ️) • A = Absent (✕) • Condition d'obtention de l'Attestation Officielle Fassi7 : Assiduité minimale de 80%."}
          </div>

          {/* Official Signatures Block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '2rem' }}>
            <div style={{ borderTop: '1px solid #333333', paddingTop: '0.75rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>
                {locale === 'ar' ? 'توقيع الأستاذ / المكوّن' : locale === 'en' ? 'Instructor Signature' : 'Signature du Formateur / Enseignant'}
              </span>
              <p style={{ margin: '0.2rem 0 3rem 0', fontSize: '0.78rem', color: '#666666' }}>
                {user?.name || (locale === 'ar' ? 'د. يوسف بلقاسم' : 'Dr. Youcef Belkacem')}
              </p>
            </div>
            <div style={{ borderTop: '1px solid #333333', paddingTop: '0.75rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>
                {locale === 'ar' ? 'تأشيرة وخاتم الإدارة البيداغوجية' : locale === 'en' ? 'Academic Administration Seal & Stamp' : 'Visa & Cachet de la Direction Pédagogique'}
              </span>
              <p style={{ margin: '0.2rem 0 3rem 0', fontSize: '0.78rem', color: '#666666' }}>
                {locale === 'ar' ? 'أكاديمية فصيح للغات - الجزائر' : locale === 'en' ? 'Fassi7 Language Academy - Algiers' : 'Fassi7 Language Academy - Alger'}
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

