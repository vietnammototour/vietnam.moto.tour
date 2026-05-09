# Image Collection CMS — Design

**Date:** 2026-05-08
**Status:** Approved (awaiting implementation plan)

## Goal

Replace the hardcoded 5-image gallery on the home page with an admin-managed image
collection system. Make the system generic so it can be reused for other galleries
(tour pages, etc.) without further schema changes.

## Scope

- New generic `ImageCollection` + `CollectionImage` Prisma models keyed by string.
- Admin pages to list, create, edit, and delete collections.
- Drag-and-drop reordering, per-image localized alt text (en/vi), upload via existing
  pipeline.
- Wire home page to read from DB instead of hardcoded files.
- Seed `home-gallery` from existing 5 jpegs; remove hardcoded files and i18n keys
  in the same PR.

Out of scope: destinations masonry overflow button (separate PR).

## Decisions

| #   | Question         | Decision                                                                 |
| --- | ---------------- | ------------------------------------------------------------------------ |
| 1   | Storage shape    | Generic `ImageCollection` with `key` column                              |
| 2   | Alt localization | Per-row `altEn` + `altVi`, matches `Highlight`                           |
| 3   | Grid bounds      | Min 1, max 10 images per collection                                      |
| 4   | Reorder UX       | Drag-and-drop (`@dnd-kit/core` + `@dnd-kit/sortable`, new deps approved) |
| 5   | Admin nav        | Top-level `/admin/image-collections` listing, drill-in editor            |
| 6   | Migration        | Seed `home-gallery` from existing 5 jpegs, then delete files + i18n keys |

## Data Model

```prisma
model ImageCollection {
  id        String            @id @default(cuid())
  key       String            @unique
  label     String
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  images    CollectionImage[]
}

model CollectionImage {
  id           String          @id @default(cuid())
  collectionId String
  collection   ImageCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  url          String
  altEn        String          @default("")
  altVi        String          @default("")
  order        Int             @default(0)
  createdAt    DateTime        @default(now())

  @@index([collectionId, order])
}
```

Bounds enforced in API + Yup schema, not DB.

## API Routes

All routes registered in `src/routes/index.ts` with typed `api.*` wrappers
(`{data, error}` result pattern). Admin auth required (NextAuth ADMIN role).

**Public/shared (data layer):**

- `getImageCollection(key)` in `src/data/queries.ts` — returns ordered images, used
  by `getServerSideProps`.

**Admin:**

- `GET    /api/admin/image-collections`
- `POST   /api/admin/image-collections` — body: `{key, label}`
- `GET    /api/admin/image-collections/[id]`
- `PATCH  /api/admin/image-collections/[id]` — update `label`
- `DELETE /api/admin/image-collections/[id]` — cascades
- `POST   /api/admin/image-collections/[id]/images` — multipart, reuses
  `/api/admin/upload.ts` pipeline. Reject 400 if collection has 10.
- `PATCH  /api/admin/image-collections/[id]/images/[imageId]` — update
  `altEn`/`altVi` or replace `url`
- `DELETE /api/admin/image-collections/[id]/images/[imageId]` — reject 400 if
  collection has 1
- `PATCH  /api/admin/image-collections/[id]/images/reorder` — body: `{ids: string[]}`,
  bulk `order` rewrite in transaction

## Admin UI

**Routes:**

- `/admin/image-collections` — list page, table (label, key, image count, edit/delete).
- `/admin/image-collections/new` — create form (`key`, `label`).
- `/admin/image-collections/[id]` — editor.

**Components** (`src/components/Admin/ImageCollectionEditor/`):

- `ImageCollectionEditor.tsx` — wires `@dnd-kit` `DndContext` + `SortableContext`.
- `SortableImageCard.tsx` — thumbnail, drag handle, alt-en/alt-vi inputs (locale
  tabs), replace button, delete button.
- `AddImageButton.tsx` — file picker → upload → POST. Disabled at 10.
- `ImageCollectionEditor.form-utils.ts` — Yup schema for alt fields.

**UX:**

- Drag → optimistic local reorder → debounced PATCH `/reorder`.
- Alt fields → debounced auto-save.
- Replace → file picker → upload → PATCH `url`.
- Delete: confirm dialog; disabled when count=1.
- Locale tabs (en/vi) match existing perks/destination editor pattern.

**Nav:** add entry in admin sidebar (`src/pages/admin/index.tsx`) alongside existing
items.

**Component declaration:** `export function Name(props: Props)` per CLAUDE.md.
All form inputs use shared primitives from `@/components/ui`. All interactive
elements get `cursor-pointer`. No inline styles. No raw JSX strings — all visible
labels go through `next-intl` translation files (or DB Translation table per
existing convention).

## Home Page Integration

`src/pages/index.tsx`:

- `getServerSideProps` adds `getImageCollection('home-gallery')` to existing
  `Promise.all`.
- Pass `galleryImages` prop instead of building from hardcoded URLs.
- Remove `galleryImageUrls` (lines 28-33), `galleryAltKeys` + mapping (lines 57-67).
- Render loop unchanged; alt picked by current locale (`altVi` for `vi`, else
  `altEn`).
- Defensive: if collection missing/empty, hide section.

## Cleanup (same PR)

- Delete `public/assets/images/gallery/gallery-one-img-{1..5}.jpeg`.
- Remove `galleryAlt1..galleryAlt5` from `src/messages/{vi,en}.json` and DB
  Translation table (per "DB-only translations" rule).

## Seed / Migration

One-shot script (`prisma/seed-home-gallery.ts`) run after Prisma migration:

1. Idempotency check: exit if `ImageCollection` with `key='home-gallery'` exists.
2. Read 5 jpegs from `public/assets/images/gallery/`.
3. Push each through `upload.ts` transcode pipeline into upload dir.
4. Create `ImageCollection {key:'home-gallery', label:'Home Gallery'}`.
5. Insert 5 `CollectionImage` rows with order 0..4, alt copied from current
   `galleryAlt1..5` Translation rows.

Single PR. Deploy order on prod: `prisma migrate deploy` → seed script → app
restart. Hardcoded jpegs and i18n keys removed in same commit; `getImageCollection`
reads DB which is populated by seed before app starts serving the new code.

## Testing

**Unit (Jest + RTL):**

- `SortableImageCard.spec.tsx` — renders, alt inputs fire onChange, delete handler
  fires, delete disabled when sole image.
- `ImageCollectionEditor.spec.tsx` — renders N cards, "Add" disabled at 10, reorder
  handler fires on drag end (mock dnd-kit).
- `form-utils.spec.ts` — Yup validates alt length bounds.
- `queries.spec.ts` — `getImageCollection` returns ordered, returns null for
  missing key.

**API routes:**

- POST image rejected at 10 → 400.
- DELETE rejected at 1 → 400.
- Reorder transaction reassigns all order values.
- Non-admin → 401.

**Existing:** `GalleryItem.spec.tsx` unchanged.

No styling assertions (CLAUDE.md rule).

## Risks & Mitigations

- **Empty gallery between deploy and seed:** seed runs immediately after migrate;
  defensive empty-state hides section instead of crashing.
- **Drag-and-drop accessibility:** `@dnd-kit` includes keyboard support; ensure
  enabled.
- **Upload pipeline coupling:** reuse existing `/api/admin/upload.ts` — do not
  duplicate transcode logic.
- **Translation cleanup:** verify no other components reference `galleryAlt*`
  keys before deletion (grep).

## New Dependencies

- `@dnd-kit/core`
- `@dnd-kit/sortable`

User-approved during brainstorm.
