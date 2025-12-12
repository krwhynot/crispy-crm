import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Sales List Page Object Model
 * Handles interactions with the Sales/Team Management list page
 *
 * Required by playwright-e2e-testing skill
 */
export class SalesListPage extends BasePage {
  /**
   * Navigate to sales/team list
   */
  async navigate(): Promise<void> {
    await this.goto("/#/sales");

    // Wait for grid to be visible
    await expect(this.getSalesGrid()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get the sales grid/table
   */
  getSalesGrid(): Locator {
    // React Admin uses role="grid" for DataGrid
    return this.page.getByRole("grid").first();
  }

  /**
   * Get all user rows
   */
  getUserRows(): Locator {
    return this.getRow().filter({ has: this.page.getByRole("gridcell") });
  }

  /**
   * Get user row by name (first or last name)
   */
  getUserRow(name: string): Locator {
    return this.getRow().filter({ hasText: new RegExp(name, "i") });
  }

  /**
   * Get user row by email
   */
  getUserRowByEmail(email: string): Locator {
    return this.getRow().filter({ hasText: email });
  }

  /**
   * Click on a user row to open slide-over
   */
  async clickUser(name: string): Promise<void> {
    const row = this.getUserRow(name);
    await expect(row).toBeVisible({ timeout: 5000 });
    await row.click();

    // Wait for slide-over to appear
    await this.waitForSlideOver();
  }

  /**
   * Click on a user by email to open slide-over
   */
  async clickUserByEmail(email: string): Promise<void> {
    const row = this.getUserRowByEmail(email);
    await expect(row).toBeVisible({ timeout: 5000 });
    await row.click();

    // Wait for slide-over to appear
    await this.waitForSlideOver();
  }

  /**
   * Click the first user in the list
   */
  async clickFirstUser(): Promise<void> {
    const firstRow = this.getUserRows().first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    await firstRow.click();

    // Wait for slide-over to appear
    await this.waitForSlideOver();
  }

  /**
   * Wait for slide-over to appear
   */
  async waitForSlideOver(): Promise<void> {
    // Multiple strategies to detect slide-over
    const slideOver = this.page.locator('[data-testid="slide-over"]').or(
      this.page.locator('.slideOver, [role="dialog"]')
    );
    await expect(slideOver.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Click the Create button
   */
  async clickCreate(): Promise<void> {
    const createButton = this.getLink(/create|new user/i);
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Wait for navigation to create page
    await this.waitForURL("/#/sales/create");
  }

  /**
   * Get the Create button
   */
  getCreateButton(): Locator {
    return this.getLink(/create|new user/i);
  }

  /**
   * Check if a user is visible in the list
   */
  async isUserVisible(name: string): Promise<boolean> {
    return this.getUserRow(name).isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Get count of users in list
   */
  async getUserCount(): Promise<number> {
    const rows = this.getUserRows();
    return await rows.count();
  }

  /**
   * Verify user is visible
   */
  async expectUserVisible(name: string): Promise<void> {
    await expect(this.getUserRow(name)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify user is NOT visible
   */
  async expectUserNotVisible(name: string): Promise<void> {
    await expect(this.getUserRow(name)).not.toBeVisible();
  }

  /**
   * Verify user with email is visible
   */
  async expectUserByEmailVisible(email: string): Promise<void> {
    await expect(this.getUserRowByEmail(email)).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get role badge for a user
   */
  getUserRoleBadge(name: string): Locator {
    return this.getUserRow(name).getByText(/admin|manager|rep/i);
  }

  /**
   * Get status badge for a user
   */
  getUserStatusBadge(name: string): Locator {
    return this.getUserRow(name).getByText(/active|disabled/i);
  }

  /**
   * Verify user has a specific role
   */
  async expectUserHasRole(name: string, role: "admin" | "manager" | "rep"): Promise<void> {
    const roleBadge = this.getUserRoleBadge(name);
    await expect(roleBadge).toContainText(new RegExp(role, "i"));
  }

  /**
   * Verify user has a specific status
   */
  async expectUserHasStatus(name: string, status: "active" | "disabled"): Promise<void> {
    const statusBadge = this.getUserStatusBadge(name);
    await expect(statusBadge).toContainText(new RegExp(status, "i"));
  }

  /**
   * Search for users
   */
  async search(query: string): Promise<void> {
    const searchInput = this.page.getByRole("searchbox").or(
      this.page.getByPlaceholder(/search/i)
    );
    await searchInput.fill(query);
    // Wait for search to update results
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify at least one user is visible
   */
  async expectUsersVisible(): Promise<void> {
    await expect(this.getUserRows().first()).toBeVisible({ timeout: 5000 });
  }
}
