import { test, expect } from "@playwright/test";
import { LoginPage } from "../../support/poms/LoginPage";
import { TasksListPage } from "../../support/poms/TasksListPage";
import { TaskFormPage } from "../../support/poms/TaskFormPage";
import { TaskShowPage } from "../../support/poms/TaskShowPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for Tasks CRUD operations
 * Tests create, read, update, and delete functionality
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs) ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting (no waitForTimeout except validation test) ✓
 * - Timestamp-based test data for isolation ✓
 *
 * NOTE: Using inline login via POM instead of fixtures due to setup auth issues
 * This is acceptable as it still uses POMs and avoids code duplication
 */

test.describe("Tasks CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Login using POM (semantic selectors, no CSS)
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
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("CREATE - Create a new task", async ({ page }) => {
    // Generate unique test data with timestamp
    const timestamp = Date.now();
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 7 days from now

    const testTask = {
      title: `Test Task ${timestamp}`,
      dueDate: futureDate,
      priority: "high" as const,
      type: "Call",
      description: `Test description for task ${timestamp}`,
    };

    // Initialize POMs
    const listPage = new TasksListPage(page);
    const formPage = new TaskFormPage(page);
    const showPage = new TaskShowPage(page);

    // Navigate to tasks list
    await listPage.navigate();

    // Click Create button
    await listPage.clickCreate();

    // Fill and submit form
    await formPage.createTask(testTask);

    // Verify task was created
    await showPage.expectTaskVisible({
      title: testTask.title,
      priority: testTask.priority,
      type: testTask.type,
    });

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("READ - View task list", async ({ page }) => {
    const listPage = new TasksListPage(page);

    // Navigate to tasks list
    await listPage.navigate();

    // Verify at least one task is visible (from seed data or previous tests)
    await listPage.expectTasksVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("READ - View task details", async ({ page }) => {
    const listPage = new TasksListPage(page);
    const showPage = new TaskShowPage(page);

    // Navigate to tasks list
    await listPage.navigate();

    // Click on first task
    await listPage.clickFirstTask();

    // Verify task details page loaded
    await showPage.expectPageLoaded();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("UPDATE - Edit a task", async ({ page }) => {
    // Generate unique test data with timestamp
    const timestamp = Date.now();
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const originalTask = {
      title: `Original Task ${timestamp}`,
      dueDate: futureDate,
      priority: "medium" as const,
      type: "Email",
      description: `Original description ${timestamp}`,
    };

    const updatedData = {
      title: `Updated Task ${timestamp}`,
      priority: "critical" as const,
      description: `Updated description ${timestamp}`,
    };

    // Initialize POMs
    const listPage = new TasksListPage(page);
    const formPage = new TaskFormPage(page);
    const showPage = new TaskShowPage(page);

    // Create a task first
    await listPage.navigate();
    await listPage.clickCreate();
    await formPage.createTask(originalTask);

    // Now edit it
    await showPage.clickEdit();
    await formPage.updateTask(updatedData);

    // Verify updates
    await showPage.expectTitleVisible(updatedData.title);
    await showPage.expectDescriptionVisible(updatedData.description);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("DELETE - Delete a task", async ({ page }) => {
    // Generate unique test data with timestamp
    const timestamp = Date.now();
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const deleteTask = {
      title: `Delete Task ${timestamp}`,
      dueDate: futureDate,
      priority: "low" as const,
      type: "Meeting",
    };

    // Initialize POMs
    const listPage = new TasksListPage(page);
    const formPage = new TaskFormPage(page);
    const showPage = new TaskShowPage(page);

    // Create a task specifically for deletion
    await listPage.navigate();
    await listPage.clickCreate();
    await formPage.createTask(deleteTask);

    // Delete it
    await showPage.deleteTask();

    // Verify redirect to list
    await expect(page).toHaveURL("/#/tasks");

    // Verify task is no longer visible
    await listPage.expectTaskNotVisible(deleteTask.title);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("VALIDATION - Form validation prevents submission without required fields", async ({
    page,
  }) => {
    const listPage = new TasksListPage(page);
    const formPage = new TaskFormPage(page);

    // Navigate to create page
    await listPage.navigate();
    await listPage.clickCreate();

    // Try to submit without filling required fields (title and due_date)
    await formPage.attemptSubmit();

    // Verify we're still on create page (validation prevented submission)
    await formPage.expectStillOnForm(true);

    // Note: Console errors might include validation errors, which is expected
    // We only check for RLS errors (unexpected in this context)
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
  });
});
