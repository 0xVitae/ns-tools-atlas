# NS Tools Atlas

Interactive ecosystem visualization of tools and startups in the [Network School](https://ns.com) community. Browse what NS members are building, submit your own project, or request tools you'd like to see.

**Live:** [tools.ns.com](https://tools.ns.com)

## Pages

| Route        | Description                                                                       |
| ------------ | --------------------------------------------------------------------------------- |
| `/`          | Main atlas — interactive D3 force-directed canvas (desktop) or card grid (mobile) |
| `/requests`  | Community wishlist — suggest tools and upvote ideas                               |
| `/graveyard` | Archive of NS projects that have shut down                                        |
| `/data`      | Charts and stats about the ecosystem                                              |
| `/docs`      | Documentation (Docusaurus)                                                        |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Visualization:** D3 Force simulation, Konva, Recharts
- **State:** TanStack React Query
- **Backend:** Vercel serverless functions
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Docs:** Docusaurus

## Local Dev Setup

### Prerequisites

- **Node.js** 18+
- **pnpm** (`npm i -g pnpm` if you don't have it)
- **Docker** (for the local database)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

The defaults are already configured for local development — `USE_LOCAL_DB=true` tells the app to use the local Docker database instead of a remote Neon instance. No cloud accounts needed.

### 3. Start the local database

```bash
pnpm db:local
```

This starts two Docker containers:

- **Postgres 17** on `localhost:5432` — the actual database
- **Neon HTTP Proxy** on `localhost:4444` — translates the Neon serverless driver's HTTP calls into standard Postgres queries

### 4. Create tables and seed data

```bash
pnpm db:push    # Create tables from schema
pnpm db:seed    # Populate with mock data (14 projects, 3 requests, 8 upvotes)
```

The seed script is hardcoded to connect to the local database — it cannot accidentally touch production.

### 5. Start the dev server

```bash
pnpm dev:vercel    # Frontend + serverless API functions (recommended)
pnpm dev           # Frontend only, no API (port 8080)
```

### Stopping / resetting

```bash
pnpm db:local:stop    # Stop Docker containers (data persists in volume)
pnpm db:seed          # Re-run to reset to fresh mock data
```

## All Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `pnpm dev`           | Vite dev server (frontend only, port 8080)  |
| `pnpm dev:vercel`    | Dev server with Vercel serverless functions |
| `pnpm build`         | Production build (app + docs)               |
| `pnpm lint`          | ESLint                                      |
| `pnpm db:local`      | Start local Postgres + Neon proxy           |
| `pnpm db:local:stop` | Stop local database                         |
| `pnpm db:push`       | Push schema to database                     |
| `pnpm db:seed`       | Seed mock data (local only)                 |
| `pnpm db:studio`     | Open Drizzle Studio GUI                     |
| `pnpm db:generate`   | Generate Drizzle migrations                 |
| `pnpm db:migrate`    | Run migrations                              |

## Project Structure

```
src/
  pages/               Route pages (Index, Admin, Requests, Graveyard, Data)
  components/
    ecosystem/         Core viz: FullCanvas, MobileProjectList, AddProjectForm
    ui/                shadcn/ui primitives
  hooks/               React Query hooks (useProjects.ts)
  lib/                 API client (api.ts)
  types/               TypeScript types (ecosystem.ts)
  data/                Categories, color helpers
api/                   Vercel serverless handlers (one file per endpoint)
  _db.ts               Drizzle schema + DB connection
docs/                  Docusaurus documentation site
scripts/               Seed script and utilities
skills/                Claude Code plugin skills
```

### Path alias

`@/*` maps to `src/*` — so `import { Button } from "@/components/ui/button"` resolves to `src/components/ui/button`.

## Contributing

Contributions are welcome. The `main` branch is protected — all changes come through pull requests.

1. **Fork** the repo: [0xVitae/ns-tools-atlas](https://github.com/0xVitae/ns-tools-atlas)
2. **Clone** and branch:
   ```bash
   git clone https://github.com/YOUR-USERNAME/ns-tools-atlas.git
   cd ns-tools-atlas
   git checkout -b my-feature
   ```
3. **Set up** your local environment (see [Local Dev Setup](#local-dev-setup) above)
4. **Make your changes**, push, and open a PR against `main`

### What you can work on

- **Frontend & UI** — React components, D3 canvas, mobile layout, styling, accessibility
- **New Features & Backend** — API endpoints, database schema, React Query hooks, end-to-end features
- **Claude Plugin** — Add or improve skills in `skills/` that give Claude context about the codebase and NS APIs
- **Documentation** — Improve the Docusaurus docs at `docs/`

See the [contributing docs](https://tools.ns.com/docs/contributing) for detailed guides on each area.

### Troubleshooting

**"Cannot connect to the Docker daemon"** — Make sure Docker Desktop is running before `pnpm db:local`.

**Seed script fails to connect** — Make sure Docker containers are running and healthy (`pnpm db:local`).

**Port 5432 already in use** — Another Postgres instance is running. Stop it or edit `docker-compose.yml`.

## Claude Code Plugin

This repo ships a Claude Code plugin with skills for building with NS tools:

| Skill            | Command                  | What it does                                                                      |
| ---------------- | ------------------------ | --------------------------------------------------------------------------------- |
| **NS Auth**      | `/ns-tools:ns-auth`      | API reference and integration guide for NS Auth (Discord membership verification) |
| **Contributing** | `/ns-tools:contributing` | Codebase guide — structure, patterns, conventions, and how to add features        |

### Install

```bash
/plugin marketplace add 0xvitae/ns-tools-atlas
/plugin install ns-tools
```

Or load locally: `claude --plugin-dir /path/to/ns-tools-atlas`

## Environment Variables

See `.env.example` for all variables. For local dev, the defaults work out of the box. For production:

| Variable             | Required   | Description                               |
| -------------------- | ---------- | ----------------------------------------- |
| `DATABASE_URL`       | Yes (prod) | Neon PostgreSQL connection string         |
| `USE_LOCAL_DB`       | No         | Set to `true` for local Docker database   |
| `ADMIN_PASSWORD`     | Yes        | Password for admin endpoints              |
| `ADMIN_TOKEN`        | No         | Token for URL-based admin auto-login      |
| `TELEGRAM_BOT_TOKEN` | No         | Telegram bot for submission notifications |
| `TELEGRAM_CHAT_ID`   | No         | Telegram chat for notifications           |

## Author

Built by [0xVitae](https://github.com/0xvitae) for the Network School community.
