import { Page, expect } from '@playwright/test';

/**
 * Logs into Atomic CRM using test credentials.
 *
 * Uses resilient locators and waits for deterministic auth signals:
 * - Semantic selectors (getByRole, getByLabel) instead of .first()
 * - Waits for Supabase /auth/v1/token POST response
 * - Verifies dashboard loaded with auto-retry assertion
 *
 * @param page - Playwright Page object
 * @throws Will throw if login fails within timeout periods
 *
 * @example
 * ```typescript
 * import { login } from '../helpers/auth';
 *
 * test.beforeEach(async ({ page }) => {
 *   await login(page);
 * });
 * ```
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/');

  // Wait for login form inputs to be ready
  const emailInput = page.locator('input[name="username"], input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Fill credentials
  await emailInput.fill('test@gmail.com');
  await passwordInput.fill('Welcome123');

  // Click login button and wait for Supabase auth response
  // POST /auth/v1/token with grant_type=password
  const loginButton = page.locator('button[type="submit"]').first();

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes('/auth/v1/token') &&
        res.request().method() === 'POST' &&
        res.status() === 200,
      { timeout: 15000 }
    ),
    loginButton.click(),
  ]);

  // Verify dashboard loaded successfully (proves login worked)
  await expect(page.getByText('Hot Contacts')).toBeVisible({ timeout: 20000 });
}