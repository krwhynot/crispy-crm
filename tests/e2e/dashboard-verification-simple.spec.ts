import { test } from "@playwright/test";

test("Capture authenticated dashboard with all 5 widgets", async ({ page }) => {
  console.log("Starting dashboard screenshot capture...");

  // Navigate to the app
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });

  // Wait for dashboard to fully load (checking for a widget to confirm we're authenticated)
  await page.waitForSelector('text=/PIPELINE SUMMARY|MY TASKS|RECENT ACTIVITY/i', {
    timeout: 10000,
  });

  console.log("✓ Dashboard loaded and authenticated");

  // Desktop view (1440x900)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-all-widgets-desktop-1440x900.png",
    fullPage: false,
  });
  console.log("✅ Desktop screenshot captured (1440x900)");

  // Full page desktop view
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-all-widgets-full-page.png",
    fullPage: true,
  });
  console.log("✅ Full page screenshot captured");

  // iPad Landscape (1024x768)
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-all-widgets-ipad-landscape.png",
    fullPage: false,
  });
  console.log("✅ iPad Landscape screenshot captured (1024x768)");

  // iPad Portrait (768x1024)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-all-widgets-ipad-portrait.png",
    fullPage: true,
  });
  console.log("✅ iPad Portrait screenshot captured (768x1024)");

  console.log("\n✅ All dashboard screenshots captured successfully!");
  console.log("Screenshots saved to: tests/e2e/screenshots/");
  console.log("Files:");
  console.log("  - dashboard-all-widgets-desktop-1440x900.png");
  console.log("  - dashboard-all-widgets-full-page.png");
  console.log("  - dashboard-all-widgets-ipad-landscape.png");
  console.log("  - dashboard-all-widgets-ipad-portrait.png");
});
