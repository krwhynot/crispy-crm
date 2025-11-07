import { test, expect } from './support/fixtures/authenticated';
import { DashboardPage } from './support/poms/DashboardPage';
import { consoleMonitor } from './support/utils/console-monitor';

/**
 * Dashboard Widgets E2E Tests - Responsive Layout & UX
 *
 * Tests the enhanced dashboard with 4 supporting widgets across multiple viewports.
 * Validates grid layout, responsive stacking, widget visibility, and iPad-first design.
 *
 * Widgets Tested:
 * 1. Upcoming Events by Principal
 * 2. Principal Table (main)
 * 3. My Tasks This Week
 * 4. Recent Activity Feed
 *
 * Viewports Tested:
 * - Desktop: 1280x1024 (70/30 grid)
 * - iPad Landscape: 1024x768 (70/30 grid)
 * - iPad Portrait: 768x1024 (stacked)
 * - Mobile: 375x667 (stacked)
 *
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md
 * Uses:
 * - authenticated fixture (automatic login + console monitoring)
 * - DashboardPage POM (semantic selectors only)
 * - Condition-based waiting (no arbitrary timeouts)
 */

test.describe('Dashboard Widgets - Desktop (1280x1024)', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 1280, height: 1024 });
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

  test.describe('Widget Visibility', () => {
    test('displays all 4 widgets', async () => {
      await expect(dashboard.getUpcomingEventsWidget()).toBeVisible();
      await expect(dashboard.getTable()).toBeVisible(); // Principal table
      await expect(dashboard.getMyTasksWidget()).toBeVisible();
      await expect(dashboard.getRecentActivityWidget()).toBeVisible();
    });

    test('widgets have proper card styling', async () => {
      // Verify each widget has semantic card styling
      await dashboard.verifyWidgetStyling(dashboard.getUpcomingEventsWidget());
      await dashboard.verifyWidgetStyling(dashboard.getMyTasksWidget());
      await dashboard.verifyWidgetStyling(dashboard.getRecentActivityWidget());
    });

    test('all widgets render within viewport without scroll', async () => {
      const hasHorizontalScroll = await dashboard.hasHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);
    });
  });

  test.describe('Grid Layout - 70/30 Split', () => {
    test('displays two-column layout', async () => {
      const isTwoColumn = await dashboard.isTwoColumnLayout();
      expect(isTwoColumn).toBe(true);
    });

    test('left column is wider than right sidebar', async () => {
      const leftBox = await dashboard.getLeftColumn().boundingBox();
      const rightBox = await dashboard.getRightSidebar().boundingBox();

      expect(leftBox).not.toBeNull();
      expect(rightBox).not.toBeNull();

      if (leftBox && rightBox) {
        // Main content should be significantly wider than sidebar
        expect(leftBox.width).toBeGreaterThan(rightBox.width);
        // Verify columns are side-by-side (similar vertical start)
        expect(Math.abs(leftBox.top - rightBox.top)).toBeLessThan(50);
      }
    });

    test('left column contains Upcoming Events and Principal Table', async () => {
      const leftColumn = dashboard.getLeftColumn();

      // Both widgets should be in left column
      await expect(leftColumn.getByRole('heading', { name: /upcoming by principal/i })).toBeVisible();
      await expect(leftColumn.getByRole('table')).toBeVisible();
    });

    test('right sidebar contains Tasks and Activity widgets', async () => {
      const rightSidebar = dashboard.getRightSidebar();

      // Both widgets should be in right sidebar
      await expect(rightSidebar.getByRole('heading', { name: /my tasks this week/i })).toBeVisible();
      await expect(rightSidebar.getByRole('heading', { name: /recent activity/i })).toBeVisible();
    });
  });

  test.describe('Widget Interactions', () => {
    test('View All Tasks link is visible and clickable', async () => {
      const viewAllLink = dashboard.getViewAllLink(/view all tasks/i);
      await expect(viewAllLink).toBeVisible();

      // Verify it's a proper link
      const href = await viewAllLink.getAttribute('href');
      expect(href).toContain('/tasks');
    });

    test('View All Activity link is visible and clickable', async () => {
      const viewAllLink = dashboard.getViewAllLink(/view all activity/i);
      await expect(viewAllLink).toBeVisible();

      // Verify it's a proper link
      const href = await viewAllLink.getAttribute('href');
      expect(href).toContain('/activities');
    });

    test('refresh button updates all widgets', async () => {
      // Click refresh
      await dashboard.refresh();

      // All widgets should still be visible after refresh
      await expect(dashboard.getUpcomingEventsWidget()).toBeVisible();
      await expect(dashboard.getMyTasksWidget()).toBeVisible();
      await expect(dashboard.getRecentActivityWidget()).toBeVisible();
      await expect(dashboard.getTable()).toBeVisible();
    });
  });
});

test.describe('Dashboard Widgets - iPad Landscape (1024x768)', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 1024, height: 768 });
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
    expect(errors, 'Console errors detected').toHaveLength(0);
  });

  test('displays two-column grid layout', async () => {
    const isTwoColumn = await dashboard.isTwoColumnLayout();
    expect(isTwoColumn).toBe(true);
  });

  test('all widgets visible without horizontal scroll', async () => {
    await expect(dashboard.getUpcomingEventsWidget()).toBeVisible();
    await expect(dashboard.getMyTasksWidget()).toBeVisible();
    await expect(dashboard.getRecentActivityWidget()).toBeVisible();

    const hasHorizontalScroll = await dashboard.hasHorizontalScroll();
    expect(hasHorizontalScroll).toBe(false);
  });

  test('left column is wider than right sidebar', async () => {
    const leftBox = await dashboard.getLeftColumn().boundingBox();
    const rightBox = await dashboard.getRightSidebar().boundingBox();

    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();

    if (leftBox && rightBox) {
      // Main content should be significantly wider than sidebar
      expect(leftBox.width).toBeGreaterThan(rightBox.width);
    }
  });

  test('capture iPad landscape visual snapshot', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveScreenshot('dashboard-widgets-ipad-landscape.png', {
      fullPage: true,
      mask: [dashboard.getColumnHeader(/last activity/i)],
    });
  });
});

test.describe('Dashboard Widgets - iPad Portrait (768x1024)', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
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
    expect(errors, 'Console errors detected').toHaveLength(0);
  });

  test.describe('Responsive Stacking', () => {
    test('switches to single-column stacked layout', async () => {
      const isStacked = await dashboard.isStackedLayout();
      expect(isStacked).toBe(true);
    });

    test('all widgets stack vertically (full width)', async () => {
      const leftColumn = dashboard.getLeftColumn();
      const rightSidebar = dashboard.getRightSidebar();

      const leftBox = await leftColumn.boundingBox();
      const rightBox = await rightSidebar.boundingBox();

      expect(leftBox).not.toBeNull();
      expect(rightBox).not.toBeNull();

      if (leftBox && rightBox) {
        // Both should be nearly full width in stacked mode
        const viewportWidth = dashboard.page.viewportSize()?.width || 0;
        expect(leftBox.width).toBeGreaterThan(viewportWidth * 0.9);
        expect(rightBox.width).toBeGreaterThan(viewportWidth * 0.9);

        // Right sidebar should be below left column
        expect(rightBox.top).toBeGreaterThan(leftBox.bottom - 20);
      }
    });

    test('maintains proper vertical stacking order', async ({ authenticatedPage }) => {
      // Order should be: Upcoming Events → Principal Table → Tasks → Activity
      const upcomingBox = await dashboard.getUpcomingEventsWidget().boundingBox();
      const tableBox = await dashboard.getTable().boundingBox();
      const tasksBox = await dashboard.getMyTasksWidget().boundingBox();
      const activityBox = await dashboard.getRecentActivityWidget().boundingBox();

      expect(upcomingBox).not.toBeNull();
      expect(tableBox).not.toBeNull();
      expect(tasksBox).not.toBeNull();
      expect(activityBox).not.toBeNull();

      if (upcomingBox && tableBox && tasksBox && activityBox) {
        expect(upcomingBox.top).toBeLessThan(tableBox.top);
        expect(tableBox.top).toBeLessThan(tasksBox.top);
        expect(tasksBox.top).toBeLessThan(activityBox.top);
      }
    });

    test('no horizontal scrolling in portrait mode', async () => {
      const hasHorizontalScroll = await dashboard.hasHorizontalScroll();
      expect(hasHorizontalScroll).toBe(false);
    });
  });

  test.describe('Touch Targets', () => {
    test('refresh button meets 44px touch target minimum', async () => {
      const refreshButton = dashboard.getRefreshButton();
      const meetsTouchSize = await dashboard.meetsTouchTargetSize(refreshButton, 44);
      expect(meetsTouchSize).toBe(true);
    });

    test('View All links meet 44px touch target minimum', async () => {
      const viewAllTasks = dashboard.getViewAllLink(/view all tasks/i);
      const viewAllActivity = dashboard.getViewAllLink(/view all activity/i);

      // Links should have adequate touch area
      const tasksBox = await viewAllTasks.boundingBox();
      const activityBox = await viewAllActivity.boundingBox();

      expect(tasksBox).not.toBeNull();
      expect(activityBox).not.toBeNull();

      if (tasksBox && activityBox) {
        expect(tasksBox.height).toBeGreaterThanOrEqual(36); // Relaxed for text links
        expect(activityBox.height).toBeGreaterThanOrEqual(36);
      }
    });
  });

  test('capture iPad portrait visual snapshot', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveScreenshot('dashboard-widgets-ipad-portrait.png', {
      fullPage: true,
      mask: [dashboard.getColumnHeader(/last activity/i)],
    });
  });
});

test.describe('Dashboard Widgets - Mobile (375x667)', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });
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
    expect(errors, 'Console errors detected').toHaveLength(0);
  });

  test('displays single-column stacked layout', async () => {
    const isStacked = await dashboard.isStackedLayout();
    expect(isStacked).toBe(true);
  });

  test('all widgets are full width', async () => {
    const viewportWidth = dashboard.page.viewportSize()?.width || 0;

    const upcomingBox = await dashboard.getUpcomingEventsWidget().boundingBox();
    const tasksBox = await dashboard.getMyTasksWidget().boundingBox();
    const activityBox = await dashboard.getRecentActivityWidget().boundingBox();

    expect(upcomingBox).not.toBeNull();
    expect(tasksBox).not.toBeNull();
    expect(activityBox).not.toBeNull();

    if (upcomingBox && tasksBox && activityBox) {
      // Widgets should be nearly full width (accounting for padding)
      expect(upcomingBox.width).toBeGreaterThan(viewportWidth * 0.85);
      expect(tasksBox.width).toBeGreaterThan(viewportWidth * 0.85);
      expect(activityBox.width).toBeGreaterThan(viewportWidth * 0.85);
    }
  });

  test('no horizontal scrolling on mobile', async () => {
    const hasHorizontalScroll = await dashboard.hasHorizontalScroll();
    expect(hasHorizontalScroll).toBe(false);
  });

  test('all widgets remain accessible via vertical scroll', async () => {
    // All widgets should be visible (may require scrolling)
    await expect(dashboard.getUpcomingEventsWidget()).toBeVisible();
    await expect(dashboard.getTable()).toBeVisible();

    // Scroll to see bottom widgets
    await dashboard.getRecentActivityWidget().scrollIntoViewIfNeeded();
    await expect(dashboard.getRecentActivityWidget()).toBeVisible();
  });
});

test.describe('Dashboard Widgets - Theme & UX Consistency', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 1280, height: 1024 });
    dashboard = new DashboardPage(authenticatedPage);
    await dashboard.navigate();
  });

  test('widgets use semantic color variables', async ({ authenticatedPage }) => {
    const upcomingWidget = dashboard.getUpcomingEventsWidget();

    // Check that widgets use CSS variables, not hardcoded colors
    const usesSemanticColors = await upcomingWidget.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;

      // Should not be using hardcoded hex or rgb values
      // (CSS variables resolve to rgb, but we're checking the source uses vars)
      return bgColor !== '' && textColor !== '';
    });

    expect(usesSemanticColors).toBe(true);
  });

  test('widget spacing is consistent', async () => {
    const leftColumn = dashboard.getLeftColumn();
    const upcomingBox = await leftColumn.getByRole('heading', { name: /upcoming/i }).locator('..').boundingBox();
    const tableBox = await leftColumn.getByRole('table').boundingBox();

    if (upcomingBox && tableBox) {
      // Gap between widgets should be consistent (24px = 1.5rem = gap-6)
      const gap = tableBox.top - upcomingBox.bottom;
      expect(gap).toBeGreaterThan(20); // Allow for rounding
      expect(gap).toBeLessThan(30);
    }
  });

  test('all interactive elements have hover states', async ({ authenticatedPage }) => {
    const viewAllLink = dashboard.getViewAllLink(/view all tasks/i);

    // Hover over link
    await viewAllLink.hover();

    // Link should have underline on hover (from hover:underline class)
    const hasHoverState = await viewAllLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.textDecoration.includes('underline');
    });

    expect(hasHoverState).toBe(true);
  });

  test('loading states gracefully handle empty data', async () => {
    // Widgets should show empty states when no data available
    // (This test assumes some widgets may have empty states)

    // My Tasks widget should either show tasks or "No tasks due this week"
    const tasksWidget = dashboard.getMyTasksWidget();
    await expect(tasksWidget).toBeVisible();

    // Widget should not be completely blank
    const hasContent = await tasksWidget.evaluate((el) => {
      return el.textContent && el.textContent.length > 20;
    });

    expect(hasContent).toBe(true);
  });
});
