# Conditional Row Styling - Impact Analysis Report

**Analysis Date:** December 16, 2025
**Status:** Research Complete - Ready for Implementation
**Risk Level:** LOW

---

## Executive Summary

**Safe to implement.** The codebase already has robust infrastructure for computing "overdue" status (client-side date-fns calculations and database views). Semantic color tokens exist. The only modification needed is extending `PremiumDatagrid` to accept a custom `rowClassName` callback, which is a minimal change.

---

## 1. Computed Fields Analysis

### "is_overdue" Definition

**For Opportunities:** An opportunity is "overdue" when `estimated_close_date < today`

This is already calculated client-side in `OpportunityCard.tsx:86-97`:
```typescript
const daysUntilClose = closeDateParsed ? differenceInDays(closeDateParsed, new Date()) : null;
const closeDateUrgency = daysUntilClose !== null
  ? daysUntilClose < 0 ? "overdue" : daysUntilClose < 7 ? "soon" : "normal"
  : "normal";
```

### Current Implementation Status

| Computation | Location | Type |
|-------------|----------|------|
| Opportunity overdue | `OpportunityCard.tsx:86-97` | Client-side (date-fns) |
| Task overdue count | `opportunities_summary` view | Database (SQL) |
| Task overdue status | `useMyTasks.ts:57-69` | Client-side (date-fns) |
| Days in stage | `opportunities_summary` view | Database (SQL) |

**Key Finding:** The `opportunities_summary` database view already computes `overdue_task_count`:
```sql
-- From migration 20251204220000
(SELECT COUNT(*)::integer
 FROM tasks t
 WHERE t.opportunity_id = o.id
   AND COALESCE(t.completed, false) = false
   AND t.due_date < CURRENT_DATE
   AND t.deleted_at IS NULL
) AS overdue_task_count
```

### Recommended Approach

**Client-side calculation** is the correct approach because:
1. Already established pattern in OpportunityCard
2. Trivial computation cost (< 1ms per row for 25-50 items)
3. No additional database queries required
4. Real-time updates without view refresh

---

## 2. Date Handling

### Relevant Date Fields

| Field | Type | Purpose |
|-------|------|---------|
| `estimated_close_date` | DATE | **Primary overdue indicator** |
| `stage_changed_at` | TIMESTAMP WITH TZ | Stale deal detection |
| `created_at` | TIMESTAMP WITH TZ | Age calculation |

### Timezone Considerations

**No issues** - Dates are stored as `DATE` type (no timezone) and compared using date-fns with local timezone handling. Existing `parseDateSafely()` utility in `src/lib/date-utils.ts` handles ISO 8601 parsing correctly.

---

## 3. Styling Implementation

### Current Patterns

**PremiumDatagrid** (`src/components/admin/PremiumDatagrid.tsx:54-111`):
- Wraps React Admin's Datagrid
- Uses `.table-row-premium` CSS class for base styling
- Has `rowClassName` callback that receives `(record, index)`
- **CRITICAL:** Currently extracts and IGNORES external `rowClassName` (line 57)

```typescript
// Current implementation (line 57) - IGNORES passed rowClassName
rowClassName: _, // Extract and ignore - we always use our own getRowClassName
```

### Semantic Colors Available

From `src/index.css:300-312`:
```css
.bg-error-subtle { background-color: color-mix(in oklch, var(--destructive) 10%, transparent); }
.border-error-subtle { border-color: color-mix(in oklch, var(--destructive) 20%, transparent); }
.bg-success-subtle { background-color: color-mix(in oklch, var(--success) 10%, transparent); }
.bg-warning-subtle { background-color: color-mix(in oklch, var(--warning) 10%, transparent); }
```

### Recommended Styling Classes

| Condition | Styling | Tailwind Classes |
|-----------|---------|------------------|
| Overdue (`estimated_close_date < today`) | Red subtle background | `bg-error-subtle` |
| Hot lead (`stage === 'new_lead'`) | Primary left border | `border-l-4 border-l-primary` |
| Closed won | Success subtle background | `bg-success-subtle opacity-75` |
| Closed lost | Muted, reduced opacity | `opacity-50 bg-muted/30` |

### Proposed rowClassName Implementation

```typescript
// In OpportunityList or wrapper component
const getOpportunityRowClassName = (record: Opportunity) => {
  const isOverdue = record.estimated_close_date &&
    differenceInDays(parseDateSafely(record.estimated_close_date), new Date()) < 0;
  const isHotLead = record.stage === 'new_lead';
  const isClosedWon = record.stage === 'closed_won';
  const isClosedLost = record.stage === 'closed_lost';

  return cn(
    isOverdue && !isClosedWon && !isClosedLost && 'bg-error-subtle',
    isHotLead && 'border-l-4 border-l-primary',
    isClosedWon && 'bg-success-subtle/50',
    isClosedLost && 'opacity-50'
  );
};
```

---

## 4. Performance Analysis

### Calculation Cost

| Operation | Cost | Impact |
|-----------|------|--------|
| Date comparison per row | < 0.1ms | Negligible |
| Stage string comparison | < 0.01ms | Negligible |
| Class string concatenation | < 0.01ms | Negligible |
| **Total per page (25 rows)** | < 3ms | **No impact** |

### Pagination Context

- Default page size: **25 items**
- Max page size: **50 items**
- Conditional styling adds ~3ms max overhead
- No additional database queries required

### Recommendations

1. **No optimization needed** - calculations are trivial
2. Use existing `opportunities_summary` view data (already fetched)
3. Avoid adding new database views or computed columns

---

## 5. Required Code Changes

### Change 1: PremiumDatagrid Enhancement (REQUIRED)

**File:** `src/components/admin/PremiumDatagrid.tsx`

**Issue:** Line 57 ignores the `rowClassName` prop entirely

**Fix:** Merge external rowClassName with internal getRowClassName:

```typescript
// Updated getRowClassName to merge with external
const getRowClassName = useCallback(
  (record: unknown, index: number) => {
    const isFocused = focusedIndex !== undefined && focusedIndex >= 0 && index === focusedIndex;
    const externalClassName = typeof externalRowClassName === 'function'
      ? externalRowClassName(record, index)
      : externalRowClassName;
    return cn(
      "table-row-premium",
      isFocused && "ring-2 ring-primary ring-inset bg-primary/5",
      externalClassName
    );
  },
  [focusedIndex, externalRowClassName]
);
```

### Change 2: OpportunityList Row Styling (FEATURE)

**File:** `src/atomic-crm/opportunities/OpportunityList.tsx`

Add conditional row styling callback and pass to PremiumDatagrid.

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance degradation | **Low** | Low | Client-side calc is trivial (<3ms/page) |
| Breaking existing styling | **Low** | Medium | Use `cn()` merge, not replacement |
| Timezone-related bugs | **Very Low** | Low | Using established date-fns patterns |
| Accessibility issues | **Low** | Medium | Use semantic colors with sufficient contrast |
| PremiumDatagrid regression | **Low** | Medium | Test keyboard navigation preserved |

---

## 7. Final Recommendation

**GO AHEAD** - This feature is safe to implement.

### Implementation Order

1. **Modify PremiumDatagrid** to accept and merge external `rowClassName`
2. **Add styling utilities** (if `bg-error-subtle` not already available via Tailwind)
3. **Implement in OpportunityList** with conditional logic
4. **Test** keyboard navigation still works, styling applies correctly

### Estimated Scope

- 1 file modification (PremiumDatagrid.tsx) - ~20 lines
- 1 feature addition (OpportunityList.tsx) - ~15 lines
- 0 database changes
- 0 new dependencies

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `src/components/admin/PremiumDatagrid.tsx` | Datagrid wrapper - needs modification |
| `src/index.css:300-400` | Semantic color definitions |
| `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` | Existing overdue calculation |
| `src/atomic-crm/opportunities/OpportunityList.tsx` | List implementation |
| `src/atomic-crm/validation/opportunities.ts` | Zod schema with date fields |
| `src/lib/date-utils.ts` | Date parsing utilities |
| `supabase/migrations/20251204220000_*.sql` | opportunities_summary view |
| `src/atomic-crm/opportunities/constants/stageConstants.ts` | Stage definitions |
| `src/atomic-crm/utils/stalenessCalculation.ts` | Stale threshold logic |
