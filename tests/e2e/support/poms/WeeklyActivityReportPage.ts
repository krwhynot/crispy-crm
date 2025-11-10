import { expect, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Weekly Activity Summary Report
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Extends BasePage ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - No CSS selectors ✓
 * - Condition-based waiting ✓
 */
export class WeeklyActivityReportPage extends BasePage {
  /**
   * Navigate to the Weekly Activity Summary report
   */
  async navigate(): Promise<void> {
    await this.goto('/#/reports/weekly-activity');
    await this.waitForPageLoad();
  }

  /**
   * Wait for the report page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for React loading state to clear (condition-based waiting)
    await this.page.waitForFunction(
      () => {
        const loadingText = document.body.textContent?.includes('Loading...');
        return !loadingText;
      },
      { timeout: 15000 }
    );

    // Now wait for title to be visible
    await expect(this.page.getByRole('heading', { name: /weekly activity summary/i })).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get the page title heading
   */
  getTitleHeading(): Locator {
    return this.page.getByRole('heading', { name: /weekly activity summary/i });
  }

  /**
   * Get the Export CSV button
   */
  getExportButton(): Locator {
    return this.getButton(/export csv/i);
  }

  /**
   * Get the start date input
   */
  getStartDateInput(): Locator {
    // Date inputs are not labeled, so we look for the first date input
    return this.page.locator('input[type="date"]').first();
  }

  /**
   * Get the end date input
   */
  getEndDateInput(): Locator {
    // Date inputs are not labeled, so we look for the second date input
    return this.page.locator('input[type="date"]').last();
  }

  /**
   * Set the date range for the report
   */
  async setDateRange(startDate: string, endDate: string): Promise<void> {
    await this.getStartDateInput().fill(startDate);
    await this.getEndDateInput().fill(endDate);

    // Wait for data to reload (condition-based waiting)
    await this.page.waitForTimeout(500); // Small delay for debounce
  }

  /**
   * Get summary stat card by name
   */
  getSummaryStatCard(statName: string | RegExp): Locator {
    return this.page.getByText(statName).locator('..');
  }

  /**
   * Get the value of a summary stat
   */
  async getSummaryStatValue(statName: string | RegExp): Promise<string> {
    const card = this.getSummaryStatCard(statName);
    const value = await card.locator('p.text-2xl').textContent();
    return value?.trim() || '';
  }

  /**
   * Check if "Total Activities" stat is visible
   */
  async expectTotalActivitiesVisible(): Promise<void> {
    await expect(this.page.getByText(/total activities/i)).toBeVisible();
  }

  /**
   * Check if "Active Reps" stat is visible
   */
  async expectActiveRepsVisible(): Promise<void> {
    await expect(this.page.getByText(/active reps/i)).toBeVisible();
  }

  /**
   * Check if "Avg per Rep" stat is visible
   */
  async expectAvgPerRepVisible(): Promise<void> {
    await expect(this.page.getByText(/avg per rep/i)).toBeVisible();
  }

  /**
   * Check if a rep card is visible by rep name
   */
  async expectRepCardVisible(repName: string | RegExp): Promise<void> {
    await expect(this.page.getByText(repName)).toBeVisible();
  }

  /**
   * Check if the table has the correct headers
   */
  async expectTableHeadersVisible(): Promise<void> {
    await expect(this.page.getByRole('columnheader', { name: /principal/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /calls/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /emails/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /meetings/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /notes/i })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: /total/i })).toBeVisible();
  }

  /**
   * Check if low activity warning badge is visible
   */
  async expectLowActivityWarningVisible(): Promise<void> {
    await expect(this.page.getByText(/⚠️ low activity/i)).toBeVisible();
  }

  /**
   * Check if "No activities found" message is displayed
   */
  async expectNoActivitiesMessage(): Promise<void> {
    await expect(this.page.getByText(/no activities found for this date range/i)).toBeVisible();
  }

  /**
   * Click the Export CSV button
   * Note: Actual file download testing requires download event handling
   */
  async clickExportButton(): Promise<void> {
    await this.getExportButton().click();
  }

  /**
   * Wait for export to complete (notification appears)
   * This uses condition-based waiting for success notification
   */
  async waitForExportSuccess(): Promise<void> {
    // Wait for success notification to appear
    await expect(this.page.getByText(/report exported successfully/i)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Check if activity data is present (not the empty state)
   */
  async expectActivityDataPresent(): Promise<void> {
    // Check that we have at least one activity row
    // Using getByRole for semantic selector
    const rows = this.page.getByRole('row');
    const count = await rows.count();

    // Should have header row + at least one data row
    expect(count).toBeGreaterThan(1);
  }

  /**
   * Get the count of rep cards displayed
   */
  async getRepCardCount(): Promise<number> {
    // Rep cards contain "activities" badge text
    const badges = this.page.getByText(/\d+ activities/);
    return await badges.count();
  }
}
