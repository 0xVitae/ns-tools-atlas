---
name: contributing
description: "Guide for contributing to ns-tools-atlas. Use when the user wants to add features, fix bugs, understand the codebase, or contribute to the Network School tool Atlas project. Triggers on 'contribute', 'how does this work', 'project structure', 'add a feature', 'add an endpoint', 'add a page', or general onboarding questions about this repo."
---

# Contributing to NS Tools Atlas

You are helping a developer contribute to **ns-tools-atlas**, an interactive ecosystem visualization of tools in the Network School community. Use this guide to understand the codebase and give accurate, contextual answers.

## Quick Start

```bash
pnpm install
pnpm dev:vercel    # Local dev with Vercel serverless functions (recommended)
pnpm dev           # Vite-only dev server (no API routes)
```

Requires a `.env` file with: `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. See `.env.example`.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui
- **State:** TanStack React Query (server state), React hooks (local state)
- **Visualization:** D3 Force simulation (canvas), Konva, Recharts
- **Backend:** Vercel serverless functions (TypeScript in `api/`)
- **Database:** Neon PostgreSQL via Drizzle ORM
- **Deployment:** Vercel with SPA routing
- **Package manager:** pnpm

## Project Structure

```
src/
├── pages/              # Route pages
│   ├── Index.tsx        # Main ecosystem visualization
│   ├── Admin.tsx        # Admin panel (password/token protected)
│   ├── Pending.tsx      # Pending project approvals
│   ├── Requests.tsx     # Community project requests + voting
│   ├── Graveyard.tsx    # Dead/shutdown projects
│   ├── Data.tsx         # Data/analytics view
│   └── NotFound.tsx
├── components/
│   ├── ecosystem/       # Core visualization components
│   │   ├── FullCanvas.tsx       # D3 force-directed canvas (main viz)
│   │   ├── MobileProjectList.tsx # Masonry grid for mobile
│   │   └── AddProjectForm.tsx    # Project submission form
│   └── ui/              # shadcn/ui primitives (do not edit directly)
├── hooks/
│   └── useProjects.ts   # ALL React Query hooks + mutations
├── lib/
│   └── api.ts           # API client — every fetch call lives here
├── types/
│   └── ecosystem.ts     # Core types: EcosystemProject, ProjectRequest, Category
└── data/
    ├── categories.json  # 10 predefined categories with colors
    └── ecosystemData.ts # Category utilities, color/slug helpers

api/                     # Vercel serverless functions (each file = one endpoint)
├── _db.ts               # Drizzle schema + DB connection (shared)
├── projects.ts          # GET approved active projects
├── graveyard.ts         # GET dead projects
├── requests.ts          # GET project requests
├── submit-project.ts    # POST new project (goes to pending)
├── submit-request.ts    # POST new project request
├── upvote.ts            # POST upvote a request
├── validate-profile.ts  # POST validate NS profile URL
├── pending-projects.ts  # GET pending projects (admin, auth required)
├── approve-project.ts   # POST approve/reject project (admin)
├── admin-data.ts        # GET all projects for admin table (admin)
└── admin-update.ts      # POST update project fields (admin)
```

## Data Flow Pattern

All data flows through this pipeline — follow this pattern for new features:

1. **Schema** → Define or modify tables in `api/_db.ts` (Drizzle ORM)
2. **Serverless endpoint** → Create/edit a handler in `api/` that queries the DB
3. **API client** → Add the fetch function in `src/lib/api.ts`
4. **React Query hook** → Wrap the API call in `src/hooks/useProjects.ts`
5. **Component** → Consume the hook in a page or component

### Example: Adding a new API endpoint

```typescript
// 1. api/my-endpoint.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, projects } from "./_db";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "active"));
  return res.json(result);
}
```

```typescript
// 2. src/lib/api.ts — add fetch function
export async function fetchMyData(): Promise<MyType[]> {
  const response = await fetch("/api/my-endpoint");
  if (!response.ok) throw new Error(`Failed: ${response.status}`);
  return response.json();
}
```

```typescript
// 3. src/hooks/useProjects.ts — add hook
export function useMyData() {
  return useQuery({
    queryKey: ["my-data"],
    queryFn: fetchMyData,
    staleTime: 1000 * 60 * 2,
  });
}
```

Don't forget to register the new endpoint in `vercel.json` under `functions` if it needs custom memory/duration config.

## Database Schema

Three tables defined in `api/_db.ts`:

**projects** — Main entities

- `id` (text PK), `name`, `category`, `description`, `url`, `guideUrl`, `imageUrl`, `emoji`
- `status`: `'active'` | `'dead'`
- `approvalStatus`: `'approved'` | `'pending'` | `'rejected'`
- `tags` (text array): `'nsOfficial'`, `'free'`, `'paid'`
- `productImages` (text array, max 3), `nsProfileUrls` (text array)
- `customCategoryId`, `customCategoryName`, `customCategoryColor` for user-defined categories
- `postMortem` (for graveyard projects), `addedAt`

**project_requests** — Community suggestions

- `id`, `name`, `description`, `category`, `submittedBy`, `emoji`, `upvotes`, `submittedAt`

**request_upvotes** — Vote tracking

- Composite PK: (`requestId`, `voterId`)

To modify the schema:

```bash
# Edit api/_db.ts, then:
pnpm db:generate    # Generate migration
pnpm db:migrate     # Apply migration
# OR for quick iteration:
pnpm db:push        # Push schema directly (no migration file)
```

## Categories

10 predefined categories in `src/data/categories.json`: Networks, Coworking, Events, Media, Education, Local VCs, Global VCs, Accelerators, Corporate, Transport.

Custom categories are supported per-project via `customCategoryId`/`customCategoryName`/`customCategoryColor` fields. Category matching is case-insensitive.

## Auth Pattern

Admin endpoints require one of these headers:

- `x-admin-password` — the `ADMIN_PASSWORD` env var
- `x-admin-token` — the `ADMIN_TOKEN` env var

Public endpoints (projects, graveyard, requests, submit-project, submit-request, upvote) have no auth.

Auto-login via `?token=` URL parameter is supported on the admin page.

## Path Alias

`@/*` maps to `src/*`. Use `@/components/ui/button` not `../../components/ui/button`.

## Key Conventions

- **No test framework** is configured. Manual testing via `pnpm dev:vercel`.
- **TypeScript strict mode is OFF.** No strictNullChecks, no noImplicitAny.
- **UI components** come from shadcn/ui (`src/components/ui/`). Don't edit these directly — use `npx shadcn-ui@latest add <component>` to add new ones.
- **All API calls** go through `src/lib/api.ts`. Don't fetch directly in components.
- **All React Query hooks** live in `src/hooks/useProjects.ts`.
- **Array fields** (tags, productImages, nsProfileUrls) are pipe-delimited (`|`) in API submissions but native arrays in the DB and types.

## Common Tasks

### Adding a new page

1. Create `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx` (or wherever routes are defined)
3. The Vercel rewrite in `vercel.json` already catches all non-API routes to `index.html`

### Adding a shadcn/ui component

```bash
npx shadcn-ui@latest add <component-name>
```

### Modifying the D3 visualization

The force simulation lives in `src/components/ecosystem/FullCanvas.tsx`. It uses D3 force simulation with canvas rendering. This is the most complex component — read it carefully before modifying.

### Working with the admin panel

The admin panel (`src/pages/Admin.tsx`) uses a data table for bulk project management. It connects to `api/admin-data.ts` (read) and `api/admin-update.ts` (write).

## Deployment

Push to `main` triggers Vercel deployment. The build command is:

```bash
vite build && cd docs && npm run build && cp -r build ../dist/docs
```

This builds both the main app and the Docusaurus docs site.

$ARGUMENTS
