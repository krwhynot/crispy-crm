# ADR-027: Query Key Factory for Custom Hooks

## Status

**Accepted**

## Date

Original: 2024-12 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

React Admin internally uses TanStack Query (React Query) for data fetching and caching. It auto-generates query keys following this pattern:

```typescript
// React Admin internal key structure:
[resource, 'getList', { pagination, sort, filter, meta }]
[resource, 'getOne', { id, meta }]
[resource, 'getMany', { ids, meta }]
```

However, Crispy CRM has several use cases that bypass React Admin's data layer:

1. **Dashboard Aggregations**: Custom RPC queries that aggregate data across multiple tables (e.g., `get_principal_pipeline_stats`)

2. **Edge Function Calls**: Direct calls to Supabase Edge Functions for team activity feeds, digest preferences

3. **Custom Reports**: Queries with non-standard shapes that don't fit React Admin's CRUD model

4. **Cross-Resource Queries**: Queries that join data in ways that don't map to a single "resource"

These custom hooks need their own query keys for:
- Proper cache management
- Surgical invalidation when mutations occur
- Avoiding collisions with React Admin's internal keys

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Use React Admin's keys** | Consistent with RA internals | Collisions, wrong cache behavior |
| **Ad-hoc string keys** | Simple | Inconsistent, no type safety, hard to invalidate |
| **Hierarchical factory pattern** | Type-safe, surgical invalidation | Additional abstraction to learn |
| **Query key library (e.g., @lukemorales/query-key-factory)** | Battle-tested | External dependency |

---

## Decision

**Create a hierarchical query key factory** (`queryKeys`) for all custom hooks that bypass React Admin's data layer.

### Key Design Principles

1. **Hierarchical Structure**: Keys are arrays that become more specific from left to right
2. **Factory Functions**: Generate keys programmatically with parameters
3. **Type Safety**: `as const` assertions provide literal types for autocompletion
4. **Surgical Invalidation**: Invalidate at any level of specificity

### Implementation

```typescript
// src/lib/queryKeys.ts:27-116

export const queryKeys = {
  // Activities
  activities: {
    all: ["activities"] as const,
    lists: () => [...queryKeys.activities.all, "list"] as const,
    list: (filters?: FilterValue) => [...queryKeys.activities.lists(), { filters }] as const,
    details: () => [...queryKeys.activities.all, "detail"] as const,
    detail: (id: number | string) => [...queryKeys.activities.details(), id] as const,
    log: (organizationId?: number | string) =>
      [...queryKeys.activities.all, "log", organizationId] as const,
  },

  // Dashboard / Aggregates
  dashboard: {
    all: ["dashboard"] as const,
    principalPipeline: (filters?: FilterValue) =>
      [...queryKeys.dashboard.all, "principalPipeline", { filters }] as const,
    teamActivities: (limit?: number) =>
      [...queryKeys.dashboard.all, "teamActivities", limit] as const,
  },

  // ... other resources follow same pattern
} as const;
```

### Hierarchical Key Structure

```
queryKeys.activities.all          → ["activities"]
queryKeys.activities.lists()      → ["activities", "list"]
queryKeys.activities.list({...})  → ["activities", "list", { filters }]
queryKeys.activities.detail(5)    → ["activities", "detail", 5]

Invalidation levels:
├── invalidate(["activities"])           ← All activity queries
├── invalidate(["activities", "list"])   ← All activity lists
└── invalidate(["activities", "detail"]) ← All activity details
```

### React Admin Key Comparison

```typescript
// React Admin INTERNAL keys (DO NOT use queryKeys for these):
["contacts", "getList", { pagination: {...}, sort: {...}, filter: {...} }]

// Custom hook keys (USE queryKeys for these):
queryKeys.dashboard.principalPipeline({ principalId: 5 })
// → ["dashboard", "principalPipeline", { filters: { principalId: 5 } }]
```

---

## Consequences

### Positive

- **Type-Safe Keys**: TypeScript catches typos and provides autocompletion
- **Surgical Invalidation**: Invalidate exactly what needs updating
- **No Collisions**: Custom keys don't interfere with React Admin's internal caching
- **Consistent Pattern**: All custom hooks follow the same key structure
- **Hierarchy Enables Bulk Invalidation**: `queryKeys.dashboard.all` clears all dashboard queries

### Negative

- **Learning Curve**: Developers must understand when to use queryKeys vs React Admin hooks
- **Manual Sync**: If a mutation affects both RA resources and custom queries, must invalidate both

### Neutral

- **Parallel Key Systems**: React Admin and custom hooks have separate key namespaces
- **Factory Pattern Overhead**: Function calls vs static arrays (negligible performance impact)

---

## Code Examples

### Correct Pattern - Custom Dashboard Hook

```typescript
// src/hooks/usePrincipalPipeline.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/providers/supabase/supabase";

export function usePrincipalPipeline(principalId: number) {
  return useQuery({
    queryKey: queryKeys.dashboard.principalPipeline({ principalId }),
    queryFn: () => supabase.rpc("get_principal_pipeline_stats", { principal_id: principalId }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Correct Pattern - Edge Function Hook

```typescript
// src/hooks/useTeamActivities.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/providers/supabase/supabase";

export function useTeamActivities(limit = 10) {
  return useQuery({
    queryKey: queryKeys.dashboard.teamActivities(limit),
    queryFn: () => supabase.functions.invoke("get-team-activity-feed", {
      body: { limit }
    }),
  });
}
```

### Correct Pattern - Mutation with Invalidation

```typescript
// src/hooks/useCompleteTask.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => completeTaskRpc(taskId),
    onSuccess: () => {
      // Invalidate custom task queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      // Also invalidate React Admin's internal cache for tasks resource
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Using queryKeys with React Admin hooks
import { useGetList } from "react-admin";
import { queryKeys } from "@/lib/queryKeys";

function ContactList() {
  // NEVER: useGetList auto-generates its own keys
  const { data } = useGetList("contacts", {
    meta: { queryKey: queryKeys.contacts.list() }  // WRONG
  });
}
```

```typescript
// WRONG: Ad-hoc string keys
const { data } = useQuery({
  queryKey: ["dashboard-pipeline-stats"],  // NEVER: Not type-safe, can't bulk invalidate
  queryFn: fetchStats,
});
```

```typescript
// WRONG: Duplicating React Admin's key structure
export const queryKeys = {
  contacts: {
    // NEVER: Collides with React Admin internal keys
    getList: (params) => ["contacts", "getList", params],
  }
};
```

---

## Use Case Matrix

| Scenario | Use queryKeys? | Why |
|----------|----------------|-----|
| useGetList, useGetOne, useUpdate | **NO** | React Admin auto-generates keys |
| Dashboard RPC aggregations | **YES** | Custom shape, not a "resource" |
| Edge Function calls | **YES** | Bypasses data provider entirely |
| Activity log (getManyReference) | **NO** | Standard RA hook works |
| Custom report with joins | **YES** | Non-standard query shape |
| useInfiniteQuery for pagination | **YES** | React Admin doesn't support this |

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](../tier-1-foundations/ADR-001-unified-data-provider.md)** - The data layer that React Admin hooks use
- **[ADR-009: Composed Data Provider Pattern](./ADR-009-composed-data-provider.md)** - How CRUD operations are routed

---

## References

- Query Key Factory: `src/lib/queryKeys.ts`
- TanStack Query Keys Guide: https://tkdodo.eu/blog/effective-react-query-keys
- Query Key Factory Pattern: https://github.com/lukemorales/query-key-factory
- React Admin Query Integration: https://marmelab.com/react-admin/useQuery.html
