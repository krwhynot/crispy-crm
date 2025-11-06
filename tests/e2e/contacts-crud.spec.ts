import { test, expect } from '@playwright/test';

/**
 * E2E tests for Contacts CRUD operations
 * Tests create, read, update, and delete functionality
 *
 * NOTE: These tests use stored authentication state from auth.setup.ts
 */

// Test data
const testContact = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  title: 'Software Engineer',
};

const updatedContact = {
  firstName: 'Jane',
  lastName: 'Smith',
  title: 'Senior Software Engineer',
};

test.describe('Contacts CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contacts - auth is pre-loaded from storage state
    await page.goto('/#/contacts');
    await page.waitForLoadState('networkidle');
  });

  test('CREATE - Create a new contact', async ({ page }) => {
    // Click create button
    await page.click('a[href="#/contacts/create"]');
    await page.waitForURL('/#/contacts/create');

    // Fill in contact form
    await page.fill('input[name="first_name"]', testContact.firstName);
    await page.fill('input[name="last_name"]', testContact.lastName);

    // Add email - click add button first
    const emailAddButton = page.locator('button').filter({ hasText: 'Add' }).first();
    await emailAddButton.click();

    // Fill email field
    await page.fill('input[name="email.0.email"]', testContact.email);

    // Fill title
    await page.fill('input[name="title"]', testContact.title);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify contact was created
    await expect(page.getByText(`${testContact.firstName} ${testContact.lastName}`)).toBeVisible();
    await expect(page.getByText(testContact.email)).toBeVisible();
  });

  test('READ - View contact list', async ({ page }) => {
    // Verify we're on contacts list
    await expect(page).toHaveURL('/#/contacts');

    // Check for contact list elements
    const contactsList = page.locator('[role="grid"], table, .MuiDataGrid-root');
    await expect(contactsList).toBeVisible({ timeout: 5000 });

    // Verify at least one contact is displayed (from seed data)
    const contactRows = page.locator('tr, [role="row"]').filter({ hasText: /@/ });
    await expect(contactRows.first()).toBeVisible();
  });

  test('READ - View contact details', async ({ page }) => {
    // Click on first contact in the list
    const firstContact = page.locator('tr, [role="row"]').filter({ hasText: /@/ }).first();
    await firstContact.click();

    // Wait for show page
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify contact details are visible
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('UPDATE - Edit a contact', async ({ page }) => {
    // Click on first contact
    const firstContact = page.locator('tr, [role="row"]').filter({ hasText: /@/ }).first();
    await firstContact.click();
    await page.waitForURL(/\/#\/contacts\/\d+\/show/);

    // Click edit button
    const editButton = page.locator('a[href*="/edit"], button').filter({ hasText: /edit/i }).first();
    await editButton.click();
    await page.waitForURL(/\/#\/contacts\/\d+$/);

    // Update contact fields
    await page.fill('input[name="first_name"]', updatedContact.firstName);
    await page.fill('input[name="last_name"]', updatedContact.lastName);
    await page.fill('input[name="title"]', updatedContact.title);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(/\/#\/contacts\/\d+\/show/, { timeout: 10000 });

    // Verify updates
    await expect(page.getByText(`${updatedContact.firstName} ${updatedContact.lastName}`)).toBeVisible();
    await expect(page.getByText(updatedContact.title)).toBeVisible();
  });

  test('DELETE - Delete a contact', async ({ page }) => {
    // Create a contact specifically for deletion
    await page.goto('/#/contacts/create');

    await page.fill('input[name="first_name"]', 'Delete');
    await page.fill('input[name="last_name"]', 'Me');

    const emailAddButton = page.locator('button').filter({ hasText: 'Add' }).first();
    await emailAddButton.click();
    await page.fill('input[name="email.0.email"]', 'delete.me@example.com');

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/#\/contacts\/\d+\/show/);

    // Now delete it
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
    await deleteButton.click();

    // Confirm deletion in dialog
    const confirmButton = page.locator('button').filter({ hasText: /confirm|delete/i }).last();
    await confirmButton.click();

    // Verify redirect to list
    await page.waitForURL('/#/contacts', { timeout: 10000 });

    // Verify contact is no longer visible
    await expect(page.getByText('delete.me@example.com')).not.toBeVisible();
  });

  test('VALIDATION - Form validation works', async ({ page }) => {
    // Go to create page
    await page.goto('/#/contacts/create');

    // Try to submit without required fields
    await page.click('button[type="submit"]');

    // Wait a bit for validation messages
    await page.waitForTimeout(500);

    // Verify we're still on create page (form didn't submit)
    await expect(page).toHaveURL('/#/contacts/create');
  });
});
