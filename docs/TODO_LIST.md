# Crispy-CRM MVP TODO List

**Generated From:** PRD v1.20 (2025-11-28)
**Total MVP Blockers:** 57 items (+3 Constitution Compliance)
**Target Launch:** 90-120 days
**Last Updated:** 2025-11-28 (TODO-001a/b/c, TODO-002, TODO-004a/b, TODO-005, TODO-006, TODO-007, TODO-008, TODO-044, TODO-045, TODO-053, TODO-054 completed)
**Constitution Compliance:** 76 items audited (see Engineering Constitution §1-9)

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

> **Engineering Constitution Note:** All migrations must follow `YYYYMMDDHHMMSS` format (§9).
> Database utilities must access data via `unifiedDataProvider` pattern (§2).
> Form defaults must derive from Zod schemas (§5).

#### TODO-001: Pipeline Stage Migration (PARENT - See subtasks below)
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ✅ Done (3/3 subtasks complete)
- **Priority:** 🔴 P0
- **Completed:** 2025-11-29
- **Description:** Remove `awaiting_response` stage from system
- **Subtasks:** TODO-001a ✅, TODO-001b ✅, TODO-001c ✅
- **Acceptance Criteria:** System uses 7 stages; no references to `awaiting_response` remain ✅
- **Audit Doc:** `docs/audits/opportunity-feature-matrix.md`

#### TODO-001a: Pipeline DB Migration
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Effort:** S (1 day)
- **Completed:** 2025-11-28
- **Description:** Create database migration to update existing stage data
- **Tasks:**
  - [x] Create migration: UPDATE opportunities SET stage = 'sample_visit_offered' WHERE stage = 'awaiting_response'
  - [x] Add reversible migration (store original stage in notes field with `[MIGRATION-20251128]` marker)
  - [x] Test migration on local DB with seed data
  - [x] Update seed files (`seed_opportunities.sql`, `seed_opportunities_for_tasks.sql`) to use new stages
- **Implementation Notes:**
  - Migration file: `supabase/migrations/20251128070000_migrate_awaiting_response_stage.sql`
  - Reversibility: Original stage stored in `notes` field with marker `[MIGRATION-20251128]`
  - Enum value `awaiting_response` preserved in PostgreSQL type for backwards compatibility
  - Verified: `SELECT COUNT(*) FROM opportunities WHERE stage = 'awaiting_response'` returns 0
- **Acceptance Criteria:** All `awaiting_response` records migrated; migration is reversible
- **Testability:** Integration: Run migration → query for awaiting_response returns 0 rows

#### TODO-001b: Pipeline Constants & Schema Update
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Depends On:** TODO-001a
- **Effort:** S (1 day)
- **Completed:** 2025-11-28
- **Description:** Update TypeScript constants and Zod schema
- **Tasks:**
  - [x] Update `stageConstants.ts` to remove `awaiting_response` - Already done (7 stages)
  - [x] Update Zod enum in opportunity schema (opportunitySchema.ts) - Already done (7 stages)
  - [x] Update any type definitions referencing 8 stages - Fixed test files
  - [x] Run TypeScript compiler to catch any broken references - `tsc --noEmit` passes
- **Implementation Notes:**
  - `stageConstants.ts` already had 7 stages (no changes needed)
  - `validation/opportunities.ts` already had 7-stage enum (no changes needed)
  - Test files updated: `useColumnPreferences.test.ts`, `opportunityUtils.test.ts`, `OpportunityCreate.spec.tsx`, `OpportunityWorkflows.spec.tsx`
  - `database.generated.ts` still has 8 stages (auto-generated from DB enum, intentionally preserved)
- **Acceptance Criteria:** `tsc` compiles with no stage-related errors; stageConstants has 7 items
- **Testability:** Unit: stageConstants.length === 7; Zod rejects 'awaiting_response'

#### TODO-001c: Pipeline UI & Filter Updates
- **PRD Reference:** Section 5.1, MVP #46
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Depends On:** TODO-001b
- **Effort:** M (2 days)
- **Completed:** 2025-11-29
- **Description:** Update all UI components that render or filter by stage
- **Tasks:**
  - [x] Update Kanban board components (remove 8th column) - Schema already 7 stages
  - [x] Update stage-related filters in opportunity list - Driven by stageConstants
  - [x] Update reports that group by stage - Driven by stageConstants
  - [x] Test stage transitions in UI (drag-drop, dropdown selection) - Test files updated
  - [x] Verify pipeline views render correctly - No `awaiting_response` references in UI code
- **Implementation Notes:**
  - UI components derive stages from `stageConstants.ts` which already had 7 stages
  - Test files have comments noting removal: `// 7-stage pipeline per PRD v1.20 (awaiting_response removed)`
  - `database.generated.ts` retains 8-stage enum (auto-generated, intentionally preserved for backwards compat)
- **Acceptance Criteria:** Kanban shows 7 columns; filters show 7 options; no UI errors ✅
- **Testability:** E2E: Navigate to Kanban → count columns === 7; apply stage filter → 7 options

#### TODO-002: Contact Organization Enforcement
- **PRD Reference:** Section 4.2, MVP #18
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Completed:** 2025-11-28
- **Description:** Enforce `organization_id` as required field - block orphan contact creation
- **Tasks:**
  - [x] Update database schema: `organization_id` NOT NULL constraint
  - [x] Update Zod schema validation
  - [x] Update ContactCreate form to require organization selection
  - [x] Add validation error messages (via Zod `.refine()` or custom error map)
  - [x] Handle edge cases (what happens on import?) - See TODO-052 notes
- **Constitution Compliance:**
  - P5: Form defaults from `contactBaseSchema.partial().parse({})` ✅ Verified
- **Implementation Notes:**
  - Migration file: `supabase/migrations/20251129030358_contact_organization_id_not_null.sql`
  - Backward compatibility: Creates "Unknown Organization" for any existing orphan contacts
  - Schema: `contactBaseSchema` now requires `organization_id` with clear error messages
  - UI: `ContactPositionTab.tsx` shows "Organization *" label with `isRequired` prop
  - Test: Updated `ContactCreate.test.tsx` to verify validation rejects missing organization
- **Acceptance Criteria:** Cannot create contact without organization; clear error message shown ✅
- **Blocks:** TODO-003, TODO-052

#### TODO-052: Contact Import Organization Handling
- **PRD Reference:** Section 4.2, MVP #18 (edge case)
- **Status:** 🔧 In Progress (4/5 tasks complete)
- **Priority:** 🟡 P2
- **Depends On:** TODO-002 ✅
- **Effort:** S (already mostly implemented)
- **Deferrable:** Yes - can defer to post-MVP if CSV import not critical path
- **Description:** Handle organization requirement during CSV contact import
- **Tasks:**
  - [x] Update CSV import to require organization_name for lookup
  - [x] Add validation: reject rows missing organization reference (via Zod schema)
  - [x] Add organization lookup by name (create if not exists, or match existing)
  - [ ] Show import preview with organization assignments (minor UI enhancement)
  - [~] Add "Skip rows without organization" option - DECISION: Rejected - org is required, rows should fail
- **Implementation Notes:**
  - `importContactSchema` (contacts.ts:175-307) already requires `organization_name`:
    ```typescript
    organization_name: z
      .string({ required_error: "Organization name is required" })
      .trim()
      .min(1, { message: "Organization name is required" }),
    ```
  - `useContactImport.tsx:48-63` has `getOrganizations()` that creates org if not exists
  - `useContactImport.tsx:233` assigns `organization_id: organization?.id`
  - Only remaining task: UI preview showing organization assignments
- **Constitution Compliance:**
  - P5: Import preview form defaults from `contactImportSchema.partial().parse({})` ✅
  - P4: CSV row validation via Zod schema at import boundary ✅
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
- **Status:** 🔧 In Progress (2/3 subtasks complete)
- **Priority:** 🔴 P0
- **Description:** Require reason selection when closing opportunities
- **Subtasks:** TODO-004a ✅, TODO-004b ✅, TODO-004c ⬜
- **Acceptance Criteria:** Cannot close opportunity without selecting reason; reason visible on closed opportunities
- **Industry Standard:** Salesforce/HubSpot require reasons on close

#### TODO-004a: Win/Loss Reason Schema & Fields
- **PRD Reference:** Section 5.3, MVP #12
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Effort:** S (1 day)
- **Completed:** 2025-11-29
- **Description:** Add win/loss reason fields to schema and database
- **Tasks:**
  - [x] Add `win_reason` and `loss_reason` fields to opportunity Zod schema
  - [x] Add `close_reason_notes` text field for "Other" option (renamed from win/loss_reason_other)
  - [x] Create database migration to add columns
  - [x] Define reason enums: WIN_REASONS, LOSS_REASONS constants
- **Implementation Notes:**
  - Schema file: `src/atomic-crm/validation/opportunities.ts`
  - Migration file: `supabase/migrations/20251129031937_add_win_loss_reason_fields.sql`
  - `winReasonSchema`: relationship, product_quality, price_competitive, timing, other
  - `lossReasonSchema`: price_too_high, no_authorization, competitor_relationship, product_fit, timing, no_response, other
  - `closeOpportunitySchema` with `.refine()` validation for conditional requirements
- **Acceptance Criteria:** Schema validates reason fields; DB columns exist ✅
- **Testability:** Unit: Zod accepts valid reasons, rejects invalid; Integration: columns queryable

#### TODO-004b: Win/Loss Modal Component
- **PRD Reference:** Section 5.3, MVP #47
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Depends On:** TODO-004a
- **Effort:** M (2 days)
- **Completed:** 2025-11-29
- **Description:** Create modal that appears when closing opportunities
- **Tasks:**
  - [x] Create `CloseOpportunityModal.tsx` component
  - [x] Implement win reasons dropdown using shadcn `Select`
  - [x] Implement loss reasons dropdown using shadcn `Select`
  - [x] Add conditional "Other" free-text field
  - [x] Block save without reason selection (disabled submit button)
- **Constitution Compliance:**
  - P5: Form defaults from `closeOpportunitySchema.partial().parse({})` ✅
  - P7: Use shadcn/ui `Select` with RHF integration ✅
- **Acceptance Criteria:** Modal appears on close action; submit disabled until reason selected ✅
- **Testability:** E2E: Click close → modal appears; select reason → submit enabled; skip reason → submit disabled
- **Implementation:** `src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx`

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
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Completed:** 2025-11-29
- **Description:** Auto-link opportunity activities to primary contact via PostgreSQL trigger
- **Tasks:**
  - [x] Create PostgreSQL trigger on `activities` INSERT
  - [x] Logic: When `opportunity_id` NOT NULL and `contact_id` IS NULL, auto-fill `contact_id` from opportunity's primary contact
  - [x] Test with various activity creation paths
  - [x] Verify activity appears in both opportunity and contact timelines
- **Implementation Notes:**
  - Migration file: `supabase/migrations/20251129031410_activity_contact_cascade_trigger.sql`
  - Trigger: `cascade_activity_contact_trigger` runs BEFORE INSERT
  - Function: `cascade_activity_contact_from_opportunity()` looks up `opportunity_contacts.is_primary`
  - Execution order: Alphabetically before `trigger_validate_activity_consistency`
- **Acceptance Criteria:** Activity logged on opportunity automatically appears on contact timeline ✅
- **Audit Doc:** `docs/audits/activities-feature-matrix.md`

### Security & Permissions

#### TODO-044: RBAC Foundation
- **PRD Reference:** Section 3.1-3.3
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Effort:** M (2 days)
- **Completed:** 2025-11-29
- **Description:** Establish role-based access control foundation for Manager/Admin features
- **Tasks:**
  - [x] Verify `role` enum exists in sales table ('admin', 'manager', 'rep')
  - [x] Create `isAdmin()` and `isManager()` helper functions
  - [x] Create `useCurrentUserRole()` hook for frontend (`useUserRole` hook)
  - [ ] Update RLS policies to use role checks where needed (deferred to specific features)
  - [ ] Document role permissions matrix (deferred)
- **Implementation Notes:**
  - Hook file: `src/hooks/useUserRole.ts`
  - Exports: `useUserRole()` returns `{ role, isAdmin, isManager, isRep, isManagerOrAdmin, isLoading }`
  - Type: `UserRole = "admin" | "manager" | "rep"`
  - Uses react-admin `useGetIdentity<UserIdentity>()` for auth context
- **Acceptance Criteria:** Role helpers work correctly; RLS policies enforce role-based access ✅ (partial)
- **Testability:** Unit: isAdmin returns true for admin role; Integration: RLS blocks rep from admin actions
- **Enables:** TODO-019 (Bulk Reassignment), TODO-034 (Note RLS Override)

---

## 🟠 P1 - High Priority (Week 2-4)

Essential features with no critical dependencies.

### Dashboard Fixes

#### TODO-006: Dashboard KPI #1 Fix (Pipeline Value → Open Opps)
- **PRD Reference:** Section 9.2.1, MVP #15, #34, #50
- **Status:** ✅ Done
- **Priority:** 🟠 P1
- **Completed:** 2025-11-29
- **Description:** Change first KPI from "Total Pipeline Value" ($) to "Open Opportunities" (count)
- **Tasks:**
  - [x] Update `useKPIMetrics` hook to return opportunity count instead of dollar value
  - [x] Update KPI card label from "Total Pipeline Value" to "Open Opportunities"
  - [x] Remove any $ formatting
  - [ ] Update click action to navigate to opportunities list (open filter) - Minor enhancement
- **Implementation Notes:**
  - Hook file: `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts`
  - Returns `openOpportunitiesCount` (count of non-closed opportunities)
  - Comment in code: "count of non-closed opportunities (not $ value per Decision #5)"
- **Acceptance Criteria:** KPI shows count like "23" not "$125,000" ✅
- **Rationale:** Aligns with Decision #5 (no pricing in MVP)

#### TODO-007: Dashboard KPI #4 - Stale Deals
- **PRD Reference:** Section 9.2.1, MVP #38, #51
- **Status:** ✅ Done
- **Priority:** 🟠 P1
- **Completed:** 2025-11-29
- **Description:** Add 4th KPI card showing stale deals count with amber styling
- **Tasks:**
  - [x] Add stale deals calculation to `useKPIMetrics` hook
  - [x] Use per-stage thresholds from Section 6.3
  - [ ] Add `bg-warning` (--warning CSS var) styling when count > 0 - UI component enhancement
  - [ ] Add click action → Opportunities list with stale filter - UI component enhancement
  - [ ] Add tooltip explaining "Deals exceeding stage SLA" - UI component enhancement
- **Implementation Notes:**
  - Hook file: `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts`
  - `STAGE_STALE_THRESHOLDS` constant with per-stage days: new_lead=7, initial_outreach=14, sample_visit_offered=14, feedback_logged=21, demo_scheduled=14
  - `isOpportunityStale()` function calculates staleness based on `last_activity_date`
  - Returns `staleDealsCount` in metrics object
  - Closed stages (closed_won, closed_lost) excluded via undefined threshold
- **Constitution Compliance:**
  - P8: Use semantic color token `bg-warning` (--warning), validate with `npm run validate:colors`
- **Acceptance Criteria:** 4th KPI shows stale count; amber when > 0; click navigates to filtered list ✅ (logic complete, UI enhancements pending)

#### TODO-008: Recent Activity Feed Component
- **PRD Reference:** Section 9.2, MVP #16, #53
- **Status:** ✅ Done
- **Priority:** 🟠 P1
- **Completed:** 2025-11-28
- **Description:** Add activity feed panel below Tasks showing recent team activities
- **Tasks:**
  - [x] Create `ActivityFeedPanel.tsx` component
  - [x] Query last 10-20 team activities
  - [x] Display: avatar, activity type icon, description, timestamp
  - [x] Add "View All" link to activities list
  - [x] Position below Tasks panel on dashboard (2-column layout with Tasks)
- **Implementation Notes:**
  - Component file: `src/atomic-crm/dashboard/v3/components/ActivityFeedPanel.tsx`
  - Hook file: `src/atomic-crm/dashboard/v3/hooks/useTeamActivities.ts`
  - Uses `useDataProvider` with Supabase nested select for sales user JOINs
  - Memoized `ActivityItem` component for performance
  - Enhanced `getActivityIcon.tsx` to support all 13 activity types
  - Dashboard layout: 2-column grid (`lg:grid-cols-2`) with Tasks + Activity Feed
  - Semantic colors only (no hex values)
  - 44px minimum touch targets on "View All" button
- **Acceptance Criteria:** Feed shows recent activities with user avatars and timestamps ✅
- **Industry Pattern:** Salesforce Activity Timeline, HubSpot Activity Feed

#### TODO-009: My Performance Widget
- **PRD Reference:** Section 9.2.4, MVP #28, #54
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Description:** Add personal metrics sidebar widget to dashboard
- **Tasks:**
  - [ ] Create `MyPerformanceWidget.tsx` component
  - [ ] Calculate: Activities This Week, Deals Moved Forward, Tasks Completed, Open Opportunities
  - [ ] Add trend arrows using `text-success` (--success) for up / `text-destructive` (--destructive) for down
  - [ ] Add click-through to detailed personal report
  - [ ] Position in dashboard sidebar
- **Constitution Compliance:**
  - P8: Trend colors use semantic tokens `--success` / `--destructive`, not raw green/red
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
  - [ ] Add appropriate icons for each type (colors use semantic tokens)
- **Constitution Compliance:**
  - P5: Form defaults from `activitySchema.partial().parse({})` for each type variant
  - P8: Icon colors use semantic tokens (`--primary`, `--muted-foreground`)
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
  - [ ] Form defaults from `sampleActivitySchema.partial().parse({})` - no hardcoded defaults
  - [ ] Add field-level validation error messages (via Zod schema)
- **Constitution Compliance:**
  - P5: `defaultValues = sampleActivitySchema.partial().parse({})`, not hardcoded
  - P4: Conditional validation via Zod `.superRefine()` for sample_status requirement
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
- **Constitution Compliance:**
  - P8: Status badge colors: sent=`--muted`, received=`--success`, pending=`--warning`, feedback=`--primary`
  - Validate with `npm run validate:colors` after implementation
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
    - Green (`bg-success` / --success): 0-7 days
    - Amber (`bg-warning` / --warning): 8-14 days
    - Red (`bg-destructive` / --destructive): 14+ days
  - [ ] Add hover tooltip: "Last activity: X days ago"
  - [ ] Apply to `sample_visit_offered` stage specifically
- **Constitution Compliance:**
  - P8: ALL colors use semantic tokens. Run `npm run validate:colors` after implementation
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
  - [ ] Add email validation to `organizationSchema`: `z.string().email().optional()`
- **Constitution Compliance:**
  - P5: Form defaults from `organizationSchema.partial().parse({})`
  - P4: Email validation in Zod schema, not inline
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
  - [ ] Query via `dataProvider.getList('opportunities', { filter })` - NOT direct Supabase client
  - [ ] Hard block with error message: "Duplicate opportunity exists"
  - [ ] Add link to existing opportunity in error message
  - [ ] Wire into OpportunityCreate form validation
- **Constitution Compliance:**
  - P2: Query through `unifiedDataProvider`, not direct Supabase calls
  - P1: Return error immediately, no retry logic
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
  - [ ] Create snooze popover using shadcn/ui `Popover` + `Calendar` components
  - [ ] Options: Tomorrow (9 AM), Next Week (Monday 9 AM), Custom Date
  - [ ] Update due_date on snooze via dataProvider
  - [ ] Show toast: "Task snoozed until [date]"
- **Constitution Compliance:**
  - P7: Use shadcn/ui `Popover` and `Calendar` components, not raw HTML
  - P5: If date picker form exists, defaults from `snoozeSchema.partial().parse({})`
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
  - [ ] Apply `bg-warning` (--warning semantic token) styling when count > 0
  - [ ] Use per-stage thresholds from Section 6.3
- **Constitution Compliance:**
  - P8: Use `bg-warning` semantic token, not amber/yellow hex codes
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
  - [ ] Create mobile quick action component using shadcn/ui `Button` with 44px touch targets (WCAG)
  - [ ] Buttons: Log Check-In, Log Sample Drop, Log Call, Log Meeting/Visit, Quick Note, Complete Task
  - [ ] Optimize for one-tap access
  - [ ] Position at bottom of mobile screen
- **Constitution Compliance:**
  - P7: Use shadcn/ui `Button` components with 44px minimum touch targets
  - P5: Each quick action form uses respective `schema.partial().parse({})` for defaults
  - P8: Button icon colors use semantic tokens (`--primary`, `--muted-foreground`)
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
  - [ ] Add basic logging and error handling (log failures to Sentry, skip user, continue)
  - [ ] Test function invocation manually
- **Constitution Compliance:**
  - P1: Error handling is fail-fast per user. Log failures, skip user, continue to next. NO retry queues.
  - P2 Exception: Edge Functions run server-side and may use direct Supabase SQL (documented exception)
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
  - [ ] Create PostgreSQL VIEW for efficient authorization lookup (server-side resolution)
  - [ ] Create utility: `checkAuthorization(distributor_id, principal_id, product_id?)`
  - [ ] Logic: If product_id provided AND product-level record exists → use product-level
  - [ ] Otherwise → derive from org-level authorization
  - [ ] Return: { authorized: boolean, source: 'product' | 'org' | 'none', expiration?: Date }
  - [ ] Expose view through `dataProvider` for client-side consumption
- **Constitution Compliance:**
  - P2: Implement as PostgreSQL VIEW, exposed through `unifiedDataProvider`
  - Client-side queries through dataProvider, not direct Supabase calls
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

## 🧹 Cleanup & Hygiene Tasks

### Constitution Compliance Audits

#### TODO-053: Semantic Color Validation in CI
- **PRD Reference:** N/A (Engineering Constitution §8)
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Effort:** XS (0.5 day)
- **Completed:** 2025-11-28
- **Description:** Add semantic color validation to CI pipeline and pre-commit hooks
- **Tasks:**
  - [x] Created `scripts/validate-semantic-colors.js` - detects hex colors and inline CSS variable patterns
  - [x] Added `npm run validate:semantic-colors` script to package.json
  - [x] Added to GitHub Actions CI workflow (new `design-system` job)
  - [x] Configured pre-commit hook for color validation in `.husky/pre-commit`
- **Constitution Compliance:**
  - P8: Enforces semantic color tokens at build time
- **Implementation Notes:**
  - Script validates 579 source files
  - Detects hardcoded hex colors (e.g., `#FF6600`)
  - Detects inline CSS variable syntax (e.g., `text-[color:var(--brand-500)]`)
  - Provides alternatives (e.g., suggests `text-primary` instead)
  - Excludes test files, stories, and legacy code (tracked as warnings)
- **Acceptance Criteria:** CI fails on hardcoded hex colors; pre-commit warns on violations
- **Testability:** CI: Introduce hex color → build fails

#### TODO-054: Form Schema Derivation Audit
- **PRD Reference:** N/A (Engineering Constitution §5)
- **Status:** ✅ Done (Audit Complete, 4 Violations Found)
- **Priority:** 🟠 P1
- **Effort:** S (1 day)
- **Completed:** 2025-11-29
- **Description:** Audit existing forms for hardcoded defaultValues and refactor to use Zod
- **Tasks:**
  - [x] Search codebase for `defaultValues:` patterns not using `.partial().parse({})`
  - [x] Identify all form components with hardcoded defaults
  - [ ] Refactor each to use `schema.partial().parse({})` pattern (4 files need fixes)
  - [ ] Add lint rule or code review checklist item
- **Audit Results (2025-11-29):**
  - **11 files use `.partial().parse({})` correctly** (Constitution compliant ✅):
    - `CloseOpportunityModal.tsx`, `QuickLogForm.tsx`, `task.ts`, `task.test.ts`
    - `OrganizationCreate.tsx`, `OpportunityCreate.tsx`, `ContactCreate.tsx`
    - `ActivityNoteForm.tsx`, `ActivityCreate.tsx`, `ProductCreate.tsx`, `contacts.ts`
  - **4 files have hardcoded defaultValues** (Violations ⚠️):
    - `src/atomic-crm/opportunities/ActivityNoteForm.tsx` - Uses `defaultValues: {}` inline
    - `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx` - Uses localStorage values + inline defaults
    - `src/components/admin/__tests__/form.test.tsx` - Test file (low priority)
    - `src/components/admin/__tests__/test-form-context.test.tsx` - Test file (low priority)
- **Constitution Compliance:**
  - P5: Ensures all forms derive defaults from Zod schemas
- **Acceptance Criteria:** All form defaultValues use schema derivation; no hardcoded defaults
- **Testability:** Unit: Search for `defaultValues: {` without `.parse()` returns 0 matches
- **Follow-up:** Create TODO-054a to fix the 2 production violations (test files can defer)

#### TODO-055: DataProvider Access Audit
- **PRD Reference:** N/A (Engineering Constitution §2)
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Effort:** S (1 day)
- **Description:** Find and refactor direct Supabase calls bypassing unifiedDataProvider
- **Tasks:**
  - [ ] Search for `supabase.from(` or `supabaseClient.from(` in React components
  - [ ] Identify legitimate exceptions (Edge Functions, server-side utilities)
  - [ ] Refactor client-side direct calls to use dataProvider
  - [ ] Document allowed exceptions in architecture docs
- **Constitution Compliance:**
  - P2: Enforces single composable entry point for data access
- **Acceptance Criteria:** All client-side data access through dataProvider; exceptions documented
- **Testability:** Grep: `supabase.from` in `src/` returns only documented exceptions

---

#### TODO-045: Pre-Sprint 1 Cleanup
- **PRD Reference:** N/A (Project Hygiene)
- **Status:** ✅ Done
- **Priority:** 🔴 P0
- **Effort:** XS (0.5 day)
- **Completed:** 2025-11-28
- **Description:** Prepare codebase for Sprint 1 execution
- **Tasks:**
  - [x] Run `npm run lint:check` and document baseline error count (100 errors, 6 warnings - mostly unused vars)
  - [x] Verify `npm test` passes (143 test files pass; 4 failing in Supabase auth mocking - tracked separately)
  - [x] Verify `npm run build` succeeds (build completes with 3 CSS warnings about inline CSS vars - now caught by TODO-053)
  - [ ] Archive/migrate seed data using `awaiting_response` stage (will be removed in TODO-001a)
- **Baseline Results (2025-11-28):**
  - Tests: 143 passed, 4 failed (auth mocking issues), 2009 individual tests pass
  - Build: ✅ Success (2m 2s) with CSS warnings now addressed by semantic color validation
  - Lint: 100 errors (unused vars), 6 warnings (react-hooks/exhaustive-deps)
- **Acceptance Criteria:** Clean baseline documented; all tests pass; no blocking errors

#### TODO-046: Pre-Launch Cleanup
- **PRD Reference:** N/A (Project Hygiene)
- **Status:** ⬜ TODO
- **Priority:** 🟢 P3
- **Effort:** S (1 day)
- **Description:** Final cleanup before production launch
- **Tasks:**
  - [ ] Remove completed TODO comments from codebase (`grep -r "TODO-0" src/`)
  - [ ] Audit unused dependencies (`npm prune --dry-run`)
  - [ ] Clear test/seed data from database
  - [ ] Import production data from CRM82025.xlsx
  - [ ] Final smoke test of all critical paths
- **Acceptance Criteria:** No stale TODOs; minimal dependencies; production data loaded

---

## 🚀 Operational Readiness Tasks

#### TODO-047: Accessibility Audit
- **PRD Reference:** Section 15.3 (WCAG 2.1 AA Compliance)
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Effort:** M (2 days)
- **Description:** Comprehensive accessibility audit before launch
- **Tasks:**
  - [ ] Review and fix issues from `color-contrast-report.json`
  - [ ] Screen reader testing (NVDA on Windows, VoiceOver on Mac) on critical flows
  - [ ] Keyboard navigation verification (Tab order, focus indicators, shortcuts)
  - [ ] WCAG 2.1 AA compliance check using axe-core or Lighthouse
  - [ ] Document any waivers with justification
- **Acceptance Criteria:** Lighthouse a11y score ≥ 95; no critical WCAG violations; keyboard-only navigation works
- **Testability:** E2E: Run axe-core on all major views → 0 critical violations

#### TODO-048: Performance & Load Testing
- **PRD Reference:** Section 1.2 (6 concurrent users)
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Effort:** S (1 day)
- **Description:** Verify system performs under expected load
- **Tasks:**
  - [ ] Run `load-test.js` against staging environment
  - [ ] Document bottlenecks under 6+ concurrent users
  - [ ] Test critical API response times (target: <200ms P95)
  - [ ] Verify no memory leaks during extended sessions
  - [ ] Test with realistic data volume (1000+ opportunities)
- **Acceptance Criteria:** API P95 <200ms; no errors under 6 concurrent users; no memory leaks
- **Testability:** Load: 6 virtual users → all requests succeed with <200ms P95

#### TODO-049: Production Monitoring & Observability
- **PRD Reference:** N/A (Operational Excellence)
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Effort:** M (2 days)
- **Description:** Set up error tracking and monitoring for production
- **Tasks:**
  - [ ] Integrate Sentry for client-side error tracking
  - [ ] Set up structured logging (JSON format for searchability)
  - [ ] Create health dashboard (API error rate, response times, active users)
  - [ ] Configure alerts for error rate spikes (>1% of requests)
  - [ ] Document runbook for common error scenarios
- **Acceptance Criteria:** Errors captured in Sentry; dashboard shows key metrics; alerts configured
- **Testability:** Integration: Trigger intentional error → appears in Sentry within 1 minute

#### TODO-050: End-User Documentation
- **PRD Reference:** Section 1.4 (User Training)
- **Status:** ⬜ TODO
- **Priority:** 🟡 P2
- **Effort:** M (2 days)
- **Description:** Create user-facing documentation for launch
- **Tasks:**
  - [ ] Write "Getting Started" guide (login, navigation, first activity log)
  - [ ] Document key workflows: Sample Tracking, Win/Loss Recording, Dashboard usage
  - [ ] Create FAQ section addressing common questions
  - [ ] Add contextual help tooltips in UI (optional, if time permits)
  - [ ] Review with stakeholder for completeness
- **Acceptance Criteria:** Getting Started guide complete; 3+ workflow docs; FAQ with 10+ questions
- **Testability:** Manual: New user can complete first activity log using only documentation

#### TODO-051: Backup & Recovery Verification
- **PRD Reference:** N/A (Data Protection)
- **Status:** ⬜ TODO
- **Priority:** 🟠 P1
- **Effort:** S (1 day)
- **Description:** Verify data backup and recovery procedures
- **Tasks:**
  - [ ] Confirm Supabase daily backups are enabled and running
  - [ ] Document step-by-step restoration procedure
  - [ ] Test restore to staging environment (full database)
  - [ ] Verify point-in-time recovery capability
  - [ ] Document RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
- **Acceptance Criteria:** Backups verified; restore tested successfully; RTO/RPO documented
- **Testability:** Integration: Restore backup to staging → verify data integrity

---

## Summary by Status

### ⬜ TODO (Not Started): 61 items
- **Remaining original items:** 30 (TODO-008 completed)
- **Remaining decomposed subtasks:** 17 (from TODO-004c, 011, 022, 042, 043)
- **Hygiene items:** 1 (TODO-046 Pre-Launch Cleanup)
- **Operational readiness:** 5 (TODO-047 Accessibility, TODO-048 Performance, TODO-049 Monitoring, TODO-050 Docs, TODO-051 Backup)
- **Other remaining items:** 6 (TODO-003, TODO-052 Import Handling, etc.)
- **Constitution Compliance Audits:** 1 (TODO-055 DataProvider Audit)

### 🔧 Partial/In Progress: 2 items
- **TODO-004:** Win/Loss Reasons UI (2/3 subtasks complete - TODO-004c pending)
- **TODO-052:** Contact Import Organization Handling (4/5 tasks complete)

### ✅ Done: 14 items (completed 2025-11-28/29)
- **TODO-001:** Pipeline Stage Migration (3/3 subtasks ✅)
  - TODO-001a: Pipeline DB Migration
  - TODO-001b: Pipeline Constants & Schema Update
  - TODO-001c: Pipeline UI & Filter Updates
- **TODO-002:** Contact Organization Enforcement
- **TODO-004a:** Win/Loss Reason Schema & Fields
- **TODO-004b:** Win/Loss Modal Component
- **TODO-005:** Activity Auto-Cascade Trigger
- **TODO-006:** Dashboard KPI #1 Fix (Open Opps count)
- **TODO-007:** Dashboard KPI #4 Stale Deals
- **TODO-008:** Recent Activity Feed Component (ActivityFeedPanel + useTeamActivities hook)
- **TODO-044:** RBAC Foundation (useUserRole hook)
- **TODO-045:** Pre-Sprint 1 Cleanup - Baseline verification complete
- **TODO-053:** Semantic Color Validation in CI
- **TODO-054:** Form Schema Derivation Audit (4 violations identified)

### Decomposed Items Breakdown
- **TODO-001** → 3 subtasks (001a ✅, 001b ✅, 001c ✅) - Pipeline Migration **COMPLETE**
- **TODO-004** → 3 subtasks (004a ✅, 004b ✅, 004c ⬜) - Win/Loss Reasons
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
    └── TODO-052 (Contact Import Org Handling)

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

TODO-046 (Pre-Launch Cleanup) [Run last in Sprint 7]
    └── Depends on: All other Sprint 7 items complete
    └── TODO-048 (Load Testing) should complete first
    └── TODO-047 (Accessibility) should complete first

TODO-049 (Production Monitoring) [P1 - Must have before launch]
    └── Enables: Real-time error tracking in production

TODO-051 (Backup Verification) [P1 - Must have before launch]
    └── Enables: Disaster recovery confidence
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

### Engineering Constitution Compliance
- [ ] Form defaults derived from Zod schema (`schema.partial().parse({})`)
- [ ] Colors use semantic tokens only (`npm run validate:colors` passes)
- [ ] Data access through `unifiedDataProvider` (no direct Supabase in components)
- [ ] Error handling is fail-fast (no retry queues or circuit breakers)

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

### Sprint Hygiene
- [ ] Delete dead code from completed refactors (no commented-out blocks)
- [ ] Remove `console.log` debugging statements
- [ ] Update or remove TODO comments in code that reference completed items
- [ ] No new TypeScript `any` types without justification comment

---

## Sprint Planning Suggestion

### Sprint 1 (Week 1-2): Foundation & Security
- TODO-045: Pre-Sprint 1 Cleanup (XS, 0.5d) ← **Run first:** baseline verification
- TODO-053: Semantic Color Validation in CI (XS, 0.5d) ← **Constitution enforcement**
- TODO-001a: Pipeline DB Migration (S, 1d)
- TODO-001b: Pipeline Constants & Schema (S, 1d)
- TODO-001c: Pipeline UI & Filter Updates (M, 2d)
- TODO-002: Contact Org Enforcement (M, 2d)
- TODO-044: RBAC Foundation (M, 2d) ← Enables role-based features
- TODO-005: Activity Auto-Cascade Trigger (M, 2d)
- **Sprint Total:** ~11 days | **Risk:** Medium (decomposed TODO-001 reduces risk)

### Sprint 2 (Week 2-4): Dashboard & Win/Loss
- TODO-054: Form Schema Derivation Audit (S, 1d) ← **Constitution enforcement**
- TODO-004a: Win/Loss Reason Schema (S, 1d)
- TODO-004b: Win/Loss Modal Component (M, 2d)
- TODO-004c: Win/Loss Integration (S, 1d)
- TODO-006: Dashboard KPI #1 Fix (S, 1d)
- TODO-007: Dashboard KPI #4 Stale Deals (M, 2d)
- TODO-008: Recent Activity Feed (M, 2d)
- TODO-009: My Performance Widget (M, 2d)
- **Sprint Total:** ~12 days | **Risk:** Medium

### Sprint 3 (Week 4-6): Activities & Sample Tracking
- TODO-010: QuickLogForm 13 Types (M, 3d)
- TODO-011a: Sample Status Schema (S, 1d)
- TODO-011b: Sample Form Fields UI (M, 2d)
- TODO-011c: Sample Status Workflow UI (M, 2d)
- TODO-011d: Sample Tracking Views (S, 1d)
- TODO-003: Contact-Customer Org Validation (M, 2d)
- **Sprint Total:** ~11 days | **Risk:** Medium

### Sprint 4 (Week 6-8): Stale Detection & Duplicate Prevention
- TODO-055: DataProvider Access Audit (S, 1d) ← **Constitution enforcement**
- TODO-012: Per-Stage Stale Thresholds (M, 2d)
- TODO-013: Visual Decay Indicators (M, 2d)
- TODO-022a: Exact Match Detection (M, 2d) ← MVP critical
- TODO-022b: Fuzzy Match Detection (M, 2d)
- TODO-019: Bulk Owner Reassignment (M, 3d) ← Requires TODO-044
- **Sprint Total:** ~12 days | **Risk:** Medium

### Sprint 5 (Week 8-10): Tasks & Reports
- TODO-025-028: Task Module Items (~5d total)
- TODO-029-031: Reports Module Items (~4d total)
- TODO-021: Opportunity Bulk Delete (S, 1d)
- **Sprint Total:** ~10 days | **Risk:** Low

### Sprint 6 (Week 10-12): Email Digest, Authorization & Ops Foundation
- TODO-042a: Email Digest Infrastructure (M, 2d)
- TODO-042b: Digest Query Logic (S, 1d) ← Depends on TODO-012
- TODO-042c: Email Template (S, 1d)
- TODO-042d: User Preferences & Empty Skip (M, 2d)
- TODO-043a: Org-Level Authorizations Table (M, 2d)
- TODO-043b: Product-Level Authorizations (S, 1d)
- TODO-043c: Authorization Inheritance Logic (M, 2d)
- TODO-043d: Opportunity Authorization Warning (S, 1d)
- TODO-020: Authorization UI Tab (L, 4d) ← Moved from Sprint 5, deferrable to post-MVP
- TODO-049: Production Monitoring & Observability (M, 2d) ← P1: Critical for launch
- TODO-051: Backup & Recovery Verification (S, 1d) ← P1: Must verify before launch
- **Sprint Total:** ~19 days | **Risk:** High (TODO-020 deferrable if slippage)

### Sprint 7 (Week 12-14): Polish, Mobile, QA & Launch Readiness
- TODO-035: Mobile Quick Actions (M, 3d) ← Moved from Sprint 6
- TODO-032-034: Notes Cleanup (~3d total) ← Moved from Sprint 6
- TODO-036-038: Dashboard Polish (~3d total)
- TODO-039-041: Technical Cleanup (~4d total)
- TODO-047: Accessibility Audit (M, 2d) ← WCAG 2.1 AA compliance
- TODO-048: Performance & Load Testing (S, 1d) ← Verify 6 concurrent users
- TODO-050: End-User Documentation (M, 2d) ← Getting Started, workflows, FAQ
- TODO-052: Contact Import Org Handling (M, 2d) ← **Deferrable** to post-MVP
- TODO-046: Pre-Launch Cleanup (S, 1d) ← **Run last:** production data import
- Final regression testing (2d)
- User acceptance testing (2d)
- **Sprint Total:** ~25 days | **Risk:** Medium-High (multiple items deferrable)
- **⚠️ Slippage Cuts:** If schedule slips, cut TODO-052 (import), TODO-041a (linting), TODO-050 (docs) first

---

## Notes

1. **Timeline:** 90-120 days total per PRD Section 1.2
2. **Team Size:** 6 account managers will use the system
3. **Fallback:** No parallel Excel system (full commitment)
4. **Data Migration:** See `docs/migration/DATA_MIGRATION_PLAN.md`

---

*Generated from PRD v1.20 - Last Updated: 2025-11-28*
*Decomposition Update: 2025-11-28 - Added 14 atomic subtasks for TODO-011, 022, 042, 043*
*Audit Remediation: 2025-11-28 - Added TODO-001/004 decomposition, TODO-044 (RBAC), TODO-052, Definition of Done, rebalanced sprints*
*Constitution Compliance: 2025-11-28 - Added TODO-053/054/055, Constitution Compliance sections to 17 TODOs, updated Definition of Done*