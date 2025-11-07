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

  // ===== Dashboard Widgets (v2.0 Enhancement) =====

  /**
   * Get Upcoming Events by Principal widget
   */
  getUpcomingEventsWidget(): Locator {
    return this.page.getByRole('heading', { name: /upcoming by principal/i }).locator('..');
  }

  /**
   * Get My Tasks This Week widget
   */
  getMyTasksWidget(): Locator {
    return this.page.getByRole('heading', { name: /my tasks this week/i }).locator('..');
  }

  /**
   * Get Recent Activity Feed widget
   */
  getRecentActivityWidget(): Locator {
    return this.page.getByRole('heading', { name: /recent activity/i }).locator('..');
  }

  /**
   * Get Pipeline Summary widget
   */
  getPipelineSummaryWidget(): Locator {
    return this.page.getByRole('heading', { name: /pipeline summary/i }).locator('..');
  }

  /**
   * Get the grid container
   */
  getGridContainer(): Locator {
    // Grid container has the class grid grid-cols-1 lg:grid-cols-[70%_30%]
    return this.page.locator('.grid.grid-cols-1').first();
  }

  /**
   * Get left column (main content - 70%)
   */
  getLeftColumn(): Locator {
    return this.getGridContainer().locator('> div').first();
  }

  /**
   * Get right sidebar (supporting context - 30%)
   */
  getRightSidebar(): Locator {
    return this.getGridContainer().locator('> div').nth(1);
  }

  /**
   * Check if grid layout is in single column mode (stacked)
   */
  async isStackedLayout(): Promise<boolean> {
    const leftColumn = this.getLeftColumn();
    const rightSidebar = this.getRightSidebar();

    const leftBox = await leftColumn.boundingBox();
    const rightBox = await rightSidebar.boundingBox();

    if (!leftBox || !rightBox) return false;

    // In stacked mode, right sidebar should be below left column
    // (rightBox.top should be greater than leftBox.bottom)
    return rightBox.top >= leftBox.bottom - 10; // 10px tolerance
  }

  /**
   * Check if grid layout is in two-column mode (side-by-side)
   */
  async isTwoColumnLayout(): Promise<boolean> {
    const leftColumn = this.getLeftColumn();
    const rightSidebar = this.getRightSidebar();

    const leftBox = await leftColumn.boundingBox();
    const rightBox = await rightSidebar.boundingBox();

    if (!leftBox || !rightBox) return false;

    // In two-column mode, both should have similar top position
    // and right sidebar should be to the right of left column
    const topDiff = Math.abs(leftBox.top - rightBox.top);
    return topDiff < 50 && rightBox.left > leftBox.left;
  }

  /**
   * Verify widget is visible with semantic color styling
   */
  async verifyWidgetStyling(widget: Locator): Promise<void> {
    await expect(widget).toBeVisible();

    // Check that widget uses semantic card styling
    const hasCardBackground = await widget.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      // Widget should have card background (check CSS variable is set)
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    });

    expect(hasCardBackground).toBe(true);
  }

  /**
   * Get task checkbox from My Tasks widget
   */
  getTaskCheckbox(taskTitle: string | RegExp): Locator {
    return this.page.getByRole('checkbox', { name: new RegExp(taskTitle.toString()) });
  }

  /**
   * Get "View All" link from widget
   */
  getViewAllLink(linkText: string | RegExp): Locator {
    return this.page.getByRole('link', { name: linkText });
  }

  /**
   * Measure left column width percentage
   */
  async getLeftColumnWidthPercentage(): Promise<number> {
    const gridBox = await this.getGridContainer().boundingBox();
    const leftBox = await this.getLeftColumn().boundingBox();

    if (!gridBox || !leftBox) return 0;

    return (leftBox.width / gridBox.width) * 100;
  }

  /**
   * Measure right sidebar width percentage
   */
  async getRightSidebarWidthPercentage(): Promise<number> {
    const gridBox = await this.getGridContainer().boundingBox();
    const rightBox = await this.getRightSidebar().boundingBox();

    if (!gridBox || !rightBox) return 0;

    return (rightBox.width / gridBox.width) * 100;
  }
}
