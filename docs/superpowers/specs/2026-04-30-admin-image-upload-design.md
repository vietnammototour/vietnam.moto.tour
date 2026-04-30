# Admin Image Upload

## Overview

Replace manual URL text inputs in admin forms with image upload components. Images stored on VPS in persistent directory, symlinked into project's `public/` for serving. All uploads converted to webp via `sharp`. Deterministic file paths based on entity type/ID/field — no new DB columns needed, existing URL fields repurposed to store local paths.

## Storage

### Directory Structure

```
/var/www/uploads/
  destinations/{id}/card.webp
  destinations/{id}/hero.webp
  tours/{id}/card.webp
```

### Symlink

```
{project}/public/uploads → /var/www/uploads/
```

Survives redeploys. Deploy script creates dir + symlink if missing. `public/uploads` added to `.gitignore`.

### Path Convention

Path is fully deterministic: `/{entityType}/{entityId}/{imageType}.webp`

Given entity type, ID, and field — path is known. No need to store path in DB.

## Data Model Changes

### Destination

- **Add** `heroImage` field — big hero image used on destination detail page and as hero for all related tours
- `imageUrl` — small card image (existing field, kept)

Both fields transition from external URLs to local paths. During migration period, existing external URLs remain functional.

### Tour

- **Remove** `heroImage` field — tour hero now comes from its destination's `heroImage`
- `imageUrl` — small card image (existing field, kept)

### Migration Strategy

Keep existing DB `imageUrl`/`heroImage` string fields. Upload flow writes local path (`/uploads/destinations/1/card.webp`) to DB field. Frontend image components work with whatever URL is in the field — external URLs continue working until replaced by upload.

Tour `heroImage` removal is a schema migration: drop column, update all tour detail pages to pull hero from `tour.destination`.

## API

### `POST /api/admin/upload`

Protected by `requireAdmin()`.

**Request:** multipart form data

- `file` — image file (jpg, png, webp, gif accepted)
- `entityType` — `tour` | `destination`
- `entityId` — numeric ID
- `imageType` — `card` | `hero`

**Validation:**

- File required, max 10MB
- `entityType` must be `tour` or `destination`
- `hero` imageType only valid for destinations
- Entity must exist in DB
- File must be an image (check MIME type)

**Processing:**

1. Parse multipart form data (Next.js 16 web standard `Request.formData()`)
2. Validate inputs
3. Convert to webp via `sharp` (preserve aspect ratio, reasonable quality ~80%)
4. Write to deterministic path: `/var/www/uploads/{entityType}s/{entityId}/{imageType}.webp`
5. Update DB field with local path: `/uploads/{entityType}s/{entityId}/{imageType}.webp`
6. Return `{ success: true, url: "/uploads/..." }`

**Error responses:**

- 400 — missing fields, invalid entityType/imageType, file too large, not an image
- 401 — not authenticated
- 403 — not admin
- 404 — entity not found
- 500 — sharp conversion or write failure

### `DELETE /api/admin/upload`

Protected by `requireAdmin()`.

**Request:** JSON body

- `entityType`, `entityId`, `imageType`

**Processing:**

1. Delete file from disk
2. Clear DB field (set to empty string)
3. Return `{ success: true }`

## Admin UI

### `ImageUploadField` Component

Reusable component used in `TourForm` and `DestinationForm`.

**Props:**

- `entityType: 'tour' | 'destination'`
- `entityId: number | null` (null for new/unsaved entities)
- `imageType: 'card' | 'hero'`
- `currentUrl?: string` — current image URL from DB
- `onUploadComplete: (url: string) => void`
- `label: string`

**States:**

1. **No entity ID** (new unsaved entity) — placeholder with "Save first, then upload" message
2. **No image** (entity exists, no URL) — gray placeholder with upload icon, clickable
3. **Has image** — preview thumbnail, hover shows replace/delete overlay
4. **Uploading** — progress/spinner overlay on image area

**Behavior:**

- Click placeholder or replace button → opens file picker (`accept="image/*"`)
- File selected → immediate upload via `POST /api/admin/upload` with FormData
- On success → update preview, call `onUploadComplete` with new URL
- Delete button → confirm dialog → `DELETE /api/admin/upload` → show placeholder

**Sizing:**

- Card image field: ~300x200px preview area
- Hero image field: ~600x200px preview area (wider aspect to represent hero)

### Form Integration

**`DestinationForm`:**

- Replace `imageUrl` text input → `ImageUploadField` (entityType="destination", imageType="card")
- Add new `ImageUploadField` for hero (entityType="destination", imageType="hero")

**`TourForm`:**

- Replace `imageUrl` text input → `ImageUploadField` (entityType="tour", imageType="card")
- Remove `heroImage` text input entirely

## Frontend Consumption

No changes to public-facing components needed — they already use `imageUrl` from DB, which will now contain local `/uploads/...` paths instead of external URLs. Next.js serves these from `public/uploads/` symlink.

Tour detail hero section needs update: instead of `tour.heroImage`, use `tour.destination.heroImage` (or derive from destination's deterministic path).

## Deploy Script Changes

Add to deploy script after build step:

```bash
# Create persistent uploads directory
mkdir -p /var/www/uploads/destinations /var/www/uploads/tours

# Symlink into project public dir
ln -sfn /var/www/uploads /var/www/vietnam-moto-tours/public/uploads
```

## Dependencies

- **`sharp`** — webp conversion
- **`formidable`** — multipart form parsing (Pages Router API routes use Node.js `IncomingMessage`, not web `Request`)

## .gitignore Addition

```
public/uploads
```

## Security Considerations

- All upload endpoints behind `requireAdmin()` auth
- File type validation via MIME type check (not just extension)
- Max file size enforced (10MB)
- Deterministic paths prevent path traversal — entity type is enum, ID is numeric, image type is enum
- No user-controlled filenames reach the filesystem
- Sharp processes the image, stripping any embedded payloads/EXIF data

## Out of Scope

- Tour gallery images (`images[]` JSON field) — future enhancement
- Image cropping/editing in browser
- CDN/S3 storage — VPS-local is sufficient for now
- Bulk upload
- Image optimization/resizing beyond format conversion
