# TripAdvisor Reviews — Design

**Date:** 2026-05-30
**Status:** Approved (brainstorm), pending spec review

## Goal

Surface real, verifiable TripAdvisor reviews on the site. Reviews are copied from
TripAdvisor into our own DB (not fabricated), each carrying a link back to its
TripAdvisor source so visitors can verify. Reviews are linked to tours in our system.

- Home page shows ~6 hand-picked (featured) reviews.
- Each tour detail page shows **all** reviews linked to that tour.
- A "View all reviews on TripAdvisor" CTA lets visitors reach the source listing.

## Decisions (from brainstorm)

- **Home selection:** `isFeatured` boolean flag + `displayOrder` for ordering. Take 6.
- **Per-tour:** show **all** reviews linked to the tour. No cap, no per-tour selection.
- **Review text:** original language only, single field. No translation (preserves
  authenticity). Section chrome/labels still localized; review body is not.
- **Avatar:** store TripAdvisor's image URL string (hotlink). UI falls back to
  initials if missing/broken. No upload pipeline for avatars.
- **Per-review `sourceUrl`:** deep link to the specific review when available, else
  the tour's TripAdvisor page.
- **"View all" CTA:**
  - Home → global constant
    `https://www.tripadvisor.com/Attraction_Review-g293928-d5501636-Reviews-Vietnam_Motorcycle_Tour-Nha_Trang_Khanh_Hoa_Province.html`
  - Tour page → that tour's own `tripAdvisorUrl` (e.g.
    `https://www.tripadvisor.com/AttractionProductReview-g293928-d18975102-...`).
    Hidden if unset.
- **Per-review gallery:** up to 5 **TripAdvisor media URLs** (hotlinks), stored as
  a `string[]`. No upload pipeline, no child table. The example links are TripAdvisor
  photo-viewer page URLs (`...#/media/...`), so they render as clickable thumbnail
  tiles that open TripAdvisor in a new tab — not inline `<img>`.

## Data Layer

### New `Review` model

```prisma
model Review {
  id               String   @id @default(uuid())
  tourId           String
  tour             Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  reviewerName     String
  reviewerLocation String?              // "London, UK"
  avatarUrl        String?              // TripAdvisor image URL (hotlink)
  rating           Int                  // 1–5
  title            String
  body             String               // original language, verbatim
  reviewDate       DateTime             // date on TripAdvisor
  sourceUrl        String               // verification link
  images           Json     @default("[]")    // up to 5 TripAdvisor media URLs (hotlinks)
  isFeatured       Boolean  @default(false)   // show on home
  displayOrder     Int      @default(0)       // home ordering
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([tourId])
  @@index([isFeatured])
}
```

### `Tour` model change

Add `tripAdvisorUrl String?` — per-tour attraction-product page for the "View all"
CTA on the tour detail page.

### Migration

Prisma migration: create `Review` table, add `Tour.tripAdvisorUrl` column.

### Queries (`src/data/queries.ts`)

- `getTourReviews(tourId)` → all reviews for a tour, `reviewDate desc`.
- `getFeaturedReviews()` → `isFeatured = true`, `displayOrder asc`, take 6.
- Both pass through a mapper that converts `Date` (`reviewDate`, `createdAt`,
  `updatedAt`) to ISO strings and shapes `images` as `string[]`. No raw Prisma rows
  out of `getStaticProps`/`getServerSideProps` (per CLAUDE.md).

Domain type `Review` enumerated explicitly (no `Omit`/spread carry-through of Date
fields) in `src/types/index.ts`.

## Admin CRUD

Follows `.claude/ADMIN.md`. New section `src/pages/admin/reviews/`.

- **Shell:** `AdminPageShell` — fixed header, fixed footer/action-bar, scrollable
  middle.
- **List page:** rows show reviewer name, rating, linked tour, featured badge.
  - Primary: `<Button variant="primary" icon={plus}>Add review</Button>`.
  - Inline: `<Button variant="ghost-primary" icon={pencil}>Edit</Button>` and
    `<Button variant="ghost-danger">Delete</Button>` → `ConfirmModal` (no
    `window.confirm`).
- **Edit page:** co-located `reviews.form-utils.ts` exporting Yup schema, form type
  via `yup.InferType`, default values, submit handler. Component only renders +
  wires `useForm()`.
  - Fields: tour selector (dropdown of tours), reviewer name, reviewer location,
    avatar URL, rating (1–5), title, body (textarea), review date, source URL,
    featured toggle, display order, **image links** (dynamic list of up to 5
    TripAdvisor media URL text inputs — no upload widget).
  - No locale switcher — single-language review text, exempt from the
    localized-field rule.
  - Shared UI primitives only (`Button`, `TextInput`, `Textarea`, `NumberInput`,
    `FormField`, `ImageUpload`).
- **API routes:** `src/pages/api/admin/reviews/` — list/create/update/delete. All
  access through `src/routes/index.ts` (`routes` path builders + `api` fetch
  wrappers). No hardcoded route strings or raw `fetch`.
- **Tour admin form:** add `tripAdvisorUrl` text field.

## Public Display

### Components (`src/components/reviews/`)

- `ReviewCard` — avatar (or initials fallback), reviewer name + location, star
  rating, title, body, review date, photo-thumbnail tiles (up to 5, each an anchor
  to its TripAdvisor media URL, new tab), "Verified on TripAdvisor" link →
  `sourceUrl` (`target="_blank"`, `rel="noopener noreferrer"`).
- `StarRating` — small presentational FontAwesome-star sub-component, reused.
- `ReviewsSection` (home) — 6 featured reviews + "View all reviews on TripAdvisor"
  CTA → global constant.
- `TourReviews` (tour page) — all reviews for the tour + "View all reviews on
  TripAdvisor" CTA → tour `tripAdvisorUrl` (CTA hidden if unset; whole block hidden
  if zero reviews).

One component per file. `index.ts` re-exports per component folder.

### Wiring

- Home page `getStaticProps` loads `getFeaturedReviews()`.
- Tour detail page `getStaticProps`/`getServerSideProps` loads
  `getTourReviews(tour.id)`.

### Constants & i18n

- Global TripAdvisor business URL → `src/utils/index.ts`.
- New translation keys seeded to DB `Translation` table (DB-only, no JSON):
  `reviews.heading`, `reviews.verifiedOn`, `reviews.viewAllOnTripAdvisor`,
  `reviews.noReviews`, etc. Check `common.*` before adding any generic key.

## Out of Scope

- Star-rating aggregation / average score display.
- Importing reviews automatically from TripAdvisor (manual copy/paste only).
- Review moderation / user-submitted reviews.
- Avatar upload pipeline (hotlink only).
- Review image upload / hosting — image links are TripAdvisor hotlinks only; no new
  `ReviewImage` table and no changes to the shared upload pipeline.

## Testing

- Query mappers: Date→ISO conversion, `images` shaping, ordering/limit.
- `StarRating`: renders N filled stars for rating N (behavior/structure, not CSS).
- `ReviewCard`: renders name, body, source link with correct `href`/`rel`; initials
  fallback when no avatar.
- `ReviewsSection` / `TourReviews`: empty-state hidden, CTA href correct, CTA hidden
  when no tour URL.
- Admin form: Yup validation (rating 1–5, required fields, max 5 images), submit
  payload shape.
- No assertions on CSS classes/styles (per CLAUDE.md testing rule).
