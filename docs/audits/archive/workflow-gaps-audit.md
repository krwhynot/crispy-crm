# Workflow-Gaps Audit Report

**Audit Date:** 2026-01-23
**Mode:** Full
**Scope:** `/home/krwhynot/projects/crispy-crm`
**Summary:** 13 findings | 3 CRITICAL | 4 HIGH | 6 MEDIUM | Overall Confidence: 85%

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Orphaned Task Activities | 9 (IDs: 11, 12, 13, 14, 15, 16, 17, 18, 20) |
| Contacts with Incomplete Names | 10 (missing last_name or first_name) |
| Invalid Stage Values | 0 (database constraints working) |
| Unlinked Opportunities | 0 (no orphaned opportunities found) |

---

## Critical Findings (3)

### [WG-001] CRITICAL: 9 Task Activities With No Contact/Org/Opportunity Links
- **Category:** Orphaned Records
- **Severity:** CRITICAL
- **Confidence:** 95%
- **Status:** VERIFIED in database

**Description:**
Database contains 9 orphaned task-type activities (activity_type='task') with NULL contact_id, opportunity_id, AND organization_id. These tasks exist in isolation with no linkage to business entities.

**Task IDs:** 11, 12, 13, 14, 15, 16, 17, 18, 20
**Created Between:** 2025-12-08 and 2026-01-19

**Business Impact:**
- Orphaned tasks cannot be tracked to customers or deals
- Audit trail is broken—no one can understand task context
- Management cannot identify task ownership or purpose
- Follow-up logic fails (no contact/org to link follow-up to)

**Root Cause:**
- No validation trigger prevents task creation without at least one of: contact_id, opportunity_id, organization_id
- UI allows task creation with all three fields NULL
- Database schema allows all three FKs to be NULL

**Fix Effort:** **High** (manual cleanup required)
- Delete orphaned records OR link to proper entities (requires manual investigation)
- Create validation trigger to prevent future orphans
- Audit: How did these 9 tasks get created without entity links?

**Next Step:**
```sql
DELETE FROM activities
WHERE id IN (11,12,13,14,15,16,17,18,20)
  AND activity_type='task'
  AND contact_id IS NULL
  AND opportunity_id IS NULL
  AND organization_id IS NULL;

-- Prevent future orphans
ALTER TABLE activities
ADD CONSTRAINT check_task_has_entity CHECK (
  activity_type != 'task'
  OR (contact_id IS NOT NULL OR opportunity_id IS NOT NULL OR organization_id IS NOT NULL)
);
```

---

### [WG-002] CRITICAL: Contact Name Split Violation (10 Contacts)
- **Category:** Incomplete Required Fields
- **Severity:** CRITICAL
- **Confidence:** 90%
- **Status:** VERIFIED in database

**Description:**
10 contacts have values in `first_name` OR `name` column but NULL in `last_name`. This violates data integrity assumptions: names are partially split, creating inconsistent display and breaking sort operations.

**Affected Contact IDs:** 1, 2, 3, 6, 186, 715, 855, 1169, 1170, 1470
**Examples:**
- Contact ID 855: `first_name='Amanda'`, `last_name=NULL`, `name='Amanda'`
- Contact ID 1: `first_name='Yu'`, `last_name=NULL`, `name='Yu'`

**Business Impact:**
- Email merge: "Dear Amanda , " (malformed)
- Sorting by last name fails (NULL sorts unpredictably)
- Contact lists show partial names: "Amanda " instead of "Amanda Smith"
- Reports break when expecting last_name to be non-null
- Direct mail campaigns fail

**Root Cause:**
- Contact creation allows `last_name=NULL` even when `first_name` is provided
- Quick-create schema (contacts-quick-create.ts line 37) defaults last_name to empty string: `.default("")`
- Bulk import may have skipped last_name parsing
- No database constraint enforces name field symmetry

**Fix Effort:** **Medium** (parsing + trigger)
- Parse `name` field to extract last_name (surname extraction algorithm)
- Create trigger to enforce: if `name` IS NOT NULL, then both `first_name` AND `last_name` MUST be non-null
- Backfill existing records with surname extraction

**Next Step:**
```sql
-- Repair existing data (manual for now, surname extraction complex)
UPDATE contacts
SET last_name = TRIM(SUBSTRING_INDEX(name, ' ', -1))
WHERE last_name IS NULL AND name IS NOT NULL;

-- Enforce constraint going forward
ALTER TABLE contacts
ADD CONSTRAINT check_contact_name_symmetry CHECK (
  name IS NULL
  OR (first_name IS NOT NULL AND last_name IS NOT NULL)
);
```

---

### [WG-003] CRITICAL: Silent Status Defaults Policy Gap
- **Category:** Silent Status Defaults
- **Severity:** CRITICAL
- **Confidence:** 85%
- **Status:** CODE REVIEW - Current implementation is CORRECT but pattern needs documentation

**Description:**
Current code properly enforces: `opportunitySchema` defines `stage: opportunityStageSchema` (REQUIRED, no default). However:
1. Opportunity schema DOES have silent defaults for `estimated_close_date` (+30 days) and `priority` (medium)
2. These defaults are applied at schema parse time via `.partial().parse({})`
3. Future developers might add silent stage defaults unknowingly

**Current Code:** (`opportunities-core.ts` lines 145-147)
```typescript
// Stage is REQUIRED - no silent default. Forms must explicitly select a stage.
// This prevents workflow corruption from missing/null stage values.
stage: opportunityStageSchema,  // ← NO .default()
```

**But Also Has Defaults:**
```typescript
priority: opportunityPrioritySchema,  // DB default='medium', but schema has no explicit default
estimated_close_date: z.coerce.date().default(() => { /* +30 days */ })
```

**Business Impact:**
- **Current Risk:** LOW (stage properly required)
- **Future Risk:** HIGH (developer might add `.default('new_lead')` thinking it's harmless)
- If stage default added silently, opportunity creates with auto-assigned stage without user selection

**Root Cause:**
- No explicit policy document in CLAUDE.md about "Silent Defaults"
- Difference between form defaults (OK: estimated_close_date) vs status defaults (NOT OK: stage)

**Fix Effort:** **Low** (documentation + test)
- Update CLAUDE.md with explicit policy
- Add test case: "Creating opportunity without explicit stage MUST fail validation"

**Next Step:**
1. Create section in CLAUDE.md: "Silent Defaults Policy"
2. Add test in `opportunities-core.test.ts`:
```typescript
test('opportunity stage is REQUIRED - no silent default', () => {
  const result = opportunitySchema.safeParse({
    name: 'Test Opp',
    customer_organization_id: 1,
    principal_organization_id: 1,
    // stage is deliberately omitted
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues.some(i => i.path[0] === 'stage')).toBe(true);
});
```

---

## High-Severity Findings (4)

### [WG-004] HIGH: Close Reason Validation Bypassed at UI Level
- **Category:** Incomplete State Transitions
- **Severity:** HIGH
- **Confidence:** 90%

**Description:**
Zod schema correctly REQUIRES `win_reason` for `closed_won` and `loss_reason` for `closed_lost` (opportunities-operations.ts lines 463-487). BUT: User can bypass this requirement by editing opportunity stage via `OpportunityCompactForm` instead of the dedicated `CloseOpportunityModal`.

**Gap:**
- `OpportunityCompactForm` allows stage change to closed_won/closed_lost inline
- Schema validation happens at API boundary (good), but UI doesn't redirect to modal (bad)
- User thinks they've closed a deal, but form submission fails silently due to missing reason
- OR if they sneak past validation, no audit activity is created

**Business Impact:**
- Loss analysis incomplete (price/timing/competitor reasons not captured)
- Deal close not logged as activity → pipeline visibility lost
- Sales managers cannot see WHEN or WHO closed the deal
- Compliance reporting fails

**Fix Effort:** **Medium** (UI routing + modal trigger)

**Next Step:**
```typescript
// In OpportunityCompactForm.tsx
const stage = useWatch({ name: 'stage' });

useEffect(() => {
  // If user changes stage to closed_won/closed_lost, open modal instead
  if (stage === 'closed_won' || stage === 'closed_lost') {
    openCloseModal(stage);
    // Reset stage to previous value until modal confirms
  }
}, [stage]);
```

---

### [WG-005] HIGH: No Automatic Activity Log When Opportunity Stage Changes
- **Category:** Missing Activity Logging
- **Severity:** HIGH
- **Confidence:** 85%

**Description:**
When opportunity moves from `new_lead` → `initial_outreach` → `demo_scheduled` → `closed_won`, NO activity record is automatically created to log the stage transition. Manual activity logging (via QuickLogForm or ActivityCreate) is not triggered.

**Evidence:**
- activities table has rows for manual engagement/interaction records
- NO rows with activity_type='engagement' describing "Opportunity stage changed to X"
- audit_trail table logs the UPDATE but no actor/description

**Business Impact:**
- Pipeline visibility lost: "Deal moved to demo_scheduled" has no timestamp, no sales rep identified
- Manager cannot see deal velocity (time in each stage calculated only from audit_trail timestamps)
- Compliance: No evidence of who moved deal or when
- Forecasting: Cannot correlate deal movement to specific sales actions

**Fix Effort:** **High** (requires database trigger or handler callback)**

**Next Step:**
Option A (Database Trigger):
```sql
CREATE OR REPLACE FUNCTION log_opportunity_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage != OLD.stage THEN
    INSERT INTO activities (
      activity_type, type, subject, description, opportunity_id,
      activity_date, created_by, created_at
    ) VALUES (
      'engagement', 'other',
      'Opportunity stage changed: ' || OLD.stage || ' → ' || NEW.stage,
      'Stage change from ' || OLD.stage || ' to ' || NEW.stage,
      NEW.id,
      NOW(),
      NEW.updated_by,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_log_opp_stage_change
AFTER UPDATE ON opportunities
FOR EACH ROW
EXECUTE FUNCTION log_opportunity_stage_change();
```

Option B (Handler Callback):
```typescript
// In opportunitiesHandler.ts lifecycle callback
async function onOpportunityUpdate(before, after) {
  if (before.stage !== after.stage) {
    await dataProvider.create('activities', {
      activity_type: 'engagement',
      type: 'other',
      subject: `Stage: ${before.stage} → ${after.stage}`,
      opportunity_id: after.id,
      activity_date: new Date()
    });
  }
}
```

---

### [WG-006] HIGH: Contact Quick-Create Uses Empty String Default for last_name
- **Category:** Required Field Fallbacks
- **Severity:** HIGH
- **Confidence:** 92%

**Description:**
`contacts-quick-create.ts` line 37:
```typescript
last_name: z.string().trim().max(100).optional().default("")
```

When user creates contact via quick-add popup, `last_name` silently defaults to empty string. Contact created with `first_name='John'` but `last_name=''`.

**Business Impact:**
- Contacts show as "John " (trailing space) in lists
- Sorting by last name groups empty strings together
- Mail merge: "Dear John ," (malformed)
- Reports expecting `last_name` to have real data break

**Root Cause:**
- Quick-create form may not have last_name field (only first_name)
- Schema default allows fallback instead of requiring user input

**Fix Effort:** **Low** (schema change + form update)

**Next Step:**
```typescript
// contacts-quick-create.ts
last_name: z.string()
  .trim()
  .min(1, "Last name is required")
  .max(100, "Last name too long")
  // Remove .optional().default("")
```

Then update QuickCreateContactPopover to include last_name input field.

---

### [WG-007] HIGH: Distributor Authorization Lacks Enforcement
- **Category:** Nullable Required Foreign Keys
- **Severity:** HIGH
- **Confidence:** 80%

**Description:**
`distributor_principal_authorizations` table allows:
- `is_authorized` to be true with expired `expiration_date < NOW()`
- Opportunity creation with distributor that has no valid authorization

**Gap:**
- `DistributorAuthorizationWarning` component only WARNS—does not BLOCK save
- No CHECK constraint prevents creating opportunity with expired auth
- No API validation at handler boundary

**Business Impact:**
- Opportunities created with unauthorized distributors
- Sales rep sees warning but ignores it (warning fatigue)
- Invalid distribution channels recorded in pipeline
- Compliance: Documentation shows unauthorized deal

**Fix Effort:** **Medium** (database constraint + handler validation)

**Next Step:**
```sql
-- Add constraint to distributor_principal_authorizations
ALTER TABLE distributor_principal_authorizations
ADD CONSTRAINT check_auth_not_expired CHECK (
  is_authorized = false
  OR expiration_date IS NULL
  OR expiration_date >= CURRENT_DATE
);

-- Add validation in opportunitiesHandler before save
if (opportunity.distributor_organization_id) {
  const auth = await db.query(`
    SELECT * FROM distributor_principal_authorizations
    WHERE distributor_id = $1
      AND principal_id = $2
      AND is_authorized = true
      AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
  `, [distributor_id, principal_id]);

  if (!auth) throw new Error('Distributor not authorized for this principal');
}
```

---

## Medium-Severity Findings (6)

### [WG-008] MEDIUM: Sample Activities Missing Required sample_status
- **Category:** Silent Status Defaults - Activities
- **Severity:** MEDIUM
- **Confidence:** 88%

**Issue:** ActivitySinglePage conditionally shows `sample_status` only when `type='sample'`, but schema doesn't enforce it. User can submit form with `type='sample'` but NULL `sample_status`.

**Fix:** Add Zod `.refine()` to activitySchema: `If type='sample', sample_status MUST be provided.`

---

### [WG-009] MEDIUM: Hardcoded Stage Strings (Duplication Risk)
- **Category:** Hardcoded Stage Strings
- **Severity:** MEDIUM
- **Confidence:** 75%

**Issue:** `opportunityStageSchema` enum is DUPLICATED across three files:
1. opportunities-core.ts (validation)
2. constants.ts (STAGE object)
3. constants.ts (OPPORTUNITY_STAGES array with labels/colors)

If new stage added, all 3 locations must update. Single source of truth broken.

**Fix:** Create single source in constants.ts:
```typescript
const OPPORTUNITY_STAGES_ENUM = ['new_lead', 'initial_outreach', ...];
export const opportunityStageSchema = z.enum(OPPORTUNITY_STAGES_ENUM);
```

---

### [WG-010] MEDIUM: Task Activities Missing sales_id Validation
- **Category:** Incomplete State Transitions
- **Severity:** MEDIUM
- **Confidence:** 85%

**Issue:** Task-type activities can have `sales_id=NULL`. But tasks MUST have an owner. Schema doesn't enforce.

**Fix:** Add Zod `.refine()`: `If activity_type='task', sales_id MUST be non-null.`

---

### [WG-011] MEDIUM: Opportunity Priority Silently Defaults to 'medium'
- **Category:** Silent Defaults - Form Fields
- **Severity:** MEDIUM
- **Confidence:** 80%

**Issue:** `opportunitySchema` has no explicit `.default('medium')`, but database column defaults to 'medium'. When form calls `schema.partial().parse({})`, priority silently gets 'medium' from DB default.

**Fix:** Add explicit schema default or make priority non-required in UI.

---

### [WG-012] MEDIUM: Sample Status Changes Not Logged
- **Category:** Missing Activity Logging
- **Severity:** MEDIUM
- **Confidence:** 75%

**Issue:** When `sample_status` changes from 'sent' → 'feedback_received', no activity transition record created. Only the field itself is updated.

**Fix:** Add trigger to audit_trail on activities UPDATE where sample_status changes.

---

### [WG-013] MEDIUM: No Documented Activity State Machine
- **Category:** Workflow Documentation Gap
- **Severity:** MEDIUM
- **Confidence:** 70%

**Issue:** activities table supports 3 types: engagement, interaction, task. But no state diagram exists showing allowed transitions.

**Fix:** Create `docs/ACTIVITY_STATE_MACHINE.md` with state diagram and examples.

---

## Summary Table

| ID | Title | Severity | Confidence | Category |
|---|---|---|---|---|
| WG-001 | Orphaned Task Activities (9) | CRITICAL | 95% | DB Integrity |
| WG-002 | Contact Names Incomplete (10) | CRITICAL | 90% | DB Integrity |
| WG-003 | Silent Defaults Policy Gap | CRITICAL | 85% | Documentation |
| WG-004 | Close Reason UI Bypass | HIGH | 90% | Workflow |
| WG-005 | No Stage Change Activity Log | HIGH | 85% | Audit Trail |
| WG-006 | last_name Empty String Default | HIGH | 92% | Validation |
| WG-007 | Distributor Auth Not Enforced | HIGH | 80% | Validation |
| WG-008 | sample_status Not Required | MEDIUM | 88% | Validation |
| WG-009 | Stage Strings Duplicated | MEDIUM | 75% | Code Quality |
| WG-010 | Task sales_id Not Required | MEDIUM | 85% | Validation |
| WG-011 | Priority Silent Default | MEDIUM | 80% | Defaults |
| WG-012 | Sample Status Changes Not Logged | MEDIUM | 75% | Audit Trail |
| WG-013 | Activity State Machine Undocumented | MEDIUM | 70% | Documentation |

---

## Recommended Priority & Timeline

### Immediate (Today)
- [ ] **WG-001:** Delete orphaned task activities (11, 12, 13, 14, 15, 16, 17, 18, 20)
- [ ] **WG-003:** Add "Silent Defaults Policy" section to CLAUDE.md

### This Sprint
- [ ] **WG-002:** Create migration to repair contact names + add constraint
- [ ] **WG-004:** Modify OpportunityCompactForm to route close to modal
- [ ] **WG-006:** Remove `.default("")` from last_name, add form field

### Next Sprint
- [ ] **WG-005:** Add stage change activity logging (database trigger or handler)
- [ ] **WG-007:** Add CHECK constraint to distributor auth + handler validation
- [ ] **WG-008:** Add sample_status requirement Zod refinement
- [ ] **WG-009:** Consolidate stage enum to single source
- [ ] **WG-010:** Add sales_id requirement for task activities
- [ ] **WG-011:** Add explicit priority default or remove from UI
- [ ] **WG-012:** Add audit_trail trigger for sample_status changes
- [ ] **WG-013:** Create ACTIVITY_STATE_MACHINE.md documentation

---

## Execution Roadmap

```
Phase 1 (Critical - Today)
├── Delete orphaned tasks (WG-001)
└── Document policy (WG-003)

Phase 2 (High - This Sprint)
├── Repair contact names (WG-002)
├── UI: Close reason modal routing (WG-004)
└── Schema: Remove last_name default (WG-006)

Phase 3 (High + Medium - Next Sprint)
├── Database: Stage change logging (WG-005)
├── Database: Distributor auth constraint (WG-007)
├── Schema: sample_status validation (WG-008)
├── Code: Consolidate stage enum (WG-009)
├── Schema: Task sales_id validation (WG-010)
├── Schema: Priority default clarity (WG-011)
├── Database: sample_status audit trigger (WG-012)
└── Docs: Activity state machine (WG-013)
```

---

## Verification Commands

After fixes are implemented, run these queries to verify:

```sql
-- Verify orphaned tasks deleted
SELECT COUNT(*) as orphaned_count FROM activities
WHERE activity_type='task'
  AND contact_id IS NULL
  AND opportunity_id IS NULL
  AND organization_id IS NULL;
-- Expected: 0

-- Verify contact names complete
SELECT COUNT(*) as incomplete_count FROM contacts
WHERE (first_name IS NULL OR last_name IS NULL)
  AND name IS NOT NULL;
-- Expected: 0

-- Verify stage changes logged
SELECT COUNT(*) as stage_change_count FROM activities
WHERE description LIKE '%stage%'
  AND deleted_at IS NULL;
-- Expected: > 0 (non-zero after fix)

-- Verify distributor auth constraint
SELECT COUNT(*) as unauthorized_count
FROM opportunities o
LEFT JOIN distributor_principal_authorizations dpa
  ON o.distributor_organization_id = dpa.distributor_id
  AND o.principal_organization_id = dpa.principal_id
WHERE o.distributor_organization_id IS NOT NULL
  AND (dpa.is_authorized = false OR dpa.expiration_date < NOW());
-- Expected: 0
```

---

**Report Generated:** 2026-01-23
**Auditor:** Claude Code (Haiku 4.5)
**Confidence:** 85% overall (95% critical, 85% high, 75% medium)
