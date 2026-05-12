# TanStack Query Migration — Design

**Status:** Approved (brainstorm complete) — pending implementation plan
**Date:** 2026-05-12
**Owner:** Roman Khomych

## Goal

Replace the project's ad-hoc client-side server-state management (custom `api` registry + `useAdminFetch` hook) with TanStack Query (`@tanstack/react-query`). Gain caching, automatic invalidation, deduping, optimistic updates for cheap toggles, and SSR hydration on admin pages.

## Non-Goals

- Global toast/notification system
- Error-boundary refactor
- Suspense mode (`useSuspenseQuery`)
- Cache persistence to localStorage
- tRPC / API codegen
- Rewriting `getStaticProps` / SSG public pages
- Migrating SSR public pages to hydration

## Current State

- `src/routes/api.ts` — typed fetch wrappers returning `{data, error}` tuples for every admin + public client-fetch endpoint.
- `src/hooks/useAdminFetch.ts` — custom hook with manual reducer, manual `refetch`, no cache, no deduping.
- ~30+ admin call sites across `src/pages/admin/**` and `src/components/Admin/**` follow the same pattern: `await api.admin.X.update(...)` → manual local state update or full re-fetch.
- SSR via `getServerSideProps` / `getStaticProps` passes data through `pageProps`. No client cache.
- Error UX: per-component `useState<string | null>(null)` rendered inline. No global toaster.
- Tests: Jest + RTL, no MSW. CLAUDE.md forbids style assertions.

## Decisions (from brainstorm Q&A)

| #   | Question               | Decision                                                                                                                      |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Driver                 | Both DX pain + type safety (TanStack Query is sufficient; tRPC out of scope)                                                  |
| Q2  | Scope                  | Admin + already-client-fetched public bits (e.g. destination highlights pagination)                                           |
| Q3  | Fetcher style          | Plain async functions throwing on error (no `{data, error}` tuple)                                                            |
| Q4  | SSR strategy           | Prefetch + `dehydrate`/`HydrationBoundary` on admin pages only; public SSG/SSR untouched                                      |
| Q5  | File layout            | Mirror `api` registry shape: `src/queries/admin/<resource>.ts` + `<resource>.keys.ts`, fetchers under `src/queries/fetchers/` |
| Q6  | Devtools / persistence | Devtools dev-only; no persistence (revisit later if needed)                                                                   |
| Q7  | Optimistic updates     | Cheap toggles only (status flips, archive, drag-reorder); form saves stay invalidate-and-refetch                              |
| Q8  | Migration              | Incremental by resource; each phase is a self-contained PR; old + new coexist between phases                                  |

## Architecture

### Dependencies (require explicit user approval before install)

- `@tanstack/react-query` — runtime
- `@tanstack/react-query-devtools` — dev-only mount

### Layer map

```
src/lib/queryClient.ts                — QueryClient factory (per-request server, singleton client)

src/queries/fetchers/
  http.ts                             — shared throwing fetch helper + ApiError class
  admin/tours.ts                      — fetchTours, fetchTour, createTour, updateTour, deleteTour
  admin/tours.server.ts               — server-side fetcher (calls src/data/queries directly)
  admin/destinations.ts / .server.ts
  admin/perks.ts / .server.ts
  admin/highlights.ts / .server.ts
  admin/imageCollections.ts / .server.ts
  admin/translations.ts / .server.ts
  admin/users.ts / .server.ts
  admin/stats.ts / .server.ts
  public/highlights.ts

  (note: file uploads stay in src/routes/api.ts — FormData, one-shot, no caching benefit)

src/queries/admin/
  tours.ts                            — useTours, useTour, useUpdateTour, useDeleteTour, useToggleTourStatus
  tours.keys.ts                       — tourKeys factory
  destinations.ts / .keys.ts
  perks.ts / .keys.ts
  highlights.ts / .keys.ts
  imageCollections.ts / .keys.ts
  translations.ts / .keys.ts
  users.ts / .keys.ts
  stats.ts / .keys.ts

src/queries/public/
  highlights.ts / .keys.ts

src/test-utils/queryWrapper.tsx       — renderWithQuery helper
```

### Coexistence

- `src/routes/api.ts` stays during migration. Branches are removed phase-by-phase as consumers swap.
- `useAdminFetch` stays until the last consumer migrates, then is deleted in the cleanup phase.
- New tree (`src/queries/`) imports nothing from old.

### Provider wiring (`_app.tsx`)

```tsx
import {QueryClientProvider, HydrationBoundary} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {getQueryClient} from '@/lib/queryClient';

export default function App({Component, pageProps}: AppProps) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </HydrationBoundary>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### `queryClient.ts`

```ts
import {QueryClient, isServer} from '@tanstack/react-query';

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

let browserClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeClient();
  return (browserClient ??= makeClient());
}
```

## Fetchers

### Shared HTTP helper (`src/queries/fetchers/http.ts`)

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {'Content-Type': 'application/json'},
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || res.statusText, res.status);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
```

### Resource fetchers (e.g. `src/queries/fetchers/admin/tours.ts`)

```ts
import type * as VMT from '@/domain';
import {http} from '../http';

export const fetchTours = (filters: {archived?: boolean} = {}) => {
  const qs = new URLSearchParams();
  if (filters.archived !== undefined)
    qs.set('archived', String(filters.archived));
  return http<VMT.Tour[]>(`/api/admin/tours${qs.toString() ? `?${qs}` : ''}`);
};
export const fetchTour = (id: string) =>
  http<VMT.Tour>(`/api/admin/tours/${id}`);
export const createTour = (input: Record<string, unknown>) =>
  http<VMT.Tour>('/api/admin/tours', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const updateTour = (id: string, input: Record<string, unknown>) =>
  http<VMT.Tour>(`/api/admin/tours/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
export const deleteTour = (id: string, opts?: {hard?: boolean}) =>
  http<void>(`/api/admin/tours/${id}${opts?.hard ? '?hard=true' : ''}`, {
    method: 'DELETE',
  });
```

### Server-side fetchers (e.g. `src/queries/fetchers/admin/tours.server.ts`)

Server cannot HTTP-call its own API (cookies, host). Server-side fetcher imports the underlying query function directly, returning the same shape as the HTTP fetcher.

```ts
import {getToursForAdmin} from '@/data/queries';

export const fetchToursServer = (filters: {archived?: boolean}) =>
  getToursForAdmin(filters);
```

The `.server.ts` suffix prevents accidental client bundling. The server file must never be imported from `src/queries/admin/*.ts` — only from `getServerSideProps`.

## Query Keys

Factory per resource (e.g. `src/queries/admin/tours.keys.ts`):

```ts
export const tourKeys = {
  all: ['admin', 'tours'] as const,
  lists: () => [...tourKeys.all, 'list'] as const,
  list: (filters: {archived?: boolean}) =>
    [...tourKeys.lists(), filters] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
};
```

**Invalidation conventions:**

- Create / delete → `invalidateQueries({queryKey: tourKeys.all})`
- Update → `invalidateQueries({queryKey: tourKeys.detail(id)})` + `invalidateQueries({queryKey: tourKeys.lists()})`

Same key on server (`prefetchQuery`) and client (`useQuery`) → automatic hydration with no waterfall.

## Hooks

### Queries (`src/queries/admin/tours.ts`)

```ts
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import * as f from '@/queries/fetchers/admin/tours';
import {tourKeys} from './tours.keys';

export const useTours = (filters: {archived?: boolean} = {}) =>
  useQuery({
    queryKey: tourKeys.list(filters),
    queryFn: () => f.fetchTours(filters),
  });

export const useTour = (id: string | undefined) =>
  useQuery({
    queryKey: tourKeys.detail(id!),
    queryFn: () => f.fetchTour(id!),
    enabled: !!id,
  });
```

### Plain mutations (form saves)

```ts
export const useCreateTour = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: f.createTour,
    onSuccess: () => qc.invalidateQueries({queryKey: tourKeys.all}),
  });
};

export const useUpdateTour = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: Record<string, unknown>}) =>
      f.updateTour(id, input),
    onSuccess: (_data, {id}) => {
      qc.invalidateQueries({queryKey: tourKeys.detail(id)});
      qc.invalidateQueries({queryKey: tourKeys.lists()});
    },
  });
};
```

### Optimistic mutations (per Q7: status toggle, archive, reorder)

```ts
export const useToggleTourStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, status}: {id: string; status: VMT.Tour['status']}) =>
      f.updateTour(id, {status}),
    onMutate: async ({id, status}) => {
      await qc.cancelQueries({queryKey: tourKeys.lists()});
      const snapshots = qc.getQueriesData<VMT.Tour[]>({
        queryKey: tourKeys.lists(),
      });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<VMT.Tour[]>(
          key,
          data.map((t) => (t.id === id ? {...t, status} : t)),
        );
      });
      return {snapshots};
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({queryKey: tourKeys.lists()}),
  });
};
```

### Optimistic targets (per resource)

| Resource         | Optimistic mutations                                              |
| ---------------- | ----------------------------------------------------------------- |
| tours            | toggle status, archive/unarchive, hard delete (from archive view) |
| destinations     | toggle `isActive`, archive/unarchive, hard delete                 |
| perks            | reorder, archive                                                  |
| highlights       | reorder, delete                                                   |
| imageCollections | image reorder, image delete                                       |
| translations     | none (bulk PUT)                                                   |
| users            | none                                                              |

All others (form create/update) use plain mutations.

## SSR Hydration (admin pages only)

```ts
// src/pages/admin/tours/index.tsx
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchToursServer} from '@/queries/fetchers/admin/tours.server';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // existing auth check stays
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: tourKeys.list({archived: false}),
    queryFn: () => fetchToursServer({archived: false}),
  });
  return {props: {dehydratedState: dehydrate(queryClient)}};
};
```

Page body replaces `useAdminFetch` with `useTours()` — data appears synchronously on first render via hydration.

Public-page client fetches (e.g. destination highlights pagination) use `useQuery` with no prefetch.

## Error Handling

- Per-component `useState` for inline error message stays as the surface.
- Sources: `mutation.error?.message` (TanStack auto-tracks thrown `ApiError`) or per-call `onError` callback.
- `ApiError.status` available for branching (e.g. 401 → redirect).
- No global toaster, no error boundary refactor.

## Testing

- **`src/test-utils/queryWrapper.tsx`** — `renderWithQuery(ui, {client?})` wraps in fresh `QueryClientProvider` per test, `retry: false`, `gcTime: 0` to prevent test bleed.
- **Hook tests** — mock fetcher modules (`jest.mock('@/queries/fetchers/admin/tours')`).
- **Fetcher unit tests** — mock `global.fetch`; assert URL, method, body, error throwing on non-ok status.
- **Component tests** — mock the hook (`jest.mock('@/queries/admin/tours')`) returning canned `{data, isLoading, error}`. Same pattern as current `useAdminFetch` mocks.
- **Required new specs:**
  - One per query-key factory (key shape stability — invalidation depends on it)
  - One per optimistic mutation (snapshot/rollback path)
  - `queryClient.ts` server/client split (`isServer` branch returns fresh, browser branch returns singleton)
- **Playwright e2e** — no changes; existing admin flows exercise real API end-to-end.

CLAUDE.md style-assertion ban remains in force: no `toHaveClass` / `toHaveStyle` / `className` assertions in new tests.

## Migration Phases

Each phase = one PR, mergeable independently. Old + new coexist between phases.

| Phase | Scope                                                                                                                                                              | Removes                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **0** | Install deps, add `_app.tsx` provider + Devtools, `src/lib/queryClient.ts`, `src/queries/fetchers/http.ts`, `src/test-utils/queryWrapper.tsx`                      | —                                                               |
| **1** | `tours` queries + mutations + SSR hydration on `admin/tours/index.tsx`, `admin/tours/[id].tsx`, `admin/tours/archive.tsx`, `admin/tours/new.tsx`                   | tours call sites stop using `api.admin.tours` + `useAdminFetch` |
| **2** | `destinations` (same shape as tours) — index, [id], archive, new                                                                                                   | destinations call sites                                         |
| **3** | `perks` + `highlights` (interlinked via DestinationEditTabs / TourEditTabs)                                                                                        | perks/highlights call sites                                     |
| **4** | `imageCollections` (incl. nested `images`)                                                                                                                         | imageCollections call sites                                     |
| **5** | `translations` + `users` + `stats`                                                                                                                                 | last admin call sites                                           |
| **6** | Public `destinations.highlights` pagination                                                                                                                        | last public client-fetch                                        |
| **7** | Cleanup: delete `useAdminFetch.ts`, prune dead branches of `src/routes/api.ts` (keep `api.admin.upload` if still used by ImageCollectionEditor / HeroImagePreview) | `useAdminFetch.ts`, dead `api.*` branches                       |

**Risk per phase:** low — each touches one resource; SSR hydration is per-page; old code paths unaffected until consumer swaps.

**Rollback:** revert single PR. No DB migrations, no API changes.

## Acceptance Criteria

- All admin client-side data flows go through `src/queries/admin/*` hooks.
- Destination highlights pagination uses `src/queries/public/highlights.ts`.
- `useAdminFetch.ts` deleted.
- `src/routes/api.ts` retains only entries still in active use (notably `api.admin.upload` if not migrated).
- Admin pages hydrate from SSR — no loading flicker on first paint of `admin/tours`, `admin/destinations`, etc.
- Status toggles + drag-reorder feel instant (optimistic), with rollback on error.
- Devtools mounted in dev only; never shipped to prod bundle.
- All existing Jest + Playwright tests pass; new specs cover query keys + optimistic rollback paths.

## Open Questions for Plan Phase

- Phase 0 requires user approval to install deps (CLAUDE.md security rule). Plan should call this out as a gating step, not assume install.
- Confirm `src/data/queries.ts` exposes all the read functions needed for `.server.ts` fetchers; if not, plan adds them.
- Confirm whether `api.admin.upload` ever moves to a TanStack mutation or stays imperative (current preference: stays imperative — FormData mutation is a one-shot, no caching benefit).
