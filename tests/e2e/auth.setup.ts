import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Increase timeout for initial load
  setup.setTimeout(120000);

  console.log('Starting authentication setup...');

  // Navigate to app
  await page.goto('/', { waitUntil: 'load', timeout: 60000 });

  console.log('Page loaded, waiting for login form...');

  // Wait for login form with extended timeout
  const emailInput = page.locator('input[name="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 60000 });

  console.log('Login form found, filling credentials...');

  // Fill login form
  await emailInput.fill('admin@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  console.log('Submitted login, waiting for dashboard...');

  // Wait for navigation to dashboard
  await page.waitForURL(/\/#\//, { timeout: 30000 });

  console.log('Dashboard loaded, saving auth state...');

  // Verify we're logged in
  await expect(page).toHaveURL(/\/#\//);

  // Save auth state
  await page.context().storageState({ path: authFile });

  console.log('Auth state saved successfully!');
});
