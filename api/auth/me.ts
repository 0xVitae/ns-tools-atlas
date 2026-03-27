import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jwtVerify } from 'jose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookie = req.headers.cookie;
  const token = cookie?.split(';').map(c => c.trim()).find(c => c.startsWith('ns_session='))?.split('=').slice(1).join('=');

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return res.json({
      authenticated: true,
      user: {
        discordId: payload.discordId,
        username: payload.username,
        avatar: payload.avatar,
        name: payload.name,
      },
    });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}
