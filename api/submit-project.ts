import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

// Environment variables (set in Vercel dashboard)
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const PENDING_SHEET_NAME = 'pending';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check required env vars
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
    console.error('Missing required environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { name, category, description, url, guideUrl, imageUrl, emoji, productImages, customCategoryName, customCategoryColor } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    // Category must be a non-empty string (can be existing or new custom category)
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Initialize Google Sheets client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Generate unique ID
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toISOString();

    // Append row to pending sheet
    // If it's a new category, prefix with ⭐ NEW: so admin can easily spot it
    const categoryValue = customCategoryName ? `⭐ NEW: ${category}` : category;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${PENDING_SHEET_NAME}!A:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          id,
          name.trim(),
          categoryValue,
          description?.trim() || '',
          url?.trim() || '',
          guideUrl?.trim() || '',
          imageUrl || '',
          emoji || '',
          productImages || '',  // Pipe-separated URLs (e.g., "img1.jpg|img2.jpg|img3.jpg")
          submittedAt,
        ]],
      },
    });

    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error('Submit project error:', error);
    return res.status(500).json({ error: 'Failed to submit project' });
  }
}
