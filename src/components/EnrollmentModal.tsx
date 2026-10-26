'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { X, CheckCircle2, Send, Clock, DollarSign, BookOpen } from 'lucide-react';
import { getLocalizedCourseTitle, getLocalizedCourseLevel } from '@/lib/courseHelpers';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: {
    id: number;
    title_ar: string;
    title_fr: string;
    title_en?: string;
    price: number;
    duration_weeks: number;
    hours_total: number;
    language_name_fr?: string;
    language_name_ar?: string;
    language_name_en?: string;
  } | null;
  coursesList?: any[];
}

const EMPTY_COURSES: any[] = [];

export function EnrollmentModal({ isOpen, onClose, course, coursesList = EMPTY_COURSES }: EnrollmentModalProps) {
  const { t, locale } = useLanguage();
  const [fetchedCourses, setFetchedCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(course ? course.id : (coursesList[0]?.id || 1));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredSchedule, setPreferredSchedule] = useState('soir');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (course) {
      setSelectedCourseId(course.id);
      return;
    }

    if (coursesList.length > 0) {
      setSelectedCourseId(coursesList[0].id);
      return;
    }

    if (fetchedCourses.length === 0) {
      fetch('/api/courses?published_only=true')
        .then((res) => res.json())
        .then((data) => {
          const list = data.courses || (Array.isArray(data) ? data : []);
          if (list.length > 0) {
            setFetchedCourses(list);
            setSelectedCourseId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, course?.id, coursesList.length, fetchedCourses.length]);

  if (!isOpen) return null;

  const allCourses = coursesList.length > 0 ? coursesList : fetchedCourses;
  const currentCourse = course || allCourses.find((c) => c.id === Number(selectedCourseId)) || allCourses[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          course_id: currentCourse ? currentCourse.id : selectedCourseId,
          preferred_schedule: preferredSchedule,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{t('cta_register_now')}</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {locale === 'ar' ? 'سجل في خطوة واحدة وسيتواصل معك مستشارنا' : locale === 'en' ? 'Register in one simple step and our team will contact you' : 'Inscription en 1 étape simple'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {success ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--dark-brown)', marginBottom: '0.75rem' }}>
                {t('form_success_title')}
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '2rem' }}>
                {t('form_success_desc')}
              </p>
              <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>
                {locale === 'ar' ? 'حسناً، تم' : locale === 'en' ? 'Done, Close' : 'Fermer'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    backgroundColor: 'var(--danger-light)',
                    color: 'var(--danger)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    marginBottom: '1.25rem',
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Course selection if standalone or summary if pre-selected */}
              {!course && allCourses.length > 0 ? (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">
                    {locale === 'ar' ? 'اختر الدورة أو البرنامج التدريبي' : locale === 'en' ? 'Select Course or Program' : 'Choisir la formation'} *
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                    className="form-select"
                  >
                    {allCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag_emoji || '🌐'} {getLocalizedCourseTitle(c, locale)} ({getLocalizedCourseLevel(c.level, locale)}) — {c.price?.toLocaleString()} {t('price_dzd')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : currentCourse ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-warm)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.1rem 1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
                        {locale === 'ar'
                          ? currentCourse.language_name_ar
                          : locale === 'en'
                          ? currentCourse.language_name_en || currentCourse.language_name_fr
                          : currentCourse.language_name_fr}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', margin: '0.3rem 0' }}>
                        {getLocalizedCourseTitle(currentCourse, locale)}
                      </h4>
                    </div>
                    <div style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {currentCourse.price?.toLocaleString()} {t('price_dzd')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">{t('form_full_name')} *</label>
                <input
                  type="text"
                  required
                  placeholder={locale === 'ar' ? 'مثال: محمد بوعمامة' : locale === 'en' ? 'e.g., Jane Smith' : 'Ex: Karim Meziane'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('form_email')} *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('form_phone')} *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="+213 550 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Schedule Preference */}
              <div className="form-group">
                <label className="form-label">{t('form_preferred_time')}</label>
                <select
                  value={preferredSchedule}
                  onChange={(e) => setPreferredSchedule(e.target.value)}
                  className="form-select"
                >
                  <option value="soir">{locale === 'ar' ? 'المساء (18:30 - 20:30)' : locale === 'en' ? 'Evening (18:30 - 20:30)' : 'Soir (18h30 - 20h30)'}</option>
                  <option value="weekend">{locale === 'ar' ? 'عطلة نهاية الأسبوع (الجمعة / السبت)' : locale === 'en' ? 'Weekend (Friday / Saturday)' : 'Week-end (Vendredi / Samedi)'}</option>
                  <option value="matin">{locale === 'ar' ? 'الفترة الصباحية (10:00 - 12:00)' : locale === 'en' ? 'Morning (10:00 - 12:00)' : 'Matinée (10h00 - 12h00)'}</option>
                  <option value="flexible">{locale === 'ar' ? 'مرن / غير محدد' : locale === 'en' ? 'Flexible schedule' : 'Horaires flexibles'}</option>
                </select>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">{t('form_message')}</label>
                <textarea
                  placeholder={locale === 'ar' ? 'أخبرنا عن مستواك الحالي أو أي استفسار...' : locale === 'en' ? 'Tell us about your current level or any question...' : 'Précisez votre niveau actuel ou vos questions...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                >
                  <Send size={18} />
                  <span>{loading ? '...' : t('form_submit_enrollment')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
