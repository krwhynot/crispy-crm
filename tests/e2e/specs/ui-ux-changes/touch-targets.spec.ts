import { test, expect } from "../../support/fixtures/authenticated";

/**
 * Touch Target Validation E2E Tests
 *
 * Validates 44px minimum touch targets for iPad accessibility (WCAG AA compliance).
 * Tests drag handles, expand/collapse buttons, tab spacing, and general button sizing.
 *
 * Reference: WCAG 2.1 AA Success Criterion 2.5.5 (Target Size)
 * Minimum: 44x44 CSS pixels for touch targets
 */

test.describe("Touch Target Validation (iPad)", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Set iPad viewport (768x1024)
    await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
  });

  test("5.1 Drag Handle - Should be ≥ 44px on Kanban cards", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to opportunities Kanban view
    await page.goto("/#/opportunities");
    await page.waitForLoadState("networkidle");

    // Switch to Kanban view if not already active
    const kanbanViewButton = page.getByRole("button", { name: /kanban/i });
    const isKanbanButtonVisible = await kanbanViewButton.isVisible().catch(() => false);

    if (isKanbanButtonVisible) {
      await kanbanViewButton.click();
      await page.waitForTimeout(500);
    }

    // Find first drag handle on an opportunity card
    const dragHandle = page.locator('[data-testid="drag-handle"]').first();

    // Verify drag handle exists
    const dragHandleExists = await dragHandle.isVisible().catch(() => false);

    if (dragHandleExists) {
      const box = await dragHandle.boundingBox();

      // Assert touch target is at least 44x44px
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    } else {
      // If no drag handles found, log informational message
      console.log("No opportunity cards with drag handles found in Kanban view");
    }
  });

  test("5.2 Expand/Collapse Buttons - Should be ≥ 44px on Kanban cards", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to opportunities Kanban view
    await page.goto("/#/opportunities");
    await page.waitForLoadState("networkidle");

    // Switch to Kanban view if not already active
    const kanbanViewButton = page.getByRole("button", { name: /kanban/i });
    const isKanbanButtonVisible = await kanbanViewButton.isVisible().catch(() => false);

    if (isKanbanButtonVisible) {
      await kanbanViewButton.click();
      await page.waitForTimeout(500);
    }

    // Find expand/collapse toggles on opportunity cards
    const expandToggle = page.locator('[data-expand-toggle]').first();

    // Verify expand toggle exists
    const expandToggleExists = await expandToggle.isVisible().catch(() => false);

    if (expandToggleExists) {
      const box = await expandToggle.boundingBox();

      // Assert touch target is at least 44x44px
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);

      // Verify ARIA attributes
      await expect(expandToggle).toHaveAttribute("aria-expanded", /true|false/);
      await expect(expandToggle).toHaveAttribute("aria-label", /.+/);
    } else {
      // If no expand toggles found, log informational message
      console.log("No opportunity cards with expand toggles found in Kanban view");
    }
  });

  test("5.3 SlideOver Tab Spacing - Should have adequate spacing (gap ≥ 8px)", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to opportunities list
    await page.goto("/#/opportunities");
    await page.waitForLoadState("networkidle");

    // Find and click first opportunity row to open SlideOver
    const opportunityRow = page.getByRole("row").filter({ hasText: /[A-Z]/ }).first();
    const opportunityRowExists = await opportunityRow.isVisible().catch(() => false);

    if (!opportunityRowExists) {
      console.log("No opportunity rows found to test SlideOver");
      return;
    }

    await opportunityRow.click();
    await page.waitForTimeout(500);

    // Verify SlideOver opened (dialog should be visible)
    const slideOverDialog = page.getByRole("dialog");
    await expect(slideOverDialog).toBeVisible();

    // Find TabsList container
    const tabsList = page.locator('[role="tablist"]').first();
    await expect(tabsList).toBeVisible();

    // Get all tab triggers
    const tabTriggers = page.locator('[role="tab"]');
    const tabCount = await tabTriggers.count();

    if (tabCount >= 2) {
      // Measure spacing between first two tabs
      const firstTabBox = await tabTriggers.nth(0).boundingBox();
      const secondTabBox = await tabTriggers.nth(1).boundingBox();

      if (firstTabBox && secondTabBox) {
        // Calculate gap (spacing between tabs)
        const gap = secondTabBox.x - (firstTabBox.x + firstTabBox.width);

        // Assert gap is at least 8px (Tailwind gap-2)
        expect(gap).toBeGreaterThanOrEqual(8);
      }
    } else {
      console.log("Less than 2 tabs found in SlideOver");
    }
  });

  test("5.4 General Touch Target Check - All buttons should be ≥ 44x44px", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to opportunities list
    await page.goto("/#/opportunities");
    await page.waitForLoadState("networkidle");

    // Find all visible buttons on the page
    const buttons = page.getByRole("button");
    const buttonCount = await buttons.count();

    const failingButtons: Array<{ label: string; width: number; height: number }> = [];

    // Check each button's dimensions
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);

      // Skip hidden buttons
      const isVisible = await button.isVisible().catch(() => false);
      if (!isVisible) continue;

      const box = await button.boundingBox();
      if (!box) continue;

      // Check if button meets minimum touch target
      if (box.width < 44 || box.height < 44) {
        const ariaLabel = await button.getAttribute("aria-label");
        const buttonText = await button.textContent();
        const label = ariaLabel || buttonText || `Button #${i}`;

        failingButtons.push({
          label: label.trim(),
          width: Math.round(box.width),
          height: Math.round(box.height),
        });
      }
    }

    // Report any failing buttons
    if (failingButtons.length > 0) {
      console.log("\nButtons failing 44px touch target requirement:");
      failingButtons.forEach((btn) => {
        console.log(`  - "${btn.label}": ${btn.width}x${btn.height}px`);
      });

      // Fail test with detailed message
      expect(
        failingButtons.length,
        `Found ${failingButtons.length} button(s) smaller than 44x44px: ${failingButtons.map((b) => `"${b.label}" (${b.width}x${b.height})`).join(", ")}`
      ).toBe(0);
    }

    // If all buttons pass, assert success
    expect(failingButtons.length).toBe(0);
  });
});
