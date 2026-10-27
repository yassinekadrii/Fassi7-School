'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { 
  GraduationCap, Plus, Edit2, BookOpen, Clock, X, Phone, Mail, 
  Key, ShieldCheck, CheckCircle2, Eye, EyeOff, Sparkles, MessageCircle, 
  ExternalLink, UserCheck, AlertCircle 
} from 'lucide-react';

export default function TeachersManagePage() {
  const { t, locale } = useLanguage();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [qualificationsFr, setQualificationsFr] = useState('');
  const [specialtiesFr, setSpecialtiesFr] = useState('');
  const [bioFr, setBioFr] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [hourlyRate, setHourlyRate] = useState(2500);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/courses'),
      ]);
      const tData = await tRes.json();
      const cData = await cRes.json();
      setTeachers(tData.teachers || []);
      setAvailableCourses(cData.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let result = '';
    for (let i = 0; i < 9; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setEmail('');
    setPassword('teacher123');
    setShowPassword(false);
    setPhone('');
    setStatus('active');
    setQualificationsFr('Certifié CELTA Cambridge / Master');
    setSpecialtiesFr('IELTS, TCF, Expression Orale');
    setBioFr('');
    setLanguagesSpoken('Anglais, Français, Arabe');
    setHourlyRate(2500);
    setSelectedCourseIds([]);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tch: any) => {
    setEditingTeacher(tch);
    setName(tch.name);
    setEmail(tch.email);
    setPassword(''); // leave blank unless changing
    setShowPassword(false);
    setPhone(tch.phone || '');
    setStatus(tch.status || 'active');
    setQualificationsFr(tch.qualifications_fr || '');
    setSpecialtiesFr(tch.specialties_fr || '');
    setBioFr(tch.bio_fr || '');
    setLanguagesSpoken(tch.languages_spoken || '');
    setHourlyRate(tch.hourly_rate || 2500);
    setSelectedCourseIds(tch.courses ? tch.courses.map((c: any) => c.id) : []);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload: any = {
      id: editingTeacher ? editingTeacher.id : undefined,
      name,
      email,
      phone,
      status,
      qualifications_fr: qualificationsFr,
      qualifications_ar: qualificationsFr,
      specialties_fr: specialtiesFr,
      specialties_ar: specialtiesFr,
      bio_fr: bioFr,
      bio_ar: bioFr,
      languages_spoken: languagesSpoken,
      hourly_rate: Number(hourlyRate),
      course_ids: selectedCourseIds,
    };

    if (password && password.trim().length > 0) {
      payload.password = password.trim();
    }

    try {
      const res = await fetch('/api/teachers', {
        method: editingTeacher ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setSuccessMsg(
          editingTeacher
            ? locale === 'ar' ? 'تم تحديث حساب الأستاذ والدورات المسندة بنجاح' : 'Compte enseignant et cours assignés mis à jour avec succès'
            : locale === 'ar' ? 'تم إنشاء حساب الأستاذ وإسناد الدورات بنجاح' : 'Compte enseignant créé et cours assignés avec succès !'
        );
        setTimeout(() => setSuccessMsg(''), 4500);
        loadData();
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const formatWhatsAppPhone = (rawPhone: string) => {
    if (!rawPhone) return '';
    let p = rawPhone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) {
      p = '213' + p.substring(1);
    } else if (!p.startsWith('213') && p.length === 9) {
      p = '213' + p;
    }
    return p;
  };

  const getWhatsAppInviteUrl = (tch: any) => {
    const cleanPhone = formatWhatsAppPhone(tch.phone);
    const loginUrl = 'https://fassi7-school.com/admin-portal';
    const msg = locale === 'ar'
      ? `مرحباً أستاذ ${tch.name}، تم إعداد حسابك كأستاذ معتمد في أكاديمية فصيح (Fassi7 School).\n\nيمكنك تسجيل الدخول عبر البوابة: ${loginUrl}\nاسم المستخدم: ${tch.email}\n\nيمكنك من خلال البوابة تسجيل حضور وغياب الطلاب (Présences) ومتابعة حصصك الدراسية.`
      : `Bonjour M./Mme ${tch.name}, votre compte enseignant Fassi7 School est activé.\n\nVous pouvez vous connecter sur votre espace enseignant : ${loginUrl}\nIdentifiant : ${tch.email}\n\nVous pourrez y faire l'appel des présences de vos étudiants, consulter vos séances et accéder à vos cours. Bienvenue dans l'équipe pédagogique !`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_teachers')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'إنشاء وإدارة حسابات الأساتذة، بيانات الدخول، تسجيل الحضور، والتخصصات'
              : 'Création des comptes enseignants, accès portail, gestion des présences & assignations'}
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary btn-sm" style={{ gap: '0.4rem' }}>
          <Plus size={16} />
          <span>{locale === 'ar' ? 'إنشاء حساب أستاذ جديد' : 'Créer un compte enseignant'}</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ 
          background: '#DEF7EC', 
          color: '#03543F', 
          padding: '0.85rem 1.25rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem', 
          fontSize: '0.9rem', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          border: '1px solid #BCF0DA'
        }}>
          <CheckCircle2 size={18} color="#0E9F6E" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Secretariat Guidance Notice */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--dark-brown)' }}>
              {locale === 'ar' ? 'فضاء السكرتارية — تمكين وصول الأساتذة للمنصة' : 'Secrétariat — Gestion des Accès Enseignants'}
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {locale === 'ar'
                ? 'أنشئ حساب الأستاذ بالبريد وكلمة المرور. بمجرد الدخول، يستطيع الأستاذ تسجيل حضور وغياب الطلاب في حصصه، ومراجعة غرف اللقاء التدريبية.'
                : 'Créez les identifiants de connexion pour vos formateurs. Ils accèdent à leur Espace Enseignant pour faire l\'appel (présences/absences) et animer leurs cours.'}
            </p>
          </div>
        </div>

        <Link
          href="/portal/teacher"
          target="_blank"
          className="btn-outline btn-sm"
          style={{ fontSize: '0.82rem', gap: '0.35rem', color: 'var(--primary)' }}
        >
          <ExternalLink size={14} />
          <span>{locale === 'ar' ? 'معاينة فضاء الأستاذ' : 'Aperçu Espace Enseignant'}</span>
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الأستاذ وحساب الدخول' : 'Enseignant & Compte'}</th>
                <th>{locale === 'ar' ? 'حالة الحساب' : 'Accès Portail'}</th>
                <th>{locale === 'ar' ? 'المؤهلات' : 'Diplômes'}</th>
                <th>{locale === 'ar' ? 'التخصصات' : 'Spécialités'}</th>
                <th>{locale === 'ar' ? 'الدورات المسندة' : 'Cours assignés'}</th>
                <th>{locale === 'ar' ? 'الأجر الساعي' : 'Tarif'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'إجراءات السكرتارية' : 'Actions Secrétariat'}</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((tch) => (
                <tr key={tch.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.9rem',
                        }}
                      >
                        {tch.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.94rem', color: 'var(--dark-brown)' }}>
                          {tch.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span>{tch.email}</span>
                          {tch.phone && (
                            <>
                              <span>•</span>
                              <span dir="ltr">{tch.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={tch.status === 'active' ? 'badge badge-success' : 'badge badge-secondary'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <UserCheck size={12} />
                      {tch.status === 'active'
                        ? (locale === 'ar' ? 'مفعل (له وصول)' : 'Actif (Accès OK)')
                        : (locale === 'ar' ? 'معطل' : 'Inactif')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tch.qualifications_fr || '-'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {tch.specialties_fr || '-'}
                    </span>
                  </td>
                  <td>
                    {tch.courses && tch.courses.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '340px' }}>
                        {tch.courses.map((c: any) => (
                          <div
                            key={c.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: '#FFF0EB',
                              border: '1px solid rgba(250, 70, 29, 0.2)',
                              color: 'var(--primary)',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              lineHeight: 1.3,
                            }}
                          >
                            <BookOpen size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
                            <span>{locale === 'ar' ? c.title_ar : c.title_fr}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {locale === 'ar' ? 'لم يُعيّن لأي دورة بعد' : 'Aucun cours assigné'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                      {tch.hourly_rate?.toLocaleString()} {t('price_dzd')}/h
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {/* Send Credentials WhatsApp button if phone exists */}
                      {tch.phone && (
                        <a
                          href={getWhatsAppInviteUrl(tch)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline btn-sm"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.76rem',
                            gap: '0.25rem',
                            background: '#E8F5E9',
                            borderColor: '#25D366',
                            color: '#1E7E34',
                            textDecoration: 'none',
                            fontWeight: 700
                          }}
                          title={locale === 'ar' ? 'إرسال بيانات الدخول عبر واتساب' : 'Envoyer identifiants via WhatsApp'}
                        >
                          <MessageCircle size={13} color="#25D366" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {/* Edit & Reset Password button */}
                      <button
                        onClick={() => openEditModal(tch)}
                        className="btn-outline btn-sm"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem' }}
                      >
                        <Edit2 size={13} />
                        <span>{locale === 'ar' ? 'تعديل / كلمة السر' : 'Gérer'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Teacher */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                  {editingTeacher
                    ? locale === 'ar' ? 'تعديل ملف وبيانات دخول الأستاذ' : 'Modifier le compte enseignant'
                    : locale === 'ar' ? 'إنشاء حساب جديد للأستاذ' : 'Créer un compte enseignant'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {locale === 'ar' ? 'تعيين بيانات الدخول لإدارة حضور الطلاب والدروس' : 'Définition des accès pour la gestion des présences et cours'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الاسم الكامل للأستاذ' : 'Nom complet de l\'enseignant'} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dr. Sarah Benali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'البريد الإلكتروني (لتسجيل الدخول)' : 'Email de connexion'} *</label>
                    <input
                      type="email"
                      required
                      placeholder="prof@fassi7.school"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('form_phone')}</label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="0550123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Password field with Generator */}
                <div className="form-group" style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 800 }}>
                      <Key size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                      {editingTeacher
                        ? locale === 'ar' ? 'تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : 'Nouveau mot de passe (laisser vide pour ne pas changer)'
                        : locale === 'ar' ? 'كلمة المرور للدخول' : 'Mot de passe de connexion *'}
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="btn-outline btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', gap: '0.25rem' }}
                    >
                      <Sparkles size={12} />
                      <span>{locale === 'ar' ? 'توليد كلمة سر' : 'Générer'}</span>
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingTeacher}
                      placeholder={editingTeacher ? '••••••••' : 'teacher123'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingInlineEnd: '42px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: locale === 'ar' ? 'auto' : '12px',
                        left: locale === 'ar' ? '12px' : 'auto',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
                    {locale === 'ar'
                      ? 'سيستخدم الأستاذ هذا البريد وكلمة المرور لتسجيل الدخول إلى فضاء الأستاذ وتسجيل حضور طلابه.'
                      : 'L\'enseignant utilisera cet email et ce mot de passe pour se connecter et faire l\'appel de ses étudiants.'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'حالة الحساب' : 'Statut du compte'}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="form-select"
                    >
                      <option value="active">{locale === 'ar' ? 'مفعل (يمكنه الدخول)' : 'Actif (Accès autorisé)'}</option>
                      <option value="inactive">{locale === 'ar' ? 'معطل مؤقتاً' : 'Inactif'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الأجر الساعي (دج)' : 'Tarif horaire (DZD)'}</label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Assigned Courses Section */}
                <div className="form-group" style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <label className="form-label" style={{ fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--dark-brown)' }}>
                    <BookOpen size={16} color="var(--primary)" />
                    <span>{locale === 'ar' ? 'الدورات المسندة لهذا الأستاذ' : 'Formations enseignées par ce formateur'}</span>
                  </label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                    {locale === 'ar'
                      ? 'حدد الدورات التدريبية التي يشرف عليها هذا الأستاذ ليتمكن من متابعة طلابها وتسجيل الحضور:'
                      : 'Cochez les cours que cet enseignant dispense afin qu\'il puisse gérer ses listes d\'élèves et faire l\'appel :'}
                  </p>
                  
                  {availableCourses.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'لا توجد دورات مسجلة' : 'Aucun cours disponible'}</span>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.2rem' }}>
                      {availableCourses.map((crs: any) => {
                        const isChecked = selectedCourseIds.includes(crs.id);
                        return (
                          <label
                            key={crs.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.55rem',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '8px',
                              background: isChecked ? '#FFF0EB' : '#FFFFFF',
                              border: isChecked ? '1.5px solid var(--primary)' : '1px solid #E2E8F0',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCourseIds([...selectedCourseIds, crs.id]);
                                } else {
                                  setSelectedCourseIds(selectedCourseIds.filter((id) => id !== crs.id));
                                }
                              }}
                              style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                            />
                            <div style={{ lineHeight: 1.25 }}>
                              <span style={{ fontWeight: isChecked ? 800 : 600, color: isChecked ? 'var(--primary)' : 'var(--dark-brown)', display: 'block' }}>
                                {locale === 'ar' ? crs.title_ar : crs.title_fr}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {crs.language_name_fr} • {crs.level}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'المؤهلات والشهادات' : 'Diplômes & Certifications'}</label>
                  <input
                    type="text"
                    placeholder="Ex: Master Didactique des Langues, CELTA"
                    value={qualificationsFr}
                    onChange={(e) => setQualificationsFr(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'التخصصات واللغات التدريسية' : 'Spécialités'}</label>
                  <input
                    type="text"
                    placeholder="Ex: IELTS Academic, TCF Canada, Anglais Médical"
                    value={specialtiesFr}
                    onChange={(e) => setSpecialtiesFr(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'نبذة تعريفية' : 'Biographie'}</label>
                  <textarea
                    rows={2}
                    placeholder="Expérience d'enseignement, méthodologie..."
                    value={bioFr}
                    onChange={(e) => setBioFr(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? '...' : (editingTeacher ? t('action_save') : (locale === 'ar' ? 'إنشاء الحساب وتفعيله' : 'Créer et activer le compte'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
