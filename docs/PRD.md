# Crispy-CRM Product Requirements Document (PRD)

**Version:** 1.1
**Last Updated:** 2025-11-27
**Status:** MVP In Progress
**Target Launch:** 30-60 days

> **Changelog v1.1:** Updated after codebase audit to align PRD with implemented features. See [Appendix F](#f-version-history) for details.

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
| **Admin** | Full access | User management, settings, all data, delete/archive |
| **Manager** | All reps' data | Pipeline review, reports, reassign opportunities |
| **Rep** | Full visibility (all data) | Log activities, manage opportunities, view dashboards |

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

**Products per Opportunity:** Database supports multiple products; UI simplified to show primary product.

**Links three parties:**
- Principal Organization (whose product) - **Required**
- Customer Organization (end customer/restaurant) - **Required**
- Distributor Organization (who will carry it) - Optional

**Required Fields:**
- Principal Organization
- Customer Organization
- At least one Contact

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

> **Note:** Value calculation (Volume × Price) is planned for post-MVP. Current MVP tracks opportunities without monetary values.

### 4.4 Sample Tracking

**Implementation:** Sample is an activity type with status tracking.

**Status Workflow:**
```
Sent → Received → Feedback Given (positive/negative/pending/no_response)
```

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

**8 stages implemented:**

| # | Value | Label | Description |
|---|-------|-------|-------------|
| 1 | `new_lead` | New Lead | Initial prospect identification |
| 2 | `initial_outreach` | Initial Outreach | First contact and follow-up |
| 3 | `sample_visit_offered` | Sample/Visit Offered | Product sampling and visit scheduling |
| 4 | `awaiting_response` | Awaiting Response | Following up after sample delivery |
| 5 | `feedback_logged` | Feedback Logged | Recording customer feedback |
| 6 | `demo_scheduled` | Demo Scheduled | Planning product demonstrations |
| 7 | `closed_won` | Closed - Won | Successful deal completion |
| 8 | `closed_lost` | Closed - Lost | Lost opportunity |

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
| **Create** | Required: Principal + Customer + Contact |
| **Duplicate** | **Blocked** - System prevents duplicate opportunities |
| **Reopen** | **Allowed** - Can change status anytime after Won/Lost |
| **Delete** | **Soft delete only** - Archived, never truly deleted |
| **Reassign** | Manual reassignment by admin/manager |

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

### 6.3 Stale Deal Detection

**Definition:** No activity logged in **14 days**

**Implementation:** Database view calculates `momentum` field:
- `increasing` - Activity in last 7 days
- `steady` - Activity 8-14 days ago
- `decreasing` - Activity declining
- `stale` - No activity in 14+ days

**Display:** Highlighted on dashboard and opportunity lists

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

### 8.1 Principal Reports

**Frequency:** Varies by principal (store preference per principal)

**Format:** Excel export (PDF post-MVP)

**Date Range:** Custom date picker

**Available Report Sections:**

| Section | Description |
|---------|-------------|
| Pipeline by Stage | Deal counts at each stage |
| Activity Summary | Calls, emails, samples logged |
| Won/Lost Analysis | Closed deals with win/loss reasons |
| Stale Opportunities | Deals needing attention |

### 8.2 Forecasting

**Post-MVP Feature**

Future implementation will include:
- Weekly/Monthly/Quarterly forecasts
- Stage-based probability weighting
- Volume × Price calculations

### 8.3 Metrics NOT in MVP

- Velocity metrics (time-in-stage, cycle time)
- Principal login portal
- Weighted value forecasting
- PDF export

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
- Campaign

### 9.2 Dashboard

**Default View:** Principal-focused dashboard (V3)

**Key Components:**
- Pipeline summary by principal with momentum indicators
- Stale deal warnings (14+ days no activity)
- Tasks panel (time-bucketed: Overdue → Today → Tomorrow)
- Quick activity logging FAB (Floating Action Button)
- Recent activity feed

### 9.3 Responsive Design

| Screen Size | Support Level |
|-------------|---------------|
| Desktop (1024px+) | Primary design |
| Tablet (768-1023px) | Full functionality |
| Phone (320-767px) | **Full functionality** (required) |

**Approach:** Desktop-first design with full mobile support

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

**Duplicate Detection:**
- Check for existing opportunity with same Principal + Distributor + Customer + Product combination
- **Block creation** if exact match exists
- Show link to existing opportunity

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

### 12.3 Future Notifications

- Email alerts for key events
- Push notifications (mobile)

---

## 13. Authorization Tracking

### 13.1 Distributor Authorizations (MVP - To Implement)

Track which distributors are authorized to carry which principals' products.

**Required Fields:**
- Distributor (organization_id)
- Principal (organization_id)
- Authorization status (Authorized/Not Authorized/Pending)
- Authorization date
- Notes

### 13.2 Authorization Workflow

- View authorizations on Distributor detail page
- Warning when creating opportunity for non-authorized combo
- Filter opportunities by authorization status

### 13.3 Lost Authorization

**When a distributor loses authorization:**
- Manual cleanup by users
- No automatic cascade to opportunities
- Users manually close affected opportunities

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
| 2 | Quick activity logging | ✅ Done | Log activity in <30 seconds |
| 3 | Export to Excel | ✅ Done | Generate principal reports in Excel |
| 4 | Sample tracking | 🔧 Partial | Need `sample` activity type + status workflow |
| 5 | Mobile/tablet access | ✅ Done | Full functionality on phone screens |
| 6 | Opportunity list with filters | ✅ Done | Sort/filter by principal, stage, owner, date |
| 7 | Dashboard with stale warnings | ✅ Done | Show deals with no activity in 14+ days |
| 8 | CSV import (Contacts) | ✅ Done | Bulk upload contacts |
| 9 | Soft delete + audit trail | ✅ Done | All changes tracked, nothing hard deleted |
| 10 | Dark mode toggle | ✅ Done | User can switch between light/dark theme |
| 11 | Tasks & Notifications | ✅ Done | Full task management with reminders |
| 12 | Win/Loss Reasons | 🔧 TODO | Required reasons when closing opportunity |
| 13 | Duplicate Prevention | 🔧 TODO | Block duplicate opportunity creation |
| 14 | Authorization Tracking | 🔧 TODO | Track distributor-principal authorizations |

### 15.2 Post-MVP Features

| Feature | Reason |
|---------|--------|
| PDF export | Excel sufficient for MVP |
| Forecasting (weighted) | Requires pricing/probability setup |
| Volume/Price tracking | Deferred complexity |
| Opportunity CSV import | Contact import sufficient |
| Velocity metrics | Future analytics |
| Principal login portal | Future feature |
| Offline mode | Online required |
| Google SSO | Email/password sufficient |

---

## 16. Decision-Making

### 16.1 Priority Decisions

**Process:** Team consensus

**Escalation:** If consensus not reached, management makes final call

### 16.2 Resolved Questions

| # | Question | Decision | Date |
|---|----------|----------|------|
| 1 | Pipeline stages | Use implemented 8 stages | 2025-11-27 |
| 2 | Activity types | Keep all 13 types (add sample) | 2025-11-27 |
| 3 | Required fields | Principal + Customer + Contact | 2025-11-27 |
| 4 | Products per opp | Multi in DB, simplified UI | 2025-11-27 |
| 5 | Pricing/Volume | Defer to post-MVP | 2025-11-27 |
| 6 | PDF export | Excel only for MVP | 2025-11-27 |
| 7 | Tasks/Notifications | Include in MVP (already built) | 2025-11-27 |

### 16.3 Open Questions

| # | Question | Options | Status |
|---|----------|---------|--------|
| 1 | QuickLogForm performance | Test <30 second target | Pending test |

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

**Risk:** 4 features still need implementation

**Mitigation:** Prioritize Sample type, Win/Loss UI, Duplicates, Authorizations

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
- Competitor relationship
- Product not a fit
- Timing/budget
- Other (free text)

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

| Type | UI Label | Description |
|------|----------|-------------|
| `principal` | Principal | Food manufacturer |
| `distributor` | Distributor | Distribution company |
| `customer` | Customer/Operator | Restaurant/foodservice |
| `prospect` | Prospect | Potential customer |
| `unknown` | Unknown | Uncategorized |

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

---

*This PRD captures WHAT we're building. For WHY, see [PROJECT_MISSION.md](../PROJECT_MISSION.md). For HOW (technical), see [CLAUDE.md](../CLAUDE.md).*

*Last updated: 2025-11-27 (v1.1 - Post-audit alignment)*
