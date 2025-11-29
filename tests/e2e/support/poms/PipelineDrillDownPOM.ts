import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Pipeline Drill-Down Sheet Page Object Model
 *
 * Handles interactions with the PipelineDrillDownSheet component
 * which displays opportunities for a selected principal.
 *
 * Required by playwright-e2e-testing skill
 *
 * Component: PipelineDrillDownSheet.tsx
 * Triggered from: PrincipalPipelineTable row click
 */
export class PipelineDrillDownPOM extends BasePage {
  /**
   * Get the drill-down sheet dialog
   */
  getSheet(): Locator {
    return this.page.getByRole("dialog", { name: /.*/ });
  }

  /**
   * Get the sheet title (principal name)
   */
  getSheetTitle(): Locator {
    return this.page.locator("#drill-down-title");
  }

  /**
   * Get the sheet description (opportunity count)
   */
  getSheetDescription(): Locator {
    return this.getSheet().getByText(/\d+ opportunit(y|ies)|loading/i);
  }

  /**
   * Get the close button (X) on the sheet
   */
  getCloseButton(): Locator {
    return this.getSheet().getByRole("button", { name: /close/i });
  }

  /**
   * Get all opportunity cards in the sheet
   */
  getOpportunityCards(): Locator {
    return this.getSheet().getByRole("button", { name: /view/i });
  }

  /**
   * Get a specific opportunity card by name
   */
  getOpportunityCard(opportunityName: string): Locator {
    return this.getSheet().getByRole("button", { name: `View ${opportunityName}` });
  }

  /**
   * Get the total pipeline stat
   */
  getTotalPipelineStat(): Locator {
    return this.getSheet().getByText(/total pipeline/i);
  }

  /**
   * Get the weighted pipeline stat
   */
  getWeightedPipelineStat(): Locator {
    return this.getSheet().getByText(/weighted/i);
  }

  /**
   * Get the empty state message
   */
  getEmptyState(): Locator {
    return this.getSheet().getByText(/no opportunities found/i);
  }

  /**
   * Get the error state message
   */
  getErrorState(): Locator {
    return this.getSheet().getByText(/failed to load/i);
  }

  /**
   * Get loading skeleton elements
   */
  getLoadingSkeletons(): Locator {
    return this.getSheet().locator(".animate-pulse");
  }

  /**
   * Wait for the sheet to be fully open
   */
  async waitForSheetOpen(): Promise<void> {
    await expect(this.getSheet()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for the sheet to be closed
   */
  async waitForSheetClosed(): Promise<void> {
    await expect(this.getSheet()).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for opportunities to load (loading state gone)
   */
  async waitForOpportunitiesLoaded(): Promise<void> {
    // Wait for loading skeletons to disappear
    await expect(this.getLoadingSkeletons().first()).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Close the sheet by clicking the close button
   */
  async close(): Promise<void> {
    await this.getCloseButton().click();
    await this.waitForSheetClosed();
  }

  /**
   * Close the sheet by pressing Escape
   */
  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.waitForSheetClosed();
  }

  /**
   * Close the sheet by clicking the overlay/backdrop
   */
  async closeByClickingOutside(): Promise<void> {
    // Click on the left edge of the viewport (outside the sheet)
    const viewport = this.page.viewportSize();
    if (viewport) {
      await this.page.mouse.click(10, viewport.height / 2);
      await this.waitForSheetClosed();
    }
  }

  /**
   * Click on an opportunity card to navigate to its detail
   */
  async clickOpportunity(opportunityName: string): Promise<void> {
    await this.getOpportunityCard(opportunityName).click();
  }

  /**
   * Click the first opportunity card
   */
  async clickFirstOpportunity(): Promise<void> {
    await this.getOpportunityCards().first().click();
  }

  /**
   * Get opportunity count from description
   */
  async getOpportunityCount(): Promise<number> {
    const description = await this.getSheetDescription().textContent();
    if (!description) return 0;

    const match = description.match(/(\d+)\s+opportunit/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if sheet is showing empty state
   */
  async isEmptyState(): Promise<boolean> {
    return this.getEmptyState().isVisible();
  }

  /**
   * Check if sheet is showing error state
   */
  async isErrorState(): Promise<boolean> {
    return this.getErrorState().isVisible();
  }

  /**
   * Check if sheet is in loading state
   */
  async isLoading(): Promise<boolean> {
    const skeletonCount = await this.getLoadingSkeletons().count();
    return skeletonCount > 0;
  }

  /**
   * Assert sheet is open with expected principal name
   */
  async expectSheetOpenForPrincipal(principalName: string): Promise<void> {
    await this.waitForSheetOpen();
    await expect(this.getSheetTitle()).toHaveText(principalName);
  }

  /**
   * Assert opportunity count matches expected
   */
  async expectOpportunityCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getOpportunityCount();
    expect(actualCount).toBe(expectedCount);
  }

  /**
   * Assert sheet shows opportunities (not empty/error)
   */
  async expectOpportunitiesVisible(): Promise<void> {
    await this.waitForOpportunitiesLoaded();
    const cardCount = await this.getOpportunityCards().count();
    expect(cardCount).toBeGreaterThan(0);
  }

  /**
   * Assert sheet shows empty state
   */
  async expectEmptyState(): Promise<void> {
    await this.waitForOpportunitiesLoaded();
    await expect(this.getEmptyState()).toBeVisible();
  }

  /**
   * Assert sheet shows error state
   */
  async expectErrorState(): Promise<void> {
    await expect(this.getErrorState()).toBeVisible();
  }

  /**
   * Assert pipeline summary stats are visible
   */
  async expectPipelineStatsVisible(): Promise<void> {
    await expect(this.getTotalPipelineStat()).toBeVisible();
    await expect(this.getWeightedPipelineStat()).toBeVisible();
  }

  /**
   * Get all visible stage badges in the sheet
   */
  getStageBadges(): Locator {
    return this.getSheet().locator('[class*="badge"]');
  }

  /**
   * Filter opportunities by clicking stage badge (if filtering is supported)
   * Note: Currently drill-down doesn't have built-in filtering, but prepared for future
   */
  async filterByStage(stageName: string): Promise<void> {
    const stageBadge = this.getSheet().getByText(stageName, { exact: true }).first();
    if (await stageBadge.isVisible()) {
      await stageBadge.click();
    }
  }
}
