import { test, expect, Page, Response } from '@playwright/test';

/**
 * Principal Dashboard V2 - Selector Semantics Test
 *
 * Verifies that the principal selector properly gates data fetching and UI state:
 * - No selection = no data calls, disabled logger, gated UI
 * - Principal selected = data calls fire, logger enabled, content visible
 *
 * Note: "All Principals" option removed in favor of principal-centric workflow.
 * The test for this option will skip if the option is not present.
 */

// ============================================================================
// Helper Functions (Self-Contained)
// ============================================================================

/**
 * Network instrumentation to count Supabase REST API calls
 */
interface NetworkCounters {
  oppsRequests: number;
  tasksRequests: number;
}

function setupNetworkMonitoring(page: Page): NetworkCounters {
  const counters: NetworkCounters = {
    oppsRequests: 0,
    tasksRequests: 0,
  };

  page.on('request', (request) => {
    const url = request.url();

    // Match Supabase REST API calls for principal_opportunities
    if (url.includes('/rest/v1/') && url.includes('principal_opportunities')) {
      counters.oppsRequests++;
    }

    // Match Supabase REST API calls for priority_tasks
    if (url.includes('/rest/v1/') && url.includes('priority_tasks')) {
      counters.tasksRequests++;
    }
  });

  return counters;
}

/**
 * Helper to select a principal from the Radix Select component
 * Tries multiple locator strategies in order of preference
 */
async function selectPrincipal(page: Page, principalName: string): Promise<void> {
  await test.step(`Select principal: ${principalName}`, async () => {
    // Open the select dropdown (try multiple strategies)
    const triggerButton = page.getByTestId('principal-select-trigger')
      .or(page.getByRole('button', { name: /select principal/i }))
      .or(page.getByRole('combobox').first());

    await triggerButton.click();

    // Wait for the listbox to appear
    await expect(page.getByRole('listbox').or(page.getByRole('menu'))).toBeVisible();

    // Select the option (try by name first, then fall back to first real option)
    const option = page.getByRole('option', { name: new RegExp(principalName, 'i') });

    const optionCount = await option.count();
    if (optionCount > 0) {
      await option.first().click();
    } else {
      // Fallback: click first real option (skip placeholders)
      const firstOption = page.getByRole('option').nth(1);
      await firstOption.click();
    }
  });
}

/**
 * Console error monitoring setup
 */
interface ConsoleMonitor {
  errors: string[];
  warnings: string[];
}

function setupConsoleMonitoring(page: Page): ConsoleMonitor {
  const monitor: ConsoleMonitor = {
    errors: [],
    warnings: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      monitor.errors.push(msg.text());
    }
    if (msg.type() === 'warning') {
      monitor.warnings.push(msg.text());
    }
  });

  return monitor;
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Principal Dashboard V2 - Selector Semantics', () => {
  const DASHBOARD_URL = 'http://127.0.0.1:5173/?layout=v2';

  test.beforeEach(async ({ page }) => {
    // Navigate to Dashboard V2 and wait for network idle
    await test.step('Navigate to Dashboard V2', async () => {
      await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });
    });
  });

  test('should gate data fetching and UI when no principal is selected', async ({ page }) => {
    const consoleMonitor = setupConsoleMonitoring(page);
    const counters = setupNetworkMonitoring(page);

    // Reset counters after initial page load
    await test.step('Wait for initial page settle', async () => {
      await page.waitForLoadState('networkidle');
      counters.oppsRequests = 0;
      counters.tasksRequests = 0;
    });

    await test.step('Assert no data requests made for opportunities', async () => {
      // Wait a moment to ensure no delayed requests fire
      await expect.poll(() => counters.oppsRequests, {
        timeout: 3000,
        message: 'Expected no principal_opportunities requests without selection',
      }).toBe(0);
    });

    await test.step('Assert no data requests made for tasks', async () => {
      expect(counters.tasksRequests).toBe(0);
    });

    await test.step('Assert Quick Logger is disabled with helper text', async () => {
      // Try multiple strategies to find the submit button
      const submitButton = page.getByTestId('quick-logger-submit')
        .or(page.getByRole('button', { name: /log activity/i }))
        .or(page.getByRole('button', { name: /submit/i }).filter({ has: page.locator('[data-logger]') }));

      await expect(submitButton.first()).toBeDisabled();

      // Assert helper text is visible (use testid to avoid strict mode violation)
      const helperText = page.getByTestId('quick-logger-helper');
      await expect(helperText).toBeVisible();
    });

    await test.step('Assert opportunities panel shows gated state', async () => {
      // Look for gated state messaging
      const gatedMessage = page.getByText(/select a principal to view opportunities/i)
        .or(page.getByText(/no principal selected/i));

      await expect(gatedMessage.first()).toBeVisible();
    });

    await test.step('Assert no critical console errors', async () => {
      // Filter out non-critical warnings
      const criticalErrors = consoleMonitor.errors.filter(
        (error) => !error.includes('DevTools') && !error.includes('extension')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test('should fetch data and enable UI when principal is selected', async ({ page }) => {
    const consoleMonitor = setupConsoleMonitoring(page);
    const counters = setupNetworkMonitoring(page);

    // Reset counters after initial page load
    await page.waitForLoadState('networkidle');
    counters.oppsRequests = 0;
    counters.tasksRequests = 0;

    await selectPrincipal(page, 'Acme Corp');

    await test.step('Assert opportunities data request fires', async () => {
      // Wait for at least one principal_opportunities request
      const oppsResponse = page.waitForResponse(
        (resp) => resp.url().includes('principal_opportunities') && resp.status() === 200,
        { timeout: 5000 }
      );

      await expect(oppsResponse).resolves.toBeDefined();

      // Verify counter incremented
      await expect.poll(() => counters.oppsRequests, {
        timeout: 3000,
      }).toBeGreaterThan(0);
    });

    await test.step('Assert tasks data request fires', async () => {
      // Wait for at least one priority_tasks request
      const tasksResponse = page.waitForResponse(
        (resp) => resp.url().includes('priority_tasks') && resp.status() === 200,
        { timeout: 5000 }
      );

      await expect(tasksResponse).resolves.toBeDefined();

      // Verify counter incremented
      expect(counters.tasksRequests).toBeGreaterThan(0);
    });

    await test.step('Assert Quick Logger is enabled', async () => {
      const submitButton = page.getByTestId('quick-logger-submit')
        .or(page.getByRole('button', { name: /log activity/i }))
        .or(page.getByRole('button', { name: /submit/i }).filter({ has: page.locator('[data-logger]') }));

      await expect(submitButton.first()).toBeEnabled();
    });

    await test.step('Assert opportunities panel shows content', async () => {
      // Wait for loaded state - look for list items or non-gated content
      const opportunitiesList = page.getByRole('list')
        .or(page.getByRole('tree'))
        .or(page.locator('[data-opportunities-list]'));

      // Alternative: check that gated message is NOT visible
      const gatedMessage = page.getByText(/select a principal to view opportunities/i);

      // One of these should be true: list exists OR gated message is hidden
      const listVisible = await opportunitiesList.first().isVisible().catch(() => false);
      const gatedHidden = await gatedMessage.isHidden().catch(() => true);

      expect(listVisible || gatedHidden).toBe(true);
    });

    await test.step('Assert tasks panel is present (may be empty)', async () => {
      // The data request fired successfully, so the panel should be present
      // It may show "No tasks" or be empty if there's no data, which is acceptable
      const taskPanel = page.locator('[data-tasks-panel]')
        .or(page.getByRole('region', { name: /tasks/i }))
        .or(page.locator('text=/tasks/i').locator('..'));

      // Just verify the panel exists (data may or may not be present)
      await expect(taskPanel.first()).toBeAttached();
    });

    await test.step('Assert no critical console errors', async () => {
      const criticalErrors = consoleMonitor.errors.filter(
        (error) => !error.includes('DevTools') && !error.includes('extension')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test('should return to gated state when "All Principals" is selected', async ({ page }) => {
    const consoleMonitor = setupConsoleMonitoring(page);

    await test.step('Skip if "All Principals" option is not available', async () => {
      // Try to open the select
      const triggerButton = page.getByTestId('principal-select-trigger')
        .or(page.getByRole('button', { name: /select principal/i }))
        .or(page.getByRole('combobox').first());

      await triggerButton.click();

      // Check if "All Principals" option exists
      const allPrincipalsOption = page.getByRole('option', { name: /all principals/i });
      const hasAllPrincipals = await allPrincipalsOption.count() > 0;

      if (!hasAllPrincipals) {
        test.skip();
      }

      // Close the select if we're continuing
      await page.keyboard.press('Escape');
    });

    // First, select a specific principal to get out of gated state
    await selectPrincipal(page, 'Acme Corp');

    // Wait for data to load
    await page.waitForResponse(
      (resp) => resp.url().includes('principal_opportunities'),
      { timeout: 5000 }
    );

    // Now select "All Principals"
    const counters = setupNetworkMonitoring(page);
    await selectPrincipal(page, 'All Principals');

    await test.step('Assert returns to gated state with no new data requests', async () => {
      // Wait a moment to ensure no new scoped requests fire
      await expect.poll(() => counters.oppsRequests + counters.tasksRequests, {
        timeout: 3000,
      }).toBe(0);
    });

    await test.step('Assert Quick Logger is disabled again', async () => {
      const submitButton = page.getByTestId('quick-logger-submit')
        .or(page.getByRole('button', { name: /log activity/i }));

      await expect(submitButton.first()).toBeDisabled();
    });

    await test.step('Assert no critical console errors', async () => {
      const criticalErrors = consoleMonitor.errors.filter(
        (error) => !error.includes('DevTools') && !error.includes('extension')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test('bonus: global search keyboard shortcut', async ({ page }) => {
    await test.step('Skip if global search input is not present', async () => {
      const globalSearch = page.locator('#global-search');
      const hasGlobalSearch = await globalSearch.count() > 0;

      if (!hasGlobalSearch) {
        test.skip();
      }
    });

    await test.step('Assert pressing "/" focuses global search', async () => {
      // Press "/" key
      await page.keyboard.press('/');

      // Assert global search input is focused
      const globalSearch = page.locator('#global-search');
      await expect(globalSearch).toBeFocused();
    });
  });

  test('should persist selected principal across page refresh', async ({ page }) => {
    // Select principal (Wicks exists in seed.sql as principal)
    await page.click('[data-testid="principal-select-trigger"]');
    await page.click('text="Wicks"');

    // Wait for data to load with proper condition
    await expect(page.locator('[data-testid="principal-select-trigger"]')).toContainText('Wicks');
    await page.waitForSelector('[role="tree"]:not(:has-text("Select a principal"))', {
      timeout: 5000
    });

    // Reload page
    await page.reload();

    // Verify principal still selected
    await expect(page.locator('[data-testid="principal-select-trigger"]')).toContainText('Wicks');

    // Verify data loaded for that principal
    await expect(page.locator('[role="tree"]')).not.toContainText('Select a principal');
  });
});
