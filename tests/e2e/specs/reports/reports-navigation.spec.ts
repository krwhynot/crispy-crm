import { test, expect } from "@playwright/test";
import { LoginPage } from "../../support/poms/LoginPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for Reports tab navigation
 * Tests tab switching, URL updates, and tab state persistence on refresh
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (LoginPage POM) ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting (no waitForTimeout) ✓
 */

test.describe("Reports Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Login using POM
    const loginPage = new LoginPage(page);
    await loginPage.goto("/");

    // Wait for either login form or dashboard
    const isLoginFormVisible = await page
      .getByLabel(/email/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isLoginFormVisible) {
      await loginPage.login("admin@test.com", "password123");
    }
    // If not visible, storage state has already authenticated us
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("navigates between report tabs", async ({ page }) => {
    await page.goto("/#/reports");

    // Wait for page to load (condition-based)
    await page.waitForFunction(
      () => {
        const loadingText = document.body.textContent?.includes("Loading...");
        return !loadingText;
      },
      { timeout: 15000 }
    );

    // Check default tab is Overview
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "data-state",
      "active"
    );
    await expect(page.getByText("Total Opportunities")).toBeVisible();

    // Navigate to Opportunities by Principal tab
    await page.getByRole("tab", { name: "Opportunities by Principal" }).click();
    await expect(page).toHaveURL(/tab=opportunities/);

    // Navigate to Weekly Activity tab
    await page.getByRole("tab", { name: "Weekly Activity" }).click();
    await expect(page).toHaveURL(/tab=weekly/);

    // Navigate to Campaign Activity tab
    await page.getByRole("tab", { name: "Campaign Activity" }).click();
    await expect(page).toHaveURL(/tab=campaign/);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
    expect(consoleMonitor.hasNetworkErrors(), "Network errors detected").toBe(false);
  });

  test("preserves tab selection on refresh", async ({ page }) => {
    // Navigate directly to weekly activity tab
    await page.goto("/#/reports?tab=weekly");

    // Wait for page to load (condition-based)
    await page.waitForFunction(
      () => {
        const loadingText = document.body.textContent?.includes("Loading...");
        return !loadingText;
      },
      { timeout: 15000 }
    );

    // Verify Weekly Activity tab is selected
    await expect(page.getByRole("tab", { name: "Weekly Activity" })).toHaveAttribute(
      "data-state",
      "active"
    );

    // Reload the page
    await page.reload();

    // Wait for page to load after reload (condition-based)
    await page.waitForFunction(
      () => {
        const loadingText = document.body.textContent?.includes("Loading...");
        return !loadingText;
      },
      { timeout: 15000 }
    );

    // Verify tab selection is preserved after refresh
    await expect(page.getByRole("tab", { name: "Weekly Activity" })).toHaveAttribute(
      "data-state",
      "active"
    );

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("navigates to reports from header", async ({ page }) => {
    // Start on a different page
    await page.goto("/#/contacts");

    // Wait for contacts page to load
    await expect(page.getByRole("heading", { name: /contacts/i })).toBeVisible({ timeout: 10000 });

    // Click Reports in header navigation
    await page.getByRole("tab", { name: "Reports" }).click();

    // Should navigate to /reports
    await expect(page).toHaveURL(/\/#\/reports/);

    // Wait for page to load (condition-based)
    await page.waitForFunction(
      () => {
        const loadingText = document.body.textContent?.includes("Loading...");
        return !loadingText;
      },
      { timeout: 15000 }
    );

    // Overview tab should be visible and active by default
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "data-state",
      "active"
    );

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });
});
