/**
 * Shared constants for CSV processing (Organizations)
 *
 * This module contains constants used across multiple CSV-related modules.
 * By keeping these in a separate file, we avoid circular dependencies.
 */

/**
 * Maximum file size for CSV uploads (20MB)
 * Prevents memory issues and ensures reasonable processing time
 */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * Number of rows to process in each chunk
 * Balances performance with memory usage
 */
export const CHUNK_SIZE = 1000;

/**
 * Forbidden prefixes for CSV formula injection prevention
 * These characters at the start of a cell value can trigger formula execution in Excel/LibreOffice
 *
 * Security rationale:
 * - = (equals): Standard formula prefix
 * - + (plus): Alternative formula prefix
 * - - (minus): Alternative formula prefix
 * - @ (at): Formula prefix in some spreadsheet applications
 * - \t (tab): Can be used to bypass validation
 * - \r (carriage return): Can be used to bypass validation
 *
 * Mitigation: Prefix dangerous values with a single quote (')
 * This renders them as text in spreadsheet applications
 */
export const FORBIDDEN_FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Marker constant used to identify full name columns that need to be split
 * into first_name and last_name components (reused from contacts module)
 */
export const FULL_NAME_SPLIT_MARKER = "_full_name_split_";
