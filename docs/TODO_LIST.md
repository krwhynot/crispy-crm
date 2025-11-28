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

#### TODO-001: Pipeline Stage Migration (8→7 stages)
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Description:** Remove `awaiting_response` stage from system
- **Tasks:**
  - [ ] Create database migration to update existing `awaiting_response` records to `sample_visit_offered`
  - [ ] Update `stageConstants.ts` to remove `awaiting_response`
  - [ ] Update Zod enum in opportunity schema
  - [ ] Update Kanban board components
  - [ ] Update any stage-related filters and reports
  - [ ] Test stage transitions
- **Acceptance Criteria:** System uses 7 stages; no references to `awaiting_response` remain
- **Audit Doc:** `docs/audits/opportunity-feature-matrix.md`

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

#### TODO-004: Win/Loss Reasons UI
- **PRD Reference:** Section 5.3, MVP #12, #47
- **Status:** ⬜ TODO
- **Priority:** 🔴 P0
- **Description:** Require reason selection when closing opportunities
- **Tasks:**
  - [ ] Add `win_reason` and `loss_reason` fields to opportunity Zod schema
  - [ ] Create modal component for stage change to `closed_won`/`closed_lost`
  - [ ] Implement win reasons dropdown (Relationship, Product quality, Price competitive, Distributor preference, Other)
  - [ ] Implement loss reasons dropdown (Price too high, No distributor authorization, Competitor relationship, Product not a fit, Timing/budget, Other)
  - [ ] Add "Other" free-text field
  - [ ] Block save without reason selection
  - [ ] Store reason in database
- **Acceptance Criteria:** Cannot close opportunity without selecting reason; reason visible on closed opportunities
- **Industry Standard:** Salesforce/HubSpot require reasons on close

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

#### TODO-011: Sample Tracking Workflow
- **PRD Reference:** Section 4.4, MVP #4
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Depends On:** TODO-010
- **Description:** Implement full sample status workflow UI
- **Tasks:**
  - [ ] Add `sample_status` enum to activities schema: sent, received, feedback_pending, feedback_received
  - [ ] Create conditional validation: if type=sample, sample_status required
  - [ ] Build sample-specific form fields (product sampled, recipient, follow-up date)
  - [ ] Implement status workflow UI: Sent → Received → Feedback Given
  - [ ] Add feedback options: Positive, Negative, Pending, No Response
  - [ ] Create sample tracking views/filters
- **Acceptance Criteria:** Can log sample with status; can update status through workflow; reminders work

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

#### TODO-022: Hybrid Duplicate Prevention
- **PRD Reference:** Section 10.4, MVP #13, #30
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Block exact duplicates, warn on fuzzy matches
- **Tasks:**
  - [ ] Implement exact match detection (Principal + Customer + Product)
  - [ ] Hard block exact matches with link to existing
  - [ ] Implement fuzzy match detection (Levenshtein distance ≤ 3 on customer name)
  - [ ] Soft warn fuzzy matches with confirmation option
  - [ ] Add UI for duplicate warning/blocking
- **Acceptance Criteria:** Exact duplicates blocked; similar names show warning but allow creation

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

## Notifications & Automation

### TODO-042: Daily Email Digest
- **PRD Reference:** Section 12.3, MVP #31
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** 7 AM cron email with overdue tasks + stale deals
- **Tasks:**
  - [ ] Create Supabase Edge Function for digest
  - [ ] Set up cron schedule (7 AM local time)
  - [ ] Email content: Overdue tasks, tasks due today, at-risk deals
  - [ ] Per-user opt-in/opt-out in settings
  - [ ] Skip empty digests
- **Acceptance Criteria:** Users receive daily digest at 7 AM; can opt out

---

## Authorization System

### TODO-043: Dual-Level Authorization Architecture
- **PRD Reference:** Section 13.1, MVP #14
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Description:** Implement org-level and product-level authorization tracking
- **Tasks:**
  - [ ] Create `distributor_principal_authorizations` table
  - [ ] Fields: distributor_id, principal_id, is_authorized, authorization_date, expiration_date, notes
  - [ ] Verify `product_distributor_authorizations` table exists
  - [ ] Implement authorization logic:
    - If product-level exists → use it
    - Else → derive from org-level
  - [ ] Add soft warning when creating opportunity for non-authorized combo
- **Acceptance Criteria:** Can track authorizations at both org and product level; warning shown for non-authorized combos

---

## Summary by Status

### ⬜ TODO (Not Started): 43 items
### 🔧 Partial/In Progress: 0 items
### ✅ Done: 0 items

---

## Dependencies Graph

```
TODO-002 (Contact Org Enforcement)
    └── TODO-003 (Contact-Customer Org Validation)

TODO-010 (QuickLogForm 13 Types)
    └── TODO-011 (Sample Tracking Workflow)

TODO-012 (Per-Stage Stale Thresholds)
    ├── TODO-013 (Visual Decay Indicators)
    └── TODO-031 (Reports Per-Stage Stale)

TODO-001 (Pipeline Stage Migration)
    └── (Many components depend on stage constants)

TODO-005 (Activity Auto-Cascade)
    └── (Improves activity tracking reliability)
```

---

## Sprint Planning Suggestion

### Sprint 1 (Week 1-2): Foundation
- TODO-001: Pipeline Stage Migration
- TODO-002: Contact Org Enforcement
- TODO-004: Win/Loss Reasons UI
- TODO-005: Activity Auto-Cascade Trigger

### Sprint 2 (Week 2-4): Dashboard & Activities
- TODO-006: Dashboard KPI #1 Fix
- TODO-007: Dashboard KPI #4 Stale Deals
- TODO-008: Recent Activity Feed
- TODO-009: My Performance Widget
- TODO-010: QuickLogForm 13 Types

### Sprint 3 (Week 4-6): Stale Detection & Core Features
- TODO-011: Sample Tracking Workflow
- TODO-012: Per-Stage Stale Thresholds
- TODO-013: Visual Decay Indicators
- TODO-003: Contact-Customer Org Validation
- TODO-022: Hybrid Duplicate Prevention

### Sprint 4 (Week 6-8): Module Improvements
- TODO-019: Bulk Owner Reassignment
- TODO-020: Authorization UI Tab
- TODO-021: Opportunity Bulk Delete
- TODO-025-028: Task Module Items
- TODO-029-031: Reports Module Items

### Sprint 5 (Week 8-10): Polish & Mobile
- TODO-035: Mobile Quick Actions
- TODO-036-038: Dashboard Polish
- TODO-032-034: Notes Cleanup
- TODO-042: Daily Email Digest

### Sprint 6 (Week 10-12): Cleanup & QA
- TODO-039-041: Technical Cleanup
- TODO-043: Authorization System
- Full regression testing
- User acceptance testing

---

## Notes

1. **Timeline:** 90-120 days total per PRD Section 1.2
2. **Team Size:** 6 account managers will use the system
3. **Fallback:** No parallel Excel system (full commitment)
4. **Data Migration:** See `docs/migration/DATA_MIGRATION_PLAN.md`

---

*Generated from PRD v1.20 - Last Updated: 2025-11-28*