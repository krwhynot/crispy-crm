import { test, expect } from '@playwright/test';

test.describe('Spacing Tokens Validation', () => {
  // Tests use storage state for authentication (see playwright.config.ts)
  // No manual login needed

  test('edge padding matches spec on desktop (120px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/reports/opportunities-by-principal');

    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible' });

    const container = page.locator('main').first();
    const paddingLeft = await container.evaluate(el =>
      parseInt(getComputedStyle(el).paddingLeft)
    );

    expect(paddingLeft).toBe(120); // --spacing-edge-desktop
  });

  test('edge padding matches spec on iPad landscape (60px)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/reports/opportunities-by-principal');

    await page.waitForSelector('main', { state: 'visible' });

    const container = page.locator('main').first();
    const paddingLeft = await container.evaluate(el =>
      parseInt(getComputedStyle(el).paddingLeft)
    );

    expect(paddingLeft).toBe(60); // --spacing-edge-ipad
  });

  test('edge padding matches spec on mobile (16px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reports/opportunities-by-principal');

    await page.waitForSelector('main', { state: 'visible' });

    const container = page.locator('main').first();
    const paddingLeft = await container.evaluate(el =>
      parseInt(getComputedStyle(el).paddingLeft)
    );

    expect(paddingLeft).toBe(16); // --spacing-edge-mobile
  });

  test('section spacing is consistent (32px)', async ({ page }) => {
    await page.goto('/reports/opportunities-by-principal');

    await page.waitForSelector('[class*="space-y"]', { state: 'visible' });

    const container = page.locator('[class*="space-y"]').first();
    const gap = await container.evaluate(el => {
      const children = Array.from(el.children);
      if (children.length < 2) return 0;
      const firstRect = children[0].getBoundingClientRect();
      const secondRect = children[1].getBoundingClientRect();
      return secondRect.top - firstRect.bottom;
    });

    expect(gap).toBe(32); // --spacing-section
  });
});
