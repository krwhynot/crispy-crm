/**
 * Shared constants for CSV processing
 *
 * This module contains constants used across multiple CSV-related modules.
 * By keeping these in a separate file, we avoid circular dependencies.
 */

/**
 * Marker constant used to identify full name columns that need to be split
 * into first_name and last_name components.
 *
 * Used by:
 * - columnAliases.ts: Returns this marker for full name columns
 * - csvProcessor.ts: Detects this marker to trigger name splitting
 */
export const FULL_NAME_SPLIT_MARKER = "_full_name_split_";
