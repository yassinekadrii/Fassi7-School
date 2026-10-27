import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken, UserSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { role } = await request.json();
    const db = getDb();

    let email = 'admin@fassi7.com';
    if (role === 'academy_admin') {
      // Find active secretary account
      const sec = db.prepare("SELECT email FROM users WHERE role = 'academy_admin' AND status = 'active' ORDER BY id ASC LIMIT 1").get() as { email: string } | undefined;
      email = sec?.email || 'nadia@fassi7.com';
    } else if (role === 'teacher') {
      const tch = db.prepare("SELECT email FROM users WHERE role = 'teacher' AND status = 'active' ORDER BY id ASC LIMIT 1").get() as { email: string } | undefined;
      email = tch?.email || 'sarah@fassi7.com';
    } else if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Rôle non autorisé pour connexion' }, { status: 403 });
    }

    const user = db.prepare('SELECT id, name, email, role, phone, avatar, status FROM users WHERE email = ?').get(email) as UserSession | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const token = signToken(user);
    const response = NextResponse.json({ user, success: true });
    response.cookies.set('fassi7_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Quick login error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
