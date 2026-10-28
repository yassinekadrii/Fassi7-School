'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  ClipboardList, Filter, CheckCircle2, AlertCircle, Edit2, X, Phone, Mail, 
  MessageCircle, Send, Check, DollarSign, ExternalLink, ShieldCheck, 
  BookOpen, Users, Search, ArrowLeft, ArrowRight, Clock, Plus, RefreshCw, FileText
} from 'lucide-react';
import { ExportDropdown } from '@/components/ExportDropdown';
import { downloadCSV, exportTableToPDF } from '@/lib/exportHelpers';
import { getLocalizedCourseTitle, getLocalizedCourseLevel } from '@/lib/courseHelpers';

export default function EnrollmentsManagePage() {
  const { t, locale, dir } = useLanguage();
  
  // Data states
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'by_course' | 'all_pipeline'
  const [viewMode, setViewMode] = useState<'by_course' | 'all_pipeline'>('by_course');

  // Selected Course (when drilling into a specific course in 'by_course' mode)
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Search & Filter
  const [courseSearch, setCourseSearch] = useState('');
  const [applicantSearch, setApplicantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Status edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('accepted');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [enrRes, crsRes] = await Promise.all([
        fetch('/api/enrollments'),
        fetch('/api/courses'),
      ]);
      const enrData = await enrRes.json();
      const crsData = await crsRes.json();

      setEnrollments(enrData.enrollments || []);
      const courseList = crsData.courses || [];
      setCourses(courseList);

      // If a course was previously selected, keep it updated
      if (selectedCourse) {
        const updatedCourse = courseList.find((c: any) => c.id === selectedCourse.id);
        if (updatedCourse) {
          setSelectedCourse(updatedCourse);
        }
      }
    } catch (err) {
      console.error('Error loading enrollments pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openStatusModal = (e: any) => {
    setSelectedEnrollment(e);
    setNewStatus(e.status);
    setPaymentStatus(e.payment_status || 'pending');
    setAmountPaid(e.amount_paid || 0);
    setAdminNotes(e.notes || '');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEnrollment.id,
          status: newStatus,
          payment_status: paymentStatus,
          amount_paid: Number(amountPaid),
          notes: adminNotes,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setActionSuccess(
          locale === 'ar'
            ? 'تم تحديث حالة الملف بنجاح وتفعيل التغييرات!'
            : locale === 'en'
            ? 'Enrollment application status updated and changes applied successfully!'
            : 'Dossier mis à jour et validé avec succès!'
        );
        setTimeout(() => setActionSuccess(null), 4000);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick 1-click activate and confirm payment (CCP / BaridiMob received)
  const handleQuickActivate = async (enr: any) => {
    const coursePrice = enr.course_price || enr.amount_due || 0;
    try {
      const res = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: enr.id,
          status: 'confirmed',
          payment_status: 'paid',
          amount_paid: coursePrice,
          notes: (enr.notes ? enr.notes + ' | ' : '') + 'Paiement CCP/BaridiMob reçu & validé par l\'administration.',
        }),
      });

      if (res.ok) {
        setActionSuccess(
          locale === 'ar'
            ? `تم تفعيل حساب الطالب (${enr.student_name}) وتأكيد الدفع بالكامل!`
            : locale === 'en'
            ? `Student account (${enr.student_name}) activated and payment fully confirmed!`
            : `Compte et paiement de (${enr.student_name}) validés et activés!`
        );
        setTimeout(() => setActionSuccess(null), 4000);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatWhatsAppPhone = (phone: string) => {
    if (!phone) return '213555000000';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) {
      p = '213' + p.substring(1);
    } else if (!p.startsWith('213') && p.length === 9) {
      p = '213' + p;
    }
    return p;
  };

  const getWhatsAppInviteUrl = (enr: any) => {
    const cleanPhone = formatWhatsAppPhone(enr.student_phone);
    const msg = locale === 'ar'
      ? `مرحباً ${enr.student_name}! تم تأكيد تسجيلك في أكاديمية فصيح (Fassi7 School) لدورة: ${enr.course_title_ar || enr.course_title_fr}. إليك رابط مجموعة الواتساب الخاصة بقسمك: https://chat.whatsapp.com/Fassi7SchoolGroup - بالتوفيق!`
      : locale === 'en'
      ? `Hello ${enr.student_name}! Your enrollment at Fassi7 School for (${enr.course_title_en || enr.course_title_fr}) is officially confirmed! Join your cohort's WhatsApp group: https://chat.whatsapp.com/Fassi7SchoolGroup - Welcome aboard!`
      : `Bonjour ${enr.student_name}! Votre inscription à Fassi7 School pour la formation (${enr.course_title_fr}) a été validée avec succès! Rejoignez le groupe WhatsApp officiel de votre promotion: https://chat.whatsapp.com/Fassi7SchoolGroup - Bienvenue parmi nous!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'new':
        return <span className="badge badge-info">{t('status_new')}</span>;
      case 'under_review':
        return <span className="badge badge-warning">{t('status_under_review')}</span>;
      case 'accepted':
        return <span className="badge badge-primary">{t('status_accepted')}</span>;
      case 'awaiting_payment':
        return <span className="badge badge-secondary">{t('status_awaiting_payment')}</span>;
      case 'confirmed':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> {t('status_confirmed')}</span>;
      case 'completed':
        return <span className="badge badge-dark">{t('status_completed')}</span>;
      case 'cancelled':
        return <span className="badge badge-danger">{t('status_cancelled')}</span>;
      default:
        return <span className="badge badge-dark">{st}</span>;
    }
  };

  // KPIs
  const pipelineKpis = useMemo(() => {
    let totalConfirmed = 0;
    let totalAwaiting = 0;
    let totalReview = 0;
    let totalPaid = 0;

    enrollments.forEach((e) => {
      if (e.status === 'confirmed') totalConfirmed++;
      if (e.status === 'awaiting_payment') totalAwaiting++;
      if (e.status === 'under_review' || e.status === 'new') totalReview++;
      totalPaid += Number(e.amount_paid || 0);
    });

    return {
      totalApplications: enrollments.length,
      totalConfirmed,
      totalAwaiting,
      totalReview,
      totalPaid,
    };
  }, [enrollments]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (!courseSearch.trim()) return true;
      const q = courseSearch.toLowerCase();
      return (
        (c.title_fr && c.title_fr.toLowerCase().includes(q)) ||
        (c.title_ar && c.title_ar.toLowerCase().includes(q)) ||
        (c.title_en && c.title_en.toLowerCase().includes(q)) ||
        (c.language_name_fr && c.language_name_fr.toLowerCase().includes(q)) ||
        (c.language_name_en && c.language_name_en.toLowerCase().includes(q))
      );
    });
  }, [courses, courseSearch]);

  // Filtered enrollments for active view
  const displayedEnrollments = useMemo(() => {
    return enrollments.filter((enr) => {
      // Course filter if in course drilldown mode
      if (viewMode === 'by_course' && selectedCourse && enr.course_id !== selectedCourse.id) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && enr.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (applicantSearch.trim()) {
        const q = applicantSearch.toLowerCase();
        const matchesName = enr.student_name && enr.student_name.toLowerCase().includes(q);
        const matchesEmail = enr.student_email && enr.student_email.toLowerCase().includes(q);
        const matchesPhone = enr.student_phone && enr.student_phone.includes(q);
        const matchesCourse = (enr.course_title_fr && enr.course_title_fr.toLowerCase().includes(q)) ||
                              (enr.course_title_en && enr.course_title_en.toLowerCase().includes(q)) ||
                              (enr.course_title_ar && enr.course_title_ar.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCourse) {
          return false;
        }
      }

      return true;
    });
  }, [enrollments, viewMode, selectedCourse, statusFilter, applicantSearch]);

  // CSV Export
  const handleExportCSV = () => {
    const filename = selectedCourse
      ? `fassi7_pipeline_${(selectedCourse.title_en || selectedCourse.title_fr || 'course').replace(/[^a-zA-Z0-9]/g, '_')}.csv`
      : `fassi7_pipeline_all_${new Date().toISOString().slice(0, 10)}.csv`;

    const headers = [
      '#',
      locale === 'ar' ? 'اسم المرشح' : locale === 'en' ? 'Candidate Name' : 'Nom Candidat',
      locale === 'ar' ? 'البريد الإلكتروني' : locale === 'en' ? 'Email' : 'Email',
      locale === 'ar' ? 'الهاتف' : locale === 'en' ? 'Phone' : 'Téléphone',
      locale === 'ar' ? 'الدورة' : locale === 'en' ? 'Course' : 'Formation',
      locale === 'ar' ? 'تاريخ الطلب' : locale === 'en' ? 'Application Date' : 'Date d\'envoi',
      locale === 'ar' ? 'حالة الطلب' : locale === 'en' ? 'Status' : 'Statut',
      locale === 'ar' ? 'حالة الدفع' : locale === 'en' ? 'Payment Status' : 'Paiement',
      locale === 'ar' ? 'المبلغ المستحق (دج)' : locale === 'en' ? 'Amount Due (DZD)' : 'Montant Dû (DZD)',
      locale === 'ar' ? 'المبلغ المدفوع (دج)' : locale === 'en' ? 'Amount Paid (DZD)' : 'Montant Payé (DZD)',
    ];

    const rows = displayedEnrollments.map((enr, idx) => [
      idx + 1,
      enr.student_name || '',
      enr.student_email || '',
      enr.student_phone || '',
      locale === 'ar' ? (enr.course_title_ar || enr.course_title_fr) : locale === 'en' ? (enr.course_title_en || enr.course_title_fr) : enr.course_title_fr,
      enr.enrolled_at ? enr.enrolled_at.slice(0, 10) : '',
      enr.status || '',
      enr.payment_status || '',
      enr.course_price || enr.amount_due || 0,
      enr.amount_paid || 0,
    ]);

    downloadCSV(filename, headers, rows);
  };

  // PDF Export
  const handleExportPDF = () => {
    const courseTitle = selectedCourse ? getLocalizedCourseTitle(selectedCourse, locale) : '';
    const title = selectedCourse
      ? (locale === 'ar' 
          ? `سجل ومسار طلبات التسجيل: ${courseTitle}` 
          : locale === 'en' 
          ? `Application & Enrollment Pipeline: ${courseTitle}` 
          : `Pipeline des Candidatures: ${courseTitle}`)
      : (locale === 'ar' 
          ? 'السجل العام لطلبات التسجيل والأفواج' 
          : locale === 'en' 
          ? 'Master Enrollment & Applications Pipeline' 
          : 'Journal Global des Candidatures & Inscriptions');

    const subtitle = selectedCourse
      ? `${selectedCourse.flag_emoji || '🌐'} ${locale === 'ar' ? selectedCourse.language_name_ar : locale === 'en' ? (selectedCourse.language_name_en || selectedCourse.language_name_fr) : (selectedCourse.language_name_fr || '')} • ${locale === 'ar' ? 'المستوى' : locale === 'en' ? 'Level' : 'Niveau'} ${selectedCourse.level || ''} • ${displayedEnrollments.length} ${locale === 'ar' ? 'طلب مسجل' : locale === 'en' ? 'applications' : 'dossiers'}`
      : `${displayedEnrollments.length} ${locale === 'ar' ? 'طلب تسجيل في كافة التخصصات' : locale === 'en' ? 'total applications in pipeline' : 'candidatures au total'}`;

    const headers = selectedCourse
      ? [
          '#',
          locale === 'ar' ? 'اسم الطالب' : locale === 'en' ? 'Candidate' : 'Candidat',
          locale === 'ar' ? 'الاتصال / الهاتف' : locale === 'en' ? 'Phone / Contact' : 'Contact / Tél',
          locale === 'ar' ? 'تاريخ الإرسال' : locale === 'en' ? 'Applied Date' : 'Date d\'envoi',
          locale === 'ar' ? 'حالة الطلب' : locale === 'en' ? 'Status' : 'Statut',
          locale === 'ar' ? 'حالة الدفع' : locale === 'en' ? 'Payment' : 'Paiement',
          locale === 'ar' ? 'المبلغ المستحق (دج)' : locale === 'en' ? 'Due (DZD)' : 'Frais (DZD)',
          locale === 'ar' ? 'المسدد (دج)' : locale === 'en' ? 'Paid (DZD)' : 'Payé (DZD)',
        ]
      : [
          '#',
          locale === 'ar' ? 'اسم الطالب' : locale === 'en' ? 'Candidate' : 'Candidat',
          locale === 'ar' ? 'الاتصال' : locale === 'en' ? 'Contact' : 'Contact',
          locale === 'ar' ? 'الدورة المختارة' : locale === 'en' ? 'Target Course' : 'Formation',
          locale === 'ar' ? 'تاريخ الإرسال' : locale === 'en' ? 'Date' : 'Date',
          locale === 'ar' ? 'حالة الملف' : locale === 'en' ? 'Status' : 'Statut',
          locale === 'ar' ? 'الدفع' : locale === 'en' ? 'Payment' : 'Paiement',
          locale === 'ar' ? 'المسدد / المستحق' : locale === 'en' ? 'Paid / Due' : 'Payé / Dû',
        ];

    let confirmedCount = 0;
    let totalRevenue = 0;
    let totalDue = 0;

    const rows = displayedEnrollments.map((enr, idx) => {
      if (enr.status === 'confirmed') confirmedCount++;
      const p = Number(enr.amount_paid || 0);
      const d = Number(enr.course_price || enr.amount_due || 0);
      totalRevenue += p;
      totalDue += d;

      const badgeType: 'success' | 'warning' | 'info' | 'default' | 'danger' =
        enr.status === 'confirmed' ? 'success' :
        enr.status === 'awaiting_payment' ? 'warning' :
        enr.status === 'accepted' ? 'info' :
        enr.status === 'cancelled' ? 'danger' : 'default';

      const statusLabel =
        enr.status === 'confirmed' ? (locale === 'ar' ? 'مؤكد' : locale === 'en' ? 'Confirmed' : 'Confirmé') :
        enr.status === 'awaiting_payment' ? (locale === 'ar' ? 'انتظار الدفع' : locale === 'en' ? 'Awaiting Payment' : 'Attente paiement') :
        enr.status === 'accepted' ? (locale === 'ar' ? 'مقبول' : locale === 'en' ? 'Accepted' : 'Accepté') :
        enr.status === 'under_review' ? (locale === 'ar' ? 'قيد المراجعة' : locale === 'en' ? 'Under Review' : 'En examen') :
        enr.status === 'new' ? (locale === 'ar' ? 'جديد' : locale === 'en' ? 'New' : 'Nouveau') :
        enr.status === 'completed' ? (locale === 'ar' ? 'مكتمل' : locale === 'en' ? 'Completed' : 'Terminé') :
        (locale === 'ar' ? 'ملغى' : locale === 'en' ? 'Cancelled' : 'Annulé');

      const paymentBadge: 'success' | 'warning' | 'info' | 'default' =
        enr.payment_status === 'paid' ? 'success' :
        enr.payment_status === 'partially_paid' ? 'warning' : 'default';

      const paymentLabel =
        enr.payment_status === 'paid' ? (locale === 'ar' ? 'مدفوع بالكامل' : locale === 'en' ? 'Fully Paid' : 'Réglé') :
        enr.payment_status === 'partially_paid' ? (locale === 'ar' ? 'دفع جزئي' : locale === 'en' ? 'Partial' : 'Partiel') :
        (locale === 'ar' ? 'معلق' : locale === 'en' ? 'Pending' : 'En attente');

      if (selectedCourse) {
        return [
          String(idx + 1),
          { content: enr.student_name || '—', align: (locale === 'ar' ? 'right' : 'left') as 'right' | 'left' },
          enr.student_phone || enr.student_email || '—',
          enr.enrolled_at ? enr.enrolled_at.slice(0, 10) : '—',
          { content: statusLabel, badge: badgeType },
          { content: paymentLabel, badge: paymentBadge },
          d.toLocaleString(),
          p.toLocaleString(),
        ];
      }

      const crsTitle = locale === 'ar' ? (enr.course_title_ar || enr.course_title_fr) : locale === 'en' ? (enr.course_title_en || enr.course_title_fr) : enr.course_title_fr;
      return [
        String(idx + 1),
        { content: enr.student_name || '—', align: (locale === 'ar' ? 'right' : 'left') as 'right' | 'left' },
        enr.student_phone || enr.student_email || '—',
        crsTitle || '—',
        enr.enrolled_at ? enr.enrolled_at.slice(0, 10) : '—',
        { content: statusLabel, badge: badgeType },
        { content: paymentLabel, badge: paymentBadge },
        `${p.toLocaleString()} / ${d.toLocaleString()}`,
      ];
    });

    exportTableToPDF({
      title,
      subtitle,
      docReference: `FS-ENR-${selectedCourse ? `CRS${selectedCourse.id}` : 'ALL'}-${new Date().getFullYear()}`,
      locale,
      orientation: 'landscape',
      summaryPills: [
        { label: locale === 'ar' ? 'إجمالي الطلبات' : locale === 'en' ? 'Total Applications' : 'Total Candidatures', value: displayedEnrollments.length },
        { label: locale === 'ar' ? 'الطلبات المؤكدة' : locale === 'en' ? 'Confirmed' : 'Confirmés', value: confirmedCount, color: '#16A34A' },
        { label: locale === 'ar' ? 'المبلغ المحصل' : locale === 'en' ? 'Total Collected' : 'Total Encaissé', value: `${totalRevenue.toLocaleString()} DZD`, color: '#0369A1' },
        { label: locale === 'ar' ? 'إجمالي المستحقات' : locale === 'en' ? 'Total Due' : 'Total Dû', value: `${totalDue.toLocaleString()} DZD`, color: '#3D1B0D' },
      ],
      headers,
      rows,
      notes: locale === 'ar'
        ? 'وثيقة رسمية صادرة عن أمانة أكاديمية فصيح للغات بالجزائر. تُعتمد لتتبع جاهزية الأفواج وإدراج الطلاب المؤكدين في ورقة الحضور الرسمية للأستاذ.'
        : locale === 'en'
        ? 'Official application record issued by the Secretariat of Fassi7 Language Academy. Confirmed candidates are automatically enrolled into instructor attendance matrices.'
        : 'Document officiel émis par le Secrétariat de l\'Académie Fassi7 des Langues. Les apprenants confirmés sont automatiquement synchronisés dans les listes d\'appel des formateurs.',
    });
  };

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
              <ClipboardList size={14} />
              {locale === 'ar' ? 'مسار التسجيل والقبول' : locale === 'en' ? 'Enrollment Pipeline' : 'Pipeline des Candidatures'}
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
              {pipelineKpis.totalApplications} {locale === 'ar' ? 'طلب إجمالي' : locale === 'en' ? 'Applications' : 'Candidatures'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: '#3D1B0D' }}>
            {locale === 'ar' ? 'مسار التسجيل وإدارة طلبات الالتحاق' : locale === 'en' ? 'Enrollment Pipeline by Course' : 'Pipeline des Inscriptions par Formation'}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: '#7A6258', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'تصفح الدورات التي تم إطلاق التسجيل بها، ومتابعة ترشيحات الطلاب من الطلب الأولي حتى القبول والتأكيد النهائي'
              : locale === 'en'
              ? 'Browse launched courses, track student candidates by cohort from submission to payment confirmation'
              : 'Consultez les formations ouvertes aux inscriptions et suivez le traitement des candidatures par cours'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>

      {actionSuccess && (
        <div style={{ 
          background: '#DEF7EC', 
          color: '#03543F', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem', 
          fontSize: '0.9rem', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          border: '1px solid #BCF0DA'
        }}>
          <CheckCircle2 size={18} color="#0E9F6E" />
          <span>{actionSuccess}</span>
        </div>
      )}

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
              {locale === 'ar' ? 'إجمالي الطلبات المستلمة' : locale === 'en' ? 'Total Applications' : 'Total Candidatures'}
            </span>
            <ClipboardList size={18} color="#FA461D" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#3D1B0D' }}>
            {pipelineKpis.totalApplications}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#7A6258', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
            {courses.length} {locale === 'ar' ? 'دورة مطروحة للتسجيل' : locale === 'en' ? 'active courses' : 'formations en ligne'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'المؤكدون في الأفواج' : locale === 'en' ? 'Confirmed & Active' : 'Inscrits Confirmés'}
            </span>
            <CheckCircle2 size={18} color="#16A34A" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#166534' }}>
            {pipelineKpis.totalConfirmed}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#16A34A', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
            {locale === 'ar' ? '✓ تم إدراجهم في ورقة الحضور' : locale === 'en' ? '✓ Active in Roll Call Sheets' : '✓ Présents dans les listes'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'في انتظار الدفع' : locale === 'en' ? 'Awaiting Payment' : 'En Attente de Paiement'}
            </span>
            <Clock size={18} color="#D97706" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#B45309' }}>
            {pipelineKpis.totalAwaiting}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#B45309', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
            {locale === 'ar' ? 'وصل بريدي موب / CCP قيد الترقب' : locale === 'en' ? 'Awaiting BaridiMob / CCP' : 'Validation BaridiMob/CCP'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'إجمالي المقابيض المحصلة' : locale === 'en' ? 'Collected Revenue' : 'Recettes Encaissées'}
            </span>
            <DollarSign size={18} color="#0284C7" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0369A1' }}>
            {pipelineKpis.totalPaid.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t('price_dzd')}</span>
          </span>
          <span style={{ fontSize: '0.74rem', color: '#0284C7', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
            {locale === 'ar' ? 'تسوية فورية ومحاسبة منتظمة' : locale === 'en' ? 'Direct Treasury Sync' : 'Comptabilité synchronisée'}
          </span>
        </div>
      </div>

      {/* Main Navigation Mode Tabs */}
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
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Tab 1: BY COURSE / COHORTS */}
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
            <span>{locale === 'ar' ? 'تصفح حسب الدورة والفوج' : locale === 'en' ? 'Courses & Applications' : 'Formations & Candidatures'}</span>
          </button>

          {/* Tab 2: ALL APPLICATIONS PIPELINE */}
          <button
            type="button"
            onClick={() => {
              setViewMode('all_pipeline');
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
              border: viewMode === 'all_pipeline' ? '1.5px solid #0284C7' : '1px solid #E5E7EB',
              backgroundColor: viewMode === 'all_pipeline' ? '#F0F9FF' : '#F9FAFB',
              color: viewMode === 'all_pipeline' ? '#0369A1' : '#4B5563',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} />
            <span>{locale === 'ar' ? 'السجل العام لكافة الطلبات' : locale === 'en' ? 'All Applications Pipeline' : 'Toutes les Candidatures'}</span>
          </button>
        </div>

        <div style={{ fontSize: '0.84rem', color: '#7A6258' }}>
          {viewMode === 'by_course'
            ? selectedCourse
              ? (locale === 'ar'
                  ? `أنت تتصفح طلبات: ${getLocalizedCourseTitle(selectedCourse, locale)}`
                  : locale === 'en'
                  ? `Viewing applications for: ${getLocalizedCourseTitle(selectedCourse, locale)}`
                  : `Affichage des candidatures pour: ${getLocalizedCourseTitle(selectedCourse, locale)}`)
              : (locale === 'ar'
                  ? 'اختر دورة لعرض طلبات التسجيل الخاصة بها'
                  : locale === 'en'
                  ? 'Select a course to view its application pipeline'
                  : 'Sélectionnez une formation pour gérer ses dossiers')
            : (locale === 'ar'
                ? `إجمالي ${enrollments.length} طلب في كافة الأقسام`
                : locale === 'en'
                ? `Total of ${enrollments.length} applications across all courses`
                : `${enrollments.length} candidatures au total`)}
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
                  const courseEnrs = enrollments.filter((e) => e.course_id === crs.id);
                  const totalCount = courseEnrs.length;
                  const confirmedCount = courseEnrs.filter((e) => e.status === 'confirmed').length;
                  const awaitingCount = courseEnrs.filter((e) => e.status === 'awaiting_payment').length;
                  const reviewCount = courseEnrs.filter((e) => e.status === 'under_review' || e.status === 'new').length;

                  return (
                    <div
                      key={crs.id}
                      onClick={() => {
                        setSelectedCourse(crs);
                        setApplicantSearch('');
                        setStatusFilter('all');
                      }}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #EADBCE',
                        borderRadius: '16px',
                        padding: '1.4rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 10px rgba(61, 27, 13, 0.04)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#FA461D';
                        e.currentTarget.style.boxShadow = '0 10px 24px rgba(250, 70, 29, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#EADBCE';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(61, 27, 13, 0.04)';
                      }}
                    >
                      <div>
                        {/* Course header pill & emoji */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '1.35rem' }}>{crs.flag_emoji || '🌐'}</span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                backgroundColor: '#FFF0EB',
                                color: '#FA461D',
                              }}
                            >
                              {locale === 'ar' ? crs.language_name_ar : locale === 'en' ? (crs.language_name_en || crs.language_name_fr) : (crs.language_name_fr || 'Langue')}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                            }}
                          >
                            {localizedLevel}
                          </span>
                        </div>

                        {/* Course Title */}
                        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#3D1B0D', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
                          {localizedTitle}
                        </h3>

                        {/* Price */}
                        <div style={{ marginBottom: '1.1rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FA461D' }}>
                            {(crs.price || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{t('price_dzd')}</span>
                          </span>
                        </div>

                        {/* Enrollment stats pills */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.45rem', marginBottom: '1.25rem' }}>
                          <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: '#6B7280', display: 'block', fontWeight: 700 }}>
                              {locale === 'ar' ? 'المجموع' : locale === 'en' ? 'Total' : 'Total'}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#111827' }}>
                              {totalCount}
                            </span>
                          </div>

                          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: '#065F46', display: 'block', fontWeight: 700 }}>
                              {locale === 'ar' ? 'مؤكد' : locale === 'en' ? 'Confirmed' : 'Confirmé'}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#047857' }}>
                              {confirmedCount}
                            </span>
                          </div>

                          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: '#92400E', display: 'block', fontWeight: 700 }}>
                              {locale === 'ar' ? 'معلق / فحص' : locale === 'en' ? 'Pending' : 'Attente'}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#B45309' }}>
                              {awaitingCount + reviewCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer action button */}
                      <div
                        style={{
                          borderTop: '1px solid #F3ECE5',
                          paddingTop: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', color: '#FA461D', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{locale === 'ar' ? 'فتح ملفات التسجيل للفوج' : locale === 'en' ? 'View Applications' : 'Consulter les dossiers'}</span>
                          {dir === 'rtl' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                        </span>

                        <span style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>
                          ID: #{crs.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* SUB-VIEW A2: DRILL-DOWN INTO A SPECIFIC COURSE APPLICATIONS */
            <div>
              {/* Breadcrumb & Navigation Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #FA461D',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 4px 14px rgba(250, 70, 29, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(null);
                      setStatusFilter('all');
                      setApplicantSearch('');
                    }}
                    className="btn-outline btn-sm"
                    style={{
                      gap: '0.35rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      backgroundColor: '#FFFFFF',
                      borderColor: '#D1D5DB',
                    }}
                  >
                    {dir === 'rtl' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                    <span>{locale === 'ar' ? 'الرجوع لكافة الدورات' : locale === 'en' ? 'Back to Courses' : 'Toutes les formations'}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{selectedCourse.flag_emoji || '🌐'}</span>
                    <div>
                      <h2 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#3D1B0D', margin: 0 }}>
                        {getLocalizedCourseTitle(selectedCourse, locale)}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem', fontSize: '0.78rem', color: '#7A6258' }}>
                        <span>{getLocalizedCourseLevel(selectedCourse.level, locale)}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 800, color: '#FA461D' }}>{(selectedCourse.price || 0).toLocaleString()} {t('price_dzd')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <ExportDropdown
                    onExportCSV={handleExportCSV}
                    onExportPDF={handleExportPDF}
                    size="sm"
                  />
                </div>
              </div>

              {/* Course Applications Roster Table with Filters */}
              {renderApplicationsTable(displayedEnrollments)}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: ALL APPLICATIONS MASTER PIPELINE VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'all_pipeline' && (
        <div>
          {renderApplicationsTable(displayedEnrollments, true)}
        </div>
      )}

      {/* Modal: Update Enrollment Status & Payment */}
      {isModalOpen && selectedEnrollment && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                  {locale === 'ar' ? 'معالجة ملف التسجيل وتأكيد الدفع' : locale === 'en' ? 'Process Application & Payment' : 'Gestion du Dossier & Validation Paiement'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedEnrollment.student_name} • {selectedEnrollment.course_title_fr}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'تغيير حالة الملف' : locale === 'en' ? 'Application Status' : 'Statut d\'inscription'} *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="new">{t('status_new')}</option>
                    <option value="under_review">{t('status_under_review')}</option>
                    <option value="accepted">{t('status_accepted')}</option>
                    <option value="awaiting_payment">{t('status_awaiting_payment')}</option>
                    <option value="confirmed">{t('status_confirmed')}</option>
                    <option value="completed">{t('status_completed')}</option>
                    <option value="cancelled">{t('status_cancelled')}</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'حالة الدفع (CCP / BaridiMob)' : locale === 'en' ? 'Payment Status' : 'Statut Paiement'}</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="form-select"
                    >
                      <option value="pending">{t('status_pending')}</option>
                      <option value="partially_paid">{t('status_partially_paid')}</option>
                      <option value="paid">{t('status_paid')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'المبلغ المسدد (دج)' : locale === 'en' ? 'Amount Paid (DZD)' : 'Montant Réglé (DZD)'}</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'ملاحظات الإدارة الداخلية' : locale === 'en' ? 'Internal Admin Notes' : 'Notes internes'}</label>
                  <textarea
                    rows={3}
                    placeholder={locale === 'ar' ? 'مثال: تم التحقق من وصل BaridiMob، وتأكيد انضمام الطالب لمجموعة الواتساب...' : locale === 'en' ? 'Ex: BaridiMob receipt verified, student added to WhatsApp group...' : 'Ex: Reçu BaridiMob vérifié, étudiant ajouté au groupe WhatsApp...'}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? '...' : t('action_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper render method for table
  function renderApplicationsTable(items: any[], showCourseColumn = false) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #EADBCE' }}>
        {/* Filter bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #F3ECE5',
            backgroundColor: '#FCFAF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
          }}
        >
          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['all', 'new', 'under_review', 'accepted', 'awaiting_payment', 'confirmed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={statusFilter === st ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
              >
                {st === 'all' ? (locale === 'ar' ? 'الكل' : locale === 'en' ? 'All' : 'Tous') : t(`status_${st}`)}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: '280px', width: '100%' }}>
            <Search size={14} color="#8C6F5A" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.75rem' }} />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث بالاسم، البريد أو الهاتف...' : locale === 'en' ? 'Search by name, email, phone...' : 'Recherche candidat...'}
              value={applicantSearch}
              onChange={(e) => setApplicantSearch(e.target.value)}
              className="form-input"
              style={{ paddingInlineStart: '2.1rem', fontSize: '0.82rem', paddingBlock: '0.35rem' }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#8C6F5A' }}>
            <ClipboardList size={36} color="#D1D5DB" style={{ margin: '0 auto 0.75rem auto', display: 'block' }} />
            <p style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>
              {locale === 'ar' ? 'لا توجد طلبات تسجيل مطابقة لهذا المعيار' : locale === 'en' ? 'No applications match this filter.' : 'Aucune candidature trouvée pour ce filtre.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'المرشح وبيانات الاتصال' : locale === 'en' ? 'Candidate & Contact' : 'Candidat & Contact'}</th>
                  {showCourseColumn && (
                    <th>{locale === 'ar' ? 'الدورة المختارة' : locale === 'en' ? 'Target Course' : 'Formation'}</th>
                  )}
                  <th>{locale === 'ar' ? 'تاريخ الطلب' : locale === 'en' ? 'Applied Date' : 'Date d\'envoi'}</th>
                  <th>{locale === 'ar' ? 'حالة الطلب' : locale === 'en' ? 'Application Status' : 'Statut Dossier'}</th>
                  <th>{locale === 'ar' ? 'حالة الدفع' : locale === 'en' ? 'Payment Status' : 'Paiement'}</th>
                  <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'التواصل & الإجراءات' : locale === 'en' ? 'Actions & Invite' : 'Actions & Suivi'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((enr) => (
                  <tr key={enr.id}>
                    <td>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                        {enr.student_name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} dir="ltr">
                          <Phone size={12} /> {enr.student_phone}
                        </span>
                        <span>•</span>
                        <span>{enr.student_email}</span>
                      </div>
                    </td>

                    {showCourseColumn && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span>{enr.flag_emoji || '🌐'}</span>
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                            {locale === 'ar' ? enr.language_name_ar : locale === 'en' ? (enr.language_name_en || enr.language_name_fr) : enr.language_name_fr}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700 }}>
                          {locale === 'ar' ? enr.course_title_ar : locale === 'en' ? (enr.course_title_en || enr.course_title_fr) : enr.course_title_fr}
                        </p>
                        <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800 }}>
                          {(enr.course_price || enr.amount_due || 0).toLocaleString()} {t('price_dzd')}
                        </span>
                      </td>
                    )}

                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {enr.enrolled_at ? new Date(enr.enrolled_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR') : '—'}
                      </span>
                    </td>

                    <td>{getStatusBadge(enr.status)}</td>

                    <td>
                      <span className={enr.payment_status === 'paid' ? 'badge badge-success' : enr.payment_status === 'partially_paid' ? 'badge badge-secondary' : 'badge badge-warning'}>
                        {t(`status_${enr.payment_status}`)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                        {(enr.amount_paid || 0).toLocaleString()} / {(enr.course_price || enr.amount_due || 0).toLocaleString()} {t('price_dzd')}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        {/* 1-Click Quick Activate Button if not already confirmed */}
                        {enr.status !== 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleQuickActivate(enr)}
                            className="btn-primary btn-sm"
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.76rem',
                              backgroundColor: '#10B981',
                              borderColor: '#10B981',
                              gap: '0.3rem',
                            }}
                            title={locale === 'ar' ? 'تأكيد التسجيل وتفعيل الحساب فوراً' : locale === 'en' ? 'Quick Confirm & Activate' : 'Confirmer et Activer'}
                          >
                            <CheckCircle2 size={13} />
                            <span>{locale === 'ar' ? 'تأكيد' : locale === 'en' ? 'Confirm' : 'Valider'}</span>
                          </button>
                        )}

                        {/* WhatsApp Invite */}
                        <a
                          href={getWhatsAppInviteUrl(enr)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-outline btn-sm"
                          style={{
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.76rem',
                            color: '#16A34A',
                            borderColor: '#86EFAC',
                            gap: '0.25rem',
                          }}
                          title={locale === 'ar' ? 'إرسال رابط مجموعة الفوج عبر الواتساب' : locale === 'en' ? 'Send WhatsApp Cohort Invite' : 'Inviter sur WhatsApp'}
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </a>

                        {/* Edit / Manage Modal Button */}
                        <button
                          onClick={() => openStatusModal(enr)}
                          className="btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', gap: '0.3rem' }}
                          title={locale === 'ar' ? 'تعديل حالة الملف والدفع' : locale === 'en' ? 'Manage Application' : 'Gérer'}
                        >
                          <Edit2 size={13} />
                          <span>{locale === 'ar' ? 'تعديل' : locale === 'en' ? 'Manage' : 'Gérer'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
}
