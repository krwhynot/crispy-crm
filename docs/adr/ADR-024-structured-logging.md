# ADR-024: Structured Logging with Metric Tracking

## Status

**Accepted**

## Date

2024-12

## Deciders

- krwhynot

---

## Context

Crispy CRM needed a logging solution that bridges console debugging in development with production monitoring via Sentry. The challenge was creating a unified interface that:

1. **Routes by severity** - Debug logs shouldn't pollute Sentry, but errors must be captured
2. **Preserves context** - Errors need structured metadata (resource, method, feature) for filtering
3. **Tracks health metrics** - Error rates and latency should be observable without external tooling
4. **Stays lightweight** - SPAs can't afford heavy logging libraries like Winston or Bunyan

### Problem Statement

| Scenario | Raw console.* | Full logging library | Custom Logger |
|----------|--------------|---------------------|---------------|
| Development debugging | ✅ Easy | ❌ Overhead | ✅ Falls through |
| Production error capture | ❌ Invisible | ✅ Full-featured | ✅ Sentry routing |
| Structured context | ❌ Manual | ✅ Built-in | ✅ Custom implementation |
| Bundle size | ✅ 0KB | ❌ 50-100KB | ✅ ~2KB |
| Sentry integration | ❌ Separate | ❌ Adapter needed | ✅ Native |

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Raw console.*** | Zero overhead, native | No production visibility, no structure |
| **Pino** | Fast, structured, Node standard | Server-oriented, no Sentry integration |
| **Winston** | Feature-rich, transports | Heavy (100KB+), complex for SPA |
| **loglevel** | Lightweight, level filtering | No Sentry integration, minimal structure |
| **Custom Logger class** | Tailored to needs, native Sentry, lightweight | Maintenance burden |

---

## Decision

**Implement a custom Logger class with level-based Sentry routing and in-memory metric tracking.**

### Implementation: `src/lib/logger.ts`

#### 1. Singleton Pattern (line 464)

```typescript
// src/lib/logger.ts:464
export const logger = new Logger();
```

Single instance ensures consistent state (metrics buffer, period tracking) across the application.

#### 2. Log Level Hierarchy (lines 111-117)

```typescript
// src/lib/logger.ts:111-117
private levelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};
```

Production (`minLevel: "info"`) suppresses debug; development captures all.

#### 3. Level-Based Sentry Routing (lines 180-239)

```typescript
// src/lib/logger.ts:201-239
switch (level) {
  case "error":
  case "fatal":
    if (error) {
      Sentry.captureException(error, {
        tags: { ...tags, logger: "app", severity: level },
        extra: { ...extras, message },
      });
    } else {
      Sentry.captureMessage(message, {
        level: level === "fatal" ? "fatal" : "error",
        tags: { ...tags, logger: "app" },
        extra: extras,
      });
    }
    break;

  case "warn":
    Sentry.captureMessage(message, {
      level: "warning",
      tags: { ...tags, logger: "app" },
      extra: extras,
    });
    break;

  case "info":
    // Info messages become breadcrumbs for context, not events
    Sentry.addBreadcrumb({
      category: "logger",
      message,
      level: "info",
      data: extras,
    });
    break;

  case "debug":
    // Debug messages are console-only, not sent to Sentry
    break;
}
```

| Log Level | Sentry Action | Rationale |
|-----------|--------------|-----------|
| `fatal` | `captureException` with `fatal` level | Catastrophic failures |
| `error` | `captureException` with `error` level | Bugs requiring fix |
| `warn` | `captureMessage` with `warning` level | Issues to monitor |
| `info` | `addBreadcrumb` only | Context for error investigation |
| `debug` | Console only | Development noise |

#### 4. Tag Promotion (lines 191-198)

```typescript
// src/lib/logger.ts:191-198
if (context) {
  for (const [key, value] of Object.entries(context)) {
    // Known tag fields get promoted to tags for filtering
    if (["resource", "method", "operation", "feature", "service"].includes(key)) {
      tags[key] = String(value);
    } else {
      extras[key] = value;
    }
  }
}
```

Promoted tags appear in Sentry's tag filtering UI, enabling queries like:
- `resource:contacts method:create` - All contact creation errors
- `feature:slide-over` - All slide-over panel errors
- `service:validation` - All validation service errors

#### 5. Circular Metrics Buffer (lines 53-58, 306-310)

```typescript
// src/lib/logger.ts:53-55
const MAX_METRICS = 1000;
const metricsBuffer: MetricEntry[] = [];

// src/lib/logger.ts:306-310
// Add to circular buffer
if (metricsBuffer.length >= MAX_METRICS) {
  metricsBuffer.shift();
}
metricsBuffer.push(entry);
```

| Property | Value | Rationale |
|----------|-------|-----------|
| Max entries | 1000 | ~100KB memory ceiling |
| Eviction | FIFO | Oldest metrics dropped first |
| Retention | In-memory | Clears on page reload |

#### 6. Minute-Granularity Error Rate (lines 62-84, 345-360)

```typescript
// src/lib/logger.ts:62-65
function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
}

// src/lib/logger.ts:345-360
getErrorRate(): number {
  cleanupOldPeriods();

  let totalErrors = 0;
  let totalRequests = 0;

  for (const count of errorCountByPeriod.values()) {
    totalErrors += count;
  }
  for (const count of requestCountByPeriod.values()) {
    totalRequests += count;
  }

  if (totalRequests === 0) return 0;
  return (totalErrors / totalRequests) * 100;
}
```

- **Granularity:** Per-minute buckets
- **Retention:** 60 minutes (1 hour rolling window)
- **Cleanup:** Probabilistic (1% chance per request) to avoid overhead

#### 7. Breadcrumb API (lines 407-423)

```typescript
// src/lib/logger.ts:407-417
breadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category: "ui" | "navigation" | "user" | "data" | "http" = "user"
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level: "info",
    data,
  });
}
```

Categories enable filtering breadcrumb trails:
- `ui` - Button clicks, modal opens
- `navigation` - Route changes
- `user` - User actions (drag, edit)
- `data` - Data operations
- `http` - API calls

#### 8. User Context (lines 429-443)

```typescript
// src/lib/logger.ts:429-443
setUser(user: { id: string; email?: string; username?: string; role?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    this.info("User context set", { userId: user.id, role: user.role });
  } else {
    Sentry.setUser(null);
    this.info("User context cleared");
  }
}
```

Enables filtering errors by user ID or role in Sentry.

---

## Usage Examples

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Development only
logger.debug('Fetching contacts with filter', { filter });

// Info (becomes breadcrumb)
logger.info('Contact slide-over opened', { contactId, mode: 'edit' });

// Warning (Sentry event)
logger.warn('Search query too short, skipping', { query, minLength: 3 });

// Error (Sentry event with exception)
logger.error('Failed to save contact', error, { contactId, operation: 'update' });

// Fatal (Sentry event, highest severity)
logger.fatal('Application bootstrap failed', error, { reason: 'auth_init' });
```

### Metrics and Health

```typescript
// Track API latency
logger.metric('api_latency', 250, { endpoint: '/contacts' });

// Track request success/failure
logger.trackRequest('/contacts', true, 180);  // success in 180ms
logger.trackRequest('/contacts', false);       // failure

// Check health
if (logger.isErrorRateHigh(5)) {  // >5% error rate
  // Trigger alert or circuit breaker
}

// Get metrics for dashboard
const { errorRate, totalRequests, totalErrors, recentMetrics } = logger.getMetrics();
```

### User Session Tracking

```typescript
// After login
logger.setUser({ id: user.id, email: user.email, role: 'rep' });
logger.setTag('org_id', user.organization_id);

// After logout
logger.setUser(null);
```

---

## Anti-Patterns

### 1. Using console.* Directly (AVOID)

```typescript
// WRONG: Bypasses level routing and Sentry integration
console.error('Contact save failed', error);

// CORRECT: Use logger
logger.error('Contact save failed', error, { contactId });
```

### 2. Logging Sensitive Data (NEVER)

```typescript
// WRONG: PII in logs
logger.info('User authenticated', { email: user.email, password: user.password });

// CORRECT: Minimal identifiers
logger.info('User authenticated', { userId: user.id });
```

### 3. Over-logging in Loops (AVOID)

```typescript
// WRONG: Floods logs and Sentry
for (const contact of contacts) {
  logger.info('Processing contact', { contactId: contact.id });
}

// CORRECT: Log summary
logger.info('Processing contacts batch', { count: contacts.length });
```

### 4. Swallowing Errors

```typescript
// WRONG: Error invisible
try {
  await save();
} catch (error) {
  logger.debug('Save failed', { error }); // Debug won't reach Sentry!
}

// CORRECT: Use appropriate level
try {
  await save();
} catch (error) {
  logger.error('Save failed', error, { operation: 'save' });
  throw error; // Re-throw per fail-fast
}
```

### 5. Missing Context in Error Logs

```typescript
// WRONG: No context for debugging
logger.error('Operation failed', error);

// CORRECT: Include actionable context
logger.error('Operation failed', error, {
  resource: 'contacts',
  method: 'update',
  recordId: contact.id,
});
```

---

## Consequences

### Positive

- **Unified interface** - One logger for dev console and prod Sentry
- **Zero production debug noise** - Debug level filtered in prod
- **Searchable errors** - Tag promotion enables Sentry filtering
- **Breadcrumb context** - Info logs provide error investigation context
- **Health visibility** - Error rates accessible without external tooling
- **Lightweight** - ~2KB vs 50-100KB for full logging libraries
- **Typed API** - TypeScript interfaces for log entries

### Negative

- **Custom code maintenance** - No community updates like OSS libraries
- **Limited transports** - Only console and Sentry (no file, no external services)
- **In-memory metrics** - Lost on page reload (acceptable for SPA)

### Neutral

- **Sentry coupling** - Logger assumes Sentry integration; abstracting would add complexity
- **Environment-based behavior** - Debug suppression may hide issues in staging

---

## Integration with Observability Stack

```
┌────────────────────────────────────────┐
│          Application Code               │
│  logger.error('Failed', error, ctx)     │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│        Logger Class (this ADR)          │
│  1. Format log entry                    │
│  2. Console output                      │
│  3. Track error count                   │
│  4. Route to Sentry by level            │
│     - error/fatal → captureException    │
│     - warn → captureMessage             │
│     - info → breadcrumb                 │
│     - debug → console only              │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│        Sentry (ADR-020)                 │
│  beforeSend filtering                   │
│  Session replay                         │
│  Alerting                               │
└────────────────────────────────────────┘
```

---

## Related ADRs

- **[ADR-020: Sentry Error Monitoring](./ADR-020-sentry-error-monitoring.md)** - Ultimate destination for error/warn level logs
- **[ADR-025: Error Logging Wrapper](./ADR-025-error-logging-wrapper.md)** - DataProvider wrapper that uses this logger
- **[ADR-014: Fail-Fast Philosophy](./ADR-014-fail-fast-philosophy.md)** - Why errors should use `error` level, not `debug`

---

## References

- Logger implementation: `src/lib/logger.ts`
- Error boundary usage: `src/components/ErrorBoundary.tsx:63`
- DataProvider usage: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:237`
