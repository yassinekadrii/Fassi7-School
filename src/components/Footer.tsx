'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Fassi7Logo } from './Fassi7Logo';
import { Phone, Mail, MapPin, MessageSquare, ShieldCheck, Heart, Code2 } from 'lucide-react';

export function Footer() {
  const { t, locale } = useLanguage();

  return (
    <footer
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
        paddingTop: '4rem',
        paddingBottom: '2.5rem',
      }}
    >
      <div className="container">
        {/* Brand evolution alert bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bg-warm) 0%, #FFF2E8 100%)',
            border: '1.5px dashed var(--secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem 2rem',
            marginBottom: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--dark-brown)',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <ShieldCheck size={16} />
              {t('heritage_badge')}
            </span>
            <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--text-main)', maxWidth: '750px', fontWeight: 600 }}>
              {t('heritage_text')}
            </p>
          </div>
          <Link
            href="/about"
            className="btn-outline btn-sm"
            style={{ backgroundColor: '#FFFFFF', whiteSpace: 'nowrap' }}
          >
            {locale === 'ar' ? 'تعرف على قصة فصيح' : locale === 'en' ? 'Discover Our Story' : 'Découvrir notre histoire'}
          </Link>
        </div>

        {/* 4-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Col 1: About & Logo */}
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <Fassi7Logo size="md" showSubtitle={true} />
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              {t('footer_about')}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a
                href="https://wa.me/213550123456"
                target="_blank"
                rel="noreferrer"
                className="btn-primary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', gap: '0.4rem' }}
              >
                <MessageSquare size={16} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>{t('footer_quick_links')}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link href="/courses" style={{ color: 'var(--text-main)', fontSize: '0.93rem', transition: 'color var(--transition-fast)' }}>
                  {t('nav_courses')}
                </Link>
              </li>
              <li>
                <Link href="/languages" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  {t('nav_languages')}
                </Link>
              </li>
              <li>
                <Link href="/teachers" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  {t('nav_teachers')}
                </Link>
              </li>
              <li>
                <Link href="/about" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  {t('nav_about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  {t('nav_contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Languages */}
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>
              {locale === 'ar' ? 'أشهر برامج اللغات' : locale === 'en' ? 'Flagship Programs' : 'Programmes Phares'}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <Link href="/courses?level=IELTS" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  🇬🇧 IELTS Academic Band 7+
                </Link>
              </li>
              <li>
                <Link href="/courses?level=TCF" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  🇫🇷 TCF Canada & Québec
                </Link>
              </li>
              <li>
                <Link href="/courses?level=Goethe" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  🇩🇪 German Goethe A1 - B2
                </Link>
              </li>
              <li>
                <Link href="/courses?language_id=4" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  🇪🇸 Spanish Conversation A1-A2
                </Link>
              </li>
              <li>
                <Link href="/courses?language_id=5" style={{ color: 'var(--text-main)', fontSize: '0.93rem' }}>
                  🇹🇷 Business & Academic Turkish
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Office */}
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>{t('footer_contact_info')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.92rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <MapPin size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{t('footer_address')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span dir="ltr">+213 550 12 34 56 / +213 661 11 22 33</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>contact@fassi7.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ margin: 0 }}>{t('footer_rights')}</p>

          {/* Developer & Agency Credit Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--bg-warm)',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              fontSize: '0.84rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            <Code2 size={15} color="var(--primary)" />
            <span style={{ color: 'var(--text-muted)' }}>
              {locale === 'ar'
                ? 'تصميم وتطوير:'
                : locale === 'en'
                ? 'Designed & Developed by'
                : 'Conçu & Développé par'}
            </span>
            <span style={{ fontWeight: 800, color: 'var(--dark-brown)' }}>
              Kadri Yassine
            </span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
              Protium Agency
            </span>
          </div>

          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            <span>
              {locale === 'ar'
                ? 'الريادة في تعليم اللغات الحية في الجزائر'
                : locale === 'en'
                ? 'Empowering Algerian voices worldwide'
                : 'L\'excellence linguistique ouverte sur le monde'}
            </span>
            <Heart size={14} color="var(--primary)" fill="var(--primary)" />
          </p>
        </div>
      </div>
    </footer>
  );
}
