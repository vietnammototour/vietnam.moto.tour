import type * as VMT from '@/domain';
import type {EntityType, ImageType} from '@/lib/upload-entities';

type AdminStats = {
  tourCount: number;
  destinationCount: number;
  userCount: number;
};

type BackupMeta = {
  filename: string;
  createdAt: string;
  source: 'manual' | 'scheduled';
  byteSize: number;
  kind: 'db' | 'media';
};

type BackupList = {backups: BackupMeta[]; maxBackups: number};

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
  destinations: {
    highlights: (slug: string, params: {skip: number; take: number}) => {
      const qs = new URLSearchParams({
        skip: String(params.skip),
        take: String(params.take),
      });
      return request<{items: VMT.Highlight[]; total: number}>(
        `/api/destinations/${encodeURIComponent(slug)}/highlights?${qs.toString()}`,
      );
    },
  },
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
    imageCollections: {
      list: () =>
        request<
          Array<{id: string; key: string; label: string; imageCount: number}>
        >('/api/admin/image-collections'),
      get: (id: string) =>
        request<VMT.ImageCollection>(`/api/admin/image-collections/${id}`),
      create: (data: {key: string; label: string}) =>
        request<{id: string; key: string; label: string}>(
          '/api/admin/image-collections',
          {method: 'POST', body: JSON.stringify(data)},
        ),
      update: (id: string, data: {label: string}) =>
        request<{id: string; key: string; label: string}>(
          `/api/admin/image-collections/${id}`,
          {method: 'PATCH', body: JSON.stringify(data)},
        ),
      delete: (id: string) =>
        request<void>(`/api/admin/image-collections/${id}`, {method: 'DELETE'}),
      images: {
        add: (collectionId: string, data: {altEn?: string; altVi?: string}) =>
          request<VMT.CollectionImage>(
            `/api/admin/image-collections/${collectionId}/images`,
            {method: 'POST', body: JSON.stringify(data)},
          ),
        update: (
          collectionId: string,
          imageId: string,
          data: {altEn?: string; altVi?: string},
        ) =>
          request<VMT.CollectionImage>(
            `/api/admin/image-collections/${collectionId}/images/${imageId}`,
            {method: 'PATCH', body: JSON.stringify(data)},
          ),
        delete: (collectionId: string, imageId: string) =>
          request<void>(
            `/api/admin/image-collections/${collectionId}/images/${imageId}`,
            {method: 'DELETE'},
          ),
        reorder: (collectionId: string, ids: string[]) =>
          request<void>(
            `/api/admin/image-collections/${collectionId}/images/reorder`,
            {method: 'PATCH', body: JSON.stringify({ids})},
          ),
      },
    },
    users: {
      list: () => request<VMT.UserAdmin[]>('/api/admin/users'),
      get: (id: string) => request<VMT.UserAdmin>(`/api/admin/users/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.UserAdmin>('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.UserAdmin>(`/api/admin/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/users/${id}`, {method: 'DELETE'}),
    },
    roles: {
      list: () => request<VMT.OrgRole[]>('/api/admin/roles'),
      get: (id: string) => request<VMT.OrgRole>(`/api/admin/roles/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.OrgRole>('/api/admin/roles', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.OrgRole>(`/api/admin/roles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/roles/${id}`, {method: 'DELETE'}),
    },
    reviews: {
      list: () => request<(VMT.Review & {tour: {id: string; slug: string; titleEn: string}})[]>(
        '/api/admin/reviews',
      ),
      get: (id: string) => request<VMT.Review>(`/api/admin/reviews/${id}`),
      create: (data: Record<string, unknown>) =>
        request<VMT.Review>('/api/admin/reviews', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request<VMT.Review>(`/api/admin/reviews/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<void>(`/api/admin/reviews/${id}`, {method: 'DELETE'}),
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
    backups: {
      list: (kind?: 'db' | 'media') =>
        request<BackupList>(
          `/api/admin/backups${kind ? `?kind=${kind}` : ''}`,
        ),
      create: (kind?: 'db' | 'media') =>
        request<BackupList>(
          `/api/admin/backups${kind ? `?kind=${kind}` : ''}`,
          {method: 'POST'},
        ),
      downloadUrl: (filename: string) =>
        `/api/admin/backups/${encodeURIComponent(filename)}/download`,
    },
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
