# TripAdvisor Widget Integration — Design

**Date:** 2026-05-30
**Status:** Approved (design phase)

## Goal

Build trust on the website by integrating **real, verifiable TripAdvisor content** about the
business and its tours. Replace the current fabricated testimonials with live TripAdvisor reviews,
surface rating / award badges as trust signals, and show **tour-specific** reviews on each tour
detail page.

## Context (current state)

- `contactInfo.tripadvisorLink` already points at the business attraction listing
  (`.../d5501636-...Nha_Trang...`).
- `TripAdvisorIcon` exists; used only as a social link in Header top bar + Footer.
- `src/components/home/Testimonials/Testimonials.tsx` renders **3 hardcoded fabricated quotes**
  (`MOCK_TESTIMONIALS`). These are fake reviews of a real business — a trust/ethics liability —
  and will be removed.
- No CSP is configured today (`next.config.mjs` has no security headers).
- `Tour` model uses legacy split `*Vi`/`*En` columns.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Content source | **Official TripAdvisor widgets** (live embed, no Content API key) |
| Home fake quotes | **Deleted**, replaced by live TA reviews widget |
| Widgets in play | Reviews block · Rating badge · Travelers' Choice badge · Read/Write-reviews CTA |
| Per-tour reviews | Each tour has its **own** TA listing → store per-tour ID, embed that listing's widget |
| Integration mechanism | **Script-injection component (①)** as the spine, **iframe-isolation (②)** as per-variant fallback if CSS bleed appears. No Content API / hybrid (③). |

### TripAdvisor reality that shaped the design

- The free Reviews widget takes **one `locationId`** and shows that location's reviews. There is
  **no filter-by-keyword/tour** option.
- Because each tour is sold as its **own** TripAdvisor Experience/Viator listing (confirmed with
  the user), per-tour reviews are achievable by storing each tour's own TA location/product ID and
  embedding that listing's widget. No curation needed.
- Reviews are mostly written in English; TripAdvisor's widget UI has only partial Vietnamese
  support. Accepted as-is.

## Architecture

### 1. Data layer

- **Schema:** add `tripadvisorLocationId String?` to `model Tour` in `prisma/schema.prisma`
  (nullable; plain `String` — it is an external opaque ID, **not** localized, so no `{en,vi}`
  shape). Create a Prisma migration.
- **Business-wide ID:** add `tripadvisorLocationId: string` to the `ContactInfo` type and the
  `contactInfo` constant in `src/utils/contact.ts`. Value: `d5501636` (the location id embedded in
  the existing `tripadvisorLink`). Used on the home page and as the per-tour fallback.
- **Mapper:** the tour query/mapper (`src/data/queries*`) must carry `tripadvisorLocationId` through
  to the domain/response type. It is `string | null` — JSON-serializable, no Date/Decimal/bigint
  conversion needed. Enumerate it explicitly in the mapper per the property-unwrapping rule.

### 2. Reusable primitive — `src/components/ui/TripAdvisorWidget/`

Follows the shared-UI convention (`index.ts` re-export, `*.tsx` impl, `*.spec.tsx` tests).

- `TripAdvisorWidget.tsx` — single component. Renders a **site-styled shell** (eyebrow label
  "As reviewed on TripAdvisor", border matching the design system, attribution line + the existing
  `TripAdvisorIcon`) wrapping a **target `<div>`** with a unique id. No styling assertions in tests.
- `useTripAdvisorWidget.ts` — sibling hook (hooks live in sibling files, never inline). Owns the
  widget lifecycle:
  - generates a unique container id;
  - injects the TripAdvisor `wejs` script via `next/script` (or an effect-managed `<script>` element)
    with `strategy="lazyOnload"`;
  - **keyed on `locationId` + `locale` + `variant`** so it re-initializes correctly on client-side
    route changes, tour-to-tour navigation, and locale switches (the core SPA challenge);
  - cleans up the injected script/container on unmount;
  - reserves a `min-height` on the shell to avoid layout shift (CLS).
- **Props:** `variant: 'reviews' | 'rating' | 'travelersChoice' | 'cta'`, `locationId: string`,
  `className?: string`.
- **②-fallback (iframe isolation):** the hook supports an `isolate?: boolean` path that mounts the
  same widget inside an `<iframe srcdoc>` for total CSS isolation. **Default off**; flipped on
  per-variant only if CSS bleed from TripAdvisor's stylesheet proves unacceptable during testing.

Declaration style: `export function TripAdvisorWidget(props: Props) { ... }` — no `React.FC`, no
explicit return type. `type`, never `interface`.

### 3. Placement

- **Home (`Testimonials`):** delete `MOCK_TESTIMONIALS`; rework the component to render
  `<TripAdvisorWidget variant="reviews" locationId={businessId} />`. Rating + Travelers' Choice
  badges sit above the reviews block; a Read-reviews CTA sits below. Keep the existing section
  eyebrow/title chrome and motion.
- **Tour detail (`src/pages/tours/[slug].tsx`):** `<TripAdvisorWidget variant="reviews"
  locationId={tour.tripadvisorLocationId ?? businessId} />`. A rating badge renders near
  `TourPricing` / the booking CTA. A Read/Write-reviews CTA links to that listing.
- **Footer (optional, low priority):** small Travelers' Choice badge.

### 4. Admin

- `GeneralTab` (`src/components/Admin/tabs/GeneralTab/`): add a `TripAdvisor location ID`
  `TextInput` (optional, plain string — not locale-switched).
- `GeneralTab.form-utils.ts`: add `tripadvisorLocationId: yup.string().optional()` to the schema,
  `''` to default values, and carry it through the submit handler.
- API route + create/update tour queries must persist the new field.

### 5. i18n

- Widget `lang` param mapped from current locale: `vi` → `vi_VN`, `en` → `en_US`. (TA Vietnamese UI
  support is partial; reviews are mostly English — accepted.)
- All site-authored labels (eyebrow, attribution, CTA text) localized via the DB `Translation`
  table. **Check `common.*` first** — e.g. a "Read reviews" / "reviews" CTA should reuse a
  `common.*` key if one exists rather than creating `home.readReviews` / `tours.readReviews`.

### 6. Security / CSP

- TripAdvisor widgets require network access to: `www.jscache.com` (widget script),
  `static.tacdn.com` (assets), `www.tripadvisor.com` (links/data).
- No CSP exists today, so nothing blocks the embed. **Document this exact allowlist** in the spec
  and in a code comment near the widget so a future CSP addition does not silently break the widget.
- Script is loaded via `next/script` (external `src`, no inline code) → respects the
  "no inline `<script>`" rule. This is a deliberate, user-approved third-party integration.

### 7. Testing (behavior only — no styling assertions)

- `TripAdvisorWidget` renders the shell + a container `<div>` with the expected id; CTA/attribution
  links point at the correct TripAdvisor URL for the given `locationId`.
- `useTripAdvisorWidget` builds a `wejs` URL containing the passed `locationId` and the mapped lang
  token.
- Admin field round-trips: saving a tour persists `tripadvisorLocationId`; loading repopulates it.
- The TripAdvisor `wejs` script is mocked in tests (no real network).
- No `toHaveClass` / `toHaveStyle` / className assertions anywhere.

## YAGNI / out of scope

- No Content API, no API key, no review caching or DB storage of reviews.
- No hybrid self-rendered badges (③).
- No per-tour fallback logic beyond a single `?? businessId` null-check.
- Footer Travelers' Choice badge is optional and last.

## Open risks

- **SPA re-init:** the TA widget script is built for static pages. The hook's keyed re-injection is
  the mitigation; verify across client-side nav, locale toggle, and tour→tour navigation.
- **CSS bleed:** TripAdvisor's stylesheet may clash with the dark/mono aesthetic. Mitigation: the
  ②-iframe-isolation fallback per variant.
- **Exact `wejs` params:** the precise widget type tokens and URL params come from TripAdvisor's
  widget generator and will be confirmed during implementation.
