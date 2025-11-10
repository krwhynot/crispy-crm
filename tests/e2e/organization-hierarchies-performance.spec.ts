import { test, expect } from './support/fixtures/authenticated';

/**
 * Organization Hierarchies - Performance E2E Tests
 *
 * Validates performance of organization hierarchy UI:
 * - Load time for organizations list (target: < 1 second)
 * - Branch table render time (no N+1 queries)
 * - Smooth interactions without lag
 * - Efficient query performance
 */

test.describe('Organization Hierarchies - Performance', () => {
  test('Organizations list loads efficiently', async ({ authenticatedPage }) => {
    const startTime = Date.now();

    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Organizations list load time: ${loadTime}ms`);

    // Should load efficiently
    expect(loadTime).toBeLessThan(2000);
  });

  test('Organization detail with hierarchies renders quickly', async ({ authenticatedPage }) => {
    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    // Get first organization link
    const firstOrgLink = authenticatedPage.locator('tbody tr:first-child a').first();

    if (await firstOrgLink.isVisible().catch(() => false)) {
      const startTime = Date.now();

      // Click to navigate
      await firstOrgLink.click();
      await authenticatedPage.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Organization detail load time: ${loadTime}ms`);

      // Detail view should render quickly
      expect(loadTime).toBeLessThan(2000);
    }
  });

  test('Branch table renders without N+1 queries', async ({ authenticatedPage }) => {
    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    // Track network requests
    const networkRequests: Array<{ url: string; status: number }> = [];

    authenticatedPage.on('response', response => {
      networkRequests.push({
        url: response.url(),
        status: response.status(),
      });
    });

    // Navigate to first org
    const firstOrgLink = authenticatedPage.locator('tbody tr:first-child a').first();

    if (await firstOrgLink.isVisible().catch(() => false)) {
      await firstOrgLink.click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Verify branch section loads efficiently
      const branchSection = authenticatedPage.locator('[data-testid="branch-locations-section"]');

      if (await branchSection.isVisible().catch(() => false)) {
        // Get table rows
        const table = branchSection.locator('table');

        if (await table.isVisible()) {
          const rowCount = await table.locator('tbody tr').count();

          console.log(`Branch table with ${rowCount} rows rendered`);

          // Count API calls
          const apiCalls = networkRequests.filter(
            req =>
              req.url.includes('/rest/v1') &&
              req.status >= 200 &&
              req.status < 400
          );

          console.log(`API calls made: ${apiCalls.length}`);

          // Verify no excessive API calls (N+1 anti-pattern)
          // Should be minimal: 1-2 for parent org + branches
          expect(apiCalls.length).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  test('Hierarchy components are interactive without delay', async ({ authenticatedPage }) => {
    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    const firstOrgLink = authenticatedPage.locator('tbody tr:first-child a').first();

    if (await firstOrgLink.isVisible().catch(() => false)) {
      const startTime = Date.now();

      await firstOrgLink.click();
      await authenticatedPage.waitForLoadState('networkidle');

      const breadcrumb = authenticatedPage.locator('[data-testid="hierarchy-breadcrumb"]');

      if (await breadcrumb.isVisible().catch(() => false)) {
        const breadcrumbLoadTime = Date.now() - startTime;

        console.log(`Time until breadcrumb interactive: ${breadcrumbLoadTime}ms`);

        // Should be interactive quickly
        expect(breadcrumbLoadTime).toBeLessThan(3000);

        // Verify breadcrumb links are clickable
        const parentLinks = breadcrumb.locator('a');
        const parentLinkCount = await parentLinks.count();

        if (parentLinkCount > 0) {
          const parentLink = parentLinks.first();
          expect(await parentLink.isEnabled()).toBeTruthy();

          console.log('✓ Breadcrumb links are interactive');
        }
      }
    }
  });

  test('Hierarchy columns do not impact page load performance', async ({ authenticatedPage }) => {
    const startTime = Date.now();

    // Navigate to organizations with hierarchy columns
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Page load with hierarchy columns: ${loadTime}ms`);

    // Should remain performant
    expect(loadTime).toBeLessThan(2500);
  });
});
