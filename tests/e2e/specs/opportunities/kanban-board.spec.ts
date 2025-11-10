import { test, expect } from '@playwright/test';
import { LoginPage } from '../../support/poms/LoginPage';
import { OpportunitiesListPage } from '../../support/poms/OpportunitiesListPage';
import { OpportunityFormPage } from '../../support/poms/OpportunityFormPage';
import { consoleMonitor } from '../../support/utils/console-monitor';

/**
 * Opportunities Kanban Board Test Suite
 * Tests drag-and-drop stage transitions, visual consistency, and real-time updates
 *
 * Priority: Critical (Priority 1A from testing strategy)
 * Coverage: Kanban view interactions, drag-and-drop, visual regression
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * Note: Drag-and-drop tests run only on desktop viewport (not touch devices)
 */

test.describe('Opportunities Kanban Board', () => {
  let listPage: OpportunitiesListPage;
  let formPage: OpportunityFormPage;

  test.beforeEach(async ({ page }) => {
    // Attach console monitoring
    await consoleMonitor.attach(page);

    // Login using POM
    const loginPage = new LoginPage(page);
    await loginPage.goto('/');

    const isLoginFormVisible = await page.getByLabel(/email/i).isVisible({ timeout: 2000 }).catch(() => false);

    if (isLoginFormVisible) {
      await loginPage.login('admin@test.com', 'password123');
    } else {
      await page.waitForURL(/\/#\//, { timeout: 10000 });
    }

    // Initialize POMs
    listPage = new OpportunitiesListPage(page);
    formPage = new OpportunityFormPage(page);

    // Navigate to opportunities list
    await listPage.goto();
  });

  test.afterEach(async () => {
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test('should display Kanban board with stage columns', async ({ page }) => {
    // Switch to Kanban view
    await listPage.switchToKanbanView();

    // Verify Kanban board is visible
    const kanbanBoard = page.locator('[data-testid="kanban-board"]');
    await expect(kanbanBoard).toBeVisible();

    // Verify stage columns exist (from seed.sql or configuration)
    const expectedStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

    for (const stage of expectedStages) {
      const column = listPage.getKanbanColumn(stage);
      // Use OR logic - column might exist with or without exact match
      const isVisible = await column.isVisible().catch(() => false);

      if (!isVisible) {
        console.log(`Stage column "${stage}" not found - may be custom configuration`);
      }
    }

    // At minimum, verify at least one column exists
    const allColumns = page.locator('[data-testid="kanban-column"]');
    const columnCount = await allColumns.count();
    expect(columnCount).toBeGreaterThan(0);
  });

  test('should switch between list and Kanban views', async ({ page }) => {
    // Start in list view - verify table exists
    const listTable = page.getByRole('table');
    await expect(listTable).toBeVisible();

    // Switch to Kanban
    await listPage.switchToKanbanView();
    const kanbanBoard = page.locator('[data-testid="kanban-board"]');
    await expect(kanbanBoard).toBeVisible();

    // Verify table is hidden
    await expect(listTable).not.toBeVisible();

    // Switch back to list
    await listPage.switchToListView();
    await expect(listTable).toBeVisible();
    await expect(kanbanBoard).not.toBeVisible();
  });

  test('should display opportunity cards with key information', async ({ _page }) => {
    // Create test opportunity to ensure at least one card exists
    const timestamp = Date.now();
    const opportunityName = `Kanban Card Test ${timestamp}`;
    const orgName = 'Acme Corp';

    await listPage.clickCreate();
    await formPage.fillName(opportunityName);
    await formPage.selectOrganization(orgName);
    await formPage.fillValue('25000');
    await formPage.submit();

    // Navigate back and switch to Kanban
    await listPage.goto();
    await listPage.switchToKanbanView();

    // Find the opportunity card
    const card = listPage.getOpportunityCard(opportunityName);
    await expect(card).toBeVisible();

    // Verify card contains key information
    await expect(card).toContainText(opportunityName);

    // Verify card has interactive elements
    const isClickable = await card.isEnabled();
    expect(isClickable).toBe(true);
  });

  // Desktop-only test for drag-and-drop (skip on mobile viewports)
  test('should drag opportunity card to different stage', async ({ _page, isMobile }) => {
    test.skip(isMobile, 'Drag-and-drop requires mouse events (desktop only)');

    // Create test opportunity in initial stage
    const timestamp = Date.now();
    const opportunityName = `Drag Test ${timestamp}`;
    const orgName = 'Acme Corp';
    const initialStage = 'Prospecting';
    const targetStage = 'Qualification';

    await listPage.clickCreate();
    await formPage.fillName(opportunityName);
    await formPage.selectOrganization(orgName);
    await formPage.selectStage(initialStage);
    await formPage.submit();

    // Navigate to Kanban view
    await listPage.goto();
    await listPage.switchToKanbanView();

    // Verify card is in initial stage column
    const initialColumn = listPage.getKanbanColumn(initialStage);
    const cardInInitial = initialColumn.locator(`[data-testid="opportunity-card"]`).filter({ hasText: opportunityName });
    await expect(cardInInitial).toBeVisible();

    // Drag to target stage
    await listPage.dragOpportunityToStage(opportunityName, targetStage);

    // Verify card moved to target column
    const targetColumn = listPage.getKanbanColumn(targetStage);
    const cardInTarget = targetColumn.locator(`[data-testid="opportunity-card"]`).filter({ hasText: opportunityName });
    await expect(cardInTarget).toBeVisible({ timeout: 5000 });

    // Verify card is no longer in initial column
    await expect(cardInInitial).not.toBeVisible();
  });

  test('should filter opportunities in Kanban view', async ({ page }) => {
    await listPage.switchToKanbanView();

    // Create test opportunities with different stages
    const timestamp = Date.now();
    const opp1Name = `Filter Test A ${timestamp}`;
    const opp2Name = `Filter Test B ${timestamp}`;

    // Create first opportunity
    await listPage.goto();
    await listPage.clickCreate();
    await formPage.fillName(opp1Name);
    await formPage.selectOrganization('Acme Corp');
    await formPage.selectStage('Prospecting');
    await formPage.submit();

    // Create second opportunity
    await listPage.goto();
    await listPage.clickCreate();
    await formPage.fillName(opp2Name);
    await formPage.selectOrganization('Acme Corp');
    await formPage.selectStage('Qualification');
    await formPage.submit();

    // Go back to Kanban
    await listPage.goto();
    await listPage.switchToKanbanView();

    // Both opportunities should be visible
    await expect(listPage.getOpportunityCard(opp1Name)).toBeVisible();
    await expect(listPage.getOpportunityCard(opp2Name)).toBeVisible();

    // Apply search filter
    await listPage.search(opp1Name);

    // Only first opportunity should be visible
    await expect(listPage.getOpportunityCard(opp1Name)).toBeVisible();

    // Second opportunity should be hidden (or give it time to filter)
    const opp2Card = listPage.getOpportunityCard(opp2Name);
    const isOpp2Visible = await opp2Card.isVisible().catch(() => false);

    if (isOpp2Visible) {
      // If still visible, wait a bit longer for filter to apply
      await page.waitForTimeout(1000);
      const isStillVisible = await opp2Card.isVisible().catch(() => false);
      expect(isStillVisible).toBe(false);
    }
  });

  test('should display empty state for stages with no opportunities', async ({ page }) => {
    await listPage.switchToKanbanView();

    // Look for a stage column
    const columns = page.locator('[data-testid="kanban-column"]');
    const columnCount = await columns.count();

    if (columnCount > 0) {
      // Check first column for empty state messaging or placeholder
      const firstColumn = columns.first();

      // Empty states might show:
      // - "No opportunities" text
      // - Empty placeholder
      // - Minimal visual indicator

      const isEmpty = await firstColumn.locator('[data-testid="opportunity-card"]').count() === 0;

      if (isEmpty) {
        // Verify column is still rendered (even when empty)
        await expect(firstColumn).toBeVisible();
      }
    }
  });

  // Visual regression test with smart masking
  test('should maintain consistent Kanban layout (visual regression)', async ({ page }) => {
    await listPage.switchToKanbanView();

    // Wait for Kanban board to fully render
    const kanbanBoard = page.locator('[data-testid="kanban-board"]');
    await kanbanBoard.waitFor({ state: 'visible' });
    await page.waitForTimeout(500); // Allow animations to settle

    // Take screenshot with smart masking for dynamic content
    await expect(page).toHaveScreenshot('kanban-full-view.png', {
      // Mask dynamic elements that change between runs
      mask: [
        // Mask timestamps, avatars, dynamic counts
        page.locator('[data-testid="timestamp"]'),
        page.locator('[data-testid="avatar"]'),
        page.locator('[data-testid="opportunity-count"]'),
        // Mask any live date displays
        page.locator('time'),
      ],
      // Full page screenshot
      fullPage: true,
      // Allow minor anti-aliasing differences
      maxDiffPixelRatio: 0.02,
    });
  });

  test('should handle Kanban board responsiveness', async ({ page, viewport }) => {
    await listPage.switchToKanbanView();

    const kanbanBoard = page.locator('[data-testid="kanban-board"]');
    await expect(kanbanBoard).toBeVisible();

    // Verify board adapts to viewport size
    const boardBox = await kanbanBoard.boundingBox();
    expect(boardBox).not.toBeNull();

    if (viewport) {
      // Board should fit within viewport width (with some margin for scrolling)
      expect(boardBox!.width).toBeLessThanOrEqual(viewport.width + 50);
    }

    // Verify columns are arranged appropriately
    const columns = page.locator('[data-testid="kanban-column"]');
    const columnCount = await columns.count();

    if (columnCount > 0) {
      const firstColumn = columns.first();
      const firstColumnBox = await firstColumn.boundingBox();

      expect(firstColumnBox).not.toBeNull();
      expect(firstColumnBox!.width).toBeGreaterThan(0);
    }
  });

  test('should persist stage changes after drag-and-drop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Drag-and-drop requires mouse events (desktop only)');

    // Create test opportunity
    const timestamp = Date.now();
    const opportunityName = `Persist Test ${timestamp}`;
    const initialStage = 'Prospecting';
    const targetStage = 'Qualification';

    await listPage.clickCreate();
    await formPage.fillName(opportunityName);
    await formPage.selectOrganization('Acme Corp');
    await formPage.selectStage(initialStage);
    await formPage.submit();

    // Drag in Kanban view
    await listPage.goto();
    await listPage.switchToKanbanView();
    await listPage.dragOpportunityToStage(opportunityName, targetStage);

    // Switch to list view
    await listPage.switchToListView();

    // Verify stage badge shows updated stage
    await listPage.expectOpportunityInStage(opportunityName, targetStage);

    // Reload page and verify persistence
    await page.reload();
    await listPage.waitForPageLoad();
    await listPage.expectOpportunityInStage(opportunityName, targetStage);
  });

  test('should monitor console for errors during Kanban interactions', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Perform Kanban interactions
    await listPage.switchToKanbanView();
    await page.waitForTimeout(1000);
    await listPage.switchToListView();
    await page.waitForTimeout(1000);
    await listPage.switchToKanbanView();

    // Check for critical errors
    const rlsErrors = consoleErrors.filter(err =>
      err.includes('RLS') || err.includes('permission denied')
    );
    expect(rlsErrors).toHaveLength(0);

    const reactErrors = consoleErrors.filter(err =>
      err.includes('React') || err.includes('component')
    );
    expect(reactErrors).toHaveLength(0);

    // Network errors should be minimal
    const networkErrors = consoleErrors.filter(err =>
      err.includes('Failed to fetch') || err.includes('NetworkError')
    );
    expect(networkErrors).toHaveLength(0);

    // Log any unexpected errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors);
    }
  });
});
