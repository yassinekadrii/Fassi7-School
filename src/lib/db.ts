import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let dbInstance: Database.Database | null = null;

function getDatabasePath(): string {
  // Check if running on Vercel or AWS Lambda serverless read-only environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join('/tmp', 'fassi7.db');
    if (!fs.existsSync(tmpDbPath)) {
      const bundledPath = path.join(process.cwd(), 'fassi7.db');
      if (fs.existsSync(bundledPath)) {
        try {
          fs.copyFileSync(bundledPath, tmpDbPath);
          console.log(`Copied bundled database to ${tmpDbPath}`);
        } catch (err) {
          console.warn('Could not copy bundled database:', err);
        }
      }
    }
    return tmpDbPath;
  }

  return path.join(process.cwd(), 'fassi7.db');
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new Database(dbPath);
    try {
      dbInstance.pragma('journal_mode = WAL');
    } catch (_) {
      try {
        dbInstance.pragma('journal_mode = DELETE');
      } catch (__) {}
    }
    dbInstance.pragma('foreign_keys = ON');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: Database.Database) {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('super_admin', 'academy_admin', 'teacher', 'student')) NOT NULL DEFAULT 'student',
      phone TEXT,
      avatar TEXT,
      status TEXT CHECK(status IN ('active', 'inactive', 'suspended')) NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Teaching Languages
  db.exec(`
    CREATE TABLE IF NOT EXISTS teaching_languages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name_ar TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      name_en TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description_ar TEXT,
      description_fr TEXT,
      description_en TEXT,
      flag_emoji TEXT,
      icon_url TEXT,
      display_order INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Courses
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language_id INTEGER NOT NULL,
      title_ar TEXT NOT NULL,
      title_fr TEXT NOT NULL,
      title_en TEXT,
      slug TEXT UNIQUE NOT NULL,
      description_ar TEXT,
      description_fr TEXT,
      description_en TEXT,
      level TEXT NOT NULL, -- 'A1-A2 Débutant', 'B1-B2 Intermédiaire', 'C1-C2 Avancé', 'Tous Niveaux'
      format TEXT NOT NULL, -- 'group_online', 'private_1on1', 'intensive', 'weekend'
      price INTEGER NOT NULL, -- In Algerian Dinar (DZD)
      currency TEXT DEFAULT 'DZD',
      duration_weeks INTEGER DEFAULT 8,
      hours_total INTEGER DEFAULT 32,
      max_capacity INTEGER DEFAULT 12,
      prerequisites_ar TEXT,
      prerequisites_fr TEXT,
      prerequisites_en TEXT,
      objectives_ar TEXT,
      objectives_fr TEXT,
      objectives_en TEXT,
      schedule_info_ar TEXT,
      schedule_info_fr TEXT,
      schedule_info_en TEXT,
      is_published INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (language_id) REFERENCES teaching_languages(id) ON DELETE RESTRICT
    );
  `);

  // 4. Course Teacher Assignment
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_teachers (
      course_id INTEGER NOT NULL,
      teacher_user_id INTEGER NOT NULL,
      PRIMARY KEY (course_id, teacher_user_id),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Teacher Profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      bio_ar TEXT,
      bio_fr TEXT,
      qualifications_ar TEXT,
      qualifications_fr TEXT,
      specialties_ar TEXT,
      specialties_fr TEXT,
      languages_spoken TEXT, -- JSON or comma separated
      weekly_availability TEXT, -- JSON array of slots
      hourly_rate INTEGER DEFAULT 2500,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Student Profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      birth_date TEXT,
      address TEXT,
      city TEXT DEFAULT 'Alger',
      native_language TEXT DEFAULT 'Arabe',
      learning_goals TEXT,
      admin_notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 7. Enrollments
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('new', 'under_review', 'accepted', 'awaiting_payment', 'confirmed', 'completed', 'cancelled')) NOT NULL DEFAULT 'new',
      payment_status TEXT CHECK(payment_status IN ('pending', 'partially_paid', 'paid', 'refunded')) NOT NULL DEFAULT 'pending',
      amount_due INTEGER NOT NULL DEFAULT 0,
      amount_paid INTEGER NOT NULL DEFAULT 0,
      preferred_schedule TEXT,
      notes TEXT,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
    );
  `);

  // 8. Class Sessions (Scheduling & Timetable)
  db.exec(`
    CREATE TABLE IF NOT EXISTS class_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      title_ar TEXT NOT NULL,
      title_fr TEXT NOT NULL,
      session_type TEXT CHECK(session_type IN ('group', 'individual')) DEFAULT 'group',
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      meeting_url TEXT,
      room_name TEXT,
      status TEXT CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
      summary_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);

  // 9. Session Attendance
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
      notes TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id, student_id),
      FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 10. Payments & Financial Transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT UNIQUE NOT NULL,
      enrollment_id INTEGER,
      student_id INTEGER NOT NULL,
      course_id INTEGER,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'DZD',
      payment_method TEXT CHECK(payment_method IN ('baridimob', 'ccp', 'bank_transfer', 'cash', 'card')) NOT NULL DEFAULT 'baridimob',
      reference_number TEXT,
      status TEXT CHECK(status IN ('pending', 'paid', 'partially_paid', 'failed', 'refunded')) NOT NULL DEFAULT 'paid',
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_by_user_id INTEGER,
      FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    );
  `);

  // 11. Contact Inquiries & Course Leads
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      preferred_language TEXT,
      course_id INTEGER,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT CHECK(status IN ('new', 'contacted', 'enrolled', 'closed')) DEFAULT 'new',
      admin_reply_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    );
  `);

  // 12. Notifications Log
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title_ar TEXT NOT NULL,
      title_fr TEXT NOT NULL,
      message_ar TEXT NOT NULL,
      message_fr TEXT NOT NULL,
      channel TEXT CHECK(channel IN ('system', 'email', 'whatsapp')) DEFAULT 'system',
      status TEXT CHECK(status IN ('unread', 'read', 'sent', 'failed')) DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 13. Audit Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Auto-migration for multilingual English fields if existing database
  try { db.exec(`ALTER TABLE teaching_languages ADD COLUMN description_en TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE courses ADD COLUMN title_en TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE courses ADD COLUMN description_en TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE courses ADD COLUMN prerequisites_en TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE courses ADD COLUMN objectives_en TEXT`); } catch (_) {}
  try { db.exec(`ALTER TABLE courses ADD COLUMN schedule_info_en TEXT`); } catch (_) {}

  // Seed default data if users table is empty
  seedInitialData(db);
}

function seedInitialData(db: Database.Database) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount && userCount.count > 0) {
    return; // Already seeded
  }

  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const teacherPasswordHash = bcrypt.hashSync('teacher123', salt);
  const disabledLoginHash = 'DISABLED_NO_LOGIN_ACCOUNT';

  // 1. Insert Users - Super Admin, Academy Admin (Secretary) and Teachers
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, avatar, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);

  const superAdmin = insertUser.run('Fassi7 Director', 'admin@fassi7.com', adminPasswordHash, 'super_admin', '+213 550 12 34 56', '/avatars/admin.jpg');
  const academyAdmin = insertUser.run('Nadia Mansouri', 'nadia@fassi7.com', adminPasswordHash, 'academy_admin', '+213 551 22 33 44', '/avatars/nadia.jpg');
  
  // Teachers (Instructors directory records, login enabled with teacher123)
  const teacher1 = insertUser.run('Dr. Youcef Belkacem', 'youcef@fassi7.com', teacherPasswordHash, 'teacher', '+213 661 11 22 33', '/avatars/teacher1.jpg');
  const teacher2 = insertUser.run('Sarah Benali', 'sarah@fassi7.com', teacherPasswordHash, 'teacher', '+213 662 33 44 55', '/avatars/teacher2.jpg');
  const teacher3 = insertUser.run('Marc Dupont', 'marc@fassi7.com', teacherPasswordHash, 'teacher', '+213 663 55 66 77', '/avatars/teacher3.jpg');
  const teacher4 = insertUser.run('Amina Khelifi', 'amina@fassi7.com', teacherPasswordHash, 'teacher', '+213 664 77 88 99', '/avatars/teacher4.jpg');

  // Students (Learners directory records, login disabled)
  const student1 = insertUser.run('Karim Meziane', 'karim@gmail.com', disabledLoginHash, 'student', '+213 770 12 34 56', '/avatars/student1.jpg');
  const student2 = insertUser.run('Lina Chaoui', 'lina@gmail.com', disabledLoginHash, 'student', '+213 771 23 45 67', '/avatars/student2.jpg');
  const student3 = insertUser.run('Walid Berrada', 'walid@gmail.com', disabledLoginHash, 'student', '+213 772 34 56 78', '/avatars/student3.jpg');
  const student4 = insertUser.run('Yasmine Haddad', 'yasmine@gmail.com', disabledLoginHash, 'student', '+213 773 45 67 89', '/avatars/student4.jpg');

  // 2. Insert Teaching Languages
  const insertLang = db.prepare(`
    INSERT INTO teaching_languages (code, name_ar, name_fr, name_en, slug, description_ar, description_fr, flag_emoji, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const langEn = insertLang.run('en', 'الإنجليزية', 'Anglais', 'English', 'english', 'تعلم الإنجليزية للأعمال، التواصل اليومي والتحضير لاختبارات IELTS / TOEFL مع نخبة من الأساتذة.', 'Apprenez l\'anglais pour les affaires, la communication quotidienne et la préparation IELTS/TOEFL.', '🇬🇧', 1);
  const langFr = insertLang.run('fr', 'الفرنسية', 'Français', 'French', 'french', 'إتقان اللغة الفرنسية كتابة ونطقاً، تحضير TCF / DELF وتطوير مهارات التعبير المهني.', 'Maîtrisez le français à l\'écrit et à l\'oral, préparez le TCF / DELF et perfectionnez votre communication.', '🇫🇷', 2);
  const langDe = insertLang.run('de', 'الألمانية', 'Allemand', 'German', 'german', 'برامج مخصصة للهجرة والدراسة في ألمانيا، تحضير معهد غوته Goethe-Zertifikat من A1 إلى B2.', 'Programmes dédiés aux études et travail en Allemagne, préparation Goethe de A1 à B2.', '🇩🇪', 3);
  const langEs = insertLang.run('es', 'الإسبانية', 'Espagnol', 'Spanish', 'spanish', 'اكتشف روعة اللغة الإسبانية وثقافتها من خلال محادثات تفاعلية ومناهج حديثة.', 'Découvrez la beauté de la langue espagnole à travers des cours interactifs et dynamiques.', '🇪🇸', 4);
  const langTr = insertLang.run('tr', 'التركية', 'Turc', 'Turkish', 'turkish', 'تعلم اللغة التركية للدراسة والسياحة والأعمال في تركيا بأسلوب مبسط وشيق.', 'Apprenez le turc pour vos études, voyages et affaires en Turquie avec une méthode simplifiée.', '🇹🇷', 5);
  const langIt = insertLang.run('it', 'الإيطالية', 'Italien', 'Italian', 'italian', 'دورات تفاعلية في اللغة الإيطالية للطلاب والمحترفين وعشاق الثقافة الإيطالية.', 'Cours vivants d\'italien pour étudiants, professionnels et passionnés de culture.', '🇮🇹', 6);
  const langAr = insertLang.run('ar', 'العربية لغير الناطقين بها', 'Arabe pour non-arabophones', 'Arabic for Non-Natives', 'arabic', 'تعليم اللغة العربية الفصحى وقواعد البيان والتواصل للناطقين بغيرها من شتى أنحاء العالم.', 'Enseignement de l\'arabe standard moderne et communication pour les non-arabophones.', '🇩🇿', 7);

  // 3. Insert Teacher Profiles
  const insertTeacherProfile = db.prepare(`
    INSERT INTO teacher_profiles (user_id, bio_ar, bio_fr, qualifications_ar, qualifications_fr, specialties_ar, specialties_fr, languages_spoken, weekly_availability, hourly_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTeacherProfile.run(
    teacher1.lastInsertRowid,
    'أستاذ معتمد ذو خبرة تفوق 12 عاماً في تدريس الإنجليزية الأكاديمية والتحضير لاختبار IELTS. حاصل على شهادة CELTA من كامبريدج.',
    'Enseignant certifié avec plus de 12 ans d\'expérience en anglais académique et préparation IELTS. Titulaire du CELTA de Cambridge.',
    'دكتوراه في اللغويات الإنجليزية، شهادة CELTA',
    'Doctorat en Linguistique Anglaise, Certifié CELTA Cambridge',
    'IELTS, Business English, المحادثة المتقدمة',
    'IELTS, Business English, Conversation Avancée',
    'Anglais (Natif/C2), Arabe (Natif), Français (C1)',
    JSON.stringify(['Mon 18:00-21:00', 'Wed 18:00-21:00', 'Sat 10:00-14:00']),
    3000
  );

  insertTeacherProfile.run(
    teacher2.lastInsertRowid,
    'متخصصة في تعليم اللغة الفرنسية وتحضير امتحانات TCF Canada و DELF B2 مع تركيز على طلاقة النطق وتجاوز رهبة التحدث.',
    'Spécialiste de l\'enseignement du français et préparation TCF Canada / DELF B2, axée sur l\'aisance à l\'oral.',
    'ماستر في تعليم الفرنسية كلغة أجنبية (FLE)',
    'Master en Didactique du FLE (Français Langue Étrangère)',
    'TCF Canada, DELF B2, Communication Professionnelle',
    'TCF Canada, DELF B2, Communication Professionnelle',
    'Français (Natif), Arabe (Natif), Anglais (B2)',
    JSON.stringify(['Tue 17:00-20:00', 'Thu 17:00-20:00', 'Sun 10:00-13:00']),
    2800
  );

  insertTeacherProfile.run(
    teacher3.lastInsertRowid,
    'مدرس لغة ألمانية مقيم بالجزائر، خريج جامعة هايدلبرغ وخبير في تأهيل الأطباء والمهندسين للعمل في ألمانيا.',
    'Enseignant d\'allemand, diplômé de l\'Université d\'Heidelberg, expert en préparation médicale et technique pour l\'Allemagne.',
    'ماستر في الدراسات الألمانية من جامعة هايدلبرغ',
    'Master en Études Germaniques (Univ. Heidelberg)',
    'Goethe-Zertifikat B1/B2, Allemand Médical',
    'Goethe-Zertifikat B1/B2, Allemand Médical',
    'Allemand (Natif), Français (C2), Anglais (C1)',
    JSON.stringify(['Mon 18:00-21:00', 'Thu 18:00-21:00', 'Sat 14:00-18:00']),
    3200
  );

  insertTeacherProfile.run(
    teacher4.lastInsertRowid,
    'أستاذة شغوفة باللغة الإسبانية ودراسات الثقافة الأيبيرية، حاصلة على شهادة DELE C2 وتتميز بأسلوب تعليمي تفاعلي مرح.',
    'Passionnée par la langue espagnole et la culture ibérique, certifiée DELE C2 avec une approche pédagogique immersive et chaleureuse.',
    'ليسانس لغة إسبانية، شهادة معتمدة من معهد ثربانتس',
    'Licence en Espagnol, Diplômée Institut Cervantès',
    'DELE B1/B2, Espagnol Débutant, Conversation Fluide',
    'DELE B1/B2, Espagnol Débutant, Conversation Fluide',
    'Espagnol (C2), Arabe (Natif), Français (C1)',
    JSON.stringify(['Wed 16:00-19:00', 'Fri 14:00-18:00', 'Sat 16:00-19:00']),
    2500
  );

  // 4. Insert Courses
  const insertCourse = db.prepare(`
    INSERT INTO courses (
      language_id, title_ar, title_fr, slug, description_ar, description_fr,
      level, format, price, duration_weeks, hours_total, max_capacity,
      prerequisites_ar, prerequisites_fr, objectives_ar, objectives_fr,
      schedule_info_ar, schedule_info_fr, featured
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const c1 = insertCourse.run(
    langEn.lastInsertRowid,
    'دورة الإنجليزية العامة للمحادثة والطلاقة (A2 - B1)',
    'Anglais Général & Conversation Fluide (A2 - B1)',
    'general-english-a2-b1',
    'دورة تفاعلية عبر الإنترنت تركز على بناء الثقة، توسيع المفردات، واكتساب طلاقة التعبير في المواقف الحياتية والمهنية اليومية.',
    'Cours interactif en ligne axé sur le renforcement de la confiance orale, l\'enrichissement lexical et la fluidité au quotidien.',
    'A2 - B1 Intermédiaire',
    'group_online',
    18000,
    8,
    32,
    10,
    'مستوى مبتدئ A1 أو اجتياز اختبار تحديد المستوى',
    'Niveau débutant A1 ou test de niveau Fassi7',
    'التحدث بطلاقة دون تردد، فهم المحادثات السريعة، إتقان القواعد الأساسية بنطق صحيح.',
    'Parler avec aisance, comprendre les conversations rapides, maîtriser les structures grammaticales clés.',
    'السبت والثلاثاء 18:30 - 20:30 (بتوقيت الجزائر)',
    'Samedi et Mardi 18:30 - 20:30 (Heure d\'Alger)',
    1
  );

  const c2 = insertCourse.run(
    langEn.lastInsertRowid,
    'التحضير المكثف لاختبار IELTS الأكاديمي (Band 7+)',
    'Préparation Intensive IELTS Academic (Band 7+)',
    'ielts-academic-mastery',
    'تدريب استراتيجي مكثف على الأقسام الأربعة: الاستماع، القراءة، الكتابة الأكاديمية والمحادثة، مع اختبارات تجريبية وتقييم أسبوعي.',
    'Entraînement stratégique intensif aux 4 épreuves de l\'IELTS avec examens blancs et corrections personnalisées par un expert.',
    'B2 - C1 Avancé',
    'group_online',
    28000,
    6,
    36,
    8,
    'مستوى B2 على الأقل في اللغة الإنجليزية',
    'Niveau B2 requis en anglais',
    'تحقيق سكور 7.0 وما فوق، إتقان المقال الأكاديمي Task 1 & 2، واستراتيجيات إدارة الوقت.',
    'Viser un score de 7.0+, maîtriser la rédaction académique et les techniques de gestion du temps.',
    'الإثنين والأربعاء 19:00 - 21:00',
    'Lundi et Mercredi 19:00 - 21:00',
    1
  );

  const c3 = insertCourse.run(
    langFr.lastInsertRowid,
    'التحضير الشامل لامتحان TCF Canada للهجرة',
    'Préparation Complète TCF Canada & Québec',
    'tcf-canada-express',
    'دورة متخصصة للراغبين في الهجرة أو العمل في كندا، تركز على رفع درجات الفهم الشفهي والكتابي والتعبير بنموذج الامتحان المعتمد.',
    'Formation ciblée pour l\'immigration au Canada, ciblant le niveau NCLC 7+ en compréhension et expression orale/écrite.',
    'B1 - B2 Intermédiaire',
    'group_online',
    24000,
    8,
    32,
    10,
    'مستوى متوسط في اللغة الفرنسية B1',
    'Niveau B1 en français',
    'الحصول على NCLC 7+ (B2/C1)، إتقان مواضيع التعبير الشفهي الثلاثة وكتابة المهام الثلاث.',
    'Décrocher le NCLC 7+, réussir les 3 tâches orales et les 3 épreuves écrites avec brio.',
    'الأحد والخميس 18:00 - 20:00',
    'Dimanche et Jeudi 18:00 - 20:00',
    1
  );

  const c4 = insertCourse.run(
    langDe.lastInsertRowid,
    'الألمانية خطوة بخطوة للمبتدئين A1 (Goethe-Zertifikat)',
    'Allemand Débutant Complet A1 (Goethe)',
    'allemand-debutant-a1',
    'انطلق من الصفر في تعلم اللغة الألمانية بأحدث المناهج التفاعلية مع دعم صوتي وتمارين تواصلية تؤهلك لاجتياز امتحان A1 بنجاح.',
    'Démarrez l\'allemand de zéro avec une méthode moderne et immersive, idéale pour les visas d\'études et regroupement familial.',
    'A1 Débutant',
    'group_online',
    22000,
    10,
    40,
    12,
    'لا يشترط وجود معرفة مسبقة باللغة',
    'Aucun prérequis nécessaire',
    'التعريف بالنفس، السؤال عن الاتجاهات، إدارة المحادثات البسيطة واجتياز اختبار معهد غوته A1.',
    'Se présenter, communiquer dans les situations simples de la vie quotidienne et réussir l\'examen A1.',
    'الإثنين والخميس 18:30 - 20:30',
    'Lundi et Jeudi 18:30 - 20:30',
    1
  );

  const c5 = insertCourse.run(
    langEs.lastInsertRowid,
    'الإسبانية للمبتدئين والتواصل السريع A1 - A2',
    'Espagnol Débutant & Immersion Orale A1 - A2',
    'espagnol-immersion-a1-a2',
    'رحلة حيوية لاكتساب أساسيات اللغة الإسبانية والنطق الصحيح والقدرة على التعبير في السفر والحياة اليومية بأسلوب مشوق.',
    'Un voyage vivant pour maîtriser les bases de la langue espagnole, la prononciation et l\'expression spontanée.',
    'A1 - A2 Débutant',
    'group_online',
    16000,
    8,
    30,
    10,
    'مفتوح للجميع دون متطلبات سابقة',
    'Ouvert à tous',
    'إجراء محادثات أساسية، قراءة النصوص البسيطة، والتعبير عن الرغبات والاهتمامات بثقة.',
    'Tenir des échanges basiques, comprendre des textes simples et s\'exprimer en voyage.',
    'الجمعة 15:00 - 18:00 والسبت 17:00 - 19:00',
    'Vendredi 15:00 - 18:00 et Samedi 17:00 - 19:00',
    0
  );

  const c6 = insertCourse.run(
    langTr.lastInsertRowid,
    'اللغة التركية التفاعلية A1 للدراسة والتجارة',
    'Turc Interactif A1 pour Études & Affaires',
    'turc-interactif-a1',
    'تعلم قواعد النطق، تراكيب الجمل التركية، والمحادثات التجارية والسياحية الأساسية مع تطبيقات عملية وتدريبات مباشرة.',
    'Apprenez la grammaire, la phonétique et les dialogues essentiels du turc pour vos projets universitaires ou commerciaux.',
    'A1 Débutant',
    'group_online',
    17000,
    8,
    32,
    10,
    'لا متطلبات سابقة',
    'Aucun prérequis',
    'فهم الأتراك، إدارة التعاملات المصرفية والتجارية، والتحدث بأريحية في إسطنبول والمدن التركية.',
    'Comprendre et dialoguer avec des locuteurs turcs, gérer ses voyages et démarches avec aisance.',
    'الأحد والأربعاء 18:00 - 20:00',
    'Dimanche et Mercredi 18:00 - 20:00',
    0
  );

  // 5. Assign Teachers to Courses
  const assignTeacher = db.prepare('INSERT INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
  assignTeacher.run(c1.lastInsertRowid, teacher1.lastInsertRowid);
  assignTeacher.run(c2.lastInsertRowid, teacher1.lastInsertRowid);
  assignTeacher.run(c3.lastInsertRowid, teacher2.lastInsertRowid);
  assignTeacher.run(c4.lastInsertRowid, teacher3.lastInsertRowid);
  assignTeacher.run(c5.lastInsertRowid, teacher4.lastInsertRowid);
  assignTeacher.run(c6.lastInsertRowid, teacher1.lastInsertRowid);

  // 6. Student Profiles
  const insertStudentProfile = db.prepare(`
    INSERT INTO student_profiles (user_id, birth_date, city, native_language, learning_goals, admin_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertStudentProfile.run(student1.lastInsertRowid, '1998-05-14', 'Alger', 'Arabe', 'الهجرة إلى كندا واجتياز TCF بنقاط مرتفعة', 'طالب مجتهد وملتزم بالحضور، تم تأكيد الدفعة عبر بريدي موب.');
  insertStudentProfile.run(student2.lastInsertRowid, '2001-11-20', 'Oran', 'Arabe', 'التحضير لشهادة IELTS لمتابعة ماستر في بريطانيا', 'سجلت في دورة IELTS، بحاجة لمتابعة خاصة في قسم الكتابة.');
  insertStudentProfile.run(student3.lastInsertRowid, '1995-03-08', 'Constantine', 'Arabe', 'تأشيرة عمل كمهندس في ألمانيا', 'بدأ دورة A1 الألمانية، سجل دفعة أولى نقداً.');
  insertStudentProfile.run(student4.lastInsertRowid, '2000-09-17', 'Annaba', 'Français', 'تحسين مهارات المحادثة باللغة الإنجليزية في العمل', 'مهتمة بالدورة المسائية التفاعلية.');

  // 7. Enrollments
  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, status, payment_status, amount_due, amount_paid, preferred_schedule, notes, enrolled_at, confirmed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);

  const e1 = insertEnrollment.run(student1.lastInsertRowid, c3.lastInsertRowid, 'confirmed', 'paid', 24000, 24000, 'الأحد والخميس مساءً', 'تم التحقق من الوصل بنجاح', '-14 days', '-13 days');
  const e2 = insertEnrollment.run(student2.lastInsertRowid, c2.lastInsertRowid, 'confirmed', 'paid', 28000, 28000, 'الإثنين والأربعاء', 'طالبة مقبولة في الفوج المكثف', '-10 days', '-9 days');
  const e3 = insertEnrollment.run(student3.lastInsertRowid, c4.lastInsertRowid, 'awaiting_payment', 'partially_paid', 22000, 12000, 'مساء الإثنين والخميس', 'سدد القسط الأول (12000 دج)، المتبقي 10000 دج', '-5 days', '-4 days');
  const e4 = insertEnrollment.run(student4.lastInsertRowid, c1.lastInsertRowid, 'under_review', 'pending', 18000, 0, 'السبت والثلاثاء', 'طلب تسجيل جديد قيد مراجعة الإدارة', '-1 day', null);

  // 8. Class Sessions (Schedules)
  const insertSession = db.prepare(`
    INSERT INTO class_sessions (course_id, teacher_id, title_ar, title_fr, session_type, start_time, end_time, meeting_url, room_name, status, summary_notes)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?), ?, ?, ?, ?)
  `);

  // Past session
  const s1 = insertSession.run(
    c3.lastInsertRowid,
    teacher2.lastInsertRowid,
    'حصة TCF: استراتيجيات التعبير الشفهي (Tâche 2)',
    'Session TCF: Stratégies d\'Expression Orale (Tâche 2)',
    'group',
    '-2 days',
    '-2 days',
    'https://meet.google.com/fas-si7-tcf',
    'Salle Virtuelle Nelson Mandela',
    'completed',
    'تمارين محاكاة مقابلة الفحص الشفهي مع تصحيح فوري للمفردات.'
  );

  // Upcoming sessions
  insertSession.run(
    c2.lastInsertRowid,
    teacher1.lastInsertRowid,
    'ورشة عمل IELTS Writing Task 2: كتابة المقال الجدلي',
    'Atelier IELTS Writing Task 2: L\'Essai Argumentatif',
    'group',
    '+1 days',
    '+1 days',
    'https://meet.google.com/fas-si7-ielts',
    'Salle Virtuelle Oxford',
    'scheduled',
    'يرجى من جميع الطلاب تحضير مسودة المقال المرفقة مسبقاً.'
  );

  insertSession.run(
    c4.lastInsertRowid,
    teacher3.lastInsertRowid,
    'حصة الألمانية: تركيب الجمل وأفعال الحركة والجر',
    'Session Allemand: Structure des phrases & Verbes avec prépositions',
    'group',
    '+2 days',
    '+2 days',
    'https://meet.google.com/fas-si7-goethe',
    'Salle Virtuelle Berlin',
    'scheduled',
    'التركيز على تصريف الأفعال الشاذة وتطبيقات النطق.'
  );

  insertSession.run(
    c1.lastInsertRowid,
    teacher1.lastInsertRowid,
    'محادثة إنجليزية حية: التعبير عن الآراء والمفاوضة',
    'Live English Debate: Expressing Opinions & Negotiating',
    'group',
    '+3 days',
    '+3 days',
    'https://meet.google.com/fas-si7-conv',
    'Salle Virtuelle Cambridge',
    'scheduled',
    'نشاط تفاعلي في مجموعات مصغرة (Breakout Rooms).'
  );

  // 9. Attendance
  const insertAttendance = db.prepare(`
    INSERT INTO attendance (session_id, student_id, status, notes)
    VALUES (?, ?, ?, ?)
  `);
  insertAttendance.run(s1.lastInsertRowid, student1.lastInsertRowid, 'present', 'مشاركة ممتازة ومستوى ملحوظ في الطلاقة.');

  // 10. Payments
  const insertPayment = db.prepare(`
    INSERT INTO payments (receipt_number, enrollment_id, student_id, course_id, amount, currency, payment_method, reference_number, status, payment_date, notes)
    VALUES (?, ?, ?, ?, ?, 'DZD', ?, ?, ?, datetime('now', ?), ?)
  `);

  insertPayment.run('REC-2026-0081', e1.lastInsertRowid, student1.lastInsertRowid, c3.lastInsertRowid, 24000, 'baridimob', 'BM-99283741', 'paid', '-13 days', 'دفعة كاملة عبر بريدي موب معتمدة');
  insertPayment.run('REC-2026-0082', e2.lastInsertRowid, student2.lastInsertRowid, c2.lastInsertRowid, 28000, 'ccp', 'CCP-77123984', 'paid', '-9 days', 'وصل حوالة بريدية مسجل لدى مصلحة المحاسبة');
  insertPayment.run('REC-2026-0083', e3.lastInsertRowid, student3.lastInsertRowid, c4.lastInsertRowid, 12000, 'cash', 'CASH-REC-019', 'partially_paid', '-4 days', 'القسط الأول نقداً بمقر الأكاديمية - رصيد متبقي 10000 دج');

  // 11. Contact Inquiries
  const insertInquiry = db.prepare(`
    INSERT INTO contact_inquiries (full_name, email, phone, preferred_language, course_id, subject, message, status, admin_reply_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertInquiry.run('Sofiane Boudiaf', 'sofiane@hotmail.com', '+213 555 99 88 77', 'Allemand', c4.lastInsertRowid, 'استفسار حول مواعيد دورة الألمانية A2 القادمة', 'السلام عليكم، أريد معرفة هل تتوفر لديكم دورة ألمانية مسائية مستوى A2 تنطلق الشهر المقبل؟', 'new', null, '-2 hours');
  insertInquiry.run('Ines Zerrouki', 'ines.z@gmail.com', '+213 661 44 33 22', 'Anglais', c2.lastInsertRowid, 'Préparation IELTS pour bourse Chevening', 'Bonjour, je prépare le dossier de bourse Chevening et j\'ai besoin d\'un score 7.5 IELTS. Proposez-vous du coaching 1-on-1?', 'contacted', 'تم التواصل عبر الواتساب وإرسال خطة التحضير الفردي', '-1 day');
  insertInquiry.run('Rachid Amrani', 'r.amrani@outlook.com', '+213 770 88 99 00', 'Espagnol', c5.lastInsertRowid, 'Cours d\'espagnol en entreprise', 'Notre entreprise souhaite inscrire 5 collaborateurs pour une formation espagnol professionnel.', 'enrolled', 'تم تحويل الطلب إلى مسؤولة الشركات', '-3 days');

  // 12. Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, title_ar, title_fr, message_ar, message_fr, channel, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run(
    student1.lastInsertRowid,
    'تم تأكيد تسجيلك في دورة TCF Canada',
    'Inscription confirmée pour le cours TCF Canada',
    'مرحباً كريم، تم تأكيد تسجيلك بنجاح في الفوج المسائي. موعد الحصة الأولى الأحد 18:00.',
    'Bonjour Karim, votre inscription est validée avec succès. Première séance ce dimanche à 18h00.',
    'system',
    'read'
  );

  insertNotification.run(
    student3.lastInsertRowid,
    'تذكير بسداد القسط الثاني المتبقي',
    'Rappel d\'échéance du second versement',
    'عزيزي وليد، نذكرك بلطف بأن القسط الثاني (10000 دج) مستحق قبل موعد الحصة القادمة.',
    'Cher Walid, nous vous rappelons que le solde restant (10.000 DZD) est dû avant la prochaine session.',
    'system',
    'unread'
  );

  // 13. Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(superAdmin.lastInsertRowid, 'CREATE_COURSE', 'course', c2.lastInsertRowid, 'Created IELTS Academic Mastery course with capacity 8', '192.168.1.10');
  insertAudit.run(academyAdmin.lastInsertRowid, 'APPROVE_PAYMENT', 'payment', 1, 'Validated payment BM-99283741 for 24000 DZD', '192.168.1.12');
  insertAudit.run(academyAdmin.lastInsertRowid, 'CONFIRM_ENROLLMENT', 'enrollment', e1.lastInsertRowid, 'Confirmed enrollment for student Karim Meziane', '192.168.1.12');

  console.log('Fassi7 Database initialized and seeded with authentic Algerian Academy data successfully!');
}
