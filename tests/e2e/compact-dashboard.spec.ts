import { test, expect } from "@playwright/test";

test.describe("Compact Dashboard Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/");
    // Login if needed
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForSelector("text=Principal Dashboard", { timeout: 10000 });
  });

  test("all widgets visible at 1440px without scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Check header is visible
    await expect(page.getByText("Principal Dashboard")).toBeVisible();

    // Check main layout components
    await expect(page.getByText("My Principals")).toBeVisible();
    await expect(page.getByText("My Tasks This Week")).toBeVisible();

    // Verify no scrolling is needed - all content fits in viewport
    const mainContent = page.locator(".min-h-screen");
    const contentBox = await mainContent.boundingBox();

    if (contentBox) {
      expect(contentBox.height).toBeLessThanOrEqual(900);
    }
  });

  test("responsive layout at iPad portrait (768px)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Should display content without horizontal scrolling
    const grid = page.locator(".grid").first();
    await expect(grid).toBeVisible();

    // Verify no horizontal overflow
    const gridBox = await grid.boundingBox();
    expect(gridBox?.width).toBeLessThanOrEqual(768);
  });

  test("responsive layout at desktop (1440px) shows 3-column grid", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Principal table should be on left
    const principalTable = page.getByText("My Principals");
    const tableBox = await principalTable.boundingBox();
    expect(tableBox?.x).toBeLessThan(600); // Left side

    // Tasks widget should be in middle-right
    const tasksWidget = page.getByText("My Tasks This Week");
    const tasksBox = await tasksWidget.boundingBox();
    expect(tasksBox?.x).toBeGreaterThan(600); // Right side
  });

  test("header remains compact at all viewport sizes", async ({ page }) => {
    const header = page.locator("div").filter({ hasText: "Principal Dashboard - Week of" }).first();

    // Test at mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const headerBoxMobile = await header.boundingBox();

    // Test at desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    const headerBoxDesktop = await header.boundingBox();

    // Header height should remain consistent (compact)
    if (headerBoxMobile && headerBoxDesktop) {
      expect(Math.abs(headerBoxMobile.height - headerBoxDesktop.height)).toBeLessThan(10);
    }
  });
});
