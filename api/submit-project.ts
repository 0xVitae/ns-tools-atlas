import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, projects } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, category, description, url, guideUrl, nsProfileUrls, imageUrl, emoji, productImages, tags, customCategoryName, customCategoryColor, plans } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toISOString();

    // Parse pipe-separated strings from frontend into arrays
    const parseArray = (val: unknown): string[] | null => {
      if (!val) return null;
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'string') return val.split('|').map(s => s.trim()).filter(Boolean);
      return null;
    };

    const db = getDb();
    await db.insert(projects).values({
      id,
      name: name.trim(),
      category: category.trim(),
      description: description?.trim() || null,
      url: url?.trim() || null,
      guideUrl: guideUrl?.trim() || null,
      imageUrl: imageUrl || null,
      emoji: emoji || null,
      nsProfileUrls: parseArray(nsProfileUrls),
      productImages: parseArray(productImages),
      tags: parseArray(tags),
      addedAt: submittedAt,
      status: 'active',
      approvalStatus: 'pending',
      customCategoryId: customCategoryName ? category : null,
      customCategoryName: customCategoryName || null,
      customCategoryColor: customCategoryColor || null,
      plans: plans ? JSON.stringify(plans) : null,
      locations: ['1.3356,103.5943'], // Default: NS HQ, Forest City Marina Hotel, Malaysia
    });

    // Fire-and-forget Telegram notification
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      const adminToken = process.env.ADMIN_TOKEN;
      if (botToken && chatId) {
        const desc = description?.trim()
          ? description.trim().length > 120
            ? description.trim().slice(0, 120) + '…'
            : description.trim()
          : 'No description';
        const loginUrl = adminToken
          ? `\nhttps://nstools.xyz/pending?token=${adminToken}`
          : '';
        const text =
          `<b>New submission:</b> ${name.trim()}\n` +
          `<b>Category:</b> ${category.trim()}\n` +
          `<b>Description:</b> ${desc}` +
          (loginUrl ? `\n\n<a href="${loginUrl.trim()}">Review now →</a>` : '');
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        }).catch(() => {});
      }
    } catch {
      // Never block submission response
    }

    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error('Submit project error:', error);
    return res.status(500).json({ error: 'Failed to submit project' });
  }
}
