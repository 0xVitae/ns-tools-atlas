import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, projects, projectRequests, requestUpvotes } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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
