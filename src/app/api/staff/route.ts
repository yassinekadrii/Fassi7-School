import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

// GET /api/staff - List all secretary & admin accounts (Super Admin Owner only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin']);
    if (authError) {
      return NextResponse.json({ error: 'Accès réservé exclusivement au Propriétaire (Super Admin)' }, { status: 403 });
    }

    const db = getDb();
    const secretaries = db.prepare(`
      SELECT id, name, email, role, phone, avatar, status, created_at, updated_at
      FROM users
      WHERE role = 'academy_admin'
      ORDER BY id DESC
    `).all();

    const owner = db.prepare(`
      SELECT id, name, email, role, phone, avatar, status, created_at, updated_at
      FROM users
      WHERE role = 'super_admin'
      LIMIT 1
    `).get();

    return NextResponse.json({ secretaries, owner });
  } catch (error) {
    console.error('Error fetching staff accounts:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des comptes' }, { status: 500 });
  }
}

// POST /api/staff - Create a new Secretary account (Super Admin Owner only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin']);
    if (authError) {
      return NextResponse.json({ error: 'Seul le Super Admin (Propriétaire) peut créer des comptes pour le secrétariat' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Nom, adresse email et mot de passe sont obligatoires' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit comporter au moins 6 caractères' }, { status: 400 });
    }

    const db = getDb();

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return NextResponse.json({ error: 'Cette adresse email est déjà utilisée par un autre compte' }, { status: 409 });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
      VALUES (?, ?, ?, 'academy_admin', ?, '/avatars/nadia.jpg', 'active', datetime('now'), datetime('now'))
    `);

    const result = insert.run(
      name.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      phone?.trim() || '+213 550 00 00 00'
    );

    const newSecretary = db.prepare(`
      SELECT id, name, email, role, phone, avatar, status, created_at
      FROM users
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({
      success: true,
      message: 'Compte secrétaire créé avec succès !',
      secretary: newSecretary,
    });
  } catch (error) {
    console.error('Error creating secretary account:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la création du compte' }, { status: 500 });
  }
}
