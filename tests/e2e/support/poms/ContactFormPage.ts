import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Contact Form Page Object Model
 * Handles both create and edit forms for contacts
 *
 * Required by playwright-e2e-testing skill
 */
export class ContactFormPage extends BasePage {
  /**
   * Fill the first name field
   */
  async fillFirstName(firstName: string): Promise<void> {
    await this.getTextInput(/first name/i).fill(firstName);
  }

  /**
   * Fill the last name field
   */
  async fillLastName(lastName: string): Promise<void> {
    await this.getTextInput(/last name/i).fill(lastName);
  }

  /**
   * Fill the title field
   */
  async fillTitle(title: string): Promise<void> {
    await this.getTextInput(/^title$/i).fill(title);
  }

  /**
   * Add an email to the contact
   * Handles the JSONB array pattern (click Add, then fill)
   */
  async addEmail(email: string, type: 'Work' | 'Home' = 'Work'): Promise<void> {
    // Find and click the Add button for email section
    // React Admin SimpleFormIterator uses "Add" button
    const addButton = this.getButton(/add/i).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for the email input to appear
    const emailInput = this.getTextInput(/email/i).first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(email);

    // Note: Type selection would use getByLabel for the type dropdown
    // For now, default "Work" is used from schema
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.getButton(/^save$/i).click();
  }

  /**
   * Fill all required fields for a new contact
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
   * Create a new contact with all fields
   */
  async createContact(data: {
    firstName: string;
    lastName: string;
    email: string;
    title?: string;
  }): Promise<void> {
    await this.fillContactForm(data);
    await this.submit();

    // Wait for redirect to show page
    await this.waitForURL(/\/#\/contacts\/\d+\/show/);
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
      await this.fillFirstName(data.firstName);
    }
    if (data.lastName) {
      await this.fillLastName(data.lastName);
    }
    if (data.title) {
      await this.fillTitle(data.title);
    }

    await this.submit();

    // Wait for redirect to show page
    await this.waitForURL(/\/#\/contacts\/\d+\/show/);
  }

  /**
   * Attempt to submit form (for validation testing)
   */
  async attemptSubmit(): Promise<void> {
    await this.getButton(/^save$/i).click();

    // Wait briefly for validation to run
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify we're still on the form (validation prevented submission)
   */
  async expectStillOnForm(isCreate: boolean): Promise<void> {
    const expectedURL = isCreate ? '/#/contacts/create' : /\/#\/contacts\/\d+$/;
    await expect(this.page).toHaveURL(expectedURL);
  }
}
