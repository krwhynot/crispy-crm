import { test, expect } from "@playwright/test";

test.describe("Skip to Content Link", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should be the first focusable element on the page", async ({ page }) => {
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
  });

  test("should skip to main content when clicked", async ({ page }) => {
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();

    await skipLink.click();

    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("should skip to main content when activated with keyboard", async ({ page }) => {
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");

    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("should be visually hidden until focused", async ({ page }) => {
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    const isHidden = await skipLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.position === "absolute" &&
        (styles.left === "-10000px" ||
          styles.transform.includes("translateX(-100%)") ||
          styles.clip === "rect(0px, 0px, 0px, 0px)")
      );
    });

    expect(isHidden).toBe(true);

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();

    const isVisible = await skipLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.position !== "absolute" || styles.left !== "-10000px";
    });

    expect(isVisible).toBe(true);
  });
});
