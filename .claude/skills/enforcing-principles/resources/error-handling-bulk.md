# Error Handling: Bulk Operations

## Purpose

Document Promise.allSettled patterns for bulk operations in Atomic CRM.

## Pattern: Promise.allSettled for Bulk Operations

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

### WRONG: Promise.all() for Bulk Operations

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

## When to Use Promise.allSettled

**Use for:**
- Bulk updates/deletes (notifications, contacts, opportunities)
- Parallel fetches that don't depend on each other
- Import operations with multiple records
- Any operation where partial success is acceptable

## Generic Bulk Operation Pattern

```typescript
// Generic bulk operation helper
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

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Bulk updates | `Promise.allSettled()` | `Promise.all()` |
| Bulk deletes | `Promise.allSettled()` | Sequential for-loop with try/catch |
| Import operations | `Promise.allSettled()` | Stop on first error |
| Parallel reads (all required) | `Promise.all()` | Sequential awaits |
| Parallel reads (partial OK) | `Promise.allSettled()` | `Promise.all()` |

## Related Resources

- [error-handling-basics.md](error-handling-basics.md) - Fail-fast core patterns
- [error-handling-validation.md](error-handling-validation.md) - Validation error formatting
- [error-handling-reference.md](error-handling-reference.md) - Decision tree

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
