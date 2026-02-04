---
name: cache-invalidation-audit
description: Automated enforcement of STALE_STATE_STRATEGY.md rules and query key factory patterns. Detects hardcoded keys, unsafe refetchOnWindowFocus, missing cross-resource invalidation, over-invalidation, and N+1 queries in React Admin lists. Triggers on - audit cache, stale state, query keys, invalidation, refetch patterns, cache strategy, TanStack Query, React Query compliance.
---

# Cache Invalidation Audit

## Purpose

Enforce `STALE_STATE_STRATEGY.md` patterns across your React/TanStack Query codebase to prevent stale data bugs and API storms.

**Core Mandate:** VALIDATE ALL QUERY KEY USAGE AND INVALIDATION PATTERNS

## When to Use

Automatically activates when you mention:
- Audit terms: audit cache, stale state, cache strategy compliance
- Technical terms: query keys, invalidation, refetch patterns, staleTime, refetchOnWindowFocus
- Symptoms: stale data, cache not updating, unnecessary refetches, API storm
- Resources: organizations, contacts, opportunities (entity-specific audits)

## The Five Audit Checks

### Check 1: Query Key Factory Adherence

**Rule:** All query keys MUST use factory functions from `src/atomic-crm/queryKeys.ts`, not hardcoded strings.

**Detection Pattern:**

```typescript
// ❌ VIOLATION: Hardcoded string keys
useQuery({
  queryKey: ['organizations', 'list'],  // Will drift from factory
  queryFn: fetchOrgs
})

// Later in another file:
queryClient.invalidateQueries(['organisations'])  // Typo! Won't match

// ✅ COMPLIANT: Factory-driven
import { organizationKeys } from '@/atomic-crm/queryKeys'

useQuery({
  queryKey: organizationKeys.list(filters),
  queryFn: () => fetchOrgs(filters)
})

queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
```

**What to Check:**
- Search for string literals `['organizations']`, `['contacts']` in useQuery/useMutation
- Verify factory imports present when entity keys used
- Flag if same entity key appears in 3+ files without factory
- Check key structure consistency across files

**Output Format:**

```
Query Key Factory Violations (8 files)

src/atomic-crm/organizations/OrganizationList.tsx:42
  ❌ Hardcoded: ['organizations', 'list']
  ✅ Replace with: organizationKeys.list(filters)

src/atomic-crm/organizations/mutations.ts:18
  ❌ Hardcoded: ['organizations']
  ✅ Replace with: organizationKeys.all

Impact: 8 locations at risk of key mismatch
```

---

### Check 2: Unsafe Window Focus Refetch

**Rule:** `refetchOnWindowFocus: true` MUST have explicit `staleTime` to prevent API storms.

**Detection Pattern:**

```typescript
// ❌ VIOLATION: Refetches on EVERY tab switch (staleTime defaults to 0)
useQuery({
  queryKey: orgKeys.list(),
  queryFn: fetchOrgs,
  refetchOnWindowFocus: true  // No staleTime guard!
})

// ✅ COMPLIANT: Rate-limited with staleTime
useQuery({
  queryKey: orgKeys.list(),
  queryFn: fetchOrgs,
  refetchOnWindowFocus: true,
  staleTime: 5 * 60 * 1000  // Only refetch if older than 5 min
})

// ✅ ALSO COMPLIANT: Explicitly disabled
useQuery({
  queryKey: orgKeys.list(),
  queryFn: fetchOrgs,
  refetchOnWindowFocus: false
})
```

**What to Check:**
- Parse all `useQuery` / `useInfiniteQuery` options objects
- Flag if `refetchOnWindowFocus: true` present WITHOUT `staleTime`
- Check for global `staleTime` in QueryClient defaultOptions
- Verify staleTime values match resource volatility

**Recommended staleTime by Resource Type:**
- Static reference data (products, tags): `Infinity` or `30 * 60 * 1000` (30 min)
- User profiles, settings: `10 * 60 * 1000` (10 min)
- Standard entities (orgs, contacts): `5 * 60 * 1000` (5 min, DEFAULT_STALE_TIME_MS)
- Dashboard metrics, task counts: `30 * 1000` (30 sec, SHORT_STALE_TIME_MS)

**Output Format:**

```
Unsafe Window Focus Patterns (3 files)

src/features/Dashboard/StatsWidget.tsx:28
  ❌ refetchOnWindowFocus: true with NO staleTime
  ⚠️  Risk: API storm on every tab switch
  ✅ Add: staleTime: 30 * 1000  // Stats change frequently, use SHORT

src/features/Organizations/OrganizationList.tsx:156
  ❌ refetchOnWindowFocus: true with NO staleTime
  ⚠️  Risk: Unnecessary API calls for stable data
  ✅ Add: staleTime: 5 * 60 * 1000  // Standard entity, use DEFAULT
```

---

### Check 3: Missing Cross-Resource Invalidation

**Rule:** Mutations must invalidate ALL dependent resources, not just the primary entity.

**Detection Pattern:**

```typescript
// ❌ INCOMPLETE: Only invalidates org detail
useMutation({
  mutationFn: updateOrganization,
  onSuccess: (updated) => {
    queryClient.setQueryData(orgKeys.detail(updated.id), updated)
    // MISSING: organizations_summary view depends on org data
    // MISSING: Contact lists show org name (must invalidate)
  }
})

// ✅ COMPLETE: Invalidates all dependent queries
useMutation({
  mutationFn: updateOrganization,
  onSuccess: (updated) => {
    // Update detail cache optimistically
    queryClient.setQueryData(orgKeys.detail(updated.id), updated)

    // Invalidate all org lists (might appear in multiple filtered views)
    queryClient.invalidateQueries({ queryKey: orgKeys.lists() })

    // Invalidate derived summary view
    queryClient.invalidateQueries({ queryKey: summaryKeys.organization(updated.id) })

    // Invalidate contact lists that display org name
    queryClient.invalidateQueries({ queryKey: contactKeys.byOrganization(updated.id) })
  }
})
```

**Cross-Resource Dependency Matrix:**

| Primary Change | Also Invalidate | Reason |
|----------------|-----------------|--------|
| Organization update | `contactKeys.lists()` | Org name shown in contact lists |
| Contact reassign | `organizationKeys.detail(oldId)`, `organizationKeys.detail(newId)` | Contact counts change |
| Opportunity stage change | `dashboardKeys.all` | Pipeline metrics change |
| Task complete | `opportunityKeys.detail(oppId)`, `taskKeys.lists()` | Task counts, next task info |
| Activity create | `activityLogKeys.byResource()` | Activity timeline updates |

**What to Check:**
- Map all mutations by entity type
- For each mutation, verify invalidates:
  - Base entity keys (detail, lists)
  - Derived view keys (summary, stats)
  - Parent/child relationships (junction tables)
- Cross-reference with database schema (views, foreign keys)

**Output Format:**

```
Missing Cross-Invalidation (2 mutations)

src/atomic-crm/organizations/mutations.ts:updateOrganization
  Current: Only invalidates orgKeys.detail()
  Missing Dependencies:
    → summaryKeys.organization(id)      // organizations_summary view
    → contactKeys.byOrganization(id)    // Contact lists display org name

  Suggested Fix:
    queryClient.invalidateQueries({ queryKey: summaryKeys.organization(updated.id) })
    queryClient.invalidateQueries({ queryKey: contactKeys.byOrganization(updated.id) })
```

---

### Check 4: Over-Invalidation Anti-Pattern

**Rule:** Use surgical invalidation, not nuclear "invalidate everything" patterns.

**Detection Pattern:**

```typescript
// ❌ NUCLEAR: Invalidates ALL queries in the app
useMutation({
  mutationFn: updateContact,
  onSuccess: () => {
    queryClient.invalidateQueries()  // Refetches orgs, users, settings, EVERYTHING!
  }
})

// ❌ TOO BROAD: Invalidates all contact queries globally
useMutation({
  mutationFn: updateContact,
  onSuccess: (updated) => {
    queryClient.invalidateQueries({ queryKey: contactKeys.all })
    // Refetches contact lists for ALL orgs, not just affected one
  }
})

// ✅ SURGICAL: Only affected queries
useMutation({
  mutationFn: updateContact,
  onSuccess: (updated) => {
    // Update specific detail optimistically
    queryClient.setQueryData(contactKeys.detail(updated.id), updated)

    // Invalidate only lists for this specific org
    queryClient.invalidateQueries({
      queryKey: contactKeys.listByOrg(updated.organization_id)
    })
  }
})
```

**What to Check:**
- Flag `invalidateQueries()` with no queryKey filter (nuclear option)
- Flag `invalidateQueries({ queryKey: [entity] })` where finer-grained keys available
- Check if mutation has access to specific IDs but doesn't use them
- Estimate refetch impact (how many queries will refetch?)

**Output Format:**

```
Over-Invalidation Patterns (2 violations)

src/atomic-crm/contacts/mutations.ts:updateContact:45
  ❌ Nuclear invalidation: invalidateQueries() with no filter
  ⚠️  Impact: ~25 queries refetch (orgs, users, dashboard, settings)
  ✅ Replace with: contactKeys.detail(id) + contactKeys.listByOrg(orgId)

src/atomic-crm/opportunities/mutations.ts:updateStage:89
  ❌ Too broad: invalidateQueries({ queryKey: opportunityKeys.all })
  ⚠️  Impact: ~12 opportunity queries refetch globally
  ✅ Replace with: opportunityKeys.detail(id) + dashboardKeys.pipeline()
```

---

### Check 5: React Admin N+1 Query Detection

**Rule:** List views must use summary views with pre-joined data, not individual `ReferenceField` queries.

**Detection Pattern:**

```typescript
// ❌ N+1: List shows 50 orgs, each fetches owner separately
const OrganizationList = () => (
  <List>
    <Datagrid>
      <TextField source="name" />
      <ReferenceField source="owner_id" reference="users">
        {/* Fires 50 separate useGetOne calls! */}
        <TextField source="email" />
      </ReferenceField>
    </Datagrid>
  </List>
)

// ✅ OPTIMIZED: Use summary view with pre-joined owner data
const OrganizationList = () => {
  const { data } = useGetList('organizations_summary', {
    // View has owner_email pre-joined via SQL
  })

  return (
    <Datagrid>
      <TextField source="name" />
      <TextField source="owner_email" label="Owner" />
    </Datagrid>
  )
}
```

**What to Check:**
- Scan RA `<List>` components for `<ReferenceField>` usage
- Identify nested `useGetOne` calls inside `.map()`
- Flag if list renders >10 records and each triggers individual query
- Cross-reference with available `*_summary` views in database

**Output Format:**

```
N+1 Query Patterns (1 component)

src/atomic-crm/organizations/OrganizationList.tsx:42
  Problem: ReferenceField to 'users' fires 50+ individual queries
  Current:
    <ReferenceField source="owner_id" reference="users">
      <TextField source="email" />
    </ReferenceField>

  Solution: Use organizations_summary view
    Migration SQL:
      CREATE VIEW organizations_summary AS
      SELECT o.*, u.email as owner_email
      FROM organizations o
      LEFT JOIN users u ON o.owner_id = u.id
      WHERE o.deleted_at IS NULL;

    Updated Component:
      <TextField source="owner_email" label="Owner" />
```

---

## Global Audit Output

### Health Score

```
Cache Strategy Health: B+ (3 critical, 8 warnings)

Critical Issues:
✗ 3 refetchOnWindowFocus without staleTime (API storm risk)
✗ 2 mutations missing cross-resource invalidation
✗ 1 N+1 query in OrganizationList

Warnings:
⚠ 8 hardcoded query keys (should use factory)
⚠ 2 over-invalidation patterns
```

### Summary by File

```
High Priority Files:
1. src/atomic-crm/organizations/OrganizationList.tsx (3 violations)
2. src/features/Dashboard/StatsWidget.tsx (2 violations)
3. src/atomic-crm/contacts/mutations.ts (2 violations)

By Violation Type:
- Query Key Factory: 8 files affected
- Unsafe Window Focus: 3 files affected
- Missing Cross-Invalidation: 2 mutations
- Over-Invalidation: 2 mutations
- N+1 Queries: 1 component
```

---

## Quick Reference Checklist

Before approving cache strategy code, verify:

- [ ] All query keys use factory imports (no hardcoded strings)
- [ ] `refetchOnWindowFocus: true` has explicit `staleTime`
- [ ] Mutation invalidations cover all dependent resources
- [ ] No `invalidateQueries()` without queryKey filter
- [ ] No `<ReferenceField>` in lists with >10 records (use summary views)
- [ ] `staleTime` values match resource volatility (30s for dashboard, 5min for entities)
- [ ] Junction table mutations invalidate both sides of relationship
- [ ] Optimistic updates use `setQueryData` + targeted invalidations

---

## Tool Integration

### Required Files

| File | Purpose |
|------|---------|
| `STALE_STATE_STRATEGY.md` | Source of truth for cache rules |
| `src/atomic-crm/queryKeys.ts` | Query key factory definitions |
| `src/atomic-crm/constants/appConstants.ts` | `DEFAULT_STALE_TIME_MS`, `SHORT_STALE_TIME_MS` |

### Recommended Commands

```bash
# Find all useQuery calls
rg "useQuery|useInfiniteQuery" src/ --type tsx -A 5

# Find all mutation invalidations
rg "invalidateQueries" src/ --type tsx -B 2 -A 2

# Find ReferenceField usage
rg "ReferenceField" src/atomic-crm --type tsx

# Count hardcoded query keys
rg "\['organizations'|'contacts'|'opportunities'\]" src/ --type tsx | wc -l
```

---

## Enforcement Mode

**Severity Levels:**

| Violation | Severity | Block Merge? | Rationale |
|-----------|----------|--------------|-----------|
| refetchOnWindowFocus without staleTime | CRITICAL | Yes | Causes API storms in production |
| Nuclear invalidation | CRITICAL | Yes | Performance regression |
| Missing cross-invalidation | HIGH | Suggest | Causes stale data bugs |
| Hardcoded query keys | MEDIUM | No | Maintainability issue, not runtime |
| N+1 queries | HIGH | Yes | Severe performance degradation |

---

**Remember:** Cache invalidation is one of the two hard problems in computer science. Audit rigorously to prevent stale state bugs.
