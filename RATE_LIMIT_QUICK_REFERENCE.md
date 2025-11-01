# Rate Limit Handling - Quick Reference Card

## TL;DR

Rate limit errors (429) are now automatically retried with exponential backoff. No changes needed to existing code—the service is already integrated.

## For Developers

### Using Rate Limit Service

```typescript
import { rateLimitService } from "@/atomic-crm/providers/supabase/services";

// Wrap any operation with automatic retry
const result = await rateLimitService.executeWithRetry(
  () => someApiCall(),
  { resourceName: "contacts", operation: "create" }
);
```

### Testing Rate Limit Handling

```bash
# Run tests
npm test -- RateLimitService.test.ts

# Manual test in browser console
import { rateLimitService } from '@/atomic-crm/providers/supabase/services';

// Check circuit breaker status
console.log(rateLimitService.getCircuitState());

// Manually reset (emergency only)
rateLimitService.resetCircuit();
```

### Error Codes

| Code | Meaning | User Message | Action |
|------|---------|--------------|--------|
| (success) | Automatic retry succeeded | None | None needed |
| `RATE_LIMIT_MAX_RETRIES_EXCEEDED` | 3 retries failed | "System overloaded. Try again in a few moments." | Wait 1-2 min, retry |
| `RATE_LIMIT_CIRCUIT_OPEN` | Too many failures | "Too many requests. Wait 1-2 minutes." | Wait or contact support |

## For Operations

### Monitoring

**Circuit Breaker Status**:
```typescript
const state = rateLimitService.getCircuitState();
if (state.isOpen) {
  alert('Rate limit circuit breaker is OPEN - too many failures!');
  // Check Supabase status page
  // Contact platform team if persists
}
```

**Check Logs**:
```
[RateLimit] Rate limit detected. Retrying in 100ms (attempt 1/3)
[RateLimit] Circuit breaker opened after 5 consecutive failures
[RateLimit] Max retries exceeded
```

### Manual Recovery

If circuit breaker gets stuck:

```typescript
// In browser console
import { rateLimitService } from '@/atomic-crm/providers/supabase/services';
rateLimitService.resetCircuit();
console.log('Circuit reset. Try again.');
```

## For Users

### What to Do

**Seeing "System overloaded" error?**
1. Wait 1-2 minutes
2. Click "Retry" or refresh page
3. Try again

**Still failing after 2 minutes?**
1. Contact support
2. Provide screenshot of error
3. Include timestamp

### Normal Behavior

- Brief loading indicates automatic retry
- Operation completes normally (you won't see an error)
- Bulk imports (CSV) continue working despite errors

## Configuration (if needed to customize)

```typescript
import { RateLimitService } from "@/atomic-crm/providers/supabase/services";

// Create custom instance
const customService = new RateLimitService({
  maxRetries: 2,              // Fewer retries
  initialDelayMs: 50,         // Start sooner
  maxDelayMs: 5000,           // Max 5 sec
  jitterFactor: 0.1,          // Less randomness
  respectRetryAfter: true,    // Keep true
  circuitBreakerThreshold: 8, // More failures before open
});

// Use instead of rateLimitService singleton
```

## Common Issues

### Circuit Breaker Stuck Open

**Symptom**: All operations fail with "circuit breaker is open"

**Fix**:
1. Check Supabase status
2. Wait 60 seconds (auto-reset)
3. Or manually reset:
   ```typescript
   rateLimitService.resetCircuit();
   ```

### Retries Not Happening

**Symptom**: Operations fail immediately

**Check**:
1. Is error actually 429? (check status code)
2. Is operation wrapped? (must use executeWithRetry)
3. Is error different? (non-429s don't retry)

### Too Slow / High Latency

**Symptom**: Operations taking 10+ seconds

**Tune**:
```typescript
const service = new RateLimitService({
  maxRetries: 2,        // Reduce from 3
  maxDelayMs: 5000,     // Reduce from 10000
  respectRetryAfter: false, // Ignore server hints
});
```

## Performance Impact

| Scenario | Latency | Notes |
|----------|---------|-------|
| No errors | 0ms | Completely transparent |
| 1 retry | +100ms | Usually succeeds here |
| 2 retries | +300ms | Occasional overload |
| 3 retries | +700ms | Persistent issues |
| Max retries | <2s total | Then fails with user message |
| Circuit open | Immediate | Prevents retry storms |

## Files to Know

| File | Purpose |
|------|---------|
| `RateLimitService.ts` | Core implementation |
| `RateLimitService.test.ts` | 30+ unit tests |
| `RATE_LIMIT_INTEGRATION.md` | How to integrate |
| `docs/rate-limit-handling.md` | Complete docs |
| `RATE_LIMIT_SOLUTION_SUMMARY.md` | Full overview |

## Key Commands

```bash
# Run tests
npm test -- RateLimitService.test.ts

# Check code coverage
npm run test:coverage

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## One-Minute Summary

- **What**: Automatic retry service for 429 rate limit errors
- **How**: Exponential backoff (100ms → 200ms → 400ms) + circuit breaker
- **Where**: Already integrated in data provider
- **When**: When Supabase API returns 429
- **Result**: Operations succeed transparently, users don't see errors

## Still Have Questions?

1. **How does it work?** → See `docs/rate-limit-handling.md`
2. **How to integrate?** → See `RATE_LIMIT_INTEGRATION.md`
3. **How to test?** → See `RateLimitService.test.ts`
4. **Code examples?** → See `useContactImportWithRateLimit.tsx`
5. **Troubleshooting?** → See `docs/rate-limit-handling.md#troubleshooting`

---

**Last Updated**: 2024
**Status**: Production Ready
**Maintainer**: Platform Team
