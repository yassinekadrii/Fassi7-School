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
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim()) as any;

    if (!user) {
      return NextResponse.json({ error: 'Identifiants incorrects ou compte introuvable' }, { status: 401 });
    }

    // Allow Owner (super_admin), Secretary (academy_admin), and Teachers to log in
    if (user.role !== 'super_admin' && user.role !== 'academy_admin' && user.role !== 'teacher' && user.role !== 'student') {
      return NextResponse.json({
        error: 'Rôle non autorisé à se connecter sur ce portail.'
      }, { status: 403 });
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      return NextResponse.json({
        error: 'Ce compte est inactif ou suspendu. Veuillez contacter l\'administration.'
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

    let redirectUrl = '/dashboard';
    if (user.role === 'teacher') {
      redirectUrl = '/portal/teacher';
    } else if (user.role === 'student') {
      redirectUrl = '/portal/student';
    }

    const response = NextResponse.json({ user: userSession, redirectUrl, success: true });
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
