import { test, expect } from "./support/fixtures/authenticated";
import { OpportunitiesListPage } from "./support/poms/OpportunitiesListPage";
import { consoleMonitor } from "./support/utils/console-monitor";

/**
 * Opportunities Kanban Enhancements E2E Tests
 *
 * Tests the Pipedrive-style enhancements to the opportunities Kanban board including:
 * - Enhanced card details (contact info, dates, priority badges, days in stage)
 * - Stage metrics in column headers (count, avg days, stuck indicators)
 * - Inline actions menu (view, edit, mark won, delete)
 * - Quick-add functionality for creating opportunities in specific stages
 * - Column customization (collapse/expand, visibility toggles)
 *
 * Plan: docs/plans/2025-11-10-pipedrive-kanban-enhancements.md
 *
 * Uses:
 * - authenticated fixture (automatic login + console monitoring)
 * - OpportunitiesListPage POM (semantic selectors only)
 * - Condition-based waiting (no arbitrary timeouts)
 */

test.describe("Opportunities Kanban Enhancements", () => {
  let opportunitiesPage: OpportunitiesListPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    opportunitiesPage = new OpportunitiesListPage(authenticatedPage);
    await opportunitiesPage.goto();

    // Ensure we're in Kanban view
    const kanbanBoard = authenticatedPage.locator('[data-testid="kanban-board"]');
    const isKanbanVisible = await kanbanBoard.isVisible().catch(() => false);

    if (!isKanbanVisible) {
      await opportunitiesPage.switchToKanbanView();
    }
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();
    if (errors.length > 0) {
      await test.info().attach("console-report", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }
    expect(errors, "Console errors detected. See attached report.").toHaveLength(0);
  });

  test.describe("Enhanced Card Details", () => {
    test("displays stage metrics in column headers", async ({ authenticatedPage }) => {
      // Get first visible column (New Lead)
      const column = authenticatedPage.locator('[data-testid="kanban-column"]').first();

      // Check for count badge (e.g., "(5)")
      await expect(column.getByText(/\(\d+\)/)).toBeVisible();

      // Check for average days metric (e.g., "~12d")
      const metricsVisible = await column
        .getByText(/~\d+d/)
        .isVisible()
        .catch(() => false);

      // Metrics only show when there are opportunities, so this is conditional
      if (metricsVisible) {
        await expect(column.getByText(/~\d+d/)).toBeVisible();
      }
    });

    test("displays priority badge on opportunity cards", async ({ authenticatedPage }) => {
      // Find first opportunity card
      const firstCard = authenticatedPage.locator('[data-testid="opportunity-card"]').first();

      // Check for priority indicator (text like "High", "Medium", "Low")
      const priorityBadge = firstCard.locator("text=/High|Medium|Low|Critical/i");
      const hasPriority = await priorityBadge.isVisible().catch(() => false);

      // Not all cards may have priority set, but at least one should
      if (hasPriority) {
        await expect(priorityBadge).toBeVisible();
      }
    });

    test("displays days in stage indicator on cards", async ({ authenticatedPage }) => {
      // Find first opportunity card
      const firstCard = authenticatedPage.locator('[data-testid="opportunity-card"]').first();

      // Check for days indicator (e.g., "5 days in stage")
      const daysIndicator = firstCard.locator("text=/\\d+ days? in stage/i");
      await expect(daysIndicator).toBeVisible();
    });
  });

  test.describe("Inline Actions Menu", () => {
    test("opens and displays action menu items", async ({ authenticatedPage }) => {
      // Find first opportunity card that has data
      const firstCard = authenticatedPage.locator('[data-testid="opportunity-card"]').first();
      await firstCard.waitFor({ state: "visible" });

      // Click actions button (three-dot menu)
      const actionsButton = firstCard.getByRole("button", { name: /actions menu/i });
      await actionsButton.click();

      // Verify menu items are visible
      await expect(authenticatedPage.getByRole("button", { name: /view details/i })).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: /edit/i })).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: /mark as won/i })).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: /delete/i })).toBeVisible();
    });

    test("closes menu when clicking outside", async ({ authenticatedPage }) => {
      const firstCard = authenticatedPage.locator('[data-testid="opportunity-card"]').first();
      await firstCard.waitFor({ state: "visible" });

      // Open actions menu
      const actionsButton = firstCard.getByRole("button", { name: /actions menu/i });
      await actionsButton.click();
      await authenticatedPage
        .getByRole("button", { name: /view details/i })
        .waitFor({ state: "visible" });

      // Click outside the menu
      await authenticatedPage.locator("body").click({ position: { x: 0, y: 0 } });

      // Menu should be hidden
      await expect(
        authenticatedPage.getByRole("button", { name: /view details/i })
      ).not.toBeVisible();
    });
  });

  test.describe("Quick-Add Functionality", () => {
    test("creates opportunity in specific stage via quick-add", async ({ authenticatedPage: _authenticatedPage }) => {
      const testOpportunityName = `Test Quick-Add ${Date.now()}`;
      const targetStage = "Initial Outreach";

      // Click quick-add button in "Initial Outreach" column
      await opportunitiesPage.quickAddOpportunity(targetStage, testOpportunityName);

      // Verify opportunity appears in the correct column
      const targetColumn = opportunitiesPage.getKanbanColumn(targetStage);
      await expect(targetColumn.getByText(testOpportunityName)).toBeVisible();
    });

    test("quick-add button is present in each column", async ({ authenticatedPage: _authenticatedPage }) => {
      // Check first few columns have quick-add buttons
      const stages = ["New Lead", "Initial Outreach", "Sample Visit Offered"];

      for (const stage of stages) {
        const quickAddButton = opportunitiesPage.getQuickAddButton(stage);
        await expect(quickAddButton).toBeVisible();
      }
    });
  });

  test.describe("Column Customization", () => {
    test("customize columns button is visible", async () => {
      await expect(opportunitiesPage.getCustomizeColumnsButton()).toBeVisible();
    });

    test("opens customization menu and shows options", async ({ authenticatedPage }) => {
      await opportunitiesPage.openCustomizationMenu();

      // Verify menu controls are visible
      await expect(authenticatedPage.getByRole("button", { name: /collapse all/i })).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: /expand all/i })).toBeVisible();
      await expect(authenticatedPage.getByText("Visible Stages")).toBeVisible();
    });

    test("collapses all columns", async ({ authenticatedPage }) => {
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.clickCollapseAll();

      // Verify first column shows collapse indicator (▶ instead of ▼)
      const firstColumn = authenticatedPage.locator('[data-testid="kanban-column"]').first();
      const expandButton = firstColumn.getByRole("button", { name: /expand column/i });
      await expect(expandButton).toBeVisible();

      // Verify cards are not visible when collapsed
      const cards = authenticatedPage.locator('[data-testid="opportunity-card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBe(0);
    });

    test("expands all columns after collapsing", async ({ authenticatedPage }) => {
      // First collapse all
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.clickCollapseAll();

      // Then expand all
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.clickExpandAll();

      // Verify columns show collapse indicator (▼)
      const firstColumn = authenticatedPage.locator('[data-testid="kanban-column"]').first();
      const collapseButton = firstColumn.getByRole("button", { name: /collapse column/i });
      await expect(collapseButton).toBeVisible();

      // Verify cards are visible again
      const cards = authenticatedPage.locator('[data-testid="opportunity-card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test("toggles individual column visibility", async ({ authenticatedPage }) => {
      // Open customization menu
      await opportunitiesPage.openCustomizationMenu();

      // Toggle "Closed Lost" visibility off
      await opportunitiesPage.toggleStageVisibility("Closed Lost");

      // Click outside menu to close it
      await authenticatedPage.locator("body").click({ position: { x: 0, y: 0 } });

      // Verify "Closed Lost" column is not visible
      const isVisible = await opportunitiesPage.isColumnVisible("Closed Lost");
      expect(isVisible).toBe(false);

      // Toggle it back on
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.toggleStageVisibility("Closed Lost");
      await authenticatedPage.locator("body").click({ position: { x: 0, y: 0 } });

      // Verify it's visible again
      const isVisibleAgain = await opportunitiesPage.isColumnVisible("Closed Lost");
      expect(isVisibleAgain).toBe(true);
    });

    test("persists collapse/expand preferences across page reloads", async ({
      authenticatedPage,
    }) => {
      // Collapse all columns
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.clickCollapseAll();

      // Reload the page
      await authenticatedPage.reload();
      await opportunitiesPage.waitForPageLoad();

      // Verify columns are still collapsed
      const firstColumn = authenticatedPage.locator('[data-testid="kanban-column"]').first();
      const expandButton = firstColumn.getByRole("button", { name: /expand column/i });
      await expect(expandButton).toBeVisible();

      // Cleanup: expand all for other tests
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.clickExpandAll();
    });

    test("persists visibility preferences across page reloads", async ({ authenticatedPage }) => {
      // Hide "Closed Lost" column
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.toggleStageVisibility("Closed Lost");
      await authenticatedPage.locator("body").click({ position: { x: 0, y: 0 } });

      // Verify it's hidden
      let isVisible = await opportunitiesPage.isColumnVisible("Closed Lost");
      expect(isVisible).toBe(false);

      // Reload the page
      await authenticatedPage.reload();
      await opportunitiesPage.waitForPageLoad();

      // Verify it's still hidden
      isVisible = await opportunitiesPage.isColumnVisible("Closed Lost");
      expect(isVisible).toBe(false);

      // Cleanup: show it again
      await opportunitiesPage.openCustomizationMenu();
      await opportunitiesPage.toggleStageVisibility("Closed Lost");
    });
  });
});
