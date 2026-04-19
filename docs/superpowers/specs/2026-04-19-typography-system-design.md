# Typography System Design

A unified, role-based typography system for the Vietnam Moto Tour website, inspired by Material Design 3's structured scale, implemented via Tailwind CSS v4 `@theme` tokens and `@utility` classes.

## Goals

- Establish a limited, intentional set of typographic roles that cover all UI needs
- Reduce font weight payload (drop unused weight 500)
- Consolidate inconsistent heading sizes across pages
- Add missing text color tiers (tertiary, accent)
- Provide single-class convenience (`type-headline-lg` instead of `text-3xl font-bold leading-tight`)
- Preserve existing semantic color token patterns

## Fonts

| Font         | Role                       | Weights       | Source                       |
| ------------ | -------------------------- | ------------- | ---------------------------- |
| **Outbrave** | Display only (hero titles) | 700           | Local TTF/OTF                |
| **DM Sans**  | Everything else            | 400, 600, 700 | Google Fonts via `next/font` |

Weight 500 is dropped from the DM Sans font load in `_app.tsx`. The system uses three weights with clear purpose:

- **400 (Regular):** Body text, descriptions
- **600 (Semibold):** Titles, labels, UI elements
- **700 (Bold):** Display, headlines

## Type Scale — 10 Roles

Five categories (Display, Headline, Title, Body, Label) with two sizes each (Large, Small), following M3's structure:

| Role           | Utility Class      | Font     | Size            | Weight | Line Height | Tracking | Use Case                                |
| -------------- | ------------------ | -------- | --------------- | ------ | ----------- | -------- | --------------------------------------- |
| Display Large  | `type-display-lg`  | Outbrave | 56px (3.5rem)   | 700    | 1.1         | -0.02em  | Hero title                              |
| Display Small  | `type-display-sm`  | Outbrave | 44px (2.75rem)  | 700    | 1.15        | -0.01em  | Secondary hero, big marketing statement |
| Headline Large | `type-headline-lg` | DM Sans  | 32px (2rem)     | 700    | 1.2         | -0.01em  | Page section headings                   |
| Headline Small | `type-headline-sm` | DM Sans  | 24px (1.5rem)   | 700    | 1.3         | 0        | Subsection headings                     |
| Title Large    | `type-title-lg`    | DM Sans  | 20px (1.25rem)  | 600    | 1.4         | 0        | Card titles, feature names              |
| Title Small    | `type-title-sm`    | DM Sans  | 18px (1.125rem) | 600    | 1.4         | 0        | Small card titles, list headings        |
| Body Large     | `type-body-lg`     | DM Sans  | 18px (1.125rem) | 400    | 1.7         | 0        | Long-form paragraphs, featured text     |
| Body Small     | `type-body-sm`     | DM Sans  | 16px (1rem)     | 400    | 1.6         | 0        | Default body text (base)                |
| Label Large    | `type-label-lg`    | DM Sans  | 14px (0.875rem) | 600    | 1.4         | 0.01em   | Buttons, nav items, tags                |
| Label Small    | `type-label-sm`    | DM Sans  | 12px (0.75rem)  | 600    | 1.4         | 0.02em   | Badges, metadata, captions              |

Design decisions:

- Display roles use Outbrave; all others use DM Sans
- Titles use Semibold (600) to visually separate from Bold (700) headlines
- Labels use Semibold (600) for subtle authority without shouting
- Negative tracking on large sizes for a tighter feel; slight positive on small labels for readability
- No `uppercase` or heavy `letter-spacing` baked in — opt-in via standard Tailwind utilities

## Text Color Tokens

Four tiers of text color, extending the existing semantic system:

### Light Mode

| Token                  | CSS Variable                   | Value     | Purpose                                                   |
| ---------------------- | ------------------------------ | --------- | --------------------------------------------------------- |
| `on-surface`           | `--color-on-surface`           | `#1c1917` | Existing. Headings, primary text                          |
| `on-surface-secondary` | `--color-on-surface-secondary` | `#78716c` | Existing. Body text, descriptions                         |
| `on-surface-tertiary`  | `--color-on-surface-tertiary`  | `#a8a29e` | New. Captions, metadata, timestamps, placeholders         |
| `on-surface-accent`    | `--color-on-surface-accent`    | `#b45309` | New. Branded text — prices, highlights, active nav, links |

### Dark Mode

| Token                  | Value     | Notes                                                                            |
| ---------------------- | --------- | -------------------------------------------------------------------------------- |
| `on-surface`           | `#f5f5f4` | Existing                                                                         |
| `on-surface-secondary` | `#a8a29e` | Existing                                                                         |
| `on-surface-tertiary`  | `#78716c` | New. Reuses light mode's secondary value. ~4.8:1 contrast on `#1c1917` (WCAG AA) |
| `on-surface-accent`    | `#f59e0b` | New. Mirrors existing dark primary                                               |

Usage defaults:

- Display / Headline / Title: `on-surface`
- Body: `on-surface-secondary`
- Label: `on-surface-secondary`, with `on-surface-tertiary` for metadata
- Accent: never a default — always applied explicitly for intentional emphasis

`on-surface-accent` mirrors `primary` values intentionally — it is the text-safe version of the brand color.

## Implementation

### `@theme` block additions

New font-size tokens added to the existing `@theme` block in `globals.css`:

```css
@theme {
  /* ...existing color tokens... */

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
}
```

Dark mode overrides in `[data-theme='dark']`:

```css
[data-theme='dark'] {
  /* ...existing overrides... */
  --color-on-surface-tertiary: #78716c;
  --color-on-surface-accent: #f59e0b;
}
```

### `@utility` classes

Each role is a single utility bundling size, weight, line-height, and tracking:

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

### Base layer updates

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
  /* font-bold removed from heading base — weight is now defined per-role via type-* classes */

  a {
    color: inherit;
    text-decoration: none;
  }
}
```

### Font loading cleanup

In `_app.tsx`, reduce DM Sans weight list:

```tsx
const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'], // removed '500'
  variable: '--font-dm-sans',
  display: 'swap',
});
```

## Migration

### Class mapping reference

| Current Pattern                               | New Role                                                   |
| --------------------------------------------- | ---------------------------------------------------------- |
| `text-7xl font-display font-bold`             | `type-display-lg`                                          |
| `text-5xl font-display font-bold`             | `type-display-sm`                                          |
| `text-4xl font-bold` / `text-3xl font-bold`   | `type-headline-lg`                                         |
| `text-2xl font-bold`                          | `type-headline-sm`                                         |
| `text-xl font-semibold` / `text-lg font-bold` | `type-title-lg`                                            |
| `text-lg font-semibold`                       | `type-title-sm`                                            |
| `text-lg` (body context)                      | `type-body-lg`                                             |
| `text-base` / `text-sm` (body context)        | `type-body-sm`                                             |
| `text-xs font-bold uppercase tracking-widest` | `type-label-lg` or `type-label-sm` + `uppercase` if needed |

Key migration effects:

- Inconsistent heading sizes (h2 ranging from `text-3xl` to `text-5xl`) consolidate to `type-headline-lg`
- Overused `text-sm` body text (41% of all text sizing) bumps up to 16px via `type-body-sm`
- `text-primary` used on **text content** (prices, links, highlighted labels) migrates to `text-on-surface-accent`. `text-primary` used on **UI elements** (icon colors, decorative accents) remains unchanged — it is still a valid surface/UI color token

### Conventions

**Do:**

- Use `type-*` classes as the single source of typographic styling
- Combine with color classes: `type-headline-lg text-on-surface-accent`
- Add `uppercase` / `tracking-wide` explicitly when needed
- Use semantic HTML elements (h1-h4, p, span) alongside type classes

**Don't:**

- Mix raw Tailwind text size classes (`text-sm`, `text-3xl`) with `type-*`
- Apply `font-bold` / `font-semibold` manually — weight is baked into the role
- Create ad-hoc size/weight combinations outside the 10 roles

### Responsive behavior

Use role swapping at breakpoints rather than arbitrary responsive sizes:

```jsx
<h2 className="type-headline-sm md:type-headline-lg">Section Title</h2>
```

### Migration scope

~40+ component files with ~80 instances of text sizing and font weight classes to update. The migration is mechanical — find-and-replace guided by the mapping table.
