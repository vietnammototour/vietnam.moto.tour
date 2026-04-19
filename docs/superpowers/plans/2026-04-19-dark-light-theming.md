# Dark/Light Mode Theming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark/light mode theming system with semantic CSS custom properties, a SwiftUI-style animated toggle, and cookie-based persistence.

**Architecture:** All colors defined as semantic tokens in `globals.css` via Tailwind v4 `@theme`, overridden under `[data-theme="dark"]`. A `ThemeProvider` context manages state, a blocking script in `_document.tsx` prevents FOUC, and all components migrate from hardcoded colors to semantic tokens.

**Tech Stack:** Next.js 16 (Pages Router), React 19, Tailwind CSS v4, Framer Motion 12, next-intl 4

**Spec:** `docs/superpowers/specs/2026-04-19-dark-light-theming-design.md`

---

## File Structure

### New Files

| File                                      | Responsibility                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/components/theme-provider/index.tsx` | React context providing `theme` state and `toggleTheme`, reads/writes `NEXT_THEME` cookie, sets `data-theme` on `<html>` |
| `src/components/theme-toggle/index.tsx`   | SwiftUI-style animated pill toggle with sun/moon icons, Framer Motion spring thumb, localized label                      |

### Modified Files

| File                                                   | What Changes                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `src/styles/globals.css`                               | Replace `@theme` color tokens with semantic tokens + add `[data-theme="dark"]` override block |
| `src/components/tour-carousel/TourCarousel.module.css` | Replace hardcoded colors with CSS variables                                                   |
| `src/pages/_document.tsx`                              | Add blocking `<script>` for FOUC prevention                                                   |
| `src/pages/_app.tsx`                                   | Wrap app with `ThemeProvider`                                                                 |
| `src/messages/vi.json`                                 | Add `ThemeToggle` translation keys                                                            |
| `src/messages/en.json`                                 | Add `ThemeToggle` translation keys                                                            |
| `src/components/header/index.tsx`                      | Add `ThemeToggle` to top bar and mobile menu, migrate colors                                  |
| `src/components/footer/index.tsx`                      | Migrate colors to semantic tokens                                                             |
| `src/components/page-header/index.tsx`                 | Migrate colors to semantic tokens                                                             |
| `src/components/tour-card/index.tsx`                   | Migrate colors to semantic tokens                                                             |
| `src/components/destination-card/index.tsx`            | Migrate colors to semantic tokens                                                             |
| `src/components/gallery-item/index.tsx`                | Migrate colors to semantic tokens                                                             |
| `src/components/video-modal/index.tsx`                 | Migrate colors to semantic tokens                                                             |
| `src/components/scroll-to-top/index.tsx`               | Migrate colors to semantic tokens                                                             |
| `src/components/language-switcher/index.tsx`           | Migrate colors to semantic tokens                                                             |
| `src/pages/index.tsx`                                  | Migrate colors to semantic tokens                                                             |
| `src/pages/about-us.tsx`                               | Migrate colors to semantic tokens                                                             |
| `src/pages/contact.tsx`                                | Migrate colors to semantic tokens                                                             |
| `src/pages/rental.tsx`                                 | Migrate colors to semantic tokens                                                             |

---

## Task 1: Replace Color System in globals.css

**Files:**

- Modify: `src/styles/globals.css`

- [ ] **Step 1: Replace `@theme` block with semantic tokens (light mode defaults)**

Replace the entire contents of `src/styles/globals.css` with:

```css
@import 'tailwindcss';

@theme {
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

  --font-sans: var(--font-dm-sans), 'DM Sans', sans-serif;
}

/* Dark mode overrides */
[data-theme='dark'] {
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

/* Page-wide theme transition (applied temporarily on toggle) */
.theme-transitioning,
.theme-transitioning * {
  transition:
    color 200ms ease,
    background-color 200ms ease,
    border-color 200ms ease !important;
}

@utility font-display {
  font-family: var(--font-outbrave), sans-serif;
}

@layer base {
  body {
    font-family: var(--font-sans);
    color: var(--color-on-surface-secondary);
    background-color: var(--color-surface);
    @apply text-base leading-relaxed antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-on-surface);
    @apply font-bold;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}

/* Float bob animation */
@keyframes float-bob-y {
  0% {
    transform: translateY(-20px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(-20px);
  }
}

.animate-float-bob-y {
  animation: float-bob-y 3s linear infinite;
}
```

- [ ] **Step 2: Update TourCarousel.module.css**

Replace colors in `src/components/tour-carousel/TourCarousel.module.css`. Replace `color: black` with `color: var(--color-on-surface)`, replace `background: rgba(255, 255, 255, 0.8)` with `background: color-mix(in srgb, var(--color-surface-elevated) 80%, transparent)`, replace `color: white` with `color: var(--color-on-primary)`. Keep `background: var(--color-primary)` and `box-shadow` as-is.

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds. The site will look broken because components still reference old tokens (`neutral-*`) — that's expected and will be fixed in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css src/components/tour-carousel/TourCarousel.module.css
git commit -m "feat(theme): replace color system with semantic tokens and dark mode overrides"
```

---

## Task 2: Create ThemeProvider

**Files:**

- Create: `src/components/theme-provider/index.tsx`
- Modify: `src/pages/_document.tsx`
- Modify: `src/pages/_app.tsx`

- [ ] **Step 1: Create ThemeProvider context**

Create `src/components/theme-provider/index.tsx`:

```tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const match = document.cookie.match(/(?:^|; )NEXT_THEME=(\w+)/);
  return match?.[1] === 'dark' ? 'dark' : 'light';
}

function setThemeCookie(theme: Theme) {
  document.cookie = `NEXT_THEME=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      setThemeCookie(next);
      document.documentElement.setAttribute('data-theme', next);

      // Page-wide crossfade transition
      document.documentElement.classList.add('theme-transitioning');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);

      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

- [ ] **Step 2: Add FOUC-prevention script to \_document.tsx**

In `src/pages/_document.tsx`, add a `<script>` inside `<body>` before `<Main />`:

```tsx
<body>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var m=document.cookie.match(/(?:^|; )NEXT_THEME=(\\w+)/);var t=m&&m[1]==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`,
    }}
  />
  <Main />
  <NextScript />
</body>
```

- [ ] **Step 3: Wrap app with ThemeProvider in \_app.tsx**

In `src/pages/_app.tsx`, import `ThemeProvider` and wrap the existing content. The `ThemeProvider` should wrap `NextIntlClientProvider` (or be at the same level):

```tsx
import {ThemeProvider} from '@/components/theme-provider';
```

Then in the JSX, wrap the existing `NextIntlClientProvider` and its children:

```tsx
<ThemeProvider>
  <NextIntlClientProvider ...>
    ...
  </NextIntlClientProvider>
</ThemeProvider>
```

- [ ] **Step 4: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds. ThemeProvider renders, FOUC script sets `data-theme` attribute on page load.

- [ ] **Step 5: Commit**

```bash
git add src/components/theme-provider/index.tsx src/pages/_document.tsx src/pages/_app.tsx
git commit -m "feat(theme): add ThemeProvider context with cookie persistence and FOUC prevention"
```

---

## Task 3: Create ThemeToggle Component

**Files:**

- Create: `src/components/theme-toggle/index.tsx`
- Modify: `src/messages/vi.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add translation keys**

Add to `src/messages/en.json` (at the top level, alongside existing keys):

```json
"ThemeToggle": {
  "label": "Theme",
  "light": "Light",
  "dark": "Dark"
}
```

Add to `src/messages/vi.json`:

```json
"ThemeToggle": {
  "label": "Giao dien",
  "light": "Sang",
  "dark": "Toi"
}
```

- [ ] **Step 2: Create ThemeToggle component**

Create `src/components/theme-toggle/index.tsx`:

```tsx
'use client';

import {motion} from 'framer-motion';
import {useTranslations} from 'next-intl';
import {useTheme} from '@/components/theme-provider';

export default function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();
  const t = useTranslations('ThemeToggle');
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-on-surface-inverse">{t('label')}</span>
      <button
        role="switch"
        aria-checked={isDark}
        aria-label={t(isDark ? 'dark' : 'light')}
        onClick={toggleTheme}
        className="relative flex h-6 w-11 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300"
        style={{
          backgroundColor: isDark ? '#F59E0B' : '#D6D3D1',
        }}
      >
        {/* Sun icon (left side) */}
        <motion.span
          className="absolute left-1 text-xs"
          animate={{
            scale: isDark ? 0.8 : 1.2,
            opacity: isDark ? 0.4 : 1,
          }}
          transition={{type: 'spring', stiffness: 500, damping: 30}}
          aria-hidden
        >
          &#9728;
        </motion.span>

        {/* Moon icon (right side) */}
        <motion.span
          className="absolute right-1 text-xs"
          animate={{
            scale: isDark ? 1.2 : 0.8,
            opacity: isDark ? 1 : 0.4,
          }}
          transition={{type: 'spring', stiffness: 500, damping: 30}}
          aria-hidden
        >
          &#9790;
        </motion.span>

        {/* Thumb */}
        <motion.span
          className="z-10 block h-5 w-5 rounded-full shadow-md"
          style={{
            backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
          }}
          animate={{x: isDark ? 20 : 0}}
          transition={{type: 'spring', stiffness: 500, damping: 30}}
          aria-hidden
        />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/theme-toggle/index.tsx src/messages/vi.json src/messages/en.json
git commit -m "feat(theme): add ThemeToggle component with spring animation and i18n"
```

---

## Task 4: Integrate ThemeToggle into Header

**Files:**

- Modify: `src/components/header/index.tsx`

This task does two things: adds the ThemeToggle to the header (desktop top bar + mobile menu) AND migrates all header color classes to semantic tokens.

- [ ] **Step 1: Add ThemeToggle import**

Add to imports in `src/components/header/index.tsx`:

```tsx
import ThemeToggle from '@/components/theme-toggle';
```

- [ ] **Step 2: Add ThemeToggle to desktop top bar**

In the top bar's right section (the `flex items-center gap-4` container with social icons), add a divider and the ThemeToggle after the last social icon link:

```tsx
<span className="mx-2 text-on-surface-inverse/30">|</span>
<ThemeToggle />
```

- [ ] **Step 3: Add ThemeToggle to mobile menu**

In the mobile menu, near the `LanguageSwitcher` at the bottom, add:

```tsx
<ThemeToggle />
```

- [ ] **Step 4: Migrate all header color classes to semantic tokens**

Apply these replacements throughout `src/components/header/index.tsx`:

| Old                       | New                             |
| ------------------------- | ------------------------------- |
| `bg-neutral-900`          | `bg-surface-inverse`            |
| `text-white` (on dark bg) | `text-on-surface-inverse`       |
| `bg-white/95`             | `bg-surface-elevated/95`        |
| `bg-white`                | `bg-surface-elevated`           |
| `text-neutral-900`        | `text-on-surface`               |
| `text-neutral-700`        | `text-on-surface`               |
| `border-neutral-200`      | `border-border`                 |
| `hover:bg-neutral-100`    | `hover:bg-surface-alt`          |
| `text-neutral-400`        | `text-on-surface-secondary`     |
| `bg-black/50`             | `bg-overlay`                    |
| `border-white/10`         | `border-on-surface-inverse/10`  |
| `hover:text-white`        | `hover:text-on-surface-inverse` |

- [ ] **Step 5: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/header/index.tsx
git commit -m "feat(theme): integrate ThemeToggle into header and migrate header colors"
```

---

## Task 5: Migrate Footer Colors

**Files:**

- Modify: `src/components/footer/index.tsx`

- [ ] **Step 1: Migrate all footer color classes**

Apply these replacements throughout `src/components/footer/index.tsx`:

| Old                            | New                                     |
| ------------------------------ | --------------------------------------- |
| `bg-neutral-900`               | `bg-surface-inverse`                    |
| `text-neutral-400`             | `text-on-surface-secondary`             |
| `text-white`                   | `text-on-surface-inverse`               |
| `hover:text-white`             | `hover:text-on-surface-inverse`         |
| `bg-white/10`                  | `bg-on-surface-inverse/10`              |
| `border-white/10`              | `border-on-surface-inverse/10`          |
| `placeholder:text-neutral-500` | `placeholder:text-on-surface-secondary` |
| `text-neutral-500`             | `text-on-surface-secondary`             |

- [ ] **Step 2: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/footer/index.tsx
git commit -m "feat(theme): migrate footer colors to semantic tokens"
```

---

## Task 6: Migrate Shared Components

**Files:**

- Modify: `src/components/page-header/index.tsx`
- Modify: `src/components/tour-card/index.tsx`
- Modify: `src/components/destination-card/index.tsx`
- Modify: `src/components/gallery-item/index.tsx`
- Modify: `src/components/video-modal/index.tsx`
- Modify: `src/components/scroll-to-top/index.tsx`
- Modify: `src/components/language-switcher/index.tsx`

- [ ] **Step 1: Migrate page-header/index.tsx**

| Old                | New                         |
| ------------------ | --------------------------- |
| `text-white`       | `text-on-surface-inverse`   |
| `bg-neutral-100`   | `bg-surface-alt`            |
| `text-neutral-500` | `text-on-surface-secondary` |
| `text-neutral-300` | `text-on-surface-secondary` |
| `text-neutral-900` | `text-on-surface`           |

- [ ] **Step 2: Migrate tour-card/index.tsx**

| Old                  | New                         |
| -------------------- | --------------------------- |
| `bg-white`           | `bg-surface-elevated`       |
| `bg-black/10`        | `bg-overlay/20`             |
| `text-neutral-900`   | `text-on-surface`           |
| `text-neutral-500`   | `text-on-surface-secondary` |
| `text-neutral-400`   | `text-on-surface-secondary` |
| `border-neutral-100` | `border-border-subtle`      |

- [ ] **Step 3: Migrate destination-card/index.tsx**

| Old                             | New                                              |
| ------------------------------- | ------------------------------------------------ |
| `from-black/70`                 | Keep as-is (image overlay gradient, always dark) |
| `via-black/20`                  | Keep as-is                                       |
| `text-white` (on image overlay) | Keep as-is (always on dark overlay)              |
| `bg-primary/90`                 | Keep as-is (primary badge)                       |

Note: Destination cards have image overlays — the text is always on a dark gradient, so these stay hardcoded.

- [ ] **Step 4: Migrate gallery-item/index.tsx**

| Old                        | New                                  |
| -------------------------- | ------------------------------------ |
| `bg-black/40`              | Keep as-is (image overlay)           |
| `bg-white/90`              | `bg-surface-elevated/90`             |
| `text-neutral-900`         | `text-on-surface`                    |
| `bg-black/90`              | Keep as-is (lightbox backdrop)       |
| `text-white` (in lightbox) | Keep as-is (always on dark backdrop) |
| `hover:text-neutral-300`   | `hover:text-on-surface-secondary`    |

- [ ] **Step 5: Migrate video-modal/index.tsx**

| Old                      | New                                  |
| ------------------------ | ------------------------------------ |
| `bg-black/80`            | Keep as-is (modal backdrop)          |
| `text-white`             | Keep as-is (always on dark backdrop) |
| `hover:text-neutral-200` | `hover:text-on-surface-secondary`    |

- [ ] **Step 6: Migrate scroll-to-top/index.tsx**

| Old                      | New                                        |
| ------------------------ | ------------------------------------------ |
| `bg-primary`             | Keep as-is (uses semantic primary already) |
| `text-white`             | `text-on-primary`                          |
| `hover:bg-primary-light` | Keep as-is                                 |

- [ ] **Step 7: Migrate language-switcher/index.tsx**

| Old                      | New                         |
| ------------------------ | --------------------------- |
| `text-primary`           | Keep as-is                  |
| `text-neutral-500`       | `text-on-surface-secondary` |
| `hover:text-neutral-900` | `hover:text-on-surface`     |
| `text-neutral-300`       | `text-on-surface-secondary` |

- [ ] **Step 8: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/page-header/index.tsx src/components/tour-card/index.tsx src/components/destination-card/index.tsx src/components/gallery-item/index.tsx src/components/video-modal/index.tsx src/components/scroll-to-top/index.tsx src/components/language-switcher/index.tsx
git commit -m "feat(theme): migrate shared components to semantic color tokens"
```

---

## Task 7: Migrate Page Files

**Files:**

- Modify: `src/pages/index.tsx`
- Modify: `src/pages/about-us.tsx`
- Modify: `src/pages/contact.tsx`
- Modify: `src/pages/rental.tsx`

- [ ] **Step 1: Migrate index.tsx (home page)**

| Old                                        | New                                    |
| ------------------------------------------ | -------------------------------------- |
| `text-white` (on hero overlay)             | Keep as-is (always on dark hero image) |
| `bg-neutral-100`                           | `bg-surface-alt`                       |
| `bg-white`                                 | `bg-surface-elevated`                  |
| `text-neutral-500`                         | `text-on-surface-secondary`            |
| `text-neutral-900`                         | `text-on-surface`                      |
| `text-neutral-700`                         | `text-on-surface`                      |
| `bg-primary/10`                            | Keep as-is (primary tint)              |
| `bg-primary`                               | Keep as-is                             |
| `hover:bg-primary-light`                   | Keep as-is                             |
| `text-white` (on primary buttons)          | `text-on-primary`                      |
| `bg-white/15`                              | `bg-surface-elevated/15`               |
| `hover:bg-white/25`                        | `hover:bg-surface-elevated/25`         |
| `text-white` (on CTA section with overlay) | Keep as-is (on dark background image)  |

Key judgment: hero sections, CTA banners with background images always use white text on dark overlays — these stay hardcoded. Only surface/card/text colors migrate.

- [ ] **Step 2: Migrate about-us.tsx**

| Old                                | New                         |
| ---------------------------------- | --------------------------- |
| `text-neutral-500`                 | `text-on-surface-secondary` |
| `text-neutral-900`                 | `text-on-surface`           |
| `bg-neutral-200`                   | `bg-surface-alt`            |
| `text-white` (on overlay sections) | Keep as-is                  |
| `bg-white`                         | `bg-surface-elevated`       |
| `text-primary`                     | Keep as-is                  |
| `hover:bg-neutral-100`             | `hover:bg-surface-alt`      |
| `bg-primary`                       | Keep as-is                  |
| `hover:bg-primary-light`           | Keep as-is                  |
| `text-white` (on primary buttons)  | `text-on-primary`           |
| `text-white/70`                    | Keep as-is (on overlay)     |

- [ ] **Step 3: Migrate contact.tsx**

| Old                              | New                         |
| -------------------------------- | --------------------------- |
| `bg-neutral-100`                 | `bg-surface-alt`            |
| `hover:bg-primary`               | Keep as-is                  |
| `hover:text-white`               | `hover:text-on-primary`     |
| `text-neutral-500`               | `text-on-surface-secondary` |
| `focus:ring-primary`             | Keep as-is                  |
| `bg-primary`                     | Keep as-is                  |
| `hover:bg-primary-light`         | Keep as-is                  |
| `text-white` (on primary button) | `text-on-primary`           |
| `bg-white`                       | `bg-surface-elevated`       |
| `text-neutral-700`               | `text-on-surface`           |

- [ ] **Step 4: Migrate rental.tsx**

| Old                               | New                         |
| --------------------------------- | --------------------------- |
| `bg-white`                        | `bg-surface-elevated`       |
| `bg-black/10`                     | `bg-overlay/20`             |
| `bg-secondary`                    | Keep as-is                  |
| `text-white` (on secondary badge) | `text-on-primary`           |
| `bg-white/90`                     | `bg-surface-elevated/90`    |
| `text-neutral-500`                | `text-on-surface-secondary` |
| `hover:text-primary`              | Keep as-is                  |
| `hover:bg-white`                  | `hover:bg-surface-elevated` |
| `text-neutral-900`                | `text-on-surface`           |

- [ ] **Step 5: Verify build compiles**

Run: `pnpm build`
Expected: Build succeeds with zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.tsx src/pages/about-us.tsx src/pages/contact.tsx src/pages/rental.tsx
git commit -m "feat(theme): migrate all page files to semantic color tokens"
```

---

## Task 8: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build check**

Run: `pnpm build`
Expected: Clean build, no errors, no warnings related to missing color tokens.

- [ ] **Step 2: Lint check**

Run: `pnpm lint`
Expected: No new lint errors.

- [ ] **Step 3: Visual smoke test checklist**

Run `pnpm dev` and verify in browser:

1. Light mode (default): page loads with warm stone-toned light theme, amber primary accents
2. Toggle in top bar switches to dark mode with smooth crossfade
3. Dark mode: warm dark backgrounds, amber primary brightened, footer/top bar noticeably darker than main content
4. Toggle back to light: smooth crossfade, correct colors restored
5. Refresh page in dark mode: no flash, dark theme persists (cookie)
6. Open mobile menu: toggle visible near language switcher, functional
7. Switch locale: theme persists across locale change
8. Check all pages: home, about-us, contact, rental, tours
9. Check overlays: image overlays, modals, lightbox still have correct dark backdrops
10. Check cards, dropdowns, breadcrumbs use correct surface tokens

- [ ] **Step 4: Commit any fixes if needed**

If any visual issues found during smoke test, fix and commit:

```bash
git add -u
git commit -m "fix(theme): address visual issues found during smoke test"
```
