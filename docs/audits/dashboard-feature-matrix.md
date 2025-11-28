# Dashboard V3 Feature Matrix Audit

**Audit Date:** 2025-11-28
**Auditor:** Claude (with Perplexity industry research)
**Scope:** Dashboard V3 components vs PRD requirements
**Status:** Complete - 7 gaps identified, 6 confirmed for implementation

---

## Executive Summary

This audit compares the actual Dashboard V3 implementation against PRD Section 9.2 requirements and industry best practices from Salesforce and HubSpot. The dashboard structure is sound, but several gaps exist in KPI metrics, activity logging, and missing widget components.

### Key Findings

| Category | Status | Details |
|----------|--------|---------|
| Layout Structure | ✅ Aligned | Vertical stacking with FAB matches PRD |
| KPI Cards | ⚠️ 2 Gaps | KPI #1 shows $ (no pricing in MVP), KPI #4 missing Stale Deals |
| Activity Logging | ⚠️ Critical Gap | 5/13 activity types implemented |
| Pipeline Table | ⚠️ 3 Gaps | Missing tooltips, visual decay, Next Action styling |
| Tasks Panel | ⚠️ 2 Gaps | Snooze needs popover, follow-up prompt missing |
| Missing Components | ⚠️ 3 Gaps | Recent Activity Feed, My Performance, Weekly Focus |

---

## Industry Best Practices Research

### Salesforce Dashboard Patterns
- **KPIs:** 3-4 metrics per goal with conditional highlighting
- **Pipeline:** Stage-based visibility with visual indicators for stale deals
- **Activities:** Full activity type logging with quick entry
- **Tasks:** Overdue highlighting, snooze with date options
- **Source:** [Salesforce Dashboard Examples](https://coefficient.io/salesforce-reporting/salesforce-dashboard-examples)

### HubSpot Dashboard Patterns
- **Deal Progression:** Stage velocity analysis with color coding
- **Activity Feed:** Recent team activities with avatars and timestamps
- **Personal Metrics:** "My Performance" widget standard in sales dashboards
- **360° View:** Unified pipeline + activities + tasks in single view
- **Source:** [HubSpot Reporting Dashboards](https://www.hubspot.com/products/reporting-dashboards)

---

## Feature Matrix (Component-Level)

### A. Main Dashboard Shell (`PrincipalDashboardV3.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| Vertical stacked layout | Section 9.2 | `flex flex-col gap-4` | ✅ Aligned |
| KPI Summary Row | Section 9.2.1 | `<KPISummaryRow />` | ✅ Aligned |
| Pipeline Table | Section 9.2 | `<PrincipalPipelineTable />` | ✅ Aligned |
| Tasks Panel | Section 9.2.4 | `<TasksKanbanPanel />` | ✅ Aligned |
| Log Activity FAB | Section 9.2 | `<LogActivityFAB />` | ✅ Aligned |
| Recent Activity Feed | Section 9.2, MVP #16 | NOT IMPLEMENTED | ⚠️ Gap |
| Weekly Focus Widget | Section 9.2.5, MVP #39 | NOT IMPLEMENTED | ⏸️ Deferred |
| My Performance Widget | Section 9.2, MVP #28 | NOT IMPLEMENTED | ⚠️ Gap |

### B. KPI Summary Row (`KPISummaryRow.tsx` + `KPICard.tsx`)

| KPI Position | PRD Requirement | Code Implementation | Status |
|--------------|-----------------|---------------------|--------|
| KPI #1 | "Open Opportunities" (count) | "Total Pipeline" ($) with DollarSign icon | ⚠️ **Critical Gap** |
| KPI #2 | "Overdue Tasks" (red >0) | `overdueTasks` with destructive styling | ✅ Aligned |
| KPI #3 | "Activities This Week" | `activitiesThisWeek` with Activity icon | ✅ Aligned |
| KPI #4 | "Stale Deals" (amber >0) | "Open Opportunities" instead | ⚠️ **Critical Gap** |

**PRD References:**
- Section 9.2.1 defines 4 KPIs with specific metrics
- Decision #60: Replace "Total Pipeline Value" with "Open Opportunities" count
- MVP #38: Add Stale Deals KPI with amber styling
- Decision #5: No pricing/volume in MVP

### C. Pipeline Table (`PrincipalPipelineTable.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| Principal grouping | Section 9.2 | Rows via `usePrincipalPipeline` | ✅ Aligned |
| Momentum indicators | Section 6.3 | increasing/steady/decreasing/stale icons | ✅ Aligned |
| "This Week" column | Section 9.2.2 | `activeThisWeek` with green badge | ✅ Aligned |
| "Last Week" column | Section 9.2.2 | `activeLastWeek` with secondary badge | ✅ Aligned |
| Column tooltips | MVP #35 | NOT IMPLEMENTED | ⚠️ Gap |
| Next Action styling | Section 9.2.2 | Shows as `variant="link"` | ⚠️ Gap |
| Row click drill-down | Section 9.2 | `<PipelineDrillDownSheet />` lazy-loaded | ✅ Aligned |
| Visual decay borders | MVP #26, Section 6.3 | NOT IMPLEMENTED | ⚠️ Gap |

**PRD References:**
- Section 9.2.2: Column definitions with tooltips required
- MVP #35: Add tooltips to This Week/Last Week/Momentum columns
- MVP #36: "Schedule follow-up" should be plain text, not link
- MVP #26: Green/yellow/red borders for `sample_visit_offered` stage

### D. Tasks Panel (`TasksPanel.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| Time-bucketed groups | Section 9.2.4 | Overdue/Today/Tomorrow with colors | ✅ Aligned |
| Scope limitation | Section 9.2.4 | Excludes 3+ days (use /tasks) | ✅ Aligned |
| Complete via checkbox | Section 12.1 | `<Checkbox onCheckedChange />` | ✅ Aligned |
| Snooze popover | Section 9.2.3, MVP #37 | Auto-snooze 1 day (NO popover) | ⚠️ Gap |
| View/Edit/Delete | Section 12.1 | Dropdown menu with actions | ✅ Aligned |
| New Task button | Section 12.1 | Routes to `/tasks/create` | ✅ Aligned |
| Follow-up prompt | Section 12.4, MVP #32 | NOT IMPLEMENTED | ⚠️ Gap |

**PRD References:**
- Section 9.2.3: Snooze popover with Tomorrow/Next Week/Custom Date options
- Section 12.4: Modal prompt on task completion to create follow-up

### E. Quick Log Form (`QuickLogForm.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| <30 second target | Section 6.2 | Streamlined form design | ✅ Aligned |
| Activity types | Section 6.1, MVP #17 | 5 of 13 types | ⚠️ **Critical Gap** |
| Cascading selection | Section 6.2 | Contact/Org/Opp linked | ✅ Aligned |
| Follow-up creation | Section 6.2 | `createFollowUp` + date | ✅ Aligned |
| Draft persistence | Best practice | localStorage with expiry | ✅ Aligned |
| Zod validation | CLAUDE.md | `zodResolver(activityLogSchema)` | ✅ Aligned |

**Activity Types Gap Detail:**

| Implemented (5) | Missing (8) |
|-----------------|-------------|
| Call | sample |
| Email | demo |
| Meeting | proposal |
| Follow-up | trade_show |
| Note | site_visit |
| | contract_review |
| | check_in |
| | social |

---

## CRUD Matrix

| Component | Create | Read | Update | Delete |
|-----------|--------|------|--------|--------|
| KPISummaryRow | - | ✅ Aggregated metrics | - | - |
| PrincipalPipelineTable | - | ✅ Pipeline view data | - | - |
| TasksPanel | ✅ New Task button | ✅ User's tasks | ✅ Complete/Snooze | ✅ Soft delete |
| QuickLogForm | ✅ Activities + Tasks | ✅ Entity selection | - | - |
| LogActivityFAB | ✅ Opens form | - | - | - |

### Data Flow by Entity

| Entity | Dashboard Access | Operations |
|--------|------------------|------------|
| Activities | QuickLogForm, KPIs | Create, Read (count) |
| Tasks | TasksPanel, QuickLogForm | Create, Read, Update, Delete |
| Opportunities | KPIs, PipelineTable | Read (count, list) |
| Contacts | QuickLogForm | Read (selection) |
| Organizations | QuickLogForm | Read (selection) |

---

## Gap Analysis Summary

### Critical Gaps (P0)

| ID | Component | Gap | PRD Reference | Resolution |
|----|-----------|-----|---------------|------------|
| D-01 | KPISummaryRow | KPI #1 shows $ instead of count | Decision #60, MVP #34 | Change to "Open Opportunities" count |
| D-02 | KPISummaryRow | KPI #4 missing Stale Deals | MVP #38 | Replace "Open Opportunities" with "Stale Deals" (amber) |
| D-03 | QuickLogForm | Only 5/13 activity types | Section 6.1, MVP #17 | Add 8 missing types |

### High Priority Gaps (P1)

| ID | Component | Gap | PRD Reference | Resolution |
|----|-----------|-----|---------------|------------|
| D-04 | Dashboard | No Recent Activity Feed | Section 9.2, MVP #16 | Add ActivityFeedPanel below Tasks |
| D-06 | Dashboard | No My Performance Widget | Section 9.2, MVP #28 | Add sidebar widget with personal metrics |

### Medium Priority Gaps (P2)

| ID | Component | Gap | PRD Reference | Resolution |
|----|-----------|-----|---------------|------------|
| D-07 | PipelineTable | No column tooltips | MVP #35 | Add title attributes to headers |
| D-08 | PipelineTable | Next Action as link | MVP #36 | Change to plain text |
| D-09 | PipelineTable | No visual decay borders | MVP #26 | Add CSS borders by momentum |
| D-10 | TasksPanel | Auto-snooze (no options) | MVP #37 | Add popover with date options |
| D-11 | TasksPanel | No follow-up prompt | MVP #32 | Add modal on task complete |

### Deferred (Post-MVP)

| ID | Component | Gap | PRD Reference | Rationale |
|----|-----------|-----|---------------|-----------|
| D-05 | Dashboard | No Weekly Focus Widget | MVP #39 | MFB-specific, not blocking core functionality |

---

## Validated Decisions

The following decisions were confirmed via stakeholder questions:

| Decision | Question | Answer | Impact |
|----------|----------|--------|--------|
| KPI #1 Metric | Show $ or count? | **Count only** | Aligns with Decision #5 (no pricing MVP) |
| Activity Types | 5, prioritized, or all 13? | **All 13 types** | Enables sample tracking (MVP #4) |
| Task Snooze | Auto-snooze or popover? | **Popover with options** | Tomorrow/Next Week/Custom per PRD |
| Next Action Text | Link or plain text? | **Plain text** | Non-functional elements shouldn't look clickable |
| KPI #4 Metric | Open Opps or Stale Deals? | **Stale Deals** | With amber styling when >0 |
| Activity Feed | New component, tab, or defer? | **New component** | Add below Tasks panel |
| Weekly Focus | Add or defer? | **Defer to post-MVP** | Nice-to-have, not blocking |
| My Performance | Sidebar, KPI row, or defer? | **Sidebar widget** | Per PRD spec |

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Estimated: 2-3 hours)

1. **KPI Cards Refactor**
   - Change KPI #1 from "Total Pipeline" ($) to "Open Opportunities" (count)
   - Change KPI #4 from "Open Opportunities" to "Stale Deals" (amber when >0)
   - Update `useKPIMetrics` hook to fetch stale deal count
   - Files: `KPICard.tsx`, `KPISummaryRow.tsx`, `useKPIMetrics.ts`

2. **Activity Types Expansion**
   - Add 8 missing types to `activitySchema.ts`
   - Update `QuickLogForm.tsx` SelectContent
   - Update `ACTIVITY_TYPE_MAP` for DB mapping
   - Files: `activitySchema.ts`, `QuickLogForm.tsx`

### Phase 2: High Priority Components (Estimated: 4-6 hours)

3. **Recent Activity Feed**
   - Create `ActivityFeedPanel.tsx` component
   - Create `useRecentActivities.ts` hook
   - Add to `PrincipalDashboardV3.tsx` layout
   - Show last 10-20 team activities with avatar, type, timestamp

4. **My Performance Widget**
   - Create `MyPerformanceWidget.tsx` component
   - Metrics: Activities This Week, Deals Moved, Tasks Completed, Open Opps
   - Add to dashboard sidebar (may require layout adjustment)

### Phase 3: Medium Priority Polish (Estimated: 3-4 hours)

5. **Task Snooze Popover**
   - Replace direct snooze with Popover component
   - Options: Tomorrow (9 AM), Next Week (Monday 9 AM), Custom Date
   - File: `TasksPanel.tsx`

6. **Next Action Plain Text**
   - Remove `variant="link"` from "Schedule follow-up"
   - Apply `text-muted-foreground` styling
   - File: `PrincipalPipelineTable.tsx`

7. **Column Tooltips**
   - Add `title` attributes to column headers
   - This Week: "Activities logged Mon-Sun of current week"
   - Last Week: "Activities logged Mon-Sun of previous week"
   - Momentum: "Based on activity trend over 14 days"
   - File: `PrincipalPipelineTable.tsx`

### Phase 4: Future Enhancements (Post-MVP)

8. **Visual Decay Borders** - Green/yellow/red borders for deals in `sample_visit_offered` stage
9. **Task Follow-up Prompt** - Modal on task completion
10. **Weekly Focus Widget** - "One Thing" accountability widget

---

## Files Affected

| File | Changes Required |
|------|------------------|
| `src/atomic-crm/dashboard/v3/components/KPICard.tsx` | Update config for KPI #1 and #4 |
| `src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx` | Reorder KPI cards |
| `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts` | Add stale deals query |
| `src/atomic-crm/dashboard/v3/validation/activitySchema.ts` | Add 8 activity types |
| `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` | Add activity type options |
| `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx` | Add snooze popover |
| `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx` | Fix Next Action, add tooltips |
| `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` | Add ActivityFeed, MyPerformance |
| `src/atomic-crm/dashboard/v3/components/ActivityFeedPanel.tsx` | NEW FILE |
| `src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx` | NEW FILE |
| `src/atomic-crm/dashboard/v3/hooks/useRecentActivities.ts` | NEW FILE |

---

## Appendix: Industry Research Sources

- [Salesforce KPI Dashboard Examples](https://coefficient.io/salesforce-reporting/salesforce-dashboard-examples)
- [Salesforce Pipeline Management Guide](https://www.salesforce.com/sales/pipeline/management/)
- [Salesforce Dashboard Samples PDF](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_dashboard_samples.pdf)
- [HubSpot Reporting Dashboards](https://www.hubspot.com/products/reporting-dashboards)
- [HubSpot CRM Features Guide](https://routine-automation.com/blog/hubspot-crm-features-benefits-guide)
- [12 Essential HubSpot Dashboards](https://www.hublead.io/blog/hubspot-dashboard-examples)
- [HubSpot March 2024 Release Notes](https://martech.org/hubspots-march-2024-release-ai-management-crm-forecasting/)

---

*Audit completed: 2025-11-28*
