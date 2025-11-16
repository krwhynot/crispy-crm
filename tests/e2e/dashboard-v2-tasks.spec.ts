import { test, expect } from '@playwright/test';

test.describe('Dashboard V2 - Tasks Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Navigate to dashboard v2
    await page.goto('/?layout=v2');

    // Select a principal with tasks (RJC exists in seed.sql)
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="RJC"');

    // Wait for opportunities tree to load (proper wait condition)
    await page.waitForSelector('[role="tree"]:not(:has-text("Select a principal"))', {
      timeout: 5000
    });
  });

  test('should remove completed task from list immediately', async ({ page }) => {
    // Find first task checkbox
    const firstTask = page.locator('[role="listitem"]').first();
    const taskTitle = await firstTask.locator('span.truncate').textContent();

    // Click checkbox to complete task
    await firstTask.locator('button[aria-label*="Mark"]').click();

    // Wait for success notification
    await expect(page.locator('text="Task marked as complete"')).toBeVisible();

    // Verify task is removed from list (should not find it anymore)
    await expect(page.locator(`text="${taskTitle}"`).first()).not.toBeVisible({ timeout: 2000 });
  });
});
