/**
 * CSV Data Processing - Single Source of Truth
 * Centralizes all CSV transformation logic for contact imports
 *
 * This module is the canonical implementation used by:
 * - Production code (ContactImportDialog.tsx, usePapaParse.tsx)
 * - Test code (all CSV import tests)
 *
 * Phase 1 Security Remediation:
 * - Sanitizes all CSV values to prevent formula injection attacks
 * - Removes control characters and potential HTML/script tags
 */

import type { ContactImportSchema } from "./useContactImport";
import { mapHeadersToFields } from "./columnAliases";
import { FULL_NAME_SPLIT_MARKER } from "./csvConstants";
import { sanitizeCsvValue } from "../utils/csvUploadValidator";

/**
 * Split a full name string into first and last name components
 *
 * Rules:
 * - Empty string → both empty
 * - Single name (e.g., "Smith" or "Mike") → assigned to last_name only
 * - Multiple names (e.g., "John Doe") → first word is first_name, rest is last_name
 *
 * Rationale: When a single name is provided, we assign it to last_name by default.
 * This prioritizes the standard convention of using a last name as the primary
 * identifier in contact lists and is the most predictable behavior for formal names.
 */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  if (!fullName || typeof fullName !== "string") {
    return { first_name: "", last_name: "" };
  }

  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 0 || fullName.trim() === "") {
    // Empty name
    return { first_name: "", last_name: "" };
  } else if (nameParts.length === 1) {
    // Single name part - treat as last name
    // Examples: "Smith", "Mike", "Figueroa"
    return { first_name: "", last_name: nameParts[0] };
  } else {
    // Multiple parts - first is first_name, rest is last_name
    // Examples: "John Doe" → first: "John", last: "Doe"
    //           "Mary Jane Smith" → first: "Mary", last: "Jane Smith"
    return {
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" "),
    };
  }
}

/**
 * Transform CSV headers using column aliases
 * Returns an array of canonical field names corresponding to each header
 *
 * @param headers - Original CSV header row
 * @returns Array of transformed header names (same length as input)
 * @private - Internal helper function, not exported
 */
function transformHeaders(headers: string[]): string[] {
  const mappings = mapHeadersToFields(headers);

  return headers.map((header) => {
    if (!header) return header;
    const mapped = mappings[header];
    // Return the mapped value, or original header if no mapping found
    return mapped || header;
  });
}

/**
 * Transform raw CSV data into ContactImportSchema objects
 * This is the main entry point for CSV data processing
 *
 * @param headers - Original CSV headers
 * @param dataRows - Raw data rows (arrays of values)
 * @returns Array of Contact objects ready for validation and import
 */
export function processCsvData(headers: string[], dataRows: Array<Array<unknown>>): ContactImportSchema[] {
  const transformedHeaders = transformHeaders(headers);

  return dataRows.map((row) => {
    const contact: Record<string, string> = {};

    headers.forEach((originalHeader, index) => {
      const transformedHeader = transformedHeaders[index];
      const rawValue = row[index];

      // SECURITY: Sanitize all cell values (Phase 1 Security Remediation)
      const value = sanitizeCsvValue(rawValue);

      // Handle full name splitting
      if (transformedHeader === FULL_NAME_SPLIT_MARKER) {
        const { first_name, last_name } = splitFullName(value || "");
        contact.first_name = sanitizeCsvValue(first_name);
        contact.last_name = sanitizeCsvValue(last_name);
      } else {
        contact[transformedHeader] = value;
      }
    });

    return contact as ContactImportSchema;
  });
}

/**
 * Transform raw CSV data with custom mappings (for interactive column mapping)
 * This allows users to override auto-detected mappings
 *
 * @param headers - Original CSV headers
 * @param dataRows - Raw data rows (arrays of values)
 * @param customMappings - User-defined mappings (overrides auto-detection)
 * @returns Array of Contact objects ready for validation and import
 */
export function processCsvDataWithMappings(
  headers: string[],
  dataRows: Array<Array<unknown>>,
  customMappings: Record<string, string | null>
): ContactImportSchema[] {
  return dataRows.map((row) => {
    const contact: Record<string, string> = {};

    headers.forEach((originalHeader, index) => {
      const targetField = customMappings[originalHeader];
      const rawValue = row[index];

      // SECURITY: Sanitize all cell values (Phase 1 Security Remediation)
      const value = sanitizeCsvValue(rawValue);

      // Handle full name splitting
      if (targetField === FULL_NAME_SPLIT_MARKER) {
        const { first_name, last_name } = splitFullName(value || "");
        contact.first_name = sanitizeCsvValue(first_name);
        contact.last_name = sanitizeCsvValue(last_name);
      } else if (targetField) {
        contact[targetField] = value;
      }
      // If targetField is null/undefined, skip this column
    });

    return contact as ContactImportSchema;
  });
}

/**
 * Parse raw Papa Parse results into ContactImportSchema objects
 * Handles the specific structure of our CSV files:
 * - Row 0: Instructions
 * - Row 1: Empty row
 * - Row 2: Headers
 * - Row 3+: Data
 *
 * @param rawData - Raw data from Papa Parse (array of arrays)
 * @returns Object containing processed contact data and original headers
 * @throws Error if CSV structure is invalid
 */
export function parseRawCsvData(rawData: Array<Array<unknown>>): {
  contacts: ContactImportSchema[];
  headers: string[];
} {
  if (!Array.isArray(rawData) || rawData.length < 4) {
    throw new Error("CSV file is too short (less than 4 rows)");
  }

  // Row 3 (index 2) contains the actual headers
  const headers = rawData[2] as string[];

  // Rows 4+ (index 3+) contain the data
  const dataRows = rawData.slice(3);

  const contacts = processCsvData(headers, dataRows);
  return { contacts, headers };
}
