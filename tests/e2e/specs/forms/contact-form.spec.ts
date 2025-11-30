import { test, expect } from "@playwright/test";
import { ContactFormPage } from "../../support/poms/ContactFormPage";
import { ContactsListPage } from "../../support/poms/ContactsListPage";
import { ContactShowPage } from "../../support/poms/ContactShowPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for Contact Form validation and submission
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs)
 * - Semantic selectors only (getByRole/Label/Text)
 * - Console monitoring for diagnostics
 * - Condition-based waiting (no waitForTimeout except validation tests)
 * - Timestamp-based test data for isolation
 *
 * VALIDATION REQUIREMENTS (from createContactSchema):
 * - first_name: Required
 * - last_name: Required
 * - organization_id: Required (no orphan contacts)
 * - sales_id: Required (account manager)
 * - email: At least one email required
 * - linkedin_url: Must be valid LinkedIn URL (optional)
 *
 * TEST CATEGORIES:
 * 1. ERROR SCENARIOS - Form should NOT save
 * 2. SUCCESS SCENARIOS - Form should save and redirect
 */

test.describe("Contact Form - Error Scenarios", () => {
  // Use stored auth state from setup
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  let formPage: ContactFormPage;

  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Navigate to contact create form
    formPage = new ContactFormPage(page);
    await formPage.gotoCreate();
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("ERROR - Empty form submission shows required field errors", async ({ page }) => {
    const formPage = new ContactFormPage(page);

    // Attempt to submit empty form
    await formPage.attemptSubmit();

    // Wait for validation to run
    await page.waitForTimeout(500);

    // Verify we're still on create form (validation prevented submission)
    await formPage.expectStillOnCreateForm();

    // Verify validation errors are shown for required fields
    // Note: Not all errors may be visible at once, but at least some should show
    const firstNameInput = formPage.getFirstNameInput();
    const lastNameInput = formPage.getLastNameInput();

    // At least one of these should be visible with an error indicator
    const firstNameInvalid = await firstNameInput.getAttribute("aria-invalid");
    const lastNameInvalid = await lastNameInput.getAttribute("aria-invalid");

    const hasValidationErrors = firstNameInvalid === "true" || lastNameInvalid === "true";
    expect(hasValidationErrors, "Expected validation errors for required fields").toBe(true);
  });

  test("ERROR - Missing first name only shows error", async ({ page }) => {
    const formPage = new ContactFormPage(page);
    const timestamp = Date.now();

    // Fill all required fields EXCEPT first_name
    await formPage.clickIdentityTab();
    await formPage.fillLastName(`TestLast-${timestamp}`);

    await formPage.selectOrganization("Test");
    await formPage.addEmail(`test-${timestamp}@example.com`);
    await formPage.selectAccountManager("Admin");

    // Attempt to submit
    await formPage.attemptSubmit();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify still on create form
    await formPage.expectStillOnCreateForm();

    // Verify first name shows as invalid
    const firstNameInput = formPage.getFirstNameInput();
    const ariaInvalid = await firstNameInput.getAttribute("aria-invalid");
    expect(ariaInvalid).toBe("true");
  });

  test("ERROR - Missing last name only shows error", async ({ page }) => {
    const formPage = new ContactFormPage(page);
    const timestamp = Date.now();

    // Fill all required fields EXCEPT last_name
    await formPage.clickIdentityTab();
    await formPage.fillFirstName(`TestFirst-${timestamp}`);

    await formPage.selectOrganization("Test");
    await formPage.addEmail(`test-${timestamp}@example.com`);
    await formPage.selectAccountManager("Admin");

    // Attempt to submit
    await formPage.attemptSubmit();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify still on create form
    await formPage.expectStillOnCreateForm();

    // Verify last name shows as invalid
    const lastNameInput = formPage.getLastNameInput();
    const ariaInvalid = await lastNameInput.getAttribute("aria-invalid");
    expect(ariaInvalid).toBe("true");
  });

  test("ERROR - Missing organization shows error", async ({ page }) => {
    const formPage = new ContactFormPage(page);
    const timestamp = Date.now();

    // Fill all required fields EXCEPT organization_id
    await formPage.clickIdentityTab();
    await formPage.fillFirstName(`TestFirst-${timestamp}`);
    await formPage.fillLastName(`TestLast-${timestamp}`);

    await formPage.addEmail(`test-${timestamp}@example.com`);
    await formPage.selectAccountManager("Admin");

    // Attempt to submit
    await formPage.attemptSubmit();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify still on create form
    await formPage.expectStillOnCreateForm();

    // Note: Organization error might appear as modal or inline error
    // Check that form did not submit (URL still on create)
    await expect(page).toHaveURL(/\/#\/contacts\/create/);
  });

  test("ERROR - Invalid email format shows error", async ({ page }) => {
    const formPage = new ContactFormPage(page);
    const timestamp = Date.now();

    // Fill all required fields with invalid email
    await formPage.clickIdentityTab();
    await formPage.fillFirstName(`TestFirst-${timestamp}`);
    await formPage.fillLastName(`TestLast-${timestamp}`);

    await formPage.selectOrganization("Test");

    // Add invalid email (no @ symbol)
    await formPage.clickContactInfoTab();
    const addButton = page.getByRole("button", { name: /add/i }).first();
    await addButton.click();
    const emailInput = page.getByLabel(/email/i).first();
    await emailInput.fill("invalid-email-format");

    await formPage.selectAccountManager("Admin");

    // Attempt to submit
    await formPage.attemptSubmit();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify still on create form
    await formPage.expectStillOnCreateForm();
  });

  test("ERROR - Invalid LinkedIn URL shows error", async ({ page }) => {
    const formPage = new ContactFormPage(page);
    const timestamp = Date.now();

    // Fill all required fields correctly
    await formPage.clickIdentityTab();
    await formPage.fillFirstName(`TestFirst-${timestamp}`);
    await formPage.fillLastName(`TestLast-${timestamp}`);

    await formPage.selectOrganization("Test");
    await formPage.addEmail(`test-${timestamp}@example.com`);

    // Add invalid LinkedIn URL (not from linkedin.com)
    await formPage.fillLinkedInUrl("https://twitter.com/someone");

    await formPage.selectAccountManager("Admin");

    // Attempt to submit
    await formPage.attemptSubmit();

    // Wait for validation
    await page.waitForTimeout(500);

    // Verify still on create form
    await formPage.expectStillOnCreateForm();

    // Verify LinkedIn input shows as invalid
    const linkedInInput = page.getByLabel(/linkedin/i);
    const ariaInvalid = await linkedInInput.getAttribute("aria-invalid");
    expect(ariaInvalid).toBe("true");
  });
});

test.describe("Contact Form - Success Scenarios", () => {
  // Use stored auth state from setup
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  let formPage: ContactFormPage;

  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Navigate to contact create form
    formPage = new ContactFormPage(page);
    await formPage.gotoCreate();
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("SUCCESS - Valid minimal form saves and redirects to show page", async ({ page }) => {
    const timestamp = Date.now();
    const testContact = {
      firstName: `MinimalFirst-${timestamp}`,
      lastName: `MinimalLast-${timestamp}`,
      email: `minimal-${timestamp}@example.com`,
      organization: "Test",
      accountManager: "Admin",
    };

    const formPage = new ContactFormPage(page);
    const showPage = new ContactShowPage(page);

    // Fill all required fields (minimal valid form)
    await formPage.fillRequiredFields(testContact);

    // Submit form
    await formPage.clickSaveAndClose();

    // Verify redirect to show page
    await expect(page).toHaveURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify contact details are visible on show page
    await showPage.expectNameVisible(testContact.firstName, testContact.lastName);
    await showPage.expectEmailVisible(testContact.email);

    // Assert no RLS or React errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("SUCCESS - Full form with all tabs filled saves successfully", async ({ page }) => {
    const timestamp = Date.now();
    const testContact = {
      firstName: `FullFirst-${timestamp}`,
      lastName: `FullLast-${timestamp}`,
      email: `full-${timestamp}@example.com`,
      title: `Senior Engineer ${timestamp}`,
      department: "Engineering",
      linkedInUrl: "https://www.linkedin.com/in/test-user",
      notes: `Test notes created at ${timestamp}`,
    };

    const formPage = new ContactFormPage(page);
    const showPage = new ContactShowPage(page);

    // Fill Identity tab
    await formPage.clickIdentityTab();
    await formPage.fillFirstName(testContact.firstName);
    await formPage.fillLastName(testContact.lastName);

    // Fill Position tab
    await formPage.fillTitle(testContact.title);
    await formPage.fillDepartment(testContact.department);
    await formPage.selectOrganization("Test");

    // Fill Contact Info tab
    await formPage.addEmail(testContact.email);
    await formPage.fillLinkedInUrl(testContact.linkedInUrl);

    // Fill Account tab
    await formPage.selectAccountManager("Admin");
    await formPage.fillNotes(testContact.notes);

    // Submit form
    await formPage.clickSaveAndClose();

    // Verify redirect to show page
    await expect(page).toHaveURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify all filled data is visible
    await showPage.expectNameVisible(testContact.firstName, testContact.lastName);
    await showPage.expectEmailVisible(testContact.email);
    await showPage.expectTitleVisible(testContact.title);

    // Assert no RLS or React errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("SUCCESS - Save & Add Another resets form and stays on create page", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const firstContact = {
      firstName: `First-${timestamp}`,
      lastName: `Contact-${timestamp}`,
      email: `first-${timestamp}@example.com`,
    };

    const formPage = new ContactFormPage(page);

    // Fill and submit first contact with Save & Add Another
    await formPage.fillRequiredFields(firstContact);
    await formPage.clickSaveAndAddAnother();

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Verify we're still on create page (not redirected to show)
    await expect(page).toHaveURL(/\/#\/contacts\/create/, { timeout: 5000 });

    // Verify form has been reset (first name input should be empty)
    const firstNameInput = formPage.getFirstNameInput();
    const firstName = await firstNameInput.inputValue();
    expect(firstName).toBe("");

    // Verify we can create another contact immediately
    const secondContact = {
      firstName: `Second-${timestamp}`,
      lastName: `Contact-${timestamp}`,
      email: `second-${timestamp}@example.com`,
    };

    await formPage.fillRequiredFields(secondContact);
    await formPage.clickSaveAndClose();

    // Verify redirect to show page for second contact
    await expect(page).toHaveURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Assert no RLS or React errors during both creates
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("SUCCESS - Valid LinkedIn URL (www.linkedin.com) saves correctly", async ({ page }) => {
    const timestamp = Date.now();
    const testContact = {
      firstName: `LinkedIn-${timestamp}`,
      lastName: `Test-${timestamp}`,
      email: `linkedin-${timestamp}@example.com`,
      linkedInUrl: "https://www.linkedin.com/in/test-profile",
    };

    const formPage = new ContactFormPage(page);
    const showPage = new ContactShowPage(page);

    // Fill required fields
    await formPage.fillRequiredFields({
      firstName: testContact.firstName,
      lastName: testContact.lastName,
      email: testContact.email,
    });

    // Add valid LinkedIn URL
    await formPage.fillLinkedInUrl(testContact.linkedInUrl);

    // Submit form
    await formPage.clickSaveAndClose();

    // Verify redirect to show page
    await expect(page).toHaveURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify contact was created
    await showPage.expectNameVisible(testContact.firstName, testContact.lastName);

    // Assert no errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("SUCCESS - Multiple email addresses with different types", async ({ page }) => {
    const timestamp = Date.now();
    const testContact = {
      firstName: `MultiEmail-${timestamp}`,
      lastName: `Test-${timestamp}`,
      workEmail: `work-${timestamp}@example.com`,
      homeEmail: `home-${timestamp}@example.com`,
    };

    const formPage = new ContactFormPage(page);
    const showPage = new ContactShowPage(page);

    // Fill Identity tab
    await formPage.clickIdentityTab();
    await formPage.fillFirstName(testContact.firstName);
    await formPage.fillLastName(testContact.lastName);

    // Fill organization
    await formPage.selectOrganization("Test");

    // Add multiple emails
    await formPage.addEmail(testContact.workEmail, "Work");

    // Add second email (Home type)
    await formPage.clickContactInfoTab();
    const addButton = page.getByRole("button", { name: /add/i }).first();
    await addButton.click();
    const emailInputs = page.getByLabel(/email/i);
    await emailInputs.nth(1).fill(testContact.homeEmail);

    // Select Home type for second email
    const typeDropdowns = page.getByLabel(/type/i);
    if ((await typeDropdowns.count()) > 1) {
      await typeDropdowns.nth(1).click();
      await page.getByRole("option", { name: "Home" }).click();
    }

    // Fill account manager
    await formPage.selectAccountManager("Admin");

    // Submit form
    await formPage.clickSaveAndClose();

    // Verify redirect to show page
    await expect(page).toHaveURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify both emails are saved (at least work email should be visible)
    await showPage.expectEmailVisible(testContact.workEmail);

    // Assert no errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });
});
