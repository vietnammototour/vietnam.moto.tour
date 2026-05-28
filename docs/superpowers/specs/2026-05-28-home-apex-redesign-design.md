# Home page — Apex Tactical redesign

**Date:** 2026-05-28
**Owner:** Roman
**Status:** Draft → ready for plan

## Goal

Rebuild `/` (home) to match the Stitch "Apex Cinematic Tactical" design language, mirroring the pattern set by PR #137 (`/rentals`). Keep all existing dynamic data flow (tours, destinations, gallery, locale, isAdmin) and Framer-Motion entrance animations. Visual layer only.

## Source mockups (Stitch)

Project `4683768170577706110` — "Apex Cinematic Tactical".

- Desktop: screen `8fd0909540c5434caab81f5ebb029abc` — "Home - Vietnam Moto Tour (Apex Tactical)" (1280×5478)
- Mobile: screen `ec40dbc5b8284cdf870b6ae05a1b2c69` — "Home - Vietnam Moto Tour (Tactical Mobile)" (390×4944)

Both pulled into `.design-snapshots/stitch/home-{desktop,mobile}-apex.png` via Playwright MCP at the start of implementation.

## Non-goals

- No data model / Prisma schema changes.
- No new routes or API endpoints.
- No reskin of `/admin/*` pages.
- No new test suites for styling (CLAUDE.md forbids styling assertions).
- No interactive logic on the new tactical chip filter row (visual only).

## Scope

Approach **C — Hybrid**:

- Gut visual layer of `src/pages/index.tsx`.
- Reskin shared components (`TourCarousel`, `DestinationCard`, `GalleryItem`) in-place to Apex tokens — side effect: `/tours` and `/destinations` pages adopt the look automatically. This is desired (those pages are next on the Apex roadmap).
- Add two new components: `HeroVideoApex` (or section block inline), `StatsStrip`.
- Keep `getServerSideProps`, locale handling, Framer-Motion variants.

## Section list (top → bottom)

1. **Hero** — full-bleed `<video>` autoplay banner (kept). Overlay swapped:
   - Drop: warm gradient, cursor spotlight, `texture-grain-warm`.
   - Add: `bg-[#131313]/60` scrim, asymmetric left-aligned content stack.
   - Content: `mono-label` timestamp string (e.g. `EST. 2014 · HANOI 21.0285°N`), `clipReveal` `display-lg` Hanken Grotesk uppercase headline, `body-lg` subhead, two CTAs (primary mustard + ghost-outline mustard-on-transparent).
   - Tactical accent: corner crosshair marks via CSS `clip-path` on the hero corners (per DESIGN.md "Tactical Accents").
2. **Stats strip** (NEW, `StatsStrip` component) — full-width 1px-bordered band, `surface-container-low` bg. Four cells separated by 1px `outline-variant`. Mono-data numerals stacked under mono-label captions:
   - `12 YEARS` / `47 ROUTES` / `1.2M KM` / `4500+ RIDERS` (final values via i18n; placeholders here).
3. **Destinations** — magazine grid layout kept. Card reskin: `#1a1a1a` bg, 1px `outline` border, 0 radius, mono-label region tag, `headline-md` title, `body-md` excerpt, no shadow. Drop `texture-grain-warm`.
4. **About** — drop `texture-grain-cool`. Switch to `#131313` bg + 1px-outlined two-column panel (photo left, copy right). `headline-lg` h2, `body-lg` on-surface copy.
5. **Popular Tours** — `TourCarousel` reskinned (sharp corners, 1px borders, mono-label price/duration tags, mustard hover CTA). Above carousel: tactical chip-tag filter row — `ALL · MOUNTAIN · COASTAL · NORTH · SOUTH`. Visual only (no filter logic) — explicit YAGNI.
6. **Video / CTA** — keep `VideoModal`. Section bg `surface-container-lowest` `#0e0e0e`. `headline-lg` h2, primary mustard CTA "WATCH FIELD REPORT" opens modal.
7. **Gallery** — `GalleryItem` reskinned to ledger-row style. Section bg switches from `bg-surface-alt` to `#131313`.

## Tokens (mirrors `DESIGN.md`)

| Use                     | Token                      | Hex       |
| ----------------------- | -------------------------- | --------- |
| Page bg                 | `surface`                  | `#131313` |
| Card bg                 | `surface-container-low`    | `#1c1b1b` |
| Section accent bg       | `surface-container-lowest` | `#0e0e0e` |
| Primary text            | `on-surface`               | `#e5e2e1` |
| Muted text              | `on-surface-variant`       | `#cfc6ab` |
| Border (1px everywhere) | `outline`                  | `#989177` |
| Subtle border           | `outline-variant`          | `#4c4732` |
| CTA / hazard            | `primary-container`        | `#ffdb00` |
| On-CTA text             | `on-primary`               | `#393000` |

Typography roles:

- `display-lg` — hero h1
- `headline-lg` — section h2
- `headline-md` — card h3
- `body-lg` — hero subhead, About body
- `body-md` — card excerpt, gallery caption
- `mono-label` — uppercase tags (region, timestamp, chip-filter)
- `mono-data` — stats numerals, IDs

Spacing: 4px base unit, 1px gutter for component separators, container max-width 1920px, 48px desktop / 16px mobile horizontal margin.

Shape: zero radius everywhere — override any `rounded-*` utility on touched components with `rounded-none`.

## Components touched / added

| Path                                          | Change                                          |
| --------------------------------------------- | ----------------------------------------------- |
| `src/pages/index.tsx`                         | Gut visual layer; keep SSR + data props         |
| `src/components/home/TourCarousel.tsx`        | Reskin: tokens, borders, type, mono-label tags  |
| `src/components/home/TourCarousel.module.css` | Replace styling with Apex tokens                |
| `src/components/home/GalleryItem.tsx`         | Reskin: ledger-row style                        |
| `src/components/DestinationCard/`             | Reskin: bg, border, type, drop shadow           |
| `src/components/home/StatsStrip/` (NEW)       | Index + component + co-located form-utils N/A   |
| `src/components/VideoModal.tsx`               | Restyle modal close + frame (Apex tokens)       |
| `src/styles/globals.css`                      | Add Apex-leaning utility classes only if needed |

`StatsStrip` follows the shared-UI convention:

- `StatsStrip/index.ts` re-export
- `StatsStrip/StatsStrip.tsx` implementation
- `StatsStrip/StatsStrip.spec.tsx` test (behavior only — renders all 4 stats, accepts locale)

## i18n

New keys under `home.*`:

- `home.hero.timestamp`
- `home.stats.years.{label,value}`
- `home.stats.routes.{label,value}`
- `home.stats.km.{label,value}`
- `home.stats.riders.{label,value}`
- `home.tours.filterAll`, `home.tours.filterMountain`, `home.tours.filterCoastal`, `home.tours.filterNorth`, `home.tours.filterSouth`

Add to `src/messages/{vi,en}.json` AND seed via `scripts/seed-translations.ts` (DB-only per project convention). Reuse `common.*` for any generic UI (cancel, view, learn-more) — check `common.*` before adding new keys.

## Animation policy

Keep all existing Framer-Motion variants (`clipReveal`, `fadeInUp`, `riseWithOvershoot`, `slideFromLeft`, `waveStagger`). No motion code deleted. `clipReveal` continues on hero headline — fits the "field readout reveal" vocabulary.

Hero video stays autoplay, muted, looping, with `prefers-reduced-motion` guard kept intact.

## Verification loop (Playwright MCP, side-by-side)

Per-section iteration in Claude session:

1. One-time: `browser_navigate` to each Stitch screen's `downloadUrl` and `browser_take_screenshot` → `.design-snapshots/stitch/home-{desktop,mobile}-apex.png`.
2. Implement section in `src/pages/index.tsx` (or shared component).
3. `browser_navigate http://localhost:3000`, scroll to section, `browser_take_screenshot` clipped to section bounds.
4. Read both PNGs (current render + Stitch mockup) and diff: layout, type scale, color, spacing, border weight.
5. Iterate code → repeat 3–4 until match.
6. After commit: `pnpm lint:design` (hex / off-palette gate).
7. Final pass: `pnpm design:verify` regenerates `.design-snapshots/root-{desktop,mobile}.png`.

Viewports: 1440×900 desktop, 390×844 mobile. Animations frozen via existing `FREEZE_ANIMATIONS` CSS injection in `scripts/design-verify.ts`.

## Test plan

- Manual headed verification at `/` for both viewports after each section commit.
- Side-by-side PNG diff per section via Playwright MCP.
- Regression smoke on `/tours` and `/destinations` (auto-restyled via shared component reskin) — fix only glaring breakages; broader cleanup belongs to those pages' own redesigns.
- `pnpm lint`, `pnpm lint:design`, `pnpm build` (includes typecheck).
- `StatsStrip.spec.tsx`: behavior only (renders 4 stats, picks correct locale).
- No styling assertions anywhere (CLAUDE.md rule).

## Risks

- **Tours / Destinations pages drift** — shared-component reskin will affect them mid-flight. Mitigation: smoke check after component reskin commits; revert reskin to in-component variant if breakage is severe.
- **Hero video readability under dark scrim** — current warm gradient might have hidden contrast issues. Verify WCAG AA on hero headline via Impeccable.
- **Token coverage** — `globals.css` currently does NOT import `design-tokens.css`. Hex values used directly; ensure new Tailwind arbitrary values use the exact Apex hex strings so `pnpm lint:design` passes.
- **i18n drift** — translation seed and JSON files can diverge. Run `pnpm i18n:scan` and `pnpm i18n:apply` if any new common-style key gets added under `home.*`.

## Delivery

- Branch: `feat/home-apex-redesign`.
- Commits in order: stitch pull → hero → stats strip → destinations → about → tours + carousel reskin → cta → gallery + item reskin → destination card reskin → i18n seed → final lint/build.
- Single PR to `main` mirroring PR #137 shape.
- After merge: invoke `superpowers:finishing-a-development-branch`.
