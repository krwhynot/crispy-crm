import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Test', () => {
  test('can load login page and attempt login', async ({ page }) => {
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });

    // Monitor failed requests
    page.on('requestfailed', request => {
      console.log('❌ Request failed:', request.url(), request.failure()?.errorText);
    });

    console.log('✓ Opening http://localhost:5173');
    await page.goto('http://localhost:5173');

    console.log('✓ Waiting for login page...');
    // Use semantic selectors like the POM does
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    console.log('✓ Filling credentials (admin@test.com)...');
    // Use the same approach as LoginPage POM
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('password123');

    console.log('✓ Clicking login button...');
    // Click sign in button using semantic selector
    const submitButton = page.getByRole('button', { name: /sign in|login/i });

    // Wait for any API response after clicking
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/auth/v1/token') && resp.status() >= 200,
      { timeout: 5000 }
    ).catch(() => null);

    await submitButton.click();

    const response = await responsePromise;
    if (response) {
      console.log(`✓ Auth response: ${response.status()}`);
      if (response.status() >= 400) {
        const body = await response.text();
        console.log('❌ Auth error:', body);
      }
    } else {
      console.log('⚠️ No auth response received');
    }

    console.log('✓ Waiting for dashboard redirect...');
    // Wait for hash routing redirect (React Admin uses /#/)
    await page.waitForURL(/\/#\//, { timeout: 15000 });

    console.log('✅ LOGIN SUCCESSFUL! Page URL:', page.url());
    expect(page.url()).toContain('localhost:5173/#/');

    // Verify we're on the dashboard (no login form visible)
    const loginFormVisible = await emailInput.isVisible().catch(() => false);
    expect(loginFormVisible).toBe(false);

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-test-dashboard.png' });
    console.log('✓ Screenshot saved');
  });
});
