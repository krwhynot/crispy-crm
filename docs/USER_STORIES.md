# Crispy-CRM User Stories

**Generated from:** PRD v1.0
**Date:** 2025-11-27
**Format:** Epic → User Stories → Acceptance Criteria

---

## Story Format

```
As a [role],
I want [feature/action],
So that [benefit/value].
```

**Priority Legend:**
- **P0** = MVP Must-Have (launch blocker)
- **P1** = MVP Nice-to-Have
- **P2** = Post-MVP

---

## Epic 1: Authentication & Access

### US-1.1: User Login
**Priority:** P0

**As a** user,
**I want** to log in with my email and password,
**So that** I can securely access the CRM.

**Acceptance Criteria:**
- [ ] Login form accepts email and password
- [ ] Invalid credentials show clear error message
- [ ] Successful login redirects to dashboard
- [ ] Session persists across page refreshes
- [ ] "Forgot password" link sends reset email

---

### US-1.2: Role-Based Access
**Priority:** P0

**As an** admin,
**I want** users to have role-based permissions (Admin/Manager/Rep),
**So that** access is controlled appropriately.

**Acceptance Criteria:**
- [ ] Admin can access all features including user management
- [ ] Manager can view all reps' data and reassign opportunities
- [ ] Rep can view all data (team-wide visibility)
- [ ] Rep cannot access admin settings or user management
- [ ] Role is displayed in user profile

---

### US-1.3: Dark Mode Toggle
**Priority:** P1

**As a** user,
**I want** to switch between light and dark themes,
**So that** I can use the CRM comfortably in different lighting conditions.

**Acceptance Criteria:**
- [ ] Toggle switch in settings/header
- [ ] Preference persists across sessions
- [ ] All UI elements properly styled in both themes
- [ ] Instant switch without page reload

---

## Epic 2: Opportunity Management

### US-2.1: Create Opportunity (Minimal)
**Priority:** P0

**As a** rep,
**I want** to create a new opportunity with just Principal and Contact name,
**So that** I can quickly capture leads without friction.

**Acceptance Criteria:**
- [ ] Only Principal and Contact name are required fields
- [ ] All other fields (Distributor, Operator, Product, Stage) are optional
- [ ] New opportunity defaults to first pipeline stage
- [ ] Creator is automatically set as owner
- [ ] Timestamp auto-captured

---

### US-2.2: Block Duplicate Opportunities
**Priority:** P0

**As a** rep,
**I want** the system to prevent duplicate opportunities,
**So that** we don't have conflicting records for the same deal.

**Acceptance Criteria:**
- [ ] System checks for existing opp with same Principal + Distributor + Operator + Product
- [ ] If duplicate found, show warning with link to existing opportunity
- [ ] Block creation of exact duplicates
- [ ] Allow creation if any of the four fields differ

---

### US-2.3: Three-Party Opportunity Structure
**Priority:** P0

**As a** rep,
**I want** to link an opportunity to a Principal, Distributor, AND Operator,
**So that** the full deal context is captured.

**Acceptance Criteria:**
- [ ] Principal field (required) - dropdown from principal list
- [ ] Distributor field (optional) - dropdown from distributor list
- [ ] Operator field (optional) - dropdown or free text
- [ ] Product field (optional) - filtered by selected principal
- [ ] All three parties visible on opportunity detail view

---

### US-2.4: Move Opportunity Through Pipeline
**Priority:** P0

**As a** rep,
**I want** to update an opportunity's pipeline stage,
**So that** I can track deal progression.

**Acceptance Criteria:**
- [ ] Stage dropdown shows all 8 stages
- [ ] Stage change is logged in audit trail
- [ ] Stage change updates "last modified" timestamp
- [ ] Can move forward or backward through stages
- [ ] Visual indicator of current stage

---

### US-2.5: Close Opportunity (Won/Lost)
**Priority:** P0

**As a** rep,
**I want** to mark an opportunity as Won or Lost with a reason,
**So that** we can track outcomes and analyze patterns.

**Acceptance Criteria:**
- [ ] "Won" and "Lost" are terminal stages
- [ ] Closing requires selecting a reason from predefined list
- [ ] Optional notes field for additional context
- [ ] Won = "First purchase order placed" (clear definition)
- [ ] Closed date auto-captured

---

### US-2.6: Reopen Closed Opportunity
**Priority:** P0

**As a** rep,
**I want** to reopen a Won or Lost opportunity,
**So that** I can correct mistakes or track revived deals.

**Acceptance Criteria:**
- [ ] Any user can reopen any closed opportunity
- [ ] Reopen action is logged in audit trail
- [ ] Opportunity returns to a selectable stage
- [ ] Previous close reason and date preserved in history

---

### US-2.7: Soft Delete Opportunity
**Priority:** P0

**As a** user,
**I want** deleted opportunities to be archived rather than permanently removed,
**So that** we never lose historical data.

**Acceptance Criteria:**
- [ ] "Delete" action archives the opportunity
- [ ] Archived opportunities hidden from default views
- [ ] Admin can view/restore archived opportunities
- [ ] Audit trail shows who archived and when
- [ ] No hard delete option available to any role

---

### US-2.8: View Opportunity Details
**Priority:** P0

**As a** rep,
**I want** to view all details of an opportunity on one screen,
**So that** I have full context before calls/meetings.

**Acceptance Criteria:**
- [ ] Show all fields: Principal, Distributor, Operator, Product, Stage, Volume, Value
- [ ] Show activity history (calls, emails, samples)
- [ ] Show audit history (changes made)
- [ ] Show related contacts
- [ ] Mobile-responsive layout

---

## Epic 3: Activity Logging

### US-3.1: Quick Activity Log (30 Seconds)
**Priority:** P0

**As a** rep,
**I want** to log a call, email, or sample in under 30 seconds,
**So that** I can capture activities without disrupting my workflow.

**Acceptance Criteria:**
- [ ] Activity type selector (Call/Email/Sample) - single tap
- [ ] Opportunity selector (searchable dropdown)
- [ ] Note field (free text, no minimum)
- [ ] Submit with one button
- [ ] Auto-capture: user, timestamp
- [ ] Success confirmation and clear form for next entry

---

### US-3.2: Log Call Activity
**Priority:** P0

**As a** rep,
**I want** to log a phone call with notes,
**So that** I have a record of the conversation.

**Acceptance Criteria:**
- [ ] Type = "Call"
- [ ] Required: Opportunity, Note
- [ ] Optional: Contact name, Duration
- [ ] Visible in opportunity's activity timeline
- [ ] Counts toward activity metrics

---

### US-3.3: Log Email Activity
**Priority:** P0

**As a** rep,
**I want** to log an email with notes,
**So that** I have a record of email correspondence.

**Acceptance Criteria:**
- [ ] Type = "Email"
- [ ] Required: Opportunity, Note
- [ ] Optional: Subject line, Contact
- [ ] Visible in opportunity's activity timeline
- [ ] Counts toward activity metrics

---

### US-3.4: Log Sample Sent
**Priority:** P0

**As a** rep,
**I want** to log when I send product samples,
**So that** I can track sample status and follow-ups.

**Acceptance Criteria:**
- [ ] Type = "Sample"
- [ ] Required: Opportunity, Product sampled
- [ ] Date sent auto-captured
- [ ] Initial status = "Sent"
- [ ] Visible in opportunity's activity timeline

---

### US-3.5: Track Sample Feedback
**Priority:** P0

**As a** rep,
**I want** to update sample status as feedback comes in,
**So that** I know which samples need follow-up.

**Acceptance Criteria:**
- [ ] Status workflow: Sent → Received → Feedback Given
- [ ] Feedback options: Positive / Negative / Pending / No Response
- [ ] Feedback notes field
- [ ] Follow-up date field (optional)
- [ ] Sample status visible on opportunity detail

---

### US-3.6: View Activity Timeline
**Priority:** P0

**As a** rep,
**I want** to see all activities for an opportunity in chronological order,
**So that** I understand the full history of the deal.

**Acceptance Criteria:**
- [ ] Activities sorted newest-first (default) or oldest-first
- [ ] Show type, date, user, and note for each
- [ ] Filter by activity type
- [ ] Pagination or infinite scroll for long histories
- [ ] Activity count displayed

---

## Epic 4: List Views & Navigation

### US-4.1: Opportunity List with Filters
**Priority:** P0

**As a** rep,
**I want** to view opportunities in a sortable, filterable table,
**So that** I can find and manage my deals efficiently.

**Acceptance Criteria:**
- [ ] Table columns: Principal, Operator, Stage, Value, Last Activity, Owner
- [ ] Sort by any column (ascending/descending)
- [ ] Filter by: Principal, Stage, Owner, Status (Open/Won/Lost)
- [ ] Date range filter
- [ ] Search by text (opportunity name, operator, contact)
- [ ] Column visibility toggles

---

### US-4.2: Filter by Principal
**Priority:** P0

**As a** rep,
**I want** to filter all views by a single principal,
**So that** I can focus on one manufacturer's pipeline.

**Acceptance Criteria:**
- [ ] Principal filter dropdown in header or sidebar
- [ ] Filter applies to: opportunities, activities, reports
- [ ] "All Principals" option to clear filter
- [ ] Selected principal persists during session
- [ ] Clear visual indicator of active filter

---

### US-4.3: Save Filter Presets
**Priority:** P1

**As a** rep,
**I want** to save my frequently used filter combinations,
**So that** I don't have to reconfigure filters daily.

**Acceptance Criteria:**
- [ ] "Save current filters" button
- [ ] Name the preset
- [ ] Presets appear in quick-access dropdown
- [ ] Edit/delete saved presets
- [ ] Presets are user-specific

---

## Epic 5: Dashboard

### US-5.1: Principal-Focused Dashboard
**Priority:** P0

**As a** rep,
**I want** my default dashboard to show principal-focused metrics,
**So that** I can quickly see status for my key accounts.

**Acceptance Criteria:**
- [ ] Dashboard loads as first screen after login
- [ ] Shows pipeline summary by principal
- [ ] Quick stats: total opportunities, total value, activities this week
- [ ] Principal selector to drill down
- [ ] Responsive on mobile

---

### US-5.2: Stale Deal Warnings
**Priority:** P0

**As a** rep,
**I want** to see deals with no activity in 14+ days highlighted,
**So that** I can take action on neglected opportunities.

**Acceptance Criteria:**
- [ ] "Needs Attention" section on dashboard
- [ ] List opportunities with no activity in 14+ days
- [ ] Sorted by staleness (oldest first)
- [ ] Quick action to log activity or view opportunity
- [ ] Count badge showing number of stale deals
- [ ] Stale indicator also visible in list views

---

### US-5.3: Recent Activity Feed
**Priority:** P0

**As a** rep,
**I want** to see my recent activities on the dashboard,
**So that** I can quickly reference what I've done.

**Acceptance Criteria:**
- [ ] Last 10-20 activities displayed
- [ ] Show: type, opportunity, timestamp
- [ ] Click to view full activity or opportunity
- [ ] "View all" link to full activity log

---

### US-5.4: Pipeline Summary by Stage
**Priority:** P0

**As a** rep,
**I want** to see opportunity counts and values by pipeline stage,
**So that** I understand my pipeline health.

**Acceptance Criteria:**
- [ ] Visual representation (bar chart or funnel)
- [ ] Show count and total value per stage
- [ ] Click stage to filter opportunity list
- [ ] Highlight stages with unusually high counts (bottlenecks)

---

## Epic 6: Manager Views

### US-6.1: Team Pipeline Review
**Priority:** P0

**As a** manager,
**I want** to see the pipeline for all my reps combined,
**So that** I can review team performance in weekly meetings.

**Acceptance Criteria:**
- [ ] View opportunities grouped by rep
- [ ] Pipeline totals rolled up by stage
- [ ] Filter by rep, principal, date range
- [ ] Sort by value, stage, or last activity
- [ ] Export view to PDF/Excel for meetings

---

### US-6.2: Rep Activity Summary
**Priority:** P0

**As a** manager,
**I want** to see activity counts per rep,
**So that** I can ensure reps are staying active.

**Acceptance Criteria:**
- [ ] Table: Rep name, Activities this week, Opps created, Opps closed
- [ ] Date range selector (this week, last week, custom)
- [ ] No login tracking (trust-based culture)
- [ ] Drill down to individual rep's activities

---

### US-6.3: Reassign Opportunity
**Priority:** P0

**As a** manager,
**I want** to reassign an opportunity to a different rep,
**So that** I can redistribute workload or handle rep departures.

**Acceptance Criteria:**
- [ ] Manager or Admin can change owner field
- [ ] Change logged in audit trail
- [ ] Previous owner preserved in history
- [ ] Bulk reassign option (select multiple opps)

---

## Epic 7: Reporting

### US-7.1: Generate Principal Report
**Priority:** P0

**As a** rep,
**I want** to generate a report for a specific principal,
**So that** I can send them updates on their pipeline.

**Acceptance Criteria:**
- [ ] Select principal
- [ ] Select date range (custom start/end)
- [ ] Preview report before export
- [ ] Export as PDF or Excel
- [ ] Report includes: pipeline by stage, activities, won/lost, forecast

---

### US-7.2: Report - Pipeline by Stage
**Priority:** P0

**As a** principal recipient,
**I want** to see how many deals are at each stage,
**So that** I understand the health of my pipeline.

**Acceptance Criteria:**
- [ ] Table or chart showing stages
- [ ] Count and value per stage
- [ ] List of opportunities per stage (optional detail)
- [ ] Clear stage definitions/labels

---

### US-7.3: Report - Activity Summary
**Priority:** P0

**As a** principal recipient,
**I want** to see activities logged on my behalf,
**So that** I know what sales efforts are happening.

**Acceptance Criteria:**
- [ ] Total calls, emails, samples in period
- [ ] Breakdown by week or month
- [ ] Top contacts engaged
- [ ] Activity trend (up/down from previous period)

---

### US-7.4: Report - Won/Lost Analysis
**Priority:** P0

**As a** principal recipient,
**I want** to see closed deals with win/loss reasons,
**So that** I can understand market dynamics.

**Acceptance Criteria:**
- [ ] List of Won opportunities with details
- [ ] List of Lost opportunities with reasons
- [ ] Win rate percentage
- [ ] Reason breakdown (pie chart or table)
- [ ] Total value won/lost

---

### US-7.5: Report - Forecast Projection
**Priority:** P0

**As a** principal recipient,
**I want** to see expected volume/revenue for upcoming periods,
**So that** I can plan inventory and production.

**Acceptance Criteria:**
- [ ] Forecast by week, month, and quarter
- [ ] Shows weighted value (volume × price × stage probability)
- [ ] Breakdown by stage
- [ ] Optional: expected close date grouping

---

### US-7.6: Export to PDF
**Priority:** P0

**As a** rep,
**I want** to export reports as polished PDF documents,
**So that** I can email them to principals.

**Acceptance Criteria:**
- [ ] Professional formatting with branding
- [ ] Charts render cleanly
- [ ] Tables are readable
- [ ] Date range and generation timestamp shown
- [ ] One-click download

---

### US-7.7: Export to Excel
**Priority:** P0

**As a** rep,
**I want** to export reports as Excel spreadsheets,
**So that** principals can manipulate the data themselves.

**Acceptance Criteria:**
- [ ] Clean tabular format
- [ ] One sheet per report section (or tabs)
- [ ] Formulas for totals where appropriate
- [ ] Filterable columns
- [ ] One-click download as .xlsx

---

### US-7.8: Store Principal Report Preferences
**Priority:** P1

**As an** admin,
**I want** to store each principal's preferred report frequency,
**So that** we know when to send updates.

**Acceptance Criteria:**
- [ ] Principal record has "Report Frequency" field
- [ ] Options: Weekly, Monthly, On-demand
- [ ] Dashboard reminder when report is due
- [ ] Optional: automatic generation schedule

---

## Epic 8: Forecasting

### US-8.1: Configure Stage Probabilities
**Priority:** P0

**As an** admin,
**I want** to set the probability percentage for each pipeline stage,
**So that** forecasts use consistent weightings.

**Acceptance Criteria:**
- [ ] Admin settings page for stage configuration
- [ ] Each stage has editable probability (0-100%)
- [ ] Probabilities don't need to sum to any value
- [ ] Changes apply to all future forecasts
- [ ] Example: "Proposal" stage = 40% probability

---

### US-8.2: View Weekly Forecast
**Priority:** P0

**As a** rep,
**I want** to see my forecasted pipeline for the coming weeks,
**So that** I can plan my time effectively.

**Acceptance Criteria:**
- [ ] Forecast by week for next 4-8 weeks
- [ ] Shows: expected volume, expected revenue (weighted)
- [ ] Filter by principal
- [ ] Drill down to opportunities per week

---

### US-8.3: View Monthly Forecast
**Priority:** P0

**As a** manager,
**I want** to see monthly forecasts for the team,
**So that** I can report to leadership.

**Acceptance Criteria:**
- [ ] Forecast by month for next 3-6 months
- [ ] Roll up across all reps or filter by rep
- [ ] Compare to previous months (trend)
- [ ] Export for presentations

---

### US-8.4: View Quarterly Forecast
**Priority:** P0

**As a** manager,
**I want** to see quarterly forecasts,
**So that** I can do longer-term planning.

**Acceptance Criteria:**
- [ ] Forecast by quarter for current and next quarter
- [ ] Roll up by principal or by rep
- [ ] Year-over-year comparison (if historical data available)
- [ ] Export capability

---

### US-8.5: Volume-Based Value Calculation
**Priority:** P0

**As a** rep,
**I want** to enter expected volume (cases/units) and have the system calculate dollar value,
**So that** I don't have to do manual math.

**Acceptance Criteria:**
- [ ] Opportunity has "Expected Volume" field
- [ ] Product has "Price per unit" field
- [ ] System calculates: Volume × Price = Expected Value
- [ ] Value displayed on opportunity and in forecasts
- [ ] If no product selected, manual value entry allowed

---

## Epic 9: Product & Pricing

### US-9.1: Manage Product Catalog
**Priority:** P0

**As an** admin,
**I want** to manage products for each principal,
**So that** reps can select them on opportunities.

**Acceptance Criteria:**
- [ ] Product belongs to one Principal
- [ ] Fields: Name, SKU (optional), Price, Description
- [ ] List all products by principal
- [ ] Add/edit/archive products
- [ ] Products cannot be hard deleted if used on opportunities

---

### US-9.2: Set Product Pricing
**Priority:** P0

**As an** admin,
**I want** to set prices for each product,
**So that** the system can calculate opportunity values.

**Acceptance Criteria:**
- [ ] Price field on product record
- [ ] Price unit (per case, per unit, per lb, etc.)
- [ ] Price history preserved when changed
- [ ] Effective date for price changes (optional)

---

### US-9.3: Product Dropdown Filtered by Principal
**Priority:** P0

**As a** rep,
**I want** the product dropdown to only show products for the selected principal,
**So that** I don't accidentally choose the wrong product.

**Acceptance Criteria:**
- [ ] Select Principal first on opportunity
- [ ] Product dropdown filters to that principal's products
- [ ] If principal changed, product field clears
- [ ] Search/filter within product dropdown

---

## Epic 10: Contacts & Distributors

### US-10.1: Manage Distributor Records
**Priority:** P0

**As an** admin,
**I want** to manage distributor information,
**So that** reps can associate them with opportunities.

**Acceptance Criteria:**
- [ ] Distributor fields: Name, Location, Region/Territory
- [ ] List all distributors with search/filter
- [ ] Add/edit distributors
- [ ] View opportunities associated with distributor

---

### US-10.2: Track Distributor Authorizations
**Priority:** P0

**As a** rep,
**I want** to see which principals a distributor is authorized to carry,
**So that** I know if a deal is possible.

**Acceptance Criteria:**
- [ ] Authorization record: Distributor + Principal + Status
- [ ] Status options: Authorized / Not Authorized / Pending
- [ ] Authorization date
- [ ] View authorizations on distributor detail page
- [ ] Warning when creating opp for non-authorized combo

---

### US-10.3: Manage Contacts
**Priority:** P0

**As a** rep,
**I want** to store contact information for people at distributors/operators,
**So that** I can reach them easily.

**Acceptance Criteria:**
- [ ] Contact fields: Name, Title, Email, Phone, Company
- [ ] Contact linked to Distributor or Operator
- [ ] Multiple contacts per company
- [ ] Search contacts globally
- [ ] View contact's activity history

---

## Epic 11: Data Import/Export

### US-11.1: Initial Data Migration
**Priority:** P0

**As an** admin,
**I want** to import current year data from the master Excel file,
**So that** we start with existing pipeline data.

**Acceptance Criteria:**
- [ ] Upload Excel or CSV file
- [ ] Column mapping interface
- [ ] Preview before import
- [ ] Import valid rows, skip invalid
- [ ] Error report for skipped rows
- [ ] Imported records marked with source

---

### US-11.2: Ongoing CSV Import
**Priority:** P0

**As a** user,
**I want** to upload CSV files to add data in bulk,
**So that** I don't have to enter large datasets manually.

**Acceptance Criteria:**
- [ ] CSV upload interface accessible to all users
- [ ] Template download with expected columns
- [ ] Validation before import
- [ ] Skip invalid rows, import valid
- [ ] Error report with row numbers and issues
- [ ] Import history log

---

### US-11.3: Export Opportunity Data
**Priority:** P0

**As a** user,
**I want** to export opportunity data to Excel,
**So that** I can do custom analysis.

**Acceptance Criteria:**
- [ ] Export current filtered view
- [ ] All visible columns included
- [ ] Download as .xlsx
- [ ] Option to export all fields (not just visible)

---

## Epic 12: Audit & History

### US-12.1: Full Audit Trail
**Priority:** P0

**As an** admin,
**I want** all changes to be logged,
**So that** we have accountability and can troubleshoot issues.

**Acceptance Criteria:**
- [ ] Log: who changed what, when, old value, new value
- [ ] Audit log on every entity (opportunities, contacts, products, etc.)
- [ ] View audit history on record detail page
- [ ] Filter audit log by user, date, entity type
- [ ] Audit records cannot be deleted

---

### US-12.2: View Record History
**Priority:** P0

**As a** rep,
**I want** to see the history of changes on an opportunity,
**So that** I understand how the deal evolved.

**Acceptance Criteria:**
- [ ] "History" tab on opportunity detail
- [ ] Chronological list of changes
- [ ] Show field name, old value, new value, who, when
- [ ] Expandable/collapsible entries

---

## Epic 13: Mobile Experience

### US-13.1: Mobile-Responsive Layout
**Priority:** P0

**As a** rep in the field,
**I want** the CRM to work fully on my phone,
**So that** I can manage deals during visits.

**Acceptance Criteria:**
- [ ] All features accessible on phone screen (320px+)
- [ ] Touch-friendly buttons and inputs (44px minimum tap targets)
- [ ] Readable text without zooming
- [ ] Navigation adapted for small screens (hamburger menu)
- [ ] Forms usable with mobile keyboard

---

### US-13.2: Quick Activity Log on Mobile
**Priority:** P0

**As a** rep in the field,
**I want** to log activities quickly on my phone,
**So that** I capture notes immediately after meetings.

**Acceptance Criteria:**
- [ ] Activity form optimized for mobile
- [ ] Large tap targets
- [ ] Minimal scrolling required
- [ ] Auto-complete for opportunity search
- [ ] Success feedback clear on small screen

---

### US-13.3: View Opportunity on Mobile
**Priority:** P0

**As a** rep in the field,
**I want** to view opportunity details on my phone,
**So that** I can prepare before meetings.

**Acceptance Criteria:**
- [ ] Key info visible without scrolling (Principal, Stage, Contacts)
- [ ] Activity history scrollable
- [ ] Edit button accessible
- [ ] Click-to-call phone numbers
- [ ] Click-to-email addresses

---

## Epic 14: Admin Settings

### US-14.1: User Management
**Priority:** P0

**As an** admin,
**I want** to create and manage user accounts,
**So that** I can control access to the system.

**Acceptance Criteria:**
- [ ] List all users
- [ ] Create new user with email, name, role
- [ ] Edit user details and role
- [ ] Deactivate (soft delete) users
- [ ] Password reset capability

---

### US-14.2: Configure Pipeline Stages
**Priority:** P1

**As an** admin,
**I want** to customize the pipeline stages,
**So that** they match our sales process.

**Acceptance Criteria:**
- [ ] List stages in order
- [ ] Edit stage names
- [ ] Edit stage probabilities
- [ ] Reorder stages (drag and drop)
- [ ] Cannot delete stage if opportunities exist in it

---

### US-14.3: Manage Win/Loss Reasons
**Priority:** P1

**As an** admin,
**I want** to customize the win/loss reason options,
**So that** they reflect our business reality.

**Acceptance Criteria:**
- [ ] Separate lists for Win reasons and Loss reasons
- [ ] Add/edit/deactivate reasons
- [ ] Reasons visible in dropdown when closing opportunity
- [ ] "Other" option always available with free text

---

### US-14.4: View System Audit Log
**Priority:** P1

**As an** admin,
**I want** to view all system changes in one place,
**So that** I can monitor activity and troubleshoot.

**Acceptance Criteria:**
- [ ] Filterable log of all changes
- [ ] Filter by: user, entity type, date range
- [ ] Export audit log
- [ ] Pagination for large datasets

---

---

## Story Summary by Priority

### P0 - MVP Must-Have (39 stories)

| Epic | Count |
|------|-------|
| Authentication & Access | 2 |
| Opportunity Management | 8 |
| Activity Logging | 6 |
| List Views & Navigation | 2 |
| Dashboard | 4 |
| Manager Views | 3 |
| Reporting | 7 |
| Forecasting | 5 |
| Product & Pricing | 3 |
| Contacts & Distributors | 3 |
| Data Import/Export | 3 |
| Audit & History | 2 |
| Mobile Experience | 3 |
| Admin Settings | 1 |

### P1 - MVP Nice-to-Have (5 stories)

- US-1.3: Dark Mode Toggle
- US-4.3: Save Filter Presets
- US-7.8: Store Principal Report Preferences
- US-14.2: Configure Pipeline Stages
- US-14.3: Manage Win/Loss Reasons
- US-14.4: View System Audit Log

### P2 - Post-MVP (0 stories listed)

*Future stories not documented in this version*

---

## Acceptance Test Checklist

Before launch, verify these key workflows:

### Critical Path Testing

- [ ] **Login Flow**: Email/password login → Dashboard loads
- [ ] **Create Opportunity**: Minimal fields → Save → Visible in list
- [ ] **Quick Activity Log**: Type + Opp + Note → <30 seconds → Saved
- [ ] **Sample Tracking**: Log sample → Update status → Track feedback
- [ ] **Filter by Principal**: Select principal → All views filter correctly
- [ ] **Stale Deal Warning**: Opp with no activity 14+ days → Shows warning
- [ ] **Generate Report**: Select principal + dates → Export PDF/Excel
- [ ] **Mobile Full Flow**: Login → View opp → Log activity → All on phone
- [ ] **Duplicate Block**: Try to create duplicate opp → Blocked with message
- [ ] **Soft Delete**: Delete opp → Archived → Admin can restore

---

*These user stories map to requirements in [PRD.md](./PRD.md). For technical implementation, see [CLAUDE.md](../CLAUDE.md).*

*Generated: 2025-11-27*
