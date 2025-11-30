import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Form Test Helpers - Shared utilities for form E2E testing
 *
 * Provides:
 * - Validation error detection
 * - Form state assertions
 * - Common form interactions
 *
 * Required by playwright-e2e-testing skill
 */

/**
 * Get validation error message for a field
 * Handles React Admin's error message rendering patterns
 */
export async function getFieldError(page: Page, fieldName: string): Promise<string | null> {
  // Try multiple patterns for error messages
  const errorPatterns = [
    // React Admin pattern: aria-describedby error
    `[aria-invalid="true"][name*="${fieldName}"] ~ [role="alert"]`,
    // shadcn/ui FormMessage pattern
    `[data-slot="form-item"]:has([name*="${fieldName}"]) [data-slot="form-message"]`,
    // Generic error below field
    `label:has-text("${fieldName}") ~ .text-destructive`,
    // Zod validation error pattern
    `.field-error:has-text("${fieldName}")`,
  ];

  for (const pattern of errorPatterns) {
    const errorEl = page.locator(pattern).first();
    if (await errorEl.isVisible({ timeout: 1000 }).catch(() => false)) {
      return await errorEl.textContent();
    }
  }

  // Try getByRole for alert near field
  const fieldLabel = page.getByLabel(new RegExp(fieldName, "i"));
  if (await fieldLabel.isVisible({ timeout: 500 }).catch(() => false)) {
    const parent = fieldLabel.locator("..").locator("..");
    const alert = parent.getByRole("alert").first();
    if (await alert.isVisible({ timeout: 500 }).catch(() => false)) {
      return await alert.textContent();
    }
  }

  return null;
}

/**
 * Check if a field has a validation error
 */
export async function hasFieldError(page: Page, fieldName: string): Promise<boolean> {
  const error = await getFieldError(page, fieldName);
  return error !== null && error.trim().length > 0;
}

/**
 * Assert that a field shows a specific validation error
 */
export async function expectFieldError(
  page: Page,
  fieldName: string,
  expectedMessage?: string | RegExp
): Promise<void> {
  // Wait for error to appear
  await page.waitForTimeout(300); // Allow validation to run

  const error = await getFieldError(page, fieldName);
  expect(error, `Expected error for field "${fieldName}"`).not.toBeNull();

  if (expectedMessage) {
    if (typeof expectedMessage === "string") {
      expect(error).toContain(expectedMessage);
    } else {
      expect(error).toMatch(expectedMessage);
    }
  }
}

/**
 * Assert that form has NOT been submitted (still on create page)
 */
export async function expectFormNotSubmitted(page: Page, resource: string): Promise<void> {
  // Should still be on create URL
  await expect(page).toHaveURL(new RegExp(`/#/${resource}/create`));
}

/**
 * Assert that form was submitted successfully
 */
export async function expectFormSubmitted(page: Page, resource: string): Promise<void> {
  // Should navigate to show or list page
  await expect(page).toHaveURL(
    new RegExp(`/#/${resource}/(\\d+(/show)?|$)`),
    { timeout: 10000 }
  );
}

/**
 * Wait for form to be ready (inputs visible)
 */
export async function waitForFormReady(page: Page): Promise<void> {
  // Wait for any loading skeleton to disappear
  const skeleton = page.locator('[data-testid="form-loading-skeleton"]');
  if (await skeleton.isVisible({ timeout: 500 }).catch(() => false)) {
    await skeleton.waitFor({ state: "hidden", timeout: 10000 });
  }

  // Wait for form to be visible
  await expect(page.locator("form").first()).toBeVisible({ timeout: 10000 });

  // Wait for network to settle
  await page.waitForLoadState("networkidle", { timeout: 10000 });
}

/**
 * Click save button and wait for response
 */
export async function clickSaveAndWait(page: Page): Promise<void> {
  const saveButton = page.getByRole("button", { name: /save/i });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Wait for network activity to settle
  await page.waitForTimeout(500);
}

/**
 * Fill an autocomplete/reference field
 */
export async function fillAutocompleteField(
  page: Page,
  label: string | RegExp,
  searchText: string
): Promise<void> {
  const input = page.getByLabel(label);
  await input.click();
  await input.fill(searchText);

  // Wait for dropdown to appear
  await page.waitForTimeout(500);

  // Click first option
  const option = page.getByRole("option").first();
  if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
    await option.click();
  } else {
    // Try listbox item pattern
    const listItem = page.locator('[role="listbox"] > *').first();
    if (await listItem.isVisible({ timeout: 1000 }).catch(() => false)) {
      await listItem.click();
    }
  }
}

/**
 * Select from a dropdown/combobox
 */
export async function selectFromDropdown(
  page: Page,
  triggerLabel: string | RegExp,
  optionText: string | RegExp
): Promise<void> {
  // Click the dropdown trigger
  const trigger = page.getByLabel(triggerLabel);
  await trigger.click();

  // Wait for dropdown to open
  await page.waitForTimeout(300);

  // Find and click the option
  const option = page.getByRole("option", { name: optionText });
  await option.click();
}

/**
 * Toggle a checkbox or switch
 */
export async function toggleCheckbox(
  page: Page,
  label: string | RegExp,
  checked: boolean
): Promise<void> {
  const checkbox = page.getByLabel(label);
  const isCurrentlyChecked = await checkbox.isChecked();

  if (isCurrentlyChecked !== checked) {
    await checkbox.click();
  }
}

/**
 * Fill a date picker field
 */
export async function fillDateField(
  page: Page,
  label: string | RegExp,
  date: Date
): Promise<void> {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const input = page.getByLabel(label);
  await input.fill(dateStr);
}

/**
 * Get toast notification text
 */
export async function getToastMessage(page: Page): Promise<string | null> {
  // Try multiple toast patterns
  const toastPatterns = [
    '[role="status"]',
    '[data-sonner-toast]',
    '.Toastify__toast',
    '[class*="toast"]',
  ];

  for (const pattern of toastPatterns) {
    const toast = page.locator(pattern).first();
    if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await toast.textContent();
    }
  }

  return null;
}

/**
 * Expect a success toast
 */
export async function expectSuccessToast(page: Page): Promise<void> {
  const toast = await getToastMessage(page);
  expect(toast).not.toBeNull();
  expect(toast?.toLowerCase()).toMatch(/success|created|saved|updated/);
}

/**
 * Generate unique test data with timestamp
 */
export function uniqueTestData(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}
