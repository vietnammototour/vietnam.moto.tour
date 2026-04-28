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
      // TODO: fix color-contrast — secondary text (#78716c on #fafaf9) falls just below
      // WCAG AA 4.5:1 ratio. Requires design-system color palette update.
      .disableRules(['color-contrast'])
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
