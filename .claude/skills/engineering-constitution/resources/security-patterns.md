# Security Patterns

## Purpose

Document security patterns for Atomic CRM including CSV upload validation, SQL injection prevention, RLS policies, and authentication. Covers both client-side and server-side security measures.

## Core Principle: Defense in Depth

**Security Model:** Validate at multiple layers
1. **Client-side** - First line of defense (file validation)
2. **API boundary** - Zod validation (SQL injection prevention)
3. **Database** - RLS policies (row-level access control)

**Critical Rule:** Never trust user input at any layer.

## Pattern 1: CSV Upload Security

### File Validation Pattern

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
 * Runs client-side as first line of defense
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
      message: `File size (${formatBytes(file.size)}) exceeds limit of ${formatBytes(CSV_UPLOAD_LIMITS.MAX_FILE_SIZE)}`,
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

  // 3. MIME type check (weak protection, but catches obvious mistakes)
  if (file.type && !CSV_UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
    warnings.push(`MIME type "${file.type}" is unusual for CSV. Expected: text/csv`);
  }

  // 4. Content sniffing - read first bytes to detect binary files
  try {
    const chunk = await file.slice(0, 1024).text();

    // Check for binary file signatures (magic bytes)
    if (isBinaryFile(chunk)) {
      errors.push({
        field: "content",
        message: "File appears to be binary, not text. Only CSV text files allowed.",
        code: "BINARY",
      });
    }

    // Check for CSV structure (should have delimiters)
    if (!/[,\t;|]/.test(chunk)) {
      errors.push({
        field: "structure",
        message: "File does not appear to be CSV format (no delimiters found)",
        code: "STRUCTURE",
      });
    }
  } catch {
    errors.push({
      field: "encoding",
      message: "Unable to read file. Ensure it is valid UTF-8 encoded text.",
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

**Usage in Component:**

```typescript
import { validateCsvFile, getSecurePapaParseConfig, sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

function ContactImport() {
  const handleFileUpload = async (file: File) => {
    // 1. Validate file before processing
    const validation = await validateCsvFile(file);
    if (!validation.valid && validation.errors) {
      setValidationErrors(validation.errors);
      return;
    }

    // 2. Use secure Papa Parse config
    Papa.parse(file, {
      ...getSecurePapaParseConfig(),  // Disables dynamic typing, limits preview
      complete: async (results) => {
        // 3. Sanitize ALL cell values
        const sanitized = results.data.map(row => ({
          name: sanitizeCsvValue(row.name),
          email: sanitizeCsvValue(row.email),
          phone: sanitizeCsvValue(row.phone),
        }));

        // 4. Validate with Zod schema (API boundary)
        await importContacts(sanitized);
      }
    });
  };

  return (
    <input
      type="file"
      accept=".csv"
      onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
    />
  );
}
```

### Formula Injection Prevention

**From `src/atomic-crm/utils/csvUploadValidator.ts`:**

```typescript
/**
 * Sanitize CSV cell values to prevent formula injection
 *
 * Excel/LibreOffice execute formulas starting with: = + - @ | %
 * Example attack: =cmd|'/c calc'!A0 (opens calculator)
 *
 * @param value - Raw cell value from CSV
 * @returns Sanitized value safe for Excel/LibreOffice
 */
export function sanitizeCsvValue(value: string | null | undefined): string {
  if (!value) return "";

  const trimmed = String(value).trim();

  // Check if cell starts with formula character
  const FORMULA_CHARS = ["=", "+", "-", "@", "|", "%"];
  if (FORMULA_CHARS.some(char => trimmed.startsWith(char))) {
    // Prefix with single quote to force Excel to treat as text
    return `'${trimmed}`;
  }

  // Remove control characters (NUL, SOH, etc.)
  return trimmed.replace(/[\x00-\x1F\x7F]/g, "");
}

// Example sanitization
sanitizeCsvValue("=cmd|'/c calc'!A0") // Returns: "'=cmd|'/c calc'!A0"
sanitizeCsvValue("normal text")       // Returns: "normal text"
sanitizeCsvValue("+SUM(A1:A10)")      // Returns: "'+SUM(A1:A10)"
```

**Why This Matters:**

```
Attack Vector:
1. Attacker uploads CSV with formula: =cmd|'/c calc'!A0
2. Admin opens CSV in Excel
3. Excel executes formula → Opens calculator
4. Real attack: =cmd|'/c powershell -c "malicious code"'

Defense:
1. Client validates file (size, MIME, binary detection)
2. Papa Parse disables dynamic typing (no auto-execute)
3. Sanitize ALL cells (prefix formulas with ')
4. Zod validates data structure
```

### Binary File Detection

**From `src/atomic-crm/utils/csvUploadValidator.ts:137`:**

```typescript
/**
 * Detect binary files by checking for common magic bytes
 *
 * @param chunk - First 1024 bytes of file as string
 * @returns true if file appears to be binary
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

## Pattern 2: SQL Injection Prevention

### Parameterized Queries (Supabase)

```typescript
// ✅ CORRECT - Supabase client uses parameterized queries
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .eq('email', userInput); // Safe - parameterized

// ✅ CORRECT - Multiple conditions
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', orgId)
  .ilike('name', `%${searchTerm}%`); // Safe - parameterized

// ❌ WRONG - Raw SQL with string interpolation
const query = `SELECT * FROM contacts WHERE email = '${userInput}'`; // SQL injection!
await supabase.rpc('unsafe_query', { query });
```

### Zod Validation (API Boundary)

```typescript
// Zod schema validates input BEFORE database query
const contactSchema = z.object({
  email: z.string().email(), // Validates email format
  phone: z.string().regex(/^\d{3}-\d{4}$/), // Validates phone format
  organization_id: z.number().int().positive(), // Validates ID is positive integer
});

// Validate before query
try {
  const validated = contactSchema.parse(userInput);
  // Safe to use validated.email, validated.phone, validated.organization_id
  await supabase.from('contacts').insert(validated);
} catch (error) {
  // Invalid input rejected before reaching database
}
```

### RPC Function Validation

```typescript
// Define RPC schema
const createContactRpcSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
});

// Validate RPC input
export async function createContactRpc(params: unknown) {
  // Validate input
  const validated = createContactRpcSchema.parse(params);

  // Call database function with validated params
  const { data, error } = await supabase.rpc('create_contact', validated);

  if (error) throw error;
  return data;
}
```

## Pattern 3: RLS Policy Security

### User Authentication Check

```sql
-- Get current authenticated user's ID
auth.uid()

-- Example: Only allow users to update their own profile
CREATE POLICY update_own_profile ON sales
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Role-Based Access Control

```sql
-- Helper function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Policy: Only admins can delete contacts
CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Policy: Reps can only edit their own tasks
CREATE POLICY update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );
```

### Prevent Data Leakage

```sql
-- ❌ WRONG - Leaks all rows
CREATE POLICY select_all ON contacts
  FOR SELECT TO authenticated
  USING (true);

-- ✅ CORRECT - Filters by company/team
CREATE POLICY select_team_contacts ON contacts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM sales
      WHERE user_id = auth.uid()
    )
  );
```

## Pattern 4: Authentication & Authorization

### JWT Token Validation (Supabase)

```typescript
// Supabase client automatically validates JWT tokens
const { data: { session }, error } = await supabase.auth.getSession();

if (!session) {
  // Redirect to login
  navigate('/login');
  return;
}

// Session contains:
// - session.user.id (UUID)
// - session.user.email
// - session.access_token (JWT)
// - session.expires_at

// Access token sent with every request
// Supabase validates token server-side
```

### Protected Routes

```typescript
// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: { session }, isPending } = useGetIdentity();

  if (isPending) return <Loading />;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usage
<Route path="/contacts" element={
  <ProtectedRoute>
    <ContactList />
  </ProtectedRoute>
} />
```

### Admin-Only Actions

```typescript
// Check user role before allowing action
const { identity } = useGetIdentity();

const canDelete = identity?.role === 'admin';

return (
  <DeleteButton
    disabled={!canDelete}
    confirmTitle="Delete Contact"
    confirmContent="This action cannot be undone"
  />
);
```

## Pattern 5: XSS Prevention

### React Auto-Escaping

```typescript
// ✅ CORRECT - React auto-escapes user input
function ContactName({ name }: { name: string }) {
  return <h1>{name}</h1>; // Safe - React escapes HTML
}

// User input: <script>alert('XSS')</script>
// Rendered as: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

### DangerouslySetInnerHTML (Avoid)

```typescript
// ❌ WRONG - Allows XSS
function ContactNotes({ notes }: { notes: string }) {
  return <div dangerouslySetInnerHTML={{ __html: notes }} />;
  // If notes contains <script>, it WILL execute!
}

// ✅ CORRECT - Use markdown library with sanitization
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function ContactNotes({ notes }: { notes: string }) {
  const sanitized = DOMPurify.sanitize(marked.parse(notes));
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### URL Validation

```typescript
// Validate URLs before rendering links
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const linkedinUrlSchema = z
  .string()
  .refine(
    (url) => {
      if (!url) return true;
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
      } catch {
        return false;
      }
    },
    { message: "URL must be from linkedin.com" }
  );

// Only render validated URLs
function ContactLinkedIn({ url }: { url: string }) {
  const validated = linkedinUrlSchema.safeParse(url);

  if (!validated.success) return null;

  return <a href={validated.data} target="_blank" rel="noopener noreferrer">LinkedIn</a>;
}
```

## Security Decision Tree

```
User input received
│
├─ File upload?
│  ├─ Validate file size (< 10MB)
│  ├─ Check extension (.csv only)
│  ├─ Detect binary files (magic bytes)
│  └─ Sanitize cell values (formula injection)
│
├─ Database query?
│  ├─ Use Supabase client (parameterized)
│  ├─ Validate with Zod schema (API boundary)
│  └─ RLS policies filter rows (database)
│
├─ Rendering HTML?
│  ├─ Use React (auto-escapes)
│  ├─ Avoid dangerouslySetInnerHTML
│  └─ Sanitize if rendering user HTML (DOMPurify)
│
└─ Admin action?
   ├─ Check user role (identity.role === 'admin')
   ├─ Verify with RLS policy (is_admin())
   └─ Show confirmation dialog
```

## Best Practices

### DO

✅ Validate CSV files before processing (size, MIME, binary)
✅ Sanitize ALL CSV cell values (formula injection)
✅ Use Zod schemas at API boundary (SQL injection prevention)
✅ Use Supabase client (parameterized queries)
✅ Enable RLS on ALL tables
✅ Check user role before admin actions
✅ Use React's auto-escaping (XSS prevention)
✅ Validate URLs before rendering links
✅ Show confirmation dialogs for destructive actions
✅ Log security-related errors

### DON'T

❌ Skip CSV file validation (DoS, malware, injection)
❌ Trust user input without sanitization
❌ Build SQL queries with string interpolation
❌ Disable RLS on any table
❌ Allow admin actions without role check
❌ Use dangerouslySetInnerHTML without sanitization
❌ Render user URLs without validation
❌ Skip confirmation on delete actions
❌ Ignore security warnings in console

## Testing Security

### CSV Validation Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateCsvFile, sanitizeCsvValue } from './csvUploadValidator';

describe('CSV Security', () => {
  it('rejects oversized files', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.csv');
    const result = await validateCsvFile(largeFile);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'SIZE' })
    );
  });

  it('detects binary files', async () => {
    const binaryFile = new File(['\xFF\xD8\xFF'], 'image.csv'); // JPEG magic bytes
    const result = await validateCsvFile(binaryFile);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'BINARY' })
    );
  });

  it('sanitizes formula injection', () => {
    expect(sanitizeCsvValue("=cmd|'/c calc'!A0")).toBe("'=cmd|'/c calc'!A0");
    expect(sanitizeCsvValue("+SUM(A1:A10)")).toBe("'+SUM(A1:A10)");
    expect(sanitizeCsvValue("normal text")).toBe("normal text");
  });
});
```

### RLS Policy Tests

```sql
-- Test RLS policies in migration
DO $$
DECLARE
  test_user_id UUID;
  test_sales_id BIGINT;
  test_contact_id BIGINT;
BEGIN
  -- Create test user
  INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com')
  RETURNING id INTO test_user_id;

  -- Create test sales record
  INSERT INTO sales (user_id, email, role) VALUES (test_user_id, 'test@example.com', 'rep')
  RETURNING id INTO test_sales_id;

  -- Set session to test user
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);

  -- Test: Rep can insert contact
  INSERT INTO contacts (first_name, last_name, sales_id)
  VALUES ('Test', 'User', test_sales_id)
  RETURNING id INTO test_contact_id;

  -- Test: Rep can update own contact
  UPDATE contacts SET first_name = 'Updated' WHERE id = test_contact_id;

  -- Test: Rep cannot delete (should fail)
  BEGIN
    DELETE FROM contacts WHERE id = test_contact_id;
    RAISE EXCEPTION 'Rep should not be able to delete contacts';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Correctly blocked rep from deleting';
  END;

  RAISE NOTICE 'RLS policy tests passed';
END $$;
```

## Related Resources

- [database-patterns.md](database-patterns.md) - RLS policy patterns
- [validation-patterns.md](validation-patterns.md) - Zod validation patterns
- [error-handling.md](error-handling.md) - Security error handling
- [anti-patterns.md](anti-patterns.md) - Security mistakes to avoid

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
