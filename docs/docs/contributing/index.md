---
sidebar_label: "Overview"
slug: /contributing
---

# How to Contribute to NS Tools

The Atlas is open source and welcomes contributions from the Network School community. Whether you're into frontend design, backend features, or developer tooling, there's a place for you.

## What you can work on

### Frontend & UI

The Atlas is a React + TypeScript app using TailwindCSS and shadcn/ui. The main canvas is a D3 force simulation, and mobile uses a masonry card layout. If you enjoy building interfaces, there's plenty to improve — from polishing existing components to designing new views.

Good starting points: responsive tweaks, animation improvements, accessibility fixes, new filter/sort options on the card grid.

[Read the Frontend guide →](./frontend.md)

### New Features & Backend

The backend is Vercel serverless functions backed by Neon PostgreSQL via Drizzle ORM. Each API endpoint is a single file in `api/`. If you want to add a feature end-to-end — from database schema to API endpoint to React Query hook to UI — this is your track.

Good starting points: new endpoints, data export features, search/filter improvements, analytics views.

[Read the Features guide →](./features.md)

### Claude Plugin & Developer Ecosystem

NS Tools ships a Claude Code plugin with skills that give Claude context about the codebase and NS APIs. If you want to improve the developer experience — adding new skills, improving existing ones, or building integrations — this is the place.

Good starting points: adding a new skill, improving the contributing skill's coverage, documenting more APIs.

[Read the Plugin guide →](./plugin.md)

### Documentation

These docs are built with Docusaurus. Fixing typos, improving explanations, or adding missing guides are all valuable contributions.

Good starting points: any page that confused you when you first read it.

## Getting started

Before you can work on any of the above, you need to set up your local environment.

[Set up your dev environment →](./setup.md)

## Contribution workflow

The `main` branch is protected — all changes come through pull requests.

1. **Fork** the repo: [0xVitae/ns-tools-atlas](https://github.com/0xVitae/ns-tools-atlas)
2. **Clone** your fork and create a branch:
   ```bash
   git clone https://github.com/YOUR-USERNAME/ns-tools-atlas.git
   cd ns-tools-atlas
   git checkout -b my-feature
   ```
3. **Set up** your local environment ([setup guide](./setup.md))
4. **Make your changes**, then push and open a PR against `main`

:::tip First contribution?
A good first contribution is adding your own project to the Atlas via the UI, or fixing a typo in these docs.
:::
