import { test, expect } from './support/fixtures/authenticated';
import { consoleMonitor } from './support/utils/console-monitor';

/**
 * Dashboard V2 - Consolidated Viewport Test Suite
 *
 * Minimal viewport-parameterized smoke tests for Dashboard V2 (default at /).
 * Tests that the dashboard loads successfully across viewports.
 *
 * NOTE: Old dashboard widgets (Upcoming Events, My Tasks, Recent Activity, Pipeline Summary)
 * no longer exist in the codebase. The original dashboard-widgets.spec.ts and
 * dashboard-widgets-comprehensive.spec.ts tested obsolete features.
 *
 * Dashboard V2 has 3-column resizable layout (Opportunities | Tasks | Quick Logger) with
 * collapsible filter sidebar. Comprehensive tests for those features should be added
 * in the future when stabilization work is complete.
 *
 * Replaces:
 * - dashboard-widgets-comprehensive.spec.ts (duplicate, obsolete)
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

    test('loads dashboard successfully', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to Dashboard V2
      await authenticatedPage.goto('/');

      // Wait for dashboard to load - check for the header
      const header = authenticatedPage.getByRole('banner').or(
        authenticatedPage.locator('header')
      ).first();
      await expect(header).toBeVisible({ timeout: 10000 });

      // Verify no console errors
      const errors = consoleMonitor.getErrors();
      expect(errors, 'Console errors detected during dashboard load').toHaveLength(0);
    });
  });
}
