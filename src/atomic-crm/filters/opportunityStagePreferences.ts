import { OPPORTUNITY_STAGE_CHOICES } from "../opportunities/constants/stageConstants";
import { getStorageItem, setStorageItem } from "../utils/secureStorage";
import { safeJsonParse } from "../utils/safeJsonParse";
import { urlFilterSchema } from "../validation/filters";

/**
 * Storage key for opportunity stage preferences
 * Phase 1 Security Remediation: Now uses sessionStorage instead of localStorage
 * (cleared on tab close for better privacy)
 */
const STORAGE_KEY = "filter.opportunity_stages";

/**
 * Default visible stages - excludes closed stages by default
 * Users typically want to focus on active opportunities
 */
const DEFAULT_VISIBLE_STAGES = OPPORTUNITY_STAGE_CHOICES.filter(
  (c) => !["closed_won", "closed_lost"].includes(c.id)
).map((c) => c.id);

/**
 * Get stored stage preferences from sessionStorage
 * Falls back to default visible stages if no preferences are stored
 *
 * Phase 1 Security Remediation: Uses sessionStorage (cleared on tab close)
 *
 * @returns Array of stage IDs that should be visible in the filter
 */
export const getStoredStagePreferences = (): string[] => {
  try {
    // SECURITY: Use sessionStorage instead of localStorage
    const stored = getStorageItem<string[]>(STORAGE_KEY, { type: "session" });
    if (!stored) return DEFAULT_VISIBLE_STAGES;

    // Handle corrupted data (null, non-array values)
    if (!Array.isArray(stored)) {
      return DEFAULT_VISIBLE_STAGES;
    }
    return stored;
  } catch {
    return DEFAULT_VISIBLE_STAGES;
  }
};

/**
 * Save stage preferences to sessionStorage
 * Only saves if selectedStages is a non-empty array
 *
 * Phase 1 Security Remediation: Uses sessionStorage (cleared on tab close)
 *
 * @param selectedStages - Array of stage IDs that are currently selected
 */
export const saveStagePreferences = (selectedStages: string[]): void => {
  if (selectedStages.length === 0) return; // Don't save empty array

  try {
    // SECURITY: Use sessionStorage instead of localStorage
    setStorageItem(STORAGE_KEY, selectedStages, { type: "session" });
  } catch (error: unknown) {
    console.warn("Failed to save stage preferences:", error);
  }
};

/**
 * Get default visible stages (system default)
 * Used when no user preferences exist and no URL parameters are provided
 *
 * @returns Array of default visible stage IDs
 */
export const getDefaultVisibleStages = (): string[] => {
  return DEFAULT_VISIBLE_STAGES;
};

/**
 * Get initial stage filter value with precedence logic
 * Priority: URL parameters > localStorage > defaults
 *
 * @returns Array of stage IDs to filter by, or undefined if URL has explicit value
 */
export const getInitialStageFilter = (): string[] | undefined => {
  // 1. Check URL parameters (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get("filter");
  if (urlFilter) {
    const parsed = safeJsonParse(urlFilter, urlFilterSchema);
    if (!parsed) {
      // Invalid JSON in URL, continue to fallback
    } else if (parsed.stage) {
      return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
    }
  }

  // 2. Check localStorage preferences
  return getStoredStagePreferences();
};
