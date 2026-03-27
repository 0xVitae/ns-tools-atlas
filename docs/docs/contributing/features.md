---
sidebar_position: 3
sidebar_label: "New Features"
---

# Contributing New Features

Adding a feature end-to-end means touching the database schema, API, and frontend. Here's how the pieces fit together.

## The data pipeline

Every feature follows this path:

```
Schema (api/_db.ts)
  → API endpoint (api/*.ts)
    → API client (src/lib/api.ts)
      → React Query hook (src/hooks/useProjects.ts)
        → Component (src/components/ or src/pages/)
```

## Adding an API endpoint

Each serverless function is a single file in `api/`. Create a new file:

```typescript
// api/my-endpoint.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, projects } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  // your logic here
  return res.json({ data: result });
}
```

If your endpoint needs admin access, check the auth header:

```typescript
const password = req.headers['x-admin-password'];
const token = req.headers['x-admin-token'];
if (password !== process.env.ADMIN_PASSWORD && token !== process.env.ADMIN_TOKEN) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## Adding a database field

1. Add the column to the table definition in `api/_db.ts`
2. Run `pnpm db:push` to apply the schema change to your local database
3. Update types in `src/types/ecosystem.ts` if needed

## Wiring up the frontend

1. Add a fetch function in `src/lib/api.ts`
2. Create or extend a hook in `src/hooks/useProjects.ts`
3. Use the hook in your component

## API endpoints & database schema

See the [README](https://github.com/0xVitae/ns-tools-atlas#project-structure) for the full project structure, and check `api/_db.ts` for the current schema. All endpoints live in `api/` — one file per endpoint. Admin endpoints require `x-admin-password` or `x-admin-token` headers.
