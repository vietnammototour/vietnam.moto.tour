# Data Layer Refactor: Destination-Tour Referential Integrity

## Problem

The current data layer has a fragile relationship between tours and destinations:

- Tours reference destinations via a loose `location` string matching `Destination.name`
- Destinations store a hardcoded `tours` count that can go stale
- The home page renders all destinations regardless of whether any tours reference them

## Goal

Make tours reference destinations by ID, derive all relationship data (counts, active destinations) at runtime, and enable URL-based tour filtering by destination.

## Approach

Numeric `destinationId` foreign key on tours + helper functions that compute derived data. No bidirectional references, no slugs on destinations.

---

## Schema Changes

### `destinations.json`

Remove the `tours` count field:

```json
{
  "id": 1,
  "name": "Dalat",
  "imageUrl": "...",
  "size": "large"
}
```

### `tours.json`

Replace `location: string` with `destinationId: number`:

```json
{
  "id": 1,
  "title": "...",
  "destinationId": 1,
  "slug": "...",
  ...
}
```

### `src/types/index.ts`

```typescript
interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  size: 'small' | 'large';
}

interface Tour {
  id: number;
  title: string;
  destinationId: number; // replaces `location: string`
  slug: string;
  // ... rest unchanged
}
```

---

## Helper Functions (`src/data/index.ts`)

```typescript
/** Destination lookup by ID */
export function getDestinationById(id: number): Destination | undefined;

/** All tours for a given destination */
export function getToursByDestination(destinationId: number): Tour[];

/** Only destinations that have >= 1 tour, with computed tour count */
export function getActiveDestinations(): (Destination & {tourCount: number})[];

/** Get destination name for display (tour cards, hero, etc.) */
export function getDestinationName(destinationId: number): string;
```

### Behavior Details

- `getActiveDestinations()`: Iterates tours, collects unique `destinationId` values, maps to destinations with computed counts. Returns in the same order as `destinations.json` (preserves layout intent).
- `getDestinationName()`: Returns `destination.name` or empty string if ID not found (logs dev warning).
- `getToursByDestination()`: Simple filter on `toursData`.

---

## Component Changes

### Home Page (`src/pages/index.tsx`)

- Replace `destinationsData` with `getActiveDestinations()`
- Pass `tourCount` from the enriched object to `DestinationCard`

### DestinationCard (`src/components/destination-card/index.tsx`)

- Accept computed `tourCount` (from enriched destination object)
- Link target changes to `/tours?destination={destination.id}`

### Tours Page (`src/pages/tours.tsx`)

- Read `router.query.destination` client-side
- If present and valid: filter tours via `getToursByDestination(Number(query.destination))`
- If absent or invalid: show all tours (current behavior)
- Static generation preserved (`getStaticProps` unchanged, filtering is client-side)

### Tour Cards & Tour Detail Hero

- Anywhere displaying `tour.location` now calls `getDestinationName(tour.destinationId)`

### Tour Detail Page (`src/pages/tours/[slug].tsx`)

- No structural change (still lookups tour by slug)
- Location display derived via `getDestinationName()`

---

## Edge Cases

| Scenario                              | Behavior                                              |
| ------------------------------------- | ----------------------------------------------------- |
| Destination with 0 tours              | Hidden from home page by `getActiveDestinations()`    |
| Invalid `?destination=` param         | Falls back to showing all tours                       |
| Tour with nonexistent `destinationId` | `getDestinationName()` returns `""`, logs dev warning |

---

## Not In Scope

- Destination detail pages (`/destinations/dalat`)
- Filter UI (tabs/pills) on the tours page
- Destination slugs
- i18n for destination names (stays English-only)
- Any UI/layout changes (home page grid stays identical)

---

## Files Affected

| File                                        | Change                                              |
| ------------------------------------------- | --------------------------------------------------- |
| `src/data/destinations.json`                | Remove `tours` field                                |
| `src/data/tours.json`                       | Replace `location` with `destinationId`             |
| `src/types/index.ts`                        | Update `Tour` and `Destination` interfaces          |
| `src/data/index.ts`                         | Add 4 helper functions                              |
| `src/pages/index.tsx`                       | Use `getActiveDestinations()`                       |
| `src/components/destination-card/index.tsx` | Use computed `tourCount`, update link               |
| `src/pages/tours.tsx`                       | Client-side filtering via query param               |
| `src/pages/tours/[slug].tsx`                | Derive location from helper                         |
| Tour card / hero components                 | Replace `tour.location` with `getDestinationName()` |
| `src/data/index.spec.ts`                    | Update tests for new schema                         |
