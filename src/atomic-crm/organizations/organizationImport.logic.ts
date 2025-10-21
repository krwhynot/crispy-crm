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

import { z } from 'zod';
import { organizationSchema } from '../validation/organizations';
import { FORBIDDEN_FORMULA_PREFIXES } from './csvConstants';

/**
 * Organization import schema type - matches the structure we'll receive from CSV
 */
export interface OrganizationImportSchema {
  name: string;
  priority?: 'A' | 'B' | 'C' | 'D';
  segment_id?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  linkedin_url?: string | null;
  description?: string | null;
  website?: string | null;
  organization_type?: 'customer' | 'prospect' | 'principal' | 'distributor' | 'unknown';
  sales_id?: string | number | null;
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
 */
export interface DataQualityDecisions {
  // Reserved for future use - organizations don't have the same quality issues as contacts
  // Example: mergeDuplicates, standardizePhoneFormat, etc.
}

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
  if (!value || typeof value !== 'string') {
    return value;
  }

  // Check if the value starts with any forbidden prefix
  const startsWithForbiddenPrefix = FORBIDDEN_FORMULA_PREFIXES.some(prefix =>
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
  const errors = result.error.issues.map(issue => ({
    field: issue.path.join('.'),
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
  strategy: 'name' = 'name'
): DuplicateReport {
  if (strategy !== 'name') {
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
  const duplicates: DuplicateReport['duplicates'] = [];

  nameMap.forEach((indices, normalizedName) => {
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

  const totalDuplicates = duplicates.reduce((sum, group) => sum + group.count, 0);

  return {
    duplicates,
    totalDuplicates,
  };
}

/**
 * Apply data quality transformations to organizations based on user decisions
 *
 * Currently a placeholder - organizations don't have the same auto-fill logic as contacts.
 * Reserved for future transformations like:
 * - Standardizing phone formats
 * - Merging duplicate organizations
 * - Normalizing addresses
 *
 * @param orgs - Array of organizations to transform
 * @param decisions - User's data quality choices
 * @returns Result containing transformed organizations and metadata
 */
export function applyDataQualityTransformations(
  orgs: OrganizationImportSchema[],
  decisions: DataQualityDecisions = {}
): TransformResult {
  const transformedSet = new Set<number>();

  // For now, just pass through unchanged
  // Future: Add transformations based on decisions
  const transformedOrganizations = orgs.map((org, index) => {
    // Example future transformation:
    // if (decisions.standardizePhoneFormat && org.phone) {
    //   org.phone = standardizePhone(org.phone);
    //   transformedSet.add(index);
    // }

    return { ...org };
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
    .filter(r => r.success)
    .map(r => ({ ...r.organization, originalIndex: r.index }));

  const failed = validationResults
    .filter(r => !r.success)
    .map(r => ({
      originalIndex: r.index,
      data: r.organization,
      errors: r.error!.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    }));

  return { successful, failed };
}
