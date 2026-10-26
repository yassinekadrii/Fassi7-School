import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db.js';
import { requireRole } from '../lib/auth.js';

export default async function staffRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // Super Admin only for all staff management endpoints
  fastify.addHook('preHandler', requireRole(['super_admin']));

  // GET staff list
  fastify.get('/', async (request, reply) => {
    const staff = db.prepare(`
      SELECT id, name, email, role, phone, avatar, status, created_at, updated_at
      FROM users 
      WHERE role IN ('super_admin', 'academy_admin')
      ORDER BY role ASC, id ASC
    `).all();

    return reply.send({ staff });
  });

  // POST create secretary/admin account
  fastify.post('/', async (request, reply) => {
    const adminUser = (request as any).user;
    const body = request.body as any;
    const { name, email, password, phone, role } = body;

    if (!name || !email || !password) {
      return reply.status(400).send({ error: 'Nom, email et mot de passe sont obligatoires' });
    }

    const assignedRole = role === 'super_admin' ? 'super_admin' : 'academy_admin';

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return reply.status(409).send({ error: 'Un compte avec cette adresse email existe déjà' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    const defaultAvatar = assignedRole === 'super_admin' ? '/avatars/admin.jpg' : '/avatars/nadia.jpg';
    const result = insert.run(name.trim(), email.toLowerCase().trim(), passwordHash, assignedRole, phone || null, defaultAvatar);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(adminUser.id, 'CREATE_STAFF_ACCOUNT', 'user', result.lastInsertRowid, `Created ${assignedRole} account for ${email}`);

    return reply.send({
      success: true,
      id: result.lastInsertRowid,
      message: `Compte ${assignedRole === 'super_admin' ? 'Super Admin' : 'Secrétaire (Admin)'} créé avec succès`,
    });
  });

  // PUT update staff
  fastify.put('/:id', async (request, reply) => {
    const adminUser = (request as any).user;
    const { id } = request.params as any;
    const body = request.body as any;
    const { name, phone, status, password } = body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!existing) {
      return reply.status(404).send({ error: 'Utilisateur introuvable' });
    }

    if (existing.id === adminUser.id && status === 'suspended') {
      return reply.status(400).send({ error: 'Vous ne pouvez pas suspendre votre propre compte' });
    }

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (password && password.trim().length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(adminUser.id, 'UPDATE_STAFF_ACCOUNT', 'user', id, `Updated staff account ${existing.email}`);

    return reply.send({ success: true, message: 'Compte mis à jour avec succès' });
  });
}
