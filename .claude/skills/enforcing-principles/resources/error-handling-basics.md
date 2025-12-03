# Error Handling Basics

## Purpose

Document fail-fast error handling patterns for Atomic CRM that prioritize velocity over resilience during pre-launch.

## Core Principle: Fail Fast, No Resilience

**Critical Context:** Atomic CRM is in pre-launch phase. No users yet = operators need loud failures, not silent degradation.

**Fail Fast Philosophy:**
1. **Let errors throw** - No retry logic, no circuit breakers
2. **Loud failures** - Operators see errors immediately
3. **Simple code** - No complex error handling machinery
4. **Quick fixes** - Fix at source, not with workarounds

**Why This Works Pre-Launch:**
- Immediate feedback to developers
- Simpler codebase (less maintenance)
- Faster development velocity
- Forces fixing root causes

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

## FORBIDDEN: Retry Logic

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

## FORBIDDEN: Circuit Breaker

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
```

**Why this is wrong:**
- 100+ lines of complexity
- State management overhead
- Testing complexity
- Pre-launch = operators need to see actual errors, not circuit breaker messages

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Database error | Let it throw | Retry logic |
| Rate limit (429) | Let it throw | Exponential backoff |
| RLS policy failure | Let it throw | Graceful fallback |
| Network failure | Let it throw | Circuit breaker |

## Related Resources

- [error-handling-bulk.md](error-handling-bulk.md) - Promise.allSettled for bulk operations
- [error-handling-validation.md](error-handling-validation.md) - Validation error formatting
- [error-handling-reference.md](error-handling-reference.md) - Decision tree and rationalizations

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
