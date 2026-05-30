# TripAdvisor Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add verifiable TripAdvisor reviews (copied into our DB, linked to tours) — 6 featured on the home page, all per-tour reviews on each tour page, with an admin CRUD and "View all on TripAdvisor" CTAs.

**Architecture:** New `Review` Prisma model (FK → `Tour`, cascade delete) plus a `Tour.tripAdvisorUrl` column. Server queries return mapped, Date→ISO domain objects. Admin CRUD follows the canonical admin shell (`AdminPageShell`, shared `Button`/form primitives, `ConfirmModal`). Public display adds `StarRating`, `ReviewCard`, `ReviewsSection` (home, replacing the hardcoded `Testimonials`), and `TourReviews` (tour page). Review images and avatars are TripAdvisor hotlink URLs only — no upload pipeline, no child table.

**Tech Stack:** Next.js 16 (Pages Router), React 19, Prisma 7 (pg adapter), TypeScript strict, next-intl 4, react-hook-form + yup, Jest + RTL, Tailwind v4.

---

## File Structure

**Data layer**
- `prisma/schema.prisma` — add `Review` model + `Tour.tripAdvisorUrl` + `Tour.reviews` relation
- `prisma/migrations/<ts>_add_reviews/migration.sql` — generated
- `src/domain/review/index.ts` — `Review` domain type
- `src/domain/review/mapper.ts` — `toReview(row)` (Date→ISO, images→string[])
- `src/domain/review/mapper.spec.ts` — mapper tests
- `src/domain/index.ts` — re-export `Review`
- `src/data/queries.ts` — `getFeaturedReviews()`, `getTourReviews(tourId)`

**API**
- `src/pages/api/admin/reviews/index.ts` — GET list / POST create
- `src/pages/api/admin/reviews/[id].ts` — GET / PUT / DELETE

**Routing**
- `src/routes/registry.ts` — `routes.admin.reviews.*`
- `src/routes/api.ts` — `api.admin.reviews.*`

**Admin UI**
- `src/components/Admin/AdminLayout/AdminLayout.tsx` — nav link
- `src/components/Admin/ReviewForm/ReviewForm.form-utils.ts`
- `src/components/Admin/ReviewForm/ReviewForm.tsx`
- `src/components/Admin/ReviewForm/index.ts`
- `src/pages/admin/reviews/index.tsx` — list
- `src/pages/admin/reviews/new.tsx` — create
- `src/pages/admin/reviews/[id].tsx` — edit
- `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx` + its form-utils — add `tripAdvisorUrl` field

**Public UI**
- `src/components/reviews/StarRating/StarRating.tsx` (+ `index.ts`, `.spec.tsx`)
- `src/components/reviews/ReviewCard/ReviewCard.tsx` (+ `index.ts`, `.spec.tsx`)
- `src/components/reviews/ReviewsSection/ReviewsSection.tsx` (+ `index.ts`, `.spec.tsx`)
- `src/components/reviews/TourReviews/TourReviews.tsx` (+ `index.ts`, `.spec.tsx`)
- `src/pages/index.tsx` — load featured reviews, replace `<Testimonials />`
- `src/pages/tours/[slug].tsx` — load + render tour reviews

**Constants & i18n**
- `src/utils/index.ts` — `TRIPADVISOR_REVIEWS_URL` constant
- `prisma/seed-reviews-translations.ts` — `reviews.*` keys
- `package.json` — `db:seed-reviews-translations` script

---

## Task 1: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma` (Tour model ~48-74; add Review model after Tour)

- [ ] **Step 1: Add `tripAdvisorUrl` + `reviews` relation to `Tour`**

In `prisma/schema.prisma`, inside `model Tour`, add these two lines just before `createdAt`:

```prisma
  tripAdvisorUrl String?
  reviews        Review[]
```

- [ ] **Step 2: Add the `Review` model**

Immediately after the closing `}` of `model Tour` (before `model Destination`), add:

```prisma
model Review {
  id               String   @id @default(uuid())
  tourId           String
  tour             Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  reviewerName     String
  reviewerLocation String?
  avatarUrl        String?
  rating           Int      @default(5)
  title            String   @default("")
  body             String   @default("")
  reviewDate       DateTime
  sourceUrl        String
  images           Json     @default("[]")
  isFeatured       Boolean  @default(false)
  displayOrder     Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([tourId])
  @@index([isFeatured])
}
```

- [ ] **Step 3: Create and apply the migration**

Run: `npx prisma migrate dev --name add-reviews`
Expected: Prisma generates `prisma/migrations/<timestamp>_add_reviews/migration.sql`, applies it, and regenerates the client. Output ends with `✔ Generated Prisma Client`.

- [ ] **Step 4: Verify the client typechecks**

Run: `npx prisma generate && pnpm exec tsc --noEmit`
Expected: no errors (the new `Review` delegate and `Tour.tripAdvisorUrl` exist).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add Review model and Tour.tripAdvisorUrl"
```

---

## Task 2: Review domain type + mapper

**Files:**
- Create: `src/domain/review/index.ts`
- Create: `src/domain/review/mapper.ts`
- Create: `src/domain/review/mapper.spec.ts`
- Modify: `src/domain/index.ts`

- [ ] **Step 1: Write the failing mapper test**

Create `src/domain/review/mapper.spec.ts`:

```typescript
import type {Review as PrismaReview} from '@prisma/client';
import {toReview} from './mapper';

const baseRow = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: 'London, UK',
  avatarUrl: 'https://media.tripadvisor.com/avatar.jpg',
  rating: 5,
  title: 'Unforgettable ride',
  body: 'Best trip of my life.',
  reviewDate: new Date('2026-01-10T00:00:00Z'),
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: ['https://www.tripadvisor.com/media/1', 'https://www.tripadvisor.com/media/2'],
  isFeatured: true,
  displayOrder: 2,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
} as unknown as PrismaReview;

describe('toReview', () => {
  it('converts Date fields to ISO strings', () => {
    const r = toReview(baseRow);
    expect(r.reviewDate).toBe('2026-01-10T00:00:00.000Z');
    expect(r.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(r.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('shapes images as string[] and defaults null to []', () => {
    expect(toReview(baseRow).images).toEqual([
      'https://www.tripadvisor.com/media/1',
      'https://www.tripadvisor.com/media/2',
    ]);
    expect(
      toReview({...baseRow, images: null} as unknown as PrismaReview).images,
    ).toEqual([]);
  });

  it('passes through nullable fields as-is', () => {
    const r = toReview({
      ...baseRow,
      reviewerLocation: null,
      avatarUrl: null,
    } as unknown as PrismaReview);
    expect(r.reviewerLocation).toBeNull();
    expect(r.avatarUrl).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec jest src/domain/review/mapper.spec.ts`
Expected: FAIL — `Cannot find module './mapper'`.

- [ ] **Step 3: Write the domain type**

Create `src/domain/review/index.ts`:

```typescript
export type Review = {
  id: string;
  tourId: string;
  reviewerName: string;
  reviewerLocation: string | null;
  avatarUrl: string | null;
  rating: number;
  title: string;
  body: string;
  reviewDate: string;
  sourceUrl: string;
  images: string[];
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 4: Write the mapper**

Create `src/domain/review/mapper.ts`:

```typescript
import type {Review as PrismaReview} from '@prisma/client';
import type {Review} from './index';

export function toReview(row: PrismaReview): Review {
  return {
    id: row.id,
    tourId: row.tourId,
    reviewerName: row.reviewerName,
    reviewerLocation: row.reviewerLocation,
    avatarUrl: row.avatarUrl,
    rating: row.rating,
    title: row.title,
    body: row.body,
    reviewDate: row.reviewDate.toISOString(),
    sourceUrl: row.sourceUrl,
    images: (row.images as unknown as string[] | null) ?? [],
    isFeatured: row.isFeatured,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

- [ ] **Step 5: Re-export from the domain barrel**

In `src/domain/index.ts`, add after the `Vehicle` export line:

```typescript
export type {Review} from './review';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec jest src/domain/review/mapper.spec.ts`
Expected: PASS (3 passing).

- [ ] **Step 7: Commit**

```bash
git add src/domain/review src/domain/index.ts
git commit -m "feat(domain): add Review type and mapper"
```

---

## Task 3: Data-layer queries

**Files:**
- Modify: `src/data/queries.ts` (add import + two functions)

- [ ] **Step 1: Add the mapper import**

In `src/data/queries.ts`, alongside the other `to*` imports near the top, add:

```typescript
import {toReview} from '@/domain/review/mapper';
```

And extend the `import type { ... } from '@/domain'` block to include `Review`:

```typescript
import type {
  Tour,
  DestinationWithStats,
  DestinationDetail,
  Highlight,
  TeamMember,
  Review,
} from '@/domain';
```

- [ ] **Step 2: Add `getFeaturedReviews` and `getTourReviews`**

Append to `src/data/queries.ts` (end of file):

```typescript
export async function getFeaturedReviews(limit = 6): Promise<Review[]> {
  try {
    const rows = await prisma.review.findMany({
      where: {isFeatured: true},
      orderBy: [{displayOrder: 'asc'}, {reviewDate: 'desc'}],
      take: limit,
    });
    return rows.map(toReview);
  } catch (error) {
    console.error('getFeaturedReviews: DB query failed', error);
    return [];
  }
}

export async function getTourReviews(tourId: string): Promise<Review[]> {
  try {
    const rows = await prisma.review.findMany({
      where: {tourId},
      orderBy: {reviewDate: 'desc'},
    });
    return rows.map(toReview);
  } catch (error) {
    console.error('getTourReviews: DB query failed', error);
    return [];
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/queries.ts
git commit -m "feat(data): add getFeaturedReviews and getTourReviews"
```

---

## Task 4: Admin API routes

**Files:**
- Create: `src/pages/api/admin/reviews/index.ts`
- Create: `src/pages/api/admin/reviews/[id].ts`

Validation helper is duplicated inline in each handler (matches the perks-route style; no shared module needed).

- [ ] **Step 1: Write the list/create route**

Create `src/pages/api/admin/reviews/index.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

function sanitizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, 5);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const reviews = await prisma.review.findMany({
      orderBy: [{isFeatured: 'desc'}, {displayOrder: 'asc'}, {reviewDate: 'desc'}],
      include: {tour: {select: {id: true, slug: true, titleEn: true}}},
    });
    return res.json(reviews);
  }

  if (req.method === 'POST') {
    const b = req.body ?? {};
    if (!b.tourId || typeof b.tourId !== 'string') {
      return res.status(400).json({error: 'tourId is required'});
    }
    if (!b.reviewerName || typeof b.reviewerName !== 'string') {
      return res.status(400).json({error: 'reviewerName is required'});
    }
    if (!b.sourceUrl || typeof b.sourceUrl !== 'string') {
      return res.status(400).json({error: 'sourceUrl is required'});
    }
    const rating = Number(b.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({error: 'rating must be 1-5'});
    }
    const reviewDate = new Date(b.reviewDate);
    if (Number.isNaN(reviewDate.getTime())) {
      return res.status(400).json({error: 'reviewDate is invalid'});
    }
    const tour = await prisma.tour.findUnique({where: {id: b.tourId}});
    if (!tour) return res.status(400).json({error: 'tour not found'});

    const review = await prisma.review.create({
      data: {
        tourId: b.tourId,
        reviewerName: b.reviewerName,
        reviewerLocation: b.reviewerLocation || null,
        avatarUrl: b.avatarUrl || null,
        rating,
        title: b.title ?? '',
        body: b.body ?? '',
        reviewDate,
        sourceUrl: b.sourceUrl,
        images: sanitizeImages(b.images),
        isFeatured: Boolean(b.isFeatured),
        displayOrder: Number.isInteger(Number(b.displayOrder))
          ? Number(b.displayOrder)
          : 0,
      },
    });
    return res.status(201).json(review);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Write the get/update/delete route**

Create `src/pages/api/admin/reviews/[id].ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

function sanitizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, 5);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id;
  if (typeof id !== 'string') {
    return res.status(400).json({error: 'invalid id'});
  }

  if (req.method === 'GET') {
    const review = await prisma.review.findUnique({where: {id}});
    if (!review) return res.status(404).json({error: 'not found'});
    return res.json(review);
  }

  if (req.method === 'PUT') {
    const existing = await prisma.review.findUnique({where: {id}});
    if (!existing) return res.status(404).json({error: 'not found'});
    const b = req.body ?? {};
    const rating = Number(b.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({error: 'rating must be 1-5'});
    }
    const reviewDate = new Date(b.reviewDate);
    if (Number.isNaN(reviewDate.getTime())) {
      return res.status(400).json({error: 'reviewDate is invalid'});
    }
    if (!b.tourId || !b.reviewerName || !b.sourceUrl) {
      return res.status(400).json({error: 'missing required fields'});
    }
    const review = await prisma.review.update({
      where: {id},
      data: {
        tourId: b.tourId,
        reviewerName: b.reviewerName,
        reviewerLocation: b.reviewerLocation || null,
        avatarUrl: b.avatarUrl || null,
        rating,
        title: b.title ?? '',
        body: b.body ?? '',
        reviewDate,
        sourceUrl: b.sourceUrl,
        images: sanitizeImages(b.images),
        isFeatured: Boolean(b.isFeatured),
        displayOrder: Number.isInteger(Number(b.displayOrder))
          ? Number(b.displayOrder)
          : 0,
      },
    });
    return res.json(review);
  }

  if (req.method === 'DELETE') {
    await prisma.review.delete({where: {id}}).catch(() => null);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/reviews
git commit -m "feat(api): admin reviews CRUD routes"
```

---

## Task 5: Routing registry + API client

**Files:**
- Modify: `src/routes/registry.ts` (admin block, after `roles`)
- Modify: `src/routes/api.ts` (admin block)

- [ ] **Step 1: Add review path builders**

In `src/routes/registry.ts`, inside the `admin: {` object, after the `roles: { ... }` block, add:

```typescript
    reviews: {
      list: {path: () => '/admin/reviews'},
      new: {path: () => '/admin/reviews/new'},
      edit: {path: (p: {id: string}) => `/admin/reviews/${p.id}`},
    },
```

- [ ] **Step 2: Add the API client methods**

In `src/routes/api.ts`, inside `admin: {`, after the `roles: { ... }` block, add:

```typescript
    reviews: {
      list: () => request<(VMT.Review & {tour: {id: string; slug: string; titleEn: string}})[]>(
        '/api/admin/reviews',
      ),
      get: (id: string) => request<VMT.Review>(`/api/admin/reviews/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.Review>('/api/admin/reviews', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.Review>(`/api/admin/reviews/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/reviews/${id}`, {method: 'DELETE'}),
    },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/registry.ts src/routes/api.ts
git commit -m "feat(routes): register admin reviews paths and api client"
```

---

## Task 6: Admin nav link

**Files:**
- Modify: `src/components/Admin/AdminLayout/AdminLayout.tsx` (`navItems` array ~32-73)

- [ ] **Step 1: Add the Reviews nav item**

In `src/components/Admin/AdminLayout/AdminLayout.tsx`, in the `navItems` array, add immediately after the Tours item (`{href: routes.admin.tours.list.path(), label: 'Tours', icon: 'fa-route'},`):

```typescript
    {
      href: routes.admin.reviews.list.path(),
      label: 'Reviews',
      icon: 'fa-star',
    },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/AdminLayout/AdminLayout.tsx
git commit -m "feat(admin): add Reviews to admin nav"
```

---

## Task 7: ReviewForm (form-utils + component)

**Files:**
- Create: `src/components/Admin/ReviewForm/ReviewForm.form-utils.ts`
- Create: `src/components/Admin/ReviewForm/ReviewForm.tsx`
- Create: `src/components/Admin/ReviewForm/index.ts`

Single-language form — no locale switcher (review body is original-language only).
Images: a fixed list of 5 URL text inputs; empty strings are dropped on submit.

- [ ] **Step 1: Write the form-utils**

Create `src/components/Admin/ReviewForm/ReviewForm.form-utils.ts`:

```typescript
import * as yup from 'yup';

export type ReviewFormValues = {
  tourId: string;
  reviewerName: string;
  reviewerLocation: string;
  avatarUrl: string;
  rating: number;
  title: string;
  body: string;
  reviewDate: string;
  sourceUrl: string;
  images: string[];
  isFeatured: boolean;
  displayOrder: number;
};

export const reviewFormDefaults: ReviewFormValues = {
  tourId: '',
  reviewerName: '',
  reviewerLocation: '',
  avatarUrl: '',
  rating: 5,
  title: '',
  body: '',
  reviewDate: '',
  sourceUrl: '',
  images: ['', '', '', '', ''],
  isFeatured: false,
  displayOrder: 0,
};

export function buildReviewSchema(t: (k: string) => string) {
  return yup.object({
    tourId: yup.string().required(t('validation.tourRequired')),
    reviewerName: yup.string().required(t('validation.nameRequired')),
    reviewerLocation: yup.string().default(''),
    avatarUrl: yup.string().url(t('validation.urlInvalid')).default('').transform(
      (v) => v || '',
    ),
    rating: yup
      .number()
      .typeError(t('validation.ratingRange'))
      .integer()
      .min(1, t('validation.ratingRange'))
      .max(5, t('validation.ratingRange'))
      .required(),
    title: yup.string().default(''),
    body: yup.string().required(t('validation.bodyRequired')),
    reviewDate: yup.string().required(t('validation.dateRequired')),
    sourceUrl: yup
      .string()
      .url(t('validation.urlInvalid'))
      .required(t('validation.sourceRequired')),
    images: yup
      .array()
      .of(yup.string().default(''))
      .max(5)
      .default(['', '', '', '', '']),
    isFeatured: yup.boolean().default(false),
    displayOrder: yup.number().integer().min(0).default(0),
  });
}

// Drops blank image URLs and shapes the create/update payload.
export function toReviewPayload(values: ReviewFormValues): Record<string, unknown> {
  return {
    ...values,
    images: values.images.map((u) => u.trim()).filter((u) => u.length > 0),
  };
}
```

- [ ] **Step 2: Write the form component**

Create `src/components/Admin/ReviewForm/ReviewForm.tsx`:

```typescript
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {TextInput, Textarea, NumberInput, Select} from '@/components/ui';
import {
  buildReviewSchema,
  reviewFormDefaults,
  type ReviewFormValues,
} from './ReviewForm.form-utils';

type TourOption = {id: string; label: string};

type ReviewFormProps = {
  id?: string;
  tours: TourOption[];
  defaults?: ReviewFormValues;
  onSubmit: (data: ReviewFormValues) => void;
};

export function ReviewForm({
  id = 'review-form',
  tours,
  defaults,
  onSubmit,
}: ReviewFormProps) {
  const t = useTranslations('admin.reviews');
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<ReviewFormValues>({
    resolver: yupResolver(buildReviewSchema(t)),
    defaultValues: defaults ?? reviewFormDefaults,
  });

  return (
    <form
      id={id}
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="max-w-2xl space-y-6 bg-surface-elevated border border-border p-6"
    >
      <Select label={t('tourLabel')} {...register('tourId')} error={errors.tourId?.message}>
        <option value="">{t('tourPlaceholder')}</option>
        {tours.map((tour) => (
          <option key={tour.id} value={tour.id}>
            {tour.label}
          </option>
        ))}
      </Select>

      <TextInput
        label={t('reviewerNameLabel')}
        {...register('reviewerName')}
        error={errors.reviewerName?.message}
      />
      <TextInput
        label={t('reviewerLocationLabel')}
        {...register('reviewerLocation')}
        error={errors.reviewerLocation?.message}
      />
      <TextInput
        label={t('avatarUrlLabel')}
        {...register('avatarUrl')}
        error={errors.avatarUrl?.message}
      />
      <NumberInput
        label={t('ratingLabel')}
        {...register('rating', {valueAsNumber: true})}
        error={errors.rating?.message}
      />
      <TextInput
        label={t('titleLabel')}
        {...register('title')}
        error={errors.title?.message}
      />
      <Textarea
        label={t('bodyLabel')}
        rows={5}
        {...register('body')}
        error={errors.body?.message}
      />
      <TextInput
        label={t('reviewDateLabel')}
        type="date"
        {...register('reviewDate')}
        error={errors.reviewDate?.message}
      />
      <TextInput
        label={t('sourceUrlLabel')}
        {...register('sourceUrl')}
        error={errors.sourceUrl?.message}
      />

      <fieldset className="space-y-3">
        <legend className="block type-label-sm text-on-surface-secondary mb-1">
          {t('imagesLabel')}
        </legend>
        {[0, 1, 2, 3, 4].map((i) => (
          <TextInput
            key={i}
            label={t('imageUrlNth', {n: i + 1})}
            {...register(`images.${i}` as const)}
            error={errors.images?.[i]?.message}
          />
        ))}
      </fieldset>

      <NumberInput
        label={t('displayOrderLabel')}
        {...register('displayOrder', {valueAsNumber: true})}
        error={errors.displayOrder?.message}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="cursor-pointer" {...register('isFeatured')} />
        <span className="type-body-sm text-on-surface">{t('isFeaturedLabel')}</span>
      </label>
    </form>
  );
}
```

- [ ] **Step 3: Write the barrel export**

Create `src/components/Admin/ReviewForm/index.ts`:

```typescript
export {ReviewForm} from './ReviewForm';
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. (If `Select` does not accept `error`/`label` props the same way, adjust to match `src/components/ui/Select` — open that file and mirror its prop names.)

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/ReviewForm
git commit -m "feat(admin): ReviewForm with form-utils"
```

---

## Task 8: Admin list page

**Files:**
- Create: `src/pages/admin/reviews/index.tsx`

- [ ] **Step 1: Write the list page**

Create `src/pages/admin/reviews/index.tsx`:

```typescript
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {Button, ConfirmModal} from '@/components/ui';
import {api, routes} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import type * as VMT from '@/domain';

type ReviewRow = VMT.Review & {
  tour: {id: string; slug: string; titleEn: string};
};

export default function ReviewsListPage() {
  const t = useTranslations('admin.reviews');
  const tCommon = useTranslations('common');
  const {setLoading: setAdminLoading} = useAdminLoading();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.admin.reviews.list().then(({data}) => {
      if (data) setReviews(data as ReviewRow[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function performDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const {error} = await api.admin.reviews.delete(deleteTarget.id);
    setDeleting(false);
    if (error) return;
    setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          actions={
            <Button
              variant="primary"
              href={routes.admin.reviews.new.path()}
              icon={<i className="fa fa-plus text-xs" />}
            >
              {t('add')}
            </Button>
          }
        />
      }
    >
      <table className="w-full bg-surface-elevated border border-border">
        <thead>
          <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
            <th className="p-3">{t('reviewerNameLabel')}</th>
            <th className="p-3">{t('ratingLabel')}</th>
            <th className="p-3">{t('tourLabel')}</th>
            <th className="p-3">{t('featuredColumn')}</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3">{r.reviewerName}</td>
              <td className="p-3 tabular-nums">{r.rating}/5</td>
              <td className="p-3">{r.tour.titleEn}</td>
              <td className="p-3">{r.isFeatured ? t('featuredYes') : ''}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    href={routes.admin.reviews.edit.path({id: r.id})}
                    icon={<i className="fa fa-pencil text-xs" />}
                  >
                    {tCommon('edit')}
                  </Button>
                  <Button
                    variant="ghost-danger"
                    size="sm"
                    onClick={() => setDeleteTarget(r)}
                    icon={<i className="fa fa-trash text-xs" />}
                  >
                    {tCommon('delete')}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget
            ? t('deleteConfirm', {name: deleteTarget.reviewerName})
            : ''
        }
        confirmLabel={tCommon('delete')}
        variant="danger"
        loading={deleting}
        onConfirm={performDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteTarget(null);
        }}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/reviews/index.tsx
git commit -m "feat(admin): reviews list page"
```

---

## Task 9: Admin new + edit pages

**Files:**
- Create: `src/pages/admin/reviews/new.tsx`
- Create: `src/pages/admin/reviews/[id].tsx`

Both load the tour dropdown options from `getToursForAdmin` server-side and pass them to `ReviewForm`.

- [ ] **Step 1: Write the new page**

Create `src/pages/admin/reviews/new.tsx`:

```typescript
import {useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {ReviewForm} from '@/components/Admin/ReviewForm';
import {
  toReviewPayload,
  type ReviewFormValues,
} from '@/components/Admin/ReviewForm/ReviewForm.form-utils';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminPageFooter,
} from '@/components/Admin/AdminPageShell';
import {Button} from '@/components/ui';
import {api, routes} from '@/routes';

type TourOption = {id: string; label: string};

export default function NewReviewPage({tours}: {tours: TourOption[]}) {
  const router = useRouter();
  const t = useTranslations('admin.reviews');
  const tCommon = useTranslations('common');
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: ReviewFormValues) {
    setSubmitError(null);
    const {error} = await api.admin.reviews.create(toReviewPayload(values));
    if (error) {
      setSubmitError(error);
      return;
    }
    router.push(routes.admin.reviews.list.path());
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('add')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title'), href: routes.admin.reviews.list.path()},
            {label: t('add')},
          ]}
        />
      }
      footer={
        <AdminPageFooter
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(routes.admin.reviews.list.path())}
              >
                {tCommon('cancel')}
              </Button>
              <Button variant="primary" type="submit" form="review-form">
                {tCommon('save')}
              </Button>
            </>
          }
        />
      }
    >
      {submitError && (
        <div
          role="alert"
          className="mb-4 bg-error/10 text-error type-body-sm p-3 border border-error/30"
        >
          {submitError}
        </div>
      )}
      <ReviewForm tours={tours} onSubmit={onSubmit} />
    </AdminPageShell>
  );
}

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb, getToursForAdmin} = await import('@/data/queries');
  const [messages, tourRows] = await Promise.all([
    getMessagesFromDb(locale ?? 'vi'),
    getToursForAdmin({}),
  ]);
  const tours: TourOption[] = tourRows.map((row) => ({
    id: row.id,
    label: row.titleEn || row.slug,
  }));
  return {props: {messages: messages ?? {}, tours}};
}
```

- [ ] **Step 2: Write the edit page**

Create `src/pages/admin/reviews/[id].tsx`:

```typescript
import {useState} from 'react';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {ReviewForm} from '@/components/Admin/ReviewForm';
import {
  reviewFormDefaults,
  toReviewPayload,
  type ReviewFormValues,
} from '@/components/Admin/ReviewForm/ReviewForm.form-utils';
import {
  AdminPageShell,
  AdminPageHeader,
  AdminPageFooter,
} from '@/components/Admin/AdminPageShell';
import {Button} from '@/components/ui';
import {api, routes} from '@/routes';
import type * as VMT from '@/domain';

type TourOption = {id: string; label: string};

type EditReviewPageProps = {
  review: VMT.Review;
  tours: TourOption[];
};

function toFormValues(review: VMT.Review): ReviewFormValues {
  const images = [...review.images];
  while (images.length < 5) images.push('');
  return {
    tourId: review.tourId,
    reviewerName: review.reviewerName,
    reviewerLocation: review.reviewerLocation ?? '',
    avatarUrl: review.avatarUrl ?? '',
    rating: review.rating,
    title: review.title,
    body: review.body,
    reviewDate: review.reviewDate.slice(0, 10),
    sourceUrl: review.sourceUrl,
    images: images.slice(0, 5),
    isFeatured: review.isFeatured,
    displayOrder: review.displayOrder,
  };
}

export default function EditReviewPage({review, tours}: EditReviewPageProps) {
  const router = useRouter();
  const t = useTranslations('admin.reviews');
  const tCommon = useTranslations('common');
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: ReviewFormValues) {
    setSubmitError(null);
    const {error} = await api.admin.reviews.update(
      review.id,
      toReviewPayload(values),
    );
    if (error) {
      setSubmitError(error);
      return;
    }
    router.push(routes.admin.reviews.list.path());
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('editTitle')}
          breadcrumbs={[
            {label: 'Admin', href: routes.admin.dashboard.path()},
            {label: t('title'), href: routes.admin.reviews.list.path()},
            {label: t('editTitle')},
          ]}
        />
      }
      footer={
        <AdminPageFooter
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(routes.admin.reviews.list.path())}
              >
                {tCommon('cancel')}
              </Button>
              <Button variant="primary" type="submit" form="review-form">
                {tCommon('save')}
              </Button>
            </>
          }
        />
      }
    >
      {submitError && (
        <div
          role="alert"
          className="mb-4 bg-error/10 text-error type-body-sm p-3 border border-error/30"
        >
          {submitError}
        </div>
      )}
      <ReviewForm
        tours={tours}
        defaults={{...reviewFormDefaults, ...toFormValues(review)}}
        onSubmit={onSubmit}
      />
    </AdminPageShell>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const {getMessagesFromDb, getToursForAdmin} = await import('@/data/queries');
  const {prisma} = await import('@/lib/prisma');
  const {toReview} = await import('@/domain/review/mapper');

  const id = ctx.params?.id as string;
  const row = await prisma.review.findUnique({where: {id}});
  if (!row) return {notFound: true};

  const [messages, tourRows] = await Promise.all([
    getMessagesFromDb(ctx.locale ?? 'vi'),
    getToursForAdmin({}),
  ]);
  const tours: TourOption[] = tourRows.map((tr) => ({
    id: tr.id,
    label: tr.titleEn || tr.slug,
  }));

  return {
    props: {messages: messages ?? {}, review: toReview(row), tours},
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. (Confirm `getToursForAdmin` accepts `{}` and returns rows with `id`, `slug`, `titleEn` — see `src/data/queries.ts:230`. If its return type omits those, select them in that query or adjust the mapper here.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/reviews/new.tsx "src/pages/admin/reviews/[id].tsx"
git commit -m "feat(admin): reviews new and edit pages"
```

---

## Task 10: StarRating component

**Files:**
- Create: `src/components/reviews/StarRating/StarRating.tsx`
- Create: `src/components/reviews/StarRating/index.ts`
- Create: `src/components/reviews/StarRating/StarRating.spec.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/reviews/StarRating/StarRating.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {StarRating} from './StarRating';

describe('StarRating', () => {
  it('renders 5 star icons total', () => {
    render(<StarRating rating={3} />);
    expect(screen.getAllByTestId('star')).toHaveLength(5);
  });

  it('marks `rating` stars as filled', () => {
    render(<StarRating rating={4} />);
    expect(screen.getAllByTestId('star-filled')).toHaveLength(4);
  });

  it('exposes an accessible label', () => {
    render(<StarRating rating={5} />);
    expect(screen.getByLabelText('5 out of 5 stars')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec jest src/components/reviews/StarRating`
Expected: FAIL — cannot find `./StarRating`.

- [ ] **Step 3: Write the component**

Create `src/components/reviews/StarRating/StarRating.tsx`:

```tsx
type StarRatingProps = {
  rating: number;
};

export function StarRating({rating}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className="inline-flex items-center gap-0.5 text-primary"
      role="img"
      aria-label={`${clamped} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= clamped;
        return (
          <i
            key={n}
            data-testid={filled ? 'star-filled' : 'star'}
            className={`fa ${filled ? 'fa-star' : 'fa-star-o'} text-sm`}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}
```

Note: filled stars carry `data-testid="star-filled"`; empty stars carry `data-testid="star"`. The test counts all 5 via a combined query — adjust the test if needed: replace the "5 total" assertion with `expect(screen.getAllByTestId(/star/).length)`... Instead, to keep both testids queryable as "star", give every icon `data-testid="star"` AND filled ones an extra marker. Simpler: render below.

Replace the component body's `<i>` with:

```tsx
          <i
            key={n}
            data-testid="star"
            data-filled={filled ? 'true' : 'false'}
            className={`fa ${filled ? 'fa-star' : 'fa-star-o'} text-sm`}
            aria-hidden="true"
          />
```

And update the test's filled assertion to:

```tsx
  it('marks `rating` stars as filled', () => {
    render(<StarRating rating={4} />);
    const filled = screen
      .getAllByTestId('star')
      .filter((el) => el.getAttribute('data-filled') === 'true');
    expect(filled).toHaveLength(4);
  });
```

(`data-filled` is a behavioral data attribute, not a style assertion — allowed under the testing rule.)

- [ ] **Step 4: Write the barrel export**

Create `src/components/reviews/StarRating/index.ts`:

```typescript
export {StarRating} from './StarRating';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec jest src/components/reviews/StarRating`
Expected: PASS (3 passing).

- [ ] **Step 6: Commit**

```bash
git add src/components/reviews/StarRating
git commit -m "feat(reviews): StarRating component"
```

---

## Task 11: ReviewCard component

**Files:**
- Create: `src/components/reviews/ReviewCard/ReviewCard.tsx`
- Create: `src/components/reviews/ReviewCard/index.ts`
- Create: `src/components/reviews/ReviewCard/ReviewCard.spec.tsx`

`reviewDate` is rendered as `YYYY.MM` (matches the existing Testimonials style) computed from the ISO string with plain string slicing — no `Date` formatting, no locale dependence.

- [ ] **Step 1: Write the failing test**

Create `src/components/reviews/ReviewCard/ReviewCard.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {ReviewCard} from './ReviewCard';
import type {Review} from '@/domain';

const review: Review = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: 'London, UK',
  avatarUrl: null,
  rating: 5,
  title: 'Unforgettable',
  body: 'Best trip ever.',
  reviewDate: '2026-01-10T00:00:00.000Z',
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: ['https://www.tripadvisor.com/media/1'],
  isFeatured: true,
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ReviewCard', () => {
  it('renders reviewer name, location, title and body', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('London, UK')).toBeInTheDocument();
    expect(screen.getByText('Unforgettable')).toBeInTheDocument();
    expect(screen.getByText('Best trip ever.')).toBeInTheDocument();
  });

  it('links the verify CTA to sourceUrl with safe rel', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    const link = screen.getByRole('link', {name: 'Verified on TripAdvisor'});
    expect(link).toHaveAttribute('href', review.sourceUrl);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders a photo link per image URL', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    expect(
      screen.getByRole('link', {name: /photo 1/i}),
    ).toHaveAttribute('href', 'https://www.tripadvisor.com/media/1');
  });

  it('shows initials when there is no avatar', () => {
    render(<ReviewCard review={review} verifyLabel="Verified on TripAdvisor" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec jest src/components/reviews/ReviewCard`
Expected: FAIL — cannot find `./ReviewCard`.

- [ ] **Step 3: Write the component**

Create `src/components/reviews/ReviewCard/ReviewCard.tsx`:

```tsx
import Image from 'next/image';
import type {Review} from '@/domain';
import {StarRating} from '../StarRating';

type ReviewCardProps = {
  review: Review;
  verifyLabel: string;
  photoLabel?: (n: number) => string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function shortDate(iso: string): string {
  // ISO "2026-01-10T..." -> "2026.01"
  return `${iso.slice(0, 4)}.${iso.slice(5, 7)}`;
}

export function ReviewCard({review, verifyLabel, photoLabel}: ReviewCardProps) {
  const label = photoLabel ?? ((n: number) => `Photo ${n}`);
  return (
    <article className="bg-surface-alt p-8 lg:p-10 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {review.avatarUrl ? (
          <span className="relative h-12 w-12 overflow-hidden rounded-full bg-surface-elevated">
            <Image
              src={review.avatarUrl}
              alt={review.reviewerName}
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated font-mono text-sm text-on-surface-secondary">
            {initials(review.reviewerName)}
          </span>
        )}
        <div>
          <p className="type-title-sm text-on-surface">{review.reviewerName}</p>
          {review.reviewerLocation && (
            <p className="type-label-sm text-on-surface-secondary">
              {review.reviewerLocation}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} />
        <span className="font-mono text-xs text-on-surface-secondary tabular-nums">
          {shortDate(review.reviewDate)}
        </span>
      </div>

      {review.title && (
        <p className="type-title-sm text-on-surface">{review.title}</p>
      )}
      <p className="text-base text-on-surface-secondary leading-relaxed">
        {review.body}
      </p>

      {review.images.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {review.images.map((url, i) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label(i + 1)}
                className="inline-flex h-12 w-12 items-center justify-center border border-border bg-surface-elevated text-on-surface-secondary cursor-pointer hover:border-primary"
              >
                <i className="fa fa-image" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <a
        href={review.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.05em] text-on-surface-accent hover:text-primary cursor-pointer"
      >
        <i className="fa fa-external-link" aria-hidden="true" />
        {verifyLabel}
      </a>
    </article>
  );
}
```

- [ ] **Step 4: Write the barrel export**

Create `src/components/reviews/ReviewCard/index.ts`:

```typescript
export {ReviewCard} from './ReviewCard';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec jest src/components/reviews/ReviewCard`
Expected: PASS (4 passing).

- [ ] **Step 6: Commit**

```bash
git add src/components/reviews/ReviewCard
git commit -m "feat(reviews): ReviewCard component"
```

---

## Task 12: ReviewsSection (home) — replaces Testimonials

**Files:**
- Create: `src/components/reviews/ReviewsSection/ReviewsSection.tsx`
- Create: `src/components/reviews/ReviewsSection/index.ts`
- Create: `src/components/reviews/ReviewsSection/ReviewsSection.spec.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/reviews/ReviewsSection/ReviewsSection.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {ReviewsSection} from './ReviewsSection';
import type {Review} from '@/domain';

const messages = {
  reviews: {
    heading: 'What riders say',
    eyebrow: 'Field reports',
    verifiedOn: 'Verified on TripAdvisor',
    viewAllOnTripAdvisor: 'View all on TripAdvisor',
    photoNth: 'Photo {n}',
  },
};

const review: Review = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: 'London, UK',
  avatarUrl: null,
  rating: 5,
  title: 'Great',
  body: 'Loved it.',
  reviewDate: '2026-01-10T00:00:00.000Z',
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: [],
  isFeatured: true,
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('ReviewsSection', () => {
  it('renders nothing when there are no reviews', () => {
    const {container} = renderWithIntl(<ReviewsSection reviews={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the heading and a card per review', () => {
    renderWithIntl(<ReviewsSection reviews={[review]} />);
    expect(screen.getByText('What riders say')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('links the global CTA to the TripAdvisor reviews URL', () => {
    renderWithIntl(<ReviewsSection reviews={[review]} />);
    const cta = screen.getByRole('link', {name: 'View all on TripAdvisor'});
    expect(cta).toHaveAttribute(
      'href',
      expect.stringContaining('tripadvisor.com'),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec jest src/components/reviews/ReviewsSection`
Expected: FAIL — cannot find `./ReviewsSection`.

- [ ] **Step 3: Write the component**

Create `src/components/reviews/ReviewsSection/ReviewsSection.tsx`:

```tsx
import {useTranslations} from 'next-intl';
import type {Review} from '@/domain';
import {ReviewCard} from '../ReviewCard';
import {TRIPADVISOR_REVIEWS_URL} from '@/utils';

type ReviewsSectionProps = {
  reviews: Review[];
};

export function ReviewsSection({reviews}: ReviewsSectionProps) {
  const t = useTranslations('reviews');
  if (reviews.length === 0) return null;

  return (
    <section className="bg-surface-deep py-20 lg:py-28 border-y border-on-surface-tertiary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-2 border-primary pl-4">
          <span className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block">
            {t('eyebrow')}
          </span>
          <h2 className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2">
            {t('heading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              verifyLabel={t('verifiedOn')}
              photoLabel={(n) => t('photoNth', {n})}
            />
          ))}
        </div>

        <div className="mt-8">
          <a
            href={TRIPADVISOR_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-on-surface-tertiary hover:border-primary text-on-surface hover:text-primary font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
          >
            {t('viewAllOnTripAdvisor')}
            <i className="fa fa-arrow-right" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the barrel export**

Create `src/components/reviews/ReviewsSection/index.ts`:

```typescript
export {ReviewsSection} from './ReviewsSection';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec jest src/components/reviews/ReviewsSection`
Expected: PASS (3 passing). (Requires `TRIPADVISOR_REVIEWS_URL` from Task 16 — if running this task first, add the constant now per Task 16 Step 1.)

- [ ] **Step 6: Commit**

```bash
git add src/components/reviews/ReviewsSection
git commit -m "feat(reviews): home ReviewsSection"
```

---

## Task 13: TourReviews (tour page)

**Files:**
- Create: `src/components/reviews/TourReviews/TourReviews.tsx`
- Create: `src/components/reviews/TourReviews/index.ts`
- Create: `src/components/reviews/TourReviews/TourReviews.spec.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/reviews/TourReviews/TourReviews.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {TourReviews} from './TourReviews';
import type {Review} from '@/domain';

const messages = {
  reviews: {
    tourHeading: 'Traveller reviews',
    verifiedOn: 'Verified on TripAdvisor',
    viewAllOnTripAdvisor: 'View all on TripAdvisor',
    photoNth: 'Photo {n}',
  },
};

const review: Review = {
  id: 'r1',
  tourId: 't1',
  reviewerName: 'Jane Doe',
  reviewerLocation: null,
  avatarUrl: null,
  rating: 4,
  title: '',
  body: 'Solid ride.',
  reviewDate: '2026-01-10T00:00:00.000Z',
  sourceUrl: 'https://www.tripadvisor.com/review/r1',
  images: [],
  isFeatured: false,
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('TourReviews', () => {
  it('renders nothing when there are no reviews', () => {
    const {container} = renderWithIntl(
      <TourReviews reviews={[]} tripAdvisorUrl={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a card per review', () => {
    renderWithIntl(<TourReviews reviews={[review]} tripAdvisorUrl={null} />);
    expect(screen.getByText('Solid ride.')).toBeInTheDocument();
  });

  it('shows the CTA only when a tripAdvisorUrl is provided', () => {
    const {rerender} = renderWithIntl(
      <TourReviews reviews={[review]} tripAdvisorUrl={null} />,
    );
    expect(
      screen.queryByRole('link', {name: 'View all on TripAdvisor'}),
    ).not.toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TourReviews
          reviews={[review]}
          tripAdvisorUrl="https://www.tripadvisor.com/AttractionProductReview-x"
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole('link', {name: 'View all on TripAdvisor'}),
    ).toHaveAttribute(
      'href',
      'https://www.tripadvisor.com/AttractionProductReview-x',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec jest src/components/reviews/TourReviews`
Expected: FAIL — cannot find `./TourReviews`.

- [ ] **Step 3: Write the component**

Create `src/components/reviews/TourReviews/TourReviews.tsx`:

```tsx
import {useTranslations} from 'next-intl';
import type {Review} from '@/domain';
import {ReviewCard} from '../ReviewCard';

type TourReviewsProps = {
  reviews: Review[];
  tripAdvisorUrl: string | null;
};

export function TourReviews({reviews, tripAdvisorUrl}: TourReviewsProps) {
  const t = useTranslations('reviews');
  if (reviews.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border-subtle pt-10">
      <h2 className="font-display text-2xl lg:text-3xl font-bold uppercase tracking-[0.05em] text-on-surface mb-8">
        {t('tourHeading')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-subtle border border-border-subtle">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            verifyLabel={t('verifiedOn')}
            photoLabel={(n) => t('photoNth', {n})}
          />
        ))}
      </div>

      {tripAdvisorUrl && (
        <div className="mt-8">
          <a
            href={tripAdvisorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-on-surface-tertiary hover:border-primary text-on-surface hover:text-primary font-mono text-xs font-medium uppercase tracking-[0.05em] px-6 py-3 cursor-pointer transition-colors"
          >
            {t('viewAllOnTripAdvisor')}
            <i className="fa fa-arrow-right" aria-hidden="true" />
          </a>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Write the barrel export**

Create `src/components/reviews/TourReviews/index.ts`:

```typescript
export {TourReviews} from './TourReviews';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec jest src/components/reviews/TourReviews`
Expected: PASS (3 passing).

- [ ] **Step 6: Commit**

```bash
git add src/components/reviews/TourReviews
git commit -m "feat(reviews): TourReviews block"
```

---

## Task 14: Wire home + tour pages

**Files:**
- Modify: `src/pages/index.tsx` (imports, props type, JSX, `getServerSideProps`)
- Modify: `src/pages/tours/[slug].tsx` (imports, props type, JSX, `getServerSideProps`)

- [ ] **Step 1: Home — swap import and props type**

In `src/pages/index.tsx`:
- Remove the import `import {Testimonials} from '@/components/home/Testimonials';`
- Add `import {ReviewsSection} from '@/components/reviews/ReviewsSection';`
- In `type HomeProps`, add field: `reviews: VMT.Review[];`
- In the `Home({...})` destructure, add `reviews`.

- [ ] **Step 2: Home — replace the rendered section**

Replace `<Testimonials />` in the JSX with:

```tsx
      <ReviewsSection reviews={reviews} />
```

- [ ] **Step 3: Home — load featured reviews in getServerSideProps**

In `src/pages/index.tsx` `getServerSideProps`, extend the dynamic import and the `Promise.all`:

```typescript
  const {
    getAllTours,
    getActiveDestinationsFromDb,
    getMessagesFromDb,
    getImageCollection,
    getFeaturedReviews,
  } = await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.orgRoleKey === 'admin';

  const [tours, destinations, dbMessages, gallery, reviews] = await Promise.all([
    getAllTours(isAdmin),
    getActiveDestinationsFromDb(isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
    getImageCollection('home-gallery'),
    getFeaturedReviews(6),
  ]);

  return {
    props: {
      tours,
      destinations,
      isAdmin,
      messages: dbMessages,
      gallery,
      reviews,
      locale: locale ?? 'vi',
    },
  };
```

- [ ] **Step 4: Tour page — imports and props type**

In `src/pages/tours/[slug].tsx`:
- Add `import {TourReviews} from '@/components/reviews/TourReviews';`
- In `type TourDetailProps`, add: `reviews: VMT.Review[];`
- In `TourDetail({tour, isAdmin})`, add `reviews`: `TourDetail({tour, isAdmin, reviews})`.

- [ ] **Step 5: Tour page — render the block**

Inside the closing of the `<article>` (just before `</article>` at the end of the main content), add:

```tsx
          <TourReviews reviews={reviews} tripAdvisorUrl={tour.tripAdvisorUrl} />
```

Note: `tour.tripAdvisorUrl` is `string | null` — the `Tour` domain type inherits it from the Prisma row via the existing `Omit` (it is not in the omit list), so it is already present. Confirm with `pnpm exec tsc --noEmit`; if absent, add `tripAdvisorUrl: string | null;` to the `Tour` type in `src/domain/tour/index.ts` and map it in `src/domain/tour/mapper.ts` as `tripAdvisorUrl: row.tripAdvisorUrl,`.

- [ ] **Step 6: Tour page — load reviews in getServerSideProps**

In `src/pages/tours/[slug].tsx` `getServerSideProps`, update:

```typescript
  const {getTourBySlug, getMessagesFromDb, getTourReviews} = await import(
    '@/data/queries'
  );
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.orgRoleKey === 'admin';

  const slug = params?.slug as string;
  const tour = await getTourBySlug(slug, isAdmin);
  if (!tour) {
    return {notFound: true};
  }
  const [dbMessages, reviews] = await Promise.all([
    getMessagesFromDb(locale ?? 'vi'),
    getTourReviews(tour.id),
  ]);

  return {
    props: {
      tour,
      isAdmin,
      reviews,
      messages: dbMessages,
    },
  };
```

- [ ] **Step 7: Typecheck and run existing tests**

Run: `pnpm exec tsc --noEmit && pnpm exec jest src/components/reviews src/domain/review`
Expected: no type errors; review tests pass.

- [ ] **Step 8: Delete the now-unused Testimonials component**

Run: `git rm -r src/components/home/Testimonials`
(If anything else imports it, `pnpm exec tsc --noEmit` will flag it — fix those before committing. Search first: `grep -rn "home/Testimonials" src`.)

- [ ] **Step 9: Commit**

```bash
git add src/pages/index.tsx "src/pages/tours/[slug].tsx"
git commit -m "feat(reviews): wire featured reviews on home and per-tour reviews"
```

---

## Task 15: Tour admin — tripAdvisorUrl field

**Files:**
- Modify: `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx` (add input)
- Modify: `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts` (schema + type + defaults)
- Modify: the tour create/update API route if it whitelists fields: `src/pages/api/admin/tours/index.ts` and `src/pages/api/admin/tours/[id].ts`

First confirm exact filenames: `grep -rln "tripAdvisor\|GeneralTab" src/components/Admin/tabs`. The general tab edits the tour's scalar fields; add `tripAdvisorUrl` there alongside fields like `duration`/`distance`.

- [ ] **Step 1: Inspect the tour General tab form-utils**

Run: `sed -n '1,80p' src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts`
Identify the form values type, defaults, and yup schema. Add a `tripAdvisorUrl: string` field:
- to the values type: `tripAdvisorUrl: string;`
- to defaults: `tripAdvisorUrl: ''`
- to schema: `tripAdvisorUrl: yup.string().url(t('validation.urlInvalid')).default('').transform((v) => v || ''),`
  (Reuse whatever validation-message convention the file already uses; if it doesn't pass a `t`, use a literal message string matching the file's style.)

- [ ] **Step 2: Add the input to GeneralTab.tsx**

In `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx`, add near the other `TextInput` fields:

```tsx
      <TextInput
        label={t('tripAdvisorUrlLabel')}
        {...register('tripAdvisorUrl')}
        error={errors.tripAdvisorUrl?.message}
      />
```

(Match the surrounding field markup — if the file uses `FormField` wrappers or a different register pattern, mirror it exactly.)

- [ ] **Step 3: Ensure the value persists through the tour API**

Run: `grep -n "duration\|distance\|titleEn" src/pages/api/admin/tours/index.ts src/pages/api/admin/tours/[id].ts`
If the create/update handlers explicitly enumerate fields written to Prisma (rather than spreading the body), add `tripAdvisorUrl: body.tripAdvisorUrl || null,` to the `data` object in both POST (index) and PUT (`[id]`). If they pass the body through a shared builder, add it there. Confirm `tripAdvisorUrl` reaches `prisma.tour.create/update`.

- [ ] **Step 4: Add the `admin.tours.tripAdvisorUrlLabel` translation**

This key is seeded in Task 16 (added to the reviews-translations seed under the `admin.tours` namespace). No code change here beyond referencing `t('tripAdvisorUrlLabel')` in Step 2.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/tabs/GeneralTab src/pages/api/admin/tours
git commit -m "feat(admin): tripAdvisorUrl field on tour general tab"
```

---

## Task 16: Constants + translation seed

**Files:**
- Modify: `src/utils/index.ts` (add `TRIPADVISOR_REVIEWS_URL`)
- Create: `prisma/seed-reviews-translations.ts`
- Modify: `package.json` (add `db:seed-reviews-translations` script)

- [ ] **Step 1: Add the global constant**

In `src/utils/index.ts`, add (near `contactInfo` / other exported constants):

```typescript
export const TRIPADVISOR_REVIEWS_URL =
  'https://www.tripadvisor.com/Attraction_Review-g293928-d5501636-Reviews-Vietnam_Motorcycle_Tour-Nha_Trang_Khanh_Hoa_Province.html';
```

- [ ] **Step 2: Create the seed script**

Create `prisma/seed-reviews-translations.ts` by copying the env-bootstrap + `main()` scaffold from `prisma/seed-rentals-translations.ts` (lines 1-50 and the `main()`/`.catch()`/`.finally()` tail at 468-485), replacing only the `entries` array with:

```typescript
const entries: Entry[] = [
  // Public reviews section (home + tour)
  {namespace: 'reviews', key: 'eyebrow', valueEn: 'Field reports', valueVi: 'Đánh giá thực tế'},
  {namespace: 'reviews', key: 'heading', valueEn: 'What riders say', valueVi: 'Khách nói gì về chúng tôi'},
  {namespace: 'reviews', key: 'tourHeading', valueEn: 'Traveller reviews', valueVi: 'Đánh giá của khách'},
  {namespace: 'reviews', key: 'verifiedOn', valueEn: 'Verified on TripAdvisor', valueVi: 'Xác minh trên TripAdvisor'},
  {namespace: 'reviews', key: 'viewAllOnTripAdvisor', valueEn: 'View all on TripAdvisor', valueVi: 'Xem tất cả trên TripAdvisor'},
  {namespace: 'reviews', key: 'photoNth', valueEn: 'Photo {n}', valueVi: 'Ảnh {n}'},

  // Admin — reviews CRUD
  {namespace: 'admin.reviews', key: 'title', valueEn: 'Reviews', valueVi: 'Đánh giá'},
  {namespace: 'admin.reviews', key: 'add', valueEn: 'Add review', valueVi: 'Thêm đánh giá'},
  {namespace: 'admin.reviews', key: 'editTitle', valueEn: 'Edit review', valueVi: 'Sửa đánh giá'},
  {namespace: 'admin.reviews', key: 'tourLabel', valueEn: 'Tour', valueVi: 'Tour'},
  {namespace: 'admin.reviews', key: 'tourPlaceholder', valueEn: 'Select a tour', valueVi: 'Chọn tour'},
  {namespace: 'admin.reviews', key: 'reviewerNameLabel', valueEn: 'Reviewer name', valueVi: 'Tên người đánh giá'},
  {namespace: 'admin.reviews', key: 'reviewerLocationLabel', valueEn: 'Reviewer location', valueVi: 'Nơi ở'},
  {namespace: 'admin.reviews', key: 'avatarUrlLabel', valueEn: 'Avatar URL', valueVi: 'URL ảnh đại diện'},
  {namespace: 'admin.reviews', key: 'ratingLabel', valueEn: 'Rating (1-5)', valueVi: 'Đánh giá (1-5)'},
  {namespace: 'admin.reviews', key: 'titleLabel', valueEn: 'Review title', valueVi: 'Tiêu đề'},
  {namespace: 'admin.reviews', key: 'bodyLabel', valueEn: 'Review text', valueVi: 'Nội dung'},
  {namespace: 'admin.reviews', key: 'reviewDateLabel', valueEn: 'Review date', valueVi: 'Ngày đánh giá'},
  {namespace: 'admin.reviews', key: 'sourceUrlLabel', valueEn: 'TripAdvisor link', valueVi: 'Liên kết TripAdvisor'},
  {namespace: 'admin.reviews', key: 'imagesLabel', valueEn: 'Photo links (up to 5)', valueVi: 'Liên kết ảnh (tối đa 5)'},
  {namespace: 'admin.reviews', key: 'imageUrlNth', valueEn: 'Photo URL {n}', valueVi: 'URL ảnh {n}'},
  {namespace: 'admin.reviews', key: 'displayOrderLabel', valueEn: 'Display order', valueVi: 'Thứ tự hiển thị'},
  {namespace: 'admin.reviews', key: 'isFeaturedLabel', valueEn: 'Show on home page', valueVi: 'Hiển thị trên trang chủ'},
  {namespace: 'admin.reviews', key: 'featuredColumn', valueEn: 'Featured', valueVi: 'Nổi bật'},
  {namespace: 'admin.reviews', key: 'featuredYes', valueEn: 'Yes', valueVi: 'Có'},
  {namespace: 'admin.reviews', key: 'deleteConfirm', valueEn: 'Delete review by {name}?', valueVi: 'Xóa đánh giá của {name}?'},
  {namespace: 'admin.reviews', key: 'validation.tourRequired', valueEn: 'Tour is required', valueVi: 'Vui lòng chọn tour'},
  {namespace: 'admin.reviews', key: 'validation.nameRequired', valueEn: 'Reviewer name is required', valueVi: 'Vui lòng nhập tên'},
  {namespace: 'admin.reviews', key: 'validation.bodyRequired', valueEn: 'Review text is required', valueVi: 'Vui lòng nhập nội dung'},
  {namespace: 'admin.reviews', key: 'validation.dateRequired', valueEn: 'Review date is required', valueVi: 'Vui lòng nhập ngày'},
  {namespace: 'admin.reviews', key: 'validation.sourceRequired', valueEn: 'TripAdvisor link is required', valueVi: 'Vui lòng nhập liên kết'},
  {namespace: 'admin.reviews', key: 'validation.urlInvalid', valueEn: 'Must be a valid URL', valueVi: 'URL không hợp lệ'},
  {namespace: 'admin.reviews', key: 'validation.ratingRange', valueEn: 'Rating must be 1-5', valueVi: 'Đánh giá phải từ 1 đến 5'},

  // Admin — tour general tab
  {namespace: 'admin.tours', key: 'tripAdvisorUrlLabel', valueEn: 'TripAdvisor page URL', valueVi: 'URL trang TripAdvisor'},
];
```

(`common.edit`, `common.delete`, `common.cancel`, `common.save` already exist and are reused by the pages — do not redeclare them.)

- [ ] **Step 3: Add the package.json script**

In `package.json` `scripts`, after `db:seed-rentals-translations`, add:

```json
    "db:seed-reviews-translations": "npx tsx prisma/seed-reviews-translations.ts",
```

- [ ] **Step 4: Run the seed**

Run: `pnpm db:seed-reviews-translations`
Expected: `Seeded <N> reviews translations.`

- [ ] **Step 5: Verify keys are not duplicating common.* values**

Run: `pnpm i18n:scan`
Expected: no new warnings about `reviews.*` / `admin.reviews.*` leaf keys colliding with `common.*`. If `featuredYes` ("Yes") collides with an existing `common.yes`, switch the call site to `common.yes` and drop the `admin.reviews.featuredYes` entry.

- [ ] **Step 6: Commit**

```bash
git add src/utils/index.ts prisma/seed-reviews-translations.ts package.json
git commit -m "feat(i18n): reviews constants and translation seed"
```

---

## Task 17: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck + lint + full test run**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm exec jest`
Expected: no type errors, no lint errors, all tests pass.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: build succeeds (Next.js type-checks pages too).

- [ ] **Step 3: Manual smoke (dev)**

Run: `pnpm dev`, then:
- `/admin/reviews` → Add review → pick a tour, fill fields, add a TripAdvisor link + 1-2 photo links, set Featured → Save. Row appears.
- Home page → featured review card shows, stars correct, "View all on TripAdvisor" → global URL, photo tile → TripAdvisor media URL (new tab).
- Tour detail page for that tour → review appears; if the tour has a `tripAdvisorUrl`, the per-tour CTA shows and points to it.
- Delete the review via `ConfirmModal` → row removed.

- [ ] **Step 4: Final commit (if any smoke fixes were needed)**

```bash
git add -A
git commit -m "fix(reviews): smoke-test corrections"
```

---

## Notes / known follow-ups (out of scope)

- No average-rating aggregate badge.
- No automated TripAdvisor import — manual copy/paste only.
- Avatar and review photos are TripAdvisor hotlinks; if TripAdvisor blocks hotlinking, swap `<Image>`/anchor for a future upload path (separate task).
- `next/image` with remote TripAdvisor hosts requires those hostnames in `next.config.mjs` `images.remotePatterns` — if avatars 404 at build/runtime, add the TripAdvisor media hostname there (a one-line config change, flagged here rather than pre-applied since it touches build config).
