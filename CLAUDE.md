# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build (also runs TypeScript type checking)
pnpm start        # Start production server
pnpm lint         # ESLint (flat config, v9)
```

No test framework is configured.

## Architecture

Next.js 16 app using the **Pages Router** (`src/pages/`), TypeScript strict mode, React 19.

**Data flow:** All tour/destination data is hardcoded in `src/data/index.ts` — no API calls, no CMS, no database. Components receive data as props from page files.

**Shared types** live in `src/types/index.ts`: `Tour`, `Destination`, `ContactInfo`, and component prop interfaces.

**Layout:** `src/components/layout/index.tsx` wraps all pages (applied in `_app.tsx`), renders Header + Footer. Individual pages also render `<HeaderMobile />` and a block of `<Script>` tags for legacy vendor JS (jQuery, Bootstrap, WOW.js, etc.).

**Styling:** The site uses a pre-built HTML template ("Tevily") with vendor CSS/JS loaded from `public/assets/`. Component-level styles use CSS Modules (e.g., `TourCarousel.module.css`). Global styles in `src/styles/globals.css`.

**Path alias:** `@/*` maps to `./src/*`.

## Deployment

Pushes to `main` trigger SSH deployment to production (`/var/www/vietnam-moto-tours`) via `.github/workflows/deploy.yml`. The server runs the app with pm2.
