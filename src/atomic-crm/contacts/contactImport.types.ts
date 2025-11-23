/**
 * Shared types for contact import functionality.
 * Extracted to break circular dependencies between:
 * - contactImport.logic.ts
 * - useContactImport.tsx
 * - ContactImportPreview.tsx
 */

/**
 * Schema for contact data during CSV import.
 * Maps to the flat CSV structure before transformation to the database format.
 */
export interface ContactImportSchema {
  first_name: string;
  last_name: string;
  gender?: string;
  title?: string;
  organization_name: string; // Primary organization (mandatory)
  email_work?: string;
  email_home?: string;
  email_other?: string;
  phone_work?: string;
  phone_home?: string;
  phone_other?: string;
  first_seen?: string;
  last_seen?: string;
  tags?: string;
  linkedin_url?: string;
  notes?: string; // Contact notes text field
}

/**
 * User decisions for handling data quality issues during import.
 */
export interface DataQualityDecisions {
  importOrganizationsWithoutContacts: boolean;
  importContactsWithoutContactInfo: boolean;
}

/**
 * Error details for a specific field validation failure.
 */
export interface FieldError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Import error with row number and field-level error details.
 */
export interface ImportError {
  row: number;
  data: unknown;
  errors: FieldError[];
}

/**
 * Complete result of a contact import operation.
 */
export interface ImportResult {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ImportError[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Options for controlling contact import behavior.
 */
export interface ImportOptions {
  preview?: boolean; // If true, validate only without database writes
  onProgress?: (current: number, total: number) => void; // Progress callback
  startingRow?: number; // The absolute starting row number for this batch (1-indexed)
  dataQualityDecisions?: DataQualityDecisions; // User decisions about data quality issues
}
