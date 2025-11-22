# Polish and Consistency Plan

**Created:** 2025-11-22
**Status:** Planning Complete
**Estimated Total Effort:** 5-7 days

---

## Executive Summary

This plan covers three phases of work identified during codebase review:

1. **Phase B: Dashboard V3 Polish** - Enhance the new default dashboard with filtering, snooze, and drill-down features
2. **Phase C: Reports Module** - Complete missing report pages
3. **Phase D: Design System Consistency** - Fix Tailwind v4 semantic utility violations across the codebase

**Current State:**
- All 1,657 tests passing
- Dashboard V3 complete and production-ready (96.3% code review score)
- Color contrast validation: 19/19 tests passing (WCAG AA compliant)
- Design system violations identified in production code

---

## Phase B: Dashboard V3 Polish

**Priority:** High
**Estimated Effort:** 2-3 days

### B1. Fix "Assigned to Me" Filtering

**Problem:** The `sales.user_id` column exists but filtering returns zero results in production.

**Current State:**
- `useCurrentSale.ts` already queries using `user_id` with email fallback
- `sales` table has `user_id UUID` column with FK to `auth.users`
- Issue: Production data may have NULL `user_id` values (legacy users)

**Files to Modify:**
- `src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts` - Verify logic
- `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts` - Check filtering

**Tasks:**
- [ ] Verify `sales.user_id` is populated for all users in production
- [ ] Create migration to backfill `user_id` from `auth.users.email` match if needed
- [ ] Test "Assigned to Me" filtering returns correct results
- [ ] Add E2E test for filtering behavior

**Estimated Effort:** 0.5 days

---

### B2. Task Snooze Feature

**Problem:** Users cannot quickly postpone tasks by 1 day.

**Current State:**
- Task completion works via checkbox in `TasksPanel.tsx`
- No snooze functionality exists

**Files to Create/Modify:**
- `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx` - Add snooze button
- `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` - Add snooze mutation

**Tasks:**
- [ ] Add snooze button (alarm clock icon) next to each task
- [ ] Implement `snoozeTask` mutation: `UPDATE tasks SET due_date = due_date + INTERVAL '1 day'`
- [ ] Add optimistic UI update (task moves to appropriate bucket)
- [ ] Ensure 44px touch target for snooze button (WCAG compliance)
- [ ] Add unit test for snooze functionality
- [ ] Add E2E test for snooze workflow

**Estimated Effort:** 0.5 days

---

### B3. Pipeline Drill-Down

**Problem:** Clicking a principal row in the pipeline table does nothing - users want to see opportunities.

**Current State:**
- `PrincipalPipelineTable.tsx` displays rows but no click behavior
- `principal_pipeline_summary` view has `principal_id` for filtering

**Files to Create/Modify:**
- `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx` - Add row click handler
- `src/atomic-crm/dashboard/v3/components/PipelineDrillDownModal.tsx` - **NEW** modal component
- `src/atomic-crm/dashboard/v3/hooks/usePrincipalOpportunities.ts` - **NEW** data hook

**Tasks:**
- [ ] Create `PipelineDrillDownModal` component (slide-over or modal)
- [ ] Display principal name as header
- [ ] Fetch and display opportunities filtered by `principal_id`
- [ ] Show opportunity: name, stage, value, last activity date
- [ ] Add "View Details" link to full opportunity page
- [ ] Use `ResourceSlideOver` pattern per design system
- [ ] Ensure focus trap and ESC key handling (accessibility)
- [ ] Add unit tests for modal
- [ ] Add E2E test for drill-down workflow

**Estimated Effort:** 1-1.5 days

---

## Phase C: Reports Module Completion

**Priority:** Medium
**Estimated Effort:** 3-5 days

### C1. OpportunitiesByPrincipal Report Page

**Problem:** Dashboard widget exists but no dedicated report page with filtering/export.

**Current State:**
- Widget: `src/atomic-crm/dashboard/OpportunitiesByPrincipal.tsx` - 100% complete
- CSV export infrastructure: Ready
- Report page: Missing

**Reference:** `docs/plans/2025-11-04-opportunities-by-principal-report.md`

**Files to Create:**
- `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx` - **NEW**

**Tasks:**
- [ ] Create report page component reusing widget logic
- [ ] Add date range filter
- [ ] Add principal filter (dropdown)
- [ ] Add sales rep filter
- [ ] Implement CSV export using existing infrastructure
- [ ] Register in reports menu
- [ ] Add unit tests
- [ ] Add E2E test for export functionality

**Estimated Effort:** 2 days

---

### C2. Weekly Activity Summary Report

**Problem:** No report showing activity volume over time.

**Current State:**
- Activities table exists with full CRUD
- No aggregation report exists

**Reference:** `docs/plans/2025-11-04-complete-reports-module.md`

**Files to Create:**
- `src/atomic-crm/reports/WeeklyActivitySummaryReport.tsx` - **NEW**

**Tasks:**
- [ ] Create report page component
- [ ] Query activities grouped by week
- [ ] Show activity breakdown by type (call, email, meeting, etc.)
- [ ] Add date range filter
- [ ] Add sales rep filter
- [ ] Add chart visualization (bar chart by week)
- [ ] Implement CSV export
- [ ] Register in reports menu
- [ ] Add unit tests

**Estimated Effort:** 2-3 days

---

## Phase D: Design System Consistency

**Priority:** Medium
**Estimated Effort:** 1-2 days

### D1. Fix Inline CSS Variable Violations

**Problem:** Production code uses `text-[color:var(--...)]` instead of semantic utilities.

**Violations Found:**

#### High Priority (Active Features)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/atomic-crm/opportunities/OrganizationInfoCard.tsx` | 51 | `bg-[var(--brand-50)]` | `bg-primary/5` |
| `src/atomic-crm/opportunities/OrganizationInfoCard.tsx` | 51 | `border-[var(--brand-200)]` | `border-primary/20` |
| `src/atomic-crm/opportunities/OpportunityShow.tsx` | 134 | `bg-[var(--brand-100)]` | `bg-primary/10` |
| `src/atomic-crm/opportunities/OpportunityShow.tsx` | 134 | `text-[var(--brand-700)]` | `text-primary` |
| `src/atomic-crm/opportunities/CampaignGroupedList.tsx` | 188 | `bg-[var(--warning-default)]` | `bg-warning` |
| `src/atomic-crm/layout/Header.tsx` | 43 | `bg-[var(--brand-700)]` | `bg-primary` |
| `src/components/admin/FloatingCreateButton.tsx` | 64 | `bg-[var(--brand-700)]` | `bg-primary` |

#### Medium Priority (UI Components - shadcn)

| File | Lines | Issue | Fix |
|------|-------|-------|-----|
| `src/components/ui/card.tsx` | 35, 45 | `text-[color:var(--text-*)]` | `text-foreground`, `text-muted-foreground` |
| `src/components/ui/dialog.tsx` | 57, 103 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/ui/command.tsx` | 43, 61, 98, 124, 136 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/ui/table.tsx` | 84 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/ui/alert.tsx` | 52 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/ui/label.tsx` | 13 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/ui/textarea.tsx` | 10 | `placeholder:text-[color:var(--text-subtle)]` | `placeholder:text-muted-foreground` |
| `src/components/ui/accordion.tsx` | 40 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/ui/dropdown-menu.tsx` | 62, 160 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/admin/simple-form-iterator.tsx` | 316 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/admin/search-input.tsx` | 25 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `src/components/admin/select-input.tsx` | 239 | `text-[color:var(--text-subtle)]` | `text-muted-foreground` |

#### Low Priority (Story Files - Non-Production)

Story files in `src/components/ui/*.stories.tsx` also have violations but are documentation-only. Fix during component updates.

**Tasks:**
- [ ] Fix all High Priority files (7 files)
- [ ] Fix all Medium Priority files (12 files)
- [ ] Run `npm run validate:colors` after each batch
- [ ] Run `npm run build` to verify no TypeScript errors
- [ ] Run `npm run test:ci` to verify no test regressions

**Estimated Effort:** 1 day

---

### D2. Archive Cleanup

**Problem:** `archive/dashboard/` contains old components with violations.

**Files:**
- `archive/dashboard/HotContacts.tsx`
- `archive/dashboard/DashboardActivityLog.tsx`
- `archive/dashboard/LatestNotes.tsx`
- `archive/dashboard/MiniPipeline.tsx`
- `archive/dashboard/MetricsCardGrid.tsx`

**Tasks:**
- [ ] Review if archive files are needed
- [ ] Delete archive directory if obsolete
- [ ] If keeping, add `.gitignore` to exclude from builds

**Estimated Effort:** 0.5 hours

---

## Summary Table

| Phase | Task | Priority | Effort | Dependencies |
|-------|------|----------|--------|--------------|
| B1 | Fix Assigned to Me Filtering | High | 0.5 days | None |
| B2 | Task Snooze Feature | High | 0.5 days | None |
| B3 | Pipeline Drill-Down | High | 1.5 days | None |
| C1 | OpportunitiesByPrincipal Report | Medium | 2 days | None |
| C2 | Weekly Activity Summary Report | Medium | 2.5 days | None |
| D1 | Fix Inline CSS Variable Violations | Medium | 1 day | None |
| D2 | Archive Cleanup | Low | 0.5 hours | None |

**Total Estimated Effort:** 5-7 days (parallelizable: B + D can run concurrent with C)

---

## Recommended Execution Order

1. **Day 1:** B1 (filtering fix) + D1 (design system fixes - high priority files)
2. **Day 2:** B2 (task snooze) + D1 (design system fixes - medium priority files)
3. **Day 3:** B3 (pipeline drill-down)
4. **Day 4-5:** C1 (OpportunitiesByPrincipal report)
5. **Day 6-7:** C2 (Weekly Activity Summary report)

---

## Verification Checklist

After all phases complete:

- [ ] All tests passing: `npm run test:ci`
- [ ] Build succeeds: `npm run build`
- [ ] Color validation passes: `npm run validate:colors`
- [ ] No inline CSS variable usage: `grep -r "text-\[color:var" src/`
- [ ] Dashboard V3 filtering works
- [ ] Task snooze works
- [ ] Pipeline drill-down opens modal
- [ ] Both report pages accessible from reports menu
- [ ] CSV export works on both reports

---

## Related Documentation

- [Dashboard V3 Complete](./2025-11-18-dashboard-v3-COMPLETE.md) - Implementation details
- [PRD Completion Master Plan](./2025-11-04-prd-completion-master-plan.md) - Overall roadmap
- [Unified Design System Rollout](./2025-11-16-unified-design-system-rollout.md) - Design patterns
- [Engineering Constitution](../claude/engineering-constitution.md) - Core principles

---

*Plan Author: Claude Code (AI Agent)*
*Review Date: 2025-11-22*
