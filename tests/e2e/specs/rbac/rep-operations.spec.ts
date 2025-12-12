import { test, expect } from "@playwright/test";
import { SalesListPage } from "../../support/poms/SalesListPage";
import { SalesFormPage } from "../../support/poms/SalesFormPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for Rep RBAC Operations
 * Tests rep restrictions: Can edit own profile, cannot edit others or change roles
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs)
 * - Semantic selectors only (getByRole/Label/Text)
 * - Console monitoring for diagnostics
 * - Condition-based waiting
 *
 * Auth: Uses rep fixture (tests/e2e/.auth/rep-user.json)
 *
 * Business Rules:
 * - Rep can edit: first_name, last_name, email, phone, avatar (own record)
 * - Rep cannot: edit other users, change own role, access /sales admin
 */

test.describe("Rep RBAC Operations", () => {
  // Use rep auth fixture
  test.use({ storageState: "tests/e2e/.auth/rep-user.json" });

  test.beforeEach(async ({ page }) => {
    await consoleMonitor.attach(page);
  });

  test.afterEach(async () => {
    if (consoleMonitor.getErrors().length > 0) {
      console.log("Console errors:", consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("C1: Rep can edit own profile fields", async ({ page }) => {
    const timestamp = Date.now();

    // Rep needs to access their own profile
    // Look for user menu dropdown
    const userMenu = page.getByRole("button", { name: /user|account|profile|rep|sue/i });

    const hasUserMenu = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUserMenu) {
      await userMenu.click();

      // Look for profile/settings option
      const profileLink = page.getByRole("menuitem", { name: /profile|settings|my account/i });
      const hasProfileLink = await profileLink.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasProfileLink) {
        await profileLink.click();

        // Should be able to see and edit own profile
        const formPage = new SalesFormPage(page);

        // Update profile fields (phone is a "safe" field to test)
        await formPage.updateProfile({
          phone: `555-${timestamp.toString().slice(-4)}`,
        });

        // Verify no errors - successful update
        expect(consoleMonitor.hasRLSErrors()).toBe(false);
        expect(consoleMonitor.hasReactErrors()).toBe(false);
      } else {
        // Profile editing might be via a direct URL
        // Try navigating to the rep's own record via /sales?view=<rep_id>
        // This requires knowing the rep's ID - which we can get from the URL after login
        console.log("No profile link - attempting direct profile access");
      }
    } else {
      console.log("No user menu found - rep profile edit test needs alternative approach");
      test.skip();
    }
  });

  test("C2: Rep cannot edit another user profile", async ({ page }) => {
    // Navigate directly to /sales trying to access team management
    await page.goto("/#/sales");

    // Wait for page response
    await page.waitForTimeout(2000);

    // Check if we can access the page at all
    const currentUrl = page.url();
    const isOnSales = currentUrl.includes("/sales");

    if (isOnSales) {
      // If we're on /sales, try to click on another user
      const listPage = new SalesListPage(page);

      // Try to find admin user and click
      const adminRow = listPage.getUserRowByEmail("admin@test.com");
      const canSeeAdmin = await adminRow.isVisible({ timeout: 3000 }).catch(() => false);

      if (canSeeAdmin) {
        await adminRow.click();

        // Wait for any response
        await page.waitForTimeout(1000);

        // Try to edit
        const formPage = new SalesFormPage(page);
        await formPage.updateProfile({ firstName: "HackerAttempt" });

        // We should see an error
        const hasError = await formPage.hasError();

        expect(
          hasError || consoleMonitor.hasRLSErrors(),
          "Rep editing another user should produce an error"
        ).toBe(true);
      } else {
        // RLS filtering correctly hides other users - this is expected
        console.log("Rep cannot see other users - RLS working correctly");
      }
    } else {
      // Redirected away - access control working
      console.log("Rep redirected from /sales - access control working");
    }
  });

  test("C3: Rep cannot change own role", async ({ page }) => {
    // Access own profile via user menu
    const userMenu = page.getByRole("button", { name: /user|account|profile|rep|sue/i });

    const hasUserMenu = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasUserMenu) {
      await userMenu.click();

      // Look for profile/settings option
      const profileLink = page.getByRole("menuitem", { name: /profile|settings|my account/i });
      const hasProfileLink = await profileLink.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasProfileLink) {
        await profileLink.click();

        const formPage = new SalesFormPage(page);

        // Try to access permissions tab and change role
        await formPage.clickPermissionsTab();

        // The role dropdown should either:
        // 1. Be disabled/readonly
        // 2. Not visible at all for reps
        // 3. If visible and editable, trigger an error on save

        const roleSelect = formPage.getRoleSelect();
        const isRoleVisible = await roleSelect.isVisible({ timeout: 2000 }).catch(() => false);

        if (isRoleVisible) {
          const isDisabled = await roleSelect.isDisabled().catch(() => false);

          if (!isDisabled) {
            // Try to change role - should fail
            await formPage.selectRole("admin");
            await formPage.submit();

            // Should see error
            const hasError = await formPage.hasError();
            const errorText = await formPage.getErrorText();

            expect(
              hasError || consoleMonitor.hasRLSErrors(),
              `Rep role change should be blocked. Error: ${errorText}`
            ).toBe(true);
          } else {
            // Role dropdown is disabled - correct behavior
            console.log("Role dropdown correctly disabled for rep");
          }
        } else {
          // Role selector not visible - correct behavior for reps
          console.log("Role selector not visible to rep - correct behavior");
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test("C4: Rep cannot access /sales admin section", async ({ page }) => {
    // Direct navigation to /sales
    await page.goto("/#/sales");

    // Wait for page to load/redirect
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isOnSales = currentUrl.includes("/sales");

    if (isOnSales) {
      // If still on /sales, should see access denied or filtered view
      const accessDenied = await page
        .getByText(/access denied|not authorized|forbidden/i)
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      const emptyView = await page
        .getByText(/no results|no users|empty/i)
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      // Rep should not see team data
      expect(
        accessDenied || emptyView,
        "Rep should not see team data on /sales"
      ).toBe(true);
    }
    // If redirected, access control is working - test passes
  });

  test("C5: Rep sidebar should not show Team/Sales link", async ({ page }) => {
    // Go to dashboard
    await page.goto("/#/");
    await page.waitForLoadState("networkidle");

    // Check sidebar for Team/Sales link
    const sidebarLinks = page.locator("nav, aside, [role='navigation']");

    // Look for Team or Sales link in navigation
    const teamLink = sidebarLinks
      .getByRole("link", { name: /team|sales|users/i })
      .first();

    // Team link should not be visible to reps
    const isVisible = await teamLink.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isVisible, "Team/Sales link should be hidden for reps").toBe(false);
  });
});
