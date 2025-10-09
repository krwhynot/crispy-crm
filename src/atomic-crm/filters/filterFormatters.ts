import { OPPORTUNITY_STAGE_CHOICES } from "../opportunities/stageConstants";
import { priorityChoices } from "../opportunities/priorityChoices";
import type { FilterValues, FilterChipData, SingleFilterValue} from "./types";
import { FILTER_KEYS } from "./types";

/**
 * Filter formatting utilities
 * Centralized logic for converting filter values to display labels
 */

/**
 * Format stage filter value to human-readable label
 */
export const formatStageLabel = (value: string): string => {
  const choice = OPPORTUNITY_STAGE_CHOICES.find(c => c.id === value);
  return choice?.name || value;
};

/**
 * Format priority filter value to human-readable label
 */
export const formatPriorityLabel = (value: string): string => {
  const choice = priorityChoices.find(c => c.id === value);
  return choice?.name || value;
};

/**
 * Format category filter value (pass-through for now)
 */
export const formatCategoryLabel = (value: string): string => {
  return value || 'No Category';
};

/**
 * Format a generic filter label based on the filter key
 */
export const formatFilterLabel = (
  key: string,
  value: SingleFilterValue,
  getOrganizationName?: (id: string) => string
): string => {
  // Handle special cases
  switch (key) {
    case FILTER_KEYS.STAGE:
      return formatStageLabel(String(value));

    case FILTER_KEYS.PRIORITY:
      return formatPriorityLabel(String(value));

    case FILTER_KEYS.CUSTOMER_ORGANIZATION:
      return getOrganizationName ? getOrganizationName(String(value)) : `Organization #${value}`;

    default:
      // Generic formatting for unknown filters
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (value === null || value === undefined) {
        return 'None';
      }
      return String(value);
  }
};

/**
 * Determine if a filter should be displayed in the chips panel
 */
export const shouldDisplayFilter = (key: string): boolean => {
  // Skip internal/system filters
  const hiddenFilters = [
    'deleted_at',
    'sales_id',
    'q', // search query
  ];

  // Skip PostgREST operators
  if (key.includes('@')) {
    return false;
  }

  return !hiddenFilters.includes(key);
};

/**
 * Flatten filter values for display
 * Converts arrays to individual items, preserves single values
 */
export const flattenFilterValues = (filterValues: FilterValues): FilterChipData[] => {
  const flattened: FilterChipData[] = [];

  for (const [key, value] of Object.entries(filterValues)) {
    if (!shouldDisplayFilter(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      // Create individual entries for each array item
      value.forEach(item => {
        flattened.push({ key, value: item });
      });
    } else if (value !== null && value !== undefined && value !== '') {
      // Single non-empty value
      flattened.push({ key, value });
    }
  }

  return flattened;
};