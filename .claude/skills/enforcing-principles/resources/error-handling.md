# Error Handling

## Purpose

Document fail-fast error handling patterns for Atomic CRM that prioritize velocity over resilience during pre-launch. Covers when to let errors throw, error logging, validation error formatting, bulk operation error handling, and when NOT to add error handling logic.

## Core Principle: Fail Fast, No Resilience

**Critical Context:** Atomic CRM is in pre-launch phase. No users yet = operators need loud failures, not silent degradation.

**Fail Fast Philosophy:**
1. **Let errors throw** - No retry logic, no circuit breakers
2. **Loud failures** - Operators see errors immediately
3. **Simple code** - No complex error handling machinery
4. **Quick fixes** - Fix at source, not with workarounds

**Why This Works Pre-Launch:**
- ✅ Immediate feedback to developers
- ✅ Simpler codebase (less maintenance)
- ✅ Faster development velocity
- ✅ Forces fixing root causes

**When This Changes:** Post-launch with real users, resilience patterns become appropriate. But NOT before.

## Pattern 1: Let Supabase Errors Throw

### Fail-Fast Pattern

**From `src/atomic-crm/notifications/NotificationRow.tsx:125`:**

```typescript
const markAsRead = async () => {
  await update(
    "notifications",
    { id: notification.id, data: { read: true } },
    {
      onSuccess: () => {
        notify("Notification marked as read", { type: "success" });
        refresh();
      },
      onError: () => {
        notify("Error marking notification as read", { type: "error" });
      },
    }
  );
};
```

**What happens:**
- If Supabase returns 429 (rate limit) → Error throws
- If RLS policy fails → Error throws
- If network fails → Error throws
- Operator sees error in console and UI notification

**No retry logic, no fallback, no graceful degradation.**

### ❌ FORBIDDEN: Retry Logic

```typescript
// ❌ FORBIDDEN - Over-engineered retry with exponential backoff
async function markAsReadWithRetry(id: number, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await update("notifications", { id, data: { read: true } });
      return; // Success
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Why this is wrong:**
- 50+ lines for what should be 5 lines
- Hides problems (silent retries mask issues)
- Maintenance burden (backoff config, max retries, etc.)
- Pre-launch = no users benefit from this complexity

### ❌ FORBIDDEN: Circuit Breaker

```typescript
// ❌ FORBIDDEN - Circuit breaker pattern
class CircuitBreaker {
  private state: 'OPEN' | 'CLOSED' | 'HALF-OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0);
      if (timeSinceLastFailure < 60000) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF-OPEN';
    }

    try {
      const result = await operation();
      if (this.state === 'HALF-OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= 5) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }
}

// Usage
const breaker = new CircuitBreaker();
await breaker.execute(() => update("notifications", { id, data: { read: true } }));
```

**Why this is wrong:**
- 100+ lines of complexity
- State management overhead
- Testing complexity
- Pre-launch = operators need to see actual errors, not circuit breaker messages

## Pattern 2: Promise.allSettled for Bulk Operations

### Correct Bulk Error Handling

**From `src/atomic-crm/notifications/NotificationsList.tsx:212`:**

```typescript
const markAllAsRead = async () => {
  try {
    // Use Promise.allSettled() to handle partial failures gracefully
    const results = await Promise.allSettled(
      selectedIds.map((id) => update("notifications", { id, data: { read: true } }))
    );

    // Count successes and failures
    const successes = results.filter((r) => r.status === "fulfilled").length;
    const failures = results.filter((r) => r.status === "rejected").length;

    if (failures === 0) {
      notify(`${successes} notification(s) marked as read`, { type: "success" });
    } else if (successes > 0) {
      notify(`${successes} notification(s) marked as read, ${failures} failed`, {
        type: "warning",
      });
    } else {
      notify("Failed to mark notifications as read", { type: "error" });
    }

    refresh();
  } catch {
    notify("Error marking notifications as read", { type: "error" });
  }
};
```

**Key Features:**
- `Promise.allSettled()` allows partial success
- Counts successes vs failures
- Informative user feedback based on outcome
- No retry logic - just handle what succeeded and report what failed

### ❌ WRONG: Promise.all() for Bulk Operations

```typescript
// ❌ WRONG - Promise.all() fails completely if one operation fails
const markAllAsRead = async () => {
  try {
    await Promise.all(
      selectedIds.map((id) => update("notifications", { id, data: { read: true } }))
    );
    notify("All notifications marked as read", { type: "success" });
  } catch (error) {
    notify("Failed to mark notifications as read", { type: "error" });
  }
};
```

**Why this fails:**
- If 1 out of 100 operations fails, ALL 100 fail
- Wastes work (discards 99 successes)
- Poor user experience (no partial success feedback)

### When to Use Promise.allSettled

**Use for:**
- Bulk updates/deletes (notifications, contacts, opportunities)
- Parallel fetches that don't depend on each other
- Import operations with multiple records
- Any operation where partial success is acceptable

**Pattern:**
```typescript
// Generic bulk operation pattern
async function bulkOperation<T>(
  items: T[],
  operation: (item: T) => Promise<void>
): Promise<{ successes: number; failures: number }> {
  const results = await Promise.allSettled(items.map(operation));

  const successes = results.filter(r => r.status === "fulfilled").length;
  const failures = results.filter(r => r.status === "rejected").length;

  return { successes, failures };
}

// Usage
const { successes, failures } = await bulkOperation(
  selectedContacts,
  (contact) => update("contacts", { id: contact.id, data: { status: "archived" } })
);

if (failures === 0) {
  notify(`${successes} contacts archived`, { type: "success" });
} else if (successes > 0) {
  notify(`${successes} archived, ${failures} failed`, { type: "warning" });
} else {
  notify("All operations failed", { type: "error" });
}
```

## Pattern 3: Structured Error Logging

### Comprehensive Error Context

**From `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:85`:**

```typescript
/**
 * Log error with context for debugging
 * Integrated from resilientDataProvider for consolidated error logging
 */
function logError(method: string, resource: string, params: any, error: unknown): void {
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
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: error instanceof Error ? error.message : error?.message ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    validationErrors: error?.body?.errors || error?.errors || undefined,
    fullError: error,
  });

  // Log validation errors in detail for debugging
  if (error?.body?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(error.body.errors, null, 2));
  } else if (error?.errors) {
    console.error("[Validation Errors Detail]", JSON.stringify(error.errors, null, 2));
  }
}
```

**What gets logged:**
- Method and resource (getOne, create, update, etc.)
- Parameters (id, filter, sort, pagination)
- Error message and stack trace
- Validation errors (if present)
- Timestamp

**Usage in data provider:**
```typescript
async getOne<RecordType extends RaRecord>(
  resource: string,
  params: GetOneParams
): Promise<GetOneResult<RecordType>> {
  const dbResource = getDatabaseResource(resource);
  try {
    const result = await baseDataProvider.getOne<RecordType>(dbResource, params);
    return normalizeResponseData(result);
  } catch (error) {
    logError("getOne", resource, params, error);
    throw error; // Re-throw after logging
  }
}
```

**Benefits:**
- Standardized error format across entire app
- All context needed for debugging in one place
- Stack traces preserved
- Validation errors separated out

## Pattern 4: Validation Error Formatting

### Zod to React Admin Error Format

**From `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:136`:**

```typescript
async function validateData(
  resource: string,
  data: any,
  operation: "create" | "update" = "create"
): Promise<void> {
  try {
    // Use the ValidationService
    await validationService.validate(resource, operation, data);
  } catch (error: any) {
    // Parse Zod validation errors into React Admin format
    // Zod errors have an 'issues' array with field-level errors
    if (error.issues && Array.isArray(error.issues)) {
      const fieldErrors: Record<string, string> = {};

      // Convert Zod issues to field-error map
      for (const issue of error.issues) {
        const fieldPath = issue.path.join(".");
        const fieldName = fieldPath || "_error";
        fieldErrors[fieldName] = issue.message;
      }

      throw {
        message: "Validation failed",
        errors: fieldErrors,
      };
    }

    // If already in expected format (has errors object at top level)
    if (error.errors && typeof error.errors === "object") {
      throw {
        message: error.message || "Validation failed",
        errors: error.errors,
      };
    }

    // For other Error types, wrap with generic error
    if (error instanceof Error) {
      throw {
        message: error.message || "Validation failed",
        errors: { _error: error.message },
      };
    }

    // Unknown error format - wrap it
    throw {
      message: "Validation failed",
      errors: { _error: String(error) },
    };
  }
}
```

**Error Format:**
```typescript
// Zod validation error (input)
{
  issues: [
    {
      path: ["first_name"],
      message: "First name is required"
    },
    {
      path: ["email", 0, "email"],
      message: "Invalid email address"
    }
  ]
}

// React Admin error format (output)
{
  message: "Validation failed",
  errors: {
    "first_name": "First name is required",
    "email.0.email": "Invalid email address"
  }
}
```

**Why this matters:**
- React Admin displays field-level errors next to inputs
- Dot notation for nested fields (JSONB arrays)
- `_error` for form-level errors

### Form Error Display

**Example from form components:**

```typescript
// React Admin automatically displays errors
<TextInput
  source="first_name"
  label="First Name"
  validate={required()}
/>
// Error shows inline below input: "First name is required"

// For JSONB arrays
<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" label="Email" />
    <SelectInput source="type" choices={emailTypes} />
  </SimpleFormIterator>
</ArrayInput>
// Error shows inline: "email.0.email: Invalid email address"
```

## Pattern 5: When NOT to Handle Errors

### Let These Throw

**Database Errors:**
```typescript
// ✅ Let database errors throw
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .eq('id', id)
  .single();

if (error) throw error; // Good - let it throw
```

**RLS Policy Failures:**
```typescript
// ✅ Let RLS policy failures throw
const { error } = await supabase
  .from('opportunities')
  .update({ stage: 'won' })
  .eq('id', opportunityId);

if (error) throw error; // Good - operator needs to fix RLS policy
```

**Network Failures:**
```typescript
// ✅ Let network failures throw
const response = await fetch('/api/export');
if (!response.ok) throw new Error(`Export failed: ${response.status}`);
// Good - operator checks network/server
```

### ❌ DON'T Wrap These

```typescript
// ❌ WRONG - Silent failure with fallback
async function getContact(id: number) {
  try {
    return await supabase.from('contacts').select('*').eq('id', id).single();
  } catch (error) {
    console.warn('Failed to fetch contact, using cached version');
    return getCachedContact(id); // Bad - hides database issue
  }
}

// ❌ WRONG - Retry on RLS failure
async function updateOpportunity(id: number, data: any) {
  for (let i = 0; i < 3; i++) {
    try {
      return await supabase.from('opportunities').update(data).eq('id', id);
    } catch (error) {
      if (i === 2) throw error;
      await sleep(1000); // Bad - RLS failure needs policy fix, not retry
    }
  }
}
```

## Common Rationalizations (and Why They're Wrong)

### "This is for production"

❌ **Wrong Thinking:** "We need retry logic for production resilience"

✅ **Correct Thinking:** "We're pre-launch. Velocity matters more than resilience. Production patterns come later."

### "It needs to be resilient"

❌ **Wrong Thinking:** "Circuit breaker prevents cascading failures"

✅ **Correct Thinking:** "Resilience = fail loud, not graceful degradation. Operators fix at source."

### "Users will see errors"

❌ **Wrong Thinking:** "We need fallbacks so users don't see errors"

✅ **Correct Thinking:** "No users yet. Operators NEED to see errors to fix them."

### "Industry best practice"

❌ **Wrong Thinking:** "Netflix uses circuit breakers, we should too"

✅ **Correct Thinking:** "Context matters. Netflix has millions of users. We have zero. Different needs."

### "It's just a simple retry"

❌ **Wrong Thinking:** "One retry won't hurt, it's only 5 lines"

✅ **Correct Thinking:** "Every retry adds complexity. Debugging becomes harder. Errors get masked."

## Error Handling Decision Tree

```
Error occurs
│
├─ Bulk operation (100+ items)?
│  └─ YES → Use Promise.allSettled
│           Count successes/failures
│           Show partial success feedback
│
├─ Validation error?
│  └─ YES → Format as React Admin errors
│           Display field-level errors
│           No retry
│
├─ Database/Network/RLS error?
│  └─ YES → Let it throw
│           Log with context
│           Show error notification
│           Operator investigates
│
└─ Unknown error?
   └─ YES → Log with full context
            Let it throw
            Fix at source
```

## Best Practices

### DO

✅ Let errors throw (fail fast)
✅ Use Promise.allSettled for bulk operations
✅ Log errors with full context
✅ Format validation errors for React Admin
✅ Show informative user notifications
✅ Count partial successes in bulk operations
✅ Re-throw after logging

### DON'T

❌ Add retry logic
❌ Create circuit breakers
❌ Use graceful fallbacks
❌ Hide errors with silent degradation
❌ Use Promise.all() for bulk operations
❌ Skip error logging
❌ Swallow errors without re-throwing

## Testing Error Handling

### Unit Test Pattern

```typescript
// Test fail-fast behavior
describe('markAsRead', () => {
  it('throws on Supabase error', async () => {
    // Mock Supabase to throw
    vi.mocked(supabase.from).mockImplementation(() => ({
      update: vi.fn().mockRejectedValue(new Error('RLS policy violation')),
    }));

    // Expect throw, not silent failure
    await expect(markAsRead(1)).rejects.toThrow('RLS policy violation');
  });
});

// Test Promise.allSettled pattern
describe('bulkMarkAsRead', () => {
  it('handles partial failures', async () => {
    const ids = [1, 2, 3, 4, 5];

    // Mock: 3 succeed, 2 fail
    vi.mocked(supabase.from).mockImplementation((table) => ({
      update: vi.fn((data) => {
        return {
          eq: vi.fn((field, value) => {
            if (value === 2 || value === 4) {
              return Promise.reject(new Error('RLS violation'));
            }
            return Promise.resolve({ data: {}, error: null });
          }),
        };
      }),
    }));

    const { successes, failures } = await bulkMarkAsRead(ids);

    expect(successes).toBe(3);
    expect(failures).toBe(2);
  });
});
```

## Related Resources

- [validation-patterns.md](validation-patterns.md) - Zod validation patterns
- [form-state-management.md](form-state-management.md) - Form error display
- [testing-patterns.md](testing-patterns.md) - Testing error scenarios
- [anti-patterns.md](anti-patterns.md) - What NOT to do

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
