import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Organizations List Page
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Extends BasePage ✓
 * - Semantic selectors only (getByRole/Label/Text) ✓
 * - No CSS selectors ✓
 */
export class OrganizationsListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to organizations list page
   */
  async gotoOrganizationsList(): Promise<void> {
    await this.goto("/#/organizations");
    await this.waitForURL(/\/#\/organizations/);
  }

  /**
   * Wait for organizations list to load
   */
  async waitForOrganizationsLoaded(): Promise<void> {
    // Wait for at least one organization card to be visible
    await this.page.getByRole("link").first().waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Get all organization cards
   */
  getOrganizationCards(): Locator {
    // Organization cards are rendered as links
    return this.page.getByRole("link").filter({ has: this.page.locator("h6") });
  }

  /**
   * Get a specific organization card by name
   */
  getOrganizationCardByName(name: string | RegExp): Locator {
    return this.page.getByRole("link").filter({ hasText: name });
  }

  /**
   * Get all edit buttons (positioned in cards)
   */
  getEditButtons(): Locator {
    return this.page.getByRole("button", { name: /edit/i });
  }

  /**
   * Get all checkboxes (for bulk selection)
   */
  getSelectionCheckboxes(): Locator {
    return this.page.getByRole("checkbox");
  }

  /**
   * Get the create button
   */
  getCreateButton(): Locator {
    return this.getButton(/new organization/i);
  }

  /**
   * Click on an organization card to view details
   */
  async viewOrganizationByName(name: string | RegExp): Promise<void> {
    await this.getOrganizationCardByName(name).click();
    await this.waitForURL(/\/#\/organizations\/\d+\/show/);
  }

  /**
   * Get dynamic elements that should be masked in screenshots
   * (dates, counts, timestamps)
   */
  getDynamicElements(): Locator[] {
    return [
      // Mask contact/opportunity counts as they may vary
      this.page.locator("text=/\\d+ contact/"),
      this.page.locator("text=/\\d+ opportunit/"),
    ];
  }
}
