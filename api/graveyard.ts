import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq } from 'drizzle-orm';
import { getDb, projects } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.approvalStatus, 'approved'), eq(projects.status, 'dead')));

    const result = rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description ?? undefined,
      url: row.url ?? undefined,
      guideUrl: row.guideUrl ?? undefined,
      nsProfileUrls: row.nsProfileUrls?.length ? row.nsProfileUrls : undefined,
      imageUrl: row.imageUrl ?? undefined,
      emoji: row.emoji ?? undefined,
      postMortem: row.postMortem ?? undefined,
      productImages: row.productImages?.length ? row.productImages : undefined,
      tags: row.tags?.length ? row.tags : undefined,
      addedAt: row.addedAt ?? undefined,
      locations: row.locations?.length ? row.locations : undefined,
      customCategory: row.customCategoryName
        ? { id: row.customCategoryId!, name: row.customCategoryName, color: row.customCategoryColor! }
        : undefined,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Fetch graveyard error:', error);
    return res.status(500).json({ error: 'Failed to fetch graveyard' });
  }
}
