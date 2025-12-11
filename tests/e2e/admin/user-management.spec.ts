import { test, expect } from "@playwright/test";

/**
 * Team Management E2E Tests (Consolidated to /sales)
 *
 * UPDATED 2025-12-11: Tests now target /sales resource after consolidation.
 * Previously targeted /admin/users which now redirects to /sales.
 *
 * Follows playwright-e2e-testing skill requirements:
 * - Semantic selectors (getByRole, getByLabel, getByText)
 * - Condition-based waiting (no waitForTimeout)
 * - Page Object Models where applicable
 *
 * Prerequisites:
 * - Admin user auth fixture at tests/e2e/.auth/user.json
 * - Local Supabase running with seed data
 */
test.describe("Team Management (Sales Resource)", () => {
  test.beforeEach(async ({ page }) => {
    // Uses admin auth fixture
    await page.goto("/");
    // Wait for dashboard to load - use first() to avoid strict mode violation
    // (page has two nav elements: sidebar nav and header nav)
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("admin can access team management via profile dropdown", async ({ page }) => {
    // Open profile dropdown
    await page.getByRole("button", { name: /profile|avatar|user menu/i }).click();

    // Click Team Management link (may be labeled "Team" or "Sales")
    const teamLink = page.getByRole("menuitem", { name: /team|sales/i });
    await expect(teamLink).toBeVisible();
    await teamLink.click();

    // Verify navigation to consolidated /sales route
    await expect(page).toHaveURL("/sales");
  });

  test("admin can view list of team members", async ({ page }) => {
    // Navigate directly to /sales (consolidated team management)
    await page.goto("/sales");

    // Verify datagrid is visible (wait for data to load)
    await expect(page.getByRole("grid")).toBeVisible({ timeout: 10000 });

    // Verify columns exist
    await expect(page.getByText("First Name")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
    await expect(page.getByText("Role")).toBeVisible();
  });

  test("admin can navigate to create team member form", async ({ page }) => {
    await page.goto("/sales");

    // Click create/invite button
    await page.getByRole("link", { name: /create|invite|add/i }).click();

    // Verify navigation to create form
    await expect(page).toHaveURL("/sales/create");

    // Verify form fields exist
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
  });

  test("admin can click on user row to open SlideOver", async ({ page }) => {
    await page.goto("/sales");

    // Wait for data to load
    await expect(page.getByRole("grid")).toBeVisible({ timeout: 10000 });

    // Click on first data row (skip header)
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Should open SlideOver with ?view= query param
    await expect(page).toHaveURL(/\/sales\?view=\d+/);

    // SlideOver should be visible with edit form
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  /**
   * NOTE: Non-admin access control tests require a rep user auth fixture.
   *
   * To set up rep user fixture:
   * 1. Add to auth.setup.ts:
   *    setup('authenticate as rep', async ({ page }) => {
   *      const loginPage = new LoginPage(page);
   *      await loginPage.loginAsRep(); // needs LoginPage update
   *      await page.context().storageState({ path: 'tests/e2e/.auth/rep-user.json' });
   *    });
   *
   * 2. Add LoginPage.loginAsRep() method
   * 3. Create test file with:
   *    test.use({ storageState: 'tests/e2e/.auth/rep-user.json' });
   */
});
