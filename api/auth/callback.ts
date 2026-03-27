import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SignJWT } from 'jose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.redirect('/?error=missing_code');
  }

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/callback`;

  try {
    // Exchange code for Discord access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Discord token exchange failed:', await tokenRes.text());
      return res.redirect('/?error=discord_auth_failed');
    }

    const { access_token } = await tokenRes.json();

    // Get Discord user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      return res.redirect('/?error=discord_user_failed');
    }

    const discordUser = await userRes.json();

    // Verify NS membership
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

    // Create JWT
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

    // Set cookie and redirect home
    res.setHeader('Set-Cookie', `ns_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${baseUrl.startsWith('https') ? '; Secure' : ''}`);
    res.redirect('/');
  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect('/?error=auth_failed');
  }
}
