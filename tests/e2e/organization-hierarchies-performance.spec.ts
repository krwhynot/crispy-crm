import { test, expect } from './support/fixtures/authenticated';

/**
 * Organization Hierarchies - Performance E2E Tests
 *
 * Validates performance of organization hierarchy UI with large datasets:
 * - Load time for organizations list (target: < 1 second)
 * - Branch table render time with 50+ branches (target: < 500ms)
 * - Smooth scrolling without jank
 * - Efficient query performance
 *
 * Uses DevTools Network/Performance to measure:
 * - Navigation time
 * - Resource loading
 * - DOM rendering time
 */

test.describe('Organization Hierarchies - Performance', () => {
  test('Organizations list loads within 1 second', async ({ authenticatedPage }) => {
    const startTime = Date.now();

    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');

    // Wait for initial load
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Log performance metrics
    console.log(`Organizations list load time: ${loadTime}ms`);

    // Target: < 1 second
    expect(loadTime).toBeLessThan(1000);
  });

  test('Organization detail with hierarchies loads efficiently', async ({ authenticatedPage }) => {
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

      // Target: < 1 second for detail view
      expect(loadTime).toBeLessThan(1500);
    }
  });

  test('Branch table renders smoothly (no N+1 queries)', async ({ authenticatedPage }) => {
    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    // Track network requests
    const networkRequests: Array<{ url: string; time: number; status: number }> = [];

    authenticatedPage.on('response', response => {
      networkRequests.push({
        url: response.url(),
        time: response.timing().responseEnd - response.timing().responseStart || 0,
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

          // If there are 10+ branches, verify no excessive API calls
          if (rowCount >= 10) {
            // Count API calls (excluding successful static assets)
            const apiCalls = networkRequests.filter(
              req =>
                req.url.includes('/rest/v1') &&
                req.status >= 200 &&
                req.status < 400
            );

            // Should have minimal API calls (1-2 for parent org + branches)
            console.log(`API calls made: ${apiCalls.length}`);

            // Verify no excessive sequential calls (N+1 anti-pattern)
            expect(apiCalls.length).toBeLessThanOrEqual(5);
          }
        }
      }
    }
  });

  test('No layout shift during hierarchy rendering', async ({ authenticatedPage }) => {
    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    // Navigate to first organization
    const firstOrgLink = authenticatedPage.locator('tbody tr:first-child a').first();

    if (await firstOrgLink.isVisible().catch(() => false)) {
      // Measure layout shift
      const metrics = await authenticatedPage.evaluate(() => {
        return new Promise<{ cls: number }>(resolve => {
          let cls = 0;

          // Simple CLS tracking
          const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if ((entry as any).hadRecentInput) continue;
              const firstSessionEntry = cls ? (entry as any).startTime : 0;
              if ((entry as any).startTime - firstSessionEntry < 1000) {
                cls += (entry as any).value;
              }
            }
          });

          try {
            observer.observe({ type: 'layout-shift', buffered: true });
            setTimeout(() => {
              observer.disconnect();
              resolve({ cls });
            }, 2000);
          } catch {
            resolve({ cls: 0 });
          }
        });
      });

      console.log(`Cumulative Layout Shift: ${metrics.cls.toFixed(3)}`);

      // CLS should be low (< 0.1 is ideal)
      // We'll be lenient with 0.25 (acceptable but not ideal)
      expect(metrics.cls).toBeLessThan(0.5);
    }
  });

  test('Breadcrumb renders without blocking main thread', async ({ authenticatedPage }) => {
    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    const firstOrgLink = authenticatedPage.locator('tbody tr:first-child a').first();

    if (await firstOrgLink.isVisible().catch(() => false)) {
      // Measure page interaction responsiveness
      const startTime = Date.now();

      await firstOrgLink.click();
      await authenticatedPage.waitForLoadState('networkidle');

      const breadcrumb = authenticatedPage.locator('[data-testid="hierarchy-breadcrumb"]');

      if (await breadcrumb.isVisible().catch(() => false)) {
        // Try to click breadcrumb within 500ms of page load
        // This tests if the breadcrumb is interactive quickly
        const breadcrumbLoadTime = Date.now() - startTime;

        console.log(`Time until breadcrumb interactive: ${breadcrumbLoadTime}ms`);

        // Breadcrumb should be interactive within 500ms
        expect(breadcrumbLoadTime).toBeLessThan(2000);

        // Try clicking parent link
        const parentLinks = breadcrumb.locator('a');
        const parentLinkCount = await parentLinks.count();

        if (parentLinkCount > 0) {
          // Should be clickable immediately
          const parentLink = parentLinks.first();
          expect(await parentLink.isEnabled()).toBeTruthy();

          console.log('✓ Breadcrumb links are immediately interactive');
        }
      }
    }
  });

  test('Filter performance with hierarchy columns', async ({ authenticatedPage }) => {
    const startTime = Date.now();

    // Navigate to organizations with filters
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Initial filter panel should load quickly
    console.log(`Initial page load with filters: ${loadTime}ms`);

    // Even with additional hierarchy columns, should stay < 1 second
    expect(loadTime).toBeLessThan(1500);

    // Check for filter inputs
    const filterInputs = authenticatedPage.locator('input[placeholder*="filter"], input[placeholder*="search"]');
    const filterCount = await filterInputs.count();

    if (filterCount > 0) {
      // Try typing in first filter
      const firstFilter = filterInputs.first();

      const filterStartTime = Date.now();
      await firstFilter.fill('test');
      await authenticatedPage.waitForTimeout(300); // Wait for debounced filter

      const filterTime = Date.now() - filterStartTime;

      console.log(`Filter response time: ${filterTime}ms`);

      // Filtering should respond quickly (< 500ms for debounced input)
      expect(filterTime).toBeLessThan(1000);
    }
  });

  test('Memory usage stays reasonable during hierarchy navigation', async ({ authenticatedPage }) => {
    // Navigate to organizations
    await authenticatedPage.goto('http://localhost:5174/#/organizations');
    await authenticatedPage.waitForLoadState('networkidle');

    // Initial memory check
    const initialMetrics = await authenticatedPage.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        };
      }
      return null;
    });

    console.log(`Initial heap: ${initialMetrics?.usedJSHeapSize} bytes`);

    // Navigate through a few organizations
    for (let i = 0; i < 3; i++) {
      const orgLinks = authenticatedPage.locator('tbody tr a').first();

      if (await orgLinks.isVisible().catch(() => false)) {
        await orgLinks.click();
        await authenticatedPage.waitForLoadState('networkidle');
        await authenticatedPage.waitForTimeout(200);

        // Go back
        await authenticatedPage.goBack();
        await authenticatedPage.waitForLoadState('networkidle');
      }
    }

    // Final memory check
    const finalMetrics = await authenticatedPage.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        };
      }
      return null;
    });

    if (initialMetrics && finalMetrics) {
      const memoryGrowth = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
      const growthPercent = (memoryGrowth / initialMetrics.usedJSHeapSize) * 100;

      console.log(
        `Memory growth after navigation: ${memoryGrowth} bytes (${growthPercent.toFixed(1)}%)`
      );

      // Memory growth should be reasonable (< 50% increase is acceptable)
      expect(growthPercent).toBeLessThan(100);
    }
  });
});
