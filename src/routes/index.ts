import {useRouter} from 'next/router';
import type * as VMT from '@/domain';
import type {EntityType, ImageType} from '@/lib/upload-entities';
type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};

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
      new: {
        path: (p?: {tab?: TourTab}) =>
          `/admin/tours/new/${p?.tab ?? 'general'}`,
        tabs: TOUR_TABS,
      },
      edit: {
        path: (p: {id: string | number; tab?: TourTab}) =>
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
        path: (p: {id: string | number; tab?: DestinationTab}) =>
          `/admin/destinations/${p.id}/edit/${p.tab ?? 'general'}`,
        tabs: DESTINATION_TABS,
      },
    },
    perks: {
      list: {path: () => '/admin/perks'},
      new: {path: () => '/admin/perks/new'},
      edit: {path: (p: {id: string | number}) => `/admin/perks/${p.id}/edit`},
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
    perks: {
      list: (params?: {
        archived?: boolean;
        category?: string;
        search?: string;
      }) => {
        const qs = new URLSearchParams();
        if (params?.archived !== undefined)
          qs.set('archived', String(params.archived));
        if (params?.category) qs.set('category', params.category);
        if (params?.search) qs.set('search', params.search);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request<VMT.Perk[]>(`/api/admin/perks${suffix}`);
      },
      get: (id: string) => request<VMT.Perk>(`/api/admin/perks/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.Perk>('/api/admin/perks', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.Perk>(`/api/admin/perks/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/perks/${id}`, {method: 'DELETE'}),
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
      create: ({
        entityType,
        entityId,
        imageType,
        blob,
      }: {
        entityType: EntityType;
        entityId: string;
        imageType: ImageType;
        blob: Blob;
      }) => {
        const fd = new FormData();
        fd.append('entityType', entityType);
        fd.append('entityId', entityId);
        fd.append('imageType', imageType);
        fd.append('file', blob, `upload.webp`);
        return request<{url: string; hash: string; byteSize: number}>(
          '/api/admin/upload',
          {method: 'POST', body: fd, headers: {}},
        );
      },
      delete: ({
        entityType,
        entityId,
        imageType,
      }: {
        entityType: EntityType;
        entityId: string;
        imageType: ImageType;
      }) =>
        request<{success: true}>('/api/admin/upload', {
          method: 'DELETE',
          body: JSON.stringify({entityType, entityId, imageType}),
          headers: {'Content-Type': 'application/json'},
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
