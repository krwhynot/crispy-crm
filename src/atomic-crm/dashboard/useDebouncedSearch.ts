import { useState, useEffect, useCallback } from "react";

import { SEARCH_DEBOUNCE_MS } from "@/atomic-crm/constants";

/**
 * Custom hook for debounced search state
 *
 * Provides immediate search term for display and debounced term for API calls.
 * Includes clearSearch callback for resetting state on popover close.
 */
export function useDebouncedSearch(delay: number = SEARCH_DEBOUNCE_MS) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(handler);
  }, [searchTerm, delay]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedTerm("");
  }, []);

  return { searchTerm, debouncedTerm, setSearchTerm, clearSearch };
}
