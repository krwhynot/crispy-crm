import { test, expect } from './support/fixtures/authenticated';

/**
 * Dashboard V2 Sidebar Collapse E2E Tests
 *
 * Tests sidebar collapse/expand functionality and persistence:
 * 1. Collapses sidebar and shows rail button
 * 2. Persists collapsed state across page reloads
 * 3. Shows filter count badge on collapsed rail
 *
 * Part of Task 5.3 from 2025-11-15-test-suite-cleanup-implementation.md
 */

test.describe('Dashboard V2 Sidebar Collapse', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Dashboard V2
    await authenticatedPage.goto('/?layout=v2');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('collapses sidebar and shows rail button', async ({ authenticatedPage }) => {
    await test.step('Verify sidebar is initially visible', async () => {
      const sidebar = authenticatedPage.getByRole('complementary', { name: 'Filters sidebar' });
      await expect(sidebar).toBeVisible();
    });

    await test.step('Click collapse button in sidebar', async () => {
      const collapseBtn = authenticatedPage.getByRole('button', { name: /collapse filters sidebar/i });
      await expect(collapseBtn).toBeVisible();
      await collapseBtn.click();
    });

    await test.step('Verify sidebar is hidden and rail button appears', async () => {
      // Sidebar should be hidden (aria-hidden=true, opacity 0)
      const sidebar = authenticatedPage.getByRole('complementary', { name: 'Filters sidebar' });
      await expect(sidebar).toBeHidden();

      // Rail button should be visible
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      await expect(railBtn).toBeVisible();
    });

    await test.step('Click rail button to reopen sidebar', async () => {
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      await railBtn.click();

      // Wait for animation to complete
      await authenticatedPage.waitForTimeout(250);

      // Sidebar should be visible again
      const sidebar = authenticatedPage.getByRole('complementary', { name: 'Filters sidebar' });
      await expect(sidebar).toBeVisible();

      // Rail button should be hidden
      await expect(railBtn).not.toBeVisible();
    });
  });

  test('persists collapsed state across reloads', async ({ authenticatedPage }) => {
    await test.step('Collapse sidebar', async () => {
      const collapseBtn = authenticatedPage.getByRole('button', { name: /collapse filters sidebar/i });
      await collapseBtn.click();

      // Verify sidebar is collapsed
      const sidebar = authenticatedPage.getByRole('complementary', { name: 'Filters sidebar' });
      await expect(sidebar).toBeHidden();
    });

    await test.step('Reload page', async () => {
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState('networkidle');
    });

    await test.step('Verify sidebar remains collapsed after reload', async () => {
      // Sidebar should still be hidden
      const sidebar = authenticatedPage.getByRole('complementary', { name: 'Filters sidebar' });
      await expect(sidebar).toBeHidden();

      // Rail button should be visible
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      await expect(railBtn).toBeVisible();
    });

    await test.step('Reopen sidebar for cleanup', async () => {
      // Reopen sidebar to reset state for other tests
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      await railBtn.click();
      await authenticatedPage.waitForTimeout(250);
    });
  });

  test('shows filter count badge on rail when collapsed', async ({ authenticatedPage }) => {
    await test.step('Apply a filter', async () => {
      // Check the "At Risk" health status checkbox
      const atRiskCheckbox = authenticatedPage.getByRole('checkbox', { name: /at risk/i });
      await atRiskCheckbox.check();
      await expect(atRiskCheckbox).toBeChecked();
    });

    await test.step('Verify active filter count shows in sidebar', async () => {
      // Look for the Clear button with count (shows active filters)
      const clearButton = authenticatedPage.getByRole('button', { name: /clear.*1/i });
      await expect(clearButton).toBeVisible();
    });

    await test.step('Collapse sidebar', async () => {
      const collapseBtn = authenticatedPage.getByRole('button', { name: /collapse filters sidebar/i });
      await collapseBtn.click();
    });

    await test.step('Verify filter badge appears on rail button', async () => {
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      await expect(railBtn).toBeVisible();

      // Badge should show count of 1
      // The badge is a child div inside the rail button with specific styling
      const badge = railBtn.locator('div.absolute.-top-2.-right-2');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('1');
    });

    await test.step('Apply another filter', async () => {
      // Reopen sidebar to add another filter
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      await railBtn.click();
      await authenticatedPage.waitForTimeout(250);

      // Check another health status
      const coolingCheckbox = authenticatedPage.getByRole('checkbox', { name: /cooling/i });
      await coolingCheckbox.check();
      await expect(coolingCheckbox).toBeChecked();
    });

    await test.step('Verify badge updates to show 2 filters', async () => {
      // Collapse again
      const collapseBtn = authenticatedPage.getByRole('button', { name: /collapse filters sidebar/i });
      await collapseBtn.click();

      // Badge should now show count of 2
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      const badge = railBtn.locator('div.absolute.-top-2.-right-2');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('2');
    });

    await test.step('Clear filters and verify badge disappears', async () => {
      // Reopen sidebar
      const railBtn = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      await railBtn.click();
      await authenticatedPage.waitForTimeout(250);

      // Clear all filters
      const clearButton = authenticatedPage.getByRole('button', { name: /clear.*2/i });
      await clearButton.click();

      // Collapse again
      const collapseBtn = authenticatedPage.getByRole('button', { name: /collapse filters sidebar/i });
      await collapseBtn.click();

      // Badge should not be visible when no filters are active
      const railBtnAfterClear = authenticatedPage.getByRole('button', { name: /open filters sidebar/i });
      const badge = railBtnAfterClear.locator('div.absolute.-top-2.-right-2');
      await expect(badge).not.toBeVisible();
    });
  });
});
