# VMT Domain Namespace — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all business entity types under a single `VMT` namespace under `src/domain/`, derive entity types from Prisma, and remove the JSON data fallback in `src/data/`.

**Architecture:** Module-as-namespace. Each entity owns a folder under `src/domain/` with an `index.ts` (types) and `mapper.ts` (Prisma row → VMT type). Consumers do `import * as VMT from '@/domain'`. A short-lived re-export shim in `src/types/index.ts` keeps the build green during incremental migration; the shim is deleted at the end.

**Tech Stack:** TypeScript strict mode, Next.js Pages Router, Prisma ORM, Jest + RTL, ESLint v9.

**Spec:** `docs/superpowers/specs/2026-05-06-vmt-domain-namespace-design.md`

**Verification commands (run frequently):**

- `pnpm build` — TS + Next build
- `pnpm test` — Jest unit tests (single run)
- `pnpm lint` — ESLint

---

## Phase 1 — Scaffold VMT Types

No consumers wired yet. Each task adds files; build stays green.

### Task 1: Add `LocalizedText` shared primitive

**Files:**

- Create: `src/domain/shared/localized-text.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/shared/localized-text.ts
export type LocalizedText = {
  en: string;
  vi: string;
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds (file is unused, just exists).

- [ ] **Step 3: Commit**

```bash
git add src/domain/shared/localized-text.ts
git commit -m "feat(domain): add LocalizedText primitive under src/domain/shared"
```

---

### Task 2: Add `Highlight` entity (Prisma-derived)

**Files:**

- Create: `src/domain/highlight/index.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/highlight/index.ts
import type {Highlight as PrismaHighlight} from '@prisma/client';

export type Highlight = Omit<PrismaHighlight, 'createdAt'>;
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/highlight/index.ts
git commit -m "feat(domain): add Highlight entity derived from Prisma"
```

---

### Task 3: Add `ItineraryDay` and `PricingGroup` sub-shapes

**Files:**

- Create: `src/domain/tour/itinerary.ts`
- Create: `src/domain/tour/pricing.ts`

- [ ] **Step 1: Create itinerary types**

```ts
// src/domain/tour/itinerary.ts
import type {LocalizedText} from '../shared/localized-text';

export type ItineraryItem = {
  time: string;
  description: LocalizedText;
};

export type ItineraryDay = {
  dayLabel: LocalizedText;
  items: ItineraryItem[];
};
```

- [ ] **Step 2: Create pricing types**

```ts
// src/domain/tour/pricing.ts
import type {LocalizedText} from '../shared/localized-text';

export type PricingTier = {
  label: LocalizedText;
  description?: LocalizedText;
  price: number;
  minGroupSize?: number;
  maxGroupSize?: number;
};

export type PricingGroup = {
  type: 'group-size' | 'vehicle';
  label: LocalizedText;
  icon?: string;
  tiers: PricingTier[];
};
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/domain/tour/itinerary.ts src/domain/tour/pricing.ts
git commit -m "feat(domain): add Tour itinerary and pricing sub-shapes"
```

---

### Task 4: Add `Tour` entity (Prisma-derived)

**Files:**

- Create: `src/domain/tour/index.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/tour/index.ts
import type {
  Tour as PrismaTour,
  TourStatus as PrismaTourStatus,
} from '@prisma/client';
import type {LocalizedText} from '../shared/localized-text';
import type {Highlight} from '../highlight';
import type {ItineraryDay} from './itinerary';
import type {PricingGroup} from './pricing';

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
  destinationName: string;
  destinationHeroImage: string;
  highlights: Highlight[];
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/tour/index.ts
git commit -m "feat(domain): add Tour entity derived from Prisma"
```

---

### Task 5: Add `Destination` entity + `DestinationWithStats`

**Files:**

- Create: `src/domain/destination/index.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/destination/index.ts
import type {Destination as PrismaDestination} from '@prisma/client';

export type Destination = Omit<
  PrismaDestination,
  | 'nameVi'
  | 'nameEn'
  | 'descriptionVi'
  | 'descriptionEn'
  | 'createdAt'
  | 'updatedAt'
> & {
  size: 'small' | 'large';
};

export type DestinationWithStats = Destination & {
  tourCount: number;
  hasCar: boolean;
  hasBike: boolean;
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/destination/index.ts
git commit -m "feat(domain): add Destination entity + DestinationWithStats"
```

---

### Task 6: Add `User` entity (renamed from `AdminUser`)

**Files:**

- Create: `src/domain/user/index.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/user/index.ts
import type {User as PrismaUser, Role as PrismaRole} from '@prisma/client';

export type Role = PrismaRole;

export type User = Omit<PrismaUser, 'passwordHash' | 'updatedAt'> & {
  createdAt: string;
};
```

(`createdAt` is narrowed to `string` because the existing `AdminUser` type used `string`. Mapper will format the Prisma `Date` into ISO string.)

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/user/index.ts
git commit -m "feat(domain): add User entity derived from Prisma"
```

---

### Task 7: Add `Translation` entity (renamed from `TranslationRow`)

**Files:**

- Create: `src/domain/translation/index.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/translation/index.ts
import type {Translation as PrismaTranslation} from '@prisma/client';

export type Translation = Omit<PrismaTranslation, 'updatedAt'>;
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/translation/index.ts
git commit -m "feat(domain): add Translation entity derived from Prisma"
```

---

### Task 8: Aggregate `src/domain/index.ts`

**Files:**

- Create: `src/domain/index.ts`

- [ ] **Step 1: Create the aggregate file**

```ts
// src/domain/index.ts
export type {LocalizedText} from './shared/localized-text';
export type {Tour, TourStatus} from './tour';
export type {ItineraryDay, ItineraryItem} from './tour/itinerary';
export type {PricingGroup, PricingTier} from './tour/pricing';
export type {Destination, DestinationWithStats} from './destination';
export type {Highlight} from './highlight';
export type {User, Role} from './user';
export type {Translation} from './translation';
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Smoke test the namespace**

Add a temporary file `src/domain/__smoke__.ts`:

```ts
import * as VMT from '@/domain';
const _t: VMT.Tour | null = null;
const _d: VMT.Destination | null = null;
const _h: VMT.Highlight | null = null;
const _u: VMT.User | null = null;
const _tr: VMT.Translation | null = null;
const _ld: VMT.LocalizedText | null = null;
const _it: VMT.ItineraryDay | null = null;
const _pg: VMT.PricingGroup | null = null;
const _ds: VMT.DestinationWithStats | null = null;
export {_t, _d, _h, _u, _tr, _ld, _it, _pg, _ds};
```

Run: `pnpm build`
Expected: succeeds.

Then delete the smoke file:

```bash
rm src/domain/__smoke__.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/domain/index.ts
git commit -m "feat(domain): aggregate VMT namespace re-exports"
```

---

## Phase 2 — Mappers

### Task 9: Add `Highlight` mapper

**Files:**

- Create: `src/domain/highlight/mapper.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/highlight/mapper.ts
import type {Highlight as PrismaHighlight} from '@prisma/client';
import type {Highlight} from './index';

export function toHighlight(row: PrismaHighlight): Highlight {
  return {
    id: row.id,
    destinationId: row.destinationId,
    textEn: row.textEn,
    textVi: row.textVi,
    imageUrl: row.imageUrl,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/highlight/mapper.ts
git commit -m "feat(domain): add Highlight Prisma->VMT mapper"
```

---

### Task 10: Add `Destination` mapper

**Files:**

- Create: `src/domain/destination/mapper.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/destination/mapper.ts
import type {Destination as PrismaDestination} from '@prisma/client';
import type {Destination} from './index';

export function toDestination(row: PrismaDestination): Destination {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.imageUrl,
    heroImage: row.heroImage,
    size: row.size === 'large' ? 'large' : 'small',
    isActive: row.isActive,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/destination/mapper.ts
git commit -m "feat(domain): add Destination Prisma->VMT mapper"
```

---

### Task 11: Add `Tour` mapper

**Files:**

- Create: `src/domain/tour/mapper.ts`

- [ ] **Step 1: Create the file**

```ts
// src/domain/tour/mapper.ts
import type {
  Tour as PrismaTour,
  Destination as PrismaDestination,
  Highlight as PrismaHighlight,
} from '@prisma/client';
import {toHighlight} from '../highlight/mapper';
import type {LocalizedText} from '../shared/localized-text';
import type {ItineraryDay} from './itinerary';
import type {PricingGroup} from './pricing';
import type {Tour} from './index';

export type PrismaTourWithRelations = PrismaTour & {
  destination: PrismaDestination;
  highlights: PrismaHighlight[];
};

export function toTour(row: PrismaTourWithRelations): Tour {
  return {
    id: row.id,
    slug: row.slug,
    destinationId: row.destinationId,
    title: {vi: row.titleVi, en: row.titleEn},
    description: {vi: row.descriptionVi, en: row.descriptionEn},
    images: row.images as unknown as string[],
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

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/domain/tour/mapper.ts
git commit -m "feat(domain): add Tour Prisma->VMT mapper"
```

---

### Task 12: Add `User` and `Translation` mappers

**Files:**

- Create: `src/domain/user/mapper.ts`
- Create: `src/domain/translation/mapper.ts`

- [ ] **Step 1: User mapper**

```ts
// src/domain/user/mapper.ts
import type {User as PrismaUser} from '@prisma/client';
import type {User} from './index';

export function toUser(row: PrismaUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}
```

- [ ] **Step 2: Translation mapper**

```ts
// src/domain/translation/mapper.ts
import type {Translation as PrismaTranslation} from '@prisma/client';
import type {Translation} from './index';

export function toTranslation(row: PrismaTranslation): Translation {
  return {
    id: row.id,
    namespace: row.namespace,
    key: row.key,
    valueVi: row.valueVi,
    valueEn: row.valueEn,
  };
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/domain/user/mapper.ts src/domain/translation/mapper.ts
git commit -m "feat(domain): add User and Translation Prisma->VMT mappers"
```

---

## Phase 3 — Compatibility Shim + Wire Mappers

### Task 13: Make `src/types/index.ts` a re-export shim

**Files:**

- Modify: `src/types/index.ts` — replace the local entity definitions with re-exports from `@/domain`. Keep `ContactInfo`, `AdminStats`, and component prop types unchanged for now.

- [ ] **Step 1: Replace the file content**

```ts
// src/types/index.ts
import type {ReactNode} from 'react';
import type {Tour as VmtTour, DestinationWithStats} from '@/domain';

// Re-exports from VMT (transitional shim — to be removed once all consumers
// migrate to `import * as VMT from '@/domain'`).
export type {
  LocalizedText,
  Tour,
  TourStatus,
  ItineraryDay,
  ItineraryItem,
  PricingGroup,
  PricingTier,
  Destination,
  Highlight,
} from '@/domain';
export type {User as AdminUser} from '@/domain';
export type {Translation as TranslationRow} from '@/domain';

// Non-domain types kept here for now.
export type ContactInfo = {
  phone: string;
  email: string;
  youtubeLink: string;
  tripadvisorLink: string;
  whatsApp: string;
  address: string;
  city: string;
};

export type LayoutProps = {
  children: ReactNode;
};

export type TourCardProps = {
  tour: VmtTour;
};

export type TourCarouselProps = {
  tours: VmtTour[];
};

export type DestinationCardProps = {
  destination: DestinationWithStats;
};

export type GalleryItemProps = {
  imageSrc: string;
  alt: string;
  delay: number;
};

export type PageHeaderProps = {
  title: string;
  breadcrumbs: {label: string; href?: string}[];
  backgroundImage: string;
};

export type VideoModalProps = {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
};

export type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};
```

- [ ] **Step 2: Verify build (errors expected here)**

Run: `pnpm build`
Expected: TS errors at consumer sites that compare `id` or `destinationId` against numeric literals (`tour.destinationId === 1`), or assign string ids into number-typed slots. List the errors — they will be fixed in Task 16.

If only the unused `VmtDestination` triggers a lint error, remove it from the import.

- [ ] **Step 3: Do NOT commit yet — proceed to Task 14**

---

### Task 14: Rewrite `src/data/queries.ts` to use VMT mappers

**Files:**

- Modify: `src/data/queries.ts` — replace the entire file. Drop JSON-id mapping. Call mappers. Use VMT types.

- [ ] **Step 1: Replace the file**

```ts
// src/data/queries.ts
/**
 * Server-only Prisma queries for data fetching in getStaticProps / getServerSideProps.
 *
 * IMPORTANT: Do NOT import this file from client-side components.
 * It pulls in the Prisma client which depends on Node.js-only modules (pg, tls).
 */
import {prisma} from '@/lib/prisma';
import type {Tour, DestinationWithStats} from '@/domain';
import {toTour} from '@/domain/tour/mapper';
import {toDestination} from '@/domain/destination/mapper';

export async function getAllTours(isAdmin = false): Promise<Tour[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: isAdmin ? {} : {status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true, highlights: true},
    });
    return rows.map(toTour);
  } catch (error) {
    console.error('getAllTours: DB query failed', error);
    return [];
  }
}

export async function getTourBySlug(
  slug: string,
  isAdmin = false,
): Promise<Tour | undefined> {
  try {
    const row = await prisma.tour.findFirst({
      where: isAdmin ? {slug} : {slug, status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true, highlights: true},
    });
    return row ? toTour(row) : undefined;
  } catch (error) {
    console.error('getTourBySlug: DB query failed', error);
    return undefined;
  }
}

export async function getAllTourSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: {status: {in: ['PUBLISHED', 'FEATURED']}},
      select: {slug: true},
    });
    return rows.map((r) => r.slug);
  } catch (error) {
    console.error('getAllTourSlugs: DB query failed', error);
    return [];
  }
}

export async function getActiveDestinationsFromDb(
  isAdmin = false,
): Promise<DestinationWithStats[]> {
  try {
    const tourFilter = isAdmin
      ? {}
      : {status: {in: ['PUBLISHED' as const, 'FEATURED' as const]}};
    const destinations = await prisma.destination.findMany({
      where: {isActive: true},
      include: {
        tours: {
          where: tourFilter,
          select: {transportation: true},
        },
      },
    });
    return destinations
      .filter((d) => d.tours.length > 0)
      .map((d) => ({
        ...toDestination(d),
        tourCount: d.tours.length,
        hasCar: d.tours.some((t) => /car/i.test(t.transportation)),
        hasBike: d.tours.some((t) => /motorbike/i.test(t.transportation)),
      }));
  } catch (error) {
    console.error('getActiveDestinationsFromDb: DB query failed', error);
    return [];
  }
}

export async function getMessagesFromDb(
  locale: string,
): Promise<Record<string, unknown> | null> {
  try {
    const rows = await prisma.translation.findMany();
    if (rows.length === 0) {
      console.warn('getMessagesFromDb: Translation table is empty');
      return {};
    }

    const valueKey = locale === 'en' ? 'valueEn' : 'valueVi';
    const messages: Record<string, unknown> = {};

    for (const row of rows) {
      if (!messages[row.namespace]) {
        messages[row.namespace] = {};
      }

      const parts = row.key.split('.');
      let current = messages[row.namespace] as Record<string, unknown>;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }

      current[parts[parts.length - 1]] =
        (row as Record<string, unknown>)[valueKey] ?? '';
    }

    return messages;
  } catch (error) {
    console.error('getMessagesFromDb: DB query failed', error);
    return {};
  }
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Most TS errors from Task 13 should remain at consumer sites (id/destinationId comparisons, unused imports). The `queries.ts` file itself should compile clean. Some errors may surface in `src/data/index.ts` because it now references the new VMT shapes via `@/types` — that file will be deleted in Task 22; ignore for now or comment out the broken sync helpers temporarily.

If `src/data/index.ts` blocks the build, replace its contents with:

```ts
// src/data/index.ts
// Deprecated — to be deleted in a later task. Sync JSON helpers are dropped.
export {};
```

- [ ] **Step 3: Do NOT commit yet — proceed to Task 15**

---

### Task 15: Switch `TourCard` and `TourHero` to use `tour.destinationName`

**Files:**

- Modify: `src/components/TourCard/TourCard.tsx` — drop `getDestinationName`, use `tour.destinationName`.
- Modify: `src/components/TourHero/TourHero.tsx` — drop `getDestinationName`, use `tour.destinationName`.

- [ ] **Step 1: Update TourCard.tsx**

In `src/components/TourCard/TourCard.tsx`:

- Remove the line `import {getDestinationName} from '@/data';`.
- Replace `{getDestinationName(destinationId)}` (around line 88) with `{tour.destinationName}`.

If `destinationId` was a destructured prop derived from `tour`, also remove that destructure and reference `tour.destinationName` directly.

- [ ] **Step 2: Update TourHero.tsx**

In `src/components/TourHero/TourHero.tsx`:

- Remove the line `import {getDestinationName} from '@/data';`.
- Replace `{getDestinationName(tour.destinationId)}` (around line 66) with `{tour.destinationName}`.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: TourCard / TourHero compile clean. Other TS errors from Task 13/14 may persist; those are addressed in Task 16.

- [ ] **Step 4: Do NOT commit yet — proceed to Task 16**

---

### Task 16: Fix remaining TS errors from id type change

**Files:**

- Modify: any file flagged by `pnpm build` since Task 13. Most likely:
  - `src/pages/tours.tsx` — comparison `t.destinationId === destinationId`. Confirm both sides are `string`. The `destinationId` query param should be parsed as string.
  - `src/components/Admin/tabs/HighlightsTab/HighlightsTab.tsx` — `destinations.find((d) => d.id === destinationId)`. Confirm both sides are `string`.
  - `src/data/index.ts` — if not already neutered in Task 14, replace its body with `export {};`.

- [ ] **Step 1: Run build and read errors**

Run: `pnpm build`
Read each TS error. For each:

- If it's a `string` vs `number` mismatch on `id` or `destinationId`, drop any `parseInt`/`Number()` calls or numeric literal comparisons. Use the string directly.
- If a route param was `Number(query.id)`, change it to `String(query.id)` or just `query.id as string`.

- [ ] **Step 2: Specific fix for `src/pages/tours.tsx`**

Around line 34, the filter `(t) => t.destinationId === destinationId` should already work if `destinationId` is read from query as a string. Find where `destinationId` is computed (probably `Number(router.query.destination)` or similar). Change to:

```ts
const destinationId =
  typeof router.query.destination === 'string' ? router.query.destination : '';
```

(Read the actual current code in `src/pages/tours.tsx` first; adapt the fix to match.)

- [ ] **Step 3: Re-run build until clean**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: tests may fail because factories produce numeric ids. That is fixed in Task 21. For now, only verify that build is green.

- [ ] **Step 5: Commit Tasks 13–16 together**

```bash
git add src/types/index.ts src/data/queries.ts src/data/index.ts \
  src/components/TourCard/TourCard.tsx \
  src/components/TourHero/TourHero.tsx \
  src/pages/tours.tsx \
  src/components/Admin/tabs/HighlightsTab/HighlightsTab.tsx
git commit -m "refactor: derive Tour/Destination ids from Prisma (string)

Switch src/types/index.ts to re-export VMT entity types. Rewrite
queries.ts to call VMT mappers and drop JSON-id mapping. Update
TourCard and TourHero to use tour.destinationName directly. Fix
id-comparison sites surfaced by the type flip."
```

(Adjust the `git add` list to match actual files modified.)

---

## Phase 4 — Migrate Imports to `import * as VMT`

For each task below, migrate every `import {…} from '@/types'` line in the named files to `import * as VMT from '@/domain'`, then prefix usages with `VMT.`. Apply the rename map below.

**Rename map:**

- `Tour` → `VMT.Tour`
- `TourStatus` → `VMT.TourStatus`
- `Destination` → `VMT.Destination`
- `Highlight` → `VMT.Highlight`
- `LocalizedText` → `VMT.LocalizedText`
- `ItineraryDay` → `VMT.ItineraryDay`
- `ItineraryItem` → `VMT.ItineraryItem`
- `PricingGroup` → `VMT.PricingGroup`
- `PricingTier` → `VMT.PricingTier`
- `AdminUser` → `VMT.User`
- `TranslationRow` → `VMT.Translation`

**Do NOT migrate** in this phase: `ContactInfo`, `AdminStats`, prop types (`LayoutProps`, `TourCardProps`, etc.). They remain in `@/types` until Phase 5.

If a file imports a mix of domain types and prop types, keep the `from '@/types'` import for the prop types and add a separate `import * as VMT from '@/domain'` for the domain types.

### Task 17: Migrate `src/components/Admin/**` imports

**Files:**

- Modify: `src/components/Admin/StatusPicker/StatusPicker.tsx`
- Modify: `src/components/Admin/TourEditTabs/TourEditTabs.tsx`
- Modify: `src/components/Admin/TranslationEditor/TranslationEditor.tsx`
- Modify: `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts`
- Modify: `src/components/Admin/tabs/HighlightsTab/HighlightsTab.tsx`
- Modify: `src/components/Admin/tabs/ItineraryTab/ItineraryTab.tsx`
- Modify: `src/components/Admin/tabs/PricingTab/PricingTab.tsx`

- [ ] **Step 1: Apply migration per file**

For each file, replace `import type {...} from '@/types'` with `import * as VMT from '@/domain'` and prefix usages per the rename map. Type-only usage is preserved (prefer `import type * as VMT from '@/domain'` to keep it `type`-only).

Example (`StatusPicker.tsx`):

```ts
// Before
import type {TourStatus} from '@/types';
// ...
status: TourStatus;

// After
import type * as VMT from '@/domain';
// ...
status: VMT.TourStatus;
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Verify lint**

Run: `pnpm lint`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin
git commit -m "refactor(admin): migrate type imports to VMT namespace"
```

---

### Task 18: Migrate `src/components/tour-detail/**` and remaining components

**Files:**

- Modify: `src/components/DestinationCard/DestinationCard.tsx`
- Modify: `src/components/Layout/Layout.tsx`
- Modify: `src/components/PageHeader/PageHeader.tsx`
- Modify: `src/components/TourCard/TourCard.tsx`
- Modify: `src/components/TourHero/TourHero.tsx`
- Modify: `src/components/TourItinerary/TourItinerary.tsx`
- Modify: `src/components/TourPricing/TourPricing.tsx`
- Modify: `src/components/TourPricing/group-size-pricing.tsx`
- Modify: `src/components/TourPricing/vehicle-pricing.tsx`
- Modify: `src/components/VideoModal/VideoModal.tsx`
- Modify: `src/components/home/GalleryItem/GalleryItem.tsx`
- Modify: `src/components/home/TourCarousel/TourCarousel.tsx`
- Modify: `src/components/tour-detail/AdminStatusBadge/AdminStatusBadge.tsx`
- Modify: `src/components/tour-detail/TourDescription/TourDescription.tsx`
- Modify: `src/components/tour-detail/TourDetails/TourDetails.tsx`
- Modify: `src/components/tour-detail/TourHighlights/TourHighlights.tsx`
- Modify: `src/components/tour-detail/TourIncluded/TourIncluded.tsx`
- Modify: `src/components/tour-detail/TourNotes/TourNotes.tsx`
- Modify: `src/components/tour-detail/TourPayment/TourPayment.tsx`

- [ ] **Step 1: Apply migration per file**

Same pattern as Task 17. For files that use only prop types (e.g., `Layout.tsx` imports `LayoutProps`), leave them alone — prop types stay in `@/types` until Phase 5.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Verify lint**

Run: `pnpm lint`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components
git commit -m "refactor(components): migrate type imports to VMT namespace"
```

---

### Task 19: Migrate `src/pages/**` imports

**Files:**

- Modify: `src/pages/admin/index.tsx`
- Modify: `src/pages/admin/tours/[id]/edit.tsx`
- Modify: `src/pages/admin/tours/index.tsx`
- Modify: `src/pages/admin/tours/new.tsx`
- Modify: `src/pages/admin/translations.tsx`
- Modify: `src/pages/admin/users.tsx`
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/tours.tsx`
- Modify: `src/pages/tours/[slug].tsx`

- [ ] **Step 1: Apply migration per file**

Same pattern. For files using `AdminUser` or `TranslationRow`, rename to `VMT.User` / `VMT.Translation`. For files using `AdminStats`, leave alone (Phase 5).

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Verify lint**

Run: `pnpm lint`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages
git commit -m "refactor(pages): migrate type imports to VMT namespace"
```

---

### Task 20: Migrate remaining files (`routes`, `data/queries`, `utils`, `factories`)

**Files:**

- Modify: `src/routes/index.ts`
- Modify: `src/data/queries.ts` (already partially done in Task 14; ensure it uses `VMT.` style if it imports from `@/types`)
- Modify: `src/utils/index.ts` (uses `ContactInfo` — leave that import; only migrate domain types if any)
- Modify: `src/test-utils/factories.ts`

- [ ] **Step 1: Migrate `routes/index.ts`**

If it imports any domain type (likely none beyond what was already done), apply the rename map. Otherwise skip.

- [ ] **Step 2: Migrate `factories.ts`**

```ts
// src/test-utils/factories.ts
import type * as VMT from '@/domain';
import type {ContactInfo} from '@/types';
// ... etc
```

Then rename `Tour` → `VMT.Tour`, `Destination` → `VMT.Destination` in type annotations.

(The factory bodies will be rewritten in Task 21 to fix the actual data shapes.)

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Verify lint**

Run: `pnpm lint`
Expected: succeeds.

- [ ] **Step 5: Confirm no remaining `@/types` imports for domain types**

Run:

```bash
grep -rn "from '@/types'" src --include='*.ts' --include='*.tsx' | \
  grep -E 'Tour|Destination|Highlight|LocalizedText|Itinerary|Pricing|AdminUser|TranslationRow' | \
  grep -v '// '
```

Expected: no output (or only matches inside `src/types/index.ts` itself, which is the shim).

- [ ] **Step 6: Commit**

```bash
git add src/routes src/test-utils src/utils src/data
git commit -m "refactor: migrate remaining type imports to VMT namespace"
```

---

## Phase 5 — Cleanup

### Task 21: Update factories to produce VMT-shape data

**Files:**

- Modify: `src/test-utils/factories.ts`

- [ ] **Step 1: Replace factory bodies**

```ts
// src/test-utils/factories.ts
import type * as VMT from '@/domain';
import type {ContactInfo} from '@/utils/contact';

export function buildTour(overrides?: Partial<VMT.Tour>): VMT.Tour {
  return {
    id: 'test-tour-id',
    slug: 'test-tour',
    destinationId: 'test-destination-id',
    title: {en: 'Test Tour', vi: 'Test Tour'},
    description: {en: 'Test tour description', vi: 'Test tour description'},
    images: [],
    itinerary: [
      {
        dayLabel: {en: 'Itinerary', vi: 'Lịch trình'},
        items: [
          {time: '8:00 AM', description: {en: 'Start tour', vi: 'Start tour'}},
        ],
      },
    ],
    pricingGroups: [
      {
        type: 'vehicle' as const,
        label: {en: 'By Motorbike', vi: 'Xe Máy'},
        icon: 'motorcycle',
        tiers: [
          {
            label: {en: 'Ride as passenger', vi: 'Ngồi sau'},
            description: {
              en: 'Sit back and enjoy the ride',
              vi: 'Ngồi sau và tận hưởng',
            },
            price: 65,
          },
        ],
      },
    ],
    included: [{en: 'Guide', vi: 'Hướng dẫn viên'}],
    excluded: [{en: 'Flights', vi: 'Vé máy bay'}],
    paymentDetails: {en: '20% deposit required', vi: 'Đặt cọc 20%'},
    notes: [{en: 'Check availability', vi: 'Kiểm tra chỗ trống'}],
    mealsInfo: {en: '1 meal included', vi: '1 meal included'},
    destinationName: 'Test Destination',
    destinationHeroImage: '',
    highlights: [],
    status: 'PUBLISHED',
    imageUrl: '/test-tour.jpg',
    price: 80,
    duration: 1,
    distance: 100,
    transportation: 'Motorbike',
    groupSize: 1,
    hotel: 'Pick up & Drop off',
    guided: 'Fully Guided Tour',
    ...overrides,
  };
}

export function buildDestination(
  overrides?: Partial<VMT.Destination>,
): VMT.Destination {
  return {
    id: 'test-destination-id',
    slug: 'test-destination',
    name: 'Test Destination',
    imageUrl: '/test-destination.jpg',
    heroImage: '',
    size: 'small',
    isActive: true,
    ...overrides,
  };
}

export function buildContactInfo(
  overrides?: Partial<ContactInfo>,
): ContactInfo {
  return {
    phone: '+84-000-000-000',
    email: 'test@example.com',
    youtubeLink: 'https://youtube.com/test',
    tripadvisorLink: 'https://tripadvisor.com/test',
    whatsApp: '+84-000-000-000',
    address: '123 Test St.',
    city: 'Test City',
    ...overrides,
  };
}
```

(Note: this imports `ContactInfo` from `@/utils/contact`, which doesn't exist yet — created in Task 23. If running Task 21 before Task 23, temporarily import from `@/types` and switch later.)

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Verify tests**

Run: `pnpm test`
Expected: tests pass. Some snapshot tests may need updates if they pinned numeric ids in serialized output.

- [ ] **Step 4: Commit**

```bash
git add src/test-utils/factories.ts
git commit -m "refactor(test-utils): update factories to VMT shape (string ids, destinationName)"
```

---

### Task 22: Inline prop types into component files

**Files:**

- Modify: `src/components/Layout/Layout.tsx` — inline `type Props = { children: ReactNode }`, drop `LayoutProps` import.
- Modify: `src/components/TourCard/TourCard.tsx` — inline `type Props = { tour: VMT.Tour }`, drop `TourCardProps` import.
- Modify: `src/components/home/TourCarousel/TourCarousel.tsx` — inline `type Props = { tours: VMT.Tour[] }`, drop `TourCarouselProps` import.
- Modify: `src/components/DestinationCard/DestinationCard.tsx` — inline `type Props = { destination: VMT.DestinationWithStats }`, drop `DestinationCardProps` import.
- Modify: `src/components/home/GalleryItem/GalleryItem.tsx` — inline `type Props`, drop `GalleryItemProps` import.
- Modify: `src/components/PageHeader/PageHeader.tsx` — inline `type Props`, drop `PageHeaderProps` import.
- Modify: `src/components/VideoModal/VideoModal.tsx` — inline `type Props`, drop `VideoModalProps` import.

- [ ] **Step 1: Inline `Props` per component**

Pattern for each:

1. Read the current import (e.g., `import type {TourCardProps} from '@/types';`).
2. Replace with the inline type next to the component declaration:

```tsx
type Props = {
  tour: VMT.Tour;
};

export function TourCard({tour}: Props) {
  /* ... */
}
```

3. Remove the now-unused `TourCardProps` import.
4. If the file already does `import * as VMT from '@/domain'` (from Phase 4), keep that.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Verify tests**

Run: `pnpm test`
Expected: succeeds.

- [ ] **Step 4: Verify lint**

Run: `pnpm lint`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "refactor(components): inline component prop types"
```

---

### Task 23: Move `ContactInfo` and `AdminStats` out of `@/types`

**Files:**

- Create: `src/utils/contact.ts`
- Modify: `src/utils/index.ts` — import `ContactInfo` from `./contact` instead of `@/types`.
- Modify: `src/test-utils/factories.ts` — import `ContactInfo` from `@/utils/contact`.
- Modify: `src/pages/admin/index.tsx` — inline the `AdminStats` type or co-locate it. Either approach is fine; pick inline (single consumer).

- [ ] **Step 1: Create `src/utils/contact.ts`**

```ts
// src/utils/contact.ts
export type ContactInfo = {
  phone: string;
  email: string;
  youtubeLink: string;
  tripadvisorLink: string;
  whatsApp: string;
  address: string;
  city: string;
};
```

- [ ] **Step 2: Update `src/utils/index.ts`**

Change the line `import type {ContactInfo} from '@/types';` to `import type {ContactInfo} from './contact';`.
If `ContactInfo` is exported from `src/utils/index.ts`, also add `export type {ContactInfo} from './contact';`.

- [ ] **Step 3: Update `src/test-utils/factories.ts`**

Change the line `import type {ContactInfo} from '@/types';` (or `@/utils/contact` if already pointed there) to `import type {ContactInfo} from '@/utils/contact';`.

- [ ] **Step 4: Inline `AdminStats` in `src/pages/admin/index.tsx`**

Replace `import type {AdminStats} from '@/types';` with an inline declaration near the top of the file:

```ts
type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};
```

- [ ] **Step 5: Verify build / test / lint**

Run:

```bash
pnpm build && pnpm test && pnpm lint
```

Expected: all succeed.

- [ ] **Step 6: Commit**

```bash
git add src/utils/contact.ts src/utils/index.ts \
  src/test-utils/factories.ts src/pages/admin/index.tsx
git commit -m "refactor: move ContactInfo to src/utils/contact, inline AdminStats"
```

---

### Task 24: Delete JSON data files and `src/data/index.ts`

**Files:**

- Delete: `src/data/tours.json`
- Delete: `src/data/destinations.json`
- Delete: `src/data/index.ts`
- Delete: `src/data/index.spec.ts`

- [ ] **Step 1: Confirm no consumers remain**

Run:

```bash
grep -rn "from '@/data'" src --include='*.ts' --include='*.tsx'
grep -rn "tours.json\|destinations.json" src --include='*.ts' --include='*.tsx'
```

Expected: no matches outside `src/data/queries.ts` (which only imports from itself, not `@/data`).

If matches remain in production code, fix them now (see Task 15 / Task 16 patterns) before deleting.

- [ ] **Step 2: Delete files**

```bash
rm src/data/tours.json src/data/destinations.json \
   src/data/index.ts src/data/index.spec.ts
```

- [ ] **Step 3: Verify build / test / lint**

Run:

```bash
pnpm build && pnpm test && pnpm lint
```

Expected: all succeed.

- [ ] **Step 4: Commit**

```bash
git add -A src/data
git commit -m "chore(data): remove JSON fallback files and sync helpers

DB is now sole source of truth. JSON-id mapping was already replaced
by VMT mappers in src/domain/."
```

---

### Task 25: Delete `src/types/index.ts` shim

**Files:**

- Delete: `src/types/index.ts`

- [ ] **Step 1: Confirm no consumers remain**

Run:

```bash
grep -rn "from '@/types'" src --include='*.ts' --include='*.tsx'
```

Expected: no output.

If matches remain, migrate them per the Phase 4 / Phase 5 patterns before deleting.

- [ ] **Step 2: Delete the file**

```bash
rm src/types/index.ts
rmdir src/types 2>/dev/null || true
```

- [ ] **Step 3: Final verification — build, tests, lint, bundle leak check**

Run:

```bash
pnpm build && pnpm test && pnpm lint
```

Expected: all succeed.

Verify Prisma types do not leak into the client bundle. After `pnpm build`, scan client chunks for Prisma runtime symbols:

```bash
grep -r "PrismaClient\|@prisma/client" .next/static 2>/dev/null | head
```

Expected: no output. `import type` from `@prisma/client` is type-only and erased at build; if any runtime Prisma symbol appears in a client chunk, a non-type import slipped in — find it and switch to `import type`.

- [ ] **Step 4: Final commit**

```bash
git add -A src/types
git commit -m "chore(types): remove src/types shim — VMT migration complete"
```

---

## Acceptance

After Task 25:

- `pnpm build` ✓
- `pnpm test` ✓
- `pnpm lint` ✓
- `src/domain/` exists with the layout from the spec.
- `src/types/index.ts` does not exist.
- `src/data/{tours,destinations}.json`, `src/data/index.ts`, `src/data/index.spec.ts` do not exist.
- All entity-type consumers use `import * as VMT from '@/domain'` (or `import type * as VMT`).
- `Tour.id` and `Destination.id` are `string` everywhere.
- No `from '@/data'` imports remain.
- `getDestinationName`, `getDestinationById`, `getToursByDestination`, `getActiveDestinations` (sync) no longer exist.
