import { OPPORTUNITY_STAGE_CHOICES } from '../opportunities/stageConstants';

/**
 * localStorage key for storing opportunity stage preferences
 * Changed from 'opportunity_hidden_stages' to 'filter.opportunity_stages' for consistency
 */
const STORAGE_KEY = 'filter.opportunity_stages';

/**
 * Default visible stages - excludes closed stages by default
 * Users typically want to focus on active opportunities
 */
const DEFAULT_VISIBLE_STAGES = OPPORTUNITY_STAGE_CHOICES
  .filter(c => !['closed_won', 'closed_lost'].includes(c.id))
  .map(c => c.id);

/**
 * Get stored stage preferences from localStorage
 * Falls back to default visible stages if no preferences are stored
 *
 * @returns Array of stage IDs that should be visible in the filter
 */
export const getStoredStagePreferences = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_VISIBLE_STAGES;
  } catch {
    return DEFAULT_VISIBLE_STAGES;
  }
};

/**
 * Save stage preferences to localStorage
 * Only saves if selectedStages is a non-empty array
 *
 * @param selectedStages - Array of stage IDs that are currently selected
 */
export const saveStagePreferences = (selectedStages: string[]): void => {
  if (selectedStages.length === 0) return; // Don't save empty array

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStages));
  } catch (error) {
    console.warn('Failed to save stage preferences:', error);
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
  const urlFilter = urlParams.get('filter');
  if (urlFilter) {
    try {
      const parsed = JSON.parse(urlFilter);
      if (parsed.stage) {
        return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
      }
    } catch {
      // Invalid JSON in URL, continue to fallback
    }
  }

  // 2. Check localStorage preferences
  return getStoredStagePreferences();
};
