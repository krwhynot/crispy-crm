# Rate Limit Handling Implementation Guide

## Overview

The `RateLimitService` provides production-ready resilience for handling Supabase 429 (Too Many Requests) rate limit errors. It implements exponential backoff with jitter, respects Retry-After headers, and uses a circuit breaker pattern to fail fast when the system is overloaded.

## Problem Statement

When the Supabase API occasionally returns 429 rate limit errors, the application needs to:
1. Automatically retry failed requests with exponential backoff
2. Respect Retry-After headers for server-provided timing guidance
3. Implement circuit breaker pattern to fail fast when errors are persistent
4. Prevent cascading failures during bulk operations (like contact imports)
5. Provide clear error messages to users

## Solution Architecture

### Core Components

**RateLimitService** (`src/atomic-crm/providers/supabase/services/RateLimitService.ts`)
- Detects 429 errors from Supabase
- Implements exponential backoff with jitter
- Respects Retry-After headers
- Manages circuit breaker state
- Provides monitoring and recovery interfaces

### Integration Points

1. **Data Provider** - Wraps create/update/delete operations
2. **Contact Import** - Handles bulk contact creation resilience
3. **RPC Calls** - Protects segment and opportunity RPC operations

## Implementation Details

### 1. RateLimitService Architecture

```typescript
// 3 layers of defense:

// Layer 1: Error Detection
isRateLimitError(error) → boolean

// Layer 2: Automatic Retry with Backoff
executeWithRetry<T>(
  operation: () => Promise<T>,
  context?: { resourceName; operation }
) → Promise<T>

// Layer 3: Circuit Breaker
getCircuitState() → { isOpen; consecutiveFailures; ... }
resetCircuit() → void
```

### 2. Exponential Backoff Formula

```
delay = min(initialDelay × 2^attempt, maxDelay) + jitter
delay = min(100 × 2^0, 10000) + (delay × jitterFactor × random())
```

Example progression with initial=100ms, max=10000ms, jitter=0.2:
- Attempt 1: ~100ms
- Attempt 2: ~200ms
- Attempt 3: ~400ms
- Attempt 4: ~800ms
- Attempt 5: ~1600ms
- etc. (capped at 10000ms)

### 3. Circuit Breaker Pattern

```
Normal State:
  - Requests flow through
  - Failures reset on success
  - Consecutive failures tracked

Open State (triggered after N consecutive failures):
  - All requests immediately fail with "circuit open" error
  - Prevents cascading failures
  - Automatically attempts to reset after 60 seconds

Half-Open State (during reset timeout):
  - Next request attempt resets the circuit
  - If successful, circuit closes and resumes normal
  - If fails, circuit opens again
```

### 4. Configuration

Default configuration (production-safe):

```typescript
{
  maxRetries: 3,              // 3 automatic retries
  initialDelayMs: 100,        // Start at 100ms
  maxDelayMs: 10000,          // Cap at 10 seconds
  jitterFactor: 0.2,          // 20% randomness
  respectRetryAfter: true,    // Honor server headers
  circuitBreakerThreshold: 5, // Open after 5 consecutive failures
}
```

## Usage Examples

### 1. Basic Integration in Data Provider

```typescript
import { rateLimitService } from "@/atomic-crm/providers/supabase/services";

// In unifiedDataProvider.ts create() method:
async create(resource: string, params: CreateParams): Promise<any> {
  return wrapMethod("create", resource, params, async () => {
    const dbResource = getResourceName(resource);
    const processedData = await processForDatabase(resource, params.data, "create");

    // Wrap the actual database call
    const result = await rateLimitService.executeWithRetry(
      () => baseDataProvider.create(dbResource, {
        ...params,
        data: processedData as any,
      }),
      { resourceName: resource, operation: "create" }
    );

    return result;
  });
}
```

### 2. RPC Calls Protection

```typescript
// Protect segment creation RPC
if (resource === "segments") {
  const { data, error } = await rateLimitService.executeWithRetry(
    () => supabase.rpc('get_or_create_segment', {
      p_name: processedData.name
    }),
    { resourceName: resource, operation: "get_or_create_segment" }
  );

  if (error) throw error;
  return { data: data[0] };
}
```

### 3. Bulk Import Resilience

```typescript
// In useContactImportWithRateLimit.tsx
import { rateLimitService } from "@/atomic-crm/providers/supabase/services";

// Before starting import, check circuit state
const circuitState = rateLimitService.getCircuitState();
if (circuitState.isOpen) {
  // Show user: "Rate limiting is active. Please wait 1-2 minutes before retrying."
  return { errors: [{ field: 'general', message: '...' }] };
}

// Wrap each contact creation
await rateLimitService.executeWithRetry(
  () => dataProvider.create("contacts", { data: contactPayload }),
  { resourceName: "contacts", operation: "create_during_import" }
);
```

### 4. Monitoring Circuit Breaker

```typescript
// In app initialization or monitoring setup
function setupRateLimitMonitoring() {
  setInterval(() => {
    const state = rateLimitService.getCircuitState();
    if (state.isOpen) {
      console.warn('[RateLimit] Circuit breaker is open!', state);
      // Send alert to monitoring service
      // Sentry.captureMessage('Rate limit circuit breaker opened', 'warning');
    }
  }, 30000); // Check every 30 seconds
}
```

## Error Handling

### Error Codes and Messages

**1. Successful Retry (Transparent to User)**
- Status: Success
- Behavior: Automatic retry succeeds, operation completes normally
- User Experience: Brief loading indicator, then normal completion

**2. RATE_LIMIT_MAX_RETRIES_EXCEEDED**
- Status: 3 retries failed, giving up
- Message: "Rate limit error persisted after 3 retries. The system is temporarily overloaded. Please try again in a few moments."
- User Action: Wait 1-2 minutes and retry

**3. RATE_LIMIT_CIRCUIT_OPEN**
- Status: Too many consecutive failures (5+), circuit breaker activated
- Message: "Rate limit circuit breaker is open. Too many consecutive failures. Please wait before retrying."
- User Action: Wait 1-2 minutes for circuit to auto-reset, or wait for admin recovery

### UI Error Display Pattern

```typescript
// In form error handler or global error boundary
function getErrorMessage(error: any): string {
  if (error?.code === 'RATE_LIMIT_CIRCUIT_OPEN') {
    return 'The system is temporarily overloaded. Please wait 1-2 minutes before trying again.';
  }

  if (error?.code === 'RATE_LIMIT_MAX_RETRIES_EXCEEDED') {
    return 'Request timeout due to high server load. Please try again in a few moments.';
  }

  return error?.message || 'An error occurred. Please try again.';
}

// In Contact form error display
{error?.code === 'RATE_LIMIT_CIRCUIT_OPEN' && (
  <Alert type="warning">
    {getErrorMessage(error)}
    <Button onClick={() => location.reload()}>Retry Now</Button>
  </Alert>
)}
```

## Testing

### Unit Tests

Comprehensive test suite in `RateLimitService.test.ts`:

```bash
npm test -- RateLimitService.test.ts
```

Coverage includes:
- Error detection (status code, statusCode property, message parsing)
- Exponential backoff calculation
- Jitter randomization
- Retry-After header parsing (seconds and HTTP date formats)
- Circuit breaker state transitions
- Max retries exhaustion
- Non-429 error passthrough
- Manual circuit reset

### Manual Testing

**Test 1: Simulate Rate Limit Error**
```typescript
// In browser console, inject failure
const { rateLimitService } = await import('@/atomic-crm/providers/supabase/services');
const originalMethod = supabase.from('contacts').insert;
supabase.from('contacts').insert = () => {
  const error = new Error('Too Many Requests');
  (error as any).status = 429;
  throw error;
};
// Try to create a contact - should retry automatically
```

**Test 2: Monitor Circuit Breaker**
```typescript
const { rateLimitService } = await import('@/atomic-crm/providers/supabase/services');
console.log(rateLimitService.getCircuitState());
// { isOpen: false, consecutiveFailures: 0, ... }
```

**Test 3: Bulk Import Resilience**
1. Upload large CSV (100+ contacts)
2. Trigger rate limit on server (or inject via test mode)
3. Observe: Import continues with automatic retries
4. Check: Success count increases despite transient errors

## Monitoring & Observability

### Logging

The service logs:
- Retry attempts with delay timing
- Circuit breaker state changes
- Max retries exhaustion
- Consecutive failure counts

### Metrics to Track

1. **Retry Count** - How many retries per operation
2. **Circuit State** - Is circuit breaker open/closed
3. **Rate Limit Frequency** - How often 429 errors occur
4. **Recovery Success Rate** - % of retries that succeed

### Integration with Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/react";
import { rateLimitService } from "@/atomic-crm/providers/supabase/services";

// Monitor circuit breaker
setInterval(() => {
  const state = rateLimitService.getCircuitState();
  if (state.isOpen) {
    Sentry.captureMessage(
      'Rate limit circuit breaker opened',
      'warning',
      { extra: state }
    );
  }
}, 30000);

// Track retry exhaustion
export const captureRateLimitFailure = (error: any) => {
  if (error?.code === 'RATE_LIMIT_MAX_RETRIES_EXCEEDED') {
    Sentry.captureException(error, {
      tags: { error_type: 'rate_limit_exhausted' },
    });
  }
};
```

## Performance Characteristics

### Latency Impact

- **Success (no 429)**: No additional latency (transparent)
- **One 429**: +100-200ms (exponential backoff)
- **Two 429s**: +300-500ms (backoff progression)
- **Max retries (3)**: +700-1400ms total delay

### Throughput

- Circuit breaker prevents cascading failures
- Reduced retry storms preserve server capacity
- Bulk imports complete successfully despite transient overload

## Recovery Scenarios

### Scenario 1: Temporary Rate Limit (Most Common)

```
Time 0:00: Client hits rate limit
Time 0:10: Service retries with 100ms delay
Time 0:11: Request succeeds on retry
Result: User never sees error, operation completes normally
```

### Scenario 2: Persistent Overload

```
Time 0:00: Client hits rate limit (attempt 1)
Time 0:10: Retry 1 fails (100ms delay)
Time 0:11: Retry 2 fails (200ms delay)
Time 0:13: Retry 3 fails (400ms delay)
Time 0:14: Circuit opens after 3 consecutive failures
Time 0:15: User sees: "System overloaded, try again in 2 minutes"
Time 2:15: User retries, circuit auto-resets, request succeeds
```

### Scenario 3: Bulk Import Under Load

```
Import 100 contacts:
- Contacts 1-20: Normal, no 429s
- Contacts 21-40: Hit rate limit, automatic retries succeed
- Contacts 41-60: Circuit breaker opens
- Contacts 61-100: Circuit prevents cascading failures
- Result: 85 contacts created successfully, clear error for 15
- User can retry later when system recovers
```

## Migration Path

### Phase 1: Add Service (Current)
- Create `RateLimitService.ts`
- Create comprehensive tests
- Deploy to production (not yet integrated)

### Phase 2: Data Provider Integration
- Update `unifiedDataProvider.ts` create/update/delete
- Wrap RPC calls (segments, opportunities)
- Test in staging environment

### Phase 3: Contact Import Integration
- Update `useContactImport.tsx` with rate limit handling
- Add circuit state check before bulk operations
- Test with large CSV imports

### Phase 4: Monitoring & Observability
- Add circuit breaker monitoring
- Integrate with error tracking (Sentry)
- Dashboard for rate limit metrics

## Production Checklist

Before deploying to production:

- [ ] RateLimitService tests pass (100% coverage)
- [ ] Data provider integration tested with rate limit injection
- [ ] Contact import tested with 100+ contact CSV
- [ ] Error messages reviewed with UX/Product
- [ ] Monitoring dashboards configured
- [ ] Sentry integration verified
- [ ] Runbook created for circuit breaker reset
- [ ] Support team trained on error messages
- [ ] Performance testing with production load
- [ ] Gradual rollout (feature flag) recommended

## Files Modified/Created

### New Files
- `src/atomic-crm/providers/supabase/services/RateLimitService.ts` - Core service
- `src/atomic-crm/providers/supabase/services/RateLimitService.test.ts` - Tests
- `src/atomic-crm/contacts/useContactImportWithRateLimit.tsx` - Example integration
- `src/atomic-crm/providers/supabase/unifiedDataProvider.rateLimitIntegration.ts` - Integration guide

### Modified Files (When Integrated)
- `src/atomic-crm/providers/supabase/services/index.ts` - Export RateLimitService
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Wrap create/update/delete
- `src/atomic-crm/contacts/useContactImport.tsx` - Optional, can use new version

## Troubleshooting

### Circuit Breaker Stays Open

**Symptom**: All requests fail with "circuit breaker is open"

**Causes**:
1. Server still experiencing issues
2. Configuration threshold too low
3. Retry-After header too aggressive

**Solutions**:
```typescript
// Manual reset (emergency recovery)
import { rateLimitService } from '@/atomic-crm/providers/supabase/services';
rateLimitService.resetCircuit();

// Adjust configuration
const service = new RateLimitService({
  circuitBreakerThreshold: 8, // Increase threshold
  // ... other config
});
```

### Retries Not Happening

**Symptom**: Operations fail immediately without retry

**Causes**:
1. Error not recognized as 429 (check format)
2. Service not wrapped in specific operation
3. Non-429 error thrown

**Solutions**:
```typescript
// Verify error detection
const error = { status: 429, message: 'Too Many Requests' };
// Should be detected by isRateLimitError(error) → true

// Check wrapping
await rateLimitService.executeWithRetry(operation, context);
// Must be used for each operation
```

### High Latency During Retries

**Symptom**: Operations take 10+ seconds

**Causes**:
1. Multiple retries with max delays
2. Retry-After header set too high
3. Jitter factor too high

**Solutions**:
```typescript
// Reduce max delay
const service = new RateLimitService({
  maxDelayMs: 5000, // Reduce from 10000
});

// Disable Retry-After if problematic
const service = new RateLimitService({
  respectRetryAfter: false,
});

// Reduce max retries
const service = new RateLimitService({
  maxRetries: 2, // Reduce from 3
});
```

## References

- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Supabase Rate Limiting](https://supabase.com/docs/guides/platform/rate-limits)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

## Questions & Support

For questions or issues:
1. Check the troubleshooting section above
2. Review test cases for usage examples
3. Check production logs for error codes and messages
4. Contact platform engineering team
