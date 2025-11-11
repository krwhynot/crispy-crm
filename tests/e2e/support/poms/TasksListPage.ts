import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Tasks List Page Object Model
 * Handles tasks list page interactions
 *
 * Required by playwright-e2e-testing skill
 */
export class TasksListPage extends BasePage {
  /**
   * Navigate to tasks list
   */
  async navigate(): Promise<void> {
    await this.goto("/#/tasks");
    await this.waitForURL(/#\/tasks/);
  }

  /**
   * Click Create button to open create form
   */
  async clickCreate(): Promise<void> {
    const createButton = this.getButton(/create/i);
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();
    await this.waitForURL(/#\/tasks\/create/);
  }

  /**
   * Verify at least one task is visible in the list
   */
  async expectTasksVisible(): Promise<void> {
    // Wait for list to load - tasks should render in rows
    const rows = this.getRow();
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Click on the first task in the list
   */
  async clickFirstTask(): Promise<void> {
    const firstRow = this.getRow().first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    await firstRow.click();
    await this.waitForURL(/\/#\/tasks\/\d+\/show/);
  }

  /**
   * Verify task is NOT visible in the list (for delete verification)
   */
  async expectTaskNotVisible(title: string): Promise<void> {
    // Wait a moment for list to refresh after delete
    await this.page.waitForTimeout(1000);

    const taskText = this.getText(title);
    await expect(taskText).not.toBeVisible({ timeout: 5000 });
  }
}
