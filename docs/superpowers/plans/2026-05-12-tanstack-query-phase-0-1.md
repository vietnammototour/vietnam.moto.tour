# TanStack Query Migration — Phase 0 + 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install TanStack Query, wire `QueryClientProvider` + Devtools into `_app.tsx`, then migrate the entire `tours` admin resource (list, archive, detail/edit, create) to query/mutation hooks with SSR hydration on admin pages and optimistic updates on status toggles + hard delete.

**Architecture:** New parallel tree under `src/queries/` with hooks (`src/queries/admin/<resource>.ts`), key factories (`<resource>.keys.ts`), and fetchers (`src/queries/fetchers/admin/<resource>.ts` for client, `<resource>.server.ts` for server-side hydration). Old `api.admin.tours` branch + `useAdminFetch` are left in place until the last consumer outside this phase migrates; tours-specific consumers swap to hooks here.

**Tech Stack:** Next.js 16 (Pages Router), React 19, TypeScript, `@tanstack/react-query` ^5, `@tanstack/react-query-devtools` ^5, Jest + RTL.

---

## Spec Reference

Design spec: `docs/superpowers/specs/2026-05-12-tanstack-query-migration-design.md`

This plan covers spec sections: Architecture, Fetchers, Query Keys, Hooks, SSR Hydration, Migration Phases 0–1.

## File Structure

**Created in Phase 0:**

```
src/lib/queryClient.ts                       — QueryClient factory
src/queries/fetchers/http.ts                 — shared throwing fetch helper + ApiError
src/queries/fetchers/http.spec.ts            — fetcher helper unit tests
src/test-utils/queryWrapper.tsx              — renderWithQuery test helper
```

**Modified in Phase 0:**

```
src/pages/_app.tsx                           — wrap in QueryClientProvider + HydrationBoundary, mount Devtools in dev
package.json / pnpm-lock.yaml                — new deps (gated on user approval)
```

**Created in Phase 1:**

```
src/queries/admin/tours.keys.ts              — tourKeys factory
src/queries/admin/tours.keys.spec.ts         — key shape stability tests
src/queries/admin/tours.ts                   — useTours, useTour, useCreateTour, useUpdateTour, useToggleTourStatus, useDeleteTourHard
src/queries/admin/tours.spec.ts              — hook tests (queries + optimistic rollback)
src/queries/fetchers/admin/tours.ts          — fetchTours, fetchTour, createTour, updateTour, deleteTour
src/queries/fetchers/admin/tours.spec.ts     — fetcher unit tests (mocked global fetch)
src/queries/fetchers/admin/tours.server.ts   — fetchToursServer, fetchTourServer (server-only)
```

**Modified in Phase 1:**

```
src/data/queries.ts                          — add getToursForAdmin(filters), getTourById(id) reusable functions
src/pages/api/admin/tours/index.ts           — replace inline prisma findMany with getToursForAdmin
src/pages/api/admin/tours/[id].ts            — replace inline prisma findUnique with getTourById (GET handler only)
src/pages/admin/tours/index.tsx              — useTours + useToggleTourStatus + getServerSideProps hydration
src/pages/admin/tours/archive.tsx            — useTours({archived:true}) + useToggleTourStatus + useDeleteTourHard + getServerSideProps hydration
src/pages/admin/tours/[id]/edit/[tab].tsx    — useTour + useDestinations-like inline call (destinations stays on api for now) + getServerSideProps hydration
src/components/Admin/TourEditTabs/TourEditTabs.tsx — useCreateTour + useUpdateTour replace api.admin.tours.create/update calls
```

**Untouched in Phase 1 (waits for later phases):**

- `src/routes/api.ts` `api.admin.tours.*` branch — leave during phase; deletion deferred to Phase 7 cleanup
- `src/hooks/useAdminFetch.ts` — leave; still used by destinations/perks/etc.
- destinations call site inside `[id]/edit/[tab].tsx` — keep `useAdminFetch` for `/api/admin/destinations` until Phase 2

---

## Task 0.1: Install TanStack Query dependencies

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`

**Gating note:** CLAUDE.md security rule — "Never install new dependencies without explicit user approval." Halt this task until the user explicitly says "install" or equivalent. Do not run `pnpm add` autonomously.

- [ ] **Step 1: Get explicit user approval to install**

Tell the user: "Phase 0 requires installing `@tanstack/react-query` (runtime) and `@tanstack/react-query-devtools` (dev). Confirm to install?" Wait for explicit approval.

- [ ] **Step 2: Install runtime dep**

Run: `pnpm add @tanstack/react-query`
Expected: package added to `dependencies` in `package.json`, lockfile updated.

- [ ] **Step 3: Install devtools as dev dep**

Run: `pnpm add -D @tanstack/react-query-devtools`
Expected: package added to `devDependencies`.

- [ ] **Step 4: Verify install**

Run: `pnpm list @tanstack/react-query @tanstack/react-query-devtools`
Expected: both packages listed at compatible versions (^5).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @tanstack/react-query and devtools"
```

---

## Task 0.2: Create QueryClient factory

**Files:**

- Create: `src/lib/queryClient.ts`

- [ ] **Step 1: Write the file**

```ts
// src/lib/queryClient.ts
import {QueryClient, isServer} from '@tanstack/react-query';

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeClient();
  return (browserClient ??= makeClient());
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queryClient.ts
git commit -m "feat(queries): add QueryClient factory for SSR + browser singleton"
```

---

## Task 0.3: Create shared HTTP fetcher helper with tests

**Files:**

- Create: `src/queries/fetchers/http.ts`
- Create: `src/queries/fetchers/http.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/queries/fetchers/http.spec.ts
import {http, ApiError} from './http';

describe('http', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed JSON on 200', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({foo: 'bar'}),
    } as unknown as Response);
    const result = await http<{foo: string}>('/api/x');
    expect(result).toEqual({foo: 'bar'});
  });

  it('returns undefined on 204', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    } as unknown as Response);
    const result = await http<void>('/api/x', {method: 'DELETE'});
    expect(result).toBeUndefined();
  });

  it('throws ApiError with body.error message on non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({error: 'slug taken'}),
    } as unknown as Response);
    await expect(http('/api/x')).rejects.toMatchObject({
      message: 'slug taken',
      status: 422,
    });
    await expect(http('/api/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to statusText when body has no error field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({}),
    } as unknown as Response);
    await expect(http('/api/x')).rejects.toMatchObject({
      message: 'Server Error',
      status: 500,
    });
  });

  it('falls back to statusText when body is not JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response);
    await expect(http('/api/x')).rejects.toMatchObject({
      message: 'Server Error',
      status: 500,
    });
  });

  it('merges JSON content-type header with init', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as unknown as Response);
    global.fetch = fetchMock;
    await http('/api/x', {method: 'POST', body: '{}'});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/x',
      expect.objectContaining({
        method: 'POST',
        body: '{}',
        headers: expect.objectContaining({'Content-Type': 'application/json'}),
      }),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/queries/fetchers/http.spec.ts`
Expected: all fail with "Cannot find module './http'".

- [ ] **Step 3: Write the implementation**

```ts
// src/queries/fetchers/http.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {error?: string};
    throw new ApiError(body.error || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/queries/fetchers/http.spec.ts`
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/queries/fetchers/http.ts src/queries/fetchers/http.spec.ts
git commit -m "feat(queries): add http fetcher helper with ApiError"
```

---

## Task 0.4: Create test render helper

**Files:**

- Create: `src/test-utils/queryWrapper.tsx`

- [ ] **Step 1: Write the helper**

```tsx
// src/test-utils/queryWrapper.tsx
import type {ReactElement, ReactNode} from 'react';
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: 0, staleTime: 0},
      mutations: {retry: false},
    },
  });
}

type Options = Omit<RenderOptions, 'wrapper'> & {client?: QueryClient};

export function renderWithQuery(
  ui: ReactElement,
  options: Options = {},
): RenderResult & {client: QueryClient} {
  const client = options.client ?? makeTestQueryClient();
  function Wrapper({children}: {children: ReactNode}) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  const result = render(ui, {...options, wrapper: Wrapper});
  return {...result, client};
}
```

- [ ] **Step 2: Smoke-test compile**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/test-utils/queryWrapper.tsx
git commit -m "feat(test-utils): add renderWithQuery helper"
```

---

## Task 0.5: Wire QueryClientProvider + Devtools into \_app.tsx

**Files:**

- Modify: `src/pages/_app.tsx`

- [ ] **Step 1: Add imports near top of file**

Open `src/pages/_app.tsx`. After existing imports add:

```tsx
import {QueryClientProvider, HydrationBoundary} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {getQueryClient} from '@/lib/queryClient';
```

- [ ] **Step 2: Acquire client inside App component**

Inside `App`, immediately before `const router = useRouter();` add:

```tsx
const queryClient = getQueryClient();
```

- [ ] **Step 3: Wrap return tree**

Replace the existing `return (...)` block with one wrapped in `QueryClientProvider` and `HydrationBoundary`. Place them as the OUTERMOST wrappers (outside `SessionProvider`) so server-prefetched cache hydrates before any consumer mounts:

```tsx
return (
  <QueryClientProvider client={queryClient}>
    <HydrationBoundary state={pageProps.dehydratedState}>
      <SessionProvider session={session}>
        <ThemeProvider>
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone="Asia/Ho_Chi_Minh"
            onError={handleIntlError}
          >
            {content}
          </NextIntlClientProvider>
        </ThemeProvider>
      </SessionProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </HydrationBoundary>
  </QueryClientProvider>
);
```

- [ ] **Step 4: Type-check + run dev server**

Run: `pnpm tsc --noEmit`
Expected: no errors.

Run: `pnpm dev` and load `http://localhost:3000` in a browser.
Expected: home page renders normally; in dev a small TanStack Devtools button appears in bottom corner. Stop the dev server.

- [ ] **Step 5: Run existing tests to confirm no regressions**

Run: `pnpm test`
Expected: full suite passes.

- [ ] **Step 6: Commit**

```bash
git add src/pages/_app.tsx
git commit -m "feat(app): mount QueryClientProvider, HydrationBoundary, and Devtools"
```

---

## Task 1.1: Add reusable admin tour data functions

**Files:**

- Modify: `src/data/queries.ts`

**Why:** Server-side hydration fetcher (`tours.server.ts`) cannot HTTP-call the admin API route. It needs a plain async function. Currently `/api/admin/tours/index.ts` and `/api/admin/tours/[id].ts` inline prisma calls. Extract them so route handlers + server fetcher share one source.

- [ ] **Step 1: Read the current admin route handlers**

Read `src/pages/api/admin/tours/index.ts` (full file) and `src/pages/api/admin/tours/[id].ts` (GET branch only). Note the exact prisma queries — `findMany` with `where`, `orderBy`, `include` for list; `findUnique` with `include` for detail.

- [ ] **Step 2: Add functions to `src/data/queries.ts`**

Append to the file (after existing exports):

```ts
import type {TourStatus} from '@prisma/client';

export type AdminTourFilters = {archived?: boolean};

export async function getToursForAdmin(filters: AdminTourFilters = {}) {
  const where =
    filters.archived === true
      ? {status: 'ARCHIVED' as TourStatus}
      : filters.archived === false
        ? {status: {not: 'ARCHIVED' as TourStatus}}
        : undefined;
  return prisma.tour.findMany({
    where,
    orderBy: {createdAt: 'desc'},
    include: {
      destination: {select: {name: true}},
      highlights: true,
    },
  });
}

export async function getTourByIdForAdmin(id: string) {
  return prisma.tour.findUnique({
    where: {id},
    include: {
      destination: {select: {name: true, heroImage: true}},
      highlights: true,
      perks: true,
    },
  });
}
```

If `prisma` import is not already at the top of `src/data/queries.ts`, add `import {prisma} from '@/lib/prisma';`. Match the include shape currently used by the existing `[id].ts` GET handler — re-read that file and adjust the `include` block to match exactly (perks, highlights, destination fields). Do NOT guess; copy the exact include from the route handler.

- [ ] **Step 3: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Replace inline prisma in `pages/api/admin/tours/index.ts` GET branch**

Replace the body of the `if (req.method === 'GET')` block with:

```ts
if (req.method === 'GET') {
  const archivedParam = req.query.archived;
  const filters =
    archivedParam === 'true'
      ? {archived: true}
      : archivedParam === 'false'
        ? {archived: false}
        : {};
  const {getToursForAdmin} = await import('@/data/queries');
  const tours = await getToursForAdmin(filters);
  return res.json(tours);
}
```

- [ ] **Step 5: Replace inline prisma in `pages/api/admin/tours/[id].ts` GET branch**

In the GET branch, replace the `prisma.tour.findUnique(...)` call with:

```ts
const {getTourByIdForAdmin} = await import('@/data/queries');
const tour = await getTourByIdForAdmin(id);
```

Leave PUT/DELETE branches untouched (they mutate; no shared function needed).

- [ ] **Step 6: Run existing tour tests**

Run: `pnpm test src/pages/api/admin/tours`
Expected: all existing route tests still pass (behavior unchanged).

- [ ] **Step 7: Commit**

```bash
git add src/data/queries.ts src/pages/api/admin/tours/index.ts src/pages/api/admin/tours/[id].ts
git commit -m "refactor(admin/tours): extract getToursForAdmin and getTourByIdForAdmin"
```

---

## Task 1.2: Tour query key factory with tests

**Files:**

- Create: `src/queries/admin/tours.keys.ts`
- Create: `src/queries/admin/tours.keys.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/queries/admin/tours.keys.spec.ts
import {tourKeys} from './tours.keys';

describe('tourKeys', () => {
  it('all key is stable', () => {
    expect(tourKeys.all).toEqual(['admin', 'tours']);
  });

  it('lists key extends all', () => {
    expect(tourKeys.lists()).toEqual(['admin', 'tours', 'list']);
  });

  it('list key includes filters object', () => {
    expect(tourKeys.list({archived: false})).toEqual([
      'admin',
      'tours',
      'list',
      {archived: false},
    ]);
  });

  it('list key with empty filters', () => {
    expect(tourKeys.list({})).toEqual(['admin', 'tours', 'list', {}]);
  });

  it('details key extends all', () => {
    expect(tourKeys.details()).toEqual(['admin', 'tours', 'detail']);
  });

  it('detail key includes id', () => {
    expect(tourKeys.detail('abc')).toEqual(['admin', 'tours', 'detail', 'abc']);
  });

  it('list and detail keys share all prefix (invalidation contract)', () => {
    const all = tourKeys.all;
    expect(tourKeys.lists().slice(0, all.length)).toEqual(all);
    expect(tourKeys.detail('abc').slice(0, all.length)).toEqual(all);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/queries/admin/tours.keys.spec.ts`
Expected: fail with "Cannot find module './tours.keys'".

- [ ] **Step 3: Write the implementation**

```ts
// src/queries/admin/tours.keys.ts
export const tourKeys = {
  all: ['admin', 'tours'] as const,
  lists: () => [...tourKeys.all, 'list'] as const,
  list: (filters: {archived?: boolean}) =>
    [...tourKeys.lists(), filters] as const,
  details: () => [...tourKeys.all, 'detail'] as const,
  detail: (id: string) => [...tourKeys.details(), id] as const,
};
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/queries/admin/tours.keys.spec.ts`
Expected: all 7 pass.

- [ ] **Step 5: Commit**

```bash
git add src/queries/admin/tours.keys.ts src/queries/admin/tours.keys.spec.ts
git commit -m "feat(queries/tours): add tourKeys factory"
```

---

## Task 1.3: Tour client fetchers with tests

**Files:**

- Create: `src/queries/fetchers/admin/tours.ts`
- Create: `src/queries/fetchers/admin/tours.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/queries/fetchers/admin/tours.spec.ts
import * as f from './tours';

describe('admin tours fetchers', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchTours with no filters omits query string', async () => {
    await f.fetchTours();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours',
      expect.any(Object),
    );
  });

  it('fetchTours with archived=false adds query string', async () => {
    await f.fetchTours({archived: false});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours?archived=false',
      expect.any(Object),
    );
  });

  it('fetchTours with archived=true adds query string', async () => {
    await f.fetchTours({archived: true});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours?archived=true',
      expect.any(Object),
    );
  });

  it('fetchTour requests by id', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({id: 'abc'}),
    } as unknown as Response);
    const tour = await f.fetchTour('abc');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc',
      expect.any(Object),
    );
    expect(tour).toEqual({id: 'abc'});
  });

  it('createTour POSTs JSON body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({id: 'new'}),
    } as unknown as Response);
    await f.createTour({title: 'X'});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({title: 'X'}),
      }),
    );
  });

  it('updateTour PUTs JSON body to id endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({id: 'abc'}),
    } as unknown as Response);
    await f.updateTour('abc', {status: 'PUBLISHED'});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({status: 'PUBLISHED'}),
      }),
    );
  });

  it('deleteTour DELETEs without query when soft', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    } as unknown as Response);
    await f.deleteTour('abc');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc',
      expect.objectContaining({method: 'DELETE'}),
    );
  });

  it('deleteTour DELETEs with hard=true query string when hard', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    } as unknown as Response);
    await f.deleteTour('abc', {hard: true});
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tours/abc?hard=true',
      expect.objectContaining({method: 'DELETE'}),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/queries/fetchers/admin/tours.spec.ts`
Expected: fail with "Cannot find module './tours'".

- [ ] **Step 3: Write the implementation**

```ts
// src/queries/fetchers/admin/tours.ts
import type * as VMT from '@/domain';
import {http} from '../http';

export const fetchTours = (filters: {archived?: boolean} = {}) => {
  const qs = new URLSearchParams();
  if (filters.archived !== undefined)
    qs.set('archived', String(filters.archived));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return http<VMT.Tour[]>(`/api/admin/tours${suffix}`);
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

export const deleteTour = (id: string, opts?: {hard?: boolean}) => {
  const suffix = opts?.hard ? '?hard=true' : '';
  return http<void>(`/api/admin/tours/${id}${suffix}`, {method: 'DELETE'});
};
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/queries/fetchers/admin/tours.spec.ts`
Expected: all 8 pass.

- [ ] **Step 5: Commit**

```bash
git add src/queries/fetchers/admin/tours.ts src/queries/fetchers/admin/tours.spec.ts
git commit -m "feat(queries/tours): add client fetchers"
```

---

## Task 1.4: Tour server fetchers (no tests — thin adapter)

**Files:**

- Create: `src/queries/fetchers/admin/tours.server.ts`

- [ ] **Step 1: Write the file**

```ts
// src/queries/fetchers/admin/tours.server.ts
// Server-only — never import from src/queries/admin/*.ts.
// Imported only from getServerSideProps prefetch flows.
import {getToursForAdmin, getTourByIdForAdmin} from '@/data/queries';

export const fetchToursServer = (filters: {archived?: boolean} = {}) =>
  getToursForAdmin(filters);

export const fetchTourServer = (id: string) => getTourByIdForAdmin(id);
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/queries/fetchers/admin/tours.server.ts
git commit -m "feat(queries/tours): add server-side prefetch fetchers"
```

---

## Task 1.5: Tour query + mutation hooks with tests

**Files:**

- Create: `src/queries/admin/tours.ts`
- Create: `src/queries/admin/tours.spec.ts`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/queries/admin/tours.spec.ts
import {act, waitFor} from '@testing-library/react';
import {renderHook} from '@testing-library/react';
import type {ReactNode} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import * as fetchers from '@/queries/fetchers/admin/tours';
import {
  useTours,
  useTour,
  useCreateTour,
  useUpdateTour,
  useToggleTourStatus,
  useDeleteTourHard,
} from './tours';
import {tourKeys} from './tours.keys';

jest.mock('@/queries/fetchers/admin/tours');

function makeWrapper(client: QueryClient) {
  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {retry: false, gcTime: 0, staleTime: 0},
      mutations: {retry: false},
    },
  });
}

const mockedFetchers = fetchers as jest.Mocked<typeof fetchers>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTours', () => {
  it('calls fetchTours with filters', async () => {
    mockedFetchers.fetchTours.mockResolvedValue([{id: 't1'} as never]);
    const client = makeClient();
    const {result} = renderHook(() => useTours({archived: false}), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchers.fetchTours).toHaveBeenCalledWith({archived: false});
    expect(result.current.data).toEqual([{id: 't1'}]);
  });
});

describe('useTour', () => {
  it('does not fetch when id is undefined', () => {
    mockedFetchers.fetchTour.mockResolvedValue({id: 't1'} as never);
    const client = makeClient();
    renderHook(() => useTour(undefined), {wrapper: makeWrapper(client)});
    expect(mockedFetchers.fetchTour).not.toHaveBeenCalled();
  });

  it('fetches when id is given', async () => {
    mockedFetchers.fetchTour.mockResolvedValue({id: 't1'} as never);
    const client = makeClient();
    const {result} = renderHook(() => useTour('t1'), {
      wrapper: makeWrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchers.fetchTour).toHaveBeenCalledWith('t1');
  });
});

describe('useCreateTour', () => {
  it('invalidates all tour queries on success', async () => {
    mockedFetchers.createTour.mockResolvedValue({id: 'new'} as never);
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const {result} = renderHook(() => useCreateTour(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({title: 'X'} as never);
    });
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.all});
  });
});

describe('useUpdateTour', () => {
  it('invalidates detail and lists on success', async () => {
    mockedFetchers.updateTour.mockResolvedValue({id: 't1'} as never);
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const {result} = renderHook(() => useUpdateTour(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({id: 't1', input: {title: 'Y'}});
    });
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.detail('t1')});
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.lists()});
  });
});

describe('useToggleTourStatus', () => {
  it('optimistically updates cached list, then settles', async () => {
    const client = makeClient();
    client.setQueryData(tourKeys.list({archived: false}), [
      {id: 't1', status: 'DRAFT'},
      {id: 't2', status: 'DRAFT'},
    ] as never);
    mockedFetchers.updateTour.mockResolvedValue({
      id: 't1',
      status: 'PUBLISHED',
    } as never);
    const {result} = renderHook(() => useToggleTourStatus(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      const promise = result.current.mutateAsync({
        id: 't1',
        status: 'PUBLISHED',
      });
      // mid-flight cache should already reflect the new status
      const optimistic = client.getQueryData<
        Array<{id: string; status: string}>
      >(tourKeys.list({archived: false}));
      expect(optimistic?.find((t) => t.id === 't1')?.status).toBe('PUBLISHED');
      await promise;
    });
    expect(mockedFetchers.updateTour).toHaveBeenCalledWith('t1', {
      status: 'PUBLISHED',
    });
  });

  it('rolls back cached list when mutation throws', async () => {
    const client = makeClient();
    const initial = [
      {id: 't1', status: 'DRAFT'},
      {id: 't2', status: 'DRAFT'},
    ];
    client.setQueryData(tourKeys.list({archived: false}), initial as never);
    mockedFetchers.updateTour.mockRejectedValue(new Error('boom'));
    const {result} = renderHook(() => useToggleTourStatus(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current
        .mutateAsync({id: 't1', status: 'PUBLISHED'})
        .catch(() => undefined);
    });
    const restored = client.getQueryData(tourKeys.list({archived: false}));
    expect(restored).toEqual(initial);
  });
});

describe('useDeleteTourHard', () => {
  it('invalidates all tour queries on success', async () => {
    mockedFetchers.deleteTour.mockResolvedValue(undefined);
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const {result} = renderHook(() => useDeleteTourHard(), {
      wrapper: makeWrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({id: 't1'});
    });
    expect(mockedFetchers.deleteTour).toHaveBeenCalledWith('t1', {hard: true});
    expect(invalidate).toHaveBeenCalledWith({queryKey: tourKeys.all});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/queries/admin/tours.spec.ts`
Expected: fail with "Cannot find module './tours'".

- [ ] **Step 3: Write the implementation**

```ts
// src/queries/admin/tours.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type * as VMT from '@/domain';
import * as f from '@/queries/fetchers/admin/tours';
import {tourKeys} from './tours.keys';

export const useTours = (filters: {archived?: boolean} = {}) =>
  useQuery({
    queryKey: tourKeys.list(filters),
    queryFn: () => f.fetchTours(filters),
  });

export const useTour = (id: string | undefined) =>
  useQuery({
    queryKey: tourKeys.detail(id ?? '__never__'),
    queryFn: () => f.fetchTour(id as string),
    enabled: !!id,
  });

export const useCreateTour = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => f.createTour(input),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: tourKeys.all});
    },
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

type ToggleVars = {id: string; status: VMT.TourStatus};
type ToggleCtx = {
  snapshots: Array<[readonly unknown[], unknown]>;
};

export const useToggleTourStatus = () => {
  const qc = useQueryClient();
  return useMutation<VMT.Tour, Error, ToggleVars, ToggleCtx>({
    mutationFn: ({id, status}) => f.updateTour(id, {status}),
    onMutate: async ({id, status}) => {
      await qc.cancelQueries({queryKey: tourKeys.lists()});
      const snapshots = qc.getQueriesData({queryKey: tourKeys.lists()});
      snapshots.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;
        qc.setQueryData(
          key,
          data.map((t: {id: string}) => (t.id === id ? {...t, status} : t)),
        );
      });
      return {snapshots};
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({queryKey: tourKeys.lists()});
    },
  });
};

type DeleteVars = {id: string};
type DeleteCtx = {
  snapshots: Array<[readonly unknown[], unknown]>;
};

export const useDeleteTourHard = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, DeleteVars, DeleteCtx>({
    mutationFn: ({id}) => f.deleteTour(id, {hard: true}),
    onMutate: async ({id}) => {
      await qc.cancelQueries({queryKey: tourKeys.lists()});
      const snapshots = qc.getQueriesData({queryKey: tourKeys.lists()});
      snapshots.forEach(([key, data]) => {
        if (!Array.isArray(data)) return;
        qc.setQueryData(
          key,
          data.filter((t: {id: string}) => t.id !== id),
        );
      });
      return {snapshots};
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({queryKey: tourKeys.all});
    },
  });
};
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/queries/admin/tours.spec.ts`
Expected: all 8 pass.

- [ ] **Step 5: Commit**

```bash
git add src/queries/admin/tours.ts src/queries/admin/tours.spec.ts
git commit -m "feat(queries/tours): add useTours, useTour, mutations with optimistic toggles"
```

---

## Task 1.6: Migrate `/admin/tours/index.tsx` to TanStack Query with SSR hydration

**Files:**

- Modify: `src/pages/admin/tours/index.tsx`

- [ ] **Step 1: Replace imports + body**

Read current file at `src/pages/admin/tours/index.tsx`. Replace its full contents with:

```tsx
import {useEffect} from 'react';
import Link from 'next/link';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {useTours, useToggleTourStatus} from '@/queries/admin/tours';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchToursServer} from '@/queries/fetchers/admin/tours.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {StatusPicker} from '@/components/Admin/StatusPicker';
import {routes} from '@/routes';
import {Badge} from '@/components/ui';
import type * as VMT from '@/domain';

type AdminTour = {
  id: string;
  title: string;
  slug: string;
  status: VMT.TourStatus;
  destination: {name: string};
  pricingGroups: VMT.PricingGroup[];
  duration: string;
  imageUrl: string | null;
};

export default function AdminToursList() {
  const {data: tours, isLoading} = useTours({archived: false});
  const {data: archivedTours} = useTours({archived: true});
  const toggleStatus = useToggleTourStatus();
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  function handleStatusChange(id: string, status: VMT.TourStatus) {
    toggleStatus.mutate({id, status});
  }

  const archivedCount = archivedTours?.length ?? 0;
  const tourList = (tours ?? []) as AdminTour[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Tours</h1>
        <div className="flex items-center gap-3">
          {archivedCount > 0 && (
            <Link
              href={routes.admin.tours.archive.path()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg type-label-sm uppercase border border-border text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <i className="fa fa-archive text-xs" />
              Archive ({archivedCount})
            </Link>
          )}
          <Link
            href={routes.admin.tours.new.path()}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors cursor-pointer"
          >
            + New Tour
          </Link>
        </div>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Title
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Destination
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Pricing Type
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tourList.map((tour) => (
              <tr
                key={tour.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={routes.admin.tours.edit.path({id: tour.id})}
                    className="group/link flex items-center gap-3 cursor-pointer"
                  >
                    {tour.imageUrl ? (
                      <img
                        src={tour.imageUrl}
                        alt=""
                        className="h-[50px] w-auto rounded object-contain shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove(
                            'hidden',
                          );
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-[50px] w-[50px] rounded bg-surface-alt flex items-center justify-center shrink-0 ${tour.imageUrl ? 'hidden' : ''}`}
                    >
                      <i className="fa fa-image text-on-surface-tertiary" />
                    </div>
                    <span className="type-body-lg text-primary group-hover/link:text-primary-light group-hover/link:underline transition-colors">
                      {tour.title}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {tour.destination.name}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const types = new Set(
                        (tour.pricingGroups ?? []).map((g) => g.type),
                      );
                      const hasGroup = types.has('group-size');
                      const hasVehicle = types.has('vehicle');
                      if (!hasGroup && !hasVehicle) {
                        return (
                          <span className="type-body-sm text-on-surface-tertiary">
                            —
                          </span>
                        );
                      }
                      return (
                        <>
                          {hasGroup && <Badge variant="info">Group</Badge>}
                          {hasVehicle && (
                            <Badge variant="success">Vehicle</Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex">
                    <StatusPicker
                      value={tour.status}
                      onChange={(status) => handleStatusChange(tour.id, status)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: tourKeys.list({archived: false}),
      queryFn: () => fetchToursServer({archived: false}),
    }),
    queryClient.prefetchQuery({
      queryKey: tourKeys.list({archived: true}),
      queryFn: () => fetchToursServer({archived: true}),
    }),
  ]);
  return {props: {dehydratedState: dehydrate(queryClient)}};
};
```

**Auth note:** Existing admin routes do NOT have getServerSideProps auth checks at the page level — admin routing is gated by middleware (`src/middleware.ts`) and per-API route via `requireAdmin`. The page can safely prefetch because middleware blocks unauthorized navigation. If middleware does NOT cover `/admin/tours`, halt and confirm with user before continuing.

- [ ] **Step 2: Confirm admin middleware covers this route**

Read `src/middleware.ts`. Verify it intercepts `/admin/*` and rejects non-admin sessions. If yes, proceed. If no, stop and report to user before adding auth guard inside `getServerSideProps`.

- [ ] **Step 3: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `pnpm dev`. Log in as admin, navigate to `/admin/tours`. Expected: list renders immediately (no flicker — hydrated from server). Toggle a tour status — UI updates instantly (optimistic). Refresh — Devtools shows hydrated cache entries. Stop dev server.

- [ ] **Step 5: Run existing test suite**

Run: `pnpm test`
Expected: full suite passes.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/tours/index.tsx
git commit -m "feat(admin/tours): migrate list to useTours + SSR hydration + optimistic status toggle"
```

---

## Task 1.7: Migrate `/admin/tours/archive.tsx` to TanStack Query with SSR hydration

**Files:**

- Modify: `src/pages/admin/tours/archive.tsx`

- [ ] **Step 1: Replace imports + body**

Replace full file with:

```tsx
import {useEffect} from 'react';
import Link from 'next/link';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {
  useTours,
  useUpdateTour,
  useDeleteTourHard,
} from '@/queries/admin/tours';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchToursServer} from '@/queries/fetchers/admin/tours.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes} from '@/routes';
import type * as VMT from '@/domain';
import {getMinPrice} from '@/domain';

type AdminTour = {
  id: string;
  title: string;
  slug: string;
  status: VMT.TourStatus;
  destination: {name: string};
  pricingGroups: VMT.PricingGroup[];
  duration: string;
  imageUrl: string | null;
};

export default function AdminToursArchive() {
  const {data: tours, isLoading} = useTours({archived: true});
  const restore = useUpdateTour();
  const hardDelete = useDeleteTourHard();
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  function handleRestore(id: string) {
    restore.mutate({id, input: {status: 'DRAFT'}});
  }

  function handleHardDelete(id: string) {
    if (!confirm('Permanently delete this tour? This cannot be undone.'))
      return;
    hardDelete.mutate({id});
  }

  const tourList = (tours ?? []) as AdminTour[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Archived Tours</h1>
        <Link
          href={routes.admin.tours.list.path()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg type-label-sm uppercase border border-border text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          ← Back to Tours
        </Link>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Title
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Destination
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Price
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tourList.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center type-body-lg text-on-surface-tertiary"
                >
                  No archived tours.
                </td>
              </tr>
            )}
            {tourList.map((tour) => (
              <tr
                key={tour.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {tour.imageUrl ? (
                      <img
                        src={tour.imageUrl}
                        alt=""
                        className="h-[50px] w-auto rounded object-contain shrink-0"
                      />
                    ) : (
                      <div className="h-[50px] w-[50px] rounded bg-surface-alt flex items-center justify-center shrink-0">
                        <i className="fa fa-image text-on-surface-tertiary" />
                      </div>
                    )}
                    <span className="type-body-lg text-on-surface">
                      {tour.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface-secondary">
                  {tour.destination.name}
                </td>
                <td className="px-4 py-3 type-body-lg text-on-surface">
                  ${getMinPrice(tour.pricingGroups)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(tour.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-label-sm text-on-surface-secondary border border-border hover:bg-surface-alt transition-colors cursor-pointer"
                    >
                      <i className="fa fa-rotate-left text-xs" />
                      Restore
                    </button>
                    <button
                      onClick={() => handleHardDelete(tour.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg type-label-sm text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                    >
                      <i className="fa fa-trash text-xs" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: tourKeys.list({archived: true}),
    queryFn: () => fetchToursServer({archived: true}),
  });
  return {props: {dehydratedState: dehydrate(queryClient)}};
};
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Run: `pnpm dev`. As admin, navigate to `/admin/tours/archive`. Expected: archived list renders (hydrated). Restore a tour — UI updates after invalidation refresh. Hard-delete — row disappears instantly (optimistic), with rollback on error. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/tours/archive.tsx
git commit -m "feat(admin/tours): migrate archive page to TanStack Query + optimistic delete"
```

---

## Task 1.8: Migrate `/admin/tours/[id]/edit/[tab].tsx` to use `useTour` + SSR hydration

**Files:**

- Modify: `src/pages/admin/tours/[id]/edit/[tab].tsx`

**Note:** destinations data on this page stays on `useAdminFetch` until Phase 2. Only the tour-fetch portion migrates.

- [ ] **Step 1: Read existing file** and identify exactly where `useAdminFetch<Record<string, unknown>>` for the tour is used. Keep destinations on `useAdminFetch` for now.

- [ ] **Step 2: Replace tour fetch + add SSR prefetch (full file rewrite)**

Replace file with:

```tsx
import {useEffect} from 'react';
import type {GetServerSidePropsContext} from 'next';
import {useRouter} from 'next/router';
import {dehydrate} from '@tanstack/react-query';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {useTour} from '@/queries/admin/tours';
import {tourKeys} from '@/queries/admin/tours.keys';
import {fetchTourServer} from '@/queries/fetchers/admin/tours.server';
import {getQueryClient} from '@/lib/queryClient';
import {TourEditTabs} from '@/components/Admin/TourEditTabs';
import {savedSlot} from '@/lib/image-slot';
import {isTourTab, type TourTab} from '@/routes';

type Destination = {
  id: string;
  name: string;
  heroImage: string;
};

export default function EditTour() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const tabParam = router.query.tab;
  const tab: TourTab =
    typeof tabParam === 'string' && isTourTab(tabParam) ? tabParam : 'general';

  const {
    data: tour,
    isLoading: tourLoading,
    error: tourError,
  } = useTour(id ?? undefined);
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

  const tourRecord = tour as unknown as Record<string, unknown>;
  const highlights = (tourRecord.highlights as Array<{id: string}>) ?? [];
  const tourPerks =
    (tourRecord.perks as Array<{
      perkId: string;
      bucket: 'INCLUDED' | 'EXCLUDED';
    }>) ?? [];
  const initialIncludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'INCLUDED')
    .map((tp) => tp.perkId);
  const initialExcludedPerkIds = tourPerks
    .filter((tp) => tp.bucket === 'EXCLUDED')
    .map((tp) => tp.perkId);

  const initialGeneral = {
    slug: tourRecord.slug as string,
    destinationId: tourRecord.destinationId as string,
    title: tourRecord.title as string,
    titleVi: (tourRecord.titleVi as string) ?? '',
    titleEn: (tourRecord.titleEn as string) ?? '',
    duration: (tourRecord.duration as number) ?? 1,
    distance: (tourRecord.distance as number) ?? 0,
    descriptionVi: (tourRecord.descriptionVi as string) ?? '',
    descriptionEn: (tourRecord.descriptionEn as string) ?? '',
    transportation: (tourRecord.transportation as string) ?? '',
    hotel: (tourRecord.hotel as string) ?? '',
    guided: (tourRecord.guided as string) ?? '',
  };

  const initialCard = {
    imageCard: savedSlot(tourRecord.imageUrl as string | null),
  };

  return (
    <TourEditTabs
      activeTab={tab}
      mode="edit"
      tourId={tourRecord.id as string}
      destinations={destinations}
      initialGeneral={initialGeneral}
      initialCard={initialCard}
      initialItinerary={(tourRecord.itinerary as never) ?? []}
      initialPricingGroups={(tourRecord.pricingGroups as never) ?? []}
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
  const id = params?.id;
  if (typeof tab !== 'string' || !isTourTab(tab)) {
    return {notFound: true};
  }
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');

  const queryClient = getQueryClient();
  if (typeof id === 'string') {
    await queryClient.prefetchQuery({
      queryKey: tourKeys.detail(id),
      queryFn: () => fetchTourServer(id),
    });
  }

  return {
    props: {
      messages: messages ?? {},
      dehydratedState: dehydrate(queryClient),
    },
  };
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `pnpm dev`. As admin, navigate to `/admin/tours/<existing-id>/edit/general`. Expected: edit form populated immediately (hydrated). Devtools shows `['admin','tours','detail',<id>]` cache entry. Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/tours/[id]/edit/[tab].tsx
git commit -m "feat(admin/tours): migrate edit page to useTour + SSR hydration"
```

---

## Task 1.9: Migrate `TourEditTabs` mutations to `useCreateTour` / `useUpdateTour`

**Files:**

- Modify: `src/components/Admin/TourEditTabs/TourEditTabs.tsx`

**Goal:** Replace 6 `api.admin.tours.create/update` call sites with `useCreateTour` and `useUpdateTour`. Behavior unchanged: same `await` semantics + `error` string preserved for inline error UX.

- [ ] **Step 1: Read the file** at `src/components/Admin/TourEditTabs/TourEditTabs.tsx`. Locate all 6 call sites — lines ~62, ~65, ~89, ~98, ~107, ~116 in the prior snapshot. Note each call's `data` shape (whole-form vs partial fields).

- [ ] **Step 2: Add hook imports**

At the top of the file, near other imports, add:

```tsx
import {useCreateTour, useUpdateTour} from '@/queries/admin/tours';
```

Remove the `api` import (or leave it if other callers in the same file still use `api.X`; check via grep within this file).

- [ ] **Step 3: Acquire mutations inside the component**

Inside `TourEditTabs`, near other hook calls, add:

```tsx
const createTour = useCreateTour();
const updateTour = useUpdateTour();
```

- [ ] **Step 4: Replace each call site**

For the create/update branch around line 62–65 (general save):

```tsx
// Before:
const {data, error} =
  mode === 'create'
    ? await api.admin.tours.create(payload)
    : await api.admin.tours.update(tourId, payload);

// After:
let data: VMT.Tour | null = null;
let error: string | null = null;
try {
  data =
    mode === 'create'
      ? await createTour.mutateAsync(payload)
      : await updateTour.mutateAsync({id: tourId, input: payload});
} catch (e) {
  error = e instanceof Error ? e.message : 'Save failed';
}
```

For each of the four partial-update calls (~lines 89, 98, 107, 116):

```tsx
// Before:
const {error} = await api.admin.tours.update(tourId, {itinerary});

// After:
let error: string | null = null;
try {
  await updateTour.mutateAsync({id: tourId, input: {itinerary}});
} catch (e) {
  error = e instanceof Error ? e.message : 'Save failed';
}
```

Apply the same pattern for `{pricingGroups}`, `{highlightIds}`, and the final `data` partial. Keep the surrounding control flow (`if (error)` checks, `setError(...)` calls) exactly as before.

- [ ] **Step 5: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Run related tests**

Run: `pnpm test src/components/Admin/TourEditTabs`
Expected: existing tests pass. If they mock `api.admin.tours.update`, update them to mock `@/queries/admin/tours` exports instead. Show a diff of any test changes; tests must still verify the same observable behavior (form save → success path → error path).

- [ ] **Step 7: Manual smoke test**

Run: `pnpm dev`. Edit a tour, save general tab. Expected: save succeeds, list page reflects change after navigating back (cache invalidated). Edit pricing → save → reload → values persisted. Stop dev server.

- [ ] **Step 8: Commit**

```bash
git add src/components/Admin/TourEditTabs/TourEditTabs.tsx
# include any TourEditTabs spec files updated above
git commit -m "feat(admin/tours): migrate TourEditTabs save handlers to useCreateTour/useUpdateTour"
```

---

## Task 1.10: Verify no remaining tour call sites + final lint/typecheck/build

**Files:**

- (read-only verification)

- [ ] **Step 1: Grep for remaining direct usage of old patterns for tours**

Run: `grep -rn "api.admin.tours\|useAdminFetch.*tours" src/ --include='*.ts' --include='*.tsx'`
Expected output: only matches inside `src/routes/api.ts` itself (the `api.admin.tours` definition, kept for now), plus existing tests under `src/pages/api/admin/tours/__tests__/` that test the API route handler (those are correct — they test the handler, not the client). No matches in `src/pages/admin/`, `src/components/Admin/`, or other consumers.

If any other consumer match remains, halt and report — it must be migrated before declaring Phase 1 complete.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no new errors.

- [ ] **Step 3: Type-check**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Production build**

Run: `pnpm build`
Expected: build succeeds. No TypeScript errors. Build output should not include `@tanstack/react-query-devtools` in any client bundle (devtools is gated behind `process.env.NODE_ENV === 'development'` which Next.js dead-code-eliminates).

- [ ] **Step 6: Final phase commit (if any housekeeping changes accumulated)**

If any small fixes were made during verification:

```bash
git status
git add -p
git commit -m "chore(admin/tours): finalize Phase 1 migration"
```

If nothing to commit, skip.

- [ ] **Step 7: Run finishing-a-development-branch skill**

Per CLAUDE.md workflow rule: invoke `superpowers:finishing-a-development-branch` to decide on merge / PR / cleanup for this phase.

---

## Acceptance Criteria (Phase 0 + 1)

- [ ] `@tanstack/react-query` installed; `@tanstack/react-query-devtools` installed as devDependency.
- [ ] `_app.tsx` mounts `QueryClientProvider`, `HydrationBoundary`, and dev-only `ReactQueryDevtools`.
- [ ] `src/lib/queryClient.ts` exports `getQueryClient()` with server/client split (per-request server, singleton client).
- [ ] `src/queries/fetchers/http.ts` exports `http<T>` and `ApiError`; covered by passing tests.
- [ ] `src/test-utils/queryWrapper.tsx` exports `renderWithQuery`.
- [ ] `src/queries/admin/tours.keys.ts` exports `tourKeys` with stable shape; covered by passing tests.
- [ ] `src/queries/fetchers/admin/tours.ts` exports 5 client fetchers; covered by passing tests.
- [ ] `src/queries/fetchers/admin/tours.server.ts` exports `fetchToursServer` and `fetchTourServer`.
- [ ] `src/queries/admin/tours.ts` exports `useTours`, `useTour`, `useCreateTour`, `useUpdateTour`, `useToggleTourStatus`, `useDeleteTourHard`; covered by passing tests including optimistic rollback.
- [ ] `src/data/queries.ts` exposes `getToursForAdmin` and `getTourByIdForAdmin`; admin route handlers reuse them.
- [ ] `/admin/tours`, `/admin/tours/archive`, `/admin/tours/[id]/edit/[tab]` use `useTours`/`useTour` with SSR hydration; no `useAdminFetch` calls remain on these pages for tour data.
- [ ] `TourEditTabs` save handlers use `useCreateTour` / `useUpdateTour`; no `api.admin.tours.create/update` calls remain in admin component code.
- [ ] `pnpm test`, `pnpm lint`, `pnpm tsc --noEmit`, `pnpm build` all pass.
- [ ] `api.admin.tours.*` branch in `src/routes/api.ts` is left intact (deletion deferred to Phase 7).
- [ ] `useAdminFetch.ts` is left intact (other resources still depend on it).

## Out of Scope (this plan)

- Destinations / perks / highlights / image-collections / translations / users / stats migrations — separate plans, Phases 2–6.
- Public destination highlights pagination — Phase 6.
- Cleanup of `src/routes/api.ts` and deletion of `useAdminFetch.ts` — Phase 7.
- Global toast / error boundary refactor.
- Suspense / `useSuspenseQuery` adoption.
- Cache persistence to localStorage.
