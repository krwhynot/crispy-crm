# Crispy-CRM MVP TODO List

**Generated From:** PRD v1.20 (2025-11-28)
**Total MVP Blockers:** 57 items
**Target Launch:** 90-120 days
**Last Updated:** 2025-11-28

---

## Overview

This document tracks all MVP blocking features that must be completed before launch. Items are organized by priority tier and functional area.

### Priority Legend

| Priority | Description | Timeline |
|----------|-------------|----------|
| 🔴 **P0 - Critical** | Blocks other work or core functionality | Week 1-2 |
| 🟠 **P1 - High** | Essential for launch, no dependencies | Week 2-4 |
| 🟡 **P2 - Medium** | Important features, can parallel | Week 4-8 |
| 🟢 **P3 - Low** | Polish items, cleanup | Week 8-12 |

### Status Legend

| Status | Meaning |
|--------|---------|
| ⬜ TODO | Not started |
| 🔧 In Progress | Work begun |
| ✅ Done | Complete |
| ⏸️ Blocked | Waiting on dependency |

---

## 🔴 P0 - Critical Path (Week 1-2)

These items block other work or are foundational to the system.

### Database & Schema

#### TODO-001: Pipeline Stage Migration (PARENT - See subtasks below)
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Description:** Remove `awaiting_response` stage from system
- **Subtasks:** TODO-001a, TODO-001b, TODO-001c
- **Acceptance Criteria:** System uses 7 stages; no references to `awaiting_response` remain
- **Audit Doc:** `docs/audits/opportunity-feature-matrix.md`

#### TODO-001a: Pipeline DB Migration
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Effort:** S (1 day)
- **Description:** Create database migration to update existing stage data
- **Tasks:**
  - [ ] Create migration: UPDATE opportunities SET stage = 'sample_visit_offered' WHERE stage = 'awaiting_response'
  - [ ] Add reversible migration (store original stage in metadata if needed)
  - [ ] Test migration on local DB with seed data
- **Acceptance Criteria:** All `awaiting_response` records migrated; migration is reversible
- **Testability:** Integration: Run migration → query for awaiting_response returns 0 rows

#### TODO-001b: Pipeline Constants & Schema Update
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Depends On:** TODO-001a
- **Effort:** S (1 day)
- **Description:** Update TypeScript constants and Zod schema
- **Tasks:**
  - [ ] Update `stageConstants.ts` to remove `awaiting_response`
  - [ ] Update Zod enum in opportunity schema (opportunitySchema.ts)
  - [ ] Update any type definitions referencing 8 stages
  - [ ] Run TypeScript compiler to catch any broken references
- **Acceptance Criteria:** `tsc` compiles with no stage-related errors; stageConstants has 7 items
- **Testability:** Unit: stageConstants.length === 7; Zod rejects 'awaiting_response'

#### TODO-001c: Pipeline UI & Filter Updates
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Depends On:** TODO-001b
- **Effort:** M (2 days)
- **Description:** Update all UI components that render or filter by stage
- **Tasks:**
  - [ ] Update Kanban board components (remove 8th column)
  - [ ] Update stage-related filters in opportunity list
  - [ ] Update reports that group by stage
  - [ ] Test stage transitions in UI (drag-drop, dropdown selection)
  - [ ] Verify pipeline views render correctly
- **Acceptance Criteria:** Kanban shows 7 columns; filters show 7 options; no UI errors
- **Testability:** E2E: Navigate to Kanban → count columns === 7; apply stage filter → 7 options

#### TODO-002: Contact Organization Enforcement
- **PRD Reference:** Section 4.2, MVP #18
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Description:** Enforce `organization_id` as required field - block orphan contact creation
- **Tasks:**
  - [ ] Update database schema: `organization_id` NOT NULL constraint
  - [ ] Update Zod schema validation
  - [ ] Update ContactCreate form to require organization selection
  - [ ] Add validation error messages
  - [ ] Handle edge cases (what happens on import?)
- **Acceptance Criteria:** Cannot create contact without organization; clear error message shown
- **Blocks:** TODO-003, TODO-049

#### TODO-049: Contact Import Organization Handling
- **PRD Reference:** Section 4.2, MVP #18 (edge case)
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-002
- **Effort:** M (2 days)
- **Deferrable:** Yes - can defer to post-MVP if CSV import not critical path
- **Description:** Handle organization requirement during CSV contact import
- **Tasks:**
  - [ ] Update CSV import to require organization_id column OR organization_name for lookup
  - [ ] Add validation: reject rows missing organization reference
  - [ ] Add organization lookup by name (create if not exists, or match existing)
  - [ ] Show import preview with organization assignments
  - [ ] Add "Skip rows without organization" option
- **Acceptance Criteria:** CSV import enforces organization; clear error on missing org; preview shows assignments
- **Testability:** Integration: Import CSV without org column → error; with org column → success

#### TODO-003: Contact-Customer Org Validation
- **PRD Reference:** Section 4.2, MVP #49
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Depends On:** TODO-002
- **Description:** Enforce that opportunity contacts belong to Customer Organization
- **Tasks:**
  - [ ] Add validation on opportunity contact selection
  - [ ] Show warning if selected contact belongs to different org
  - [ ] Allow override with confirmation (soft warning)
  - [ ] Update OpportunityCreate and OpportunityEdit forms
- **Acceptance Criteria:** Warning displayed when contact org ≠ customer org; can proceed with confirmation

### Core Business Logic

#### TODO-004: Win/Loss Reasons UI (PARENT - See subtasks below)
- **PRD Reference:** Section 5.3, MVP #12, #47
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Description:** Require reason selection when closing opportunities
- **Subtasks:** TODO-004a, TODO-004b, TODO-004c
- **Acceptance Criteria:** Cannot close opportunity without selecting reason; reason visible on closed opportunities
- **Industry Standard:** Salesforce/HubSpot require reasons on close

#### TODO-004a: Win/Loss Reason Schema & Fields
- **PRD Reference:** Section 5.3, MVP #12
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Effort:** S (1 day)
- **Description:** Add win/loss reason fields to schema and database
- **Tasks:**
  - [ ] Add `win_reason` and `loss_reason` fields to opportunity Zod schema
  - [ ] Add `win_reason_other` and `loss_reason_other` text fields for "Other" option
  - [ ] Create database migration to add columns
  - [ ] Define reason enums: WIN_REASONS, LOSS_REASONS constants
- **Acceptance Criteria:** Schema validates reason fields; DB columns exist
- **Testability:** Unit: Zod accepts valid reasons, rejects invalid; Integration: columns queryable

#### TODO-004b: Win/Loss Modal Component
- **PRD Reference:** Section 5.3, MVP #47
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Depends On:** TODO-004a
- **Effort:** M (2 days)
- **Description:** Create modal that appears when closing opportunities
- **Tasks:**
  - [ ] Create `CloseOpportunityModal.tsx` component
  - [ ] Implement win reasons dropdown (Relationship, Product quality, Price competitive, Distributor preference, Other)
  - [ ] Implement loss reasons dropdown (Price too high, No distributor authorization, Competitor relationship, Product not a fit, Timing/budget, Other)
  - [ ] Add conditional "Other" free-text field
  - [ ] Block save without reason selection (disabled submit button)
- **Acceptance Criteria:** Modal appears on close action; submit disabled until reason selected
- **Testability:** E2E: Click close → modal appears; select reason → submit enabled; skip reason → submit disabled

#### TODO-004c: Win/Loss Integration & Display
- **PRD Reference:** Section 5.3, MVP #12
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Depends On:** TODO-004b
- **Effort:** S (1 day)
- **Description:** Integrate modal into stage change flow and display reasons
- **Tasks:**
  - [ ] Wire modal into Kanban drag-to-close flow
  - [ ] Wire modal into opportunity edit stage dropdown
  - [ ] Display reason on closed opportunity detail view
  - [ ] Add reason column to opportunity list (optional, filterable)
- **Acceptance Criteria:** Cannot close via any path without reason; reason visible on closed opps
- **Testability:** E2E: Drag to closed_won → modal appears; view closed opp → reason displayed

#### TODO-005: Activity Auto-Cascade Trigger
- **PRD Reference:** Section 6.2, MVP #27
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Description:** Auto-link opportunity activities to primary contact via PostgreSQL trigger
- **Tasks:**
  - [ ] Create PostgreSQL trigger on `activities` INSERT
  - [ ] Logic: When `opportunity_id` NOT NULL and `contact_id` IS NULL, auto-fill `contact_id` from opportunity's primary contact
  - [ ] Test with various activity creation paths
  - [ ] Verify activity appears in both opportunity and contact timelines
- **Acceptance Criteria:** Activity logged on opportunity automatically appears on contact timeline
- **Audit Doc:** `docs/audits/activities-feature-matrix.md`

### Security & Permissions

#### TODO-044: RBAC Foundation
- **PRD Reference:** Section 3.1-3.3
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Effort:** M (2 days)
- **Description:** Establish role-based access control foundation for Manager/Admin features
- **Tasks:**
  - [ ] Verify `role` enum exists in sales table ('admin', 'manager', 'rep')
  - [ ] Create `isAdmin()` and `isManager()` helper functions
  - [ ] Create `useCurrentUserRole()` hook for frontend
  - [ ] Update RLS policies to use role checks where needed
  - [ ] Document role permissions matrix
- **Acceptance Criteria:** Role helpers work correctly; RLS policies enforce role-based access
- **Testability:** Unit: isAdmin returns true for admin role; Integration: RLS blocks rep from admin actions
- **Enables:** TODO-019 (Bulk Reassignment), TODO-034 (Note RLS Override)

---

## 🟠 P1 - High Priority (Week 2-4)

Essential features with no critical dependencies.

### Dashboard Fixes

#### TODO-006: Dashboard KPI #1 Fix (Pipeline Value → Open Opps)
- **PRD Reference:** Section 9.2.1, MVP #15, #34, #50
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Description:** Change first KPI from "Total Pipeline Value" ($) to "Open Opportunities" (count)
- **Tasks:**
  - [ ] Update `useKPIMetrics` hook to return opportunity count instead of dollar value
  - [ ] Update KPI card label from "Total Pipeline Value" to "Open Opportunities"
  - [ ] Remove any $ formatting
  - [ ] Update click action to navigate to opportunities list (open filter)
- **Acceptance Criteria:** KPI shows count like "23" not "$125,000"
- **Rationale:** Aligns with Decision #5 (no pricing in MVP)

#### TODO-007: Dashboard KPI #4 - Stale Deals
- **PRD Reference:** Section 9.2.1, MVP #38, #51
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Description:** Add 4th KPI card showing stale deals count with amber styling
- **Tasks:**
  - [ ] Add stale deals calculation to `useKPIMetrics` hook
  - [ ] Use per-stage thresholds from Section 6.3
  - [ ] Add amber (`warning`) styling when count > 0
  - [ ] Add click action → Opportunities list with stale filter
  - [ ] Add tooltip explaining "Deals exceeding stage SLA"
- **Acceptance Criteria:** 4th KPI shows stale count; amber when > 0; click navigates to filtered list

#### TODO-008: Recent Activity Feed Component
- **PRD Reference:** Section 9.2, MVP #16, #53
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Description:** Add activity feed panel below Tasks showing recent team activities
- **Tasks:**
  - [ ] Create `ActivityFeedPanel.tsx` component
  - [ ] Query last 10-20 team activities
  - [ ] Display: avatar, activity type icon, description, timestamp
  - [ ] Add "View All" link to activities list
  - [ ] Position below Tasks panel on dashboard
- **Acceptance Criteria:** Feed shows recent activities with user avatars and timestamps
- **Industry Pattern:** Salesforce Activity Timeline, HubSpot Activity Feed

#### TODO-009: My Performance Widget
- **PRD Reference:** Section 9.2.4, MVP #28, #54
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Description:** Add personal metrics sidebar widget to dashboard
- **Tasks:**
  - [ ] Create `MyPerformanceWidget.tsx` component
  - [ ] Calculate: Activities This Week, Deals Moved Forward, Tasks Completed, Open Opportunities
  - [ ] Add trend arrows (green up/red down vs previous week)
  - [ ] Add click-through to detailed personal report
  - [ ] Position in dashboard sidebar
- **Acceptance Criteria:** Widget shows 4 personal metrics with week-over-week trends

### Activities & Quick Logging

#### TODO-010: QuickLogForm - All 13 Activity Types
- **PRD Reference:** Section 6.1, MVP #17, #52
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Description:** Expand QuickLogForm from 5 to 13 activity types
- **Tasks:**
  - [ ] Add missing types: sample, demo, proposal, trade_show, site_visit, contract_review, check_in, social
  - [ ] Implement grouped dropdown UI:
    - Communication: Call, Email, Check-in
    - Meetings: Meeting, Demo, Site Visit
    - Documentation: Proposal, Contract Review, Follow-up, Note
    - Sales: Trade Show, Social
    - Samples: Sample
  - [ ] Update form validation for each type
  - [ ] Add appropriate icons for each type
- **Acceptance Criteria:** All 13 types available in quick logger; grouped for easy selection
- **Enables:** Sample tracking (MVP #4)

#### TODO-011: Sample Tracking Workflow (PARENT - See subtasks below)
- **PRD Reference:** Section 4.4, MVP #4
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Depends On:** TODO-010
- **Description:** Implement full sample status workflow UI
- **Subtasks:** TODO-011a, TODO-011b, TODO-011c, TODO-011d
- **Acceptance Criteria:** Can log sample with status; can update status through workflow; reminders work

#### TODO-011a: Sample Status Schema & Validation
- **PRD Reference:** Section 4.4, MVP #4
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Depends On:** TODO-010
- **Effort:** S (1 day)
- **Description:** Add sample_status enum and conditional validation to activities schema
- **Tasks:**
  - [ ] Add `sample_status` enum to activities schema: sent, received, feedback_pending, feedback_received
  - [ ] Create conditional validation: if type=sample, sample_status required
  - [ ] Add database migration for enum type
- **Acceptance Criteria:** Zod schema validates sample_status when activity type is 'sample'; DB migration applied
- **Testability:** Unit test: schema rejects sample activity without status; accepts with status

#### TODO-011b: Sample Form Fields UI
- **PRD Reference:** Section 4.4, MVP #4
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Depends On:** TODO-011a
- **Effort:** M (2 days)
- **Description:** Build sample-specific form fields that appear conditionally
- **Tasks:**
  - [ ] Add conditional form section that appears when type='sample'
  - [ ] Build sample-specific fields: product sampled (dropdown), recipient (text), follow-up date (date picker)
  - [ ] Wire fields to Zod schema and form state
  - [ ] Add field-level validation error messages
- **Acceptance Criteria:** Sample form fields appear/hide based on activity type selection
- **Testability:** E2E: Select sample type → fields appear; select other type → fields hidden

#### TODO-011c: Sample Status Workflow UI
- **PRD Reference:** Section 4.4, MVP #4
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Depends On:** TODO-011b
- **Effort:** M (2 days)
- **Description:** Implement status state machine with UI progression
- **Tasks:**
  - [ ] Implement status workflow UI: Sent → Received → Feedback Given
  - [ ] Add feedback options dropdown: Positive, Negative, Pending, No Response
  - [ ] Create status update action (PATCH to activities)
  - [ ] Add visual status indicators (badges with semantic colors)
- **Acceptance Criteria:** Can progress sample through status workflow; status changes persist
- **Testability:** E2E: Create sample → update status → verify badge color and text changes

#### TODO-011d: Sample Tracking Views & Filters
- **PRD Reference:** Section 4.4, MVP #4
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Depends On:** TODO-011c
- **Effort:** S (1 day)
- **Description:** Create sample-specific list views and filters
- **Tasks:**
  - [ ] Add "Samples" filter option to activities list
  - [ ] Create sample status filter dropdown
  - [ ] Add "Pending Feedback" quick filter
  - [ ] Ensure sample tracking appears on opportunity timeline
- **Acceptance Criteria:** Can filter activities to show only samples; can filter by sample status
- **Testability:** E2E: Apply sample filter → only sample activities shown

### Stale Deal Detection

#### TODO-012: Per-Stage Stale Thresholds
- **PRD Reference:** Section 6.3, MVP #25
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Description:** Implement variable stale thresholds per stage
- **Tasks:**
  - [ ] Create `STAGE_STALE_THRESHOLDS` constant map:
    - `new_lead`: 7 days
    - `initial_outreach`: 14 days
    - `sample_visit_offered`: 14 days
    - `feedback_logged`: 21 days
    - `demo_scheduled`: 14 days
  - [ ] Update database view/query to calculate staleness per stage
  - [ ] Update `momentum` field calculation
  - [ ] Exclude `closed_won` and `closed_lost` from staleness
- **Acceptance Criteria:** Stale detection uses stage-specific thresholds; closed deals never show as stale

#### TODO-013: Visual Decay Indicators
- **PRD Reference:** Section 6.3, MVP #26
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Depends On:** TODO-012
- **Description:** Add green/yellow/red border colors for pipeline rows
- **Tasks:**
  - [ ] Implement Row Leading Edge pattern (4px vertical color bar)
  - [ ] Color logic based on days since activity:
    - Green (`bg-success`): 0-7 days
    - Amber (`bg-warning`): 8-14 days
    - Red (`bg-destructive`): 14+ days
  - [ ] Add hover tooltip: "Last activity: X days ago"
  - [ ] Apply to `sample_visit_offered` stage specifically
- **Acceptance Criteria:** Pipeline rows show colored indicator bar; tooltip shows days

---

## 🟡 P2 - Medium Priority (Week 4-8)

Important features that can be worked in parallel.

### Contact Module

#### TODO-014: Contact Organization Filter
- **PRD Reference:** MVP #19
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add organization filter to ContactListFilter
- **Tasks:**
  - [ ] Add organization dropdown to ContactListFilter component
  - [ ] Query organizations for dropdown options
  - [ ] Filter contacts by selected organization
  - [ ] Tests already exist - ensure they pass
- **Acceptance Criteria:** Can filter contact list by organization

#### TODO-015: Remove Contact Files Tab
- **PRD Reference:** MVP #42
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Remove Files tab from ContactSlideOver (no attachments in MVP)
- **Tasks:**
  - [ ] Remove Files tab from ContactSlideOver component
  - [ ] Remove related file upload components
  - [ ] Keep DB schema for post-MVP
- **Acceptance Criteria:** No Files tab visible on contact detail

#### TODO-016: Simplify Contact-Org UI
- **PRD Reference:** MVP #43
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Remove multi-org UI remnants; contacts use single organization_id
- **Tasks:**
  - [ ] Remove any UI for `contact_organizations` junction table
  - [ ] Simplify to single organization selector
  - [ ] Update any multi-org display components
- **Acceptance Criteria:** Contact forms show single organization field only

### Organization Module

#### TODO-017: Add Organization Email Field
- **PRD Reference:** MVP #44
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add email TextInput to OrganizationDetailsTab
- **Tasks:**
  - [ ] Add email field to organization form
  - [ ] Field exists in schema/export but missing from UI
  - [ ] Add email validation
- **Acceptance Criteria:** Can enter and save organization email

#### TODO-018: Soft Duplicate Org Warning
- **PRD Reference:** MVP #45
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Change duplicate name validation from hard block to soft warning
- **Tasks:**
  - [ ] Change validation from blocking to warning
  - [ ] Show warning: "An organization with this name already exists. Continue anyway?"
  - [ ] Allow creation with confirmation
  - [ ] Support franchises with same brand name
- **Acceptance Criteria:** Warning shown for duplicate names; can proceed with confirmation

#### TODO-019: Bulk Owner Reassignment
- **PRD Reference:** Section 3.1, MVP #20
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add BulkReassignButton to Organizations list
- **Tasks:**
  - [ ] Create BulkReassignButton component
  - [ ] Add to Organizations list TopToolbar
  - [ ] Implement reassignment modal with user selector
  - [ ] Bulk update selected organizations
  - [ ] Add audit logging for reassignments
- **Acceptance Criteria:** Manager can select multiple orgs and reassign to different user

#### TODO-020: Authorization UI Tab
- **PRD Reference:** Section 13.2, MVP #21
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add Authorizations tab to Distributor organization detail page
- **Tasks:**
  - [ ] Create Authorizations tab component
  - [ ] Display list of authorized principals (org-level)
  - [ ] Display product-level exceptions/overrides
  - [ ] Add ability to add/remove authorizations
  - [ ] Show authorization dates and notes
- **Acceptance Criteria:** Distributor page shows Authorizations tab with principal list

### Opportunity Module

#### TODO-021: Opportunity Bulk Delete
- **PRD Reference:** MVP #48
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add bulk soft delete to BulkActionsToolbar
- **Tasks:**
  - [ ] Add "Archive Selected" option to BulkActionsToolbar
  - [ ] Implement confirmation dialog
  - [ ] Soft delete selected opportunities
  - [ ] Add audit logging
- **Acceptance Criteria:** Can select multiple opportunities and archive them

#### TODO-022: Hybrid Duplicate Prevention (PARENT - See subtasks below)
- **PRD Reference:** Section 10.4, MVP #13, #30
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Block exact duplicates, warn on fuzzy matches
- **Subtasks:** TODO-022a, TODO-022b
- **Acceptance Criteria:** Exact duplicates blocked; similar names show warning but allow creation

#### TODO-022a: Exact Match Detection & Hard Block
- **PRD Reference:** Section 10.4, MVP #13
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Effort:** M (2 days)
- **Description:** Detect and block exact duplicate opportunities (MVP-critical)
- **Tasks:**
  - [ ] Create duplicate detection utility: checkExactDuplicate(principal_id, customer_id, product_id)
  - [ ] Query existing opportunities for exact match on create/edit
  - [ ] Hard block with error message: "Duplicate opportunity exists"
  - [ ] Add link to existing opportunity in error message
  - [ ] Wire into OpportunityCreate form validation
- **Acceptance Criteria:** Cannot create opportunity with identical Principal + Customer + Product combo
- **Testability:** Unit: checkExactDuplicate returns true for matching IDs; E2E: form shows error on duplicate

#### TODO-022b: Fuzzy Match Detection & Soft Warning
- **PRD Reference:** Section 10.4, MVP #30
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-022a
- **Effort:** M (2 days)
- **Description:** Warn on similar customer names (enhancement to exact blocking)
- **Tasks:**
  - [ ] Implement Levenshtein distance calculation (or use existing library)
  - [ ] Create fuzzy match detection: findSimilarOpportunities(customer_name, threshold=3)
  - [ ] Show warning dialog with potential matches list
  - [ ] Add "Create Anyway" confirmation button
  - [ ] Log when user proceeds despite warning (for analytics)
- **Acceptance Criteria:** Warning shown for customer names within Levenshtein distance 3; can proceed with confirmation
- **Testability:** Unit: Levenshtein("Sysco", "Sysco Inc") ≤ 3; E2E: warning dialog appears with similar names

### Product Module

#### TODO-023: ProductList Create Buttons
- **PRD Reference:** MVP #22
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add CreateButton to TopToolbar + FloatingCreateButton
- **Tasks:**
  - [ ] Add CreateButton to ProductList TopToolbar
  - [ ] Add FloatingCreateButton (match ContactList pattern)
- **Acceptance Criteria:** Can create products from list view via toolbar and FAB

#### TODO-024: Remove F&B Fields from Product UI
- **PRD Reference:** MVP #23
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Remove non-PRD fields from ProductCertificationsTab
- **Tasks:**
  - [ ] Remove: certifications, allergens, ingredients, nutritional_info, marketing_description
  - [ ] Simplify to PRD spec: Name, SKU, Category, Status, Description
- **Acceptance Criteria:** Product forms show only PRD-specified fields

### Tasks Module

#### TODO-025: Task Type Enum Alignment
- **PRD Reference:** Appendix E, MVP #56
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Align task types with PRD specification
- **Tasks:**
  - [ ] Update `taskTypeSchema` to: Call, Email, Meeting, Follow-up, Demo, Proposal, Other
  - [ ] Remove: None, Discovery, Administrative
  - [ ] Update `defaultConfiguration.ts`
  - [ ] Migrate existing tasks with deprecated types
- **Acceptance Criteria:** Only PRD-specified task types available

#### TODO-026: Task Organization Linking
- **PRD Reference:** MVP #57
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add optional organization_id FK to tasks table
- **Tasks:**
  - [ ] Add `organization_id` column to tasks table
  - [ ] Update task schema and forms
  - [ ] Update TaskRelatedItemsTab
  - [ ] Enable org-level tasks without opportunity
- **Acceptance Criteria:** Can create tasks linked to organization (e.g., "Prepare for Sysco annual review")

#### TODO-027: Task Snooze Popover
- **PRD Reference:** Section 9.2.3, MVP #37, #55
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Replace auto-snooze with popover options
- **Tasks:**
  - [ ] Create snooze popover component
  - [ ] Options: Tomorrow (9 AM), Next Week (Monday 9 AM), Custom Date
  - [ ] Update due_date on snooze
  - [ ] Show toast: "Task snoozed until [date]"
- **Acceptance Criteria:** Clicking snooze opens popover with date options; confirmation toast shown

#### TODO-028: Task Completion Follow-Up Toast
- **PRD Reference:** MVP #32, #58
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** On task completion, show toast with follow-up option
- **Tasks:**
  - [ ] Show toast on completion: "Task completed! [Create follow-up →]"
  - [ ] Link opens pre-filled task form (same contact/opportunity)
  - [ ] Auto-dismiss after 5 seconds
- **Acceptance Criteria:** Toast appears on completion with clickable follow-up link

### Reports Module

#### TODO-029: Reports Overview 4th KPI (Stale Deals)
- **PRD Reference:** Section 8.2, MVP #59
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add 4th KPICard to OverviewTab
- **Tasks:**
  - [ ] Add Stale Deals KPICard to Overview
  - [ ] Apply amber styling when count > 0
  - [ ] Use per-stage thresholds from Section 6.3
- **Acceptance Criteria:** 4th KPI visible on reports overview; amber when stale count > 0

#### TODO-030: Reports KPI Click Navigation
- **PRD Reference:** MVP #60
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Add onClick handlers to all KPICards
- **Tasks:**
  - [ ] Total Opportunities → Opportunities List (all active)
  - [ ] Overdue Tasks → Tasks List (overdue filter)
  - [ ] Activities This Week → Weekly Activity Report
  - [ ] Stale Deals → Opportunities List (stale filter)
- **Acceptance Criteria:** Clicking any KPI navigates to appropriate filtered view

#### TODO-031: Reports Per-Stage Stale Thresholds
- **PRD Reference:** MVP #61
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-012
- **Description:** Update OverviewTab stale calculations
- **Tasks:**
  - [ ] Use `STAGE_STALE_THRESHOLDS` map instead of fixed 7-day
  - [ ] Update stale count calculation
  - [ ] Exclude closed stages from staleness
- **Acceptance Criteria:** Reports use per-stage thresholds matching Section 6.3

### Notes Module

#### TODO-032: Remove Note Attachment UI
- **PRD Reference:** MVP #62
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Remove FileInput from NoteInputs.tsx
- **Tasks:**
  - [ ] Remove FileInput component from NoteInputs
  - [ ] Remove NoteAttachments.tsx usage
  - [ ] Keep DB schema for post-MVP
- **Acceptance Criteria:** Cannot attach files to notes in UI

#### TODO-033: Remove Note StatusSelector
- **PRD Reference:** MVP #63
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Remove StatusSelector from notes
- **Tasks:**
  - [ ] Remove StatusSelector component from note forms
  - [ ] Remove `showStatus` prop
- **Acceptance Criteria:** Notes have no status field

#### TODO-034: Note RLS Manager/Admin Override
- **PRD Reference:** Section 3.3, MVP #64
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Update RLS policies for Manager/Admin access
- **Tasks:**
  - [ ] Update RLS on contactNotes, opportunityNotes, organizationNotes
  - [ ] Allow Manager/Admin UPDATE and DELETE
  - [ ] Test with different user roles
- **Acceptance Criteria:** Managers and Admins can edit/delete any notes

### Mobile & Responsive

#### TODO-035: Mobile Quick Actions
- **PRD Reference:** Section 9.3, MVP #29
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Implement 6-button mobile quick action bar
- **Tasks:**
  - [ ] Create mobile quick action component
  - [ ] Buttons: Log Check-In, Log Sample Drop, Log Call, Log Meeting/Visit, Quick Note, Complete Task
  - [ ] Optimize for one-tap access
  - [ ] Position at bottom of mobile screen
- **Acceptance Criteria:** 6 quick action buttons visible on mobile; each opens appropriate form

### Notifications & Automation

#### TODO-042: Daily Email Digest (PARENT - See subtasks below)
- **PRD Reference:** Section 12.3, MVP #31
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** 7 AM cron email with overdue tasks + stale deals
- **Subtasks:** TODO-042a, TODO-042b, TODO-042c, TODO-042d
- **Acceptance Criteria:** Users receive daily digest at 7 AM; can opt out

#### TODO-042a: Edge Function Infrastructure & Cron
- **PRD Reference:** Section 12.3, MVP #31
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Effort:** M (2 days)
- **Description:** Create Supabase Edge Function skeleton with cron trigger
- **Tasks:**
  - [ ] Create Edge Function: `supabase/functions/daily-digest/index.ts`
  - [ ] Set up pg_cron extension in database (if not exists)
  - [ ] Configure cron schedule for 7 AM (handle timezones)
  - [ ] Add basic logging and error handling
  - [ ] Test function invocation manually
- **Acceptance Criteria:** Edge Function deploys and can be triggered; cron schedule configured
- **Testability:** Integration: Manual invoke returns 200; cron job visible in pg_cron

#### TODO-042b: Digest Query Logic
- **PRD Reference:** Section 12.3, MVP #31
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-042a, TODO-012
- **Effort:** S (1 day)
- **Description:** Build queries for digest content (overdue tasks, stale deals)
- **Tasks:**
  - [ ] Query overdue tasks per user (due_date < today, completed = false)
  - [ ] Query tasks due today per user
  - [ ] Query at-risk/stale deals per user (using STAGE_STALE_THRESHOLDS)
  - [ ] Return structured data for email template
- **Acceptance Criteria:** Queries return correct data grouped by user
- **Testability:** Unit: Mock data returns expected task/deal counts; SQL queries return correct rows

#### TODO-042c: Email Template & Formatting
- **PRD Reference:** Section 12.3, MVP #31
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-042b
- **Effort:** S (1 day)
- **Description:** Create HTML email template with digest content
- **Tasks:**
  - [ ] Create HTML email template with MFB branding
  - [ ] Format overdue tasks section with links to tasks
  - [ ] Format at-risk deals section with links to opportunities
  - [ ] Add "View Dashboard" CTA button
  - [ ] Ensure mobile-responsive email design
- **Acceptance Criteria:** Email renders correctly in Gmail, Outlook; links work
- **Testability:** Visual: Send test email to various clients; verify links resolve

#### TODO-042d: User Preferences & Empty Skip
- **PRD Reference:** Section 12.3, MVP #31
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-042c
- **Effort:** M (2 days)
- **Description:** Add per-user opt-in/out and skip empty digests
- **Tasks:**
  - [ ] Add `digest_opt_in` boolean to sales/users table
  - [ ] Create user settings UI for digest preference
  - [ ] Filter users by opt-in status in digest function
  - [ ] Skip sending if user has no overdue tasks AND no stale deals
  - [ ] Add opt-out link in email footer
- **Acceptance Criteria:** Users can toggle digest in settings; empty digests not sent
- **Testability:** E2E: Opt out → no email received; opt in with data → email received

### Authorization System

#### TODO-043: Dual-Level Authorization Architecture (PARENT - See subtasks below)
- **PRD Reference:** Section 13.1, MVP #14
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Implement org-level and product-level authorization tracking
- **Subtasks:** TODO-043a, TODO-043b, TODO-043c, TODO-043d
- **Acceptance Criteria:** Can track authorizations at both org and product level; warning shown for non-authorized combos

#### TODO-043a: Org-Level Authorizations Table
- **PRD Reference:** Section 13.1, MVP #14
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Effort:** M (2 days)
- **Description:** Create distributor_principal_authorizations table with RLS
- **Tasks:**
  - [ ] Create migration: `distributor_principal_authorizations` table
  - [ ] Columns: id, distributor_id (FK), principal_id (FK), is_authorized, authorization_date, expiration_date, notes, created_at, updated_at
  - [ ] Add unique constraint on (distributor_id, principal_id)
  - [ ] Enable RLS with team-wide read policy
  - [ ] Add GRANT for authenticated role
- **Acceptance Criteria:** Table created with proper constraints and RLS; can insert/query records
- **Testability:** Integration: Insert authorization record; query by distributor_id returns it

#### TODO-043b: Verify Product-Level Authorizations
- **PRD Reference:** Section 13.1, MVP #14
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-043a
- **Effort:** S (1 day)
- **Description:** Verify existing product_distributor_authorizations table or create if missing
- **Tasks:**
  - [ ] Check if `product_distributor_authorizations` table exists
  - [ ] If not, create migration with: product_id (FK), distributor_id (FK), is_authorized, notes
  - [ ] Ensure RLS and GRANT policies match org-level table
  - [ ] Document relationship between org-level and product-level tables
- **Acceptance Criteria:** Product-level authorizations table exists with proper schema
- **Testability:** Integration: Query product_distributor_authorizations returns results

#### TODO-043c: Authorization Inheritance Logic
- **PRD Reference:** Section 13.1, MVP #14
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-043b
- **Effort:** M (2 days)
- **Description:** Implement dual-level authorization resolution (product → org fallback)
- **Tasks:**
  - [ ] Create utility: `checkAuthorization(distributor_id, principal_id, product_id?)`
  - [ ] Logic: If product_id provided AND product-level record exists → use product-level
  - [ ] Otherwise → derive from org-level authorization
  - [ ] Return: { authorized: boolean, source: 'product' | 'org' | 'none', expiration?: Date }
  - [ ] Add database view for efficient authorization lookup
- **Acceptance Criteria:** Utility correctly resolves authorization with proper precedence
- **Testability:** Unit: Product-level override returns 'product'; fallback returns 'org'; no record returns 'none'

#### TODO-043d: Opportunity Authorization Warning
- **PRD Reference:** Section 13.1, MVP #14
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Depends On:** TODO-043c
- **Effort:** S (1 day)
- **Description:** Show soft warning when creating opportunity for non-authorized combo
- **Tasks:**
  - [ ] Call checkAuthorization on opportunity create/edit when distributor selected
  - [ ] If not authorized, show warning banner: "Distributor not authorized for this Principal"
  - [ ] Allow creation despite warning (soft warning, not blocking)
  - [ ] Log warning acknowledgment for analytics
- **Acceptance Criteria:** Warning displays for non-authorized combos; creation still allowed
- **Testability:** E2E: Select non-authorized distributor → warning appears; can still save

---

## 🟢 P3 - Low Priority / Cleanup (Week 8-12)

Polish items and technical cleanup.

### Dashboard Polish

#### TODO-036: Pipeline Column Tooltips
- **PRD Reference:** Section 9.2.2, MVP #35
- **Status:** ⬜ TODO
- **Priority:** 🟢 P3
- **Description:** Add tooltips to pipeline table columns
- **Tasks:**
  - [ ] "This Week" → "Activities logged Mon-Sun of current week"
  - [ ] "Last Week" → "Activities logged Mon-Sun of previous week"
  - [ ] "Momentum" → "Based on activity trend over 14 days"
- **Acceptance Criteria:** Hovering over column headers shows explanatory tooltip

#### TODO-037: Fix Next Action Dead Link
- **PRD Reference:** Section 9.2.2, MVP #36
- **Status:** ⬜ TODO
- **Priority:** 🟢 P3
- **Description:** Remove link styling from non-functional element
- **Tasks:**
  - [ ] Change "Schedule follow-up" from `variant="link"` to plain text
  - [ ] Only show as link when functional (has scheduled task)
- **Acceptance Criteria:** Non-functional "Schedule follow-up" displays as plain text

#### TODO-038: Pipeline Stage Tooltips
- **PRD Reference:** Section 7.4, MVP #41
- **Status:** ⬜ TODO
- **Priority:** 🟢 P3
- **Description:** Add help text mapping MFB 7-phase process to stages
- **Tasks:**
  - [ ] Add tooltip on Kanban stage headers
  - [ ] Reference Section 7.4 mapping table
  - [ ] Example: "Phase 3A activities typically happen in this stage"
- **Acceptance Criteria:** Stage headers show MFB process context on hover

### Organization Polish

#### TODO-039: Expand Organization Segments
- **PRD Reference:** Appendix D.3, MVP #40
- **Status:** ⬜ TODO
- **Priority:** 🟢 P3
- **Description:** Replace generic segments with 8 Playbook categories
- **Tasks:**
  - [ ] Update segments table with:
    - Major Broadline Distributor
    - Specialty/Regional Distributor
    - Management Company
    - GPO
    - University
    - Restaurant Group
    - Chain Restaurant
    - Hotel & Aviation
    - Unknown
  - [ ] Migrate existing data
  - [ ] Update segment dropdowns
- **Acceptance Criteria:** 9 strategic segment categories available

### Technical Cleanup

#### TODO-040: Remove DataQualityTab
- **PRD Reference:** MVP #24
- **Status:** ⬜ TODO
- **Priority:** 🟢 P3
- **Description:** Delete DataQualityTab and related DB artifacts
- **Tasks:**
  - [ ] Delete `DataQualityTab.tsx`
  - [ ] Remove `duplicate_stats` view
  - [ ] Remove `contact_duplicates` view
  - [ ] Remove `merge_duplicate_contacts` RPC
- **Acceptance Criteria:** No DataQualityTab; related DB objects removed

#### TODO-041: Enable CSV Import
- **PRD Reference:** MVP #8
- **Status:** ⬜ TODO (Currently Disabled)
- **Priority:** 🟢 P3
- **Description:** Test and re-enable Contact CSV import
- **Tasks:**
  - [ ] Test CSV import functionality
  - [ ] Fix any discovered issues
  - [ ] Re-enable import UI
  - [ ] Document import field mappings
- **Acceptance Criteria:** Contact CSV import works reliably

---
#### TODO-041a: Address Baseline Linting Errors
- **PRD Reference:** N/A (Code Quality)
- **Status:** ⬜ TODO
- **Priority:** 🟢 P3
- **Description:** Fix the 181 linting errors identified in the baseline to improve code quality and maintainability.
- **Tasks:**
  - [ ] Review `docs/archive/2025-11-testing-artifacts/baseline-lint-errors.txt`
  - [ ] Fix all `no-unused-vars` errors by removing unused code or prefixing with `_`.
  - [ ] Address accessibility issues (`jsx-a11y`).
  - [ ] Resolve `no-restricted-imports` and `no-restricted-syntax` violations to align with the engineering constitution.
  - [ ] Correct React hooks dependency array warnings.
- **Acceptance Criteria:** `npm run lint:check` passes with zero errors.

---

## Summary by Status

### ⬜ TODO (Not Started): 66 items
- **Original items:** 43
- **Decomposed subtasks:** 20 (from TODO-001, 004, 011, 022, 042, 043)
- **New items:** 3 (TODO-044 RBAC, TODO-049 Import Handling, Definition of Done)

### 🔧 Partial/In Progress: 0 items
### ✅ Done: 0 items

### Decomposed Items Breakdown
- **TODO-001** → 3 subtasks (001a, 001b, 001c) - Pipeline Migration
- **TODO-004** → 3 subtasks (004a, 004b, 004c) - Win/Loss Reasons
- **TODO-011** → 4 subtasks (011a, 011b, 011c, 011d) - Sample Tracking
- **TODO-022** → 2 subtasks (022a, 022b) - Duplicate Prevention
- **TODO-042** → 4 subtasks (042a, 042b, 042c, 042d) - Email Digest
- **TODO-043** → 4 subtasks (043a, 043b, 043c, 043d) - Authorization

---

## Dependencies Graph

```
TODO-001 (Pipeline Stage Migration)
    └── TODO-001a (DB Migration)
        └── TODO-001b (Constants & Schema)
            └── TODO-001c (UI & Filter Updates)

TODO-002 (Contact Org Enforcement)
    ├── TODO-003 (Contact-Customer Org Validation)
    └── TODO-049 (Contact Import Org Handling)

TODO-004 (Win/Loss Reasons UI)
    └── TODO-004a (Schema & Fields)
        └── TODO-004b (Modal Component)
            └── TODO-004c (Integration & Display)

TODO-005 (Activity Auto-Cascade)
    └── TODO-008 (Recent Activity Feed) [implicit - data integrity]

TODO-044 (RBAC Foundation)
    ├── TODO-019 (Bulk Owner Reassignment)
    └── TODO-034 (Note RLS Manager Override)

TODO-010 (QuickLogForm 13 Types)
    └── TODO-011 (Sample Tracking Workflow)
        └── TODO-011a (Schema & Validation)
            └── TODO-011b (Form Fields UI)
                └── TODO-011c (Workflow UI)
                    └── TODO-011d (Views & Filters)

TODO-012 (Per-Stage Stale Thresholds)
    ├── TODO-007 (Dashboard Stale KPI) [implicit]
    ├── TODO-013 (Visual Decay Indicators)
    ├── TODO-031 (Reports Per-Stage Stale)
    └── TODO-042b (Digest Query Logic) [implicit - stale calculations]

TODO-022 (Hybrid Duplicate Prevention)
    └── TODO-022a (Exact Match - MVP)
        └── TODO-022b (Fuzzy Match - Enhancement)

TODO-042 (Daily Email Digest)
    └── TODO-042a (Infrastructure & Cron)
        └── TODO-042b (Query Logic) → Depends on TODO-012
            └── TODO-042c (Email Template)
                └── TODO-042d (User Preferences)

TODO-043 (Dual-Level Authorization)
    └── TODO-043a (Org-Level Table)
        └── TODO-043b (Product-Level Table)
            └── TODO-043c (Inheritance Logic)
                └── TODO-043d (Opportunity Warning)
```

### Decomposed Task Summary

| Parent | Subtasks | Total Effort | Parallelizable |
|--------|----------|--------------|----------------|
| TODO-001 | 001a, 001b, 001c | 4 days | No (sequential) |
| TODO-004 | 004a, 004b, 004c | 4 days | No (sequential) |
| TODO-011 | 011a, 011b, 011c, 011d | 6 days | No (sequential) |
| TODO-022 | 022a, 022b | 4 days | No (022a is MVP) |
| TODO-042 | 042a, 042b, 042c, 042d | 6 days | No (sequential) |
| TODO-043 | 043a, 043b, 043c, 043d | 6 days | No (sequential) |

**Total Decomposed Effort:** 30 days across 20 subtasks

---

## Definition of Done (Per Sprint)

Each sprint must meet these criteria before items are marked complete:

### Code Quality
- [ ] All new code has unit tests (minimum 70% coverage for new files)
- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] Linting passes (`npm run lint:check`)
- [ ] No console errors in browser dev tools

### Testing
- [ ] Unit tests pass (`npm test`)
- [ ] E2E tests pass for affected features (`npm run test:e2e`)
- [ ] Manual smoke test of changed functionality
- [ ] Cross-browser check (Chrome, Safari, Edge)

### Documentation
- [ ] Zod schemas document new fields
- [ ] Complex logic has inline comments
- [ ] Breaking changes noted in CHANGELOG (if applicable)

### Review
- [ ] Code reviewed by at least one team member
- [ ] No unresolved review comments
- [ ] Sprint demo completed with stakeholder

---

## Sprint Planning Suggestion

### Sprint 1 (Week 1-2): Foundation & Security
- TODO-001a: Pipeline DB Migration (S, 1d)
- TODO-001b: Pipeline Constants & Schema (S, 1d)
- TODO-001c: Pipeline UI & Filter Updates (M, 2d)
- TODO-002: Contact Org Enforcement (M, 2d)
- TODO-044: RBAC Foundation (M, 2d) ← NEW: Enables role-based features
- TODO-005: Activity Auto-Cascade Trigger (M, 2d)
- **Sprint Total:** ~10 days | **Risk:** Medium (decomposed TODO-001 reduces risk)

### Sprint 2 (Week 2-4): Dashboard & Win/Loss
- TODO-004a: Win/Loss Reason Schema (S, 1d)
- TODO-004b: Win/Loss Modal Component (M, 2d)
- TODO-004c: Win/Loss Integration (S, 1d)
- TODO-006: Dashboard KPI #1 Fix (S, 1d)
- TODO-007: Dashboard KPI #4 Stale Deals (M, 2d)
- TODO-008: Recent Activity Feed (M, 2d)
- TODO-009: My Performance Widget (M, 2d)
- **Sprint Total:** ~11 days | **Risk:** Medium

### Sprint 3 (Week 4-6): Activities & Sample Tracking
- TODO-010: QuickLogForm 13 Types (M, 3d)
- TODO-011a: Sample Status Schema (S, 1d)
- TODO-011b: Sample Form Fields UI (M, 2d)
- TODO-011c: Sample Status Workflow UI (M, 2d)
- TODO-011d: Sample Tracking Views (S, 1d)
- TODO-003: Contact-Customer Org Validation (M, 2d)
- **Sprint Total:** ~11 days | **Risk:** Medium

### Sprint 4 (Week 6-8): Stale Detection & Duplicate Prevention
- TODO-012: Per-Stage Stale Thresholds (M, 2d)
- TODO-013: Visual Decay Indicators (M, 2d)
- TODO-022a: Exact Match Detection (M, 2d) ← MVP critical
- TODO-022b: Fuzzy Match Detection (M, 2d)
- TODO-019: Bulk Owner Reassignment (M, 3d) ← Requires TODO-044
- **Sprint Total:** ~11 days | **Risk:** Medium

### Sprint 5 (Week 8-10): Tasks, Reports & Authorization UI
- TODO-025-028: Task Module Items (~5d total)
- TODO-029-031: Reports Module Items (~4d total)
- TODO-020: Authorization UI Tab (L, 4d)
- TODO-021: Opportunity Bulk Delete (S, 1d)
- **Sprint Total:** ~14 days | **Risk:** High (can defer TODO-020 to Sprint 6)

### Sprint 6 (Week 10-12): Email Digest & Authorization Logic
- TODO-042a: Email Digest Infrastructure (M, 2d)
- TODO-042b: Digest Query Logic (S, 1d) ← Depends on TODO-012
- TODO-042c: Email Template (S, 1d)
- TODO-042d: User Preferences & Empty Skip (M, 2d)
- TODO-043a: Org-Level Authorizations Table (M, 2d)
- TODO-043b: Product-Level Authorizations (S, 1d)
- TODO-043c: Authorization Inheritance Logic (M, 2d)
- TODO-043d: Opportunity Authorization Warning (S, 1d)
- **Sprint Total:** ~12 days | **Risk:** Medium

### Sprint 7 (Week 12-14): Polish, Mobile & QA
- TODO-035: Mobile Quick Actions (M, 3d) ← Moved from Sprint 6
- TODO-032-034: Notes Cleanup (~3d total) ← Moved from Sprint 6
- TODO-036-038: Dashboard Polish (~3d total)
- TODO-039-041: Technical Cleanup (~4d total)
- TODO-049: Contact Import Org Handling (M, 2d) ← Can defer to post-MVP if needed
- Final regression testing (2d)
- User acceptance testing (2d)
- **Sprint Total:** ~19 days | **Risk:** Medium (has buffer capacity)

---

## Notes

1. **Timeline:** 90-120 days total per PRD Section 1.2
2. **Team Size:** 6 account managers will use the system
3. **Fallback:** No parallel Excel system (full commitment)
4. **Data Migration:** See `docs/migration/DATA_MIGRATION_PLAN.md`

---

*Generated from PRD v1.20 - Last Updated: 2025-11-28*
*Decomposition Update: 2025-11-28 - Added 14 atomic subtasks for TODO-011, 022, 042, 043*
*Audit Remediation: 2025-11-28 - Added TODO-001/004 decomposition, TODO-044 (RBAC), TODO-049, Definition of Done, rebalanced sprints*