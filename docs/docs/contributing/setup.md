---
sidebar_position: 1
sidebar_label: "Dev Setup"
---

# Setting Up Your Dev Environment

The full setup instructions — including prerequisites, local database, seeding, and all commands — live in the project README so there's one source of truth.

**[Read the setup guide in the README →](https://github.com/0xVitae/ns-tools-atlas#local-dev-setup)**

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm db:local        # Start local Postgres via Docker
pnpm db:push         # Create tables
pnpm db:seed         # Seed mock data
pnpm dev:vercel      # Start dev server with API
```

No cloud accounts needed — `USE_LOCAL_DB=true` (the default) runs everything locally with Docker.
