import { test, expect } from '../../support/fixtures/authenticated';
import { ContactsListPage } from '../../support/poms/ContactsListPage';
import { ContactFormPage } from '../../support/poms/ContactFormPage';
import { ContactShowPage } from '../../support/poms/ContactShowPage';
import { consoleMonitor } from '../../support/utils/console-monitor';

/**
 * E2E tests for Contacts CRUD operations
 * Tests create, read, update, and delete functionality
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 * - Page Object Models (all interactions via POMs)
 * - Semantic selectors only (getByRole/Label/Text)
 * - Fixtures for authentication
 * - Console monitoring for diagnostics
 * - Condition-based waiting (no waitForTimeout)
 * - Timestamp-based test data for isolation
 */

test.describe('Contacts CRUD Operations', () => {
  test('CREATE - Create a new contact', async ({ authenticatedPage }) => {
    // Generate unique test data with timestamp
    const timestamp = Date.now();
    const testContact = {
      firstName: `TestFirst-${timestamp}`,
      lastName: `TestLast-${timestamp}`,
      email: `test-${timestamp}@example.com`,
      title: `Test Engineer ${timestamp}`,
    };

    // Initialize POMs
    const listPage = new ContactsListPage(authenticatedPage);
    const formPage = new ContactFormPage(authenticatedPage);
    const showPage = new ContactShowPage(authenticatedPage);

    // Navigate to contacts list
    await listPage.navigate();

    // Click Create button
    await listPage.clickCreate();

    // Fill and submit form
    await formPage.createContact(testContact);

    // Verify contact was created
    await showPage.expectContactVisible(testContact);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test('READ - View contact list', async ({ authenticatedPage }) => {
    const listPage = new ContactsListPage(authenticatedPage);

    // Navigate to contacts list
    await listPage.navigate();

    // Verify at least one contact is visible (from seed data)
    await listPage.expectContactsVisible();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test('READ - View contact details', async ({ authenticatedPage }) => {
    const listPage = new ContactsListPage(authenticatedPage);
    const showPage = new ContactShowPage(authenticatedPage);

    // Navigate to contacts list
    await listPage.navigate();

    // Click on first contact
    await listPage.clickFirstContact();

    // Verify contact details page loaded
    await showPage.expectPageLoaded();

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test('UPDATE - Edit a contact', async ({ authenticatedPage }) => {
    // Generate unique test data with timestamp
    const timestamp = Date.now();
    const originalContact = {
      firstName: `OriginalFirst-${timestamp}`,
      lastName: `OriginalLast-${timestamp}`,
      email: `original-${timestamp}@example.com`,
      title: `Original Title ${timestamp}`,
    };

    const updatedData = {
      firstName: `UpdatedFirst-${timestamp}`,
      lastName: `UpdatedLast-${timestamp}`,
      title: `Updated Title ${timestamp}`,
    };

    // Initialize POMs
    const listPage = new ContactsListPage(authenticatedPage);
    const formPage = new ContactFormPage(authenticatedPage);
    const showPage = new ContactShowPage(authenticatedPage);

    // Create a contact first
    await listPage.navigate();
    await listPage.clickCreate();
    await formPage.createContact(originalContact);

    // Now edit it
    await showPage.clickEdit();
    await formPage.updateContact(updatedData);

    // Verify updates
    await showPage.expectNameVisible(updatedData.firstName, updatedData.lastName);
    await showPage.expectTitleVisible(updatedData.title);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test('DELETE - Delete a contact', async ({ authenticatedPage }) => {
    // Generate unique test data with timestamp
    const timestamp = Date.now();
    const deleteContact = {
      firstName: `DeleteFirst-${timestamp}`,
      lastName: `DeleteLast-${timestamp}`,
      email: `delete-${timestamp}@example.com`,
    };

    // Initialize POMs
    const listPage = new ContactsListPage(authenticatedPage);
    const formPage = new ContactFormPage(authenticatedPage);
    const showPage = new ContactShowPage(authenticatedPage);

    // Create a contact specifically for deletion
    await listPage.navigate();
    await listPage.clickCreate();
    await formPage.createContact(deleteContact);

    // Delete it
    await showPage.deleteContact();

    // Verify redirect to list
    await expect(authenticatedPage).toHaveURL('/#/contacts');

    // Verify contact is no longer visible
    await listPage.expectContactNotVisible(deleteContact.email);

    // Assert no console errors
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
    expect(consoleMonitor.hasReactErrors()).toBe(false);
  });

  test('VALIDATION - Form validation prevents submission without required fields', async ({
    authenticatedPage,
  }) => {
    const listPage = new ContactsListPage(authenticatedPage);
    const formPage = new ContactFormPage(authenticatedPage);

    // Navigate to create page
    await listPage.navigate();
    await listPage.clickCreate();

    // Try to submit without filling required fields
    await formPage.attemptSubmit();

    // Verify we're still on create page (validation prevented submission)
    await formPage.expectStillOnForm(true);

    // Note: Console errors might include validation errors, which is expected
    // We only check for RLS errors (unexpected in this context)
    expect(consoleMonitor.hasRLSErrors()).toBe(false);
  });
});
