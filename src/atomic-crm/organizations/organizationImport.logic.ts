/**
 * Pure business logic for CSV organization import
 * Shared between application code and test scripts
 *
 * This module contains testable, framework-agnostic business logic for:
 * - CSV formula injection prevention
 * - Organization validation using Zod
 * - Duplicate detection
 * - Data quality transformations
 */

import { organizationSchema } from "../validation/organizations";
import { FORBIDDEN_FORMULA_PREFIXES } from "./csvConstants";

/**
 * Organization import schema type - matches the structure we'll receive from CSV
 */
export interface OrganizationImportSchema {
  name: string;
  priority?: "A" | "B" | "C" | "D";
  segment_id?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  linkedin_url?: string | null;
  description?: string | null;
  website?: string | null;
  organization_type?: "customer" | "prospect" | "principal" | "distributor";
  parent_organization_id?: string | number | null; // Parent organization for hierarchies
  sales_id?: string | number | null;
  tags?: string; // Comma-separated tag names (e.g., "VIP,Enterprise,West Coast")
}

/**
 * Validation result for a single organization row
 */
export interface ValidationResult {
  success: boolean;
  data?: OrganizationImportSchema;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Duplicate detection result
 */
export interface DuplicateReport {
  duplicates: Array<{
    indices: number[];
    name: string;
    count: number;
  }>;
  totalDuplicates: number;
}

/**
 * Data quality decisions made by the user
 * Reserved for future use - organizations don't have the same quality issues as contacts
 * Example: mergeDuplicates, standardizePhoneFormat, etc.
 */
export type DataQualityDecisions = Record<string, never>;

/**
 * Result of applying data quality transformations
 */
export interface TransformResult {
  transformedOrganizations: OrganizationImportSchema[];
  transformationCount: number;
  wasTransformed: (index: number) => boolean;
}

/**
 * Sanitize a value to prevent CSV formula injection
 *
 * Security measure: Prevents malicious CSV files from executing formulas
 * when opened in Excel, LibreOffice, or Google Sheets.
 *
 * Strategy:
 * - Check if value starts with forbidden prefixes (=, +, -, @, \t, \r)
 * - If so, prefix with a single quote (') to force text interpretation
 * - Preserve original value otherwise
 *
 * @param value - Raw value from CSV cell
 * @returns Sanitized value safe for spreadsheet applications
 */
export function sanitizeFormulaInjection(value: string): string {
  if (!value || typeof value !== "string") {
    return value;
  }

  // Check if the value starts with any forbidden prefix
  const startsWithForbiddenPrefix = FORBIDDEN_FORMULA_PREFIXES.some((prefix) =>
    value.startsWith(prefix)
  );

  if (startsWithForbiddenPrefix) {
    // Prefix with single quote to force text interpretation
    return `'${value}`;
  }

  return value;
}

/**
 * Validate a single organization row using Zod schema
 *
 * Uses safeParse (not parse) to avoid throwing exceptions.
 * Collects all validation errors for user feedback.
 *
 * @param row - Raw organization data from CSV
 * @returns Validation result with success status and errors
 */
export function validateOrganizationRow(row: any): ValidationResult {
  // Use the organization schema for validation
  const result = organizationSchema.safeParse(row);

  if (result.success) {
    return {
      success: true,
      data: result.data as OrganizationImportSchema,
    };
  }

  // Collect all validation errors
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return {
    success: false,
    errors,
  };
}

/**
 * Detect duplicate organizations based on name
 *
 * Strategy: Case-insensitive, trimmed comparison
 * Organizations with identical names are considered duplicates
 *
 * @param orgs - Array of organizations to check
 * @param strategy - Detection strategy (currently only 'name' is supported)
 * @returns Report of duplicate groups
 */
export function detectDuplicateOrganizations(
  orgs: OrganizationImportSchema[],
  strategy: "name" = "name"
): DuplicateReport {
  if (strategy !== "name") {
    throw new Error(`Unsupported duplicate detection strategy: ${strategy}`);
  }

  // Map normalized names to indices
  const nameMap = new Map<string, number[]>();

  orgs.forEach((org, index) => {
    if (!org.name) {
      return; // Skip organizations without names
    }

    const normalizedName = org.name.toLowerCase().trim();

    if (!nameMap.has(normalizedName)) {
      nameMap.set(normalizedName, []);
    }

    nameMap.get(normalizedName)!.push(index);
  });

  // Filter to only groups with duplicates (2+ entries)
  const duplicates: DuplicateReport["duplicates"] = [];

  nameMap.forEach((indices, _normalizedName) => {
    if (indices.length > 1) {
      // Get the original name from the first occurrence
      const originalName = orgs[indices[0]].name;

      duplicates.push({
        indices,
        name: originalName,
        count: indices.length,
      });
    }
  });

  // Sort by count (descending) for better UX
  duplicates.sort((a, b) => b.count - a.count);

  // Calculate total duplicate entries (excluding the first occurrence of each name)
  // e.g., if "Acme" appears 3 times, that's 2 duplicates (not 3)
  const totalDuplicates = duplicates.reduce((sum, group) => sum + (group.count - 1), 0);

  return {
    duplicates,
    totalDuplicates,
  };
}

/**
 * Apply data quality transformations to organizations based on user decisions
 *
 * Transformations include:
 * - Normalizing invalid priority values to "C" (medium priority)
 * - Future: Standardizing phone formats, merging duplicates, etc.
 *
 * @param orgs - Array of organizations to transform
 * @param decisions - User's data quality choices
 * @returns Result containing transformed organizations and metadata
 */
export function applyDataQualityTransformations(
  orgs: OrganizationImportSchema[],
  _decisions: DataQualityDecisions = {}
): TransformResult {
  const transformedSet = new Set<number>();
  const validPriorities = ["A", "B", "C", "D"];

  const transformedOrganizations = orgs.map((org, index) => {
    const transformed = { ...org };

    // Normalize invalid priority values to "C" (medium priority)
    if (transformed.priority && !validPriorities.includes(transformed.priority)) {
      console.log(
        `[Import] Normalizing invalid priority "${transformed.priority}" to "C" for row ${index + 2}`
      );
      transformed.priority = "C";
      transformedSet.add(index);
    }

    // Auto-correct LinkedIn URLs
    if (transformed.linkedin_url && typeof transformed.linkedin_url === "string") {
      const originalUrl = transformed.linkedin_url.trim();

      // Skip if empty
      if (!originalUrl) {
        transformed.linkedin_url = null;
        return transformed;
      }

      // Add protocol if missing
      let correctedUrl = originalUrl;
      if (!originalUrl.startsWith("http://") && !originalUrl.startsWith("https://")) {
        correctedUrl = "https://" + originalUrl;
      }

      // Check if it's a valid LinkedIn URL after correction
      const linkedinRegex = /^https?:\/\/(?:www\.)?linkedin\.com\//i;
      if (!linkedinRegex.test(correctedUrl)) {
        // Not a LinkedIn URL - set to null instead of failing validation
        console.log(
          `[Import] Removing invalid LinkedIn URL "${originalUrl}" for row ${index + 2} (not a linkedin.com URL)`
        );
        transformed.linkedin_url = null;
        transformedSet.add(index);
      } else if (correctedUrl !== originalUrl) {
        // URL was corrected
        console.log(
          `[Import] Auto-corrected LinkedIn URL for row ${index + 2}: "${originalUrl}" -> "${correctedUrl}"`
        );
        transformed.linkedin_url = correctedUrl;
        transformedSet.add(index);
      }
    }

    return transformed;
  });

  return {
    transformedOrganizations,
    transformationCount: transformedSet.size,
    wasTransformed: (index: number) => transformedSet.has(index),
  };
}

/**
 * Validates a batch of organizations that have already been transformed.
 *
 * @param organizations - The transformed organizations to validate.
 * @returns An object containing successfully validated data and detailed errors.
 */
export function validateTransformedOrganizations(organizations: OrganizationImportSchema[]) {
  const validationResults = organizations.map((org, index) => {
    const result = organizationSchema.safeParse(org);
    return {
      index,
      organization: org,
      success: result.success,
      error: result.success ? null : result.error,
    };
  });

  const successful = validationResults
    .filter((r) => r.success)
    .map((r) => ({ ...r.organization, originalIndex: r.index }));

  const failed = validationResults
    .filter((r) => !r.success)
    .map((r) => ({
      originalIndex: r.index,
      data: r.organization,
      errors: r.error!.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    }));

  return { successful, failed };
}
