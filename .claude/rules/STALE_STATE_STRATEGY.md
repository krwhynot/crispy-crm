---
globs: ["src/**/*.ts", "src/**/*.tsx"]
---

# Stale State Strategy Overlay

Scope: query key design, targeted invalidation, stale-time policy, and anti-pattern prevention.

## Applies

- `CORE-020`

## Stale-State Rules

- [STALE-001] Use query-key factories with hierarchical keys (`all`, `lists`, `list(filters)`, `details`, `detail(id)`).
- [STALE-002] Mutation invalidation must be operation-aware: create invalidates lists, update invalidates detail+lists, delete invalidates resource-wide scopes.
- [STALE-003] Invalidate dependent resources when cross-resource projections can go stale.
- [STALE-004] Junction-table mutations invalidate both linked resource sides.
- [STALE-005] Use shared stale-time constants from app constants instead of magic numbers.
- [STALE-006] Volatile dashboard/task/hierarchy data uses short stale windows.
- [STALE-007] `refetchOnWindowFocus: true` requires explicit `staleTime` to prevent tab-switch storms.
- [STALE-008] `queryClient.invalidateQueries()` without a query key is banned.
- [STALE-009] Hardcoded query-key arrays are banned; use key factory helpers.
- [STALE-010] Avoid direct `setQueryData` except controlled optimistic-update flows with rollback.

## Canonical Risk Stub (Nuclear Invalidation)

```ts
// banned
queryClient.invalidateQueries();

// required
queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
```

## Checklist IDs

- `STALE-001`
- `STALE-002`
- `STALE-003`
- `STALE-004`
- `STALE-005`
- `STALE-006`
- `STALE-007`
- `STALE-008`
- `STALE-009`
- `STALE-010`
