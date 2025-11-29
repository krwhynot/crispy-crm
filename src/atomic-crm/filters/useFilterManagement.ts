import { useMemo } from "react";
import { useListContext } from "ra-core";
import type { FilterValue } from "./types";

/**
 * Re-export types for backward compatibility
 * (consumers may import FilterValue/FilterValues from this file)
 */
export type { FilterValue };
export type FilterValues = Record<string, FilterValue>;

/**
 * Primitive filter value type for add/remove/toggle operations
 *
 * These functions operate on individual values that may be added to
 * or removed from array filters. Arrays are not valid here because:
 * - addFilterValue adds ONE value to an array or sets a single value
 * - removeFilterValue removes ONE value from an array
 * - toggleFilterValue toggles ONE value's presence
 *
 * Note: We exclude undefined from the type because adding/removing
 * undefined doesn't make semantic sense for filters.
 */
type PrimitiveFilterValue = string | number | boolean | null;

/**
 * Custom hook for managing filter state and operations
 * Consolidates filter logic to avoid duplication
 *
 * @returns Filter management utilities with type-safe value operations
 *
 * @example
 * ```typescript
 * const { addFilterValue, removeFilterValue, toggleFilterValue } = useFilterManagement();
 *
 * // Add a single stage to the filter (accumulates in array)
 * addFilterValue("stage", "new_lead");
 *
 * // Remove a specific value
 * removeFilterValue("stage", "closed_lost");
 *
 * // Toggle presence of a value
 * toggleFilterValue("priority", "high");
 * ```
 */
export const useFilterManagement = () => {
  const { filterValues, setFilters } = useListContext();

  /**
   * Add a value to an array filter or set a single value
   *
   * Behavior:
   * - If current filter is an array: adds value if not present
   * - If current filter is a single value: converts to array with both values
   * - If no current filter: sets as single value
   *
   * @param key - The filter key (e.g., "stage", "priority")
   * @param value - The primitive value to add (string, number, boolean, or null)
   */
  const addFilterValue = (key: string, value: PrimitiveFilterValue): void => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      // Add to existing array if not already present
      // Note: includes() works correctly with primitives
      if (!currentValue.includes(value as never)) {
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
   * Remove a value from an array filter or clear a single-value filter
   *
   * Behavior:
   * - If current filter is an array: removes the specific value
   * - If array becomes empty: removes the filter entirely
   * - If current filter is a single value: removes the filter entirely
   *
   * @param key - The filter key
   * @param valueToRemove - The primitive value to remove
   */
  const removeFilterValue = (key: string, valueToRemove: PrimitiveFilterValue): void => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      const newValue = currentValue.filter((v) => v !== valueToRemove);

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
   * Toggle a value's presence in a filter
   *
   * Behavior:
   * - If value exists in array: removes it
   * - If value doesn't exist in array: adds it
   * - If current value equals toggle value: removes filter
   * - Otherwise: adds the value
   *
   * @param key - The filter key
   * @param value - The primitive value to toggle
   */
  const toggleFilterValue = (key: string, value: PrimitiveFilterValue): void => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      if (currentValue.includes(value as never)) {
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
   *
   * @param key - The filter key to clear
   */
  const clearFilter = (key: string): void => {
    if (!filterValues?.[key]) return;

    const { [key]: _, ...rest } = filterValues;
    setFilters(rest);
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = (): void => {
    setFilters({});
  };

  /**
   * Check if a filter is active (has non-empty value)
   *
   * @param key - The filter key to check
   * @returns true if the filter has an active value
   */
  const isFilterActive = (key: string): boolean => {
    const value = filterValues?.[key];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== "";
  };

  /**
   * Get count of active filters (excluding internal/system filters)
   */
  const activeFilterCount = useMemo(() => {
    if (!filterValues) return 0;

    return Object.entries(filterValues).filter(([key, value]) => {
      // Skip internal filters
      if (key.includes("@") || key === "deleted_at") return false;

      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
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
