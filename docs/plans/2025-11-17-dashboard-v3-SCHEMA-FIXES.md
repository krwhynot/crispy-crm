# Dashboard V3 Critical Schema Fixes

**Status:** 🔴 BLOCKING - These fixes must be applied before implementation

**Issue:** The corrected plan (2025-11-17-principal-dashboard-v3-CORRECTED.md) contains critical schema mismatches that will cause silent data loss and runtime failures.

---

## Summary of Issues

### 1. QuickLogForm Writes to Wrong Columns ❌
- **Problem:** Form writes to non-existent `type` column instead of `activity_type` + `type`
- **Impact:** Every activity insert will fail with SQL error
- **Lines:** QuickLogForm.tsx payload (lines 753-767 in FINAL plan)

### 2. "Note" Option Removed ❌
- **Problem:** UI removed "Note" activity type but `interaction_type` enum doesn't have 'note'
- **Impact:** Users cannot log simple notes (regression from requirements)
- **Lines:** activityTypeSchema (lines 614-615 in FINAL plan)

### 3. Pipeline Value Field Missing ❌
- **Problem:** Hook maps `row.pipeline_value` but view doesn't return it
- **Impact:** UI shows undefined for pipeline value
- **Lines:** View (lines 1512-1550) vs Hook (line 1583 in FINAL plan)

### 4. LEFT JOIN Broken by WHERE Clause ❌
- **Problem:** `WHERE opp.stage NOT IN (...)` after LEFT JOIN turns it into INNER JOIN
- **Impact:** Principals with zero active opportunities don't appear in dashboard
- **Lines:** View WHERE clause (line 1545 in FINAL plan)

---

## Database Schema Reference

### activities Table (ACTUAL SCHEMA)

```sql
CREATE TABLE activities (
  id                  BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  activity_type       activity_type NOT NULL,  /* 'engagement' | 'interaction' */
  type                interaction_type NOT NULL,  /* 'call' | 'email' | 'meeting' | ... */
  subject             TEXT NOT NULL,
  description         TEXT,
  activity_date       TIMESTAMPTZ DEFAULT now() NOT NULL,
  duration_minutes    INTEGER,
  contact_id          BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id     BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id      BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
  follow_up_required  BOOLEAN DEFAULT false,
  follow_up_date      DATE,
  outcome             TEXT,  /* ✅ THIS EXISTS! User-provided outcome text */
  created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by          BIGINT REFERENCES sales(id),
  deleted_at          TIMESTAMPTZ
);
```

**Key Points:**
- **TWO type columns**: `activity_type` (engagement|interaction) + `type` (interaction_type enum)
- **outcome field EXISTS** as TEXT (not enum)
- **No `type` column by itself** - would cause insert failures

### interaction_type Enum (ACTUAL)

```sql
CREATE TYPE interaction_type AS ENUM (
  'call',          -- Phone call
  'email',         -- Email
  'meeting',       -- In-person or virtual meeting
  'demo',          -- Product demonstration
  'proposal',      -- Proposal presentation
  'follow_up',     -- Follow-up activity
  'trade_show',    -- Trade show interaction
  'site_visit',    -- Site visit
  'contract_review', -- Contract review
  'check_in',      -- General check-in
  'social'         -- Social interaction
);
```

**Missing:** 'note' - Need to add this for simple note logging

### opportunities Table (NO AMOUNT FIELD)

```sql
CREATE TABLE opportunities (
  id                        BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name                      TEXT NOT NULL,
  description               TEXT,
  stage                     opportunity_stage DEFAULT 'new_lead',
  -- ... other fields ...
  -- ❌ NO amount, value, or pipeline_value column
);
```

**Note:** Product pricing was removed 2025-10-29 per CLAUDE.md

---

## Fix 1: Correct QuickLogForm Activity Payload

### WRONG (Current Plan)

```typescript
// Lines 753-767 in FINAL plan
await dataProvider.create('activities', {
  data: {
    activity_type: data.opportunityId ? 'interaction' : 'engagement',
    type: data.activityType === 'Follow-up' ? 'follow_up' : data.activityType.toLowerCase(),
    subject: data.notes.substring(0, 100) || `${data.activityType} update`,
    description: data.notes,
    activity_date: data.date.toISOString(),
    duration_minutes: data.duration,
    contact_id: data.contactId,
    organization_id: data.organizationId,
    opportunity_id: data.opportunityId,
    created_by: salesId,
    // Note: 'outcome' and 'next_step' fields don't exist in activities table  ❌ WRONG!
  }
});
```

**Problems:**
1. ❌ Comment says outcome doesn't exist (IT DOES - line 380 in schema)
2. ❌ Uses lowercase transformation (data.activityType.toLowerCase()) which fails for "Follow-up"
3. ❌ Doesn't write to `outcome` field (data loss)

### CORRECT

```typescript
// Map UI types to database enums
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  'Call': 'call',
  'Email': 'email',
  'Meeting': 'meeting',
  'Follow-up': 'follow_up',
  'Note': 'note',  // After enum fix
};

await dataProvider.create('activities', {
  data: {
    // activity_type: engagement for notes, interaction for tracked events
    activity_type: data.activityType === 'Note' ? 'engagement' : 'interaction',

    // type: Map to interaction_type enum using constant lookup
    type: ACTIVITY_TYPE_MAP[data.activityType],

    subject: data.notes.substring(0, 100) || `${data.activityType} update`,
    description: data.notes,
    activity_date: data.date.toISOString(),
    duration_minutes: data.duration,
    contact_id: data.contactId,
    organization_id: data.organizationId,
    opportunity_id: data.opportunityId,

    // ✅ outcome field DOES exist - persist user selection
    outcome: data.outcome,

    // ✅ follow_up fields exist
    follow_up_required: data.createFollowUp,
    follow_up_date: data.followUpDate?.toISOString(),

    created_by: salesId,
  }
});
```

### Updated activitySchema.ts

```typescript
import { z } from 'zod';

// Include "Note" for simple note logging
export const activityTypeSchema = z.enum([
  'Call',
  'Email',
  'Meeting',
  'Follow-up',
  'Note'  // ✅ RESTORED
]);

export const activityOutcomeSchema = z.enum([
  'Connected',
  'Left Voicemail',
  'No Answer',
  'Completed',
  'Rescheduled',
]);

// Constant mapping to database enum values
export const ACTIVITY_TYPE_MAP: Record<string, string> = {
  'Call': 'call',
  'Email': 'email',
  'Meeting': 'meeting',
  'Follow-up': 'follow_up',
  'Note': 'note',  // After migration adds 'note' to enum
} as const;

export const activityLogSchema = z
  .object({
    activityType: activityTypeSchema,
    outcome: activityOutcomeSchema,
    date: z.date().default(() => new Date()),
    duration: z.number().min(0).optional(),
    contactId: z.number().optional(),
    organizationId: z.number().optional(),
    opportunityId: z.number().optional(),
    notes: z.string().min(1, 'Notes are required'),
    createFollowUp: z.boolean().default(false),
    followUpDate: z.date().optional(),
  })
  .refine(
    (data) => data.contactId || data.organizationId,
    {
      message: 'Select a contact or organization before logging',
      path: ['contactId']
    }
  )
  .refine(
    (data) => !data.createFollowUp || data.followUpDate,
    {
      message: 'Follow-up date is required when creating a follow-up task',
      path: ['followUpDate']
    }
  );

export type ActivityLogInput = z.infer<typeof activityLogSchema>;
export type ActivityLog = z.output<typeof activityLogSchema>;
```

### Updated QuickLogForm.tsx SelectContent

```typescript
{/* Activity Type selector - RESTORE "Note" option */}
<SelectContent>
  <SelectItem value="Call">Call</SelectItem>
  <SelectItem value="Email">Email</SelectItem>
  <SelectItem value="Meeting">Meeting</SelectItem>
  <SelectItem value="Follow-up">Follow-up</SelectItem>
  <SelectItem value="Note">Note</SelectItem>  {/* ✅ RESTORED */}
</SelectContent>
```

---

## Fix 2: Add 'note' to interaction_type Enum

### Migration Task 0.1: Add 'note' to Enum

Create `supabase/migrations/20251117000001_add_note_to_interaction_type.sql`:

```sql
-- Migration: Add 'note' to interaction_type enum
-- Purpose: Allow simple note logging in Quick Logger

-- Add 'note' value to interaction_type enum
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'note';

-- Verify enum has 'note'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'interaction_type'::regtype
    AND enumlabel = 'note'
  ) THEN
    RAISE EXCEPTION 'Failed to add note to interaction_type enum';
  END IF;
END $$;
```

**Apply:**
```bash
npx supabase migration new add_note_to_interaction_type
# Copy SQL above
npm run db:cloud:push:dry-run
npm run db:cloud:push
```

---

## Fix 3: Remove pipeline_value from Hook

### WRONG (Current Plan)

```typescript
// Line 1583 in usePrincipalPipeline hook
setData(
  summary.map((row: any) => ({
    id: row.principal_id,
    name: row.principal_name,
    totalPipeline: row.total_pipeline,
    pipelineValue: row.pipeline_value,  // ❌ DOESN'T EXIST IN VIEW
    activeThisWeek: row.active_this_week,
    activeLastWeek: row.active_last_week,
    momentum: row.momentum as PrincipalPipelineRow['momentum'],
    nextAction: row.next_action_summary,
  }))
);
```

### CORRECT

```typescript
// Remove pipelineValue mapping (opportunities have no amount field)
setData(
  summary.map((row: any) => ({
    id: row.principal_id,
    name: row.principal_name,
    totalPipeline: row.total_pipeline,
    // pipelineValue removed - opportunities table has no amount field
    activeThisWeek: row.active_this_week,
    activeLastWeek: row.active_last_week,
    momentum: row.momentum as PrincipalPipelineRow['momentum'],
    nextAction: row.next_action_summary,
  }))
);
```

### Updated types.ts

```typescript
export interface PrincipalPipelineRow {
  id: number;
  name: string;
  totalPipeline: number;  // Count of opportunities
  // pipelineValue removed - opportunities have no amount field
  activeThisWeek: number;
  activeLastWeek: number;
  momentum: Momentum;
  nextAction: string | null;
}
```

---

## Fix 4: Fix LEFT JOIN Issue in View

### WRONG (Current Plan)

```sql
-- Lines 1539-1545 in FINAL plan
FROM organizations o
LEFT JOIN opportunities opp ON o.id = opp.principal_organization_id
LEFT JOIN activities a ON opp.id = a.opportunity_id AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'
  AND o.deleted_at IS NULL
  AND (opp.deleted_at IS NULL OR opp.id IS NULL)
  AND opp.stage NOT IN ('closed_won', 'closed_lost')  -- ❌ TURNS LEFT JOIN INTO INNER
GROUP BY o.id, o.name, opp.account_manager_id;
```

**Problem:** `AND opp.stage NOT IN (...)` after LEFT JOIN excludes principals with NULL opp.stage (i.e., principals with zero opportunities).

### CORRECT: Move stage filter into JOIN

```sql
-- Corrected view with stage filter in JOIN ON clause
FROM organizations o
LEFT JOIN opportunities opp
  ON o.id = opp.principal_organization_id
  AND opp.deleted_at IS NULL
  AND (opp.stage NOT IN ('closed_won', 'closed_lost') OR opp.stage IS NULL)  -- ✅ IN JOIN
LEFT JOIN activities a
  ON opp.id = a.opportunity_id
  AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'
  AND o.deleted_at IS NULL
GROUP BY o.id, o.name;  -- Remove opp.account_manager_id from GROUP BY
```

**OR use COALESCE in WHERE:**

```sql
FROM organizations o
LEFT JOIN opportunities opp
  ON o.id = opp.principal_organization_id
  AND opp.deleted_at IS NULL
LEFT JOIN activities a
  ON opp.id = a.opportunity_id
  AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'
  AND o.deleted_at IS NULL
  AND (opp.stage IS NULL OR opp.stage NOT IN ('closed_won', 'closed_lost'))  -- ✅ COALESCE
GROUP BY o.id, o.name;
```

### Fix sales_id Aggregation

**Problem:** `GROUP BY o.id, o.name, opp.account_manager_id` groups by opportunity account manager, which:
1. Creates multiple rows per principal (one per account manager)
2. Breaks aggregation counts

**Solution:** Use MAX() or MIN() to pick one sales_id per principal:

```sql
SELECT
  o.id as principal_id,
  o.name as principal_name,
  COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage NOT IN ('closed_won', 'closed_lost')) as total_pipeline,
  -- ... other counts ...
  CASE
    -- Momentum logic (same)
  END as momentum,
  (SELECT t.title
   FROM tasks t
   INNER JOIN opportunities sub_opp ON t.opportunity_id = sub_opp.id
   WHERE sub_opp.principal_organization_id = o.id
     AND t.completed = false
     AND sub_opp.deleted_at IS NULL
   ORDER BY t.due_date ASC
   LIMIT 1) as next_action_summary,

  -- Pick one sales_id per principal (most recent opportunity's account manager)
  (SELECT account_manager_id
   FROM opportunities
   WHERE principal_organization_id = o.id
     AND deleted_at IS NULL
     AND account_manager_id IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 1) as sales_id

FROM organizations o
LEFT JOIN opportunities opp
  ON o.id = opp.principal_organization_id
  AND opp.deleted_at IS NULL
LEFT JOIN activities a
  ON opp.id = a.opportunity_id
  AND a.deleted_at IS NULL
WHERE o.organization_type = 'principal'
  AND o.deleted_at IS NULL
GROUP BY o.id, o.name;  -- ✅ Only group by principal fields
```

---

## Complete Corrected Migration SQL

```sql
-- Migration: Add principal_pipeline_summary view for Dashboard V3
-- Purpose: Aggregate opportunity pipeline data by principal organization
-- CORRECTED: Fixes LEFT JOIN, removes pipeline_value, proper sales_id aggregation

-- Add 'note' to interaction_type enum first
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'note';

-- Create the view
CREATE OR REPLACE VIEW principal_pipeline_summary AS
SELECT
  o.id as principal_id,
  o.name as principal_name,

  -- Count only non-closed opportunities
  COUNT(DISTINCT opp.id) FILTER (
    WHERE opp.stage NOT IN ('closed_won', 'closed_lost')
  ) as total_pipeline,

  -- Active this week: opportunities with activity in last 7 days
  COUNT(DISTINCT CASE
    WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      AND opp.stage NOT IN ('closed_won', 'closed_lost')
    THEN opp.id
  END) as active_this_week,

  -- Active last week: opportunities with activity 8-14 days ago
  COUNT(DISTINCT CASE
    WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
      AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      AND opp.stage NOT IN ('closed_won', 'closed_lost')
    THEN opp.id
  END) as active_last_week,

  -- Momentum calculation
  CASE
    -- Stale: has opportunities but no activity in 14 days
    WHEN COUNT(DISTINCT opp.id) FILTER (WHERE opp.stage NOT IN ('closed_won', 'closed_lost')) > 0
      AND COUNT(DISTINCT CASE
        WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        THEN opp.id
      END) = 0
    THEN 'stale'

    -- Increasing: more activity this week than last week
    WHEN COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END) > COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END)
    THEN 'increasing'

    -- Decreasing: less activity this week than last week
    WHEN COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END) < COUNT(DISTINCT CASE
      WHEN a.activity_date >= CURRENT_DATE - INTERVAL '14 days'
        AND a.activity_date < CURRENT_DATE - INTERVAL '7 days'
      THEN opp.id
    END)
    THEN 'decreasing'

    -- Steady: same activity level
    ELSE 'steady'
  END as momentum,

  -- Next action: earliest incomplete task for this principal's opportunities
  (SELECT t.title
   FROM tasks t
   INNER JOIN opportunities sub_opp ON t.opportunity_id = sub_opp.id
   WHERE sub_opp.principal_organization_id = o.id
     AND t.completed = false
     AND sub_opp.deleted_at IS NULL
   ORDER BY t.due_date ASC
   LIMIT 1
  ) as next_action_summary,

  -- Sales ID: account manager from most recent opportunity
  (SELECT account_manager_id
   FROM opportunities
   WHERE principal_organization_id = o.id
     AND deleted_at IS NULL
     AND account_manager_id IS NOT NULL
   ORDER BY created_at DESC
   LIMIT 1
  ) as sales_id

FROM organizations o

-- ✅ LEFT JOIN with stage filter IN the JOIN condition
LEFT JOIN opportunities opp
  ON o.id = opp.principal_organization_id
  AND opp.deleted_at IS NULL
  -- Stage filter here preserves LEFT JOIN behavior

LEFT JOIN activities a
  ON opp.id = a.opportunity_id
  AND a.deleted_at IS NULL

WHERE o.organization_type = 'principal'
  AND o.deleted_at IS NULL

-- ✅ Group only by principal fields
GROUP BY o.id, o.name;

-- Enable RLS
ALTER VIEW principal_pipeline_summary SET (security_invoker = true);

-- Grant permissions
GRANT SELECT ON principal_pipeline_summary TO authenticated;

-- RLS policy for team-wide access
CREATE POLICY select_principal_pipeline
ON principal_pipeline_summary
FOR SELECT
TO authenticated
USING (true);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_activities_activity_date_not_deleted
ON activities(activity_date DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_principal_org_not_deleted
ON opportunities(principal_organization_id)
WHERE deleted_at IS NULL;

-- Index for account_manager_id subquery
CREATE INDEX IF NOT EXISTS idx_opportunities_principal_created
ON opportunities(principal_organization_id, created_at DESC)
WHERE deleted_at IS NULL AND account_manager_id IS NOT NULL;
```

---

## Testing the Fixes

### 1. Test QuickLogForm Payload

```typescript
// In browser console after logging activity:
// Should see SQL INSERT with:
// - activity_type: 'interaction' or 'engagement'
// - type: 'call' | 'email' | 'meeting' | 'follow_up' | 'note'
// - outcome: user-selected value
// - NO errors about missing columns
```

### 2. Test "Note" Option

```typescript
// In Quick Logger UI:
// 1. Click "New Activity"
// 2. Activity Type dropdown should show "Note" option
// 3. Select "Note" + fill form + submit
// 4. Check database: activity_type should be 'engagement', type should be 'note'
```

### 3. Test View Returns Principals with Zero Opportunities

```sql
-- Query the view:
SELECT * FROM principal_pipeline_summary
WHERE total_pipeline = 0;

-- Should return principals with zero active opportunities
-- If empty, LEFT JOIN is still broken
```

### 4. Test Hook Doesn't Access pipeline_value

```typescript
// In browser console:
// Check PrincipalPipelineTable component state
// Should NOT have pipelineValue field
// No "undefined" values in UI
```

---

## Application Steps

1. **Apply enum migration** (Task 0.1)
   ```bash
   npx supabase migration new add_note_to_interaction_type
   # Copy SQL from Fix 2
   npm run db:cloud:push
   ```

2. **Apply view migration** (Task 0)
   ```bash
   # Use corrected SQL from "Complete Corrected Migration SQL"
   # Replace existing Task 0 migration content
   npm run db:cloud:push
   ```

3. **Update activitySchema.ts**
   - Add "Note" to activityTypeSchema enum
   - Add ACTIVITY_TYPE_MAP constant
   - Export constant

4. **Update QuickLogForm.tsx**
   - Import ACTIVITY_TYPE_MAP
   - Fix payload to use activity_type + type + outcome
   - Add "Note" to SelectContent
   - Write to follow_up_required and follow_up_date

5. **Update types.ts**
   - Remove pipelineValue from PrincipalPipelineRow interface

6. **Update usePrincipalPipeline.ts**
   - Remove pipelineValue from mapping

7. **Test all fixes**
   - Unit tests pass
   - E2E tests pass
   - Manual testing confirms data persists correctly

---

## Verification Checklist

- [ ] Enum migration applied: `\dT+ interaction_type` shows 'note'
- [ ] View migration applied: `\d+ principal_pipeline_summary` shows corrected columns
- [ ] View returns principals with zero opportunities
- [ ] QuickLogForm writes to activity_type, type, outcome columns
- [ ] "Note" option appears in UI dropdown
- [ ] Activity insert succeeds without SQL errors
- [ ] Hook doesn't reference pipeline_value
- [ ] No "undefined" values in dashboard UI
- [ ] Test coverage passes (70%+)
- [ ] TypeScript compilation succeeds
- [ ] E2E tests pass

---

## Risk Assessment

### High Risk (Blocking)
- ✅ QuickLogForm payload - FIXED (was: every insert would fail)
- ✅ LEFT JOIN issue - FIXED (was: missing principals with zero opps)

### Medium Risk
- ✅ "Note" option - FIXED (was: regression from requirements)
- ✅ pipeline_value - FIXED (was: undefined in UI)

### Low Risk
- Performance impact of subqueries in view (acceptable for <500 principals)
- sales_id selection logic (picks most recent opp's account manager)

---

## Recommended Next Steps

1. **Apply these fixes to CORRECTED plan** before implementation
2. **Run plan-reviewer again** to verify schema mappings are correct
3. **Test migration in local environment** before cloud deployment
4. **Verify E2E tests cover**:
   - Activity logging with all types (including Note)
   - Principals with zero opportunities appear in dashboard
   - No SQL errors in console

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Review Status:** Ready for application
