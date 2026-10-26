'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Fassi7Logo } from '@/components/Fassi7Logo';
import { LogIn, Lock, Mail, Shield, UserCheck, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();
  const { login, quickLoginAs } = useAuth();
  const { locale, dir } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(
        res.error ||
          (locale === 'ar'
            ? 'بيانات الدخول غير صحيحة'
            : locale === 'en'
            ? 'Invalid email or password'
            : 'Identifiants invalides')
      );
    }
  };

  const handleQuickLogin = async (role: 'super_admin' | 'academy_admin') => {
    setLoading(true);
    setError('');
    await quickLoginAs(role);
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% 15%, #FFF0EB 0%, var(--bg-warm) 100%)',
        padding: '2.5rem 1.25rem',
      }}
    >
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Fassi7Logo size="lg" showSubtitle={true} />
      </div>

      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: 'clamp(2rem, 5vw, 2.75rem)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 50px rgba(61, 27, 13, 0.12)',
          border: '1.5px solid var(--border)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            <Shield size={14} />
            <span>{locale === 'ar' ? 'مسار إداري محمي (Hidden Portal)' : 'Portail d\'Accès Sécurisé'}</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--dark-brown)' }}>
            {locale === 'ar'
              ? 'تسجيل دخول الإدارة المركزية'
              : locale === 'en'
              ? 'Central Administration Sign In'
              : 'Connexion Direction & Administration'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
            {locale === 'ar'
              ? 'بوابة مخصصة حصرياً للمدير العام (Super Admin) وسكرتارية الأكاديمية (Admin).'
              : locale === 'en'
              ? 'Restricted strictly to the Academy Owner (Super Admin) and Staff Secretary (Admin).'
              : 'Accès réservé au Directeur Général (Super Admin) et au Secrétariat (Admin).'}
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '0.85rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.4rem', display: 'block' }}>
              {locale === 'ar' ? 'البريد الإلكتروني المهني' : 'Adresse Email Professionnelle'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fassi7.com"
                required
                className="form-control"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  paddingLeft: dir === 'ltr' ? '2.5rem' : '1rem',
                  paddingRight: dir === 'rtl' ? '2.5rem' : '1rem',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <Mail
                size={17}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: dir === 'ltr' ? '0.85rem' : 'auto',
                  right: dir === 'rtl' ? '0.85rem' : 'auto',
                  color: 'var(--text-light)',
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.4rem', display: 'block' }}>
              {locale === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="form-control"
                style={{
                  width: '100%',
                  padding: '0.8rem 2.5rem',
                  borderRadius: 'var(--radius-md)',
                }}
              />
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: dir === 'ltr' ? '0.85rem' : 'auto',
                  right: dir === 'rtl' ? '0.85rem' : 'auto',
                  color: 'var(--text-light)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: dir === 'ltr' ? '0.85rem' : 'auto',
                  left: dir === 'rtl' ? '0.85rem' : 'auto',
                  color: 'var(--text-light)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '1rem',
              gap: '0.5rem',
              boxShadow: '0 6px 18px rgba(250, 70, 29, 0.3)',
            }}
          >
            <LogIn size={18} />
            <span>{loading ? '...' : locale === 'ar' ? 'دخول لوحة التحكم' : 'Accéder au Dashboard'}</span>
          </button>
        </form>

        {/* 1-Click Role Switcher for Owner & Secretary */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <p
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.85rem',
              textAlign: 'center',
            }}
          >
            {locale === 'ar'
              ? '⚡ تجربة فورية للحسابات الإدارية (1-Click)'
              : '⚡ Accès Rapide Direction & Secrétariat'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('super_admin')}
              className="btn-outline btn-sm"
              style={{
                fontSize: '0.82rem',
                padding: '0.8rem 0.6rem',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '0.35rem',
                border: '1.5px solid var(--primary)',
                backgroundColor: 'rgba(250, 70, 29, 0.05)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                <Shield size={16} />
                <span>Super Admin</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {locale === 'ar' ? 'المدير العام (Owner)' : 'Directeur Général'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('academy_admin')}
              className="btn-outline btn-sm"
              style={{
                fontSize: '0.82rem',
                padding: '0.8rem 0.6rem',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '0.35rem',
                border: '1.5px solid var(--secondary)',
                backgroundColor: 'rgba(255, 173, 24, 0.06)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: 'var(--dark-brown)' }}>
                <UserCheck size={16} color="var(--secondary)" />
                <span>Admin</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {locale === 'ar' ? 'السكرتارية (Secrétaire)' : 'Secrétariat d\'Académie'}
              </span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.8rem', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'color var(--transition-fast)',
            }}
          >
            {dir === 'rtl' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{locale === 'ar' ? 'العودة إلى الموقع العام' : 'Retour au site public'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
