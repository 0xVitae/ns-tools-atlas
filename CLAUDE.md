# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev        # Start dev server on port 8080
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Architecture

This is a React visualization app for mapping the Nova Scotia startup ecosystem. It displays organizations across 9 categories on an interactive pan/zoom canvas.

### Core Structure

- **Entry**: `src/main.tsx` → `src/App.tsx` → `src/pages/Index.tsx`
- **Canvas**: `src/components/ecosystem/FullCanvas.tsx` - Main visualization component with pan/zoom controls and project submission form
- **Data Layer**:
  - `src/types/ecosystem.ts` - TypeScript types (`EcosystemProject`, `CategoryType`, `Category`)
  - `src/data/ecosystemData.ts` - Category definitions, colors, and initial project data

### Key Patterns

**Path Alias**: Use `@/` for imports from `src/` (configured in tsconfig.json and vite.config.ts)

**UI Components**: shadcn/ui components in `src/components/ui/` - use these for all UI elements

**Category System**: 9 categories defined as a union type in `src/types/ecosystem.ts`:
- networks, coworking, media-events, education, local-vcs, global-vcs, accelerators, corporate, public-entities

**Canvas Layout**: Fixed positions defined in `CANVAS_LAYOUT` in FullCanvas.tsx. Projects are scattered within category boxes using deterministic positioning.

### State Management

- React Query (`@tanstack/react-query`) available but currently unused
- Local state in Index.tsx manages the projects array
- Projects can be added via the floating "Add Project" button form
