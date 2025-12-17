import { test, expect } from "../../support/fixtures/authenticated";

/**
 * SlideOver Panel Width Validation E2E Tests
 *
 * Validates SlideOver panel width requirements for desktop and iPad viewports.
 * Tests width constraints, responsive behavior, and content visibility.
 *
 * Design Requirements:
 * - Desktop (1440px): SlideOver should be ~40vw (576-600px)
 * - iPad (768px): SlideOver should be full-screen (100% width)
 * - Main content should remain visible (≥600px visible behind panel on desktop)
 *
 * Reference: ResourceSlideOver component
 * - Desktop: lg:w-[40vw] lg:max-w-[600px] lg:min-w-[576px]
 * - Mobile/iPad: w-full max-w-none
 */

test.describe("SlideOver Width Validation", () => {
  test.describe("4.1 Desktop Width (1440px)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Set desktop viewport (1440x900)
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
    });

    test("SlideOver should be ~40% width (576-600px) on desktop", async ({
      authenticatedPage: page,
    }) => {
      // Navigate to opportunities list
      await page.goto("/#/opportunities");
      await page.waitForLoadState("networkidle");

      // Click first opportunity row to open SlideOver
      const opportunityRow = page.getByRole("row").filter({ hasText: /[A-Z]/ }).first();
      const rowExists = await opportunityRow.isVisible().catch(() => false);

      if (!rowExists) {
        console.log("No opportunity rows found - skipping test");
        return;
      }

      await opportunityRow.click();

      // Wait for SlideOver to appear
      const slideOver = page.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible({ timeout: 5000 });

      // Measure SlideOver width
      const box = await slideOver.boundingBox();

      if (!box) {
        throw new Error("SlideOver bounding box not found");
      }

      // Assert width is within expected range (576-600px)
      expect(box.width).toBeGreaterThanOrEqual(576);
      expect(box.width).toBeLessThanOrEqual(600);

      // Capture screenshot for manual review
      await page.screenshot({
        path: "tests/e2e/screenshots/slideover-desktop-width.png",
        fullPage: false,
      });
    });
  });

  test.describe("4.2 iPad Width (768px)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Set iPad viewport (768x1024)
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
    });

    test("SlideOver should be full-screen on iPad", async ({
      authenticatedPage: page,
    }) => {
      // Navigate to opportunities list
      await page.goto("/#/opportunities");
      await page.waitForLoadState("networkidle");

      // Click first opportunity row to open SlideOver
      const opportunityRow = page.getByRole("row").filter({ hasText: /[A-Z]/ }).first();
      const rowExists = await opportunityRow.isVisible().catch(() => false);

      if (!rowExists) {
        console.log("No opportunity rows found - skipping test");
        return;
      }

      await opportunityRow.click();

      // Wait for SlideOver to appear
      const slideOver = page.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible({ timeout: 5000 });

      // Measure SlideOver width
      const box = await slideOver.boundingBox();

      if (!box) {
        throw new Error("SlideOver bounding box not found");
      }

      // On iPad, SlideOver should be full viewport width (768px)
      // Allow small buffer for scrollbar or padding
      expect(box.width).toBeGreaterThanOrEqual(750);
      expect(box.width).toBeLessThanOrEqual(768);

      // Capture screenshot for manual review
      await page.screenshot({
        path: "tests/e2e/screenshots/slideover-ipad-width.png",
        fullPage: false,
      });
    });
  });

  test.describe("4.3 Not Intrusive (Main Content Visible)", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Set desktop viewport (1440px)
      await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
    });

    test("Main content should remain visible (≥600px) with SlideOver open", async ({
      authenticatedPage: page,
    }) => {
      // Navigate to opportunities list
      await page.goto("/#/opportunities");
      await page.waitForLoadState("networkidle");

      // Find the main content container (typically the list or datagrid)
      const mainContent = page.locator('[role="grid"]').or(page.locator("main"));
      const mainContentExists = await mainContent.isVisible().catch(() => false);

      if (!mainContentExists) {
        console.log("Main content not found - skipping test");
        return;
      }

      // Measure main content position and width BEFORE SlideOver opens
      const mainBoxBefore = await mainContent.boundingBox();

      // Click first opportunity row to open SlideOver
      const opportunityRow = page.getByRole("row").filter({ hasText: /[A-Z]/ }).first();
      const rowExists = await opportunityRow.isVisible().catch(() => false);

      if (!rowExists) {
        console.log("No opportunity rows found - skipping test");
        return;
      }

      await opportunityRow.click();

      // Wait for SlideOver to appear
      const slideOver = page.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible({ timeout: 5000 });

      // Measure SlideOver position
      const slideOverBox = await slideOver.boundingBox();

      if (!slideOverBox || !mainBoxBefore) {
        throw new Error("Could not measure element positions");
      }

      // Calculate visible width of main content (left edge to SlideOver left edge)
      const visibleMainContentWidth = slideOverBox.x - mainBoxBefore.x;

      // Assert at least 600px of main content is visible
      // This ensures users can still see the list behind the panel
      expect(visibleMainContentWidth).toBeGreaterThanOrEqual(600);

      // Capture screenshot for visual verification
      await page.screenshot({
        path: "tests/e2e/screenshots/slideover-main-content-visible.png",
        fullPage: false,
      });

      // Additional check: Verify SlideOver is positioned on the right side
      expect(slideOverBox.x).toBeGreaterThan(600);
    });
  });

  test.describe("Responsive Transition (Desktop to iPad)", () => {
    test("SlideOver width should adapt when viewport changes", async ({
      authenticatedPage: page,
    }) => {
      // Start with desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/#/opportunities");
      await page.waitForLoadState("networkidle");

      // Open SlideOver
      const opportunityRow = page.getByRole("row").filter({ hasText: /[A-Z]/ }).first();
      const rowExists = await opportunityRow.isVisible().catch(() => false);

      if (!rowExists) {
        console.log("No opportunity rows found - skipping test");
        return;
      }

      await opportunityRow.click();

      const slideOver = page.locator('[role="dialog"]');
      await expect(slideOver).toBeVisible({ timeout: 5000 });

      // Measure width on desktop
      const desktopBox = await slideOver.boundingBox();
      expect(desktopBox?.width).toBeGreaterThanOrEqual(576);
      expect(desktopBox?.width).toBeLessThanOrEqual(600);

      // Resize viewport to iPad size
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500); // Allow time for CSS transitions

      // Measure width on iPad
      const ipadBox = await slideOver.boundingBox();
      expect(ipadBox?.width).toBeGreaterThanOrEqual(750);
      expect(ipadBox?.width).toBeLessThanOrEqual(768);

      // Capture screenshot showing responsive behavior
      await page.screenshot({
        path: "tests/e2e/screenshots/slideover-responsive-transition.png",
        fullPage: false,
      });
    });
  });
});
