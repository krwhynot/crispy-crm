# Error Handling

## Fail-Fast Core Principle

Pre-launch phase: loud failures over silent degradation. No retry logic, no circuit breakers, no graceful fallbacks.

**Why:** Immediate feedback, simpler code, faster velocity, forces fixing root causes.

## Pattern: Let Errors Throw

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

If Supabase returns 429, RLS fails, or network fails -- error throws. Operator sees it immediately.

## FORBIDDEN: Retry Logic and Circuit Breakers

Both patterns add 50-100+ lines of complexity for zero benefit pre-launch. They hide problems and create maintenance burden. Delete them and use a 2-line throw instead.

## Pattern: Promise.allSettled for Bulk Operations

```typescript
const markAllAsRead = async () => {
  const results = await Promise.allSettled(
    selectedIds.map((id) => update("notifications", { id, data: { read: true } }))
  );

  const successes = results.filter((r) => r.status === "fulfilled").length;
  const failures = results.filter((r) => r.status === "rejected").length;

  if (failures === 0) {
    notify(`${successes} notification(s) marked as read`, { type: "success" });
  } else if (successes > 0) {
    notify(`${successes} succeeded, ${failures} failed`, { type: "warning" });
  } else {
    notify("All operations failed", { type: "error" });
  }
};
```

**Rule of thumb:**
- **Reads (all required):** `Promise.all()` -- fail fast if any dependency missing
- **Writes (bulk mutations):** `Promise.allSettled()` -- preserve partial success

## Pattern: Structured Error Logging

```typescript
function logError(method: string, resource: string, params: unknown, error: unknown): void {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      filter: params?.filter,
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
```

Always log method, resource, params, and timestamp. Re-throw after logging.

## Pattern: Zod to React Admin Error Format

```typescript
// Zod error (input)
{ issues: [{ path: ["first_name"], message: "Required" }] }

// React Admin format (output)
{ message: "Validation failed", errors: { "first_name": "Required" } }
```

Dot notation for nested fields (`email.0.email`). Use `_error` key for form-level errors. React Admin displays field-level errors inline automatically.

## Error Handling Decision Tree

```
Error occurs
|
+- Bulk operation? --> Promise.allSettled, count successes/failures
+- Validation error? --> Format as { message, errors: {} }, no retry
+- Database/Network/RLS? --> Let it throw, log with context
+- Unknown? --> Log with full context, let it throw
```

## Common Rationalizations (Reject All)

- "This is for production" -- We are pre-launch. Velocity over resilience.
- "Users will see errors" -- No users yet. Operators need to see errors.
- "Industry best practice" -- Context matters. Zero users = different needs.
- "It's just a simple retry" -- Every retry adds complexity and masks errors.

## Testing Error Handling

```typescript
// Test fail-fast behavior
it('throws on Supabase error', async () => {
  vi.mocked(supabase.from).mockImplementation(() => ({
    update: vi.fn().mockRejectedValue(new Error('RLS policy violation')),
  }));
  await expect(markAsRead(1)).rejects.toThrow('RLS policy violation');
});

// Test Promise.allSettled partial failures
it('handles partial failures', async () => {
  // Mock 3 succeed, 2 fail
  const { successes, failures } = await bulkMarkAsRead(ids);
  expect(successes).toBe(3);
  expect(failures).toBe(2);
});
```
