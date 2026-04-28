# Playwright E2E Testing — Main Page

## Overview

Integrate Playwright into the project for end-to-end testing of the main page (homepage). Tests run against a production build (`pnpm build && pnpm start`) to verify what actually ships. Scope is limited to the main page for now, with the structure designed to extend to other pages later.

## Decisions

- **Browser**: Chromium only (can add Firefox/WebKit later)
- **Test target**: Production build via `webServer` config
- **Test structure**: One file per concern (smoke, interactions, responsive, a11y, visual)
- **Visual regression**: Playwright built-in `toHaveScreenshot()` with committed baselines
- **i18n**: Tests run against default locale (Vietnamese); language switch test verifies English
- **Accessibility**: axe-core integration via `@axe-core/playwright`

## Dependencies

- `@playwright/test` (dev) — test runner and assertions
- `@axe-core/playwright` (dev) — accessibility auditing

## Configuration

### playwright.config.ts (project root)

- **Test directory**: `e2e/`
- **Base URL**: `http://localhost:3000`
- **Projects**: Single project — Chromium desktop
- **webServer**: Runs `pnpm build && pnpm start` on port 3000, reuses existing server if already running
- **Screenshots directory**: `e2e/__screenshots__/`
- **Retries**: 0 locally, 2 in CI (`process.env.CI`)
- **Reporter**: HTML locally, list in CI

### package.json scripts

- `"test:e2e"` — `npx playwright test`
- `"test:e2e:ui"` — `npx playwright test --ui`
- `"test:e2e:update-snapshots"` — `npx playwright test --update-snapshots`

## File Structure

```
e2e/
├── home-smoke.spec.ts
├── home-interactions.spec.ts
├── home-responsive.spec.ts
├── home-accessibility.spec.ts
├── home-visual.spec.ts
└── __screenshots__/
```

## Test Coverage

### home-smoke.spec.ts — Page loads and sections exist

- Page returns 200, `<title>` matches expected meta title
- Hero section: video element present, heading text visible
- Destinations section: section heading visible, correct number of destination cards rendered
- About section: phone number displayed, 3 bullet points visible, "Book with us now" button present
- Popular Tours section: section heading visible, carousel rendered with tour cards
- Video/CTA section: play button present, 6 feature cards rendered
- Gallery section: 5 gallery images rendered
- Layout: header and footer present on the page

### home-interactions.spec.ts — User interactions work

- **Carousel navigation**: Click next/prev buttons, verify slides change (different tour card becomes visible)
- **Video modal**: Click play button, modal opens containing an iframe; close modal, modal no longer in DOM
- **Language switch**: Switch to English (`/en`), verify key headings change to English translations (e.g., "Travel & Adventures", "Go Exotic Places"); switch back, verify Vietnamese text returns
- **Scroll-to-top**: Scroll page down past the fold, scroll-to-top button appears; click it, page scrolls back to top (hero section in viewport)

### home-responsive.spec.ts — Layout adapts to viewports

Three viewports tested:

- **Mobile** (375x812): Hamburger menu visible (no full nav), destination grid stacks to single column
- **Tablet** (768x1024): 2-column destination grid layout
- **Desktop** (1280x800): Full navigation bar visible, 4-column destination grid

Each viewport verifies that all 5 main sections (hero, destinations, about, tours, gallery) remain visible and that navigation adapts (hamburger vs full nav bar).

### home-accessibility.spec.ts — No critical a11y violations

- Run axe-core full page scan, assert zero violations at "critical" or "serious" severity
- All `<img>` elements have non-empty `alt` attributes
- Interactive elements (buttons, links) are keyboard-focusable
- Color contrast passes axe checks (covered by the full scan)

### home-visual.spec.ts — Visual regression snapshots

- Full-page screenshots at 3 viewports: mobile (375x812), tablet (768x1024), desktop (1280x800)
- Per-section screenshots: hero, destinations, about, popular tours, video/CTA, gallery
- All snapshots captured in Vietnamese locale only
- Threshold: `maxDiffPixelRatio: 0.002` (0.2%) to account for minor font rendering differences

## Video & Animation Handling

- **Hero video**: Pause via `page.evaluate` before visual snapshots to get a consistent frame
- **Framer Motion animations**: Use `{ animations: 'disabled' }` on `toHaveScreenshot()` for CSS animations. For JS-driven Framer Motion, wait for elements to reach their final visible state before asserting or capturing screenshots.
- **Interaction tests**: Rely on Playwright's built-in auto-waiting (waits for elements to be visible/actionable). No special animation handling needed.

## i18n Strategy

- All tests except the language switch test run against `/` (Vietnamese, the default locale)
- Language switch test navigates to `/en`, asserts English content, then returns to `/` and asserts Vietnamese
- Visual regression baselines are Vietnamese-only to avoid doubling snapshot maintenance

## CI Notes

No CI pipeline changes are in scope. The setup is CI-ready:

- `pnpm test:e2e` is self-contained (builds, starts server, runs tests, stops server)
- Snapshots committed to repo allow CI comparison
- Config uses `process.env.CI` to toggle retries (0 → 2) and reporter (html → list)

## Out of Scope

- Other pages (tours, rental, about, contact) — future work
- Firefox and WebKit browsers — add later by extending Playwright projects
- CI workflow changes — manual addition when ready
- Page Object Model — adopt when testing expands beyond a single page
