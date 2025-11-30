# Dashboard Improvement Backlog

**Generated:** 2025-11-29
**Source:** dashboard-audit-summary.md
**Ticket Format:** Each ticket is <4h effort with acceptance criteria and test requirements

---

## Ticket Index

| Ticket | Title | Priority | Effort | Status |
|--------|-------|----------|--------|--------|
| DASH-001 | Fix KPI #1: Change from $ to Opportunity Count | P0 | 1h | Ready |
| DASH-002 | Add KPI #4: Stale Deals with Amber Styling | P0 | 2h | Ready |
| DASH-003 | Expand QuickLogForm to 13 Activity Types | P0 | 3h | Ready |
| DASH-004 | Add Sample Type to Activity Schema | P0 | 2h | Ready |
| DASH-005 | Create Sample Status Enum and Migration | P0 | 2h | Depends: DASH-004 |
| DASH-006 | Create ActivityTimeline Component (Phase 1) | P0 | 4h | Ready |
| DASH-007 | Create ActivityTimeline Component (Phase 2) | P1 | 4h | Depends: DASH-006 |
| DASH-008 | Consolidate Activity Schemas | P1 | 3h | Ready |
| DASH-009 | Add Per-Stage Stale Thresholds | P1 | 3h | Ready |
| DASH-010 | Make KPI Cards Clickable | P1 | 2h | Ready |
| DASH-011 | Add 4th KPI to Reports Overview | P1 | 2h | Ready |
| DASH-012 | Create Recent Activity Feed Widget | P1 | 4h | Ready |
| DASH-013 | Create My Performance Widget | P1 | 3h | Ready |
| DASH-014 | Add Activity Auto-Cascade Trigger | P1 | 2h | Ready |
| DASH-015 | Split QuickLogForm: Extract EntityCombobox | P1 | 4h | Ready |
| DASH-016 | Split QuickLogForm: Extract Hooks | P1 | 3h | Depends: DASH-015 |
| DASH-017 | Fix form.watch() Performance | P1 | 2h | Ready |
| DASH-018 | Add Column Tooltips to Pipeline Table | P2 | 1h | Ready |
| DASH-019 | Remove Orphaned Exports | P2 | 0.5h | Ready |
| DASH-020 | Implement Snooze Popover | P2 | 2h | Ready |
| DASH-021 | Add Task Follow-up Prompt Modal | P2 | 3h | Ready |
| DASH-022 | Add Visual Decay Borders | P2 | 2h | Ready |
| DASH-023 | Add Error Boundaries to Dashboard | P2 | 2h | Ready |

---

## P0 - Critical Tickets

### DASH-001: Fix KPI #1: Change from $ to Opportunity Count

**Priority:** P0 (Critical)
**Effort:** 1 hour
**Constitution Principle:** N/A (PRD alignment)

#### Description
KPI #1 currently shows "Total Pipeline" with a DollarSign icon and $ formatting. PRD Decision #5 states "No pricing/volume in MVP" and Decision #60 requires "Open Opportunities" count.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx`
- `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts`

#### Acceptance Criteria
- [ ] KPI #1 title changed from "Total Pipeline" to "Open Opportunities"
- [ ] Icon changed from DollarSign to Briefcase (or similar)
- [ ] Value shows count (integer), not currency
- [ ] No `$` formatting in display
- [ ] Subtitle shows "Active deals in pipeline"

#### Test Criteria
```typescript
// Unit test
it('displays opportunity count not dollar value', () => {
  render(<KPISummaryRow />);
  expect(screen.getByText('Open Opportunities')).toBeInTheDocument();
  expect(screen.queryByText('$')).not.toBeInTheDocument();
});
```

#### Implementation Notes
```typescript
// useKPIMetrics.ts - change query
const { data: opportunities } = useGetList('opportunities', {
  filter: { stage_not_in: ['closed_won', 'closed_lost'], deleted_at: null },
  pagination: { page: 1, perPage: 1 }, // Only need count
});

// KPISummaryRow.tsx - update config
const kpiConfigs = [
  {
    title: "Open Opportunities",
    value: metrics.openOpportunities, // was: metrics.totalPipeline
    icon: Briefcase, // was: DollarSign
    // Remove formatCurrency
  },
  // ...
];
```

---

### DASH-002: Add KPI #4: Stale Deals with Amber Styling

**Priority:** P0 (Critical)
**Effort:** 2 hours
**Constitution Principle:** N/A (PRD alignment)

#### Description
KPI #4 should show "Stale Deals" count with amber/warning styling when >0. Currently shows "Open Opportunities" which duplicates KPI #1 intent.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx`
- `src/atomic-crm/dashboard/v3/components/KPICard.tsx` (add variant prop)
- `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts`

#### Acceptance Criteria
- [ ] KPI #4 title is "Stale Deals"
- [ ] Icon is AlertTriangle
- [ ] Subtitle shows "Past stage SLA"
- [ ] Card has amber/warning background when value > 0
- [ ] Card has default background when value = 0
- [ ] Stale count uses per-stage thresholds (7/14/21 days)

#### Test Criteria
```typescript
it('shows warning variant when stale deals > 0', () => {
  mockUseKPIMetrics.mockReturnValue({ staleDeals: 5, ... });
  render(<KPISummaryRow />);
  expect(screen.getByText('Stale Deals')).toHaveClass('bg-warning');
});

it('shows default variant when stale deals = 0', () => {
  mockUseKPIMetrics.mockReturnValue({ staleDeals: 0, ... });
  render(<KPISummaryRow />);
  expect(screen.getByText('Stale Deals')).not.toHaveClass('bg-warning');
});
```

#### Implementation Notes
```typescript
// KPICard.tsx - add variant prop
interface KPICardProps {
  variant?: 'default' | 'warning' | 'destructive';
}

// Apply variant styling
<Card className={cn(
  "p-4",
  variant === 'warning' && 'bg-warning/10 border-warning',
  variant === 'destructive' && 'bg-destructive/10 border-destructive'
)}>
```

---

### DASH-003: Expand QuickLogForm to 13 Activity Types

**Priority:** P0 (Critical)
**Effort:** 3 hours
**Constitution Principle:** N/A (PRD alignment)

#### Description
QuickLogForm only exposes 5 activity types (Call, Email, Meeting, Follow-up, Note) but PRD Section 6.1 requires all 13 types for complete activity logging including sample tracking.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/validation/activitySchema.ts`
- `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

#### Acceptance Criteria
- [ ] All 13 activity types available in dropdown
- [ ] Types grouped by category (Communication, Meetings, Documentation, Sales, Samples)
- [ ] Sample type shows conditional sample_status field when selected
- [ ] Existing types still work (backward compatible)

#### Activity Types Required
```
Communication: call, email, check_in
Meetings: meeting, demo, site_visit
Documentation: proposal, contract_review, follow_up, note
Sales: trade_show, social
Samples: sample (NEW)
```

#### Test Criteria
```typescript
it('renders all 13 activity types in grouped dropdown', () => {
  render(<QuickLogForm />);
  fireEvent.click(screen.getByRole('combobox', { name: /type/i }));

  ACTIVITY_TYPES.forEach(type => {
    expect(screen.getByText(type.label)).toBeInTheDocument();
  });
});

it('shows sample status field when sample type selected', () => {
  render(<QuickLogForm />);
  selectActivityType('sample');
  expect(screen.getByLabelText(/sample status/i)).toBeInTheDocument();
});
```

---

### DASH-004: Add Sample Type to Activity Schema

**Priority:** P0 (Critical)
**Effort:** 2 hours
**Constitution Principle:** Principle 4 (Validation at API Boundary)

#### Description
The `sample` activity type is missing from the canonical activity schema at `src/atomic-crm/validation/activities.ts`. This blocks PRD Section 4.4 sample tracking.

#### Files to Modify
- `src/atomic-crm/validation/activities.ts`
- `supabase/migrations/YYYYMMDDHHMMSS_add_sample_activity_type.sql`

#### Acceptance Criteria
- [ ] `sample` added to `interactionTypeSchema` enum
- [ ] Database migration adds value to `interaction_type` enum
- [ ] Migration is idempotent (`IF NOT EXISTS` pattern)

#### Migration Template
```sql
-- Migration: add_sample_activity_type
-- Adds 'sample' to interaction_type enum

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'sample'
    AND enumtypid = 'interaction_type'::regtype
  ) THEN
    ALTER TYPE interaction_type ADD VALUE 'sample';
  END IF;
END
$$;
```

#### Test Criteria
```typescript
it('accepts sample as valid interaction type', () => {
  const result = interactionTypeSchema.safeParse('sample');
  expect(result.success).toBe(true);
});
```

---

### DASH-005: Create Sample Status Enum and Migration

**Priority:** P0 (Critical)
**Effort:** 2 hours
**Depends On:** DASH-004
**Constitution Principle:** Principle 4 (Validation at API Boundary)

#### Description
Sample activities need a `sample_status` field to track the workflow: Sent → Received → Feedback Pending → Feedback Received.

#### Files to Modify
- `src/atomic-crm/validation/activities.ts`
- `supabase/migrations/YYYYMMDDHHMMSS_add_sample_status.sql`

#### Acceptance Criteria
- [ ] `sampleStatusSchema` Zod enum created with 4 values
- [ ] `sample_status` field added to activity schema (nullable)
- [ ] Conditional validation: required when `type === 'sample'`
- [ ] Database enum and column created

#### Zod Schema
```typescript
export const sampleStatusSchema = z.enum([
  'sent',
  'received',
  'feedback_pending',
  'feedback_received'
]);

// In activitySchema, add conditional validation
sample_status: z.union([
  sampleStatusSchema,
  z.null()
]).refine((val, ctx) => {
  if (ctx.parent.type === 'sample' && !val) {
    return false;
  }
  return true;
}, { message: 'Sample status required for sample activities' })
```

#### Migration Template
```sql
-- Migration: add_sample_status
CREATE TYPE sample_status AS ENUM (
  'sent',
  'received',
  'feedback_pending',
  'feedback_received'
);

ALTER TABLE activities
ADD COLUMN sample_status sample_status;

COMMENT ON COLUMN activities.sample_status IS
  'Status tracking for sample activities: sent→received→feedback';
```

---

### DASH-006: Create ActivityTimeline Component (Phase 1)

**Priority:** P0 (Critical)
**Effort:** 4 hours
**Constitution Principle:** N/A (PRD alignment)

#### Description
Phase 1: Create the base ActivityTimeline component with chronological display of activities. This is the core CRM pattern (HubSpot/Salesforce) for viewing activity history.

#### Files to Create
- `src/atomic-crm/activities/components/ActivityTimeline.tsx`
- `src/atomic-crm/activities/components/ActivityTimelineCard.tsx`
- `src/atomic-crm/activities/hooks/useActivities.ts`

#### Acceptance Criteria
- [ ] Timeline renders activities in reverse chronological order
- [ ] Each activity shows: type icon, subject, date, creator
- [ ] Empty state shown when no activities
- [ ] Loading skeleton during fetch
- [ ] Accepts filter prop for entity filtering (contact_id, org_id, opp_id)

#### Component Interface
```typescript
interface ActivityTimelineProps {
  filter?: {
    contact_id?: string;
    organization_id?: string;
    opportunity_id?: string;
  };
  limit?: number; // Default 20
}
```

#### Test Criteria
```typescript
it('renders activities in reverse chronological order', () => {
  const activities = [
    { id: 1, activity_date: '2025-01-01' },
    { id: 2, activity_date: '2025-01-02' },
  ];
  render(<ActivityTimeline activities={activities} />);
  const cards = screen.getAllByRole('article');
  expect(cards[0]).toHaveTextContent('Jan 2');
  expect(cards[1]).toHaveTextContent('Jan 1');
});

it('shows empty state when no activities', () => {
  render(<ActivityTimeline activities={[]} />);
  expect(screen.getByText(/no activities/i)).toBeInTheDocument();
});
```

---

## P1 - High Priority Tickets

### DASH-007: Create ActivityTimeline Component (Phase 2)

**Priority:** P1 (High)
**Effort:** 4 hours
**Depends On:** DASH-006

#### Description
Phase 2: Add filtering, type-specific card rendering, and inline edit capability to ActivityTimeline.

#### Acceptance Criteria
- [ ] Multi-select filter by activity type
- [ ] Type-specific card styling (call icon green, email icon blue, etc.)
- [ ] Inline edit button on each card
- [ ] Click card to expand full details
- [ ] "Load more" pagination

---

### DASH-008: Consolidate Activity Schemas

**Priority:** P1 (High)
**Effort:** 3 hours
**Constitution Principle:** **Principle 4 (Validation at API Boundary)** - VIOLATION

#### Description
`src/atomic-crm/dashboard/v3/validation/activitySchema.ts` duplicates the canonical schema at `src/atomic-crm/validation/activities.ts`. This violates Constitution Principle 4.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` (update imports)
- `src/atomic-crm/validation/activities.ts` (add ACTIVITY_TYPE_GROUPS)
- DELETE: `src/atomic-crm/dashboard/v3/validation/activitySchema.ts`

#### Acceptance Criteria
- [ ] QuickLogForm imports from `@/atomic-crm/validation/activities`
- [ ] ACTIVITY_TYPE_GROUPS constant moved to canonical schema
- [ ] `v3/validation/activitySchema.ts` deleted
- [ ] All tests pass with unified schema

#### Test Criteria
```bash
# Verify no duplicate schema
[ ! -f src/atomic-crm/dashboard/v3/validation/activitySchema.ts ]

# All tests pass
npm run test:ci
```

---

### DASH-009: Add Per-Stage Stale Thresholds

**Priority:** P1 (High)
**Effort:** 3 hours
**Constitution Principle:** N/A (PRD alignment)

#### Description
Stale detection uses fixed 7-day threshold. PRD Section 6.3 requires variable thresholds by pipeline stage.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/hooks/useKPIMetrics.ts`
- `src/atomic-crm/reports/tabs/OverviewTab.tsx`
- `src/atomic-crm/constants/pipeline.ts` (create if needed)

#### Acceptance Criteria
- [ ] Thresholds defined per PRD Section 6.3:
  - new_lead: 7 days
  - initial_outreach: 14 days
  - sample_visit_offered: 14 days
  - feedback_logged: 21 days
  - demo_scheduled: 14 days
- [ ] Dashboard KPI uses variable thresholds
- [ ] Reports Overview uses same thresholds
- [ ] Thresholds exported as constant for consistency

#### Implementation
```typescript
// src/atomic-crm/constants/pipeline.ts
export const STAGE_STALE_THRESHOLDS: Record<string, number> = {
  new_lead: 7,
  initial_outreach: 14,
  sample_visit_offered: 14,
  feedback_logged: 21,
  demo_scheduled: 14,
};

export function isStale(stage: string, lastActivityDate: Date | null): boolean {
  if (!lastActivityDate) return true;
  const threshold = STAGE_STALE_THRESHOLDS[stage] ?? 14;
  return differenceInDays(new Date(), lastActivityDate) > threshold;
}
```

---

### DASH-010: Make KPI Cards Clickable

**Priority:** P1 (High)
**Effort:** 2 hours
**Constitution Principle:** N/A (UX alignment)

#### Description
KPI cards are static values. Industry standard (Salesforce/HubSpot) is clickable KPIs that navigate to filtered detail views.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/KPICard.tsx`
- `src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx`

#### Acceptance Criteria
- [ ] KPICard accepts optional `onClick` or `href` prop
- [ ] Cursor changes to pointer on hover when clickable
- [ ] Keyboard accessible (tabIndex, Enter/Space activation)
- [ ] KPI #1 (Open Opps) → `/opportunities?filter=active`
- [ ] KPI #2 (Overdue Tasks) → `/tasks?filter=overdue`
- [ ] KPI #3 (Activities) → `/reports?tab=weekly`
- [ ] KPI #4 (Stale Deals) → `/opportunities?filter=stale`

---

### DASH-011: Add 4th KPI to Reports Overview

**Priority:** P1 (High)
**Effort:** 2 hours
**Constitution Principle:** N/A (PRD alignment)

#### Description
Reports Overview tab has 3 KPIs but PRD Section 9.2.1 specifies 4. Add "Stale Deals" to match dashboard.

#### Files to Modify
- `src/atomic-crm/reports/tabs/OverviewTab.tsx`

#### Acceptance Criteria
- [ ] 4th KPI card added for "Stale Deals"
- [ ] Uses same styling/variant logic as dashboard KPI
- [ ] Uses per-stage thresholds from DASH-009

---

### DASH-012: Create Recent Activity Feed Widget

**Priority:** P1 (High)
**Effort:** 4 hours
**Constitution Principle:** N/A (PRD requirement MVP #16)

#### Description
PRD Section 9.2 and MVP #16 require a Recent Activity Feed showing team activities on the dashboard.

#### Files to Create
- `src/atomic-crm/dashboard/v3/components/ActivityFeedPanel.tsx`
- `src/atomic-crm/dashboard/v3/hooks/useTeamActivities.ts`

#### Acceptance Criteria
- [ ] Shows 10 most recent team activities
- [ ] Each item shows: avatar, type icon, subject, relative time
- [ ] Clicking item navigates to related record
- [ ] "View All" button routes to `/reports?tab=weekly`
- [ ] Empty state when no activities
- [ ] Added to PrincipalDashboardV3 layout

---

### DASH-013: Create My Performance Widget

**Priority:** P1 (High)
**Effort:** 3 hours
**Constitution Principle:** N/A (PRD requirement MVP #28)

#### Description
PRD Section 9.2 and MVP #28 require a "My Performance" widget showing personal metrics for the logged-in rep.

#### Files to Create
- `src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx`
- `src/atomic-crm/dashboard/v3/hooks/useMyPerformance.ts`

#### Acceptance Criteria
- [ ] Shows 4 personal metrics:
  - Activities This Week
  - Deals Moved (stage changes)
  - Tasks Completed
  - Open Opportunities
- [ ] Compares to previous week (trend arrows)
- [ ] Only shows data for current user
- [ ] Added to PrincipalDashboardV3 sidebar/layout

---

### DASH-014: Add Activity Auto-Cascade Trigger

**Priority:** P1 (High)
**Effort:** 2 hours
**Constitution Principle:** N/A (PRD requirement MVP #27)

#### Description
PRD Section 6.2 requires activities logged on an opportunity to automatically link to the opportunity's primary contact.

#### Files to Modify
- `supabase/migrations/YYYYMMDDHHMMSS_add_activity_cascade_trigger.sql`

#### Acceptance Criteria
- [ ] PostgreSQL trigger on activities INSERT
- [ ] When opportunity_id IS NOT NULL AND contact_id IS NULL:
  - Looks up opportunity's primary contact
  - Sets contact_id automatically
- [ ] Trigger is idempotent (CREATE OR REPLACE)
- [ ] Handles edge case: opportunity has no contacts

#### Migration
```sql
CREATE OR REPLACE FUNCTION auto_cascade_activity_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.opportunity_id IS NOT NULL AND NEW.contact_id IS NULL THEN
    SELECT oc.contact_id INTO NEW.contact_id
    FROM opportunity_contacts oc
    WHERE oc.opportunity_id = NEW.opportunity_id
      AND oc.is_primary = true
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS activity_auto_cascade ON activities;
CREATE TRIGGER activity_auto_cascade
  BEFORE INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION auto_cascade_activity_to_contact();
```

---

### DASH-015: Split QuickLogForm: Extract EntityCombobox

**Priority:** P1 (High)
**Effort:** 4 hours
**Constitution Principle:** **Principle 3 (Boy Scout Rule)**

#### Description
QuickLogForm.tsx is 1167 lines with 3 nearly identical combobox implementations. Extract reusable EntityCombobox component.

#### Files to Create
- `src/atomic-crm/dashboard/v3/components/EntityCombobox.tsx`

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

#### Acceptance Criteria
- [ ] EntityCombobox handles contact, org, opportunity selection
- [ ] Props: entityType, onSelect, filter, placeholder
- [ ] Debounced search built-in
- [ ] QuickLogForm uses EntityCombobox 3x
- [ ] QuickLogForm reduced by ~300 LOC

---

### DASH-016: Split QuickLogForm: Extract Hooks

**Priority:** P1 (High)
**Effort:** 3 hours
**Depends On:** DASH-015
**Constitution Principle:** **Principle 3 (Boy Scout Rule)**

#### Description
Extract embedded hooks and logic from QuickLogForm into dedicated files.

#### Files to Create
- `src/atomic-crm/dashboard/v3/hooks/useDebouncedSearch.ts`
- `src/atomic-crm/dashboard/v3/hooks/useActivityForm.ts`
- `src/atomic-crm/dashboard/v3/constants.ts`

#### Acceptance Criteria
- [ ] useDebouncedSearch extracted (currently lines 95-113)
- [ ] useActivityForm handles form state and submission
- [ ] Constants centralized (STALE_TIME_MS, etc.)
- [ ] QuickLogForm reduced to <400 LOC

---

### DASH-017: Fix form.watch() Performance

**Priority:** P1 (High)
**Effort:** 2 hours
**Constitution Principle:** Principle 1 (No Over-Engineering) - not violated but perf issue

#### Description
QuickLogForm has multiple `form.watch()` calls creating redundant subscriptions and re-renders on every keystroke.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

#### Acceptance Criteria
- [ ] Single `form.watch()` call with destructured return
- [ ] Draft persistence debounced (was: every keystroke)
- [ ] Verify render count reduced (React DevTools profiler)

#### Implementation
```typescript
// Before (6 subscriptions, re-renders on every field change)
const formValues = form.watch();
const selectedOpportunityId = form.watch("opportunityId");
const selectedContactId = form.watch("contactId");
// ...

// After (1 subscription, specific fields)
const watchedFields = form.watch([
  'opportunityId',
  'contactId',
  'organizationId',
  'activityType',
  'createFollowUp'
]);
const { opportunityId, contactId, organizationId, activityType, createFollowUp } =
  Object.fromEntries(watchedFields.map((v, i) => [FIELD_NAMES[i], v]));
```

---

## P2 - Medium Priority Tickets

### DASH-018: Add Column Tooltips to Pipeline Table

**Priority:** P2 (Medium)
**Effort:** 1 hour
**Constitution Principle:** N/A (UX polish)

#### Description
Pipeline table columns "This Week", "Last Week", "Momentum" lack explanatory tooltips per MVP #35.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`

#### Acceptance Criteria
- [ ] "This Week" tooltip: "Activities logged Mon-Sun of current week"
- [ ] "Last Week" tooltip: "Activities logged Mon-Sun of previous week"
- [ ] "Momentum" tooltip: "Based on activity trend over 14 days"
- [ ] Tooltips accessible via hover and focus

---

### DASH-019: Remove Orphaned Exports

**Priority:** P2 (Medium)
**Effort:** 0.5 hours
**Constitution Principle:** **Principle 3 (Boy Scout Rule)**

#### Description
TasksPanel, SnoozePopover, and TaskGroup are exported but unused (replaced by TasksKanbanPanel).

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/index.ts`

#### Acceptance Criteria
- [ ] Remove exports: TasksPanel, SnoozePopover, TaskGroup
- [ ] Keep files (may be used in tests) but mark deprecated
- [ ] No import errors after change

---

### DASH-020: Implement Snooze Popover

**Priority:** P2 (Medium)
**Effort:** 2 hours
**Constitution Principle:** N/A (PRD requirement MVP #37)

#### Description
Task snooze currently auto-snoozes 1 day. PRD requires popover with Tomorrow/Next Week/Custom Date options.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx`

#### Acceptance Criteria
- [ ] Snooze button opens popover (not immediate action)
- [ ] Options: Tomorrow (9 AM), Next Week (Monday 9 AM), Custom Date
- [ ] Custom Date shows date picker
- [ ] Snooze updates task.due_date

---

### DASH-021: Add Task Follow-up Prompt Modal

**Priority:** P2 (Medium)
**Effort:** 3 hours
**Constitution Principle:** N/A (PRD requirement MVP #32)

#### Description
When completing a task, prompt user to optionally create a follow-up task.

#### Files to Create
- `src/atomic-crm/dashboard/v3/components/TaskFollowUpModal.tsx`

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx`

#### Acceptance Criteria
- [ ] Modal appears after task marked complete
- [ ] Options: "Create Follow-up" or "Done"
- [ ] Follow-up form has: subject (prefilled), due date, notes
- [ ] Modal can be skipped with "Don't show again" checkbox

---

### DASH-022: Add Visual Decay Borders

**Priority:** P2 (Medium)
**Effort:** 2 hours
**Constitution Principle:** N/A (PRD requirement MVP #26)

#### Description
Pipeline table rows should have green/yellow/red left borders based on momentum for deals in sample_visit_offered stage.

#### Files to Modify
- `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`

#### Acceptance Criteria
- [ ] Rows in `sample_visit_offered` stage get colored border
- [ ] Green: momentum = increasing
- [ ] Yellow: momentum = steady
- [ ] Red: momentum = decreasing or stale
- [ ] Uses semantic color variables (--success, --warning, --destructive)

---

### DASH-023: Add Error Boundaries to Dashboard

**Priority:** P2 (Medium)
**Effort:** 2 hours
**Constitution Principle:** Principle 1 (Fail fast, but isolate failure blast radius)

#### Description
Add granular error boundaries so failures in TasksKanbanPanel or QuickLogForm don't crash entire dashboard.

#### Files to Create
- `src/atomic-crm/dashboard/v3/components/ErrorBoundary.tsx` (reusable)

#### Files to Modify
- `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`

#### Acceptance Criteria
- [ ] TasksKanbanPanel wrapped in error boundary
- [ ] QuickLogForm wrapped in error boundary
- [ ] Error state shows "Something went wrong" + retry button
- [ ] Errors still reported to Sentry

---

## Implementation Notes

### File Naming Conventions
- Components: PascalCase (e.g., `ActivityTimeline.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useActivities.ts`)
- Migrations: `YYYYMMDDHHMMSS_description.sql`

### Testing Requirements
All tickets require:
1. Unit tests for new components/hooks
2. Integration test if touching data layer
3. Manual QA verification before PR

### PR Guidelines
- Each ticket = 1 PR
- PR title: `DASH-XXX: <ticket title>`
- Link to this backlog in PR description
- Request review from team member

---

*Backlog generated from dashboard-audit-summary.md findings.*
*Total tickets: 23 | P0: 6 | P1: 11 | P2: 6*
*Estimated total effort: 55 hours*
