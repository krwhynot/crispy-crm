# Reports Module Feature Matrix Audit

**Audit Date:** 2025-11-28
**Auditor:** Claude (with Perplexity/WebSearch industry research)
**Scope:** Reports module components vs PRD Section 8 requirements
**Status:** Complete - 4 gaps identified, all confirmed for implementation

---

## Executive Summary

This audit compares the actual Reports module implementation (`/reports` route) against PRD Section 8 requirements and industry best practices from Salesforce and HubSpot. The Reports module is well-implemented with 4 tabs, global filtering, and CSV export. Key gaps exist in KPI click navigation, stale detection logic, and a missing 4th KPI card.

### Key Findings

| Category | Status | Details |
|----------|--------|---------|
| Tab Structure | ✅ Aligned | 4 tabs match PRD Section 8.1 |
| Overview Dashboard | ⚠️ 3 Gaps | Missing 4th KPI, click navigation, per-stage stale thresholds |
| Opportunities by Principal | ✅ Aligned | Full filters, grouping, export |
| Weekly Activity | ✅ Aligned | Rep→Principal grouping, low activity warnings |
| Campaign Activity | ✅ Aligned | Comprehensive filtering, stale leads view |
| Global Filter System | ✅ Aligned | Date presets, rep filter, localStorage persistence |
| Export Functionality | ✅ Aligned | CSV with sanitization (`sanitizeCsvValue`) |

### User Decisions (Validation Questions)

| Question | Decision | Rationale |
|----------|----------|-----------|
| KPI Count | **4 KPIs (PRD 9.2.1)** | Add Stale Deals as 4th KPI with amber styling |
| Date Presets | **Keep current 6** | Current granular presets sufficient (Today, Yesterday, etc.) |
| KPI Click-Through | **Add navigation** | Match Salesforce/HubSpot pattern - KPIs link to filtered lists |
| Stale Detection | **Per-stage thresholds** | Use PRD Section 6.3 thresholds (7d/14d/21d by stage) |

---

## Industry Best Practices Research

### Salesforce Reporting Patterns
- **Dashboard KPIs:** 5-7 metrics max, actionable and within user's control
- **Click-through navigation:** All KPIs link to filtered detail views
- **Stage-specific SLAs:** Different stale thresholds per pipeline stage
- **Role-based dashboards:** Reps see personal metrics, managers see team performance
- **Source:** [Salesforce Sales Dashboard Examples](https://www.salesforce.com/sales/analytics/sales-dashboard-examples/)

### HubSpot Reporting Patterns
- **Date presets:** Granular options including Today, Yesterday (not just 7d/30d)
- **Activity Feed:** Recent team activities with avatars and timestamps
- **Coverage metrics:** Track percentage of leads contacted
- **Export:** CSV with security sanitization
- **Source:** [HubSpot Sales Dashboard](https://blog.hubspot.com/sales/sales-dashboard)

### Key Industry Insights
- **32% deal velocity improvement** when stage-specific SLAs are enforced (DemandFarm research)
- **Role-based views** are standard - different metrics for reps vs managers vs executives
- **Fewer choices = better UX** - Industry recommends limiting date presets to avoid decision fatigue

---

## Feature Matrix (Component-Level)

### A. Reports Page Shell (`ReportsPage.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| 4-tab layout | Section 8.1 | `<Tabs>` with Overview, Opps, Weekly, Campaign | ✅ Aligned |
| URL tab state | Best Practice | `useSearchParams` for `?tab=` parameter | ✅ Aligned |
| Global filter wrapper | Section 8.5 | `<GlobalFilterProvider>` context | ✅ Aligned |
| Lazy-loaded tabs | Performance | `React.lazy()` for each tab component | ✅ Aligned |
| Suspense fallback | UX | Loading skeleton for each tab | ✅ Aligned |

### B. Overview Tab (`OverviewTab.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| KPI #1: Total Opportunities | Section 8.2 | Count of active opportunities | ✅ Aligned |
| KPI #2: Activities This Week | Section 8.2 | Week-over-week with trend arrow | ✅ Aligned |
| KPI #3: Stale Leads | Section 8.2 | Leads with no activity 7+ days | ✅ Aligned |
| KPI #4: Stale Deals | Section 9.2.1 #4 | NOT IMPLEMENTED | ⚠️ **Gap** |
| KPI click navigation | Section 9.2.1 | NOT IMPLEMENTED (static values) | ⚠️ **Gap** |
| Per-stage stale thresholds | Section 6.3 | Uses fixed 7-day threshold | ⚠️ **Gap** |
| Pipeline by Stage chart | Section 8.2 | `<PipelineChart>` bar chart | ✅ Aligned |
| Activity Trend (14 Days) | Section 8.2 | `<ActivityTrendChart>` line chart | ✅ Aligned |
| Top Principals chart | Section 8.2 | `<TopPrincipalsChart>` horizontal bar | ✅ Aligned |
| Rep Performance chart | Section 8.2 | `<RepPerformanceChart>` grouped bar | ✅ Aligned |
| Trend calculations | Best Practice | Compare recent vs older activity periods | ✅ Aligned |

**PRD References:**
- Section 8.2: Overview Dashboard defines 3 KPIs + 4 charts
- Section 9.2.1: Dashboard KPI Summary Row defines 4 clickable KPIs
- Section 6.3: Per-stage stale thresholds (7d new_lead, 14d outreach, 21d feedback)
- MVP #51: Add 4th KPI card for "Stale Deals" with amber styling

### C. Opportunities by Principal (`OpportunitiesByPrincipalReport.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| Principal grouping | Section 8.3 | Expandable cards by principal_organization_id | ✅ Aligned |
| Filter: Principal | Section 8.3 | `<AutocompleteArrayInput>` with type='principal' | ✅ Aligned |
| Filter: Stage | Section 8.3 | `<MultiSelectInput>` with OPPORTUNITY_STAGE_CHOICES | ✅ Aligned |
| Filter: Sales Rep | Section 8.3 | `<AutocompleteArrayInput>` for sales | ✅ Aligned |
| Filter: Date Range | Section 8.3 | Custom date inputs (start/end) | ✅ Aligned |
| Excel/CSV Export | Section 8.3 | `jsonExport` + `downloadCSV` with sanitization | ✅ Aligned |
| Opportunity detail table | Section 8.3 | Name, org, stage, date, rep columns | ✅ Aligned |
| Click-through to detail | UX | `navigate(/opportunities/${id}/show)` | ✅ Aligned |
| Days-in-stage badge | Best Practice | Warning badge if >14 days | ✅ Aligned |
| Summary stats | Section 8.3 | Total Opps, Principals, Avg per Principal | ✅ Aligned |
| Auto-expand top 3 | UX | Initial state expands first 3 principals | ✅ Aligned |

### D. Weekly Activity (`WeeklyActivitySummary.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| Date range picker | Section 8.1 | Start/end inputs in toolbar | ✅ Aligned |
| Rep → Principal grouping | Section 8.1 | Cards per rep with principal tables | ✅ Aligned |
| Activity type columns | Section 8.1 | Calls, Emails, Meetings, Notes, Total | ✅ Aligned |
| Low activity warning | Best Practice | "⚠️ Low Activity" badge if <3/week | ✅ Aligned |
| CSV export | Section 8.3 | rep_name, principal_name, counts | ✅ Aligned |
| Summary stats | Section 8.1 | Total Activities, Active Reps, Avg per Rep | ✅ Aligned |

### E. Campaign Activity (`CampaignActivityReport.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| Campaign selector | Section 8.4 | `<Select>` with opportunity counts | ✅ Aligned |
| Filter: Date range | Section 8.4 | 4 presets + custom pickers | ✅ Aligned |
| Filter: Activity type | Section 8.4 | Multi-select checkboxes (all 13 types) | ✅ Aligned |
| Filter: Sales rep | Section 8.4 | Dropdown with activity counts | ✅ Aligned |
| Stale leads toggle | Section 8.4 | Configurable threshold (days) | ✅ Aligned |
| Activity type breakdown | Section 8.4 | Expandable cards with details | ✅ Aligned |
| CSV export | Section 8.4 | Dual mode: activities or stale leads | ✅ Aligned |
| Formula injection protection | Section 8.4 | `sanitizeCsvValue()` applied | ✅ Aligned |
| Summary KPIs | Section 8.4 | Total, Orgs Contacted, Coverage%, Avg per Lead | ✅ Aligned |
| Screen reader support | Accessibility | `aria-live` announcements for view changes | ✅ Aligned |

### F. Global Filter System (`GlobalFilterContext.tsx`, `GlobalFilterBar.tsx`)

| Feature | PRD Reference | Implementation | Status |
|---------|---------------|----------------|--------|
| Date range presets | Section 8.5 | Today, Yesterday, Last 7/30, This/Last Month | ✅ Aligned* |
| Sales rep filter | Section 8.5 | Single-select dropdown with "All Reps" | ✅ Aligned |
| localStorage persistence | Section 8.5 | `reports.globalFilters` key | ✅ Aligned |
| Reset filters button | Section 8.5 | Shows only when filters active | ✅ Aligned |
| Custom date pickers | Section 8.5 | NOT IMPLEMENTED in GlobalFilterBar | ⚠️ Low Priority |

*Note: PRD specifies 7d, 30d, 90d, YTD, Custom but user decision confirmed current 6 presets are sufficient.

---

## CRUD Matrix

The Reports module is **read-only** - it queries data from other resources but does not create, update, or delete records.

| Resource | Create | Read | Update | Delete | Export |
|----------|--------|------|--------|--------|--------|
| opportunities | ❌ | ✅ `useGetList` | ❌ | ❌ | ✅ CSV |
| opportunities_summary | ❌ | ✅ `useGetList` | ❌ | ❌ | ✅ CSV |
| activities | ❌ | ✅ `useGetList` | ❌ | ❌ | ✅ CSV |
| sales | ❌ | ✅ `useGetList` | ❌ | ❌ | - |
| organizations | ❌ | ✅ `useGetList` | ❌ | ❌ | - |

### Data Access Patterns

| Report Tab | Primary Resource | Join Resources | Key Filters |
|------------|------------------|----------------|-------------|
| Overview | `opportunities`, `activities` | `sales` | `salesRepId`, `dateRange`, `deleted_at@is: null` |
| Opportunities by Principal | `opportunities_summary` | `sales` | `principal_organization_id`, `stage[]`, `opportunity_owner_id`, `estimated_close_date` |
| Weekly Activity | `activities` | `sales`, `organizations` | `activity_date@gte/lte` |
| Campaign Activity | `activities`, `opportunities` | `sales` | `opportunities.campaign`, `type[]`, `created_by`, `created_at@gte/lte` |

---

## Gap Analysis

### Confirmed Gaps (4 items)

| # | Gap | PRD Reference | Severity | Implementation Notes |
|---|-----|---------------|----------|---------------------|
| 1 | Add 4th KPI (Stale Deals) | Section 9.2.1 #4, MVP #51 | HIGH | Add `<KPICard>` with amber styling, count deals exceeding per-stage thresholds |
| 2 | Implement per-stage stale thresholds | Section 6.3 | HIGH | `new_lead: 7d`, `initial_outreach: 14d`, `sample_visit_offered: 14d`, `feedback_logged: 21d`, `demo_scheduled: 14d` |
| 3 | Add KPI click navigation | Section 9.2.1 | MEDIUM | Add `onClick` prop to `<KPICard>`, use `useNavigate()` to route to filtered lists |
| 4 | GlobalFilterBar custom date pickers | Section 8.5 | LOW | Add `<DatePicker>` components for custom range (current presets sufficient per user decision) |

### Deferred to Post-MVP

| Feature | PRD Reference | Rationale |
|---------|---------------|-----------|
| PDF Export | Section 8.3, 8.7 | Excel sufficient for MVP |
| Won/Lost Analysis Report | Section 8.7 | Requires Win/Loss Reasons UI (#12) first |
| Velocity Metrics | Section 8.7 | Time-in-stage, cycle time deferred |
| Forecasting (weighted) | Section 8.6 | Requires pricing/probability setup |

---

## Implementation Recommendations

### Priority 1: Add 4th KPI (Stale Deals)

**File:** `src/atomic-crm/reports/tabs/OverviewTab.tsx`

```typescript
// Add to KPIs section after Stale Leads
<KPICard
  title="Stale Deals"
  value={kpis.staleDeals}
  change={0}
  trend="neutral"
  icon={AlertTriangle}
  subtitle="Deals past stage SLA"
  variant={kpis.staleDeals > 0 ? "warning" : "default"}
  onClick={() => navigate('/opportunities?filter=stale')}
/>
```

### Priority 2: Implement Per-Stage Stale Thresholds

**File:** `src/atomic-crm/reports/tabs/OverviewTab.tsx`

```typescript
const STAGE_STALE_THRESHOLDS: Record<string, number> = {
  new_lead: 7,
  initial_outreach: 14,
  sample_visit_offered: 14,
  feedback_logged: 21,
  demo_scheduled: 14,
};

// Update stale calculation
const staleDeals = opportunities.filter((opp) => {
  const threshold = STAGE_STALE_THRESHOLDS[opp.stage] || 14;
  const lastActivity = opp.last_activity_at ? new Date(opp.last_activity_at) : null;
  if (!lastActivity) return true; // No activity = stale
  const daysSinceActivity = differenceInDays(new Date(), lastActivity);
  return daysSinceActivity > threshold;
}).length;
```

### Priority 3: Add KPI Click Navigation

**File:** `src/atomic-crm/reports/components/KPICard.tsx`

```typescript
interface KPICardProps {
  // ... existing props
  onClick?: () => void;
}

// Add to Card component
<Card
  className={cn("cursor-pointer hover:bg-accent/50", className)}
  onClick={onClick}
  role={onClick ? "button" : undefined}
  tabIndex={onClick ? 0 : undefined}
>
```

---

## PRD Alignment Summary

| PRD Section | Implementation Status | Notes |
|-------------|----------------------|-------|
| 8.1 Reports Module Overview | ✅ Aligned | 4 tabs as specified |
| 8.2 Overview Dashboard | ⚠️ 3 Gaps | Add 4th KPI, click nav, per-stage thresholds |
| 8.3 Principal Reports | ✅ Aligned | Full filters and export |
| 8.4 Campaign Activity Report | ✅ Aligned | Comprehensive implementation |
| 8.5 Global Filter System | ✅ Aligned | Current presets approved |
| 8.6 Forecasting | ✅ Deferred | Post-MVP per PRD |
| 8.7 Metrics NOT in MVP | ✅ Deferred | Velocity, PDF, Won/Lost correctly excluded |

---

## Files Audited

| File | Lines | Purpose |
|------|-------|---------|
| `src/atomic-crm/reports/ReportsPage.tsx` | 87 | Main page shell with tabs |
| `src/atomic-crm/reports/tabs/OverviewTab.tsx` | 297 | KPIs and charts |
| `src/atomic-crm/reports/tabs/OpportunitiesTab.tsx` | 22 | Wrapper for principal report |
| `src/atomic-crm/reports/tabs/WeeklyActivityTab.tsx` | 23 | Wrapper for weekly summary |
| `src/atomic-crm/reports/tabs/CampaignActivityTab.tsx` | 24 | Wrapper for campaign report |
| `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx` | 511 | Full principal report |
| `src/atomic-crm/reports/WeeklyActivitySummary.tsx` | 309 | Weekly activity by rep |
| `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` | 885 | Campaign activity report |
| `src/atomic-crm/reports/contexts/GlobalFilterContext.tsx` | 78 | Filter state management |
| `src/atomic-crm/reports/components/GlobalFilterBar.tsx` | 173 | Filter UI component |
| `src/atomic-crm/reports/types.ts` | 46 | Shared type definitions |

---

*Audit complete. 4 gaps identified, implementation recommendations provided.*
