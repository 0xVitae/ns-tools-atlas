import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, projectRequests, requestUpvotes } from './_db.js';
import { eq, and, sql, count } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, voterId } = req.body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Request ID is required' });
    }
    if (!voterId || typeof voterId !== 'string' || voterId.trim().length === 0) {
      return res.status(400).json({ error: 'Voter ID is required' });
    }

    const db = getDb();
    const requestId = id.trim();
    const vid = voterId.trim();

    // Check if this voter already upvoted
    const existing = await db
      .select()
      .from(requestUpvotes)
      .where(and(eq(requestUpvotes.requestId, requestId), eq(requestUpvotes.voterId, vid)));

    if (existing.length > 0) {
      // Remove upvote
      await db
        .delete(requestUpvotes)
        .where(and(eq(requestUpvotes.requestId, requestId), eq(requestUpvotes.voterId, vid)));
    } else {
      // Add upvote
      await db.insert(requestUpvotes).values({ requestId, voterId: vid });
    }

    // Recount and update the cached upvotes column
    const [{ value }] = await db
      .select({ value: count() })
      .from(requestUpvotes)
      .where(eq(requestUpvotes.requestId, requestId));

    const result = await db
      .update(projectRequests)
      .set({ upvotes: value })
      .where(eq(projectRequests.id, requestId))
      .returning({ upvotes: projectRequests.upvotes });

    if (result.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json({
      success: true,
      upvotes: result[0].upvotes,
      voted: existing.length === 0,
    });
  } catch (error) {
    console.error('Upvote error:', error);
    return res.status(500).json({ error: 'Failed to upvote' });
  }
}
