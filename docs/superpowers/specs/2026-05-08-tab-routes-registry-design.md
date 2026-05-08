# Tab Routes Registry — Design

**Date:** 2026-05-08
**Scope:** Admin tab navigation (Tours edit/new, Destinations edit/new)
**Goal:** Centralize tab definitions in `src/routes/index.ts` and make active tab a URL path segment.

## Motivation

Today, tab keys, labels, disabled rules, and panel switching live inline inside `TourEditTabs.tsx` and `DestinationEditTabs.tsx`. Active tab is local React state (`useState<TabId>`), so deep links and reloads always land on `general`. Two problems:

1. Tab definitions are duplicated in components rather than declared once alongside the route they belong to.
2. Active tab is not addressable — cannot link a colleague to the Pricing tab of a tour.

Treating tabs as a property of the route (path segment + registry on the route node) fixes both.

## Non-goals

- No public-facing tabs in this work. Only admin Tours/Destinations edit/new flows.
- No changes to the underlying `Tabs` / `TabPanel` UI primitives in `src/components/ui/Tabs/`.
- No changes to per-tab save behavior or API contracts.

## Architecture

### Route registry shape (`src/routes/index.ts`)

Each tabbed route gains a `tabs` field — a readonly array of tab descriptors. The `path` builder accepts an optional `tab` arg.

```ts
type TabDescriptor<K extends string> = {
  key: K;
  labelKey: string; // i18n key, e.g. 'admin.tours.tabs.pricing'
};

const TOUR_TABS = [
  {key: 'general', labelKey: 'admin.tours.tabs.general'},
  {key: 'itinerary', labelKey: 'admin.tours.tabs.itinerary'},
  {key: 'pricing', labelKey: 'admin.tours.tabs.pricing'},
  {key: 'highlights', labelKey: 'admin.tours.tabs.highlights'},
  {key: 'perks', labelKey: 'admin.tours.tabs.perks'},
] as const;

export type TourTab = (typeof TOUR_TABS)[number]['key'];
export const isTourTab = (s: unknown): s is TourTab =>
  TOUR_TABS.some((t) => t.key === s);

const DESTINATION_TABS = [
  {key: 'general', labelKey: 'admin.destinations.tabs.general'},
  {key: 'heroImage', labelKey: 'admin.destinations.tabs.heroImage'},
  {key: 'cardImage', labelKey: 'admin.destinations.tabs.cardImage'},
  {key: 'highlights', labelKey: 'admin.destinations.tabs.highlights'},
] as const;

export type DestinationTab = (typeof DESTINATION_TABS)[number]['key'];
export const isDestinationTab = (s: unknown): s is DestinationTab =>
  DESTINATION_TABS.some((t) => t.key === s);
```

Registry entries:

```ts
admin: {
  tours: {
    list: {path: () => '/admin/tours'},
    new: {
      path: (p?: {tab?: TourTab}) => `/admin/tours/new/${p?.tab ?? 'general'}`,
      tabs: TOUR_TABS,
    },
    edit: {
      path: (p: {id: string|number; tab?: TourTab}) =>
        `/admin/tours/${p.id}/edit/${p.tab ?? 'general'}`,
      tabs: TOUR_TABS,
    },
  },
  destinations: {
    list: {path: () => '/admin/destinations'},
    new: {
      path: (p?: {tab?: DestinationTab}) =>
        `/admin/destinations/new/${p?.tab ?? 'general'}`,
      tabs: DESTINATION_TABS,
    },
    edit: {
      path: (p: {id: string|number; tab?: DestinationTab}) =>
        `/admin/destinations/${p.id}/edit/${p.tab ?? 'general'}`,
      tabs: DESTINATION_TABS,
    },
  },
}
```

### Hook (`useActiveTab`)

Exported from `src/routes/index.ts`:

```ts
export function useActiveTab<
  R extends {tabs: readonly TabDescriptor<string>[]},
>(route: R, fallback: R['tabs'][number]['key']): R['tabs'][number]['key'] {
  const router = useRouter();
  const raw = router.query.tab;
  const found = route.tabs.find((t) => t.key === raw);
  return (found?.key ?? fallback) as R['tabs'][number]['key'];
}
```

Coerces `router.query.tab` to a typed tab key. Components use it instead of `useState`.

### File layout (Pages Router)

| Old                                          | New                                                |
| -------------------------------------------- | -------------------------------------------------- |
| `src/pages/admin/tours/[id]/edit.tsx`        | `src/pages/admin/tours/[id]/edit/[tab].tsx`        |
| `src/pages/admin/tours/new.tsx`              | `src/pages/admin/tours/new/[tab].tsx`              |
| `src/pages/admin/destinations/[id]/edit.tsx` | `src/pages/admin/destinations/[id]/edit/[tab].tsx` |
| `src/pages/admin/destinations/new.tsx`       | `src/pages/admin/destinations/new/[tab].tsx`       |

`getServerSideProps` for each:

1. Validate `tab` param via `isTourTab` / `isDestinationTab`. If invalid → return `{notFound: true}`.
2. In `new/[tab].tsx`: if `tab !== 'general'` → return `{redirect: {destination: '…/new/general', permanent: false}}`. (Pre-save, only `general` is meaningful.)
3. Load same data as today (Prisma queries), pass `tab` through props.

Bare paths without `[tab]` segment (`/admin/tours/[id]/edit`, `/admin/tours/new`, etc.) get a small shim file (e.g. `edit/index.tsx`) whose `getServerSideProps` redirects to `…/general`. Explicit shim is preferred over `next.config.mjs` rewrites — easier to grep, type-safe through the route registry.

### Tab component contract

`TourEditTabs` and `DestinationEditTabs` change:

- Drop internal `useState<TabId>` for active tab.
- Accept `activeTab: TourTab` (or `DestinationTab`) prop from the page.
- Render tab list by mapping over `routes.admin.tours.edit.tabs` (or destinations equivalent). No inline tab array.
- `onChange` calls `navigate.to(routes.admin.tours.edit, {id: tourId, tab: newKey})` instead of `setActiveTab`. (For "new" mode, `navigate.to(routes.admin.tours.new, {tab: newKey})` — but disabled rule prevents reaching anything other than `general` until first save.)
- Disabled rule: in `new` mode (no `tourId`), only `general` is enabled. Component still enforces this on the UI side; server redirect is a backstop.
- Labels resolve at render via `useTranslations()` against `labelKey` from registry.

After first save in `new` mode, current behavior is preserved: `navigate.replaceUrl(routes.admin.tours.edit, {id: newId, tab: 'general'})`.

### i18n labels

Move all tab labels into `admin.tours.tabs.*` and `admin.destinations.tabs.*` namespaces in:

- DB `Translation` table (seed migration), and
- `src/messages/{vi,en}.json`.

`admin.tours.tabs.perks` already exists (PR #77). Add missing: `general`, `itinerary`, `pricing`, `highlights` for tours; `general`, `heroImage`, `cardImage`, `highlights` for destinations.

## Data flow

```
URL /admin/tours/42/edit/pricing
  ↓ Pages Router → [tab].tsx
  ↓ getServerSideProps validates tab, loads tour 42
  ↓ passes {tab: 'pricing', tour: {...}} to page
  ↓ Page renders <TourEditTabs activeTab="pricing" ... />
  ↓ Component: routes.admin.tours.edit.tabs.map(...) → tab list
  ↓ User clicks "Itinerary"
  ↓ navigate.to(routes.admin.tours.edit, {id: 42, tab: 'itinerary'})
  ↓ → /admin/tours/42/edit/itinerary
```

## Error handling

- Invalid `tab` segment → 404 (`getServerSideProps` returns `{notFound: true}`).
- `new/[tab]` with non-general tab → 302 redirect to `new/general`.
- Bare path without tab → 302 redirect to `…/general`.
- Disabled tab click in UI → no-op (existing `Tabs` primitive already handles `disabled`).

## Testing

- Unit test `isTourTab` / `isDestinationTab` guards.
- Unit test `useActiveTab` (mock `useRouter`, assert fallback + coercion behavior).
- Update existing `TourEditTabs` / `DestinationEditTabs` tests (if any) to pass `activeTab` prop and assert that clicking a tab calls `router.push` with the registry-derived path. Do NOT assert on CSS classes (per CLAUDE.md testing rules).
- Manual verification: deep-link to each tab path, reload, browser back/forward across tabs, "new" → save → URL flips to `…/[id]/edit/general`.

## Migration order

1. Add `TabDescriptor`, `TOUR_TABS`, `DESTINATION_TABS`, type guards, registry `tabs` fields, `useActiveTab` to `src/routes/index.ts`.
2. Seed missing translation keys (DB + JSON).
3. Create new page files at `[tab].tsx` paths with server-side validation/redirects.
4. Refactor `TourEditTabs` and `DestinationEditTabs` to controlled `activeTab` + registry-driven list + navigate-on-change.
5. Add bare-path shims (`edit/index.tsx`, `new/index.tsx`) that redirect to `…/general`.
6. Delete old `edit.tsx` / `new.tsx` files once shims and `[tab].tsx` are in place.
7. Manual + automated test sweep.

## Open questions

None at design time.
