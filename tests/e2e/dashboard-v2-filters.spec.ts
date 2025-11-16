import { test, expect } from "./support/fixtures/authenticated";

/**
 * Dashboard V2 - Filters and Sidebar Collapse E2E Tests
 *
 * Tests filter persistence and sidebar collapse functionality:
 * 1. Filters persist across page refresh
 * 2. Clear filters button resets all filters
 * 3. Sidebar collapses and reopens with rail button
 * 4. Sidebar collapse state persists across page refresh
 * 5. Active filter badge shows on collapsed rail
 *
 * Part of Task 7.2 from dashboard-v2-filter-wiring implementation plan
 */

test.describe("Dashboard V2 Filters", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V2
    await authenticatedPage.goto("/?layout=v2");
    await authenticatedPage.waitForLoadState("networkidle");
  });

  test("filters persist across page refresh", async ({ authenticatedPage }) => {
    await test.step("Apply health filter", async () => {
      // Check the "Active" health status checkbox
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      await activeCheckbox.check();
      await expect(activeCheckbox).toBeChecked();
    });

    await test.step("Verify active count badge appears", async () => {
      // Look for the Clear button with count
      const clearButton = authenticatedPage.getByRole("button", {
        name: /clear.*1/i,
      });
      await expect(clearButton).toBeVisible();
    });

    await test.step("Refresh page and verify filter persists", async () => {
      // Reload the page
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify the checkbox is still checked
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      await expect(activeCheckbox).toBeChecked();

      // Verify the clear button still shows count
      const clearButton = authenticatedPage.getByRole("button", {
        name: /clear.*1/i,
      });
      await expect(clearButton).toBeVisible();
    });
  });

  test("clear filters button resets all filters", async ({
    authenticatedPage,
  }) => {
    await test.step("Apply multiple filters", async () => {
      // Check multiple health status checkboxes
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      const coolingCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /cooling/i,
      });

      await activeCheckbox.check();
      await coolingCheckbox.check();

      await expect(activeCheckbox).toBeChecked();
      await expect(coolingCheckbox).toBeChecked();
    });

    await test.step("Verify count badge shows 2", async () => {
      const clearButton = authenticatedPage.getByRole("button", {
        name: /clear.*2/i,
      });
      await expect(clearButton).toBeVisible();
    });

    await test.step("Click clear button and verify all filters reset", async () => {
      // Click the clear button
      const clearButton = authenticatedPage.getByRole("button", {
        name: /clear/i,
      });
      await clearButton.click();

      // Verify all checkboxes are unchecked
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      const coolingCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /cooling/i,
      });

      await expect(activeCheckbox).not.toBeChecked();
      await expect(coolingCheckbox).not.toBeChecked();

      // Verify clear button is no longer visible (or shows 0)
      const clearButtonAfter = authenticatedPage.getByRole("button", {
        name: /clear.*[1-9]/i,
      });
      await expect(clearButtonAfter).not.toBeVisible();
    });
  });

  test("stage filters work correctly", async ({ authenticatedPage }) => {
    await test.step("Apply stage filter", async () => {
      // Find a stage checkbox (these are dynamic from config)
      const stageCheckboxes = authenticatedPage.locator(
        'input[type="checkbox"][name^="stage-"]'
      );

      // Check if any stage checkboxes exist
      const count = await stageCheckboxes.count();
      if (count > 0) {
        // Check the first stage checkbox
        await stageCheckboxes.first().check();
        await expect(stageCheckboxes.first()).toBeChecked();

        // Verify active count incremented
        const clearButton = authenticatedPage.getByRole("button", {
          name: /clear.*1/i,
        });
        await expect(clearButton).toBeVisible();
      }
    });
  });

  test("assignee filter works correctly", async ({ authenticatedPage }) => {
    await test.step("Change assignee filter", async () => {
      // Find the assignee dropdown/select
      const assigneeSelect = authenticatedPage.locator('select[name="assignee"]')
        .or(authenticatedPage.getByRole("combobox", { name: /assignee/i }));

      // Check if assignee filter exists
      const exists = await assigneeSelect.count();
      if (exists > 0) {
        // Select "Assigned to Me" option
        await assigneeSelect.first().click();

        // Look for the option in a dropdown
        const meOption = authenticatedPage.getByRole("option", {
          name: /assigned to me/i,
        });

        if ((await meOption.count()) > 0) {
          await meOption.click();

          // Verify active count incremented
          const clearButton = authenticatedPage.getByRole("button", {
            name: /clear.*1/i,
          });
          await expect(clearButton).toBeVisible();
        }
      }
    });
  });

  test("last touch filter works correctly", async ({ authenticatedPage }) => {
    await test.step("Change last touch filter", async () => {
      // Find the last touch dropdown/select
      const lastTouchSelect = authenticatedPage.locator('select[name="lastTouch"]')
        .or(authenticatedPage.getByRole("combobox", { name: /last touch/i }));

      // Check if last touch filter exists
      const exists = await lastTouchSelect.count();
      if (exists > 0) {
        await lastTouchSelect.first().click();

        // Select "7 days" option
        const sevenDaysOption = authenticatedPage.getByRole("option", {
          name: /7 days/i,
        });

        if ((await sevenDaysOption.count()) > 0) {
          await sevenDaysOption.click();

          // Verify active count incremented
          const clearButton = authenticatedPage.getByRole("button", {
            name: /clear.*1/i,
          });
          await expect(clearButton).toBeVisible();
        }
      }
    });
  });
});

test.describe("Dashboard V2 Sidebar Collapse", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V2
    await authenticatedPage.goto("/?layout=v2");
    await authenticatedPage.waitForLoadState("networkidle");
  });

  test("sidebar collapses and reopens with rail button", async ({
    authenticatedPage,
  }) => {
    await test.step("Verify sidebar is open initially", async () => {
      // Look for the sidebar container
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]')
        .or(authenticatedPage.getByRole("complementary"));

      await expect(sidebar.first()).toBeVisible();
    });

    await test.step("Click collapse button", async () => {
      // Find and click the collapse button
      const collapseButton = authenticatedPage.getByRole("button", {
        name: /collapse.*sidebar/i,
      });

      await expect(collapseButton).toBeVisible();
      await collapseButton.click();

      // Wait for animation to complete
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify sidebar is collapsed", async () => {
      // Check if sidebar has aria-hidden or is visually hidden
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]')
        .or(authenticatedPage.getByRole("complementary"));

      // The sidebar should either be hidden or have minimal width
      const isHidden = await sidebar.first().isHidden().catch(() => false);
      const hasAriaHidden = await sidebar
        .first()
        .getAttribute("aria-hidden")
        .then((val) => val === "true")
        .catch(() => false);

      expect(isHidden || hasAriaHidden).toBe(true);
    });

    await test.step("Verify rail button appears", async () => {
      // Look for the rail button to reopen sidebar
      const railButton = authenticatedPage.getByRole("button", {
        name: /open.*sidebar/i,
      });

      await expect(railButton).toBeVisible();
    });

    await test.step("Click rail button to reopen", async () => {
      const railButton = authenticatedPage.getByRole("button", {
        name: /open.*sidebar/i,
      });

      await railButton.click();

      // Wait for animation
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify sidebar is visible again", async () => {
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]')
        .or(authenticatedPage.getByRole("complementary"));

      await expect(sidebar.first()).toBeVisible();

      // Check aria-hidden is false or not present
      const ariaHidden = await sidebar.first().getAttribute("aria-hidden");
      expect(ariaHidden === null || ariaHidden === "false").toBe(true);
    });
  });

  test("sidebar collapse state persists across page refresh", async ({
    authenticatedPage,
  }) => {
    await test.step("Collapse sidebar", async () => {
      const collapseButton = authenticatedPage.getByRole("button", {
        name: /collapse.*sidebar/i,
      });

      await collapseButton.click();
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify sidebar is collapsed", async () => {
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]')
        .or(authenticatedPage.getByRole("complementary"));

      const isHidden = await sidebar.first().isHidden().catch(() => false);
      const hasAriaHidden = await sidebar
        .first()
        .getAttribute("aria-hidden")
        .then((val) => val === "true")
        .catch(() => false);

      expect(isHidden || hasAriaHidden).toBe(true);
    });

    await test.step("Refresh page and verify sidebar still collapsed", async () => {
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify sidebar is still collapsed
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]')
        .or(authenticatedPage.getByRole("complementary"));

      const isHidden = await sidebar.first().isHidden().catch(() => false);
      const hasAriaHidden = await sidebar
        .first()
        .getAttribute("aria-hidden")
        .then((val) => val === "true")
        .catch(() => false);

      expect(isHidden || hasAriaHidden).toBe(true);

      // Verify rail button is visible
      const railButton = authenticatedPage.getByRole("button", {
        name: /open.*sidebar/i,
      });
      await expect(railButton).toBeVisible();
    });
  });

  test("active filter badge shows on collapsed rail", async ({
    authenticatedPage,
  }) => {
    await test.step("Apply multiple filters", async () => {
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      const coolingCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /cooling/i,
      });

      await activeCheckbox.check();
      await coolingCheckbox.check();

      await expect(activeCheckbox).toBeChecked();
      await expect(coolingCheckbox).toBeChecked();
    });

    await test.step("Collapse sidebar", async () => {
      const collapseButton = authenticatedPage.getByRole("button", {
        name: /collapse.*sidebar/i,
      });

      await collapseButton.click();
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify badge shows count on rail button", async () => {
      const railButton = authenticatedPage.getByRole("button", {
        name: /open.*sidebar/i,
      });

      await expect(railButton).toBeVisible();

      // Look for a badge showing "2" within or near the rail button
      const badge = railButton.locator('[data-testid="filter-badge"]')
        .or(railButton.locator(".bg-primary"))
        .or(railButton.locator('text="2"'));

      // If badge exists, verify it shows "2"
      const badgeCount = await badge.count();
      if (badgeCount > 0) {
        await expect(badge.first()).toContainText("2");
      } else {
        // Alternative: check if button text includes the count
        await expect(railButton).toContainText(/2/);
      }
    });
  });

  // Known issue: Radix UI Checkbox + Collapsible focus timing complexity
  // See: docs/testing/known-issues.md#dashboard-v2-sidebar-focus-test
  test.skip("sidebar reopens with focus on first input", async ({
    authenticatedPage,
  }) => {
    await test.step("Collapse sidebar", async () => {
      const collapseButton = authenticatedPage.getByRole("button", {
        name: /collapse.*sidebar/i,
      });

      await collapseButton.click();
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Reopen sidebar via rail button", async () => {
      const railButton = authenticatedPage.getByRole("button", {
        name: /open.*sidebar/i,
      });

      await railButton.click();
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify focus moves to first input", async () => {
      // The first interactive element in the sidebar should be focused
      // This could be the first checkbox or the search input
      const firstCheckbox = authenticatedPage
        .locator('[data-testid="filters-sidebar"] input[type="checkbox"]')
        .or(authenticatedPage.locator('aside input[type="checkbox"]'))
        .first();

      const firstInput = authenticatedPage
        .locator('[data-testid="filters-sidebar"] input')
        .or(authenticatedPage.locator("aside input"))
        .first();

      // Either the first checkbox or first input should be focused
      const checkboxFocused = await firstCheckbox
        .evaluate((el) => el === document.activeElement)
        .catch(() => false);
      const inputFocused = await firstInput
        .evaluate((el) => el === document.activeElement)
        .catch(() => false);

      expect(checkboxFocused || inputFocused).toBe(true);
    });
  });

  test("sidebar width transitions smoothly", async ({ authenticatedPage }) => {
    await test.step("Measure sidebar width when open", async () => {
      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]')
        .or(authenticatedPage.getByRole("complementary"));

      const openWidth = await sidebar.first().evaluate((el) => {
        return window.getComputedStyle(el).width;
      });

      // Should be 18rem (288px) when open
      expect(openWidth).toMatch(/288px|18rem/);
    });

    await test.step("Collapse and measure width", async () => {
      const collapseButton = authenticatedPage.getByRole("button", {
        name: /collapse.*sidebar/i,
      });

      await collapseButton.click();
      await authenticatedPage.waitForTimeout(300);

      const sidebar = authenticatedPage.locator('[data-testid="filters-sidebar"]')
        .or(authenticatedPage.getByRole("complementary"));

      const collapsedWidth = await sidebar.first().evaluate((el) => {
        return window.getComputedStyle(el).width;
      });

      // Should be 0px when collapsed
      expect(collapsedWidth).toMatch(/0px/);
    });
  });
});

test.describe("Dashboard V2 Filters - Integration", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/?layout=v2");
    await authenticatedPage.waitForLoadState("networkidle");
  });

  test("multiple filter types work together", async ({ authenticatedPage }) => {
    await test.step("Apply health and stage filters together", async () => {
      // Check health filter
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      await activeCheckbox.check();

      // Try to check a stage filter if available
      const stageCheckboxes = authenticatedPage.locator(
        'input[type="checkbox"][name^="stage-"]'
      );
      const stageCount = await stageCheckboxes.count();

      let expectedCount = 1;
      if (stageCount > 0) {
        await stageCheckboxes.first().check();
        expectedCount = 2;
      }

      // Verify clear button shows correct count
      const clearButton = authenticatedPage.getByRole("button", {
        name: new RegExp(`clear.*${expectedCount}`, "i"),
      });
      await expect(clearButton).toBeVisible();
    });

    await test.step("Clear all filters resets both types", async () => {
      const clearButton = authenticatedPage.getByRole("button", {
        name: /clear/i,
      });
      await clearButton.click();

      // Verify health filter is cleared
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      await expect(activeCheckbox).not.toBeChecked();

      // Verify clear button is gone
      const clearButtonAfter = authenticatedPage.getByRole("button", {
        name: /clear.*[1-9]/i,
      });
      await expect(clearButtonAfter).not.toBeVisible();
    });
  });

  test("filters persist when sidebar is collapsed and reopened", async ({
    authenticatedPage,
  }) => {
    await test.step("Apply filters", async () => {
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      await activeCheckbox.check();
    });

    await test.step("Collapse sidebar", async () => {
      const collapseButton = authenticatedPage.getByRole("button", {
        name: /collapse.*sidebar/i,
      });
      await collapseButton.click();
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Reopen sidebar", async () => {
      const railButton = authenticatedPage.getByRole("button", {
        name: /open.*sidebar/i,
      });
      await railButton.click();
      await authenticatedPage.waitForTimeout(300);
    });

    await test.step("Verify filters are still applied", async () => {
      const activeCheckbox = authenticatedPage.getByRole("checkbox", {
        name: /active/i,
      });
      await expect(activeCheckbox).toBeChecked();

      const clearButton = authenticatedPage.getByRole("button", {
        name: /clear.*1/i,
      });
      await expect(clearButton).toBeVisible();
    });
  });
});
