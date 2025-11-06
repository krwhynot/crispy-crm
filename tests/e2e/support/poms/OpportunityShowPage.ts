import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Opportunity Show/Detail page
 * Handles viewing opportunity details, activity timeline, products, and workflows
 *
 * Required by playwright-e2e-testing skill
 */
export class OpportunityShowPage extends BasePage {
  /**
   * Navigate to opportunity show page
   */
  async goto(opportunityId: number | string): Promise<void> {
    await this.page.goto(`/#/opportunities/${opportunityId}/show`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for opportunity name heading to be visible
    await this.page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
  }

  /**
   * Get opportunity name from heading
   */
  async getOpportunityName(): Promise<string> {
    const heading = this.page.getByRole('heading', { level: 1 });
    return await heading.textContent() || '';
  }

  /**
   * Get edit button
   */
  getEditButton() {
    return this.getButton(/edit/i);
  }

  /**
   * Click edit button
   */
  async clickEdit(): Promise<void> {
    await this.getEditButton().click();
    await this.page.waitForURL(/\/#\/opportunities\/\d+$/);
  }

  /**
   * Get delete button
   */
  getDeleteButton() {
    return this.getButton(/delete/i);
  }

  /**
   * Click delete and confirm
   */
  async clickDeleteAndConfirm(): Promise<void> {
    await this.getDeleteButton().click();

    // Wait for confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|delete/i });
    await confirmButton.waitFor({ state: 'visible' });
    await confirmButton.click();

    // Wait for redirect to list
    await this.page.waitForURL(/\/#\/opportunities/);
  }

  /**
   * Get field value by label
   */
  async getFieldValue(label: string): Promise<string> {
    const field = this.page.getByText(new RegExp(label, 'i')).locator('xpath=following-sibling::*[1]');
    return await field.textContent() || '';
  }

  /**
   * Get stage badge
   */
  getStageBadge() {
    return this.page.locator('[data-testid="stage-badge"]').or(
      this.page.getByText(/stage/i).locator('xpath=following-sibling::*[1]')
    );
  }

  /**
   * Get current stage name
   */
  async getCurrentStage(): Promise<string> {
    const badge = this.getStageBadge();
    return await badge.textContent() || '';
  }

  /**
   * Get workflow section
   */
  getWorkflowSection() {
    return this.page.locator('[data-testid="workflow-section"]').or(
      this.page.getByRole('region', { name: /workflow/i })
    );
  }

  /**
   * Get stage transition buttons
   */
  getStageTransitionButtons() {
    return this.getWorkflowSection().getByRole('button');
  }

  /**
   * Click stage transition button
   */
  async clickStageTransition(buttonText: string): Promise<void> {
    const button = this.getWorkflowSection().getByRole('button', { name: new RegExp(buttonText, 'i') });
    await button.click();

    // Wait for stage update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get products table
   */
  getProductsTable() {
    return this.page.locator('[data-testid="products-table"]').or(
      this.page.getByRole('table').filter({ has: this.page.getByText(/product/i) })
    );
  }

  /**
   * Get product rows
   */
  getProductRows() {
    return this.getProductsTable().getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  /**
   * Get product row by name
   */
  getProductRowByName(productName: string) {
    return this.getProductRows().filter({ hasText: productName });
  }

  /**
   * Verify product exists in table
   */
  async expectProductVisible(productName: string): Promise<void> {
    await expect(this.getProductRowByName(productName)).toBeVisible();
  }

  /**
   * Get activity timeline
   */
  getActivityTimeline() {
    return this.page.locator('[data-testid="activity-timeline"]').or(
      this.page.getByRole('region', { name: /activity|timeline|history/i })
    );
  }

  /**
   * Get activity items
   */
  getActivityItems() {
    return this.getActivityTimeline().locator('[data-testid="activity-item"]').or(
      this.getActivityTimeline().getByRole('listitem')
    );
  }

  /**
   * Get activity item by text
   */
  getActivityItemByText(text: string) {
    return this.getActivityItems().filter({ hasText: text });
  }

  /**
   * Verify activity exists in timeline
   */
  async expectActivityVisible(text: string): Promise<void> {
    await expect(this.getActivityItemByText(text)).toBeVisible();
  }

  /**
   * Add note/activity
   */
  async addNote(noteText: string): Promise<void> {
    // Find add note button or textarea
    const addButton = this.page.getByRole('button', { name: /add note|add activity/i });
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Fill note textarea
    const textarea = this.page.getByRole('textbox', { name: /note|comment/i }).or(
      this.page.getByPlaceholder(/note|comment/i)
    );
    await textarea.fill(noteText);

    // Submit
    const submitButton = this.page.getByRole('button', { name: /save|submit|add/i });
    await submitButton.click();

    // Wait for note to appear
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get organization link
   */
  getOrganizationLink() {
    return this.page.getByText(/organization/i).locator('xpath=following-sibling::*[1]').getByRole('link');
  }

  /**
   * Click organization link
   */
  async clickOrganizationLink(): Promise<void> {
    await this.getOrganizationLink().click();
    await this.page.waitForURL(/\/#\/organizations\/\d+\/show/);
  }

  /**
   * Get principal/owner name
   */
  async getPrincipalName(): Promise<string> {
    const principal = this.page.getByText(/principal|owner|assigned/i).locator('xpath=following-sibling::*[1]');
    return await principal.textContent() || '';
  }

  /**
   * Verify opportunity is in specific stage
   */
  async expectInStage(stageName: string): Promise<void> {
    const badge = this.getStageBadge();
    await expect(badge).toContainText(stageName);
  }

  /**
   * Verify opportunity value/amount
   */
  async expectValue(expectedValue: string): Promise<void> {
    const valueField = this.page.getByText(/value|amount/i).locator('xpath=following-sibling::*[1]');
    await expect(valueField).toContainText(expectedValue);
  }
}
