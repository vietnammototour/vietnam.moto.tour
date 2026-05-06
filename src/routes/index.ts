import {useRouter} from 'next/router';
import type * as VMT from '@/domain';
import type {AdminStats} from '@/types';

// ─── Route Registry ───────────────────────────────────────

export const routes = {
  home: {path: () => '/'},
  tours: {
    list: {path: () => '/tours'},
    detail: {path: (p: {slug: string}) => `/tours/${p.slug}`},
    byDestination: {
      path: (p: {destinationId: string | number}) =>
        `/tours?destination=${p.destinationId}`,
    },
  },
  aboutUs: {path: () => '/about-us'},
  contact: {path: () => '/contact'},

  admin: {
    dashboard: {path: () => '/admin'},
    tours: {
      list: {path: () => '/admin/tours'},
      new: {path: () => '/admin/tours/new'},
      edit: {path: (p: {id: string | number}) => `/admin/tours/${p.id}/edit`},
    },
    destinations: {
      list: {path: () => '/admin/destinations'},
      new: {path: () => '/admin/destinations/new'},
      edit: {
        path: (p: {id: string | number}) => `/admin/destinations/${p.id}/edit`,
      },
    },
    translations: {path: () => '/admin/translations'},
    users: {path: () => '/admin/users'},
  },

  isAdmin: (pathname: string) => pathname.startsWith('/admin'),
} as const;

// ─── API Client ───────────────────────────────────────────

type ApiResult<T> = {data: T; error: null} | {data: null; error: string};

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

export const api = {
  admin: {
    tours: {
      list: () => request<VMT.Tour[]>('/api/admin/tours'),
      get: (id: string) => request<VMT.Tour>(`/api/admin/tours/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.Tour>('/api/admin/tours', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.Tour>(`/api/admin/tours/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/tours/${id}`, {method: 'DELETE'}),
    },
    destinations: {
      list: () => request<VMT.Destination[]>('/api/admin/destinations'),
      get: (id: string) =>
        request<VMT.Destination>(`/api/admin/destinations/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.Destination>('/api/admin/destinations', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.Destination>(`/api/admin/destinations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/destinations/${id}`, {method: 'DELETE'}),
    },
    highlights: {
      list: (destinationId: string) =>
        request<VMT.Highlight[]>(
          `/api/admin/highlights?destinationId=${destinationId}`,
        ),
      create: (data: Record<string, unknown>) =>
        request<VMT.Highlight>('/api/admin/highlights', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.Highlight>(`/api/admin/highlights/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/highlights/${id}`, {method: 'DELETE'}),
    },
    users: {
      list: () => request<VMT.User[]>('/api/admin/users'),
      create: (data: Record<string, unknown>) =>
        request<VMT.User>('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/users/${id}`, {method: 'DELETE'}),
    },
    translations: {
      list: () => request<VMT.Translation[]>('/api/admin/translations'),
      update: (data: Record<string, unknown>[]) =>
        request<VMT.Translation[]>('/api/admin/translations', {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
    },
    stats: () => request<AdminStats>('/api/admin/stats'),
    upload: {
      create: (formData: FormData) =>
        request<{url: string}>('/api/admin/upload', {
          method: 'POST',
          body: formData,
          headers: {},
        }),
      delete: (data: Record<string, unknown>) =>
        request<void>('/api/admin/upload', {
          method: 'DELETE',
          body: JSON.stringify(data),
        }),
    },
  },
};

// ─── Navigation Hook ──────────────────────────────────────

type RoutePath = {path: (...args: never[]) => string};

export function useNavigate() {
  const router = useRouter();

  return {
    to(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      router.push(path);
    },
    replace(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      router.replace(path);
    },
    replaceUrl(route: RoutePath, ...args: unknown[]) {
      const path = (route.path as (...a: unknown[]) => string)(...args);
      window.history.replaceState(null, '', path);
    },
  };
}
