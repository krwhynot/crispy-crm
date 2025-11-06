import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Opportunity Create/Edit forms
 * Handles form interactions for creating and editing opportunities
 *
 * Required by playwright-e2e-testing skill
 */
export class OpportunityFormPage extends BasePage {
  /**
   * Navigate to create page
   */
  async gotoCreate(): Promise<void> {
    await this.page.goto('/#/opportunities/create');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to edit page
   */
  async gotoEdit(opportunityId: number | string): Promise<void> {
    await this.page.goto(`/#/opportunities/${opportunityId}`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for form to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.getByRole('form').or(this.page.locator('form')).waitFor({ state: 'visible' });
  }

  /**
   * Fill opportunity name
   */
  async fillName(name: string): Promise<void> {
    await this.getTextInput(/opportunity name/i).fill(name);
  }

  /**
   * Select organization
   */
  async selectOrganization(orgName: string): Promise<void> {
    // Find combobox button by text content since React Admin doesn't always use proper label association
    // Look for the section containing "Customer Organization" text, then find the combobox within it
    const section = this.page.locator(':text("Customer Organization")').locator('..').locator('..');
    const comboboxButton = section.getByRole('combobox');

    // Click to open the dropdown
    await comboboxButton.click();

    // Wait for the actual input field to appear in the opened dropdown/dialog
    const searchInput = this.page.getByRole('textbox', { name: /search/i }).or(
      this.page.locator('input[type="text"]').filter({ has: this.page.locator(':text("Search")') })
    ).or(
      this.page.locator('input[type="text"]').last()
    );
    await searchInput.waitFor({ state: 'visible', timeout: 3000 });
    await searchInput.fill(orgName);

    // Wait for autocomplete options
    await this.page.waitForTimeout(500);

    // Select from dropdown - use first match to avoid "Create..." option and duplicates
    const option = this.page.getByRole('option', { name: new RegExp(`^${orgName}$`, 'i') }).first();
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  /**
   * Select principal/owner
   */
  async selectPrincipal(principalName: string): Promise<void> {
    // Find combobox button by text content since React Admin doesn't always use proper label association
    const section = this.page.locator(':text("Principal Organization")').locator('..').locator('..');
    const comboboxButton = section.getByRole('combobox');

    // Click to open the dropdown
    await comboboxButton.click();

    // Wait for the actual input field to appear in the opened dropdown/dialog
    const searchInput = this.page.getByRole('textbox', { name: /search/i }).or(
      this.page.locator('input[type="text"]').filter({ has: this.page.locator(':text("Search")') })
    ).or(
      this.page.locator('input[type="text"]').last()
    );
    await searchInput.waitFor({ state: 'visible', timeout: 3000 });
    await searchInput.fill(principalName);

    // Wait for autocomplete options
    await this.page.waitForTimeout(500);

    // Select from dropdown - use first match to avoid "Create..." option and duplicates
    const option = this.page.getByRole('option', { name: new RegExp(`^${principalName}$`, 'i') }).first();
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  /**
   * Select stage
   */
  async selectStage(stageName: string): Promise<void> {
    const stageInput = this.page.getByLabel(/stage/i);
    await stageInput.click();

    // Select from dropdown
    const option = this.page.getByRole('option', { name: new RegExp(stageName, 'i') });
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  /**
   * Fill value/amount
   */
  async fillValue(value: string): Promise<void> {
    await this.getTextInput(/value|amount/i).fill(value);
  }

  /**
   * Fill probability
   */
  async fillProbability(probability: string): Promise<void> {
    await this.getTextInput(/probability/i).fill(probability);
  }

  /**
   * Fill expected close date
   */
  async fillExpectedCloseDate(date: string): Promise<void> {
    const dateInput = this.page.getByLabel(/expected.*close|close.*date/i);
    await dateInput.fill(date);
  }

  /**
   * Fill description
   */
  async fillDescription(description: string): Promise<void> {
    const descInput = this.page.getByLabel(/description|notes/i).or(
      this.page.getByRole('textbox', { name: /description/i })
    );
    await descInput.fill(description);
  }

  /**
   * Add product to opportunity
   */
  async addProduct(productName: string, quantity?: string): Promise<void> {
    // Click add product button
    const addButton = this.page.getByRole('button', { name: /add product/i });
    await addButton.click();

    // Fill product details
    const productInput = this.page.getByLabel(/product/i).last();
    await productInput.click();
    await productInput.fill(productName);

    // Wait for autocomplete
    await this.page.waitForTimeout(500);

    // Select from dropdown
    const option = this.page.getByRole('option', { name: new RegExp(productName, 'i') });
    await option.waitFor({ state: 'visible' });
    await option.click();

    // Fill quantity if provided
    if (quantity) {
      const quantityInput = this.page.getByLabel(/quantity/i).last();
      await quantityInput.fill(quantity);
    }
  }

  /**
   * Get save button
   */
  getSaveButton() {
    return this.getButton(/save|create/i);
  }

  /**
   * Get cancel button
   */
  getCancelButton() {
    return this.getButton(/cancel/i);
  }

  /**
   * Submit form (save)
   */
  async submit(): Promise<void> {
    await this.getSaveButton().click();

    // Wait for either redirect to show page or list
    await Promise.race([
      this.page.waitForURL(/\/#\/opportunities\/\d+\/show/, { timeout: 10000 }),
      this.page.waitForURL(/\/#\/opportunities$/, { timeout: 10000 }),
    ]);
  }

  /**
   * Cancel form
   */
  async cancel(): Promise<void> {
    await this.getCancelButton().click();
    await this.page.waitForURL(/\/#\/opportunities/);
  }

  /**
   * Fill complete opportunity form with all required fields
   */
  async fillCompleteForm(data: {
    name: string;
    organization: string;
    principal?: string;
    stage?: string;
    value?: string;
    probability?: string;
    expectedCloseDate?: string;
    description?: string;
    products?: Array<{ name: string; quantity?: string }>;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.selectOrganization(data.organization);

    if (data.principal) {
      await this.selectPrincipal(data.principal);
    }

    if (data.stage) {
      await this.selectStage(data.stage);
    }

    if (data.value) {
      await this.fillValue(data.value);
    }

    if (data.probability) {
      await this.fillProbability(data.probability);
    }

    if (data.expectedCloseDate) {
      await this.fillExpectedCloseDate(data.expectedCloseDate);
    }

    if (data.description) {
      await this.fillDescription(data.description);
    }

    if (data.products) {
      for (const product of data.products) {
        await this.addProduct(product.name, product.quantity);
      }
    }
  }

  /**
   * Select contact(s) from autocomplete
   */
  async selectContact(contactName: string): Promise<void> {
    //  Find the Contacts section combobox
    const contactsSection = this.page.locator(':text("Contacts")').locator('..').locator('..');
    const combobox = contactsSection.getByRole('combobox').last(); // Use last to get the actual input, not just the label

    // Click to open the dropdown
    await combobox.click();

    // Wait for suggestions to load
    await this.page.waitForTimeout(500);

    // Type the contact name to filter
    await combobox.fill(contactName);
    await this.page.waitForTimeout(500);

    // Select from dropdown - use first match
    const option = this.page.getByRole('option', { name: new RegExp(contactName, 'i') }).first();
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.click();
  }

  /**
   * Create opportunity with minimal ACTUALLY required fields
   *
   * IMPORTANT: This creates an opportunity with the minimum fields required by validation:
   * - name (provided)
   * - customer_organization_id (provided via organization param)
   * - principal_organization_id (defaults to 'Wicks' from seed data)
   * - contact_ids with at least 1 contact (creates inline if none available)
   * - estimated_close_date (has default in schema)
   *
   * NOTE: Products are OPTIONAL per the validation schema (line 149-154 in opportunities.ts)
   * NOTE: Since seed data has contacts with NULL organization_id, we create a test contact inline
   */
  async createOpportunity(name: string, organization: string, principalOrg: string = 'Wicks'): Promise<void> {
    await this.fillName(name);
    await this.selectOrganization(organization);
    await this.selectPrincipal(principalOrg);

    // Wait for contacts section to become active
    await this.page.waitForTimeout(1000);

    // Create a test contact inline using the "New Contact" button
    // This is necessary because seed data contacts have NULL organization_id
    const newContactButton = this.page.getByRole('button', { name: /new contact/i });
    await newContactButton.waitFor({ state: 'visible', timeout: 3000 });
    await newContactButton.click();

    // Wait for the contact creation dialog to open
    await this.page.waitForTimeout(500);

    // Fill minimal contact fields (first_name is required)
    const timestamp = Date.now();
    const firstNameInput = this.page.getByLabel(/first.*name/i);
    await firstNameInput.waitFor({ state: 'visible', timeout: 3000 });
    await firstNameInput.fill(`TestContact${timestamp}`);

    // Submit the contact (this auto-adds it to the opportunity)
    const saveContactButton = this.page.getByRole('button', { name: /save/i }).last();
    await saveContactButton.click();

    // Wait for contact to be added
    await this.page.waitForTimeout(1000);

    await this.submit();
  }

  /**
   * Verify validation error appears
   */
  async expectValidationError(fieldLabel: string): Promise<void> {
    // Look for error message near the field
    const fieldContainer = this.page.getByLabel(new RegExp(fieldLabel, 'i')).locator('xpath=ancestor::div[contains(@class, "field") or contains(@class, "form")]');
    const errorMessage = fieldContainer.locator('[role="alert"], .error, [class*="error"]');
    await expect(errorMessage).toBeVisible();
  }

  /**
   * Verify form field has value
   */
  async expectFieldValue(fieldLabel: string, expectedValue: string): Promise<void> {
    const field = this.page.getByLabel(new RegExp(fieldLabel, 'i'));
    await expect(field).toHaveValue(expectedValue);
  }
}
