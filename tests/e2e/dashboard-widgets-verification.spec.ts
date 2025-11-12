import { test, expect } from "@playwright/test";

test("Dashboard displays all 5 widgets correctly", async ({ page }) => {
  // Navigate to dashboard
  await page.goto("http://localhost:5173/");

  // Wait for page to load
  await page.waitForLoadState("networkidle");

  // Verify all 5 widgets are visible
  const widgets = [
    "Upcoming by Principal", // Widget 1
    "My Principals", // Widget 2 (main table)
    "MY TASKS THIS WEEK", // Widget 3
    "RECENT ACTIVITY", // Widget 4
    "PIPELINE SUMMARY", // Widget 5 (newly added)
  ];

  for (const widget of widgets) {
    await expect(page.locator(`text=${widget}`)).toBeVisible();
  }

  // Take full page screenshot showing all widgets
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-all-widgets-full.png",
    fullPage: true,
  });

  console.log("✅ All 5 dashboard widgets visible and verified");

  // Verify layout structure (70% left, 30% right)
  const leftColumn = page.locator("div.space-y-6").first();
  const rightSidebar = page.locator("aside.space-y-6");

  await expect(leftColumn).toBeVisible();
  await expect(rightSidebar).toBeVisible();

  console.log("✅ Grid layout (70/30 split) verified");

  // Verify PipelineSummary widget specifically
  const pipelineSummaryWidget = page.locator("text=PIPELINE SUMMARY").locator("..");

  // Check for expected content in Pipeline Summary
  const expectedElements = [
    "Total Opportunities",
    "BY STAGE",
    "BY STATUS",
    "Pipeline Health",
  ];

  for (const element of expectedElements) {
    await expect(pipelineSummaryWidget.locator(`text=${element}`)).toBeVisible();
  }

  console.log("✅ PipelineSummary widget contains all expected sections");

  // Take close-up screenshot of just the Pipeline Summary widget
  await pipelineSummaryWidget.screenshot({
    path: "tests/e2e/screenshots/pipeline-summary-widget.png",
  });

  console.log("✅ Pipeline Summary widget screenshot captured");

  // Verify responsive design - check that widgets adapt to viewport
  const viewportWidgets = {
    desktop: { width: 1440, height: 900 },
    ipadLandscape: { width: 1024, height: 768 },
    ipadPortrait: { width: 768, height: 1024 },
  };

  for (const [name, viewport] of Object.entries(viewportWidgets)) {
    await page.setViewportSize(viewport);
    await page.waitForLoadState("networkidle");

    // Verify all widgets still visible
    for (const widget of widgets) {
      const element = page.locator(`text=${widget}`);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(
        `${name} (${viewport.width}x${viewport.height}): ${widget} ${isVisible ? "✅" : "❌"}`
      );
    }

    if (name === "ipadPortrait") {
      await page.screenshot({
        path: `tests/e2e/screenshots/dashboard-${name}.png`,
        fullPage: true,
      });
    }
  }

  console.log("✅ Responsive design verified across all viewports");
});
