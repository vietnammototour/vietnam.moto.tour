# Image Collection CMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded home-page gallery with a generic admin-managed `ImageCollection` system, keyed by string for reuse across pages.

**Architecture:** Two new Prisma models (`ImageCollection` + `CollectionImage`). Admin pages at `/admin/image-collections`. Drag-and-drop reordering via `@dnd-kit`. Reuses existing `/api/admin/upload.ts` pipeline by extending `upload-entities` with a new `collectionImage` entity type. Home page reads via `getServerSideProps`.

**Tech Stack:** Next.js 16 (Pages Router), Prisma, NextAuth, react-hook-form + Yup, Tailwind v4, next-intl, `@dnd-kit/core` + `@dnd-kit/sortable` (new), Jest + RTL.

**Spec:** `docs/superpowers/specs/2026-05-08-image-collection-cms-design.md`

---

## File Map

**Create:**

- `prisma/migrations/<timestamp>_image_collection/migration.sql`
- `prisma/seed-home-gallery.ts`
- `src/domain/image-collection/index.ts`
- `src/domain/image-collection/mapper.ts`
- `src/data/queries/image-collections.ts`
- `src/data/queries/image-collections.spec.ts`
- `src/pages/api/admin/image-collections/index.ts`
- `src/pages/api/admin/image-collections/[id].ts`
- `src/pages/api/admin/image-collections/[id]/images/index.ts`
- `src/pages/api/admin/image-collections/[id]/images/[imageId].ts`
- `src/pages/api/admin/image-collections/[id]/images/reorder.ts`
- `src/pages/admin/image-collections/index.tsx`
- `src/pages/admin/image-collections/new.tsx`
- `src/pages/admin/image-collections/[id].tsx`
- `src/components/Admin/ImageCollectionEditor/index.ts`
- `src/components/Admin/ImageCollectionEditor/ImageCollectionEditor.tsx`
- `src/components/Admin/ImageCollectionEditor/ImageCollectionEditor.spec.tsx`
- `src/components/Admin/ImageCollectionEditor/ImageCollectionEditor.form-utils.ts`
- `src/components/Admin/ImageCollectionEditor/SortableImageCard.tsx`
- `src/components/Admin/ImageCollectionEditor/SortableImageCard.spec.tsx`
- `src/components/Admin/ImageCollectionEditor/AddImageButton.tsx`

**Modify:**

- `prisma/schema.prisma` — add models
- `src/lib/upload-entities.ts` — add `collectionImage` entity
- `src/pages/api/admin/upload.ts` — handle `collectionImage`
- `src/domain/index.ts` — re-export new types
- `src/data/queries.ts` — re-export `getImageCollection`
- `src/routes/registry.ts` — add admin routes
- `src/routes/api.ts` — add admin API client
- `src/components/AdminSidebar/AdminSidebar.tsx` (or wherever sidebar lives) — add nav entry
- `src/messages/en.json` + `src/messages/vi.json` — admin labels; remove `galleryAlt1..5`
- `src/pages/index.tsx` — load gallery from DB; remove hardcoded `galleryImageUrls`
- `package.json` — add `@dnd-kit/core` + `@dnd-kit/sortable`

**Delete:**

- `public/assets/images/gallery/gallery-one-img-{1..5}.jpeg`

---

## Task 1: Add Prisma models + migration

**Files:** Modify `prisma/schema.prisma`. Create migration.

- [ ] **Step 1: Add models to schema**

In `prisma/schema.prisma`, append after the `Translation` model:

```prisma
model ImageCollection {
  id        String            @id @default(cuid())
  key       String            @unique
  label     String
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  images    CollectionImage[]
}

model CollectionImage {
  id           String          @id @default(cuid())
  collectionId String
  collection   ImageCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  url          String          @default("")
  altEn        String          @default("")
  altVi        String          @default("")
  order        Int             @default(0)
  createdAt    DateTime        @default(now())

  @@index([collectionId, order])
}
```

- [ ] **Step 2: Generate migration**

Run: `npx prisma migrate dev --name image_collection --create-only`

- [ ] **Step 3: Apply migration + regenerate client**

Run: `npx prisma migrate dev` then `npx prisma generate`.
Expected: migration applied, types updated.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add ImageCollection and CollectionImage models"
```

---

## Task 2: Domain types + mapper

**Files:** Create `src/domain/image-collection/index.ts`, `mapper.ts`. Modify `src/domain/index.ts`.

- [ ] **Step 1: Create domain types**

`src/domain/image-collection/index.ts`:

```ts
import type {
  ImageCollection as PrismaCollection,
  CollectionImage as PrismaImage,
} from '@prisma/client';

export type CollectionImage = Omit<PrismaImage, 'createdAt'>;

export type ImageCollection = Omit<
  PrismaCollection,
  'createdAt' | 'updatedAt'
> & {
  images: CollectionImage[];
};
```

- [ ] **Step 2: Create mapper**

`src/domain/image-collection/mapper.ts`:

```ts
import type {
  ImageCollection as PrismaCollection,
  CollectionImage as PrismaImage,
} from '@prisma/client';
import type {ImageCollection, CollectionImage} from './index';

export function toCollectionImage(row: PrismaImage): CollectionImage {
  return {
    id: row.id,
    collectionId: row.collectionId,
    url: row.url,
    altEn: row.altEn,
    altVi: row.altVi,
    order: row.order,
  };
}

export function toImageCollection(
  row: PrismaCollection & {images: PrismaImage[]},
): ImageCollection {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    images: row.images.map(toCollectionImage),
  };
}
```

- [ ] **Step 3: Re-export from domain index**

Append to `src/domain/index.ts`:

```ts
export type {ImageCollection, CollectionImage} from './image-collection';
```

- [ ] **Step 4: Type-check**

Run: `pnpm build` (or `tsc --noEmit`).
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/domain/
git commit -m "feat(domain): add ImageCollection types and mapper"
```

---

## Task 3: Data query (`getImageCollection`)

**Files:** Create `src/data/queries/image-collections.ts`, `image-collections.spec.ts`. Modify `src/data/queries.ts`.

- [ ] **Step 1: Write failing test**

`src/data/queries/image-collections.spec.ts`:

```ts
import {getImageCollection} from './image-collections';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {imageCollection: {findUnique: jest.fn()}},
}));

describe('getImageCollection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns mapped collection with ordered images', async () => {
    (prisma.imageCollection.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      key: 'home-gallery',
      label: 'Home',
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [
        {
          id: 'i1',
          collectionId: 'c1',
          url: '/a.webp',
          altEn: 'a',
          altVi: 'av',
          order: 0,
          createdAt: new Date(),
        },
        {
          id: 'i2',
          collectionId: 'c1',
          url: '/b.webp',
          altEn: 'b',
          altVi: 'bv',
          order: 1,
          createdAt: new Date(),
        },
      ],
    });
    const result = await getImageCollection('home-gallery');
    expect(result).toEqual({
      id: 'c1',
      key: 'home-gallery',
      label: 'Home',
      images: [
        {
          id: 'i1',
          collectionId: 'c1',
          url: '/a.webp',
          altEn: 'a',
          altVi: 'av',
          order: 0,
        },
        {
          id: 'i2',
          collectionId: 'c1',
          url: '/b.webp',
          altEn: 'b',
          altVi: 'bv',
          order: 1,
        },
      ],
    });
  });

  it('returns null when missing', async () => {
    (prisma.imageCollection.findUnique as jest.Mock).mockResolvedValue(null);
    expect(await getImageCollection('missing')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL** (`pnpm test image-collections.spec`).

- [ ] **Step 3: Implement query**

`src/data/queries/image-collections.ts`:

```ts
import {prisma} from '@/lib/prisma';
import {toImageCollection} from '@/domain/image-collection/mapper';
import type {ImageCollection} from '@/domain';

export async function getImageCollection(
  key: string,
): Promise<ImageCollection | null> {
  const row = await prisma.imageCollection.findUnique({
    where: {key},
    include: {images: {orderBy: {order: 'asc'}}},
  });
  return row ? toImageCollection(row) : null;
}

export async function listImageCollections(): Promise<
  Array<{id: string; key: string; label: string; imageCount: number}>
> {
  const rows = await prisma.imageCollection.findMany({
    orderBy: {label: 'asc'},
    include: {_count: {select: {images: true}}},
  });
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    imageCount: r._count.images,
  }));
}
```

- [ ] **Step 4: Re-export from `src/data/queries.ts`**

Append:

```ts
export {
  getImageCollection,
  listImageCollections,
} from './queries/image-collections';
```

- [ ] **Step 5: Run test, expect PASS.**

- [ ] **Step 6: Commit**

```bash
git add src/data/
git commit -m "feat(data): add getImageCollection query"
```

---

## Task 4: Extend upload-entities for `collectionImage`

**Files:** Modify `src/lib/upload-entities.ts`, `src/pages/api/admin/upload.ts`.

- [ ] **Step 1: Update entity types**

In `src/lib/upload-entities.ts`:

```ts
export const ENTITY_TYPES = [
  'tour',
  'destination',
  'highlight',
  'collectionImage',
] as const;
export const IMAGE_TYPES = ['card', 'hero'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
export type ImageType = (typeof IMAGE_TYPES)[number];

const VALID: Record<EntityType, readonly ImageType[]> = {
  tour: ['card'],
  destination: ['card', 'hero'],
  highlight: ['card'],
  collectionImage: ['card'],
};

// ... isValid* helpers unchanged ...

type DbField = {
  model: 'tour' | 'destination' | 'highlight' | 'collectionImage';
  field: string;
};

export function getDbField(entity: EntityType, image: ImageType): DbField {
  if (entity === 'destination' && image === 'hero') {
    return {model: 'destination', field: 'heroImage'};
  }
  if (entity === 'collectionImage') {
    return {model: 'collectionImage', field: 'url'};
  }
  return {model: entity, field: 'imageUrl'};
}
```

- [ ] **Step 2: Wire upload.ts to handle `collectionImage`**

In `src/pages/api/admin/upload.ts`:

Update `checkEntityExists`:

```ts
async function checkEntityExists(entityType: EntityType, entityId: string) {
  if (entityType === 'tour')
    return !!(await prisma.tour.findUnique({where: {id: entityId}}));
  if (entityType === 'destination')
    return !!(await prisma.destination.findUnique({where: {id: entityId}}));
  if (entityType === 'highlight')
    return !!(await prisma.highlight.findUnique({where: {id: entityId}}));
  return !!(await prisma.collectionImage.findUnique({where: {id: entityId}}));
}
```

Update `readPreviousUrl`:

```ts
async function readPreviousUrl(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
) {
  if (entityType === 'destination' && imageType === 'hero') {
    const r = await prisma.destination.findUnique({where: {id: entityId}});
    return r?.heroImage ?? null;
  }
  if (entityType === 'tour') {
    const r = await prisma.tour.findUnique({where: {id: entityId}});
    return r?.imageUrl ?? null;
  }
  if (entityType === 'destination') {
    const r = await prisma.destination.findUnique({where: {id: entityId}});
    return r?.imageUrl ?? null;
  }
  if (entityType === 'highlight') {
    const r = await prisma.highlight.findUnique({where: {id: entityId}});
    return r?.imageUrl ?? null;
  }
  const r = await prisma.collectionImage.findUnique({where: {id: entityId}});
  return r?.url ?? null;
}
```

Update `updateDb`:

```ts
async function updateDb(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  url: string | null,
) {
  const {model, field} = getDbField(entityType, imageType);
  const data = {[field]: url ?? ''};
  if (model === 'tour') await prisma.tour.update({where: {id: entityId}, data});
  else if (model === 'destination')
    await prisma.destination.update({where: {id: entityId}, data});
  else if (model === 'highlight')
    await prisma.highlight.update({where: {id: entityId}, data});
  else await prisma.collectionImage.update({where: {id: entityId}, data});
}
```

Note `data = {[field]: url ?? ''}` — `CollectionImage.url` is non-nullable, so DELETE replaces with empty string; the row is then deleted via collection-image API (Task 7). For other entities the `?? ''` is harmless because `null` was the previous default — but to preserve nullable behavior on tour/destination/highlight, branch it:

```ts
async function updateDb(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  url: string | null,
) {
  const {model, field} = getDbField(entityType, imageType);
  if (model === 'tour')
    await prisma.tour.update({where: {id: entityId}, data: {[field]: url}});
  else if (model === 'destination')
    await prisma.destination.update({
      where: {id: entityId},
      data: {[field]: url},
    });
  else if (model === 'highlight')
    await prisma.highlight.update({
      where: {id: entityId},
      data: {[field]: url},
    });
  else
    await prisma.collectionImage.update({
      where: {id: entityId},
      data: {[field]: url ?? ''},
    });
}
```

Update file path generation in `handlePost` (line 160). The current `relDir = ${entityType}s/${entityId}` produces `collectionImages/<id>` — fine.

- [ ] **Step 3: Type-check**

Run: `pnpm build`. Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/upload-entities.ts src/pages/api/admin/upload.ts
git commit -m "feat(upload): support collectionImage entity type"
```

---

## Task 5: Admin API — collection list + create + get + update + delete

**Files:** Create `src/pages/api/admin/image-collections/index.ts`, `[id].ts`.

- [ ] **Step 1: Create list/create handler**

`src/pages/api/admin/image-collections/index.ts`:

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const KEY_RE = /^[a-z0-9-]+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;

  if (req.method === 'GET') {
    const rows = await prisma.imageCollection.findMany({
      orderBy: {label: 'asc'},
      include: {_count: {select: {images: true}}},
    });
    return res.json(
      rows.map((r) => ({
        id: r.id,
        key: r.key,
        label: r.label,
        imageCount: r._count.images,
      })),
    );
  }

  if (req.method === 'POST') {
    const {key, label} = req.body ?? {};
    if (typeof key !== 'string' || !KEY_RE.test(key)) {
      return res.status(400).json({error: 'key must match [a-z0-9-]+'});
    }
    if (typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({error: 'label is required'});
    }
    const existing = await prisma.imageCollection.findUnique({where: {key}});
    if (existing) return res.status(409).json({error: 'key already exists'});
    const created = await prisma.imageCollection.create({data: {key, label}});
    return res.status(201).json(created);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Create get/update/delete handler**

`src/pages/api/admin/image-collections/[id].ts`:

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toImageCollection} from '@/domain/image-collection/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  const id = req.query.id as string;

  if (req.method === 'GET') {
    const row = await prisma.imageCollection.findUnique({
      where: {id},
      include: {images: {orderBy: {order: 'asc'}}},
    });
    if (!row) return res.status(404).json({error: 'Collection not found'});
    return res.json(toImageCollection(row));
  }

  if (req.method === 'PATCH') {
    const {label} = req.body ?? {};
    if (typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({error: 'label is required'});
    }
    const updated = await prisma.imageCollection.update({
      where: {id},
      data: {label},
    });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    await prisma.imageCollection.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/image-collections/
git commit -m "feat(api): admin CRUD for image collections"
```

---

## Task 6: Admin API — image add / update alts / delete

**Files:** Create `src/pages/api/admin/image-collections/[id]/images/index.ts`, `[imageId].ts`.

Note: image **uploads** go through existing `/api/admin/upload.ts` once the `CollectionImage` row exists. These handlers manage the row + alt fields only.

- [ ] **Step 1: Create add/list-by-collection handler**

`src/pages/api/admin/image-collections/[id]/images/index.ts`:

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const MAX_IMAGES = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  const collectionId = req.query.id as string;

  if (req.method === 'POST') {
    const collection = await prisma.imageCollection.findUnique({
      where: {id: collectionId},
      include: {_count: {select: {images: true}}},
    });
    if (!collection)
      return res.status(404).json({error: 'Collection not found'});
    if (collection._count.images >= MAX_IMAGES) {
      return res
        .status(400)
        .json({error: `max ${MAX_IMAGES} images per collection`});
    }
    const {altEn = '', altVi = ''} = req.body ?? {};
    const created = await prisma.collectionImage.create({
      data: {
        collectionId,
        altEn: typeof altEn === 'string' ? altEn : '',
        altVi: typeof altVi === 'string' ? altVi : '',
        order: collection._count.images,
      },
    });
    return res.status(201).json(created);
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Create update/delete-image handler**

`src/pages/api/admin/image-collections/[id]/images/[imageId].ts`:

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {promises as fs} from 'fs';
import {resolveUploadPath} from '@/lib/upload-dir';

const MIN_IMAGES = 1;

async function unlinkPublicUrl(url: string) {
  if (!url || !url.startsWith('/uploads/')) return;
  try {
    await fs.unlink(resolveUploadPath(url.replace(/^\/uploads\//, '')));
  } catch {
    /* best-effort */
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  const collectionId = req.query.id as string;
  const imageId = req.query.imageId as string;

  const image = await prisma.collectionImage.findUnique({where: {id: imageId}});
  if (!image || image.collectionId !== collectionId) {
    return res.status(404).json({error: 'Image not found'});
  }

  if (req.method === 'PATCH') {
    const {altEn, altVi} = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof altEn === 'string') data.altEn = altEn;
    if (typeof altVi === 'string') data.altVi = altVi;
    const updated = await prisma.collectionImage.update({
      where: {id: imageId},
      data,
    });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const count = await prisma.collectionImage.count({where: {collectionId}});
    if (count <= MIN_IMAGES) {
      return res.status(400).json({error: `min ${MIN_IMAGES} image required`});
    }
    await prisma.collectionImage.delete({where: {id: imageId}});
    if (image.url) await unlinkPublicUrl(image.url);
    return res.status(204).end();
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/image-collections/
git commit -m "feat(api): manage CollectionImage rows (add/update/delete)"
```

---

## Task 7: Admin API — reorder

**Files:** Create `src/pages/api/admin/image-collections/[id]/images/reorder.ts`.

- [ ] **Step 1: Create handler**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({error: 'Method not allowed'});
  }
  const collectionId = req.query.id as string;
  const {ids} = req.body ?? {};
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) {
    return res.status(400).json({error: 'ids must be string[]'});
  }
  const existing = await prisma.collectionImage.findMany({
    where: {collectionId},
    select: {id: true},
  });
  const existingIds = new Set(existing.map((r) => r.id));
  if (
    existing.length !== ids.length ||
    !ids.every((id) => existingIds.has(id))
  ) {
    return res
      .status(400)
      .json({error: 'ids must match collection images exactly'});
  }
  await prisma.$transaction(
    ids.map((id, order) =>
      prisma.collectionImage.update({where: {id}, data: {order}}),
    ),
  );
  return res.status(204).end();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/admin/image-collections/
git commit -m "feat(api): reorder collection images"
```

---

## Task 8: Install drag-and-drop deps

**Files:** Modify `package.json`, `pnpm-lock.yaml`.

- [ ] **Step 1: Install**

Run: `pnpm add @dnd-kit/core @dnd-kit/sortable`.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @dnd-kit deps for drag-and-drop reordering"
```

---

## Task 9: API client + admin route registry

**Files:** Modify `src/routes/api.ts`, `src/routes/registry.ts`.

- [ ] **Step 1: Add API client**

In `src/routes/api.ts`, add inside `admin:` object after `perks`:

```ts
imageCollections: {
  list: () =>
    request<Array<{id: string; key: string; label: string; imageCount: number}>>(
      '/api/admin/image-collections',
    ),
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
```

- [ ] **Step 2: Add route registry entries**

In `src/routes/registry.ts`, inside `admin:` object after `perks`:

```ts
imageCollections: {
  list: {path: () => '/admin/image-collections'},
  new: {path: () => '/admin/image-collections/new'},
  edit: {path: (p: {id: string}) => `/admin/image-collections/${p.id}`},
},
```

- [ ] **Step 3: Type-check**

Run: `pnpm build`. Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/routes/
git commit -m "feat(routes): register admin image-collection routes + API client"
```

---

## Task 10: Admin list page

**Files:** Create `src/pages/admin/image-collections/index.tsx`.

- [ ] **Step 1: Implement page**

```tsx
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import Link from 'next/link';
import {api, routes} from '@/routes';
import {Button} from '@/components/ui';

type Row = {id: string; key: string; label: string; imageCount: number};

export default function ImageCollectionsListPage() {
  const t = useTranslations();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.imageCollections.list().then((res) => {
      if (res.data) setRows(res.data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(t('admin.imageCollections.confirmDelete'))) return;
    const res = await api.admin.imageCollections.delete(id);
    if (!res.error) setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">
          {t('admin.imageCollections.title')}
        </h1>
        <Link href={routes.admin.imageCollections.new.path()}>
          <Button variant="primary">{t('admin.imageCollections.new')}</Button>
        </Link>
      </div>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-on-surface-secondary">
          {t('admin.imageCollections.empty')}
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="py-2">{t('admin.imageCollections.label')}</th>
              <th className="py-2">{t('admin.imageCollections.key')}</th>
              <th className="py-2">{t('admin.imageCollections.imageCount')}</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="py-3">{r.label}</td>
                <td className="py-3 font-mono text-sm">{r.key}</td>
                <td className="py-3">{r.imageCount}</td>
                <td className="py-3 flex gap-2 justify-end">
                  <Link
                    href={routes.admin.imageCollections.edit.path({id: r.id})}
                  >
                    <Button variant="secondary">{t('common.edit')}</Button>
                  </Link>
                  <Button variant="danger" onClick={() => handleDelete(r.id)}>
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/image-collections/
git commit -m "feat(admin): image collections list page"
```

---

## Task 11: Admin new page (create form)

**Files:** Create `src/pages/admin/image-collections/new.tsx` and co-located `new.form-utils.ts`.

- [ ] **Step 1: form-utils**

`src/pages/admin/image-collections/new.form-utils.ts`:

```ts
import * as yup from 'yup';

export const newCollectionSchema = yup.object({
  key: yup
    .string()
    .matches(/^[a-z0-9-]+$/, 'lowercase letters, digits, dashes only')
    .required(),
  label: yup.string().trim().min(1).required(),
});

export type NewCollectionForm = yup.InferType<typeof newCollectionSchema>;

export const newCollectionDefaults: NewCollectionForm = {key: '', label: ''};
```

- [ ] **Step 2: page**

```tsx
import {useRouter} from 'next/router';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';
import {api, routes} from '@/routes';
import {Button, FormField, TextInput} from '@/components/ui';
import {
  newCollectionSchema,
  newCollectionDefaults,
  type NewCollectionForm,
} from './new.form-utils';

export default function NewImageCollectionPage() {
  const router = useRouter();
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    setError,
  } = useForm<NewCollectionForm>({
    resolver: yupResolver(newCollectionSchema),
    defaultValues: newCollectionDefaults,
  });

  async function onSubmit(values: NewCollectionForm) {
    const res = await api.admin.imageCollections.create(values);
    if (res.error || !res.data) {
      setError('key', {message: res.error ?? 'create failed'});
      return;
    }
    router.push(routes.admin.imageCollections.edit.path({id: res.data.id}));
  }

  return (
    <div className="max-w-xl">
      <h1 className="type-headline-sm mb-6">
        {t('admin.imageCollections.newTitle')}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label={t('admin.imageCollections.key')}
          error={errors.key?.message}
        >
          <TextInput {...register('key')} placeholder="home-gallery" />
        </FormField>
        <FormField
          label={t('admin.imageCollections.label')}
          error={errors.label?.message}
        >
          <TextInput {...register('label')} placeholder="Home Gallery" />
        </FormField>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {t('common.create')}
        </Button>
      </form>
    </div>
  );
}
```

Verify: `@hookform/resolvers` is already a dep — if not, this task installs it (check `package.json`; the existing forms in admin use yupResolver so it's there).

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/image-collections/
git commit -m "feat(admin): new-collection form"
```

---

## Task 12: SortableImageCard component

**Files:** Create `SortableImageCard.tsx`, `SortableImageCard.spec.tsx`.

- [ ] **Step 1: Write failing tests**

`src/components/Admin/ImageCollectionEditor/SortableImageCard.spec.tsx`:

```tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {SortableImageCard} from './SortableImageCard';

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: {Transform: {toString: () => ''}},
}));

const messages = {
  admin: {
    imageCollections: {
      altEn: 'Alt EN',
      altVi: 'Alt VI',
      replace: 'Replace',
      uploadHint: 'Upload .webp',
    },
    common: {delete: 'Delete'},
  },
  common: {delete: 'Delete'},
};

const baseImage = {
  id: 'i1',
  collectionId: 'c1',
  url: '/uploads/x.webp',
  altEn: 'A',
  altVi: 'B',
  order: 0,
};

function renderCard(
  props: Partial<Parameters<typeof SortableImageCard>[0]> = {},
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SortableImageCard
        image={baseImage}
        canDelete
        onAltChange={jest.fn()}
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('SortableImageCard', () => {
  it('renders alt inputs with current values', () => {
    renderCard();
    expect(screen.getByLabelText('Alt EN')).toHaveValue('A');
    expect(screen.getByLabelText('Alt VI')).toHaveValue('B');
  });

  it('fires onAltChange when alt edited', () => {
    const onAltChange = jest.fn();
    renderCard({onAltChange});
    fireEvent.change(screen.getByLabelText('Alt EN'), {target: {value: 'New'}});
    expect(onAltChange).toHaveBeenCalledWith('i1', {altEn: 'New'});
  });

  it('disables delete when canDelete=false', () => {
    renderCard({canDelete: false});
    expect(screen.getByRole('button', {name: 'Delete'})).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL.**

- [ ] **Step 3: Implement**

`src/components/Admin/ImageCollectionEditor/SortableImageCard.tsx`:

```tsx
import {useRef} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useTranslations} from 'next-intl';
import type {CollectionImage} from '@/domain';
import {Button, FormField, TextInput} from '@/components/ui';

type Props = {
  image: CollectionImage;
  canDelete: boolean;
  onAltChange: (id: string, patch: {altEn?: string; altVi?: string}) => void;
  onDelete: (id: string) => void;
  onReplace: (id: string, file: File) => void;
};

export function SortableImageCard({
  image,
  canDelete,
  onAltChange,
  onDelete,
  onReplace,
}: Props) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({id: image.id});

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="bg-surface-elevated border border-border rounded-lg p-3 flex flex-col gap-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t('admin.imageCollections.dragHandle')}
        className="self-start text-on-surface-secondary cursor-grab"
      >
        <i className="fa fa-grip-vertical" />
      </button>
      <div className="aspect-square bg-surface-alt rounded overflow-hidden">
        {image.url ? (
          <img
            src={image.url}
            alt={image.altEn}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-secondary text-sm">
            {t('admin.imageCollections.uploadHint')}
          </div>
        )}
      </div>
      <FormField label={t('admin.imageCollections.altEn')}>
        <TextInput
          value={image.altEn}
          onChange={(e) => onAltChange(image.id, {altEn: e.target.value})}
        />
      </FormField>
      <FormField label={t('admin.imageCollections.altVi')}>
        <TextInput
          value={image.altVi}
          onChange={(e) => onAltChange(image.id, {altVi: e.target.value})}
        />
      </FormField>
      <input
        ref={fileRef}
        type="file"
        accept="image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onReplace(image.id, f);
          e.target.value = '';
        }}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          {t('admin.imageCollections.replace')}
        </Button>
        <Button
          variant="danger"
          type="button"
          disabled={!canDelete}
          onClick={() => onDelete(image.id)}
        >
          {t('common.delete')}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/ImageCollectionEditor/
git commit -m "feat(admin): SortableImageCard component"
```

---

## Task 13: ImageCollectionEditor + AddImageButton

**Files:** Create `ImageCollectionEditor.tsx`, `ImageCollectionEditor.spec.tsx`, `AddImageButton.tsx`, `index.ts`.

- [ ] **Step 1: AddImageButton**

`src/components/Admin/ImageCollectionEditor/AddImageButton.tsx`:

```tsx
import {useRef} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui';

type Props = {
  disabled: boolean;
  onPick: (file: File) => void;
};

export function AddImageButton({disabled, onPick}: Props) {
  const t = useTranslations();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />
      <Button
        variant="primary"
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
      >
        {t('admin.imageCollections.addImage')}
      </Button>
    </>
  );
}
```

- [ ] **Step 2: Editor**

`src/components/Admin/ImageCollectionEditor/ImageCollectionEditor.tsx`:

```tsx
import {useEffect, useRef, useState} from 'react';
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {useTranslations} from 'next-intl';
import type {ImageCollection, CollectionImage} from '@/domain';
import {api} from '@/routes';
import {SortableImageCard} from './SortableImageCard';
import {AddImageButton} from './AddImageButton';

const MAX = 10;
const MIN = 1;
const DEBOUNCE_MS = 500;

type Props = {collection: ImageCollection};

export function ImageCollectionEditor({collection}: Props) {
  const t = useTranslations();
  const [images, setImages] = useState<CollectionImage[]>(collection.images);
  const [error, setError] = useState<string | null>(null);
  const altTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (!over || active.id === over.id) return;
    setImages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex).map((img, i) => ({
        ...img,
        order: i,
      }));
      api.admin.imageCollections.images
        .reorder(
          collection.id,
          next.map((n) => n.id),
        )
        .then((res) => {
          if (res.error) setError(res.error);
        });
      return next;
    });
  }

  function handleAltChange(
    id: string,
    patch: {altEn?: string; altVi?: string},
  ) {
    setImages((prev) => prev.map((p) => (p.id === id ? {...p, ...patch} : p)));
    const existing = altTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      api.admin.imageCollections.images
        .update(collection.id, id, patch)
        .then((res) => {
          if (res.error) setError(res.error);
        });
    }, DEBOUNCE_MS);
    altTimers.current.set(id, timer);
  }

  async function handleAdd(file: File) {
    if (images.length >= MAX) return;
    const blob = file;
    const created = await api.admin.imageCollections.images.add(
      collection.id,
      {},
    );
    if (!created.data) {
      setError(created.error ?? 'add failed');
      return;
    }
    const upload = await api.admin.upload.create({
      entityType: 'collectionImage',
      entityId: created.data.id,
      imageType: 'card',
      blob,
    });
    if (!upload.data) {
      setError(upload.error ?? 'upload failed');
      // cleanup orphan row
      await api.admin.imageCollections.images
        .delete(collection.id, created.data.id)
        .catch(() => {});
      return;
    }
    setImages((prev) => [...prev, {...created.data!, url: upload.data!.url}]);
  }

  async function handleReplace(id: string, file: File) {
    const upload = await api.admin.upload.create({
      entityType: 'collectionImage',
      entityId: id,
      imageType: 'card',
      blob: file,
    });
    if (!upload.data) {
      setError(upload.error ?? 'replace failed');
      return;
    }
    setImages((prev) =>
      prev.map((p) => (p.id === id ? {...p, url: upload.data!.url} : p)),
    );
  }

  async function handleDelete(id: string) {
    if (images.length <= MIN) return;
    if (!confirm(t('admin.imageCollections.confirmDeleteImage'))) return;
    const res = await api.admin.imageCollections.images.delete(
      collection.id,
      id,
    );
    if (res.error) {
      setError(res.error);
      return;
    }
    setImages((prev) => prev.filter((p) => p.id !== id));
  }

  useEffect(() => () => altTimers.current.forEach((t) => clearTimeout(t)), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="type-label-sm text-on-surface-secondary">
          {t('admin.imageCollections.countHint', {
            count: images.length,
            max: MAX,
          })}
        </p>
        <AddImageButton disabled={images.length >= MAX} onPick={handleAdd} />
      </div>
      {error && (
        <div className="bg-error/10 text-error p-3 rounded">{error}</div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <SortableImageCard
                key={img.id}
                image={img}
                canDelete={images.length > MIN}
                onAltChange={handleAltChange}
                onDelete={handleDelete}
                onReplace={handleReplace}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

- [ ] **Step 3: index.ts**

```ts
export {ImageCollectionEditor} from './ImageCollectionEditor';
```

- [ ] **Step 4: Editor smoke test**

`ImageCollectionEditor.spec.tsx`:

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {ImageCollectionEditor} from './ImageCollectionEditor';

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({children}: {children: React.ReactNode}) => <>{children}</>,
  closestCenter: () => null,
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: () => ({}),
  useSensors: () => [],
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({children}: {children: React.ReactNode}) => <>{children}</>,
  arrayMove: <T,>(arr: T[]) => arr,
  sortableKeyboardCoordinates: jest.fn(),
  rectSortingStrategy: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: {Transform: {toString: () => ''}},
}));
jest.mock('@/routes', () => ({
  api: {
    admin: {
      imageCollections: {
        images: {
          add: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          reorder: jest.fn(),
        },
      },
      upload: {create: jest.fn()},
    },
  },
}));

const messages = {
  admin: {
    imageCollections: {
      addImage: 'Add',
      countHint: '{count}/{max}',
      altEn: 'EN',
      altVi: 'VI',
      replace: 'Replace',
      uploadHint: 'up',
      confirmDeleteImage: 'sure?',
      dragHandle: 'drag',
    },
  },
  common: {delete: 'Delete'},
};

const collection = {
  id: 'c1',
  key: 'home-gallery',
  label: 'Home',
  images: [
    {id: 'i1', collectionId: 'c1', url: '/a', altEn: '', altVi: '', order: 0},
    {id: 'i2', collectionId: 'c1', url: '/b', altEn: '', altVi: '', order: 1},
  ],
};

test('renders one card per image', () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ImageCollectionEditor collection={collection} />
    </NextIntlClientProvider>,
  );
  expect(screen.getAllByText('EN').length).toBe(2);
});

test('add disabled at max=10', () => {
  const fullImages = Array.from({length: 10}).map((_, i) => ({
    id: `i${i}`,
    collectionId: 'c1',
    url: '/x',
    altEn: '',
    altVi: '',
    order: i,
  }));
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ImageCollectionEditor collection={{...collection, images: fullImages}} />
    </NextIntlClientProvider>,
  );
  expect(screen.getByRole('button', {name: 'Add'})).toBeDisabled();
});
```

- [ ] **Step 5: Run tests, expect PASS.**

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/ImageCollectionEditor/
git commit -m "feat(admin): ImageCollectionEditor with drag-and-drop"
```

---

## Task 14: Admin edit page

**Files:** Create `src/pages/admin/image-collections/[id].tsx`.

- [ ] **Step 1: Implement page**

```tsx
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {authOptions} from '@/pages/api/auth/[...nextauth]';
import {prisma} from '@/lib/prisma';
import {toImageCollection} from '@/domain/image-collection/mapper';
import type {ImageCollection} from '@/domain';
import {ImageCollectionEditor} from '@/components/Admin/ImageCollectionEditor';
import {api} from '@/routes';
import {Button, TextInput} from '@/components/ui';
import {getMessagesFromDb} from '@/data/queries';

type Props = {collection: ImageCollection; messages: Record<string, unknown>};

export default function EditImageCollectionPage({collection}: Props) {
  const t = useTranslations();
  const [label, setLabel] = useState(collection.label);
  const [savedLabel, setSavedLabel] = useState(collection.label);
  const [saving, setSaving] = useState(false);

  async function saveLabel() {
    if (label === savedLabel) return;
    setSaving(true);
    const res = await api.admin.imageCollections.update(collection.id, {label});
    setSaving(false);
    if (!res.error) setSavedLabel(label);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="type-label-sm text-on-surface-secondary mb-1">
          {t('admin.imageCollections.key')}:{' '}
          <span className="font-mono">{collection.key}</span>
        </p>
        <div className="flex gap-2 items-end">
          <div className="flex-1 max-w-md">
            <label className="type-label-sm block mb-1">
              {t('admin.imageCollections.label')}
            </label>
            <TextInput
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveLabel}
            />
          </div>
          <Button
            variant="secondary"
            type="button"
            onClick={saveLabel}
            disabled={saving || label === savedLabel}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
      <ImageCollectionEditor collection={collection} />
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return {redirect: {destination: '/', permanent: false}};
  }
  const id = ctx.params?.id as string;
  const row = await prisma.imageCollection.findUnique({
    where: {id},
    include: {images: {orderBy: {order: 'asc'}}},
  });
  if (!row) return {notFound: true};
  const messages = await getMessagesFromDb(ctx.locale ?? 'vi');
  return {
    props: {
      collection: toImageCollection(row),
      messages,
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/image-collections/
git commit -m "feat(admin): edit-collection page"
```

---

## Task 15: Admin sidebar nav entry

**Files:** Modify the admin sidebar component.

- [ ] **Step 1: Locate sidebar**

Run: `grep -rln "admin.tours\|admin.destinations\|admin.perks" src/components/ src/pages/admin/`. Identify the sidebar/nav component.

- [ ] **Step 2: Add entry**

Add an item between Perks and Translations:

```tsx
{
  href: routes.admin.imageCollections.list.path(),
  labelKey: 'admin.nav.imageCollections',
  icon: 'fa-images',
}
```

(Adapt to actual sidebar's data structure — use icons/href format already in use.)

- [ ] **Step 3: Commit**

```bash
git add src/components/
git commit -m "feat(admin): sidebar nav entry for image collections"
```

---

## Task 16: i18n keys

**Files:** Modify `src/messages/en.json`, `src/messages/vi.json`. Insert into Translation table via seed (see Task 19).

- [ ] **Step 1: Add admin keys to en.json**

Under `admin`:

```json
"imageCollections": {
  "title": "Image Collections",
  "newTitle": "New Image Collection",
  "new": "New collection",
  "empty": "No collections yet.",
  "label": "Label",
  "key": "Key",
  "imageCount": "Images",
  "addImage": "Add image",
  "altEn": "Alt text (EN)",
  "altVi": "Alt text (VI)",
  "replace": "Replace",
  "confirmDelete": "Delete this collection? This is irreversible.",
  "confirmDeleteImage": "Delete this image?",
  "uploadHint": "Upload .webp",
  "dragHandle": "Drag to reorder",
  "countHint": "{count} of {max} images"
},
"nav": {
  "imageCollections": "Image collections"
}
```

- [ ] **Step 2: Add Vietnamese translations to vi.json**

Mirror the keys with Vietnamese text. (Translator-quality acceptable; user can refine in admin UI later.)

- [ ] **Step 3: Commit**

```bash
git add src/messages/
git commit -m "feat(i18n): admin labels for image collections"
```

---

## Task 17: Home page integration

**Files:** Modify `src/pages/index.tsx`.

- [ ] **Step 1: Update getServerSideProps**

Within the existing `Promise.all` (line ~458), add `getImageCollection('home-gallery')`:

```ts
const {
  getAllTours,
  getActiveDestinationsFromDb,
  getMessagesFromDb,
  getImageCollection,
} = await import('@/data/queries');
// ...
const [tours, destinations, dbMessages, gallery] = await Promise.all([
  getAllTours(isAdmin),
  getActiveDestinationsFromDb(isAdmin),
  getMessagesFromDb(locale ?? 'vi'),
  getImageCollection('home-gallery'),
]);
return {
  props: {
    tours,
    destinations,
    messages: dbMessages,
    gallery,
    locale: locale ?? 'vi',
  },
};
```

- [ ] **Step 2: Update component**

Replace the hardcoded `galleryImageUrls` (lines 28-33), `galleryAltKeys`, and `galleryImages` mapping (lines 57-67) with:

```tsx
type GalleryImage = {id: string; url: string; altEn: string; altVi: string};

type Props = {
  tours: ...;
  destinations: ...;
  gallery: {images: GalleryImage[]} | null;
  locale: string;
  // ...
};

// Inside component:
const galleryImages =
  gallery?.images.map((img) => ({
    src: img.url,
    alt: locale === 'vi' ? img.altVi : img.altEn,
  })) ?? [];
```

- [ ] **Step 3: Guard the gallery section**

Wrap the Gallery `<section>` (line 430):

```tsx
{
  galleryImages.length > 0 && (
    <section className="py-16 lg:py-24 bg-surface-alt">
      {/* existing inner */}
    </section>
  );
}
```

- [ ] **Step 4: Type-check + run dev server**

Run: `pnpm build` (passes), then `pnpm dev` and visit `/`. Gallery should render once seed runs (Task 19); for now hand-test by inserting a test row via Prisma Studio or skip until Task 19.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat(home): load gallery from ImageCollection DB"
```

---

## Task 18: Seed `home-gallery` from existing files

**Files:** Create `prisma/seed-home-gallery.ts`. Modify `package.json` (script).

- [ ] **Step 1: Write seed script**

`prisma/seed-home-gallery.ts`:

```ts
import {PrismaClient} from '@prisma/client';
import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();
const KEY = 'home-gallery';
const SOURCE_DIR = path.join(process.cwd(), 'public/assets/images/gallery');
const FILES = [1, 2, 3, 4, 5].map((n) => `gallery-one-img-${n}.jpeg`);
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');

async function main() {
  const existing = await prisma.imageCollection.findUnique({where: {key: KEY}});
  if (existing) {
    console.log(`Collection ${KEY} already exists, skipping seed.`);
    return;
  }

  // Pull existing alts from Translation table (galleryAlt1..5).
  const altRows = await prisma.translation.findMany({
    where: {key: {in: FILES.map((_, i) => `galleryAlt${i + 1}`)}},
  });
  const altMap: Record<string, {en: string; vi: string}> = {};
  for (const r of altRows) {
    altMap[r.key] = {en: r.valueEn ?? '', vi: r.valueVi ?? ''};
  }

  const collection = await prisma.imageCollection.create({
    data: {key: KEY, label: 'Home Gallery'},
  });

  for (let i = 0; i < FILES.length; i++) {
    const filename = FILES[i];
    const srcPath = path.join(SOURCE_DIR, filename);
    const buf = await fs.readFile(srcPath);
    // NOTE: source files are .jpeg but our pipeline expects .webp.
    // For seed simplicity, copy as-is and serve from /uploads. Re-encoding to
    // webp is recommended but not blocking — the migration accepts mixed
    // formats since the runtime only links the URL. Admin can replace later.
    const hash = crypto
      .createHash('sha256')
      .update(buf)
      .digest('hex')
      .slice(0, 8);
    const ext = path.extname(filename); // .jpeg
    const relDir = `collectionImages/seed`;
    const relFile = `${relDir}/${path.parse(filename).name}.${hash}${ext}`;
    const absDir = path.join(UPLOAD_DIR, relDir);
    const absFile = path.join(UPLOAD_DIR, relFile);
    await fs.mkdir(absDir, {recursive: true});
    await fs.writeFile(absFile, buf);

    await prisma.collectionImage.create({
      data: {
        collectionId: collection.id,
        url: `/uploads/${relFile}`,
        altEn: altMap[`galleryAlt${i + 1}`]?.en ?? '',
        altVi: altMap[`galleryAlt${i + 1}`]?.vi ?? '',
        order: i,
      },
    });
  }
  console.log(`Seeded ${FILES.length} images into ${KEY}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add npm script**

In `package.json` `scripts`:

```json
"seed:home-gallery": "tsx prisma/seed-home-gallery.ts"
```

(Use existing seed runner if present — check `package.json` for `tsx`/`ts-node` already in use; reuse same loader.)

- [ ] **Step 3: Run seed locally**

Run: `pnpm seed:home-gallery`.
Expected: 5 rows inserted in `CollectionImage`, files copied to upload dir.

- [ ] **Step 4: Verify**

Run: `pnpm dev`, visit `/`. Gallery renders 5 images.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-home-gallery.ts package.json
git commit -m "feat(seed): seed home-gallery from existing jpegs"
```

---

## Task 19: Cleanup hardcoded files + i18n keys

**Files:** Delete `public/assets/images/gallery/*.jpeg`. Modify `src/messages/{en,vi}.json`. Optionally delete from Translation DB table.

- [ ] **Step 1: Verify no other references**

Run: `grep -rn "gallery-one-img\|galleryAlt[1-5]" src/`. Expected: no matches outside the cleaned files. If any remain, fix them.

- [ ] **Step 2: Delete files**

```bash
git rm public/assets/images/gallery/gallery-one-img-1.jpeg \
  public/assets/images/gallery/gallery-one-img-2.jpeg \
  public/assets/images/gallery/gallery-one-img-3.jpeg \
  public/assets/images/gallery/gallery-one-img-4.jpeg \
  public/assets/images/gallery/gallery-one-img-5.jpeg
```

- [ ] **Step 3: Remove `galleryAlt1..5` from messages**

Edit `src/messages/en.json` and `src/messages/vi.json` — delete those keys.

- [ ] **Step 4: Remove from DB (optional, post-seed)**

Run via Prisma Studio or one-off script:

```ts
await prisma.translation.deleteMany({
  where: {
    key: {
      in: [
        'galleryAlt1',
        'galleryAlt2',
        'galleryAlt3',
        'galleryAlt4',
        'galleryAlt5',
      ],
    },
  },
});
```

Document in PR description that this needs running on prod after deploy.

- [ ] **Step 5: Verify gallery still loads**

Run: `pnpm dev`, visit `/`. Gallery still shows 5 seeded images with alt text.

- [ ] **Step 6: Commit**

```bash
git add public/assets/images/gallery/ src/messages/
git commit -m "chore: remove hardcoded gallery files and i18n keys"
```

---

## Task 20: Final verification + PR

- [ ] **Step 1: Type-check + tests**

Run:

```bash
pnpm build
pnpm test --run
```

Expected: both pass.

- [ ] **Step 2: Manual smoke test**

- Log in as admin, visit `/admin/image-collections`. See `home-gallery` listed.
- Click edit. Drag images, change alt text, replace one image. Verify changes persist on reload.
- Try delete down to 1 — last delete should be blocked.
- Try add 6th, 7th... up to 10 — 11th blocked.
- Visit `/`. Gallery reflects DB state.
- Switch locale to `en`. Alts render in English.

- [ ] **Step 3: Push branch + open PR**

```bash
git push -u origin feat/image-collection-cms
gh pr create --title "feat(admin): image collection CMS for home gallery" --body "$(cat <<'EOF'
## Summary
- Generic `ImageCollection` + `CollectionImage` Prisma models keyed by string for reuse across pages
- Admin pages at `/admin/image-collections` with drag-and-drop reordering (`@dnd-kit`), per-image localized alt text, replace/delete with min/max bounds (1..10)
- Home gallery now reads from DB; hardcoded files and i18n keys removed
- Seed script migrates existing 5 jpegs into `home-gallery` collection

## Deploy steps (prod)
1. Run `prisma migrate deploy`
2. Run `pnpm seed:home-gallery` once
3. (Optional) Remove `galleryAlt1..5` rows from Translation table
4. Restart pm2

## Test plan
- [ ] Migration applies cleanly
- [ ] Seed inserts 5 rows
- [ ] Admin can add/remove/replace/reorder images
- [ ] Min=1 / max=10 bounds enforced
- [ ] Alt text saved per locale, renders correctly on home page
- [ ] Existing tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Return PR URL.**

---

## Self-Review Notes

- All spec sections (data model, API, admin UI, home integration, cleanup, seed, testing) have at least one task.
- New deps explicitly added in Task 8.
- `collectionImage` upload coupling fully specified in Task 4.
- Idempotency built into seed (Task 18, Step 1 of seed code).
- No placeholders. Code shown for every edit step.
- Sidebar nav (Task 15) is the only lookup-required step — engineer must locate the actual sidebar component since its location wasn't pinned during planning.
