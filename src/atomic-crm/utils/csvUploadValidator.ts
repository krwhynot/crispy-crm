/**
 * CSV Upload Security Validation
 * Prevents DoS, injection attacks, and malicious file uploads
 *
 * Phase 1 Security Remediation - CRITICAL
 *
 * Protects against:
 * - File size attacks (DoS via massive files)
 * - MIME type spoofing (executables renamed to .csv)
 * - Formula injection (=cmd|'/c calc'!A0)
 * - Binary file uploads (malware)
 * - Memory exhaustion (billion row CSVs)
 *
 * @module csvUploadValidator
 */

export const CSV_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 10000,
  MAX_CELL_LENGTH: 1000,
  ALLOWED_MIME_TYPES: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
  ALLOWED_EXTENSIONS: ['.csv'],
} as const;

export interface CsvValidationError {
  field: string;
  message: string;
  code: 'SIZE' | 'MIME' | 'STRUCTURE' | 'ENCODING' | 'BINARY';
}

export interface CsvValidationResult {
  valid: boolean;
  errors?: CsvValidationError[];
  warnings?: string[];
}

/**
 * Validate CSV file before processing
 * Runs client-side as first line of defense
 *
 * @param file - File object from input
 * @returns Validation result with errors/warnings
 *
 * @example
 * const result = await validateCsvFile(file);
 * if (!result.valid) {
 *   alert(result.errors.map(e => e.message).join('\n'));
 *   return;
 * }
 */
export async function validateCsvFile(file: File): Promise<CsvValidationResult> {
  const errors: CsvValidationError[] = [];
  const warnings: string[] = [];

  // 1. File size check (DoS prevention)
  if (file.size > CSV_UPLOAD_LIMITS.MAX_FILE_SIZE) {
    errors.push({
      field: 'size',
      message: `File size (${formatBytes(file.size)}) exceeds limit of ${formatBytes(CSV_UPLOAD_LIMITS.MAX_FILE_SIZE)}`,
      code: 'SIZE',
    });
  }

  if (file.size === 0) {
    errors.push({
      field: 'size',
      message: 'File is empty',
      code: 'SIZE',
    });
  }

  // 2. File extension check
  const hasValidExtension = CSV_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    errors.push({
      field: 'extension',
      message: `File must have .csv extension. Got: ${file.name}`,
      code: 'MIME',
    });
  }

  // 3. MIME type check (weak protection, but catches obvious mistakes)
  if (file.type && !CSV_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
    warnings.push(
      `MIME type "${file.type}" is unusual for CSV. Expected: text/csv`
    );
  }

  // 4. Content sniffing - read first bytes to detect binary files
  try {
    const chunk = await file.slice(0, 1024).text();

    // Check for binary file signatures (magic bytes)
    if (isBinaryFile(chunk)) {
      errors.push({
        field: 'content',
        message: 'File appears to be binary, not text. Only CSV text files allowed.',
        code: 'BINARY',
      });
    }

    // Check for CSV structure (should have delimiters)
    if (!/[,\t;|]/.test(chunk)) {
      errors.push({
        field: 'structure',
        message: 'File does not appear to be CSV format (no delimiters found)',
        code: 'STRUCTURE',
      });
    }

    // Check for valid text encoding
    if (/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]/.test(chunk)) {
      warnings.push('File may contain control characters or binary data');
    }
  } catch {
    errors.push({
      field: 'encoding',
      message: 'Unable to read file. Ensure it is valid UTF-8 encoded text.',
      code: 'ENCODING',
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Detect binary files by checking for common magic bytes
 *
 * @param chunk - First 1024 bytes of file as string
 * @returns true if file appears to be binary
 */
function isBinaryFile(chunk: string): boolean {
  const binarySignatures = [
    '\xFF\xD8\xFF',     // JPEG
    '\x89PNG',          // PNG
    'GIF8',             // GIF
    '\x1F\x8B',         // GZIP
    'PK\x03\x04',       // ZIP
    'PK\x05\x06',       // ZIP (empty)
    '\x00\x00\x00',     // Various binary formats
    'MZ',               // EXE
    '\x7FELF',          // Linux executable
    '%PDF',             // PDF
    '\xD0\xCF\x11\xE0', // MS Office (old format)
  ];

  return binarySignatures.some(sig => chunk.startsWith(sig));
}

/**
 * Configure PapaParse with security settings
 * Prevents formula injection and limits resource usage
 *
 * @returns PapaParse configuration object
 *
 * @example
 * const { parseCsv } = usePapaParse({
 *   papaConfig: getSecurePapaParseConfig()
 * });
 */
export function getSecurePapaParseConfig() {
  return {
    header: true,
    dynamicTyping: false, // CRITICAL: Prevent automatic type conversion
    skipEmptyLines: true,
    preview: CSV_UPLOAD_LIMITS.MAX_ROWS, // Limit rows processed

    // Sanitize headers
    transformHeader: (header: string) => {
      return header
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_\s]/g, '_')
        .substring(0, 100); // Limit header length
    },

    // Sanitize cell values (formula injection prevention)
    transform: (value: string, _field: string) => {
      if (typeof value !== 'string') return value;

      // Remove formula injection attempts
      const trimmed = value.trim();
      if (/^[=+\-@\t\r]/.test(trimmed)) {
        // Prepend single quote to prevent formula evaluation
        return "'" + trimmed;
      }

      // Limit cell length
      if (trimmed.length > CSV_UPLOAD_LIMITS.MAX_CELL_LENGTH) {
        return trimmed.substring(0, CSV_UPLOAD_LIMITS.MAX_CELL_LENGTH) + '...';
      }

      return trimmed;
    },

    // Error handling
    error: (error: any) => {
      console.error('[CSV Security] Parse error:', error.message);
      throw new Error(`CSV parsing failed: ${error.message}`);
    },
  };
}

/**
 * Sanitize individual CSV cell value
 * Additional layer beyond PapaParse transform
 *
 * @param value - Raw cell value
 * @returns Sanitized string
 *
 * @example
 * const safe = sanitizeCsvValue("=cmd|'/c calc'!A0");
 * // Returns: "'=cmd|'/c calc'!A0"
 */
export function sanitizeCsvValue(value: any): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  let sanitized = value.trim();

  // 1. Formula injection prevention
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  // 2. Remove control characters
  sanitized = sanitized.replace(/[\\x00-\\x1F\\x7F]/g, '');

  // 3. Remove potential HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // 4. Limit length
  if (sanitized.length > CSV_UPLOAD_LIMITS.MAX_CELL_LENGTH) {
    sanitized = sanitized.substring(0, CSV_UPLOAD_LIMITS.MAX_CELL_LENGTH);
  }

  return sanitized;
}

/**
 * Format bytes for human-readable display
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "10.5 MB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
