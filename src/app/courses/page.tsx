'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CourseCard } from '@/components/CourseCard';
import { EnrollmentModal } from '@/components/EnrollmentModal';
import { useLanguage } from '@/context/LanguageContext';
import { Search, Filter, BookOpen, Sparkles } from 'lucide-react';

export default function CoursesPage() {
  const { t, locale } = useLanguage();
  const [courses, setCourses] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, lRes] = await Promise.all([
          fetch('/api/courses?published_only=true'),
          fetch('/api/languages?published_only=true'),
        ]);
        const cData = await cRes.json();
        const lData = await lRes.json();
        setCourses(cData.courses || []);
        setLanguages(lData.languages || []);
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleEnroll = (course: any) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const filteredCourses = courses.filter((c) => {
    if (selectedLanguage !== 'all' && String(c.language_id) !== selectedLanguage) return false;
    if (selectedLevel !== 'all' && !c.level.toLowerCase().includes(selectedLevel.toLowerCase())) return false;
    if (selectedFormat !== 'all' && c.format !== selectedFormat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAr = c.title_ar?.toLowerCase().includes(q) || c.description_ar?.toLowerCase().includes(q);
      const matchFr = c.title_fr?.toLowerCase().includes(q) || c.description_fr?.toLowerCase().includes(q);
      const matchEn = c.title_en?.toLowerCase().includes(q) || c.description_en?.toLowerCase().includes(q);
      if (!matchAr && !matchFr && !matchEn) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Header Banner */}
      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>
            <BookOpen size={15} />
            {t('nav_courses')}
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '1rem' }}>
            {t('catalog_title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>
            {locale === 'ar'
              ? 'تصفح باقة برامجنا في اللغات الأجنبية واختر المستوى والصيغة الأنسب لجدولك الزمني وأهدافك.'
              : locale === 'en'
              ? 'Browse our complete catalog of modern language programs and find the level and schedule tailored to your goals.'
              : 'Explorez notre sélection de formations en langues vivantes avec des formateurs certifiés.'}
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section style={{ backgroundColor: 'var(--bg-warm)', padding: '2.5rem 0', flex: 1 }}>
        <div className="container">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border)',
              padding: '1.5rem',
              marginBottom: '2.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              {/* Search input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingInlineStart: '2.4rem' }}
                />
                <Search
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.85rem' }}
                />
              </div>

              {/* Language filter */}
              <div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="form-select"
                >
                  <option value="all">{t('filter_all_languages')}</option>
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.flag_emoji} {locale === 'ar' ? l.name_ar : locale === 'en' ? (l.name_en || l.name_fr) : l.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level filter */}
              <div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="form-select"
                >
                  <option value="all">{t('filter_all_levels')}</option>
                  <option value="A1">A1 Beginner / Débutant</option>
                  <option value="A2">A2 Elementary / Faux-débutant</option>
                  <option value="B1">B1 Intermediate / Intermédiaire</option>
                  <option value="B2">B2 Upper Intermediate / Avancé</option>
                  <option value="C1">C1 - C2 Advanced / Expert</option>
                  <option value="IELTS">IELTS Prep</option>
                  <option value="TCF">TCF Canada</option>
                </select>
              </div>

              {/* Format filter */}
              <div>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="form-select"
                >
                  <option value="all">{t('filter_all_formats')}</option>
                  <option value="group_online">
                    {locale === 'ar' ? 'فوج عبر الإنترنت (مباشر)' : locale === 'en' ? 'Live Online Cohort' : 'Groupe en ligne direct'}
                  </option>
                  <option value="private_1on1">
                    {locale === 'ar' ? 'تدريب فردي خاص (1-on-1)' : locale === 'en' ? '1-on-1 Private Tutoring' : 'Coaching individuel'}
                  </option>
                  <option value="intensive">
                    {locale === 'ar' ? 'برنامج مكثف' : locale === 'en' ? 'Intensive Bootcamp' : 'Programme intensif'}
                  </option>
                  <option value="weekend">
                    {locale === 'ar' ? 'حصص نهاية الأسبوع' : locale === 'en' ? 'Weekend Sessions' : 'Cours de week-end'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count & Grid */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-brown)' }}>
              {filteredCourses.length} {locale === 'ar' ? 'دورة متوفرة' : locale === 'en' ? 'courses available' : 'formations trouvées'}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              {locale === 'ar' ? 'جاري تحميل الدورات...' : locale === 'en' ? 'Loading courses...' : 'Chargement des cours...'}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '4rem 2rem',
                textAlign: 'center',
                border: '1.5px dashed var(--border)',
              }}
            >
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                {locale === 'ar' ? 'لم يتم العثور على دورات تطابق معايير البحث' : locale === 'en' ? 'No courses match your filter criteria' : 'Aucune formation ne correspond à vos filtres'}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {locale === 'ar' ? 'جرب تغيير اللغة أو المستوى، أو تواصل معنا لبرمجة فوج خاص.' : locale === 'en' ? 'Try adjusting your filters or contact us to arrange a custom schedule.' : 'Essayez d\'ajuster vos filtres ou contactez notre équipe.'}
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedLanguage('all');
                  setSelectedLevel('all');
                  setSelectedFormat('all');
                }}
                className="btn-outline btn-sm"
              >
                {locale === 'ar' ? 'إعادة ضبط عوامل التصفية' : locale === 'en' ? 'Reset Filters' : 'Réinitialiser les filtres'}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
              }}
            >
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} onEnroll={handleEnroll} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      <EnrollmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        coursesList={courses}
      />
    </div>
  );
}
