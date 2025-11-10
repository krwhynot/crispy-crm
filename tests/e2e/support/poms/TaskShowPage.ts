import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Task Show Page Object Model
 * Handles task detail page interactions
 *
 * Required by playwright-e2e-testing skill
 */
export class TaskShowPage extends BasePage {
  /**
   * Verify task page has loaded
   */
  async expectPageLoaded(): Promise<void> {
    await this.waitForURL(/\/#\/tasks\/\d+\/show/);

    // Wait for task title to be visible (indicates page loaded)
    const heading = this.page.getByRole('heading', { level: 2 });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify task is visible with expected data
   */
  async expectTaskVisible(data: {
    title: string;
    priority?: string;
    type?: string;
  }): Promise<void> {
    await this.expectPageLoaded();

    // Verify title is visible
    const titleElement = this.getText(data.title);
    await expect(titleElement).toBeVisible({ timeout: 5000 });

    // Verify priority if provided
    if (data.priority) {
      const priorityBadge = this.getText(new RegExp(data.priority, 'i'));
      await expect(priorityBadge).toBeVisible({ timeout: 5000 });
    }

    // Verify type if provided
    if (data.type) {
      const typeText = this.getText(new RegExp(data.type, 'i'));
      await expect(typeText).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Verify task title is visible
   */
  async expectTitleVisible(title: string): Promise<void> {
    const titleElement = this.getText(title);
    await expect(titleElement).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify task description is visible
   */
  async expectDescriptionVisible(description: string): Promise<void> {
    const descElement = this.getText(description);
    await expect(descElement).toBeVisible({ timeout: 5000 });
  }

  /**
   * Click Edit button to open edit form
   */
  async clickEdit(): Promise<void> {
    const editButton = this.getButton(/edit/i);
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await this.waitForURL(/\/#\/tasks\/\d+$/);
  }

  /**
   * Delete the task
   */
  async deleteTask(): Promise<void> {
    // Click delete button
    const deleteButton = this.getButton(/delete/i);
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    // Confirm deletion in dialog
    // React Admin uses a confirmation dialog
    const confirmButton = this.page
      .getByRole('button', { name: /confirm/i })
      .or(this.page.getByRole('button', { name: /delete/i }));

    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Wait for redirect to list
    await this.waitForURL(/#\/tasks$/);
  }

  /**
   * Verify completed badge is visible
   */
  async expectCompletedBadgeVisible(): Promise<void> {
    const completedBadge = this.getText(/completed/i);
    await expect(completedBadge).toBeVisible({ timeout: 5000 });
  }
}
