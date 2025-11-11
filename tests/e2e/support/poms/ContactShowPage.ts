import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Contact Show Page Object Model
 * Handles interactions with the contact details page
 *
 * Required by playwright-e2e-testing skill
 */
export class ContactShowPage extends BasePage {
  /**
   * Click the Edit button
   */
  async clickEdit(): Promise<void> {
    // React Admin uses a link with "Edit" text
    await this.getLink(/edit/i).click();

    // Wait for navigation to edit page
    await this.waitForURL(/\/#\/contacts\/\d+$/);
  }

  /**
   * Click the Delete button
   */
  async clickDelete(): Promise<void> {
    await this.getButton(/delete/i).click();
  }

  /**
   * Confirm deletion in the dialog
   */
  async confirmDelete(): Promise<void> {
    // Wait for confirmation dialog to appear
    const confirmButton = this.getButton(/confirm|delete/i).last();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Wait for redirect to list
    await this.waitForURL("/#/contacts");
  }

  /**
   * Delete the contact (click delete + confirm)
   */
  async deleteContact(): Promise<void> {
    await this.clickDelete();
    await this.confirmDelete();
  }

  /**
   * Verify contact name is visible
   */
  async expectNameVisible(firstName: string, lastName: string): Promise<void> {
    const fullName = `${firstName} ${lastName}`;
    await expect(this.getText(fullName)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify contact email is visible
   */
  async expectEmailVisible(email: string): Promise<void> {
    await expect(this.getText(email)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify contact title is visible
   */
  async expectTitleVisible(title: string): Promise<void> {
    await expect(this.getText(title)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify contact details are visible
   */
  async expectContactVisible(data: {
    firstName: string;
    lastName: string;
    email: string;
    title?: string;
  }): Promise<void> {
    await this.expectNameVisible(data.firstName, data.lastName);
    await this.expectEmailVisible(data.email);

    if (data.title) {
      await this.expectTitleVisible(data.title);
    }
  }

  /**
   * Verify heading is visible (indicates page loaded)
   */
  async expectPageLoaded(): Promise<void> {
    const heading = this.page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  }
}
