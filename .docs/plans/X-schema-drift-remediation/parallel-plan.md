# Schema Drift Remediation - DEV ENVIRONMENT (Constitution-Compliant)

**ENVIRONMENT**: Development only (test data)
**CONSTITUTION COMPLIANCE**: ✅ Rule #1 (NO OVER-ENGINEERING - Fail Fast)
**VALIDATION**: Simplified from parallel-plan-FINAL.md (2025-10-08)

**CRITICAL DIFFERENCE FROM FINAL PLAN**: This is a dev environment with test data. We **fail fast and fix forward**, not build elaborate safety nets. No backups, no rollback procedures, no gradual deployment. If it breaks, we fix it.

---

## Engineering Constitution Alignment

### ✅ Following Constitution Rules

**Rule #1: NO OVER-ENGINEERING**
- ❌ No pre-deployment backups (it's test data)
- ❌ No elaborate rollback procedures
- ❌ No health monitoring dashboards
- ❌ No gradual deployment strategies
- ✅ Fail fast, fix forward

**Rule #2: SINGLE SOURCE OF TRUTH**
- ✅ Zod schemas at API boundary (`src/atomic-crm/validation/`)
- ✅ Database migrations sync TO Zod, not from
- ✅ No duplicate validation layers

**Rule #9: MIGRATIONS**
- ✅ Timestamp format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20251008120000_fix_opportunity_stage_enum.sql`

---

## Implementation Plan

### Phase 0: Quick Audit (1-2 hours max)

**Purpose**: Understand current database state before making changes. READ-ONLY phase.

#### Task 0.1: Check Database Enums

**Instructions**:
```sql
-- Quick enum check
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'opportunity_stage'::regtype
ORDER BY enumsortorder;

SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'task_type'::regtype
ORDER BY enumsortorder;
```

**Compare against**:
- Zod schemas in `src/atomic-crm/validation/opportunities.ts`
- ConfigurationProvider in `src/atomic-crm/root/defaultConfiguration.ts`

**Document findings**: Quick notes in this file or terminal output. No extensive documentation needed.

**Decision**:
- If database matches Zod → skip database migrations
- If database matches ConfigurationProvider → need migration first
- If database has other values → investigate why

---

#### Task 0.2: Check Actual Data

**Instructions**:
```sql
-- Quick data check
SELECT stage, COUNT(*) FROM opportunities
WHERE deleted_at IS NULL
GROUP BY stage;

SELECT type, COUNT(*) FROM tasks
WHERE deleted_at IS NULL
GROUP BY type;
```

**Document**: Just note if any unexpected values exist. If found, we'll fix them during migration.

---

### Phase 1: Filter Registry & Resource Mapping

#### Task 1.1: Remove Non-Existent Fields from Filter Registry

**Files**: `src/atomic-crm/filters/filterRegistry.ts`

**Changes**:
1. Remove `nb_tasks` from contacts
2. Remove `segment` from contacts (if it doesn't exist in database)
3. Remove `industry` from contacts (migrated to organizations)
4. Remove `organization_id` from tasks (if not needed)

**Testing**: Run `npm run build` - TypeScript should compile

---

#### Task 1.2: Fix Resource Names in Filter Registry

**File**: `src/atomic-crm/filters/filterRegistry.ts`

**Changes**:
1. Rename `contactNotes` → `contact_notes`
2. Rename `opportunityNotes` → `opportunity_notes`

**Why**: Must match Supabase table names exactly

**Testing**: Test filter UI in dev server

---

#### Task 1.3: Add Missing Opportunity Filters

**File**: `src/atomic-crm/filters/filterRegistry.ts`

**Add**:
- `sales_id` (UUID)
- `created_at` (date)
- `updated_at` (date)

**Testing**: Verify filters appear in UI

---

### Phase 1.5: Database Migrations (CONDITIONAL)

**RUN ONLY IF**: Phase 0 found database enums don't match Zod schemas

#### Task 1.4: Migrate Enums (If Needed)

**Create**: `supabase/migrations/20251008120000_fix_opportunity_stage_enum.sql`

**Migration SQL**:
```sql
-- Fix opportunity_stage enum to match Zod schema
-- Pattern: Create new type, migrate data, swap

CREATE TYPE opportunity_stage_new AS ENUM (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'awaiting_response',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
);

ALTER TABLE opportunities ADD COLUMN stage_new opportunity_stage_new;

-- Map old values to new (adjust based on Phase 0 findings)
UPDATE opportunities SET stage_new =
  CASE stage::text
    WHEN 'lead' THEN 'new_lead'::opportunity_stage_new
    WHEN 'qualified' THEN 'initial_outreach'::opportunity_stage_new
    WHEN 'proposal' THEN 'demo_scheduled'::opportunity_stage_new
    WHEN 'closed_won' THEN 'closed_won'::opportunity_stage_new
    WHEN 'closed_lost' THEN 'closed_lost'::opportunity_stage_new
    -- Add others based on actual data
  END;

-- Check for unmapped values (should return 0 rows)
SELECT stage, COUNT(*) FROM opportunities
WHERE stage_new IS NULL AND deleted_at IS NULL
GROUP BY stage;

-- If any NULLs found, fix them manually then continue:

ALTER TABLE opportunities DROP COLUMN stage;
DROP TYPE opportunity_stage;
ALTER TYPE opportunity_stage_new RENAME TO opportunity_stage;
ALTER TABLE opportunities RENAME COLUMN stage_new TO stage;
ALTER TABLE opportunities ALTER COLUMN stage SET NOT NULL;

COMMENT ON COLUMN opportunities.stage IS
  'Must match opportunityStageSchema in validation/opportunities.ts';
```

**Deploy**: `npm run supabase:deploy`

**If it fails**: Fix the SQL and run again. No rollback needed - it's test data.

---

#### Task 1.5: Recreate Views (If Needed)

**Create**: `supabase/migrations/20251008130000_recreate_summary_views.sql`

```sql
-- Drop and recreate contacts_summary
DROP VIEW IF EXISTS contacts_summary CASCADE;

CREATE OR REPLACE VIEW contacts_summary
WITH (security_invoker = false) AS
SELECT
  c.id,
  c.name,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.organization_id,
  o.name AS company_name,
  c.sales_id,
  c.created_at,
  c.updated_at,
  c.tags
FROM contacts c
LEFT JOIN organizations o ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;

GRANT SELECT ON contacts_summary TO authenticated;
GRANT SELECT ON contacts_summary TO anon;
```

**Deploy**: `npm run supabase:deploy`

---

### Phase 2: Remove Legacy Field References

#### Task 2.1: Remove All `company_id` References

**Files to modify** (9+ files):
- `src/atomic-crm/contacts/ContactShow.tsx`
- `src/atomic-crm/contacts/ContactEdit.tsx`
- `src/atomic-crm/contacts/ContactCreate.tsx`
- `src/atomic-crm/contacts/ContactListContent.tsx`
- `src/atomic-crm/opportunities/OpportunityShow.tsx`
- `src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `src/atomic-crm/opportunities/OpportunityCreate.tsx`
- `src/atomic-crm/opportunities/OpportunitiesPipeline.tsx`
- Any other files using `company_id`

**Changes**:
1. Find: `company_id`
2. Replace with: `organization_id` OR `customer_organization_id` (depending on context)

**For synthetic fields**:
```typescript
// OLD: Creating synthetic company_id
const withCompany = contacts.map(c => ({
  ...c,
  company_id: c.organizations?.find(o => o.is_primary)?.organization_id
}));

// NEW: Use organization_id directly
// OR update ReferenceField to use correct source
<ReferenceField source="organization_id" reference="organizations">
  <TextField source="name" />
</ReferenceField>
```

**Testing**:
- `npm run build` (TypeScript check)
- Test contact/opportunity views in browser
- Verify organization references display correctly

---

#### Task 2.2: Remove `industry` from Contacts

**Files**: Contact components using `industry` field

**Changes**: Remove all `industry` references from contacts (migrated to organizations)

**Testing**: Build and verify UI

---

### Phase 3: Fix Form Defaults (Constitution #5)

#### Task 3.1: Remove `defaultValue` Props

**Files**: `src/atomic-crm/opportunities/OpportunityCreate.tsx` and similar

**Problem**: Form inputs using `defaultValue` prop violates Constitution #5

**Changes**:
```typescript
// REMOVE defaultValue from inputs
<SelectInput
  source="stage"
  // defaultValue="new_lead" ❌ REMOVE THIS
  choices={stageChoices}
/>

// Instead, defaults come from React Hook Form defaultValues
// which are generated from Zod schema using .partial().parse({})
```

**Testing**: Form should still initialize with correct defaults from Zod schema

---

### Phase 4: Configuration & Validation Alignment

#### Task 4.1: Fix Task Type Validation

**File**: `src/atomic-crm/validation/tasks.ts`

**Change**: Update Zod enum to match database
```typescript
export const taskTypeSchema = z.enum([
  'call',
  'email',
  'meeting',
  'todo',
  'follow_up'
]);
```

**Testing**: Create/edit tasks - validation should work

---

#### Task 4.2: Fix ConfigurationProvider Opportunity Stages

**⚠️ DEPENDS ON**: Task 1.4 (if database migration was needed)

**File**: `src/atomic-crm/root/defaultConfiguration.ts`

**Change**: Update to match Zod schema
```typescript
export const defaultConfiguration: Configuration = {
  opportunityPipelineStages: [
    { value: 'new_lead', label: 'New Lead' },
    { value: 'initial_outreach', label: 'Initial Outreach' },
    { value: 'sample_visit_offered', label: 'Sample Visit Offered' },
    { value: 'awaiting_response', label: 'Awaiting Response' },
    { value: 'feedback_logged', label: 'Feedback Logged' },
    { value: 'demo_scheduled', label: 'Demo Scheduled' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' }
  ]
};
```

**Testing**: Pipeline view should show correct stages

---

#### Task 4.3: Update Environment Variables

**File**: `.env` and deployment configs

**Change**:
```bash
# Update default stage
OPPORTUNITY_DEFAULT_STAGE=new_lead

# Update pipeline stages
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost
```

**Testing**: Restart dev server, verify env vars loaded

---

### Phase 5: Type Generation & Simple Deploy

#### Task 5.1: Regenerate TypeScript Types

**Command**: `npm run supabase:types` (or use MCP tool)

**Verify**: Check `src/types/database.generated.ts` has correct types

---

#### Task 5.2: Basic Testing

**Run**:
```bash
npm run build          # TypeScript check
npm run lint           # Code quality
npm test               # Run tests
```

**Manual Tests**:
- Create opportunity with new stages
- Create task with correct types
- View contacts with organization references
- Test filters work

**If anything fails**: Fix it and re-test. No elaborate verification needed.

---

### Phase 6: Simple Deploy

#### Task 6.1: Deploy Everything

**Instructions**:
```bash
# 1. Deploy database migrations (if any from Phase 1.5)
npm run supabase:deploy

# 2. Build frontend
npm run build

# 3. Deploy (GitHub Pages)
npm run prod:deploy

# 4. Clear caches
# Open browser console and run:
localStorage.clear();
window.location.reload();
```

**If broken**: Fix the issue and deploy again. No rollback procedures needed.

**Monitoring**: Just watch for errors in browser console and Supabase logs for a bit.

---

## Summary

### Constitution Compliance

✅ **No Over-Engineering**: No backups, rollbacks, monitoring, or gradual deployment
✅ **Fail Fast**: If migrations fail, fix SQL and re-run
✅ **Single Source of Truth**: Zod at API boundary
✅ **Migration Format**: YYYYMMDDHHMMSS_name.sql

### Total Tasks: 15 tasks across 6 phases

**Phase 0**: Quick audit (1-2 hours)
**Phase 1**: Filter fixes (1-2 hours)
**Phase 1.5**: Database migrations if needed (2-4 hours)
**Phase 2**: Remove legacy fields (2-3 hours)
**Phase 3**: Form defaults (1 hour)
**Phase 4**: Config alignment (1-2 hours)
**Phase 5**: Types & testing (1 hour)
**Phase 6**: Deploy (30 minutes)

**Total Estimate**: 1-2 days (not 4-6 days with production safety nets)

### Risk Level: Low

- It's test data - worst case, we regenerate it
- Migrations can be re-run if they fail
- No users to disrupt
- Can fix forward immediately

### Key Differences from parallel-plan-FINAL.md

**REMOVED**:
- ❌ Pre-deployment backups
- ❌ Rollback procedures
- ❌ Deployment runbooks
- ❌ Monitoring dashboards
- ❌ Complex cache versioning
- ❌ Gradual deployment strategies
- ❌ Post-deployment verification checklists

**KEPT**:
- ✅ Phase 0 quick audit
- ✅ Database migrations (simplified)
- ✅ Code updates
- ✅ Type generation
- ✅ Basic testing

**PHILOSOPHY**: Fail fast, fix forward. Build for production later.
