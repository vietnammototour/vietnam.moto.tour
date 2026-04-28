# Spacing System Design

**Date:** 2026-04-21
**Status:** Approved

## Goal

Ensure all spacing across the website is consistent, well-balanced, and follows established design principles (Gestalt proximity, vertical rhythm, responsive scaling). Replace ad-hoc Tailwind values with a token-driven system for major spacing patterns.

## Approach

**Hybrid:** Define semantic CSS custom properties for recurring spacing patterns (sections, headings, grids). Keep direct Tailwind utilities for one-off, context-specific spacing (card internals, form inputs, buttons).

## Design Decisions

### 1. Spacing Tokens (CSS Custom Properties)

Added to the `@theme` block in `src/styles/globals.css`:

```css
/* Section spacing — unified, single tier */
--sp-section-y: 4rem; /* 64px — mobile */
--sp-section-y-lg: 6rem; /* 96px — desktop */

/* Container horizontal padding */
--sp-container-x: 1rem; /* 16px — mobile */
--sp-container-x-sm: 1.5rem; /* 24px — small */
--sp-container-x-lg: 2rem; /* 32px — desktop */

/* Heading hierarchy */
--sp-label-to-heading: 0.375rem; /* 6px — accent label to h2 */
--sp-heading-to-subtitle: 1rem; /* 16px — h2 to subtitle */
--sp-heading-to-content: 3rem; /* 48px — heading group to content */

/* Card & grid gaps (responsive scale) */
--sp-grid-gap: 1rem; /* 16px — mobile */
--sp-grid-gap-sm: 1.5rem; /* 24px — small */
--sp-grid-gap-lg: 2rem; /* 32px — desktop */

/* Element spacing (reference values, used as direct Tailwind) */
--sp-card-padding: 1.25rem; /* 20px — card internal padding */
--sp-element-gap: 0.5rem; /* 8px — tight inline elements */
--sp-block-gap: 1.5rem; /* 24px — between content blocks */
```

### 2. Unified Section Spacing

All sections use the same vertical padding — no emphasis tier:

```
py-[var(--sp-section-y)] lg:py-[var(--sp-section-y-lg)]
```

The video/CTA sections (currently `py-24 lg:py-32`) are reduced to match. Their dark backgrounds and full-width layouts provide visual weight without extra padding.

### 3. Standardized Container

Every container uses:

```
mx-auto max-w-7xl px-[var(--sp-container-x)] sm:px-[var(--sp-container-x-sm)] lg:px-[var(--sp-container-x-lg)]
```

This fixes the footer bottom tier which incorrectly uses `md:px-6` instead of `sm:px-6`.

### 4. Heading Group Pattern

Label and heading are grouped by proximity (Gestalt law). No decorative borders on subtitles — hierarchy comes from spacing and color contrast.

**With subtitle:**

```
[accent label]  — type-label-sm uppercase, mb-[var(--sp-label-to-heading)]
[h2 heading]    — type-headline-sm lg:type-headline-lg, mb-[var(--sp-heading-to-subtitle)]
[subtitle]      — muted color, mb-[var(--sp-heading-to-content)]
```

**Without subtitle:**

```
[accent label]  — type-label-sm uppercase, mb-[var(--sp-label-to-heading)]
[h2 heading]    — type-headline-sm lg:type-headline-lg, mb-[var(--sp-heading-to-content)]
```

Replaces the current inconsistent mix of `mt-2`, `mb-4`, `mb-6`, `mb-12`.

### 5. Responsive Grid Gaps

All card/content grids use a responsive scale:

```
gap-[var(--sp-grid-gap)] sm:gap-[var(--sp-grid-gap-sm)] lg:gap-[var(--sp-grid-gap-lg)]
```

Replaces fixed `gap-4`, `gap-6`, `gap-8` values that don't scale on mobile.

### 6. Element Spacing (Direct Tailwind)

These stay as direct Tailwind classes — too varied for tokens. Standardized values:

- Card internal padding: `p-5` (1.25rem)
- Icon + text pairs: `gap-2`
- Form inputs: `px-5 py-4`
- Standard buttons: `px-8 py-4`
- Compact buttons: `px-8 py-3`

## Files Affected

### High Impact (token adoption + pattern changes)

| File                     | Changes                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `src/styles/globals.css` | Add spacing tokens to `@theme` block                                                    |
| `src/pages/index.tsx`    | Section padding → token; heading groups → new pattern; grid gaps → responsive tokens    |
| `src/pages/about-us.tsx` | Section padding → unified (remove `py-24 lg:py-32`); fix `mb-4` → token; heading groups |
| `src/pages/contact.tsx`  | Section padding → token; heading group; grid gap → responsive token                     |
| `src/pages/tours.tsx`    | Section padding → token; grid gap → responsive token                                    |
| `src/pages/rentals.tsx`  | Section padding → token; grid gap → responsive token                                    |

### Medium Impact (consistency fixes)

| File                                     | Changes                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `src/components/footer/index.tsx`        | Fix container padding `md:px-6` → `sm:px-6` via token  |
| `src/components/page-header/index.tsx`   | Keep `py-3` (appropriate for thin bar)                 |
| `src/components/tour-carousel/index.tsx` | Align Swiper `spaceBetween` to token pixel equivalents |

### Low Impact (swap to tokens, values unchanged)

| File                              | Changes                                            |
| --------------------------------- | -------------------------------------------------- |
| `src/components/header/index.tsx` | Container padding → token (already correct values) |

### No Changes

| File                                     | Reason                                    |
| ---------------------------------------- | ----------------------------------------- |
| Tour card, destination card components   | Internal spacing stays as direct Tailwind |
| `src/components/layout/index.tsx`        | Just a wrapper, no spacing concerns       |
| `src/components/scroll-to-top/index.tsx` | Positioning only, not spacing system      |
| `_app.tsx`, `_document.tsx`              | No spacing concerns                       |
| Form inputs, buttons                     | Already consistent                        |

## Inconsistencies Fixed

1. Footer bottom tier `md:px-6` → `sm:px-6` (matches all other containers)
2. About page `mb-4` → heading-to-content token (matches all other h2s)
3. Video/CTA sections `py-24 lg:py-32` → unified section token
4. Accent labels missing bottom margin → `mb-[var(--sp-label-to-heading)]`
5. Fixed grid gaps → responsive scale
6. Heading `mt-2` pattern → proper `mb-` on label above (push down, not pull up)

## Design Principles Applied

- **Gestalt proximity:** Elements that belong together are closer (label + heading = one unit)
- **Vertical rhythm:** Consistent section cadence creates predictable page flow
- **Responsive scaling:** Spacing reduces proportionally on smaller viewports
- **Single source of truth:** Token changes propagate globally
- **YAGNI:** No emphasis tier, no decorative borders, no over-abstraction of element-level spacing
