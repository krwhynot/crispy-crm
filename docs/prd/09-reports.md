---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Reports (MVP - Basic Only)
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

**Last Updated:** November 4, 2025

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
| Create Opportunity Pipeline Status report page | ❌ Missing | 🟢 HIGH | 2 days |
| Add Reports navigation menu item | ❌ Missing | 🟢 HIGH | 30 min |
| Implement report filtering UI | ❌ Missing | 🟡 MEDIUM | 1 day |

**Details:**
- **Infrastructure Gap:** CSV export patterns exist but no standalone report pages or dedicated Reports menu
- **Priority Feature Missing:** Opportunities by Principal report (marked ⭐ MOST IMPORTANT in PRD) has no implementation
- **UI Gap:** No dedicated Reports section in navigation
- **Pattern Available:** Can follow existing CSV export patterns from Organizations/Contacts modules

**Blockers:** None - Just needs dedicated implementation time

**Recommendation:** Create dedicated Reports module with 3 standalone pages following existing CSV export patterns. Add Reports menu item to main navigation.

---

# 3.7 Reports (MVP - Basic Only)

**Note:** Analytics dashboards and advanced reporting are NOT in MVP scope. Focus is on data entry and basic list exports.

## Reports Included in MVP

**Report Access Control:**
- **Democratic approach:** All users can access all reports
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

## 1. Opportunities by Principal Report ⭐ MOST IMPORTANT

**Purpose:** See all opportunities grouped by which brand/manufacturer (Principal) they're for.

**Access:** Reports > Opportunities by Principal (available to all users)

**Features:**
- Grouped list view: Principal as header, opportunities nested underneath
- Show per Principal:
  - Count of opportunities (active vs closed)
  - List of opportunities with: Customer Org, Stage, Status, Expected Close Date, Owner
- Filters:
  - Status (active, closed, on_hold)
  - Stage (all 8 stages)
  - Date range (Expected Close Date)
  - Owner
- Sort options:
  - By Principal name (A-Z)
  - By opportunity count (most to least)
  - By expected close date (soonest first)
- Export: CSV with columns [Principal, Customer Org, Opportunity Name, Stage, Status, Expected Close, Owner]

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

---

## 2. Weekly Activity Summary Report

**Purpose:** See what each user did this week (calls, meetings, emails logged).

**Access:** Reports > Weekly Activity Summary

**Features:**
- Grouped by user (sales rep), shows activities for selected week
- Show per user:
  - Activity count breakdown (# calls, # emails, # meetings, # notes)
  - List of activities with: Type, Date, Description (truncated), Related Entity
- Filters:
  - Date range picker (defaults to current week: Mon-Sun)
  - User multi-select (default: all users)
  - Activity type (call, email, meeting, note)
- Sort: By date (newest first) within each user
- Export: CSV with columns [User, Date, Activity Type, Description, Related Entity]

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

---

## 3. Filtered List Exports (All Modules)

**Purpose:** Export any filtered/searched list to CSV for offline analysis.

**Access:** Any list view (Organizations, Contacts, Opportunities, Products) has "Export to CSV" button

**Features:**
- Button in list view toolbar (top right)
- Respects current filters and search
- Exports visible columns only
- File format: `{module}_export_{date}.csv`

**Examples:**
- Organizations filtered by "Priority A" → `organizations_export_2025-11-03.csv`
- Opportunities filtered by "Principal = Fishpeople" → `opportunities_export_2025-11-03.csv`

---

**Future Phase (Not MVP):**
- Analytics dashboard with charts
- Forecasting based on probability/volume
- Saved report configurations
- Scheduled email delivery of reports
- Custom report builder
