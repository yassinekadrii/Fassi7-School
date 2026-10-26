import { Locale } from './translations';

export function getLocalizedCourseTitle(course: any, locale: Locale): string {
  if (!course) return '';
  if (locale === 'ar') return course.title_ar || course.title_fr || '';
  if (locale === 'en') return course.title_en || course.title_fr || '';
  return course.title_fr || course.title_ar || '';
}

export function getLocalizedCourseDesc(course: any, locale: Locale): string {
  if (!course) return '';
  if (locale === 'ar') return course.description_ar || course.description_fr || '';
  if (locale === 'en') return course.description_en || course.description_fr || '';
  return course.description_fr || course.description_ar || '';
}

export function getLocalizedCourseLevel(levelStr: string, locale: Locale): string {
  if (!levelStr) return '';
  if (locale === 'en') {
    return levelStr
      .replace(/Débutant Complet/gi, 'Complete Beginner')
      .replace(/Débutant/gi, 'Beginner')
      .replace(/Intermédiaire/gi, 'Intermediate')
      .replace(/Avancé/gi, 'Advanced')
      .replace(/Tous Niveaux/gi, 'All Levels');
  }
  if (locale === 'ar') {
    return levelStr
      .replace(/Débutant Complet/gi, 'مبتدئ تماماً')
      .replace(/Débutant/gi, 'مبتدئ')
      .replace(/Intermédiaire/gi, 'متوسط')
      .replace(/Avancé/gi, 'متقدم')
      .replace(/Tous Niveaux/gi, 'كافة المستويات');
  }
  return levelStr;
}

export function getLocalizedCourseFormat(format: string, locale: Locale): string {
  switch (format) {
    case 'group_online':
      return locale === 'ar'
        ? 'فوج تفاعلي عبر الإنترنت'
        : locale === 'en'
        ? 'Live Interactive Online Group'
        : 'Groupe interactif en ligne';
    case 'private_1on1':
      return locale === 'ar'
        ? 'تدريب فردي خاص (1-على-1)'
        : locale === 'en'
        ? '1-on-1 Private Mentorship'
        : 'Mentorat individuel (1-sur-1)';
    case 'intensive':
      return locale === 'ar'
        ? 'برنامج مكثف فائق السرعة'
        : locale === 'en'
        ? 'Intensive Immersion Track'
        : 'Formation intensive accélérée';
    case 'weekend':
      return locale === 'ar'
        ? 'فوج نهاية الأسبوع (الجمعة/السبت)'
        : locale === 'en'
        ? 'Weekend Executive Cohort'
        : 'Cohorte week-end';
    default:
      return format || '';
  }
}

export function getLocalizedLangName(lang: any, locale: Locale): string {
  if (!lang) return '';
  if (locale === 'ar') return lang.name_ar || lang.name_fr || '';
  if (locale === 'en') return lang.name_en || lang.name_fr || '';
  return lang.name_fr || lang.name_ar || '';
}

export function getLocalizedLangDesc(lang: any, locale: Locale): string {
  if (!lang) return '';
  if (locale === 'ar') return lang.description_ar || lang.description_fr || '';
  if (locale === 'en') return lang.description_en || lang.description_fr || '';
  return lang.description_fr || lang.description_ar || '';
}
