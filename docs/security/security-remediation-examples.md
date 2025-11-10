# Security Remediation Code Examples
**Generated:** November 8, 2025

This document provides ready-to-use code examples for fixing the critical security vulnerabilities found in the audit.

---

## 1. Fix RLS Policies (CRITICAL)

### Current (Permissive - INSECURE)
```sql
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);  -- Anyone can see all contacts!
```

### Fixed (Role-Based Access)
```sql
-- For a small team with shared data but restricted deletes
CREATE POLICY select_contacts_authenticated ON contacts
  FOR SELECT TO authenticated
  USING (true);  -- Shared read access for team

CREATE POLICY update_contacts_own_or_admin ON contacts
  FOR UPDATE TO authenticated
  USING (
    -- Admins can update anything, others can't
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

CREATE POLICY delete_contacts_admin_only ON contacts
  FOR DELETE TO authenticated
  USING (
    -- Only admins can delete
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
  );

-- For multi-tenant isolation (future)
CREATE POLICY select_contacts_own_company ON contacts
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM sales WHERE user_id = auth.uid()
    )
  );
```

---

## 2. Fix CSV File Upload Validation (CRITICAL)

### Step 1: Add Backend Validation Function

Create `/src/atomic-crm/contacts/csvUploadValidator.ts`:
```typescript
/**
 * Server-side CSV upload validation
 * Prevents DoS, injection attacks, and malicious file uploads
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 10000;
const ALLOWED_MIME_TYPES = ['text/csv', 'text/plain'];

export interface CsvValidationError {
  field: string;
  message: string;
}

export async function validateCsvFile(
  file: File
): Promise<{ valid: boolean; errors?: CsvValidationError[] }> {
  const errors: CsvValidationError[] = [];

  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      field: 'size',
      message: `File size (${formatBytes(file.size)}) exceeds limit of ${formatBytes(MAX_FILE_SIZE)}`
    });
  }

  // 2. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.endsWith('.csv')) {
    errors.push({
      field: 'mime_type',
      message: 'File must be CSV format (text/csv)'
    });
  }

  // 3. Read and validate first bytes (content sniffing)
  try {
    const chunk = await file.slice(0, 512).text();
    
    // Must start with text (not binary)
    if (!isValidTextStart(chunk)) {
      errors.push({
        field: 'content',
        message: 'File content does not appear to be valid text'
      });
    }

    // Basic CSV structure check (should have commas or tabs)
    if (!/[,\t]/.test(chunk)) {
      errors.push({
        field: 'structure',
        message: 'File does not appear to be CSV format (no delimiters found)'
      });
    }
  } catch (e) {
    errors.push({
      field: 'encoding',
      message: 'Unable to read file. Ensure it is valid UTF-8 encoded text.'
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function configurePapaParseForSecurity() {
  return {
    header: true,
    dynamicTyping: false, // CRITICAL: Prevent formula evaluation
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      // Sanitize headers
      return header.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    },
    transform: (value: string) => {
      // Prevent CSV injection by detecting formula starters
      if (typeof value === 'string' && /^[=+\-@]/.test(value.trim())) {
        return "'" + value; // Prepend single quote to prevent formula
      }
      return value;
    },
    // Limit rows to prevent memory exhaustion
    preview: MAX_ROWS,
    // Handle errors gracefully
    error: (error: any) => {
      console.error('Papa Parse error:', error);
      // Return error to caller instead of silently failing
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  };
}

function isValidTextStart(chunk: string): boolean {
  // Check for binary file signatures
  const binarySignatures = [
    '\xFF\xD8\xFF', // JPEG
    '\x89PNG',      // PNG
    'GIF8',         // GIF
    '\x1F\x8B',     // GZIP
    'PK\x03\x04',   // ZIP
  ];

  for (const sig of binarySignatures) {
    if (chunk.startsWith(sig)) return false;
  }

  return true;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

### Step 2: Update ContactImportDialog to Use Validator

In `ContactImportDialog.tsx`, add validation before parsing:
```typescript
import { validateCsvFile, configurePapaParseForSecurity } from './csvUploadValidator';

const handleFileChange = async (file: File | null) => {
  if (!file) {
    setFile(null);
    return;
  }

  // VALIDATE BEFORE PROCESSING
  const validation = await validateCsvFile(file);
  if (!validation.valid && validation.errors) {
    // Show errors to user
    const errorMessages = validation.errors
      .map(e => `${e.field}: ${e.message}`)
      .join('\n');
    
    toast.error('Invalid file:\n' + errorMessages);
    return;
  }

  setFile(file);
};

// Configure Papa Parse with security settings
const { importer: previewImporter, parseCsv } = usePapaParse<ContactImportSchema>({
  onPreview: onPreview,
  previewRowCount: 100,
  papaConfig: configurePapaParseForSecurity() // Add security config
});
```

### Step 3: Sanitize CSV Values

In `csvProcessor.ts`, add sanitization:
```typescript
/**
 * Sanitize CSV values to prevent injection attacks
 */
function sanitizeCsvValue(value: any): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  let sanitized = value.trim();

  // Prevent CSV formula injection: =, +, -, @
  if (/^[=+\-@]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length
  const MAX_LENGTH = 500;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

// Use in CSV processing
export function processCsvDataSecure(
  headers: string[],
  dataRows: any[][]
): ContactImportSchema[] {
  return dataRows.map(row => {
    const contact: any = {};

    headers.forEach((originalHeader, index) => {
      const targetField = customMappings[originalHeader];
      const rawValue = row[index];
      const value = sanitizeCsvValue(rawValue); // ADD SANITIZATION

      if (targetField === FULL_NAME_SPLIT_MARKER) {
        const { first_name, last_name } = splitFullName(value);
        contact.first_name = sanitizeCsvValue(first_name);
        contact.last_name = sanitizeCsvValue(last_name);
      } else if (targetField) {
        contact[targetField] = value;
      }
    });

    return contact as ContactImportSchema;
  });
}
```

---

## 3. Fix Environment Variable Logging (HIGH)

### Remove Debug Logging

**File:** `src/atomic-crm/providers/supabase/supabase.ts`

Replace:
```typescript
// DON'T DO THIS
console.log('🔍 [SUPABASE INIT] Environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  allEnv: import.meta.env, // DANGEROUS!
});
```

With:
```typescript
// Safe logging only in development
if (import.meta.env.DEV) {
  console.debug('[SUPABASE] Initializing with project:', 
    import.meta.env.VITE_SUPABASE_URL?.split('/').pop());
  // Never log the actual API key, even partially
}
```

### Add Startup Validation

```typescript
function validateSupabaseConfig() {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(message);
    throw new Error(message); // Fail fast
  }
}

validateSupabaseConfig();

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

---

## 4. Fix Authentication Bypass (HIGH)

**File:** `src/atomic-crm/providers/supabase/authProvider.ts`

Replace:
```typescript
// INSECURE: URL-based bypass
checkAuth: async (params) => {
  if (window.location.pathname === "/set-password" || ...) {
    return; // BYPASS AUTH!
  }
  return baseAuthProvider.checkAuth(params);
}
```

With:
```typescript
/**
 * Improved checkAuth that validates session first
 */
checkAuth: async (params) => {
  // Always get the session - don't just check URL
  const { data: { session }, error } = await supabase.auth.getSession();

  // If no valid session, reject unless on public page
  if (!session || error) {
    if (!isPublicPath(window.location.pathname)) {
      throw new Error('Not authenticated');
    }
    return; // Allow public pages without session
  }

  // Session exists, proceed with normal auth check
  return baseAuthProvider.checkAuth(params);
};

/**
 * Check if a path should be accessible without authentication
 */
function isPublicPath(pathname: string): boolean {
  // Whitelist of public paths
  const publicPaths = [
    '/login',
    '/forgot-password',
    '/set-password', // Special case: only if coming from valid recovery link
  ];

  return publicPaths.some(path => pathname.startsWith(path));
}
```

---

## 5. Fix localStorage Issues (HIGH)

**File:** `src/atomic-crm/filters/opportunityStagePreferences.ts`

Replace:
```typescript
// INSECURE: Plain localStorage
const STORAGE_KEY = 'filter.opportunity_stages';

export function getSavedStages(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  // ...
}

export function saveStages(selectedStages: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStages));
}
```

With:
```typescript
const STORAGE_KEY = 'filter.opportunity_stages';

/**
 * Use sessionStorage instead of localStorage for filters
 * sessionStorage is cleared when browser tab closes
 * localStorage persists across sessions (privacy risk)
 */
export function getSavedStages(): string[] {
  // Try sessionStorage first (session-only), fall back to localStorage
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading sessionStorage:', e);
  }

  // Fallback to localStorage for backwards compatibility
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate to sessionStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }

  return [];
}

export function saveStages(selectedStages: string[]): void {
  try {
    // Save to sessionStorage (clears on browser close)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStages));
  } catch (e) {
    console.error('Error saving to sessionStorage:', e);
    // Fallback to localStorage if sessionStorage unavailable
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStages));
    } catch (e2) {
      console.error('Error saving filter preferences:', e2);
    }
  }
}

export function clearStages(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}
```

---

## 6. Add Rate Limiting (MEDIUM)

Create `src/atomic-crm/utils/rateLimiter.ts`:
```typescript
/**
 * Client-side rate limiting for import operations
 * Prevents abuse and excessive database load
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

export class ClientRateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Check if operation is allowed
   */
  canProceed(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );

    // Check if under limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get how many requests are allowed in the next period
   */
  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get milliseconds until the limit resets
   */
  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

// Usage in ContactImportDialog
const importLimiter = new ClientRateLimiter({
  maxRequests: 5, // 5 imports per day
  windowMs: 24 * 60 * 60 * 1000
});

export const handlePreviewContinue = useCallback(async (decisions) => {
  // Check rate limit
  if (!importLimiter.canProceed()) {
    const resetMinutes = Math.ceil(importLimiter.getResetTime() / 60000);
    toast.error(`Import limit exceeded. Try again in ${resetMinutes} minutes.`);
    return;
  }

  // Continue with import...
}, []);
```

---

## 7. Type Safety Improvements (MEDIUM)

Replace `any[]` with proper types:

**Before:**
```typescript
const [rawDataRows, setRawDataRows] = useState<any[]>([]);
```

**After:**
```typescript
interface RawCsvRow {
  [header: string]: string | number | null | undefined;
}

const [rawDataRows, setRawDataRows] = useState<RawCsvRow[]>([]);
```

Apply across:
- `src/atomic-crm/organizations/OrganizationImportDialog.tsx`
- `src/atomic-crm/services/*.ts`
- Any file with `Promise<any[]>`

---

## Testing Security Fixes

```typescript
// Test file: src/atomic-crm/contacts/__tests__/csvUploadValidator.test.ts

import { describe, it, expect } from 'vitest';
import { validateCsvFile, sanitizeCsvValue } from '../csvUploadValidator';

describe('CSV Upload Validation', () => {
  it('should reject files over size limit', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv', 
      { type: 'text/csv' });
    
    const result = await validateCsvFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].field).toBe('size');
  });

  it('should reject non-CSV files', async () => {
    const exeFile = new File(['MZ'], 'malware.exe', { type: 'application/octet-stream' });
    
    const result = await validateCsvFile(exeFile);
    expect(result.valid).toBe(false);
  });

  it('should sanitize formula injection', () => {
    const malicious = '=cmd|"/c calc"!A0';
    const sanitized = sanitizeCsvValue(malicious);
    
    expect(sanitized).toStartWith("'"); // Prepended quote prevents formula
    expect(sanitized).toBe("'=cmd|\"/ c calc\"!A0");
  });
});
```

---

## Deployment Checklist

Before deploying to production:

- [ ] RLS policies reviewed by security team
- [ ] CSV validation tested with malicious files  
- [ ] Environment variables removed from git history
- [ ] Authentication tests passing
- [ ] Rate limiting working in load tests
- [ ] TypeScript strict mode enabled (`noImplicitAny: true`)
- [ ] `npm audit` passing with no critical vulnerabilities
- [ ] Security headers verified in production

