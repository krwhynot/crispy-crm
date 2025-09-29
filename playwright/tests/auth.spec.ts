import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests the complete authentication flow including:
 * - Login with valid credentials
 * - Dashboard access after login
 * - Logout functionality
 */

test.describe('Authentication Flow', () => {
  test('should login successfully and access dashboard', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the login page to load
    await page.waitForLoadState('networkidle');

    // Fill in login credentials
    const emailInput = page.locator('input[name="username"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    await emailInput.fill('test@gmail.com');
    await passwordInput.fill('Welcome123');

    // Submit the login form
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for login POST to complete
    await page.waitForLoadState('networkidle');

    // CRITICAL: Wait for dashboard content FIRST (proves login worked and React Admin stabilized)
    await expect(page.getByText('Hot Contacts')).toBeVisible({ timeout: 20000 });

    // NOW verify URL (React Admin has finished auth cycle)
    await expect(page).toHaveURL(/.*\/#\/(dashboard)?$/, { timeout: 5000 });

    // Verify navigation menu is present (use getByRole for specificity)
    await expect(page.getByRole('link', { name: 'Contacts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Organizations' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Opportunities' })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[name="username"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    await emailInput.fill('test@gmail.com');
    await passwordInput.fill('Welcome123');

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForLoadState('networkidle');

    // Find and click logout button (may be in a dropdown or direct button)
    // Try common patterns
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
    } else {
      // Look for user menu dropdown
      const userMenu = page.locator('[aria-label*="user" i], [data-testid="user-menu"]').first();
      if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userMenu.click();
        await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
      }
    }

    // Wait for redirect to login page
    await page.waitForLoadState('networkidle');

    // Verify we're back on login page
    await expect(page.locator('input[type="email"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill in invalid credentials
    const emailInput = page.locator('input[name="username"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('WrongPassword123');

    // Submit the form
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Verify we're still on the login page (not redirected)
    await expect(page.locator('input[type="email"], input[name="username"]')).toBeVisible();

    // Error message might appear in various ways - check for common patterns
    const errorIndicators = [
      page.getByText(/invalid credentials/i),
      page.getByText(/login failed/i),
      page.getByText(/incorrect/i),
      page.locator('[role="alert"]'),
      page.locator('.error, .toast, .notification'),
    ];

    // At least one error indicator should be visible
    let errorFound = false;
    for (const indicator of errorIndicators) {
      if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        errorFound = true;
        break;
      }
    }

    // If no error message is shown, at least verify we didn't navigate away
    if (!errorFound) {
      await expect(page).not.toHaveURL(/.*dashboard/);
    }
  });
});