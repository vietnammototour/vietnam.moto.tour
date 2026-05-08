# Tab Routes Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize admin tab definitions in `src/routes/index.ts` and make active tab a URL path segment (`/admin/tours/[id]/edit/[tab]`).

**Architecture:** Add a `tabs` property to each tabbed route node holding readonly tab descriptors `{key, labelKey}`. Path builders accept an optional `tab` arg. Pages move to `[tab].tsx` files with server-side `getServerSideProps` validation/redirect. Components become controlled (active tab via prop) and emit navigation on change.

**Tech Stack:** Next.js 16 (Pages Router), React 19, next-intl 4, TypeScript strict, Prisma (DB-only translations).

---

## File Structure

**Modified:**

- `src/routes/index.ts` — add `TabDescriptor`, `TOUR_TABS`, `DESTINATION_TABS`, type guards, `tabs` field on edit/new route nodes, `useActiveTab` hook
- `src/components/Admin/TourEditTabs/TourEditTabs.tsx` — controlled `activeTab` prop, registry-driven items, navigate on change
- `src/components/Admin/DestinationEditTabs/DestinationEditTabs.tsx` — same shape
- `scripts/migrate-perks-translations.ts` — extend seed list (or new sibling script — see Task 2 note)

**Created:**

- `src/pages/admin/tours/[id]/edit/[tab].tsx` (replaces `edit.tsx`)
- `src/pages/admin/tours/[id]/edit/index.tsx` (redirect shim)
- `src/pages/admin/tours/new/[tab].tsx` (replaces `new.tsx`)
- `src/pages/admin/tours/new/index.tsx` (redirect shim)
- `src/pages/admin/destinations/[id]/edit/[tab].tsx`
- `src/pages/admin/destinations/[id]/edit/index.tsx`
- `src/pages/admin/destinations/new/[tab].tsx`
- `src/pages/admin/destinations/new/index.tsx`
- `scripts/migrate-tab-translations.ts` (DB seed for new tab labels)

**Deleted:**

- `src/pages/admin/tours/[id]/edit.tsx`
- `src/pages/admin/tours/new.tsx`
- `src/pages/admin/destinations/[id]/edit.tsx`
- `src/pages/admin/destinations/new.tsx`

---

### Task 1: Add tab registry, types, guards, hook to `src/routes/index.ts`

**Files:**

- Modify: `src/routes/index.ts`

- [ ] **Step 1: Add type + descriptor arrays + guards at top of file (after imports, before `routes`)**

```ts
type TabDescriptor<K extends string> = {
  key: K;
  labelKey: string;
};

const TOUR_TABS = [
  {key: 'general', labelKey: 'admin.tours.tabs.general'},
  {key: 'itinerary', labelKey: 'admin.tours.tabs.itinerary'},
  {key: 'pricing', labelKey: 'admin.tours.tabs.pricing'},
  {key: 'highlights', labelKey: 'admin.tours.tabs.highlights'},
  {key: 'perks', labelKey: 'admin.tours.tabs.perks'},
] as const satisfies readonly TabDescriptor<string>[];

export type TourTab = (typeof TOUR_TABS)[number]['key'];
export const isTourTab = (s: unknown): s is TourTab =>
  typeof s === 'string' && TOUR_TABS.some((t) => t.key === s);

const DESTINATION_TABS = [
  {key: 'general', labelKey: 'admin.destinations.tabs.general'},
  {key: 'heroImage', labelKey: 'admin.destinations.tabs.heroImage'},
  {key: 'cardImage', labelKey: 'admin.destinations.tabs.cardImage'},
  {key: 'highlights', labelKey: 'admin.destinations.tabs.highlights'},
] as const satisfies readonly TabDescriptor<string>[];

export type DestinationTab = (typeof DESTINATION_TABS)[number]['key'];
export const isDestinationTab = (s: unknown): s is DestinationTab =>
  typeof s === 'string' && DESTINATION_TABS.some((t) => t.key === s);
```

- [ ] **Step 2: Update `routes.admin.tours.new` and `routes.admin.tours.edit` entries**

Replace existing entries:

```ts
tours: {
  list: {path: () => '/admin/tours'},
  new: {
    path: (p?: {tab?: TourTab}) => `/admin/tours/new/${p?.tab ?? 'general'}`,
    tabs: TOUR_TABS,
  },
  edit: {
    path: (p: {id: string | number; tab?: TourTab}) =>
      `/admin/tours/${p.id}/edit/${p.tab ?? 'general'}`,
    tabs: TOUR_TABS,
  },
},
```

- [ ] **Step 3: Update `routes.admin.destinations.new` and `routes.admin.destinations.edit`**

```ts
destinations: {
  list: {path: () => '/admin/destinations'},
  new: {
    path: (p?: {tab?: DestinationTab}) =>
      `/admin/destinations/new/${p?.tab ?? 'general'}`,
    tabs: DESTINATION_TABS,
  },
  edit: {
    path: (p: {id: string | number; tab?: DestinationTab}) =>
      `/admin/destinations/${p.id}/edit/${p.tab ?? 'general'}`,
    tabs: DESTINATION_TABS,
  },
},
```

- [ ] **Step 4: Add `useActiveTab` hook at end of file (after `useNavigate`)**

```ts
type TabbedRoute = {tabs: readonly TabDescriptor<string>[]};

export function useActiveTab<R extends TabbedRoute>(
  route: R,
  fallback: R['tabs'][number]['key'],
): R['tabs'][number]['key'] {
  const router = useRouter();
  const raw = router.query.tab;
  const found = route.tabs.find((t) => t.key === raw);
  return (found?.key ?? fallback) as R['tabs'][number]['key'];
}
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm build` (or `pnpm tsc --noEmit` if available)
Expected: PASS — no type errors. The `useNavigate.to` signature already accepts `...args: unknown[]` so existing callers compile unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/routes/index.ts
git commit -m "feat(routes): add tab registry, types, guards, useActiveTab hook"
```

---

### Task 2: Seed translation keys for tab labels

**Files:**

- Create: `scripts/migrate-tab-translations.ts`

Note: existing pattern is one-shot migration scripts (see `scripts/migrate-perks-translations.ts`). This task adds a new sibling script and runs it locally + on the VPS DB.

- [ ] **Step 1: Read `scripts/migrate-perks-translations.ts` to copy its boilerplate (Prisma client setup, upsert loop)**

Run: `head -40 scripts/migrate-perks-translations.ts`
Expected: shows imports, prisma client init, and the upsert pattern over an array of `{namespace, key, valueEn, valueVi}` records.

- [ ] **Step 2: Create `scripts/migrate-tab-translations.ts` with the same shape**

```ts
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const records = [
  // admin.tours.tabs
  {
    namespace: 'admin.tours.tabs',
    key: 'general',
    valueEn: 'General',
    valueVi: 'Chung',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'itinerary',
    valueEn: 'Itinerary',
    valueVi: 'Lịch trình',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'pricing',
    valueEn: 'Pricing',
    valueVi: 'Giá',
  },
  {
    namespace: 'admin.tours.tabs',
    key: 'highlights',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },

  // admin.destinations.tabs
  {
    namespace: 'admin.destinations.tabs',
    key: 'general',
    valueEn: 'General',
    valueVi: 'Chung',
  },
  {
    namespace: 'admin.destinations.tabs',
    key: 'heroImage',
    valueEn: 'Hero Image',
    valueVi: 'Ảnh bìa',
  },
  {
    namespace: 'admin.destinations.tabs',
    key: 'cardImage',
    valueEn: 'Card Image',
    valueVi: 'Ảnh thẻ',
  },
  {
    namespace: 'admin.destinations.tabs',
    key: 'highlights',
    valueEn: 'Highlights',
    valueVi: 'Điểm nổi bật',
  },
];

async function main() {
  for (const r of records) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: r.namespace, key: r.key}},
      update: {valueEn: r.valueEn, valueVi: r.valueVi},
      create: r,
    });
    console.log(`✓ ${r.namespace}.${r.key}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

If `migrate-perks-translations.ts` uses a different upsert key shape (e.g., a `where: {id}` pattern or a different unique constraint), copy that exact shape instead. Check Prisma schema for the Translation model's `@@unique` to confirm.

- [ ] **Step 3: Run the script locally**

Run: `pnpm tsx scripts/migrate-tab-translations.ts`
Expected: 8 lines of `✓ namespace.key` output.

- [ ] **Step 4: Verify keys exist in DB**

Run: `pnpm tsx -e "import {PrismaClient} from '@prisma/client'; const p = new PrismaClient(); p.translation.findMany({where: {namespace: {in: ['admin.tours.tabs', 'admin.destinations.tabs']}}}).then(r => {console.log(r.map(x => x.namespace + '.' + x.key)); p.\$disconnect();})"`
Expected: Array containing all 8 keys plus the existing `admin.tours.tabs.perks`.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-tab-translations.ts
git commit -m "chore(i18n): seed tab label translations for tours + destinations"
```

VPS DB sync: this script must also run on production. Defer that to a manual step after merge — flag it in PR description.

---

### Task 3: Refactor `TourEditTabs` to controlled active tab + registry-driven items

**Files:**

- Modify: `src/components/Admin/TourEditTabs/TourEditTabs.tsx`

- [ ] **Step 1: Add `activeTab: TourTab` prop, drop `useState<TabId>`**

Update prop type:

```ts
import type {TourTab} from '@/routes';
import {routes, api, useNavigate} from '@/routes';

type TourEditTabsProps = {
  mode: 'create' | 'edit';
  tourId: string | null;
  activeTab: TourTab;
  destinations: Array<{id: string; name: string}>;
  initialGeneral: GeneralTabData;
  initialItinerary: VMT.ItineraryDay[];
  initialPricingGroups: VMT.PricingGroup[];
  initialHighlightIds: string[];
  initialIncludedPerkIds: string[];
  initialExcludedPerkIds: string[];
};
```

In the function signature, destructure `activeTab` and remove the `useState<TabId>('general')` line. Drop the local `TabId` type alias — use `TourTab` from `@/routes`.

- [ ] **Step 2: Replace inline tab items with registry mapping**

Replace the `<Tabs items={[...inline...]}` block:

```tsx
<Tabs
  items={routes.admin.tours.edit.tabs.map((tab) => ({
    key: tab.key,
    label: t(tab.key),
    disabled: isTabDisabled(tab.key),
  }))}
  activeKey={activeTab}
  onChange={(key) => {
    if (mode === 'create' && !tourId) {
      navigate.to(routes.admin.tours.new, {tab: key as TourTab});
    } else {
      navigate.to(routes.admin.tours.edit, {id: tourId!, tab: key as TourTab});
    }
  }}
>
```

The `t` function already points at `admin.tours.tabs` namespace (line 42); since registry keys (`general`, `itinerary`, …) match translation keys, `t(tab.key)` resolves correctly.

- [ ] **Step 3: Update `isTabDisabled` parameter type**

```ts
const isTabDisabled = (tabId: TourTab) =>
  tabId !== 'general' && mode === 'create' && !tourId;
```

- [ ] **Step 4: Update `handleGeneralSave` post-save redirect to include tab**

Find the `navigate.replaceUrl(routes.admin.tours.edit, {id: newId})` line (~line 71) and change to:

```ts
navigate.replaceUrl(routes.admin.tours.edit, {id: newId, tab: 'general'});
```

- [ ] **Step 5: Run typecheck + relevant tests**

Run: `pnpm build`
Expected: PASS.

Run: `pnpm test --testPathPattern=Tabs`
Expected: existing `Tabs.spec.tsx` tests still pass (no changes to UI primitive).

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/TourEditTabs/TourEditTabs.tsx
git commit -m "refactor(admin): TourEditTabs controlled by activeTab prop, driven by route registry"
```

---

### Task 4: Restructure tour pages — new `[tab].tsx` files + redirect shims, delete old

**Files:**

- Create: `src/pages/admin/tours/[id]/edit/[tab].tsx`
- Create: `src/pages/admin/tours/[id]/edit/index.tsx`
- Create: `src/pages/admin/tours/new/[tab].tsx`
- Create: `src/pages/admin/tours/new/index.tsx`
- Delete: `src/pages/admin/tours/[id]/edit.tsx`
- Delete: `src/pages/admin/tours/new.tsx`

- [ ] **Step 1: Create `src/pages/admin/tours/[id]/edit/[tab].tsx`**

Copy the entire current contents of `src/pages/admin/tours/[id]/edit.tsx`, then:

1. Add at top: `import {isTourTab, type TourTab} from '@/routes';`
2. In the component, get the tab from router and pass to `<TourEditTabs activeTab={tab} ... />`:

```tsx
const tab = (
  typeof router.query.tab === 'string' && isTourTab(router.query.tab)
    ? router.query.tab
    : 'general'
) as TourTab;
```

Then add `activeTab={tab}` to the `<TourEditTabs ... />` JSX.

3. Replace the existing `getServerSideProps` with one that validates `tab`:

```ts
export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const tab = params?.tab;
  if (typeof tab !== 'string' || !isTourTab(tab)) {
    return {notFound: true};
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
```

- [ ] **Step 2: Create `src/pages/admin/tours/[id]/edit/index.tsx` (redirect shim)**

```tsx
import type {GetServerSidePropsContext} from 'next';

export default function EditTourRedirect() {
  return null;
}

export async function getServerSideProps({params}: GetServerSidePropsContext) {
  const id = params?.id;
  if (typeof id !== 'string') return {notFound: true};
  return {
    redirect: {
      destination: `/admin/tours/${id}/edit/general`,
      permanent: false,
    },
  };
}
```

- [ ] **Step 3: Create `src/pages/admin/tours/new/[tab].tsx`**

Copy the contents of `src/pages/admin/tours/new.tsx`, then:

1. Add `import {isTourTab, type TourTab} from '@/routes';`
2. In component, derive `tab` from `router.query.tab` (same pattern as Step 1) and pass `activeTab={tab}` to `<TourEditTabs ... />`.
3. Replace `getServerSideProps`:

```ts
export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const tab = params?.tab;
  if (typeof tab !== 'string' || !isTourTab(tab)) {
    return {notFound: true};
  }
  if (tab !== 'general') {
    return {
      redirect: {destination: '/admin/tours/new/general', permanent: false},
    };
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
```

- [ ] **Step 4: Create `src/pages/admin/tours/new/index.tsx` (redirect shim)**

```tsx
import type {GetServerSidePropsContext} from 'next';

export default function NewTourRedirect() {
  return null;
}

export async function getServerSideProps(_ctx: GetServerSidePropsContext) {
  return {
    redirect: {destination: '/admin/tours/new/general', permanent: false},
  };
}
```

- [ ] **Step 5: Delete old files**

```bash
git rm src/pages/admin/tours/[id]/edit.tsx
git rm src/pages/admin/tours/new.tsx
```

- [ ] **Step 6: Run dev server and verify routes**

Run: `pnpm dev` (in background or separate terminal)

Manual checks:

1. Visit `/admin/tours/<existing-id>/edit` → redirects to `/admin/tours/<id>/edit/general`, page renders.
2. Visit `/admin/tours/<id>/edit/pricing` → page renders with Pricing tab active.
3. Visit `/admin/tours/<id>/edit/bogus` → 404.
4. Visit `/admin/tours/new` → redirects to `/admin/tours/new/general`.
5. Visit `/admin/tours/new/pricing` → redirects to `/admin/tours/new/general` (server-side guard).
6. Click Itinerary tab on edit page → URL changes to `/edit/itinerary` and panel switches.
7. Save a new tour → URL changes to `/admin/tours/<new-id>/edit/general`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/tours
git commit -m "feat(admin): tour pages use [tab] path segment with server validation"
```

---

### Task 5: Refactor `DestinationEditTabs` to controlled active tab + registry-driven items

**Files:**

- Modify: `src/components/Admin/DestinationEditTabs/DestinationEditTabs.tsx`

- [ ] **Step 1: Import and use `DestinationTab`, drop `useState<TabId>`**

```ts
import {useTranslations} from 'next-intl';
import {routes, api, useNavigate, type DestinationTab} from '@/routes';
```

Add prop:

```ts
type DestinationEditTabsProps = {
  mode: 'create' | 'edit';
  destinationId: string | null;
  activeTab: DestinationTab;
  initialData: DestinationFormData;
};
```

In the function destructure `activeTab` and remove `const [activeTab, setActiveTab] = useState<TabId>('general');`. Drop the `TabId` alias.

- [ ] **Step 2: Add translations hook + replace inline tab items with registry mapping**

After the existing hooks add:

```ts
const t = useTranslations('admin.destinations.tabs');
```

Replace the `<Tabs items={[...inline...]}` block:

```tsx
<Tabs
  items={routes.admin.destinations.edit.tabs.map((tab) => ({
    key: tab.key,
    label: t(tab.key),
    disabled: isTabDisabled(tab.key),
  }))}
  activeKey={activeTab}
  onChange={(key) => {
    if (mode === 'create' && !destinationId) {
      navigate.to(routes.admin.destinations.new, {tab: key as DestinationTab});
    } else {
      navigate.to(routes.admin.destinations.edit, {id: destinationId!, tab: key as DestinationTab});
    }
  }}
>
```

- [ ] **Step 3: Update `isTabDisabled` type**

```ts
const isTabDisabled = (tabId: DestinationTab) =>
  tabId !== 'general' && mode === 'create' && !destinationId;
```

- [ ] **Step 4: Update `handleSaved` post-save redirect to include tab**

Find `navigate.replaceUrl(routes.admin.destinations.edit, {id})` (~line 49) and change to:

```ts
navigate.replaceUrl(routes.admin.destinations.edit, {id, tab: 'general'});
```

- [ ] **Step 5: Run typecheck**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/DestinationEditTabs/DestinationEditTabs.tsx
git commit -m "refactor(admin): DestinationEditTabs controlled by activeTab prop, driven by route registry"
```

---

### Task 6: Restructure destination pages — new `[tab].tsx` files + redirect shims, delete old

**Files:**

- Create: `src/pages/admin/destinations/[id]/edit/[tab].tsx`
- Create: `src/pages/admin/destinations/[id]/edit/index.tsx`
- Create: `src/pages/admin/destinations/new/[tab].tsx`
- Create: `src/pages/admin/destinations/new/index.tsx`
- Delete: `src/pages/admin/destinations/[id]/edit.tsx`
- Delete: `src/pages/admin/destinations/new.tsx`

- [ ] **Step 1: Create `src/pages/admin/destinations/[id]/edit/[tab].tsx`**

Copy contents of `src/pages/admin/destinations/[id]/edit.tsx`, then:

1. `import {isDestinationTab, type DestinationTab} from '@/routes';`
2. Derive `tab`:

```tsx
const tab = (
  typeof router.query.tab === 'string' && isDestinationTab(router.query.tab)
    ? router.query.tab
    : 'general'
) as DestinationTab;
```

3. Pass `activeTab={tab}` to `<DestinationEditTabs ... />`.
4. Replace `getServerSideProps`:

```ts
export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const tab = params?.tab;
  if (typeof tab !== 'string' || !isDestinationTab(tab)) {
    return {notFound: true};
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
```

- [ ] **Step 2: Create `src/pages/admin/destinations/[id]/edit/index.tsx` shim**

```tsx
import type {GetServerSidePropsContext} from 'next';

export default function EditDestinationRedirect() {
  return null;
}

export async function getServerSideProps({params}: GetServerSidePropsContext) {
  const id = params?.id;
  if (typeof id !== 'string') return {notFound: true};
  return {
    redirect: {
      destination: `/admin/destinations/${id}/edit/general`,
      permanent: false,
    },
  };
}
```

- [ ] **Step 3: Create `src/pages/admin/destinations/new/[tab].tsx`**

Copy contents of `src/pages/admin/destinations/new.tsx`, then:

1. `import {isDestinationTab, type DestinationTab} from '@/routes';`
2. Derive `tab` (same pattern), pass `activeTab={tab}` to `<DestinationEditTabs ... />`.
3. Replace `getServerSideProps`:

```ts
export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const tab = params?.tab;
  if (typeof tab !== 'string' || !isDestinationTab(tab)) {
    return {notFound: true};
  }
  if (tab !== 'general') {
    return {
      redirect: {
        destination: '/admin/destinations/new/general',
        permanent: false,
      },
    };
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
```

- [ ] **Step 4: Create `src/pages/admin/destinations/new/index.tsx` shim**

```tsx
import type {GetServerSidePropsContext} from 'next';

export default function NewDestinationRedirect() {
  return null;
}

export async function getServerSideProps(_ctx: GetServerSidePropsContext) {
  return {
    redirect: {
      destination: '/admin/destinations/new/general',
      permanent: false,
    },
  };
}
```

- [ ] **Step 5: Delete old files**

```bash
git rm src/pages/admin/destinations/[id]/edit.tsx
git rm src/pages/admin/destinations/new.tsx
```

- [ ] **Step 6: Manual verification (dev server)**

Run: `pnpm dev`

Manual checks (mirror Task 4):

1. `/admin/destinations/<id>/edit` → redirects to `/edit/general`.
2. `/admin/destinations/<id>/edit/heroImage` → renders Hero Image tab.
3. `/admin/destinations/<id>/edit/bogus` → 404.
4. `/admin/destinations/new` → redirects to `/new/general`.
5. `/admin/destinations/new/heroImage` → redirects to `/new/general`.
6. Click Card Image tab → URL changes, panel switches.
7. Save new destination → URL becomes `/admin/destinations/<new-id>/edit/general`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/destinations
git commit -m "feat(admin): destination pages use [tab] path segment with server validation"
```

---

### Task 7: Final sweep — search for stale references, run full test suite

**Files:**

- Verify only

- [ ] **Step 1: Search for hardcoded edit/new paths in code**

Run: `grep -rn "/admin/tours/.*\\(edit\\|new\\)\\b\\|/admin/destinations/.*\\(edit\\|new\\)\\b" src --include="*.tsx" --include="*.ts" | grep -v "routes/index.ts"`
Expected: No matches outside `src/routes/index.ts`. If any string-literal paths exist, replace them with `routes.admin.tours.edit.path({...})` / `routes.admin.destinations.edit.path({...})`.

- [ ] **Step 2: Search for stale tab keys**

Run: `grep -rn "TabId\\b" src --include="*.tsx" --include="*.ts"`
Expected: No matches (the local `TabId` aliases were removed in Tasks 3 and 5).

- [ ] **Step 3: Lint + typecheck + tests**

Run: `pnpm lint && pnpm build && pnpm test --watchAll=false`
Expected: All PASS.

- [ ] **Step 4: Manual smoke test of admin tab UX (final pass)**

Run: `pnpm dev`

Walk through:

1. Create new tour → URL `/admin/tours/new/general`. Save General → URL `/admin/tours/<id>/edit/general`. Click each tab → URL updates. Reload on Pricing tab → still on Pricing tab.
2. Create new destination → same flow.
3. Browser back/forward across tabs → state correct.
4. Open `/admin/tours/<id>/edit/perks` directly → renders Perks tab.

- [ ] **Step 5: Final commit (only if any sweep fixes were made)**

```bash
git add -A
git commit -m "chore(admin): sweep stale tab path references"
```

If no changes, skip commit.

---

## Notes for the implementer

- **VPS DB:** the new translation keys (Task 2) only land in your local DB. Production VPS DB needs the same script run after merge. Flag this in the PR description; do not auto-run on production.
- **`useNavigate.to` typing:** existing signature is `to(route: RoutePath, ...args: unknown[])`. Calls like `navigate.to(routes.admin.tours.edit, {id, tab})` work without changes to the hook.
- **No new dependencies.** Everything uses existing `next-intl`, Next router, Prisma.
- **Testing rule reminder (CLAUDE.md):** do not assert on CSS classes/styles in any new tests.
- **No `interface`:** all type definitions use `type`.
- **Cursor pointer:** unchanged — `Tabs` UI primitive already handles its interactive elements.
