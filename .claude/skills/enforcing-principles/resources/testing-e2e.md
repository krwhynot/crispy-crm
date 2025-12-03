# Testing: E2E Tests with Playwright

## Purpose

Document E2E testing patterns for critical user journeys and accessibility.

## Pattern: Critical Journey Test

**From `tests/e2e/dashboard-verification-simple.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard - Critical Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test('displays key metrics', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="opportunities-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="contacts-card"]')).toBeVisible();
  });

  test('navigates to opportunities list', async ({ page }) => {
    await page.click('[data-testid="opportunities-card"]');
    await expect(page).toHaveURL('/opportunities');
    await expect(page.locator('h1')).toContainText('Opportunities');
  });

  test('creates new contact', async ({ page }) => {
    await page.click('a[href="/contacts"]');
    await expect(page).toHaveURL('/contacts');

    await page.click('button:has-text("Create")');

    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="email.0.email"]', 'john@example.com');

    await page.click('button:has-text("Save")');

    await expect(page.locator('.notification-success')).toBeVisible();
    await expect(page).toHaveURL(/\/contacts\/\d+\/show/);
  });
});
```

**Pattern:**
- Test complete user journeys (login → action → result)
- Use data-testid for stable selectors
- Wait for elements with `expect().toBeVisible()`
- Test navigation and URL changes
- Verify success/error notifications

## Pattern: Accessibility Testing

```typescript
test('meets WCAG AA standards', async ({ page }) => {
  await page.goto('/contacts');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toHaveLength(0);
});

test('keyboard navigation works', async ({ page }) => {
  await page.goto('/contacts');

  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="first_name"]')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="last_name"]')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('.notification')).toBeVisible();
});
```

## What to Test

**DO Test:**
- ✅ Critical user journeys (E2E)
- ✅ Navigation and URL changes
- ✅ Success/error notifications
- ✅ Accessibility (WCAG AA, keyboard nav)

**DON'T Test:**
- ❌ CSS styling (use visual regression instead)
- ❌ Unit logic (use Vitest)
- ❌ Slow E2E tests for unit logic

## Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests headed (visible browser)
npm run test:e2e:headed

# Run E2E against staging
VITE_SUPABASE_URL=$STAGING_URL npm run test:e2e
```

## Related Resources

- [testing-unit.md](testing-unit.md) - Unit tests with Vitest
- [testing-reference.md](testing-reference.md) - Coverage, organization
- [anti-patterns-testing.md](anti-patterns-testing.md) - Testing mistakes

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
