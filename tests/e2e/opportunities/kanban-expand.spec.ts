import { test, expect } from "@playwright/test";
import { OpportunitiesListPage } from "../support/poms/OpportunitiesListPage";

/**
 * E2E tests for expandable Kanban cards with visual cues
 *
 * Tests the expand/collapse behavior and visual indicators:
 * - Activity pulse dot (color indicates recency)
 * - Expand/collapse toggle with aria-expanded
 * - Expanded details (days in stage, tasks, priority, etc.)
 *
 * Uses Page Object Model per `tests/e2e/README.md` standards
 */
test.describe("Kanban Card Expand/Collapse", () => {
  let opportunitiesPage: OpportunitiesListPage;

  test.beforeEach(async ({ page }) => {
    opportunitiesPage = new OpportunitiesListPage(page);
    await opportunitiesPage.goto();

    // IMPORTANT: Ensure we're in Kanban view (user's localStorage may have "list" preference)
    // The POM's waitForPageLoad handles both views, but we need Kanban specifically
    await opportunitiesPage.switchToKanbanView();
  });

  test("should expand card to show full details", async () => {
    // Get name of first card to interact with
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Card should be collapsed initially
    const isExpandedBefore = await opportunitiesPage.isCardExpanded(cardName!);
    expect(isExpandedBefore).toBe(false);

    // Expand the card
    await opportunitiesPage.expandCard(cardName!);

    // Verify expanded
    const isExpandedAfter = await opportunitiesPage.isCardExpanded(cardName!);
    expect(isExpandedAfter).toBe(true);

    // Details should be visible
    await opportunitiesPage.expectExpandedDetailsVisible(cardName!);

    // Collapse the card
    await opportunitiesPage.collapseCard(cardName!);

    // Verify collapsed
    const isExpandedFinal = await opportunitiesPage.isCardExpanded(cardName!);
    expect(isExpandedFinal).toBe(false);
  });

  test("should show activity pulse dot with semantic color", async () => {
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Verify pulse dot has valid color class
    await opportunitiesPage.expectActivityPulseValid(cardName!);
  });

  test("should show task count when expanded", async () => {
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Expand the card
    await opportunitiesPage.expandCard(cardName!);

    // At minimum, days in stage should always be visible
    await opportunitiesPage.expectExpandedDetailsVisible(cardName!);
  });

  // === ADDITIONAL COVERAGE for visual cues (success criteria) ===

  test("should show activity pulse color thresholds correctly", async ({ page }) => {
    // This test verifies the pulse color logic is working
    // We check multiple cards if available to get coverage of different states
    const cards = page.locator('[data-testid="opportunity-card"]');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      test.skip(); // No cards to test
      return;
    }

    // Check first 5 cards (or less if fewer exist)
    const cardsToCheck = Math.min(cardCount, 5);
    for (let i = 0; i < cardsToCheck; i++) {
      const card = cards.nth(i);
      const pulseDot = card.getByRole("status");

      // Each pulse dot should be visible and have a valid color class
      await expect(pulseDot).toBeVisible();

      const classList = await pulseDot.getAttribute("class");
      const hasValidColor =
        classList?.includes("bg-success") || // <7 days (green)
        classList?.includes("bg-warning") || // 7-14 days (yellow)
        classList?.includes("bg-destructive") || // >14 days (red)
        classList?.includes("bg-muted-foreground"); // null/no activity (gray)

      expect(hasValidColor).toBe(true);
    }
  });

  test("should toggle expand state on button click without triggering drag", async ({ page }) => {
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    const card = opportunitiesPage.getOpportunityCard(cardName!);
    const expandButton = card.getByRole("button", { name: /expand|collapse/i });

    // Record initial position
    const cardBox = await card.boundingBox();
    expect(cardBox).toBeTruthy();
    const initialY = cardBox!.y;

    // Click expand button (should NOT trigger drag)
    await expandButton.click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify card didn't move (drag wasn't triggered)
    const cardBoxAfter = await card.boundingBox();
    expect(cardBoxAfter).toBeTruthy();
    // Y position should be the same (or very close - accounting for animation)
    expect(Math.abs(cardBoxAfter!.y - initialY)).toBeLessThan(5);

    // Verify it actually expanded
    const isExpanded = await opportunitiesPage.isCardExpanded(cardName!);
    expect(isExpanded).toBe(true);
  });

  test("should show priority badge when expanded", async () => {
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Expand the card
    await opportunitiesPage.expandCard(cardName!);

    // Priority badge should be visible (Low, Medium, High, or Critical)
    const card = opportunitiesPage.getOpportunityCard(cardName!);
    const priorityBadge = card.getByText(/^(Low|Medium|High|Critical)$/);
    await expect(priorityBadge).toBeVisible();
  });

  test("should show close date when expanded", async () => {
    const cardName = await opportunitiesPage.getFirstCardName();
    expect(cardName).toBeTruthy();

    // Expand the card
    await opportunitiesPage.expandCard(cardName!);

    // Close date should be visible (format: "MMM d, yyyy" or "No date set")
    const card = opportunitiesPage.getOpportunityCard(cardName!);
    // Look for either a date or "No date set"
    const hasCloseDate = await card.locator("text=/\\w{3} \\d{1,2}, \\d{4}|No date set/").count();
    expect(hasCloseDate).toBeGreaterThan(0);
  });
});
