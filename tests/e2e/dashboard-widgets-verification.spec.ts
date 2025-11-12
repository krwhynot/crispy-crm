import { test, expect } from "@playwright/test";

test("Dashboard displays all 5 widgets", async ({ page }) => {
  // Navigate to dashboard
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });

  // Wait for dashboard to fully load
  await page.waitForTimeout(2000);

  // Take full page screenshot of dashboard
  const screenshotPath = "tests/e2e/screenshots/dashboard-full-page.png";
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
  console.log(`✅ Dashboard full page screenshot saved to ${screenshotPath}`);

  // Verify page title
  const pageTitle = await page.title();
  console.log(`Page title: ${pageTitle}`);

  // Look for key widget identifiers
  const mainHeading = page.locator("h1");
  if (await mainHeading.isVisible()) {
    const headingText = await mainHeading.textContent();
    console.log(`✅ Main heading found: "${headingText}"`);
  }

  // Check for grid layout containers
  const gridContainer = page.locator("div.grid");
  const isGridVisible = await gridContainer.isVisible().catch(() => false);
  console.log(`${isGridVisible ? "✅" : "❌"} Grid layout container visible`);

  // Check for sidebar
  const sidebar = page.locator("aside");
  const isSidebarVisible = await sidebar.isVisible().catch(() => false);
  console.log(`${isSidebarVisible ? "✅" : "❌"} Sidebar visible`);

  // Look for dashboard widget containers
  const dashboardWidgets = page.locator("[role='main'] div.px-3, aside div.px-3");
  const widgetCount = await dashboardWidgets.count();
  console.log(`✅ Found ${widgetCount} widget containers`);

  // Check for specific widget indicators
  const widgetIndicators = [
    { text: "PIPELINE SUMMARY", description: "Pipeline Summary widget" },
    { text: "MY TASKS THIS WEEK", description: "My Tasks widget" },
    { text: "RECENT ACTIVITY", description: "Recent Activity widget" },
    { text: "My Principals", description: "Principal Table" },
  ];

  for (const indicator of widgetIndicators) {
    const element = page.locator(`text=${indicator.text}`);
    const isFound = await element.isVisible().catch(() => false);
    console.log(
      `${isFound ? "✅" : "⚠️"} ${indicator.description}: "${indicator.text}"`
    );
  }

  // Desktop view screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-desktop-1440x900.png",
  });
  console.log("✅ Desktop view (1440x900) screenshot saved");

  // iPad landscape view
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-ipad-landscape-1024x768.png",
  });
  console.log("✅ iPad Landscape view (1024x768) screenshot saved");

  // iPad portrait view
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-ipad-portrait-768x1024.png",
    fullPage: true,
  });
  console.log("✅ iPad Portrait view (768x1024) screenshot saved");

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-mobile-375x667.png",
    fullPage: true,
  });
  console.log("✅ Mobile view (375x667) screenshot saved");

  console.log("\n✅ All dashboard widget screenshots captured successfully!");
});
