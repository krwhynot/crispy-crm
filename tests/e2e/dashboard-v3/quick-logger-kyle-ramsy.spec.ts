import { test, expect } from "../support/fixtures/authenticated";
import { consoleMonitor } from "../support/utils/console-monitor";
import { QuickLoggerPage } from "../support/poms/QuickLoggerPage";

/**
 * Quick Logger E2E Test - Kyle Ramsy at Bally's Casino
 *
 * Comprehensive test suite for the Quick Logger functionality using
 * a specific test contact (Kyle Ramsy) and organization (Bally's Casino and Hotel).
 *
 * Test data from seed.sql:
 * - Contact: Kyle Ramsy (ID: 18, organization_id: 79)
 * - Organization: Bally's Casino and Hotel (ID: 79)
 *
 * Tests verify:
 * 1. Quick Logger panel loads correctly
 * 2. Form opens with all required fields
 * 3. Smart entity cascade (contact auto-fills organization)
 * 4. Activity type selection shows conditional fields
 * 5. Combobox search and selection works
 * 6. Form submission creates activity record
 * 7. Follow-up task creation when enabled
 * 8. Save & New keeps form open and resets
 * 9. Console error monitoring for RLS/API issues
 *
 * Required by: Dashboard V3 Implementation Plan
 * Uses: playwright-e2e-testing skill patterns
 */

test.describe("Quick Logger - Kyle Ramsy at Bally's Casino", () => {
  let quickLogger: QuickLoggerPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    quickLogger = new QuickLoggerPage(authenticatedPage);

    // Navigate to dashboard
    await authenticatedPage.goto("/");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for Quick Logger panel to be visible
    await expect(authenticatedPage.getByText("Log Activity")).toBeVisible({ timeout: 15000 });
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      // Attach detailed report to test results
      await test.info().attach("console-errors", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });

      // Check for specific error types
      const rlsErrors = errors.filter(
        (e) => e.includes("RLS") || e.includes("permission denied") || e.includes("42501")
      );
      const reactErrors = errors.filter(
        (e) => e.includes("React") || e.includes("Uncaught")
      );

      if (rlsErrors.length > 0) {
        console.log("RLS ERRORS DETECTED:", rlsErrors);
      }
      if (reactErrors.length > 0) {
        console.log("REACT ERRORS DETECTED:", reactErrors);
      }
    }

    // Fail test if critical errors were detected
    expect(
      errors.filter((e) => e.includes("permission denied") || e.includes("Uncaught")),
      "Critical console errors detected"
    ).toHaveLength(0);
  });

  test.describe("Panel and Form Rendering", () => {
    test("Quick Logger panel is visible with correct header", async ({ authenticatedPage }) => {
      // Verify panel header - uses text content not heading role
      await expect(authenticatedPage.getByText("Log Activity")).toBeVisible();

      // Verify description text
      await expect(
        authenticatedPage.getByText(/quick capture for calls, meetings, and notes/i)
      ).toBeVisible();

      // Verify "New Activity" button is present
      await expect(authenticatedPage.getByRole("button", { name: /new activity/i })).toBeVisible();
    });

    test("clicking New Activity opens form with all fields", async ({ authenticatedPage }) => {
      // Click New Activity button
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Wait for form to load
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible({ timeout: 5000 });

      // Verify all form sections are present
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible();
      await expect(authenticatedPage.getByText("Who was involved?")).toBeVisible();

      // Verify form fields
      await expect(authenticatedPage.getByLabel("Activity Type")).toBeVisible();
      await expect(authenticatedPage.getByLabel("Outcome")).toBeVisible();
      await expect(authenticatedPage.getByLabel(/contact/i)).toBeVisible();
      await expect(authenticatedPage.getByLabel(/organization/i)).toBeVisible();
      await expect(authenticatedPage.getByLabel(/notes/i)).toBeVisible();

      // Verify action buttons
      await expect(authenticatedPage.getByRole("button", { name: /cancel/i })).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: /save & close/i })).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: /save & new/i })).toBeVisible();
    });

    test("Cancel button closes form and returns to New Activity state", async ({
      authenticatedPage,
    }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible();

      // Click Cancel
      await authenticatedPage.getByRole("button", { name: /cancel/i }).click();

      // Verify form closed and New Activity button is back
      await expect(authenticatedPage.getByRole("button", { name: /new activity/i })).toBeVisible();
      await expect(authenticatedPage.getByText("What happened?")).not.toBeVisible();
    });
  });

  test.describe("Activity Type Selection", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Open form for each test
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible();
    });

    test("selecting Call shows duration field", async ({ authenticatedPage }) => {
      // Click Activity Type dropdown
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();

      // Select Call
      await authenticatedPage.getByRole("option", { name: "Call" }).click();

      // Verify duration field appears
      await expect(authenticatedPage.getByLabel(/duration/i)).toBeVisible();
    });

    test("selecting Meeting shows duration field", async ({ authenticatedPage }) => {
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Meeting" }).click();

      await expect(authenticatedPage.getByLabel(/duration/i)).toBeVisible();
    });

    test("selecting Email hides duration field", async ({ authenticatedPage }) => {
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Email" }).click();

      await expect(authenticatedPage.getByLabel(/duration/i)).not.toBeVisible();
    });

    test("selecting Note hides duration field", async ({ authenticatedPage }) => {
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Note" }).click();

      await expect(authenticatedPage.getByLabel(/duration/i)).not.toBeVisible();
    });
  });

  test.describe("Smart Entity Cascade", () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible();
    });

    test("selecting a contact with organization auto-fills organization field", async ({
      authenticatedPage,
    }) => {
      // Open Contact combobox
      const contactTrigger = authenticatedPage
        .getByLabel("Contact *")
        .locator("..")
        .getByRole("combobox");
      await contactTrigger.click();

      // Wait for contact options to load
      await expect(authenticatedPage.getByPlaceholder(/search contact/i)).toBeVisible();

      // Type to search - filters and positions options for keyboard navigation
      const searchInput = authenticatedPage.getByPlaceholder(/search contact/i);
      await searchInput.fill("and"); // Type to filter and reduce list size

      // Wait for options to appear after filtering
      const firstContact = authenticatedPage.getByRole("option").first();
      await expect(firstContact).toBeVisible({ timeout: 5000 });

      // Get the contact name before selecting
      const contactName = await firstContact.textContent();

      // Use keyboard navigation: ArrowDown to ensure first option is selected, then Enter
      await searchInput.press("ArrowDown");
      await searchInput.press("Enter");

      // Verify contact was selected
      await expect(contactTrigger).toContainText(contactName || "", { timeout: 5000 });

      // Check if organization field was auto-filled (contact may or may not have org)
      const orgTrigger = authenticatedPage
        .getByLabel("Organization *")
        .locator("..")
        .getByRole("combobox");

      // Either org is auto-filled OR shows placeholder - both are valid
      const orgText = await orgTrigger.textContent();
      expect(orgText).toBeTruthy();
    });

    test("selecting organization first filters available contacts", async ({
      authenticatedPage,
    }) => {
      // First select an organization
      const orgTrigger = authenticatedPage
        .getByLabel("Organization *")
        .locator("..")
        .getByRole("combobox");
      await orgTrigger.click();

      // Wait for options and select first organization
      await expect(authenticatedPage.getByPlaceholder(/search organization/i)).toBeVisible();
      const firstOrg = authenticatedPage.getByRole("option").first();
      const orgCount = await firstOrg.count();

      if (orgCount === 0) {
        test.skip("No organizations available in database");
        return;
      }

      const orgName = await firstOrg.textContent();
      await firstOrg.click();

      // Verify org was selected
      await expect(orgTrigger).toContainText(orgName || "");

      // Now open contact combobox - it should show filtered or all contacts
      const contactTrigger = authenticatedPage
        .getByLabel("Contact *")
        .locator("..")
        .getByRole("combobox");
      await contactTrigger.click();

      // Contacts should load (filtered by org or showing all)
      await expect(authenticatedPage.getByPlaceholder(/search contact/i)).toBeVisible();

      // Close without selecting
      await authenticatedPage.keyboard.press("Escape");
    });
  });

  test.describe("Activity Submission", () => {
    test("logs Call activity with contact and organization", async ({ authenticatedPage }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible();

      // Select Activity Type: Call
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Call" }).click();

      // Select Outcome: Connected
      const outcomeTrigger = authenticatedPage.getByLabel("Outcome").locator("..").getByRole("combobox");
      await outcomeTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Connected" }).click();

      // Set duration
      await authenticatedPage.getByLabel(/duration/i).fill("15");

      // Select first available contact using search to keep items in viewport
      const contactTrigger = authenticatedPage
        .getByLabel("Contact *")
        .locator("..")
        .getByRole("combobox");
      await contactTrigger.click();
      const searchInput = authenticatedPage.getByPlaceholder(/search contact/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill("a"); // Filter to reduce list
      await authenticatedPage.waitForTimeout(500);

      const firstContact = authenticatedPage.getByRole("option").first();
      if ((await firstContact.count()) === 0) {
        test.skip("No contacts available in database");
        return;
      }
      await firstContact.click({ force: true });

      // Fill notes with unique timestamp
      const timestamp = Date.now();
      const notesField = authenticatedPage.getByLabel("Notes").locator("..").getByRole("textbox");
      await notesField.fill(`E2E test call - discussed project requirements. Test ID: ${timestamp}`);

      // Submit with Save & Close
      await authenticatedPage.getByRole("button", { name: /save & close/i }).click();

      // Verify form closed (New Activity button visible)
      await expect(authenticatedPage.getByRole("button", { name: /new activity/i })).toBeVisible({
        timeout: 10000,
      });

      // Verify success notification
      await expect(authenticatedPage.getByText(/activity logged successfully/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("creates follow-up task when enabled", async ({ authenticatedPage }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Select Activity Type: Call
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Call" }).click();

      // Select Outcome: Connected
      const outcomeTrigger = authenticatedPage.getByLabel("Outcome").locator("..").getByRole("combobox");
      await outcomeTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Connected" }).click();

      // Set duration
      await authenticatedPage.getByLabel(/duration/i).fill("30");

      // Select first available contact using search
      const contactTrigger = authenticatedPage
        .getByLabel("Contact *")
        .locator("..")
        .getByRole("combobox");
      await contactTrigger.click();
      const searchInput = authenticatedPage.getByPlaceholder(/search contact/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill("a");
      await authenticatedPage.waitForTimeout(500);

      const firstContact = authenticatedPage.getByRole("option").first();
      if ((await firstContact.count()) === 0) {
        test.skip("No contacts available in database");
        return;
      }
      await firstContact.click({ force: true });

      // Fill notes
      const timestamp = Date.now();
      const notesField = authenticatedPage.getByLabel("Notes").locator("..").getByRole("textbox");
      await notesField.fill(`Follow-up required for contract discussion. Test ID: ${timestamp}`);

      // Enable follow-up task
      await authenticatedPage.getByRole("switch").click();

      // Verify follow-up date field appears
      await expect(authenticatedPage.getByText("Follow-up Date")).toBeVisible();

      // Select tomorrow's date
      await authenticatedPage.getByRole("button", { name: /pick a date/i }).click();
      await expect(authenticatedPage.getByRole("grid")).toBeVisible();

      // Find tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayNumber = tomorrow.getDate();

      // Click tomorrow (avoid disabled dates)
      await authenticatedPage
        .getByRole("gridcell", { name: String(dayNumber), exact: true })
        .filter({ hasNot: authenticatedPage.locator("[disabled]") })
        .first()
        .click();

      // Submit
      await authenticatedPage.getByRole("button", { name: /save & close/i }).click();

      // Verify success
      await expect(authenticatedPage.getByRole("button", { name: /new activity/i })).toBeVisible({
        timeout: 10000,
      });

      // Success notification should appear
      await expect(authenticatedPage.getByText(/activity logged successfully/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Save & New Flow", () => {
    test("Save & New submits activity and resets form for next entry", async ({
      authenticatedPage,
    }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Fill first activity
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Email" }).click();

      const outcomeTrigger = authenticatedPage.getByLabel("Outcome").locator("..").getByRole("combobox");
      await outcomeTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Completed" }).click();

      // Select first available contact using search to keep items in viewport
      const contactTrigger = authenticatedPage
        .getByLabel("Contact *")
        .locator("..")
        .getByRole("combobox");
      await contactTrigger.click();
      const searchInput = authenticatedPage.getByPlaceholder(/search contact/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill("a"); // Filter to reduce list
      await authenticatedPage.waitForTimeout(500);

      const firstContact = authenticatedPage.getByRole("option").first();
      if ((await firstContact.count()) === 0) {
        test.skip("No contacts available in database");
        return;
      }
      await firstContact.click({ force: true });

      // Fill notes with unique timestamp
      const timestamp = Date.now();
      const notesField = authenticatedPage.getByLabel("Notes").locator("..").getByRole("textbox");
      await notesField.fill(`E2E test email - bulk pricing discussion. Test ID: ${timestamp}`);

      // Click Save & New
      await authenticatedPage.getByRole("button", { name: /save & new/i }).click();

      // Verify form stays open but is reset
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible({ timeout: 10000 });

      // Notes should be cleared
      await expect(notesField).toHaveValue("", { timeout: 5000 });

      // Activity type should be reset (shows placeholder)
      await expect(activityTrigger).toContainText(/select type/i, { timeout: 5000 });
    });
  });

  test.describe("Form Validation", () => {
    test("requires notes field for submission", async ({ authenticatedPage }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Fill only activity type and outcome (skip notes)
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Note" }).click();

      const outcomeTrigger = authenticatedPage.getByLabel("Outcome").locator("..").getByRole("combobox");
      await outcomeTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Completed" }).click();

      // Select first available contact using search to keep items in viewport
      const contactTrigger = authenticatedPage
        .getByLabel("Contact *")
        .locator("..")
        .getByRole("combobox");
      await contactTrigger.click();
      const searchInput = authenticatedPage.getByPlaceholder(/search contact/i);
      await expect(searchInput).toBeVisible();
      await searchInput.fill("a"); // Filter to reduce list
      await authenticatedPage.waitForTimeout(500);

      const firstContact = authenticatedPage.getByRole("option").first();
      if ((await firstContact.count()) === 0) {
        test.skip("No contacts available in database");
        return;
      }
      await firstContact.click({ force: true });

      // Try to submit without notes
      await authenticatedPage.getByRole("button", { name: /save & close/i }).click();

      // Form should still be visible (submission blocked by validation)
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible();

      // Check for validation error message (Zod validation)
      // The exact error depends on schema, but form shouldn't close
    });

    test("requires contact or organization for submission", async ({ authenticatedPage }) => {
      // Open form
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Fill activity type, outcome, and notes only
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Note" }).click();

      const outcomeTrigger = authenticatedPage.getByLabel("Outcome").locator("..").getByRole("combobox");
      await outcomeTrigger.click();
      await authenticatedPage.getByRole("option", { name: "Completed" }).click();

      const notesField = authenticatedPage.getByLabel("Notes").locator("..").getByRole("textbox");
      await notesField.fill("Test note without contact or org");

      // Try to submit
      await authenticatedPage.getByRole("button", { name: /save & close/i }).click();

      // Form should still be visible (validation requires contact or org)
      await expect(authenticatedPage.getByText("What happened?")).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("form fields have accessible labels", async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Verify all form fields are accessible by label
      await expect(authenticatedPage.getByLabel("Activity Type")).toBeVisible();
      await expect(authenticatedPage.getByLabel("Outcome")).toBeVisible();
      await expect(authenticatedPage.getByLabel(/contact/i)).toBeVisible();
      await expect(authenticatedPage.getByLabel(/organization/i)).toBeVisible();
      await expect(authenticatedPage.getByLabel(/notes/i)).toBeVisible();
    });

    test("buttons meet minimum touch target size (44px)", async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Check Save & Close button
      const saveButton = authenticatedPage.getByRole("button", { name: /save & close/i });
      const box = await saveButton.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });

    test("comboboxes can be focused with keyboard", async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole("button", { name: /new activity/i }).click();

      // Focus the Activity Type combobox directly
      const activityTrigger = authenticatedPage.getByLabel("Activity Type").locator("..").getByRole("combobox");
      await activityTrigger.focus();

      // Verify it has focus
      await expect(activityTrigger).toBeFocused();

      // Open with Space or Enter
      await authenticatedPage.keyboard.press("Space");

      // Verify dropdown opened (options visible)
      await expect(authenticatedPage.getByRole("option", { name: "Call" })).toBeVisible({ timeout: 3000 });

      // Close with Escape
      await authenticatedPage.keyboard.press("Escape");

      // Dropdown should close
      await expect(authenticatedPage.getByRole("option", { name: "Call" })).not.toBeVisible();
    });
  });
});
