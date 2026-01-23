/**
 * Standard props for debounced AutocompleteInput components
 *
 * Why 300ms debounce: Balances responsiveness with API efficiency
 * Why 2+ chars: Prevents overly broad searches that return too many results
 *
 * @see https://marmelab.com/react-admin/AutocompleteInput.html
 */

import {
  SEARCH_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_CHARS as APP_AUTOCOMPLETE_MIN_CHARS,
} from "@/atomic-crm/constants";

export const AUTOCOMPLETE_DEBOUNCE_MS = SEARCH_DEBOUNCE_MS;
export const AUTOCOMPLETE_MIN_CHARS = APP_AUTOCOMPLETE_MIN_CHARS;

/**
 * ReferenceInput prop to prevent API calls until minimum chars typed.
 * IMPORTANT: shouldRenderSuggestions only hides dropdown, this actually blocks fetch.
 *
 * FIX: Updated to handle both "q" and specific field filters (like "name@ilike").
 * Previously, this only checked for 'q', causing filters like { "name@ilike": "%abc%" } to fail.
 *
 * @example
 * <ReferenceInput enableGetChoices={enableGetChoices} ... />
 */
export const enableGetChoices = (filters: Record<string, unknown>) => {
  // Find the first string value in filters (handles q, name@ilike, title@ilike, etc.)
  const searchValue = Object.values(filters).find((v): v is string => typeof v === "string");

  if (!searchValue) return false;

  // Strip % wildcards from ILIKE patterns to get actual character count
  // getAutocompleteProps adds %...%, so "a" becomes "%a%" (3 chars).
  // We must strip them to ensure the user actually typed enough characters.
  const realInput = searchValue.replace(/%/g, "");

  return realInput.length >= AUTOCOMPLETE_MIN_CHARS;
};

/**
 * Standard shouldRenderSuggestions function
 * Requires minimum 2 characters before triggering search
 */
export const shouldRenderSuggestions = (val: string) => val.trim().length >= AUTOCOMPLETE_MIN_CHARS;

/**
 * Get standard autocomplete props for single-field ILIKE search
 * Use for explicit field searches where data provider callbacks don't apply
 *
 * @example
 * <AutocompleteInput {...getAutocompleteProps('name')} />
 */
export const getAutocompleteProps = (filterField: string = "name") => ({
  debounce: AUTOCOMPLETE_DEBOUNCE_MS,
  filterToQuery: (searchText: string) =>
    searchText ? { [`${filterField}@ilike`]: `%${searchText}%` } : {},
  shouldRenderSuggestions,
});

/**
 * Get standard autocomplete props for resources using q-search
 * Use for contacts, organizations, opportunities, products, sales
 * (resources with transformQToIlikeSearch callbacks in data provider)
 *
 * @example
 * <AutocompleteInput {...getQSearchAutocompleteProps()} />
 */
export const getQSearchAutocompleteProps = () => ({
  debounce: AUTOCOMPLETE_DEBOUNCE_MS,
  filterToQuery: (searchText: string) => (searchText ? { q: searchText } : {}),
  shouldRenderSuggestions,
});

/**
 * Multi-field ILIKE search for contacts by first_name + last_name
 * Use when searching contacts outside of ReferenceInput with q-search
 *
 * @example
 * <AutocompleteInput {...getContactSearchAutocompleteProps()} />
 */
export const getContactSearchAutocompleteProps = () => ({
  debounce: AUTOCOMPLETE_DEBOUNCE_MS,
  filterToQuery: (searchText: string) =>
    searchText ? { "first_name,last_name@ilike": `%${searchText}%` } : {},
  shouldRenderSuggestions,
});
