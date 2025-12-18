/**
 * Sales Filter Configuration
 *
 * Defines how sales filters are displayed in the FilterChipBar.
 * Currently uses only search (no sidebar filters), so config is minimal.
 *
 * @module sales/salesFilterConfig
 */

import { validateFilterConfig } from "../filters/filterConfigSchema";

/**
 * Filter configuration for Sales list
 *
 * Sales list uses search-only filtering via ListSearchBar.
 * No sidebar filters are defined for this admin-only resource.
 */
export const SALES_FILTER_CONFIG = validateFilterConfig([]);
