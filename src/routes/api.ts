import type * as VMT from '@/domain';
import type {EntityType, ImageType} from '@/lib/upload-entities';

type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};

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
      list: (params?: {archived?: boolean}) => {
        const qs = new URLSearchParams();
        if (params?.archived !== undefined)
          qs.set('archived', String(params.archived));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request<VMT.Tour[]>(`/api/admin/tours${suffix}`);
      },
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
      delete: (id: string, options?: {hard?: boolean}) => {
        const suffix = options?.hard ? '?hard=true' : '';
        return request<void>(`/api/admin/tours/${id}${suffix}`, {
          method: 'DELETE',
        });
      },
    },
    destinations: {
      list: (params?: {archived?: boolean}) => {
        const qs = new URLSearchParams();
        if (params?.archived !== undefined)
          qs.set('archived', String(params.archived));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return request<VMT.Destination[]>(`/api/admin/destinations${suffix}`);
      },
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
      delete: (id: string, options?: {hard?: boolean}) => {
        const suffix = options?.hard ? '?hard=true' : '';
        return request<void>(`/api/admin/destinations/${id}${suffix}`, {
          method: 'DELETE',
        });
      },
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
      list: (params?: {category?: string; search?: string}) => {
        const qs = new URLSearchParams();
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
