# Crispy-CRM Product Requirements Document (PRD)

**Version:** 1.9
**Last Updated:** 2025-11-28
**Status:** MVP In Progress
**Target Launch:** 30-60 days

> **Changelog v1.9:** Industry best practices review - Reduced pipeline to 7 stages (removed `awaiting_response`), added per-stage stale thresholds, visual decay indicators, hybrid duplicate prevention, activity auto-cascade to contacts, "My Performance" dashboard widget, mobile quick actions, daily email digest, task completion follow-up prompts. See [Appendix F](#f-version-history) for details.

---

## 1. Executive Summary

### 1.1 Product Vision

Crispy-CRM replaces Excel-based sales pipeline management for MFB, a food distribution brokerage managing relationships between Principals (manufacturers), Distributors, and Operators (restaurants).

### 1.2 Success Criteria

| Metric | Target |
|--------|--------|
| Team Adoption | 100% within 60 days of launch |
| Data Accuracy | <5% error rate |
| Admin Time Reduction | 40% less time on manual tasks |
| Forecast Accuracy | ±15% variance (post-MVP) |

### 1.3 Launch Readiness Criteria

All three must pass before launch:
1. **Feature Completeness** - All MVP features functional
2. **User Acceptance** - Key users approve after testing
3. **Data Migration** - Current year data successfully imported

**Fallback Plan:** Full commitment - no parallel Excel system

---

## 2. Business Context

### 2.1 The Problem

**Current State: "Excel Hell"**
- Scattered spreadsheets with no single source of truth
- Manual data entry prone to errors
- Formula dependencies that break
- No real-time pipeline visibility
- Difficult to generate principal reports
- No collaboration features

**Why Not Salesforce/HubSpot?**
- Too expensive for team size (6 account managers)
- Too complex - 90% of features unused
- Can't customize to food brokerage workflow
- Don't own the data

### 2.2 Three-Party Model

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────────┐
│   PRINCIPALS    │────▶│     MFB     │────▶│   DISTRIBUTORS   │
│ (Manufacturers) │     │  (Broker)   │     │                  │
└─────────────────┘     └─────────────┘     └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    OPERATORS     │
                    │  (Restaurants)   │
                    └──────────────────┘
```

### 2.3 Scale

| Entity | Count | Examples |
|--------|-------|----------|
| Account Managers | 6 | MFB sales team |
| Principals | 9 | McCRUM, Rapid Rasoi, Kaufholds |
| Distributors | 50+ | Sysco, USF, GFS, PFG |

### 2.4 Key Terminology

| Term | Technical Implementation | Definition |
|------|--------------------------|------------|
| **Organization** | `organizations` table with `type` field | Any company entity in the system |
| **Principal** | Organization with `type = 'principal'` | Food manufacturer whose products MFB represents |
| **Distributor** | Organization with `type = 'distributor'` | Company that buys from principals and distributes |
| **Customer/Operator** | Organization with `type = 'customer'` | Restaurant or foodservice business (end customer) |
| **Opportunity** | `opportunities` table | A deal linking Principal + Distributor + Customer |
| **Authorization** | `authorizations` table (MVP) | When a distributor agrees to carry a principal's products |
| **Won** | `stage = 'closed_won'` | First purchase order placed |

---

## 3. User Roles & Permissions

### 3.1 Role Definitions

| Role | Access Level | Key Activities |
|------|--------------|----------------|
| **Admin** | Full access | User management, settings, all data, delete/archive, product catalog |
| **Manager** | All reps' data | Pipeline review, reports, reassign opportunities |
| **Rep** | Full visibility (all data) | Log activities, manage opportunities, view dashboards, add products |

**User Provisioning:** Admin-only. Only admins can create new user accounts.

**User Deactivation:** When a rep leaves, manager must manually reassign their opportunities.

### 3.2 Visibility Model

**Team-wide visibility:** All reps can see all opportunities and activities (collaborative/transparent culture).

### 3.3 Delete Permissions

**Soft delete only** - Nothing is truly deleted. Records are archived/hidden.
- Soft delete available to: Record owner, Manager, Admin
- Hard delete: Not permitted (data preservation)

---

## 4. Data Model

### 4.1 Core Entities

```
Organization (type: principal) ──── (many) Products
     │                                    │
     │                                    │
     └── (many) Opportunities ────────────┘
              │
              ├── (1) Organization (type: distributor)
              │
              ├── (1) Organization (type: customer)
              │
              ├── (many) Products (via junction table)
              │
              └── (many) Activities
```

### 4.2 Opportunity Structure

**Products per Opportunity:** Database supports multiple products; UI shows primary product with indicator (e.g., "Fryer Oil + 2 more"). Click expands to show all products.

**Links three parties:**
- Principal Organization (whose product) - **Required**
- Customer Organization (end customer/restaurant) - **Required**
- Distributor Organization (who will carry it) - Optional

**Required Fields:**
- Principal Organization
- Customer Organization
- At least one Contact (**must belong to Customer Organization** - enforced by system)

**Contact Requirement:** Contacts cannot exist without an organization. For trade show leads, create an "Unknown" or placeholder organization first, then add the contact.

**Opportunity Naming:**
- Auto-generated with override: System suggests name like "McCRUM - Sysco - Restaurant ABC - 001"
- User can edit before saving

**Optional Fields:**
- Distributor Organization
- Products
- Stage (defaults to `new_lead`)
- Priority (defaults to `medium`)
- Expected close date
- Notes

### 4.3 Product & Pricing

| Attribute | Description |
|-----------|-------------|
| **Catalog Type** | Mixed - some principals have SKUs, others just product names |
| **Fields** | Name, SKU, Category, Status, Description |
| **Pricing** | **Post-MVP** - Volume/price tracking deferred |
| **Permissions** | Any rep can add products to catalog (no approval required) |

> **Note:** Value calculation (Volume × Price) is planned for post-MVP. Current MVP tracks opportunities without monetary values.

**Deal Prioritization:** Use the existing Priority field (Low/Medium/High/Critical) for deal ranking. No deal size field in MVP.

### 4.4 Sample Tracking

**Implementation:** Sample is an activity type with status tracking.

**Status Workflow:**
```
Sent → Received → Feedback Given (positive/negative/pending/no_response)
```

**Status Updates:** Manual entry by rep with system reminders
- Rep manually updates status transitions
- System sends follow-up reminders when follow_up_date approaches
- No shipping API integration (MVP)

**Fields (via Activity record):**
- Activity type = `sample`
- Date sent (activity_date)
- Product sampled (linked product)
- Recipient contact (contact_id)
- Feedback status (custom field)
- Feedback notes (description)
- Follow-up date (follow_up_date)

---

## 5. Pipeline & Stages

### 5.1 Pipeline Stages

**7 stages implemented:**

| # | Value | Label | Description | Visual Decay |
|---|-------|-------|-------------|--------------|
| 1 | `new_lead` | New Lead | Initial prospect identification | No |
| 2 | `initial_outreach` | Initial Outreach | First contact and follow-up | No |
| 3 | `sample_visit_offered` | Sample/Visit Offered | Product sampling and visit scheduling | **Yes** - Critical stage requiring follow-up |
| 4 | `feedback_logged` | Feedback Logged | Recording customer feedback (gate stage) | No |
| 5 | `demo_scheduled` | Demo Scheduled | Planning product demonstrations | No |
| 6 | `closed_won` | Closed - Won | Successful deal completion | No |
| 7 | `closed_lost` | Closed - Lost | Lost opportunity | No |

> **Note:** `awaiting_response` stage removed (v1.9) - consolidated with `sample_visit_offered` which now includes visual decay indicators to surface deals needing follow-up.

### 5.2 Stage Probabilities

**Post-MVP Feature** - Weighted forecasting deferred.

### 5.3 Win/Loss Definitions

**Won:** First purchase order placed (`stage = 'closed_won'`)

**Win/Loss Reasons (Required on close):**

**Win Reasons:**
- Relationship (existing trust with buyer)
- Product quality (superior taste, ingredients, specs)
- Price competitive
- Distributor preference
- Other (free text)

**Loss Reasons:**
- Price too high (competitor undercut)
- No distributor authorization (product not available)
- Competitor relationship (buyer already committed)
- Product not a fit
- Timing/budget
- Other (free text)

### 5.4 Opportunity Lifecycle

| Action | Behavior |
|--------|----------|
| **Create** | Required: Principal + Customer + Contact (from Customer Org) |
| **Duplicate** | **Blocked** - System prevents duplicate opportunities |
| **Reopen** | **Allowed** - Win/loss reason is **cleared** (fresh start) |
| **Delete** | **Soft delete only** - Archived, never truly deleted |
| **Reassign** | Manual reassignment by admin/manager |

**Reopen Behavior:** When reopening a closed_won or closed_lost opportunity, the win/loss reason is cleared. If closed again, a new reason must be selected.

---

## 6. Activity Tracking

### 6.1 Activity Types

**13 activity types implemented:**

| Type | Description | Category |
|------|-------------|----------|
| `call` | Phone conversation with contact | Core |
| `email` | Email correspondence | Core |
| `sample` | Product samples sent for evaluation | Core |
| `meeting` | In-person or virtual meeting | Engagement |
| `demo` | Product demonstration | Engagement |
| `proposal` | Formal proposal sent | Sales |
| `follow_up` | Follow-up touchpoint | Sales |
| `trade_show` | Trade show interaction | Event |
| `site_visit` | On-site visit to customer | Engagement |
| `contract_review` | Contract discussion/review | Sales |
| `check_in` | Quick check-in call/message | Relationship |
| `social` | Social media interaction | Relationship |
| `note` | Internal note (not customer-facing) | Admin |

### 6.2 Quick Activity Logging

**Target:** Under 30 seconds per entry

**Required Fields:**
1. Activity type
2. Related entity (Opportunity, Contact, or Organization)
3. Note (free text)

**Auto-captured:**
- Logged by (current user)
- Timestamp
- Duration (optional)

**Activity Auto-Cascade (v1.9):**

When logging an activity on an Opportunity, the system automatically links the activity to the Opportunity's primary Contact.

| User Logs On | Auto-Linked To | Rationale |
|--------------|----------------|-----------|
| Opportunity | Primary Contact | Contact relationship builds over time |
| Contact | — | Direct contact activity, no cascade |
| Organization | — | Org-level activity, no cascade |

**Business Rules:**
- Primary contact = first contact associated with opportunity
- Auto-cascade is silent (no confirmation dialog)
- Activity appears in both Opportunity and Contact timelines
- Contact can be changed manually after logging if needed

### 6.3 Stale Deal Detection

**Definition:** Per-stage thresholds with visual decay indicators

**Per-Stage Stale Thresholds:**

| Stage | Stale Threshold | Rationale |
|-------|-----------------|-----------|
| `new_lead` | 7 days | New leads need quick follow-up |
| `initial_outreach` | 14 days | Standard engagement cycle |
| `sample_visit_offered` | 14 days | **Critical** - Visual decay applies here |
| `feedback_logged` | 21 days | Allow time for evaluation |
| `demo_scheduled` | 14 days | Standard engagement cycle |
| `closed_won` / `closed_lost` | N/A | Closed deals don't go stale |

**Visual Decay Indicators (v1.9):**

For `sample_visit_offered` stage (where deals often stall waiting for customer feedback):

| Days Since Activity | Visual Indicator | Border Color |
|--------------------|------------------|--------------|
| 0-7 days | Green border | Fresh/Active |
| 8-14 days | Yellow border | Needs attention |
| 14+ days | Red border | Stale/At risk |

**Implementation:** Database view calculates `momentum` field:
- `increasing` - Activity in last 7 days
- `steady` - Activity 8-14 days ago
- `decreasing` - Activity declining
- `stale` - No activity past stage threshold

**Display:** Highlighted on dashboard and opportunity lists with color-coded borders

---

## 7. User Workflows

### 7.1 Rep Daily Workflow

**Morning Start:**
1. Open CRM → Principal dashboard (primary view)
2. Review deals needing attention (stale warnings)
3. Check tasks due today
4. Plan day's activities

**Field Visit (Mobile/Tablet):**
- Full opportunity management capability:
  - Log activities
  - Update opportunity stages
  - Create new opportunities
  - Edit existing opportunities
  - Complete tasks

**End of Day:**
- Ensure all activities logged
- Update opportunity stages as needed
- Review tomorrow's tasks

### 7.2 Manager Weekly Workflow

**Daily:**
- Quick dashboard glance (activity counts, pipeline movement)
- Review team notifications

**Weekly:**
- Formal pipeline review with team
- Review all deals by rep
- Identify blockers and stale deals

### 7.3 Principal Reporting Workflow

1. Select principal
2. Choose date range (custom)
3. Generate report (Excel format)
4. Email to principal

---

## 8. Reporting & Forecasting

### 8.1 Reports Module Overview

The Reports module (`/reports`) provides tabbed access to different report types with a global filter system for consistent data scoping.

**Tabs:**
| Tab | Component | Description |
|-----|-----------|-------------|
| Overview | `OverviewTab` | Dashboard with KPIs and visualizations |
| Opportunities by Principal | `OpportunitiesByPrincipalReport` | Principal-filtered pipeline analysis |
| Weekly Activity | `WeeklyActivityReport` | 7-day activity summary with rep breakdown |
| Campaign Activity | `CampaignActivityTab` | Track activities tagged to campaigns |

### 8.2 Overview Dashboard

The Overview tab provides at-a-glance KPIs and trend visualizations.

**KPI Cards:**
| KPI | Description | Trend Calculation |
|-----|-------------|-------------------|
| Total Opportunities | Count of active (non-deleted) opportunities | Compare recent vs older activity periods |
| Activities This Week | Activities logged in current week | Week-over-week comparison |
| Stale Leads | Leads with no activity in 7+ days | Count only (no trend) |

**Charts:**
| Chart | Type | Data Source |
|-------|------|-------------|
| Pipeline by Stage | Bar chart | Opportunity counts per stage |
| Activity Trend (14 Days) | Line chart | Daily activity counts |
| Top Principals by Opportunities | Horizontal bar | Opportunity counts grouped by principal |
| Rep Performance | Grouped bar | Activities + opportunities per rep |

### 8.3 Principal Reports

**Frequency:** Varies by principal (store preference per principal)

**Format:** Excel export (PDF post-MVP)

**Date Range:** Custom date picker

**Available Report Sections:**

| Section | Description |
|---------|-------------|
| Pipeline by Stage | Deal counts at each stage |
| Activity Summary | Calls, emails, samples logged |
| Stale Opportunities | Deals needing attention |

### 8.4 Campaign Activity Report

Track marketing campaign effectiveness through activity tagging.

**Fields:**
- Campaign name (text filter)
- Date range picker
- Activity counts by type
- Associated opportunities

**Export:** CSV with formula injection protection (`sanitizeCsvValue`)

### 8.5 Global Filter System

All report tabs share a global filter context for consistent data scoping.

**Filter Controls:**
| Filter | Type | Persistence |
|--------|------|-------------|
| Sales Rep | Single-select dropdown | localStorage |
| Time Period | Preset options (7d, 30d, 90d, YTD, Custom) | localStorage |
| Custom Date Range | Start/End date pickers | localStorage |

**Implementation:** `GlobalFilterContext` provides filter state to all tabs. Selections persist across tab switches and browser sessions.

**Preset Time Periods:**
- Last 7 Days
- Last 30 Days
- Last 90 Days
- Year to Date
- Custom Range

### 8.6 Forecasting

**Post-MVP Feature**

Future implementation will include:
- Weekly/Monthly/Quarterly forecasts
- Stage-based probability weighting
- Volume × Price calculations

### 8.7 Metrics NOT in MVP

- Velocity metrics (time-in-stage, cycle time)
- Principal login portal
- Weighted value forecasting
- PDF export
- Won/Lost Analysis (requires win/loss reason UI implementation first)

---

## 9. User Interface

### 9.1 Primary Navigation

**List with Filters** - Sortable/filterable table as primary opportunity view

**Filter Options:**
- Principal (Organization type)
- Stage
- Owner (rep)
- Date range
- Status (Open/Won/Lost)
- Campaign (simple text tag on opportunity - not a separate entity)

**Bulk Operations (MVP):**
- Bulk stage updates
- Bulk owner reassignment
- Bulk soft delete
- Select all / select page / individual selection

**Search:**
- Entity-specific search within each module (MVP)
- Global search across all entities (Post-MVP)

### 9.2 Dashboard

**Default View:** Principal-focused dashboard (V3)

**Key Components:**
- KPI Summary Row (4 clickable metric cards)
- Pipeline summary by principal with momentum indicators
- Stale deal warnings (per-stage thresholds with visual decay)
- Tasks panel (time-bucketed: Overdue → Today → Tomorrow)
- Quick activity logging FAB (Floating Action Button)
- Recent activity feed
- **My Performance widget (v1.9)**

#### 9.2.1 KPI Summary Row (v1.9 - CORRECTED)

Four clickable metric cards at top of dashboard. Each card navigates to a filtered list view on click.

| # | KPI | Display | Click Action | Notes |
|---|-----|---------|--------------|-------|
| 1 | **Open Opportunities** | Count (e.g., "23") | → Opportunities list (open only) | ⚠️ Changed from "Total Pipeline Value" - no $ amounts in MVP |
| 2 | **Overdue Tasks** | Count (RED if > 0) | → Tasks list (overdue filter) | Red destructive styling when count > 0 |
| 3 | **Activities This Week** | Count | → Activities list (this week) | Calendar week (Mon-Sun) |
| 4 | **Stale Deals** | Count (AMBER if > 0) | → Opportunities list (stale filter) | Per-stage thresholds apply |

> **CRITICAL FIX (v1.9):** The first KPI was incorrectly showing "Total Pipeline Value: $125,000" which conflicts with Decision #5 (Pricing/Volume deferred to post-MVP). Changed to "Open Opportunities" count to avoid misleading users about forecasting capabilities.

**KPI Card Interaction:**
- `role="button"` with `tabIndex={0}` for keyboard accessibility
- `aria-label` includes metric name, value, and "Click to view details"
- Hover: subtle elevation lift
- Focus: `ring-2 ring-primary` focus indicator

#### 9.2.2 Pipeline Table UI Clarity (v1.9)

**Column Definitions with Tooltips:**

| Column | Tooltip Text | Calculation |
|--------|--------------|-------------|
| **This Week** | "Activities logged Mon-Sun of current week" | Count of activities with `activity_date` in current calendar week |
| **Last Week** | "Activities logged Mon-Sun of previous week" | Count of activities with `activity_date` in previous calendar week |
| **Momentum** | "Based on activity trend over 14 days" | See Section 6.3 for thresholds |

**"Next Action" Column Behavior:**
- If opportunity has a scheduled task → Show task subject as text
- If no scheduled task → Show "Schedule follow-up" as **plain text** (not a link)
- ⚠️ **Do NOT** use `variant="link"` styling for non-functional elements

#### 9.2.3 Task Snooze Behavior (v1.9)

When user clicks the snooze icon (⏰) on a task:

**Interaction Flow:**
```
[Click ⏰] → Popover opens with options:
            ┌─────────────────────────┐
            │ Snooze until...         │
            ├─────────────────────────┤
            │ ○ Tomorrow              │
            │ ○ Next Week (Monday)    │
            │ ○ Custom Date... [📅]   │
            └─────────────────────────┘
```

**Business Rules:**
- "Tomorrow" = next calendar day at 9:00 AM
- "Next Week" = following Monday at 9:00 AM
- "Custom Date" opens date picker (time defaults to 9:00 AM)
- Snooze updates `due_date` field on task record
- Toast notification: "Task snoozed until [date]"

> **Rationale:** Auto-snoozing by exactly 24 hours without feedback is confusing. Users need to know when the task will reappear.

#### 9.2.4 Tasks Panel Scope (v1.9)

The Tasks panel shows **only immediate tasks** (Overdue, Today, Tomorrow). Tasks due in 3+ days do NOT appear on the dashboard.

| Time Bucket | Color | Criteria |
|-------------|-------|----------|
| **Overdue** | 🔴 Red (`destructive`) | `due_date < today` |
| **Today** | 🟡 Amber (`warning`) | `due_date = today` |
| **Tomorrow** | 🔵 Blue (`info`) | `due_date = tomorrow` |
| **Future** | — | Not shown on dashboard |

> **User Expectation:** Users should use the full Tasks list (`/tasks`) to see all upcoming tasks. The dashboard is for **immediate execution**, not planning.

**My Performance Widget:**

Personal performance snapshot showing current user's metrics:

| Metric | Display | Time Period |
|--------|---------|-------------|
| Activities This Week | Count + trend arrow | Current week |
| Deals Moved Forward | Stage progressions | Current week |
| Tasks Completed | Count | Current week |
| Open Opportunities | Active deal count | Current |

**Design:**
- Compact card in dashboard sidebar
- Green/red trend indicators vs. previous week
- Click-through to detailed personal report

### 9.3 Responsive Design

| Screen Size | Support Level |
|-------------|---------------|
| Desktop (1024px+) | Primary design |
| Tablet (768-1023px) | Full functionality |
| Phone (320-767px) | **Full functionality** (required) |

**Approach:** Desktop-first design with full mobile support

**Mobile Quick Actions (v1.9):**

Field reps need fast, one-tap access to common activities. The mobile interface shows 6 optimized quick action buttons:

| Quick Action | Activity Type | Rationale |
|--------------|---------------|-----------|
| Log Check-In | `check_in` | Quick "I was here" marker |
| Log Sample Drop | `sample` | Sample delivery in field |
| Log Call | `call` | Phone conversation |
| Log Meeting/Visit | `meeting` / `site_visit` | In-person engagement |
| Quick Note | `note` | Fast text capture |
| Complete Task | Task completion | Mark tasks done on-the-go |

**Desktop-Only Activity Types (accessible via full form):**
- `email` - Typically logged at desk
- `demo` - Scheduled, not impromptu
- `proposal` - Document-heavy
- `trade_show` - Event context
- `contract_review` - Complex activity
- `social` - Less common
- `follow_up` - Can use Quick Note instead

### 9.4 Theme

**Dark Mode:** User-toggleable (support both light and dark themes)

---

## 10. Technical Requirements

### 10.1 Authentication

**Method:** Email + Password (traditional login)

**Session:** Standard web session management via Supabase Auth

**Future:** Google SSO (not MVP)

### 10.2 Connectivity

**Offline Mode:** Not supported (online required)

All operations require internet connection.

### 10.3 Audit Trail

**Full audit logging:**
- Track all field changes
- Record: who, what, when, old value, new value
- All entities audited
- View via ChangeLog tab on opportunities

### 10.4 Duplicate Prevention

**Hybrid Duplicate Detection (v1.9):**

Two-tier approach balancing data quality with user flexibility:

| Match Type | Behavior | User Action |
|------------|----------|-------------|
| **Exact Match** | Hard block | Must use existing opportunity |
| **Fuzzy Match** | Soft warning | Can proceed with confirmation |

**Exact Match Definition:**
- Same Principal + Same Customer + Same Product (if specified)
- Case-insensitive comparison
- **Hard block** - Cannot create duplicate

**Fuzzy Match Definition:**
- Similar customer name (Levenshtein distance ≤ 3)
- Same Principal + Different product
- **Soft warning** - Shows potential duplicates, allows creation

**Implementation:**
```
ON opportunity.create:
  IF exact_match_exists:
    BLOCK with link to existing opportunity
  ELSE IF fuzzy_match_found:
    WARN "Similar opportunity exists: [link]"
    ALLOW creation with confirmation
  ELSE:
    CREATE normally
```

---

## 11. Data Migration

### 11.1 Initial Migration

| Attribute | Value |
|-----------|-------|
| **Source** | One master Excel spreadsheet |
| **Scope** | Current year only |
| **Timing** | One-time bulk import at launch |

### 11.2 Ongoing Import

**CSV Upload:** Available for Contacts

**Supported Entities:**
- Contacts (with organization mapping)

**Invalid Data Handling:**
- Import valid rows
- Skip invalid rows
- Generate error report for skipped rows

### 11.3 Import Fields

*Mapped during Contact Import wizard with column auto-detection*

---

## 12. Tasks & Notifications

### 12.1 Task Management (MVP)

Full task system implemented:

| Feature | Description |
|---------|-------------|
| Task Types | Call, Email, Meeting, Follow-up, Demo, Proposal, Other |
| Priority Levels | Low, Medium, High, Critical |
| Assignment | Assign to self or other reps |
| Due Dates | With optional reminders |
| Completion | Mark complete with optional follow-up task creation |
| Linking | Link tasks to Contacts and Opportunities |

### 12.2 Notifications (MVP)

In-app notification system implemented:

| Feature | Description |
|---------|-------------|
| Task Reminders | Due date approaching notifications |
| Overdue Alerts | Tasks past due date |
| In-App Dropdown | Bell icon with unread count |
| Mark as Read | Individual and bulk mark as read |

### 12.3 Daily Email Digest (v1.9)

**Delivery:** 7:00 AM local time via Supabase Edge Function (cron)

**Scope:** Tasks + Stale Deals (per user decision)

**Email Content Structure:**

```
Subject: Your Daily CRM Digest - [Date]

🚨 RED ALERT: Overdue Tasks
   - [Task 1] - Due [X days ago]
   - [Task 2] - Due [X days ago]

📅 TODAY: Tasks Due Today
   - [Task 3] - [Opportunity Name]
   - [Task 4] - [Contact Name]

⚠️ AT RISK: Deals Needing Attention
   - [Opportunity] in "Sample Offered" - 16 days since activity
   - [Opportunity] in "New Lead" - 9 days since activity

[View Dashboard →]
```

**Configuration:**
- Per-user opt-in/opt-out in user settings
- Default: Enabled for all users
- Skip empty digests (no email if nothing to report)

### 12.4 Task Completion Follow-Up Prompt (v1.9)

When a user marks a task complete, prompt for follow-up:

**Flow:**
```
[Mark Complete] → Modal: "Create follow-up task?"
                   [Yes - Opens task form pre-filled]
                   [No - Close and complete]
```

**Pre-filled Fields:**
- Related entity (same as completed task)
- Assigned to (current user)
- Due date (empty - user must set)

**Design:** Non-blocking modal, can dismiss with Escape or click outside

### 12.5 Future Notifications

- Push notifications (mobile)
- Real-time WebSocket notifications (post-MVP)

---

## 13. Authorization Tracking

### 13.1 Dual-Level Authorization Architecture (MVP - To Implement)

Authorization tracking operates at **two levels** to support both broad distributor relationships and granular product-level control.

#### Level 1: Distributor-Principal Authorization (Organization Level)

Track which distributors are authorized to carry a principal's product line.

**Table:** `distributor_principal_authorizations` (to be created)

**Fields:**
- `distributor_id` - Organization with type='distributor'
- `principal_id` - Organization with type='principal'
- `is_authorized` - Boolean (Authorized/Not Authorized)
- `authorization_date` - When authorization was granted
- `expiration_date` - Optional expiration (nullable)
- `notes` - Free text notes
- `created_by` - User who created the record

**Use Case:** "Sysco is authorized to carry McCRUM products"

#### Level 2: Product-Distributor Authorization (Product Level)

Track product-specific exceptions to the organization-level authorization.

**Table:** `product_distributor_authorizations` (exists)

**Fields:**
- `product_id` - Specific product from products table
- `distributor_id` - Organization with type='distributor'
- `is_authorized` - Boolean override
- `authorization_date`, `notes`, `created_by`

**Use Case:** "Sysco carries McCRUM products EXCEPT for Product X (discontinued)"

#### Authorization Logic

```
IF product_distributor_authorization exists for (product, distributor):
    USE product-level authorization
ELSE:
    DERIVE from distributor_principal_authorization (via product.principal_id)
```

### 13.2 Authorization Workflow

- **View authorizations on Distributor detail page** - New "Authorizations" tab showing:
  - List of authorized principals (org-level)
  - Product-level exceptions/overrides
- **Soft warning** when creating opportunity for non-authorized combo (banner displayed, creation allowed)
- Filter opportunities by authorization status
- No manager approval required - informational warning only

### 13.3 Lost Authorization

**When a distributor loses authorization:**
- Manual cleanup by users
- No automatic cascade to opportunities
- Users manually close affected opportunities
- Product-level authorizations remain (explicit overrides preserved)

---

## 14. Rep Performance (KPIs)

### 14.1 What Defines a "Good Week"

- Number of activities logged
- Deals moved forward (stage progression)
- New opportunities created
- Tasks completed

### 14.2 Manager Visibility

- **Login tracking:** No (trust-based culture)
- **Activity counts:** Yes
- **Pipeline movement:** Yes
- **Task completion:** Yes

---

## 15. Must-Have Features (MVP)

### 15.1 Critical Path Features

| # | Feature | Status | Acceptance Criteria |
|---|---------|--------|---------------------|
| 1 | Principal-filtered views | ✅ Done | Filter all views by single principal |
| 2 | Quick activity logging | 🔧 Partial | Log activity in <30 seconds. **Gap:** Only 5 of 13 activity types supported |
| 3 | Export to Excel | ✅ Done | Generate principal reports in Excel |
| 4 | Sample tracking | 🔧 TODO | Need `sample` activity type + full status workflow UI (Sent→Received→Feedback) |
| 5 | Mobile/tablet access | ✅ Done | Full functionality on phone screens |
| 6 | Opportunity list with filters | ✅ Done | Sort/filter by principal, stage, owner, date |
| 7 | Dashboard with stale warnings | 🔧 Partial | Stale warnings ✅. **Gap:** Missing Recent Activity Feed component |
| 8 | CSV import (Contacts) | 🔧 Disabled | Feature implemented but UI disabled. Needs testing before enabling |
| 9 | Soft delete + audit trail | ✅ Done | All changes tracked, nothing hard deleted |
| 10 | Dark mode toggle | ✅ Done | User can switch between light/dark theme |
| 11 | Tasks & Notifications | ✅ Done | Full task management with reminders |
| 12 | Win/Loss Reasons | 🔧 TODO | Required reasons when closing opportunity |
| 13 | Duplicate Prevention | 🔧 TODO | Block duplicate opportunity creation |
| 14 | Authorization Tracking | 🔧 TODO | Track distributor-principal authorizations |
| 15 | Dashboard KPI fix | 🔧 TODO | Change "Total Pipeline Value" KPI to "Total Open Opportunities" count |
| 16 | Recent Activity Feed | 🔧 TODO | Add activity feed component to dashboard showing recent team activities |
| 17 | QuickLogForm all 13 types | 🔧 TODO | Add missing 8 activity types: sample, demo, proposal, trade_show, site_visit, contract_review, check_in, social |
| 18 | Contact org enforcement | 🔧 TODO | Enforce organization_id as required field in schema + UI. Block orphan contact creation |
| 19 | Contact organization filter | 🔧 TODO | Add organization filter to ContactListFilter (tests exist, UI missing) |
| 20 | Bulk owner reassignment | 🔧 TODO | Add BulkReassignButton to Organizations list for manager workflows |
| 21 | Authorization UI | 🔧 TODO | Add Authorizations tab to Distributor organization detail page (see Section 13.2) |
| 22 | ProductList create buttons | 🔧 TODO | Add CreateButton to TopToolbar + FloatingCreateButton (match ContactList UX) |
| 23 | Remove F&B fields from Product UI | 🔧 TODO | Remove certifications, allergens, ingredients, nutritional_info, marketing_description from ProductCertificationsTab |
| 24 | Remove DataQualityTab | 🔧 TODO | Delete DataQualityTab.tsx and related DB artifacts (duplicate_stats view, contact_duplicates view, merge_duplicate_contacts RPC) per Decision #32 |
| 25 | Per-stage stale thresholds | 🔧 TODO | Implement variable stale thresholds per stage (7d new_lead, 14d outreach, 21d feedback) with visual decay indicators |
| 26 | Visual decay indicators | 🔧 TODO | Add green/yellow/red border colors for `sample_visit_offered` stage based on days since activity |
| 27 | Activity auto-cascade | 🔧 TODO | Auto-link opportunity activities to primary contact |
| 28 | My Performance widget | 🔧 TODO | Add personal metrics widget to dashboard (activities, deals moved, tasks completed) |
| 29 | Mobile quick actions | 🔧 TODO | Implement 6-button mobile quick action bar (Check-In, Sample Drop, Call, Meeting, Note, Complete Task) |
| 30 | Hybrid duplicate prevention | 🔧 TODO | Hard block exact matches, soft warn fuzzy matches with confirmation |
| 31 | Daily email digest | 🔧 TODO | 7 AM cron via Supabase Edge Function with overdue tasks + stale deals |
| 32 | Task follow-up prompt | 🔧 TODO | Modal prompt on task completion asking to create follow-up task |
| 33 | Pipeline stage migration | 🔧 TODO | Migrate from 8 to 7 stages (remove `awaiting_response`, update existing data) |

### 15.2 Post-MVP Features

| Feature | Reason |
|---------|--------|
| PDF export | Excel sufficient for MVP |
| Forecasting (weighted) | Requires pricing/probability setup |
| Volume/Price tracking | Deferred complexity |
| Opportunity CSV import | Contact import sufficient |
| Organization CSV import | Code exists but deferred; Contact import is higher priority |
| Velocity metrics | Future analytics |
| Principal login portal | Future feature |
| Offline mode | Online required |
| Google SSO | Email/password sufficient |
| Won/Lost Analysis Report | Requires win/loss reason UI implementation first (see MVP #12) |

---

## 16. Decision-Making

### 16.1 Priority Decisions

**Process:** Team consensus

**Escalation:** If consensus not reached, management makes final call

### 16.2 Resolved Questions

| # | Question | Decision | Date |
|---|----------|----------|------|
| 1 | Pipeline stages | Reduced to 7 stages (removed `awaiting_response`) | 2025-11-28 |
| 2 | Activity types | Keep all 13 types (add sample) | 2025-11-27 |
| 3 | Required fields | Principal + Customer + Contact | 2025-11-27 |
| 4 | Products per opp | Multi in DB, simplified UI | 2025-11-27 |
| 5 | Pricing/Volume | Defer to post-MVP | 2025-11-27 |
| 6 | PDF export | Excel only for MVP | 2025-11-27 |
| 7 | Tasks/Notifications | Include in MVP (already built) | 2025-11-27 |
| 8 | Contact-Org constraint | Contact must belong to Customer Org (strict) | 2025-11-27 |
| 9 | Opportunity naming | Auto-generated with user override | 2025-11-27 |
| 10 | Authorization warning | Soft warning only (allow creation) | 2025-11-27 |
| 11 | Sample status updates | Manual with system reminders | 2025-11-27 |
| 12 | Reopen win/loss reason | Clear reason on reopen (fresh start) | 2025-11-27 |
| 13 | Bulk operations | Full bulk ops (stage, owner, delete) | 2025-11-27 |
| 14 | Global search | Entity-specific MVP, global post-MVP | 2025-11-27 |
| 15 | Organization dual-role | Single type only (no dual roles) | 2025-11-27 |
| 16 | QuickLogForm performance | Passes <30 second target (tested) | 2025-11-27 |
| 17 | Campaign entity | Simple text tag on opportunity (not entity) | 2025-11-28 |
| 18 | Deal prioritization | Priority field only (Low/Med/High/Critical) | 2025-11-28 |
| 19 | Orphan contacts | Not allowed - require organization first | 2025-11-28 |
| 20 | User provisioning | Admin-only account creation | 2025-11-28 |
| 21 | Competitor tracking | Free text only (no entity) | 2025-11-28 |
| 22 | Product catalog permissions | Any rep can add products | 2025-11-28 |
| 23 | User deactivation | Manual reassignment by manager | 2025-11-28 |
| 24 | Activity attachments | No attachments in MVP (text only) | 2025-11-28 |
| 25 | Recent Activity Feed | Required on dashboard (audit finding) | 2025-11-28 |
| 26 | QuickLogForm activity types | All 13 types required in quick logger | 2025-11-28 |
| 27 | Sample tracking workflow | Full UI workflow required (Sent→Received→Feedback) | 2025-11-28 |
| 28 | Dashboard KPI metric | Replace "Pipeline Value" with "Open Opportunities" count | 2025-11-28 |
| 29 | Contact org enforcement | Enforce organization_id as required (schema + UI). Block orphan contacts | 2025-11-28 |
| 30 | CSV import availability | Keep disabled until tested. Update status from "Done" to "Disabled" | 2025-11-28 |
| 31 | Contact organization filter | Add org filter to ContactListFilter to match test expectations | 2025-11-28 |
| 32 | Contact duplicate UI | Remove DB artifacts (view + function). Admin-only SQL cleanup sufficient | 2025-11-28 |
| 33 | Organization priority system | Keep A/B/C/D letter grades for organizations (distinct from opportunity Low/Med/High/Critical) | 2025-11-28 |
| 34 | Authorization granularity | Dual-level: org-level (Distributor↔Principal) + product-level exceptions. Both are needed | 2025-11-28 |
| 35 | Organization CSV import | Move to Post-MVP. Code exists but Contact import is higher priority | 2025-11-28 |
| 36 | Organization hierarchy | Document in PRD. Valuable for franchise/branch modeling | 2025-11-28 |
| 37 | Organization segments | Document in PRD. Used for business classification (Restaurant, Hotel, etc.) | 2025-11-28 |
| 38 | Bulk owner reassignment | Add to MVP. Required for manager workflows when reps leave | 2025-11-28 |
| 39 | Authorization UI | Add to MVP. Reps need to see authorized principals on distributor pages | 2025-11-28 |
| 40 | ProductList create buttons | Add both CreateButton and FloatingCreateButton for consistent UX with ContactList | 2025-11-28 |
| 41 | Product distributor_id field | Keep for authorization tracking (product-level distributor relationships) | 2025-11-28 |
| 42 | Product F&B fields | Remove from UI. Fields (certifications, allergens, etc.) not in PRD spec - simplify to match spec | 2025-11-28 |
| 43 | Won/Lost Analysis Report | Move to Post-MVP. Requires Win/Loss Reasons UI (#12) to be implemented first | 2025-11-28 |
| 44 | DataQualityTab removal | Remove DataQualityTab.tsx and related DB artifacts (per Decision #32). Admin SQL cleanup is sufficient | 2025-11-28 |
| 45 | Campaign Activity Tab | Document in PRD. Tab exists and provides campaign-tagged activity tracking | 2025-11-28 |
| 46 | Overview Dashboard charts | Document all 4 charts in PRD: Pipeline, Activity Trend, Top Principals, Rep Performance | 2025-11-28 |
| 47 | Global Filter System | Document in PRD. GlobalFilterContext provides persistent filter state across report tabs | 2025-11-28 |
| 48 | Pipeline stage reduction | Remove `awaiting_response` stage. Consolidate with `sample_visit_offered` + visual decay | 2025-11-28 |
| 49 | Per-stage stale thresholds | Implement variable thresholds (7d/14d/21d) instead of universal 14-day | 2025-11-28 |
| 50 | Visual decay indicators | Green/yellow/red borders for `sample_visit_offered` stage | 2025-11-28 |
| 51 | Activity auto-cascade | Auto-link opportunity activities to primary contact | 2025-11-28 |
| 52 | Product display hybrid | Show "Primary + X more" with expandable detail | 2025-11-28 |
| 53 | My Performance widget | Personal metrics widget on dashboard | 2025-11-28 |
| 54 | Mobile quick actions | 6-button mobile bar (Check-In, Sample, Call, Meeting, Note, Task) | 2025-11-28 |
| 55 | Hybrid duplicate prevention | Hard block exact, soft warn fuzzy | 2025-11-28 |
| 56 | Daily email digest | 7 AM cron with tasks + stale deals (not closing soon) | 2025-11-28 |
| 57 | Task follow-up prompt | Modal on task completion to create follow-up | 2025-11-28 |
| 58 | Feedback stage distinct | Keep `feedback_logged` as gate stage (not merged with sample) | 2025-11-28 |
| 59 | Check-in mobile priority | Move `check_in` to mobile quick actions (field use case) | 2025-11-28 |

### 16.3 Open Questions

*No open questions - all clarified via Gemini 3 Pro + GPT 5.1 deep analysis + Claude audit + industry best practices review (Perplexity research).*

---

## 17. Risks & Mitigations

### 17.1 Adoption Risk

**Risk:** Missing key features that block daily workflows

**Mitigation:** Focus on must-haves (principal views, quick logging, exports, samples, mobile)

### 17.2 Data Quality Risk

**Risk:** Garbage in from Excel migration

**Mitigation:** Skip invalid rows, generate error report, manual cleanup queue

### 17.3 Full Commitment Risk

**Risk:** No Excel fallback means issues are critical

**Mitigation:** Thorough user testing before launch, staged rollout consideration

### 17.4 MVP Blocker Risk

**Risk:** 25 features still need implementation (updated per industry best practices review 2025-11-28)

**Mitigation:** Prioritize in order:
1. **Contact enforcement** (Critical): Enforce organization requirement - blocks orphan contacts
2. **Pipeline migration** (Critical): Migrate from 8→7 stages, update existing `awaiting_response` records
3. **Dashboard gaps** (Quick wins): KPI fix, Recent Activity Feed, QuickLogForm 13 types, My Performance widget
4. **Stale detection** (Medium): Per-stage thresholds, visual decay indicators
5. **Contact filters** (Medium): Add organization filter to ContactListFilter
6. **Sample tracking** (Medium): Full workflow UI with status + feedback
7. **Organization features** (Medium): Bulk owner reassignment, Authorization UI tab
8. **Product UX** (Quick win): Add create buttons to ProductList, remove F&B fields from UI
9. **Mobile UX** (Medium): 6-button mobile quick actions
10. **Business logic** (Complex): Win/Loss UI, Hybrid Duplicate Prevention, Authorization Tracking, Activity auto-cascade
11. **Notifications** (Medium): Daily email digest (Supabase Edge Function), Task follow-up prompt
12. **Cleanup** (Low): Remove DataQualityTab + unused contact_duplicates DB artifacts

---

## 18. Appendix

### A. Win/Loss Reason Options

**Win Reasons:**
- Relationship (existing trust)
- Product quality
- Price competitive
- Distributor preference
- Other (free text)

**Loss Reasons:**
- Price too high
- No distributor authorization
- Competitor relationship (competitor name in free-text notes)
- Product not a fit
- Timing/budget
- Other (free text)

**Competitor Tracking:** Free text only. No competitor entity in MVP. Mention competitor names in notes or "Other" loss reason field.

### B. Sample Feedback Options

- Positive
- Negative
- Pending
- No response

### C. Activity Type Reference

| Type | When to Use |
|------|-------------|
| `call` | Phone conversations |
| `email` | Email correspondence |
| `sample` | Product samples sent |
| `meeting` | In-person or virtual meetings |
| `demo` | Product demonstrations |
| `proposal` | Formal proposals |
| `follow_up` | Follow-up touchpoints |
| `trade_show` | Trade show interactions |
| `site_visit` | On-site customer visits |
| `contract_review` | Contract discussions |
| `check_in` | Quick check-ins |
| `social` | Social media interactions |
| `note` | Internal notes (not customer-facing) |

### D. Organization Type Reference

**Note:** Organizations have a single type only. Dual-role organizations (e.g., both Distributor and Customer) should be handled by creating separate organization records if needed.

| Type | UI Label | Description |
|------|----------|-------------|
| `principal` | Principal | Food manufacturer |
| `distributor` | Distributor | Distribution company |
| `customer` | Customer/Operator | Restaurant/foodservice |
| `prospect` | Prospect | Potential customer |
| `unknown` | Unknown | Uncategorized |

### D.1 Organization Priority Reference

**Note:** Organizations use a letter-grade priority system (A/B/C/D), distinct from Opportunity priority (Low/Medium/High/Critical). This provides quick visual triage for account prioritization.

| Priority | UI Label | Description | Color |
|----------|----------|-------------|-------|
| `A` | A - High Priority | Top-tier accounts requiring immediate attention | Red (destructive) |
| `B` | B - Medium-High Priority | Important accounts with active engagement | Amber (warning) |
| `C` | C - Medium Priority | Standard accounts (default for new organizations) | Gray (secondary) |
| `D` | D - Low Priority | Lower priority or dormant accounts | Light gray (muted) |

**Default:** New organizations default to Priority C.

**Usage:** Priority is set per-organization and helps reps focus on high-value relationships. It does not affect opportunity stage calculations.

### D.2 Organization Parent Hierarchy

Organizations support parent-child relationships for modeling corporate structures (franchises, regional branches, subsidiaries).

**Fields:**
- `parent_organization_id` - Reference to parent organization (nullable)

**Features:**
- **Hierarchy Breadcrumb** - Shows parent chain on organization detail page
- **Branch Locations Section** - Lists child organizations on parent's page
- **Rollup Metrics** - Parent orgs show aggregated contact/opportunity counts across branches

**Business Rules:**
- An organization can have at most one parent
- Circular references are prevented at the database level
- Deleting a parent does NOT cascade to children (children become top-level)
- Type inheritance: Children do NOT inherit parent's organization_type

**Use Cases:**
- Sysco (parent) → Sysco Denver, Sysco Chicago (branches)
- Restaurant Group (parent) → Individual restaurant locations

### D.3 Organization Segments

Organizations can be classified into business segments for filtering and reporting.

**Implementation:** `segment_id` references the `segments` table.

**Default Segments:**
- Restaurant
- Hotel/Hospitality
- Healthcare
- Education
- Corporate/Catering
- Retail
- Unknown (default for new organizations)

**Usage:**
- Filter organization lists by segment
- Segment appears in organization detail sidebar
- Segment is included in CSV exports

**Permissions:** Any authenticated user can assign segments. Segment management (add/edit/delete segment types) is admin-only.

### E. Task Type Reference

| Type | Description |
|------|-------------|
| `call` | Phone call task |
| `email` | Send email task |
| `meeting` | Schedule meeting |
| `follow_up` | Follow-up action |
| `demo` | Product demo |
| `proposal` | Send proposal |
| `other` | Other task |

### F. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-27 | Initial PRD from questionnaire |
| 1.1 | 2025-11-27 | Updated after codebase audit: aligned terminology, stages, activity types, required fields, Tasks/Notifications scope, deferred pricing/forecasting/PDF |
| 1.2 | 2025-11-27 | Gemini 3 Pro deep analysis clarifications: Contact must belong to Customer Org, auto-generated opp naming with override, soft authorization warning, sample status manual+reminders, clear win/loss on reopen, full bulk operations, entity-specific search (global post-MVP), single org type only |
| 1.3 | 2025-11-28 | GPT 5.1 deep analysis clarifications: Campaign as text tag (not entity), priority-only deal ranking, contacts require organization, admin-only user creation, any rep can add products, manual reassignment on user deactivation, competitors as free text, no attachments MVP |
| 1.4 | 2025-11-28 | Dashboard audit (Claude): Added 4 implementation gaps - Recent Activity Feed (#16), QuickLogForm 13 types (#17), Sample tracking workflow (#4 updated), KPI metric fix (#15). Updated MVP blocker count from 4→8. Added resolved questions #25-28 |
| 1.5 | 2025-11-28 | Contact audit (Claude): Added 2 implementation gaps - Contact org enforcement (#18), Contact org filter (#19). Changed CSV import status from "Done" to "Disabled". Decision to remove contact_duplicates DB artifacts. Updated MVP blocker count from 8→11. Added resolved questions #29-32 |
| 1.6 | 2025-11-28 | Organization audit (Claude): Documented Organization Priority (A/B/C/D in Appendix D.1), Parent Hierarchy (D.2), Segments (D.3). Expanded Section 13 with dual-level authorization architecture. Moved Org CSV Import to Post-MVP. Added bulk reassignment (#20) and authorization UI (#21) to MVP. Updated blocker count 11→13. Added resolved questions #33-39 |
| 1.7 | 2025-11-28 | Product audit (Claude): Added ProductList create buttons (#22), F&B field removal (#23). Documented distributor_id field purpose for product-level authorization. Updated blocker count 13→15. Added resolved questions #40-42 |
| 1.8 | 2025-11-28 | Reports audit (Claude): Comprehensive Section 8 rewrite documenting Overview Dashboard (4 charts, 3 KPIs), Campaign Activity tab, Global Filter System with localStorage persistence. Moved Won/Lost Analysis to Post-MVP (depends on #12). Added DataQualityTab removal (#24). Updated blocker count 15→16. Added resolved questions #43-47 |
| 1.9 | 2025-11-28 | **Industry best practices review (Perplexity research):** Reduced pipeline from 8→7 stages (removed `awaiting_response`). Added per-stage stale thresholds (7d/14d/21d). Visual decay indicators (green/yellow/red borders) for `sample_visit_offered` stage. Activity auto-cascade to primary contact. "My Performance" dashboard widget. Mobile quick actions (6 buttons). Hybrid duplicate prevention (hard block exact, soft warn fuzzy). Daily email digest at 7 AM (tasks + stale deals). Task completion follow-up prompt. Updated product display to hybrid "Primary + X more". Added 9 new MVP features (#25-33). Added resolved questions #48-59. Updated MVP blocker count 16→25. |

---

*This PRD captures WHAT we're building. For WHY, see [PROJECT_MISSION.md](../PROJECT_MISSION.md). For HOW (technical), see [CLAUDE.md](../CLAUDE.md).*

*Last updated: 2025-11-28 (v1.9 - Industry best practices review)*
