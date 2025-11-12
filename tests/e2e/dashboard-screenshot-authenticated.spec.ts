import { test } from "@playwright/test";

test("Capture authenticated dashboard with all 5 widgets", async ({ page }) => {
  // Navigate to the app
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });

  // Wait for login page to load
  await page.waitForTimeout(1000);

  // Fill in login credentials
  await page.fill('input[type="email"]', "admin@test.com");
  await page.fill('input[type="password"]', "password123");

  // Click sign in button
  await page.click('button:has-text("Sign in")');

  // Wait for dashboard to load
  await page.waitForURL("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Desktop view (1440x900)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-authenticated-desktop.png",
    fullPage: false,
  });
  console.log("✅ Authenticated Dashboard - Desktop (1440x900) captured");

  // iPad Landscape (1024x768)
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-authenticated-ipad-landscape.png",
    fullPage: false,
  });
  console.log("✅ Authenticated Dashboard - iPad Landscape (1024x768) captured");

  // iPad Portrait (768x1024)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-authenticated-ipad-portrait.png",
    fullPage: true,
  });
  console.log("✅ Authenticated Dashboard - iPad Portrait (768x1024) captured");

  // Mobile (375x667)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "tests/e2e/screenshots/dashboard-authenticated-mobile.png",
    fullPage: true,
  });
  console.log("✅ Authenticated Dashboard - Mobile (375x667) captured");

  console.log("\n✅ All authenticated dashboard screenshots captured successfully!");
  console.log("Screenshots saved to: tests/e2e/screenshots/");
  console.log("Files:");
  console.log("  - dashboard-authenticated-desktop.png");
  console.log("  - dashboard-authenticated-ipad-landscape.png");
  console.log("  - dashboard-authenticated-ipad-portrait.png");
  console.log("  - dashboard-authenticated-mobile.png");
});
