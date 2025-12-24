import { EcosystemProject, CategoryType } from '@/types/ecosystem';

// Published CSV URL from Google Sheets (approved tab only)
const SHEETS_CSV_URL = import.meta.env.VITE_SHEETS_CSV_URL;

// Valid categories for validation
const VALID_CATEGORIES: CategoryType[] = [
  'networks', 'coworking', 'media-events', 'education',
  'local-vcs', 'global-vcs', 'accelerators', 'corporate',
  'public-entities', 'transport'
];

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

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const [id, name, category, description, url, imageUrl, emoji] = values;

    // Validate category
    if (!VALID_CATEGORIES.includes(category as CategoryType)) {
      console.warn(`Invalid category "${category}" for project "${name}", skipping`);
      continue;
    }

    if (id && name && category) {
      projects.push({
        id,
        name,
        category: category as CategoryType,
        description: description || undefined,
        url: url || undefined,
        imageUrl: imageUrl || undefined,
        emoji: emoji || undefined,
      });
    }
  }

  return projects;
}

/**
 * Submit a new project to the pending sheet via API
 */
export async function submitProject(
  project: Omit<EcosystemProject, 'id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/submit-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
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
