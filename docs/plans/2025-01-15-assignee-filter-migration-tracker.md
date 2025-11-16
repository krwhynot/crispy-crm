# Assignee Filter Migration Tracker

**Created:** 2025-01-15
**Status:** 🚧 Blocked - Awaiting Database Migration
**Priority:** P4 (Future Work)
**Blocking Issue:** `principal_opportunities` and `priority_tasks` views do not expose `sales_id` column

---

## Overview

The Dashboard V2 includes an assignee filter UI that allows users to filter opportunities and tasks by:
- "All Team" (default)
- "Assigned to Me" (current user)
- Specific sales rep (dropdown of all sales reps)

This filter is currently **hidden** because the database views do not expose the `sales_id` column needed for filtering.

---

## Blocked Components

### 1. FiltersSidebar.tsx (Line 169-196)
**Location:** `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx:169`

**Status:** UI code commented out

**TODO Comment:**
```typescript
/* ASSIGNEE FILTER - HIDDEN until sales_id is added to principal_opportunities view
   TODO: Restore this block after the database exposes sales_id so filtering works
*/
```

**Restore Action:**
1. Uncomment lines 169-196 (entire Assignee section)
2. Remove the `assigneeOpen` state comment at line 62
3. Test dropdown functionality

---

### 2. OpportunitiesHierarchy.tsx (Lines 77-84)
**Location:** `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx:77`

**Status:** Filtering logic commented out

**TODO Comment:**
```typescript
// Assignee filter - COMMENTED OUT (requires sales_id in database view)
// TODO: Uncomment after migration adds sales_id to principal_opportunities view
```

**Restore Action:**
1. Uncomment lines 79-84 (assignee filtering logic)
2. Test that "Assigned to Me" filters correctly using `currentUserId`
3. Test that specific sales rep selection filters correctly

---

### 3. TasksPanel.tsx (Lines 40-46)
**Location:** `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx:40`

**Status:** Filtering logic not implemented (example code in comment)

**TODO Comment:**
```typescript
// TODO: Add assignee filtering when sales_id is added to priority_tasks view
// Example:
// const assigneeFilter = assignee === 'me' && currentUserId
//   ? { sales_id: currentUserId }
//   : assignee && assignee !== 'team'
//   ? { sales_id: assignee }
//   : {};
```

**Restore Action:**
1. Add `assigneeFilter` to `useGetList` filter object
2. Test that tasks filter by assignee correctly
3. Ensure "All Team" shows all tasks (no assignee filter)

---

## Database Migration Required

### Views to Update

**1. `principal_opportunities` view**
- Add `sales_id` column from `opportunities` table
- Ensure column is NOT NULL or handle nulls gracefully in filter logic

**2. `priority_tasks` view**
- Add `sales_id` column from `tasks` table
- Ensure column is NOT NULL or handle nulls gracefully in filter logic

### Example Migration (Placeholder)

```sql
-- Migration: Add sales_id to Dashboard V2 views
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_sales_id_to_dashboard_views.sql

-- Drop and recreate principal_opportunities view with sales_id
DROP VIEW IF EXISTS principal_opportunities;
CREATE VIEW principal_opportunities AS
SELECT
  o.id AS opportunity_id,
  o.name AS opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.sales_id,  -- ← ADD THIS
  o.organization_id AS customer_organization_id,
  o.principal_organization_id AS principal_id,
  c.name AS customer_name,
  p.name AS principal_name,
  -- ... rest of columns
FROM opportunities o
LEFT JOIN organizations c ON o.organization_id = c.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id;

-- Drop and recreate priority_tasks view with sales_id
DROP VIEW IF EXISTS priority_tasks;
CREATE VIEW priority_tasks AS
SELECT
  t.id AS task_id,
  t.title AS task_title,
  t.due_date,
  t.priority,
  t.type AS task_type,
  t.sales_id,  -- ← ADD THIS
  t.principal_organization_id,
  p.name AS principal_name,
  -- ... rest of columns
FROM tasks t
LEFT JOIN organizations p ON t.principal_organization_id = p.id
WHERE t.completed = false;
```

---

## Testing Checklist (Post-Migration)

Once the migration is complete and deployed, test the following:

### FiltersSidebar
- [ ] Assignee dropdown is visible
- [ ] "All Team" option works (shows all opportunities/tasks)
- [ ] "Assigned to Me" option works (filters to current user's opportunities/tasks)
- [ ] Specific sales rep selection works (filters to that rep's opportunities/tasks)
- [ ] Filter state persists to localStorage (`pd.filters.assignee`)

### OpportunitiesHierarchy
- [ ] Opportunities filter correctly by assignee
- [ ] Empty array shows all opportunities (no assignee filter applied)
- [ ] "Assigned to Me" shows only current user's opportunities
- [ ] Specific sales rep selection shows only that rep's opportunities
- [ ] Filter works in combination with health/stage/lastTouch filters

### TasksPanel
- [ ] Tasks filter correctly by assignee
- [ ] "All Team" shows all tasks
- [ ] "Assigned to Me" shows only current user's tasks
- [ ] Specific sales rep selection shows only that rep's tasks
- [ ] Filter works in combination with principal selection

### Edge Cases
- [ ] Null `sales_id` values are handled gracefully (either excluded or shown in "unassigned" category)
- [ ] Filter state resets correctly when clearing filters
- [ ] No console errors when switching between filter options

---

## Related Files

**Implementation:**
- `src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx` (UI)
- `src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx` (filtering logic)
- `src/atomic-crm/dashboard/v2/components/TasksPanel.tsx` (filtering logic)
- `src/atomic-crm/dashboard/v2/types.ts` (FilterState interface)

**Tests:**
- `tests/e2e/dashboard-v2-filters.spec.ts` (E2E tests for filter persistence)
- Unit tests TBD after implementation

**Documentation:**
- `docs/plans/2025-01-15-dashboard-v2-filter-wiring-sidebar-collapse-REVISED.md` (original plan)
- `docs/plans/2025-01-15-dashboard-v2-bugfix-design.md` (bugfix documentation)
- `CLAUDE.md` (project overview)

---

## Estimated Effort

**Database Migration:** 30 minutes (view updates + testing)
**Frontend Re-enablement:** 15 minutes (uncomment code, test)
**E2E Test Updates:** 15 minutes (add assignee filter tests)
**Total:** ~1 hour

---

## Notes

- Filter UI was built proactively but disabled to avoid user confusion
- All code is commented with clear TODO markers linking to this tracker
- Assignee filter dropdown dynamically fetches sales reps from database (no hardcoded list)
- React Admin always uses string IDs, so `sales_id` comparisons use string values
- Current implementation is "fail-fast" - filter doesn't work silently, it's explicitly hidden

---

## References

- Original Filter Wiring Plan: `docs/plans/2025-01-15-dashboard-v2-filter-wiring-sidebar-collapse-REVISED.md`
- Bugfix Design: `docs/plans/2025-01-15-dashboard-v2-bugfix-design.md`
- Database Schema: `docs/architecture/database-schema.md`
- Engineering Constitution: `docs/claude/engineering-constitution.md`
