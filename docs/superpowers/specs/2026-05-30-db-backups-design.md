# Database Backups — Design

**Date:** 2026-05-30
**Status:** Approved

## Goal

Give admins a way to back up the PostgreSQL database from the admin panel, plus an automated monthly backup. Backups are stored outside the project root, listed with metadata, downloadable to a local machine, and rotated to keep only the latest 10 (each new backup deletes the oldest beyond the cap).

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| UI shape | Dedicated `/admin/backups` page + dashboard quick-action link |
| File format | `pg_dump` custom compressed (`-Fc`) → `.dump`, restored via `pg_restore` |
| Access | ADMIN only (`requireAdmin`); download streamed through auth-gated route, never a public URL |
| Metadata tracking | Filename-encoded, no DB table |
| Storage path | `BACKUP_DIR` env var (mirrors `UPLOAD_DIR`); local dev defaults to `<repo>/.backups` |
| Retention | Keep newest 10, delete oldest on each new backup |

## Architecture

Mirrors the existing upload subsystem conventions (`src/lib/upload-dir.ts`, `requireAdmin`, route registry, `useAdminFetch`).

### 1. Backup-dir resolver — `src/lib/backup-dir.ts`

Mirrors `src/lib/upload-dir.ts`.

```ts
getBackupDir(): string                  // process.env.BACKUP_DIR ?? path.join(cwd, '.backups')
resolveBackupPath(filename): string     // joins under root, rejects absolute + traversal
```

### 2. Core lib — `src/lib/db-backup.ts`

Single source of truth shared by the API route and the cron script.

- **Filename scheme** (metadata encoded in the name, no DB):
  `vmt-<timestamp>-<source>.dump` — e.g. `vmt-2026-05-30T03-00-12Z-manual.dump`.
  - `timestamp` — ISO-8601 with `:` replaced by `-` to be filesystem-safe.
  - `source` ∈ `manual | scheduled`.
  - Collision guard: if a file for the same second already exists, append `-2`, `-3`, … to keep names unique.
- `formatBackupFilename(date, source)` / `parseBackupFilename(name)` — round-trippable encode/decode.
- `createBackup(source): Promise<BackupMeta>`
  - `spawn('pg_dump', ['-Fc', '-f', absPath, DATABASE_URL])` — **no shell** (injection-safe), streams to disk (low RAM — safe on the 961MB VPS).
  - Guards: `DATABASE_URL` must be set; on nonzero exit or spawn error, delete the partial file and throw with stderr context.
  - After success, call `enforceRetention()`.
- `listBackups(): Promise<BackupMeta[]>` — read `BACKUP_DIR`, `stat` each matching file, parse filename, return sorted newest-first. Ignores non-matching filenames.
- `enforceRetention(max = 10): Promise<void>` — delete oldest files beyond `max`.
- `BackupMeta = { filename: string; createdAt: string; source: 'manual' | 'scheduled'; byteSize: number }`

### 3. API routes (all `requireAdmin`)

`requireAdmin` already enforces `session.user.orgRoleKey === 'admin'` **and** `user.allowAuth`.

| Route | Method | Behavior |
| --- | --- | --- |
| `/api/admin/backups` | GET | `{ backups: BackupMeta[], maxBackups: 10 }` |
| `/api/admin/backups` | POST | Creates backup (`source: 'manual'`), returns updated list. Synchronous (DB is tiny). |
| `/api/admin/backups/[filename]/download` | GET | Streams file. `Content-Disposition: attachment; filename="..."`, `application/octet-stream`. Validates filename via resolver → 400 on bad name, 404 on missing file. |

Method guards return 405 (matches existing routes).

### 4. Route registry + api client

- `src/routes/registry.ts`: `routes.admin.backups = { path: () => '/admin/backups' }`
- `src/routes/api.ts`: `api.admin.backups = { list, create, downloadUrl(filename) }`
  - `list` / `create` use the existing `request<T>` wrapper.
  - `downloadUrl(filename)` returns a string for an anchor `href` (browser navigation, not `fetch`, so the file downloads).

### 5. Admin page — `src/pages/admin/backups/index.tsx`

- `AdminPageShell` + `AdminPageHeader` titled "Backups"; subtitle states the retention policy ("Keeps the last 10 backups; the oldest is removed automatically").
- Create action: `<Button variant="primary" icon={<i className="fa fa-database" />}>` — POSTs, shows loading, refreshes the list on success.
- List/table columns: **Created** (formatted date) · **Source** (`<Badge>` manual/scheduled) · **Size** (human-readable bytes) · **Download** (`<Button variant="ghost-primary" icon={<i className="fa fa-download" />}>`, anchor `href` = `downloadUrl`).
- Empty state when no backups.
- Data via `useAdminFetch('/api/admin/backups')` (matches dashboard pattern). `getServerSideProps` loads DB messages like other admin pages.
- All user-visible strings localized. New `admin.backups.*` keys; reuse `common.*` for generic labels (e.g. `download`, `create`, `created`, `size`) — check `common.*` before adding, per CLAUDE.md.

### 6. Dashboard — `src/pages/admin/index.tsx`

Add a "Backups" entry to the `actions` array (icon `fa-database`, `href: routes.admin.backups.path()`).

### 7. Monthly cron — `scripts/backup-db.ts`

- Calls `createBackup('scheduled')`, loads `.env`, logs the resulting filename + size, exits nonzero on failure.
- `package.json` script: `"backup:db": "tsx scripts/backup-db.ts"` (`tsx` is already a dev dependency used by `prisma/seed.ts` — no new dependency). **Requires explicit approval to edit `package.json` per CLAUDE.md.**
- Crontab entry (monthly, 1st at 03:00):

  ```cron
  0 3 1 * * cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm backup:db >> /var/log/vmt-backup.log 2>&1
  ```

### 8. Bootstrap + docs

- Prod `.env`: `BACKUP_DIR=/var/lib/vmt-backups`.
- Bootstrap (one-time, as root):

  ```bash
  mkdir -p /var/lib/vmt-backups
  chown ci-cd:ci-cd /var/lib/vmt-backups
  chmod 0700 /var/lib/vmt-backups   # stricter than uploads — contains emails + bcrypt hashes
  ```

- `.gitignore`: add `/.backups/`.
- New "Database Backups" section in `.claude/VPS.md`: bootstrap, env var, cron, and restore runbook.

## Security

- Dumps contain user emails + bcrypt password hashes → never placed under `public/`, never static-served; reachable only via the auth-gated stream route. `BACKUP_DIR` is `0700`.
- Download filename strictly validated against the backup-name pattern + traversal guard before any disk access.
- `pg_dump` invoked with an args array via `spawn` (no shell), so `DATABASE_URL` content cannot inject shell commands.

## Error handling

- `pg_dump` missing / nonzero exit → API 500 `{error}`, partial file cleaned up.
- `DATABASE_URL` unset → guard throws before spawning.
- Download: bad filename → 400; missing file → 404.
- Disk full → `pg_dump` fails → surfaced as 500.

## Edge cases

- Retention runs after every create (manual and scheduled) — keeps newest 10 by `createdAt`.
- Same-second filename collision → numeric suffix keeps names unique.
- Concurrent manual creates by a single admin: low risk, acceptable; no lock (YAGNI).

## Testing (no styling assertions, per CLAUDE.md)

| Area | Spec |
| --- | --- |
| Backup-dir resolver / traversal | `src/lib/backup-dir.spec.ts` (mirror `upload-dir.spec.ts`) |
| Filename format/parse round-trip, retention, list sort | `src/lib/db-backup.spec.ts` (fs + `pg_dump` spawn mocked) |
| API auth gates (401/403), download headers, bad-filename rejection, retention after create | API route specs under `src/__tests__/api/admin/backups/` |

## Restore (documented, not automated — YAGNI)

```bash
pg_restore -d vietnam_moto_tours --clean --if-exists vmt-<timestamp>-<source>.dump
```

## Deliberately excluded (YAGNI)

- Manual delete button (rotation handles cleanup).
- Restore via UI.
- Row-count / status metadata (would need the DB table that was declined).
- Upload-file backups (already covered by the documented rsync cron in STORAGE.md).
