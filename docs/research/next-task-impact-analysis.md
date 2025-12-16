# Next Task Column - Impact Analysis Report

## Executive Summary

**Risk Level: LOW** - This feature follows an established pattern. The `opportunities_summary` view already has task-related computed columns (`pending_task_count`, `overdue_task_count`) and the Kanban UI already displays them. Adding "Next Task" details is a natural extension with minimal architectural changes.

**Recommendation: PROCEED** - Implementation is straightforward using existing patterns. No schema changes to base tables required.

---

## Database Impact

### Current Schema

**Task-Opportunity Relationship** (`supabase/migrations/20251018152315_cloud_schema_fresh.sql:2790`):
```sql
ADD CONSTRAINT "tasks_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id");
```

- **Relationship**: `tasks.opportunity_id` → `opportunities.id` (nullable, no cascade)
- **Cardinality**: One-to-Many (one opportunity can have multiple tasks)
- **Soft Delete**: Both tables use `deleted_at` timestamp pattern

**Existing Task Columns in `opportunities_summary`** (`supabase/migrations/20251204220000_add_activity_task_counts_to_opportunities_summary.sql`):
```sql
-- Already implemented correlated subqueries:
(SELECT COUNT(*)::integer FROM tasks t WHERE t.opportunity_id = o.id
 AND COALESCE(t.completed, false) = false AND t.deleted_at IS NULL) AS pending_task_count,

(SELECT COUNT(*)::integer FROM tasks t WHERE t.opportunity_id = o.id
 AND COALESCE(t.completed, false) = false AND t.due_date < CURRENT_DATE
 AND t.deleted_at IS NULL) AS overdue_task_count
```

### Required Changes

**Extend `opportunities_summary` view with next_task columns:**
```sql
-- Add to view definition (follows existing pattern):
(SELECT t.id FROM tasks t
 WHERE t.opportunity_id = o.id
   AND COALESCE(t.completed, false) = false
   AND t.deleted_at IS NULL
   AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
 ORDER BY t.due_date ASC NULLS LAST, t.priority DESC
 LIMIT 1
) AS next_task_id,

(SELECT t.title FROM tasks t
 WHERE t.opportunity_id = o.id
   AND COALESCE(t.completed, false) = false
   AND t.deleted_at IS NULL
   AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
 ORDER BY t.due_date ASC NULLS LAST, t.priority DESC
 LIMIT 1
) AS next_task_title,

(SELECT t.due_date FROM tasks t
 WHERE t.opportunity_id = o.id
   AND COALESCE(t.completed, false) = false
   AND t.deleted_at IS NULL
   AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
 ORDER BY t.due_date ASC NULLS LAST, t.priority DESC
 LIMIT 1
) AS next_task_due_date,

(SELECT t.priority FROM tasks t
 WHERE t.opportunity_id = o.id
   AND COALESCE(t.completed, false) = false
   AND t.deleted_at IS NULL
   AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
 ORDER BY t.due_date ASC NULLS LAST, t.priority DESC
 LIMIT 1
) AS next_task_priority
```

### Migration Risk: LOW

- Uses existing correlated subquery pattern (proven performant)
- `idx_tasks_opportunity_id` index already exists
- No base table schema changes
- View recreation uses `DROP VIEW CASCADE` pattern (already established)

---

## Task Page Impact

### Current Behavior

**Task List** (`src/atomic-crm/tasks/TaskList.tsx`):
- 8-column datagrid: Done, Title, Due Date, Priority, Type, Assigned To, Contact, Opportunity
- Shows opportunity as a reference field link
- Default sort: `due_date ASC`

**Task Slide-Over** (`src/atomic-crm/tasks/TaskSlideOver.tsx`):
- Related Items tab shows linked opportunity
- View/Edit modes for task details

**Task Completion** (`src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts`):
- Sets `completed_at` timestamp when `completed = true`
- Normalizes `snooze_until` dates

### Potential Conflicts

| Concern | Risk | Mitigation |
|---------|------|------------|
| Task shown in two places | Low | Already happens - Tasks list shows Opportunity column. "Next Task" in Opportunities is complementary, not duplicate |
| Completing task doesn't update Opportunity view | Medium | React Admin's TanStack Query handles cache invalidation. Task completion triggers automatic refetch |
| Snoozed tasks appearing as "Next" | Low | Filter in SQL: `snooze_until IS NULL OR snooze_until <= NOW()` |

### Recommendations

1. **No changes needed to Task page** - it's a one-way display relationship
2. **Cache invalidation is automatic** - React Admin handles it
3. **Consider linking** - "Next Task" click could navigate to task slide-over (future enhancement)

---

## Data Provider Impact

### Current Query Pattern

**Opportunities use view** (`src/atomic-crm/providers/supabase/utils/dataProviderUtils.ts:231-251`):
```typescript
if (resource === "opportunities") {
  return "opportunities_summary"; // Uses view for getList/getOne
}
```

**Task columns already included** - `pending_task_count` and `overdue_task_count` are already fetched with every opportunity query (no additional join needed).

### Proposed Query Pattern

**No changes required** - adding columns to the view automatically includes them in all opportunity queries. The data provider doesn't need modification.

### Performance Considerations

| Metric | Impact | Notes |
|--------|--------|-------|
| Query complexity | +4 correlated subqueries | Same pattern as existing task counts |
| Index usage | Optimal | `idx_tasks_opportunity_id` already exists |
| View recreation | One-time | `DROP VIEW CASCADE` handles dependencies |
| Runtime overhead | Minimal | PostgreSQL optimizes correlated subqueries well for small result sets |

**Benchmark Reference**: Existing `pending_task_count`/`overdue_task_count` subqueries have no measurable performance impact.

---

## Real-time Updates

### Current Behavior

- **No Supabase realtime subscriptions** in the codebase
- **React Admin TanStack Query** handles all caching
- **Automatic invalidation** on mutations (create/update/delete)

### Cache Invalidation Flow

```
User completes task
  → tasksCallbacks.ts updates task
  → TanStack Query invalidates "tasks" queries
  → Next opportunity list fetch gets fresh "next_task_*" data from view
```

**Potential UX Issue**: If viewing Opportunities list while completing a task elsewhere, the "Next Task" won't update until:
1. User navigates away and back
2. User manually refreshes
3. User performs any action that triggers a refetch

**Mitigation Options** (future enhancement):
- Add cross-resource cache invalidation hook
- Implement Supabase realtime subscription for opportunities_summary
- Use `queryClient.invalidateQueries(['opportunities'])` after task mutations

---

## Cross-Feature Dependencies

### Files That Touch Both Tasks and Opportunities

| File | Impact | Changes Needed |
|------|--------|----------------|
| `src/atomic-crm/types.ts:272-273` | Types | Add `next_task_*` fields to Opportunity interface |
| `src/types/database.generated.ts` | Auto-generated | Will update after `npx supabase gen types` |
| `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx:100-101` | Already uses task counts | Extend to show next_task |
| `src/atomic-crm/opportunities/OpportunityRowListView.tsx` | Doesn't show tasks | Add next_task column |
| `supabase/migrations/opportunities_summary` | View definition | Add next_task columns |

### Existing Task Components (Reusable)

| Component | Location | Reuse Potential |
|-----------|----------|-----------------|
| `PriorityBadge` | `src/components/ui/priority-badge.tsx` | Direct reuse for next_task_priority |
| `Task.tsx` card | `src/atomic-crm/tasks/Task.tsx` | Too complex, create simpler inline display |
| `CompletionCheckbox` | `src/atomic-crm/tasks/TaskList.tsx` | Could inline in Opportunity row |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance regression | Low | Medium | Index exists; same pattern as existing counts |
| Stale "Next Task" after completion | Medium | Low | Document UX; consider cross-resource invalidation |
| Migration breaks existing views | Low | High | Use `DROP VIEW CASCADE` pattern (already tested) |
| Type mismatches | Low | Low | Regenerate types after migration |
| Confusion about task priority vs opportunity priority | Low | Low | Clear visual distinction; use existing PriorityBadge |

---

## Implementation Recommendation

### Approach: Extend Existing View

**Why this approach:**
1. Follows established pattern (proven safe)
2. Minimal code changes
3. Automatic type generation
4. No N+1 query issues
5. Works with existing data provider

### Implementation Order

1. **Database Migration** (new file):
   - Add `next_task_id`, `next_task_title`, `next_task_due_date`, `next_task_priority` to `opportunities_summary`

2. **Type Generation**:
   - Run `npx supabase gen types typescript --local > src/types/database.generated.ts`

3. **TypeScript Types** (`src/atomic-crm/types.ts`):
   - Add `next_task_id`, `next_task_title`, `next_task_due_date`, `next_task_priority` to Opportunity interface

4. **UI Components**:
   - **OpportunityRowListView**: Add "Next Task" column with inline task info
   - **OpportunityCard (Kanban)**: Add next task details to expanded section
   - Create `NextTaskCell` component for consistent display

5. **Tests**:
   - Update `OpportunityCard.test.tsx` with next_task test cases
   - Add integration test for row list view

---

## Files Reviewed

### Database/Migrations
- `supabase/migrations/20251018152315_cloud_schema_fresh.sql` - Base schema
- `supabase/migrations/20251024125242_add_opportunities_summary_view.sql` - Original view
- `supabase/migrations/20251204220000_add_activity_task_counts_to_opportunities_summary.sql` - Task counts pattern
- `supabase/migrations/20251114001720_priority_tasks_view.sql` - Priority tasks view (dashboard)
- `supabase/migrations/20251129190000_add_tasks_due_today_function.sql` - Tasks due today RPC

### Task Feature
- `src/atomic-crm/tasks/TaskList.tsx` - Task list implementation
- `src/atomic-crm/tasks/TaskSlideOver.tsx` - Task slide-over panel
- `src/atomic-crm/tasks/Task.tsx` - Task card component
- `src/atomic-crm/validation/task.ts` - Task Zod schema
- `src/atomic-crm/providers/supabase/callbacks/tasksCallbacks.ts` - Task lifecycle

### Opportunity Feature
- `src/atomic-crm/opportunities/OpportunityList.tsx` - Opportunity list entry
- `src/atomic-crm/opportunities/OpportunityRowListView.tsx` - Row list view
- `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` - Kanban card
- `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` - Memoization comparison

### Data Provider
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Main data provider
- `src/atomic-crm/providers/supabase/utils/dataProviderUtils.ts` - getDatabaseResource

### Types
- `src/atomic-crm/types.ts` - Domain types (Opportunity interface)
- `src/types/database.generated.ts` - Auto-generated Supabase types

---

## Decision: PROCEED

**Rationale**: This is a low-risk extension of an established pattern. The `opportunities_summary` view already fetches task counts using correlated subqueries. Adding next_task details follows the exact same pattern with no architectural changes required.

**User Decision**: Display "Next Task" in **BOTH** Kanban cards (expanded section) AND Row List view for maximum visibility.

---

## Implementation Plan

### Phase 1: Database Migration

**File**: `supabase/migrations/YYYYMMDDHHMMSS_add_next_task_to_opportunities_summary.sql`

```sql
-- Add Next Task columns to opportunities_summary view
-- Follows existing pattern for pending_task_count, overdue_task_count

DROP VIEW IF EXISTS opportunities_summary CASCADE;

CREATE VIEW opportunities_summary
WITH (security_invoker = on)
AS
SELECT
    -- All existing columns...
    o.id, o.name, o.description, o.stage, o.status, o.priority, o.index,
    -- ... (keep all existing columns)

    -- Existing task counts (unchanged)
    (SELECT COUNT(*)::integer FROM tasks t WHERE t.opportunity_id = o.id
     AND COALESCE(t.completed, false) = false AND t.deleted_at IS NULL) AS pending_task_count,

    (SELECT COUNT(*)::integer FROM tasks t WHERE t.opportunity_id = o.id
     AND COALESCE(t.completed, false) = false AND t.due_date < CURRENT_DATE
     AND t.deleted_at IS NULL) AS overdue_task_count,

    -- NEW: Next Task details (4 columns)
    (SELECT t.id FROM tasks t WHERE t.opportunity_id = o.id
     AND COALESCE(t.completed, false) = false AND t.deleted_at IS NULL
     AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
     ORDER BY t.due_date ASC NULLS LAST, t.priority DESC LIMIT 1) AS next_task_id,

    (SELECT t.title FROM tasks t WHERE t.opportunity_id = o.id
     AND COALESCE(t.completed, false) = false AND t.deleted_at IS NULL
     AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
     ORDER BY t.due_date ASC NULLS LAST, t.priority DESC LIMIT 1) AS next_task_title,

    (SELECT t.due_date FROM tasks t WHERE t.opportunity_id = o.id
     AND COALESCE(t.completed, false) = false AND t.deleted_at IS NULL
     AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
     ORDER BY t.due_date ASC NULLS LAST, t.priority DESC LIMIT 1) AS next_task_due_date,

    (SELECT t.priority FROM tasks t WHERE t.opportunity_id = o.id
     AND COALESCE(t.completed, false) = false AND t.deleted_at IS NULL
     AND (t.snooze_until IS NULL OR t.snooze_until <= NOW())
     ORDER BY t.due_date ASC NULLS LAST, t.priority DESC LIMIT 1) AS next_task_priority,

    -- Existing joined columns...
    cust_org.name AS customer_organization_name,
    -- ...rest of view
FROM opportunities o
-- ...existing joins
```

### Phase 2: Type Updates

**File**: `src/atomic-crm/types.ts` (Opportunity interface, ~line 273)

```typescript
// Add after overdue_task_count
next_task_id?: number | null;
next_task_title?: string | null;
next_task_due_date?: string | null;
next_task_priority?: 'low' | 'medium' | 'high' | 'critical' | null;
```

**File**: Auto-regenerate with `npx supabase gen types typescript --local`

### Phase 3: UI Components

#### 3A: Create NextTaskBadge Component

**File**: `src/atomic-crm/opportunities/components/NextTaskBadge.tsx`

```tsx
// Compact inline display of next task
// Shows: Task icon + truncated title + due date urgency indicator + priority badge
// Click navigates to task or opens task slide-over
```

#### 3B: Update OpportunityRowListView

**File**: `src/atomic-crm/opportunities/OpportunityRowListView.tsx`

Add column between "Close Date" and "Owner":
- Shows `<NextTaskBadge />` component
- Responsive: hidden on mobile, shown on md+
- Empty state: "No tasks" in muted text

#### 3C: Update OpportunityCard (Kanban)

**File**: `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx`

Replace generic task count with specific next task:
```tsx
// Line 242-255 currently shows:
// "3 tasks (1 overdue)"

// Change to show:
// CheckSquare icon + "Call: Follow up with John" + "Due: Today" + priority badge
// Below that: "(+2 more tasks)"
```

### Phase 4: Testing

**File**: `src/atomic-crm/opportunities/__tests__/OpportunityCard.test.tsx`
- Add test cases for next_task display
- Test urgency states (overdue, today, upcoming)

**File**: `src/atomic-crm/opportunities/__tests__/NextTaskBadge.test.tsx`
- Unit tests for the new component

---

## Files to Modify (Summary)

| File | Change Type |
|------|-------------|
| `supabase/migrations/YYYYMMDDHHMMSS_*.sql` | **CREATE** - New migration |
| `src/atomic-crm/types.ts` | **MODIFY** - Add 4 fields |
| `src/types/database.generated.ts` | **REGENERATE** - Auto |
| `src/atomic-crm/opportunities/components/NextTaskBadge.tsx` | **CREATE** - New component |
| `src/atomic-crm/opportunities/OpportunityRowListView.tsx` | **MODIFY** - Add column |
| `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` | **MODIFY** - Enhanced task display |
| `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` | **MODIFY** - Add to memoization check |
| `src/atomic-crm/opportunities/__tests__/*.test.tsx` | **CREATE/MODIFY** - Tests |

---

## Execution Order

1. **Impact Analysis** - Complete (this document)
2. **Migration** - Create SQL, test locally, apply
3. **Types** - Regenerate, update interface
4. **Component** - Create NextTaskBadge
5. **Row List** - Add column
6. **Kanban** - Enhance task display
7. **Tests** - Unit + integration
8. **Verify** - Manual testing in both views
