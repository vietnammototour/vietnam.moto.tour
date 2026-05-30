# Media (Uploads) Backups — Design

**Date:** 2026-05-30
**Status:** Approved
**Builds on:** [2026-05-30-db-backups-design.md](./2026-05-30-db-backups-design.md)

## Goal

Add point-in-time, downloadable, auto-rotated backups of all user-uploaded media (everything under `UPLOAD_DIR`), alongside the existing database backups. Same admin-triggered + monthly-cron model, same `/admin/backups` page (now with a Database/Media toggle). Each media backup is a single compressed archive of the upload tree.

## Scope

- "Media" = everything under `UPLOAD_DIR` (currently WebP/JPEG images in `tours/`, `destinations/`, `highlights/`, `collectionImages/`, `vehicles/`). The archive is format-agnostic, so future media types (video, pdf) are covered automatically.
- Git-tracked static assets in `public/` are out of scope (already versioned).
- The existing daily `rsync` mirror to `/backup/vmt-uploads/` stays — it is a continuous latest-only mirror; this feature adds versioned snapshots with retention. Complementary, not a replacement.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Archive format | Single `tar.gz` of `UPLOAD_DIR` per backup |
| UI | Extend existing `/admin/backups` with a Database/Media `SegmentedControl` toggle |
| Retention (media) | Keep newest **3** (DB stays 10) |
| Existing rsync | Keep — complementary |
| Core strategy | Generalize the DB backup module into kind-parameterized core (DRY) |

## Architecture

### Backup "kinds"

Generalize the just-merged DB backup logic into a kind-parameterized core. A `BackupKind` descriptor captures everything that differs between database and media backups:

```ts
type BackupKind = {
  id: 'db' | 'media';
  prefix: string;        // 'vmt-'        | 'vmt-media-'
  ext: string;           // '.dump'       | '.tar.gz'
  max: number;           // 10            | 3
  nameRe: RegExp;        // matches ONLY this kind's filenames
  produce: (outPath: string) => Promise<void>;
};
```

- **Filenames:**
  - DB (unchanged, backward-compatible with existing dumps): `vmt-<ts>-<source>.dump`
  - Media: `vmt-media-<ts>-<source>.tar.gz`
  - `<ts>` = ISO-8601 with `:`→`-`, millis dropped (e.g. `2026-05-30T03-00-12Z`). `<source>` ∈ `manual | scheduled`. Optional `-<n>` collision suffix.
- **Disambiguation:** the DB regex requires a date immediately after `vmt-` and ends in `.dump`; the media regex starts `vmt-media-` and ends in `.tar.gz`. Neither matches the other. Both kinds share one `BACKUP_DIR`.

### Components

| File | Responsibility | Status |
| --- | --- | --- |
| `src/lib/backup-dir.ts` | `BACKUP_DIR` resolver + traversal-safe join | unchanged |
| `src/lib/backup-core.ts` | Kind-aware filename format/parse, `listBackups(kind)`, `enforceRetention(kind)`, `createBackup(kind)`, `parseAnyBackupFilename(name)` | **new** (absorbs the generic parts of today's `db-backup.ts`) |
| `src/lib/backup-kinds.ts` | `DB_BACKUP_KIND`, `MEDIA_BACKUP_KIND` descriptors + `BACKUP_KINDS` registry | **new** |
| `src/lib/pg-dump.ts` | DB producer (`dumpDatabase`, arg builder) | unchanged |
| `src/lib/tar-archive.ts` | `buildTarArgs` (pure) + `archiveUploads(outPath)` spawn wrapper | **new** |
| `src/lib/db-backup.ts` | Removed/inlined — its `createBackup`/`listBackups`/retention/filename logic moves to `backup-core.ts`; the DB producer (DATABASE_URL strip + `dumpDatabase`) becomes `DB_BACKUP_KIND.produce` | refactor |

**Producers:**

- `DB_BACKUP_KIND.produce(out)` — strips `?...` from `DATABASE_URL` (throws if empty), calls `dumpDatabase(strippedUrl, out)`.
- `MEDIA_BACKUP_KIND.produce(out)` — calls `archiveUploads(out)`.

`archiveUploads`:

```ts
buildTarArgs(uploadDir, outPath): string[]
  // ['-czf', outPath, '-C', uploadDir, '.']
archiveUploads(outPath): Promise<void>
  // spawn(process.env.TAR_BIN ?? 'tar', buildTarArgs(getUploadDir(), outPath),
  //       {stdio: ['ignore','ignore','pipe']}); reject(stderr) on nonzero/spawn error.
  // Guard: if getUploadDir() does not exist → throw before spawn.
```

No shell (args array), mirroring the `pg_dump` injection-safe pattern.

### Core functions (kind-parameterized)

```ts
formatBackupFilename(kind, date, source): string
parseBackupFilename(kind, name): {createdAt, source} | null
parseAnyBackupFilename(name): {kind, createdAt, source} | null   // tries every kind in BACKUP_KINDS
listBackups(kind): Promise<BackupMeta[]>          // dir filtered by kind.nameRe, newest-first
enforceRetention(kind): Promise<void>             // delete oldest beyond kind.max
nextAvailableFilename(kind, date, source): string // collision suffix
createBackup(kind, source): Promise<BackupMeta>   // mkdir -p, unique name, kind.produce(), on fail rm partial + rethrow, enforceRetention(kind), return meta
```

`BackupMeta` gains a `kind: 'db' | 'media'` field so the UI/API can label rows.

### API

- `GET /api/admin/backups?kind=db|media` → `{backups: BackupMeta[], maxBackups: number}` for that kind. `kind` defaults to `db`; an invalid value → 400.
- `POST /api/admin/backups?kind=db|media` → creates a `manual` backup of that kind; returns the updated list for that kind (201). Producer failure → 500 `{error}`.
- `GET /api/admin/backups/[filename]/download` — unchanged behavior; validation now uses `parseAnyBackupFilename` so it accepts both `.dump` and `.tar.gz` names. Still ADMIN-gated, streamed, `Content-Type: application/octet-stream`, `Content-Disposition: attachment`.

Kind parsing helper: a small `parseBackupKindParam(req.query.kind)` returning `BackupKind | null` (null → 400), defaulting to `DB_BACKUP_KIND` when absent.

### API client (`src/routes/api.ts`)

```ts
api.admin.backups = {
  list: (kind?: 'db' | 'media') => request<BackupList>(`/api/admin/backups${kind ? `?kind=${kind}` : ''}`),
  create: (kind?: 'db' | 'media') => request<BackupList>(`/api/admin/backups${kind ? `?kind=${kind}` : ''}`, {method: 'POST'}),
  downloadUrl: (filename) => `/api/admin/backups/${encodeURIComponent(filename)}/download`,
}
```

`BackupMeta` in `api.ts` gains `kind`.

### UI — `/admin/backups`

- A `SegmentedControl` (shared `@/components/ui`) toggle: **Database** | **Media**, stored in `kind` state (default `db`).
- Changing the toggle refetches `api.admin.backups.list(kind)`; the "Create backup" primary button calls `api.admin.backups.create(kind)`.
- Same table columns (Created / Source / Size / Download). `formatBytes` already handles MB/GB for larger media archives.
- Header subtitle reflects the active kind's retention ("Keeps the last 10" / "Keeps the last 3"). Drive this from the selected kind's `max` via a localized message with a `{count}` param.

### Cron + ops

- `scripts/backup-media.ts` (`pnpm backup:media`) → `createBackup(MEDIA_BACKUP_KIND, 'scheduled')`, same env-loading boilerplate as `scripts/backup-db.ts`. Package script value uses `npx tsx` (repo convention; runs on VPS).
- Monthly cron, offset from the DB job:

  ```cron
  30 3 1 * * cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm backup:media >> /var/log/vmt-backup.log 2>&1
  ```

- `.claude/VPS.md` — extend the Database Backups section into "Backups" covering both kinds: media archive at `BACKUP_DIR`, `tar` on PATH (override `TAR_BIN`), retention 3, restore runbook.

### Restore (documented, not automated — YAGNI)

```bash
tar -xzf /var/lib/vmt-backups/vmt-media-<ts>-<source>.tar.gz -C "$UPLOAD_DIR"
```

Extracts into `UPLOAD_DIR`, overwriting same-named files. To restore to an exact snapshot state (removing files added since), clear `UPLOAD_DIR` contents first — document this caveat.

## Security

- `tar` invoked with an args array via `spawn` — no shell, no injection from paths/env.
- Download filename validated against every kind's strict regex + traversal guard before any fs access; the validated name (digits/hyphens/`T`/`Z`/`.`/`manual`/`scheduled`/`media`/`tar`/`gz`) contains no characters that could inject into `Content-Disposition`.
- Backups (DB dumps + media archives) live under `BACKUP_DIR` (`0700`, outside `public/`), reachable only through the ADMIN-gated download route.

## Error handling

- `tar` missing / nonzero exit → producer rejects with stderr → API 500, partial archive removed.
- `UPLOAD_DIR` missing → producer throws before spawn.
- Empty `UPLOAD_DIR` → valid near-empty archive (acceptable).
- Download: invalid name → 400; missing file → 404.
- Invalid `kind` query param → 400.

## Edge cases

- Per-kind retention isolation: `listBackups(media)` must not count `.dump` files and vice-versa (regex enforces this) — tested.
- Same-second filename collision → numeric suffix, parseable by the kind regex.
- Disk: 3 media archives bound the footprint; each ≈ total `UPLOAD_DIR` size.

## Testing (no styling assertions, per CLAUDE.md)

| Area | Spec |
| --- | --- |
| `buildTarArgs` pure output | `src/lib/tar-archive.spec.ts` |
| Kind-aware filename format/parse + `parseAnyBackupFilename` | `src/lib/backup-core.spec.ts` |
| Per-kind list/retention isolation (db vs media don't cross-count) | `src/lib/backup-core.spec.ts` |
| `createBackup(media)` success / failure-cleanup (producer mocked) | `src/lib/backup-core.spec.ts` |
| Existing DB behavior preserved under the new kind API | `src/lib/backup-core.spec.ts` (ported from `db-backup.spec.ts`) |
| API `kind` routing (db/media/invalid) | `src/__tests__/api/admin/backups/index.spec.ts` (extended) |
| Download accepts a `.tar.gz` media filename | `src/__tests__/api/admin/backups/download.spec.ts` (extended) |

## Migration / compatibility

- Existing `.dump` files on disk keep working — the DB kind's filename scheme is unchanged.
- The refactor renames `db-backup.ts` → `backup-core.ts` + `backup-kinds.ts`. All importers (`scripts/backup-db.ts`, the two API routes) update to the new module + kind API. `scripts/backup-db.ts` switches to `createBackup(DB_BACKUP_KIND, 'scheduled')`.

## Deliberately excluded (YAGNI)

- UI restore.
- Incremental / deduplicated archives.
- Per-entity selective backup.
- Encryption at rest (`BACKUP_DIR` is already `0700`).
