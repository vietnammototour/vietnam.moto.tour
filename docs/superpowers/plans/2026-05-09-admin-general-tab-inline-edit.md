# Admin General Tab Inline-Edit Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the side-by-side form/preview layout of the admin Tour General tab with a WYSIWYG layout that renders the public tour page components inline-edited. Move the card image upload to its own `Card` tab.

**Architecture:** Reuse the existing `EditableProvider` pattern already used by `ItineraryTab` / `PricingTab`. Extend `TourHero` and `TourDescription` to read `useEditable()` and switch to inline editing when active. Lift `slug` + `title` to `TourEditTabs` so the page header and the inline-editable breadcrumb stay in sync with the General-tab form. `Card` tab is a thin sibling tab containing only the image upload + a live `TourCard` preview.

**Tech Stack:** Next.js 16 (Pages Router), React 19, react-hook-form, Yup, Tailwind 4, next-intl, Prisma.

---

## File Structure

**Modified**

- `src/routes/registry.ts` — add `card` to `TOUR_TABS`.
- `src/components/TourHero/TourHero.tsx` — accept editable mode + `destinationSlot` overlay prop.
- `src/components/tour-detail/TourDescription/TourDescription.tsx` — accept editable mode (textarea when editable).
- `src/components/admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx` — accept inline-editable last segment.
- `src/components/admin/TourEditTabs/TourEditTabs.tsx` — lift slug + title state, render Card tab, wire breadcrumb editor.
- `src/components/admin/tabs/GeneralTab/GeneralTab.tsx` — full rewrite (EditableProvider + public components).
- `src/components/admin/tabs/GeneralTab/GeneralTab.form-utils.ts` — drop `imageCard` and `status` from schema/type.
- `src/pages/admin/tours/[id]/edit/[tab].tsx` — drop `imageCard`/`status` from `initialGeneral`; pull `heroImage` from destinations fetch.
- `src/pages/admin/tours/new/[tab].tsx` — same as above.
- `prisma/seed-admin-translations.ts` — add `admin.tours.tabs.{general,itinerary,pricing,highlights,perks,card}` (the existing five may not yet be seeded; verify and add `card` at minimum).

**Created**

- `src/components/admin/tabs/CardTab/CardTab.tsx`
- `src/components/admin/tabs/CardTab/CardTab.form-utils.ts`
- `src/components/admin/tabs/CardTab/index.ts`
- `src/components/admin/tabs/CardTab/CardTab.spec.tsx`
- Tests for editable modes: `TourHero.editable.spec.tsx`, `TourDescription.editable.spec.tsx`, `AdminBreadcrumbs.editable.spec.tsx`.

**Deleted**

- `src/components/admin/TourPreviewPanel/` (folder, 2 files).
- `src/components/admin/index.ts` re-export of `TourPreviewPanel` (if present).

---

## Task 1: Extend admin destinations type to include heroImage

**Files:**

- Modify: `src/pages/admin/tours/[id]/edit/[tab].tsx`
- Modify: `src/pages/admin/tours/new/[tab].tsx`
- Modify: `src/components/admin/TourEditTabs/TourEditTabs.tsx`

The hero banner needs to swap its background image when the destination select changes. The admin destinations API already returns `heroImage` per row; only the admin-side typing needs to accept it.

- [ ] **Step 1: Widen the destination type in both edit/new tab pages**

In `src/pages/admin/tours/[id]/edit/[tab].tsx`, replace the local `Destination` type:

```ts
type Destination = {
  id: string;
  name: string;
  heroImage: string;
};
```

Apply the same change in `src/pages/admin/tours/new/[tab].tsx`.

- [ ] **Step 2: Widen the prop in `TourEditTabs`**

In `src/components/admin/TourEditTabs/TourEditTabs.tsx`, change:

```ts
destinations: Array<{id: string; name: string; heroImage: string}>;
```

- [ ] **Step 3: Type-check**

Run: `pnpm build`
Expected: build passes (no behavior change yet).

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/TourEditTabs/TourEditTabs.tsx \
        src/pages/admin/tours/\[id\]/edit/\[tab\].tsx \
        src/pages/admin/tours/new/\[tab\].tsx
git commit -m "chore(admin): widen destination type with heroImage"
```

---

## Task 2: Add `card` to TOUR_TABS registry

**Files:**

- Modify: `src/routes/registry.ts`

- [ ] **Step 1: Add the tab between general and itinerary**

```ts
const TOUR_TABS = [
  {key: 'general', labelKey: 'admin.tours.tabs.general'},
  {key: 'card', labelKey: 'admin.tours.tabs.card'},
  {key: 'itinerary', labelKey: 'admin.tours.tabs.itinerary'},
  {key: 'pricing', labelKey: 'admin.tours.tabs.pricing'},
  {key: 'highlights', labelKey: 'admin.tours.tabs.highlights'},
  {key: 'perks', labelKey: 'admin.tours.tabs.perks'},
] as const satisfies readonly TabDescriptor<string>[];
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: TypeScript will flag the missing `<TabPanel tabKey="card">` in `TourEditTabs.tsx` only after Task 7. For now, the registry change alone compiles because `TabPanel` doesn't enforce exhaustiveness over the tabs union. Confirm build passes.

- [ ] **Step 3: Commit**

```bash
git add src/routes/registry.ts
git commit -m "feat(admin): register card tab on tour edit"
```

---

## Task 3: Seed `admin.tours.tabs.card` translation

**Files:**

- Modify: `prisma/seed-admin-translations.ts`

Per project memory, translations are DB-only. The new `card` label must exist before the tab can render with a real label.

- [ ] **Step 1: Add the entry**

Append to the `entries` array in `prisma/seed-admin-translations.ts`:

```ts
{
  namespace: 'admin.tours.tabs',
  key: 'card',
  valueEn: 'Card',
  valueVi: 'Thẻ',
},
```

If the file does not already contain `admin.tours.tabs` entries for general/itinerary/pricing/highlights/perks, add those too with the obvious labels (these are referenced by `routes/registry.ts` already):

```ts
{namespace: 'admin.tours.tabs', key: 'general', valueEn: 'General', valueVi: 'Chung'},
{namespace: 'admin.tours.tabs', key: 'itinerary', valueEn: 'Itinerary', valueVi: 'Lịch trình'},
{namespace: 'admin.tours.tabs', key: 'pricing', valueEn: 'Pricing', valueVi: 'Giá'},
{namespace: 'admin.tours.tabs', key: 'highlights', valueEn: 'Highlights', valueVi: 'Điểm nổi bật'},
{namespace: 'admin.tours.tabs', key: 'perks', valueEn: 'Perks', valueVi: 'Tiện ích'},
```

Skip any whose namespace+key already appears.

- [ ] **Step 2: Run the seed**

Run: `pnpm tsx prisma/seed-admin-translations.ts`
Expected: script reports inserts/updates without error.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed-admin-translations.ts
git commit -m "feat(admin): seed card tab translation"
```

---

## Task 4: Make `TourDescription` editable-aware (TDD)

**Files:**

- Create: `src/components/tour-detail/TourDescription/TourDescription.spec.tsx`
- Modify: `src/components/tour-detail/TourDescription/TourDescription.tsx`

`TourDescription` currently renders a `<p>`. When wrapped in `EditableProvider`, it must render a `<textarea>` bound to the description text, emitting changes via `onFieldChange(path, value)` where `path = "description.<locale>"`.

- [ ] **Step 1: Write the failing test**

```tsx
// TourDescription.spec.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {EditableProvider} from '@/components/Admin/EditableContext';
import {TourDescription} from './TourDescription';

const messages = {tourDetail: {aboutThisTour: 'About this tour'}};

function renderWithProviders(
  description: {en: string; vi: string},
  locale: 'en' | 'vi',
  onFieldChange = jest.fn(),
) {
  return {
    onFieldChange,
    ...render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <EditableProvider locale={locale} onFieldChange={onFieldChange}>
          <TourDescription description={description} locale={locale} />
        </EditableProvider>
      </NextIntlClientProvider>,
    ),
  };
}

describe('TourDescription editable mode', () => {
  it('renders a textarea pre-filled with the active locale value', () => {
    renderWithProviders({en: 'English copy', vi: 'Tiếng Việt'}, 'en');
    const textarea = screen.getByRole('textbox', {name: /about this tour/i});
    expect(textarea).toHaveValue('English copy');
  });

  it('emits onFieldChange with locale-scoped path on input', () => {
    const {onFieldChange} = renderWithProviders({en: 'old', vi: ''}, 'en');
    const textarea = screen.getByRole('textbox', {name: /about this tour/i});
    fireEvent.change(textarea, {target: {value: 'new copy'}});
    expect(onFieldChange).toHaveBeenCalledWith('description.en', 'new copy');
  });

  it('renders a paragraph (not textarea) when no EditableProvider is present', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TourDescription description={{en: 'Read-only', vi: ''}} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Read-only')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run: `pnpm test -- TourDescription.spec`
Expected: FAIL — textarea not rendered (component still renders `<p>`).

- [ ] **Step 3: Implement editable mode**

Replace `src/components/tour-detail/TourDescription/TourDescription.tsx` with:

```tsx
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useId} from 'react';
import type * as VMT from '@/domain';
import {useEditable} from '@/components/Admin/EditableContext';

type TourDescriptionProps = {
  description: VMT.LocalizedText;
  locale: string;
};

export function TourDescription({description, locale}: TourDescriptionProps) {
  const t = useTranslations('tourDetail');
  const ctx = useEditable();
  const localeKey = (ctx?.locale ?? (locale as 'en' | 'vi')) as 'en' | 'vi';
  const editable = !!ctx?.editable;
  const headingId = useId();

  return (
    <motion.section
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.5}}
      className="mb-10"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="type-headline-sm text-on-surface mb-4">
        {t('aboutThisTour')}
      </h2>
      {editable ? (
        <textarea
          aria-labelledby={headingId}
          value={description[localeKey] ?? ''}
          onChange={(e) =>
            ctx!.onFieldChange(`description.${localeKey}`, e.target.value)
          }
          rows={8}
          className="w-full type-body-sm leading-relaxed bg-surface-elevated/50 border border-dashed border-primary/40 hover:border-primary focus:border-primary rounded p-3 cursor-text outline-none"
        />
      ) : (
        <p className="type-body-sm text-on-surface-secondary leading-relaxed">
          {description[localeKey]}
        </p>
      )}
    </motion.section>
  );
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `pnpm test -- TourDescription.spec`
Expected: PASS, three tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/tour-detail/TourDescription
git commit -m "feat(tour-description): editable-aware textarea"
```

---

## Task 5: Make `TourHero` editable-aware (TDD)

**Files:**

- Create: `src/components/TourHero/TourHero.spec.tsx`
- Modify: `src/components/TourHero/TourHero.tsx`

`TourHero` must:

- When wrapped in `EditableProvider`, render the title as an inline `<input>` and the meta items (duration, distance, transportation) as inline inputs. Each emits `onFieldChange(<path>, value)` with paths `"title"`, `"duration"`, `"distance"`, `"transportation"`.
- Hide the price chip and the public-page breadcrumb section when editable.
- Accept a new optional `destinationSlot?: React.ReactNode` rendered as an overlay top-left of the hero (used by GeneralTab for the destination select).

- [ ] **Step 1: Write the failing test**

```tsx
// TourHero.spec.tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {EditableProvider} from '@/components/Admin/EditableContext';
import {TourHero} from './TourHero';
import type * as VMT from '@/domain';

const messages = {
  tourDetail: {
    days: 'days',
    from: 'From',
    perPerson: 'per person',
    breadcrumbHome: 'Home',
    breadcrumbTours: 'Tours',
  },
};

const baseTour: VMT.Tour = {
  id: 't1',
  slug: 's',
  destinationId: 'd1',
  destinationName: 'Mui Ne',
  destinationHeroImage: '/img.jpg',
  title: {en: 'Title EN', vi: 'Title VI'},
  description: {en: '', vi: ''},
  imageUrl: '',
  images: [],
  duration: 2,
  distance: 100,
  transportation: 'Car',
  hotel: '',
  guided: '',
  itinerary: [],
  pricingGroups: [],
  paymentDetails: {en: '', vi: ''},
  notes: [],
  mealsInfo: {en: '', vi: ''},
  status: 'PUBLISHED',
  highlights: [],
  included: [],
  excluded: [],
};

function renderEditable(
  onFieldChange = jest.fn(),
  extra: Partial<VMT.Tour> = {},
) {
  return {
    onFieldChange,
    ...render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EditableProvider locale="en" onFieldChange={onFieldChange}>
          <TourHero tour={{...baseTour, ...extra}} />
        </EditableProvider>
      </NextIntlClientProvider>,
    ),
  };
}

describe('TourHero editable mode', () => {
  it('renders title as input bound to active locale', () => {
    renderEditable();
    const titleInput = screen.getByRole('textbox', {name: /title/i});
    expect(titleInput).toHaveValue('Title EN');
  });

  it('emits onFieldChange("title", value) when title input changes', () => {
    const {onFieldChange} = renderEditable();
    const titleInput = screen.getByRole('textbox', {name: /title/i});
    fireEvent.change(titleInput, {target: {value: 'New title'}});
    expect(onFieldChange).toHaveBeenCalledWith('title', 'New title');
  });

  it('renders duration/distance/transportation as inputs and emits changes', () => {
    const {onFieldChange} = renderEditable();
    const duration = screen.getByRole('spinbutton', {name: /duration/i});
    fireEvent.change(duration, {target: {value: '5'}});
    expect(onFieldChange).toHaveBeenCalledWith('duration', 5);

    const distance = screen.getByRole('spinbutton', {name: /distance/i});
    fireEvent.change(distance, {target: {value: '250'}});
    expect(onFieldChange).toHaveBeenCalledWith('distance', 250);

    const transport = screen.getByRole('textbox', {name: /transportation/i});
    fireEvent.change(transport, {target: {value: 'Bike'}});
    expect(onFieldChange).toHaveBeenCalledWith('transportation', 'Bike');
  });

  it('hides the price chip in editable mode', () => {
    renderEditable(jest.fn(), {
      pricingGroups: [
        {
          label: {en: '', vi: ''},
          items: [{price: 99, label: {en: '', vi: ''}}],
        },
      ] as never,
    });
    expect(screen.queryByText(/From \$99/)).toBeNull();
  });

  it('renders destinationSlot in editable mode', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EditableProvider locale="en" onFieldChange={jest.fn()}>
          <TourHero
            tour={baseTour}
            destinationSlot={<div data-testid="dest-slot">slot</div>}
          />
        </EditableProvider>
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId('dest-slot')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm test -- TourHero.spec`
Expected: FAIL — TourHero does not check `useEditable` or accept `destinationSlot`.

- [ ] **Step 3: Implement**

Replace `src/components/TourHero/TourHero.tsx` with:

```tsx
import Link from 'next/link';
import {useTranslations, useLocale} from 'next-intl';
import {motion, useMotionTemplate} from 'framer-motion';
import {useCursorSpotlight} from '@/hooks/use-cursor-spotlight';
import {clipReveal, slideFromLeft} from '@/utils/motion-variants';
import {routes} from '@/routes';
import type * as VMT from '@/domain';
import {getMinPrice} from '@/domain';
import {useEditable} from '@/components/Admin/EditableContext';

type TourHeroProps = {
  tour?: VMT.Tour;
  preview?: {heroImage: string; destinationName: string};
  destinationSlot?: React.ReactNode;
};

export function TourHero({tour, preview, destinationSlot}: TourHeroProps) {
  const t = useTranslations('tourDetail');
  const locale = useLocale();
  const ctx = useEditable();
  const editable = !!ctx?.editable;
  const localeKey = (ctx?.locale ?? (locale as 'en' | 'vi')) as 'en' | 'vi';
  const spotlight = useCursorSpotlight(250, 0.12);
  const spotlightBg = useMotionTemplate`radial-gradient(250px circle at ${spotlight.x}px ${spotlight.y}px, rgba(180, 83, 9, 0.12), transparent)`;

  const isPreview = !!preview;
  const heroImage = preview?.heroImage ?? tour?.destinationHeroImage;
  const tourTitle = tour?.title[localeKey] ?? tour?.title.vi ?? '';
  const displayName = preview?.destinationName ?? tourTitle;

  const inputBaseClasses =
    'bg-transparent text-on-surface-inverse border border-dashed border-white/40 hover:border-white focus:border-white rounded px-1 outline-none';

  return (
    <section className="relative">
      <div
        ref={spotlight.ref as React.RefObject<HTMLDivElement>}
        onMouseMove={spotlight.onMouseMove}
        onMouseLeave={spotlight.onMouseLeave}
        className="relative h-72 md:h-96 lg:h-[28rem] overflow-hidden texture-grain-warm"
      >
        {heroImage && (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage: `url(${heroImage})`}}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{background: spotlightBg}}
        />

        {editable && destinationSlot && (
          <div className="absolute top-4 left-4 z-30">{destinationSlot}</div>
        )}

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-8">
          {editable && tour ? (
            <input
              aria-label="Title"
              value={tour.title[localeKey] ?? ''}
              onChange={(e) => ctx!.onFieldChange('title', e.target.value)}
              className={`type-display-sm md:type-display-lg ${inputBaseClasses} mb-3 max-w-[70%] w-full`}
            />
          ) : (
            <motion.h1
              variants={clipReveal}
              initial="hidden"
              animate="visible"
              className="type-display-sm md:type-display-lg text-on-surface-inverse mb-3 max-w-[70%]"
            >
              {displayName}
            </motion.h1>
          )}

          {!isPreview && tour && (
            <>
              {editable ? (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-inverse/80 type-body-sm">
                  <span className="flex items-center gap-1.5">
                    <i className="fa fa-map-marker-alt" />{' '}
                    {tour.destinationName}
                  </span>
                  <label className="flex items-center gap-1.5">
                    <i className="fa fa-clock" />
                    <input
                      aria-label="Duration"
                      type="number"
                      min={0}
                      value={tour.duration}
                      onChange={(e) =>
                        ctx!.onFieldChange('duration', Number(e.target.value))
                      }
                      className={`${inputBaseClasses} w-16`}
                    />
                    {t('days')}
                  </label>
                  <label className="flex items-center gap-1.5">
                    <i className="fa fa-road" />
                    <input
                      aria-label="Distance"
                      type="number"
                      min={0}
                      value={tour.distance}
                      onChange={(e) =>
                        ctx!.onFieldChange('distance', Number(e.target.value))
                      }
                      className={`${inputBaseClasses} w-20`}
                    />
                    km
                  </label>
                  <label className="flex items-center gap-1.5">
                    <i className="fa fa-motorcycle" />
                    <input
                      aria-label="Transportation"
                      type="text"
                      value={tour.transportation}
                      onChange={(e) =>
                        ctx!.onFieldChange('transportation', e.target.value)
                      }
                      className={`${inputBaseClasses} w-40`}
                    />
                  </label>
                </div>
              ) : (
                <motion.div
                  variants={slideFromLeft}
                  initial="hidden"
                  animate="visible"
                  transition={{delay: 0.3}}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-inverse/80 type-body-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <i className="fa fa-map-marker-alt" />{' '}
                    {tour.destinationName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa fa-clock" /> {tour.duration} {t('days')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa fa-road" /> {tour.distance} km
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa fa-motorcycle" /> {tour.transportation}
                  </span>
                </motion.div>
              )}

              {!editable && (
                <motion.div
                  variants={slideFromLeft}
                  initial="hidden"
                  animate="visible"
                  transition={{delay: 0.5}}
                  className="mt-4 text-on-surface-inverse"
                >
                  <span className="type-headline-lg">
                    {t('from')} ${getMinPrice(tour.pricingGroups)}
                  </span>
                  <span className="type-body-sm ml-1 opacity-80">
                    {t('perPerson')}
                  </span>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {!editable && !isPreview && tour && (
        <div className="bg-surface-alt py-3">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 type-body-sm text-on-surface-secondary">
              <Link
                href={routes.home.path()}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {t('breadcrumbHome')}
              </Link>
              <span>/</span>
              <Link
                href={routes.tours.list.path()}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {t('breadcrumbTours')}
              </Link>
              <span>/</span>
              <span className="text-on-surface type-label-lg">{tourTitle}</span>
            </nav>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `pnpm test -- TourHero.spec`
Expected: PASS, five tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TourHero
git commit -m "feat(tour-hero): editable mode + destinationSlot overlay"
```

---

## Task 6: Make `AdminBreadcrumbs` last segment inline-editable (TDD)

**Files:**

- Create: `src/components/admin/AdminBreadcrumbs/AdminBreadcrumbs.spec.tsx`
- Modify: `src/components/admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx`

The last breadcrumb segment must be optionally editable. When `editable` is provided, the label renders with a pencil icon; clicking enters edit mode (a `TextInput`); pressing Enter or blurring commits the new value via `onCommit`. Pressing Escape cancels.

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {AdminBreadcrumbs} from './AdminBreadcrumbs';

describe('AdminBreadcrumbs editable last segment', () => {
  it('renders label by default with pencil button', () => {
    const onCommit = jest.fn();
    render(
      <AdminBreadcrumbs
        items={[
          {label: 'Admin', href: '/admin'},
          {label: 'Tours', href: '/admin/tours'},
          {label: 'mui-ne-full-day', editable: {fieldLabel: 'Slug', onCommit}},
        ]}
      />,
    );
    expect(screen.getByText('mui-ne-full-day')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /edit slug/i}),
    ).toBeInTheDocument();
  });

  it('switches to input on pencil click and commits on Enter', () => {
    const onCommit = jest.fn();
    render(
      <AdminBreadcrumbs
        items={[
          {label: 'mui-ne-full-day', editable: {fieldLabel: 'Slug', onCommit}},
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: /edit slug/i}));
    const input = screen.getByRole('textbox', {name: /slug/i});
    fireEvent.change(input, {target: {value: 'mui-ne-half-day'}});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onCommit).toHaveBeenCalledWith('mui-ne-half-day');
  });

  it('cancels on Escape without calling onCommit', () => {
    const onCommit = jest.fn();
    render(
      <AdminBreadcrumbs
        items={[{label: 'orig', editable: {fieldLabel: 'Slug', onCommit}}]}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: /edit slug/i}));
    const input = screen.getByRole('textbox', {name: /slug/i});
    fireEvent.change(input, {target: {value: 'changed'}});
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('orig')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm test -- AdminBreadcrumbs.spec`
Expected: FAIL — `editable` prop unsupported.

- [ ] **Step 3: Implement**

Replace `src/components/admin/AdminBreadcrumbs/AdminBreadcrumbs.tsx` with:

```tsx
import Link from 'next/link';
import {useState, useEffect, useRef} from 'react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  editable?: {
    fieldLabel: string;
    onCommit: (value: string) => void;
  };
};

type Props = {
  items: BreadcrumbItem[];
};

export function AdminBreadcrumbs({items}: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 type-body-sm text-on-surface-secondary mb-2"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-on-surface-secondary/60" aria-hidden>
                /
              </span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {item.label}
              </Link>
            ) : isLast && item.editable ? (
              <EditableSegment
                label={item.label}
                fieldLabel={item.editable.fieldLabel}
                onCommit={item.editable.onCommit}
              />
            ) : (
              <span
                className={
                  isLast
                    ? 'text-on-surface type-label-lg font-medium'
                    : 'text-on-surface-secondary'
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function EditableSegment({
  label,
  fieldLabel,
  onCommit,
}: {
  label: string;
  fieldLabel: string;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(label);
  }, [label, editing]);

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className="text-on-surface type-label-lg font-medium"
          aria-current="page"
        >
          {label}
        </span>
        <button
          type="button"
          aria-label={`Edit ${fieldLabel}`}
          onClick={() => setEditing(true)}
          className="text-on-surface-secondary hover:text-primary cursor-pointer"
        >
          <i className="fa fa-pencil" aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      aria-label={fieldLabel}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommit(draft);
          setEditing(false);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setDraft(label);
          setEditing(false);
        }
      }}
      onBlur={() => {
        if (draft !== label) onCommit(draft);
        setEditing(false);
      }}
      className="text-on-surface type-label-lg font-medium bg-surface-elevated border border-dashed border-primary/40 focus:border-primary rounded px-1 outline-none cursor-text"
    />
  );
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `pnpm test -- AdminBreadcrumbs.spec`
Expected: PASS, three tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminBreadcrumbs
git commit -m "feat(admin-breadcrumbs): inline-editable last segment"
```

---

## Task 7: Create the `CardTab` component (TDD)

**Files:**

- Create: `src/components/admin/tabs/CardTab/CardTab.form-utils.ts`
- Create: `src/components/admin/tabs/CardTab/CardTab.tsx`
- Create: `src/components/admin/tabs/CardTab/index.ts`
- Create: `src/components/admin/tabs/CardTab/CardTab.spec.tsx`

`CardTab` owns only the card image. Its submit flushes the image slot via `flushImageSlots` and is independent of General save.

- [ ] **Step 1: Write form-utils**

`src/components/admin/tabs/CardTab/CardTab.form-utils.ts`:

```ts
import * as yup from 'yup';
import {imageSlotSchema, type ImageSlot} from '@/lib/image-slot';

export const cardTabSchema = yup.object({
  imageCard: imageSlotSchema().required(),
});

export type CardTabFormData = yup.InferType<typeof cardTabSchema>;
```

- [ ] **Step 2: Write the failing test**

`src/components/admin/tabs/CardTab/CardTab.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {CardTab} from './CardTab';
import {savedSlot} from '@/lib/image-slot';

const messages = {tourCard: {}};

function renderTab(props: Partial<React.ComponentProps<typeof CardTab>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CardTab
        tourId="t1"
        locale="en"
        initialData={{imageCard: savedSlot('/img.webp')}}
        previewTour={{
          id: 't1',
          slug: 'mui-ne',
          destinationId: 'd1',
          destinationName: 'Mui Ne',
          destinationHeroImage: '',
          title: {en: 'Mui Ne', vi: 'Mui Ne'},
          description: {en: '', vi: ''},
          imageUrl: '/img.webp',
          images: [],
          duration: 1,
          distance: 0,
          transportation: '',
          hotel: '',
          guided: '',
          itinerary: [],
          pricingGroups: [],
          paymentDetails: {en: '', vi: ''},
          notes: [],
          mealsInfo: {en: '', vi: ''},
          status: 'PUBLISHED',
          highlights: [],
          included: [],
          excluded: [],
        }}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('CardTab', () => {
  it('renders an image upload control and the live TourCard preview title', () => {
    renderTab();
    expect(screen.getByText(/card image/i)).toBeInTheDocument();
    expect(screen.getByText('Mui Ne')).toBeInTheDocument();
  });

  it('disables Save when there are no pending changes', () => {
    renderTab();
    expect(screen.getByRole('button', {name: /save card/i})).toBeDisabled();
  });
});
```

- [ ] **Step 3: Run, expect failure**

Run: `pnpm test -- CardTab.spec`
Expected: FAIL — `CardTab` does not exist.

- [ ] **Step 4: Implement `CardTab.tsx`**

```tsx
'use client';

import {useState} from 'react';
import {useForm, FormProvider} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type * as VMT from '@/domain';
import {ImageUploadField} from '../../ImageUploadField';
import {AdminIntlProvider} from '../../AdminIntlProvider';
import {TourCard} from '@/components/TourCard/TourCard';
import {Button} from '@/components/ui';
import {flushImageSlots} from '@/lib/submit-with-images';
import type {ImageSlot} from '@/lib/image-slot';
import {cardTabSchema, type CardTabFormData} from './CardTab.form-utils';

type CardTabProps = {
  tourId: string | null;
  locale: 'en' | 'vi';
  initialData: CardTabFormData;
  previewTour: VMT.Tour;
  onSaved?: (slot: ImageSlot) => void;
};

function imageSlotToUrl(slot: ImageSlot | undefined): string {
  if (!slot) return '';
  if (slot.kind === 'saved') return slot.url;
  if (slot.kind === 'pending-replace') return slot.previewUrl;
  return '';
}

export function CardTab({
  tourId,
  locale,
  initialData,
  previewTour,
  onSaved,
}: CardTabProps) {
  const [submitError, setSubmitError] = useState('');

  const methods = useForm<CardTabFormData>({
    resolver: yupResolver(cardTabSchema),
    defaultValues: initialData,
  });

  const {
    handleSubmit,
    watch,
    formState: {isSubmitting, isDirty},
    reset,
  } = methods;

  const imageCard = watch('imageCard');

  async function onSubmit(data: CardTabFormData) {
    setSubmitError('');
    if (!tourId) {
      setSubmitError('Save General tab first');
      return;
    }
    try {
      const {errors, updated} = await flushImageSlots({
        entityType: 'tour',
        entityId: tourId,
        slots: {card: data.imageCard},
      });
      if (errors.card) throw new Error(errors.card);
      const next = updated.card ?? data.imageCard;
      reset({imageCard: next});
      onSaved?.(next);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  const livePreviewTour: VMT.Tour = {
    ...previewTour,
    imageUrl: imageSlotToUrl(imageCard as ImageSlot | undefined),
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5"
      >
        <div className="space-y-4">
          <ImageUploadField name="imageCard" preset="card" label="Card image" />
          {submitError && (
            <p className="type-body-sm text-red-500">{submitError}</p>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            loading={isSubmitting}
            size="lg"
          >
            Save Card
          </Button>
          {isDirty && (
            <p className="type-label-sm text-amber-500">Unsaved changes</p>
          )}
        </div>
        <aside>
          <AdminIntlProvider locale={locale}>
            <TourCard tour={livePreviewTour} interactive={false} />
          </AdminIntlProvider>
        </aside>
      </form>
    </FormProvider>
  );
}
```

- [ ] **Step 5: Write `index.ts`**

```ts
export {CardTab} from './CardTab';
export type {CardTabFormData} from './CardTab.form-utils';
```

- [ ] **Step 6: Run tests, expect pass**

Run: `pnpm test -- CardTab.spec`
Expected: PASS, two tests.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/tabs/CardTab
git commit -m "feat(admin/card-tab): card image tab with live preview"
```

---

## Task 8: Trim `GeneralTab.form-utils.ts`

**Files:**

- Modify: `src/components/admin/tabs/GeneralTab/GeneralTab.form-utils.ts`

Drop `imageCard` and `status` from the schema and the inferred type. Existing `images`/`paymentDetails`/`notes`/`mealsInfo` stay (they pass through unchanged via the API patch payload — the General tab does not edit them but the parent props/seed still include them; we will drop them from the seed in Task 11 instead, leaving the schema lean now).

- [ ] **Step 1: Replace schema**

```ts
import * as yup from 'yup';

export const generalTabSchema = yup.object({
  slug: yup.string().required('Slug is required'),
  destinationId: yup.string().required('Destination is required'),
  title: yup.string().required('Title is required'),
  titleVi: yup.string().defined(),
  titleEn: yup.string().defined(),
  duration: yup.number().min(0).required('Duration is required'),
  distance: yup.number().min(0).required('Distance is required'),
  descriptionVi: yup.string().defined(),
  descriptionEn: yup.string().defined(),
  transportation: yup.string().defined(),
  hotel: yup.string().defined(),
  guided: yup.string().defined(),
});

export type GeneralTabFormData = yup.InferType<typeof generalTabSchema>;
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: failures from `GeneralTab.tsx` (still references `imageCard`, `status`) and from `[id]/edit/[tab].tsx` / `new/[tab].tsx` (still build a wider `initialGeneral`). These will be fixed in Tasks 9 and 11. Confirm the build only errors in those known locations.

- [ ] **Step 3: Commit (intentionally with broken build — paired with Task 9 commit)**

Skip this commit. Instead, batch this change with Task 9 in a single commit so main stays buildable.

---

## Task 9: Rewrite `GeneralTab.tsx`

**Files:**

- Modify: `src/components/admin/tabs/GeneralTab/GeneralTab.tsx`

Render: `EditableProvider` → `TourHero` (with destination select overlay) + `TourDescription` + trailing hotel/guided block + Save. Slug is exposed as a controlled value via callback so the parent breadcrumb can drive it.

- [ ] **Step 1: Write the new file**

```tsx
'use client';

import {useEffect, useRef, useState, useCallback} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import type * as VMT from '@/domain';
import {EditableProvider} from '../../EditableContext';
import {AdminIntlProvider} from '../../AdminIntlProvider';
import {TourHero} from '@/components/TourHero';
import {TourDescription} from '@/components/tour-detail/TourDescription';
import {Button, Select, TextInput} from '@/components/ui';
import {
  generalTabSchema,
  type GeneralTabFormData,
} from './GeneralTab.form-utils';

export type {GeneralTabFormData as GeneralTabData};

type GeneralTabProps = {
  initialData: GeneralTabFormData;
  destinations: Array<{id: string; name: string; heroImage: string}>;
  tourId: string | null;
  locale: 'en' | 'vi';
  externalSlug?: string;
  onSlugChange?: (slug: string) => void;
  onTitleChange?: (title: string) => void;
  onDestinationChange?: (destinationId: string) => void;
  onSave: (data: GeneralTabFormData) => Promise<string>;
};

export function GeneralTab({
  initialData,
  destinations,
  tourId,
  locale,
  externalSlug,
  onSlugChange,
  onTitleChange,
  onDestinationChange,
  onSave,
}: GeneralTabProps) {
  const [submitError, setSubmitError] = useState('');

  const {
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: {isSubmitting, isDirty},
    reset,
  } = useForm<GeneralTabFormData>({
    resolver: yupResolver(generalTabSchema),
    defaultValues: initialData,
  });

  const values = useWatch({control}) as GeneralTabFormData;

  // Push slug + title up so breadcrumb / page header stay in sync.
  const lastSlug = useRef(initialData.slug);
  const lastTitle = useRef(initialData.title);
  useEffect(() => {
    if (values.slug !== lastSlug.current) {
      lastSlug.current = values.slug;
      onSlugChange?.(values.slug);
    }
    if (values.title !== lastTitle.current) {
      lastTitle.current = values.title;
      onTitleChange?.(values.title);
    }
  }, [values.slug, values.title, onSlugChange, onTitleChange]);

  // Pull slug down from parent (breadcrumb pencil edit).
  useEffect(() => {
    if (externalSlug !== undefined && externalSlug !== getValues('slug')) {
      setValue('slug', externalSlug, {shouldDirty: true});
      lastSlug.current = externalSlug;
    }
  }, [externalSlug, setValue, getValues]);

  const handleFieldChange = useCallback(
    (path: string, value: string | number) => {
      // path: "title" | "duration" | "distance" | "transportation"
      //       | "description.en" | "description.vi"
      //       | "hotel" | "guided"
      let rhfPath: keyof GeneralTabFormData | null = null;
      if (path === 'description.en') rhfPath = 'descriptionEn';
      else if (path === 'description.vi') rhfPath = 'descriptionVi';
      else if (
        path === 'title' ||
        path === 'duration' ||
        path === 'distance' ||
        path === 'transportation' ||
        path === 'hotel' ||
        path === 'guided'
      ) {
        rhfPath = path as keyof GeneralTabFormData;
      }
      if (!rhfPath) return;
      setValue(rhfPath as never, value as never, {shouldDirty: true});
    },
    [setValue],
  );

  async function onSubmit(data: GeneralTabFormData) {
    setSubmitError('');
    try {
      await onSave(data);
      reset(data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  const destination = destinations.find((d) => d.id === values.destinationId);
  const heroImage = destination?.heroImage ?? '';
  const destinationName = destination?.name ?? '';

  const previewTour: VMT.Tour = {
    id: tourId ?? 'preview',
    slug: values.slug,
    destinationId: values.destinationId,
    destinationName,
    destinationHeroImage: heroImage,
    title: {
      en: locale === 'en' ? values.title : (values.titleEn ?? values.title),
      vi: locale === 'vi' ? values.title : (values.titleVi ?? values.title),
    },
    description: {en: values.descriptionEn, vi: values.descriptionVi},
    imageUrl: '',
    images: [],
    duration: values.duration,
    distance: values.distance,
    transportation: values.transportation,
    hotel: values.hotel,
    guided: values.guided,
    itinerary: [],
    pricingGroups: [],
    paymentDetails: {en: '', vi: ''},
    notes: [],
    mealsInfo: {en: '', vi: ''},
    status: 'PUBLISHED',
    highlights: [],
    included: [],
    excluded: [],
  };

  const destinationSelector = (
    <Select
      aria-label="Destination"
      value={values.destinationId}
      onChange={(e) => {
        const id = (e.target as HTMLSelectElement).value;
        setValue('destinationId', id, {shouldDirty: true});
        onDestinationChange?.(id);
      }}
      className="bg-surface-elevated/90 backdrop-blur"
    >
      <option value="">Select destination...</option>
      {destinations.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </Select>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <AdminIntlProvider locale={locale}>
        <EditableProvider locale={locale} onFieldChange={handleFieldChange}>
          <TourHero tour={previewTour} destinationSlot={destinationSelector} />

          <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
            <TourDescription
              description={previewTour.description}
              locale={locale}
            />

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <TextInput
                label="Hotel"
                value={values.hotel}
                onChange={(e) =>
                  setValue('hotel', e.target.value, {shouldDirty: true})
                }
              />
              <TextInput
                label="Guided"
                value={values.guided}
                onChange={(e) =>
                  setValue('guided', e.target.value, {shouldDirty: true})
                }
              />
            </section>
          </div>
        </EditableProvider>
      </AdminIntlProvider>

      <div className="border-t border-border bg-surface-elevated p-4 flex items-center justify-between gap-3 sticky bottom-0">
        {submitError ? (
          <span className="type-label-sm text-red-500">{submitError}</span>
        ) : isDirty ? (
          <span className="type-label-sm text-amber-500">Unsaved changes</span>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          loading={isSubmitting}
          size="lg"
        >
          Save General
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: build still fails on parent files (`TourEditTabs`, the page seed) referencing the removed `status`/`imageCard` from `initialGeneral`. Fix in Tasks 10 & 11.

- [ ] **Step 3: Commit (combine with Task 8)**

```bash
git add src/components/admin/tabs/GeneralTab
git commit -m "feat(admin/general-tab): WYSIWYG inline-edit layout"
```

(`pnpm build` still red here — fixed by next two tasks.)

---

## Task 10: Wire `TourEditTabs` to lift slug/title state and add Card panel

**Files:**

- Modify: `src/components/admin/TourEditTabs/TourEditTabs.tsx`

- [ ] **Step 1: Update imports and component**

Replace `TourEditTabs.tsx` with:

```tsx
'use client';

import {useState, useCallback} from 'react';
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';
import {routes, api, useNavigate, type TourTab} from '@/routes';
import {Tabs, TabPanel} from '@/components/ui';
import {GeneralTab} from '../tabs/GeneralTab';
import type {GeneralTabData} from '../tabs/GeneralTab';
import {CardTab, type CardTabFormData} from '../tabs/CardTab';
import {ItineraryTab} from '../tabs/ItineraryTab';
import {PricingTab} from '../tabs/PricingTab';
import {HighlightsTab} from '../tabs/HighlightsTab';
import {PerksTab} from '../tabs/PerksTab';
import {LocalePicker, type Locale} from '../LocalePicker';
import {AdminBreadcrumbs} from '../AdminBreadcrumbs';
import {savedSlot} from '@/lib/image-slot';

type TourEditTabsProps = {
  mode: 'create' | 'edit';
  tourId: string | null;
  activeTab: TourTab;
  destinations: Array<{id: string; name: string; heroImage: string}>;
  initialGeneral: GeneralTabData;
  initialCard: CardTabFormData;
  initialItinerary: VMT.ItineraryDay[];
  initialPricingGroups: VMT.PricingGroup[];
  initialHighlightIds: string[];
  initialIncludedPerkIds: string[];
  initialExcludedPerkIds: string[];
};

export function TourEditTabs({
  mode,
  tourId: initialTourId,
  activeTab,
  destinations,
  initialGeneral,
  initialCard,
  initialItinerary,
  initialPricingGroups,
  initialHighlightIds,
  initialIncludedPerkIds,
  initialExcludedPerkIds,
}: TourEditTabsProps) {
  const t = useTranslations('admin.tours.tabs');
  const navigate = useNavigate();
  const [tourId, setTourId] = useState<string | null>(initialTourId);
  const [destinationId, setDestinationId] = useState(
    initialGeneral.destinationId,
  );
  const [locale, setLocale] = useState<Locale>('en');

  const [slug, setSlug] = useState(initialGeneral.slug);
  const [title, setTitle] = useState(initialGeneral.title);
  const [pendingSlug, setPendingSlug] = useState<string | undefined>(undefined);

  const handleGeneralSave = useCallback(
    async (data: GeneralTabData): Promise<string> => {
      const isNew = mode === 'create' && !tourId;
      const result = isNew
        ? await api.admin.tours.create(
            data as unknown as Record<string, unknown>,
          )
        : await api.admin.tours.update(
            tourId!,
            data as unknown as Record<string, unknown>,
          );

      if (result.error) throw new Error(result.error);

      if (isNew && result.data) {
        const newId = String(result.data.id);
        setTourId(newId);
        navigate.replaceUrl(routes.admin.tours.edit, {
          id: newId,
          tab: 'general',
        });
        return newId;
      }
      return tourId!;
    },
    [mode, tourId, navigate],
  );

  const handleItinerarySave = useCallback(
    async (itinerary: VMT.ItineraryDay[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, {itinerary});
      if (error) throw new Error(error);
    },
    [tourId],
  );

  const handlePricingSave = useCallback(
    async (pricingGroups: VMT.PricingGroup[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, {pricingGroups});
      if (error) throw new Error(error);
    },
    [tourId],
  );

  const handleHighlightsSave = useCallback(
    async (highlightIds: string[]) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, {highlightIds});
      if (error) throw new Error(error);
    },
    [tourId],
  );

  const handlePerksSave = useCallback(
    async (data: {includedPerkIds: string[]; excludedPerkIds: string[]}) => {
      if (!tourId) throw new Error('Save General tab first');
      const {error} = await api.admin.tours.update(tourId, data);
      if (error) throw new Error(error);
    },
    [tourId],
  );

  const isTabDisabled = (tabId: TourTab) =>
    tabId !== 'general' && mode === 'create' && !tourId;

  const tourLabel = (mode === 'create' ? 'New tour' : title) || 'Untitled tour';

  // Build a preview tour for CardTab.
  const dest = destinations.find((d) => d.id === destinationId);
  const cardPreviewTour: VMT.Tour = {
    id: tourId ?? 'preview',
    slug,
    destinationId,
    destinationName: dest?.name ?? '',
    destinationHeroImage: dest?.heroImage ?? '',
    title: {en: title, vi: title},
    description: {en: '', vi: ''},
    imageUrl: '',
    images: [],
    duration: initialGeneral.duration,
    distance: initialGeneral.distance,
    transportation: initialGeneral.transportation,
    hotel: initialGeneral.hotel,
    guided: initialGeneral.guided,
    itinerary: [],
    pricingGroups: [],
    paymentDetails: {en: '', vi: ''},
    notes: [],
    mealsInfo: {en: '', vi: ''},
    status: 'PUBLISHED',
    highlights: [],
    included: [],
    excluded: [],
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
        <div className="min-w-0">
          <AdminBreadcrumbs
            items={[
              {label: 'Admin', href: routes.admin.dashboard.path()},
              {label: 'Tours', href: routes.admin.tours.list.path()},
              {
                label: slug || 'new',
                editable: {
                  fieldLabel: 'Slug',
                  onCommit: (next) => {
                    setSlug(next);
                    setPendingSlug(next);
                  },
                },
              },
            ]}
          />
          <h1 className="type-headline-sm truncate">{tourLabel}</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LocalePicker value={locale} onChange={setLocale} />
        </div>
      </div>

      <Tabs
        items={routes.admin.tours.edit.tabs.map((tab) => ({
          key: tab.key,
          label: t(tab.key),
          disabled: isTabDisabled(tab.key),
        }))}
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as TourTab;
          if (mode === 'create' && !tourId) {
            navigate.to(routes.admin.tours.new, {tab: next});
          } else {
            navigate.to(routes.admin.tours.edit, {id: tourId!, tab: next});
          }
        }}
      >
        <TabPanel tabKey="general">
          <GeneralTab
            initialData={initialGeneral}
            destinations={destinations}
            tourId={tourId}
            locale={locale}
            externalSlug={pendingSlug}
            onSlugChange={(s) => {
              setSlug(s);
              setPendingSlug(undefined);
            }}
            onTitleChange={setTitle}
            onDestinationChange={setDestinationId}
            onSave={handleGeneralSave}
          />
        </TabPanel>
        <TabPanel tabKey="card">
          <CardTab
            tourId={tourId}
            locale={locale}
            initialData={initialCard}
            previewTour={cardPreviewTour}
          />
        </TabPanel>
        <TabPanel tabKey="itinerary">
          <ItineraryTab
            initialData={initialItinerary}
            locale={locale}
            onSave={handleItinerarySave}
          />
        </TabPanel>
        <TabPanel tabKey="pricing">
          <PricingTab
            initialData={initialPricingGroups}
            locale={locale}
            onSave={handlePricingSave}
          />
        </TabPanel>
        <TabPanel tabKey="highlights">
          <HighlightsTab
            tourId={tourId}
            destinationId={destinationId}
            initialSelectedIds={initialHighlightIds}
            destinations={destinations}
            onSave={handleHighlightsSave}
          />
        </TabPanel>
        <TabPanel tabKey="perks">
          <PerksTab
            tourId={tourId}
            initialIncludedIds={initialIncludedPerkIds}
            initialExcludedIds={initialExcludedPerkIds}
            locale={locale}
            onSave={handlePerksSave}
          />
        </TabPanel>
      </Tabs>

      {/* Suppress unused-import warning placeholder (savedSlot kept for parent typing aid). */}
      {false && savedSlot('')}
    </div>
  );
}
```

(Note: the trailing `savedSlot` reference is a no-op kept only if Lint flags unused imports; remove the import line if not needed.)

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: errors only in the two page files (`[id]/edit/[tab].tsx` and `new/[tab].tsx`), which still produce the old `initialGeneral` shape and don't supply `initialCard`. Fix in Task 11.

- [ ] **Step 3: Commit (combined with Task 11)**

Skip a standalone commit; bundle with Task 11.

---

## Task 11: Update edit/new tour pages

**Files:**

- Modify: `src/pages/admin/tours/[id]/edit/[tab].tsx`
- Modify: `src/pages/admin/tours/new/[tab].tsx`

Drop `imageCard`/`status` from `initialGeneral`; add `initialCard`. Pass through `heroImage` from the destinations API response (already a property of the Prisma row returned by `/api/admin/destinations`).

- [ ] **Step 1: Edit `[id]/edit/[tab].tsx`**

Replace the body with:

```tsx
import {useEffect} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {TourEditTabs} from '@/components/Admin/TourEditTabs';
import {savedSlot} from '@/lib/image-slot';
import {isTourTab, type TourTab} from '@/routes';

type Destination = {id: string; name: string; heroImage: string};

export default function EditTour() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const tabParam = router.query.tab;
  const tab: TourTab =
    typeof tabParam === 'string' && isTourTab(tabParam) ? tabParam : 'general';

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

  if (!tour || !destinations) return null;

  const highlights = (tour.highlights as Array<{id: string}>) ?? [];
  const tourPerks =
    (tour.perks as Array<{perkId: string; bucket: 'INCLUDED' | 'EXCLUDED'}>) ??
    [];
  const initialIncludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'INCLUDED')
    .map((tp) => tp.perkId);
  const initialExcludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'EXCLUDED')
    .map((tp) => tp.perkId);

  const initialGeneral = {
    slug: tour.slug as string,
    destinationId: tour.destinationId as string,
    title: tour.title as string,
    titleVi: (tour.titleVi as string) ?? '',
    titleEn: (tour.titleEn as string) ?? '',
    duration: (tour.duration as number) ?? 1,
    distance: (tour.distance as number) ?? 0,
    descriptionVi: (tour.descriptionVi as string) ?? '',
    descriptionEn: (tour.descriptionEn as string) ?? '',
    transportation: (tour.transportation as string) ?? '',
    hotel: (tour.hotel as string) ?? '',
    guided: (tour.guided as string) ?? '',
  };

  const initialCard = {imageCard: savedSlot(tour.imageUrl as string | null)};

  return (
    <TourEditTabs
      activeTab={tab}
      mode="edit"
      tourId={tour.id as string}
      destinations={destinations}
      initialGeneral={initialGeneral}
      initialCard={initialCard}
      initialItinerary={(tour.itinerary as never) ?? []}
      initialPricingGroups={(tour.pricingGroups as never) ?? []}
      initialHighlightIds={highlights.map((h) => h.id)}
      initialIncludedPerkIds={initialIncludedPerkIds}
      initialExcludedPerkIds={initialExcludedPerkIds}
    />
  );
}

export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const tab = params?.tab;
  if (typeof tab !== 'string' || !isTourTab(tab)) return {notFound: true};
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
```

- [ ] **Step 2: Edit `new/[tab].tsx` analogously**

Apply the same changes: extend `Destination` with `heroImage`, drop `imageCard`/`status` from the new-tour seed, supply `initialCard: {imageCard: emptySlot()}` (use `emptySlot` from `@/lib/image-slot`). The structural edits mirror Step 1.

- [ ] **Step 3: Type-check**

Run: `pnpm build`
Expected: build passes.

- [ ] **Step 4: Commit (bundle Tasks 8 / 10 / 11)**

```bash
git add src/components/admin/tabs/GeneralTab \
        src/components/admin/TourEditTabs \
        src/pages/admin/tours/\[id\]/edit/\[tab\].tsx \
        src/pages/admin/tours/new/\[tab\].tsx
git commit -m "feat(admin/tour-edit): wire general WYSIWYG + card tab"
```

---

## Task 12: Delete `TourPreviewPanel`

**Files:**

- Delete: `src/components/admin/TourPreviewPanel/TourPreviewPanel.tsx`
- Delete: `src/components/admin/TourPreviewPanel/index.ts`
- Modify: `src/components/admin/index.ts` (remove the re-export if any)

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -rn "TourPreviewPanel" /Users/wentris/Documents/vietnam.moto.tour/src`
Expected: only the files about to be deleted match.

- [ ] **Step 2: Delete files**

```bash
git rm -r src/components/Admin/TourPreviewPanel
```

- [ ] **Step 3: Remove re-export if present**

Open `src/components/admin/index.ts` and delete any line referencing `TourPreviewPanel`. If absent, skip.

- [ ] **Step 4: Type-check**

Run: `pnpm build`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/index.ts
git commit -m "chore(admin): remove TourPreviewPanel"
```

---

## Task 13: Manual QA in dev server

**Files:** None

Type-check + tests don't cover layout/UX. Run a smoke pass.

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Open an existing tour in admin**

Navigate to `/admin/tours/<id>/edit/general`. Verify:

- Hero shows the destination hero image as background.
- Title, duration, distance, transportation are inline-editable; values reflect saved data.
- Destination chip top-left of hero opens the select; switching destination updates the hero background image immediately.
- Description renders as a textarea pre-filled with the current locale value; switching locale via the picker swaps the textarea content.
- Hotel + Guided are editable below description.
- Status pill is gone.
- Save General persists and clears the dirty marker.

- [ ] **Step 3: Open the breadcrumb slug edit**

Click the pencil next to the last breadcrumb segment. Edit and press Enter. Verify the General form's slug is now dirty. Save. Reload — URL still uses the old slug (expected; only the saved record is updated). Confirm the new slug shows after reload.

- [ ] **Step 4: Card tab**

Click `Card` tab. Upload a new image; preview updates. Save Card; reload; image persists.

- [ ] **Step 5: Create a new tour**

Navigate to `/admin/tours/new/general`. Verify other tabs (`Card`, `Itinerary`, etc.) are disabled until General is saved with the minimum required fields.

- [ ] **Step 6: Public page regression**

Open a published tour at `/tours/<slug>` (anonymously). Confirm hero, description, breadcrumbs, and price chip render exactly as before — no admin chrome, no edit affordances.

- [ ] **Step 7: Commit any cleanup**

If any small issues surfaced (typos, missing labels), fix and commit before proceeding.

---

## Task 14: Run full test + lint

**Files:** None

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: zero errors.

- [ ] **Step 2: Tests**

Run: `pnpm test`
Expected: all green, including the three new spec files.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Final commit if any auto-fixes occurred**

```bash
git add -u
git commit -m "chore: lint pass" || true
```

---

## Self-review notes

- **Spec coverage:**
  - "Slug → editable last breadcrumb" ✅ Tasks 6, 10.
  - "Status removed from General page" ✅ Tasks 8, 9, 11.
  - "Hero with destination select overlay" ✅ Tasks 5, 9.
  - "TourDescription inline-editable, locale-aware" ✅ Tasks 4, 9.
  - "Hotel + guided as trailing details block" ✅ Task 9.
  - "Card image moved to its own tab" ✅ Tasks 2, 3, 7, 10, 11.
  - "Single Save button at bottom" ✅ Task 9.
  - "Embedded-feel cues (dashed underlines, framed hero, no public CTAs)" ✅ Tasks 4, 5, 9 (input styling) and Task 5 (price chip / public breadcrumbs gated by `editable`).
  - "Global dirty indicator near tab nav" — currently footer-only. **Gap:** add a chip near the tab nav when General is dirty.

- **Gap fix:** add a sub-task at end of Task 9 to surface the `isDirty` flag up via `onTitleChange`-style callback or via a context, then render an `Unsaved` chip in `TourEditTabs` next to `LocalePicker`. This is a small follow-up; deferred to Task 15.

---

## Task 15: Surface a global dirty indicator

**Files:**

- Modify: `src/components/admin/tabs/GeneralTab/GeneralTab.tsx`
- Modify: `src/components/admin/TourEditTabs/TourEditTabs.tsx`

- [ ] **Step 1: Add `onDirtyChange` prop to `GeneralTab`**

In `GeneralTab.tsx`, accept `onDirtyChange?: (dirty: boolean) => void` and call it inside an effect that watches `isDirty`:

```tsx
useEffect(() => {
  onDirtyChange?.(isDirty);
}, [isDirty, onDirtyChange]);
```

- [ ] **Step 2: Track in `TourEditTabs`**

Add `const [generalDirty, setGeneralDirty] = useState(false);`. Pass `onDirtyChange={setGeneralDirty}` to `<GeneralTab />`. Render next to `LocalePicker`:

```tsx
{
  generalDirty && (
    <span className="type-label-sm text-amber-500">Unsaved changes</span>
  );
}
```

- [ ] **Step 3: Type-check + run**

Run: `pnpm build && pnpm test`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/tabs/GeneralTab src/components/admin/TourEditTabs
git commit -m "feat(admin): global dirty indicator next to locale picker"
```

---

## Task 16: Finishing the branch

- [ ] **Step 1: Invoke `superpowers:finishing-a-development-branch`**

Per project CLAUDE.md, run this at the end of every development task. Choose merge / PR / cleanup based on the prompt.
