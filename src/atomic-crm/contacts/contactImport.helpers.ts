/**
 * Helper functions for CSV contact import data extraction and analysis.
 *
 * These functions operate on parsed CSV data to extract metadata,
 * identify data quality issues, and prepare preview information.
 *
 * Function categories:
 * - **Extractors** (pure): Extract unique values from parsed data
 * - **Finders** (use predicates): Identify rows matching quality criteria
 *
 * @see contactImport.logic.ts for predicate functions
 * @see contactImport.types.ts for type definitions
 */

import type { ContactImportSchema } from "./contactImport.types";
import {
  isOrganizationOnlyEntry,
  isContactWithoutContactInfo,
} from "./contactImport.logic";

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Offset to convert 0-indexed array position to user-facing row number.
 * Accounts for:
 * - 3 header rows in CSV template (title, description, field names)
 * - 1-indexed display for user-friendly row references
 */
export const CSV_DATA_START_OFFSET = 4;

// ============================================================
// EXTRACTION FUNCTIONS (Pure)
// ============================================================

/**
 * Extracts unique organization names from parsed CSV data.
 *
 * Pure function - no external dependencies, deterministic output.
 *
 * @param rows - Array of parsed contact data
 * @returns Array of unique organization names (trimmed, non-empty)
 *
 * @example
 * ```ts
 * const orgs = extractNewOrganizations([
 *   { organization_name: "Acme Inc", first_name: "John" },
 *   { organization_name: "Acme Inc", first_name: "Jane" },
 *   { organization_name: "Tech Corp", first_name: "Bob" },
 * ]);
 * // Returns: ["Acme Inc", "Tech Corp"]
 * ```
 */
export function extractNewOrganizations(rows: ContactImportSchema[]): string[] {
  const organizations = new Set<string>();

  for (const row of rows) {
    if (row.organization_name) {
      const trimmed = row.organization_name.trim();
      if (trimmed) {
        organizations.add(trimmed);
      }
    }
  }

  return Array.from(organizations);
}

/**
 * Extracts unique tags from parsed CSV data.
 *
 * Pure function - no external dependencies, deterministic output.
 * Tags in CSV are stored as comma-separated values in a single field.
 *
 * @param rows - Array of parsed contact data
 * @returns Array of unique tags (trimmed, non-empty)
 *
 * @example
 * ```ts
 * const tags = extractNewTags([
 *   { tags: "VIP, Customer", first_name: "John" },
 *   { tags: "VIP, Partner", first_name: "Jane" },
 * ]);
 * // Returns: ["VIP", "Customer", "Partner"]
 * ```
 */
export function extractNewTags(rows: ContactImportSchema[]): string[] {
  const tags = new Set<string>();

  for (const row of rows) {
    if (row.tags) {
      const tagList = row.tags.split(",");
      for (const tag of tagList) {
        const trimmed = tag.trim();
        if (trimmed) {
          tags.add(trimmed);
        }
      }
    }
  }

  return Array.from(tags);
}

// ============================================================
// FINDER FUNCTIONS (Use predicates)
// ============================================================

/**
 * Result type for organization-only entries found in CSV data.
 */
export interface OrganizationOnlyEntry {
  /** Organization name from the row */
  organization_name: string;
  /** User-facing row number (1-indexed, accounting for header rows) */
  row: number;
}

/**
 * Result type for contacts without contact information.
 */
export interface ContactWithoutInfoEntry {
  /** Contact's full name (or "Unknown" if empty) */
  name: string;
  /** Organization name (may be empty) */
  organization_name: string;
  /** User-facing row number (1-indexed, accounting for header rows) */
  row: number;
}

/**
 * Finds rows containing organization-only entries (org name but no contact name).
 *
 * Uses `isOrganizationOnlyEntry` predicate from contactImport.logic.ts.
 * These entries may indicate:
 * - Intentional organization records without a contact person
 * - Data entry errors where contact name was omitted
 *
 * @param rows - Array of parsed contact data
 * @returns Array of matching entries with organization name and row number
 *
 * @example
 * ```ts
 * const orgOnly = findOrganizationsWithoutContacts([
 *   { organization_name: "Acme Inc", first_name: "", last_name: "" },
 *   { organization_name: "Tech Corp", first_name: "John", last_name: "Doe" },
 * ]);
 * // Returns: [{ organization_name: "Acme Inc", row: 4 }]
 * ```
 */
export function findOrganizationsWithoutContacts(
  rows: ContactImportSchema[]
): OrganizationOnlyEntry[] {
  const results: OrganizationOnlyEntry[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (isOrganizationOnlyEntry(row)) {
      results.push({
        organization_name: String(row.organization_name).trim(),
        row: index + CSV_DATA_START_OFFSET,
      });
    }
  }

  return results;
}

/**
 * Finds contacts that have names but lack any contact information (email or phone).
 *
 * Uses `isContactWithoutContactInfo` predicate from contactImport.logic.ts.
 * These entries may indicate:
 * - Contacts imported from sources without contact details
 * - Data entry errors where email/phone was omitted
 *
 * @param rows - Array of parsed contact data
 * @returns Array of matching entries with name, organization, and row number
 *
 * @example
 * ```ts
 * const noInfo = findContactsWithoutContactInfo([
 *   { first_name: "John", last_name: "Doe", organization_name: "Acme" },
 *   { first_name: "Jane", last_name: "Smith", organization_name: "Tech", email_work: "jane@tech.com" },
 * ]);
 * // Returns: [{ name: "John Doe", organization_name: "Acme", row: 4 }]
 * ```
 */
export function findContactsWithoutContactInfo(
  rows: ContactImportSchema[]
): ContactWithoutInfoEntry[] {
  const results: ContactWithoutInfoEntry[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (isContactWithoutContactInfo(row)) {
      // Build display name from available parts
      const nameParts: string[] = [];
      if (row.first_name && String(row.first_name).trim()) {
        nameParts.push(String(row.first_name).trim());
      }
      if (row.last_name && String(row.last_name).trim()) {
        nameParts.push(String(row.last_name).trim());
      }
      const name = nameParts.length > 0 ? nameParts.join(" ") : "Unknown";

      results.push({
        name,
        organization_name: row.organization_name
          ? String(row.organization_name).trim()
          : "",
        row: index + CSV_DATA_START_OFFSET,
      });
    }
  }

  return results;
}
