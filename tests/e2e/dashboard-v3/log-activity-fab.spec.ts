import { test, expect } from "../support/fixtures/authenticated";
import { consoleMonitor } from "../support/utils/console-monitor";
import { LogActivityFABPage } from "../support/poms/LogActivityFABPage";

/**
 * LogActivityFAB E2E Tests
 *
 * Comprehensive test suite for the floating action button (FAB) that opens
 * the Log Activity Sheet on Dashboard V3.
 *
 * Tests verify:
 * 1. FAB Interaction - clicking FAB opens Sheet, closing methods work
 * 2. Draft Persistence - localStorage saves/restores form data
 * 3. Accessibility - ARIA attributes, focus management
 * 4. Visual Design - FAB size, draft badge indicator
 *
 * Required by: Dashboard V3 Implementation Plan
 * Uses: playwright-e2e-testing skill patterns (POM, semantic selectors, condition-based waiting)
 */

test.describe("LogActivityFAB - Dashboard V3", () => {
  let fabPage: LogActivityFABPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    fabPage = new LogActivityFABPage(authenticatedPage);

    // Clear any existing draft before each test
    await authenticatedPage.goto("/");
    await authenticatedPage.waitForLoadState("networkidle");
    await fabPage.clearDraftStorage();

    // Navigate fresh to ensure clean state
    await fabPage.navigate();
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();

    if (errors.length > 0) {
      await test.info().attach("console-errors", {
        body: consoleMonitor.getReport(),
        contentType: "text/plain",
      });
    }

    // Fail test on critical errors
    const criticalErrors = errors.filter((e) => {
      const str = typeof e === "string" ? e : JSON.stringify(e);
      return str.includes("permission denied") || str.includes("Uncaught");
    });

    expect(criticalErrors, "Critical console errors detected").toHaveLength(0);
  });

  // =============================================================================
  // FAB INTERACTION TESTS
  // =============================================================================

  test.describe("FAB Interaction", () => {
    test("FAB is visible on dashboard", async () => {
      await expect(fabPage.getFAB()).toBeVisible();
    });

    test("FAB has correct size (56px / h-14 w-14)", async () => {
      const size = await fabPage.getFABSize();

      expect(size).not.toBeNull();
      // h-14 w-14 = 56px per Tailwind
      expect(size!.width).toBeGreaterThanOrEqual(56);
      expect(size!.height).toBeGreaterThanOrEqual(56);
    });

    test("clicking FAB opens Log Activity Sheet", async () => {
      await fabPage.openSheet();

      await fabPage.expectSheetOpen();
      await expect(fabPage.getSheetDescription()).toBeVisible();
    });

    test("Sheet contains QuickLogForm with all fields", async () => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Verify form sections
      await expect(fabPage.page.getByText("What happened?")).toBeVisible();
      await expect(fabPage.page.getByText("Who was involved?")).toBeVisible();

      // Verify key form fields
      await expect(fabPage.getActivityTypeSelect()).toBeVisible();
      await expect(fabPage.getOutcomeSelect()).toBeVisible();
      await expect(fabPage.getNotesTextarea()).toBeVisible();

      // Verify action buttons
      await expect(fabPage.getCancelButton()).toBeVisible();
      await expect(fabPage.getSaveAndCloseButton()).toBeVisible();
      await expect(fabPage.getSaveAndNewButton()).toBeVisible();
    });

    test("pressing Escape closes Sheet", async () => {
      await fabPage.openSheet();
      await fabPage.expectSheetOpen();

      await fabPage.closeSheetWithEscape();

      await fabPage.expectSheetClosed();
    });

    test("clicking Cancel button closes Sheet", async () => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      await fabPage.closeSheetWithCancel();

      await fabPage.expectSheetClosed();
    });

    test("clicking X button closes Sheet", async () => {
      await fabPage.openSheet();
      await fabPage.expectSheetOpen();

      await fabPage.closeSheetWithButton();

      await fabPage.expectSheetClosed();
    });

    test("FAB can be reopened after closing", async () => {
      // Open and close
      await fabPage.openSheet();
      await fabPage.closeSheetWithEscape();
      await fabPage.expectSheetClosed();

      // Wait for close animation
      await fabPage.page.waitForTimeout(300);

      // Reopen
      await fabPage.openSheet();
      await fabPage.expectSheetOpen();
    });
  });

  // =============================================================================
  // ACCESSIBILITY TESTS
  // =============================================================================

  test.describe("Accessibility", () => {
    test("FAB has correct ARIA attributes when closed", async () => {
      await fabPage.expectFABClosedState();

      const ariaLabel = await fabPage.getFABAriaLabel();
      expect(ariaLabel).toBe("Log Activity");
    });

    test("FAB aria-expanded changes to true when Sheet opens", async () => {
      // Before opening
      expect(await fabPage.getFABAriaExpanded()).toBe("false");

      await fabPage.openSheet();

      // After opening
      await fabPage.expectFABOpenState();
    });

    test("FAB aria-label indicates draft when draft exists", async ({ authenticatedPage }) => {
      // Set a draft
      await fabPage.setDraftInStorage({ notes: "Test draft" });

      // Reload to trigger draft detection
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(fabPage.getFAB()).toBeVisible();

      const ariaLabel = await fabPage.getFABAriaLabel();
      expect(ariaLabel).toBe("Log Activity (draft saved)");
    });

    test("focus returns to FAB after Sheet closes with Escape", async () => {
      await fabPage.openSheet();
      await fabPage.expectSheetOpen();

      await fabPage.closeSheetWithEscape();
      await fabPage.expectSheetClosed();

      // Small delay for focus return animation
      await fabPage.page.waitForTimeout(200);

      const isFocused = await fabPage.isFABFocused();
      expect(isFocused).toBe(true);
    });

    test("Sheet has correct ARIA attributes", async () => {
      await fabPage.openSheet();

      const sheet = fabPage.getSheet();
      await expect(sheet).toBeVisible();

      // Sheet should have role="dialog"
      await expect(sheet).toHaveAttribute("role", "dialog");

      // Title should be linked via aria-labelledby
      const titleId = await fabPage.getSheetTitle().getAttribute("id");
      expect(titleId).toBe("log-activity-title");
    });
  });

  // =============================================================================
  // DRAFT PERSISTENCE TESTS
  // =============================================================================

  test.describe("Draft Persistence", () => {
    test("no draft badge shown initially", async () => {
      await fabPage.expectDraftBadgeHidden();
    });

    test("typing in notes field saves draft to localStorage", async () => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Fill in notes
      const testNotes = "E2E test note for draft persistence";
      await fabPage.fillNotes(testNotes);

      // Wait for debounce (500ms) + small buffer
      await fabPage.page.waitForTimeout(700);

      // Verify draft exists in localStorage
      const draft = await fabPage.getDraftFromStorage();
      expect(draft).not.toBeNull();
      expect(draft!.formData.notes).toBe(testNotes);
    });

    test("draft badge appears after typing content", async ({ authenticatedPage }) => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Fill in notes
      await fabPage.fillNotes("Draft content for badge test");

      // Wait for debounce
      await fabPage.page.waitForTimeout(700);

      // Close sheet
      await fabPage.closeSheetWithEscape();

      // Reload page to see badge state
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(fabPage.getFAB()).toBeVisible();

      // Draft badge should be visible
      await fabPage.expectDraftBadgeVisible();
    });

    test("closing Sheet without saving retains draft", async () => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Fill in notes
      const testNotes = "Draft to be retained after close";
      await fabPage.fillNotes(testNotes);

      // Wait for debounce
      await fabPage.page.waitForTimeout(700);

      // Close without saving (Escape)
      await fabPage.closeSheetWithEscape();

      // Verify draft still exists
      const draft = await fabPage.getDraftFromStorage();
      expect(draft).not.toBeNull();
      expect(draft!.formData.notes).toBe(testNotes);
    });

    test("reopening Sheet restores draft data", async ({ authenticatedPage }) => {
      // First session: create a draft
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      const testNotes = "Draft to be restored";
      await fabPage.fillNotes(testNotes);

      // Wait for debounce and close
      await fabPage.page.waitForTimeout(700);
      await fabPage.closeSheetWithEscape();

      // Simulate new session by reloading
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(fabPage.getFAB()).toBeVisible();

      // Reopen sheet
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Notes should be restored
      await expect(fabPage.getNotesTextarea()).toHaveValue(testNotes);
    });

    test("draft is restored from localStorage on Sheet open", async () => {
      // Pre-set a draft directly in localStorage
      const presetDraft = {
        notes: "Pre-existing draft from localStorage",
        activityType: "Call",
      };
      await fabPage.setDraftInStorage(presetDraft);

      // Open the sheet
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Notes should be populated from draft
      await expect(fabPage.getNotesTextarea()).toHaveValue(presetDraft.notes);
    });

    test("expired draft (>24h) is not restored", async ({ authenticatedPage }) => {
      // Set an expired draft
      const expiredDraft = {
        notes: "This draft is expired",
      };
      await fabPage.setExpiredDraftInStorage(expiredDraft);

      // Reload page
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      // No draft badge should show (expired draft was cleared)
      await fabPage.expectDraftBadgeHidden();

      // Open sheet
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Notes should be empty (expired draft not restored)
      await expect(fabPage.getNotesTextarea()).toHaveValue("");
    });

    test("empty form does not save draft", async () => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Don't fill anything, just wait
      await fabPage.page.waitForTimeout(700);

      // Close without filling
      await fabPage.closeSheetWithEscape();

      // No draft should exist
      const hasDraft = await fabPage.hasDraft();
      expect(hasDraft).toBe(false);
    });

    test("clearing notes removes draft from storage", async () => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Fill in notes
      await fabPage.fillNotes("Temporary draft");
      await fabPage.page.waitForTimeout(700);

      // Verify draft exists
      let hasDraft = await fabPage.hasDraft();
      expect(hasDraft).toBe(true);

      // Clear notes
      await fabPage.fillNotes("");
      await fabPage.page.waitForTimeout(700);

      // Draft should be removed
      hasDraft = await fabPage.hasDraft();
      expect(hasDraft).toBe(false);
    });
  });

  // =============================================================================
  // VISUAL DESIGN TESTS
  // =============================================================================

  test.describe("Visual Design", () => {
    test("draft badge has warning color and pulse animation", async ({ authenticatedPage }) => {
      // Set a draft to show badge
      await fabPage.setDraftInStorage({ notes: "Draft for badge styling" });
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      const badge = fabPage.getDraftBadge();
      await expect(badge).toBeVisible();

      // Check for warning background color class
      const hasWarningColor = await badge.evaluate((el) => el.classList.contains("bg-warning"));
      expect(hasWarningColor).toBe(true);

      // Check for pulse animation class
      const hasPulse = await badge.evaluate((el) => el.classList.contains("animate-pulse"));
      expect(hasPulse).toBe(true);
    });

    test("Sheet slides in from the right side", async () => {
      await fabPage.openSheet();

      const sheet = fabPage.getSheet();
      await expect(sheet).toBeVisible();

      // Check that sheet is positioned on the right
      // SheetContent with side="right" should have data-side="right"
      // or be styled to appear on the right side of the viewport
      const box = await sheet.boundingBox();
      expect(box).not.toBeNull();

      // Sheet should be on the right half of the viewport
      const viewportWidth = await fabPage.page.evaluate(() => window.innerWidth);
      expect(box!.x).toBeGreaterThan(viewportWidth / 2 - box!.width);
    });

    test("Sheet has max width of 420px on desktop", async () => {
      await fabPage.openSheet();

      const sheet = fabPage.getSheet();
      const box = await sheet.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(420);
    });
  });

  // =============================================================================
  // FORM SUBMISSION TESTS
  // =============================================================================

  test.describe("Form Submission", () => {
    test("successful submission clears draft", async ({ authenticatedPage }) => {
      await fabPage.openSheet();
      await fabPage.waitForFormReady();

      // Fill required fields
      await fabPage.selectActivityType("Follow-up");
      await fabPage.selectOutcome("Completed");

      // Select contact
      const contactTrigger = fabPage.getContactCombobox();
      await contactTrigger.click();
      await expect(authenticatedPage.getByPlaceholder(/search contact/i)).toBeVisible();
      await authenticatedPage.getByPlaceholder(/search contact/i).fill("and");
      const firstContact = authenticatedPage.getByRole("option").first();
      await expect(firstContact).toBeVisible({ timeout: 5000 });
      await firstContact.evaluate((node) => (node as HTMLElement).click());
      await authenticatedPage.waitForTimeout(300);

      // Fill notes
      const timestamp = Date.now();
      await fabPage.fillNotes(`E2E submission test - ${timestamp}`);

      // Wait for draft to save
      await authenticatedPage.waitForTimeout(700);

      // Verify draft exists before submit
      let hasDraft = await fabPage.hasDraft();
      expect(hasDraft).toBe(true);

      // Submit form
      await fabPage.getSaveAndCloseButton().click();

      // Wait for form to close (success notification or sheet closes)
      await fabPage.expectSheetClosed();

      // Draft should be cleared after successful submission
      hasDraft = await fabPage.hasDraft();
      expect(hasDraft).toBe(false);
    });
  });
});
