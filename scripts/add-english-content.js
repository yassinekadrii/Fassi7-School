const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'fassi7.db');
const db = new Database(dbPath);

console.log('--- Migrating Database for Trilingual English Content ---');

// 1. Add description_en to teaching_languages if it does not exist
try {
  db.exec('ALTER TABLE teaching_languages ADD COLUMN description_en TEXT');
  console.log('Added description_en to teaching_languages');
} catch (e) {
  if (!e.message.includes('duplicate column')) {
    console.log('Note on teaching_languages:', e.message);
  }
}

// 2. Add columns to courses if they do not exist
const courseCols = [
  'title_en TEXT',
  'description_en TEXT',
  'prerequisites_en TEXT',
  'objectives_en TEXT',
  'schedule_info_en TEXT',
];

for (const col of courseCols) {
  try {
    db.exec(`ALTER TABLE courses ADD COLUMN ${col}`);
    console.log(`Added ${col} to courses`);
  } catch (e) {
    if (!e.message.includes('duplicate column')) {
      console.log(`Note on courses (${col}):`, e.message);
    }
  }
}

// 3. Update Languages English Content
const languagesData = [
  {
    code: 'en',
    description_en: 'Master English for international business, daily global communication, and comprehensive IELTS/TOEFL preparation with expert instructors.',
  },
  {
    code: 'fr',
    description_en: 'Master spoken and written French with fluency, prepare for official TCF / DELF certifications, and sharpen your professional communication.',
  },
  {
    code: 'de',
    description_en: 'Specialized programs for university studies and immigration to Germany, with complete Goethe-Zertifikat preparation from A1 to B2.',
  },
  {
    code: 'es',
    description_en: 'Discover the richness of the Spanish language and Hispanic culture through dynamic, conversation-driven immersion courses.',
  },
  {
    code: 'tr',
    description_en: 'Learn practical Turkish for study, travel, and business in Turkey with a modern, simplified step-by-step methodology.',
  },
  {
    code: 'it',
    description_en: 'Engaging Italian courses for students, professionals, and culture enthusiasts aiming for European CEFR fluency.',
  },
  {
    code: 'ar',
    description_en: 'Comprehensive Modern Standard Arabic and expressive communication for non-native speakers and international scholars.',
  },
];

const updateLangStmt = db.prepare(`
  UPDATE teaching_languages 
  SET description_en = ?
  WHERE code = ?
`);

for (const lang of languagesData) {
  updateLangStmt.run(lang.description_en, lang.code);
}
console.log('Updated all teaching languages with English descriptions.');

// 4. Update Courses English Content
const coursesData = [
  {
    slug: 'general-english-a2-b1',
    title_en: 'General English & Conversational Fluency (A2 - B1)',
    description_en: 'Interactive online course focused on building speaking confidence, expanding vocabulary, and acquiring natural everyday fluency in social and professional contexts.',
    prerequisites_en: 'Beginner A1 level or Fassi7 online placement evaluation',
    objectives_en: 'Speak fluently without hesitation, comprehend fast-paced conversations, and master essential grammar with accurate pronunciation.',
    schedule_info_en: 'Saturday & Tuesday 18:30 - 20:30 (Algiers Time)',
  },
  {
    slug: 'ielts-academic-mastery',
    title_en: 'Intensive IELTS Academic Preparation (Band 7+)',
    description_en: 'High-intensity strategic preparation covering all 4 exam components: Listening, Reading, Academic Writing Tasks 1 & 2, and Speaking, with weekly mock exams and personalized feedback.',
    prerequisites_en: 'Minimum B2 intermediate level in English',
    objectives_en: 'Target a 7.0+ overall score, master academic essay structures, and acquire elite exam time-management strategies.',
    schedule_info_en: 'Monday & Wednesday 19:00 - 21:00',
  },
  {
    slug: 'tcf-canada-express',
    title_en: 'Comprehensive TCF Canada & Quebec Preparation',
    description_en: 'Specialized training for candidates immigrating or working in Canada, specifically targeting NCLC 7+ scores across all oral and written exam sections.',
    prerequisites_en: 'Intermediate B1 level in French',
    objectives_en: 'Attain NCLC 7+ (B2/C1), successfully pass the 3 oral tasks, and master the 3 written tasks with top scores.',
    schedule_info_en: 'Sunday & Thursday 18:00 - 20:00',
  },
  {
    slug: 'allemand-debutant-a1',
    title_en: 'Complete Beginner German A1 (Goethe-Zertifikat)',
    description_en: 'Start German from zero with modern interactive pedagogy, audio training, and communicative exercises designed for student visas and family reunification.',
    prerequisites_en: 'No prior knowledge of German required',
    objectives_en: 'Introduce yourself, ask for directions, manage everyday conversations, and pass the Goethe-Institut A1 exam with high marks.',
    schedule_info_en: 'Monday & Thursday 18:30 - 20:30',
  },
  {
    slug: 'espagnol-immersion-a1-a2',
    title_en: 'Beginner Spanish & Conversational Immersion (A1 - A2)',
    description_en: 'A vibrant, interactive journey to master Spanish grammar fundamentals, authentic pronunciation, and active conversation for travel, work, and DELE certification.',
    prerequisites_en: 'Open to all beginners with zero background',
    objectives_en: 'Communicate smoothly in everyday situations, conjugate common verbs effortlessly, and prepare for the DELE A2 certification.',
    schedule_info_en: 'Wednesday & Friday 16:30 - 18:30',
  },
  {
    slug: 'turc-interactif-a1',
    title_en: 'Interactive Turkish A1 for Studies & Business',
    description_en: 'Master foundational Turkish for travel, university studies, and commerce in Turkey with communicative exercises and cultural context.',
    prerequisites_en: 'No prerequisites required',
    objectives_en: 'Handle day-to-day interactions, greetings, market negotiation, and daily social conversation in Turkey.',
    schedule_info_en: 'Tuesday & Saturday 17:00 - 19:00',
  },
];

const updateCourseStmt = db.prepare(`
  UPDATE courses
  SET title_en = ?,
      description_en = ?,
      prerequisites_en = ?,
      objectives_en = ?,
      schedule_info_en = ?
  WHERE slug = ?
`);

for (const c of coursesData) {
  const res = updateCourseStmt.run(
    c.title_en,
    c.description_en,
    c.prerequisites_en,
    c.objectives_en,
    c.schedule_info_en,
    c.slug
  );
  console.log(`Updated course [${c.slug}]: ${res.changes} row(s) updated.`);
}

console.log('\n--- Verification ---');
const verLang = db.prepare('SELECT code, name_en, description_en FROM teaching_languages').all();
console.log('Languages with English descriptions:');
console.table(verLang);

const verCourses = db.prepare("SELECT id, slug, title_en, SUBSTR(description_en, 1, 40) as desc_sample FROM courses").all();
console.log('\nCourses with English titles:');
console.table(verCourses);

console.log('--- Migration Completed Successfully ---');
