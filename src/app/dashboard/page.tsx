'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { ReceiptModal } from '@/components/ReceiptModal';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  ClipboardList,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  Printer,
  TrendingUp,
  Clock,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { t, locale, dir } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [repRes, enrRes, payRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/enrollments'),
          fetch('/api/payments'),
        ]);

        const rep = await repRes.json();
        const enr = await enrRes.json();
        const pay = await payRes.json();

        setData(rep);
        setEnrollments(enr.enrollments || []);
        setPayments(pay.payments || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleViewReceipt = (p: any) => {
    setSelectedReceipt(p);
    setIsReceiptModalOpen(true);
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
        return <span className="badge badge-success">{t('status_confirmed')}</span>;
      case 'completed':
        return <span className="badge badge-dark">{t('status_completed')}</span>;
      case 'cancelled':
        return <span className="badge badge-danger">{t('status_cancelled')}</span>;
      case 'paid':
        return <span className="badge badge-success">{t('status_paid')}</span>;
      case 'partially_paid':
        return <span className="badge badge-secondary">{t('status_partially_paid')}</span>;
      default:
        return <span className="badge badge-dark">{st}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
        {locale === 'ar' ? 'جاري تحميل لوحة التحكم...' : 'Chargement du tableau de bord...'}
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div>
      {/* Top Banner & Quick Shortcuts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {locale === 'ar' ? 'مرحباً بك في إدارة أكاديمية فصيح' : 'Tableau de Bord Opérationnel'}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            {locale === 'ar' ? 'متابعة شاملة للطلاب، الحصص، التسجيلات، والعمليات المالية' : 'Statistiques en direct issues de la base de données'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/schedule" className="btn-outline btn-sm">
            <Calendar size={15} color="var(--primary)" />
            <span>{locale === 'ar' ? 'برمجة حصة' : 'Planifier séance'}</span>
          </Link>
          <Link href="/dashboard/courses" className="btn-outline btn-sm">
            <BookOpen size={15} color="var(--secondary)" />
            <span>{locale === 'ar' ? 'إضافة دورة' : 'Nouveau cours'}</span>
          </Link>
          <Link href="/dashboard/payments" className="btn-primary btn-sm">
            <DollarSign size={15} />
            <span>{locale === 'ar' ? 'تسجيل دفعة' : 'Encaisser paiement'}</span>
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Total Students */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'إجمالي الطلاب المسجلين' : locale === 'en' ? 'Total Enrolled Students' : 'Total Étudiants'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark-brown)' }}>
            {kpis.total_students || 0}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
            <TrendingUp size={13} /> {locale === 'ar' ? 'حسابات طلاب نشطة' : locale === 'en' ? 'Active student accounts' : 'Comptes actifs'}
          </span>
        </div>

        {/* New Inquiries */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'طلبات التسجيل الجديدة' : locale === 'en' ? 'New Registration Requests' : 'Nouvelles Inscriptions'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--info-light)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
            {kpis.new_requests || 0}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
            {locale === 'ar' ? 'طلبات بانتظار المراجعة' : locale === 'en' ? 'Applications awaiting review' : 'Dossiers à traiter'}
          </span>
        </div>

        {/* Confirmed Enrollments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'التسجيلات المؤكدة' : locale === 'en' ? 'Confirmed Enrollments' : 'Inscriptions Confirmées'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981' }}>
            {kpis.confirmed_enrollments || 0}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
            {locale === 'ar' ? 'طلاب في الأفواج الحالية' : locale === 'en' ? 'Students currently in cohorts' : 'Étudiants en cours'}
          </span>
        </div>

        {/* Active Courses */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'الدورات التدريبية النشطة' : locale === 'en' ? 'Active Courses' : 'Formations Actives'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--secondary-light)', color: '#9E6500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark-brown)' }}>
            {kpis.active_courses || 0}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
            {locale === 'ar' ? 'في 7 لغات مختلفة' : locale === 'en' ? 'Across 7 languages' : 'En 7 langues'}
          </span>
        </div>

        {/* Upcoming Sessions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'الحصص المجدولة' : locale === 'en' ? 'Upcoming Class Sessions' : 'Séances Planifiées'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(61, 27, 13, 0.08)', color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark-brown)' }}>
            {kpis.upcoming_sessions || 0}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
            {locale === 'ar' ? 'حصص مجدولة هذا الأسبوع' : locale === 'en' ? 'Sessions scheduled this week' : 'Séances cette semaine'}
          </span>
        </div>

        {/* Total Revenue */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, var(--bg-warm) 100%)', border: '1.5px solid var(--secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--dark-brown)' }}>
              {locale === 'ar' ? 'إجمالي الإيرادات المحصلة' : locale === 'en' ? 'Total Revenue Collected' : 'Recettes Encaissées'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--secondary)', color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>
            {kpis.total_revenue?.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>{t('price_dzd')}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, display: 'block', marginTop: '0.4rem' }}>
            {locale === 'ar' ? 'تم تحصيلها وإصدار وصولات رسمية' : locale === 'en' ? 'Collected with official receipts' : 'Encaissés avec reçus'}
          </span>
        </div>

        {/* Pending Balance */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'أرصدة متبقية قيد الاستحقاق' : locale === 'en' ? 'Remaining Balances Due' : 'Soldes Restants Dus'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--warning)' }}>
            {kpis.total_balance_due?.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>{t('price_dzd')}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
            {locale === 'ar' ? 'أقساط ثانية مستحقة' : locale === 'en' ? 'Remaining installments due' : 'Tranches à recouvrer'}
          </span>
        </div>

        {/* Teachers */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'هيئة التدريس المعتمدة' : locale === 'en' ? 'Faculty Instructors' : 'Formateurs Agréés'}
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark-brown)' }}>
            {kpis.total_teachers || 0}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
            {locale === 'ar' ? 'أساتذة ومدربين معتمدين' : locale === 'en' ? 'Active certified instructors' : 'Formateurs en activité'}
          </span>
        </div>
      </div>

      {/* 2 Bottom Tables: Recent Enrollments & Recent Financial Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '2rem' }}>
        {/* Recent Enrollments */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
              {locale === 'ar' ? 'أحدث طلبات التسجيل' : 'Dernières Inscriptions'}
            </h3>
            <Link href="/dashboard/enrollments" className="btn-outline btn-sm">
              <span>{locale === 'ar' ? 'عرض الكل' : 'Voir tout'}</span>
              {dir === 'rtl' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'الطالب' : 'Étudiant'}</th>
                  <th>{locale === 'ar' ? 'الدورة' : 'Formation'}</th>
                  <th>{locale === 'ar' ? 'الحالة' : 'Statut'}</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.slice(0, 5).map((e) => (
                  <tr key={e.id}>
                    <td>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>{e.student_name}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.student_phone}</span>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>{locale === 'ar' ? e.course_title_ar : e.course_title_fr}</p>
                    </td>
                    <td>{getStatusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
              {locale === 'ar' ? 'أحدث المعاملات المالية والوصولات' : 'Derniers Encaissements'}
            </h3>
            <Link href="/dashboard/payments" className="btn-outline btn-sm">
              <span>{locale === 'ar' ? 'عرض المالية' : 'Voir finances'}</span>
              {dir === 'rtl' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'الوصل' : 'Reçu'}</th>
                  <th>{locale === 'ar' ? 'الطالب' : 'Étudiant'}</th>
                  <th>{locale === 'ar' ? 'المبلغ' : 'Montant'}</th>
                  <th>{locale === 'ar' ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--primary)' }}>
                        {p.receipt_number}
                      </span>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{p.student_name}</p>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--dark-brown)' }}>
                        {p.amount?.toLocaleString()} {t('price_dzd')}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewReceipt(p)}
                        className="btn-outline btn-sm"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                      >
                        <Printer size={13} />
                        <span>{locale === 'ar' ? 'الوصل' : 'Reçu'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
