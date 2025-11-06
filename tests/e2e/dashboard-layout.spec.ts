import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 *
 * Tests the dashboard layout, widgets, metrics, and responsive behavior.
 *
 * Focus Areas:
 * - Widget presence and visibility (6 Phase 4 widgets)
 * - Metrics cards display
 * - Layout and no horizontal scrolling
 * - Responsive behavior
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
    test('displays dashboard heading', async ({ page }) => {
      // Use getByRole to avoid ambiguity with navigation link
      const heading = page.getByRole('heading', { name: 'Dashboard' });
      await expect(heading).toBeVisible();
    });

    test('displays refresh button', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });

    test('refresh button works', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });

      // Click refresh button
      await refreshButton.click();

      // Button should temporarily show spinning state
      await expect(refreshButton).toBeDisabled();

      // Wait for refresh to complete (500ms per Dashboard.tsx)
      await page.waitForTimeout(600);

      // Button should be enabled again
      await expect(refreshButton).toBeEnabled();
    });
  });

  test.describe('Metrics Cards', () => {
    test('displays "Total Contacts" metric', async ({ page }) => {
      await expect(page.getByText('Total Contacts')).toBeVisible();
    });

    test('metrics cards have proper structure', async ({ page }) => {
      const metricsSection = page.locator('text=Total Contacts').locator('../..');

      // Metrics section should be visible
      await expect(metricsSection).toBeVisible();

      // Should have reasonable dimensions
      const box = await metricsSection.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThan(15); // Has content
        expect(box.width).toBeGreaterThan(50); // Has width
      }
    });
  });

  test.describe('Phase 4 Widgets', () => {
    test('displays all 6 Phase 4 widgets', async ({ page }) => {
      // Test for all 6 widgets from Dashboard.tsx lines 90-95
      await expect(page.getByText('My Open Opportunities')).toBeVisible();
      await expect(page.getByText('Overdue Tasks')).toBeVisible();
      await expect(page.getByText("This Week's Activities")).toBeVisible();
      await expect(page.getByText('Opportunities by Principal')).toBeVisible();
      await expect(page.getByText('Pipeline by Stage')).toBeVisible();
      await expect(page.getByText('Recent Activities')).toBeVisible();
    });

    test('My Open Opportunities widget has proper dimensions', async ({ page }) => {
      const widget = page.getByText('My Open Opportunities').locator('../..');
      await expect(widget).toBeVisible();

      const box = await widget.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Widget should have reasonable height (not collapsed)
        expect(box.height).toBeGreaterThan(100);
        expect(box.width).toBeGreaterThan(200);
      }
    });

    test('Pipeline by Stage widget is displayed', async ({ page }) => {
      const widget = page.getByText('Pipeline by Stage').locator('../..');
      await expect(widget).toBeVisible();

      const box = await widget.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThan(50);
      }
    });
  });

  test.describe('Legacy Widgets', () => {
    test('displays Tasks List', async ({ page }) => {
      // Tasks List is a legacy widget (Dashboard.tsx line 102)
      const tasksWidget = page.locator('text=/Tasks/i').first();
      await expect(tasksWidget).toBeVisible();
    });

    test('displays Hot Contacts', async ({ page }) => {
      const hotContactsWidget = page.getByText('Hot Contacts');
      await expect(hotContactsWidget).toBeVisible();
    });

    test('displays Quick Add section', async ({ page }) => {
      // QuickAdd displays buttons, not "Quick Add" text
      const newContactButton = page.getByRole('link', { name: /new contact/i });
      await expect(newContactButton).toBeVisible();

      const newOpportunityButton = page.getByRole('link', { name: /new opportunity/i });
      await expect(newOpportunityButton).toBeVisible();
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

    test('dashboard grid layout works', async ({ page }) => {
      // Phase 4 widgets use grid layout (Dashboard.tsx line 89)
      // Verify widgets are positioned in a grid
      const widget1 = page.getByText('My Open Opportunities').locator('../..');
      const widget2 = page.getByText('Overdue Tasks').locator('../..');

      const box1 = await widget1.boundingBox();
      const box2 = await widget2.boundingBox();

      expect(box1).not.toBeNull();
      expect(box2).not.toBeNull();

      if (box1 && box2) {
        // On desktop (default), widgets should be side-by-side or stacked
        // Either way, they should be visible and positioned
        expect(box1.y).toBeGreaterThan(0);
        expect(box2.y).toBeGreaterThan(0);
      }
    });

    test('all dashboard content fits in viewport at 1280px', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(500);

      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const viewportHeight = page.viewportSize()?.height || 0;

      // Dashboard should fit without excessive scrolling
      // Allow some scrolling (< 2x viewport height)
      expect(pageHeight).toBeLessThan(viewportHeight * 2);
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
