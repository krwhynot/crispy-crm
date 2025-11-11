import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Test', () => {
  test('can load login page and attempt login', async ({ page }) => {
    console.log('✓ Opening http://localhost:5173');
    await page.goto('http://localhost:5173');

    console.log('✓ Waiting for login page...');
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 });

    console.log('✓ Filling credentials (admin@test.com)...');
    // Fill and trigger proper events for React Admin form validation
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('admin@test.com');
    await emailInput.press('Tab'); // Trigger blur to validate

    await passwordInput.fill('password123');
    await passwordInput.press('Tab'); // Trigger blur to validate

    // Wait for button to be enabled
    console.log('✓ Waiting for submit button to be enabled...');
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5000 });

    console.log('✓ Clicking login button...');
    await page.click('button[type="submit"]');

    console.log('✓ Waiting for dashboard redirect...');
    // Wait for hash routing redirect (React Admin uses /#/)
    await page.waitForURL(/\/#\//, { timeout: 15000 });

    console.log('✅ LOGIN SUCCESSFUL! Page URL:', page.url());
    expect(page.url()).toContain('localhost:5173/#/');

    // Verify we're on the dashboard (no login form visible)
    const loginFormVisible = await page.locator('input[name="email"]').isVisible().catch(() => false);
    expect(loginFormVisible).toBe(false);

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-test-dashboard.png' });
    console.log('✓ Screenshot saved');
  });
});
