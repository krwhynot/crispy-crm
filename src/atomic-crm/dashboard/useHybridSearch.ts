import { useState, useEffect, useMemo, useCallback } from "react";
import { useGetList } from "react-admin";

import {
  SEARCH_DEBOUNCE_MS,
  DEFAULT_STALE_TIME_MS,
  AUTOCOMPLETE_MIN_CHARS,
} from "@/atomic-crm/constants";

/**
 * Configuration for hybrid search behavior
 */
interface HybridSearchConfig {
  /** Resource name (e.g., "contacts", "organizations") */
  resource: string;
  /** Initial page size for cached load (default: 100) */
  initialPageSize?: number;
  /** Minimum characters before triggering search (default: 2) */
  minSearchLength?: number;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Cache duration in milliseconds (default: 5 minutes) */
  staleTimeMs?: number;
  /** Sort field (default: "name") */
  sortField?: string;
  /** Additional static filters to always apply */
  additionalFilter?: Record<string, unknown>;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Return type for hybrid search hook
 */
interface HybridSearchResult<T> {
  /** Combined data from initial load + search results */
  data: T[];
  /** Loading state for initial data */
  isInitialLoading: boolean;
  /** Loading state for search query */
  isSearching: boolean;
  /** Any error from data fetching */
  error: Error | null;
  /** Current search term */
  searchTerm: string;
  /** Function to update search term (debounced internally) */
  setSearchTerm: (term: string) => void;
  /** Function to clear search and return to initial data */
  clearSearch: () => void;
  /** Refetch initial data */
  refetch: () => void;
}

/**
 * Custom hook for hybrid search pattern:
 * - Loads initial cached dataset (100 records) for instant dropdown population
 * - Switches to server-side search when user types 2+ characters
 * - Uses React Admin's useGetList with staleTime caching
 *
 * @example
 * ```tsx
 * const { data, isInitialLoading, searchTerm, setSearchTerm } = useHybridSearch<Contact>({
 *   resource: "contacts",
 *   additionalFilter: { organization_id: selectedOrgId }
 * });
 * ```
 */
export function useHybridSearch<T extends { id: number | string }>({
  resource,
  initialPageSize = 100,
  minSearchLength = AUTOCOMPLETE_MIN_CHARS,
  debounceMs = SEARCH_DEBOUNCE_MS,
  staleTimeMs = DEFAULT_STALE_TIME_MS,
  sortField = "name",
  additionalFilter = {},
  enabled = true,
}: HybridSearchConfig): HybridSearchResult<T> {
  // Track user's search input
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term updates using useEffect (proper pattern)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs]);

  // Determine if we should search server-side
  const shouldSearch = debouncedSearchTerm.length >= minSearchLength;

  // Build filter object
  const filter = useMemo(() => {
    const baseFilter = { ...additionalFilter };
    if (shouldSearch) {
      // React Admin convention: 'q' is the full-text search parameter
      return { ...baseFilter, q: debouncedSearchTerm };
    }
    return baseFilter;
  }, [additionalFilter, shouldSearch, debouncedSearchTerm]);

  // Initial data query (cached, larger page)
  const {
    data: initialData,
    isPending: isInitialLoading,
    error: initialError,
    refetch,
  } = useGetList<T>(
    resource,
    {
      pagination: { page: 1, perPage: initialPageSize },
      sort: { field: sortField, order: "ASC" },
      filter: additionalFilter, // Only use additional filter for initial load
    },
    {
      enabled: enabled && !shouldSearch,
      staleTime: staleTimeMs,
      // Keep previous data while loading new
      placeholderData: (previousData) => previousData,
    }
  );

  // Search query (only when user types enough characters)
  const {
    data: searchData,
    isPending: isSearchLoading,
    error: searchError,
  } = useGetList<T>(
    resource,
    {
      pagination: { page: 1, perPage: 50 }, // Smaller page for search
      sort: { field: sortField, order: "ASC" },
      filter,
    },
    {
      enabled: enabled && shouldSearch,
      staleTime: staleTimeMs,
      // Keep previous data while loading new
      placeholderData: (previousData) => previousData,
    }
  );

  // Select which data to show
  const data = useMemo(() => {
    if (shouldSearch) {
      return searchData ?? [];
    }
    return initialData ?? [];
  }, [shouldSearch, searchData, initialData]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }, []);

  return {
    data,
    isInitialLoading,
    isSearching: isSearchLoading,
    error: (initialError || searchError) as Error | null,
    searchTerm,
    setSearchTerm,
    clearSearch,
    refetch,
  };
}
