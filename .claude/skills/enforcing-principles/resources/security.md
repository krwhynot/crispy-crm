# Security

## CSV Upload Validation

Defense in depth: validate at client, API boundary (Zod), and database (RLS).

### File Validation

```typescript
export const CSV_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 10000,
  MAX_CELL_LENGTH: 1000,
  ALLOWED_MIME_TYPES: ["text/csv", "text/plain", "application/vnd.ms-excel"],
  ALLOWED_EXTENSIONS: [".csv"],
} as const;
```

Check: file size (DoS), extension, binary detection (magic bytes for JPEG/PNG/EXE/PDF), CSV structure (delimiter presence).

### Formula Injection Prevention

```typescript
export function sanitizeCsvValue(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  const FORMULA_CHARS = ["=", "+", "-", "@", "|", "%"];
  if (FORMULA_CHARS.some(char => trimmed.startsWith(char))) {
    return `'${trimmed}`; // Prefix with single quote
  }
  return trimmed.replace(/[\x00-\x1F\x7F]/g, "");
}
```

Attack vector: `=cmd|'/c calc'!A0` in CSV, admin opens in Excel, formula executes.

### Binary File Detection

Check for magic bytes: JPEG (`\xFF\xD8\xFF`), PNG (`\x89PNG`), ZIP (`PK\x03\x04`), EXE (`MZ`), PDF (`%PDF`), etc.

### CSV Upload Flow

1. Validate file (size, extension, binary detection)
2. Parse with secure PapaParse config
3. Sanitize ALL cell values
4. Validate with Zod schema at API boundary

## SQL Injection Prevention

```typescript
// CORRECT - Supabase client uses parameterized queries
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('email', userInput);

// WRONG - String interpolation
const query = `SELECT * FROM contacts WHERE email = '${userInput}'`;
```

Zod validates input format BEFORE database query. RPC inputs get their own Zod schema.

## XSS Prevention

```typescript
// React auto-escapes - safe by default
function ContactName({ name }: { name: string }) {
  return <h1>{name}</h1>;
}

// WRONG - allows XSS
<div dangerouslySetInnerHTML={{ __html: notes }} />

// CORRECT - sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(notes)) }} />
```

### URL Validation

```typescript
const linkedinUrlSchema = z.string()
  .refine((url) => {
    if (!url) return true;
    try {
      return new URL(url).href.match(/^https?:\/\/(www\.)?linkedin\.com\//) !== null;
    } catch { return false; }
  }, { message: "URL must be from linkedin.com" });
```

Validate URLs before rendering links. Add `rel="noopener noreferrer"` to external links.

## RLS & Authentication

```sql
-- User's own data
USING (user_id = auth.uid())

-- Admin only
USING (public.is_admin())

-- Manager+
USING (public.is_manager_or_admin())

-- Owner or manager
USING (is_manager_or_admin() OR sales_id = current_sales_id())
```

### Protected Routes (Frontend)

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: { session }, isPending } = useGetIdentity();
  if (isPending) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

### Admin-Only Actions

```typescript
const { identity } = useGetIdentity();
const canDelete = identity?.role === 'admin';

<DeleteButton disabled={!canDelete} confirmTitle="Delete Contact" />
```

## Security Decision Tree

```
User input received
|
+- Rendering HTML? --> React auto-escapes. Avoid dangerouslySetInnerHTML. Sanitize with DOMPurify if needed.
+- Rendering URL? --> Validate format, check domain allowlist, add rel="noopener noreferrer"
+- CSV upload? --> Validate file, sanitize cells, validate with Zod
+- Database query? --> Supabase parameterized queries + Zod validation
+- Admin action? --> Check role, show confirmation dialog
```
