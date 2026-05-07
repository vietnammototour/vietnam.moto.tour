# Perks System — Design

**Date:** 2026-05-07
**Status:** Approved, pending implementation plan

## Goal

Replace per-tour free-form `included`/`excluded` JSON arrays with a centralized **Perk** catalog managed in the admin panel. Each tour assigns existing perks into "included" or "excluded" buckets via drag-and-drop. Tour records hold only foreign-key references — no embedded perk data.

## Scope

1. New `Perk` model + `TourPerk` join table.
2. Admin page `/admin/perks` — list, create, edit, archive.
3. New "Perks" tab in tour edit flow with three-zone drag-and-drop UI.
4. Public tour detail page renders perks from the join table (icon + localized label).
5. Migrate existing `Tour.included` / `Tour.excluded` JSON into the catalog and drop the old columns.
6. Remove Tevily icon font; standardize on FontAwesome.

## Data Model (Prisma)

```prisma
enum PerkCategory {
  TRANSPORT
  FOOD
  ACCOMMODATION
  GUIDE
  SUPPORT
  OTHER
}

enum PerkBucket {
  INCLUDED
  EXCLUDED
}

model Perk {
  id        String       @id @default(uuid())
  labelEn   String
  labelVi   String
  icon      String       // FontAwesome class, e.g. "fa-solid fa-motorcycle"
  category  PerkCategory @default(OTHER)
  archived  Boolean      @default(false)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  tours     TourPerk[]
}

model TourPerk {
  tourId String
  perkId String
  bucket PerkBucket
  tour   Tour @relation(fields: [tourId], references: [id], onDelete: Cascade)
  perk   Perk @relation(fields: [perkId], references: [id], onDelete: Cascade)

  @@id([tourId, perkId])
  @@index([perkId])
}
```

`Tour` model changes: drop `included Json` and `excluded Json`. Add `perks TourPerk[]`.

The composite primary key `(tourId, perkId)` guarantees a perk cannot be in both buckets for the same tour simultaneously.

## Migration Strategy

Two-phase to keep data safe:

**Phase 1 — additive migration**

1. Create `Perk`, `TourPerk`, enums.
2. Tour keeps existing `included` / `excluded` JSON columns (untouched).

**Phase 2 — data migration script** (`scripts/migrate-perks.ts`, manual run post-deploy)

1. Read every Tour's `included` and `excluded` JSON arrays.
2. Dedupe by lowercase-trimmed `labelEn`. Insert missing entries into `Perk` with `category=OTHER`, `icon='fa-solid fa-circle-check'`. Vietnamese label preserved verbatim.
3. Insert `TourPerk(tourId, perkId, bucket)` rows.
4. Idempotent (safe to re-run): use upserts.

**Phase 3 — cleanup migration**

Drop `Tour.included` and `Tour.excluded` columns once data is verified.

## Admin: Perks Page

Route: `/admin/perks` (registered in `src/routes/index.ts`).

### List view (`src/pages/admin/perks/index.tsx`)

- Table grouped by category (collapsible sections).
- Columns: icon preview, `labelEn`, `labelVi`, category badge, archived badge, actions.
- Filter bar: category dropdown, archived toggle, search by label.
- "New perk" button → `/admin/perks/new`.

### Create / edit (`/admin/perks/new`, `/admin/perks/[id]/edit`)

- Form fields: `labelEn`, `labelVi`, `icon`, `category`, `archived` (edit-only).
- Form convention: `PerkForm.tsx` + `PerkForm.form-utils.ts` (Yup schema, default values, submit handler).
- Icon picker: searchable modal. Loads `src/data/fa-icons.json` — committed list of FA Free icon names with style prefix (~2k entries). Grid preview, search-by-name. Selected value stored as full class string (e.g. `fa-solid fa-motorcycle`).

### Sidebar nav

Add "Perks" entry between "Destinations" and "Tours" in admin layout.

## Admin: Tour Perks Tab

New tab in tour edit page alongside General, Itinerary, etc.

### Components (`src/components/Admin/tabs/PerksTab/`)

- `PerksTab.tsx` — layout + DnD context, integrates with parent tour form.
- `PerksTab.form-utils.ts` — Yup schema, default values.
- `PerkChip.tsx` — draggable perk card (icon + localized label + category badge).
- `PerkDropZone.tsx` — droppable column container.

### Layout (three-zone, auto-filtered)

```
┌────────────────────────────────────────────┐
│ Available perks (auto-filtered)            │
│ [chip] [chip] [chip] ...                   │
│ filter: category dropdown, search          │
└────────────────────────────────────────────┘
┌──────────────────────┬─────────────────────┐
│ ✓ Included           │ ✗ Excluded          │
│ [chip] [chip]        │ [chip] [chip]       │
└──────────────────────┴─────────────────────┘
```

### Behavior

- **Available pool** = all non-archived Perks minus those already assigned to this tour. Sorted by category, then `labelEn`.
- Drag chip from Available → drop in Included or Excluded.
- Drag chip between Included ↔ Excluded.
- Drag chip back to Available (or click ✕ on chip) → unassign.
- No ordering within boxes — display order is fixed (category, then label).
- Drop zones highlight on drag-over.

### Persistence

- Tab merges into existing tour edit form; one submit button at page level.
- Form values: `{includedPerkIds: string[], excludedPerkIds: string[]}`.
- On submit, `PUT /api/admin/tours/[id]` includes both arrays. Server replaces all `TourPerk` rows for the tour in a transaction (delete-all + `createMany`).
- Initial load: `getServerSideProps` joins `tour.perks` with `perk`, splits by bucket, populates form defaults.

## API

Routes under `src/pages/api/admin/perks/`:

- `GET    /api/admin/perks?archived=&category=&search=` — list with filters.
- `POST   /api/admin/perks` — create.
- `PUT    /api/admin/perks/[id]` — update (incl. `archived` flag).
- `DELETE /api/admin/perks/[id]` — hard delete only allowed if zero `TourPerk` rows reference the perk; otherwise return 409 Conflict (UI suggests archive instead).

All routes use the typed `api` client in `src/routes/index.ts` — no raw `fetch`.

## Public Rendering

`src/components/tour-detail/TourIncluded/TourIncluded.tsx`:

- Props: `included: Perk[]`, `excluded: Perk[]` (was `LocalizedText[]`).
- Render: `<i className={perk.icon} />` + localized label (`labelVi` or `labelEn` based on locale).
- Sort: category, then label.

`src/data/queries.ts` — `getTourBySlug` includes:

```ts
perks: {
  where: { perk: { archived: false } },
  include: { perk: true },
}
```

Map results into `{included, excluded}` Perk arrays before returning.

`src/types/index.ts`: add `Perk` type. Tour type `included` / `excluded` change from `LocalizedText[]` to `Perk[]`.

Archived perks are excluded at query level so neither admin assignment UI nor public render shows them. Their `TourPerk` rows are preserved — un-archiving restores visibility.

## Tevily Removal

- Delete the `<link>` for `tevily-icons/style.css` in `src/pages/_document.tsx`.
- Delete `public/assets/vendors/tevily-icons/`.
- No JSX uses Tevily classes (verified via grep) — no further changes.

## i18n

New keys added to DB `Translation` table (repo is DB-only for translations):

- `admin.perks.*` — page title, table headers, form labels, archive confirm dialog.
- `admin.perks.category.{TRANSPORT|FOOD|ACCOMMODATION|GUIDE|SUPPORT|OTHER}` — category labels.
- `admin.tours.tabs.perks` — tab label.

Public side: no new keys; perk labels come from DB columns.

## Testing

- `PerkForm.spec.tsx` — form validation, submit handler.
- `PerksTab.spec.tsx` — drag-and-drop assignment flow, auto-filter behavior. No styling assertions.
- API handler tests in `src/pages/api/admin/perks/__tests__/` — CRUD, delete-blocked-when-in-use, list filters.
- Migration script smoke-tested on a snapshot of production data before running on prod.

## New Dependencies

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

(User-approved during brainstorming.)

## Out of Scope

- Reordering perks within a bucket (sort is fixed: category → label).
- Bulk import/export of perks.
- Per-tour perk overrides (e.g. custom label for a single tour).
- Perk usage analytics in admin.
