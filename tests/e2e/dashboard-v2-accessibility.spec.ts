import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard V2 - Accessibility', () => {
  test('opportunities tree should have no accessibility violations', async ({ page }) => {
    // Navigate to dashboard V2
    await page.goto('/?layout=v2');

    // Select principal (Wicks exists in seed.sql)
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="Wicks"');

    // Wait for data to load with proper condition
    await page.waitForSelector('[role="tree"]:not(:has-text("Select a principal"))', {
      timeout: 5000
    });

    // Scan only the opportunities tree for ARIA violations
    // (excluding color-contrast which is a pre-existing design system issue)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('#opportunities-panel')
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
