import type { FilterValues} from "./types";
import { FILTER_KEYS } from "./types";

/**
 * Filter precedence utilities
 * Simplifies the complex logic for determining filter default values
 */

/**
 * Parse filter values from URL search params
 */
export const parseUrlFilters = (search: string): FilterValues => {
  if (!search) return {};

  try {
    const params = new URLSearchParams(search);
    const filters: FilterValues = {};

    for (const [key, value] of params.entries()) {
      // Skip React Admin internal params
      if (key === 'page' || key === 'perPage' || key === 'sort' || key === 'order') {
        continue;
      }

      // Try to parse as JSON array first (for multi-values)
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          filters[key] = parsed;
        } else {
          filters[key] = value;
        }
      } catch {
        // Not JSON, treat as single value
        filters[key] = value;
      }
    }

    return filters;
  } catch (error) {
    console.warn('Failed to parse URL filters:', error);
    return {};
  }
};

/**
 * Get filter preferences from localStorage
 */
export const getStoredFilterPreferences = (key: string): any => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Save filter preferences to localStorage
 */
export const saveFilterPreferences = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save filter preferences:', error);
  }
};

/**
 * Get default visible stages (excludes closed stages)
 */
export const getDefaultVisibleStages = (): string[] => {
  // These are the stages to EXCLUDE by default
  const closedStages = ['closed_won', 'closed_lost'];

  // Get all stages from the imported choices
  const allStages = [
    'new_lead',
    'initial_outreach',
    'sample_visit_offered',
    'awaiting_response',
    'feedback_logged',
    'demo_scheduled',
    'closed_won',
    'closed_lost'
  ];

  return allStages.filter(stage => !closedStages.includes(stage));
};

/**
 * Get initial filter value with precedence
 * URL > localStorage > default
 */
export const getInitialFilterValue = (
  filterKey: string,
  urlValue?: any,
  defaultValue?: any
): any => {
  // 1. URL has highest priority (if present and valid)
  if (urlValue !== undefined && urlValue !== null && urlValue !== '') {
    return urlValue;
  }

  // 2. localStorage preferences (if no URL value)
  const storedValue = getStoredFilterPreferences(`filter.${filterKey}`);
  if (storedValue !== undefined && storedValue !== null) {
    return storedValue;
  }

  // 3. Default value (if provided)
  return defaultValue;
};

/**
 * Simplified function to get initial stage filter
 * Uses nullish coalescing for cleaner logic
 */
export const getInitialStageFilter = (urlFilters?: FilterValues): string[] => {
  // Use nullish coalescing chain for precedence
  const stageFilter =
    urlFilters?.[FILTER_KEYS.STAGE] ??
    getStoredFilterPreferences('opportunity_hidden_stages') ??
    getDefaultVisibleStages();

  // Ensure it's always an array
  if (Array.isArray(stageFilter)) {
    return stageFilter;
  }

  if (typeof stageFilter === 'string') {
    return [stageFilter];
  }

  return getDefaultVisibleStages();
};

/**
 * Update stage preferences in localStorage
 * Only saves if different from defaults
 */
export const updateStagePreferences = (stages: string[]): void => {
  const defaults = getDefaultVisibleStages();

  // Only save if different from defaults
  const isDifferent =
    stages.length !== defaults.length ||
    !stages.every(stage => defaults.includes(stage));

  if (isDifferent) {
    saveFilterPreferences('opportunity_hidden_stages', stages);
  } else {
    // Remove from storage if back to defaults
    try {
      localStorage.removeItem('opportunity_hidden_stages');
    } catch {
      // Ignore errors
    }
  }
};

/**
 * Build filter object with all precedence rules applied
 */
export const buildInitialFilters = (
  urlSearch: string,
  defaults: Record<string, any> = {}
): FilterValues => {
  const urlFilters = parseUrlFilters(urlSearch);
  const initialFilters: FilterValues = {};

  // Apply precedence for each default filter
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = getInitialFilterValue(key, urlFilters[key], defaultValue);
    if (value !== undefined && value !== null && value !== '') {
      initialFilters[key] = value;
    }
  }

  // Include any URL filters not in defaults
  for (const [key, value] of Object.entries(urlFilters)) {
    if (!initialFilters[key] && value !== undefined && value !== null && value !== '') {
      initialFilters[key] = value;
    }
  }

  return initialFilters;
};