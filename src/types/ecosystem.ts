export interface EcosystemProject {
  id: string;
  name: string;
  category: CategoryType;
  imageUrl?: string;
  description?: string;
}

export type CategoryType =
  | 'networks'
  | 'coworking'
  | 'media-events'
  | 'education'
  | 'local-vcs'
  | 'global-vcs'
  | 'accelerators'
  | 'corporate'
  | 'public-entities';

export interface Category {
  id: CategoryType;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasState {
  projects: EcosystemProject[];
  categories: Category[];
  selectedProject: EcosystemProject | null;
  hoveredProject: string | null;
}
