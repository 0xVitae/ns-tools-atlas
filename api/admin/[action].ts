import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { getDb, projects, projectRequests, requestUpvotes } from '../_db.js';

// Columns that are arrays in the schema and need string→array conversion
const ARRAY_COLUMNS = new Set(['nsProfileUrls', 'productImages', 'tags']);

function coerceValue(column: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (ARRAY_COLUMNS.has(column)) {
    if (Array.isArray(value)) return value;
    return String(value).split(',').map(s => s.trim()).filter(Boolean);
  }
  return value;
}

function verifyAdmin(req: VercelRequest): boolean {
  const password = req.headers['x-admin-password'];
  const token = req.headers['x-admin-token'];
  const validPassword = password && password === process.env.ADMIN_PASSWORD;
  const validToken = token && token === process.env.ADMIN_TOKEN;
  return !!(validPassword || validToken);
}

async function handleData(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const [allProjects, allRequests, allUpvotes] = await Promise.all([
      db.select().from(projects),
      db.select().from(projectRequests),
      db.select().from(requestUpvotes),
    ]);

    return res.status(200).json({
      projects: allProjects,
      requests: allRequests,
      upvotes: allUpvotes,
    });
  } catch (error) {
    console.error('Admin data error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin data' });
  }
}

async function handleUpdate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { table, id, column, value, action } = req.body;

    if (!table || !id) {
      return res.status(400).json({ error: 'table and id are required' });
    }

    const db = getDb();

    if (action === 'delete') {
      if (table === 'projects') {
        await db.delete(projects).where(eq(projects.id, id));
      } else if (table === 'requests') {
        await db.delete(projectRequests).where(eq(projectRequests.id, id));
      } else {
        return res.status(400).json({ error: 'Cannot delete from this table' });
      }
      return res.status(200).json({ success: true });
    }

    if (!column) {
      return res.status(400).json({ error: 'column is required for updates' });
    }

    const coerced = coerceValue(column, value);

    if (table === 'projects') {
      if (!(column in projects)) {
        return res.status(400).json({ error: `Invalid column: ${column}` });
      }
      await db
        .update(projects)
        .set({ [column]: coerced } as any)
        .where(eq(projects.id, id));
    } else if (table === 'requests') {
      if (!(column in projectRequests)) {
        return res.status(400).json({ error: `Invalid column: ${column}` });
      }
      await db
        .update(projectRequests)
        .set({ [column]: coerced } as any)
        .where(eq(projectRequests.id, id));
    } else if (table === 'upvotes') {
      return res.status(400).json({ error: 'Upvotes table is not editable' });
    } else {
      return res.status(400).json({ error: 'Invalid table' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Admin update error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to update' });
  }
}

async function handleApprove(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

async function handlePending(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.approvalStatus, 'pending'));

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
    console.error('Fetch pending projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending projects' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.query.action) {
    case 'data':    return handleData(req, res);
    case 'update':  return handleUpdate(req, res);
    case 'approve': return handleApprove(req, res);
    case 'pending': return handlePending(req, res);
    default:        return res.status(404).json({ error: 'Not found' });
  }
}
