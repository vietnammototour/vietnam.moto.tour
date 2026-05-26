# Object Storage (Image Uploads)

Single source of truth for how this project stores uploaded images: filesystem layout, env config, runtime pipeline, API surface, and operational runbooks (migration, sweep, backup, rollback).

## Storage Location

| Env       | Path                   | Notes                                                                                         |
| --------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| Local dev | `<repo>/.uploads/`     | Gitignored. Default when `UPLOAD_DIR` is unset.                                               |
| VPS prod  | `/var/lib/vmt-uploads` | Owned by pm2 user (`ci-cd:ci-cd`), perms `0750`. Outside the repo so deploys cannot touch it. |

The single env var **`UPLOAD_DIR`** controls everything. Set in production `.env`:

```
UPLOAD_DIR=/var/lib/vmt-uploads
```

Bootstrap (one-time, as root):

```bash
mkdir -p /var/lib/vmt-uploads
chown ci-cd:ci-cd /var/lib/vmt-uploads
chmod 0750 /var/lib/vmt-uploads
```

### Legacy path (deprecated)

The original setup used `/var/www/uploads` with a Turbopack workaround in the deploy script (real copy before build, symlink after). That path is kept only for reference; new servers use `/var/lib/vmt-uploads` and the migration runbook below moves files into it.

## Canonical File Layout

Within `UPLOAD_DIR`:

```
<UPLOAD_DIR>/<entity>s/<id>/<imageType>.<hash8>.webp
```

- `<entity>` — `tour` or `destination` (pluralised in the path: `tours/`, `destinations/`).
- `<id>` — entity UUID.
- `<imageType>` — semantic slot, e.g. `card`, `hero`.
- `<hash8>` — first 8 hex chars of the content hash; lets you replace an image without invalidating CDN caches.

Path resolution + traversal guard: `src/lib/upload-dir.ts`.

```ts
getUploadDir(): string                  // env or repo fallback
resolveUploadPath(relative): string     // joins under root, rejects absolute or traversal
```

## Runtime Pipeline (browser → disk)

1. **Pick file** in `ImageUpload` widget (`src/components/ui/ImageUpload/`).
2. **Sniff format** — `src/lib/image-magic.ts` reads magic bytes (`jpeg|png|webp|gif|heic|heif|unknown`). Rejects unknown.
3. **Transcode** — `src/lib/image-transcode.ts` resizes to preset bounds (cover-fit, no upscale) and re-encodes to WebP.
   - Presets:
     - `card` → max 1200×800
     - `hero` → max 2400×1200
   - Output: `image/webp` blob.
4. **Slot state** — `src/lib/image-slot.ts` is a discriminated union state machine:
   - `empty`
   - `saved {url}`
   - `pending-replace {blob, previewUrl, hash}` — has 8-hex hash
   - `pending-delete {previousUrl}`
5. **Submit** — `src/lib/submit-with-images.ts` (`flushImageSlots`) posts pending replacements/deletes to the upload API after the entity is saved.
6. **Server write** — `POST /api/admin/upload` writes the WebP to `<UPLOAD_DIR>/<entity>s/<id>/<imageType>.<hash8>.webp`.
7. **Serve** — `GET /api/uploads/[...path].ts` streams files from `UPLOAD_DIR` with the path-traversal guard. URLs are persisted on the entity record (e.g. `Tour.imageUrl`).

## Code Surface

### `src/lib/`

| File                    | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `upload-dir.ts`         | Resolves `UPLOAD_DIR`, traversal-safe path joining |
| `image-magic.ts`        | Magic-byte format sniffing                         |
| `image-transcode.ts`    | Preset registry (`card`, `hero`) + WebP transcode  |
| `image-slot.ts`         | Slot state machine + yup schema + helpers          |
| `submit-with-images.ts` | Flushes slot deltas after entity save              |
| `upload-entities.ts`    | Entity → folder mapping (`tour` → `tours/`)        |

### API routes

| Route                    | Method | Purpose                                |
| ------------------------ | ------ | -------------------------------------- |
| `/api/admin/upload`      | POST   | Auth-gated; writes a transcoded WebP   |
| `/api/uploads/[...path]` | GET    | Streams a stored file (traversal-safe) |
| `/api/health/uploads`    | GET    | `{writable, freeBytes}` for monitoring |

### Components

- `src/components/ui/ImageUpload/` — generic widget, blob preview via `URL.createObjectURL`, revokes on unmount/replace.
- `src/components/Admin/ImageUploadField/` — react-hook-form-aware wrapper used in admin forms.
- Admin tabs use `name="imageCard"` etc. on the field; form schema validates via `imageSlotSchema()`.

## Health Check

```bash
curl localhost:3000/api/health/uploads
# {"writable": true, "freeBytes": 12345678}
```

Wire monitoring against this endpoint to catch disk-full before users do.

## Operations

### Weekly orphan sweep (cron, root)

```cron
0 4 * * 0 cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm sweep:uploads >> /var/log/vmt-sweep.log 2>&1
```

Implementation: `scripts/sweep-orphan-uploads.ts`. Walks `UPLOAD_DIR`, deletes files whose `<hash8>` is not referenced by any DB row **and** whose `mtime` is older than 7 days.

### Daily backup (cron, root)

```cron
0 3 * * * rsync -a /var/lib/vmt-uploads/ /backup/vmt-uploads/
```

### One-shot legacy migration

`scripts/migrate-uploads.ts` moves files from the old layout into the canonical one.

```bash
cd /var/www/vietnam-moto-tours
pnpm migrate:uploads --dry-run    # review
pnpm migrate:uploads
```

### Manual VPS migration runbook

1. SSH to VPS.
2. Run bootstrap commands above (`mkdir`, `chown`, `chmod`).
3. Confirm `/var/lib/vmt-uploads` exists and is writable by the pm2 user.
4. Pull deployed code with upload changes.
5. `pnpm migrate:uploads --dry-run`, review output.
6. `pnpm migrate:uploads`.
7. Edit `/var/www/vietnam-moto-tours/.env`, add `UPLOAD_DIR=/var/lib/vmt-uploads`.
8. `pm2ci restart all` (use the `pm2ci` alias — never bare `pm2` as root, see VPS.md).
9. Open the site, verify destination/tour images render.
10. Verify admin upload + delete works end-to-end.

### Rollback

Comment out `UPLOAD_DIR` in `.env`, `pm2ci restart all`. Code falls back to `<cwd>/.uploads`.

Quick service restore (if `/var/lib/vmt-uploads` is lost): `mv /var/lib/vmt-uploads/* <repo>/public/uploads/` and restart.

## Test Coverage

| Area                | Spec file                                            |
| ------------------- | ---------------------------------------------------- |
| Upload dir resolver | `src/lib/upload-dir.spec.ts`                         |
| Image slot          | `src/lib/image-slot.spec.ts`                         |
| Submit pipeline     | `src/lib/submit-with-images.spec.ts`                 |
| Transcode           | `src/lib/image-transcode.spec.ts`                    |
| Magic sniff         | `src/lib/image-magic.spec.ts`                        |
| Upload API          | `src/__tests__/api/admin/upload.spec.ts`             |
| Serve API           | `src/__tests__/api/uploads/[...path].spec.ts`        |
| Health endpoint     | `src/__tests__/api/health/uploads.spec.ts`           |
| Sweep script        | `scripts/sweep-orphan-uploads.spec.ts`               |
| Widget              | `src/components/ui/ImageUpload/ImageUpload.spec.tsx` |

## Design Reference

Original spec: `docs/superpowers/specs/2026-05-06-resilient-image-uploads-design.md`.

## Related Docs

- [VPS.md](./VPS.md) — server setup, pm2, deploy script (legacy upload section is superseded by this doc).
- [CLAUDE.md](./CLAUDE.md) — repo-wide rules, including: do not modify sensitive files without explicit user request.
