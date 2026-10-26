'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { GraduationCap, Plus, Edit2, BookOpen, Clock, X, Phone, Mail } from 'lucide-react';

export default function TeachersManagePage() {
  const { t, locale } = useLanguage();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualificationsFr, setQualificationsFr] = useState('');
  const [specialtiesFr, setSpecialtiesFr] = useState('');
  const [bioFr, setBioFr] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [hourlyRate, setHourlyRate] = useState(2500);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const openAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setEmail('');
    setPhone('');
    setQualificationsFr('Certifié CELTA Cambridge');
    setSpecialtiesFr('IELTS, Conversation, Business');
    setBioFr('');
    setLanguagesSpoken('Anglais, Français, Arabe');
    setHourlyRate(2500);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tch: any) => {
    setEditingTeacher(tch);
    setName(tch.name);
    setEmail(tch.email);
    setPhone(tch.phone || '');
    setQualificationsFr(tch.qualifications_fr || '');
    setSpecialtiesFr(tch.specialties_fr || '');
    setBioFr(tch.bio_fr || '');
    setLanguagesSpoken(tch.languages_spoken || '');
    setHourlyRate(tch.hourly_rate || 2500);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      id: editingTeacher ? editingTeacher.id : undefined,
      name,
      email,
      phone,
      qualifications_fr: qualificationsFr,
      qualifications_ar: qualificationsFr,
      specialties_fr: specialtiesFr,
      specialties_ar: specialtiesFr,
      bio_fr: bioFr,
      bio_ar: bioFr,
      languages_spoken: languagesSpoken,
      hourly_rate: Number(hourlyRate),
    };

    try {
      const res = await fetch('/api/teachers', {
        method: editingTeacher ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        loadTeachers();
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
            {t('menu_teachers')}
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {locale === 'ar'
              ? 'إدارة هيئة التدريس، المؤهلات الأكاديمية، والتخصصات'
              : 'Gestion des formateurs, certifications et assignations'}
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary btn-sm">
          <Plus size={16} />
          <span>{locale === 'ar' ? 'إضافة أستاذ جديد' : 'Nouveau formateur'}</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'الأستاذ' : 'Formateur'}</th>
                <th>{locale === 'ar' ? 'المؤهلات' : 'Diplômes'}</th>
                <th>{locale === 'ar' ? 'التخصصات' : 'Spécialités'}</th>
                <th>{locale === 'ar' ? 'الدورات المسندة' : 'Cours assignés'}</th>
                <th>{locale === 'ar' ? 'الأجر الساعي' : 'Tarif horaire'}</th>
                <th style={{ textAlign: 'center' }}>{locale === 'ar' ? 'تعديل' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((tch) => (
                <tr key={tch.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                        }}
                      >
                        {tch.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: 'var(--dark-brown)' }}>
                          {tch.name}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tch.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tch.qualifications_fr}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {tch.specialties_fr}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {tch.courses?.length || 0} {locale === 'ar' ? 'دورات' : 'cours'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                      {tch.hourly_rate?.toLocaleString()} {t('price_dzd')}/h
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => openEditModal(tch)}
                      className="btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                    >
                      <Edit2 size={13} />
                    </button>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                {editingTeacher
                  ? locale === 'ar' ? 'تعديل ملف الأستاذ' : 'Modifier le formateur'
                  : locale === 'ar' ? 'إضافة أستاذ جديد' : 'Créer un formateur'}
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

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الاسم واللقب' : 'Nom complet'} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('form_email')} *</label>
                    <input
                      type="email"
                      required
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'المؤهلات والشهادات' : 'Diplômes & Certifications'}</label>
                  <input
                    type="text"
                    value={qualificationsFr}
                    onChange={(e) => setQualificationsFr(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{locale === 'ar' ? 'التخصصات التدريبية' : 'Spécialités'}</label>
                    <input
                      type="text"
                      value={specialtiesFr}
                      onChange={(e) => setSpecialtiesFr(e.target.value)}
                      className="form-input"
                    />
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

                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'نبذة تعريفية' : 'Biographie'}</label>
                  <textarea
                    rows={2}
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
