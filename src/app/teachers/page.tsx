'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { GraduationCap, Award, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { getLocalizedTeacherBio, getLocalizedTeacherQuals, getLocalizedTeacherSpecialties } from '@/lib/courseHelpers';

export default function TeachersPage() {
  const { t, locale } = useLanguage();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await fetch('/api/teachers');
        const data = await res.json();
        setTeachers(data.teachers || []);
      } catch (err) {
        console.error('Error loading teachers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeachers();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
            <GraduationCap size={15} />
            {t('nav_teachers')}
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            {locale === 'ar' ? 'نخبة من الأساتذة والمدربين المعتمدين' : locale === 'en' ? 'Our Elite Certified Faculty' : 'Notre Équipe Pédagogique'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {locale === 'ar'
              ? 'أساتذة متمرسون يمتلكون خبرة واسعة في التدريس التفاعلي والتحضير للامتحانات الدولية المعتمدة.'
              : locale === 'en'
              ? 'Passionate educators with international accreditations dedicated to your conversational fluency and exam success.'
              : 'Des enseignants passionnés, certifiés internationalement et dédiés à votre progression.'}
          </p>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-warm)', padding: '4rem 0', flex: 1 }}>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'جاري التحميل...' : locale === 'en' ? 'Loading teachers...' : 'Chargement...'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '2.5rem',
              }}
            >
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
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
                    {/* Header: Avatar & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: 'var(--radius-full)',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.3rem',
                          flexShrink: 0,
                          boxShadow: '0 4px 15px rgba(250, 70, 29, 0.25)',
                        }}
                      >
                        {teacher.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--dark-brown)' }}>
                          {teacher.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            display: 'block',
                            marginTop: '0.2rem',
                          }}
                        >
                          {getLocalizedTeacherQuals(teacher, locale)}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                      {getLocalizedTeacherBio(teacher, locale)}
                    </p>

                    {/* Specialties box */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-warm)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--dark-brown)', marginBottom: '0.4rem' }}>
                        {locale === 'ar' ? 'التخصصات الأساسية:' : locale === 'en' ? 'Core Specialties:' : 'Spécialités :'}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {getLocalizedTeacherSpecialties(teacher, locale)}
                      </p>
                    </div>

                    {/* Languages Spoken */}
                    {teacher.languages_spoken && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                          {locale === 'ar' ? 'اللغات المتقنة:' : locale === 'en' ? 'Languages spoken:' : 'Langues maîtrisées :'}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {teacher.languages_spoken.split(',').map((l: string, idx: number) => (
                            <span key={idx} className="badge badge-dark" style={{ fontSize: '0.78rem' }}>
                              {l.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assigned Courses */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {teacher.courses?.length || 0} {locale === 'ar' ? 'دورات نشطة' : locale === 'en' ? 'active courses' : 'cours actifs'}
                      </span>
                      <Link href="/courses" className="btn-outline btn-sm">
                        {locale === 'ar' ? 'عرض الدورات' : locale === 'en' ? 'View Courses' : 'Voir les cours'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
