import { Page } from '@playwright/test';

/**
 * Login helper for E2E tests
 * Handles authentication and waits for the app to be ready
 */
export async function login(page: Page) {
  // Navigate and wait for the app to load
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for React app to initialize - check for either login form or dashboard
  await page.waitForFunction(
    () => {
      // Check if we're already logged in (dashboard visible)
      if (window.location.hash === '#/') return true;
      // Or if login form is ready
      const emailInput = document.querySelector('input[name="email"]');
      return emailInput !== null;
    },
    { timeout: 30000 }
  );

  // If we're already on the dashboard, we're done
  if (page.url().includes('/#/')) {
    return;
  }

  // Fill in login form
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/#\//, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}
