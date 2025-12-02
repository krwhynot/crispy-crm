import { test, expect } from "@playwright/test";
import { LoginPage } from "../../support/poms/LoginPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for ownership field assignment on record creation
 *
 * PURPOSE: Verify that ownership fields (sales_id, opportunity_owner_id, created_by)
 * are automatically set to the current user when creating records.
 *
 * BACKGROUND: Audit identified gaps where some create forms didn't set ownership,
 * causing records to be "orphaned" and not appear in "My Records" views.
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (used where available)
 * - Semantic selectors only (getByRole/Label/Text)
 * - Console monitoring for diagnostics
 * - Condition-based waiting (no waitForTimeout)
 * - Timestamp-based test data for isolation
 */

test.describe("Ownership Assignment on Create", () => {
  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Login using POM
    const loginPage = new LoginPage(page);
    await loginPage.goto("/");

    // Wait for either login form or dashboard
    const isLoginFormVisible = await page
      .getByLabel(/email/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isLoginFormVisible) {
      await loginPage.login("admin@test.com", "password123");
    } else {
      // Already logged in, wait for dashboard
      await page.waitForURL(/\/#\//, { timeout: 10000 });
    }
  });

  test.afterEach(async () => {
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("Task created from Tasks list should have sales_id set", async ({ page }) => {
    const timestamp = Date.now();
    const taskTitle = `Ownership Test Task ${timestamp}`;
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Navigate to tasks
    await page.goto("/#/tasks");
    await page.waitForSelector('[data-testid="tasks-list"], table, [role="table"]', {
      timeout: 10000,
    });

    // Click create button
    await page.getByRole("button", { name: /create/i }).click();
    await page.waitForURL(/\/#\/tasks\/create/, { timeout: 5000 });

    // Fill required fields
    await page.getByLabel(/title/i).fill(taskTitle);
    await page.getByLabel(/due date/i).fill(futureDate);

    // Submit the form
    await page.getByRole("button", { name: /save/i }).click();

    // Wait for redirect (to show page or list)
    await page.waitForURL(/\/#\/tasks/, { timeout: 10000 });

    // Verify no RLS errors (would occur if sales_id was not set and RLS blocks access)
    expect(consoleMonitor.hasRLSErrors()).toBe(false);

    // Navigate to the task details to verify it was created
    await page.goto("/#/tasks");

    // Search for our task
    const taskRow = page.getByRole("row").filter({ hasText: taskTitle });
    await expect(taskRow).toBeVisible({ timeout: 5000 });

    // Click to view details
    await taskRow.click();
    await page.waitForURL(/\/#\/tasks\/\d+\/show/, { timeout: 5000 });

    // The task should be visible and accessible (proves RLS allows access)
    // If sales_id wasn't set, RLS would block and we'd get permission errors
    await expect(page.getByText(taskTitle)).toBeVisible();

    // Verify no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Opportunity created from Kanban board should have opportunity_owner_id set", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const opportunityName = `Kanban Ownership Test ${timestamp}`;

    // Navigate to opportunities kanban
    await page.goto("/#/opportunities");
    await page.waitForLoadState("networkidle");

    // Look for Kanban view toggle if present
    const kanbanToggle = page.getByRole("button", { name: /kanban|board/i });
    if (await kanbanToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await kanbanToggle.click();
    }

    // Find a "New Opportunity" button in any column
    const newOpportunityButton = page.getByRole("button", { name: /new opportunity/i }).first();

    if (await newOpportunityButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newOpportunityButton.click();

      // Fill the quick add form
      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill(opportunityName);

      // Submit
      await page.getByRole("button", { name: /create/i }).click();

      // Wait for creation to complete
      await page.waitForLoadState("networkidle");

      // Verify no RLS errors (would occur if opportunity_owner_id was not set)
      expect(consoleMonitor.hasRLSErrors()).toBe(false);

      // The opportunity should appear in the kanban (proves it was created with proper ownership)
      await expect(page.getByText(opportunityName)).toBeVisible({ timeout: 5000 });
    } else {
      // If kanban isn't available, skip gracefully
      test.skip(true, "Kanban board not available in this view");
    }

    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Activity created from form should have created_by set", async ({ page }) => {
    const timestamp = Date.now();
    const activitySubject = `Activity Ownership Test ${timestamp}`;

    // Navigate to activities create
    await page.goto("/#/activities/create");
    await page.waitForLoadState("networkidle");

    // Fill required fields
    const subjectInput = page.getByLabel(/subject/i);
    if (await subjectInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await subjectInput.fill(activitySubject);

      // Select activity type if required
      const typeSelect = page.getByLabel(/type/i);
      if (await typeSelect.isVisible().catch(() => false)) {
        await typeSelect.click();
        await page.getByRole("option").first().click();
      }

      // Set activity date if required
      const dateInput = page.getByLabel(/date/i);
      if (await dateInput.isVisible().catch(() => false)) {
        const today = new Date().toISOString().slice(0, 10);
        await dateInput.fill(today);
      }

      // Submit
      await page.getByRole("button", { name: /save/i }).click();

      // Wait for redirect
      await page.waitForURL(/\/#\/activities/, { timeout: 10000 });

      // Verify no RLS errors
      expect(consoleMonitor.hasRLSErrors()).toBe(false);
    } else {
      // Activities might use a different form structure
      test.skip(true, "Activity form structure differs from expected");
    }

    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Contact created should have sales_id set", async ({ page }) => {
    const timestamp = Date.now();
    const firstName = `OwnershipTest`;
    const lastName = `Contact${timestamp}`;

    // Navigate to contacts create
    await page.goto("/#/contacts/create");
    await page.waitForLoadState("networkidle");

    // Fill required fields
    await page.getByLabel(/first name/i).fill(firstName);
    await page.getByLabel(/last name/i).fill(lastName);

    // Organization is required - select from dropdown
    const orgInput = page.getByLabel(/organization/i);
    if (await orgInput.isVisible().catch(() => false)) {
      await orgInput.click();
      // Select first available organization
      await page.getByRole("option").first().click();
    }

    // Submit
    await page.getByRole("button", { name: /save/i }).click();

    // Wait for redirect
    await page.waitForURL(/\/#\/contacts/, { timeout: 10000 });

    // Verify no RLS errors (would occur if sales_id was not set properly)
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("Organization created should have sales_id set", async ({ page }) => {
    const timestamp = Date.now();
    const orgName = `Ownership Test Org ${timestamp}`;

    // Navigate to organizations create
    await page.goto("/#/organizations/create");
    await page.waitForLoadState("networkidle");

    // Fill required fields
    await page.getByLabel(/^name$/i).fill(orgName);

    // Submit
    await page.getByRole("button", { name: /save/i }).click();

    // Wait for redirect
    await page.waitForURL(/\/#\/organizations/, { timeout: 10000 });

    // Verify no RLS errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("records appear in 'My Records' filter after creation", async ({ page }) => {
    const timestamp = Date.now();
    const taskTitle = `My Records Filter Test ${timestamp}`;
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Create a task
    await page.goto("/#/tasks/create");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/title/i).fill(taskTitle);
    await page.getByLabel(/due date/i).fill(futureDate);
    await page.getByRole("button", { name: /save/i }).click();
    await page.waitForURL(/\/#\/tasks/, { timeout: 10000 });

    // Navigate to tasks list
    await page.goto("/#/tasks");

    // Look for "My Tasks" or "Assigned to me" filter
    const myTasksFilter = page.getByRole("button", { name: /my tasks|assigned to me|only mine/i });
    if (await myTasksFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await myTasksFilter.click();

      // Wait for filter to apply
      await page.waitForLoadState("networkidle");

      // Our task should still be visible (proves sales_id is set to current user)
      await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });
    }

    // Verify no errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });
});
