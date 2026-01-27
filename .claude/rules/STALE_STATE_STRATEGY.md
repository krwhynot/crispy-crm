# Stale State Strategy

Defines cache invalidation policies to prevent stale data bugs. Complements PROVIDER_RULES.md and DATABASE_LAYER.md.

## Query Key Factory Pattern

Location: `src/atomic-crm/queryKeys.ts`

### Hierarchical Keys

Every resource uses a factory pattern with hierarchical keys:

```typescript
const createKeys = <T extends string>(resource: T) => ({
  all: [resource] as const,              // Invalidate everything
  lists: () => [resource, "list"] as const,  // All list queries
  list: (filters?) => [resource, "list", filters],  // Specific filtered list
  details: () => [resource, "detail"] as const,     // All detail queries
  detail: (id) => [resource, "detail", id],         // Specific record
});
```

DO:
- `queryClient.invalidateQueries({ queryKey: contactKeys.lists() })` - Invalidate all contact lists
- `queryClient.invalidateQueries({ queryKey: contactKeys.detail(123) })` - Invalidate specific contact

DON'T:
- `queryClient.invalidateQueries()` - Invalidates EVERYTHING (nuclear option)
- `queryClient.invalidateQueries({ queryKey: ['contacts'] })` - Hardcoded strings drift

## Invalidation Rules

### After Mutations

| Operation | Invalidate | Reason |
|-----------|------------|--------|
| Create | `resource.lists()` | New item appears in lists |
| Update | `resource.detail(id)`, `resource.lists()` | Item changed + list aggregates may change |
| Delete | `resource.all` | Item removed, counts change, related data may be affected |

### Cross-Resource Dependencies

When one resource changes, related resources may show stale data:

| Primary Change | Also Invalidate | Reason |
|----------------|-----------------|--------|
| Organization update | `contactKeys.lists()` | Org name shown in contact lists |
| Contact reassign | `organizationKeys.detail(oldId)`, `organizationKeys.detail(newId)` | Contact counts change |
| Opportunity stage change | `dashboardKeys.all` | Pipeline metrics change |
| Task complete | `opportunityKeys.detail(oppId)`, `taskKeys.lists()` | Task counts, next task info |
| Activity create | `activityLogKeys.byOrganization(orgId)` | Activity timeline |

### Junction Table Invalidation

Junction tables require invalidating BOTH sides:

```typescript
// After linking contact to organization
queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
queryClient.invalidateQueries({ queryKey: organizationKeys.detail(orgId) });
```

## Stale Time Defaults

From `src/atomic-crm/constants/appConstants.ts`:

| Constant | Value | Use Case |
|----------|-------|----------|
| `DEFAULT_STALE_TIME_MS` | 5 minutes (300,000ms) | Standard data (contacts, orgs) |
| `SHORT_STALE_TIME_MS` | 30 seconds (30,000ms) | Frequently changing (task counts, hierarchy) |
| `DEFAULT_GC_TIME_MS` | 15 minutes | Garbage collection window |

### When to Use Short Stale Time

Use `SHORT_STALE_TIME_MS` for:
- Dashboard widget data (counts, metrics)
- Organization hierarchy (parent/child relationships)
- Task counts and next task info
- Notification counts

## Refetch Patterns

DO:
- `refetchOnMount: 'always'` - For dashboard data that must be fresh
- `staleTime: SHORT_STALE_TIME_MS` - For volatile data
- Manual `queryClient.invalidateQueries()` after mutations

DON'T:
- `refetchOnWindowFocus: true` on high-frequency data - Causes API storms
- `refetchInterval` except for notifications - Unnecessary polling
- Manual `queryClient.setQueryData()` - Bypasses validation, causes desync

## Anti-Patterns (BANNED)

### Nuclear Invalidation

WRONG:
```typescript
// Invalidates EVERYTHING - causes full page refetch
queryClient.invalidateQueries();
```

RIGHT:
```typescript
// Targeted invalidation
queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
```

### Hardcoded Keys

WRONG:
```typescript
// String can drift from actual key
queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] });
```

RIGHT:
```typescript
// Uses factory - always matches fetch key
queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
```

### Direct Cache Manipulation

WRONG:
```typescript
// Bypasses validation, can cause type mismatches
queryClient.setQueryData(contactKeys.detail(123), newData);
```

RIGHT:
```typescript
// Let React Query handle the refetch
queryClient.invalidateQueries({ queryKey: contactKeys.detail(123) });
```

### Aggressive Window Focus Refetch

WRONG:
```typescript
useQuery({
  queryKey: dashboardKeys.stats(),
  refetchOnWindowFocus: true,  // Fires every tab switch!
});
```

RIGHT:
```typescript
useQuery({
  queryKey: dashboardKeys.stats(),
  staleTime: SHORT_STALE_TIME_MS,  // Refetch only when stale
  refetchOnWindowFocus: false,
});
```

## Checklist

- [ ] Mutation handlers call `queryClient.invalidateQueries()` with proper keys
- [ ] Cross-resource dependencies invalidated (see table above)
- [ ] Using `queryKeys` factory, not hardcoded strings
- [ ] Dashboard/volatile data uses `SHORT_STALE_TIME_MS`
- [ ] No `refetchOnWindowFocus: true` on frequently changing data
- [ ] No `queryClient.setQueryData()` (except optimistic updates with rollback)
- [ ] Junction table changes invalidate both related resources
