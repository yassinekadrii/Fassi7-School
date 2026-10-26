'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Lock,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface SecretaryAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export default function StaffManagementPage() {
  const { user } = useAuth();
  const { locale, t } = useLanguage();

  const [secretaries, setSecretaries] = useState<SecretaryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Secretary Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Password Reset Modal State
  const [resetModalAccount, setResetModalAccount] = useState<SecretaryAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (res.ok) {
        setSecretaries(data.secretaries || []);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchStaff();
    }
  }, [user]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const handleCreateSecretary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(
          locale === 'ar'
            ? `تم إنشاء حساب السكرتارية بنجاح (${data.secretary.name}) !`
            : `Compte secrétaire créé avec succès (${data.secretary.name}) !`
        );
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setIsModalOpen(false);
        fetchStaff();
      } else {
        setError(data.error || 'Échec de la création du compte');
      }
    } catch {
      setError('Erreur réseau lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (account: SecretaryAccount) => {
    const nextStatus = account.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/staff/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(
          locale === 'ar'
            ? `تم تحديث حالة الحساب إلى ${nextStatus === 'active' ? 'مفعل' : 'معطل'}`
            : `Statut du compte mis à jour (${nextStatus})`
        );
        fetchStaff();
      } else {
        setError(data.error || 'Erreur de mise à jour');
      }
    } catch {
      setError('Erreur réseau');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalAccount) return;

    setResetting(true);
    setError('');
    try {
      const res = await fetch(`/api/staff/${resetModalAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(
          locale === 'ar'
            ? `تم تغيير كلمة مرور السكرتارية (${resetModalAccount.name}) بنجاح !`
            : `Mot de passe réinitialisé avec succès pour ${resetModalAccount.name} !`
        );
        setResetModalAccount(null);
        setNewPassword('');
      } else {
        setError(data.error || 'Échec de réinitialisation');
      }
    } catch {
      setError('Erreur réseau lors de la réinitialisation');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteSecretary = async (account: SecretaryAccount) => {
    const confirmPrompt =
      locale === 'ar'
        ? `هل أنت متأكد من رغبتك في حذف حساب السكرتارية (${account.name}) نهائياً؟`
        : `Êtes-vous sûr de vouloir supprimer définitivement le compte secrétaire de ${account.name} ?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/staff/${account.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(
          locale === 'ar' ? 'تم حذف حساب السكرتارية بنجاح' : 'Compte secrétaire supprimé avec succès'
        );
        fetchStaff();
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur réseau lors de la suppression');
    }
  };

  // Restrict access to Super Admin (Owner)
  if (user && user.role !== 'super_admin') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <Lock size={32} />
        </div>
        <h2 style={{ color: 'var(--dark-brown)', marginBottom: '0.5rem' }}>
          {locale === 'ar' ? 'صلاحيات غير كافية' : 'Accès Restreint'}
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
          {locale === 'ar'
            ? 'هذه الصفحة مخصصة حصرياً لمالك الأكاديمية (Super Admin) لإنشاء وإدارة حسابات السكرتارية.'
            : 'Cette section est réservée exclusivement au Propriétaire (Super Admin) pour créer et gérer les comptes du secrétariat.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                backgroundColor: 'rgba(250, 70, 29, 0.12)',
                color: 'var(--primary)',
                fontWeight: 900,
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <ShieldCheck size={12} />
              {locale === 'ar' ? 'خاص بالمالك (Super Admin)' : 'Exclusif Propriétaire'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {locale === 'ar' ? 'إدارة حسابات السكرتارية' : 'Gestion des Comptes Secrétariat'}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'أنت المالك، تملك الصلاحية الحصرية لإنشاء حسابات السكرتارية (Admin) وتحديد بيانات دخولهم وكلمات المرور.'
              : 'En tant que propriétaire, vous êtes le seul habilité à créer et administrer les comptes de vos secrétaires.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ gap: '0.5rem', padding: '0.75rem 1.35rem', boxShadow: '0 4px 14px rgba(250, 70, 29, 0.25)' }}
        >
          <UserPlus size={18} />
          <span>{locale === 'ar' ? 'إنشاء حساب سكرتارية جديد' : 'Créer un Compte Secrétaire'}</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div
          style={{
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(250, 70, 29, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {locale === 'ar' ? 'مالك الأكاديمية (Owner)' : 'Propriétaire / Direction'}
            </span>
            <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1.1rem', fontWeight: 900 }}>
              {user?.name || 'Directeur Fassi7'}
            </h4>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 173, 24, 0.15)',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {locale === 'ar' ? 'عدد حسابات السكرتارية' : 'Comptes Secrétariat Actifs'}
            </span>
            <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1.35rem', fontWeight: 900, color: 'var(--dark-brown)' }}>
              {secretaries.filter((s) => s.status === 'active').length} / {secretaries.length}
            </h4>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {locale === 'ar' ? 'نوع الحسابات المصرحة' : 'Système d\'Accès'}
            </span>
            <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#10B981' }}>
              {locale === 'ar' ? 'المالك والسكرتارية فقط' : 'Propriétaire & Secrétariat'}
            </h4>
          </div>
        </div>
      </div>

      {/* Secretaries Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2.5rem' }}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--dark-brown)' }}>
              {locale === 'ar' ? 'قائمة حسابات السكرتارية المعتمدة' : 'Liste des Comptes Secrétaires'}
            </h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            {secretaries.length} {locale === 'ar' ? 'حساب' : 'compte(s)'}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>
            {locale === 'ar' ? 'جاري تحميل الحسابات...' : 'Chargement des comptes...'}
          </div>
        ) : secretaries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {locale === 'ar'
                ? 'لا توجد حسابات سكرتارية بعد. انقر على زر "إنشاء حساب سكرتارية جديد" بالاعلى.'
                : 'Aucun compte secrétaire pour le moment. Cliquez sur "Créer un Compte Secrétaire".'}
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn-outline btn-sm">
              <UserPlus size={15} />
              <span>{locale === 'ar' ? 'إضافة سكرتيرة' : 'Ajouter une secrétaire'}</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-warm)', borderBottom: '1px solid var(--border)', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'start' }}>{locale === 'ar' ? 'السكرتيرة' : 'Secrétaire'}</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'start' }}>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'start' }}>{locale === 'ar' ? 'الهاتف' : 'Téléphone'}</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'start' }}>{locale === 'ar' ? 'الحالة' : 'Statut'}</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'start' }}>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Créé le'}</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {secretaries.map((sec) => (
                  <tr key={sec.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.92rem' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                          }}
                        >
                          {sec.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--dark-brown)' }}>{sec.name}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Admin • Secrétaire Fassi7
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--dark-brown)', fontWeight: 600 }} dir="ltr">
                      {sec.email}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }} dir="ltr">
                      {sec.phone || '—'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        onClick={() => handleToggleStatus(sec)}
                        style={{
                          cursor: 'pointer',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: sec.status === 'active' ? 'var(--success-light)' : 'var(--danger-light)',
                          color: sec.status === 'active' ? 'var(--success)' : 'var(--danger)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                        title={locale === 'ar' ? 'انقر لتبديل حالة التفعيل' : 'Cliquer pour changer le statut'}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: sec.status === 'active' ? 'var(--success)' : 'var(--danger)',
                          }}
                        />
                        <span>{sec.status === 'active' ? (locale === 'ar' ? 'نشط' : 'Actif') : (locale === 'ar' ? 'معطل' : 'Inactif')}</span>
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {sec.created_at ? new Date(sec.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR') : '—'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          onClick={() => setResetModalAccount(sec)}
                          className="btn-outline btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem' }}
                          title={locale === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Réinitialiser le mot de passe'}
                        >
                          <KeyRound size={13} color="var(--primary)" />
                          <span>{locale === 'ar' ? 'كلمة المرور' : 'Mot de passe'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSecretary(sec)}
                          className="btn-outline btn-sm"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.78rem',
                            color: 'var(--danger)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                          }}
                          title={locale === 'ar' ? 'حذف الحساب' : 'Supprimer'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Architecture Guide */}
      <div className="card" style={{ backgroundColor: 'var(--bg-warm)', border: '1.5px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--dark-brown)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--primary)" />
          <span>{locale === 'ar' ? 'مخطط الصلاحيات في أكاديمية فصيح' : 'Architecture des Rôles & Accès'}</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.4rem' }}>
              <ShieldCheck size={16} />
              <span>{locale === 'ar' ? 'مالك الأكاديمية (Super Admin)' : 'Super Admin (Propriétaire)'}</span>
            </div>
            <ul style={{ margin: 0, paddingInlineStart: '1.2rem', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>{locale === 'ar' ? 'إنشاء وإلغاء وتعديل حسابات السكرتارية' : 'Créer et administrer les comptes secrétaires'}</li>
              <li>{locale === 'ar' ? 'التحكم الكامل في إعدادات المنصة والحساب البريدي' : 'Gestion complète des paramètres et BaridiMob'}</li>
              <li>{locale === 'ar' ? 'الاطلاع على التقارير المالية والعمليات الحساسة' : 'Accès aux rapports financiers et traçabilité'}</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 900, color: 'var(--dark-brown)', marginBottom: '0.4rem' }}>
              <UserCheck size={16} color="var(--secondary)" />
              <span>{locale === 'ar' ? 'سكرتارية الأكاديمية (Admin)' : 'Admin (Secrétaire)'}</span>
            </div>
            <ul style={{ margin: 0, paddingInlineStart: '1.2rem', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>{locale === 'ar' ? 'إدارة التسجيلات، الطلاب والأساتذة' : 'Gestion des inscriptions, étudiants et formateurs'}</li>
              <li>{locale === 'ar' ? 'تأكيد الحصص، الجداول الزمني والمدفوعات' : 'Organisation des plannings et saisie des règlements'}</li>
              <li>{locale === 'ar' ? 'لا يمكنها إنشاء حسابات أخرى أو تعديل إعدادات المالك' : 'Ne peut pas créer de comptes ni modifier la direction'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create Secretary Account */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(61, 27, 13, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              padding: '2rem',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(250, 70, 29, 0.1)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--dark-brown)' }}>
                  {locale === 'ar' ? 'إنشاء حساب سكرتارية جديد' : 'Créer un Compte Secrétaire'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSecretary}>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'الاسم الكامل للسكرتيرة' : 'Nom complet de la secrétaire'}</label>
                <input
                  type="text"
                  required
                  placeholder={locale === 'ar' ? 'مثال: نادية المنصوري' : 'ex: Nadia Mansouri'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('form_email')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="nadia@fassi7.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    dir="ltr"
                    style={{ paddingInlineStart: '2.4rem' }}
                  />
                  <Mail
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('form_phone')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="+213 551 22 33 44"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    dir="ltr"
                    style={{ paddingInlineStart: '2.4rem' }}
                  />
                  <Phone
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    {locale === 'ar' ? 'كلمة المرور الابتدائية' : 'Mot de passe initial'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Sparkles size={12} />
                    <span>{locale === 'ar' ? 'توليد كلمة سر آمنة' : 'Générer mot de passe'}</span>
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    dir="ltr"
                    style={{ paddingInlineStart: '2.4rem', paddingInlineEnd: '2.4rem' }}
                  />
                  <Lock
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      insetInlineEnd: '0.85rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-warm)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1.5rem',
                  lineHeight: 1.4,
                }}
              >
                {locale === 'ar'
                  ? '🔒 هذا الحساب سيمنح صلاحيات السكرتارية (Admin) للوصول إلى لوحة التحكم وإدارة الأفواج والطلاب دون الوصول لإعدادات المالك.'
                  : '🔒 Ce compte disposera des droits Secrétaire (Admin) pour gérer l\'académie au quotidien sans accès aux paramètres de direction.'}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline">
                  {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ gap: '0.4rem' }}>
                  <UserPlus size={16} />
                  <span>{submitting ? '...' : locale === 'ar' ? 'تأكيد وإنشاء الحساب' : 'Créer le Compte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Secretary Password */}
      {resetModalAccount && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(61, 27, 13, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              padding: '2rem',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--dark-brown)' }}>
                  {locale === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Réinitialiser le mot de passe'}
                </h3>
              </div>
              <button
                onClick={() => setResetModalAccount(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {locale === 'ar'
                ? `تحديد كلمة مرور جديدة للسكرتيرة: ${resetModalAccount.name} (${resetModalAccount.email})`
                : `Définir un nouveau mot de passe pour ${resetModalAccount.name} (${resetModalAccount.email})`}
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder={locale === 'ar' ? 'أدخل 6 أحرف على الأقل' : 'Au moins 6 caractères'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  dir="ltr"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setResetModalAccount(null)} className="btn-outline">
                  {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" disabled={resetting || !newPassword} className="btn-primary" style={{ gap: '0.4rem' }}>
                  <RefreshCw size={15} />
                  <span>{resetting ? '...' : locale === 'ar' ? 'حفظ كلمة المرور' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
