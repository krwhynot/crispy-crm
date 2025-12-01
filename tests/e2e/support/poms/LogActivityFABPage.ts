import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * LogActivityFAB Page Object Model
 *
 * Handles interactions with the Log Activity FAB and Sheet on Dashboard V3.
 * Uses semantic selectors following playwright-e2e-testing skill.
 *
 * Key features tested:
 * - FAB click opens Sheet slide-over
 * - Draft persistence in localStorage
 * - Warning badge when draft exists
 * - ARIA accessibility attributes
 * - Focus management on Sheet close
 */
export class LogActivityFABPage extends BasePage {
  // LocalStorage key for draft (must match component)
  private readonly DRAFT_STORAGE_KEY = "principal-dashboard-log-activity-draft";

  // =============================================================================
  // FAB LOCATORS
  // =============================================================================

  /**
   * Get the Log Activity FAB button
   */
  getFAB(): Locator {
    return this.page.getByRole("button", { name: /log activity/i });
  }

  /**
   * Get the draft badge indicator on the FAB
   * This is the pulsing warning dot that appears when a draft exists
   */
  getDraftBadge(): Locator {
    // The badge is a span with animate-pulse class inside the FAB button
    return this.getFAB().locator("span.animate-pulse");
  }

  // =============================================================================
  // SHEET LOCATORS
  // =============================================================================

  /**
   * Get the Sheet dialog container
   */
  getSheet(): Locator {
    return this.page.getByRole("dialog");
  }

  /**
   * Get the Sheet title
   */
  getSheetTitle(): Locator {
    return this.page.getByRole("heading", { name: /log activity/i });
  }

  /**
   * Get the Sheet description
   */
  getSheetDescription(): Locator {
    return this.page.getByText(/quick capture for calls, meetings, and notes/i);
  }

  /**
   * Get the Sheet close button (X button in top right)
   */
  getSheetCloseButton(): Locator {
    return this.getSheet().getByRole("button", { name: /close/i });
  }

  /**
   * Get the loading skeleton (shown while QuickLogForm loads)
   */
  getFormSkeleton(): Locator {
    return this.page.getByTestId("quick-log-form-skeleton");
  }

  // =============================================================================
  // FORM LOCATORS (within Sheet)
  // =============================================================================

  /**
   * Get the Activity Type select trigger
   */
  getActivityTypeSelect(): Locator {
    return this.getSheet().getByLabel("Activity Type").locator("..").getByRole("combobox");
  }

  /**
   * Get the Outcome select trigger
   */
  getOutcomeSelect(): Locator {
    return this.getSheet().getByLabel("Outcome").locator("..").getByRole("combobox");
  }

  /**
   * Get the Contact combobox trigger
   */
  getContactCombobox(): Locator {
    return this.getSheet().getByLabel("Contact *").locator("..").getByRole("combobox");
  }

  /**
   * Get the Organization combobox trigger
   */
  getOrganizationCombobox(): Locator {
    return this.getSheet().getByLabel("Organization *").locator("..").getByRole("combobox");
  }

  /**
   * Get the Notes textarea
   */
  getNotesTextarea(): Locator {
    return this.getSheet().getByLabel("Notes").locator("..").getByRole("textbox");
  }

  /**
   * Get the Cancel button
   */
  getCancelButton(): Locator {
    return this.getSheet().getByRole("button", { name: /cancel/i });
  }

  /**
   * Get the Save & Close button
   */
  getSaveAndCloseButton(): Locator {
    return this.getSheet().getByRole("button", { name: /save & close/i });
  }

  /**
   * Get the Save & New button
   */
  getSaveAndNewButton(): Locator {
    return this.getSheet().getByRole("button", { name: /save & new/i });
  }

  // =============================================================================
  // NAVIGATION & ACTIONS
  // =============================================================================

  /**
   * Navigate to dashboard and wait for FAB to be visible
   */
  async navigate(): Promise<void> {
    await this.goto("/");
    await this.page.waitForLoadState("networkidle");
    await expect(this.getFAB()).toBeVisible({ timeout: 15000 });
  }

  /**
   * Click the FAB to open the Sheet
   */
  async openSheet(): Promise<void> {
    await this.getFAB().click();
    await expect(this.getSheet()).toBeVisible({ timeout: 5000 });
    // Wait for lazy-loaded form to appear
    await expect(this.getSheetTitle()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Close the Sheet by pressing Escape
   */
  async closeSheetWithEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await expect(this.getSheet()).not.toBeVisible({ timeout: 3000 });
  }

  /**
   * Close the Sheet by clicking the close button
   */
  async closeSheetWithButton(): Promise<void> {
    await this.getSheetCloseButton().click();
    await expect(this.getSheet()).not.toBeVisible({ timeout: 3000 });
  }

  /**
   * Close the Sheet by clicking the Cancel button
   */
  async closeSheetWithCancel(): Promise<void> {
    await this.getCancelButton().click();
    await expect(this.getSheet()).not.toBeVisible({ timeout: 3000 });
  }

  // =============================================================================
  // FORM INTERACTIONS
  // =============================================================================

  /**
   * Select activity type from dropdown
   */
  async selectActivityType(
    type: "Call" | "Email" | "Meeting" | "Follow-up" | "Note"
  ): Promise<void> {
    await this.getActivityTypeSelect().click();
    await this.page.getByRole("option", { name: type }).click();
  }

  /**
   * Select outcome from dropdown
   */
  async selectOutcome(
    outcome: "Connected" | "Left Voicemail" | "No Answer" | "Completed" | "Rescheduled"
  ): Promise<void> {
    await this.getOutcomeSelect().click();
    await this.page.getByRole("option", { name: outcome }).click();
  }

  /**
   * Fill the notes field
   */
  async fillNotes(notes: string): Promise<void> {
    await this.getNotesTextarea().fill(notes);
  }

  /**
   * Wait for form to be ready (skeleton hidden, form fields visible)
   */
  async waitForFormReady(): Promise<void> {
    // Wait for skeleton to disappear
    await expect(this.getFormSkeleton()).not.toBeVisible({ timeout: 15000 });
    // Wait for form fields to appear
    await expect(this.page.getByText("What happened?")).toBeVisible({ timeout: 5000 });
  }

  // =============================================================================
  // DRAFT PERSISTENCE HELPERS
  // =============================================================================

  /**
   * Get draft from localStorage
   */
  async getDraftFromStorage(): Promise<{
    formData: Record<string, unknown>;
    savedAt: number;
  } | null> {
    return await this.page.evaluate((key) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }, this.DRAFT_STORAGE_KEY);
  }

  /**
   * Clear draft from localStorage
   */
  async clearDraftStorage(): Promise<void> {
    await this.page.evaluate((key) => {
      localStorage.removeItem(key);
    }, this.DRAFT_STORAGE_KEY);
  }

  /**
   * Set a draft in localStorage (for testing restoration)
   */
  async setDraftInStorage(formData: Record<string, unknown>): Promise<void> {
    const draft = {
      formData,
      savedAt: Date.now(),
    };
    await this.page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: this.DRAFT_STORAGE_KEY, value: draft }
    );
  }

  /**
   * Set an expired draft in localStorage (savedAt > 24 hours ago)
   */
  async setExpiredDraftInStorage(formData: Record<string, unknown>): Promise<void> {
    const draft = {
      formData,
      // 25 hours ago (expired)
      savedAt: Date.now() - 25 * 60 * 60 * 1000,
    };
    await this.page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: this.DRAFT_STORAGE_KEY, value: draft }
    );
  }

  /**
   * Check if draft exists in localStorage
   */
  async hasDraft(): Promise<boolean> {
    const draft = await this.getDraftFromStorage();
    return draft !== null;
  }

  // =============================================================================
  // ARIA & ACCESSIBILITY HELPERS
  // =============================================================================

  /**
   * Get FAB aria-expanded attribute value
   */
  async getFABAriaExpanded(): Promise<string | null> {
    return await this.getFAB().getAttribute("aria-expanded");
  }

  /**
   * Get FAB aria-haspopup attribute value
   */
  async getFABAriaHasPopup(): Promise<string | null> {
    return await this.getFAB().getAttribute("aria-haspopup");
  }

  /**
   * Get FAB aria-label attribute value
   */
  async getFABAriaLabel(): Promise<string | null> {
    return await this.getFAB().getAttribute("aria-label");
  }

  /**
   * Check if FAB is focused
   */
  async isFABFocused(): Promise<boolean> {
    return await this.getFAB().evaluate((el) => document.activeElement === el);
  }

  /**
   * Get FAB bounding box for size verification
   */
  async getFABSize(): Promise<{ width: number; height: number } | null> {
    const box = await this.getFAB().boundingBox();
    return box ? { width: box.width, height: box.height } : null;
  }

  // =============================================================================
  // ASSERTIONS
  // =============================================================================

  /**
   * Assert FAB has correct ARIA attributes when closed
   */
  async expectFABClosedState(): Promise<void> {
    await expect(this.getFAB()).toBeVisible();
    expect(await this.getFABAriaExpanded()).toBe("false");
    expect(await this.getFABAriaHasPopup()).toBe("dialog");
  }

  /**
   * Assert FAB has correct ARIA attributes when Sheet is open
   */
  async expectFABOpenState(): Promise<void> {
    expect(await this.getFABAriaExpanded()).toBe("true");
  }

  /**
   * Assert draft badge is visible
   */
  async expectDraftBadgeVisible(): Promise<void> {
    await expect(this.getDraftBadge()).toBeVisible();
  }

  /**
   * Assert draft badge is not visible
   */
  async expectDraftBadgeHidden(): Promise<void> {
    await expect(this.getDraftBadge()).not.toBeVisible();
  }

  /**
   * Assert Sheet is open with form ready
   */
  async expectSheetOpen(): Promise<void> {
    await expect(this.getSheet()).toBeVisible();
    await expect(this.getSheetTitle()).toBeVisible();
  }

  /**
   * Assert Sheet is closed
   */
  async expectSheetClosed(): Promise<void> {
    await expect(this.getSheet()).not.toBeVisible();
  }
}
