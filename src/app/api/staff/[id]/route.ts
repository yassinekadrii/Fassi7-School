import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

// PUT /api/staff/[id] - Update secretary details, toggle status, or reset password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin']);
    if (authError) {
      return NextResponse.json({ error: 'Seul le Super Admin peut modifier les comptes' }, { status: 403 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(accountId) as { id: number; role: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    if (existing.role === 'super_admin' && user!.id !== accountId) {
      return NextResponse.json({ error: 'Impossible de modifier un autre Super Admin' }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, status, newPassword } = body;

    if (status && !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' }, { status: 400 });
    }

    if (newPassword) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(newPassword, salt);
      db.prepare(`
        UPDATE users 
        SET name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            status = COALESCE(?, status),
            password_hash = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(name?.trim() || null, phone?.trim() || null, status || null, passwordHash, accountId);
    } else {
      db.prepare(`
        UPDATE users 
        SET name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            status = COALESCE(?, status),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(name?.trim() || null, phone?.trim() || null, status || null, accountId);
    }

    const updated = db.prepare('SELECT id, name, email, role, phone, avatar, status, updated_at FROM users WHERE id = ?').get(accountId);

    return NextResponse.json({
      success: true,
      message: 'Compte mis à jour avec succès',
      secretary: updated,
    });
  } catch (error) {
    console.error('Error updating staff account:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE /api/staff/[id] - Delete a secretary account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin']);
    if (authError) {
      return NextResponse.json({ error: 'Seul le Super Admin peut supprimer un compte secrétaire' }, { status: 403 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const db = getDb();
    const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(accountId) as { id: number; role: string } | undefined;
    if (!target) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    if (target.role === 'super_admin') {
      return NextResponse.json({ error: 'Impossible de supprimer le compte Super Admin' }, { status: 403 });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(accountId);

    return NextResponse.json({
      success: true,
      message: 'Compte secrétaire supprimé avec succès',
    });
  } catch (error) {
    console.error('Error deleting staff account:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la suppression' }, { status: 500 });
  }
}
