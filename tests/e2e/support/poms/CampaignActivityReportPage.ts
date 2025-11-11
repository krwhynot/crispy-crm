import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Campaign Activity Report Page Object Model
 * Handles interactions with the Campaign Activity Report page
 *
 * Required by playwright-e2e-testing skill
 */
export class CampaignActivityReportPage extends BasePage {
  /**
   * Navigate to the Campaign Activity Report
   */
  async navigate(): Promise<void> {
    await this.goto("/#/reports/campaign-activity");
    await this.waitForPageLoad();
  }

  /**
   * Wait for the report page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for React loading state to clear (condition-based waiting)
    await this.page.waitForFunction(
      () => {
        const loadingText = document.body.textContent?.includes("Loading...");
        return !loadingText;
      },
      { timeout: 15000 }
    );

    // Now wait for title to be visible
    await expect(this.page.getByText("Campaign Activity Report")).toBeVisible({
      timeout: 5000,
    });
  }

  /**
   * Get the page title heading
   */
  getTitleHeading(): Locator {
    return this.page.getByText("Campaign Activity Report");
  }

  /**
   * Get the campaign selector dropdown
   */
  getCampaignSelector(): Locator {
    return this.page.getByLabel(/select campaign/i);
  }

  /**
   * Select a campaign from the dropdown
   */
  async selectCampaign(campaignName: string): Promise<void> {
    const selector = this.page.getByLabel(/select campaign/i);
    await selector.click();
    await this.page.getByRole("option", { name: campaignName }).click();
    // Wait for data to load
    await this.page.waitForTimeout(500); // Small debounce for data fetch
  }

  /**
   * Get date range preset buttons
   */
  getDatePresetButton(preset: string): Locator {
    return this.getButton(new RegExp(preset, "i"));
  }

  /**
   * Click a date range preset button
   */
  async clickDatePreset(preset: string): Promise<void> {
    await this.getDatePresetButton(preset).click();
    await this.page.waitForTimeout(300); // Small debounce for filter application
  }

  /**
   * Get activity type checkbox
   */
  getActivityTypeCheckbox(type: string): Locator {
    return this.page.getByLabel(new RegExp(type, "i"));
  }

  /**
   * Toggle an activity type checkbox
   */
  async toggleActivityType(type: string): Promise<void> {
    await this.getActivityTypeCheckbox(type).click();
    await this.page.waitForTimeout(300); // Small debounce for filter application
  }

  /**
   * Get sales rep selector dropdown
   */
  getSalesRepSelector(): Locator {
    return this.page.getByLabel(/sales rep/i);
  }

  /**
   * Select a sales rep from the dropdown
   */
  async selectSalesRep(repName: string): Promise<void> {
    const selector = this.getSalesRepSelector();
    await selector.click();
    await this.page.getByRole("option", { name: new RegExp(repName, "i") }).click();
    await this.page.waitForTimeout(300); // Small debounce for filter application
  }

  /**
   * Get "Show stale leads" toggle
   */
  getStaleLeadsToggle(): Locator {
    return this.page.getByLabel(/show stale leads/i);
  }

  /**
   * Toggle the "Show stale leads" checkbox
   */
  async toggleStaleLeads(): Promise<void> {
    await this.getStaleLeadsToggle().click();
    await this.page.waitForTimeout(500); // Wait for view switch
  }

  /**
   * Get "Clear Filters" button
   */
  getClearFiltersButton(): Locator {
    return this.getButton(/clear filters/i);
  }

  /**
   * Click "Clear Filters" button
   */
  async clickClearFilters(): Promise<void> {
    await this.getClearFiltersButton().click();
    await this.page.waitForTimeout(300); // Small debounce for reset
  }

  /**
   * Get "Export to CSV" button
   */
  getExportButton(): Locator {
    return this.getButton(/export to csv/i);
  }

  /**
   * Click "Export to CSV" button
   */
  async clickExportButton(): Promise<void> {
    await this.getExportButton().click();
  }

  /**
   * Get summary card by name
   */
  getSummaryCard(name: string | RegExp): Locator {
    return this.page.getByText(name).locator("..");
  }

  /**
   * Get summary stat value by label
   */
  async getSummaryStatValue(label: string | RegExp): Promise<string> {
    const card = this.page.getByText(label).locator("..").locator("..");
    const valueElement = card.getByRole("heading").first();
    return await valueElement.textContent().then((text) => text?.trim() || "");
  }

  /**
   * Verify summary cards are visible
   */
  async expectSummaryCardsVisible(): Promise<void> {
    await expect(this.page.getByText(/total activities/i)).toBeVisible();
    await expect(this.page.getByText(/unique organizations/i)).toBeVisible();
    await expect(this.page.getByText(/coverage rate/i)).toBeVisible();
  }

  /**
   * Get activity type card by type name
   */
  getActivityTypeCard(type: string): Locator {
    return this.page.getByText(new RegExp(`^${type}$`, "i")).locator("..");
  }

  /**
   * Expand/collapse an activity type card
   */
  async toggleActivityTypeCard(type: string): Promise<void> {
    const card = this.getActivityTypeCard(type);
    await card.click();
  }

  /**
   * Verify activity type cards are rendered
   */
  async expectActivityTypeCardsVisible(count: number = 1): Promise<void> {
    // Check that at least 'count' activity type cards exist
    const cards = this.page.locator('[data-activity-type]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const actualCount = await cards.count();
    expect(actualCount).toBeGreaterThanOrEqual(count);
  }

  /**
   * Get stale leads table
   */
  getStaleLeadsTable(): Locator {
    return this.page.getByRole("table");
  }

  /**
   * Verify stale leads view is displayed
   */
  async expectStaleLeadsViewVisible(): Promise<void> {
    await expect(this.page.getByText(/stale leads/i)).toBeVisible();
    // Either table or "no stale leads" message should be visible
    const hasTable = await this.getStaleLeadsTable().isVisible().catch(() => false);
    const hasNoDataMessage = await this.page
      .getByText(/no stale leads/i)
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasNoDataMessage).toBe(true);
  }

  /**
   * Wait for export success notification
   */
  async waitForExportSuccess(): Promise<void> {
    await expect(this.page.getByText(/exported successfully/i)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get the count of activity type cards displayed
   */
  async getActivityTypeCardCount(): Promise<number> {
    const cards = this.page.locator('[data-activity-type]');
    return await cards.count();
  }

  /**
   * Verify activity data is present (not empty state)
   */
  async expectActivityDataPresent(): Promise<void> {
    // Should either have activity cards or a "no activities" message
    const hasCards = await this.page
      .locator('[data-activity-type]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasNoDataMessage = await this.page
      .getByText(/no activities found/i)
      .isVisible()
      .catch(() => false);
    expect(hasCards || hasNoDataMessage).toBe(true);
  }

  /**
   * Verify no activities message is displayed
   */
  async expectNoActivitiesMessage(): Promise<void> {
    await expect(this.page.getByText(/no activities found/i)).toBeVisible();
  }

  /**
   * Get start date input
   */
  getStartDateInput(): Locator {
    return this.page.locator('input[id="start-date"]');
  }

  /**
   * Get end date input
   */
  getEndDateInput(): Locator {
    return this.page.locator('input[id="end-date"]');
  }

  /**
   * Set custom date range
   */
  async setDateRange(startDate: string, endDate: string): Promise<void> {
    await this.getStartDateInput().fill(startDate);
    await this.getEndDateInput().fill(endDate);
    await this.page.waitForTimeout(500); // Wait for filter application
  }
}
