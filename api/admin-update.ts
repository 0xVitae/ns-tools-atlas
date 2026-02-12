import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { getDb, projects, projectRequests } from './_db.js';

// Columns that are arrays in the schema and need string→array conversion
const ARRAY_COLUMNS = new Set(['nsProfileUrls', 'productImages', 'tags']);

function coerceValue(column: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (ARRAY_COLUMNS.has(column)) {
    if (Array.isArray(value)) return value;
    // Convert comma-separated string to array
    return String(value).split(',').map(s => s.trim()).filter(Boolean);
  }
  return value;
}

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
