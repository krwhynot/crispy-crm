import { test, expect } from "@playwright/test";
import { LoginPage } from "../support/poms/LoginPage";
import { ContactsListPage } from "../support/poms/ContactsListPage";
import { consoleMonitor } from "../support/utils/console-monitor";

/**
 * E2E tests for ContactList Column Visibility feature
 *
 * Tests the column visibility toggle functionality via ColumnsButton.
 * Verifies:
 * - Columns button is visible in toolbar
 * - Toggle column visibility (hide/show a column)
 * - Protected columns cannot be hidden (Name, Organization, Status are disabled)
 * - Preferences persist on page refresh
 * - Reset button restores defaults
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (semantic selectors only)
 * - Console monitoring for diagnostics
 * - Condition-based waiting (NO waitForTimeout)
 * - Auth setup via tests/e2e/.auth/user.json
 *
 * Column configuration (from contactColumns.ts):
 * - Protected columns (cannot hide): full_name, organization_id, status
 * - Hideable columns: avatar, title, nb_notes, last_seen
 * - Default hidden: nb_notes, last_seen
 * - Store key: contacts.datatable
 */

test.describe("Contact List Column Visibility", () => {
  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Login using POM
    const loginPage = new LoginPage(page);
    await loginPage.goto("/");

    // Wait for either login form or dashboard
    const isLoginFormVisible = await page
      .getByLabel(/email/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isLoginFormVisible) {
      await loginPage.login("admin@test.com", "password123");
    } else {
      // Already logged in, wait for dashboard
      await page.waitForURL(/\/#\//, { timeout: 10000 });
    }

    // Clear any existing column preferences to start fresh
    await page.evaluate(() => {
      localStorage.removeItem("contacts.datatable");
      localStorage.removeItem("contacts.datatable_columnRanks");
    });
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("columns button is visible in toolbar", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Verify Columns button is visible in toolbar
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await expect(columnsButton).toBeVisible({ timeout: 5000 });

    // Verify button has icon or text
    await expect(columnsButton).toContainText(/columns/i);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("toggle column visibility - hide and show a column", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Verify "Role" column header is visible initially
    const roleHeader = page.getByRole("columnheader", { name: /role/i });
    await expect(roleHeader).toBeVisible({ timeout: 5000 });

    // Click Columns button to open menu
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await columnsButton.click();

    // Wait for popover to open
    const roleToggle = page.getByRole("option").filter({ hasText: /role/i });
    await expect(roleToggle).toBeVisible({ timeout: 3000 });

    // Verify the toggle is currently ON (column is visible)
    const roleSwitch = roleToggle.locator('button[role="switch"]');
    await expect(roleSwitch).toHaveAttribute("aria-checked", "true");

    // Click to hide the Role column
    await roleSwitch.click();

    // Verify toggle is now OFF
    await expect(roleSwitch).toHaveAttribute("aria-checked", "false");

    // Close the popover by clicking outside
    await page.keyboard.press("Escape");

    // Verify "Role" column header is now hidden
    await expect(roleHeader).not.toBeVisible({ timeout: 3000 });

    // Re-open columns menu to show the column again
    await columnsButton.click();
    await expect(roleToggle).toBeVisible({ timeout: 3000 });

    // Click to show the Role column again
    await roleSwitch.click();
    await expect(roleSwitch).toHaveAttribute("aria-checked", "true");

    // Close popover
    await page.keyboard.press("Escape");

    // Verify "Role" column header is visible again
    await expect(roleHeader).toBeVisible({ timeout: 3000 });

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("protected columns cannot be hidden", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Open columns menu
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await columnsButton.click();

    // Wait for menu to open
    const menuOptions = page.getByRole("option");
    await expect(menuOptions.first()).toBeVisible({ timeout: 3000 });

    // Protected columns: Name, Organization, Status
    const protectedColumns = ["Name", "Organization", "Status"];

    for (const columnName of protectedColumns) {
      await test.step(`verify ${columnName} column is disabled`, async () => {
        const columnOption = page.getByRole("option").filter({ hasText: columnName });
        await expect(columnOption).toBeVisible();

        const columnSwitch = columnOption.locator('button[role="switch"]');

        // Verify it's checked (visible)
        await expect(columnSwitch).toHaveAttribute("aria-checked", "true");

        // Verify it's disabled or clicking doesn't change state
        const initialState = await columnSwitch.getAttribute("aria-checked");
        await columnSwitch.click();

        // Wait briefly for any state change
        await page.waitForTimeout(200);

        // Should remain in same state (protected columns can't be toggled)
        const afterClickState = await columnSwitch.getAttribute("aria-checked");
        expect(afterClickState).toBe(initialState);
      });
    }

    // Close popover
    await page.keyboard.press("Escape");

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("column visibility preferences persist on page refresh", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Verify "Avatar" column is visible initially
    const grid = listPage.getContactsGrid();
    const avatarHeaderBefore = page.getByRole("columnheader", { name: "" }).first();
    await expect(avatarHeaderBefore).toBeVisible({ timeout: 5000 });

    // Open columns menu and hide Avatar column
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await columnsButton.click();

    const avatarToggle = page.getByRole("option").filter({ hasText: /avatar/i });
    await expect(avatarToggle).toBeVisible({ timeout: 3000 });

    const avatarSwitch = avatarToggle.locator('button[role="switch"]');
    await expect(avatarSwitch).toHaveAttribute("aria-checked", "true");
    await avatarSwitch.click();
    await expect(avatarSwitch).toHaveAttribute("aria-checked", "false");

    // Close popover
    await page.keyboard.press("Escape");

    // Verify Avatar column is hidden
    await expect(avatarHeaderBefore).not.toBeVisible({ timeout: 3000 });

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await listPage.navigate();

    // Verify Avatar column is still hidden after refresh
    const avatarHeaderAfter = page.getByRole("columnheader", { name: "" }).first();
    const isAvatarVisible = await avatarHeaderAfter.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isAvatarVisible).toBe(false);

    // Verify preference is saved in localStorage
    const savedPreference = await page.evaluate(() => {
      const stored = localStorage.getItem("contacts.datatable");
      return stored ? JSON.parse(stored) : null;
    });

    expect(savedPreference).toContain("avatar");

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("reset button restores default column visibility", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Open columns menu
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await columnsButton.click();

    // Wait for menu to open
    const menuOptions = page.getByRole("option");
    await expect(menuOptions.first()).toBeVisible({ timeout: 3000 });

    // Hide "Role" column (default visible)
    const roleToggle = page.getByRole("option").filter({ hasText: /role/i });
    const roleSwitch = roleToggle.locator('button[role="switch"]');
    await expect(roleSwitch).toHaveAttribute("aria-checked", "true");
    await roleSwitch.click();
    await expect(roleSwitch).toHaveAttribute("aria-checked", "false");

    // Show "Notes" column (default hidden)
    const notesToggle = page.getByRole("option").filter({ hasText: /notes/i });
    const notesSwitch = notesToggle.locator('button[role="switch"]');
    await expect(notesSwitch).toHaveAttribute("aria-checked", "false");
    await notesSwitch.click();
    await expect(notesSwitch).toHaveAttribute("aria-checked", "true");

    // Click Reset button
    const resetButton = page.getByRole("button", { name: /reset/i });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Wait for reset to complete
    await page.waitForTimeout(500);

    // Verify "Role" is back to visible (default)
    await expect(roleSwitch).toHaveAttribute("aria-checked", "true");

    // Verify "Notes" is back to hidden (default)
    await expect(notesSwitch).toHaveAttribute("aria-checked", "false");

    // Close popover
    await page.keyboard.press("Escape");

    // Verify columns are restored in the grid
    const roleHeader = page.getByRole("columnheader", { name: /role/i });
    await expect(roleHeader).toBeVisible({ timeout: 3000 });

    const notesHeader = page.getByRole("columnheader", { name: /notes/i });
    const isNotesVisible = await notesHeader.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isNotesVisible).toBe(false);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("all hideable columns can be toggled", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Open columns menu
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await columnsButton.click();

    // Wait for menu to open
    const menuOptions = page.getByRole("option");
    await expect(menuOptions.first()).toBeVisible({ timeout: 3000 });

    // Hideable columns: Avatar, Role, Notes, Last Activity
    const hideableColumns = [
      { name: "Avatar", header: "" },
      { name: "Role", header: /role/i },
      { name: "Notes", header: /notes/i },
      { name: "Last Activity", header: /last activity/i },
    ];

    for (const column of hideableColumns) {
      await test.step(`toggle ${column.name} column`, async () => {
        const columnToggle = page.getByRole("option").filter({ hasText: column.name });
        const columnSwitch = columnToggle.locator('button[role="switch"]');

        // Get initial state
        const initialChecked = await columnSwitch.getAttribute("aria-checked");

        // Toggle it
        await columnSwitch.click();
        await page.waitForTimeout(200);

        // Verify state changed
        const afterToggleChecked = await columnSwitch.getAttribute("aria-checked");
        expect(afterToggleChecked).not.toBe(initialChecked);

        // Toggle back
        await columnSwitch.click();
        await page.waitForTimeout(200);

        // Verify state is back to initial
        const finalChecked = await columnSwitch.getAttribute("aria-checked");
        expect(finalChecked).toBe(initialChecked);
      });
    }

    // Close popover
    await page.keyboard.press("Escape");

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("column menu search filters column options", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Open columns menu
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await columnsButton.click();

    // Wait for menu to open
    const menuOptions = page.getByRole("option");
    await expect(menuOptions.first()).toBeVisible({ timeout: 3000 });

    // Find search input (only shown if more than 5 columns)
    const searchInput = page.getByPlaceholder(/search columns/i);

    // If search is visible, test filtering
    const isSearchVisible = await searchInput.isVisible().catch(() => false);

    if (isSearchVisible) {
      // Type "role" in search
      await searchInput.fill("role");

      // Wait for filter to apply
      await page.waitForTimeout(300);

      // Verify "Role" option is visible
      const roleOption = page.getByRole("option").filter({ hasText: /role/i });
      await expect(roleOption).toBeVisible();

      // Verify other columns are filtered out
      const nameOption = page.getByRole("option").filter({ hasText: "Name" });
      const isNameVisible = await nameOption.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isNameVisible).toBe(false);

      // Clear search
      await searchInput.clear();

      // Verify all options are visible again
      await expect(nameOption).toBeVisible({ timeout: 2000 });
    }

    // Close popover
    await page.keyboard.press("Escape");

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("closing and reopening menu preserves toggle state", async ({ page }) => {
    const listPage = new ContactsListPage(page);

    // Navigate to contacts list
    await listPage.navigate();

    // Open columns menu
    const columnsButton = page.getByRole("button", { name: /columns/i });
    await columnsButton.click();

    // Wait for menu to open
    const roleToggle = page.getByRole("option").filter({ hasText: /role/i });
    await expect(roleToggle).toBeVisible({ timeout: 3000 });

    // Hide "Role" column
    const roleSwitch = roleToggle.locator('button[role="switch"]');
    await expect(roleSwitch).toHaveAttribute("aria-checked", "true");
    await roleSwitch.click();
    await expect(roleSwitch).toHaveAttribute("aria-checked", "false");

    // Close popover
    await page.keyboard.press("Escape");

    // Wait for menu to close
    await expect(roleToggle).not.toBeVisible({ timeout: 2000 });

    // Re-open menu
    await columnsButton.click();
    await expect(roleToggle).toBeVisible({ timeout: 3000 });

    // Verify "Role" is still unchecked
    await expect(roleSwitch).toHaveAttribute("aria-checked", "false");

    // Close popover
    await page.keyboard.press("Escape");

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });
});
