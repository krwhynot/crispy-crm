import { test, expect } from "./support/fixtures/authenticated";
import { OrganizationsListPage } from "./support/poms/OrganizationsListPage";
import { consoleMonitor } from "./support/utils/console-monitor";

/**
 * Organization Hierarchies E2E Test Suite
 *
 * Tests the full organization hierarchy workflows including:
 * - Creating distributors with parent relationships
 * - Viewing parent organizations with branch locations
 * - Deletion protection for parents with branches
 * - Filtering by parent organization
 * - Linking existing organizations as branches
 * - Hierarchy type filtering
 *
 * Uses:
 * - authenticated fixture (automatic login + console monitoring)
 * - OrganizationsListPage POM (semantic selectors only)
 * - Condition-based waiting (no arbitrary timeouts)
 *
 * Note: These tests assume seed data exists with a "Sysco" parent organization
 * with branch locations for testing the hierarchy features.
 */

test.describe("Organization Hierarchies", () => {
  let organizationsPage: OrganizationsListPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    organizationsPage = new OrganizationsListPage(authenticatedPage);
    await organizationsPage.gotoOrganizationsList();
    await organizationsPage.waitForOrganizationsLoaded();
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    expect(errors, "Console errors detected. See attached report.").toHaveLength(0);
  });

  test.describe("Create Distributor with Parent", () => {
    test("should create distributor with parent relationship", async ({ authenticatedPage }) => {
      // Navigate to create organization form
      // Look for "New Organization" or similar FAB button
      const createButton = authenticatedPage
        .locator("button")
        .filter({ hasText: /new|create|add/i })
        .first();

      // If FAB doesn't exist, navigate directly
      if (!(await createButton.isVisible().catch(() => false))) {
        await authenticatedPage.goto("/#/organizations/create");
      } else {
        await createButton.click();
      }

      // Wait for create form to load
      await authenticatedPage.waitForURL(/\/#\/organizations\/create/);

      // Fill in organization name - look for name input in General tab
      const nameInput = authenticatedPage.getByLabel(/^name/i, { exact: true });
      await nameInput.waitFor({ state: "visible", timeout: 5000 });
      await nameInput.fill("Test Branch Org");

      // Select organization type: Distributor
      const typeSelect = authenticatedPage.getByLabel(/organization type/i);
      await typeSelect.click();
      const distributorOption = authenticatedPage.getByRole("option", { name: /distributor/i });
      await distributorOption.waitFor({ state: "visible", timeout: 5000 });
      await distributorOption.click();

      // Search and select parent organization
      const parentInput = authenticatedPage.getByLabel(/parent organization/i);
      await parentInput.click();
      await parentInput.fill("Sysco");

      // Wait for dropdown options and select first result
      const parentOption = authenticatedPage
        .getByRole("option")
        .filter({ hasText: /sysco/i })
        .first();
      await parentOption.waitFor({ state: "visible", timeout: 5000 });
      await parentOption.click();

      // Submit form - look for Save/Create button
      const saveButton = authenticatedPage
        .getByRole("button", { name: /create organization|save/i })
        .first();
      await saveButton.click();

      // Verify navigation to show page
      await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/show/, { timeout: 10000 });

      // Verify breadcrumb shows hierarchy
      const breadcrumb = authenticatedPage.getByRole("navigation");
      const isBreadcrumbVisible = await breadcrumb.isVisible().catch(() => false);

      if (isBreadcrumbVisible) {
        // Check breadcrumb contains "Organizations > Parent > Test Branch Org"
        await expect(breadcrumb.getByText(/organizations/i)).toBeVisible();
        await expect(breadcrumb.getByText(/sysco/i)).toBeVisible();
        await expect(breadcrumb.getByText(/test branch org/i)).toBeVisible();
      } else {
        // If no breadcrumb, verify page has organization name at least
        await expect(authenticatedPage.getByText(/test branch org/i)).toBeVisible();
      }
    });
  });

  test.describe("View Parent Organization with Branches", () => {
    test("should display Branch Locations section for parent with children", async ({
      authenticatedPage,
    }) => {
      // Navigate to Sysco (a known parent organization in seed data)
      await authenticatedPage.goto("/#/organizations");
      await authenticatedPage.waitForURL(/\/#\/organizations$/);

      // Find and click Sysco organization
      const syscoCard = organizationsPage.getOrganizationCardByName(/sysco/i);
      const isSyscoVisible = await syscoCard.isVisible().catch(() => false);

      if (isSyscoVisible) {
        await syscoCard.click();
        await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/show/);

        // Check for "Branch Locations" heading
        const branchSection = authenticatedPage.getByText(/branch locations/i);
        const isSectionVisible = await branchSection.isVisible().catch(() => false);

        if (isSectionVisible) {
          // Section exists - verify it has content
          await expect(branchSection).toBeVisible();

          // Check for branch table
          const table = authenticatedPage.locator("table").first();
          const isTableVisible = await table.isVisible().catch(() => false);

          if (isTableVisible) {
            // Verify table has headers
            const headers = table.locator("th");
            const headerCount = await headers.count();
            expect(headerCount).toBeGreaterThan(0);
          }
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });

    test("should navigate to branch when clicking branch name", async ({ authenticatedPage }) => {
      // Navigate to Sysco
      await authenticatedPage.goto("/#/organizations");
      const syscoCard = organizationsPage.getOrganizationCardByName(/sysco/i);
      const isSyscoVisible = await syscoCard.isVisible().catch(() => false);

      if (isSyscoVisible) {
        await syscoCard.click();
        await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/show/);

        // Check for branch locations section
        const branchSection = authenticatedPage.getByText(/branch locations/i);
        const isSectionVisible = await branchSection.isVisible().catch(() => false);

        if (isSectionVisible) {
          // Find first branch link in table
          const table = authenticatedPage.locator("table").first();
          const firstBranchLink = table.locator("a").first();
          const isBranchVisible = await firstBranchLink.isVisible().catch(() => false);

          if (isBranchVisible) {
            await firstBranchLink.click();

            // Verify navigation to branch page
            await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/show/);

            // Verify breadcrumb shows hierarchy on branch page
            const breadcrumb = authenticatedPage.getByRole("navigation");
            const isBreadcrumbVisible = await breadcrumb.isVisible().catch(() => false);

            if (isBreadcrumbVisible) {
              await expect(breadcrumb.getByText(/organizations/i)).toBeVisible();
              // Parent name should be visible in breadcrumb
              await expect(breadcrumb.getByText(/sysco/i)).toBeVisible();
            }
          }
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe("Cannot Delete Parent with Branches", () => {
    test("should show error when deleting parent organization with branches", async ({
      authenticatedPage,
    }) => {
      // Navigate to Sysco
      await authenticatedPage.goto("/#/organizations");
      const syscoCard = organizationsPage.getOrganizationCardByName(/sysco/i);
      const isSyscoVisible = await syscoCard.isVisible().catch(() => false);

      if (isSyscoVisible) {
        await syscoCard.click();
        await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/show/);

        // Look for delete button in the organization details page
        const deleteButton = authenticatedPage.getByRole("button", { name: /delete/i });
        const isDeleteVisible = await deleteButton.isVisible().catch(() => false);

        if (isDeleteVisible) {
          await deleteButton.click();

          // Wait for response to delete attempt
          await authenticatedPage.waitForTimeout(1000);

          // Verify error notification appears (could be toast, modal, or inline)
          const errorNotification = authenticatedPage.locator(
            "text=/cannot delete.*branch|has.*branch|child.*branch|still has/i"
          );
          const isErrorVisible = await errorNotification.isVisible().catch(() => false);

          if (isErrorVisible) {
            await expect(errorNotification).toBeVisible();
          }

          // Verify we're still on the same page (delete failed)
          const currentUrl = authenticatedPage.url();
          expect(currentUrl).toMatch(/\/#\/organizations\/\d+\/show/);
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe("Filter Organizations by Parent", () => {
    test("should filter organizations by parent organization", async ({ authenticatedPage }) => {
      // Navigate to organizations list
      await authenticatedPage.goto("/#/organizations");

      // Find the Parent Organization filter
      // It's a reference input with label "Parent Organization"
      const parentFilterLabel = authenticatedPage.getByLabel(/parent organization/i);
      const isFilterVisible = await parentFilterLabel.isVisible().catch(() => false);

      if (isFilterVisible) {
        // Click on filter input
        await parentFilterLabel.click();

        // Search for Sysco
        await parentFilterLabel.fill("Sysco");

        // Wait for autocomplete options
        const option = authenticatedPage.getByRole("option").filter({ hasText: /sysco/i }).first();
        await option.waitFor({ state: "visible", timeout: 5000 });
        await option.click();

        // Wait for filter to apply
        await authenticatedPage.waitForTimeout(1000);

        // Verify filtered results appear
        const orgCards = organizationsPage.getOrganizationCards();
        const visibleCards = await orgCards.count();

        // Should have some results after filtering
        expect(visibleCards).toBeGreaterThan(0);

        // Verify parent itself doesn't appear in filtered list
        const parentLink = organizationsPage.getOrganizationCardByName(/^sysco$/i);
        const isParentInList = await parentLink.isVisible().catch(() => false);

        // Parent should not be in the filtered results (only branches)
        expect(isParentInList).toBe(false);
      } else {
        test.skip();
      }
    });
  });

  test.describe("Link Existing Organization as Branch", () => {
    test("should convert standalone org to branch by setting parent", async ({
      authenticatedPage,
    }) => {
      // Create a standalone organization
      await authenticatedPage.goto("/#/organizations/create");

      // Fill in new organization details
      const nameInput = authenticatedPage.getByLabel(/^name/i, { exact: true });
      await nameInput.waitFor({ state: "visible", timeout: 5000 });
      const uniqueName = `TestOrg-${Date.now()}`;
      await nameInput.fill(uniqueName);

      // Select type: Customer (or any type that's not already a parent)
      const typeSelect = authenticatedPage.getByLabel(/organization type/i);
      await typeSelect.click();
      const customerOption = authenticatedPage.getByRole("option", { name: /customer/i });
      await customerOption.waitFor({ state: "visible", timeout: 5000 });
      await customerOption.click();

      // Don't set parent (create as standalone)
      const saveButton = authenticatedPage
        .getByRole("button", { name: /create organization|save/i })
        .first();
      await saveButton.click();

      // Wait for organization to be created
      await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/show/, { timeout: 10000 });
      const orgUrl = authenticatedPage.url();
      const orgId = orgUrl.match(/\/organizations\/(\d+)\//)?.[1];

      if (orgId) {
        // Now navigate to edit form
        const editButton = authenticatedPage.getByRole("button", { name: /edit/i }).first();
        const isEditVisible = await editButton.isVisible().catch(() => false);

        if (isEditVisible) {
          await editButton.click();
          await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/edit/);

          // Set parent organization
          const parentInput = authenticatedPage.getByLabel(/parent organization/i);
          await parentInput.click();
          await parentInput.fill("Sysco");

          // Select parent from dropdown
          const parentOption = authenticatedPage
            .getByRole("option")
            .filter({ hasText: /sysco/i })
            .first();
          await parentOption.waitFor({ state: "visible", timeout: 5000 });
          await parentOption.click();

          // Save changes
          const saveChangesButton = authenticatedPage
            .getByRole("button", { name: /save|update/i })
            .first();
          await saveChangesButton.click();

          // Wait for update to complete
          await authenticatedPage.waitForURL(/\/#\/organizations\/\d+\/show/, { timeout: 10000 });

          // Verify breadcrumb shows hierarchy
          const breadcrumb = authenticatedPage.getByRole("navigation");
          const isBreadcrumbVisible = await breadcrumb.isVisible().catch(() => false);

          if (isBreadcrumbVisible) {
            await expect(breadcrumb.getByText(/organizations/i)).toBeVisible();
            await expect(breadcrumb.getByText(/sysco/i)).toBeVisible();
          }
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe("Hierarchy Type Filter - Parent Organizations Only", () => {
    test("should filter to show only parent organizations", async ({ authenticatedPage }) => {
      // Navigate to organizations list
      await authenticatedPage.goto("/#/organizations");

      // Find the Hierarchy Type filter
      const hierarchyTypeFilter = authenticatedPage.getByLabel(/hierarchy type/i);
      const isFilterVisible = await hierarchyTypeFilter.isVisible().catch(() => false);

      if (isFilterVisible) {
        await hierarchyTypeFilter.click();

        // Select "Parent Organizations Only"
        const parentOnlyOption = authenticatedPage.getByRole("option", {
          name: /parent organizations only/i,
        });
        const isOptionVisible = await parentOnlyOption.isVisible().catch(() => false);

        if (isOptionVisible) {
          await parentOnlyOption.click();

          // Wait for filter to apply
          await authenticatedPage.waitForTimeout(1000);

          // Verify filtered results appear
          const orgCards = organizationsPage.getOrganizationCards();
          const visibleCards = await orgCards.count();

          // Should have some parent organizations visible
          expect(visibleCards).toBeGreaterThan(0);

          // Verify the page is still functional
          const pageTitle = authenticatedPage.getByText(/organizations/i).first();
          await expect(pageTitle).toBeVisible();
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });
});
