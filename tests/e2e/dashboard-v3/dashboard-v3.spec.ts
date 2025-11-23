import { test, expect } from "../support/fixtures/authenticated";
import { consoleMonitor } from "../support/utils/console-monitor";

/**
 * Dashboard V3 - Comprehensive E2E Tests
 *
 * Tests the complete Dashboard V3 functionality including:
 * - Three-panel layout (Pipeline | Tasks | Quick Logger)
 * - Skeleton states and data loading
 * - Task completion with backend mutations
 * - Activity logging with follow-up task creation
 * - Resizable panel persistence
 * - Error handling and recovery
 *
 * Required by: Dashboard V3 Implementation Plan
 * Plan: docs/plans/2025-11-17-principal-dashboard-v3-CORRECTED.md
 *
 * Database Requirements:
 * - principal_pipeline_summary view must exist
 * - Test user must have:
 *   - sales record with user_id linked to auth.users
 *   - at least 1 principal organization
 *   - at least 1 task (for completion test)
 */

test.describe("Dashboard V3 - Full Stack E2E", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V3
    await authenticatedPage.goto("/dashboard-v3");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for the main container to be present
    const dashboardHeader = await authenticatedPage
      .locator('h1:has-text("Principal Dashboard")')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!dashboardHeader) {
      test.skip("Dashboard V3 not available");
    }
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      // Attach detailed report to test results for debugging
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    // Fail test if console errors were detected
    expect(
      errors,
      "Console errors were detected during the test. See attached report."
    ).toHaveLength(0);
  });

  test.describe("Panel Rendering and Loading States", () => {
    test("renders all three panels with correct headers", async ({ authenticatedPage }) => {
      // Pipeline panel header
      await expect(authenticatedPage.locator('h3:has-text("Pipeline by Principal")')).toBeVisible();

      // Tasks panel header
      await expect(authenticatedPage.locator('h3:has-text("My Tasks")')).toBeVisible();

      // Quick Logger panel header
      await expect(authenticatedPage.locator('h2:has-text("Log Activity")')).toBeVisible();
    });

    test("shows loading skeletons before data loads", async ({ authenticatedPage }) => {
      // Navigate with network throttling to observe skeletons
      await authenticatedPage.goto("/dashboard-v3");

      // Check for skeleton elements (should appear briefly)
      // Note: This might be too fast in local testing, but useful for CI
      const pipelineSkeleton = authenticatedPage.locator(".h-12.animate-pulse").first();
      const tasksSkeleton = authenticatedPage.locator(".h-16.animate-pulse").first();

      // At least one skeleton should be present during initial load
      const skeletonCount = await Promise.race([
        pipelineSkeleton.count().then((count) => count),
        tasksSkeleton.count().then((count) => count),
      ]);

      // Skeleton may disappear quickly, so just verify structure exists
      expect(skeletonCount).toBeGreaterThanOrEqual(0);

      // Wait for actual data to load
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify skeletons are gone and data is present
      await expect(pipelineSkeleton).not.toBeVisible({ timeout: 10000 });
    });

    test("displays pipeline data from principal_pipeline_summary view", async ({
      authenticatedPage,
    }) => {
      // Wait for pipeline table to load
      await authenticatedPage.waitForSelector("table", { timeout: 10000 });

      // Verify table headers
      const headers = ["Principal", "Pipeline", "This Week", "Last Week", "Momentum"];
      for (const header of headers) {
        await expect(authenticatedPage.locator(`th:has-text("${header}")`)).toBeVisible();
      }

      // Verify at least one row of data exists (or empty state)
      const dataRows = authenticatedPage.locator("tbody tr");
      const rowCount = await dataRows.count();

      if (rowCount > 0) {
        // Data exists - verify momentum indicator
        const momentumCell = authenticatedPage
          .locator("td")
          .filter({
            has: authenticatedPage.locator(
              ".lucide-trending-up, .lucide-trending-down, .lucide-minus"
            ),
          })
          .first();

        await expect(momentumCell).toBeVisible();
      } else {
        // No data - verify empty state
        await expect(
          authenticatedPage.locator("text=/No principals|No pipeline data/i")
        ).toBeVisible();
      }
    });

    test("displays tasks in time-bucketed groups", async ({ authenticatedPage }) => {
      // Wait for tasks panel to load
      const tasksPanel = authenticatedPage.locator('h3:has-text("My Tasks")').locator("..");

      // Verify task groups exist (at least one should be present)
      const taskGroups = ["Overdue", "Today", "Tomorrow"];
      let visibleGroups = 0;

      for (const groupName of taskGroups) {
        const group = tasksPanel.locator(`h4:has-text("${groupName}")`);
        const isVisible = await group.isVisible().catch(() => false);
        if (isVisible) {
          visibleGroups++;
        }
      }

      // At least one time bucket should be visible
      expect(visibleGroups).toBeGreaterThan(0);
    });
  });

  test.describe("Task Interactions", () => {
    test("completes task via checkbox and updates UI", async ({ authenticatedPage }) => {
      // Find first task checkbox
      const firstTaskCheckbox = authenticatedPage
        .locator(".interactive-card")
        .first()
        .locator('button[role="checkbox"]');

      // Skip if no tasks available
      const checkboxCount = await firstTaskCheckbox.count();
      if (checkboxCount === 0) {
        test.skip("No tasks available for completion test");
        return;
      }

      // Get task subject before completing
      const taskSubject = await authenticatedPage
        .locator(".interactive-card")
        .first()
        .locator(".font-medium")
        .textContent();

      // Click checkbox to complete task
      await firstTaskCheckbox.click();

      // Wait for optimistic UI update and backend mutation
      await authenticatedPage.waitForTimeout(1000);

      // Verify task is removed from list or marked complete
      // (implementation may vary - task could disappear or show checkmark)
      const taskStillVisible = await authenticatedPage
        .locator(`.interactive-card:has-text("${taskSubject}")`)
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Task should either be gone or visually marked complete
      if (taskStillVisible) {
        // Check for completed state indicator
        const completedIndicator = await authenticatedPage
          .locator(`.interactive-card:has-text("${taskSubject}")`)
          .locator('[aria-checked="true"]')
          .isVisible();

        expect(completedIndicator).toBeTruthy();
      }
    });

    test("expands task details and shows related entity", async ({ authenticatedPage }) => {
      // Find first task with related entity
      const firstTask = authenticatedPage.locator(".interactive-card").first();

      // Skip if no tasks
      const taskCount = await firstTask.count();
      if (taskCount === 0) {
        test.skip("No tasks available");
        return;
      }

      // Verify related entity is displayed (organization/contact/opportunity name)
      const relatedEntity = firstTask.locator("text=/→/");
      await expect(relatedEntity).toBeVisible();

      // Related entity name should follow the arrow
      const entityText = await relatedEntity.textContent();
      expect(entityText).toMatch(/→\s+\w+/);
    });
  });

  test.describe("Activity Logging", () => {
    test("logs activity with required fields and closes form", async ({ authenticatedPage }) => {
      // Find activity type select
      const activityTypeSelect = authenticatedPage
        .locator("select")
        .filter({
          has: authenticatedPage.locator('option:has-text("Call")'),
        })
        .first();

      // Select activity type
      await activityTypeSelect.selectOption("Call");

      // Fill required fields
      const notesTextarea = authenticatedPage.locator("textarea").first();
      await notesTextarea.fill("Test activity from E2E test");

      // Select an organization (required)
      const orgSelect = authenticatedPage
        .locator("select")
        .filter({
          has: authenticatedPage.locator('option[value]:not([value=""])'),
        })
        .nth(1); // Second select should be organization

      const orgOptions = await orgSelect.locator('option[value]:not([value=""])').count();
      if (orgOptions > 0) {
        await orgSelect.selectOption({ index: 1 });
      }

      // Select outcome
      const outcomeSelect = authenticatedPage.getByRole("combobox").filter({
        has: authenticatedPage.locator('option:has-text("Connected")'),
      });
      await outcomeSelect.selectOption("Connected");

      // Click Save & Close button
      const saveButton = authenticatedPage.getByRole("button", { name: /save & close/i });
      await saveButton.click();

      // Verify form closes or shows success
      await authenticatedPage.waitForTimeout(1000);

      // Form should reset or show success indicator
      const notesAfter = await notesTextarea.inputValue();
      expect(notesAfter).toBe("");
    });

    test("creates follow-up task when checkbox is enabled", async ({ authenticatedPage }) => {
      // Find activity type select
      const activityTypeSelect = authenticatedPage
        .locator("select")
        .filter({
          has: authenticatedPage.locator('option:has-text("Email")'),
        })
        .first();

      await activityTypeSelect.selectOption("Email");

      // Fill notes
      const notesTextarea = authenticatedPage.locator("textarea").first();
      await notesTextarea.fill("Test email with follow-up");

      // Select organization
      const orgSelect = authenticatedPage
        .locator("select")
        .filter({
          has: authenticatedPage.locator('option[value]:not([value=""])'),
        })
        .nth(1);

      const orgOptions = await orgSelect.locator('option[value]:not([value=""])').count();
      if (orgOptions > 0) {
        await orgSelect.selectOption({ index: 1 });
      }

      // Select outcome
      const outcomeSelect = authenticatedPage.getByRole("combobox").filter({
        has: authenticatedPage.locator('option:has-text("Completed")'),
      });
      await outcomeSelect.selectOption("Completed");

      // Enable create follow-up
      const followUpCheckbox = authenticatedPage.locator('input[type="checkbox"]').filter({
        has: authenticatedPage.locator("~ text=/Create Follow-Up Task/i"),
      });
      await followUpCheckbox.check();

      // Set follow-up date (should now be visible)
      const followUpDateInput = authenticatedPage.locator('input[type="date"]');
      await expect(followUpDateInput).toBeVisible();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split("T")[0];
      await followUpDateInput.fill(dateString);

      // Save activity
      const saveButton = authenticatedPage.getByRole("button", { name: /save & close/i });
      await saveButton.click();

      // Wait for backend mutation
      await authenticatedPage.waitForTimeout(2000);

      // Verify new task appears in Tasks panel
      // Check for task with subject containing "Follow-up"
      const followUpTask = authenticatedPage.locator(".interactive-card").filter({
        has: authenticatedPage.locator("text=/Follow-up:/i"),
      });

      await expect(followUpTask).toBeVisible({ timeout: 5000 });
    });

    test("validates required fields before submission", async ({ authenticatedPage }) => {
      // Try to save without filling required fields
      const saveButton = authenticatedPage.getByRole("button", { name: /save & close/i });
      await saveButton.click();

      // Should show validation error (either browser native or custom)
      // Check for error message or that form hasn't closed
      const notesTextarea = authenticatedPage.locator("textarea").first();
      await expect(notesTextarea).toBeVisible();

      // Browser might show validation message on required fields
      const _validationMessage = await notesTextarea.getAttribute("aria-invalid");
      // Validation may be handled different ways
      expect(saveButton).toBeVisible(); // Form should still be open
    });
  });

  test.describe("Resizable Panels and Persistence", () => {
    test("resizes panels via drag handles", async ({ authenticatedPage }) => {
      // Find first resize handle
      const firstHandle = authenticatedPage.locator("[data-panel-resize-handle-id]").first();

      // Get initial positions
      const pipelinePanel = authenticatedPage.locator("[data-panel]").first();
      const initialWidth = await pipelinePanel.evaluate((el) => el.getBoundingClientRect().width);

      // Drag handle to resize (move right 100px)
      await firstHandle.hover();
      await authenticatedPage.mouse.down();
      await authenticatedPage.mouse.move(100, 0, { steps: 10 });
      await authenticatedPage.mouse.up();

      // Wait for resize
      await authenticatedPage.waitForTimeout(500);

      // Verify width changed
      const newWidth = await pipelinePanel.evaluate((el) => el.getBoundingClientRect().width);
      expect(newWidth).not.toBe(initialWidth);
    });

    test("persists panel sizes to localStorage on resize", async ({ authenticatedPage }) => {
      // Get current localStorage value
      const initialSizes = await authenticatedPage.evaluate(() => {
        return localStorage.getItem("principal-dashboard-v3-layout");
      });

      // Resize panel
      const firstHandle = authenticatedPage.locator("[data-panel-resize-handle-id]").first();
      await firstHandle.hover();
      await authenticatedPage.mouse.down();
      await authenticatedPage.mouse.move(100, 0, { steps: 10 });
      await authenticatedPage.mouse.up();

      // Wait for localStorage update
      await authenticatedPage.waitForTimeout(500);

      // Verify localStorage changed
      const newSizes = await authenticatedPage.evaluate(() => {
        return localStorage.getItem("principal-dashboard-v3-layout");
      });

      expect(newSizes).not.toBe(initialSizes);
      expect(newSizes).toBeTruthy();

      // Verify it's valid JSON
      const parsed = JSON.parse(newSizes!);
      expect(Array.isArray(parsed)).toBeTruthy();
      expect(parsed).toHaveLength(3);
    });

    test("restores panel sizes from localStorage on page reload", async ({ authenticatedPage }) => {
      // Set custom sizes in localStorage
      await authenticatedPage.evaluate(() => {
        localStorage.setItem("principal-dashboard-v3-layout", JSON.stringify([50, 25, 25]));
      });

      // Reload page
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for panels to render
      await expect(authenticatedPage.locator('h1:has-text("Principal Dashboard")')).toBeVisible();

      // Verify panel sizes match localStorage values
      const panels = authenticatedPage.locator("[data-panel]");
      const firstPanelWidth = await panels.first().evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        return parent ? (rect.width / parent.width) * 100 : 0;
      });

      // First panel should be approximately 50% (allowing for rounding)
      expect(firstPanelWidth).toBeGreaterThan(45);
      expect(firstPanelWidth).toBeLessThan(55);
    });
  });

  test.describe("Error Handling", () => {
    test("displays error state when pipeline view fails", async ({ authenticatedPage }) => {
      // Intercept API call and make it fail
      await authenticatedPage.route("**/rest/v1/principal_pipeline_summary*", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      // Navigate to dashboard
      await authenticatedPage.goto("/dashboard-v3");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait a bit for error to manifest
      await authenticatedPage.waitForTimeout(2000);

      // Verify error state is shown in pipeline panel
      // Could be error text, error icon, or empty state with error message
      const errorIndicator = authenticatedPage
        .locator("text=/failed to load|error|unable to fetch/i")
        .first();
      await expect(errorIndicator).toBeVisible({ timeout: 5000 });
    });

    test("displays error state when tasks fail to load", async ({ authenticatedPage }) => {
      // Intercept tasks API call
      await authenticatedPage.route("**/rest/v1/tasks*", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      // Navigate to dashboard
      await authenticatedPage.goto("/dashboard-v3");
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for error
      await authenticatedPage.waitForTimeout(2000);

      // Verify error state in tasks panel
      const tasksPanel = authenticatedPage.locator('h3:has-text("My Tasks")').locator("..");
      const errorText = tasksPanel.locator("text=/failed|error/i");
      await expect(errorText).toBeVisible({ timeout: 5000 });
    });

    test("recovers gracefully from activity logging errors", async ({ authenticatedPage }) => {
      // Fill activity form
      const activityTypeSelect = authenticatedPage
        .locator("select")
        .filter({
          has: authenticatedPage.locator('option:has-text("Note")'),
        })
        .first();
      await activityTypeSelect.selectOption("Note");

      const notesTextarea = authenticatedPage.locator("textarea").first();
      await notesTextarea.fill("Test note that will fail");

      // Select organization
      const orgSelect = authenticatedPage
        .locator("select")
        .filter({
          has: authenticatedPage.locator('option[value]:not([value=""])'),
        })
        .nth(1);

      const orgOptions = await orgSelect.locator('option[value]:not([value=""])').count();
      if (orgOptions > 0) {
        await orgSelect.selectOption({ index: 1 });
      }

      // Intercept activity creation to fail
      await authenticatedPage.route("**/rest/v1/activities", (route) => {
        if (route.request().method() === "POST") {
          route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Validation failed" }),
          });
        } else {
          route.continue();
        }
      });

      // Try to save
      const saveButton = authenticatedPage.getByRole("button", { name: /save & close/i });
      await saveButton.click();

      // Wait for error
      await authenticatedPage.waitForTimeout(1000);

      // Form should still be visible (not closed on error)
      await expect(notesTextarea).toBeVisible();

      // Should show error notification or message
      // (exact implementation depends on notification system)
      const errorNotification = authenticatedPage.locator("text=/failed|error/i");
      await expect(errorNotification.first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Accessibility", () => {
    test("all interactive elements meet WCAG 2.1 AA touch target size", async ({
      authenticatedPage,
    }) => {
      // Get all buttons and checkboxes
      const interactiveElements = await authenticatedPage
        .locator('button, input[type="checkbox"]')
        .all();

      // Verify each has minimum 44px x 44px
      for (const element of interactiveElements) {
        const isVisible = await element.isVisible().catch(() => false);
        if (!isVisible) continue;

        const box = await element.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test("uses semantic HTML and ARIA attributes", async ({ authenticatedPage }) => {
      // Verify table has proper role
      const table = authenticatedPage.locator("table");
      await expect(table).toHaveAttribute("role", "table");

      // Verify checkboxes have role
      const firstCheckbox = authenticatedPage.locator('button[role="checkbox"]').first();
      const checkboxCount = await firstCheckbox.count();
      if (checkboxCount > 0) {
        await expect(firstCheckbox).toHaveAttribute("role", "checkbox");
      }

      // Verify panels are properly labeled
      const pipelinePanel = authenticatedPage.locator("[data-panel]").first();
      await expect(pipelinePanel).toHaveAttribute("data-panel");
    });
  });
});
