/**
 * Combobox Test Helpers
 *
 * Helper functions for testing shadcn/ui Combobox components that use
 * the cmdk (Command) component internally.
 *
 * The Combobox uses:
 * - A Button with role="combobox" as the trigger
 * - CommandInput for search (placeholder text)
 * - CommandItem for options (uses cmdk's internal selection)
 */

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export interface ComboboxTestOptions {
  /** The user event instance to use for interactions */
  user: ReturnType<typeof userEvent.setup>;
  /** Timeout for waiting operations in ms (default: 3000) */
  timeout?: number;
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
  { user, timeout = 3000 }: ComboboxTestOptions
): Promise<void> {
  // Find and click the combobox trigger button
  const trigger = screen.getByText(triggerText);
  await user.click(trigger);

  // Wait for the popover to open and find the search input
  const searchInput = await screen.findByRole("combobox", { name: "" });

  // Type the search text
  await user.type(searchInput, searchText);

  // Wait for and click the option
  // cmdk uses data-value attribute, but we can find by text content
  await waitFor(
    () => {
      const option = screen.getByText(optionText);
      expect(option).toBeInTheDocument();
    },
    { timeout }
  );

  const option = screen.getByText(optionText);
  await user.click(option);
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
  { user, timeout = 3000 }: ComboboxTestOptions
): Promise<void> {
  const trigger = screen.getByText(currentValue);
  await user.click(trigger);

  const searchInput = await screen.findByRole("combobox", { name: "" });
  await user.type(searchInput, searchText);

  await waitFor(
    () => {
      const option = screen.getByText(optionText);
      expect(option).toBeInTheDocument();
    },
    { timeout }
  );

  const option = screen.getByText(optionText);
  await user.click(option);
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
  { user }: ComboboxTestOptions
): Promise<void> {
  const trigger = screen.getByText(triggerText);
  await user.click(trigger);

  const searchInput = await screen.findByRole("combobox", { name: "" });
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
  { user }: ComboboxTestOptions
): Promise<void> {
  const trigger = screen.getByText(currentValue);
  await user.click(trigger);

  // Find and click the currently selected option to toggle it off
  const option = await screen.findByText(currentValue);
  await user.click(option);
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
  { user, timeout = 3000 }: ComboboxTestOptions
): Promise<void> {
  const trigger = findComboboxByLabel(labelText);
  await user.click(trigger);

  const searchInput = await screen.findByRole("combobox", { name: "" });
  await user.type(searchInput, searchText);

  await waitFor(
    () => {
      const option = screen.getByText(optionText);
      expect(option).toBeInTheDocument();
    },
    { timeout }
  );

  const option = screen.getByText(optionText);
  await user.click(option);
}
