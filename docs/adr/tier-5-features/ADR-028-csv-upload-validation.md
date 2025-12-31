# ADR-028: CSV Upload Validation with DoS Prevention

## Status

**Accepted**

## Date

Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

CSV file uploads present significant security risks in web applications. Without proper validation, attackers can exploit file uploads for:

1. **Denial of Service (DoS)**: Uploading massive files (100MB+) to exhaust server memory and bandwidth
2. **Memory Exhaustion**: CSVs with millions of rows consuming all available RAM during parsing
3. **Formula Injection**: Malicious formulas like `=cmd|'/c calc'!A0` that execute when opened in Excel
4. **MIME Type Spoofing**: Executables renamed to `.csv` bypassing naive extension checks
5. **Binary File Injection**: Embedding malware in apparent CSV files

Crispy CRM's contact and organization import features require CSV uploads from the browser, making client-side validation the first line of defense.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **No validation (trust user)** | Simplest | All attacks possible |
| **Extension check only** | Easy to implement | Trivially bypassed by renaming |
| **MIME type check only** | Slightly better | MIME types can be spoofed |
| **Server-side only validation** | Backend security | DoS still possible (upload completes) |
| **Multi-layer validation (chosen)** | Defense in depth | More code complexity |

---

## Decision

Implement **multi-layer CSV validation** with configurable security limits enforced at both file and content levels.

### Security Constants

```typescript
// src/atomic-crm/utils/csvUploadValidator.ts:17-23

export const CSV_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 10000,
  MAX_CELL_LENGTH: 1000,
  ALLOWED_MIME_TYPES: ["text/csv", "text/plain", "application/vnd.ms-excel"],
  ALLOWED_EXTENSIONS: [".csv"],
} as const;
```

### Validation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    File Input Event                          │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 1: validateCsvFile()                              │ │
│  │   • File size check (≤10MB)                             │ │
│  │   • Extension check (.csv required)                     │ │
│  │   • MIME type warning (non-blocking)                    │ │
│  │   • Binary signature detection (magic bytes)            │ │
│  │   • CSV structure check (delimiters present)            │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 2: getSecurePapaParseConfig()                     │ │
│  │   • Row limit preview (10,000 max)                      │ │
│  │   • Header sanitization (alphanumeric + underscore)     │ │
│  │   • Cell sanitization (formula prefix detection)        │ │
│  │   • Cell length truncation (1,000 chars max)            │ │
│  │   • Dynamic typing disabled (string-only)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 3: sanitizeCsvValue() (per-cell)                  │ │
│  │   • Formula injection neutralization                    │ │
│  │   • Control character removal                           │ │
│  │   • HTML tag stripping                                  │ │
│  │   • Length enforcement                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### DoS Prevention Rationale

| Limit | Value | Threat Mitigated |
|-------|-------|------------------|
| `MAX_FILE_SIZE` | 10MB | Network bandwidth exhaustion, storage abuse |
| `MAX_ROWS` | 10,000 | Browser memory exhaustion during parsing |
| `MAX_CELL_LENGTH` | 1,000 | Single-cell memory bombs (10MB in one cell) |

### Formula Injection Prevention

CSV formula injection (DDE attack) allows code execution when files are opened in Excel. The validation neutralizes dangerous prefixes:

```typescript
// src/atomic-crm/utils/csvUploadValidator.ts:183-191

transform: (value: string, _field: string) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  // Detect formula prefixes: =, +, -, @, tab, carriage return
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    // Prepend single quote to prevent formula evaluation
    return "'" + trimmed;
  }
  // ...
}
```

### Binary File Detection

Detects disguised binary files by checking magic bytes:

```typescript
// src/atomic-crm/utils/csvUploadValidator.ts:137-153

function isBinaryFile(chunk: string): boolean {
  const binarySignatures = [
    "\xFF\xD8\xFF",     // JPEG
    "\x89PNG",          // PNG
    "GIF8",             // GIF
    "\x1F\x8B",         // GZIP
    "PK\x03\x04",       // ZIP
    "MZ",               // Windows EXE
    "\x7FELF",          // Linux executable
    "%PDF",             // PDF
    "\xD0\xCF\x11\xE0", // MS Office (old format)
  ];

  return binarySignatures.some((sig) => chunk.startsWith(sig));
}
```

---

## Code Examples

### Correct Pattern - Full Validation Flow

```typescript
// src/atomic-crm/contacts/ContactImportDialog.tsx:253-265

import { validateCsvFile, getSecurePapaParseConfig } from "../utils/csvUploadValidator";
import Papa from "papaparse";

// Step 1: File-level validation (before parsing)
const validationResult = await validateCsvFile(file);
if (!validationResult.valid) {
  setErrors(validationResult.errors.map(e => e.message));
  return;
}

// Step 2: Parse with secure config
Papa.parse(file, {
  ...getSecurePapaParseConfig(),
  complete: (results) => {
    // Results are sanitized - safe to process
    handleParsedData(results.data);
  },
});
```

### Correct Pattern - PapaParse Integration

```typescript
// src/atomic-crm/organizations/OrganizationImportDialog.tsx:719-730

import Papa from "papaparse";
import { getSecurePapaParseConfig } from "@/atomic-crm/utils";

Papa.parse(file, {
  ...getSecurePapaParseConfig(),
  complete: (results) => {
    // Headers already sanitized, cells truncated, formulas neutralized
    setRawHeaders(results.meta.fields || []);
    setRawDataRows(results.data);
  },
  error: (error) => {
    // Error handler from config already logs to console
    throw error;
  },
});
```

### Correct Pattern - Additional Cell Sanitization

```typescript
// When further sanitization needed beyond PapaParse transform

import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

const processedData = rawData.map(row => ({
  ...row,
  notes: sanitizeCsvValue(row.notes),      // Extra sanitization for rich text
  name: sanitizeCsvValue(row.name),
}));
```

---

## Anti-Patterns

### 1. No File Validation (NEVER DO THIS)

```typescript
// WRONG: Directly parsing without validation
Papa.parse(file, {
  complete: (results) => {
    // 100MB file just consumed all browser memory
    processData(results.data);
  },
});
```

### 2. Extension-Only Check (NEVER DO THIS)

```typescript
// WRONG: Trivially bypassed by renaming malware.exe to malware.csv
if (!file.name.endsWith('.csv')) {
  return { error: 'Must be CSV' };
}
// File could still be executable
```

### 3. Missing Formula Sanitization (NEVER DO THIS)

```typescript
// WRONG: Raw values passed to processing
Papa.parse(file, {
  header: true,
  complete: (results) => {
    // Cell value "=cmd|'/c calc'!A0" passed through unchanged
    results.data.forEach(row => insertToDatabase(row));
  },
});
```

### 4. Unlimited Row Processing (NEVER DO THIS)

```typescript
// WRONG: No row limit - million-row CSV crashes browser
Papa.parse(file, {
  // Missing: preview: MAX_ROWS
  complete: (results) => {
    // Browser tab becomes unresponsive
  },
});
```

---

## Consequences

### Positive

- **Defense in Depth**: Multiple validation layers catch different attack vectors
- **Client-Side Prevention**: DoS attacks fail before consuming server resources
- **Formula Safety**: Excel/Sheets opening imported data won't execute code
- **Configurable Limits**: Constants allow adjustment for different use cases
- **Type Safety**: Exported types enable proper TypeScript integration

### Negative

- **Processing Overhead**: Each file requires multiple validation passes
- **False Positives**: Some legitimate large files (>10MB) rejected
- **Complexity**: Three layers of validation code to maintain

### Neutral

- **User Feedback**: Clear error messages explain why uploads fail
- **10,000 Row Limit**: Sufficient for expected import sizes (MFB has ~2,000 contacts)

---

## Related ADRs

- **[ADR-002: Zod Validation at API Boundary](./ADR-002-zod-api-boundary.md)** - Server-side validation pattern (defense in depth)
- **[ADR-014: Fail-Fast Philosophy](./ADR-014-fail-fast-philosophy.md)** - Validation errors throw immediately
- **[ADR-032: CSV Data Import Architecture](./ADR-032-csv-import-architecture.md)** - How validated CSV data is imported

---

## References

- Primary Implementation: `src/atomic-crm/utils/csvUploadValidator.ts`
- Legacy Implementation: `src/lib/csvUploadValidator.ts` (simpler, 5MB limit)
- Usage - Contacts: `src/atomic-crm/contacts/ContactImportDialog.tsx`
- Usage - Organizations: `src/atomic-crm/organizations/OrganizationImportDialog.tsx`
- PapaParse Hook: `src/atomic-crm/contacts/usePapaParse.tsx`
- Tests: `src/atomic-crm/utils/__tests__/csvUploadValidator.test.ts`
- OWASP File Upload Guidelines: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
