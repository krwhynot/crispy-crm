import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Quick Logger Page Object Model
 *
 * Handles interactions with the Quick Logger panel on Dashboard V3.
 * Uses semantic selectors following playwright-e2e-testing skill.
 *
 * Key patterns:
 * - Combobox interactions (popover + search + select)
 * - Smart cascade validation (contact auto-fills organization)
 * - Form submission with follow-up task creation
 */
export class QuickLoggerPage extends BasePage {
  // Panel locators
  get panel(): Locator {
    return this.page.locator('text="Log Activity"').locator("..").locator("..");
  }

  get newActivityButton(): Locator {
    return this.page.getByRole("button", { name: /new activity/i });
  }

  // Form field locators - using semantic selectors
  get activityTypeButton(): Locator {
    return this.page.getByRole("combobox").filter({ hasText: /select type|call|email|meeting/i });
  }

  get outcomeButton(): Locator {
    return this.page.getByRole("combobox").filter({ hasText: /select outcome|connected/i });
  }

  get durationInput(): Locator {
    return this.page.getByLabel(/duration/i);
  }

  get contactButton(): Locator {
    return this.page.getByRole("combobox", { name: /contact/i });
  }

  get organizationButton(): Locator {
    return this.page.getByRole("combobox", { name: /organization/i });
  }

  get opportunityButton(): Locator {
    return this.page.getByRole("combobox", { name: /opportunity/i });
  }

  get notesTextarea(): Locator {
    return this.page.getByRole("textbox", { name: /notes/i });
  }

  get createFollowUpSwitch(): Locator {
    return this.page.getByRole("switch");
  }

  get followUpDateButton(): Locator {
    return this.page.getByRole("button", { name: /pick a date|follow-up date/i });
  }

  get saveCloseButton(): Locator {
    return this.page.getByRole("button", { name: /save & close/i });
  }

  get saveNewButton(): Locator {
    return this.page.getByRole("button", { name: /save & new/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole("button", { name: /cancel/i });
  }

  /**
   * Navigate to dashboard and ensure Quick Logger panel is visible
   */
  async navigateToDashboard(): Promise<void> {
    await this.goto("/");
    await this.page.waitForLoadState("networkidle");

    // Wait for Quick Logger panel header
    await expect(this.page.getByText("Log Activity")).toBeVisible({ timeout: 10000 });
  }

  /**
   * Open the Quick Logger form
   */
  async openForm(): Promise<void> {
    // Click "New Activity" button to open form
    await this.newActivityButton.click();

    // Wait for form to appear (Activity Type field is visible)
    await expect(this.page.getByText("Activity Type")).toBeVisible({ timeout: 5000 });
  }

  /**
   * Select activity type from dropdown
   */
  async selectActivityType(
    type: "Call" | "Email" | "Meeting" | "Follow-up" | "Note"
  ): Promise<void> {
    // Find and click the Activity Type trigger button
    const trigger = this.page.getByLabel("Activity Type").locator("..").getByRole("combobox");
    await trigger.click();

    // Wait for dropdown to open
    await expect(this.page.getByRole("option", { name: type })).toBeVisible();

    // Select the option
    await this.page.getByRole("option", { name: type }).click();

    // Verify selection
    await expect(trigger).toContainText(type);
  }

  /**
   * Select outcome from dropdown
   */
  async selectOutcome(
    outcome: "Connected" | "Left Voicemail" | "No Answer" | "Completed" | "Rescheduled"
  ): Promise<void> {
    const trigger = this.page.getByLabel("Outcome").locator("..").getByRole("combobox");
    await trigger.click();

    await expect(this.page.getByRole("option", { name: outcome })).toBeVisible();
    await this.page.getByRole("option", { name: outcome }).click();

    await expect(trigger).toContainText(outcome);
  }

  /**
   * Set duration (only visible for Call/Meeting)
   */
  async setDuration(minutes: number): Promise<void> {
    await this.durationInput.fill(String(minutes));
  }

  /**
   * Select contact from combobox with search
   * Returns the selected contact name for verification
   */
  async selectContact(searchTerm: string): Promise<string> {
    // Click the Contact combobox trigger
    const contactTrigger = this.page
      .getByLabel("Contact *")
      .locator("..")
      .getByRole("combobox");
    await contactTrigger.click();

    // Wait for popover to open
    await expect(this.page.getByPlaceholder(/search contact/i)).toBeVisible();

    // Type search term
    await this.page.getByPlaceholder(/search contact/i).fill(searchTerm);

    // Wait for filtered results and select first match
    const firstResult = this.page.getByRole("option").first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });

    const selectedName = await firstResult.textContent();
    await firstResult.click();

    // Verify popover closed and selection shows
    await expect(this.page.getByPlaceholder(/search contact/i)).not.toBeVisible();

    return selectedName || "";
  }

  /**
   * Select organization from combobox with search
   * Returns the selected organization name for verification
   */
  async selectOrganization(searchTerm: string): Promise<string> {
    const orgTrigger = this.page
      .getByLabel("Organization *")
      .locator("..")
      .getByRole("combobox");
    await orgTrigger.click();

    await expect(this.page.getByPlaceholder(/search organization/i)).toBeVisible();
    await this.page.getByPlaceholder(/search organization/i).fill(searchTerm);

    const firstResult = this.page.getByRole("option").first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });

    const selectedName = await firstResult.textContent();
    await firstResult.click();

    await expect(this.page.getByPlaceholder(/search organization/i)).not.toBeVisible();

    return selectedName || "";
  }

  /**
   * Get the currently selected organization name
   */
  async getSelectedOrganization(): Promise<string> {
    const orgTrigger = this.page
      .getByLabel("Organization *")
      .locator("..")
      .getByRole("combobox");
    return (await orgTrigger.textContent()) || "";
  }

  /**
   * Get the currently selected contact name
   */
  async getSelectedContact(): Promise<string> {
    const contactTrigger = this.page
      .getByLabel("Contact *")
      .locator("..")
      .getByRole("combobox");
    return (await contactTrigger.textContent()) || "";
  }

  /**
   * Fill notes textarea
   */
  async fillNotes(notes: string): Promise<void> {
    const notesField = this.page.getByLabel("Notes").locator("..").getByRole("textbox");
    await notesField.fill(notes);
  }

  /**
   * Enable follow-up task creation
   */
  async enableFollowUp(): Promise<void> {
    await this.createFollowUpSwitch.click();

    // Wait for date picker to appear
    await expect(this.page.getByText("Follow-up Date")).toBeVisible();
  }

  /**
   * Select tomorrow as follow-up date
   */
  async selectFollowUpDateTomorrow(): Promise<void> {
    // Click the date picker button
    await this.followUpDateButton.click();

    // Wait for calendar popover
    await expect(this.page.getByRole("grid")).toBeVisible();

    // Find tomorrow's date button
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayNumber = tomorrow.getDate();

    // Click tomorrow's date in the calendar
    await this.page
      .getByRole("gridcell", { name: String(dayNumber), exact: true })
      .filter({ hasNot: this.page.locator("[disabled]") })
      .click();

    // Verify calendar closed
    await expect(this.page.getByRole("grid")).not.toBeVisible();
  }

  /**
   * Submit form with Save & Close
   */
  async submitAndClose(): Promise<void> {
    await this.saveCloseButton.click();

    // Wait for form to close (New Activity button reappears)
    await expect(this.newActivityButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Submit form with Save & New (form stays open)
   */
  async submitAndNew(): Promise<void> {
    await this.saveNewButton.click();

    // Wait for form to reset (notes should be empty)
    const notesField = this.page.getByLabel("Notes").locator("..").getByRole("textbox");
    await expect(notesField).toHaveValue("", { timeout: 10000 });
  }

  /**
   * Cancel and close the form
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.newActivityButton).toBeVisible();
  }

  /**
   * Wait for and verify success notification
   */
  async expectSuccessNotification(): Promise<void> {
    await expect(
      this.page.getByText(/activity logged successfully/i)
    ).toBeVisible({ timeout: 5000 });
  }

  /**
   * Complete flow: Log activity for Kyle Ramsy at Bally's Casino
   */
  async logActivityForKyleRamsy(options: {
    activityType: "Call" | "Email" | "Meeting" | "Follow-up" | "Note";
    outcome: "Connected" | "Left Voicemail" | "No Answer" | "Completed" | "Rescheduled";
    duration?: number;
    notes: string;
    createFollowUp?: boolean;
  }): Promise<void> {
    // Select Activity Type
    await this.selectActivityType(options.activityType);

    // Select Outcome
    await this.selectOutcome(options.outcome);

    // Set duration if applicable
    if (options.duration && (options.activityType === "Call" || options.activityType === "Meeting")) {
      await this.setDuration(options.duration);
    }

    // Select Contact (Kyle Ramsy)
    await this.selectContact("Kyle Ramsy");

    // Verify Organization auto-filled (smart cascade)
    const selectedOrg = await this.getSelectedOrganization();
    expect(selectedOrg).toContain("Bally");

    // Fill notes
    await this.fillNotes(options.notes);

    // Enable follow-up if requested
    if (options.createFollowUp) {
      await this.enableFollowUp();
      await this.selectFollowUpDateTomorrow();
    }
  }
}
