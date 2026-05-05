# Tour Edit Page Redesign — Design Spec

## Overview

Rebuild the admin tour edit page from a single monolithic form into a tabbed interface with live preview. Editors can see exactly what users will see while editing, using the same widgets rendered on the public site.

## Goals

1. **Ergonomic editing** — split complex form into focused tabs
2. **WYSIWYG preview** — reuse public-facing widgets with inline editing
3. **Highlights as destination entities** — highlights become a shared pool per destination with photos, tours cherry-pick from them

## Tab Structure

Four tabs: **General | Itinerary | Pricing | Highlights**

### General Tab

Single-column form. No preview panel. Contains all fields not covered by other tabs:

- Slug, destination (dropdown), title (titleVi, titleEn)
- Descriptions (descriptionVi, descriptionEn)
- Metadata: price, duration, distance, rating, transportation, groupSize, hotel, guided
- Card image + images gallery (using existing ImageUploadField)
- Included/excluded lists (en/vi)
- Payment details (en/vi)
- Notes (en/vi)
- Meals info (en/vi)
- Own "Save General" button

### Itinerary Tab

Side-by-side layout: left panel (structural controls) + right panel (live preview).

**Left panel:**

- List of day cards showing day label + item count
- Each day: "Add Item" button, delete button
- "Add Day" button at top
- "Save Itinerary" button at bottom

**Right panel:**

- EN/VI segmented picker (top-right, defaults to EN)
- Real `TourItinerary` component rendered with `editable={true}`
- Click day label, time, or description to edit inline
- Subtle dashed border on hover as edit affordance
- Changes update left panel state in real-time

### Pricing Tab

Side-by-side layout: left panel + right panel.

**Left panel:**

- List of pricing groups
- Each group: type selector (vehicle / group-size), label, icon picker
- "Add Tier" button per group, delete button per tier
- Each tier: label, price, min/max group size (for group-size type)
- "Add Pricing Group" button
- "Save Pricing" button at bottom

**Right panel:**

- EN/VI segmented picker
- Real `TourPricing` component with `editable={true}`
- Click price → inline number input
- Click tier label / description → edit inline
- Structural properties (vehicle icons, group size min/max, type) edited via left panel only

### Highlights Tab

Simple picker — no side-by-side preview.

- Destination dropdown (read-only, mirrors General tab's destination selection)
- Checkbox list of all highlights belonging to selected destination
- Each row: checkbox + photo thumbnail + text (en/vi)
- Check/uncheck to associate/dissociate highlights with the tour
- "Save Highlights" button

## Editable Widget Architecture

### EditableContext

React context providing editable state to public widgets:

```typescript
interface EditableContextValue {
  editable: boolean;
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
}
```

- Mounted only in admin preview panels
- Public site never mounts the provider — widgets default to non-editable
- Zero overhead on public site (no extra DOM, no handlers)

### Widget Modifications

Each public widget reads from `EditableContext`. When `editable` is true:

- Text nodes render with `contentEditable` and a subtle dashed border on hover
- On blur or Enter, `onFieldChange` fires with a dot-path and new value
- Numeric fields show an inline number input on click
- Visual appearance stays identical to production

**Field path convention:** `"itinerary.0.items.1.description.en"` — dot-separated path matching the data structure.

### Locale Picker

EN/VI segmented picker component at top-right of preview panel. Defaults to EN. Switching swaps both:

- The locale rendered by the preview widget
- The locale written to by inline edits

## Data Model Changes

### New: Highlight Model

```prisma
model Highlight {
  id            String      @id @default(cuid())
  destinationId String
  destination   Destination @relation(fields: [destinationId], onDelete: Cascade)
  textEn        String
  textVi        String
  imageUrl      String?
  createdAt     DateTime    @default(now())
  tours         Tour[]
}
```

### Modified: Tour Model

- Remove `highlights Json?` column
- Add `highlights Highlight[]` (implicit many-to-many, creates `_HighlightToTour` join table)

### Modified: Destination Model

- Add `highlights Highlight[]` relation

### Migration

- Create `Highlight` table
- Create `_HighlightToTour` join table
- Drop `highlights` JSON column from `Tour`
- Data migration: convert existing JSON highlights to `Highlight` rows (best-effort, assign to tour's destination)

## State Management

### Per-tab state

Each tab manages its own local state, initialized from tour data on page load:

```
General:   { slug, title, descriptions, metadata, images, included, excluded, payment, notes, meals }
Itinerary: { itinerary: ItineraryDay[] }
Pricing:   { pricingGroups: PricingGroup[] }
Highlights: { selectedHighlightIds: string[] }
```

### Save behavior

- Each tab has its own save button
- PUTs only that tab's fields to `/api/admin/tours/[id]`
- Existing API supports partial updates — minimal API changes needed
- Highlights tab uses a dedicated endpoint to set the many-to-many relation

### Unsaved state

- Tab label shows a dot/badge when local state differs from last saved state
- Switching tabs with unsaved changes triggers confirmation dialog
- Browser beforeunload warning when any tab has unsaved changes

### New tour creation

- All tabs start with empty/default state
- General tab must be saved first (creates the tour, returns ID)
- Other tabs disabled until tour exists (ID needed for save endpoints)

## TourHighlights Public Widget Update

The `TourHighlights` component currently renders text-only pill badges. With highlights now having photos:

- Each highlight renders as a card/badge with a small photo + text
- Layout stays horizontal/wrapping (grid of small cards rather than pills)
- Falls back gracefully if a highlight has no photo (text-only pill, same as current)

## Destination Highlights Management

New section on the destination edit page:

- List of highlights with photo thumbnail, en/vi text
- Add new highlight: text fields (en/vi) + photo upload (ImageUploadField)
- Edit existing: inline text editing + photo replace
- Delete with confirmation
- API endpoints: `GET/POST /api/admin/highlights?destinationId=X`, `PUT/DELETE /api/admin/highlights/[id]`

## File Changes

### New files

| File                                          | Purpose                                 |
| --------------------------------------------- | --------------------------------------- |
| `src/components/admin/EditableContext.tsx`    | React context for editable mode         |
| `src/components/admin/LocalePicker.tsx`       | EN/VI segmented picker                  |
| `src/components/admin/TourEditTabs.tsx`       | Main tabbed layout orchestrator         |
| `src/components/admin/tabs/GeneralTab.tsx`    | General info form                       |
| `src/components/admin/tabs/ItineraryTab.tsx`  | Left panel + editable itinerary preview |
| `src/components/admin/tabs/PricingTab.tsx`    | Left panel + editable pricing preview   |
| `src/components/admin/tabs/HighlightsTab.tsx` | Destination highlight picker            |
| `src/pages/api/admin/highlights/index.ts`     | CRUD for destination highlights         |
| `src/pages/api/admin/highlights/[id].ts`      | Single highlight operations             |
| Prisma migration                              | Highlight model + join table            |

### Modified files

| File                                                 | Change                                             |
| ---------------------------------------------------- | -------------------------------------------------- |
| `src/components/tour-itinerary/index.tsx`            | Add editable mode via EditableContext              |
| `src/components/tour-pricing/index.tsx`              | Add editable mode via EditableContext              |
| `src/components/tour-pricing/vehicle-pricing.tsx`    | Inline edit support                                |
| `src/components/tour-pricing/group-size-pricing.tsx` | Inline edit support                                |
| `src/components/tour-highlights/index.tsx`           | Read from relation, render photos                  |
| `src/pages/admin/tours/[id]/edit.tsx`                | Replace TourForm with TourEditTabs                 |
| `src/pages/admin/tours/new.tsx`                      | Replace TourForm with TourEditTabs                 |
| `src/pages/admin/destinations/`                      | Add highlights management section                  |
| `prisma/schema.prisma`                               | Add Highlight model, update Tour + Destination     |
| `src/types/index.ts`                                 | Add Highlight type, update Tour type               |
| `src/data/queries.ts`                                | Update tour queries to include highlights relation |

### Deleted files

| File                                | Reason                        |
| ----------------------------------- | ----------------------------- |
| `src/components/admin/TourForm.tsx` | Replaced by tabbed components |
