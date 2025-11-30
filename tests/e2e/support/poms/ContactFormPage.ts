import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import {
  waitForFormReady,
  clickSaveAndWait,
  fillAutocompleteField,
  expectFieldError,
  expectFormNotSubmitted,
  expectFormSubmitted,
  uniqueTestData,
} from "./FormTestHelpers";

/**
 * Contact Form Page Object Model
 * Handles both create and edit forms for contacts
 *
 * Validation Requirements (from createContactSchema):
 * - first_name: Required
 * - last_name: Required
 * - organization_id: Required (no orphan contacts)
 * - sales_id: Required (account manager)
 * - email: At least one email required
 * - linkedin_url: Must be valid LinkedIn URL (optional)
 *
 * Required by playwright-e2e-testing skill
 */
export class ContactFormPage extends BasePage {
  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Navigate to contact create form
   */
  async gotoCreate(): Promise<void> {
    await this.goto("/#/contacts/create");
    await waitForFormReady(this.page);
  }

  /**
   * Navigate to contact edit form
   */
  async gotoEdit(contactId: number | string): Promise<void> {
    await this.goto(`/#/contacts/${contactId}`);
    await waitForFormReady(this.page);
  }

  // ============================================================================
  // TAB NAVIGATION
  // ============================================================================

  /**
   * Click the Main tab (contains Identity, Organization, Account Manager, Contact Info sections)
   */
  async clickMainTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /main/i }).click();
  }

  /**
   * Click the More tab (contains additional fields like LinkedIn, notes)
   */
  async clickMoreTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /more/i }).click();
  }

  // DEPRECATED: Legacy tab methods kept for compatibility but no longer used
  // The contact form uses Main/More tabs, not Identity/Position/Contact Info/Account
  async clickIdentityTab(): Promise<void> {
    await this.clickMainTab(); // Redirect to Main tab
  }

  async clickPositionTab(): Promise<void> {
    await this.clickMainTab(); // Redirect to Main tab
  }

  async clickContactInfoTab(): Promise<void> {
    await this.clickMainTab(); // Redirect to Main tab
  }

  async clickAccountTab(): Promise<void> {
    await this.clickMainTab(); // Redirect to Main tab
  }

  // ============================================================================
  // IDENTITY TAB FIELDS
  // ============================================================================

  /**
   * Fill the first name field
   */
  async fillFirstName(firstName: string): Promise<void> {
    const input = this.page.getByLabel(/first name/i);
    await expect(input).toBeVisible();
    await input.fill(firstName);
  }

  /**
   * Fill the last name field
   */
  async fillLastName(lastName: string): Promise<void> {
    const input = this.page.getByLabel(/last name/i);
    await expect(input).toBeVisible();
    await input.fill(lastName);
  }

  /**
   * Get the first name input
   */
  getFirstNameInput(): Locator {
    return this.page.getByLabel(/first name/i);
  }

  /**
   * Get the last name input
   */
  getLastNameInput(): Locator {
    return this.page.getByLabel(/last name/i);
  }

  // ============================================================================
  // POSITION TAB FIELDS
  // ============================================================================

  /**
   * Fill the title field
   */
  async fillTitle(title: string): Promise<void> {
    await this.clickPositionTab();
    const input = this.page.getByLabel(/^title$/i);
    await expect(input).toBeVisible();
    await input.fill(title);
  }

  /**
   * Fill the department field
   */
  async fillDepartment(department: string): Promise<void> {
    await this.clickPositionTab();
    const input = this.page.getByLabel(/department/i);
    await expect(input).toBeVisible();
    await input.fill(department);
  }

  /**
   * Select an organization (autocomplete field)
   */
  async selectOrganization(searchText: string): Promise<void> {
    await this.clickPositionTab();
    await fillAutocompleteField(this.page, /organization/i, searchText);
  }

  // ============================================================================
  // CONTACT INFO TAB FIELDS
  // ============================================================================

  /**
   * Add an email to the contact
   * Handles the JSONB array pattern (click Add, then fill)
   */
  async addEmail(email: string, type: "Work" | "Home" | "Other" = "Work"): Promise<void> {
    await this.clickContactInfoTab();

    // Find and click the Add button for email section
    const addButton = this.page.getByRole("button", { name: /add/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for the email input to appear
    const emailInput = this.page.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(email);

    // If type is not Work, select it from dropdown
    if (type !== "Work") {
      const typeDropdown = this.page.getByLabel(/type/i).first();
      await typeDropdown.click();
      await this.page.getByRole("option", { name: type }).click();
    }
  }

  /**
   * Fill LinkedIn URL
   */
  async fillLinkedInUrl(url: string): Promise<void> {
    await this.clickContactInfoTab();
    const input = this.page.getByLabel(/linkedin/i);
    await expect(input).toBeVisible();
    await input.fill(url);
  }

  /**
   * Add a phone number
   */
  async addPhone(number: string, type: "Work" | "Home" | "Other" = "Work"): Promise<void> {
    await this.clickContactInfoTab();

    // Find phone section's Add button (second Add button usually)
    const addButtons = this.page.getByRole("button", { name: /add/i });
    const phoneAddButton = addButtons.nth(1); // Assuming email is first, phone is second

    if (await phoneAddButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneAddButton.click();

      // Fill phone number
      const phoneInput = this.page.getByLabel(/phone|number/i).first();
      await phoneInput.fill(number);

      // Select type if not Work
      if (type !== "Work") {
        const typeDropdown = this.page.getByLabel(/type/i).last();
        await typeDropdown.click();
        await this.page.getByRole("option", { name: type }).click();
      }
    }
  }

  // ============================================================================
  // ACCOUNT TAB FIELDS
  // ============================================================================

  /**
   * Select account manager (sales_id)
   */
  async selectAccountManager(searchText: string): Promise<void> {
    await this.clickAccountTab();
    await fillAutocompleteField(this.page, /account manager|sales/i, searchText);
  }

  /**
   * Fill notes field
   */
  async fillNotes(notes: string): Promise<void> {
    await this.clickAccountTab();
    const input = this.page.getByLabel(/notes/i);
    await expect(input).toBeVisible();
    await input.fill(notes);
  }

  // ============================================================================
  // FORM ACTIONS
  // ============================================================================

  /**
   * Click Save & Close button
   */
  async clickSaveAndClose(): Promise<void> {
    const button = this.page.getByRole("button", { name: /save.*close/i });
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Click Save & Add Another button
   */
  async clickSaveAndAddAnother(): Promise<void> {
    const button = this.page.getByRole("button", { name: /save.*another/i });
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Click Cancel button
   */
  async clickCancel(): Promise<void> {
    const button = this.page.getByRole("button", { name: /cancel/i });
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Submit the form (alias for save)
   */
  async submit(): Promise<void> {
    await clickSaveAndWait(this.page);
  }

  /**
   * Attempt to submit form (for validation testing - doesn't wait for navigation)
   */
  async attemptSubmit(): Promise<void> {
    await this.clickSaveAndClose();
    // Wait briefly for validation to run
    await this.page.waitForTimeout(500);
  }

  // ============================================================================
  // VALIDATION ASSERTIONS
  // ============================================================================

  /**
   * Assert first name error is shown
   */
  async expectFirstNameError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "first_name", message);
  }

  /**
   * Assert last name error is shown
   */
  async expectLastNameError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "last_name", message);
  }

  /**
   * Assert organization error is shown
   */
  async expectOrganizationError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "organization", message);
  }

  /**
   * Assert email error is shown
   */
  async expectEmailError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "email", message);
  }

  /**
   * Assert LinkedIn URL error is shown
   */
  async expectLinkedInError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "linkedin", message);
  }

  /**
   * Assert we're still on the create form (validation prevented submission)
   */
  async expectStillOnCreateForm(): Promise<void> {
    await expectFormNotSubmitted(this.page, "contacts");
  }

  /**
   * Assert form was submitted successfully
   */
  async expectFormSuccess(): Promise<void> {
    await expectFormSubmitted(this.page, "contacts");
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Fill all required fields for a valid contact
   */
  async fillRequiredFields(options?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    organization?: string;
    accountManager?: string;
  }): Promise<void> {
    const timestamp = Date.now();
    const defaults = {
      firstName: options?.firstName || uniqueTestData("Test"),
      lastName: options?.lastName || uniqueTestData("Contact"),
      email: options?.email || `test-${timestamp}@example.com`,
      organization: options?.organization || "Test", // Will search for existing
      accountManager: options?.accountManager || "Admin", // Will search for existing
    };

    // Identity tab
    await this.clickIdentityTab();
    await this.fillFirstName(defaults.firstName);
    await this.fillLastName(defaults.lastName);

    // Position tab - organization
    await this.selectOrganization(defaults.organization);

    // Contact Info tab - email
    await this.addEmail(defaults.email);

    // Account tab - account manager
    await this.selectAccountManager(defaults.accountManager);
  }

  /**
   * Create a new contact with all fields and submit
   */
  async createContact(data: {
    firstName: string;
    lastName: string;
    email: string;
    organization: string;
    accountManager?: string;
    title?: string;
  }): Promise<void> {
    await this.fillRequiredFields({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      organization: data.organization,
      accountManager: data.accountManager,
    });

    if (data.title) {
      await this.fillTitle(data.title);
    }

    await this.clickSaveAndClose();

    // Wait for redirect to show page
    await this.waitForURL(/\/#\/contacts\/\d+\/show/);
  }

  /**
   * Fill the form and return to Identity tab for assertions
   */
  async fillContactForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    title?: string;
  }): Promise<void> {
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.addEmail(data.email);

    if (data.title) {
      await this.fillTitle(data.title);
    }
  }

  /**
   * Update contact fields and submit
   */
  async updateContact(data: {
    firstName?: string;
    lastName?: string;
    title?: string;
  }): Promise<void> {
    if (data.firstName) {
      await this.clickIdentityTab();
      await this.fillFirstName(data.firstName);
    }
    if (data.lastName) {
      await this.clickIdentityTab();
      await this.fillLastName(data.lastName);
    }
    if (data.title) {
      await this.fillTitle(data.title);
    }

    await this.submit();

    // Wait for redirect to show page
    await this.waitForURL(/\/#\/contacts\/\d+\/show/);
  }
}
