import { EcosystemProject } from '@/types/ecosystem';
import { CATEGORIES } from '@/data/ecosystemData';

// Published CSV URL from Google Sheets (approved tab only)
const SHEETS_CSV_URL = import.meta.env.VITE_SHEETS_CSV_URL;

// Get valid category IDs from the JSON file
const getValidCategoryIds = () => CATEGORIES.map(c => c.id);

/**
 * Parse a CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Fetch approved projects from published Google Sheets CSV
 */
export async function fetchApprovedProjects(): Promise<EcosystemProject[]> {
  if (!SHEETS_CSV_URL) {
    console.warn('VITE_SHEETS_CSV_URL not configured, returning empty array');
    return [];
  }

  // Add cache-busting parameter to bypass Google's cache
  const urlWithCacheBuster = `${SHEETS_CSV_URL}${SHEETS_CSV_URL.includes('?') ? '&' : '?'}_cb=${Date.now()}`;

  const response = await fetch(urlWithCacheBuster, {
    cache: 'no-store', // Always fetch fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  const csv = await response.text();
  const lines = csv.split('\n').filter(line => line.trim());

  if (lines.length < 2) return []; // Header only or empty

  const projects: EcosystemProject[] = [];
  const validCategoryIds = getValidCategoryIds();

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const [id, name, category, description, url, guideUrl, imageUrl, emoji, productImagesRaw] = values;

    // Warn about unknown categories but don't skip them
    // This allows custom categories that have been added to the JSON
    if (!validCategoryIds.includes(category)) {
      console.warn(`Unknown category "${category}" for project "${name}" - may be a custom category`);
    }

    // Parse productImages from pipe-separated string (e.g., "img1.jpg|img2.jpg|img3.jpg")
    const productImages = productImagesRaw
      ? productImagesRaw.split('|').map(s => s.trim()).filter(Boolean)
      : undefined;

    if (id && name && category) {
      projects.push({
        id,
        name,
        category,
        description: description || undefined,
        url: url || undefined,
        guideUrl: guideUrl || undefined,
        imageUrl: imageUrl || undefined,
        emoji: emoji || undefined,
        productImages: productImages && productImages.length > 0 ? productImages : undefined,
      });
    }
  }

  return projects;
}

/**
 * Submit a new project to the pending sheet via API
 * Includes custom category data if the user is suggesting a new category
 */
export async function submitProject(
  project: Omit<EcosystemProject, 'id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Prepare submission data - include custom category info if present
    const submissionData = {
      ...project,
      // Convert productImages array to pipe-separated string for sheets
      productImages: project.productImages?.join('|') || undefined,
      // Flatten custom category for easier handling in sheets
      customCategoryName: project.customCategory?.name,
      customCategoryColor: project.customCategory?.color,
    };

    const response = await fetch('/api/submit-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Submission failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Submit project error:', error);
    return { success: false, error: 'Network error - please try again' };
  }
}
