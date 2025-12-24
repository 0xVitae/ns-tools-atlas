export type ProjectTag = 'nsOfficial' | 'free' | 'paid';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface CustomCategory {
  id: string;           // generated slug from name (e.g., "tech-hubs")
  name: string;         // user-provided display name
  color: string;        // auto-assigned from available colors
}

export interface EcosystemProject {
  id: string;
  name: string;
  category: string;     // category ID (validated against categories.json)
  imageUrl?: string;
  emoji?: string;
  description?: string;
  url?: string;
  guideUrl?: string;    // Link to a guide/documentation
  nsProfileUrls?: string[];  // Array of NS profile URLs
  productImages?: string[];  // Array of product image URLs (max 3)
  customCategory?: CustomCategory;  // Present when suggesting a new category
  tags?: ProjectTag[];  // Tags for filtering and display (nsOfficial, free, paid)
}

export interface CanvasState {
  projects: EcosystemProject[];
  categories: Category[];
  selectedProject: EcosystemProject | null;
  hoveredProject: string | null;
}
