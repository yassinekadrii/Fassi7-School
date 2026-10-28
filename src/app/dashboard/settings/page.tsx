'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Settings, Shield, Save, CheckCircle2, History, CreditCard } from 'lucide-react';

export default function SettingsManagePage() {
  const { t, locale } = useLanguage();
  const [academyName, setAcademyName] = useState('Académie Fassi7 des Langues (فصيح)');
  const [phone, setPhone] = useState('+213 550 12 34 56');
  const [whatsapp, setWhatsapp] = useState('+213 550 12 34 56');
  const [email, setEmail] = useState('contact@fassi7.com');
  const [baridiCcp, setBaridiCcp] = useState('0012345678 Clé 45');
  const [rip, setRip] = useState('00799999001234567845');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const auditLogs = [
    { id: 1, action: 'CONFIRM_ENROLLMENT', user: 'Nadia Mansouri', target: 'Karim Meziane (TCF Canada)', time: 'Il y a 10 min' },
    { id: 2, action: 'APPROVE_PAYMENT', user: 'Nadia Mansouri', target: 'BM-99283741 (24.000 DZD)', time: 'Il y a 25 min' },
    { id: 3, action: 'CREATE_SESSION', user: 'Super Admin', target: 'Atelier IELTS Writing Task 2', time: 'Il y a 2 heures' },
    { id: 4, action: 'UPDATE_LANGUAGE', user: 'Super Admin', target: 'Allemand (Goethe A1-B2)', time: 'Hier' },
    { id: 5, action: 'CREATE_COURSE', user: 'Super Admin', target: 'Espagnol Immersion A1-A2', time: 'Il y a 2 jours' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
          {locale === 'ar' ? 'إعدادات المنصة وسجل الأمان' : locale === 'en' ? 'Platform Settings & Audit Log' : 'Paramètres & Journal d\'Audit'}
        </h1>
        <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {locale === 'ar'
            ? 'تكوين بيانات الأكاديمية الرسمية، معلومات الحساب البريدي بريدي موب، ومراجعة سجل العمليات'
            : locale === 'en'
            ? 'Configure official academy information, BaridiMob payment details, and inspect the security audit trail'
            : 'Configuration générale, coordonnées BaridiMob et traçabilité'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem' }}>
        {/* General & Financial Settings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <CreditCard size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--dark-brown)' }}>
              {locale === 'ar' ? 'بيانات الأكاديمية والدفع المعتمدة' : locale === 'en' ? 'Official Academy & Payment Info' : 'Coordonnées & Paiements'}
            </h3>
          </div>

          {saved && (
            <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>{locale === 'ar' ? 'تم حفظ التعديلات بنجاح !' : locale === 'en' ? 'Settings saved successfully!' : 'Modifications enregistrées avec succès !'}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'اسم المنصة / الأكاديمية' : locale === 'en' ? 'Academy / Institution Name' : 'Nom de l\'Académie'}</label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('form_phone')}</label>
                <input
                  type="text"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input
                  type="text"
                  dir="ltr"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('form_email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem' }}>
                {locale === 'ar' ? 'بيانات الحساب البريدي الجزائري (CCP / BaridiMob)' : locale === 'en' ? 'Algerian Postal Payment Details (CCP / BaridiMob)' : 'Coordonnées CCP & BaridiMob'}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">N° Compte CCP</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={baridiCcp}
                    onChange={(e) => setBaridiCcp(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">RIP BaridiMob (20 chiffres)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={rip}
                    onChange={(e) => setRip(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}>
                <Save size={16} />
                <span>{t('action_save')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Audit Log */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <History size={20} color="var(--secondary)" />
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--dark-brown)' }}>
              {locale === 'ar' ? 'سجل العمليات الإدارية (Audit Log)' : locale === 'en' ? 'Administrative Audit & Security Log' : 'Journal d\'Audit & Sécurité'}
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {locale === 'ar'
              ? 'تسجيل فوري لجميع التعديلات والعمليات الحساسة لضمان الشفافية والأمان.'
              : locale === 'en'
              ? 'Full real-time audit trail of all sensitive operations ensuring transparency and data safety.'
              : 'Traçabilité intégrale de toutes les opérations sensibles.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-warm)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-dark" style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem' }}>
                      {log.action}
                    </span>
                    <span style={{ fontWeight: 800 }}>{log.user}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>{log.target}</p>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
