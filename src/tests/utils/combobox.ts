/**
 * Combobox Test Helpers
 *
 * Helper functions for testing shadcn/ui Combobox components that use
 * the cmdk (Command) component internally.
 *
 * The Combobox uses:
 * - A Button with role="combobox" as the trigger
 * - CommandInput for search (with placeholder text)
 * - CommandItem for options (uses [data-slot="command-item"])
 *
 * IMPORTANT: cmdk filtering in JSDOM can be slow. These helpers use
 * data attributes and proper waiting patterns for reliability.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export interface ComboboxTestOptions {
  /** The user event instance to use for interactions */
  user: ReturnType<typeof userEvent.setup>;
  /** Timeout for waiting operations in ms (default: 5000) */
  timeout?: number;
}

/**
 * Finds a cmdk CommandItem by its text content.
 * CommandItems have [data-slot="command-item"] attribute.
 */
function findCommandItem(text: string): HTMLElement | null {
  const items = document.querySelectorAll('[data-slot="command-item"]');
  for (const item of items) {
    if (item.textContent?.includes(text)) {
      return item as HTMLElement;
    }
  }
  return null;
}

/**
 * Opens a Combobox, types to filter, and selects an option.
 *
 * @param triggerText - The text shown on the combobox trigger button (e.g., "Select or type city...")
 * @param searchText - Text to type in the search input to filter options
 * @param optionText - The option text to click (must be visible after filtering)
 * @param options - User event instance and optional timeout
 *
 * @example
 * ```ts
 * await selectComboboxOption(
 *   "Select or type city...",
 *   "Chicago",
 *   "Chicago",
 *   { user }
 * );
 * ```
 */
export async function selectComboboxOption(
  triggerText: string,
  searchText: string,
  optionText: string,
  { user, timeout = 5000 }: ComboboxTestOptions
): Promise<void> {
  // Find and click the combobox trigger button
  const trigger = screen.getByText(triggerText);
  await user.click(trigger);

  // Wait for the popover to open and find the search input by placeholder
  const searchInput = await screen.findByPlaceholderText(/search/i, {}, { timeout });

  // Type the search text
  await user.type(searchInput, searchText);

  // Wait for the command item to appear and click it
  await waitFor(
    () => {
      const item = findCommandItem(optionText);
      if (!item) {
        throw new Error(`CommandItem with text "${optionText}" not found`);
      }
    },
    { timeout }
  );

  const item = findCommandItem(optionText);
  if (!item) {
    throw new Error(`CommandItem with text "${optionText}" not found after wait`);
  }
  await user.click(item);
}

/**
 * Opens a Combobox by its currently displayed value and selects a new option.
 * Use this when the combobox already has a value selected.
 *
 * @param currentValue - The currently displayed value on the trigger
 * @param searchText - Text to type in the search input
 * @param optionText - The option text to click
 * @param options - User event instance and optional timeout
 */
export async function changeComboboxOption(
  currentValue: string,
  searchText: string,
  optionText: string,
  { user, timeout = 5000 }: ComboboxTestOptions
): Promise<void> {
  const trigger = screen.getByText(currentValue);
  await user.click(trigger);

  const searchInput = await screen.findByPlaceholderText(/search/i, {}, { timeout });
  await user.type(searchInput, searchText);

  await waitFor(
    () => {
      const item = findCommandItem(optionText);
      if (!item) {
        throw new Error(`CommandItem with text "${optionText}" not found`);
      }
    },
    { timeout }
  );

  const item = findCommandItem(optionText);
  if (!item) {
    throw new Error(`CommandItem with text "${optionText}" not found after wait`);
  }
  await user.click(item);
}

/**
 * Opens a Combobox and types text without selecting an option.
 * Useful for testing freeform input or filtering behavior.
 *
 * @param triggerText - The text shown on the combobox trigger button
 * @param text - Text to type in the search input
 * @param options - User event instance
 */
export async function typeInCombobox(
  triggerText: string,
  text: string,
  { user, timeout = 5000 }: ComboboxTestOptions
): Promise<void> {
  const trigger = screen.getByText(triggerText);
  await user.click(trigger);

  const searchInput = await screen.findByPlaceholderText(/search/i, {}, { timeout });
  await user.type(searchInput, text);
}

/**
 * Clears a Combobox by selecting the same value again (toggle off).
 * Note: This only works if the Combobox supports clearing by re-selecting.
 *
 * @param currentValue - The currently displayed value on the trigger
 * @param options - User event instance
 */
export async function clearCombobox(
  currentValue: string,
  { user, timeout = 5000 }: ComboboxTestOptions
): Promise<void> {
  const trigger = screen.getByText(currentValue);
  await user.click(trigger);

  await waitFor(
    () => {
      const item = findCommandItem(currentValue);
      if (!item) {
        throw new Error(`CommandItem with text "${currentValue}" not found`);
      }
    },
    { timeout }
  );

  const item = findCommandItem(currentValue);
  if (!item) {
    throw new Error(`CommandItem with text "${currentValue}" not found after wait`);
  }
  await user.click(item);
}

/**
 * Finds a combobox trigger by its associated label text.
 *
 * @param labelText - The label text (e.g., "City *")
 * @returns The combobox trigger button element
 */
export function findComboboxByLabel(labelText: string): HTMLElement {
  const label = screen.getByText(labelText);
  const container = label.closest(".space-y-2") || label.parentElement;

  if (!container) {
    throw new Error(`Could not find container for label: ${labelText}`);
  }

  const trigger = container.querySelector('[role="combobox"]');

  if (!trigger) {
    throw new Error(`Could not find combobox trigger for label: ${labelText}`);
  }

  return trigger as HTMLElement;
}

/**
 * Selects an option in a combobox found by its label.
 *
 * @param labelText - The label text (e.g., "City *")
 * @param searchText - Text to type in the search input
 * @param optionText - The option text to click
 * @param options - User event instance and optional timeout
 */
export async function selectComboboxByLabel(
  labelText: string,
  searchText: string,
  optionText: string,
  { user, timeout = 5000 }: ComboboxTestOptions
): Promise<void> {
  const trigger = findComboboxByLabel(labelText);
  await user.click(trigger);

  const searchInput = await screen.findByPlaceholderText(/search/i, {}, { timeout });
  await user.type(searchInput, searchText);

  await waitFor(
    () => {
      const item = findCommandItem(optionText);
      if (!item) {
        throw new Error(`CommandItem with text "${optionText}" not found`);
      }
    },
    { timeout }
  );

  const item = findCommandItem(optionText);
  if (!item) {
    throw new Error(`CommandItem with text "${optionText}" not found after wait`);
  }
  await user.click(item);
}

/**
 * Selects a city from the city combobox and verifies state auto-fill.
 * This is a specialized helper for the QuickAdd form.
 *
 * @param cityName - The city name to select
 * @param expectedState - The expected state abbreviation after selection
 * @param options - User event instance and optional timeout
 */
export async function selectCityAndVerifyState(
  cityName: string,
  expectedState: string,
  { user, timeout = 5000 }: ComboboxTestOptions
): Promise<void> {
  // Find the city combobox trigger (initially shows "Select or type city...")
  const cityTrigger = screen.getByText("Select or type city...");
  await user.click(cityTrigger);

  // Wait for and type in the search input
  const searchInput = await screen.findByPlaceholderText("Search cities...", {}, { timeout });
  await user.type(searchInput, cityName);

  // Wait for the city option to appear and click it
  await waitFor(
    () => {
      const item = findCommandItem(cityName);
      if (!item) {
        throw new Error(`City "${cityName}" not found in options`);
      }
    },
    { timeout }
  );

  const cityItem = findCommandItem(cityName);
  if (!cityItem) {
    throw new Error(`City "${cityName}" not found after wait`);
  }
  await user.click(cityItem);

  // Verify state auto-filled
  await waitFor(
    () => {
      const stateInput = screen.getByLabelText(/state/i);
      expect(stateInput).toHaveValue(expectedState);
    },
    { timeout }
  );
}
