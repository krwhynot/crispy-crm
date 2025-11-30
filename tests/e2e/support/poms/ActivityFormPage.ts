import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import {
  waitForFormReady,
  clickSaveAndWait,
  fillAutocompleteField,
  selectFromDropdown,
  toggleCheckbox,
  fillDateField,
  expectFieldError,
  expectFormNotSubmitted,
  expectFormSubmitted,
  uniqueTestData,
} from "./FormTestHelpers";

/**
 * Activity Form Page Object Model
 * Handles both create and edit forms for activities
 *
 * Validation Requirements (from activitiesSchema):
 * - subject: Required (min 1 char)
 * - activity_type: "engagement" or "interaction" (default: interaction)
 * - type: One of 13 interaction types (call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note, sample)
 * - opportunity_id: Required IF activity_type is "interaction"
 * - contact_id OR organization_id: At least one required
 * - follow_up_date: Required IF follow_up_required is true
 * - sample_status: Required IF type is "sample"
 *
 * Required by playwright-e2e-testing skill
 */
export class ActivityFormPage extends BasePage {
  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Navigate to activity create form
   */
  async gotoCreate(): Promise<void> {
    await this.goto("/#/activities/create");

    // Wait for the hash route to be processed by React Router
    await this.page.waitForURL(/\/#\/activities\/create/, { timeout: 10000 });

    // Wait for the Subject field to be visible (form-specific indicator)
    // Note: Label may have "*" suffix for required field indication
    const subjectInput = this.page.getByLabel(/subject/i);
    await expect(subjectInput).toBeVisible({ timeout: 10000 });
  }

  /**
   * Navigate to activity edit form
   */
  async gotoEdit(activityId: number | string): Promise<void> {
    await this.goto(`/#/activities/${activityId}`);
    await waitForFormReady(this.page);
  }

  // ============================================================================
  // COLLAPSIBLE SECTIONS
  // ============================================================================

  /**
   * Open the Follow-up collapsible section
   */
  async openFollowUpSection(): Promise<void> {
    const trigger = this.page.getByRole("button", { name: /follow-up/i });
    const isExpanded = await trigger.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await trigger.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Open the Outcome collapsible section
   */
  async openOutcomeSection(): Promise<void> {
    const trigger = this.page.getByRole("button", { name: /outcome/i });
    const isExpanded = await trigger.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await trigger.click();
      await this.page.waitForTimeout(300);
    }
  }

  // ============================================================================
  // ACTIVITY DETAILS FIELDS
  // ============================================================================

  /**
   * Select interaction type (call, email, meeting, etc.)
   */
  async selectInteractionType(
    type:
      | "call"
      | "email"
      | "meeting"
      | "demo"
      | "proposal"
      | "follow_up"
      | "trade_show"
      | "site_visit"
      | "contract_review"
      | "check_in"
      | "social"
      | "note"
      | "sample"
  ): Promise<void> {
    const typeLabels: Record<string, string> = {
      call: "Call",
      email: "Email",
      meeting: "Meeting",
      demo: "Demo",
      proposal: "Proposal",
      follow_up: "Follow Up",
      trade_show: "Trade Show",
      site_visit: "Site Visit",
      contract_review: "Contract Review",
      check_in: "Check In",
      social: "Social",
      note: "Note",
      sample: "Sample",
    };

    await selectFromDropdown(
      this.page,
      /interaction type/i,
      new RegExp(typeLabels[type], "i")
    );
  }

  /**
   * Fill the subject field
   * Note: Label may have "*" suffix for required field indication (e.g., "Subject *")
   */
  async fillSubject(subject: string): Promise<void> {
    const input = this.page.getByLabel(/subject/i);
    await expect(input).toBeVisible();
    await input.fill(subject);
  }

  /**
   * Get the subject input
   */
  getSubjectInput(): Locator {
    return this.page.getByLabel(/subject/i);
  }

  /**
   * Fill the activity date field
   */
  async fillActivityDate(date: Date): Promise<void> {
    await fillDateField(this.page, /^date$/i, date);
  }

  /**
   * Fill the duration field
   */
  async fillDuration(minutes: number): Promise<void> {
    const input = this.page.getByLabel(/duration.*minutes/i);
    await expect(input).toBeVisible();
    await input.fill(minutes.toString());
  }

  /**
   * Fill the notes/description field
   */
  async fillNotes(notes: string): Promise<void> {
    const input = this.page.getByLabel(/^notes$/i);
    await expect(input).toBeVisible();
    await input.fill(notes);
  }

  // ============================================================================
  // RELATIONSHIPS FIELDS
  // ============================================================================

  /**
   * Select an opportunity using the Radix combobox pattern
   * The field is a combobox trigger that opens a popover with search
   */
  async selectOpportunity(searchText: string): Promise<void> {
    // Find the Opportunity field within main (not nav link "Opportunities")
    // Look for group role containing "Opportunity" text (exact match) AND a combobox
    const main = this.page.getByRole("main");
    const opportunityGroup = main.getByRole("group").filter({
      has: this.page.getByText("Opportunity", { exact: true }),
    });

    // Click the combobox trigger button within the group
    const triggerButton = opportunityGroup.getByRole("combobox").first();
    await expect(triggerButton).toBeVisible({ timeout: 5000 });
    await triggerButton.click();

    // Wait for popover/dialog to appear
    const dialog = this.page.getByRole("dialog");
    const listbox = this.page.getByRole("listbox");
    const popover = dialog.or(listbox);
    await expect(popover.first()).toBeVisible({ timeout: 5000 });

    // Find and type in the search input
    const searchInput = popover.first().getByRole("combobox").or(popover.first().getByRole("textbox"));
    if (await searchInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.first().fill(searchText);
      await this.page.waitForTimeout(500);
    }

    // Click the first matching option
    const option = this.page.getByRole("option", { name: new RegExp(searchText, "i") }).first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    }

    // Wait for popover to close
    await expect(popover.first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  }

  /**
   * Select a contact using the Radix combobox pattern
   */
  async selectContact(searchText: string): Promise<void> {
    // Find the Contact field within main (not nav link "Contacts")
    // Look for group role containing "Contact" text AND a combobox
    const main = this.page.getByRole("main");
    const contactGroup = main.getByRole("group").filter({
      has: this.page.getByText("Contact", { exact: true }),
    });

    // Click the combobox trigger button within the contact group
    const triggerButton = contactGroup.getByRole("combobox").first();
    await expect(triggerButton).toBeVisible({ timeout: 5000 });
    await triggerButton.click();

    // Wait for popover/dialog to appear
    const dialog = this.page.getByRole("dialog");
    const listbox = this.page.getByRole("listbox");
    const popover = dialog.or(listbox);
    await expect(popover.first()).toBeVisible({ timeout: 5000 });

    // Find and type in the search input
    const searchInput = popover.first().getByRole("combobox").or(popover.first().getByRole("textbox"));
    if (await searchInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.first().fill(searchText);
      await this.page.waitForTimeout(500);
    }

    // Click the first matching option
    const option = this.page.getByRole("option", { name: new RegExp(searchText, "i") }).first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    }

    // Wait for popover to close
    await expect(popover.first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  }

  /**
   * Select an organization using the Radix combobox pattern
   */
  async selectOrganization(searchText: string): Promise<void> {
    // Find the Organization field within main (not nav link "Organizations")
    // Look for group role containing "Organization" text (exact match) AND a combobox
    const main = this.page.getByRole("main");
    const orgGroup = main.getByRole("group").filter({
      has: this.page.getByText("Organization", { exact: true }),
    });

    // Click the combobox trigger button within the group
    const triggerButton = orgGroup.getByRole("combobox").first();
    await expect(triggerButton).toBeVisible({ timeout: 5000 });
    await triggerButton.click();

    // Wait for popover/dialog to appear
    const dialog = this.page.getByRole("dialog");
    const listbox = this.page.getByRole("listbox");
    const popover = dialog.or(listbox);
    await expect(popover.first()).toBeVisible({ timeout: 5000 });

    // Find and type in the search input
    const searchInput = popover.first().getByRole("combobox").or(popover.first().getByRole("textbox"));
    if (await searchInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.first().fill(searchText);
      await this.page.waitForTimeout(500);
    }

    // Click the first matching option
    const option = this.page.getByRole("option", { name: new RegExp(searchText, "i") }).first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    }

    // Wait for popover to close
    await expect(popover.first()).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  }

  // ============================================================================
  // FOLLOW-UP FIELDS
  // ============================================================================

  /**
   * Select sentiment
   */
  async selectSentiment(
    sentiment: "positive" | "neutral" | "negative"
  ): Promise<void> {
    await this.openFollowUpSection();
    const sentimentLabels = {
      positive: "Positive",
      neutral: "Neutral",
      negative: "Negative",
    };
    await selectFromDropdown(
      this.page,
      /sentiment/i,
      new RegExp(sentimentLabels[sentiment], "i")
    );
  }

  /**
   * Fill the follow-up date field
   */
  async fillFollowUpDate(date: Date): Promise<void> {
    await this.openFollowUpSection();
    await fillDateField(this.page, /follow-up date/i, date);
  }

  /**
   * Fill the follow-up notes field
   */
  async fillFollowUpNotes(notes: string): Promise<void> {
    await this.openFollowUpSection();
    const input = this.page.getByLabel(/follow-up notes/i);
    await expect(input).toBeVisible();
    await input.fill(notes);
  }

  // ============================================================================
  // OUTCOME FIELDS
  // ============================================================================

  /**
   * Fill the location field
   */
  async fillLocation(location: string): Promise<void> {
    await this.openOutcomeSection();
    const input = this.page.getByLabel(/location/i);
    await expect(input).toBeVisible();
    await input.fill(location);
  }

  /**
   * Fill the outcome field
   */
  async fillOutcome(outcome: string): Promise<void> {
    await this.openOutcomeSection();
    const input = this.page.getByLabel(/^outcome$/i);
    await expect(input).toBeVisible();
    await input.fill(outcome);
  }

  // ============================================================================
  // SAMPLE TRACKING (if type is "sample")
  // ============================================================================

  /**
   * Select sample status
   * Note: This field should only be visible/used when type is "sample"
   */
  async selectSampleStatus(
    status: "sent" | "received" | "feedback_pending" | "feedback_received"
  ): Promise<void> {
    const statusLabels = {
      sent: "Sent",
      received: "Received",
      feedback_pending: "Feedback Pending",
      feedback_received: "Feedback Received",
    };
    await selectFromDropdown(
      this.page,
      /sample status/i,
      new RegExp(statusLabels[status], "i")
    );
  }

  // ============================================================================
  // FORM ACTIONS
  // ============================================================================

  /**
   * Click Save button
   */
  async clickSave(): Promise<void> {
    const button = this.page.getByRole("button", { name: /^save$/i });
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Click Cancel button
   */
  async clickCancel(): Promise<void> {
    const button = this.page.getByRole("button", { name: /cancel/i });
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Submit the form (alias for save)
   */
  async submit(): Promise<void> {
    await clickSaveAndWait(this.page);
  }

  /**
   * Attempt to submit form (for validation testing - doesn't wait for navigation)
   */
  async attemptSubmit(): Promise<void> {
    await this.clickSave();
    // Wait briefly for validation to run
    await this.page.waitForTimeout(500);
  }

  // ============================================================================
  // VALIDATION ASSERTIONS
  // ============================================================================

  /**
   * Assert subject error is shown
   */
  async expectSubjectError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "subject", message);
  }

  /**
   * Assert opportunity error is shown
   */
  async expectOpportunityError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "opportunity", message);
  }

  /**
   * Assert contact error is shown
   */
  async expectContactError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "contact", message);
  }

  /**
   * Assert organization error is shown
   */
  async expectOrganizationError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "organization", message);
  }

  /**
   * Assert follow-up date error is shown
   */
  async expectFollowUpDateError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "follow_up_date", message);
  }

  /**
   * Assert sample status error is shown
   */
  async expectSampleStatusError(message?: string | RegExp): Promise<void> {
    await expectFieldError(this.page, "sample_status", message);
  }

  /**
   * Assert we're still on the create form (validation prevented submission)
   */
  async expectStillOnCreateForm(): Promise<void> {
    await expectFormNotSubmitted(this.page, "activities");
  }

  /**
   * Assert form was submitted successfully
   */
  async expectFormSuccess(): Promise<void> {
    await expectFormSubmitted(this.page, "activities");
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Fill required fields for a valid activity
   * By default creates an "interaction" activity (requires opportunity)
   */
  async fillRequiredFields(options?: {
    subject?: string;
    type?: string;
    opportunity?: string;
    contact?: string;
    organization?: string;
  }): Promise<void> {
    const defaults = {
      subject: options?.subject || uniqueTestData("Test Activity"),
      type: options?.type || "call",
      opportunity: options?.opportunity || "Test", // Will search for existing
      contact: options?.contact,
      organization: options?.organization,
    };

    // Fill subject
    await this.fillSubject(defaults.subject);

    // Select interaction type
    await this.selectInteractionType(
      defaults.type as
        | "call"
        | "email"
        | "meeting"
        | "demo"
        | "proposal"
        | "follow_up"
        | "trade_show"
        | "site_visit"
        | "contract_review"
        | "check_in"
        | "social"
        | "note"
        | "sample"
    );

    // Select opportunity (required for interaction activities)
    await this.selectOpportunity(defaults.opportunity);

    // Select at least one entity (contact or organization)
    if (defaults.contact) {
      await this.selectContact(defaults.contact);
    } else if (defaults.organization) {
      await this.selectOrganization(defaults.organization);
    } else {
      // Default to searching for a contact if neither specified
      await this.selectContact("Test");
    }
  }

  /**
   * Create a new activity with all fields and submit
   */
  async createActivity(data: {
    subject: string;
    type: string;
    opportunity: string;
    contact?: string;
    organization?: string;
    notes?: string;
    duration?: number;
    location?: string;
  }): Promise<void> {
    await this.fillRequiredFields({
      subject: data.subject,
      type: data.type,
      opportunity: data.opportunity,
      contact: data.contact,
      organization: data.organization,
    });

    if (data.notes) {
      await this.fillNotes(data.notes);
    }

    if (data.duration) {
      await this.fillDuration(data.duration);
    }

    if (data.location) {
      await this.fillLocation(data.location);
    }

    await this.clickSave();

    // Wait for redirect to list page
    await this.waitForURL(/\/#\/activities/);
  }

  /**
   * Create a sample activity (requires sample_status)
   */
  async createSampleActivity(data: {
    subject: string;
    opportunity: string;
    contact?: string;
    organization?: string;
    sampleStatus: "sent" | "received" | "feedback_pending" | "feedback_received";
  }): Promise<void> {
    await this.fillSubject(data.subject);
    await this.selectInteractionType("sample");
    await this.selectOpportunity(data.opportunity);

    if (data.contact) {
      await this.selectContact(data.contact);
    } else if (data.organization) {
      await this.selectOrganization(data.organization);
    }

    await this.selectSampleStatus(data.sampleStatus);

    await this.clickSave();

    // Wait for redirect to list page
    await this.waitForURL(/\/#\/activities/);
  }

  /**
   * Fill activity form without submitting
   */
  async fillActivityForm(data: {
    subject: string;
    type: string;
    notes?: string;
  }): Promise<void> {
    await this.fillSubject(data.subject);
    await this.selectInteractionType(
      data.type as
        | "call"
        | "email"
        | "meeting"
        | "demo"
        | "proposal"
        | "follow_up"
        | "trade_show"
        | "site_visit"
        | "contract_review"
        | "check_in"
        | "social"
        | "note"
        | "sample"
    );

    if (data.notes) {
      await this.fillNotes(data.notes);
    }
  }

  /**
   * Update activity fields and submit
   */
  async updateActivity(data: {
    subject?: string;
    notes?: string;
    location?: string;
  }): Promise<void> {
    if (data.subject) {
      await this.fillSubject(data.subject);
    }
    if (data.notes) {
      await this.fillNotes(data.notes);
    }
    if (data.location) {
      await this.fillLocation(data.location);
    }

    await this.submit();

    // Wait for redirect
    await this.waitForURL(/\/#\/activities/);
  }
}
