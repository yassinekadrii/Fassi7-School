const db = require('better-sqlite3')('fassi7.db');

console.log({
  students: db.prepare("SELECT count(*) as c FROM users WHERE role = 'student'").get(),
  teachers: db.prepare("SELECT count(*) as c FROM users WHERE role = 'teacher'").get(),
  courses: db.prepare("SELECT count(*) as c FROM courses").get(),
  enrollments: db.prepare("SELECT count(*) as c FROM enrollments").get(),
  payments: db.prepare("SELECT count(*) as c FROM payments").get(),
  class_sessions: db.prepare("SELECT count(*) as c FROM class_sessions").get(),
  inquiries: db.prepare("SELECT count(*) as c FROM contact_inquiries").get(),
});
