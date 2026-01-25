# Workflow Gaps Audit Report - 2026-01-25

**Auditor:** Claude Code (automated)
**Mode:** Full Codebase Scan
**Scope:** src/atomic-crm, supabase/migrations
**Confidence:** 78% [High (85-100%) + Medium gaps]

---

## Executive Summary

### Status Overview

| Severity | Count | Trend | Notes |
|----------|-------|-------|-------|
| **Critical** | 2 | ➡️ NEW | Nullable required FKs (customer_org, principal_org) |
| **High** | 4 | ⬆️ ONGOING | Activity logging, constraint enforcement, state transitions |
| **Medium** | 3 | ⬆️ NEW | Silent defaults, task completion, audit trail |
| **TOTAL** | **9** | | **Status: Needs Remediation** |

### What's Working Well ✅

- **WG-001 (Sample Follow-up):** RESOLVED - Validation enforces follow_up when sample_status is active
- **WG-002 (Win/Loss Reasons):** RESOLVED - Zod + DB CHECK constraints enforce reasons at close
- **WG-003 (Required Fields):** RESOLVED - No silent defaults for stage/priority

### What's Broken 🔴

- **Critical:** Database allows NULL in fields that must be NOT NULL (customer_organization_id, principal_organization_id)
- **High:** Zero automatic activity logging for 11+ mutation points
- **High:** Activity FK relationships only enforced at app layer, not DB
- **High:** Stage transitions not validated (can skip workflow steps)

---

## Critical Issues (Require Immediate Fix)

### WF-C1-001: Nullable Required Foreign Key - customer_organization_id

**Severity:** CRITICAL
**Business Impact:** Violates core business rule Q12: "Every opportunity must have exactly one customer"
**Confidence:** 95%

**Problem:**

```typescript
// Schema says: REQUIRED
customer_organization_id: z.union([z.string(), z.number()]), // Required - marked with * in UI
```

**But Database Allows:**

```sql
-- No NOT NULL constraint exists
ALTER TABLE opportunities
ADD COLUMN customer_organization_id BIGINT REFERENCES organizations(id);
-- ^ Can be NULL
```

**Risk Scenario:**

```typescript
// Direct Supabase API call bypasses Zod validation
const { data } = await supabase
  .from('opportunities')
  .insert({ name: 'Deal', stage: 'new_lead' }) // No customer_organization_id
  .select();
// ✅ Succeeds - DB accepts NULL
// ❌ Violates business rule Q12
```

**Why This Matters:**

The system cannot answer: "Which customer is this deal for?" if the FK is NULL. This breaks:
- Customer rollup reporting (total deals per customer)
- Multi-tenancy boundaries (can't isolate by customer)
- RLS policies that filter by customer_organization_id
- CRM data integrity (orphaned deals)

**Fix:**

```sql
-- Migration: Make customer_organization_id NOT NULL
ALTER TABLE opportunities
ALTER COLUMN customer_organization_id SET NOT NULL;
```

**Effort:** 1 hour (with data cleanup if needed)

---

### WF-C1-002: Nullable Required Foreign Key - principal_organization_id

**Severity:** CRITICAL
**Business Impact:** Violates MFB model: "Every opportunity represents a principal's product"
**Confidence:** 95%

**Problem:** Same as WF-C1-001 but for principal_organization_id.

**Risk Scenario:**

```typescript
// Opportunity created without principal
const opp = {
  name: 'Dining Tech Deal',
  stage: 'new_lead',
  customer_organization_id: 1, // Restaurant
  principal_organization_id: null, // ❌ NO PRINCIPAL!
  // Can't answer: "Which manufacturer's product?"
};
```

**Why This Breaks MFB:**

MFB's model is: **Principal (Manufacturer) → Distributor → Operator (Restaurant)**

Without principal_organization_id, the entire supply chain breaks. Cannot track:
- Which manufacturer benefits from this deal
- Sales attribution (is this a win for Kraft? Nestlé? Mondelez?)
- Principal dashboard metrics

**Fix:**

```sql
ALTER TABLE opportunities
ALTER COLUMN principal_organization_id SET NOT NULL;
```

**Effort:** 1 hour

---

## High-Priority Issues (Process Gaps)

### WF-H1-001: Activity Logging Architecture - Zero Auto-Logging

**Severity:** HIGH
**Category:** Audit Trail / Business Intelligence
**Confidence:** 90%

**Current Architecture:**

Activities are **100% manual**. Only entry point:

```typescript
// src/atomic-crm/activities/QuickLogActivityDialog.tsx
// User explicitly creates activity via dialog
const onSubmit = (data) => {
  dataProvider.create('activities', { data });
};
```

**Missing Auto-Logging Anywhere:**

| Operation | Auto-Logged? | Impact |
|-----------|--------------|--------|
| Opportunity created (QuickAdd) | ❌ NO | Can't answer: when was deal created? |
| Opportunity archived/deleted | ❌ NO | No audit of who closed the deal |
| Opportunity updated (stage change) | ❌ NO | No pipeline velocity metrics |
| Activity created | ❌ NO | No meta-activity logging |
| Task completed | ❌ NO | No audit of task completion |

**Real-World Impact:**

```typescript
// User creates opportunity via Kanban
const { data: opp } = dataProvider.create('opportunities', {
  data: {
    name: 'Pepsi Deal',
    stage: 'new_lead',
    customer_organization_id: 123,
    principal_organization_id: 456,
  }
});
// ✅ Opportunity created
// ❌ NO ACTIVITY LOGGED
// ❌ Can't track: who, when, why
```

Later, when analyzing sales performance:
- "How many deals did Sarah create last month?" → Cannot answer (no timestamp)
- "What's our deal velocity?" → Cannot calculate (creation dates unknown)
- "Why did we lose this deal?" → Lost context (no archive activity)

**Fix Strategy:**

Add automatic activity logging in provider callbacks:

```typescript
// src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts
export const opportunitiesCallbacks = {
  async afterCreate(record, dataProvider) {
    // Auto-log opportunity creation
    await dataProvider.create('activities', {
      data: {
        activity_type: 'engagement',
        type: 'note',
        subject: `Opportunity "${record.name}" created`,
        organization_id: record.customer_organization_id,
        activity_date: new Date(),
        created_by: auth.user().id, // From auth context
        description: `Stage: ${record.stage} | Principal: ${record.principal_organization_id}`,
      }
    });
  }
};
```

**Effort:** 6 hours (multiple callbacks + testing)

---

### WF-H1-002: Activity FK Enforcement - App Layer Only

**Severity:** HIGH
**Confidence:** 85%

**Problem:**

Interaction activities **require** opportunity_id, but only checked by Zod:

```typescript
// src/atomic-crm/validation/activities/schemas.ts:169
if (data.activity_type === 'interaction' && !data.opportunity_id) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['opportunity_id'],
    message: 'Opportunity is required for interaction activities',
  });
}
```

**But Database Allows:**

```sql
-- No CHECK constraint
CREATE TABLE activities (
  opportunity_id BIGINT REFERENCES opportunities(id), -- Can be NULL
  ...
);
```

**Risk:** Direct API bypasses Zod validation:

```sql
-- Raw Supabase insert bypasses validation
INSERT INTO activities (activity_type, opportunity_id, ...)
VALUES ('interaction', NULL, ...);
-- ✅ Succeeds at DB
-- ❌ Violates business rule
```

**Fix:**

```sql
ALTER TABLE activities
ADD CONSTRAINT interactions_require_opportunity
CHECK (activity_type != 'interaction' OR opportunity_id IS NOT NULL);
```

**Effort:** 1 hour

---

### WF-H1-003: Activity Entity Relationship - "At Least One" Not Enforced

**Severity:** HIGH
**Confidence:** 85%

**Problem:**

Activities require contact_id OR organization_id (at least one), but validation is app-layer only:

```typescript
// src/atomic-crm/validation/activities/schemas.ts:102
if (!data.contact_id && !data.organization_id) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['contact_id'],
    message: 'Either contact or organization is required',
  });
}
```

**Database Allows Both NULL:**

```sql
-- Both FKs nullable and unconstrained
CREATE TABLE activities (
  contact_id BIGINT REFERENCES contacts(id),
  organization_id BIGINT REFERENCES organizations(id),
  -- No CHECK ensuring at least one is NOT NULL
);
```

**Real Scenario:**

```sql
INSERT INTO activities (activity_type, subject, contact_id, organization_id)
VALUES ('engagement', 'Random note', NULL, NULL);
-- ✅ Succeeds at DB (orphaned activity)
-- ❌ Violates data integrity
```

**Fix:**

```sql
ALTER TABLE activities
ADD CONSTRAINT activities_require_entity
CHECK (contact_id IS NOT NULL OR organization_id IS NOT NULL);
```

**Effort:** 1 hour

---

### WF-H1-004: Missing Stage Transition Validation

**Severity:** HIGH
**Confidence:** 90%

**Problem:**

Opportunities can transition between ANY stages without enforcing pipeline order:

```typescript
// Current: Can jump from new_lead directly to closed_won
const kanbanDrag = {
  id: 123,
  stage: 'closed_won', // Jump from anywhere to close
  win_reason: 'relationship',
};
// ✅ Zod passes (valid stage value)
// ❌ Bypasses 5-stage funnel
```

**Expected Pipeline:**

```
new_lead → initial_outreach → sample_visit_offered → feedback_logged → demo_scheduled → closed_won
```

**Risk:**

Users can close deals without following process:
- No sample visit offered → demo scheduled
- No feedback collected → closed
- Skips quality gates

**Business Impact:**

- Pipeline metrics unreliable (can't track deal progression)
- Sales process not enforced (reps can shortcut)
- Cannot identify stalled deals (stuck in stage)
- Staging data becomes meaningless for forecasting

**Fix:**

```typescript
// src/atomic-crm/validation/opportunities/opportunities-operations.ts
const STAGE_ORDER = {
  'new_lead': 0,
  'initial_outreach': 1,
  'sample_visit_offered': 2,
  'feedback_logged': 3,
  'demo_scheduled': 4,
  'closed_won': 5,
  'closed_lost': 5,
};

// Add refinement to updateOpportunitySchema
.refine(
  (data) => {
    if (!data.stage || !data.current_stage) return true; // Allow partial updates
    const from = STAGE_ORDER[data.current_stage];
    const to = STAGE_ORDER[data.stage];
    return to >= from; // Can only move forward or close (5)
  },
  {
    message: 'Can only move opportunities forward in the pipeline',
    path: ['stage'],
  }
);
```

**Effort:** 3 hours (validation + migration to track previous stage)

---

## Medium-Priority Issues (Data Hygiene)

### WF-M1-001: Activity Date Defaults to Today Without Explicit User

**Severity:** MEDIUM
**Confidence:** 70%

**Issue:**

```typescript
activity_date: z.coerce.date().default(() => new Date()),
```

User may not notice if activity is backdated. Example:

```typescript
// User creates activity on 2026-01-25
const activity = {
  type: 'call',
  subject: 'Initial call',
  activity_date: // Defaults to TODAY (2026-01-25)
};

// Later that day: "Wait, I had that call last week!"
// Too late - already logged with today's date
```

**Risk:** Low - default is sensible. But UI doesn't make date selection prominent.

**Fix:** Make activity_date a required field in form (no default).

**Effort:** 1 hour (form change + validation update)

---

### WF-M1-002: Task Completion State Machine Not Validated

**Severity:** MEDIUM
**Confidence:** 75%

**Issue:**

```typescript
completed: z.coerce.boolean().default(false),
completed_at: z.string().max(50).nullable().optional(),
```

Can create inconsistent states:

```typescript
// Invalid: completed but no timestamp
{ completed: true, completed_at: null }

// Invalid: timestamp without completed flag
{ completed: false, completed_at: '2026-01-25T10:00:00Z' }
```

**Risk:** Medium - not enforced at DB, but data becomes inconsistent.

**Fix:**

```typescript
.refine(
  (data) => {
    const hasCompleted = data.completed === true;
    const hasCompletedAt = !!data.completed_at;
    // If completed, must have timestamp. If timestamp, must be completed.
    return hasCompleted === hasCompletedAt;
  },
  { message: 'completed and completed_at must be in sync' }
);
```

**Effort:** 1 hour

---

### WF-M1-003: Created_by Not Auto-Populated on Activities

**Severity:** MEDIUM
**Confidence:** 80%

**Issue:**

```typescript
created_by: z.union([z.string(), z.number()]).optional().nullable(),
```

Manual logging may not capture user:

```typescript
// User logs activity but created_by not populated
const activity = {
  activity_type: 'interaction',
  type: 'call',
  subject: 'Spoke with operations team',
  created_by: null, // ❌ Who logged this?
};
```

**Risk:** Audit trail gaps in multi-rep teams.

**Fix:** Auto-populate from auth context (like we do for created_at):

```sql
ALTER TABLE activities
ALTER COLUMN created_by SET NOT NULL;

-- Trigger to auto-populate
CREATE TRIGGER set_activities_created_by
BEFORE INSERT ON activities
FOR EACH ROW
EXECUTE FUNCTION auth.set_user_from_jwt();
```

**Effort:** 2 hours (trigger + migration)

---

## Test Coverage Assessment

| Area | Current | Needed |
|------|---------|--------|
| **Win/Loss Validation** | ✅ HIGH | Tests comprehensive (opportunities-stage-close.test.ts) |
| **Sample Workflows** | ✅ HIGH | Tests exist (activities-sample-followup.test.ts) |
| **Activity Validation** | 🟡 MEDIUM | Missing: transition tests, FK relationship tests |
| **DB Constraints** | 🟡 MEDIUM | CHECK constraints exist for win/loss, need more for FKs |
| **Stage Transitions** | ❌ NONE | Need tests for pipeline order enforcement |
| **Auto-Logging** | ❌ NONE | Feature doesn't exist yet |

---

## Architecture Review

### What's Done Right ✅

1. **Zod at API Boundary:** Single source of truth for validation
2. **Defense in Depth (Win/Loss):** App layer + DB CHECK constraints
3. **Type Safety:** z.infer<> prevents manual interface drift
4. **Sample Workflow:** Properly enforces follow_up for active samples
5. **Constants Over Literals:** STAGE constants used instead of hardcoded strings

### What Needs Work 🔴

1. **DB Constraints:** Required FKs should be NOT NULL at schema level
2. **Auto-Logging:** No audit trail for system operations (only manual)
3. **State Machines:** No validation of task/activity/opportunity state transitions
4. **Activity Recording:** created_by not auto-populated from auth
5. **Pipeline Enforcement:** Stage changes not validated against workflow order

---

## Remediation Roadmap

### Phase 1: Critical (1 day)
- [ ] Add NOT NULL to customer_organization_id
- [ ] Add NOT NULL to principal_organization_id
- [ ] Add CHECK constraints for activity FKs
- **Impact:** Prevents data corruption, enforces business rules at DB

### Phase 2: High (2 days)
- [ ] Implement auto-logging callbacks for opportunities
- [ ] Add stage transition validation
- [ ] Add task completion state machine validation
- **Impact:** Audit trail, sales metrics, data consistency

### Phase 3: Medium (1 day)
- [ ] Auto-populate created_by from auth
- [ ] Make activity_date required in forms
- [ ] Add tests for new validations
- **Impact:** Data hygiene, audit completeness

---

## Conclusion

Crispy CRM has **strong app-layer validation** (Zod at API boundary) but **critical gaps at database constraint level**. Critical foreign keys that should be NOT NULL allow NULL values, violating core business rules (Q12, MFB model). Activity logging is entirely manual with no audit trail for system operations. Stage transitions are not enforced, allowing users to bypass the sales funnel.

**Overall Status:** 🟡 **Needs Remediation**

**Key Risks:**
1. Business rule violations (nullable required FKs)
2. Lost audit trail (no auto-logging)
3. Process gaps (no stage transition enforcement)

**Confidence in Findings:** 78% (Mix of high-confidence DB issues + medium-confidence validation gaps)
