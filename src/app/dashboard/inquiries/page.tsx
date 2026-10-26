'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, Phone, MessageSquare, CheckCircle, Clock, X, Edit2 } from 'lucide-react';

export default function InquiriesManagePage() {
  const { t, locale } = useLanguage();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Modal
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('contacted');
  const [replyNotes, setReplyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const openStatusModal = (inq: any) => {
    setSelectedInquiry(inq);
    setNewStatus(inq.status);
    setReplyNotes(inq.admin_reply_notes || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInquiry.id,
          status: newStatus,
          admin_reply_notes: replyNotes,
        }),
      });

      if (res.ok) {
        setSelectedInquiry(null);
        loadInquiries();
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
        return <span className="badge badge-info">{locale === 'ar' ? 'جديد' : 'Nouveau'}</span>;
      case 'contacted':
        return <span className="badge badge-warning">{locale === 'ar' ? 'تم التواصل' : 'Contacté'}</span>;
      case 'enrolled':
        return <span className="badge badge-success">{locale === 'ar' ? 'سجل في دورة' : 'Inscrit'}</span>;
      case 'closed':
        return <span className="badge badge-dark">{locale === 'ar' ? 'مغلق' : 'Clôturé'}</span>;
      default:
        return <span className="badge badge-dark">{st}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_inquiries')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'متابعة استفسارات الزوار وطلبات التواصل الواردة من الموقع'
              : 'Prospects et demandes de renseignements formulées en ligne'}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'المرسل والاتصال' : 'Contact'}</th>
                <th>{locale === 'ar' ? 'اللغة والموضوع' : 'Sujet'}</th>
                <th>{locale === 'ar' ? 'نص الرسالة' : 'Message'}</th>
                <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Statut'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'معالجة' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq.id}>
                  <td>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                      {inq.full_name}
                    </p>
                    <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span dir="ltr">{inq.phone}</span>
                      <span>•</span>
                      <span>{inq.email}</span>
                    </div>
                  </td>
                  <td>
                    {inq.preferred_language && (
                      <span className="badge badge-primary" style={{ marginBottom: '0.2rem' }}>
                        {inq.preferred_language}
                      </span>
                    )}
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{inq.subject || '-'}</p>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {inq.message}
                    </p>
                    {inq.admin_reply_notes && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'block', marginTop: '0.3rem' }}>
                        Note: {inq.admin_reply_notes}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(inq.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}
                    </span>
                  </td>
                  <td>{getStatusBadge(inq.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => openStatusModal(inq)}
                      className="btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal update inquiry */}
      {selectedInquiry && (
        <div className="modal-overlay" onClick={() => setSelectedInquiry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {locale === 'ar' ? 'متابعة الاستفسار' : 'Suivi de la demande'}
              </h3>
              <button onClick={() => setSelectedInquiry(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'حالة المتابعة' : 'Statut'}</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="new">Nouveau / جديد</option>
                    <option value="contacted">Contacté / تم التواصل</option>
                    <option value="enrolled">Inscrit / سجل في دورة</option>
                    <option value="closed">Clôturé / مغلق</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'ملاحظة الإدارة أو نتيجة الاتصال' : 'Compte-rendu'}</label>
                  <textarea
                    rows={3}
                    placeholder={locale === 'ar' ? 'مثال: تم التواصل عبر واتساب وإرسال رابط التسجيل...' : 'Ex: Envoyé brochure par WhatsApp...'}
                    value={replyNotes}
                    onChange={(e) => setReplyNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedInquiry(null)} className="btn-outline btn-sm">
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
