# Tailwind Migration & Visual Refresh — Design Spec

## Overview

Full migration from the Tevily HTML template (Bootstrap 5 grid + 7,600 lines of vendor CSS + jQuery plugin stack) to Tailwind CSS v4 with a modernized visual identity. Big-bang approach — all pages and components rewritten in one pass.

### Core Problem

`overflow-x: hidden` on `html, body` (in `globals.css`) and `.page-wrapper` (in `tevily.css`) kills macOS elastic/rubber-band scrolling, degrading UX. This hack exists to mask overflow caused by the template's layout patterns. The fix is to replace the layout system entirely so the hack is unnecessary.

### Goals

1. Remove `overflow-x: hidden` from html/body — restore native macOS elastic scroll
2. Replace Bootstrap grid + Tevily CSS with Tailwind utility classes
3. Eliminate all jQuery/vendor JS dependencies (~25 scripts)
4. Visual refresh: modern adventure-travel aesthetic for a Vietnam motorcycle tour brand
5. Clean data layer: remove presentational classes from data objects

### Constraints

- Bootstrap CSS/JS files in `public/assets/vendors/bootstrap/` are not modified — they are deleted
- `tevily.css` and `tevily-responsive.css` are deleted (editable, but replacement is cleaner)
- No new dependencies installed without explicit user approval
- All images in `public/assets/images/` are retained
- Swiper stays (already npm package) — only restyled

---

## Section 1: Vendor Removal & Tailwind Setup

### Removed

- **All vendor CSS** (24 files in `public/assets/vendors/*/`) — currently loaded via `_document.tsx` `<link>` tags
- **`public/assets/css/tevily.css`** (7,609 lines) — template theme CSS
- **`public/assets/css/tevily-responsive.css`** (1,168 lines) — template responsive overrides
- **All vendor JS** (~25 `<Script>` tags duplicated across every page file): jQuery 3.6, Bootstrap JS, WOW.js, jarallax, owl-carousel, isotope, bxslider, vegas, twentytwenty, jquery-ui, timepicker, magnific-popup, nouislider, odometer, tiny-slider, countdown, wnumb, jquery-ajaxchimp, jquery-appear, jquery-circle-progress, jquery-validate, bootstrap-select
- **`public/assets/js/tevily.js`** — template init script
- **`overflow-x: hidden`** from `src/styles/globals.css`
- **`.page-wrapper { overflow: hidden }`** — gone with tevily.css deletion

### Added

- **Tailwind CSS v4** — `tailwindcss`, `@tailwindcss/postcss` (requires user approval to install)
- **PostCSS config** for Tailwind
- **`globals.css`** becomes Tailwind entry point: `@import "tailwindcss"` + custom theme tokens
- Font loading consolidated in `next/font` (DM Sans via Google, outBrave via local)

### Retained

- **Swiper** — npm package, restyled with Tailwind
- **FontAwesome** — CDN link in `_document.tsx` (or optional migration to `react-icons`)
- **`public/assets/images/`** — all image assets
- **`public/assets/fonts/`** — outBrave font files
- **`public/assets/vendors/tevily-icons/style.css`** — custom icon font (unless icons are replaced)

---

## Section 2: Design Tokens & Visual Identity

### Color Palette

| Token             | Value                         | Usage                                |
| ----------------- | ----------------------------- | ------------------------------------ |
| `primary`         | `#C2491D` (burnt terracotta)  | CTAs, active states, primary actions |
| `primary-light`   | `#E8604C`                     | Hover states, highlights             |
| `secondary`       | `#1B4332` (deep jungle green) | Secondary buttons, accents, badges   |
| `secondary-light` | `#2D6A4F`                     | Hover states for secondary           |
| `neutral-900`     | `#1A1A2E`                     | Headings, primary text               |
| `neutral-700`     | `#374151`                     | Body text                            |
| `neutral-500`     | `#6B7280`                     | Muted text, captions                 |
| `neutral-200`     | `#E5E7EB`                     | Borders, dividers                    |
| `neutral-100`     | `#F3F4F6`                     | Alternating section backgrounds      |
| `white`           | `#FFFFFF`                     | Cards, primary backgrounds           |
| `overlay`         | `rgba(26, 26, 46, 0.55)`      | Hero image overlays                  |

### Typography

| Role                | Font     | Weight                        | Size (mobile / desktop)       |
| ------------------- | -------- | ----------------------------- | ----------------------------- |
| Display (hero)      | outBrave | 400                           | 2.5rem / 4.5rem               |
| Headings (h1-h3)    | DM Sans  | 700                           | scale from 1.5rem to 2.5rem   |
| Subheadings (h4-h6) | DM Sans  | 600                           | scale from 1.125rem to 1.5rem |
| Body                | DM Sans  | 400                           | 1rem / 1.125rem               |
| Small / captions    | DM Sans  | 400                           | 0.875rem                      |
| Taglines            | DM Sans  | 700, uppercase, tracking-wide | 0.75rem                       |

### Spacing

Tailwind default 4px base. Section padding: `py-16` (mobile) / `py-24` (desktop).

### Other Tokens

- **Border radius:** `rounded-lg` (8px) for cards/buttons
- **Shadows:** `shadow-sm` default, `shadow-md` on hover
- **Breakpoints:** Tailwind defaults — `sm:640`, `md:768`, `lg:1024`, `xl:1280`
- **Container max-width:** `max-w-7xl` (1280px)

---

## Section 3: Layout Architecture

### Root Structure

```
<html>              -- natural overflow, elastic scroll works
  <body>            -- no overflow clipping
    <Layout>
      <Header />    -- sticky via position: sticky (no overflow hacks needed)
      <main>        -- natural flow
        {children}
      </main>
      <Footer />
    </Layout>
```

No `.page-wrapper` div. No overflow clipping on any ancestor element.

### Container Pattern

```
mx-auto max-w-7xl px-4 sm:px-6 lg:px-8
```

No negative margins. Full-bleed sections: outer div is full-width with background color/image, inner div gets container classes.

### Grid Replacement Mapping

| Bootstrap                       | Tailwind                                  |
| ------------------------------- | ----------------------------------------- |
| `.container`                    | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`  |
| `.row`                          | `grid grid-cols-12 gap-8`                 |
| `.col-xl-4 .col-lg-6 .col-md-6` | `col-span-12 md:col-span-6 xl:col-span-4` |
| `.col-xl-6`                     | `col-span-12 xl:col-span-6`               |
| `.col-xl-8 .col-lg-7`           | `col-span-12 lg:col-span-7 xl:col-span-8` |
| `.col-xl-2`                     | `col-span-12 md:col-span-6 xl:col-span-2` |
| `.col-xl-12`                    | `col-span-12`                             |

### Interactive Replacements

| jQuery feature             | React replacement                                 |
| -------------------------- | ------------------------------------------------- |
| Sticky header class toggle | `useScrollDirection` hook + `position: sticky`    |
| Mobile nav toggler         | React state + CSS `translate-x` transition        |
| Scroll-to-top              | `window.scrollTo({ top: 0, behavior: 'smooth' })` |

---

## Section 4: Component Architecture

### Header (merge of `header/index.tsx` + `header-mobile/index.tsx`)

One responsive component replacing two separate components.

- **Desktop:** two-tier — top bar (contact + socials) + nav bar (logo + menu)
- **Mobile:** hamburger triggers slide-in panel (React state + `translate-x` + `transition-transform`)
- **Sticky:** `sticky top-0 z-50` with backdrop blur on scroll
- **Dropdowns:** CSS `group-hover` or small React state (no jQuery)

### Footer (`footer/index.tsx`)

- 4-column grid: about (span-4), company (span-2), explore (span-2), newsletter (span-4)
- Responsive collapse: 2-col tablet, 1-col mobile
- Scroll-to-top: React `onClick`

### TourCard (`tour-card/index.tsx`)

- `next/image` replaces manual `<picture>` tags
- Hover: `group-hover:scale-105 transition-transform` on image
- Rating badge, title, price, meta list

### DestinationCard (`destination-card/index.tsx`)

- `colClass` prop removed — grid sizing handled by parent
- `next/image` with `fill` + `object-cover`
- Dark gradient overlay with text at bottom

### TourCarousel (`tour-carousel/index.tsx`)

- Swiper stays — restyled with Tailwind classes
- CSS Module file (`TourCarousel.module.css`) deleted
- Vendor Swiper CSS in `public/assets/vendors/swiper/` deleted (npm package CSS used instead)

### GalleryItem (`gallery-item/index.tsx`)

- Lightbox: replace magnific-popup with React lightbox or custom `<dialog>` modal
- Gallery layout: CSS Grid with explicit spans for masonry effect

### Layout (`layout/index.tsx`)

- Stays simple: Header + `<main>` + Footer
- Font classes applied at root level

### New Utilities

| Name                         | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| `useScrollDirection` hook    | Sticky header show/hide on scroll direction   |
| `ScrollToTop` component      | Floating button, visible after scrolling down |
| `MobileNav` (part of Header) | Slide-in mobile navigation panel              |

### Animation Strategy

| Current                  | Replacement                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| WOW.js fade-in-on-scroll | framer-motion `whileInView` or Intersection Observer + CSS `@keyframes` |
| Jarallax parallax        | CSS `bg-fixed` or lightweight `useParallax` hook                        |
| Float-bob-y              | Pure CSS `@keyframes` in globals.css                                    |

---

## Section 5: Page-by-Page Changes

### Home (`src/pages/index.tsx`)

**Hero:** Full-viewport video background — single slide, no Swiper wrapper. Overlay text centered with flexbox. outBrave display font.

**Destinations:** Section title + CSS Grid of DestinationCards with varying spans.

**About:** Two-column grid (xl). Left: image with "Book Tour Now" badge overlay. Right: title, description, checklist, CTA. Decorative shape images: keep or drop based on aesthetic fit.

**Popular Tours:** Section title + TourCarousel (Swiper). Full-width container.

**Video/CTA:** Parallax background. Two-column: left (video play button + text), right (icon grid). Video popup: React modal with YouTube iframe (replaces magnific-popup).

**Gallery:** Image strip with CSS Grid. Lightbox on click (React-based).

**Already removed sections stay removed:** Brand carousel, testimonials, why-choose, news.

### Tours (`src/pages/tours.tsx`)

Page header with background image + breadcrumb. 3-column card grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8`). TourCards.

### Contact (`src/pages/contact.tsx`)

Page header + breadcrumb. Two-column layout: left (title + socials), right (contact form). Form: 2-col input row + textarea + submit. Information strip: 3-column icon cards. Google Maps embed stays.

### About Us (`src/pages/about-us.tsx`)

Page header + breadcrumb. Content sections with text and imagery.

### Rental (`src/pages/rental.tsx`)

Page header + breadcrumb. Card grid similar to Tours.

### `_document.tsx`

Stripped of all vendor CSS `<link>` tags (24 removed). Keep only: FontAwesome CDN link (or migrate to `react-icons`), tevily-icons font CSS.

### `_app.tsx`

No changes — Layout wrapper stays.

### Script Tag Cleanup

All ~25 `<Script>` tags deleted from every page file. No replacements — React handles all interactivity.

---

## Section 6: Data Layer Changes

### `destinations.json` / `src/data/`

Remove presentational fields from destination data:

```diff
interface Destination {
  id: number;
  name: string;
  imageUrl: string;
  tours: number;
- colClass: string;
- width: string;
- height: string;
+ size: 'small' | 'large';
}
```

- `colClass` (Bootstrap classes in data) — removed, grid layout defined in page template
- `width` / `height` (inline `<picture>` sizing) — removed, `next/image` with `fill` handles responsive sizing
- `size` field added — semantic content decision ("this destination gets a bigger card"), not a layout class

---

## Section 7: Dependencies & Build

### Packages to Add (requires user approval)

| Package                | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `tailwindcss`          | Core styling framework                                   |
| `@tailwindcss/postcss` | PostCSS integration for Tailwind                         |
| `framer-motion`        | Scroll-triggered animations (replaces WOW.js + jarallax) |

### Optional Packages (user's choice)

| Package                      | Purpose                 | Alternative               |
| ---------------------------- | ----------------------- | ------------------------- |
| `react-icons`                | Replace FontAwesome CDN | Keep FontAwesome CDN link |
| `yet-another-react-lightbox` | Gallery lightbox        | Custom `<dialog>` modal   |

### Vendor Directories to Delete

All directories under `public/assets/vendors/` except:

- `fontawesome/` — keep unless migrating to `react-icons`
- `tevily-icons/` — custom icon font, keep

Also delete:

- `public/assets/css/tevily.css`
- `public/assets/css/tevily-responsive.css`
- `public/assets/js/tevily.js`

### Build Impact

- **CSS:** ~200KB+ (Bootstrap + Tevily + 24 vendor CSS) drops to ~10-15KB (Tailwind tree-shaken)
- **JS:** jQuery (~90KB) + 20+ plugins eliminated
- **First load** improves significantly
