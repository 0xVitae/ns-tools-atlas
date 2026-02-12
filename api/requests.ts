import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, projectRequests } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const rows = await db.select().from(projectRequests);

    const result = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category ?? undefined,
      submittedBy: row.submittedBy,
      upvotes: row.upvotes,
      emoji: row.emoji ?? undefined,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Fetch requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
}
