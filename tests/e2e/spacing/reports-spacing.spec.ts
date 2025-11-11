import { test, expect } from "@playwright/test";

test.describe("Reports Spacing Visual Regression", () => {
  // Tests use storage state for authentication (see playwright.config.ts)
  // No manual login needed

  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "ipad-portrait", width: 768, height: 1024 },
    { name: "ipad-landscape", width: 1024, height: 768 },
    { name: "desktop", width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`OpportunitiesByPrincipal renders correctly on ${viewport.name}`, async ({
      page,
    }, testInfo) => {
      // Only run on chromium project to avoid duplicate snapshots
      test.skip(testInfo.project.name !== "chromium", "Run only on chromium");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/reports/opportunities-by-principal");

      // Wait for content to load
      await page.waitForSelector("h1", { state: "visible" });

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

      // Visual snapshot
      await expect(page).toHaveScreenshot(`opportunities-by-principal-${viewport.name}.png`);
    });

    test(`WeeklyActivitySummary renders correctly on ${viewport.name}`, async ({
      page,
    }, testInfo) => {
      // Only run on chromium project to avoid duplicate snapshots
      test.skip(testInfo.project.name !== "chromium", "Run only on chromium");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/reports/weekly-activity-summary");

      await page.waitForSelector("h1", { state: "visible" });

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

      await expect(page).toHaveScreenshot(`weekly-activity-summary-${viewport.name}.png`);
    });
  }
});
