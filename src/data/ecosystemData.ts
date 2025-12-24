import { Category, EcosystemProject } from '@/types/ecosystem';
import categoriesData from './categories.json';

// Base categories from JSON (bundled at build time)
export const BASE_CATEGORIES: Category[] = categoriesData;

// For backwards compatibility
export const CATEGORIES = BASE_CATEGORIES;

// Colors available for new custom categories (distinct from existing category colors)
export const CUSTOM_CATEGORY_COLORS: string[] = [
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F43F5E', // rose
  '#84CC16', // lime
  '#06B6D4', // cyan
  '#D946EF', // fuchsia
  '#FB923C', // orange (lighter)
  '#4ADE80', // green (lighter)
  '#38BDF8', // sky (lighter)
  '#A78BFA', // violet (lighter)
];

/**
 * Convert a category slug to a display name
 * "tech-hubs" -> "Tech Hubs"
 */
function formatCategoryName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the next available color for a new category
 * Uses a simple hash of the category name to pick a consistent color
 */
export function getColorForNewCategory(categoryId: string): string {
  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = ((hash << 5) - hash) + categoryId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % CUSTOM_CATEGORY_COLORS.length;
  return CUSTOM_CATEGORY_COLORS[index];
}

/**
 * Build complete category list dynamically from projects data
 * Merges base categories with any new categories found in projects
 */
export function buildCategoriesFromProjects(projects: EcosystemProject[]): Category[] {
  // Start with base categories
  const categoryMap = new Map<string, Category>();
  BASE_CATEGORIES.forEach(c => categoryMap.set(c.id, c));

  // Add any new categories found in projects
  projects.forEach(p => {
    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, {
        id: p.category,
        name: formatCategoryName(p.category),
        color: getColorForNewCategory(p.category),
      });
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Get the color for a category by ID
 * Falls back to hash-based color for unknown categories
 */
export function getCategoryColor(categoryId: string): string {
  const cat = BASE_CATEGORIES.find(c => c.id === categoryId);
  return cat?.color ?? getColorForNewCategory(categoryId);
}

/**
 * Get the display name for a category by ID
 * Falls back to formatted slug for unknown categories
 */
export function getCategoryName(categoryId: string): string {
  const cat = BASE_CATEGORIES.find(c => c.id === categoryId);
  return cat?.name ?? formatCategoryName(categoryId);
}

/**
 * Generate a URL-safe slug from a category name
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate a URL-safe slug from a project name
 */
export function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
