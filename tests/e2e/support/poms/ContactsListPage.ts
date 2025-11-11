import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Contacts List Page Object Model
 * Handles interactions with the contacts list/grid
 *
 * Required by playwright-e2e-testing skill
 */
export class ContactsListPage extends BasePage {
  /**
   * Navigate to contacts list
   */
  async navigate(): Promise<void> {
    await this.goto("/#/contacts");

    // Wait for grid to be visible
    await expect(this.getContactsGrid()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get the contacts grid/table
   */
  getContactsGrid() {
    // React Admin uses role="grid" for DataGrid
    return this.page.getByRole("grid").first();
  }

  /**
   * Get all contact rows that contain email addresses
   */
  getContactRows() {
    return this.getRow().filter({ hasText: /@/ });
  }

  /**
   * Click on a contact row by email
   */
  async clickContactByEmail(email: string): Promise<void> {
    const row = this.getRow().filter({ hasText: email });
    await expect(row).toBeVisible({ timeout: 5000 });
    await row.click();

    // Wait for navigation to show page
    await this.waitForURL(/\/#\/contacts\/\d+\/show/);
  }

  /**
   * Click on the first contact in the list
   */
  async clickFirstContact(): Promise<void> {
    const firstRow = this.getContactRows().first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    await firstRow.click();

    // Wait for navigation to show page
    await this.waitForURL(/\/#\/contacts\/\d+\/show/);
  }

  /**
   * Click the Create button
   */
  async clickCreate(): Promise<void> {
    await this.getLink(/create/i).click();

    // Wait for navigation to create page
    await this.waitForURL("/#/contacts/create");
  }

  /**
   * Verify at least one contact is visible
   */
  async expectContactsVisible(): Promise<void> {
    await expect(this.getContactRows().first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify a contact with specific email is NOT visible
   */
  async expectContactNotVisible(email: string): Promise<void> {
    await expect(this.page.getByText(email)).not.toBeVisible();
  }

  /**
   * Verify a contact with specific email IS visible
   */
  async expectContactVisible(email: string): Promise<void> {
    await expect(this.page.getByText(email)).toBeVisible({ timeout: 5000 });
  }
}
