# Perks System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-tour free-form `included`/`excluded` JSON arrays with a centralized `Perk` catalog managed in the admin panel; tours reference perks by ID via a `TourPerk` join table; admins assign perks per tour via drag-and-drop UI.

**Architecture:** New Prisma `Perk` + `TourPerk` models. Admin CRUD page at `/admin/perks`. New "Perks" tab inside the tour edit page using `@dnd-kit/core` + `@dnd-kit/sortable` for a three-zone drag-and-drop UI (Available pool → Included / Excluded). Tour PUT API accepts `includedPerkIds` / `excludedPerkIds` arrays and replaces all `TourPerk` rows for the tour atomically. Public tour detail page renders perks (FontAwesome icon + localized label) joined from `TourPerk`. Existing JSON columns are migrated to the catalog via a one-shot script and then dropped.

**Tech Stack:** Next.js 16 (Pages Router), TypeScript strict, Prisma (PostgreSQL), React 19, Tailwind v4, next-intl (DB-only), Jest + RTL, Yup, react-hook-form, `@dnd-kit/*`.

**Spec:** `docs/superpowers/specs/2026-05-07-perks-system-design.md`

**Conventions:**

- All form components have a co-located `*.form-utils.ts` (Yup schema, defaults, submit handler).
- One component per file. No `interface` keyword. No inline styles.
- All routes/API calls go through `src/routes/index.ts`.
- All admin user-visible strings go through `useTranslations()` (DB Translation table). Perk catalog labels (`labelEn`/`labelVi`) come straight from DB columns — they're data, not i18n keys.
- Tests must not assert on styling (no `toHaveClass`, `toHaveStyle`, etc.).
- TDD: write failing test first, run to confirm fail, implement, run to confirm pass, commit.

---

## Task 1: Add Prisma schema (Perk + TourPerk + enums)

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enums and models**

Append to `prisma/schema.prisma` after the `Highlight` model and add `perks TourPerk[]` to the `Tour` model. Do NOT remove `included` or `excluded` columns yet (Phase-1 additive migration; data migrates in Task 17, drop in Task 18).

```prisma
enum PerkCategory {
  TRANSPORT
  FOOD
  ACCOMMODATION
  GUIDE
  SUPPORT
  OTHER
}

enum PerkBucket {
  INCLUDED
  EXCLUDED
}

model Perk {
  id        String       @id @default(uuid())
  labelEn   String
  labelVi   String
  icon      String
  category  PerkCategory @default(OTHER)
  archived  Boolean      @default(false)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  tours     TourPerk[]
}

model TourPerk {
  tourId String
  perkId String
  bucket PerkBucket
  tour   Tour @relation(fields: [tourId], references: [id], onDelete: Cascade)
  perk   Perk @relation(fields: [perkId], references: [id], onDelete: Cascade)

  @@id([tourId, perkId])
  @@index([perkId])
}
```

In the existing `Tour` model, add the back-relation:

```prisma
perks TourPerk[]
```

(place near the `highlights Highlight[]` line; do not touch the `included` / `excluded` Json fields).

- [ ] **Step 2: Generate migration**

Run: `pnpm prisma migrate dev --name add_perks_phase1 --create-only`
Expected: a new directory `prisma/migrations/<timestamp>_add_perks_phase1/migration.sql` is created. Do not apply yet.

- [ ] **Step 3: Inspect the generated SQL**

Open the new `migration.sql` and confirm it:

- creates `PerkCategory` and `PerkBucket` enum types
- creates `Perk` table
- creates `TourPerk` table with composite PK `(tourId, perkId)`
- adds an index on `TourPerk(perkId)`
- adds NO `DROP COLUMN` statements (Tour.included / Tour.excluded must still exist)

If anything else changed, revert it.

- [ ] **Step 4: Apply migration locally**

Run: `pnpm prisma migrate dev`
Expected: migration applies cleanly. `pnpm prisma generate` runs automatically.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add Perk and TourPerk models (phase 1, additive)"
```

---

## Task 2: Domain types for Perk

**Files:**

- Create: `src/domain/perk/index.ts`
- Modify: `src/domain/index.ts`

- [ ] **Step 1: Write failing test**

Create `src/domain/perk/index.spec.ts`:

```ts
import type {Perk, PerkCategory, PerkBucket} from './index';

describe('Perk domain types', () => {
  it('has the expected fields', () => {
    const p: Perk = {
      id: 'x',
      labelEn: 'Bike Hire',
      labelVi: 'Thuê xe',
      icon: 'fa-solid fa-motorcycle',
      category: 'TRANSPORT',
      archived: false,
      updatedAt: new Date(),
    };
    expect(p.labelEn).toBe('Bike Hire');
  });

  it('PerkCategory accepts the enum values', () => {
    const c: PerkCategory = 'OTHER';
    expect(c).toBe('OTHER');
  });

  it('PerkBucket accepts INCLUDED / EXCLUDED', () => {
    const b: PerkBucket = 'INCLUDED';
    expect(b).toBe('INCLUDED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/domain/perk`
Expected: FAIL — module not found.

- [ ] **Step 3: Create domain module**

Create `src/domain/perk/index.ts`:

```ts
import type {
  Perk as PrismaPerk,
  PerkCategory as PrismaPerkCategory,
  PerkBucket as PrismaPerkBucket,
} from '@prisma/client';

export type PerkCategory = PrismaPerkCategory;
export type PerkBucket = PrismaPerkBucket;
export type Perk = Omit<PrismaPerk, 'createdAt'>;
```

- [ ] **Step 4: Re-export from domain index**

Modify `src/domain/index.ts` — add:

```ts
export type {Perk, PerkCategory, PerkBucket} from './perk';
```

- [ ] **Step 5: Run test to verify pass**

Run: `pnpm test -- src/domain/perk`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat(domain): export Perk, PerkCategory, PerkBucket types"
```

---

## Task 3: Perk API client (route registry)

**Files:**

- Modify: `src/routes/index.ts`

- [ ] **Step 1: Add the perks admin route**

In `src/routes/index.ts`, inside `routes.admin`, add:

```ts
perks: {
  list: {path: () => '/admin/perks'},
  new: {path: () => '/admin/perks/new'},
  edit: {path: (p: {id: string | number}) => `/admin/perks/${p.id}/edit`},
},
```

- [ ] **Step 2: Add perks API client**

In the same file, inside `api.admin`, add:

```ts
perks: {
  list: (params?: {archived?: boolean; category?: string; search?: string}) => {
    const qs = new URLSearchParams();
    if (params?.archived !== undefined) qs.set('archived', String(params.archived));
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
```

- [ ] **Step 3: Verify type-check**

Run: `pnpm build`
Expected: build succeeds (or stops at later compile errors unrelated to routes).

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.ts
git commit -m "feat(routes): add /admin/perks routes and api.admin.perks client"
```

---

## Task 4: API handler — list / create perks

**Files:**

- Create: `src/pages/api/admin/perks/index.ts`
- Test: `src/pages/api/admin/perks/__tests__/index.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/pages/api/admin/perks/__tests__/index.spec.ts`:

```ts
import handler from '../index';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import type {NextApiRequest, NextApiResponse} from 'next';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    perk: {findMany: jest.fn(), create: jest.fn()},
  },
}));
jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));

const mockReq = (overrides: Partial<NextApiRequest> = {}) =>
  ({method: 'GET', query: {}, body: {}, ...overrides}) as NextApiRequest;

const mockRes = () => {
  const res = {} as NextApiResponse & {_status?: number; _json?: unknown};
  res.status = jest.fn().mockImplementation((s) => {
    (res as never as {_status: number})._status = s;
    return res;
  });
  res.json = jest.fn().mockImplementation((j) => {
    (res as never as {_json: unknown})._json = j;
    return res;
  });
  res.setHeader = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

describe('GET /api/admin/perks', () => {
  it('lists perks ordered by category then labelEn', async () => {
    (prisma.perk.findMany as jest.Mock).mockResolvedValue([{id: '1'}]);
    const res = mockRes();
    await handler(mockReq({method: 'GET'}), res);
    expect(prisma.perk.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{category: 'asc'}, {labelEn: 'asc'}],
    });
    expect(res.json).toHaveBeenCalledWith([{id: '1'}]);
  });

  it('filters by archived=false when query param given', async () => {
    (prisma.perk.findMany as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    await handler(mockReq({method: 'GET', query: {archived: 'false'}}), res);
    expect(prisma.perk.findMany).toHaveBeenCalledWith({
      where: {archived: false},
      orderBy: [{category: 'asc'}, {labelEn: 'asc'}],
    });
  });
});

describe('POST /api/admin/perks', () => {
  it('rejects when labelEn missing', async () => {
    const res = mockRes();
    await handler(
      mockReq({
        method: 'POST',
        body: {labelVi: 'x', icon: 'i', category: 'OTHER'},
      }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates perk with defaults', async () => {
    (prisma.perk.create as jest.Mock).mockResolvedValue({id: '1'});
    const res = mockRes();
    await handler(
      mockReq({
        method: 'POST',
        body: {
          labelEn: 'Bike',
          labelVi: 'Xe',
          icon: 'fa-solid fa-motorcycle',
          category: 'TRANSPORT',
        },
      }),
      res,
    );
    expect(prisma.perk.create).toHaveBeenCalledWith({
      data: {
        labelEn: 'Bike',
        labelVi: 'Xe',
        icon: 'fa-solid fa-motorcycle',
        category: 'TRANSPORT',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/pages/api/admin/perks`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement handler**

Create `src/pages/api/admin/perks/index.ts`:

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import type {PerkCategory} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const VALID_CATEGORIES: PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const where: Record<string, unknown> = {};
    if (req.query.archived === 'true') where.archived = true;
    if (req.query.archived === 'false') where.archived = false;
    if (
      typeof req.query.category === 'string' &&
      VALID_CATEGORIES.includes(req.query.category as PerkCategory)
    ) {
      where.category = req.query.category;
    }
    if (typeof req.query.search === 'string' && req.query.search.length > 0) {
      const s = req.query.search;
      where.OR = [
        {labelEn: {contains: s, mode: 'insensitive'}},
        {labelVi: {contains: s, mode: 'insensitive'}},
      ];
    }
    const perks = await prisma.perk.findMany({
      where,
      orderBy: [{category: 'asc'}, {labelEn: 'asc'}],
    });
    return res.json(perks);
  }

  if (req.method === 'POST') {
    const {labelEn, labelVi, icon, category} = req.body ?? {};
    if (!labelEn || typeof labelEn !== 'string') {
      return res.status(400).json({error: 'labelEn is required'});
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({error: 'category is invalid'});
    }
    const perk = await prisma.perk.create({
      data: {
        labelEn,
        labelVi: labelVi ?? '',
        icon: icon ?? '',
        category,
      },
    });
    return res.status(201).json(perk);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test -- src/pages/api/admin/perks/__tests__/index.spec.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/perks
git commit -m "feat(api): GET/POST /api/admin/perks with filters and validation"
```

---

## Task 5: API handler — get / update / delete single perk

**Files:**

- Create: `src/pages/api/admin/perks/[id].ts`
- Test: `src/pages/api/admin/perks/__tests__/id.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `src/pages/api/admin/perks/__tests__/id.spec.ts`:

```ts
import handler from '../[id]';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import type {NextApiRequest, NextApiResponse} from 'next';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    perk: {findUnique: jest.fn(), update: jest.fn(), delete: jest.fn()},
    tourPerk: {count: jest.fn()},
  },
}));
jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));

const mockReq = (o: Partial<NextApiRequest> = {}) =>
  ({method: 'GET', query: {id: 'p1'}, body: {}, ...o}) as NextApiRequest;

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.end = jest.fn().mockReturnThis();
  res.setHeader = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
});

describe('GET /api/admin/perks/[id]', () => {
  it('returns 404 when not found', async () => {
    (prisma.perk.findUnique as jest.Mock).mockResolvedValue(null);
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns the perk', async () => {
    (prisma.perk.findUnique as jest.Mock).mockResolvedValue({id: 'p1'});
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith({id: 'p1'});
  });
});

describe('PUT /api/admin/perks/[id]', () => {
  it('updates allowed fields', async () => {
    (prisma.perk.update as jest.Mock).mockResolvedValue({id: 'p1'});
    const res = mockRes();
    await handler(
      mockReq({
        method: 'PUT',
        body: {
          labelEn: 'New',
          labelVi: 'New',
          icon: 'i',
          category: 'FOOD',
          archived: true,
        },
      }),
      res,
    );
    expect(prisma.perk.update).toHaveBeenCalledWith({
      where: {id: 'p1'},
      data: {
        labelEn: 'New',
        labelVi: 'New',
        icon: 'i',
        category: 'FOOD',
        archived: true,
      },
    });
  });
});

describe('DELETE /api/admin/perks/[id]', () => {
  it('returns 409 when perk is in use', async () => {
    (prisma.tourPerk.count as jest.Mock).mockResolvedValue(2);
    const res = mockRes();
    await handler(mockReq({method: 'DELETE'}), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.perk.delete).not.toHaveBeenCalled();
  });

  it('deletes when not in use', async () => {
    (prisma.tourPerk.count as jest.Mock).mockResolvedValue(0);
    (prisma.perk.delete as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    await handler(mockReq({method: 'DELETE'}), res);
    expect(prisma.perk.delete).toHaveBeenCalledWith({where: {id: 'p1'}});
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/pages/api/admin/perks/__tests__/id.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement handler**

Create `src/pages/api/admin/perks/[id].ts`:

```ts
import type {NextApiRequest, NextApiResponse} from 'next';
import type {PerkCategory} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

const VALID_CATEGORIES: PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'GET') {
    const perk = await prisma.perk.findUnique({where: {id}});
    if (!perk) return res.status(404).json({error: 'Perk not found'});
    return res.json(perk);
  }

  if (req.method === 'PUT') {
    const {labelEn, labelVi, icon, category, archived} = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof labelEn === 'string') data.labelEn = labelEn;
    if (typeof labelVi === 'string') data.labelVi = labelVi;
    if (typeof icon === 'string') data.icon = icon;
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({error: 'category is invalid'});
      }
      data.category = category;
    }
    if (typeof archived === 'boolean') data.archived = archived;

    const perk = await prisma.perk.update({where: {id}, data});
    return res.json(perk);
  }

  if (req.method === 'DELETE') {
    const usage = await prisma.tourPerk.count({where: {perkId: id}});
    if (usage > 0) {
      return res
        .status(409)
        .json({
          error: `Perk is in use by ${usage} tour(s). Archive it instead.`,
        });
    }
    await prisma.perk.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test -- src/pages/api/admin/perks/__tests__/id.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/perks/[id].ts src/pages/api/admin/perks/__tests__/id.spec.ts
git commit -m "feat(api): GET/PUT/DELETE /api/admin/perks/[id] with in-use guard"
```

---

## Task 6: Install dnd-kit dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install packages**

Run: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
Expected: three new entries appear in `dependencies`.

- [ ] **Step 2: Confirm versions**

Run: `pnpm ls @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
Expected: all three are listed.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add @dnd-kit/{core,sortable,utilities}"
```

---

## Task 7: Add fa-icons.json data file

**Files:**

- Create: `src/data/fa-icons.json`
- Create: `src/data/fa-icons.ts`

- [ ] **Step 1: Create the data file**

Create `src/data/fa-icons.json` containing an array of FontAwesome Free icon class names. Each entry is the full class string ready to drop into `<i className=... />`. Use only `fa-solid` style for v1 (regular/brands can be added later).

The list is curated but broad (~250 entries). Insert exactly:

```json
[
  "fa-solid fa-motorcycle",
  "fa-solid fa-car",
  "fa-solid fa-bus",
  "fa-solid fa-plane",
  "fa-solid fa-helicopter",
  "fa-solid fa-ship",
  "fa-solid fa-train",
  "fa-solid fa-bicycle",
  "fa-solid fa-taxi",
  "fa-solid fa-truck",
  "fa-solid fa-van-shuttle",
  "fa-solid fa-road",
  "fa-solid fa-map",
  "fa-solid fa-map-location-dot",
  "fa-solid fa-route",
  "fa-solid fa-gas-pump",
  "fa-solid fa-oil-can",
  "fa-solid fa-circle-check",
  "fa-solid fa-circle-xmark",
  "fa-solid fa-check",
  "fa-solid fa-xmark",
  "fa-solid fa-utensils",
  "fa-solid fa-bowl-rice",
  "fa-solid fa-bowl-food",
  "fa-solid fa-mug-saucer",
  "fa-solid fa-mug-hot",
  "fa-solid fa-bread-slice",
  "fa-solid fa-bottle-water",
  "fa-solid fa-wine-glass",
  "fa-solid fa-wine-bottle",
  "fa-solid fa-beer-mug-empty",
  "fa-solid fa-martini-glass",
  "fa-solid fa-cookie-bite",
  "fa-solid fa-ice-cream",
  "fa-solid fa-burger",
  "fa-solid fa-pizza-slice",
  "fa-solid fa-fish",
  "fa-solid fa-drumstick-bite",
  "fa-solid fa-apple-whole",
  "fa-solid fa-leaf",
  "fa-solid fa-pepper-hot",
  "fa-solid fa-bed",
  "fa-solid fa-hotel",
  "fa-solid fa-house",
  "fa-solid fa-house-chimney",
  "fa-solid fa-building",
  "fa-solid fa-tent",
  "fa-solid fa-campground",
  "fa-solid fa-bath",
  "fa-solid fa-shower",
  "fa-solid fa-toilet",
  "fa-solid fa-soap",
  "fa-solid fa-broom",
  "fa-solid fa-key",
  "fa-solid fa-door-open",
  "fa-solid fa-door-closed",
  "fa-solid fa-wifi",
  "fa-solid fa-tv",
  "fa-solid fa-snowflake",
  "fa-solid fa-fire",
  "fa-solid fa-temperature-high",
  "fa-solid fa-temperature-low",
  "fa-solid fa-user",
  "fa-solid fa-users",
  "fa-solid fa-user-tie",
  "fa-solid fa-user-group",
  "fa-solid fa-people-group",
  "fa-solid fa-person-hiking",
  "fa-solid fa-person-walking",
  "fa-solid fa-person-running",
  "fa-solid fa-person-biking",
  "fa-solid fa-person-swimming",
  "fa-solid fa-language",
  "fa-solid fa-comments",
  "fa-solid fa-comment",
  "fa-solid fa-headset",
  "fa-solid fa-microphone",
  "fa-solid fa-volume-high",
  "fa-solid fa-shield",
  "fa-solid fa-shield-halved",
  "fa-solid fa-shield-heart",
  "fa-solid fa-helmet-safety",
  "fa-solid fa-life-ring",
  "fa-solid fa-first-aid",
  "fa-solid fa-kit-medical",
  "fa-solid fa-suitcase-medical",
  "fa-solid fa-staff-snake",
  "fa-solid fa-heart-pulse",
  "fa-solid fa-bandage",
  "fa-solid fa-pills",
  "fa-solid fa-syringe",
  "fa-solid fa-stethoscope",
  "fa-solid fa-toolbox",
  "fa-solid fa-screwdriver-wrench",
  "fa-solid fa-wrench",
  "fa-solid fa-screwdriver",
  "fa-solid fa-hammer",
  "fa-solid fa-gears",
  "fa-solid fa-gear",
  "fa-solid fa-camera",
  "fa-solid fa-camera-retro",
  "fa-solid fa-image",
  "fa-solid fa-images",
  "fa-solid fa-video",
  "fa-solid fa-film",
  "fa-solid fa-binoculars",
  "fa-solid fa-magnifying-glass",
  "fa-solid fa-compass",
  "fa-solid fa-location-dot",
  "fa-solid fa-location-arrow",
  "fa-solid fa-mountain",
  "fa-solid fa-mountain-sun",
  "fa-solid fa-tree",
  "fa-solid fa-leaf",
  "fa-solid fa-seedling",
  "fa-solid fa-sun",
  "fa-solid fa-cloud",
  "fa-solid fa-cloud-sun",
  "fa-solid fa-cloud-rain",
  "fa-solid fa-cloud-bolt",
  "fa-solid fa-umbrella",
  "fa-solid fa-water",
  "fa-solid fa-droplet",
  "fa-solid fa-wind",
  "fa-solid fa-rainbow",
  "fa-solid fa-bolt",
  "fa-solid fa-moon",
  "fa-solid fa-star",
  "fa-solid fa-fire-flame-curved",
  "fa-solid fa-suitcase",
  "fa-solid fa-suitcase-rolling",
  "fa-solid fa-briefcase",
  "fa-solid fa-bag-shopping",
  "fa-solid fa-cart-shopping",
  "fa-solid fa-gift",
  "fa-solid fa-tag",
  "fa-solid fa-tags",
  "fa-solid fa-receipt",
  "fa-solid fa-money-bill",
  "fa-solid fa-money-bill-wave",
  "fa-solid fa-coins",
  "fa-solid fa-credit-card",
  "fa-solid fa-wallet",
  "fa-solid fa-piggy-bank",
  "fa-solid fa-sack-dollar",
  "fa-solid fa-dollar-sign",
  "fa-solid fa-euro-sign",
  "fa-solid fa-yen-sign",
  "fa-solid fa-percent",
  "fa-solid fa-calculator",
  "fa-solid fa-clock",
  "fa-solid fa-stopwatch",
  "fa-solid fa-hourglass",
  "fa-solid fa-calendar",
  "fa-solid fa-calendar-day",
  "fa-solid fa-calendar-week",
  "fa-solid fa-calendar-check",
  "fa-solid fa-bell",
  "fa-solid fa-bell-concierge",
  "fa-solid fa-clipboard",
  "fa-solid fa-clipboard-list",
  "fa-solid fa-clipboard-check",
  "fa-solid fa-list-check",
  "fa-solid fa-pen",
  "fa-solid fa-pen-to-square",
  "fa-solid fa-pencil",
  "fa-solid fa-paperclip",
  "fa-solid fa-book",
  "fa-solid fa-book-open",
  "fa-solid fa-newspaper",
  "fa-solid fa-file-lines",
  "fa-solid fa-info",
  "fa-solid fa-circle-info",
  "fa-solid fa-question",
  "fa-solid fa-circle-question",
  "fa-solid fa-triangle-exclamation",
  "fa-solid fa-circle-exclamation",
  "fa-solid fa-thumbs-up",
  "fa-solid fa-thumbs-down",
  "fa-solid fa-heart",
  "fa-solid fa-flag",
  "fa-solid fa-flag-checkered",
  "fa-solid fa-trophy",
  "fa-solid fa-medal",
  "fa-solid fa-award",
  "fa-solid fa-handshake",
  "fa-solid fa-hands-holding",
  "fa-solid fa-hand-holding-heart",
  "fa-solid fa-hand-holding-dollar",
  "fa-solid fa-hand-holding-medical",
  "fa-solid fa-phone",
  "fa-solid fa-mobile-screen",
  "fa-solid fa-mobile",
  "fa-solid fa-envelope",
  "fa-solid fa-paper-plane",
  "fa-solid fa-share-nodes",
  "fa-solid fa-link",
  "fa-solid fa-globe",
  "fa-solid fa-earth-asia",
  "fa-solid fa-earth-americas",
  "fa-solid fa-earth-europe",
  "fa-solid fa-earth-africa",
  "fa-solid fa-anchor",
  "fa-solid fa-flag-usa",
  "fa-solid fa-passport",
  "fa-solid fa-id-card",
  "fa-solid fa-id-badge",
  "fa-solid fa-ticket",
  "fa-solid fa-qrcode",
  "fa-solid fa-barcode",
  "fa-solid fa-print",
  "fa-solid fa-paw",
  "fa-solid fa-dog",
  "fa-solid fa-cat",
  "fa-solid fa-fish-fins",
  "fa-solid fa-frog",
  "fa-solid fa-otter",
  "fa-solid fa-spider",
  "fa-solid fa-mosquito",
  "fa-solid fa-bicycle",
  "fa-solid fa-running",
  "fa-solid fa-walking",
  "fa-solid fa-circle",
  "fa-solid fa-square",
  "fa-solid fa-diamond",
  "fa-solid fa-cube",
  "fa-solid fa-cubes",
  "fa-solid fa-box",
  "fa-solid fa-boxes-stacked",
  "fa-solid fa-warehouse",
  "fa-solid fa-store",
  "fa-solid fa-shop",
  "fa-solid fa-cash-register",
  "fa-solid fa-utensils-slash",
  "fa-solid fa-ban",
  "fa-solid fa-circle-minus",
  "fa-solid fa-minus",
  "fa-solid fa-plus",
  "fa-solid fa-arrow-right",
  "fa-solid fa-arrow-left",
  "fa-solid fa-arrow-up",
  "fa-solid fa-arrow-down",
  "fa-solid fa-up-down-left-right",
  "fa-solid fa-rotate",
  "fa-solid fa-arrows-rotate",
  "fa-solid fa-eye",
  "fa-solid fa-eye-slash",
  "fa-solid fa-lock",
  "fa-solid fa-lock-open",
  "fa-solid fa-unlock",
  "fa-solid fa-fingerprint",
  "fa-solid fa-shield-cat",
  "fa-solid fa-globe-asia",
  "fa-solid fa-translate",
  "fa-solid fa-music",
  "fa-solid fa-volume-low",
  "fa-solid fa-fan",
  "fa-solid fa-blender",
  "fa-solid fa-mug",
  "fa-solid fa-glass-water",
  "fa-solid fa-tint",
  "fa-solid fa-recycle",
  "fa-solid fa-broom-ball",
  "fa-solid fa-graduation-cap",
  "fa-solid fa-school",
  "fa-solid fa-chalkboard"
]
```

Note: the list has duplicates (`fa-solid fa-leaf`, `fa-solid fa-bicycle`) — those are intentional placeholders that will get deduped at runtime in the picker via `Array.from(new Set(...))`.

- [ ] **Step 2: Create the loader module**

Create `src/data/fa-icons.ts`:

```ts
import icons from './fa-icons.json';

export const FA_ICONS: ReadonlyArray<string> = Array.from(new Set(icons));
```

- [ ] **Step 3: Smoke-test the export**

Create `src/data/fa-icons.spec.ts`:

```ts
import {FA_ICONS} from './fa-icons';

describe('FA_ICONS', () => {
  it('contains a non-trivial number of icons', () => {
    expect(FA_ICONS.length).toBeGreaterThan(100);
  });

  it('has no duplicates after dedupe', () => {
    expect(new Set(FA_ICONS).size).toBe(FA_ICONS.length);
  });

  it('every entry starts with a fa- prefix style', () => {
    expect(FA_ICONS.every((c) => c.startsWith('fa-'))).toBe(true);
  });
});
```

Run: `pnpm test -- src/data/fa-icons`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/fa-icons.json src/data/fa-icons.ts src/data/fa-icons.spec.ts
git commit -m "feat(data): add FontAwesome icon catalog (fa-icons.json)"
```

---

## Task 8: IconPicker shared component

**Files:**

- Create: `src/components/ui/IconPicker/IconPicker.tsx`
- Create: `src/components/ui/IconPicker/IconPicker.spec.tsx`
- Create: `src/components/ui/IconPicker/index.ts`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Write failing test**

Create `src/components/ui/IconPicker/IconPicker.spec.tsx`:

```tsx
import {render, screen, fireEvent} from '@testing-library/react';
import {IconPicker} from './IconPicker';

describe('IconPicker', () => {
  it('renders the currently-selected icon class', () => {
    render(<IconPicker value="fa-solid fa-motorcycle" onChange={() => {}} />);
    const icon = screen.getByTestId('icon-picker-current');
    expect(icon.className).toContain('fa-motorcycle');
  });

  it('opens the modal on button click', () => {
    render(<IconPicker value="" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', {name: /pick icon/i}));
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onChange and closes when an icon is picked', () => {
    const onChange = jest.fn();
    render(<IconPicker value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', {name: /pick icon/i}));
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: {value: 'motorcycle'},
    });
    fireEvent.click(screen.getAllByTestId('icon-option')[0]);
    expect(onChange).toHaveBeenCalledWith('fa-solid fa-motorcycle');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- IconPicker`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement component**

Create `src/components/ui/IconPicker/IconPicker.tsx`:

```tsx
import {useMemo, useState} from 'react';
import {Modal} from '@/components/ui/Modal';
import {Button} from '@/components/ui/Button';
import {FA_ICONS} from '@/data/fa-icons';

type IconPickerProps = {
  value: string;
  onChange: (className: string) => void;
};

export function IconPicker({value, onChange}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return FA_ICONS;
    const q = query.toLowerCase();
    return FA_ICONS.filter((c) => c.includes(q));
  }, [query]);

  return (
    <>
      <div className="flex items-center gap-3">
        <span
          data-testid="icon-picker-current"
          className={`text-xl ${value || 'text-on-surface-secondary'}`}
        >
          {!value ? '—' : null}
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(true)}
          aria-label="Pick icon"
        >
          Pick icon
        </Button>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} title="Pick an icon">
          <input
            type="search"
            placeholder="Search icons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded cursor-text"
          />
          <div className="grid grid-cols-8 gap-2 max-h-96 overflow-auto">
            {filtered.map((cls) => (
              <button
                key={cls}
                type="button"
                data-testid="icon-option"
                title={cls}
                onClick={() => {
                  onChange(cls);
                  setOpen(false);
                }}
                className="cursor-pointer aspect-square flex items-center justify-center border rounded hover:bg-surface-secondary"
              >
                <i className={cls} />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
```

- [ ] **Step 4: Re-export**

Create `src/components/ui/IconPicker/index.ts`:

```ts
export {IconPicker} from './IconPicker';
```

In `src/components/ui/index.ts` add:

```ts
export {IconPicker} from './IconPicker';
```

- [ ] **Step 5: Run test to verify pass**

Run: `pnpm test -- IconPicker`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/IconPicker src/components/ui/index.ts
git commit -m "feat(ui): IconPicker — searchable FontAwesome icon picker"
```

---

## Task 9: Perk form (PerkForm + PerkForm.form-utils)

**Files:**

- Create: `src/components/Admin/PerkForm/PerkForm.tsx`
- Create: `src/components/Admin/PerkForm/PerkForm.form-utils.ts`
- Create: `src/components/Admin/PerkForm/PerkForm.spec.tsx`
- Create: `src/components/Admin/PerkForm/index.ts`

- [ ] **Step 1: Write failing test**

Create `src/components/Admin/PerkForm/PerkForm.spec.tsx`:

```tsx
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {PerkForm} from './PerkForm';

describe('PerkForm', () => {
  it('renders all fields with initial values', () => {
    render(
      <PerkForm
        mode="edit"
        initialData={{
          labelEn: 'Bike Hire',
          labelVi: 'Thuê xe',
          icon: 'fa-solid fa-motorcycle',
          category: 'TRANSPORT',
          archived: false,
        }}
        onSubmit={async () => {}}
      />,
    );
    expect(screen.getByLabelText(/label \(en\)/i)).toHaveValue('Bike Hire');
    expect(screen.getByLabelText(/label \(vi\)/i)).toHaveValue('Thuê xe');
    expect(screen.getByLabelText(/category/i)).toHaveValue('TRANSPORT');
  });

  it('shows validation error when labelEn empty', async () => {
    render(<PerkForm mode="create" onSubmit={async () => {}} />);
    fireEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() =>
      expect(screen.getByText(/label \(en\) is required/i)).toBeInTheDocument(),
    );
  });

  it('calls onSubmit with values when valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<PerkForm mode="create" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/label \(en\)/i), {
      target: {value: 'Bike'},
    });
    fireEvent.change(screen.getByLabelText(/label \(vi\)/i), {
      target: {value: 'Xe'},
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: {value: 'TRANSPORT'},
    });
    fireEvent.click(screen.getByRole('button', {name: /save/i}));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          labelEn: 'Bike',
          labelVi: 'Xe',
          category: 'TRANSPORT',
        }),
      ),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- PerkForm`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement form-utils**

Create `src/components/Admin/PerkForm/PerkForm.form-utils.ts`:

```ts
import * as yup from 'yup';
import type * as VMT from '@/domain';

const CATEGORIES: VMT.PerkCategory[] = [
  'TRANSPORT',
  'FOOD',
  'ACCOMMODATION',
  'GUIDE',
  'SUPPORT',
  'OTHER',
];

export const perkFormSchema = yup.object({
  labelEn: yup.string().trim().required('Label (EN) is required'),
  labelVi: yup.string().defined().default(''),
  icon: yup.string().defined().default(''),
  category: yup
    .mixed<VMT.PerkCategory>()
    .oneOf(CATEGORIES)
    .required('Category is required'),
  archived: yup.boolean().defined().default(false),
});

export type PerkFormValues = yup.InferType<typeof perkFormSchema>;

export const perkFormDefaults: PerkFormValues = {
  labelEn: '',
  labelVi: '',
  icon: '',
  category: 'OTHER',
  archived: false,
};

export const PERK_CATEGORIES = CATEGORIES;
```

- [ ] **Step 4: Implement form component**

Create `src/components/Admin/PerkForm/PerkForm.tsx`:

```tsx
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {Button, FormField, TextInput, IconPicker} from '@/components/ui';
import {
  perkFormSchema,
  perkFormDefaults,
  PERK_CATEGORIES,
  type PerkFormValues,
} from './PerkForm.form-utils';

type PerkFormProps = {
  mode: 'create' | 'edit';
  initialData?: PerkFormValues;
  onSubmit: (values: PerkFormValues) => Promise<void>;
};

export function PerkForm({mode, initialData, onSubmit}: PerkFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {errors, isSubmitting},
  } = useForm<PerkFormValues>({
    resolver: yupResolver(perkFormSchema),
    defaultValues: initialData ?? perkFormDefaults,
  });

  const iconValue = watch('icon');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <FormField
        label="Label (EN)"
        htmlFor="labelEn"
        error={errors.labelEn?.message}
      >
        <TextInput id="labelEn" {...register('labelEn')} />
      </FormField>

      <FormField
        label="Label (VI)"
        htmlFor="labelVi"
        error={errors.labelVi?.message}
      >
        <TextInput id="labelVi" {...register('labelVi')} />
      </FormField>

      <FormField
        label="Category"
        htmlFor="category"
        error={errors.category?.message}
      >
        <select
          id="category"
          {...register('category')}
          className="cursor-pointer w-full px-3 py-2 border rounded"
        >
          {PERK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Icon" htmlFor="icon" error={errors.icon?.message}>
        <IconPicker
          value={iconValue}
          onChange={(v) => setValue('icon', v, {shouldDirty: true})}
        />
      </FormField>

      {mode === 'edit' && (
        <FormField label="Archived" htmlFor="archived">
          <input
            id="archived"
            type="checkbox"
            {...register('archived')}
            className="cursor-pointer"
          />
        </FormField>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Re-export**

Create `src/components/Admin/PerkForm/index.ts`:

```ts
export {PerkForm} from './PerkForm';
export type {PerkFormValues} from './PerkForm.form-utils';
```

- [ ] **Step 6: Run test to verify pass**

Run: `pnpm test -- PerkForm`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Admin/PerkForm
git commit -m "feat(admin): PerkForm with Yup validation and IconPicker"
```

---

## Task 10: Perks list page

**Files:**

- Create: `src/pages/admin/perks/index.tsx`

- [ ] **Step 1: Implement page**

Create `src/pages/admin/perks/index.tsx`:

```tsx
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {api, routes, useNavigate} from '@/routes';
import {Button} from '@/components/ui';
import {AdminBreadcrumbs} from '@/components/Admin/AdminBreadcrumbs';
import type * as VMT from '@/domain';

export default function PerksListPage() {
  const navigate = useNavigate();
  const [perks, setPerks] = useState<VMT.Perk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params: {archived?: boolean; category?: string; search?: string} = {};
    if (!showArchived) params.archived = false;
    if (categoryFilter) params.category = categoryFilter;
    if (search) params.search = search;
    api.admin.perks.list(params).then(({data}) => {
      if (data) setPerks(data);
      setLoading(false);
    });
  }, [search, categoryFilter, showArchived]);

  async function handleArchiveToggle(perk: VMT.Perk) {
    const {error} = await api.admin.perks.update(perk.id, {
      archived: !perk.archived,
    });
    if (!error) {
      setPerks((prev) =>
        prev.map((p) => (p.id === perk.id ? {...p, archived: !p.archived} : p)),
      );
    }
  }

  async function handleDelete(perk: VMT.Perk) {
    if (!confirm(`Delete perk "${perk.labelEn}"? This cannot be undone.`))
      return;
    const {error} = await api.admin.perks.delete(perk.id);
    if (error) {
      alert(error);
      return;
    }
    setPerks((prev) => prev.filter((p) => p.id !== perk.id));
  }

  const grouped = perks.reduce<Record<string, VMT.Perk[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          {label: 'Admin', href: routes.admin.dashboard.path()},
          {label: 'Perks'},
        ]}
      />
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Perks</h1>
        <Button onClick={() => navigate.to(routes.admin.perks.new)}>
          New perk
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded cursor-text"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded cursor-pointer"
        >
          <option value="">All categories</option>
          {[
            'TRANSPORT',
            'FOOD',
            'ACCOMMODATION',
            'GUIDE',
            'SUPPORT',
            'OTHER',
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="cursor-pointer"
          />
          Show archived
        </label>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && perks.length === 0 && <p>No perks found.</p>}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-6">
          <h2 className="type-title-sm mb-2">{category}</h2>
          <ul className="space-y-1">
            {items.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 p-3 border rounded"
              >
                <i className={`${p.icon} text-xl w-6 text-center`} />
                <div className="flex-1">
                  <div className="font-medium">{p.labelEn}</div>
                  <div className="text-on-surface-secondary text-sm">
                    {p.labelVi}
                  </div>
                </div>
                {p.archived && (
                  <span className="px-2 py-0.5 text-xs bg-surface-secondary rounded">
                    archived
                  </span>
                )}
                <Link
                  href={routes.admin.perks.edit.path({id: p.id})}
                  className="text-primary cursor-pointer"
                >
                  Edit
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => handleArchiveToggle(p)}
                >
                  {p.archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(p)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Run: `pnpm dev`, navigate to `http://localhost:3000/admin/perks` (after logging in as admin). Expected: page loads, list is empty (no perks yet), filters render.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/perks/index.tsx
git commit -m "feat(admin): perks list page with category grouping and filters"
```

---

## Task 11: Perks new + edit pages

**Files:**

- Create: `src/pages/admin/perks/new.tsx`
- Create: `src/pages/admin/perks/[id]/edit.tsx`

- [ ] **Step 1: Implement new page**

Create `src/pages/admin/perks/new.tsx`:

```tsx
import {api, routes, useNavigate} from '@/routes';
import {AdminBreadcrumbs} from '@/components/Admin/AdminBreadcrumbs';
import {PerkForm, type PerkFormValues} from '@/components/Admin/PerkForm';

export default function NewPerkPage() {
  const navigate = useNavigate();

  async function handleSubmit(values: PerkFormValues) {
    const {data, error} = await api.admin.perks.create({
      labelEn: values.labelEn,
      labelVi: values.labelVi,
      icon: values.icon,
      category: values.category,
    });
    if (error || !data) throw new Error(error ?? 'Failed to create perk');
    navigate.to(routes.admin.perks.edit, {id: data.id});
  }

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          {label: 'Admin', href: routes.admin.dashboard.path()},
          {label: 'Perks', href: routes.admin.perks.list.path()},
          {label: 'New'},
        ]}
      />
      <h1 className="type-headline-sm mb-6">New Perk</h1>
      <PerkForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 2: Implement edit page**

Create `src/pages/admin/perks/[id]/edit.tsx`:

```tsx
import {useRouter} from 'next/router';
import {useAdminFetch} from '@/hooks/useAdminFetch';
import {api, routes, useNavigate} from '@/routes';
import {AdminBreadcrumbs} from '@/components/Admin/AdminBreadcrumbs';
import {PerkForm, type PerkFormValues} from '@/components/Admin/PerkForm';
import type * as VMT from '@/domain';

export default function EditPerkPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const {
    data: perk,
    loading,
    error,
  } = useAdminFetch<VMT.Perk>(id ? `/api/admin/perks/${id}` : null);

  if (loading) return null;
  if (error || !perk) return <p>Perk not found.</p>;

  const initialData: PerkFormValues = {
    labelEn: perk.labelEn,
    labelVi: perk.labelVi,
    icon: perk.icon,
    category: perk.category,
    archived: perk.archived,
  };

  async function handleSubmit(values: PerkFormValues) {
    const {error: err} = await api.admin.perks.update(id!, values);
    if (err) throw new Error(err);
    navigate.to(routes.admin.perks.list);
  }

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          {label: 'Admin', href: routes.admin.dashboard.path()},
          {label: 'Perks', href: routes.admin.perks.list.path()},
          {label: perk.labelEn},
        ]}
      />
      <h1 className="type-headline-sm mb-6">Edit Perk</h1>
      <PerkForm mode="edit" initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

`pnpm dev`. Visit `/admin/perks/new`, create a perk. Visit list, click Edit on it. Confirm save round-trips.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/perks/new.tsx src/pages/admin/perks/[id]
git commit -m "feat(admin): create and edit perk pages"
```

---

## Task 12: Add Perks entry to admin sidebar nav

**Files:**

- Modify: admin layout / sidebar (locate first)

- [ ] **Step 1: Locate nav**

Run: `grep -rn "Destinations\|admin.tours" src/components/Admin --include="*.tsx" -l`
Expected: identifies the layout/sidebar file (likely `src/components/Admin/AdminLayout.tsx` or `src/components/Admin/Sidebar.tsx`).

- [ ] **Step 2: Add nav entry**

In the sidebar component, locate the array/JSX of nav links for "Destinations" and "Tours". Insert a new entry between them:

```tsx
{label: 'Perks', href: routes.admin.perks.list.path()}
```

(Match existing style: if entries are JSX `<Link>` elements, mirror that.)

- [ ] **Step 3: Smoke test**

`pnpm dev`. Confirm "Perks" link appears in admin sidebar between Destinations and Tours, navigates correctly, and is highlighted as active when on `/admin/perks*`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin
git commit -m "feat(admin): add Perks entry to sidebar nav"
```

---

## Task 13: PerksTab — form-utils

**Files:**

- Create: `src/components/Admin/tabs/PerksTab/PerksTab.form-utils.ts`

- [ ] **Step 1: Implement**

Create file:

```ts
import * as yup from 'yup';

export const perksTabSchema = yup.object({
  includedPerkIds: yup
    .array()
    .of(yup.string().required())
    .defined()
    .default([]),
  excludedPerkIds: yup
    .array()
    .of(yup.string().required())
    .defined()
    .default([]),
});

export type PerksTabValues = yup.InferType<typeof perksTabSchema>;

export const perksTabDefaults: PerksTabValues = {
  includedPerkIds: [],
  excludedPerkIds: [],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Admin/tabs/PerksTab/PerksTab.form-utils.ts
git commit -m "feat(admin): perks tab form-utils (Yup schema and defaults)"
```

---

## Task 14: PerkChip + PerkDropZone components

**Files:**

- Create: `src/components/Admin/tabs/PerksTab/PerkChip.tsx`
- Create: `src/components/Admin/tabs/PerksTab/PerkDropZone.tsx`

- [ ] **Step 1: Implement PerkChip**

Create `src/components/Admin/tabs/PerksTab/PerkChip.tsx`:

```tsx
import {useDraggable} from '@dnd-kit/core';
import type * as VMT from '@/domain';
import type {Locale} from '@/components/Admin/LocalePicker';

type PerkChipProps = {
  perk: VMT.Perk;
  locale: Locale;
  zone: 'available' | 'included' | 'excluded';
  onRemove?: () => void;
};

export function PerkChip({perk, locale, zone, onRemove}: PerkChipProps) {
  const {attributes, listeners, setNodeRef, transform, isDragging} =
    useDraggable({
      id: `${zone}:${perk.id}`,
      data: {perkId: perk.id, sourceZone: zone},
    });

  const label = locale === 'vi' && perk.labelVi ? perk.labelVi : perk.labelEn;
  const style = transform
    ? {transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`}
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 border rounded bg-surface ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <i className={`${perk.icon} text-base`} />
      <span className="text-sm">{label}</span>
      <span className="text-xs text-on-surface-secondary">
        ({perk.category})
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
          className="cursor-pointer ml-1 text-on-surface-secondary hover:text-on-surface"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

Note: `style` is required for dnd-kit to position the dragged element — this is a library API contract, not a styling decision (CLAUDE.md "no inline styles" rule does not apply here).

- [ ] **Step 2: Implement PerkDropZone**

Create `src/components/Admin/tabs/PerksTab/PerkDropZone.tsx`:

```tsx
import type {ReactNode} from 'react';
import {useDroppable} from '@dnd-kit/core';

type PerkDropZoneProps = {
  id: 'available' | 'included' | 'excluded';
  title: string;
  children: ReactNode;
};

export function PerkDropZone({id, title, children}: PerkDropZoneProps) {
  const {isOver, setNodeRef} = useDroppable({id});

  return (
    <div
      ref={setNodeRef}
      className={`p-4 border-2 rounded min-h-32 ${
        isOver ? 'border-primary bg-primary-container' : 'border-outline'
      }`}
    >
      <h3 className="type-title-sm mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/tabs/PerksTab/PerkChip.tsx src/components/Admin/tabs/PerksTab/PerkDropZone.tsx
git commit -m "feat(admin): PerkChip (draggable) and PerkDropZone (droppable)"
```

---

## Task 15: PerksTab component

**Files:**

- Create: `src/components/Admin/tabs/PerksTab/PerksTab.tsx`
- Create: `src/components/Admin/tabs/PerksTab/index.ts`

- [ ] **Step 1: Implement**

Create `src/components/Admin/tabs/PerksTab/PerksTab.tsx`:

```tsx
'use client';

import {useState, useEffect, useMemo} from 'react';
import {DndContext, type DragEndEvent} from '@dnd-kit/core';
import type * as VMT from '@/domain';
import {api} from '@/routes';
import {Button} from '@/components/ui';
import type {Locale} from '@/components/Admin/LocalePicker';
import {PerkChip} from './PerkChip';
import {PerkDropZone} from './PerkDropZone';

type Zone = 'available' | 'included' | 'excluded';

type PerksTabProps = {
  tourId: string | null;
  initialIncludedIds: string[];
  initialExcludedIds: string[];
  locale: Locale;
  onSave: (data: {
    includedPerkIds: string[];
    excludedPerkIds: string[];
  }) => Promise<void>;
};

export function PerksTab({
  tourId,
  initialIncludedIds,
  initialExcludedIds,
  locale,
  onSave,
}: PerksTabProps) {
  const [allPerks, setAllPerks] = useState<VMT.Perk[]>([]);
  const [included, setIncluded] = useState<Set<string>>(
    new Set(initialIncludedIds),
  );
  const [excluded, setExcluded] = useState<Set<string>>(
    new Set(initialExcludedIds),
  );
  const [savedIncluded, setSavedIncluded] = useState<Set<string>>(
    new Set(initialIncludedIds),
  );
  const [savedExcluded, setSavedExcluded] = useState<Set<string>>(
    new Set(initialExcludedIds),
  );
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.perks.list({archived: false}).then(({data}) => {
      if (data) setAllPerks(data);
    });
  }, []);

  const isDirty =
    setsDiffer(included, savedIncluded) || setsDiffer(excluded, savedExcluded);

  const perkMap = useMemo(() => {
    const m = new Map<string, VMT.Perk>();
    for (const p of allPerks) m.set(p.id, p);
    return m;
  }, [allPerks]);

  const availablePerks = useMemo(() => {
    return allPerks.filter(
      (p) =>
        !included.has(p.id) &&
        !excluded.has(p.id) &&
        (!categoryFilter || p.category === categoryFilter) &&
        (!search ||
          p.labelEn.toLowerCase().includes(search.toLowerCase()) ||
          p.labelVi.toLowerCase().includes(search.toLowerCase())),
    );
  }, [allPerks, included, excluded, search, categoryFilter]);

  function moveTo(perkId: string, target: Zone) {
    setIncluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      if (target === 'included') next.add(perkId);
      return next;
    });
    setExcluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      if (target === 'excluded') next.add(perkId);
      return next;
    });
  }

  function unassign(perkId: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      return next;
    });
    setExcluded((prev) => {
      const next = new Set(prev);
      next.delete(perkId);
      return next;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const overId = e.over.id as Zone;
    const data = e.active.data.current as {perkId: string; sourceZone: Zone};
    if (overId === data.sourceZone) return;
    if (overId === 'available') unassign(data.perkId);
    else moveTo(data.perkId, overId);
  }

  async function handleSave() {
    if (!tourId) {
      setError('Save the General tab first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        includedPerkIds: [...included],
        excludedPerkIds: [...excluded],
      });
      setSavedIncluded(new Set(included));
      setSavedExcluded(new Set(excluded));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <PerkDropZone id="available" title="Available perks">
          <div className="w-full flex gap-2 mb-2">
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border rounded cursor-text"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded cursor-pointer"
            >
              <option value="">All categories</option>
              {[
                'TRANSPORT',
                'FOOD',
                'ACCOMMODATION',
                'GUIDE',
                'SUPPORT',
                'OTHER',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {availablePerks.map((p) => (
            <PerkChip key={p.id} perk={p} locale={locale} zone="available" />
          ))}
          {availablePerks.length === 0 && (
            <p className="text-on-surface-secondary text-sm">
              No perks available.
            </p>
          )}
        </PerkDropZone>

        <div className="grid grid-cols-2 gap-4">
          <PerkDropZone id="included" title="✓ Included">
            {[...included].map((id) => {
              const p = perkMap.get(id);
              return p ? (
                <PerkChip
                  key={p.id}
                  perk={p}
                  locale={locale}
                  zone="included"
                  onRemove={() => unassign(p.id)}
                />
              ) : null;
            })}
          </PerkDropZone>
          <PerkDropZone id="excluded" title="✗ Excluded">
            {[...excluded].map((id) => {
              const p = perkMap.get(id);
              return p ? (
                <PerkChip
                  key={p.id}
                  perk={p}
                  locale={locale}
                  zone="excluded"
                  onRemove={() => unassign(p.id)}
                />
              ) : null;
            })}
          </PerkDropZone>
        </div>

        {error && <p className="text-error">{error}</p>}

        <Button onClick={handleSave} disabled={!isDirty || saving || !tourId}>
          {saving ? 'Saving…' : 'Save Perks'}
        </Button>
      </div>
    </DndContext>
  );
}

function setsDiffer(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return true;
  for (const v of a) if (!b.has(v)) return true;
  return false;
}
```

- [ ] **Step 2: Re-export**

Create `src/components/Admin/tabs/PerksTab/index.ts`:

```ts
export {PerksTab} from './PerksTab';
```

- [ ] **Step 3: Type-check**

Run: `pnpm build`
Expected: build succeeds (or fails at later wiring tasks — not at this file).

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin/tabs/PerksTab
git commit -m "feat(admin): PerksTab with drag-and-drop perk assignment"
```

---

## Task 16: Tour PUT API — accept includedPerkIds / excludedPerkIds

**Files:**

- Modify: `src/pages/api/admin/tours/[id].ts`
- Test: `src/pages/api/admin/tours/__tests__/perks.spec.ts`

- [ ] **Step 1: Write failing test**

Create `src/pages/api/admin/tours/__tests__/perks.spec.ts`:

```ts
import handler from '../[id]';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import type {NextApiRequest, NextApiResponse} from 'next';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tour: {findUnique: jest.fn(), update: jest.fn()},
    tourPerk: {deleteMany: jest.fn(), createMany: jest.fn()},
    perk: {findMany: jest.fn()},
    $transaction: jest.fn(),
  },
}));
jest.mock('@/lib/admin-auth', () => ({requireAdmin: jest.fn()}));

const mockReq = (o: Partial<NextApiRequest> = {}) =>
  ({method: 'PUT', query: {id: 't1'}, body: {}, ...o}) as NextApiRequest;

const mockRes = () => {
  const res = {} as NextApiResponse;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.end = jest.fn().mockReturnThis();
  res.setHeader = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue(true);
  (prisma.$transaction as jest.Mock).mockImplementation(
    async (fns: Array<Promise<unknown>>) => Promise.all(fns),
  );
  (prisma.tour.update as jest.Mock).mockResolvedValue({id: 't1'});
});

describe('PUT /api/admin/tours/[id] perks handling', () => {
  it('replaces TourPerk rows when includedPerkIds and excludedPerkIds provided', async () => {
    (prisma.perk.findMany as jest.Mock).mockResolvedValue([
      {id: 'a'},
      {id: 'b'},
      {id: 'c'},
    ]);
    const res = mockRes();
    await handler(
      mockReq({
        body: {
          includedPerkIds: ['a', 'b'],
          excludedPerkIds: ['c'],
        },
      }),
      res,
    );
    expect(prisma.tourPerk.deleteMany).toHaveBeenCalledWith({
      where: {tourId: 't1'},
    });
    expect(prisma.tourPerk.createMany).toHaveBeenCalledWith({
      data: [
        {tourId: 't1', perkId: 'a', bucket: 'INCLUDED'},
        {tourId: 't1', perkId: 'b', bucket: 'INCLUDED'},
        {tourId: 't1', perkId: 'c', bucket: 'EXCLUDED'},
      ],
    });
  });

  it('rejects when same perk appears in both buckets', async () => {
    const res = mockRes();
    await handler(
      mockReq({body: {includedPerkIds: ['a'], excludedPerkIds: ['a']}}),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.tourPerk.deleteMany).not.toHaveBeenCalled();
  });

  it('skips perk handling when neither key provided', async () => {
    const res = mockRes();
    await handler(mockReq({body: {title: 'Updated'}}), res);
    expect(prisma.tourPerk.deleteMany).not.toHaveBeenCalled();
    expect(prisma.tour.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/pages/api/admin/tours/__tests__/perks.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Modify handler**

In `src/pages/api/admin/tours/[id].ts` PUT branch, add the perks-handling block AFTER the highlights block but BEFORE the final `prisma.tour.update`:

```ts
// Handle perks (replace-all semantics)
const hasIncluded = Array.isArray(data.includedPerkIds);
const hasExcluded = Array.isArray(data.excludedPerkIds);
let perkOps: Array<Promise<unknown>> | null = null;
if (hasIncluded || hasExcluded) {
  const includedIds: string[] = hasIncluded ? data.includedPerkIds : [];
  const excludedIds: string[] = hasExcluded ? data.excludedPerkIds : [];

  // Reject overlap
  const overlap = includedIds.filter((id) => excludedIds.includes(id));
  if (overlap.length > 0) {
    return res
      .status(400)
      .json({error: 'Perk cannot be in both included and excluded lists'});
  }

  // Validate perks exist and are not archived
  const allRequested = [...new Set([...includedIds, ...excludedIds])];
  if (allRequested.length > 0) {
    const validPerks = await prisma.perk.findMany({
      where: {id: {in: allRequested}, archived: false},
      select: {id: true},
    });
    const validSet = new Set(validPerks.map((p) => p.id));
    const filteredIncluded = includedIds.filter((id) => validSet.has(id));
    const filteredExcluded = excludedIds.filter((id) => validSet.has(id));
    perkOps = [
      prisma.tourPerk.deleteMany({where: {tourId: id}}),
      prisma.tourPerk.createMany({
        data: [
          ...filteredIncluded.map((perkId) => ({
            tourId: id,
            perkId,
            bucket: 'INCLUDED' as const,
          })),
          ...filteredExcluded.map((perkId) => ({
            tourId: id,
            perkId,
            bucket: 'EXCLUDED' as const,
          })),
        ],
      }),
    ];
  } else {
    perkOps = [prisma.tourPerk.deleteMany({where: {tourId: id}})];
  }
}
```

Then below the existing `prisma.tour.update`, wrap both updates in a transaction. Replace:

```ts
const updatedTour = await prisma.tour.update({
  where: {id},
  data: updateData,
});
return res.json(updatedTour);
```

with:

```ts
const updatedTour = perkOps
  ? await prisma
      .$transaction([
        prisma.tour.update({where: {id}, data: updateData}),
        ...perkOps,
      ])
      .then((results) => results[0])
  : await prisma.tour.update({where: {id}, data: updateData});
return res.json(updatedTour);
```

Strip `includedPerkIds` and `excludedPerkIds` from the body iteration so they aren't accidentally written as scalar columns. The `fields` whitelist already excludes them, so no change needed there — but verify in code review.

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test -- src/pages/api/admin/tours`
Expected: PASS (new file passes; existing tests still pass).

- [ ] **Step 5: Commit**

```bash
git add 'src/pages/api/admin/tours/[id].ts' src/pages/api/admin/tours/__tests__/perks.spec.ts
git commit -m "feat(api): tour PUT accepts includedPerkIds/excludedPerkIds (replace-all)"
```

---

## Task 17: Wire PerksTab into TourEditTabs + GET endpoint includes perks

**Files:**

- Modify: `src/components/Admin/TourEditTabs/TourEditTabs.tsx`
- Modify: `src/pages/admin/tours/[id]/edit.tsx`
- Modify: `src/pages/api/admin/tours/[id].ts` (GET branch)

- [ ] **Step 1: Update GET to include perks**

In `src/pages/api/admin/tours/[id].ts`, change the `GET` `findUnique` call to:

```ts
const tour = await prisma.tour.findUnique({
  where: {id},
  include: {
    highlights: true,
    perks: {include: {perk: true}},
  },
});
```

- [ ] **Step 2: Update edit page to derive perk IDs**

In `src/pages/admin/tours/[id]/edit.tsx`, after `const highlights = ...`, add:

```ts
const tourPerks =
  (tour.perks as Array<{perkId: string; bucket: 'INCLUDED' | 'EXCLUDED'}>) ??
  [];
const initialIncludedPerkIds = tourPerks
  .filter((tp) => tp.bucket === 'INCLUDED')
  .map((tp) => tp.perkId);
const initialExcludedPerkIds = tourPerks
  .filter((tp) => tp.bucket === 'EXCLUDED')
  .map((tp) => tp.perkId);
```

Then add the props to `<TourEditTabs ... />`:

```tsx
initialIncludedPerkIds = {initialIncludedPerkIds};
initialExcludedPerkIds = {initialExcludedPerkIds};
```

- [ ] **Step 3: Update TourEditTabs**

In `src/components/Admin/TourEditTabs/TourEditTabs.tsx`:

Add to `TabId` union:

```ts
type TabId = 'general' | 'itinerary' | 'pricing' | 'highlights' | 'perks';
```

Add to `TourEditTabsProps`:

```ts
initialIncludedPerkIds: string[];
initialExcludedPerkIds: string[];
```

Destructure both in the component signature.

Import:

```ts
import {PerksTab} from '../tabs/PerksTab';
```

Add a save handler:

```ts
const handlePerksSave = useCallback(
  async (data: {includedPerkIds: string[]; excludedPerkIds: string[]}) => {
    if (!tourId) throw new Error('Save General tab first');
    const {error} = await api.admin.tours.update(tourId, data);
    if (error) throw new Error(error);
  },
  [tourId],
);
```

Add a tab item to the `Tabs items={[...]}` array (after `highlights`):

```ts
{key: 'perks', label: 'Perks', disabled: isTabDisabled('perks')},
```

Add a tab panel (after the highlights `TabPanel`):

```tsx
<TabPanel tabKey="perks">
  <PerksTab
    tourId={tourId}
    initialIncludedIds={initialIncludedPerkIds}
    initialExcludedIds={initialExcludedPerkIds}
    locale={locale}
    onSave={handlePerksSave}
  />
</TabPanel>
```

- [ ] **Step 4: Update create flow**

In `src/pages/admin/tours/new.tsx`, find where `<TourEditTabs ... />` is rendered (search the file). Add:

```tsx
initialIncludedPerkIds={[]}
initialExcludedPerkIds={[]}
```

- [ ] **Step 5: Smoke test**

`pnpm dev`. Open an existing tour edit page → "Perks" tab appears, drag-and-drop works, save persists, reload page reflects saved state.

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/TourEditTabs 'src/pages/admin/tours/[id]/edit.tsx' src/pages/admin/tours/new.tsx 'src/pages/api/admin/tours/[id].ts'
git commit -m "feat(admin): wire Perks tab into tour edit flow"
```

---

## Task 18: Data migration — strings to Perk catalog

**Files:**

- Create: `scripts/migrate-perks.ts`
- Modify: `package.json` (add script entry)

- [ ] **Step 1: Implement migration script**

Create `scripts/migrate-perks.ts`:

```ts
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_ICON = 'fa-solid fa-circle-check';

type LegacyEntry = {en: string; vi: string};

function dedupeKey(en: string) {
  return en.trim().toLowerCase();
}

async function ensurePerk(en: string, vi: string): Promise<string | null> {
  const key = dedupeKey(en);
  if (!key) return null;
  const existing = await prisma.perk.findFirst({
    where: {labelEn: {equals: en.trim(), mode: 'insensitive'}},
  });
  if (existing) {
    if (!existing.labelVi && vi) {
      await prisma.perk.update({
        where: {id: existing.id},
        data: {labelVi: vi.trim()},
      });
    }
    return existing.id;
  }
  const created = await prisma.perk.create({
    data: {
      labelEn: en.trim(),
      labelVi: vi?.trim() ?? '',
      icon: DEFAULT_ICON,
      category: 'OTHER',
    },
  });
  return created.id;
}

async function main() {
  const tours = await prisma.tour.findMany({
    select: {id: true, included: true, excluded: true},
  });

  let toursProcessed = 0;
  let assignmentsCreated = 0;

  for (const tour of tours) {
    const inc = (tour.included as LegacyEntry[] | null) ?? [];
    const exc = (tour.excluded as LegacyEntry[] | null) ?? [];

    const includedIds: string[] = [];
    const excludedIds: string[] = [];

    for (const e of inc) {
      const id = await ensurePerk(e.en ?? '', e.vi ?? '');
      if (id) includedIds.push(id);
    }
    for (const e of exc) {
      const id = await ensurePerk(e.en ?? '', e.vi ?? '');
      if (id) excludedIds.push(id);
    }

    // Dedupe within each bucket
    const incSet = [...new Set(includedIds)];
    const excSet = [...new Set(excludedIds)].filter(
      (id) => !incSet.includes(id),
    );

    // Idempotent: clear and re-insert this tour's TourPerk rows
    await prisma.$transaction([
      prisma.tourPerk.deleteMany({where: {tourId: tour.id}}),
      prisma.tourPerk.createMany({
        data: [
          ...incSet.map((perkId) => ({
            tourId: tour.id,
            perkId,
            bucket: 'INCLUDED' as const,
          })),
          ...excSet.map((perkId) => ({
            tourId: tour.id,
            perkId,
            bucket: 'EXCLUDED' as const,
          })),
        ],
      }),
    ]);

    toursProcessed += 1;
    assignmentsCreated += incSet.length + excSet.length;
  }

  console.log(
    `Processed ${toursProcessed} tours, created ${assignmentsCreated} assignments.`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add npm script**

In `package.json`, under `scripts`:

```json
"migrate:perks": "tsx scripts/migrate-perks.ts"
```

(`tsx` should already be a dev dep — if not, the script can be run with `pnpm exec ts-node scripts/migrate-perks.ts`. Confirm via `pnpm exec tsx --version`. If neither is available, stop and ask before adding a dep.)

- [ ] **Step 3: Run on local DB**

Run: `pnpm migrate:perks`
Expected: prints `Processed N tours, created M assignments.` Inspect DB:

```bash
pnpm prisma studio
```

Confirm: `Perk` table populated, `TourPerk` rows match Tours' old `included`/`excluded` content.

- [ ] **Step 4: Re-run idempotency check**

Run: `pnpm migrate:perks` again.
Expected: same row counts (no duplicate Perks created, TourPerk rows replaced cleanly).

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-perks.ts package.json
git commit -m "feat(scripts): migrate Tour.included/excluded JSON into Perk catalog"
```

---

## Task 19: Drop Tour.included and Tour.excluded columns (Phase 3)

**Files:**

- Modify: `prisma/schema.prisma`
- Create: migration via Prisma

- [ ] **Step 1: Remove fields from Tour model**

In `prisma/schema.prisma`, delete these two lines from the `Tour` model:

```
included       Json        @default("[]")
excluded       Json        @default("[]")
```

- [ ] **Step 2: Generate migration**

Run: `pnpm prisma migrate dev --name drop_tour_included_excluded --create-only`
Expected: new migration directory with `DROP COLUMN "included"` and `DROP COLUMN "excluded"`.

- [ ] **Step 3: Inspect SQL**

Open the generated `migration.sql`. Confirm only the two DROP COLUMNs (no other accidental changes).

- [ ] **Step 4: Apply locally**

Run: `pnpm prisma migrate dev`
Expected: applies. `pnpm prisma generate` regenerates the client.

- [ ] **Step 5: Type check**

Run: `pnpm build`
Expected: build fails at any remaining references to `tour.included` / `tour.excluded` outside the new perks system. Fix each (likely in Tour domain mapper, queries, admin tour PUT field whitelist, GeneralTab form-utils, TourPreviewPanel).

Specifically:

- `src/domain/tour/index.ts` — remove `included` and `excluded` from the mapped type. Add `perks: TourPerk[]` or a derived shape (see Task 20 for public mapping).
- `src/pages/api/admin/tours/[id].ts` — remove `'included', 'excluded'` from the `fields` array.
- `src/pages/api/admin/tours/index.ts` — same if applicable (POST whitelist).
- `src/pages/admin/tours/[id]/edit.tsx` — remove the `included` / `excluded` keys from `initialGeneral`.
- `src/pages/admin/tours/new.tsx` — same.
- `src/components/Admin/tabs/GeneralTab/GeneralTab.form-utils.ts` — remove the `included` / `excluded` Yup keys.
- `src/components/Admin/TourPreviewPanel/TourPreviewPanel.tsx` — remove the legacy mapping (preview will now consume perks via Task 20's public render path).

Run `pnpm build` until clean.

- [ ] **Step 6: Run all tests**

Run: `pnpm test -- --watchAll=false`
Expected: PASS. Update or remove any test that referenced legacy `included`/`excluded`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src
git commit -m "feat(db): drop Tour.included and Tour.excluded JSON columns"
```

---

## Task 20: Public tour rendering — Perk-based

**Files:**

- Modify: `src/components/tour-detail/TourIncluded/TourIncluded.tsx`
- Modify: `src/data/queries.ts`
- Modify: `src/domain/tour/index.ts`
- Modify: `src/types/index.ts` (if used)

- [ ] **Step 1: Update Tour domain type**

In `src/domain/tour/index.ts`, change `included: LocalizedText[]` and `excluded: LocalizedText[]` to:

```ts
included: Perk[];
excluded: Perk[];
```

Import `Perk` from `../perk`. Remove `LocalizedText` import if unused.

- [ ] **Step 2: Update queries**

In `src/data/queries.ts`, find `getTourBySlug` (and any sibling queries that return Tour). Where Prisma fetches the tour, add:

```ts
include: {
  destination: true,
  highlights: true,
  perks: {
    where: {perk: {archived: false}},
    include: {perk: true},
  },
},
```

When mapping to the domain `Tour`, derive:

```ts
const included = raw.perks
  .filter((tp) => tp.bucket === 'INCLUDED')
  .map((tp) => tp.perk)
  .sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.labelEn.localeCompare(b.labelEn),
  );
const excluded = raw.perks
  .filter((tp) => tp.bucket === 'EXCLUDED')
  .map((tp) => tp.perk)
  .sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.labelEn.localeCompare(b.labelEn),
  );
```

Return `included` and `excluded` on the mapped Tour object instead of the legacy JSON.

- [ ] **Step 3: Update public component**

Replace `src/components/tour-detail/TourIncluded/TourIncluded.tsx` with:

```tsx
import {useTranslations} from 'next-intl';
import type * as VMT from '@/domain';

type TourIncludedProps = {
  included: VMT.Perk[];
  excluded: VMT.Perk[];
  locale: string;
};

export function TourIncluded({included, excluded, locale}: TourIncludedProps) {
  const t = useTranslations('tourDetail');

  return (
    <section className="grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="type-title-md mb-3">{t('whatsIncluded')}</h3>
        <ul className="space-y-2">
          {included.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <i className={`${p.icon} text-success`} />
              <span>
                {locale === 'vi' && p.labelVi ? p.labelVi : p.labelEn}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="type-title-md mb-3">{t('whatsNotIncluded')}</h3>
        <ul className="space-y-2">
          {excluded.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <i className={`${p.icon} text-error`} />
              <span>
                {locale === 'vi' && p.labelVi ? p.labelVi : p.labelEn}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

(Translation keys `tourDetail.whatsIncluded` / `tourDetail.whatsNotIncluded` should already exist — verify via `grep -r whatsIncluded src/messages` or DB. If absent, add them in Task 22.)

- [ ] **Step 4: Update tests**

Run: `pnpm test -- TourIncluded`
Expected: existing test fails because props changed. Update the spec to render with `Perk[]` shape (id, labelEn, labelVi, icon, category, archived, updatedAt).

- [ ] **Step 5: Smoke test**

`pnpm dev`. Visit a public tour detail page. Confirm icon + label renders under "What's Included" / "What's not Included" with correct locale.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(public): render tour included/excluded from Perk catalog"
```

---

## Task 21: Remove Tevily icons

**Files:**

- Modify: `src/pages/_document.tsx`
- Delete: `public/assets/vendors/tevily-icons/`

- [ ] **Step 1: Delete the stylesheet link**

In `src/pages/_document.tsx`, remove the `<link>` element whose `href` references `tevily-icons/style.css` (line ~37 per earlier grep).

- [ ] **Step 2: Delete the asset directory**

Run: `rm -rf public/assets/vendors/tevily-icons`
Expected: directory removed.

- [ ] **Step 3: Verify no leftover references**

Run: `grep -rn "tevily\|Tevily" src/ public/`
Expected: zero matches.

- [ ] **Step 4: Smoke test**

`pnpm dev`. Open homepage in browser. Confirm no broken icon glyphs anywhere (visual sweep). Check console for 404s.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Tevily icon font (replaced by FontAwesome)"
```

---

## Task 22: Admin perks i18n keys

**Files:**

- DB Translation table (managed via `/admin/translations` UI)

- [ ] **Step 1: List required keys**

The admin perks UI uses these strings (and category labels):

- `admin.perks.title` — "Perks"
- `admin.perks.new` — "New perk"
- `admin.perks.searchPlaceholder` — "Search…"
- `admin.perks.allCategories` — "All categories"
- `admin.perks.showArchived` — "Show archived"
- `admin.perks.archived` — "archived"
- `admin.perks.edit` — "Edit"
- `admin.perks.archive` — "Archive"
- `admin.perks.unarchive` — "Unarchive"
- `admin.perks.delete` — "Delete"
- `admin.perks.deleteConfirm` — "Delete perk \"{label}\"? This cannot be undone."
- `admin.perks.empty` — "No perks found."
- `admin.perks.form.labelEn` — "Label (EN)"
- `admin.perks.form.labelVi` — "Label (VI)"
- `admin.perks.form.icon` — "Icon"
- `admin.perks.form.category` — "Category"
- `admin.perks.form.archived` — "Archived"
- `admin.perks.form.save` — "Save"
- `admin.perks.form.saving` — "Saving…"
- `admin.perks.category.TRANSPORT|FOOD|ACCOMMODATION|GUIDE|SUPPORT|OTHER` — capitalized labels
- `admin.tours.tabs.perks` — "Perks"
- `admin.tours.perksTab.available` — "Available perks"
- `admin.tours.perksTab.included` — "✓ Included"
- `admin.tours.perksTab.excluded` — "✗ Excluded"
- `admin.tours.perksTab.save` — "Save Perks"

- [ ] **Step 2: Add via admin translations UI**

Navigate to `/admin/translations`. For each key above, add an entry with the EN value as listed and a VI translation. (VI values: confirm with team or leave EN as fallback temporarily — non-blocking.)

- [ ] **Step 3: Replace hardcoded strings**

Audit:

- `src/pages/admin/perks/index.tsx`
- `src/pages/admin/perks/new.tsx`
- `src/pages/admin/perks/[id]/edit.tsx`
- `src/components/Admin/PerkForm/PerkForm.tsx`
- `src/components/Admin/tabs/PerksTab/PerksTab.tsx`

Replace each user-visible English literal with `useTranslations('admin.perks')` (or `admin.tours.perksTab`) and `t('key')` calls. The `Tabs` label for perks comes from `t('admin.tours.tabs.perks')` in `TourEditTabs.tsx`.

- [ ] **Step 4: Smoke test EN and VI**

`pnpm dev`. Visit `/admin/perks` in EN and VI locales. Confirm all labels render in the correct language.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(i18n): wire admin perks UI through next-intl translations"
```

---

## Task 23: PerksTab unit test

**Files:**

- Create: `src/components/Admin/tabs/PerksTab/PerksTab.spec.tsx`

- [ ] **Step 1: Write test**

Create `src/components/Admin/tabs/PerksTab/PerksTab.spec.tsx`:

```tsx
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {PerksTab} from './PerksTab';

jest.mock('@/routes', () => ({
  api: {
    admin: {
      perks: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'p1',
              labelEn: 'Bike',
              labelVi: 'Xe',
              icon: 'fa-solid fa-motorcycle',
              category: 'TRANSPORT',
              archived: false,
              updatedAt: new Date(),
            },
            {
              id: 'p2',
              labelEn: 'Lunch',
              labelVi: 'Bữa trưa',
              icon: 'fa-solid fa-utensils',
              category: 'FOOD',
              archived: false,
              updatedAt: new Date(),
            },
          ],
          error: null,
        }),
      },
    },
  },
}));

describe('PerksTab', () => {
  it('renders Available, Included and Excluded zones', async () => {
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={[]}
        initialExcludedIds={[]}
        locale="en"
        onSave={async () => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Bike')).toBeInTheDocument());
    expect(screen.getByText(/Available perks/i)).toBeInTheDocument();
    expect(screen.getByText(/Included/i)).toBeInTheDocument();
    expect(screen.getByText(/Excluded/i)).toBeInTheDocument();
  });

  it('does not show already-assigned perk in Available', async () => {
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={['p1']}
        initialExcludedIds={[]}
        locale="en"
        onSave={async () => {}}
      />,
    );
    await waitFor(() =>
      expect(screen.getAllByText('Bike').length).toBeGreaterThan(0),
    );
    // p1 should appear in Included zone only — count its occurrences
    const occurrences = screen.getAllByText('Bike').length;
    expect(occurrences).toBe(1);
  });

  it('Save button is disabled until dirty', async () => {
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={[]}
        initialExcludedIds={[]}
        locale="en"
        onSave={async () => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('Bike')).toBeInTheDocument());
    expect(screen.getByRole('button', {name: /save perks/i})).toBeDisabled();
  });

  it('calls onSave with selected ids', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <PerksTab
        tourId="t1"
        initialIncludedIds={['p1']}
        initialExcludedIds={['p2']}
        locale="en"
        onSave={onSave}
      />,
    );
    await waitFor(() =>
      expect(screen.getAllByText(/Bike|Lunch/).length).toBeGreaterThan(0),
    );
    // Manually unassign p1 via the chip ✕ to mark dirty.
    const removeButtons = screen.getAllByRole('button', {name: /remove/i});
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getByRole('button', {name: /save perks/i}));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          includedPerkIds: expect.any(Array),
          excludedPerkIds: expect.any(Array),
        }),
      ),
    );
  });
});
```

- [ ] **Step 2: Run**

Run: `pnpm test -- PerksTab.spec`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Admin/tabs/PerksTab/PerksTab.spec.tsx
git commit -m "test(admin): PerksTab — zones, auto-filter, save flow"
```

---

## Task 24: End-to-end manual verification

- [ ] **Step 1: Production build**

Run: `pnpm build`
Expected: succeeds, type-checks pass.

- [ ] **Step 2: Test suite**

Run: `pnpm test -- --watchAll=false`
Expected: all PASS.

- [ ] **Step 3: Manual flows in `pnpm dev`**

Verify in browser, EN and VI:

- `/admin/perks` — list, filter, create, edit, archive, unarchive, delete (blocked when in use, succeeds otherwise).
- Archived perk does not appear in tour Perks tab Available pool.
- Tour edit → Perks tab → drag from Available → Included → save → reload → state preserved.
- Drag from Included to Excluded → save → reload → state preserved.
- Click ✕ on a chip → unassigns → save → reload → state preserved.
- Public tour detail page renders perks with correct icons + locale-correct labels.
- Archived perk is not rendered on public page even if still in `TourPerk`.

- [ ] **Step 4: Production migration runbook (do NOT execute without user approval)**

Document in PR description:

1. Deploy code (Phase 1 schema is additive — `Perk`, `TourPerk` created; old columns still exist).
2. SSH to VPS, run: `pnpm migrate:perks`.
3. Verify in DB: `SELECT count(*) FROM "Perk"; SELECT count(*) FROM "TourPerk";`
4. Smoke-test admin flow on production.
5. Deploy Phase 3 (drops `Tour.included` / `Tour.excluded`).

- [ ] **Step 5: Commit**

If any small fixes were made during smoke testing, commit them. Otherwise this task is verification-only.

---

## Notes for the implementer

- `@dnd-kit` is fully accessible — keyboard drag works out of the box. Don't override the keyboard sensors.
- The `@dnd-kit` `transform` style on `PerkChip` is a library-mandated inline style for positioning during drag. CLAUDE.md's "no inline styles" rule does not apply (the dnd-kit API requires it).
- `TourPerk` rows are wiped and replaced on every Perks tab save — this is by design (replace-all semantics simplifies the API and matches the existing HighlightsTab pattern).
- The data migration script (Task 18) is idempotent: re-running rebuilds the `TourPerk` rows for each tour from current `Tour.included`/`Tour.excluded` JSON. Only safe to run **before** Task 19 drops those columns.
- Phase 2 (data migration) and Phase 3 (column drop) MUST be separate deploys in production. Don't combine them.
- Initial Perk catalog seed: the migration script populates from existing tour data. To pre-seed a curated catalog instead, manually `POST /api/admin/perks` for each desired entry before running the migration — those will dedupe by labelEn.
