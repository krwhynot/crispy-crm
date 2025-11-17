import { test, expect } from './support/fixtures/authenticated';

test.describe('Dashboard V2 - Tasks Panel', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to dashboard v2
    await authenticatedPage.goto('/?layout=v2');

    // Select a principal with tasks (RJC exists in seed.sql)
    await authenticatedPage.click('[data-testid="principal-select-trigger"]');
    await authenticatedPage.click('text="RJC"');

    // Wait for opportunities tree to load (proper wait condition)
    await authenticatedPage.waitForSelector('[role="tree"]:not(:has-text("Select a principal"))', {
      timeout: 5000
    });
  });

  test('should remove completed task from list immediately', async ({ authenticatedPage }) => {
    // Find first task checkbox
    const firstTask = authenticatedPage.locator('[role="listitem"]').first();
    const taskTitle = await firstTask.locator('span.truncate').textContent();

    // Click checkbox to complete task
    await firstTask.locator('input[type="checkbox"][aria-label*="Mark"]').click();

    // Wait for success notification
    await expect(authenticatedPage.locator('text="Task marked as complete"')).toBeVisible();

    // Verify task is removed from list (should not find it anymore)
    await expect(authenticatedPage.locator(`text="${taskTitle}"`).first()).not.toBeVisible({ timeout: 2000 });
  });
});
