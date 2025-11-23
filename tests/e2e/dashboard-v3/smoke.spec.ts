import { test, expect } from "../support/fixtures/authenticated";

/**
 * Dashboard V3 - Smoke Test
 * Simple test to verify route accessibility
 */

test.describe("Dashboard V3 - Smoke Test", () => {
  test("dashboard-v3 route is accessible and renders", async ({ authenticatedPage }) => {
    // Navigate to Dashboard V3
    const response = await authenticatedPage.goto("/dashboard-v3");

    console.log("Response status:", response?.status());

    // Take screenshot for debugging
    await authenticatedPage.screenshot({ path: "dashboard-v3-smoke.png", fullPage: true });

    // Log current URL
    console.log("Current URL:", authenticatedPage.url());

    // Log page title
    const title = await authenticatedPage.title();
    console.log("Page title:", title);

    // Get page content for debugging
    const bodyText = await authenticatedPage.locator("body").textContent();
    console.log("Body text preview:", bodyText?.substring(0, 500));

    // Check for error boundary or dashboard header
    const errorBoundary = await authenticatedPage
      .locator("text=/error|failed|something went wrong/i")
      .first()
      .isVisible()
      .catch(() => false);
    const dashboardHeader = await authenticatedPage
      .locator("h1")
      .textContent()
      .catch(() => "");

    console.log("Error boundary visible:", errorBoundary);
    console.log("H1 content:", dashboardHeader);

    // Basic assertion - page loaded successfully
    expect(response?.status()).toBe(200);
  });
});
