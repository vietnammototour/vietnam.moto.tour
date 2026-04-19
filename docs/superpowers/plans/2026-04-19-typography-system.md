# Typography System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a role-based typography system with 10 type utilities, 4-tier text colors, and 3 font weights, then migrate all components to use it.

**Architecture:** Tailwind CSS v4 `@theme` tokens define font sizes and new color tokens. `@utility` classes bundle size/weight/line-height/tracking into single-class roles (`type-headline-lg`, `type-body-sm`, etc.). Components replace scattered typography classes with these role utilities. No new React abstractions — pure CSS utilities.

**Tech Stack:** Tailwind CSS v4 (`@theme`, `@utility`, `@layer base`), `next/font` (DM Sans, Outbrave), CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-04-19-typography-system-design.md`

---

### Task 1: Add typography tokens and utility classes to globals.css

**Files:**

- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add font-size tokens and new color tokens to `@theme` block**

Add these lines inside the existing `@theme { }` block, after the existing color tokens:

```css
--font-size-display-lg: 3.5rem;
--font-size-display-sm: 2.75rem;
--font-size-headline-lg: 2rem;
--font-size-headline-sm: 1.5rem;
--font-size-title-lg: 1.25rem;
--font-size-title-sm: 1.125rem;
--font-size-body-lg: 1.125rem;
--font-size-body-sm: 1rem;
--font-size-label-lg: 0.875rem;
--font-size-label-sm: 0.75rem;

--color-on-surface-tertiary: #a8a29e;
--color-on-surface-accent: #b45309;
```

- [ ] **Step 2: Add dark mode overrides for new color tokens**

Add inside the existing `[data-theme='dark'] { }` block, after existing overrides:

```css
--color-on-surface-tertiary: #78716c;
--color-on-surface-accent: #f59e0b;
```

- [ ] **Step 3: Add all 10 `@utility` type classes**

Add after the existing `@utility font-display` block:

```css
@utility type-display-lg {
  font-family: var(--font-outbrave), sans-serif;
  font-size: var(--font-size-display-lg);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

@utility type-display-sm {
  font-family: var(--font-outbrave), sans-serif;
  font-size: var(--font-size-display-sm);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

@utility type-headline-lg {
  font-size: var(--font-size-headline-lg);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

@utility type-headline-sm {
  font-size: var(--font-size-headline-sm);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0;
}

@utility type-title-lg {
  font-size: var(--font-size-title-lg);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0;
}

@utility type-title-sm {
  font-size: var(--font-size-title-sm);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0;
}

@utility type-body-lg {
  font-size: var(--font-size-body-lg);
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: 0;
}

@utility type-body-sm {
  font-size: var(--font-size-body-sm);
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0;
}

@utility type-label-lg {
  font-size: var(--font-size-label-lg);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

@utility type-label-sm {
  font-size: var(--font-size-label-sm);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 4: Update base layer**

Replace the existing `@layer base` block with:

```css
@layer base {
  body {
    font-family: var(--font-sans);
    color: var(--color-on-surface-secondary);
    background-color: var(--color-surface);
    font-size: var(--font-size-body-sm);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-on-surface);
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}
```

Note: `@apply text-base leading-relaxed antialiased` is replaced with explicit properties. `font-bold` is removed from headings — weight is now per-role via `type-*` classes.

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no errors. Existing pages still render (type-\* classes are additive, not yet consumed).

- [ ] **Step 6: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat(typography): add type scale tokens, utility classes, and text color tiers"
```

---

### Task 2: Update font loading in \_app.tsx

**Files:**

- Modify: `src/pages/_app.tsx:15`

- [ ] **Step 1: Remove weight '500' from DM Sans config**

Change line 15 from:

```tsx
  weight: ['400', '500', '600', '700'],
```

to:

```tsx
  weight: ['400', '600', '700'],
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds. No visual change since weight 500 was barely used.

- [ ] **Step 3: Commit**

```bash
git add src/pages/_app.tsx
git commit -m "perf(fonts): drop unused DM Sans weight 500"
```

---

### Task 3: Migrate home page (index.tsx)

**Files:**

- Modify: `src/pages/index.tsx`

- [ ] **Step 1: Migrate hero section (lines 61, 64)**

Line 61 — hero title:

```
Before: "font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 text-white"
After:  "type-display-sm md:type-display-lg mb-4 text-white"
```

Line 64 — hero subtitle:

```
Before: "text-lg sm:text-xl md:text-2xl font-light text-white"
After:  "type-body-lg md:type-headline-sm text-white"
```

Note: `font-light` is dropped — Body Large uses weight 400 (regular) which is close to `font-light` (300) but more readable. At headline size the bold weight from `type-headline-sm` provides proper hierarchy.

- [ ] **Step 2: Migrate section label + heading pattern (lines 80, 83, 184, 187, 228, 231)**

This pattern repeats 3 times on the home page. Each instance follows the same transformation:

Section label (lines 80, 184, 228):

```
Before: "text-xs font-bold uppercase tracking-widest text-primary"
After:  "type-label-sm uppercase text-on-surface-accent"
```

Section heading (lines 83, 187, 231):

```
Before: "font-display text-3xl lg:text-4xl font-bold mt-2"
After:  "type-headline-sm lg:type-headline-lg mt-2"
```

Note: These headings previously used `font-display` (Outbrave). Per the spec, Outbrave is reserved for Display roles (hero only). Section headings move to DM Sans Bold via `type-headline-*`.

- [ ] **Step 3: Migrate about section text (line 190)**

Line 190 — about description:

```
Before: "font-display text-on-surface-secondary mb-6"
After:  "type-body-lg text-on-surface-secondary mb-6"
```

Note: Drops `font-display` — body text should use DM Sans.

- [ ] **Step 4: Migrate contact info block (lines 163, 165, 170)**

Line 163 — icon: leave as-is (icon sizing, not typography)

Line 165 — label:

```
Before: "text-xs text-on-surface-secondary"
After:  "type-label-sm text-on-surface-secondary"
```

Note: `type-label-sm` is semibold (600), but this is a non-bold label. Add `font-normal` override:

```
After:  "type-label-sm font-normal text-on-surface-secondary"
```

Line 170 — phone number:

```
Before: "font-bold text-on-surface hover:text-primary transition-colors"
After:  "type-title-sm text-on-surface hover:text-on-surface-accent transition-colors"
```

- [ ] **Step 5: Migrate features section (lines 201, 209)**

Line 201 — check icon: leave as-is (icon sizing)

Line 209 — CTA button:

```
Before: "inline-block bg-primary hover:bg-primary-light text-on-primary font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-lg transition-colors"
After:  "inline-block bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-3 rounded-lg transition-colors"
```

- [ ] **Step 6: Migrate testimonial/CTA section (lines 258, 261)**

Line 258 — testimonial label:

```
Before: "text-sm font-semibold uppercase tracking-widest text-primary-light mb-2"
After:  "type-label-lg uppercase text-primary-light mb-2"
```

Line 261 — testimonial heading:

```
Before: "font-display text-3xl lg:text-4xl font-bold leading-tight text-white drop-shadow-lg"
After:  "type-headline-sm lg:type-headline-lg text-white drop-shadow-lg"
```

- [ ] **Step 7: Migrate icon feature items (lines 277, 279)**

Line 277 — icon: leave as-is (icon sizing)

Line 279 — feature text:

```
Before: "text-sm font-semibold whitespace-pre-line text-white drop-shadow-md"
After:  "type-label-lg whitespace-pre-line text-white drop-shadow-md"
```

- [ ] **Step 8: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat(typography): migrate home page to type-* utilities"
```

---

### Task 4: Migrate about-us page

**Files:**

- Modify: `src/pages/about-us.tsx`

- [ ] **Step 1: Migrate section label + heading (lines 60, 63)**

Line 60 — label:

```
Before: "text-xs font-bold uppercase tracking-widest text-primary"
After:  "type-label-sm uppercase text-on-surface-accent"
```

Line 63 — heading:

```
Before: "text-3xl lg:text-4xl font-bold mt-2 mb-4"
After:  "type-headline-sm lg:type-headline-lg mt-2 mb-4"
```

- [ ] **Step 2: Migrate about content text (lines 66, 75, 78, 89, 92)**

Line 66 — featured paragraph:

```
Before: "text-primary font-semibold mb-4"
After:  "type-title-sm text-on-surface-accent mb-4"
```

Lines 75, 89 — stat labels:

```
Before: "text-sm font-bold text-on-surface"
After:  "type-label-lg text-on-surface"
```

Lines 78, 92 — stat values:

```
Before: "text-sm font-bold text-primary"
After:  "type-label-lg text-on-surface-accent"
```

- [ ] **Step 3: Migrate counter section (lines 110, 113, 119)**

Line 110 — counter label:

```
Before: "font-display text-sm opacity-80 mb-1"
After:  "type-label-lg opacity-80 mb-1"
```

Note: Drops `font-display` — labels should use DM Sans.

Line 113 — counter value:

```
Before: "text-2xl lg:text-3xl font-bold"
After:  "type-headline-sm lg:type-headline-lg"
```

Line 119 — CTA button:

```
Before: "bg-surface-elevated text-primary hover:bg-surface-alt font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition-colors flex-shrink-0"
After:  "bg-surface-elevated text-on-surface-accent hover:bg-surface-alt type-label-sm uppercase px-8 py-4 rounded-lg transition-colors flex-shrink-0"
```

- [ ] **Step 4: Migrate video/testimonial section (lines 143, 146)**

Line 143 — testimonial label:

```
Before: "text-sm font-semibold uppercase tracking-widest text-primary-light mb-2"
After:  "type-label-lg uppercase text-primary-light mb-2"
```

Line 146 — testimonial heading:

```
Before: "text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight"
After:  "type-headline-sm lg:type-headline-lg max-w-2xl mx-auto"
```

- [ ] **Step 5: Migrate stats section (lines 167, 170)**

Line 167 — stat number:

```
Before: "text-3xl lg:text-4xl font-bold mb-1"
After:  "type-headline-sm lg:type-headline-lg mb-1"
```

Line 170 — stat description:

```
Before: "text-sm text-white/70"
After:  "type-label-lg font-normal text-white/70"
```

- [ ] **Step 6: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/pages/about-us.tsx
git commit -m "feat(typography): migrate about-us page to type-* utilities"
```

---

### Task 5: Migrate contact page

**Files:**

- Modify: `src/pages/contact.tsx`

- [ ] **Step 1: Migrate all typography classes**

Line 31 — section label:

```
Before: "text-xs font-bold uppercase tracking-widest text-primary"
After:  "type-label-sm uppercase text-on-surface-accent"
```

Line 34 — section heading:

```
Before: "text-3xl font-bold mt-2 mb-6"
After:  "type-headline-lg mt-2 mb-6"
```

Lines 64, 69, 75 — form inputs (text-sm for placeholder/input sizing):

```
Before: "w-full bg-surface-alt border-0 rounded-lg px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
After:  "w-full bg-surface-alt border-0 rounded-lg px-5 py-4 type-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
```

Line 79 — submit button:

```
Before: "bg-primary hover:bg-primary-light text-on-primary font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-lg transition-colors"
After:  "bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase px-8 py-4 rounded-lg transition-colors"
```

Line 105 — info icon: leave as-is (icon sizing with `text-4xl`)

Line 108 — info text:

```
Before: "text-on-surface text-sm"
After:  "text-on-surface type-body-sm"
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/contact.tsx
git commit -m "feat(typography): migrate contact page to type-* utilities"
```

---

### Task 6: Migrate rental page

**Files:**

- Modify: `src/pages/rental.tsx`

- [ ] **Step 1: Migrate all typography classes**

Line 102 — badge:

```
Before: "absolute top-3 left-3 bg-secondary text-on-primary text-xs font-bold uppercase px-3 py-1 rounded-full"
After:  "absolute top-3 left-3 bg-secondary text-on-primary type-label-sm uppercase px-3 py-1 rounded-full"
```

Line 109 — heart icon: leave as-is (icon sizing)

Line 113 — rating:

```
Before: "flex items-center gap-1 text-sm text-primary font-semibold mb-2"
After:  "flex items-center gap-1 type-label-lg text-on-surface-accent mb-2"
```

Line 114 — star icon: leave as-is (icon sizing)

Line 116 — bike title:

```
Before: "text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors"
After:  "type-title-sm text-on-surface mb-2 group-hover:text-primary transition-colors"
```

Line 119 — bike description:

```
Before: "text-on-surface-secondary text-sm"
After:  "text-on-surface-secondary type-body-sm"
```

Line 120 — price:

```
Before: "text-primary font-bold text-lg"
After:  "text-on-surface-accent type-title-sm"
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/rental.tsx
git commit -m "feat(typography): migrate rental page to type-* utilities"
```

---

### Task 7: Migrate header component

**Files:**

- Modify: `src/components/header/index.tsx`

- [ ] **Step 1: Migrate top bar and nav items (lines 58, 123, 138)**

Line 58 — top bar:

```
Before: "bg-surface-inverse text-on-surface-inverse text-sm hidden lg:block"
After:  "bg-surface-inverse text-on-surface-inverse type-body-sm hidden lg:block"
```

Line 123 — desktop nav link:

```
Before: "text-sm font-semibold uppercase tracking-wide transition-colors py-6 ..."
After:  "type-label-lg uppercase transition-colors py-6 ..."
```

Note: Preserve the dynamic class portion (`${...}`) as-is.

Line 138 — dropdown link:

```
Before: "block px-4 py-2 text-sm text-on-surface hover:bg-surface-alt hover:text-primary transition-colors"
After:  "block px-4 py-2 type-body-sm text-on-surface hover:bg-surface-alt hover:text-primary transition-colors"
```

- [ ] **Step 2: Migrate mobile menu (lines 187, 199, 212, 218)**

Line 187 — close/hamburger icon: leave as-is (icon sizing with `text-xl`)

Line 199 — mobile nav link:

```
Before: "block py-3 border-b border-on-surface-inverse/10 text-sm font-medium uppercase tracking-wide transition-colors ..."
After:  "block py-3 border-b border-on-surface-inverse/10 type-label-lg uppercase transition-colors ..."
```

Note: Preserve the dynamic class portion.

Line 212 — mobile contact info:

```
Before: "flex items-center gap-2 text-sm text-on-surface-secondary hover:text-on-surface-inverse mb-3"
After:  "flex items-center gap-2 type-body-sm text-on-surface-secondary hover:text-on-surface-inverse mb-3"
```

Line 218 — mobile contact info:

```
Before: "flex items-center gap-2 text-sm text-on-surface-secondary hover:text-on-surface-inverse mb-4"
After:  "flex items-center gap-2 type-body-sm text-on-surface-secondary hover:text-on-surface-inverse mb-4"
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/header/index.tsx
git commit -m "feat(typography): migrate header component to type-* utilities"
```

---

### Task 8: Migrate footer component

**Files:**

- Modify: `src/components/footer/index.tsx`

- [ ] **Step 1: Migrate footer column headings (lines 54, 95, 136)**

Lines 54, 95, 136 — column headings (all same pattern):

```
Before: "text-on-surface-inverse font-bold text-lg mb-6"
After:  "text-on-surface-inverse type-title-sm mb-6"
```

- [ ] **Step 2: Migrate footer body text (lines 21, 22, 57, 98, 183)**

Line 21 — about text:

```
Before: "text-sm leading-relaxed mb-6"
After:  "type-body-sm mb-6"
```

Lines 22, 57, 98 — link lists:

```
Before: "space-y-3 text-sm"
After:  "space-y-3 type-body-sm"
```

Line 183 — copyright:

```
Before: "text-sm"
After:  "type-body-sm"
```

- [ ] **Step 3: Migrate newsletter and bottom bar (lines 143, 147, 152)**

Line 143 — email input:

```
Before: "flex-1 bg-on-surface-inverse/10 border border-on-surface-inverse/10 rounded-l-lg px-4 py-3 text-sm text-on-surface-inverse placeholder:text-on-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
After:  "flex-1 bg-on-surface-inverse/10 border border-on-surface-inverse/10 rounded-l-lg px-4 py-3 type-body-sm text-on-surface-inverse placeholder:text-on-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary"
```

Line 147 — subscribe button:

```
Before: "bg-primary hover:bg-primary-light text-on-surface-inverse font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-r-lg transition-colors"
After:  "bg-primary hover:bg-primary-light text-on-surface-inverse type-label-sm uppercase px-6 py-3 rounded-r-lg transition-colors"
```

Line 152 — privacy note:

```
Before: "flex items-center gap-2 mt-4 text-xs"
After:  "flex items-center gap-2 mt-4 type-label-sm font-normal"
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/footer/index.tsx
git commit -m "feat(typography): migrate footer component to type-* utilities"
```

---

### Task 9: Migrate remaining shared components

**Files:**

- Modify: `src/components/page-header/index.tsx`
- Modify: `src/components/tour-card/index.tsx`
- Modify: `src/components/destination-card/index.tsx`
- Modify: `src/components/language-switcher/index.tsx`
- Modify: `src/components/theme-toggle/index.tsx`
- Modify: `src/components/gallery-item/index.tsx`
- Modify: `src/components/video-modal/index.tsx`

- [ ] **Step 1: Migrate page-header (lines 18, 25, 37)**

Line 18 — page title:

```
Before: "text-4xl md:text-5xl font-bold text-on-surface-inverse"
After:  "type-headline-lg md:type-display-sm text-on-surface-inverse"
```

Line 25 — breadcrumb:

```
Before: "flex items-center gap-2 text-sm text-on-surface-secondary"
After:  "flex items-center gap-2 type-body-sm text-on-surface-secondary"
```

Line 37 — breadcrumb current:

```
Before: "text-on-surface font-medium"
After:  "text-on-surface type-label-lg"
```

Note: Remove `font-medium` — `type-label-lg` provides semibold (600) which is close and more consistent.

- [ ] **Step 2: Migrate tour-card (lines 20, 23, 24, 27)**

Line 20 — tour title:

```
Before: "text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors"
After:  "type-title-sm text-on-surface mb-2 group-hover:text-primary transition-colors"
```

Line 23 — tour description:

```
Before: "text-on-surface-secondary text-sm mb-4"
After:  "text-on-surface-secondary type-body-sm mb-4"
```

Line 24 — tour price:

```
Before: "text-primary font-bold text-lg"
After:  "text-on-surface-accent type-title-sm"
```

Line 27 — tour meta:

```
Before: "flex items-center gap-4 text-xs text-on-surface-secondary mt-auto pt-4 border-t border-border-subtle"
After:  "flex items-center gap-4 type-label-sm font-normal text-on-surface-secondary mt-auto pt-4 border-t border-border-subtle"
```

- [ ] **Step 3: Migrate destination-card (lines 23, 31)**

Line 23 — destination name:

```
Before: "text-xl font-bold text-white mb-1"
After:  "type-title-lg text-white mb-1"
```

Line 31 — destination badge:

```
Before: "inline-block bg-primary/90 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
After:  "inline-block bg-primary/90 text-white type-label-sm uppercase px-3 py-1 rounded-full"
```

- [ ] **Step 4: Migrate language-switcher (lines 15, 20, 31)**

Line 15 — switcher container:

```
Before: "flex items-center gap-1 text-sm font-semibold"
After:  "flex items-center gap-1 type-label-lg"
```

Lines 20, 31 — active locale indicator: replace `text-primary font-bold` with `text-on-surface-accent`:

```
Before: "text-primary font-bold"
After:  "text-on-surface-accent"
```

Note: Weight is already handled by the parent's `type-label-lg`.

- [ ] **Step 5: Migrate theme-toggle (lines 14, 27, 40)**

Line 14 — toggle label:

```
Before: "text-sm text-on-surface-inverse"
After:  "type-label-lg text-on-surface-inverse"
```

Lines 27, 40 — toggle icons (`text-xs`): leave as-is — these are icon sizing, not typography.

- [ ] **Step 6: Migrate gallery-item and video-modal**

`gallery-item/index.tsx` line 33 — close button icon (`text-2xl`): leave as-is — icon sizing.

`video-modal/index.tsx` line 34 — close button icon (`text-2xl`): leave as-is — icon sizing.

No typography changes needed for these two files.

- [ ] **Step 7: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/page-header/index.tsx src/components/tour-card/index.tsx src/components/destination-card/index.tsx src/components/language-switcher/index.tsx src/components/theme-toggle/index.tsx
git commit -m "feat(typography): migrate shared components to type-* utilities"
```

---

### Task 10: Remove legacy font-display utility

**Files:**

- Modify: `src/styles/globals.css`

- [ ] **Step 1: Verify no remaining `font-display` usage in components**

Run: `grep -r "font-display" src/components/ src/pages/`
Expected: No matches. All `font-display` usages were replaced in Tasks 3-9 with `type-display-lg` or `type-display-sm`.

- [ ] **Step 2: Remove the old `font-display` utility**

Remove from `globals.css`:

```css
@utility font-display {
  font-family: var(--font-outbrave), sans-serif;
}
```

The Outbrave font-family is now applied via `type-display-lg` and `type-display-sm` utilities.

- [ ] **Step 3: Verify no remaining raw typography classes**

Run: `grep -rE "(text-xs|text-sm|text-base|text-lg|text-xl|text-2xl|text-3xl|text-4xl|text-5xl|text-6xl|text-7xl)" src/components/ src/pages/ --include="*.tsx" | grep -v "// " | grep -v "text-primary" | grep -v "text-on-" | grep -v "text-white" | grep -v "text-secondary"`
Expected: Only icon-related size classes remain (e.g., `text-2xl` on FontAwesome icons, `text-4xl` on decorative icons). No body/heading text should use raw size classes.

Run: `grep -rE "(font-bold|font-semibold|font-medium|font-light)" src/components/ src/pages/ --include="*.tsx"`
Expected: Only explicit overrides used with `type-*` classes (e.g., `type-label-sm font-normal` for metadata). No standalone weight classes on text elements.

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/globals.css
git commit -m "refactor(typography): remove legacy font-display utility"
```

---

### Task 11: Visual verification and final commit

- [ ] **Step 1: Start dev server and verify visually**

Run: `pnpm dev`

Check these pages in the browser:

- `/` (home) — hero uses Outbrave, section headings are DM Sans Bold, body text is 16px, labels are consistent
- `/about-us` — stats, counters, and testimonial section have proper hierarchy
- `/contact` — form labels and inputs are readable, section heading is correct
- `/rental` — card titles, prices, and badges are consistent

- [ ] **Step 2: Check dark mode**

Toggle dark mode and verify:

- `on-surface-tertiary` text is visible but clearly muted
- `on-surface-accent` uses amber (#f59e0b) in dark mode
- All heading/body contrast ratios are maintained

- [ ] **Step 3: Check responsive behavior**

Resize browser to mobile width and verify:

- Responsive type role swaps (e.g., `type-headline-sm md:type-headline-lg`) work correctly
- No text is too large or too small on mobile
- Page header scales down properly

- [ ] **Step 4: Final commit if any adjustments were needed**

If visual review revealed issues and fixes were applied:

```bash
git add -A
git commit -m "fix(typography): visual adjustments from review"
```
