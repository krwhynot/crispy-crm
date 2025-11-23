import { test, expect } from "./support/fixtures/authenticated";
import { loadMigrationStatus } from "./support/utils/migration-status";

/**
 * Design System Smoke Tests
 *
 * Fail-fast basic checks for design system compliance. These tests verify that
 * critical design system elements are present but don't enforce full contracts.
 *
 * Philosophy (Engineering Constitution):
 * - Fail fast - no fallback selectors
 * - Deterministic selectors only (data-testid, role="dialog", etc.)
 * - Check basic structure, not full behavior
 * - Fast execution (< 30s total)
 * - Tests will fail on unmigrated components (expected)
 *
 * Difference from Contract Tests:
 * - Smoke: Checks presence of key elements (sidebar exists, form has buttons)
 * - Contract: Enforces full behavior (sidebar is 256px, focus trap works)
 *
 * Run: npx playwright test tests/e2e/design-system-smoke.spec.ts
 * Skip unmigrated: Use migration-status.json flags (future enhancement)
 */

const RESOURCES = ["contacts", "organizations", "opportunities", "tasks", "sales", "products"];

test.describe("Design System Smoke Tests", () => {
  test.beforeAll(() => {
    const status = loadMigrationStatus();
    console.log(`\n📊 Migration Status (${status.lastUpdated}):`);
    console.log(
      `  List Layout: ${status.patterns.listLayout.migrated}/${status.patterns.listLayout.totalResources} migrated`
    );
    console.log(
      `  Slide-Over: ${status.patterns.slideOver.migrated}/${status.patterns.slideOver.totalResources} migrated`
    );
    console.log(
      `  Create Form: ${status.patterns.createForm.migrated}/${status.patterns.createForm.totalResources} migrated\n`
    );
  });

  test.describe("List Pages - Component Existence", () => {
    for (const resource of RESOURCES) {
      test(`${resource} list page loads without errors`, async ({ authenticatedPage }) => {
        await authenticatedPage.goto(`/#/${resource}`);
        await authenticatedPage.waitForLoadState("networkidle");

        // Fail fast: Expect design system selectors only
        const filterSidebar = authenticatedPage.locator('[data-testid="filter-sidebar"]');
        await expect(filterSidebar).toBeVisible({ timeout: 5000 });

        // Main content area must exist
        const mainArea = authenticatedPage.locator('[role="main"]').first();
        await expect(mainArea).toBeVisible();

        // Table must have tbody structure (design system requirement)
        const tbody = authenticatedPage.locator("tbody");
        await expect(tbody).toBeVisible();
      });
    }
  });

  test.describe("Create Forms - Basic Structure", () => {
    for (const resource of RESOURCES.filter((r) => r !== "sales")) {
      // Sales doesn't have public create
      test(`${resource} create form renders`, async ({ authenticatedPage }) => {
        await authenticatedPage.goto(`/#/${resource}/create`);
        await authenticatedPage.waitForLoadState("networkidle");

        // Fail fast: Form must exist
        const form = authenticatedPage.locator("form").first();
        await expect(form).toBeVisible({ timeout: 5000 });

        // Design system requires "Save & Close" button (not just "Save")
        const saveButton = authenticatedPage.getByRole("button", { name: /save.*close/i });
        await expect(saveButton).toBeVisible();

        // Cancel button required
        const cancelButton = authenticatedPage.getByRole("button", { name: /cancel/i });
        await expect(cancelButton).toBeVisible();
      });
    }
  });

  test.describe("Show/Edit Pages - Detail Views", () => {
    for (const resource of RESOURCES) {
      test(`${resource} show page renders for ID 1`, async ({ authenticatedPage }) => {
        await authenticatedPage.goto(`/#/${resource}/1/show`);
        await authenticatedPage.waitForLoadState("networkidle");

        // Fail fast: Design system requires slide-over with role="dialog"
        const slideOver = authenticatedPage.locator('[role="dialog"]');
        await expect(slideOver).toBeVisible({ timeout: 5000 });

        // Edit button must exist within slide-over
        const editButton = slideOver.getByRole("button", { name: /edit/i });
        await expect(editButton).toBeVisible();
      });
    }
  });

  test.describe("Navigation - Global Menu", () => {
    test("all resource links present in nav", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/#/");
      await authenticatedPage.waitForLoadState("networkidle");

      for (const resource of RESOURCES) {
        const navLink = authenticatedPage.getByRole("link", {
          name: new RegExp(resource, "i"),
        });

        await expect(navLink, `${resource} link should be in nav`).toBeVisible();
      }
    });

    test("navigation preserves auth state", async ({ authenticatedPage }) => {
      // Navigate through multiple resources
      for (const resource of RESOURCES.slice(0, 3)) {
        await authenticatedPage.goto(`/#/${resource}`);
        await authenticatedPage.waitForLoadState("networkidle");

        // Should not redirect to login
        const url = authenticatedPage.url();
        expect(url).not.toContain("/login");
        expect(url).toContain(`/#/${resource}`);
      }
    });
  });

  test.describe("Console Errors - Regression Detection", () => {
    test("no React errors on contacts list", async ({ authenticatedPage }) => {
      const errors: string[] = [];

      authenticatedPage.on("pageerror", (error) => {
        errors.push(error.message);
      });

      authenticatedPage.on("console", (msg) => {
        if (msg.type() === "error") {
          // Filter out known non-critical errors
          const text = msg.text();
          if (
            !text.includes("504") && // Vite HMR errors
            !text.includes("Outdated Optimize Dep") &&
            !text.includes("Failed to load resource")
          ) {
            errors.push(text);
          }
        }
      });

      await authenticatedPage.goto("/#/contacts");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.waitForTimeout(2000); // Let console settle

      // Only fail on actual React/app errors
      const criticalErrors = errors.filter(
        (e) => e.includes("React") || e.includes("Uncaught") || e.includes("TypeError")
      );

      if (criticalErrors.length > 0) {
        console.error("Critical console errors detected:", criticalErrors);
      }

      expect(criticalErrors, "Should have no critical console errors").toHaveLength(0);
    });
  });

  test.describe("Responsive Behavior - Basic Checks", () => {
    test("contacts list renders on iPad viewport", async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
      await authenticatedPage.goto("/#/contacts");
      await authenticatedPage.waitForLoadState("networkidle");

      // Check content is visible (not hidden overflow)
      const main = authenticatedPage.locator('[role="main"]').first();
      await expect(main).toBeVisible();

      // No horizontal scroll
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(768 + 10); // 10px tolerance
    });

    test("contacts list renders on desktop viewport", async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
      await authenticatedPage.goto("/#/contacts");
      await authenticatedPage.waitForLoadState("networkidle");

      const main = authenticatedPage.locator('[role="main"]').first();
      await expect(main).toBeVisible();

      // No horizontal scroll
      const bodyWidth = await authenticatedPage.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(1440 + 10);
    });
  });

  test.describe("Accessibility - Basic ARIA", () => {
    test("contacts list has main landmark", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/#/contacts");
      await authenticatedPage.waitForLoadState("networkidle");

      const main = authenticatedPage.locator('[role="main"]');
      await expect(main).toBeVisible();
    });

    test("navigation has nav landmark", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/#/");
      await authenticatedPage.waitForLoadState("networkidle");

      const nav = authenticatedPage
        .locator("nav")
        .or(authenticatedPage.locator('[role="navigation"]'));
      await expect(nav).toBeVisible();
    });

    test("forms have accessible labels", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/#/contacts/create");
      await authenticatedPage.waitForLoadState("networkidle");

      // Check for labeled inputs
      const labeledInputs = authenticatedPage.locator("input[aria-label], input[id]");
      const count = await labeledInputs.count();

      expect(count, "Create form should have labeled inputs").toBeGreaterThan(0);
    });
  });
});
