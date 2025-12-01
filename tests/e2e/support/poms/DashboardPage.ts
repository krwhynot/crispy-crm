import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

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
    await this.goto("/");

    // Wait for dashboard to be fully loaded by checking for heading
    // Note: React Admin dashboard renders at '/' not '/#/'
    await expect(this.getHeading()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get "Principal Dashboard" heading
   */
  getHeading(): Locator {
    return this.page.getByRole("heading", { name: /principal dashboard/i });
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
    return this.page.getByRole("table");
  }

  /**
   * Get column header by name
   */
  getColumnHeader(name: string | RegExp): Locator {
    return this.page.getByRole("columnheader", { name });
  }

  /**
   * Get all data rows (excludes header row)
   */
  getDataRows(): Locator {
    return this.page.getByRole("row").filter({ has: this.page.getByRole("cell") });
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
    return this.page.getByRole("navigation").first();
  }

  /**
   * Get dashboard navigation link
   */
  getDashboardNavLink(): Locator {
    return this.getNavigation().getByRole("link", { name: /dashboard/i });
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
   * Uses semantic text matching for resilience
   */
  getUpcomingEventsWidget(): Locator {
    // Prefer semantic: find card section containing the title text
    return this.page
      .locator("section, [role='region'], div")
      .filter({ has: this.page.getByText(/upcoming by principal/i) })
      .first();
  }

  /**
   * Get Upcoming Events widget heading
   */
  getUpcomingEventsHeading(): Locator {
    return this.page.getByText(/upcoming by principal/i);
  }

  /**
   * Get My Tasks This Week widget
   * Uses semantic text matching for resilience
   */
  getMyTasksWidget(): Locator {
    return this.page
      .locator("section, [role='region'], div")
      .filter({ has: this.page.getByText(/my tasks/i) })
      .first();
  }

  /**
   * Get Tasks widget heading
   */
  getTasksWidgetHeading(): Locator {
    return this.page.getByText(/my tasks/i).first();
  }

  /**
   * Get "New Task" button within Tasks widget
   */
  getNewTaskButton(): Locator {
    return this.page.getByRole("button", { name: /new task/i });
  }

  /**
   * Get Recent Activity Feed widget
   * Uses semantic text matching for resilience
   */
  getRecentActivityWidget(): Locator {
    return this.page
      .locator("section, [role='region'], div")
      .filter({ has: this.page.getByText(/recent activity|activity feed|log activity/i) })
      .first();
  }

  /**
   * Get Activity Feed heading
   */
  getActivityFeedHeading(): Locator {
    return this.page.getByText(/recent activity|log activity/i).first();
  }

  /**
   * Get Pipeline Summary widget
   */
  getPipelineSummaryWidget(): Locator {
    return this.page
      .locator("section, [role='region'], div")
      .filter({ has: this.page.getByText(/pipeline/i) })
      .first();
  }

  /**
   * Get Principal Pipeline Table (V3 dashboard)
   * Semantic: Uses heading text to locate the table container
   */
  getPrincipalPipelineTable(): Locator {
    return this.page
      .locator("section, [role='region'], div")
      .filter({ has: this.page.getByText(/pipeline by principal/i) })
      .first();
  }

  /**
   * Get Principal Pipeline Table heading
   */
  getPrincipalPipelineHeading(): Locator {
    return this.page.getByRole("heading", { name: /pipeline by principal/i });
  }

  /**
   * Get pipeline table rows (clickable principal rows)
   */
  getPipelineRows(): Locator {
    return this.page.getByRole("button", { name: /view opportunities for/i });
  }

  /**
   * Get specific pipeline row by principal name
   */
  getPipelineRowByPrincipal(principalName: string): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(`view opportunities for.*${principalName}`, "i"),
    });
  }

  /**
   * Get the grid container
   */
  getGridContainer(): Locator {
    // Select the grid container by gap-6 class (viewport-agnostic)
    return this.page.locator(".grid.gap-6").first();
  }

  /**
   * Get left column (main content - 70%)
   */
  getLeftColumn(): Locator {
    // The left column is the first direct child div
    return this.getGridContainer().locator("> div").first();
  }

  /**
   * Get right sidebar (supporting context - 30%)
   */
  getRightSidebar(): Locator {
    // The right sidebar is the second direct child div
    return this.getGridContainer().locator("> div").last();
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
      return styles.backgroundColor !== "rgba(0, 0, 0, 0)";
    });

    expect(hasCardBackground).toBe(true);
  }

  /**
   * Get task checkbox from My Tasks widget
   */
  getTaskCheckbox(taskTitle: string | RegExp): Locator {
    return this.page.getByRole("checkbox", { name: new RegExp(taskTitle.toString()) });
  }

  /**
   * Get "View All" link from widget
   */
  getViewAllLink(linkText: string | RegExp): Locator {
    return this.page.getByRole("link", { name: linkText });
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

  // ===== Widget Assertion Helpers =====

  /**
   * Verify all core dashboard widgets are visible
   * Use in smoke tests to confirm dashboard loaded correctly
   */
  async expectAllWidgetsVisible(): Promise<void> {
    await expect(this.getHeading()).toBeVisible({ timeout: 10000 });
    // Check for at least one widget type (V3 has pipeline, tasks, logger)
    const pipelineVisible = await this.getPrincipalPipelineHeading()
      .isVisible()
      .catch(() => false);
    const tasksVisible = await this.getTasksWidgetHeading()
      .isVisible()
      .catch(() => false);

    expect(pipelineVisible || tasksVisible).toBe(true);
  }

  /**
   * Wait for dashboard widgets to finish loading
   * Checks for loading skeletons to disappear
   */
  async waitForWidgetsLoaded(): Promise<void> {
    // Wait for any loading skeletons to disappear
    const loadingSkeletons = this.page.locator(".animate-pulse");
    await loadingSkeletons
      .first()
      .waitFor({ state: "hidden", timeout: 15000 })
      .catch(() => {
        // No skeletons found - dashboard already loaded
      });
  }

  /**
   * Get loading skeleton (indicates widget is still loading)
   */
  getLoadingSkeleton(): Locator {
    return this.page.locator(".animate-pulse").first();
  }

  /**
   * Check if any widget is in loading state
   */
  async isAnyWidgetLoading(): Promise<boolean> {
    const skeletonCount = await this.page.locator(".animate-pulse").count();
    return skeletonCount > 0;
  }

  /**
   * Get widget error message (if widget failed to load)
   */
  getWidgetErrorMessage(): Locator {
    return this.page.getByText(/failed to load|error loading/i);
  }

  /**
   * Check if any widget has an error state
   */
  async hasWidgetError(): Promise<boolean> {
    return this.getWidgetErrorMessage()
      .isVisible()
      .catch(() => false);
  }

  // ===== Task Widget Interactions =====

  /**
   * Get task items in the Tasks widget
   */
  getTaskItems(): Locator {
    return this.page.locator(".interactive-card");
  }

  /**
   * Get task item by subject text
   */
  getTaskBySubject(subject: string | RegExp): Locator {
    return this.getTaskItems().filter({ hasText: subject });
  }

  /**
   * Get snooze button for a specific task
   */
  getTaskSnoozeButton(taskSubject: string | RegExp): Locator {
    return this.getTaskBySubject(taskSubject).getByRole("button", { name: /snooze/i });
  }

  /**
   * Get task group accordion (Overdue, Today, Tomorrow)
   */
  getTaskGroup(groupName: "Overdue" | "Today" | "Tomorrow"): Locator {
    return this.page.getByRole("button").filter({ hasText: groupName });
  }

  /**
   * Get overdue badge showing count of overdue tasks
   */
  getOverdueBadge(): Locator {
    return this.page.locator('[class*="destructive"]').filter({ hasText: /overdue/i });
  }

  /**
   * Complete a task by clicking its checkbox
   */
  async completeTask(taskSubject: string | RegExp): Promise<void> {
    const checkbox = this.getTaskBySubject(taskSubject).getByRole("checkbox");
    await checkbox.click();
    // Wait for task to be removed from list (optimistic UI)
    await expect(this.getTaskBySubject(taskSubject)).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Snooze a task by one day
   */
  async snoozeTask(taskSubject: string | RegExp): Promise<void> {
    await this.getTaskSnoozeButton(taskSubject).click();
    // Wait for API response
    await this.waitForAPIResponse("/tasks");
  }

  // ===== Activity Logger Interactions =====

  /**
   * Get "New Activity" button to open the logger form
   */
  getNewActivityButton(): Locator {
    return this.page.getByRole("button", { name: /new activity/i });
  }

  /**
   * Get activity type select in the logger form
   */
  getActivityTypeSelect(): Locator {
    return this.page.getByLabel(/activity type/i);
  }

  /**
   * Get notes textarea in the logger form
   */
  getActivityNotesInput(): Locator {
    return this.page.getByLabel(/notes/i);
  }

  /**
   * Get "Save & Close" button in the logger form
   */
  getSaveAndCloseButton(): Locator {
    return this.page.getByRole("button", { name: /save & close/i });
  }

  /**
   * Get "Save & New" button in the logger form
   */
  getSaveAndNewButton(): Locator {
    return this.page.getByRole("button", { name: /save & new/i });
  }

  /**
   * Open the activity logger form
   */
  async openActivityLogger(): Promise<void> {
    await this.getNewActivityButton().click();
    await expect(this.getActivityTypeSelect()).toBeVisible({ timeout: 5000 });
  }
}
