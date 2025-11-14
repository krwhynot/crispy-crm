import { test, expect } from "./support/fixtures/authenticated";

/**
 * Dashboard V2 - Activity Logging Workflow E2E Tests
 *
 * Tests the QuickLogger component for logging activities with optional follow-up tasks.
 *
 * Test Cases:
 * 1. Log activity without follow-up task
 * 2. Log activity with follow-up task
 * 3. Form validation (required fields)
 *
 * Design: docs/plans/2025-11-13-principal-dashboard-v2.md (WP 5.3)
 * Uses:
 * - authenticated fixture (automatic login + console monitoring)
 * - Condition-based waiting (no arbitrary timeouts)
 * - Semantic selectors (getByRole, getByLabel, getByText)
 */

test.describe("Dashboard V2 - Activity Logging", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to dashboard V2
    await authenticatedPage.goto("/?layout=v2");

    // Wait for QuickLogger column to be visible
    await expect(authenticatedPage.locator("#col-logger")).toBeVisible({ timeout: 10000 });
  });

  test("logs activity without follow-up task", async ({ authenticatedPage }) => {
    // Select a principal from dropdown
    const principalSelect = authenticatedPage.getByRole("combobox", { name: /principal/i });
    await principalSelect.click();

    // Select first principal in list
    const firstPrincipal = authenticatedPage.getByRole("option").first();
    await firstPrincipal.click();

    // Wait for QuickLogger form to be visible
    const form = authenticatedPage.getByRole("form", { name: /quick activity logger/i });
    await expect(form).toBeVisible();

    // Select Call activity type (first button)
    const callButton = authenticatedPage.getByRole("button", { name: /log call/i });
    await callButton.click();

    // Fill in subject (required field)
    const subjectInput = authenticatedPage.getByRole("textbox", { name: /subject/i });
    await subjectInput.fill("Follow up on pricing");

    // Fill in description (optional)
    const descriptionInput = authenticatedPage.getByRole("textbox", { name: /description/i });
    await descriptionInput.fill("Discussed Q4 pricing strategy");

    // Submit the form
    const submitButton = authenticatedPage.getByRole("button", { name: /log activity/i });
    await submitButton.click();

    // Verify success notification appears
    await expect(authenticatedPage.getByText(/activity logged/i)).toBeVisible({ timeout: 5000 });

    // Verify form is cleared (subject should be empty)
    await expect(subjectInput).toHaveValue("");
  });

  test("logs activity with follow-up task", async ({ authenticatedPage }) => {
    // Select a principal
    const principalSelect = authenticatedPage.getByRole("combobox", { name: /principal/i });
    await principalSelect.click();
    const firstPrincipal = authenticatedPage.getByRole("option").first();
    await firstPrincipal.click();

    // Wait for QuickLogger form
    const form = authenticatedPage.getByRole("form", { name: /quick activity logger/i });
    await expect(form).toBeVisible();

    // Select Meeting activity type (third button)
    const meetingButton = authenticatedPage.getByRole("button", { name: /log meeting/i });
    await meetingButton.click();

    // Fill in activity details
    await authenticatedPage.getByRole("textbox", { name: /subject/i }).fill("Quarterly review");
    await authenticatedPage
      .getByRole("textbox", { name: /description/i })
      .fill("Reviewed Q4 performance and Q1 goals");

    // Check the "Create follow-up task" checkbox
    const followUpCheckbox = authenticatedPage.getByRole("checkbox", {
      name: /create follow-up task/i,
    });
    await followUpCheckbox.check();

    // Progressive disclosure: Task fields should now be visible
    const taskTitleInput = authenticatedPage.getByRole("textbox", { name: /task title/i });
    await expect(taskTitleInput).toBeVisible();

    // Fill in task details
    await taskTitleInput.fill("Send meeting notes");

    // Fill in due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    const dueDateInput = authenticatedPage.getByLabel(/due date/i);
    await dueDateInput.fill(tomorrowStr);

    // Select priority (high)
    const prioritySelect = authenticatedPage.getByRole("combobox", { name: /priority/i });
    await prioritySelect.click();
    await authenticatedPage.getByRole("option", { name: /high/i }).click();

    // Submit the form
    await authenticatedPage.getByRole("button", { name: /log activity/i }).click();

    // Verify success notification includes task creation
    await expect(
      authenticatedPage.getByText(/activity \+ task created/i)
    ).toBeVisible({ timeout: 5000 });

    // Verify task appears in Tasks column
    const tasksColumn = authenticatedPage.locator("#col-tasks");
    await expect(tasksColumn.getByText("Send meeting notes")).toBeVisible({ timeout: 5000 });
  });

  test("validates required fields", async ({ authenticatedPage }) => {
    // Select a principal
    const principalSelect = authenticatedPage.getByRole("combobox", { name: /principal/i });
    await principalSelect.click();
    const firstPrincipal = authenticatedPage.getByRole("option").first();
    await firstPrincipal.click();

    // Wait for QuickLogger form
    const form = authenticatedPage.getByRole("form", { name: /quick activity logger/i });
    await expect(form).toBeVisible();

    // Try to submit empty form (subject is required)
    const subjectInput = authenticatedPage.getByRole("textbox", { name: /subject/i });
    await subjectInput.clear();

    const submitButton = authenticatedPage.getByRole("button", { name: /log activity/i });
    await submitButton.click();

    // Browser validation should prevent submission (HTML5 required attribute)
    // Verify subject field has required attribute
    const isRequired = await subjectInput.getAttribute("required");
    expect(isRequired).not.toBeNull();

    // Fill in subject
    await subjectInput.fill("Test activity");

    // Now check follow-up task validation
    const followUpCheckbox = authenticatedPage.getByRole("checkbox", {
      name: /create follow-up task/i,
    });
    await followUpCheckbox.check();

    // Task title and due date are required when checkbox is checked
    const taskTitleInput = authenticatedPage.getByRole("textbox", { name: /task title/i });
    await expect(taskTitleInput).toBeVisible();

    // Try to submit without task details
    await submitButton.click();

    // Verify task title and due date have required attributes
    const taskTitleRequired = await taskTitleInput.getAttribute("required");
    expect(taskTitleRequired).not.toBeNull();

    const dueDateInput = authenticatedPage.getByLabel(/due date/i);
    const dueDateRequired = await dueDateInput.getAttribute("required");
    expect(dueDateRequired).not.toBeNull();

    // Fill in task details
    await taskTitleInput.fill("Follow-up task");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    await dueDateInput.fill(tomorrowStr);

    // Now submission should work
    await submitButton.click();

    // Verify success
    await expect(
      authenticatedPage.getByText(/activity \+ task created/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows placeholder when no principal selected", async ({ authenticatedPage }) => {
    // QuickLogger should show placeholder text when no principal is selected
    const placeholder = authenticatedPage.getByText(/select a principal to log activity/i);
    await expect(placeholder).toBeVisible();

    // Form should not be visible
    const form = authenticatedPage.getByRole("form", { name: /quick activity logger/i });
    await expect(form).not.toBeVisible();
  });
});
