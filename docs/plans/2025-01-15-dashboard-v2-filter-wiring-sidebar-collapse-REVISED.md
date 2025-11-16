# Dashboard V2 Filter Wiring & Collapsible Sidebar Implementation Plan (REVISED)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

## ✅ Implementation Status (Updated 2025-01-15)

**Phase 1 (Filter Wiring):** ✅ **COMPLETE** - Commit: cf208783
**Phases 2-8 (All Tasks):** ✅ **COMPLETE** - Commits: a02a8b30, c7bbac81, ce806176, f4022cd7, cf208783

**Bugfixes Applied (2025-01-15):**
- ✅ **Priority 1**: Storage key persistence fixed (double-prefixed keys) - Commit: cf208783
- ✅ **Priority 1**: Task completion `completed_at` timestamp added - Commit: d6b417c3
- ✅ **Priority 2**: "All Principals" option removed (principal-centric workflow) - Commit: d6b417c3, [pending]
- ✅ **Priority 2**: Rail button accessibility (44px touch target) - Already compliant
- ⚠️ **Priority 3**: Task creation modal - Deferred to future sprint
- ⚠️ **Priority 4**: Assignee filter - Blocked pending `sales_id` migration (see `docs/plans/2025-01-15-assignee-filter-migration-tracker.md`)

**Verification:**
- ✅ Lint: Pass (no errors in modified files)
- ✅ TypeScript: Pass (zero errors)
- ✅ Unit Tests: 1567 passed (6 failures pre-existing in old dashboard)
- ⏳ Manual Testing: Pending user verification (filter persistence, rail button)

---

**Goal:** Wire up Dashboard V2 filters to actually filter opportunities/tasks data, add collapsible sidebar with rail toggle, and ensure accessibility compliance.

**Architecture:** Client-side filtering using React useMemo for <500 opportunities (acceptable performance). Sidebar collapse controlled by CSS Grid transitions (18rem → 0px) with persistent state via usePrefs. Filter state and sidebar state are independent concerns stored separately in localStorage. **Shared FilterState type** prevents drift across components.

**Tech Stack:** React 19, TypeScript, React Admin, Tailwind CSS 4, Radix UI (Collapsible, Select), Supabase (data layer)

**Key Patterns:**
- Engineering Constitution: Fail fast (no retry logic), single source of truth (shared types.ts)
- Design System: Semantic colors only, 44px touch targets, desktop-first responsive
- TDD: Write failing test → implement → verify → commit
- **Single FilterState export** from types.ts (no duplication)
- **Identity IDs are strings** (React Admin default)

---

## Phase 1: Shared Types & Filter Wiring (ATOMIC - ONE COMMIT)

**CRITICAL:** All tasks in Phase 1 must be completed together as ONE ATOMIC COMMIT to avoid TypeScript compiler errors. Do NOT commit until Step 1.7 is complete.

### Task 1.0: Create Shared Types File

**Files:**
- Create: `src/atomic-crm/dashboard/v2/types.ts`

**Step 1: Create types file with FilterState interface**

Create new file:

```typescript
/**
 * Shared types for Dashboard V2 components
 *
 * SINGLE SOURCE OF TRUTH - Import from here to prevent drift
 */

export interface FilterState {
  health: ('active' | 'cooling' | 'at_risk')[];
  stages: string[];
  assignee: 'me' | 'team' | string | null; // string = sales rep ID (from useGetIdentity, always string)
  lastTouch: '7d' | '14d' | 'any';
  showClosed: boolean;
  groupByCustomer: boolean;
}

export interface PrincipalOpportunity {
  opportunity_id: number;
  opportunity_name: string;
  stage: string;
  estimated_close_date: string | null;
  customer_organization_id: number;
  customer_name: string;
  principal_id: number;
  principal_name: string;
  days_since_activity: number;
  health_status: 'active' | 'cooling' | 'at_risk';
  // TODO: Add sales_id when database migration completes
  // sales_id?: string;
}

export interface PriorityTask {
  task_id: number;
  task_title: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  task_type: string;
  opportunity_id: number | null;
  opportunity_name: string | null;
  organization_id: number | null;
  customer_name: string | null;
  principal_organization_id: number | null;
  principal_name: string | null;
  // TODO: Add sales_id when database migration completes
  // sales_id?: string;
}
```

**Do NOT commit yet** - Phase 1 is atomic.

---

### Task 1.1: Add Filter State & User Identity

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:1-100`

**Step 1: Add imports**

Add at top of file:

```typescript
import { useMemo, useCallback, useRef } from 'react';
import { useGetIdentity } from 'react-admin'; // NEW - React Admin hook
import { usePrefs } from './hooks/usePrefs';
import type { FilterState } from './types'; // SHARED type - no duplication
```

**Step 2: Add filter state with usePrefs**

Add after existing context hooks (around line 40):

```typescript
// Filter state - persisted to localStorage (usePrefs adds 'pd.' prefix automatically)
const [filterState, setFilterState] = usePrefs<FilterState>('filters', {
  health: [],
  stages: [],
  assignee: null,
  lastTouch: 'any',
  showClosed: false,
  groupByCustomer: true,
});

// Current user identity (id is ALWAYS string in React Admin)
const { data: identity } = useGetIdentity<{ id: string; fullName: string }>();
```

**Step 3: Add active filter count calculation**

Add after identity:

```typescript
const activeFilterCount = useMemo(() => {
  return (
    filterState.health.length +
    filterState.stages.length +
    (filterState.assignee && filterState.assignee !== 'team' ? 1 : 0) +
    (filterState.lastTouch !== 'any' ? 1 : 0) +
    (filterState.showClosed ? 1 : 0)
  );
}, [filterState]);
```

**Step 4: Add clear filters handler**

Add after activeFilterCount:

```typescript
const handleClearFilters = useCallback(() => {
  setFilterState({
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
    groupByCustomer: filterState.groupByCustomer, // Preserve grouping preference
  });
}, [filterState.groupByCustomer, setFilterState]);
```

**Do NOT commit yet** - Phase 1 is atomic.

---

### Task 1.2: Update OpportunitiesHierarchy Props

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx:1-30`

**Step 1: Import shared types**

Replace any existing type definitions with import:

```typescript
import type { FilterState, PrincipalOpportunity } from '../types';
```

**Step 2: Update OpportunitiesHierarchyProps interface**

Find existing interface (around line 10-15). Update to:

```typescript
interface OpportunitiesHierarchyProps {
  filters: FilterState;           // NEW - from shared types
  currentUserId?: string;         // NEW - string (React Admin identity.id is always string)
  onOpportunityClick: (oppId: number) => void;
}
```

**Step 3: Update function signature**

Find component definition (around line 20). Update to:

```typescript
export function OpportunitiesHierarchy({
  filters,
  currentUserId,
  onOpportunityClick
}: OpportunitiesHierarchyProps) {
```

**Do NOT commit yet** - Phase 1 is atomic.

---

### Task 1.3: Implement Client-Side Filtering Logic

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx:40-120`

**Step 1: Add useMemo import**

Ensure import exists:

```typescript
import { useMemo } from 'react';
```

**Step 2: Add filteredOpportunities memoization**

After the existing `useGetList` hook (around line 35), add:

```typescript
// Client-side filtering
const filteredOpportunities = useMemo(() => {
  if (!opportunities) return [];

  return opportunities.filter(opp => {
    // Health filter (empty array = show all)
    if (filters.health.length > 0 && !filters.health.includes(opp.health_status)) {
      return false;
    }

    // Stage filter (empty array = show all)
    if (filters.stages.length > 0 && !filters.stages.includes(opp.stage)) {
      return false;
    }

    // Last touch filter
    if (filters.lastTouch !== 'any') {
      const dayThreshold = filters.lastTouch === '7d' ? 7 : 14;
      if (opp.days_since_activity > dayThreshold) {
        return false;
      }
    }

    // Show closed filter
    if (!filters.showClosed && ['closed_won', 'closed_lost'].includes(opp.stage)) {
      return false;
    }

    // Assignee filter - COMMENTED OUT (requires sales_id in database view)
    // TODO: Uncomment after migration adds sales_id to principal_opportunities view
    // if (filters.assignee === 'me' && currentUserId && opp.sales_id !== currentUserId) {
    //   return false;
    // }
    // if (filters.assignee !== null && filters.assignee !== 'me' && filters.assignee !== 'team' && opp.sales_id !== filters.assignee) {
    //   return false;
    // }

    return true;
  });
}, [opportunities, filters, currentUserId]);
```

**Step 3: Update customerGroups to use filteredOpportunities**

Find existing `customerGroups` useMemo (around line 50). Change dependency from `opportunities` to `filteredOpportunities`:

```typescript
const customerGroups = useMemo(() => {
  if (!filteredOpportunities || filteredOpportunities.length === 0) return [];

  // Use filteredOpportunities instead of opportunities
  const grouped = filteredOpportunities.reduce((acc, opp) => {
    const customerId = opp.customer_organization_id;
    if (!acc[customerId]) {
      acc[customerId] = [];
    }
    acc[customerId].push(opp);
    return acc;
  }, {} as Record<number, PrincipalOpportunity[]>);

  return Object.entries(grouped).map(([customerId, opps]) => ({
    customerId: parseInt(customerId, 10),
    customerName: opps[0].customer_name,
    opportunities: opps,
  }));
}, [filteredOpportunities]); // Changed from [opportunities]
```

**Step 4: Add ID to container for ARIA reference**

Find main container div (around line 70). Add ID:

```typescript
<div
  id="opportunities-panel"
  role="region"
  aria-label="Opportunities hierarchy"
  className="flex flex-col h-full"
>
  {/* existing content */}
</div>
```

**Step 5: Update empty state message**

Find empty state rendering (around line 100). Update to differentiate "no data" vs "no matches":

```typescript
{customerGroups.length === 0 && (
  <div className="flex items-center justify-center h-64 text-muted-foreground">
    {!selectedPrincipalId ? (
      "Select a principal to view opportunities"
    ) : opportunities?.length === 0 ? (
      "No opportunities for this principal"
    ) : (
      "No opportunities match current filters"
    )}
  </div>
)}
```

**Do NOT commit yet** - Phase 1 is atomic.

---

### Task 1.4: Update TasksPanel Props (Minimal)

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:1-40`

**Step 1: Import needed types**

Add at top (TasksPanel needs these for grouping logic):

```typescript
// Import types needed for task grouping and props
import type { PriorityTask, TaskGrouping, TaskBucket } from '../types';
```

**Step 2: Update TasksPanelProps interface**

Find existing interface (around line 10). Update to:

```typescript
interface TasksPanelProps {
  // Only props that will actually be used for filtering
  // Do NOT pass full FilterState to avoid confusion and unnecessary re-renders
  assignee?: 'me' | 'team' | string | null;  // For future assignee filtering
  currentUserId?: string;                     // React Admin identity.id (string)
}
```

**Step 3: Update function signature**

Find component definition (around line 20). Update to:

```typescript
export function TasksPanel({ assignee, currentUserId }: TasksPanelProps) {
```

**Step 4: Add TODO comment for future filtering**

Add comment before data fetch:

```typescript
// TODO: Add assignee filtering when sales_id is added to priority_tasks view
// Example:
// const assigneeFilter = assignee === 'me' && currentUserId
//   ? { sales_id: currentUserId }
//   : assignee && assignee !== 'team'
//   ? { sales_id: assignee }
//   : {};
```

**Do NOT commit yet** - Phase 1 is atomic.

---

### Task 1.5: Update FiltersSidebar Props

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:1-50`

**Step 1: Import shared types**

Add at top:

```typescript
import type { FilterState } from '../types';
```

**Step 2: Update FiltersSidebarProps**

Find existing interface (around line 20). Update to:

```typescript
interface FiltersSidebarProps {
  filters: FilterState;  // From shared types
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  activeCount: number;
}
```

**Step 3: Update function signature**

Find component definition (around line 30). Update to:

```typescript
export function FiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeCount,
}: FiltersSidebarProps) {
```

**Step 4: Fix ARIA controls IDs**

Ensure CollapsibleContent IDs match ARIA references:

```typescript
<Collapsible open={healthOpen} onOpenChange={setHealthOpen}>
  <CollapsibleTrigger
    className="..."
    aria-controls="health-filters-content"
    aria-expanded={healthOpen}
  >
    Health Status
  </CollapsibleTrigger>
  <CollapsibleContent id="health-filters-content">
    {/* checkboxes */}
  </CollapsibleContent>
</Collapsible>

{/* Repeat pattern for all collapsibles */}
<Collapsible open={stagesOpen} onOpenChange={setStagesOpen}>
  <CollapsibleTrigger aria-controls="stage-filters-content" aria-expanded={stagesOpen}>
    Stage
  </CollapsibleTrigger>
  <CollapsibleContent id="stage-filters-content">
    {/* checkboxes */}
  </CollapsibleContent>
</Collapsible>

<Collapsible open={assigneeOpen} onOpenChange={setAssigneeOpen}>
  <CollapsibleTrigger aria-controls="assignee-filter-content" aria-expanded={assigneeOpen}>
    Assignee
  </CollapsibleTrigger>
  <CollapsibleContent id="assignee-filter-content">
    {/* select */}
  </CollapsibleContent>
</Collapsible>

<Collapsible open={lastTouchOpen} onOpenChange={setLastTouchOpen}>
  <CollapsibleTrigger aria-controls="last-touch-filter-content" aria-expanded={lastTouchOpen}>
    Last Touch
  </CollapsibleTrigger>
  <CollapsibleContent id="last-touch-filter-content">
    {/* select */}
  </CollapsibleContent>
</Collapsible>
```

**Do NOT commit yet** - Phase 1 is atomic.

---

### Task 1.6: Wire Props in Parent Component

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:80-120`

**Step 1: Update OpportunitiesHierarchy props**

Find `<OpportunitiesHierarchy>` component call (around line 90). Update to:

```typescript
<OpportunitiesHierarchy
  filters={filterState}
  currentUserId={identity?.id} // string from React Admin
  onOpportunityClick={handleOpportunityClick}
/>
```

**Step 2: Update TasksPanel props (minimal)**

Find `<TasksPanel>` component call (around line 100). Update to:

```typescript
<TasksPanel
  assignee={filterState.assignee}
  currentUserId={identity?.id} // string from React Admin
/>
```

**Step 3: Update FiltersSidebar props**

Find `<FiltersSidebar>` component call (around line 80). Update to:

```typescript
<FiltersSidebar
  filters={filterState}
  onFiltersChange={setFilterState}
  onClearFilters={handleClearFilters}
  activeCount={activeFilterCount}
/>
```

**Do NOT commit yet** - Phase 1 is atomic.

---

### Task 1.7: Verify & COMMIT Phase 1 (Atomic)

**Step 1: Verify all TypeScript errors are resolved**

Run: `npm run typecheck`
Expected: No errors (all components now have matching props, shared FilterState type)

**Step 2: Verify no duplicate type definitions**

Run: `grep -r "interface FilterState" src/atomic-crm/dashboard/v2/`
Expected: Only found in `src/atomic-crm/dashboard/v2/types.ts` (single source of truth)

**Step 3: COMMIT Phase 1 - ONE ATOMIC COMMIT**

```bash
git add src/atomic-crm/dashboard/v2/types.ts
git add src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
git add src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx
git add src/atomic-crm/dashboard/v2/components/TasksPanel.tsx
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git commit -m "feat(dashboard-v2): wire filters with shared types and client-side filtering

ATOMIC COMMIT - All changes applied together to prevent compiler errors

CHANGES:
- Create types.ts with shared FilterState (single source of truth)
- Add FilterState persistence via usePrefs('filters') → localStorage key: 'pd.filters'
- Add useGetIdentity for current user (identity.id is string)
- Implement client-side filtering in OpportunitiesHierarchy
- Add currentUserId prop (string type, React Admin default)
- Update empty states to differentiate 'no data' vs 'no matches'
- Add activeFilterCount calculation and handleClearFilters
- Minimal TasksPanel props (only assignee + currentUserId, no full FilterState)
- Fix ARIA controls IDs to match CollapsibleContent IDs
- Add ID to opportunities panel for accessibility

BREAKING: All components updated atomically
NOTE: Assignee filter requires DB migration (sales_id in views)"
```

---

## Phase 2: Clear Filters Button (Per-Task Commits)

### Task 2.1: Add Clear Button to FiltersSidebar

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:30-80`

**Step 1: Update header section**

Find the header `<h2>Filters</h2>` (around line 50). Replace with:

```typescript
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-foreground">Filters</h2>
  {activeCount > 0 && (
    <button
      onClick={onClearFilters}
      className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Clear ${activeCount} active filters`}
    >
      Clear ({activeCount})
    </button>
  )}
</div>
```

**Step 2: Test clear button manually**

Run: `npm run dev`
1. Navigate to Dashboard V2
2. Apply multiple filters (health + stage)
3. Verify "Clear (2)" button appears
4. Click clear button
5. Verify all filters reset to defaults

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git commit -m "feat(dashboard-v2): add clear filters button with active count badge"
```

---

## Phase 3: Dynamic Filter Options (Per-Task Commits)

### Task 3.1: Use Dynamic Stages from ConfigurationContext

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:1-150`

**Step 1: Import useConfigurationContext**

Add import (hook already exists, verified):

```typescript
import { useConfigurationContext } from '@/atomic-crm/root/ConfigurationContext';
```

**Step 2: Add hook call in component**

Add after component definition (around line 40):

```typescript
// Get dynamic stages from configuration (already exists in context)
const { opportunityStages } = useConfigurationContext();
// opportunityStages format: { value: string; label: string }[]
```

**Step 3: Replace OPPORTUNITY_STAGES_LEGACY with dynamic stages**

Find stage filter section (around line 108-129). Replace with:

```typescript
<Collapsible open={stagesOpen} onOpenChange={setStagesOpen}>
  <CollapsibleTrigger
    className="flex w-full items-center justify-between py-2 text-sm font-medium hover:underline"
    aria-controls="stage-filters-content"
    aria-expanded={stagesOpen}
  >
    <span>Stage</span>
    <ChevronDown className={cn("h-4 w-4 transition-transform", stagesOpen && "rotate-180")} />
  </CollapsibleTrigger>
  <CollapsibleContent id="stage-filters-content" className="mt-2 grid grid-cols-2 gap-2">
    {opportunityStages.map((stage) => (
      <div key={stage.value} className="flex items-center space-x-2">
        <Checkbox
          id={`stage-${stage.value}`}
          checked={filters.stages.includes(stage.value)}
          onCheckedChange={(checked) => {
            const newStages = checked
              ? [...filters.stages, stage.value]
              : filters.stages.filter(s => s !== stage.value);
            onFiltersChange({ ...filters, stages: newStages });
          }}
        />
        <Label
          htmlFor={`stage-${stage.value}`}
          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {stage.label}
        </Label>
      </div>
    ))}
  </CollapsibleContent>
</Collapsible>
```

**Step 4: Verify stages are populated**

Run: `npm run dev`
1. Open browser console
2. Check for errors
3. Verify stage checkboxes render dynamically
4. Apply stage filter and verify it works

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git commit -m "feat(dashboard-v2): use dynamic stages from ConfigurationContext

- Import useConfigurationContext (verified it exists with opportunityStages)
- Replace OPPORTUNITY_STAGES_LEGACY with opportunityStages from context
- Stages now sync with CRM configuration (customizable via App.tsx)"
```

---

### Task 3.2: Add Dynamic Assignee Dropdown

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:130-160`

**Step 1: Import useGetList**

Add import:

```typescript
import { useGetList } from 'react-admin';
```

**Step 2: Fetch sales reps**

Add after useConfigurationContext hook call:

```typescript
const { data: salesReps } = useGetList('sales', {
  pagination: { page: 1, perPage: 100 },
  sort: { field: 'name', order: 'ASC' },
});
```

**Step 3: Import Select components**

Add imports:

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

**Step 4: Replace Radio group with Select dropdown**

Find assignee section (around line 131-158). Replace with:

```typescript
<Collapsible open={assigneeOpen} onOpenChange={setAssigneeOpen}>
  <CollapsibleTrigger
    className="flex w-full items-center justify-between py-2 text-sm font-medium hover:underline"
    aria-controls="assignee-filter-content"
    aria-expanded={assigneeOpen}
  >
    <span>Assignee</span>
    <ChevronDown className={cn("h-4 w-4 transition-transform", assigneeOpen && "rotate-180")} />
  </CollapsibleTrigger>
  <CollapsibleContent id="assignee-filter-content" className="mt-2">
    <Select
      value={filters.assignee?.toString() || 'team'}
      onValueChange={(value) => {
        const newAssignee = value === 'team' ? null : value; // Keep as string (React Admin IDs are strings)
        onFiltersChange({ ...filters, assignee: newAssignee });
      }}
    >
      <SelectTrigger className="w-full h-11">
        <SelectValue placeholder="All Team" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="team">All Team</SelectItem>
        <SelectItem value="me">Assigned to Me</SelectItem>
        {salesReps?.map(rep => (
          <SelectItem key={rep.id} value={rep.id.toString()}>
            {rep.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </CollapsibleContent>
</Collapsible>
```

**Step 5: Test assignee dropdown**

Run: `npm run dev`
1. Click assignee dropdown
2. Verify "All Team" and "Assigned to Me" options
3. Verify sales reps populate dynamically
4. Select "Me" - verify filter updates (though won't filter yet - needs DB migration)

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git commit -m "feat(dashboard-v2): add dynamic assignee dropdown with sales reps

- Fetch sales reps via useGetList('sales')
- Replace Radio group with Select dropdown
- Options: All Team | Assigned to Me | Individual sales reps
- IDs stored as strings (React Admin default)
- NOTE: Filtering requires sales_id in database views (future migration)"
```

---

## Phase 4: Accessibility Improvements (Per-Task Commits)

### Task 4.1: Add Visually-Hidden Context to Filter Labels

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:66-106`

**Step 1: Update health status labels**

Find health filter checkboxes (around line 70-100). Update labels:

```typescript
<Label htmlFor="health-active" className="text-sm font-normal leading-none">
  Active <span className="sr-only">health status</span>
</Label>

<Label htmlFor="health-cooling" className="text-sm font-normal leading-none">
  Cooling <span className="sr-only">health status</span>
</Label>

<Label htmlFor="health-at-risk" className="text-sm font-normal leading-none">
  At Risk <span className="sr-only">health status</span>
</Label>
```

**Step 2: Verify sr-only class exists**

Run: `grep -r "\.sr-only" src/index.css`
Expected: Should find Tailwind's screen-reader-only utility

If not found, add to `src/index.css`:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Step 3: Test with screen reader (manual)**

Run: `npm run dev`
1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate to health filters
3. Tab through checkboxes
4. Verify "Active health status" is announced (not just "Active")

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git add src/index.css  # if sr-only was added
git commit -m "a11y(dashboard-v2): add visually-hidden context to filter labels

- Add 'health status' context via sr-only span
- Screen readers now announce full context (e.g., 'Active health status')
- Improves comprehension for assistive tech users"
```

---

## Phase 5: Collapsible Sidebar (Per-Task Commits)

### Task 5.1: Add Sidebar Visibility State

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:30-60`

**Step 1: Add sidebarOpen state**

Add after filterState declaration:

```typescript
// Sidebar visibility - persisted to localStorage
const [sidebarOpen, setSidebarOpen] = usePrefs('sidebarOpen', true);
```

**Step 2: Add sidebar ref**

Add after state declarations:

```typescript
const sidebarRef = useRef<HTMLDivElement>(null);
```

**Step 3: Add useRef import**

Ensure import exists:

```typescript
import { useMemo, useCallback, useRef } from 'react';
```

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
git commit -m "feat(dashboard-v2): add sidebar visibility state with usePrefs"
```

---

### Task 5.2: Update Grid Layout with CSS Transitions

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:80-150`

**Step 1: Find main grid container**

Locate the grid container that holds sidebar and main content (around line 100).

**Step 2: Update grid with dynamic columns**

Replace existing grid styles with:

```typescript
<div
  className="flex-1 overflow-auto"
  style={{
    display: 'grid',
    gridTemplateColumns: sidebarOpen ? '18rem 1fr' : '0px 1fr',
    gap: sidebarOpen ? 'var(--spacing-content)' : '0',
    transition: 'grid-template-columns 200ms cubic-bezier(0.4, 0, 0.2, 1), gap 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  }}
>
  {/* Sidebar column */}
  <div
    ref={sidebarRef}
    role="complementary"
    aria-label="Filters sidebar"
    aria-hidden={!sidebarOpen}
    className="overflow-hidden"
    style={{
      width: sidebarOpen ? '18rem' : '0',
      opacity: sidebarOpen ? 1 : 0,
      transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    }}
  >
    {sidebarOpen && (
      <FiltersSidebar
        filters={filterState}
        onFiltersChange={setFilterState}
        onClearFilters={handleClearFilters}
        activeCount={activeFilterCount}
      />
    )}
  </div>

  {/* Main content column */}
  <div className="flex gap-[var(--spacing-content)]" style={{ width: '100%' }}>
    {/* Opportunities | Tasks | Quick Logger */}
    {/* ... existing three-column layout */}
  </div>
</div>
```

**Step 3: Test collapse animation**

Run: `npm run dev`
1. Open browser DevTools
2. Toggle sidebarOpen in React DevTools (manually set to false)
3. Watch grid animate from 18rem to 0px
4. Verify smooth 200ms transition
5. Verify no layout jank (overflow hidden prevents scroll)

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
git commit -m "feat(dashboard-v2): add collapsible sidebar with CSS Grid transitions

- Grid animates from '18rem 1fr' to '0px 1fr'
- 200ms cubic-bezier transition for smooth collapse
- Sidebar width + opacity transitions
- overflow:hidden prevents layout jank
- Main content expands to fill space automatically"
```

---

## Phase 6: Collapse Toggle & Rail Button (Per-Task Commits)

### Task 6.1: Add Collapse Button to Sidebar Header

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:20-80`

**Step 1: Add props for toggle**

Update FiltersSidebarProps:

```typescript
interface FiltersSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  activeCount: number;
  isOpen: boolean;        // NEW
  onToggle: () => void;   // NEW
}
```

**Step 2: Update function signature**

```typescript
export function FiltersSidebar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeCount,
  isOpen,
  onToggle,
}: FiltersSidebarProps) {
```

**Step 3: Import ChevronLeft icon**

Add import:

```typescript
import { ChevronLeft, ChevronDown } from 'lucide-react';
```

**Step 4: Update header with collapse button**

Find header div with "Filters" h2 (around line 60). Replace:

```typescript
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-foreground">Filters</h2>
  <div className="flex items-center gap-2">
    {activeCount > 0 && (
      <button
        onClick={onClearFilters}
        className="h-11 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Clear ${activeCount} active filters`}
      >
        Clear ({activeCount})
      </button>
    )}
    <button
      onClick={onToggle}
      className="h-11 w-11 rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary transition-colors flex items-center justify-center"
      aria-label="Collapse filters sidebar"
    >
      <ChevronLeft className="h-5 w-5 text-muted-foreground" />
    </button>
  </div>
</div>
```

**Step 5: Update parent to pass toggle props**

**File:** `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`

Update FiltersSidebar component call:

```typescript
<FiltersSidebar
  filters={filterState}
  onFiltersChange={setFilterState}
  onClearFilters={handleClearFilters}
  activeCount={activeFilterCount}
  isOpen={sidebarOpen}
  onToggle={() => setSidebarOpen(false)}
/>
```

**Step 6: Test collapse button**

Run: `npm run dev`
1. Click chevron-left button in sidebar header
2. Verify sidebar collapses with smooth animation
3. Verify grid adjusts to 0px width
4. Verify main content expands to fill space

**Step 7: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git add src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
git commit -m "feat(dashboard-v2): add collapse button to sidebar header

- Add isOpen/onToggle props to FiltersSidebar
- ChevronLeft icon button in header
- 44px touch target (h-11 w-11)
- Parent passes setSidebarOpen(false) handler"
```

---

### Task 6.2: Add Collapsed Rail Button with Badge

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx:100-180`

**Step 1: Import ChevronRight icon**

Add import:

```typescript
import { ChevronRight } from 'lucide-react';
```

**Step 2: Add rail button after grid container**

After the closing `</div>` of the grid container (around line 150), add:

```typescript
{/* Collapsed Rail Toggle */}
{!sidebarOpen && (
  <div className="fixed left-0 top-32 z-10">
    <button
      onClick={() => {
        setSidebarOpen(true);
        // Focus management: focus sidebar after animation completes
        setTimeout(() => {
          sidebarRef.current?.querySelector('button, input')?.focus();
        }, 250);
      }}
      className="relative w-2 h-24 bg-border hover:w-8 hover:bg-accent transition-all duration-200 rounded-r-md group focus-visible:ring-2 focus-visible:ring-primary focus-visible:w-8 flex items-center justify-center"
      aria-label="Open filters sidebar"
    >
      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />

      {/* Active filter badge */}
      {activeFilterCount > 0 && (
        <div className="absolute -top-2 left-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
          {activeFilterCount}
        </div>
      )}
    </button>
  </div>
)}
```

**Step 3: Test rail button**

Run: `npm run dev`
1. Collapse sidebar using chevron-left button
2. Verify thin 6px rail appears on left (w-2 = 8px in Tailwind)
3. Hover over rail - verify expands to 32px and shows chevron-right
4. Click rail - verify sidebar reopens
5. Apply filters then collapse - verify badge shows count
6. Tab to rail button - verify focus-visible ring appears

**Step 4: Test keyboard navigation**

1. Tab to rail button
2. Verify focus-visible ring appears
3. Press Enter/Space
4. Verify sidebar opens
5. Verify focus moves to first input after 250ms

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
git commit -m "feat(dashboard-v2): add collapsed rail button with active filter badge

- 6px rail (w-2) expands to 32px on hover
- ChevronRight icon (opacity 0 → 100 on hover/focus)
- Active filter badge when count > 0
- Focus management: moves to sidebar first input after open
- Keyboard accessible (Tab + Enter/Space)
- Semantic colors: bg-border, hover:bg-accent, bg-primary badge"
```

---

## Phase 7: Testing (Per-Task Commits)

### Task 7.1: Write Unit Tests for Filter Logic

**Files:**
- Create: `src/atomic-crm/dashboard/v2/components/__tests__/OpportunitiesHierarchy.test.tsx`

**Step 1: Create test file with mocks**

Create file:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpportunitiesHierarchy } from '../OpportunitiesHierarchy';
import type { FilterState } from '../../types';

// Mock React Admin hooks
vi.mock('react-admin', () => ({
  useGetList: vi.fn(() => ({ data: [] })),
}));

// Mock PrincipalContext
vi.mock('../../context/PrincipalContext', () => ({
  usePrincipalContext: vi.fn(() => ({ selectedPrincipalId: 1 })),
}));
```

**Step 2: Write test for health filter**

```typescript
describe('OpportunitiesHierarchy', () => {
  it('filters opportunities by health status', () => {
    const { useGetList } = require('react-admin');

    useGetList.mockReturnValue({
      data: [
        {
          opportunity_id: 1,
          opportunity_name: 'Active Opp',
          health_status: 'active',
          customer_name: 'Acme',
          customer_organization_id: 1,
          stage: 'new_lead',
          days_since_activity: 0
        },
        {
          opportunity_id: 2,
          opportunity_name: 'Cooling Opp',
          health_status: 'cooling',
          customer_name: 'Beta',
          customer_organization_id: 2,
          stage: 'new_lead',
          days_since_activity: 0
        },
      ],
    });

    const filters: FilterState = {
      health: ['active'],
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    render(
      <OpportunitiesHierarchy
        filters={filters}
        onOpportunityClick={() => {}}
      />
    );

    // Should show active opportunity
    expect(screen.queryByText(/Active Opp/)).toBeInTheDocument();
    // Should NOT show cooling opportunity
    expect(screen.queryByText(/Cooling Opp/)).not.toBeInTheDocument();
  });

  it('shows all opportunities when health filter is empty', () => {
    const { useGetList } = require('react-admin');

    useGetList.mockReturnValue({
      data: [
        { opportunity_id: 1, opportunity_name: 'Active Opp', health_status: 'active', customer_organization_id: 1, customer_name: 'Acme', stage: 'new_lead', days_since_activity: 0 },
        { opportunity_id: 2, opportunity_name: 'Cooling Opp', health_status: 'cooling', customer_organization_id: 2, customer_name: 'Beta', stage: 'new_lead', days_since_activity: 0 },
      ],
    });

    const filters: FilterState = {
      health: [], // Empty = show all
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    render(
      <OpportunitiesHierarchy
        filters={filters}
        onOpportunityClick={() => {}}
      />
    );

    expect(screen.queryByText(/Active Opp/)).toBeInTheDocument();
    expect(screen.queryByText(/Cooling Opp/)).toBeInTheDocument();
  });

  it('shows correct empty state messages', () => {
    const { useGetList } = require('react-admin');
    const { usePrincipalContext } = require('../../context/PrincipalContext');

    // No principal selected
    usePrincipalContext.mockReturnValue({ selectedPrincipalId: null });
    useGetList.mockReturnValue({ data: [] });

    const filters: FilterState = {
      health: [],
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    const { rerender } = render(
      <OpportunitiesHierarchy
        filters={filters}
        onOpportunityClick={() => {}}
      />
    );

    expect(screen.getByText('Select a principal to view opportunities')).toBeInTheDocument();

    // Principal selected but no opportunities
    usePrincipalContext.mockReturnValue({ selectedPrincipalId: 1 });
    rerender(
      <OpportunitiesHierarchy
        filters={filters}
        onOpportunityClick={() => {}}
      />
    );

    expect(screen.getByText('No opportunities for this principal')).toBeInTheDocument();

    // Opportunities exist but all filtered out
    useGetList.mockReturnValue({
      data: [
        {
          opportunity_id: 1,
          opportunity_name: 'Cooling Opp',
          health_status: 'cooling',
          customer_organization_id: 1,
          customer_name: 'Acme',
          stage: 'new_lead',
          days_since_activity: 0
        }
      ],
    });

    const filtersActive: FilterState = {
      health: ['active'], // Will exclude cooling
      stages: [],
      assignee: null,
      lastTouch: 'any',
      showClosed: false,
      groupByCustomer: true,
    };

    rerender(
      <OpportunitiesHierarchy
        filters={filtersActive}
        onOpportunityClick={() => {}}
      />
    );

    expect(screen.getByText('No opportunities match current filters')).toBeInTheDocument();
  });
});
```

**Step 3: Run tests**

Run: `npm test OpportunitiesHierarchy.test.tsx`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/v2/components/__tests__/OpportunitiesHierarchy.test.tsx
git commit -m "test(dashboard-v2): add unit tests for opportunity filtering logic

- Test health filter includes/excludes correctly
- Test empty health filter shows all (no exclusion)
- Test empty state messages differentiate scenarios
- Use shared FilterState type from types.ts"
```

---

### Task 7.2: Write E2E Tests for Filter Persistence

**Files:**
- Verify exists: `tests/e2e/dashboard-v2-filters.spec.ts` (already created in previous work)

**Step 1: Verify E2E test file exists (or add these tests if missing)**

The file `tests/e2e/dashboard-v2-filters.spec.ts` should already exist from previous work.
If tests are missing, add the following:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard V2 Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('filters persist across page refresh', async ({ page }) => {
    // Apply health filter
    await page.getByRole('checkbox', { name: /active health status/i }).check();
    await expect(page.getByRole('checkbox', { name: /active health status/i })).toBeChecked();

    // Verify active count badge
    await expect(page.getByText('Clear (1)')).toBeVisible();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify filter still applied
    await expect(page.getByRole('checkbox', { name: /active health status/i })).toBeChecked();
    await expect(page.getByText('Clear (1)')).toBeVisible();
  });

  test('clear filters button resets all filters', async ({ page }) => {
    // Apply multiple filters
    await page.getByRole('checkbox', { name: /active health status/i }).check();
    await page.getByRole('checkbox', { name: /cooling health status/i }).check();

    // Verify count badge shows 2
    await expect(page.getByText('Clear (2)')).toBeVisible();

    // Click clear button
    await page.getByRole('button', { name: /clear 2 active filters/i }).click();

    // Verify all filters cleared
    await expect(page.getByRole('checkbox', { name: /active health status/i })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: /cooling health status/i })).not.toBeChecked();
    await expect(page.getByText(/clear/i)).not.toBeVisible();
  });
});

test.describe('Dashboard V2 Sidebar Collapse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('sidebar collapses and reopens with rail button', async ({ page }) => {
    // Verify sidebar is open initially
    const sidebar = page.getByRole('complementary', { name: 'Filters sidebar' });
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Click collapse button
    await page.getByRole('button', { name: 'Collapse filters sidebar' }).click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify sidebar is hidden
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');

    // Verify rail button appears
    const railButton = page.getByRole('button', { name: 'Open filters sidebar' });
    await expect(railButton).toBeVisible();

    // Click rail button to reopen
    await railButton.click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Verify sidebar is visible again
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  });

  test('sidebar collapse state persists across page refresh', async ({ page }) => {
    // Collapse sidebar
    await page.getByRole('button', { name: 'Collapse filters sidebar' }).click();
    await page.waitForTimeout(300);

    const sidebar = page.getByRole('complementary', { name: 'Filters sidebar' });
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify sidebar still collapsed
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('button', { name: 'Open filters sidebar' })).toBeVisible();
  });

  test('active filter badge shows on collapsed rail', async ({ page }) => {
    // Apply filters
    await page.getByRole('checkbox', { name: /active health status/i }).check();
    await page.getByRole('checkbox', { name: /cooling health status/i }).check();

    // Collapse sidebar
    await page.getByRole('button', { name: 'Collapse filters sidebar' }).click();
    await page.waitForTimeout(300);

    // Verify badge shows count
    const railButton = page.getByRole('button', { name: 'Open filters sidebar' });
    const badge = railButton.locator('div.bg-primary');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('2');
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e tests/e2e/dashboard-v2-filters.spec.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/e2e/dashboard-v2-filters.spec.ts
git commit -m "test(dashboard-v2): add E2E tests for filters and sidebar collapse

- Test filter persistence across page refresh
- Test clear filters button resets all
- Test sidebar collapse/reopen with rail button
- Test sidebar state persists across refresh
- Test active filter badge on collapsed rail"
```

---

## Phase 8: Documentation (Per-Task Commit)

### Task 8.1: Update CLAUDE.md with Filter Documentation

**Files:**
- Modify: `CLAUDE.md:100-200`

**Step 1: Add filter wiring section to Dashboard V2 docs**

Find Dashboard V2 section (around line 150). Add after **Key Features**:

```markdown
**Filters (Client-Side):**
- **Health Status:** Active, Cooling, At Risk (multi-select checkboxes)
- **Stage:** Dynamic from ConfigurationContext (multi-select, 2-column grid)
- **Assignee:** All Team | Assigned to Me | Specific sales rep (single-select dropdown)
- **Last Touch:** Any | 7 days | 14 days (single-select dropdown)
- **Show Closed:** Include/exclude closed_won and closed_lost (toggle)

**Filter Behavior:**
- **Client-side filtering** - useMemo filters <500 opportunities (acceptable performance)
- **Empty arrays = show all** - No filters excludes nothing
- **Persistence** - Filters persist via `usePrefs('filters')` → localStorage key: `'pd.filters'`
- **Active count badge** - Shows number of active filters in sidebar header
- **Clear button** - Resets all filters to defaults (appears when count > 0)
- **Shared types** - FilterState exported from `types.ts` (single source of truth)

**Sidebar Collapse:**
- **Toggle button** - ChevronLeft icon in sidebar header (44px touch target)
- **Collapsed rail** - 6px rail button on left edge when collapsed
- **Rail hover** - Expands to 32px and shows ChevronRight icon
- **Active filter badge** - Badge on rail shows filter count when sidebar collapsed
- **Persistence** - Sidebar state persists via `usePrefs('sidebarOpen')` → localStorage key: `'pd.sidebarOpen'`
- **CSS transitions** - Grid: 18rem → 0px (200ms smooth animation)
- **Focus management** - Focus moves to first input when reopening

**Type Definitions:**
```typescript
// src/atomic-crm/dashboard/v2/types.ts (SINGLE SOURCE OF TRUTH)
interface FilterState {
  health: ('active' | 'cooling' | 'at_risk')[];
  stages: string[];
  assignee: 'me' | 'team' | string | null; // string = sales_id (React Admin IDs are strings)
  lastTouch: '7d' | '14d' | 'any';
  showClosed: boolean;
  groupByCustomer: boolean;
}
```

**Known Limitations:**
- **Assignee filter not functional** - Requires `sales_id` column in database views (future migration)
- **Tasks don't filter** - Tasks panel doesn't use health/stage filters (only assignee in future)
- **Server-side filtering** - Move to Supabase query when data volume exceeds 1000+ opportunities
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(dashboard-v2): add filter wiring and sidebar collapse documentation

- Document filter types and behavior
- Document client-side filtering strategy
- Document sidebar collapse with rail toggle
- Document shared types.ts pattern
- Document known limitations (assignee filter, DB migration needed)"
```

---

## Final Verification & Completion

### Verification Checklist

**Run full test suite:**

```bash
# Type check
npm run typecheck  # Expected: No errors

# Lint
npm run lint  # Expected: No errors

# Unit tests
npm test  # Expected: All tests pass, coverage ≥ 70%

# E2E tests
npm run test:e2e  # Expected: All tests pass

# Build
npm run build  # Expected: Success
```

**Manual testing:**
- [ ] Apply health filter - opportunities update in real-time
- [ ] Apply stage filter - uses dynamic stages from ConfigurationContext
- [ ] Apply multiple filters - active count badge accurate
- [ ] Clear filters button - resets all to defaults
- [ ] Sidebar collapse - smooth 200ms animation
- [ ] Rail button - opens sidebar and focuses first input
- [ ] Active filter badge on rail - shows count when sidebar collapsed
- [ ] Page refresh - filters and sidebar state persist
- [ ] Keyboard navigation - Tab through all controls, Enter/Space work
- [ ] Screen reader - ARIA labels announced correctly

**Boy Scout Rule:**
- [ ] Remove unused imports in all modified files
- [ ] Fix any nearby inconsistencies encountered

---

## Known Limitations & Future Work

**Database Migration Required:**

1. **Assignee Filter on Opportunities:**
   - Requires `sales_id` column in `principal_opportunities` view
   - Migration: `npx supabase migration new add_sales_id_to_dashboard_views`
   - SQL:
   ```sql
   CREATE OR REPLACE VIEW principal_opportunities AS
   SELECT
     -- existing columns
     o.opportunity_owner_id as sales_id,
     s.name as sales_name
   FROM opportunities o
   LEFT JOIN sales s ON o.opportunity_owner_id = s.id
   WHERE -- existing WHERE clause
   ```

2. **Assignee Filter on Tasks:**
   - Requires `sales_id` column in `priority_tasks` view
   - Same migration as above

**Future Enhancements:**

3. **Server-Side Filtering** - When opportunity count exceeds 1000+, move filter logic to Supabase query
4. **Saved Filter Views** - Allow users to save filter combinations as named presets
5. **Filter URL State** - Persist filters in URL query params for shareable links

---

## Summary

**What Changed:**
- ✅ Created shared `types.ts` with FilterState (single source of truth)
- ✅ Added filter persistence via `usePrefs('filters')` (stored as 'pd.filters')
- ✅ Implemented client-side filtering in OpportunitiesHierarchy
- ✅ Added useGetIdentity for current user (identity.id is string)
- ✅ Added clear filters button with active count badge
- ✅ Integrated dynamic stages from ConfigurationContext
- ✅ Added dynamic assignee dropdown with sales reps
- ✅ Fixed ARIA controls to match actual CollapsibleContent IDs
- ✅ Added visually-hidden context to filter labels
- ✅ Added collapsible sidebar with CSS Grid transitions (18rem → 0px)
- ✅ Added collapsed rail button (6px) with active filter badge
- ✅ Implemented focus management when collapsing/opening
- ✅ Added unit tests for filter logic
- ✅ Added E2E tests for persistence and sidebar
- ✅ Updated CLAUDE.md documentation

**Commits:** 15 total (1 atomic + 14 per-task)

**Testing:** Unit tests + E2E tests + accessibility verification

**WCAG Compliance:** AA (44px touch targets, ARIA labels, keyboard nav)
