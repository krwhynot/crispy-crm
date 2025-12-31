# ADR-025: Error Logging Wrapper Pattern

## Status

**Accepted**

## Date

2024-12

## Deciders

- krwhynot

---

## Context

Crispy CRM's unified DataProvider (`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`) grew to ~1650 lines, mixing CRUD logic with error handling concerns. This created several problems:

1. **Code duplication** - Every method had similar try/catch blocks
2. **Inconsistent logging** - Some methods logged more context than others
3. **Security gaps** - Some error logs inadvertently included sensitive data
4. **Testing complexity** - Error handling couldn't be tested in isolation

### Problem Statement

The original inline error handling looked like this:

```typescript
// BEFORE: Inline error handling in every method
async getOne(resource, params) {
  try {
    const result = await baseProvider.getOne(resource, params);
    return result;
  } catch (error) {
    console.error('[DataProvider Error]', {
      method: 'getOne',
      resource,
      params: { id: params.id }, // What about other params?
      // Missing: timestamp, validation details, data redaction
    });
    throw error;
  }
}
```

This was repeated across all 9 DataProvider methods with inconsistent context.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Inline try/catch** | Obvious, no abstraction | Duplication, inconsistency |
| **Middleware pattern** | Composable, familiar from Express | Doesn't fit React Admin DataProvider interface |
| **Decorator pattern (wrapper)** | Single implementation, composable | Additional function call overhead |
| **Error boundary only** | Catches React errors | Misses DataProvider errors |
| **Aspect-oriented programming** | Clean separation | Overkill for 9 methods |

---

## Decision

**Extract error handling to a composable `withErrorLogging` wrapper that wraps all DataProvider methods.**

### Implementation: `src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts`

#### 1. Wrapper Function Signature (lines 227-290)

```typescript
// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:227
export function withErrorLogging<T extends DataProvider>(provider: T): T {
  const dataProviderMethods: (keyof DataProvider)[] = [
    "getList",
    "getOne",
    "getMany",
    "getManyReference",
    "create",
    "update",
    "updateMany",
    "delete",
    "deleteMany",
  ];

  const wrappedProvider = { ...provider } as T;

  for (const method of dataProviderMethods) {
    const original = provider[method];
    if (typeof original === "function") {
      (wrappedProvider as Record<string, unknown>)[method] = async (
        resource: string,
        params: DataProviderLogParams
      ) => {
        try {
          const result = await original.call(provider, resource, params);
          logSuccess(method, resource, params, result);
          return result;
        } catch (error: unknown) {
          logError(method, resource, params, error);
          // ... error transformation logic
          throw error;
        }
      };
    }
  }

  return wrappedProvider;
}
```

All 9 core DataProvider methods are wrapped with identical try/catch logic.

#### 2. Structured Error Context (lines 72-107)

```typescript
// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:72-92
function logError(
  method: string,
  resource: string,
  params: DataProviderLogParams,
  error: unknown
): void {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      ids: params?.ids,
      filter: params?.filter,
      sort: params?.sort,
      pagination: params?.pagination,
      target: params?.target,
      // SECURITY: Redact actual data, just indicate presence
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    validationErrors: extendedError?.body?.errors,
    fullError: error,
  });
}
```

| Context Field | Purpose | Redacted? |
|--------------|---------|-----------|
| `method` | Which operation failed | No |
| `resource` | Which table/resource | No |
| `id` / `ids` | Record identifiers | No |
| `filter` | Query filters | No |
| `sort` | Sort parameters | No |
| `pagination` | Page/perPage | No |
| `data` | Request payload | **YES** → `"[Data Present]"` |
| `timestamp` | When error occurred | No |

#### 3. Data Redaction (lines 88-89)

```typescript
// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:88-89
// SECURITY: Redact actual data, just indicate presence
data: params?.data ? "[Data Present]" : undefined,
```

**Why redact?**
- Data may contain PII (names, emails, phone numbers)
- Data may contain business-sensitive information
- Logs may be stored in less-secure systems than the database
- Presence/absence of data is sufficient for debugging

**Validation errors ARE logged** (lines 109-128) because they don't contain the original values, only field names and error messages:

```typescript
// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:109-128
// Log validation errors in detail for debugging
if (extendedError?.body?.errors) {
  console.error("[Validation Errors Detail]", JSON.stringify(extendedError.body.errors, null, 2));
  // DEBUG: Also log the data that caused the error
  if (params && "data" in params) {
    console.error(
      "[Validation Data Submitted]",
      JSON.stringify((params as { data: unknown }).data, null, 2)
    );
  }
}
```

#### 4. Idempotent Delete Handling (lines 169-175, 265-269)

```typescript
// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:169-175
function isAlreadyDeletedError(error: unknown): boolean {
  const extendedError = error as ExtendedError | undefined;
  return !!extendedError?.message?.includes("Cannot coerce the result to a single JSON object");
}

// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:265-269
// Handle idempotent delete - if resource doesn't exist, treat as success
if (method === "delete" && isAlreadyDeletedError(error)) {
  return { data: params.previousData };
}
```

**Why?** React Admin's optimistic updates can cause a race condition:

```
1. User clicks delete
2. React Admin updates UI immediately (optimistic)
3. User clicks delete again (or page refreshes)
4. First delete completes successfully
5. Second delete fails: "Cannot coerce" because row is gone
```

Treating "already deleted" as success maintains idempotency and prevents confusing error messages.

#### 5. Supabase Error Transformation (lines 138-158)

```typescript
// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:138-158
function transformSupabaseError(error: SupabaseError): ValidationError {
  const fieldErrors: Record<string, string> = {};

  // Try to parse field from error details
  if (typeof error.details === "string") {
    // Simple heuristic to extract field name from error
    const match = error.details.match(/column "(\w+)"/i);
    if (match) {
      fieldErrors[match[1]] = error.details;
    } else {
      fieldErrors._error = error.details;
    }
  } else {
    fieldErrors._error = error.message || "Operation failed";
  }

  return {
    message: error.message || "Operation failed",
    errors: fieldErrors,
  };
}
```

Transforms Supabase errors like:
```
{ code: "23502", details: "null value in column \"name\" violates not-null constraint" }
```

Into React Admin validation format:
```
{ message: "null value...", errors: { name: "null value in column \"name\"..." } }
```

This allows React Admin to display field-specific error messages.

#### 6. Audit Trail for Sensitive Operations (lines 194-212)

```typescript
// src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts:194-212
function logSuccess(
  method: string,
  resource: string,
  params: DataProviderLogParams,
  result: unknown
): void {
  const SENSITIVE_OPERATIONS = ["delete", "deleteMany"];
  const SENSITIVE_RESOURCES = ["sales", "opportunities"];

  if (SENSITIVE_OPERATIONS.includes(method) || SENSITIVE_RESOURCES.includes(resource)) {
    console.info("[DataProvider Audit]", {
      method,
      resource,
      recordId: params?.id || params?.ids || resultData?.data?.id,
      timestamp: new Date().toISOString(),
    });
  }
}
```

Deletes and high-value resource operations are logged even on success for audit purposes.

#### 7. Wrapper Composition Order

```typescript
// From ADR-009: Composed Data Provider
export function createContactsHandler(baseProvider: DataProvider): DataProvider {
  return withErrorLogging(
    withLifecycleCallbacks(
      withValidation(baseProvider),
      [contactsCallbacks]
    )
  );
}
```

**Order matters:**

| Position | Wrapper | Why |
|----------|---------|-----|
| Innermost | `withValidation` | Validates BEFORE any transformations |
| Middle | `withLifecycleCallbacks` | Transforms after validation passes |
| Outermost | `withErrorLogging` | Catches ALL errors from inner layers |

---

## Anti-Patterns

### 1. Wrong Composition Order (CRITICAL)

```typescript
// WRONG: Validation runs AFTER callbacks may have transformed invalid data
return withErrorLogging(
  withValidation(
    withLifecycleCallbacks(base, [callbacks])  // WRONG ORDER
  )
);

// CORRECT: Validation first, then callbacks, then logging catches all
return withErrorLogging(
  withLifecycleCallbacks(
    withValidation(base),  // CORRECT ORDER
    [callbacks]
  )
);
```

### 2. Logging Sensitive Data (NEVER)

```typescript
// WRONG: PII in logs
const context = {
  data: params.data,  // NEVER: Contains user emails, names, etc.
};

// CORRECT: Indicate presence only
const context = {
  data: params.data ? "[Data Present]" : undefined,
};
```

### 3. Swallowing Errors (NEVER)

```typescript
// WRONG: Logs but doesn't throw
try {
  return await original.call(provider, resource, params);
} catch (error) {
  logError(method, resource, params, error);
  return { data: null };  // NEVER: Silent failure
}

// CORRECT: Log and re-throw
try {
  return await original.call(provider, resource, params);
} catch (error) {
  logError(method, resource, params, error);
  throw error;  // Always re-throw
}
```

### 4. Inline Error Handling (AVOID)

```typescript
// WRONG: Duplicated in every method
async getOne(resource, params) {
  try { ... } catch { logError(...) }
}
async getList(resource, params) {
  try { ... } catch { logError(...) }  // Same pattern repeated
}

// CORRECT: Single wrapper handles all methods
return withErrorLogging(baseProvider);
```

### 5. Inconsistent Error Formats

```typescript
// WRONG: Different error formats for different backends
throw { message: "Failed", errorCode: 123 };  // Custom format
throw new Error("Failed");  // Standard Error
throw { body: { errors: { name: "Required" } } };  // React Admin format

// CORRECT: Transform all to React Admin format
throw transformSupabaseError(error);  // Consistent format
```

---

## Consequences

### Positive

- **Single implementation** - Error handling logic in one place
- **Consistent logging** - Same context for all 9 methods
- **Security by default** - Data redaction is automatic
- **Testable** - Wrapper can be unit tested in isolation
- **Composable** - Combine with other wrappers (validation, callbacks)
- **Idempotent deletes** - No confusing errors on repeated deletes
- **Audit trail** - Sensitive operations logged on success

### Negative

- **Function call overhead** - Extra wrapper layer (negligible for network-bound ops)
- **Debugging indirection** - Stack traces include wrapper frames
- **All-or-nothing** - Can't opt-out specific methods without modification

### Neutral

- **Console-based logging** - Works but could integrate with structured logger
- **Regex-based field extraction** - Heuristic, may miss some patterns

---

## Integration with Observability Stack

```
┌────────────────────────────────────────┐
│        React Admin Component            │
│   await dataProvider.create(...)        │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│   withErrorLogging (this ADR)           │
│   1. Call inner provider                │
│   2. On success: audit sensitive ops    │
│   3. On error:                          │
│      a. Log with redacted context       │
│      b. Handle idempotent delete        │
│      c. Transform Supabase → RA format  │
│      d. Re-throw                        │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│      withLifecycleCallbacks             │
│   beforeCreate, afterGetOne, etc.       │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│      withValidation                     │
│   Zod schema validation                 │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│      Base Supabase DataProvider         │
│   Actual database operations            │
└────────────────────────────────────────┘
```

---

## Related ADRs

- **[ADR-020: Sentry Error Monitoring](../tier-4-infrastructure/ADR-020-sentry-error-monitoring.md)** - Where errors ultimately land after logging
- **[ADR-024: Structured Logging](../tier-4-infrastructure/ADR-024-structured-logging.md)** - Logger class that could replace console.error
- **[ADR-009: Composed Data Provider](./ADR-009-composed-data-provider.md)** - Pattern for composing multiple wrappers
- **[ADR-001: Unified Data Provider](../tier-1-foundations/ADR-001-unified-data-provider.md)** - Original monolithic provider this was extracted from
- **[ADR-014: Fail-Fast Philosophy](../tier-1-foundations/ADR-014-fail-fast-philosophy.md)** - Why errors are re-thrown, not swallowed

---

## References

- Wrapper implementation: `src/atomic-crm/providers/supabase/wrappers/withErrorLogging.ts`
- Composed provider usage: `src/atomic-crm/providers/supabase/composedDataProvider.ts:9`
- Architecture diagram: `docs/architecture/data-provider.md`
