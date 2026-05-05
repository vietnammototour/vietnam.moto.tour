# Tour Status Enum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `isActive: Boolean` with a `TourStatus` enum (`DRAFT | PUBLISHED | FEATURED | ARCHIVED`) across the data model, queries, admin panel, and public pages.

**Architecture:** Prisma schema migration replaces `isActive` with `status` enum. Query layer gains `isAdmin` param to control filtering. Public pages switch from `getStaticProps` to `getServerSideProps` for session-aware rendering. Admin panel gets a SwiftUI-style segmented `StatusPicker` component.

**Tech Stack:** Prisma, PostgreSQL, Next.js Pages Router, NextAuth, React, Tailwind CSS

---

### Task 1: Prisma Schema Migration

**Files:**

- Modify: `prisma/schema.prisma:9-54`

- [ ] **Step 1: Add TourStatus enum and replace isActive field**

Update `prisma/schema.prisma`:

```prisma
enum Role {
  ADMIN
}

enum TourStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  FEATURED
}
```

In the `Tour` model, replace line 51 (`isActive Boolean @default(true)`) with:

```prisma
  status     TourStatus @default(DRAFT)
```

- [ ] **Step 2: Create the migration**

Run:

```bash
pnpm prisma migrate dev --name replace-is-active-with-status
```

This will fail because of data — we need a custom migration. If Prisma generates an empty migration directory, edit the SQL file. Otherwise create one manually.

- [ ] **Step 3: Write the migration SQL**

The auto-generated migration won't handle data conversion. Edit the generated SQL file in `prisma/migrations/<timestamp>_replace_is_active_with_status/migration.sql` to contain:

```sql
-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'FEATURED');

-- Add new column with default
ALTER TABLE "Tour" ADD COLUMN "status" "TourStatus" NOT NULL DEFAULT 'DRAFT';

-- Migrate existing data
UPDATE "Tour" SET "status" = 'PUBLISHED' WHERE "isActive" = true;
UPDATE "Tour" SET "status" = 'ARCHIVED' WHERE "isActive" = false;

-- Drop old column
ALTER TABLE "Tour" DROP COLUMN "isActive";
```

- [ ] **Step 4: Apply the migration**

Run:

```bash
pnpm prisma migrate dev
```

Expected: Migration applied successfully. Prisma Client regenerated.

- [ ] **Step 5: Verify with Prisma Studio**

Run:

```bash
pnpm prisma studio
```

Open in browser, check Tour table — `isActive` column gone, `status` column present with correct values.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: replace isActive with TourStatus enum in Prisma schema"
```

---

### Task 2: Update TypeScript Types

**Files:**

- Modify: `src/types/index.ts:33-58`

- [ ] **Step 1: Add TourStatus type and update Tour interface**

In `src/types/index.ts`, add the type before the `Tour` interface:

```typescript
export type TourStatus = 'DRAFT' | 'PUBLISHED' | 'FEATURED' | 'ARCHIVED';
```

Add `status` field to the `Tour` interface (after `slug` on line 41):

```typescript
export interface Tour {
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  destinationId: number;
  slug: string;
  status: TourStatus;
  description: LocalizedText;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  destinationHeroImage: string;
  images: string[];
  highlights: LocalizedText[];
  itinerary: ItineraryDay[];
  pricingGroups: PricingGroup[];
  included: LocalizedText[];
  excluded: LocalizedText[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
}
```

- [ ] **Step 2: Verify types compile**

Run:

```bash
pnpm build
```

Expected: Type errors in `queries.ts` and possibly other files referencing `isActive` — that's expected, we fix those next.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TourStatus type, add status field to Tour interface"
```

---

### Task 3: Update Query Layer

**Files:**

- Modify: `src/data/queries.ts:1-165`

- [ ] **Step 1: Update DbTour interface to include status**

In `src/data/queries.ts`, add `status` to the `DbTour` interface (after `slug`):

```typescript
interface DbTour {
  id: string;
  slug: string;
  status: string;
  title: string;
  // ... rest unchanged
}
```

- [ ] **Step 2: Update dbTourToTour converter**

Add `status` to the return object in `dbTourToTour` function (after `slug`):

```typescript
function dbTourToTour(row: DbTour, destinationName?: string): Tour {
  const destNumericId = destinationName
    ? (destNameToJsonId.get(destinationName) ?? 0)
    : 0;

  return {
    id: tourSlugToJsonId.get(row.slug) ?? 0,
    title: row.title,
    imageUrl: row.imageUrl,
    rating: row.rating,
    price: row.price,
    duration: row.duration,
    distance: row.distance,
    destinationId: destNumericId,
    slug: row.slug,
    status: row.status as Tour['status'],
    description: {en: row.descriptionEn, vi: row.descriptionVi},
    transportation: row.transportation,
    groupSize: row.groupSize,
    hotel: row.hotel,
    guided: row.guided,
    destinationHeroImage: '',
    images: row.images as string[],
    highlights: row.highlights as Tour['highlights'],
    itinerary: row.itinerary as Tour['itinerary'],
    pricingGroups: row.pricingGroups as Tour['pricingGroups'],
    included: row.included as Tour['included'],
    excluded: row.excluded as Tour['excluded'],
    paymentDetails: row.paymentDetails as Tour['paymentDetails'],
    notes: row.notes as Tour['notes'],
    mealsInfo: row.mealsInfo as Tour['mealsInfo'],
  };
}
```

- [ ] **Step 3: Update getAllTours with isAdmin param**

Replace the `getAllTours` function:

```typescript
/** All tours from DB — admins see all, public sees PUBLISHED + FEATURED only */
export async function getAllTours(isAdmin = false): Promise<Tour[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: isAdmin ? {} : {status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true},
    });

    return rows.map((row: any) => {
      const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
      tour.destinationHeroImage = row.destination.heroImage ?? '';
      return tour;
    });
  } catch (error) {
    console.error('getAllTours: DB query failed', error);
    return [];
  }
}
```

- [ ] **Step 4: Update getTourBySlug with isAdmin param**

Replace the `getTourBySlug` function:

```typescript
/** Single tour by slug from DB */
export async function getTourBySlug(
  slug: string,
  isAdmin = false,
): Promise<Tour | undefined> {
  try {
    const row = await prisma.tour.findFirst({
      where: isAdmin ? {slug} : {slug, status: {in: ['PUBLISHED', 'FEATURED']}},
      include: {destination: true},
    });
    if (!row) return undefined;
    const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
    tour.destinationHeroImage = row.destination.heroImage ?? '';
    return tour;
  } catch (error) {
    console.error('getTourBySlug: DB query failed', error);
    return undefined;
  }
}
```

Note: Changed from `findUnique` to `findFirst` because `findUnique` only accepts unique fields in `where`, and we need to combine `slug` with `status` filter.

- [ ] **Step 5: Update getAllTourSlugs**

Replace the `getAllTourSlugs` function:

```typescript
/** All public tour slugs (for sitemap/SEO) */
export async function getAllTourSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.tour.findMany({
      where: {status: {in: ['PUBLISHED', 'FEATURED']}},
      select: {slug: true},
    });
    return rows.map((r: any) => r.slug);
  } catch (error) {
    console.error('getAllTourSlugs: DB query failed', error);
    return [];
  }
}
```

- [ ] **Step 6: Update getActiveDestinationsFromDb with isAdmin param**

Replace the `getActiveDestinationsFromDb` function:

```typescript
/** Active destinations with tour count and transport flags from DB */
export async function getActiveDestinationsFromDb(
  isAdmin = false,
): Promise<
  (Destination & {tourCount: number; hasCar: boolean; hasBike: boolean})[]
> {
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
      .filter((d: any) => d.tours.length > 0)
      .map((d: any) => ({
        ...dbDestToDestination(d as unknown as DbDestination),
        tourCount: d.tours.length,
        hasCar: d.tours.some((t: any) => /car/i.test(t.transportation)),
        hasBike: d.tours.some((t: any) => /motorbike/i.test(t.transportation)),
      }));
  } catch (error) {
    console.error('getActiveDestinationsFromDb: DB query failed', error);
    return [];
  }
}
```

- [ ] **Step 7: Remove JSON fallback imports**

Remove the JSON fallback import at the top of the file. Change line 10 from:

```typescript
import {toursData, destinationsData, getActiveDestinations} from '@/data';
```

to:

```typescript
import {toursData, destinationsData} from '@/data';
```

Keep `toursData` and `destinationsData` — they're still used for the numeric ID lookup maps. Remove `getActiveDestinations` since it's no longer used as fallback.

- [ ] **Step 8: Verify build**

Run:

```bash
pnpm build
```

Expected: Possible errors in pages still using old signatures — fixed in next tasks.

- [ ] **Step 9: Commit**

```bash
git add src/data/queries.ts
git commit -m "feat: update query layer with status enum filter and isAdmin param"
```

---

### Task 4: Switch Public Pages to getServerSideProps

**Files:**

- Modify: `src/pages/index.tsx:440-457`
- Modify: `src/pages/tours.tsx:84-98`
- Modify: `src/pages/tours/[slug].tsx:160-195`

- [ ] **Step 1: Update Home page (src/pages/index.tsx)**

Replace the `getStaticProps` function (lines 440-457) and update imports. Add at the top of the file:

```typescript
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
```

Remove the `GetStaticPropsContext` import.

Update the `HomeProps` interface to include `isAdmin`:

```typescript
interface HomeProps {
  tours: Tour[];
  destinations: (Destination & {
    tourCount: number;
    hasCar: boolean;
    hasBike: boolean;
  })[];
  isAdmin: boolean;
}
```

Update the component signature to receive `isAdmin`:

```typescript
export default function Home({tours, destinations, isAdmin}: HomeProps) {
```

Replace the data-fetching function:

```typescript
export async function getServerSideProps({
  req,
  res,
  locale,
}: GetServerSidePropsContext) {
  const {getAllTours, getActiveDestinationsFromDb, getMessagesFromDb} =
    await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const [tours, destinations, dbMessages] = await Promise.all([
    getAllTours(isAdmin),
    getActiveDestinationsFromDb(isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  return {
    props: {
      tours,
      destinations,
      isAdmin,
      messages: dbMessages,
    },
  };
}
```

- [ ] **Step 2: Update Tours listing page (src/pages/tours.tsx)**

Add imports at the top:

```typescript
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
```

Remove the `GetStaticPropsContext` import.

Update `ToursPageProps`:

```typescript
interface ToursPageProps {
  allTours: Tour[];
  isAdmin: boolean;
}
```

Update the component signature:

```typescript
export default function Tours({allTours, isAdmin}: ToursPageProps) {
```

Replace the data-fetching function (lines 84-98):

```typescript
export async function getServerSideProps({
  req,
  res,
  locale,
}: GetServerSidePropsContext) {
  const {getAllTours, getMessagesFromDb} = await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const [allTours, dbMessages] = await Promise.all([
    getAllTours(isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  return {
    props: {
      allTours,
      isAdmin,
      messages: dbMessages,
    },
  };
}
```

- [ ] **Step 3: Update Tour detail page (src/pages/tours/[slug].tsx)**

Add imports at the top:

```typescript
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
```

Remove the `GetStaticPaths` and `GetStaticPropsContext` imports.

Update `TourDetailProps`:

```typescript
interface TourDetailProps {
  tour: Tour;
  isAdmin: boolean;
}
```

Update the component signature:

```typescript
export default function TourDetail({tour, isAdmin}: TourDetailProps) {
```

Delete the entire `getStaticPaths` export (lines 160-174).

Replace `getStaticProps` (lines 176-195) with:

```typescript
export async function getServerSideProps({
  params,
  req,
  res,
  locale,
}: GetServerSidePropsContext) {
  const {getTourBySlug, getMessagesFromDb} = await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const slug = params?.slug as string;
  const [tour, dbMessages] = await Promise.all([
    getTourBySlug(slug, isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  if (!tour) {
    return {notFound: true};
  }

  return {
    props: {
      tour,
      isAdmin,
      messages: dbMessages,
    },
  };
}
```

- [ ] **Step 4: Verify build**

Run:

```bash
pnpm build
```

Expected: Build succeeds. Pages now use SSR.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.tsx src/pages/tours.tsx src/pages/tours/[slug].tsx
git commit -m "feat: switch public tour pages to getServerSideProps for session-aware rendering"
```

---

### Task 5: Admin Status Badge on Public Pages

**Files:**

- Modify: `src/pages/tours.tsx` (TourCard wrapper)
- Modify: `src/pages/tours/[slug].tsx` (tour detail)
- Modify: `src/pages/index.tsx` (home page)

- [ ] **Step 1: Create AdminStatusBadge component**

Create `src/components/admin-status-badge.tsx`:

```typescript
import type {TourStatus} from '@/types';

const statusConfig: Record<TourStatus, {label: string; classes: string}> = {
  DRAFT: {
    label: 'Draft',
    classes: 'bg-amber-500/90 text-white',
  },
  PUBLISHED: {
    label: 'Published',
    classes: 'bg-green-500/90 text-white',
  },
  FEATURED: {
    label: 'Featured',
    classes: 'bg-blue-500/90 text-white',
  },
  ARCHIVED: {
    label: 'Archived',
    classes: 'bg-gray-500/90 text-white',
  },
};

interface AdminStatusBadgeProps {
  status: TourStatus;
}

export function AdminStatusBadge({status}: AdminStatusBadgeProps) {
  if (status === 'PUBLISHED') return null;

  const config = statusConfig[status];

  return (
    <span
      className={`fixed top-20 right-4 z-50 px-3 py-1.5 rounded-full type-label-sm uppercase tracking-wider shadow-lg ${config.classes}`}
    >
      {config.label} — Not Public
    </span>
  );
}
```

- [ ] **Step 2: Add badge to Tour detail page**

In `src/pages/tours/[slug].tsx`, import and render the badge:

```typescript
import {AdminStatusBadge} from '@/components/admin-status-badge';
```

Inside the `TourDetail` component, add right after the opening `<>` fragment:

```typescript
{isAdmin && tour.status && tour.status !== 'PUBLISHED' && (
  <AdminStatusBadge status={tour.status} />
)}
```

- [ ] **Step 3: Add status indicator to TourCard on listing pages**

For tours listing and home page, the admin needs to see which tours are non-public in the grid. Add a small inline badge to `src/components/tour-card.tsx`.

First, read the current TourCard component to see its structure, then add a conditional badge. The `TourCardProps` already takes `tour: Tour` which now includes `status`.

In `src/components/tour-card.tsx`, add a badge inside the card image area (top-left corner):

```typescript
{tour.status && tour.status !== 'PUBLISHED' && (
  <span
    className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full type-label-sm uppercase tracking-wider text-white ${
      tour.status === 'DRAFT'
        ? 'bg-amber-500/90'
        : tour.status === 'FEATURED'
          ? 'bg-blue-500/90'
          : 'bg-gray-500/90'
    }`}
  >
    {tour.status}
  </span>
)}
```

Note: This badge only appears when `status` is present on the tour object. For public users, tours always have `PUBLISHED` status so the badge is hidden. For admins, non-published tours show the badge.

- [ ] **Step 4: Verify visually**

Run:

```bash
pnpm dev
```

Check: tour detail page for a DRAFT tour shows floating badge. Tour cards for non-published tours show inline badge.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin-status-badge.tsx src/components/tour-card.tsx src/pages/tours/[slug].tsx
git commit -m "feat: add admin status badges on public tour pages"
```

---

### Task 6: StatusPicker Component

**Files:**

- Create: `src/components/admin/StatusPicker.tsx`

- [ ] **Step 1: Create the StatusPicker component**

Create `src/components/admin/StatusPicker.tsx`:

```typescript
import type {TourStatus} from '@/types';

const statuses: {value: TourStatus; label: string; activeClasses: string}[] = [
  {
    value: 'DRAFT',
    label: 'Draft',
    activeClasses: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'PUBLISHED',
    label: 'Published',
    activeClasses: 'bg-green-600 text-white border-green-600',
  },
  {
    value: 'FEATURED',
    label: 'Featured',
    activeClasses: 'bg-blue-500 text-white border-blue-500',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    activeClasses: 'bg-gray-500 text-white border-gray-500',
  },
];

interface StatusPickerProps {
  value: TourStatus;
  onChange: (status: TourStatus) => void;
  disabled?: boolean;
}

export function StatusPicker({value, onChange, disabled = false}: StatusPickerProps) {
  return (
    <div role="radiogroup" aria-label="Tour status" className="inline-flex rounded-lg border border-border overflow-hidden">
      {statuses.map((s) => {
        const isSelected = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(s.value)}
            className={`px-3 py-1 type-label-sm transition-colors cursor-pointer border-r border-border last:border-r-0 ${
              isSelected
                ? s.activeClasses
                : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run:

```bash
pnpm dev
```

We'll integrate it in the next tasks — for now, just confirm no import errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/StatusPicker.tsx
git commit -m "feat: add StatusPicker segmented control component"
```

---

### Task 7: Update Admin Tours List

**Files:**

- Modify: `src/pages/admin/tours/index.tsx:1-133`

- [ ] **Step 1: Update AdminTour interface and imports**

In `src/pages/admin/tours/index.tsx`, replace the `AdminTour` interface and add imports:

```typescript
import {useEffect} from 'react';
import Link from 'next/link';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {StatusPicker} from '@/components/admin/StatusPicker';
import type {TourStatus} from '@/types';

interface AdminTour {
  id: string;
  title: string;
  slug: string;
  status: TourStatus;
  destination: {name: string};
  price: number;
  duration: string;
}
```

- [ ] **Step 2: Replace handleToggleActive with handleStatusChange**

Replace the `handleDelete` and `handleToggleActive` functions:

```typescript
async function handleStatusChange(id: string, status: TourStatus) {
  const res = await fetch(`/api/admin/tours/${id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({status}),
  });
  if (res.ok) {
    refetch();
  }
}

async function handleDelete(id: string) {
  if (!confirm('Archive this tour?')) return;

  const res = await fetch(`/api/admin/tours/${id}`, {method: 'DELETE'});
  if (res.ok) {
    refetch();
  }
}
```

- [ ] **Step 3: Update the table Status column**

Replace the Status `<td>` cell (the one with the `handleToggleActive` button) with:

```tsx
<td className="px-4 py-3">
  <StatusPicker
    value={tour.status}
    onChange={(status) => handleStatusChange(tour.id, status)}
  />
</td>
```

- [ ] **Step 4: Update Delete button text**

Change the Delete button text from "Delete" to "Archive" and update the handler:

```tsx
<button
  onClick={() => handleDelete(tour.id)}
  className="type-label-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
>
  Archive
</button>
```

- [ ] **Step 5: Verify visually**

Run:

```bash
pnpm dev
```

Navigate to `/admin/tours`. Verify segmented picker shows for each tour, clicking segments changes status.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/tours/index.tsx
git commit -m "feat: replace isActive toggle with StatusPicker in admin tours list"
```

---

### Task 8: Update TourForm

**Files:**

- Modify: `src/components/admin/TourForm.tsx:1-335`

- [ ] **Step 1: Add status to TourFormData and imports**

Add `status` to the `TourFormData` interface and import `StatusPicker`:

```typescript
import {StatusPicker} from './StatusPicker';
import type {TourStatus} from '@/types';
```

Add to `TourFormData` interface (after `mealsInfo`):

```typescript
status: TourStatus;
```

Update `emptyForm` to include:

```typescript
  status: 'DRAFT' as TourStatus,
```

- [ ] **Step 2: Add StatusPicker to the form**

Add the StatusPicker right before the Submit buttons section (before the `{/* Submit */}` comment):

```tsx
{
  /* Status */
}
<div>
  <label className="block type-label-sm text-on-surface-secondary mb-2">
    Status
  </label>
  <StatusPicker
    value={form.status}
    onChange={(status) => updateField('status', status)}
  />
</div>;
```

- [ ] **Step 3: Verify form renders**

Run:

```bash
pnpm dev
```

Navigate to `/admin/tours/new`. Verify StatusPicker appears with DRAFT selected by default.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/TourForm.tsx
git commit -m "feat: add StatusPicker to TourForm for create and edit"
```

---

### Task 9: Update Admin API Routes

**Files:**

- Modify: `src/pages/api/admin/tours/index.ts:20-51`
- Modify: `src/pages/api/admin/tours/[id].ts:20-58`

- [ ] **Step 1: Update POST route to use status**

In `src/pages/api/admin/tours/index.ts`, add `status` to the `create` data object. Add after `mealsInfo`:

```typescript
        status: data.status ?? 'DRAFT',
```

- [ ] **Step 2: Update PUT route to use status**

In `src/pages/api/admin/tours/[id].ts`, replace `isActive: data.isActive` (line 50) with:

```typescript
        status: data.status,
```

- [ ] **Step 3: Update DELETE route**

In `src/pages/api/admin/tours/[id].ts`, replace the DELETE handler (lines 56-58):

```typescript
if (req.method === 'DELETE') {
  await prisma.tour.update({where: {id}, data: {status: 'ARCHIVED'}});
  return res.status(204).end();
}
```

- [ ] **Step 4: Verify API works**

Run:

```bash
pnpm dev
```

Test: create a tour in admin panel, verify it saves with DRAFT status. Change status via picker, verify it persists on refresh.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/tours/index.ts src/pages/api/admin/tours/[id].ts
git commit -m "feat: update admin tour API routes to use status enum"
```

---

### Task 10: Update Admin Stats

**Files:**

- Modify: `src/pages/api/admin/stats.ts:17`

- [ ] **Step 1: Update tour count query**

In `src/pages/api/admin/stats.ts`, replace line 17:

```typescript
    prisma.tour.count({where: {isActive: true}}),
```

with:

```typescript
    prisma.tour.count({where: {status: {in: ['PUBLISHED', 'FEATURED']}}}),
```

- [ ] **Step 2: Verify stats endpoint**

Run:

```bash
pnpm dev
```

Navigate to `/admin` dashboard. Verify tour count shows correct number (published + featured only).

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/stats.ts
git commit -m "feat: update admin stats to count by status enum"
```

---

### Task 11: Update Admin Tour Edit Page

**Files:**

- Modify: `src/pages/admin/tours/[id]/edit.tsx`

- [ ] **Step 1: Check edit page data loading**

Read `src/pages/admin/tours/[id]/edit.tsx` to verify how it loads tour data and passes it to `TourForm`. The `initialData` prop needs to include `status` from the API response. Since the GET API returns the raw Prisma row (which now has `status`), it should flow through automatically.

Verify the edit page maps the API response to `TourFormData` correctly — if it does a field-by-field mapping, add `status`. If it spreads the response, it should work automatically.

- [ ] **Step 2: Verify edit flow end-to-end**

Run:

```bash
pnpm dev
```

Navigate to `/admin/tours/{id}/edit`. Verify:

1. StatusPicker shows the tour's current status
2. Changing status and saving persists the change
3. Newly created tours show DRAFT in edit mode

- [ ] **Step 3: Commit (if changes needed)**

```bash
git add src/pages/admin/tours/[id]/edit.tsx
git commit -m "fix: ensure status field flows through tour edit page"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run full build**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No lint errors.

- [ ] **Step 3: Manual smoke test**

Run `pnpm dev` and verify:

1. **Public (not logged in):**
   - Home page shows only PUBLISHED + FEATURED tours
   - `/tours` shows only PUBLISHED + FEATURED tours
   - `/tours/[slug]` for a DRAFT tour returns 404
   - `/tours/[slug]` for a PUBLISHED tour works normally

2. **Admin (logged in):**
   - Home page shows all tours, non-published ones have status badge on cards
   - `/tours` shows all tours with status badges
   - `/tours/[slug]` for a DRAFT tour renders with floating "Draft — Not Public" badge
   - Admin panel tours list has segmented status picker for each tour
   - Creating a new tour defaults to DRAFT
   - Changing status via picker persists immediately
   - Archive button sets status to ARCHIVED
   - Dashboard stats count only PUBLISHED + FEATURED

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for tour status enum feature"
```
