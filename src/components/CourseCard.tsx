'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Clock, Users, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import {
  getLocalizedCourseTitle,
  getLocalizedCourseDesc,
  getLocalizedCourseLevel,
} from '@/lib/courseHelpers';

interface CourseCardProps {
  course: any;
  onEnroll: (course: any) => void;
}

export function CourseCard({ course, onEnroll }: CourseCardProps) {
  const { t, locale, dir } = useLanguage();

  const title = getLocalizedCourseTitle(course, locale);
  const langName =
    locale === 'ar'
      ? course.language_name_ar
      : locale === 'en'
      ? course.language_name_en || course.language_name_fr
      : course.language_name_fr;
  const description = getLocalizedCourseDesc(course, locale);
  const localizedLevel = getLocalizedCourseLevel(course.level, locale);

  const spotsLeft = Math.max(0, (course.max_capacity || 12) - (course.enrolled_count || 0));

  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Featured badge if any */}
      {course.featured ? (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: dir === 'rtl' ? 'auto' : '1rem',
            right: dir === 'rtl' ? '1rem' : 'auto',
            background: 'linear-gradient(135deg, var(--secondary) 0%, #FF8F00 100%)',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '0.3rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            boxShadow: '0 2px 8px rgba(255, 173, 24, 0.4)',
          }}
        >
          <Sparkles size={13} />
          <span>{locale === 'ar' ? 'الأكثر طلباً' : locale === 'en' ? 'Most Popular' : 'Très Demandé'}</span>
        </div>
      ) : null}

      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', marginTop: course.featured ? '1.5rem' : '0' }}>
          <span
            style={{
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            {course.flag_emoji || '🌐'}
          </span>
          <span className="badge badge-primary">{langName}</span>
          <span className="badge badge-secondary">{localizedLevel}</span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.22rem',
            fontWeight: 800,
            lineHeight: 1.4,
            marginBottom: '0.85rem',
            color: 'var(--dark-brown)',
          }}
        >
          {title}
        </h3>

        {/* Description snippet */}
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>

        {/* Highlights: Duration, Hours, Format */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            padding: '0.85rem',
            backgroundColor: 'var(--bg-warm)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-main)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Clock size={15} color="var(--primary)" />
            <span>
              {course.duration_weeks} {t('weeks')} ({course.hours_total}h)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Users size={15} color="var(--secondary)" />
            <span>
              {spotsLeft > 0
                ? `${spotsLeft} ${t('places_left')}`
                : locale === 'ar'
                ? 'فوج مكتمل'
                : locale === 'en'
                ? 'Fully Booked'
                : 'Complet'}
            </span>
          </div>
        </div>

        {/* Assigned Teacher if available */}
        {course.teachers && course.teachers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {course.teachers[0].name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {locale === 'ar' ? 'المدرب المشرف:' : locale === 'en' ? 'Instructor:' : 'Formateur assigné:'}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-brown)' }}>
                {course.teachers[0].name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Price & Enroll CTA */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
            {locale === 'ar' ? 'سعر الدورة' : locale === 'en' ? 'Full tuition' : 'Tarif complet'}
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)' }}>
            {course.price?.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>{t('price_dzd')}</span>
          </span>
        </div>

        <button
          onClick={() => onEnroll(course)}
          className="btn-primary btn-sm"
          style={{ gap: '0.4rem' }}
        >
          <span>{t('enroll_btn')}</span>
          {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
