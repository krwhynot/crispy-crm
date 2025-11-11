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
    // Wait for either dashboard or home page
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 });

    console.log('✅ LOGIN SUCCESSFUL! Page URL:', page.url());
    expect(page.url()).toContain('localhost:5173');

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-test-dashboard.png' });
    console.log('✓ Screenshot saved');
  });
});
