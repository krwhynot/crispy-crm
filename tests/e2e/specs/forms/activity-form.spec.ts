import { test, expect } from "@playwright/test";
import { ActivityFormPage } from "../../support/poms/ActivityFormPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * E2E tests for Activity Form validation and submission
 * Tests create form with all validation rules from activitiesSchema
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs) ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - Console monitoring for diagnostics ✓
 * - Condition-based waiting (no waitForTimeout except validation checks) ✓
 * - Timestamp-based test data for isolation ✓
 *
 * Validation Requirements (from activitiesSchema):
 * - subject: Required (min 1 char)
 * - activity_type: "engagement" or "interaction" (default: interaction)
 * - type: One of 13 interaction types
 * - opportunity_id: Required IF activity_type is "interaction"
 * - contact_id OR organization_id: At least one required
 * - follow_up_date: Required IF follow_up_required is true
 * - sample_status: Required IF type is "sample"
 */

test.describe("Activity Form - Error Scenarios", () => {
  // Use stored auth state from setup
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  let formPage: ActivityFormPage;

  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Navigate to activity create form (auth already handled by storageState)
    formPage = new ActivityFormPage(page);
    await formPage.gotoCreate();
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("ERROR #1 - Empty form submission shows subject required error", async ({ page }) => {
    const formPage = new ActivityFormPage(page);

    // Navigate to create form
    await formPage.gotoCreate();

    // Try to submit without filling any fields
    await formPage.attemptSubmit();

    // Should show subject required error
    await formPage.expectSubjectError(/required/i);

    // Verify we're still on create form
    await formPage.expectStillOnCreateForm();
  });

  test("ERROR #2 - Interaction type without opportunity shows opportunity required error", async ({
    page,
  }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill required fields EXCEPT opportunity
    await formPage.fillSubject(`Test Activity ${timestamp}`);
    await formPage.selectInteractionType("call");
    await formPage.selectContact("Test"); // Provide contact to satisfy contact/org requirement

    // activity_type defaults to "interaction" which requires opportunity_id
    // Try to submit without opportunity
    await formPage.attemptSubmit();

    // Should show opportunity required error
    await formPage.expectOpportunityError(/required/i);

    // Verify we're still on create form
    await formPage.expectStillOnCreateForm();
  });

  test("ERROR #3 - No contact or organization selected shows required error", async ({ page }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill subject but NO contact or organization
    await formPage.fillSubject(`Test Activity ${timestamp}`);
    await formPage.selectInteractionType("call");

    // Try to submit
    await formPage.attemptSubmit();

    // Should show contact or organization required error
    await formPage.expectContactError(/required|contact or organization/i);

    // Verify we're still on create form
    await formPage.expectStillOnCreateForm();
  });

  test("ERROR #4 - Follow-up enabled without date shows follow-up date required error", async ({
    page,
  }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill required fields
    await formPage.fillSubject(`Test Activity ${timestamp}`);
    await formPage.selectInteractionType("call");
    await formPage.selectOpportunity("Test");
    await formPage.selectContact("Test");

    // Enable follow-up without setting date
    await formPage.toggleFollowUp(true);
    // Do NOT fill follow_up_date

    // Try to submit
    await formPage.attemptSubmit();

    // Should show follow-up date required error
    await formPage.expectFollowUpDateError(/required/i);

    // Verify we're still on create form
    await formPage.expectStillOnCreateForm();
  });

  test("ERROR #5 - Sample type without sample_status shows sample status required error", async ({
    page,
  }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill required fields with sample type
    await formPage.fillSubject(`Test Sample Activity ${timestamp}`);
    await formPage.selectInteractionType("sample");
    await formPage.selectOpportunity("Test");
    await formPage.selectContact("Test");

    // Do NOT select sample_status

    // Try to submit
    await formPage.attemptSubmit();

    // Should show sample status required error
    await formPage.expectSampleStatusError(/required/i);

    // Verify we're still on create form
    await formPage.expectStillOnCreateForm();
  });
});

test.describe("Activity Form - Success Scenarios", () => {
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
  });

  test.afterEach(async () => {
    // Report console errors if any
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("SUCCESS #1 - Minimal valid activity (subject + contact) saves successfully", async ({
    page,
  }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill minimal required fields
    await formPage.fillSubject(`Minimal Activity ${timestamp}`);
    await formPage.selectContact("Test"); // Satisfies contact_id OR organization_id requirement

    // Since activity_type defaults to "interaction", we need opportunity_id
    await formPage.selectOpportunity("Test");

    // Submit
    await formPage.clickSave();

    // Verify form submitted successfully
    await formPage.expectFormSuccess();

    // Assert no RLS/React console errors
    expect(consoleMonitor.hasRLSErrors(), "RLS errors detected").toBe(false);
    expect(consoleMonitor.hasReactErrors(), "React errors detected").toBe(false);
  });

  test("SUCCESS #2 - Interaction with opportunity saves successfully", async ({ page }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill all fields for an interaction
    await formPage.fillSubject(`Call with prospect ${timestamp}`);
    await formPage.selectInteractionType("call");
    await formPage.selectOpportunity("Test"); // Required for interaction
    await formPage.selectContact("Test");
    await formPage.selectOrganization("Test");

    // Submit
    await formPage.clickSave();

    // Verify form submitted successfully
    await formPage.expectFormSuccess();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("SUCCESS #3 - Activity with follow-up section complete saves successfully", async ({
    page,
  }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();
    const followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10); // 7 days from now

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill required fields
    await formPage.fillSubject(`Meeting with follow-up ${timestamp}`);
    await formPage.selectInteractionType("meeting");
    await formPage.selectOpportunity("Test");
    await formPage.selectContact("Test");

    // Enable follow-up and set date
    await formPage.toggleFollowUp(true);
    await formPage.fillFollowUpDate(followUpDate);

    // Submit
    await formPage.clickSave();

    // Verify form submitted successfully
    await formPage.expectFormSuccess();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("SUCCESS #4 - Sample activity with sample_status saves successfully", async ({ page }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill required fields for sample activity
    await formPage.fillSubject(`Product sample sent ${timestamp}`);
    await formPage.selectInteractionType("sample");
    await formPage.selectOpportunity("Test");
    await formPage.selectContact("Test");

    // Set sample status (required for sample type)
    await formPage.selectSampleStatus("sent");

    // Submit
    await formPage.clickSave();

    // Verify form submitted successfully
    await formPage.expectFormSuccess();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("SUCCESS #5 - Activity with organization only (no contact) saves successfully", async ({
    page,
  }) => {
    const formPage = new ActivityFormPage(page);
    const timestamp = Date.now();

    // Navigate to create form
    await formPage.gotoCreate();

    // Fill required fields with organization only (no contact)
    await formPage.fillSubject(`Organization call ${timestamp}`);
    await formPage.selectInteractionType("call");
    await formPage.selectOpportunity("Test");
    await formPage.selectOrganization("Test"); // Satisfies contact_id OR organization_id

    // Submit
    await formPage.clickSave();

    // Verify form submitted successfully
    await formPage.expectFormSuccess();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test("SUCCESS #6 - Activity with all 13 interaction types can be created", async ({ page }) => {
    // Test all 13 interaction types from PRD v1.18
    const interactionTypes = [
      "call",
      "email",
      "meeting",
      "demo",
      "proposal",
      "follow_up",
      "trade_show",
      "site_visit",
      "contract_review",
      "check_in",
      "social",
      "note",
      "sample",
    ];

    for (const type of interactionTypes) {
      const formPage = new ActivityFormPage(page);
      const timestamp = Date.now();

      // Navigate to create form
      await formPage.gotoCreate();

      // Fill required fields with current interaction type
      await formPage.fillSubject(`${type} activity ${timestamp}`);
      await formPage.selectInteractionType(type);
      await formPage.selectOpportunity("Test");
      await formPage.selectContact("Test");

      // If type is "sample", add sample_status
      if (type === "sample") {
        await formPage.selectSampleStatus("sent");
      }

      // Submit
      await formPage.clickSave();

      // Verify form submitted successfully
      await formPage.expectFormSuccess();

      // Assert no console errors
      expect(consoleMonitor.hasRLSErrors(), `RLS errors for ${type}`).toBe(false);
      expect(consoleMonitor.hasReactErrors(), `React errors for ${type}`).toBe(false);
    }
  });
});
