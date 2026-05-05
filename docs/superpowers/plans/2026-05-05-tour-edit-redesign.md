# Tour Edit Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin tour edit page into a tabbed interface with live preview using real public widgets, and migrate highlights from tour-level JSON to destination-level entities.

**Architecture:** Four-tab layout (General / Itinerary / Pricing / Highlights) where Itinerary and Pricing tabs use side-by-side editor + live preview with inline editing via an `EditableContext` consumed by public widgets. Highlights become a Prisma model owned by Destination with many-to-many Tour relation. Each tab saves independently.

**Tech Stack:** Next.js 16 (Pages Router), React 19, TypeScript, Prisma (PostgreSQL), Tailwind CSS 4, Framer Motion, next-intl.

**Important codebase conventions:**

- All user-visible strings must use `next-intl` translation files (`src/messages/{vi,en}.json`) accessed via `useTranslations()`. Static data in `src/utils/index.ts`.
- No inline styles — Tailwind only.
- `cursor-pointer` on all interactive elements.
- Admin uses `useAdminFetch` hook for data fetching, `useAdminLoading` context for loading states.
- Admin auth via `requireAdmin()` middleware in API routes.
- No test framework configured — skip TDD steps, verify via `pnpm build` (TypeScript type checking) and manual testing.

---

### Task 1: Prisma Schema — Add Highlight Model

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Highlight model and update Tour + Destination relations**

In `prisma/schema.prisma`, add the Highlight model after the Destination model, update Tour to replace `highlights Json` with a relation, and add the highlights relation to Destination:

```prisma
model Tour {
  id             String      @id @default(uuid())
  slug           String      @unique
  destinationId  String
  destination    Destination @relation(fields: [destinationId], references: [id])
  title          String
  titleVi        String      @default("")
  titleEn        String      @default("")
  imageUrl       String      @default("")
  rating         String      @default("")
  price          Float       @default(0)
  duration       String      @default("")
  distance       String      @default("")
  descriptionVi  String      @default("")
  descriptionEn  String      @default("")
  transportation String      @default("")
  groupSize      String      @default("")
  hotel          String      @default("")
  guided         String      @default("")
  images         Json        @default("[]")
  itinerary      Json        @default("[]")
  pricingGroups  Json        @default("[]")
  included       Json        @default("[]")
  excluded       Json        @default("[]")
  paymentDetails Json        @default("{}")
  notes          Json        @default("[]")
  mealsInfo      Json        @default("{}")
  status         TourStatus  @default(DRAFT)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  highlights     Highlight[]
}
```

Note: the `highlights Json @default("[]")` line is **removed** and replaced by `highlights Highlight[]` at the end.

Add to Destination model (after `tours Tour[]`):

```prisma
  highlights  Highlight[]
```

Add new model after Destination:

```prisma
model Highlight {
  id            String      @id @default(cuid())
  destinationId String
  destination   Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  textEn        String
  textVi        String
  imageUrl      String?
  createdAt     DateTime    @default(now())
  tours         Tour[]
}
```

- [ ] **Step 2: Create migration with data migration script**

Run:

```bash
pnpm prisma migrate dev --name add-highlight-model --create-only
```

This creates the migration SQL without applying it. Edit the generated migration file to add data migration logic **before** dropping the highlights column:

Add this SQL at the top of the migration file (before any ALTER TABLE):

```sql
-- Data migration: convert existing JSON highlights to Highlight rows
-- and link them to tours via the join table
DO $$
DECLARE
  tour_row RECORD;
  highlight_json JSONB;
  highlight_item JSONB;
  new_highlight_id TEXT;
BEGIN
  FOR tour_row IN SELECT id, "destinationId", highlights FROM "Tour" WHERE highlights IS NOT NULL AND highlights::text != '[]'
  LOOP
    highlight_json := tour_row.highlights::jsonb;
    FOR highlight_item IN SELECT * FROM jsonb_array_elements(highlight_json)
    LOOP
      new_highlight_id := gen_random_uuid()::text;
      INSERT INTO "Highlight" (id, "destinationId", "textEn", "textVi", "createdAt")
      VALUES (
        new_highlight_id,
        tour_row."destinationId",
        COALESCE(highlight_item->>'en', ''),
        COALESCE(highlight_item->>'vi', ''),
        NOW()
      );
      INSERT INTO "_HighlightToTour" ("A", "B")
      VALUES (new_highlight_id, tour_row.id);
    END LOOP;
  END LOOP;
END $$;
```

Then apply:

```bash
pnpm prisma migrate dev
```

Expected: Migration applies successfully, generates updated Prisma client.

- [ ] **Step 3: Generate Prisma client and verify**

Run:

```bash
pnpm prisma generate
```

Expected: Prisma client generated with Highlight model.

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add Highlight model with data migration from JSON"
```

---

### Task 2: Update TypeScript Types

**Files:**

- Modify: `src/types/index.ts`

- [ ] **Step 1: Add Highlight type and update Tour type**

In `src/types/index.ts`, add after the `PricingGroup` interface:

```typescript
export interface Highlight {
  id: string;
  destinationId: string;
  textEn: string;
  textVi: string;
  imageUrl: string | null;
}
```

Update the `Tour` interface — change `highlights` from `LocalizedText[]` to `Highlight[]`:

```typescript
export interface Tour {
  // ... all existing fields ...
  highlights: Highlight[]; // was: LocalizedText[]
  // ... rest of fields ...
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
pnpm build
```

Expected: Build will have type errors in files that reference `tour.highlights` as `LocalizedText[]`. This is expected — we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Highlight type, update Tour.highlights to Highlight[]"
```

---

### Task 3: Update Data Queries

**Files:**

- Modify: `src/data/queries.ts`

- [ ] **Step 1: Update DbTour interface and dbTourToTour converter**

In `src/data/queries.ts`, update the `DbTour` interface — remove `highlights: unknown;` line.

Update `dbTourToTour` function to accept highlights from the included relation. Change the function signature and body:

```typescript
function dbTourToTour(row: DbTour & { highlights?: Array<{ id: string; destinationId: string; textEn: string; textVi: string; imageUrl: string | null }> }, destinationName?: string): Tour {
```

Inside the return object, change:

```typescript
    highlights: (row.highlights ?? []) as Tour['highlights'],
```

to:

```typescript
    highlights: (row.highlights ?? []).map(h => ({
      id: h.id,
      destinationId: h.destinationId,
      textEn: h.textEn,
      textVi: h.textVi,
      imageUrl: h.imageUrl,
    })),
```

- [ ] **Step 2: Update Prisma queries to include highlights**

In `getAllTours`, update the `findMany` call to include highlights:

```typescript
const rows = await prisma.tour.findMany({
  where: isAdmin ? {} : {status: {in: ['PUBLISHED', 'FEATURED']}},
  include: {destination: true, highlights: true},
});
```

In `getTourBySlug`, update the `findFirst` call:

```typescript
const row = await prisma.tour.findFirst({
  where: isAdmin ? {slug} : {slug, status: {in: ['PUBLISHED', 'FEATURED']}},
  include: {destination: true, highlights: true},
});
```

- [ ] **Step 3: Verify build**

Run:

```bash
pnpm build
```

Expected: Queries compile. Some components using `highlight[localeKey]` pattern will still fail — fixed in next tasks.

- [ ] **Step 4: Commit**

```bash
git add src/data/queries.ts
git commit -m "feat: update tour queries to include highlights relation"
```

---

### Task 4: Update TourHighlights Public Widget

**Files:**

- Modify: `src/components/tour-highlights/index.tsx`

- [ ] **Step 1: Update component to use Highlight type with photos**

Replace the full content of `src/components/tour-highlights/index.tsx`:

```typescript
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import Image from 'next/image';
import type {Highlight} from '@/types';

interface TourHighlightsProps {
  highlights: Highlight[];
  locale: string;
}

export function TourHighlights({highlights, locale}: TourHighlightsProps) {
  const t = useTranslations('tourDetail');
  const localeKey = locale as 'en' | 'vi';

  if (highlights.length === 0) return null;

  const text = (h: Highlight) => (localeKey === 'en' ? h.textEn : h.textVi);

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-4">{t('highlights')}</h2>
      <div className="flex flex-wrap gap-2">
        {highlights.map((highlight, i) => (
          <motion.span
            key={highlight.id}
            initial={{opacity: 0, scale: 0.9}}
            whileInView={{opacity: 1, scale: 1}}
            viewport={{once: true}}
            transition={{duration: 0.3, delay: i * 0.08}}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full type-label-sm"
          >
            {highlight.imageUrl && (
              <Image
                src={highlight.imageUrl}
                alt={text(highlight)}
                width={20}
                height={20}
                className="rounded-full object-cover w-5 h-5"
              />
            )}
            {text(highlight)}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 2: Update tour detail page if needed**

Check `src/pages/tours/[slug].tsx` line 67 — `<TourHighlights highlights={tour.highlights} locale={locale} />`. This already passes the highlights array and locale, so no change needed since the prop type now expects `Highlight[]` and `Tour.highlights` is `Highlight[]`.

- [ ] **Step 3: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS — all highlight references should now use the new type.

- [ ] **Step 4: Commit**

```bash
git add src/components/tour-highlights/index.tsx
git commit -m "feat: update TourHighlights to render Highlight entities with photos"
```

---

### Task 5: Highlights API Endpoints

**Files:**

- Create: `src/pages/api/admin/highlights/index.ts`
- Create: `src/pages/api/admin/highlights/[id].ts`

- [ ] **Step 1: Create highlights list/create endpoint**

Create `src/pages/api/admin/highlights/index.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const destinationId = req.query.destinationId as string | undefined;
    const where = destinationId ? {destinationId} : {};
    const highlights = await prisma.highlight.findMany({
      where,
      orderBy: {createdAt: 'desc'},
    });
    return res.json(highlights);
  }

  if (req.method === 'POST') {
    const {destinationId, textEn, textVi, imageUrl} = req.body;
    if (!destinationId || !textEn) {
      return res
        .status(400)
        .json({error: 'destinationId and textEn are required'});
    }
    const highlight = await prisma.highlight.create({
      data: {
        destinationId,
        textEn: textEn ?? '',
        textVi: textVi ?? '',
        imageUrl: imageUrl ?? null,
      },
    });
    return res.status(201).json(highlight);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Create single highlight endpoint**

Create `src/pages/api/admin/highlights/[id].ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'PUT') {
    const {textEn, textVi, imageUrl} = req.body;
    const updateData: Record<string, unknown> = {};
    if (textEn !== undefined) updateData.textEn = textEn;
    if (textVi !== undefined) updateData.textVi = textVi;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const highlight = await prisma.highlight.update({
      where: {id},
      data: updateData,
    });
    return res.json(highlight);
  }

  if (req.method === 'DELETE') {
    await prisma.highlight.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 3: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/highlights/
git commit -m "feat: add admin CRUD API for highlights"
```

---

### Task 6: Update Tour API to Handle Highlights Relation

**Files:**

- Modify: `src/pages/api/admin/tours/index.ts`
- Modify: `src/pages/api/admin/tours/[id].ts`

- [ ] **Step 1: Update tour list endpoint to include highlights**

In `src/pages/api/admin/tours/index.ts`, update the GET handler's `findMany`:

```typescript
const tours = await prisma.tour.findMany({
  orderBy: {createdAt: 'desc'},
  include: {
    destination: {select: {name: true}},
    highlights: true,
  },
});
```

Update the POST handler — remove `highlights: data.highlights ?? []` from the create data. Add highlight connection if provided:

```typescript
if (req.method === 'POST') {
  const data = req.body;
  const tour = await prisma.tour.create({
    data: {
      slug: data.slug,
      destinationId: data.destinationId,
      title: data.title,
      titleVi: data.titleVi ?? '',
      titleEn: data.titleEn ?? '',
      imageUrl: data.imageUrl ?? '',
      rating: data.rating ?? '',
      price: data.price ?? 0,
      duration: data.duration ?? '',
      distance: data.distance ?? '',
      descriptionVi: data.descriptionVi ?? '',
      descriptionEn: data.descriptionEn ?? '',
      transportation: data.transportation ?? '',
      groupSize: data.groupSize ?? '',
      hotel: data.hotel ?? '',
      guided: data.guided ?? '',
      images: data.images ?? [],
      itinerary: data.itinerary ?? [],
      pricingGroups: data.pricingGroups ?? [],
      included: data.included ?? [],
      excluded: data.excluded ?? [],
      paymentDetails: data.paymentDetails ?? {},
      notes: data.notes ?? [],
      mealsInfo: data.mealsInfo ?? {},
      status: data.status ?? 'DRAFT',
      highlights: data.highlightIds?.length
        ? {connect: data.highlightIds.map((id: string) => ({id}))}
        : undefined,
    },
    include: {highlights: true},
  });
  return res.status(201).json(tour);
}
```

- [ ] **Step 2: Update single tour endpoint**

In `src/pages/api/admin/tours/[id].ts`, update the GET handler:

```typescript
const tour = await prisma.tour.findUnique({
  where: {id},
  include: {highlights: true},
});
```

Remove `'highlights'` from the `fields` whitelist array (line 40 in current file).

Add highlight connection handling in the PUT handler, after the `for` loop that builds `updateData`:

```typescript
// Handle highlights relation separately
if (data.highlightIds !== undefined) {
  updateData.highlights = {
    set: data.highlightIds.map((hId: string) => ({id: hId})),
  };
}
```

- [ ] **Step 3: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/tours/
git commit -m "feat: update tour API to handle highlights as relation"
```

---

### Task 7: EditableContext and LocalePicker

**Files:**

- Create: `src/components/admin/EditableContext.tsx`
- Create: `src/components/admin/LocalePicker.tsx`

- [ ] **Step 1: Create EditableContext**

Create `src/components/admin/EditableContext.tsx`:

```typescript
'use client';

import {createContext, useContext} from 'react';

interface EditableContextValue {
  editable: boolean;
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
}

const EditableContext = createContext<EditableContextValue | null>(null);

export function EditableProvider({
  locale,
  onFieldChange,
  children,
}: {
  locale: 'en' | 'vi';
  onFieldChange: (path: string, value: string | number) => void;
  children: React.ReactNode;
}) {
  return (
    <EditableContext.Provider value={{editable: true, locale, onFieldChange}}>
      {children}
    </EditableContext.Provider>
  );
}

export function useEditable(): EditableContextValue | null {
  return useContext(EditableContext);
}
```

- [ ] **Step 2: Create LocalePicker**

Create `src/components/admin/LocalePicker.tsx`:

```typescript
'use client';

interface LocalePickerProps {
  value: 'en' | 'vi';
  onChange: (locale: 'en' | 'vi') => void;
}

export function LocalePicker({value, onChange}: LocalePickerProps) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
          value === 'en'
            ? 'bg-primary text-on-primary'
            : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange('vi')}
        className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
          value === 'vi'
            ? 'bg-primary text-on-primary'
            : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
        }`}
      >
        VI
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/EditableContext.tsx src/components/admin/LocalePicker.tsx
git commit -m "feat: add EditableContext and LocalePicker for admin preview"
```

---

### Task 8: Make TourItinerary Editable

**Files:**

- Modify: `src/components/tour-itinerary/index.tsx`

- [ ] **Step 1: Add editable support via EditableContext**

Replace the full content of `src/components/tour-itinerary/index.tsx`:

```typescript
import {motion, useScroll, useTransform} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useRef, useCallback} from 'react';
import type {ItineraryDay} from '@/types';
import {slideFromLeft, slideFromRight} from '@/utils/motion-variants';
import {useEditable} from '@/components/admin/EditableContext';

interface TourItineraryProps {
  itinerary: ItineraryDay[];
  locale: string;
}

function EditableText({
  value,
  path,
  className,
  tag: Tag = 'span',
}: {
  value: string;
  path: string;
  className?: string;
  tag?: 'span' | 'p' | 'h3' | 'div';
}) {
  const ctx = useEditable();
  if (!ctx || !ctx.editable) {
    return <Tag className={className}>{value}</Tag>;
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newValue = e.currentTarget.textContent ?? '';
    if (newValue !== value) {
      ctx.onFieldChange(path, newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className ?? ''} outline-none border border-dashed border-transparent hover:border-primary/40 focus:border-primary rounded px-0.5 cursor-text`}
    >
      {value}
    </Tag>
  );
}

export function TourItinerary({itinerary, locale}: TourItineraryProps) {
  const t = useTranslations('tourDetail');
  const ctx = useEditable();
  const localeKey = ctx?.locale ?? (locale as 'en' | 'vi');
  const containerRef = useRef<HTMLDivElement>(null);

  const {scrollYProgress} = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const endpointOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  const roadPath =
    'M20 0 C20 50,35 80,25 130 C15 180,30 210,20 260 C10 310,35 340,25 390 C15 440,30 470,20 520 C10 570,35 600,25 650 C15 700,20 750,20 800';

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
    >
      <h2 className="type-headline-sm text-on-surface mb-6">
        {t('itinerary')}
      </h2>
      <div ref={containerRef} className="relative">
        {/* Road path SVG */}
        <div className="absolute left-5 top-0 bottom-0 w-10 hidden md:block">
          <svg
            viewBox="0 0 40 800"
            preserveAspectRatio="none"
            className="w-full h-full"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <motion.path
              d={roadPath}
              className="text-primary/20 stroke-current"
              strokeDasharray="8 4"
            />
            <motion.path
              d={roadPath}
              className="text-primary stroke-current"
              style={{pathLength: scrollYProgress}}
            />
          </svg>
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary"
            style={{opacity: endpointOpacity}}
          />
        </div>

        {/* Day cards */}
        <div className="space-y-8 md:pl-20">
          {itinerary.map((day, dayIndex) => (
            <div key={dayIndex}>
              {itinerary.length > 1 && (
                <EditableText
                  tag="h3"
                  value={day.dayLabel[localeKey]}
                  path={`itinerary.${dayIndex}.dayLabel.${localeKey}`}
                  className="type-title-lg text-on-surface mb-4"
                />
              )}
              {day.items.map((item, itemIndex) => (
                <motion.div
                  key={itemIndex}
                  variants={
                    itemIndex % 2 === 0 ? slideFromLeft : slideFromRight
                  }
                  initial="hidden"
                  whileInView="visible"
                  viewport={{once: true}}
                  className="relative p-4 rounded-lg elevation-1 bg-surface-elevated texture-grain-warm mb-4 last:mb-0"
                >
                  <div className="relative z-10">
                    <EditableText
                      tag="div"
                      value={item.time}
                      path={`itinerary.${dayIndex}.items.${itemIndex}.time`}
                      className="type-label-lg text-primary font-semibold mb-1"
                    />
                    <EditableText
                      tag="p"
                      value={item.description[localeKey]}
                      path={`itinerary.${dayIndex}.items.${itemIndex}.description.${localeKey}`}
                      className="type-body-sm text-on-surface-secondary leading-relaxed"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS — the component uses `useEditable()` which returns null on the public site (no provider), falling back to regular rendering.

- [ ] **Step 3: Commit**

```bash
git add src/components/tour-itinerary/index.tsx
git commit -m "feat: add inline editing support to TourItinerary via EditableContext"
```

---

### Task 9: Make TourPricing Editable

**Files:**

- Modify: `src/components/tour-pricing/index.tsx`
- Modify: `src/components/tour-pricing/vehicle-pricing.tsx`
- Modify: `src/components/tour-pricing/group-size-pricing.tsx`

- [ ] **Step 1: Add EditableText helper and update VehiclePricing**

Replace `src/components/tour-pricing/vehicle-pricing.tsx`:

```typescript
import {useTranslations} from 'next-intl';
import type {PricingGroup} from '@/types';
import {useEditable} from '@/components/admin/EditableContext';

interface VehiclePricingProps {
  groups: PricingGroup[];
  locale: 'en' | 'vi';
  selectedIndex: {groupIdx: number; tierIdx: number};
  onSelect: (groupIdx: number, tierIdx: number) => void;
  pathPrefix?: string;
}

function EditableInline({
  value,
  path,
  className,
  type = 'text',
}: {
  value: string | number;
  path: string;
  className?: string;
  type?: 'text' | 'number';
}) {
  const ctx = useEditable();
  if (!ctx || !ctx.editable) {
    return <span className={className}>{type === 'number' ? `$${value}` : value}</span>;
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const raw = e.currentTarget.textContent ?? '';
    const newValue = type === 'number' ? Number(raw.replace(/[^0-9.]/g, '')) : raw;
    if (newValue !== value) {
      ctx.onFieldChange(path, newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const display = type === 'number' ? String(value) : String(value);

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className ?? ''} outline-none border border-dashed border-transparent hover:border-primary/40 focus:border-primary rounded px-0.5 cursor-text`}
    >
      {display}
    </span>
  );
}

export function VehiclePricing({
  groups,
  locale,
  selectedIndex,
  onSelect,
  pathPrefix = '',
}: VehiclePricingProps) {
  const t = useTranslations('tourDetail');
  const ctx = useEditable();
  const activeLocale = ctx?.locale ?? locale;

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, gIdx) => (
        <div key={gIdx}>
          <div className="flex items-center gap-2 mb-3">
            {group.icon && (
              <i className={`fas fa-${group.icon} text-primary`} />
            )}
            <h4 className="type-title-sm text-on-surface font-semibold">
              <EditableInline
                value={group.label[activeLocale]}
                path={`${pathPrefix}${gIdx}.label.${activeLocale}`}
              />
            </h4>
          </div>
          <div
            role="radiogroup"
            aria-label={group.label[activeLocale]}
            className="flex flex-col rounded-lg border border-border-subtle overflow-hidden"
          >
            {group.tiers.map((tier, tIdx) => {
              const isSelected =
                selectedIndex.groupIdx === gIdx &&
                selectedIndex.tierIdx === tIdx;
              return (
                <button
                  key={tIdx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelect(gIdx, tIdx)}
                  className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-border-subtle last:border-b-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : 'hover:bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-primary'
                        : 'border-on-surface-secondary'
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <EditableInline
                        value={tier.label[activeLocale]}
                        path={`${pathPrefix}${gIdx}.tiers.${tIdx}.label.${activeLocale}`}
                        className="type-body-sm text-on-surface font-medium"
                      />
                      <span className="type-title-sm text-on-surface font-semibold ml-2 shrink-0">
                        <EditableInline
                          value={tier.price}
                          path={`${pathPrefix}${gIdx}.tiers.${tIdx}.price`}
                          type="number"
                        />
                        <span className="type-label-sm text-on-surface-secondary font-normal">
                          {t('pricingPerPerson')}
                        </span>
                      </span>
                    </div>
                    {tier.description && (
                      <p className="type-label-sm text-on-surface-secondary mt-0.5">
                        <EditableInline
                          value={tier.description[activeLocale]}
                          path={`${pathPrefix}${gIdx}.tiers.${tIdx}.description.${activeLocale}`}
                        />
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update GroupSizePricing**

In `src/components/tour-pricing/group-size-pricing.tsx`, add the editable context import and use it for the children label. Add at the top:

```typescript
import {useEditable} from '@/components/admin/EditableContext';
```

Inside the component, add after the `t` declaration:

```typescript
const ctx = useEditable();
const activeLocale = ctx?.locale ?? locale;
```

Replace `locale` with `activeLocale` in the childrenGroup label render (line 129):

Change `{childrenGroup.label[locale]}` to `{childrenGroup.label[activeLocale]}`.

- [ ] **Step 3: Update TourPricing main component**

In `src/components/tour-pricing/index.tsx`, add the context import:

```typescript
import {useEditable} from '@/components/admin/EditableContext';
```

Inside the component, after the `localeKey` declaration:

```typescript
const ctx = useEditable();
const activeLocale = ctx?.locale ?? localeKey;
```

Replace all instances of `localeKey` with `activeLocale` in the component body (there are 2 instances: the `onPriceChange` callback and the initial mount effect).

- [ ] **Step 4: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/tour-pricing/
git commit -m "feat: add inline editing support to TourPricing widgets"
```

---

### Task 10: General Tab Component

**Files:**

- Create: `src/components/admin/tabs/GeneralTab.tsx`

- [ ] **Step 1: Create GeneralTab**

This extracts the current TourForm fields (minus highlights, itinerary, pricingGroups) into its own tab component. Create `src/components/admin/tabs/GeneralTab.tsx`:

```typescript
'use client';

import {useState} from 'react';
import {ImageUploadField} from '@/components/admin/ImageUploadField';
import {StatusPicker} from '@/components/admin/StatusPicker';
import type {TourStatus, LocalizedText} from '@/types';

export interface GeneralTabData {
  slug: string;
  destinationId: string;
  title: string;
  titleVi: string;
  titleEn: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  descriptionVi: string;
  descriptionEn: string;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  images: string[];
  included: LocalizedText[];
  excluded: LocalizedText[];
  paymentDetails: LocalizedText;
  notes: LocalizedText[];
  mealsInfo: LocalizedText;
  status: TourStatus;
}

interface GeneralTabProps {
  initialData: GeneralTabData;
  destinations: Array<{id: string; name: string}>;
  tourId: string | null;
  onDestinationChange?: (destinationId: string) => void;
  onSave: (data: GeneralTabData) => Promise<void>;
}

export function GeneralTab({
  initialData,
  destinations,
  tourId,
  onDestinationChange,
  onSave,
}: GeneralTabProps) {
  const [form, setForm] = useState<GeneralTabData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedForm, setSavedForm] = useState<GeneralTabData>(initialData);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  function updateField<K extends keyof GeneralTabData>(
    key: K,
    value: GeneralTabData[K],
  ) {
    setForm((prev) => {
      const next = {...prev, [key]: value};
      if (key === 'destinationId') {
        onDestinationChange?.(value as string);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      setSavedForm(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="type-title-lg text-on-surface">General Info</h2>
        <StatusPicker
          value={form.status}
          onChange={(status) => updateField('status', status)}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {error}
        </div>
      )}

      {/* Basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Slug
          </label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Destination
          </label>
          <select
            required
            value={form.destinationId}
            onChange={(e) => updateField('destinationId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="">Select...</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          Title
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        />
      </div>

      {/* Localized descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (EN)
          </label>
          <textarea
            rows={4}
            value={form.descriptionEn}
            onChange={(e) => updateField('descriptionEn', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (VI)
          </label>
          <textarea
            rows={4}
            value={form.descriptionVi}
            onChange={(e) => updateField('descriptionVi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          />
        </div>
      </div>

      {/* Numeric / short fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {key: 'price' as const, label: 'Price ($)', type: 'number'},
          {key: 'duration' as const, label: 'Duration', type: 'text'},
          {key: 'distance' as const, label: 'Distance', type: 'text'},
          {key: 'rating' as const, label: 'Rating', type: 'text'},
        ].map(({key, label, type}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) =>
                updateField(
                  key,
                  type === 'number'
                    ? (Number(e.target.value) as never)
                    : (e.target.value as never),
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {key: 'transportation' as const, label: 'Transportation'},
          {key: 'groupSize' as const, label: 'Group Size'},
          {key: 'hotel' as const, label: 'Hotel'},
          {key: 'guided' as const, label: 'Guided'},
        ].map(({key, label}) => (
          <div key={key}>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              {label}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Image */}
      <ImageUploadField
        entityType="tour"
        entityId={tourId}
        imageType="card"
        currentUrl={form.imageUrl}
        onUploadComplete={(url) => updateField('imageUrl', url)}
        label="Card Image"
      />

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save General'}
        </button>
      </div>

      {isDirty && (
        <p className="type-label-sm text-amber-500">Unsaved changes</p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/tabs/GeneralTab.tsx
git commit -m "feat: create GeneralTab component for tour editing"
```

---

### Task 11: Itinerary Tab Component

**Files:**

- Create: `src/components/admin/tabs/ItineraryTab.tsx`

- [ ] **Step 1: Create ItineraryTab**

Create `src/components/admin/tabs/ItineraryTab.tsx`:

```typescript
'use client';

import {useState, useCallback} from 'react';
import type {ItineraryDay} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {TourItinerary} from '@/components/tour-itinerary';

interface ItineraryTabProps {
  initialData: ItineraryDay[];
  onSave: (itinerary: ItineraryDay[]) => Promise<void>;
}

function setNestedValue(
  obj: ItineraryDay[],
  path: string,
  value: string | number,
): ItineraryDay[] {
  const clone = JSON.parse(JSON.stringify(obj)) as ItineraryDay[];
  const parts = path.split('.');
  // path: itinerary.0.items.1.description.en
  // skip first part ("itinerary")
  let current: unknown = clone;
  for (let i = 1; i < parts.length - 1; i++) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    current = (current as Record<string, unknown>)[key as string];
  }
  const lastKey = parts[parts.length - 1];
  (current as Record<string, unknown>)[lastKey] = value;
  return clone;
}

export function ItineraryTab({initialData, onSave}: ItineraryTabProps) {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(initialData);
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedData, setSavedData] = useState<ItineraryDay[]>(initialData);

  const isDirty = JSON.stringify(itinerary) !== JSON.stringify(savedData);

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      setItinerary((prev) => setNestedValue(prev, path, value));
    },
    [],
  );

  function addDay() {
    setItinerary((prev) => [
      ...prev,
      {dayLabel: {en: `Day ${prev.length + 1}`, vi: `Ngày ${prev.length + 1}`}, items: []},
    ]);
  }

  function removeDay(index: number) {
    setItinerary((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem(dayIndex: number) {
    setItinerary((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as ItineraryDay[];
      clone[dayIndex].items.push({
        time: '00:00',
        description: {en: 'New activity', vi: 'Hoạt động mới'},
      });
      return clone;
    });
  }

  function removeItem(dayIndex: number, itemIndex: number) {
    setItinerary((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as ItineraryDay[];
      clone[dayIndex].items.splice(itemIndex, 1);
      return clone;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(itinerary);
      setSavedData(itinerary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-0 min-h-[600px]">
      {/* Left panel: structural controls */}
      <div className="w-72 shrink-0 border-r border-border p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="type-title-sm text-on-surface font-semibold">Days</span>
          <button
            type="button"
            onClick={addDay}
            className="type-label-sm text-primary hover:text-primary-light cursor-pointer"
          >
            + Add Day
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {itinerary.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="bg-surface-elevated rounded-lg p-3 border border-border"
            >
              <div className="type-body-sm text-on-surface font-medium">
                {day.dayLabel[locale]}
              </div>
              <div className="type-label-sm text-on-surface-secondary mt-1">
                {day.items.length} item{day.items.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => addItem(dayIndex)}
                  className="type-label-sm text-primary hover:text-primary-light cursor-pointer"
                >
                  + Add Item
                </button>
                {day.items.map((_, itemIndex) => (
                  <button
                    key={itemIndex}
                    type="button"
                    onClick={() => removeItem(dayIndex, itemIndex)}
                    className="type-label-sm text-red-400 hover:text-red-300 cursor-pointer"
                    title={`Remove item ${itemIndex + 1}`}
                  >
                    ×{itemIndex + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeDay(dayIndex)}
                className="type-label-sm text-red-400 hover:text-red-300 mt-2 cursor-pointer"
              >
                Delete Day
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="type-label-sm text-red-400 mt-2">{error}</p>
        )}

        {isDirty && (
          <p className="type-label-sm text-amber-500 mt-2">Unsaved changes</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="mt-4 bg-primary hover:bg-primary-light text-on-primary px-4 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Itinerary'}
        </button>
      </div>

      {/* Right panel: live preview */}
      <div className="flex-1 p-5 bg-surface-alt/30 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="type-label-sm text-on-surface-secondary">
            Click any text to edit inline
          </span>
          <LocalePicker value={locale} onChange={setLocale} />
        </div>

        <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
          <TourItinerary itinerary={itinerary} locale={locale} />
        </EditableProvider>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/tabs/ItineraryTab.tsx
git commit -m "feat: create ItineraryTab with side-by-side editor and live preview"
```

---

### Task 12: Pricing Tab Component

**Files:**

- Create: `src/components/admin/tabs/PricingTab.tsx`

- [ ] **Step 1: Create PricingTab**

Create `src/components/admin/tabs/PricingTab.tsx`:

```typescript
'use client';

import {useState, useCallback} from 'react';
import type {PricingGroup} from '@/types';
import {EditableProvider} from '@/components/admin/EditableContext';
import {LocalePicker} from '@/components/admin/LocalePicker';
import {TourPricing} from '@/components/tour-pricing';

interface PricingTabProps {
  initialData: PricingGroup[];
  onSave: (pricingGroups: PricingGroup[]) => Promise<void>;
}

function setNestedValue(
  obj: PricingGroup[],
  path: string,
  value: string | number,
): PricingGroup[] {
  const clone = JSON.parse(JSON.stringify(obj)) as PricingGroup[];
  const parts = path.split('.');
  let current: unknown = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    current = (current as Record<string, unknown>)[key as string];
  }
  const lastKey = parts[parts.length - 1];
  (current as Record<string, unknown>)[lastKey] = value;
  return clone;
}

export function PricingTab({initialData, onSave}: PricingTabProps) {
  const [pricingGroups, setPricingGroups] = useState<PricingGroup[]>(initialData);
  const [locale, setLocale] = useState<'en' | 'vi'>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedData, setSavedData] = useState<PricingGroup[]>(initialData);

  const isDirty = JSON.stringify(pricingGroups) !== JSON.stringify(savedData);

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      setPricingGroups((prev) => setNestedValue(prev, path, value));
    },
    [],
  );

  function addGroup() {
    setPricingGroups((prev) => [
      ...prev,
      {
        type: 'vehicle' as const,
        label: {en: 'New Group', vi: 'Nhóm mới'},
        tiers: [],
      },
    ]);
  }

  function removeGroup(index: number) {
    setPricingGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGroupType(index: number, type: 'vehicle' | 'group-size') {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[index].type = type;
      return clone;
    });
  }

  function updateGroupIcon(index: number, icon: string) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[index].icon = icon;
      return clone;
    });
  }

  function addTier(groupIndex: number) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[groupIndex].tiers.push({
        label: {en: 'New Tier', vi: 'Mức mới'},
        price: 0,
        minGroupSize: clone[groupIndex].type === 'group-size' ? 2 : undefined,
        maxGroupSize: clone[groupIndex].type === 'group-size' ? 4 : undefined,
      });
      return clone;
    });
  }

  function removeTier(groupIndex: number, tierIndex: number) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      clone[groupIndex].tiers.splice(tierIndex, 1);
      return clone;
    });
  }

  function updateTierField(
    groupIndex: number,
    tierIndex: number,
    field: string,
    value: string | number,
  ) {
    setPricingGroups((prev) => {
      const clone = JSON.parse(JSON.stringify(prev)) as PricingGroup[];
      (clone[groupIndex].tiers[tierIndex] as Record<string, unknown>)[field] = value;
      return clone;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(pricingGroups);
      setSavedData(pricingGroups);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-0 min-h-[600px]">
      {/* Left panel */}
      <div className="w-80 shrink-0 border-r border-border p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="type-title-sm text-on-surface font-semibold">Pricing Groups</span>
          <button
            type="button"
            onClick={addGroup}
            className="type-label-sm text-primary hover:text-primary-light cursor-pointer"
          >
            + Add Group
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {pricingGroups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="bg-surface-elevated rounded-lg p-3 border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={group.type}
                  onChange={(e) =>
                    updateGroupType(gIdx, e.target.value as 'vehicle' | 'group-size')
                  }
                  className="px-2 py-1 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="group-size">Group Size</option>
                </select>
                <input
                  type="text"
                  placeholder="Icon"
                  value={group.icon ?? ''}
                  onChange={(e) => updateGroupIcon(gIdx, e.target.value)}
                  className="w-20 px-2 py-1 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(gIdx)}
                  className="type-label-sm text-red-400 hover:text-red-300 ml-auto cursor-pointer"
                >
                  Delete
                </button>
              </div>

              <div className="type-label-sm text-on-surface-secondary mb-2">
                {group.label[locale]} — {group.tiers.length} tier{group.tiers.length !== 1 ? 's' : ''}
              </div>

              {group.tiers.map((tier, tIdx) => (
                <div key={tIdx} className="flex items-center gap-2 mb-1">
                  <span className="type-label-sm text-on-surface-secondary truncate flex-1">
                    {tier.label[locale]}
                  </span>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) =>
                      updateTierField(gIdx, tIdx, 'price', Number(e.target.value))
                    }
                    className="w-16 px-1 py-0.5 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                  />
                  {group.type === 'group-size' && (
                    <>
                      <input
                        type="number"
                        placeholder="min"
                        value={tier.minGroupSize ?? ''}
                        onChange={(e) =>
                          updateTierField(
                            gIdx,
                            tIdx,
                            'minGroupSize',
                            Number(e.target.value),
                          )
                        }
                        className="w-12 px-1 py-0.5 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                      />
                      <input
                        type="number"
                        placeholder="max"
                        value={tier.maxGroupSize ?? ''}
                        onChange={(e) =>
                          updateTierField(
                            gIdx,
                            tIdx,
                            'maxGroupSize',
                            Number(e.target.value),
                          )
                        }
                        className="w-12 px-1 py-0.5 rounded border border-border bg-surface text-on-surface type-label-sm cursor-pointer"
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeTier(gIdx, tIdx)}
                    className="type-label-sm text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addTier(gIdx)}
                className="type-label-sm text-primary hover:text-primary-light mt-1 cursor-pointer"
              >
                + Add Tier
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="type-label-sm text-red-400 mt-2">{error}</p>
        )}

        {isDirty && (
          <p className="type-label-sm text-amber-500 mt-2">Unsaved changes</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="mt-4 bg-primary hover:bg-primary-light text-on-primary px-4 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>

      {/* Right panel: live preview */}
      <div className="flex-1 p-5 bg-surface-alt/30 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="type-label-sm text-on-surface-secondary">
            Click prices or labels to edit inline
          </span>
          <LocalePicker value={locale} onChange={setLocale} />
        </div>

        <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
          <TourPricing
            pricingGroups={pricingGroups}
            locale={locale}
          />
        </EditableProvider>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/tabs/PricingTab.tsx
git commit -m "feat: create PricingTab with side-by-side editor and live preview"
```

---

### Task 13: Highlights Tab Component

**Files:**

- Create: `src/components/admin/tabs/HighlightsTab.tsx`

- [ ] **Step 1: Create HighlightsTab**

Create `src/components/admin/tabs/HighlightsTab.tsx`:

```typescript
'use client';

import {useState, useEffect} from 'react';
import Image from 'next/image';
import type {Highlight} from '@/types';

interface HighlightsTabProps {
  tourId: string | null;
  destinationId: string;
  initialSelectedIds: string[];
  destinations: Array<{id: string; name: string}>;
  onSave: (highlightIds: string[]) => Promise<void>;
}

export function HighlightsTab({
  tourId,
  destinationId,
  initialSelectedIds,
  destinations,
  onSave,
}: HighlightsTabProps) {
  const [allHighlights, setAllHighlights] = useState<Highlight[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );

  const isDirty =
    selectedIds.size !== savedIds.size ||
    [...selectedIds].some((id) => !savedIds.has(id));

  useEffect(() => {
    if (!destinationId) {
      setAllHighlights([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/highlights?destinationId=${destinationId}`)
      .then((r) => r.json())
      .then((data: Highlight[]) => {
        setAllHighlights(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load highlights');
        setLoading(false);
      });
  }, [destinationId]);

  function toggleHighlight(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave([...selectedIds]);
      setSavedIds(new Set(selectedIds));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const destName =
    destinations.find((d) => d.id === destinationId)?.name ?? 'None selected';

  return (
    <div className="max-w-3xl p-5">
      <h2 className="type-title-lg text-on-surface mb-4">Tour Highlights</h2>

      <div className="mb-4">
        <span className="type-label-sm text-on-surface-secondary">
          Destination:{' '}
        </span>
        <span className="type-body-sm text-on-surface font-medium">
          {destName}
        </span>
        <p className="type-label-sm text-on-surface-secondary mt-1">
          Change destination in the General tab. Manage highlights in the
          destination edit page.
        </p>
      </div>

      {!tourId && (
        <p className="type-body-sm text-amber-500">
          Save the General tab first to enable highlight selection.
        </p>
      )}

      {loading && <p className="type-body-sm text-on-surface-secondary">Loading highlights...</p>}

      {!loading && allHighlights.length === 0 && destinationId && (
        <p className="type-body-sm text-on-surface-secondary">
          No highlights found for this destination. Add them on the destination
          edit page.
        </p>
      )}

      {!loading && allHighlights.length > 0 && (
        <div className="space-y-2 mb-6">
          {allHighlights.map((h) => (
            <label
              key={h.id}
              htmlFor={`hl-${h.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              <input
                id={`hl-${h.id}`}
                type="checkbox"
                checked={selectedIds.has(h.id)}
                onChange={() => toggleHighlight(h.id)}
                disabled={!tourId}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              {h.imageUrl && (
                <Image
                  src={h.imageUrl}
                  alt={h.textEn}
                  width={40}
                  height={40}
                  className="rounded object-cover w-10 h-10"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="type-body-sm text-on-surface">{h.textEn}</div>
                <div className="type-label-sm text-on-surface-secondary">
                  {h.textVi}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {error && <p className="type-label-sm text-red-400 mb-2">{error}</p>}

      {isDirty && (
        <p className="type-label-sm text-amber-500 mb-2">Unsaved changes</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !isDirty || !tourId}
        className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving ? 'Saving...' : 'Save Highlights'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/tabs/HighlightsTab.tsx
git commit -m "feat: create HighlightsTab with destination highlight picker"
```

---

### Task 14: TourEditTabs Orchestrator

**Files:**

- Create: `src/components/admin/TourEditTabs.tsx`

- [ ] **Step 1: Create TourEditTabs**

Create `src/components/admin/TourEditTabs.tsx`:

```typescript
'use client';

import {useState, useCallback, useEffect} from 'react';
import {useRouter} from 'next/router';
import type {ItineraryDay, PricingGroup, TourStatus, Highlight} from '@/types';
import {GeneralTab} from './tabs/GeneralTab';
import type {GeneralTabData} from './tabs/GeneralTab';
import {ItineraryTab} from './tabs/ItineraryTab';
import {PricingTab} from './tabs/PricingTab';
import {HighlightsTab} from './tabs/HighlightsTab';

type TabId = 'general' | 'itinerary' | 'pricing' | 'highlights';

interface TourEditTabsProps {
  mode: 'create' | 'edit';
  tourId: string | null;
  destinations: Array<{id: string; name: string}>;
  initialGeneral: GeneralTabData;
  initialItinerary: ItineraryDay[];
  initialPricingGroups: PricingGroup[];
  initialHighlightIds: string[];
}

const tabs: {id: TabId; label: string}[] = [
  {id: 'general', label: 'General'},
  {id: 'itinerary', label: 'Itinerary'},
  {id: 'pricing', label: 'Pricing'},
  {id: 'highlights', label: 'Highlights'},
];

export function TourEditTabs({
  mode,
  tourId: initialTourId,
  destinations,
  initialGeneral,
  initialItinerary,
  initialPricingGroups,
  initialHighlightIds,
}: TourEditTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [tourId, setTourId] = useState<string | null>(initialTourId);
  const [destinationId, setDestinationId] = useState(
    initialGeneral.destinationId,
  );

  const handleGeneralSave = useCallback(
    async (data: GeneralTabData) => {
      const url =
        mode === 'create' && !tourId
          ? '/api/admin/tours'
          : `/api/admin/tours/${tourId}`;
      const method = mode === 'create' && !tourId ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }

      const saved = await res.json();
      if (mode === 'create' && !tourId) {
        setTourId(saved.id);
        // Update URL without full reload
        window.history.replaceState(null, '', `/admin/tours/${saved.id}/edit`);
      }
    },
    [mode, tourId],
  );

  const handleItinerarySave = useCallback(
    async (itinerary: ItineraryDay[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({itinerary}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }
    },
    [tourId],
  );

  const handlePricingSave = useCallback(
    async (pricingGroups: PricingGroup[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({pricingGroups}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }
    },
    [tourId],
  );

  const handleHighlightsSave = useCallback(
    async (highlightIds: string[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({highlightIds}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save');
      }
    },
    [tourId],
  );

  const isTabDisabled = (tabId: TabId) =>
    tabId !== 'general' && mode === 'create' && !tourId;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">
          {mode === 'create' ? 'Create New Tour' : 'Edit Tour'}
        </h1>
        <button
          type="button"
          onClick={() => router.push('/admin/tours')}
          className="px-4 py-2 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          Back to Tours
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b-2 border-border mb-0">
        {tabs.map((tab) => {
          const disabled = isTabDisabled(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 type-label-sm transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary -mb-[2px] font-semibold'
                  : disabled
                    ? 'text-on-surface-secondary/40 cursor-not-allowed'
                    : 'text-on-surface-secondary hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="border border-border border-t-0 rounded-b-lg overflow-hidden">
        {activeTab === 'general' && (
          <div className="p-5">
            <GeneralTab
              initialData={initialGeneral}
              destinations={destinations}
              tourId={tourId}
              onDestinationChange={setDestinationId}
              onSave={handleGeneralSave}
            />
          </div>
        )}

        {activeTab === 'itinerary' && (
          <ItineraryTab
            initialData={initialItinerary}
            onSave={handleItinerarySave}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingTab
            initialData={initialPricingGroups}
            onSave={handlePricingSave}
          />
        )}

        {activeTab === 'highlights' && (
          <HighlightsTab
            tourId={tourId}
            destinationId={destinationId}
            initialSelectedIds={initialHighlightIds}
            destinations={destinations}
            onSave={handleHighlightsSave}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/TourEditTabs.tsx
git commit -m "feat: create TourEditTabs orchestrator with four-tab layout"
```

---

### Task 15: Update Admin Pages to Use TourEditTabs

**Files:**

- Modify: `src/pages/admin/tours/[id]/edit.tsx`
- Modify: `src/pages/admin/tours/new.tsx`

- [ ] **Step 1: Update edit page**

Replace the content of `src/pages/admin/tours/[id]/edit.tsx`:

```typescript
import {useEffect} from 'react';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/admin/TourEditTabs';
import type {TourStatus} from '@/types';

interface Destination {
  id: string;
  name: string;
}

export default function EditTour() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  const {
    data: tour,
    loading: tourLoading,
    error: tourError,
  } = useAdminFetch<Record<string, unknown>>(
    id ? `/api/admin/tours/${id}` : null,
  );
  const {data: destinations, loading: destLoading} = useAdminFetch<
    Destination[]
  >('/api/admin/destinations');
  const {setLoading} = useAdminLoading();

  const loading = tourLoading || destLoading;

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (tourError) {
    return (
      <div>
        <h1 className="type-headline-sm mb-6">Tour Not Found</h1>
        <p className="text-on-surface-secondary">
          The tour you are looking for does not exist or could not be loaded.
        </p>
      </div>
    );
  }

  if (!tour || !destinations) {
    return null;
  }

  const highlights = (tour.highlights as Array<{id: string}>) ?? [];

  const initialGeneral = {
    slug: tour.slug as string,
    destinationId: tour.destinationId as string,
    title: tour.title as string,
    titleVi: (tour.titleVi as string) ?? '',
    titleEn: (tour.titleEn as string) ?? '',
    imageUrl: (tour.imageUrl as string) ?? '',
    rating: (tour.rating as string) ?? '',
    price: (tour.price as number) ?? 0,
    duration: (tour.duration as string) ?? '',
    distance: (tour.distance as string) ?? '',
    descriptionVi: (tour.descriptionVi as string) ?? '',
    descriptionEn: (tour.descriptionEn as string) ?? '',
    transportation: (tour.transportation as string) ?? '',
    groupSize: (tour.groupSize as string) ?? '',
    hotel: (tour.hotel as string) ?? '',
    guided: (tour.guided as string) ?? '',
    images: (tour.images as string[]) ?? [],
    included: (tour.included as Array<{en: string; vi: string}>) ?? [],
    excluded: (tour.excluded as Array<{en: string; vi: string}>) ?? [],
    paymentDetails: (tour.paymentDetails as {en: string; vi: string}) ?? {
      en: '',
      vi: '',
    },
    notes: (tour.notes as Array<{en: string; vi: string}>) ?? [],
    mealsInfo: (tour.mealsInfo as {en: string; vi: string}) ?? {en: '', vi: ''},
    status: (tour.status as TourStatus) ?? 'DRAFT',
  };

  return (
    <TourEditTabs
      mode="edit"
      tourId={tour.id as string}
      destinations={destinations}
      initialGeneral={initialGeneral}
      initialItinerary={(tour.itinerary as never) ?? []}
      initialPricingGroups={(tour.pricingGroups as never) ?? []}
      initialHighlightIds={highlights.map((h) => h.id)}
    />
  );
}
```

- [ ] **Step 2: Update new page**

Replace the content of `src/pages/admin/tours/new.tsx`:

```typescript
import {useEffect} from 'react';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/admin/TourEditTabs';
import type {TourStatus} from '@/types';

interface Destination {
  id: string;
  name: string;
}

const emptyGeneral = {
  slug: '',
  destinationId: '',
  title: '',
  titleVi: '',
  titleEn: '',
  imageUrl: '',
  rating: '',
  price: 0,
  duration: '',
  distance: '',
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  groupSize: '',
  hotel: '',
  guided: '',
  images: [] as string[],
  included: [] as Array<{en: string; vi: string}>,
  excluded: [] as Array<{en: string; vi: string}>,
  paymentDetails: {en: '', vi: ''},
  notes: [] as Array<{en: string; vi: string}>,
  mealsInfo: {en: '', vi: ''},
  status: 'DRAFT' as TourStatus,
};

export default function NewTour() {
  const {data: destinations, loading} = useAdminFetch<Destination[]>(
    '/api/admin/destinations',
  );
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (loading || !destinations) return null;

  return (
    <TourEditTabs
      mode="create"
      tourId={null}
      destinations={destinations}
      initialGeneral={emptyGeneral}
      initialItinerary={[]}
      initialPricingGroups={[]}
      initialHighlightIds={[]}
    />
  );
}
```

- [ ] **Step 3: Delete old TourForm**

Delete `src/components/admin/TourForm.tsx` — it's fully replaced by the tab components.

```bash
rm src/components/admin/TourForm.tsx
```

- [ ] **Step 4: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS — no remaining imports of TourForm.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/tours/ src/components/admin/TourForm.tsx
git commit -m "feat: replace TourForm with TourEditTabs in admin pages"
```

---

### Task 16: Destination Highlights Management

**Files:**

- Modify: `src/pages/admin/destinations/[id]/edit.tsx`

- [ ] **Step 1: Read the current DestinationForm**

Read `src/components/admin/DestinationForm.tsx` to understand its structure before adding the highlights section.

- [ ] **Step 2: Add highlights management section to destination edit page**

In `src/pages/admin/destinations/[id]/edit.tsx`, add a highlights management section below the DestinationForm. This requires:

1. Import `useAdminFetch` for loading highlights, `ImageUploadField` for photo upload, and `Image` from next/image.
2. After the `<DestinationForm>` component, add a new section:

```typescript
import {useState, useEffect} from 'react';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {DestinationForm} from '@/components/admin/DestinationForm';
import {DestinationHighlights} from '@/components/admin/DestinationHighlights';

export default function EditDestination() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  const {
    data: destination,
    loading,
    error,
  } = useAdminFetch<Record<string, unknown>>(
    id ? `/api/admin/destinations/${id}` : null,
  );
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  if (error) {
    return (
      <div>
        <h1 className="type-headline-sm mb-6">Destination Not Found</h1>
        <p className="text-on-surface-secondary">
          The destination you are looking for does not exist or could not be
          loaded.
        </p>
      </div>
    );
  }

  if (!destination) {
    return null;
  }

  const initialData = {
    slug: destination.slug as string,
    name: destination.name as string,
    nameVi: (destination.nameVi as string) ?? '',
    nameEn: (destination.nameEn as string) ?? '',
    imageUrl: (destination.imageUrl as string) ?? '',
    heroImage: (destination.heroImage as string) ?? '',
    descriptionVi: (destination.descriptionVi as string) ?? '',
    descriptionEn: (destination.descriptionEn as string) ?? '',
    size: (destination.size as string) ?? 'small',
  };

  return (
    <div>
      <h1 className="type-headline-sm mb-6">Edit Destination</h1>
      <DestinationForm
        initialData={initialData}
        mode="edit"
        destinationId={destination.id as string}
      />

      {id && (
        <div className="mt-10 pt-10 border-t border-border">
          <DestinationHighlights destinationId={id} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create DestinationHighlights component**

Create `src/components/admin/DestinationHighlights.tsx`:

```typescript
'use client';

import {useState, useEffect, useCallback} from 'react';
import Image from 'next/image';
import {ImageUploadField} from './ImageUploadField';

interface Highlight {
  id: string;
  textEn: string;
  textVi: string;
  imageUrl: string | null;
}

interface DestinationHighlightsProps {
  destinationId: string;
}

export function DestinationHighlights({
  destinationId,
}: DestinationHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTextEn, setNewTextEn] = useState('');
  const [newTextVi, setNewTextVi] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchHighlights = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/highlights?destinationId=${destinationId}`,
      );
      const data = await res.json();
      setHighlights(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [destinationId]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  async function handleAdd() {
    if (!newTextEn.trim()) return;
    setAdding(true);
    const res = await fetch('/api/admin/highlights', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        destinationId,
        textEn: newTextEn,
        textVi: newTextVi,
      }),
    });
    if (res.ok) {
      setNewTextEn('');
      setNewTextVi('');
      await fetchHighlights();
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this highlight?')) return;
    await fetch(`/api/admin/highlights/${id}`, {method: 'DELETE'});
    await fetchHighlights();
  }

  async function handleUpdateText(
    id: string,
    field: 'textEn' | 'textVi',
    value: string,
  ) {
    await fetch(`/api/admin/highlights/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({[field]: value}),
    });
    await fetchHighlights();
  }

  async function handleImageUpload(id: string, imageUrl: string) {
    await fetch(`/api/admin/highlights/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({imageUrl}),
    });
    await fetchHighlights();
  }

  if (loading) {
    return <p className="type-body-sm text-on-surface-secondary">Loading highlights...</p>;
  }

  return (
    <div>
      <h2 className="type-title-lg text-on-surface mb-4">
        Destination Highlights
      </h2>

      {/* Existing highlights */}
      <div className="space-y-3 mb-6">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-elevated"
          >
            <div className="w-16 h-16 shrink-0">
              {h.imageUrl ? (
                <Image
                  src={h.imageUrl}
                  alt={h.textEn}
                  width={64}
                  height={64}
                  className="rounded object-cover w-16 h-16"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-surface-alt flex items-center justify-center type-label-sm text-on-surface-secondary">
                  No img
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <input
                type="text"
                value={h.textEn}
                onBlur={(e) => {
                  if (e.target.value !== h.textEn) {
                    handleUpdateText(h.id, 'textEn', e.target.value);
                  }
                }}
                onChange={(e) => {
                  setHighlights((prev) =>
                    prev.map((x) =>
                      x.id === h.id ? {...x, textEn: e.target.value} : x,
                    ),
                  );
                }}
                className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                placeholder="English text"
              />
              <input
                type="text"
                value={h.textVi}
                onBlur={(e) => {
                  if (e.target.value !== h.textVi) {
                    handleUpdateText(h.id, 'textVi', e.target.value);
                  }
                }}
                onChange={(e) => {
                  setHighlights((prev) =>
                    prev.map((x) =>
                      x.id === h.id ? {...x, textVi: e.target.value} : x,
                    ),
                  );
                }}
                className="w-full px-2 py-1 rounded border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
                placeholder="Vietnamese text"
              />
              <ImageUploadField
                entityType="highlight"
                entityId={h.id}
                imageType="card"
                currentUrl={h.imageUrl ?? ''}
                onUploadComplete={(url) => handleImageUpload(h.id, url)}
                label=""
              />
            </div>
            <button
              type="button"
              onClick={() => handleDelete(h.id)}
              className="type-label-sm text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="p-4 rounded-lg border border-dashed border-border">
        <h3 className="type-title-sm text-on-surface mb-3">Add Highlight</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <input
            type="text"
            value={newTextEn}
            onChange={(e) => setNewTextEn(e.target.value)}
            placeholder="English text"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
          />
          <input
            type="text"
            value={newTextVi}
            onChange={(e) => setNewTextVi(e.target.value)}
            placeholder="Vietnamese text"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface type-body-sm cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newTextEn.trim()}
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {adding ? 'Adding...' : 'Add Highlight'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run:

```bash
pnpm build
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/destinations/[id]/edit.tsx src/components/admin/DestinationHighlights.tsx
git commit -m "feat: add highlights management to destination edit page"
```

---

### Task 17: Final Build Verification & Cleanup

**Files:**

- Verify all modified files compile

- [ ] **Step 1: Full build**

Run:

```bash
pnpm build
```

Expected: PASS — zero TypeScript errors, all pages build.

- [ ] **Step 2: Lint check**

Run:

```bash
pnpm lint
```

Expected: PASS or only pre-existing warnings.

- [ ] **Step 3: Verify no remaining TourForm imports**

Search for any remaining imports of the deleted TourForm:

```bash
grep -r "TourForm" src/ --include="*.ts" --include="*.tsx"
```

Expected: No results.

- [ ] **Step 4: Verify no remaining `highlights Json` references**

Search for code still treating highlights as JSON/LocalizedText[]:

```bash
grep -r "highlight\[localeKey\]\|highlight\.en\|highlight\.vi" src/ --include="*.tsx" --include="*.ts"
```

Expected: No results (old pattern). The new pattern uses `h.textEn` / `h.textVi`.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final cleanup for tour edit redesign"
```
