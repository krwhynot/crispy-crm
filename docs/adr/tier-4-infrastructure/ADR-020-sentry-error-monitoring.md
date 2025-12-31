# ADR-020: Sentry Error Monitoring with Structured Filtering

## Status

**Accepted**

## Date

2024-12

## Deciders

- krwhynot

---

## Context

Crispy CRM is a React 19 SPA deployed to Vercel with Supabase as the backend. Production error visibility is critical for a pre-launch product where fast iteration matters. The challenge is capturing meaningful errors while filtering noise that would obscure actionable issues.

### Problem Statement

1. **Client-side errors are invisible** without monitoring - users encounter issues but developers don't know
2. **Browser noise is significant** - ResizeObserver loops, chunk loading failures, and navigation aborts generate false positives
3. **CSP compliance required** - Vercel's default CSP restricts `unsafe-eval`, which Zod's JIT compilation uses
4. **Small user base** - 6 account managers means low volume, so 100% error capture is feasible and valuable
5. **Session context needed** - Understanding what led to an error requires replay capability

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Sentry** | Industry standard, React integration, session replay, free tier sufficient | Another service to manage |
| **LogRocket** | Better session replay quality | Expensive for startup, heavier bundle, privacy concerns |
| **Custom error tracking** | Full control, no dependencies | Reinventing well-solved problem, no replay |
| **Server-side only (Supabase logs)** | Simpler setup | Loses all client context, can't see UI state |
| **No monitoring (console only)** | Zero cost | Blind to production issues, unacceptable for MVP |

---

## Decision

**Use Sentry with aggressive filtering and CSP-compliant configuration.**

### Implementation: `src/main.tsx:1-98`

#### 1. CSP Compliance via Zod JIT Disable (lines 1-5)

Zod's JIT compilation uses `new Function()` which triggers CSP `unsafe-eval` violations. Disabling JIT at bootstrap prevents these errors:

```typescript
// src/main.tsx:1-5
// Configure Zod BEFORE any imports that use Zod schemas
// This disables JIT compilation which uses new Function() and triggers CSP violations
// See: https://github.com/colinhacks/zod/issues/4360
import { z } from "zod";
z.config({ jitless: true });
```

**Critical:** This must be the FIRST import in the application entry point.

#### 2. Conditional Initialization (lines 15-16)

```typescript
// src/main.tsx:15-16
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
```

Sentry only initializes when DSN is configured (production/staging). Development runs without Sentry overhead.

#### 3. Trace Propagation (lines 25-29)

```typescript
// src/main.tsx:25-29
tracePropagationTargets: [
  "localhost",
  /^https:\/\/.*\.supabase\.co/,
  /^https:\/\/.*\.vercel\.app/,
],
```

Enables distributed tracing between frontend and Supabase, providing end-to-end visibility.

#### 4. Session Replay Configuration (lines 32-37)

```typescript
// src/main.tsx:32-37
Sentry.replayIntegration({
  maskAllText: true, // Set to true to mask all text for privacy
  blockAllMedia: true, // Set to true to block all media (images, videos)
  // Sticky sessions help debug persistent UI issues
  stickySession: true,
}),
```

Privacy-first: all text and media masked by default. Sticky sessions maintain context across page refreshes.

#### 5. Sampling Strategy (lines 39-43)

```typescript
// src/main.tsx:39-43
tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0.1,
replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
```

| Setting | Production | Development | Rationale |
|---------|------------|-------------|-----------|
| Traces | 10% | 100% | Limit prod volume, full visibility in dev |
| Replay baseline | 10% | 10% | Random sample of healthy sessions |
| Replay on error | 100% | 100% | **Every error gets a replay** |

#### 6. Error Filtering via `beforeSend` (lines 49-84)

```typescript
// src/main.tsx:49-77
beforeSend(event, hint) {
  const error = hint.originalException;

  // Filter out ResizeObserver errors (common browser noise)
  if (error instanceof Error) {
    if (error.message?.includes("ResizeObserver loop")) {
      return null;
    }
    // Filter out chunk load failures (usually network issues, not bugs)
    if (
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Failed to fetch dynamically imported module")
    ) {
      return null;
    }
    // Filter out network abort errors (user navigated away)
    if (error.name === "AbortError" || error.message?.includes("The operation was aborted")) {
      return null;
    }
    // Filter out CSP eval errors from feature detection
    if (
      error.name === "EvalError" ||
      error.message?.includes("unsafe-eval") ||
      error.message?.includes("Content Security Policy")
    ) {
      return null;
    }
  }

  // Normalize Supabase auth cancellation to warning level (not critical)
  if (error instanceof Error && error.message?.includes("Auth session missing")) {
    event.level = "warning";
  }

  return event;
}
```

| Filtered Error | Reason | Return |
|---------------|--------|--------|
| `ResizeObserver loop` | Browser quirk, not a bug | `null` (drop) |
| `Loading chunk` / `dynamically imported module` | Network/CDN issue, user can retry | `null` (drop) |
| `AbortError` / `operation was aborted` | User navigated away, expected | `null` (drop) |
| `EvalError` / `unsafe-eval` / `CSP` | Feature detection noise | `null` (drop) |
| `Auth session missing` | User logged out, not critical | Downgrade to `warning` |

#### 7. Breadcrumb Filtering (lines 90-95)

```typescript
// src/main.tsx:90-95
beforeBreadcrumb(breadcrumb) {
  // Drop console.debug breadcrumbs (too noisy)
  if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
    return null;
  }
  return breadcrumb;
}
```

Debug-level console logs are development artifacts, not useful for production debugging.

---

## Anti-Patterns

### 1. Capturing Every Error (NEVER DO THIS)

```typescript
// WRONG: No filtering = noise drowns signal
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // No beforeSend filter = ResizeObserver spam
});
```

### 2. Silent Error Swallowing (NEVER DO THIS)

```typescript
// WRONG: Catch without capture = invisible errors
try {
  await dataProvider.create("contacts", { data });
} catch (error) {
  console.error(error); // NEVER: Sentry doesn't see this
  // User sees nothing, bug is hidden
}
```

### 3. Capturing PII in Session Replay

```typescript
// WRONG: Leaking user data
Sentry.replayIntegration({
  maskAllText: false, // NEVER: Exposes customer names, emails
  blockAllMedia: false, // NEVER: May capture sensitive documents
});
```

### 4. Importing Sentry Before Zod JIT Disable

```typescript
// WRONG: Order matters!
import * as Sentry from "@sentry/react"; // Too early
import { z } from "zod";
z.config({ jitless: true }); // Too late, CSP errors already fired
```

### 5. Hardcoding DSN

```typescript
// WRONG: Commits credentials, no environment separation
Sentry.init({
  dsn: "https://abc123@o123.ingest.sentry.io/456", // NEVER hardcode
});
```

---

## Consequences

### Positive

- **100% error visibility** - Every production error is captured with context
- **Session replay for errors** - Developers can see exactly what users experienced
- **Reduced noise** - Filtered errors keep the dashboard actionable
- **CSP compliance** - Works with Vercel's security defaults
- **Zero-cost tier** - Free Sentry tier is sufficient for 6 users
- **Distributed tracing** - Can correlate frontend errors with Supabase operations

### Negative

- **Third-party dependency** - Reliance on Sentry availability
- **Bundle size impact** - Sentry adds ~30KB to production bundle
- **Privacy considerations** - Even masked replays require user consent awareness
- **Filter maintenance** - New browser bugs may require new filters

### Neutral

- **Environment-specific behavior** - Sentry disabled in development unless DSN configured
- **Sampling trade-offs** - 10% trace sampling may miss rare performance issues

---

## Integration with Observability Stack

```
┌────────────────────────────────────────┐
│          React Components               │
│    (ErrorBoundary, useDataProvider)     │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│      logger (ADR-024)                   │
│  Routes errors to Sentry by level       │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│  withErrorLogging (ADR-025)             │
│  DataProvider error context enrichment  │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────┐
│        Sentry (this ADR)                │
│  beforeSend → filter → capture/drop     │
│  Session replay on all errors           │
└────────────────────────────────────────┘
```

---

## Related ADRs

- **[ADR-024: Structured Logging](./ADR-024-structured-logging.md)** - Logger class that routes to Sentry based on log level
- **[ADR-025: Error Logging Wrapper](../tier-2-data-layer/ADR-025-error-logging-wrapper.md)** - DataProvider wrapper that enriches error context before logging
- **[ADR-014: Fail-Fast Philosophy](../tier-1-foundations/ADR-014-fail-fast-philosophy.md)** - Why errors should surface loudly, not be silently caught

---

## References

- Sentry initialization: `src/main.tsx:1-98`
- Error boundaries: `src/components/ErrorBoundary.tsx`, `src/components/ResourceErrorBoundary.tsx`
- Zod CSP issue: https://github.com/colinhacks/zod/issues/4360
- Sentry React SDK: https://docs.sentry.io/platforms/javascript/guides/react/
