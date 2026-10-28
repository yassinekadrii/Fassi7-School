'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { 
  GraduationCap, Plus, Edit2, BookOpen, Clock, X, Phone, Mail, 
  Key, ShieldCheck, CheckCircle2, Eye, EyeOff, Sparkles, MessageCircle, 
  ExternalLink, UserCheck, AlertCircle, Search, Filter, Users, 
  Award, Trash2, Copy, Check, ChevronDown, ChevronUp, Briefcase
} from 'lucide-react';
import {
  getLocalizedCourseTitle,
  getLocalizedCourseLevel,
} from '@/lib/courseHelpers';

export default function TeachersManagePage() {
  const { t, locale } = useLanguage();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [expandedTeacherCourses, setExpandedTeacherCourses] = useState<{ [id: number]: boolean }>({});

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
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Course search in modal
  const [modalCourseSearch, setModalCourseSearch] = useState('');

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
    for (let i = 0; i < 10; i++) {
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
    setModalCourseSearch('');
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
    setModalCourseSearch('');
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
            ? locale === 'ar'
              ? 'تم تحديث حساب الأستاذ والدورات المسندة بنجاح'
              : locale === 'en'
              ? 'Teacher account and course assignments updated successfully'
              : 'Compte enseignant et cours assignés mis à jour avec succès'
            : locale === 'ar'
            ? 'تم إنشاء حساب الأستاذ وإسناد الدورات بنجاح'
            : locale === 'en'
            ? 'New teacher account created and courses assigned successfully'
            : 'Compte enseignant créé et cours assignés avec succès !'
        );
        setTimeout(() => setSuccessMsg(''), 4500);
        loadData();
      } else {
        setError(data.error || (locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : locale === 'en' ? 'Error saving record' : 'Erreur lors de l\'enregistrement'));
      }
    } catch {
      setError(locale === 'ar' ? 'خطأ في الاتصال بالشبكة' : locale === 'en' ? 'Network error' : 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (tch: any) => {
    const confirmMsg =
      locale === 'ar'
        ? `هل أنت متأكد من تعطيل حساب الأستاذ ${tch.name}؟`
        : locale === 'en'
        ? `Are you sure you want to deactivate instructor ${tch.name}?`
        : `Êtes-vous sûr de vouloir désactiver le compte de ${tch.name} ?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/teachers?id=${tch.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(
          locale === 'ar'
            ? 'تم تعطيل حساب الأستاذ بنجاح'
            : locale === 'en'
            ? 'Instructor account deactivated successfully'
            : 'Compte enseignant désactivé avec succès'
        );
        setTimeout(() => setSuccessMsg(''), 4000);
        loadData();
      }
    } catch (err) {
      console.error(err);
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
    const msg =
      locale === 'ar'
        ? `مرحباً أستاذ ${tch.name}، تم تفعيل حسابك كأستاذ معتمد في أكاديمية فصيح (Fassi7 School).\n\nيمكنك تسجيل الدخول عبر البوابة: ${loginUrl}\nاسم المستخدم: ${tch.email}\n\nيمكنك من خلال البوابة تسجيل حضور وغياب الطلاب (Présences) ومتابعة حصصك الدراسية وسجلات الإفواج. مرحباً بك في الفريق الأكاديمي!`
        : locale === 'en'
        ? `Hello Pr. ${tch.name}, your instructor account at Fassi7 School is active!\n\nYou can sign in at your Instructor Portal: ${loginUrl}\nLogin ID: ${tch.email}\n\nYou can take student roll calls, view your scheduled sessions, and manage your full course attendance sheets. Welcome to our academic faculty!`
        : `Bonjour M./Mme ${tch.name}, votre compte enseignant Fassi7 School est activé.\n\nVous pouvez vous connecter sur votre espace enseignant : ${loginUrl}\nIdentifiant : ${tch.email}\n\nVous pourrez y faire l'appel des présences de vos étudiants, consulter vos séances et accéder à vos cours. Bienvenue dans l'équipe pédagogique !`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const copyCredentials = (tch: any) => {
    const text = `Fassi7 School Portal: https://fassi7-school.com/admin-portal\nEmail: ${tch.email}`;
    navigator.clipboard.writeText(text);
    setCopiedId(tch.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleExpandCourses = (id: number) => {
    setExpandedTeacherCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter((t) => t.status === 'active').length;
    let totalAssignedCourses = 0;
    let totalHourlyRate = 0;

    teachers.forEach((t) => {
      if (t.courses) totalAssignedCourses += t.courses.length;
      totalHourlyRate += t.hourly_rate || 2500;
    });

    const avgRate = totalTeachers > 0 ? Math.round(totalHourlyRate / totalTeachers) : 2500;

    return { totalTeachers, activeTeachers, totalAssignedCourses, avgRate };
  }, [teachers]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((tch) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        tch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tch.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tch.phone && tch.phone.includes(searchTerm)) ||
        (tch.specialties_fr && tch.specialties_fr.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter !== 'all' && tch.status !== statusFilter) return false;

      if (languageFilter !== 'all') {
        const hasLang = tch.courses && tch.courses.some((c: any) => c.lang_name?.toLowerCase().includes(languageFilter.toLowerCase()));
        if (!hasLang) return false;
      }

      return true;
    });
  }, [teachers, searchTerm, statusFilter, languageFilter]);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                backgroundColor: '#FFF2EE',
                color: '#FA461D',
                fontSize: '0.76rem',
                fontWeight: 800,
              }}
            >
              <GraduationCap size={14} />
              {locale === 'ar' ? 'هيئة التدريس والأساتذة' : locale === 'en' ? 'Faculty & Instructors' : 'Corps Professoral'}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                fontSize: '0.76rem',
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={13} />
              {locale === 'ar' ? `${kpis.activeTeachers} أستاذ نشط` : locale === 'en' ? `${kpis.activeTeachers} Active Faculty` : `${kpis.activeTeachers} Actifs`}
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: '#3D1B0D' }}>
            {locale === 'ar' ? 'إدارة هيئة التدريس والأساتذة' : locale === 'en' ? 'Faculty & Instructors Management' : 'Gestion des Enseignants & Formateurs'}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: '#7A6258', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'إنشاء وإدارة حسابات الأساتذة، بيانات الدخول، تسجيل الحضور، والتخصصات'
              : locale === 'en'
              ? 'Create & manage instructor accounts, portal credentials, course assignments, and roll call monitoring'
              : 'Création des comptes enseignants, accès portail, gestion des présences & assignations'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link
            href="/portal/teacher"
            target="_blank"
            className="btn-outline btn-sm"
            style={{ fontSize: '0.84rem', gap: '0.4rem', color: '#FA461D', borderColor: '#F2D5C8', backgroundColor: '#FFFFFF' }}
          >
            <ExternalLink size={15} />
            <span>{locale === 'ar' ? 'معاينة فضاء الأستاذ' : locale === 'en' ? 'Preview Teacher Portal' : 'Aperçu Espace Enseignant'}</span>
          </Link>

          <button onClick={openAddModal} className="btn-primary btn-sm" style={{ gap: '0.45rem', boxShadow: '0 4px 14px rgba(250, 70, 29, 0.25)' }}>
            <Plus size={16} />
            <span>{locale === 'ar' ? 'إنشاء حساب أستاذ جديد' : locale === 'en' ? '+ New Instructor Account' : '+ Créer un compte enseignant'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'إجمالي الأساتذة' : locale === 'en' ? 'Total Faculty' : 'Total Enseignants'}
            </span>
            <Users size={18} color="#FA461D" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#3D1B0D' }}>
            {kpis.totalTeachers}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#166534', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
            {kpis.activeTeachers} {locale === 'ar' ? 'حساب نشط حالياً' : locale === 'en' ? 'active accounts' : 'comptes actifs'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'الدورات المسندة' : locale === 'en' ? 'Course Assignments' : 'Formations Assignées'}
            </span>
            <BookOpen size={18} color="#0284C7" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0369A1' }}>
            {kpis.totalAssignedCourses}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#0369A1', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
            {availableCourses.length} {locale === 'ar' ? 'دورة مسجلة في الأكاديمية' : locale === 'en' ? 'total courses catalog' : 'formations au catalogue'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'متوسط الأجر الساعي' : locale === 'en' ? 'Average Hourly Rate' : 'Tarif Moyen / Heure'}
            </span>
            <Award size={18} color="#D97706" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#D97706' }}>
            {kpis.avgRate.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>DZD/h</span>
          </span>
          <span style={{ fontSize: '0.74rem', color: '#7A6258', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
            {locale === 'ar' ? 'تقدير المستحقات التعليمية' : locale === 'en' ? 'Instructional remuneration' : 'Honoraires pédagogiques'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #EADBCE', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(61, 27, 13, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 800 }}>
              {locale === 'ar' ? 'وصول البوابة' : locale === 'en' ? 'Portal Security' : 'Accès & Sécurité'}
            </span>
            <ShieldCheck size={18} color="#166534" />
          </div>
          <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#166534' }}>
            100%
          </span>
          <span style={{ fontSize: '0.74rem', color: '#166534', display: 'block', marginTop: '0.2rem', fontWeight: 700 }}>
            {locale === 'ar' ? 'مشفر عبر bcryptjs' : locale === 'en' ? 'Secured via bcryptjs' : 'Sécurisé & crypté bcrypt'}
          </span>
        </div>
      </div>

      {successMsg && (
        <div style={{ 
          background: '#DEF7EC', 
          color: '#03543F', 
          padding: '0.9rem 1.4rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem', 
          fontSize: '0.9rem', 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          border: '1.5px solid #BCF0DA',
          boxShadow: '0 2px 8px rgba(14, 159, 110, 0.15)'
        }}>
          <CheckCircle2 size={18} color="#0E9F6E" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Secretariat Guidance Notice */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #EADBCE',
        borderRadius: '14px',
        padding: '1.15rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 10px rgba(61, 27, 13, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF0EA', color: '#FA461D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: '#3D1B0D' }}>
              {locale === 'ar' ? 'فضاء السكرتارية — تمكين وصول الأساتذة للمنصة وتسجيل الحضور' : locale === 'en' ? 'Secretariat Guide — Faculty Portal Access & Roll Call Setup' : 'Secrétariat — Gestion des Accès Enseignants & Appel des Présences'}
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#7A6258', lineHeight: 1.45 }}>
              {locale === 'ar'
                ? 'أنشئ حساب الأستاذ بالبريد وكلمة المرور. بمجرد الدخول، يستطيع الأستاذ تسجيل حضور وغياب الطلاب في حصصه، ومراجعة غرف اللقاء التدريبية والسجل الشامل.'
                : locale === 'en'
                ? 'Create instructor credentials with email and password. Upon login, instructors take roll calls, mark student attendance, view session rosters, and open the full course master attendance register.'
                : 'Créez les identifiants de connexion pour vos formateurs. Ils accèdent à leur Espace Enseignant pour faire l\'appel, enregistrer les présences et ouvrir le registre général d\'émargement.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontWeight: 700 }}>
            {locale === 'ar' ? 'بوابة الأساتذة:' : locale === 'en' ? 'Instructor Portal:' : 'Espace Enseignant :'}
          </span>
          <code style={{ backgroundColor: '#F8F5F1', border: '1px solid #EADBCE', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.76rem', color: '#FA461D', fontWeight: 700 }}>
            /portal/teacher
          </code>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid #EADBCE',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 2px 8px rgba(61, 27, 13, 0.03)',
        }}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '260px' }}>
          <Search size={17} color="#8C6F5A" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              locale === 'ar'
                ? 'بحث بالاسم، البريد الإلكتروني، الهاتف، أو التخصص...'
                : locale === 'en'
                ? 'Search by name, email, phone, or specialty...'
                : 'Rechercher par nom, email, téléphone ou spécialité...'
            }
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.88rem',
              width: '100%',
              color: '#3D1B0D',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C6F5A' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={14} color="#8C6F5A" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: '#F8F5F1',
                border: '1px solid #EADBCE',
                borderRadius: '8px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#3D1B0D',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">{locale === 'ar' ? 'جميع الحالات' : locale === 'en' ? 'All Statuses' : 'Tous les statuts'}</option>
              <option value="active">{locale === 'ar' ? 'حسابات مفعلة فقط' : locale === 'en' ? 'Active Only' : 'Actifs uniquement'}</option>
              <option value="inactive">{locale === 'ar' ? 'حسابات معطلة' : locale === 'en' ? 'Inactive Only' : 'Inactifs'}</option>
            </select>
          </div>

          <span style={{ fontSize: '0.82rem', color: '#8C6F5A', fontWeight: 700 }}>
            {filteredTeachers.length} {locale === 'ar' ? 'أستاذ معروض' : locale === 'en' ? 'faculty shown' : 'enseignants affichés'}
          </span>
        </div>
      </div>

      {/* Main Teachers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #EADBCE', borderRadius: '16px', boxShadow: '0 4px 16px rgba(61, 27, 13, 0.04)' }}>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: locale === 'ar' ? 'right' : 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F5F1', borderBottom: '2px solid #EADBCE' }}>
                <th style={{ padding: '0.9rem 1.1rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '240px' }}>
                  {locale === 'ar' ? 'الأستاذ وحساب الدخول' : locale === 'en' ? 'Instructor & Credentials' : 'Enseignant & Compte'}
                </th>
                <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '120px' }}>
                  {locale === 'ar' ? 'حالة الحساب' : locale === 'en' ? 'Portal Status' : 'Accès Portail'}
                </th>
                <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '180px' }}>
                  {locale === 'ar' ? 'المؤهلات' : locale === 'en' ? 'Diplomas & Degrees' : 'Diplômes'}
                </th>
                <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '180px' }}>
                  {locale === 'ar' ? 'التخصصات' : locale === 'en' ? 'Specialties' : 'Spécialités'}
                </th>
                <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '250px' }}>
                  {locale === 'ar' ? 'الدورات المسندة' : locale === 'en' ? 'Assigned Courses' : 'Cours assignés'}
                </th>
                <th style={{ padding: '0.9rem 0.75rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', textAlign: 'center', minWidth: '110px' }}>
                  {locale === 'ar' ? 'النشاط' : locale === 'en' ? 'Activity' : 'Activité'}
                </th>
                <th style={{ padding: '0.9rem 0.85rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', minWidth: '120px' }}>
                  {locale === 'ar' ? 'الأجر الساعي' : locale === 'en' ? 'Hourly Rate' : 'Tarif'}
                </th>
                <th style={{ padding: '0.9rem 1.1rem', fontSize: '0.84rem', fontWeight: 900, color: '#3D1B0D', textAlign: 'center', minWidth: '180px' }}>
                  {locale === 'ar' ? 'إجراءات السكرتارية' : locale === 'en' ? 'Secretariat Actions' : 'Actions Secrétariat'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#8C6F5A' }}>
                    <Users size={36} color="#D1C2B8" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      {locale === 'ar' ? 'لم يتم العثور على أي أستاذ مطابق للبحث.' : locale === 'en' ? 'No faculty members match your filter.' : 'Aucun enseignant ne correspond aux critères.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((tch, idx) => {
                  const isExpanded = !!expandedTeacherCourses[tch.id];
                  const displayedCourses = isExpanded ? tch.courses : (tch.courses ? tch.courses.slice(0, 2) : []);
                  const hiddenCount = tch.courses && tch.courses.length > 2 ? tch.courses.length - 2 : 0;

                  return (
                    <tr
                      key={tch.id}
                      style={{
                        borderBottom: '1px solid #F0DFD3',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FCFAF7',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Column 1: Instructor Profile & Credentials */}
                      <td style={{ padding: '0.85rem 1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #FA461D 0%, #FFAD17 100%)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '0.95rem',
                              flexShrink: 0,
                              boxShadow: '0 3px 8px rgba(250, 70, 29, 0.25)',
                            }}
                          >
                            {tch.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', color: '#3D1B0D' }}>
                                {tch.name}
                              </p>
                              {copiedId === tch.id && (
                                <span style={{ fontSize: '0.7rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                                  {locale === 'ar' ? 'تم النسخ!' : locale === 'en' ? 'Copied!' : 'Copié !'}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem', fontSize: '0.78rem', color: '#7A6258', flexWrap: 'wrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Mail size={12} color="#8C6F5A" />
                                {tch.email}
                              </span>
                              {tch.phone && (
                                <>
                                  <span>•</span>
                                  <span dir="ltr" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Phone size={12} color="#8C6F5A" />
                                    {tch.phone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Portal Status */}
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            backgroundColor: tch.status === 'active' ? '#ECFDF5' : '#F3F4F6',
                            color: tch.status === 'active' ? '#065F46' : '#6B7280',
                            border: tch.status === 'active' ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: tch.status === 'active' ? '#10B981' : '#9CA3AF',
                              display: 'inline-block',
                            }}
                          />
                          {tch.status === 'active'
                            ? (locale === 'ar' ? 'مفعل (له وصول)' : locale === 'en' ? 'Active (Access OK)' : 'Actif (Accès OK)')
                            : (locale === 'ar' ? 'معطل' : locale === 'en' ? 'Inactive' : 'Inactif')}
                        </span>
                      </td>

                      {/* Column 3: Diplomas & Degrees */}
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <GraduationCap size={15} color="#FA461D" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#3D1B0D', lineHeight: 1.4 }}>
                            {tch.qualifications_fr || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Specialties */}
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        {tch.specialties_fr ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {tch.specialties_fr.split(',').map((spec: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                style={{
                                  backgroundColor: '#FFF2EE',
                                  color: '#FA461D',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {spec.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#8C6F5A', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>

                      {/* Column 5: Assigned Courses */}
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        {tch.courses && tch.courses.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '300px' }}>
                            {displayedCourses.map((c: any) => {
                              const localizedTitle = getLocalizedCourseTitle(c, locale);
                              const localizedLevel = getLocalizedCourseLevel(c.level, locale);

                              return (
                                <div
                                  key={c.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: '#F0F9FF',
                                    border: '1px solid #BAE6FD',
                                    color: '#0369A1',
                                    padding: '0.25rem 0.55rem',
                                    borderRadius: '6px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    lineHeight: 1.3,
                                  }}
                                  title={`${localizedTitle} (${localizedLevel})`}
                                >
                                  <span>{c.flag_emoji || '🌐'}</span>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                                    {localizedTitle}
                                  </span>
                                  {c.level && (
                                    <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                                      • {c.level}
                                    </span>
                                  )}
                                </div>
                              );
                            })}

                            {hiddenCount > 0 && !isExpanded && (
                              <button
                                type="button"
                                onClick={() => toggleExpandCourses(tch.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0.1rem 0.4rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: '#FA461D',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  textAlign: 'left',
                                }}
                              >
                                <span>+{hiddenCount} {locale === 'ar' ? 'دورات أخرى' : locale === 'en' ? 'more courses' : 'autres formations'}</span>
                                <ChevronDown size={12} />
                              </button>
                            )}

                            {isExpanded && hiddenCount > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleExpandCourses(tch.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '0.1rem 0.4rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: '#8C6F5A',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                }}
                              >
                                <span>{locale === 'ar' ? 'طي القائمة' : locale === 'en' ? 'Show less' : 'Réduire'}</span>
                                <ChevronUp size={12} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#8C6F5A', fontStyle: 'italic' }}>
                            {locale === 'ar' ? 'لم يُعيّن لأي دورة بعد' : locale === 'en' ? 'No assigned courses' : 'Aucun cours assigné'}
                          </span>
                        )}
                      </td>

                      {/* Column 6: Activity & Statistics */}
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                          <span
                            style={{
                              backgroundColor: '#F8F5F1',
                              border: '1px solid #EADBCE',
                              color: '#3D1B0D',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            📅 {tch.sessions_count || 0} {locale === 'ar' ? 'حصص' : locale === 'en' ? 'sessions' : 'séances'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#8C6F5A', fontWeight: 600 }}>
                            👥 {tch.students_count || 0} {locale === 'ar' ? 'طالب' : locale === 'en' ? 'students' : 'élèves'}
                          </span>
                        </div>
                      </td>

                      {/* Column 7: Hourly Rate */}
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#FFFBEB',
                            color: '#92400E',
                            border: '1px solid #FDE68A',
                            borderRadius: '8px',
                            padding: '0.3rem 0.65rem',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tch.hourly_rate?.toLocaleString()} {t('price_dzd')}/h
                        </span>
                      </td>

                      {/* Column 8: Secretariat Actions */}
                      <td style={{ padding: '0.85rem 1.1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                                fontWeight: 800,
                                borderRadius: '8px',
                              }}
                              title={locale === 'ar' ? 'إرسال بيانات الدخول المعتمدة عبر واتساب' : locale === 'en' ? 'Send credentials via WhatsApp' : 'Envoyer identifiants via WhatsApp'}
                            >
                              <MessageCircle size={13} color="#25D366" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {/* Quick Copy Credentials button */}
                          <button
                            type="button"
                            onClick={() => copyCredentials(tch)}
                            className="btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem', borderRadius: '8px' }}
                            title={locale === 'ar' ? 'نسخ بيانات الدخول' : locale === 'en' ? 'Copy login details' : 'Copier identifiants'}
                          >
                            <Copy size={13} />
                          </button>

                          {/* Edit Profile & Password reset */}
                          <button
                            type="button"
                            onClick={() => openEditModal(tch)}
                            className="btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem', borderRadius: '8px', fontWeight: 800 }}
                          >
                            <Edit2 size={13} />
                            <span>{locale === 'ar' ? 'تعديل / كلمة السر' : locale === 'en' ? 'Manage' : 'Gérer'}</span>
                          </button>

                          {/* Deactivate Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(tch)}
                            className="btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem', color: '#DC2626', borderColor: '#FECACA', borderRadius: '8px' }}
                            title={locale === 'ar' ? 'تعطيل الحساب' : locale === 'en' ? 'Deactivate account' : 'Désactiver le compte'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Teacher */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', borderRadius: '18px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ backgroundColor: '#FFF9F4', borderBottom: '1px solid #EADBCE', padding: '1.25rem 1.6rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                  {editingTeacher
                    ? locale === 'ar' ? 'تعديل ملف وبيانات دخول الأستاذ' : locale === 'en' ? 'Edit Faculty Account & Assignments' : 'Modifier le compte enseignant'
                    : locale === 'ar' ? 'إنشاء حساب جديد للأستاذ' : locale === 'en' ? 'Create New Faculty Account' : 'Créer un compte enseignant'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#7A6258' }}>
                  {locale === 'ar' ? 'تعيين بيانات الدخول لإدارة حضور الطلاب والدروس المسندة' : locale === 'en' ? 'Set login credentials and course assignments for roll call and student tracking' : 'Définition des accès pour la gestion des présences et cours'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ color: '#8C6F5A', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                {error && (
                  <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.8rem 1rem', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '1.25rem', fontWeight: 700, border: '1px solid #FECACA' }}>
                    {error}
                  </div>
                )}

                {/* Section 1: Basic Identity */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>
                      {locale === 'ar' ? 'الاسم الكامل للأستاذ' : locale === 'en' ? 'Full Instructor Name' : 'Nom complet de l\'enseignant'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dr. Sarah Benali"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 800 }}>
                        {locale === 'ar' ? 'البريد الإلكتروني (لتسجيل الدخول)' : locale === 'en' ? 'Login Email' : 'Email de connexion'} *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="prof@fassi7.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 800 }}>
                        {locale === 'ar' ? 'رقم الهاتف (مع واتساب)' : locale === 'en' ? 'Phone Number (WhatsApp)' : 'Téléphone (WhatsApp)'}
                      </label>
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
                </div>

                {/* Section 2: Password with Generator */}
                <div className="form-group" style={{ background: '#FFF9F4', padding: '1rem', borderRadius: '12px', border: '1.5px solid #F3DFD1', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 900, color: '#3D1B0D' }}>
                      <Key size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                      {editingTeacher
                        ? locale === 'ar' ? 'تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : locale === 'en' ? 'New Password (leave empty to keep current)' : 'Nouveau mot de passe (laisser vide pour ne pas changer)'
                        : locale === 'ar' ? 'كلمة المرور للدخول' : locale === 'en' ? 'Login Password *' : 'Mot de passe de connexion *'}
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="btn-outline btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', gap: '0.25rem', backgroundColor: '#FFFFFF', fontWeight: 800, color: '#FA461D', borderColor: '#F2D5C8' }}
                    >
                      <Sparkles size={12} />
                      <span>{locale === 'ar' ? 'توليد كلمة سر آمنة' : locale === 'en' ? 'Generate' : 'Générer'}</span>
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
                      style={{ paddingInlineEnd: '42px', backgroundColor: '#FFFFFF' }}
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
                        color: '#8C6F5A',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#8C6F5A', display: 'block', marginTop: '0.3rem' }}>
                    {locale === 'ar'
                      ? 'سيستخدم الأستاذ هذا البريد وكلمة المرور لتسجيل الدخول إلى فضاء الأستاذ وتسجيل حضور طلابه.'
                      : locale === 'en'
                      ? 'The instructor will use these credentials to log in, conduct roll calls, and view session sheets.'
                      : 'L\'enseignant utilisera cet email et ce mot de passe pour se connecter et faire l\'appel de ses étudiants.'}
                  </span>
                </div>

                {/* Section 3: Status & Hourly Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>
                      {locale === 'ar' ? 'حالة الحساب' : locale === 'en' ? 'Account Status' : 'Statut du compte'}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="form-select"
                    >
                      <option value="active">{locale === 'ar' ? 'مفعل (يمكنه الدخول)' : locale === 'en' ? 'Active (Access Allowed)' : 'Actif (Accès autorisé)'}</option>
                      <option value="inactive">{locale === 'ar' ? 'معطل مؤقتاً' : locale === 'en' ? 'Inactive (Disabled)' : 'Inactif'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 800 }}>
                      {locale === 'ar' ? 'الأجر الساعي (دج)' : locale === 'en' ? 'Hourly Rate (DZD)' : 'Tarif horaire (DZD)'}
                    </label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Section 4: Assigned Courses */}
                <div className="form-group" style={{ background: '#F8FAFC', padding: '1.1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#1E293B' }}>
                      <BookOpen size={16} color="#FA461D" />
                      <span>{locale === 'ar' ? 'الدورات المسندة لهذا الأستاذ' : locale === 'en' ? 'Courses Assigned to this Instructor' : 'Formations enseignées par ce formateur'}</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>
                      {selectedCourseIds.length} {locale === 'ar' ? 'محددة' : locale === 'en' ? 'selected' : 'sélectionnées'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                    {locale === 'ar'
                      ? 'حدد الدورات التدريبية التي يشرف عليها هذا الأستاذ ليتمكن من متابعة طلابها وتسجيل الحضور:'
                      : locale === 'en'
                      ? 'Check the courses this teacher is responsible for so they can track students and conduct roll calls:'
                      : 'Cochez les cours que cet enseignant dispense afin qu\'il puisse gérer ses listes d\'élèves et faire l\'appel :'}
                  </p>

                  {/* Quick search course in modal */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder={locale === 'ar' ? 'تصفية الدورات...' : locale === 'en' ? 'Filter courses list...' : 'Filtrer la liste des cours...'}
                      value={modalCourseSearch}
                      onChange={(e) => setModalCourseSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                      }}
                    />
                  </div>
                  
                  {availableCourses.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {locale === 'ar' ? 'لا توجد دورات مسجلة' : locale === 'en' ? 'No courses available' : 'Aucun cours disponible'}
                    </span>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.2rem' }}>
                      {availableCourses
                        .filter((crs: any) => {
                          if (!modalCourseSearch) return true;
                          const t = (crs.title_fr || '') + (crs.title_ar || '') + (crs.title_en || '');
                          return t.toLowerCase().includes(modalCourseSearch.toLowerCase());
                        })
                        .map((crs: any) => {
                          const isChecked = selectedCourseIds.includes(crs.id);
                          const crsTitle = getLocalizedCourseTitle(crs, locale);

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
                                border: isChecked ? '1.5px solid #FA461D' : '1px solid #E2E8F0',
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
                                style={{ accentColor: '#FA461D', width: '15px', height: '15px' }}
                              />
                              <div style={{ lineHeight: 1.25 }}>
                                <span style={{ fontWeight: isChecked ? 900 : 700, color: isChecked ? '#FA461D' : '#1E293B', display: 'block' }}>
                                  {crs.flag_emoji || '🌐'} {crsTitle}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                  {crs.level}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Section 5: Qualifications & Specialties */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>
                    {locale === 'ar' ? 'المؤهلات والشهادات' : locale === 'en' ? 'Diplomas & Certifications' : 'Diplômes & Certifications'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Master Didactique des Langues, CELTA Cambridge"
                    value={qualificationsFr}
                    onChange={(e) => setQualificationsFr(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>
                    {locale === 'ar' ? 'التخصصات واللغات التدريسية' : locale === 'en' ? 'Specialties & Subjects' : 'Spécialités'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: IELTS Academic, TCF Canada, Conversation Avancée"
                    value={specialtiesFr}
                    onChange={(e) => setSpecialtiesFr(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 800 }}>
                    {locale === 'ar' ? 'نبذة تعريفية' : locale === 'en' ? 'Faculty Bio / Experience' : 'Biographie'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Expérience d'enseignement, méthodologie..."
                    value={bioFr}
                    onChange={(e) => setBioFr(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #EADBCE', backgroundColor: '#FFF9F4', padding: '1rem 1.6rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm" style={{ fontWeight: 900 }}>
                  {submitting
                    ? '...'
                    : (editingTeacher
                      ? (locale === 'ar' ? 'حفظ التعديلات' : locale === 'en' ? 'Save Changes' : t('action_save'))
                      : (locale === 'ar' ? 'إنشاء الحساب وتفعيله' : locale === 'en' ? 'Create & Activate Account' : 'Créer et activer le compte'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
