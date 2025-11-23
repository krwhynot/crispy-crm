import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Slide-Over Fixture
 *
 * Encapsulates ResourceSlideOver pattern for design system testing.
 * Provides helpers for URL sync, keyboard support, focus management, and tab switching.
 *
 * Per unified design system rollout plan (lines 1488-1491):
 * - Query-param assertions
 * - ESC/backdrop closing
 * - page.goBack() verification
 * - Focus-trap traversal
 */
export class SlideOverFixture {
  constructor(private readonly page: Page) {}

  /**
   * Get slide-over dialog element
   */
  getDialog(): Locator {
    return this.page.locator('[role="dialog"]');
  }

  /**
   * Get close button (X)
   */
  getCloseButton(): Locator {
    return this.getDialog().getByRole("button", { name: /close/i });
  }

  /**
   * Get edit button
   */
  getEditButton(): Locator {
    return this.getDialog().getByRole("button", { name: /edit/i });
  }

  /**
   * Get cancel button (visible in edit mode)
   */
  getCancelButton(): Locator {
    return this.getDialog().getByRole("button", { name: /cancel/i });
  }

  /**
   * Get save button (visible in edit mode)
   */
  getSaveButton(): Locator {
    return this.getDialog().getByRole("button", { name: /save/i });
  }

  /**
   * Get tab by name
   */
  getTab(name: string): Locator {
    return this.getDialog().getByRole("tab", { name: new RegExp(name, "i") });
  }

  /**
   * Get all tabs
   */
  getTabs(): Locator {
    return this.getDialog().getByRole("tab");
  }

  /**
   * Get active tab panel
   */
  getTabPanel(): Locator {
    return this.getDialog().locator('[role="tabpanel"]');
  }

  /**
   * Assert slide-over is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.getDialog()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert slide-over is closed
   */
  async expectClosed(): Promise<void> {
    await expect(this.getDialog()).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert URL contains expected query param
   * Per plan line 1494: ?view={id} or ?edit={id}
   */
  async expectQueryParam(param: "view" | "edit", value: string | number): Promise<void> {
    const url = this.page.url();
    const urlObj = new URL(url);
    const actualValue = urlObj.searchParams.get(param);

    expect(actualValue, `Expected ?${param}=${value} in URL`).toBe(String(value));
  }

  /**
   * Assert URL does NOT contain slide-over query params
   */
  async expectNoQueryParams(): Promise<void> {
    const url = this.page.url();
    const urlObj = new URL(url);

    expect(urlObj.searchParams.has("view")).toBe(false);
    expect(urlObj.searchParams.has("edit")).toBe(false);
  }

  /**
   * Open slide-over from table row
   */
  async openFromRow(resource: string, rowIndex: number): Promise<{ id: string }> {
    // Navigate to resource if not already there
    if (!this.page.url().includes(`/#/${resource}`)) {
      await this.page.goto(`/#/${resource}`);
      await this.page.waitForLoadState("networkidle");
    }

    // Click row (using tbody to properly exclude header rows)
    const rows = this.page.locator('tbody [role="row"]');
    const row = rows.nth(rowIndex);
    await expect(row).toBeVisible();
    await row.click();

    // Wait for slide-over animation
    await this.page.waitForTimeout(300);

    // Verify slide-over opened
    await this.expectVisible();

    // Extract ID from URL
    const url = this.page.url();
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get("view") || urlObj.searchParams.get("edit") || "0";

    return { id };
  }

  /**
   * Toggle to edit mode
   */
  async toggleMode(targetMode: "view" | "edit"): Promise<void> {
    if (targetMode === "edit") {
      const editButton = this.getEditButton();
      await expect(editButton).toBeVisible();
      await editButton.click();
    } else {
      const cancelButton = this.getCancelButton();
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();
    }

    // Wait for mode transition
    await this.page.waitForTimeout(200);
  }

  /**
   * Press ESC key and verify slide-over closes
   */
  async pressEscapeAndVerifyClosed(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(300); // Animation delay
    await this.expectClosed();
    await this.expectNoQueryParams();
  }

  /**
   * Click close button and verify slide-over closes
   */
  async clickCloseAndVerify(): Promise<void> {
    const closeBtn = this.getCloseButton();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await this.page.waitForTimeout(300);
    await this.expectClosed();
  }

  /**
   * Click backdrop to close slide-over
   * Per plan: "Click backdrop (optional dimmed overlay)" closes slide-over
   */
  async clickBackdrop(): Promise<void> {
    await this.expectVisible();

    // Click outside the dialog (on the backdrop)
    // Get dialog bounds
    const dialog = this.getDialog();
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox, "Dialog not found").not.toBeNull();

    if (dialogBox) {
      // Click 50px to the left of the dialog (on the backdrop)
      await this.page.mouse.click(dialogBox.x - 50, dialogBox.y + 100);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Assert focus returned to specific table row after closing
   * Per plan: "Focus returns to triggering element when closed"
   *
   * @param rowIndex - Expected row index that should receive focus
   */
  async expectFocusReturnedToRow(rowIndex: number): Promise<void> {
    // Get the row that should receive focus
    const expectedRow = this.page.locator('tbody [role="row"]').nth(rowIndex);

    // Get currently focused element
    const focusedElement = await this.page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        role: el?.getAttribute("role"),
        // Check if focused element is within or is the row
        isRow: el?.closest('[role="row"]') !== null || el?.getAttribute("role") === "row",
      };
    });

    // Focus should be on the row or within it
    expect(focusedElement.isRow, `Focus should return to row ${rowIndex} after closing`).toBe(true);

    // Alternative: Check if the expected row or its descendant has focus
    const rowOrDescendantHasFocus = await expectedRow.evaluate((el) => {
      return el === document.activeElement || el.contains(document.activeElement);
    });

    expect(rowOrDescendantHasFocus, `Row ${rowIndex} or its descendant should have focus`).toBe(
      true
    );
  }

  /**
   * Assert focus trap is working (forward Tab direction)
   * Per plan line 1491: Tab/Shift+Tab stays within dialog
   */
  async expectFocusTrap(): Promise<void> {
    await this.expectVisible();

    // Get all focusable elements within dialog
    const dialog = this.getDialog();
    const focusableElements = dialog.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const count = await focusableElements.count();
    expect(count, "Should have focusable elements in slide-over").toBeGreaterThan(0);

    // Focus first element
    await focusableElements.first().focus();

    // Tab through all elements and loop back
    for (let i = 0; i < count + 2; i++) {
      await this.page.keyboard.press("Tab");
      await this.page.waitForTimeout(50);

      // Verify focus is still within dialog
      const isFocusInDialog = await dialog.evaluate((el) => {
        return el.contains(document.activeElement);
      });

      expect(isFocusInDialog, `Focus should stay within slide-over after ${i} tabs`).toBe(true);
    }
  }

  /**
   * Assert reverse focus trap (Shift+Tab direction)
   * Per plan: "section also called for Shift+Tab traversal"
   */
  async expectReverseFocusTrap(): Promise<void> {
    await this.expectVisible();

    const dialog = this.getDialog();
    const focusableElements = dialog.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const count = await focusableElements.count();
    expect(count, "Should have focusable elements in slide-over").toBeGreaterThan(0);

    // Focus last element
    await focusableElements.last().focus();

    // Shift+Tab backward through all elements and loop back
    for (let i = 0; i < count + 2; i++) {
      await this.page.keyboard.press("Shift+Tab");
      await this.page.waitForTimeout(50);

      // Verify focus is still within dialog
      const isFocusInDialog = await dialog.evaluate((el) => {
        return el.contains(document.activeElement);
      });

      expect(isFocusInDialog, `Focus should stay within slide-over after ${i} Shift+Tabs`).toBe(
        true
      );
    }
  }

  /**
   * Assert panel dimensions match spec
   * Per plan lines 313-315: width 40vw (min 480px, max 720px)
   */
  async expectCorrectDimensions(): Promise<void> {
    const dialog = this.getDialog();
    await this.expectVisible();

    const box = await dialog.boundingBox();
    expect(box, "Slide-over bounding box not found").not.toBeNull();

    if (box) {
      const viewport = this.page.viewportSize();
      expect(viewport).not.toBeNull();

      if (viewport) {
        const expectedWidth = Math.min(Math.max(viewport.width * 0.4, 480), 720);

        // Allow 5px tolerance for rounding
        expect(box.width).toBeGreaterThanOrEqual(expectedWidth - 5);
        expect(box.width).toBeLessThanOrEqual(expectedWidth + 5);
      }

      // Should be full height
      expect(box.height).toBeGreaterThan(500);
    }
  }

  /**
   * Assert slide animation
   * Per plan line 315: slides from right with 200ms ease-out
   */
  async expectSlideAnimation(): Promise<void> {
    const dialog = this.getDialog();

    // Check for transform or animation styles
    const hasAnimation = await dialog.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.transition.includes("transform") || styles.transform !== "none";
    });

    expect(hasAnimation, "Slide-over should have slide animation").toBe(true);
  }

  /**
   * Switch tabs and verify content loads
   */
  async switchTab(tabName: string): Promise<void> {
    const tab = this.getTab(tabName);
    await expect(tab).toBeVisible();
    await tab.click();
    await this.page.waitForTimeout(200);

    // Verify tab panel is visible
    const panel = this.getTabPanel();
    await expect(panel).toBeVisible();
  }

  /**
   * Assert all expected tabs are present
   */
  async expectTabs(expectedTabs: string[]): Promise<void> {
    for (const tabName of expectedTabs) {
      const tab = this.getTab(tabName);
      await expect(tab, `Tab "${tabName}" should be visible`).toBeVisible();
    }
  }

  /**
   * Browser back navigation test
   */
  async goBackAndVerifyClosed(): Promise<void> {
    await this.page.goBack();
    await this.page.waitForTimeout(300);
    await this.expectClosed();
    await this.expectNoQueryParams();
  }

  /**
   * Assert ARIA attributes are correct
   * Per plan lines 399-415
   */
  async expectCorrectARIA(): Promise<void> {
    const dialog = this.getDialog();
    await this.expectVisible();

    // Should have role="dialog"
    const role = await dialog.getAttribute("role");
    expect(role).toBe("dialog");

    // Should have aria-modal="true"
    const ariaModal = await dialog.getAttribute("aria-modal");
    expect(ariaModal).toBe("true");

    // Should have aria-labelledby or aria-label
    const hasLabel = await dialog.evaluate((el) => {
      return el.hasAttribute("aria-labelledby") || el.hasAttribute("aria-label");
    });
    expect(hasLabel, "Slide-over should have aria-labelledby or aria-label").toBe(true);
  }
}

/**
 * Factory function to create SlideOverFixture
 */
export function createSlideOver(page: Page): SlideOverFixture {
  return new SlideOverFixture(page);
}
