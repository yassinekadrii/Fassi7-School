import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db.js';
import { signToken, getCurrentUser } from '../lib/auth.js';

export default async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email et mot de passe requis' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
    if (!user) {
      return reply.status(401).send({ error: 'Identifiants incorrects' });
    }

    if (user.status !== 'active') {
      return reply.status(403).send({ error: 'Ce compte est suspendu ou inactif' });
    }

    if (user.password_hash === 'DISABLED_NO_LOGIN_ACCOUNT') {
      return reply.status(403).send({ error: 'La connexion directe pour ce profil est désactivée. Veuillez contacter le secrétariat.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Identifiants incorrects' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    reply.setCookie('fassi7_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.send({
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

  // Quick Login (Testing)
  fastify.post('/quick-login', async (request, reply) => {
    const { role } = request.body as any;
    const allowedRoles = ['super_admin', 'academy_admin'];

    if (!allowedRoles.includes(role)) {
      return reply.status(400).send({ error: 'Rôle non autorisé pour la démo' });
    }

    const user = db.prepare('SELECT * FROM users WHERE role = ? AND status = "active" LIMIT 1').get(role) as any;
    if (!user) {
      return reply.status(404).send({ error: 'Utilisateur de démo introuvable' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    reply.setCookie('fassi7_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.send({
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

  // Current User
  fastify.get('/me', async (request, reply) => {
    const authUser = await getCurrentUser(request);
    if (!authUser) {
      return reply.status(401).send({ error: 'Non authentifié' });
    }

    const user = db.prepare('SELECT id, name, email, role, phone, avatar, status FROM users WHERE id = ?').get(authUser.id);
    return reply.send({ user });
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('fassi7_token', { path: '/' });
    return reply.send({ success: true, message: 'Déconnexion réussie' });
  });
}
