# ADR-019: Provider Architecture Migration Pattern (Feature-Flagged)

## Status

**Accepted**

## Date

Original: 2024-12 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

As documented in [ADR-001](../tier-1-foundations/ADR-001-unified-data-provider.md), the unified data provider grew to ~1657 lines with interleaved resource-specific logic. [ADR-009](./ADR-009-composed-data-provider.md) introduced a composed handler architecture to address this, but migrating a live production system from one architecture to another presents risks:

1. **Zero-Downtime Requirement**: The CRM is actively used by 6 sales reps. A failed migration could halt pipeline management during critical sales periods.

2. **Gradual Rollout Need**: We need to test the composed architecture in staging/development before production, then roll out incrementally to catch regressions.

3. **Rollback Capability**: If the composed provider has bugs, we need instant rollback without redeployment.

4. **Circular Dependencies**: The service layer depends on the data provider, but the composed provider needs services. This chicken-and-egg problem requires careful initialization ordering.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Big-bang replacement** | Simple, one-time effort | High risk, no rollback, outage if bugs |
| **Parallel deployments** | Can A/B test | Complex infrastructure, data sync issues |
| **Feature flag toggle** | Zero-downtime, instant rollback, gradual rollout | Maintains two code paths temporarily |
| **Branch-by-abstraction** | Clean separation | Requires interface refactoring upfront |

---

## Decision

**Use a Vite environment variable feature flag** (`VITE_USE_COMPOSED_PROVIDER`) to toggle between unified and composed providers at runtime.

### Feature Flag Implementation

```typescript
// src/atomic-crm/providers/supabase/index.ts:29-45

/**
 * Feature flag for composed provider architecture
 *
 * Set VITE_USE_COMPOSED_PROVIDER=true in .env to enable the new architecture.
 * Default: false (uses unifiedDataProvider for backward compatibility)
 *
 * Architecture comparison:
 * - **Unified (default)**: Single monolithic provider with inline services (1657 LOC)
 * - **Composed (new)**: Handler-based routing with service container (206 LOC + handlers)
 *
 * Migration strategy:
 * 1. Deploy with flag disabled (production uses unified)
 * 2. Enable for testing environments
 * 3. Gradual rollout: 10% → 50% → 100%
 * 4. Remove unified after 1 week stable
 */
const USE_COMPOSED_PROVIDER = import.meta.env.VITE_USE_COMPOSED_PROVIDER === "true";
```

### 4-Stage Initialization Pattern

The composed provider requires careful initialization to break circular dependencies:

```typescript
// src/atomic-crm/providers/supabase/index.ts:58-78

function createExtendedDataProvider(): DataProvider {
  // Stage 1: Create base provider (CRUD only, no custom methods)
  const baseProvider = supabaseDataProvider({
    instanceUrl: import.meta.env.VITE_SUPABASE_URL,
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseClient: supabase,
  });

  // Stage 2: Initialize services (breaks circular dependency)
  // Services receive base provider, NOT the final composed provider
  const services = createServiceContainer(baseProvider);

  // Stage 3: Create composed provider with handler routing
  // Each handler wraps base provider with lifecycle callbacks
  const composedProvider = createComposedDataProvider(baseProvider);

  // Stage 4: Extend with custom methods (salesCreate, archiveOpportunity, etc.)
  return extendWithCustomMethods({
    composedProvider,
    services,
    supabaseClient: supabase,
  });
}
```

### Toggle Logic

```typescript
// src/atomic-crm/providers/supabase/index.ts:86-97

export const dataProvider: DataProvider = (() => {
  if (USE_COMPOSED_PROVIDER) {
    devLog(
      "DataProvider",
      "🚀 Using COMPOSED provider architecture (handler-based with extensions)"
    );
    return createExtendedDataProvider();
  } else {
    devLog("DataProvider", "📦 Using UNIFIED provider architecture (monolithic, default)");
    return unifiedDataProvider;
  }
})();
```

### LOC Comparison

| Component | Unified | Composed | Reduction |
|-----------|---------|----------|-----------|
| **Core routing** | 1657 LOC | 206 LOC | 87% |
| **Per-resource logic** | Inline | ~30-50 LOC/handler | Isolated |
| **Validation** | Inline | 177 LOC wrapper | Reusable |
| **Error logging** | Inline | ~50 LOC wrapper | Reusable |

---

## Consequences

### Positive

- **Zero-Downtime Migration**: Switch architectures without deployment
- **Instant Rollback**: Set flag to `false` in environment, restart
- **Gradual Rollout**: Enable for dev → staging → 10% prod → 100% prod
- **A/B Testing**: Compare performance/behavior between architectures
- **Circular Dependency Solution**: 4-stage initialization cleanly separates concerns

### Negative

- **Two Code Paths**: Must maintain both unified and composed until migration complete
- **Environment Coupling**: Flag value fixed at build time (Vite limitation)
- **Test Complexity**: Tests should verify both paths work correctly

### Neutral

- **Temporary Complexity**: Flag and dual paths removed after stable migration
- **Build-Time vs Runtime**: Vite's `import.meta.env` is build-time, so per-user rollout requires separate builds

---

## Code Examples

### Correct Pattern - Checking Active Provider

```typescript
// In development, check which provider is active
console.log(import.meta.env.VITE_USE_COMPOSED_PROVIDER);
// "true" = composed, undefined/"false" = unified

// The dataProvider export is already resolved at import time
import { dataProvider } from "@/providers/supabase";
// Use normally - flag is transparent to consumers
await dataProvider.getList("contacts", { ... });
```

### Correct Pattern - Environment Configuration

```bash
# .env.development - Enable for local testing
VITE_USE_COMPOSED_PROVIDER=true

# .env.staging - Enable for QA testing
VITE_USE_COMPOSED_PROVIDER=true

# .env.production - Keep disabled until verified
VITE_USE_COMPOSED_PROVIDER=false
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Runtime flag check in components
function MyComponent() {
  // NEVER: Flag is build-time, this creates inconsistency
  const useComposed = localStorage.getItem("USE_COMPOSED_PROVIDER");
  const provider = useComposed ? composedProvider : unifiedProvider;
}
```

```typescript
// WRONG: Bypassing the export
import { unifiedDataProvider } from "@/providers/supabase/unifiedDataProvider";

// NEVER: Bypasses feature flag, breaks migration path
await unifiedDataProvider.getList("contacts", { ... });
```

---

## Migration Timeline

| Phase | Environment | Flag Value | Duration |
|-------|-------------|------------|----------|
| 1. Development | Local | `true` | 1 week |
| 2. Staging | Staging | `true` | 1 week |
| 3. Canary | 10% Production | `true` | 3 days |
| 4. Rollout | 50% Production | `true` | 3 days |
| 5. Complete | 100% Production | `true` | Permanent |
| 6. Cleanup | All | Remove flag, delete unified | After 1 week stable |

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](../tier-1-foundations/ADR-001-unified-data-provider.md)** - The monolithic provider being migrated from
- **[ADR-009: Composed Data Provider Pattern](./ADR-009-composed-data-provider.md)** - The handler architecture being migrated to
- **[ADR-002: Zod Validation at API Boundary](../tier-1-foundations/ADR-002-zod-api-boundary.md)** - Validation integrated into both architectures

---

## References

- Feature Flag Implementation: `src/atomic-crm/providers/supabase/index.ts:29-97`
- Composed Provider: `src/atomic-crm/providers/supabase/composedDataProvider.ts`
- Unified Provider: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- Service Container: `src/atomic-crm/providers/supabase/services/index.ts`
- Vite Environment Variables: https://vitejs.dev/guide/env-and-mode
