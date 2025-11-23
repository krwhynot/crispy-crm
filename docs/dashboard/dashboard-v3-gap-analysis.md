# Dashboard V3 Gap Analysis

**Date:** 2025-11-23
**Status:** Analysis Complete
**Scope:** PrincipalDashboardV3 and all child components

---

## Executive Summary

The Dashboard V3 provides a solid foundation with proper loading states, error handling, accessibility attributes, and design system compliance. However, there are **20+ unimplemented features** ranging from placeholder comments to dead buttons.

### Key Findings

| Category | Status |
|----------|--------|
| Core rendering | Good - loading/error states exist |
| Design system compliance | Good - semantic classes used correctly |
| Accessibility | Good - ARIA labels, keyboard handlers present |
| Feature completeness | Poor - many placeholder implementations |
| Test coverage | Poor - tests mock away actual functionality |

---

## Component Analysis

### 1. PrincipalPipelineTable

**Location:** `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`

#### Issues Found

| Issue | Severity | Line | Current State |
|-------|----------|------|---------------|
| Empty Filter Menu | Medium | 108-110 | `{/* Filter options will be added in next task */}` |
| No Sorting | Medium | 121-127 | Headers render without onClick or sort state |
| No Pagination | Medium | 129-182 | `data.map()` renders all rows |
| Dead "Schedule follow-up" Button | **High** | 175-177 | `<Button>` has no onClick handler |
| No Empty State | Medium | 129 | No conditional for `data.length === 0` |
| No Search | Medium | - | No search input or filter state |

#### Positive Observations

- Proper loading skeleton (lines 52-66)
- Error state handling (lines 68-77)
- Accessibility: `role="button"`, `aria-label`, keyboard handlers (lines 135-143)
- Uses `.table-row-premium` class per design system (line 133)
- Drill-down sheet implemented via `PipelineDrillDownSheet` (lines 187-192)

---

### 2. TasksPanel

**Location:** `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx`

#### Issues Found

| Issue | Severity | Line | Current State |
|-------|----------|------|---------------|
| "Drag to reschedule" Not Implemented | **Critical** | 79 | UI text promises feature that doesn't exist |
| Dead "More" Menu Button | **High** | 218-220 | `<MoreHorizontal>` button with no onClick |
| No Task Creation | **High** | - | No "Add Task" button anywhere |
| Limited Date Range | Medium | 23-26 | Only shows Overdue/Today/Tomorrow |
| No Snooze Feedback | Medium | 137-146 | Task disappears silently (no toast) |
| Empty Groups Still Shown | Low | 99-121 | Today/Tomorrow render even with 0 tasks |

#### Positive Observations

- Proper touch targets: `className="h-11 w-11"` (lines 206, 218)
- Loading state with snooze spinner feedback (lines 212-216)
- Uses `.interactive-card` class per design system (line 179)
- Priority badge variants mapped correctly (lines 163-176)

---

### 3. QuickLoggerPanel

**Location:** `src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx`

#### Issues Found

| Issue | Severity | Line | Current State |
|-------|----------|------|---------------|
| No Data Refresh | **High** | 37-40 | `onRefresh` is empty: `// Will be implemented in Task 6` |
| No Recent Activities View | Medium | - | Only shows form, no activity history |

#### Positive Observations

- Cancel button exists in `QuickLogForm` (line 655-657)
- Proper touch target on "New Activity" button (line 29)
- Comprehensive form with cascading filters (contact -> org -> opportunity)

---

### 4. QuickLogForm

**Location:** `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

**Status:** Well-implemented

- Zod validation with `zodResolver` (line 64-66)
- Form defaults from schema: `activityLogSchema.partial().parse({})` (line 66)
- Proper `h-11` touch targets throughout
- Cascading field relationships (contact filters opportunities by org)
- "Save & New" workflow for bulk entry (lines 662-675)
- Follow-up task creation integrated (lines 219-238)

---

## Test Coverage Analysis

### Current State: Superficial Mocking

| Test File | What It Tests | What's Missing |
|-----------|---------------|----------------|
| `PrincipalPipelineTable.test.tsx` | Headers render, CSS class exists | Row interactions, sorting, filtering, drill-down |
| `TasksPanel.test.tsx` | Panel renders, groups exist | Complete, snooze, menu actions |
| `QuickLoggerPanel.test.tsx` | Panel renders, button shows form | Form submission, validation, refresh callback |

### Anti-Pattern Identified

Every test mocks the hooks (`vi.mock("../../hooks/...")`) and only tests static rendering. This prevents testing:

- Loading and error states
- User interactions
- Hook parameter changes (e.g., `myPrincipalsOnly` toggle)

---

## Prioritized Improvement Plan

### Phase 1: Quick Wins (4-8 hours)

High impact, low effort fixes:

| # | Task | Component | Effort |
|---|------|-----------|--------|
| 1 | Add empty state when `data.length === 0` | PrincipalPipelineTable | 30 min |
| 2 | Hide empty Today/Tomorrow groups | TasksPanel | 30 min |
| 3 | Add snooze success toast | TasksPanel | 30 min |
| 4 | Remove "Drag to reschedule" text | TasksPanel | 5 min |
| 5 | Wire up `onRefresh` callback | QuickLoggerPanel/Dashboard | 2 hrs |

### Phase 2: Core Functionality (12-16 hours)

| # | Task | Component | Effort |
|---|------|-----------|--------|
| 6 | Implement "More" menu (Edit, Delete, View) | TasksPanel | 3 hrs |
| 7 | Add "New Task" button + modal | TasksPanel | 4 hrs |
| 8 | Implement column sorting | PrincipalPipelineTable | 3 hrs |
| 9 | Add search/filter by principal name | PrincipalPipelineTable | 3 hrs |
| 10 | Populate filter dropdown menu | PrincipalPipelineTable | 2 hrs |

### Phase 3: Enhanced UX (8-16 hours)

| # | Task | Component | Effort |
|---|------|-----------|--------|
| 11 | Implement "Schedule follow-up" action | PrincipalPipelineTable | 4 hrs |
| 12 | Add pagination/virtualization | PrincipalPipelineTable | 4 hrs |
| 13 | Extended date range (This Week/Month) | TasksPanel | 3 hrs |
| 14 | Recent activities view | QuickLoggerPanel | 4 hrs |

### Phase 4: Drag-and-Drop (16-24 hours)

| # | Task | Component | Effort |
|---|------|-----------|--------|
| 15 | Implement drag-and-drop task rescheduling | TasksPanel | 16-24 hrs |

### Phase 5: Testing (8-12 hours)

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 16 | Integration tests for PrincipalPipelineTable | Sorting, filtering, row clicks | 3 hrs |
| 17 | Integration tests for TasksPanel | Complete, snooze, menu actions | 3 hrs |
| 18 | Integration tests for QuickLoggerPanel | Form submission, validation | 3 hrs |
| 19 | E2E tests for dashboard workflow | Full user flow | 3 hrs |

---

## Technical Notes

### Placeholder Comments Found

These comments indicate deliberate deferral during initial development:

```typescript
// PrincipalPipelineTable.tsx:109
{/* Filter options will be added in next task */}

// QuickLoggerPanel.tsx:38-39
// Dashboard data refresh callback
// Will be implemented in Task 6 when hooking up Supabase
```

### Design System Compliance

All components correctly use:
- `.table-row-premium` for table rows
- `.interactive-card` for interactive elements
- `.card-container` for card wrappers
- `h-11 w-11` (44px) touch targets
- Semantic color classes (`text-muted-foreground`, `text-destructive`, etc.)

---

## Recommendations

1. **Immediate:** Remove "Drag to reschedule" text until the feature is implemented - it's a false promise
2. **Short-term:** Implement Phase 1 quick wins to improve immediate UX
3. **Medium-term:** Add "More" menu and "New Task" button - most noticeable gaps for daily use
4. **Long-term:** Replace mock-heavy tests with integration tests using MSW or test data providers

---

## Related Documentation

- [Engineering Constitution](../claude/engineering-constitution.md)
- [Design System](../design-system/)
- [Testing Quick Reference](../development/testing-quick-reference.md)
