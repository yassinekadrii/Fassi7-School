'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Fassi7Logo } from './Fassi7Logo';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    receipt_number: string;
    student_name: string;
    student_email?: string;
    student_phone?: string;
    course_title_fr?: string;
    course_title_ar?: string;
    course_title_en?: string;
    amount: number;
    currency?: string;
    payment_method: string;
    reference_number?: string;
    payment_date: string;
    status: string;
    amount_due?: number;
    amount_paid?: number;
    notes?: string;
  } | null;
}

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const { t, locale } = useLanguage();

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'baridimob': return t('pay_baridimob');
      case 'ccp': return t('pay_ccp');
      case 'bank_transfer': return t('pay_bank');
      case 'cash': return t('pay_cash');
      case 'card': return t('pay_card');
      default: return method;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content receipt-printable" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header actions (hidden when printing) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-success">
              <CheckCircle size={14} />
              {locale === 'ar' ? 'وصل دفع رسمي معتمد' : locale === 'en' ? 'Certified Official Receipt' : 'Reçu Officiel Certifié'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              className="btn-primary btn-sm"
              style={{ borderRadius: 'var(--radius-full)', gap: '0.4rem' }}
            >
              <Printer size={15} />
              <span>{t('action_print_receipt')}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.4rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-muted)',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="modal-body" style={{ padding: '2.5rem' }}>
          {/* Top Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <Fassi7Logo size="md" asLink={false} />
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {locale === 'ar' ? 'أكاديمية فصيح للغات — الجزائر' : locale === 'en' ? 'Fassi7 Language Academy — Algiers' : 'Académie Fassi7 des Langues — Alger'}
              </p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                contact@fassi7.com • +213 550 12 34 56
              </p>
            </div>
            <div style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.4rem',
                }}
              >
                {receipt.receipt_number}
              </span>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {locale === 'ar' ? 'تاريخ المعاملة:' : locale === 'en' ? 'Issue Date:' : 'Date d\'émission:'}
              </p>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>
                {new Date(receipt.payment_date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Student Info Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-warm)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {locale === 'ar' ? 'اسم الطالب / المستفيد' : locale === 'en' ? 'Beneficiary / Student' : 'Bénéficiaire / Étudiant'}
              </p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark-brown)' }}>
                {receipt.student_name}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {locale === 'ar' ? 'طريقة الدفع والمرجع' : locale === 'en' ? 'Payment Method & Ref.' : 'Mode de paiement & Réf.'}
              </p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                {getMethodLabel(receipt.payment_method)}
              </p>
              {receipt.reference_number && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{receipt.reference_number}</span>
              )}
            </div>
          </div>

          {/* Table Breakdown */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {locale === 'ar' ? 'البيان / الدورة التدريبية' : locale === 'en' ? 'Course / Program Designation' : 'Désignation de la formation'}
                </th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: locale === 'ar' ? 'left' : 'right' }}>
                  {locale === 'ar' ? 'المبلغ المسدد' : locale === 'en' ? 'Amount Settled' : 'Montant Réglé'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 0.5rem' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                    {locale === 'ar'
                      ? receipt.course_title_ar
                      : locale === 'en'
                      ? receipt.course_title_en || receipt.course_title_fr
                      : receipt.course_title_fr}
                  </p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'رسوم التسجيل والتدريب المعتمد' : locale === 'en' ? 'Tuition and certified learning materials included' : 'Frais de scolarité & matériel pédagogique inclus'}
                  </p>
                </td>
                <td style={{ padding: '1rem 0.5rem', textAlign: locale === 'ar' ? 'left' : 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--dark-brown)' }}>
                  {receipt.amount?.toLocaleString()} {t('price_dzd')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Box */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-warm)',
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid rgba(250, 70, 29, 0.2)',
              marginBottom: '2rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? 'المبلغ الإجمالي المستلم:' : locale === 'en' ? 'Net Total Received:' : 'Total Reçu Net:'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                {receipt.amount?.toLocaleString()} {t('price_dzd')}
              </span>
            </div>
          </div>

          {/* Official Stamp & Signature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px dashed var(--border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <ShieldCheck size={20} color="var(--primary)" />
              <span>{locale === 'ar' ? 'وثيقة محاسبية إلكترونية صحيحة ومؤكدة' : locale === 'en' ? 'Certified valid electronic accounting document' : 'Document comptable certifié conforme'}</span>
            </div>
            <div
              style={{
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1.25rem',
                color: 'var(--primary)',
                fontWeight: 900,
                fontSize: '0.85rem',
                transform: 'rotate(-4deg)',
                textAlign: 'center',
                letterSpacing: '0.05em',
              }}
            >
              FASSI7 ACADEMY<br />
              <span style={{ fontSize: '0.7rem', color: 'var(--dark-brown)' }}>SERVICE COMPTABILITÉ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
