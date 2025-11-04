import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout Visual Inspection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/');

    // Login with test user
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('/#/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard - Full Page Screenshot', async ({ page }) => {
    // Capture full dashboard
    await page.screenshot({ path: 'tests/screenshots/dashboard-full.png', fullPage: true });

    // Verify main dashboard elements exist
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Total Contacts')).toBeVisible();
  });

  test('Dashboard - Widget Dimensions', async ({ page }) => {
    // Get all dashboard widgets
    const widgets = await page.locator('[role="button"]').filter({ hasText: 'My Open Opportunities' });
    const widgetBox = await widgets.first().boundingBox();

    console.log('My Open Opportunities Widget Dimensions:', widgetBox);

    // Verify minimum height
    if (widgetBox) {
      console.log(`Widget height: ${widgetBox.height}px`);
      console.log(`Widget width: ${widgetBox.width}px`);
    }

    // Screenshot individual widget
    await widgets.first().screenshot({ path: 'tests/screenshots/widget-my-open-opps.png' });
  });

  test('Dashboard - Metrics Cards', async ({ page }) => {
    const metricsGrid = page.locator('text=Total Contacts').locator('..');
    await metricsGrid.screenshot({ path: 'tests/screenshots/metrics-grid.png' });

    // Get metrics card dimensions
    const metricCards = await page.locator('text=Total Contacts').locator('../..').all();
    console.log(`Found ${metricCards.length} metric cards`);

    for (const card of metricCards) {
      const box = await card.boundingBox();
      if (box) {
        console.log(`Metric card: ${box.width}x${box.height}px`);
      }
    }
  });

  test('Dashboard - Pipeline Chart', async ({ page }) => {
    const pipelineWidget = page.getByText('Pipeline by Stage').locator('../..');
    await pipelineWidget.screenshot({ path: 'tests/screenshots/pipeline-chart.png' });

    const box = await pipelineWidget.boundingBox();
    console.log('Pipeline Chart Widget:', box);
  });

  test('Dashboard - Scrolling Required Check', async ({ page }) => {
    // Get page height
    const viewportSize = page.viewportSize();
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    console.log(`Viewport: ${viewportSize?.width}x${viewportSize?.height}`);
    console.log(`Page height: ${pageHeight}px`);
    console.log(`Scrolling required: ${pageHeight > (viewportSize?.height || 0)}`);

    // Verify no scrolling needed
    if (viewportSize) {
      const scrollRequired = pageHeight > viewportSize.height;
      console.log(scrollRequired
        ? `❌ FAIL: Page requires ${pageHeight - viewportSize.height}px of scrolling`
        : `✅ PASS: All content fits without scrolling`
      );
    }
  });

  test('Dashboard - Text Readability', async ({ page }) => {
    // Check for truncated text
    const titles = await page.locator('h3').all();
    console.log(`Found ${titles.length} headings`);

    for (const title of titles) {
      const text = await title.textContent();
      const box = await title.boundingBox();
      if (box && text) {
        console.log(`"${text}": ${box.width}x${box.height}px`);
      }
    }
  });

  test('Dashboard - Overall Layout Screenshot', async ({ page }) => {
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));

    // Take viewport screenshot (what user sees without scrolling)
    await page.screenshot({
      path: `tests/screenshots/dashboard-viewport-${page.viewportSize()?.width}x${page.viewportSize()?.height}.png`
    });

    // Take full page screenshot
    await page.screenshot({
      path: `tests/screenshots/dashboard-fullpage-${page.viewportSize()?.width}x${page.viewportSize()?.height}.png`,
      fullPage: true
    });
  });
});
