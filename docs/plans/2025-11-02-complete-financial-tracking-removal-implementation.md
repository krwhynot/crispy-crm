# Complete Financial Tracking Removal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all financial tracking from Atomic CRM (dashboard components, database fields, supporting code) to complete relationship-focused architecture

**Architecture:** Three-phase removal - UI components first (safe), then database migration with type regeneration, then supporting code cleanup

**Tech Stack:** React, TypeScript, Supabase (PostgreSQL), Vitest

---

## Task 1: Remove OpportunitiesChart Component from Dashboard

**Files:**
- Delete: `src/atomic-crm/dashboard/OpportunitiesChart.tsx`
- Modify: `src/atomic-crm/dashboard/Dashboard.tsx:4,53`

**Context:** The OpportunitiesChart component displays a monthly revenue chart using `opportunity.amount` field. It's conditionally rendered on the dashboard. Removing it is safe because it's a self-contained component.

**Step 1: Verify component is only used in Dashboard.tsx**

Run:
```bash
grep -r "OpportunitiesChart" src/ --include="*.tsx" --include="*.ts"
```

Expected output:
```
src/atomic-crm/dashboard/Dashboard.tsx:import { OpportunitiesChart } from "./OpportunitiesChart";
src/atomic-crm/dashboard/Dashboard.tsx:          {totalOpportunities ? <OpportunitiesChart /> : null}
src/atomic-crm/dashboard/OpportunitiesChart.tsx:export const OpportunitiesChart = () => {
```

If other files import it, STOP and ask for guidance.

**Step 2: Remove import from Dashboard.tsx**

In `src/atomic-crm/dashboard/Dashboard.tsx`, delete line 4:

```typescript
// DELETE THIS LINE:
import { OpportunitiesChart } from "./OpportunitiesChart";
```

**Step 3: Remove component usage from Dashboard.tsx**

In `src/atomic-crm/dashboard/Dashboard.tsx`, delete line 53:

```typescript
// DELETE THIS LINE:
          {totalOpportunities ? <OpportunitiesChart /> : null}
```

**Step 4: Delete component file**

Run:
```bash
rm src/atomic-crm/dashboard/OpportunitiesChart.tsx
```

**Step 5: Run type check**

Run:
```bash
npm run typecheck
```

Expected: ✅ No TypeScript errors

**Step 6: Run tests**

Run:
```bash
npm test
```

Expected: ✅ All tests pass (660+ tests)

**Step 7: Commit changes**

```bash
git add src/atomic-crm/dashboard/Dashboard.tsx
git add src/atomic-crm/dashboard/OpportunitiesChart.tsx  # Registers deletion
git commit -m "refactor(dashboard): remove OpportunitiesChart component

Remove monthly revenue chart component that displays opportunity amounts.
Part of complete financial tracking removal.

Related: docs/plans/2025-11-02-complete-financial-tracking-removal-design.md"
```

---

## Task 2: Remove OpportunitiesPipeline Component (Orphaned File)

**Files:**
- Delete: `src/atomic-crm/dashboard/OpportunitiesPipeline.tsx`

**Context:** OpportunitiesPipeline.tsx exists but is not imported anywhere (orphaned file from earlier refactoring). It displays pipeline with currency-formatted amounts. Safe to delete.

**Step 1: Verify file is not imported anywhere**

Run:
```bash
grep -r "OpportunitiesPipeline" src/ --include="*.tsx" --include="*.ts" --exclude="OpportunitiesPipeline.tsx"
```

Expected: No output (file is orphaned)

If output exists, STOP and ask for guidance.

**Step 2: Delete component file**

Run:
```bash
rm src/atomic-crm/dashboard/OpportunitiesPipeline.tsx
```

**Step 3: Run type check**

Run:
```bash
npm run typecheck
```

Expected: ✅ No TypeScript errors

**Step 4: Run tests**

Run:
```bash
npm test
```

Expected: ✅ All tests pass

**Step 5: Commit changes**

```bash
git add src/atomic-crm/dashboard/OpportunitiesPipeline.tsx  # Registers deletion
git commit -m "refactor(dashboard): remove orphaned OpportunitiesPipeline component

Remove unused pipeline component with currency formatting.
Part of complete financial tracking removal.

Related: docs/plans/2025-11-02-complete-financial-tracking-removal-design.md"
```

---

## Task 3: Create Database Migration to Drop Financial Columns

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_remove_financial_tracking.sql` (timestamp auto-generated)

**Context:** Create migration to drop financial columns from opportunities, organizations, and opportunity_participants tables, plus the orphaned pricing_model_type enum. Must test on local database before cloud deployment.

**Step 1: Create migration file with correct timestamp**

Run:
```bash
npx supabase migration new remove_financial_tracking
```

Expected output:
```
Created new migration at supabase/migrations/YYYYMMDDHHMMSS_remove_financial_tracking.sql
```

**Step 2: Write migration SQL**

Open the newly created migration file and add this content:

```sql
-- Remove Financial Tracking: Complete Removal
--
-- Context: Final phase of relationship-focused CRM transformation
-- Previous: October 2025 removed product pricing (list_price, unit_price, etc.)
-- This migration: Remove opportunity/organization financial tracking
--
-- Drops:
-- - opportunities.amount (deal value tracking)
-- - organizations.annual_revenue (company revenue)
-- - opportunity_participants.commission_rate (sales compensation)
-- - pricing_model_type enum (orphaned from previous table removal)

-- Drop opportunity deal value tracking
ALTER TABLE opportunities
  DROP COLUMN IF EXISTS amount;

-- Drop organization revenue tracking
ALTER TABLE organizations
  DROP COLUMN IF EXISTS annual_revenue;

-- Drop sales commission tracking
ALTER TABLE opportunity_participants
  DROP COLUMN IF EXISTS commission_rate;

-- Drop orphaned enum (tables using it were dropped in 20251031132404)
DROP TYPE IF EXISTS pricing_model_type CASCADE;

-- Rationale: Atomic CRM is relationship-focused, not sales-focused
-- Financial data (if needed) is tracked externally in accounting systems
```

**Step 3: Reset local database to apply migration**

Run:
```bash
npx supabase db reset
```

Expected output shows migration applied:
```
Applying migration YYYYMMDDHHMMSS_remove_financial_tracking.sql...
```

**Step 4: Verify columns dropped using psql**

Run:
```bash
psql -h localhost -p 54322 -U postgres -d postgres -c "\d opportunities"
```

Expected: Table description should NOT show `amount` column

Run:
```bash
psql -h localhost -p 54322 -U postgres -d postgres -c "\d organizations"
```

Expected: Table description should NOT show `annual_revenue` column

Run:
```bash
psql -h localhost -p 54322 -U postgres -d postgres -c "\d opportunity_participants"
```

Expected: Table description should NOT show `commission_rate` column

**Step 5: Verify enum dropped**

Run:
```bash
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT * FROM pg_type WHERE typname = 'pricing_model_type';"
```

Expected: 0 rows returned

**Step 6: Commit migration file**

```bash
git add supabase/migrations/*_remove_financial_tracking.sql
git commit -m "feat(db): drop financial tracking columns and orphaned enum

Remove financial columns:
- opportunities.amount
- organizations.annual_revenue
- opportunity_participants.commission_rate
- pricing_model_type enum (orphaned)

Part of complete financial tracking removal.

Related: docs/plans/2025-11-02-complete-financial-tracking-removal-design.md"
```

---

## Task 4: Regenerate TypeScript Types from Updated Schema

**Files:**
- Modify: `src/types/database.generated.ts` (entire file auto-regenerated)

**Context:** After dropping database columns, we must regenerate TypeScript types to match the new schema. This will remove ~40 lines of type definitions for the dropped fields.

**Step 1: Regenerate types from local database**

Run:
```bash
npx supabase gen types typescript --local > src/types/database.generated.ts
```

Expected: File updated successfully (no error output)

**Step 2: Verify removed fields are gone from types**

Check that these fields are NO LONGER in `src/types/database.generated.ts`:

Run:
```bash
grep -E "amount|annual_revenue|commission_rate|pricing_model_type" src/types/database.generated.ts
```

Expected: No output (fields removed from types)

If grep finds matches, check if they're in comments or unrelated contexts. The actual field definitions should be gone.

**Step 3: Run type check to find broken code**

Run:
```bash
npm run typecheck
```

Expected: Possibly some errors if code references removed fields (we'll fix in next tasks)

Note the error locations - these need updating in cleanup tasks.

**Step 4: Commit regenerated types**

```bash
git add src/types/database.generated.ts
git commit -m "chore(types): regenerate database types after financial field removal

Regenerate TypeScript types to match schema after dropping:
- opportunities.amount
- organizations.annual_revenue
- opportunity_participants.commission_rate
- pricing_model_type enum

Removes ~40 lines of obsolete type definitions.

Related: docs/plans/2025-11-02-complete-financial-tracking-removal-design.md"
```

---

## Task 5: Update Test Mock Providers to Remove Financial Fields

**Files:**
- Modify: `src/tests/utils/mock-providers.ts:193`

**Context:** The `createMockOpportunity` function generates fake opportunity data including `amount` field. This field no longer exists in the database schema, so we must remove it from mock data.

**Step 1: Read current mock function**

Open `src/tests/utils/mock-providers.ts` and find the `createMockOpportunity` function (around line 193).

**Step 2: Remove amount field from mock data**

In `src/tests/utils/mock-providers.ts`, find and remove the `amount` line from `createMockOpportunity`:

```typescript
// BEFORE (around line 193-210):
export const createMockOpportunity = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.company.catchPhrase(),
  stage: faker.helpers.arrayElement(["new_lead", "qualified", "proposal", "closed_won", "closed_lost"]),
  amount: faker.number.int({ min: 1000, max: 1000000 }),  // DELETE THIS LINE
  contact_id: faker.number.int({ min: 1, max: 1000 }),
  organization_id: faker.number.int({ min: 1, max: 1000 }),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// AFTER:
export const createMockOpportunity = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.company.catchPhrase(),
  stage: faker.helpers.arrayElement(["new_lead", "qualified", "proposal", "closed_won", "closed_lost"]),
  contact_id: faker.number.int({ min: 1, max: 1000 }),
  organization_id: faker.number.int({ min: 1, max: 1000 }),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});
```

**Step 3: Run type check**

Run:
```bash
npm run typecheck
```

Expected: Fewer errors than before (if any remain, they'll be fixed in next tasks)

**Step 4: Run tests**

Run:
```bash
npm test
```

Expected: ✅ All tests pass (660+ tests)

**Step 5: Commit changes**

```bash
git add src/tests/utils/mock-providers.ts
git commit -m "test: remove amount field from mock opportunity generator

Update createMockOpportunity to match schema after amount column removal.
Mock data now aligns with relationship-focused opportunities.

Related: docs/plans/2025-11-02-complete-financial-tracking-removal-design.md"
```

---

## Task 6: Remove Financial Validation Utilities from Tests

**Files:**
- Delete: `src/atomic-crm/opportunities/opportunityUtils.spec.ts` (entire file if only financial tests remain)
- OR Modify: `src/atomic-crm/opportunities/opportunityUtils.spec.ts` (remove financial functions if other tests exist)

**Context:** The `opportunityUtils.spec.ts` file contains test utilities for financial calculations (`validateOpportunityAmount`, `calculateWeightedPipelineValue`). These test functionality that no longer exists.

**Step 1: Check if file exists and what it contains**

Run:
```bash
ls -la src/atomic-crm/opportunities/opportunityUtils.spec.ts
```

If file doesn't exist: Skip this task entirely, proceed to Task 7.

If file exists:
```bash
cat src/atomic-crm/opportunities/opportunityUtils.spec.ts | head -50
```

**Step 2: Determine if file has non-financial tests**

Read the file content. Check if there are test functions beyond:
- `validateOpportunityAmount`
- `calculateWeightedPipelineValue`

**If file only contains financial tests:**

Run:
```bash
rm src/atomic-crm/opportunities/opportunityUtils.spec.ts
```

Then commit:
```bash
git add src/atomic-crm/opportunities/opportunityUtils.spec.ts
git commit -m "test: remove financial validation test utilities

Delete opportunityUtils.spec.ts containing only financial test functions:
- validateOpportunityAmount (tested removed amount field)
- calculateWeightedPipelineValue (tested removed amount calculations)

Related: docs/plans/2025-11-02-complete-financial-tracking-removal-design.md"
```

**If file contains other tests:**

Edit the file to remove only the financial validation functions. Keep any other utility functions. Then commit describing what was removed.

**Step 3: Run tests**

Run:
```bash
npm test
```

Expected: ✅ All tests pass

---

## Task 7: Clean Up Validation Schema Comments

**Files:**
- Modify: `src/atomic-crm/validation/opportunities.ts:83`

**Context:** The opportunities validation schema has a comment listing fields NOT validated because they lack UI inputs. This comment mentions `amount` which is now removed from the database.

**Step 1: Read current comment**

Open `src/atomic-crm/validation/opportunities.ts` and find the comment around line 83.

**Step 2: Update comment to remove amount reference**

In `src/atomic-crm/validation/opportunities.ts`, update the comment:

```typescript
// BEFORE (around line 76-85):
// Fields NOT in this schema (per "UI as source of truth"):
// These exist in database but have no UI input fields, so not validated:
// - amount, probability, tags
// When UI inputs are added, move these to the schema

// AFTER:
// Fields NOT in this schema (per "UI as source of truth"):
// These exist in database but have no UI input fields, so not validated:
// - probability, tags
// When UI inputs are added, move these to the schema
```

OR if the comment becomes unclear after removal, delete the entire comment block.

**Step 3: Run type check**

Run:
```bash
npm run typecheck
```

Expected: ✅ No TypeScript errors

**Step 4: Run tests**

Run:
```bash
npm test
```

Expected: ✅ All tests pass

**Step 5: Commit changes**

```bash
git add src/atomic-crm/validation/opportunities.ts
git commit -m "docs: remove amount field from validation schema comment

Update comment to remove reference to dropped amount field.
Comment documents fields not validated due to lack of UI inputs.

Related: docs/plans/2025-11-02-complete-financial-tracking-removal-design.md"
```

---

## Task 8: Final Verification and Testing

**Context:** Comprehensive verification that all financial tracking is removed and system works correctly.

**Step 1: Search for any remaining references to removed fields**

Run:
```bash
grep -r "opportunity\.amount\|opportunities\.amount" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: No output (or only matches in comments/documentation)

Run:
```bash
grep -r "annual_revenue" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: No output (or only matches in comments/documentation)

Run:
```bash
grep -r "commission_rate" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
```

Expected: No output (or only matches in comments/documentation)

**Step 2: Run full type check**

Run:
```bash
npm run typecheck
```

Expected: ✅ No TypeScript errors

**Step 3: Run full test suite**

Run:
```bash
npm test
```

Expected: ✅ All 660+ tests passing

**Step 4: Run build**

Run:
```bash
npm run build
```

Expected: ✅ Build succeeds with no errors

**Step 5: Check database schema in local environment**

Run:
```bash
psql -h localhost -p 54322 -U postgres -d postgres -c "\d opportunities" | grep amount
psql -h localhost -p 54322 -U postgres -d postgres -c "\d organizations" | grep annual_revenue
psql -h localhost -p 54322 -U postgres -d postgres -c "\d opportunity_participants" | grep commission_rate
```

Expected: All three commands return empty (no matches)

**Step 6: Manual dashboard check (optional but recommended)**

Run:
```bash
npm run dev
```

Navigate to `http://localhost:5173` and verify:
- ✅ Dashboard displays only MetricsCardGrid (3 relationship cards)
- ✅ No OpportunitiesChart visible
- ✅ MiniPipeline shows counts only (no dollar amounts)
- ✅ No dollar signs ($) anywhere on dashboard
- ✅ No revenue or financial metrics displayed

**Step 7: Create verification summary**

If all checks pass, you're done! No commit needed for this task - it's just verification.

If any checks fail, review the error messages and fix issues before proceeding.

---

## Completion Checklist

After completing all tasks, verify:

- ✅ OpportunitiesChart.tsx deleted
- ✅ OpportunitiesPipeline.tsx deleted
- ✅ Dashboard.tsx updated (no financial component imports/usage)
- ✅ Database migration created and applied locally
- ✅ Columns dropped: `amount`, `annual_revenue`, `commission_rate`
- ✅ Enum dropped: `pricing_model_type`
- ✅ TypeScript types regenerated
- ✅ Mock data updated (no `amount` field)
- ✅ Test utilities cleaned (financial functions removed)
- ✅ Validation comments updated
- ✅ Type check passing
- ✅ All tests passing (660+)
- ✅ Build successful
- ✅ No financial references in codebase

## Deployment Notes

**⚠️ BEFORE DEPLOYING TO CLOUD:**

1. **Backup production database:**
   ```bash
   # Use Supabase dashboard to create backup
   # OR use pg_dump if you have direct access
   ```

2. **Export financial data if needed:**
   ```sql
   -- Save opportunity amounts for historical analysis (optional)
   COPY (SELECT id, name, amount FROM opportunities WHERE amount IS NOT NULL)
   TO '/tmp/opportunity_amounts_backup.csv' CSV HEADER;

   -- Save organization revenue (optional)
   COPY (SELECT id, name, annual_revenue FROM organizations WHERE annual_revenue IS NOT NULL)
   TO '/tmp/organization_revenue_backup.csv' CSV HEADER;
   ```

3. **Deploy migration to cloud:**
   ```bash
   npx supabase db push
   ```

4. **Verify in cloud:**
   - Check columns dropped
   - Check application works
   - Monitor for errors in Supabase logs

**Rollback Plan:**

If deployment fails:
```sql
-- Restore columns (data will be empty, but schema restored)
ALTER TABLE opportunities ADD COLUMN amount NUMERIC;
ALTER TABLE organizations ADD COLUMN annual_revenue NUMERIC(15,2);
ALTER TABLE opportunity_participants ADD COLUMN commission_rate NUMERIC;
CREATE TYPE pricing_model_type AS ENUM ('fixed', 'tiered', 'volume', 'subscription', 'custom');
```

Then regenerate types and redeploy application code.

## Related Documentation

- Design: `docs/plans/2025-11-02-complete-financial-tracking-removal-design.md`
- Previous work: `docs/plans/2025-11-02-remove-financial-tracking-design.md` (dashboard metrics)
- Pricing removal: `docs/plans/2025-11-02-pricing-cleanup-design.md`
- CLAUDE.md: Lines 17-33 (October 2025 pricing removal context)
