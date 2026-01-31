/**
 * CSV Upload Validation Utilities
 *
 * Security-focused validation for CSV file uploads with DoS protection.
 * Implements OWASP file upload security guidelines.
 *
 * @example
 * ```ts
 * import { validateCsvFile, validateCsvHeaders, sanitizeCsvCell } from '@/lib/csvUploadValidator';
 *
 * const result = validateCsvFile(file, {
 *   requiredHeaders: ['name', 'email', 'phone'],
 *   maxFileSize: 2 * 1024 * 1024, // 2MB
 * });
 *
 * if (!result.isValid) {
 *   logger.error('CSV validation failed', undefined, {
 *     errors: result.errors,
 *     feature: 'CsvUpload'
 *   });
 * }
 * ```
 */

// ============================================================================
// Security Constants (DoS Prevention)
// ============================================================================

/** Maximum file size in bytes (5MB default) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum number of rows to prevent memory exhaustion */
export const MAX_ROW_COUNT = 10_000;

/** Maximum characters per cell to prevent memory exhaustion */
export const MAX_CELL_LENGTH = 1000;

/** Allowed MIME types for CSV files */
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
] as const;

// ============================================================================
// Types
// ============================================================================

export interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount?: number;
}

export interface CsvValidationOptions {
  /** Required column headers (case-insensitive matching) */
  requiredHeaders: string[];
  /** Max file size in bytes (default: 5MB) */
  maxFileSize?: number;
  /** Max rows allowed (default: 10,000) */
  maxRowCount?: number;
  /** Max characters per cell (default: 1,000) */
  maxCellLength?: number;
}

export interface HeaderValidationResult {
  valid: boolean;
  missing: string[];
  found: string[];
}

// ============================================================================
// File-Level Validation
// ============================================================================

/**
 * Validates a CSV file before parsing.
 * Checks file size and MIME type for DoS prevention.
 *
 * @param file - The File object from file input
 * @param options - Validation options
 * @returns Validation result with errors/warnings
 */
export function validateCsvFile(
  file: File,
  options: CsvValidationOptions
): CsvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const maxSize = options.maxFileSize ?? MAX_FILE_SIZE;

  // Check file size (DoS prevention)
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File exceeds maximum size of ${sizeMB}MB`);
  }

  // Check file size is not zero
  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Check MIME type
  const mimeType = file.type.toLowerCase();
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    warnings.push(`Unexpected file type: ${mimeType}. Expected CSV format.`);
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.csv')) {
    warnings.push('File does not have .csv extension');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Header Validation
// ============================================================================

/**
 * Validates that required headers are present in CSV.
 * Uses case-insensitive matching and trims whitespace.
 *
 * @param headers - Array of header strings from first row
 * @param required - Array of required header names
 * @returns Validation result with missing/found headers
 */
export function validateCsvHeaders(
  headers: string[],
  required: string[]
): HeaderValidationResult {
  // Normalize headers: lowercase, trimmed
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  const missing: string[] = [];
  const found: string[] = [];

  for (const req of required) {
    const normalizedReq = req.toLowerCase().trim();
    if (normalizedHeaders.includes(normalizedReq)) {
      found.push(req);
    } else {
      missing.push(req);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    found,
  };
}

// ============================================================================
// Cell Sanitization
// ============================================================================

/**
 * Sanitizes a CSV cell value for safe processing.
 * - Trims whitespace
 * - Enforces max length (DoS prevention)
 * - Removes null bytes and control characters
 *
 * @param value - Raw cell value
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized cell value
 */
export function sanitizeCsvCell(
  value: string,
  maxLength: number = MAX_CELL_LENGTH
): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove null bytes and control characters (except newlines for multi-line cells)
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  const trimmed = cleaned.trim();

  // Enforce max length (DoS prevention)
  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }

  return trimmed;
}

// ============================================================================
// Row Count Validation
// ============================================================================

/**
 * Validates row count doesn't exceed limit.
 * Call this during streaming parse to fail fast.
 *
 * @param currentCount - Current number of rows processed
 * @param maxRows - Maximum allowed rows (default: 10,000)
 * @returns true if within limit, false if exceeded
 */
export function isRowCountValid(
  currentCount: number,
  maxRows: number = MAX_ROW_COUNT
): boolean {
  return currentCount <= maxRows;
}

/**
 * Creates a row count validator for streaming use.
 * Returns a function that throws when limit exceeded.
 *
 * @param maxRows - Maximum allowed rows
 * @returns Validator function to call per row
 */
export function createRowCountValidator(maxRows: number = MAX_ROW_COUNT) {
  let count = 0;

  return function validateRow(): void {
    count++;
    if (count > maxRows) {
      throw new Error(`CSV exceeds maximum row count of ${maxRows.toLocaleString()}`);
    }
  };
}
