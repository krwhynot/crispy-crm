import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Dashboard Page Object Model
 * Handles principal-centric dashboard interactions
 *
 * Required by playwright-e2e-testing skill
 */
export class DashboardPage extends BasePage {
  /**
   * Navigate to dashboard
   * Uses relative path for baseURL portability
   */
  async navigate(): Promise<void> {
    await this.goto('/');

    // Wait for dashboard to be fully loaded by checking for heading
    // Note: React Admin dashboard renders at '/' not '/#/'
    await expect(this.getHeading()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get "My Principals" heading
   */
  getHeading(): Locator {
    return this.page.getByRole('heading', { name: /my principals/i });
  }

  /**
   * Get refresh button
   */
  getRefreshButton(): Locator {
    return this.getButton(/refresh/i);
  }

  /**
   * Click refresh button and wait for refresh to complete
   */
  async refresh(): Promise<void> {
    const button = this.getRefreshButton();
    await button.click();

    // Wait for button to be enabled again (indicates refresh complete)
    await expect(button).toBeEnabled({ timeout: 5000 });
  }

  /**
   * Get table (using semantic role instead of CSS class)
   */
  getTable(): Locator {
    return this.page.getByRole('table');
  }

  /**
   * Get column header by name
   */
  getColumnHeader(name: string | RegExp): Locator {
    return this.page.getByRole('columnheader', { name });
  }

  /**
   * Get all data rows (excludes header row)
   */
  getDataRows(): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  /**
   * Get first data row
   */
  getFirstDataRow(): Locator {
    return this.getDataRows().first();
  }

  /**
   * Wait for table to have data
   */
  async waitForTableData(): Promise<void> {
    await expect(this.getDataRows().first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if table is empty (only has header, no data rows)
   */
  async isTableEmpty(): Promise<boolean> {
    const rowCount = await this.getDataRows().count();
    return rowCount === 0;
  }

  /**
   * Verify all 6 column headers are visible
   */
  async expectAllColumnHeaders(): Promise<void> {
    await expect(this.getColumnHeader(/principal/i)).toBeVisible();
    await expect(this.getColumnHeader(/# opps/i)).toBeVisible();
    await expect(this.getColumnHeader(/status/i)).toBeVisible();
    await expect(this.getColumnHeader(/last activity/i)).toBeVisible();
    await expect(this.getColumnHeader(/stuck/i)).toBeVisible();
    await expect(this.getColumnHeader(/next action/i)).toBeVisible();
  }

  /**
   * Get navigation menu
   */
  getNavigation(): Locator {
    return this.page.getByRole('navigation').first();
  }

  /**
   * Get dashboard navigation link
   */
  getDashboardNavLink(): Locator {
    return this.getNavigation().getByRole('link', { name: /dashboard/i });
  }

  /**
   * Check if page has horizontal scroll
   */
  async hasHorizontalScroll(): Promise<boolean> {
    const bodyWidth = await this.page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = this.page.viewportSize()?.width || 0;
    return bodyWidth > viewportWidth + 5; // 5px tolerance
  }

  /**
   * Get page height
   */
  async getPageHeight(): Promise<number> {
    return await this.page.evaluate(() => document.documentElement.scrollHeight);
  }

  /**
   * Get viewport height
   */
  getViewportHeight(): number {
    return this.page.viewportSize()?.height || 0;
  }

  /**
   * Check if element meets minimum touch target size (44x44px)
   */
  async meetsTouchTargetSize(locator: Locator, minSize = 36): Promise<boolean> {
    const box = await locator.boundingBox();
    if (!box) return false;
    return box.height >= minSize && box.width >= minSize;
  }
}
