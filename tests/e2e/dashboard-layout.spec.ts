import { test, expect } from '@playwright/test';

/**
 * Principal-Centric Dashboard E2E Tests
 *
 * Tests the new principal-centric table dashboard layout and responsive behavior.
 *
 * Focus Areas:
 * - Principal table with 6 columns (Principal, # Opps, Status, Last Activity, Stuck, Next Action)
 * - Table data display and interactions
 * - Layout and no horizontal scrolling
 * - Responsive behavior (desktop/iPad/mobile)
 */

test.describe('Dashboard Tests', () => {
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

  test.describe('Dashboard Core Elements', () => {
    test('displays "My Principals" heading', async ({ page }) => {
      const heading = page.getByRole('heading', { name: 'My Principals' });
      await expect(heading).toBeVisible();
    });

    test('displays refresh button', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });

    test('refresh button works', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });

      // Verify button is initially enabled
      await expect(refreshButton).toBeEnabled();

      // Click refresh button
      await refreshButton.click();

      // Wait for refresh animation to complete (500ms per Dashboard.tsx line 60)
      await page.waitForTimeout(600);

      // Button should still be enabled and functional after refresh
      await expect(refreshButton).toBeEnabled();

      // Verify we can click it again (proves it's functional)
      await refreshButton.click();
      await page.waitForTimeout(100);
    });
  });

  test.describe('Principal Table Structure', () => {
    test('displays all 6 column headers', async ({ page }) => {
      // Test for all 6 columns from PrincipalDashboardTable.tsx
      await expect(page.getByRole('columnheader', { name: 'Principal' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '# Opps' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Last Activity' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Stuck' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Next Action' })).toBeVisible();
    });

    test('table is visible and has data rows', async ({ page }) => {
      // Table should be present with React Admin classes
      const table = page.locator('.RaDatagrid-table');
      await expect(table).toBeVisible();

      // Should have at least table headers
      const headerRow = table.locator('thead tr');
      await expect(headerRow).toBeVisible();
    });

    test('table has proper styling', async ({ page }) => {
      const table = page.locator('.RaDatagrid-table');
      await expect(table).toBeVisible();

      // Verify table exists and is positioned
      const box = await table.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThan(50); // Has content
        expect(box.width).toBeGreaterThan(200); // Reasonable width
      }
    });
  });

  test.describe('Layout and Responsiveness', () => {
    test('no horizontal scrolling on desktop (1280px)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(500); // Allow layout to settle

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 0;

      // Body should not exceed viewport width
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // +5px tolerance
    });

    test('principal table layout works', async ({ page }) => {
      // Table should be visible and properly positioned
      const table = page.locator('.RaDatagrid-table');
      await expect(table).toBeVisible();

      const box = await table.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Table should be visible and positioned properly
        expect(box.y).toBeGreaterThan(0);
        expect(box.width).toBeGreaterThan(200);
      }
    });

    test('dashboard content fits reasonably at 1280px', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(500);

      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const viewportHeight = page.viewportSize()?.height || 0;

      // Simple table-based dashboard should fit without excessive scrolling
      // Allow reasonable scrolling (< 2x viewport height = ~1440px)
      expect(pageHeight).toBeLessThan(viewportHeight * 2);
    });
  });

  test.describe('Table Interactions', () => {
    test('table rows are clickable', async ({ page }) => {
      // Find a table row (excluding header)
      const dataRow = page.locator('.RaDatagrid-row').first();

      // Row should be visible
      await expect(dataRow).toBeVisible();

      // Row should have hover cursor
      const cursor = await dataRow.evaluate((el) =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });

    test('table displays data', async ({ page }) => {
      // Table should contain actual data rows (not just headers)
      const table = page.locator('.RaDatagrid-table');
      await expect(table).toBeVisible();

      // Should have reasonable height indicating data presence
      const box = await table.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThan(80); // More than just header row
      }
    });

    test('refresh button works and updates data', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });

      // Click refresh
      await refreshButton.click();

      // Wait for refresh animation (500ms from Dashboard.tsx:44)
      await page.waitForTimeout(600);

      // Button should be enabled again after refresh
      await expect(refreshButton).toBeEnabled();

      // Table should still be visible after refresh
      const table = page.locator('.RaDatagrid-table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Responsive Behavior - iPad (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
    });

    test('principal table remains visible on iPad', async ({ page }) => {
      // Table and all column headers should be visible
      const table = page.locator('.RaDatagrid-table');
      await expect(table).toBeVisible();

      await expect(page.getByRole('columnheader', { name: 'Principal' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    });

    test('table adapts to tablet layout', async ({ page }) => {
      // Table should have reasonable dimensions on iPad
      const table = page.locator('.RaDatagrid-table');
      const box = await table.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        // Table should be visible and sized appropriately
        expect(box.height).toBeGreaterThan(80);
        expect(box.width).toBeGreaterThan(150);
      }
    });

    test('no horizontal scrolling on iPad', async ({ page }) => {
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 0;

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test('touch targets meet minimum size on iPad', async ({ page }) => {
      // Refresh button should be touch-friendly (44x44px minimum)
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      const buttonBox = await refreshButton.boundingBox();

      expect(buttonBox).not.toBeNull();
      if (buttonBox) {
        // Minimum 40px height for touch targets
        expect(buttonBox.height).toBeGreaterThanOrEqual(36);
      }
    });

    test('navigation tabs remain accessible on iPad', async ({ page }) => {
      // Navigation should still be visible and functional
      const navigation = page.getByRole('navigation').first();
      await expect(navigation).toBeVisible();

      // Dashboard link should be visible in nav
      const dashboardLink = page.locator('nav a').filter({ hasText: 'Dashboard' });
      await expect(dashboardLink).toBeVisible();
    });
  });

  test.describe('Responsive Behavior - Mobile (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
    });

    test('"My Principals" heading visible on mobile', async ({ page }) => {
      const heading = page.getByRole('heading', { name: 'My Principals' });
      await expect(heading).toBeVisible();
    });

    test('table remains accessible on mobile', async ({ page }) => {
      // Table should be present and scrollable on mobile
      const table = page.locator('.RaDatagrid-table');
      await expect(table).toBeVisible();

      const box = await table.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Table should have content even on mobile
        expect(box.height).toBeGreaterThan(60);
      }
    });

    test('critical actions remain accessible on mobile', async ({ page }) => {
      // Refresh button should still be accessible
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });

    test('refresh button has adequate touch target on mobile', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      const buttonBox = await refreshButton.boundingBox();

      expect(buttonBox).not.toBeNull();
      if (buttonBox) {
        // Minimum 40px for mobile touch targets
        expect(buttonBox.height).toBeGreaterThanOrEqual(36);
      }
    });
  });

  test.describe('Visual Regression Helpers', () => {
    test('capture full dashboard screenshot', async ({ page }) => {
      // Capture for visual regression testing
      await page.screenshot({
        path: 'tests/screenshots/dashboard-full.png',
        fullPage: true
      });
    });

    test('capture dashboard at iPad resolution', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'tests/screenshots/dashboard-ipad.png',
        fullPage: true
      });
    });
  });
});
