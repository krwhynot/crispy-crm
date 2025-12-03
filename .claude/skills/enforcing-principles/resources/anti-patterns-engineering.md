# Anti-Patterns: Engineering

## Purpose

Document over-engineering anti-patterns that violate the fail-fast principle.

## Anti-Pattern 1: Over-Engineering (Most Common)

### The Problem

Adding retry logic, circuit breakers, or graceful fallbacks during pre-launch phase.

### WRONG

```typescript
// ❌ Circuit breaker for pre-launch app
class CircuitBreaker {
  private state: 'OPEN' | 'CLOSED' | 'HALF-OPEN' = 'CLOSED';
  private failureCount = 0;
  private threshold = 5;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await operation();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}

// Using circuit breaker
const breaker = new CircuitBreaker();
await breaker.execute(() => supabase.from('contacts').select());
```

**Why it's wrong:**
- 100+ lines of complexity
- No users yet = no benefit
- Hides real problems
- Hard to test and debug
- Maintenance burden

### CORRECT

```typescript
// ✅ Let it throw - simple and clear
const { data, error } = await supabase.from('contacts').select();
if (error) throw error; // Operator sees error immediately
```

**Why it's right:**
- 2 lines instead of 100+
- Loud failures = immediate investigation
- Simple code = easy to maintain
- Pre-launch = velocity over resilience

## Anti-Pattern 2: Promise.all() for Bulk Operations

### The Problem

Using `Promise.all()` for bulk operations causes total failure if one operation fails.

### WRONG

```typescript
// ❌ Promise.all() - fails completely if one fails
const markAllAsRead = async (ids: number[]) => {
  try {
    await Promise.all(
      ids.map((id) => update("notifications", { id, data: { read: true } }))
    );
    notify("All notifications marked as read");
  } catch (error) {
    notify("Failed to mark notifications as read");
  }
};

// If 1 out of 100 operations fails, ALL 100 fail
// Wastes work (discards 99 successes)
```

**Why it's wrong:**
- Total failure for partial failure
- Wastes successful operations
- Poor user experience (no partial success feedback)

### CORRECT

```typescript
// ✅ Promise.allSettled() - handles partial failures
const markAllAsRead = async (ids: number[]) => {
  const results = await Promise.allSettled(
    ids.map((id) => update("notifications", { id, data: { read: true } }))
  );

  const successes = results.filter(r => r.status === "fulfilled").length;
  const failures = results.filter(r => r.status === "rejected").length;

  if (failures === 0) {
    notify(`${successes} notifications marked as read`, { type: "success" });
  } else if (successes > 0) {
    notify(`${successes} succeeded, ${failures} failed`, { type: "warning" });
  } else {
    notify("All operations failed", { type: "error" });
  }
};
```

**Why it's right:**
- Partial success allowed
- Accurate user feedback
- No wasted work

## Checklist

Before committing, check for:

- [ ] ❌ Retry logic or circuit breakers (fail fast instead)
- [ ] ❌ `Promise.all()` for bulk operations (use `Promise.allSettled()`)
- [ ] ❌ Graceful fallbacks hiding errors (let errors throw)
- [ ] ❌ Complex error handling machinery (keep it simple)

## Related Resources

- [error-handling-basics.md](error-handling-basics.md) - Fail-fast patterns
- [error-handling-bulk.md](error-handling-bulk.md) - Promise.allSettled patterns
- [anti-patterns-validation.md](anti-patterns-validation.md) - Validation anti-patterns

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
