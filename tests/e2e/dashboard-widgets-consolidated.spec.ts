import { test, expect } from './support/fixtures/authenticated';
import { consoleMonitor } from './support/utils/console-monitor';

/**
 * Dashboard V2 - Consolidated Viewport Test Suite
 *
 * Viewport-parameterized testing for Dashboard V2 (default at /).
 * Tests the 3-column resizable layout (Opportunities | Tasks | Quick Logger).
 *
 * NOTE: Old dashboard widgets (Upcoming Events, My Tasks, Recent Activity, Pipeline Summary)
 * no longer exist in the codebase. dashboard-widgets.spec.ts and dashboard-widgets-comprehensive.spec.ts
 * tested non-existent features and have been consolidated/replaced.
 *
 * Replaces:
 * - dashboard-widgets-comprehensive.spec.ts (duplicate, obsolete)
 * - Consolidates viewport testing patterns
 *
 * Reference: docs/plans/2025-11-15-test-suite-cleanup-implementation.md (Task 2.2)
 */

const viewports = [
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'iPad Landscape', width: 1024, height: 768 },
  { name: 'iPad Portrait', width: 768, height: 1024 },
];

for (const viewport of viewports) {
  test.describe(`Dashboard V2 - ${viewport.name} (${viewport.width}x${viewport.height})`, () => {

    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to Dashboard V2
      await authenticatedPage.goto('/');

      // Wait for filters sidebar or opportunities column (indicates dashboard loaded)
      await expect(
        authenticatedPage.getByRole('complementary', { name: /filters/i }).or(
          authenticatedPage.locator('#col-opportunities')
        )
      ).toBeVisible({ timeout: 10000 });
    });

    test.afterEach(async () => {
      const errors = consoleMonitor.getErrors();
      if (errors.length > 0) {
        await test.info().attach('console-report', {
          body: consoleMonitor.getReport(),
          contentType: 'text/plain',
        });
      }
      expect(errors, 'Console errors detected. See attached report.').toHaveLength(0);
    });

    test('renders 3-column layout with core components', async ({ authenticatedPage }) => {
      // Verify filters sidebar
      await expect(authenticatedPage.getByRole('complementary', { name: /filters/i })).toBeVisible();

      // Verify 3 main columns
      const opportunitiesCol = authenticatedPage.locator('#col-opportunities');
      const tasksCol = authenticatedPage.locator('#col-tasks');
      const loggerCol = authenticatedPage.locator('#col-logger');

      await expect(opportunitiesCol).toBeVisible();
      await expect(tasksCol).toBeVisible();
      await expect(loggerCol).toBeVisible();

      // Take snapshot for visual regression
      const snapshotName = `dashboard-v2-${viewport.name.toLowerCase().replace(' ', '-')}.png`;
      await expect(authenticatedPage).toHaveScreenshot(snapshotName, {
        fullPage: false, // Don't capture full page - just viewport
        timeout: 10000,
      });
    });

    test('supports filter sidebar interactions', async ({ authenticatedPage }) => {
      const sidebar = authenticatedPage.getByRole('complementary', { name: /filters/i });
      await expect(sidebar).toBeVisible();

      // Check for filter controls
      const healthFilters = sidebar.getByText(/health status/i);
      const stageFilters = sidebar.getByText(/stage/i);

      // At least one filter section should be visible
      const hasFilters = await healthFilters.or(stageFilters).isVisible();
      expect(hasFilters).toBe(true);
    });

    test('displays proper 3-column layout', async ({ authenticatedPage }) => {
      const opportunitiesCol = authenticatedPage.locator('#col-opportunities');
      const tasksCol = authenticatedPage.locator('#col-tasks');
      const loggerCol = authenticatedPage.locator('#col-logger');

      // All columns should be visible
      await expect(opportunitiesCol).toBeVisible();
      await expect(tasksCol).toBeVisible();
      await expect(loggerCol).toBeVisible();

      // Verify they're arranged horizontally (on desktop/tablet landscape)
      if (viewport.width >= 1024) {
        const oppBox = await opportunitiesCol.boundingBox();
        const tasksBox = await tasksCol.boundingBox();
        const loggerBox = await loggerCol.boundingBox();

        expect(oppBox).not.toBeNull();
        expect(tasksBox).not.toBeNull();
        expect(loggerBox).not.toBeNull();

        if (oppBox && tasksBox && loggerBox) {
          // Columns should be side-by-side (similar top position)
          const topDiff = Math.max(
            Math.abs(oppBox.top - tasksBox.top),
            Math.abs(tasksBox.top - loggerBox.top)
          );
          expect(topDiff).toBeLessThan(50);

          // Tasks should be to the right of opportunities
          expect(tasksBox.left).toBeGreaterThan(oppBox.left);
          // Logger should be to the right of tasks
          expect(loggerBox.left).toBeGreaterThan(tasksBox.left);
        }
      }

      // Verify no horizontal scroll on any viewport
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth);
      const viewportWidth = authenticatedPage.viewportSize()?.width || 0;
      const hasHorizontalScroll = bodyWidth > viewportWidth + 5;
      expect(hasHorizontalScroll).toBe(false);
    });
  });
}
