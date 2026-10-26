import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDb } from '../lib/db.js';
import { requireRole } from '../lib/auth.js';

export default async function languagesRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const db = getDb();

  // GET languages
  fastify.get('/', async (request, reply) => {
    const queryParams = request.query as any;
    const publishedOnly = queryParams.published_only === 'true';

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
    return reply.send({ languages });
  });

  // POST create language
  fastify.post('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const body = request.body as any;
    const { code, name_ar, name_fr, name_en, slug, description_ar, description_fr, description_en, flag_emoji, display_order } = body;

    if (!code || !name_ar || !name_fr || !slug) {
      return reply.status(400).send({ error: 'Champs obligatoires manquants (code, noms, slug)' });
    }

    try {
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

      db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
        .run(user.id, 'CREATE_LANGUAGE', 'teaching_language', result.lastInsertRowid, `Added language ${name_fr} (${code})`);

      return reply.send({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.status(409).send({ error: 'Ce code ou slug de langue existe déjà' });
      }
      return reply.status(500).send({ error: 'Erreur lors de la création de la langue' });
    }
  });

  // PUT update language
  fastify.put('/', { preHandler: [requireRole(['super_admin', 'academy_admin'])] }, async (request, reply) => {
    const user = (request as any).user;
    const body = request.body as any;
    const { id, ...fields } = body;

    if (!id) {
      return reply.status(400).send({ error: 'ID requis' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(fields)) {
      if (key !== 'id') {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE teaching_languages SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'UPDATE_LANGUAGE', 'teaching_language', id, `Updated language ID ${id}`);

    return reply.send({ success: true });
  });
}
