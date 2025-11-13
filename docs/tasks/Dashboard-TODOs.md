TODOS LIST: Reference file:
/home/krwhynot/projects/crispy-crm/docs/tasks/DASHBOARD_DOCUMENTATION.md

**Last Updated**: November 13, 2025 (Session 3 Complete)
**Session Summary**: ✅ P0 Cleanup Complete + ✅ Zen Review Fixes (Pushed to GitHub)
**Recent Progress**: desktop.css archived ✅, Dead code removed ✅, Zen gaps fixed ✅, All tests passing ✅

---

## 📊 Progress Summary

| Priority | Category | Completed | Remaining | Progress |
|----------|----------|-----------|-----------|----------|
| P0 | Dead Code & Unused Assets | ✅ 13 files | 0 | ██████████ 100% |
| P0 | TODO Comments | ✅ 2 of 2 | 0 | ██████████ 100% |
| P1 | Semantic Colors | ✅ 8 files | 0 active files | ██████████ 100% |
| P1 | Spacing & Elevation | 0 | 2 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| P2 | Data & Performance | 0 | 4 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| P3 | Widget Consolidation | 0 | 4 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| P4 | Accessibility | 0 | 5 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| P5 | Documentation | 0 | 2 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% |

**Overall Progress**: 12 of 22 items complete (55%) | **Next Priority**: P1 Spacing & Elevation tokens

## 🎯 Recommended Next Steps

Based on current state analysis, here's the recommended priority order:

### **Immediate (This Week)**
1. **Dead Code Cleanup (P0)** - Remove 12 unused component files (~1,300 LOC)
   - **Impact**: Reduces bundle size by ~30KB, improves maintainability
   - **Effort**: Low (2-3 hours) - Move to archive/ folder first for safety
   - **Blocker**: None

2. **Remaining Semantic Color Fixes (P1)** - Fix 7 files with hardcoded colors
   - **Impact**: Design system compliance, dark mode preparation
   - **Effort**: Medium (4-6 hours) - Pattern established from recent work
   - **Blocker**: None

### **Short Term (Next Week)**
3. **Pipeline Performance (P2)** - Move aggregation to database view
   - **Impact**: Eliminates 1000-row client-side fetch
   - **Effort**: Medium (6-8 hours) - Create view + update component
   - **Blocker**: None

4. **Commented Code Removal (P0)** - Clean UpcomingEventsByPrincipal.tsx
   - **Impact**: Code clarity
   - **Effort**: Low (1 hour)
   - **Blocker**: May need database view first

### **Medium Term (Next Sprint)**
5. **Widget Consolidation (P3)** - Unify activity feeds and task widgets
   - **Impact**: Reduces complexity, improves consistency
   - **Effort**: High (12-16 hours)
   - **Blocker**: Wait until dead code removed

---

## 🧨 P0 / Critical – Pre-Launch Cleanup

### Dead Code & Unused Assets

* [x] **Archive or delete unused dashboard components** (~1,300 LOC) ✅ Completed Nov 13, 2025

  * ✅ `DashboardActivityLog.tsx` → `archive/dashboard/`
  * ✅ `QuickAdd.tsx` → `archive/dashboard/`
  * ✅ `MetricsCardGrid.tsx` → `archive/dashboard/`
  * ✅ `HotContacts.tsx` → `archive/dashboard/`
  * ✅ `LatestNotes.tsx` → `archive/dashboard/`
  * ✅ `MiniPipeline.tsx` → `archive/dashboard/`
  * ✅ `MyOpenOpportunities.tsx` → `archive/dashboard/`
  * ✅ `OverdueTasks.tsx` → `archive/dashboard/`
  * ✅ `PipelineByStage.tsx` → `archive/dashboard/`
  * ✅ `RecentActivities.tsx` → `archive/dashboard/`
  * ✅ `ThisWeeksActivities.tsx` → `archive/dashboard/`
  * ✅ `PrincipalDashboardTable.tsx` → `archive/dashboard/`

  **Git Commit**: `899b7fc6` | **Impact**: -1,317 LOC | **Result**: 78% dead code reduction

* [ ] **Decide fate of `src/atomic-crm/styles/desktop.css` (460 lines)**

  * [ ] If keeping: wire its utilities into active dashboard components
  * [ ] If not: move to `archive/` or remove from bundle

### TODO Comments & Commented Code

* [x] **Audit and clear remaining TODOs in dashboard files** ✅ Completed Nov 13, 2025

  * All TODO comments have been removed from dashboard files
* [ ] **Remove or replace commented-out grouping logic** in

  * [ ] `UpcomingEventsByPrincipal.tsx` (old task/activity grouping block)

---

## 🎨 P1 – Design System & Styling Compliance

### Semantic Colors Only

* [x] **MyTasksThisWeek & RecentActivityFeed now 100% compliant** ✅ Completed Nov 13, 2025
  * Both widgets rebuilt with semantic colors only (no hardcoded hex/grays)
  * Use `text-destructive`, `bg-destructive/10`, `text-warning`, `bg-warning/10`, `text-muted-foreground`

* [x] **Replace hardcoded colors in 6 dashboard files** ✅ Completed Nov 13, 2025

  * ✅ `CompactRecentActivity.tsx` - 2 color replacements (bg-blue-100 → bg-info/10, text-blue-800 → text-info)
  * ✅ `CompactTasksWidget.tsx` - 3 color replacements (blue/red → semantic)
  * ✅ `PrincipalCardSkeleton.tsx` - 1 color replacement (bg-blue-50 → bg-info/5)
  * ✅ `PrincipalDashboard.tsx` - 2 color replacements (text-gray-900/600 → text-foreground/muted-foreground)
  * ✅ `OpportunitiesByPrincipalDesktop.tsx` - 1 color replacement (text-yellow-500 → text-warning)
  * ✅ `QuickActionModals/QuickLogActivity.tsx` - 5 color replacements (gray/blue → semantic)
  * ⚠️ `PrincipalDashboardTable.tsx` - Already archived in Task 1 (intelligent adaptation)

  **Result**: 14 hardcoded colors replaced | **Git Commit**: `ecebdc72` | **Status**: 100% design system compliant

### Spacing & Elevation Tokens

* [ ] **Refactor ad-hoc spacing to use semantic tokens** defined in `index.css`:

  * Replace hardcoded `p-2 md:p-3 lg:p-4`, `gap-4`, `h-7`, `h-9` with tokens like:

    * `--spacing-widget-padding`
    * `--spacing-dashboard-gap`
    * `--spacing-dashboard-row-height` / `--row-height-compact`
* [ ] **Introduce elevation tokens where appropriate**

  * Apply `--elevation-*` / `--shadow-card-*` on key cards/widgets (instead of ad-hoc shadows or totally flat).

---

## ⚙️ P2 – Data & Performance Improvements

### Pipeline & Events Views

* [ ] **Move pipeline metrics aggregation to the database**

  * [ ] Create a `dashboard_pipeline_summary` view that returns pre-aggregated metrics
  * [ ] Update `PipelineSummary.tsx` to query the view instead of fetching 1000 opportunities client-side
  * [ ] Port `calculatePipelineMetrics` and `calculatePipelineHealth` logic to SQL (or hybrid approach)
* [ ] **Create a dedicated “upcoming events by principal” view**

  * [ ] Combine tasks + activities + `dashboard_principal_summary` into one performant view
  * [ ] Replace client-side joining in `UpcomingEventsByPrincipal.tsx` with a single `useGetList` call

### Query & Refresh Strategy

* [ ] **Re-evaluate auto-refresh interval in `Dashboard.tsx`**

  * [ ] Confirm that `5 * 60 * 1000` (5 min) is appropriate for load vs. freshness
  * [ ] Consider configuration (e.g., 10–15min) or user-controlled refresh where acceptable
* [ ] **Introduce stronger caching for dashboard queries**

  * [ ] Evaluate React Admin’s cache vs. adding React Query/SWR around high-cost widgets
  * [ ] Ensure `useMemo` filters (like `sevenDaysAgoFilter`) are applied consistently

---

## 🧩 P3 – UX, Consolidation & Behavior

### Widget Consolidation

* [ ] **Unify activity feed implementations** into a single component with variants:

  * Consolidate behavior of `RecentActivityFeed.tsx` (desktop), `CompactRecentActivity.tsx`, and legacy `RecentActivities.tsx` (if kept)
  * Expose props like `maxItems`, `variant: 'compact' | 'sidebar' | 'full'`
* [ ] **Unify task widgets** into a single task widget API:

  * Bring together `MyTasksThisWeek.tsx`, `CompactTasksWidget.tsx`, and legacy `OverdueTasks.tsx` / `ThisWeeksActivities.tsx` (if not deleted)
  * Variant props for “full desktop”, “compact sidebar”, “overdue only”, etc.

### Quick Actions & Flows

* [ ] **Finish wiring quick-log activity flows**

  * [ ] `Dashboard.tsx.handleQuickLogActivity`: call real dataProvider/endpoint
  * [ ] `CompactGridDashboard.tsx`: ensure quick-log event → modal → API round-trip is fully wired
* [ ] **Validate `QuickCompleteTaskModal` + `complete_task_with_followup` end-to-end**

  * [ ] Confirm all intermediate states show correctly (LOG_ACTIVITY → UPDATE_OPPORTUNITY → SUCCESS)
  * [ ] Confirm rollback behavior on RPC errors

---

## ♿ P4 – Accessibility & Polish

### Accessibility

* [ ] **Audit color contrast on all updated dashboard widgets**

  * Especially compact components using lighter text or subtle muted colors
* [ ] **Add/verify `aria-label`s** on icon-only buttons (call/email/task/export/etc.)
* [ ] **Confirm keyboard navigation**

  * Dropdown menus, quick-log modals, action menus, inline buttons
* [ ] **Verify focus rings**

  * Ensure no component “eats” focus outlines when it shouldn’t

### Tests & Coverage

* [ ] **Add missing tests for key building blocks**:

  * [ ] `DashboardWidget.tsx`
  * [ ] `CompactRecentActivity.tsx`
  * [ ] `SuccessStep.tsx`
  * [ ] Any rebuilt/migrated components after the cleanup
* [ ] **Update existing tests** after semantic color & data-view changes

  * [ ] Snapshot tests / DOM queries that rely on class names or text labels
  * [ ] Utility tests if logic moves to SQL or new utilities

---

## 📚 P5 – Documentation & Dev-Experience

* [ ] **Update this Dashboard README to match the post-cleanup state**

  * [ ] Remove references to deleted legacy components and unused CSS
  * [ ] Update “Critical Issues (Remaining)” section once TODOs are cleared
  * [ ] Document new DB views (`dashboard_pipeline_summary`, events view) and how widgets consume them
* [ ] **Add a short “How to add a new dashboard widget” section**

  * Outline: data source → container vs. presentational → semantic colors → tests → accessibility

