import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './support/poms/LoginPage';

const authFile = 'tests/e2e/.auth/user.json';

/**
 * Authentication setup using Page Object Model
 * Follows playwright-e2e-testing skill requirements:
 * - Uses POM (LoginPage)
 * - Semantic selectors only
 * - Condition-based waiting
 */
setup('authenticate', async ({ page }) => {
  // Increase timeout for initial load
  setup.setTimeout(120000);

  console.log('Starting authentication setup...');

  // Use the LoginPage POM
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  console.log('Dashboard loaded, saving auth state...');

  // Diagnostic: Check what auth state actually contains BEFORE saving
  const storageState = await page.context().storageState();
  console.log('=== AUTH DIAGNOSTIC ===');
  console.log('Cookies count:', storageState.cookies.length);
  console.log('Origins count:', storageState.origins.length);
  if (storageState.cookies.length > 0) {
    console.log('Cookie domains:', storageState.cookies.map(c => c.domain));
  }
  if (storageState.origins.length > 0) {
    console.log('Origin URLs:', storageState.origins.map(o => o.origin));
    console.log('LocalStorage keys:', storageState.origins.flatMap(o =>
      o.localStorage.map(item => item.name)
    ));
  }
  console.log('Current URL:', page.url());
  console.log('======================');

  // Save auth state
  await page.context().storageState({ path: authFile });

  console.log('Auth state saved successfully!');
});
