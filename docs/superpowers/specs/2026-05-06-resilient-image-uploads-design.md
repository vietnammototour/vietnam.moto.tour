# Resilient Image Uploads — Design

**Status:** Draft
**Date:** 2026-05-06
**Author:** brainstormed with Claude

## Problem

Image uploads in the admin panel break repeatedly:

- Files uploaded from macOS (HEIC) appear as broken images on the public site because Chrome and Firefox cannot decode HEIC.
- Replacing an image leaves orphan files on disk because the new file's extension may differ from the old one's.
- The DELETE flow does not reliably remove the file the DB row points to.
- Each deploy puts uploads at risk because they live inside the repo at `public/uploads/`.
- No format whitelist; the server accepts any `image/*` and writes it through unchanged.
- No client-side validation or normalization; the server has no native image tooling either.

## Goals

1. **Deploy-immune storage.** A `git pull`, `pnpm build`, or repo wipe must not affect uploaded files.
2. **One canonical output format.** All new uploads stored as `image/webp`, regardless of input.
3. **No server-side image processing.** No `sharp`, no `libvips`, no native deps that break CI/CD.
4. **Atomic upload + delete.** DB and filesystem stay in sync; no orphan-by-extension-drift.
5. **Form-driven upload semantics.** Files are sent only when the admin saves the form (option B from brainstorm).
6. **Safe failure modes.** Network or transcode errors never lose admin-entered text fields.

## Non-Goals

- Object storage (S3, R2, MinIO). Considered, rejected for current scale.
- Server-side transcoding of legacy uploads. Tolerated inconsistency until natural re-upload.
- CDN, image variants (thumbnails, srcset). Out of scope; can be layered on later.
- nginx-direct serving of `/uploads`. Phase-2 optimization, not part of initial implementation.
- Replacing react-hook-form, Yup, or any existing form plumbing.

## Architecture

### Storage layout

Files live outside the repo, owned by the pm2 process user:

```
/var/lib/vmt-uploads/
  tours/<tourId>/card.<hash8>.webp
  destinations/<destId>/card.<hash8>.webp
  destinations/<destId>/hero.<hash8>.webp
```

Local development uses `<repo>/.uploads/`, gitignored. Path is resolved from a single env var, `UPLOAD_DIR`, which already exists in the codebase. `public/uploads/` is removed from the repo and added to `.gitignore`.

`<hash8>` is the first 8 hex chars of the SHA-256 of the file bytes. It serves two purposes: cache-bust on replace (the URL changes when content changes), and uniqueness so concurrent overwrites do not collide.

### Serving uploaded files

A Next.js API route streams files:

```
GET /api/uploads/[...path]
```

Behaviour:

- Resolve `path` against `UPLOAD_DIR` with `path.resolve`. Reject if the result does not start with `UPLOAD_DIR + path.sep` (path-traversal guard).
- Derive `Content-Type` from extension via a small allowlist map: `.webp → image/webp`, `.jpg/.jpeg → image/jpeg`, `.png → image/png`, `.gif → image/gif`. Anything else → 404. (Allowlist exists to support legacy non-webp files migrated from `public/uploads/`. New uploads are always webp.)
- Stream with `Cache-Control: public, max-age=31536000, immutable` and an `ETag` derived from filename (the hash is in the name for new uploads; for legacy files use file `mtime+size`).
- 404 returns a small static placeholder image so missing files don't render as the browser's broken-image icon.

Phase-2 optimization (out of scope here): nginx `alias /uploads/ -> /var/lib/vmt-uploads/` for direct file serving.

### Why this is deploy-immune

`/var/lib/vmt-uploads/` is outside `/var/www/vietnam-moto-tours`. `git pull`, `rm -rf node_modules`, and even `rm -rf` of the repo cannot touch it. Backup is one rsync line.

## Client transcoding pipeline

`src/lib/image-transcode.ts` exports a single function:

```ts
type ImagePreset = 'card' | 'hero';

type TranscodedImage = {
  blob: Blob; // image/webp
  hash: string; // first 8 hex chars of SHA-256(blob)
  width: number;
  height: number;
  byteSize: number;
};

type TranscodeError =
  | {code: 'unsupported_format'; mime: string}
  | {code: 'heic_decode_failed'}
  | {code: 'too_large'; bytes: number}
  | {code: 'decode_failed'; reason: string}
  | {code: 'encode_failed'};

function transcodeImage(
  file: File,
  preset: ImagePreset,
): Promise<TranscodedImage>;
```

Pipeline:

1. **Sniff first 12 bytes** of the file (magic numbers); do not trust `file.type`.
2. **Decode.**
   - JPEG / PNG / WebP / GIF: `createImageBitmap(file, {imageOrientation: 'from-image'})`.
   - HEIC / HEIF: lazy `import('heic2any')` (only loaded when needed), convert to JPEG blob, then feed into `createImageBitmap`.
3. **Resize** to preset bounds, fit cover, no upscale:
   - `card` → max 1200×800
   - `hero` → max 2400×1200
4. **Encode** via `OffscreenCanvas.convertToBlob({type: 'image/webp', quality: 0.85})`. Fall back to `HTMLCanvasElement.toBlob` if `OffscreenCanvas` unavailable.
5. **Hash** the resulting blob with `crypto.subtle.digest('SHA-256', ...)`, take first 8 hex chars.

Hard limits enforced before/during transcode:

- Input file size ≤ 25 MB
- Decoded bitmap dimensions ≤ 8000×8000
- Output blob size ≤ 2 MB; if exceeded, retry encode once at quality 0.7

Accepted input mime types (set on the file picker `accept` attribute and re-validated): `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.

Worker offload is not required initially. If transcode latency becomes user-visible on large iPhone HEIC files, move to a Web Worker.

## ImageUpload widget

`src/components/ui/ImageUpload/ImageUpload.tsx` becomes a controlled component with a tagged-union value:

```ts
type ImageSlot =
  | {kind: 'empty'}
  | {kind: 'saved'; url: string}
  | {kind: 'pending-replace'; blob: Blob; previewUrl: string; hash: string}
  | {kind: 'pending-delete'; previousUrl: string};

type ImageUploadProps = {
  value: ImageSlot;
  onChange: (next: ImageSlot) => void;
  preset: ImagePreset;
  label?: string;
  error?: string;
};
```

Responsibilities:

- Render the file picker, preview, Replace button, Delete button.
- Call `transcodeImage(file, preset)` when a file is picked, generate `URL.createObjectURL(blob)` for the preview, revoke it on unmount and on replace.
- Surface transcode errors via the `error` prop pathway.

Non-responsibilities:

- Does not call any API. Does not know about `entityId` or routes. Pure local state.

## Form orchestration

Each admin form (e.g. `EditDestinationForm`) registers image slots in react-hook-form as `ImageSlot` values. Yup schema gets a custom `imageSlot()` validator that requires `pending-replace` blobs to have valid `hash`/`byteSize` and rejects slots with surfaced transcode errors.

A new helper, co-located in the form's `form-utils.ts` (per CLAUDE.md form convention):

```ts
async function submitWithImages(
  data: FormValues,
  entityId: string,
): Promise<void>;
```

Behaviour, in order:

1. `PATCH /api/admin/<entity>/<id>` with non-image fields. Server returns 200 before any image step runs.
2. For each dirty image slot:
   - `pending-replace` → `POST /api/admin/upload` (multipart: blob + meta).
   - `pending-delete` → `DELETE /api/admin/upload` (json: meta).
   - `saved` / `empty` → no-op.
3. Each upload step retries once on network failure (1 s backoff). On a second failure, surface a per-slot error to the UI; leave the slot dirty and the blob in memory so the user can click retry without re-picking the file.
4. Image step failures are isolated per slot. A failed `hero` does not abort a successful `card`. Text fields are already saved.

### Create flow (no `entityId` yet)

1. `POST /api/admin/<entity>` with text fields only → returns `{id}`.
2. Run the same image step from above against the returned id.
3. If image step fails, the entity exists without an image. Redirect to its edit page with a toast: "image upload failed, retry here".

### Cancellation

Closing the form before save discards in-memory blobs. Nothing was written to disk. There is no `_pending/` namespace and no orphan-from-cancel sweep needed.

### Reload / hard navigation

Pending blobs live only in memory. After a hard reload the admin must re-pick any file they had not yet saved. This is documented behaviour, not a bug.

## Server endpoints

### `POST /api/admin/upload`

Multipart/form-data:

- Fields: `entityType` (`tour` | `destination`), `entityId`, `imageType` (`card` | `hero`).
- File field `file`, mime must be `image/webp`, size ≤ 2 MB.

Validation order:

1. `requireAdmin` (existing helper).
2. `entityType` and `imageType` are in their allowlists; `hero` is rejected unless `entityType === 'destination'`.
3. Entity row exists (`prisma.<entity>.findUnique`); 404 otherwise.
4. Parse multipart with `formidable`, `maxFileSize: 2 * 1024 * 1024`, `filter: ({mimetype}) => mimetype === 'image/webp'`.
5. Read first 12 bytes of the temp file, verify RIFF/WEBP magic. Reject otherwise (400).
6. Compute SHA-256 of the file server-side; take first 8 hex chars.
7. Build the canonical path `<UPLOAD_DIR>/<entity>s/<id>/<imageType>.<hash8>.webp`.
8. Write to `<path>.tmp`, then `fs.rename` to the final path (POSIX atomic on the same filesystem).
9. Update the DB field (`tour.imageUrl`, `destination.imageUrl`, or `destination.heroImage`) to `/uploads/<entity>s/<id>/<imageType>.<hash8>.webp`.
10. Best-effort `fs.unlink` of the previously-referenced hash file (read DB before update; unlink after DB commit).

Response: `{url, hash, byteSize}`.

If step 8 fails: unlink temp, return 500, do not touch DB. If step 9 fails: unlink the freshly-renamed file, return 500. Both file and DB stay in their pre-call state.

### `DELETE /api/admin/upload`

JSON body `{entityType, entityId, imageType}`.

1. Read entity, capture current `imageUrl` / `heroImage`.
2. Update DB field to `null`.
3. Resolve the old URL to a filesystem path; `fs.unlink` (best-effort, ignore `ENOENT`).
4. Return `{success: true}`.

### `GET /api/uploads/[...path]`

Public, no auth. Path-traversal guarded. `Content-Type` derived from extension allowlist (`.webp`, `.jpg`/`.jpeg`, `.png`, `.gif`); anything else → 404. Year-long immutable cache headers; `ETag` is `<hash8>` for new uploads, `<mtime>-<size>` for legacy files. Missing file returns 404 with a placeholder.

### Removed from current code

- The multi-extension delete glob.
- Acceptance of any `image/*`. Now strictly `image/webp`.
- Extension preservation from input filenames.

## Schema change

```prisma
model Tour {
  imageUrl String?  // was String, now nullable
}
model Destination {
  imageUrl  String?
  heroImage String?
}
```

Migration: drop `NOT NULL`, then `UPDATE ... SET imageUrl = NULL WHERE imageUrl = ''` to normalize empty strings.

## Deploy & infrastructure

One-time manual VPS bootstrap (recorded in VPS.md):

```
sudo mkdir -p /var/lib/vmt-uploads
sudo chown <pm2-user>:<pm2-user> /var/lib/vmt-uploads
sudo chmod 0750 /var/lib/vmt-uploads
```

`.env` on VPS adds `UPLOAD_DIR=/var/lib/vmt-uploads`.

Repo changes:

- `.gitignore` adds `/public/uploads/` and `/.uploads/`.
- `git rm -r --cached public/uploads` once migration is complete.

Deploy script (`/root/deploy.sh`) gains a pre-flight check: `test -d "$UPLOAD_DIR" || { echo "UPLOAD_DIR missing"; exit 1; }` before pm2 reload.

A health endpoint `GET /api/health/uploads` returns `{writable, freeBytes}` after `fs.access(UPLOAD_DIR, W_OK)` and a `statvfs` (or equivalent). Lets monitoring catch disk-full before users do.

## Failure modes

- **Magic-byte mismatch** → 400 `invalid_format`. No file written.
- **Disk full** → 507 `disk_full`. Surface to admin clearly.
- **Rename fails** after temp write → unlink temp, 500. DB untouched.
- **DB update fails** after rename → unlink the freshly-renamed file, 500. DB untouched.
- **Stale file references** (DB points to file deleted out-of-band) → public 404 + placeholder. The edit page does a one-time HEAD on saved image URLs and shows "image missing on disk" if it 404s; admin re-uploads.
- **Concurrent edits to same entity** → last writer wins (rename + DB update is atomic per request). The loser's file becomes garbage, swept by the orphan job below.

### Orphan sweep

`scripts/sweep-orphan-uploads.ts`, scheduled weekly via VPS cron, run as `pnpm sweep:uploads`:

1. Build the set of all `<hash8>` referenced in any DB row.
2. Walk `UPLOAD_DIR`. For each file whose `<hash8>` is not in the set, delete if `mtime` > 7 days.

Two-week effective safety window covers the concurrent-edit race and any short-lived rollbacks.

## Observability

Every upload, delete, and sweep writes one structured log line: `{action, entityType, entityId, imageType, hash, byteSize, durationMs, result}`. No PII.

## Testing

Project rule: no styling assertions (CLAUDE.md). Tests verify behaviour, content, and structure only.

### Unit tests

`src/lib/image-transcode.spec.ts`:

- 1×1 PNG fixture → returns webp blob; hash is 8 hex chars; dimensions match.
- 3000×3000 JPEG with `card` preset → output bounded by 1200×800.
- Already-small input → no upscale.
- `application/pdf` input → `unsupported_format`.
- Mime-spoof (file says `image/jpeg`, bytes are PDF) → caught by magic-byte sniff.
- Same input bytes → same hash (determinism).
- HEIC fixture: assert `heic2any` is lazy-imported only on HEIC input.

`ImageUpload.spec.tsx`:

- Empty → file event fires `onChange({kind: 'pending-replace', ...})`.
- `saved` → preview rendered, Replace + Delete buttons present.
- Click Delete on `saved` → `onChange({kind: 'pending-delete', previousUrl})`.
- Transcode error → renders error message from prop.
- `transcodeImage` is mocked; no real decoding in tests.

`form-utils` `submitWithImages`:

- All slots `saved`, no dirty fields → zero upload calls.
- One `pending-replace` → one POST; resolves with the updated entity.
- POST 500 → retried once → still 500 → throws with the slot id.
- Mixed: text PATCH succeeds, one image POST fails → reports per-slot error; does not roll back text.

### Integration tests

`/api/admin/upload` (Next.js test handler, tmp `UPLOAD_DIR`):

- Valid webp → file at canonical hash path; DB updated; response url matches.
- Replace existing → old hash file unlinked; new url returned; DB has new url.
- Wrong mime → 400; no file written.
- Spoofed webp (mime says webp, bytes are PNG) → 400 from magic check.
- 3 MB file → 400 size.
- Path traversal in `entityId` → blocked by entity validation; 404.
- Forced DB-update failure → freshly written file unlinked; 500.

`/api/uploads/[...path]`:

- Existing file → 200 with bytes and correct headers.
- Missing file → 404 with placeholder bytes.
- Traversal (`../../etc/passwd`) → 400.

`/api/admin/upload` DELETE → file gone; DB null; 200; missing file ignored.

### E2E

One Playwright happy path: log in as admin → edit destination → replace card image with HEIC fixture → save → reload → image renders.

### Sweep script

`scripts/sweep-orphan-uploads.spec.ts` with seeded DB and tmp dir: only orphan-and-old files removed; recent orphans untouched; referenced files untouched.

## Migration of existing files

A one-shot script, `scripts/migrate-uploads.ts`, run manually on the VPS:

1. Read every non-null `Tour.imageUrl`, `Destination.imageUrl`, `Destination.heroImage`.
2. For each row:
   - Resolve the old path under `<repo>/public/uploads/...`.
   - **Move** (not transcode) the file to `/var/lib/vmt-uploads/<entity>s/<id>/<imageType><ext>`, keeping the original extension.
   - Update the DB url to `/uploads/<entity>s/<id>/<imageType><ext>`.
3. Log per-row: source, destination, bytes, result.
4. Support `--dry-run` to print the plan with no writes.
5. Idempotent: skip rows whose url already starts with `/uploads/<entity>s/...` and whose target file already exists.

### Why no server transcode of legacy files

Doing it would require `sharp` or equivalent on the migration host, which is the precise CI/CD pain this whole spec exists to avoid. Files currently rendering in browsers will keep rendering after the move (HEIC files were already broken; the move does not make them worse).

### Tolerated inconsistency

Legacy files keep their original extensions. The `GET /api/uploads/[...path]` endpoint must serve those non-webp paths. New uploads are still strictly webp. Two ways this resolves over time:

- Admins re-upload through the new flow as they edit entities (gradual cleanup).
- The admin edit page detects URLs ending in `.heic` or `.heif` and shows a "this image format is not supported in browsers, please re-upload" warning, nudging cleanup.

A bulk server-side transcode pass is explicitly out of scope.

## Rollout sequence

1. Land code changes: new endpoints, widget, transcode lib, `UPLOAD_DIR` wiring, `.gitignore`.
2. Deploy. New env var present but optional; `UPLOAD_DIR` still defaults to `public/uploads` so old code path keeps working.
3. SSH to VPS:
   - `mkdir /var/lib/vmt-uploads` and chown.
   - `pnpm migrate:uploads --dry-run`, review.
   - `pnpm migrate:uploads`, writes new dir, updates DB.
   - Set `UPLOAD_DIR=/var/lib/vmt-uploads` in `.env`.
   - `pm2 restart`.
4. Verify a sample of public URLs in a browser.
5. `git rm -r --cached public/uploads`, commit, deploy. Old in-repo files vanish from future deploys.

### Rollback

If step 4 fails: unset `UPLOAD_DIR` in `.env`, `pm2 restart`. Code falls back to `public/uploads`. Legacy files are still in the repo until step 5 commit.

## Files touched

```
src/lib/image-transcode.ts                    new
src/lib/image-transcode.spec.ts               new
src/components/ui/ImageUpload/ImageUpload.tsx changed (new ImageSlot contract)
src/components/ui/ImageUpload/ImageUpload.spec.tsx changed
src/pages/api/admin/upload.ts                 rewritten (thinner)
src/pages/api/uploads/[...path].ts            new
src/pages/api/health/uploads.ts               new
src/pages/admin/<entity>/.../form-utils.ts    new submitWithImages helper per form
prisma/schema.prisma                          imageUrl/heroImage become nullable
prisma/migrations/<ts>_image_urls_nullable    new migration
scripts/migrate-uploads.ts                    new
scripts/sweep-orphan-uploads.ts               new
scripts/sweep-orphan-uploads.spec.ts          new
.gitignore                                    add /public/uploads/, /.uploads/
package.json                                  add scripts; add heic2any dep
VPS.md                                        document UPLOAD_DIR, sweep cron
```

New runtime dependency: `heic2any` (lazy-loaded; ~2 MB wasm). Per CLAUDE.md, dependency additions need explicit user approval — flag this on the implementation PR.

## Open questions

None at design time. Implementation plan will pin remaining decisions (exact cron timing for sweep, exact placeholder image asset).
