'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ReceiptModal } from '@/components/ReceiptModal';
import {
  DollarSign,
  Plus,
  Printer,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { ExportDropdown } from '@/components/ExportDropdown';
import { exportTableToPDF } from '@/lib/exportHelpers';

export default function PaymentsManagePage() {
  const { t, locale } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // New Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [amount, setAmount] = useState(18000);
  const [method, setMethod] = useState('baridimob');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [pRes, sRes, cRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/students'),
        fetch('/api/courses'),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();

      setPayments(pData.payments || []);
      setStats(pData.stats || {});
      setStudents(sData.students || []);
      setCourses(cData.courses || []);
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
    setStudentId(students[0]?.id || '');
    setCourseId(courses[0]?.id || '');
    setAmount(courses[0]?.price || 18000);
    setMethod('baridimob');
    setReference(`BM-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: Number(studentId),
          course_id: Number(courseId),
          amount: Number(amount),
          payment_method: method,
          reference_number: reference,
          status: 'paid',
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        loadData();
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Receipt', 'Student', 'Course', 'Amount_DZD', 'Method', 'Reference', 'Date', 'Status'];
    const rows = payments.map((p) => [
      p.receipt_number,
      `"${p.student_name}"`,
      `"${p.course_title_fr || ''}"`,
      p.amount,
      p.payment_method,
      `"${p.reference_number || ''}"`,
      p.payment_date,
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fassi7_payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodLabel = (m: string) => {
    switch (m) {
      case 'baridimob':
        return t('pay_baridimob');
      case 'ccp':
        return t('pay_ccp');
      case 'bank_transfer':
        return t('pay_bank');
      case 'cash':
        return t('pay_cash');
      case 'card':
        return t('pay_card');
      default:
        return m;
    }
  };

  const exportToPDF = () => {
    const headers = [
      locale === 'ar' ? 'رقم الوصل' : locale === 'en' ? 'Receipt #' : 'N° Reçu',
      locale === 'ar' ? 'الطالب' : locale === 'en' ? 'Student' : 'Apprenant',
      locale === 'ar' ? 'الدورة' : locale === 'en' ? 'Course' : 'Formation',
      locale === 'ar' ? 'المبلغ (دج)' : locale === 'en' ? 'Amount (DZD)' : 'Montant (DZD)',
      locale === 'ar' ? 'طريقة الدفع' : locale === 'en' ? 'Payment Method' : 'Mode Paiement',
      locale === 'ar' ? 'الرقم المرجعي' : locale === 'en' ? 'Reference' : 'Référence',
      locale === 'ar' ? 'التاريخ' : locale === 'en' ? 'Date' : 'Date',
      locale === 'ar' ? 'الحالة' : locale === 'en' ? 'Status' : 'Statut'
    ];

    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const rows = payments.map((p) => [
      p.receipt_number || '—',
      { content: p.student_name || '—', align: locale === 'ar' ? 'right' : 'left' as const },
      (locale === 'ar' ? p.course_title_ar : locale === 'en' ? p.course_title_en : p.course_title_fr) || p.course_title_fr || p.course_title_en || '—',
      { content: (p.amount || 0).toLocaleString(), align: 'right' as const },
      getMethodLabel(p.payment_method),
      p.reference_number || '—',
      p.payment_date || '—',
      {
        content: p.status === 'completed' || p.status === 'paid'
          ? (locale === 'ar' ? 'مقبول / مسدد' : locale === 'en' ? 'Paid / Validated' : 'Validé')
          : p.status,
        badge: (p.status === 'completed' || p.status === 'paid' ? 'success' : 'warning') as 'success' | 'warning'
      }
    ]);

    exportTableToPDF({
      title: locale === 'ar' ? 'سجل المقابيض والمدفوعات الرسمية' : locale === 'en' ? 'Official Payment & Revenue Register' : 'Journal Officiel des Encaissements et Règlements',
      subtitle: locale === 'ar' ? `إجمالي ${payments.length} عملية دفع مسجلة` : locale === 'en' ? `Total of ${payments.length} recorded transactions` : `${payments.length} transactions enregistrées au total`,
      docReference: `FS-PAY-${new Date().getFullYear()}`,
      locale,
      orientation: 'landscape',
      summaryPills: [
        { label: locale === 'ar' ? 'إجمالي المعاملات' : locale === 'en' ? 'Total Transactions' : 'Total Opérations', value: payments.length },
        { label: locale === 'ar' ? 'إجمالي المقابيض' : locale === 'en' ? 'Total Revenue' : 'Total Recettes', value: `${totalAmount.toLocaleString()} DZD`, color: '#16A34A' }
      ],
      headers,
      rows,
      notes: locale === 'ar'
        ? 'هذا المستند معتمد محاسبياً من مصلحة المالية لأكاديمية فصيح للغات.'
        : locale === 'en'
        ? 'Official accounting document certified by Fassi7 Language Academy finance department.'
        : 'Document comptable certifié par le service financier de l\'Académie Fassi7.'
    });
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'baridimob':
        return <span className="badge badge-primary">{t('pay_baridimob')}</span>;
      case 'ccp':
        return <span className="badge badge-secondary">{t('pay_ccp')}</span>;
      case 'bank_transfer':
        return <span className="badge badge-info">{t('pay_bank')}</span>;
      case 'cash':
        return <span className="badge badge-dark">{t('pay_cash')}</span>;
      case 'card':
        return <span className="badge badge-success">{t('pay_card')}</span>;
      default:
        return <span className="badge badge-dark">{m}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_payments')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'متابعة المقابيض، إصدار الوصولات الرسمية، وتصدير التقارير المالية'
              : locale === 'en'
              ? 'Revenue tracking, official receipt issuance, and financial reporting'
              : 'Encaissements, émission des reçus officiels et suivi comptable'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <ExportDropdown
            onExportCSV={exportToCSV}
            onExportPDF={exportToPDF}
          />
          <button onClick={openAddModal} className="btn-primary btn-sm">
            <Plus size={16} />
            <span>{locale === 'ar' ? 'تسجيل دفعة جديدة' : locale === 'en' ? 'Record New Payment' : 'Nouvel encaissement'}</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="card" style={{ border: '1.5px solid var(--secondary)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {t('dash_kpi_revenue')}
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.3rem' }}>
            {stats.total_revenue?.toLocaleString()} {t('price_dzd')}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'block', marginTop: '0.2rem' }}>
            {stats.total_transactions} {locale === 'ar' ? 'معاملة مسجلة' : locale === 'en' ? 'transactions' : 'transactions'}
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {locale === 'ar' ? 'المدفوعات عبر بريدي موب' : locale === 'en' ? 'BaridiMob Payments' : 'Encaissements BaridiMob'}
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark-brown)', marginTop: '0.3rem' }}>
            {locale === 'ar' ? 'الأكثر استخداماً' : locale === 'en' ? 'Most Popular' : 'Préféré par les élèves'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
            Algérie Poste • CCP
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {locale === 'ar' ? 'إجمالي الوصولات الصادرة' : locale === 'en' ? 'Official Receipts Issued' : 'Reçus Officiels Émis'}
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark-brown)', marginTop: '0.3rem' }}>
            {payments.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'block', marginTop: '0.2rem' }}>
            {locale === 'ar' ? 'معتمدة محاسبياً' : locale === 'en' ? 'Certified conform' : 'Certifiés conformes'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'رقم الوصل' : locale === 'en' ? 'Receipt #' : 'N° Reçu'}</th>
                <th>{locale === 'ar' ? 'الطالب' : locale === 'en' ? 'Student' : 'Étudiant'}</th>
                <th>{locale === 'ar' ? 'الدورة' : locale === 'en' ? 'Course' : 'Formation'}</th>
                <th>{locale === 'ar' ? 'المبلغ' : locale === 'en' ? 'Amount' : 'Montant'}</th>
                <th>{locale === 'ar' ? 'طريقة الدفع' : locale === 'en' ? 'Payment Method' : 'Moyen de paiement'}</th>
                <th>{locale === 'ar' ? 'التاريخ' : locale === 'en' ? 'Date' : 'Date'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'الوصل' : locale === 'en' ? 'Receipt' : 'Reçu'}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {p.receipt_number}
                    </span>
                  </td>
                  <td>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--dark-brown)' }}>
                      {p.student_name}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.student_phone}</span>
                  </td>
                  <td>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      {locale === 'ar' ? p.course_title_ar : locale === 'en' ? (p.course_title_en || p.course_title_fr) : p.course_title_fr}
                    </p>
                  </td>
                  <td>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--dark-brown)' }}>
                      {p.amount?.toLocaleString()} {t('price_dzd')}
                    </span>
                  </td>
                  <td>
                    {getMethodBadge(p.payment_method)}
                    {p.reference_number && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                        {p.reference_number}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(p.payment_date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setSelectedReceipt(p);
                        setIsReceiptModalOpen(true);
                      }}
                      className="btn-outline btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
                    >
                      <Printer size={13} color="var(--primary)" />
                      <span>{t('action_view_receipt')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {locale === 'ar' ? 'تسجيل دفعة مالية وإصدار وصل' : locale === 'en' ? 'Record Payment & Issue Receipt' : 'Encaisser un Paiement'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                {error && (
                  <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الطالب المستفيد' : locale === 'en' ? 'Student' : 'Étudiant'} *</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="form-select"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone || s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الدورة التدريبية' : locale === 'en' ? 'Course' : 'Formation'} *</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="form-select"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {locale === 'ar' ? c.title_ar : locale === 'en' ? (c.title_en || c.title_fr) : c.title_fr} ({c.price} DZD)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'المبلغ المستلم (دج)' : locale === 'en' ? 'Amount Received (DZD)' : 'Montant Réglé (DZD)'} *</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'طريقة الدفع' : locale === 'en' ? 'Payment Method' : 'Mode de Paiement'} *</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="form-select"
                    >
                      <option value="baridimob">{locale === 'ar' ? 'بريدي موب (BaridiMob)' : locale === 'en' ? 'BaridiMob' : 'BaridiMob'}</option>
                      <option value="ccp">{locale === 'ar' ? 'حوالة بريدية (CCP)' : locale === 'en' ? 'Postal Transfer (CCP)' : 'Virement postal (CCP)'}</option>
                      <option value="bank_transfer">{locale === 'ar' ? 'تحويل بنكي' : locale === 'en' ? 'Bank Transfer' : 'Virement bancaire'}</option>
                      <option value="cash">{locale === 'ar' ? 'نقداً بالمقر' : locale === 'en' ? 'Cash at front desk' : 'Espèces à l\'accueil'}</option>
                      <option value="card">{locale === 'ar' ? 'بطاقة CIB / الذهبية' : locale === 'en' ? 'CIB / Edahabia Card' : 'Carte CIB / Edahabia'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'رقم الحوالة / المرجع' : locale === 'en' ? 'Transaction # / Ref' : 'N° Transaction / Référence'}</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="form-input"
                    dir="ltr"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'ملاحظات المحاسبة' : locale === 'en' ? 'Accounting Notes' : 'Notes comptables'}</label>
                  <textarea
                    rows={2}
                    placeholder={locale === 'ar' ? 'دفعة كاملة أو قسط أول...' : locale === 'en' ? 'Full payment or initial deposit...' : 'Acompte ou règlement total...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? '...' : locale === 'ar' ? 'تأكيد وإصدار الوصل' : locale === 'en' ? 'Confirm & Issue Receipt' : 'Valider & Émettre le Reçu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
