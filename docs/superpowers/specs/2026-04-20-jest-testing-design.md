# Jest Testing Infrastructure Design

## Overview

Add comprehensive testing capabilities to the Vietnam Moto Tour project using Jest and React Testing Library. The setup covers unit, component, and integration testing with explicit assertions (no snapshots), mocked i18n (translation keys as output), and CI integration.

## Stack

| Package                       | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `jest`                        | Test runner                                                    |
| `ts-jest`                     | TypeScript transform for Jest                                  |
| `jest-environment-jsdom`      | Browser-like DOM environment                                   |
| `@testing-library/react`      | Component rendering utilities                                  |
| `@testing-library/jest-dom`   | Custom DOM matchers (`toBeInTheDocument`, `toHaveClass`, etc.) |
| `@testing-library/user-event` | Realistic user interaction simulation                          |
| `@types/jest`                 | TypeScript types for Jest globals                              |

## Configuration

### `jest.config.ts`

- **Transform:** `ts-jest` for `.ts`/`.tsx` files
- **Environment:** `jsdom`
- **Module name mapper:** `@/*` -> `<rootDir>/src/*` (mirrors `tsconfig.json` paths)
- **Setup files:** `jest.setup.ts` (imports `@testing-library/jest-dom`)
- **Test match:** `**/*.spec.{ts,tsx}` (co-located) + `__tests__/**/*.spec.{ts,tsx}` (integration)

### `jest.setup.ts`

Imports `@testing-library/jest-dom` to make custom matchers available globally.

### `package.json` scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### `lint-staged` addition

```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "jest --bail --findRelatedTests"
  ]
}
```

Runs only tests related to staged files on each commit.

## Mock Infrastructure

### Global mocks (`src/__mocks__/`)

Auto-resolved by Jest's module resolution.

#### `next-intl.ts`

- `useTranslations` returns a function that echoes the key: `t('heroTitle')` returns `"heroTitle"`
- `useLocale` returns `"vi"`
- `NextIntlClientProvider` renders children as-is

#### `next/router.ts`

- `useRouter` returns a controllable object with `pathname: "/"`, `locale: "vi"`, `push: jest.fn()`, `replace: jest.fn()`, etc.
- Tests can override specific values via `jest.mocked(useRouter).mockReturnValue({...})`

#### `next/link.tsx`

- Renders as a plain `<a>` tag with `href` prop so tests can assert link targets

#### `next/head.tsx`

- Renders children into the document so `<title>` and `<meta>` assertions work

### Component-level mocks

#### `framer-motion.tsx` (`src/__mocks__/`)

- `motion` is a proxy that returns plain HTML elements (`motion.div` -> `div`)
- `AnimatePresence` is a passthrough wrapper

#### Swiper (per-test or local mock)

- `Swiper` and `SwiperSlide` mocked as plain `div` containers so carousel content is testable without Swiper internals

## Test Utilities (`src/test-utils/`)

### `render.tsx`

Custom `render` function wrapping components in required providers:

- `NextIntlClientProvider` (with mocked messages)
- `ThemeProvider`

Re-exports everything from `@testing-library/react` so tests import from `@/test-utils` instead of RTL directly. Single import point.

### `factories.ts`

Factory functions for test data with sensible defaults, overridable per-field:

- `buildTour(overrides?)` -> `Tour`
- `buildDestination(overrides?)` -> `Destination`
- `buildContactInfo(overrides?)` -> `ContactInfo`

## Test Organization

```
src/
  __mocks__/
    next-intl.ts
    next/
      router.ts
      link.tsx
      head.tsx
    framer-motion.tsx
  test-utils/
    render.tsx
    factories.ts
  components/
    tour-card/
      index.spec.tsx          # co-located
    destination-card/
      index.spec.tsx
    header/
      index.spec.tsx
    footer/
      index.spec.tsx
    video-modal/
      index.spec.tsx
    scroll-to-top/
      index.spec.tsx
    language-switcher/
      index.spec.tsx
    theme-toggle/
      index.spec.tsx
    gallery-item/
      index.spec.tsx
    page-header/
      index.spec.tsx
    tour-carousel/
      index.spec.tsx
  hooks/
    useScrollDirection.spec.ts   # pure logic
  utils/
    index.spec.ts                # getUrl, contactInfo shape
__tests__/
  pages/
    home.spec.tsx                # integration: full page
    tours.spec.tsx
    about-us.spec.tsx
    contact.spec.tsx
  integration/
    layout.spec.tsx              # Header + Footer + children
```

**Co-located** tests: component-level, next to source. Cover rendering, props, translation keys, interactions, conditional rendering, CSS classes.

**Top-level `__tests__/`**: integration/page-level. Full page renders, data flow to child components, `getStaticProps` output, layout composition.

## Test Coverage Plan

All tests use explicit assertions. No snapshot testing.

### Unit tests

| Target               | Assertions                                                                      |
| -------------------- | ------------------------------------------------------------------------------- |
| `getUrl()`           | Returns correct path with and without base path                                 |
| `contactInfo`        | Shape matches `ContactInfo` type, all fields present                            |
| `useScrollDirection` | Returns correct direction/position as scroll events fire                        |
| `data/index.ts`      | `toursData` and `destinationsData` arrays non-empty, items match expected shape |

### Component tests

| Component            | Assertions                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TourCard**         | Renders title, price, duration, distance, location. Correct link href. Icons present (`fa-clock`, `fa-road`, `fa-map-marker-alt`). Translation key `perPerson` used.                                            |
| **DestinationCard**  | Renders name, tour count, image with correct `src`/`alt`.                                                                                                                                                       |
| **Header**           | All nav links with correct hrefs. Active link gets `text-primary` class. Mobile menu toggles on click. Logo switches on theme. Social links use `contactInfo` URLs. Language switcher and theme toggle present. |
| **Footer**           | Contact info rendered (phone, email, address). Social links present. Copyright with translation key.                                                                                                            |
| **VideoModal**       | Not in DOM when `isOpen=false`. Renders iframe when `isOpen=true`. Calls `onClose` on close click.                                                                                                              |
| **ScrollToTop**      | Hidden at top. Visible after scroll. Scrolls to top on click.                                                                                                                                                   |
| **LanguageSwitcher** | Renders current locale. Switches locale on interaction.                                                                                                                                                         |
| **ThemeToggle**      | Toggles between light/dark. Correct icon per state.                                                                                                                                                             |
| **GalleryItem**      | Renders image with correct `src`.                                                                                                                                                                               |
| **PageHeader**       | Renders title, breadcrumbs with correct labels/hrefs, background image.                                                                                                                                         |
| **TourCarousel**     | All tour cards render within mocked Swiper container.                                                                                                                                                           |

### Integration tests

| Test file             | Assertions                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **home.spec.tsx**     | All sections render (hero, destinations, about, tours, video CTA, gallery). Correct translation keys per section. Child components receive correct data. |
| **tours.spec.tsx**    | Tour cards rendered from `toursData`. Page header with correct key.                                                                                      |
| **about-us.spec.tsx** | Page sections render with expected translation keys.                                                                                                     |
| **contact.spec.tsx**  | Contact info displayed.                                                                                                                                  |
| **layout.spec.tsx**   | Header and Footer both render. Children passed through to `<main>`.                                                                                      |
| **getStaticProps**    | Each page's `getStaticProps` returns `{ props: { messages } }` with correct locale file.                                                                 |

## CI Integration

Add a `test` job to `.github/workflows/deploy.yml`:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version-file: '.node-version'
    - uses: pnpm/action-setup@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm test --ci --coverage
```

- Deploy job gets `needs: [test]` — blocked if tests fail
- `--ci` disables watch mode
- `--coverage` generates coverage report in CI output
- No coverage thresholds initially — add later once baseline is established
- Triggers match existing workflow (pushes to `main`, PRs)
