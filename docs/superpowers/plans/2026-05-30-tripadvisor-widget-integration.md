# TripAdvisor Widget Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fabricated home testimonials with live TripAdvisor content and surface real reviews/rating/award trust signals across the home page and each tour detail page.

**Architecture:** One reusable `ui/TripAdvisorWidget` primitive injects TripAdvisor's official `wejs` script (script-injection mechanism ①) into a site-styled shell, keyed on `locationId`+`locale`+`variant` for SPA-safe re-init. Tours gain a nullable `tripadvisorLocationId` so each tour's own TA listing drives its reviews; the home page and per-tour fallback use the business-wide id from `contactInfo`. No Content API, no review storage.

**Tech Stack:** Next.js 16 Pages Router, React 19, TypeScript strict, Prisma + PostgreSQL, next-intl (DB-only translations), Jest + RTL, Tailwind v4.

---

## File Structure

**Create:**
- `src/components/ui/TripAdvisorWidget/index.ts` — re-export
- `src/components/ui/TripAdvisorWidget/TripAdvisorWidget.tsx` — public component (variant dispatch)
- `src/components/ui/TripAdvisorWidget/WidgetShell.tsx` — script-backed shell render-helper
- `src/components/ui/TripAdvisorWidget/useTripAdvisorWidget.ts` — script-injection lifecycle hook
- `src/components/ui/TripAdvisorWidget/buildWidgetUrl.ts` — pure `wejs` URL + lang/wtype mapping
- `src/components/ui/TripAdvisorWidget/buildWidgetUrl.spec.ts` — pure-function tests
- `src/components/ui/TripAdvisorWidget/TripAdvisorWidget.spec.tsx` — component tests

**Modify:**
- `prisma/schema.prisma` — add `tripadvisorLocationId String?` to `model Tour`
- `src/utils/contact.ts` — add `tripadvisorLocationId` to `ContactInfo` type
- `src/utils/index.ts` — add `tripadvisorLocationId` value to the `contactInfo` constant
- `src/domain/tour/mapper.ts` — pass `tripadvisorLocationId` through `toTour`
- `src/components/ui/index.ts` — export `TripAdvisorWidget`
- `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts` — schema + type field
- `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx` — TextInput + previewTour field
- `src/components/Admin/TourEditTabs/TourEditTabs.tsx` — cardPreviewTour field
- `src/pages/admin/tours/new/[tab].tsx` — `emptyGeneral` field
- `src/pages/admin/tours/[id]/edit/[tab].tsx` — `initialGeneral` field
- `src/pages/api/admin/tours/index.ts` — persist field on create
- `src/pages/api/admin/tours/[id].ts` — persist field on update
- `src/components/home/Testimonials/Testimonials.tsx` — replace mock quotes with widget + badges + CTA
- `src/components/home/Testimonials/Testimonials.spec.tsx` — create / update
- `src/pages/tours/[slug].tsx` — per-tour reviews widget + rating badge + CTA
- `prisma/seed-home-translations.ts` — new home + common labels
- the tourDetail-namespace seed — new tourDetail label

---

## Task 1: Schema + domain plumbing for `tripadvisorLocationId`

**Files:**
- Modify: `prisma/schema.prisma` (Tour model)
- Modify: `src/domain/tour/mapper.ts`
- Modify: `src/utils/contact.ts`
- Modify: `src/utils/index.ts`
- Modify: `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx` (previewTour)
- Modify: `src/components/Admin/TourEditTabs/TourEditTabs.tsx` (cardPreviewTour)
- Test: `src/domain/tour/mapper.spec.ts`

> Note: `Tour` in `src/domain/tour/index.ts` is `Omit<PrismaTour, …> & {…}`. `tripadvisorLocationId` is **not** in the omit list and is a plain `String?`, so it flows into the `Tour` type automatically once added to Prisma — no edit to `index.ts`. But `toTour` enumerates fields explicitly, so the mapper MUST add it, and the two `VMT.Tour` literal objects (previewTour / cardPreviewTour) MUST add it or the build breaks.

- [ ] **Step 1: Write the failing mapper test**

Create `src/domain/tour/mapper.spec.ts` (if it exists, add this `describe` block to it):

```typescript
import {toTour, type PrismaTourWithRelations} from './mapper';

function makeRow(
  overrides: Partial<PrismaTourWithRelations> = {},
): PrismaTourWithRelations {
  return {
    id: 't1',
    slug: 'ha-giang',
    destinationId: 'd1',
    titleVi: 'VI',
    titleEn: 'EN',
    imageUrl: null,
    duration: 3,
    distance: 200,
    descriptionVi: '',
    descriptionEn: '',
    transportation: '',
    hotel: '',
    guided: '',
    images: [],
    itinerary: [],
    pricingGroups: [],
    paymentDetails: {},
    notes: [],
    mealsInfo: {},
    status: 'PUBLISHED',
    tripadvisorLocationId: '5501636',
    createdAt: new Date(),
    updatedAt: new Date(),
    destination: {
      id: 'd1',
      nameVi: 'VI',
      nameEn: 'EN',
      heroImage: '',
    } as PrismaTourWithRelations['destination'],
    highlights: [],
    perks: [],
    ...overrides,
  } as PrismaTourWithRelations;
}

describe('toTour tripadvisorLocationId', () => {
  it('passes tripadvisorLocationId through', () => {
    expect(toTour(makeRow()).tripadvisorLocationId).toBe('5501636');
  });

  it('preserves null tripadvisorLocationId', () => {
    expect(
      toTour(makeRow({tripadvisorLocationId: null})).tripadvisorLocationId,
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false src/domain/tour/mapper.spec.ts`
Expected: FAIL — either a type error on `tripadvisorLocationId` (field not on Prisma type yet) or `undefined` returned.

- [ ] **Step 3: Add the Prisma field**

In `prisma/schema.prisma`, inside `model Tour`, add a line after `status`:

```prisma
  status         TourStatus  @default(DRAFT)
  tripadvisorLocationId String?
  createdAt      DateTime    @default(now())
```

- [ ] **Step 4: Generate client + create migration**

Run: `pnpm prisma generate && pnpm prisma migrate dev --name tour_tripadvisor_location_id`
Expected: migration created, `@prisma/client` regenerated with `tripadvisorLocationId` on `Tour`.

- [ ] **Step 5: Pass the field through the mapper**

In `src/domain/tour/mapper.ts`, in the object returned by `toTour`, add after `guided: row.guided,`:

```typescript
    guided: row.guided,
    tripadvisorLocationId: row.tripadvisorLocationId,
```

- [ ] **Step 6: Fix the two preview Tour literals (build-blockers)**

In `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx`, in the `previewTour: VMT.Tour` object, add after `guided: values.guided,`:

```typescript
    guided: values.guided,
    tripadvisorLocationId: null,
```

In `src/components/Admin/TourEditTabs/TourEditTabs.tsx`, in the `cardPreviewTour: VMT.Tour` object, add after `guided: initialGeneral.guided,`:

```typescript
    guided: initialGeneral.guided,
    tripadvisorLocationId: null,
```

- [ ] **Step 7: Add to ContactInfo type + constant**

In `src/utils/contact.ts`, add to the `ContactInfo` type after `tripadvisorLink: string;`:

```typescript
  tripadvisorLink: string;
  tripadvisorLocationId: string;
```

In `src/utils/index.ts`, in the `contactInfo` constant, add after the `tripadvisorLink` value (numeric id from the `d5501636` listing):

```typescript
  tripadvisorLink:
    'https://www.tripadvisor.com/Attraction_Review-g293928-d5501636-Reviews-Vietnam_Motorcycle_Tour-Nha_Trang_Khanh_Hoa_Province.html',
  tripadvisorLocationId: '5501636',
```

- [ ] **Step 8: Run mapper test — verify it passes**

Run: `pnpm test -- --watchAll=false src/domain/tour/mapper.spec.ts`
Expected: PASS (both assertions).

- [ ] **Step 9: Update the contact test if it enumerates ContactInfo**

Run: `pnpm test -- --watchAll=false src/utils/index.spec.ts`
Expected: PASS. If a test asserts the exact shape/keys of `contactInfo`, add:

```typescript
  it('has a numeric TripAdvisor location id', () => {
    expect(contactInfo.tripadvisorLocationId).toMatch(/^\d+$/);
  });
```

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/domain/tour/mapper.ts src/domain/tour/mapper.spec.ts src/utils/contact.ts src/utils/index.ts src/utils/index.spec.ts src/components/Admin/tabs/GeneralTab/GeneralTab.tsx src/components/Admin/TourEditTabs/TourEditTabs.tsx
git commit -m "feat(tours): add tripadvisorLocationId field + contact location id"
```

---

## Task 2: `buildWidgetUrl` pure helper

**Files:**
- Create: `src/components/ui/TripAdvisorWidget/buildWidgetUrl.ts`
- Test: `src/components/ui/TripAdvisorWidget/buildWidgetUrl.spec.ts`

> The exact TripAdvisor `wtype` tokens are confirmed from TripAdvisor's widget generator during testing; the map below uses TA's documented self-serve types and is centralized here as the single place to adjust. `cta` is NOT a script widget — it renders as a plain link in the component, so `buildWidgetUrl` never receives it.

- [ ] **Step 1: Write the failing test**

```typescript
import {buildWidgetUrl, WTYPE} from './buildWidgetUrl';

describe('buildWidgetUrl', () => {
  it('includes the locationId', () => {
    const url = buildWidgetUrl({variant: 'reviews', locationId: '5501636', locale: 'en'});
    expect(url).toContain('locationId=5501636');
  });

  it('maps locale to a TripAdvisor lang token', () => {
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'vi'})).toContain('lang=vi');
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'en'})).toContain('lang=en_US');
  });

  it('uses the wtype for the variant', () => {
    expect(buildWidgetUrl({variant: 'reviews', locationId: '1', locale: 'en'})).toContain(`wtype=${WTYPE.reviews}`);
    expect(buildWidgetUrl({variant: 'travelersChoice', locationId: '1', locale: 'en'})).toContain(`wtype=${WTYPE.travelersChoice}`);
  });

  it('points at the jscache wejs endpoint', () => {
    expect(buildWidgetUrl({variant: 'rating', locationId: '1', locale: 'en'})).toMatch(/^https:\/\/www\.jscache\.com\/wejs\?/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false src/components/ui/TripAdvisorWidget/buildWidgetUrl.spec.ts`
Expected: FAIL — `Cannot find module './buildWidgetUrl'`.

- [ ] **Step 3: Implement the helper**

```typescript
export type ScriptVariant = 'reviews' | 'rating' | 'travelersChoice';

export const WTYPE: Record<ScriptVariant, string> = {
  reviews: 'cdsscrollingravewide',
  rating: 'selfserveprop',
  travelersChoice: 'cdspromo',
};

const LANG: Record<'en' | 'vi', string> = {
  en: 'en_US',
  vi: 'vi',
};

export function buildWidgetUrl(args: {
  variant: ScriptVariant;
  locationId: string;
  locale: 'en' | 'vi';
}) {
  const params = new URLSearchParams({
    wtype: WTYPE[args.variant],
    locationId: args.locationId,
    lang: LANG[args.locale],
    border: 'false',
    display_version: '2',
  });
  return `https://www.jscache.com/wejs?${params.toString()}`;
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `pnpm test -- --watchAll=false src/components/ui/TripAdvisorWidget/buildWidgetUrl.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/TripAdvisorWidget/buildWidgetUrl.ts src/components/ui/TripAdvisorWidget/buildWidgetUrl.spec.ts
git commit -m "feat(ui): TripAdvisor wejs URL builder"
```

---

## Task 3: `useTripAdvisorWidget` lifecycle hook

**Files:**
- Create: `src/components/ui/TripAdvisorWidget/useTripAdvisorWidget.ts`

> Tested indirectly via the component in Task 4 (a bare hook needs a host component). Uses `replaceChildren()` (NOT `innerHTML`) to clear the container — no XSS surface, complies with the project's no-`innerHTML` rule.

- [ ] **Step 1: Implement the hook**

```typescript
import {useEffect, useId, useRef} from 'react';
import {buildWidgetUrl, type ScriptVariant} from './buildWidgetUrl';

// CSP allowlist (no CSP today). If a Content-Security-Policy is ever added,
// script-src/connect-src/frame-src must include:
//   https://www.jscache.com https://static.tacdn.com https://www.tripadvisor.com
export function useTripAdvisorWidget(args: {
  variant: ScriptVariant;
  locationId: string;
  locale: 'en' | 'vi';
}) {
  const {variant, locationId, locale} = args;
  const rawId = useId();
  const containerId = `ta-widget-${rawId.replace(/[:]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();

    const script = document.createElement('script');
    script.src = buildWidgetUrl({variant, locationId, locale});
    script.async = true;
    script.setAttribute('data-ta-widget', containerId);
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [variant, locationId, locale, containerId]);

  return {containerId, containerRef};
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: compiles (the hook is not yet consumed; full build re-runs after Task 4).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TripAdvisorWidget/useTripAdvisorWidget.ts
git commit -m "feat(ui): TripAdvisor widget lifecycle hook"
```

---

## Task 4: `TripAdvisorWidget` component + export

**Files:**
- Create: `src/components/ui/TripAdvisorWidget/TripAdvisorWidget.tsx`
- Create: `src/components/ui/TripAdvisorWidget/WidgetShell.tsx`
- Create: `src/components/ui/TripAdvisorWidget/index.ts`
- Create: `src/components/ui/TripAdvisorWidget/TripAdvisorWidget.spec.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Write the failing component test**

```tsx
import {render, screen} from '@testing-library/react';
import {TripAdvisorWidget} from './TripAdvisorWidget';

describe('TripAdvisorWidget', () => {
  it('renders a script-backed container for the reviews variant', () => {
    const {container} = render(
      <TripAdvisorWidget variant="reviews" locationId="5501636" locale="en" />,
    );
    const script = container.querySelector('script[src*="locationId=5501636"]');
    expect(script).not.toBeNull();
  });

  it('renders a link to the listing for the cta variant', () => {
    render(
      <TripAdvisorWidget
        variant="cta"
        locationId="5501636"
        locale="en"
        href="https://www.tripadvisor.com/x"
        ctaLabel="Read reviews"
      />,
    );
    const link = screen.getByRole('link', {name: 'Read reviews'});
    expect(link).toHaveAttribute('href', 'https://www.tripadvisor.com/x');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false src/components/ui/TripAdvisorWidget/TripAdvisorWidget.spec.tsx`
Expected: FAIL — `Cannot find module './TripAdvisorWidget'`.

- [ ] **Step 3: Implement the shell render-helper**

Create `src/components/ui/TripAdvisorWidget/WidgetShell.tsx`:

```tsx
import {TripAdvisorIcon} from '@/components/ui/TripAdvisorIcon';
import {useTripAdvisorWidget} from './useTripAdvisorWidget';
import type {ScriptVariant} from './buildWidgetUrl';

type WidgetShellProps = {
  variant: ScriptVariant;
  locationId: string;
  locale: 'en' | 'vi';
  className?: string;
  eyebrow?: string;
};

export function WidgetShell(props: WidgetShellProps) {
  const {variant, locationId, locale, className, eyebrow} = props;
  const {containerId, containerRef} = useTripAdvisorWidget({
    variant,
    locationId,
    locale,
  });

  return (
    <div className={`min-h-32 ${className ?? ''}`}>
      {eyebrow && (
        <span className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary">
          <TripAdvisorIcon className="h-4 w-auto" />
          {eyebrow}
        </span>
      )}
      <div id={containerId} ref={containerRef} />
    </div>
  );
}
```

- [ ] **Step 4: Implement the public component**

Create `src/components/ui/TripAdvisorWidget/TripAdvisorWidget.tsx`:

```tsx
import {TripAdvisorIcon} from '@/components/ui/TripAdvisorIcon';
import {Button} from '@/components/ui/Button';
import {WidgetShell} from './WidgetShell';
import type {ScriptVariant} from './buildWidgetUrl';

type TripAdvisorWidgetProps = {
  variant: ScriptVariant | 'cta';
  locationId: string;
  locale: 'en' | 'vi';
  className?: string;
  eyebrow?: string;
  href?: string;
  ctaLabel?: string;
};

export function TripAdvisorWidget(props: TripAdvisorWidgetProps) {
  const {variant, locationId, locale, className, eyebrow, href, ctaLabel} =
    props;

  if (variant === 'cta') {
    return (
      <Button
        variant="secondary"
        href={href}
        icon={<TripAdvisorIcon className="h-4 w-auto" />}
        className={className}
      >
        {ctaLabel}
      </Button>
    );
  }

  return (
    <WidgetShell
      variant={variant}
      locationId={locationId}
      locale={locale}
      className={className}
      eyebrow={eyebrow}
    />
  );
}
```

> If `Button` does not accept `href`/`icon`, open `src/components/ui/Button/Button.tsx`, confirm the actual prop names, and adjust this call. Do not change the test's expected link text.

- [ ] **Step 5: Create the re-export**

`src/components/ui/TripAdvisorWidget/index.ts`:

```typescript
export {TripAdvisorWidget} from './TripAdvisorWidget';
```

- [ ] **Step 6: Add to the ui barrel**

In `src/components/ui/index.ts`, after the `TripAdvisorIcon` export line:

```typescript
export {TripAdvisorWidget} from './TripAdvisorWidget';
```

- [ ] **Step 7: Run test — verify it passes**

Run: `pnpm test -- --watchAll=false src/components/ui/TripAdvisorWidget/TripAdvisorWidget.spec.tsx`
Expected: PASS (both assertions).

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/TripAdvisorWidget src/components/ui/index.ts
git commit -m "feat(ui): TripAdvisorWidget primitive (reviews/rating/award/cta)"
```

---

## Task 5: Admin — persist `tripadvisorLocationId`

**Files:**
- Modify: `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts`
- Modify: `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx`
- Modify: `src/pages/admin/tours/new/[tab].tsx`
- Modify: `src/pages/admin/tours/[id]/edit/[tab].tsx`
- Modify: `src/pages/api/admin/tours/index.ts`
- Modify: `src/pages/api/admin/tours/[id].ts`
- Test: `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.spec.ts`

- [ ] **Step 1: Write the failing form-utils test**

Create `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.spec.ts`:

```typescript
import {generalTabSchema} from './GeneralTab.form-utils';

describe('generalTabSchema tripadvisorLocationId', () => {
  const base = {
    slug: 's',
    destinationId: 'd',
    titleVi: 'v',
    titleEn: 'e',
    duration: 1,
    distance: 0,
    descriptionVi: '',
    descriptionEn: '',
    transportation: '',
    hotel: '',
    guided: '',
  };

  it('accepts a tripadvisorLocationId', async () => {
    const v = await generalTabSchema.validate({...base, tripadvisorLocationId: '5501636'});
    expect(v.tripadvisorLocationId).toBe('5501636');
  });

  it('accepts an omitted tripadvisorLocationId', async () => {
    await expect(generalTabSchema.validate(base)).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.spec.ts`
Expected: FAIL — first assertion gets `undefined` (field stripped by yup).

- [ ] **Step 3: Add the field to the schema**

In `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts`, add inside `yup.object({…})` after `guided`:

```typescript
  guided: yup.string().defined(),
  tripadvisorLocationId: yup.string().optional(),
```

- [ ] **Step 4: Run test — verify it passes**

Run: `pnpm test -- --watchAll=false src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.spec.ts`
Expected: PASS.

- [ ] **Step 5: Add default values in both admin pages**

In `src/pages/admin/tours/new/[tab].tsx`, in `emptyGeneral`, after `guided: '',`:

```typescript
  guided: '',
  tripadvisorLocationId: '',
```

In `src/pages/admin/tours/[id]/edit/[tab].tsx`, in `initialGeneral`, after the `guided` line:

```typescript
    guided: (tourRecord.guided as string) ?? '',
    tripadvisorLocationId: (tourRecord.tripadvisorLocationId as string) ?? '',
```

- [ ] **Step 6: Add the TextInput to GeneralTab**

In `src/components/Admin/tabs/GeneralTab/GeneralTab.tsx`, inside the `<section className="grid …">` after the `Guided` TextInput block:

```tsx
              <TextInput
                label="TripAdvisor location ID"
                placeholder="e.g. 5501636"
                value={values.tripadvisorLocationId ?? ''}
                onChange={(e) =>
                  setValue('tripadvisorLocationId', e.target.value, {
                    shouldDirty: true,
                  })
                }
              />
```

- [ ] **Step 7: Persist on create (POST)**

In `src/pages/api/admin/tours/index.ts`, in `prisma.tour.create({data: {…}})`, after `status: data.status ?? 'DRAFT',`:

```typescript
        status: data.status ?? 'DRAFT',
        tripadvisorLocationId: data.tripadvisorLocationId || null,
```

- [ ] **Step 8: Persist on update (PUT)**

In `src/pages/api/admin/tours/[id].ts`, add `'tripadvisorLocationId'` to the `fields` array after `'status'`:

```typescript
      'status',
      'tripadvisorLocationId',
```

- [ ] **Step 9: Type-check the admin flow**

Run: `pnpm build`
Expected: compiles. (`GeneralTabFormData` now includes the optional field; the preview Tour literals from Task 1 already carry `tripadvisorLocationId: null`.)

- [ ] **Step 10: Commit**

```bash
git add src/components/Admin/tabs/GeneralTab src/pages/admin/tours src/pages/api/admin/tours
git commit -m "feat(admin): edit tripadvisorLocationId per tour"
```

---

## Task 6: Home translations + replace mock testimonials with widget

**Files:**
- Modify: `prisma/seed-home-translations.ts`
- Modify: `src/components/home/Testimonials/Testimonials.tsx`
- Test: `src/components/home/Testimonials/Testimonials.spec.tsx`

> DB-only translations: new strings MUST be seeded into the DB, not hardcoded. Check `common.*` first — confirm via `grep -rn "readReviews" prisma/` that none exists, then add the CTA under `common` so the tour page (Task 7) reuses it. The eyebrow/title reuse existing `home.testimonialsEyebrow` / `home.testimonialsTitle` keys already in the DB.

- [ ] **Step 1: Add seed rows**

In `prisma/seed-home-translations.ts`, add to the entries array:

```typescript
  {
    namespace: 'home',
    key: 'reviewsAttribution',
    valueVi: 'Đánh giá thực tế trên TripAdvisor',
    valueEn: 'Real reviews on TripAdvisor',
  },
  {
    namespace: 'common',
    key: 'readReviews',
    valueVi: 'Đọc đánh giá',
    valueEn: 'Read reviews',
  },
```

- [ ] **Step 2: Seed the DB**

Run: `npx tsx prisma/seed-home-translations.ts`
Expected: log lines upserting `home.reviewsAttribution` and `common.readReviews`.

- [ ] **Step 3: Write the failing Testimonials test**

Replace/create `src/components/home/Testimonials/Testimonials.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {Testimonials} from './Testimonials';
import {contactInfo} from '@/utils';

jest.mock('framer-motion', () => ({
  motion: new Proxy({}, {get: () => (p: {children?: React.ReactNode}) => p.children}),
}));

function renderWithIntl() {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{
        home: {testimonialsEyebrow: 'EB', testimonialsTitle: 'TITLE', reviewsAttribution: 'Real reviews on TripAdvisor'},
        common: {readReviews: 'Read reviews'},
      }}
    >
      <Testimonials />
    </NextIntlClientProvider>,
  );
}

describe('Testimonials', () => {
  it('renders the live TripAdvisor reviews widget for the business location', () => {
    const {container} = renderWithIntl();
    expect(
      container.querySelector(`script[src*="locationId=${contactInfo.tripadvisorLocationId}"]`),
    ).not.toBeNull();
  });

  it('links to the TripAdvisor listing', () => {
    renderWithIntl();
    expect(screen.getByRole('link', {name: 'Read reviews'})).toHaveAttribute(
      'href',
      contactInfo.tripadvisorLink,
    );
  });

  it('shows no fabricated reviewer names', () => {
    renderWithIntl();
    expect(screen.queryByText(/Marcus Lindqvist/)).toBeNull();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false src/components/home/Testimonials/Testimonials.spec.tsx`
Expected: FAIL — no widget script; "Marcus Lindqvist" still present.

- [ ] **Step 5: Rewrite Testimonials**

Replace the full contents of `src/components/home/Testimonials/Testimonials.tsx` (deletes `MOCK_TESTIMONIALS`, the `Testimonial` type, and the quote grid):

```tsx
import {motion} from 'framer-motion';
import {useTranslations, useLocale} from 'next-intl';
import {TripAdvisorWidget} from '@/components/ui';
import {contactInfo} from '@/utils';
import {fadeInUp} from '@/utils/motion-variants';

export function Testimonials() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = (useLocale() as 'en' | 'vi') ?? 'vi';

  return (
    <section className="bg-surface-deep py-20 lg:py-28 border-y border-on-surface-tertiary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-2 border-primary pl-4">
          <motion.span
            className="font-mono text-xs uppercase tracking-[0.05em] text-on-surface-secondary block"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('testimonialsEyebrow')}
          </motion.span>
          <motion.h2
            className="font-display text-2xl lg:text-4xl font-bold uppercase tracking-[0.05em] text-on-surface mt-2"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true}}
          >
            {t('testimonialsTitle')}
          </motion.h2>
        </div>

        <div className="flex flex-col gap-4">
          <TripAdvisorWidget
            variant="rating"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
          />
          <TripAdvisorWidget
            variant="travelersChoice"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
          />
          <TripAdvisorWidget
            variant="reviews"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
            eyebrow={t('reviewsAttribution')}
          />
          <TripAdvisorWidget
            variant="cta"
            locationId={contactInfo.tripadvisorLocationId}
            locale={locale}
            href={contactInfo.tripadvisorLink}
            ctaLabel={tCommon('readReviews')}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Run test — verify it passes**

Run: `pnpm test -- --watchAll=false src/components/home/Testimonials/Testimonials.spec.tsx`
Expected: PASS (all three).

- [ ] **Step 7: Commit**

```bash
git add prisma/seed-home-translations.ts src/components/home/Testimonials
git commit -m "feat(home): replace fabricated testimonials with live TripAdvisor widgets"
```

---

## Task 7: Tour detail — per-tour reviews + rating badge + CTA

**Files:**
- Modify: `src/pages/tours/[slug].tsx`
- Modify: the tourDetail-namespace seed (run `grep -rln "namespace: 'tourDetail'" prisma/` to locate; if none, add the row to `prisma/seed-home-translations.ts` with `namespace: 'tourDetail'` — the seed scripts are namespace-agnostic upserters)
- Test: `src/pages/tours/[slug].review-widget.spec.tsx`

> Reuse `common.readReviews` from Task 6 for the CTA. Add `tourDetail.reviewsTitle` for the section heading after confirming (grep) no existing equivalent.

- [ ] **Step 1: Add the tourDetail seed row**

Add to the located seed file:

```typescript
  {
    namespace: 'tourDetail',
    key: 'reviewsTitle',
    valueVi: 'Đánh giá trên TripAdvisor',
    valueEn: 'TripAdvisor reviews',
  },
```

- [ ] **Step 2: Seed the DB**

Run: `npx tsx prisma/<located-seed-file>.ts`
Expected: upsert log for `tourDetail.reviewsTitle`.

- [ ] **Step 3: Write the failing test**

Create `src/pages/tours/[slug].review-widget.spec.tsx`:

```tsx
import {render} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import TourDetail from './[slug]';
import {makeTour} from '@/test-utils/factories';

jest.mock('next/router', () => ({useRouter: () => ({locale: 'en'})}));

function renderTour(tripadvisorLocationId: string | null) {
  const tour = {...makeTour(), tripadvisorLocationId};
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{
        tourDetail: {reviewsTitle: 'TripAdvisor reviews', pricingPerPerson: '/person'},
        common: {readReviews: 'Read reviews'},
        meta: {tourDetailTitle: 'x'},
      }}
    >
      <TourDetail tour={tour} isAdmin={false} />
    </NextIntlClientProvider>,
  );
}

describe('tour detail TripAdvisor reviews', () => {
  it('uses the tour-specific location id when present', () => {
    const {container} = renderTour('9999999');
    expect(container.querySelector('script[src*="locationId=9999999"]')).not.toBeNull();
  });

  it('falls back to the business location id when the tour has none', () => {
    const {container} = renderTour(null);
    expect(container.querySelector('script[src*="locationId=5501636"]')).not.toBeNull();
  });
});
```

> Check `src/test-utils/factories.ts` for the tour factory's actual export name (the file already references a TA link, so a tour factory exists). Use the real name. Ensure the factory includes the fields `[slug].tsx` reads (`description`, `title`, `pricingGroups`, `highlights`, `itinerary`, `included`, `excluded`, `notes`, `mealsInfo`, `paymentDetails`, `status`) and `tripadvisorLocationId`; extend it if needed.

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test -- --watchAll=false "src/pages/tours/[slug].review-widget.spec.tsx"`
Expected: FAIL — no widget script.

- [ ] **Step 5: Add the `tCommon` hook + import**

In `src/pages/tours/[slug].tsx`, add the import near the other `@/components/ui`-style imports:

```tsx
import {TripAdvisorWidget} from '@/components/ui';
```

Add the common-namespace hook right after the existing `const t = useTranslations('tourDetail');`:

```tsx
  const t = useTranslations('tourDetail');
  const tCommon = useTranslations('common');
```

(`contactInfo` is already imported in this file.)

- [ ] **Step 6: Add the rating badge in the sticky aside**

In the `<aside>`, immediately after the `<div className="hidden lg:block"><TourCTA …/></div>` block:

```tsx
                  <div className="hidden lg:block">
                    <TourCTA tourTitle={tourTitle} />
                  </div>
                  <TripAdvisorWidget
                    variant="rating"
                    locationId={tour.tripadvisorLocationId ?? contactInfo.tripadvisorLocationId}
                    locale={locale}
                  />
```

- [ ] **Step 7: Add the reviews block + CTA in main column part B**

In `<div className="lg:col-start-1 lg:row-start-2">`, after the `<TourIncluded …/>` element:

```tsx
              <TourIncluded
                included={tour.included}
                excluded={tour.excluded}
                locale={locale}
              />
              <section className="mt-12">
                <h2 className="font-display text-2xl lg:text-3xl font-bold uppercase tracking-[0.05em] text-on-surface mb-6">
                  {t('reviewsTitle')}
                </h2>
                <TripAdvisorWidget
                  variant="reviews"
                  locationId={tour.tripadvisorLocationId ?? contactInfo.tripadvisorLocationId}
                  locale={locale}
                />
                <div className="mt-6">
                  <TripAdvisorWidget
                    variant="cta"
                    locationId={tour.tripadvisorLocationId ?? contactInfo.tripadvisorLocationId}
                    locale={locale}
                    href={contactInfo.tripadvisorLink}
                    ctaLabel={tCommon('readReviews')}
                  />
                </div>
              </section>
```

- [ ] **Step 8: Run test — verify it passes**

Run: `pnpm test -- --watchAll=false "src/pages/tours/[slug].review-widget.spec.tsx"`
Expected: PASS (both).

- [ ] **Step 9: Commit**

```bash
git add "src/pages/tours/[slug].tsx" "src/pages/tours/[slug].review-widget.spec.tsx" prisma/
git commit -m "feat(tours): per-tour TripAdvisor reviews + rating badge + CTA on detail page"
```

---

## Task 8: Full verification + CSP confirmation

**Files:** none beyond prior tasks (verification only).

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: no errors. Fix any `cursor-pointer`, `interface`, inline-style, or raw-button violations the new code introduced.

- [ ] **Step 2: Full type-check + build**

Run: `pnpm build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 3: Full test suite**

Run: `pnpm test -- --watchAll=false`
Expected: all pass, including pre-existing `Header`/`Footer` TripAdvisor-link specs (unchanged) and the new widget specs.

- [ ] **Step 4: Manual smoke (dev server)**

Run: `pnpm dev`, then verify in the browser:
- Home: rating badge, Travelers' Choice badge, live reviews, and a "Read reviews" link render in the testimonials section; no "Marcus/Aisha/Daniel" quotes remain.
- A tour with a `tripadvisorLocationId` set in admin shows that listing's reviews; a tour without one shows the business-wide reviews.
- Toggle locale vi/en and navigate tour→tour — the widget re-renders (no stale/blank box). This is the SPA re-init risk; if a widget goes blank on client-side nav, flip the affected variant to the iframe-isolation fallback (spec §②): in `useTripAdvisorWidget`, render the `wejs` script inside an `<iframe srcdoc>` instead of injecting into the page DOM.

- [ ] **Step 5: Final commit (only if smoke fixes were needed)**

```bash
git add -A
git commit -m "chore(tripadvisor): lint/build/smoke fixes"
```

---

## Self-Review Notes

- **Spec coverage:** schema field (T1), business-wide id (T1), reusable primitive + hook + iframe-fallback hook-point (T2–T4, T8), home replacement (T6), per-tour detail (T7), admin field (T5), i18n via DB + `common.*` reuse (T6/T7), CSP allowlist documented in hook comment (T3) + spec, behavior-only tests throughout (no class/style assertions). ✅
- **Iframe fallback (②):** scoped as a smoke-test contingency (T8 Step 4), not pre-built — YAGNI until CSS bleed / SPA breakage is actually observed; localized to `useTripAdvisorWidget`.
- **Type consistency:** `tripadvisorLocationId` (string|null on domain/Prisma, optional string in the admin form), `buildWidgetUrl` / `WTYPE` / `ScriptVariant`, `useTripAdvisorWidget` → `{containerId, containerRef}` used consistently across tasks.
- **External-id value:** `contactInfo.tripadvisorLocationId = '5501636'` (numeric form the `wejs` widget expects), distinct from the human `tripadvisorLink` URL.
- **No-`innerHTML`:** hook clears the container with `replaceChildren()`, satisfying the project XSS rule.
```