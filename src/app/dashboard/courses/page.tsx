'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { BookOpen, Plus, Edit2, Copy, Archive, CheckCircle, XCircle, Users, Clock, X, GraduationCap } from 'lucide-react';

export default function CoursesManagePage() {
  const { t, locale } = useLanguage();
  const [courses, setCourses] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Form fields
  const [languageId, setLanguageId] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [slug, setSlug] = useState('');
  const [level, setLevel] = useState('A1 Débutant');
  const [format, setFormat] = useState('group_online');
  const [price, setPrice] = useState(18000);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [hoursTotal, setHoursTotal] = useState(32);
  const [maxCapacity, setMaxCapacity] = useState(12);
  const [descAr, setDescAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [cRes, lRes, tRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/languages'),
        fetch('/api/teachers'),
      ]);
      const cData = await cRes.json();
      const lData = await lRes.json();
      const tData = await tRes.json();

      setCourses(cData.courses || []);
      setLanguages(lData.languages || []);
      setTeachers(tData.teachers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingCourse(null);
    setLanguageId(languages[0]?.id || '');
    setTitleAr('');
    setTitleFr('');
    setSlug('');
    setLevel('A1 Débutant');
    setFormat('group_online');
    setPrice(18000);
    setDurationWeeks(8);
    setHoursTotal(32);
    setMaxCapacity(12);
    setDescAr('');
    setDescFr('');
    setSelectedTeachers([]);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setLanguageId(course.language_id);
    setTitleAr(course.title_ar);
    setTitleFr(course.title_fr);
    setSlug(course.slug);
    setLevel(course.level);
    setFormat(course.format);
    setPrice(course.price);
    setDurationWeeks(course.duration_weeks);
    setHoursTotal(course.hours_total);
    setMaxCapacity(course.max_capacity);
    setDescAr(course.description_ar || '');
    setDescFr(course.description_fr || '');
    setSelectedTeachers(course.teachers ? course.teachers.map((t: any) => t.id) : []);
    setError('');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (courseId: number) => {
    if (!confirm(locale === 'ar' ? 'هل تريد استنساخ هذه الدورة لإنشاء فوج جديد سريعاً؟' : 'Dupliquer ce cours pour créer une nouvelle session ?')) {
      return;
    }

    try {
      const res = await fetch('/api/courses/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Duplicate failed', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      id: editingCourse ? editingCourse.id : undefined,
      language_id: Number(languageId),
      title_ar: titleAr,
      title_fr: titleFr,
      slug: slug || titleFr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      level,
      format,
      price: Number(price),
      duration_weeks: Number(durationWeeks),
      hours_total: Number(hoursTotal),
      max_capacity: Number(maxCapacity),
      description_ar: descAr,
      description_fr: descFr,
      teacher_ids: selectedTeachers,
    };

    try {
      const res = await fetch('/api/courses', {
        method: editingCourse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_courses')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'إدارة البرامج التدريبية، الأسعار، تعيين الأساتذة واستنساخ الأفواج'
              : 'Gestion des formations, tarification, formateurs et duplication'}
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary btn-sm">
          <Plus size={16} />
          <span>{locale === 'ar' ? 'إضافة دورة جديدة' : 'Nouveau cours'}</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الدورة واللغة' : 'Formation & Langue'}</th>
                <th>{locale === 'ar' ? 'المستوى والصيغة' : 'Niveau & Format'}</th>
                <th>{locale === 'ar' ? 'الرسوم' : 'Tarif'}</th>
                <th>{locale === 'ar' ? 'الأستاذ المشرف' : 'Enseignant responsable'}</th>
                <th>{locale === 'ar' ? 'التسجيلات' : 'Inscrits'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span>{course.flag_emoji}</span>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                          {course.language_name_fr}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                        {locale === 'ar' ? course.title_ar : course.title_fr}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {course.duration_weeks} sem • {course.hours_total}h
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-secondary" style={{ display: 'inline-block', marginBottom: '0.3rem' }}>
                      {course.level}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {course.format}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
                      {course.price?.toLocaleString()} {t('price_dzd')}
                    </span>
                  </td>
                  <td>
                    {course.teachers && course.teachers.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {course.teachers.map((tch: any) => (
                          <div
                            key={tch.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#065F46',
                              padding: '0.25rem 0.6rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <GraduationCap size={13} color="#059669" />
                            <span>{tch.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="badge badge-secondary" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {locale === 'ar' ? 'غير معين' : 'Non assigné'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-dark">
                      <Users size={12} />
                      {course.enrolled_count || 0} / {course.max_capacity}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => openEditModal(course)}
                        className="btn-outline btn-sm"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        title={t('action_edit')}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(course.id)}
                        className="btn-outline btn-sm"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--primary)' }}
                        title={locale === 'ar' ? 'استنساخ الدورة' : 'Dupliquer le cours'}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Course */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {editingCourse
                  ? locale === 'ar' ? 'تعديل بيانات الدورة' : 'Modifier la formation'
                  : locale === 'ar' ? 'إضافة دورة تدريبية جديدة' : 'Créer une formation'}
              </h3>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'لغة التدريس' : 'Langue'} *</label>
                    <select
                      value={languageId}
                      onChange={(e) => setLanguageId(e.target.value)}
                      className="form-select"
                      required
                    >
                      {languages.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.flag_emoji} {l.name_fr} ({l.name_ar})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'المستوى' : 'Niveau'} *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: A2 - B1 Intermédiaire"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'العنوان بالعربية' : 'Titre en Arabe'} *</label>
                    <input
                      type="text"
                      required
                      placeholder="دورة الإنجليزية للمحادثة"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'العنوان بالفرنسية' : 'Titre en Français'} *</label>
                    <input
                      type="text"
                      required
                      placeholder="Anglais Conversation Fluide"
                      value={titleFr}
                      onChange={(e) => setTitleFr(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'السعر (دج)' : 'Prix (DZD)'} *</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'المدة (أسابيع)' : 'Durée (sem)'}</label>
                    <input
                      type="number"
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الساعات' : 'Heures'}</label>
                    <input
                      type="number"
                      value={hoursTotal}
                      onChange={(e) => setHoursTotal(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'السعة' : 'Capacité'}</label>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Assign Teacher */}
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'تعيين أستاذ مشرف' : 'Assigner un Formateur'}</label>
                  <select
                    value={selectedTeachers[0] || ''}
                    onChange={(e) => setSelectedTeachers(e.target.value ? [Number(e.target.value)] : [])}
                    className="form-select"
                  >
                    <option value="">{locale === 'ar' ? '-- بدون تعيين --' : '-- Aucun --'}</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.qualifications_fr})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الوصف بالعربية' : 'Description en Arabe'}</label>
                  <textarea
                    rows={2}
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الوصف بالفرنسية' : 'Description en Français'}</label>
                  <textarea
                    rows={2}
                    value={descFr}
                    onChange={(e) => setDescFr(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline btn-sm">
                  {t('action_cancel')}
                </button>
                <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? '...' : t('action_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
