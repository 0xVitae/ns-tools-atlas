# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Network School tool Atlas — an interactive ecosystem visualization of tools in the Network School community. Full-stack React app deployed on Vercel with Neon PostgreSQL.

## Commands

```bash
pnpm dev              # Start Vite dev server on localhost:8080
pnpm dev:vercel       # Local dev with Vercel serverless functions
pnpm build            # Production build
pnpm lint             # ESLint
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema directly to database
pnpm db:studio        # Open Drizzle Studio GUI
```

No test framework is configured.

## Architecture

### Stack

- **Frontend:** React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui
- **State:** TanStack React Query for server state, React hooks for local state
- **Visualization:** D3 Force simulation (FullCanvas.tsx), Konva, Recharts
- **Backend:** Vercel serverless functions (TypeScript handlers in `api/`)
- **Database:** Neon PostgreSQL via Drizzle ORM
- **Deployment:** Vercel with SPA routing

### Key Directories

- `src/pages/` — Route pages (Index, Admin, Pending, Requests, Graveyard, Data)
- `src/components/ecosystem/` — Core visualization: FullCanvas.tsx (D3 canvas), MobileProjectList.tsx, AddProjectForm.tsx
- `src/components/ui/` — shadcn/ui primitives
- `src/hooks/useProjects.ts` — All React Query hooks and mutations for API calls
- `src/lib/api.ts` — API client functions matching serverless endpoints
- `src/types/ecosystem.ts` — Core TypeScript types (EcosystemProject, ProjectRequest)
- `src/data/ecosystemData.ts` — Category utilities, color/slug helpers
- `api/` — Vercel serverless handlers (each file = one endpoint)
- `api/_db.ts` — Drizzle schema, DB connection, and table definitions

### Data Flow

1. API client (`src/lib/api.ts`) calls Vercel serverless functions (`api/`)
2. Serverless functions use Drizzle ORM to query Neon PostgreSQL (`api/_db.ts`)
3. React Query hooks (`src/hooks/useProjects.ts`) wrap API calls with caching
4. Components consume hooks — FullCanvas.tsx renders D3 force simulation, MobileProjectList.tsx renders masonry grid

### Database Schema (3 tables in `api/_db.ts`)

- **projects** — Main entities with category, status ('active'|'dead'), approvalStatus ('approved'|'pending'|'rejected'), custom category support, arrays for tags/images/urls
- **project_requests** — Community-submitted project suggestions with upvote count
- **request_upvotes** — Tracks individual votes (requestId + voterId composite key)

### Auth Pattern

Admin endpoints (`pending-projects`, `approve-project`, `admin-data`, `admin-update`) require `x-admin-password` or `x-admin-token` headers. Public endpoints have no auth. Token auto-login via `?token=` URL param.

### Categories

10 predefined categories (Networks, Coworking, Events, Media, Education, Local VCs, Global VCs, Accelerators, Corporate, Transport) defined in `src/data/categories.json`. Custom categories supported per-project with auto-assigned colors.

## Path Alias

`@/*` maps to `src/*` (configured in tsconfig.json and vite.config.ts).

## Environment Variables

See `.env.example`: DATABASE_URL, ADMIN_PASSWORD, ADMIN_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.

## TypeScript

Strict mode is OFF. No strictNullChecks, no noImplicitAny.
