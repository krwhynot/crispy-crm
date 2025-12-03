# Security: CSV Upload Validation

## Purpose

Document CSV upload security patterns: file validation, formula injection prevention, binary detection.

## Core Principle: Defense in Depth

**Security Model:** Validate at multiple layers
1. **Client-side** - First line of defense (file validation)
2. **API boundary** - Zod validation (SQL injection prevention)
3. **Database** - RLS policies (row-level access control)

**Critical Rule:** Never trust user input at any layer.

## Pattern: File Validation

**From `src/atomic-crm/utils/csvUploadValidator.ts:51`:**

```typescript
export const CSV_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 10000,
  MAX_CELL_LENGTH: 1000,
  ALLOWED_MIME_TYPES: ["text/csv", "text/plain", "application/vnd.ms-excel"],
  ALLOWED_EXTENSIONS: [".csv"],
} as const;

/**
 * Validate CSV file before processing
 *
 * Protects against:
 * - File size attacks (DoS via massive files)
 * - MIME type spoofing (executables renamed to .csv)
 * - Formula injection (=cmd|'/c calc'!A0)
 * - Binary file uploads (malware)
 * - Memory exhaustion (billion row CSVs)
 */
export async function validateCsvFile(file: File): Promise<CsvValidationResult> {
  const errors: CsvValidationError[] = [];
  const warnings: string[] = [];

  // 1. File size check (DoS prevention)
  if (file.size > CSV_UPLOAD_LIMITS.MAX_FILE_SIZE) {
    errors.push({
      field: "size",
      message: `File size exceeds limit of ${formatBytes(CSV_UPLOAD_LIMITS.MAX_FILE_SIZE)}`,
      code: "SIZE",
    });
  }

  // 2. File extension check
  const hasValidExtension = CSV_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    errors.push({
      field: "extension",
      message: `File must have .csv extension. Got: ${file.name}`,
      code: "MIME",
    });
  }

  // 3. Content sniffing - detect binary files
  try {
    const chunk = await file.slice(0, 1024).text();

    if (isBinaryFile(chunk)) {
      errors.push({
        field: "content",
        message: "File appears to be binary, not text.",
        code: "BINARY",
      });
    }

    if (!/[,\t;|]/.test(chunk)) {
      errors.push({
        field: "structure",
        message: "File does not appear to be CSV format",
        code: "STRUCTURE",
      });
    }
  } catch {
    errors.push({
      field: "encoding",
      message: "Unable to read file. Ensure valid UTF-8 encoding.",
      code: "ENCODING",
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
```

## Pattern: Formula Injection Prevention

```typescript
/**
 * Sanitize CSV cell values to prevent formula injection
 *
 * Excel/LibreOffice execute formulas starting with: = + - @ | %
 * Example attack: =cmd|'/c calc'!A0 (opens calculator)
 */
export function sanitizeCsvValue(value: string | null | undefined): string {
  if (!value) return "";

  const trimmed = String(value).trim();

  const FORMULA_CHARS = ["=", "+", "-", "@", "|", "%"];
  if (FORMULA_CHARS.some(char => trimmed.startsWith(char))) {
    return `'${trimmed}`; // Prefix with single quote
  }

  // Remove control characters
  return trimmed.replace(/[\x00-\x1F\x7F]/g, "");
}

// Examples
sanitizeCsvValue("=cmd|'/c calc'!A0") // Returns: "'=cmd|'/c calc'!A0"
sanitizeCsvValue("normal text")       // Returns: "normal text"
sanitizeCsvValue("+SUM(A1:A10)")      // Returns: "'+SUM(A1:A10)"
```

**Attack Vector:**
```
1. Attacker uploads CSV with formula: =cmd|'/c calc'!A0
2. Admin opens CSV in Excel
3. Excel executes formula → Opens calculator
4. Real attack: =cmd|'/c powershell -c "malicious code"'
```

## Pattern: Binary File Detection

```typescript
/**
 * Detect binary files by checking for common magic bytes
 */
function isBinaryFile(chunk: string): boolean {
  const binarySignatures = [
    "\xFF\xD8\xFF", // JPEG
    "\x89PNG", // PNG
    "GIF8", // GIF
    "\x1F\x8B", // GZIP
    "PK\x03\x04", // ZIP
    "MZ", // EXE
    "\x7FELF", // Linux executable
    "%PDF", // PDF
    "\xD0\xCF\x11\xE0", // MS Office (old format)
  ];

  return binarySignatures.some(sig => chunk.startsWith(sig));
}
```

**Why Binary Detection:**
- Prevents malware uploads disguised as CSVs
- Catches executables renamed to .csv
- Detects Office documents with macros
- Blocks compressed files with exploits

## Usage in Component

```typescript
import { validateCsvFile, getSecurePapaParseConfig, sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

function ContactImport() {
  const handleFileUpload = async (file: File) => {
    // 1. Validate file
    const validation = await validateCsvFile(file);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // 2. Use secure Papa Parse config
    Papa.parse(file, {
      ...getSecurePapaParseConfig(),
      complete: async (results) => {
        // 3. Sanitize ALL cell values
        const sanitized = results.data.map(row => ({
          name: sanitizeCsvValue(row.name),
          email: sanitizeCsvValue(row.email),
        }));

        // 4. Validate with Zod schema
        await importContacts(sanitized);
      }
    });
  };
}
```

## Related Resources

- [security-sql.md](security-sql.md) - SQL injection prevention
- [security-rls.md](security-rls.md) - RLS policies
- [validation-basics.md](validation-basics.md) - Zod validation

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
