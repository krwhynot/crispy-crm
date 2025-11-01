# Rate Limit Handling - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       React Admin UI Layer                       │
│  (ContactCreate, ContactImport, Opportunities, etc.)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Data Provider Layer                             │
│        (unifiedDataProvider.ts)                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  create()  update()  delete()  deleteMany()             │  │
│  │      ↓         ↓         ↓            ↓                 │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │  RateLimitService.executeWithRetry()            │   │  │
│  │  │  Automatic retry on 429 errors                 │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │      ↓                                                 │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │  baseDataProvider.create/update/delete()        │   │  │
│  │  │  (underlying React Admin provider)              │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │      ↓                                                 │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │  supabase.rpc() / supabase.from().insert/etc()  │   │  │
│  │  │  (Supabase API calls)                           │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           RateLimitService (Independent Service Layer)          │
│  src/atomic-crm/providers/supabase/services/RateLimitService.ts│
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  executeWithRetry<T>(operation, context)              │    │
│  │  ├─ Error Detection: isRateLimitError()               │    │
│  │  │  └─ Detects 429 status, statusCode, message       │    │
│  │  │                                                     │    │
│  │  ├─ Exponential Backoff: calculateBackoffMs()         │    │
│  │  │  └─ delay = min(init × 2^n, max) + jitter         │    │
│  │  │  └─ Retry: 100ms → 200ms → 400ms → fail           │    │
│  │  │                                                     │    │
│  │  ├─ Retry-After Header: getRetryAfterMs()            │    │
│  │  │  └─ Respects server-provided timing               │    │
│  │  │                                                     │    │
│  │  └─ Circuit Breaker: shouldOpenCircuit()             │    │
│  │     ├─ CLOSED: Normal operation                      │    │
│  │     │  └─ Successful requests → reset failure count  │    │
│  │     │  └─ Failed requests → increment failure count  │    │
│  │     │                                                 │    │
│  │     ├─ OPEN: Reject all requests immediately         │    │
│  │     │  └─ Failure count >= threshold (5)             │    │
│  │     │  └─ Fail fast to prevent cascading failures    │    │
│  │     │                                                 │    │
│  │     └─ HALF-OPEN: Attempt reset after timeout        │    │
│  │        └─ Wait 60 seconds                            │    │
│  │        └─ Next request: try again                    │    │
│  │           ├─ If succeeds → CLOSED                    │    │
│  │           └─ If fails → OPEN                         │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Configuration (Production Defaults):                          │
│  ├─ maxRetries: 3         (try up to 4 times total)           │
│  ├─ initialDelayMs: 100   (start at 100ms)                    │
│  ├─ maxDelayMs: 10000     (cap at 10 seconds)                 │
│  ├─ jitterFactor: 0.2     (add 20% randomness)                │
│  ├─ respectRetryAfter: true (honor server hints)              │
│  └─ circuitBreakerThreshold: 5 (open after 5 failures)        │
│                                                                 │
│  State Monitoring:                                             │
│  ├─ getCircuitState() → { isOpen, consecutiveFailures, ... }  │
│  └─ resetCircuit() → manual recovery                           │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               Supabase API Client Layer                         │
│        (supabase@latest from @supabase/supabase-js)            │
│                                                                 │
│  Creates HTTP requests to Supabase backend                     │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Supabase Backend (PostgreSQL + PostgREST)           │
│                                                                 │
│  ✓ Normal case: 200 OK                                         │
│  ✗ Overloaded: 429 Too Many Requests (RATE LIMITED)           │
│    └─ May include Retry-After header                          │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow - Success Case (No 429)

```
User creates contact
        ↓
ContactCreate.tsx calls dataProvider.create()
        ↓
unifiedDataProvider.create() wraps with rateLimitService
        ↓
rateLimitService.executeWithRetry(operation)
        ↓
operation() called immediately (attempt 1)
        ↓
baseDataProvider.create() → supabase.from().insert()
        ↓
Supabase API returns 200 OK + data
        ↓
Service returns { data: contact } to UI
        ↓
UI shows new contact in list ✓ SUCCESS
```

## Request Flow - Transient 429 (Automatic Recovery)

```
User creates contact
        ↓
ContactCreate.tsx calls dataProvider.create()
        ↓
unifiedDataProvider.create() wraps with rateLimitService
        ↓
rateLimitService.executeWithRetry(operation)
        ↓
operation() called (attempt 1)
        ↓
baseDataProvider.create() → supabase.from().insert()
        ↓
Supabase API returns 429 Too Many Requests ✗
        ↓
isRateLimitError() detects status: 429 → TRUE
        ↓
Log: "[RateLimit] Rate limit detected. Retrying in 100ms (attempt 1/3)"
        ↓
Wait 100ms (exponential backoff)
        ↓
operation() called (attempt 2)
        ↓
baseDataProvider.create() → supabase.from().insert()
        ↓
Supabase API returns 200 OK (recovered) ✓
        ↓
Service returns { data: contact } to UI
        ↓
UI shows new contact in list ✓ SUCCESS
(User never sees error message - transparent retry)
```

## Request Flow - Persistent 429 (Max Retries Exceeded)

```
User creates contact
        ↓
ContactCreate.tsx calls dataProvider.create()
        ↓
rateLimitService.executeWithRetry(operation)
        ↓
Attempt 1: 429 error
        ↓
Wait 100ms, retry
        ↓
Attempt 2: 429 error
        ↓
Wait 200ms, retry
        ↓
Attempt 3: 429 error
        ↓
Wait 400ms, retry
        ↓
Attempt 4 (final): Still 429
        ↓
consecutiveFailures++ = 1
        ↓
shouldOpenCircuit() check: 1 < 5 → false (don't open yet)
        ↓
Throw error: "RATE_LIMIT_MAX_RETRIES_EXCEEDED"
    message: "Rate limit error persisted after 3 retries..."
        ↓
wrapMethod() catches error
        ↓
logError() records context for debugging
        ↓
Error passed to React Admin
        ↓
UI displays error message: "System overloaded. Try again in a few moments." ⚠️
        ↓
User waits 1-2 minutes and clicks "Retry"
        ↓
consecutiveFailures = 0 (reset on success)
```

## Request Flow - Circuit Breaker Activation

```
Scenario: Supabase has persistent issues (30+ min outage)

First request batch:
  Attempt 1: 429 → retry
  Attempt 2: 429 → retry
  Attempt 3: 429 → retry
  Attempt 4: 429 → fail (consecutiveFailures = 1)

Second request batch (user retries):
  Attempt 1: 429 → retry
  Attempt 2: 429 → retry
  Attempt 3: 429 → retry
  Attempt 4: 429 → fail (consecutiveFailures = 2)

Third request batch:
  Attempt 1: 429 → fail (consecutiveFailures = 3)

Fourth request batch:
  Attempt 1: 429 → fail (consecutiveFailures = 4)

Fifth request batch:
  Attempt 1: 429 → fail (consecutiveFailures = 5)
  ↓
  shouldOpenCircuit() check: 5 >= 5 → TRUE
  ↓
  circuitOpen = true
  ↓
  Log: "[RateLimit] Circuit breaker opened after 5 consecutive failures"
  ↓
  Throw error: "RATE_LIMIT_CIRCUIT_OPEN"
    message: "Circuit breaker is open. Too many consecutive failures..."

Sixth request (while circuit open):
  ↓
  tryResetCircuit() check: timeSinceLastFailure < 60000 → true (still waiting)
  ↓
  Circuit still OPEN
  ↓
  Immediately fail without attempting: "circuit breaker is open"
  ↓
  UI shows: "Too many requests. Wait 1-2 minutes before trying again." ⚠️

After 60 seconds (timeout elapsed):
  Next request:
  ↓
  tryResetCircuit() check: timeSinceLastFailure >= 60000 → TRUE
  ↓
  circuitOpen = false (reset circuit)
  ↓
  consecutiveFailures = 0
  ↓
  Log: "[RateLimit] Circuit breaker reset after timeout"
  ↓
  Attempt operation normally
  ↓
  If Supabase recovered: Success ✓
  If Supabase still down: 429 again, accumulate failures...
```

## Integration Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Application Entry Points                   │
│                                                              │
│  ├─ Contact Creation (ContactCreate.tsx)                    │
│  │  └─ dataProvider.create("contacts", { data })            │
│  │                                                           │
│  ├─ Contact Import (useContactImport.tsx)                   │
│  │  └─ dataProvider.create("contacts", ...) × 100 items    │
│  │                                                           │
│  ├─ Opportunities (OpportunityCreate.tsx)                   │
│  │  └─ dataProvider.create("opportunities", { data })       │
│  │     └─ RPC: sync_opportunity_with_products()            │
│  │                                                           │
│  └─ Segments (get_or_create)                               │
│     └─ RPC: get_or_create_segment()                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
             │              │              │
             ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│           Unified Data Provider (entrypoint)                  │
│    unifiedDataProvider.ts (create/update/delete methods)     │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│      RateLimitService (middleware layer)                      │
│  Rate limit detection, retry, circuit breaker                │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│     Base Data Provider (React Admin provider)                 │
│     baseDataProvider.create/update/delete/etc.               │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│     Supabase JavaScript Client                                │
│     supabase.from().insert/update/delete()                   │
│     supabase.rpc()                                            │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │   Supabase Backend   │
    │   (PostgreSQL +      │
    │    PostgREST API)    │
    └──────────────────────┘
```

## Data Flow - Bulk Import with Rate Limits

```
CSV Import: 100 contacts
        ↓
useContactImport.processBatch()
        ↓
Parse & validate CSV
        ↓
Split into logical batches
        ↓
For each contact in batch:
    ├─ Contact 1-20: Create normally
    │  └─ rateLimitService: no 429, auto-succeed
    │
    ├─ Contact 21-40: Hit rate limit
    │  └─ rateLimitService: retry automatically, eventually succeed
    │     User sees: brief loading, no error
    │
    ├─ Contact 41-60: Still rate limited
    │  └─ rateLimitService: retry, but server still overloaded
    │     Max retries exhausted → fail with error
    │     Add to errors[] for reporting
    │
    ├─ Contact 61-80: Circuit opens after N failures
    │  └─ rateLimitService: immediately reject
    │     "Circuit breaker open"
    │     Add to errors[] for reporting
    │
    └─ Contact 81-100: Circuit still open (auto-reset after 60s)
       └─ User can retry in bulk, circuit will eventually reset
          Contacts 81-100 retry after circuit recovers

Final Report:
  ├─ successCount: 85 (created successfully)
  ├─ failedCount: 15 (rate limited or circuit open)
  ├─ errors: [
  │    { row: 45, errors: [{ field: 'general', message: 'Rate limit...' }] },
  │    { row: 51, errors: [{ field: 'general', message: 'Circuit...' }] },
  │    ...
  │  ]
  └─ retryCount: 45+ (internal retries that succeeded)

User Experience:
  ✓ 85 contacts imported successfully
  ✓ Clear list of 15 failed contacts
  ✓ Can retry failed contacts after system recovers
  ✓ No complete import failure due to transient errors
```

## Configuration Propagation

```
┌─────────────────────────────────────────────────────┐
│  App Initialization (main.tsx)                      │
└─────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────┐
│  RateLimitService Singleton                         │
│  src/atomic-crm/providers/supabase/services/        │
│  RateLimitService.ts                                │
│                                                     │
│  const rateLimitService = new RateLimitService({   │
│    maxRetries: 3,                                   │
│    initialDelayMs: 100,                             │
│    maxDelayMs: 10000,                               │
│    jitterFactor: 0.2,                               │
│    respectRetryAfter: true,                         │
│    circuitBreakerThreshold: 5,                      │
│  });                                                │
│                                                     │
│  export { rateLimitService };                       │
└─────────────────────────────────────────────────────┘
  ↓
  (used globally throughout app)
  ↓
┌─────────────────────────────────────────────────────┐
│  unifiedDataProvider.ts                             │
│  All data mutations use singleton instance          │
└─────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────┐
│  ContactImport, Opportunities, etc.                 │
│  All inherit rate limit handling automatically      │
└─────────────────────────────────────────────────────┘
```

## Error Handling Cascade

```
API Call
    ↓
    ├─ Success (200) → return data to UI ✓
    │
    └─ Error
       ├─ 429 (rate limit)
       │  └─ Is transient? (status 429)
       │     ├─ YES → Can retry?
       │     │  ├─ YES → Retry with backoff
       │     │  │  ├─ Retry succeeds → return data ✓
       │     │  │  └─ Retry fails → try again
       │     │  │
       │     │  └─ NO (max retries) → throw "MAX_RETRIES_EXCEEDED"
       │     │
       │     └─ Circuit breaker?
       │        ├─ CLOSED → Normal retry logic
       │        ├─ OPEN → Fail immediately "CIRCUIT_OPEN"
       │        └─ HALF_OPEN → Attempt one retry
       │
       └─ Other errors (400, 500, etc.)
          └─ Pass through immediately
             User sees validation error, network error, etc.
```

---

This architecture ensures:
- **Resilience**: Automatic retry with exponential backoff
- **Fairness**: Jitter prevents retry storms
- **Safety**: Circuit breaker prevents cascading failures
- **Transparency**: Transient errors handled automatically
- **Observability**: Clear logging and state inspection
- **User Experience**: Graceful degradation with clear error messages
