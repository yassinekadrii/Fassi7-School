'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ClipboardList, Filter, CheckCircle2, AlertCircle, Edit2, X, Phone, Mail } from 'lucide-react';

export default function EnrollmentsManagePage() {
  const { t, locale } = useLanguage();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Status edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('accepted');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadEnrollments = async () => {
    try {
      const url = statusFilter === 'all' ? '/api/enrollments' : `/api/enrollments?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setEnrollments(data.enrollments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [statusFilter]);

  const openStatusModal = (e: any) => {
    setSelectedEnrollment(e);
    setNewStatus(e.status);
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
          notes: adminNotes,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadEnrollments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
      default:
        return <span className="badge badge-dark">{st}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_enrollments')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'متابعة مسار التسجيل: من الطلب الأولي حتى القبول والتأكيد النهائي'
              : 'Gestion des candidatures, examen des dossiers et validation'}
          </p>
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'new', 'under_review', 'accepted', 'awaiting_payment', 'confirmed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              {st === 'all' ? (locale === 'ar' ? 'الكل' : 'Tous') : t(`status_${st}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الطالب وبيانات الاتصال' : 'Candidat & Contact'}</th>
                <th>{locale === 'ar' ? 'الدورة المختارة' : 'Formation'}</th>
                <th>{locale === 'ar' ? 'تاريخ الطلب' : 'Date d\'envoi'}</th>
                <th>{locale === 'ar' ? 'حالة الطلب' : 'Statut Dossier'}</th>
                <th>{locale === 'ar' ? 'حالة الدفع' : 'Paiement'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'معالجة' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => (
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
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span>{enr.flag_emoji}</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                        {enr.language_name_fr}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700 }}>
                      {locale === 'ar' ? enr.course_title_ar : enr.course_title_fr}
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800 }}>
                      {enr.course_price?.toLocaleString()} {t('price_dzd')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(enr.enrolled_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}
                    </span>
                  </td>
                  <td>{getStatusBadge(enr.status)}</td>
                  <td>
                    <span className={enr.payment_status === 'paid' ? 'badge badge-success' : enr.payment_status === 'partially_paid' ? 'badge badge-secondary' : 'badge badge-warning'}>
                      {t(`status_${enr.payment_status}`)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      {enr.amount_paid?.toLocaleString()} / {enr.amount_due?.toLocaleString()} {t('price_dzd')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => openStatusModal(enr)}
                      className="btn-outline btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem' }}
                    >
                      <Edit2 size={13} />
                      <span>{locale === 'ar' ? 'تحديث' : 'Mettre à jour'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Update Enrollment Status */}
      {isModalOpen && selectedEnrollment && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                  {locale === 'ar' ? 'تحديث حالة ملف التسجيل' : 'Mise à Jour du Dossier'}
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
                  <label className="form-label">{locale === 'ar' ? 'تغيير حالة الملف' : 'Statut d\'inscription'} *</label>
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

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'ملاحظات الإدارة الداخلية' : 'Notes internes'}</label>
                  <textarea
                    rows={3}
                    placeholder={locale === 'ar' ? 'مثال: تم الاتصال بالطالب وتأكيد مستواه الشفهي...' : 'Ex: Test de niveau effectué par téléphone...'}
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
}
