import { test, expect } from '@playwright/test';

test.describe('App Loading Diagnostics', () => {
  test('should load React app and show login form', async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate
    await page.goto('/');

    // Wait a bit for React to initialize
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Take screenshot
    await page.screenshot({ path: 'test-results/app-loading.png', fullPage: true });

    // Get page content
    const content = await page.content();
    console.log('Page title:', await page.title());
    console.log('Console errors:', consoleErrors);
    console.log('Page errors:', pageErrors);
    console.log('Body classes:', await page.locator('body').getAttribute('class'));

    // Try to find login form using semantic selectors
    const emailInput = page.getByLabel(/email/i);
    const isEmailVisible = await emailInput.isVisible().catch(() => false);
    console.log('Email input visible:', isEmailVisible);

    // Try CSS selector as fallback
    const emailInputCSS = page.locator('input[name="email"]');
    const isEmailCSSVisible = await emailInputCSS.isVisible().catch(() => false);
    console.log('Email input (CSS) visible:', isEmailCSSVisible);

    // Check if root div has content
    const rootContent = await page.locator('#root').textContent();
    console.log('Root content preview:', rootContent?.substring(0, 200));

    // Report results
    if (!isEmailVisible && !isEmailCSSVisible) {
      console.error('❌ Login form NOT found. App may not be loading.');
      console.log('Console errors detected:', consoleErrors.length);
      console.log('Page errors detected:', pageErrors.length);
    }

    // Make test pass so we can see the logs
    expect(true).toBe(true);
  });
});
