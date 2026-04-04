export type ProjectTag = 'nsOfficial' | 'free' | 'paid';

export type ProjectStatus = 'active' | 'dead';

export interface ProjectRequest {
  id: string;
  name: string;
  description: string;
  category?: string;
  submittedBy: string;
  upvotes: number;
  emoji?: string;
}

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

export interface ProductPlan {
  name: string;
  price: string;
  interval?: string;
  description: string;
  url?: string;
  features: string[];
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
  status?: ProjectStatus;  // Project status (active by default, dead for graveyard)
  postMortem?: string;     // Post-mortem / reason for shutdown (graveyard only)
  addedAt?: string;        // Date the project was added
  locations?: string[];    // Array of "lat,lon" coordinate strings
  plans?: ProductPlan[];   // Products / pricing plans
}

export interface CanvasState {
  projects: EcosystemProject[];
  categories: Category[];
  selectedProject: EcosystemProject | null;
  hoveredProject: string | null;
}
