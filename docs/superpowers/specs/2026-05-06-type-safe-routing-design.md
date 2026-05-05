# Type-Safe Routing Abstraction

**Date:** 2026-05-06
**Status:** Draft
**Approach:** Single Route Registry Object (Approach A)

## Problem

All routes are hardcoded strings scattered across 30+ files. No centralized route constants, no URL builders, no typed API client. Refactoring routes requires find-and-replace across the entire codebase.

## Goals

- Single source of truth for all page routes and API endpoints
- Type-safe param builders for dynamic routes (`slug`, `id`)
- Typed API client with result pattern for all admin endpoints
- Navigation helpers wrapping `router.push`, `router.replace`, `window.history.replaceState`
- Route utility getters (e.g., `isAdmin`)

## Non-Goals

- Public-facing API routes (none exist, none planned)
- Locale switching integration (stays in `LanguageSwitcher`)
- Server-side route generation

## File Structure

Single new file: `src/routes/index.ts`

Contains:

1. Route registry (`routes`)
2. API client (`api`)
3. Navigation hook (`useNavigate`)

## 1. Route Registry

```ts
export const routes = {
  // Public pages
  home: {path: () => '/'},
  tours: {
    list: {path: () => '/tours'},
    detail: {path: (p: {slug: string}) => `/tours/${p.slug}`},
    byDestination: {
      path: (p: {destinationId: string}) =>
        `/tours?destination=${p.destinationId}`,
    },
  },
  aboutUs: {path: () => '/about-us'},
  contact: {path: () => '/contact'},

  // Admin pages
  admin: {
    dashboard: {path: () => '/admin'},
    tours: {
      list: {path: () => '/admin/tours'},
      new: {path: () => '/admin/tours/new'},
      edit: {path: (p: {id: string}) => `/admin/tours/${p.id}/edit`},
    },
    destinations: {
      list: {path: () => '/admin/destinations'},
      new: {path: () => '/admin/destinations/new'},
      edit: {path: (p: {id: string}) => `/admin/destinations/${p.id}/edit`},
    },
    translations: {path: () => '/admin/translations'},
    users: {path: () => '/admin/users'},
  },

  // Route utilities
  isAdmin: (pathname: string) => pathname.startsWith('/admin'),
} as const;
```

Every route node has a `.path()` function. Dynamic segments require typed params objects.

## 2. API Client

### Result Type

```ts
type ApiResult<T> = {data: T; error: null} | {data: null; error: string};
```

All API methods return `Promise<ApiResult<T>>`. No thrown exceptions — callers check `if (error)`.

### Internal Helper

```ts
async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      headers: {'Content-Type': 'application/json'},
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {data: null, error: body.error || res.statusText};
    }
    if (res.status === 204) return {data: null as T, error: null};
    return {data: await res.json(), error: null};
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}
```

### API Object

```ts
export const api = {
  admin: {
    tours: {
      list: () => request<Tour[]>('/api/admin/tours'),
      get: (id: string) => request<Tour>(`/api/admin/tours/${id}`),
      create: (data: Partial<Tour>) =>
        request<Tour>('/api/admin/tours', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Partial<Tour>) =>
        request<Tour>(`/api/admin/tours/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/tours/${id}`, {method: 'DELETE'}),
    },
    destinations: {
      list: () => request<Destination[]>('/api/admin/destinations'),
      get: (id: string) =>
        request<Destination>(`/api/admin/destinations/${id}`),
      create: (data: Partial<Destination>) =>
        request<Destination>('/api/admin/destinations', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Partial<Destination>) =>
        request<Destination>(`/api/admin/destinations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/destinations/${id}`, {method: 'DELETE'}),
    },
    highlights: {
      list: () => request<Highlight[]>('/api/admin/highlights'),
      get: (id: string) => request<Highlight>(`/api/admin/highlights/${id}`),
      create: (data: Partial<Highlight>) =>
        request<Highlight>('/api/admin/highlights', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Partial<Highlight>) =>
        request<Highlight>(`/api/admin/highlights/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/highlights/${id}`, {method: 'DELETE'}),
    },
    users: {
      list: () => request<User[]>('/api/admin/users'),
      get: (id: string) => request<User>(`/api/admin/users/${id}`),
      create: (data: Partial<User>) =>
        request<User>('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Partial<User>) =>
        request<User>(`/api/admin/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/users/${id}`, {method: 'DELETE'}),
    },
    translations: {
      list: () => request<Translation[]>('/api/admin/translations'),
      update: (data: Translation[]) =>
        request<Translation[]>('/api/admin/translations', {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
    },
    stats: () => request<AdminStats>('/api/admin/stats'),
    upload: (formData: FormData) =>
      request<{url: string}>('/api/admin/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary for FormData
      }),
  },
};
```

Types (`Tour`, `Destination`, `Highlight`, `User`, `Translation`, `AdminStats`) imported from `src/types/index.ts`. Missing types to be added there.

### Upload Note

The `upload` endpoint passes empty `headers: {}` to override the default `Content-Type: application/json`, letting the browser set the correct `multipart/form-data` boundary for `FormData`.

## 3. Navigation Hook

```ts
import {useRouter} from 'next/router';

type RouteNode<P = void> = {
  path: P extends void ? () => string : (params: P) => string;
};

export function useNavigate() {
  const router = useRouter();

  return {
    to<P>(route: RouteNode<P>, ...args: P extends void ? [] : [P]) {
      const path = (route.path as Function)(...args);
      router.push(path);
    },
    replace<P>(route: RouteNode<P>, ...args: P extends void ? [] : [P]) {
      const path = (route.path as Function)(...args);
      router.replace(path);
    },
    replaceUrl<P>(route: RouteNode<P>, ...args: P extends void ? [] : [P]) {
      const path = (route.path as Function)(...args);
      window.history.replaceState(null, '', path);
    },
  };
}
```

- `to()` — wraps `router.push`
- `replace()` — wraps `router.replace`
- `replaceUrl()` — wraps `window.history.replaceState` (used in TourEditTabs/DestinationEditTabs after create)

## 4. Migration Plan

### Replace hardcoded route strings

| Before                                       | After                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `<Link href="/tours">`                       | `<Link href={routes.tours.list.path()}>`                               |
| `<Link href={`/tours/${slug}`}>`             | `<Link href={routes.tours.detail.path({ slug })}>`                     |
| `<Link href={`/tours?destination=${id}`}>`   | `<Link href={routes.tours.byDestination.path({ destinationId: id })}>` |
| `router.push('/admin/destinations')`         | `navigate.to(routes.admin.destinations.list)`                          |
| `window.history.replaceState(null, '', ...)` | `navigate.replaceUrl(routes.admin.tours.edit, { id })`                 |
| `router.pathname === '/about-us'`            | `router.pathname === routes.aboutUs.path()`                            |
| `router.pathname.startsWith('/admin')`       | `routes.isAdmin(router.pathname)`                                      |

### Replace raw fetch calls

All `fetch('/api/admin/...')` calls replaced with corresponding `api.admin.*` methods. Callers updated from try/catch to `{ data, error }` destructuring.

### Files to modify

**Components:**

- `src/components/header/index.tsx` — nav links, active state checks
- `src/components/footer/index.tsx` — footer links
- `src/components/admin/AdminLayout.tsx` — sidebar nav, active state
- `src/components/tour-card/index.tsx` — tour detail link
- `src/components/destination-card/index.tsx` — destination filter link
- `src/components/admin/TourEditTabs.tsx` — API calls, navigation, history replace
- `src/components/admin/DestinationEditTabs.tsx` — API calls, navigation, history replace
- `src/components/admin/DestinationGeneralForm.tsx` — API calls, navigation

**Pages:**

- `src/pages/_app.tsx` — `isAdmin` check
- `src/pages/index.tsx` — tours link
- `src/pages/admin/tours/index.tsx` — new tour link, API calls
- `src/pages/admin/destinations/index.tsx` — new/edit links, API calls
- `src/pages/admin/index.tsx` — stats API call
- `src/pages/admin/translations.tsx` — translations API calls
- `src/pages/admin/users.tsx` — users API calls

### Not migrated

- `LanguageSwitcher` locale switching — separate concern
- `src/pages/api/` route handlers — these define the endpoints, not consume them
- `src/middleware.ts` — server-side auth check, not client navigation

## 5. Post-Implementation

- Update `CLAUDE.md` with routing abstraction documentation
- Add any missing types to `src/types/index.ts` (`Highlight`, `AdminStats`, `Translation`, `User` if not present)
