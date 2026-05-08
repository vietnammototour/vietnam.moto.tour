# Destination Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public `/destinations/[slug]` page rendering hero, highlights, and associated tours; split `Highlight` model into localized title + description fields.

**Architecture:** Server-rendered Next.js Pages Router page (`getServerSideProps`) backed by a new `getDestinationBySlug` Prisma query. New presentational components live under `src/components/destination-detail/`. `Highlight` model migrates from `textVi/textEn` → `titleVi/titleEn` + `descriptionVi/descriptionEn` with backfill. Existing `routes.tours.byDestination` filter is preserved untouched; only `DestinationCard` href is repointed.

**Tech Stack:** Next.js 16 (Pages Router), React 19, TypeScript strict, Prisma, PostgreSQL, next-intl, Tailwind v4, framer-motion, Jest + RTL.

**Spec:** `docs/superpowers/specs/2026-05-08-destination-detail-page-design.md`

**Branch:** `feat/destination-detail-page` (branched from `main`). All tasks commit to this branch. Final task opens a PR targeting `main`.

---

## File Structure

**Create:**

- `prisma/migrations/<timestamp>_highlight_title_description_split/migration.sql` — schema migration
- `src/pages/destinations/[slug].tsx` — public detail page
- `src/components/destination-detail/DestinationHero/{index.ts,DestinationHero.tsx,DestinationHero.spec.tsx}`
- `src/components/destination-detail/DestinationHighlights/{index.ts,DestinationHighlights.tsx,DestinationHighlights.spec.tsx}`
- `src/components/destination-detail/HighlightCard/{index.ts,HighlightCard.tsx,HighlightCard.spec.tsx}`
- `src/components/destination-detail/DestinationTours/{index.ts,DestinationTours.tsx,DestinationTours.spec.tsx}`
- `src/components/destination-detail/DestinationCTA/{index.ts,DestinationCTA.tsx,DestinationCTA.spec.tsx}`

**Modify:**

- `prisma/schema.prisma` — `Highlight` model fields
- `src/domain/highlight/index.ts` — Highlight type
- `src/domain/highlight/mapper.ts` — toHighlight
- `src/data/queries.ts` — add `getDestinationBySlug`
- `src/routes/registry.ts` — add `destinations.detail`
- `src/components/DestinationCard/DestinationCard.tsx` — href change
- `src/components/DestinationCard/DestinationCard.spec.tsx` — href assertion
- `src/components/Admin/DestinationHighlights/DestinationHighlights.tsx` — form fields
- `src/components/Admin/DestinationHighlights/DestinationHighlights.form-utils.ts` — schema/defaults/submit
- `src/components/Admin/tabs/HighlightsTab/HighlightsTab.tsx` — render new fields
- `src/components/tour-detail/TourHighlights/TourHighlights.tsx` — read new fields
- `src/pages/api/admin/highlights/index.ts` — accept new fields
- `src/pages/api/admin/highlights/[id].ts` — accept new fields
- `src/messages/vi.json` and `src/messages/en.json` — new keys

---

## Task 1: Migrate Highlight schema (split text → title + description)

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_highlight_title_description_split/migration.sql`

- [ ] **Step 1: Edit Prisma schema**

In `prisma/schema.prisma`, replace the `Highlight` model fields:

```prisma
model Highlight {
  id            String      @id @default(cuid())
  destinationId String
  destination   Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  titleEn       String      @default("")
  titleVi       String      @default("")
  descriptionEn String      @default("")
  descriptionVi String      @default("")
  imageUrl      String?
  createdAt     DateTime    @default(now())
  tours         Tour[]
}
```

- [ ] **Step 2: Generate migration via Prisma**

Run:

```bash
pnpm prisma migrate dev --name highlight_title_description_split --create-only
```

Expected: a new folder under `prisma/migrations/` containing `migration.sql` that drops `textEn`/`textVi` and adds the four new columns.

- [ ] **Step 3: Edit migration SQL to backfill before drop**

Replace the generated `migration.sql` body with this exact ordering (titles first, then descriptions, then drop):

```sql
ALTER TABLE "Highlight" ADD COLUMN "titleEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Highlight" ADD COLUMN "titleVi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Highlight" ADD COLUMN "descriptionEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Highlight" ADD COLUMN "descriptionVi" TEXT NOT NULL DEFAULT '';

UPDATE "Highlight" SET "titleEn" = "textEn", "titleVi" = "textVi";

ALTER TABLE "Highlight" DROP COLUMN "textEn";
ALTER TABLE "Highlight" DROP COLUMN "textVi";
```

- [ ] **Step 4: Apply migration**

Run:

```bash
pnpm prisma migrate dev
```

Expected: migration applies cleanly. `pnpm prisma generate` runs automatically.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): split Highlight text into title + description"
```

---

## Task 2: Update Highlight domain type + mapper

**Files:**

- Modify: `src/domain/highlight/mapper.ts`
- Test: existing `src/domain/highlight/` (no spec exists; type-only changes verified by tsc)

- [ ] **Step 1: Update mapper**

Replace `src/domain/highlight/mapper.ts`:

```ts
import type {Highlight as PrismaHighlight} from '@prisma/client';
import type {Highlight} from './index';

export function toHighlight(row: PrismaHighlight): Highlight {
  return {
    id: row.id,
    destinationId: row.destinationId,
    titleEn: row.titleEn,
    titleVi: row.titleVi,
    descriptionEn: row.descriptionEn,
    descriptionVi: row.descriptionVi,
    imageUrl: row.imageUrl,
  };
}
```

`src/domain/highlight/index.ts` is `Omit<PrismaHighlight, 'createdAt'>`, so the type follows automatically once Prisma is regenerated.

- [ ] **Step 2: Type-check**

Run:

```bash
pnpm tsc --noEmit
```

Expected: errors only in consumers still referencing `textEn`/`textVi` (admin highlight UI, API routes, tour highlights component). These are fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/domain/highlight/mapper.ts
git commit -m "refactor(domain): map highlight title/description fields"
```

---

## Task 3: Update highlight API routes

**Files:**

- Modify: `src/pages/api/admin/highlights/index.ts`
- Modify: `src/pages/api/admin/highlights/[id].ts`

- [ ] **Step 1: Update POST handler**

Replace the POST branch in `src/pages/api/admin/highlights/index.ts`:

```ts
if (req.method === 'POST') {
  const {
    destinationId,
    titleEn,
    titleVi,
    descriptionEn,
    descriptionVi,
    imageUrl,
  } = req.body;
  if (!destinationId) {
    return res.status(400).json({error: 'destinationId is required'});
  }
  const highlight = await prisma.highlight.create({
    data: {
      destinationId,
      titleEn: titleEn ?? '',
      titleVi: titleVi ?? '',
      descriptionEn: descriptionEn ?? '',
      descriptionVi: descriptionVi ?? '',
      imageUrl: imageUrl ?? null,
    },
  });
  return res.status(201).json(highlight);
}
```

- [ ] **Step 2: Update PUT handler**

Replace the PUT branch in `src/pages/api/admin/highlights/[id].ts`:

```ts
if (req.method === 'PUT') {
  const {titleEn, titleVi, descriptionEn, descriptionVi, imageUrl} = req.body;
  const updateData: Record<string, unknown> = {};
  if (titleEn !== undefined) updateData.titleEn = titleEn;
  if (titleVi !== undefined) updateData.titleVi = titleVi;
  if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
  if (descriptionVi !== undefined) updateData.descriptionVi = descriptionVi;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

  const highlight = await prisma.highlight.update({
    where: {id},
    data: updateData,
  });
  return res.json(highlight);
}
```

- [ ] **Step 3: Type-check**

Run `pnpm tsc --noEmit`. Expect remaining errors only in admin UI + tour highlights consumers.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/highlights/
git commit -m "feat(api): highlight endpoints accept title + description fields"
```

---

## Task 4: Update admin DestinationHighlights form (per-destination editor)

**Files:**

- Modify: `src/components/Admin/DestinationHighlights/DestinationHighlights.form-utils.ts`
- Modify: `src/components/Admin/DestinationHighlights/DestinationHighlights.tsx`

- [ ] **Step 1: Update form-utils schema + submit**

Replace `src/components/Admin/DestinationHighlights/DestinationHighlights.form-utils.ts`:

```ts
import * as yup from 'yup';
import {api} from '@/routes';

export const addHighlightSchema = yup.object({
  titleEn: yup.string().trim().required('English title is required'),
  titleVi: yup.string().trim().required('Vietnamese title is required'),
  descriptionEn: yup.string().trim().default(''),
  descriptionVi: yup.string().trim().default(''),
});

export type AddHighlightFormData = yup.InferType<typeof addHighlightSchema>;

export const addHighlightDefaults: AddHighlightFormData = {
  titleEn: '',
  titleVi: '',
  descriptionEn: '',
  descriptionVi: '',
};

export async function submitAddHighlight(
  data: AddHighlightFormData,
  destinationId: string,
): Promise<{error?: string}> {
  const {error} = await api.admin.highlights.create({
    destinationId,
    titleEn: data.titleEn,
    titleVi: data.titleVi,
    descriptionEn: data.descriptionEn,
    descriptionVi: data.descriptionVi,
  });
  if (error) return {error};
  return {};
}
```

- [ ] **Step 2: Update DestinationHighlights component**

In `src/components/Admin/DestinationHighlights/DestinationHighlights.tsx`:

1. Replace local `Highlight` type with:

```ts
type Highlight = {
  id: string;
  titleEn: string;
  titleVi: string;
  descriptionEn: string;
  descriptionVi: string;
  imageUrl: string | null;
};
```

2. Drop the `textField` derivation (no longer needed; we always show both locales side-by-side).

3. Replace the inline-edit block (the `<div className="flex-1 min-w-0 space-y-1">` containing the single `<input>`) with four inputs (titleEn, titleVi, descriptionEn, descriptionVi). Each input mirrors the existing pattern:

```tsx
<div className="flex-1 min-w-0 space-y-1">
  {(
    [
      ['titleEn', 'English title'],
      ['titleVi', 'Vietnamese title'],
      ['descriptionEn', 'English description'],
      ['descriptionVi', 'Vietnamese description'],
    ] as const
  ).map(([field, placeholder]) => (
    <input
      key={field}
      type="text"
      value={h[field]}
      placeholder={placeholder}
      onBlur={(e) => {
        if (e.target.value !== h[field]) {
          handleUpdateField(h.id, field, e.target.value);
        }
      }}
      onChange={(e) => {
        setHighlights((prev) =>
          prev.map((x) =>
            x.id === h.id ? {...x, [field]: e.target.value} : x,
          ),
        );
      }}
      className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
    />
  ))}
  <HighlightRowImage
    highlightId={h.id}
    initialUrl={h.imageUrl}
    onSaved={fetchHighlights}
  />
</div>
```

4. Rename `handleUpdateText` → `handleUpdateField` and widen its signature:

```ts
async function handleUpdateField(
  id: string,
  field: 'titleEn' | 'titleVi' | 'descriptionEn' | 'descriptionVi',
  value: string,
) {
  await api.admin.highlights.update(id, {[field]: value});
  await fetchHighlights();
}
```

5. Update `alt={h.textEn}` → `alt={h.titleEn}` on the `<Image>`.

6. Replace the "Add Highlight" form block with four `<TextInput>` fields (one per form field), each `register('titleEn')` etc., showing `errors.titleEn?.message` etc.

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
  <TextInput {...register('titleEn')} placeholder="English title" error={errors.titleEn?.message} />
  <TextInput {...register('titleVi')} placeholder="Vietnamese title" error={errors.titleVi?.message} />
  <TextInput {...register('descriptionEn')} placeholder="English description" error={errors.descriptionEn?.message} />
  <TextInput {...register('descriptionVi')} placeholder="Vietnamese description" error={errors.descriptionVi?.message} />
</div>
<Button type="submit" loading={isSubmitting} size="sm">Add</Button>
```

7. Drop the `locale` prop usage in `submitAddHighlight` call (signature changed in Step 1):

```ts
const {error} = await submitAddHighlight(data, destinationId);
```

- [ ] **Step 3: Type-check**

Run `pnpm tsc --noEmit`. Expect remaining errors only in `HighlightsTab.tsx` and `TourHighlights.tsx`.

- [ ] **Step 4: Run existing tests**

Run:

```bash
pnpm test --testPathPattern="DestinationHighlights"
```

Expected: pass (or no tests for this file). If a spec exists and fails on text\*, update assertions to titleEn/titleVi.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/DestinationHighlights/
git commit -m "feat(admin): edit highlight title + description per locale"
```

---

## Task 5: Update remaining highlight consumers (admin tour-highlights tab + public tour highlights)

**Files:**

- Modify: `src/components/Admin/tabs/HighlightsTab/HighlightsTab.tsx`
- Modify: `src/components/tour-detail/TourHighlights/TourHighlights.tsx`

- [ ] **Step 1: Update HighlightsTab labels**

In `src/components/Admin/tabs/HighlightsTab/HighlightsTab.tsx`, replace the rendered text rows:

```tsx
<Image
  src={h.imageUrl}
  alt={h.titleEn}
  width={40}
  height={40}
  className="rounded object-cover w-10 h-10"
/>
...
<div className="flex-1 min-w-0">
  <div className="type-body-sm text-on-surface">{h.titleEn}</div>
  <div className="type-label-sm text-on-surface-secondary">{h.titleVi}</div>
</div>
```

(Replace `h.textEn` → `h.titleEn` and `h.textVi` → `h.titleVi`.)

- [ ] **Step 2: Update TourHighlights**

In `src/components/tour-detail/TourHighlights/TourHighlights.tsx`, replace:

```ts
const text = (h: VMT.Highlight) => (localeKey === 'en' ? h.textEn : h.textVi);
```

with:

```ts
const text = (h: VMT.Highlight) => (localeKey === 'en' ? h.titleEn : h.titleVi);
```

(Component still renders title only — descriptions are surfaced on the new destination detail page, not the tour pill chips.)

- [ ] **Step 3: Type-check**

Run `pnpm tsc --noEmit`. Expected: clean.

- [ ] **Step 4: Run all tests**

Run:

```bash
pnpm test
```

Expected: all green. Fix any test referencing `textEn`/`textVi` by replacing with `titleEn`/`titleVi`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/tabs/HighlightsTab/ src/components/tour-detail/TourHighlights/
git commit -m "refactor: read highlight titleEn/titleVi instead of text*"
```

---

## Task 6: Add `routes.destinations.detail` to route registry

**Files:**

- Modify: `src/routes/registry.ts`

- [ ] **Step 1: Add route entry**

In `src/routes/registry.ts`, inside the `routes` object (after `tours`, before `aboutUs`), add:

```ts
  destinations: {
    detail: {path: (p: {slug: string}) => `/destinations/${p.slug}`},
  },
```

- [ ] **Step 2: Type-check**

Run `pnpm tsc --noEmit`. Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/routes/registry.ts
git commit -m "feat(routes): add destinations.detail route"
```

---

## Task 7: Add `getDestinationBySlug` Prisma query

**Files:**

- Modify: `src/data/queries.ts`
- Modify: `src/domain/destination/index.ts` (export new shape if needed)

- [ ] **Step 1: Add domain shape for detail page**

Append to `src/domain/destination/index.ts`:

```ts
import type {Highlight} from '../highlight';
import type {Tour} from '../tour';

export type DestinationDetail = Destination & {
  description: {en: string; vi: string};
  highlights: Highlight[];
  tours: Tour[];
};
```

- [ ] **Step 2: Add query**

Append to `src/data/queries.ts`:

```ts
import type {DestinationDetail} from '@/domain';
import {toHighlight} from '@/domain/highlight/mapper';

export async function getDestinationBySlug(
  slug: string,
  isAdmin = false,
): Promise<DestinationDetail | undefined> {
  try {
    const tourFilter = isAdmin
      ? {}
      : {status: {in: ['PUBLISHED' as const, 'FEATURED' as const]}};
    const row = await prisma.destination.findUnique({
      where: {slug},
      include: {
        highlights: {orderBy: {createdAt: 'asc'}},
        tours: {
          where: tourFilter,
          include: {
            destination: true,
            highlights: true,
            perks: {
              where: {perk: {archived: false}},
              include: {perk: true},
            },
          },
        },
      },
    });
    if (!row || !row.isActive) return undefined;
    return {
      ...toDestination(row),
      description: {en: row.descriptionEn, vi: row.descriptionVi},
      highlights: row.highlights.map(toHighlight),
      tours: row.tours.map(toTour),
    };
  } catch (error) {
    console.error('getDestinationBySlug: DB query failed', error);
    return undefined;
  }
}
```

(`toTour` and `toDestination` are already imported at the top of the file.)

- [ ] **Step 3: Type-check**

Run `pnpm tsc --noEmit`. Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/domain/destination/index.ts src/data/queries.ts
git commit -m "feat(data): add getDestinationBySlug query"
```

---

## Task 8: HighlightCard component (TDD)

**Files:**

- Create: `src/components/destination-detail/HighlightCard/HighlightCard.tsx`
- Create: `src/components/destination-detail/HighlightCard/HighlightCard.spec.tsx`
- Create: `src/components/destination-detail/HighlightCard/index.ts`

- [ ] **Step 1: Write failing test**

Create `src/components/destination-detail/HighlightCard/HighlightCard.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {HighlightCard} from './HighlightCard';

const baseHighlight = {
  id: 'h1',
  destinationId: 'd1',
  titleEn: 'Waterfalls',
  titleVi: 'Thác nước',
  descriptionEn: 'Stunning cascades',
  descriptionVi: 'Thác hùng vĩ',
  imageUrl: '/img/wf.jpg',
};

describe('HighlightCard', () => {
  it('renders English title and description when locale is en', () => {
    render(<HighlightCard highlight={baseHighlight} locale="en" />);
    expect(screen.getByText('Waterfalls')).toBeInTheDocument();
    expect(screen.getByText('Stunning cascades')).toBeInTheDocument();
  });

  it('renders Vietnamese title and description when locale is vi', () => {
    render(<HighlightCard highlight={baseHighlight} locale="vi" />);
    expect(screen.getByText('Thác nước')).toBeInTheDocument();
    expect(screen.getByText('Thác hùng vĩ')).toBeInTheDocument();
  });

  it('renders image with localized title as alt', () => {
    render(<HighlightCard highlight={baseHighlight} locale="en" />);
    expect(screen.getByAltText('Waterfalls')).toBeInTheDocument();
  });

  it('omits image when imageUrl is null', () => {
    render(
      <HighlightCard
        highlight={{...baseHighlight, imageUrl: null}}
        locale="en"
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run:

```bash
pnpm test --testPathPattern="HighlightCard" --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement component**

Create `src/components/destination-detail/HighlightCard/HighlightCard.tsx`:

```tsx
import Image from 'next/image';
import type * as VMT from '@/domain';

type Props = {
  highlight: VMT.Highlight;
  locale: 'en' | 'vi';
};

export function HighlightCard({highlight, locale}: Props) {
  const title = locale === 'en' ? highlight.titleEn : highlight.titleVi;
  const description =
    locale === 'en' ? highlight.descriptionEn : highlight.descriptionVi;

  return (
    <article className="rounded-lg overflow-hidden elevation-1 bg-surface">
      {highlight.imageUrl && (
        <Image
          src={highlight.imageUrl}
          alt={title}
          width={480}
          height={320}
          className="w-full aspect-[3/2] object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="type-title-md text-on-surface mb-2">{title}</h3>
        {description && (
          <p className="type-body-sm text-on-surface-secondary">
            {description}
          </p>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Create barrel export**

Create `src/components/destination-detail/HighlightCard/index.ts`:

```ts
export {HighlightCard} from './HighlightCard';
```

- [ ] **Step 5: Run test, expect pass**

Run `pnpm test --testPathPattern="HighlightCard" --watchAll=false`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/destination-detail/HighlightCard/
git commit -m "feat(components): HighlightCard for destination detail"
```

---

## Task 9: DestinationHighlights section (TDD)

**Files:**

- Create: `src/components/destination-detail/DestinationHighlights/DestinationHighlights.tsx`
- Create: `src/components/destination-detail/DestinationHighlights/DestinationHighlights.spec.tsx`
- Create: `src/components/destination-detail/DestinationHighlights/index.ts`

- [ ] **Step 1: Write failing test**

Create `DestinationHighlights.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DestinationHighlights} from './DestinationHighlights';

const messages = {
  destinationDetail: {
    highlightsTitle: 'Highlights',
    noHighlights: 'No highlights yet',
  },
};

const h = (id: string, titleEn: string) => ({
  id,
  destinationId: 'd1',
  titleEn,
  titleVi: 'vi',
  descriptionEn: 'desc',
  descriptionVi: 'mô tả',
  imageUrl: null,
});

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('DestinationHighlights', () => {
  it('renders one HighlightCard per highlight', () => {
    render(
      wrap(
        <DestinationHighlights
          highlights={[h('1', 'Alpha'), h('2', 'Beta')]}
          locale="en"
        />,
      ),
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders empty state when no highlights', () => {
    render(wrap(<DestinationHighlights highlights={[]} locale="en" />));
    expect(screen.getByText('No highlights yet')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run `pnpm test --testPathPattern="destination-detail/DestinationHighlights"`. Expected: FAIL.

- [ ] **Step 3: Implement component**

Create `DestinationHighlights.tsx`:

```tsx
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {HighlightCard} from '../HighlightCard';

type Props = {
  highlights: VMT.Highlight[];
  locale: 'en' | 'vi';
};

export function DestinationHighlights({highlights, locale}: Props) {
  const t = useTranslations('destinationDetail');

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="type-headline-md text-on-surface mb-6">
        {t('highlightsTitle')}
      </h2>
      {highlights.length === 0 ? (
        <p className="type-body-md text-on-surface-secondary">
          {t('noHighlights')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h) => (
            <HighlightCard key={h.id} highlight={h} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create barrel export**

```ts
// index.ts
export {DestinationHighlights} from './DestinationHighlights';
```

- [ ] **Step 5: Run test, expect pass**

Run test. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/destination-detail/DestinationHighlights/
git commit -m "feat(components): DestinationHighlights section"
```

---

## Task 10: DestinationHero component (TDD)

**Files:**

- Create: `src/components/destination-detail/DestinationHero/{DestinationHero.tsx,DestinationHero.spec.tsx,index.ts}`

- [ ] **Step 1: Write failing test**

Create `DestinationHero.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {DestinationHero} from './DestinationHero';

const dest = {
  id: 'd1',
  slug: 'dalat',
  name: 'Da Lat',
  imageUrl: '/img/dalat.jpg',
  heroImage: '/img/dalat-hero.jpg',
  size: 'large' as const,
  isActive: true,
  description: {en: 'Mountain city', vi: 'Thành phố ngàn hoa'},
};

describe('DestinationHero', () => {
  it('renders the destination name', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByRole('heading', {name: 'Da Lat'})).toBeInTheDocument();
  });

  it('renders English description when locale is en', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByText('Mountain city')).toBeInTheDocument();
  });

  it('renders Vietnamese description when locale is vi', () => {
    render(<DestinationHero destination={dest} locale="vi" />);
    expect(screen.getByText('Thành phố ngàn hoa')).toBeInTheDocument();
  });

  it('renders hero image', () => {
    render(<DestinationHero destination={dest} locale="en" />);
    expect(screen.getByAltText('Da Lat')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run `pnpm test --testPathPattern="DestinationHero"`. Expected: FAIL.

- [ ] **Step 3: Implement component**

```tsx
// DestinationHero.tsx
import Image from 'next/image';
import type * as VMT from '@/domain';

type Props = {
  destination: VMT.DestinationDetail;
  locale: 'en' | 'vi';
};

export function DestinationHero({destination, locale}: Props) {
  const description = destination.description[locale];

  return (
    <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
      <Image
        src={destination.heroImage || destination.imageUrl}
        alt={destination.name}
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-4 pb-12">
          <h1 className="type-display-md text-white mb-4">
            {destination.name}
          </h1>
          {description && (
            <p className="type-body-lg text-white/90 max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Barrel export**

```ts
// index.ts
export {DestinationHero} from './DestinationHero';
```

- [ ] **Step 5: Run test, expect pass**

Run test. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/destination-detail/DestinationHero/
git commit -m "feat(components): DestinationHero section"
```

---

## Task 11: DestinationTours section (TDD)

**Files:**

- Create: `src/components/destination-detail/DestinationTours/{DestinationTours.tsx,DestinationTours.spec.tsx,index.ts}`

- [ ] **Step 1: Inspect existing TourCard prop shape**

Run:

```bash
grep -n "type Props\|export const TourCard\|export function TourCard" src/components/TourCard/TourCard.tsx
```

Use the discovered prop shape (likely `tour: VMT.Tour`) in the next steps.

- [ ] **Step 2: Write failing test**

Create `DestinationTours.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DestinationTours} from './DestinationTours';

jest.mock('@/components/TourCard', () => ({
  TourCard: ({tour}: {tour: {id: string; title: {en: string; vi: string}}}) => (
    <div data-testid="tour-card">{tour.title.en}</div>
  ),
}));

const messages = {
  destinationDetail: {
    toursTitle: 'Tours',
    noTours: 'No tours yet',
  },
};

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const tour = (id: string, en: string) => ({id, title: {en, vi: en}}) as never;

describe('DestinationTours', () => {
  it('renders a TourCard per tour', () => {
    render(wrap(<DestinationTours tours={[tour('1', 'A'), tour('2', 'B')]} />));
    expect(screen.getAllByTestId('tour-card')).toHaveLength(2);
  });

  it('renders empty state when no tours', () => {
    render(wrap(<DestinationTours tours={[]} />));
    expect(screen.getByText('No tours yet')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test, expect failure**

Run `pnpm test --testPathPattern="DestinationTours"`. Expected: FAIL.

- [ ] **Step 4: Implement component**

```tsx
// DestinationTours.tsx
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {TourCard} from '@/components/TourCard';

type Props = {
  tours: VMT.Tour[];
};

export function DestinationTours({tours}: Props) {
  const t = useTranslations('destinationDetail');

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="type-headline-md text-on-surface mb-6">
        {t('toursTitle')}
      </h2>
      {tours.length === 0 ? (
        <p className="type-body-md text-on-surface-secondary">{t('noTours')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </section>
  );
}
```

If the existing `TourCard` import path or prop name differs (verify in Step 1), adjust the import / prop here.

- [ ] **Step 5: Barrel export**

```ts
// index.ts
export {DestinationTours} from './DestinationTours';
```

- [ ] **Step 6: Run test, expect pass**

Run test. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/destination-detail/DestinationTours/
git commit -m "feat(components): DestinationTours section"
```

---

## Task 12: DestinationCTA component (TDD)

**Files:**

- Create: `src/components/destination-detail/DestinationCTA/{DestinationCTA.tsx,DestinationCTA.spec.tsx,index.ts}`

- [ ] **Step 1: Write failing test**

Create `DestinationCTA.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DestinationCTA} from './DestinationCTA';

const messages = {
  destinationDetail: {
    cta: {title: 'Plan your trip', button: 'Contact us'},
  },
};

describe('DestinationCTA', () => {
  it('renders title and contact link', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DestinationCTA />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Plan your trip')).toBeInTheDocument();
    const link = screen.getByRole('link', {name: 'Contact us'});
    expect(link).toHaveAttribute('href', '/contact');
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run test. Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// DestinationCTA.tsx
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {routes} from '@/routes';

export function DestinationCTA() {
  const t = useTranslations('destinationDetail.cta');

  return (
    <section className="container mx-auto px-4 py-16 text-center">
      <h2 className="type-headline-md text-on-surface mb-6">{t('title')}</h2>
      <Link
        href={routes.contact.path()}
        className="inline-block bg-primary text-white type-label-lg px-8 py-3 rounded-full cursor-pointer hover:bg-primary-light transition-colors"
      >
        {t('button')}
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Barrel**

```ts
export {DestinationCTA} from './DestinationCTA';
```

- [ ] **Step 5: Run test, expect pass**

PASS expected.

- [ ] **Step 6: Commit**

```bash
git add src/components/destination-detail/DestinationCTA/
git commit -m "feat(components): DestinationCTA section"
```

---

## Task 13: Add i18n keys

**Files:**

- Modify: `src/messages/vi.json`
- Modify: `src/messages/en.json`

> **Note:** memory says "DB-only translations, no JSON fallback". The JSON files still exist for the Translation table seed/admin workflow — adding the keys here ensures the new namespace is picked up by the Translation admin UI on next sync. If the project no longer maintains these JSON files, skip the JSON edits and instead seed the keys directly via the admin Translations page (`routes.admin.translations`) before merging.

- [ ] **Step 1: Add keys to en.json**

Add a new top-level namespace block to `src/messages/en.json`:

```json
"destinationDetail": {
  "highlightsTitle": "Highlights",
  "noHighlights": "No highlights yet",
  "toursTitle": "Tours in this destination",
  "noTours": "No tours available yet",
  "cta": {
    "title": "Ready to explore?",
    "button": "Contact us"
  }
}
```

- [ ] **Step 2: Add keys to vi.json**

Add the same block to `src/messages/vi.json` with Vietnamese values:

```json
"destinationDetail": {
  "highlightsTitle": "Điểm nổi bật",
  "noHighlights": "Chưa có điểm nổi bật",
  "toursTitle": "Tour tại điểm đến này",
  "noTours": "Chưa có tour nào",
  "cta": {
    "title": "Sẵn sàng khám phá?",
    "button": "Liên hệ"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/vi.json
git commit -m "feat(i18n): add destinationDetail namespace"
```

---

## Task 14: Build the page (`/destinations/[slug]`)

**Files:**

- Create: `src/pages/destinations/[slug].tsx`

- [ ] **Step 1: Write the page**

Create `src/pages/destinations/[slug].tsx`:

```tsx
import Head from 'next/head';
import {useRouter} from 'next/router';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import type * as VMT from '@/domain';
import {DestinationHero} from '@/components/destination-detail/DestinationHero';
import {DestinationHighlights} from '@/components/destination-detail/DestinationHighlights';
import {DestinationTours} from '@/components/destination-detail/DestinationTours';
import {DestinationCTA} from '@/components/destination-detail/DestinationCTA';

type Props = {
  destination: VMT.DestinationDetail;
};

export default function DestinationDetailPage({destination}: Props) {
  const router = useRouter();
  const locale = (router.locale ?? 'vi') as 'en' | 'vi';
  const tMeta = useTranslations('meta');

  const metaDescription = destination.description[locale].slice(0, 160);

  return (
    <>
      <Head>
        <title>{`${destination.name} — ${tMeta('siteName')}`}</title>
        <meta name="description" content={metaDescription} />
      </Head>
      <DestinationHero destination={destination} locale={locale} />
      <DestinationHighlights
        highlights={destination.highlights}
        locale={locale}
      />
      <DestinationTours tours={destination.tours} />
      <DestinationCTA />
    </>
  );
}

export async function getServerSideProps({
  req,
  res,
  params,
  locale,
}: GetServerSidePropsContext) {
  const slug = params?.slug;
  if (typeof slug !== 'string') return {notFound: true};

  const {getDestinationBySlug, getMessagesFromDb} =
    await import('@/data/queries');
  const session = await getServerSession(req, res, authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const [destination, messages] = await Promise.all([
    getDestinationBySlug(slug, isAdmin),
    getMessagesFromDb(locale ?? 'vi'),
  ]);

  if (!destination) return {notFound: true};

  return {props: {destination, messages}};
}
```

- [ ] **Step 2: Verify `meta.siteName` exists**

Run:

```bash
grep -n '"siteName"' src/messages/en.json src/messages/vi.json
```

If the key is missing, add `"siteName": "Vietnam Moto Tours"` (en) and the Vietnamese equivalent under `"meta"`. If a different existing meta key suits the page title (e.g., `pageTitle`), use it instead.

- [ ] **Step 3: Type-check + build**

Run:

```bash
pnpm tsc --noEmit
pnpm build
```

Expected: clean.

- [ ] **Step 4: Manual smoke test**

Run `pnpm dev`. Open `http://localhost:3000/destinations/<some-real-slug>` (find a slug via `pnpm prisma studio` or query `Destination.slug`). Verify hero, highlights grid, tours grid, CTA all render in both `/en/destinations/<slug>` and `/vi/destinations/<slug>`. Verify a bogus slug returns 404.

- [ ] **Step 5: Commit**

```bash
git add src/pages/destinations/
git commit -m "feat(pages): destination detail page at /destinations/[slug]"
```

---

## Task 15: Repoint `DestinationCard` to detail page

**Files:**

- Modify: `src/components/DestinationCard/DestinationCard.tsx`
- Modify: `src/components/DestinationCard/DestinationCard.spec.tsx`

- [ ] **Step 1: Update spec to assert new href**

Inspect existing test:

```bash
cat src/components/DestinationCard/DestinationCard.spec.tsx
```

Update the test that checks the link `href` to assert `/destinations/<slug>` instead of `/tours?destination=<id>`. Example pattern:

```tsx
expect(screen.getByTestId('destination-card')).toHaveAttribute(
  'href',
  '/destinations/dalat',
);
```

Ensure the test fixture sets `slug: 'dalat'` on the destination object.

- [ ] **Step 2: Run test, expect failure**

Run:

```bash
pnpm test --testPathPattern="DestinationCard" --watchAll=false
```

Expected: FAIL on the href assertion.

- [ ] **Step 3: Update component**

In `src/components/DestinationCard/DestinationCard.tsx`:

1. Destructure `slug` from `destination`:

```ts
const {name, imageUrl, tourCount, slug, hasCar, hasBike} = destination;
```

2. Replace the `<Link href={...}>`:

```tsx
<Link
  href={routes.destinations.detail.path({slug})}
  data-testid="destination-card"
  ...
>
```

3. Drop the now-unused `id` destructure if not referenced elsewhere in the component.

- [ ] **Step 4: Run test, expect pass**

Run the spec. Expected: PASS.

- [ ] **Step 5: Verify `DestinationWithStats` includes `slug`**

`DestinationWithStats` extends `Destination`, which already has `slug` per `toDestination` mapper. Run `pnpm tsc --noEmit` to confirm.

- [ ] **Step 6: Commit**

```bash
git add src/components/DestinationCard/
git commit -m "feat(components): DestinationCard links to /destinations/[slug]"
```

---

## Task 16: Final verification + cleanup

**Files:** none

- [ ] **Step 1: Full type-check**

Run `pnpm tsc --noEmit`. Expected: clean.

- [ ] **Step 2: Full lint**

Run `pnpm lint`. Expected: clean.

- [ ] **Step 3: Full test suite**

Run `pnpm test --watchAll=false`. Expected: all green.

- [ ] **Step 4: Production build**

Run `pnpm build`. Expected: clean (build runs tsc + Next compile).

- [ ] **Step 5: Manual end-to-end smoke**

Run `pnpm dev`. Verify:

- Home page → click destination card → lands on `/destinations/<slug>` (not `/tours?destination=...`).
- Detail page renders hero, highlights, tours, CTA in both locales.
- A direct visit to `/tours?destination=<id>` still filters correctly (filter URL untouched).
- Admin highlights edit page surfaces titleEn/titleVi/descriptionEn/descriptionVi inputs and persists changes.
- Tour detail page still renders highlight chips with the (now-title) text.

- [ ] **Step 6: Final commit if any cleanup**

Only if cleanup needed:

```bash
git add -A
git commit -m "chore: finalize destination detail feature"
```

---

## Task 17: Push branch and open PR to `main`

**Files:** none

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/destination-detail-page
```

- [ ] **Step 2: Open PR**

Run:

```bash
gh pr create --base main --title "feat: destination detail page at /destinations/[slug]" --body "$(cat <<'EOF'
## Summary
- Add public destination detail page at `/destinations/[slug]` with hero, highlights, tours, and CTA sections
- Split `Highlight` model into localized `titleEn/titleVi` + `descriptionEn/descriptionVi` (migration backfills from old `text*` fields)
- Repoint `DestinationCard` from `/tours?destination=<id>` filter URL to the new detail page; the filter URL itself is preserved

## Test plan
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test` all green
- [ ] `pnpm build` clean
- [ ] Manual: home → destination card → `/destinations/<slug>` (both locales)
- [ ] Manual: `/tours?destination=<id>` filter still works
- [ ] Manual: admin highlight editor saves title + description in both locales
- [ ] Manual: tour detail page still renders highlight chips
- [ ] Manual: bogus slug returns 404

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Return PR URL to user**

---

## Self-Review Notes

- Spec coverage: routing (T6, T14, T15), schema (T1, T2, T3), page sections (T8–T12), data flow (T7, T14), i18n (T13), testing (T8–T12, T15), out-of-scope respected (no pagination/filters/ISR).
- Type consistency: `titleEn/titleVi/descriptionEn/descriptionVi` used uniformly across mapper, API, admin form, tour highlights, and detail page; `DestinationDetail` defined in T7 and consumed in T7, T10, T14.
- Tour-status filter (`PUBLISHED`/`FEATURED`) matches existing `getAllTours` in `src/data/queries.ts` (verified during planning).
- `DestinationCard` previously used `id` for the filter URL; new flow needs `slug`, which is already on `Destination` per the existing `toDestination` mapper, so no upstream query change required.
- The admin "DB-only translations" memory rule is acknowledged in T13 with a fallback path if JSON files are deprecated.
