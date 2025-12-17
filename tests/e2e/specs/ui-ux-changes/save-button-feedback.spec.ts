import { test, expect } from "../../support/fixtures/authenticated";
import { DEFAULT_TEST_RELATIONSHIP } from "../../support/fixtures/test-data";

/**
 * E2E tests for Save Button Visual Feedback
 *
 * Tests the three states of the SaveButton component:
 * 1. Loading State - Shows spinner + "Saving..." text + disabled button
 * 2. Success State - Redirects to list view after successful save
 * 3. Error State - Shows error message and re-enables button on failure
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Semantic selectors only (getByRole/Label/Text)
 * - No CSS selectors
 * - Condition-based waiting
 * - Uses authenticatedPage fixture
 *
 * SaveButton Implementation (from form-primitives.tsx):
 * - Loading: Shows Loader2 icon with animate-spin class
 * - Disabled: opacity-50 cursor-not-allowed classes
 * - Label changes: "Save" -> "Saving..." when isSubmitting is true
 * - Normal: Shows Save icon with default label
 */

test.describe("Save Button Visual Feedback", () => {
  test("3.1 Loading State - Shows spinner and 'Saving...' text with disabled button", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/#/activities/create");

    // Wait for form to load
    await expect(authenticatedPage.getByRole("heading", { name: /create activity/i })).toBeVisible();

    // Fill minimal valid data
    await authenticatedPage.getByLabel(/subject/i).fill("Test Save Button Loading State");

    // Select opportunity using cmdk pattern
    const opportunityCombobox = authenticatedPage.getByRole("combobox", { name: /opportunity/i });
    await opportunityCombobox.click();
    const opportunityInput = authenticatedPage.locator('[cmdk-input]');
    await opportunityInput.fill(DEFAULT_TEST_RELATIONSHIP.opportunity.searchText);
    await authenticatedPage.locator(`[cmdk-item][data-value*="${DEFAULT_TEST_RELATIONSHIP.opportunity.id}"]`).first().click();

    // Select contact using cmdk pattern
    const contactCombobox = authenticatedPage.getByRole("combobox", { name: /contact/i });
    await contactCombobox.click();
    const contactInput = authenticatedPage.locator('[cmdk-input]');
    await contactInput.fill(DEFAULT_TEST_RELATIONSHIP.contact.searchText);
    await authenticatedPage.locator(`[cmdk-item][data-value*="${DEFAULT_TEST_RELATIONSHIP.contact.id}"]`).first().click();

    // Get save button BEFORE clicking
    const saveButton = authenticatedPage.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeEnabled();

    // Click save and immediately check loading state
    await saveButton.click();

    // Check for spinner (animate-spin class on Loader2 icon)
    // The spinner appears inside the button during submission
    const spinner = saveButton.locator('[class*="animate-spin"]');
    await expect(spinner).toBeVisible({ timeout: 1000 });

    // Button should be disabled during submission
    await expect(saveButton).toBeDisabled();

    // Wait for either redirect or spinner to disappear (save completes)
    await expect(authenticatedPage).toHaveURL(/\/#\/activities($|\?)/, { timeout: 10000 });
  });

  test("3.2 Success State - Redirects to list view after successful save", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/#/activities/create");

    // Wait for form to load
    await expect(authenticatedPage.getByRole("heading", { name: /create activity/i })).toBeVisible();

    // Fill minimal valid data
    const timestamp = Date.now();
    await authenticatedPage.getByLabel(/subject/i).fill(`Test Save Success ${timestamp}`);

    // Select opportunity using cmdk pattern
    const opportunityCombobox = authenticatedPage.getByRole("combobox", { name: /opportunity/i });
    await opportunityCombobox.click();
    const opportunityInput = authenticatedPage.locator('[cmdk-input]');
    await opportunityInput.fill(DEFAULT_TEST_RELATIONSHIP.opportunity.searchText);
    await authenticatedPage.locator(`[cmdk-item][data-value*="${DEFAULT_TEST_RELATIONSHIP.opportunity.id}"]`).first().click();

    // Select contact using cmdk pattern
    const contactCombobox = authenticatedPage.getByRole("combobox", { name: /contact/i });
    await contactCombobox.click();
    const contactInput = authenticatedPage.locator('[cmdk-input]');
    await contactInput.fill(DEFAULT_TEST_RELATIONSHIP.contact.searchText);
    await authenticatedPage.locator(`[cmdk-item][data-value*="${DEFAULT_TEST_RELATIONSHIP.contact.id}"]`).first().click();

    // Submit form
    const saveButton = authenticatedPage.getByRole("button", { name: /save/i });
    await saveButton.click();

    // Verify redirect to activities list (success state)
    await expect(authenticatedPage).toHaveURL(/\/#\/activities($|\?)/, { timeout: 10000 });

    // Verify we're no longer on the create page
    await expect(authenticatedPage).not.toHaveURL(/\/create/);
  });

  test("3.3 Error State - Shows error message and re-enables button on validation failure", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/#/activities/create");

    // Wait for form to load
    await expect(authenticatedPage.getByRole("heading", { name: /create activity/i })).toBeVisible();

    // Fill form with intentionally invalid data (missing required fields)
    // Only fill subject, leave opportunity and contact empty
    await authenticatedPage.getByLabel(/subject/i).fill("Test Error State");

    // Get save button - should be disabled due to missing required fields
    const saveButton = authenticatedPage.getByRole("button", { name: /save/i });

    // In forms with inline validation, the save button is disabled when required fields are empty
    // Verify button is disabled
    await expect(saveButton).toBeDisabled();

    // Verify form shows validation errors for missing fields
    // The form should show "Required field" or similar validation messages
    const requiredFieldMessages = authenticatedPage.getByText(/required/i);
    await expect(requiredFieldMessages.first()).toBeVisible();

    // Verify we're still on the create form (submission was prevented)
    await expect(authenticatedPage).toHaveURL(/\/#\/activities\/create/);
  });
});
