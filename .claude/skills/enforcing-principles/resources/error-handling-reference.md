# Error Handling Reference

## Purpose

Decision trees, common rationalizations, and testing patterns for error handling.

## When NOT to Handle Errors

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

### DON'T Wrap These

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

❌ **Wrong:** "We need retry logic for production resilience"

✅ **Correct:** "We're pre-launch. Velocity matters more than resilience. Production patterns come later."

### "It needs to be resilient"

❌ **Wrong:** "Circuit breaker prevents cascading failures"

✅ **Correct:** "Resilience = fail loud, not graceful degradation. Operators fix at source."

### "Users will see errors"

❌ **Wrong:** "We need fallbacks so users don't see errors"

✅ **Correct:** "No users yet. Operators NEED to see errors to fix them."

### "Industry best practice"

❌ **Wrong:** "Netflix uses circuit breakers, we should too"

✅ **Correct:** "Context matters. Netflix has millions of users. We have zero. Different needs."

### "It's just a simple retry"

❌ **Wrong:** "One retry won't hurt, it's only 5 lines"

✅ **Correct:** "Every retry adds complexity. Debugging becomes harder. Errors get masked."

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

## Best Practices Summary

### DO

- Let errors throw (fail fast)
- Use Promise.allSettled for bulk operations
- Log errors with full context
- Format validation errors for React Admin
- Show informative user notifications
- Count partial successes in bulk operations
- Re-throw after logging

### DON'T

- Add retry logic
- Create circuit breakers
- Use graceful fallbacks
- Hide errors with silent degradation
- Use Promise.all() for bulk operations
- Skip error logging
- Swallow errors without re-throwing

## Testing Error Handling

### Unit Test Pattern

```typescript
// Test fail-fast behavior
describe('markAsRead', () => {
  it('throws on Supabase error', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      update: vi.fn().mockRejectedValue(new Error('RLS policy violation')),
    }));

    await expect(markAsRead(1)).rejects.toThrow('RLS policy violation');
  });
});

// Test Promise.allSettled pattern
describe('bulkMarkAsRead', () => {
  it('handles partial failures', async () => {
    const ids = [1, 2, 3, 4, 5];

    // Mock: 3 succeed, 2 fail
    vi.mocked(supabase.from).mockImplementation(() => ({
      update: vi.fn(() => ({
        eq: vi.fn((field, value) => {
          if (value === 2 || value === 4) {
            return Promise.reject(new Error('RLS violation'));
          }
          return Promise.resolve({ data: {}, error: null });
        }),
      })),
    }));

    const { successes, failures } = await bulkMarkAsRead(ids);

    expect(successes).toBe(3);
    expect(failures).toBe(2);
  });
});
```

## Related Resources

- [error-handling-basics.md](error-handling-basics.md) - Fail-fast core patterns
- [error-handling-bulk.md](error-handling-bulk.md) - Promise.allSettled patterns
- [error-handling-validation.md](error-handling-validation.md) - Validation error formatting
- [testing-patterns.md](testing-patterns.md) - Full testing guide

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
