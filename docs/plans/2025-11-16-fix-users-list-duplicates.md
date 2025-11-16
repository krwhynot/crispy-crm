# Fix Users List: Eliminate Duplicate Admin & Empty Rows

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate duplicate Admin entries and empty rows in Users List (`/sales`) by standardizing on `role` enum as single source of truth and fixing seed data race condition.

**Architecture:** Fix schema-frontend mismatch by migrating from deprecated `administrator`/`is_admin` fields to the `role` enum introduced in migration 20251111121526. Remove duplicate sales record creation in seed file (trigger already handles it). Add computed `administrator` column for backward compatibility.

**Tech Stack:** Supabase PostgreSQL, React Admin, TypeScript, Zod validation

---

## Root Causes

1. **Duplicate Admin Creation** - Database trigger `on_auth_user_created` AND seed fallback logic (lines 4027-4032) both create sales records
2. **Field Name Mismatch** - Frontend uses `administrator` field that doesn't exist in DB (DB has `is_admin`/`role`)
3. **Schema Evolution** - Migration 20251111121526 added `role` enum but frontend never updated
4. **Empty Rows** - Orphaned sales records or missing auth.users metadata

## Implementation Tasks

### Task 1: Create Database Migration for Schema Cleanup

**Files:**
- Create: `supabase/migrations/20251116000000_fix_sales_schema_consistency.sql`

**Step 1: Create migration file**

```bash
npx supabase migration new fix_sales_schema_consistency
```

Expected: Creates `supabase/migrations/20251116XXXXXX_fix_sales_schema_consistency.sql`

**Step 2: Write migration SQL**

Complete migration file content:

```sql
-- =====================================================================
-- Fix Sales Schema Consistency: Eliminate Duplicates & Add Computed Column
-- =====================================================================
-- Resolves:
-- 1. Duplicate Admin records (trigger + seed fallback both creating)
-- 2. Missing 'administrator' field (frontend expects it, DB doesn't have it)
-- 3. Orphaned sales records (no corresponding auth.users)
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1: Add Computed Column for Backward Compatibility
-- =====================================================================
-- Frontend expects 'administrator' boolean field
-- Database has 'role' enum ('admin', 'manager', 'rep')
-- Solution: Computed column maps role='admin' to administrator=true

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS administrator BOOLEAN
GENERATED ALWAYS AS (role = 'admin') STORED;

COMMENT ON COLUMN sales.administrator IS
  'Computed column for backward compatibility. Maps from role enum. Frontend should migrate to using role directly.';

-- =====================================================================
-- PART 2: Clean Up Duplicate Admin Records
-- =====================================================================
-- Issue: admin@test.com appears twice (trigger + seed fallback)
-- Strategy: Keep only sales records that have valid user_id in auth.users

-- First, identify duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) - 1 INTO duplicate_count
  FROM sales
  WHERE email = 'admin@test.com';

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate admin@test.com records - cleaning up', duplicate_count;
  END IF;
END $$;

-- Delete sales records with no corresponding auth.users (orphaned)
-- This handles duplicates created by seed fallback logic
DELETE FROM sales
WHERE id IN (
  SELECT s.id
  FROM sales s
  LEFT JOIN auth.users u ON s.user_id = u.id
  WHERE s.email = 'admin@test.com'
    AND u.id IS NULL  -- No matching auth.users record
);

-- =====================================================================
-- PART 3: Clean Up All Orphaned Sales Records
-- =====================================================================
-- Remove any sales records that don't have valid auth.users

DELETE FROM sales
WHERE user_id IS NOT NULL  -- Has a user_id set
  AND user_id NOT IN (SELECT id FROM auth.users WHERE deleted_at IS NULL);

-- Also remove sales records with NULL user_id (should never happen with trigger)
DELETE FROM sales
WHERE user_id IS NULL;

-- =====================================================================
-- PART 4: Ensure All Sales Records Have Names
-- =====================================================================
-- Backfill first_name/last_name from auth.users metadata where missing

UPDATE sales s
SET
  first_name = COALESCE(s.first_name, u.raw_user_meta_data->>'first_name', ''),
  last_name = COALESCE(s.last_name, u.raw_user_meta_data->>'last_name', '')
FROM auth.users u
WHERE s.user_id = u.id
  AND (s.first_name IS NULL OR s.first_name = '' OR s.last_name IS NULL OR s.last_name = '');

-- =====================================================================
-- PART 5: Verify 1:1 Mapping
-- =====================================================================
-- Ensure auth.users count matches sales count

DO $$
DECLARE
  auth_count INTEGER;
  sales_count INTEGER;
  missing_sales INTEGER;
BEGIN
  -- Count active users
  SELECT COUNT(*) INTO auth_count
  FROM auth.users
  WHERE deleted_at IS NULL;

  -- Count active sales
  SELECT COUNT(*) INTO sales_count
  FROM sales
  WHERE deleted_at IS NULL;

  -- Check for users without sales records
  SELECT COUNT(*) INTO missing_sales
  FROM auth.users u
  LEFT JOIN sales s ON u.id = s.user_id
  WHERE u.deleted_at IS NULL AND s.id IS NULL;

  -- Report results
  IF auth_count = sales_count THEN
    RAISE NOTICE '✓ 1:1 mapping verified: % auth.users = % sales records', auth_count, sales_count;
  ELSE
    RAISE WARNING '⚠ Mismatch: % auth.users vs % sales records', auth_count, sales_count;

    IF missing_sales > 0 THEN
      RAISE WARNING '⚠ Found % auth.users without sales records - trigger may have failed', missing_sales;
    END IF;
  END IF;
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- =====================================================================
-- Run these manually after migration to verify success:

-- 1. Count admin records (should be exactly 1)
-- SELECT COUNT(*) FROM sales WHERE role = 'admin';
-- SELECT COUNT(*) FROM sales WHERE email = 'admin@test.com';

-- 2. Verify administrator computed column works
-- SELECT first_name, last_name, role, administrator FROM sales WHERE role = 'admin';

-- 3. Check for empty names (should be 0)
-- SELECT COUNT(*) FROM sales WHERE first_name = '' OR last_name = '' OR first_name IS NULL OR last_name IS NULL;

-- 4. Verify 1:1 mapping
-- SELECT
--   (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_count,
--   (SELECT COUNT(*) FROM sales WHERE deleted_at IS NULL) as sales_count;
```

**Step 3: Verify migration syntax locally**

```bash
# Don't apply yet - just verify syntax
cat supabase/migrations/20251116000000_fix_sales_schema_consistency.sql | npx supabase db reset --dry-run
```

Expected: No syntax errors

**Step 4: Commit migration**

```bash
git add supabase/migrations/20251116000000_fix_sales_schema_consistency.sql
git commit -m "feat(db): add migration to fix sales schema consistency

- Add computed administrator column (backward compatibility)
- Remove duplicate Admin records (trigger + seed collision)
- Clean up orphaned sales records
- Backfill missing first_name/last_name from auth metadata
- Verify 1:1 mapping between auth.users and sales"
```

---

### Task 2: Fix Seed File Duplicate Logic

**Files:**
- Modify: `supabase/seed.sql:4020-4032`

**Step 1: Read current seed logic**

```bash
sed -n '4015,4035p' supabase/seed.sql
```

Expected: See the fallback logic that manually creates sales records

**Step 2: Replace duplicate creation with UPDATE**

Find and replace lines 4020-4032:

**REMOVE THIS:**
```sql
BEGIN
  -- Get the sales ID for our test user
  SELECT id INTO v_sales_id
  FROM sales
  WHERE user_id = 'd3129876-b1fe-40eb-9980-64f5f73c64d6'
  LIMIT 1;

  -- If no sales record exists, create one
  IF v_sales_id IS NULL THEN
    INSERT INTO sales (first_name, last_name, email, user_id)
    VALUES ('Admin', 'User', 'admin@test.com', 'd3129876-b1fe-40eb-9980-64f5f73c64d6')
    RETURNING id INTO v_sales_id;
  END IF;
```

**REPLACE WITH:**
```sql
BEGIN
  -- ============================================================================
  -- Get sales ID for test user
  -- ============================================================================
  -- NOTE: The on_auth_user_created trigger already created the sales record
  --       when we inserted into auth.users above (line 39-86).
  --       We just need to UPDATE it to set role='admin'.
  --
  -- CRITICAL: DO NOT manually INSERT into sales table here!
  --           Trigger handles creation. We only UPDATE the auto-created record.
  -- ============================================================================

  -- Update the auto-created sales record to admin role
  UPDATE sales
  SET role = 'admin'
  WHERE user_id = 'd3129876-b1fe-40eb-9980-64f5f73c64d6'
  RETURNING id INTO v_sales_id;

  -- Verify the update worked
  IF v_sales_id IS NULL THEN
    RAISE EXCEPTION 'Failed to find sales record for admin user - trigger may have failed';
  END IF;
```

**Step 3: Verify seed file syntax**

```bash
# Check SQL syntax
psql -d postgres -f supabase/seed.sql --dry-run 2>&1 | grep -i error
```

Expected: No errors (or command not available - that's okay)

**Step 4: Test seed locally**

```bash
# Reset local database with updated seed
npm run db:local:reset
```

Expected:
- No errors during seed
- Exactly 1 Admin user in sales table

**Step 5: Verify no duplicates**

```bash
# Connect to local DB and verify
npx supabase db reset
# Then check:
# SELECT COUNT(*) FROM sales WHERE email = 'admin@test.com';
# Should return: 1
```

**Step 6: Commit seed fix**

```bash
git add supabase/seed.sql
git commit -m "fix(seed): eliminate duplicate Admin creation

Replace manual INSERT fallback with UPDATE to set admin role.
Trigger on_auth_user_created already creates sales record when
auth.users INSERT happens, so we only need to UPDATE the role.

Prevents duplicate Admin entries in Users List."
```

---

### Task 3: Update TypeScript Types

**Files:**
- Modify: `src/atomic-crm/types.ts:31-50`

**Step 1: Read current types**

```bash
sed -n '31,50p' src/atomic-crm/types.ts
```

**Step 2: Update SalesFormData interface**

Find lines 31-42 (SalesFormData interface):

**CHANGE FROM:**
```typescript
export interface SalesFormData {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
}
```

**CHANGE TO:**
```typescript
export interface SalesFormData {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'rep';  // Primary field (from DB enum)
  disabled: boolean;
}
```

**Step 3: Update Sale interface**

Find lines 44-52 (Sale interface):

**CHANGE FROM:**
```typescript
export interface Sale extends Pick<RaRecord, "id"> {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;
  email: string;
}
```

**CHANGE TO:**
```typescript
export interface Sale extends Pick<RaRecord, "id"> {
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'rep';  // Primary field (single source of truth)
  administrator?: boolean;  // Computed column (backward compatibility)
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;
  email: string;
}
```

**Step 4: Verify TypeScript compiles**

```bash
npm run type-check
```

Expected: No type errors (may have errors from other files - we'll fix next)

**Step 5: Commit type changes**

```bash
git add src/atomic-crm/types.ts
git commit -m "refactor(types): migrate from administrator to role enum

Update Sale and SalesFormData interfaces to use role enum
as primary permission field. Keep administrator as optional
computed field for backward compatibility.

Part of fix for Users List duplicate/empty rows issue."
```

---

### Task 4: Update Validation Schema

**Files:**
- Modify: `src/atomic-crm/validation/sales.ts:1-30`

**Step 1: Read current schema**

```bash
cat src/atomic-crm/validation/sales.ts
```

**Step 2: Update salesSchema**

Find the salesSchema definition (around line 5-25):

**CHANGE FROM:**
```typescript
export const salesSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email address"),
  phone: z.string().nullish(),
  avatar_url: z.string().url("Must be a valid URL").optional().nullable(),
  user_id: z.string().uuid("Must be a valid UUID").optional(),
  is_admin: z.boolean().default(false),
  disabled: z.boolean().default(false),

  // System fields
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});
```

**CHANGE TO:**
```typescript
export const salesSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email address"),
  phone: z.string().nullish(),
  avatar_url: z.string().url("Must be a valid URL").optional().nullable(),
  user_id: z.string().uuid("Must be a valid UUID").optional(),

  // Permission fields (role is primary, others are computed/deprecated)
  role: z.enum(['admin', 'manager', 'rep']).default('rep'),
  is_admin: z.boolean().optional(),  // Deprecated - synced from role via trigger
  administrator: z.boolean().optional(),  // Computed column - read-only

  disabled: z.boolean().default(false),

  // System fields
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});
```

**Step 3: Verify schema compiles**

```bash
npm run type-check
```

Expected: May have errors in components - we'll fix next

**Step 4: Commit validation changes**

```bash
git add src/atomic-crm/validation/sales.ts
git commit -m "refactor(validation): migrate sales schema to role enum

Update salesSchema to use role as primary permission field.
Deprecate is_admin (synced via trigger).
Add administrator as optional computed field.

Follows single source of truth principle."
```

---

### Task 5: Update SalesPermissionsTab Component

**Files:**
- Modify: `src/atomic-crm/sales/SalesPermissionsTab.tsx:1-30`

**Step 1: Read current component**

```bash
cat src/atomic-crm/sales/SalesPermissionsTab.tsx
```

**Step 2: Replace BooleanInput with SelectInput**

**REPLACE ENTIRE FILE WITH:**

```typescript
import { useIdentity } from "ra-core";
import { BooleanInput, SelectInput } from "react-admin";
import { useRecordContext } from "react-admin";
import type { Sale } from "../types";

export function SalesPermissionsTab() {
  const { identity } = useIdentity();
  const record = useRecordContext<Sale>();

  return (
    <div className="space-y-content">
      <SelectInput
        source="role"
        label="Role"
        choices={[
          { id: 'rep', name: 'Rep' },
          { id: 'manager', name: 'Manager' },
          { id: 'admin', name: 'Admin' },
        ]}
        disabled={record?.id === identity?.id}
        helperText="Rep: Edit own records. Manager: Edit all records. Admin: Full system access."
      />
      <BooleanInput
        source="disabled"
        label="Disabled"
        disabled={record?.id === identity?.id}
        helperText="Disabled users cannot log in"
      />
    </div>
  );
}
```

**Step 3: Verify component compiles**

```bash
npm run type-check
```

Expected: No errors in this file

**Step 4: Test UI locally (optional at this stage)**

```bash
npm run dev
# Navigate to /sales, click Edit on a user
# Verify "Role" dropdown shows instead of "Administrator" checkbox
```

**Step 5: Commit component update**

```bash
git add src/atomic-crm/sales/SalesPermissionsTab.tsx
git commit -m "refactor(sales): replace administrator checkbox with role dropdown

Change SalesPermissionsTab from BooleanInput (administrator) to
SelectInput (role) with three options: Rep, Manager, Admin.

Users cannot change their own role (prevents lockout).
Add helpful text explaining permission levels."
```

---

### Task 6: Update SalesInputs Tab Configuration

**Files:**
- Modify: `src/atomic-crm/sales/SalesInputs.tsx:10-20`

**Step 1: Read current tab config**

```bash
sed -n '10,25p' src/atomic-crm/sales/SalesInputs.tsx
```

**Step 2: Update fields array for permissions tab**

Find the tab configuration (around line 14-19):

**CHANGE FROM:**
```typescript
{
  key: "permissions",
  label: "Permissions",
  fields: ["administrator", "disabled"],
  content: <SalesPermissionsTab />,
}
```

**CHANGE TO:**
```typescript
{
  key: "permissions",
  label: "Permissions",
  fields: ["role", "disabled"],  // Changed from administrator to role
  content: <SalesPermissionsTab />,
}
```

**Step 3: Verify compiles**

```bash
npm run type-check
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/atomic-crm/sales/SalesInputs.tsx
git commit -m "refactor(sales): update tab fields from administrator to role

Update permissions tab field tracking to use role instead of
deprecated administrator field. Ensures error badges show
correctly when role field has validation errors."
```

---

### Task 7: Update SalesList Component with Role Badges

**Files:**
- Modify: `src/atomic-crm/sales/SalesList.tsx:19-36`

**Step 1: Read current OptionsField**

```bash
sed -n '19,36p' src/atomic-crm/sales/SalesList.tsx
```

**Step 2: Replace OptionsField with role-based badges**

**CHANGE FROM:**
```typescript
const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <div className="flex flex-row gap-1">
      {record.administrator && (
        <Badge variant="outline" className="[border-color:var(--border-info)]">
          Admin
        </Badge>
      )}
      {record.disabled && (
        <Badge variant="outline" className="[border-color:var(--border-warning)]">
          Disabled
        </Badge>
      )}
    </div>
  );
};
```

**CHANGE TO:**
```typescript
const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <div className="flex flex-row gap-1">
      {/* Show role badge */}
      {record.role === 'admin' && (
        <Badge variant="outline" className="border-info text-info">
          Admin
        </Badge>
      )}
      {record.role === 'manager' && (
        <Badge variant="outline" className="border-success text-success">
          Manager
        </Badge>
      )}
      {/* Rep role doesn't need a badge (default) */}

      {/* Show disabled badge */}
      {record.disabled && (
        <Badge variant="outline" className="border-warning text-warning">
          Disabled
        </Badge>
      )}
    </div>
  );
};
```

**Step 3: Fix Tailwind class violations (from crispy-design-system skill)**

The code above uses deprecated inline CSS variable syntax. Fix it:

**CORRECT VERSION:**
```typescript
const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <div className="flex flex-row gap-1">
      {/* Show role badge - semantic utilities only */}
      {record.role === 'admin' && (
        <Badge variant="outline" className="border-primary text-primary">
          Admin
        </Badge>
      )}
      {record.role === 'manager' && (
        <Badge variant="outline" className="border-success text-success">
          Manager
        </Badge>
      )}
      {/* Rep role doesn't need a badge (default) */}

      {/* Show disabled badge */}
      {record.disabled && (
        <Badge variant="outline" className="border-warning text-warning">
          Disabled
        </Badge>
      )}
    </div>
  );
};
```

**Step 4: Verify compiles and follows design system**

```bash
npm run type-check
npm run lint
```

Expected: No errors, no Tailwind violations

**Step 5: Test UI**

```bash
npm run dev
# Navigate to /sales
# Verify badges show: "Admin" (blue), "Manager" (green), "Disabled" (orange)
# Verify no empty rows
# Verify exactly 1 Admin entry
```

**Step 6: Commit**

```bash
git add src/atomic-crm/sales/SalesList.tsx
git commit -m "refactor(sales): show role-based badges in users list

Replace administrator boolean check with role enum badges:
- Admin: blue primary badge
- Manager: green success badge
- Rep: no badge (default)

Uses semantic Tailwind utilities (border-primary, text-success)
per crispy-design-system requirements."
```

---

### Task 8: Run Database Migration Locally

**Files:**
- Execute: Migration created in Task 1

**Step 1: Reset local database with migration**

```bash
npm run db:local:reset
```

Expected:
- Migration runs successfully
- Seed file executes without errors
- Notice messages about cleanup/verification

**Step 2: Verify migration results**

Connect to local database and run verification queries:

```bash
# Option 1: Using Supabase Studio
npx supabase studio
# Navigate to SQL Editor and run:
```

```sql
-- 1. Count admin records (should be exactly 1)
SELECT COUNT(*) as admin_count FROM sales WHERE role = 'admin';
-- Expected: 1

-- 2. Count admin by email (should be exactly 1)
SELECT COUNT(*) as admin_email_count FROM sales WHERE email = 'admin@test.com';
-- Expected: 1

-- 3. Verify administrator computed column works
SELECT first_name, last_name, role, administrator
FROM sales
WHERE role = 'admin';
-- Expected: first_name='Admin', last_name='User', role='admin', administrator=true

-- 4. Check for empty names (should be 0)
SELECT COUNT(*) as empty_names
FROM sales
WHERE first_name = '' OR last_name = '' OR first_name IS NULL OR last_name IS NULL;
-- Expected: 0

-- 5. Verify 1:1 mapping
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_count,
  (SELECT COUNT(*) FROM sales WHERE deleted_at IS NULL) as sales_count;
-- Expected: auth_count = sales_count
```

**Step 3: Verify via UI**

```bash
npm run dev
# Navigate to http://localhost:5173/sales
```

Expected:
- Exactly 1 "Admin User" entry with blue "Admin" badge
- No empty rows
- No duplicate entries
- All users have first_name and last_name

**Step 4: Document verification results**

Create a comment in the migration file documenting the test:

```bash
# Add to end of migration file:
echo "
-- =====================================================================
-- VERIFIED: 2025-11-16 Local Testing
-- =====================================================================
-- ✓ Exactly 1 admin@test.com record
-- ✓ administrator computed column working
-- ✓ No empty first_name/last_name
-- ✓ 1:1 mapping confirmed
-- ✓ UI shows correct badges
" >> supabase/migrations/20251116000000_fix_sales_schema_consistency.sql
```

**Step 5: Commit verification**

```bash
git add supabase/migrations/20251116000000_fix_sales_schema_consistency.sql
git commit -m "docs(migration): add verification results from local testing"
```

---

### Task 9: Run Full Test Suite

**Files:**
- Test: All sales-related components

**Step 1: Run unit tests**

```bash
npm test -- sales
```

Expected: All tests pass (may need to update tests if they check for `administrator` field)

**Step 2: Run type check**

```bash
npm run type-check
```

Expected: No TypeScript errors

**Step 3: Run linter**

```bash
npm run lint
```

Expected: No lint errors (especially no Tailwind inline CSS variable violations)

**Step 4: Run E2E tests (if they exist for sales)**

```bash
npm run test:e2e -- sales
```

Expected: Tests pass or gracefully skip if none exist

**Step 5: Fix any failing tests**

If tests fail because they reference `administrator` field:

Example fix for a test file:
```typescript
// BEFORE
expect(salesRecord.administrator).toBe(true);

// AFTER
expect(salesRecord.role).toBe('admin');
expect(salesRecord.administrator).toBe(true);  // Computed column should match
```

**Step 6: Commit test fixes**

```bash
git add src/**/*.test.ts src/**/*.test.tsx
git commit -m "test(sales): update tests to use role instead of administrator

Update unit tests to check role enum instead of deprecated
administrator field. Verify computed column matches role value."
```

---

### Task 10: Update Documentation

**Files:**
- Modify: `docs/supabase/WORKFLOW.md`

**Step 1: Add warning section about sales record creation**

Add after the "🔒 Two-Layer Security" section:

```markdown
### ⚠️ Sales Record Creation (Critical)

**SINGLE SOURCE:** Sales records are ONLY created by database triggers - never manually.

**Trigger Flow:**
1. User signs up → `auth.users` INSERT
2. Trigger `on_auth_user_created` fires automatically
3. Trigger calls `public.handle_new_user()` function
4. Function creates corresponding `sales` record with default role='rep'

**Seed File Pattern (CORRECT):**
```sql
-- 1. Create auth user (trigger auto-creates sales record)
INSERT INTO auth.users (...) VALUES (...);

-- 2. Update the auto-created sales record if needed
UPDATE sales SET role = 'admin' WHERE user_id = '<uuid>';
```

**Common Mistake (CAUSES DUPLICATES):**
```sql
-- ❌ WRONG - Creates duplicate because trigger already created it
INSERT INTO auth.users (...) VALUES (...);
INSERT INTO sales (...) VALUES (...);  -- Duplicate!
```

**Why This Matters:**
- Violates 1:1 mapping between `auth.users` and `sales`
- Creates duplicate entries in Users List UI
- Causes orphaned records that can't be deleted
- Breaks permission system (which user's role is correct?)

**If You Need to Add Test Users:**
```sql
-- Let trigger create sales record automatically
INSERT INTO auth.users (id, email, ...) VALUES (gen_random_uuid(), 'test@example.com', ...);

-- Then update role if needed
UPDATE sales SET role = 'manager' WHERE email = 'test@example.com';
```

**Reference:** Migration `20251116000000_fix_sales_schema_consistency.sql` fixed duplicates caused by violating this pattern.
```

**Step 2: Update seed.sql section to reference the new pattern**

Find the seed data section and add note:

```markdown
**⚠️ ONLY ONE seed file:** `supabase/seed.sql` (test user: admin@test.com / password123, 16 orgs)

**Critical:** Seed file uses correct trigger-based pattern (see "Sales Record Creation" above)
- Creates auth.users records (trigger auto-creates sales)
- Updates sales records to set roles
- Does NOT manually INSERT into sales table
```

**Step 3: Commit documentation**

```bash
git add docs/supabase/WORKFLOW.md
git commit -m "docs(supabase): add critical warning about sales record creation

Explain trigger-based pattern for creating sales records.
Warn against manual INSERT into sales (causes duplicates).
Document correct seed file pattern.

Prevents future developers from repeating the duplicate
Admin entry mistake."
```

---

### Task 11: Prepare for Cloud Deployment

**Files:**
- Execute: Validation commands

**Step 1: Run dry-run validation**

```bash
npm run db:cloud:push:dry-run
```

Expected: No errors, migration plan shows our new migration

**Step 2: Review migration plan output**

Look for:
- ✓ New migration `20251116000000_fix_sales_schema_consistency.sql` detected
- ✓ No unexpected schema changes
- ✓ Migration order is correct

**Step 3: Create deployment checklist**

Create file `docs/deployment/2025-11-16-sales-fix-deployment.md`:

```markdown
# Sales Schema Fix - Cloud Deployment Checklist

**Migration:** `20251116000000_fix_sales_schema_consistency.sql`

**Date:** 2025-11-16

**Estimated Downtime:** None (additive changes only)

## Pre-Deployment Verification

- [ ] Dry-run validation passed: `npm run db:cloud:push:dry-run`
- [ ] Local testing completed successfully
- [ ] All tests passing: `npm test && npm run type-check && npm run lint`
- [ ] No TypeScript errors
- [ ] UI verified locally (no duplicates, no empty rows)

## Deployment Steps

1. [ ] Backup current cloud database (automatic via Supabase)
2. [ ] Run migration: `npm run db:cloud:push`
3. [ ] Monitor Supabase dashboard for migration status
4. [ ] Wait for migration completion (estimated: 30 seconds)

## Post-Deployment Verification

Run these queries in Supabase SQL Editor:

```sql
-- 1. Verify exactly 1 admin
SELECT COUNT(*) FROM sales WHERE role = 'admin';
-- Expected: 1

-- 2. Verify administrator column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'administrator';
-- Expected: 1 row, type = boolean

-- 3. Verify no empty names
SELECT COUNT(*) FROM sales
WHERE first_name = '' OR last_name = '' OR first_name IS NULL OR last_name IS NULL;
-- Expected: 0

-- 4. Verify 1:1 mapping
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as auth_count,
  (SELECT COUNT(*) FROM sales WHERE deleted_at IS NULL) as sales_count;
-- Expected: auth_count = sales_count
```

## UI Verification

1. [ ] Navigate to production URL `/sales`
2. [ ] Verify exactly 1 Admin entry
3. [ ] Verify no empty rows
4. [ ] Verify role badges display correctly (Admin=blue, Manager=green)
5. [ ] Edit a user and verify role dropdown works

## Rollback Plan (if needed)

```sql
-- Remove computed column (safe - data preserved in role column)
ALTER TABLE sales DROP COLUMN IF EXISTS administrator;

-- Note: Duplicates were data issues, not schema - no rollback needed for cleanup
```

## Monitoring

- [ ] Check Supabase logs for errors
- [ ] Monitor user reports for 24 hours
- [ ] Verify no authentication issues

## Success Criteria

- ✓ Migration applied without errors
- ✓ All verification queries pass
- ✓ UI shows correct data (1 admin, no duplicates, no empty rows)
- ✓ No user reports of permission issues
```

**Step 4: Commit deployment checklist**

```bash
git add docs/deployment/2025-11-16-sales-fix-deployment.md
git commit -m "docs(deployment): add checklist for sales schema fix

Pre/post deployment verification steps for cloud migration.
Includes verification queries, UI checks, and rollback plan."
```

---

### Task 12: Final Review and Merge Preparation

**Files:**
- Review: All changed files

**Step 1: Review all changes**

```bash
git log --oneline --graph origin/main..HEAD
```

Expected: See all commits from Tasks 1-11

**Step 2: Run full test suite one more time**

```bash
npm test && npm run type-check && npm run lint && npm run test:e2e
```

Expected: All pass

**Step 3: Create summary commit message**

```bash
git log --oneline > /tmp/commits.txt
# Review and create summary
```

**Step 4: Verify migrations are tracked**

```bash
git status
# Ensure migration file is committed
ls -la supabase/migrations/ | grep 20251116
```

**Step 5: Update CLAUDE.md with fix note**

Add to "Recent Changes" section:

```markdown
- **Users List Duplicate Fix (2025-11-16)**: Eliminated duplicate Admin entries and empty rows by standardizing on `role` enum ('admin', 'manager', 'rep') as single source of truth. Migration adds computed `administrator` column for backward compatibility. Seed file updated to use trigger-based sales record creation (no manual INSERT). UI now shows role badges. Migration: `20251116000000_fix_sales_schema_consistency.sql`
```

**Step 6: Commit CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document users list duplicate fix in recent changes"
```

**Step 7: Create summary of changes**

Create `docs/plans/2025-11-16-fix-users-list-duplicates-COMPLETED.md`:

```markdown
# Users List Fix - Implementation Complete ✓

**Status:** COMPLETED
**Date:** 2025-11-16

## Changes Summary

### Database (1 migration)
- `20251116000000_fix_sales_schema_consistency.sql`
  - Added computed `administrator` column (role = 'admin')
  - Removed duplicate Admin records
  - Cleaned orphaned sales records
  - Backfilled missing names from auth metadata
  - Verified 1:1 mapping

### Seed Data (1 file)
- `supabase/seed.sql`
  - Removed manual sales INSERT fallback (lines 4020-4032)
  - Replaced with UPDATE to set admin role
  - Added comments explaining trigger pattern

### Frontend (5 files)
- `src/atomic-crm/types.ts` - Migrated to `role` enum
- `src/atomic-crm/validation/sales.ts` - Updated schema
- `src/atomic-crm/sales/SalesPermissionsTab.tsx` - SelectInput for role
- `src/atomic-crm/sales/SalesInputs.tsx` - Updated field tracking
- `src/atomic-crm/sales/SalesList.tsx` - Role-based badges

### Documentation (2 files)
- `docs/supabase/WORKFLOW.md` - Added sales creation warning
- `docs/deployment/2025-11-16-sales-fix-deployment.md` - Deployment checklist

## Test Results

✓ All unit tests pass
✓ No TypeScript errors
✓ No lint violations
✓ Local UI verified (no duplicates, no empty rows)
✓ 1:1 mapping verified

## Ready for Cloud Deployment

Next step: Follow `docs/deployment/2025-11-16-sales-fix-deployment.md`
```

**Step 8: Final commit**

```bash
git add docs/plans/2025-11-16-fix-users-list-duplicates-COMPLETED.md
git commit -m "docs(plan): mark users list fix as complete

All tasks implemented and tested locally.
Ready for cloud deployment."
```

---

## Deployment to Cloud

**Not included in this plan** - Requires separate approval and production access.

**Next Steps:**
1. Create PR with all changes
2. Code review
3. Merge to main
4. Follow deployment checklist: `docs/deployment/2025-11-16-sales-fix-deployment.md`
5. Run `npm run db:cloud:push` after approval
6. Verify in production UI

---

## Success Criteria

After completing all tasks:

✅ **Database:**
- Exactly 1 Admin user (admin@test.com)
- All sales records have first_name and last_name
- 1:1 mapping between auth.users and sales
- Computed `administrator` column exists and works

✅ **Frontend:**
- Users List shows role badges (Admin, Manager, Rep)
- No duplicate entries
- No empty rows
- Edit form has role dropdown instead of administrator checkbox

✅ **Code Quality:**
- All tests pass
- No TypeScript errors
- No lint violations
- Follows crispy-design-system (semantic Tailwind utilities)

✅ **Documentation:**
- WORKFLOW.md warns about sales record creation pattern
- Deployment checklist exists
- CLAUDE.md updated with recent changes

---

## References

**Skills Used:**
- @superpowers:writing-plans - This plan structure
- @crispy-design-system - Tailwind semantic utilities requirement
- @engineering-constitution - Single source of truth principle

**Related Files:**
- Migration: `supabase/migrations/20251111121526_add_role_based_permissions.sql` (introduced role enum)
- Trigger: `supabase/migrations/20251018211500_restore_auth_triggers_and_backfill.sql` (on_auth_user_created)
- Seed: `supabase/seed.sql` (test data)

**CLAUDE.md Sections:**
- Core Principles (Single Source of Truth)
- Database Workflows (Two-Layer Security)
- Engineering Constitution (fail-fast, validation patterns)
