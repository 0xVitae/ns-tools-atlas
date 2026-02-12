import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { getDb, projects } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-admin-password'];
  const token = req.headers['x-admin-token'];
  const validPassword = password && password === process.env.ADMIN_PASSWORD;
  const validToken = token && token === process.env.ADMIN_TOKEN;
  if (!validPassword && !validToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id, action, updates } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Project id is required' });
    }
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }

    const db = getDb();

    if (action === 'reject') {
      await db
        .update(projects)
        .set({ approvalStatus: 'rejected' })
        .where(eq(projects.id, id));
      return res.status(200).json({ success: true });
    }

    // action === 'approve'
    const updateFields: Record<string, unknown> = {
      approvalStatus: 'approved',
    };

    if (updates) {
      if (updates.name) updateFields.name = updates.name.trim();
      if (updates.category) updateFields.category = updates.category.trim();
      if (updates.description !== undefined) updateFields.description = updates.description?.trim() || null;
      if (updates.url !== undefined) updateFields.url = updates.url?.trim() || null;
      if (updates.guideUrl !== undefined) updateFields.guideUrl = updates.guideUrl?.trim() || null;
      if (updates.emoji !== undefined) updateFields.emoji = updates.emoji || null;
      if (updates.imageUrl !== undefined) updateFields.imageUrl = updates.imageUrl?.trim() || null;
      if (updates.tags !== undefined) updateFields.tags = updates.tags?.length ? updates.tags : null;
      if (updates.nsProfileUrls !== undefined) updateFields.nsProfileUrls = updates.nsProfileUrls?.length ? updates.nsProfileUrls : null;
      if (updates.productImages !== undefined) updateFields.productImages = updates.productImages?.length ? updates.productImages : null;
      if (updates.customCategoryName !== undefined) {
        updateFields.customCategoryName = updates.customCategoryName || null;
        updateFields.customCategoryId = updates.customCategoryName ? updates.category?.trim() : null;
        updateFields.customCategoryColor = updates.customCategoryColor || null;
      }
    }

    await db
      .update(projects)
      .set(updateFields)
      .where(eq(projects.id, id));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Approve project error:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
}
