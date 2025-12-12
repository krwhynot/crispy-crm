import { test, expect } from "@playwright/test";

/**
 * Admin Route Redirect Verification Tests
 *
 * Created 2025-12-11: Verifies legacy /admin/users routes properly redirect
 * to consolidated /sales resource after interface consolidation.
 *
 * These tests ensure backward compatibility for:
 * - Bookmarked URLs
 * - External links
 * - Profile dropdown navigation (Settings → Team)
 */
test.describe("Admin Route Redirects", () => {
  test.beforeEach(async ({ page }) => {
    // Uses admin auth fixture
    await page.goto("/");
    // Wait for dashboard to load - use first() to avoid strict mode violation
    // (page has two nav elements: sidebar nav and header nav)
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("/admin/users redirects to /sales", async ({ page }) => {
    // Navigate to legacy route (React Admin uses hash router: /#/path)
    await page.goto("/#/admin/users");

    // Should redirect to consolidated /sales route
    await expect(page).toHaveURL(/#\/sales$/);

    // Verify content loads correctly (SalesList uses <table>)
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });
  });

  test("/admin/users/:id redirects to /sales?view=:id", async ({ page }) => {
    // First get a valid sales ID from the list (React Admin uses hash router)
    await page.goto("/#/sales");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });

    // Click first row's first cell (First Name column) to get a valid ID
    // IMPORTANT: Must click cell without interactive elements (email links intercept clicks)
    const firstDataRow = page.getByRole("row").nth(1);
    const firstNameCell = firstDataRow.getByRole("cell").first();
    await firstNameCell.click();

    // Wait for SlideOver to open first (pushState doesn't trigger navigation events)
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Now extract the ID from the URL (hash router format: /#/sales?view=123)
    await page.waitForURL(/\/#\/sales\?view=(\d+)/, { timeout: 5000 });
    const url = page.url();
    const idMatch = url.match(/view=(\d+)/);
    const salesId = idMatch ? idMatch[1] : "1";

    // Now test the legacy route redirect
    await page.goto(`/#/admin/users/${salesId}`);

    // Should redirect to /sales?view=:id (hash router format)
    // Wait for redirect and SlideOver to load
    await page.waitForURL(new RegExp(`#/sales\\?view=${salesId}`), { timeout: 10000 });

    // SlideOver should be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
  });

  test("Settings Team tab redirects to /sales", async ({ page }) => {
    // Navigate to Settings page (hash router format)
    await page.goto("/#/settings");

    // Look for Team tab and click it
    const teamTab = page.getByRole("tab", { name: /team/i });

    // If Team tab exists, clicking it should redirect to /sales
    if (await teamTab.isVisible()) {
      await teamTab.click();

      // Should redirect to /sales (hash router format)
      await expect(page).toHaveURL(/#\/sales$/);
    }
  });
});
