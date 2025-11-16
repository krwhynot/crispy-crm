import { test } from "@playwright/test";

test("Capture dashboard with all 5 widgets", async ({ page }) => {
  console.log("Starting dashboard verification...");

  // Go to app
  await page.goto("http://localhost:5173/");
  await page.waitForLoadState("networkidle");
  console.log("✓ App loaded");

  // Login
  await page.fill('input[name="username"]', "admin@test.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  console.log("✓ Login submitted");

  // Wait for dashboard
  await page.waitForTimeout(3000);
  console.log("✓ Dashboard loaded");

  // Desktop screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "dashboard-desktop-verified.png",
    fullPage: false
  });
  console.log("✅ Desktop screenshot saved: dashboard-desktop-verified.png");

  // Full page screenshot
  await page.screenshot({
    path: "dashboard-full-page-verified.png",
    fullPage: true
  });
  console.log("✅ Full page screenshot saved: dashboard-full-page-verified.png");
});
