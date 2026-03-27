---
sidebar_position: 2
sidebar_label: "Frontend & UI"
---

# Contributing to the Frontend

The Atlas frontend is React 18 + TypeScript, built with Vite, styled with TailwindCSS and shadcn/ui components.

## Key areas

### Canvas visualization (`src/components/ecosystem/FullCanvas.tsx`)

The main Atlas view is a D3 force-directed simulation rendered on an HTML canvas. Projects are drawn as nodes, colored by category, and clustered by force simulation. This is the most visually complex part of the codebase.

### Mobile layout (`src/components/ecosystem/MobileProjectList.tsx`)

On smaller screens, the canvas is replaced by a masonry card grid using `react-masonry-css`. Each card shows project info with hover/tap interactions.

### UI primitives (`src/components/ui/`)

All base components come from shadcn/ui. These are copied into the repo (not imported from a package), so you can modify them directly.

### Pages (`src/pages/`)

Each route has its own page component — Index, Admin, Pending, Requests, Graveyard, Data. Pages compose ecosystem components and UI primitives.

## Data flow

Components don't fetch data directly. The pattern is:

1. **React Query hooks** (`src/hooks/useProjects.ts`) — wrap API calls with caching, refetching, and mutations
2. **API client** (`src/lib/api.ts`) — thin functions that call the serverless endpoints
3. **Components** consume hooks and render

To add data to a component, use an existing hook or create a new one in `useProjects.ts`.

## Styling conventions

- Use Tailwind utility classes, not custom CSS
- Follow existing shadcn/ui patterns for new components
- Dark mode is supported via `next-themes` — use Tailwind's `dark:` prefix
- Colors for categories come from `src/data/categories.json`

## Running the frontend

Most frontend work requires data from the API to render anything meaningful — the canvas, card grid, and pages all pull from the database via React Query hooks.

:::warning Local database required
You'll need the local database running and seeded before the UI will populate.
:::

Follow the [Local Dev Setup](https://github.com/0xVitae/ns-tools-atlas#local-dev-setup) in the README if you haven't already, then:

```bash
pnpm dev:vercel
```

This starts the frontend and serverless API functions together. Without the API, pages will be empty or show loading/error states.

If you're only tweaking isolated components (e.g. a button style, a modal layout) that don't depend on data, you can run `pnpm dev` for a faster Vite-only server — but for anything else, use `dev:vercel` with the local DB.
