# Dark/Light Mode Theming Design

## Overview

Add a dark/light mode theming system to the Vietnam Moto Tour website. Colors are extracted into semantic CSS custom properties with two value sets (light/dark). The brand palette is refreshed with amber-gold and teal accents inspired by Vietnam's visual identity. A SwiftUI-style animated toggle in the header allows switching, persisted via cookie (same pattern as locale).

## Approach

**Semantic CSS Custom Properties with `[data-theme]` attribute** (Approach A).

All colors are defined as semantic tokens in `globals.css`. Values are overridden under `[data-theme="dark"]`. Tailwind v4's `@theme` block registers these tokens so utility classes (`bg-surface`, `text-on-surface`, etc.) are generated automatically. Components use semantic classes exclusively — no component needs to know about dark mode.

## Color Palette

### Brand Colors

| Token                     | Light Mode            | Dark Mode             | Inspiration               |
| ------------------------- | --------------------- | --------------------- | ------------------------- |
| `--color-primary`         | `#B45309` (amber-700) | `#F59E0B` (amber-500) | Temple gold, lantern glow |
| `--color-primary-light`   | `#D97706` (amber-600) | `#FBBF24` (amber-400) | Warmer on interaction     |
| `--color-secondary`       | `#0F766E` (teal-700)  | `#2DD4BF` (teal-400)  | Ha Long Bay, rice paddies |
| `--color-secondary-light` | `#14B8A6` (teal-500)  | `#5EEAD4` (teal-300)  | Lighter on interaction    |

### Neutral Palette (warm stone tones)

| Token     | Value     | Role                                         |
| --------- | --------- | -------------------------------------------- |
| stone-950 | `#0C0A09` | Darkest (dark mode footer/top bar)           |
| stone-900 | `#1C1917` | Dark mode main surface                       |
| stone-800 | `#292524` | Dark mode elevated/alt surfaces              |
| stone-700 | `#44403C` | Dark mode borders, light mode secondary text |
| stone-500 | `#78716C` | Muted text                                   |
| stone-400 | `#A8A29E` | Dark mode secondary text                     |
| stone-300 | `#D6D3D1` | Light mode borders                           |
| stone-200 | `#E7E5E4` | Light mode alt backgrounds                   |
| stone-100 | `#F5F5F4` | Light mode sections                          |
| stone-50  | `#FAFAF9` | Light mode main surface                      |

### Semantic Token Mapping

| Semantic Token                 | Light Mode            | Dark Mode             | Usage                           |
| ------------------------------ | --------------------- | --------------------- | ------------------------------- |
| `--color-surface`              | `#FAFAF9` (stone-50)  | `#1C1917` (stone-900) | Main page background            |
| `--color-surface-alt`          | `#F5F5F4` (stone-100) | `#292524` (stone-800) | Secondary sections, breadcrumbs |
| `--color-surface-elevated`     | `#FFFFFF`             | `#292524` (stone-800) | Cards, dropdowns, modals        |
| `--color-surface-inverse`      | `#1C1917` (stone-900) | `#0C0A09` (stone-950) | Top bar, footer, mobile menu    |
| `--color-on-surface`           | `#1C1917` (stone-900) | `#F5F5F4` (stone-100) | Primary text                    |
| `--color-on-surface-secondary` | `#78716C` (stone-500) | `#A8A29E` (stone-400) | Muted/secondary text            |
| `--color-on-surface-inverse`   | `#FFFFFF`             | `#E7E5E4` (stone-200) | Text on inverse surfaces        |
| `--color-on-primary`           | `#FFFFFF`             | `#1C1917` (stone-900) | Text on primary backgrounds     |
| `--color-border`               | `#D6D3D1` (stone-300) | `#44403C` (stone-700) | Default borders                 |
| `--color-border-subtle`        | `#E7E5E4` (stone-200) | `#292524` (stone-800) | Subtle dividers                 |
| `--color-overlay`              | `rgba(0,0,0,0.5)`     | `rgba(0,0,0,0.7)`     | Modal/dropdown backdrops        |

### Design Decisions

- Footer and top bar use `surface-inverse` — dark in light mode, even darker (stone-950) in dark mode for noticeable distinction.
- Mobile menu follows the `surface-inverse` pattern.
- Cards and dropdowns use `surface-elevated` — white in light, slightly lighter dark in dark mode.
- Primary accent brightens in dark mode (amber-700 to amber-500) per Apple HIG guidance on vibrancy.
- Warm stone neutrals instead of cold grays — more natural, matches the travel/adventure feel.

## Architecture

### ThemeProvider

A React context component placed in `_app.tsx` alongside `NextIntlClientProvider`.

**Exposes:**

- `theme: "light" | "dark"` — current theme value
- `toggleTheme: () => void` — switches between light and dark

**File:** `src/components/theme-provider/index.tsx`

**Behavior:**

1. On mount, reads `NEXT_THEME` cookie
2. If no cookie, defaults to `"light"`
3. Sets `data-theme` attribute on `document.documentElement`
4. On toggle: flips state, updates cookie, updates `data-theme`

### Persistence

Cookie-based, mirroring the locale pattern:

```
NEXT_THEME=light|dark; path=/; max-age=31536000; SameSite=Lax
```

- Read on mount via `document.cookie`
- Default: `light`
- 1-year expiration, same as `NEXT_LOCALE`

### Flash Prevention (FOUC)

A blocking `<script>` injected in `_document.tsx` inside `<body>`, before `<Main />`:

1. Reads the `NEXT_THEME` cookie synchronously
2. Sets `data-theme` attribute on `<html>` immediately
3. Runs before React hydration — prevents flash of wrong theme

### CSS Structure in globals.css

```css
@theme {
  /* Tailwind v4 @theme registers tokens AND sets :root defaults (light mode).
     These are the light mode values. Tailwind generates utility classes
     like bg-surface, text-on-surface, border-border automatically. */
  --color-primary: #b45309;
  --color-primary-light: #d97706;
  --color-secondary: #0f766e;
  --color-secondary-light: #14b8a6;
  --color-surface: #fafaf9;
  --color-surface-alt: #f5f5f4;
  --color-surface-elevated: #ffffff;
  --color-surface-inverse: #1c1917;
  --color-on-surface: #1c1917;
  --color-on-surface-secondary: #78716c;
  --color-on-surface-inverse: #ffffff;
  --color-on-primary: #ffffff;
  --color-border: #d6d3d1;
  --color-border-subtle: #e7e5e4;
  --color-overlay: rgba(0, 0, 0, 0.5);
}

/* Dark mode overrides — same custom property names, different values.
   Activated when data-theme="dark" is set on <html>. */
[data-theme="dark"] {
  --color-primary: #f59e0b;
  --color-primary-light: #fbbf24;
  --color-secondary: #2dd4bf;
  --color-secondary-light: #5eead4;
  --color-surface: #1c1917;
  --color-surface-alt: #292524;
  --color-surface-elevated: #292524;
  --color-surface-inverse: #0c0a09;
  --color-on-surface: #f5f5f4;
  --color-on-surface-secondary: #a8a29e;
  --color-on-surface-inverse: #e7e5e4;
  --color-on-primary: #1c1917;
  --color-border: #44403c;
  --color-border-subtle: #292524;
  --color-overlay: rgba(0, 0, 0, 0.7);
}
```

Note: No separate `:root` / `[data-theme="light"]` block is needed. The `@theme` block in Tailwind v4 sets `:root`-level custom properties which serve as the light mode defaults. The FOUC-prevention script sets `data-theme="light"` or `data-theme="dark"` on `<html>`, but since `@theme` defaults already represent light mode, only the `[data-theme="dark"]` override is required.

The old `neutral-*` custom properties and `primary`/`secondary` raw values are removed. All components migrate to semantic tokens.

## Toggle Component

### File

`src/components/theme-toggle/index.tsx`

### Design

SwiftUI-style pill toggle:

- **Track:** Rounded pill (~44px wide, ~24px tall)
- **Thumb:** Circle that slides left (light) / right (dark)
- **Icons:** Sun icon on left, moon icon on right (inside track, always visible)
- **Label:** Localized "Theme" text next to the toggle

### Styling

The toggle is a theme-controlling element — it uses hardcoded color values (not semantic tokens) since its appearance must be explicit for each state:

- Light mode active: track `#D6D3D1` (stone-300), thumb `#FFFFFF` (white)
- Dark mode active: track uses the amber primary (`#F59E0B`), thumb `#1C1917` (stone-900)
- Icons: muted by default, active side's icon brighter

### Motion Effects

- **Thumb slide:** Framer Motion spring animation (`type: "spring", stiffness: 500, damping: 30`) — satisfying iOS-like bounce
- **Icon swap:** Active icon scales up (`scale: 1.2`), inactive scales down (`scale: 0.8`) with fade, synced to thumb
- **Track color:** CSS `transition: background-color 300ms ease`
- **Page-wide crossfade:** On theme change, apply temporary `transition: color 200ms, background-color 200ms` to `*` via a class on `<html>`. Remove after 300ms to avoid interfering with other animations.

### Accessibility

- `role="switch"`
- `aria-checked={theme === "dark"}`
- `aria-label` with localized text
- Keyboard operable: Space and Enter to toggle
- Focus ring visible

### Placement

- **Desktop:** Top bar right section, inline with social icons. Layout: `[social icons] | [ThemeToggle]`
- **Mobile:** Bottom of mobile menu panel, alongside `LanguageSwitcher`

## Component Migration

All components replace hardcoded color classes with semantic tokens:

| Old Class                               | New Class                                        | Notes                        |
| --------------------------------------- | ------------------------------------------------ | ---------------------------- |
| `bg-white`                              | `bg-surface` or `bg-surface-elevated`            | Context-dependent            |
| `bg-neutral-100` / `bg-neutral-200`     | `bg-surface-alt`                                 | Secondary backgrounds        |
| `bg-neutral-900`                        | `bg-surface-inverse`                             | Top bar, footer, mobile menu |
| `text-white` (on dark bg)               | `text-on-surface-inverse`                        | Text on inverse surfaces     |
| `text-white` (on primary bg)            | `text-on-primary`                                | Text on primary buttons      |
| `text-neutral-900`                      | `text-on-surface`                                | Primary text                 |
| `text-neutral-700`                      | `text-on-surface` or `text-on-surface-secondary` | Context-dependent            |
| `text-neutral-500` / `text-neutral-400` | `text-on-surface-secondary`                      | Muted text                   |
| `border-neutral-200`                    | `border-border` or `border-border-subtle`        | Borders                      |
| `bg-black/X`                            | `bg-overlay` or keep with adjusted opacity       | Overlays                     |
| `white/X` (opacity variants)            | Context-dependent semantic token with opacity    | Evaluated per use            |

### Opacity Variants

For cases like `bg-white/95` (sticky header), use `bg-surface-elevated/95`. The semantic tokens compose with Tailwind's opacity modifier naturally.

## i18n

Add translation keys for the toggle:

**`src/messages/vi.json`:**

```json
{
  "ThemeToggle": {
    "label": "Giao dien",
    "light": "Sang",
    "dark": "Toi"
  }
}
```

**`src/messages/en.json`:**

```json
{
  "ThemeToggle": {
    "label": "Theme",
    "light": "Light",
    "dark": "Dark"
  }
}
```

## Files to Create

| File                                      | Purpose                        |
| ----------------------------------------- | ------------------------------ |
| `src/components/theme-provider/index.tsx` | ThemeProvider context + hook   |
| `src/components/theme-toggle/index.tsx`   | SwiftUI-style toggle component |

## Files to Modify

| File                                         | Changes                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| `src/styles/globals.css`                     | Replace color system with semantic tokens + light/dark sets |
| `src/pages/_document.tsx`                    | Add blocking theme script                                   |
| `src/pages/_app.tsx`                         | Wrap with ThemeProvider                                     |
| `src/components/header/index.tsx`            | Add ThemeToggle to top bar + mobile menu                    |
| `src/components/footer/index.tsx`            | Migrate to semantic color classes                           |
| `src/components/layout/index.tsx`            | No changes expected (structural only)                       |
| `src/components/language-switcher/index.tsx` | Migrate to semantic color classes                           |
| `src/components/scroll-to-top/index.tsx`     | Migrate to semantic color classes                           |
| `src/messages/vi.json`                       | Add ThemeToggle translations                                |
| `src/messages/en.json`                       | Add ThemeToggle translations                                |
| All page files in `src/pages/`               | Migrate hardcoded color classes to semantic tokens          |
| All component files in `src/components/`     | Migrate hardcoded color classes to semantic tokens          |

## Out of Scope

- System/OS preference detection (explicitly excluded — two-state toggle only)
- Third theme or custom themes
- Per-component theme overrides
- Image/asset dark mode variants (photos remain as-is)
