# VMT Domain Namespace — Design

**Date:** 2026-05-06
**Status:** Approved (pre-implementation)
**Scope:** Consolidate business entity types under a single `VMT` namespace, derive from Prisma, remove JSON data fallback.

## Motivation

`src/types/index.ts` has become a junk drawer mixing four concerns: business entities (`Tour`, `Destination`, `Highlight`), entity sub-shapes (`ItineraryDay`, `PricingGroup`), value primitives (`LocalizedText`, `TourStatus`), and component prop types (`LayoutProps`, `TourCardProps`, etc.). It also drifts from the database: `Tour.id` and `Destination.id` are typed as `number`, but Prisma defines them as `String` (uuid). The drift is patched at runtime by JSON-backed id-mapping tables in `src/data/queries.ts`, which is fragile and load-bearing.

Goals, in priority order:

1. **Single source of truth** for entity shapes — derive from Prisma so DB schema changes propagate automatically.
2. **Type-safety boundary** — separate the "core domain" namespace (`VMT`) from view-layer prop types and infra/admin response types.
3. **Junk-drawer separation** — remove the catch-all `src/types/index.ts`.
4. **Discoverability** — `import * as VMT from '@/domain'` gives every domain type a single dotted access.

## Non-Goals

- Runtime validation (Zod schemas) — future work; today the JSON column casts remain unsound.
- Reorganizing component prop types beyond inlining the 7 currently in `src/types/index.ts`.
- Production data migration tooling for the existing JSON fallback — DB is already the source of truth in production; cleanup of the fallback path is what this spec covers.

## Architecture

### Namespace mechanism

Module-as-namespace pattern: each entity owns a folder under `src/domain/`, and the package re-exports through `src/domain/index.ts`. Consumers do:

```ts
import * as VMT from '@/domain';

const tour: VMT.Tour = ...;
const status: VMT.TourStatus = ...;
const text: VMT.LocalizedText = ...;
```

No `namespace` keyword. No nested `VMT.Tour.Itinerary.Day` access — folder structure organizes source, the consumer-side namespace stays flat.

### Directory layout

```
src/domain/
  shared/
    localized-text.ts         # LocalizedText { en, vi }
  tour/
    index.ts                  # Tour, TourStatus (derived from Prisma)
    pricing.ts                # PricingGroup, PricingTier
    itinerary.ts              # ItineraryDay, ItineraryItem
    mapper.ts                 # Prisma row -> VMT.Tour
  destination/
    index.ts                  # Destination, DestinationWithStats
    mapper.ts                 # Prisma row -> VMT.Destination
  highlight/
    index.ts                  # Highlight (derived from Prisma)
    mapper.ts
  user/
    index.ts                  # User (was AdminUser)
    mapper.ts
  translation/
    index.ts                  # Translation (was TranslationRow)
    mapper.ts
  index.ts                    # re-exports * from each entity index.ts
```

`src/domain/index.ts` re-exports types only — mappers are imported directly via `@/domain/tour/mapper` so the `VMT` namespace stays type-pure.

### Prisma derivation pattern

Entity types use `Omit<PrismaX, 'serializedFields'> & { ...replacedFields }` to inherit scalar columns and override JSON / split-locale columns:

```ts
// src/domain/tour/index.ts
import type {
  Tour as PrismaTour,
  TourStatus as PrismaTourStatus,
} from '@prisma/client';
import type {LocalizedText} from '../shared/localized-text';
import type {ItineraryDay} from './itinerary';
import type {PricingGroup} from './pricing';
import type {Highlight} from '../highlight';

export type TourStatus = PrismaTourStatus;

export type Tour = Omit<
  PrismaTour,
  | 'titleVi'
  | 'titleEn'
  | 'descriptionVi'
  | 'descriptionEn'
  | 'images'
  | 'itinerary'
  | 'pricingGroups'
  | 'included'
  | 'excluded'
  | 'paymentDetails'
  | 'notes'
  | 'mealsInfo'
  | 'createdAt'
  | 'updatedAt'
> & {
  title: LocalizedText;
  description: LocalizedText;
  images: string[];
  itinerary: ItineraryDay[];
  pricingGroups: PricingGroup[];
  included: LocalizedText[];
  excluded: LocalizedText[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
  destinationName: string; // joined from Destination
  destinationHeroImage: string; // joined from Destination
  highlights: Highlight[]; // relation
};
```

`id` correctly inherits `string` from Prisma — the existing `id: number` typing is dropped.

`@prisma/client` types are erased at build (`import type` is type-only). They do not leak into the client bundle. This must be verified once during implementation.

### Mapper layer

Per-entity mapper functions live next to the type they produce. They take a Prisma row (with required `include` relations) and return a `VMT.X`. The casts on JSON columns (`row.itinerary as unknown as ItineraryDay[]`) are unsound but explicit; they trust the DB shape and are documented as such.

```ts
// src/domain/tour/mapper.ts
type PrismaTourFull = PrismaTour & {
  destination: PrismaDestination;
  highlights: PrismaHighlight[];
};

export function toTour(row: PrismaTourFull): Tour {
  return {
    id: row.id,
    slug: row.slug,
    destinationId: row.destinationId,
    title: {vi: row.titleVi, en: row.titleEn},
    description: {vi: row.descriptionVi, en: row.descriptionEn},
    images: row.images as string[],
    itinerary: row.itinerary as unknown as ItineraryDay[],
    pricingGroups: row.pricingGroups as unknown as PricingGroup[],
    included: row.included as unknown as LocalizedText[],
    excluded: row.excluded as unknown as LocalizedText[],
    paymentDetails: row.paymentDetails as unknown as LocalizedText,
    notes: row.notes as unknown as LocalizedText[],
    mealsInfo: row.mealsInfo as unknown as LocalizedText,
    destinationName: row.destination.name,
    destinationHeroImage: row.destination.heroImage,
    highlights: row.highlights.map(toHighlight),
    status: row.status,
    imageUrl: row.imageUrl,
    price: row.price,
    duration: row.duration,
    distance: row.distance,
    transportation: row.transportation,
    groupSize: row.groupSize,
    hotel: row.hotel,
    guided: row.guided,
  };
}
```

`src/data/queries.ts` is rewritten to call mappers. The current JSON-id mapping logic (`destNameToJsonId`, `tourSlugToJsonId`) is deleted entirely — DB UUIDs flow through unchanged.

## JSON Removal

The JSON fallback in `src/data/index.ts` and `src/data/{tours,destinations}.json` is removed. Two consumer chains break and are fixed as part of this spec:

- `TourCard.tsx` and `TourHero.tsx` currently call `getDestinationName(destinationId: number)`. They are switched to read `tour.destinationName` directly (added to the `Tour` type in mapping).
- `getActiveDestinations()` (sync, JSON-backed) consumers are switched to `getActiveDestinationsFromDb()`. If no consumers remain, the helper is deleted.

Files deleted:

- `src/data/tours.json`
- `src/data/destinations.json`
- `src/data/index.ts`
- `src/data/index.spec.ts`
- `src/types/index.ts` (after all imports migrate)

## Type Disposition

| Old (`src/types/index.ts`)                  | New location                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `Tour`                                      | `src/domain/tour/index.ts` → `VMT.Tour`                                  |
| `TourStatus`                                | `src/domain/tour/index.ts` → `VMT.TourStatus`                            |
| `Destination`                               | `src/domain/destination/index.ts` → `VMT.Destination`                    |
| `DestinationCardProps['destination']` shape | `VMT.DestinationWithStats` (in `src/domain/destination/index.ts`)        |
| `Highlight`                                 | `src/domain/highlight/index.ts` → `VMT.Highlight`                        |
| `ItineraryDay`, `ItineraryItem`             | `src/domain/tour/itinerary.ts` → `VMT.ItineraryDay`, `VMT.ItineraryItem` |
| `PricingGroup`, `PricingTier`               | `src/domain/tour/pricing.ts` → `VMT.PricingGroup`, `VMT.PricingTier`     |
| `LocalizedText`                             | `src/domain/shared/localized-text.ts` → `VMT.LocalizedText`              |
| `AdminUser`                                 | `src/domain/user/index.ts` → `VMT.User`                                  |
| `TranslationRow`                            | `src/domain/translation/index.ts` → `VMT.Translation`                    |
| `ContactInfo`                               | `src/utils/contact.ts` (out of VMT — static config shape)                |
| `AdminStats`                                | inline in admin stats consumer (out of VMT — API response)               |
| `LayoutProps`                               | inline `type Props` in `Layout.tsx`                                      |
| `TourCardProps`                             | inline in `TourCard.tsx`                                                 |
| `TourCarouselProps`                         | inline in `TourCarousel.tsx`                                             |
| `DestinationCardProps`                      | inline in `DestinationCard.tsx`                                          |
| `GalleryItemProps`                          | inline in `GalleryItem.tsx`                                              |
| `PageHeaderProps`                           | inline in `PageHeader.tsx`                                               |
| `VideoModalProps`                           | inline in `VideoModal.tsx`                                               |

## Migration Steps

1. Scaffold `src/domain/` directory tree with all entity, sub-shape, and shared type files. Each entity index file derives from Prisma.
2. Extract mappers from `src/data/queries.ts` into per-entity `src/domain/<entity>/mapper.ts`. Add `destinationName` to the `Tour` mapper output.
3. Rewrite `src/data/queries.ts` to call mappers. Delete the JSON-id mapping logic. Confirm the file no longer imports from `@/data`.
4. Update `TourCard.tsx` and `TourHero.tsx` to read `tour.destinationName` directly. Remove `getDestinationName` calls.
5. Find consumers of `getActiveDestinations` (sync) and switch to `getActiveDestinationsFromDb`. Delete `getActiveDestinations` once unused.
6. Replace every `import {...} from '@/types'` for entity types with `import * as VMT from '@/domain'`, rewriting usages to `VMT.X`.
7. Inline the 7 prop types into their respective component files (one inline `type Props = {...}` each).
8. Move `ContactInfo` to `src/utils/contact.ts` and update its imports. Move `AdminStats` to its admin consumer (inline or co-located).
9. Delete `src/data/tours.json`, `src/data/destinations.json`, `src/data/index.ts`, `src/data/index.spec.ts`, and `src/types/index.ts`.
10. Update `src/test-utils/factories.ts` to produce VMT-shape objects (string ids, `destinationName` field, etc.).
11. Run `pnpm build` (TS check), `pnpm test`, `pnpm lint` — must all pass clean.

## Risks and Edge Cases

- **`Json` cast unsoundness.** Mappers cast Prisma `Json` columns through `as unknown as VMT.X[]`. Bad data shape in the DB causes a runtime crash. Mitigation today: explicit, documented casts. Future upgrade path: Zod schemas at the mapper boundary.
- **`id: number` consumers.** Any code comparing `tour.id === 1` or passing the id into a number-typed slot breaks. A grep sweep is required during step 6.
- **Prisma type bundle leak.** `import type` from `@prisma/client` is erased at build time. Verify with a production bundle check during step 11 that no Prisma runtime code is pulled into client chunks.
- **Test factory drift.** Factories must be migrated in step 10 or all snapshot/integration tests will break.
- **`getActiveDestinations` callers.** Step 5 requires a thorough grep. Any client component still using the sync helper after step 9 is a build failure.
- **`destinationHeroImage` edge case.** Today, `dbTourToTour` sets `destinationHeroImage = ''` and the calling site overwrites it post-construction. The new mapper takes the destination relation directly and computes it inline — no two-step assignment.

## Acceptance Criteria

- `pnpm build` succeeds with no TS errors.
- `pnpm test` and `pnpm lint` pass.
- `src/types/index.ts`, `src/data/index.ts`, `src/data/index.spec.ts`, `src/data/tours.json`, `src/data/destinations.json` no longer exist.
- All entity-type imports go through `import * as VMT from '@/domain'`.
- `Tour.id` and `Destination.id` are `string` everywhere.
- No `from '@/data'` imports remain in the codebase.
- `getDestinationName`, `getDestinationById`, `getToursByDestination`, `getActiveDestinations` no longer exist.
