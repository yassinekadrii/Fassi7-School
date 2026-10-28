'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Fassi7Logo } from '@/components/Fassi7Logo';
import {
  LayoutDashboard,
  Globe,
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  UserCheck,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'super_admin' && user.role !== 'academy_admin'))) {
      router.push('/admin-portal');
    }
  }, [user, loading, router]);

  const navItems = [
    { href: '/dashboard', label: t('menu_overview'), icon: LayoutDashboard },
    { href: '/dashboard/languages', label: t('menu_languages'), icon: Globe },
    { href: '/dashboard/courses', label: t('menu_courses'), icon: BookOpen },
    { href: '/dashboard/teachers', label: t('menu_teachers'), icon: GraduationCap },
    { href: '/dashboard/students', label: t('menu_students'), icon: Users },
    { href: '/dashboard/schedule', label: t('menu_schedule'), icon: Calendar },
    { href: '/dashboard/enrollments', label: t('menu_enrollments'), icon: ClipboardList },
    { href: '/dashboard/payments', label: t('menu_payments'), icon: DollarSign },
    { href: '/dashboard/reports', label: t('menu_reports'), icon: BarChart3 },
    ...(user?.role === 'super_admin'
      ? [
          { href: '/dashboard/staff', label: t('menu_staff'), icon: UserCheck },
          { href: '/dashboard/settings', label: t('menu_settings'), icon: Settings },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {locale === 'ar' ? 'جاري التحميل...' : locale === 'en' ? 'Loading portal...' : 'Chargement...'}
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <Fassi7Logo size="sm" showSubtitle={true} />
        </div>

        {/* User Card */}
        {user && (
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-warm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                  <Shield size={10} />
                  {user.role === 'super_admin'
                    ? (locale === 'ar' ? 'المالك (Super Admin)' : locale === 'en' ? 'Owner (Super Admin)' : 'Propriétaire (Owner)')
                    : (locale === 'ar' ? 'السكرتارية (Admin)' : locale === 'en' ? 'Secretary (Admin)' : 'Secrétaire (Admin)')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <Link
            href="/"
            target="_blank"
            className="sidebar-nav-link"
            style={{ margin: 0, color: 'var(--primary)' }}
          >
            <ExternalLink size={17} />
            <span>{locale === 'ar' ? 'عرض الموقع العام' : locale === 'en' ? 'View Public Website' : 'Voir le site public'}</span>
          </Link>
          <button
            onClick={logout}
            className="sidebar-nav-link"
            style={{ width: '100%', margin: 0, marginTop: '0.25rem', color: 'var(--danger)' }}
          >
            <LogOut size={17} />
            <span>{t('nav_logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {t('dashboard_title')}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {([
              { code: 'ar', label: 'العربية', flag: '🇩🇿' },
              { code: 'fr', label: 'Français', flag: '🇫🇷' },
              { code: 'en', label: 'English', flag: '🇬🇧' },
            ] as const).map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={locale === l.code ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', gap: '0.3rem' }}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
