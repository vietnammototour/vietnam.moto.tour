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

    // Switch to English — scope to header to avoid ambiguity with other buttons
    const header = page.locator('header');
    const enButton = header.getByRole('button', {name: 'EN', exact: true});
    await enButton.click();

    // Wait for navigation to /en
    await page.waitForURL('**/en');

    // Verify English content
    await expect(page.getByText('Travel & Adventures')).toBeVisible();
    await expect(page.getByText('Go Exotic Places')).toBeVisible();

    // Switch back to Vietnamese — scope to header to avoid ambiguity
    const viButton = header.getByRole('button', {name: 'VI', exact: true});
    await viButton.click();

    // Wait for navigation back to /
    await page.waitForURL(/\/$/);

    // Verify Vietnamese content is back
    await expect(page.getByText('Du Lịch & Phiêu Lưu')).toBeVisible();
  });

  test('scroll-to-top button appears and works', async ({page}) => {
    const scrollButton = page.getByLabel('Scroll to top');

    // Button is present in the DOM but not yet interactive
    await expect(scrollButton).toBeAttached();

    // Scroll down past 400px threshold
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    // Button should now be clickable (visible and interactive)
    await expect(scrollButton).toBeEnabled();
    await scrollButton.click();
    await page.waitForTimeout(500);

    // Page should be scrolled to top — hero section should be in viewport
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);

    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeInViewport();
  });
});
