import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * List Page Fixture
 *
 * Encapsulates StandardListLayout pattern for design system testing.
 * Provides helpers for filter sidebar, table interactions, and layout assertions.
 *
 * Per unified design system rollout plan (lines 1488-1491):
 * - Filter sidebar selectors (data-testid="filter-sidebar")
 * - Helper assertions like expectSidebarWidth(256)
 * - Premium hover state validation
 */
export class ListPageFixture {
  constructor(
    private readonly page: Page,
    private readonly resource: string
  ) {}

  /**
   * Navigate to resource list page
   */
  async navigate(): Promise<void> {
    await this.page.goto(`/#/${this.resource}`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get filter sidebar element
   * Per plan line 1490: Use data-testid="filter-sidebar" for determinism
   */
  getFilterSidebar(): Locator {
    return this.page.locator('[data-testid="filter-sidebar"]').first();
  }

  /**
   * Get main content area (table container)
   */
  getMainContent(): Locator {
    return this.page.locator('[role="main"]').first();
  }

  /**
   * Get all table rows (excluding header row)
   *
   * CRITICAL: <tr> elements never contain <thead>, so hasNot: thead doesn't work.
   * Instead, we filter out rows that are descendants of <thead>.
   */
  getTableRows(): Locator {
    // Get all rows, then filter out header rows using getByRole with tbody context
    return this.page.locator('tbody [role="row"]');
  }

  /**
   * Get table row by index
   */
  getTableRow(index: number): Locator {
    return this.getTableRows().nth(index);
  }

  /**
   * Assert filter sidebar has correct width (256px)
   */
  async expectSidebarWidth(expectedWidth: number = 256): Promise<void> {
    const sidebar = this.getFilterSidebar();
    const box = await sidebar.boundingBox();

    expect(box, "Filter sidebar not found").not.toBeNull();

    if (box) {
      // Allow 2px tolerance for border/rounding
      expect(box.width).toBeGreaterThanOrEqual(expectedWidth - 2);
      expect(box.width).toBeLessThanOrEqual(expectedWidth + 2);
    }
  }

  /**
   * Assert sidebar is sticky (stays visible when scrolling)
   */
  async expectSidebarSticky(): Promise<void> {
    const sidebar = this.getFilterSidebar();
    const initialBox = await sidebar.boundingBox();

    expect(initialBox).not.toBeNull();

    // Scroll down
    await this.page.evaluate(() => window.scrollBy(0, 500));
    await this.page.waitForTimeout(100);

    const afterScrollBox = await sidebar.boundingBox();
    expect(afterScrollBox).not.toBeNull();

    // Y position should not change (sticky)
    if (initialBox && afterScrollBox) {
      expect(afterScrollBox.y).toBeLessThanOrEqual(initialBox.y + 10);
    }
  }

  /**
   * Assert premium hover effects on table rows
   * Per plan lines 1493-1495: border-color transitions, transform matrix lift
   */
  async expectPremiumHoverEffects(rowIndex: number = 0): Promise<void> {
    const row = this.getTableRow(rowIndex);
    await expect(row).toBeVisible();

    // Get initial computed styles
    const initialStyles = await row.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      };
    });

    // Hover over row
    await row.hover();
    await this.page.waitForTimeout(200); // Wait for transition

    // Get hover styles
    const hoverStyles = await row.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        transform: styles.transform,
      };
    });

    // Border should change on hover (not transparent)
    expect(hoverStyles.borderColor).not.toBe(initialStyles.borderColor);

    // Shadow should be added on hover
    expect(hoverStyles.boxShadow).not.toBe(initialStyles.boxShadow);
    expect(hoverStyles.boxShadow).not.toBe("none");

    // Transform should include translation (lift effect)
    expect(hoverStyles.transform).toContain("matrix");
  }

  /**
   * Assert layout matches StandardListLayout spec
   * Per plan lines 45-107: filter sidebar + main content area
   */
  async expectStandardLayout(): Promise<void> {
    const sidebar = this.getFilterSidebar();
    const main = this.getMainContent();

    await expect(sidebar).toBeVisible();
    await expect(main).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();

    expect(sidebarBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    if (sidebarBox && mainBox) {
      // Sidebar should be to the left of main content
      expect(sidebarBox.x).toBeLessThan(mainBox.x);

      // Sidebar and main should be roughly aligned vertically
      expect(Math.abs(sidebarBox.y - mainBox.y)).toBeLessThan(50);

      // Main content should be wider than sidebar
      expect(mainBox.width).toBeGreaterThan(sidebarBox.width);
    }
  }

  /**
   * Assert card container styling
   * Per plan lines 654-657: bg-card, border, shadow-sm, rounded-xl
   */
  async expectCardContainer(): Promise<void> {
    const cardContainer = this.page.locator('.card-container').first();
    await expect(cardContainer).toBeVisible();

    const styles = await cardContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        boxShadow: computed.boxShadow,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Should have border radius (rounded-xl)
    expect(styles.borderRadius).not.toBe("0px");

    // Should have shadow
    expect(styles.boxShadow).not.toBe("none");

    // Should have background color (bg-card)
    expect(styles.backgroundColor).not.toBe("transparent");
  }

  /**
   * Click a table row to open slide-over
   */
  async clickRow(index: number = 0): Promise<void> {
    const row = this.getTableRow(index);
    await expect(row).toBeVisible();
    await row.click();

    // Wait for slide-over animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Assert no horizontal scrolling
   */
  async expectNoHorizontalScroll(): Promise<void> {
    const bodyWidth = await this.page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await this.page.viewportSize()?.width || 0;

    // Allow 5px tolerance for browser rounding
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  }
}

/**
 * Factory function to create ListPageFixture
 */
export function createListPage(page: Page, resource: string): ListPageFixture {
  return new ListPageFixture(page, resource);
}
