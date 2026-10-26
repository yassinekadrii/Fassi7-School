import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fassi7_fastify_backend_secret_key_2026_super_secure';

export interface AuthUser {
  id: number;
  email: string;
  role: 'super_admin' | 'academy_admin' | 'teacher' | 'student';
  name: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: FastifyRequest): Promise<AuthUser | null> {
  // Check authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) return user;
  }

  // Check cookies
  const cookieToken = req.cookies?.fassi7_token;
  if (cookieToken) {
    const user = verifyToken(cookieToken);
    if (user) return user;
  }

  return null;
}

export function requireRole(allowedRoles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return reply.status(401).send({ error: 'Non authentifié. Veuillez vous connecter.' });
    }
    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({ error: 'Accès interdit pour votre profil.' });
    }
    (req as any).user = user;
  };
}
