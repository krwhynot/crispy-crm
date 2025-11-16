import { test, expect } from "./support/fixtures/authenticated";

/**
 * Dashboard V2 - Screenshot Baseline Tests
 *
 * Captures masked screenshot baselines for visual regression testing:
 * 1. Desktop viewport (1440x900) - Primary development target
 * 2. iPad viewport (768x1024) - iPad-first responsive design verification
 * 3. Narrow desktop viewport (1024x768) - Breakpoint verification
 *
 * Masks dynamic content (dates, names, numbers) to prevent false failures.
 *
 * Part of Sprint 2 - Dashboard V2 UI/UX Acceptance Testing
 */

test.describe("Dashboard V2 - Screenshots", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V2
    await authenticatedPage.goto("/?layout=v2");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for all panels to load
    await authenticatedPage.getByRole("tree", { name: /opportunities hierarchy/i }).waitFor({ timeout: 5000 });
    await authenticatedPage.getByLabel("Tasks list").waitFor({ timeout: 5000 });

    // Wait for data to render (avoid "Loading..." states in screenshots)
    await authenticatedPage.waitForTimeout(1000);
  });

  test("desktop viewport (1440x900)", async ({ authenticatedPage }) => {
    await test.step("Set desktop viewport", async () => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });

      // Wait for resize to settle
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Capture masked screenshot", async () => {
      // Mask dynamic content to prevent false failures
      const maskedElements = [
        // Dates and timestamps
        authenticatedPage.locator('[data-testid="date"]'),
        authenticatedPage.locator('[data-testid="timestamp"]'),
        authenticatedPage.locator('time'),

        // User-specific content
        authenticatedPage.locator('[data-testid="user-name"]'),
        authenticatedPage.locator('[data-testid="user-avatar"]'),

        // Dynamic numbers (counts, metrics)
        authenticatedPage.locator('[data-testid="count"]'),
        authenticatedPage.locator('[data-testid="metric"]'),
      ];

      await expect(authenticatedPage).toHaveScreenshot("dashboard-v2-desktop.png", {
        mask: maskedElements,
        maxDiffPixels: 100, // Allow minor rendering differences
        timeout: 10000,
      });
    });
  });

  test("iPad viewport (768x1024)", async ({ authenticatedPage }) => {
    await test.step("Set iPad viewport", async () => {
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });

      // Wait for resize to settle
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Capture masked screenshot", async () => {
      const maskedElements = [
        authenticatedPage.locator('[data-testid="date"]'),
        authenticatedPage.locator('[data-testid="timestamp"]'),
        authenticatedPage.locator('time'),
        authenticatedPage.locator('[data-testid="user-name"]'),
        authenticatedPage.locator('[data-testid="user-avatar"]'),
        authenticatedPage.locator('[data-testid="count"]'),
        authenticatedPage.locator('[data-testid="metric"]'),
      ];

      await expect(authenticatedPage).toHaveScreenshot("dashboard-v2-ipad.png", {
        mask: maskedElements,
        maxDiffPixels: 100,
        timeout: 10000,
      });
    });
  });

  test("narrow desktop viewport (1024x768)", async ({ authenticatedPage }) => {
    await test.step("Set narrow desktop viewport", async () => {
      await authenticatedPage.setViewportSize({ width: 1024, height: 768 });

      // Wait for resize to settle
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Capture masked screenshot", async () => {
      const maskedElements = [
        authenticatedPage.locator('[data-testid="date"]'),
        authenticatedPage.locator('[data-testid="timestamp"]'),
        authenticatedPage.locator('time'),
        authenticatedPage.locator('[data-testid="user-name"]'),
        authenticatedPage.locator('[data-testid="user-avatar"]'),
        authenticatedPage.locator('[data-testid="count"]'),
        authenticatedPage.locator('[data-testid="metric"]'),
      ];

      await expect(authenticatedPage).toHaveScreenshot("dashboard-v2-narrow-desktop.png", {
        mask: maskedElements,
        maxDiffPixels: 100,
        timeout: 10000,
      });
    });
  });

  test("desktop with sidebar collapsed", async ({ authenticatedPage }) => {
    await test.step("Set desktop viewport and collapse sidebar", async () => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
      await authenticatedPage.waitForTimeout(300);

      // Collapse sidebar
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]');
      const toggleButton = sidebar.getByRole("button").first();

      if ((await toggleButton.count()) > 0) {
        await toggleButton.click();
        await authenticatedPage.waitForTimeout(300);
      }
    });

    await test.step("Capture screenshot with collapsed sidebar", async () => {
      const maskedElements = [
        authenticatedPage.locator('[data-testid="date"]'),
        authenticatedPage.locator('[data-testid="timestamp"]'),
        authenticatedPage.locator('time'),
        authenticatedPage.locator('[data-testid="user-name"]'),
        authenticatedPage.locator('[data-testid="user-avatar"]'),
        authenticatedPage.locator('[data-testid="count"]'),
        authenticatedPage.locator('[data-testid="metric"]'),
      ];

      await expect(authenticatedPage).toHaveScreenshot("dashboard-v2-desktop-sidebar-collapsed.png", {
        mask: maskedElements,
        maxDiffPixels: 100,
        timeout: 10000,
      });
    });
  });

  test("desktop with filters applied", async ({ authenticatedPage }) => {
    await test.step("Set desktop viewport and apply filters", async () => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
      await authenticatedPage.waitForTimeout(300);

      // Apply a health filter
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]');
      const activeCheckbox = sidebar.getByLabel(/active/i).first();

      if ((await activeCheckbox.count()) > 0) {
        await activeCheckbox.click();
        await authenticatedPage.waitForTimeout(500);
      }
    });

    await test.step("Capture screenshot with active filters", async () => {
      const maskedElements = [
        authenticatedPage.locator('[data-testid="date"]'),
        authenticatedPage.locator('[data-testid="timestamp"]'),
        authenticatedPage.locator('time'),
        authenticatedPage.locator('[data-testid="user-name"]'),
        authenticatedPage.locator('[data-testid="user-avatar"]'),
        authenticatedPage.locator('[data-testid="count"]'),
        authenticatedPage.locator('[data-testid="metric"]'),
      ];

      await expect(authenticatedPage).toHaveScreenshot("dashboard-v2-desktop-filtered.png", {
        mask: maskedElements,
        maxDiffPixels: 100,
        timeout: 10000,
      });
    });
  });

  test("desktop with slide-over open", async ({ authenticatedPage }) => {
    await test.step("Skip if no opportunities exist", async () => {
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      if ((await opportunityRow.count()) === 0) {
        test.skip();
      }
    });

    await test.step("Set desktop viewport and open slide-over", async () => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
      await authenticatedPage.waitForTimeout(300);

      // Ensure first customer is expanded
      const customerRow = authenticatedPage
        .locator('[role="treeitem"][aria-expanded]')
        .first();

      if ((await customerRow.count()) > 0) {
        const ariaExpanded = await customerRow.getAttribute("aria-expanded");
        if (ariaExpanded === "false") {
          await customerRow.click();
          await authenticatedPage.waitForTimeout(300);
        }
      }

      // Click opportunity to open slide-over
      const opportunityRow = authenticatedPage
        .locator('[role="treeitem"]:not([aria-expanded])')
        .first();

      await opportunityRow.click();
      await authenticatedPage.waitForTimeout(500);
    });

    await test.step("Capture screenshot with slide-over", async () => {
      const maskedElements = [
        authenticatedPage.locator('[data-testid="date"]'),
        authenticatedPage.locator('[data-testid="timestamp"]'),
        authenticatedPage.locator('time'),
        authenticatedPage.locator('[data-testid="user-name"]'),
        authenticatedPage.locator('[data-testid="user-avatar"]'),
        authenticatedPage.locator('[data-testid="count"]'),
        authenticatedPage.locator('[data-testid="metric"]'),
      ];

      await expect(authenticatedPage).toHaveScreenshot("dashboard-v2-desktop-slide-over.png", {
        mask: maskedElements,
        maxDiffPixels: 100,
        timeout: 10000,
      });
    });
  });
});
