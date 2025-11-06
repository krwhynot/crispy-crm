import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Opportunities List page
 * Handles list view interactions, filtering, and Kanban board
 *
 * Required by playwright-e2e-testing skill
 */
export class OpportunitiesListPage extends BasePage {
  /**
   * Navigate to opportunities list
   */
  async goto(): Promise<void> {
    await this.page.goto('/#/opportunities');
    await this.waitForPageLoad();
  }

  /**
   * Wait for list to load
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for either list view or Kanban view to be visible
    await Promise.race([
      this.page.getByRole('table').waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
      this.page.locator('[data-testid="kanban-board"]').waitFor({ state: 'visible', timeout: 10000 }).catch(() => null),
    ]);
  }

  /**
   * Get create button
   */
  getCreateButton() {
    // Accept both button and link roles for flexibility
    return this.page.getByRole('button', { name: /create|new opportunity/i }).or(
      this.page.getByRole('link', { name: /create|new opportunity/i })
    );
  }

  /**
   * Click create button
   */
  async clickCreate(): Promise<void> {
    await this.getCreateButton().click();
    await this.page.waitForURL(/\/#\/opportunities\/create/);
  }

  /**
   * Search for opportunities
   */
  async search(query: string): Promise<void> {
    const searchInput = this.page.getByRole('searchbox').or(
      this.page.getByPlaceholder(/search/i)
    );
    await searchInput.fill(query);
    // Wait for search to update results
    await this.page.waitForTimeout(500);
  }

  /**
   * Get all opportunity rows in list view
   */
  getOpportunityRows() {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  /**
   * Get opportunity row by name
   */
  getOpportunityRowByName(name: string) {
    return this.page.getByRole('row').filter({ hasText: name });
  }

  /**
   * Click on opportunity to view details
   */
  async viewOpportunity(name: string): Promise<void> {
    const row = this.getOpportunityRowByName(name);
    await row.getByRole('link').first().click();
    await this.page.waitForURL(/\/#\/opportunities\/\d+\/show/);
  }

  /**
   * Switch to Kanban view
   */
  async switchToKanbanView(): Promise<void> {
    // Look for view switcher button
    const kanbanButton = this.page.getByRole('button', { name: /kanban|board/i });
    await kanbanButton.click();
    await this.page.locator('[data-testid="kanban-board"]').waitFor({ state: 'visible' });
  }

  /**
   * Switch to list view
   */
  async switchToListView(): Promise<void> {
    const listButton = this.page.getByRole('button', { name: /list|table/i });
    await listButton.click();
    await this.page.getByRole('table').waitFor({ state: 'visible' });
  }

  /**
   * Get Kanban column by stage name
   */
  getKanbanColumn(stageName: string) {
    return this.page.locator('[data-testid="kanban-column"]').filter({ hasText: new RegExp(stageName, 'i') });
  }

  /**
   * Get opportunity card in Kanban view
   */
  getOpportunityCard(opportunityName: string) {
    return this.page.locator('[data-testid="opportunity-card"]').filter({ hasText: opportunityName });
  }

  /**
   * Drag opportunity card to different stage
   * @param opportunityName - Name of the opportunity to drag
   * @param targetStage - Target stage name
   */
  async dragOpportunityToStage(opportunityName: string, targetStage: string): Promise<void> {
    const card = this.getOpportunityCard(opportunityName);
    const targetColumn = this.getKanbanColumn(targetStage);

    // Get bounding boxes for drag operation
    const cardBox = await card.boundingBox();
    const columnBox = await targetColumn.boundingBox();

    if (!cardBox || !columnBox) {
      throw new Error(`Could not get bounding boxes for drag operation`);
    }

    // Perform drag and drop using mouse actions
    await this.page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + 100, { steps: 10 });
    await this.page.mouse.up();

    // Wait for update to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Apply filter
   */
  async applyFilter(filterName: string, value: string): Promise<void> {
    // Open filters if not visible
    const filterButton = this.page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // Select filter value
    const filterInput = this.page.getByLabel(new RegExp(filterName, 'i'));
    await filterInput.click();
    await this.page.getByRole('option', { name: new RegExp(value, 'i') }).click();

    // Wait for results to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Get count of opportunities in list
   */
  async getOpportunityCount(): Promise<number> {
    const rows = this.getOpportunityRows();
    return await rows.count();
  }

  /**
   * Verify opportunity exists in list
   */
  async expectOpportunityVisible(name: string): Promise<void> {
    await expect(this.getOpportunityRowByName(name)).toBeVisible();
  }

  /**
   * Verify opportunity does not exist in list
   */
  async expectOpportunityNotVisible(name: string): Promise<void> {
    await expect(this.getOpportunityRowByName(name)).not.toBeVisible();
  }

  /**
   * Get stage badge for an opportunity in list view
   */
  getOpportunityStageBadge(opportunityName: string) {
    return this.getOpportunityRowByName(opportunityName).locator('[data-testid="stage-badge"]');
  }

  /**
   * Verify opportunity is in specific stage
   */
  async expectOpportunityInStage(opportunityName: string, stageName: string): Promise<void> {
    const stageBadge = this.getOpportunityStageBadge(opportunityName);
    await expect(stageBadge).toContainText(stageName);
  }
}
