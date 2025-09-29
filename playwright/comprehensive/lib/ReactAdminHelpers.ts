import { Page, expect } from '@playwright/test';

/**
 * ReactAdminHelpers - React Admin specific patterns and utilities
 *
 * Handles:
 * - CreateButton, SaveButton, EditButton patterns
 * - DataGrid and list view navigation
 * - Form submission and validation
 * - Notification detection
 * - Async operation waiting
 */

export class ReactAdminHelpers {
  constructor(private page: Page) {}

  /**
   * Click the Create button (React Admin standard)
   */
  async clickCreateButton(): Promise<void> {
    const createButton = this.page.getByTestId('create-button');
    await expect(createButton).toBeVisible({ timeout: 15000 });
    await createButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click Save button and wait for response
   */
  async clickSaveButton(): Promise<void> {
    const saveButton = this.page.getByRole('button', { name: /save|create/i });
    await saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for success notification
   */
  async waitForSuccessNotification(): Promise<boolean> {
    try {
      const notification = this.page.locator('[role="alert"], .MuiSnackbar-root, .sonner-toast');
      await expect(notification).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fill autocomplete input
   */
  async fillAutocomplete(name: string, value: string): Promise<void> {
    const input = this.page.locator(`input[name="${name}"][role="combobox"]`);
    await input.fill(value);
    await this.page.waitForTimeout(500); // Wait for dropdown

    // Click first option
    const option = this.page.locator(`[role="option"]`).first();
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click();
    }
  }

  /**
   * Navigate to a module
   */
  async navigateToModule(moduleName: string): Promise<void> {
    await this.page.getByText(moduleName, { exact: true }).click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveURL(new RegExp(moduleName.toLowerCase()));
  }

  /**
   * Check if we're on a list view
   */
  async isListView(): Promise<boolean> {
    const createButton = this.page.getByTestId('create-button');
    return await createButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if we're on a create/edit form
   */
  async isFormView(): Promise<boolean> {
    const saveButton = this.page.getByRole('button', { name: /save|create/i });
    return await saveButton.isVisible({ timeout: 2000 }).catch(() => false);
  }
}