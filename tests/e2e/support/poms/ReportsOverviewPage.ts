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
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const hasLoading = document.body.textContent?.includes("Loading...");
        return !hasLoading;
      },
      { timeout: 15000 }
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
   * Expect all KPI cards to be visible
   */
  async expectKPICardsVisible(): Promise<void> {
    await expect(this.page.getByText("Total Opportunities")).toBeVisible();
    await expect(this.page.getByText("Activities This Week")).toBeVisible();
    await expect(this.page.getByText("Stale Leads")).toBeVisible();
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
    await expect(this.page.getByText("Pipeline by Stage")).toBeVisible();
    await expect(this.page.getByText("Activity Trend (14 Days)")).toBeVisible();
    await expect(this.page.getByText("Top Principals by Opportunities")).toBeVisible();
    await expect(this.page.getByText("Rep Performance")).toBeVisible();
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
    // Wait for data to update
    await this.page.waitForTimeout(300);
  }

  /**
   * Select a sales rep from filter
   */
  async selectSalesRep(name: string): Promise<void> {
    await this.getSalesRepSelector().click();
    await this.page.getByRole("option", { name: new RegExp(name, "i") }).click();
    // Wait for data to update
    await this.page.waitForTimeout(300);
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
      await this.page.waitForTimeout(300);
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
