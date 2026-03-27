import { defineConfig } from 'drizzle-kit';

const isLocalDev = process.env.USE_LOCAL_DB === 'true';

export default defineConfig({
  schema: './api/_db.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: isLocalDev
      ? 'postgresql://postgres:postgres@localhost:5432/atlas'
      : process.env.DATABASE_URL!,
  },
});
