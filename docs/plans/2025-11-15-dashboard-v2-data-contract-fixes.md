# Dashboard V2 Data Contract Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 critical data contract mismatches between Dashboard V2 UI and database layer that actively mislead users

**Architecture:** This plan fixes trust issues where UI controls (toggles, filters) don't match what the database views expose. We'll realign database views with UI contracts, remove dead features, and add missing columns to unblock planned functionality.

**Tech Stack:** PostgreSQL views, Supabase migrations, React TypeScript, React Admin hooks

**Priority Order:**
- Week 1: Data integrity (migrations + dead UI removal)
- Week 2: Planned features (assignee filtering)
- Week 3: Scalability (pagination)

---

## Context: Five Critical Gaps

1. **Closed opportunities toggle** - UI has toggle but view filters out `closed_lost` (never works)
2. **Task visibility** - Quick Logger creates tasks the view can't return (medium priority, >7 days)
3. **Group by customer** - Checkbox persists state but hierarchy never reads it
4. **Pagination** - Hard-coded 500/100 row limits with no UI for overflow
5. **Assignee filtering** - UI has filter logic but views lack `sales_id` column

---

## Week 1: Data Integrity Fixes

### Task 1: Expose closed_lost Opportunities in View

**Goal:** Fix `principal_opportunities` view to include `closed_lost` rows so the "Show closed opportunities" toggle actually works

**Files:**
- Create: `supabase/migrations/20251115000001_expose_closed_lost_opportunities.sql`

**Step 1: Read the current view definition**

```bash
# Examine current view
cat supabase/migrations/20251113235406_principal_opportunities_view.sql | grep -A 50 "CREATE.*VIEW principal_opportunities"
```

Expected: See `WHERE stage NOT IN ('closed_won', 'closed_lost')` or similar exclusion

**Step 2: Create migration to remove closed_lost filter**

File: `supabase/migrations/20251115000001_expose_closed_lost_opportunities.sql`

```sql
-- =====================================================
-- Expose closed_lost Opportunities in Dashboard View
-- =====================================================
--
-- PROBLEM: UI has "Show closed opportunities" toggle but view
-- filters out closed_lost rows at database layer, so toggle
-- does nothing. Users cannot audit lost deals.
--
-- SOLUTION: Remove WHERE clause excluding closed_lost, let
-- UI control visibility via client-side filter.
-- =====================================================

DROP VIEW IF EXISTS principal_opportunities;

CREATE VIEW principal_opportunities AS
SELECT
  o.id AS opportunity_id,
  o.name AS opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.last_activity,
  o.value,
  o.probability,
  -- Customer info
  c.id AS customer_organization_id,
  c.name AS customer_name,
  -- Principal info
  p.id AS principal_organization_id,
  p.name AS principal_name,
  -- Computed health status (based on last activity)
  CASE
    WHEN o.last_activity >= NOW() - INTERVAL '7 days' THEN 'active'
    WHEN o.last_activity >= NOW() - INTERVAL '14 days' THEN 'cooling'
    ELSE 'at_risk'
  END AS health_status,
  EXTRACT(DAY FROM NOW() - o.last_activity)::INTEGER AS days_since_activity
FROM opportunities o
INNER JOIN organizations c ON o.customer_organization_id = c.id
INNER JOIN organizations p ON c.parent_organization_id = p.id
WHERE p.organization_type = 'principal'
  AND o.deleted_at IS NULL
  -- REMOVED: AND o.stage NOT IN ('closed_lost')
  -- Now UI toggle controls visibility via FilterState.showClosed
ORDER BY o.last_activity DESC;

-- Grant permissions
GRANT SELECT ON principal_opportunities TO authenticated;
```

**Step 3: Apply migration to local database**

```bash
npx supabase db reset
```

Expected: Migration applies successfully, view recreated

**Step 4: Verify view returns closed_lost rows**

```bash
npx supabase db execute --sql "SELECT COUNT(*) FROM principal_opportunities WHERE stage = 'closed_lost';"
```

Expected: Returns count > 0 (if you have test data with closed_lost)

**Step 5: Test UI toggle behavior**

Manual test in browser:
1. Open dashboard at http://localhost:5173
2. Select a principal with closed opportunities
3. Toggle "Show closed opportunities" OFF → closed_lost rows disappear
4. Toggle ON → closed_lost rows appear

Expected: Toggle now controls visibility (OpportunitiesHierarchy.tsx:72-75 client-side filter works)

**Step 6: Commit migration**

```bash
git add supabase/migrations/20251115000001_expose_closed_lost_opportunities.sql
git commit -m "fix(dashboard): expose closed_lost in principal_opportunities view

Removes database-layer filter that prevented 'Show closed opportunities'
toggle from working. UI now controls visibility via client-side filter.

Fixes: Dashboard V2 data contract gap #1"
```

---

### Task 2: Broaden priority_tasks View

**Goal:** Remove 7-day and priority restrictions so Quick Logger can create tasks that actually appear in the UI

**Files:**
- Create: `supabase/migrations/20251115000002_broaden_priority_tasks_view.sql`

**Step 1: Read current view restrictions**

```bash
cat supabase/migrations/20251114001720_priority_tasks_view.sql | grep -A 5 "due_date\|priority"
```

Expected: See `WHERE (due_date <= NOW() + INTERVAL '7 days' OR priority IN ('high', 'critical'))`

**Step 2: Create migration removing restrictions**

File: `supabase/migrations/20251115000002_broaden_priority_tasks_view.sql`

```sql
-- =====================================================
-- Broaden priority_tasks View for All Incomplete Tasks
-- =====================================================
--
-- PROBLEM: View only returns tasks due within 7 days OR high/critical
-- priority. Quick Logger creates medium-priority tasks >7 days out
-- that never appear in UI. Users see "create task" succeed but then
-- the task vanishes.
--
-- SOLUTION: Return ALL incomplete tasks for the principal, let UI
-- handle grouping/pagination. Keep priority ordering for grouping.
-- =====================================================

DROP VIEW IF EXISTS priority_tasks;

CREATE VIEW priority_tasks AS
SELECT
  t.id AS task_id,
  t.title,
  t.description,
  t.due_date,
  t.reminder_date,
  t.completed,
  t.completed_at,
  t.priority,
  t.type,
  t.contact_id,
  t.opportunity_id,
  t.sales_id,
  t.created_at,
  t.updated_at,
  -- Principal info via opportunity join (nullable for orphaned tasks)
  p.id AS principal_organization_id,
  p.name AS principal_name,
  -- Opportunity info (nullable)
  o.name AS opportunity_name,
  o.stage AS opportunity_stage
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations c ON o.customer_organization_id = c.id
LEFT JOIN organizations p ON c.parent_organization_id = p.id
WHERE t.deleted_at IS NULL
  AND t.completed = false
  -- REMOVED: AND (t.due_date <= NOW() + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))
  AND (
    -- Tasks with opportunities must belong to a principal
    (t.opportunity_id IS NOT NULL AND p.organization_type = 'principal')
    -- OR tasks without opportunities (orphaned tasks - backward compat)
    OR t.opportunity_id IS NULL
  )
ORDER BY
  -- Priority-based ordering for UI grouping
  CASE t.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  t.due_date ASC NULLS LAST;

-- Grant permissions
GRANT SELECT ON priority_tasks TO authenticated;
```

**Step 3: Apply migration**

```bash
npx supabase db reset
```

Expected: Migration applies successfully

**Step 4: Verify view returns medium-priority tasks**

```bash
npx supabase db execute --sql "SELECT COUNT(*) FROM priority_tasks WHERE priority = 'medium';"
```

Expected: Returns count > 0 (if you have medium-priority test data)

**Step 5: Test Quick Logger workflow**

Manual test:
1. Open dashboard, select principal
2. In Quick Logger, create activity with follow-up task:
   - Type: "Call"
   - Notes: "Test medium priority"
   - ✅ Create follow-up task
   - Title: "Follow up in 14 days"
   - Due date: 14 days from now
   - Priority: Medium
3. Submit form
4. Check Tasks Panel → "Later" bucket

Expected: Task appears in "Later" bucket immediately

**Step 6: Commit migration**

```bash
git add supabase/migrations/20251115000002_broaden_priority_tasks_view.sql
git commit -m "fix(dashboard): remove restrictions from priority_tasks view

Removes 7-day and priority filters that caused Quick Logger follow-ups
to vanish. View now returns ALL incomplete tasks, including medium/low
priority and tasks >7 days out.

Fixes: Dashboard V2 data contract gap #2"
```

---

### Task 3: Remove Dead groupByCustomer Preference

**Goal:** Delete unused UI control and state to prevent schema pollution

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`
- Modify: `src/atomic-crm/dashboard/v2/types.ts`
- Modify: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`

**Step 1: Remove checkbox from FiltersSidebar**

File: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`

Delete lines 244-256:

```typescript
// DELETE THIS BLOCK:
            <div className="flex items-center min-h-8">
              <Checkbox
                id="group-by-customer"
                checked={filters.groupByCustomer}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, groupByCustomer: !!checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="group-by-customer" className="ml-2 cursor-pointer flex-1 text-xs">
                Group opportunities by customer
              </Label>
            </div>
```

**Step 2: Remove from FilterState interface**

File: `src/atomic-crm/dashboard/v2/types.ts`

Change lines 80-87:

```typescript
// BEFORE:
export interface FilterState {
  health: ('active' | 'cooling' | 'at_risk')[];
  stages: string[];
  assignee: 'me' | 'team' | string | null;
  lastTouch: '7d' | '14d' | 'any';
  showClosed: boolean;
  groupByCustomer: boolean;  // ← DELETE THIS LINE
}

// AFTER:
export interface FilterState {
  health: ('active' | 'cooling' | 'at_risk')[];
  stages: string[];
  assignee: 'me' | 'team' | string | null;
  lastTouch: '7d' | '14d' | 'any';
  showClosed: boolean;
}
```

**Step 3: Update default filter state**

File: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`

Change lines 41-48:

```typescript
// BEFORE:
const [filterState, setFilterState] = usePrefs<FilterState>('filters', {
  health: [],
  stages: [],
  assignee: null,
  lastTouch: 'any',
  showClosed: false,
  groupByCustomer: true,  // ← DELETE THIS LINE
});

// AFTER:
const [filterState, setFilterState] = usePrefs<FilterState>('filters', {
  health: [],
  stages: [],
  assignee: null,
  lastTouch: 'any',
  showClosed: false,
});
```

**Step 4: Remove from handleClearFilters**

File: `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`

Change lines 71-80:

```typescript
// BEFORE:
const handleClearFilters = useCallback(() => {
  setFilterState({
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
    groupByCustomer: filterState.groupByCustomer, // ← DELETE THIS LINE
  });
}, [filterState.groupByCustomer, setFilterState]);

// AFTER:
const handleClearFilters = useCallback(() => {
  setFilterState({
    health: [],
    stages: [],
    assignee: null,
    lastTouch: 'any',
    showClosed: false,
  });
}, [setFilterState]);
```

**Step 5: Run TypeScript compiler to verify no errors**

```bash
npm run type-check
```

Expected: No type errors related to FilterState

**Step 6: Test UI still works**

Manual test:
1. Open dashboard
2. Apply some filters (health, stage)
3. Click "Clear" button

Expected: Filters reset, no console errors about missing `groupByCustomer`

**Step 7: Commit changes**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx \
        src/atomic-crm/dashboard/v2/types.ts \
        src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx
git commit -m "refactor(dashboard): remove unused groupByCustomer preference

Deletes dead UI control that persisted state but was never consumed
by OpportunitiesHierarchy. Prevents localStorage schema pollution.

Fixes: Dashboard V2 data contract gap #3"
```

---

## Week 2: Enable Assignee Filtering

### Task 4: Add sales_id to principal_opportunities View

**Goal:** Expose sales_id column so assignee filter can work

**Files:**
- Modify: `supabase/migrations/20251115000001_expose_closed_lost_opportunities.sql` (recreate with sales_id)

**Step 1: Create new migration adding sales_id**

File: `supabase/migrations/20251115000003_add_sales_id_to_principal_opportunities.sql`

```sql
-- =====================================================
-- Add sales_id to principal_opportunities View
-- =====================================================
--
-- PROBLEM: FilterState defines assignee filter, UI has dropdown,
-- but view doesn't expose sales_id column. Filter logic is commented
-- out with TODO waiting for this column.
--
-- SOLUTION: Expose o.sales_id from opportunities table so UI can
-- filter by assignee (me/team/specific rep).
-- =====================================================

DROP VIEW IF EXISTS principal_opportunities;

CREATE VIEW principal_opportunities AS
SELECT
  o.id AS opportunity_id,
  o.name AS opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.last_activity,
  o.sales_id,  -- ✅ ADD THIS COLUMN
  o.value,
  o.probability,
  -- Customer info
  c.id AS customer_organization_id,
  c.name AS customer_name,
  -- Principal info
  p.id AS principal_organization_id,
  p.name AS principal_name,
  -- Computed health status
  CASE
    WHEN o.last_activity >= NOW() - INTERVAL '7 days' THEN 'active'
    WHEN o.last_activity >= NOW() - INTERVAL '14 days' THEN 'cooling'
    ELSE 'at_risk'
  END AS health_status,
  EXTRACT(DAY FROM NOW() - o.last_activity)::INTEGER AS days_since_activity
FROM opportunities o
INNER JOIN organizations c ON o.customer_organization_id = c.id
INNER JOIN organizations p ON c.parent_organization_id = p.id
WHERE p.organization_type = 'principal'
  AND o.deleted_at IS NULL
ORDER BY o.last_activity DESC;

-- Grant permissions
GRANT SELECT ON principal_opportunities TO authenticated;
```

**Step 2: Verify priority_tasks already has sales_id**

```bash
cat supabase/migrations/20251115000002_broaden_priority_tasks_view.sql | grep "sales_id"
```

Expected: See `t.sales_id` in SELECT clause (already included)

**Step 3: Apply migration**

```bash
npx supabase db reset
```

**Step 4: Verify column exists**

```bash
npx supabase db execute --sql "SELECT sales_id FROM principal_opportunities LIMIT 1;"
```

Expected: Returns sales_id value (or NULL if no data)

**Step 5: Commit migration**

```bash
git add supabase/migrations/20251115000003_add_sales_id_to_principal_opportunities.sql
git commit -m "feat(dashboard): add sales_id to principal_opportunities view

Exposes sales_id column required for assignee filtering. Unblocks
'Assigned to Me' and 'Assigned to [Rep]' filter options.

Related: Dashboard V2 data contract gap #5"
```

---

### Task 5: Enable Assignee Filter in OpportunitiesHierarchy

**Goal:** Uncomment filter logic now that sales_id is available

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`
- Modify: `src/atomic-crm/dashboard/v2/types.ts`

**Step 1: Add sales_id to PrincipalOpportunity type**

File: `src/atomic-crm/dashboard/v2/types.ts`

Find where `PrincipalOpportunity` is defined (or add to parent `types.ts`):

```typescript
// In src/atomic-crm/dashboard/types.ts or v2/types.ts
export interface PrincipalOpportunity {
  opportunity_id: number;
  opportunity_name: string;
  stage: string;
  estimated_close_date: string | null;
  last_activity: string;
  sales_id: string | null;  // ✅ ADD THIS
  value: number | null;
  probability: number | null;
  customer_organization_id: number;
  customer_name: string;
  principal_organization_id: number;
  principal_name: string;
  health_status: 'active' | 'cooling' | 'at_risk';
  days_since_activity: number;
}
```

**Step 2: Uncomment assignee filter logic**

File: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`

Change lines 77-84:

```typescript
// BEFORE (commented out):
      // Assignee filter - COMMENTED OUT (requires sales_id in database view)
      // TODO: Uncomment after migration adds sales_id to principal_opportunities view
      // if (filters.assignee === 'me' && currentUserId && opp.sales_id !== currentUserId) {
      //   return false;
      // }
      // if (filters.assignee !== null && filters.assignee !== 'me' && filters.assignee !== 'team' && opp.sales_id !== filters.assignee) {
      //   return false;
      // }

// AFTER (uncommented):
      // Assignee filter
      if (filters.assignee === 'me' && currentUserId && opp.sales_id !== currentUserId) {
        return false;
      }
      if (filters.assignee !== null && filters.assignee !== 'me' && filters.assignee !== 'team' && opp.sales_id !== filters.assignee) {
        return false;
      }
```

**Step 3: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No errors (sales_id now exists on type)

**Step 4: Commit changes**

```bash
git add src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx \
        src/atomic-crm/dashboard/types.ts
git commit -m "feat(dashboard): enable assignee filter in opportunities

Uncomments client-side filter logic now that sales_id is exposed
in principal_opportunities view. Users can filter by 'me', 'team',
or specific sales rep.

Related: Dashboard V2 data contract gap #5"
```

---

### Task 6: Enable Assignee Filter in TasksPanel

**Goal:** Uncomment server-side filter for tasks

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`

**Step 1: Uncomment assignee filter logic**

File: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`

Change lines 40-46:

```typescript
// BEFORE (commented out):
  // TODO: Add assignee filtering when sales_id is added to priority_tasks view
  // Example:
  // const assigneeFilter = assignee === 'me' && currentUserId
  //   ? { sales_id: currentUserId }
  //   : assignee && assignee !== 'team'
  //   ? { sales_id: assignee }
  //   : {};

// AFTER (uncommented):
  const assigneeFilter = assignee === 'me' && currentUserId
    ? { sales_id: currentUserId }
    : assignee && assignee !== 'team'
    ? { sales_id: assignee }
    : {};
```

**Step 2: Use assigneeFilter in useGetList**

Change lines 48-57:

```typescript
// BEFORE:
  const { data, isLoading } = useGetList<PriorityTask>(
    'priority_tasks',
    {
      filter: {
        completed: false,
        ...(selectedPrincipalId && { principal_organization_id: selectedPrincipalId }),
      },
      sort: { field: 'due_date', order: 'ASC' },
      pagination: { page: 1, perPage: 500 },
    },

// AFTER:
  const { data, isLoading } = useGetList<PriorityTask>(
    'priority_tasks',
    {
      filter: {
        completed: false,
        ...assigneeFilter,  // ✅ ADD THIS
        ...(selectedPrincipalId && { principal_organization_id: selectedPrincipalId }),
      },
      sort: { field: 'due_date', order: 'ASC' },
      pagination: { page: 1, perPage: 500 },
    },
```

**Step 3: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No errors

**Step 4: Commit changes**

```bash
git add src/atomic-crm/dashboard/v2/components/TasksPanel.tsx
git commit -m "feat(dashboard): enable assignee filter in tasks

Uncomments server-side filter logic for tasks. When user selects
'Assigned to Me', only their tasks are fetched from database.

Related: Dashboard V2 data contract gap #5"
```

---

### Task 7: Restore Assignee Filter UI in Sidebar

**Goal:** Uncomment the dropdown in FiltersSidebar

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`

**Step 1: Uncomment assignee filter UI**

File: `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx`

Uncomment lines 169-194:

```typescript
// BEFORE (commented out):
        {/* ASSIGNEE FILTER - HIDDEN until sales_id is added to principal_opportunities view
            TODO: Restore this block after the database exposes sales_id so filtering works
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Assignee</h3>
          <Select
            ...
          </Select>
        </div>
        */}

// AFTER (uncommented - remove comment block entirely):
        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-xs">Assignee</h3>
          <Select
            value={filters.assignee?.toString() || 'team'}
            onValueChange={(value) => {
              const newAssignee = value === 'team' ? null : value;
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
        </div>
```

**Step 2: Run development server**

```bash
npm run dev
```

**Step 3: Test assignee filter**

Manual test:
1. Open dashboard
2. Select principal with opportunities
3. Open filters sidebar
4. Assignee dropdown should now be visible
5. Select "Assigned to Me"
6. Verify only your opportunities appear

Expected: Filter works end-to-end

**Step 4: Commit changes**

```bash
git add src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx
git commit -m "feat(dashboard): restore assignee filter dropdown

Uncomments assignee filter UI now that database views expose sales_id.
Users can filter opportunities and tasks by assignee.

Completes: Dashboard V2 data contract gap #5"
```

---

## Week 3: Client-Side Pagination

### Task 8: Add Load More Button to OpportunitiesHierarchy

**Goal:** Handle principals with >500 opportunities gracefully

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`

**Step 1: Add pagination state**

File: `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx`

After line 32, add:

```typescript
  const [displayLimit, setDisplayLimit] = useState(100);
```

**Step 2: Slice customer groups**

After line 125 (where `customerGroups` is computed), add:

```typescript
  // Paginate customer groups for performance
  const visibleGroups = useMemo(() => {
    return customerGroups.slice(0, displayLimit);
  }, [customerGroups, displayLimit]);
```

**Step 3: Use visibleGroups in render**

Change line 258:

```typescript
// BEFORE:
      {customerGroups.map((group) => {

// AFTER:
      {visibleGroups.map((group) => {
```

**Step 4: Add Load More button**

After line 331 (end of groups map), before closing `</div>`:

```typescript
      {/* Load More button if more groups exist */}
      {customerGroups.length > displayLimit && (
        <div className="p-3 text-center border-t border-border">
          <Button
            onClick={() => setDisplayLimit(prev => prev + 100)}
            variant="outline"
            size="sm"
            className="h-11"
          >
            Load More ({customerGroups.length - displayLimit} customers hidden)
          </Button>
        </div>
      )}
```

**Step 5: Import Button if not already imported**

At top of file:

```typescript
import { Button } from '@/components/ui/button';
```

**Step 6: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No errors

**Step 7: Test with large dataset**

Manual test (requires seed data with >100 customer groups):
1. Open dashboard
2. Select principal with many customers
3. Scroll to bottom
4. Click "Load More" button

Expected: Next 100 customers appear

**Step 8: Commit changes**

```bash
git add src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx
git commit -m "feat(dashboard): add client-side pagination to opportunities

Adds 'Load More' button to handle principals with >100 customer groups.
Prevents UI slowdown and makes overflow visible to users.

Addresses: Dashboard V2 data contract gap #4"
```

---

### Task 9: Add Load More to TasksPanel

**Goal:** Handle principals with >500 tasks

**Files:**
- Modify: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`

**Step 1: Increase per-page limit awareness**

File: `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx`

Find the `useGetList` call (around line 48) and add comment:

```typescript
  const { data, isLoading, total } = useGetList<PriorityTask>(
    'priority_tasks',
    {
      filter: { /* ... */ },
      sort: { field: 'due_date', order: 'ASC' },
      pagination: { page: 1, perPage: 500 },  // TODO: Add pagination UI when principals exceed 500 tasks
    },
    { enabled: !!selectedPrincipalId }
  );
```

**Step 2: Add warning banner for overflow**

After the loading skeleton (around line 150), add:

```typescript
  // Warn if task limit reached
  if (total && total > 500) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm p-3">
        <Alert variant="warning">
          <AlertTitle>Task Limit Reached</AlertTitle>
          <AlertDescription>
            Showing first 500 of {total} tasks. Consider using filters to narrow results.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
```

**Step 3: Import Alert components**

At top of file:

```typescript
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
```

**Step 4: Commit changes**

```bash
git add src/atomic-crm/dashboard/v2/components/TasksPanel.tsx
git commit -m "feat(dashboard): warn when task limit exceeded

Displays warning banner if principal has >500 tasks, prompting
user to apply filters. Prevents silent data truncation.

Addresses: Dashboard V2 data contract gap #4"
```

---

## Testing Checklist

After completing all tasks, verify:

### Manual Testing

- [ ] **Closed toggle** - Toggling "Show closed opportunities" shows/hides `closed_lost` rows
- [ ] **Task creation** - Quick Logger creates medium-priority task 14 days out → appears in "Later" bucket
- [ ] **Assignee filter** - "Assigned to Me" shows only my opportunities and tasks
- [ ] **No groupByCustomer errors** - No console warnings about missing localStorage keys
- [ ] **Pagination** - Large principals show "Load More" button and warning banners

### E2E Testing

Run existing dashboard tests:

```bash
npm run test:e2e -- tests/e2e/dashboard-v2-filters.spec.ts
npm run test:e2e -- tests/e2e/dashboard-v2-activity-log.spec.ts
```

Expected: All tests pass with updated filters

### Database Testing

```bash
# Verify views return expected data
npx supabase db execute --sql "
  SELECT COUNT(*) FROM principal_opportunities WHERE stage = 'closed_lost';
  SELECT COUNT(*) FROM priority_tasks WHERE priority = 'medium';
  SELECT sales_id FROM principal_opportunities WHERE sales_id IS NOT NULL LIMIT 1;
"
```

Expected: All queries return data (assuming test seeds exist)

---

## Deployment Checklist

- [ ] All migrations applied to local database
- [ ] TypeScript compiler passes (`npm run type-check`)
- [ ] All E2E tests pass
- [ ] Manual testing complete
- [ ] Migrations pushed to staging environment
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor for errors in production logs

---

## Rollback Plan

If issues arise after deployment:

### Rollback Migrations

```bash
# Revert to previous migration version
npx supabase db reset --version <previous-timestamp>
```

### Rollback Frontend Changes

```bash
# Revert commits
git revert HEAD~9..HEAD  # Reverts last 9 commits (all tasks)
git push origin main
```

---

## Future Improvements

**Server-Side Pagination** (Deferred to Q2 2025):
- Monitor analytics for principals with >500 opportunities/tasks
- If >5% of principals hit limits, implement server-side pagination:
  - Add `page` and `perPage` to FilterState
  - Pass to `useGetList` pagination param
  - Add pagination UI (page numbers or infinite scroll)

**Real-Time Updates** (Deferred):
- Subscribe to Supabase real-time for task completions
- Auto-refresh opportunities when stage changes

---

## Architecture Insights

`★ Insight ─────────────────────────────────────`
**Database Views as Dumb Pipes:** This plan demonstrates why
views should expose ALL data and let the application layer
handle filtering. Baking business logic (like "hide closed_lost")
into views creates contract mismatches between UI and database.

**Contract Testing:** These bugs existed because there's no
automated test verifying "FilterState interface ↔ Database
view columns" contracts. Future work: Add integration tests
that assert view schemas match TypeScript types.

**TODO Debt:** Commented-out code is technical debt. The
assignee filter TODOs should have blocked the feature from
shipping. Use feature flags instead of commented code.
`─────────────────────────────────────────────────`

---

## Summary

**Files Modified:** 5 TypeScript files, 3 SQL migrations
**Lines Changed:** ~200 LOC
**Testing:** 5 manual tests, 2 E2E test suites, 3 SQL queries
**Timeline:** 3 weeks (1 week per priority tier)

**Key Wins:**
1. ✅ Closed toggle works (trust issue fixed)
2. ✅ Tasks created via Quick Logger actually appear (workflow fixed)
3. ✅ Dead UI removed (prevents future confusion)
4. ✅ Assignee filtering enabled (planned feature unlocked)
5. ✅ Pagination handles overflow (scalability improved)
