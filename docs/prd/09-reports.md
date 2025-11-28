---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 9.6 (Reports Module) for current requirements - 4 KPIs, per-stage stale thresholds.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Feature Module:** Reports (MVP - 2 Reports Only)
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Database views for reporting
- 🎨 [Design System](./15-design-tokens.md) - Report layouts and export buttons
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Principal tracking (key for reports)
- 🔗 [Activity Tracking](./10-activity-tracking.md) - Weekly activity summary
- 📊 [Import/Export](./13-import-export.md) - CSV export patterns
---

## 📊 Implementation Status

**Last Updated:** November 5, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ⚠️ **40%** |
| **Confidence** | 🟡 **MEDIUM** - CSV foundation complete, missing report pages |
| **Files** | 35 total (CSV import/export infrastructure) |
| **CRUD Operations** | 🚧 Partial - Import/Export complete, report pages missing |
| **Database Schema** | ✅ Tables support reporting queries |
| **Export Features** | ✅ CSV export patterns from Organizations/Contacts |

**Completed Requirements:**
- ✅ CSV export infrastructure (OrganizationListActions.tsx, ContactListActions.tsx)
- ✅ Bulk export patterns established
- ✅ Data extraction from database tables
- ✅ File naming conventions (`{resource}_export_{date}.csv`)
- ✅ UTF-8 encoding with headers

**Missing Requirements (60%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Create Opportunities by Principal report page ⭐ | ❌ Missing | 🟢 HIGH | 2 days |
| Create Weekly Activity Summary report page | ❌ Missing | 🟢 HIGH | 2 days |
| Add Reports navigation menu item | ❌ Missing | 🟢 HIGH | 30 min |
| Implement report filtering UI | ❌ Missing | 🟡 MEDIUM | 1 day |

**Total Estimate:** 4 days for 2 critical MVP reports

**Details:**
- **Infrastructure Gap:** CSV export patterns exist but no standalone report pages or dedicated Reports menu
- **Priority Feature Missing:** Opportunities by Principal report (marked ⭐ MOST IMPORTANT in PRD) has no implementation
- **UI Gap:** No dedicated Reports section in navigation
- **Pattern Available:** Can follow existing CSV export patterns from Organizations/Contacts modules

**Blockers:** None - Just needs dedicated implementation time

**Recommendation:** Create dedicated Reports module with 2 standalone pages following existing CSV export patterns. Add Reports menu item to main navigation.

---

# 3.7 Reports (MVP - 2 Critical Reports Only)

**Note:** Analytics dashboards and advanced reporting are NOT in MVP scope. Focus is on answering two critical questions: (1) What's happening with each principal? (2) What did each Account Manager do this week?

## MVP Scope

**Reports Included:**
1. ⭐ Opportunities by Principal Report (HIGHEST PRIORITY)
2. Weekly Activity Summary Report (CRITICAL)

**Deferred to Post-MVP:**
- Pipeline Status Report (moved to Phase 2)
- Forecasting reports
- Custom report builder
- Saved report configurations

---

## Report Access Control

**Democratic approach:** All users can access all reports
- No role-based restrictions on report visibility
- All users see the same report options in the Reports menu
- Rationale: Small team collaboration, transparency over hierarchy

**Export Format:**
- **CSV only** for all exports (simple, universal compatibility)
- No Excel formatting, PDF, or JSON in MVP
- File naming: `{report_name}_{date}.csv`
- UTF-8 encoding with headers

**Report Scheduling:**
- **No automation in MVP** - all reports are run manually
- User must click "Run Report" to generate fresh data
- No scheduled emails or recurring reports

---

## 1. Opportunities by Principal Report ⭐ MOST IMPORTANT

**Purpose:** See all opportunities grouped by which brand/manufacturer (Principal) they're for. Answers: "What's the status of each principal I represent?"

**Access:** Reports > Opportunities by Principal (available to all users)

**Features:**
- Grouped list view: Principal as header, opportunities nested underneath
- Show per Principal:
  - Count of opportunities (active vs closed)
  - List of opportunities with: Customer Org, Stage, Status, Expected Close Date, Account Manager
- Filters:
  - Status (active, closed, on_hold)
  - Stage (all 8 stages)
  - Date range (Expected Close Date)
  - Account Manager (filter by specific user)
- Sort options:
  - By Principal name (A-Z)
  - By opportunity count (most to least)
  - By expected close date (soonest first)
- Export: CSV with columns [Principal, Customer Org, Opportunity Name, Stage, Status, Expected Close, Account Manager]

**Example Output:**
```
Principal: Fishpeople Seafood (5 opportunities)
  - Restaurant A | Sample Visit Offered | Active | Dec 1, 2025 | John
  - Restaurant B | New Lead | Active | Dec 15, 2025 | Jane
  ...

Principal: Ocean Hugger Foods (3 opportunities)
  - Restaurant C | Demo Scheduled | Active | Nov 20, 2025 | John
  ...
```

**Why Most Important:** Account Managers manage 3-5 principals each. This report shows at a glance which principals need attention, which are progressing well, and where opportunities are stuck.

**Implementation Notes:**
- Reuse logic from dashboard OpportunitiesByPrincipal widget
- Add advanced filtering and CSV export
- Sortable columns
- Click principal name to filter opportunities view

---

## 2. Weekly Activity Summary Report

**Purpose:** See what each Account Manager did this week (calls, meetings, emails logged). Answers: "Is everyone actively working their principals?"

**Access:** Reports > Weekly Activity Summary

**Features:**
- Grouped by Account Manager, shows activities for selected week
- Show per user:
  - Activity count breakdown (# calls, # emails, # meetings, # notes)
  - List of activities with: Type, Date, Description (truncated), Related Entity
- Filters:
  - Date range picker (defaults to current week: Mon-Sun)
  - Account Manager multi-select (default: all users)
  - Activity type (call, email, meeting, note)
- Sort: By date (newest first) within each Account Manager
- Export: CSV with columns [Account Manager, Date, Activity Type, Description, Related Entity]

**Example Output:**
```
John Smith (18 activities this week)
  Calls: 8 | Emails: 5 | Meetings: 3 | Notes: 2

  Nov 3 - Call - Spoke with chef at Restaurant A about pricing
  Nov 3 - Email - Sent follow-up to Restaurant B
  Nov 2 - Meeting - Demo at Restaurant C
  ...

Jane Doe (15 activities this week)
  Calls: 6 | Emails: 7 | Meetings: 2 | Notes: 0
  ...
```

**Why Critical:** Activity tracking is the leading indicator of success. If an Account Manager isn't logging 10+ activities/week, they're not actively working. This report makes accountability visible.

**Implementation Notes:**
- Query activities table with date range filter
- Group by sales_id (Account Manager)
- Count by activity_type
- Default to current week (Monday to Sunday)

---

## Deferred Features (Post-MVP)

**Pipeline Status Report:**
- **Why Deferred:** Nice-to-have, but Opportunities by Principal report answers the same questions
- **What it would show:** All opportunities grouped by stage with counts and values
- **When to build:** After MVP launch, if sales team requests it

**Other Deferred Reports:**
- Analytics dashboard with charts
- Forecasting based on probability/volume
- Win/loss analysis by principal
- Time-to-close metrics
- Conversion rate by stage
- Account Manager performance leaderboard

**Why Defer?** Focus on Excel replacement first. Advanced analytics come after team adoption is proven.

---

## Filtered List Exports (All Modules)

**Purpose:** Export any filtered/searched list to CSV for offline analysis.

**Access:** Any list view (Organizations, Contacts, Opportunities, Products) has "Export to CSV" button

**Features:**
- Button in list view toolbar (top right)
- Respects current filters and search
- Exports visible columns only
- File format: `{module}_export_{date}.csv`

**Examples:**
- Organizations filtered by "Priority A" → `organizations_export_2025-11-05.csv`
- Opportunities filtered by "Principal = Fishpeople" → `opportunities_export_2025-11-05.csv`

**Status:** ✅ Already implemented in Organizations and Contacts modules

---

## Technical Implementation Notes

**Report Pages:**
- Create `src/atomic-crm/reports/` directory
- OpportunitiesByPrincipal.tsx (report page)
- WeeklyActivitySummary.tsx (report page)
- index.ts (lazy-loaded exports)

**Navigation:**
- Add Reports menu item to main navigation
- Icon: 📊 (bar chart)
- Sub-menu: List both reports

**CSV Export:**
- Reuse existing CSV export infrastructure from Organizations/Contacts
- Header row with column names
- UTF-8 encoding
- Downloads immediately (no server storage)

**Performance:**
- Reports query ALL data (not paginated like lists)
- Use database views for complex joins
- Add loading states for slow queries
- Consider caching for 5 minutes

---

## Success Metrics

**Primary Goal:** Replace Excel reporting within 30 days.

**Measurements:**
- Report usage: Each report run 2-3x per week minimum
- CSV export frequency: Declining over time (sign they trust the UI)
- Time to answer "What's my principal status?": < 10 seconds (vs 5+ minutes in Excel)

---

## Related Features

- **Dashboard:** Principal-centric table shows summary, reports show detail
- **Activity Tracking:** Feeds Weekly Activity Summary report data
- **Opportunities Module:** Source data for principal-focused reporting

---

**Future Enhancements (Post-MVP):**
- Scheduled email delivery of reports
- Saved report configurations
- Custom report builder
- PDF export with charts
- Report sharing links
