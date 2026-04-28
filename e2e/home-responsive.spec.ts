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

      const hamburger = page.getByLabel('Open menu');
      await expect(hamburger).toBeVisible();

      const desktopNav = page.locator('header nav');
      await expect(desktopNav).not.toBeVisible();
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

      const desktopNav = page.locator('header nav');
      await expect(desktopNav).toBeVisible();

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
