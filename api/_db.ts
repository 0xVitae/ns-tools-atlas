import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, pgEnum, text, integer, primaryKey } from 'drizzle-orm/pg-core';

// --- Schema ---

export const statusEnum = pgEnum('project_status', ['active', 'dead']);
export const approvalStatusEnum = pgEnum('approval_status', ['approved', 'pending', 'rejected']);

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  url: text('url'),
  guideUrl: text('guide_url'),
  imageUrl: text('image_url'),
  emoji: text('emoji'),
  postMortem: text('post_mortem'),
  addedAt: text('added_at'),
  status: statusEnum('status').notNull().default('active'),
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  nsProfileUrls: text('ns_profile_urls').array(),
  productImages: text('product_images').array(),
  tags: text('tags').array(),
  customCategoryId: text('custom_category_id'),
  customCategoryName: text('custom_category_name'),
  customCategoryColor: text('custom_category_color'),
});

export const projectRequests = pgTable('project_requests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category'),
  submittedBy: text('submitted_by').notNull().default('Anonymous'),
  emoji: text('emoji'),
  upvotes: integer('upvotes').notNull().default(0),
  submittedAt: text('submitted_at'),
});

export const requestUpvotes = pgTable('request_upvotes', {
  requestId: text('request_id').notNull(),
  voterId: text('voter_id').notNull(),
}, (t) => [
  primaryKey({ columns: [t.requestId, t.voterId] }),
]);

// --- DB Connection ---

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}
