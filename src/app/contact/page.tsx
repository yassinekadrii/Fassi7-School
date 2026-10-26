'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2, Clock, Headphones } from 'lucide-react';

export default function ContactPage() {
  const { t, locale } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLang, setPreferredLang] = useState('Anglais');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          preferred_language: preferredLang,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
            <Mail size={15} />
            {t('nav_contact')}
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            {locale === 'ar' ? 'تواصل معنا واستشر فريقنا التعليمي' : locale === 'en' ? 'Get in Touch with Our Academic Team' : 'Contactez Notre Équipe'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {locale === 'ar'
              ? 'فريق الاستشارات الأكاديمية متواجد للإجابة على جميع تساؤلاتكم ومساعدتكم في اختيار البرنامج الأنسب.'
              : locale === 'en'
              ? 'Our academic advisors are available to answer your questions and guide you toward the right language program.'
              : 'Nos conseillers pédagogiques vous répondent sous 24h ouvrées.'}
          </p>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-warm)', padding: '4rem 0', flex: 1 }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
            }}
          >
            {/* Contact Information & Channels */}
            <div>
              {/* 3D Mascot Advisor Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px solid rgba(250, 73, 31, 0.2)',
                  padding: '1.5rem',
                  marginBottom: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div
                  style={{
                    width: '105px',
                    height: '105px',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '3px solid #FFF0EB',
                    boxShadow: '0 8px 20px rgba(250, 73, 31, 0.12)',
                  }}
                >
                  <img
                    src="/images/Position 02.jpg.jpeg"
                    alt="Fassi7 3D Advisor"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#FA491F',
                      backgroundColor: '#FFF0EB',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <Headphones size={13} />
                    {locale === 'ar' ? 'فريق فصيح في الاستماع' : locale === 'en' ? 'Fassi7 is Listening' : 'À Votre Écoute'}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: 'var(--dark-brown)' }}>
                    {locale === 'ar' ? 'استشارة لغوية وتحديد المستوى' : locale === 'en' ? 'Free Orientation & Level Placement' : 'Conseil & Orientation Gratuits'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {locale === 'ar'
                      ? 'لست متأكداً من الدورة الأنسب؟ مستشارونا يساعدونك خطوة بخطوة في اختيار مسار مرن يتكيف مع حياتك.'
                      : locale === 'en'
                      ? 'Unsure which program fits your lifestyle? Our advisors guide you step-by-step toward fluency.'
                      : 'Nos conseillers vous orientent vers le parcours adapté à vos objectifs et votre rythme.'}
                  </p>
                </div>
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? 'قنوات التواصل المباشرة' : locale === 'en' ? 'Direct Contact Channels' : 'Coordonnées Officielles'}
              </h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '0.96rem' }}>
                {locale === 'ar'
                  ? 'يسعدنا استقبالكم حضورياً في مقر الأكاديمية أو التواصل معكم عبر الهاتف وتطبيق واتساب على مدار أيام الأسبوع.'
                  : locale === 'en'
                  ? 'We welcome you at our Algiers headquarters or assist you directly via phone and WhatsApp throughout the week.'
                  : 'Nous vous accueillons au siège ou répondons rapidement par WhatsApp et téléphone.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>
                      {locale === 'ar' ? 'المقر الرئيسي' : locale === 'en' ? 'Headquarters' : 'Adresse du Siège'}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('footer_address')}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--secondary-light)', color: '#9E6500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>
                      {locale === 'ar' ? 'الهاتف' : locale === 'en' ? 'Phone' : 'Téléphone'}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }} dir="ltr">+213 550 12 34 56 / +213 661 11 22 33</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(61, 27, 13, 0.08)', color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>
                      {locale === 'ar' ? 'البريد الإلكتروني' : locale === 'en' ? 'Email' : 'Email'}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>contact@fassi7.com / support@fassi7.com</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem' }}>
                      {locale === 'ar' ? 'أوقات العمل' : locale === 'en' ? 'Working Hours' : 'Horaires d\'ouverture'}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {locale === 'ar' ? 'السبت إلى الخميس: 09:00 - 18:00' : locale === 'en' ? 'Saturday to Thursday: 09:00 - 18:00' : 'Samedi au Jeudi : 09h00 - 18h00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Callout */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)',
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem' }}>
                    {locale === 'ar' ? 'محادثة فورية عبر واتساب' : locale === 'en' ? 'Instant WhatsApp Chat' : 'Assistance WhatsApp'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'رد سريع من مستشارنا التعليمي' : locale === 'en' ? 'Guaranteed quick response from our advisors' : 'Réponse rapide garantie'}
                  </p>
                </div>
                <a
                  href="https://wa.me/213550123456"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <MessageSquare size={16} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Validated Inquiry Form */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--border)',
                padding: 'clamp(1.75rem, 4vw, 2.75rem)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? 'أرسل لنا استفسارك' : locale === 'en' ? 'Send Us an Inquiry' : 'Envoyer un Message'}
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {locale === 'ar' ? 'املأ النموذج وسنتصل بك في أقرب وقت.' : locale === 'en' ? 'Fill out the form below and an advisor will contact you.' : 'Remplissez le formulaire ci-dessous.'}
              </p>

              {success ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>{t('form_success_title')}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
                    {locale === 'ar'
                      ? 'تم استلام استفسارك وتسجيله في النظام. سيتصل بك فريق فصيح خلال أقل من 24 ساعة.'
                      : locale === 'en'
                      ? 'Your inquiry has been successfully registered. Our academic team will get in touch with you within 24 hours.'
                      : 'Votre message a bien été transmis à nos conseillers.'}
                  </p>
                  <button onClick={() => setSuccess(false)} className="btn-outline btn-sm">
                    {locale === 'ar' ? 'إرسال رسالة أخرى' : locale === 'en' ? 'Send another inquiry' : 'Envoyer un autre message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">{t('form_full_name')} *</label>
                    <input
                      type="text"
                      required
                      placeholder={locale === 'ar' ? 'الاسم الكامل' : locale === 'en' ? 'Full Name' : 'Votre nom complet'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">{t('form_email')} *</label>
                      <input
                        type="email"
                        required
                        placeholder="exemple@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('form_phone')} *</label>
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        placeholder="+213 550 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">
                        {locale === 'ar' ? 'اللغة التي تود تعلمها' : locale === 'en' ? 'Desired Language' : 'Langue souhaitée'}
                      </label>
                      <select
                        value={preferredLang}
                        onChange={(e) => setPreferredLang(e.target.value)}
                        className="form-select"
                      >
                        <option value="Anglais">🇬🇧 English / Anglais / الإنجليزية</option>
                        <option value="Français">🇫🇷 French / Français / الفرنسية</option>
                        <option value="Allemand">🇩🇪 German / Allemand / الألمانية</option>
                        <option value="Espagnol">🇪🇸 Spanish / Espagnol / الإسبانية</option>
                        <option value="Turc">🇹🇷 Turkish / Turc / التركية</option>
                        <option value="Italien">🇮🇹 Italian / Italien / الإيطالية</option>
                        <option value="Arabe">🇩🇿 Arabic / Arabe / العربية</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {locale === 'ar' ? 'موضوع الاستفسار' : locale === 'en' ? 'Subject' : 'Objet'}
                      </label>
                      <input
                        type="text"
                        placeholder={locale === 'ar' ? 'مثال: موعد انطلاق دورة IELTS' : locale === 'en' ? 'e.g., IELTS cohort start date' : 'Ex: Renseignements IELTS'}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {locale === 'ar' ? 'نص الرسالة أو الاستفسار' : locale === 'en' ? 'Your Message or Question' : 'Votre message'} *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder={locale === 'ar' ? 'اكتب استفسارك هنا بكل تفصيل...' : locale === 'en' ? 'Describe your question or learning goal here...' : 'Détaillez votre demande ici...'}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="form-textarea"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.95rem', fontSize: '1rem' }}
                  >
                    <Send size={18} />
                    <span>{loading ? '...' : locale === 'ar' ? 'إرسال الاستفسار الآن' : locale === 'en' ? 'Send Inquiry Now' : 'Envoyer ma demande'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
