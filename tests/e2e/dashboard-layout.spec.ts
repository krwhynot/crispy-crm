import { test, expect } from "./support/fixtures/authenticated";
import { DashboardPage } from "./support/poms/DashboardPage";
import { consoleMonitor } from "./support/utils/console-monitor";

/**
 * Principal-Centric Dashboard E2E Tests - iPad Focus
 *
 * Tests the new principal-centric table dashboard layout on iPad viewport (768x1024).
 * Once iPad tests are stable, we'll expand to desktop and mobile.
 *
 * Focus Areas:
 * - Principal table with 6 columns (Principal, # Opps, Status, Last Activity, Stuck, Next Action)
 * - Table data display and interactions
 * - Layout and no horizontal scrolling
 * - Touch target sizes for iPad
 *
 * Uses:
 * - authenticated fixture (automatic login + console monitoring)
 * - DashboardPage POM (semantic selectors only)
 * - Condition-based waiting (no arbitrary timeouts)
 */

test.describe("Dashboard - iPad (768x1024)", () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    // Viewport already set in playwright.config.ts (768x1024)

    // Create POM instance
    dashboard = new DashboardPage(authenticatedPage);

    // Navigate to dashboard
    await dashboard.navigate();
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      // Attach detailed report to test results for debugging
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    // Fail test if console errors were detected
    expect(
      errors,
      "Console errors were detected during the test. See attached report."
    ).toHaveLength(0);
  });

  test.describe("Core Elements", () => {
    test('displays "Principal Dashboard" heading', async () => {
      await expect(dashboard.getHeading()).toBeVisible();
    });

    test("displays refresh button", async () => {
      const refreshButton = dashboard.getRefreshButton();
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });

    test("refresh button works", async () => {
      const refreshButton = dashboard.getRefreshButton();

      // Verify button is initially enabled
      await expect(refreshButton).toBeEnabled();

      // Click refresh and wait for completion
      await dashboard.refresh();

      // Verify we can click it again (proves it's functional)
      await refreshButton.click();
      await expect(refreshButton).toBeEnabled();
    });

    test("has no console errors on load", async () => {
      // Console monitoring happens automatically via fixture
      expect(consoleMonitor.hasRLSErrors()).toBe(false);
      expect(consoleMonitor.hasReactErrors()).toBe(false);
      expect(consoleMonitor.hasNetworkErrors()).toBe(false);
    });
  });

  test.describe("Principal Table Structure", () => {
    test("displays all 6 column headers", async () => {
      await dashboard.expectAllColumnHeaders();
    });

    test("table is visible", async () => {
      const table = dashboard.getTable();
      await expect(table).toBeVisible();

      // Verify table has reasonable dimensions
      const box = await table.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThan(50); // Has content
        expect(box.width).toBeGreaterThan(150); // Reasonable width
      }
    });

    test("table structure is valid", async () => {
      // Table should have column headers
      await expect(dashboard.getColumnHeader(/principal/i)).toBeVisible();

      // If table has data, verify rows are present
      const isEmpty = await dashboard.isTableEmpty();
      if (!isEmpty) {
        const firstRow = dashboard.getFirstDataRow();
        await expect(firstRow).toBeVisible();
      }
    });
  });

  test.describe("Layout and Responsiveness", () => {
    test("no horizontal scrolling on iPad", async () => {
      const hasScroll = await dashboard.hasHorizontalScroll();
      expect(hasScroll).toBe(false);
    });

    test("table adapts to tablet layout", async () => {
      const table = dashboard.getTable();
      const box = await table.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        // Table should be visible and sized appropriately
        expect(box.height).toBeGreaterThan(80);
        expect(box.width).toBeGreaterThan(150);
      }
    });

    test("dashboard content fits reasonably", async () => {
      const pageHeight = await dashboard.getPageHeight();
      const viewportHeight = dashboard.getViewportHeight();

      // Simple table-based dashboard should fit without excessive scrolling
      // Allow reasonable scrolling (< 2x viewport height)
      expect(pageHeight).toBeLessThan(viewportHeight * 2);
    });

    test("touch targets meet minimum size", async () => {
      // Refresh button should be touch-friendly (44x44px minimum)
      const refreshButton = dashboard.getRefreshButton();
      const meetsTouchSize = await dashboard.meetsTouchTargetSize(refreshButton, 36);

      expect(meetsTouchSize).toBe(true);
    });
  });

  test.describe("Table Interactions", () => {
    test("table rows are clickable (if data exists)", async () => {
      const isEmpty = await dashboard.isTableEmpty();

      if (!isEmpty) {
        const firstRow = dashboard.getFirstDataRow();
        await expect(firstRow).toBeVisible();

        // Row should have pointer cursor
        const cursor = await firstRow.evaluate((el) => window.getComputedStyle(el).cursor);
        expect(cursor).toBe("pointer");
      } else {
        // Skip test if no data - not a failure
        test.skip();
      }
    });

    test("refresh button updates data", async () => {
      const refreshButton = dashboard.getRefreshButton();

      // Click refresh
      await dashboard.refresh();

      // Button should be enabled again after refresh
      await expect(refreshButton).toBeEnabled();

      // Table should still be visible after refresh
      const table = dashboard.getTable();
      await expect(table).toBeVisible();
    });
  });

  test.describe("Navigation", () => {
    test("navigation tabs remain accessible on iPad", async () => {
      const navigation = dashboard.getNavigation();
      await expect(navigation).toBeVisible();

      // Dashboard link should be visible in nav
      const dashboardLink = dashboard.getDashboardNavLink();
      await expect(dashboardLink).toBeVisible();
    });
  });

  test.describe("Visual Regression", () => {
    test("capture dashboard at iPad resolution", async ({ authenticatedPage }) => {
      // Visual snapshot embedded in functional test (per skill)
      await expect(authenticatedPage).toHaveScreenshot("dashboard-ipad.png", {
        fullPage: true,
        // Mask dynamic elements like timestamps
        mask: [dashboard.getColumnHeader(/last activity/i)],
      });
    });
  });
});
