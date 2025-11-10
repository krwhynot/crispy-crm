import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Task Form Page Object Model
 * Handles both create and edit forms for tasks
 *
 * Required by playwright-e2e-testing skill
 */
export class TaskFormPage extends BasePage {
  /**
   * Fill the task title field
   */
  async fillTitle(title: string): Promise<void> {
    await this.getTextInput(/task title/i).fill(title);
  }

  /**
   * Fill the description field
   */
  async fillDescription(description: string): Promise<void> {
    await this.getTextInput(/description/i).fill(description);
  }

  /**
   * Fill the due date field
   */
  async fillDueDate(date: string): Promise<void> {
    // Format: YYYY-MM-DD
    await this.getTextInput(/due date/i).fill(date);
  }

  /**
   * Select priority from dropdown
   */
  async selectPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    const priorityInput = this.page.getByLabel(/priority/i);
    await priorityInput.click();
    await this.page.getByRole('option', { name: new RegExp(priority, 'i') }).click();
  }

  /**
   * Select task type from dropdown
   */
  async selectType(type: string): Promise<void> {
    const typeInput = this.page.getByLabel(/^type$/i);
    await typeInput.click();
    await this.page.getByRole('option', { name: new RegExp(type, 'i') }).click();
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.getButton(/^save$/i).click();
  }

  /**
   * Fill all required fields for a new task
   */
  async fillTaskForm(data: {
    title: string;
    dueDate: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    type?: string;
    description?: string;
  }): Promise<void> {
    await this.fillTitle(data.title);
    await this.fillDueDate(data.dueDate);

    if (data.priority) {
      await this.selectPriority(data.priority);
    }

    if (data.type) {
      await this.selectType(data.type);
    }

    if (data.description) {
      await this.fillDescription(data.description);
    }
  }

  /**
   * Create a new task with all fields
   */
  async createTask(data: {
    title: string;
    dueDate: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    type?: string;
    description?: string;
  }): Promise<void> {
    await this.fillTaskForm(data);
    await this.submit();

    // Wait for redirect to show page or list
    await this.page.waitForURL(
      (url) =>
        url.hash.includes('/tasks') &&
        (url.hash.includes('/show') || !url.hash.includes('/create')),
      { timeout: 10000 }
    );
  }

  /**
   * Update task fields and submit
   */
  async updateTask(data: {
    title?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    type?: string;
    description?: string;
  }): Promise<void> {
    if (data.title) {
      await this.fillTitle(data.title);
    }
    if (data.dueDate) {
      await this.fillDueDate(data.dueDate);
    }
    if (data.priority) {
      await this.selectPriority(data.priority);
    }
    if (data.type) {
      await this.selectType(data.type);
    }
    if (data.description) {
      await this.fillDescription(data.description);
    }

    await this.submit();

    // Wait for redirect to show page
    await this.waitForURL(/\/#\/tasks\/\d+\/show/);
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
    const expectedURL = isCreate ? '/#/tasks/create' : /\/#\/tasks\/\d+$/;
    await expect(this.page).toHaveURL(expectedURL);
  }
}
