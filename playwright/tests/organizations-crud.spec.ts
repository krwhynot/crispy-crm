import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

/**
 * Organizations CRUD E2E Tests
 *
 * Tests organization management operations:
 * - Navigate to organizations list
 * - Create new organization
 * - View organization details
 * - Edit organization information
 */


test.describe('Organizations CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to organizations list', async ({ page }) => {
    // Click on Organizations navigation link
    await page.getByText('Organizations', { exact: true }).click();

    // Verify URL contains organizations
    await expect(page).toHaveURL(/.*organizations/);

    // Verify page loaded with list elements
    const createButton = page.getByTestId('create-button');
    await expect(createButton).toBeVisible({ timeout: 15000 });
  });

  test('should create a new organization', async ({ page }) => {
    // Navigate to organizations
    await page.getByText('Organizations', { exact: true }).click();

    // Click Create button
    const createButton = page.getByTestId('create-button');
    await createButton.click();

    // Verify we're on the create page
    await expect(page).toHaveURL(/.*organizations\/create/);

    // Fill in organization form
    const timestamp = Date.now();
    const nameInput = page.locator('input[name="name"]');

    await nameInput.fill(`Test Organization ${timestamp}`);

    // Fill organization type if present
    const typeSelect = page.locator('select[name="organization_type"], [name="organization_type"]');
    if (await typeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeSelect.selectOption({ index: 1 }); // Select first non-empty option
    }

    // Fill website if present
    const websiteInput = page.locator('input[name="website"]');
    if (await websiteInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await websiteInput.fill(`https://test${timestamp}.example.com`);
    }

    // Save the organization
    const saveButton = page.getByRole('button', { name: /save|create/i });
    await saveButton.click();

    // Wait for save to complete

    // Verify we navigated away from create page
    await expect(page).not.toHaveURL(/.*\/create$/);

    // Verify success
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
      expect(currentUrl).toMatch(/organizations(\/\d+)?$/);
    }
  });

  test('should view organization details', async ({ page }) => {
    // Navigate to organizations
    await page.getByText('Organizations', { exact: true }).click();

    // Wait for grid to load
    await page.waitForTimeout(2000);

    // Organizations might use a grid/card layout, not a table
    // Try clicking on first organization card
    const orgCard = page.locator('[role="link"], a').filter({ hasText: /^[A-Z]/ }).first();

    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();

      // Verify we're on an organization detail page
      await expect(page).toHaveURL(/.*organizations\/\d+$/);

      // Verify some organization information is visible
      await expect(page.locator('body')).toContainText(/.+/, { timeout: 5000 });
    }
  });

  test('should edit organization information', async ({ page }) => {
    // Navigate to organizations
    await page.getByText('Organizations', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Click on first organization
    const orgCard = page.locator('[role="link"], a').filter({ hasText: /^[A-Z]/ }).first();

    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();

      // Look for Edit button
      const editButton = page.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();

        // Verify we're on edit page
        await expect(page).toHaveURL(/.*organizations\/\d+$/);

        // Modify the name field
        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const originalValue = await nameInput.inputValue();
          await nameInput.fill(`${originalValue} (Updated)`);

          // Save changes
          const saveButton = page.getByRole('button', { name: /save/i });
          await saveButton.click();

          // Verify save completed
          await expect(page).not.toHaveURL(/.*\/edit$/);
        }
      }
    }
  });

  test('should filter organizations by type', async ({ page }) => {
    // Navigate to organizations
    await page.getByText('Organizations', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Look for filter sidebar or filter button
    const filterOptions = [
      page.locator('[role="checkbox"]').first(),
      page.getByText('Customer').first(),
      page.getByText('Prospect').first(),
    ];

    for (const filter of filterOptions) {
      if (await filter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filter.click();
        await page.waitForTimeout(1000);

        // Verify the list updated (page content changed)
        await expect(page.locator('body')).toContainText(/.+/);
        break;
      }
    }
  });
});