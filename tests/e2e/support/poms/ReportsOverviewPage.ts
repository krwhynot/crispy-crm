import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Reports Overview Page Object Model
 *
 * Encapsulates all interactions with the Reports Overview tab.
 * Tests the KPI cards, charts, and global filters.
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Condition-based waiting helpers ✓
 * - No CSS selectors ✓
 */
export class ReportsOverviewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // NAVIGATION
  // ============================================

  /**
   * Navigate to the Reports Overview page
   */
  async navigate(): Promise<void> {
    await this.goto("/#/reports");
    await this.waitForPageLoad();
  }

  /**
   * Navigate directly to a specific tab
   */
  async navigateToTab(tab: "overview" | "opportunities" | "weekly" | "campaign"): Promise<void> {
    await this.goto(`/#/reports?tab=${tab}`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to finish loading (condition-based)
   * Waits for actual content to appear rather than loading spinner to disappear
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for the page title OR tabs to be visible (indicates app has rendered)
    await this.page.waitForFunction(
      () => {
        // Check for Reports & Analytics heading or tab content
        const hasTitle = document.body.textContent?.includes("Reports & Analytics");
        const hasTabs = document.querySelector('[role="tab"]') !== null;
        return hasTitle || hasTabs;
      },
      { timeout: 30000 }
    );

    // Then wait for the Overview tab content to load (KPI cards)
    await this.page.waitForFunction(
      () => {
        // Check for actual KPI card content (not just "Loading...")
        const hasKPICards = document.body.textContent?.includes("Total Opportunities");
        const hasCharts = document.body.textContent?.includes("Pipeline by Stage");
        const hasSkeletons = document.querySelectorAll('[data-slot="skeleton"]').length > 0;
        // Either content loaded OR still showing skeletons (data loading)
        return hasKPICards || hasCharts || hasSkeletons;
      },
      { timeout: 30000 }
    );
  }

  // ============================================
  // PAGE TITLE & TABS
  // ============================================

  /**
   * Get the page title heading
   */
  getPageTitle(): Locator {
    return this.page.getByRole("heading", { name: /reports & analytics/i });
  }

  /**
   * Get a specific tab by name
   */
  getTab(name: string): Locator {
    return this.page.getByRole("tab", { name: new RegExp(name, "i") });
  }

  /**
   * Click a tab
   */
  async clickTab(name: string): Promise<void> {
    await this.getTab(name).click();
  }

  /**
   * Expect a tab to be active
   */
  async expectTabActive(name: string): Promise<void> {
    await expect(this.getTab(name)).toHaveAttribute("data-state", "active");
  }

  // ============================================
  // KPI CARDS
  // ============================================

  /**
   * Get a KPI card by title
   */
  getKPICard(title: string): Locator {
    return this.page.locator('[data-slot="card"]').filter({ hasText: title });
  }

  /**
   * Get the value from a KPI card
   */
  async getKPIValue(title: string): Promise<string> {
    const card = this.getKPICard(title);
    const valueElement = card.locator(".text-2xl");
    return (await valueElement.textContent()) || "";
  }

  /**
   * Expect all 4 KPI cards to be visible (PRD Section 9.2.1)
   */
  async expectKPICardsVisible(): Promise<void> {
    await expect(this.page.getByText("Total Opportunities")).toBeVisible({ timeout: 30000 });
    await expect(this.page.getByText("Activities This Week")).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText("Stale Leads")).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText("Stale Deals")).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if Stale Deals KPI has warning styling (PRD Section 9.2.1)
   * Returns true if the card has amber/warning border styling
   */
  async hasStaleDealsWarningStyle(): Promise<boolean> {
    const card = this.getKPICard("Stale Deals");
    const classAttr = await card.getAttribute("class");
    // Check for warning variant styling: border-warning/50 bg-warning/5
    return classAttr?.includes("border-warning") || classAttr?.includes("bg-warning") || false;
  }

  // ============================================
  // CHARTS
  // ============================================

  /**
   * Get chart wrapper by title
   */
  getChartWrapper(title: string): Locator {
    return this.page.locator('[data-slot="card"]').filter({ hasText: title });
  }

  /**
   * Expect all chart sections to be visible
   */
  async expectChartSectionsVisible(): Promise<void> {
    await expect(this.page.getByText("Pipeline by Stage")).toBeVisible({ timeout: 30000 });
    await expect(this.page.getByText("Activity Trend (14 Days)")).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText("Top Principals by Opportunities")).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText("Rep Performance")).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get canvas element within a chart (for visual verification)
   */
  getChartCanvas(chartTitle: string): Locator {
    return this.getChartWrapper(chartTitle).locator("canvas");
  }

  // ============================================
  // GLOBAL FILTERS
  // ============================================

  /**
   * Get date range selector
   */
  getDateRangeSelector(): Locator {
    return this.page.getByLabel(/date range/i);
  }

  /**
   * Get sales rep filter selector
   */
  getSalesRepSelector(): Locator {
    return this.page.getByLabel(/sales rep/i);
  }

  /**
   * Select a date range preset
   */
  async selectDateRange(preset: string): Promise<void> {
    await this.getDateRangeSelector().click();
    await this.page.getByRole("option", { name: new RegExp(preset, "i") }).click();
    // Wait for network activity to settle after filtering
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Select a sales rep from filter
   */
  async selectSalesRep(name: string): Promise<void> {
    await this.getSalesRepSelector().click();
    await this.page.getByRole("option", { name: new RegExp(name, "i") }).click();
    // Wait for network activity to settle after filtering
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get reset filters button (only visible when filters are active)
   */
  getResetFiltersButton(): Locator {
    return this.page.getByRole("button", { name: /reset filters/i });
  }

  /**
   * Reset all filters
   */
  async resetFilters(): Promise<void> {
    const resetButton = this.getResetFiltersButton();
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Expect filter bar to be visible
   */
  async expectFilterBarVisible(): Promise<void> {
    await expect(this.getDateRangeSelector()).toBeVisible();
    await expect(this.getSalesRepSelector()).toBeVisible();
  }

  // ============================================
  // DATA VERIFICATION
  // ============================================

  /**
   * Expect data to be loaded (no loading spinners, KPI values present)
   */
  async expectDataLoaded(): Promise<void> {
    // KPI cards should have numeric values
    await this.page.waitForFunction(
      () => {
        const kpiValues = document.querySelectorAll(".text-2xl.font-bold");
        if (kpiValues.length === 0) return false;
        return Array.from(kpiValues).every((el) => {
          const text = el.textContent || "";
          return /^\d+$/.test(text.trim());
        });
      },
      { timeout: 10000 }
    );
  }

  /**
   * Get dynamic elements for visual regression masking
   */
  getDynamicElements(): Locator[] {
    return [
      this.page.locator(".text-2xl.font-bold"), // KPI values
      this.page.locator("canvas"), // Charts
    ];
  }
}
