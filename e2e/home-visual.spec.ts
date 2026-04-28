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

  // Wait for images to load — use a generous timeout to handle slow network idle
  await page.waitForLoadState('networkidle', {timeout: 60_000}).catch(() => {
    // If networkidle times out, fall back to domcontentloaded which is already done
  });

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
        test.setTimeout(90_000);
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
