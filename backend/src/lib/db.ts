import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbRelPath = process.env.DATABASE_PATH || '../fassi7.db';
  const dbPath = path.resolve(process.cwd(), dbRelPath);

  // Ensure parent directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Verify critical tables exist or apply migrations
  try { dbInstance.exec(`ALTER TABLE teaching_languages ADD COLUMN description_en TEXT`); } catch (_) {}
  try { dbInstance.exec(`ALTER TABLE courses ADD COLUMN title_en TEXT`); } catch (_) {}
  try { dbInstance.exec(`ALTER TABLE courses ADD COLUMN description_en TEXT`); } catch (_) {}
  try { dbInstance.exec(`ALTER TABLE courses ADD COLUMN prerequisites_en TEXT`); } catch (_) {}
  try { dbInstance.exec(`ALTER TABLE courses ADD COLUMN objectives_en TEXT`); } catch (_) {}
  try { dbInstance.exec(`ALTER TABLE courses ADD COLUMN schedule_info_en TEXT`); } catch (_) {}

  return dbInstance;
}
