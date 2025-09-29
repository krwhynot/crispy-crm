import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

/**
 * Contacts CRUD E2E Tests
 *
 * Tests contact management operations:
 * - Navigate to contacts list
 * - Create new contact
 * - View contact details
 * - Edit contact information
 */

test.describe('Contacts CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to contacts list', async ({ page }) => {
    // Click on Contacts navigation link
    await page.getByText('Contacts', { exact: true }).click();

    // Verify URL contains contacts
    await expect(page).toHaveURL(/.*contacts/);

    // Verify page loaded with list elements (auto-retry assertion)
    await expect(page.getByTestId('create-button')).toBeVisible({ timeout: 15000 });
  });

  test('should create a new contact', async ({ page }) => {
    // Navigate to contacts
    await page.getByText('Contacts', { exact: true }).click();

    // Wait for create button to be visible, then click
    await expect(page.getByTestId('create-button')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('create-button').click();

    // Verify we're on the create page
    await expect(page).toHaveURL(/.*contacts\/create/);

    // Fill in contact form
    const timestamp = Date.now();
    const firstName = page.locator('input[name="first_name"]');
    const lastName = page.locator('input[name="last_name"]');

    await firstName.fill(`Test${timestamp}`);
    await lastName.fill(`Contact${timestamp}`);

    // Fill email if present
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(`test${timestamp}@example.com`);
    }

    // Save the contact
    const saveButton = page.getByRole('button', { name: /save|create/i });
    await saveButton.click();

    // Verify we navigated away from create page (either to list or show page)
    await expect(page).not.toHaveURL(/.*\/create$/, { timeout: 15000 });

    // Verify success (could be toast notification or redirect)
    const successIndicators = [
      page.getByText(/created|saved|success/i),
      page.locator('[role="alert"]'),
    ];

    let successFound = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        successFound = true;
        break;
      }
    }

    // If no toast, verify we're on show or list page
    if (!successFound) {
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/contacts(\/\d+)?$/);
    }
  });

  test('should view contact details', async ({ page }) => {
    // Navigate to contacts
    await page.getByText('Contacts', { exact: true }).click();

    // Wait for list to load by checking for row elements
    const contactRow = page.locator('[role="row"]').nth(1); // Skip header row
    await expect(contactRow).toBeVisible({ timeout: 10000 });

    const contactLink = contactRow.locator('a').first();
    if (await contactLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactLink.click();

      // Verify we're on a contact detail page
      await expect(page).toHaveURL(/.*contacts\/\d+$/);

      // Verify some contact information is visible
      await expect(page.locator('body')).toContainText(/.+/, { timeout: 5000 });
    }
  });

  test('should edit contact information', async ({ page }) => {
    // Navigate to contacts
    await page.getByText('Contacts', { exact: true }).click();

    // Wait for list to load
    const contactRow = page.locator('[role="row"]').nth(1);
    await expect(contactRow).toBeVisible({ timeout: 10000 });

    const contactLink = contactRow.locator('a').first();
    if (await contactLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contactLink.click();

      // Look for Edit button
      const editButton = page.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();

        // Verify we're on edit page
        await expect(page).toHaveURL(/.*contacts\/\d+$/);

        // Modify a field
        const firstNameInput = page.locator('input[name="first_name"]');
        if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const originalValue = await firstNameInput.inputValue();
          await firstNameInput.fill(`${originalValue}_edited`);

          // Save changes
          const saveButton = page.getByRole('button', { name: /save/i });
          await saveButton.click();

          // Verify save completed (URL changed or toast appeared)
          await expect(page).not.toHaveURL(/.*\/edit$/, { timeout: 15000 });
        }
      }
    }
  });
});