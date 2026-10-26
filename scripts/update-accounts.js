const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'fassi7.db');
const db = new Database(dbPath);

console.log('--- Current users before update ---');
console.log(db.prepare('SELECT id, name, email, role, status FROM users').all());

// Set password_hash to disabled for any account that is not super_admin or academy_admin
db.prepare(`
  UPDATE users 
  SET password_hash = 'DISABLED_NO_LOGIN_ACCOUNT' 
  WHERE role NOT IN ('super_admin', 'academy_admin')
`).run();

console.log('\n--- Accounts after disabling non-admin logins ---');
console.log(db.prepare("SELECT id, name, email, role, status, (password_hash = 'DISABLED_NO_LOGIN_ACCOUNT') as is_disabled FROM users").all());

// Check secretary accounts
console.log('\n--- Active Secretary / Admin Accounts ---');
console.log(db.prepare("SELECT id, name, email, role, status FROM users WHERE role = 'academy_admin'").all());
