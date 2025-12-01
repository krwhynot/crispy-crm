import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import {
  waitForFormReady,
  clickSaveAndWait,
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
   * Select an organization (Radix popover combobox pattern)
   * Click trigger button -> dialog opens with search combobox -> type and select option
   */
  async selectOrganization(searchText: string): Promise<void> {
    await this.clickMainTab();

    // Find the Organization section trigger button (shows "Search")
    const orgHeading = this.page.getByRole("heading", { name: /^Organization$/i, level: 3 });
    const orgSection = orgHeading.locator("..").locator("..");
    const triggerButton = orgSection.getByRole("combobox").first();

    // Click to open the popover dialog
    await expect(triggerButton).toBeVisible({ timeout: 5000 });
    await triggerButton.click();

    // Wait for dialog to open and find the search input inside it
    const dialog = this.page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // The search input is a combobox inside the dialog
    const searchInput = dialog.getByRole("combobox");
    await expect(searchInput).toBeVisible({ timeout: 3000 });

    // Type the search text
    await searchInput.fill(searchText);

    // Wait for options to filter
    await this.page.waitForTimeout(500);

    // Select the first matching option
    const option = dialog.getByRole("option", { name: new RegExp(searchText, "i") }).first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    } else {
      // If no match, just click the first option
      const firstOption = dialog.getByRole("option").first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Wait for dialog to close
    await expect(dialog)
      .not.toBeVisible({ timeout: 3000 })
      .catch(() => {});
  }

  // ============================================================================
  // CONTACT INFO TAB FIELDS
  // ============================================================================

  /**
   * Add an email to the contact
   * Handles the JSONB array pattern (click Add button in Email section, then fill popup/row)
   * IMPORTANT: Type must ALWAYS be selected - the form doesn't have a default
   */
  async addEmail(email: string, type: "Work" | "Home" | "Other" = "Work"): Promise<void> {
    await this.clickMainTab();

    // Find the Email addresses section - it's a group with label "Email addresses"
    const emailSection = this.page
      .locator('[role="group"]')
      .filter({ hasText: /email addresses/i })
      .first();

    // Click the Add button inside the email section
    const addButton = emailSection.getByRole("button").first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for email input to appear
    await this.page.waitForTimeout(500); // Let the new row render

    // Find the email input - try various strategies
    let emailInput = this.page.getByPlaceholder(/email/i).first();
    if (!(await emailInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      emailInput = this.page.locator('input[type="email"]').first();
    }
    if (!(await emailInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Try finding textbox that appeared in the email section
      emailInput = emailSection.getByRole("textbox").first();
    }

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(email);

    // ALWAYS select the type - the form doesn't default to anything
    // Find the type selector - it's typically a combobox or select
    const typeCombobox = emailSection.getByRole("combobox").first();
    if (await typeCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeCombobox.click();
      await this.page.getByRole("option", { name: type }).click();
    } else {
      // Try finding by label
      const typeDropdown = this.page.getByLabel(/type/i).first();
      if (await typeDropdown.isVisible({ timeout: 1000 }).catch(() => false)) {
        await typeDropdown.click();
        await this.page.getByRole("option", { name: type }).click();
      }
    }
  }

  /**
   * Fill LinkedIn URL (on More tab)
   */
  async fillLinkedInUrl(url: string): Promise<void> {
    await this.clickMoreTab();
    const input = this.page.getByLabel(/linkedin/i);
    await expect(input).toBeVisible({ timeout: 5000 });
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
   * The Account Manager section is on Main tab with a combobox pattern
   */
  async selectAccountManager(searchText: string): Promise<void> {
    await this.clickMainTab();

    // Find the Account Manager section group containing the combobox
    const acctSection = this.page
      .locator('[role="group"]')
      .filter({ hasText: /account manager/i })
      .first();
    const combobox = acctSection.getByRole("combobox").first();

    // Check if already has a value (useSmartDefaults may have pre-filled)
    const currentValue = await combobox.textContent();
    if (currentValue && currentValue.toLowerCase().includes(searchText.toLowerCase())) {
      // Already selected, no action needed
      return;
    }

    // Click to open and search
    await expect(combobox).toBeVisible({ timeout: 5000 });
    await combobox.click();

    // Type the search text
    await combobox.fill(searchText);

    // Wait for and select the option from dropdown
    await this.page.waitForTimeout(500);
    const option = this.page.getByRole("option", { name: new RegExp(searchText, "i") }).first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    }
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
   * All required fields are on the Main tab
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

    // All required fields are on Main tab
    await this.clickMainTab();

    // Fill identity fields
    await this.fillFirstName(defaults.firstName);
    await this.fillLastName(defaults.lastName);

    // Select organization
    await this.selectOrganization(defaults.organization);

    // Add email
    await this.addEmail(defaults.email);

    // Select account manager (may already be pre-filled by useSmartDefaults)
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
