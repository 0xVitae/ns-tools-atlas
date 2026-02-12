import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './api/_db.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
