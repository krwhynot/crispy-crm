# Utility Patterns

Standard patterns for shared utilities in Crispy CRM.

## Utility Hierarchy

```
+-----------------------------------------------------+
|              APPLICATION LAYER                       |
|  (Components, Forms, Data Provider)                  |
+-----------------+-----------------------------------+
|  UI UTILITIES   |   DATA UTILITIES                  |
|  +- cn()        |  +- parseDateSafely()             |
|  +- colors      |  +- sanitization                  |
|                 |  +- csvUploadValidator            |
+-----------------+-----------------------------------+
| REACT UTILITIES |   LOGGING                         |
|  +- genericMemo |  +- logger (Sentry)               |
|  +- FieldProps  |  +- devLogger (dev-only)          |
|  +- inputProps  |  +- i18nProvider                  |
+-----------------+-----------------------------------+
```

---

## Pattern A: Classname Utilities

For combining Tailwind classes with conflict resolution.

```tsx
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage in components:
<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-primary text-primary-foreground",
  className
)} />
```

**When to use**: Any component that accepts a `className` prop or conditionally applies Tailwind classes. The `cn()` function handles class conflicts (e.g., `cn("px-4", "px-2")` returns `"px-2"`).

---

## Pattern B: Date Utilities

For parsing ISO date strings safely with validation.

```tsx
// src/lib/date-utils.ts
import { parseISO, isValid } from 'date-fns';

/**
 * Safely parse an ISO date string with validation.
 *
 * Per ADR utilities-best-practices: Use parseISO() instead of new Date()
 * for ISO string parsing, and always validate with isValid().
 *
 * @example
 * const date = parseDateSafely('2025-12-03T10:00:00Z');
 * if (date) {
 *   format(date, 'PP');
 * }
 */
export function parseDateSafely(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null;
  }

  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

// Usage:
const createdAt = parseDateSafely(record.created_at);
if (createdAt) {
  return format(createdAt, 'PP'); // "Dec 3, 2025"
}
```

**When to use**: Always use for ISO date strings from the database or API. Never use `new Date(isoString)` directly - it has browser inconsistencies with timezone handling.

---

## Pattern C: CSV Upload Validation

For secure processing of user-uploaded CSV files with DoS protection.

```tsx
// src/lib/csvUploadValidator.ts

// Security Constants (DoS Prevention)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;    // 5MB
export const MAX_ROW_COUNT = 10_000;              // 10k rows
export const MAX_CELL_LENGTH = 1000;              // 1000 chars per cell
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
] as const;

/**
 * Validates a CSV file before parsing.
 * Checks file size and MIME type for DoS prevention.
 */
export function validateCsvFile(
  file: File,
  options: CsvValidationOptions
): CsvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxSize = options.maxFileSize ?? MAX_FILE_SIZE;

  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`File exceeds maximum size of ${sizeMB}MB`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates that required headers are present in CSV.
 */
export function validateCsvHeaders(
  headers: string[],
  required: string[]
): HeaderValidationResult {
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

  return { valid: missing.length === 0, missing, found };
}

/**
 * Sanitizes a CSV cell value for safe processing.
 * - Trims whitespace
 * - Enforces max length (DoS prevention)
 * - Removes null bytes and control characters
 */
export function sanitizeCsvCell(
  value: string,
  maxLength: number = MAX_CELL_LENGTH
): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  const cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const trimmed = cleaned.trim();

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

// Usage:
const result = validateCsvFile(file, {
  requiredHeaders: ['name', 'email', 'phone'],
  maxFileSize: 2 * 1024 * 1024, // 2MB
});

if (!result.isValid) {
  throw new Error(`Validation failed: ${result.errors.join(', ')}`);
}
```

**When to use**: Processing any user-uploaded CSV files. Always validate file size, headers, and sanitize cell contents before processing.

---

## Pattern D: Logging Infrastructure

### Production Logger (Sentry Integration)

```tsx
// src/lib/logger.ts
import * as Sentry from "@sentry/react";

/**
 * Structured Logging Utility with Sentry Integration
 *
 * - Adds structured context to all log entries
 * - Tracks metrics for health monitoring
 * - Forwards errors and warnings to Sentry
 */
class Logger {
  private isProduction = import.meta.env.PROD;
  private minLevel: LogLevel = this.isProduction ? "info" : "debug";

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log("error", message, context, errorObj);
  }

  /**
   * Track a metric for health monitoring
   */
  metric(name: string, value: number, tags?: Record<string, string>): void {
    // Add to circular buffer for health dashboard
  }

  /**
   * Add a breadcrumb for user action tracking
   * Breadcrumbs provide context leading up to an error
   */
  breadcrumb(
    message: string,
    data?: Record<string, unknown>,
    category: "ui" | "navigation" | "user" | "data" | "http" = "user"
  ): void {
    Sentry.addBreadcrumb({
      category,
      message,
      level: "info",
      data,
    });
  }
}

export const logger = new Logger();

// Usage:
logger.info('User logged in', { userId: '123', role: 'admin' });
logger.error('Failed to save opportunity', new Error('Network error'), { opportunityId: '456' });
logger.metric('api_latency', 250, { endpoint: '/opportunities' });
logger.breadcrumb('Opened contact slide-over', { contactId: '789' });
```

### Development Logger (Tree-Shaken in Production)

```tsx
// src/lib/devLogger.ts

/** Re-export for convenient inline guards */
export const DEV = import.meta.env.DEV;

/**
 * Development-only console.log wrapper.
 * Use for simple logging where argument evaluation cost is negligible.
 *
 * DEAD CODE ELIMINATION NOTES:
 * - Vite/esbuild will eliminate `if (import.meta.env.DEV)` blocks in production
 */
export function devLog(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.log(`[${context}]`, message, data !== undefined ? data : "");
  }
}

export function devWarn(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message, data !== undefined ? data : "");
  }
}

export function devError(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, message, data !== undefined ? data : "");
  }
}

// Usage:
devLog('MyComponent', 'loaded');

// For expensive argument computation, use inline guards:
if (DEV) {
  console.log('[MyComponent]', 'data:', JSON.stringify(largeObject, null, 2));
}
```

**When to use**:
- **logger**: Production error tracking, metrics, user action breadcrumbs
- **devLog/devWarn/devError**: Debug output that should never appear in production

---

## Pattern E: Sanitization Utilities

For rendering user-generated HTML content safely.

```tsx
// src/lib/sanitization.ts
import DOMPurify from 'dompurify';

export interface SanitizationConfig {
  allowBasicFormatting?: boolean;  // <b>, <i>, <em>, <strong>
  allowLinks?: boolean;            // <a href="...">
  allowLists?: boolean;            // <ul>, <ol>, <li>
  allowHeadings?: boolean;         // <h1> through <h6>
  allowParagraphs?: boolean;       // <p>, <br>, <div>
  allowedTags?: string[];          // Custom override
  allowedAttributes?: string[];    // Custom override
}

/**
 * Sanitizes HTML content using DOMPurify with configurable security levels
 */
export function sanitizeHtml(htmlContent: string, config?: SanitizationConfig): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  const purifyConfig = buildPurifyConfig(config);
  return DOMPurify.sanitize(htmlContent, purifyConfig);
}

/**
 * Sanitizes HTML for email templates - allows common email formatting
 */
export function sanitizeEmailHtml(htmlContent: string): string {
  return sanitizeHtml(htmlContent, {
    allowBasicFormatting: true,
    allowLinks: true,
    allowLists: true,
    allowHeadings: true,
    allowParagraphs: true,
  });
}

/**
 * Sanitizes HTML for plain text contexts - strips all tags
 */
export function sanitizeToPlainText(htmlContent: string): string {
  return sanitizeHtml(htmlContent, {
    allowedTags: [],
    allowedAttributes: [],
  });
}

/**
 * Sanitizes HTML for basic formatting only - no links or complex elements
 */
export function sanitizeBasicHtml(htmlContent: string): string {
  return sanitizeHtml(htmlContent, {
    allowBasicFormatting: true,
    allowLinks: false,
    allowLists: false,
    allowHeadings: false,
    allowParagraphs: true,
  });
}

// Usage:
const safeHtml = sanitizeHtml(userInput);
const plainText = sanitizeToPlainText(richTextContent);
const emailBody = sanitizeEmailHtml(templateHtml);
```

**When to use**: Any time you render user-generated HTML content with `dangerouslySetInnerHTML`. Always sanitize first to prevent XSS attacks.

---

## Pattern F: Type Helpers

### Semantic Color Types

```tsx
// src/lib/color-types.ts

/**
 * Available tag color names in the semantic color system
 */
export type TagColorName =
  | 'warm'
  | 'yellow'
  | 'pink'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'gray'
  | 'clay'
  | 'sage'
  | 'amber'
  | 'cocoa';

export interface SemanticColorToken {
  name: TagColorName;
  cssClass: string;
  hexFallback: string;
}

/**
 * Semantic color definitions with CSS classes
 */
export const SEMANTIC_COLORS: Record<TagColorName, SemanticColorToken> = {
  warm: { name: 'warm', cssClass: 'tag-warm', hexFallback: '#eddcd2' },
  yellow: { name: 'yellow', cssClass: 'tag-yellow', hexFallback: '#fff1e6' },
  pink: { name: 'pink', cssClass: 'tag-pink', hexFallback: '#fde2e4' },
  green: { name: 'green', cssClass: 'tag-green', hexFallback: '#dbe7e4' },
  teal: { name: 'teal', cssClass: 'tag-teal', hexFallback: '#c5dedd' },
  blue: { name: 'blue', cssClass: 'tag-blue', hexFallback: '#d6e2e9' },
  purple: { name: 'purple', cssClass: 'tag-purple', hexFallback: '#8b5cf6' },
  gray: { name: 'gray', cssClass: 'tag-gray', hexFallback: '#f0efeb' },
  clay: { name: 'clay', cssClass: 'tag-clay', hexFallback: '#f0d9c0' },
  sage: { name: 'sage', cssClass: 'tag-sage', hexFallback: '#e8eedf' },
  amber: { name: 'amber', cssClass: 'tag-amber', hexFallback: '#f9eeda' },
  cocoa: { name: 'cocoa', cssClass: 'tag-cocoa', hexFallback: '#e9dcd0' },
};

export const VALID_TAG_COLORS: TagColorName[] = [
  'warm', 'green', 'teal', 'blue', 'purple', 'yellow', 'gray', 'pink',
  'clay', 'sage', 'amber', 'cocoa',
];

// Usage:
const color: TagColorName = 'warm';
const token = SEMANTIC_COLORS[color];
<span className={token.cssClass}>Tag</span>
```

### Field Props Interface

```tsx
// src/lib/field.type.ts
import type { BaseFieldProps } from "ra-core";
import type { ReactNode } from "react";

/**
 * Extended field props that include Datagrid column configuration.
 * These props are passed by Datagrid/PremiumDatagrid to their child field components.
 */
export interface FieldProps<RecordType extends Record<string, any> = Record<string, any>>
  extends Omit<BaseFieldProps<RecordType>, "resource"> {
  empty?: ReactNode;
  label?: ReactNode;
  sortable?: boolean;
  sortBy?: string;
  textAlign?: "left" | "center" | "right";
  cellClassName?: string;
  headerClassName?: string;
  rowClassName?: string;
  resource?: string;
  defaultValue?: unknown;
}

// Usage in custom field components:
export function MyCustomField<RecordType extends Record<string, any>>(
  props: FieldProps<RecordType>
) {
  const { source, record, label, sortable, cellClassName, ...rest } = props;
  // Filter out Datagrid props before passing to DOM
  return <span {...rest}>{record?.[source]}</span>;
}
```

### Generic Memo Helper

```tsx
// src/lib/genericMemo.ts
import type { FunctionComponent } from "react";
import { memo } from "react";

/**
 * A version of React.memo that preserves the original component type
 * allowing it to accept generics.
 *
 * @see https://stackoverflow.com/a/70890101
 * @deprecated Use genericMemo from "ra-core" when available.
 */
export function genericMemo<T>(component: T): T {
  const result = memo(component as FunctionComponent);
  // @ts-expect-error: genericMemo does not have a displayName property
  result.displayName = component.displayName?.replace("Impl", "");
  return result as unknown as T;
}

// Usage:
const MyFieldImpl = <T extends Record<string, any>>(props: FieldProps<T>) => {
  // ...
};
MyFieldImpl.displayName = 'MyFieldImpl';
export const MyField = genericMemo(MyFieldImpl);
```

**When to use**:
- **TagColorName/SEMANTIC_COLORS**: Type-safe color selection for tags and UI elements
- **FieldProps**: Custom React Admin field components that work in Datagrid
- **genericMemo**: Memoizing generic React components without losing type inference

---

## Pattern Comparison

| Pattern | File | Primary Use Case |
|---------|------|------------------|
| **A: cn()** | utils.ts | Tailwind class merging |
| **B: parseDateSafely** | date-utils.ts | ISO date parsing |
| **C: CSV Validation** | csvUploadValidator.ts | File upload security |
| **D: Logger** | logger.ts | Production error tracking |
| **D: DevLogger** | devLogger.ts | Dev-only debug output |
| **E: Sanitization** | sanitization.ts | XSS prevention |
| **F: Color Types** | color-types.ts | Design system tokens |
| **F: FieldProps** | field.type.ts | React Admin field types |
| **F: genericMemo** | genericMemo.ts | Generic component memoization |
| **—** | i18nProvider.ts | React Admin i18n setup |
| **—** | sanitizeInputRestProps.ts | Filter RA input props for DOM |

---

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| `new Date(isoString)` | Use `parseDateSafely(isoString)` |
| Hardcoded hex colors (`#ef4444`) | Use `SEMANTIC_COLORS[colorName]` |
| Manual className strings | Use `cn()` for conflict resolution |
| `console.log` in production code | Use `devLog()` with DEV guard |
| `dangerouslySetInnerHTML` without sanitization | Always use `sanitizeHtml()` first |
| Direct file processing without size limits | Use `validateCsvFile()` with limits |
| Passing RA input props to DOM elements | Use `sanitizeInputRestProps()` to filter |

---

## Migration Checklist

When adding or modifying utilities:

- [ ] Check if utility already exists in `src/lib/`
- [ ] Follow naming convention (camelCase functions, PascalCase types)
- [ ] Add JSDoc documentation with `@example`
- [ ] Export from correct file (prefer existing files over new)
- [ ] Add unit tests in `src/lib/__tests__/`
- [ ] Update this PATTERNS.md file
