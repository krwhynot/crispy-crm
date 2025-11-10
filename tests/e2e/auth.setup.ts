import { test as setup } from '@playwright/test';
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

  // Save auth state
  await page.context().storageState({ path: authFile });

  console.log('Auth state saved successfully!');
});
