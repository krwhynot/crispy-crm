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
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("/admin/users redirects to /sales", async ({ page }) => {
    // Navigate to legacy route
    await page.goto("/admin/users");

    // Should redirect to consolidated /sales route
    await expect(page).toHaveURL("/sales");

    // Verify content loads correctly
    await expect(page.getByRole("grid")).toBeVisible({ timeout: 10000 });
  });

  test("/admin/users/:id redirects to /sales?view=:id", async ({ page }) => {
    // First get a valid sales ID from the list
    await page.goto("/sales");
    await expect(page.getByRole("grid")).toBeVisible({ timeout: 10000 });

    // Click first row to get a valid ID
    const firstRow = page.getByRole("row").nth(1);
    await firstRow.click();

    // Extract the ID from the URL
    await expect(page).toHaveURL(/\/sales\?view=(\d+)/);
    const url = page.url();
    const idMatch = url.match(/view=(\d+)/);
    const salesId = idMatch ? idMatch[1] : "1";

    // Now test the legacy route redirect
    await page.goto(`/admin/users/${salesId}`);

    // Should redirect to /sales?view=:id
    await expect(page).toHaveURL(`/sales?view=${salesId}`);

    // SlideOver should be visible
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Settings Team tab redirects to /sales", async ({ page }) => {
    // Navigate to Settings page
    await page.goto("/settings");

    // Look for Team tab and click it
    const teamTab = page.getByRole("tab", { name: /team/i });

    // If Team tab exists, clicking it should redirect to /sales
    if (await teamTab.isVisible()) {
      await teamTab.click();

      // Should redirect to /sales
      await expect(page).toHaveURL("/sales");
    }
  });
});
