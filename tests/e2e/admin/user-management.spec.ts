import { test, expect } from "@playwright/test";

/**
 * Admin User Management E2E Tests
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
test.describe("Admin User Management", () => {
  test.beforeEach(async ({ page }) => {
    // Uses admin auth fixture
    await page.goto("/");
    // Wait for dashboard to load
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("admin can access team management via profile dropdown", async ({ page }) => {
    // Open profile dropdown
    await page.getByRole("button", { name: /profile|avatar|user menu/i }).click();

    // Click Team Management link
    const teamLink = page.getByRole("menuitem", { name: /team management/i });
    await expect(teamLink).toBeVisible();
    await teamLink.click();

    // Verify navigation
    await expect(page).toHaveURL("/admin/users");
    await expect(page.getByRole("heading", { name: /team management/i })).toBeVisible();
  });

  test("admin can view list of team members", async ({ page }) => {
    await page.goto("/admin/users");

    // Verify datagrid is visible (wait for data to load)
    await expect(page.getByRole("grid")).toBeVisible({ timeout: 10000 });

    // Verify columns exist
    await expect(page.getByText("First Name")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
    await expect(page.getByText("Role")).toBeVisible();
  });

  test("admin can open invite team member dialog", async ({ page }) => {
    await page.goto("/admin/users");

    // Click invite button
    await page.getByRole("button", { name: /invite/i }).click();

    // Verify dialog opens
    await expect(page.getByRole("dialog").getByText("Invite Team Member")).toBeVisible();

    // Verify form fields exist
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel("Role")).toBeVisible();
  });

  test("admin can cancel invite dialog", async ({ page }) => {
    await page.goto("/admin/users");

    // Open dialog
    await page.getByRole("button", { name: /invite/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Verify dialog closes
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("admin can click on user row to edit", async ({ page }) => {
    await page.goto("/admin/users");

    // Wait for data to load
    await expect(page.getByRole("grid")).toBeVisible({ timeout: 10000 });

    // Click on first data row (skip header)
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Should navigate to edit view
    await expect(page).toHaveURL(/\/admin\/users\/\d+/);
    await expect(page.getByText("Edit Team Member")).toBeVisible();
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
