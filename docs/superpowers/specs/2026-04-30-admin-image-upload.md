# Admin Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual URL text inputs in admin forms with image upload components that store images on VPS as webp files.

**Architecture:** Multipart upload API endpoint converts images to webp via sharp, writes to deterministic paths in `/var/www/uploads/` (symlinked to `public/uploads/`). Reusable `ImageUploadField` component replaces text inputs in admin forms. Destination gains `heroImage` field; Tour loses `heroImage` (inherits from destination).

**Tech Stack:** Next.js Pages Router API routes, sharp (webp conversion), Prisma migrations, React

---

### Task 1: Add sharp dependency and gitignore uploads

**Files:**

- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Install sharp**

```bash
pnpm add sharp
pnpm add -D @types/sharp
```

- [ ] **Step 2: Add public/uploads to .gitignore**

Add to `.gitignore`:

```
# Uploaded images (symlink to /var/www/uploads on VPS)
public/uploads
```

- [ ] **Step 3: Create local uploads directory for dev**

```bash
mkdir -p public/uploads/destinations public/uploads/tours
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "chore: add sharp dependency and gitignore public/uploads"
```

---

### Task 2: Prisma schema migration — add Destination.heroImage, remove Tour.heroImage

**Files:**

- Modify: `prisma/schema.prisma`
- Create: new migration via `prisma migrate`

- [ ] **Step 1: Update Prisma schema**

In `prisma/schema.prisma`, add `heroImage` to Destination model:

```prisma
model Destination {
  id            String   @id @default(uuid())
  slug          String   @unique
  name          String
  nameVi        String   @default("")
  nameEn        String   @default("")
  imageUrl      String   @default("")
  heroImage     String   @default("")
  descriptionVi String   @default("")
  descriptionEn String   @default("")
  size          String   @default("small")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  tours         Tour[]
}
```

Remove `heroImage` from Tour model (delete the line `heroImage      String      @default("")`).

- [ ] **Step 2: Create migration**

```bash
pnpm prisma migrate dev --name add-destination-hero-remove-tour-hero
```

This will create a migration that:

- Adds `heroImage` column to `Destination` table
- Drops `heroImage` column from `Tour` table

If there are existing tours with heroImage values you want to preserve, edit the generated migration SQL before applying. Insert before the DROP:

```sql
-- Copy tour heroImage to destination (take first non-empty value per destination)
UPDATE "Destination" d
SET "heroImage" = (
  SELECT t."heroImage" FROM "Tour" t
  WHERE t."destinationId" = d.id AND t."heroImage" != ''
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "Tour" t
  WHERE t."destinationId" = d.id AND t."heroImage" != ''
);
```

- [ ] **Step 3: Generate Prisma client**

```bash
pnpm prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add heroImage to Destination, remove from Tour"
```

---

### Task 3: Upload API endpoint

**Files:**

- Create: `src/pages/api/admin/upload.ts`

- [ ] **Step 1: Create upload API route**

Create `src/pages/api/admin/upload.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {requireAdmin} from '@/lib/admin-auth';
import {prisma} from '@/lib/prisma';
import sharp from 'sharp';
import {promises as fs} from 'fs';
import path from 'path';
import {IncomingForm, type File} from 'formidable';

// Disable Next.js body parser for multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const VALID_ENTITY_TYPES = ['tour', 'destination'] as const;
const VALID_IMAGE_TYPES = ['card', 'hero'] as const;

type EntityType = (typeof VALID_ENTITY_TYPES)[number];
type ImageType = (typeof VALID_IMAGE_TYPES)[number];

function parseForm(
  req: NextApiRequest,
): Promise<{fields: Record<string, string>; file: File}> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      filter: ({mimetype}) => !!mimetype && mimetype.startsWith('image/'),
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return reject(new Error('No file uploaded'));

      const parsed: Record<string, string> = {};
      for (const [key, val] of Object.entries(fields)) {
        parsed[key] = Array.isArray(val) ? val[0] : (val ?? '');
      }
      resolve({fields: parsed, file});
    });
  });
}

function getDestDir(entityType: EntityType, entityId: string): string {
  return path.join(UPLOAD_DIR, `${entityType}s`, entityId);
}

function getPublicUrl(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
): string {
  return `/uploads/${entityType}s/${entityId}/${imageType}.webp`;
}

async function updateDbField(
  entityType: EntityType,
  entityId: string,
  imageType: ImageType,
  url: string,
) {
  if (entityType === 'destination') {
    const field = imageType === 'card' ? 'imageUrl' : 'heroImage';
    await prisma.destination.update({
      where: {id: entityId},
      data: {[field]: url},
    });
  } else {
    // Tour only has 'card' (imageUrl)
    await prisma.tour.update({where: {id: entityId}, data: {imageUrl: url}});
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'POST') {
    let parsed;
    try {
      parsed = await parseForm(req);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid upload';
      return res.status(400).json({error: message});
    }

    const {fields, file} = parsed;
    const entityType = fields.entityType as EntityType;
    const entityId = fields.entityId;
    const imageType = fields.imageType as ImageType;

    // Validate entityType
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({error: `Invalid entityType: ${entityType}`});
    }

    // Validate imageType
    if (!VALID_IMAGE_TYPES.includes(imageType)) {
      return res.status(400).json({error: `Invalid imageType: ${imageType}`});
    }

    // hero only valid for destinations
    if (imageType === 'hero' && entityType !== 'destination') {
      return res
        .status(400)
        .json({error: 'hero imageType only valid for destinations'});
    }

    // Validate entity exists
    try {
      if (entityType === 'destination') {
        const dest = await prisma.destination.findUnique({
          where: {id: entityId},
        });
        if (!dest)
          return res.status(404).json({error: 'Destination not found'});
      } else {
        const tour = await prisma.tour.findUnique({where: {id: entityId}});
        if (!tour) return res.status(404).json({error: 'Tour not found'});
      }
    } catch {
      return res.status(404).json({error: 'Entity not found'});
    }

    // Convert to webp and write
    const destDir = getDestDir(entityType, entityId);
    await fs.mkdir(destDir, {recursive: true});

    const outputPath = path.join(destDir, `${imageType}.webp`);
    await sharp(file.filepath).webp({quality: 80}).toFile(outputPath);

    // Update DB
    const publicUrl = getPublicUrl(entityType, entityId, imageType);
    await updateDbField(entityType, entityId, imageType, publicUrl);

    // Clean up temp file
    await fs.unlink(file.filepath).catch(() => {});

    return res.json({success: true, url: publicUrl});
  }

  if (req.method === 'DELETE') {
    // DELETE uses regular JSON body
    const {entityType, entityId, imageType} = req.body as {
      entityType: EntityType;
      entityId: string;
      imageType: ImageType;
    };

    if (
      !VALID_ENTITY_TYPES.includes(entityType) ||
      !VALID_IMAGE_TYPES.includes(imageType)
    ) {
      return res.status(400).json({error: 'Invalid parameters'});
    }

    const filePath = path.join(
      getDestDir(entityType, entityId),
      `${imageType}.webp`,
    );
    await fs.unlink(filePath).catch(() => {});

    await updateDbField(entityType, entityId, imageType, '');

    return res.json({success: true});
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Install formidable**

```bash
pnpm add formidable
pnpm add -D @types/formidable
```

- [ ] **Step 3: Verify build compiles**

```bash
pnpm build
```

Expected: build succeeds (no type errors).

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/upload.ts package.json pnpm-lock.yaml
git commit -m "feat: add image upload API endpoint with sharp webp conversion"
```

---

### Task 4: ImageUploadField component

**Files:**

- Create: `src/components/admin/ImageUploadField.tsx`

- [ ] **Step 1: Create ImageUploadField component**

Create `src/components/admin/ImageUploadField.tsx`:

```tsx
'use client';

import {useState, useRef} from 'react';

interface ImageUploadFieldProps {
  entityType: 'tour' | 'destination';
  entityId: string | null;
  imageType: 'card' | 'hero';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
}

export function ImageUploadField({
  entityType,
  entityId,
  imageType,
  currentUrl,
  onUploadComplete,
  label,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = !!previewUrl;
  const isHero = imageType === 'hero';

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entityId) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('imageType', imageType);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      // Append cache-buster to force preview refresh
      setPreviewUrl(`${data.url}?t=${Date.now()}`);
      onUploadComplete(data.url);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete() {
    if (!entityId || !confirm('Delete this image?')) return;

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({entityType, entityId, imageType}),
      });

      if (res.ok) {
        setPreviewUrl('');
        onUploadComplete('');
      }
    } catch {
      setError('Delete failed');
    }
  }

  return (
    <div>
      <label className="block type-label-sm text-on-surface-secondary mb-1">
        {label}
      </label>

      {!entityId ? (
        <div
          className={`flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-surface-alt text-on-surface-secondary type-body-sm ${isHero ? 'h-48' : 'h-40'}`}
        >
          Save first to upload images
        </div>
      ) : (
        <div
          className={`relative group border-2 border-dashed border-border rounded-lg overflow-hidden ${isHero ? 'h-48' : 'h-40'} ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {hasImage ? (
            <>
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-gray-800 px-3 py-1.5 rounded-lg type-label-sm cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg type-label-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center text-on-surface-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <svg
                className="w-8 h-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="type-body-sm">Click to upload</span>
            </button>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="mt-1 type-body-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ImageUploadField.tsx
git commit -m "feat: add ImageUploadField component for admin forms"
```

---

### Task 5: Integrate ImageUploadField into DestinationForm

**Files:**

- Modify: `src/components/admin/DestinationForm.tsx`

- [ ] **Step 1: Add heroImage to DestinationFormData and replace image URL inputs**

In `src/components/admin/DestinationForm.tsx`:

Add `heroImage` to the `DestinationFormData` interface:

```typescript
interface DestinationFormData {
  slug: string;
  name: string;
  nameVi: string;
  nameEn: string;
  imageUrl: string;
  heroImage: string;
  descriptionVi: string;
  descriptionEn: string;
  size: string;
}
```

Add `heroImage: ''` to `emptyForm`.

Add import at top:

```typescript
import {ImageUploadField} from './ImageUploadField';
```

Replace the image URL text input block (lines 166-176) with:

```tsx
<div>
  <ImageUploadField
    entityType="destination"
    entityId={destinationId ?? null}
    imageType="card"
    currentUrl={form.imageUrl}
    onUploadComplete={(url) => updateField('imageUrl', url)}
    label="Card Image"
  />
</div>
<div>
  <label className="block type-label-sm text-on-surface-secondary mb-1">
    Size
  </label>
  <select
    value={form.size}
    onChange={(e) => updateField('size', e.target.value)}
    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
  >
    <option value="small">Small</option>
    <option value="large">Large</option>
  </select>
</div>
```

Add hero image field after the Size grid (before the submit buttons):

```tsx
<ImageUploadField
  entityType="destination"
  entityId={destinationId ?? null}
  imageType="hero"
  currentUrl={form.heroImage}
  onUploadComplete={(url) => updateField('heroImage', url)}
  label="Hero Image"
/>
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DestinationForm.tsx
git commit -m "feat: integrate image upload into DestinationForm"
```

---

### Task 6: Integrate ImageUploadField into TourForm

**Files:**

- Modify: `src/components/admin/TourForm.tsx`

- [ ] **Step 1: Replace image URL inputs with ImageUploadField**

In `src/components/admin/TourForm.tsx`:

Add import:

```typescript
import {ImageUploadField} from './ImageUploadField';
```

Remove `heroImage` from `TourFormData` interface and `emptyForm`.

Replace the `{/* Image URLs */}` section (lines 303-325) with:

```tsx
{
  /* Image */
}
<ImageUploadField
  entityType="tour"
  entityId={tourId ?? null}
  imageType="card"
  currentUrl={form.imageUrl}
  onUploadComplete={(url) => updateField('imageUrl', url)}
  label="Card Image"
/>;
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/TourForm.tsx
git commit -m "feat: integrate image upload into TourForm, remove heroImage field"
```

---

### Task 7: Update Tour type and TourHero to use destination heroImage

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/components/tour-hero/index.tsx`
- Modify: `src/data/queries.ts`

- [ ] **Step 1: Update Tour type — remove heroImage, add destinationHeroImage**

In `src/types/index.ts`, in the `Tour` interface:

- Remove: `heroImage: string;`
- Add: `destinationHeroImage: string;`

Add `heroImage` to the `Destination` interface:

```typescript
export interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  heroImage: string;
  size: 'small' | 'large';
}
```

- [ ] **Step 2: Update queries to populate destinationHeroImage**

In `src/data/queries.ts`:

Remove `heroImage` from the `DbTour` interface.

In `dbTourToTour`, replace `heroImage: row.heroImage` with:

```typescript
destinationHeroImage: '',
```

Update `getTourBySlug` to include destination and pass heroImage:

```typescript
export async function getTourBySlug(slug: string): Promise<Tour | undefined> {
  try {
    const row = await prisma.tour.findUnique({
      where: {slug, isActive: true},
      include: {destination: {select: {heroImage: true, name: true}}},
    });
    if (!row) return undefined;
    const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
    tour.destinationHeroImage = row.destination.heroImage;
    return tour;
  } catch (error) {
    console.error('getTourBySlug: DB query failed, using JSON fallback', error);
    return toursData.find((t) => t.slug === slug);
  }
}
```

Update `getAllTours` similarly — in the map callback:

```typescript
return rows.map((row) => {
  const tour = dbTourToTour(row as unknown as DbTour, row.destination.name);
  tour.destinationHeroImage = row.destination.heroImage;
  return tour;
});
```

Update `dbDestToDestination` to include heroImage:

```typescript
function dbDestToDestination(row: DbDestination): Destination {
  return {
    id: destNameToJsonId.get(row.name) ?? 0,
    name: row.name,
    imageUrl: row.imageUrl,
    heroImage: row.heroImage ?? '',
    size: row.size as 'small' | 'large',
  };
}
```

Add `heroImage` to the `DbDestination` interface:

```typescript
interface DbDestination {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  heroImage: string;
  size: string;
}
```

- [ ] **Step 3: Update TourHero component**

In `src/components/tour-hero/index.tsx`, change line 17-20:

Replace `tour.heroImage` with `tour.destinationHeroImage`:

```tsx
{
  tour.destinationHeroImage && (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{backgroundImage: `url(${tour.destinationHeroImage})`}}
    />
  );
}
```

- [ ] **Step 4: Update JSON fallback data if needed**

In `src/data/tours.json`, add `destinationHeroImage: ""` to each tour (or handle in the fallback code by defaulting). Simplest: update the JSON fallback in `toursData` usage to add the field:

In `src/data/queries.ts`, update the fallback in `getTourBySlug`:

```typescript
const fallback = toursData.find((t) => t.slug === slug);
if (fallback) return {...fallback, destinationHeroImage: ''};
return undefined;
```

And in `getAllTours` fallback:

```typescript
return toursData.map((t) => ({...t, destinationHeroImage: ''}));
```

- [ ] **Step 5: Verify build**

```bash
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/components/tour-hero/index.tsx src/data/queries.ts
git commit -m "feat: tour hero image now comes from destination"
```

---

### Task 8: Update admin API routes — remove heroImage from tour endpoints, add to destination

**Files:**

- Modify: `src/pages/api/admin/tours/index.ts`
- Modify: `src/pages/api/admin/tours/[id].ts`
- Modify: `src/pages/api/admin/destinations/index.ts`
- Modify: `src/pages/api/admin/destinations/[id].ts`

- [ ] **Step 1: Remove heroImage from tour create endpoint**

In `src/pages/api/admin/tours/index.ts`, remove line:

```typescript
heroImage: data.heroImage ?? '',
```

- [ ] **Step 2: Remove heroImage from tour update endpoint**

In `src/pages/api/admin/tours/[id].ts`, remove line:

```typescript
heroImage: data.heroImage,
```

- [ ] **Step 3: Add heroImage to destination create endpoint**

In `src/pages/api/admin/destinations/index.ts`, add to the create data:

```typescript
heroImage: data.heroImage ?? '',
```

- [ ] **Step 4: Add heroImage to destination update endpoint**

In `src/pages/api/admin/destinations/[id].ts`, add to the update data:

```typescript
heroImage: data.heroImage,
```

- [ ] **Step 5: Verify build**

```bash
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/api/admin/tours/index.ts src/pages/api/admin/tours/\[id\].ts src/pages/api/admin/destinations/index.ts src/pages/api/admin/destinations/\[id\].ts
git commit -m "feat: update admin APIs for heroImage migration tour→destination"
```

---

### Task 9: Update seed data and test factories

**Files:**

- Modify: `prisma/seed.ts`
- Modify: `src/test-utils/factories.ts`

- [ ] **Step 1: Update seed data**

In `prisma/seed.ts`:

- Remove `heroImage` from tour seed data
- Add `heroImage` to destination seed data (move the heroImage values from tours to their respective destinations)

- [ ] **Step 2: Update test factories**

In `src/test-utils/factories.ts`:

- Remove `heroImage` from tour factory
- Add `heroImage` to destination factory if present
- Add `destinationHeroImage` to tour factory with default `''`

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts src/test-utils/factories.ts
git commit -m "chore: update seed data and factories for heroImage migration"
```

---

### Task 10: Deploy script changes and documentation

**Files:**

- Modify: `VPS.md` (add uploads setup documentation)

- [ ] **Step 1: Document deploy changes needed**

Add to `VPS.md` under a new "Image Uploads" section:

````markdown
## Image Uploads

Uploaded images are stored in `/var/www/uploads/` and symlinked into the project:

```bash
# Create persistent uploads directory (one-time)
mkdir -p /var/www/uploads/destinations /var/www/uploads/tours
chown -R ci-cd:ci-cd /var/www/uploads

# Add to deploy script after build step:
ln -sfn /var/www/uploads /var/www/vietnam-moto-tours/public/uploads
```
````

The `UPLOAD_DIR` environment variable can override the default path (defaults to `{project}/public/uploads` for local dev).

````

- [ ] **Step 2: Commit**

```bash
git add VPS.md
git commit -m "docs: add image uploads VPS setup instructions"
````

---

### Task 11: Manual testing checklist

This is not a code task — verify the feature works end-to-end.

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test destination image upload**

1. Go to `/admin/destinations`
2. Edit an existing destination
3. Card Image field: click placeholder → select image → verify preview appears
4. Hero Image field: click placeholder → select image → verify preview appears
5. Verify files exist at `public/uploads/destinations/{id}/card.webp` and `hero.webp`
6. Refresh page — verify images persist (loaded from DB URL)

- [ ] **Step 3: Test tour image upload**

1. Go to `/admin/tours`
2. Edit an existing tour
3. Card Image field: click placeholder → select image → verify preview appears
4. Verify no heroImage field exists on tour form
5. Verify file at `public/uploads/tours/{id}/card.webp`

- [ ] **Step 4: Test tour detail page**

1. Visit a tour detail page
2. Verify hero image comes from the tour's destination heroImage

- [ ] **Step 5: Test image replacement**

1. Hover over an existing image → verify Replace/Delete overlay appears
2. Click Replace → select new file → verify preview updates
3. Verify old file was overwritten (deterministic path)

- [ ] **Step 6: Test image deletion**

1. Hover over image → click Delete → confirm
2. Verify placeholder returns
3. Verify file removed from disk

- [ ] **Step 7: Test new entity (no ID yet)**

1. Go to create new destination
2. Verify image fields show "Save first to upload images"
3. Save destination
4. Edit it — verify image fields now show upload placeholder
