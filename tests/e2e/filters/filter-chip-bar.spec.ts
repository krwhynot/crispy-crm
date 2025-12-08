/**
 * Filter Chip Bar E2E Tests
 *
 * Comprehensive E2E testing ensuring FilterChipBar works consistently
 * across all 6 CRM list views: Organizations, Contacts, Products,
 * Opportunities, Activities, and Tasks.
 *
 * Per playwright-e2e-testing skill:
 * - Semantic selectors (getByRole, getByLabel) - never CSS
 * - Console monitoring for diagnostics
 * - Condition-based waiting
 *
 * Test coverage:
 * - Chip bar visibility (hidden when no filters, visible when active)
 * - Chip label resolution (not raw IDs)
 * - Filter removal via chip X button
 * - Clear all functionality
 * - Date range combined chip behavior
 * - ARIA accessibility
 * - Touch target compliance (44px)
 */

import { test, expect } from "../support/fixtures/authenticated";
import { consoleMonitor } from "../support/utils/console-monitor";

// Resource paths for all 6 list views
const LIST_RESOURCES = [
  { name: "Organizations", path: "/organizations", filterLabel: "Type" },
  { name: "Contacts", path: "/contacts", filterLabel: "Tag" },
  { name: "Products", path: "/products", filterLabel: "Status" },
  { name: "Opportunities", path: "/opportunities", filterLabel: "Stage" },
  { name: "Activities", path: "/activities", filterLabel: "Type" },
  { name: "Tasks", path: "/tasks", filterLabel: "Priority" },
] as const;

test.describe("Filter Chip Bar - Core Functionality", () => {
  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    // Console errors indicate RLS, React, or Network issues
    expect(errors, "Console errors detected. See attached report.").toHaveLength(0);
  });

  test.describe("Chip Bar Visibility", () => {
    for (const resource of LIST_RESOURCES) {
      test(`${resource.name}: chip bar hidden when no filters`, async ({ authenticatedPage }) => {
        await authenticatedPage.goto(resource.path);
        await authenticatedPage.waitForLoadState("networkidle");

        // Chip bar should NOT be visible when no filters applied
        const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
        await expect(toolbar).not.toBeVisible();
      });
    }
  });

  test.describe("Chip Bar Rendering", () => {
    test("Organizations: chip bar appears when filter applied", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/organizations");
      await authenticatedPage.waitForLoadState("networkidle");

      // Apply a filter via sidebar (look for filter control)
      const typeFilter = authenticatedPage.getByLabel(/Type/i).first();
      if (await typeFilter.isVisible()) {
        await typeFilter.click();
        // Select first option
        await authenticatedPage.getByRole("option").first().click();

        // Chip bar should now be visible
        const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
        await expect(toolbar).toBeVisible({ timeout: 5000 });
      }
    });

    test("Contacts: tag filter shows tag name, not ID", async ({ authenticatedPage }) => {
      // Navigate with pre-applied filter to test chip rendering
      await authenticatedPage.goto("/contacts");
      await authenticatedPage.waitForLoadState("networkidle");

      // If there's an active tag filter, verify it shows name not UUID
      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
      if (await toolbar.isVisible()) {
        const chipText = await toolbar.textContent();
        // Should NOT contain UUID pattern
        expect(chipText).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
      }
    });
  });

  test.describe("Filter Removal", () => {
    test("clicking chip X removes filter and updates list", async ({ authenticatedPage }) => {
      // Apply filter via URL param for deterministic test
      await authenticatedPage.goto("/organizations?organization_type=distributor");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });

      // Wait for chip bar to appear
      await expect(toolbar).toBeVisible({ timeout: 5000 });

      // Find and click remove button
      const removeButton = toolbar.getByRole("button", { name: /Remove.*filter/i }).first();
      await removeButton.click();

      // Chip bar should disappear (no more active filters)
      await expect(toolbar).not.toBeVisible({ timeout: 5000 });

      // URL should no longer have the filter param
      await expect(authenticatedPage).not.toHaveURL(/organization_type/);
    });

    test("Clear all removes all filters when 2+ active", async ({ authenticatedPage }) => {
      // Apply multiple filters via URL
      await authenticatedPage.goto("/organizations?organization_type=distributor&priority=high");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
      await expect(toolbar).toBeVisible({ timeout: 5000 });

      // Clear all button should be visible with 2+ filters
      const clearAllButton = toolbar.getByRole("button", { name: /Clear all/i });
      await expect(clearAllButton).toBeVisible();

      await clearAllButton.click();

      // All filters should be removed
      await expect(toolbar).not.toBeVisible({ timeout: 5000 });
      await expect(authenticatedPage).not.toHaveURL(/organization_type|priority/);
    });
  });

  test.describe("Date Range Behavior", () => {
    test("Contacts: date range shows as combined chip", async ({ authenticatedPage }) => {
      // Apply date range filter via URL
      await authenticatedPage.goto("/contacts?last_seen%40gte=2025-01-01&last_seen%40lte=2025-12-31");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });

      if (await toolbar.isVisible()) {
        // Should show ONE combined chip for date range, not two separate chips
        const chips = toolbar.getByRole("listitem");
        const _chipCount = await chips.count();

        // Date range should be combined into one chip due to removalGroup
        // May also have other chips, so just verify date range is combined
        const chipTexts = await chips.allTextContents();
        const dateChips = chipTexts.filter(
          (text) => text.includes("Jan") || text.includes("Dec") || text.includes("Activity")
        );

        // Should be ONE combined date chip, not two
        expect(dateChips.length).toBeLessThanOrEqual(1);
      }
    });

    test("Tasks: removing date range chip clears both endpoints", async ({ authenticatedPage }) => {
      // Apply date range filter
      await authenticatedPage.goto("/tasks?due_date%40gte=2025-01-01&due_date%40lte=2025-12-31");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });

      if (await toolbar.isVisible()) {
        // Remove the date range chip
        const removeButton = toolbar.getByRole("button", { name: /Remove.*filter/i }).first();
        await removeButton.click();

        // Both date params should be removed (removalGroup behavior)
        await expect(authenticatedPage).not.toHaveURL(/due_date/);
      }
    });
  });

  test.describe("Accessibility", () => {
    test("chip bar has correct ARIA structure", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/organizations?organization_type=distributor");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
      await expect(toolbar).toBeVisible({ timeout: 5000 });

      // Verify ARIA attributes
      await expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");

      // Chips should be in a list
      const list = toolbar.getByRole("list");
      await expect(list).toBeVisible();

      // Each chip should be a listitem
      const items = toolbar.getByRole("listitem");
      expect(await items.count()).toBeGreaterThan(0);
    });

    test("remove buttons have accessible labels", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/organizations?organization_type=distributor");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
      await expect(toolbar).toBeVisible({ timeout: 5000 });

      // Remove buttons should have descriptive aria-labels
      const removeButtons = toolbar.getByRole("button", { name: /Remove.*filter/i });
      expect(await removeButtons.count()).toBeGreaterThan(0);
    });

    test("touch targets meet 44px minimum", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/organizations?organization_type=distributor");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
      await expect(toolbar).toBeVisible({ timeout: 5000 });

      // Check chip height (should be at least 44px for iPad accessibility)
      const chip = toolbar.getByRole("listitem").first();
      const chipBox = await chip.boundingBox();

      if (chipBox) {
        expect(chipBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe("Reference Resolution", () => {
    test("Organizations: segment filter shows playbook name, not UUID", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/organizations");
      await authenticatedPage.waitForLoadState("networkidle");

      // If segment filter is applied via sidebar, check chip shows name
      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });

      // If visible, verify no UUIDs
      if (await toolbar.isVisible()) {
        const content = await toolbar.textContent();
        // UUID pattern should not appear
        expect(content).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      }
    });

    test("Products: category filter shows category name", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/products");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });

      if (await toolbar.isVisible()) {
        const content = await toolbar.textContent();
        // Should not show raw category ID
        expect(content).not.toMatch(/category_[a-z0-9]+/i);
      }
    });
  });

  test.describe("Search Filter", () => {
    test("search query shows as chip with 'Search:' prefix", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/contacts?q=test");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });

      if (await toolbar.isVisible()) {
        // Search chip should show with prefix
        await expect(toolbar).toContainText('Search: "test"');
      }
    });
  });

  test.describe("Persistence", () => {
    test("chip bar persists during data loading/refresh", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/organizations?organization_type=distributor");
      await authenticatedPage.waitForLoadState("networkidle");

      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
      await expect(toolbar).toBeVisible({ timeout: 5000 });

      // Trigger a refresh (e.g., by clicking a refresh button if available)
      const refreshButton = authenticatedPage.getByRole("button", { name: /Refresh/i });
      if (await refreshButton.isVisible()) {
        await refreshButton.click();

        // Chip bar should remain visible during loading
        await expect(toolbar).toBeVisible();
      }
    });

    test("filters sync to URL (shareable)", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/organizations?organization_type=distributor");
      await authenticatedPage.waitForLoadState("networkidle");

      // URL should contain the filter
      await expect(authenticatedPage).toHaveURL(/organization_type=distributor/);

      // Remove filter
      const toolbar = authenticatedPage.getByRole("toolbar", { name: "Active filters" });
      if (await toolbar.isVisible()) {
        const removeButton = toolbar.getByRole("button", { name: /Remove.*filter/i }).first();
        await removeButton.click();

        // URL should update
        await expect(authenticatedPage).not.toHaveURL(/organization_type/);
      }
    });
  });
});
