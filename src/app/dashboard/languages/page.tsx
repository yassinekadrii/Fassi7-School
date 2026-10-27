'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Plus, Edit2, Archive, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

export default function LanguagesManagePage() {
  const { t, locale } = useLanguage();
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLang, setEditingLang] = useState<any>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [flagEmoji, setFlagEmoji] = useState('🌐');
  const [descAr, setDescAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadLanguages = async () => {
    try {
      const res = await fetch('/api/languages');
      const data = await res.json();
      setLanguages(data.languages || []);
    } catch (err) {
      console.error('Error loading languages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const openAddModal = () => {
    setEditingLang(null);
    setCode('');
    setNameAr('');
    setNameFr('');
    setNameEn('');
    setSlug('');
    setFlagEmoji('🌐');
    setDescAr('');
    setDescFr('');
    setDescEn('');
    setDisplayOrder(languages.length + 1);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (lang: any) => {
    setEditingLang(lang);
    setCode(lang.code);
    setNameAr(lang.name_ar);
    setNameFr(lang.name_fr);
    setNameEn(lang.name_en || lang.name_fr);
    setSlug(lang.slug);
    setFlagEmoji(lang.flag_emoji || '🌐');
    setDescAr(lang.description_ar || '');
    setDescFr(lang.description_fr || '');
    setDescEn(lang.description_en || '');
    setDisplayOrder(lang.display_order || 0);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      id: editingLang ? editingLang.id : undefined,
      code,
      name_ar: nameAr,
      name_fr: nameFr,
      name_en: nameEn || nameFr,
      slug: slug || code.toLowerCase(),
      flag_emoji: flagEmoji,
      description_ar: descAr,
      description_fr: descFr,
      description_en: descEn,
      display_order: Number(displayOrder),
    };

    try {
      const res = await fetch('/api/languages', {
        method: editingLang ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        loadLanguages();
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (lang: any) => {
    try {
      await fetch('/api/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lang.id,
          is_published: lang.is_published ? 0 : 1,
        }),
      });
      loadLanguages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (lang: any) => {
    if (lang.course_count > 0) {
      if (!confirm(locale === 'ar' 
        ? `تنبيه: هذه اللغة مرتبطة بـ (${lang.course_count}) دورات نشطة. هل أنت متأكد من أرشفتها بأمان؟` 
        : `Attention: Cette langue a ${lang.course_count} cours associés. Confirmer l'archivage ?`)) {
        return;
      }
    } else {
      if (!confirm(locale === 'ar' ? 'هل أنت متأكد من أرشفة هذه اللغة؟' : 'Confirmer l\'archivage ?')) return;
    }

    try {
      await fetch('/api/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lang.id,
          is_archived: 1,
        }),
      });
      loadLanguages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--dark-brown)' }}>
            {t('menu_languages')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'إدارة لغات التدريس المعتمدة، نصوص الوصف، وحالة النشر'
              : 'Gestion des langues d\'enseignement, visibilité et descriptifs'}
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary btn-sm">
          <Plus size={16} />
          <span>{locale === 'ar' ? 'إضافة لغة جديدة' : 'Ajouter une langue'}</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'اللغة' : 'Langue'}</th>
                <th>{locale === 'ar' ? 'الرمز' : 'Code'}</th>
                <th>{locale === 'ar' ? 'الدورات المرتبطة' : 'Cours'}</th>
                <th>{locale === 'ar' ? 'الأساتذة' : 'Formateurs'}</th>
                <th>{locale === 'ar' ? 'حالة النشر' : 'Statut'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((lang) => (
                <tr key={lang.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>{lang.flag_emoji || '🌐'}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'var(--dark-brown)' }}>
                          {locale === 'ar' ? lang.name_ar : lang.name_fr}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {locale === 'ar' ? lang.name_fr : lang.name_ar}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {lang.code.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {lang.course_count} {locale === 'ar' ? 'دورات' : 'cours'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-dark">
                      {lang.teacher_count} {locale === 'ar' ? 'أساتذة' : 'profs'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleTogglePublish(lang)}
                      className={lang.is_published ? 'badge badge-success' : 'badge badge-danger'}
                      style={{ cursor: 'pointer' }}
                      title={locale === 'ar' ? 'انقر لتغيير حالة النشر' : 'Cliquer pour modifier la visibilité'}
                    >
                      {lang.is_published ? (
                        <>
                          <CheckCircle size={12} />
                          <span>{locale === 'ar' ? 'منشورة' : 'Publié'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          <span>{locale === 'ar' ? 'مسودة / مخفية' : 'Brouillon'}</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEditModal(lang)}
                        className="btn-outline btn-sm"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <Edit2 size={13} />
                        <span>{t('action_edit')}</span>
                      </button>
                      <button
                        onClick={() => handleArchive(lang)}
                        className="btn-outline btn-sm"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                      >
                        <Archive size={13} />
                        <span>{t('action_archive')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Language */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {editingLang
                  ? locale === 'ar' ? 'تعديل بيانات اللغة' : 'Modifier la langue'
                  : locale === 'ar' ? 'إضافة لغة تدريس جديدة' : 'Ajouter une langue'}
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
                    <label className="form-label">{locale === 'ar' ? 'الاسم بالعربية' : 'Nom en Arabe'} *</label>
                    <input
                      type="text"
                      required
                      placeholder="الإنجليزية"
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الاسم بالفرنسية' : 'Nom en Français'} *</label>
                    <input
                      type="text"
                      required
                      placeholder="Anglais"
                      value={nameFr}
                      onChange={(e) => setNameFr(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الرمز (2-3 أحرف)' : 'Code'} *</label>
                    <input
                      type="text"
                      required
                      placeholder="en"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'الرابط (Slug)' : 'Slug'} *</label>
                    <input
                      type="text"
                      required
                      placeholder="english"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'العلم (Emoji)' : 'Drapeau'}</label>
                    <input
                      type="text"
                      placeholder="🇬🇧"
                      value={flagEmoji}
                      onChange={(e) => setFlagEmoji(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">الوصف بالعربية</label>
                  <textarea
                    rows={2}
                    placeholder="مناهج تدريبية معتمدة وفق الإطار الأوروبي المشترك للغات..."
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الوصف بالإنجليزية' : locale === 'en' ? 'English Description' : 'Description en Anglais'}</label>
                  <textarea
                    rows={2}
                    placeholder="Certified curriculum aligned with the Common European Framework of Reference (CEFR)..."
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الوصف بالفرنسية' : 'Description en Français'}</label>
                  <textarea
                    rows={2}
                    placeholder="Programmes linguistiques d'excellence alignés sur les standards internationaux..."
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
