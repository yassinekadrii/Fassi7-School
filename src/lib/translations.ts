export type Locale = 'ar' | 'fr' | 'en';

export interface Translations {
  [key: string]: {
    ar: string;
    fr: string;
    en: string;
  };
}

export const translations: Translations = {
  // Brand & General
  academy_name: {
    ar: 'أكاديمية فصيح للغات',
    fr: 'Académie Fassi7 des Langues',
    en: 'Fassi7 Language Academy',
  },
  academy_tagline: {
    ar: 'من ملتي لينغو إلى فصيح: اسم جديد، هوية جديدة، ونفس الطموح لمرافقتك في رحلتك اللغوية',
    fr: 'De Multilinguo à Fassi7 : Un nouveau Nom, une nouvelle Identité, la même Ambition de vous accompagner',
    en: 'From Multilinguo to Fassi7: A new Name, a new Identity, the same Ambition to guide your linguistic journey',
  },
  hero_title: {
    ar: 'تحدث لغات العالم بثقة وطلاقة مع فصيح',
    fr: 'Parlez les langues du monde avec aisance et confiance',
    en: 'Speak the languages of the world with fluency and confidence',
  },
  hero_subtitle: {
    ar: 'منصة تعليم لغات رائدة تجمع نخبة من الأساتذة المعتمدين والمناهج التفاعلية المباشرة لتحقيق أهدافك الأكاديمية والمهنية والهجرة.',
    fr: 'Plateforme d\'apprentissage linguistique d\'excellence alliant formateurs certifiés et cours interactifs en direct pour vos projets académiques, professionnels et d\'expatriation.',
    en: 'A premier language learning academy bringing together certified expert instructors and live interactive classes to achieve your academic, career, and immigration goals.',
  },
  cta_explore_courses: {
    ar: 'استكشف الدورات المتاحة',
    fr: 'Découvrir nos formations',
    en: 'Explore Our Courses',
  },
  cta_register_now: {
    ar: 'سجل الآن في دورة',
    fr: 'S\'inscrire maintenant',
    en: 'Register Now',
  },
  cta_contact_us: {
    ar: 'تواصل مع مستشار تعليمي',
    fr: 'Contacter un conseiller',
    en: 'Contact an Academic Advisor',
  },
  whatsapp_chat: {
    ar: 'تواصل عبر واتساب',
    fr: 'Discuter sur WhatsApp',
    en: 'Chat on WhatsApp',
  },

  // Navigation
  nav_home: {
    ar: 'الرئيسية',
    fr: 'Accueil',
    en: 'Home',
  },
  nav_courses: {
    ar: 'الدورات والبرامج',
    fr: 'Formations & Cours',
    en: 'Courses & Programs',
  },
  nav_languages: {
    ar: 'اللغات المتاحة',
    fr: 'Langues Enseignées',
    en: 'Languages Taught',
  },
  nav_teachers: {
    ar: 'فريق الأساتذة',
    fr: 'Nos Enseignants',
    en: 'Our Instructors',
  },
  nav_about: {
    ar: 'عن فصيح وقصتنا',
    fr: 'À Propos de Fassi7',
    en: 'About Fassi7',
  },
  nav_contact: {
    ar: 'اتصل بنا',
    fr: 'Contact',
    en: 'Contact Us',
  },
  nav_portal: {
    ar: 'بوابة الدخول',
    fr: 'Espace Membre',
    en: 'Member Portal',
  },
  nav_dashboard: {
    ar: 'لوحة التحكم الإدارية',
    fr: 'Tableau de Bord Admin',
    en: 'Admin Dashboard',
  },
  nav_logout: {
    ar: 'تسجيل الخروج',
    fr: 'Déconnexion',
    en: 'Sign Out',
  },

  // Heritage banner
  heritage_badge: {
    ar: 'سابقاً أكاديمية Multilinguo',
    fr: 'Anciennement Multilinguo Academy',
    en: 'Formerly Multilinguo Academy',
  },
  heritage_text: {
    ar: 'نحن فخورون بمسيرتنا الناجحة وتخريج آلاف الطلاب تحت اسم Multilinguo، واليوم نواصل الرحلة مع هوية Fassi7 (فصيح) الأكثر تطوراً وحيوية.',
    fr: 'Fiers d\'avoir formé des milliers d\'apprenants sous le label Multilinguo, nous poursuivons notre mission d\'excellence sous la nouvelle identité vivante Fassi7.',
    en: 'Proud of having trained thousands of graduates under the Multilinguo label, we continue our journey of excellence under the vibrant new Fassi7 identity.',
  },

  // Stats
  stat_students: {
    ar: 'طالب وطالبة تخرجوا بنجاح',
    fr: 'Étudiants formés avec succès',
    en: 'Students successfully trained',
  },
  stat_languages: {
    ar: 'لغات عالمية معتمدة',
    fr: 'Langues internationales enseignées',
    en: 'World languages taught',
  },
  stat_success_rate: {
    ar: 'نسبة النجاح في امتحانات IELTS / TCF / Goethe',
    fr: 'Taux de réussite aux examens officiels',
    en: 'Official exam pass rate (IELTS / TCF / Goethe)',
  },
  stat_satisfaction: {
    ar: 'معدل رضا الطلاب وتقييم الجودة',
    fr: 'Taux de satisfaction des apprenants',
    en: 'Student satisfaction & quality score',
  },

  // Methodology
  methodology_title: {
    ar: 'لماذا يختار الطلاب أكاديمية فصيح؟',
    fr: 'Pourquoi choisir l\'Académie Fassi7 ?',
    en: 'Why Students Choose Fassi7 Academy?',
  },
  pillar1_title: {
    ar: 'مجموعات مصغرة وتفاعل حي',
    fr: 'Groupes réduits & Immersion active',
    en: 'Small Groups & Active Immersion',
  },
  pillar1_desc: {
    ar: 'لا تتجاوز الأفواج 10 إلى 12 طالباً لضمان أقصى وقت للمحادثة والمشاركة الفردية لكل طالب في كل حصة.',
    fr: 'Effectifs limités à 10-12 étudiants pour maximiser le temps de parole et l\'attention personnalisée.',
    en: 'Strictly limited to 10-12 learners per cohort to maximize speaking time and individualized support in every class.',
  },
  pillar2_title: {
    ar: 'أساتذة خبراء وشهادات دولية',
    fr: 'Formateurs certifiés & Experts',
    en: 'Certified Expert Instructors',
  },
  pillar2_desc: {
    ar: 'نخبة من المدربين الحاصلين على CELTA و DELF و Goethe وشهادات عليا في تعليم اللغات الأجنبية.',
    fr: 'Équipe pédagogique diplômée (CELTA, Master FLE, Heidelberg) avec une solide expérience internationale.',
    en: 'Accredited faculty holding CELTA, Master FLE, and Goethe certifications with proven international teaching expertise.',
  },
  pillar3_title: {
    ar: 'مرونة المواعيد وحصص مسجلة',
    fr: 'Flexibilité & Replays disponibles',
    en: 'Flexible Timetable & Class Recordings',
  },
  pillar3_desc: {
    ar: 'توقيت مسائي يناسب الموظفين والطلاب، مع روابط حصص سحابية وملخصات رقمية بعد كل جلسة.',
    fr: 'Horaires du soir et week-end adaptés aux professionnels, avec accès aux enregistrements et supports.',
    en: 'Evening and weekend sessions tailored for professionals, with unlimited access to cloud replays and course summaries.',
  },
  pillar4_title: {
    ar: 'شهادة إتمام معتمدة ومتابعة دقيقة',
    fr: 'Certificat de réussite & Suivi rigoureux',
    en: 'Accredited Certificate & Continuous Progress',
  },
  pillar4_desc: {
    ar: 'تقييم أسبوعي للتقدم واختبارات تجريبية مطابقة للامتحانات الرسمية وشهادة إتمام معتمدة.',
    fr: 'Évaluations continues, examens blancs conformes aux standards officiels et attestation certifiée.',
    en: 'Weekly skill checkpoints, real exam simulation mock tests, and verified CEFR completion certificates.',
  },

  // Course Catalog
  catalog_title: {
    ar: 'دليل الدورات والبرامج التعليمية',
    fr: 'Catalogue des Formations & Programmes',
    en: 'Course Catalog & Academic Programs',
  },
  filter_all_languages: {
    ar: 'كل اللغات',
    fr: 'Toutes les langues',
    en: 'All Languages',
  },
  filter_all_levels: {
    ar: 'جميع المستويات',
    fr: 'Tous les niveaux',
    en: 'All Levels',
  },
  filter_all_formats: {
    ar: 'جميع الصيغ',
    fr: 'Tous les formats',
    en: 'All Formats',
  },
  search_placeholder: {
    ar: 'ابحث عن اسم الدورة أو اللغة أو الهدف...',
    fr: 'Rechercher une formation, langue ou objectif...',
    en: 'Search by course name, language, or target...',
  },
  duration: {
    ar: 'المدة',
    fr: 'Durée',
    en: 'Duration',
  },
  hours: {
    ar: 'ساعة تدريبية',
    fr: 'heures de formation',
    en: 'training hours',
  },
  weeks: {
    ar: 'أسابيع',
    fr: 'semaines',
    en: 'weeks',
  },
  price_dzd: {
    ar: 'د.ج',
    fr: 'DZD',
    en: 'DZD',
  },
  enrolled: {
    ar: 'مسجل',
    fr: 'inscrits',
    en: 'enrolled',
  },
  places_left: {
    ar: 'أماكن متبقية',
    fr: 'places restantes',
    en: 'spots remaining',
  },
  enroll_btn: {
    ar: 'التسجيل في هذه الدورة',
    fr: 'S\'inscrire à ce cours',
    en: 'Enroll in Course',
  },
  course_details: {
    ar: 'تفاصيل البرنامج والمحتوى',
    fr: 'Détails du programme',
    en: 'Program Details',
  },

  // Dashboard Common
  dashboard_title: {
    ar: 'لوحة التحكم الإدارية — فصيح',
    fr: 'Tableau de Bord Administratif — Fassi7',
    en: 'Administration Dashboard — Fassi7',
  },
  dash_kpi_students: {
    ar: 'إجمالي الطلاب المسجلين',
    fr: 'Total Étudiants',
    en: 'Total Enrolled Students',
  },
  dash_kpi_inquiries: {
    ar: 'طلبات التسجيل الجديدة',
    fr: 'Nouvelles Inscriptions',
    en: 'New Registration Requests',
  },
  dash_kpi_courses: {
    ar: 'الدورات النشطة',
    fr: 'Formations Actives',
    en: 'Active Courses',
  },
  dash_kpi_teachers: {
    ar: 'هيئة التدريس',
    fr: 'Total Enseignants',
    en: 'Faculty Instructors',
  },
  dash_kpi_revenue: {
    ar: 'إجمالي الإيرادات المحصلة',
    fr: 'Revenus Encaissés',
    en: 'Total Revenue Collected',
  },
  dash_kpi_sessions: {
    ar: 'حصص الأسبوع القادمة',
    fr: 'Séances Planifiées',
    en: 'Upcoming Class Sessions',
  },
  dash_kpi_pending_pay: {
    ar: 'دفعات قيد المعالجة',
    fr: 'Paiements en Attente',
    en: 'Pending Payments',
  },

  // Dashboard Menu
  menu_overview: {
    ar: 'نظرة عامة',
    fr: 'Vue d\'ensemble',
    en: 'Overview',
  },
  menu_languages: {
    ar: 'إدارة اللغات',
    fr: 'Langues Enseignées',
    en: 'Teaching Languages',
  },
  menu_courses: {
    ar: 'إدارة الدورات',
    fr: 'Gestion des Cours',
    en: 'Course Management',
  },
  menu_teachers: {
    ar: 'إدارة الأساتذة',
    fr: 'Formateurs',
    en: 'Teachers & Faculty',
  },
  menu_students: {
    ar: 'إدارة الطلاب',
    fr: 'Étudiants',
    en: 'Students Directory',
  },
  menu_schedule: {
    ar: 'الجدول الزمني والحصص',
    fr: 'Emploi du Temps',
    en: 'Schedule & Timetable',
  },
  menu_enrollments: {
    ar: 'طلبات التسجيل',
    fr: 'Inscriptions',
    en: 'Enrollment Pipeline',
  },
  menu_payments: {
    ar: 'المالية والمدفوعات',
    fr: 'Paiements & Recettes',
    en: 'Finance & Payments',
  },
  menu_reports: {
    ar: 'التقارير والإحصائيات',
    fr: 'Rapports & Stats',
    en: 'Reports & Analytics',
  },
  menu_inquiries: {
    ar: 'استفسارات الزوار',
    fr: 'Demandes de Contact',
    en: 'Contact Inquiries',
  },
  menu_settings: {
    ar: 'إعدادات المنصة',
    fr: 'Paramètres',
    en: 'Platform Settings',
  },
  menu_staff: {
    ar: 'حسابات السكرتارية',
    fr: 'Comptes Secrétariat',
    en: 'Secretary Accounts',
  },

  // Actions
  action_add: {
    ar: 'إضافة جديد',
    fr: 'Ajouter',
    en: 'Add New',
  },
  action_edit: {
    ar: 'تعديل',
    fr: 'Modifier',
    en: 'Edit',
  },
  action_delete: {
    ar: 'حذف',
    fr: 'Supprimer',
    en: 'Delete',
  },
  action_archive: {
    ar: 'أرشفة',
    fr: 'Archiver',
    en: 'Archive',
  },
  action_save: {
    ar: 'حفظ التغييرات',
    fr: 'Enregistrer',
    en: 'Save Changes',
  },
  action_cancel: {
    ar: 'إلغاء',
    fr: 'Annuler',
    en: 'Cancel',
  },
  action_filter: {
    ar: 'تصفية',
    fr: 'Filtrer',
    en: 'Filter',
  },
  action_export_csv: {
    ar: 'تصدير CSV',
    fr: 'Exporter CSV',
    en: 'Export to CSV',
  },
  action_view_receipt: {
    ar: 'عرض الوصل',
    fr: 'Voir le Reçu',
    en: 'View Receipt',
  },
  action_print_receipt: {
    ar: 'طباعة الوصل الرسمي',
    fr: 'Imprimer le Reçu',
    en: 'Print Official Receipt',
  },

  // Statuses
  status_new: {
    ar: 'طلب جديد',
    fr: 'Nouveau',
    en: 'New',
  },
  status_under_review: {
    ar: 'قيد المراجعة',
    fr: 'En cours d\'examen',
    en: 'Under Review',
  },
  status_accepted: {
    ar: 'مقبول مبدئياً',
    fr: 'Accepté',
    en: 'Accepted',
  },
  status_awaiting_payment: {
    ar: 'في انتظار الدفع',
    fr: 'En attente de paiement',
    en: 'Awaiting Payment',
  },
  status_confirmed: {
    ar: 'مؤكد ونهائي',
    fr: 'Confirmé',
    en: 'Confirmed',
  },
  status_completed: {
    ar: 'مكتمل بنجاح',
    fr: 'Terminé',
    en: 'Completed',
  },
  status_cancelled: {
    ar: 'ملغى',
    fr: 'Annulé',
    en: 'Cancelled',
  },
  status_paid: {
    ar: 'مدفوع بالكامل',
    fr: 'Payé intégralement',
    en: 'Fully Paid',
  },
  status_partially_paid: {
    ar: 'مدفوع جزئياً',
    fr: 'Partiellement payé',
    en: 'Partially Paid',
  },
  status_pending: {
    ar: 'معلق',
    fr: 'En attente',
    en: 'Pending',
  },

  // Payment methods
  pay_baridimob: {
    ar: 'بريدي موب (BaridiMob)',
    fr: 'BaridiMob (Poste)',
    en: 'BaridiMob (Algeria Post)',
  },
  pay_ccp: {
    ar: 'حوالة بريدية (CCP)',
    fr: 'Virement CCP',
    en: 'CCP Post Transfer',
  },
  pay_bank: {
    ar: 'تحويل بنكي',
    fr: 'Virement Bancaire',
    en: 'Bank Wire Transfer',
  },
  pay_cash: {
    ar: 'نقداً بالمقر',
    fr: 'Espèces à l\'académie',
    en: 'Cash at Academy',
  },
  pay_card: {
    ar: 'بطاقة CIB / الذهبية',
    fr: 'Carte CIB / Edahabia',
    en: 'CIB / Edahabia Card',
  },

  // Forms
  form_full_name: {
    ar: 'الاسم واللقب الكامل',
    fr: 'Nom et Prénom',
    en: 'Full Name',
  },
  form_email: {
    ar: 'البريد الإلكتروني',
    fr: 'Adresse Email',
    en: 'Email Address',
  },
  form_phone: {
    ar: 'رقم الهاتف (واتساب)',
    fr: 'Numéro de téléphone (WhatsApp)',
    en: 'Phone Number (WhatsApp)',
  },
  form_select_course: {
    ar: 'اختر الدورة المطلوبة',
    fr: 'Sélectionnez la formation',
    en: 'Select Course',
  },
  form_preferred_time: {
    ar: 'التوقيت المفضل للحصص',
    fr: 'Créneau horaire souhaité',
    en: 'Preferred Schedule Slot',
  },
  form_message: {
    ar: 'ملاحظات أو أسئلة إضافية',
    fr: 'Message ou précisions',
    en: 'Message or Details',
  },
  form_submit_enrollment: {
    ar: 'تأكيد إرسال طلب التسجيل',
    fr: 'Confirmer ma demande d\'inscription',
    en: 'Submit Registration Request',
  },
  form_success_title: {
    ar: 'تم استلام طلبك بنجاح!',
    fr: 'Demande reçue avec succès !',
    en: 'Registration Request Received!',
  },
  form_success_desc: {
    ar: 'شكراً لاختيارك أكاديمية فصيح. سيتصل بك المستشار التعليمي عبر الهاتف أو الواتساب في غضون 24 ساعة لتأكيد المستوى وتفاصيل الدفع.',
    fr: 'Merci d\'avoir choisi Fassi7. Notre équipe vous contactera par téléphone ou WhatsApp sous 24h pour finaliser votre inscription.',
    en: 'Thank you for choosing Fassi7 Academy. Our academic advisor will contact you by phone or WhatsApp within 24 hours to confirm your placement and payment details.',
  },

  // Footer
  footer_about: {
    ar: 'فصيح (Multilinguo سابقاً) هي الأكاديمية الرائدة في الجزائر لتعليم اللغات الأجنبية والمحادثة والتحضير للامتحانات الدولية بأحدث الأساليب التفاعلية.',
    fr: 'Fassi7 (ex-Multilinguo) est l\'académie de référence en Algérie pour l\'apprentissage vivant des langues et la préparation aux certifications internationales.',
    en: 'Fassi7 (formerly Multilinguo) is Algeria\'s leading academy for live interactive language training and official certification preparation.',
  },
  footer_quick_links: {
    ar: 'روابط سريعة',
    fr: 'Liens Rapides',
    en: 'Quick Links',
  },
  footer_contact_info: {
    ar: 'معلومات التواصل والمقر',
    fr: 'Coordonnées & Siège',
    en: 'Contact & Headquarters',
  },
  footer_address: {
    ar: 'الجزائر العاصمة، الجزائر (خدمات حضورية وعبر الإنترنت)',
    fr: 'Alger, Algérie (Formations en ligne & en présentiel)',
    en: 'Algiers, Algeria (Online & in-person courses)',
  },
  footer_rights: {
    ar: 'جميع الحقوق محفوظة © 2026 أكاديمية فصيح للغات.',
    fr: 'Tous droits réservés © 2026 Académie Fassi7.',
    en: 'All rights reserved © 2026 Fassi7 Language Academy.',
  },
};

export function getTranslation(key: string, locale: Locale): string {
  if (translations[key] && translations[key][locale]) {
    return translations[key][locale];
  }
  // Fallback to English, then French, then key
  if (translations[key]?.en) return translations[key].en;
  if (translations[key]?.fr) return translations[key].fr;
  return key;
}
