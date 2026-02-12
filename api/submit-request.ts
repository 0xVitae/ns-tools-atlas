import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, projectRequests } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, description, category, submittedBy, emoji } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toISOString();

    const db = getDb();
    await db.insert(projectRequests).values({
      id,
      name: name.trim(),
      description: description.trim(),
      category: category?.trim() || null,
      submittedBy: submittedBy?.trim() || 'Anonymous',
      emoji: emoji || null,
      upvotes: 0,
      submittedAt,
    });

    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error('Submit request error:', error);
    return res.status(500).json({ error: 'Failed to submit request' });
  }
}
