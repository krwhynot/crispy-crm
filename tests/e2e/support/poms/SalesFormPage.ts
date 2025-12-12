import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import {
  waitForFormReady,
  clickSaveAndWait,
  expectFieldError,
  expectFormNotSubmitted,
  expectFormSubmitted,
} from "./FormTestHelpers";

/**
 * Sales Form Page Object Model
 * Handles both slide-over edit mode and create forms for sales users
 *
 * Form Tabs:
 * - Profile: First Name, Last Name, Email, Phone, Avatar
 * - Permissions: Role, Administrator, Disabled status
 *
 * Required by playwright-e2e-testing skill
 */
export class SalesFormPage extends BasePage {
  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Navigate to sales create form
   */
  async gotoCreate(): Promise<void> {
    await this.goto("/#/sales/create");
    await waitForFormReady(this.page);
  }

  /**
   * Navigate to sales edit form (via slide-over)
   */
  async gotoEdit(userId: number | string): Promise<void> {
    await this.goto(`/#/sales?view=${userId}`);
    await this.waitForSlideOver();
  }

  /**
   * Wait for slide-over to appear
   */
  async waitForSlideOver(): Promise<void> {
    const slideOver = this.page.locator('[data-testid="slide-over"]').or(
      this.page.locator('.slideOver, [role="dialog"]')
    );
    await expect(slideOver.first()).toBeVisible({ timeout: 5000 });
  }

  // ============================================================================
  // TAB NAVIGATION (for slide-over)
  // ============================================================================

  /**
   * Click the Profile tab
   */
  async clickProfileTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /profile/i }).click();
  }

  /**
   * Click the Permissions tab
   */
  async clickPermissionsTab(): Promise<void> {
    await this.page.getByRole("tab", { name: /permissions/i }).click();
  }

  // ============================================================================
  // PROFILE TAB FIELDS
  // ============================================================================

  /**
   * Fill the first name field
   */
  async fillFirstName(value: string): Promise<void> {
    const input = this.page.getByLabel(/first.*name/i);
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(value);
  }

  /**
   * Fill the last name field
   */
  async fillLastName(value: string): Promise<void> {
    const input = this.page.getByLabel(/last.*name/i);
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(value);
  }

  /**
   * Fill the email field
   */
  async fillEmail(value: string): Promise<void> {
    const input = this.page.getByLabel(/email/i);
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(value);
  }

  /**
   * Fill the phone field
   */
  async fillPhone(value: string): Promise<void> {
    const input = this.page.getByLabel(/phone/i);
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(value);
  }

  /**
   * Fill the avatar URL field
   */
  async fillAvatarUrl(value: string): Promise<void> {
    const input = this.page.getByLabel(/avatar/i);
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(value);
  }

  /**
   * Get the first name input
   */
  getFirstNameInput(): Locator {
    return this.page.getByLabel(/first.*name/i);
  }

  /**
   * Get the last name input
   */
  getLastNameInput(): Locator {
    return this.page.getByLabel(/last.*name/i);
  }

  /**
   * Get the email input
   */
  getEmailInput(): Locator {
    return this.page.getByLabel(/email/i);
  }

  // ============================================================================
  // PERMISSIONS TAB FIELDS
  // ============================================================================

  /**
   * Select role from dropdown
   */
  async selectRole(role: "admin" | "manager" | "rep"): Promise<void> {
    await this.clickPermissionsTab();

    // Find and click the role select trigger
    const select = this.page.getByLabel(/role/i);
    await expect(select).toBeVisible({ timeout: 5000 });
    await select.click();

    // Wait for dropdown to open and select option
    await this.page.waitForTimeout(300);
    const option = this.page.getByRole("option", { name: new RegExp(role, "i") });
    await expect(option).toBeVisible({ timeout: 3000 });
    await option.click();
  }

  /**
   * Get the role select element
   */
  getRoleSelect(): Locator {
    return this.page.getByLabel(/role/i);
  }

  /**
   * Toggle disabled status
   */
  async toggleDisabled(): Promise<void> {
    await this.clickPermissionsTab();

    // Find the disabled switch by its label
    const disabledSwitch = this.page.getByLabel(/account status|disabled/i);
    await expect(disabledSwitch).toBeVisible({ timeout: 5000 });
    await disabledSwitch.click();
  }

  /**
   * Set disabled status to a specific value
   */
  async setDisabled(disabled: boolean): Promise<void> {
    await this.clickPermissionsTab();

    const disabledSwitch = this.page.getByLabel(/account status|disabled/i);
    const isCurrentlyDisabled = await disabledSwitch.isChecked();

    if (isCurrentlyDisabled !== disabled) {
      await disabledSwitch.click();
    }
  }

  /**
   * Toggle administrator access
   */
  async toggleAdministrator(): Promise<void> {
    await this.clickPermissionsTab();

    // Administrator is controlled by role = admin
    const adminSwitch = this.page.getByLabel(/administrator/i);
    await expect(adminSwitch).toBeVisible({ timeout: 5000 });
    await adminSwitch.click();
  }

  // ============================================================================
  // FORM ACTIONS
  // ============================================================================

  /**
   * Click Save button (works for both create and edit forms)
   */
  async clickSave(): Promise<void> {
    const saveBtn = this.page.getByRole("button", { name: /save/i });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
  }

  /**
   * Click Save & Close button
   */
  async clickSaveAndClose(): Promise<void> {
    const saveBtn = this.page.getByRole("button", { name: /save.*close/i });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
  }

  /**
   * Click Cancel button
   */
  async clickCancel(): Promise<void> {
    const cancelBtn = this.page.getByRole("button", { name: /cancel/i });
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.click();
  }

  /**
   * Click Delete/Remove button
   */
  async clickDelete(): Promise<void> {
    const deleteBtn = this.page.getByRole("button", { name: /delete|remove user/i });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();
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
    await this.clickSave();
    // Wait briefly for validation to run
    await this.page.waitForTimeout(500);
  }

  // ============================================================================
  // CONFIRMATION DIALOG (for self-demotion warning and delete)
  // ============================================================================

  /**
   * Check if confirmation dialog is visible
   */
  async isConfirmDialogVisible(): Promise<boolean> {
    const dialog = this.page.getByRole("dialog").or(
      this.page.getByRole("alertdialog")
    );
    return dialog.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Confirm action in dialog
   */
  async confirmAction(): Promise<void> {
    // Wait for dialog to appear
    await expect(this.page.getByRole("alertdialog")).toBeVisible({ timeout: 3000 });

    // Click confirm button (various names)
    const confirmBtn = this.page.getByRole("button", { name: /confirm|yes|ok|remove user/i });
    await expect(confirmBtn).toBeVisible({ timeout: 3000 });
    await confirmBtn.click();
  }

  /**
   * Cancel confirmation dialog
   */
  async cancelConfirmation(): Promise<void> {
    const cancelBtn = this.page.getByRole("button", { name: /cancel|no/i });
    await expect(cancelBtn).toBeVisible({ timeout: 3000 });
    await cancelBtn.click();
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Get error message element
   */
  getErrorMessage(): Locator {
    return this.page.locator('[role="alert"], .error-message, .text-destructive').first();
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return this.getErrorMessage().isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get error text
   */
  async getErrorText(): Promise<string> {
    const error = this.getErrorMessage();
    if (await error.isVisible({ timeout: 1000 }).catch(() => false)) {
      return (await error.textContent()) || "";
    }
    return "";
  }

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
   * Assert email error is shown
   */
  async expectEmailError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "email", message);
  }

  /**
   * Assert role error is shown
   */
  async expectRoleError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "role", message);
  }

  // ============================================================================
  // VALIDATION ASSERTIONS
  // ============================================================================

  /**
   * Assert we're still on the create form (validation prevented submission)
   */
  async expectStillOnCreateForm(): Promise<void> {
    await expectFormNotSubmitted(this.page, "sales");
  }

  /**
   * Assert form was submitted successfully
   */
  async expectFormSuccess(): Promise<void> {
    await expectFormSubmitted(this.page, "sales");
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Fill all required profile fields
   */
  async fillRequiredProfileFields(options: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }): Promise<void> {
    await this.clickProfileTab();

    await this.fillFirstName(options.firstName);
    await this.fillLastName(options.lastName);
    await this.fillEmail(options.email);

    if (options.phone) {
      await this.fillPhone(options.phone);
    }
  }

  /**
   * Create a new user with all required fields
   */
  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role?: "admin" | "manager" | "rep";
  }): Promise<void> {
    await this.fillRequiredProfileFields({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });

    if (data.role) {
      await this.selectRole(data.role);
    }

    await this.clickSaveAndClose();

    // Wait for redirect to list or show page
    await this.waitForURL(/\/#\/sales/);
  }

  /**
   * Update user profile fields
   */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }): Promise<void> {
    await this.clickProfileTab();

    if (data.firstName) {
      await this.fillFirstName(data.firstName);
    }
    if (data.lastName) {
      await this.fillLastName(data.lastName);
    }
    if (data.email) {
      await this.fillEmail(data.email);
    }
    if (data.phone !== undefined) {
      await this.fillPhone(data.phone);
    }

    await this.submit();
  }

  /**
   * Update user permissions
   */
  async updatePermissions(data: {
    role?: "admin" | "manager" | "rep";
    disabled?: boolean;
  }): Promise<void> {
    await this.clickPermissionsTab();

    if (data.role) {
      await this.selectRole(data.role);
    }
    if (data.disabled !== undefined) {
      await this.setDisabled(data.disabled);
    }

    await this.submit();
  }
}
