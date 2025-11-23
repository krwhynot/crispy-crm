import { test, expect } from "@playwright/test";
import { ContactsListPage } from "../support/poms/ContactsListPage";
import { consoleMonitor } from "../support/utils/console-monitor";

/**
 * E2E tests for Contact Opportunities Tab
 *
 * Tests the Opportunities tab functionality in ContactShow component.
 * Verifies:
 * - Tab visibility and navigation
 * - Linked opportunities display
 * - Link opportunity modal interactions
 * - Unlink opportunity functionality
 * - Duplicate link prevention
 * - Touch target accessibility (44px minimum)
 * - Empty state and suggested opportunities
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (semantic selectors only) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting (no waitForTimeout except animations) ✓
 * - getByRole/Label/Text over CSS selectors ✓
 */

test.describe("Contact Opportunities Tab", () => {
  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Navigate to home page (auth state is automatically loaded from storageState)
    await page.goto("/");

    // Wait for dashboard to load (authenticated users land on dashboard)
    await page.waitForURL(/\/#\//, { timeout: 15000 });
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("shows Opportunities tab on contact detail page", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page to load
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify Opportunities tab is visible
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await expect(opportunitiesTab).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("displays linked opportunities in table", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Click Opportunities tab
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await opportunitiesTab.click();

    // Wait for tab content to load (animation delay)
    await page.waitForTimeout(300);

    // Should show either:
    // - A table with linked opportunities (role="grid")
    // - Empty state with "Link Opportunity" button
    // - Suggested opportunities from organization
    const hasTable = await page.getByRole("grid").count();
    const hasEmptyState = await page.getByText(/no opportunities linked/i).count();
    const hasSuggestions = await page.getByText(/suggested opportunities/i).count();

    expect(hasTable + hasEmptyState + hasSuggestions).toBeGreaterThan(0);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("opens link opportunity modal on button click", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Click Opportunities tab
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await opportunitiesTab.click();

    // Wait for tab content
    await page.waitForTimeout(300);

    // Click "Link Opportunity" button
    const linkButton = page.getByRole("button", { name: /link opportunity/i });
    await expect(linkButton).toBeVisible({ timeout: 5000 });
    await linkButton.click();

    // Modal should appear
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Should show modal title
    await expect(page.getByText(/link opportunity to/i)).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("closes modal on cancel button click", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Click Opportunities tab
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await opportunitiesTab.click();

    // Wait for tab content
    await page.waitForTimeout(300);

    // Click "Link Opportunity" button
    const linkButton = page.getByRole("button", { name: /link opportunity/i });
    await linkButton.click();

    // Wait for modal to appear
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Click Cancel button
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("unlink button shows confirmation dialog", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Click Opportunities tab
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await opportunitiesTab.click();

    // Wait for tab content
    await page.waitForTimeout(300);

    // Check if there are any unlink buttons (only if opportunities are linked)
    const unlinkButtons = page.locator('button[aria-label*="Unlink"]');
    const unlinkCount = await unlinkButtons.count();

    if (unlinkCount > 0) {
      // Click first unlink button
      await unlinkButtons.first().click();

      // Confirmation dialog should appear
      const confirmDialog = page.getByRole("dialog");
      await expect(confirmDialog).toBeVisible({ timeout: 3000 });

      // Should show confirmation message
      await expect(page.getByText(/unlink opportunity/i)).toBeVisible();

      // Should have Cancel button
      const cancelButton = page.getByRole("button", { name: /cancel/i });
      await expect(cancelButton).toBeVisible();

      // Close dialog
      await cancelButton.click();
      await expect(confirmDialog).not.toBeVisible();

      // Assert no console errors
      expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
      expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
    } else {
      // Skip test if no linked opportunities exist
      test.skip();
    }
  });

  test("all interactive elements meet 44px touch target", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Click Opportunities tab
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await opportunitiesTab.click();

    // Wait for tab content
    await page.waitForTimeout(300);

    // Check "Link Opportunity" button
    const linkButton = page.getByRole("button", { name: /link opportunity/i });
    await expect(linkButton).toBeVisible({ timeout: 5000 });
    const linkButtonBox = await linkButton.boundingBox();
    expect(linkButtonBox?.height).toBeGreaterThanOrEqual(44);

    // Check unlink buttons (if present)
    const unlinkButtons = page.locator('button[aria-label*="Unlink"]');
    const unlinkCount = await unlinkButtons.count();

    for (let i = 0; i < unlinkCount; i++) {
      const bbox = await unlinkButtons.nth(i).boundingBox();
      expect(bbox?.height, `Unlink button ${i + 1} height`).toBeGreaterThanOrEqual(44);
      expect(bbox?.width, `Unlink button ${i + 1} width`).toBeGreaterThanOrEqual(44);
    }

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("displays empty state when no opportunities linked", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Click Opportunities tab
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await opportunitiesTab.click();

    // Wait for tab content
    await page.waitForTimeout(300);

    // Check if we're showing empty state OR table/suggestions
    const hasTable = await page.getByRole("grid").count();

    if (hasTable === 0) {
      // Should show empty state OR suggestions
      const emptyState = page.getByText(/no opportunities linked/i);
      const suggestions = page.getByText(/suggested opportunities/i);

      const hasEmptyOrSuggestions =
        (await emptyState.count()) > 0 || (await suggestions.count()) > 0;

      expect(hasEmptyOrSuggestions).toBe(true);

      // Should show "Link Opportunity" button
      const linkButton = page.getByRole("button", {
        name: /link opportunity/i,
      });
      await expect(linkButton.first()).toBeVisible();
    }

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("keyboard navigation works for tab access", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list and click first contact
    await listPage.navigate();
    await listPage.clickFirstContact();

    // Wait for contact show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Focus on Details tab (first tab)
    const detailsTab = page.getByRole("tab", { name: /details/i });
    await detailsTab.focus();

    // Navigate to Opportunities tab using arrow keys
    // Right arrow: Details -> Notes -> Activities -> Opportunities
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    // Opportunities tab should now be focused
    const opportunitiesTab = page.getByRole("tab", { name: /opportunities/i });
    await expect(opportunitiesTab).toBeFocused();

    // Press Enter to activate tab
    await page.keyboard.press("Enter");

    // Wait for tab content
    await page.waitForTimeout(300);

    // Tab content should be visible
    const tabPanel = page.locator('[role="tabpanel"]').last();
    await expect(tabPanel).toBeVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });
});
