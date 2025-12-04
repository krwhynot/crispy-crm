import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle between light and dark mode', async ({ page }) => {
    // Get the html element to check for dark class
    const html = page.locator('html');

    // Find the theme toggle button by its aria-label
    const themeToggle = page.getByRole('button', { name: /toggle theme|switch to/i });

    // Initially should be light mode (no .dark class) or system default
    const initialClass = await html.getAttribute('class');

    // Click to toggle theme
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(100);

    // Class should have changed
    const newClass = await html.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });

  test('should persist theme preference after reload', async ({ page }) => {
    const html = page.locator('html');
    const themeToggle = page.getByRole('button', { name: /toggle theme|switch to/i });

    // Set to dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Verify dark mode is active
    const isDark = await html.evaluate(el => el.classList.contains('dark'));

    // Reload the page
    await page.reload();

    // Theme should persist
    const isDarkAfterReload = await html.evaluate(el => el.classList.contains('dark'));
    expect(isDarkAfterReload).toBe(isDark);
  });

  test('should apply correct computed styles for each theme', async ({ page }) => {
    const html = page.locator('html');
    const body = page.locator('body');
    const themeToggle = page.getByRole('button', { name: /toggle theme|switch to/i });

    // Get initial background color (light mode)
    const lightBgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);

    // Switch to dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Verify dark class is applied
    await expect(html).toHaveClass(/dark/);

    // Verify background color changed (computed style assertion)
    const darkBgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(darkBgColor).not.toBe(lightBgColor);
  });

  test('should have no console errors during theme switch', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const themeToggle = page.getByRole('button', { name: /toggle theme|switch to/i });

    // Toggle theme multiple times
    await themeToggle.click();
    await page.waitForTimeout(100);
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Filter out known non-critical errors (like RLS if not authenticated)
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('RLS') && !err.includes('not authenticated')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
