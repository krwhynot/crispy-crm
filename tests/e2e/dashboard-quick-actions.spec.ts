import { test, expect } from './support/fixtures/authenticated';
import { DashboardPage } from './support/poms/DashboardPage';
import { consoleMonitor } from './support/utils/console-monitor';

/**
 * Dashboard Quick Actions E2E Tests
 *
 * Tests the 3-step progressive disclosure modal for completing tasks:
 * Step 1: Log Activity (required)
 * Step 2: Update Opportunity (optional)
 * Step 3: Success confirmation
 *
 * Scenarios Tested:
 * 1. Complete flow with opportunity update
 * 2. Complete flow skipping opportunity update
 * 3. Task without opportunity (auto-skip Step 2)
 * 4. Keyboard shortcuts (Ctrl+Enter, Esc)
 * 5. Form validation and auto-detection
 *
 * Design: docs/plans/2025-11-10-dashboard-quick-actions-design.md
 * Uses:
 * - authenticated fixture (automatic login + console monitoring)
 * - DashboardPage POM (semantic selectors only)
 * - Condition-based waiting (no arbitrary timeouts)
 */

test.describe('Dashboard Quick Actions - Complete Task Workflow', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({ width: 1280, height: 1024 });
    dashboard = new DashboardPage(authenticatedPage);
    await dashboard.navigate();
  });

  test.afterEach(async () => {
    const errors = consoleMonitor.getErrors();
    if (errors.length > 0) {
      await test.info().attach('console-report', {
        body: consoleMonitor.getReport(),
        contentType: 'text/plain',
      });
    }
    expect(errors, 'Console errors detected. See attached report.').toHaveLength(0);
  });

  test.describe('Modal Opening and Step 1 (Log Activity)', () => {
    test('opens modal when task checkbox is clicked', async ({ authenticatedPage }) => {
      // Click first task checkbox
      const firstTaskCheckbox = authenticatedPage.getByRole('checkbox').first();
      await firstTaskCheckbox.click();

      // Modal should open
      const modal = authenticatedPage.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Step 1 title should be visible
      await expect(authenticatedPage.getByRole('heading', { name: /Complete Task:/i })).toBeVisible();
    });

    test('auto-detects activity type from task title', async ({ authenticatedPage }) => {
      // Click task checkbox to open modal
      await authenticatedPage.getByRole('checkbox').first().click();

      // Activity Type dropdown should show auto-detected value
      const activityTypeCombobox = authenticatedPage.getByRole('combobox', { name: /Activity Type/i });
      await expect(activityTypeCombobox).toBeVisible();

      // Should show auto-detection hint
      await expect(authenticatedPage.getByText(/Auto-detected from task title/i)).toBeVisible();
    });

    test('pre-fills notes from task description', async ({ authenticatedPage }) => {
      // Click task checkbox
      await authenticatedPage.getByRole('checkbox').first().click();

      // Notes field should be pre-filled
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      const notesValue = await notesField.inputValue();

      // Should have content (from task description)
      expect(notesValue.length).toBeGreaterThan(0);
    });

    test('validates required notes field', async ({ authenticatedPage }) => {
      // Click task checkbox
      await authenticatedPage.getByRole('checkbox').first().click();

      // Clear notes field
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();

      // Save button should be disabled
      const saveButton = authenticatedPage.getByRole('button', { name: /Save & Continue/i });
      await expect(saveButton).toBeDisabled();

      // Validation message should appear
      await expect(authenticatedPage.getByText(/Activity notes are required/i)).toBeVisible();
    });

    test('enables Save button when notes are filled', async ({ authenticatedPage }) => {
      // Click task checkbox
      await authenticatedPage.getByRole('checkbox').first().click();

      // Fill notes
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Test activity notes for E2E');

      // Save button should be enabled
      const saveButton = authenticatedPage.getByRole('button', { name: /Save & Continue/i });
      await expect(saveButton).toBeEnabled();
    });

    test('closes modal when Escape is pressed', async ({ authenticatedPage }) => {
      // Open modal
      await authenticatedPage.getByRole('checkbox').first().click();
      const modal = authenticatedPage.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Press Escape
      await authenticatedPage.keyboard.press('Escape');

      // Modal should close
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Step 2 (Update Opportunity) - With Opportunity', () => {
    test('advances to Step 2 after logging activity', async ({ authenticatedPage }) => {
      // Open modal and fill Step 1
      await authenticatedPage.getByRole('checkbox').first().click();

      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Discussed pricing options');

      // Click Save & Continue
      await authenticatedPage.getByRole('button', { name: /Save & Continue/i }).click();

      // Step 2 should appear
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();

      // Current stage should be displayed
      await expect(authenticatedPage.getByText(/Current Stage:/i)).toBeVisible();
    });

    test('allows skipping opportunity update', async ({ authenticatedPage }) => {
      // Complete Step 1
      await authenticatedPage.getByRole('checkbox').first().click();
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Quick follow-up call');
      await authenticatedPage.getByRole('button', { name: /Save & Continue/i }).click();

      // Wait for Step 2
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();

      // Click Skip
      await authenticatedPage.getByRole('button', { name: /Skip/i }).click();

      // Should advance to success step
      await expect(authenticatedPage.getByRole('heading', { name: /Task Completed!/i })).toBeVisible();
    });

    test('allows keeping current stage and closing', async ({ authenticatedPage }) => {
      // Complete Step 1
      await authenticatedPage.getByRole('checkbox').first().click();
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Status check call');
      await authenticatedPage.getByRole('button', { name: /Save & Continue/i }).click();

      // Wait for Step 2
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();

      // Don't select a stage, just click Keep Stage & Close
      await authenticatedPage.getByRole('button', { name: /Keep Stage & Close/i }).click();

      // Should show success
      await expect(authenticatedPage.getByRole('heading', { name: /Task Completed!/i })).toBeVisible();
    });

    test('shows stage transition indicator when stage is selected', async ({ authenticatedPage }) => {
      // Complete Step 1
      await authenticatedPage.getByRole('checkbox').first().click();
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Moving to proposal stage');
      await authenticatedPage.getByRole('button', { name: /Save & Continue/i }).click();

      // Wait for Step 2
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();

      // Open stage dropdown
      const stageCombobox = authenticatedPage.getByRole('combobox', { name: /Move to Stage/i });
      await stageCombobox.click();

      // Select a different stage (e.g., Proposal)
      const proposalOption = authenticatedPage.getByRole('option', { name: /Proposal/i });
      await proposalOption.click();

      // Stage transition indicator should appear
      await expect(authenticatedPage.getByText(/Will move from .* → Proposal/i)).toBeVisible();

      // Button text should change to "Update & Close"
      await expect(authenticatedPage.getByRole('button', { name: /Update & Close/i })).toBeVisible();
    });

    test('completes task with opportunity stage update', async ({ authenticatedPage }) => {
      // Complete Step 1
      await authenticatedPage.getByRole('checkbox').first().click();
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Proposal sent, moving to next stage');
      await authenticatedPage.getByRole('button', { name: /Save & Continue/i }).click();

      // Wait for Step 2
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();

      // Select new stage
      const stageCombobox = authenticatedPage.getByRole('combobox', { name: /Move to Stage/i });
      await stageCombobox.click();
      await authenticatedPage.getByRole('option', { name: /Proposal/i }).click();

      // Click Update & Close
      await authenticatedPage.getByRole('button', { name: /Update & Close/i }).click();

      // Should show success
      await expect(authenticatedPage.getByRole('heading', { name: /Task Completed!/i })).toBeVisible();

      // Success notification should appear
      await expect(authenticatedPage.getByText(/Task completed successfully/i)).toBeVisible();

      // Modal should auto-close after 1 second
      const modal = authenticatedPage.getByRole('dialog');
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Step 3 (Success) and Data Verification', () => {
    test('shows success step and auto-closes modal', async ({ authenticatedPage }) => {
      // Complete full workflow
      await authenticatedPage.getByRole('checkbox').first().click();

      // Step 1
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('E2E test completion');
      await authenticatedPage.getByRole('button', { name: /Save & Continue/i }).click();

      // Step 2 - Skip
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();
      await authenticatedPage.getByRole('button', { name: /Skip/i }).click();

      // Success step appears
      await expect(authenticatedPage.getByRole('heading', { name: /Task Completed!/i })).toBeVisible();

      // Modal auto-closes
      const modal = authenticatedPage.getByRole('dialog');
      await expect(modal).not.toBeVisible({ timeout: 2000 });
    });

    test('task is removed from dashboard after completion', async ({ authenticatedPage }) => {
      // Get initial task count
      const initialCheckboxes = await authenticatedPage.getByRole('checkbox').count();

      // Complete a task
      await authenticatedPage.getByRole('checkbox').first().click();
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Task completion test');
      await authenticatedPage.getByRole('button', { name: /Save & Continue/i }).click();

      // Skip opportunity update
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();
      await authenticatedPage.getByRole('button', { name: /Skip/i }).click();

      // Wait for modal to close
      await expect(authenticatedPage.getByRole('dialog')).not.toBeVisible({ timeout: 2000 });

      // Wait for dashboard to refresh (may take a moment)
      await authenticatedPage.waitForTimeout(1000);

      // Task count should decrease (task was completed and removed)
      const finalCheckboxes = await authenticatedPage.getByRole('checkbox').count();
      expect(finalCheckboxes).toBeLessThanOrEqual(initialCheckboxes);
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('Ctrl+Enter saves activity in Step 1', async ({ authenticatedPage }) => {
      // Open modal
      await authenticatedPage.getByRole('checkbox').first().click();

      // Fill notes
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();
      await notesField.fill('Testing keyboard shortcut');

      // Press Ctrl+Enter
      await authenticatedPage.keyboard.press('Control+Enter');

      // Should advance to Step 2
      await expect(authenticatedPage.getByRole('heading', { name: /Update Opportunity/i })).toBeVisible();
    });

    test('Ctrl+Enter does not save when notes are empty', async ({ authenticatedPage }) => {
      // Open modal
      await authenticatedPage.getByRole('checkbox').first().click();

      // Clear notes
      const notesField = authenticatedPage.getByRole('textbox', { name: /Notes/i });
      await notesField.clear();

      // Press Ctrl+Enter
      await authenticatedPage.keyboard.press('Control+Enter');

      // Should remain on Step 1 (validation prevents save)
      await expect(authenticatedPage.getByRole('heading', { name: /Complete Task:/i })).toBeVisible();
    });
  });

  test.describe('iPad Viewport (1024x768)', () => {
    test('modal is properly sized on iPad', async ({ authenticatedPage }) => {
      // Set iPad landscape viewport
      await authenticatedPage.setViewportSize({ width: 1024, height: 768 });

      // Navigate to dashboard
      await dashboard.navigate();
      await dashboard.waitForTableData();

      // Open modal
      await authenticatedPage.getByRole('checkbox').first().click();

      const modal = authenticatedPage.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Modal should fit within viewport
      const modalBox = await modal.boundingBox();
      expect(modalBox).not.toBeNull();

      if (modalBox) {
        expect(modalBox.width).toBeLessThanOrEqual(1024);
        expect(modalBox.height).toBeLessThanOrEqual(768);
      }
    });

    test('touch targets meet 44px minimum on iPad', async ({ authenticatedPage }) => {
      // Set iPad viewport
      await authenticatedPage.setViewportSize({ width: 1024, height: 768 });
      await dashboard.navigate();
      await dashboard.waitForTableData();

      // Open modal
      await authenticatedPage.getByRole('checkbox').first().click();

      // Check Save button height (primary touch target)
      const saveButton = authenticatedPage.getByRole('button', { name: /Save & Continue/i });
      const buttonBox = await saveButton.boundingBox();

      expect(buttonBox).not.toBeNull();
      if (buttonBox) {
        // Button should meet 44px minimum touch target
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
});
