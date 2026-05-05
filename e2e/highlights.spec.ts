import {test, expect} from '@playwright/test';

test.describe('Tour Highlights', () => {
  test('customer page shows highlights for tour with assigned highlights', async ({
    page,
  }) => {
    await page.goto('/en/tours/dalat-car-excursion');
    await page.waitForLoadState('networkidle');

    // Check highlights section exists
    const highlightsSection = page.locator('text=highlights').first();
    await expect(highlightsSection).toBeVisible({timeout: 10000});

    // Check that at least one highlight text is rendered
    const highlightChips = page.locator(
      'span:has-text("Stairway to the Heaven"), span:has-text("Dalat Old Railway Station")',
    );
    const count = await highlightChips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('tour page renders multiple highlight chips', async ({page}) => {
    await page.goto('/en/tours/dalat-car-excursion');
    await page.waitForLoadState('networkidle');

    // Verify specific known highlights are rendered
    await expect(page.locator('text=Stairway to the Heaven')).toBeVisible();
    await expect(page.locator('text=Dalat Old Railway Station')).toBeVisible();
  });
});
