import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Test', () => {
  test('can load login page and attempt login', async ({ page }) => {
    console.log('✓ Opening http://localhost:5173');
    await page.goto('http://localhost:5173');

    console.log('✓ Waiting for login page...');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });

    console.log('✓ Filling credentials (admin@test.com)...');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');

    console.log('✓ Clicking login button...');
    await page.click('button[type="submit"]');

    console.log('✓ Waiting for dashboard redirect...');
    // Wait for successful login - app removes login form
    await page.waitForSelector('input[name="email"]', { state: 'hidden', timeout: 15000 });

    // Give it a moment to complete navigation
    await page.waitForTimeout(1000);

    console.log('✅ LOGIN SUCCESSFUL! Page URL:', page.url());
    expect(page.url()).toContain('localhost:5173');

    // Verify we're on the dashboard (no login form visible)
    const loginFormVisible = await page.locator('input[name="email"]').isVisible().catch(() => false);
    expect(loginFormVisible).toBe(false);

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-test-dashboard.png' });
    console.log('✓ Screenshot saved');
  });
});
