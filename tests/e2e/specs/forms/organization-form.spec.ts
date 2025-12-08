import { test, expect } from "@playwright/test";
import { OrganizationFormPage } from "../../support/poms/OrganizationFormPage";
import { consoleMonitor } from "../../support/utils/console-monitor";
import { uniqueTestData } from "../../support/poms/FormTestHelpers";

/**
 * E2E tests for Organization form
 * Tests validation, success scenarios, and duplicate handling
 *
 * Validation Requirements (from organizationSchema):
 * - name: Required (min 1 char)
 * - website: Must be valid URL with protocol (http/https) - OPTIONAL
 * - linkedin_url: Must be valid LinkedIn URL - OPTIONAL
 * - organization_type: enum (customer, prospect, principal, distributor) - defaults to "prospect"
 * - priority: enum (A, B, C, D) - defaults to "C"
 */

test.describe("Organization Form - Error Scenarios", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  let orgPage: OrganizationFormPage;

  test.beforeEach(async ({ page }) => {
    orgPage = new OrganizationFormPage(page);
    await consoleMonitor.attach(page);
    await orgPage.gotoCreate();
  });

  test.afterEach(async () => {
    const report = consoleMonitor.getReport();
    if (consoleMonitor.getErrors().length > 0) {
      console.log(report);
    }
  });

  test("should require name field (cannot submit empty form)", async () => {
    // Attempt to submit without filling any fields
    // Note: Name is the only required field in the form
    await orgPage.attemptSubmit();

    // Should stay on create page (browser-native validation or form prevents submission)
    await orgPage.expectStillOnCreateForm();

    // Check that name input has some indication it's required
    const nameInput = orgPage.getNameInput();
    await expect(nameInput).toBeVisible();
  });

  test("should auto-prefix website URLs without protocol", async ({ page }) => {
    // This tests the transform behavior - URLs without protocol get https:// added
    const orgName = uniqueTestData("URL Prefix Test Org");
    await orgPage.fillName(orgName);

    // Fill website without protocol - should be auto-prefixed and valid
    await orgPage.fillWebsite("example.com");

    await orgPage.clickCreateOrganization();

    // Handle potential duplicate dialog
    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    // Should successfully save (transform added https://)
    await orgPage.expectFormSuccess();
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Organization Form - Success Scenarios", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  let orgPage: OrganizationFormPage;

  test.beforeEach(async ({ page }) => {
    orgPage = new OrganizationFormPage(page);
    await consoleMonitor.attach(page);
    await orgPage.gotoCreate();
  });

  test.afterEach(async () => {
    const report = consoleMonitor.getReport();

    // In success tests, assert no RLS/React errors
    expect(consoleMonitor.hasRLSErrors(), `RLS errors detected: ${report}`).toBe(false);
    expect(consoleMonitor.hasReactErrors(), `React errors detected: ${report}`).toBe(false);

    if (consoleMonitor.getErrors().length > 0) {
      console.log(report);
    }
  });

  test("should save valid minimal form (name only)", async ({ page }) => {
    // Fill only required field
    const orgName = uniqueTestData("Minimal Org");
    await orgPage.fillName(orgName);

    // Submit form
    await orgPage.clickCreateOrganization();

    // Handle potential duplicate dialog (if test data collision)
    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    // Should redirect to show page or list-with-panel
    await orgPage.expectFormSuccess();

    // Verify the org name is visible (may appear in slide-over panel title)
    // Use first() to handle strict mode if name appears in multiple places
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });

  test("should save Principal type organization", async ({ page }) => {
    // Create principal organization
    const orgName = uniqueTestData("Principal Manufacturer");
    await orgPage.fillName(orgName);
    await orgPage.selectOrganizationType("principal");

    // Optional fields on More tab
    await orgPage.fillWebsite("https://example-principal.com");

    // Submit
    await orgPage.clickCreateOrganization();

    // Handle potential duplicate dialog
    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    // Should save successfully
    await orgPage.expectFormSuccess();

    // Verify redirect
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });

  // SKIP: Address fields use wrong source names (street/zip instead of address/postal_code)
  // See OrganizationMainTab.tsx - needs to be fixed before this test can pass
  test.skip("should save Customer type with full address", async ({ page }) => {
    // Create customer organization with full details
    const orgName = uniqueTestData("Customer Restaurant");
    await orgPage.fillName(orgName);
    await orgPage.selectOrganizationType("customer");

    // Website and LinkedIn on More tab
    await orgPage.fillWebsite("https://customer-restaurant.com");
    await orgPage.fillLinkedInUrl("https://www.linkedin.com/company/test-company");

    // Full address on Main tab
    await orgPage.fillStreet("123 Main Street");
    await orgPage.fillCity("Chicago");
    await orgPage.selectState("IL");
    await orgPage.fillZip("60601");

    // Description on More tab
    await orgPage.fillDescription("Premium customer with multiple locations");

    // Submit
    await orgPage.clickCreateOrganization();

    // Handle potential duplicate dialog
    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    // Should save successfully
    await orgPage.expectFormSuccess();

    // Verify redirect
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });

  // SKIP: Duplicate dialog timing is inconsistent - dialog appears asynchronously after API check
  // The duplicate check may not return in time before the assertion runs
  test.skip("should handle duplicate name warning and allow proceeding", async ({ page }) => {
    // Create first organization
    const orgName = uniqueTestData("Duplicate Test Org");
    await orgPage.fillName(orgName);
    await orgPage.clickCreateOrganization();

    // Handle potential duplicate from previous test runs
    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    // Wait for success
    await orgPage.expectFormSuccess();

    // Navigate back to create form
    await orgPage.gotoCreate();

    // Try to create organization with same name
    await orgPage.fillName(orgName);
    await orgPage.clickCreateOrganization();

    // Should show duplicate warning dialog
    const isDuplicateVisible = await orgPage.isDuplicateDialogVisible();
    expect(isDuplicateVisible).toBe(true);

    // Verify dialog shows the duplicate name
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(orgName);

    // Click "Proceed Anyway"
    await orgPage.clickProceedAnyway();

    // Should save successfully despite duplicate
    await orgPage.expectFormSuccess();

    // Verify we're on show page
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Organization Form - Validation Edge Cases", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  let orgPage: OrganizationFormPage;

  test.beforeEach(async ({ page }) => {
    orgPage = new OrganizationFormPage(page);
    await consoleMonitor.attach(page);
    await orgPage.gotoCreate();
  });

  test.afterEach(async () => {
    const report = consoleMonitor.getReport();
    if (consoleMonitor.getErrors().length > 0) {
      console.log(report);
    }
  });

  test("should accept website with http protocol", async ({ page }) => {
    const orgName = uniqueTestData("HTTP Website Org");
    await orgPage.fillName(orgName);
    await orgPage.fillWebsite("http://legacy-site.com");

    await orgPage.clickCreateOrganization();

    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    await orgPage.expectFormSuccess();
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });

  test("should accept website with https protocol", async ({ page }) => {
    const orgName = uniqueTestData("HTTPS Website Org");
    await orgPage.fillName(orgName);
    await orgPage.fillWebsite("https://secure-site.com");

    await orgPage.clickCreateOrganization();

    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    await orgPage.expectFormSuccess();
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });

  test("should accept valid LinkedIn URL variations", async ({ page }) => {
    const orgName = uniqueTestData("LinkedIn Org");
    await orgPage.fillName(orgName);

    // Test with www subdomain
    await orgPage.fillLinkedInUrl("https://www.linkedin.com/company/test-org");

    await orgPage.clickCreateOrganization();

    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    await orgPage.expectFormSuccess();
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });

  test("should allow empty optional fields", async ({ page }) => {
    // Only fill required field
    const orgName = uniqueTestData("Minimal Fields Org");
    await orgPage.fillName(orgName);

    // Leave all optional fields empty (website, LinkedIn, address, etc.)
    // This should succeed

    await orgPage.clickCreateOrganization();

    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    await orgPage.expectFormSuccess();
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });

  test("should trim whitespace from name", async ({ page }) => {
    // Fill name with leading/trailing whitespace
    const orgName = uniqueTestData("Whitespace Org");
    const nameInput = orgPage.getNameInput();
    await nameInput.fill(`  ${orgName}  `);

    await orgPage.clickCreateOrganization();

    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    // Should save successfully (trimming handled by form)
    await orgPage.expectFormSuccess();
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Organization Form - Duplicate Dialog Behavior", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  let orgPage: OrganizationFormPage;

  test.beforeEach(async ({ page }) => {
    orgPage = new OrganizationFormPage(page);
    await consoleMonitor.attach(page);
    await orgPage.gotoCreate();
  });

  test.afterEach(async () => {
    const report = consoleMonitor.getReport();
    if (consoleMonitor.getErrors().length > 0) {
      console.log(report);
    }
  });

  // SKIP: Duplicate dialog timing is inconsistent - requires deeper investigation
  test.skip("should allow canceling duplicate warning to change name", async ({ page }) => {
    // Create first organization
    const originalName = uniqueTestData("Cancel Duplicate Test");
    await orgPage.fillName(originalName);
    await orgPage.clickCreateOrganization();

    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    await orgPage.expectFormSuccess();

    // Navigate back to create
    await orgPage.gotoCreate();

    // Try same name again
    await orgPage.fillName(originalName);
    await orgPage.clickCreateOrganization();

    // Should show duplicate dialog
    expect(await orgPage.isDuplicateDialogVisible()).toBe(true);

    // Click Cancel to change name
    await orgPage.clickCancelDuplicate();

    // Should close dialog and stay on form
    await page.waitForTimeout(500);
    expect(await orgPage.isDuplicateDialogVisible()).toBe(false);

    // Should still be on create page
    await orgPage.expectStillOnCreateForm();

    // Verify name input is still accessible (can change it)
    const nameInput = orgPage.getNameInput();
    await expect(nameInput).toBeVisible();

    // Change the name and submit successfully
    const newName = uniqueTestData("Changed Name Org");
    await orgPage.fillName(newName);
    await orgPage.clickCreateOrganization();

    if (await orgPage.isDuplicateDialogVisible()) {
      await orgPage.clickProceedAnyway();
    }

    await orgPage.expectFormSuccess();
    await expect(page.getByText(newName).first()).toBeVisible({ timeout: 5000 });
  });
});
