# Tour Status Enum — Design Spec

**Date:** 2026-05-05
**Status:** Approved

## Summary

Replace the `isActive: Boolean` field on the Tour model with a `TourStatus` enum (`DRAFT | PUBLISHED | FEATURED | ARCHIVED`). New tours default to `DRAFT`. Only `PUBLISHED` and `FEATURED` tours are visible to public users. Admins see all tours everywhere, with a status badge overlay on non-public tours. Public tour pages switch from `getStaticProps` to `getServerSideProps` to enable session-aware rendering.

## Data Model

### Prisma Schema

Add enum and replace `isActive`:

```prisma
enum TourStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  FEATURED
}

model Tour {
  // ... existing fields ...
  status    TourStatus @default(DRAFT)
  // REMOVE: isActive Boolean @default(true)
}
```

### Migration Strategy

- Existing tours with `isActive: true` → `PUBLISHED`
- Existing tours with `isActive: false` → `ARCHIVED`
- New tours default to `DRAFT`

### Public Visibility Rule

Only `PUBLISHED` and `FEATURED` tours appear for non-admin users. All other statuses are admin-only.

## Query Layer (`src/data/queries.ts`)

- **`getAllTours(isAdmin?: boolean)`** — if admin, return all tours. Otherwise filter `status IN (PUBLISHED, FEATURED)`.
- **`getTourBySlug(slug, isAdmin?: boolean)`** — same logic. Non-admin + non-public status returns `null`.
- **`getAllTourSlugs()`** — only `PUBLISHED` + `FEATURED` slugs (for sitemap/SEO).
- **`getActiveDestinationsFromDb(isAdmin?: boolean)`** — nested tour filter respects status.
- Remove JSON fallback for tours (DB is source of truth).

### Type Changes (`src/types/index.ts`)

- Add `status: TourStatus` to `Tour` type (use string union: `'DRAFT' | 'PUBLISHED' | 'FEATURED' | 'ARCHIVED'`)
- Remove `isActive` field

## Public Pages — SSR Switch

Switch from `getStaticProps` to `getServerSideProps`:

### `src/pages/index.tsx` (Home)

- Get session via `getServerSession(req, res, authOptions)`
- Pass `isAdmin` to `getAllTours(isAdmin)`
- Pass `isAdmin` as page prop

### `src/pages/tours.tsx` (Tours listing)

- Same session check pattern
- Pass `isAdmin` to `getAllTours(isAdmin)`

### `src/pages/tours/[slug].tsx` (Tour detail)

- Get session, call `getTourBySlug(slug, isAdmin)`
- If null → `{ notFound: true }`
- Remove `getStaticPaths` entirely

### Admin Badge on Non-Public Tours

When admin views a tour with status other than `PUBLISHED`:

- Floating status badge overlay (top-right corner or similar prominent position)
- Badge text: "DRAFT", "ARCHIVED", or "FEATURED"
- Distinct color per status matching admin panel colors
- Clearly communicates the tour is not publicly visible

### Session Check

Use `getServerSession(req, res, authOptions)` in each `getServerSideProps`. Pass `isAdmin: boolean` as a page prop.

## Admin Panel

### Tours List (`src/pages/admin/tours/index.tsx`)

- Replace `isActive` toggle button with `StatusPicker` segmented control
- Clicking a segment sends `PUT /api/admin/tours/[id]` with new status
- Status badge in table row uses same color scheme

### Tour Form (`src/components/admin/TourForm.tsx`)

- Replace `isActive` checkbox with `StatusPicker` component
- New tours default to `DRAFT` segment selected

### API Routes (`src/pages/api/admin/tours/`)

- **`GET /tours`** — return all tours regardless of status (no change)
- **`POST /tours`** — create with `status: DRAFT` default
- **`PUT /tours/[id]`** — accept `status` field
- **`DELETE /tours/[id]`** — set `status: ARCHIVED` instead of `isActive: false`

### Admin Stats (`/api/admin/stats.ts`)

- Count `PUBLISHED` + `FEATURED` as "active tours" instead of `isActive: true`

## StatusPicker Component

Reusable segmented control for admin panel:

- **Location:** `src/components/admin/StatusPicker.tsx`
- **Props:** `value: TourStatus`, `onChange: (status: TourStatus) => void`, `disabled?: boolean`
- **Appearance:** Horizontal row of pill segments, SwiftUI segmented picker style
  - Selected segment: filled background with status color
  - Unselected: transparent with border
- **Colors:**
  - `DRAFT` — amber/yellow
  - `PUBLISHED` — green
  - `FEATURED` — blue
  - `ARCHIVED` — gray
- **Sizing:** Compact enough for inline table row use
- **Styling:** Tailwind only, no inline styles
- **Accessibility:** `role="radiogroup"` / `role="radio"` with `aria-checked`

## Files Modified

| File                                    | Change                                                      |
| --------------------------------------- | ----------------------------------------------------------- |
| `prisma/schema.prisma`                  | Add `TourStatus` enum, replace `isActive` with `status`     |
| `src/types/index.ts`                    | Add status type, remove `isActive`                          |
| `src/data/queries.ts`                   | Update all tour queries with `isAdmin` param, status filter |
| `src/pages/index.tsx`                   | Switch to `getServerSideProps`, session check               |
| `src/pages/tours.tsx`                   | Switch to `getServerSideProps`, session check               |
| `src/pages/tours/[slug].tsx`            | Switch to `getServerSideProps`, remove `getStaticPaths`     |
| `src/components/admin/StatusPicker.tsx` | New reusable segmented control component                    |
| `src/pages/admin/tours/index.tsx`       | Replace `isActive` toggle with `StatusPicker`               |
| `src/components/admin/TourForm.tsx`     | Replace `isActive` checkbox with `StatusPicker`             |
| `src/pages/api/admin/tours/index.ts`    | Use `status: DRAFT` default on create                       |
| `src/pages/api/admin/tours/[id].ts`     | Accept `status`, DELETE sets `ARCHIVED`                     |
| `src/pages/api/admin/stats.ts`          | Count by status instead of `isActive`                       |

## Out of Scope

- Destination model status enum (keep `isActive` for now)
- Scheduled publishing (auto-publish at date/time)
- Bulk status changes
- Status change history/audit log
