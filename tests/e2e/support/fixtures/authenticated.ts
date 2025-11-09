import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { consoleMonitor } from '../utils/console-monitor';

/**
 * Authenticated page fixture
 * Provides a page with console monitoring attached
 * Authentication is handled via storage state (see playwright.config.ts)
 *
 * Required by playwright-e2e-testing skill
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Page already has auth from storage state
    // Provide the page to the test
    await use(page);

    // Report console errors after test (if any)
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }

    // Clear errors for next test
    consoleMonitor.clear();
  },
});

export { expect } from '@playwright/test';
