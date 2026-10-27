'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Fassi7Logo } from './Fassi7Logo';
import { EnrollmentModal } from './EnrollmentModal';
import { Locale } from '@/lib/translations';
import {
  Globe,
  User,
  LogIn,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  BookOpen,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Shield,
  Check,
  Calendar,
  Receipt,
  GraduationCap,
  Home,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale, t, dir } = useLanguage();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection for navbar elevation and compact styling
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languagesList: { code: Locale; label: string; flag: string; native: string; subtitle: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧', native: 'English', subtitle: 'Global (LTR)' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', native: 'Français', subtitle: 'International (LTR)' },
    { code: 'ar', label: 'العربية', flag: '🇩🇿', native: 'العربية', subtitle: 'الجزائر (RTL)' },
  ];

  const currentLang = languagesList.find((l) => l.code === locale) || languagesList[0];

  const navLinks = [
    { href: '/', label: t('nav_home'), icon: Home },
    {
      href: '/courses',
      label: locale === 'ar' ? 'الدورات' : locale === 'en' ? 'Courses' : 'Formations',
      badge: locale === 'ar' ? 'مميّز' : locale === 'en' ? 'Flagship' : 'Phares',
      icon: BookOpen,
    },
    {
      href: '/languages',
      label: locale === 'ar' ? 'اللغات' : locale === 'en' ? 'Languages' : 'Langues',
      icon: Globe,
    },
    {
      href: '/teachers',
      label: locale === 'ar' ? 'الأساتذة' : locale === 'en' ? 'Teachers' : 'Enseignants',
      icon: GraduationCap,
    },
    {
      href: '/about',
      label: locale === 'ar' ? 'عن فصيح' : locale === 'en' ? 'About' : 'À Propos',
      icon: Sparkles,
    },
    {
      href: '/contact',
      label: locale === 'ar' ? 'اتصل بنا' : 'Contact',
      icon: Mail,
    },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          label: locale === 'ar' ? 'المالك (Super Admin)' : locale === 'en' ? 'Owner (Super Admin)' : 'Propriétaire (Super Admin)',
          color: 'var(--primary)',
          bg: 'var(--primary-light)',
        };
      case 'academy_admin':
        return {
          label: locale === 'ar' ? 'السكرتارية (Admin)' : locale === 'en' ? 'Secretary (Admin)' : 'Secrétaire (Admin)',
          color: 'var(--secondary)',
          bg: 'var(--secondary-light)',
        };
      default:
        return { label: role, color: 'var(--text-muted)', bg: 'var(--bg-warm)' };
    }
  };

  return (
    <>
      {/* MAIN NAVIGATION HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: isScrolled ? '0 10px 30px rgba(61, 27, 13, 0.08)' : '0 4px 20px rgba(61, 27, 13, 0.03)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: isScrolled ? '68px' : '78px',
            transition: 'height 0.25s ease',
            gap: '0.75rem',
          }}
        >
          {/* Logo with smooth hover feedback */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.2s ease',
              flexShrink: 0,
            }}
          >
            <Fassi7Logo size="md" showSubtitle={true} />
          </div>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.25rem',
            }}
            className="desktop-nav"
          >
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    color: active ? 'var(--primary)' : 'var(--dark-brown)',
                    backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                    flexShrink: 0,
                  }}
                  className="nav-link-item"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span
                      style={{
                        backgroundColor: active ? 'var(--primary)' : 'var(--secondary)',
                        color: active ? '#FFFFFF' : 'var(--dark-brown)',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-full)',
                        lineHeight: 1.4,
                      }}
                    >
                      {link.badge}
                    </span>
                  )}
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            {/* Trilingual Language Selector */}
            <div style={{ position: 'relative' }} ref={langDropdownRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.8rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--dark-brown)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                aria-label="Select Language"
              >
                <Globe size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{currentLang.flag}</span>
                <span>{currentLang.label}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: langDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: 'var(--text-muted)',
                  }}
                />
              </button>

              {langDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    insetInlineEnd: 0,
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.6rem',
                    minWidth: '220px',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  <div
                    style={{
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--border)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    {locale === 'ar' ? 'اختر لغة الواجهة' : locale === 'en' ? 'Select Language' : 'Choisir la langue'}
                  </div>

                  {languagesList.map((lang) => {
                    const isSelected = locale === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLocale(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? 'var(--primary)' : 'var(--dark-brown)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                          border: 'none',
                          textAlign: 'start',
                          width: '100%',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{lang.flag}</span>
                          <div>
                            <div style={{ lineHeight: 1.2 }}>{lang.native}</div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{lang.subtitle}</span>
                          </div>
                        </div>
                        {isSelected && <Check size={16} color="var(--primary)" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Session Quick Profile or Portal Login */}
            {user ? (
              <div style={{ position: 'relative' }} ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.65rem 0.35rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                    }}
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'start', display: 'none', minWidth: '70px' }} className="user-name-snippet">
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--dark-brown)', display: 'block', lineHeight: 1.1 }}>
                      {user.name.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {getRoleBadge(user.role).label}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      color: 'var(--text-muted)',
                    }}
                  />
                </button>

                {/* User Profile Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      insetInlineEnd: 0,
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '0.75rem',
                      minWidth: '240px',
                      zIndex: 200,
                      animation: 'fadeIn 0.15s ease-out',
                    }}
                  >
                    {/* User Card */}
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-warm)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.65rem',
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', color: 'var(--dark-brown)' }}>
                        {user.name}
                      </p>
                      <p style={{ margin: '0.15rem 0 0.5rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {user.email}
                      </p>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: getRoleBadge(user.role).bg,
                          color: getRoleBadge(user.role).color,
                          display: 'inline-block',
                        }}
                      >
                        {getRoleBadge(user.role).label}
                      </span>
                    </div>

                    {/* Quick navigation links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <>
                          <Link
                            href="/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.55rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--dark-brown)',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                            className="dropdown-hover-item"
                          >
                            <LayoutDashboard size={15} color="var(--primary)" />
                            <span>{t('nav_dashboard')}</span>
                          </Link>
                          {user.role === 'super_admin' && (
                            <Link
                              href="/dashboard/staff"
                              onClick={() => setUserDropdownOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.55rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--primary)',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                              className="dropdown-hover-item"
                            >
                              <Shield size={15} color="var(--primary)" />
                              <span>{locale === 'ar' ? 'حسابات السكرتارية' : 'Comptes Secrétariat'}</span>
                            </Link>
                          )}
                          <Link
                            href="/dashboard/schedule"
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.55rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--dark-brown)',
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                            className="dropdown-hover-item"
                          >
                            <Calendar size={15} color="var(--secondary)" />
                            <span>{t('admin_schedule')}</span>
                          </Link>
                          <Link
                            href="/dashboard/payments"
                            onClick={() => setUserDropdownOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.55rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--dark-brown)',
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                            className="dropdown-hover-item"
                          >
                            <Receipt size={15} color="var(--primary)" />
                            <span>{t('admin_payments')}</span>
                          </Link>
                        </>

                      <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--danger)',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            width: '100%',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            textAlign: 'start',
                          }}
                          className="dropdown-hover-danger"
                        >
                          <LogOut size={15} />
                          <span>{t('nav_logout')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Standalone Conversion CTA: Register Now */}
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="btn-primary btn-sm register-cta-btn"
              style={{
                borderRadius: 'var(--radius-full)',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                fontSize: '0.84rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(250, 70, 29, 0.3)',
              }}
            >
              <Sparkles size={14} />
              <span>{locale === 'ar' ? 'سجل الآن' : locale === 'en' ? 'Register Now' : "S'inscrire"}</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.55rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border)',
                backgroundColor: '#FFFFFF',
                color: 'var(--dark-brown)',
                cursor: 'pointer',
              }}
              className="mobile-toggle"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* 3. MOBILE SLIDE DRAWER OVERLAY */}
        {mobileMenuOpen && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
              animation: 'slideDown 0.2s ease-out',
            }}
            className="mobile-drawer"
          >
            {/* User session status if logged in */}
            {user && (
              <div
                style={{
                  backgroundColor: 'var(--bg-warm)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{user.name}</h4>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: getRoleBadge(user.role).color,
                      }}
                    >
                      {getRoleBadge(user.role).label}
                    </span>
                  </div>
                </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                  >
                    {t('nav_dashboard')}
                  </Link>
              </div>
            )}

            {/* Mobile Nav Links with Icons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: active ? 800 : 600,
                      color: active ? 'var(--primary)' : 'var(--dark-brown)',
                      backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <IconComponent size={18} color={active ? 'var(--primary)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '1rem' }}>{link.label}</span>
                    </div>
                    {link.badge ? (
                      <span
                        style={{
                          backgroundColor: active ? 'var(--primary)' : 'var(--secondary)',
                          color: active ? '#FFFFFF' : 'var(--dark-brown)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {link.badge}
                      </span>
                    ) : dir === 'rtl' ? (
                      <ArrowLeft size={16} color="var(--border)" />
                    ) : (
                      <ArrowRight size={16} color="var(--border)" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Trilingual pills in mobile drawer */}
            <div
              style={{
                backgroundColor: 'var(--bg-warm)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'لغة المنصة' : locale === 'en' ? 'Platform Language' : 'Langue'}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {languagesList.map((lang) => {
                  const isSel = locale === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLocale(lang.code);
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: isSel ? 800 : 600,
                        fontSize: '0.84rem',
                        backgroundColor: isSel ? 'var(--primary)' : '#FFFFFF',
                        color: isSel ? '#FFFFFF' : 'var(--dark-brown)',
                        border: isSel ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Actions: Register & Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsEnrollModalOpen(true);
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', gap: '0.5rem' }}
              >
                <Sparkles size={16} />
                <span>{t('cta_register_now')}</span>
              </button>

              <a
                href="https://wa.me/213550123456"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', gap: '0.5rem' }}
              >
                <MessageSquare size={16} />
                <span>WhatsApp (+213 550 12 34 56)</span>
              </a>

              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="btn-outline btn-sm"
                  style={{ width: '100%', color: 'var(--danger)', marginTop: '0.4rem' }}
                >
                  <LogOut size={15} />
                  <span>{t('nav_logout')}</span>
                </button>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {/* Standalone Quick Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        course={null}
      />

      {/* CSS-in-JS style rules for animations & responsive queries */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-hover-item:hover {
          background-color: var(--primary-light) !important;
          color: var(--primary) !important;
        }

        .dropdown-hover-danger:hover {
          background-color: var(--danger-light) !important;
        }

        .nav-link-item:hover {
          background-color: rgba(250, 70, 29, 0.06) !important;
          color: var(--primary) !important;
        }

        @media (min-width: 1040px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }

        @media (min-width: 1240px) {
          .user-name-snippet {
            display: block !important;
          }
        }

        @media (max-width: 1039px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
          .user-name-snippet {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .register-cta-btn {
            display: none !important;
          }
          .auth-btn-label {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
