import { useState, useEffect, useCallback, useDeferredValue } from "react";

import { SEARCH_DEBOUNCE_MS } from "@/atomic-crm/constants";

interface UseDebouncedSearchOptions {
  debounceMs?: number;
}

interface UseDebouncedSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedTerm: string;
  deferredTerm: string;
  isStale: boolean;
  clearSearch: () => void;
}

/**
 * Custom hook for debounced search state with deferred value support
 *
 * Provides:
 * - `searchTerm`: Immediate value for display in input
 * - `debouncedTerm`: Debounced value for API calls
 * - `deferredTerm`: Deferred value for non-blocking filter operations
 * - `isStale`: True when deferredTerm !== debouncedTerm (useful for loading indicators)
 * - `clearSearch`: Callback for resetting state on popover close
 */
export function useDebouncedSearch(
  delayOrOptions: number | UseDebouncedSearchOptions = SEARCH_DEBOUNCE_MS
): UseDebouncedSearchResult {
  const debounceMs =
    typeof delayOrOptions === "number"
      ? delayOrOptions
      : (delayOrOptions.debounceMs ?? SEARCH_DEBOUNCE_MS);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const deferredTerm = useDeferredValue(debouncedTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    debouncedTerm,
    deferredTerm,
    isStale: deferredTerm !== debouncedTerm,
    clearSearch,
  };
}
