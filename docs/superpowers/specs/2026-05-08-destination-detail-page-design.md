# Destination Detail Page — Design

**Date:** 2026-05-08
**Status:** Approved (pending user spec review)

## Goal

Add a dedicated public-facing detail page for each destination (e.g., Da Lat, Saigon). Currently destinations on the home page are clickable cards that link to `/tours?destination=<id>` (the tour list page filtered by destination). That filter URL must remain functional. The new detail page surfaces destination-specific content (hero, description, highlights) plus the list of tours associated with the destination.

## Routing

- New page file: `src/pages/destinations/[slug].tsx`.
- Public URL: `/destinations/<slug>` (e.g., `/destinations/dalat`).
- Data fetching: `getServerSideProps` (matches existing `/tours/[slug]` and `/` pattern).
- 404 (`{notFound: true}`) when destination not found or `isActive=false`.
- Add to `src/routes/registry.ts`:
  ```ts
  destinations: {
    detail: {path: (p: {slug: string}) => `/destinations/${p.slug}`},
  },
  ```
- `routes.tours.byDestination` (existing `/tours?destination=<id>`) is preserved untouched. Other entry points (search params, manual links) can still use it.
- `DestinationCard` href is updated from `routes.tours.byDestination(...)` → `routes.destinations.detail({slug})`. Card spec test updated.

## Schema Changes

`Highlight` model gets split into title + description (both localized) instead of single `text*` fields.

Prisma diff:

```
- textEn String
- textVi String
+ titleEn       String @default("")
+ titleVi       String @default("")
+ descriptionEn String @default("")
+ descriptionVi String @default("")
```

Migration steps:

1. Add the four new columns with empty-string defaults.
2. Backfill SQL: `UPDATE "Highlight" SET "titleEn" = "textEn", "titleVi" = "textVi";` (descriptions remain empty for existing rows; admin will fill them in).
3. Drop `textEn` and `textVi`.

Code touched by the schema change:

- `src/types/index.ts` — update `Highlight` type (add new fields, drop `text*`).
- `src/data/queries.ts` — update selects/mappers that read highlights.
- Admin destination highlights tab — extend form, Yup schema (`form-utils.ts`), defaults, and submit handler to include `titleVi/En` + `descriptionVi/En`.
- Any tour page or component that currently reads `highlight.textVi/textEn` — update to `titleVi/titleEn` + new description fields where applicable.

## Page Sections (in order)

1. **DestinationHero** — `heroImage` background, localized name, localized description overlay. Reuse/adapt `PageHeader` if it fits; otherwise new component.
2. **DestinationHighlights** — section heading + grid of `HighlightCard` (image + localized title + localized description). Empty state when destination has no highlights.
3. **DestinationTours** — section heading + grid of existing `<TourCard>` filtered to this destination. Simple grid, no filters/sorting/pagination. Empty state when none.
4. **CTA** — contact/inquiry block at bottom. Link to `/contact`. Reuse existing CTA pattern if one exists; otherwise minimal local block.

## Component Layout

```
src/components/destination-detail/
  DestinationHero/{index.ts, DestinationHero.tsx, DestinationHero.spec.tsx}
  DestinationHighlights/{index.ts, DestinationHighlights.tsx, DestinationHighlights.spec.tsx}
  HighlightCard/{index.ts, HighlightCard.tsx, HighlightCard.spec.tsx}
  DestinationTours/{index.ts, DestinationTours.tsx, DestinationTours.spec.tsx}
```

Page (`src/pages/destinations/[slug].tsx`) is a thin composition wrapper. One component per file (CLAUDE.md rule).

## Data Flow

`getServerSideProps({params, locale})`:

1. Validate `slug` is a string.
2. Call new helper `getDestinationBySlug(slug)` in `src/data/queries.ts`:
   ```ts
   prisma.destination.findUnique({
     where: {slug},
     include: {
       highlights: true,
       tours: {where: {status: {in: ['PUBLISHED', 'FEATURED']}}},
     },
   });
   ```
   (Verify the public tour-status filter against existing `queries.ts` patterns during implementation; align with whatever the home/tours page currently uses.)
3. If `null` or `!isActive` → return `{notFound: true}`.
4. Run results through a mapper that returns plain JSON-serializable objects (strip/convert `Date`, etc., per CLAUDE.md "treat property unwrapping as unsafe" rule). Mapper enumerates fields explicitly — no `Omit` shortcuts.
5. Load `next-intl` messages for the locale.
6. Return `{props: {destination, highlights, tours, messages}}`.

## i18n

DB-only translations (per memory rule). Add namespaces/keys via the Translation table and seed JSON if applicable:

- `destinations.detail.highlightsTitle`
- `destinations.detail.toursTitle`
- `destinations.detail.noTours`
- `destinations.detail.cta.title`
- `destinations.detail.cta.button`

Localized row fields read by locale (existing helper pattern reused):

- `destination.nameVi / nameEn`
- `destination.descriptionVi / descriptionEn`
- `highlight.titleVi / titleEn`
- `highlight.descriptionVi / descriptionEn`

## Testing

Per CLAUDE.md — Jest + RTL, no styling/CSS assertions.

- `HighlightCard.spec.tsx` — renders title, description, image; locale switching picks correct field.
- `DestinationHero.spec.tsx` — renders name + description; hero image rendered.
- `DestinationHighlights.spec.tsx` — maps array of highlights; empty state.
- `DestinationTours.spec.tsx` — renders `TourCard` per tour; empty state.
- `DestinationCard.spec.tsx` — updated assertion: href points to `/destinations/<slug>`.
- Page-level test (`destinations/[slug].spec.tsx`) — composes sections given mock props.

No `getServerSideProps` integration tests (matches existing pattern).

## Out of Scope

- Filter/sort UI on the destination page.
- Pagination of tours.
- Static generation / ISR.
- Removing `routes.tours.byDestination` (the filter URL stays).
- Visual redesign of `DestinationCard` (only its href changes).
- SEO metadata beyond a standard localized `<title>` + meta description (follow the existing page pattern).
