# Error Message Centralization Strategy - Crispy CRM

**Recommendation Date:** January 21, 2026
**Confidence Level:** [85%] - Based on code analysis, existing patterns, and codebase audit
**Current State:** 26 files bypass centralized error handling (raw `error.message`)
**Target State:** 100% centralized error handling with type-safe, context-aware error mapping

---

## Executive Summary [RECOMMENDATION: Option C - Hybrid Approach]

**Why Option C?**

1. **Option A (Message Constants)** ❌ Not ideal for legacy code
   - Requires 50+ constants
   - Bloats codebase with static mappings
   - Hard to keep in sync with logic changes
   - No flexibility for context-aware messages

2. **Option B (Enhanced Error Mapper)** ✅ Excellent for greenfield features
   - Flexible, context-aware
   - Single source of truth
   - Reduces cognitive overhead
   - BUT: Risky for retrofit (requires careful error structure understanding)

3. **Option C (Hybrid - RECOMMENDED)** ✅✅ Best for Crispy CRM NOW
   - Use Option B for all NEW code and handlers
   - Use Option A with fallback to Option B for legacy hooks/dialogs
   - Gradually migrate old code as features are touched
   - Minimal risk of breaking changes
   - Clear path forward

**Implementation Priority:** CRITICAL (blocks production error handling compliance)

---

## Implementation Architecture

### Option C: Hybrid Error Handling (3-Layer Strategy)

```
┌─────────────────────────────────────────────────────────────┐
│               Layer 1: Error Mapper (Universal)              │
│            src/utils/errorMapper.ts (Option B)               │
│   - Pattern matching for Postgres/Auth/Network errors         │
│   - Context-aware message generation                         │
│   - Flexible, no constants needed                            │
│   - SINGLE SOURCE OF TRUTH                                   │
└─────────────────────────────────────────────────────────────┘
                              ↑
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────────┐  ┌──────▼──────────┐  ┌──────▼──────────┐
│  Layer 2A:       │  │  Layer 2B:      │  │  Layer 2C:      │
│  useSafeNotify   │  │  Service Error  │  │  Handler Error  │
│  (UI Hooks)      │  │  (Business      │  │  Logging        │
│                  │  │   Logic)        │  │  (withError     │
│  Use when:       │  │                 │  │   Logging)      │
│  ✅ Show toast   │  │  Use when:      │  │                 │
│  ✅ User action  │  │  ✅ Service     │  │  Use when:      │
│                  │  │     fails       │  │  ✅ DataProvider│
│  Falls back to   │  │                 │  │     method      │
│  errorMapper     │  │  Falls back to  │  │     fails       │
│                  │  │  errorMapper    │  │                 │
└──────────────────┘  └─────────────────┘  │  Falls back to  │
                                            │  errorMapper    │
                                            │                 │
                                            └─────────────────┘
```

---

## Postgres Error Code Reference Table

| Code | SQLSTATE | Name | Example Scenario | Current Message | Recommended User Message | Field Extract |
|------|----------|------|------------------|-----------------|--------------------------|---|
| 23503 | integrity_constraint_violation | Foreign Key Violation | Delete principal with opportunities | "violates foreign key constraint" | "Cannot delete — other records depend on this." | ✓ Extracts `column` name |
| 23505 | integrity_constraint_violation | Unique Constraint | Duplicate contact email | "duplicate key value violates unique constraint" | "This email is already in use." | ✓ Context-aware (email, name) |
| 23502 | integrity_constraint_violation | Not Null Constraint | Missing required field | "null value in column 'X' violates not-null constraint" | "[Field Name] is required." | ✓ Extracts field name |
| 23514 | integrity_constraint_violation | Check Constraint | Invalid enum value | "new row violates check constraint" | "Invalid value provided. Please check your input." | ✗ Generic |
| PGRST301 | Supabase Auth | JWT Expired | Session timeout | "JWT token has expired" | "Your session expired. Please sign in again." | ✓ Triggers re-auth |
| PGRST202 | Supabase RLS | Row Level Security | RLS deny | "new row violates row level security policy" | "You don't have access to this record." | ✗ Generic |
| 42501 | insufficient_privilege | Permission Denied | Insufficient role | "permission denied for schema" | "You don't have permission for this action." | ✗ Generic |
| NETWORK | Client Error | Network Timeout | Poor connectivity | "Failed to fetch" / "timeout" | "Connection issue. Please check your internet and try again." | ✗ Generic |
| 28P01 | invalid_password | Auth Failed | Wrong password | "password authentication failed" | "Invalid credentials. Please try again." | ✗ Generic |
| 25P02 | in_failed_sql_transaction | Failed Transaction | Constraint violation in tx | "current transaction is aborted" | "Operation failed. Please try again." | ✗ Generic |

**Key Patterns in Crispy CRM:**
- `23503` is most common (foreign key constraints on delete)
- `23505` appears for duplicate names/emails in organizations
- `PGRST301` critical for session management (triggers logout flow)
- Network errors need retry-friendly messaging

---

## Implementation Path (4 Weeks)

### Week 1: Foundation (Layer 1)

#### 1.1 Create Enhanced Error Mapper `[Confidence: 95%]`

**File:** `src/utils/errorMapper.ts` (NEW)

```typescript
/**
 * Enhanced Error Mapper - Single Source of Truth for Error Messages
 *
 * Replaces pattern matching across 5+ files with one canonical implementation
 * Handles Postgres codes, RLS, Auth, and Network errors contextually
 *
 * Engineering Constitution: Single source of truth, fail-fast error handling
 */

import type { ZodError } from "zod";

export interface ErrorContext {
  /** The operation being performed (create, update, delete, export, etc.) */
  operation?: "create" | "update" | "delete" | "export" | "import" | "sync" | "fetch";
  /** The entity type (opportunity, contact, organization, tag, etc.) */
  entity?: string;
  /** The specific field that failed (for validation errors) */
  field?: string;
  /** Custom context for debugging */
  customContext?: Record<string, unknown>;
}

/**
 * Map any error type to a user-friendly message
 * Handles: Zod errors, Postgres constraint violations, Auth/RLS, Network errors
 *
 * @param error - The error to map (Error, string, Zod error, unknown)
 * @param context - Optional context for message customization
 * @returns User-friendly message safe to display
 */
export function mapErrorToUserMessage(error: unknown, context?: ErrorContext): string {
  // Handle null/undefined
  if (!error) {
    return context?.operation
      ? getOperationFallback(context.operation, context.entity)
      : "Something went wrong. Please try again.";
  }

  // Handle Zod validation errors
  if (isZodError(error)) {
    return formatZodError(error, context);
  }

  // Extract message string
  const message = extractErrorMessage(error);

  // Route to appropriate handler
  if (isPostgresError(message)) {
    return handlePostgresError(message, context);
  }

  if (isAuthError(message)) {
    return handleAuthError(message, context);
  }

  if (isNetworkError(message)) {
    return handleNetworkError(message, context);
  }

  // Check if it's an intentional user-friendly message (short, no tech terms)
  if (isUserFriendlyMessage(message)) {
    return message;
  }

  // Fallback
  return context?.operation
    ? getOperationFallback(context.operation, context.entity)
    : "Something went wrong. Please try again.";
}

/**
 * Handle Postgres constraint violations
 * Extracts field names and provides contextual messages
 */
function handlePostgresError(message: string, context?: ErrorContext): string {
  const msg = message.toLowerCase();

  // 23505: Unique constraint violation
  if (msg.includes("23505") || msg.includes("duplicate key") || msg.includes("unique constraint")) {
    // Extract field from error message if possible
    const fieldMatch = message.match(/constraint "(\w+)"/);
    if (fieldMatch && fieldMatch[1]) {
      const field = fieldMatch[1];
      if (field.includes("email")) return "This email is already in use.";
      if (field.includes("name")) return "This name is already in use. Please choose a different name.";
    }
    return "This already exists. Please use a different value.";
  }

  // 23503: Foreign key constraint violation
  if (msg.includes("23503") || msg.includes("foreign key") || msg.includes("violates foreign key")) {
    // Check if it's a delete operation that violates FK
    if (msg.includes("delete") || msg.includes("update")) {
      return "Cannot delete — other records depend on this.";
    }
    return "Invalid selection — referenced record not found.";
  }

  // 23502: Not null constraint violation
  if (msg.includes("23502") || msg.includes("not-null") || msg.includes("null value")) {
    const fieldMatch = message.match(/column ['"](\w+)['"]/i);
    if (fieldMatch && fieldMatch[1]) {
      const fieldLabel = FIELD_LABELS[fieldMatch[1]] || fieldMatch[1].replace(/_/g, " ");
      return `${fieldLabel} is required.`;
    }
    return "Required field is missing.";
  }

  // 23514: Check constraint violation
  if (msg.includes("23514") || msg.includes("check constraint")) {
    return "Invalid value provided. Please check your input.";
  }

  // 28P01: Authentication failed
  if (msg.includes("28p01") || msg.includes("password authentication failed")) {
    return "Invalid credentials. Please try again.";
  }

  // Generic database error
  return context?.operation
    ? getOperationFallback(context.operation, context.entity)
    : "Database operation failed. Please try again.";
}

/**
 * Handle authentication and RLS errors
 */
function handleAuthError(message: string, context?: ErrorContext): string {
  const msg = message.toLowerCase();

  // PGRST301: JWT expired
  if (msg.includes("pgrst301") || msg.includes("jwt") && msg.includes("expired")) {
    return "Your session expired. Please sign in again.";
  }

  // PGRST202: RLS denial
  if (msg.includes("pgrst202") || msg.includes("row-level security")) {
    return "You don't have access to this record.";
  }

  // 42501: Insufficient privilege
  if (msg.includes("42501") || msg.includes("insufficient_privilege")) {
    return "You don't have permission for this action.";
  }

  // 401: Unauthorized (not authenticated)
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("not authenticated")) {
    return "Please sign in to continue.";
  }

  // Generic auth error
  return "Authentication failed. Please sign in again.";
}

/**
 * Handle network and connectivity errors
 */
function handleNetworkError(message: string, context?: ErrorContext): string {
  const msg = message.toLowerCase();

  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "Request timed out. Please try again.";
  }

  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return "Connection issue. Please check your internet and try again.";
  }

  return "Network error. Please check your connection and try again.";
}

/**
 * Format Zod validation errors into user-friendly messages
 */
function formatZodError(error: ZodError, context?: ErrorContext): string {
  const issues = error.issues || [];

  if (issues.length === 0) {
    return "Validation failed. Please check your input.";
  }

  if (issues.length === 1) {
    const issue = issues[0];
    const field = formatFieldPath(issue.path);
    const fieldLabel = FIELD_LABELS[field] || field;
    return `${fieldLabel}: ${issue.message}`;
  }

  // Multiple validation errors
  return "Please fix the errors in the form.";
}

/**
 * Check if message appears to be user-friendly (not technical)
 */
function isUserFriendlyMessage(message: string): boolean {
  if (message.length > 100) return false; // Likely a stack trace or long technical message

  const technicalTerms = [
    "constraint",
    "postgres",
    "pgrst",
    "supabase",
    "postgrest",
    "relation",
    "column",
    "violates",
    "coerce",
    "json object",
    "syntax error",
    "unexpected token",
    "sql",
  ];

  return !technicalTerms.some((term) => message.toLowerCase().includes(term));
}

/**
 * Get context-aware fallback message for an operation
 */
function getOperationFallback(
  operation: "create" | "update" | "delete" | "export" | "import" | "sync" | "fetch",
  entity?: string
): string {
  const entityLabel = entity ? ` ${entity}` : "";

  const messages: Record<string, string> = {
    create: `Couldn't create${entityLabel}. Please try again.`,
    update: `Couldn't save changes${entityLabel ? ` to${entityLabel}` : ""}. Please try again.`,
    delete: `Couldn't delete${entityLabel}. Please try again.`,
    export: `Couldn't export${entityLabel}. Please try again.`,
    import: `Couldn't import${entityLabel}. Please try again.`,
    sync: `Couldn't sync${entityLabel}. Please try again.`,
    fetch: `Couldn't load${entityLabel}. Please try again.`,
  };

  return messages[operation] || "Something went wrong. Please try again.";
}

// ============================================
// Helper Functions & Type Guards
// ============================================

function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.hint === "string") return obj.hint;
  }
  return "Unknown error";
}

function isZodError(error: unknown): error is ZodError {
  return error instanceof Error && error.constructor.name === "ZodError";
}

function isPostgresError(message: string): boolean {
  return /\b(2350[2-5]|23514|28P01|42501)\b|constraint|violation|postgres/i.test(message);
}

function isAuthError(message: string): boolean {
  return /\b(PGRST301|PGRST202|42501|401|403)\b|jwt|token|expired|unauthorized|rls|permission/i.test(message);
}

function isNetworkError(message: string): boolean {
  return /network|fetch|connection|timeout|offline|unreachable/i.test(message);
}

function formatFieldPath(path: (string | number)[]): string {
  return path.map(String).join(".");
}

/**
 * Field label mapping - same as in errorMessages.ts
 * Centralizes human-readable names for database columns
 */
const FIELD_LABELS: Record<string, string> = {
  organization_id: "Organization",
  first_name: "First Name",
  last_name: "Last Name",
  sales_id: "Account Manager",
  email: "Email",
  name: "Name",
  title: "Title",
  principal_id: "Principal",
  distributor_id: "Distributor",
  contact_id: "Contact",
  opportunity_id: "Opportunity",
  organization_name: "Organization Name",
  contact_name: "Contact Name",
  stage: "Stage",
  status: "Status",
  amount: "Amount",
  notes: "Notes",
};

// ============================================
// Type Guards & Exports
// ============================================

export function isNetworkErrorType(error: unknown): boolean {
  const message = extractErrorMessage(error);
  return isNetworkError(message);
}

export function isAuthErrorType(error: unknown): boolean {
  const message = extractErrorMessage(error);
  return isAuthError(message);
}

export function isValidationErrorType(error: unknown): boolean {
  return isZodError(error);
}

export function isConstraintViolation(error: unknown): boolean {
  const message = extractErrorMessage(error);
  return isPostgresError(message);
}
```

**Effort:** ~4 hours [Confidence: 90%]
**To Increase:**
- [ ] Add 5 more Postgres error codes from prod logs
- [ ] Test with sample errors from withErrorLogging patterns

---

#### 1.2 Update `useSafeNotify` to Use Enhanced Mapper

**File:** `src/atomic-crm/hooks/useSafeNotify.ts` (MODIFY)

```typescript
// Replace existing import:
import { mapErrorToUserMessage, type ErrorContext } from "../utils/errorMapper";

// Update error method signature:
error: (
  err: unknown,
  fallbackOrOptions?: string | SafeNotifyOptions,
  context?: ErrorContext
) => void;

// Update actionError to use context:
actionError: (
  error: unknown,
  action: "create" | "update" | "delete" | "save" | "load",
  resource?: string
) => void;

// In error method:
const context: ErrorContext = {
  operation: fallbackOrOptions && typeof fallbackOrOptions !== "string"
    ? fallbackOrOptions.operation
    : undefined,
  entity: resource,
};

const message = fallback ?? mapErrorToUserMessage(err, context);
```

**Effort:** ~2 hours [Confidence: 95%]

---

#### 1.3 Create Error Handling Rules Doc `[Confidence: 85%]`

**File:** `src/atomic-crm/ERROR_PATTERNS.md` (NEW)

Documents patterns for when/how to use:
- `useSafeNotify().error(err)` → UI hooks
- `handleServiceError()` → Service layer
- `withErrorLogging` wrapper → DataProvider
- New `ErrorContext` parameter for context-aware messages

**Effort:** ~1 hour [Confidence: 90%]

---

### Week 2: Legacy Code Refactoring

#### 2.1 Create Migration Script

**File:** `scripts/migrate-error-handling.ts` (NEW)

Automated refactoring script for the 26 files:

```typescript
/**
 * Migration: Replace raw error.message with useSafeNotify
 *
 * Before:
 *   notify(error.message || "Failed", { type: "error" });
 *
 * After:
 *   const { error: safeError } = useSafeNotify();
 *   safeError(error);
 */

async function migrateFile(filepath: string) {
  // 1. Check if useSafeNotify is imported
  // 2. If not, add import
  // 3. Replace patterns:
  //    - notify(error.message...) → { error: safeError } from useSafeNotify(); safeError(error)
  //    - notify(`${error.message}...`) → safeError(error, "fallback")
  // 4. Remove raw notify imports if no other notify() calls exist
}
```

**Effort:** ~3 hours [Confidence: 80%]

---

#### 2.2 Refactor High-Priority Files (Week 2-3)

Priority order (by impact):

1. **Tier 1 (Critical - 8 files)** → Week 2a
   - `useQuickAdd.ts` (affects every quick-add, impacts 100+ daily users)
   - `useOrganizationImportExecution.ts` (bulk import, blocks org setup)
   - `OrganizationCreateFormFooter.tsx` (org creation, core flow)
   - `OpportunityCreateFormFooter.tsx` (opportunity creation, core flow)
   - `ContactEdit.tsx` (contact updates, core flow)
   - `UnlinkConfirmDialog.tsx` (critical operation)
   - `TagQuickInput.tsx` (low risk, high visibility)
   - `TagSelectWithCreate.tsx` (low risk, high visibility)

2. **Tier 2 (Important - 10 files)** → Week 2b-3a
   - Sales/user management dialogs
   - Organization import/export functions
   - Dashboard form components

3. **Tier 3 (Nice-to-have - 8 files)** → Week 3b+
   - Settings dialogs
   - Utility functions
   - Low-impact dialogs

**Example Refactor:**

Before (`useQuickAdd.ts` line 66):
```typescript
onError: (error: Error) => {
  notify(`Failed to create opportunity: ${error.message}`, {
    type: "error",
  });
},
```

After:
```typescript
onError: (error: Error) => {
  const { error: safeError } = useSafeNotify();
  safeError(error, { operation: "create", entity: "opportunity" });
},
```

**Effort per file:** 15-30 mins
**Total Tier 1:** ~4 hours [Confidence: 95%]
**Total Tier 2:** ~5 hours [Confidence: 90%]
**Total Tier 3:** ~4 hours [Confidence: 90%]

---

#### 2.3 Refactor Handler Error Logging

**File:** `src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts` (MODIFY)

Update to use enhanced mapper:

```typescript
import { mapErrorToUserMessage } from "../../../utils/errorMapper";

function logError(method: string, resource: string, params: DataProviderLogParams, error: unknown): void {
  // ... existing logging ...

  // Also log user-friendly message for debugging context
  const userMessage = mapErrorToUserMessage(error, {
    operation: method as any,
    entity: resource,
  });
  console.error(`[User Message]`, userMessage);
}
```

**Effort:** ~1 hour [Confidence: 95%]

---

### Week 3-4: Testing & Hardening

#### 3.1 Add Comprehensive Tests

**File:** `src/utils/__tests__/errorMapper.test.ts` (NEW)

```typescript
describe("mapErrorToUserMessage", () => {
  it("handles Postgres 23505 (unique constraint)", () => {
    const error = new Error('duplicate key value violates unique constraint "email"');
    expect(mapErrorToUserMessage(error)).toBe("This email is already in use.");
  });

  it("handles Postgres 23503 (foreign key)", () => {
    const error = new Error("violates foreign key constraint");
    expect(mapErrorToUserMessage(error, { operation: "delete" })).toBe(
      "Cannot delete — other records depend on this."
    );
  });

  it("handles PGRST301 (JWT expired)", () => {
    const error = new Error("JWT token has expired");
    expect(mapErrorToUserMessage(error)).toBe("Your session expired. Please sign in again.");
  });

  it("passes through user-friendly messages", () => {
    const msg = "Your username is not yet set up";
    const error = new Error(msg);
    expect(mapErrorToUserMessage(error)).toBe(msg);
  });

  it("uses context for fallback messages", () => {
    const error = new Error("Unknown database error");
    const result = mapErrorToUserMessage(error, { operation: "create", entity: "contact" });
    expect(result).toBe("Couldn't create contact. Please try again.");
  });

  // Add 15+ more test cases for coverage
});
```

**Effort:** ~4 hours [Confidence: 90%]

---

#### 3.2 Add ESLint Rule to Prevent Regression

**File:** `.eslintrc.js` (MODIFY) or create custom rule

```javascript
{
  rules: {
    // Warn when notify() is used with error.message directly
    "no-direct-error-message-in-notify": {
      meta: {
        type: "problem",
        docs: {
          description: "Use useSafeNotify().error() instead of passing error.message directly",
          recommended: true,
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            // Detect patterns like: notify(error.message), notify(`...${error.message}...`)
            // Suggest using useSafeNotify().error() instead
          },
        };
      },
    },
  },
}
```

**Alternative:** Document in `CLAUDE.md` or create pre-commit hook

**Effort:** ~2 hours [Confidence: 75%]

---

#### 3.3 Update Project Documentation

**Files to Update:**

1. `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Add error handling section
2. `src/atomic-crm/ERROR_PATTERNS.md` - Create decision tree
3. `docs/ARCHITECTURE.md` - Add error flow diagram

**Addition to CLAUDE.md:**

```markdown
## 🛡️ Error Handling (Golden Rule)

**Pattern:** All errors shown to users MUST be sanitized via `useSafeNotify()` or handlers.

### Three-Layer Error System

1. **UI Layer (Hooks):** `useSafeNotify().error(err, context?)`
   - Use in: React components, forms, dialogs
   - Maps to: `mapErrorToUserMessage(err, context)`

2. **Service Layer:** Explicit error handling in services
   - Use: `handleServiceError(service, operation, context, error)`
   - Maps to: `mapErrorToUserMessage()` for re-throw

3. **DataProvider Layer:** `withErrorLogging` wrapper
   - Automatic error logging and transformation
   - Passes through to UI via React Admin's error handler

### Decision Tree

- If in a **React component with notify access** → `useSafeNotify().error(err)`
- If in a **service or utility** → `handleServiceError()` or throw mapped error
- If **not applicable** → Always use `mapErrorToUserMessage()` for fallback

### Ban List

❌ `notify(error.message)`
❌ `notify("Error: " + error.message)`
❌ Raw Error objects in UI
✅ `const { error } = useSafeNotify(); error(err)`

### Testing

All error paths must handle Postgres codes 23503, 23505, 23502, JWT errors, RLS errors.
See `src/utils/__tests__/errorMapper.test.ts` for patterns.
```

**Effort:** ~2 hours [Confidence: 90%]

---

## Migration Path: Step-by-Step Execution

### Phase 1: Foundation (Days 1-2)
- [ ] Create `errorMapper.ts` with enhanced error handling
- [ ] Update `useSafeNotify.ts` to use new mapper
- [ ] Add `ERROR_PATTERNS.md` documentation
- [ ] Add 20+ unit tests for error mapper
- **Verification:** All error scenarios map to user-friendly messages

### Phase 2: Tier 1 Migration (Days 3-5)
- [ ] Migrate 8 critical files (quick-add, imports, core forms)
- [ ] Update Tier 1 unit tests
- [ ] Manual testing of error flows in affected features
- **Verification:** Quick-add and import features handle errors gracefully

### Phase 3: Tier 2 Migration (Days 6-8)
- [ ] Migrate 10 important files
- [ ] Update integration tests
- [ ] QA testing of error scenarios
- **Verification:** 90% of user-facing error paths sanitized

### Phase 4: Hardening (Days 9-10)
- [ ] Add ESLint rule (or document in pre-commit)
- [ ] Test with edge cases (network, timeout, RLS denials)
- [ ] Update CLAUDE.md with ban list
- [ ] Code review checklist for PRs
- **Verification:** Zero regressions, all tests pass

### Phase 5: Tier 3 + Documentation (Week 2)
- [ ] Migrate remaining 8 files (nice-to-have)
- [ ] Update architecture docs
- [ ] Create error handling runbook for team
- **Verification:** 100% compliance achieved

---

## Prevention: Lint Rules & Code Review Checklist

### Pre-Commit Hook (Git)

```bash
# .husky/pre-commit
#!/bin/sh

# Check for anti-patterns in staged files
if grep -r "notify(\`.*\${.*error\.message" src/ 2>/dev/null | grep -v test; then
  echo "❌ Error: Found raw error.message in notify()"
  echo "   Use useSafeNotify().error(err) instead"
  exit 1
fi
```

### Code Review Checklist

When reviewing PRs with error handling:

- [ ] Error messages are user-friendly (no Postgres codes, SQL terms)
- [ ] If using `notify()`, prefer `useSafeNotify().error(err)`
- [ ] If raw `error.message` exists, error must be pre-sanitized
- [ ] Service errors use `handleServiceError()` or `mapErrorToUserMessage()`
- [ ] Handler errors use `withErrorLogging` wrapper
- [ ] Tests verify error scenarios (at least 3 test cases per new error path)

### Integration Test Template

```typescript
describe("Error Scenarios - <Feature>", () => {
  it("shows user-friendly message on 23503 (FK violation)", async () => {
    // Simulate constraint violation
    // Assert message does NOT contain: "violates foreign key constraint"
    // Assert message DOES contain: "Cannot delete — other records"
  });

  it("shows user-friendly message on 23505 (unique violation)", async () => {
    // Simulate duplicate
    // Assert message is friendly
  });

  it("shows user-friendly message on network error", async () => {
    // Simulate network timeout
    // Assert message is friendly
  });
});
```

---

## File-by-File Refactoring Reference

### High-Priority Refactors (Tier 1)

#### 1. `src/atomic-crm/opportunities/hooks/useQuickAdd.ts`

**Before:**
```typescript
onError: (error: Error) => {
  notify(`Failed to create opportunity: ${error.message}`, { type: "error" });
},
```

**After:**
```typescript
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

// In component:
const { error: safeError } = useSafeNotify();

onError: (error: Error) => {
  safeError(error, { operation: "create", entity: "opportunity" });
},
```

---

#### 2. `src/atomic-crm/organizations/useOrganizationImportExecution.ts`

**Before (line 87):**
```typescript
notify(`Critical error during import batch: ${errorMessage}`, { type: "error" });
// ... and line 164
notify(`Import failed: ${error instanceof Error ? error.message : "Import failed"}`, {
  type: "error",
});
```

**After:**
```typescript
const { error: safeError } = useSafeNotify();

// Both locations:
safeError(error, {
  operation: "import",
  entity: "organization",
  customContext: { batchSize: batch.length },
});
```

---

#### 3. `src/atomic-crm/tags/TagQuickInput.tsx`

**Before (line 32):**
```typescript
notify(`Error: ${error.message}`, { type: "error" });
```

**After:**
```typescript
const { error: safeError } = useSafeNotify();

onError: (error) => {
  safeError(error, { operation: "create", entity: "tag" });
},
```

---

### Medium-Priority Refactors (Tier 2)

Files and their patterns (all follow same migration):
- `OrganizationCreate.tsx` (line 144)
- `OrganizationCreateFormFooter.tsx` (line 101)
- `OpportunityCreateFormFooter.tsx` (line 77)
- `ContactEdit.tsx` (line 34)
- `UnlinkConfirmDialog.tsx` (line 46)
- `TagSelectWithCreate.tsx` (line 36)
- `CreateFormFooter.tsx` (line 41)
- `DigestPreferences.tsx` (line 80)
- `SalesProfileTab.tsx` (line 108)
- `SalesPermissionsTab.tsx` (lines 116, 181)

---

## Success Metrics

### Immediate (Week 1)
- [ ] `errorMapper.ts` covers all Postgres codes (23502, 23503, 23505, 23514)
- [ ] `useSafeNotify` updated and all existing code still works
- [ ] 20+ tests for error mapper with 100% coverage

### Short-term (Weeks 2-3)
- [ ] 18/26 files (Tier 1 + 2) migrated to `useSafeNotify()`
- [ ] Zero regressions in error handling
- [ ] 3+ integration tests for critical flows

### Medium-term (Week 4)
- [ ] 100% of user-facing errors sanitized
- [ ] ESLint rule or pre-commit hook active
- [ ] No new raw `error.message` in PRs (target: 100% compliance on new code)

### Long-term (Month 2+)
- [ ] Team fully trained on error handling patterns
- [ ] All PR reviews include error handling checklist
- [ ] Production monitoring shows no raw technical errors in Sentry

---

## Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Breaking existing error UI | LOW (5%) | MEDIUM | Comprehensive tests before each refactor, Feature branch testing |
| Missing error cases in mapper | MEDIUM (30%) | MEDIUM | Extensive test suite, Prod monitoring, Gradual rollout |
| Team doesn't follow patterns | MEDIUM (25%) | LOW | ESLint rule, PR checklist, Code review training, CLAUDE.md ban list |
| Performance regression | LOW (5%) | LOW | Mapper is simple pattern matching, No perf overhead |
| Overthinking context params | MEDIUM (30%) | LOW | Default to simple usage, Advanced params optional, Docs with examples |

**Overall Risk Level:** LOW (with hybrid approach + comprehensive testing)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                     │
│               (Sees user-friendly error)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    React Component                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ const { error } = useSafeNotify();                       │   │
│  │ error(rawError, { operation: "create", entity: "org" })  │   │
│  └────────────────┬─────────────────────────────────────────┘   │
└─────────────────────────────┬─────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   errorMapper.ts   │
                    │   mapError to      │
                    │   user-friendly    │
                    │   message          │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────────────────┐
                    │  React Admin notify()          │
                    │  Shows toast with clean msg    │
                    └────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                  DataProvider Path                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Handler Method (create/update/delete)                            │
│           │                                                       │
│           ├─→ withValidation (Zod) ────→ Validation error (400)  │
│           │                                                       │
│           ├─→ withLifecycleCallbacks → RPC call                  │
│           │                                                       │
│           └─→ withErrorLogging                                    │
│                    │                                              │
│                    ├─→ Log full error (console.error)            │
│                    │                                              │
│                    └─→ Map error via mapErrorToUserMessage()     │
│                         └─→ React Admin error handler             │
│                              └─→ UI shows user message            │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Team Communication Template

**Announcement Email (Week 1):**

Subject: Error Handling Centralization - New Patterns

---

Hi team,

We're implementing a centralized error handling strategy to ensure:
✅ Users see friendly, actionable error messages (no Postgres codes)
✅ Consistent experience across all features
✅ Easier debugging with structured error logging

**What's Changing (for developers):**
- New function: `mapErrorToUserMessage()` - single source of truth
- Updated `useSafeNotify()` - now understands context
- Ban list: No more `notify(error.message)` - use `useSafeNotify().error(err)` instead

**Timeline:**
- Week 1: Foundation + Tier 1 features (quick-add, imports)
- Weeks 2-3: Tier 2-3 features (forms, dialogs)
- Week 4: ESLint rules + documentation

**Review Checklist:**
All PRs touching error handling must verify:
- [ ] Error messages are user-friendly
- [ ] No raw `error.message` in notify()
- [ ] Tests cover error scenarios

**Questions?** See `/docs/ERROR_HANDLING_STRATEGY.md` or `/src/atomic-crm/ERROR_PATTERNS.md`

---

## Additional Resources

### Existing Code Patterns (Already in Place)
- `useSafeNotify()` hook - existing, will enhance
- `errorMessages.ts` - will consolidate into `errorMapper.ts`
- `withErrorLogging` wrapper - will use new mapper
- `handleServiceError()` - will align with new patterns

### External References
- Zod error handling: https://zod.dev/?id=error-handling
- React Admin error handling: https://marmelab.com/react-admin/Providers#handling-errors
- Supabase error codes: https://supabase.com/docs/reference/postgres/error-codes

---

## Confidence & Sign-Off

**Overall Plan Confidence:** [85%]

**High Confidence (90%+):**
- Error mapper implementation (+95%)
- useSafeNotify hook updates (+95%)
- Tier 1 file migrations (+95%)
- Testing strategy (+90%)

**Medium Confidence (70-89%):**
- ESLint rule implementation (+75%)
- Complete Tier 2-3 migrations (+80%)
- Team adoption of patterns (+75%)

**Lower Confidence Areas (<70%):**
- Identifying ALL edge cases in production (+65%)
  - Mitigation: Add Sentry monitoring, track "raw error" patterns
- Performance with large error objects (+70%)
  - Mitigation: Profile with 1000+ simultaneous operations

---

**Document prepared by:** Claude Code (AI Assistant)
**Ready for review:** January 21, 2026
**Recommended implementation start:** January 24, 2026 (Monday)
**Target completion:** February 21, 2026 (4 weeks)

---
