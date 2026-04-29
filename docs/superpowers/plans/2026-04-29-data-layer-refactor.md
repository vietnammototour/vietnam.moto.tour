# Data Layer Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace loose location-string coupling between tours and destinations with referential integrity via numeric destination IDs, compute tour counts at runtime, and add client-side destination filtering on the tours page.

**Architecture:** Tours reference destinations by `destinationId` (numeric FK). Helper functions in `src/data/index.ts` derive active destinations, tour counts, and destination names. The home page uses `getActiveDestinations()` to show only destinations with linked tours. The tours page reads `?destination=` query param for client-side filtering.

**Tech Stack:** Next.js 16 (Pages Router), TypeScript strict mode, React 19, next-intl, Framer Motion

---

### Task 1: Update TypeScript Types

**Files:**

- Modify: `src/types/index.ts:33-66`

- [ ] **Step 1: Update the Tour interface**

Replace `location: string` with `destinationId: number` in the Tour interface:

```typescript
// In src/types/index.ts, change line 41:
// FROM:
location: string;
// TO:
destinationId: number;
```

- [ ] **Step 2: Update the Destination interface**

Remove the `tours` field from the Destination interface:

```typescript
// In src/types/index.ts, change the Destination interface FROM:
export interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  tours: number;
  size: 'small' | 'large';
}
// TO:
export interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  size: 'small' | 'large';
}
```

- [ ] **Step 3: Update DestinationCardProps**

The `DestinationCardProps` currently uses `destination: Destination`. Since `Destination` no longer has `tours`, the component will need `tourCount` separately. Update the props interface:

```typescript
// In src/types/index.ts, change FROM:
export interface DestinationCardProps {
  destination: Destination;
}
// TO:
export interface DestinationCardProps {
  destination: Destination & {tourCount: number};
}
```

- [ ] **Step 4: Verify TypeScript compiles (expect errors in consumers)**

Run: `pnpm build 2>&1 | head -50`
Expected: Type errors in files that still use `tour.location` and `destination.tours` — this confirms the type changes propagated. These will be fixed in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: update Tour and Destination types for destination ID references"
```

---

### Task 2: Update JSON Data Files

**Files:**

- Modify: `src/data/destinations.json`
- Modify: `src/data/tours.json`

- [ ] **Step 1: Remove `tours` field from each destination in `destinations.json`**

Update `src/data/destinations.json` to remove the `tours` field from every entry. The file should contain:

```json
[
  {
    "id": 1,
    "name": "Dalat",
    "imageUrl": "https://localvietnam.de/wp-content/uploads/2023/09/tuyen-lam-see-1-1024x683.jpg",
    "size": "large"
  },
  {
    "id": 2,
    "name": "Nha Trang",
    "imageUrl": "https://www.agoda.com/wp-content/uploads/2024/02/Nha-Trang-Cable-Vietnam-1244x700.jpg",
    "size": "small"
  },
  {
    "id": 3,
    "name": "Mui Ne",
    "imageUrl": "https://images.ctfassets.net/wv75stsetqy3/6gzFoj0ORIEj3yIGsB1Q08/5797e277832264a11c9bae10fb2f7772/Retire_in_Mui_Ne.jpg?q=60&fit=fill&fm=webp",
    "size": "small"
  },
  {
    "id": 4,
    "name": "Sai Gon",
    "imageUrl": "https://cdnen.thesaigontimes.vn/wp-content/uploads/2024/07/Mot-thoang-Ho-Ba-Be_Thong-Lam.jpg",
    "size": "small"
  },
  {
    "id": 5,
    "name": "Hoi An",
    "imageUrl": "https://cdn.kimkim.com/files/a/content_articles/featured_photos/5022fa3d9e45c25486f8bcc9adcfdb44a09ded12/big-94f2b85fd88b035fb52518c04d9cfd63.jpg",
    "size": "small"
  }
]
```

- [ ] **Step 2: Replace `location` with `destinationId` in each tour in `tours.json`**

For each tour, remove the `"location"` field and add `"destinationId"` in its place. The mapping is:

| Tour ID | Tour Title        | `destinationId` |
| ------- | ----------------- | --------------- |
| 1       | Da Lat Tour       | 1 (Dalat)       |
| 2       | 2d Explore Da Lat | 1 (Dalat)       |
| 3       | Baho Waterfall    | 2 (Nha Trang)   |
| 4       | 1d Motor NT-DL    | 2 (Nha Trang)   |
| 5       | Nha Trang Tour    | 2 (Nha Trang)   |
| 6       | Honba Waterfall   | 2 (Nha Trang)   |
| 7       | Eco Day Tour      | 3 (Mui Ne)      |

For each tour entry, the change is (showing tour 1 as example):

```json
// FROM:
"location": "Da Lat",
// TO:
"destinationId": 1,
```

Tour 2: `"location": "Omega Pass"` → `"destinationId": 1`
Tour 3: `"location": "Nha Trang"` → `"destinationId": 2`
Tour 4: `"location": "Nha Trang"` → `"destinationId": 2`
Tour 5: `"location": "Nha Trang"` → `"destinationId": 2`
Tour 6: `"location": "La Lo Pagoda"` → `"destinationId": 2`
Tour 7: `"location": "La Lo pagoda"` → `"destinationId": 3`

- [ ] **Step 3: Commit**

```bash
git add src/data/destinations.json src/data/tours.json
git commit -m "refactor: replace location strings with destinationId, remove tours count"
```

---

### Task 3: Add Helper Functions

**Files:**

- Modify: `src/data/index.ts`

- [ ] **Step 1: Add the four helper functions to `src/data/index.ts`**

Replace the entire file contents with:

```typescript
import type {Destination, Tour} from '@/types';
import destinationsJson from './destinations.json';
import toursJson from './tours.json';

// Raw data
export const destinationsData: Destination[] =
  destinationsJson as Destination[];

export const toursData: Tour[] = toursJson as Tour[];

// Helpers

/** Destination lookup by ID */
export function getDestinationById(id: number): Destination | undefined {
  return destinationsData.find((d) => d.id === id);
}

/** Get destination name for display (tour cards, hero, etc.) */
export function getDestinationName(destinationId: number): string {
  const destination = getDestinationById(destinationId);
  if (!destination) {
    console.warn(`Destination with id ${destinationId} not found`);
    return '';
  }
  return destination.name;
}

/** All tours for a given destination */
export function getToursByDestination(destinationId: number): Tour[] {
  return toursData.filter((t) => t.destinationId === destinationId);
}

/** Only destinations that have >= 1 tour, with computed tour count.
 *  Preserves the original order from destinations.json. */
export function getActiveDestinations(): (Destination & {
  tourCount: number;
})[] {
  const countMap = new Map<number, number>();
  for (const tour of toursData) {
    countMap.set(
      tour.destinationId,
      (countMap.get(tour.destinationId) ?? 0) + 1,
    );
  }

  return destinationsData
    .filter((d) => countMap.has(d.id))
    .map((d) => ({...d, tourCount: countMap.get(d.id)!}));
}
```

- [ ] **Step 2: Verify the module compiles**

Run: `pnpm build 2>&1 | head -30`
Expected: The data module itself compiles. Consumer errors from other files are expected and fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/data/index.ts
git commit -m "feat: add destination helper functions (getActiveDestinations, getToursByDestination, etc.)"
```

---

### Task 4: Update Data Tests

**Files:**

- Modify: `src/data/index.spec.ts`

- [ ] **Step 1: Update the test file**

Replace the entire file with:

```typescript
import {
  toursData,
  destinationsData,
  getDestinationById,
  getDestinationName,
  getToursByDestination,
  getActiveDestinations,
} from '@/data';

describe('toursData', () => {
  it('is a non-empty array', () => {
    expect(toursData.length).toBeGreaterThan(0);
  });

  it('each tour has required fields', () => {
    for (const tour of toursData) {
      expect(tour.id).toEqual(expect.any(Number));
      expect(tour.title).toEqual(expect.any(String));
      expect(tour.imageUrl).toEqual(expect.any(String));
      expect(tour.rating).toEqual(expect.any(String));
      expect(tour.price).toEqual(expect.any(Number));
      expect(tour.duration).toEqual(expect.any(String));
      expect(tour.distance).toEqual(expect.any(String));
      expect(tour.destinationId).toEqual(expect.any(Number));
    }
  });

  it('has unique IDs', () => {
    const ids = toursData.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every tour references an existing destination', () => {
    for (const tour of toursData) {
      const dest = getDestinationById(tour.destinationId);
      expect(dest).toBeDefined();
    }
  });
});

describe('destinationsData', () => {
  it('is a non-empty array', () => {
    expect(destinationsData.length).toBeGreaterThan(0);
  });

  it('each destination has required fields', () => {
    for (const dest of destinationsData) {
      expect(dest.id).toEqual(expect.any(Number));
      expect(dest.name).toEqual(expect.any(String));
      expect(dest.imageUrl).toEqual(expect.any(String));
      expect(['small', 'large']).toContain(dest.size);
    }
  });

  it('has unique IDs', () => {
    const ids = destinationsData.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getDestinationById', () => {
  it('returns a destination for a valid ID', () => {
    const dest = getDestinationById(1);
    expect(dest).toBeDefined();
    expect(dest!.name).toBe('Dalat');
  });

  it('returns undefined for an invalid ID', () => {
    expect(getDestinationById(999)).toBeUndefined();
  });
});

describe('getDestinationName', () => {
  it('returns the name for a valid destination ID', () => {
    expect(getDestinationName(1)).toBe('Dalat');
  });

  it('returns empty string for an invalid ID', () => {
    expect(getDestinationName(999)).toBe('');
  });
});

describe('getToursByDestination', () => {
  it('returns tours matching the destination', () => {
    const tours = getToursByDestination(2);
    expect(tours.length).toBeGreaterThan(0);
    for (const tour of tours) {
      expect(tour.destinationId).toBe(2);
    }
  });

  it('returns empty array for destination with no tours', () => {
    expect(getToursByDestination(999)).toEqual([]);
  });
});

describe('getActiveDestinations', () => {
  it('only returns destinations that have at least one tour', () => {
    const active = getActiveDestinations();
    for (const dest of active) {
      expect(dest.tourCount).toBeGreaterThan(0);
    }
  });

  it('computes correct tour counts', () => {
    const active = getActiveDestinations();
    for (const dest of active) {
      const actualCount = toursData.filter(
        (t) => t.destinationId === dest.id,
      ).length;
      expect(dest.tourCount).toBe(actualCount);
    }
  });

  it('preserves destination order from destinationsData', () => {
    const active = getActiveDestinations();
    const activeIds = active.map((d) => d.id);
    const originalOrder = destinationsData
      .filter((d) => activeIds.includes(d.id))
      .map((d) => d.id);
    expect(activeIds).toEqual(originalOrder);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm test -- --testPathPattern=src/data/index.spec.ts`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/data/index.spec.ts
git commit -m "test: update data layer tests for destination ID references and helpers"
```

---

### Task 5: Update DestinationCard Component

**Files:**

- Modify: `src/components/destination-card/index.tsx`

- [ ] **Step 1: Update the component to use `tourCount` and link with query param**

Replace the entire file with:

```typescript
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import type {DestinationCardProps} from '@/types';

export const DestinationCard = ({
  destination,
  className,
}: DestinationCardProps & {className?: string}) => {
  const {name, imageUrl, tourCount, id} = destination;
  const t = useTranslations('common');

  return (
    <div
      data-testid="destination-card"
      className={`group relative rounded-lg overflow-hidden ${className ?? 'aspect-[3/2]'}`}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="type-title-lg text-white mb-1">
          <Link
            href={`/tours?destination=${id}`}
            className="hover:text-primary-light transition-colors"
          >
            {name}
          </Link>
        </h2>
        <span className="inline-block bg-primary/90 text-white type-label-sm uppercase px-3 py-1 rounded-full">
          {tourCount} {t('tours')}
        </span>
      </div>
    </div>
  );
};
```

Key changes:

- Destructure `tourCount` and `id` instead of `tours`
- Link href changes from `/tours` to `/tours?destination={id}`
- Badge displays `tourCount` instead of `tours`

- [ ] **Step 2: Commit**

```bash
git add src/components/destination-card/index.tsx
git commit -m "refactor: update DestinationCard to use tourCount and link with destination query param"
```

---

### Task 6: Update Home Page

**Files:**

- Modify: `src/pages/index.tsx`

- [ ] **Step 1: Switch from raw `destinationsData` to `getActiveDestinations()`**

In `src/pages/index.tsx`, change the import:

```typescript
// FROM:
import {destinationsData, toursData} from '@/data';
// TO:
import {getActiveDestinations, toursData} from '@/data';
```

Then add a constant at the top of the `Home` component (inside the function, before the return):

```typescript
const destinations = getActiveDestinations();
```

Then replace all 3 occurrences of `destinationsData` in the JSX with `destinations`:

1. `destinationsData[0]` → `destinations[0]`
2. `destinationsData.slice(1, 5)` → `destinations.slice(1, 5)`
3. `destinationsData.length > 5` → `destinations.length > 5`
4. `destinationsData.slice(5)` → `destinations.slice(5)`

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build 2>&1 | head -30`
Expected: Home page compiles without errors (remaining errors may come from tour card/hero components, fixed in next tasks).

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.tsx
git commit -m "refactor: home page uses getActiveDestinations() for destination section"
```

---

### Task 7: Update TourCard Component

**Files:**

- Modify: `src/components/tour-card/index.tsx`

- [ ] **Step 1: Import `getDestinationName` and replace `location` usage**

In `src/components/tour-card/index.tsx`, add the import:

```typescript
import {getDestinationName} from '@/data';
```

Then update the destructuring and usage. Change:

```typescript
// FROM:
const {title, imageUrl, rating, price, duration, distance, location, slug} =
  tour;
// TO:
const {
  title,
  imageUrl,
  rating,
  price,
  duration,
  distance,
  destinationId,
  slug,
} = tour;
```

And update the location display in the JSX:

```typescript
// FROM:
{
  location;
}
// TO:
{
  getDestinationName(destinationId);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tour-card/index.tsx
git commit -m "refactor: TourCard derives location name from destinationId"
```

---

### Task 8: Update TourHero Component

**Files:**

- Modify: `src/components/tour-hero/index.tsx`

- [ ] **Step 1: Import `getDestinationName` and replace `tour.location`**

In `src/components/tour-hero/index.tsx`, add the import:

```typescript
import {getDestinationName} from '@/data';
```

Then change the location display in the JSX (line 28):

```typescript
// FROM:
<i className="fa fa-map-marker-alt" /> {tour.location}
// TO:
<i className="fa fa-map-marker-alt" /> {getDestinationName(tour.destinationId)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tour-hero/index.tsx
git commit -m "refactor: TourHero derives location name from destinationId"
```

---

### Task 9: Update Tours Page (Client-Side Filtering)

**Files:**

- Modify: `src/pages/tours.tsx`

- [ ] **Step 1: Add destination filtering via query param**

Replace the entire file with:

```typescript
import {useMemo} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {PageHeader} from '@/components/page-header';
import {TourCard} from '@/components/tour-card';
import {toursData, getToursByDestination} from '@/data';

const fadeInUp = {
  hidden: {opacity: 0, y: 30},
  visible: {opacity: 1, y: 0, transition: {duration: 0.6}},
};

export default function Tours() {
  const t = useTranslations('tours');
  const tMeta = useTranslations('meta');
  const router = useRouter();

  const tours = useMemo(() => {
    const destinationParam = router.query.destination;
    if (typeof destinationParam === 'string') {
      const destinationId = Number(destinationParam);
      if (!Number.isNaN(destinationId)) {
        const filtered = getToursByDestination(destinationId);
        if (filtered.length > 0) {
          return filtered;
        }
      }
    }
    return toursData;
  }, [router.query.destination]);

  return (
    <>
      <Head>
        <title>{tMeta('toursTitle')}</title>
        <meta name="description" content={tMeta('toursDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: t('breadcrumbHome'), href: '/'},
          {label: t('breadcrumbTours')},
        ]}
        backgroundImage="https://data.agatetravel.com/images/photogallery/2025/halong-bay-hanoi-vietnam.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {tours.map((tour, i) => (
              <motion.div
                key={tour.id}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
                variants={{
                  ...fadeInUp,
                  visible: {
                    ...fadeInUp.visible,
                    transition: {duration: 0.6, delay: i * 0.1},
                  },
                }}
              >
                <TourCard tour={tour} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({locale}: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
```

Key changes:

- Import `useRouter`, `useMemo`, `getToursByDestination`
- Read `router.query.destination`, filter tours if valid destination ID with results
- Fall back to all tours for invalid/missing param

- [ ] **Step 2: Commit**

```bash
git add src/pages/tours.tsx
git commit -m "feat: tours page filters by destination via ?destination= query param"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Full build check**

Run: `pnpm build`
Expected: Clean build with no TypeScript errors. All pages generate successfully.

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 3: Manual verification checklist**

Start dev server (`pnpm dev`) and verify:

- Home page: Destination cards show computed tour counts (Dalat: 2, Nha Trang: 4, Mui Ne: 1)
- Home page: Only 3 destinations shown (Sai Gon and Hoi An hidden — no linked tours)
- Clicking a destination card navigates to `/tours?destination={id}`
- Tours page with `?destination=2`: Shows only Nha Trang tours
- Tours page without query param: Shows all 7 tours
- Tour cards: Location shows destination name (e.g. "Dalat" not "Omega Pass")
- Tour detail hero: Location shows destination name
- Invalid `?destination=999`: Shows all tours (graceful fallback)

- [ ] **Step 4: Commit any fixes if needed, then final commit**

```bash
git add -A
git commit -m "refactor: complete data layer refactor — destination ID references with computed counts"
```
