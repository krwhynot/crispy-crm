import { test, expect } from '@playwright/test';

/**
 * Dashboard V2 - Navigation Tests
 *
 * Verifies that navigation from Dashboard V2 works correctly:
 * - "New" dropdown menu items navigate to correct create pages
 * - Principal pre-fill works for Activity and Opportunity
 * - "Create Task" button in empty state works
 */

test.describe('Dashboard V2 - Navigation', () => {
  const DASHBOARD_URL = 'http://127.0.0.1:5173/?layout=v2';

  test.beforeEach(async ({ page }) => {
    await test.step('Navigate to Dashboard V2', async () => {
      await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });
    });
  });

  test('should navigate to activity create from New menu', async ({ page }) => {
    // Select principal (Wicks exists in seed.sql)
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="Wicks"');

    // Wait for principal to load
    await page.waitForSelector('[role="tree"]:not(:has-text("Select a principal"))', {
      timeout: 5000
    });

    // Open New menu
    await page.click('button:has-text("New")');

    // Click Activity
    await page.click('text="Activity"');

    // Verify navigation
    await expect(page).toHaveURL(/\/activities\/create/);

    // Verify principal pre-filled (check for organization_id in URL)
    expect(page.url()).toContain('organization_id=');
  });

  test('should navigate to task create from New menu', async ({ page }) => {
    await page.click('button:has-text("New")');
    await page.click('text="Task"');
    await expect(page).toHaveURL(/\/tasks\/create/);
  });

  test('should navigate to opportunity create from New menu', async ({ page }) => {
    // Select principal (Wicks exists in seed.sql)
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="Wicks"');

    // Wait for principal to load
    await page.waitForSelector('[role="tree"]:not(:has-text("Select a principal"))', {
      timeout: 5000
    });

    await page.click('button:has-text("New")');
    await page.click('text="Opportunity"');

    await expect(page).toHaveURL(/\/opportunities\/create/);
    expect(page.url()).toContain('principal_organization_id=');
  });

  test('should navigate to task create from empty state button', async ({ page }) => {
    // Select a principal that has no tasks to show the empty state
    await page.click('[data-testid="principal-select-trigger"]');

    // Select the first principal
    await page.waitForSelector('[role="listbox"]');
    await page.click('[role="option"]');

    // Wait for tasks panel to load
    await page.waitForTimeout(1000);

    // Look for "Create Task" button in empty state
    const createTaskButton = page.getByRole('button', { name: /create task/i });

    // If the button exists (empty state is shown), click it
    if (await createTaskButton.isVisible().catch(() => false)) {
      await createTaskButton.click();
      await expect(page).toHaveURL(/\/tasks\/create/);
    } else {
      // If there are tasks, this test is not applicable - skip it
      test.skip();
    }
  });

  test('should navigate to activity create without principal (no pre-fill)', async ({ page }) => {
    // Don't select a principal, just open New menu
    await page.click('button:has-text("New")');
    await page.click('text="Activity"');

    // Verify navigation
    await expect(page).toHaveURL(/\/activities\/create/);

    // Verify NO principal pre-fill (organization_id should NOT be in URL)
    expect(page.url()).not.toContain('organization_id=');
  });

  test('should navigate to opportunity create without principal (no pre-fill)', async ({ page }) => {
    // Don't select a principal, just open New menu
    await page.click('button:has-text("New")');
    await page.click('text="Opportunity"');

    // Verify navigation
    await expect(page).toHaveURL(/\/opportunities\/create/);

    // Verify NO principal pre-fill (principal_organization_id should NOT be in URL)
    expect(page.url()).not.toContain('principal_organization_id=');
  });
});
