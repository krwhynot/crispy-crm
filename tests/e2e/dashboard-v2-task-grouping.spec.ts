import { test, expect } from "./support/fixtures/authenticated";

/**
 * Dashboard V2 - Task Grouping E2E Tests
 *
 * Tests task grouping dropdown functionality and persistence:
 * 1. Grouping dropdown is visible and accessible
 * 2. Can switch between grouping modes (due, priority, principal)
 * 3. Tasks re-group correctly when mode changes
 * 4. Grouping preference persists across page refresh
 * 5. Group headers display correct labels
 * 6. "Later" pagination works correctly (due date mode only)
 *
 * Part of Sprint 2 - Dashboard V2 UI/UX Acceptance Testing
 */

test.describe("Dashboard V2 - Task Grouping", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V2
    await authenticatedPage.goto("/?layout=v2");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for Tasks panel to load
    await authenticatedPage.getByText("Tasks", { exact: true }).waitFor({ timeout: 5000 });
  });

  test("task grouping dropdown is visible and accessible", async ({
    authenticatedPage,
  }) => {
    await test.step("Verify grouping dropdown is visible", async () => {
      // The Select component uses a button with role="combobox"
      const groupingSelect = authenticatedPage.getByRole("combobox");

      // Should be visible
      await expect(groupingSelect).toBeVisible();

      // Should have accessible name showing current selection
      await expect(groupingSelect).toContainText(/Due Date|Priority|Principal/i);
    });

    await test.step("Verify dropdown can be opened", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await groupingSelect.click();

      // Verify options are visible
      await expect(authenticatedPage.getByRole("option", { name: "Due Date" })).toBeVisible();
      await expect(authenticatedPage.getByRole("option", { name: "Priority" })).toBeVisible();
      await expect(authenticatedPage.getByRole("option", { name: "Principal" })).toBeVisible();

      // Close dropdown
      await authenticatedPage.keyboard.press("Escape");
    });
  });

  test("default grouping is 'Due Date'", async ({ authenticatedPage }) => {
    await test.step("Verify default grouping mode", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");

      // Should default to "Due Date"
      await expect(groupingSelect).toContainText("Due Date");
    });
  });

  test("can switch to 'Priority' grouping mode", async ({
    authenticatedPage,
  }) => {
    await test.step("Open grouping dropdown", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await groupingSelect.click();
    });

    await test.step("Select 'Priority' option", async () => {
      const priorityOption = authenticatedPage.getByRole("option", {
        name: "Priority",
      });
      await priorityOption.click();
    });

    await test.step("Verify grouping changed to 'Priority'", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await expect(groupingSelect).toContainText("Priority");
    });

    await test.step("Verify priority group headers appear", async () => {
      // Check if at least one priority group header is visible
      // Priority labels: Critical, High, Medium, Low
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Look for at least one priority group header
      const hasPriorityGroup =
        (await tasksPanel.getByText("Critical").count()) > 0 ||
        (await tasksPanel.getByText("High").count()) > 0 ||
        (await tasksPanel.getByText("Medium").count()) > 0 ||
        (await tasksPanel.getByText("Low").count()) > 0;

      // If there are tasks, at least one group should exist
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage === 0) {
        expect(hasPriorityGroup).toBe(true);
      }
    });
  });

  test("can switch to 'Principal' grouping mode", async ({
    authenticatedPage,
  }) => {
    await test.step("Open grouping dropdown", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await groupingSelect.click();
    });

    await test.step("Select 'Principal' option", async () => {
      const principalOption = authenticatedPage.getByRole("option", {
        name: "Principal",
      });
      await principalOption.click();
    });

    await test.step("Verify grouping changed to 'Principal'", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await expect(groupingSelect).toContainText("Principal");
    });

    await test.step("Verify principal-based grouping", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // If there are tasks, they should be grouped by principal name
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage === 0) {
        // At least one group header should exist (principal name or "No Principal")
        const groupHeaders = tasksPanel.locator(
          'div.font-medium, div.font-semibold'
        );
        const headerCount = await groupHeaders.count();

        // Should have at least one group header besides the "Tasks" panel title
        expect(headerCount).toBeGreaterThan(0);
      }
    });
  });

  test("grouping preference persists across page refresh", async ({
    authenticatedPage,
  }) => {
    await test.step("Change grouping to 'Priority'", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await groupingSelect.click();

      const priorityOption = authenticatedPage.getByRole("option", {
        name: "Priority",
      });
      await priorityOption.click();

      await expect(groupingSelect).toContainText("Priority");
    });

    await test.step("Reload page and verify grouping persists", async () => {
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      // Wait for Tasks panel to load
      await authenticatedPage.getByText("Tasks", { exact: true }).waitFor({ timeout: 5000 });

      // Verify grouping is still "Priority"
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await expect(groupingSelect).toContainText("Priority");
    });

    await test.step("Change back to 'Due Date' for cleanup", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await groupingSelect.click();

      const dueDateOption = authenticatedPage.getByRole("option", {
        name: "Due Date",
      });
      await dueDateOption.click();
    });
  });

  test("due date grouping shows correct bucket labels", async ({
    authenticatedPage,
  }) => {
    await test.step("Ensure grouping is 'Due Date'", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      const currentText = await groupingSelect.textContent();

      if (!currentText?.includes("Due Date")) {
        await groupingSelect.click();
        await authenticatedPage.getByRole("option", { name: "Due Date" }).click();
      }
    });

    await test.step("Verify due date bucket labels", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Check if there are any tasks
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage === 0) {
        // Look for at least one due date bucket label
        // Bucket labels: Overdue, Today, Tomorrow, This Week, Later
        const hasBucketLabel =
          (await tasksPanel.getByText("Overdue").count()) > 0 ||
          (await tasksPanel.getByText("Today").count()) > 0 ||
          (await tasksPanel.getByText("Tomorrow").count()) > 0 ||
          (await tasksPanel.getByText("This Week").count()) > 0 ||
          (await tasksPanel.getByText("Later").count()) > 0;

        expect(hasBucketLabel).toBe(true);
      }
    });
  });

  test("'Later' group expands to show paginated tasks", async ({
    authenticatedPage,
  }) => {
    await test.step("Skip test if no 'Later' group exists", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const laterGroup = tasksPanel.getByText("Later").first();
      const laterCount = await laterGroup.count();

      if (laterCount === 0) {
        test.skip();
      }
    });

    await test.step("Ensure grouping is 'Due Date'", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      const currentText = await groupingSelect.textContent();

      if (!currentText?.includes("Due Date")) {
        await groupingSelect.click();
        await authenticatedPage.getByRole("option", { name: "Due Date" }).click();
      }
    });

    await test.step("Expand 'Later' group if collapsed", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");
      const laterHeader = tasksPanel.getByText("Later").first();

      // Check if the header is a button (collapsible)
      const laterButton = laterHeader.locator('..').getByRole('button').first();
      const buttonCount = await laterButton.count();

      if (buttonCount > 0) {
        // Check if it's collapsed (aria-expanded="false")
        const ariaExpanded = await laterButton.getAttribute('aria-expanded');

        if (ariaExpanded === 'false') {
          await laterButton.click();

          // Wait for expansion animation
          await authenticatedPage.waitForTimeout(300);
        }
      }
    });

    await test.step("Verify 'Later' tasks are visible", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // After expanding, should see tasks in the Later group
      // Tasks are rendered with checkboxes
      const laterSection = tasksPanel.locator('div').filter({ hasText: /Later/ }).first();
      const taskCheckboxes = laterSection.locator('input[type="checkbox"]');

      // Should have at least one task
      const checkboxCount = await taskCheckboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);
    });

    await test.step("Verify 'Load More' button if many tasks", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Look for "Load More" button in Later section
      const loadMoreButton = tasksPanel.getByRole('button', { name: /load more/i });
      const loadMoreCount = await loadMoreButton.count();

      // If there are more than 10 tasks in Later, there should be a Load More button
      // (This is conditional - only test if the button exists)
      if (loadMoreCount > 0) {
        await expect(loadMoreButton).toBeVisible();
      }
    });
  });

  test("keyboard navigation works for grouping dropdown", async ({
    authenticatedPage,
  }) => {
    await test.step("Focus grouping dropdown with Tab", async () => {
      // Tab until we reach the grouping dropdown
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await groupingSelect.focus();

      // Verify it's focused
      await expect(groupingSelect).toBeFocused();
    });

    await test.step("Open dropdown with Enter key", async () => {
      await authenticatedPage.keyboard.press("Enter");

      // Verify options are visible
      await expect(authenticatedPage.getByRole("option", { name: "Due Date" })).toBeVisible();
    });

    await test.step("Navigate options with Arrow keys", async () => {
      // Press ArrowDown to move to next option
      await authenticatedPage.keyboard.press("ArrowDown");

      // Press Enter to select
      await authenticatedPage.keyboard.press("Enter");

      // Should have selected the second option (Priority)
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await expect(groupingSelect).toContainText("Priority");
    });

    await test.step("Reset to Due Date", async () => {
      const groupingSelect = authenticatedPage.getByRole("combobox");
      await groupingSelect.click();
      await authenticatedPage.getByRole("option", { name: "Due Date" }).click();
    });
  });

  test("grouping works correctly when no tasks exist", async ({
    authenticatedPage,
  }) => {
    await test.step("Verify empty state shows for all grouping modes", async () => {
      const tasksPanel = authenticatedPage.getByLabel("Tasks list");

      // Check if "No tasks due" message is present
      const noTasksMessage = await tasksPanel.getByText("No tasks due").count();

      if (noTasksMessage > 0) {
        // Test all grouping modes show the same empty state
        const groupingModes = ["Due Date", "Priority", "Principal"];

        for (const mode of groupingModes) {
          const groupingSelect = authenticatedPage.getByRole("combobox");
          await groupingSelect.click();
          await authenticatedPage.getByRole("option", { name: mode }).click();

          // Verify empty state is still shown
          await expect(tasksPanel.getByText("No tasks due")).toBeVisible();
        }
      } else {
        test.skip();
      }
    });
  });
});
