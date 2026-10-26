import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, UserSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 });
    }

    // Only Owner (Super Admin) and Secretary (Admin) accounts can log in
    if (user.role !== 'super_admin' && user.role !== 'academy_admin') {
      return NextResponse.json({
        error: 'Accès réservé exclusivement aux comptes administratifs (Direction et Secrétariat).'
      }, { status: 403 });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    const userSession: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
    };

    const token = signToken(userSession);

    const response = NextResponse.json({ user: userSession, success: true });
    response.cookies.set('fassi7_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur interne de serveur' }, { status: 500 });
  }
}
