import { Category, CategoryType } from '@/types/ecosystem';

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  'networks': '#3B82F6',
  'coworking': '#A855F7',
  'media-events': '#EC4899',
  'education': '#10B981',
  'local-vcs': '#F59E0B',
  'global-vcs': '#F97316',
  'accelerators': '#0EA5E9',
  'corporate': '#8B5CF6',
  'public-entities': '#22C55E',
  'transport': '#EF4444',
};

export const CATEGORIES: Category[] = [
  { id: 'networks', name: 'Networks', color: CATEGORY_COLORS['networks'], x: 20, y: 20, width: 200, height: 180 },
  { id: 'coworking', name: 'Coworking', color: CATEGORY_COLORS['coworking'], x: 20, y: 210, width: 200, height: 160 },
  { id: 'media-events', name: 'Media & Events', color: CATEGORY_COLORS['media-events'], x: 20, y: 380, width: 200, height: 200 },
  { id: 'education', name: 'Education', color: CATEGORY_COLORS['education'], x: 20, y: 590, width: 200, height: 180 },
  { id: 'local-vcs', name: 'Local VCs', color: CATEGORY_COLORS['local-vcs'], x: 240, y: 20, width: 260, height: 340 },
  { id: 'corporate', name: 'Corporate', color: CATEGORY_COLORS['corporate'], x: 240, y: 370, width: 260, height: 160 },
  { id: 'public-entities', name: 'Public Entities', color: CATEGORY_COLORS['public-entities'], x: 240, y: 540, width: 260, height: 110 },
  { id: 'global-vcs', name: 'Global VCs', color: CATEGORY_COLORS['global-vcs'], x: 520, y: 20, width: 220, height: 280 },
  { id: 'accelerators', name: 'Accelerators', color: CATEGORY_COLORS['accelerators'], x: 520, y: 310, width: 220, height: 340 },
  { id: 'transport', name: 'Transport', color: CATEGORY_COLORS['transport'], x: 240, y: 660, width: 260, height: 110 },
];

// INITIAL_PROJECTS has been migrated to Google Sheets.
// Copy this data to your Google Sheet "approved" tab if starting fresh.
// Sheet columns: id | name | category | description | url | imageUrl | emoji | addedAt
//
// Example data for migration:
// n1, NS Tech Alliance, networks, Provincial tech network, , , ,
// n2, Startup Canada, networks, National startup community, , , ,
// ... (see git history for full list)
