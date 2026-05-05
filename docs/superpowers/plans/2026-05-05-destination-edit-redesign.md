# Destination Edit Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the admin destination edit page with live visual previews (TourHero, masonry grid), locale segmented picker, and tabbed image editing.

**Architecture:** Embedded production components (TourHero, DestinationCard) rendered directly in admin with props override. Thin wrapper components handle admin concerns (upload triggers, size toggle). Locale picker state lives in the parent tab component.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion 12, existing ImageUploadField component.

---

### Task 1: Add Preview Mode to TourHero Component

**Files:**

- Modify: `src/components/tour-hero/index.tsx`

- [ ] **Step 1: Add optional `preview` prop and `destinationName` override**

```tsx
interface TourHeroProps {
  tour?: Tour;
  preview?: {
    heroImage: string;
    destinationName: string;
  };
}
```

Modify the component to accept either `tour` (production) or `preview` (admin) props. When `preview` is provided, render only the image, gradient overlay, spotlight effect, and destination name — hide breadcrumbs, metadata, and pricing.

- [ ] **Step 2: Implement conditional rendering**

In the component body, derive display values:

```tsx
export function TourHero({tour, preview}: TourHeroProps) {
  const t = useTranslations('tourDetail');
  const spotlight = useCursorSpotlight(250, 0.12);
  const spotlightBg = useMotionTemplate`radial-gradient(250px circle at ${spotlight.x}px ${spotlight.y}px, rgba(180, 83, 9, 0.12), transparent)`;

  const heroImage = preview?.heroImage ?? tour?.destinationHeroImage;
  const displayName = preview?.destinationName ?? tour?.title;
  const isPreview = !!preview;

  return (
    <section className="relative">
      <div
        ref={spotlight.ref as React.RefObject<HTMLDivElement>}
        onMouseMove={spotlight.onMouseMove}
        onMouseLeave={spotlight.onMouseLeave}
        className="relative h-72 md:h-96 lg:h-[28rem] overflow-hidden texture-grain-warm"
      >
        {heroImage && (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage: `url(${heroImage})`}}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{background: spotlightBg}}
        />
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col justify-end h-full pb-8">
          <motion.h1
            variants={clipReveal}
            initial="hidden"
            animate="visible"
            className="type-display-sm md:type-display-lg text-on-surface-inverse mb-3 max-w-[70%]"
          >
            {displayName}
          </motion.h1>
          {!isPreview && tour && (
            <>
              <motion.div
                variants={slideFromLeft}
                initial="hidden"
                animate="visible"
                transition={{delay: 0.3}}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-on-surface-inverse/80 type-body-sm"
              >
                <span className="flex items-center gap-1.5">
                  <i className="fa fa-map-marker-alt" />{' '}
                  {getDestinationName(tour.destinationId)}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fa fa-clock" /> {tour.duration} {t('days')}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fa fa-road" /> {tour.distance} km
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fa fa-motorcycle" /> {tour.transportation}
                </span>
              </motion.div>
              <motion.div
                variants={slideFromLeft}
                initial="hidden"
                animate="visible"
                transition={{delay: 0.5}}
                className="mt-4 text-on-surface-inverse"
              >
                <span className="type-headline-lg">
                  {t('from')} ${tour.price}
                </span>
                <span className="type-body-sm ml-1 opacity-80">
                  {t('perPerson')}
                </span>
              </motion.div>
            </>
          )}
        </div>
      </div>
      {!isPreview && tour && (
        <div className="bg-surface-alt py-3">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 type-body-sm text-on-surface-secondary">
              <Link
                href="/"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {t('breadcrumbHome')}
              </Link>
              <span>/</span>
              <Link
                href="/tours"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {t('breadcrumbTours')}
              </Link>
              <span>/</span>
              <span className="text-on-surface type-label-lg">
                {tour.title}
              </span>
            </nav>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Verify production pages still work**

Run: `pnpm build`
Expected: Build succeeds, no type errors. Existing tour detail pages render normally since `tour` prop is still passed.

- [ ] **Step 4: Commit**

```bash
git add src/components/tour-hero/index.tsx
git commit -m "feat(tour-hero): add preview mode for admin usage"
```

---

### Task 2: Create HeroImagePreview Admin Wrapper

**Files:**

- Create: `src/components/admin/HeroImagePreview.tsx`

- [ ] **Step 1: Create the wrapper component**

```tsx
'use client';

import {useRef, useState} from 'react';
import {TourHero} from '@/components/tour-hero';
import {ImageUploadField} from './ImageUploadField';

interface HeroImagePreviewProps {
  destinationId: string | null;
  heroImage: string;
  destinationName: string;
  onImageChange: (url: string) => void;
}

export function HeroImagePreview({
  destinationId,
  heroImage,
  destinationName,
  onImageChange,
}: HeroImagePreviewProps) {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex items-center justify-between mb-4">
        <span className="type-label-sm text-on-surface-secondary">
          Hero Image Preview
        </span>
        <ImageUploadField
          entityType="destination"
          entityId={destinationId}
          imageType="hero"
          currentUrl={heroImage}
          onUploadComplete={onImageChange}
          label=""
          compact
        />
      </div>
      <div className="rounded-lg overflow-hidden">
        <TourHero
          preview={{
            heroImage: heroImage,
            destinationName: destinationName || 'Destination Name',
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `compact` prop to ImageUploadField**

Modify `src/components/admin/ImageUploadField.tsx` to accept an optional `compact` prop. When `compact` is true, render only a button (no label, no preview box) — the preview is handled externally by the hero component.

Add to the interface:

```tsx
interface ImageUploadFieldProps {
  entityType: 'tour' | 'destination';
  entityId: string | null;
  imageType: 'card' | 'hero';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  label: string;
  compact?: boolean;
}
```

Add at the top of the return, before the existing JSX:

```tsx
if (compact) {
  return (
    <div>
      {!entityId ? (
        <span className="type-body-sm text-on-surface-secondary">
          Save first to upload
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading
              ? 'Uploading...'
              : hasImage
                ? 'Change Image'
                : 'Upload Image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
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

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/HeroImagePreview.tsx src/components/admin/ImageUploadField.tsx
git commit -m "feat(admin): add HeroImagePreview wrapper with compact upload mode"
```

---

### Task 3: Create CardImagePreview Admin Component

**Files:**

- Create: `src/components/admin/CardImagePreview.tsx`

- [ ] **Step 1: Create the masonry grid preview component**

Note: The `DestinationCard` component renders a `<Link>` that would navigate away in admin. Wrap it in a div with `onClick={(e) => e.preventDefault()}` and `pointer-events-none` on the link — or pass an optional `disableLink` prop to `DestinationCard`. The simpler approach is wrapping with a click-preventing div:

```tsx
'use client';

import {useState} from 'react';
import {DestinationCard} from '@/components/destination-card';
import {ImageUploadField} from './ImageUploadField';

interface CardImagePreviewProps {
  destinationId: string | null;
  imageUrl: string;
  destinationName: string;
  size: 'small' | 'large';
  onImageChange: (url: string) => void;
  onSizeChange: (size: 'small' | 'large') => void;
}

function PlaceholderCard({big}: {big?: boolean}) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-surface-alt flex flex-col items-center justify-center text-on-surface-muted ${big ? 'h-full' : 'aspect-[3/2]'}`}
    >
      <i className="fa fa-image text-2xl opacity-20 mb-1" />
      <span className="type-label-sm uppercase opacity-40">Destination</span>
    </div>
  );
}

export function CardImagePreview({
  destinationId,
  imageUrl,
  destinationName,
  size,
  onImageChange,
  onSizeChange,
}: CardImagePreviewProps) {
  const cardDestination = {
    id: 0,
    name: destinationName || 'Destination Name',
    imageUrl: imageUrl,
    heroImage: '',
    size: size,
    tourCount: 3,
    hasCar: false,
    hasBike: true,
  };

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="type-label-sm text-on-surface-secondary">
            Card Size:
          </span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => onSizeChange('small')}
              className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
                size === 'small'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
              }`}
            >
              Small
            </button>
            <button
              type="button"
              onClick={() => onSizeChange('large')}
              className={`px-4 py-1.5 type-label-sm transition-colors cursor-pointer ${
                size === 'large'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
              }`}
            >
              Big
            </button>
          </div>
        </div>
        <ImageUploadField
          entityType="destination"
          entityId={destinationId}
          imageType="card"
          currentUrl={imageUrl}
          onUploadComplete={onImageChange}
          label=""
          compact
        />
      </div>

      {/* Masonry grid preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {size === 'large' ? (
          <>
            {/* Position 1: edited card (big, 2x2) */}
            <div className="sm:col-span-2 sm:row-span-2 relative">
              <div className="absolute top-2 left-2 z-30 bg-primary text-on-primary px-2 py-0.5 rounded type-label-sm uppercase">
                Editing
              </div>
              <div className="ring-2 ring-primary rounded-lg h-full [&_a]:pointer-events-none">
                <DestinationCard
                  destination={cardDestination}
                  className="h-full"
                />
              </div>
            </div>
            {/* Positions 2-5: placeholders */}
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </>
        ) : (
          <>
            {/* Position 1: placeholder (big, 2x2) */}
            <div className="sm:col-span-2 sm:row-span-2">
              <PlaceholderCard big />
            </div>
            {/* Position 2: edited card (small) */}
            <div className="relative">
              <div className="absolute top-2 left-2 z-30 bg-primary text-on-primary px-2 py-0.5 rounded type-label-sm uppercase">
                Editing
              </div>
              <div className="ring-2 ring-primary rounded-lg [&_a]:pointer-events-none">
                <DestinationCard destination={cardDestination} />
              </div>
            </div>
            {/* Positions 3-5: placeholders */}
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/CardImagePreview.tsx
git commit -m "feat(admin): add CardImagePreview with masonry grid and size toggle"
```

---

### Task 4: Create LocalePicker Component

**Files:**

- Create: `src/components/admin/LocalePicker.tsx`

- [ ] **Step 1: Create the segmented control component**

```tsx
'use client';

type Locale = 'en' | 'vi';

interface LocalePickerProps {
  value: Locale;
  onChange: (locale: Locale) => void;
}

export function LocalePicker({value, onChange}: LocalePickerProps) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`px-3.5 py-1.5 type-label-sm transition-colors cursor-pointer ${
          value === 'en'
            ? 'bg-primary text-on-primary'
            : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange('vi')}
        className={`px-3.5 py-1.5 type-label-sm transition-colors cursor-pointer ${
          value === 'vi'
            ? 'bg-primary text-on-primary'
            : 'bg-surface text-on-surface-secondary hover:bg-surface-alt'
        }`}
      >
        VI
      </button>
    </div>
  );
}

export type {Locale};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/LocalePicker.tsx
git commit -m "feat(admin): add LocalePicker segmented control component"
```

---

### Task 5: Rewrite DestinationEditTabs with New Structure

**Files:**

- Modify: `src/components/admin/DestinationEditTabs.tsx`

- [ ] **Step 1: Rewrite the component with 3 tabs and locale picker**

```tsx
'use client';

import {useState, useCallback} from 'react';
import {useRouter} from 'next/router';
import {DestinationGeneralForm} from './DestinationGeneralForm';
import {CardImagePreview} from './CardImagePreview';
import {DestinationHighlights} from './DestinationHighlights';
import {LocalePicker, type Locale} from './LocalePicker';

type TabId = 'general' | 'cardImage' | 'highlights';

export interface DestinationFormData {
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

interface DestinationEditTabsProps {
  mode: 'create' | 'edit';
  destinationId: string | null;
  initialData: DestinationFormData;
}

const tabs: {id: TabId; label: string}[] = [
  {id: 'general', label: 'General'},
  {id: 'cardImage', label: 'Card Image'},
  {id: 'highlights', label: 'Highlights'},
];

export function DestinationEditTabs({
  mode,
  destinationId: initialId,
  initialData,
}: DestinationEditTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [destinationId, setDestinationId] = useState<string | null>(initialId);
  const [locale, setLocale] = useState<Locale>('en');
  const [form, setForm] = useState<DestinationFormData>(initialData);

  const handleSaved = useCallback(
    (id: string) => {
      if (!destinationId) {
        setDestinationId(id);
        window.history.replaceState(null, '', `/admin/destinations/${id}/edit`);
      }
    },
    [destinationId],
  );

  const updateForm = useCallback(
    <K extends keyof DestinationFormData>(
      key: K,
      value: DestinationFormData[K],
    ) => {
      setForm((prev) => ({...prev, [key]: value}));
    },
    [],
  );

  const isTabDisabled = (tabId: TabId) =>
    tabId !== 'general' && mode === 'create' && !destinationId;

  const currentName = locale === 'en' ? form.nameEn : form.nameVi;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">
          {mode === 'create' ? 'Create New Destination' : 'Edit Destination'}
        </h1>
        <button
          type="button"
          onClick={() => router.push('/admin/destinations')}
          className="px-4 py-2 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors cursor-pointer"
        >
          Back to Destinations
        </button>
      </div>

      {/* Tab bar with locale picker */}
      <div className="flex items-center justify-between border-b-2 border-border mb-0">
        <div className="flex">
          {tabs.map((tab) => {
            const disabled = isTabDisabled(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 type-label-sm transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary -mb-[2px] font-semibold'
                    : disabled
                      ? 'text-on-surface-secondary/40 cursor-not-allowed'
                      : 'text-on-surface-secondary hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="pb-2">
          <LocalePicker value={locale} onChange={setLocale} />
        </div>
      </div>

      {/* Tab content */}
      <div className="border border-border border-t-0 rounded-b-lg overflow-hidden">
        {activeTab === 'general' && (
          <div className="p-5">
            <DestinationGeneralForm
              form={form}
              locale={locale}
              mode={mode}
              destinationId={destinationId}
              onFieldChange={updateForm}
              onSaved={handleSaved}
            />
          </div>
        )}

        {activeTab === 'cardImage' && (
          <div className="p-5">
            <CardImagePreview
              destinationId={destinationId}
              imageUrl={form.imageUrl}
              destinationName={currentName}
              size={form.size as 'small' | 'large'}
              onImageChange={(url) => updateForm('imageUrl', url)}
              onSizeChange={(size) => updateForm('size', size)}
            />
          </div>
        )}

        {activeTab === 'highlights' && destinationId && (
          <div className="p-5">
            <DestinationHighlights destinationId={destinationId} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiles (will fail until Task 6 is done)**

This task depends on Task 6 (DestinationGeneralForm). Proceed to Task 6 immediately.

- [ ] **Step 3: Commit (together with Task 6)**

Commit is in Task 6.

---

### Task 6: Create DestinationGeneralForm (Replaces DestinationForm)

**Files:**

- Create: `src/components/admin/DestinationGeneralForm.tsx`
- Modify: `src/components/admin/DestinationForm.tsx` (keep for backwards compat on new.tsx page, or delete if new.tsx also uses DestinationEditTabs)

- [ ] **Step 1: Create DestinationGeneralForm — text fields + hero preview**

This component receives form state from the parent (DestinationEditTabs) instead of managing its own. It only renders text fields (locale-aware) and the hero image preview.

```tsx
'use client';

import {useState} from 'react';
import {useRouter} from 'next/router';
import {HeroImagePreview} from './HeroImagePreview';
import type {DestinationFormData} from './DestinationEditTabs';
import type {Locale} from './LocalePicker';

interface DestinationGeneralFormProps {
  form: DestinationFormData;
  locale: Locale;
  mode: 'create' | 'edit';
  destinationId: string | null;
  onFieldChange: <K extends keyof DestinationFormData>(
    key: K,
    value: DestinationFormData[K],
  ) => void;
  onSaved?: (id: string) => void;
}

export function DestinationGeneralForm({
  form,
  locale,
  mode,
  destinationId,
  onFieldChange,
  onSaved,
}: DestinationGeneralFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nameField = locale === 'en' ? 'nameEn' : 'nameVi';
  const descField = locale === 'en' ? 'descriptionEn' : 'descriptionVi';
  const currentName = form[nameField];
  const currentDesc = form[descField];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url =
      mode === 'create'
        ? '/api/admin/destinations'
        : `/api/admin/destinations/${destinationId}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to save');
      return;
    }

    if (onSaved) {
      const data = await res.json();
      onSaved(data.id ?? destinationId);
    } else {
      router.push('/admin/destinations');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {error}
        </div>
      )}

      <div className="max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Slug
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => onFieldChange('slug', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block type-label-sm text-on-surface-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Name ({locale.toUpperCase()})
          </label>
          <input
            type="text"
            value={currentName}
            onChange={(e) => onFieldChange(nameField, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description ({locale.toUpperCase()})
          </label>
          <textarea
            rows={4}
            value={currentDesc}
            onChange={(e) => onFieldChange(descField, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving
              ? 'Saving...'
              : mode === 'create'
                ? 'Create Destination'
                : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Hero Image Preview */}
      <HeroImagePreview
        destinationId={destinationId}
        heroImage={form.heroImage}
        destinationName={currentName || form.name}
        onImageChange={(url) => onFieldChange('heroImage', url)}
      />
    </form>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds. All types resolve correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DestinationGeneralForm.tsx src/components/admin/DestinationEditTabs.tsx
git commit -m "feat(admin): rewrite destination edit with locale picker and 3-tab layout"
```

---

### Task 7: Update the new.tsx Page

**Files:**

- Modify: `src/pages/admin/destinations/new.tsx`

- [ ] **Step 1: Check if new.tsx uses DestinationForm directly or DestinationEditTabs**

Read the file. If it uses `DestinationEditTabs`, no changes needed (it already passes `mode="create"`). If it uses `DestinationForm` directly, update it to use `DestinationEditTabs` with `mode="create"`.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit (if changes were needed)**

```bash
git add src/pages/admin/destinations/new.tsx
git commit -m "feat(admin): update new destination page to use redesigned tabs"
```

---

### Task 8: Clean Up Old DestinationForm

**Files:**

- Modify or Delete: `src/components/admin/DestinationForm.tsx`

- [ ] **Step 1: Check if DestinationForm is imported anywhere else**

Search for imports of `DestinationForm` across the codebase. If only used in `DestinationEditTabs` (which we've already replaced), delete it.

- [ ] **Step 2: Remove the file if unused**

```bash
rm src/components/admin/DestinationForm.tsx
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(admin): remove old DestinationForm, replaced by DestinationGeneralForm"
```

---

### Task 9: Persist Size Change from Card Image Tab

**Files:**

- Modify: `src/components/admin/CardImagePreview.tsx`
- Modify: `src/components/admin/DestinationEditTabs.tsx`

- [ ] **Step 1: Auto-save size on toggle**

The size toggle in CardImagePreview calls `onSizeChange` which updates `form.size` in the parent. We need to persist this to the backend. Add a debounced auto-save for the size field in `DestinationEditTabs`:

```tsx
// In DestinationEditTabs, add a useEffect that saves size when it changes:
import {useEffect, useRef} from 'react';

// Inside the component:
const prevSizeRef = useRef(initialData.size);

useEffect(() => {
  if (!destinationId || form.size === prevSizeRef.current) return;
  prevSizeRef.current = form.size;

  // Save size to backend
  fetch(`/api/admin/destinations/${destinationId}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...form, size: form.size}),
  });
}, [form.size, destinationId]);
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DestinationEditTabs.tsx
git commit -m "feat(admin): auto-persist size on toggle in card image tab"
```

---

### Task 10: Integration Test — Manual Verification

**Files:** None (manual testing)

- [ ] **Step 1: Start dev server and test**

Run: `pnpm dev`

Verify:

1. Navigate to `/admin/destinations/{id}/edit`
2. General tab shows only: slug, name, name(locale), description(locale), save button, hero preview
3. Locale picker (EN/VI) toggles name and description fields
4. Hero preview shows TourHero component with gradient + spotlight
5. "Change Image" on hero triggers upload, preview updates
6. Card Image tab shows masonry grid with size toggle
7. Toggle Small → card appears at position 2
8. Toggle Big → card appears at position 1 (2×2)
9. Upload card image → grid preview updates
10. Highlights tab still works normally
11. Creating a new destination (`/admin/destinations/new`) works — tabs disabled until first save

- [ ] **Step 2: Verify production build**

Run: `pnpm build`
Expected: Clean build, no type errors, no warnings.

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(admin): address integration issues from destination edit redesign"
```
