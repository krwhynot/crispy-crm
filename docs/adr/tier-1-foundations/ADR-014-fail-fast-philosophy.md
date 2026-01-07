# ADR-014: Fail-Fast Philosophy

## Status

**Accepted**

## Date

2024-10

## Deciders

- krwhynot

---

## Context

Crispy CRM is in its MVP phase, replacing Excel-based sales pipelines for MFB, a food distribution broker. The current environment has specific characteristics that inform error handling strategy:

1. **Small User Base**: Only 6 account managers at MFB, all internal users who can communicate issues quickly via Slack or direct conversation.

2. **Pre-Launch Product**: This is a new system replacing Excel spreadsheets. Users expect some rough edges and are tolerant of visible errors during the transition period.

3. **Development Velocity Priority**: Fast iteration is critical to achieve 100% team adoption within 30 days. Complex error handling code slows development.

4. **Silent Failures Are Worse Than Crashes**: During MVP development, a silent failure that hides a bug is far more costly than a visible crash. Hidden bugs compound into larger issues and erode trust in the system.

5. **Quick Communication Loop**: When errors occur, the small team can immediately report issues, allowing rapid fixes without formal support channels.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Retry with exponential backoff** | Handles transient failures | Hides intermittent bugs, complex code |
| **Circuit breakers** | Prevents cascade failures | Over-engineering for 6 users, hides root cause |
| **Graceful degradation/fallbacks** | Better UX | Masks API issues, stale data risks |
| **Fail fast** | Simple code, immediate bug detection | Users see error screens |

---

## Decision

**NO retry logic, circuit breakers, or graceful fallbacks during MVP phase.** Let errors throw immediately and surface loudly.

### Core Principles

1. **Errors Throw at Point of Failure**: No swallowing exceptions with silent `console.error()`. Every error propagates up to be handled.

2. **ResourceErrorBoundary Catches at Feature Level**: React error boundaries provide UI recovery without hiding the error.

3. **Sentry Captures with Rich Context**: All errors are logged with resource, page, and feature tags for rapid debugging.

4. **Development Mode Shows Details**: Full error information visible in development for immediate diagnosis.

### Error Boundary Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Root                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Top-level ErrorBoundary - catastrophic failures only   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              ResourceErrorBoundary (per feature)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Catches: component errors within ContactList, etc.     │ │
│  │ Logs: Sentry with resource/page tags                   │ │
│  │ Renders: Recovery UI with "Try Again" button           │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Feature Components                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Let errors throw - no try/catch unless re-throwing     │ │
│  │ No fallback data, no cached responses                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### ResourceErrorBoundary Implementation

```tsx
// src/components/errors/ResourceErrorBoundary.tsx

export class ResourceErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { resource, page } = this.props;

    // Log with resource-specific context
    logger.error(`Resource error: ${resource}/${page || "unknown"}`, error, {
      resource,
      page: page || "unknown",
      feature: `resource:${resource}`,
      componentStack: errorInfo.componentStack,
    });

    // Capture to Sentry with rich tagging
    Sentry.captureException(error, {
      tags: {
        resource,
        page: page || "unknown",
        errorBoundary: "resource",
        feature: `resource:${resource}`,
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        // Recovery UI with "Try Again" and "Dashboard" buttons
        // Error details shown in development only
      );
    }
    return this.props.children;
  }
}
```

### Correct Pattern - Let Errors Propagate

```typescript
// In unifiedDataProvider.ts - errors throw, no swallowing

async function getList(resource: string, params: GetListParams) {
  // If validation fails, throw immediately
  const validated = validationService.validate(resource, params.filter);

  // If database query fails, let it throw
  const result = await baseDataProvider.getList(resource, params);

  return result;
  // No try/catch wrapping the whole thing
}
```

### Correct Pattern - Usage in Feature

```tsx
// In ContactList.tsx - wrapped with error boundary in parent

function ContactList() {
  const { data, isLoading, error } = useGetList("contacts");

  // Let the error boundary handle this
  if (error) throw error;

  return <DataGrid data={data} />;
}

// In contacts/index.tsx - error boundary at resource level
export default function ContactsResource() {
  return (
    <ResourceErrorBoundary resource="contacts">
      <ContactList />
    </ResourceErrorBoundary>
  );
}
```

---

## Anti-Patterns

### 1. Silent Console Errors (NEVER DO THIS)

```typescript
// WRONG: Swallows error, hides bugs
try {
  await dataProvider.create("contacts", { data });
} catch (error) {
  console.error("Failed to create contact:", error);  // NEVER
  // User sees nothing, bug is hidden
}
```

### 2. Retry Logic with Exponential Backoff (NEVER DO THIS)

```typescript
// WRONG: Premature optimization, hides intermittent bugs
async function fetchWithRetry(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);  // NEVER during MVP
    }
  }
}
```

### 3. Circuit Breakers (NEVER DO THIS)

```typescript
// WRONG: Over-engineering for 6 users
class CircuitBreaker {
  private failures = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      throw new Error("Circuit is open");  // NEVER during MVP
    }
    // ... complex state management
  }
}
```

### 4. Fallback Data / Cached Responses (NEVER DO THIS)

```typescript
// WRONG: Masks API issues, users see stale data
async function getContacts() {
  try {
    return await dataProvider.getList("contacts");
  } catch (error) {
    console.warn("Using cached data");
    return localStorage.getItem("contacts_cache");  // NEVER
  }
}
```

---

## Consequences

### Positive

- **Fast Development**: No complex error handling code to write or maintain
- **Immediate Bug Detection**: Errors surface at point of failure, not days later in production
- **Simpler Codebase**: Fewer branches, less defensive programming
- **Quick Debugging**: Sentry tags pinpoint exact resource and page where error occurred
- **Honest System**: Users and developers see real system state, not masked failures

### Negative

- **Users See Error Screens**: Instead of graceful degradation, users encounter error boundaries
- **Must Revisit Post-Launch**: This strategy is explicitly temporary for MVP phase
- **Requires Monitoring**: Team must actively watch Sentry for errors

### Neutral

- **Acceptable Trade-off**: For 6 internal users during pre-launch, visible errors are preferable to hidden bugs

---

## When to Revisit

This ADR should be reconsidered when:

1. **Post-Launch**: Once the system is in production with external users
2. **User Base Growth**: When users beyond the internal MFB team are affected by crashes
3. **Stability Over Velocity**: When the product matures and stability becomes more important than iteration speed
4. **SLA Requirements**: When uptime guarantees are needed

At that point, consider introducing:
- Retry logic for transient network failures
- Circuit breakers for external service calls
- Graceful degradation for non-critical features
- Cached fallbacks for read-heavy operations

---

## Related ADRs

- **[ADR-011: Feature Directory Structure](../tier-3-frontend/ADR-011-feature-directory-structure.md)** - Error boundaries placed at resource level following this structure

---

## References

- ResourceErrorBoundary: `src/components/errors/ResourceErrorBoundary.tsx`
- Sentry configuration: `src/sentry.ts`
- Engineering Constitution: `CLAUDE.md` (Fail Fast section)
