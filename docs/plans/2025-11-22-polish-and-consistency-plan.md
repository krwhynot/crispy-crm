# Polish and Consistency Plan

**Created:** 2025-11-22
**Updated:** 2025-11-22 (v2 - comprehensive review)
**Status:** Planning Complete
**Estimated Total Effort:** 4-5 days

---

## Executive Summary

This plan covers work identified during comprehensive codebase review:

1. **Phase B: Dashboard V3 Polish** - Enhance filtering, add snooze and drill-down features
2. ~~**Phase C: Reports Module**~~ - **ALREADY COMPLETE** (4-tab reports page exists)
3. **Phase D: Design System Consistency** - Fix Tailwind v4 semantic utility violations
4. **Phase E: Test Health** - Fix skipped tests and incomplete TODOs
5. **Phase F: Dashboard Widget Completeness** - Implement remaining TODOs

**Current State:**
- All 1,657 tests passing (27 skipped)
- Dashboard V3 complete and production-ready (96.3% code review score)
- Reports module complete with 4 tabs (Overview, Opportunities, Weekly Activity, Campaign Activity)
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

## ~~Phase C: Reports Module Completion~~ ✅ COMPLETE

**Status:** Already implemented!

The reports module exists at `src/atomic-crm/reports/` with:
- **ReportsPage.tsx** - Main page with 4 tabs
- **tabs/OverviewTab.tsx** - Overview dashboard
- **tabs/OpportunitiesTab.tsx** - Opportunities by Principal report
- **tabs/WeeklyActivityTab.tsx** - Weekly Activity Summary
- **tabs/CampaignActivityTab.tsx** - Campaign Activity report

**Files:**
- `OpportunitiesByPrincipalReport.tsx` (506 lines)
- `WeeklyActivitySummary.tsx` (309 lines)
- `CampaignActivity/CampaignActivityReport.tsx`
- Full infrastructure: charts/, components/, contexts/, hooks/, utils/

**No action required.**

---

## Phase D: Design System Consistency

**Priority:** Medium
**Estimated Effort:** 1 day

### D1. Fix Inline CSS Variable Violations

**Problem:** Production code uses `text-[color:var(--...)]` instead of semantic utilities.

**Violations Found:**

#### High Priority (Active Features) - 7 files

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/atomic-crm/opportunities/OrganizationInfoCard.tsx` | 51 | `bg-[var(--brand-50)]` | `bg-primary/5` |
| `src/atomic-crm/opportunities/OrganizationInfoCard.tsx` | 51 | `border-[var(--brand-200)]` | `border-primary/20` |
| `src/atomic-crm/opportunities/OpportunityShow.tsx` | 134 | `bg-[var(--brand-100)]` | `bg-primary/10` |
| `src/atomic-crm/opportunities/OpportunityShow.tsx` | 134 | `text-[var(--brand-700)]` | `text-primary` |
| `src/atomic-crm/opportunities/CampaignGroupedList.tsx` | 188 | `bg-[var(--warning-default)]` | `bg-warning` |
| `src/atomic-crm/layout/Header.tsx` | 43 | `bg-[var(--brand-700)]` | `bg-primary` |
| `src/components/admin/FloatingCreateButton.tsx` | 64 | `bg-[var(--brand-700)]` | `bg-primary` |

#### Medium Priority (UI Components - shadcn) - 12 files

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

Story files in `src/components/ui/*.stories.tsx` - fix during component updates.

**Tasks:**
- [ ] Fix all High Priority files (7 files)
- [ ] Fix all Medium Priority files (12 files)
- [ ] Run `npm run validate:colors` after each batch
- [ ] Run `npm run build` to verify no TypeScript errors
- [ ] Run `npm run test:ci` to verify no test regressions

**Estimated Effort:** 0.5 days

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
- [ ] If keeping, add to `.gitignore` to exclude from linting

**Estimated Effort:** 0.5 hours

---

## Phase E: Test Health

**Priority:** Medium
**Estimated Effort:** 1-2 days

### E1. Fix Skipped Tests (27 tests)

**Problem:** 27 tests are skipped across the codebase, indicating incomplete functionality or broken test infrastructure.

#### QuickAdd Integration Tests (7 skipped)
**File:** `src/atomic-crm/opportunities/__tests__/QuickAdd.integration.test.tsx`
**Root Cause:** City field changed from Input to Combobox - test helpers need updating

| Line | Test | Issue |
|------|------|-------|
| 155 | completes full atomic creation flow | City Combobox interaction |
| 241 | handles Save & Add Another flow | City Combobox interaction |
| 332 | handles errors and preserves form data | City Combobox interaction |
| 379 | validates phone OR email requirement | City Combobox interaction |
| 455 | filters products by selected principal | City Combobox interaction |
| 507 | auto-fills state when city is selected | City Combobox interaction |
| 552 | preserves campaign preferences | City Combobox interaction |

**Tasks:**
- [ ] Create Combobox test helpers (select, type, clear)
- [ ] Update all 7 QuickAdd integration tests
- [ ] Verify tests pass

#### QuickAddForm Tests (2 skipped)
**File:** `src/atomic-crm/opportunities/__tests__/QuickAddForm.test.tsx`

| Line | Test | Issue |
|------|------|-------|
| 156 | handles Save & Add Another correctly | Combobox helpers |
| 198 | handles Save & Close correctly | Combobox helpers |

#### ContactList Filter Tests (4 skipped)
**File:** `src/atomic-crm/contacts/__tests__/ContactList.test.tsx`
**Root Cause:** FilterCategory mock not working

| Line | Test | Issue |
|------|------|-------|
| 431 | renders tag filters | FilterCategory mock |
| 441 | renders last activity filters | FilterCategory mock |
| 451 | renders account manager filter | FilterCategory mock |
| 457 | renders last activity date filters | FilterCategory mock |

**Tasks:**
- [ ] Fix FilterCategory mock implementation
- [ ] Re-enable all 4 filter tests

#### UpdateOpportunityStep Tests (7 skipped)
**File:** `src/atomic-crm/dashboard/__tests__/UpdateOpportunityStep.test.tsx`

| Line | Test | Issue |
|------|------|-------|
| 84 | shows error state when fetch fails | Async timing |
| 113 | calls onSkip when "Continue Anyway" clicked | Async timing |
| 162 | disables current stage in dropdown | Select interaction |
| 213 | shows stage transition indicator | Select interaction |
| 269 | calls onUpdate with selected stage | Select interaction |
| 298 | disables buttons while submitting | Submit state |

#### Other Skipped Tests (7 skipped)

| File | Test | Issue |
|------|------|-------|
| `QuickLogActivity.test.tsx:530` | keyboard navigation | A11y testing |
| `QuickCompleteTaskModal.test.tsx:85` | Step 1 skip button | Modal flow |
| `PrincipalDashboard.test.tsx:90` | Entire describe block | Legacy dashboard |
| `authProvider.test.ts:56` | valid session access | Auth mocking |
| `authProvider.test.ts:338` | cache sale record | Auth mocking |

**Estimated Effort:** 1-1.5 days

---

### E2. Address Code TODOs

**Problem:** Production code contains unfinished TODOs that should be resolved.

#### High Priority TODOs

| File | Line | TODO | Action |
|------|------|------|--------|
| `MyTasksThisWeek.tsx` | 102 | Call API to mark task complete | Implement checkbox handler |
| `CompactGridDashboard.tsx` | 73 | Calculate weeklyActivities | Query activities from last 7 days |
| `CompactGridDashboard.tsx` | 74 | Get assignedReps | Join with opportunities relationship |
| `PipelineSummary.tsx` | 129 | Calculate atRisk from principals | Implement pipeline health logic |
| `OpportunitiesByPrincipalDesktop.tsx` | 40 | Implement actual export | Wire up CSV export |

#### Medium Priority TODOs (Future Features)

| File | Line | TODO | Notes |
|------|------|------|-------|
| `avatar.utils.ts` | 97, 117 | LinkedIn image integration | Requires LinkedIn API |
| `getContactAvatar.ts` | 62 | LinkedIn image for contacts | Requires LinkedIn API |
| `getOrganizationAvatar.ts` | 8 | LinkedIn image for orgs | Requires LinkedIn API |

**Tasks:**
- [ ] Implement task completion in MyTasksThisWeek checkbox
- [ ] Add weeklyActivities calculation to CompactGridDashboard
- [ ] Add assignedReps lookup to CompactGridDashboard
- [ ] Implement atRisk calculation in PipelineSummary
- [ ] Wire up export in OpportunitiesByPrincipalDesktop

**Estimated Effort:** 0.5 days

---

## Phase F: Dashboard Widget Completeness

**Priority:** Low
**Estimated Effort:** 0.5 days

### F1. Complete Legacy Dashboard Widgets

**Problem:** Some legacy dashboard widgets have incomplete functionality.

**Files:**
- `src/atomic-crm/dashboard/MyTasksThisWeek.tsx` - Task completion TODO
- `src/atomic-crm/dashboard/CompactGridDashboard.tsx` - Missing calculations
- `src/atomic-crm/dashboard/PipelineSummary.tsx` - Missing atRisk calculation

**Note:** These are legacy dashboards (V1/V2). Consider deprecating in favor of Dashboard V3.

**Tasks:**
- [ ] Decide: Fix legacy dashboards OR mark as deprecated
- [ ] If fixing: Implement missing functionality
- [ ] If deprecating: Add deprecation notice, plan removal

**Estimated Effort:** 0.5 days (if fixing)

---

## Summary Table

| Phase | Task | Priority | Effort | Status |
|-------|------|----------|--------|--------|
| B1 | Fix Assigned to Me Filtering | High | 0.5 days | Pending |
| B2 | Task Snooze Feature | High | 0.5 days | Pending |
| B3 | Pipeline Drill-Down | High | 1.5 days | Pending |
| ~~C~~ | ~~Reports Module~~ | ~~Medium~~ | ~~N/A~~ | ✅ Complete |
| D1 | Fix CSS Variable Violations | Medium | 0.5 days | Pending |
| D2 | Archive Cleanup | Low | 0.5 hours | Pending |
| E1 | Fix Skipped Tests (27) | Medium | 1.5 days | Pending |
| E2 | Address Code TODOs | Medium | 0.5 days | Pending |
| F1 | Legacy Dashboard Widgets | Low | 0.5 days | Pending |

**Total Estimated Effort:** 4-5 days

---

## Recommended Execution Order

### Day 1: Quick Wins
- D1: Fix design system violations (high priority files)
- D2: Archive cleanup
- B1: Verify/fix filtering

### Day 2: Dashboard Features
- B2: Task snooze feature
- E2: Address high-priority TODOs

### Day 3: Pipeline Drill-Down
- B3: Pipeline drill-down modal (full day)

### Day 4-5: Test Health
- E1: Fix skipped tests
  - Create Combobox test helpers
  - Fix QuickAdd tests
  - Fix ContactList filter tests
  - Fix UpdateOpportunityStep tests

### Optional (if time permits)
- F1: Legacy dashboard widget fixes

---

## Verification Checklist

After all phases complete:

- [ ] All tests passing: `npm run test:ci`
- [ ] No skipped tests (or documented reasons)
- [ ] Build succeeds: `npm run build`
- [ ] Color validation passes: `npm run validate:colors`
- [ ] No inline CSS variable usage: `grep -r "text-\[color:var" src/`
- [ ] Dashboard V3 filtering works
- [ ] Task snooze works
- [ ] Pipeline drill-down opens modal

---

## Appendix: All TODOs Found

```
src/atomic-crm/dashboard/MyTasksThisWeek.tsx:102:    // TODO: Call API to mark task complete
src/atomic-crm/dashboard/CompactGridDashboard.tsx:73:    weeklyActivities: 0, // TODO: Calculate from activities
src/atomic-crm/dashboard/CompactGridDashboard.tsx:74:    assignedReps: [], // TODO: Get from opportunities
src/atomic-crm/dashboard/PipelineSummary.tsx:129:    atRisk=0 (TODO: calculate from principals)
src/atomic-crm/dashboard/OpportunitiesByPrincipalDesktop.tsx:40:    // TODO: Implement actual export
src/atomic-crm/utils/avatar.utils.ts:97:    // TODO: Step 3: Try to get image from LinkedIn.
src/atomic-crm/utils/avatar.utils.ts:117:  // TODO: Step 1: Try to get image from LinkedIn.
src/atomic-crm/providers/commons/getContactAvatar.ts:62:    // TODO: Step 3: LinkedIn image
src/atomic-crm/providers/commons/getOrganizationAvatar.ts:8:  // TODO: Step 1: LinkedIn image
```

## Appendix: All Skipped Tests

```
src/atomic-crm/contacts/__tests__/ContactList.test.tsx (4 skipped)
src/atomic-crm/dashboard/__tests__/UpdateOpportunityStep.test.tsx (7 skipped)
src/atomic-crm/dashboard/__tests__/QuickCompleteTaskModal.test.tsx (1 skipped)
src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx (4 skipped - entire describe)
src/atomic-crm/dashboard/QuickActionModals/__tests__/QuickLogActivity.test.tsx (1 skipped)
src/atomic-crm/opportunities/__tests__/QuickAdd.integration.test.tsx (7 skipped)
src/atomic-crm/opportunities/__tests__/QuickAddForm.test.tsx (2 skipped)
src/atomic-crm/providers/supabase/__tests__/authProvider.test.ts (2 skipped)
```

---

## Related Documentation

- [Dashboard V3 Complete](./2025-11-18-dashboard-v3-COMPLETE.md) - Implementation details
- [PRD Completion Master Plan](./2025-11-04-prd-completion-master-plan.md) - Overall roadmap
- [Unified Design System Rollout](./2025-11-16-unified-design-system-rollout.md) - Design patterns
- [Engineering Constitution](../claude/engineering-constitution.md) - Core principles

---

*Plan Author: Claude Code (AI Agent)*
*Initial Review: 2025-11-22*
*Updated: 2025-11-22 (comprehensive codebase review)*
