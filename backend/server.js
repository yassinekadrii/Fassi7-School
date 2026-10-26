import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fassi7_production_secret_key_2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// -------------------------------------------------------------
// Database Connection
// -------------------------------------------------------------
function getDatabasePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join('/tmp', 'fassi7.db');
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(__dirname, '..', 'fassi7.db'),
        path.join(__dirname, 'fassi7.db'),
        path.resolve('fassi7.db'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          try {
            fs.copyFileSync(c, tmpDbPath);
            break;
          } catch (e) {
            console.error('Failed to copy db to /tmp:', e);
          }
        }
      }
    }
    return tmpDbPath;
  }

  // Look for fassi7.db in current dir or parent dir
  const directPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || '../fassi7.db');
  if (fs.existsSync(directPath)) return directPath;

  const localPath = path.resolve(__dirname, 'fassi7.db');
  if (fs.existsSync(localPath)) return localPath;

  const parentPath = path.resolve(__dirname, '..', 'fassi7.db');
  return parentPath;
}

const db = new Database(getDatabasePath());
try { db.pragma('journal_mode = WAL'); } catch (_) { try { db.pragma('journal_mode = DELETE'); } catch (__) {} }
db.pragma('foreign_keys = ON');

// Safe auto-migrations for multilingual English fields
try { db.exec(`ALTER TABLE teaching_languages ADD COLUMN description_en TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE courses ADD COLUMN title_en TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE courses ADD COLUMN description_en TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE courses ADD COLUMN prerequisites_en TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE courses ADD COLUMN objectives_en TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE courses ADD COLUMN schedule_info_en TEXT`); } catch (_) {}

// -------------------------------------------------------------
// Middleware
// -------------------------------------------------------------
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json());
app.use(cookieParser());

// -------------------------------------------------------------
// Auth Helpers
// -------------------------------------------------------------
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getCurrentUser(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const user = verifyToken(authHeader.substring(7));
    if (user) return user;
  }
  const cookieToken = req.cookies?.fassi7_token;
  if (cookieToken) {
    const user = verifyToken(cookieToken);
    if (user) return user;
  }
  return null;
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Accès interdit pour votre profil.' });
    }
    req.user = user;
    next();
  };
}

// -------------------------------------------------------------
// 1. Health Check
// -------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    name: 'Fassi7 Language Academy API (Node.js)',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fassi7-node-backend' });
});

// -------------------------------------------------------------
// 2. Auth Routes
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Identifiants incorrects ou compte inactif' });
  }

  if (user.password_hash === 'DISABLED_NO_LOGIN_ACCOUNT') {
    return res.status(403).json({ error: 'La connexion directe pour ce profil est désactivée. Veuillez contacter le secrétariat.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const token = signToken(user);
  res.cookie('fassi7_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  });
});

app.post('/api/auth/quick-login', (req, res) => {
  const { role } = req.body;
  if (!['super_admin', 'academy_admin'].includes(role)) {
    return res.status(400).json({ error: 'Rôle non autorisé pour la démo' });
  }

  const user = db.prepare('SELECT * FROM users WHERE role = ? AND status = "active" LIMIT 1').get(role);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur de démo introuvable' });
  }

  const token = signToken(user);
  res.cookie('fassi7_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const authUser = getCurrentUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const user = db.prepare('SELECT id, name, email, role, phone, avatar, status FROM users WHERE id = ?').get(authUser.id);
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('fassi7_token');
  res.json({ success: true, message: 'Déconnexion réussie' });
});

// -------------------------------------------------------------
// 3. Courses Routes
// -------------------------------------------------------------
app.get('/api/courses', (req, res) => {
  const { language_id, level, format, search, published_only } = req.query;

  let query = `
    SELECT c.*, 
      tl.name_ar as language_name_ar,
      tl.name_fr as language_name_fr,
      tl.name_en as language_name_en,
      tl.flag_emoji,
      tl.code as language_code,
      COUNT(DISTINCT e.id) as enrolled_count
    FROM courses c
    JOIN teaching_languages tl ON tl.id = c.language_id
    LEFT JOIN enrollments e ON e.course_id = c.id AND e.status IN ('accepted', 'awaiting_payment', 'confirmed')
    WHERE c.is_archived = 0
  `;
  const params = [];

  if (published_only === 'true') {
    query += ` AND c.is_published = 1 AND tl.is_published = 1 `;
  }
  if (language_id && language_id !== 'all') {
    query += ` AND c.language_id = ? `;
    params.push(language_id);
  }
  if (level && level !== 'all') {
    query += ` AND c.level LIKE ? `;
    params.push(`%${level}%`);
  }
  if (format && format !== 'all') {
    query += ` AND c.format = ? `;
    params.push(format);
  }
  if (search) {
    query += ` AND (c.title_ar LIKE ? OR c.title_fr LIKE ? OR c.title_en LIKE ? OR c.description_ar LIKE ? OR c.description_fr LIKE ? OR c.description_en LIKE ?) `;
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s);
  }

  query += ` GROUP BY c.id ORDER BY c.featured DESC, c.id DESC `;
  const courses = db.prepare(query).all(...params);

  const getTeachers = db.prepare(`
    SELECT u.id, u.name, u.avatar, u.email 
    FROM course_teachers ct
    JOIN users u ON u.id = ct.teacher_user_id
    WHERE ct.course_id = ?
  `);

  for (const course of courses) {
    course.teachers = getTeachers.all(course.id);
  }

  res.json({ courses });
});

app.post('/api/courses', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const body = req.body;
  const {
    language_id, title_ar, title_fr, title_en, slug, description_ar, description_fr, description_en,
    level, format, price, currency, duration_weeks, hours_total, max_capacity,
    prerequisites_ar, prerequisites_fr, prerequisites_en, objectives_ar, objectives_fr, objectives_en,
    schedule_info_ar, schedule_info_fr, schedule_info_en, featured, teacher_ids,
  } = body;

  if (!language_id || !title_ar || !title_fr || !slug || !price) {
    return res.status(400).json({ error: 'Champs obligatoires manquants (langue, titres, slug, prix)' });
  }

  const insert = db.prepare(`
    INSERT INTO courses (
      language_id, title_ar, title_fr, title_en, slug, description_ar, description_fr, description_en,
      level, format, price, currency, duration_weeks, hours_total, max_capacity,
      prerequisites_ar, prerequisites_fr, prerequisites_en, objectives_ar, objectives_fr, objectives_en,
      schedule_info_ar, schedule_info_fr, schedule_info_en, featured, is_published, is_archived
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `);

  const result = insert.run(
    language_id, title_ar, title_fr, title_en || title_fr,
    slug.toLowerCase().trim().replace(/\s+/g, '-'),
    description_ar || '', description_fr || '', description_en || description_fr || '',
    level || 'Tous Niveaux', format || 'group_online', price, currency || 'DZD',
    duration_weeks || 8, hours_total || 32, max_capacity || 12,
    prerequisites_ar || '', prerequisites_fr || '', prerequisites_en || prerequisites_fr || '',
    objectives_ar || '', objectives_fr || '', objectives_en || objectives_fr || '',
    schedule_info_ar || '', schedule_info_fr || '', schedule_info_en || schedule_info_fr || '',
    featured ? 1 : 0
  );

  const newId = result.lastInsertRowid;
  if (teacher_ids && Array.isArray(teacher_ids)) {
    const assign = db.prepare('INSERT OR IGNORE INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
    for (const tId of teacher_ids) {
      assign.run(newId, tId);
    }
  }

  res.json({ success: true, id: newId });
});

app.post('/api/courses/duplicate', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const { course_id } = req.body;
  const original = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
  if (!original) return res.status(404).json({ error: 'Cours introuvable' });

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newSlug = `${original.slug}-copie-${randomSuffix}`;
  const newTitleFr = `${original.title_fr} (Copie)`;
  const newTitleAr = `${original.title_ar} (نسخة)`;
  const newTitleEn = original.title_en ? `${original.title_en} (Copy)` : `${original.title_fr} (Copy)`;

  const insert = db.prepare(`
    INSERT INTO courses (
      language_id, title_ar, title_fr, title_en, slug, description_ar, description_fr, description_en,
      level, format, price, currency, duration_weeks, hours_total, max_capacity,
      prerequisites_ar, prerequisites_fr, prerequisites_en, objectives_ar, objectives_fr, objectives_en,
      schedule_info_ar, schedule_info_fr, schedule_info_en, featured, is_published, is_archived
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
  `);

  const result = insert.run(
    original.language_id, newTitleAr, newTitleFr, newTitleEn, newSlug,
    original.description_ar, original.description_fr, original.description_en || original.description_fr || '',
    original.level, original.format, original.price, original.currency,
    original.duration_weeks, original.hours_total, original.max_capacity,
    original.prerequisites_ar, original.prerequisites_fr, original.prerequisites_en || original.prerequisites_fr || '',
    original.objectives_ar, original.objectives_fr, original.objectives_en || original.objectives_fr || '',
    original.schedule_info_ar, original.schedule_info_fr, original.schedule_info_en || original.schedule_info_fr || '',
    0
  );

  const newId = result.lastInsertRowid;
  const teachers = db.prepare('SELECT teacher_user_id FROM course_teachers WHERE course_id = ?').all(course_id);
  const assign = db.prepare('INSERT INTO course_teachers (course_id, teacher_user_id) VALUES (?, ?)');
  for (const t of teachers) {
    assign.run(newId, t.teacher_user_id);
  }

  res.json({ success: true, new_course_id: newId, slug: newSlug });
});

// -------------------------------------------------------------
// 4. Languages Routes
// -------------------------------------------------------------
app.get('/api/languages', (req, res) => {
  const publishedOnly = req.query.published_only === 'true';
  let query = `
    SELECT tl.*, 
      COUNT(DISTINCT c.id) as course_count,
      COUNT(DISTINCT ct.teacher_user_id) as teacher_count
    FROM teaching_languages tl
    LEFT JOIN courses c ON c.language_id = tl.id AND c.is_archived = 0
    LEFT JOIN course_teachers ct ON ct.course_id = c.id
    WHERE tl.is_archived = 0
  `;
  if (publishedOnly) query += ` AND tl.is_published = 1 `;
  query += ` GROUP BY tl.id ORDER BY tl.display_order ASC, tl.id ASC`;

  const languages = db.prepare(query).all();
  res.json({ languages });
});

// -------------------------------------------------------------
// 5. Enrollments Routes
// -------------------------------------------------------------
app.get('/api/enrollments', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const { status, course_id } = req.query;
  let query = `
    SELECT e.*,
      u.name as student_name, u.email as student_email, u.phone as student_phone,
      c.title_ar as course_title_ar, c.title_fr as course_title_fr, c.title_en as course_title_en,
      c.level as course_level, c.price as course_price,
      tl.name_fr as language_name_fr, tl.flag_emoji
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    JOIN courses c ON c.id = e.course_id
    JOIN teaching_languages tl ON tl.id = c.language_id
    WHERE 1=1
  `;
  const params = [];
  if (status && status !== 'all') { query += ` AND e.status = ? `; params.push(status); }
  if (course_id && course_id !== 'all') { query += ` AND e.course_id = ? `; params.push(course_id); }
  query += ` ORDER BY e.id DESC `;

  const enrollments = db.prepare(query).all(...params);
  res.json({ enrollments });
});

app.post('/api/enrollments', (req, res) => {
  const { course_id, student_name, student_email, student_phone, notes, preferred_schedule } = req.body;
  if (!course_id || !student_name || !student_email || !student_phone) {
    return res.status(400).json({ error: 'Informations requises manquantes' });
  }

  const course = db.prepare('SELECT id, price FROM courses WHERE id = ?').get(course_id);
  if (!course) return res.status(404).json({ error: 'Formation introuvable' });

  let student = db.prepare('SELECT id FROM users WHERE email = ?').get(student_email.toLowerCase().trim());
  if (!student) {
    const userRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, status)
      VALUES (?, ?, 'DISABLED_NO_LOGIN_ACCOUNT', 'student', ?, 'active')
    `).run(student_name.trim(), student_email.toLowerCase().trim(), student_phone.trim());
    student = { id: userRes.lastInsertRowid };
  }

  const insert = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, status, payment_status, amount_due, amount_paid, notes)
    VALUES (?, ?, 'new', 'pending', ?, 0, ?)
  `);
  const result = insert.run(student.id, course_id, course.price, preferred_schedule ? `[Horaire: ${preferred_schedule}] ${notes || ''}` : notes || '');

  res.json({ success: true, enrollment_id: result.lastInsertRowid });
});

app.put('/api/enrollments', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const { id, status, payment_status, notes } = req.body;
  if (!id) return res.status(400).json({ error: 'ID requis' });

  const updates = [];
  const values = [];
  if (status) { updates.push('status = ?'); values.push(status); }
  if (payment_status) { updates.push('payment_status = ?'); values.push(payment_status); }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

  if (updates.length > 0) {
    values.push(id);
    db.prepare(`UPDATE enrollments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// 6. Payments & Receipts Routes
// -------------------------------------------------------------
app.get('/api/payments', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const receipts = db.prepare(`
    SELECT pr.*,
      u.name as student_name, u.email as student_email, u.phone as student_phone,
      c.title_fr as course_title_fr, c.title_en as course_title_en,
      tl.name_fr as language_name_fr,
      admin.name as created_by_name
    FROM payment_receipts pr
    JOIN users u ON u.id = pr.student_id
    LEFT JOIN courses c ON c.id = pr.course_id
    LEFT JOIN teaching_languages tl ON tl.id = c.language_id
    LEFT JOIN users admin ON admin.id = pr.created_by_user_id
    ORDER BY pr.id DESC
  `).all();
  res.json({ receipts });
});

app.get('/api/payments/receipt/:id', (req, res) => {
  const receipt = db.prepare(`
    SELECT pr.*,
      u.name as student_name, u.email as student_email, u.phone as student_phone,
      c.title_ar as course_title_ar, c.title_fr as course_title_fr, c.title_en as course_title_en,
      c.level as course_level, c.format as course_format,
      tl.name_fr as language_name_fr, admin.name as created_by_name
    FROM payment_receipts pr
    JOIN users u ON u.id = pr.student_id
    LEFT JOIN courses c ON c.id = pr.course_id
    LEFT JOIN teaching_languages tl ON tl.id = c.language_id
    LEFT JOIN users admin ON admin.id = pr.created_by_user_id
    WHERE pr.id = ?
  `).get(req.params.id);

  if (!receipt) return res.status(404).json({ error: 'Reçu introuvable' });
  res.json({ receipt });
});

app.post('/api/payments', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const { enrollment_id, student_id, course_id, amount, payment_method, reference_number, notes } = req.body;
  if (!amount || (!student_id && !enrollment_id)) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  let finalStudentId = student_id;
  let finalCourseId = course_id;

  if (enrollment_id) {
    const enrollment = db.prepare('SELECT student_id, course_id, amount_due, amount_paid FROM enrollments WHERE id = ?').get(enrollment_id);
    if (enrollment) {
      finalStudentId = enrollment.student_id;
      finalCourseId = enrollment.course_id;
      const newPaid = (enrollment.amount_paid || 0) + Number(amount);
      const newStatus = newPaid >= enrollment.amount_due ? 'paid' : 'partially_paid';
      const enrollmentStatus = newPaid >= enrollment.amount_due ? 'confirmed' : 'awaiting_payment';
      db.prepare(`UPDATE enrollments SET amount_paid = ?, payment_status = ?, status = ? WHERE id = ?`).run(newPaid, newStatus, enrollmentStatus, enrollment_id);
    }
  }

  const year = new Date().getFullYear();
  const countRes = db.prepare('SELECT COUNT(*) as count FROM payment_receipts').get();
  const receiptNumber = `REC-${year}-${String((countRes?.count || 0) + 1).padStart(4, '0')}`;

  const insert = db.prepare(`
    INSERT INTO payment_receipts (receipt_number, enrollment_id, student_id, course_id, amount, currency, payment_method, reference_number, status, notes, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, 'DZD', ?, ?, 'paid', ?, ?)
  `);
  const result = insert.run(receiptNumber, enrollment_id || null, finalStudentId, finalCourseId || null, Number(amount), payment_method || 'baridimob', reference_number || null, notes || null, req.user.id);

  res.json({ success: true, receipt_id: result.lastInsertRowid, receipt_number: receiptNumber });
});

// -------------------------------------------------------------
// 7. Schedule & Attendance Routes
// -------------------------------------------------------------
app.get('/api/schedule', (req, res) => {
  const sessions = db.prepare(`
    SELECT cs.*, c.title_fr as course_title_fr, c.title_en as course_title_en, c.level as course_level, u.name as teacher_name, tl.flag_emoji
    FROM class_sessions cs
    JOIN courses c ON c.id = cs.course_id
    JOIN users u ON u.id = cs.teacher_id
    JOIN teaching_languages tl ON tl.id = c.language_id
    ORDER BY cs.start_time ASC
  `).all();
  res.json({ sessions });
});

// -------------------------------------------------------------
// 8. Staff Management Routes (Super Admin)
// -------------------------------------------------------------
app.get('/api/staff', requireRole(['super_admin']), (req, res) => {
  const staff = db.prepare(`
    SELECT id, name, email, role, phone, avatar, status, created_at, updated_at
    FROM users WHERE role IN ('super_admin', 'academy_admin') ORDER BY role ASC, id ASC
  `).all();
  res.json({ staff });
});

app.post('/api/staff', requireRole(['super_admin']), (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nom, email et mot de passe requis' });

  const assignedRole = role === 'super_admin' ? 'super_admin' : 'academy_admin';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar, status)
      VALUES (?, ?, ?, ?, ?, '/avatars/nadia.jpg', 'active')
    `).run(name.trim(), email.toLowerCase().trim(), passwordHash, assignedRole, phone || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
  }
});

// -------------------------------------------------------------
// 9. Inquiries, Students, Teachers, Reports
// -------------------------------------------------------------
app.get('/api/inquiries', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const inquiries = db.prepare(`SELECT * FROM contact_inquiries ORDER BY id DESC`).all();
  res.json({ inquiries });
});

app.post('/api/inquiries', (req, res) => {
  const { full_name, email, phone, preferred_language, course_id, subject, message } = req.body;
  if (!full_name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  const result = db.prepare(`
    INSERT INTO contact_inquiries (full_name, email, phone, preferred_language, course_id, subject, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
  `).run(full_name.trim(), email.toLowerCase().trim(), phone.trim(), preferred_language || 'fr', course_id || null, subject || 'Demande d\'information', message.trim());
  res.json({ success: true, id: result.lastInsertRowid });
});

app.get('/api/students', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const students = db.prepare(`SELECT id, name, email, phone, status, created_at FROM users WHERE role = 'student' ORDER BY id DESC`).all();
  res.json({ students });
});

app.get('/api/teachers', (req, res) => {
  const teachers = db.prepare(`SELECT id, name, email, phone, avatar FROM users WHERE role = 'teacher' AND status = 'active'`).all();
  res.json({ teachers });
});

app.get('/api/reports', requireRole(['super_admin', 'academy_admin']), (req, res) => {
  const revenueRow = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total_revenue, COUNT(*) as total_payments FROM payment_receipts WHERE status = 'paid'`).get();
  const studentsRow = db.prepare(`SELECT COUNT(DISTINCT student_id) as active_students FROM enrollments WHERE status IN ('accepted', 'confirmed')`).get();
  const enrollmentsRow = db.prepare(`SELECT COUNT(*) as active_enrollments FROM enrollments WHERE status NOT IN ('cancelled', 'completed')`).get();
  res.json({
    overview: {
      total_revenue: revenueRow.total_revenue,
      total_payments: revenueRow.total_payments,
      active_students: studentsRow.active_students,
      active_enrollments: enrollmentsRow.active_enrollments,
    },
  });
});

// -------------------------------------------------------------
// Start Server
// -------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Fassi7 Node.js Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌐 CORS allowed origin: ${FRONTEND_URL}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);
});
