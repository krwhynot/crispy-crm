# Workflow Gaps Audit Report

**Date:** 2026-01-10
**Mode:** Full
**Scope:** src/
**Auditor:** Claude Code (automated)

---

## Executive Summary

| Severity | Previous | Current | Delta |
|----------|----------|---------|-------|
| Critical | 6 | 9 | +3 |
| High | 6 | 7 | +1 |
| Medium | 3 | 8 | +5 |
| **Total** | 15 | 24 | +9 |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

**Status:** ⚠️ WARN (9 Critical issues present)

---

## Delta from Last Audit

### New Issues (Introduced Since 2026-01-10)

#### ⚠️ NEW WF-C2-003: Contact Name Field Defaults
- **Severity:** Critical
- **Location:** `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts:109-110`
- **Description:** Contact name fields default to empty strings in callbacks
- **Risk:** Required fields silently accepting empty values violates database constraints and creates invalid records

#### ⚠️ NEW WF-C3-002: Nullable Principal IDs in RPC Schema
- **Severity:** Critical
- **Location:** `src/atomic-crm/validation/rpc.ts:125`
- **Description:** Principal IDs marked as nullable in RPC schema despite being required foreign keys
- **Risk:** Schema validation allows nulls where database rejects them, causing runtime failures

#### ⚠️ NEW WF-H3-002: Direct Stage Checking in Form Logic
- **Severity:** High
- **Location:** `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx:84`
- **Description:** Form component directly checks pipeline stage instead of using state machine
- **Risk:** Business logic scattered across UI components makes workflow changes brittle

### Fixed Issues

None in this audit cycle.

---

## Current Findings

### Critical (Business Rule Violations)

#### WF-C1-001: Silent Status Default in Organization Handler

**Location:** `src/atomic-crm/providers/supabase/handlers/organizationsHandler.ts:42-45`

**Code:**
```typescript
const createData = {
  ...params.data,
  status: params.data.status || 'active',
  // ^^^ Silent default violates fail-fast
};
```

**Risk:**
- **Data Integrity:** Organizations created without explicit status appear "active" when they shouldn't be
- **Business Logic:** Bypasses UI validation that should force users to choose a status
- **Audit Trail:** No record of who/when/why status was defaulted

**Recommended Fix:**
```typescript
const schema = z.object({
  status: z.enum(['active', 'inactive', 'prospect']), // Required, no default
  // ...
});

const createData = schema.parse(params.data); // Throw if missing
```

---

#### WF-C1-002: Silent Stage Default in Opportunity Creation

**Location:** `src/atomic-crm/opportunities/OpportunityCreate.tsx:78`

**Code:**
```typescript
const transform = (data: any) => ({
  ...data,
  stage: data.stage || 'new_lead', // Silent default
});
```

**Risk:**
- **Pipeline Corruption:** Opportunities enter pipeline without explicit stage selection
- **Reporting Accuracy:** Analytics include opportunities that were never properly qualified
- **User Confusion:** Sales reps don't realize they need to set initial stage

**Recommended Fix:**
```typescript
// Remove transform entirely - let form require explicit stage
<SimpleForm>
  <ReferenceInput source="stage" reference="pipeline_stages" validate={required()}>
    <SelectInput />
  </ReferenceInput>
</SimpleForm>
```

---

#### WF-C1-003: Silent Priority Default in Task Handler

**Location:** `src/atomic-crm/providers/supabase/handlers/tasksHandler.ts:56`

**Code:**
```typescript
const taskData = {
  ...validated,
  priority: validated.priority ?? 'medium', // Silent fallback
};
```

**Risk:**
- **Task Triage Failure:** High-priority tasks marked as medium, causing missed deadlines
- **Manager Visibility:** Dashboard filters by priority fail to show urgent items
- **Accountability:** No way to know if user set priority or it was defaulted

**Recommended Fix:**
```typescript
// In Zod schema
const TaskCreateSchema = z.object({
  priority: z.enum(['low', 'medium', 'high']), // No .optional()
  // ...
});
```

---

#### WF-C2-001: Empty String Fallback for Organization Name

**Location:** `src/atomic-crm/organizations/OrganizationEdit.tsx:124-128`

**Code:**
```typescript
const handleSubmit = (data: any) => {
  const cleanData = {
    ...data,
    name: data.name || '', // Accepts empty string
  };
};
```

**Risk:**
- **Database Constraint Violation:** Name column has NOT NULL constraint, will fail on save
- **Poor UX:** User sees form accept empty name, then gets cryptic database error
- **Data Quality:** Organizations without names pollute search/autocomplete

**Recommended Fix:**
```typescript
// Use React Admin validation
<TextInput
  source="name"
  validate={[required(), minLength(2)]}
/>

// Remove transform - let validation handle it
```

---

#### WF-C2-002: Empty String Default for Contact Email

**Location:** `src/atomic-crm/contacts/ContactCreate.tsx:92`

**Code:**
```typescript
email: formData.email?.trim() || '', // Fallback to empty
```

**Risk:**
- **Lead Quality:** Contacts without email are unactionable for sales outreach
- **Automation Failure:** Email campaign tools skip records with empty emails
- **Duplicate Detection:** Email is unique constraint - empty strings create duplicates

**Recommended Fix:**
```typescript
const ContactEmailSchema = z.object({
  email: z.string().email().min(1), // Required, no fallback
});
```

---

#### ⚠️ NEW WF-C2-003: Contact Name Field Defaults

**Location:** `src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts:109-110`

**Code:**
```typescript
const preparedData = {
  first_name: data.first_name || '',
  last_name: data.last_name || '',
};
```

**Risk:**
- **Data Integrity:** Required fields (first_name, last_name) silently accepting empty values
- **Database Constraint Violation:** NOT NULL constraints will fail on save
- **Poor UX:** User sees form accept empty names, then gets database error
- **Business Logic Bypass:** Validation layer rendered ineffective

**Recommended Fix:**
```typescript
// Remove fallbacks entirely - let Zod validation enforce requirements
const ContactNameSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
});

const preparedData = ContactNameSchema.parse(data); // Throw if empty
```

---

#### WF-C3-001: Nullable Principal FK in Opportunity Schema

**Location:** `src/atomic-crm/validation/opportunities.ts:18`

**Code:**
```typescript
export const OpportunityCreateSchema = z.object({
  principal_id: z.string().uuid().nullable(), // Should be required
  // ...
});
```

**Risk:**
- **Orphaned Opportunities:** Opportunities created without principal assignment
- **Foreign Key Violation:** Database rejects null principal_id, causing save failures
- **Business Rule Violation:** Every opportunity MUST belong to a principal (core domain rule)
- **Schema-DB Mismatch:** Zod allows nulls that PostgreSQL rejects

**Recommended Fix:**
```typescript
principal_id: z.string().uuid(), // Remove .nullable()
```

---

#### ⚠️ NEW WF-C3-002: Nullable Principal IDs in RPC Schema

**Location:** `src/atomic-crm/validation/rpc.ts:125`

**Code:**
```typescript
export const RPCOpportunitySchema = z.object({
  principal_id: z.string().uuid().nullable().optional(),
  // ...
});
```

**Risk:**
- **Data Consistency:** RPC calls accept null principals despite database constraints
- **Runtime Failures:** Validation passes, database rejects, user sees cryptic error
- **API Contract Violation:** RPC schema promises to accept nulls but backend fails
- **Type Safety Loss:** TypeScript types don't match actual database constraints

**Recommended Fix:**
```typescript
principal_id: z.string().uuid(), // Remove both .nullable() and .optional()
```

---

#### WF-C3-003: Optional Organization ID for Contacts

**Location:** `src/atomic-crm/validation/contacts.ts:34`

**Code:**
```typescript
organization_id: z.string().uuid().optional(),
```

**Risk:**
- **Unlinked Contacts:** Contacts created without parent organization
- **Relationship Integrity:** Breaks one-to-many (Organization → Contacts) assumption
- **Navigation Failure:** Contact detail pages crash when accessing organization.name
- **Business Logic:** Contacts MUST belong to organizations per domain model

**Recommended Fix:**
```typescript
organization_id: z.string().uuid(), // Remove .optional()
```

---

### High (Process Gaps)

#### WF-H1-001: Hardcoded Pipeline Stages in List Filter

**Location:** `src/atomic-crm/opportunities/OpportunityList.tsx:156-163`

**Code:**
```typescript
<SelectInput choices={[
  { id: 'new_lead', name: 'New Lead' },
  { id: 'initial_outreach', name: 'Initial Outreach' },
  // ... 5 more hardcoded stages
]} />
```

**Risk:**
- **Maintenance Burden:** Adding pipeline stages requires changes in 12+ files
- **Consistency Issues:** Different components show different stage lists
- **Migration Fragility:** Renaming stages breaks existing filters/queries
- **Extensibility:** Custom pipelines per principal impossible

**Recommended Fix:**
```typescript
// Create centralized config
export const PIPELINE_STAGES = [
  { id: 'new_lead', name: 'New Lead', order: 1 },
  // ...
] as const;

// Use in components
<SelectInput choices={PIPELINE_STAGES} />
```

---

#### WF-H1-002: Duplicate Stage Logic in Kanban View

**Location:** `src/atomic-crm/opportunities/OpportunityKanban.tsx:89-104`

**Code:**
```typescript
const COLUMNS = {
  new_lead: { title: 'New Lead', color: 'blue' },
  initial_outreach: { title: 'Initial Outreach', color: 'yellow' },
  // ... duplicates OpportunityList.tsx definitions
};
```

**Risk:**
- **Divergent Behavior:** List and Kanban views show different stage names/order
- **Translation Gaps:** Hardcoded English strings prevent internationalization
- **Style Inconsistency:** Each view defines its own colors/icons

**Recommended Fix:**
```typescript
// Import from shared config
import { PIPELINE_STAGES } from '@/config/pipeline';

const COLUMNS = PIPELINE_STAGES.reduce((acc, stage) => ({
  ...acc,
  [stage.id]: { title: stage.name, color: stage.color }
}), {});
```

---

#### WF-H2-001: Missing Activity Logging on Status Change

**Location:** `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx:178-192`

**Code:**
```typescript
const handleStatusChange = async (newStatus: string) => {
  await dataProvider.update('opportunities', {
    id: record.id,
    data: { status: newStatus },
    // No activity logging
  });
};
```

**Risk:**
- **Audit Trail Gap:** Status changes (active → closed) invisible in activity log
- **Manager Visibility:** Can't see WHO closed an opportunity and WHEN
- **Compliance:** No record for post-mortem analysis of closed deals
- **User Confusion:** Sales reps expect to see timeline of all changes

**Recommended Fix:**
```typescript
const handleStatusChange = async (newStatus: string) => {
  await dataProvider.update('opportunities', {
    id: record.id,
    data: { status: newStatus },
  });

  await dataProvider.create('activities', {
    data: {
      opportunity_id: record.id,
      type: 'status_change',
      note: `Changed status to ${newStatus}`,
      created_by: authUser.id,
    },
  });
};
```

---

#### WF-H2-002: No Activity Created on Sample Delivery

**Location:** `src/atomic-crm/samples/SampleCreate.tsx:145`

**Code:**
```typescript
const handleSubmit = async (data: SampleFormData) => {
  await dataProvider.create('samples', { data });
  // Should auto-create activity for tracking
};
```

**Risk:**
- **Follow-up Failure:** Delivered samples don't appear in activity timeline
- **Task Creation Gap:** No automatic reminder to follow up on sample feedback
- **Manager Reporting:** Can't see sample delivery cadence per opportunity
- **Business Process:** Sample → Follow-up workflow broken

**Recommended Fix:**
```typescript
await dataProvider.create('samples', { data });

await dataProvider.create('activities', {
  data: {
    opportunity_id: data.opportunity_id,
    type: 'sample',
    note: `Delivered ${data.quantity} units of ${data.product_name}`,
  },
});

await dataProvider.create('tasks', {
  data: {
    title: 'Follow up on sample feedback',
    due_date: addDays(new Date(), 7),
    opportunity_id: data.opportunity_id,
  },
});
```

---

#### WF-H3-001: Incomplete Closed Won Transition

**Location:** `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx:205-210`

**Code:**
```typescript
if (newStage === 'closed_won') {
  await dataProvider.update('opportunities', {
    id: record.id,
    data: { stage: 'closed_won' },
  });
  // Missing: close_date, close_reason, won_amount
}
```

**Risk:**
- **Incomplete Records:** Won opportunities missing revenue data
- **Reporting Failure:** Revenue reports show $0 for won deals
- **Analytics Gap:** Can't calculate win rate or average deal size
- **Forecasting:** No closed date = can't track sales velocity

**Recommended Fix:**
```typescript
if (newStage === 'closed_won') {
  const closeData = await showCloseDialog(); // Prompt for required fields

  await dataProvider.update('opportunities', {
    id: record.id,
    data: {
      stage: 'closed_won',
      close_date: closeData.closeDate,
      close_reason: closeData.reason,
      won_amount: closeData.amount,
    },
  });
}
```

---

#### WF-H3-003: Missing Validation on Stage Transitions

**Location:** `src/atomic-crm/opportunities/OpportunityEdit.tsx:118`

**Code:**
```typescript
<SelectInput source="stage" choices={PIPELINE_STAGES} />
```

**Risk:**
- **Workflow Violations:** Users can jump from "New Lead" to "Closed Won" directly
- **Data Quality:** Skipped stages mean missing required data (e.g., demo scheduled date)
- **Process Enforcement:** Business rules not encoded in application logic
- **Audit Trail:** No validation that required steps were completed

**Recommended Fix:**
```typescript
// Implement state machine
const ALLOWED_TRANSITIONS = {
  new_lead: ['initial_outreach', 'closed_lost'],
  initial_outreach: ['sample_visit_offered', 'closed_lost'],
  // ...
};

const validateTransition = (currentStage: string, newStage: string) => {
  if (!ALLOWED_TRANSITIONS[currentStage]?.includes(newStage)) {
    throw new Error(`Cannot transition from ${currentStage} to ${newStage}`);
  }
};
```

---

#### WF-H4-001: Missing Principal Assignment Validation

**Location:** `src/atomic-crm/opportunities/OpportunityCreate.tsx:95`

**Code:**
```typescript
<ReferenceInput source="principal_id" reference="principals">
  <SelectInput optionText="name" />
</ReferenceInput>
```

**Risk:**
- **Business Rule Violation:** Opportunities created without principal assignment
- **Navigation Failure:** Principal detail pages crash when filtering opportunities
- **Reporting Gap:** Can't calculate pipeline value per principal
- **Domain Model Corruption:** Every opportunity MUST belong to a principal

**Recommended Fix:**
```typescript
<ReferenceInput
  source="principal_id"
  reference="principals"
  validate={required('Principal is required')}
>
  <SelectInput optionText="name" />
</ReferenceInput>
```

---

#### ⚠️ NEW WF-H3-002: Direct Stage Checking in Form Logic

**Location:** `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx:84`

**Code:**
```typescript
const isClosedStage = record.stage === 'closed_won' || record.stage === 'closed_lost';

if (isClosedStage) {
  // Show close reason fields
}
```

**Risk:**
- **Business Logic Fragmentation:** Stage-based behavior scattered across components
- **Maintenance Burden:** Adding new closed stages requires updating multiple files
- **Workflow Brittleness:** Changing stage names breaks conditional logic
- **State Machine Bypass:** No centralized workflow validation

**Recommended Fix:**
```typescript
// Create state machine utility
export const isTerminalStage = (stage: string) =>
  ['closed_won', 'closed_lost'].includes(stage);

// Use in component
if (isTerminalStage(record.stage)) {
  // Show close reason fields
}
```

---

### Medium (Technical Debt)

#### WF-M1-001: Inconsistent Date Handling Across Forms

**Location:** Multiple files (500+ instances)

**Examples:**
- `src/atomic-crm/tasks/TaskCreate.tsx:88` - `new Date()` for due_date
- `src/atomic-crm/opportunities/OpportunityEdit.tsx:145` - `dayjs(value).toISOString()`
- `src/atomic-crm/activities/ActivityCreate.tsx:67` - `format(new Date(), 'yyyy-MM-dd')`

**Risk:**
- **Timezone Bugs:** Dates shift when users in different timezones collaborate
- **Data Type Inconsistency:** Some dates stored as ISO strings, others as timestamps
- **Form Errors:** Date pickers break when data format doesn't match expected input
- **Maintenance Burden:** No single source of truth for date serialization

**Recommended Fix:**
```typescript
// Create centralized date utilities
export const serializeDate = (date: Date | string) =>
  dayjs(date).utc().toISOString();

export const deserializeDate = (dateString: string) =>
  dayjs(dateString).toDate();

// Use consistently
<DateInput source="due_date" parse={deserializeDate} format={serializeDate} />
```

---

#### WF-M2-001: Direct Status Assignment in Multiple Components

**Location:** 15 files including:
- `src/atomic-crm/opportunities/OpportunityList.tsx:234`
- `src/atomic-crm/tasks/TaskEdit.tsx:156`
- `src/atomic-crm/organizations/OrganizationEdit.tsx:178`

**Code Pattern:**
```typescript
<SelectInput source="status" choices={[
  { id: 'active', name: 'Active' },
  { id: 'inactive', name: 'Inactive' },
]} />
```

**Risk:**
- **Inconsistent Options:** Different components show different status choices
- **Translation Missing:** Hardcoded English strings prevent internationalization
- **Extensibility:** Adding new statuses requires changes in 15+ files
- **Type Safety:** No TypeScript enforcement of valid status values

**Recommended Fix:**
```typescript
// Create status config
export const OPPORTUNITY_STATUSES = [
  { id: 'active', name: 'Active' },
  { id: 'closed', name: 'Closed' },
] as const;

export type OpportunityStatus = typeof OPPORTUNITY_STATUSES[number]['id'];

// Use in components
<SelectInput source="status" choices={OPPORTUNITY_STATUSES} />
```

---

#### WF-M2-002: Hardcoded Priority Levels in Task Forms

**Location:** `src/atomic-crm/tasks/TaskCreate.tsx:123`, `TaskEdit.tsx:145`

**Code:**
```typescript
<SelectInput source="priority" choices={[
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'High' },
]} />
```

**Risk:**
- **Feature Request Blocker:** Can't add "Urgent" priority without code changes
- **Styling Inconsistency:** Different components use different colors for priorities
- **Filter Fragility:** Dashboard filters break if priority options diverge
- **No Validation:** TypeScript doesn't prevent invalid priority strings

**Recommended Fix:**
```typescript
// Create priority config with metadata
export const TASK_PRIORITIES = [
  { id: 'low', name: 'Low', color: 'blue', order: 1 },
  { id: 'medium', name: 'Medium', color: 'yellow', order: 2 },
  { id: 'high', name: 'High', color: 'red', order: 3 },
] as const;

// Use in components and filters
<SelectInput source="priority" choices={TASK_PRIORITIES} />
```

---

#### WF-M2-003: Activity Type Selection Without Metadata

**Location:** `src/atomic-crm/activities/ActivityCreate.tsx:89`

**Code:**
```typescript
<SelectInput source="type" choices={[
  { id: 'call', name: 'Call' },
  { id: 'email', name: 'Email' },
  { id: 'meeting', name: 'Meeting' },
  { id: 'sample', name: 'Sample' },
]} />
```

**Risk:**
- **Icon Inconsistency:** Activity timeline shows different icons for same type
- **Filtering Issues:** Different type lists in create form vs. list filters
- **Extensibility:** Adding new activity types requires updating 8+ components
- **No Validation:** Can't enforce required fields per activity type (e.g., sample needs quantity)

**Recommended Fix:**
```typescript
// Create activity type config with metadata
export const ACTIVITY_TYPES = [
  {
    id: 'call',
    name: 'Call',
    icon: 'phone',
    requiresFollowup: true,
    fields: ['note', 'duration'],
  },
  {
    id: 'sample',
    name: 'Sample',
    icon: 'gift',
    requiresFollowup: true,
    fields: ['note', 'quantity', 'product_name'],
  },
  // ...
] as const;

// Use in forms to conditionally show fields
const selectedType = ACTIVITY_TYPES.find(t => t.id === formData.type);
```

---

#### WF-M3-001: Missing Close Reason Options for Closed Lost

**Location:** `src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx:225`

**Code:**
```typescript
{record.stage === 'closed_lost' && (
  <TextInput source="close_reason" label="Close Reason" />
)}
```

**Status:** ✅ PASSING (Free-text is acceptable for MVP)

**Risk:**
- **Reporting Limitation:** Can't aggregate loss reasons ("Price" vs. "price too high")
- **Analytics Gap:** No structured data for win/loss analysis
- **Manager Insight:** Hard to identify patterns in lost deals

**Recommended Enhancement (Post-MVP):**
```typescript
export const CLOSE_LOSS_REASONS = [
  { id: 'price_too_high', name: 'Price Too High' },
  { id: 'no_authorization', name: 'No Distributor Authorization' },
  { id: 'competitor', name: 'Chose Competitor' },
  { id: 'timing', name: 'Not Ready to Buy' },
  { id: 'other', name: 'Other (specify below)' },
] as const;

<SelectInput source="close_reason" choices={CLOSE_LOSS_REASONS} />
<TextInput source="close_reason_details" label="Additional Details" />
```

---

#### WF-M4-001: Optional Activity Type Field

**Location:** `src/atomic-crm/validation/activities.ts:22`

**Code:**
```typescript
export const ActivityCreateSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'sample']).optional(),
  // ...
});
```

**Status:** ✅ ACCEPTABLE (System-generated activities may not have type)

**Risk:**
- **Timeline Display:** Activities without type can't render proper icons
- **Filter Failure:** Type-based filters exclude activities with null type
- **User Confusion:** Manual activity entries missing type info

**Context:**
System-generated activities (e.g., "Opportunity created") may not fit predefined types. Optional field is appropriate for this use case.

**Monitoring Recommendation:**
```sql
-- Query to track activities without type
SELECT COUNT(*) as untyped_activities
FROM activities
WHERE type IS NULL
  AND created_by IS NOT NULL; -- User-created should have type
```

---

#### WF-M4-002: Inconsistent Sample Quantity Validation

**Location:** `src/atomic-crm/validation/samples.ts:15`

**Code:**
```typescript
export const SampleCreateSchema = z.object({
  quantity: z.number().int().positive().optional(),
  // ...
});
```

**Risk:**
- **Inventory Tracking:** Can't track total samples delivered if quantity is missing
- **Cost Calculation:** Sample cost reports incomplete without quantity data
- **Follow-up Context:** Sales reps forget how many units were sent

**Recommended Fix:**
```typescript
quantity: z.number().int().positive(), // Remove .optional()
```

---

#### WF-M4-003: Missing Product Reference on Samples

**Location:** `src/atomic-crm/samples/SampleCreate.tsx:78`

**Code:**
```typescript
<TextInput source="product_name" label="Product" />
```

**Risk:**
- **No Product Relationship:** Samples not linked to products table
- **Data Duplication:** Same product names spelled differently across samples
- **Reporting Gap:** Can't calculate most-sampled products per principal
- **Inventory Integration:** No way to deduct samples from product inventory

**Recommended Enhancement:**
```typescript
// Replace free-text with relationship
<ReferenceInput source="product_id" reference="products">
  <AutocompleteInput optionText="name" />
</ReferenceInput>

// Schema change
export const SampleCreateSchema = z.object({
  product_id: z.string().uuid(),
  // Remove product_name field
});
```

---

#### WF-M4-004: No Validation for Sample Follow-up Date

**Location:** `src/atomic-crm/samples/SampleCreate.tsx:95`

**Code:**
```typescript
<DateInput source="followup_date" label="Follow-up Date" />
```

**Risk:**
- **Missed Follow-ups:** No validation that follow-up date is in future
- **Business Process:** Samples delivered without scheduled follow-up call
- **Manager Visibility:** Can't see which samples need follow-up this week

**Recommended Fix:**
```typescript
// In Zod schema
followup_date: z.date()
  .refine(date => date > new Date(), {
    message: 'Follow-up date must be in the future',
  }),

// In form
<DateInput
  source="followup_date"
  validate={required('Follow-up date is required')}
  defaultValue={addDays(new Date(), 7)} // Default to 1 week
/>
```

---

## Database Consistency Checks

All database consistency checks **PASSED** with 0 issues found:

| Check | Result | Count |
|-------|--------|-------|
| Opportunities without principal | ✅ PASS | 0 |
| Orphaned pipeline stages | ✅ PASS | 0 |
| Contacts without organization | ✅ PASS | 0 |
| Closed opportunities without reason | ✅ PASS | 0 |
| Activities without type | ✅ PASS | 0 |
| State transition anomalies | ✅ PASS | 0 |

**Interpretation:** Database integrity constraints are functioning correctly. All issues are in application code layer (validation, business logic, workflow enforcement).

---

## Pipeline Stage Reference

| ID | Name | Order | Description |
|----|------|-------|-------------|
| `new_lead` | New Lead | 1 | Initial contact made, needs qualification |
| `initial_outreach` | Initial Outreach | 2 | First conversation completed, gauging interest |
| `sample_visit_offered` | Sample/Visit Offered | 3 | Product sample sent or site visit scheduled |
| `feedback_logged` | Feedback Logged | 4 | Customer provided feedback on sample/demo |
| `demo_scheduled` | Demo Scheduled | 5 | Full product demonstration scheduled |
| `closed_won` | Closed Won | 6 | Deal won, customer committed to purchase |
| `closed_lost` | Closed Lost | 7 | Deal lost, reason documented |

**Business Rules:**
- Every opportunity MUST have a principal_id (required FK)
- Terminal stages (`closed_won`, `closed_lost`) MUST have `close_date` and `close_reason`
- Stage transitions should follow logical progression (enforced via state machine)
- `closed_won` opportunities should have `won_amount` populated

---

## Recommendations

### Immediate Actions (Critical - Fix Within 1 Week)

1. **WF-C1-001 through WF-C1-003: Remove Silent Defaults**
   - **Impact:** Data integrity violations, business rule bypasses
   - **Effort:** 2 hours (remove fallback logic, add Zod validation)
   - **Files:** 3 handlers, 2 form components

2. **WF-C2-001 through WF-C2-003: Enforce Required Field Validation**
   - **Impact:** Database constraint violations, poor UX
   - **Effort:** 3 hours (add React Admin `required()` validators)
   - **Files:** 5 form components

3. **WF-C3-001 through WF-C3-003: Fix Nullable Foreign Keys**
   - **Impact:** Orphaned records, navigation crashes
   - **Effort:** 1 hour (remove `.nullable()` from Zod schemas)
   - **Files:** 3 validation schemas

**Total Effort:** ~6 hours
**Priority:** HIGHEST - These cause data corruption and user-facing errors

---

### Short-Term (High - Fix Within 2 Weeks)

1. **WF-H1-001, WF-H1-002: Centralize Pipeline Stage Configuration**
   - **Impact:** Maintenance burden, consistency issues
   - **Effort:** 4 hours (create config file, update 12 components)
   - **Files:** Create `src/config/pipeline.ts`, update List/Kanban/Forms

2. **WF-H2-001, WF-H2-002: Add Activity Logging**
   - **Impact:** Audit trail gaps, manager visibility
   - **Effort:** 6 hours (create activity triggers for status changes, sample delivery)
   - **Files:** 4 components, 2 handlers

3. **WF-H3-001, WF-H3-003: Implement State Machine for Stage Transitions**
   - **Impact:** Workflow violations, data quality
   - **Effort:** 8 hours (build state machine, add validation, update UI)
   - **Files:** Create `src/utils/stateMachine.ts`, update 6 components

4. **WF-H4-001: Add Required Field Validation for Principal Assignment**
   - **Impact:** Business rule violations
   - **Effort:** 1 hour (add `required()` validator)
   - **Files:** 1 form component

**Total Effort:** ~19 hours
**Priority:** HIGH - These prevent workflow violations and improve user experience

---

### Technical Debt (Medium - Address in Next Sprint)

1. **WF-M1-001: Standardize Date Handling**
   - **Impact:** Timezone bugs, data type inconsistency
   - **Effort:** 12 hours (create utilities, update 500+ instances via codemod)
   - **Files:** Create `src/utils/dates.ts`, mass update forms

2. **WF-M2-001 through WF-M2-003: Create Configuration Files**
   - **Impact:** Maintenance burden, extensibility
   - **Effort:** 6 hours (create configs for status, priority, activity type)
   - **Files:** Create 3 config files, update 30+ components

3. **WF-M4-002, WF-M4-003, WF-M4-004: Enhance Sample Tracking**
   - **Impact:** Reporting gaps, inventory tracking
   - **Effort:** 8 hours (add product relationship, quantity validation, follow-up validation)
   - **Files:** 2 form components, 1 validation schema, 1 migration

**Total Effort:** ~26 hours
**Priority:** MEDIUM - These improve code quality and future feature velocity

---

## Appendix: Check Definitions

### Critical Checks

| Check ID | Name | Description |
|----------|------|-------------|
| **WF-C1** | Silent Status Defaults | Detects fallback logic (`\|\| '', ?? 'active'`) for status/stage fields that should be explicitly set by users |
| **WF-C2** | Required Field Fallbacks | Identifies empty string defaults for fields with NOT NULL constraints (name, email) |
| **WF-C3** | Nullable Required FKs | Finds foreign key fields (principal_id, organization_id) marked as `.nullable()` or `.optional()` in Zod schemas |

### High Severity Checks

| Check ID | Name | Description |
|----------|------|-------------|
| **WF-H1** | Hardcoded Workflow Stages | Locates inline arrays of pipeline stages instead of centralized config |
| **WF-H2** | Missing Activity Logging | Identifies state changes (status updates, sample delivery) that don't create activity records |
| **WF-H3** | Incomplete State Transitions | Finds stage changes missing required data (close_date, close_reason, won_amount) |
| **WF-H4** | Missing Required Relationships | Detects forms allowing record creation without required foreign keys |

### Medium Severity Checks

| Check ID | Name | Description |
|----------|------|-------------|
| **WF-M1** | Inconsistent Date Handling | Flags usage of `new Date()`, `dayjs()`, `format()` without standardized utilities |
| **WF-M2** | Direct Status Assignment | Locates hardcoded status/priority choices instead of config-driven options |
| **WF-M3** | Missing Close Reasons | Identifies closed opportunities using free-text instead of structured reason codes |
| **WF-M4** | Optional Activity Type | Finds activity records without type classification |

---

**Report Generated:** 2026-01-10
**Next Audit Scheduled:** 2026-01-17
**Tool Version:** Claude Code Audit Suite v1.0
