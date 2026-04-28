# Playwright E2E Testing — Main Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Playwright into the project and write comprehensive e2e tests for the main page covering smoke, interactions, responsive layout, accessibility, and visual regression.

**Architecture:** Playwright runs against a production build (`pnpm build && pnpm start`). Tests live in `e2e/` at the project root, one file per concern. Chromium only. Visual regression baselines committed to the repo.

**Tech Stack:** `@playwright/test`, `@axe-core/playwright`, Chromium browser

---

## File Map

- **Create:** `playwright.config.ts` — Playwright configuration
- **Create:** `e2e/home-smoke.spec.ts` — Smoke tests
- **Create:** `e2e/home-interactions.spec.ts` — Interaction tests
- **Create:** `e2e/home-responsive.spec.ts` — Responsive layout tests
- **Create:** `e2e/home-accessibility.spec.ts` — Accessibility tests
- **Create:** `e2e/home-visual.spec.ts` — Visual regression tests
- **Modify:** `package.json` — Add e2e scripts
- **Modify:** `.gitignore` — Add Playwright artifacts

---

### Task 1: Install Playwright and axe-core

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add -D @playwright/test @axe-core/playwright
```

- [ ] **Step 2: Install Chromium browser**

```bash
npx playwright install chromium
```

- [ ] **Step 3: Verify installation**

```bash
npx playwright --version
```

Expected: Version number printed (e.g., `1.52.0`)

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install Playwright and axe-core for e2e testing"
```

---

### Task 2: Configure Playwright and update project files

**Files:**

- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.ts` at the project root:

```ts
import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],

  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Add e2e scripts to package.json**

Add these three scripts to the `"scripts"` object in `package.json`:

```json
"test:e2e": "npx playwright test",
"test:e2e:ui": "npx playwright test --ui",
"test:e2e:update-snapshots": "npx playwright test --update-snapshots"
```

- [ ] **Step 3: Update .gitignore**

Append these lines to `.gitignore`:

```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 4: Create the e2e directory**

```bash
mkdir -p e2e
```

- [ ] **Step 5: Verify config loads**

```bash
npx playwright test --list
```

Expected: `no tests found` (no test files yet — confirms config is valid)

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts package.json .gitignore e2e/
git commit -m "chore: configure Playwright with production build webServer"
```

---

### Task 3: Write smoke tests

**Files:**

- Create: `e2e/home-smoke.spec.ts`

These tests verify the page loads and all major sections are present with correct content. The page is in Vietnamese (default locale at `/`).

**Key data for assertions:**

- 5 destinations in the grid
- 7 tours in the carousel
- 5 gallery images
- Phone number: `+84-935-797-550`
- Vietnamese heading texts from `src/messages/vi.json` under the `home` key

- [ ] **Step 1: Write all smoke tests**

Create `e2e/home-smoke.spec.ts`:

```ts
import {test, expect} from '@playwright/test';

test.describe('Home page — smoke tests', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
  });

  test('page loads with correct title', async ({page}) => {
    await expect(page).toHaveTitle(/Vietnam/i);
  });

  test('hero section is visible with video and heading', async ({page}) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    const video = hero.locator('video');
    await expect(video).toBeAttached();

    const heading = hero.locator('h2');
    await expect(heading).toContainText('Du Lịch & Phiêu Lưu');
  });

  test('destinations section shows heading and 5 cards', async ({page}) => {
    const heading = page.getByText('Khám Phá Những Điểm Đến Kỳ Thú');
    await expect(heading).toBeVisible();

    const destinationCards = page.locator('[data-testid="destination-card"]');
    await expect(destinationCards).toHaveCount(5);
  });

  test('about section shows phone number and bullet points', async ({page}) => {
    const aboutHeading = page.getByText(
      'Lên Kế Hoạch Chuyến Đi Cùng Chúng Tôi',
    );
    await expect(aboutHeading).toBeVisible();

    const phone = page.getByText('+84-935-797-550');
    await expect(phone).toBeVisible();

    const bullets = page.locator('ul li').filter({
      has: page.locator('i.fa-check'),
    });
    await expect(bullets).toHaveCount(3);

    const bookButton = page.getByText('Đặt tour ngay');
    await expect(bookButton).toBeVisible();
  });

  test('popular tours section shows heading and carousel', async ({page}) => {
    const heading = page.getByText('Tour Phổ Biến Nhất');
    await expect(heading).toBeVisible();

    const carousel = page.locator('.swiper');
    await expect(carousel).toBeVisible();
  });

  test('video/CTA section shows play button and 6 feature cards', async ({
    page,
  }) => {
    const playButton = page.getByLabel('Play video');
    await expect(playButton).toBeVisible();

    const featureCards = page
      .locator('section')
      .filter({
        has: page.getByLabel('Play video'),
      })
      .locator('.rounded-lg.text-center');
    await expect(featureCards).toHaveCount(6);
  });

  test('gallery section shows 5 images', async ({page}) => {
    const gallerySection = page.locator('section').last();
    const images = gallerySection.locator('img');
    await expect(images).toHaveCount(5);
  });

  test('header and footer are present', async ({page}) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
```

- [ ] **Step 2: Run smoke tests**

```bash
npx playwright test e2e/home-smoke.spec.ts
```

Expected: All tests pass. If any fail due to selector mismatches, adjust selectors based on the actual rendered DOM. Common issues:

- If `destination-card` testid doesn't exist, you need to add `data-testid="destination-card"` to `src/components/destination-card/index.tsx` (see Step 3).
- If gallery section isn't the last `<section>`, refine the selector.

- [ ] **Step 3: Add data-testid attributes where needed**

If tests fail because selectors can't find elements, add `data-testid` attributes to these components:

In `src/components/destination-card/index.tsx`, add `data-testid="destination-card"` to the outermost element of the component.

In `src/components/gallery-item/index.tsx`, add `data-testid="gallery-item"` to the outermost element.

Then update the smoke test selectors:

- Destination cards: `page.locator('[data-testid="destination-card"]')`
- Gallery items: `page.locator('[data-testid="gallery-item"]')`

- [ ] **Step 4: Re-run smoke tests after any fixes**

```bash
npx playwright test e2e/home-smoke.spec.ts
```

Expected: All 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add e2e/home-smoke.spec.ts src/components/destination-card/index.tsx src/components/gallery-item/index.tsx
git commit -m "test: add e2e smoke tests for home page sections"
```

---

### Task 4: Write interaction tests

**Files:**

- Create: `e2e/home-interactions.spec.ts`

These tests verify carousel navigation, video modal, language switching, and scroll-to-top.

**Key implementation details:**

- Swiper carousel uses `.swiper-button-next` and `.swiper-button-prev` for navigation
- VideoModal renders `null` when closed, shows `<iframe>` when open
- LanguageSwitcher has buttons with text "VI" and "EN", navigates to `/en` or `/`
- ScrollToTop button appears when `scrollY > 400`, has `aria-label="Scroll to top"`

- [ ] **Step 1: Write all interaction tests**

Create `e2e/home-interactions.spec.ts`:

```ts
import {test, expect} from '@playwright/test';

test.describe('Home page — interactions', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
  });

  test('carousel navigation changes visible slides', async ({page}) => {
    const carousel = page.locator('.swiper');
    await expect(carousel).toBeVisible();

    // Get the first visible slide text
    const firstSlide = carousel.locator('.swiper-slide-active');
    const firstSlideText = await firstSlide.textContent();

    // Click next
    const nextButton = carousel.locator('.swiper-button-next');
    await nextButton.click();

    // Wait for transition
    await page.waitForTimeout(500);

    // Active slide should have changed
    const newActiveSlide = carousel.locator('.swiper-slide-active');
    const newSlideText = await newActiveSlide.textContent();
    expect(newSlideText).not.toBe(firstSlideText);

    // Click prev to go back
    const prevButton = carousel.locator('.swiper-button-prev');
    await prevButton.click();
    await page.waitForTimeout(500);

    const backSlide = carousel.locator('.swiper-slide-active');
    const backSlideText = await backSlide.textContent();
    expect(backSlideText).toBe(firstSlideText);
  });

  test('video modal opens and closes', async ({page}) => {
    const playButton = page.getByLabel('Play video');
    await playButton.click();

    // Modal should be visible with an iframe
    const modal = page.locator('iframe[title="Video"]');
    await expect(modal).toBeVisible();

    // Close the modal
    const closeButton = page.getByLabel('Close video');
    await closeButton.click();

    // Modal should be gone
    await expect(modal).not.toBeVisible();
  });

  test('language switch toggles between Vietnamese and English', async ({
    page,
  }) => {
    // Verify Vietnamese content
    await expect(page.getByText('Du Lịch & Phiêu Lưu')).toBeVisible();

    // Switch to English
    const enButton = page.getByRole('button', {name: 'EN'});
    await enButton.click();

    // Wait for navigation to /en
    await page.waitForURL('**/en');

    // Verify English content
    await expect(page.getByText('Travel & Adventures')).toBeVisible();
    await expect(page.getByText('Go Exotic Places')).toBeVisible();

    // Switch back to Vietnamese
    const viButton = page.getByRole('button', {name: 'VI'});
    await viButton.click();

    // Wait for navigation back to /
    await page.waitForURL(/\/$/);

    // Verify Vietnamese content is back
    await expect(page.getByText('Du Lịch & Phiêu Lưu')).toBeVisible();
  });

  test('scroll-to-top button appears and works', async ({page}) => {
    const scrollButton = page.getByLabel('Scroll to top');

    // Should not be interactive initially (opacity-0, pointer-events-none)
    await expect(scrollButton).not.toBeVisible();

    // Scroll down past 400px
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    // Button should now be visible
    await expect(scrollButton).toBeVisible();

    // Click it
    await scrollButton.click();
    await page.waitForTimeout(500);

    // Page should be scrolled to top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);
  });
});
```

- [ ] **Step 2: Run interaction tests**

```bash
npx playwright test e2e/home-interactions.spec.ts
```

Expected: All 4 tests pass. The language switch test may take a moment due to page navigation.

- [ ] **Step 3: Debug any failures**

Common issues:

- Carousel: If Swiper autoplay interferes, disable it in the test by injecting a script before interaction: `await page.evaluate(() => document.querySelector('.swiper')?.swiper?.autoplay?.stop())`
- Language switch: The EN button may only be visible on desktop viewport (it's in the header nav hidden on mobile). The default Playwright viewport is 1280x720 which should be fine.
- Scroll-to-top: The `waitForTimeout` values may need adjustment if the smooth scroll is slow.

- [ ] **Step 4: Commit**

```bash
git add e2e/home-interactions.spec.ts
git commit -m "test: add e2e interaction tests for carousel, video modal, language switch, scroll-to-top"
```

---

### Task 5: Write responsive layout tests

**Files:**

- Create: `e2e/home-responsive.spec.ts`

These tests verify that the layout adapts correctly at three viewport sizes. Key breakpoints from the codebase:

- Header: `lg:hidden` for hamburger (< 1024px), `lg:flex` for full nav (>= 1024px)
- Destination grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

- [ ] **Step 1: Write all responsive tests**

Create `e2e/home-responsive.spec.ts`:

```ts
import {test, expect} from '@playwright/test';

const viewports = {
  mobile: {width: 375, height: 812},
  tablet: {width: 768, height: 1024},
  desktop: {width: 1280, height: 800},
} as const;

test.describe('Home page — responsive layout', () => {
  test.describe('mobile (375x812)', () => {
    test.use({viewport: viewports.mobile});

    test('hamburger menu is visible, full nav is hidden', async ({page}) => {
      await page.goto('/');

      // Hamburger button should be visible
      const hamburger = page.getByLabel('Open menu');
      await expect(hamburger).toBeVisible();

      // Desktop nav should be hidden
      const desktopNav = page.locator('header nav');
      await expect(desktopNav).not.toBeVisible();
    });

    test('all main sections are visible', async ({page}) => {
      await page.goto('/');

      // Hero
      await expect(page.getByText('Du Lịch & Phiêu Lưu')).toBeVisible();
      // Destinations
      await expect(
        page.getByText('Khám Phá Những Điểm Đến Kỳ Thú'),
      ).toBeVisible();
      // About
      await expect(
        page.getByText('Lên Kế Hoạch Chuyến Đi Cùng Chúng Tôi'),
      ).toBeVisible();
      // Tours
      await expect(page.getByText('Tour Phổ Biến Nhất')).toBeVisible();
      // Gallery (check for gallery items)
      const galleryItems = page.locator('[data-testid="gallery-item"]');
      await expect(galleryItems.first()).toBeVisible();
    });
  });

  test.describe('tablet (768x1024)', () => {
    test.use({viewport: viewports.tablet});

    test('hamburger menu is visible on tablet', async ({page}) => {
      await page.goto('/');

      const hamburger = page.getByLabel('Open menu');
      await expect(hamburger).toBeVisible();
    });

    test('all main sections are visible', async ({page}) => {
      await page.goto('/');

      await expect(page.getByText('Du Lịch & Phiêu Lưu')).toBeVisible();
      await expect(
        page.getByText('Khám Phá Những Điểm Đến Kỳ Thú'),
      ).toBeVisible();
      await expect(
        page.getByText('Lên Kế Hoạch Chuyến Đi Cùng Chúng Tôi'),
      ).toBeVisible();
      await expect(page.getByText('Tour Phổ Biến Nhất')).toBeVisible();
    });
  });

  test.describe('desktop (1280x800)', () => {
    test.use({viewport: viewports.desktop});

    test('full navigation bar is visible, no hamburger', async ({page}) => {
      await page.goto('/');

      // Full nav should be visible
      const desktopNav = page.locator('header nav');
      await expect(desktopNav).toBeVisible();

      // Hamburger should not be visible
      const hamburger = page.getByLabel('Open menu');
      await expect(hamburger).not.toBeVisible();
    });

    test('all main sections are visible', async ({page}) => {
      await page.goto('/');

      await expect(page.getByText('Du Lịch & Phiêu Lưu')).toBeVisible();
      await expect(
        page.getByText('Khám Phá Những Điểm Đến Kỳ Thú'),
      ).toBeVisible();
      await expect(
        page.getByText('Lên Kế Hoạch Chuyến Đi Cùng Chúng Tôi'),
      ).toBeVisible();
      await expect(page.getByText('Tour Phổ Biến Nhất')).toBeVisible();
    });
  });
});
```

- [ ] **Step 2: Run responsive tests**

```bash
npx playwright test e2e/home-responsive.spec.ts
```

Expected: All 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/home-responsive.spec.ts
git commit -m "test: add e2e responsive layout tests for mobile, tablet, desktop"
```

---

### Task 6: Write accessibility tests

**Files:**

- Create: `e2e/home-accessibility.spec.ts`

Uses `@axe-core/playwright` to scan the page for WCAG violations and manually checks image alt text and keyboard focusability.

- [ ] **Step 1: Write all accessibility tests**

Create `e2e/home-accessibility.spec.ts`:

```ts
import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Home page — accessibility', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
    // Wait for page to fully load and animations to settle
    await page.waitForLoadState('networkidle');
  });

  test('no critical or serious axe violations', async ({page}) => {
    const results = await new AxeBuilder({page})
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalAndSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    // Log violations for debugging
    if (criticalAndSerious.length > 0) {
      console.log(
        'Accessibility violations:',
        JSON.stringify(
          criticalAndSerious.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
          null,
          2,
        ),
      );
    }

    expect(criticalAndSerious).toHaveLength(0);
  });

  test('all images have alt attributes', async ({page}) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} is missing alt attribute`).toBeTruthy();
    }
  });

  test('interactive elements are keyboard focusable', async ({page}) => {
    // Check that key interactive elements can receive focus
    const interactiveElements = [
      {selector: 'a[href]', description: 'links'},
      {selector: 'button', description: 'buttons'},
    ];

    for (const {selector, description} of interactiveElements) {
      const elements = page.locator(`${selector}:visible`);
      const count = await elements.count();
      expect(count, `No visible ${description} found`).toBeGreaterThan(0);

      // Check that at least the first visible element is focusable
      const firstElement = elements.first();
      await firstElement.focus();
      const isFocused = await firstElement.evaluate(
        (el) => document.activeElement === el,
      );
      expect(isFocused, `First visible ${description} is not focusable`).toBe(
        true,
      );
    }
  });
});
```

- [ ] **Step 2: Run accessibility tests**

```bash
npx playwright test e2e/home-accessibility.spec.ts
```

Expected: All 3 tests pass. If axe reports violations, log them and fix the underlying component issues (e.g., missing labels, contrast issues). Do NOT change the tests to ignore real violations — fix the source components instead.

- [ ] **Step 3: Commit**

```bash
git add e2e/home-accessibility.spec.ts
git commit -m "test: add e2e accessibility tests with axe-core"
```

---

### Task 7: Write visual regression tests

**Files:**

- Create: `e2e/home-visual.spec.ts`

Uses Playwright's `toHaveScreenshot()` for visual regression. First run creates baselines in `e2e/home-visual.spec.ts-snapshots/`. The hero video must be paused for consistent screenshots.

- [ ] **Step 1: Write all visual regression tests**

Create `e2e/home-visual.spec.ts`:

```ts
import {test, expect} from '@playwright/test';

const viewports = {
  mobile: {width: 375, height: 812},
  tablet: {width: 768, height: 1024},
  desktop: {width: 1280, height: 800},
} as const;

async function preparePageForScreenshot(page: import('@playwright/test').Page) {
  // Pause the hero video for consistent screenshots
  await page.evaluate(() => {
    const video = document.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });

  // Wait for images to load
  await page.waitForLoadState('networkidle');

  // Wait for Framer Motion animations to settle
  await page.waitForTimeout(1500);
}

const screenshotOptions = {
  maxDiffPixelRatio: 0.002,
  animations: 'disabled' as const,
};

test.describe('Home page — visual regression', () => {
  for (const [viewportName, viewport] of Object.entries(viewports)) {
    test.describe(`${viewportName} (${viewport.width}x${viewport.height})`, () => {
      test.use({viewport});

      test(`full page screenshot`, async ({page}) => {
        await page.goto('/');
        await preparePageForScreenshot(page);

        await expect(page).toHaveScreenshot(`home-full-${viewportName}.png`, {
          fullPage: true,
          ...screenshotOptions,
        });
      });
    });
  }

  // Per-section screenshots at desktop viewport
  test.describe('section screenshots (desktop)', () => {
    test.use({viewport: viewports.desktop});

    test.beforeEach(async ({page}) => {
      await page.goto('/');
      await preparePageForScreenshot(page);
    });

    test('hero section', async ({page}) => {
      const hero = page.locator('section').first();
      await expect(hero).toHaveScreenshot(
        'section-hero.png',
        screenshotOptions,
      );
    });

    test('destinations section', async ({page}) => {
      const section = page
        .locator('section')
        .filter({has: page.getByText('Khám Phá Những Điểm Đến Kỳ Thú')});
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveScreenshot(
        'section-destinations.png',
        screenshotOptions,
      );
    });

    test('about section', async ({page}) => {
      const section = page
        .locator('section')
        .filter({has: page.getByText('Lên Kế Hoạch Chuyến Đi Cùng Chúng Tôi')});
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveScreenshot(
        'section-about.png',
        screenshotOptions,
      );
    });

    test('popular tours section', async ({page}) => {
      const section = page
        .locator('section')
        .filter({has: page.getByText('Tour Phổ Biến Nhất')});
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveScreenshot(
        'section-tours.png',
        screenshotOptions,
      );
    });

    test('video/CTA section', async ({page}) => {
      const section = page
        .locator('section')
        .filter({has: page.getByLabel('Play video')});
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveScreenshot(
        'section-cta.png',
        screenshotOptions,
      );
    });

    test('gallery section', async ({page}) => {
      const section = page
        .locator('section')
        .filter({has: page.locator('[data-testid="gallery-item"]')});
      await section.scrollIntoViewIfNeeded();
      await expect(section).toHaveScreenshot(
        'section-gallery.png',
        screenshotOptions,
      );
    });
  });
});
```

- [ ] **Step 2: Generate baseline snapshots**

```bash
npx playwright test e2e/home-visual.spec.ts --update-snapshots
```

Expected: All tests pass and snapshot files are created in `e2e/home-visual.spec.ts-snapshots/`. There should be 9 snapshot files: 3 full-page (one per viewport) + 6 per-section (desktop only).

- [ ] **Step 3: Verify snapshots pass without changes**

```bash
npx playwright test e2e/home-visual.spec.ts
```

Expected: All 9 tests pass (comparing against the just-created baselines).

- [ ] **Step 4: Commit snapshots and test file**

```bash
git add e2e/home-visual.spec.ts e2e/home-visual.spec.ts-snapshots/
git commit -m "test: add e2e visual regression tests with baseline snapshots"
```

---

### Task 8: Run full test suite and fix issues

**Files:**

- Potentially any of the above test files or source components

- [ ] **Step 1: Run the entire e2e suite**

```bash
npx playwright test
```

Expected: All tests across all 5 spec files pass.

- [ ] **Step 2: Fix any failures**

If tests fail:

- Read the error message carefully
- Use `npx playwright test --ui` to debug interactively
- Check the HTML report at `playwright-report/index.html` for screenshots and traces
- Fix the tests or source components as needed
- Do NOT weaken assertions to make tests pass — fix root causes

- [ ] **Step 3: Run final verification**

```bash
npx playwright test
```

Expected: All tests pass cleanly.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "test: fix e2e test issues from full suite run"
```

(Skip this step if no fixes were needed.)
