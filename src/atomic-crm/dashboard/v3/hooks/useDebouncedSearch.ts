import { useState, useEffect, useCallback } from "react";

// Debounce delay for search
const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Custom hook for debounced search state
 *
 * Provides immediate search term for display and debounced term for API calls.
 * Includes clearSearch callback for resetting state on popover close.
 */
export function useDebouncedSearch(delay: number = DEFAULT_DEBOUNCE_MS) {
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
