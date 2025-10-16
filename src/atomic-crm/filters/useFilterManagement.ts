import { useMemo } from "react";
import { useListContext } from "ra-core";

/**
 * Filter value type definitions
 */
export type FilterValue = string | number | boolean | string[] | number[] | null;
export type FilterValues = Record<string, FilterValue>;

/**
 * Custom hook for managing filter state and operations
 * Consolidates filter logic to avoid duplication
 */
export const useFilterManagement = () => {
  const { filterValues, setFilters } = useListContext();

  /**
   * Add a value to an array filter or set a single value
   */
  const addFilterValue = (key: string, value: any) => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      // Add to existing array if not already present
      if (!currentValue.includes(value)) {
        setFilters({
          ...filterValues,
          [key]: [...currentValue, value],
        });
      }
    } else if (currentValue !== undefined) {
      // Convert single value to array
      setFilters({
        ...filterValues,
        [key]: [currentValue, value],
      });
    } else {
      // Set new single value
      setFilters({
        ...filterValues,
        [key]: value,
      });
    }
  };

  /**
   * Remove a value from an array filter
   */
  const removeFilterValue = (key: string, valueToRemove: any) => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      const newValue = currentValue.filter(v => v !== valueToRemove);

      if (newValue.length === 0) {
        // Remove filter entirely if array is empty
        const { [key]: _, ...rest } = filterValues;
        setFilters(rest);
      } else {
        // Update with remaining values
        setFilters({
          ...filterValues,
          [key]: newValue,
        });
      }
    } else {
      // Single value - remove the entire filter
      const { [key]: _, ...rest } = filterValues;
      setFilters(rest);
    }
  };

  /**
   * Toggle a value in an array filter
   */
  const toggleFilterValue = (key: string, value: any) => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      if (currentValue.includes(value)) {
        removeFilterValue(key, value);
      } else {
        addFilterValue(key, value);
      }
    } else if (currentValue === value) {
      removeFilterValue(key, value);
    } else {
      addFilterValue(key, value);
    }
  };

  /**
   * Clear all values for a specific filter
   */
  const clearFilter = (key: string) => {
    if (!filterValues?.[key]) return;

    const { [key]: _, ...rest } = filterValues;
    setFilters(rest);
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setFilters({});
  };

  /**
   * Check if a filter is active
   */
  const isFilterActive = (key: string): boolean => {
    const value = filterValues?.[key];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  };

  /**
   * Get active filter count
   */
  const activeFilterCount = useMemo(() => {
    if (!filterValues) return 0;

    return Object.entries(filterValues).filter(([key, value]) => {
      // Skip internal filters
      if (key.includes('@') || key === 'deleted_at') return false;

      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filterValues]);

  return {
    filterValues: filterValues || {},
    addFilterValue,
    removeFilterValue,
    toggleFilterValue,
    clearFilter,
    clearAllFilters,
    isFilterActive,
    activeFilterCount,
  };
};