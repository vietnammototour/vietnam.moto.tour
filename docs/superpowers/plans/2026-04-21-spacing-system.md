# Spacing System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce semantic spacing tokens and apply them consistently across all pages and components, fixing all discovered inconsistencies.

**Architecture:** CSS custom properties defined in `globals.css` `@theme` block (matching the existing typography token pattern). Pages and components reference tokens via Tailwind arbitrary value syntax `py-[var(--sp-*)]`. One-off element spacing remains as direct Tailwind utilities.

**Tech Stack:** Tailwind CSS v4, CSS custom properties, Next.js Pages Router

**Spec:** `docs/superpowers/specs/2026-04-21-spacing-system-design.md`

---

### Task 1: Define spacing tokens in globals.css

**Files:**

- Modify: `src/styles/globals.css:5-37` (inside `@theme` block)

- [ ] **Step 1: Add spacing tokens to @theme block**

In `src/styles/globals.css`, add spacing tokens after line 36 (`--color-on-surface-accent`) and before the closing `}` on line 37:

```css
/* Spacing — section */
--sp-section-y: 4rem;
--sp-section-y-lg: 6rem;

/* Spacing — container */
--sp-container-x: 1rem;
--sp-container-x-sm: 1.5rem;
--sp-container-x-lg: 2rem;

/* Spacing — heading hierarchy */
--sp-label-to-heading: 0.375rem;
--sp-heading-to-subtitle: 1rem;
--sp-heading-to-content: 3rem;

/* Spacing — grid gaps (responsive scale) */
--sp-grid-gap: 1rem;
--sp-grid-gap-sm: 1.5rem;
--sp-grid-gap-lg: 2rem;
```

Edit: replace `--color-on-surface-accent: #b45309;\n}` with the above tokens appended before the closing brace.

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds. Tokens are defined but not yet referenced — no visual change.

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add spacing tokens to CSS theme"
```

---

### Task 2: Update Home page (index.tsx) — section padding & heading groups

**Files:**

- Modify: `src/pages/index.tsx`

- [ ] **Step 1: Update Destinations section padding (line 72)**

Old: `<section className="py-16 lg:py-24">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 2: Update Destinations heading group (lines 75, 81-86)**

Old:

```jsx
className = 'text-center mb-12';
```

```jsx
<span className="type-label-sm uppercase text-on-surface-accent">
  {t('destinationLists')}
</span>
<h2 className="type-headline-sm lg:type-headline-lg mt-2">
  {t('goExoticPlaces')}
</h2>
```

New:

```jsx
className = 'text-center mb-(--sp-heading-to-content)';
```

```jsx
<span className="type-label-sm uppercase text-on-surface-accent mb-(--sp-label-to-heading)">
  {t('destinationLists')}
</span>
<h2 className="type-headline-sm lg:type-headline-lg">
  {t('goExoticPlaces')}
</h2>
```

Note: Remove `mt-2` from h2, add `mb-(--sp-label-to-heading)` to the accent label span. The wrapper div gets `mb-(--sp-heading-to-content)` instead of `mb-12`.

- [ ] **Step 3: Update Destinations grid gaps (lines 89, 122)**

Old: `gap-4` (both grids)
New: `gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)`

Line 89 — main grid:
Old: `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"`
New: `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)"`

Line 122 — bottom row:
Old: `className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4"`
New: `className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg) mt-(--sp-grid-gap)"`

Note: `mt-4` also becomes `mt-(--sp-grid-gap)` so the gap between grids matches the grid gap.

- [ ] **Step 4: Update About section padding (line 146)**

Old: `<section className="py-16 lg:py-24 bg-surface-alt">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg) bg-surface-alt">`

- [ ] **Step 5: Update About heading group (lines 185-190)**

Old:

```jsx
<span className="type-label-sm uppercase text-on-surface-accent">
  {t('getToKnowUs')}
</span>
<h2 className="type-headline-sm lg:type-headline-lg mt-2 mb-6">
  {t('planYourTrip')}
</h2>
```

New:

```jsx
<span className="type-label-sm uppercase text-on-surface-accent mb-(--sp-label-to-heading)">
  {t('getToKnowUs')}
</span>
<h2 className="type-headline-sm lg:type-headline-lg mb-(--sp-heading-to-subtitle)">
  {t('planYourTrip')}
</h2>
```

Note: This h2 has a subtitle paragraph after it (`aboutDescription`), so it uses `--sp-heading-to-subtitle` (16px) not `--sp-heading-to-content` (48px).

- [ ] **Step 6: Update Popular Tours section (lines 220, 223, 229-234)**

Section padding (line 220):
Old: `<section className="py-16 lg:py-24">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

Heading wrapper (line 223):
Old: `className="text-center mb-12"`
New: `className="text-center mb-(--sp-heading-to-content)"`

Accent label (line 229):
Old: `<span className="type-label-sm uppercase text-on-surface-accent">`
New: `<span className="type-label-sm uppercase text-on-surface-accent mb-(--sp-label-to-heading)">`

H2 (line 232):
Old: `<h2 className="type-headline-sm lg:type-headline-lg mt-2">`
New: `<h2 className="type-headline-sm lg:type-headline-lg">`

- [ ] **Step 7: Update Video/CTA section (lines 241, 250, 259, 262, 266)**

Section padding (line 241) — UNIFIED, was emphasis tier:
Old: `<section className="relative py-24 lg:py-32">`
New: `<section className="relative py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

Content grid gap (line 250):
Old: `className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"`
New: `className="grid grid-cols-1 lg:grid-cols-2 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg) items-center"`

Video CTA heading group (lines 259-264):
Old:

```jsx
<p className="type-label-lg uppercase text-primary-light mb-2">
  {t('readyToTravel')}
</p>
<h2 className="type-headline-sm lg:type-headline-lg text-white drop-shadow-lg">
```

New:

```jsx
<p className="type-label-lg uppercase text-primary-light mb-(--sp-label-to-heading)">
  {t('readyToTravel')}
</p>
<h2 className="type-headline-sm lg:type-headline-lg text-white drop-shadow-lg">
```

Feature cards grid (line 266):
Old: `className="grid grid-cols-2 sm:grid-cols-3 gap-6"`
New: `className="grid grid-cols-2 sm:grid-cols-3 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)"`

- [ ] **Step 8: Update Gallery section (lines 314, 316)**

Section padding (line 314):
Old: `<section className="py-16 lg:py-24 bg-surface-alt">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg) bg-surface-alt">`

Gallery grid gap (line 316):
Old: `className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"`
New: `className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)"`

- [ ] **Step 9: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds with no type or CSS errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/index.tsx
git commit -m "refactor: apply spacing tokens to home page"
```

---

### Task 3: Update About page (about-us.tsx)

**Files:**

- Modify: `src/pages/about-us.tsx`

- [ ] **Step 1: Update main section padding (line 37)**

Old: `<section className="py-16 lg:py-24">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 2: Fix heading group — the mb-4 inconsistency (lines 60-65)**

Old:

```jsx
<span className="type-label-sm uppercase text-on-surface-accent">
  {t('learnAboutUs')}
</span>
<h2 className="type-headline-sm lg:type-headline-lg mt-2 mb-4">
  {t('dareToExplore')}
</h2>
```

New:

```jsx
<span className="type-label-sm uppercase text-on-surface-accent mb-(--sp-label-to-heading)">
  {t('learnAboutUs')}
</span>
<h2 className="type-headline-sm lg:type-headline-lg mb-(--sp-heading-to-subtitle)">
  {t('dareToExplore')}
</h2>
```

Note: This h2 has a subtitle (`perfectPlace`) after it, so it uses `--sp-heading-to-subtitle`. This fixes the `mb-4` vs `mb-6` inconsistency — now both use the same token.

- [ ] **Step 3: Update CTA section padding (line 111)**

Old: `<section className="bg-primary py-12 lg:py-16">`
New: `<section className="bg-primary py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 4: Update Video section padding — UNIFIED (line 128)**

Old: `<section className="relative py-24 lg:py-32">`
New: `<section className="relative py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 5: Update Video heading group (lines 145-149)**

Old:

```jsx
<p className="type-label-lg uppercase text-primary-light mb-2">
  {t('readyToTravel')}
</p>
<h2 className="type-headline-sm lg:type-headline-lg max-w-2xl mx-auto">
```

New:

```jsx
<p className="type-label-lg uppercase text-primary-light mb-(--sp-label-to-heading)">
  {t('readyToTravel')}
</p>
<h2 className="type-headline-sm lg:type-headline-lg max-w-2xl mx-auto">
```

- [ ] **Step 6: Update Stats section padding (line 159)**

Old: `<section className="bg-secondary py-12 lg:py-16">`
New: `<section className="bg-secondary py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 7: Update Stats grid gap (line 161)**

Old: `className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white"`
New: `className="grid grid-cols-2 md:grid-cols-4 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg) text-center text-white"`

- [ ] **Step 8: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/pages/about-us.tsx
git commit -m "refactor: apply spacing tokens to about page"
```

---

### Task 4: Update Contact page (contact.tsx)

**Files:**

- Modify: `src/pages/contact.tsx`

- [ ] **Step 1: Update main section padding (line 27)**

Old: `<section className="py-16 lg:py-24">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 2: Update heading group (lines 31-34)**

Old:

```jsx
<span className="type-label-sm uppercase text-on-surface-accent">
  {t('talkWithTeam')}
</span>
<h2 className="type-headline-lg mt-2 mb-6">{t('anyQuestion')}</h2>
```

New:

```jsx
<span className="type-label-sm uppercase text-on-surface-accent mb-(--sp-label-to-heading)">
  {t('talkWithTeam')}
</span>
<h2 className="type-headline-lg mb-(--sp-heading-to-content)">{t('anyQuestion')}</h2>
```

Note: No subtitle follows this h2 — social icons come next. Use `--sp-heading-to-content`.

- [ ] **Step 3: Update form grid gap (line 58)**

Old: `className="grid grid-cols-1 sm:grid-cols-2 gap-6"`
New: `className="grid grid-cols-1 sm:grid-cols-2 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)"`

- [ ] **Step 4: Update info section padding (line 87)**

Old: `<section className="py-16 bg-surface-alt">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg) bg-surface-alt">`

Note: This was missing `lg:py-24` — now it gets both tiers via tokens.

- [ ] **Step 5: Update info cards grid gap (line 89)**

Old: `className="grid grid-cols-1 md:grid-cols-3 gap-8"`
New: `className="grid grid-cols-1 md:grid-cols-3 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)"`

- [ ] **Step 6: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/pages/contact.tsx
git commit -m "refactor: apply spacing tokens to contact page"
```

---

### Task 5: Update Tours page (tours.tsx) & Rental page (rental.tsx)

**Files:**

- Modify: `src/pages/tours.tsx`
- Modify: `src/pages/rental.tsx`

- [ ] **Step 1: Update Tours section padding (line 34)**

Old: `<section className="py-16 lg:py-24">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 2: Update Tours grid gap (line 36)**

Old: `className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"`
New: `className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)"`

- [ ] **Step 3: Update Rental section padding (line 77)**

Old: `<section className="py-16 lg:py-24">`
New: `<section className="py-(--sp-section-y) lg:py-(--sp-section-y-lg)">`

- [ ] **Step 4: Update Rental grid gap (line 79)**

Old: `className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"`
New: `className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-(--sp-grid-gap) sm:gap-(--sp-grid-gap-sm) lg:gap-(--sp-grid-gap-lg)"`

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/tours.tsx src/pages/rental.tsx
git commit -m "refactor: apply spacing tokens to tours and rental pages"
```

---

### Task 6: Fix footer container padding & update carousel spacing

**Files:**

- Modify: `src/components/footer/index.tsx`
- Modify: `src/components/tour-carousel/index.tsx`

- [ ] **Step 1: Fix footer bottom tier container (line 58)**

Old: `className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4"`
New: `className="mx-auto max-w-7xl px-(--sp-container-x) sm:px-(--sp-container-x-sm) lg:px-(--sp-container-x-lg) py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4"`

Note: This fixes the `md:px-6` → `sm:px-*` bug. Footer `py-4` stays as-is — it's not a section, it's a footer bar.

- [ ] **Step 2: Update footer top tier container (line 12)**

Old: `className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"`
New: `className="mx-auto max-w-7xl px-(--sp-container-x) sm:px-(--sp-container-x-sm) lg:px-(--sp-container-x-lg) py-8"`

- [ ] **Step 3: Update carousel spaceBetween values (lines 19, 29-32)**

Old:

```jsx
spaceBetween={24}
```

```jsx
breakpoints={{
  640: {slidesPerView: 2, spaceBetween: 20},
  768: {slidesPerView: 2, spaceBetween: 24},
  1024: {slidesPerView: 3, spaceBetween: 24},
  1280: {slidesPerView: 4, spaceBetween: 24},
}}
```

New:

```jsx
spaceBetween={16}
```

```jsx
breakpoints={{
  640: {slidesPerView: 2, spaceBetween: 24},
  768: {slidesPerView: 2, spaceBetween: 24},
  1024: {slidesPerView: 3, spaceBetween: 32},
  1280: {slidesPerView: 4, spaceBetween: 32},
}}
```

Note: Swiper uses pixel values, not CSS variables. Aligned to token equivalents: mobile 16px (`--sp-grid-gap`), sm 24px (`--sp-grid-gap-sm`), lg 32px (`--sp-grid-gap-lg`).

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/footer/index.tsx src/components/tour-carousel/index.tsx
git commit -m "fix: standardize footer container padding and carousel spacing"
```

---

### Task 7: Visual verification

- [ ] **Step 1: Start dev server and verify all pages**

Run: `pnpm dev`

Check each page in browser at both mobile (375px) and desktop (1440px) widths:

- `/` — Home: all 5 sections should have uniform vertical padding. Heading groups should show tight label→heading bond. Grids should have responsive gaps.
- `/about-us` — The `mb-4` heading is now using the same token as all others. Video section has reduced (unified) padding.
- `/contact` — Heading group consistent. Info section now has responsive lg padding.
- `/tours` — Grid gaps responsive.
- `/rental` — Grid gaps responsive.
- Footer bottom tier should match top tier horizontal padding at sm breakpoint.

- [ ] **Step 2: Verify dark mode**

Toggle dark mode and confirm spacing tokens work identically (they're not color-dependent, so they should).

- [ ] **Step 3: Final commit if any touch-ups needed**

Only if adjustments were made during visual QA.
