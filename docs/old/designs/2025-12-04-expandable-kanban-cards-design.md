# Expandable Kanban Cards Design

**Date:** 2025-12-04
**Status:** Implemented ✅

## Problem Statement

The current Kanban opportunity cards have several UX issues:
1. **Truncation** - Opportunity names get cut off (e.g., "Rapid Rasoi - Marriott..." loses context)
2. **Missing Visual Cues** - No activity pulse, task status, or product count visible
3. **Column Width** - 280px max width is too narrow for meaningful content display
4. **Information Overload** - Adding more fields would clutter the compact view

## Decision

Implement **Layout D: Expandable Card** with wider columns:

- **Collapsed State (default):** Compact single-line showing activity pulse, truncated name, expand toggle, and actions
- **Expanded State (on click):** Full details including all visual cues
- **Column Widths:** Increase from 240-280px to 300-340px (responsive)

### Visual Cue Legend

| Icon | Meaning | States |
|------|---------|--------|
| 🟢🟡🔴 | Activity Pulse | Green <7d, Yellow 7-14d, Red >14d since last activity |
| ⏱️ | Days in Stage | Number shown, ⚠️ if >14d (stuck) |
| 📋 | Tasks | Count shown, 🔴 if overdue |
| 📦 | Products | Count of attached products |
| 📅 | Close Date | Red if overdue, yellow if <7d away |

## Alternatives Considered

### Layout A: Compact Row (Current + Fixed)
- Keep current layout, just fix truncation with wider columns
- **Rejected:** Doesn't solve missing visual cues problem

### Layout B: Structured Zones
- Fixed zones for each data type (header, badges, metadata, footer)
- **Rejected:** Still cluttered, no progressive disclosure

### Layout C: Icon Strip Footer
- Add icon strip at bottom of card for visual cues
- **Rejected:** Icons without context confuse users; still truncation issues

## Design Details

### Data Requirements

**New columns needed in `opportunities_summary` view:**

```sql
-- Activity Pulse: days since last interaction
(SELECT EXTRACT(DAY FROM (NOW() - MAX(i.date)))::integer
 FROM interactions i
 WHERE i.opportunity_id = o.id) AS days_since_last_activity,

-- Task counts
(SELECT COUNT(*) FROM tasks t
 WHERE t.opportunity_id = o.id
 AND t.status = 'pending') AS pending_task_count,

(SELECT COUNT(*) FROM tasks t
 WHERE t.opportunity_id = o.id
 AND t.status = 'pending'
 AND t.due_date < NOW()) AS overdue_task_count
```

**Already available:**
- `days_in_stage` (added in migration 20251204205132)
- `products` (JSONB array)
- `estimated_close_date`
- `principal_organization_name`
- `priority`

### Component Structure

```
OpportunityCard (enhanced)
├── CardHeader (always visible)
│   ├── ActivityPulseDot (🟢🟡🔴)
│   ├── OpportunityName (truncated in collapsed)
│   ├── ExpandToggle [▼/▲]
│   └── ActionsMenu (⋮)
│
└── CardDetails (expanded only, animated)
    ├── Description (if exists)
    ├── BadgeRow [Priority] [Principal]
    ├── ContactRow (👤 name)
    ├── CloseDateRow (📅 date + urgency color)
    ├── DaysInStageRow (⏱️ days + stuck warning)
    ├── TasksRow (📋 count + overdue indicator)
    └── ProductsRow (📦 count)
```

### State Management

Local state per card (not global):
```tsx
const [isExpanded, setIsExpanded] = useState(false);
```

### Animation

CSS grid-rows animation for smooth expand/collapse:
```tsx
<div className={`
  grid transition-[grid-template-rows] duration-200 ease-out
  ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
`}>
  <div className="overflow-hidden">
    {/* CardDetails content */}
  </div>
</div>
```

### Column Widths

| Breakpoint | Min Width | Max Width |
|------------|-----------|-----------|
| Default (mobile/iPad portrait) | 260px | 300px |
| md (iPad landscape) | 280px | 320px |
| lg (Desktop 1440px+) | 300px | 340px |

```tsx
className="min-w-[260px] max-w-[300px] md:min-w-[280px] md:max-w-[320px] lg:min-w-[300px] lg:max-w-[340px]"
```

### Accessibility

| Element | ARIA | Keyboard |
|---------|------|----------|
| Card | `role="button"` | Enter/Space opens slide-over |
| Expand toggle | `aria-expanded={isExpanded}` | Click toggles |
| Pulse dot | `aria-label="Last activity X days ago"` | — |
| Overdue indicator | `role="status"` | Screen reader announces |

## Engineering Principles Applied

- [x] **Fail-fast** - No retry logic for fetching card data
- [x] **Single source of truth** - All data via `unifiedDataProvider` from `opportunities_summary` view
- [x] **Zod at API boundary only** - Validation in data provider, not in card component
- [x] **interface for objects, type for unions** - Card props use interface
- [x] **Performance** - O(1) queries via expanded view, not N+1 hooks

## Files to Modify

1. `supabase/migrations/YYYYMMDD_add_activity_and_task_counts_to_opportunities_summary.sql` - New migration
2. `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` - Expandable card component
3. `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` - Column width adjustments
4. `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx` - Container gap adjustment
5. `src/atomic-crm/types.ts` - Update Opportunity type with new fields

## Open Questions

None - design validated through brainstorming session.

## Research References

- **React Admin Data Fetching:** Query aggregation solves N+1 problem (marmelab docs)
- **Supabase Computed Relationships:** PostgREST inlines SQL functions efficiently
- **Ant Design Cards:** "Max 4 lines" guideline for card content
- **Salesforce Badges:** Semantic color patterns (success/warning/error)

---

## Implementation Notes

**Implemented:** 2025-12-04

### Key Implementation Details

- **Migration:** `20251204220000_add_activity_task_counts_to_opportunities_summary.sql`
- **Activity Pulse Thresholds:** <7d green, 7-14d yellow, >14d red, null gray
- **Animation:** CSS grid-rows transition (200ms ease-out)
- **Touch Target:** Expand button prevents drag via `onMouseDown`/`onTouchStart` stopPropagation

### Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/20251204220000_*.sql` | Added 3 computed columns to opportunities_summary |
| `src/atomic-crm/types.ts` | Added `days_since_last_activity`, `pending_task_count`, `overdue_task_count` |
| `src/atomic-crm/opportunities/kanban/ActivityPulseDot.tsx` | New component for activity indicator |
| `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` | Refactored to expandable card |
| `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` | Responsive column widths (260-340px) |
| `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx` | Gap increased from gap-4 to gap-5 |
| `tests/e2e/support/poms/OpportunitiesListPage.ts` | Added expand/collapse POM methods |
| `tests/e2e/opportunities/kanban-expand.spec.ts` | E2E tests for expand/collapse behavior |

### Test Coverage

- **Unit Tests:** 36 tests (9 ActivityPulseDot + 27 OpportunityCard)
- **E2E Tests:** 6 tests covering expand/collapse, pulse colors, and visual cues
