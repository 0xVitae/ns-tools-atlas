import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SignJWT, jwtVerify } from 'jose';

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

const callbackUri = `${baseUrl}/api/auth/callback`;

function handleDiscord(_req: VercelRequest, res: VercelResponse) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: callbackUri,
    response_type: 'code',
    scope: 'identify',
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
}

async function handleCallback(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.redirect('/?error=missing_code');
  }

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Discord token exchange failed:', await tokenRes.text());
      return res.redirect('/?error=discord_auth_failed');
    }

    const { access_token } = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      return res.redirect('/?error=discord_user_failed');
    }

    const discordUser = await userRes.json();

    const nsRes = await fetch('https://api.ns.com/api/v1/ns-auth/verify/', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.NS_AUTH_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ discordId: discordUser.id }),
    });

    if (!nsRes.ok) {
      const nsBody = await nsRes.text();
      console.error('NS Auth verify failed:', nsRes.status, nsBody);
      return res.redirect(`/?error=ns_verify_failed&status=${nsRes.status}`);
    }

    const nsData = await nsRes.json();

    if (!nsData.member) {
      return res.redirect('/?error=not_member');
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({
      discordId: discordUser.id,
      username: nsData.discordUsername || discordUser.username,
      avatar: discordUser.avatar,
      name: nsData.name || discordUser.global_name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret);

    res.setHeader('Set-Cookie', `ns_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${baseUrl.startsWith('https') ? '; Secure' : ''}`);
    res.redirect('/');
  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect('/?error=auth_failed');
  }
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
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

function handleLogout(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', 'ns_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.redirect('/');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action;

  switch (action) {
    case 'discord':   return handleDiscord(req, res);
    case 'callback':  return handleCallback(req, res);
    case 'me':        return handleMe(req, res);
    case 'logout':    return handleLogout(req, res);
    default:          return res.status(404).json({ error: 'Not found' });
  }
}
