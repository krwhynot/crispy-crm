# ADR-0002: Use React Query (TanStack Query) for Server State Management

**Date:** 2025-11-02
**Status:** Accepted
**Deciders:** Product Design & Engineering Team

---

## Context

Crispy-CRM frontend needs to fetch, cache, and synchronize server state with the Supabase backend:

**Data fetching requirements:**
- Fetch CRM entities (organizations, contacts, opportunities, activities, products, users)
- Filter, sort, and paginate large datasets (1000+ organizations, 10,000+ opportunities)
- Real-time data consistency (multiple users editing same entity)
- Optimistic updates (update UI before server confirmation for responsive UX)
- Background refetching (keep data fresh without user-triggered refreshes)
- Cache management (reduce redundant API calls, improve performance)

**UI patterns from PRD:**
- **List views** with filtering, sorting, searching (Section 3.2, 3.3, 3.4)
- **Detail views** with multiple tabs (Opportunities tab, Contacts tab, Activity Feed)
- **Kanban board** with drag-and-drop stage updates (Section 3.4.2)
- **Dashboards** with real-time metrics and charts (Section 3.8)
- **Quick actions** (inline edit, quick create modals) requiring optimistic updates

**Technical constraints:**
- React 18+ with TypeScript (Section 5.1)
- Supabase backend (ADR-0001) with REST APIs via PostgREST
- Performance target: <500ms interaction response time (Section 1)
- Caching strategy needed to minimize Supabase API calls (free tier: 2GB bandwidth/month)

**Problem:**
Managing server state in React is complex without a dedicated library:
- Manual cache invalidation (when to refetch after mutations?)
- Loading/error states for every request (boilerplate)
- Race conditions (user triggers multiple requests, results arrive out-of-order)
- Stale data (user sees outdated list while detail view is fresh)
- Duplicate requests (same data fetched by multiple components)

## Decision

**Use TanStack Query (React Query) v5 for all server state management in Crispy-CRM.**

React Query will handle data fetching, caching, synchronization, and background updates for all Supabase API interactions.

## Options Considered

### Option 1: TanStack Query (React Query) v5
**Pros:**
- **Automatic caching** with intelligent cache invalidation (no manual cache management)
- **Background refetching** keeps data fresh (stale-while-revalidate pattern)
- **Optimistic updates** built-in (update UI immediately, rollback on error)
- **Pagination support** with `useInfiniteQuery` (load more pattern for activity feeds)
- **Parallel queries** optimization (deduplicate identical requests)
- **TypeScript-first** with excellent type inference (query keys typed)
- **DevTools** for debugging cache state (React Query DevTools)
- **Offline support** (retry failed requests, queue mutations)
- **4M+ weekly downloads** (mature, battle-tested)
- **Framework-agnostic** (not tied to React, future-proof if switching to Vue/Svelte)
- **Suspense support** (React 18 concurrent features)
- **Request waterfalls prevention** via prefetching

**Cons:**
- **Bundle size** (~15KB gzipped, slightly larger than SWR's ~4KB)
- **Learning curve** (query keys, cache invalidation patterns, stale time concepts)
- **Over-engineering for simple apps** (CRM is complex, so not a concern here)
- **Multiple cache strategies** can be confusing initially (staleTime vs cacheTime)

### Option 2: SWR (Stale-While-Revalidate)
**Pros:**
- **Smaller bundle** (~4KB gzipped vs React Query's ~15KB)
- **Simpler API** (fewer configuration options, easier to learn)
- **Built-in pagination** via `useSWRInfinite`
- **Optimistic updates** supported via `mutate` function
- **Created by Vercel** (integrates well with Next.js, though not using Next.js)
- **Good TypeScript support**

**Cons:**
- **Less flexible caching** - no separate `staleTime` and `cacheTime` controls
- **No built-in optimistic mutations** helper - manual implementation required
- **Less mature DevTools** compared to React Query DevTools
- **Smaller ecosystem** (fewer plugins, extensions, community examples)
- **No query cancellation** built-in (important for search-as-you-type)
- **Pagination less robust** than React Query's `useInfiniteQuery`
- **Prefetching patterns** less developed (manual cache population)
- **Not designed for complex CRM use cases** (better for simpler data fetching)

### Option 3: Apollo Client (if using GraphQL)
**Pros:**
- **Industry standard** for GraphQL
- **Normalized cache** (automatic cache updates on mutations)
- **Optimistic updates** built-in
- **Subscriptions support** for real-time data

**Cons:**
- **Requires GraphQL** - Supabase provides REST APIs via PostgREST (ADR-0001)
- **Overkill** without GraphQL - Apollo's benefits are GraphQL-specific
- **Larger bundle** (~30KB+ gzipped)
- **Steep learning curve** (GraphQL queries, fragments, cache normalization)
- **Not applicable** - PRD Section 5.2 shows RESTful endpoints, not GraphQL

### Option 4: Redux Toolkit Query (RTK Query)
**Pros:**
- **Integrates with Redux** if already using Redux for client state
- **Code generation** from OpenAPI spec
- **Optimistic updates** supported
- **Caching and invalidation** built-in

**Cons:**
- **Requires Redux** - adds dependency even if only using for data fetching
- **Boilerplate** - need to set up Redux store, slices, etc.
- **Less flexible** than React Query for non-Redux use cases
- **Team not using Redux** - PRD Section 5.1 specifies Zustand (ADR-0003)
- **Overkill** for data fetching alone (RTK Query best when already using Redux)

### Option 5: Fetch API with custom hooks (No library)
**Pros:**
- **No dependency** - smallest bundle size
- **Full control** over caching, fetching logic

**Cons:**
- **Significant development time** (2-3 weeks to build cache layer, error handling, optimistic updates)
- **Bug-prone** - reinventing solved problems (race conditions, cache invalidation, stale data)
- **Maintenance burden** - team responsible for fixing cache bugs, handling edge cases
- **Missing features** - no DevTools, no automatic refetching, no deduplication
- **Not worth the effort** - React Query solves these problems well

## Consequences

### Positive Consequences

**Developer Experience:**
- **80% reduction in data fetching boilerplate** - no manual loading/error states, no manual cache management
- **DevTools visibility** - React Query DevTools shows all queries, cache state, refetch behavior (helps debugging)
- **TypeScript safety** - query keys typed, data types inferred from fetch functions
- **Consistent patterns** - all data fetching follows same `useQuery`/`useMutation` pattern

**Performance:**
- **Automatic request deduplication** - if 3 components request same data simultaneously, only 1 API call made
- **Background refetching** - data stays fresh without blocking UI (stale-while-revalidate)
- **Prefetching** - preload data before user navigates (e.g., hover over opportunity, prefetch detail)
- **Pagination optimization** - `useInfiniteQuery` loads pages on-demand, caches all pages

**User Experience:**
- **Faster interactions** - optimistic updates make UI feel instant (<100ms perceived latency)
- **Always fresh data** - background refetching ensures users see latest data without manual refresh
- **Offline resilience** - failed mutations automatically retry when connection restored
- **Smooth loading states** - React Query manages loading/success/error states automatically

**Specific CRM use cases:**
- **Opportunity Kanban board** - optimistic drag-and-drop updates, rollback if server rejects
- **Activity feed** - infinite scroll pagination with `useInfiniteQuery`
- **Dashboard metrics** - automatic refetch every 30 seconds without blocking UI
- **Search-as-you-type** - automatic query cancellation prevents race conditions

### Negative Consequences

**Bundle Size:**
- **+15KB gzipped** to bundle (SWR is ~4KB, but 11KB difference is acceptable for CRM complexity)
- **Mitigation:** 15KB is negligible for CRM app (total bundle <500KB after code splitting)

**Learning Curve:**
- **Query key management** - team must learn query key patterns, cache invalidation strategies
- **Stale time vs cache time** - understanding difference takes time
- **Optimistic update patterns** - requires practice to implement correctly
- **Mitigation:** Excellent documentation, common patterns documented in codebase, React Query DevTools help learning

**Initial Setup:**
- **QueryClient configuration** required (stale time, cache time, retry logic)
- **Query key conventions** must be established (e.g., `['organizations', { filters }]`)
- **Mitigation:** Set up once in Phase 1, reuse patterns across all modules

### Neutral Consequences

- **Suspense support** available but not required for MVP (can adopt in Phase 2+)
- **Mutations batching** available but not needed initially
- **Persistent cache** (localStorage) available but not required for MVP

## Implementation Notes

**Installation:**
```bash
npm install @tanstack/react-query@latest
npm install @tanstack/react-query-devtools@latest --save-dev
```

**Setup (Phase 1):**
```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevTools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Query Key Conventions:**
```typescript
// Good: Hierarchical query keys with filters
['organizations'] // All organizations
['organizations', organizationId] // Single organization
['organizations', organizationId, 'opportunities'] // Org's opportunities
['opportunities', { status: 'Open', stage: 'Lead-discovery' }] // Filtered opportunities

// Bad: Flat query keys without filters
['getOrganizations'] // Can't invalidate filtered queries
['organization_123'] // String keys harder to type, harder to invalidate hierarchically
```

**Example: Fetch organizations with filters**
```typescript
// src/hooks/useOrganizations.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface OrganizationFilters {
  priority?: string[];
  segment?: string[];
  accountManagerId?: string;
}

export function useOrganizations(filters?: OrganizationFilters) {
  return useQuery({
    queryKey: ['organizations', filters],
    queryFn: async () => {
      let query = supabase.from('organizations').select('*');

      if (filters?.priority) {
        query = query.in('priority_level', filters.priority);
      }
      if (filters?.segment) {
        query = query.in('segment', filters.segment);
      }
      if (filters?.accountManagerId) {
        query = query.eq('primary_account_manager_id', filters.accountManagerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}
```

**Example: Optimistic mutation**
```typescript
// src/hooks/useUpdateOpportunityStage.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUpdateOpportunityStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ opportunityId, newStage }: { opportunityId: string; newStage: string }) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update({ stage_id: newStage })
        .eq('opportunity_id', opportunityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ opportunityId, newStage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });

      // Snapshot previous value
      const previousOpportunities = queryClient.getQueryData(['opportunities']);

      // Optimistically update cache
      queryClient.setQueryData(['opportunities'], (old: any) =>
        old?.map((opp: any) =>
          opp.opportunity_id === opportunityId ? { ...opp, stage_id: newStage } : opp
        )
      );

      return { previousOpportunities };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['opportunities'], context?.previousOpportunities);
    },
    onSettled: () => {
      // Refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}
```

**Prefetching pattern:**
```typescript
// Prefetch opportunity details on hover
const queryClient = useQueryClient();

<OpportunityRow
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['opportunities', opportunityId],
      queryFn: () => fetchOpportunityById(opportunityId),
    });
  }}
/>
```

## References

- **PRD Section 5.1:** Data Fetching - "TanStack Query (React Query) for server state management"
- **PRD Section 3:** Core Features - Filtering, sorting, pagination requirements
- **TanStack Query Documentation:** https://tanstack.com/query/latest
- **React Query Best Practices:** https://tkdodo.eu/blog/practical-react-query
- **Optimistic Updates Guide:** https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- **Related ADR:** ADR-0001 (Supabase Backend - API patterns)
- **Related ADR:** ADR-0003 (Zustand for Client State - complementary to React Query)

---

## Supersedes

None (initial decision)

## Superseded By

None (current)
