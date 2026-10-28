'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  Edit2,
  X,
  Phone,
  Mail,
  MapPin,
  Eye,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Filter,
  Sparkles,
  Check,
  Award,
} from 'lucide-react';
import {
  getLocalizedCourseTitle,
  getLocalizedCourseLevel,
} from '@/lib/courseHelpers';
import { ExportDropdown } from '@/components/ExportDropdown';
import { exportTableToPDF } from '@/lib/exportHelpers';

export default function StudentsManagePage() {
  const { t, locale, dir } = useLanguage();

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'by_course' | 'all_students'
  const [viewMode, setViewMode] = useState<'by_course' | 'all_students'>('by_course');

  // Selected Course (when in by_course mode)
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Filters
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState<string>('all');

  // Modal Add / Edit Basic Profile
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Alger');
  const [adminNotes, setAdminNotes] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Course pre-selection for new student
  const [targetCourseId, setTargetCourseId] = useState<number | null>(null);

  // Student Full Dossier Modal
  const [selectedStudentDossier, setSelectedStudentDossier] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<number | null>(null);
  const [dossierSuccessMsg, setDossierSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/courses'),
      ]);

      const sData = await sRes.json();
      const cData = await cRes.json();

      const studentList = sData.students || [];
      const courseList = cData.courses || [];

      setStudents(studentList);
      setCourses(courseList);

      // If a student dossier is currently open, refresh their data
      if (selectedStudentDossier) {
        const updated = studentList.find((s: any) => s.id === selectedStudentDossier.id);
        if (updated) {
          setSelectedStudentDossier(updated);
        }
      }

      // If a course is currently selected, refresh its object
      if (selectedCourse) {
        const updatedCourse = courseList.find((c: any) => c.id === selectedCourse.id);
        if (updatedCourse) {
          setSelectedCourse(updatedCourse);
        }
      }
    } catch (err) {
      console.error('Error loading students and courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = (courseId?: number) => {
    setEditingStudent(null);
    setName('');
    setEmail('');
    setPhone('');
    setCity('Alger');
    setAdminNotes('');
    setLearningGoals('');
    setTargetCourseId(courseId || (selectedCourse ? selectedCourse.id : null));
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingStudent(s);
    setName(s.name);
    setEmail(s.email);
    setPhone(s.phone || '');
    setCity(s.city || 'Alger');
    setAdminNotes(s.admin_notes || '');
    setLearningGoals(s.learning_goals || '');
    setTargetCourseId(null);
    setError('');
    setIsModalOpen(true);
  };

  const openStudentDossier = (student: any) => {
    setSelectedStudentDossier(student);
    setSelectedCourseId(student.enrollments?.[0]?.id || null);
    setDossierSuccessMsg('');
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      id: editingStudent ? editingStudent.id : undefined,
      name,
      email,
      phone,
      city,
      admin_notes: adminNotes,
      learning_goals: learningGoals,
    };

    try {
      const res = await fetch('/api/students', {
        method: editingStudent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        // If a new student was created and targetCourseId is set, enroll them automatically
        if (!editingStudent && targetCourseId && data.id) {
          const selectedC = courses.find((c) => c.id === targetCourseId);
          await fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: data.id,
              course_id: targetCourseId,
              amount_due: selectedC?.price || 20000,
              payment_method: 'baridimob',
              notes: 'Inscrit via le panneau d\'administration',
            }),
          });
        }

        setIsModalOpen(false);
        loadData();
      } else {
        setError(data.error || (locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : locale === 'en' ? 'An error occurred while saving' : 'Erreur lors de l\'enregistrement'));
      }
    } catch {
      setError(locale === 'ar' ? 'خطأ في الاتصال بالشبكة' : locale === 'en' ? 'Network error' : 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEnrollmentStatus = async (enrollmentId: number, newStatus: string) => {
    setUpdatingEnrollmentId(enrollmentId);
    setDossierSuccessMsg('');

    try {
      const res = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: enrollmentId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        await loadData();
        if (newStatus === 'confirmed') {
          setDossierSuccessMsg(
            locale === 'ar'
              ? '✓ تم تأكيد تسجيل الطالب بنجاح! يظهر الآن تلقائياً في قائمة حضور الأستاذ لهذا الفوج.'
              : locale === 'en'
              ? '✓ Registration confirmed! This student now automatically appears in the instructor\'s roll call sheet.'
              : '✓ Inscription validée et confirmée ! Cet étudiant apparaît désormais automatiquement dans la feuille de présence de l\'enseignant.'
          );
        } else {
          setDossierSuccessMsg(
            locale === 'ar'
              ? `تم تحديث حالة التسجيل إلى (${newStatus}) بنجاح.`
              : locale === 'en'
              ? `Enrollment status updated to "${newStatus}" successfully.`
              : `Statut mis à jour vers "${newStatus}" avec succès.`
          );
        }
      } else {
        alert(locale === 'ar' ? 'فشل تحديث الحالة' : locale === 'en' ? 'Failed to update status.' : 'Erreur lors de la mise à jour du statut.');
      }
    } catch (err) {
      console.error('Error updating enrollment status:', err);
    } finally {
      setUpdatingEnrollmentId(null);
    }
  };

  const handleSettleBalance = async (student: any, enrollment?: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const amountToSettle = enrollment ? (enrollment.amount_due - enrollment.amount_paid) : student.balance;
    if (amountToSettle <= 0) return;

    const confirmMsg =
      locale === 'ar'
        ? `هل تريد تأكيد تسوية رصيد الطالب (${student.name}) بقيمة (${amountToSettle?.toLocaleString()} د.ج)؟`
        : locale === 'en'
        ? `Are you sure you want to mark the remaining balance of ${amountToSettle?.toLocaleString()} DZD for ${student.name} as Settled?`
        : `Confirmer le règlement intégral du solde (${amountToSettle?.toLocaleString()} DZD) pour ${student.name} ?`;

    if (!confirm(confirmMsg)) return;

    try {
      const targetEnr = enrollment || student.enrollments?.[0];
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          enrollment_id: targetEnr?.id || null,
          course_id: targetEnr?.course_id || null,
          amount: amountToSettle,
          payment_method: 'baridimob',
          reference_number: `REGLE-${Date.now().toString().slice(-6)}`,
          status: 'paid',
          notes: 'Solde entièrement réglé par l\'administration / Settled by Admin',
        }),
      });

      if (res.ok) {
        await loadData();
        setDossierSuccessMsg(
          locale === 'ar' ? '✓ تم تسوية الرصيد بنجاح!' : locale === 'en' ? '✓ Balance settled successfully!' : '✓ Solde réglé avec succès !'
        );
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء تسوية الرصيد' : locale === 'en' ? 'Error settling student balance.' : 'Erreur lors de la mise à jour du solde.');
      }
    } catch (err) {
      console.error('Error settling balance:', err);
    }
  };

  const exportToCSV = (courseSpecific?: any) => {
    const targetStudents = courseSpecific
      ? students.filter((s) => s.enrollments?.some((e: any) => e.course_id === courseSpecific.id))
      : students;

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'City',
      courseSpecific ? 'Course_Status' : 'Enrolled_Courses',
      'Amount_Due_DZD',
      'Amount_Paid_DZD',
      'Balance_DZD',
    ];

    const rows = targetStudents.map((s) => {
      const enr = courseSpecific
        ? s.enrollments?.find((e: any) => e.course_id === courseSpecific.id)
        : null;

      return [
        s.id,
        `"${s.name}"`,
        s.email,
        `"${s.phone || ''}"`,
        `"${s.city || ''}"`,
        courseSpecific
          ? enr?.status || 'enrolled'
          : `"${(s.enrollments || []).map((e: any) => `${e.title_fr} (${e.status})`).join('; ')}"`,
        enr ? enr.amount_due : s.total_due || 0,
        enr ? enr.amount_paid : s.total_paid || 0,
        enr ? (enr.amount_due - enr.amount_paid) : s.balance || 0,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = courseSpecific
      ? `fassi7_students_${(courseSpecific.title_en || courseSpecific.title_fr).replace(/[^a-zA-Z0-9]/g, '_')}.csv`
      : `fassi7_all_students_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (courseSpecific?: any) => {
    const targetStudents = courseSpecific
      ? students.filter((s) => s.enrollments?.some((e: any) => e.course_id === courseSpecific.id))
      : students;

    const courseTitle = courseSpecific ? getLocalizedCourseTitle(courseSpecific, locale) : '';
    const title = courseSpecific
      ? (locale === 'ar' ? `كشف حضور وطلبة فوج: ${courseTitle}` : locale === 'en' ? `Student Roster: ${courseTitle}` : `Registre & Liste d'Émargement: ${courseTitle}`)
      : (locale === 'ar' ? 'السجل العام لطلاب أكاديمية فصيح' : locale === 'en' ? 'Master Student Directory' : 'Annuaire Général des Apprenants');

    const subtitle = courseSpecific
      ? `${courseSpecific.flag_emoji || '🌐'} ${locale === 'ar' ? courseSpecific.language_name_ar : locale === 'en' ? (courseSpecific.language_name_en || courseSpecific.language_name_fr) : (courseSpecific.language_name_fr || '')} • ${locale === 'ar' ? 'المستوى' : locale === 'en' ? 'Level' : 'Niveau'} ${courseSpecific.level || ''} • ${targetStudents.length} ${locale === 'ar' ? 'طالب مسجل' : locale === 'en' ? 'enrolled students' : 'apprenants inscrits'}`
      : `${targetStudents.length} ${locale === 'ar' ? 'طالب مسجل في كافة التخصصات' : locale === 'en' ? 'total registered students' : 'apprenants inscrits au total'}`;

    const headers = courseSpecific
      ? [
          '#',
          locale === 'ar' ? 'اسم الطالب' : locale === 'en' ? 'Student Name' : 'Apprenant',
          locale === 'ar' ? 'الهاتف' : locale === 'en' ? 'Phone' : 'Téléphone',
          locale === 'ar' ? 'المدينة' : locale === 'en' ? 'City' : 'Ville',
          locale === 'ar' ? 'حالة التسجيل' : locale === 'en' ? 'Status' : 'Statut',
          locale === 'ar' ? 'المستحقات (دج)' : locale === 'en' ? 'Tuition (DZD)' : 'Frais (DZD)',
          locale === 'ar' ? 'المدفوع (دج)' : locale === 'en' ? 'Paid (DZD)' : 'Payé (DZD)',
          locale === 'ar' ? 'التوقيع / الحضور' : locale === 'en' ? 'Signature / Roll Call' : 'Émargement / Présence'
        ]
      : [
          '#',
          locale === 'ar' ? 'اسم الطالب' : locale === 'en' ? 'Student Name' : 'Apprenant',
          locale === 'ar' ? 'البريد / الهاتف' : locale === 'en' ? 'Contact' : 'Contact',
          locale === 'ar' ? 'المدينة' : locale === 'en' ? 'City' : 'Ville',
          locale === 'ar' ? 'الدورات المسجلة' : locale === 'en' ? 'Enrolled Courses' : 'Formations Inscription',
          locale === 'ar' ? 'المبلغ المستحق' : locale === 'en' ? 'Total Due (DZD)' : 'Frais DZD',
          locale === 'ar' ? 'المدفوع' : locale === 'en' ? 'Paid (DZD)' : 'Payé DZD',
          locale === 'ar' ? 'الرصيد المتبقي' : locale === 'en' ? 'Balance (DZD)' : 'Solde DZD'
        ];

    const confirmedCount = targetStudents.filter(s => {
      if (courseSpecific) {
        const enr = s.enrollments?.find((e: any) => e.course_id === courseSpecific.id);
        return enr?.status === 'confirmed';
      }
      return s.enrollments?.some((e: any) => e.status === 'confirmed');
    }).length;

    const totalDue = targetStudents.reduce((sum, s) => {
      if (courseSpecific) {
        const enr = s.enrollments?.find((e: any) => e.course_id === courseSpecific.id);
        return sum + (enr?.amount_due || 0);
      }
      return sum + (s.total_due || 0);
    }, 0);

    const totalPaid = targetStudents.reduce((sum, s) => {
      if (courseSpecific) {
        const enr = s.enrollments?.find((e: any) => e.course_id === courseSpecific.id);
        return sum + (enr?.amount_paid || 0);
      }
      return sum + (s.total_paid || 0);
    }, 0);

    const rows = targetStudents.map((s, index) => {
      const enr = courseSpecific
        ? s.enrollments?.find((e: any) => e.course_id === courseSpecific.id)
        : null;

      const st = enr ? enr.status : (s.enrollments?.[0]?.status || 'enrolled');
      const badgeType: 'success' | 'warning' | 'info' | 'default' =
        st === 'confirmed' ? 'success' : st === 'awaiting_payment' ? 'warning' : 'info';
      const statusLabel =
        st === 'confirmed'
          ? (locale === 'ar' ? 'مؤكد' : locale === 'en' ? 'Confirmed' : 'Confirmé')
          : st === 'awaiting_payment'
          ? (locale === 'ar' ? 'في انتظار الدفع' : locale === 'en' ? 'Awaiting Payment' : 'Attente paiement')
          : (locale === 'ar' ? 'قيد المراجعة' : locale === 'en' ? 'Under Review' : 'En examen');

      if (courseSpecific) {
        return [
          String(index + 1),
          { content: s.name, align: locale === 'ar' ? 'right' : 'left' as const },
          s.phone || '—',
          s.city || '—',
          { content: statusLabel, badge: badgeType },
          (enr?.amount_due || 0).toLocaleString(),
          (enr?.amount_paid || 0).toLocaleString(),
          { content: '_______________', align: 'center' as const }
        ];
      }

      return [
        String(index + 1),
        { content: s.name, align: locale === 'ar' ? 'right' : 'left' as const },
        `${s.email}${s.phone ? ` • ${s.phone}` : ''}`,
        s.city || '—',
        (s.enrollments || []).map((e: any) => `${e.title_fr} (${e.status})`).join(', ') || (locale === 'ar' ? 'لا يوجد' : locale === 'en' ? 'None' : 'Aucune'),
        (s.total_due || 0).toLocaleString(),
        (s.total_paid || 0).toLocaleString(),
        (s.balance || 0).toLocaleString()
      ];
    });

    exportTableToPDF({
      title,
      subtitle,
      docReference: `FS-STU-${courseSpecific ? `CRS${courseSpecific.id}` : 'ALL'}-${new Date().getFullYear()}`,
      locale,
      orientation: 'landscape',
      summaryPills: [
        { label: locale === 'ar' ? 'إجمالي الطلاب' : locale === 'en' ? 'Total Students' : 'Total Apprenants', value: targetStudents.length },
        { label: locale === 'ar' ? 'الطلاب المؤكدون' : locale === 'en' ? 'Confirmed' : 'Confirmés', value: confirmedCount, color: '#16A34A' },
        { label: locale === 'ar' ? 'المبلغ الإجمالي' : locale === 'en' ? 'Total Tuition' : 'Total Frais', value: `${totalDue.toLocaleString()} DZD`, color: '#3D1B0D' },
        { label: locale === 'ar' ? 'المبلغ المحصل' : locale === 'en' ? 'Total Collected' : 'Total Encaissé', value: `${totalPaid.toLocaleString()} DZD`, color: '#0369A1' }
      ],
      headers,
      rows,
      notes: courseSpecific
        ? (locale === 'ar'
            ? 'هذه القائمة تمثل كشف الحضور والتسجيل الرسمي للفوج. يرجى توقيع كل طالب عند بداية كل حصة.'
            : locale === 'en'
            ? 'Official cohort roster and attendance sheet. Students must sign at the beginning of each session.'
            : 'Ce registre officiel fait foi pour l\'émargement et le suivi d\'assiduité pédagogique de ce groupe.')
        : undefined
    });
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'confirmed':
        return { label: locale === 'ar' ? 'مؤكد (نشط)' : locale === 'en' ? 'Confirmed (Active)' : 'Confirmé', bg: '#DEF7EC', color: '#03543F', border: '#BCF0DA' };
      case 'accepted':
        return { label: locale === 'ar' ? 'مقبول' : locale === 'en' ? 'Accepted' : 'Accepté', bg: '#E1EFFE', color: '#1E429F', border: '#B4C6FC' };
      case 'awaiting_payment':
        return { label: locale === 'ar' ? 'في انتظار الدفع' : locale === 'en' ? 'Awaiting Payment' : 'Attente paiement', bg: '#FEF08A', color: '#854D0E', border: '#FDE047' };
      case 'under_review':
        return { label: locale === 'ar' ? 'قيد المراجعة' : locale === 'en' ? 'Under Review' : 'En examen', bg: '#FFF0EB', color: '#C2410C', border: '#FED7AA' };
      case 'completed':
        return { label: locale === 'ar' ? 'أكمل الدورة' : locale === 'en' ? 'Completed' : 'Terminé', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
      case 'cancelled':
        return { label: locale === 'ar' ? 'ملغى' : locale === 'en' ? 'Cancelled' : 'Annulé', bg: '#FDE8E8', color: '#9B1C1C', border: '#F8B4B4' };
      default:
        return { label: st, bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
    }
  };

  const getPaymentStatusBadge = (pst: string) => {
    switch (pst) {
      case 'paid':
        return { label: locale === 'ar' ? 'مدفوع بالكامل' : locale === 'en' ? 'Paid in Full' : 'Payé intégralement', bg: '#DEF7EC', color: '#03543F' };
      case 'partially_paid':
        return { label: locale === 'ar' ? 'دفع جزئي' : locale === 'en' ? 'Partial Payment' : 'Partiellement payé', bg: '#FEF08A', color: '#854D0E' };
      case 'pending':
        return { label: locale === 'ar' ? 'في انتظار السداد' : locale === 'en' ? 'Pending Payment' : 'Paiement en attente', bg: '#FDE8E8', color: '#9B1C1C' };
      default:
        return { label: pst, bg: '#F3F4F6', color: '#374151' };
    }
  };

  // KPIs across all students
  const globalKpis = useMemo(() => {
    let totalConfirmed = 0;
    let totalRevenue = 0;
    let totalBalanceDue = 0;

    students.forEach((s) => {
      totalRevenue += s.total_paid || 0;
      totalBalanceDue += s.balance > 0 ? s.balance : 0;
      if (s.enrollments) {
        s.enrollments.forEach((e: any) => {
          if (e.status === 'confirmed') totalConfirmed++;
        });
      }
    });

    const coursesWithStudents = courses.filter((c) => (c.total_enrollments_count || 0) > 0).length;

    return {
      totalStudents: students.length,
      totalConfirmed,
      coursesWithStudents,
      totalRevenue,
      totalBalanceDue,
    };
  }, [students, courses]);

  // Filtered courses for courses view
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = courseSearch.toLowerCase();
      const matchSearch =
        courseSearch.trim() === '' ||
        (c.title_fr && c.title_fr.toLowerCase().includes(q)) ||
        (c.title_ar && c.title_ar.toLowerCase().includes(q)) ||
        (c.title_en && c.title_en.toLowerCase().includes(q)) ||
        (c.language_name_fr && c.language_name_fr.toLowerCase().includes(q));

      return matchSearch;
    });
  }, [courses, courseSearch]);

  // Students enrolled in selected course
  const courseSpecificStudents = useMemo(() => {
    if (!selectedCourse) return [];

    return students.filter((s) => {
      const enr = s.enrollments?.find((e: any) => e.course_id === selectedCourse.id);
      if (!enr) return false;

      // Status filter
      if (courseStatusFilter !== 'all' && enr.status !== courseStatusFilter) {
        return false;
      }

      // Search filter
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone?.includes(q);
      }

      return true;
    });
  }, [students, selectedCourse, courseStatusFilter, studentSearch]);

  // Students for all_students master directory
  const filteredAllStudents = useMemo(() => {
    return students.filter((s) => {
      if (!studentSearch.trim()) return true;
      const q = studentSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone?.includes(q);
    });
  }, [students, studentSearch]);

  return (
    <div style={{ paddingBottom: '3.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                backgroundColor: '#FFF2EE',
                color: '#FA461D',
                fontSize: '0.76rem',
                fontWeight: 800,
              }}
            >
              <Users size={14} />
              {locale === 'ar' ? 'سجل الطلاب والتسجيلات' : locale === 'en' ? 'Student Directory & Registrations' : 'Dossiers Apprenants & Inscriptions'}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                fontSize: '0.76rem',
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={13} />
              {globalKpis.totalStudents} {locale === 'ar' ? 'طالب مسجل' : locale === 'en' ? 'Enrolled Students' : 'Apprenants Inscrits'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: '#3D1B0D' }}>
            {locale === 'ar' ? 'دليل الطلاب والتسجيلات المفتوحة' : locale === 'en' ? 'Student Directory by Course' : 'Dossiers des Apprenants par Formation'}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: '#7A6258', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'تصفح الدورات التي تم إطلاق التسجيل بها، وعرض قوائم الطلاب المسجلين بكل فوج'
              : locale === 'en'
              ? 'Browse courses with open registration, inspect student rosters by formation, and manage confirmations'
              : 'Consultez les formations ouvertes aux inscriptions et accédez aux listes d\'élèves par cours'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <ExportDropdown
            onExportCSV={() => exportToCSV(selectedCourse)}
            onExportPDF={() => exportToPDF(selectedCourse)}
          />
          <button
            onClick={() => openAddModal(selectedCourse?.id)}
            className="btn-primary btn-sm"
            style={{ gap: '0.4rem', boxShadow: '0 4px 14px rgba(250, 70, 29, 0.25)' }}
          >
            <Plus size={16} />
            <span>
              {selectedCourse
                ? (locale === 'ar' ? 'إضافة طالب لهذا الفوج' : locale === 'en' ? '+ Add Student to this Course' : '+ Inscrire un élève à ce cours')
                : (locale === 'ar' ? 'تسجيل طالب جديد' : locale === 'en' ? '+ Register Student' : '+ Ajouter un étudiant')}
            </span>
          </button>
        </div>
      </div>

      {/* Global KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'إجمالي الطلاب المسجلين' : locale === 'en' ? 'Total Enrolled Students' : 'Total Apprenants Inscrits'}
            </span>
            <Users size={18} color="#FA461D" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#3D1B0D' }}>
            {globalKpis.totalStudents}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#166534', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
            {globalKpis.totalConfirmed} {locale === 'ar' ? 'تأكيد مؤكد ونشط' : locale === 'en' ? 'confirmed & active' : 'confirmés dans les listes'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'الدورات المفتوحة للتسجيل' : locale === 'en' ? 'Active Course Registrations' : 'Formations en Cours'}
            </span>
            <BookOpen size={18} color="#0284C7" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0369A1' }}>
            {courses.length}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#0369A1', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
            {globalKpis.coursesWithStudents} {locale === 'ar' ? 'دورات بها طلاب حالياً' : locale === 'en' ? 'courses with enrolled students' : 'cours avec inscriptions'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'المستحقات المحصلة' : locale === 'en' ? 'Tuition Collected' : 'Frais de Scolarité Encaissés'}
            </span>
            <DollarSign size={18} color="#166534" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#166534' }}>
            {globalKpis.totalRevenue.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>{t('price_dzd')}</span>
          </span>
          <span style={{ fontSize: '0.74rem', color: '#7A6258', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
            {locale === 'ar' ? 'المدفوعات المستلمة' : locale === 'en' ? 'Payments received' : 'Règlements validés'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'الأرصدة المتبقية للدفع' : locale === 'en' ? 'Outstanding Balances' : 'Soldes Restants Dûs'}
            </span>
            <AlertCircle size={18} color="#DC2626" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: globalKpis.totalBalanceDue > 0 ? '#DC2626' : '#166534' }}>
            {globalKpis.totalBalanceDue.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>{t('price_dzd')}</span>
          </span>
          <span style={{ fontSize: '0.74rem', color: '#7A6258', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
            {locale === 'ar' ? 'مستحقات قيد التحصيل' : locale === 'en' ? 'Pending settlement' : 'En attente d\'encaissement'}
          </span>
        </div>
      </div>

      {/* Primary View Switcher Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid #EADBCE',
          borderRadius: '14px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(61, 27, 13, 0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Tab 1: BY COURSE (Requested by user) */}
          <button
            type="button"
            onClick={() => {
              setViewMode('by_course');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: viewMode === 'by_course' ? '1.5px solid #FA461D' : '1px solid #E5E7EB',
              backgroundColor: viewMode === 'by_course' ? '#FFF2EE' : '#F9FAFB',
              color: viewMode === 'by_course' ? '#FA461D' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={16} />
            <span>{locale === 'ar' ? 'تصفح حسب الدورة والفوج' : locale === 'en' ? 'Courses & Registrations' : 'Formations & Inscriptions'}</span>
          </button>

          {/* Tab 2: ALL STUDENTS DIRECTORY */}
          <button
            type="button"
            onClick={() => {
              setViewMode('all_students');
              setSelectedCourse(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: viewMode === 'all_students' ? '1.5px solid #0284C7' : '1px solid #E5E7EB',
              backgroundColor: viewMode === 'all_students' ? '#F0F9FF' : '#F9FAFB',
              color: viewMode === 'all_students' ? '#0369A1' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} />
            <span>{locale === 'ar' ? 'السجل العام لجميع الطلاب' : locale === 'en' ? 'All Students Directory' : 'Tous les Apprenants'}</span>
          </button>
        </div>

        <div style={{ fontSize: '0.84rem', color: '#7A6258' }}>
          {viewMode === 'by_course'
            ? selectedCourse
              ? (locale === 'ar'
                  ? `أنت تتصفح طلاب: ${getLocalizedCourseTitle(selectedCourse, locale)}`
                  : locale === 'en'
                  ? `Viewing students enrolled in: ${getLocalizedCourseTitle(selectedCourse, locale)}`
                  : `Affichage des apprenants pour: ${getLocalizedCourseTitle(selectedCourse, locale)}`)
              : (locale === 'ar'
                  ? 'اختر دورة لعرض طلابها المسجلين'
                  : locale === 'en'
                  ? 'Select a course to view its enrolled students'
                  : 'Sélectionnez une formation pour afficher ses apprenants')
            : (locale === 'ar'
                ? `إجمالي ${students.length} طالب في كافة الأقسام`
                : locale === 'en'
                ? `Total of ${students.length} students across all programs`
                : `${students.length} apprenants au total`)}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: BY COURSE VIEW (DEFAULT) */}
      {/* ========================================================================= */}
      {viewMode === 'by_course' && (
        <div>
          {/* SUB-VIEW A1: LIST OF COURSES WITH REGISTRATIONS LAUNCHED */}
          {!selectedCourse ? (
            <div>
              {/* Filter bar for courses */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ position: 'relative', maxWidth: '380px', width: '100%' }}>
                  <Search size={16} color="#8C6F5A" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }} />
                  <input
                    type="text"
                    placeholder={locale === 'ar' ? 'تصفية الدورات المفتوحة...' : locale === 'en' ? 'Search open courses...' : 'Filtrer les formations ouvertes...'}
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingInlineStart: '2.4rem' }}
                  />
                </div>

                <span style={{ fontSize: '0.85rem', color: '#8C6F5A', fontWeight: 700 }}>
                  {filteredCourses.length} {locale === 'ar' ? 'دورة متاحة للتسجيل' : locale === 'en' ? 'courses with open registration' : 'formations ouvertes aux inscriptions'}
                </span>
              </div>

              {/* Grid of Courses */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {filteredCourses.map((crs) => {
                  const localizedTitle = getLocalizedCourseTitle(crs, locale);
                  const localizedLevel = getLocalizedCourseLevel(crs.level, locale);
                  const enrolledCount = crs.total_enrollments_count || 0;
                  const confirmedCount = crs.confirmed_count || 0;
                  const pendingCount = (crs.awaiting_payment_count || 0) + (crs.under_review_count || 0);

                  return (
                    <div
                      key={crs.id}
                      onClick={() => {
                        setSelectedCourse(crs);
                        setStudentSearch('');
                        setCourseStatusFilter('all');
                      }}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1.5px solid #EADBCE',
                        padding: '1.4rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(61, 27, 13, 0.04)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#FA461D';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(250, 70, 29, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#EADBCE';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(61, 27, 13, 0.04)';
                      }}
                    >
                      <div>
                        {/* Course Header Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                          <span
                            style={{
                              backgroundColor: '#FFF0EA',
                              color: '#FA461D',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                            }}
                          >
                            {crs.flag_emoji || '🌐'} {crs.language_name_fr}
                          </span>

                          <span
                            style={{
                              backgroundColor: '#F0F9FF',
                              color: '#0369A1',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                            }}
                          >
                            {localizedLevel}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: '#3D1B0D', lineHeight: 1.35 }}>
                          {localizedTitle}
                        </h3>

                        {/* Price & Format */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.84rem', color: '#7A6258' }}>
                          <span style={{ fontWeight: 900, color: '#166534', backgroundColor: '#ECFDF5', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                            {crs.price?.toLocaleString()} {t('price_dzd')}
                          </span>
                          <span>•</span>
                          <span>{crs.duration_weeks ? `${crs.duration_weeks} sem.` : 'Cursus continu'}</span>
                        </div>

                        {/* Registered Students Pill Strip */}
                        <div
                          style={{
                            backgroundColor: '#FFF9F4',
                            border: '1px solid #F2E4D8',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            marginBottom: '1.25rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3D1B0D' }}>
                              👥 {enrolledCount} {locale === 'ar' ? 'طالب مسجل' : locale === 'en' ? 'Registered Students' : 'Apprenants Inscrits'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800 }}>
                              ✓ {confirmedCount} {locale === 'ar' ? 'مؤكد' : locale === 'en' ? 'Confirmed' : 'Confirmés'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.74rem', color: '#8C6F5A' }}>
                            <span>⏳ {pendingCount} {locale === 'ar' ? 'في انتظار التأكيد أو الدفع' : locale === 'en' ? 'Pending Confirmation' : 'En attente de paiement'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Button */}
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          backgroundColor: '#FA461D',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.65rem 1rem',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          boxShadow: '0 3px 10px rgba(250, 70, 29, 0.2)',
                        }}
                      >
                        <span>{locale === 'ar' ? 'عرض طلاب هذه الدورة' : locale === 'en' ? 'View Students Roster' : 'Consulter les Apprenants'}</span>
                        {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* SUB-VIEW A2: SPECIFIC STUDENTS FOR THE SELECTED COURSE */
            <div>
              {/* Back to courses navigation */}
              <div style={{ marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #EADBCE',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    color: '#3D1B0D',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(61, 27, 13, 0.04)',
                  }}
                >
                  {dir === 'rtl' ? <ArrowRight size={16} color="#FA461D" /> : <ArrowLeft size={16} color="#FA461D" />}
                  <span>{locale === 'ar' ? 'الرجوع لكافة الدورات' : locale === 'en' ? '← Back to All Courses' : '← Retour à la liste des formations'}</span>
                </button>
              </div>

              {/* Course Detail Banner */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px solid #EADBCE',
                  padding: '1.4rem 1.6rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 4px 16px rgba(61, 27, 13, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span
                        style={{
                          backgroundColor: '#FFF0EA',
                          color: '#FA461D',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                        }}
                      >
                        {selectedCourse.flag_emoji || '🌐'} {selectedCourse.language_name_fr}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#F0F9FF',
                          color: '#0369A1',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                        }}
                      >
                        {getLocalizedCourseLevel(selectedCourse.level, locale)}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.55rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#3D1B0D' }}>
                      {getLocalizedCourseTitle(selectedCourse, locale)}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#7A6258' }}>
                      {selectedCourse.duration_weeks ? `${selectedCourse.duration_weeks} semaines • ` : ''}
                      Tarif: <strong style={{ color: '#166534' }}>{selectedCourse.price?.toLocaleString()} {t('price_dzd')}</strong>
                    </p>
                  </div>

                  {/* Course stats pills */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 800, display: 'block' }}>
                        {locale === 'ar' ? 'الطلاب المؤكدون' : locale === 'en' ? 'Confirmed' : 'Confirmés'}
                      </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16A34A' }}>
                        {selectedCourse.confirmed_count || 0}
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 800, display: 'block' }}>
                        {locale === 'ar' ? 'إجمالي المسجلين' : locale === 'en' ? 'Total Registered' : 'Total Inscrits'}
                      </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706' }}>
                        {courseSpecificStudents.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Students Filter & Search Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EADBCE',
                  borderRadius: '14px',
                  padding: '0.85rem 1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '240px' }}>
                  <Search size={16} color="#8C6F5A" />
                  <input
                    type="text"
                    placeholder={locale === 'ar' ? 'بحث عن طالب في هذا الفوج...' : locale === 'en' ? 'Search student in this roster...' : 'Rechercher un apprenant dans ce cours...'}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.86rem',
                      width: '100%',
                      color: '#3D1B0D',
                    }}
                  />
                  {studentSearch && (
                    <button type="button" onClick={() => setStudentSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C6F5A' }}>
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Status Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={14} color="#8C6F5A" />
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => setCourseStatusFilter(e.target.value)}
                    style={{
                      backgroundColor: '#F8F5F1',
                      border: '1px solid #EADBCE',
                      borderRadius: '8px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#3D1B0D',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">{locale === 'ar' ? 'جميع الحالات' : locale === 'en' ? 'All Statuses' : 'Tous les statuts'}</option>
                    <option value="confirmed">{locale === 'ar' ? 'مؤكد (نشط في الحضور)' : locale === 'en' ? 'Confirmed (Active in Roll Call)' : 'Confirmé (Actif dans l\'appel)'}</option>
                    <option value="accepted">{locale === 'ar' ? 'مقبول' : locale === 'en' ? 'Accepted' : 'Accepté'}</option>
                    <option value="awaiting_payment">{locale === 'ar' ? 'في انتظار الدفع' : locale === 'en' ? 'Awaiting Payment' : 'Attente paiement'}</option>
                    <option value="under_review">{locale === 'ar' ? 'قيد المراجعة' : locale === 'en' ? 'Under Review' : 'En examen'}</option>
                  </select>
                </div>

                {/* Course toolbar export dropdown */}
                <ExportDropdown
                  onExportCSV={() => exportToCSV(selectedCourse)}
                  onExportPDF={() => exportToPDF(selectedCourse)}
                />
              </div>

              {/* Course Students Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #EADBCE', borderRadius: '16px', boxShadow: '0 4px 16px rgba(61, 27, 13, 0.04)' }}>
                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8F5F1', borderBottom: '2px solid #EADBCE' }}>
                        <th style={{ padding: '0.9rem 1.1rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '220px' }}>
                          {locale === 'ar' ? 'الطالب' : locale === 'en' ? 'Student' : 'Apprenant'}
                        </th>
                        <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '120px' }}>
                          {locale === 'ar' ? 'المدينة' : locale === 'en' ? 'City' : 'Ville'}
                        </th>
                        <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '170px' }}>
                          {locale === 'ar' ? 'حالة التسجيل في الفوج' : locale === 'en' ? 'Course Registration Status' : 'Statut d\'Inscription'}
                        </th>
                        <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '150px' }}>
                          {locale === 'ar' ? 'المبلغ المسدد' : locale === 'en' ? 'Paid / Due' : 'Règlement'}
                        </th>
                        <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '140px' }}>
                          {locale === 'ar' ? 'الرصيد المتبقي' : locale === 'en' ? 'Balance Due' : 'Solde Restant'}
                        </th>
                        <th style={{ padding: '0.9rem 1.1rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', textAlign: 'center', minWidth: '180px' }}>
                          {locale === 'ar' ? 'الإجراءات والملف' : locale === 'en' ? 'Actions' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseSpecificStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#8C6F5A' }}>
                            <Users size={36} color="#D1C2B8" style={{ marginBottom: '0.5rem' }} />
                            <p style={{ margin: '0 0 0.75rem 0', fontWeight: 700 }}>
                              {locale === 'ar' ? 'لا يوجد طلاب مسجلون في هذه الدورة وفقاً للتصفية.' : locale === 'en' ? 'No students enrolled in this course matching criteria.' : 'Aucun apprenant trouvé pour cette formation.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => openAddModal(selectedCourse.id)}
                              className="btn-primary btn-sm"
                            >
                              <Plus size={15} />
                              <span>{locale === 'ar' ? 'إضافة أول طالب لهذا الفوج' : locale === 'en' ? 'Add 1st Student to this Course' : 'Inscrire le premier étudiant'}</span>
                            </button>
                          </td>
                        </tr>
                      ) : (
                        courseSpecificStudents.map((s, idx) => {
                          const enr = s.enrollments?.find((e: any) => e.course_id === selectedCourse.id);
                          const badge = getStatusBadge(enr?.status || 'enrolled');
                          const enrBalance = enr ? (enr.amount_due - enr.amount_paid) : s.balance;
                          const cleanPhone = s.phone ? s.phone.replace(/[^0-9]/g, '') : '';

                          return (
                            <tr
                              key={s.id}
                              onClick={() => openStudentDossier(s)}
                              style={{
                                borderBottom: '1px solid #F0DFD3',
                                backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFAF7',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              {/* Student Profile Column */}
                              <td style={{ padding: '0.85rem 1.1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div
                                    style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '10px',
                                      backgroundColor: '#3D1B0D',
                                      color: '#FFFFFF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 900,
                                      fontSize: '0.88rem',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {s.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#3D1B0D' }}>
                                        {s.name}
                                      </span>
                                      {cleanPhone && (
                                        <a
                                          href={`https://wa.me/${cleanPhone}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ color: '#25D366' }}
                                          title="WhatsApp"
                                        >
                                          <MessageCircle size={13} />
                                        </a>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.76rem', color: '#7A6258', marginTop: '0.15rem' }}>
                                      <span>{s.email}</span>
                                      {s.phone && (
                                        <>
                                          <span>•</span>
                                          <span dir="ltr">{s.phone}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* City */}
                              <td style={{ padding: '0.85rem 0.85rem', fontSize: '0.85rem', fontWeight: 600, color: '#3D1B0D' }}>
                                {s.city || 'Alger'}
                              </td>

                              {/* Registration Status */}
                              <td style={{ padding: '0.85rem 0.85rem' }}>
                                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      padding: '0.25rem 0.65rem',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      backgroundColor: badge.bg,
                                      color: badge.color,
                                      border: `1px solid ${badge.border}`,
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                  {enr?.status === 'confirmed' && (
                                    <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700 }}>
                                      ✓ {locale === 'ar' ? 'مدرج في ورقة الحضور' : locale === 'en' ? 'Active in Attendance Sheet' : 'Dans la liste d\'appel'}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Paid / Due */}
                              <td style={{ padding: '0.85rem 0.85rem' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#3D1B0D' }}>
                                  {(enr?.amount_paid || 0).toLocaleString()} / {(enr?.amount_due || selectedCourse.price || 0).toLocaleString()} {t('price_dzd')}
                                </span>
                              </td>

                              {/* Balance Due */}
                              <td style={{ padding: '0.85rem 0.85rem' }}>
                                {enrBalance > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <span
                                      style={{
                                        backgroundColor: '#FEE2E2',
                                        color: '#991B1B',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 800,
                                      }}
                                    >
                                      {enrBalance.toLocaleString()} {t('price_dzd')}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleSettleBalance(s, enr, e)}
                                      className="btn-outline btn-sm"
                                      style={{
                                        fontSize: '0.72rem',
                                        padding: '0.15rem 0.5rem',
                                        borderColor: '#10B981',
                                        color: '#10B981',
                                        fontWeight: 800,
                                        borderRadius: '999px',
                                      }}
                                    >
                                      ✓ {locale === 'ar' ? 'تسوية' : locale === 'en' ? 'Settle' : 'Régler'}
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                                    ✓ {locale === 'ar' ? 'مسدد بالكامل' : locale === 'en' ? 'Settled' : 'Réglé'}
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '0.85rem 1.1rem', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openStudentDossier(s);
                                    }}
                                    className="btn-primary btn-sm"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem' }}
                                    title="Dossier complet"
                                  >
                                    <Eye size={13} />
                                    <span>{locale === 'ar' ? 'الملف' : locale === 'en' ? 'Dossier' : 'Dossier'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => openEditModal(s, e)}
                                    className="btn-outline btn-sm"
                                    style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                                    title={t('action_edit')}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: ALL STUDENTS MASTER DIRECTORY (ALL FORMATIONS COMBINED) */}
      {/* ========================================================================= */}
      {viewMode === 'all_students' && (
        <div>
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '420px' }}>
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو الهاتف...' : locale === 'en' ? 'Search student by name, email or phone...' : 'Rechercher un apprenant...'}
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="form-input"
              style={{ paddingInlineStart: '2.4rem' }}
            />
            <Search size={18} color="#8C6F5A" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }} />
          </div>

          {/* Students Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #EADBCE', borderRadius: '16px' }}>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F5F1', borderBottom: '2px solid #EADBCE' }}>
                    <th style={{ padding: '0.9rem 1.1rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'الطالب' : locale === 'en' ? 'Student' : 'Étudiant'}
                    </th>
                    <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'المدينة' : locale === 'en' ? 'City' : 'Ville'}
                    </th>
                    <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'الدورات المسجلة وحالتها' : locale === 'en' ? 'Enrolled Courses & Status' : 'Formations & Statuts'}
                    </th>
                    <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'المدفوع / المستحق' : locale === 'en' ? 'Paid / Due' : 'Règlement'}
                    </th>
                    <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D' }}>
                      {locale === 'ar' ? 'الرصيد المتبقي' : locale === 'en' ? 'Balance Due' : 'Solde Dû'}
                    </th>
                    <th style={{ padding: '0.9rem 1.1rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', textAlign: 'center' }}>
                      {locale === 'ar' ? 'إجراءات' : locale === 'en' ? 'Actions' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#8C6F5A' }}>
                        {locale === 'ar' ? 'لم يتم العثور على أي طلاب.' : locale === 'en' ? 'No students found.' : 'Aucun étudiant trouvé.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAllStudents.map((s, idx) => (
                      <tr
                        key={s.id}
                        onClick={() => openStudentDossier(s)}
                        style={{ cursor: 'pointer', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFAF7' }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '0.85rem 1.1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: '#3D1B0D',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '0.88rem',
                                flexShrink: 0,
                              }}
                            >
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.94rem', color: '#3D1B0D' }}>
                                {s.name}
                              </p>
                              <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.76rem', color: '#7A6258', marginTop: '0.15rem' }}>
                                <span dir="ltr">{s.phone || '-'}</span>
                                <span>•</span>
                                <span>{s.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.city || 'Alger'}</span>
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          {s.enrollments && s.enrollments.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '300px' }}>
                              {s.enrollments.map((enr: any) => {
                                const badge = getStatusBadge(enr.status);
                                const localizedTitle = getLocalizedCourseTitle(enr, locale);
                                return (
                                  <div
                                    key={enr.id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                      background: '#FFF9F4',
                                      border: '1px solid #EADBCE',
                                      borderRadius: '6px',
                                      padding: '0.2rem 0.5rem',
                                      fontSize: '0.76rem',
                                      lineHeight: 1.25,
                                    }}
                                  >
                                    <span>{enr.flag_emoji || '🌐'}</span>
                                    <span style={{ fontWeight: 700, color: '#3D1B0D' }}>{localizedTitle}</span>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '999px',
                                        background: badge.bg,
                                        color: badge.color,
                                        border: `1px solid ${badge.border}`,
                                      }}
                                    >
                                      {badge.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontStyle: 'italic' }}>
                              {locale === 'ar' ? 'غير مسجل في أي دورة' : locale === 'en' ? 'No enrollment' : 'Aucune inscription'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                            {s.total_paid?.toLocaleString()} / {s.total_due?.toLocaleString()} {t('price_dzd')}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.85rem' }}>
                          {s.balance > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                                {s.balance?.toLocaleString()} {t('price_dzd')}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleSettleBalance(s, undefined, e)}
                                className="btn-outline btn-sm"
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.2rem 0.55rem',
                                  borderColor: '#10B981',
                                  color: '#10B981',
                                  fontWeight: 700,
                                  borderRadius: '999px',
                                }}
                              >
                                ✓ {locale === 'ar' ? 'تسوية' : locale === 'en' ? 'Settle' : 'Régler'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                              ✓ {locale === 'ar' ? 'سدد بالكامل' : locale === 'en' ? 'Settled' : 'Réglé'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openStudentDossier(s);
                              }}
                              className="btn-primary btn-sm"
                              style={{ padding: '0.32rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}
                            >
                              <Eye size={13} />
                              <span>{locale === 'ar' ? 'الملف' : locale === 'en' ? 'Dossier' : 'Dossier'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openEditModal(s, e)}
                              className="btn-outline btn-sm"
                              style={{ padding: '0.32rem 0.55rem', fontSize: '0.78rem' }}
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT FULL DOSSIER MODAL WITH COURSE INSPECTION */}
      {selectedStudentDossier && (
        <div className="modal-overlay" onClick={() => setSelectedStudentDossier(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '18px' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '1.25rem 1.6rem', borderBottom: '1px solid #EADBCE', backgroundColor: '#FFF9F4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FA461D 0%, #FFAD17 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  {selectedStudentDossier.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                    {selectedStudentDossier.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#7A6258', marginTop: '0.2rem' }}>
                    <span>{selectedStudentDossier.email}</span>
                    <span>•</span>
                    <span dir="ltr">{selectedStudentDossier.phone || '-'}</span>
                    <span>•</span>
                    <span>{selectedStudentDossier.city || 'Alger'}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedStudentDossier(null)} style={{ color: '#8C6F5A', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {/* Success Notification Alert */}
              {dossierSuccessMsg && (
                <div
                  style={{
                    backgroundColor: '#DEF7EC',
                    color: '#03543F',
                    border: '1px solid #BCF0DA',
                    padding: '0.85rem 1.1rem',
                    borderRadius: '10px',
                    marginBottom: '1.25rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={18} color="#0E9F6E" style={{ flexShrink: 0 }} />
                  <span>{dossierSuccessMsg}</span>
                </div>
              )}

              {/* Financial & WhatsApp Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block', fontWeight: 600 }}>
                    {locale === 'ar' ? 'الرصيد المالي الإجمالي' : locale === 'en' ? 'Overall Balance Due' : 'Solde Global Dû'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: selectedStudentDossier.balance > 0 ? '#DC2626' : '#059669' }}>
                      {selectedStudentDossier.balance?.toLocaleString()} {t('price_dzd')}
                    </span>
                    {selectedStudentDossier.balance > 0 && (
                      <button
                        onClick={() => handleSettleBalance(selectedStudentDossier)}
                        className="btn-outline btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderColor: '#10B981', color: '#10B981' }}
                      >
                        {locale === 'ar' ? 'تسوية' : locale === 'en' ? 'Settle' : 'Régler'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B', display: 'block', fontWeight: 600 }}>
                      {locale === 'ar' ? 'التواصل عبر واتساب' : locale === 'en' ? 'WhatsApp Contact' : 'Contact WhatsApp'}
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#3D1B0D' }} dir="ltr">
                      {selectedStudentDossier.phone || 'Non renseigné'}
                    </span>
                  </div>
                  {selectedStudentDossier.phone && (
                    <a
                      href={`https://wa.me/${selectedStudentDossier.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline btn-sm"
                      style={{ background: '#25D366', color: '#fff', borderColor: '#25D366', padding: '0.35rem 0.65rem' }}
                    >
                      <MessageCircle size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* COURSES ENROLLED SECTION */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#3D1B0D', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BookOpen size={18} color="#FA461D" />
                    <span>{locale === 'ar' ? 'الدورات المسجل فيها (انقر لمعاينة التفاصيل):' : locale === 'en' ? 'Enrolled Formations (click to expand):' : 'Formations souscrites (cliquez pour afficher le détail) :'}</span>
                  </h4>
                  <span style={{ backgroundColor: '#FFF2EE', color: '#FA461D', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                    {selectedStudentDossier.enrollments?.length || 0} {locale === 'ar' ? 'دورات' : locale === 'en' ? 'courses' : 'cours'}
                  </span>
                </div>

                {!selectedStudentDossier.enrollments || selectedStudentDossier.enrollments.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', border: '1.5px dashed #EADBCE' }}>
                    <p style={{ color: '#8C6F5A', margin: 0 }}>
                      {locale === 'ar' ? 'هذا الطالب غير مسجل في أي دورة بعد.' : locale === 'en' ? 'This student is not enrolled in any course yet.' : 'Cet étudiant n\'est inscrit à aucun cours pour le moment.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {selectedStudentDossier.enrollments.map((enr: any) => {
                      const isExpanded = selectedCourseId === enr.id;
                      const badge = getStatusBadge(enr.status);
                      const paymentBadge = getPaymentStatusBadge(enr.payment_status);
                      const enrBalance = (enr.amount_due || 0) - (enr.amount_paid || 0);
                      const localizedTitle = getLocalizedCourseTitle(enr, locale);

                      return (
                        <div
                          key={enr.id}
                          style={{
                            border: isExpanded ? '2px solid #FA461D' : '1px solid #EADBCE',
                            borderRadius: '12px',
                            backgroundColor: isExpanded ? '#FFF9F6' : '#FFFFFF',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Course Row Header (Clickable) */}
                          <div
                            onClick={() => setSelectedCourseId(isExpanded ? null : enr.id)}
                            style={{
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '1.4rem' }}>{enr.flag_emoji || '🌐'}</span>
                              <div>
                                <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#3D1B0D' }}>
                                  {localizedTitle}
                                </h5>
                                <span style={{ fontSize: '0.76rem', color: '#7A6258' }}>
                                  {enr.language_name || 'Langue'} • {getLocalizedCourseLevel(enr.course_level, locale)}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  backgroundColor: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                }}
                              >
                                {badge.label}
                              </span>

                              <span
                                style={{
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '999px',
                                  backgroundColor: paymentBadge.bg,
                                  color: paymentBadge.color,
                                }}
                              >
                                {paymentBadge.label}
                              </span>

                              {isExpanded ? <ChevronDown size={18} color="#FA461D" /> : <ChevronRight size={18} color="#8C6F5A" />}
                            </div>
                          </div>

                          {/* Expanded Inspection & Status Action Box */}
                          {isExpanded && (
                            <div
                              style={{
                                padding: '1.25rem',
                                borderTop: '1px solid #FFE4DB',
                                backgroundColor: '#FFFFFF',
                              }}
                            >
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                {/* Financial breakdown for this course */}
                                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600 }}>
                                    {locale === 'ar' ? 'التفاصيل المالية للدورة' : locale === 'en' ? 'Course Financial Breakdown' : 'Situation Financière du Cours'}
                                  </span>
                                  <div style={{ marginTop: '0.35rem', fontSize: '0.84rem' }}>
                                    <div><strong>{locale === 'ar' ? 'المبلغ المستحق:' : locale === 'en' ? 'Total Due:' : 'Total dû :'}</strong> {enr.amount_due?.toLocaleString()} {t('price_dzd')}</div>
                                    <div><strong>{locale === 'ar' ? 'المبلغ المدفوع:' : locale === 'en' ? 'Paid:' : 'Payé :'}</strong> <span style={{ color: '#059669' }}>{enr.amount_paid?.toLocaleString()} {t('price_dzd')}</span></div>
                                    <div>
                                      <strong>{locale === 'ar' ? 'المتبقي:' : locale === 'en' ? 'Remaining Balance:' : 'Reste dû :'}</strong>{' '}
                                      <span style={{ color: enrBalance > 0 ? '#DC2626' : '#059669', fontWeight: 800 }}>
                                        {enrBalance?.toLocaleString()} {t('price_dzd')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Enrollment Timestamps & Sync Info */}
                                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', fontWeight: 600 }}>
                                    {locale === 'ar' ? 'سجل التسجيل والتحاق الأستاذ' : locale === 'en' ? 'Instructor Roll Call Integration' : 'Validation & Intégration Enseignant'}
                                  </span>
                                  <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', lineHeight: 1.45 }}>
                                    <div>{locale === 'ar' ? 'تاريخ التسجيل:' : locale === 'en' ? 'Registered on:' : 'Inscrit le :'} {enr.enrolled_at ? enr.enrolled_at.slice(0, 10) : '-'}</div>
                                    {enr.confirmed_at && (
                                      <div style={{ color: '#059669', fontWeight: 700 }}>
                                        {locale === 'ar' ? 'تأكيد التسجيل:' : locale === 'en' ? 'Confirmed on:' : 'Confirmé le :'} {enr.confirmed_at.slice(0, 10)}
                                      </div>
                                    )}
                                    <div style={{ marginTop: '0.3rem', color: enr.status === 'confirmed' ? '#059669' : '#D97706', fontWeight: 700 }}>
                                      {enr.status === 'confirmed'
                                        ? (locale === 'ar' ? '✓ مفعل في ورقة حضور الأستاذ' : locale === 'en' ? '✓ Active in Teacher Roll Call' : "✓ Actif dans la liste de présence de l'enseignant")
                                        : (locale === 'ar' ? '⏳ في انتظار التأكيد لتضمينه في ورقة الحضور' : locale === 'en' ? '⏳ Awaiting confirmation for roll call' : "⏳ En attente de confirmation pour l'appel")}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Interactive Status Switcher & Confirmation Bar */}
                              <div
                                style={{
                                  background: '#FFF0EB',
                                  padding: '1rem 1.25rem',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(250, 70, 29, 0.25)',
                                }}
                              >
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3D1B0D', display: 'block', marginBottom: '0.5rem' }}>
                                  {locale === 'ar' ? 'تعديل حالة التسجيل في هذا الفوج:' : locale === 'en' ? 'Update Registration Status for this Course:' : 'Modifier le statut d\'inscription pour ce cours :'}
                                </span>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    disabled={updatingEnrollmentId === enr.id}
                                    onClick={() => handleUpdateEnrollmentStatus(enr.id, 'confirmed')}
                                    style={{
                                      backgroundColor: enr.status === 'confirmed' ? '#059669' : '#10B981',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ✓ {locale === 'ar' ? 'تأكيد التسجيل (إدراج في الحضور)' : locale === 'en' ? 'Confirm (Active in Roll Call)' : 'Confirmer (Actif dans l\'appel)'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={updatingEnrollmentId === enr.id}
                                    onClick={() => handleUpdateEnrollmentStatus(enr.id, 'accepted')}
                                    style={{
                                      backgroundColor: enr.status === 'accepted' ? '#1E429F' : '#3B82F6',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {locale === 'ar' ? 'قبول الملف' : locale === 'en' ? 'Accept' : 'Accepter'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={updatingEnrollmentId === enr.id}
                                    onClick={() => handleUpdateEnrollmentStatus(enr.id, 'awaiting_payment')}
                                    style={{
                                      backgroundColor: '#F59E0B',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {locale === 'ar' ? 'في انتظار الدفع' : locale === 'en' ? 'Awaiting Payment' : 'Attente paiement'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={updatingEnrollmentId === enr.id}
                                    onClick={() => handleUpdateEnrollmentStatus(enr.id, 'cancelled')}
                                    style={{
                                      backgroundColor: '#EF4444',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {locale === 'ar' ? 'إلغاء التسجيل' : locale === 'en' ? 'Cancel' : 'Annuler'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #EADBCE', backgroundColor: '#FFF9F4', padding: '1rem 1.6rem' }}>
              <button
                type="button"
                onClick={() => setSelectedStudentDossier(null)}
                className="btn-outline btn-sm"
              >
                {locale === 'ar' ? 'إغلاق الملف' : locale === 'en' ? 'Close Dossier' : 'Fermer le dossier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD / EDIT STUDENT PROFILE */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', borderRadius: '18px' }}>
            <div className="modal-header" style={{ backgroundColor: '#FFF9F4', borderBottom: '1px solid #EADBCE', padding: '1.25rem 1.6rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                  {editingStudent
                    ? (locale === 'ar' ? 'تعديل الملف الأساسي للطالب' : locale === 'en' ? 'Edit Student Profile' : 'Modifier le dossier étudiant')
                    : (locale === 'ar' ? 'تسجيل طالب جديد' : locale === 'en' ? 'Register New Student' : 'Inscrire un nouvel étudiant')}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#7A6258' }}>
                  {targetCourseId
                    ? (locale === 'ar'
                        ? `سيتم تسجيل الطالب في دورة: ${getLocalizedCourseTitle(courses.find((c) => c.id === targetCourseId), locale)}`
                        : locale === 'en'
                        ? `Student will be enrolled in: ${getLocalizedCourseTitle(courses.find((c) => c.id === targetCourseId), locale)}`
                        : `L'étudiant sera inscrit à : ${getLocalizedCourseTitle(courses.find((c) => c.id === targetCourseId), locale)}`)
                    : (locale === 'ar'
                        ? 'إنشاء حساب جديد وتعيين بيانات الطالب'
                        : locale === 'en'
                        ? 'Personal details and contact information'
                        : 'Informations personnelles et coordonnées')}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ color: '#8C6F5A', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProfile}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                {error && (
                  <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.8rem 1rem', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '1.25rem', fontWeight: 700, border: '1px solid #FECACA' }}>
                    {error}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>
                    {locale === 'ar' ? 'الاسم واللقب' : locale === 'en' ? 'Full Student Name' : 'Nom complet de l\'apprenant'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Yasmine Haddad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>
                      {locale === 'ar' ? 'البريد الإلكتروني' : locale === 'en' ? 'Email Address' : 'Email'} *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="etudiant@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>
                      {locale === 'ar' ? 'رقم الهاتف' : locale === 'en' ? 'Phone Number' : 'Numéro de téléphone'}
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="0550123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>
                    {locale === 'ar' ? 'المدينة / الإقامة' : locale === 'en' ? 'City / Location' : 'Ville de résidence'}
                  </label>
                  <input
                    type="text"
                    placeholder="Alger, Oran, Constantine..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                  />
                </div>

                {!editingStudent && (
                  <div className="form-group" style={{ marginBottom: '1rem', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#1E293B' }}>
                      <BookOpen size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                      {locale === 'ar' ? 'الدورة التدريبية المستهدفة' : locale === 'en' ? 'Target Course / Formation' : 'Formation à inscrire'}
                    </label>
                    <select
                      value={targetCourseId || ''}
                      onChange={(e) => setTargetCourseId(e.target.value ? Number(e.target.value) : null)}
                      className="form-select"
                    >
                      <option value="">{locale === 'ar' ? '-- بدون تسجيل فوري في دورة --' : locale === 'en' ? '-- No immediate course registration --' : '-- Sans inscription immédiate --'}</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.flag_emoji || '🌐'} {getLocalizedCourseTitle(c, locale)} ({c.level}) - {c.price?.toLocaleString()} DZD
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>
                    {locale === 'ar' ? 'ملاحظات الإدارة' : locale === 'en' ? 'Administrative Notes' : 'Notes administratives'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={locale === 'ar' ? 'ملاحظات حول الملف، طريقة الدفع...' : locale === 'en' ? 'Notes on application, payment terms...' : 'Notes sur le dossier, modalités de paiement...'}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #EADBCE', backgroundColor: '#FFF9F4', padding: '1rem 1.6rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm" style={{ fontWeight: 900 }}>
                  {submitting ? '...' : (editingStudent ? t('action_save') : (locale === 'ar' ? 'تأكيد التسجيل' : locale === 'en' ? 'Register Student' : 'Enregistrer'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
