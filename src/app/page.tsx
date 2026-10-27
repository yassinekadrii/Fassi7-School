'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CourseCard } from '@/components/CourseCard';
import { EnrollmentModal } from '@/components/EnrollmentModal';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  GraduationCap,
  Award,
  Globe2,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Play,
  ShieldCheck,
  Star,
} from 'lucide-react';

export default function HomePage() {
  const { t, locale, dir } = useLanguage();
  const [courses, setCourses] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedLangFilter, setSelectedLangFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<any>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cRes, lRes, tRes] = await Promise.all([
          fetch('/api/courses?published_only=true'),
          fetch('/api/languages?published_only=true'),
          fetch('/api/teachers'),
        ]);
        const cData = await cRes.json();
        const lData = await lRes.json();
        const tData = await tRes.json();
        setCourses(cData.courses || []);
        setLanguages(lData.languages || []);
        setTeachers(tData.teachers || []);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOpenEnroll = (course?: any) => {
    setSelectedCourseForEnroll(course || null);
    setIsEnrollModalOpen(true);
  };

  const faqs = [
    {
      q: locale === 'ar'
        ? 'كيف يتم تقديم الحصص؟ هل هي مسجلة أم مباشرة؟'
        : locale === 'en'
        ? 'How are classes delivered? Are they recorded or live?'
        : 'Comment se déroulent les cours ? En direct ou enregistrés ?',
      a: locale === 'ar'
        ? 'جميع حصصنا في فصيح تفاعلية ومباشرة بنسبة 100% عبر غرف فيديو متطورة (Google Meet / Zoom)، كما يتم تسجيل كل حصة وإتاحتها للطلاب لمراجعتها في أي وقت.'
        : locale === 'en'
        ? 'All our sessions at Fassi7 are 100% interactive and live with expert trainers. Every session is also recorded and accessible so you can review anytime.'
        : 'Tous nos cours sont 100% interactifs et en direct avec nos formateurs. Chaque séance est également enregistrée pour vous permettre de réviser à tout moment.',
    },
    {
      q: locale === 'ar'
        ? 'كم عدد الطلاب في الفوج الواحد؟'
        : locale === 'en'
        ? 'How many students are in each group?'
        : 'Combien d\'étudiants par groupe ?',
      a: locale === 'ar'
        ? 'لضمان أقصى استفادة ومشاركة للجميع، نحدد عدد الطلاب بين 8 إلى 12 طالباً كحد أقصى في الأفواج الجماعية، مع توفر صيغة التدريب الفردي 1-on-1 حسب الطلب.'
        : locale === 'en'
        ? 'To guarantee optimal speaking time and interaction, groups are capped at 8-12 students. Customized 1-on-1 private coaching is also available.'
        : 'Nos groupes sont strictement limités à 8-12 apprenants afin de garantir un temps de parole optimal à chacun. Des formules individuelles 1-on-1 sont également disponibles.',
    },
    {
      q: locale === 'ar'
        ? 'ما هي طرق الدفع المتاحة في الجزائر وخارجها؟'
        : locale === 'en'
        ? 'What payment methods are accepted?'
        : 'Quels sont les modes de paiement acceptés ?',
      a: locale === 'ar'
        ? 'نوفر خيارات دفع مريحة وآمنة: تطبيق بريدي موب (BaridiMob)، الحوالات البريدية CCP، التحويلات البنكية، أو نقداً في مقر الأكاديمية بالجزائر، مع إمكانية السداد على قسطين.'
        : locale === 'en'
        ? 'We offer flexible payment methods: BaridiMob app, CCP postal transfer, bank wire, or cash at our Algiers academy, with convenient two-installment payment plans.'
        : 'Nous acceptons les paiements via BaridiMob, CCP, virement bancaire, ou en espèces au siège de l\'académie. Des facilités de paiement en deux tranches sont possibles.',
    },
    {
      q: locale === 'ar'
        ? 'هل يحصل الطالب على شهادة بعد إتمام الدورة؟'
        : locale === 'en'
        ? 'Do students receive a certificate upon completion?'
        : 'Délivrez-vous une attestation de réussite ?',
      a: locale === 'ar'
        ? 'نعم، يحصل كل طالب يجتاز متطلبات الحضور والاختبار النهائي على شهادة إتمام معتمدة وموقعة من أكاديمية فصيح توضح مستواه اللغوي بدقة وفق الإطار الأوروبي CEFR.'
        : locale === 'en'
        ? 'Yes, every student who meets attendance requirements and passes the final evaluation receives an official certified diploma from Fassi7, aligned with the CEFR framework.'
        : 'Oui, une attestation officielle de niveau conforme au cadre européen CEFR est délivrée à l\'issue de chaque formation après validation des évaluations.',
    },
    {
      q: locale === 'ar'
        ? 'ما العلاقة بين فصيح (Fassi7) وأكاديمية Multilinguo؟'
        : locale === 'en'
        ? 'What is the relationship between Fassi7 and Multilinguo Academy?'
        : 'Quel est le lien entre Fassi7 et Multilinguo ?',
      a: locale === 'ar'
        ? 'أكاديمية فصيح (Fassi7) هي الاسم والهوية الجديدة المتطورة لأكاديمية Multilinguo بعد مسيرة ناجحة امتدت لسنوات، بنفس الإدارة والأساتذة والمعايير العالية.'
        : locale === 'en'
        ? 'Fassi7 is the new evolved brand identity of Multilinguo Academy, carrying forward the same leadership, certified faculty, and commitment to excellence.'
        : 'Fassi7 est la nouvelle identité de marque moderne de Multilinguo Academy, conservant la même direction pédagogique et les mêmes formateurs d\'excellence.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '5rem 0 6rem 0',
          background: 'radial-gradient(circle at 50% 20%, #FFF3EC 0%, var(--bg-warm) 100%)',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Subtle decorative background shapes */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 173, 24, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250, 70, 29, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
            {/* Heritage Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid rgba(250, 70, 29, 0.25)',
                boxShadow: '0 4px 15px rgba(250, 70, 29, 0.08)',
                padding: '0.45rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                marginBottom: '2rem',
              }}
            >
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {locale === 'ar' ? 'جديد' : locale === 'en' ? 'NEW' : 'NOUVEAU'}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark-brown)' }}>
                {locale === 'ar'
                  ? 'من Multilinguo إلى Fassi7 • هوية جديدة ونفس الطموح'
                  : locale === 'en'
                  ? 'From Multilinguo to Fassi7 • New Identity, Same Ambition'
                  : 'De Multilinguo à Fassi7 • Nouvelle Identité'}
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.3rem, 5vw, 3.8rem)',
                fontWeight: 900,
                color: 'var(--dark-brown)',
                lineHeight: 1.2,
                marginBottom: '1.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              {t('hero_title')}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                color: 'var(--text-muted)',
                lineHeight: 1.8,
                marginBottom: '2.5rem',
                maxWidth: '740px',
                marginInline: 'auto',
              }}
            >
              {t('hero_subtitle')}
            </p>

            {/* Hero CTAs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '3.5rem',
              }}
            >
              <button
                onClick={() => handleOpenEnroll()}
                className="btn-primary"
                style={{ padding: '1rem 2.2rem', fontSize: '1.05rem' }}
              >
                <span>{t('cta_register_now')}</span>
                {dir === 'rtl' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>

              <Link
                href="/courses"
                className="btn-outline"
                style={{ padding: '1rem 2rem', fontSize: '1.02rem' }}
              >
                <span>{t('cta_explore_courses')}</span>
              </Link>

              <a
                href="https://wa.me/213550123456"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: '1rem 1.8rem', fontSize: '1.02rem', gap: '0.5rem' }}
              >
                <MessageSquare size={18} />
                <span>{t('whatsapp_chat')}</span>
              </a>
            </div>

            {/* Floating Brand Pills matching the reference announcement */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '0.85rem',
              }}
            >
              <span
                style={{
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--dark-brown)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.5rem 1.2rem',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 4px 12px rgba(255, 173, 24, 0.25)',
                }}
              >
                مرحباً 🇩🇿
              </span>
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.5rem 1.2rem',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 4px 12px rgba(250, 70, 29, 0.25)',
                }}
              >
                Welcome 🇬🇧
              </span>
              <span
                style={{
                  backgroundColor: 'var(--dark-brown)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.5rem 1.2rem',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 4px 12px rgba(61, 27, 13, 0.25)',
                }}
              >
                Bienvenida 🇪🇸
              </span>
              <span
                style={{
                  backgroundColor: '#FF9E1B',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.5rem 1.2rem',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 4px 12px rgba(255, 158, 27, 0.25)',
                }}
              >
                Willkommen 🇩🇪
              </span>
              <span
                style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  padding: '0.5rem 1.2rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--primary)',
                }}
              >
                Hoş geldiniz 🇹🇷
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border)',
          padding: '2.5rem 0',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.1 }}>
                5,400+
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('stat_students')}
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', lineHeight: 1.1 }}>
                7
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('stat_languages')}
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--dark-brown)', lineHeight: 1.1 }}>
                94%
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('stat_success_rate')}
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10B981', lineHeight: 1.1 }}>
                98.6%
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('stat_satisfaction')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND HERITAGE: DE MULTILINGUO A FASSI7 */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-warm)' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid var(--border)',
              padding: 'clamp(2rem, 4vw, 4rem)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div>
              <span className="badge badge-secondary" style={{ marginBottom: '1rem' }}>
                <Sparkles size={14} />
                {locale === 'ar' ? 'فصل جديد من التميز' : locale === 'en' ? 'A New Chapter of Excellence' : 'Un Nouveau Chapitre'}
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                  fontWeight: 900,
                  marginBottom: '1.25rem',
                  lineHeight: 1.3,
                }}
              >
                {locale === 'ar'
                  ? 'من Multilinguo إلى فصيح: نفس الطموح، وأفق أوسع'
                  : locale === 'en'
                  ? 'From Multilinguo to Fassi7: Same Ambition, Broader Horizons'
                  : 'De Multilinguo à Fassi7 : La même Ambition'}
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                {locale === 'ar'
                  ? 'انطلقت رحلتنا تحت اسم أكاديمية Multilinguo بهدف مساعدة الشباب والمهنيين الجزائريين على التحدث باللغات الأجنبية بكل ثقة. واليوم، نتجدد مع هوية "فصيح" (Fassi7) — المستوحاة من فصاحة اللسان والبيان — لنقدم لكم منصة تعليمية متكاملة تجمع أحدث تقنيات التعليم التفاعلي مع نخبة الأساتذة المعتمدين.'
                  : locale === 'en'
                  ? 'Our journey began as Multilinguo Academy with a singular mission: empowering Algerian students and professionals to master international languages with absolute confidence. Today, we evolve into Fassi7 — an identity rooted in eloquence and articulate expression — providing a next-generation interactive platform backed by certified master educators.'
                  : 'Née sous le nom de Multilinguo Academy pour accompagner les talents algériens vers la maîtrise des langues internationales, notre académie franchit une nouvelle étape en devenant Fassi7. Une identité inspirée de l\'éloquence et de la fluidité d\'expression pour vous ouvrir les portes du monde.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {locale === 'ar'
                      ? 'مناهج مطابقة للمعايير الدولية CEFR'
                      : locale === 'en'
                      ? 'Curricula fully aligned with international CEFR standards'
                      : 'Programmes alignés sur les normes européennes CEFR'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {locale === 'ar'
                      ? 'فريق أساتذة معتمدين (CELTA, Heidelberg, FLE)'
                      : locale === 'en'
                      ? 'Internationally certified teachers (CELTA, Heidelberg, FLE)'
                      : 'Formateurs diplômés et certifiés internationalement'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {locale === 'ar'
                      ? 'أفواج مصغرة تركز على التحدث والطلاقة'
                      : locale === 'en'
                      ? 'Small cohorts focused on spontaneous conversational fluency'
                      : 'Groupes réduits axés sur la pratique orale immédiate'}
                  </span>
                </div>
              </div>

              <Link href="/about" className="btn-outline">
                <span>{t('nav_about')}</span>
                {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
            </div>

            {/* Poster announcement visual */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  boxShadow: '0 20px 45px rgba(250, 73, 31, 0.18)',
                  border: '4px solid #FFFFFF',
                  maxWidth: '420px',
                  margin: '0 auto',
                  backgroundColor: '#FFFFFF',
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
        </div>
      </section>

      {/* CHOOSE WHAT SUITS YOU - OFFICIAL FASSI7 LEARNING MODES */}
      <section style={{ padding: '5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.85rem' }}>
              <Sparkles size={14} />
              {locale === 'ar' ? 'خيارات تعلم مرنة تتكيف معك' : locale === 'en' ? 'Flexible Learning Modes' : 'Modes d\'Apprentissage'}
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--dark-brown)' }}>
              {locale === 'ar' ? 'اختر النمط الذي يناسب حياتك (Choose What Suits You)' : locale === 'en' ? 'Choose What Suits You' : 'Choisissez Votre Rythme'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.8 }}>
              {locale === 'ar'
                ? '«لأن كل متعلم فريد من نوعه، نوفر مسارات تعليمية متعددة مصممة خصيصاً لتناسب نمط حياتك. اختر طريقتك المفضلة اليوم، ودع فصيح يرشدك في كل خطوة نحو الطلاقة.»'
                : locale === 'en'
                ? '"Because every learner is unique, we offer multiple learning paths tailored to fit your lifestyle. Select your preferred method today, and let Fassi7 guide you every step of the way toward fluency."'
                : '"Parce que chaque apprenant est unique, nous proposons plusieurs parcours adaptés à votre mode de vie. Laissez Fassi7 vous guider vers la fluidité."'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {/* 1. Recorded lessons */}
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '2.25rem 1.75rem',
                border: '1.5px solid var(--border)',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#FFF8E7',
                  color: '#FFAD17',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                }}
              >
                <Play size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? 'دروس مسجلة (Recorded)' : 'Recorded Lessons'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                {locale === 'ar'
                  ? 'محتوى مرئي عالي الجودة يمكنك مراجعته بالوتيرة التي تناسبك وفي أي وقت ومن أي جهاز.'
                  : 'High-quality on-demand modules you can study and replay anytime, anywhere at your own pace.'}
              </p>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFAD17', backgroundColor: '#FFF8E7', padding: '4px 12px', borderRadius: '999px' }}>
                {locale === 'ar' ? 'حرية مطلقة في الوقت' : 'Self-Paced Flexibility'}
              </span>
            </div>

            {/* 2. One-on-one learning */}
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '2.25rem 1.75rem',
                border: '1.5px solid var(--border)',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#FFF0EB',
                  color: '#FA491F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                }}
              >
                <Users size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? 'تعليم فردي (One-on-One)' : 'One-on-One Learning'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                {locale === 'ar'
                  ? 'جلسات خاصة مكرسة لك بالكامل مع أستاذ خبير يركز على احتياجاتك ونقاط قوتك الفردية.'
                  : 'Private coaching tailored 100% to your personal career needs, target certification, or schedule.'}
              </p>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FA491F', backgroundColor: '#FFF0EB', padding: '4px 12px', borderRadius: '999px' }}>
                {locale === 'ar' ? 'تركيز وتخصيص كامل' : '100% Personalized'}
              </span>
            </div>

            {/* 3. Online lessons */}
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '2.25rem 1.75rem',
                border: '1.5px solid var(--border)',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(61, 27, 13, 0.08)',
                  color: 'var(--dark-brown)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                }}
              >
                <GraduationCap size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--dark-brown)' }}>
                {locale === 'ar' ? 'دروس جماعية (Online Lessons)' : 'Interactive Online Classes'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                {locale === 'ar'
                  ? 'فصول افتراضية تفاعلية مصغرة مع زملاء يشاركونك نفس المستوى لممارسة التحدث الحي والمناقشة.'
                  : 'Dynamic small-group virtual cohorts fostering lively group discussions and peer learning.'}
              </p>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-brown)', backgroundColor: '#F6F3EE', padding: '4px 12px', borderRadius: '999px' }}>
                {locale === 'ar' ? 'تفاعل حي ومحادثة' : 'Live Group Interaction'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CEFR PROGRESSION PATHWAY SECTION WITH 3D PODIUM MASCOT */}
      <section style={{ padding: '5rem 0', backgroundColor: '#F6F3EE', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid var(--border)',
              padding: 'clamp(2rem, 4vw, 4rem)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3.5rem',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* 3D Mascot on Podium Visual (Position 05) */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  maxWidth: '430px',
                  margin: '0 auto',
                  border: '4px solid #FFFFFF',
                  boxShadow: '0 20px 45px rgba(250, 73, 31, 0.16)',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <img
                  src="/images/Position 05.jpg.jpeg"
                  alt="Fassi7 3D Progression from A1 to C1 Achievement"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>

            {/* Stepped Pathway Explanation */}
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
                <Award size={15} />
                {locale === 'ar' ? 'سلم التقدم اللغوي الأوروبي CEFR' : locale === 'en' ? 'CEFR Milestones' : 'Niveaux CEFR'}
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--dark-brown)', lineHeight: 1.3 }}>
                {locale === 'ar'
                  ? 'من البداية حتى الطلاقة التامة: رحلتك مع فصيح خطوة بخطوة'
                  : locale === 'en'
                  ? 'From Day 1 to Native-Level Confidence: Your Step-by-Step Journey'
                  : 'De l\'Initiation à la Fluidité : Votre Parcours Étape par Étape'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.8, marginBottom: '2rem' }}>
                {locale === 'ar'
                  ? 'صممنا مناهجنا لتقودك بسلاسة وبشكل تفاعلي ومقاس، مع اختبارات تحديد مستوى وتدريب عملي يقيس نطقك وتعبيرك في كل مرحلة.'
                  : locale === 'en'
                  ? 'Our structured curriculum takes you through each level with measurable milestones, real-time teacher feedback, and clear achievement markers.'
                  : 'Des paliers clairs et certifiés pour mesurer votre progression de façon concrète et stimulante.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {/* Step 1: A1 Beginner */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFF8E7',
                      color: '#FFAD17',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    A1
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--dark-brown)' }}>
                      {locale === 'ar' ? 'المستوى المبتدئ (Beginner)' : 'Beginner Level'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {locale === 'ar'
                        ? 'كسر حاجز الخوف، النطق السليم للحروف والكلمات، وإجراء المحادثات اليومية الأساسية.'
                        : 'Overcoming hesitation, mastering accurate phonetics, and handling everyday basic interactions.'}
                    </p>
                  </div>
                </div>

                {/* Step 2: B1 Intermediate */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFF0EB',
                      color: '#FA491F',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    B1
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--dark-brown)' }}>
                      {locale === 'ar' ? 'المستوى المتوسط (Intermediate)' : 'Intermediate Level'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {locale === 'ar'
                        ? 'التعبير عن الآراء بطلاقة، فهم المحادثات المعقدة، والقدرة على التعامل في العمل والسفر.'
                        : 'Expressing nuanced viewpoints, understanding native audio, and conversing smoothly at work or travel.'}
                    </p>
                  </div>
                </div>

                {/* Step 3: C1 Advanced Achievement */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FA491F',
                      color: '#FFFFFF',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(250, 73, 31, 0.3)',
                    }}
                  >
                    C1
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--dark-brown)' }}>
                      {locale === 'ar' ? 'الإتقان والشهادات الدولية (Advanced Language Achievement)' : 'Advanced Language Achievement'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {locale === 'ar'
                        ? 'الطلاقة المهنية التامة والجاهزية لاجتياز اختبارات IELTS و TCF و Goethe بأعلى الدرجات المطلوبة للمنح والهجرة.'
                        : 'Full professional bilingual fluency and readiness to ace official exams (IELTS, TCF, Goethe) with flying colors.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenEnroll()}
                className="btn-primary"
                style={{ padding: '0.9rem 2rem' }}
              >
                <span>{locale === 'ar' ? 'ابدأ رحلتك نحو المستوى C1' : 'Start Your Journey to C1'}</span>
                {dir === 'rtl' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED LANGUAGES HUB */}
      <section style={{ padding: '5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.85rem' }}>
              <Globe2 size={15} />
              {t('nav_languages')}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem' }}>
              {locale === 'ar'
                ? 'اختر لغتك المفضلة وانطلق نحو آفاق جديدة'
                : locale === 'en'
                ? 'Choose Your Language & Expand Your Horizons'
                : 'Découvrez Nos Langues Enseignées'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7 }}>
              {locale === 'ar'
                ? 'نقدم دورات تخصصية في 7 لغات عالمية لمختلف المستويات، من المبتدئ تماماً حتى الطلاقة المهنية والأكاديمية.'
                : locale === 'en'
                ? 'We offer specialized courses in 7 world languages for all levels, from total beginner to academic and professional fluency.'
                : 'Des formations vivantes adaptées à votre niveau pour le travail, les études ou le plaisir de voyager.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {languages.map((lang) => (
              <Link
                key={lang.id}
                href={`/courses?language_id=${lang.id}`}
                className="card card-interactive"
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2.4rem' }}>{lang.flag_emoji || '🌐'}</span>
                    <span className="badge badge-secondary">
                      {lang.course_count} {locale === 'ar' ? 'دورات' : locale === 'en' ? 'courses' : 'cours'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.6rem', color: 'var(--dark-brown)' }}>
                    {locale === 'ar' ? lang.name_ar : locale === 'en' ? (lang.name_en || lang.name_fr) : lang.name_fr}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                    {locale === 'ar' ? lang.description_ar : locale === 'en' ? (lang.description_en || lang.description_fr) : lang.description_fr}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                  }}
                >
                  <span>{locale === 'ar' ? 'تصفح برامج اللغة' : locale === 'en' ? 'View programs' : 'Voir les programmes'}</span>
                  {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED COURSES SECTION */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-warm)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '3rem',
            }}
          >
            <div>
              <span className="badge badge-secondary" style={{ marginBottom: '0.85rem' }}>
                <Award size={15} />
                {locale === 'ar' ? 'أفواج جديدة تنطلق قريباً' : locale === 'en' ? 'New Cohorts Enrolling' : 'Inscriptions Ouvertes'}
              </span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900 }}>
                {locale === 'ar' ? 'الدورات والبرامج المتاحة حالياً' : locale === 'en' ? 'Featured Courses & Programs' : 'Nos Formations en Vedette'}
              </h2>
            </div>
            <Link href="/courses" className="btn-outline">
              <span>{t('cta_explore_courses')}</span>
              {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
          </div>

          {/* Quick Language Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => setSelectedLangFilter('all')}
              className={selectedLangFilter === 'all' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
              style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 0.9rem', fontSize: '0.84rem' }}
            >
              <span>{locale === 'ar' ? 'جميع اللغات' : locale === 'en' ? 'All Languages' : 'Toutes les langues'}</span>
              <span style={{ opacity: 0.8, fontSize: '0.78rem' }}>({courses.length})</span>
            </button>
            {languages.map((lang) => {
              const count = courses.filter((c) => c.language_id === lang.id).length;
              if (count === 0) return null;
              const isSelected = selectedLangFilter === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLangFilter(lang.id)}
                  className={isSelected ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                  style={{ borderRadius: 'var(--radius-full)', padding: '0.4rem 0.9rem', fontSize: '0.84rem', gap: '0.35rem' }}
                >
                  <span>{lang.flag_emoji}</span>
                  <span>{locale === 'ar' ? lang.name_ar : locale === 'en' ? (lang.name_en || lang.name_fr) : lang.name_fr}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Courses Grid - Shows all matching published courses */}
          {(() => {
            const displayedCourses = selectedLangFilter === 'all'
              ? courses
              : courses.filter((c) => c.language_id === selectedLangFilter);

            if (displayedCourses.length === 0) {
              return (
                <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                    {locale === 'ar' ? 'لا توجد دورات مسجلة لهذه الفئة حالياً.' : 'Aucune formation pour cette sélection.'}
                  </p>
                </div>
              );
            }

            return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
                  gap: '2rem',
                }}
              >
                {displayedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} onEnroll={handleOpenEnroll} />
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* MEET OUR EXPERT FACULTY & INSTRUCTORS */}
      <section style={{ padding: '5.5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.85rem' }}>
              <GraduationCap size={15} />
              {locale === 'ar' ? 'هيئة التدريس المعتمدة' : locale === 'en' ? 'Certified Faculty' : 'Nos Formateurs'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem', color: 'var(--dark-brown)' }}>
              {locale === 'ar' ? 'نخبة من الأساتذة والمدربين المعتمدين' : locale === 'en' ? 'Learn from Elite Certified Educators' : 'Apprenez avec Nos Meilleurs Formateurs'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7 }}>
              {locale === 'ar'
                ? 'فريق من الأساتذة المتخصصين ذوي الخبرة العالية في تدريس اللغات والتحضير للامتحانات الدولية الرسمية (IELTS, TCF, Goethe).'
                : locale === 'en'
                ? 'Qualified language mentors dedicated to conversational mastery, business communication, and top exam percentiles.'
                : 'Des enseignants diplômés et passionnés qui vous accompagnent vers la réussite de vos examens et votre fluidité orale.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {teachers.map((tch) => (
              <div
                key={tch.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px solid var(--border)',
                  padding: '1.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(250, 70, 29, 0.25)',
                      }}
                    >
                      {tch.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.18rem', margin: 0, color: 'var(--dark-brown)', fontWeight: 800 }}>
                        {tch.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          display: 'block',
                          marginTop: '0.15rem',
                        }}
                      >
                        {tch.qualifications_fr || tch.specialties_fr}
                      </span>
                    </div>
                  </div>

                  {tch.bio_fr && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {tch.bio_fr}
                    </p>
                  )}

                  {/* Courses taught by this teacher */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--dark-brown)', display: 'block', marginBottom: '0.45rem' }}>
                      {locale === 'ar' ? 'الدورات التي يُدرّسها:' : 'Formations enseignées :'}
                    </span>
                    {tch.courses && tch.courses.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {tch.courses.map((c: any) => (
                          <div
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--bg-warm)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: 'var(--dark-brown)',
                            }}
                          >
                            <span>{locale === 'ar' ? c.title_ar : c.title_fr}</span>
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                              {c.lang_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {locale === 'ar' ? 'دورات قادمة قيد البرمجة' : 'Sessions en cours de programmation'}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {tch.courses?.length || 0} {locale === 'ar' ? 'دورات نشطة' : 'cours actifs'}
                  </span>
                  <button
                    onClick={() => handleOpenEnroll(tch.courses?.[0])}
                    className="btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    <span>{t('cta_enroll_now')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEACHING METHODOLOGY: 4 PILLARS */}
      <section style={{ padding: '5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 4rem auto' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.85rem' }}>
              <GraduationCap size={15} />
              {locale === 'ar' ? 'المنهجية التعليمية' : locale === 'en' ? 'Fassi7 Methodology' : 'Méthode Fassi7'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem' }}>
              {t('methodology_title')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7 }}>
              {locale === 'ar'
                ? 'لا نعتمد على الحفظ التلقيني أو القواعد الجافة، بل نبني ثقتك من الحصة الأولى عبر أربعة ركائز متكاملة.'
                : locale === 'en'
                ? 'We move beyond passive rote memorization into real-world fluency, backed by four proven instructional pillars.'
                : 'Une approche communicative moderne axée sur le résultat concret et l\'aisance naturelle.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '2rem',
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
                <Users size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{t('pillar1_title')}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                {t('pillar1_desc')}
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
                <Award size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{t('pillar2_title')}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                {t('pillar2_desc')}
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
                <Play size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{t('pillar3_title')}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                {t('pillar3_desc')}
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{t('pillar4_title')}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                {t('pillar4_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED STUDENT REVIEWS */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-warm)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
            <span className="badge badge-secondary" style={{ marginBottom: '0.85rem' }}>
              <Star size={14} fill="currentColor" />
              {locale === 'ar' ? 'آراء طلابنا المعتمدة' : locale === 'en' ? 'Verified Student Stories' : 'Témoignages Réels'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem' }}>
              {locale === 'ar' ? 'قصص نجاح من واقع تجربة الطلاب' : locale === 'en' ? 'Real Success Stories with Fassi7' : 'Ils Ont Réussi avec Fassi7'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              {locale === 'ar' ? 'نماذج حقيقية لطلاب حققوا أهدافهم في السفر والدراسة والعمل.' : locale === 'en' ? 'Discover how our learners achieved their academic and global career goals.' : 'Découvrez comment nos apprenants ont atteint leurs objectifs.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
            }}
          >
            <div className="card">
              <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {locale === 'ar'
                  ? '«حصلت على سكور 7.5 في امتحان IELTS بعد دورتين مكثفتين مع الدكتور يوسف. التدريب على المقال الأكاديمي كان حاسماً في قبولي بمنحة Chevening في بريطانيا!»'
                  : locale === 'en'
                  ? '“Thanks to the intensive IELTS prep with Dr. Youcef, I scored 7.5 and won my Chevening scholarship in the UK. Truly unmatched teaching methodology!”'
                  : '« Grâce à la préparation intensive IELTS avec Dr. Youcef, j\'ai obtenu un score de 7.5 et décroché ma bourse au Royaume-Uni. Pédagogie remarquable ! »'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  KM
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Karim Meziane</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'طالب ماستر • منحة بريطانية' : locale === 'en' ? 'Master Student • Chevening Scholar' : 'Étudiant Master • Alger'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {locale === 'ar'
                  ? '«دورة TCF Canada مع الأستاذة سارة ساعدتني على تجاوز رهبة المحادثة وتحقيق مستوى C1 في التعبير الشفهي. الملف اكتمل وملف الهجرة تم قبوله!»'
                  : locale === 'en'
                  ? '“The TCF Canada training with Sarah exceeded all my expectations. Achieved C1 in oral expression and got my Canadian immigration file approved!”'
                  : '« La formation TCF Canada avec Sarah était au-delà de mes attentes. Niveau C1 atteint en expression orale et dossier d\'immigration validé ! »'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--secondary-light)', color: '#9E6500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  LC
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Lina Chaoui</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'مهندسة برمجيات • وهران' : locale === 'en' ? 'Software Engineer • Oran' : 'Ingénieure Logiciel • Oran'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {locale === 'ar'
                  ? '«بدأت الألمانية من الصفر تماماً A1 والآن أنهيت B1 مع الأستاذ مارك. أسلوب شرح القواعد منظم جداً وتطبيقات المحادثة ممتازة للعمل الطبي في ألمانيا.»'
                  : locale === 'en'
                  ? '“Starting German completely from scratch at A1, I just passed Goethe B1 with Marc. Highly structured grammar and spoken immersion vital for my medical career in Germany.”'
                  : '« Parti de zéro en allemand A1, je viens de valider le B1 Goethe avec Marc. Méthode structurée, essentielle pour mon projet médical en Allemagne. »'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(61, 27, 13, 0.08)', color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  WB
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Dr. Walid Berrada</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {locale === 'ar' ? 'طبيب مقيم • قسنطينة' : locale === 'en' ? 'Resident Physician • Constantine' : 'Médecin Résident • Constantine'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS ACCORDION */}
      <section style={{ padding: '5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.85rem' }}>
              <HelpCircle size={15} />
              {locale === 'ar' ? 'الأسئلة الشائعة' : locale === 'en' ? 'Frequently Asked Questions' : 'Questions Fréquentes'}
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900 }}>
              {locale === 'ar' ? 'كل ما تحتاج معرفته عن الدراسة معنا' : locale === 'en' ? 'Everything You Need to Know' : 'Tout Ce Que Vous Devez Savoir'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: isOpen ? 'var(--bg-warm)' : '#FFFFFF',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: dir === 'rtl' ? 'right' : 'left',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: 'var(--dark-brown)',
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={20}
                      color="var(--primary)"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: '1.8' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section
        style={{
          padding: '5rem 0',
          background: 'linear-gradient(135deg, var(--dark-brown) 0%, #1F0D06 100%)',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: '780px' }}>
          <h2 style={{ color: '#FFFFFF', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: '1.25rem' }}>
            {locale === 'ar'
              ? 'جاهز للانطلاق في رحلتك اللغوية؟'
              : locale === 'en'
              ? 'Ready to Embark on Your Language Journey?'
              : 'Prêt à Débuter Votre Parcours ?'}
          </h2>
          <p style={{ color: '#E5D6CC', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
            {locale === 'ar'
              ? 'انضم إلى أكثر من 5,000 طالب وطالبة استطاعوا تغيير مسارهم المهني والأكاديمي مع أكاديمية فصيح. المقاعد محدودة في كل فوج.'
              : locale === 'en'
              ? 'Join over 5,000 students and professionals who advanced their careers and global mobility with Fassi7 Academy. Limited cohort seats available.'
              : 'Rejoignez plus de 5.000 apprenants qui ont transformé leur avenir professionnel avec Fassi7. Les places sont limitées.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            <button
              onClick={() => handleOpenEnroll()}
              className="btn-primary"
              style={{ padding: '1rem 2.4rem', fontSize: '1.08rem' }}
            >
              <span>{t('cta_register_now')}</span>
              {dir === 'rtl' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </button>

            <a
              href="https://wa.me/213550123456"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ padding: '1rem 2rem', fontSize: '1.08rem' }}
            >
              <MessageSquare size={18} />
              <span>{t('whatsapp_chat')}</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Direct Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        course={selectedCourseForEnroll}
        coursesList={courses}
      />
    </div>
  );
}
