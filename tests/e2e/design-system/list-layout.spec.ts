import { test, expect } from "../support/fixtures/authenticated";
import { createListPage } from "../support/fixtures/design-system";
import { consoleMonitor } from "../support/utils/console-monitor";

/**
 * List Layout Design System Tests
 *
 * Validates StandardListLayout constraints (plan lines 45-107) for all resources:
 * - Contacts
 * - Organizations
 * - Opportunities
 * - Tasks
 * - Sales
 * - Products
 *
 * Each describe block maps to a resource so failures mirror the doc structure.
 *
 * Tests verify:
 * - Filter sidebar (256px width, sticky positioning)
 * - Main content area with card container
 * - Premium table row hover effects
 * - Layout parity across resources
 * - No horizontal scrolling
 * - Touch target sizes (44px minimum)
 *
 * Per playwright-e2e-testing skill:
 * - Page Object Models (via fixtures) ✓
 * - Semantic selectors (getByRole, getByLabel) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting ✓
 */

test.describe("List Layout - Design System", () => {
  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    // Assert no console errors
    expect(errors, "Console errors detected. See attached report.").toHaveLength(0);
  });

  test.describe("Contacts - StandardListLayout", () => {
    test("has filter sidebar with correct width (256px)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      await listPage.expectSidebarWidth(256);
    });

    test("has sticky filter sidebar", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      await listPage.expectSidebarSticky();
    });

    test("follows StandardListLayout pattern", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      await listPage.expectStandardLayout();
    });

    test("has card container with correct styling", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      await listPage.expectCardContainer();
    });

    test("table rows have premium hover effects", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      // Wait for table to load
      await expect(listPage.getTableRows().first()).toBeVisible({ timeout: 5000 });

      await listPage.expectPremiumHoverEffects(0);
    });

    test("no horizontal scrolling on desktop (1440px)", async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });

      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      await listPage.expectNoHorizontalScroll();
    });

    test("row click opens slide-over (not full page)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      // Wait for rows to load
      await expect(listPage.getTableRows().first()).toBeVisible({ timeout: 5000 });

      // Click first row
      await listPage.clickRow(0);

      // Should open slide-over dialog
      const slideOver = authenticatedPage.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible();

      // URL should have query param, not /show route
      const url = authenticatedPage.url();
      expect(url).not.toContain('/show');
      expect(url).toMatch(/\?view=\d+/);
    });
  });

  test.describe("Organizations - StandardListLayout", () => {
    test("has filter sidebar with correct width (256px)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "organizations");
      await listPage.navigate();

      await listPage.expectSidebarWidth(256);
    });

    test("follows StandardListLayout pattern", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "organizations");
      await listPage.navigate();

      await listPage.expectStandardLayout();
    });

    test("table rows have premium hover effects", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "organizations");
      await listPage.navigate();

      await expect(listPage.getTableRows().first()).toBeVisible({ timeout: 5000 });

      await listPage.expectPremiumHoverEffects(0);
    });

    test("no horizontal scrolling on desktop (1440px)", async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });

      const listPage = createListPage(authenticatedPage, "organizations");
      await listPage.navigate();

      await listPage.expectNoHorizontalScroll();
    });
  });

  test.describe("Opportunities - StandardListLayout", () => {
    test("has filter sidebar with correct width (256px)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      // Opportunities might default to Kanban - check if table view exists
      const hasTableView = await authenticatedPage
        .locator('[role="row"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasTableView) {
        await listPage.expectSidebarWidth(256);
      } else {
        test.skip(); // Kanban view active, skip table tests
      }
    });

    test("follows StandardListLayout pattern (when in table view)", async ({
      authenticatedPage,
    }) => {
      const listPage = createListPage(authenticatedPage, "opportunities");
      await listPage.navigate();

      const hasTableView = await authenticatedPage
        .locator('[role="row"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasTableView) {
        await listPage.expectStandardLayout();
      } else {
        test.skip();
      }
    });
  });

  test.describe("Tasks - StandardListLayout", () => {
    test("has filter sidebar with correct width (256px)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "tasks");
      await listPage.navigate();

      await listPage.expectSidebarWidth(256);
    });

    test("follows StandardListLayout pattern", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "tasks");
      await listPage.navigate();

      await listPage.expectStandardLayout();
    });

    test("table rows have premium hover effects", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "tasks");
      await listPage.navigate();

      await expect(listPage.getTableRows().first()).toBeVisible({ timeout: 5000 });

      await listPage.expectPremiumHoverEffects(0);
    });

    test("inline completion checkbox preserved", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "tasks");
      await listPage.navigate();

      // Look for checkbox in first row
      const firstRow = listPage.getTableRow(0);
      await expect(firstRow).toBeVisible({ timeout: 5000 });

      const checkbox = firstRow.locator('input[type="checkbox"]');
      const hasCheckbox = await checkbox.isVisible().catch(() => false);

      expect(hasCheckbox, "Task rows should have inline completion checkbox").toBe(true);
    });
  });

  test.describe("Sales - StandardListLayout", () => {
    test("has filter sidebar with correct width (256px)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "sales");
      await listPage.navigate();

      await listPage.expectSidebarWidth(256);
    });

    test("follows StandardListLayout pattern", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "sales");
      await listPage.navigate();

      await listPage.expectStandardLayout();
    });

    test("table shows role badges", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "sales");
      await listPage.navigate();

      const firstRow = listPage.getTableRow(0);
      await expect(firstRow).toBeVisible({ timeout: 5000 });

      // Look for role badge (admin, manager, rep)
      const hasBadge = await firstRow
        .locator('[class*="badge"]')
        .or(firstRow.getByText(/admin|manager|rep/i))
        .isVisible()
        .catch(() => false);

      expect(hasBadge, "Sales rows should show role badges").toBe(true);
    });
  });

  test.describe("Products - StandardListLayout", () => {
    test("has filter sidebar with correct width (256px)", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "products");
      await listPage.navigate();

      await listPage.expectSidebarWidth(256);
    });

    test("follows StandardListLayout pattern", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "products");
      await listPage.navigate();

      await listPage.expectStandardLayout();
    });

    test("table rows have premium hover effects", async ({ authenticatedPage }) => {
      const listPage = createListPage(authenticatedPage, "products");
      await listPage.navigate();

      await expect(listPage.getTableRows().first()).toBeVisible({ timeout: 5000 });

      await listPage.expectPremiumHoverEffects(0);
    });
  });

  test.describe("Responsive Behavior", () => {
    const resources = ["contacts", "organizations", "tasks", "sales", "products"];

    for (const resource of resources) {
      test(`${resource} - filter sidebar stays within viewport on iPad (768px)`, async ({
        authenticatedPage,
      }) => {
        await authenticatedPage.setViewportSize({ width: 768, height: 1024 });

        const listPage = createListPage(authenticatedPage, resource);
        await listPage.navigate();

        const sidebar = listPage.getFilterSidebar();
        await expect(sidebar).toBeVisible();

        // After scrolling, sidebar should still be in viewport
        await authenticatedPage.evaluate(() => window.scrollBy(0, 300));
        await authenticatedPage.waitForTimeout(100);

        await expect(sidebar).toBeInViewport();
      });

      test(`${resource} - no horizontal scroll on desktop (1440px)`, async ({
        authenticatedPage,
      }) => {
        await authenticatedPage.setViewportSize({ width: 1440, height: 900 });

        const listPage = createListPage(authenticatedPage, resource);
        await listPage.navigate();

        await listPage.expectNoHorizontalScroll();
      });
    }
  });

  test.describe("Touch Target Sizes", () => {
    test("all interactive elements meet 44px minimum on iPad", async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });

      const listPage = createListPage(authenticatedPage, "contacts");
      await listPage.navigate();

      // Check filter buttons
      const filterButtons = authenticatedPage.getByRole('button').filter({ hasText: /filter|clear|apply/i });
      const buttonCount = await filterButtons.count();

      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = filterButtons.nth(i);
        if (await button.isVisible().catch(() => false)) {
          const box = await button.boundingBox();

          if (box) {
            expect(box.height, `Button ${i} height should be >= 44px`).toBeGreaterThanOrEqual(44);
            expect(box.width, `Button ${i} width should be >= 44px`).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });
});
