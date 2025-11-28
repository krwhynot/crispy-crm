# Crispy-CRM Product Requirements Document (PRD)

**Version:** 1.0
**Last Updated:** 2025-11-27
**Status:** MVP In Progress
**Target Launch:** 30-60 days

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
| Forecast Accuracy | ±15% variance |

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

| Term | Definition |
|------|------------|
| **Principal** | Food manufacturer whose products MFB represents |
| **Distributor** | Company that buys from principals and distributes to operators |
| **Operator** | Restaurant or foodservice business (end customer) |
| **Opportunity** | A deal for ONE product linking Principal + Distributor + Operator |
| **Authorization** | When a distributor agrees to carry a principal's products |
| **Won** | First purchase order placed |

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
Principal (1) ──────── (many) Products
     │                         │
     │                         │ (has price)
     │                         │
     └── (many) Opportunities ─┘
              │
              ├── (1) Distributor
              │
              ├── (1) Operator
              │
              └── (many) Activities
```

### 4.2 Opportunity Structure

**Key Rule:** One product per opportunity (enables precise tracking)

**Links three parties:**
- Principal (whose product)
- Distributor (who will carry it)
- Operator (end customer/restaurant)

**Required Fields (minimum):**
- Principal
- Contact name

**Optional Fields:**
- Distributor
- Operator
- Product
- Stage
- Estimated volume
- Expected close date

### 4.3 Product & Pricing

| Attribute | Description |
|-----------|-------------|
| **Catalog Type** | Mixed - some principals have SKUs, others just product names |
| **Pricing Source** | Manually entered per product by admin |
| **Price Updates** | Rarely (1-2x per year) |
| **Value Calculation** | Volume (cases/units) entered → System calculates $ from product price |

### 4.4 Sample Tracking

**Status Workflow:**
```
Sent → Received → Feedback Given (positive/negative/pending)
```

Fields:
- Date sent
- Product sampled
- Recipient contact
- Feedback status
- Feedback notes
- Follow-up date

---

## 5. Pipeline & Stages

### 5.1 Pipeline Stages

**Status:** 8 stages (to be finalized with team)

*Placeholder - finalize during implementation:*
1. Prospect
2. Initial Contact
3. Sample Sent
4. Sample Feedback
5. Pricing Discussion
6. Authorization Pending
7. Authorized
8. Won/Lost

### 5.2 Stage Probabilities

**Fixed per stage** - Admin configures probability for each stage (e.g., Stage 3 = 30%)

Used for weighted pipeline forecasting.

### 5.3 Win/Loss Definitions

**Won:** First purchase order placed

**Common Win Reasons:**
- Relationship (existing trust with buyer)
- Product quality (superior taste, ingredients, specs)

**Common Loss Reasons:**
- Price too high (competitor undercut)
- No distributor authorization (product not available)
- Competitor relationship (buyer already committed)

### 5.4 Opportunity Lifecycle

| Action | Behavior |
|--------|----------|
| **Create** | Minimal required fields (Principal + Contact) |
| **Duplicate** | **Blocked** - System prevents duplicate opportunities |
| **Reopen** | **Allowed** - Can change status anytime after Won/Lost |
| **Delete** | **Soft delete only** - Archived, never truly deleted |
| **Reassign** | Manual reassignment by admin/manager |

---

## 6. Activity Tracking

### 6.1 Activity Types

| Type | Description |
|------|-------------|
| **Call** | Phone conversation with contact |
| **Email** | Email correspondence |
| **Sample** | Product samples sent for evaluation |

### 6.2 Quick Activity Logging

**Target:** Under 30 seconds per entry

**Required Fields:**
1. Activity type (Call/Email/Sample)
2. Opportunity (which deal)
3. Note (free text)

**Auto-captured:**
- Logged by (current user)
- Timestamp

### 6.3 Stale Deal Detection

**Definition:** No activity logged in **14 days**

**Display:** Highlight/flag on dashboard and lists

---

## 7. User Workflows

### 7.1 Rep Daily Workflow

**Morning Start:**
1. Open CRM → Principal dashboard (primary view)
2. Review deals needing attention (stale warnings)
3. Plan day's activities

**Field Visit (Mobile/Tablet):**
- Full opportunity management capability:
  - Log activities
  - Update opportunity stages
  - Create new opportunities
  - Edit existing opportunities

**End of Day:**
- Ensure all activities logged
- Update opportunity stages as needed

### 7.2 Manager Weekly Workflow

**Daily:**
- Quick dashboard glance (activity counts, pipeline movement)

**Weekly:**
- Formal pipeline review with team
- Review all deals by rep
- Identify blockers and stale deals

### 7.3 Principal Reporting Workflow

1. Select principal
2. Choose date range (custom)
3. Generate report (PDF or Excel)
4. Email to principal

---

## 8. Reporting & Forecasting

### 8.1 Principal Reports

**Frequency:** Varies by principal (store preference per principal)

**Format:** Both PDF and Excel export options

**Date Range:** Custom date picker

**Required Sections:**

| Section | Description |
|---------|-------------|
| Pipeline by Stage | Deal counts and values at each stage |
| Activity Summary | Calls, emails, samples logged |
| Won/Lost Analysis | Closed deals with win/loss reasons |
| Forecast Projection | Expected volume/revenue by period |

### 8.2 Forecasting

**Time Periods (all required):**
- Weekly
- Monthly
- Quarterly

**Calculation:**
```
Weighted Value = Volume × Product Price × Stage Probability
```

**Expected Close Date:** Optional field (not required)

### 8.3 Metrics NOT in MVP

- Velocity metrics (time-in-stage, cycle time) - Future
- Principal login portal - Future

---

## 9. User Interface

### 9.1 Primary Navigation

**List with Filters** - Sortable/filterable table as primary opportunity view

**Filter Options:**
- Principal
- Stage
- Owner (rep)
- Date range
- Status (Open/Won/Lost)

### 9.2 Dashboard

**Default View:** Principal-focused dashboard

**Key Components:**
- Pipeline summary by stage
- Stale deal warnings (14+ days no activity)
- Activity log (recent)
- Quick action buttons

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

**Session:** Standard web session management

**Future:** Google SSO (not MVP)

### 10.2 Connectivity

**Offline Mode:** Not supported (online required)

All operations require internet connection.

### 10.3 Audit Trail

**Full audit logging:**
- Track all field changes
- Record: who, what, when
- All entities audited

### 10.4 Duplicate Prevention

**Duplicate Detection:**
- Check for existing opportunity with same Principal + Distributor + Operator + Product combination
- **Block creation** if exact match exists

---

## 11. Data Migration

### 11.1 Initial Migration

| Attribute | Value |
|-----------|-------|
| **Source** | One master Excel spreadsheet |
| **Scope** | Current year only |
| **Timing** | One-time bulk import at launch |

### 11.2 Ongoing Import

**CSV Upload:** Available to all users anytime

**Invalid Data Handling:**
- Import valid rows
- Skip invalid rows
- Generate error report for skipped rows

### 11.3 Import Fields

*To be mapped from Excel columns during migration planning*

---

## 12. Notifications

### 12.1 MVP Scope

**No notifications for MVP**
- No email alerts
- No push notifications
- No in-app notification center

### 12.2 Future Consideration

- Email alerts for key events
- In-app notifications
- Won deal celebrations

---

## 13. Authorization Tracking

### 13.1 Distributor Authorizations

Track which distributors are authorized to carry which principals' products.

**Fields:**
- Distributor
- Principal
- Authorization status (Authorized/Not Authorized/Pending)
- Authorization date

### 13.2 Lost Authorization

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

### 14.2 Manager Visibility

- **Login tracking:** No (trust-based culture)
- **Activity counts:** Yes
- **Pipeline movement:** Yes

---

## 15. Must-Have Features (MVP)

### 15.1 Critical Path Features

Without these, the team won't adopt:

| # | Feature | Priority | Acceptance Criteria |
|---|---------|----------|---------------------|
| 1 | Principal-filtered views | P0 | Filter all views by single principal |
| 2 | Quick activity logging | P0 | Log call/email/sample in <30 seconds |
| 3 | Export to PDF/Excel | P0 | Generate principal reports in both formats |
| 4 | Sample tracking | P0 | Log samples with feedback status workflow |
| 5 | Mobile/tablet access | P0 | Full functionality on phone screens |
| 6 | Opportunity list with filters | P0 | Sort/filter by principal, stage, owner, date |
| 7 | Dashboard with stale warnings | P0 | Show deals with no activity in 14+ days |
| 8 | CSV import | P0 | Bulk upload data anytime |
| 9 | Soft delete + audit trail | P0 | All changes tracked, nothing hard deleted |
| 10 | Dark mode toggle | P1 | User can switch between light/dark theme |

### 15.2 NOT Required for MVP

| Feature | Reason |
|---------|--------|
| Task reminders | Nice to have, not blocking |
| External integrations | Standalone system |
| Email/push notifications | Keep simple |
| Velocity metrics | Future analytics |
| Principal login portal | Future feature |
| Offline mode | Online required |
| Google SSO | Email/password sufficient |

---

## 16. Decision-Making

### 16.1 Priority Decisions

**Process:** Team consensus

**Escalation:** If consensus not reached, management makes final call

### 16.2 Open Questions

*Track unresolved decisions here:*

| # | Question | Options | Decision | Date |
|---|----------|---------|----------|------|
| 1 | Finalize 8 pipeline stages | See placeholder list | TBD | - |
| 2 | Stage probability values | Admin configurable | TBD values | - |
| 3 | Duplicate detection exact logic | Same Principal+Dist+Op+Product | TBD edge cases | - |

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

### C. Activity Type Options

- Call
- Email
- Sample
- Meeting (future)
- Other (future)

---

*This PRD captures WHAT we're building. For WHY, see [PROJECT_MISSION.md](../PROJECT_MISSION.md). For HOW (technical), see [CLAUDE.md](../CLAUDE.md).*

*Generated from stakeholder questionnaire on 2025-11-27*
