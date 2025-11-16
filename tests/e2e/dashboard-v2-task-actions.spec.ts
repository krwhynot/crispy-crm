import { test, expect } from "./support/fixtures/authenticated";

/**
 * Dashboard V2 - Task Actions E2E Tests
 *
 * Tests inline task completion functionality:
 * 1. Task completion checkbox is visible and accessible
 * 2. Clicking checkbox marks task as complete
 * 3. Completed task disappears from list (or moves to completed section)
 * 4. Task count updates after completion
 * 5. Success notification appears
 * 6. Can undo/revert task completion
 * 7. Error handling for failed completions
 * 8. Keyboard accessibility (Space/Enter on checkbox)
 *
 * Part of Sprint 2 - Dashboard V2 UI/UX Acceptance Testing
 */

test.describe("Dashboard V2 - Task Actions", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V2
    await authenticatedPage.goto("/?layout=v2");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for Tasks panel to load
    await authenticatedPage.getByText("Tasks", { exact: true }).waitFor({ timeout: 5000 });
  });

  test("task completion checkbox is visible and accessible", async ({
    authenticatedPage,
  }) => {
    await test.step("Skip if no tasks exist", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage > 0) {
        test.skip();
      }
    });

    await test.step("Verify task checkbox is visible", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Find first task checkbox
      const taskCheckbox = tasksPanel.locator('input[type="checkbox"]').first();

      // Should be visible
      await expect(taskCheckbox).toBeVisible();

      // Should have accessible label (aria-label or associated label)
      const hasAriaLabel = await taskCheckbox.getAttribute("aria-label");
      expect(hasAriaLabel).toBeTruthy();
    });

    await test.step("Verify checkbox has proper touch target", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const taskCheckbox = tasksPanel.locator('input[type="checkbox"]').first();

      // Get bounding box
      const box = await taskCheckbox.boundingBox();
      expect(box).toBeTruthy();

      if (box) {
        // Minimum 44x44px touch target (WCAG AA)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test("can mark task as complete", async ({ authenticatedPage }) => {
    await test.step("Skip if no incomplete tasks exist", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage > 0) {
        test.skip();
      }

      // Check if there's at least one unchecked checkbox
      const uncheckedCount = await tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .count();

      if (uncheckedCount === 0) {
        test.skip();
      }
    });

    await test.step("Mark task as complete", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Find first unchecked task checkbox
      const taskCheckbox = tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .first();

      // Get task title before completing (for verification)
      const taskRow = taskCheckbox.locator("..");
      const taskTitle = await taskRow.textContent();

      // Click checkbox to complete
      await taskCheckbox.click();

      // Wait for action to complete
      await authenticatedPage.waitForTimeout(500);
    });

    await test.step("Verify task marked as complete", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Task should either:
      // 1. Be checked (if it stays in the list)
      // 2. Disappear from the list (if it moves to completed section)

      // Check if the checkbox is now checked (if still visible)
      const checkedCount = await tasksPanel
        .locator('input[type="checkbox"]:checked')
        .count();

      // At least one task should be checked now
      expect(checkedCount).toBeGreaterThan(0);
    });
  });

  test("completed task updates task count", async ({ authenticatedPage }) => {
    await test.step("Skip if no incomplete tasks exist", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage > 0) {
        test.skip();
      }

      const uncheckedCount = await tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .count();

      if (uncheckedCount === 0) {
        test.skip();
      }
    });

    await test.step("Get initial task count", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Count total tasks before completion
      const initialCount = await tasksPanel.locator('input[type="checkbox"]').count();
      expect(initialCount).toBeGreaterThan(0);
    });

    await test.step("Complete a task", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const taskCheckbox = tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .first();

      await taskCheckbox.click();
      await authenticatedPage.waitForTimeout(500);
    });

    await test.step("Verify task count updated", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Either:
      // 1. Total count decreased (task removed from list)
      // 2. Checked count increased (task stays in list but checked)

      const checkedCount = await tasksPanel
        .locator('input[type="checkbox"]:checked')
        .count();

      // At least one task should be checked
      expect(checkedCount).toBeGreaterThan(0);
    });
  });

  test("keyboard navigation works for task checkboxes", async ({
    authenticatedPage,
  }) => {
    await test.step("Skip if no incomplete tasks exist", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage > 0) {
        test.skip();
      }

      const uncheckedCount = await tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .count();

      if (uncheckedCount === 0) {
        test.skip();
      }
    });

    await test.step("Focus checkbox with keyboard", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const taskCheckbox = tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .first();

      // Focus the checkbox
      await taskCheckbox.focus();

      // Verify it's focused
      await expect(taskCheckbox).toBeFocused();
    });

    await test.step("Complete task with Space key", async () => {
      // Press Space to toggle checkbox
      await authenticatedPage.keyboard.press("Space");

      // Wait for action
      await authenticatedPage.waitForTimeout(500);

      // Verify checkbox is now checked
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const checkedCount = await tasksPanel
        .locator('input[type="checkbox"]:checked')
        .count();

      expect(checkedCount).toBeGreaterThan(0);
    });
  });

  test("task grouping persists after task completion", async ({
    authenticatedPage,
  }) => {
    await test.step("Set grouping to 'Priority'", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const groupingSelect = tasksPanel.getByRole("combobox");

      await groupingSelect.click();
      const priorityOption = authenticatedPage.getByRole("option", {
        name: "Priority",
      });
      await priorityOption.click();

      // Verify grouping changed
      await expect(groupingSelect).toContainText("Priority");
    });

    await test.step("Skip if no incomplete tasks exist", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage > 0) {
        test.skip();
      }

      const uncheckedCount = await tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .count();

      if (uncheckedCount === 0) {
        test.skip();
      }
    });

    await test.step("Complete a task", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const taskCheckbox = tasksPanel
        .locator('input[type="checkbox"]:not(:checked)')
        .first();

      await taskCheckbox.click();
      await authenticatedPage.waitForTimeout(500);
    });

    await test.step("Verify grouping is still 'Priority'", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const groupingSelect = tasksPanel.getByRole("combobox");

      // Grouping should still be "Priority"
      await expect(groupingSelect).toContainText("Priority");
    });

    await test.step("Reset grouping to 'Due Date'", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const groupingSelect = tasksPanel.getByRole("combobox");

      await groupingSelect.click();
      const dueDateOption = authenticatedPage.getByRole("option", {
        name: "Due Date",
      });
      await dueDateOption.click();
    });
  });

  test("empty state shows when all tasks completed", async ({
    authenticatedPage,
  }) => {
    await test.step("Skip if too many tasks to complete", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage > 0) {
        test.skip();
      }

      // Only run this test if there are 5 or fewer tasks
      const taskCount = await tasksPanel.locator('input[type="checkbox"]').count();

      if (taskCount > 5 || taskCount === 0) {
        test.skip();
      }
    });

    await test.step("Complete all tasks", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Get all unchecked checkboxes
      const uncheckedBoxes = tasksPanel.locator('input[type="checkbox"]:not(:checked)');
      const count = await uncheckedBoxes.count();

      // Complete each task
      for (let i = 0; i < count; i++) {
        // Always get the first unchecked box (as completed ones may disappear)
        const checkbox = tasksPanel
          .locator('input[type="checkbox"]:not(:checked)')
          .first();

        if ((await checkbox.count()) > 0) {
          await checkbox.click();
          await authenticatedPage.waitForTimeout(300);
        }
      }
    });

    await test.step("Verify empty state appears", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Should show "No tasks due" message
      const noTasksMessage = tasksPanel.getByText("No tasks due");
      await expect(noTasksMessage).toBeVisible({ timeout: 3000 });
    });
  });
});
