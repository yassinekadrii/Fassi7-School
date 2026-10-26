'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Target, Heart, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  const { t, locale, dir } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Header Banner */}
      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '5rem 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
            <Sparkles size={15} />
            {t('nav_about')}
          </span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.25 }}>
            {locale === 'ar'
              ? 'فصيح (Multilinguo سابقاً): رحلة الشغف والإتقان'
              : locale === 'en'
              ? 'Fassi7 (formerly Multilinguo): Our Story & Heritage'
              : 'Notre Histoire : De Multilinguo à Fassi7'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: '1.8' }}>
            {t('academy_tagline')}
          </p>
        </div>
      </section>

      {/* Story & Evolution */}
      <section style={{ backgroundColor: 'var(--bg-warm)', padding: '5rem 0' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid var(--border)',
              padding: 'clamp(2rem, 5vw, 4.5rem)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3.5rem',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '4rem',
            }}
          >
            <div>
              <span className="badge badge-secondary" style={{ marginBottom: '1rem' }}>
                <ShieldCheck size={15} />
                {t('heritage_badge')}
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.3rem)', fontWeight: 900, marginBottom: '1.25rem' }}>
                {locale === 'ar'
                  ? 'كيف بدأت الحكاية وإلى أين نمضي؟'
                  : locale === 'en'
                  ? 'How Our Story Began & Where We Are Headed'
                  : 'Une Ambition Constante, Un Nouveau Regard'}
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '1.25rem' }}>
                {locale === 'ar'
                  ? 'تأسست الأكاديمية تحت اسم Multilinguo بهدف سد الفجوة بين التعليم النظري للغات والقدرة الفعلية على التحدث والتواصل. خلال سنوات من العمل الدؤوب في الجزائر، رافقنا أكثر من 5,000 طالب وطالبة استطاعوا اجتياز امتحانات IELTS و TCF و Goethe بنجاح، وتحقيق أحلامهم في الدراسة والعمل بالخارج.'
                  : locale === 'en'
                  ? 'Founded under the name Multilinguo Academy, our institution emerged to bridge the critical gap between passive grammar theory and active communicative fluency. Over years of dedicated service in Algeria, we have coached over 5,000 learners to achieve top scores in IELTS, TCF, and Goethe certifications, unlocking international academic scholarships and career moves.'
                  : 'Créée sous l\'enseigne Multilinguo, notre académie est née du constat que l\'apprentissage classique privilégie la théorie au détriment de l\'expression vivante. En quelques années, nous avons guidé plus de 5.000 apprenants vers la réussite de leurs certifications officielles.'}
              </p>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '2rem' }}>
                {locale === 'ar'
                  ? 'مع إطلاق هوية "فصيح" (Fassi7)، نجدد عهدنا بالتميز من خلال بنية تحتية رقمية أكثر مرونة، ونظام إدارة أكاديمي ذكي، ومناهج محادثة تفاعلية تُشجع على الانطلاق وتجاوز التردد.'
                  : locale === 'en'
                  ? 'With the launch of Fassi7, we reaffirm our commitment to educational excellence through an agile digital platform, an intelligent management system, and immersive speaking-first methodologies that break the barrier of hesitation.'
                  : 'Avec Fassi7, nous réaffirmons notre engagement vers l\'excellence à travers une plateforme plus moderne, des effectifs réduits et une méthode d\'immersion orale résolument efficace.'}
              </p>

              <Link href="/courses" className="btn-primary">
                <span>{t('cta_explore_courses')}</span>
                {dir === 'rtl' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </Link>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  border: '4px solid #FFFFFF',
                  boxShadow: '0 20px 45px rgba(250, 73, 31, 0.18)',
                  maxWidth: '420px',
                  margin: '0 auto',
                  backgroundColor: '#F6F3EE',
                }}
              >
                <img
                  src="/images/Position 04.jpg.jpeg"
                  alt="Fassi7 3D Academic Mascot"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>
          </div>

          {/* Mission & Vision Cards directly aligned with Fassi7 Brand Identity */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginBottom: '4rem',
            }}
          >
            <div className="card">
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Target size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.85rem' }}>
                {locale === 'ar' ? 'رسالتنا الأكاديمية (Brand Mission)' : locale === 'en' ? 'Our Mission' : 'Notre Mission'}
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                {locale === 'ar'
                  ? 'توفير خيارات تعليم متعددة ومرنة تمكن المتعلمين من تطوير لغاتهم بطريقة تتكيف مع ظروف حياتهم، وتساعدهم على الاستمرار والتقدم دون أن يصبح التعلم عائقاً أمام التزاماتهم اليومية.'
                  : locale === 'en'
                  ? 'Providing diverse, flexible learning paths enabling learners to master languages in harmony with their lifestyle, empowering continuous growth without disrupting their daily commitments.'
                  : 'Offrir des solutions d\'apprentissage flexibles qui s\'adaptent au rythme de vie de chaque apprenant pour progresser en toute sérénité.'}
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--secondary-light)',
                  color: '#9E6500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Sparkles size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.85rem' }}>
                {locale === 'ar' ? 'رؤيتنا المستقبلية (Brand Vision)' : locale === 'en' ? 'Our Vision' : 'Notre Vision'}
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                {locale === 'ar'
                  ? 'أن يصبح تعلم اللغات تجربة متاحة ومرنة تتكيف مع حياة الإنسان، بحيث لا تمنعه ظروفه أو التزاماته من اكتساب لغة تفتح أمامه فرصاً جديدة في الدراسة والعمل والسفر والتواصل.'
                  : locale === 'en'
                  ? 'To make language acquisition an accessible, adaptive experience that fits human life, ensuring no personal circumstance holds anyone back from unlocking opportunities in study, career, and travel.'
                  : 'Faire de l\'apprentissage des langues une expérience accessible et fluide qui ouvre les portes des études, du travail et de la mobilité internationale.'}
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(61, 27, 13, 0.08)',
                  color: 'var(--dark-brown)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Heart size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.85rem' }}>
                {locale === 'ar' ? 'ركائز هويتنا (Brand Personality)' : locale === 'en' ? 'Brand Personality' : 'Personnalité de Marque'}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {[
                  { en: 'Understanding', ar: 'متفهم' },
                  { en: 'Modern', ar: 'عصري' },
                  { en: 'Comfortable', ar: 'مريح' },
                  { en: 'Committed', ar: 'ملتزم' },
                  { en: 'Flexible', ar: 'مرن' },
                ].map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#F6F3EE',
                      color: 'var(--dark-brown)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(58, 20, 4, 0.1)',
                    }}
                  >
                    {locale === 'ar' ? item.ar : item.en}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Logo Anatomy & Philosophy Section */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid var(--border)',
              padding: 'clamp(2rem, 4vw, 3.5rem)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem auto' }}>
              <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
                {locale === 'ar' ? 'فلسفة الشعار الرمزية' : locale === 'en' ? 'Logo Anatomy & Meaning' : 'Signification du Logo'}
              </span>
              <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? 'ماذا يرمز شعار فصيح (Fassi7)؟' : locale === 'en' ? 'The Story Behind the Fassi7 Symbol' : 'L\'Histoire du Symbole Fassi7'}
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '2rem',
                alignItems: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <img
                  src="/images/Fassi7 - Symbol PNG-01.png"
                  alt="Fassi7 Official Symbol"
                  style={{
                    maxWidth: '180px',
                    margin: '0 auto',
                    display: 'block',
                    filter: 'drop-shadow(0 10px 20px rgba(250, 73, 31, 0.2))',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#FFF0EB',
                      color: '#FA491F',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', color: 'var(--dark-brown)' }}>
                      {locale === 'ar' ? 'الفقاعة المبتسمة: النطق وبوابة الفرص (Door & Speaking)' : 'The Smiling Bubble: Speaking & Door'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {locale === 'ar'
                        ? 'ترمز لكسر حاجز الخوف والحديث بطلاقة وابتسامة، والباب المفتوح أمام المتعلم لاكتشاف آفاق مهنية وعلمية جديدة.'
                        : 'Represents speaking with confidence and a smile, acting as an open doorway to global opportunities.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#FFF8E7',
                      color: '#FFAD17',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', color: 'var(--dark-brown)' }}>
                      {locale === 'ar' ? 'زنبرك المرونة والمرافقة (Spring, Flexibility & Accompaniment)' : 'The Spring: Flexibility & Accompaniment'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {locale === 'ar'
                        ? 'يمثل رقم 7 المرن التكيف مع جدول وظروف المتعلم، والمرافقة التدريبية المستمرة من البداية حتى الاحتراف.'
                        : 'Represents adaptive learning that flexes around your schedule, alongside continuous mentorship until mastery.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
