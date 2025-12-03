import { test, expect } from "@playwright/test";

test.describe("Skip to Content Link", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should be visible when focused via keyboard", async ({ page }) => {
    // Focus the skip link directly
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    // Verify the skip link exists in the DOM
    await expect(skipLink).toBeAttached();

    // Focus it directly and verify it becomes visible
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test("should skip to main content when clicked", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    // Focus and click the skip link
    await skipLink.focus();
    await skipLink.click();

    // Verify main content receives focus
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("should skip to main content when activated with keyboard", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    // Focus the skip link
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    // Activate with Enter key
    await page.keyboard.press("Enter");

    // Verify main content receives focus
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("should be visually hidden until focused", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    // Check it's hidden by default (sr-only uses clip)
    const initialBoundingBox = await skipLink.boundingBox();
    // sr-only elements have 1x1 or 0x0 bounding box due to clip
    expect(initialBoundingBox?.width).toBeLessThanOrEqual(1);
    expect(initialBoundingBox?.height).toBeLessThanOrEqual(1);

    // Focus the skip link
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    // Should now be visible with a real bounding box
    const focusedBoundingBox = await skipLink.boundingBox();
    expect(focusedBoundingBox?.width).toBeGreaterThan(50);
    expect(focusedBoundingBox?.height).toBeGreaterThan(20);
  });
});
