import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { getDb, projects } from './_db.js';

// Fields the project owner is allowed to edit
const EDITABLE_FIELDS = new Set([
  'description', 'url', 'guideUrl', 'imageUrl', 'emoji',
  'productImages', 'nsProfileUrls',
]);

const ARRAY_FIELDS = new Set(['productImages', 'nsProfileUrls']);

function parseArray(val: unknown): string[] | null {
  if (!val) return null;
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') return val.split('|').map(s => s.trim()).filter(Boolean);
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify JWT session
  const cookie = req.headers.cookie;
  const token = cookie?.split(';').map(c => c.trim()).find(c => c.startsWith('ns_session='))?.split('=').slice(1).join('=');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let nsUsername: string | null = null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    nsUsername = (payload.nsUsername as string) || null;
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  if (!nsUsername) {
    return res.status(403).json({ error: 'No NS profile linked to your account' });
  }

  const { projectId, updates } = req.body;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'projectId is required' });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'updates object is required' });
  }

  try {
    const db = getDb();

    // Fetch the project and verify ownership
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user's NS profile URL is in the project's nsProfileUrls
    const userProfileUrl = `https://ns.com/${nsUsername}`.toLowerCase();
    const projectUrls = (project.nsProfileUrls || []).map(u => u.toLowerCase());
    const isOwner = projectUrls.some(url => url === userProfileUrl || url === `https://www.ns.com/${nsUsername}`.toLowerCase());

    if (!isOwner) {
      return res.status(403).json({ error: 'You are not listed as a profile on this project' });
    }

    // Filter to only editable fields
    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!EDITABLE_FIELDS.has(key)) continue;
      safeUpdates[key] = ARRAY_FIELDS.has(key) ? parseArray(value) : (value || null);
    }

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await db.update(projects).set(safeUpdates as any).where(eq(projects.id, projectId));

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Edit project error:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
}
