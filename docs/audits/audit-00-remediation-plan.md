# Crispy CRM Remediation Plan

**Generated:** 2025-12-12
**Status:** Ready for Execution
**Total Tasks:** 25 (4 P0, 5 P1, 9 P2, 7 P3)
**Est. Total Time (P0-P2):** ~19 hours

---

## 1. Prioritized Task List

### Priority Legend
- **P0:** Must fix before beta (blocks launch)
- **P1:** Should fix before beta (quality/performance)
- **P2:** Fix before launch (polish/consistency)
- **P3:** Nice to have (backlog)

| Priority | ID | Task | Category | Effort | Dependencies | Why This Priority |
|----------|-----|------|----------|--------|--------------|-------------------|
| **P0-1** | SEC-01 | Add SECURITY INVOKER to 3 views | Security | 15 min | None | RLS bypass risk |
| **P0-2** | VAL-01 | Add .max(500) to distributorAuthorizations notes | Validation | 5 min | None | DoS vector |
| **P0-3** | VAL-02 | Add .max(2000) to products description | Validation | 5 min | None | DoS vector |
| **P0-4** | VAL-03 | Add organizationNotes to TransformService | Validation | 20 min | None | File uploads broken |
| **P1-1** | UX-01 | Fix icon size in Organization ActivitiesTab | UI/UX | 10 min | None | WCAG violation |
| **P1-2** | SEC-02 | Add soft-delete to product_distributor_authorizations | Security | 30 min | None | Data integrity |
| **P1-3** | PERF-01 | Add tasks.sales_id partial index | Performance | 15 min | None | Slow task queries |
| **P1-4** | PERF-02 | Fix "last week" trend calculation | Performance | 2 hours | None | Inaccurate metrics |
| **P1-5** | FUNC-01 | Implement historical snapshot for trends | Missing | 4 hours | P1-4 | Week-over-week accuracy |
| **P2-1** | PAT-04 | Extract shared ActivityTimelineEntry component | Consistency | 2 hours | P1-1 | Reduce duplication |
| **P2-2** | PERF-03 | Add activities_opportunity_id index | Performance | 10 min | None | Query performance |
| **P2-3** | PERF-04 | Add tasks_opportunity_id index | Performance | 10 min | None | Query performance |
| **P2-4** | SEC-03 | Verify/add opportunity_notes soft-delete | Security | 30 min | None | Data integrity |
| **P2-5** | VAL-04 | Clean up deprecated stage enum value | Validation | 1 hour | None | Data cleanliness |
| **P2-6** | PAT-01 | Standardize validation function naming | Consistency | 1 hour | None | Maintainability |
| **P2-7** | PAT-02 | Move ContactNotesTab to slideOverTabs/ | Consistency | 15 min | None | Directory structure |
| **P2-8** | PAT-03 | Replace hardcoded page size with constant | Consistency | 10 min | None | Pattern consistency |
| **P2-9** | UX-02 | Document $or same-key limitation | Documentation | 30 min | None | Developer guidance |
| **P3-1** | PAT-05 | Remove double validation (optional) | Consistency | 2 hours | None | Minor perf gain |
| **P3-2** | PAT-06 | Align note type definitions | Consistency | 30 min | None | Type safety |
| **P3-3** | PERF-05 | Add request deduplication across tabs | Performance | 4 hours | None | Efficiency |
| **P3-4** | UX-03 | Add toast for silent filter cleanup | UI/UX | 30 min | None | UX feedback |
| **P3-5** | UX-04 | Show friendly labels for @ operators | UI/UX | 1 hour | None | Filter visibility |
| **P3-6** | FUNC-02 | Add cascade soft-delete for notes | Missing | 2 hours | None | Data consistency |
| **P3-7** | FUNC-03 | Add at-least-one-FK constraint to activities | Missing | 1 hour | None | Data integrity |

---

## 2. Execution Order Recommendation

### Phase 1: P0 Blockers (Monday Morning - 45 min)

Execute in this order:
1. **P0-1** SEC-01: SECURITY INVOKER migration
2. **P0-2** VAL-01: distributorAuthorizations .max()
3. **P0-3** VAL-02: products .max()
4. **P0-4** VAL-03: TransformService organizationNotes

### Phase 2: P1 Quality (Monday-Wednesday - 7 hours)

Execute in this order:
1. **P1-1** UX-01: Icon size fix (quick win)
2. **P1-2** SEC-02: Soft-delete migration
3. **P1-3** PERF-01: Tasks index
4. **P1-4 + P1-5**: Historical snapshot (combine as single task)

### Phase 3: P2 Polish (Week 2 - 6 hours)

Batch by cluster:
- **Cluster A (Indexes):** P2-2, P2-3 together (20 min total)
- **Cluster B (Patterns):** P2-6, P2-7, P2-8 together (1.5 hours)
- **Cluster C (Individual):** P2-1, P2-4, P2-5, P2-9 (5 hours)

### Phase 4: P3 Backlog (Future Sprints)

Defer to post-launch unless time permits.

---

## 3. Time Estimates Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1 (P0) | 4 | 45 min |
| Phase 2 (P1) | 5 | 7 hours |
| Phase 3 (P2) | 9 | 6 hours |
| **Total (P0-P2)** | **18** | **~14 hours** |
| Phase 4 (P3) | 7 | 11 hours |

---

## 4. Detailed Task Specs

### P0-1: Add SECURITY INVOKER to 3 Views

**ID:** SEC-01
**File(s):** `supabase/migrations/[timestamp]_security_invoker_final_views.sql` (CREATE)
**Effort:** 15 min

**What to do:**
1. Create new migration file
2. Drop and recreate `contact_duplicates`, `duplicate_stats`, `authorization_status` views
3. Add `WITH (security_invoker = on)` to each view definition

**SQL Template:**
```sql
-- Migration: Add SECURITY INVOKER to remaining views
-- Priority: P0 (Security)

-- Step 1: Backup current view definitions (for reference)
-- SELECT definition FROM pg_views WHERE viewname IN ('contact_duplicates', 'duplicate_stats', 'authorization_status');

-- Step 2: Recreate contact_duplicates
DROP VIEW IF EXISTS contact_duplicates;
CREATE VIEW contact_duplicates
WITH (security_invoker = on) AS
SELECT
  c1.id as id1,
  c2.id as id2,
  c1.first_name,
  c1.last_name,
  c1.email
FROM contacts c1
JOIN contacts c2 ON c1.email = c2.email AND c1.id < c2.id
WHERE c1.deleted_at IS NULL AND c2.deleted_at IS NULL;

-- Step 3: Recreate duplicate_stats
DROP VIEW IF EXISTS duplicate_stats;
CREATE VIEW duplicate_stats
WITH (security_invoker = on) AS
SELECT
  'contacts' as entity_type,
  COUNT(*) as duplicate_count
FROM contact_duplicates;

-- Step 4: Recreate authorization_status
DROP VIEW IF EXISTS authorization_status;
CREATE VIEW authorization_status
WITH (security_invoker = on) AS
SELECT
  dpa.id,
  dpa.distributor_id,
  dpa.principal_id,
  dpa.status,
  dpa.effective_date,
  dpa.expiration_date,
  CASE
    WHEN dpa.expiration_date < CURRENT_DATE THEN 'expired'
    WHEN dpa.effective_date > CURRENT_DATE THEN 'pending'
    ELSE 'active'
  END as computed_status
FROM distributor_principal_authorizations dpa
WHERE dpa.deleted_at IS NULL;
```

**Verification:**
- [ ] Migration applies without errors
- [ ] `SELECT * FROM pg_views WHERE viewname = 'contact_duplicates'` shows view exists
- [ ] Query each view as non-admin user to verify RLS enforced

**Related tasks:** None

---

### P0-2: Add .max() to distributorAuthorizations Notes

**ID:** VAL-01
**File(s):** `src/atomic-crm/validation/distributorAuthorizations.ts` (MODIFY)
**Line:** 147
**Effort:** 5 min

**What to do:**
Change:
```typescript
notes: z.string().optional(),
```
To:
```typescript
notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
```

**Verification:**
- [ ] TypeScript compiles without errors
- [ ] Test submitting form with >500 char notes (should reject)

**Related tasks:** P0-3 (similar change)

---

### P0-3: Add .max() to Products Description

**ID:** VAL-02
**File(s):** `src/atomic-crm/validation/products.ts` (MODIFY)
**Line:** 62
**Effort:** 5 min

**What to do:**
Change:
```typescript
description: z.string().optional(),
```
To:
```typescript
description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
```

**Verification:**
- [ ] TypeScript compiles without errors
- [ ] Test submitting form with >2000 char description (should reject)

**Related tasks:** P0-2 (similar change)

---

### P0-4: Add organizationNotes to TransformService

**ID:** VAL-03
**File(s):** `src/atomic-crm/providers/supabase/TransformService.ts` (MODIFY)
**Effort:** 20 min

**What to do:**
1. Find the attachment transformer registry (around line 100-150)
2. Add `organizationNotes` to the list of resources that process attachments
3. Ensure the attachment upload logic handles organization_id foreign key

**Code to add:**
```typescript
// In the transformer registry
organizationNotes: {
  attachments: async (data: any, resource: string) => {
    // Same pattern as contactNotes and opportunityNotes
    return this.processAttachments(data, resource);
  }
}
```

**Verification:**
- [ ] Create organization note with attachment
- [ ] Verify file uploads to Supabase Storage
- [ ] Verify attachment URL saved to note record

**Related tasks:** None

---

### P1-1: Fix Icon Size in Organization ActivitiesTab

**ID:** UX-01
**File(s):** `src/atomic-crm/organizations/ActivitiesTab.tsx` (MODIFY)
**Line:** 110
**Effort:** 10 min

**What to do:**
Change:
```tsx
<div className="w-8 h-8 ...">
```
To:
```tsx
<div className="w-11 h-11 ...">
```

**Verification:**
- [ ] Icon container is now 44x44px (inspect in browser)
- [ ] Visual appearance matches Contact ActivitiesTab

**Related tasks:** P2-1 (extract shared component)

---

### P1-2: Add Soft-Delete to product_distributor_authorizations

**ID:** SEC-02
**File(s):** `supabase/migrations/[timestamp]_add_soft_delete_product_distributor_authorizations.sql` (CREATE)
**Effort:** 30 min

**What to do:**
```sql
-- Add deleted_at column
ALTER TABLE product_distributor_authorizations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_product_distributor_auth_deleted_at
ON product_distributor_authorizations (deleted_at)
WHERE deleted_at IS NULL;

-- Update RLS SELECT policy
DROP POLICY IF EXISTS authenticated_select_product_distributor_authorizations
  ON product_distributor_authorizations;

CREATE POLICY authenticated_select_product_distributor_authorizations
  ON product_distributor_authorizations
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
```

**Verification:**
- [ ] Column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'product_distributor_authorizations' AND column_name = 'deleted_at'`
- [ ] RLS policy includes soft-delete filter

**Related tasks:** P2-4 (similar for opportunity_notes)

---

### P1-3: Add tasks.sales_id Partial Index

**ID:** PERF-01
**File(s):** `supabase/migrations/[timestamp]_add_tasks_sales_id_index.sql` (CREATE)
**Effort:** 15 min

**What to do:**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_sales_id_not_completed
ON tasks (sales_id)
WHERE completed = false AND deleted_at IS NULL;
```

**Verification:**
- [ ] Index exists: `SELECT indexname FROM pg_indexes WHERE tablename = 'tasks' AND indexname = 'idx_tasks_sales_id_not_completed'`
- [ ] Dashboard task queries are faster (check query plan)

**Related tasks:** P2-2, P2-3 (batch all indexes together)

---

### P1-4 + P1-5: Historical Snapshot for Week-over-Week Trends

**ID:** PERF-02 + FUNC-01
**File(s):** Multiple
**Effort:** 4-6 hours

**What to do:**

**Option A: Snapshot Table (Recommended)**
1. Create `opportunity_snapshots` table
2. Create Edge Function or cron job to insert daily snapshot
3. Update `useMyPerformance.ts` to query snapshots

**Migration:**
```sql
CREATE TABLE opportunity_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL UNIQUE,
  open_count INTEGER NOT NULL,
  by_stage JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE opportunity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_snapshots ON opportunity_snapshots
  FOR SELECT TO authenticated USING (true);
```

**Hook Update:**
```typescript
// useMyPerformance.ts
const lastWeekSnapshot = await dataProvider.getOne("opportunity_snapshots", {
  filter: { snapshot_date: formatDate(startOfLastWeek) }
});
const lastWeekOpenCount = lastWeekSnapshot?.open_count ?? currentOpenCount;
```

**Verification:**
- [ ] Snapshot table exists and has RLS
- [ ] Daily job populates snapshot
- [ ] Dashboard shows meaningful week-over-week trend

**Related tasks:** None

---

### P2-1: Extract Shared ActivityTimelineEntry Component

**ID:** PAT-04
**File(s):**
- `src/atomic-crm/activities/components/ActivityTimelineEntry.tsx` (CREATE)
- `src/atomic-crm/contacts/ActivitiesTab.tsx` (MODIFY)
- `src/atomic-crm/organizations/ActivitiesTab.tsx` (MODIFY)
**Effort:** 2 hours

**What to do:**
1. Create shared `ActivityTimelineEntry` component with props for:
   - `activity` data
   - `showOrganizationLink: boolean`
   - `showContactLink: boolean`
2. Replace duplicated JSX in both ActivitiesTab files with shared component
3. Ensure consistent 44px touch targets

**Verification:**
- [ ] Both ActivitiesTab files use shared component
- [ ] Visual appearance unchanged
- [ ] Touch targets consistent (44px)

**Related tasks:** P1-1 (prerequisite)

---

### P2-2: Add activities_opportunity_id Index

**ID:** PERF-03
**File(s):** `supabase/migrations/[timestamp]_add_activities_opportunity_index.sql` (CREATE)
**Effort:** 10 min

**What to do:**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_opportunity_id
ON activities (opportunity_id)
WHERE deleted_at IS NULL;
```

**Verification:**
- [ ] Index exists in pg_indexes

**Related tasks:** P2-3 (batch together)

---

### P2-3: Add tasks_opportunity_id Index

**ID:** PERF-04
**File(s):** Same migration as P2-2
**Effort:** 10 min

**What to do:**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_opportunity_id
ON tasks (opportunity_id)
WHERE deleted_at IS NULL;
```

**Verification:**
- [ ] Index exists in pg_indexes

**Related tasks:** P2-2 (batch together)

---

### P2-4: Verify/Add opportunity_notes Soft-Delete

**ID:** SEC-03
**File(s):** May need migration
**Effort:** 30 min

**What to do:**
1. Check if `deleted_at` column exists:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'opportunity_notes' AND column_name = 'deleted_at';
```
2. If missing, add column and update RLS policies (same pattern as P1-2)

**Verification:**
- [ ] Column exists
- [ ] RLS policy filters soft-deleted records

**Related tasks:** P1-2 (similar pattern)

---

### P2-5: Clean Up Deprecated Stage Enum Value

**ID:** VAL-04
**File(s):** Migration required
**Effort:** 1 hour

**What to do:**
1. Check for records using deprecated stage:
```sql
SELECT COUNT(*) FROM opportunities WHERE stage = 'awaiting_response';
```
2. If zero, safe to remove from enum (requires type recreation)
3. If non-zero, migrate data first

**Verification:**
- [ ] No records use deprecated value
- [ ] Enum no longer includes `awaiting_response`

**Related tasks:** None

---

### P2-6: Standardize Validation Function Naming

**ID:** PAT-01
**File(s):** `src/atomic-crm/validation/*.ts` (MODIFY)
**Effort:** 1 hour

**What to do:**
Rename functions to follow `validate{Resource}Create` / `validate{Resource}Update` pattern:
- `validateContactForm` → `validateContactCreate`
- `validateUpdateContact` → `validateContactUpdate`
- etc.

**Verification:**
- [ ] All validation functions follow pattern
- [ ] All imports updated
- [ ] TypeScript compiles

**Related tasks:** None

---

### P2-7: Move ContactNotesTab to slideOverTabs/

**ID:** PAT-02
**File(s):**
- `src/atomic-crm/contacts/ContactNotesTab.tsx` → `src/atomic-crm/contacts/slideOverTabs/ContactNotesTab.tsx`
**Effort:** 15 min

**What to do:**
1. Move file to slideOverTabs directory
2. Update all imports

**Verification:**
- [ ] File in correct location
- [ ] No broken imports

**Related tasks:** None

---

### P2-8: Replace Hardcoded Page Size with Constant

**ID:** PAT-03
**File(s):** `src/atomic-crm/contacts/ActivitiesTab.tsx` (MODIFY)
**Line:** ~25
**Effort:** 10 min

**What to do:**
Change:
```typescript
perPage: 50
```
To:
```typescript
import { ACTIVITY_PAGE_SIZE } from '../constants';
// ...
perPage: ACTIVITY_PAGE_SIZE
```

**Verification:**
- [ ] Constant used consistently

**Related tasks:** P2-1 (will be addressed in refactor)

---

### P2-9: Document $or Same-Key Limitation

**ID:** UX-02
**File(s):** `CLAUDE.md` (MODIFY)
**Effort:** 30 min

**What to do:**
Add to CLAUDE.md under Engineering Principles:
```markdown
### Filter Patterns

**$or Limitation:** Same-key alternatives not supported in PostgREST
- WRONG: `{ $or: [{ stage: "a" }, { stage: "b" }] }` → Last value wins
- CORRECT: `{ "stage@in": ["a", "b"] }` → Use array filter instead
```

**Verification:**
- [ ] Documentation added to CLAUDE.md

**Related tasks:** None

---

## 5. Verification Checklist

### P0 Complete
- [ ] All 3 views have SECURITY INVOKER
- [ ] distributorAuthorizations notes has .max(500)
- [ ] products description has .max(2000)
- [ ] organizationNotes file uploads work

### P1 Complete
- [ ] Organization ActivitiesTab icons are 44px
- [ ] product_distributor_authorizations has deleted_at
- [ ] tasks.sales_id index exists
- [ ] Week-over-week trends are accurate

### P2 Complete
- [ ] All indexes created (activities_opportunity_id, tasks_opportunity_id)
- [ ] opportunity_notes soft-delete verified
- [ ] Deprecated stage value removed
- [ ] ActivityTimelineEntry extracted
- [ ] Validation naming standardized
- [ ] ContactNotesTab in slideOverTabs/
- [ ] Page size constant used
- [ ] $or limitation documented

---

## 6. Post-Remediation Actions

1. **Run full test suite** after each phase
2. **Deploy to staging** after P0 complete
3. **Run Supabase advisors** to verify no new security issues:
   ```sql
   SELECT * FROM supabase_functions.get_advisors('security');
   ```
4. **Update audit status** in executive summary

---

**Plan Status:** Ready for Execution
**Next Step:** Start with P0-1 (SECURITY INVOKER migration)
