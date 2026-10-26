import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published_only') === 'true';

    const db = getDb();
    let query = `
      SELECT tl.*, 
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT ct.teacher_user_id) as teacher_count
      FROM teaching_languages tl
      LEFT JOIN courses c ON c.language_id = tl.id AND c.is_archived = 0
      LEFT JOIN course_teachers ct ON ct.course_id = c.id
      WHERE tl.is_archived = 0
    `;

    if (publishedOnly) {
      query += ` AND tl.is_published = 1 `;
    }

    query += ` GROUP BY tl.id ORDER BY tl.display_order ASC, tl.id ASC`;

    const languages = db.prepare(query).all();
    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json({ error: 'Erreur de chargement des langues' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { code, name_ar, name_fr, name_en, slug, description_ar, description_fr, description_en, flag_emoji, display_order } = body;

    if (!code || !name_ar || !name_fr || !slug) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (code, noms, slug)' }, { status: 400 });
    }

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO teaching_languages (code, name_ar, name_fr, name_en, slug, description_ar, description_fr, description_en, flag_emoji, display_order, is_published, is_archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `);

    const result = insert.run(
      code.toLowerCase(),
      name_ar,
      name_fr,
      name_en || name_fr,
      slug.toLowerCase(),
      description_ar || '',
      description_fr || '',
      description_en || description_fr || '',
      flag_emoji || '🌐',
      display_order || 0
    );

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'CREATE_LANGUAGE', 'teaching_language', result.lastInsertRowid, `Added language ${name_fr} (${code})`);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    console.error('Error creating language:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Ce code ou slug de langue existe déjà' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création de la langue' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const authError = requireRole(user, ['super_admin', 'academy_admin']);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { id, code, name_ar, name_fr, name_en, slug, description_ar, description_fr, flag_emoji, display_order, is_published, is_archived } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE teaching_languages 
      SET code = COALESCE(?, code),
          name_ar = COALESCE(?, name_ar),
          name_fr = COALESCE(?, name_fr),
          name_en = COALESCE(?, name_en),
          slug = COALESCE(?, slug),
          description_ar = COALESCE(?, description_ar),
          description_fr = COALESCE(?, description_fr),
          flag_emoji = COALESCE(?, flag_emoji),
          display_order = COALESCE(?, display_order),
          is_published = COALESCE(?, is_published),
          is_archived = COALESCE(?, is_archived)
      WHERE id = ?
    `).run(code, name_ar, name_fr, name_en, slug, description_ar, description_fr, flag_emoji, display_order, is_published, is_archived, id);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user!.id, 'UPDATE_LANGUAGE', 'teaching_language', id, `Updated language ID ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating language:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
