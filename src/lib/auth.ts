import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fassi7_secret_key_2026_super_secure';

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'academy_admin' | 'teacher' | 'student';
  phone?: string;
  avatar?: string;
  status: string;
}

export function signToken(user: UserSession): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('fassi7_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Verify against database
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, phone, avatar, status FROM users WHERE id = ?').get(payload.id) as any;

  if (!user || user.status !== 'active') return null;

  return user as UserSession;
}

export function requireRole(user: UserSession | null, allowedRoles: ('super_admin' | 'academy_admin' | 'teacher' | 'student')[]) {
  if (!user) {
    return { error: 'Non authentifié / غير مسجل', status: 401 };
  }
  if (!allowedRoles.includes(user.role)) {
    return { error: 'Accès refusé / غير مصرح لك بهذا الإجراء', status: 403 };
  }
  return null;
}
