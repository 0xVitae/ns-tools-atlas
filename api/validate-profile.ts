import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  const { url } = req.body;

  // Validate input
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ valid: false, error: 'URL is required' });
  }

  // Parse and validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ valid: false, error: 'Invalid URL format' });
  }

  // Ensure it's an ns.com URL (security check)
  const hostname = parsedUrl.hostname.toLowerCase();
  if (hostname !== 'ns.com' && !hostname.endsWith('.ns.com')) {
    return res.status(400).json({ valid: false, error: 'URL must be from ns.com' });
  }

  try {
    // Make HEAD request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'NS-Startup-Atlas/1.0 (Profile Validator)',
        },
        redirect: 'follow',
      });
    } catch (headError) {
      // Some servers block HEAD requests, fall back to GET
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'NS-Startup-Atlas/1.0 (Profile Validator)',
        },
        redirect: 'follow',
      });
    }

    clearTimeout(timeoutId);

    // Check response status
    if (response.ok) {
      return res.status(200).json({ valid: true });
    } else if (response.status === 404) {
      return res.status(200).json({ valid: false, error: 'Profile not found' });
    } else {
      return res.status(200).json({ valid: false, error: `Server returned ${response.status}` });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(200).json({ valid: false, error: 'Request timed out' });
    }
    console.error('Profile validation error:', error);
    return res.status(200).json({ valid: false, error: 'Could not verify profile' });
  }
}
