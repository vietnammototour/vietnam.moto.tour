import {test, expect} from '@playwright/test';

test.describe('Home page — smoke tests', () => {
  test('page loads with correct title', async ({page}) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Vietnam/i);
  });

  test('hero section is visible with video and heading', async ({page}) => {
    await page.goto('/');
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    const video = hero.locator('video');
    await expect(video).toBeAttached();

    const heading = hero.locator('h2');
    await expect(heading).toContainText('Du Lịch & Phiêu Lưu');
  });

  test('destinations section shows heading and 5 cards', async ({page}) => {
    await page.goto('/');
    const heading = page.getByText('Khám Phá Những Điểm Đến Kỳ Thú');
    await expect(heading).toBeVisible();

    const destinationCards = page.locator('[data-testid="destination-card"]');
    await expect(destinationCards).toHaveCount(5);
  });

  test('about section shows phone number and bullet points', async ({page}) => {
    await page.goto('/');
    const aboutHeading = page.getByText(
      'Lên Kế Hoạch Chuyến Đi Cùng Chúng Tôi',
    );
    await expect(aboutHeading).toBeVisible();

    const phone = page.locator('main').getByText('+84-935-797-550');
    await expect(phone).toBeVisible();

    const bullets = page.locator('ul li').filter({
      has: page.locator('i.fa-check'),
    });
    await expect(bullets).toHaveCount(3);

    const bookButton = page.getByRole('link', {
      name: 'Đặt tour ngay',
      exact: true,
    });
    await expect(bookButton).toBeVisible();
  });

  test('popular tours section shows heading and carousel', async ({page}) => {
    await page.goto('/');
    const heading = page.getByText('Tour Phổ Biến Nhất');
    await expect(heading).toBeVisible();

    const carousel = page.locator('.swiper');
    await expect(carousel).toBeVisible();
  });

  test('video/CTA section shows play button and 6 feature cards', async ({
    page,
  }) => {
    await page.goto('/');
    const playButton = page.getByLabel('Play video');
    await expect(playButton).toBeVisible();

    const featureCards = page.locator('[data-testid="feature-card"]');
    await expect(featureCards).toHaveCount(6);
  });

  test('gallery section shows 5 images', async ({page}) => {
    await page.goto('/');
    const galleryItems = page.locator('[data-testid="gallery-item"]');
    await expect(galleryItems).toHaveCount(5);
  });

  test('header and footer are present', async ({page}) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
