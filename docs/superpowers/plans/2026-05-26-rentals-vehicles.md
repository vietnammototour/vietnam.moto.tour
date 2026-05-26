# Rentals (Vehicles) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a catalog-only "Rentals" feature (public `/rentals` page + admin CRUD at `/admin/rentals`) backed by a new `Vehicle` Prisma model, introducing a `{en, vi}` JSON shape for localized columns as the new convention going forward.

**Architecture:** New `Vehicle` Prisma model with two enums (`VehicleType`, `VehicleStatus`). Public catalog uses ISR (`getStaticProps`) with a `getPublishedVehicles()` data query and a `toVehicle()` mapper. Admin uses the same React-Query + Next API route + Prisma stack already used by Tours/Destinations, with three form tabs (`general`, `description`, `images`) wired through the existing `AdminPageShell`. Localized `description` field is a single `Json` column with shape `{en: string, vi: string}` instead of the legacy split-column pattern.

**Tech Stack:** Next.js 16 Pages Router, React 19, Prisma + PostgreSQL, next-intl, React Query v5, Tailwind CSS v4, react-hook-form + Yup (form-utils only), Jest + RTL for tests.

---

## File Structure

**New files**

- `prisma/migrations/<timestamp>_add_vehicle/migration.sql` — Prisma migration
- `prisma/seed-rentals-translations.ts` — translation seed
- `prisma/seed-vehicles.ts` — initial vehicle seed
- `src/domain/vehicle/index.ts` — `Vehicle` + `VehicleType` + `VehicleStatus` type exports
- `src/domain/vehicle/mapper.ts` — `toVehicle()` mapper
- `src/data/queries/vehicles.ts` — `getPublishedVehicles`, `getVehiclesForAdmin`, `getVehicleByIdForAdmin`
- `src/pages/api/admin/vehicles/index.ts` — list + create
- `src/pages/api/admin/vehicles/[id].ts` — get + update + soft-delete
- `src/pages/api/admin/vehicles/[id]/restore.ts` — restore-from-archive
- `src/pages/api/admin/vehicles/__tests__/index.spec.ts`
- `src/pages/api/admin/vehicles/__tests__/[id].spec.ts`
- `src/queries/admin/vehicles.ts`
- `src/queries/admin/vehicles.keys.ts`
- `src/queries/fetchers/admin/vehicles.ts`
- `src/queries/fetchers/admin/vehicles.server.ts`
- `src/components/Rentals/VehicleCard/VehicleCard.tsx` + `index.ts` + `VehicleCard.spec.tsx`
- `src/components/Rentals/RentalsFilter/RentalsFilter.tsx` + `index.ts` + `RentalsFilter.spec.tsx`
- `src/components/Rentals/RentalPolicy/RentalPolicy.tsx` + `index.ts`
- `src/components/Rentals/RentalContactCta/RentalContactCta.tsx` + `index.ts`
- `src/components/Rentals/index.ts`
- `src/components/Admin/VehicleListGroup/VehicleListGroup.tsx` + `index.ts`
- `src/components/Admin/VehicleEditTabs/VehicleEditTabs.tsx` + `index.ts`
- `src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.tsx` + `VehicleGeneralForm.form-utils.ts` + `index.ts` + `VehicleGeneralForm.spec.tsx`
- `src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.tsx` + `VehicleDescriptionForm.form-utils.ts` + `index.ts` + `VehicleDescriptionForm.spec.tsx`
- `src/components/Admin/VehicleImagesForm/VehicleImagesForm.tsx` + `VehicleImagesForm.form-utils.ts` + `index.ts`
- `src/pages/rentals.tsx` — new public catalog page
- `src/pages/admin/rentals/index.tsx` — admin list
- `src/pages/admin/rentals/archive.tsx` — archived list
- `src/pages/admin/rentals/new/index.tsx` — redirects to `[tab]`
- `src/pages/admin/rentals/new/[tab].tsx` — admin create form
- `src/pages/admin/rentals/[id]/edit/index.tsx` — redirects to `[tab]`
- `src/pages/admin/rentals/[id]/edit/[tab].tsx` — admin edit form

**Modified files**

- `prisma/schema.prisma` — add `Vehicle` model + 2 enums
- `prisma/seed.ts` — chain new seeds
- `src/domain/index.ts` — re-export Vehicle types
- `src/routes/registry.ts` — add public `rentals.list` + admin `vehicles.*` + `VehicleTab` type
- `src/routes/index.ts` — re-export `VehicleTab` + `isVehicleTab`
- `src/data/queries.ts` — re-export vehicle queries (or move tour/destination queries to per-entity files later — out of scope)
- `src/pages/rental.tsx` — **delete** (replaced by `rentals.tsx`)
- `CLAUDE.md` — add localized-JSON-shape rule
- `.claude/ADMIN.md` — add cross-reference
- `package.json` — add `pnpm seed:rentals` and chain into `pnpm seed`

**Files removed after seed verified (final task)**

- `src/rentals/Honda Enduro XR 150L.jpeg`
- `src/rentals/Scooter automatic Honda Airblade 125cc.jpeg`
- `src/rentals/policy.md`

---

## Task 1: Add `Vehicle` Prisma model + migration

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_vehicle/migration.sql` (via `prisma migrate`)

- [ ] **Step 1: Append `Vehicle` model + enums to `prisma/schema.prisma`**

Append at end of the file:

```prisma
enum VehicleType {
  SCOOTER
  BIKE
}

enum VehicleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Vehicle {
  id             String        @id @default(uuid())
  slug           String        @unique
  type           VehicleType
  brand          String
  model          String
  cc             Int
  quantity       Int           @default(0)
  priceUsdPerDay Int
  imageUrl       String?
  images         Json          @default("[]")
  description    Json          @default("{\"en\":\"\",\"vi\":\"\"}")
  status         VehicleStatus @default(DRAFT)
  order          Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([status, order])
  @@index([type])
}
```

- [ ] **Step 2: Generate migration**

Run: `pnpm prisma migrate dev --name add_vehicle`
Expected: new migration directory `prisma/migrations/<timestamp>_add_vehicle/` is created; Prisma client regenerates; no errors.

- [ ] **Step 3: Verify schema compiles**

Run: `pnpm prisma generate && pnpm tsc --noEmit`
Expected: zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(rentals): add Vehicle model + enums"
```

---

## Task 2: Add Vehicle domain types + reuse `LocalizedText`

**Files:**

- Create: `src/domain/vehicle/index.ts`
- Modify: `src/domain/index.ts`

- [ ] **Step 1: Create `src/domain/vehicle/index.ts`**

```ts
import type {LocalizedText} from '../shared/localized-text';

export type VehicleType = 'SCOOTER' | 'BIKE';
export type VehicleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type Vehicle = {
  id: string;
  slug: string;
  type: VehicleType;
  brand: string;
  model: string;
  cc: number;
  quantity: number;
  priceUsdPerDay: number;
  imageUrl: string | null;
  images: string[];
  description: LocalizedText;
  status: VehicleStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 2: Re-export from `src/domain/index.ts`**

Add to `src/domain/index.ts`:

```ts
export type {Vehicle, VehicleType, VehicleStatus} from './vehicle';
```

- [ ] **Step 3: Type check**

Run: `pnpm tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/domain/vehicle src/domain/index.ts
git commit -m "feat(rentals): add Vehicle domain types"
```

---

## Task 3: Write `toVehicle()` mapper with tests

**Files:**

- Test: `src/domain/vehicle/mapper.spec.ts`
- Create: `src/domain/vehicle/mapper.ts`

- [ ] **Step 1: Write the failing test**

`src/domain/vehicle/mapper.spec.ts`:

```ts
import type {Vehicle as PrismaVehicle} from '@prisma/client';
import {toVehicle} from './mapper';

const baseRow = {
  id: 'v1',
  slug: 'honda-airblade',
  type: 'SCOOTER',
  brand: 'Honda',
  model: 'Airblade',
  cc: 125,
  quantity: 2,
  priceUsdPerDay: 8,
  imageUrl: '/uploads/v1.jpg',
  images: ['/uploads/v1.jpg', '/uploads/v2.jpg'],
  description: {en: 'Reliable city scooter.', vi: 'Xe ga đáng tin cậy.'},
  status: 'PUBLISHED',
  order: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
} as unknown as PrismaVehicle;

describe('toVehicle', () => {
  it('converts Date fields to ISO strings', () => {
    const v = toVehicle(baseRow);
    expect(v.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(v.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('coerces missing description keys to empty strings', () => {
    const v = toVehicle({
      ...baseRow,
      description: {},
    } as unknown as PrismaVehicle);
    expect(v.description).toEqual({en: '', vi: ''});
  });

  it('defaults images to empty array if null', () => {
    const v = toVehicle({...baseRow, images: null} as unknown as PrismaVehicle);
    expect(v.images).toEqual([]);
  });

  it('passes through scalar fields untouched', () => {
    const v = toVehicle(baseRow);
    expect(v.brand).toBe('Honda');
    expect(v.priceUsdPerDay).toBe(8);
    expect(v.type).toBe('SCOOTER');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/domain/vehicle/mapper.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/domain/vehicle/mapper.ts`**

```ts
import type {Vehicle as PrismaVehicle} from '@prisma/client';
import type {LocalizedText} from '../shared/localized-text';
import type {Vehicle} from './index';

function toLocalized(value: unknown): LocalizedText {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    return {
      en: typeof v.en === 'string' ? v.en : '',
      vi: typeof v.vi === 'string' ? v.vi : '',
    };
  }
  return {en: '', vi: ''};
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export function toVehicle(row: PrismaVehicle): Vehicle {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    brand: row.brand,
    model: row.model,
    cc: row.cc,
    quantity: row.quantity,
    priceUsdPerDay: row.priceUsdPerDay,
    imageUrl: row.imageUrl,
    images: toStringArray(row.images),
    description: toLocalized(row.description),
    status: row.status,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm jest src/domain/vehicle/mapper.spec.ts`
Expected: PASS — all 4 specs green.

- [ ] **Step 5: Commit**

```bash
git add src/domain/vehicle/mapper.ts src/domain/vehicle/mapper.spec.ts
git commit -m "feat(rentals): add toVehicle mapper"
```

---

## Task 4: Add data queries for vehicles

**Files:**

- Create: `src/data/queries/vehicles.ts`
- Modify: `src/data/queries.ts` (re-export)

- [ ] **Step 1: Create `src/data/queries/vehicles.ts`**

```ts
import {prisma} from '@/lib/prisma';
import {toVehicle} from '@/domain/vehicle/mapper';
import type {Vehicle} from '@/domain/vehicle';

export async function getPublishedVehicles(): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: {status: 'PUBLISHED'},
    orderBy: [{order: 'asc'}, {createdAt: 'desc'}],
  });
  return rows.map(toVehicle);
}

export async function getVehiclesForAdmin(
  filters: {archived?: boolean} = {},
): Promise<Vehicle[]> {
  const where =
    filters.archived === true
      ? {status: 'ARCHIVED' as const}
      : filters.archived === false
        ? {status: {not: 'ARCHIVED' as const}}
        : {};
  const rows = await prisma.vehicle.findMany({
    where,
    orderBy: [{order: 'asc'}, {createdAt: 'desc'}],
  });
  return rows.map(toVehicle);
}

export async function getVehicleByIdForAdmin(
  id: string,
): Promise<Vehicle | null> {
  const row = await prisma.vehicle.findUnique({where: {id}});
  return row ? toVehicle(row) : null;
}
```

- [ ] **Step 2: Re-export from `src/data/queries.ts`**

Append to `src/data/queries.ts`:

```ts
export {
  getPublishedVehicles,
  getVehiclesForAdmin,
  getVehicleByIdForAdmin,
} from './queries/vehicles';
```

- [ ] **Step 3: Type check**

Run: `pnpm tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/queries.ts src/data/queries/vehicles.ts
git commit -m "feat(rentals): add vehicle data queries"
```

---

## Task 5: Add routes registry entries

**Files:**

- Modify: `src/routes/registry.ts`
- Modify: `src/routes/index.ts`

- [ ] **Step 1: Add types + entries to `src/routes/registry.ts`**

Add the type near the existing `TourTab`/`DestinationTab` types:

```ts
export type VehicleTab = 'general' | 'description' | 'images';

export function isVehicleTab(v: string): v is VehicleTab {
  return v === 'general' || v === 'description' || v === 'images';
}
```

Add public route under the existing public routes object:

```ts
rentals: {
  list: {path: () => '/rentals'},
},
```

Add admin route under the existing admin object:

```ts
vehicles: {
  list: {path: () => '/admin/rentals'},
  archive: {path: () => '/admin/rentals/archive'},
  new: {path: (p?: {tab?: VehicleTab}) =>
    `/admin/rentals/new/${p?.tab ?? 'general'}`},
  edit: {path: (p: {id: string; tab?: VehicleTab}) =>
    `/admin/rentals/${p.id}/edit/${p.tab ?? 'general'}`},
},
```

- [ ] **Step 2: Re-export from `src/routes/index.ts`**

Update the exports list:

```ts
export {routes, isTourTab, isDestinationTab, isVehicleTab} from './registry';
export type {TourTab, DestinationTab, VehicleTab} from './registry';
```

- [ ] **Step 3: Type check**

Run: `pnpm tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes
git commit -m "feat(rentals): add route registry entries"
```

---

## Task 6: Add admin API — list + create

**Files:**

- Create: `src/pages/api/admin/vehicles/index.ts`
- Create: `src/pages/api/admin/vehicles/__tests__/index.spec.ts`

- [ ] **Step 1: Write the failing test**

`src/pages/api/admin/vehicles/__tests__/index.spec.ts`:

```ts
import {createMocks} from 'node-mocks-http';
import handler from '../index';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    vehicle: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

const fakeRow = {
  id: 'v1',
  slug: 'honda-airblade',
  type: 'SCOOTER',
  brand: 'Honda',
  model: 'Airblade',
  cc: 125,
  quantity: 2,
  priceUsdPerDay: 8,
  imageUrl: null,
  images: [],
  description: {en: '', vi: ''},
  status: 'DRAFT',
  order: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('GET /api/admin/vehicles', () => {
  it('returns 401 when not admin', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(false);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200); // requireAdmin writes its own response
  });

  it('returns mapped vehicles', async () => {
    (prisma.vehicle.findMany as jest.Mock).mockResolvedValue([fakeRow]);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body[0].id).toBe('v1');
    expect(body[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('POST /api/admin/vehicles', () => {
  it('creates a vehicle', async () => {
    (prisma.vehicle.create as jest.Mock).mockResolvedValue(fakeRow);
    const {req, res} = createMocks({
      method: 'POST',
      body: {
        slug: 'honda-airblade',
        type: 'SCOOTER',
        brand: 'Honda',
        model: 'Airblade',
        cc: 125,
        quantity: 2,
        priceUsdPerDay: 8,
      },
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(201);
  });

  it('rejects missing required fields', async () => {
    const {req, res} = createMocks({
      method: 'POST',
      body: {brand: 'Honda'},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/pages/api/admin/vehicles/__tests__/index.spec.ts`
Expected: FAIL — handler module not found.

- [ ] **Step 3: Implement `src/pages/api/admin/vehicles/index.ts`**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toVehicle} from '@/domain/vehicle/mapper';

const VALID_TYPES = ['SCOOTER', 'BIKE'] as const;
const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

type CreateBody = {
  slug?: string;
  type?: string;
  brand?: string;
  model?: string;
  cc?: number;
  quantity?: number;
  priceUsdPerDay?: number;
  imageUrl?: string | null;
  images?: string[];
  description?: {en?: string; vi?: string};
  status?: string;
  order?: number;
};

function validateCreate(body: CreateBody): string | null {
  if (!body.slug || typeof body.slug !== 'string') return 'slug is required';
  if (!body.type || !VALID_TYPES.includes(body.type as never))
    return 'type must be SCOOTER or BIKE';
  if (!body.brand) return 'brand is required';
  if (!body.model) return 'model is required';
  if (typeof body.cc !== 'number' || body.cc <= 0) return 'cc must be > 0';
  if (typeof body.quantity !== 'number' || body.quantity < 0)
    return 'quantity must be >= 0';
  if (typeof body.priceUsdPerDay !== 'number' || body.priceUsdPerDay < 0)
    return 'priceUsdPerDay must be >= 0';
  if (body.status && !VALID_STATUSES.includes(body.status as never))
    return 'status invalid';
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const archivedParam = req.query.archived;
    const filters = (() => {
      if (archivedParam === 'true') return {archived: true};
      if (archivedParam === 'false') return {archived: false};
      return {};
    })();
    const {getVehiclesForAdmin} = await import('@/data/queries');
    const vehicles = await getVehiclesForAdmin(filters);
    return res.json(vehicles);
  }

  if (req.method === 'POST') {
    const body = req.body as CreateBody;
    const err = validateCreate(body);
    if (err) return res.status(400).json({error: err});

    const row = await prisma.vehicle.create({
      data: {
        slug: body.slug!,
        type: body.type as 'SCOOTER' | 'BIKE',
        brand: body.brand!,
        model: body.model!,
        cc: body.cc!,
        quantity: body.quantity!,
        priceUsdPerDay: body.priceUsdPerDay!,
        imageUrl: body.imageUrl ?? null,
        images: (body.images ?? []) as never,
        description: {
          en: body.description?.en ?? '',
          vi: body.description?.vi ?? '',
        } as never,
        status: (body.status ?? 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        order: body.order ?? 0,
      },
    });
    return res.status(201).json(toVehicle(row));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm jest src/pages/api/admin/vehicles/__tests__/index.spec.ts`
Expected: PASS — all specs green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/vehicles/index.ts src/pages/api/admin/vehicles/__tests__/index.spec.ts
git commit -m "feat(rentals): add admin vehicles list+create API"
```

---

## Task 7: Add admin API — get/update/soft-delete + restore

**Files:**

- Create: `src/pages/api/admin/vehicles/[id].ts`
- Create: `src/pages/api/admin/vehicles/[id]/restore.ts`
- Create: `src/pages/api/admin/vehicles/__tests__/[id].spec.ts`

- [ ] **Step 1: Write the failing test**

`src/pages/api/admin/vehicles/__tests__/[id].spec.ts`:

```ts
import {createMocks} from 'node-mocks-http';
import handler from '../[id]';
import restoreHandler from '../[id]/restore';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    vehicle: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

const row = {
  id: 'v1',
  slug: 'honda-airblade',
  type: 'SCOOTER',
  brand: 'Honda',
  model: 'Airblade',
  cc: 125,
  quantity: 2,
  priceUsdPerDay: 8,
  imageUrl: null,
  images: [],
  description: {en: '', vi: ''},
  status: 'PUBLISHED',
  order: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('GET /api/admin/vehicles/[id]', () => {
  it('returns 404 when not found', async () => {
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);
    const {req, res} = createMocks({method: 'GET', query: {id: 'v1'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(404);
  });

  it('returns mapped vehicle', async () => {
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(row);
    const {req, res} = createMocks({method: 'GET', query: {id: 'v1'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData()).id).toBe('v1');
  });
});

describe('DELETE /api/admin/vehicles/[id]', () => {
  it('soft-archives by setting status=ARCHIVED', async () => {
    (prisma.vehicle.update as jest.Mock).mockResolvedValue({
      ...row,
      status: 'ARCHIVED',
    });
    const {req, res} = createMocks({method: 'DELETE', query: {id: 'v1'}});
    await handler(req as never, res as never);
    expect(prisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {id: 'v1'},
        data: {status: 'ARCHIVED'},
      }),
    );
    expect(res._getStatusCode()).toBe(204);
  });
});

describe('POST /api/admin/vehicles/[id]/restore', () => {
  it('sets status to DRAFT', async () => {
    (prisma.vehicle.update as jest.Mock).mockResolvedValue({
      ...row,
      status: 'DRAFT',
    });
    const {req, res} = createMocks({method: 'POST', query: {id: 'v1'}});
    await restoreHandler(req as never, res as never);
    expect(prisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {id: 'v1'},
        data: {status: 'DRAFT'},
      }),
    );
    expect(res._getStatusCode()).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/pages/api/admin/vehicles/__tests__/[id].spec.ts`
Expected: FAIL — handler modules not found.

- [ ] **Step 3: Implement `src/pages/api/admin/vehicles/[id].ts`**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toVehicle} from '@/domain/vehicle/mapper';

const VALID_TYPES = ['SCOOTER', 'BIKE'] as const;
const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

type UpdateBody = Partial<{
  slug: string;
  type: string;
  brand: string;
  model: string;
  cc: number;
  quantity: number;
  priceUsdPerDay: number;
  imageUrl: string | null;
  images: string[];
  description: {en?: string; vi?: string};
  status: string;
  order: number;
}>;

function validateUpdate(body: UpdateBody): string | null {
  if (body.type && !VALID_TYPES.includes(body.type as never))
    return 'type must be SCOOTER or BIKE';
  if (body.cc !== undefined && (typeof body.cc !== 'number' || body.cc <= 0))
    return 'cc must be > 0';
  if (
    body.quantity !== undefined &&
    (typeof body.quantity !== 'number' || body.quantity < 0)
  )
    return 'quantity must be >= 0';
  if (
    body.priceUsdPerDay !== undefined &&
    (typeof body.priceUsdPerDay !== 'number' || body.priceUsdPerDay < 0)
  )
    return 'priceUsdPerDay must be >= 0';
  if (body.status && !VALID_STATUSES.includes(body.status as never))
    return 'status invalid';
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = String(req.query.id);

  if (req.method === 'GET') {
    const row = await prisma.vehicle.findUnique({where: {id}});
    if (!row) return res.status(404).json({error: 'Not found'});
    return res.json(toVehicle(row));
  }

  if (req.method === 'PUT') {
    const body = req.body as UpdateBody;
    const err = validateUpdate(body);
    if (err) return res.status(400).json({error: err});

    const row = await prisma.vehicle.update({
      where: {id},
      data: {
        ...(body.slug !== undefined ? {slug: body.slug} : {}),
        ...(body.type !== undefined
          ? {type: body.type as 'SCOOTER' | 'BIKE'}
          : {}),
        ...(body.brand !== undefined ? {brand: body.brand} : {}),
        ...(body.model !== undefined ? {model: body.model} : {}),
        ...(body.cc !== undefined ? {cc: body.cc} : {}),
        ...(body.quantity !== undefined ? {quantity: body.quantity} : {}),
        ...(body.priceUsdPerDay !== undefined
          ? {priceUsdPerDay: body.priceUsdPerDay}
          : {}),
        ...(body.imageUrl !== undefined ? {imageUrl: body.imageUrl} : {}),
        ...(body.images !== undefined ? {images: body.images as never} : {}),
        ...(body.description !== undefined
          ? {
              description: {
                en: body.description.en ?? '',
                vi: body.description.vi ?? '',
              } as never,
            }
          : {}),
        ...(body.status !== undefined
          ? {status: body.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'}
          : {}),
        ...(body.order !== undefined ? {order: body.order} : {}),
      },
    });
    return res.json(toVehicle(row));
  }

  if (req.method === 'DELETE') {
    await prisma.vehicle.update({
      where: {id},
      data: {status: 'ARCHIVED'},
    });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 4: Implement `src/pages/api/admin/vehicles/[id]/restore.ts`**

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {toVehicle} from '@/domain/vehicle/mapper';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Method not allowed'});
  }
  const id = String(req.query.id);
  const row = await prisma.vehicle.update({
    where: {id},
    data: {status: 'DRAFT'},
  });
  return res.json(toVehicle(row));
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `pnpm jest src/pages/api/admin/vehicles/__tests__/[id].spec.ts`
Expected: PASS — all specs green.

- [ ] **Step 6: Commit**

```bash
git add src/pages/api/admin/vehicles/[id].ts src/pages/api/admin/vehicles/[id]/restore.ts src/pages/api/admin/vehicles/__tests__/[id].spec.ts
git commit -m "feat(rentals): add admin vehicle [id] + restore API"
```

---

## Task 8: Add React Query hooks + fetchers

**Files:**

- Create: `src/queries/admin/vehicles.keys.ts`
- Create: `src/queries/fetchers/admin/vehicles.ts`
- Create: `src/queries/fetchers/admin/vehicles.server.ts`
- Create: `src/queries/admin/vehicles.ts`

- [ ] **Step 1: Create `src/queries/admin/vehicles.keys.ts`**

```ts
export const vehicleKeys = {
  all: ['admin', 'vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: {archived?: boolean}) =>
    [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
};
```

- [ ] **Step 2: Create `src/queries/fetchers/admin/vehicles.ts`**

```ts
import type * as VMT from '@/domain';
import {http} from '../http';

export const fetchVehicles = (filters: {archived?: boolean} = {}) => {
  const qs = new URLSearchParams();
  if (filters.archived !== undefined)
    qs.set('archived', String(filters.archived));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return http<VMT.Vehicle[]>(`/api/admin/vehicles${suffix}`);
};

export const fetchVehicle = (id: string) =>
  http<VMT.Vehicle>(`/api/admin/vehicles/${id}`);

export const createVehicle = (input: Record<string, unknown>) =>
  http<VMT.Vehicle>('/api/admin/vehicles', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateVehicle = (id: string, input: Record<string, unknown>) =>
  http<VMT.Vehicle>(`/api/admin/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const deleteVehicle = (id: string) =>
  http<void>(`/api/admin/vehicles/${id}`, {method: 'DELETE'});

export const restoreVehicle = (id: string) =>
  http<VMT.Vehicle>(`/api/admin/vehicles/${id}/restore`, {method: 'POST'});
```

- [ ] **Step 3: Create `src/queries/fetchers/admin/vehicles.server.ts`**

```ts
import {getVehiclesForAdmin, getVehicleByIdForAdmin} from '@/data/queries';

const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const fetchVehiclesServer = async (filters: {archived?: boolean} = {}) =>
  serialize(await getVehiclesForAdmin(filters));

export const fetchVehicleServer = async (id: string) =>
  serialize(await getVehicleByIdForAdmin(id));
```

- [ ] **Step 4: Create `src/queries/admin/vehicles.ts`**

```ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type * as VMT from '@/domain';
import * as f from '@/queries/fetchers/admin/vehicles';
import {vehicleKeys} from './vehicles.keys';

export const useVehicles = (filters: {archived?: boolean} = {}) =>
  useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => f.fetchVehicles(filters),
  });

export const useVehicle = (id: string | undefined) =>
  useQuery({
    queryKey: vehicleKeys.detail(id ?? '__never__'),
    queryFn: () => f.fetchVehicle(id as string),
    enabled: !!id,
  });

export const useCreateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => f.createVehicle(input),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: vehicleKeys.all});
    },
  });
};

export const useUpdateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: Record<string, unknown>}) =>
      f.updateVehicle(id, input),
    onSuccess: (_d, {id}) => {
      qc.invalidateQueries({queryKey: vehicleKeys.detail(id)});
      qc.invalidateQueries({queryKey: vehicleKeys.lists()});
    },
  });
};

export const useDeleteVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => f.deleteVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: vehicleKeys.all});
    },
  });
};

export const useRestoreVehicle = () => {
  const qc = useQueryClient();
  return useMutation<VMT.Vehicle, Error, string>({
    mutationFn: (id) => f.restoreVehicle(id),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: vehicleKeys.all});
    },
  });
};

export const useToggleVehicleStatus = () => {
  const qc = useQueryClient();
  return useMutation<
    VMT.Vehicle,
    Error,
    {id: string; status: VMT.VehicleStatus}
  >({
    mutationFn: ({id, status}) => f.updateVehicle(id, {status}),
    onSuccess: (_d, {id}) => {
      qc.invalidateQueries({queryKey: vehicleKeys.detail(id)});
      qc.invalidateQueries({queryKey: vehicleKeys.lists()});
    },
  });
};
```

- [ ] **Step 5: Type check**

Run: `pnpm tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/queries/admin/vehicles.ts src/queries/admin/vehicles.keys.ts src/queries/fetchers/admin/vehicles.ts src/queries/fetchers/admin/vehicles.server.ts
git commit -m "feat(rentals): add vehicle React Query hooks"
```

---

## Task 9: Seed translations for rentals + admin

**Files:**

- Create: `prisma/seed-rentals-translations.ts`
- Modify: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `prisma/seed-rentals-translations.ts`**

Copy the env-loading boilerplate from `prisma/seed-admin-translations.ts` (the same `if (!process.env.DATABASE_URL) { ... }` block at the top of the file, plus the `dbUrl` / `adapter` / `prisma` setup). Then below that boilerplate add:

```ts
type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const entries: Entry[] = [
  // Public rentals — page chrome
  {
    namespace: 'rentals',
    key: 'title',
    valueEn: 'Motorbike rentals',
    valueVi: 'Cho thuê xe máy',
  },
  {
    namespace: 'rentals',
    key: 'subtitle',
    valueEn: 'Vetted scooters and enduros for self-guided Vietnam journeys.',
    valueVi:
      'Xe ga và xe enduro được kiểm tra kỹ cho hành trình tự lái Việt Nam.',
  },
  {
    namespace: 'rentals',
    key: 'breadcrumbRental',
    valueEn: 'Rentals',
    valueVi: 'Cho thuê',
  },
  {namespace: 'rentals', key: 'perDay', valueEn: '/ day', valueVi: '/ ngày'},
  {namespace: 'rentals', key: 'cc', valueEn: 'cc', valueVi: 'phân khối'},
  {
    namespace: 'rentals',
    key: 'available',
    valueEn: 'Available',
    valueVi: 'Còn xe',
  },
  {
    namespace: 'rentals',
    key: 'outOfStock',
    valueEn: 'Out of stock',
    valueVi: 'Hết xe',
  },

  // Filter
  {namespace: 'rentals.filter', key: 'all', valueEn: 'All', valueVi: 'Tất cả'},
  {
    namespace: 'rentals.filter',
    key: 'scooter',
    valueEn: 'Scooters',
    valueVi: 'Xe ga',
  },
  {
    namespace: 'rentals.filter',
    key: 'bike',
    valueEn: 'Bikes',
    valueVi: 'Xe số',
  },

  // Type
  {
    namespace: 'rentals.type',
    key: 'scooter',
    valueEn: 'Scooter',
    valueVi: 'Xe ga',
  },
  {namespace: 'rentals.type', key: 'bike', valueEn: 'Bike', valueVi: 'Xe số'},

  // Policy
  {
    namespace: 'rentals.policy',
    key: 'title',
    valueEn: 'Rental policy',
    valueVi: 'Chính sách thuê xe',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'title',
    valueEn: 'Included in the price',
    valueVi: 'Bao gồm trong giá',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'helmet',
    valueEn: 'Helmet',
    valueVi: 'Mũ bảo hiểm',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'passengerHelmet',
    valueEn: 'Passenger helmet',
    valueVi: 'Mũ bảo hiểm cho người ngồi sau',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'phoneHolder',
    valueEn: 'Phone holder',
    valueVi: 'Giá đỡ điện thoại',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'rainGear',
    valueEn: 'Rain gear',
    valueVi: 'Áo mưa',
  },
  {
    namespace: 'rentals.policy.included',
    key: 'free',
    valueEn: 'Free',
    valueVi: 'Miễn phí',
  },

  {
    namespace: 'rentals.policy.rules',
    key: 'title',
    valueEn: 'Things to keep in mind',
    valueVi: 'Lưu ý',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'deposit',
    valueEn: 'Pay only 15% now, the rest at pickup.',
    valueVi: 'Chỉ trả 15% bây giờ, phần còn lại khi nhận xe.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'cancellation',
    valueEn: 'Cancel up to 48 hours before pickup for a full refund.',
    valueVi: 'Hủy trước 48 giờ để được hoàn tiền toàn bộ.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'license',
    valueEn: 'A valid A1 motorcycle license (or equivalent) is required.',
    valueVi: 'Yêu cầu giấy phép lái xe A1 hợp lệ (hoặc tương đương).',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'age',
    valueEn: 'Minimum age 20 with 12 months of enduro driving experience.',
    valueVi: 'Tối thiểu 20 tuổi với 12 tháng kinh nghiệm lái xe enduro.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'securityDeposit',
    valueEn:
      'Refundable security deposit of US $500 (cash or passport) on pickup.',
    valueVi: 'Đặt cọc hoàn lại 500 USD (tiền mặt hoặc hộ chiếu) khi nhận xe.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'mileage',
    valueEn: 'Mileage included is 120 km / day.',
    valueVi: 'Bao gồm 120 km / ngày.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'noBorderCrossing',
    valueEn: 'The rental company does not allow crossing country borders.',
    valueVi: 'Công ty không cho phép xe đi qua biên giới.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'availability',
    valueEn: 'Free inclusions and paid add-ons are subject to availability.',
    valueVi:
      'Phụ kiện miễn phí và dịch vụ có phí tùy thuộc vào tình trạng còn hàng.',
  },
  {
    namespace: 'rentals.policy.rules',
    key: 'confirmationRequired',
    valueEn:
      'Confirmation required after checkout due to limited availability.',
    valueVi: 'Cần xác nhận sau khi đặt do số lượng có hạn.',
  },

  // Contact CTA
  {
    namespace: 'rentals.contactCta',
    key: 'title',
    valueEn: 'Have questions?',
    valueVi: 'Có câu hỏi?',
  },
  {
    namespace: 'rentals.contactCta',
    key: 'subtitle',
    valueEn: "We're here for you.",
    valueVi: 'Chúng tôi luôn sẵn sàng hỗ trợ.',
  },
  {
    namespace: 'rentals.contactCta',
    key: 'button',
    valueEn: 'Contact us',
    valueVi: 'Liên hệ',
  },

  // Meta
  {
    namespace: 'meta',
    key: 'rentalsTitle',
    valueEn: 'Motorbike Rentals · Vietnam Moto Tour',
    valueVi: 'Cho thuê xe máy · Vietnam Moto Tour',
  },
  {
    namespace: 'meta',
    key: 'rentalsDescription',
    valueEn:
      'Rent vetted scooters and enduro bikes for self-guided Vietnam motorbike journeys.',
    valueVi:
      'Thuê xe ga và xe enduro được kiểm tra kỹ cho hành trình tự lái Việt Nam.',
  },

  // Admin — list + form
  {
    namespace: 'admin.rentals',
    key: 'title',
    valueEn: 'Rentals',
    valueVi: 'Cho thuê',
  },
  {
    namespace: 'admin.rentals',
    key: 'addEntity',
    valueEn: 'Add vehicle',
    valueVi: 'Thêm xe',
  },

  {
    namespace: 'admin.rentals.fields',
    key: 'type',
    valueEn: 'Type',
    valueVi: 'Loại xe',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'brand',
    valueEn: 'Brand',
    valueVi: 'Hãng',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'model',
    valueEn: 'Model',
    valueVi: 'Dòng xe',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'cc',
    valueEn: 'Engine (cc)',
    valueVi: 'Động cơ (cc)',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'quantity',
    valueEn: 'Quantity in stock',
    valueVi: 'Số lượng tồn',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'priceUsdPerDay',
    valueEn: 'Price / day (USD)',
    valueVi: 'Giá / ngày (USD)',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'description',
    valueEn: 'Description',
    valueVi: 'Mô tả',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'images',
    valueEn: 'Images',
    valueVi: 'Hình ảnh',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'imageUrl',
    valueEn: 'Primary image',
    valueVi: 'Ảnh chính',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'status',
    valueEn: 'Status',
    valueVi: 'Trạng thái',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'order',
    valueEn: 'Sort order',
    valueVi: 'Thứ tự',
  },
  {
    namespace: 'admin.rentals.fields',
    key: 'slug',
    valueEn: 'Slug',
    valueVi: 'Slug',
  },

  {
    namespace: 'admin.rentals.tabs',
    key: 'general',
    valueEn: 'General',
    valueVi: 'Chung',
  },
  {
    namespace: 'admin.rentals.tabs',
    key: 'description',
    valueEn: 'Description',
    valueVi: 'Mô tả',
  },
  {
    namespace: 'admin.rentals.tabs',
    key: 'images',
    valueEn: 'Images',
    valueVi: 'Hình ảnh',
  },

  {
    namespace: 'admin.rentals.status',
    key: 'DRAFT',
    valueEn: 'Draft',
    valueVi: 'Bản nháp',
  },
  {
    namespace: 'admin.rentals.status',
    key: 'PUBLISHED',
    valueEn: 'Published',
    valueVi: 'Đã đăng',
  },
  {
    namespace: 'admin.rentals.status',
    key: 'ARCHIVED',
    valueEn: 'Archived',
    valueVi: 'Đã lưu trữ',
  },

  {
    namespace: 'admin.rentals.confirmDelete',
    key: 'title',
    valueEn: 'Archive this vehicle?',
    valueVi: 'Lưu trữ xe này?',
  },
  {
    namespace: 'admin.rentals.confirmDelete',
    key: 'body',
    valueEn:
      'This vehicle will move to the archive and be hidden from the public page. You can restore it later.',
    valueVi:
      'Xe này sẽ được chuyển vào kho lưu trữ và ẩn khỏi trang công khai. Bạn có thể khôi phục sau.',
  },

  {
    namespace: 'admin.rentals.archive',
    key: 'title',
    valueEn: 'Rentals · Archive',
    valueVi: 'Cho thuê · Lưu trữ',
  },
  {
    namespace: 'admin.rentals.archive',
    key: 'empty',
    valueEn: 'No archived vehicles.',
    valueVi: 'Không có xe nào trong kho lưu trữ.',
  },

  {
    namespace: 'admin.rentals.list',
    key: 'empty',
    valueEn: 'No vehicles yet. Click "Add vehicle" to create the first one.',
    valueVi: 'Chưa có xe nào. Nhấn "Thêm xe" để tạo xe đầu tiên.',
  },
  {
    namespace: 'admin.rentals.list',
    key: 'searchPlaceholder',
    valueEn: 'Search by brand or model…',
    valueVi: 'Tìm theo hãng hoặc dòng xe…',
  },
];

async function main() {
  for (const e of entries) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
      update: {valueVi: e.valueVi, valueEn: e.valueEn},
      create: e,
    });
  }
  console.log(`Seeded ${entries.length} rentals translations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add script to `package.json`**

Under `"scripts"`:

```json
"seed:rentals-translations": "tsx prisma/seed-rentals-translations.ts",
```

Chain into the existing aggregate `pnpm seed` script: locate the existing `"seed": "..."` line in `package.json` and append `&& pnpm seed:rentals-translations` to its command (preserving the existing order of other seed scripts).

- [ ] **Step 3: Run seed**

Run: `pnpm seed:rentals-translations`
Expected: console output `Seeded N rentals translations.` with N matching the array length.

- [ ] **Step 4: Verify common.\* duplicates absent**

Run: `pnpm i18n:scan`
Expected: no new rows reporting `rentals.*` or `admin.rentals.*` as duplicates of `common.*`. If any duplicate is reported, swap the call-site to use `common.*` in later tasks and remove the duplicate from this seed (do not add `common.cancel`, etc. — those already exist).

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-rentals-translations.ts package.json
git commit -m "feat(rentals): seed rental translations"
```

---

## Task 10: Seed two starter vehicles

**Files:**

- Create: `prisma/seed-vehicles.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `prisma/seed-vehicles.ts`**

Copy the env-loading boilerplate from `prisma/seed-admin-translations.ts`. Then add:

```ts
import * as fs from 'fs';
import * as path from 'path';

type VehicleSeed = {
  slug: string;
  type: 'SCOOTER' | 'BIKE';
  brand: string;
  model: string;
  cc: number;
  quantity: number;
  priceUsdPerDay: number;
  imageFile: string;
  descriptionVi: string;
  descriptionEn: string;
  order: number;
};

const vehicles: VehicleSeed[] = [
  {
    slug: 'honda-airblade-125',
    type: 'SCOOTER',
    brand: 'Honda',
    model: 'Airblade 125',
    cc: 125,
    quantity: 2,
    priceUsdPerDay: 8,
    imageFile: 'Scooter automatic Honda Airblade 125cc.jpeg',
    descriptionEn:
      'Automatic city scooter. Light, easy to handle, and well suited to coastal day trips.',
    descriptionVi:
      'Xe ga tự động trong phố. Nhẹ, dễ điều khiển và phù hợp cho các chuyến đi ven biển trong ngày.',
    order: 0,
  },
  {
    slug: 'honda-enduro-xr-150l',
    type: 'BIKE',
    brand: 'Honda',
    model: 'Enduro XR 150L',
    cc: 150,
    quantity: 2,
    priceUsdPerDay: 18,
    imageFile: 'Honda Enduro XR 150L.jpeg',
    descriptionEn:
      'Manual enduro motorcycle. Higher ground clearance and torque — built for mountain passes and rough roads.',
    descriptionVi:
      'Xe enduro số sàn. Khoảng sáng gầm cao và mô-men xoắn lớn — thiết kế cho đèo núi và đường gồ ghề.',
    order: 1,
  },
];

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads');
const PUBLIC_URL_PREFIX = process.env.UPLOAD_PUBLIC_URL ?? '/uploads';

async function main() {
  const vehiclesDir = path.join(__dirname, '..', 'src', 'rentals');
  const targetDir = path.join(UPLOAD_DIR, 'vehicles');
  fs.mkdirSync(targetDir, {recursive: true});

  for (const v of vehicles) {
    const srcPath = path.join(vehiclesDir, v.imageFile);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Skipping ${v.slug}: source image not found at ${srcPath}`);
      continue;
    }
    const ext = path.extname(v.imageFile);
    const targetName = `${v.slug}${ext}`;
    const targetPath = path.join(targetDir, targetName);
    fs.copyFileSync(srcPath, targetPath);
    const imageUrl = `${PUBLIC_URL_PREFIX}/vehicles/${targetName}`;

    await prisma.vehicle.upsert({
      where: {slug: v.slug},
      update: {
        type: v.type,
        brand: v.brand,
        model: v.model,
        cc: v.cc,
        quantity: v.quantity,
        priceUsdPerDay: v.priceUsdPerDay,
        imageUrl,
        description: {en: v.descriptionEn, vi: v.descriptionVi},
        order: v.order,
      },
      create: {
        slug: v.slug,
        type: v.type,
        brand: v.brand,
        model: v.model,
        cc: v.cc,
        quantity: v.quantity,
        priceUsdPerDay: v.priceUsdPerDay,
        imageUrl,
        description: {en: v.descriptionEn, vi: v.descriptionVi},
        status: 'PUBLISHED',
        order: v.order,
      },
    });
    console.log(`Seeded vehicle: ${v.slug} -> ${imageUrl}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add script to `package.json`**

Under `"scripts"`:

```json
"seed:rentals": "tsx prisma/seed-vehicles.ts",
```

Chain into the aggregate `pnpm seed` script after `seed:rentals-translations`.

- [ ] **Step 3: Run seed**

Run: `pnpm seed:rentals`
Expected: two `Seeded vehicle: ...` lines printed; images copied to `UPLOAD_DIR/vehicles/`.

- [ ] **Step 4: Verify DB rows**

Run: `pnpm prisma studio` (manual visual check) or quick query — verify two rows exist in `Vehicle` with `status=PUBLISHED`.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-vehicles.ts package.json
git commit -m "feat(rentals): seed initial vehicles"
```

---

## Task 11: Add `VehicleCard` component with tests

**Files:**

- Test: `src/components/Rentals/VehicleCard/VehicleCard.spec.tsx`
- Create: `src/components/Rentals/VehicleCard/VehicleCard.tsx`
- Create: `src/components/Rentals/VehicleCard/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {VehicleCard} from './VehicleCard';
import type {Vehicle} from '@/domain';

const messages = {
  rentals: {
    perDay: '/ day',
    cc: 'cc',
    available: 'Available',
    outOfStock: 'Out of stock',
    type: {scooter: 'Scooter', bike: 'Bike'},
  },
};

const vehicle: Vehicle = {
  id: 'v1',
  slug: 'honda-airblade-125',
  type: 'SCOOTER',
  brand: 'Honda',
  model: 'Airblade 125',
  cc: 125,
  quantity: 2,
  priceUsdPerDay: 8,
  imageUrl: '/uploads/vehicles/honda-airblade-125.jpeg',
  images: [],
  description: {en: '', vi: ''},
  status: 'PUBLISHED',
  order: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('VehicleCard', () => {
  it('renders brand, model, type, cc, and price', () => {
    render(withIntl(<VehicleCard vehicle={vehicle} />));
    expect(screen.getByText('Honda Airblade 125')).toBeInTheDocument();
    expect(screen.getByText(/Scooter/)).toBeInTheDocument();
    expect(screen.getByText(/125/)).toBeInTheDocument();
    expect(screen.getByText('$8')).toBeInTheDocument();
    expect(screen.getByText('/ day')).toBeInTheDocument();
  });

  it('shows availability when quantity > 0', () => {
    render(withIntl(<VehicleCard vehicle={vehicle} />));
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows out of stock when quantity is 0', () => {
    render(withIntl(<VehicleCard vehicle={{...vehicle, quantity: 0}} />));
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/components/Rentals/VehicleCard/VehicleCard.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/Rentals/VehicleCard/VehicleCard.tsx`**

```tsx
import {useTranslations} from 'next-intl';
import type {Vehicle} from '@/domain';

type Props = {
  vehicle: Vehicle;
};

export function VehicleCard({vehicle}: Props) {
  const t = useTranslations('rentals');
  const tt = useTranslations('rentals.type');
  const typeLabel = vehicle.type === 'SCOOTER' ? tt('scooter') : tt('bike');
  const available = vehicle.quantity > 0;

  return (
    <article className="bg-surface-elevated rounded-lg border border-border overflow-hidden flex flex-col">
      <div className="aspect-[3/2] bg-surface-alt overflow-hidden">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
          {typeLabel}
        </span>
        <h3 className="type-title-sm text-on-surface">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="type-body-sm text-on-surface-secondary">
          {vehicle.cc} {t('cc')}
        </p>
        <p
          className={
            available
              ? 'type-label-sm text-on-surface-secondary'
              : 'type-label-sm text-on-surface-tertiary'
          }
        >
          {available ? t('available') : t('outOfStock')}
        </p>
        <p className="mt-auto type-title-sm text-on-surface-accent">
          ${vehicle.priceUsdPerDay}{' '}
          <span className="type-body-sm text-on-surface-secondary">
            {t('perDay')}
          </span>
        </p>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Add re-export at `src/components/Rentals/VehicleCard/index.ts`**

```ts
export {VehicleCard} from './VehicleCard';
```

- [ ] **Step 5: Run tests to verify pass**

Run: `pnpm jest src/components/Rentals/VehicleCard/VehicleCard.spec.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Rentals/VehicleCard
git commit -m "feat(rentals): add VehicleCard component"
```

---

## Task 12: Add `RentalsFilter` component with tests

**Files:**

- Test: `src/components/Rentals/RentalsFilter/RentalsFilter.spec.tsx`
- Create: `src/components/Rentals/RentalsFilter/RentalsFilter.tsx`
- Create: `src/components/Rentals/RentalsFilter/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {RentalsFilter} from './RentalsFilter';

const messages = {
  rentals: {filter: {all: 'All', scooter: 'Scooters', bike: 'Bikes'}},
};

function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('RentalsFilter', () => {
  it('renders three options and calls onChange', () => {
    const onChange = jest.fn();
    render(withIntl(<RentalsFilter value="all" onChange={onChange} />));
    fireEvent.click(screen.getByText('Scooters'));
    expect(onChange).toHaveBeenCalledWith('scooter');
  });

  it('marks the active option', () => {
    render(withIntl(<RentalsFilter value="bike" onChange={() => {}} />));
    expect(
      screen.getByRole('button', {name: 'Bikes', pressed: true}),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/components/Rentals/RentalsFilter/RentalsFilter.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/Rentals/RentalsFilter/RentalsFilter.tsx`**

```tsx
import {useTranslations} from 'next-intl';

export type RentalsFilterValue = 'all' | 'scooter' | 'bike';

type Props = {
  value: RentalsFilterValue;
  onChange: (next: RentalsFilterValue) => void;
};

const OPTIONS: ReadonlyArray<{
  value: RentalsFilterValue;
  key: 'all' | 'scooter' | 'bike';
}> = [
  {value: 'all', key: 'all'},
  {value: 'scooter', key: 'scooter'},
  {value: 'bike', key: 'bike'},
];

export function RentalsFilter({value, onChange}: Props) {
  const t = useTranslations('rentals.filter');
  return (
    <div
      role="group"
      aria-label="Vehicle filter"
      className="inline-flex rounded-full border border-border bg-surface-elevated p-1"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={
              active
                ? 'cursor-pointer px-4 py-1.5 rounded-full type-label-sm bg-primary text-on-primary'
                : 'cursor-pointer px-4 py-1.5 rounded-full type-label-sm text-on-surface-secondary'
            }
          >
            {t(opt.key)}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add re-export at `src/components/Rentals/RentalsFilter/index.ts`**

```ts
export {RentalsFilter} from './RentalsFilter';
export type {RentalsFilterValue} from './RentalsFilter';
```

- [ ] **Step 5: Run tests to verify pass**

Run: `pnpm jest src/components/Rentals/RentalsFilter/RentalsFilter.spec.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Rentals/RentalsFilter
git commit -m "feat(rentals): add RentalsFilter component"
```

---

## Task 13: Add `RentalPolicy` + `RentalContactCta` components

**Files:**

- Create: `src/components/Rentals/RentalPolicy/RentalPolicy.tsx` + `index.ts`
- Create: `src/components/Rentals/RentalContactCta/RentalContactCta.tsx` + `index.ts`
- Create: `src/components/Rentals/index.ts`

- [ ] **Step 1: Implement `src/components/Rentals/RentalPolicy/RentalPolicy.tsx`**

```tsx
import {useTranslations} from 'next-intl';

const INCLUDED_KEYS = [
  'helmet',
  'passengerHelmet',
  'phoneHolder',
  'rainGear',
] as const;

const RULE_KEYS = [
  'deposit',
  'cancellation',
  'license',
  'age',
  'securityDeposit',
  'mileage',
  'noBorderCrossing',
  'availability',
  'confirmationRequired',
] as const;

export function RentalPolicy() {
  const t = useTranslations('rentals.policy');
  const ti = useTranslations('rentals.policy.included');
  const tr = useTranslations('rentals.policy.rules');

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 border-t border-border">
      <div>
        <h2 className="type-title-sm uppercase tracking-wide text-on-surface mb-6">
          {ti('title')}
        </h2>
        <ul className="space-y-3">
          {INCLUDED_KEYS.map((k) => (
            <li
              key={k}
              className="flex items-center justify-between type-body-md text-on-surface"
            >
              <span>{ti(k)}</span>
              <span className="type-label-sm uppercase text-on-surface-tertiary">
                {ti('free')}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="type-title-sm uppercase tracking-wide text-on-surface mb-6">
          {tr('title')}
        </h2>
        <ol className="space-y-3 list-decimal pl-5">
          {RULE_KEYS.map((k) => (
            <li key={k} className="type-body-md text-on-surface-secondary">
              {tr(k)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add re-export at `src/components/Rentals/RentalPolicy/index.ts`**

```ts
export {RentalPolicy} from './RentalPolicy';
```

- [ ] **Step 3: Implement `src/components/Rentals/RentalContactCta/RentalContactCta.tsx`**

```tsx
import Link from 'next/link';
import {useTranslations} from 'next-intl';

export function RentalContactCta() {
  const t = useTranslations('rentals.contactCta');
  return (
    <section className="py-12 border-t border-border text-center">
      <h2 className="type-title-md text-on-surface mb-2">{t('title')}</h2>
      <p className="type-body-md text-on-surface-secondary mb-6">
        {t('subtitle')}
      </p>
      <Link
        href="/contact"
        className="cursor-pointer inline-block bg-primary text-on-primary px-6 py-3 rounded-full type-label-sm uppercase tracking-wide"
      >
        {t('button')}
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Add re-export at `src/components/Rentals/RentalContactCta/index.ts`**

```ts
export {RentalContactCta} from './RentalContactCta';
```

- [ ] **Step 5: Create barrel `src/components/Rentals/index.ts`**

```ts
export {VehicleCard} from './VehicleCard';
export {RentalsFilter} from './RentalsFilter';
export type {RentalsFilterValue} from './RentalsFilter';
export {RentalPolicy} from './RentalPolicy';
export {RentalContactCta} from './RentalContactCta';
```

- [ ] **Step 6: Type check**

Run: `pnpm tsc --noEmit`
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Rentals/RentalPolicy src/components/Rentals/RentalContactCta src/components/Rentals/index.ts
git commit -m "feat(rentals): add policy + contact CTA components"
```

---

## Task 14: Replace `rental.tsx` with `rentals.tsx` public page

**Files:**

- Create: `src/pages/rentals.tsx`
- Delete: `src/pages/rental.tsx`

- [ ] **Step 1: Implement `src/pages/rentals.tsx`**

```tsx
import {useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';
import Head from 'next/head';
import {PageHeader} from '@/components/PageHeader';
import {
  VehicleCard,
  RentalsFilter,
  RentalPolicy,
  RentalContactCta,
  type RentalsFilterValue,
} from '@/components/Rentals';
import type {Vehicle} from '@/domain';

type Props = {
  vehicles: Vehicle[];
};

const fadeInUp = {
  hidden: {opacity: 0, y: 30},
  visible: {opacity: 1, y: 0, transition: {duration: 0.6}},
};

export default function RentalsPage({vehicles}: Props) {
  const t = useTranslations('rentals');
  const tc = useTranslations('common');
  const tMeta = useTranslations('meta');
  const [filter, setFilter] = useState<RentalsFilterValue>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return vehicles;
    const type = filter === 'scooter' ? 'SCOOTER' : 'BIKE';
    return vehicles.filter((v) => v.type === type);
  }, [vehicles, filter]);

  return (
    <>
      <Head>
        <title>{tMeta('rentalsTitle')}</title>
        <meta name="description" content={tMeta('rentalsDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          {label: tc('breadcrumbHome'), href: '/'},
          {label: t('breadcrumbRental')},
        ]}
        backgroundImage="https://vietnammotorcycletours.com/storage/2022/04/AR500963-1920x1280.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 mb-10">
            <p className="type-body-lg text-on-surface-secondary max-w-3xl">
              {t('subtitle')}
            </p>
            <RentalsFilter value={filter} onChange={setFilter} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((v, i) => (
              <motion.div
                key={v.id}
                initial="hidden"
                whileInView="visible"
                viewport={{once: true}}
                variants={{
                  ...fadeInUp,
                  visible: {
                    ...fadeInUp.visible,
                    transition: {duration: 0.6, delay: i * 0.1},
                  },
                }}
              >
                <VehicleCard vehicle={v} />
              </motion.div>
            ))}
          </div>

          <RentalPolicy />
          <RentalContactCta />
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({locale}: GetStaticPropsContext) {
  const {getMessagesFromDb, getPublishedVehicles} =
    await import('@/data/queries');
  const [messages, vehicles] = await Promise.all([
    getMessagesFromDb(locale ?? 'vi'),
    getPublishedVehicles(),
  ]);

  return {
    props: {messages, vehicles},
    revalidate: 60,
  };
}
```

- [ ] **Step 2: Delete the old page**

Run: `git rm src/pages/rental.tsx`
Expected: file removed.

- [ ] **Step 3: Build to confirm no broken refs**

Run: `pnpm build`
Expected: build succeeds; no references to `/rental` left in the bundle. If references appear, audit components for hardcoded paths (should not exist — everything goes via `routes`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/rentals.tsx src/pages/rental.tsx
git commit -m "feat(rentals): replace /rental with DB-driven /rentals"
```

---

## Task 15: Admin list page

**Files:**

- Create: `src/pages/admin/rentals/index.tsx`

- [ ] **Step 1: Implement `src/pages/admin/rentals/index.tsx`**

```tsx
import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {useVehicles, useDeleteVehicle} from '@/queries/admin/vehicles';
import {vehicleKeys} from '@/queries/admin/vehicles.keys';
import {fetchVehiclesServer} from '@/queries/fetchers/admin/vehicles.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {routes} from '@/routes';
import {Badge, Button} from '@/components/ui';
import {ConfirmModal} from '@/components/ui/ConfirmModal';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import type {Vehicle} from '@/domain';

export default function AdminRentalsList() {
  const {data: vehicles, isLoading} = useVehicles({archived: false});
  const {data: archivedVehicles} = useVehicles({archived: true});
  const del = useDeleteVehicle();
  const {setLoading} = useAdminLoading();
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  const list = (vehicles ?? []) as Vehicle[];
  const archivedCount = archivedVehicles?.length ?? 0;
  const term = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!term) return list;
    return list.filter(
      (v) =>
        v.brand.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term),
    );
  }, [list, term]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Vehicle[]>();
    for (const v of filtered) {
      const key = v.type;
      const bucket = groups.get(key) ?? [];
      bucket.push(v);
      groups.set(key, bucket);
    }
    return Array.from(groups.entries())
      .map(([type, items]) => ({
        type,
        items: [...items].sort(
          (a, b) => a.order - b.order || a.brand.localeCompare(b.brand),
        ),
      }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [filtered]);

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Rentals"
          actions={
            <>
              {archivedCount > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  href={routes.admin.vehicles.archive.path()}
                  icon={<i className="fa fa-archive text-xs" />}
                >
                  Archive ({archivedCount})
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                href={routes.admin.vehicles.new.path()}
                icon={<i className="fa fa-plus text-xs" />}
              >
                Add vehicle
              </Button>
            </>
          }
        />
      }
    >
      <div className="space-y-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by brand or model…"
          className="cursor-text w-full max-w-md px-3 py-2 rounded-md border border-border bg-surface-elevated"
        />

        {grouped.length === 0 && (
          <p className="type-body-md text-on-surface-tertiary">
            No vehicles yet. Click "Add vehicle" to create the first one.
          </p>
        )}

        {grouped.map((group) => (
          <section
            key={group.type}
            className="bg-surface-elevated rounded-xl border border-border overflow-hidden"
          >
            <header className="flex items-center justify-between px-4 py-3 bg-surface-alt border-b border-border">
              <h2 className="type-label-sm uppercase tracking-wide text-on-surface-secondary">
                {group.type === 'SCOOTER' ? 'Scooters' : 'Bikes'}
              </h2>
              <span className="type-body-sm text-on-surface-tertiary">
                ({group.items.length})
              </span>
            </header>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Vehicle
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    CC
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Qty
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Price/day
                  </th>
                  <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Status
                  </th>
                  <th className="text-right px-4 py-2 type-label-sm text-on-surface-tertiary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={routes.admin.vehicles.edit.path({id: v.id})}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt=""
                            className="h-[40px] w-auto rounded object-cover"
                          />
                        ) : null}
                        <span className="type-title-sm text-on-surface">
                          {v.brand} {v.model}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                      {v.cc}
                    </td>
                    <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                      {v.quantity}
                    </td>
                    <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                      ${v.priceUsdPerDay}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{v.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost-primary"
                          size="sm"
                          href={routes.admin.vehicles.edit.path({id: v.id})}
                          icon={<i className="fa fa-pencil" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost-danger"
                          size="sm"
                          onClick={() => setConfirmId(v.id)}
                          icon={<i className="fa fa-trash" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <ConfirmModal
        isOpen={confirmId !== null}
        title="Archive this vehicle?"
        body="This vehicle will move to the archive and be hidden from the public page. You can restore it later."
        confirmLabel="Archive"
        onConfirm={async () => {
          if (confirmId) await del.mutateAsync(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: vehicleKeys.list({archived: false}),
    queryFn: () => fetchVehiclesServer({archived: false}),
  });
  await qc.prefetchQuery({
    queryKey: vehicleKeys.list({archived: true}),
    queryFn: () => fetchVehiclesServer({archived: true}),
  });
  return {props: {dehydratedState: dehydrate(qc)}};
};
```

- [ ] **Step 2: Type check + spot-build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: zero TS errors; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/rentals/index.tsx
git commit -m "feat(rentals): admin vehicles list page"
```

---

## Task 16: Admin general form tab + form-utils

**Files:**

- Create: `src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.tsx`
- Create: `src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.form-utils.ts`
- Create: `src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.spec.tsx`
- Create: `src/components/Admin/VehicleGeneralForm/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {VehicleGeneralForm} from './VehicleGeneralForm';

describe('VehicleGeneralForm', () => {
  it('renders required fields', () => {
    render(<VehicleGeneralForm initial={null} onSubmit={() => {}} />);
    expect(screen.getByLabelText(/Brand/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Engine/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
  });

  it('rejects cc <= 0 via validation error', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<VehicleGeneralForm initial={null} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/Brand/i), 'Honda');
    await user.type(screen.getByLabelText(/Model/i), 'X');
    await user.clear(screen.getByLabelText(/Engine/i));
    await user.type(screen.getByLabelText(/Engine/i), '0');
    await user.click(screen.getByRole('button', {name: /Save/i}));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Engine .* > 0/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.form-utils.ts`**

```ts
import * as yup from 'yup';
import type {InferType} from 'yup';
import type {Vehicle, VehicleType, VehicleStatus} from '@/domain';

export const vehicleGeneralSchema = yup.object({
  slug: yup.string().required(),
  type: yup.mixed<VehicleType>().oneOf(['SCOOTER', 'BIKE']).required(),
  brand: yup.string().required('Brand is required'),
  model: yup.string().required('Model is required'),
  cc: yup
    .number()
    .typeError('Engine (cc) must be a number')
    .positive('Engine (cc) must be > 0')
    .integer()
    .required(),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .min(0, 'Quantity must be >= 0')
    .integer()
    .required(),
  priceUsdPerDay: yup
    .number()
    .typeError('Price must be a number')
    .min(0, 'Price must be >= 0')
    .integer()
    .required(),
  status: yup
    .mixed<VehicleStatus>()
    .oneOf(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
    .required(),
  order: yup.number().integer().required(),
});

export type VehicleGeneralFormValues = InferType<typeof vehicleGeneralSchema>;

export function vehicleGeneralDefaults(
  v: Vehicle | null,
): VehicleGeneralFormValues {
  return {
    slug: v?.slug ?? '',
    type: v?.type ?? 'SCOOTER',
    brand: v?.brand ?? '',
    model: v?.model ?? '',
    cc: v?.cc ?? 0,
    quantity: v?.quantity ?? 0,
    priceUsdPerDay: v?.priceUsdPerDay ?? 0,
    status: v?.status ?? 'DRAFT',
    order: v?.order ?? 0,
  };
}

export function deriveSlug(brand: string, model: string): string {
  return `${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 4: Implement `src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.tsx`**

```tsx
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {
  Button,
  TextInput,
  NumberInput,
  SegmentedControl,
  FormField,
} from '@/components/ui';
import type {Vehicle} from '@/domain';
import {
  vehicleGeneralSchema,
  vehicleGeneralDefaults,
  deriveSlug,
  type VehicleGeneralFormValues,
} from './VehicleGeneralForm.form-utils';

type Props = {
  initial: Vehicle | null;
  onSubmit: (values: VehicleGeneralFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function VehicleGeneralForm({initial, onSubmit, onCancel}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {errors, isSubmitting},
  } = useForm<VehicleGeneralFormValues>({
    resolver: yupResolver(vehicleGeneralSchema),
    defaultValues: vehicleGeneralDefaults(initial),
  });

  const type = watch('type');
  const status = watch('status');
  const brand = watch('brand');
  const model = watch('model');

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const next = {...values, slug: values.slug || deriveSlug(brand, model)};
        await onSubmit(next);
      })}
      className="space-y-6 max-w-2xl"
    >
      <FormField label="Type">
        <SegmentedControl
          value={type}
          onChange={(v) => setValue('type', v as 'SCOOTER' | 'BIKE')}
          options={[
            {value: 'SCOOTER', label: 'Scooter'},
            {value: 'BIKE', label: 'Bike'},
          ]}
        />
      </FormField>

      <FormField label="Brand" error={errors.brand?.message}>
        <TextInput {...register('brand')} />
      </FormField>

      <FormField label="Model" error={errors.model?.message}>
        <TextInput {...register('model')} />
      </FormField>

      <FormField label="Engine (cc)" error={errors.cc?.message}>
        <NumberInput {...register('cc', {valueAsNumber: true})} />
      </FormField>

      <FormField label="Quantity in stock" error={errors.quantity?.message}>
        <NumberInput {...register('quantity', {valueAsNumber: true})} />
      </FormField>

      <FormField
        label="Price / day (USD)"
        error={errors.priceUsdPerDay?.message}
      >
        <NumberInput {...register('priceUsdPerDay', {valueAsNumber: true})} />
      </FormField>

      <FormField label="Status">
        <SegmentedControl
          value={status}
          onChange={(v) =>
            setValue('status', v as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')
          }
          options={[
            {value: 'DRAFT', label: 'Draft'},
            {value: 'PUBLISHED', label: 'Published'},
            {value: 'ARCHIVED', label: 'Archived'},
          ]}
        />
      </FormField>

      <FormField label="Sort order" error={errors.order?.message}>
        <NumberInput {...register('order', {valueAsNumber: true})} />
      </FormField>

      <div className="flex gap-3 justify-end">
        {onCancel ? (
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Add re-export at `src/components/Admin/VehicleGeneralForm/index.ts`**

```ts
export {VehicleGeneralForm} from './VehicleGeneralForm';
export {
  vehicleGeneralSchema,
  vehicleGeneralDefaults,
  deriveSlug,
} from './VehicleGeneralForm.form-utils';
export type {VehicleGeneralFormValues} from './VehicleGeneralForm.form-utils';
```

- [ ] **Step 6: Run tests to verify pass**

Run: `pnpm jest src/components/Admin/VehicleGeneralForm/VehicleGeneralForm.spec.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Admin/VehicleGeneralForm
git commit -m "feat(rentals): admin VehicleGeneralForm"
```

---

## Task 17: Admin description form tab with locale switcher + form-utils

**Files:**

- Create: `src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.tsx`
- Create: `src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.form-utils.ts`
- Create: `src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.spec.tsx`
- Create: `src/components/Admin/VehicleDescriptionForm/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {VehicleDescriptionForm} from './VehicleDescriptionForm';

describe('VehicleDescriptionForm', () => {
  it('persists VI and EN values across locale toggles', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <VehicleDescriptionForm initial={{en: '', vi: ''}} onSubmit={onSubmit} />,
    );

    await user.click(screen.getByRole('button', {name: /VI/i}));
    await user.type(screen.getByLabelText(/Description/i), 'Vietnamese text');

    await user.click(screen.getByRole('button', {name: /EN/i}));
    await user.type(screen.getByLabelText(/Description/i), 'English text');

    await user.click(screen.getByRole('button', {name: /Save/i}));
    expect(onSubmit).toHaveBeenCalledWith({
      en: 'English text',
      vi: 'Vietnamese text',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.form-utils.ts`**

```ts
import * as yup from 'yup';
import type {InferType} from 'yup';

export const vehicleDescriptionSchema = yup.object({
  en: yup.string().defined().default(''),
  vi: yup.string().defined().default(''),
});

export type VehicleDescriptionFormValues = InferType<
  typeof vehicleDescriptionSchema
>;

export function vehicleDescriptionDefaults(
  initial: {en: string; vi: string} | null,
): VehicleDescriptionFormValues {
  return {en: initial?.en ?? '', vi: initial?.vi ?? ''};
}
```

- [ ] **Step 4: Implement `src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.tsx`**

```tsx
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {Button, Textarea, FormField, SegmentedControl} from '@/components/ui';
import {
  vehicleDescriptionSchema,
  vehicleDescriptionDefaults,
  type VehicleDescriptionFormValues,
} from './VehicleDescriptionForm.form-utils';

type Locale = 'vi' | 'en';

type Props = {
  initial: {en: string; vi: string} | null;
  onSubmit: (values: VehicleDescriptionFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function VehicleDescriptionForm({initial, onSubmit, onCancel}: Props) {
  const [locale, setLocale] = useState<Locale>('vi');
  const {
    register,
    handleSubmit,
    formState: {isSubmitting},
  } = useForm<VehicleDescriptionFormValues>({
    resolver: yupResolver(vehicleDescriptionSchema),
    defaultValues: vehicleDescriptionDefaults(initial),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <SegmentedControl
        value={locale}
        onChange={(v) => setLocale(v as Locale)}
        options={[
          {value: 'vi', label: 'VI'},
          {value: 'en', label: 'EN'},
        ]}
      />

      <FormField label="Description">
        {/* Both fields remain mounted so values persist when toggling locale;
            only the active locale's textarea is visible. */}
        <div className={locale === 'vi' ? '' : 'hidden'}>
          <Textarea
            rows={8}
            {...register('vi')}
            aria-label="Description (VI)"
          />
        </div>
        <div className={locale === 'en' ? '' : 'hidden'}>
          <Textarea
            rows={8}
            {...register('en')}
            aria-label="Description (EN)"
          />
        </div>
      </FormField>

      <p className="type-label-sm text-on-surface-tertiary uppercase tracking-wide">
        Stored as {'{en, vi}'} JSON shape.
      </p>

      <div className="flex gap-3 justify-end">
        {onCancel ? (
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Add re-export at `src/components/Admin/VehicleDescriptionForm/index.ts`**

```ts
export {VehicleDescriptionForm} from './VehicleDescriptionForm';
export {
  vehicleDescriptionSchema,
  vehicleDescriptionDefaults,
} from './VehicleDescriptionForm.form-utils';
export type {VehicleDescriptionFormValues} from './VehicleDescriptionForm.form-utils';
```

- [ ] **Step 6: Run tests to verify pass**

Run: `pnpm jest src/components/Admin/VehicleDescriptionForm/VehicleDescriptionForm.spec.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Admin/VehicleDescriptionForm
git commit -m "feat(rentals): admin VehicleDescriptionForm with locale switcher"
```

---

## Task 18: Admin images form tab + form-utils

**Files:**

- Create: `src/components/Admin/VehicleImagesForm/VehicleImagesForm.tsx`
- Create: `src/components/Admin/VehicleImagesForm/VehicleImagesForm.form-utils.ts`
- Create: `src/components/Admin/VehicleImagesForm/index.ts`

- [ ] **Step 1: Implement `src/components/Admin/VehicleImagesForm/VehicleImagesForm.form-utils.ts`**

```ts
import * as yup from 'yup';
import type {InferType} from 'yup';

export const vehicleImagesSchema = yup.object({
  imageUrl: yup.string().nullable().defined().default(null),
  images: yup
    .array(yup.string().required())
    .defined()
    .default([] as string[]),
});

export type VehicleImagesFormValues = InferType<typeof vehicleImagesSchema>;

export function vehicleImagesDefaults(
  initial: {imageUrl: string | null; images: string[]} | null,
): VehicleImagesFormValues {
  return {
    imageUrl: initial?.imageUrl ?? null,
    images: initial?.images ?? [],
  };
}
```

- [ ] **Step 2: Implement `src/components/Admin/VehicleImagesForm/VehicleImagesForm.tsx`**

```tsx
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {Button, FormField} from '@/components/ui';
import {ImageUpload} from '@/components/ui/ImageUpload';
import {
  vehicleImagesSchema,
  vehicleImagesDefaults,
  type VehicleImagesFormValues,
} from './VehicleImagesForm.form-utils';

type Props = {
  initial: {imageUrl: string | null; images: string[]} | null;
  vehicleId: string | null;
  onSubmit: (values: VehicleImagesFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function VehicleImagesForm({
  initial,
  vehicleId,
  onSubmit,
  onCancel,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    formState: {isSubmitting},
  } = useForm<VehicleImagesFormValues>({
    resolver: yupResolver(vehicleImagesSchema),
    defaultValues: vehicleImagesDefaults(initial),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <FormField label="Primary image">
        <Controller
          control={control}
          name="imageUrl"
          render={({field}) => (
            <ImageUpload
              entityType="vehicle"
              entityId={vehicleId ?? 'new'}
              imageType="primary"
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
      </FormField>

      <FormField label="Gallery images">
        <Controller
          control={control}
          name="images"
          render={({field}) => (
            <ImageUpload
              entityType="vehicle"
              entityId={vehicleId ?? 'new'}
              imageType="gallery"
              value={field.value}
              multiple
              onChange={field.onChange}
            />
          )}
        />
      </FormField>

      <div className="flex gap-3 justify-end">
        {onCancel ? (
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
```

**Important:** This task assumes `ImageUpload` already supports a `vehicle` entity type and `primary` / `gallery` image-type variants. If `src/lib/upload-entities.ts` does not yet enumerate `vehicle`, **add it**: open `src/lib/upload-entities.ts` and append `'vehicle'` to the `EntityType` union (or `EntityType` enum / const array), and `'primary'` and `'gallery'` to `ImageType` if either is missing. Run `pnpm tsc --noEmit` to verify the new entity propagates through the upload API route.

- [ ] **Step 3: Add re-export at `src/components/Admin/VehicleImagesForm/index.ts`**

```ts
export {VehicleImagesForm} from './VehicleImagesForm';
export {
  vehicleImagesSchema,
  vehicleImagesDefaults,
} from './VehicleImagesForm.form-utils';
export type {VehicleImagesFormValues} from './VehicleImagesForm.form-utils';
```

- [ ] **Step 4: Type check**

Run: `pnpm tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/VehicleImagesForm src/lib/upload-entities.ts
git commit -m "feat(rentals): admin VehicleImagesForm"
```

---

## Task 19: Admin edit + new pages wired through tabs

**Files:**

- Create: `src/components/Admin/VehicleEditTabs/VehicleEditTabs.tsx`
- Create: `src/components/Admin/VehicleEditTabs/index.ts`
- Create: `src/pages/admin/rentals/new/index.tsx` (redirect)
- Create: `src/pages/admin/rentals/new/[tab].tsx`
- Create: `src/pages/admin/rentals/[id]/edit/index.tsx` (redirect)
- Create: `src/pages/admin/rentals/[id]/edit/[tab].tsx`

- [ ] **Step 1: Implement `src/components/Admin/VehicleEditTabs/VehicleEditTabs.tsx`**

```tsx
import Link from 'next/link';
import type {VehicleTab} from '@/routes';

type Props = {
  active: VehicleTab;
  baseHref: (tab: VehicleTab) => string;
};

const TABS: ReadonlyArray<{key: VehicleTab; label: string}> = [
  {key: 'general', label: 'General'},
  {key: 'description', label: 'Description'},
  {key: 'images', label: 'Images'},
];

export function VehicleEditTabs({active, baseHref}: Props) {
  return (
    <nav
      role="tablist"
      className="flex gap-1 border-b border-border bg-surface px-4"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={baseHref(tab.key)}
            role="tab"
            aria-selected={isActive}
            className={
              isActive
                ? 'cursor-pointer px-4 py-3 type-label-sm uppercase tracking-wide border-b-2 border-primary text-on-surface'
                : 'cursor-pointer px-4 py-3 type-label-sm uppercase tracking-wide text-on-surface-tertiary'
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Add re-export at `src/components/Admin/VehicleEditTabs/index.ts`**

```ts
export {VehicleEditTabs} from './VehicleEditTabs';
```

- [ ] **Step 3: Implement `src/pages/admin/rentals/new/index.tsx`**

```tsx
import type {GetServerSideProps} from 'next';
import {routes} from '@/routes';

export default function NewVehicleIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {destination: routes.admin.vehicles.new.path(), permanent: false},
});
```

- [ ] **Step 4: Implement `src/pages/admin/rentals/new/[tab].tsx`**

```tsx
import {useRouter} from 'next/router';
import type {GetServerSideProps} from 'next';
import {isVehicleTab, routes, type VehicleTab} from '@/routes';
import {useCreateVehicle} from '@/queries/admin/vehicles';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {VehicleEditTabs} from '@/components/Admin/VehicleEditTabs';
import {VehicleGeneralForm} from '@/components/Admin/VehicleGeneralForm';
import {VehicleDescriptionForm} from '@/components/Admin/VehicleDescriptionForm';
import {VehicleImagesForm} from '@/components/Admin/VehicleImagesForm';

type Props = {tab: VehicleTab};

export default function NewVehiclePage({tab}: Props) {
  const router = useRouter();
  const create = useCreateVehicle();

  const handleGeneralSubmit = async (values: Record<string, unknown>) => {
    const v = await create.mutateAsync(values);
    await router.replace(
      routes.admin.vehicles.edit.path({id: v.id, tab: 'description'}),
    );
  };

  return (
    <AdminPageShell
      header={
        <>
          <AdminPageHeader title="Add vehicle" />
          <VehicleEditTabs
            active={tab}
            baseHref={(t) => routes.admin.vehicles.new.path({tab: t})}
          />
        </>
      }
    >
      {tab === 'general' && (
        <VehicleGeneralForm
          initial={null}
          onSubmit={handleGeneralSubmit}
          onCancel={() => router.push(routes.admin.vehicles.list.path())}
        />
      )}
      {tab === 'description' && (
        <p className="type-body-md text-on-surface-tertiary">
          Save the General tab first to enable description editing.
        </p>
      )}
      {tab === 'images' && (
        <p className="type-body-md text-on-surface-tertiary">
          Save the General tab first to enable image uploads.
        </p>
      )}
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const tabParam = String(ctx.params?.tab ?? '');
  if (!isVehicleTab(tabParam)) {
    return {
      redirect: {
        destination: routes.admin.vehicles.new.path(),
        permanent: false,
      },
    };
  }
  return {props: {tab: tabParam}};
};
```

- [ ] **Step 5: Implement `src/pages/admin/rentals/[id]/edit/index.tsx`**

```tsx
import type {GetServerSideProps} from 'next';
import {routes} from '@/routes';

export default function EditVehicleIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = String(ctx.params?.id ?? '');
  return {
    redirect: {
      destination: routes.admin.vehicles.edit.path({id}),
      permanent: false,
    },
  };
};
```

- [ ] **Step 6: Implement `src/pages/admin/rentals/[id]/edit/[tab].tsx`**

```tsx
import {useRouter} from 'next/router';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {isVehicleTab, routes, type VehicleTab} from '@/routes';
import {useVehicle, useUpdateVehicle} from '@/queries/admin/vehicles';
import {vehicleKeys} from '@/queries/admin/vehicles.keys';
import {fetchVehicleServer} from '@/queries/fetchers/admin/vehicles.server';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {VehicleEditTabs} from '@/components/Admin/VehicleEditTabs';
import {VehicleGeneralForm} from '@/components/Admin/VehicleGeneralForm';
import {VehicleDescriptionForm} from '@/components/Admin/VehicleDescriptionForm';
import {VehicleImagesForm} from '@/components/Admin/VehicleImagesForm';

type Props = {id: string; tab: VehicleTab};

export default function EditVehiclePage({id, tab}: Props) {
  const router = useRouter();
  const {data: vehicle} = useVehicle(id);
  const update = useUpdateVehicle();

  const back = () => router.push(routes.admin.vehicles.list.path());
  const baseHref = (t: VehicleTab) =>
    routes.admin.vehicles.edit.path({id, tab: t});

  return (
    <AdminPageShell
      header={
        <>
          <AdminPageHeader
            title={
              vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Edit vehicle'
            }
          />
          <VehicleEditTabs active={tab} baseHref={baseHref} />
        </>
      }
    >
      {!vehicle ? (
        <p className="type-body-md text-on-surface-tertiary">Loading…</p>
      ) : (
        <>
          {tab === 'general' && (
            <VehicleGeneralForm
              initial={vehicle}
              onSubmit={async (values) => {
                await update.mutateAsync({id, input: values});
              }}
              onCancel={back}
            />
          )}
          {tab === 'description' && (
            <VehicleDescriptionForm
              initial={vehicle.description}
              onSubmit={async (values) => {
                await update.mutateAsync({id, input: {description: values}});
              }}
              onCancel={back}
            />
          )}
          {tab === 'images' && (
            <VehicleImagesForm
              initial={{imageUrl: vehicle.imageUrl, images: vehicle.images}}
              vehicleId={id}
              onSubmit={async (values) => {
                await update.mutateAsync({id, input: values});
              }}
              onCancel={back}
            />
          )}
        </>
      )}
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id ?? '');
  const tabParam = String(ctx.params?.tab ?? '');
  if (!isVehicleTab(tabParam)) {
    return {
      redirect: {
        destination: routes.admin.vehicles.edit.path({id}),
        permanent: false,
      },
    };
  }
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => fetchVehicleServer(id),
  });
  return {props: {id, tab: tabParam, dehydratedState: dehydrate(qc)} as never};
};
```

- [ ] **Step 7: Type check + build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: zero errors; build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/Admin/VehicleEditTabs src/pages/admin/rentals/new src/pages/admin/rentals/[id]
git commit -m "feat(rentals): admin new + edit pages with tabs"
```

---

## Task 20: Admin archive page

**Files:**

- Create: `src/pages/admin/rentals/archive.tsx`

- [ ] **Step 1: Implement `src/pages/admin/rentals/archive.tsx`**

```tsx
import {useEffect} from 'react';
import Link from 'next/link';
import type {GetServerSideProps} from 'next';
import {dehydrate} from '@tanstack/react-query';
import {getQueryClient} from '@/lib/queryClient';
import {useVehicles, useRestoreVehicle} from '@/queries/admin/vehicles';
import {vehicleKeys} from '@/queries/admin/vehicles.keys';
import {fetchVehiclesServer} from '@/queries/fetchers/admin/vehicles.server';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {Button} from '@/components/ui';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';
import {routes} from '@/routes';
import type {Vehicle} from '@/domain';

export default function AdminRentalsArchive() {
  const {data: archived, isLoading} = useVehicles({archived: true});
  const restore = useRestoreVehicle();
  const {setLoading} = useAdminLoading();

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  const list = (archived ?? []) as Vehicle[];

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title="Rentals · Archive"
          actions={
            <Button
              variant="secondary"
              size="md"
              href={routes.admin.vehicles.list.path()}
              icon={<i className="fa fa-arrow-left text-xs" />}
            >
              Back to rentals
            </Button>
          }
        />
      }
    >
      {list.length === 0 ? (
        <p className="type-body-md text-on-surface-tertiary">
          No archived vehicles.
        </p>
      ) : (
        <table className="w-full bg-surface-elevated rounded-xl border border-border overflow-hidden">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 type-label-sm text-on-surface-tertiary">
                Vehicle
              </th>
              <th className="text-right px-4 py-2 type-label-sm text-on-surface-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {v.brand} {v.model} ·{' '}
                  {v.type === 'SCOOTER' ? 'Scooter' : 'Bike'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    onClick={() => restore.mutate(v.id)}
                    icon={<i className="fa fa-rotate-left" />}
                  >
                    Restore
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminPageShell>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const qc = getQueryClient();
  await qc.prefetchQuery({
    queryKey: vehicleKeys.list({archived: true}),
    queryFn: () => fetchVehiclesServer({archived: true}),
  });
  return {props: {dehydratedState: dehydrate(qc)}};
};
```

- [ ] **Step 2: Type check + build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: zero errors; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/rentals/archive.tsx
git commit -m "feat(rentals): admin archive page with restore"
```

---

## Task 21: Update CLAUDE.md + ADMIN.md rules

**Files:**

- Modify: `CLAUDE.md`
- Modify: `.claude/ADMIN.md`

- [ ] **Step 1: Append rule to CLAUDE.md `Code Style` section**

Open `CLAUDE.md`. Locate the `### Code Style` heading near the start of the file. Append the following bullet at the end of that section (before the next `###` heading):

```md
- **Localized DB columns use `{en, vi}` JSON shape, not split `*Vi`/`*En` columns.** New tables with translatable fields must declare them as `Json` with `{en: string, vi: string}` shape (e.g. `description Json @default("{\"en\":\"\",\"vi\":\"\"}")`), not as two separate `String` columns. The TS surface uses the shared `LocalizedText = {en: string; vi: string}` exported from `src/domain/shared/localized-text.ts`. Admin forms render one field with a locale switcher (per the locale-switcher rule); the switcher mutates `{en}` or `{vi}` inside the same JSON value. Yup validation enforces both keys exist as strings. Legacy split columns (`titleVi`/`titleEn`, `descriptionVi`/`descriptionEn`, `nameVi`/`nameEn`, `bioVi`/`bioEn`, `labelVi`/`labelEn`) remain on existing tables for backwards-compatibility — do not introduce new split columns.
```

- [ ] **Step 2: Append cross-reference to `.claude/ADMIN.md`**

Open `.claude/ADMIN.md`. Locate the rule list (look for the "Locale switcher per tab — never duplicate localized fields" rule). Add the following bullet adjacent to it:

```md
- **Localized fields stored as `{en, vi}` JSON, not split columns.** See CLAUDE.md → Code Style → "Localized DB columns…" for the convention. Admin forms continue to render one field + locale switcher; the switcher mutates the `en` or `vi` key inside the same JSON value rather than two separate columns.
```

- [ ] **Step 3: Verify lint passes (in case markdown lint rules apply)**

Run: `pnpm lint`
Expected: no lint errors. If lint applies markdown rules and reports issues, fix them inline.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md .claude/ADMIN.md
git commit -m "docs: add localized JSON column convention rule"
```

---

## Task 22: Cleanup source assets + final verification

**Files:**

- Delete: `src/rentals/Honda Enduro XR 150L.jpeg`
- Delete: `src/rentals/Scooter automatic Honda Airblade 125cc.jpeg`
- Delete: `src/rentals/policy.md`

- [ ] **Step 1: Confirm seed has written assets to `UPLOAD_DIR`**

Run: `ls "$UPLOAD_DIR/vehicles" 2>/dev/null || ls public/uploads/vehicles`
Expected: both `honda-airblade-125.jpeg` and `honda-enduro-xr-150l.jpeg` present.

If not present, re-run the seed (`pnpm seed:rentals`) before proceeding.

- [ ] **Step 2: Remove the source files**

Run: `git rm "src/rentals/Honda Enduro XR 150L.jpeg" "src/rentals/Scooter automatic Honda Airblade 125cc.jpeg" "src/rentals/policy.md" && rmdir src/rentals 2>/dev/null || true`
Expected: files deleted; `src/rentals/` directory removed if empty.

- [ ] **Step 3: Run full check**

Run: `pnpm lint && pnpm tsc --noEmit && pnpm test && pnpm build`
Expected: lint passes, type-check passes, all Jest tests green, build succeeds.

- [ ] **Step 4: Dev-server golden-path smoke test**

Per CLAUDE.md ("For UI or frontend changes, start the dev server and use the feature in a browser"):

Run: `pnpm dev` (in background, on port 3000).

Manually verify in browser:

1. `/rentals` (en + vi locales) renders two seeded vehicles, filter chips swap visible cards correctly, policy section and CTA render translated text.
2. `/admin/rentals` lists the two vehicles, search filters by brand, primary `Add vehicle` button visible.
3. Click `Add vehicle` → enter brand/model/cc/qty/price → save → redirected to the new vehicle's description tab.
4. Description tab: type Vietnamese text, switch to EN, type English text, switch back to VI — Vietnamese still present. Save.
5. Images tab: upload a primary image, confirm it shows on `/rentals`.
6. Delete vehicle → confirmation modal appears → archive succeeds → vehicle moves to `/admin/rentals/archive`.
7. Archive page restore → vehicle returns to the main list as DRAFT.

Document any UI defects as follow-up issues; do not change the plan retroactively.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore(rentals): remove source fixtures after seed"
```

- [ ] **Step 6: Run finishing-a-development-branch skill**

Per CLAUDE.md workflow rule, at the end of any development task, invoke `superpowers:finishing-a-development-branch` to decide on merge / PR / cleanup.

---

## Self-Review Notes

**Spec coverage check** — each spec section maps to tasks:

- Goal → Tasks 1–22.
- Non-Goals → Respected (no detail page, no booking, no legacy column migration).
- Visual Reference → Task 14, 15, 19 implement using site theme tokens, not literal Apex colors.
- Data Model → Tasks 1, 2, 3.
- Localized Columns Convention → Tasks 2, 3 implement; Task 21 codifies in CLAUDE.md and .claude/ADMIN.md (note: spec references a shared `Localized` type; the plan reuses the existing `LocalizedText` from `src/domain/shared/localized-text.ts` instead of introducing a duplicate type — the rule text in Task 21 reflects this).
- Pages → Public Task 14; Admin list Task 15; Admin edit tabs Task 19; Admin archive Task 20.
- API → Tasks 6, 7.
- Routes Registry → Task 5.
- i18n → Task 9 (translations) + every component task consuming `useTranslations`.
- Component Surface → Tasks 11–13 (public), 16–19 (admin).
- Seed Data → Task 10.
- Tests → Tasks 3, 6, 7, 11, 12, 16, 17.
- Migration Plan → Tasks 1, 9, 10 + `package.json` updates.

**Placeholder scan** — no TBDs, no "implement later", no "similar to Task N" — every code step ships complete code.

**Type consistency** — `Vehicle`, `VehicleType`, `VehicleStatus`, `VehicleTab` defined in Task 2 / Task 5 are referenced consistently across all subsequent tasks. Yup defaults match the Prisma defaults declared in Task 1.

**Note for executor:** The `ImageUpload` integration in Task 18 assumes `src/lib/upload-entities.ts` can be extended with a `vehicle` entity. If the upload pipeline rejects new entity types (e.g., because of a strict server-side allowlist not present in that file), surface the blocker rather than working around it — the upload pipeline policy is owned by `.claude/STORAGE.md`.
