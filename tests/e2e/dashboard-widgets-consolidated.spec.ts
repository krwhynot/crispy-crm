import { test, expect } from './support/fixtures/authenticated';
import { DashboardPage } from './support/poms/DashboardPage';
import { consoleMonitor } from './support/utils/console-monitor';

/**
 * Dashboard Widgets - Consolidated Test Suite
 *
 * Viewport-parameterized testing across Desktop, iPad Landscape, and iPad Portrait.
 * Tests widget rendering, interactions, and visual regression using POM pattern.
 *
 * Replaces dashboard-widgets-comprehensive.spec.ts (duplicate).
 * Complements dashboard-widgets.spec.ts (detailed widget tests).
 *
 * Reference: docs/plans/2025-11-15-test-suite-cleanup-implementation.md (Task 2.2)
 */

const viewports = [
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'iPad Landscape', width: 1024, height: 768 },
  { name: 'iPad Portrait', width: 768, height: 1024 },
];

for (const viewport of viewports) {
  test.describe(`Dashboard Widgets - ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    let dashboard: DashboardPage;

    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: viewport.width, height: viewport.height });
      dashboard = new DashboardPage(authenticatedPage);
      await dashboard.navigate();
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

    test('renders required widgets with proper layout', async ({ authenticatedPage }) => {
      // Widget visibility assertions
      await expect(dashboard.getUpcomingEventsWidget()).toBeVisible();
      await expect(dashboard.getPipelineSummaryWidget()).toBeVisible();
      await expect(dashboard.getMyTasksWidget()).toBeVisible();
      await expect(dashboard.getRecentActivityWidget()).toBeVisible();

      // Verify principal table is present
      await expect(dashboard.getTable()).toBeVisible();

      // Take snapshot for visual regression
      const snapshotName = `dashboard-${viewport.name.toLowerCase().replace(' ', '-')}.png`;
      await expect(authenticatedPage).toHaveScreenshot(snapshotName, {
        fullPage: true,
        mask: [dashboard.getColumnHeader(/last activity/i)],
      });
    });

    test('supports widget interactions', async () => {
      // Refresh button
      const refreshButton = dashboard.getRefreshButton();
      await expect(refreshButton).toBeVisible();
      await refreshButton.click();

      // Verify refresh completes (button re-enabled)
      await expect(refreshButton).toBeEnabled({ timeout: 5000 });

      // View All Tasks link
      const viewAllTasksLink = dashboard.getViewAllLink(/view all tasks/i);
      await expect(viewAllTasksLink).toBeVisible();
      const tasksHref = await viewAllTasksLink.getAttribute('href');
      expect(tasksHref).toContain('/tasks');

      // View All Activity link
      const viewAllActivityLink = dashboard.getViewAllLink(/view all activity/i);
      await expect(viewAllActivityLink).toBeVisible();
      const activityHref = await viewAllActivityLink.getAttribute('href');
      expect(activityHref).toContain('/activities');
    });

    test('displays proper layout for viewport', async () => {
      if (viewport.width >= 1024) {
        // Desktop and iPad Landscape: Two-column layout
        const isTwoColumn = await dashboard.isTwoColumnLayout();
        expect(isTwoColumn).toBe(true);

        // Verify left column is wider than right sidebar
        const leftBox = await dashboard.getLeftColumn().boundingBox();
        const rightBox = await dashboard.getRightSidebar().boundingBox();

        expect(leftBox).not.toBeNull();
        expect(rightBox).not.toBeNull();

        if (leftBox && rightBox) {
          expect(leftBox.width).toBeGreaterThan(rightBox.width);
        }
      } else {
        // iPad Portrait: Stacked layout
        const isStacked = await dashboard.isStackedLayout();
        expect(isStacked).toBe(true);

        // Verify widgets stack vertically
        const leftBox = await dashboard.getLeftColumn().boundingBox();
        const rightBox = await dashboard.getRightSidebar().boundingBox();

        expect(leftBox).not.toBeNull();
        expect(rightBox).not.toBeNull();

        if (leftBox && rightBox) {
          // Right sidebar should be below left column
          expect(rightBox.top).toBeGreaterThan(leftBox.bottom - 20);
        }
      }

      // Verify no horizontal scroll on any viewport
      const hasHorizontalScroll = await dashboard.hasHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);
    });

    test('widgets have proper card styling', async () => {
      await dashboard.verifyWidgetStyling(dashboard.getUpcomingEventsWidget());
      await dashboard.verifyWidgetStyling(dashboard.getMyTasksWidget());
      await dashboard.verifyWidgetStyling(dashboard.getRecentActivityWidget());
      await dashboard.verifyWidgetStyling(dashboard.getPipelineSummaryWidget());
    });
  });
}
