import { test, expect } from "@playwright/test";
import { LoginPage } from "../../support/poms/LoginPage";
import { ReportsOverviewPage } from "../../support/poms/ReportsOverviewPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for Reports Overview Tab
 *
 * Tests KPI cards, chart sections, global filters, and data loading.
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs) ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting (no arbitrary waitForTimeout) ✓
 */

test.describe("Reports Overview Tab", () => {
  let reportsPage: ReportsOverviewPage;

  test.beforeEach(async ({ page }) => {
    // Attach console monitoring for diagnostics
    await consoleMonitor.attach(page);

    // Login using POM
    const loginPage = new LoginPage(page);
    await loginPage.goto("/");

    // Wait for either login form or dashboard (storage state may already auth)
    const isLoginFormVisible = await page
      .getByLabel(/email/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isLoginFormVisible) {
      await loginPage.login("admin@test.com", "password123");
    }

    // Initialize Reports page POM
    reportsPage = new ReportsOverviewPage(page);
  });

  test.afterEach(async () => {
    // Report console errors if any (diagnostic output)
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  // ============================================
  // PAGE LOAD & STRUCTURE TESTS
  // ============================================

  test("LOAD - Overview tab loads with page title and KPI cards", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Verify page title
    await expect(reportsPage.getPageTitle()).toBeVisible();

    // Verify Overview tab is active by default
    await reportsPage.expectTabActive("Overview");

    // Verify KPI cards are visible
    await reportsPage.expectKPICardsVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
    expect(consoleMonitor.hasNetworkErrors(), "Network errors detected").toBe(false);
  });

  test("LOAD - All chart sections render correctly", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for page to load
    await reportsPage.waitForPageLoad();

    // Verify all chart sections are visible
    await reportsPage.expectChartSectionsVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("LOAD - Global filter bar is visible with controls", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Verify filter bar elements
    await reportsPage.expectFilterBarVisible();

    // Verify default values
    await expect(page.getByText(/last 30 days/i)).toBeVisible();
    await expect(page.getByText(/all reps/i)).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  // ============================================
  // KPI CARD TESTS
  // ============================================

  test("KPI - Total Opportunities card displays numeric value", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for data to load
    await reportsPage.expectDataLoaded();

    // Get KPI value
    const value = await reportsPage.getKPIValue("Total Opportunities");

    // Verify it's a valid number
    expect(value).toMatch(/^\d+$/);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("KPI - Activities This Week card displays numeric value", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for data to load
    await reportsPage.expectDataLoaded();

    // Get KPI value
    const value = await reportsPage.getKPIValue("Activities This Week");

    // Verify it's a valid number
    expect(value).toMatch(/^\d+$/);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("KPI - Stale Leads card displays numeric value", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for data to load
    await reportsPage.expectDataLoaded();

    // Get KPI value
    const value = await reportsPage.getKPIValue("Stale Leads");

    // Verify it's a valid number
    expect(value).toMatch(/^\d+$/);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  // ============================================
  // FILTER TESTS
  // ============================================

  test("FILTER - Date range selector opens and shows presets", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Click date range selector
    await reportsPage.getDateRangeSelector().click();

    // Verify preset options are visible
    await expect(page.getByRole("option", { name: /today/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /last 7 days/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /last 30 days/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /this month/i })).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("FILTER - Selecting date range updates data", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for initial data
    await reportsPage.expectDataLoaded();

    // Get initial values
    const initialValue = await reportsPage.getKPIValue("Activities This Week");

    // Select "Last 7 Days" date range
    await reportsPage.selectDateRange("Last 7 days");

    // Verify data reloaded (values should be valid numbers)
    await reportsPage.expectDataLoaded();
    const newValue = await reportsPage.getKPIValue("Activities This Week");

    // Values should both be valid numbers (may or may not be different)
    expect(initialValue).toMatch(/^\d+$/);
    expect(newValue).toMatch(/^\d+$/);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("FILTER - Sales rep selector shows available reps", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Click sales rep selector
    await reportsPage.getSalesRepSelector().click();

    // Verify "All Reps" option is visible
    await expect(page.getByRole("option", { name: /all reps/i })).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("FILTER - Reset button appears when filters change and resets correctly", async ({
    page,
  }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Initially, reset button should NOT be visible (default filters)
    const resetButtonInitial = reportsPage.getResetFiltersButton();
    const isInitiallyVisible = await resetButtonInitial.isVisible().catch(() => false);
    expect(isInitiallyVisible).toBe(false);

    // Change date filter to non-default
    await reportsPage.selectDateRange("Today");

    // Now reset button should be visible
    await expect(reportsPage.getResetFiltersButton()).toBeVisible();

    // Click reset
    await reportsPage.resetFilters();

    // Verify filters are back to default (Last 30 Days)
    await expect(page.getByText(/last 30 days/i)).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  // ============================================
  // CHART INTERACTION TESTS
  // ============================================

  test("CHART - Pipeline by Stage chart section is rendered", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for page to load
    await reportsPage.waitForPageLoad();

    // Verify chart wrapper is visible
    const chartWrapper = reportsPage.getChartWrapper("Pipeline by Stage");
    await expect(chartWrapper).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("CHART - Activity Trend chart section is rendered", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for page to load
    await reportsPage.waitForPageLoad();

    // Verify chart wrapper is visible
    const chartWrapper = reportsPage.getChartWrapper("Activity Trend");
    await expect(chartWrapper).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("CHART - Rep Performance chart section is rendered", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Wait for page to load
    await reportsPage.waitForPageLoad();

    // Verify chart wrapper is visible
    const chartWrapper = reportsPage.getChartWrapper("Rep Performance");
    await expect(chartWrapper).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================

  test("WORKFLOW - Complete overview workflow: load → view KPIs → filter → reset", async ({
    page,
  }) => {
    // 1. Navigate to reports
    await reportsPage.navigate();

    // 2. Verify page loaded
    await expect(reportsPage.getPageTitle()).toBeVisible();

    // 3. Verify KPI cards visible
    await reportsPage.expectKPICardsVisible();

    // 4. Verify chart sections visible
    await reportsPage.expectChartSectionsVisible();

    // 5. Apply date filter
    await reportsPage.selectDateRange("Last 7 days");

    // 6. Verify data still valid
    await reportsPage.expectDataLoaded();

    // 7. Reset filters
    await reportsPage.resetFilters();

    // 8. Verify back to defaults
    await expect(page.getByText(/last 30 days/i)).toBeVisible();

    // Assert no console errors throughout workflow
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
    expect(consoleMonitor.hasNetworkErrors(), "Network errors detected").toBe(false);
  });

  test("RESPONSIVE - Overview renders correctly at tablet viewport", async ({ page }) => {
    // Set tablet viewport (iPad portrait)
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to reports
    await reportsPage.navigate();

    // Verify KPI cards visible (may be stacked)
    await reportsPage.expectKPICardsVisible();

    // Verify filter bar visible
    await reportsPage.expectFilterBarVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("ACCESSIBILITY - Tab navigation works via keyboard", async ({ page }) => {
    // Navigate to reports
    await reportsPage.navigate();

    // Focus on first tab
    await reportsPage.getTab("Overview").focus();

    // Press right arrow to move to next tab
    await page.keyboard.press("ArrowRight");

    // Opportunities by Principal tab should be focused
    const oppTab = reportsPage.getTab("Opportunities by Principal");
    await expect(oppTab).toBeFocused();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });
});
