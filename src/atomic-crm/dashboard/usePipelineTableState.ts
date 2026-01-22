import { useState, useCallback, useMemo } from "react";
import type { PrincipalPipelineRow, Momentum } from "./types";

export type SortField = "name" | "totalPipeline" | "activeThisWeek" | "activeLastWeek" | "momentum";
export type SortDirection = "ascending" | "descending" | "none";

interface UsePipelineTableStateOptions {
  data: PrincipalPipelineRow[] | undefined;
}

/**
 * Hook for managing PrincipalPipelineTable state
 *
 * Handles:
 * - Search filtering
 * - Momentum filtering
 * - Sorting by column
 * - ARIA sort attributes
 */
export function usePipelineTableState({ data }: UsePipelineTableStateOptions) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ascending");
  const [searchQuery, setSearchQuery] = useState("");
  const [momentumFilters, setMomentumFilters] = useState<Set<Momentum>>(new Set());

  // Handle momentum filter toggle
  const toggleMomentumFilter = useCallback((momentum: Momentum) => {
    setMomentumFilters((prev) => {
      const next = new Set(prev);
      if (next.has(momentum)) {
        next.delete(momentum);
      } else {
        next.add(momentum);
      }
      return next;
    });
  }, []);

  // Handle column header click for sorting
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        // Toggle direction: ascending -> descending -> ascending
        setSortDirection((prev) => (prev === "ascending" ? "descending" : "ascending"));
      } else {
        // New field: start with ascending for name, descending for numeric fields
        setSortField(field);
        setSortDirection(field === "name" ? "ascending" : "descending");
      }
    },
    [sortField]
  );

  // Filter data based on search query and momentum filters
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data;

    let result = data;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((row) => row.name.toLowerCase().includes(query));
    }

    // Apply momentum filter (if any filters selected)
    if (momentumFilters.size > 0) {
      result = result.filter((row) => momentumFilters.has(row.momentum));
    }

    return result;
  }, [data, searchQuery, momentumFilters]);

  // Sort data based on current sort state
  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "totalPipeline":
          comparison = a.totalPipeline - b.totalPipeline;
          break;
        case "activeThisWeek":
          comparison = a.activeThisWeek - b.activeThisWeek;
          break;
        case "activeLastWeek":
          comparison = a.activeLastWeek - b.activeLastWeek;
          break;
        case "momentum": {
          const momentumOrder = { increasing: 3, steady: 2, decreasing: 1, stale: 0 };
          comparison = momentumOrder[a.momentum] - momentumOrder[b.momentum];
          break;
        }
      }

      return sortDirection === "descending" ? -comparison : comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Get aria-sort value for a column
  const getAriaSortValue = useCallback(
    (field: SortField): "ascending" | "descending" | "none" => {
      if (sortField === field) return sortDirection;
      return "none";
    },
    [sortField, sortDirection]
  );

  return {
    // State
    sortField,
    sortDirection,
    searchQuery,
    momentumFilters,

    // Setters
    setSearchQuery,

    // Actions
    handleSort,
    toggleMomentumFilter,

    // Derived data
    sortedData,
    getAriaSortValue,
  };
}
