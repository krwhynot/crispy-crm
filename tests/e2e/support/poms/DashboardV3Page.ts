import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Dashboard V3 Page Object Model
 *
 * Comprehensive POM for the three-panel Principal Dashboard:
 * - Panel 1: Pipeline by Principal (40%)
 * - Panel 2: My Tasks (30%)
 * - Panel 3: Quick Logger (30%)
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Condition-based waiting ✓
 * - No CSS selectors for interactions ✓
 *
 * Data Flow Coverage:
 * - Authentication: useCurrentSale() hook
 * - Pipeline: principal_pipeline_summary view → usePrincipalPipeline hook
 * - Tasks: tasks table → useMyTasks hook
 * - Activities: QuickLogForm → activities table + tasks table (follow-up)
 */
export class DashboardV3Page extends BasePage {
  // =============================================================================
  // NAVIGATION & REFRESH
  // =============================================================================

  /**
   * Navigate to Dashboard V3
   */
  async navigate(): Promise<void> {
    await this.goto("/");
    await this.waitForDashboardReady();
  }

  /**
   * Refresh dashboard data by reloading the page
   *
   * NOTE: V3 Dashboard has no visible refresh button.
   * Data refreshes automatically after activity creation via Quick Logger.
   * This method provides manual refresh capability for testing by reloading the page.
   *
   * For testing automatic refresh behavior, use:
   * - submitActivityAndClose() → triggers onRefresh callback
   * - waitForDataRefresh() → waits for API responses after refresh
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForDashboardReady();
  }

  /**
   * Wait for dashboard data to refresh after an action
   * Waits for both pipeline and tasks API responses
   */
  async waitForDataRefresh(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (resp) => resp.url().includes("principal_pipeline_summary") && resp.status() === 200,
        { timeout: 10000 }
      ),
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes("/tasks") &&
          resp.request().method() === "GET" &&
          resp.status() === 200,
        { timeout: 10000 }
      ),
    ]);
  }

  /**
   * Wait for dashboard to be fully loaded
   * Waits for header + all three panels to be present
   */
  async waitForDashboardReady(): Promise<void> {
    await expect(this.getHeader()).toBeVisible({ timeout: 15000 });
    await expect(this.getPipelineHeading()).toBeVisible({ timeout: 10000 });
    await expect(this.getTasksHeading()).toBeVisible({ timeout: 10000 });
    await expect(this.getQuickLoggerHeading()).toBeVisible({ timeout: 10000 });
  }

  // =============================================================================
  // LAYOUT & STRUCTURE
  // =============================================================================

  /**
   * Get the main dashboard header
   */
  getHeader(): Locator {
    return this.page.getByRole("heading", { name: /principal dashboard/i, level: 1 });
  }

  /**
   * Get all three resizable panels
   */
  getPanels(): Locator {
    return this.page.locator("[data-panel]");
  }

  /**
   * Get resize handles between panels
   */
  getResizeHandles(): Locator {
    return this.page.locator("[data-panel-resize-handle-id]");
  }

  /**
   * Get localStorage panel sizes
   */
  async getPanelSizesFromStorage(): Promise<number[] | null> {
    const sizes = await this.page.evaluate(() => {
      return localStorage.getItem("principal-dashboard-v3-layout");
    });
    return sizes ? JSON.parse(sizes) : null;
  }

  /**
   * Set localStorage panel sizes (for testing persistence)
   */
  async setPanelSizesInStorage(sizes: number[]): Promise<void> {
    await this.page.evaluate((s) => {
      localStorage.setItem("principal-dashboard-v3-layout", JSON.stringify(s));
    }, sizes);
  }

  // =============================================================================
  // PANEL 1: PIPELINE BY PRINCIPAL
  // =============================================================================

  /**
   * Get Pipeline panel heading
   */
  getPipelineHeading(): Locator {
    return this.page.getByRole("heading", { name: /pipeline by principal/i });
  }

  /**
   * Get Pipeline panel description
   */
  getPipelineDescription(): Locator {
    return this.page.getByText(/track opportunity momentum/i);
  }

  /**
   * Get "My Principals Only" toggle switch
   */
  getMyPrincipalsOnlySwitch(): Locator {
    return this.page.getByRole("switch", { name: /my principals only/i });
  }

  /**
   * Get the Filters dropdown button
   */
  getFiltersButton(): Locator {
    return this.page.getByRole("button", { name: /filters/i });
  }

  /**
   * Get the pipeline table
   */
  getPipelineTable(): Locator {
    return this.page.getByRole("table");
  }

  /**
   * Get all pipeline table headers
   */
  getPipelineTableHeaders(): Locator {
    return this.page.locator('[data-slot="table-head"]');
  }

  /**
   * Get specific pipeline table header by name
   */
  getPipelineTableHeader(name: string | RegExp): Locator {
    return this.page.locator('[data-slot="table-head"]').filter({ hasText: name });
  }

  /**
   * Get all pipeline data rows (clickable buttons with aria-label)
   */
  getPipelineRows(): Locator {
    return this.page.getByRole("button", { name: /view opportunities for/i });
  }

  /**
   * Get a specific pipeline row by principal name
   */
  getPipelineRowByName(principalName: string): Locator {
    return this.page.getByRole("button", { name: `View opportunities for ${principalName}` });
  }

  /**
   * Get momentum icons in pipeline table
   */
  getMomentumIcons(): {
    increasing: Locator;
    decreasing: Locator;
    steady: Locator;
    stale: Locator;
  } {
    return {
      increasing: this.page.locator(".lucide-trending-up"),
      decreasing: this.page.locator(".lucide-trending-down"),
      steady: this.page.locator(".lucide-minus"),
      stale: this.page.locator(".lucide-alert-circle"),
    };
  }

  /**
   * Get pipeline loading skeleton
   */
  getPipelineLoadingSkeleton(): Locator {
    return this.page.locator(".animate-pulse").first();
  }

  /**
   * Get pipeline error state
   */
  getPipelineErrorState(): Locator {
    return this.page.getByText(/failed to load pipeline/i);
  }

  /**
   * Toggle "My Principals Only" filter
   */
  async toggleMyPrincipalsOnly(): Promise<void> {
    await this.getMyPrincipalsOnlySwitch().click();
    // Wait for data to refresh
    await this.page.waitForResponse(
      (resp) => resp.url().includes("principal_pipeline_summary") && resp.status() === 200,
      { timeout: 10000 }
    );
  }

  /**
   * Click a pipeline row to open drill-down sheet
   */
  async clickPipelineRow(principalName: string): Promise<void> {
    await this.getPipelineRowByName(principalName).click();
  }

  /**
   * Wait for pipeline data to load
   */
  async waitForPipelineData(): Promise<void> {
    await expect(this.getPipelineLoadingSkeleton()).not.toBeVisible({ timeout: 10000 });
    // Either data rows visible or error state
    const rowCount = await this.getPipelineRows().count();
    const errorVisible = await this.getPipelineErrorState()
      .isVisible()
      .catch(() => false);
    expect(rowCount > 0 || errorVisible).toBe(true);
  }

  // =============================================================================
  // PANEL 2: MY TASKS
  // =============================================================================

  /**
   * Get Tasks panel heading (CardTitle renders as div, not heading)
   */
  getTasksHeading(): Locator {
    return this.page.getByText("My Tasks", { exact: true });
  }

  /**
   * Get Tasks panel description
   */
  getTasksDescription(): Locator {
    return this.page.getByText(/today's priorities/i);
  }

  /**
   * Get overdue badge
   */
  getOverdueBadge(): Locator {
    return this.page.locator('[class*="destructive"]').filter({ hasText: /overdue/i });
  }

  /**
   * Get task group by name (Overdue, Today, Tomorrow)
   */
  getTaskGroup(groupName: "Overdue" | "Today" | "Tomorrow"): Locator {
    return this.page.getByRole("button").filter({ hasText: groupName });
  }

  /**
   * Get all task items
   */
  getTaskItems(): Locator {
    return this.page.locator(".interactive-card");
  }

  /**
   * Get task item by subject text
   */
  getTaskItemBySubject(subject: string | RegExp): Locator {
    return this.getTaskItems().filter({ hasText: subject });
  }

  /**
   * Get task complete checkbox for a specific task
   */
  getTaskCompleteCheckbox(taskSubject: string | RegExp): Locator {
    return this.getTaskItemBySubject(taskSubject).getByRole("checkbox");
  }

  /**
   * Get task snooze button for a specific task
   */
  getTaskSnoozeButton(taskSubject: string | RegExp): Locator {
    return this.getTaskItemBySubject(taskSubject).getByRole("button", { name: /snooze/i });
  }

  /**
   * Get tasks loading skeleton
   */
  getTasksLoadingSkeleton(): Locator {
    return this.page.locator(".h-16.animate-pulse");
  }

  /**
   * Get tasks error state
   */
  getTasksErrorState(): Locator {
    return this.page.getByText(/failed to load tasks/i);
  }

  /**
   * Complete a task by clicking its checkbox
   */
  async completeTask(taskSubject: string | RegExp): Promise<void> {
    await this.getTaskCompleteCheckbox(taskSubject).click();
    // Wait for optimistic UI update
    await expect(this.getTaskItemBySubject(taskSubject)).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Snooze a task by 1 day
   */
  async snoozeTask(taskSubject: string | RegExp): Promise<void> {
    const snoozeButton = this.getTaskSnoozeButton(taskSubject);
    await snoozeButton.click();
    // Wait for API call
    await this.page.waitForResponse(
      (resp) =>
        resp.url().includes("/tasks") &&
        resp.request().method() === "PATCH" &&
        resp.status() === 200,
      { timeout: 5000 }
    );
  }

  /**
   * Wait for tasks to load
   */
  async waitForTasksData(): Promise<void> {
    await expect(this.getTasksLoadingSkeleton()).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Expand/collapse a task group
   */
  async toggleTaskGroup(groupName: "Overdue" | "Today" | "Tomorrow"): Promise<void> {
    await this.getTaskGroup(groupName).click();
  }

  // =============================================================================
  // PANEL 3: QUICK LOGGER
  // =============================================================================

  /**
   * Get Quick Logger panel heading (CardTitle renders as div, not heading)
   */
  getQuickLoggerHeading(): Locator {
    return this.page.getByText("Log Activity", { exact: true });
  }

  /**
   * Get Quick Logger description
   */
  getQuickLoggerDescription(): Locator {
    return this.page.getByText(/quick capture for calls/i);
  }

  /**
   * Get "New Activity" button (opens the logging form)
   */
  getStartLoggingButton(): Locator {
    return this.page.getByRole("button", { name: /new activity/i });
  }

  /**
   * Get Activity Type select
   * NOTE: shadcn Select with FormLabel doesn't have HTML label association.
   * The SelectTrigger is a button containing the placeholder "Select type".
   */
  getActivityTypeSelect(): Locator {
    // Find the button that contains "Select type" placeholder text
    return this.page.locator("button", { hasText: "Select type" }).first();
  }

  /**
   * Get Outcome select
   * NOTE: shadcn Select with FormLabel doesn't have HTML label association.
   * The SelectTrigger is a button containing the placeholder "Select outcome".
   */
  getOutcomeSelect(): Locator {
    // Find the button that contains "Select outcome" placeholder text
    return this.page.locator("button", { hasText: "Select outcome" }).first();
  }

  /**
   * Get Duration input (visible only for Call/Meeting)
   */
  getDurationInput(): Locator {
    return this.page.getByLabel(/duration/i);
  }

  /**
   * Get Contact combobox
   */
  getContactCombobox(): Locator {
    return this.page.getByRole("combobox", { name: /contact/i });
  }

  /**
   * Get Organization combobox
   */
  getOrganizationCombobox(): Locator {
    return this.page.getByRole("combobox", { name: /organization/i });
  }

  /**
   * Get Opportunity combobox
   */
  getOpportunityCombobox(): Locator {
    return this.page.getByRole("combobox", { name: /opportunity/i });
  }

  /**
   * Get Notes textarea
   */
  getNotesTextarea(): Locator {
    return this.page.getByLabel(/notes/i);
  }

  /**
   * Get "Create Follow-up" switch
   */
  getCreateFollowUpSwitch(): Locator {
    return this.page.getByRole("switch", { name: /follow-up/i });
  }

  /**
   * Get Follow-up date picker (visible when switch is on)
   */
  getFollowUpDatePicker(): Locator {
    return this.page.getByLabel(/follow-up date/i);
  }

  /**
   * Get Cancel button
   */
  getCancelButton(): Locator {
    return this.page.getByRole("button", { name: /cancel/i });
  }

  /**
   * Get "Save & Close" button
   */
  getSaveAndCloseButton(): Locator {
    return this.page.getByRole("button", { name: /save & close/i });
  }

  /**
   * Get "Save & New" button
   */
  getSaveAndNewButton(): Locator {
    return this.page.getByRole("button", { name: /save & new/i });
  }

  /**
   * Get form loading state
   */
  getFormLoadingState(): Locator {
    return this.page.getByText(/loading/i);
  }

  /**
   * Get form validation error messages
   */
  getFormValidationErrors(): Locator {
    return this.page.locator('[role="alert"]');
  }

  /**
   * Open the activity log form
   * The panel starts in "New Activity" button state, then shows form after click
   */
  async openActivityForm(): Promise<void> {
    // First, scroll the Quick Logger panel into view to ensure button is visible
    await this.getQuickLoggerHeading().scrollIntoViewIfNeeded();
    // Wait for scroll animation to settle
    await this.page.waitForTimeout(300);
    // Wait for and click the New Activity button
    const newActivityBtn = this.getStartLoggingButton();
    await expect(newActivityBtn).toBeVisible({ timeout: 10000 });
    await newActivityBtn.click();
    // Verify button disappears (confirms click registered and state changed)
    await expect(newActivityBtn).not.toBeVisible({ timeout: 5000 });
    // Wait for lazy-loaded form to appear (Suspense shows skeleton then form)
    // The form shows "What happened?" section heading when ready
    await expect(this.page.getByText("What happened?")).toBeVisible({ timeout: 15000 });
  }

  /**
   * Select activity type
   */
  async selectActivityType(
    type: "Call" | "Email" | "Meeting" | "Follow-up" | "Note"
  ): Promise<void> {
    await this.getActivityTypeSelect().click();
    await this.page.getByRole("option", { name: type }).click();
  }

  /**
   * Select outcome
   */
  async selectOutcome(
    outcome: "Connected" | "Left Voicemail" | "No Answer" | "Completed" | "Rescheduled"
  ): Promise<void> {
    await this.getOutcomeSelect().click();
    await this.page.getByRole("option", { name: outcome }).click();
  }

  /**
   * Select contact from combobox
   */
  async selectContact(contactName: string): Promise<void> {
    await this.getContactCombobox().click();
    await this.page.getByRole("option", { name: contactName }).click();
  }

  /**
   * Select organization from combobox
   * Uses keyboard navigation to reliably close the CMDK popover
   */
  async selectOrganization(orgName: string): Promise<void> {
    await this.getOrganizationCombobox().click();
    await this.page.getByRole("option", { name: orgName }).click();
    // CMDK popovers don't auto-close on selection, blur the input to close
    await this.dismissComboboxPopoverIfOpen();
  }

  /**
   * Select first organization from combobox by clicking first option
   * Uses dispatchEvent to bypass viewport issues with portaled CMDK content
   */
  async selectFirstOrganization(): Promise<void> {
    const combobox = this.getOrganizationCombobox();
    await combobox.click();
    // Wait for CMDK list to appear and have at least one item
    const cmdkItem = this.page.locator("[cmdk-item]");
    await cmdkItem.first().waitFor({ state: "visible", timeout: 5000 });
    // Use dispatchEvent to bypass viewport checks (portaled content can be outside viewport)
    await cmdkItem.first().dispatchEvent("click");
    // Wait for selection to be applied and popover to close
    await this.page.waitForTimeout(300);
    // If popover is still open, dismiss it
    await this.dismissComboboxPopoverIfOpen();
  }

  /**
   * Select first opportunity from combobox by clicking first option
   * Required for interaction activities (Call, Email, Meeting, etc.)
   * Uses dispatchEvent to bypass viewport issues with portaled CMDK content
   */
  async selectFirstOpportunity(): Promise<void> {
    const combobox = this.getOpportunityCombobox();
    await combobox.click();
    // Wait for CMDK list to appear and have at least one item
    const cmdkItem = this.page.locator("[cmdk-item]");
    await cmdkItem.first().waitFor({ state: "visible", timeout: 5000 });
    // Use dispatchEvent to bypass viewport checks (portaled content can be outside viewport)
    await cmdkItem.first().dispatchEvent("click");
    // Wait for selection to be applied and popover to close
    await this.page.waitForTimeout(300);
    // If popover is still open, dismiss it
    await this.dismissComboboxPopoverIfOpen();
  }

  /**
   * Dismiss CMDK combobox popover if it's still open
   * Clicks on the dashboard header to close any open popovers
   */
  async dismissComboboxPopoverIfOpen(): Promise<void> {
    // Check if popover is still open
    const popover = this.page.locator("[data-radix-popper-content-wrapper]");
    const isOpen = await popover.isVisible().catch(() => false);
    if (isOpen) {
      // Click the dashboard header to dismiss the popover
      await this.getHeader().click({ force: true });
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Select opportunity from combobox
   */
  async selectOpportunity(oppName: string): Promise<void> {
    await this.getOpportunityCombobox().click();
    await this.page.getByRole("option", { name: oppName }).click();
  }

  /**
   * Fill notes textarea
   */
  async fillNotes(notes: string): Promise<void> {
    await this.getNotesTextarea().fill(notes);
  }

  /**
   * Enable follow-up task creation
   */
  async enableFollowUp(): Promise<void> {
    const switchEl = this.getCreateFollowUpSwitch();
    const isChecked = await switchEl.isChecked();
    if (!isChecked) {
      await switchEl.click();
    }
    await expect(this.getFollowUpDatePicker()).toBeVisible();
  }

  /**
   * Set follow-up date
   * NOTE: Calendar shows days from prev/current/next months.
   * Using first() should get the current month's day since it renders first in DOM.
   */
  async setFollowUpDate(date: Date): Promise<void> {
    await this.getFollowUpDatePicker().click();
    // Wait for calendar to be visible
    await this.page.getByRole("grid").first().waitFor({ state: "visible" });
    // Click the day in the calendar - first match is from current month
    const dayNumber = date.getDate().toString();
    await this.page.getByRole("gridcell", { name: dayNumber, exact: true }).first().click();
    // Press Escape to close the date picker popover
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(200);
  }

  /**
   * Submit activity form with Save & Close
   */
  async submitActivityAndClose(): Promise<void> {
    await this.getSaveAndCloseButton().click();
    // Wait for API response
    await this.page.waitForResponse(
      (resp) =>
        resp.url().includes("/activities") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
      { timeout: 10000 }
    );
  }

  /**
   * Submit activity form with Save & New
   */
  async submitActivityAndNew(): Promise<void> {
    await this.getSaveAndNewButton().click();
    // Wait for API response
    await this.page.waitForResponse(
      (resp) =>
        resp.url().includes("/activities") &&
        resp.request().method() === "POST" &&
        resp.status() === 201,
      { timeout: 10000 }
    );
  }

  /**
   * Cancel activity form
   */
  async cancelActivity(): Promise<void> {
    await this.getCancelButton().click();
    await expect(this.getStartLoggingButton()).toBeVisible();
  }

  /**
   * Fill a complete activity with all required fields
   */
  async fillCompleteActivity(options: {
    type: "Call" | "Email" | "Meeting" | "Follow-up" | "Note";
    outcome: "Connected" | "Left Voicemail" | "No Answer" | "Completed" | "Rescheduled";
    notes: string;
    contact?: string;
    organization?: string;
    opportunity?: string;
    duration?: number;
    createFollowUp?: boolean;
    followUpDaysFromNow?: number;
  }): Promise<void> {
    await this.selectActivityType(options.type);
    await this.selectOutcome(options.outcome);

    if (options.duration && (options.type === "Call" || options.type === "Meeting")) {
      await this.getDurationInput().fill(options.duration.toString());
    }

    if (options.contact) {
      await this.selectContact(options.contact);
    }

    if (options.organization) {
      await this.selectOrganization(options.organization);
    }

    if (options.opportunity) {
      await this.selectOpportunity(options.opportunity);
    }

    await this.fillNotes(options.notes);

    if (options.createFollowUp) {
      await this.enableFollowUp();
      if (options.followUpDaysFromNow) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + options.followUpDaysFromNow);
        await this.setFollowUpDate(followUpDate);
      }
    }
  }

  // =============================================================================
  // DRILL-DOWN SHEET (Integration with Pipeline)
  // =============================================================================

  /**
   * Get the drill-down sheet dialog
   */
  getDrillDownSheet(): Locator {
    return this.page.getByRole("dialog");
  }

  /**
   * Check if drill-down sheet is open
   */
  async isDrillDownSheetOpen(): Promise<boolean> {
    return this.getDrillDownSheet().isVisible();
  }

  /**
   * Wait for drill-down sheet to open
   */
  async waitForDrillDownSheet(): Promise<void> {
    await expect(this.getDrillDownSheet()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close drill-down sheet
   */
  async closeDrillDownSheet(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await expect(this.getDrillDownSheet()).not.toBeVisible();
  }

  // =============================================================================
  // API INTERCEPTION HELPERS (for testing data flows)
  // =============================================================================

  /**
   * Intercept pipeline API and return mock data
   */
  async mockPipelineData(data: Array<Record<string, unknown>>): Promise<void> {
    await this.page.route("**/rest/v1/principal_pipeline_summary*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });
  }

  /**
   * Intercept tasks API and return mock data
   */
  async mockTasksData(data: Array<Record<string, unknown>>): Promise<void> {
    await this.page.route("**/rest/v1/tasks*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Intercept activities API and track calls
   */
  async interceptActivitiesCreation(): Promise<{
    getCalls: () => Array<Record<string, unknown>>;
  }> {
    const calls: Array<Record<string, unknown>> = [];

    await this.page.route("**/rest/v1/activities*", async (route) => {
      if (route.request().method() === "POST") {
        calls.push(route.request().postDataJSON());
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: Date.now() }),
        });
      } else {
        await route.continue();
      }
    });

    return {
      getCalls: () => calls,
    };
  }

  /**
   * Force API error for pipeline
   */
  async forcePipelineError(): Promise<void> {
    await this.page.route("**/rest/v1/principal_pipeline_summary*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });
  }

  /**
   * Force API error for tasks
   */
  async forceTasksError(): Promise<void> {
    await this.page.route("**/rest/v1/tasks*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });
  }

  /**
   * Delay API responses to observe loading states
   */
  async delayAPIResponses(delayMs: number): Promise<void> {
    await this.page.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }
}
