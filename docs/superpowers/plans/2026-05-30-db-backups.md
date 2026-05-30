# Database Backups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins generate, list, download, and auto-rotate PostgreSQL backups from the admin panel, plus a monthly automated backup, with files stored outside the repo.

**Architecture:** A `BACKUP_DIR` resolver (mirroring `upload-dir.ts`) + a `db-backup` core lib (filename encoding, listing, retention, `pg_dump` orchestration) shared by auth-gated API routes and a cron script. Metadata is encoded in filenames (no DB table). A dedicated `/admin/backups` page generates and lists backups; downloads stream through an ADMIN-only route.

**Tech Stack:** Next.js 16 Pages Router, TypeScript, `pg_dump` (custom format), Jest + node-mocks-http, next-intl (DB-seeded translations), Prisma.

> **Command note:** `npx` is denied by `.claude/settings.json`. Use `pnpm exec jest <path>` (tests), `pnpm typecheck` (= `tsc --noEmit`), `pnpm lint <paths>` (= eslint). Scripts whose package.json entry uses `npx tsx` (seed, cron) run on the VPS — do NOT execute them in-session; just create + commit the files. Never edit `.claude/settings.json` or invoke meta-skills to work around a blocked command — if blocked, STOP and report.

**Spec:** `docs/superpowers/specs/2026-05-30-db-backups-design.md`

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/lib/backup-dir.ts` | Resolve `BACKUP_DIR`, traversal-safe path join |
| `src/lib/pg-dump.ts` | Build `pg_dump` args (pure) + spawn wrapper |
| `src/lib/db-backup.ts` | Filename encode/parse, list, retention, `createBackup` |
| `src/pages/api/admin/backups/index.ts` | GET list / POST create (ADMIN) |
| `src/pages/api/admin/backups/[filename]/download.ts` | GET stream download (ADMIN) |
| `src/routes/registry.ts` | Add `routes.admin.backups` |
| `src/routes/api.ts` | Add `api.admin.backups` |
| `src/pages/admin/backups/index.tsx` | Backups admin page (generate + list + download) |
| `src/pages/admin/index.tsx` | Add "Backups" dashboard quick-action |
| `prisma/seed-backups-translations.ts` | Seed `admin.backups.*` + `common.*` keys |
| `scripts/backup-db.ts` | Cron entry → `createBackup('scheduled')` |
| `package.json` | Add `backup:db` + `db:seed-backups-translations` scripts |
| `.gitignore` | Ignore `/.backups/` |
| `.claude/VPS.md` | Add "Database Backups" runbook section |

Tests sit beside libs (`*.spec.ts`) and under `src/__tests__/api/admin/backups/`.

---

## Task 1: Backup-dir resolver

**Files:**
- Create: `src/lib/backup-dir.ts`
- Test: `src/lib/backup-dir.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/backup-dir.spec.ts
import path from 'path';
import {getBackupDir, resolveBackupPath} from './backup-dir';

describe('getBackupDir', () => {
  const ORIGINAL = process.env.BACKUP_DIR;
  afterEach(() => {
    process.env.BACKUP_DIR = ORIGINAL;
  });

  it('returns BACKUP_DIR env var when set', () => {
    process.env.BACKUP_DIR = '/var/lib/vmt-backups';
    expect(getBackupDir()).toBe('/var/lib/vmt-backups');
  });

  it('falls back to <cwd>/.backups when BACKUP_DIR unset', () => {
    delete process.env.BACKUP_DIR;
    expect(getBackupDir()).toBe(path.join(process.cwd(), '.backups'));
  });
});

describe('resolveBackupPath', () => {
  beforeEach(() => {
    process.env.BACKUP_DIR = '/var/lib/vmt-backups';
  });

  it('joins a filename under BACKUP_DIR', () => {
    expect(resolveBackupPath('vmt-2026-05-30T03-00-12Z-manual.dump')).toBe(
      '/var/lib/vmt-backups/vmt-2026-05-30T03-00-12Z-manual.dump',
    );
  });

  it('throws on path traversal', () => {
    expect(() => resolveBackupPath('../etc/passwd')).toThrow(/traversal/);
  });

  it('throws on absolute paths', () => {
    expect(() => resolveBackupPath('/etc/passwd')).toThrow(/absolute/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jest src/lib/backup-dir.spec.ts`
Expected: FAIL — cannot find module `./backup-dir`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/backup-dir.ts
import path from 'path';

export function getBackupDir(): string {
  return process.env.BACKUP_DIR ?? path.join(process.cwd(), '.backups');
}

export function resolveBackupPath(filename: string): string {
  if (path.isAbsolute(filename)) {
    throw new Error(`absolute path not allowed: ${filename}`);
  }
  const root = getBackupDir();
  const resolved = path.resolve(root, filename);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`path traversal blocked: ${filename}`);
  }
  return resolved;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/lib/backup-dir.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup-dir.ts src/lib/backup-dir.spec.ts
git commit -m "feat(backups): add BACKUP_DIR resolver"
```

---

## Task 2: pg_dump arg builder + spawn wrapper

**Files:**
- Create: `src/lib/pg-dump.ts`
- Test: `src/lib/pg-dump.spec.ts`

`buildPgDumpArgs` is pure and tested. `dumpDatabase` is a thin spawn wrapper (mocked by consumers in later tasks, not unit-tested here).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/pg-dump.spec.ts
import {buildPgDumpArgs} from './pg-dump';

describe('buildPgDumpArgs', () => {
  it('builds custom-format args with file and dbname', () => {
    expect(
      buildPgDumpArgs('postgresql://u:p@h:5432/db', '/tmp/out.dump'),
    ).toEqual([
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      '--file=/tmp/out.dump',
      '--dbname=postgresql://u:p@h:5432/db',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jest src/lib/pg-dump.spec.ts`
Expected: FAIL — cannot find module `./pg-dump`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/pg-dump.ts
import {spawn} from 'child_process';

export function buildPgDumpArgs(databaseUrl: string, outPath: string): string[] {
  return [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    `--file=${outPath}`,
    `--dbname=${databaseUrl}`,
  ];
}

/**
 * Runs pg_dump to write a custom-format dump at outPath.
 * databaseUrl must already be stripped of non-libpq query params.
 * Rejects (with stderr) on nonzero exit or spawn failure.
 */
export function dumpDatabase(databaseUrl: string, outPath: string): Promise<void> {
  const bin = process.env.PG_DUMP_BIN ?? 'pg_dump';
  const args = buildPgDumpArgs(databaseUrl, outPath);

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`));
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/lib/pg-dump.spec.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pg-dump.ts src/lib/pg-dump.spec.ts
git commit -m "feat(backups): add pg_dump arg builder and spawn wrapper"
```

---

## Task 3: Filename encode/parse

**Files:**
- Create: `src/lib/db-backup.ts`
- Test: `src/lib/db-backup.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/db-backup.spec.ts
import {formatBackupFilename, parseBackupFilename} from './db-backup';

describe('formatBackupFilename', () => {
  it('encodes timestamp and source, filesystem-safe', () => {
    const d = new Date('2026-05-30T03:00:12.345Z');
    expect(formatBackupFilename(d, 'manual')).toBe(
      'vmt-2026-05-30T03-00-12Z-manual.dump',
    );
  });
});

describe('parseBackupFilename', () => {
  it('round-trips a valid name back to ISO createdAt + source', () => {
    expect(parseBackupFilename('vmt-2026-05-30T03-00-12Z-scheduled.dump')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'scheduled',
    });
  });

  it('accepts a numeric collision suffix', () => {
    expect(parseBackupFilename('vmt-2026-05-30T03-00-12Z-manual-2.dump')).toEqual({
      createdAt: '2026-05-30T03:00:12Z',
      source: 'manual',
    });
  });

  it('returns null for non-backup filenames', () => {
    expect(parseBackupFilename('random.txt')).toBeNull();
    expect(parseBackupFilename('vmt-bad-name.dump')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jest src/lib/db-backup.spec.ts`
Expected: FAIL — cannot find module `./db-backup`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/db-backup.ts
import fs from 'fs';
import {existsSync} from 'fs';
import path from 'path';
import {getBackupDir, resolveBackupPath} from './backup-dir';
import {dumpDatabase} from './pg-dump';

export const MAX_BACKUPS = 10;

export type BackupSource = 'manual' | 'scheduled';

export type BackupMeta = {
  filename: string;
  createdAt: string; // ISO-8601, e.g. 2026-05-30T03:00:12Z
  source: BackupSource;
  byteSize: number;
};

const NAME_RE =
  /^vmt-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-(manual|scheduled)(?:-\d+)?\.dump$/;

export function formatBackupFilename(date: Date, source: BackupSource): string {
  const ts = date.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  return `vmt-${ts}-${source}.dump`;
}

export function parseBackupFilename(
  name: string,
): {createdAt: string; source: BackupSource} | null {
  const m = name.match(NAME_RE);
  if (!m) return null;
  const [, date, hh, mm, ss, source] = m;
  return {createdAt: `${date}T${hh}:${mm}:${ss}Z`, source: source as BackupSource};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/lib/db-backup.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db-backup.ts src/lib/db-backup.spec.ts
git commit -m "feat(backups): add backup filename encode/parse"
```

---

## Task 4: List + retention

**Files:**
- Modify: `src/lib/db-backup.ts`
- Test: `src/lib/db-backup.spec.ts`

- [ ] **Step 1: Write the failing test (append to existing spec)**

```ts
// append to src/lib/db-backup.spec.ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import {listBackups, enforceRetention, MAX_BACKUPS} from './db-backup';

describe('listBackups + enforceRetention', () => {
  let dir: string;
  const ORIGINAL = process.env.BACKUP_DIR;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-backups-'));
    process.env.BACKUP_DIR = dir;
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
  });

  function touch(name: string) {
    fs.writeFileSync(path.join(dir, name), 'x');
  }

  it('lists only valid backups, newest first', () => {
    touch('vmt-2026-05-01T03-00-00Z-manual.dump');
    touch('vmt-2026-05-30T03-00-00Z-scheduled.dump');
    touch('ignore-me.txt');

    return listBackups().then((metas) => {
      expect(metas.map((m) => m.filename)).toEqual([
        'vmt-2026-05-30T03-00-00Z-scheduled.dump',
        'vmt-2026-05-01T03-00-00Z-manual.dump',
      ]);
      expect(metas[0].source).toBe('scheduled');
      expect(metas[0].byteSize).toBe(1);
    });
  });

  it('returns [] when the directory does not exist', () => {
    process.env.BACKUP_DIR = path.join(dir, 'nope');
    return expect(listBackups()).resolves.toEqual([]);
  });

  it('deletes oldest beyond MAX_BACKUPS', async () => {
    for (let i = 0; i < MAX_BACKUPS + 3; i++) {
      const day = String(i + 1).padStart(2, '0');
      touch(`vmt-2026-05-${day}T03-00-00Z-manual.dump`);
    }
    await enforceRetention();
    const remaining = fs.readdirSync(dir).filter((n) => n.endsWith('.dump'));
    expect(remaining).toHaveLength(MAX_BACKUPS);
    // newest kept, oldest removed
    expect(remaining).toContain('vmt-2026-05-13T03-00-00Z-manual.dump');
    expect(remaining).not.toContain('vmt-2026-05-01T03-00-00Z-manual.dump');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jest src/lib/db-backup.spec.ts`
Expected: FAIL — `listBackups`/`enforceRetention` not exported.

- [ ] **Step 3: Write minimal implementation (append to db-backup.ts)**

```ts
// append to src/lib/db-backup.ts
export async function listBackups(): Promise<BackupMeta[]> {
  const dir = getBackupDir();
  let names: string[];
  try {
    names = await fs.promises.readdir(dir);
  } catch {
    return [];
  }
  const metas: BackupMeta[] = [];
  for (const name of names) {
    const parsed = parseBackupFilename(name);
    if (!parsed) continue;
    const stat = await fs.promises.stat(path.join(dir, name));
    metas.push({
      filename: name,
      createdAt: parsed.createdAt,
      source: parsed.source,
      byteSize: stat.size,
    });
  }
  metas.sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) ||
      b.filename.localeCompare(a.filename),
  );
  return metas;
}

export async function enforceRetention(max = MAX_BACKUPS): Promise<void> {
  const metas = await listBackups();
  for (const m of metas.slice(max)) {
    await fs.promises.rm(resolveBackupPath(m.filename), {force: true});
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/lib/db-backup.spec.ts`
Expected: PASS (all db-backup tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db-backup.ts src/lib/db-backup.spec.ts
git commit -m "feat(backups): add list and retention"
```

---

## Task 5: createBackup orchestration

**Files:**
- Modify: `src/lib/db-backup.ts`
- Test: `src/lib/db-backup.spec.ts`

- [ ] **Step 1: Write the failing test (append to existing spec)**

```ts
// append to src/lib/db-backup.spec.ts
import {createBackup} from './db-backup';

jest.mock('./pg-dump', () => ({
  dumpDatabase: jest.fn((_url: string, outPath: string) => {
    require('fs').writeFileSync(outPath, 'DUMP');
    return Promise.resolve();
  }),
}));

describe('createBackup', () => {
  let dir: string;
  const ORIGINAL_DIR = process.env.BACKUP_DIR;
  const ORIGINAL_DB = process.env.DATABASE_URL;

  beforeEach(() => {
    dir = require('fs').mkdtempSync(
      require('path').join(require('os').tmpdir(), 'vmt-create-'),
    );
    process.env.BACKUP_DIR = dir;
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db?schema=public';
  });
  afterEach(() => {
    require('fs').rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL_DIR;
    process.env.DATABASE_URL = ORIGINAL_DB;
    jest.clearAllMocks();
  });

  it('writes a dump file and returns its metadata', async () => {
    const meta = await createBackup('manual');
    expect(meta.source).toBe('manual');
    expect(meta.byteSize).toBe(4);
    expect(require('fs').existsSync(require('path').join(dir, meta.filename))).toBe(true);
  });

  it('passes a query-stripped DATABASE_URL to pg_dump', async () => {
    const {dumpDatabase} = require('./pg-dump');
    await createBackup('manual');
    expect(dumpDatabase).toHaveBeenCalledWith(
      'postgresql://u:p@h:5432/db',
      expect.stringContaining('.dump'),
    );
  });

  it('throws and cleans up the partial file when pg_dump fails', async () => {
    const {dumpDatabase} = require('./pg-dump');
    (dumpDatabase as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(createBackup('manual')).rejects.toThrow('boom');
    expect(require('fs').readdirSync(dir).filter((n: string) => n.endsWith('.dump'))).toHaveLength(0);
  });

  it('throws when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    await expect(createBackup('manual')).rejects.toThrow(/DATABASE_URL/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jest src/lib/db-backup.spec.ts`
Expected: FAIL — `createBackup` / `nextAvailableFilename` not exported.

- [ ] **Step 3: Write minimal implementation (append to db-backup.ts)**

```ts
// append to src/lib/db-backup.ts
export function nextAvailableFilename(date: Date, source: BackupSource): string {
  const base = formatBackupFilename(date, source);
  const dir = getBackupDir();
  if (!existsSync(path.join(dir, base))) return base;
  const stem = base.replace(/\.dump$/, '');
  let n = 2;
  while (existsSync(path.join(dir, `${stem}-${n}.dump`))) n++;
  return `${stem}-${n}.dump`;
}

async function statToMeta(filename: string): Promise<BackupMeta> {
  const parsed = parseBackupFilename(filename);
  if (!parsed) throw new Error(`not a backup filename: ${filename}`);
  const stat = await fs.promises.stat(resolveBackupPath(filename));
  return {
    filename,
    createdAt: parsed.createdAt,
    source: parsed.source,
    byteSize: stat.size,
  };
}

export async function createBackup(source: BackupSource): Promise<BackupMeta> {
  const databaseUrl = (process.env.DATABASE_URL ?? '').split('?')[0];
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const dir = getBackupDir();
  await fs.promises.mkdir(dir, {recursive: true});

  const filename = nextAvailableFilename(new Date(), source);
  const abs = resolveBackupPath(filename);

  try {
    await dumpDatabase(databaseUrl, abs);
  } catch (err) {
    await fs.promises.rm(abs, {force: true});
    throw err;
  }

  await enforceRetention();
  return statToMeta(filename);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/lib/db-backup.spec.ts`
Expected: PASS (all db-backup tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db-backup.ts src/lib/db-backup.spec.ts
git commit -m "feat(backups): add createBackup orchestration"
```

---

## Task 6: List/create API route

**Files:**
- Create: `src/pages/api/admin/backups/index.ts`
- Test: `src/__tests__/api/admin/backups/index.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
/**
 * @jest-environment node
 */
import {createMocks} from 'node-mocks-http';
import handler from '@/pages/api/admin/backups';

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/db-backup', () => ({
  MAX_BACKUPS: 10,
  listBackups: jest.fn(),
  createBackup: jest.fn(),
}));

import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup} from '@/lib/db-backup';

const sampleMeta = {
  filename: 'vmt-2026-05-30T03-00-00Z-manual.dump',
  createdAt: '2026-05-30T03:00:00Z',
  source: 'manual' as const,
  byteSize: 1234,
};

describe('GET /api/admin/backups', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns the backup list and maxBackups', async () => {
    (listBackups as jest.Mock).mockResolvedValue([sampleMeta]);
    const {req, res} = createMocks({method: 'GET'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({backups: [sampleMeta], maxBackups: 10});
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

  it('creates a backup and returns the updated list', async () => {
    (createBackup as jest.Mock).mockResolvedValue(sampleMeta);
    (listBackups as jest.Mock).mockResolvedValue([sampleMeta]);
    const {req, res} = createMocks({method: 'POST'});
    await handler(req as never, res as never);
    expect(createBackup).toHaveBeenCalledWith('manual');
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual({backups: [sampleMeta], maxBackups: 10});
  });

  it('returns 500 when pg_dump fails', async () => {
    (createBackup as jest.Mock).mockRejectedValue(new Error('pg_dump exited with code 1'));
    const {req, res} = createMocks({method: 'POST'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData().error).toMatch(/pg_dump/);
  });

  it('rejects other methods with 405', async () => {
    const {req, res} = createMocks({method: 'DELETE'});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(405);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jest src/__tests__/api/admin/backups/index.spec.ts`
Expected: FAIL — cannot find module `@/pages/api/admin/backups`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/pages/api/admin/backups/index.ts
import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {listBackups, createBackup, MAX_BACKUPS} from '@/lib/db-backup';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  if (req.method === 'GET') {
    const backups = await listBackups();
    return res.status(200).json({backups, maxBackups: MAX_BACKUPS});
  }

  if (req.method === 'POST') {
    try {
      await createBackup('manual');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      return res.status(500).json({error: message});
    }
    const backups = await listBackups();
    return res.status(201).json({backups, maxBackups: MAX_BACKUPS});
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/__tests__/api/admin/backups/index.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/backups/index.ts src/__tests__/api/admin/backups/index.spec.ts
git commit -m "feat(backups): add list/create API route"
```

---

## Task 7: Download API route

**Files:**
- Create: `src/pages/api/admin/backups/[filename]/download.ts`
- Test: `src/__tests__/api/admin/backups/download.spec.ts`

- [ ] **Step 1: Write the failing test**

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
  const VALID = 'vmt-2026-05-30T03-00-00Z-manual.dump';

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vmt-dl-'));
    process.env.BACKUP_DIR = dir;
    fs.writeFileSync(path.join(dir, VALID), 'DUMP');
  });
  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
    process.env.BACKUP_DIR = ORIGINAL;
    jest.clearAllMocks();
  });

  it('streams the file with an attachment header', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: VALID}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(200);
    expect(res.getHeader('Content-Disposition')).toContain(`filename="${VALID}"`);
    expect(res.getHeader('Content-Type')).toBe('application/octet-stream');
  });

  it('rejects a non-backup filename with 400', async () => {
    const {req, res} = createMocks({method: 'GET', query: {filename: 'evil.txt'}});
    await handler(req as never, res as never);
    expect(res._getStatusCode()).toBe(400);
  });

  it('rejects a traversal filename with 400', async () => {
    const {req, res} = createMocks({
      method: 'GET',
      query: {filename: '../../etc/passwd'},
    });
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
    (requireAdmin as jest.Mock).mockResolvedValueOnce(false);
    const {req, res} = createMocks({method: 'GET', query: {filename: VALID}});
    await handler(req as never, res as never);
    // requireAdmin owns the response; handler must not 200
    expect(res._getStatusCode()).not.toBe(200);
  });
});
```

Note: `fs.createReadStream(...).pipe(res)` works with node-mocks-http; the test asserts headers + status, which are set before piping.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec jest src/__tests__/api/admin/backups/download.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/pages/api/admin/backups/[filename]/download.ts
import type {NextApiRequest, NextApiResponse} from 'next';
import fs from 'fs';
import {requireAdmin} from '@/lib/admin-auth';
import {resolveBackupPath} from '@/lib/backup-dir';
import {parseBackupFilename} from '@/lib/db-backup';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const raw = req.query.filename;
  const filename = Array.isArray(raw) ? raw[0] : raw;
  if (!filename || !parseBackupFilename(filename)) {
    return res.status(400).json({error: 'Invalid backup filename'});
  }

  let abs: string;
  try {
    abs = resolveBackupPath(filename);
  } catch {
    return res.status(400).json({error: 'Invalid backup filename'});
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return res.status(404).json({error: 'Backup not found'});
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const stream = fs.createReadStream(abs);
  stream.pipe(res);
  await new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/__tests__/api/admin/backups/download.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/admin/backups src/__tests__/api/admin/backups/download.spec.ts
git commit -m "feat(backups): add download API route"
```

---

## Task 8: Route registry + api client

**Files:**
- Modify: `src/routes/registry.ts` (inside `admin: { ... }`, after `reviews`)
- Modify: `src/routes/api.ts` (inside `admin: { ... }`, after `stats`)

- [ ] **Step 1: Add the route** — in `src/routes/registry.ts`, add after the `reviews` block (around line 122, still inside `admin`):

```ts
    backups: {path: () => '/admin/backups'},
```

- [ ] **Step 2: Add the api client + type** — in `src/routes/api.ts`, add a type near the top (after `AdminStats`):

```ts
type BackupMeta = {
  filename: string;
  createdAt: string;
  source: 'manual' | 'scheduled';
  byteSize: number;
};

type BackupList = {backups: BackupMeta[]; maxBackups: number};
```

Then add inside `admin: { ... }`, right after the `stats:` line:

```ts
    backups: {
      list: () => request<BackupList>('/api/admin/backups'),
      create: () =>
        request<BackupList>('/api/admin/backups', {method: 'POST'}),
      downloadUrl: (filename: string) =>
        `/api/admin/backups/${encodeURIComponent(filename)}/download`,
    },
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/registry.ts src/routes/api.ts
git commit -m "feat(backups): register route and api client"
```

---

## Task 9: Seed translations

**Files:**
- Create: `prisma/seed-backups-translations.ts`
- Modify: `package.json` (add `db:seed-backups-translations` script)

Per CLAUDE.md, translations are DB-only. Reuse `common.*` for generic labels; add feature keys under `admin.backups.*`.

- [ ] **Step 1: Create the seed script** (mirror `prisma/seed-reviews-translations.ts` env-loading boilerplate)

```ts
// prisma/seed-backups-translations.ts
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
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
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const entries: Entry[] = [
  {namespace: 'admin.backups', key: 'title', valueEn: 'Backups', valueVi: 'Sao lưu'},
  {
    namespace: 'admin.backups',
    key: 'subtitle',
    valueEn: 'Keeps the last 10 backups; the oldest is removed automatically.',
    valueVi: 'Giữ 10 bản sao lưu gần nhất; bản cũ nhất sẽ tự động bị xóa.',
  },
  {namespace: 'admin.backups', key: 'create', valueEn: 'Create backup', valueVi: 'Tạo bản sao lưu'},
  {namespace: 'admin.backups', key: 'empty', valueEn: 'No backups yet.', valueVi: 'Chưa có bản sao lưu nào.'},
  {namespace: 'admin.backups', key: 'sourceLabel', valueEn: 'Source', valueVi: 'Nguồn'},
  {namespace: 'admin.backups', key: 'sourceManual', valueEn: 'Manual', valueVi: 'Thủ công'},
  {namespace: 'admin.backups', key: 'sourceScheduled', valueEn: 'Scheduled', valueVi: 'Tự động'},
  {namespace: 'admin.backups', key: 'createError', valueEn: 'Failed to create backup', valueVi: 'Tạo bản sao lưu thất bại'},
  // Generic — common.* (reused per CLAUDE.md)
  {namespace: 'common', key: 'created', valueEn: 'Created', valueVi: 'Ngày tạo'},
  {namespace: 'common', key: 'size', valueEn: 'Size', valueVi: 'Kích thước'},
  {namespace: 'common', key: 'download', valueEn: 'Download', valueVi: 'Tải xuống'},
];

async function main() {
  for (const e of entries) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: e.namespace, key: e.key}},
      update: {valueVi: e.valueVi, valueEn: e.valueEn},
      create: e,
    });
  }
  console.log(`Seeded ${entries.length} backups translations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add the package script** — in `package.json` `scripts`, after `db:seed-reviews-translations`:

```json
    "db:seed-backups-translations": "npx tsx prisma/seed-backups-translations.ts",
```

- [ ] **Step 3: Confirm `common.created` / `common.size` / `common.download` don't already exist with different wording**

`npx` is denied and these scripts use `tsx`, so do NOT run them in-session. Instead, grep the seed sources for prior definitions:
Run: `grep -rn "key: 'created'\|key: 'size'\|key: 'download'" prisma/ scripts/`
Expected: if any prior `common` entry defines one of these keys with different VI/EN wording, drop that key from `entries` and reuse the existing one. If none found, keep all three.

- [ ] **Step 4: Seeding runs on the VPS, not in-session**

Do NOT execute the seed here (`npx tsx` is denied; DB may be unreachable). The seed is run on the target DB during deploy: `npx tsx prisma/seed-backups-translations.ts` (documented in Task 13's VPS runbook). Just verify the file compiles as part of Task 14's typecheck.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-backups-translations.ts package.json
git commit -m "feat(backups): seed admin.backups translations"
```

---

## Task 10: Admin backups page

**Files:**
- Create: `src/pages/admin/backups/index.tsx`

No styling assertions per CLAUDE.md; this page is rendering-only and is verified via typecheck + manual run, not a unit test. Localized strings come from Task 9.

- [ ] **Step 1: Create the page**

```tsx
// src/pages/admin/backups/index.tsx
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {GetServerSidePropsContext} from 'next';
import {Button, Badge} from '@/components/ui';
import {api} from '@/routes';
import {useAdminLoading} from '@/contexts/AdminLoadingContext';
import {
  AdminPageShell,
  AdminPageHeader,
} from '@/components/Admin/AdminPageShell';

type BackupMeta = {
  filename: string;
  createdAt: string;
  source: 'manual' | 'scheduled';
  byteSize: number;
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

  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const {data} = await api.admin.backups.list();
    if (data) setBackups(data.backups);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setAdminLoading(loading);
  }, [loading, setAdminLoading]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const {data, error: err} = await api.admin.backups.create();
    setCreating(false);
    if (err || !data) {
      setError(err ?? t('createError'));
      return;
    }
    setBackups(data.backups);
  }

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={creating}
              icon={<i className="fa fa-database text-xs" />}
            >
              {t('create')}
            </Button>
          }
        />
      }
    >
      {error && (
        <p className="mb-4 text-danger type-label-sm">{error}</p>
      )}
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

> The download `<Button href=...>` renders an `<a>` (per Button's link form). A backup `.dump` is `application/octet-stream`, so the browser downloads rather than navigates.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: no errors. (If `AdminPageHeader` lacks a `subtitle` prop, pass the string as `subtitle={<>{t('subtitle')}</>}` — confirm the prop name against `AdminPageHeader.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/backups/index.tsx
git commit -m "feat(backups): add admin backups page"
```

---

## Task 11: Dashboard quick-action link

**Files:**
- Modify: `src/pages/admin/index.tsx` (the `actions` array, lines ~38-59)

- [ ] **Step 1: Add the action** — append to the `actions` array (labels in this array are intentionally hardcoded EN, matching the existing siblings):

```tsx
    {
      label: 'Backups',
      icon: 'fa-database',
      href: routes.admin.backups.path(),
    },
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/index.tsx
git commit -m "feat(backups): add dashboard quick-action link"
```

---

## Task 12: Monthly cron script

**Files:**
- Create: `scripts/backup-db.ts`
- Modify: `package.json` (add `backup:db` script)

- [ ] **Step 1: Create the script** (env-loading boilerplate matches the seed scripts; then call `createBackup`)

```ts
// scripts/backup-db.ts
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL || !process.env.BACKUP_DIR) {
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
  const {createBackup} = await import('../src/lib/db-backup');
  const meta = await createBackup('scheduled');
  console.log(
    `[backup-db] created ${meta.filename} (${meta.byteSize} bytes) at ${meta.createdAt}`,
  );
}

main().catch((err) => {
  console.error('[backup-db] failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the package script** — in `package.json` `scripts`, after `sweep:uploads`:

```json
    "backup:db": "npx tsx scripts/backup-db.ts",
```

- [ ] **Step 3: Do NOT smoke-test in-session**

`npx tsx` is denied and the VPS DB is not reachable here. Skip local execution; the script is validated on the VPS after deploy (see Task 13 runbook). Correctness is covered by the `createBackup` unit tests (Task 5) which this script merely wraps.

- [ ] **Step 4: Commit**

```bash
git add scripts/backup-db.ts package.json
git commit -m "feat(backups): add monthly backup cron script"
```

---

## Task 13: gitignore + docs

**Files:**
- Modify: `.gitignore` (near the `/.uploads/` line, ~line 66)
- Modify: `.claude/VPS.md` (new section)

- [ ] **Step 1: Ignore the local backups dir** — add under the `/.uploads/` line in `.gitignore`:

```
/.backups/
```

- [ ] **Step 2: Add a "Database Backups" section to `.claude/VPS.md`** (append before the final section)

````markdown
## Database Backups

Admin-triggered and monthly automated PostgreSQL backups (`pg_dump` custom format).

- **Storage:** `BACKUP_DIR=/var/lib/vmt-backups` (outside the repo). Contains user emails + bcrypt hashes — keep `0700`.
- **Retention:** newest 10 kept; each new backup deletes the oldest.
- **Format:** `pg_dump -Fc` → `.dump`, restored with `pg_restore`.

### Bootstrap (one-time, as root)

```bash
mkdir -p /var/lib/vmt-backups
chown ci-cd:ci-cd /var/lib/vmt-backups
chmod 0700 /var/lib/vmt-backups
```

Add `BACKUP_DIR=/var/lib/vmt-backups` to `/var/www/vietnam-moto-tours/.env`, then `pm2ci restart vietnam-moto-tours`.

### Seed the UI translations (one-time, on the DB)

```bash
cd /var/www/vietnam-moto-tours && npx tsx prisma/seed-backups-translations.ts
```

### Monthly cron (1st of month, 03:00) — root crontab

```cron
0 3 1 * * cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm backup:db >> /var/log/vmt-backup.log 2>&1
```

`pg_dump` must be on PATH (default `/usr/bin/pg_dump` from the postgres apt package). Override with `PG_DUMP_BIN` in `.env` if it lives elsewhere.

### Restore a backup

```bash
pg_restore -d vietnam_moto_tours --clean --if-exists /var/lib/vmt-backups/vmt-<timestamp>-<source>.dump
```

### Manual backup from the admin panel

`/admin/backups` → **Create backup**. Lists all backups with created time, source (manual/scheduled), size, and a Download button (ADMIN only; streamed through an auth-gated route).
````

- [ ] **Step 3: Commit**

```bash
git add .gitignore .claude/VPS.md
git commit -m "docs(backups): gitignore local dir and add VPS runbook"
```

---

## Task 14: Full verification

- [ ] **Step 1: Run the whole backup test suite**

Run: `pnpm exec jest backup`
Expected: all `backup-dir`, `pg-dump`, `db-backup`, and `api/admin/backups` specs PASS.

- [ ] **Step 2: Typecheck the project**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `pnpm lint src/lib/backup-dir.ts src/lib/pg-dump.ts src/lib/db-backup.ts 'src/pages/api/admin/backups/**' src/pages/admin/backups/index.tsx`
Expected: no errors.

- [ ] **Step 4: Manual smoke (dev server)**

Run: `pnpm dev`, log in as an admin, open `/admin/backups`, click **Create backup**, confirm a row appears, click **Download**, confirm a `.dump` file downloads. (Requires `pg_dump` on PATH + a reachable DB.)

- [ ] **Step 5: Final confirmation**

No separate commit — all work already committed per task.

---

## Notes for the implementer

- **`AdminPageHeader` props:** the page uses `title`, `subtitle`, `actions`. Confirm these prop names in `src/components/Admin/AdminPageShell/AdminPageHeader.tsx` before Task 10; adjust the JSX if the signature differs (it is being modified on this branch per git status).
- **DATABASE_URL query params:** `createBackup` strips everything after `?` (matches the seed scripts) so `pg_dump` gets a clean libpq URI. Prisma-specific params (`schema`, `connection_limit`, `pgbouncer`) would otherwise break `pg_dump`.
- **No new dependencies:** `tsx` is invoked via `npx tsx` (already the repo convention); `pg_dump` is a system binary. Nothing added to `dependencies`.
- **Security:** backups never live under `public/` and are only reachable through the ADMIN-gated download route; `BACKUP_DIR` is `0700`.
