import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import {
  waitForFormReady,
  clickSaveAndWait,
  expectFieldError,
  expectFormNotSubmitted,
  expectFormSubmitted,
  selectFromDropdown,
  uniqueTestData,
} from "./FormTestHelpers";

/**
 * Organization Form Page Object Model
 * Handles both create and edit forms for organizations
 *
 * Form Structure:
 * - Main tab: name*, organization_type*, sales_id, segment_id, street, city, state, zip
 * - More tab: website, linkedin_url, description, parent_organization_id
 *
 * Validation Requirements (from organizationSchema):
 * - name: Required (min 1 char)
 * - website: Must be valid URL with protocol (http/https) - OPTIONAL
 * - linkedin_url: Must be valid LinkedIn URL - OPTIONAL
 * - organization_type: enum (customer, prospect, principal, distributor) - defaults to "prospect"
 *
 * Required by playwright-e2e-testing skill
 */
export class OrganizationFormPage extends BasePage {
  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Navigate to organization create form
   */
  async gotoCreate(): Promise<void> {
    await this.goto("/#/organizations/create");
    await waitForFormReady(this.page);
  }

  /**
   * Navigate to organization edit form
   */
  async gotoEdit(orgId: number | string): Promise<void> {
    await this.goto(`/#/organizations/${orgId}`);
    await waitForFormReady(this.page);
  }

  // ============================================================================
  // TAB NAVIGATION
  // ============================================================================

  /**
   * Click the Main tab (contains: name, type, sales, segment, address fields)
   */
  async clickMainTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /main/i }).click();
  }

  /**
   * Click the More tab (contains: website, linkedin, description, parent org)
   */
  async clickMoreTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /more/i }).click();
  }

  // ============================================================================
  // MAIN TAB FIELDS
  // ============================================================================

  /**
   * Fill the organization name field
   */
  async fillName(name: string): Promise<void> {
    await this.clickMainTab();
    // Label is "Name *" with asterisk for required
    const input = this.page.getByLabel(/^name/i);
    await expect(input).toBeVisible();
    await input.fill(name);
  }

  /**
   * Get the name input
   */
  getNameInput(): Locator {
    return this.page.getByLabel(/^name/i);
  }

  /**
   * Select organization type
   */
  async selectOrganizationType(
    type: "customer" | "prospect" | "principal" | "distributor"
  ): Promise<void> {
    await this.clickMainTab();
    await selectFromDropdown(this.page, /organization type/i, new RegExp(type, "i"));
  }

  /**
   * Fill street address
   */
  async fillStreet(street: string): Promise<void> {
    await this.clickMainTab();
    const input = this.page.getByLabel(/street/i);
    await expect(input).toBeVisible();
    await input.fill(street);
  }

  /**
   * Fill city
   */
  async fillCity(city: string): Promise<void> {
    await this.clickMainTab();
    const input = this.page.getByLabel(/city/i);
    await expect(input).toBeVisible();
    await input.fill(city);
  }

  /**
   * Select state from dropdown
   */
  async selectState(stateCode: string): Promise<void> {
    await this.clickMainTab();
    await selectFromDropdown(this.page, /state/i, new RegExp(stateCode, "i"));
  }

  /**
   * Fill zip code
   */
  async fillZip(zip: string): Promise<void> {
    await this.clickMainTab();
    const input = this.page.getByLabel(/zip/i);
    await expect(input).toBeVisible();
    await input.fill(zip);
  }

  // ============================================================================
  // MORE TAB FIELDS
  // ============================================================================

  /**
   * Fill website URL
   */
  async fillWebsite(url: string): Promise<void> {
    await this.clickMoreTab();
    const input = this.page.getByLabel(/website/i);
    await expect(input).toBeVisible();
    await input.fill(url);
  }

  /**
   * Fill LinkedIn URL
   */
  async fillLinkedInUrl(url: string): Promise<void> {
    await this.clickMoreTab();
    const input = this.page.getByLabel(/linkedin/i);
    await expect(input).toBeVisible();
    await input.fill(url);
  }

  /**
   * Fill description
   */
  async fillDescription(description: string): Promise<void> {
    await this.clickMoreTab();
    const input = this.page.getByLabel(/description/i);
    await expect(input).toBeVisible();
    await input.fill(description);
  }

  // ============================================================================
  // FORM ACTIONS
  // ============================================================================

  /**
   * Click Create Organization button (with duplicate check)
   *
   * Note: The form has a duplicate check that runs on click.
   * We wait for either:
   * 1. Duplicate dialog to appear
   * 2. Navigation away from create page
   * 3. Network activity to settle (for API call completion)
   */
  async clickCreateOrganization(): Promise<void> {
    const button = this.page.getByRole("button", { name: /create organization/i });
    await expect(button).toBeVisible();
    await button.click();

    // Wait for duplicate check and/or form submission
    // First wait a bit for the async duplicate check to complete
    await this.page.waitForTimeout(500);

    // Wait for network to settle (form submission or duplicate check API call)
    await this.page.waitForLoadState("networkidle", { timeout: 15000 });
  }

  /**
   * Click Save button (for edit forms)
   */
  async clickSave(): Promise<void> {
    const button = this.page.getByRole("button", { name: /save/i });
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
   * Submit the form
   */
  async submit(): Promise<void> {
    await clickSaveAndWait(this.page);
  }

  /**
   * Attempt to submit form (for validation testing)
   */
  async attemptSubmit(): Promise<void> {
    await this.clickCreateOrganization();
    // Wait briefly for validation to run
    await this.page.waitForTimeout(500);
  }

  // ============================================================================
  // DUPLICATE DIALOG INTERACTIONS
  // ============================================================================

  /**
   * Check if duplicate warning dialog is visible
   *
   * Looks for the specific duplicate dialog by its title text
   */
  async isDuplicateDialogVisible(): Promise<boolean> {
    // Wait a moment for the async duplicate check to potentially complete
    await this.page.waitForTimeout(1000);

    // Look for the specific dialog title
    const dialogTitle = this.page.getByRole("heading", { name: /potential duplicate/i });
    return await dialogTitle.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Click "Create Anyway" in duplicate dialog
   */
  async clickProceedAnyway(): Promise<void> {
    const button = this.page.getByRole("button", { name: /create anyway/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();

    // Wait for dialog to close and action to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Click "Change Name" in duplicate dialog (to go back and edit)
   */
  async clickCancelDuplicate(): Promise<void> {
    const dialog = this.page.getByRole("alertdialog");
    const cancelButton = dialog.getByRole("button", { name: /change name/i });
    await expect(cancelButton).toBeVisible({ timeout: 3000 });
    await cancelButton.click();

    // Wait for dialog to close
    await this.page.waitForTimeout(500);
  }

  // ============================================================================
  // VALIDATION ASSERTIONS
  // ============================================================================

  /**
   * Assert name error is shown
   */
  async expectNameError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "name", message);
  }

  /**
   * Assert website error is shown
   */
  async expectWebsiteError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "website", message);
  }

  /**
   * Assert LinkedIn URL error is shown
   */
  async expectLinkedInError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "linkedin", message);
  }

  /**
   * Assert address error is shown
   */
  async expectAddressError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "address", message);
  }

  /**
   * Assert we're still on the create form (validation prevented submission)
   */
  async expectStillOnCreateForm(): Promise<void> {
    await expectFormNotSubmitted(this.page, "organizations");
  }

  /**
   * Assert form was submitted successfully
   */
  async expectFormSuccess(): Promise<void> {
    await expectFormSubmitted(this.page, "organizations");
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Fill required fields for a valid organization
   */
  async fillRequiredFields(options?: { name?: string }): Promise<void> {
    const defaults = {
      name: options?.name || uniqueTestData("Test Org"),
    };

    await this.fillName(defaults.name);
  }

  /**
   * Create a new organization with all fields and submit
   */
  async createOrganization(data: {
    name: string;
    type?: "customer" | "prospect" | "principal" | "distributor";
    website?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }): Promise<void> {
    await this.fillName(data.name);

    if (data.type) {
      await this.selectOrganizationType(data.type);
    }
    if (data.website) {
      await this.fillWebsite(data.website);
    }
    if (data.street) {
      await this.fillStreet(data.street);
    }
    if (data.city) {
      await this.fillCity(data.city);
    }
    if (data.state) {
      await this.selectState(data.state);
    }
    if (data.zip) {
      await this.fillZip(data.zip);
    }

    await this.clickCreateOrganization();

    // Handle potential duplicate dialog
    if (await this.isDuplicateDialogVisible()) {
      await this.clickProceedAnyway();
    }

    // Wait for redirect to show page
    await this.waitForURL(/\/#\/organizations\/\d+\/show/);
  }

  /**
   * Fill organization form without submitting
   */
  async fillOrganizationForm(data: {
    name: string;
    type?: "customer" | "prospect" | "principal" | "distributor";
    website?: string;
  }): Promise<void> {
    await this.fillName(data.name);

    if (data.type) {
      await this.selectOrganizationType(data.type);
    }
    if (data.website) {
      await this.fillWebsite(data.website);
    }
  }
}
