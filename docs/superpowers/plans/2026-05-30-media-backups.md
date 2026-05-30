# Media (Uploads) Backups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auto-rotated, downloadable `tar.gz` backups of `UPLOAD_DIR` alongside the existing DB backups, by generalizing the DB backup module into a kind-parameterized core.

**Architecture:** Refactor `db-backup.ts` into `backup-core.ts` (kind-aware list/retention/createBackup/filename) + `backup-kinds.ts` (DB + media descriptors, each with a `produce()`), add `tar-archive.ts` (media producer), then make the API/UI/cron kind-aware. The `/admin/backups` page gets a Database/Media toggle. DB filenames stay `vmt-<ts>-<source>.dump`; media is `vmt-media-<ts>-<source>.tar.gz`.

**Tech Stack:** Next.js 16 Pages Router, TypeScript, `tar` + `pg_dump` system binaries (spawn, no shell), Jest + node-mocks-http, next-intl (DB-seeded translations).

**Spec:** `docs/superpowers/specs/2026-05-30-media-backups-design.md`

> **Command note:** `npx` is denied. Use `pnpm exec jest <path>`, `pnpm typecheck`, `pnpm lint <paths>`. Do NOT run seed/cron scripts in-session (no DB/uploads guaranteed). Never edit `.claude/settings.json` or invoke meta-skills to work around a blocked command — if blocked, STOP and report.

---

## File Structure

| File | Responsibility | Status |
| --- | --- | --- |
| `src/lib/backup-dir.ts` | `BACKUP_DIR` resolver | unchanged |
| `src/lib/pg-dump.ts` | DB dump spawn wrapper | unchanged |
| `src/lib/tar-archive.ts` | `buildTarArgs` + `archiveUploads` (media producer) | **new** |
| `src/lib/backup-core.ts` | Kind-aware filename/list/retention/createBackup | **new** |
| `src/lib/backup-kinds.ts` | `DB_BACKUP_KIND`, `MEDIA_BACKUP_KIND`, registry, `parseAnyBackupFilename` | **new** |
| `src/lib/db-backup.ts` + `.spec.ts` | Logic moved to backup-core | **delete** |
| `src/pages/api/admin/backups/index.ts` | GET/POST now kind-aware (`?kind=`) | modify |
| `src/pages/api/admin/backups/[filename]/download.ts` | validate via `parseAnyBackupFilename` | modify |
| `src/routes/api.ts` | `backups.list/create` take `kind`; `BackupMeta.kind` | modify |
| `src/pages/admin/backups/index.tsx` | DB/Media `SegmentedControl` toggle | modify |
| `scripts/backup-db.ts` | use `createBackup(DB_BACKUP_KIND, 'scheduled')` | modify |
| `scripts/backup-media.ts` | media cron entry | **new** |
| `package.json` | add `backup:media` script | modify |
| `prisma/seed-backups-translations.ts` | parameterize subtitle + add kind labels | modify |
| `.claude/VPS.md` | extend Backups runbook for media | modify |

---

## Task 1: tar-archive (media producer)

**Files:**
- Create: `src/lib/tar-archive.ts`
- Test: `src/lib/tar-archive.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/tar-archive.spec.ts
import {buildTarArgs} from './tar-archive';

describe('buildTarArgs', () => {
  it('builds gzip create args with -C source dir and "." entry', () => {
    expect(buildTarArgs('/var/lib/vmt-uploads', '/tmp/out.tar.gz')).toEqual([
      '-czf',
      '/tmp/out.tar.gz',
      '-C',
      '/var/lib/vmt-uploads',
      '.',
    ]);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL (module not found)**

Run: `pnpm exec jest src/lib/tar-archive.spec.ts`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/tar-archive.ts
import {spawn} from 'child_process';
import {existsSync} from 'fs';
import {getUploadDir} from './upload-dir';

export function buildTarArgs(uploadDir: string, outPath: string): string[] {
  return ['-czf', outPath, '-C', uploadDir, '.'];
}

/**
 * Archives the entire UPLOAD_DIR tree to a gzip tarball at outPath.
 * Rejects (with stderr) on nonzero exit or spawn failure; rejects if
 * UPLOAD_DIR does not exist.
 */
export function archiveUploads(outPath: string): Promise<void> {
  const uploadDir = getUploadDir();
  if (!existsSync(uploadDir)) {
    return Promise.reject(new Error(`UPLOAD_DIR does not exist: ${uploadDir}`));
  }
  const bin = process.env.TAR_BIN ?? 'tar';
  const args = buildTarArgs(uploadDir, outPath);

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}: ${stderr.trim()}`));
    });
  });
}
```

- [ ] **Step 4: Run test, expect PASS (1 test)**

Run: `pnpm exec jest src/lib/tar-archive.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/tar-archive.ts src/lib/tar-archive.spec.ts
git commit -m "feat(backups): add tar archive producer for media"
```

---

## Task 2: backup-core (kind-parameterized)

**Files:**
- Create: `src/lib/backup-core.ts`
- Test: `src/lib/backup-core.spec.ts`

This absorbs the generic logic from `db-backup.ts`, parameterized by a `BackupKind`. The spec uses self-contained test kinds (real regexes inline) so it does not depend on `backup-kinds.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/backup-core.spec.ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  formatBackupFilename,
  parseBackupFilename,
  listBackups,
  enforceRetention,
  nextAvailableFilename,
  createBackup,
  type BackupKind,
} from './backup-core';

// Self-contained test kinds (real regexes/prefixes/exts).
const DB: BackupKind = {
  id: 'db',
  prefix: 'vmt-',
  ext: '.dump',
  max: 10,
  nameRe:
    /^vmt-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.dump$/,
  produce: (out) => {
    fs.writeFileSync(out, 'DUMP');
    return Promise.resolve();
  },
};
const MEDIA: BackupKind = {
  id: 'media',
  prefix: 'vmt-media-',
  ext: '.tar.gz',
  max: 3,
  nameRe:
    /^vmt-media-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.tar\.gz$/,
  produce: (out) => {
    fs.writeFileSync(out, 'TARGZ');
    return Promise.resolve();
  },
};

describe('formatBackupFilename', () => {
  const d = new Date('2026-05-30T03:00:12.345Z');
  it('encodes db filename', () => {
    expect(formatBackupFilename(DB, d, 'manual')).toBe(
      'vmt-2026-05-30T03-00-12Z-manual.dump',
    );
  });
  it('encodes media filename', () => {
    expect(formatBackupFilename(MEDIA, d, 'scheduled')).toBe(
      'vmt-media-2026-05-30T03-00-12Z-scheduled.tar.gz',
    );
  });
});

describe('parseBackupFilename', () => {
  it('parses its own kind, rejects the other kind', () => {
    expect(parseBackupFilename(DB, 'vmt-2026-05-30T03-00-12Z-manual.dump')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'manual',
    });
    expect(
      parseBackupFilename(MEDIA, 'vmt-media-2026-05-30T03-00-12Z-manual.tar.gz'),
    ).toEqual({createdAt: '2026-05-30T03:00:12Z', source: 'manual'});
    // cross-kind rejection
    expect(parseBackupFilename(DB, 'vmt-media-2026-05-30T03-00-12Z-manual.tar.gz')).toBeNull();
    expect(parseBackupFilename(MEDIA, 'vmt-2026-05-30T03-00-12Z-manual.dump')).toBeNull();
  });
  it('accepts collision suffix', () => {
    expect(parseBackupFilename(MEDIA, 'vmt-media-2026-05-30T03-00-12Z-manual-2.tar.gz')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'manual',
    });
  });
});

describe('listBackups + enforceRetention (per-kind isolation)', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-core-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });
  const touch = (n: string) => fs.writeFileSync(path.join(dir, n), 'x');

  it('lists only the requested kind, newest first', async () => {
    touch('vmt-2026-05-01T03-00-00Z-manual.dump');
    touch('vmt-2026-05-30T03-00-00Z-scheduled.dump');
    touch('vmt-media-2026-05-15T03-00-00Z-manual.tar.gz');
    const db = await listBackups(DB);
    expect(db.map((m) => m.filename)).toEqual([
      'vmt-2026-05-30T03-00-00Z-scheduled.dump',
      'vmt-2026-05-01T03-00-00Z-manual.dump',
    ]);
    expect(db.every((m) => m.kind === 'db')).toBe(true);
    const media = await listBackups(MEDIA);
    expect(media.map((m) => m.filename)).toEqual([
      'vmt-media-2026-05-15T03-00-00Z-manual.tar.gz',
    ]);
    expect(media[0].kind).toBe('media');
  });

  it('retention respects kind.max and only deletes that kind', async () => {
    for (let i = 0; i < 5; i++) {
      const day = String(i + 1).padStart(2, '0');
      touch(`vmt-media-2026-05-${day}T03-00-00Z-manual.tar.gz`);
    }
    touch('vmt-2026-05-01T03-00-00Z-manual.dump'); // db file must survive
    await enforceRetention(MEDIA); // max 3
    const remainingMedia = fs.readdirSync(dir).filter((n) => n.endsWith('.tar.gz'));
    expect(remainingMedia).toHaveLength(3);
    expect(remainingMedia).toContain('vmt-media-2026-05-05T03-00-00Z-manual.tar.gz');
    expect(remainingMedia).not.toContain('vmt-media-2026-05-01T03-00-00Z-manual.tar.gz');
    expect(fs.existsSync(path.join(dir, 'vmt-2026-05-01T03-00-00Z-manual.dump'))).toBe(true);
  });
});

describe('createBackup', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-core-create-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });

  it('runs the kind producer and returns metadata', async () => {
    const meta = await createBackup(MEDIA, 'manual');
    expect(meta.kind).toBe('media');
    expect(meta.source).toBe('manual');
    expect(meta.byteSize).toBe(5); // 'TARGZ'
    expect(fs.existsSync(path.join(dir, meta.filename))).toBe(true);
    expect(meta.filename.endsWith('.tar.gz')).toBe(true);
  });

  it('cleans up the partial file when the producer fails', async () => {
    const failing: BackupKind = {
      ...MEDIA,
      produce: () => Promise.reject(new Error('boom')),
    };
    await expect(createBackup(failing, 'manual')).rejects.toThrow('boom');
    expect(fs.readdirSync(dir).filter((n) => n.endsWith('.tar.gz'))).toHaveLength(0);
  });
});

describe('nextAvailableFilename', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-core-next-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });

  it('appends a numeric suffix on collision', () => {
    const d = new Date('2026-05-30T03:00:12.000Z');
    const base = formatBackupFilename(MEDIA, d, 'manual');
    fs.writeFileSync(path.join(dir, base), 'x');
    expect(nextAvailableFilename(MEDIA, d, 'manual')).toBe(
      'vmt-media-2026-05-30T03-00-12Z-manual-2.tar.gz',
    );
  });
});
```

- [ ] **Step 2: Run test, expect FAIL (module not found)**

Run: `pnpm exec jest src/lib/backup-core.spec.ts`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/backup-core.ts
import fs from 'fs';
import {existsSync} from 'fs';
import path from 'path';
import {getBackupDir, resolveBackupPath} from './backup-dir';

export type BackupSource = 'manual' | 'scheduled';
export type BackupKindId = 'db' | 'media';

export type BackupKind = {
  id: BackupKindId;
  prefix: string;
  ext: string;
  max: number;
  nameRe: RegExp;
  produce: (outPath: string) => Promise<void>;
};

export type BackupMeta = {
  filename: string;
  createdAt: string; // ISO-8601, e.g. 2026-05-30T03:00:12Z
  source: BackupSource;
  byteSize: number;
  kind: BackupKindId;
};

export function formatBackupFilename(
  kind: BackupKind,
  date: Date,
  source: BackupSource,
): string {
  const ts = date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  return `${kind.prefix}${ts}-${source}${kind.ext}`;
}

export function parseBackupFilename(
  kind: BackupKind,
  name: string,
): {createdAt: string; source: BackupSource} | null {
  const m = name.match(kind.nameRe);
  if (!m) return null;
  const [, date, hh, mm, ss, source] = m;
  return {createdAt: `${date}T${hh}:${mm}:${ss}Z`, source: source as BackupSource};
}

export async function listBackups(kind: BackupKind): Promise<BackupMeta[]> {
  const dir = getBackupDir();
  let names: string[];
  try {
    names = await fs.promises.readdir(dir);
  } catch {
    return [];
  }
  const metas: BackupMeta[] = [];
  for (const name of names) {
    const parsed = parseBackupFilename(kind, name);
    if (!parsed) continue;
    const stat = await fs.promises.stat(path.join(dir, name));
    metas.push({
      filename: name,
      createdAt: parsed.createdAt,
      source: parsed.source,
      byteSize: stat.size,
      kind: kind.id,
    });
  }
  metas.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) ||
      b.filename.localeCompare(a.filename),
  );
  return metas;
}

export async function enforceRetention(kind: BackupKind): Promise<void> {
  const metas = await listBackups(kind);
  for (const m of metas.slice(kind.max)) {
    await fs.promises.rm(resolveBackupPath(m.filename), {force: true});
  }
}

export function nextAvailableFilename(
  kind: BackupKind,
  date: Date,
  source: BackupSource,
): string {
  const base = formatBackupFilename(kind, date, source);
  const dir = getBackupDir();
  if (!existsSync(path.join(dir, base))) return base;
  const stem = base.slice(0, -kind.ext.length);
  let n = 2;
  while (existsSync(path.join(dir, `${stem}-${n}${kind.ext}`))) n++;
  return `${stem}-${n}${kind.ext}`;
}

async function statToMeta(
  kind: BackupKind,
  filename: string,
): Promise<BackupMeta> {
  const parsed = parseBackupFilename(kind, filename);
  if (!parsed) throw new Error(`not a ${kind.id} backup filename: ${filename}`);
  const stat = await fs.promises.stat(resolveBackupPath(filename));
  return {
    filename,
    createdAt: parsed.createdAt,
    source: parsed.source,
    byteSize: stat.size,
    kind: kind.id,
  };
}

export async function createBackup(
  kind: BackupKind,
  source: BackupSource,
): Promise<BackupMeta> {
  const dir = getBackupDir();
  await fs.promises.mkdir(dir, {recursive: true});

  const filename = nextAvailableFilename(kind, new Date(), source);
  const abs = resolveBackupPath(filename);

  try {
    await kind.produce(abs);
  } catch (err) {
    await fs.promises.rm(abs, {force: true});
    throw err;
  }

  await enforceRetention(kind);
  return statToMeta(kind, filename);
}
```

- [ ] **Step 4: Run test, expect PASS (all backup-core tests)**

Run: `pnpm exec jest src/lib/backup-core.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup-core.ts src/lib/backup-core.spec.ts
git commit -m "feat(backups): add kind-parameterized backup core"
```

---

## Task 3: backup-kinds (descriptors + registry)

**Files:**
- Create: `src/lib/backup-kinds.ts`
- Test: `src/lib/backup-kinds.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/backup-kinds.spec.ts
jest.mock('./pg-dump', () => ({dumpDatabase: jest.fn().mockResolvedValue(undefined)}));
jest.mock('./tar-archive', () => ({archiveUploads: jest.fn().mockResolvedValue(undefined)}));

import {dumpDatabase} from './pg-dump';
import {archiveUploads} from './tar-archive';
import {
  DB_BACKUP_KIND,
  MEDIA_BACKUP_KIND,
  getBackupKind,
  parseAnyBackupFilename,
} from './backup-kinds';

describe('descriptors', () => {
  it('db kind has dump ext, max 10; media has tar.gz, max 3', () => {
    expect(DB_BACKUP_KIND).toMatchObject({id: 'db', ext: '.dump', max: 10});
    expect(MEDIA_BACKUP_KIND).toMatchObject({id: 'media', ext: '.tar.gz', max: 3});
  });
});

describe('DB_BACKUP_KIND.produce', () => {
  const ORIGINAL = process.env.DATABASE_URL;
  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL;
    jest.clearAllMocks();
  });
  it('strips the DATABASE_URL query and calls dumpDatabase', async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db?schema=public';
    await DB_BACKUP_KIND.produce('/tmp/x.dump');
    expect(dumpDatabase).toHaveBeenCalledWith('postgresql://u:p@h:5432/db', '/tmp/x.dump');
  });
  it('throws when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    await expect(DB_BACKUP_KIND.produce('/tmp/x.dump')).rejects.toThrow(/DATABASE_URL/);
  });
});

describe('MEDIA_BACKUP_KIND.produce', () => {
  afterEach(() => jest.clearAllMocks());
  it('calls archiveUploads with the out path', async () => {
    await MEDIA_BACKUP_KIND.produce('/tmp/x.tar.gz');
    expect(archiveUploads).toHaveBeenCalledWith('/tmp/x.tar.gz');
  });
});

describe('getBackupKind + parseAnyBackupFilename', () => {
  it('resolves kind ids, null for unknown', () => {
    expect(getBackupKind('db')).toBe(DB_BACKUP_KIND);
    expect(getBackupKind('media')).toBe(MEDIA_BACKUP_KIND);
    expect(getBackupKind('bogus')).toBeNull();
  });
  it('identifies the kind of any valid filename', () => {
    expect(parseAnyBackupFilename('vmt-2026-05-30T03-00-12Z-manual.dump')?.kind).toBe('db');
    expect(parseAnyBackupFilename('vmt-media-2026-05-30T03-00-12Z-scheduled.tar.gz')?.kind).toBe('media');
    expect(parseAnyBackupFilename('evil.txt')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL (module not found)**

Run: `pnpm exec jest src/lib/backup-kinds.spec.ts`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/backup-kinds.ts
import {dumpDatabase} from './pg-dump';
import {archiveUploads} from './tar-archive';
import {parseBackupFilename, type BackupKind, type BackupKindId, type BackupSource} from './backup-core';

export const DB_BACKUP_KIND: BackupKind = {
  id: 'db',
  prefix: 'vmt-',
  ext: '.dump',
  max: 10,
  nameRe:
    /^vmt-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.dump$/,
  produce: async (outPath) => {
    const url = (process.env.DATABASE_URL ?? '').split('?')[0];
    if (!url) throw new Error('DATABASE_URL is not set');
    await dumpDatabase(url, outPath);
  },
};

export const MEDIA_BACKUP_KIND: BackupKind = {
  id: 'media',
  prefix: 'vmt-media-',
  ext: '.tar.gz',
  max: 3,
  nameRe:
    /^vmt-media-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.tar\.gz$/,
  produce: (outPath) => archiveUploads(outPath),
};

export const BACKUP_KINDS: BackupKind[] = [DB_BACKUP_KIND, MEDIA_BACKUP_KIND];

export function getBackupKind(id: string): BackupKind | null {
  return BACKUP_KINDS.find((k) => k.id === id) ?? null;
}

export function parseAnyBackupFilename(
  name: string,
): {kind: BackupKindId; createdAt: string; source: BackupSource} | null {
  for (const kind of BACKUP_KINDS) {
    const parsed = parseBackupFilename(kind, name);
    if (parsed) return {kind: kind.id, ...parsed};
  }
  return null;
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `pnpm exec jest src/lib/backup-kinds.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup-kinds.ts src/lib/backup-kinds.spec.ts
git commit -m "feat(backups): add db + media backup kind descriptors"
```

---

## Task 4: Make the list/create API route kind-aware

**Files:**
- Modify: `src/pages/api/admin/backups/index.ts`
- Test: `src/__tests__/api/admin/backups/index.spec.ts` (rewrite)

- [ ] **Step 1: Rewrite the test**

```ts
/**
 * @jest-environment node
 */
import {createMocks} from 'node-mocks-http';
import handler from '@/pages/api/admin/backups';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/backup-core', () => ({
  listBackups: jest.fn(),
  createBackup: jest.fn(),
}));
jest.mock('@/lib/backup-kinds', () => {
  const DB = {id: 'db', max: 10};
  const MEDIA = {id: 'media', max: 3};
  return {
    DB_BACKUP_KIND: DB,
    MEDIA_BACKUP_KIND: MEDIA,
    getBackupKind: (id: string) => (id === 'db' ? DB : id === 'media' ? MEDIA : null),
  };
});

import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup} from '@/lib/backup-core';
import {DB_BACKUP_KIND, MEDIA_BACKUP_KIND} from '@/lib/backup-kinds';

const dbMeta = {
  filename: 'vmt-2026-05-30T03-00-00Z-manual.dump',
  createdAt: '2026-05-30T03:00:00Z',
  source: 'manual' as const,
  byteSize: 1234,
  kind: 'db' as const,
};

describe('GET /api/admin/backups', () => {
  afterEach(() => jest.clearAllMocks());

  it('defaults to db kind, returns list + maxBackups', async () => {
    (listBackups as jest.Mock).mockResolvedValue([dbMeta]);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(listBackups).toHaveBeenCalledWith(DB_BACKUP_KIND);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({backups: [dbMeta], maxBackups: 10});
  });

  it('uses media kind when ?kind=media', async () => {
    (listBackups as jest.Mock).mockResolvedValue([]);
    const {req, res} = createMocks({method: 'GET', query: {kind: 'media'}});
    await handler(req as never, res as never);
    expect(listBackups).toHaveBeenCalledWith(MEDIA_BACKUP_KIND);
    expect(res._getJSONData()).toEqual({backups: [], maxBackups: 3});
  });

  it('rejects an invalid kind with 400', async () => {
    const {req, res} = createMocks({method: 'GET', query: {kind: 'bogus'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
    expect(listBackups).not.toHaveBeenCalled();
  });

  it('blocks unauthorized callers', async () => {
    (requireAdmin as jest.Mock).mockResolvedValueOnce(false);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(listBackups).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/backups', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates a backup of the requested kind and returns the updated list', async () => {
    (createBackup as jest.Mock).mockResolvedValue({...dbMeta, kind: 'media'});
    (listBackups as jest.Mock).mockResolvedValue([]);
    const {req, res} = createMocks({method: 'POST', query: {kind: 'media'}});
    await handler(req as never, res as never);
    expect(createBackup).toHaveBeenCalledWith(MEDIA_BACKUP_KIND, 'manual');
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual({backups: [], maxBackups: 3});
  });

  it('returns 500 when the producer fails', async () => {
    (createBackup as jest.Mock).mockRejectedValue(new Error('tar exited with code 1'));
    const {req, res} = createMocks({method: 'POST'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData().error).toMatch(/tar/);
  });

  it('rejects other methods with 405', async () => {
    const {req, res} = createMocks({method: 'DELETE'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(405);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL (route still imports old db-backup)**

Run: `pnpm exec jest src/__tests__/api/admin/backups/index.spec.ts`

- [ ] **Step 3: Rewrite the route**

```ts
// src/pages/api/admin/backups/index.ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup} from '@/lib/backup-core';
import {getBackupKind, DB_BACKUP_KIND} from '@/lib/backup-kinds';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  const rawKind = req.query.kind;
  const kindId = Array.isArray(rawKind) ? rawKind[0] : rawKind;
  const kind = kindId ? getBackupKind(kindId) : DB_BACKUP_KIND;
  if (!kind) {
    return res.status(400).json({error: 'Invalid backup kind'});
  }

  if (req.method === 'GET') {
    const backups = await listBackups(kind);
    return res.status(200).json({backups, maxBackups: kind.max});
  }

  if (req.method === 'POST') {
    try {
      await createBackup(kind, 'manual');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      return res.status(500).json({error: message});
    }
    const backups = await listBackups(kind);
    return res.status(201).json({backups, maxBackups: kind.max});
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 4: Run test, expect PASS (8 tests)**

Run: `pnpm exec jest src/__tests__/api/admin/backups/index.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/backups/index.ts src/__tests__/api/admin/backups/index.spec.ts
git commit -m "feat(backups): make list/create route kind-aware"
```

---

## Task 5: Make the download route validate any kind

**Files:**
- Modify: `src/pages/api/admin/backups/[filename]/download.ts`
- Test: `src/__tests__/api/admin/backups/download.spec.ts` (extend)

- [ ] **Step 1: Update the test** — change the import-level validation expectation and add a media case. Replace the existing `VALID` constant block and add a media test. The full updated file:

```ts
/**
 * @jest-environment node
 */
import {createMocks} from 'node-mocks-http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import handler from '@/pages/api/admin/backups/[filename]/download';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));
import {requireAdmin} from '@/lib/admin-auth';

describe('GET /api/admin/backups/[filename]/download', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;
  const DB_NAME = 'vmt-2026-05-30T03-00-00Z-manual.dump';
  const MEDIA_NAME = 'vmt-media-2026-05-30T03-00-00Z-scheduled.tar.gz';

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-dl-'));
    process.env.BACKUP_DIR = dir;
    fs.writeFileSync(path.join(dir, DB_NAME), 'DUMP');
    fs.writeFileSync(path.join(dir, MEDIA_NAME), 'TARGZ');
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
    jest.clearAllMocks();
  });

  it('streams a db dump with an attachment header', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: DB_NAME}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Disposition')).toContain(`filename="${DB_NAME}"`);
    expect(res.getHeader('Content-Type')).toBe('application/octet-stream');
  });

  it('streams a media archive', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: MEDIA_NAME}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Disposition')).toContain(`filename="${MEDIA_NAME}"`);
  });

  it('rejects a non-backup filename with 400', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: 'evil.txt'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
  });

  it('rejects a traversal filename with 400', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: '../../etc/passwd'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
  });

  it('returns 404 for a missing but valid-named file', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {filename: 'vmt-2026-01-01T00-00-00Z-manual.dump'},
    });
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(404);
  });

  it('blocks unauthorized callers', async () => {
    (requireAdmin as jest.Mock).mockImplementationOnce(async (_req, res) => {
      res.status(401).json({error: 'Unauthenticated'});
      return false;
    });
    const {req, res} = createMocks({method: 'GET', query: {filename: DB_NAME}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(401);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL (route imports parseBackupFilename from db-backup)**

Run: `pnpm exec jest src/__tests__/api/admin/backups/download.spec.ts`

- [ ] **Step 3: Update the route** — change only the import + the validation call:

Replace line 5 `import {parseBackupFilename} from '@/lib/db-backup';` with:

```ts
import {parseAnyBackupFilename} from '@/lib/backup-kinds';
```

Replace the validation condition (line 21) `if (!filename || !parseBackupFilename(filename)) {` with:

```ts
  if (!filename || !parseAnyBackupFilename(filename)) {
```

Everything else in the file stays identical.

- [ ] **Step 4: Run test, expect PASS (6 tests)**

Run: `pnpm exec jest src/__tests__/api/admin/backups/download.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add 'src/pages/api/admin/backups/[filename]/download.ts' src/__tests__/api/admin/backups/download.spec.ts
git commit -m "feat(backups): download route accepts any backup kind"
```

---

## Task 6: Retire db-backup.ts; repoint the cron script

**Files:**
- Modify: `scripts/backup-db.ts`
- Delete: `src/lib/db-backup.ts`, `src/lib/db-backup.spec.ts`

After Tasks 4 & 5, the only remaining importer of `db-backup.ts` is `scripts/backup-db.ts`. Repoint it, then delete the old module + its spec (its logic now lives in `backup-core.ts` + `backup-core.spec.ts`).

- [ ] **Step 1: Update `scripts/backup-db.ts`** — change only the `main()` body's import + call. Replace:

```ts
async function main() {
  const {createBackup} = await import('../src/lib/db-backup');
  const meta = await createBackup('scheduled');
  console.log(
    `[backup-db] created ${meta.filename} (${meta.byteSize} bytes) at ${meta.createdAt}`,
  );
}
```

with:

```ts
async function main() {
  const {createBackup} = await import('../src/lib/backup-core');
  const {DB_BACKUP_KIND} = await import('../src/lib/backup-kinds');
  const meta = await createBackup(DB_BACKUP_KIND, 'scheduled');
  console.log(
    `[backup-db] created ${meta.filename} (${meta.byteSize} bytes) at ${meta.createdAt}`,
  );
}
```

- [ ] **Step 2: Delete the old module + spec**

```bash
git rm src/lib/db-backup.ts src/lib/db-backup.spec.ts
```

- [ ] **Step 3: Verify nothing else imports db-backup**

Run: `grep -rn "db-backup" src/ scripts/`
Expected: NO matches (empty output). If any remain, update them to `backup-core` / `backup-kinds` before continuing.

- [ ] **Step 4: Typecheck + run the whole backup suite**

Run: `pnpm typecheck`
Expected: no errors.
Run: `pnpm exec jest backup`
Expected: all backup suites pass (backup-core, backup-kinds, tar-archive, index, download).

- [ ] **Step 5: Commit**

```bash
git add scripts/backup-db.ts
git commit -m "refactor(backups): retire db-backup module for kind-based core"
```

---

## Task 7: API client — kind param + BackupMeta.kind

**Files:**
- Modify: `src/routes/api.ts`

- [ ] **Step 1: Update the types** — in `src/routes/api.ts`, change the `BackupMeta` type (added earlier) to include `kind`:

```ts
type BackupMeta = {
  filename: string;
  createdAt: string;
  source: 'manual' | 'scheduled';
  byteSize: number;
  kind: 'db' | 'media';
};
```

- [ ] **Step 2: Update the client** — replace the existing `backups` block inside `api.admin` with:

```ts
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
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no errors. (The page in Task 8 will consume the new `kind` arg; until then the no-arg calls still compile because `kind` is optional.)

- [ ] **Step 4: Commit**

```bash
git add src/routes/api.ts
git commit -m "feat(backups): kind param on backups api client"
```

---

## Task 8: Page — Database/Media toggle

**Files:**
- Modify: `src/pages/admin/backups/index.tsx`

- [ ] **Step 1: Rewrite the page** to add a `SegmentedControl` kind toggle, kind-scoped fetch/create, and a retention count driven by the response. Full file:

```tsx
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {Button, Badge, SegmentedControl} from '@/components/ui';
import {api} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';

type BackupKind = 'db' | 'media';

type BackupMeta = {
  filename: string;
  createdAt: string;
  source: 'manual' | 'scheduled';
  byteSize: number;
  kind: BackupKind;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export default function BackupsPage() {
  const t = useTranslations('admin.backups');
  const tCommon = useTranslations('common');
  const {setLoading: setAdminLoading} = useAdminLoading();

  const [kind, setKind] = useState<BackupKind>('db');
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [maxBackups, setMaxBackups] = useState(10);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.admin.backups.list(kind).then(({data}) => {
      if (data) {
        setBackups(data.backups);
        setMaxBackups(data.maxBackups);
      }
      setLoading(false);
    });
  }, [kind]);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const {data, error: err} = await api.admin.backups.create(kind);
    setCreating(false);
    if (err || !data) {
      setError(err ?? t('createError'));
      return;
    }
    setBackups(data.backups);
    setMaxBackups(data.maxBackups);
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          subtitle={t('subtitle', {count: maxBackups})}
          actions={
            <div className="flex items-center gap-3">
              <SegmentedControl<BackupKind>
                value={kind}
                onChange={setKind}
                options={[
                  {value: 'db', label: t('kindDb')},
                  {value: 'media', label: t('kindMedia')},
                ]}
              />
              <Button
                variant="primary"
                onClick={handleCreate}
                loading={creating}
                icon={
                  <i
                    className={`fa ${kind === 'media' ? 'fa-photo-film' : 'fa-database'} text-xs`}
                  />
                }
              >
                {t('create')}
              </Button>
            </div>
          }
        />
      }
    >
      {error && <p className="mb-4 text-danger type-label-sm">{error}</p>}
      {backups.length === 0 ? (
        <p className="text-on-surface-secondary">{t('empty')}</p>
      ) : (
        <table className="w-full bg-surface-elevated border border-border">
          <thead>
            <tr className="text-left type-label-sm uppercase text-on-surface-secondary">
              <th className="p-3">{tCommon('created')}</th>
              <th className="p-3">{t('sourceLabel')}</th>
              <th className="p-3">{tCommon('size')}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.filename} className="border-t border-border">
                <td className="p-3 font-medium">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
                <td className="p-3">
                  <Badge variant={b.source === 'scheduled' ? 'info' : 'neutral'}>
                    {b.source === 'scheduled'
                      ? t('sourceScheduled')
                      : t('sourceManual')}
                  </Badge>
                </td>
                <td className="p-3 text-on-surface-secondary tabular-nums">
                  {formatBytes(b.byteSize)}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost-primary"
                    size="sm"
                    href={api.admin.backups.downloadUrl(b.filename)}
                    icon={<i className="fa fa-download text-xs" />}
                  >
                    {tCommon('download')}
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

export async function getServerSideProps({locale}: GetServerSidePropsContext) {
  const {getMessagesFromDb} = await import('@/data/queries');
  const messages = await getMessagesFromDb(locale ?? 'vi');
  return {props: {messages: messages ?? {}}};
}
```

Note: `SegmentedControl` is exported from `@/components/ui`. Its `onChange` is `(value: T) => void`, so `setKind` (a `Dispatch<SetStateAction<BackupKind>>`) is assignment-compatible.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck`
Expected: no errors.
Run: `pnpm lint src/pages/admin/backups/index.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/backups/index.tsx
git commit -m "feat(backups): add database/media toggle to backups page"
```

---

## Task 9: Media cron script + package script

**Files:**
- Create: `scripts/backup-media.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/backup-media.ts`** (same env-loading boilerplate as `scripts/backup-db.ts`, guarding on `BACKUP_DIR` + `UPLOAD_DIR`):

```ts
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.BACKUP_DIR || !process.env.UPLOAD_DIR) {
  const candidatePaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'),
  ];
  let envPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      envPath = p;
      break;
    }
  }
  if (envPath) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  }
}

async function main() {
  const {createBackup} = await import('../src/lib/backup-core');
  const {MEDIA_BACKUP_KIND} = await import('../src/lib/backup-kinds');
  const meta = await createBackup(MEDIA_BACKUP_KIND, 'scheduled');
  console.log(
    `[backup-media] created ${meta.filename} (${meta.byteSize} bytes) at ${meta.createdAt}`,
  );
}

main().catch((err) => {
  console.error('[backup-media] failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the package script** — in `package.json` `scripts`, after `"backup:db"`:

```json
    "backup:media": "npx tsx scripts/backup-media.ts",
```

- [ ] **Step 3: Typecheck (do NOT run the script)**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/backup-media.ts package.json
git commit -m "feat(backups): add monthly media backup cron script"
```

---

## Task 10: Translations — parameterize subtitle + kind labels

**Files:**
- Modify: `prisma/seed-backups-translations.ts`

- [ ] **Step 1: Update the `entries` array.** Change the `subtitle` entry to a `{count}` template and add two kind labels. Replace the `subtitle` entry and add after `createError`:

```ts
  {
    namespace: 'admin.backups',
    key: 'subtitle',
    valueEn: 'Keeps the last {count} backups; the oldest is removed automatically.',
    valueVi: 'Giữ {count} bản sao lưu gần nhất; bản cũ nhất sẽ tự động bị xóa.',
  },
  {namespace: 'admin.backups', key: 'kindDb', valueEn: 'Database', valueVi: 'Cơ sở dữ liệu'},
  {namespace: 'admin.backups', key: 'kindMedia', valueEn: 'Media', valueVi: 'Tệp phương tiện'},
```

(Leave the other entries unchanged. The upsert is idempotent — re-running updates `subtitle` in place. The final `console.log` count will be 13.)

- [ ] **Step 2: Typecheck (do NOT run the seed — it runs on the VPS)**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed-backups-translations.ts
git commit -m "feat(backups): parameterize subtitle, add kind toggle labels"
```

---

## Task 11: VPS docs

**Files:**
- Modify: `.claude/VPS.md`

- [ ] **Step 1: Update the "Database Backups" section** in `.claude/VPS.md`. Change the heading to `## Backups` and append media coverage. Find the existing `## Database Backups` heading and replace it with `## Backups`, then insert the following after the existing "Restore a backup" subsection (and before "Manual backup from the admin panel"):

````markdown
### Media (uploads) backups

Media backups are gzip tarballs of `UPLOAD_DIR` (`vmt-media-<ts>-<source>.tar.gz`), stored in the same `BACKUP_DIR`, **retention 3**.

- `tar` must be on PATH (override with `TAR_BIN` in `.env` if needed).
- Monthly cron (1st of month, 03:30 — offset from the DB job) in root crontab:

  ```cron
  30 3 1 * * cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm backup:media >> /var/log/vmt-backup.log 2>&1
  ```

- Restore (extracts into `UPLOAD_DIR`, overwriting same-named files; to restore an exact snapshot, clear `UPLOAD_DIR` contents first):

  ```bash
  tar -xzf /var/lib/vmt-backups/vmt-media-<ts>-<source>.tar.gz -C "$UPLOAD_DIR"
  ```

- The existing daily `rsync` mirror to `/backup/vmt-uploads/` stays — it is a continuous latest-only mirror; these snapshots add versioned history.
````

Also update the "Manual backup from the admin panel" line to mention the toggle: append " Use the Database / Media toggle to switch which kind you create or download."

- [ ] **Step 2: Commit**

```bash
git add .claude/VPS.md
git commit -m "docs(backups): document media backup runbook"
```

---

## Task 12: Full verification

- [ ] **Step 1: Run the whole backup test suite**

Run: `pnpm exec jest backup`
Expected: all suites pass — `tar-archive`, `backup-core`, `backup-kinds`, `api/admin/backups/index`, `api/admin/backups/download`. (No `db-backup` suite — it was removed.)

- [ ] **Step 2: Confirm no dangling references**

Run: `grep -rn "db-backup" src/ scripts/`
Expected: empty.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Lint the touched files**

Run: `pnpm lint src/lib/tar-archive.ts src/lib/backup-core.ts src/lib/backup-kinds.ts src/pages/api/admin/backups src/pages/admin/backups/index.tsx scripts/backup-media.ts`
Expected: no errors.

- [ ] **Step 5: Manual smoke (dev server, optional — needs `tar` + DB)**

Run `pnpm dev`, open `/admin/backups`, toggle to **Media**, click **Create backup**, confirm a `.tar.gz` row appears, Download yields a tarball. Toggle back to **Database**, confirm DB backups still list.

No separate commit — all work already committed.

---

## Self-Review Notes (for the implementer)

- **`AdminPageHeader` actions slot** holds both the toggle and the create button in a flex row. Confirm `AdminPageHeader` renders `actions` without truncation on a narrow header; if it wraps awkwardly, that is acceptable (functional, not styling-blocked).
- **`SegmentedControl` generic:** call site uses `SegmentedControl<BackupKind>`; its `onChange: (value: T) => void` accepts `setKind`.
- **Subtitle count:** driven by the response `maxBackups`, defaulting to 10 before first load. Brief stale count on kind switch is acceptable.
- **No new dependencies:** `tar`/`pg_dump` are system binaries; `tsx` is invoked via `npx tsx` in package scripts (repo convention, runs on VPS).
- **Filename schemes never collide:** DB regex requires a digit immediately after `vmt-`; media requires the literal `vmt-media-`. Verified in `backup-core`/`backup-kinds` tests.
