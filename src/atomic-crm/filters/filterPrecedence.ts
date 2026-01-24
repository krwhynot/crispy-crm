import type { FilterValues, FilterValue } from "./types";
import { FILTER_KEYS } from "./types";
import { getStorageItem, setStorageItem, removeStorageItem } from "../utils/secureStorage";
import { safeJsonParse } from "../utils/safeJsonParse";
import { filterValueSchema } from "../validation/filters";
import { ACTIVE_STAGES } from "@/atomic-crm/opportunities/constants";
import { logger } from "@/lib/logger";

/**
 * Filter precedence utilities
 * Simplifies the complex logic for determining filter default values
 * Phase 1 Security Remediation: Uses sessionStorage instead of localStorage
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
      if (key === "page" || key === "perPage" || key === "sort" || key === "order") {
        continue;
      }

      // Try to parse as JSON array first (for multi-values)
      try {
        const parsed = safeJsonParse(value, filterValueSchema);
        if (parsed !== null && Array.isArray(parsed)) {
          filters[key] = parsed;
        } else {
          filters[key] = value;
        }
      } catch (error) {
        logger.warn("Failed to parse filter value as JSON, treating as string", {
          feature: "filterPrecedence",
          filterKey: key,
          error: error instanceof Error ? error.message : String(error),
        });
        filters[key] = value;
      }
    }

    return filters;
  } catch (error: unknown) {
    logger.warn("Failed to parse URL filters", {
      feature: "filterPrecedence",
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
};

/**
 * Get filter preferences from sessionStorage
 * Phase 1 Security Remediation: Uses sessionStorage (cleared on tab close)
 *
 * @template T - Expected type of stored value (defaults to FilterValue)
 * @param key - Storage key
 * @returns The stored value or null if not found
 */
export function getStoredFilterPreferences<T = FilterValue>(key: string): T | null {
  try {
    // SECURITY: Use sessionStorage instead of localStorage
    return getStorageItem<T>(key, { type: "session" });
  } catch (error) {
    logger.warn("Failed to read filter preferences from storage", {
      feature: "filterPrecedence",
      storageKey: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Save filter preferences to sessionStorage
 * Phase 1 Security Remediation: Uses sessionStorage (cleared on tab close)
 *
 * @template T - Type of value being stored
 * @param key - Storage key
 * @param value - Value to store
 */
export function saveFilterPreferences<T = FilterValue>(key: string, value: T): void {
  try {
    // SECURITY: Use sessionStorage instead of localStorage
    setStorageItem(key, value, { type: "session" });
  } catch (error: unknown) {
    logger.warn("Failed to save filter preferences", {
      feature: "filterPrecedence",
      storageKey: key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get default visible stages (excludes closed stages)
 */
export const getDefaultVisibleStages = (): string[] => {
  // Return only active (non-closed) stages by default
  // ACTIVE_STAGES is derived from STAGE constants and excludes closed_won/closed_lost
  return [...ACTIVE_STAGES];
};

/**
 * Get initial filter value with precedence
 * URL > sessionStorage > default
 * Phase 1 Security Remediation: sessionStorage clears on tab close (better privacy)
 *
 * The precedence algorithm:
 * 1. URL value has highest priority (explicit user navigation)
 * 2. sessionStorage preference (user's last choice this session)
 * 3. Default value (code-defined fallback)
 *
 * @template T - Type of filter value (inferred from defaultValue or urlValue)
 * @param filterKey - The filter key to look up
 * @param urlValue - Value from URL parameters (optional)
 * @param defaultValue - Fallback default value (optional)
 * @returns The value with highest precedence, or undefined if none found
 */
export function getInitialFilterValue<T extends FilterValue = FilterValue>(
  filterKey: string,
  urlValue?: T,
  defaultValue?: T
): T | undefined {
  // 1. URL has highest priority (if present and valid)
  if (urlValue !== undefined && urlValue !== null && urlValue !== "") {
    return urlValue;
  }

  // 2. sessionStorage preferences (if no URL value)
  const storedValue = getStoredFilterPreferences<T>(`filter.${filterKey}`);
  if (storedValue !== undefined && storedValue !== null) {
    return storedValue;
  }

  // 3. Default value (if provided)
  return defaultValue;
}

/**
 * Simplified function to get initial stage filter
 * Uses nullish coalescing for cleaner logic
 */
export const getInitialStageFilter = (urlFilters?: FilterValues): string[] => {
  // Use nullish coalescing chain for precedence
  const stageFilter =
    urlFilters?.[FILTER_KEYS.STAGE] ??
    getStoredFilterPreferences<string[]>("opportunity_hidden_stages") ??
    getDefaultVisibleStages();

  // Ensure it's always a string array
  if (Array.isArray(stageFilter)) {
    // Type guard: filter values could be number[] from FilterValue type
    // but stages are always strings in our domain
    return stageFilter.map(String);
  }

  if (typeof stageFilter === "string") {
    return [stageFilter];
  }

  return getDefaultVisibleStages();
};

/**
 * Update stage preferences in sessionStorage
 * Only saves if different from defaults
 * Phase 1 Security Remediation: sessionStorage clears on tab close (better privacy)
 */
export const updateStagePreferences = (stages: string[]): void => {
  const defaults = getDefaultVisibleStages();

  // Only save if different from defaults
  const isDifferent =
    stages.length !== defaults.length || !stages.every((stage) => defaults.includes(stage));

  if (isDifferent) {
    saveFilterPreferences<string[]>("opportunity_hidden_stages", stages);
  } else {
    // Remove from storage if back to defaults
    try {
      // SECURITY: Use sessionStorage instead of localStorage
      removeStorageItem("opportunity_hidden_stages");
    } catch (error) {
      console.warn("[filterPrecedence] Failed to remove stage preferences from storage:", error);
    }
  }
};

/**
 * Build filter object with all precedence rules applied
 *
 * This is the main entry point for initializing filters with proper precedence.
 * It combines URL parameters, stored preferences, and code defaults.
 *
 * @param urlSearch - The URL search string (e.g., "?stage=new_lead")
 * @param defaults - Default filter values to use as fallbacks
 * @returns Combined filter values with precedence rules applied
 */
export const buildInitialFilters = (
  urlSearch: string,
  defaults: FilterValues = {}
): FilterValues => {
  const urlFilters = parseUrlFilters(urlSearch);
  const initialFilters: FilterValues = {};

  // Apply precedence for each default filter
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = getInitialFilterValue(key, urlFilters[key], defaultValue);
    if (value !== undefined && value !== null && value !== "") {
      initialFilters[key] = value;
    }
  }

  // Include any URL filters not in defaults
  for (const [key, value] of Object.entries(urlFilters)) {
    if (!initialFilters[key] && value !== undefined && value !== null && value !== "") {
      initialFilters[key] = value;
    }
  }

  return initialFilters;
};
