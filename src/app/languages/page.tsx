'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { Globe2, ArrowRight, ArrowLeft, BookOpen, Users, CheckCircle } from 'lucide-react';

export default function LanguagesPage() {
  const { t, locale, dir } = useLanguage();
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLangs() {
      try {
        const res = await fetch('/api/languages?published_only=true');
        const data = await res.json();
        setLanguages(data.languages || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLangs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
            <Globe2 size={15} />
            {t('nav_languages')}
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            {locale === 'ar' ? 'اللغات المعتمدة في أكاديمية فصيح' : locale === 'en' ? 'Accredited Languages at Fassi7' : 'Nos Langues Enseignées'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {locale === 'ar'
              ? 'برامج مصممة وفق أحدث المناهج التفاعلية الدولية لمساعدتك في العمل، الدراسة، أو التحضير لاختبارات الهجرة.'
              : locale === 'en'
              ? 'International standard curricula tailored for professional advancement, academic excellence, and global migration tests.'
              : 'Des programmes structurés selon les normes internationales pour vos projets académiques et professionnels.'}
          </p>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-warm)', padding: '4rem 0', flex: 1 }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2rem',
            }}
          >
            {languages.map((lang) => (
              <div
                key={lang.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '3rem' }}>{lang.flag_emoji || '🌐'}</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.85rem' }}>
                      {lang.course_count} {locale === 'ar' ? 'دورات متوفرة' : locale === 'en' ? 'courses available' : 'formations'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', color: 'var(--dark-brown)', marginBottom: '0.75rem' }}>
                    {locale === 'ar' ? lang.name_ar : locale === 'en' ? (lang.name_en || lang.name_fr) : lang.name_fr}
                  </h3>

                  <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                    {locale === 'ar' ? lang.description_ar : locale === 'en' ? (lang.description_en || lang.description_fr) : lang.description_fr}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-warm)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.5rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={15} color="var(--primary)" />
                      <span>{locale === 'ar' ? 'المستويات: من المبتدئ إلى المتقدم' : locale === 'en' ? 'Levels: A1 beginner to C2 mastery (CEFR)' : 'Niveaux : A1 à C2 selon le cadre CEFR'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={15} color="var(--secondary)" />
                      <span>{locale === 'ar' ? 'شهادة إتمام معتمدة بعد كل مستوى' : locale === 'en' ? 'Official certified diploma awarded upon completion' : 'Attestation officielle remise en fin de niveau'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <Link
                    href={`/courses?language_id=${lang.id}`}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'space-between', padding: '0.85rem 1.4rem' }}
                  >
                    <span>
                      {locale === 'ar'
                        ? `استكشف دورات ${lang.name_ar}`
                        : locale === 'en'
                        ? `Explore ${(lang.name_en || lang.name_fr)} Courses`
                        : `Voir les cours en ${lang.name_fr}`}
                    </span>
                    {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
