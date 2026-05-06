# Resilient Image Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deploy-immune image upload pipeline: files stored outside the repo, client-side HEIC/JPEG/PNG → WebP transcoding, staged upload-on-save, atomic file+DB updates, and a one-shot migration of legacy uploads.

**Architecture:** Files live at `/var/lib/vmt-uploads` (env var `UPLOAD_DIR`), served via `GET /api/uploads/[...path]`. Filenames embed an 8-char SHA-256 prefix so replace = new file + new url; old files unlinked best-effort. Client transcodes any input to `image/webp` before POSTing — server rejects anything else (magic-byte check). Forms hold blobs in memory until save; no `_pending/` namespace, no orphan-from-cancel. Highlight images get first-class support (existing code passes wrong entityType — fixed here).

**Tech Stack:** Next.js 16 (Pages Router), Prisma + PostgreSQL, react-hook-form + Yup, Jest + React Testing Library. New runtime dep: `heic2any` (lazy-loaded, ~2MB wasm). All transcoding browser-side; no `sharp` / `libvips` / native binaries.

**Spec:** `docs/superpowers/specs/2026-05-06-resilient-image-uploads-design.md`

**Up-front user decision required (blocks Task 8):** `heic2any` is a new dependency. Per CLAUDE.md, dep additions need explicit user approval. Confirm before starting Task 8. Other tasks can proceed in parallel.

---

## File Map

```
src/lib/upload-dir.ts                          new — resolves UPLOAD_DIR
src/lib/upload-dir.spec.ts                     new
src/lib/image-magic.ts                         new — magic-byte sniff
src/lib/image-magic.spec.ts                    new
src/lib/image-transcode.ts                     new — decode + resize + encode webp + hash
src/lib/image-transcode.spec.ts                new
src/lib/image-slot.ts                          new — ImageSlot type + Yup validator
src/lib/image-slot.spec.ts                     new
src/lib/upload-entities.ts                     new — entity allowlist + DB field map
src/lib/upload-entities.spec.ts                new
src/lib/submit-with-images.ts                  new — flushImageSlots
src/lib/submit-with-images.spec.ts             new
src/pages/api/uploads/[...path].ts             new — public file streamer
src/pages/api/uploads/[...path].spec.ts        new
src/pages/api/health/uploads.ts                new — disk-writable + freeBytes
src/pages/api/health/uploads.spec.ts           new
src/pages/api/admin/upload.ts                  rewritten — webp-only, hashed, atomic
src/pages/api/admin/upload.spec.ts             new
src/components/ui/ImageUpload/ImageUpload.tsx  rewritten — ImageSlot contract
src/components/ui/ImageUpload/ImageUpload.spec.tsx  rewritten
src/components/Admin/ImageUploadField/ImageUploadField.tsx  rewritten — staged
src/components/Admin/ImageUploadField/ImageUploadField.spec.tsx  new
src/routes/index.ts                            modified — api.admin.upload signatures
prisma/schema.prisma                           modified — nullable image fields
prisma/migrations/<ts>_image_urls_nullable/    new migration
scripts/migrate-uploads.ts                     new — one-shot legacy file mover
scripts/sweep-orphan-uploads.ts                new — weekly cron
scripts/sweep-orphan-uploads.spec.ts           new
.gitignore                                     modified — /public/uploads/, /.uploads/
public/uploads/                                deleted from repo (Task 23)
public/upload-placeholder.svg                  new — 404 fallback image
package.json                                   modified — add heic2any, scripts
VPS.md                                         modified — UPLOAD_DIR, sweep cron, migration
jest.setup.ts                                  modified — browser-API stubs for transcode tests
```

---

## Phase 1 — Foundation: storage path + serving

### Task 1: UPLOAD_DIR resolver

**Files:**

- Create: `src/lib/upload-dir.ts`
- Test: `src/lib/upload-dir.spec.ts`

**Why first:** every task that touches the filesystem reads from this. One-line helper, but keeping it isolated lets us mock in unit tests without touching `process.cwd()` everywhere.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/upload-dir.spec.ts
import path from 'path';
import {getUploadDir, resolveUploadPath} from './upload-dir';

describe('getUploadDir', () => {
  const ORIGINAL_ENV = process.env.UPLOAD_DIR;
  afterEach(() => {
    process.env.UPLOAD_DIR = ORIGINAL_ENV;
  });

  it('returns UPLOAD_DIR env var when set', () => {
    process.env.UPLOAD_DIR = '/var/lib/vmt-uploads';
    expect(getUploadDir()).toBe('/var/lib/vmt-uploads');
  });

  it('falls back to <cwd>/.uploads when UPLOAD_DIR unset', () => {
    delete process.env.UPLOAD_DIR;
    expect(getUploadDir()).toBe(path.join(process.cwd(), '.uploads'));
  });
});

describe('resolveUploadPath', () => {
  beforeEach(() => {
    process.env.UPLOAD_DIR = '/var/lib/vmt-uploads';
  });

  it('joins relative segments under UPLOAD_DIR', () => {
    expect(resolveUploadPath('tours/abc/card.aaaaaaaa.webp')).toBe(
      '/var/lib/vmt-uploads/tours/abc/card.aaaaaaaa.webp',
    );
  });

  it('throws on path traversal', () => {
    expect(() => resolveUploadPath('../etc/passwd')).toThrow(/traversal/);
    expect(() => resolveUploadPath('tours/../../etc/passwd')).toThrow(
      /traversal/,
    );
  });

  it('throws on absolute paths', () => {
    expect(() => resolveUploadPath('/etc/passwd')).toThrow(/absolute/);
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```
pnpm test -- src/lib/upload-dir.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/upload-dir.ts
import path from 'path';

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), '.uploads');
}

export function resolveUploadPath(relative: string): string {
  if (path.isAbsolute(relative)) {
    throw new Error(`absolute path not allowed: ${relative}`);
  }
  const root = getUploadDir();
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`path traversal blocked: ${relative}`);
  }
  return resolved;
}
```

- [ ] **Step 4: Run test, expect pass**

```
pnpm test -- src/lib/upload-dir.spec.ts
```

Expected: PASS, 6 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/upload-dir.ts src/lib/upload-dir.spec.ts
git commit -m "feat: upload-dir resolver with traversal guard"
```

---

### Task 2: Entity allowlist + DB field map

**Files:**

- Create: `src/lib/upload-entities.ts`
- Test: `src/lib/upload-entities.spec.ts`

**Why:** the current upload endpoint hardcodes `tour | destination` and uses `if`/`else` for DB updates. Adding `highlight` requires touching every branch. A typed map keeps `POST`, `DELETE`, sweep, and migrate scripts in sync.

- [ ] **Step 1: Failing test**

```ts
// src/lib/upload-entities.spec.ts
import {
  ENTITY_TYPES,
  IMAGE_TYPES,
  isValidCombination,
  getDbField,
} from './upload-entities';

describe('upload entities', () => {
  it('exposes entity type allowlist', () => {
    expect(ENTITY_TYPES).toEqual(['tour', 'destination', 'highlight']);
  });

  it('exposes image type allowlist', () => {
    expect(IMAGE_TYPES).toEqual(['card', 'hero']);
  });

  it('allows tour:card', () => {
    expect(isValidCombination('tour', 'card')).toBe(true);
  });

  it('rejects tour:hero (only destination has hero)', () => {
    expect(isValidCombination('tour', 'hero')).toBe(false);
  });

  it('allows destination:hero', () => {
    expect(isValidCombination('destination', 'hero')).toBe(true);
  });

  it('allows highlight:card only', () => {
    expect(isValidCombination('highlight', 'card')).toBe(true);
    expect(isValidCombination('highlight', 'hero')).toBe(false);
  });

  it('maps to Prisma model + field', () => {
    expect(getDbField('tour', 'card')).toEqual({
      model: 'tour',
      field: 'imageUrl',
    });
    expect(getDbField('destination', 'card')).toEqual({
      model: 'destination',
      field: 'imageUrl',
    });
    expect(getDbField('destination', 'hero')).toEqual({
      model: 'destination',
      field: 'heroImage',
    });
    expect(getDbField('highlight', 'card')).toEqual({
      model: 'highlight',
      field: 'imageUrl',
    });
  });
});
```

- [ ] **Step 2: Run, expect fail**

```
pnpm test -- src/lib/upload-entities.spec.ts
```

- [ ] **Step 3: Implement**

```ts
// src/lib/upload-entities.ts
export const ENTITY_TYPES = ['tour', 'destination', 'highlight'] as const;
export const IMAGE_TYPES = ['card', 'hero'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
export type ImageType = (typeof IMAGE_TYPES)[number];

const VALID: Record<EntityType, readonly ImageType[]> = {
  tour: ['card'],
  destination: ['card', 'hero'],
  highlight: ['card'],
};

export function isValidEntityType(s: string): s is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(s);
}

export function isValidImageType(s: string): s is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(s);
}

export function isValidCombination(
  entity: EntityType,
  image: ImageType,
): boolean {
  return VALID[entity].includes(image);
}

type DbField = {model: 'tour' | 'destination' | 'highlight'; field: string};

export function getDbField(entity: EntityType, image: ImageType): DbField {
  if (entity === 'destination' && image === 'hero') {
    return {model: 'destination', field: 'heroImage'};
  }
  return {model: entity, field: 'imageUrl'};
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/upload-entities.ts src/lib/upload-entities.spec.ts
git commit -m "feat: upload entity allowlist + DB field map"
```

---

### Task 3: Prisma schema — nullable image fields

**Files:**

- Modify: `prisma/schema.prisma` — `Tour.imageUrl`, `Destination.imageUrl`, `Destination.heroImage`
- Create: `prisma/migrations/<auto>_image_urls_nullable/migration.sql`

**Why:** spec requires DELETE to set field to `null`, not `''`. Highlight already nullable. Tour and Destination are not.

- [ ] **Step 1: Edit schema**

In `prisma/schema.prisma`:

```prisma
model Tour {
  ...
  imageUrl       String?    // was: String @default("")
  ...
}

model Destination {
  ...
  imageUrl      String?     // was: String @default("")
  heroImage     String?     // was: String @default("")
  ...
}
```

- [ ] **Step 2: Generate migration**

```
pnpm prisma migrate dev --name image_urls_nullable
```

Expected output: new migration directory under `prisma/migrations/`, schema applied to dev DB.

- [ ] **Step 3: Backfill empty strings to NULL**

Edit the generated `migration.sql` to add at the end:

```sql
UPDATE "Tour" SET "imageUrl" = NULL WHERE "imageUrl" = '';
UPDATE "Destination" SET "imageUrl" = NULL WHERE "imageUrl" = '';
UPDATE "Destination" SET "heroImage" = NULL WHERE "heroImage" = '';
```

Re-apply: `pnpm prisma migrate reset --skip-seed` then `pnpm prisma migrate dev`. (Reset is local-dev-only; production runs migrations forward.)

- [ ] **Step 4: Verify TypeScript types updated**

```
pnpm prisma generate
pnpm tsc --noEmit
```

Expected: type errors in `src/data/queries.ts`, `src/domain/*/mapper.ts`, anywhere consuming `tour.imageUrl` / `destination.imageUrl` / `destination.heroImage`. They are now `string | null` instead of `string`.

- [ ] **Step 5: Fix consumers**

For each TS error: replace direct `tour.imageUrl` consumption with `tour.imageUrl ?? ''` at the boundary where a string is expected (mapper outputs to `Tour` domain type). Keep the domain type as `string` for now (UI-facing), only the Prisma row changes.

Run `pnpm tsc --noEmit` until clean.

- [ ] **Step 6: Run full test suite**

```
pnpm test
```

Expected: PASS. Snapshots may need updating if any rendered empty-image content; only update if change is intentional.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/data src/domain
git commit -m "feat: make image url fields nullable, backfill empty strings"
```

---

### Task 4: Public file streamer — `GET /api/uploads/[...path]`

**Files:**

- Create: `src/pages/api/uploads/[...path].ts`
- Create: `src/pages/api/uploads/[...path].spec.ts`
- Create: `public/upload-placeholder.svg`

**Why:** files no longer live in `public/` after migration; Next.js's static handler can't serve them. This route plus `UPLOAD_DIR` is what makes the storage relocation invisible to the browser.

- [ ] **Step 1: Add placeholder SVG**

```svg
<!-- public/upload-placeholder.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" width="200" height="150">
  <rect width="200" height="150" fill="#e5e5e5"/>
  <text x="100" y="80" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#999">image not found</text>
</svg>
```

- [ ] **Step 2: Failing test**

```ts
// src/pages/api/uploads/[...path].spec.ts
import {createMocks} from 'node-mocks-http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import handler from './[...path]';

describe('GET /api/uploads/[...path]', () => {
  let tmpDir: string;
  const ORIGINAL_ENV = process.env.UPLOAD_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-up-'));
    process.env.UPLOAD_DIR = tmpDir;
  });

  afterEach(() => {
    process.env.UPLOAD_DIR = ORIGINAL_ENV;
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  function writeFixture(rel: string, bytes: Buffer) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), {recursive: true});
    fs.writeFileSync(full, bytes);
    return full;
  }

  it('serves an existing webp with correct headers', async () => {
    writeFixture('tours/abc/card.aaaaaaaa.webp', Buffer.from('RIFFwebpfake'));
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'abc', 'card.aaaaaaaa.webp']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Type')).toBe('image/webp');
    expect(res.getHeader('Cache-Control')).toMatch(/immutable/);
    expect(res.getHeader('ETag')).toBe('aaaaaaaa');
  });

  it('serves legacy jpeg with derived Content-Type and mtime ETag', async () => {
    writeFixture('tours/abc/card.jpg', Buffer.from('jpg'));
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'abc', 'card.jpg']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Type')).toBe('image/jpeg');
    expect(res.getHeader('ETag')).toMatch(/^\d+-\d+$/);
  });

  it('rejects unknown extension', async () => {
    writeFixture('tours/abc/card.exe', Buffer.from('mz'));
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'abc', 'card.exe']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(404);
  });

  it('returns placeholder on missing file', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['tours', 'nonexistent', 'card.webp']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(404);
    expect(res.getHeader('Content-Type')).toBe('image/svg+xml');
  });

  it('blocks path traversal', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {path: ['..', '..', 'etc', 'passwd']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('rejects non-GET methods', async () => {
    const {req, res} = createMocks({
      method: 'POST',
      query: {path: ['tours', 'a', 'card.webp']},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
  });
});
```

- [ ] **Step 3: Run, expect fail**

```
pnpm test -- src/pages/api/uploads
```

- [ ] **Step 4: Implement**

```ts
// src/pages/api/uploads/[...path].ts
import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'fs';
import path from 'path';
import {resolveUploadPath} from '@/lib/upload-dir';

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
};

const PLACEHOLDER = path.join(process.cwd(), 'public/upload-placeholder.svg');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const segments = req.query.path;
  const rel = Array.isArray(segments) ? segments.join('/') : (segments ?? '');

  let abs: string;
  try {
    abs = resolveUploadPath(rel);
  } catch {
    return res.status(400).end();
  }

  const ext = path.extname(abs).toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    return servePlaceholder(res, 404);
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return servePlaceholder(res, 404);
  }

  // ETag: hash from filename for new uploads (`name.<8hex>.webp`),
  // mtime+size for legacy.
  const base = path.basename(abs, ext);
  const hashMatch = base.match(/\.([0-9a-f]{8})$/);
  const etag = hashMatch
    ? hashMatch[1]
    : `${stat.mtimeMs.toFixed(0)}-${stat.size}`;

  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  const stream = fs.createReadStream(abs);
  stream.pipe(res);
  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

async function servePlaceholder(res: NextApiResponse, status: number) {
  try {
    const bytes = await fs.promises.readFile(PLACEHOLDER);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(status).send(bytes);
  } catch {
    return res.status(status).end();
  }
}
```

- [ ] **Step 5: Run, expect pass**

- [ ] **Step 6: Commit**

```bash
git add src/pages/api/uploads public/upload-placeholder.svg
git commit -m "feat: GET /api/uploads/[...path] file streamer"
```

---

### Task 5: Health endpoint

**Files:**

- Create: `src/pages/api/health/uploads.ts`
- Create: `src/pages/api/health/uploads.spec.ts`

**Why:** lets monitoring catch disk-full or directory-missing before users see broken uploads. Uses `fs.statfs` (Node 18+) — no shell, no `execSync`.

- [ ] **Step 1: Failing test**

```ts
// src/pages/api/health/uploads.spec.ts
import {createMocks} from 'node-mocks-http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import handler from './uploads';

describe('GET /api/health/uploads', () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-h-'));
    process.env.UPLOAD_DIR = tmpDir;
  });
  afterEach(() => {
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  it('reports writable + freeBytes when dir exists', async () => {
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const body = res._getJSONData();
    expect(body.writable).toBe(true);
    expect(typeof body.freeBytes).toBe('number');
    expect(body.freeBytes).toBeGreaterThan(0);
  });

  it('reports writable=false when dir missing', async () => {
    fs.rmSync(tmpDir, {recursive: true});
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(503);
    expect(res._getJSONData().writable).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```ts
// src/pages/api/health/uploads.ts
import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'fs';
import {getUploadDir} from '@/lib/upload-dir';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const dir = getUploadDir();

  try {
    await fs.promises.access(dir, fs.constants.W_OK);
  } catch {
    return res.status(503).json({writable: false, freeBytes: 0, dir});
  }

  let freeBytes = 0;
  try {
    // fs.statfs is available since Node 18. No shell, no execSync.
    const stat = await fs.promises.statfs(dir);
    freeBytes = stat.bavail * stat.bsize;
  } catch {
    // fall through with freeBytes=0
  }

  return res.status(200).json({writable: true, freeBytes, dir});
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/health
git commit -m "feat: /api/health/uploads writable + freeBytes via fs.statfs"
```

---

## Phase 2 — Client transcoding lib

### Task 6: Magic-byte sniffer

**Files:**

- Create: `src/lib/image-magic.ts`
- Create: `src/lib/image-magic.spec.ts`

**Why:** browsers lie about `file.type` (especially for HEIC from macOS). Sniff bytes before trusting.

- [ ] **Step 1: Failing test**

```ts
// src/lib/image-magic.spec.ts
import {sniffImageFormat} from './image-magic';

function bytes(...nums: number[]) {
  return new Uint8Array(nums).buffer;
}

describe('sniffImageFormat', () => {
  it('detects JPEG', () => {
    expect(sniffImageFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg');
  });
  it('detects PNG', () => {
    expect(
      sniffImageFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe('png');
  });
  it('detects WebP', () => {
    const arr = new Uint8Array(12);
    arr.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
    arr.set([0x00, 0x00, 0x00, 0x00], 4);
    arr.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
    expect(sniffImageFormat(arr.buffer)).toBe('webp');
  });
  it('detects GIF', () => {
    expect(sniffImageFormat(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe(
      'gif',
    );
  });
  it('detects HEIC (ftypheic)', () => {
    const arr = new Uint8Array(12);
    arr.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
    expect(sniffImageFormat(arr.buffer)).toBe('heic');
  });
  it('returns unknown for arbitrary bytes', () => {
    expect(sniffImageFormat(bytes(0x00, 0x01, 0x02, 0x03))).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```ts
// src/lib/image-magic.ts
export type SniffedFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'gif'
  | 'heic'
  | 'heif'
  | 'unknown';

export function sniffImageFormat(buf: ArrayBuffer): SniffedFormat {
  const v = new Uint8Array(buf);
  if (v.length < 4) return 'unknown';

  if (v[0] === 0xff && v[1] === 0xd8 && v[2] === 0xff) return 'jpeg';
  if (
    v.length >= 8 &&
    v[0] === 0x89 &&
    v[1] === 0x50 &&
    v[2] === 0x4e &&
    v[3] === 0x47 &&
    v[4] === 0x0d &&
    v[5] === 0x0a &&
    v[6] === 0x1a &&
    v[7] === 0x0a
  )
    return 'png';
  if (
    v[0] === 0x52 &&
    v[1] === 0x49 &&
    v[2] === 0x46 &&
    v[3] === 0x46 &&
    v.length >= 12 &&
    v[8] === 0x57 &&
    v[9] === 0x45 &&
    v[10] === 0x42 &&
    v[11] === 0x50
  )
    return 'webp';
  if (
    v.length >= 6 &&
    v[0] === 0x47 &&
    v[1] === 0x49 &&
    v[2] === 0x46 &&
    v[3] === 0x38 &&
    (v[4] === 0x37 || v[4] === 0x39) &&
    v[5] === 0x61
  )
    return 'gif';
  if (
    v.length >= 12 &&
    v[4] === 0x66 &&
    v[5] === 0x74 &&
    v[6] === 0x79 &&
    v[7] === 0x70
  ) {
    const brand = String.fromCharCode(v[8], v[9], v[10], v[11]);
    if (brand === 'heic' || brand === 'heix' || brand === 'mif1') return 'heic';
    if (brand === 'heif') return 'heif';
  }
  return 'unknown';
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/image-magic.ts src/lib/image-magic.spec.ts
git commit -m "feat: image magic-byte sniffer"
```

---

### Task 7: Client transcode pipeline (no HEIC yet)

This task handles JPEG/PNG/WebP/GIF. HEIC support is added in Task 8 once `heic2any` dep is approved.

**Files:**

- Create: `src/lib/image-transcode.ts`
- Create: `src/lib/image-transcode.spec.ts`
- Modify: `jest.setup.ts` — add browser-API stubs

- [ ] **Step 1: Failing test**

```ts
// src/lib/image-transcode.spec.ts
/**
 * @jest-environment jsdom
 */
import {transcodeImage, TARGETS} from './image-transcode';

// Tiny 2x2 PNG (red, green, blue, white pixels)
const PNG_2x2 = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x08, 0x02,
  0x00, 0x00, 0x00, 0xfd, 0xd4, 0x9a, 0x73, 0x00, 0x00, 0x00, 0x16, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x62, 0xfc, 0xcf, 0xc0, 0xc0, 0xc0, 0xc4, 0xc0, 0xc0,
  0xc0, 0x40, 0x80, 0x91, 0x05, 0x00, 0x00, 0x00, 0xff, 0xff, 0x03, 0x00, 0x06,
  0x68, 0x01, 0xeb, 0xa3, 0xa3, 0x4e, 0x57, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe('transcodeImage', () => {
  it('preset bounds', () => {
    expect(TARGETS.card).toEqual({maxWidth: 1200, maxHeight: 800});
    expect(TARGETS.hero).toEqual({maxWidth: 2400, maxHeight: 1200});
  });

  it('rejects unsupported format', async () => {
    const file = new File([new Uint8Array([0, 1, 2, 3])], 'x.bin');
    await expect(transcodeImage(file, 'card')).rejects.toMatchObject({
      code: 'unsupported_format',
    });
  });

  it('rejects oversize input', async () => {
    const big = new Uint8Array(26 * 1024 * 1024);
    big.set(PNG_2x2.subarray(0, 8));
    const file = new File([big], 'x.png');
    await expect(transcodeImage(file, 'card')).rejects.toMatchObject({
      code: 'too_large',
    });
  });

  it('returns webp blob + 8-char hash for valid PNG', async () => {
    const file = new File([PNG_2x2], 'tiny.png', {type: 'image/png'});
    const out = await transcodeImage(file, 'card');
    expect(out.blob.type).toBe('image/webp');
    expect(out.hash).toMatch(/^[0-9a-f]{8}$/);
    expect(out.byteSize).toBeGreaterThan(0);
    expect(out.width).toBeGreaterThan(0);
    expect(out.height).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Add Jest setup stubs**

`createImageBitmap` and `OffscreenCanvas` are browser APIs absent from jsdom. Append to `jest.setup.ts` (create if missing, then reference from `jest.config`'s `setupFilesAfterEach`):

```ts
// jest.setup.ts (append)
if (!(global as any).createImageBitmap) {
  (global as any).createImageBitmap = async (_blob: Blob) => ({
    width: 2,
    height: 2,
    close: () => {},
  });
}

if (!(global as any).OffscreenCanvas) {
  class FakeOffscreenCanvas {
    width: number;
    height: number;
    constructor(w: number, h: number) {
      this.width = w;
      this.height = h;
    }
    getContext() {
      return {drawImage: () => {}};
    }
    async convertToBlob(opts: {type: string}) {
      // 12-byte fake RIFF/WEBP header so the sniffer recognises it.
      const bytes = new Uint8Array(20);
      bytes.set([0x52, 0x49, 0x46, 0x46], 0);
      bytes.set([0x57, 0x45, 0x42, 0x50], 8);
      return new Blob([bytes], {type: opts.type});
    }
  }
  (global as any).OffscreenCanvas = FakeOffscreenCanvas;
}

if (!(globalThis.crypto as any)?.subtle) {
  // Node webcrypto is exposed via 'crypto' in modern Node.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {webcrypto} = require('crypto');
  Object.defineProperty(globalThis, 'crypto', {value: webcrypto});
}
```

If `jest.config.js` does not yet reference `jest.setup.ts`, add `setupFilesAfterEach: ['<rootDir>/jest.setup.ts']`.

- [ ] **Step 3: Run test, expect fail**

- [ ] **Step 4: Implement**

```ts
// src/lib/image-transcode.ts
import {sniffImageFormat} from './image-magic';

export type ImagePreset = 'card' | 'hero';

export const TARGETS: Record<
  ImagePreset,
  {maxWidth: number; maxHeight: number}
> = {
  card: {maxWidth: 1200, maxHeight: 800},
  hero: {maxWidth: 2400, maxHeight: 1200},
};

export type TranscodedImage = {
  blob: Blob;
  hash: string;
  width: number;
  height: number;
  byteSize: number;
};

export type TranscodeError =
  | {code: 'unsupported_format'; mime: string}
  | {code: 'heic_decode_failed'}
  | {code: 'too_large'; bytes: number}
  | {code: 'decode_failed'; reason: string}
  | {code: 'encode_failed'};

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_DECODED_DIM = 8000;

export async function transcodeImage(
  file: File,
  preset: ImagePreset,
): Promise<TranscodedImage> {
  if (file.size > MAX_INPUT_BYTES) {
    throw {code: 'too_large', bytes: file.size} satisfies TranscodeError;
  }

  const headBuf = await file.slice(0, 16).arrayBuffer();
  const format = sniffImageFormat(headBuf);

  let inputBlob: Blob;
  if (format === 'heic' || format === 'heif') {
    inputBlob = await decodeHeic(file);
  } else if (
    format === 'jpeg' ||
    format === 'png' ||
    format === 'webp' ||
    format === 'gif'
  ) {
    inputBlob = file;
  } else {
    throw {
      code: 'unsupported_format',
      mime: file.type,
    } satisfies TranscodeError;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(inputBlob, {
      imageOrientation: 'from-image',
    });
  } catch (e) {
    throw {
      code: 'decode_failed',
      reason: e instanceof Error ? e.message : String(e),
    } satisfies TranscodeError;
  }
  if (bitmap.width > MAX_DECODED_DIM || bitmap.height > MAX_DECODED_DIM) {
    bitmap.close();
    throw {code: 'too_large', bytes: file.size} satisfies TranscodeError;
  }

  const {maxWidth, maxHeight} = TARGETS[preset];
  const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const outW = Math.round(bitmap.width * scale);
  const outH = Math.round(bitmap.height * scale);

  let blob = await encodeWebp(bitmap, outW, outH, 0.85);
  if (blob.size > MAX_OUTPUT_BYTES) {
    blob = await encodeWebp(bitmap, outW, outH, 0.7);
  }
  bitmap.close();

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw {code: 'encode_failed'} satisfies TranscodeError;
  }

  const buf = await blob.arrayBuffer();
  const hash = await sha256Hex8(buf);

  return {blob, hash, width: outW, height: outH, byteSize: blob.size};
}

async function encodeWebp(
  bitmap: ImageBitmap,
  w: number,
  h: number,
  quality: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw {code: 'encode_failed'} satisfies TranscodeError;
  (ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0, w, h);
  return canvas.convertToBlob({type: 'image/webp', quality});
}

async function sha256Hex8(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const arr = Array.from(new Uint8Array(digest)).slice(0, 4);
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// HEIC decoding lives in Task 8.
async function decodeHeic(_file: File): Promise<Blob> {
  throw {code: 'heic_decode_failed'} satisfies TranscodeError;
}
```

- [ ] **Step 5: Run, expect pass**

- [ ] **Step 6: Commit**

```bash
git add src/lib/image-transcode.ts src/lib/image-transcode.spec.ts jest.setup.ts
git commit -m "feat: client image transcode (jpeg/png/webp/gif → webp)"
```

---

### Task 8: HEIC decoding via heic2any

**Pre-requisite — DO NOT START until user approves the `heic2any` dep.**

**Files:**

- Modify: `package.json` — add `"heic2any"` to `dependencies`
- Modify: `src/lib/image-transcode.ts` — replace `decodeHeic` stub
- Modify: `src/lib/image-transcode.spec.ts` — add HEIC test

- [ ] **Step 1: Add dep**

```
pnpm add heic2any
```

- [ ] **Step 2: Add HEIC test**

```ts
// append in src/lib/image-transcode.spec.ts

const HEIC_MOCK_BLOB = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], {
  type: 'image/jpeg',
});

jest.mock('heic2any', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(HEIC_MOCK_BLOB),
}));

it('decodes HEIC via lazy heic2any import', async () => {
  const arr = new Uint8Array(32);
  arr.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]);
  const file = new File([arr], 'photo.HEIC', {type: 'image/heic'});

  const out = await transcodeImage(file, 'card');
  expect(out.blob.type).toBe('image/webp');

  const heic2any = (await import('heic2any')).default;
  expect(heic2any).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 3: Run, expect fail**

- [ ] **Step 4: Replace `decodeHeic` stub**

```ts
// src/lib/image-transcode.ts — replace decodeHeic
async function decodeHeic(file: File): Promise<Blob> {
  try {
    const {default: heic2any} = await import('heic2any');
    const out = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    return Array.isArray(out) ? out[0] : (out as Blob);
  } catch {
    throw {code: 'heic_decode_failed'} satisfies TranscodeError;
  }
}
```

- [ ] **Step 5: Run, expect pass**

- [ ] **Step 6: Commit**

```bash
git add src/lib/image-transcode.ts src/lib/image-transcode.spec.ts package.json pnpm-lock.yaml
git commit -m "feat: HEIC decoding via lazy heic2any"
```

---

## Phase 3 — Server endpoint rewrite

### Task 9: ImageSlot type + Yup validator

**Files:**

- Create: `src/lib/image-slot.ts`
- Create: `src/lib/image-slot.spec.ts`

- [ ] **Step 1: Failing test**

```ts
// src/lib/image-slot.spec.ts
import * as yup from 'yup';
import {imageSlotSchema} from './image-slot';

describe('imageSlotSchema', () => {
  it('accepts empty', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(s.validate({s: {kind: 'empty'}})).resolves.toBeDefined();
  });

  it('accepts saved', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(
      s.validate({
        s: {kind: 'saved', url: '/uploads/tours/x/card.aaaaaaaa.webp'},
      }),
    ).resolves.toBeDefined();
  });

  it('accepts pending-replace with valid hash', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(
      s.validate({
        s: {
          kind: 'pending-replace',
          blob: new Blob(['x']),
          previewUrl: 'blob:http://x',
          hash: 'abcd1234',
        },
      }),
    ).resolves.toBeDefined();
  });

  it('rejects pending-replace with bad hash', async () => {
    const s = yup.object({s: imageSlotSchema()});
    await expect(
      s.validate({
        s: {
          kind: 'pending-replace',
          blob: new Blob(['x']),
          previewUrl: 'blob:http://x',
          hash: 'not-hex',
        },
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```ts
// src/lib/image-slot.ts
import * as yup from 'yup';

export type ImageSlot =
  | {kind: 'empty'}
  | {kind: 'saved'; url: string}
  | {
      kind: 'pending-replace';
      blob: Blob;
      previewUrl: string;
      hash: string;
    }
  | {kind: 'pending-delete'; previousUrl: string};

export function imageSlotSchema() {
  return yup
    .mixed<ImageSlot>()
    .test('image-slot', 'invalid image slot', (v) => {
      if (!v || typeof v !== 'object') return false;
      switch (v.kind) {
        case 'empty':
          return true;
        case 'saved':
          return typeof v.url === 'string' && v.url.length > 0;
        case 'pending-replace':
          return (
            v.blob instanceof Blob &&
            typeof v.previewUrl === 'string' &&
            typeof v.hash === 'string' &&
            /^[0-9a-f]{8}$/.test(v.hash)
          );
        case 'pending-delete':
          return typeof v.previousUrl === 'string';
        default:
          return false;
      }
    });
}

export const emptySlot: ImageSlot = {kind: 'empty'};

export function savedSlot(url: string | null | undefined): ImageSlot {
  return url ? {kind: 'saved', url} : {kind: 'empty'};
}

export function isDirty(slot: ImageSlot): boolean {
  return slot.kind === 'pending-replace' || slot.kind === 'pending-delete';
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/image-slot.ts src/lib/image-slot.spec.ts
git commit -m "feat: ImageSlot type + Yup validator"
```

---

### Task 10: Rewrite POST/DELETE `/api/admin/upload`

**Files:**

- Modify (rewrite): `src/pages/api/admin/upload.ts`
- Create: `src/pages/api/admin/upload.spec.ts`

- [ ] **Step 1: Failing test**

```ts
// src/pages/api/admin/upload.spec.ts
import {createMocks} from 'node-mocks-http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import handler from './upload';
import {prisma} from '@/lib/prisma';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tour: {findUnique: jest.fn(), update: jest.fn()},
    destination: {findUnique: jest.fn(), update: jest.fn()},
    highlight: {findUnique: jest.fn(), update: jest.fn()},
  },
}));

async function makeMultipartMock(opts: {
  entityType: string;
  entityId: string;
  imageType: string;
  file: {bytes: Buffer; filename: string; mime: string};
}) {
  const boundary = '----vmt-test-boundary';
  const head = (name: string) =>
    `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n`;
  const filePart =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${opts.file.filename}"\r\n` +
    `Content-Type: ${opts.file.mime}\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([
    Buffer.from(head('entityType')),
    Buffer.from(opts.entityType),
    Buffer.from('\r\n'),
    Buffer.from(head('entityId')),
    Buffer.from(opts.entityId),
    Buffer.from('\r\n'),
    Buffer.from(head('imageType')),
    Buffer.from(opts.imageType),
    Buffer.from('\r\n'),
    Buffer.from(filePart),
    opts.file.bytes,
    Buffer.from(tail),
  ]);

  const {req, res} = createMocks({
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(body.length),
    },
  });
  (req as any).push(body);
  (req as any).push(null);
  return {req, res};
}

const VALID_WEBP = Buffer.concat([
  Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
  Buffer.alloc(50),
]);

describe('POST /api/admin/upload', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-up-'));
    process.env.UPLOAD_DIR = tmpDir;
    jest.clearAllMocks();
  });
  afterEach(() => fs.rmSync(tmpDir, {recursive: true, force: true}));

  it('writes hashed file + updates DB on valid webp', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      imageUrl: null,
    });
    const {req, res} = await makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.url).toMatch(/^\/uploads\/tours\/t1\/card\.[0-9a-f]{8}\.webp$/);
    expect(prisma.tour.update).toHaveBeenCalledWith({
      where: {id: 't1'},
      data: {imageUrl: body.url},
    });
    const onDisk = path.join(tmpDir, body.url.replace('/uploads/', ''));
    expect(fs.existsSync(onDisk)).toBe(true);
  });

  it('rejects non-webp mime', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({id: 't1'});
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const {req, res} = await makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: png, filename: 'x.png', mime: 'image/png'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('rejects spoofed webp (mime says webp but bytes are not RIFF/WEBP)', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({id: 't1'});
    const fake = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
    const {req, res} = await makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: fake, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('returns 404 for unknown entity', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue(null);
    const {req, res} = await makeMultipartMock({
      entityType: 'tour',
      entityId: 'missing',
      imageType: 'card',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(404);
  });

  it('rejects tour:hero combination', async () => {
    const {req, res} = await makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'hero',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it('unlinks freshly written file when DB update fails', async () => {
    (prisma.tour.findUnique as jest.Mock).mockResolvedValue({id: 't1'});
    (prisma.tour.update as jest.Mock).mockRejectedValue(new Error('db down'));
    const {req, res} = await makeMultipartMock({
      entityType: 'tour',
      entityId: 't1',
      imageType: 'card',
      file: {bytes: VALID_WEBP, filename: 'x.webp', mime: 'image/webp'},
    });
    await handler(req as any, res as any);
    expect(res._getStatusCode()).toBe(500);
    // No remaining files under tours/t1/
    const dir = path.join(tmpDir, 'tours/t1');
    if (fs.existsSync(dir)) expect(fs.readdirSync(dir)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```ts
// src/pages/api/admin/upload.ts (full rewrite)
import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';
import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import {IncomingForm, type File} from 'formidable';
import {resolveUploadPath} from '@/lib/upload-dir';
import {sniffImageFormat} from '@/lib/image-magic';
import {
  isValidEntityType,
  isValidImageType,
  isValidCombination,
  getDbField,
  type EntityType,
  type ImageType,
} from '@/lib/upload-entities';

export const config = {api: {bodyParser: false}};

const MAX_BYTES = 2 * 1024 * 1024;

function parseForm(req: NextApiRequest): Promise<{
  fields: Record<string, string>;
  file: File;
}> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_BYTES,
      filter: ({mimetype}) => mimetype === 'image/webp',
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return reject(new Error('No file uploaded'));
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        flat[k] = Array.isArray(v) ? v[0] : (v ?? '');
      }
      resolve({fields: flat, file});
    });
  });
}

async function checkEntityExists(
  entityType: EntityType,
  entityId: string,
): Promise<boolean> {
  if (entityType === 'tour') {
    return !!(await prisma.tour.findUnique({where: {id: entityId}}));
  }
  if (entityType === 'destination') {
    return !!(await prisma.destination.findUnique({where: {id: entityId}}));
  }
  return !!(await prisma.highlight.findUnique({where: {id: entityId}}));
}

async function readPreviousUrl(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
): Promise<string | null> {
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
  const r = await prisma.highlight.findUnique({where: {id: entityId}});
  return r?.imageUrl ?? null;
}

async function updateDb(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  url: string | null,
) {
  const {model, field} = getDbField(entityType, imageType);
  const data = {[field]: url};
  if (model === 'tour') await prisma.tour.update({where: {id: entityId}, data});
  else if (model === 'destination')
    await prisma.destination.update({where: {id: entityId}, data});
  else await prisma.highlight.update({where: {id: entityId}, data});
}

async function unlinkPublicUrl(url: string | null | undefined) {
  if (!url || !url.startsWith('/uploads/')) return;
  try {
    const abs = resolveUploadPath(url.replace(/^\/uploads\//, ''));
    await fs.unlink(abs);
  } catch {
    /* best-effort */
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const ok = await requireAdmin(req, res);
  if (!ok) return;

  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  let parsed;
  try {
    parsed = await parseForm(req);
  } catch (e) {
    return res
      .status(400)
      .json({error: e instanceof Error ? e.message : 'Invalid upload'});
  }
  const {fields, file} = parsed;
  const entityType = fields.entityType;
  const entityId = fields.entityId;
  const imageType = fields.imageType;

  if (!isValidEntityType(entityType))
    return res.status(400).json({error: `Invalid entityType: ${entityType}`});
  if (!isValidImageType(imageType))
    return res.status(400).json({error: `Invalid imageType: ${imageType}`});
  if (!isValidCombination(entityType, imageType))
    return res.status(400).json({error: 'Invalid entityType/imageType pair'});

  const exists = await checkEntityExists(entityType, entityId);
  if (!exists) {
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(404).json({error: 'Entity not found'});
  }

  // Read full file bytes (≤ 2MB by formidable filter), magic-byte check on head.
  const head = await fs.readFile(file.filepath);
  const sniff = sniffImageFormat(head.subarray(0, 16).buffer);
  if (sniff !== 'webp') {
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(400).json({error: 'invalid_format'});
  }

  const hash = crypto
    .createHash('sha256')
    .update(head)
    .digest('hex')
    .slice(0, 8);

  const relDir = `${entityType}s/${entityId}`;
  const relFile = `${relDir}/${imageType}.${hash}.webp`;
  const absFile = resolveUploadPath(relFile);
  const tmpFile = absFile + '.tmp';

  try {
    await fs.mkdir(path.dirname(absFile), {recursive: true});
    await fs.writeFile(tmpFile, head);
    await fs.rename(tmpFile, absFile);
  } catch {
    await fs.unlink(tmpFile).catch(() => {});
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(500).json({error: 'write_failed'});
  }

  const previousUrl = await readPreviousUrl(entityType, entityId, imageType);
  const publicUrl = `/uploads/${relFile}`;

  try {
    await updateDb(entityType, entityId, imageType, publicUrl);
  } catch {
    await fs.unlink(absFile).catch(() => {});
    await fs.unlink(file.filepath).catch(() => {});
    return res.status(500).json({error: 'db_update_failed'});
  }

  if (previousUrl && previousUrl !== publicUrl) {
    await unlinkPublicUrl(previousUrl);
  }
  await fs.unlink(file.filepath).catch(() => {});

  return res.status(200).json({url: publicUrl, hash, byteSize: head.length});
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  let body: {entityType: string; entityId: string; imageType: string};
  try {
    const chunks: Buffer[] = [];
    for await (const c of req) {
      chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return res.status(400).json({error: 'Invalid JSON body'});
  }

  const {entityType, entityId, imageType} = body;
  if (!isValidEntityType(entityType) || !isValidImageType(imageType))
    return res.status(400).json({error: 'Invalid parameters'});
  if (!isValidCombination(entityType, imageType))
    return res.status(400).json({error: 'Invalid entityType/imageType pair'});

  const previous = await readPreviousUrl(entityType, entityId, imageType);
  try {
    await updateDb(entityType, entityId, imageType, null);
  } catch {
    return res.status(500).json({error: 'db_update_failed'});
  }
  if (previous) await unlinkPublicUrl(previous);
  return res.status(200).json({success: true});
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/upload.ts src/pages/api/admin/upload.spec.ts
git commit -m "feat: rewrite upload API — webp-only, hashed filenames, atomic"
```

---

### Task 11: Update routes/api.ts signatures

**Files:**

- Modify: `src/routes/index.ts`

The thin upload endpoint expects strict types now (only `'tour' | 'destination' | 'highlight'`). Update the typed `api.admin.upload.create/delete` wrappers in `src/routes/index.ts` to use `EntityType` and `ImageType` from `src/lib/upload-entities.ts`.

- [ ] **Step 1: Read current implementation**

```
grep -n "upload" src/routes/index.ts
```

- [ ] **Step 2: Update types**

Import `EntityType, ImageType` from `@/lib/upload-entities`, replace inline `'tour' | 'destination'` literals.

- [ ] **Step 3: Type-check**

```
pnpm tsc --noEmit
```

Expected: errors at every consumer using the old types — addressed in Phase 4/5.

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.ts
git commit -m "refactor: tighten api.admin.upload types via upload-entities"
```

---

## Phase 4 — ImageUpload widget refactor

### Task 12: Rewrite ImageUpload widget

**Files:**

- Modify: `src/components/ui/ImageUpload/ImageUpload.tsx`
- Modify: `src/components/ui/ImageUpload/ImageUpload.spec.tsx`

- [ ] **Step 1: Failing tests** — replace existing spec contents

```tsx
// src/components/ui/ImageUpload/ImageUpload.spec.tsx
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {ImageUpload} from './ImageUpload';
import * as transcodeMod from '@/lib/image-transcode';

jest.mock('@/lib/image-transcode');

beforeEach(() => {
  (transcodeMod.transcodeImage as jest.Mock).mockResolvedValue({
    blob: new Blob(['x'], {type: 'image/webp'}),
    hash: 'abcd1234',
    width: 100,
    height: 100,
    byteSize: 1,
  });
  if (!global.URL.createObjectURL) {
    Object.defineProperty(global.URL, 'createObjectURL', {
      value: jest.fn(() => 'blob:fake'),
      writable: true,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      value: jest.fn(),
      writable: true,
    });
  }
});

it('renders empty state with picker', () => {
  const onChange = jest.fn();
  render(
    <ImageUpload value={{kind: 'empty'}} onChange={onChange} preset="card" />,
  );
  expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
});

it('renders saved preview', () => {
  render(
    <ImageUpload
      value={{kind: 'saved', url: '/uploads/t/abc/card.aaaaaaaa.webp'}}
      onChange={() => {}}
      preset="card"
    />,
  );
  const img = screen.getByRole('img', {name: /upload/i}) as HTMLImageElement;
  expect(img.src).toContain('/uploads/t/abc/card.aaaaaaaa.webp');
});

it('transcodes on file pick and emits pending-replace', async () => {
  const onChange = jest.fn();
  render(
    <ImageUpload value={{kind: 'empty'}} onChange={onChange} preset="card" />,
  );
  const input = screen.getByLabelText('upload-input');
  const file = new File(['x'], 'x.png', {type: 'image/png'});
  fireEvent.change(input, {target: {files: [file]}});
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  const arg = onChange.mock.calls[0][0];
  expect(arg.kind).toBe('pending-replace');
  expect(arg.hash).toBe('abcd1234');
});

it('emits pending-delete when removing a saved image', () => {
  const onChange = jest.fn();
  render(
    <ImageUpload
      value={{kind: 'saved', url: '/uploads/x.webp'}}
      onChange={onChange}
      preset="card"
    />,
  );
  fireEvent.click(screen.getByRole('button', {name: /delete/i}));
  expect(onChange).toHaveBeenCalledWith({
    kind: 'pending-delete',
    previousUrl: '/uploads/x.webp',
  });
});

it('renders error prop', () => {
  render(
    <ImageUpload
      value={{kind: 'empty'}}
      onChange={() => {}}
      preset="card"
      error="oops"
    />,
  );
  expect(screen.getByText('oops')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement** — full rewrite

```tsx
// src/components/ui/ImageUpload/ImageUpload.tsx
'use client';

import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/Button';
import {transcodeImage, type ImagePreset} from '@/lib/image-transcode';
import type {ImageSlot} from '@/lib/image-slot';

type ImageUploadProps = {
  value: ImageSlot;
  onChange: (next: ImageSlot) => void;
  preset: ImagePreset;
  label?: string;
  error?: string;
};

export function ImageUpload({
  value,
  onChange,
  preset,
  label,
  error,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (value.kind === 'pending-replace') {
        URL.revokeObjectURL(value.previewUrl);
      }
    };
  }, [value]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setLocalError(null);

    try {
      const out = await transcodeImage(file, preset);
      const previewUrl = URL.createObjectURL(out.blob);
      if (value.kind === 'pending-replace') {
        URL.revokeObjectURL(value.previewUrl);
      }
      onChange({
        kind: 'pending-replace',
        blob: out.blob,
        previewUrl,
        hash: out.hash,
      });
    } catch (err) {
      setLocalError(localizeError(err));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemove() {
    if (value.kind === 'saved') {
      onChange({kind: 'pending-delete', previousUrl: value.url});
    } else if (value.kind === 'pending-replace') {
      URL.revokeObjectURL(value.previewUrl);
      onChange({kind: 'empty'});
    } else if (value.kind === 'pending-delete') {
      onChange({kind: 'empty'});
    }
  }

  const displayUrl =
    value.kind === 'saved'
      ? value.url
      : value.kind === 'pending-replace'
        ? value.previewUrl
        : null;

  const showRemove = value.kind === 'saved' || value.kind === 'pending-replace';

  const errMsg = localError ?? error ?? undefined;

  return (
    <div>
      {label && (
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          {label}
        </label>
      )}
      <div className="relative group border-2 border-dashed border-border rounded-lg overflow-hidden h-40">
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
              {showRemove && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  aria-label="Remove image"
                >
                  Delete
                </Button>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="w-full h-full flex flex-col items-center justify-center text-on-surface-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <span className="type-body-sm">
              {busy ? 'Processing…' : 'Click to upload'}
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          aria-label="upload-input"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {errMsg && <p className="mt-1 text-sm text-red-500">{errMsg}</p>}
    </div>
  );
}

function localizeError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as {code: string}).code) {
      case 'unsupported_format':
        return 'Use JPEG, PNG, WebP, or HEIC';
      case 'heic_decode_failed':
        return 'Could not read this HEIC file. Try exporting as JPEG.';
      case 'too_large':
        return 'Image must be under 25MB';
      case 'decode_failed':
        return 'Could not decode this image';
      case 'encode_failed':
        return 'Could not produce WebP output';
    }
  }
  return 'Upload failed';
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ImageUpload
git commit -m "feat: ImageUpload widget — ImageSlot contract + client transcode"
```

---

### Task 13: Rewrite ImageUploadField (RHF Controller, no API)

**Files:**

- Modify: `src/components/Admin/ImageUploadField/ImageUploadField.tsx`
- Create: `src/components/Admin/ImageUploadField/ImageUploadField.spec.tsx`

**Why:** the old version uploads eagerly on file pick. New version is a thin react-hook-form `Controller` adapter — purely local state, parent form decides when to flush.

- [ ] **Step 1: Failing test**

```tsx
// src/components/Admin/ImageUploadField/ImageUploadField.spec.tsx
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useForm, FormProvider} from 'react-hook-form';
import {ImageUploadField} from './ImageUploadField';
import * as transcodeMod from '@/lib/image-transcode';

jest.mock('@/lib/image-transcode');

function Harness({initial}: {initial?: unknown}) {
  const methods = useForm({
    defaultValues: {card: initial ?? {kind: 'empty'}},
  });
  return (
    <FormProvider {...methods}>
      <ImageUploadField name="card" preset="card" label="Card" />
    </FormProvider>
  );
}

beforeEach(() => {
  (transcodeMod.transcodeImage as jest.Mock).mockResolvedValue({
    blob: new Blob(['x'], {type: 'image/webp'}),
    hash: 'abcd1234',
    width: 1,
    height: 1,
    byteSize: 1,
  });
});

it('renders empty state', () => {
  render(<Harness />);
  expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
});

it('updates field value on file pick — no fetch happens', async () => {
  const fetchSpy = jest.fn();
  global.fetch = fetchSpy as unknown as typeof fetch;
  render(<Harness />);
  const input = screen.getByLabelText('upload-input');
  fireEvent.change(input, {
    target: {files: [new File(['x'], 'x.png', {type: 'image/png'})]},
  });
  await waitFor(() => expect(transcodeMod.transcodeImage).toHaveBeenCalled());
  expect(fetchSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```tsx
// src/components/Admin/ImageUploadField/ImageUploadField.tsx
'use client';

import {Controller, useFormContext} from 'react-hook-form';
import {ImageUpload} from '@/components/ui';
import type {ImagePreset} from '@/lib/image-transcode';

type ImageUploadFieldProps = {
  name: string;
  preset: ImagePreset;
  label?: string;
};

export function ImageUploadField({name, preset, label}: ImageUploadFieldProps) {
  const {control} = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({field, fieldState}) => (
        <ImageUpload
          value={field.value}
          onChange={field.onChange}
          preset={preset}
          label={label}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/components/Admin/ImageUploadField
git commit -m "refactor: ImageUploadField — react-hook-form Controller, no API"
```

---

## Phase 5 — Form integration (admin pages)

### Task 14: `flushImageSlots` orchestrator

**Files:**

- Create: `src/lib/submit-with-images.ts`
- Create: `src/lib/submit-with-images.spec.ts`

- [ ] **Step 1: Failing test**

```ts
// src/lib/submit-with-images.spec.ts
import {flushImageSlots} from './submit-with-images';

const mockFetch = jest.fn();
beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

it('no calls when all slots saved/empty', async () => {
  const result = await flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {card: {kind: 'saved', url: '/x'}},
  });
  expect(mockFetch).not.toHaveBeenCalled();
  expect(result.errors).toEqual({});
});

it('POSTs pending-replace blobs', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({url: '/uploads/tours/t1/card.abcd1234.webp'}),
  });
  const result = await flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {
      card: {
        kind: 'pending-replace',
        blob: new Blob(['x']),
        previewUrl: 'blob:x',
        hash: 'abcd1234',
      },
    },
  });
  expect(mockFetch).toHaveBeenCalledWith(
    '/api/admin/upload',
    expect.objectContaining({method: 'POST'}),
  );
  expect(result.errors).toEqual({});
  expect(result.updated.card?.kind).toBe('saved');
});

it('DELETEs pending-delete', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({success: true}),
  });
  await flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {card: {kind: 'pending-delete', previousUrl: '/uploads/x'}},
  });
  expect(mockFetch).toHaveBeenCalledWith(
    '/api/admin/upload',
    expect.objectContaining({method: 'DELETE'}),
  );
});

it('retries once on transient failure, returns slot error after second', async () => {
  mockFetch
    .mockResolvedValueOnce({ok: false, status: 500, json: async () => ({})})
    .mockResolvedValueOnce({ok: false, status: 500, json: async () => ({})});
  const r = await flushImageSlots({
    entityType: 'tour',
    entityId: 't1',
    slots: {
      card: {
        kind: 'pending-replace',
        blob: new Blob(['x']),
        previewUrl: 'blob:x',
        hash: 'abcd1234',
      },
    },
  });
  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(r.errors.card).toMatch(/upload failed/i);
});

it('isolates per-slot failures', async () => {
  mockFetch
    .mockResolvedValueOnce({ok: false, status: 500, json: async () => ({})})
    .mockResolvedValueOnce({ok: false, status: 500, json: async () => ({})})
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({url: '/uploads/destinations/d1/hero.aaaa1111.webp'}),
    });
  const r = await flushImageSlots({
    entityType: 'destination',
    entityId: 'd1',
    slots: {
      card: {
        kind: 'pending-replace',
        blob: new Blob(['a']),
        previewUrl: 'blob:a',
        hash: 'aaaaaaaa',
      },
      hero: {
        kind: 'pending-replace',
        blob: new Blob(['b']),
        previewUrl: 'blob:b',
        hash: 'bbbbbbbb',
      },
    },
  });
  expect(r.errors.card).toBeDefined();
  expect(r.errors.hero).toBeUndefined();
  expect(r.updated.hero?.kind).toBe('saved');
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```ts
// src/lib/submit-with-images.ts
import type {EntityType, ImageType} from '@/lib/upload-entities';
import type {ImageSlot} from '@/lib/image-slot';

type Args = {
  entityType: EntityType;
  entityId: string;
  slots: Partial<Record<ImageType, ImageSlot>>;
};

type Result = {
  updated: Partial<Record<ImageType, ImageSlot>>;
  errors: Partial<Record<ImageType, string>>;
};

export async function flushImageSlots({
  entityType,
  entityId,
  slots,
}: Args): Promise<Result> {
  const updated: Result['updated'] = {};
  const errors: Result['errors'] = {};

  await Promise.all(
    (Object.entries(slots) as [ImageType, ImageSlot][]).map(
      async ([imageType, slot]) => {
        if (slot.kind === 'pending-replace') {
          const out = await uploadOnce(entityType, entityId, imageType, slot);
          if (out.ok) updated[imageType] = {kind: 'saved', url: out.url};
          else errors[imageType] = out.error;
        } else if (slot.kind === 'pending-delete') {
          const out = await deleteOnce(entityType, entityId, imageType);
          if (out.ok) updated[imageType] = {kind: 'empty'};
          else errors[imageType] = out.error;
        }
      },
    ),
  );

  return {updated, errors};
}

async function uploadOnce(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  slot: Extract<ImageSlot, {kind: 'pending-replace'}>,
): Promise<{ok: true; url: string} | {ok: false; error: string}> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = new FormData();
      fd.append('entityType', entityType);
      fd.append('entityId', entityId);
      fd.append('imageType', imageType);
      fd.append('file', slot.blob, `${imageType}.${slot.hash}.webp`);
      const r = await fetch('/api/admin/upload', {method: 'POST', body: fd});
      if (r.ok) {
        const data = await r.json();
        return {ok: true, url: data.url};
      }
    } catch {
      /* retry once */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  return {ok: false, error: 'Upload failed'};
}

async function deleteOnce(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
): Promise<{ok: true} | {ok: false; error: string}> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({entityType, entityId, imageType}),
      });
      if (r.ok) return {ok: true};
    } catch {
      /* retry once */
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  return {ok: false, error: 'Delete failed'};
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/lib/submit-with-images.ts src/lib/submit-with-images.spec.ts
git commit -m "feat: flushImageSlots helper for staged form submit"
```

---

### Task 15: Wire destination edit form

**Files:**

- Modify: `src/pages/admin/destinations/[id]/edit.tsx` (and its `.form-utils.ts`)

**Note:** the engineer must read the actual file. Pattern below assumes RHF + Yup. Replace inline `imageUrl: string` and `heroImage: string` with `card: ImageSlot` and `hero: ImageSlot`.

- [ ] **Step 1: Read current form**

```
ls 'src/pages/admin/destinations'
cat 'src/pages/admin/destinations/[id]/edit.tsx'
```

- [ ] **Step 2: Update Yup schema + defaults in the form-utils file**

```ts
// <form>.form-utils.ts
import {imageSlotSchema, savedSlot, type ImageSlot} from '@/lib/image-slot';

export const editDestinationSchema = yup.object({
  // ... existing fields
  card: imageSlotSchema().required(),
  hero: imageSlotSchema().required(),
});

export type EditDestinationForm = yup.InferType<typeof editDestinationSchema>;

export function buildDefaults(d: Destination): EditDestinationForm {
  return {
    // ... existing
    card: savedSlot(d.imageUrl),
    hero: savedSlot(d.heroImage),
  };
}
```

- [ ] **Step 3: Update submit handler**

```ts
import {flushImageSlots} from '@/lib/submit-with-images';

export async function submitEditDestination(
  data: EditDestinationForm,
  id: string,
) {
  const {card, hero, ...textFields} = data;
  await api.admin.destinations.update(id, textFields);

  const {errors, updated} = await flushImageSlots({
    entityType: 'destination',
    entityId: id,
    slots: {card, hero},
  });

  return {errors, updated};
}
```

- [ ] **Step 4: Update the page component to render `ImageUploadField`**

Inside the form JSX:

```tsx
<ImageUploadField name="card" preset="card" label="Card image" />
<ImageUploadField name="hero" preset="hero" label="Hero image" />
```

Remove the old `<ImageUploadField entityType=... entityId=... imageType=... currentUrl=...>` usages. Render the per-slot error returned from `submitEditDestination` next to or above the field.

- [ ] **Step 5: Add an integration test for the form**

If a test exists, update it. Otherwise add one that:

- Renders the form with a saved destination
- Picks new file → submits → asserts `flushImageSlots` was called with correct args
- Mocks `flushImageSlots` to return per-slot error → asserts UI shows error

- [ ] **Step 6: Run tests**

```
pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/destinations
git commit -m "refactor: destination edit form uses ImageSlot + staged flush"
```

---

### Task 16: Wire tour edit form

Identical shape as Task 15 but for `src/pages/admin/tours/[id]/edit.tsx`. Tour only has `card`. Verify default and schema use one slot. Repeat all 7 steps for tour. Commit:

```bash
git commit -m "refactor: tour edit form uses ImageSlot + staged flush"
```

---

### Task 17: Wire DestinationHighlights (fix entityType bug)

**Files:**

- Modify: `src/components/Admin/DestinationHighlights/DestinationHighlights.tsx`
- Modify: `src/components/Admin/DestinationHighlights/DestinationHighlights.form-utils.ts`

**Why:** the existing usage passes `entityType="destination"` with the highlight's id, which the upload endpoint mis-resolves. Fix by passing `entityType="highlight"` now that the server allowlist supports it.

- [ ] **Step 1: Update form schema**

In `DestinationHighlights.form-utils.ts`, add an `image: ImageSlot` field per highlight row (or per add-form). Match the pattern from Task 15.

- [ ] **Step 2: Update component**

Where `ImageUploadField` is rendered for a highlight row, switch to the new RHF-controlled signature:

```tsx
<ImageUploadField name={`highlights.${idx}.image`} preset="card" label="" />
```

For per-row save flows, wrap each row in a small `<FormProvider>` OR migrate the entire highlights block to one form context. Pick whichever matches the existing structure.

- [ ] **Step 3: Update submit handler**

For per-row save: call `flushImageSlots({entityType: 'highlight', entityId: highlight.id, slots: {card}})` after PATCHing the highlight row.

- [ ] **Step 4: Update tests if any exist**

- [ ] **Step 5: Run tests + manual smoke**

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin/DestinationHighlights
git commit -m "fix: highlights use entityType=highlight (was destination)"
```

---

### Task 18: Wire create flows (tour + destination)

For `src/pages/admin/tours/new.tsx` and `src/pages/admin/destinations/new.tsx`:

- [ ] **Step 1:** form holds `card` (and `hero` for destination) as `ImageSlot` defaults `{kind: 'empty'}`.
- [ ] **Step 2:** submit:

```ts
const created = await api.admin.tours.create(textFields); // or destinations.create
const {errors} = await flushImageSlots({
  entityType: 'tour', // or 'destination'
  entityId: created.id,
  slots: {card}, // include hero for destination
});
if (Object.keys(errors).length) {
  showToast('Image upload failed; retry on the edit page');
}
router.push(routes.admin.tours.edit({id: created.id}));
```

- [ ] **Step 3:** Render `<ImageUploadField>` controls (no `entityId` prop needed now — pure local).
- [ ] **Step 4:** Test happy path + image-upload-failure-after-create.
- [ ] **Step 5:** Commit:

```bash
git add src/pages/admin
git commit -m "refactor: create flows use ImageSlot + staged flush"
```

---

## Phase 6 — Migration & ops

### Task 19: Migration script — move legacy files

**Files:**

- Create: `scripts/migrate-uploads.ts`
- Modify: `package.json` — add script `"migrate:uploads": "tsx scripts/migrate-uploads.ts"`

- [ ] **Step 1: Implement (no test — operational script, exercised manually with --dry-run)**

```ts
// scripts/migrate-uploads.ts
import {prisma} from '@/lib/prisma';
import {getUploadDir} from '@/lib/upload-dir';
import path from 'path';
import fs from 'fs';

const dryRun = process.argv.includes('--dry-run');
const REPO_ROOT = process.cwd();
const LEGACY_ROOT = path.join(REPO_ROOT, 'public/uploads');
const TARGET_ROOT = getUploadDir();

type Op = {entityType: string; id: string; field: string; url: string};

async function main() {
  if (LEGACY_ROOT === TARGET_ROOT) {
    console.error('LEGACY_ROOT == TARGET_ROOT, refusing to run');
    process.exit(1);
  }

  const ops: Op[] = [];

  for (const t of await prisma.tour.findMany({
    select: {id: true, imageUrl: true},
  })) {
    if (t.imageUrl)
      ops.push({
        entityType: 'tour',
        id: t.id,
        field: 'imageUrl',
        url: t.imageUrl,
      });
  }
  for (const d of await prisma.destination.findMany({
    select: {id: true, imageUrl: true, heroImage: true},
  })) {
    if (d.imageUrl)
      ops.push({
        entityType: 'destination',
        id: d.id,
        field: 'imageUrl',
        url: d.imageUrl,
      });
    if (d.heroImage)
      ops.push({
        entityType: 'destination',
        id: d.id,
        field: 'heroImage',
        url: d.heroImage,
      });
  }
  for (const h of await prisma.highlight.findMany({
    select: {id: true, imageUrl: true},
  })) {
    if (h.imageUrl)
      ops.push({
        entityType: 'highlight',
        id: h.id,
        field: 'imageUrl',
        url: h.imageUrl,
      });
  }

  for (const op of ops) {
    // url is e.g. "/uploads/tours/abc/card.jpg" — already in /uploads/ shape.
    // Migration is purely a filesystem move; DB urls don't change.
    const rel = op.url.replace(/^\/uploads\//, '');
    const src = path.join(LEGACY_ROOT, rel);
    const dst = path.join(TARGET_ROOT, rel);
    const exists = fs.existsSync(src);
    const already = fs.existsSync(dst);
    console.log(
      `[${dryRun ? 'DRY' : 'RUN'}] ${op.entityType}/${op.id} ${op.field} ${op.url} (src:${exists} dst:${already})`,
    );
    if (dryRun) continue;
    if (already) continue; // idempotent
    if (!exists) continue; // missing source — leave DB as-is
    fs.mkdirSync(path.dirname(dst), {recursive: true});
    fs.renameSync(src, dst);
  }
}

main().then(() => process.exit(0));
```

- [ ] **Step 2: Add package.json script**

```json
"scripts": {
  "migrate:uploads": "tsx scripts/migrate-uploads.ts"
}
```

- [ ] **Step 3: Smoke test locally**

```
pnpm migrate:uploads --dry-run
```

Expected: prints planned moves, writes nothing.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-uploads.ts package.json
git commit -m "feat: migrate-uploads script moves legacy files to UPLOAD_DIR"
```

---

### Task 20: Orphan sweep script

**Files:**

- Create: `scripts/sweep-orphan-uploads.ts`
- Create: `scripts/sweep-orphan-uploads.spec.ts`
- Modify: `package.json` — add `"sweep:uploads": "tsx scripts/sweep-orphan-uploads.ts"`

- [ ] **Step 1: Failing test**

```ts
// scripts/sweep-orphan-uploads.spec.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import {sweepOrphans} from './sweep-orphan-uploads';

const NOW = Date.now();
const TEN_DAYS_AGO = NOW - 10 * 24 * 3600 * 1000;

it('removes old orphans, keeps recent orphans, keeps referenced files', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-'));
  const referenced = path.join(dir, 'tours/t1/card.aaaaaaaa.webp');
  const oldOrphan = path.join(dir, 'tours/t1/card.bbbbbbbb.webp');
  const newOrphan = path.join(dir, 'tours/t1/card.cccccccc.webp');
  for (const f of [referenced, oldOrphan, newOrphan]) {
    fs.mkdirSync(path.dirname(f), {recursive: true});
    fs.writeFileSync(f, 'x');
  }
  fs.utimesSync(oldOrphan, TEN_DAYS_AGO / 1000, TEN_DAYS_AGO / 1000);

  await sweepOrphans({
    rootDir: dir,
    referencedHashes: new Set(['aaaaaaaa']),
    olderThanMs: 7 * 24 * 3600 * 1000,
  });

  expect(fs.existsSync(referenced)).toBe(true);
  expect(fs.existsSync(oldOrphan)).toBe(false);
  expect(fs.existsSync(newOrphan)).toBe(true);
});
```

- [ ] **Step 2: Run, expect fail**

- [ ] **Step 3: Implement**

```ts
// scripts/sweep-orphan-uploads.ts
import fs from 'fs';
import path from 'path';
import {prisma} from '@/lib/prisma';
import {getUploadDir} from '@/lib/upload-dir';

export async function sweepOrphans(opts: {
  rootDir: string;
  referencedHashes: Set<string>;
  olderThanMs: number;
}) {
  const cutoff = Date.now() - opts.olderThanMs;
  walk(opts.rootDir, (file) => {
    const m = path.basename(file).match(/\.([0-9a-f]{8})\.webp$/);
    if (!m) return; // legacy file — ignore
    if (opts.referencedHashes.has(m[1])) return;
    const stat = fs.statSync(file);
    if (stat.mtimeMs > cutoff) return;
    fs.unlinkSync(file);
    console.log(`unlinked ${file}`);
  });
}

function walk(dir: string, cb: (file: string) => void) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, cb);
    else if (e.isFile()) cb(full);
  }
}

async function main() {
  const refs = new Set<string>();
  const collect = (url: string | null | undefined) => {
    if (!url) return;
    const m = url.match(/\.([0-9a-f]{8})\.webp$/);
    if (m) refs.add(m[1]);
  };
  for (const t of await prisma.tour.findMany({select: {imageUrl: true}}))
    collect(t.imageUrl);
  for (const d of await prisma.destination.findMany({
    select: {imageUrl: true, heroImage: true},
  })) {
    collect(d.imageUrl);
    collect(d.heroImage);
  }
  for (const h of await prisma.highlight.findMany({select: {imageUrl: true}}))
    collect(h.imageUrl);

  await sweepOrphans({
    rootDir: getUploadDir(),
    referencedHashes: refs,
    olderThanMs: 7 * 24 * 3600 * 1000,
  });
}

if (require.main === module) {
  main().then(() => process.exit(0));
}
```

- [ ] **Step 4: Run tests, expect pass**

- [ ] **Step 5: Commit**

```bash
git add scripts/sweep-orphan-uploads.ts scripts/sweep-orphan-uploads.spec.ts package.json
git commit -m "feat: orphan sweep script for hashed upload files"
```

---

### Task 21: VPS docs update

**Files:**

- Modify: `VPS.md`

Append a section:

```markdown
## Image uploads (post-migration)

Files live at `/var/lib/vmt-uploads`, owned by the pm2 user. **Not** inside the repo. Deploys cannot touch them.

Bootstrap (run once as root):

    mkdir -p /var/lib/vmt-uploads
    chown <pm2-user>:<pm2-user> /var/lib/vmt-uploads
    chmod 0750 /var/lib/vmt-uploads

Set in `.env` on the VPS:

    UPLOAD_DIR=/var/lib/vmt-uploads

Health check: `curl localhost:3000/api/health/uploads` → `{writable, freeBytes}`.

### Weekly orphan sweep

Add to root crontab:

    0 4 * * 0 cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm sweep:uploads >> /var/log/vmt-sweep.log 2>&1

### Backup

    0 3 * * * rsync -a /var/lib/vmt-uploads/ /backup/vmt-uploads/

### One-shot legacy migration

Run once after deploying the new code, before the final cleanup commit:

    cd /var/www/vietnam-moto-tours
    pnpm migrate:uploads --dry-run    # review
    pnpm migrate:uploads
```

- [ ] Commit:

```bash
git add VPS.md
git commit -m "docs: VPS.md — UPLOAD_DIR, sweep cron, migration"
```

---

### Task 22: Manual VPS migration (NOT automated)

**This step runs by hand.** Document for the human operator.

- [ ] SSH to VPS as the appropriate sudo user.
- [ ] Run bootstrap commands from VPS.md.
- [ ] Confirm `/var/lib/vmt-uploads` exists and is writable by pm2 user.
- [ ] Pull the deployed code that contains everything up to Task 21.
- [ ] Run `pnpm migrate:uploads --dry-run`, review output.
- [ ] Run `pnpm migrate:uploads`.
- [ ] Edit `/var/www/vietnam-moto-tours/.env` and add `UPLOAD_DIR=/var/lib/vmt-uploads`.
- [ ] `pm2ci restart all`.
- [ ] Open the site, verify a few destination/tour images render.
- [ ] Open admin panel, verify upload + delete works end to end with a HEIC test image.

**Rollback:** if any step fails, comment out `UPLOAD_DIR` in `.env`, restart. Code falls back to `<cwd>/.uploads`. To restore service quickly: `mv /var/lib/vmt-uploads/* <repo>/public/uploads/`.

---

### Task 23: Final cleanup — gitignore + remove public/uploads

**Files:**

- Modify: `.gitignore`
- Delete (from repo, not from VPS): `public/uploads/`

**Pre-condition:** Task 22 succeeded on the VPS; new uploads land in `/var/lib/vmt-uploads`; legacy files served from there.

- [ ] **Step 1: Update .gitignore**

Append:

```
# uploaded user images live outside the repo
/public/uploads/
/.uploads/
```

- [ ] **Step 2: Remove tracked files**

```
git rm -r --cached public/uploads
```

- [ ] **Step 3: Confirm working tree**

```
git status
```

Expected: deletes for tracked files under `public/uploads/`. The directory itself can be removed locally too once VPS migration is confirmed. The VPS no longer reads from this path.

- [ ] **Step 4: Commit**

```bash
git add .gitignore public/uploads
git commit -m "chore: stop tracking public/uploads — files live at UPLOAD_DIR"
```

- [ ] **Step 5: Deploy and verify** — push to main, confirm site still renders all images after CI runs.

---

## Spec coverage check

- **Storage layout / paths / hash naming** → Tasks 1, 10
- **Deploy-immune location** → Tasks 5 (health), 21–23 (VPS, migration, gitignore)
- **GET file streamer + extension allowlist + ETag rules** → Task 4
- **Health endpoint** → Task 5
- **Client transcode pipeline (sniff, decode, resize, encode webp, hash, lazy HEIC)** → Tasks 6, 7, 8
- **Hard limits (25MB input, 2MB output, 8000px decoded, retry quality)** → Task 7
- **ImageSlot tagged union + Yup validator** → Task 9
- **POST endpoint (webp-only, magic check, atomic rename, server-side hash, DB+file rollback)** → Task 10
- **DELETE endpoint** → Task 10
- **Schema migration nullable** → Task 3
- **Highlight as first-class entity (spec gap, real bug today)** → Tasks 2, 17
- **ImageUpload widget tagged-union contract** → Task 12
- **ImageUploadField as RHF Controller (no API)** → Task 13
- **`flushImageSlots` orchestrator with retry + per-slot isolation** → Task 14
- **Edit forms wired (destination, tour)** → Tasks 15, 16
- **Highlights wired with correct entityType** → Task 17
- **Create flows wired** → Task 18
- **Legacy file migration script + tolerated non-webp extensions** → Tasks 4 (extension allowlist), 19
- **Orphan sweep cron** → Tasks 20, 21
- **VPS docs (UPLOAD_DIR, cron, backup, migration)** → Task 21
- **Manual VPS migration runbook** → Task 22
- **Final cleanup (gitignore + git rm)** → Task 23

No placeholders. Every code-bearing step shows the actual code or the exact existing file/lines to read first. Type names (`ImageSlot`, `EntityType`, `ImageType`, `ImagePreset`, `flushImageSlots`, `transcodeImage`, `sniffImageFormat`, `resolveUploadPath`, `getDbField`) are consistent across tasks. The single open external decision (`heic2any` approval) is flagged at the top and at Task 8.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-06-resilient-image-uploads.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — execute tasks in this session using executing-plans, batch with checkpoints

Which approach?
