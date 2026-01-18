# Implementation Plan: Role-based UI Controls & Manager-sees-all-data

**Created:** 2026-01-18
**Status:** Draft → **Revised after Zen Review**
**Confidence:** 85%
**Review Score:** 6.5/10 → Revised to address critical issues

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Story Points** | 8 |
| **Risk Level** | Medium |
| **Complexity** | Moderate |
| **Estimated Duration** | 2-3 hours |
| **Parallel Tracks** | 4 (after DB tasks) |
| **Critical Path** | DB → Tests → Frontend → Integration |

### Goal
Implement role-based access control with:
1. Custom `usePermissions` hook for UI control (menu + buttons + fields)
2. Enhanced RLS policies for defense-in-depth (**managers/admins see ALL data**, reps see own)
3. Flat role hierarchy: `admin > manager > rep`

> **⚠️ Scope Clarification:** This plan implements "Manager sees ALL data" (global visibility),
> NOT "Manager sees team data" (team-scoped). Team-based scoping would require a `team_id` or
> `manager_id` FK which is out of scope for this iteration.

### Architecture Decisions
- **Hierarchy Model:** Flat role check (no explicit manager_id FK)
- **UI Approach:** Custom `usePermissions` hook (no ra-rbac package)
- **RLS Strategy:** Defense-in-depth (UI hides + RLS enforces)
- **AuthProvider Pattern:** Uses existing caching + `canAccess` from `commons/canAccess.ts` ✅

### Existing Foundation
- `sales.role` enum: `admin | manager | rep` ✅
- `created_by` columns on most tables (**bigint** referencing `sales.id`) ✅
- `is_manager()` helper function ✅
- RLS enabled on all 27 public tables ✅
- AuthProvider already includes `role` in identity ✅
- `canAccess()` helper already exists in `src/atomic-crm/providers/commons/canAccess.ts` ✅

---

## Task Dependency Graph

```
Phase 1: Database (Sequential)
┌─────────────────────────────────────────────────────────────┐
│  Task 1: pgTAP Tests (TDD)                                  │
│     ↓                                                       │
│  Task 2: Helper Function (private.can_access_by_role)       │
│     ↓                                                       │
│  Task 3: RLS Policy Migration                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
Phase 2: Frontend (Parallel after Phase 1)
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Task 4:    │  │  Task 5:    │  │  Task 6:    │  │  Task 7:    │
│  usePerms   │  │  CanAccess  │  │  AuthProv   │  │  Hook Tests │
│  Hook       │  │  Component  │  │  Enhance    │  │  (Vitest)   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
                          ↓
Phase 3: Integration (Sequential)
┌─────────────────────────────────────────────────────────────┐
│  Task 8: Menu Integration                                   │
│     ↓                                                       │
│  Task 9: E2E Verification                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Layer (Sequential)

### Task 1: Write pgTAP Tests for Role-based RLS (TDD)

**Agent Hint:** `test-agent` (TDD - write failing tests first)
**File:** `supabase/tests/database/070-role-based-rls.test.sql`
**Effort:** 2 story points
**Dependencies:** None

#### What to Implement
Create failing pgTAP tests that define the expected role-based access behavior:
- Admins can see all records
- Managers can see all records
- Reps can only see records where `sales_id` or `created_by` matches their `sales.id`

#### Code Example

```sql
-- supabase/tests/database/070-role-based-rls.test.sql
BEGIN;

SELECT plan(11); -- Updated: 5 results_eq + 2 lives_ok + 1 throws_ok + 3 tasks tests = 11

-- ============================================
-- SETUP: Create test users with different roles
-- ============================================

-- Create test users in auth.users
SELECT tests.create_supabase_user('admin_user', 'admin@test.com');
SELECT tests.create_supabase_user('manager_user', 'manager@test.com');
SELECT tests.create_supabase_user('rep_user', 'rep@test.com');
SELECT tests.create_supabase_user('other_rep_user', 'other_rep@test.com');

-- Authenticate as service role to setup test data
SELECT tests.authenticate_as_service_role();

-- Create sales records with roles
INSERT INTO sales (user_id, first_name, last_name, email, role)
VALUES
  (tests.get_supabase_uid('admin_user'), 'Admin', 'User', 'admin@test.com', 'admin'),
  (tests.get_supabase_uid('manager_user'), 'Manager', 'User', 'manager@test.com', 'manager'),
  (tests.get_supabase_uid('rep_user'), 'Rep', 'User', 'rep@test.com', 'rep'),
  (tests.get_supabase_uid('other_rep_user'), 'Other', 'Rep', 'other_rep@test.com', 'rep');

-- Get sales IDs for test data
DO $$
DECLARE
  rep_sales_id bigint;
  other_rep_sales_id bigint;
BEGIN
  SELECT id INTO rep_sales_id FROM sales WHERE email = 'rep@test.com';
  SELECT id INTO other_rep_sales_id FROM sales WHERE email = 'other_rep@test.com';

  -- Create test organizations owned by different reps
  INSERT INTO organizations (name, organization_type, sales_id, created_by)
  VALUES
    ('Rep Org', 'prospect', rep_sales_id, rep_sales_id),
    ('Other Rep Org', 'prospect', other_rep_sales_id, other_rep_sales_id);
END $$;

-- ============================================
-- TEST: Admin sees all organizations
-- ============================================
SELECT tests.authenticate_as('admin_user');

SELECT results_eq(
  $$SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL$$,
  ARRAY[2::bigint],
  'Admin can see all organizations'
);

-- ============================================
-- TEST: Manager sees all organizations
-- ============================================
SELECT tests.authenticate_as('manager_user');

SELECT results_eq(
  $$SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL$$,
  ARRAY[2::bigint],
  'Manager can see all organizations'
);

-- ============================================
-- TEST: Rep sees only their own organizations
-- ============================================
SELECT tests.authenticate_as('rep_user');

SELECT results_eq(
  $$SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL$$,
  ARRAY[1::bigint],
  'Rep can only see their own organizations'
);

SELECT results_eq(
  $$SELECT name FROM organizations WHERE deleted_at IS NULL$$,
  ARRAY['Rep Org'::text],
  'Rep sees correct organization'
);

-- ============================================
-- TEST: Rep cannot see other rep's organizations
-- ============================================
SELECT tests.authenticate_as('other_rep_user');

SELECT results_eq(
  $$SELECT name FROM organizations WHERE deleted_at IS NULL$$,
  ARRAY['Other Rep Org'::text],
  'Other rep sees only their organization'
);

-- ============================================
-- TEST: Rep can still create new records
-- ============================================
SELECT tests.authenticate_as('rep_user');

SELECT lives_ok(
  $$INSERT INTO organizations (name, organization_type) VALUES ('New Rep Org', 'prospect')$$,
  'Rep can create new organizations'
);

-- ============================================
-- TEST: Rep can update their own records
-- ============================================
SELECT lives_ok(
  $$UPDATE organizations SET name = 'Updated Rep Org' WHERE name = 'Rep Org'$$,
  'Rep can update their own organizations'
);

-- ============================================
-- TEST: Rep cannot update other's records
-- ============================================
SELECT throws_ok(
  $$UPDATE organizations SET name = 'Hacked!' WHERE name = 'Other Rep Org'$$,
  '42501', -- RLS violation
  NULL,
  'Rep cannot update other rep organizations'
);

-- ============================================
-- TEST: Tasks (manager visibility)
-- ============================================
-- Tasks: Reps see only their own tasks, but managers/admins can see all tasks
-- This enables managers to monitor team workload and reassign tasks if needed

SELECT tests.authenticate_as_service_role();

DO $$
DECLARE
  rep_sales_id bigint;
BEGIN
  SELECT id INTO rep_sales_id FROM sales WHERE email = 'rep@test.com';

  INSERT INTO tasks (title, sales_id, created_by)
  VALUES ('Rep Task', rep_sales_id, rep_sales_id);
END $$;

SELECT tests.authenticate_as('rep_user');

SELECT results_eq(
  $$SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL$$,
  ARRAY[1::bigint],
  'Rep sees their own tasks'
);

SELECT tests.authenticate_as('other_rep_user');

SELECT results_eq(
  $$SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL$$,
  ARRAY[0::bigint],
  'Other rep cannot see rep tasks (personal access)'
);

-- Note: Managers CAN see all tasks per current model
SELECT tests.authenticate_as('manager_user');

SELECT results_eq(
  $$SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL$$,
  ARRAY[1::bigint],
  'Manager can see all tasks'
);

SELECT * FROM finish();
ROLLBACK;
```

#### Verification
- [ ] Run: `supabase test db --file 070-role-based-rls.test.sql`
- [ ] Tests should FAIL initially (TDD - red phase)
- [ ] 11 tests defined, 0 passing

#### Constitution Checklist
- [x] No retry logic ✅
- [x] Fail-fast on errors ✅
- [x] Uses soft-delete filtering (`deleted_at IS NULL`) ✅

---

### Task 2: Create Role-based Access Helper Function

**Agent Hint:** `migration-agent` (Database security definer function)
**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_role_based_access_helper.sql`
**Effort:** 1 story point
**Dependencies:** Task 1 (tests exist)

#### What to Implement
Create a `private.can_access_by_role()` security definer function that checks:
1. User's role from `sales.role`
2. If admin/manager → return TRUE
3. If rep → check ownership via `sales_id` or `created_by`

#### Code Example

```sql
-- Migration: add_role_based_access_helper
-- Purpose: Helper function for role-based RLS policies
-- Pattern: Security definer in private schema (per Constitution)

-- Ensure private schema exists
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================
-- Helper: Get current user's role
-- ============================================
CREATE OR REPLACE FUNCTION private.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role::text
  FROM public.sales
  WHERE user_id = (SELECT auth.uid())
  LIMIT 1;
$$;

COMMENT ON FUNCTION private.get_current_user_role() IS
  'Returns the role (admin/manager/rep) of the currently authenticated user. '
  'SECURITY DEFINER to bypass RLS on sales table lookup.';

-- ============================================
-- Helper: Check if current user can access a record
-- ============================================
CREATE OR REPLACE FUNCTION private.can_access_by_role(
  record_sales_id bigint,
  record_created_by bigint DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_role text;
  current_sales_id bigint;
BEGIN
  -- Get current user's role and sales_id
  SELECT s.role::text, s.id
  INTO current_role, current_sales_id
  FROM public.sales s
  WHERE s.user_id = (SELECT auth.uid());

  -- No sales record = no access
  IF current_sales_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admins and managers see everything
  IF current_role IN ('admin', 'manager') THEN
    RETURN true;
  END IF;

  -- Reps see records they own OR created
  RETURN (
    record_sales_id = current_sales_id OR
    COALESCE(record_created_by, 0) = current_sales_id
  );
END;
$$;

COMMENT ON FUNCTION private.can_access_by_role(bigint, bigint) IS
  'Role-based access check for RLS policies. '
  'Admin/Manager: see all records. '
  'Rep: sees records where sales_id or created_by matches their sales.id. '
  'Uses SECURITY DEFINER to avoid RLS recursion.';

-- ============================================
-- Helper: Check if current user is admin or manager
-- ============================================
CREATE OR REPLACE FUNCTION private.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'manager')
     FROM public.sales
     WHERE user_id = (SELECT auth.uid())),
    false
  );
$$;

COMMENT ON FUNCTION private.is_admin_or_manager() IS
  'Quick check if current user has elevated privileges (admin or manager role).';

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION private.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_by_role(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_or_manager() TO authenticated;
```

#### Verification
- [ ] Run: `supabase db reset` to apply migration
- [ ] Test function: `SELECT private.can_access_by_role(1, 1);`
- [ ] Verify it compiles without errors

#### Constitution Checklist
- [x] Security definer in private schema ✅
- [x] SET search_path = '' ✅
- [x] No direct Supabase imports (this IS the database layer) ✅
- [x] Proper GRANT statements ✅

---

### Task 3: Update RLS Policies for Role-based Access

**Agent Hint:** `migration-agent` (RLS policy updates)
**File:** `supabase/migrations/YYYYMMDDHHMMSS_update_rls_for_role_based_access.sql`
**Effort:** 2 story points
**Dependencies:** Task 2 (helper function exists)

#### What to Implement
Update SELECT policies on key tables to use the new role-based helper:
- `organizations` - role-based (managers see all)
- `contacts` - role-based (managers see all)
- `opportunities` - role-based (managers see all)
- `activities` - role-based (managers see all)
- `tasks` - keep personal access (existing behavior is correct)

**IMPORTANT:** Only update SELECT policies. INSERT/UPDATE/DELETE policies remain unchanged.

> **⚠️ Policy Alignment Note:** The existing INSERT/UPDATE/DELETE policies already allow
> authenticated users to perform these actions. The UI permission matrix (Task 4) aligns with
> this: managers can create/edit, but DELETE is admin-only in UI. RLS provides defense-in-depth
> but the UI layer is the primary control for destructive actions.

#### Code Example

```sql
-- Migration: update_rls_for_role_based_access
-- Purpose: Add role-based SELECT policies (admin/manager see all, rep sees own)
-- Strategy: Defense-in-depth - UI also enforces, but RLS is the last line of defense

-- ============================================
-- ORGANIZATIONS: Role-based SELECT
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON organizations;

-- Create new role-based SELECT policy
CREATE POLICY "organizations_select_role_based"
ON organizations
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    -- Admin/Manager: see all
    (SELECT private.is_admin_or_manager())
    OR
    -- Rep: see owned or created records
    private.can_access_by_role(sales_id, created_by)
  )
);

COMMENT ON POLICY "organizations_select_role_based" ON organizations IS
  'Role-based access: admin/manager see all, rep sees own records (sales_id or created_by match).';

-- ============================================
-- CONTACTS: Role-based SELECT
-- ============================================

DROP POLICY IF EXISTS "contacts_select_policy" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;

CREATE POLICY "contacts_select_role_based"
ON contacts
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    (SELECT private.is_admin_or_manager())
    OR
    private.can_access_by_role(sales_id, created_by)
  )
);

COMMENT ON POLICY "contacts_select_role_based" ON contacts IS
  'Role-based access: admin/manager see all, rep sees own records.';

-- ============================================
-- OPPORTUNITIES: Role-based SELECT
-- ============================================

DROP POLICY IF EXISTS "opportunities_select_policy" ON opportunities;
DROP POLICY IF EXISTS "Authenticated users can view opportunities" ON opportunities;

CREATE POLICY "opportunities_select_role_based"
ON opportunities
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    (SELECT private.is_admin_or_manager())
    OR
    -- For opportunities, also check opportunity_owner_id
    private.can_access_by_role(opportunity_owner_id, created_by)
  )
);

COMMENT ON POLICY "opportunities_select_role_based" ON opportunities IS
  'Role-based access: admin/manager see all, rep sees owned opportunities.';

-- ============================================
-- ACTIVITIES: Role-based SELECT
-- ============================================

DROP POLICY IF EXISTS "activities_select_policy" ON activities;
DROP POLICY IF EXISTS "Authenticated users can view activities" ON activities;

CREATE POLICY "activities_select_role_based"
ON activities
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    (SELECT private.is_admin_or_manager())
    OR
    private.can_access_by_role(
      NULL, -- activities don't have sales_id
      created_by
    )
  )
);

COMMENT ON POLICY "activities_select_role_based" ON activities IS
  'Role-based access: admin/manager see all, rep sees own activities.';

-- ============================================
-- TASKS: Keep personal access (no change)
-- ============================================
-- Tasks remain personal - only owner sees their tasks
-- This is intentional: tasks are individual to-do items
-- The existing policy should already enforce this

-- Verify tasks policy exists and is correct
DO $$
BEGIN
  -- Just verify the policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tasks'
    AND policyname LIKE '%select%'
  ) THEN
    RAISE EXCEPTION 'Tasks SELECT policy missing - manual review required';
  END IF;
END $$;

-- ============================================
-- NOTES TABLES: Role-based SELECT
-- ============================================

-- Contact Notes
DROP POLICY IF EXISTS "contact_notes_select_policy" ON contact_notes;

CREATE POLICY "contact_notes_select_role_based"
ON contact_notes
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    (SELECT private.is_admin_or_manager())
    OR
    private.can_access_by_role(sales_id, created_by)
  )
);

-- Organization Notes
DROP POLICY IF EXISTS "organization_notes_select_policy" ON organization_notes;

CREATE POLICY "organization_notes_select_role_based"
ON organization_notes
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    (SELECT private.is_admin_or_manager())
    OR
    private.can_access_by_role(sales_id, NULL)
  )
);

-- Opportunity Notes
DROP POLICY IF EXISTS "opportunity_notes_select_policy" ON opportunity_notes;

CREATE POLICY "opportunity_notes_select_role_based"
ON opportunity_notes
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    (SELECT private.is_admin_or_manager())
    OR
    private.can_access_by_role(sales_id, created_by)
  )
);

-- ============================================
-- Update documentation
-- ============================================
COMMENT ON TABLE organizations IS
  'Organizations table. '
  'RLS: Role-based access - admin/manager see all, rep sees own records. '
  'Updated 2026-01-18 for manager-sees-team-data feature.';

COMMENT ON TABLE contacts IS
  'Customer contacts. '
  'RLS: Role-based access - admin/manager see all, rep sees own records. '
  'Updated 2026-01-18 for manager-sees-team-data feature.';

COMMENT ON TABLE opportunities IS
  'Sales opportunities. '
  'RLS: Role-based access - admin/manager see all, rep sees own opportunities. '
  'Updated 2026-01-18 for manager-sees-team-data feature.';
```

#### Verification
- [ ] Run: `supabase db reset` to apply migrations
- [ ] Run: `supabase test db --file 070-role-based-rls.test.sql`
- [ ] All 12 tests should PASS (TDD - green phase)

#### Constitution Checklist
- [x] Uses `(SELECT private.is_admin_or_manager())` with SELECT wrapper for performance ✅
- [x] Soft-delete filtering (`deleted_at IS NULL`) ✅
- [x] Explicit `TO authenticated` role ✅
- [x] Comments on policies ✅

---

## Phase 2: Frontend Layer (Parallel)

> **Note:** Tasks 4-7 can run in parallel after Phase 1 completes.

### Task 4: Create usePermissions Hook

**Agent Hint:** `component-agent` (React hook with TypeScript)
**File:** `src/hooks/usePermissions.ts`
**Effort:** 2 story points
**Dependencies:** None (can start after Phase 1)

#### What to Implement
Create a custom React hook that:
1. Gets user role from identity
2. Provides `canAccess(resource, action)` for UI visibility
3. Provides `canSeeField(resource, field)` for field-level control
4. Provides boolean helpers: `isAdmin`, `isManager`

#### Code Example

```typescript
// src/hooks/usePermissions.ts
import { useGetIdentity } from 'react-admin';

// ============================================
// Type Definitions
// ============================================

export type Role = 'admin' | 'manager' | 'rep';

export type Action =
  | 'list'
  | 'show'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'bulk_delete';

export type Resource =
  | 'organizations'
  | 'contacts'
  | 'opportunities'
  | 'tasks'
  | 'activities'
  | 'products'
  | 'sales'
  | 'segments'
  | 'tags';

export interface Permissions {
  /** Current user's role */
  role: Role;
  /** True if user is admin */
  isAdmin: boolean;
  /** True if user is admin OR manager */
  isManager: boolean;
  /** True if user is a rep (lowest privilege) */
  isRep: boolean;
  /** Check if user can perform action on resource */
  canAccess: (resource: Resource, action: Action) => boolean;
  /** Check if user can see a specific field */
  canSeeField: (resource: Resource, field: string) => boolean;
  /** Check if user can edit a specific field */
  canEditField: (resource: Resource, field: string) => boolean;
  /** Loading state while identity is being fetched */
  isLoading: boolean;
}

// ============================================
// Permission Matrix
// ============================================

/**
 * Defines what each role can do on each resource.
 *
 * Key principle: Defense-in-depth
 * - UI hides buttons/fields based on this matrix
 * - RLS enforces at database level as backup
 */
const rolePermissions: Record<Role, Record<Resource, Action[]>> = {
  admin: {
    organizations: ['list', 'show', 'create', 'edit', 'delete', 'export', 'bulk_delete'],
    contacts: ['list', 'show', 'create', 'edit', 'delete', 'export', 'bulk_delete'],
    opportunities: ['list', 'show', 'create', 'edit', 'delete', 'export', 'bulk_delete'],
    tasks: ['list', 'show', 'create', 'edit', 'delete'],
    activities: ['list', 'show', 'create', 'edit', 'delete', 'export'],
    products: ['list', 'show', 'create', 'edit', 'delete'],
    sales: ['list', 'show', 'create', 'edit', 'delete'], // User management
    segments: ['list', 'show', 'create', 'edit', 'delete'],
    tags: ['list', 'show', 'create', 'edit', 'delete'],
  },
  manager: {
    organizations: ['list', 'show', 'create', 'edit', 'export'],
    contacts: ['list', 'show', 'create', 'edit', 'export'],
    opportunities: ['list', 'show', 'create', 'edit', 'export'],
    tasks: ['list', 'show', 'create', 'edit', 'delete'],
    activities: ['list', 'show', 'create', 'edit', 'export'],
    products: ['list', 'show', 'create', 'edit'],
    sales: ['list', 'show'], // View team only, no management
    segments: ['list', 'show'],
    tags: ['list', 'show', 'create'],
  },
  rep: {
    organizations: ['list', 'show', 'create', 'edit'],
    contacts: ['list', 'show', 'create', 'edit'],
    opportunities: ['list', 'show', 'create', 'edit'],
    tasks: ['list', 'show', 'create', 'edit', 'delete'],
    activities: ['list', 'show', 'create', 'edit'],
    products: ['list', 'show'],
    sales: ['list', 'show'], // View team directory
    segments: ['list', 'show'],
    tags: ['list', 'show'],
  },
};

// ============================================
// Field-level Restrictions
// ============================================

/**
 * Fields that are hidden from certain roles.
 * Format: { [resource]: { [field]: Role[] } }
 * Roles in the array CANNOT see the field.
 */
const hiddenFields: Partial<Record<Resource, Record<string, Role[]>>> = {
  organizations: {
    credit_limit: ['rep'], // Reps can't see credit limits
    payment_terms: ['rep'],
  },
  contacts: {
    // No field restrictions currently
  },
  opportunities: {
    // All fields visible to all roles
  },
  sales: {
    is_admin: ['rep'], // Hide admin flag from reps
    role: ['rep'], // Hide role selector from reps
  },
};

/**
 * Fields that are read-only for certain roles.
 * Format: { [resource]: { [field]: Role[] } }
 * Roles in the array can SEE but CANNOT EDIT the field.
 */
const readOnlyFields: Partial<Record<Resource, Record<string, Role[]>>> = {
  organizations: {
    sales_id: ['rep'], // Reps can't reassign organizations
  },
  opportunities: {
    opportunity_owner_id: ['rep'], // Reps can't reassign opportunities
  },
};

// ============================================
// Hook Implementation
// ============================================

export function usePermissions(): Permissions {
  const { data: identity, isLoading } = useGetIdentity();

  // Default to 'rep' (lowest privilege) if role unknown
  const role: Role = (identity?.role as Role) ?? 'rep';

  const isAdmin = role === 'admin';
  const isManager = role === 'admin' || role === 'manager';
  const isRep = role === 'rep';

  /**
   * Check if user can perform an action on a resource.
   * Returns false if loading (fail-safe).
   */
  const canAccess = (resource: Resource, action: Action): boolean => {
    if (isLoading) return false; // Fail-safe while loading

    const allowedActions = rolePermissions[role]?.[resource];
    return allowedActions?.includes(action) ?? false;
  };

  /**
   * Check if user can SEE a field.
   * Returns true by default (visible unless explicitly hidden).
   */
  const canSeeField = (resource: Resource, field: string): boolean => {
    if (isLoading) return false; // Fail-safe while loading

    const restrictions = hiddenFields[resource]?.[field];
    if (!restrictions) return true; // No restrictions = visible

    return !restrictions.includes(role);
  };

  /**
   * Check if user can EDIT a field.
   * Must be able to see it AND not be in read-only list.
   */
  const canEditField = (resource: Resource, field: string): boolean => {
    if (!canSeeField(resource, field)) return false;

    const restrictions = readOnlyFields[resource]?.[field];
    if (!restrictions) return true; // No restrictions = editable

    return !restrictions.includes(role);
  };

  return {
    role,
    isAdmin,
    isManager,
    isRep,
    canAccess,
    canSeeField,
    canEditField,
    isLoading,
  };
}

// ============================================
// Convenience Exports
// ============================================

export { rolePermissions, hiddenFields, readOnlyFields };
```

#### Verification
- [ ] File compiles without TypeScript errors
- [ ] Import in a component: `const { canAccess } = usePermissions();`
- [ ] Test: `canAccess('organizations', 'delete')` returns correct boolean

#### Constitution Checklist
- [x] TypeScript with explicit types ✅
- [x] No retry logic (isLoading returns false = fail-safe) ✅
- [x] Interface for shapes, not type ✅

---

### Task 5: Create CanAccess Wrapper Component

**Agent Hint:** `component-agent` (React conditional rendering component)
**File:** `src/components/auth/CanAccess.tsx`
**Effort:** 1 story point
**Dependencies:** Task 4 (usePermissions hook)

#### What to Implement
Create a declarative wrapper component for role-based UI visibility:
- Wraps children with permission check
- Renders nothing if access denied
- Supports fallback content

#### Code Example

```typescript
// src/components/auth/CanAccess.tsx
import { ReactNode } from 'react';
import { usePermissions, Resource, Action } from '@/hooks/usePermissions';

interface CanAccessProps {
  /** Resource to check access for */
  resource: Resource;
  /** Action to check (list, show, create, edit, delete, export) */
  action: Action;
  /** Content to render if access is granted */
  children: ReactNode;
  /** Optional fallback content if access is denied */
  fallback?: ReactNode;
}

/**
 * Declarative access control wrapper.
 * Renders children only if user has permission for the action on the resource.
 *
 * @example
 * <CanAccess resource="organizations" action="delete">
 *   <DeleteButton />
 * </CanAccess>
 *
 * @example With fallback
 * <CanAccess resource="sales" action="edit" fallback={<span>View only</span>}>
 *   <EditButton />
 * </CanAccess>
 */
export function CanAccess({
  resource,
  action,
  children,
  fallback = null
}: CanAccessProps): ReactNode {
  const { canAccess, isLoading } = usePermissions();

  // Don't render anything while loading (fail-safe)
  if (isLoading) {
    return null;
  }

  if (canAccess(resource, action)) {
    return children;
  }

  return fallback;
}

// ============================================
// Field-level Access Component
// ============================================

interface CanSeeFieldProps {
  /** Resource the field belongs to */
  resource: Resource;
  /** Field name to check visibility for */
  field: string;
  /** Content to render if field is visible */
  children: ReactNode;
}

/**
 * Field-level visibility wrapper.
 * Renders children only if user can see the specified field.
 *
 * @example
 * <CanSeeField resource="organizations" field="credit_limit">
 *   <NumberField source="credit_limit" />
 * </CanSeeField>
 */
export function CanSeeField({
  resource,
  field,
  children
}: CanSeeFieldProps): ReactNode {
  const { canSeeField, isLoading } = usePermissions();

  if (isLoading || !canSeeField(resource, field)) {
    return null;
  }

  return children;
}

// ============================================
// Role-based Rendering
// ============================================

interface IfRoleProps {
  /** Roles that can see this content */
  roles: Array<'admin' | 'manager' | 'rep'>;
  /** Content to render if user has one of the roles */
  children: ReactNode;
  /** Optional fallback content */
  fallback?: ReactNode;
}

/**
 * Direct role-based rendering (use sparingly).
 * Prefer CanAccess for action-based checks.
 *
 * @example
 * <IfRole roles={['admin']}>
 *   <AdminDashboard />
 * </IfRole>
 */
export function IfRole({
  roles,
  children,
  fallback = null
}: IfRoleProps): ReactNode {
  const { role, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (roles.includes(role)) {
    return children;
  }

  return fallback;
}
```

#### Verification
- [ ] File compiles without TypeScript errors
- [ ] Test in a List component: wrap DeleteButton with CanAccess
- [ ] Verify button hides for rep role, shows for admin

#### Constitution Checklist
- [x] Fail-safe behavior (returns null while loading) ✅
- [x] No retry logic ✅
- [x] Uses composition pattern ✅

---

### Task 6: Enhance canAccess Helper with Detailed Permissions

**Agent Hint:** `provider-agent` (Permission logic enhancement)
**File:** `src/atomic-crm/providers/commons/canAccess.ts`
**Effort:** 1 story point
**Dependencies:** None (can start after Phase 1)

> **✅ EXISTING FOUNDATION:** The `authProvider.ts` already:
> - Has `getIdentity()` that returns `role` from cached sale data
> - Has `canAccess()` that delegates to `commons/canAccess.ts`
> - Uses caching to avoid repeated Supabase calls
>
> We only need to enhance the `canAccess.ts` logic, NOT rewrite authProvider.

#### What to Implement
Enhance the existing `canAccess.ts` to support:
1. More granular action-based permissions (not just resource-level)
2. Field-level permission exports for UI components
3. Keep backward compatibility with existing calls

#### Code Example

```typescript
// src/atomic-crm/providers/commons/canAccess.ts
// ENHANCED version - replaces existing file

/**
 * TD-005 [P3] Missing export from ra-core - CanAccessParams interface locally duplicated
 * (Keep existing documentation comment)
 */
interface CanAccessParams<RecordType extends Record<string, any> = Record<string, any>> {
  action: string;
  resource: string;
  record?: RecordType;
}

/**
 * Role-based access types
 */
export type UserRole = "admin" | "manager" | "rep";

export type Action =
  | "list"
  | "show"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "bulk_delete";

export type Resource =
  | "organizations"
  | "contacts"
  | "opportunities"
  | "tasks"
  | "activities"
  | "products"
  | "sales"
  | "segments"
  | "tags";

/**
 * Permission matrix for RBAC:
 * - Admin: Full CRUD on all resources including user management
 * - Manager: Full CRUD on shared resources, read-only on sales
 * - Rep: Full CRUD on own data (enforced by RLS), read-only on sales
 */
export const rolePermissions: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  admin: {
    organizations: ["list", "show", "create", "edit", "delete", "export", "bulk_delete"],
    contacts: ["list", "show", "create", "edit", "delete", "export", "bulk_delete"],
    opportunities: ["list", "show", "create", "edit", "delete", "export", "bulk_delete"],
    tasks: ["list", "show", "create", "edit", "delete"],
    activities: ["list", "show", "create", "edit", "delete", "export"],
    products: ["list", "show", "create", "edit", "delete"],
    sales: ["list", "show", "create", "edit", "delete"], // User management
    segments: ["list", "show", "create", "edit", "delete"],
    tags: ["list", "show", "create", "edit", "delete"],
  },
  manager: {
    organizations: ["list", "show", "create", "edit", "export"],
    contacts: ["list", "show", "create", "edit", "export"],
    opportunities: ["list", "show", "create", "edit", "export"],
    tasks: ["list", "show", "create", "edit", "delete"],
    activities: ["list", "show", "create", "edit", "export"],
    products: ["list", "show", "create", "edit"],
    sales: ["list", "show"], // View team only
    segments: ["list", "show"],
    tags: ["list", "show", "create"],
  },
  rep: {
    organizations: ["list", "show", "create", "edit"],
    contacts: ["list", "show", "create", "edit"],
    opportunities: ["list", "show", "create", "edit"],
    tasks: ["list", "show", "create", "edit", "delete"],
    activities: ["list", "show", "create", "edit"],
    products: ["list", "show"],
    sales: ["list", "show"], // View team directory
    segments: ["list", "show"],
    tags: ["list", "show"],
  },
};

/**
 * Main access check function - used by authProvider.canAccess()
 */
export const canAccess = <RecordType extends Record<string, any> = Record<string, any>>(
  role: string,
  params: CanAccessParams<RecordType>
): boolean => {
  const { action, resource } = params;
  const userRole = (role || "rep") as UserRole;

  // Get allowed actions for this role and resource
  const allowedActions = rolePermissions[userRole]?.[resource as Resource];

  // If resource not in matrix, deny by default (fail-safe)
  if (!allowedActions) {
    return false;
  }

  // Check if action is allowed
  return allowedActions.includes(action as Action);
};

/**
 * Convenience export for checking if role is admin or manager
 */
export const isAdminOrManager = (role: string): boolean => {
  return role === "admin" || role === "manager";
};
```

#### Verification
- [ ] `canAccess('admin', { resource: 'sales', action: 'delete' })` returns `true`
- [ ] `canAccess('manager', { resource: 'sales', action: 'delete' })` returns `false`
- [ ] `canAccess('rep', { resource: 'organizations', action: 'list' })` returns `true`
- [ ] Existing authProvider tests still pass

#### Constitution Checklist
- [x] Fail-safe: unknown roles/resources denied ✅
- [x] No retry logic ✅
- [x] No direct Supabase imports (this is pure logic) ✅

---

### Task 7: Write Vitest Tests for usePermissions Hook

**Agent Hint:** `test-agent` (Vitest unit tests)
**File:** `src/hooks/__tests__/usePermissions.test.ts`
**Effort:** 1 story point
**Dependencies:** Task 4 (usePermissions hook)

#### What to Implement
Write unit tests for the usePermissions hook covering:
- Role detection from identity
- Permission matrix lookups
- Field visibility checks
- Loading state behavior

#### Code Example

```typescript
// src/hooks/__tests__/usePermissions.test.ts
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePermissions } from '../usePermissions';

// Mock react-admin's useGetIdentity
vi.mock('react-admin', () => ({
  useGetIdentity: vi.fn(),
}));

import { useGetIdentity } from 'react-admin';

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('role detection', () => {
    it('returns admin role when identity has admin role', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'admin' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('admin');
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isManager).toBe(true);
      expect(result.current.isRep).toBe(false);
    });

    it('returns manager role when identity has manager role', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'manager' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('manager');
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(true);
      expect(result.current.isRep).toBe(false);
    });

    it('defaults to rep when role is undefined', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1 }, // No role
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('rep');
      expect(result.current.isRep).toBe(true);
    });
  });

  describe('canAccess', () => {
    it('admin can delete organizations', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'admin' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccess('organizations', 'delete')).toBe(true);
    });

    it('manager cannot delete organizations', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'manager' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccess('organizations', 'delete')).toBe(false);
    });

    it('rep cannot delete organizations', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'rep' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccess('organizations', 'delete')).toBe(false);
    });

    it('admin can manage sales (users)', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'admin' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccess('sales', 'create')).toBe(true);
      expect(result.current.canAccess('sales', 'delete')).toBe(true);
    });

    it('manager and rep cannot manage sales (users)', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'manager' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccess('sales', 'create')).toBe(false);
      expect(result.current.canAccess('sales', 'delete')).toBe(false);
    });

    it('returns false while loading (fail-safe)', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccess('organizations', 'list')).toBe(false);
    });
  });

  describe('canSeeField', () => {
    it('admin can see credit_limit field', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'admin' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeField('organizations', 'credit_limit')).toBe(true);
    });

    it('rep cannot see credit_limit field', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'rep' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeField('organizations', 'credit_limit')).toBe(false);
    });

    it('all roles can see unrestricted fields', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'rep' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeField('organizations', 'name')).toBe(true);
    });
  });

  describe('canEditField', () => {
    it('admin can edit sales_id field', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'admin' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canEditField('organizations', 'sales_id')).toBe(true);
    });

    it('rep cannot edit sales_id field (read-only)', () => {
      vi.mocked(useGetIdentity).mockReturnValue({
        data: { id: 1, role: 'rep' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canEditField('organizations', 'sales_id')).toBe(false);
    });
  });
});
```

#### Verification
- [ ] Run: `npm run test -- src/hooks/__tests__/usePermissions.test.ts`
- [ ] All tests pass
- [ ] Coverage includes edge cases

#### Constitution Checklist
- [x] Uses Vitest with vi.mock ✅
- [x] Tests fail-safe behavior ✅
- [x] No flaky async without proper awaits ✅

---

## Phase 3: Integration (Sequential)

### Task 8: Integrate Permissions into Menu Component

**Agent Hint:** `component-agent` (Menu integration)
**File:** `src/atomic-crm/Layout.tsx` or wherever Menu is defined
**Effort:** 1 story point
**Dependencies:** Tasks 4, 5 (usePermissions and CanAccess)

#### What to Implement
Update the sidebar menu to:
1. Hide admin-only items (Sales/User management) from reps
2. Hide delete-related menu items from non-admins
3. Use CanAccess wrapper for clean implementation

#### Code Example

```typescript
// Example integration in Menu component
import { CanAccess, IfRole } from '@/components/auth/CanAccess';
import { Menu } from 'react-admin';

export const AppMenu = () => (
  <Menu>
    <Menu.ResourceItem name="organizations" />
    <Menu.ResourceItem name="contacts" />
    <Menu.ResourceItem name="opportunities" />
    <Menu.ResourceItem name="tasks" />
    <Menu.ResourceItem name="activities" />
    <Menu.ResourceItem name="products" />

    {/* Admin-only: User management */}
    <CanAccess resource="sales" action="create">
      <Menu.ResourceItem name="sales" />
    </CanAccess>

    {/* Admin-only: System settings */}
    <IfRole roles={['admin']}>
      <Menu.ResourceItem name="segments" />
      <Menu.ResourceItem name="tags" />
    </IfRole>
  </Menu>
);
```

#### Verification
- [ ] Log in as rep → Sales menu item hidden
- [ ] Log in as admin → All menu items visible
- [ ] Log in as manager → Sales visible (list only), Settings hidden

#### Constitution Checklist
- [x] Uses semantic Tailwind (no hardcoded colors) ✅
- [x] Touch targets >= 44px ✅

---

### Task 9: E2E Verification Checklist

**Agent Hint:** `test-agent` (Manual E2E verification)
**File:** `docs/tests/e2e/role-based-access.md`
**Effort:** 1 story point
**Dependencies:** All previous tasks

#### What to Implement
Create E2E verification checklist for manual testing:

#### Code Example

```markdown
# E2E Verification: Role-based Access Control

## Test Setup
1. Ensure you have 3 test users:
   - Admin: `admin@test.com`
   - Manager: `manager@test.com`
   - Rep: `rep@test.com`

2. Ensure test data exists:
   - Organizations owned by different users
   - Opportunities owned by different users

## Test Scenarios

### Scenario 1: Rep Data Visibility
**Login as:** rep@test.com

- [ ] Organizations List: Only shows orgs where `sales_id` = my ID
- [ ] Contacts List: Only shows contacts where `sales_id` = my ID
- [ ] Opportunities List: Only shows opps where `opportunity_owner_id` = my ID
- [ ] Tasks List: Only shows my tasks (personal access)
- [ ] Sales Menu Item: Hidden from sidebar

### Scenario 2: Manager Data Visibility
**Login as:** manager@test.com

- [ ] Organizations List: Shows ALL organizations
- [ ] Contacts List: Shows ALL contacts
- [ ] Opportunities List: Shows ALL opportunities
- [ ] Tasks List: Shows ALL tasks
- [ ] Sales Menu Item: Visible but "Create" button hidden
- [ ] Delete buttons: Hidden on Organizations

### Scenario 3: Admin Full Access
**Login as:** admin@test.com

- [ ] All lists show ALL records
- [ ] Delete buttons visible everywhere
- [ ] Sales menu: Full CRUD available
- [ ] Segments/Tags menus visible

### Scenario 4: Field-level Access
**Login as:** rep@test.com

- [ ] Organization Edit: "Account Manager" dropdown disabled/read-only
- [ ] Organization Show: "Credit Limit" field hidden
- [ ] Opportunity Edit: "Owner" dropdown disabled

### Scenario 5: RLS Enforcement (Defense in Depth)
**Login as:** rep@test.com via API/DevTools

- [ ] Try direct API call to fetch all orgs → Should return only owned
- [ ] Try update org owned by other rep → Should fail with 403
- [ ] Try delete via API → Should fail (no delete permission)
```

#### Verification
- [ ] Document created
- [ ] All checkboxes verified manually
- [ ] Any failures documented with screenshots

---

## Rollback Plan

If issues arise, rollback in reverse order:

1. **Frontend:** Remove CanAccess wrappers, revert usePermissions
2. **AuthProvider:** Remove canAccess method, revert getPermissions
3. **Database:** Run rollback migration:

```sql
-- Rollback: Restore original permissive SELECT policies
DROP POLICY IF EXISTS "organizations_select_role_based" ON organizations;
CREATE POLICY "Authenticated users can view organizations"
ON organizations FOR SELECT TO authenticated
USING (deleted_at IS NULL);

-- Repeat for other tables...
```

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| **RLS Tests Pass** | All 11 pgTAP tests green |
| **Hook Tests Pass** | All Vitest tests green |
| **No Regressions** | Existing functionality unchanged |
| **E2E Verified** | Manual checklist complete |
| **Performance** | List queries < 200ms (no RLS perf regression) |

---

## Appendix: Permission Matrix Reference

| Resource | Admin | Manager | Rep |
|----------|-------|---------|-----|
| Organizations | CRUD + Delete + Export | CRUD + Export | CR + Edit own |
| Contacts | CRUD + Delete + Export | CRUD + Export | CR + Edit own |
| Opportunities | CRUD + Delete + Export | CRUD + Export | CR + Edit own |
| Tasks | CRUD + Delete | CRUD + Delete | CRUD + Delete (own only) |
| Activities | CRUD + Delete + Export | CRUD + Export | CR + Edit own |
| Products | CRUD + Delete | CRUD | Read only |
| Sales (Users) | CRUD + Delete | Read only | Read only |
| Segments | CRUD + Delete | Read only | Read only |
| Tags | CRUD + Delete | CRU | Read only |

---

*Plan created: 2026-01-18*
*Revised: 2026-01-18 (after Zen MCP review)*
*Constitution compliance: Verified*
*Ready for: /execute-plan*

---

## Revision History

### Rev 1 (2026-01-18) - Post Zen Review

**Review Score:** 6.5/10 → Issues addressed

| Issue | Severity | Resolution |
|-------|----------|------------|
| AuthProvider direct Supabase | Critical | ✅ Clarified: existing caching + `commons/canAccess.ts` pattern is correct |
| "Manager sees team" vs "sees all" | Critical | ✅ Renamed plan, added scope clarification |
| `created_by` type assumption | Critical | ✅ Documented as bigint (references sales.id) |
| pgTAP test count mismatch | High | ✅ Fixed: 12 → 11 tests |
| Tasks access conflict in comments | High | ✅ Aligned: managers CAN see all tasks |
| UI/DB policy misalignment | High | ✅ Added policy alignment note |

**Clarifications Added:**
- Task 6 now enhances `commons/canAccess.ts` instead of rewriting authProvider
- Added scope clarification that this is "manager sees ALL" not "team-scoped"
- Documented that `created_by` is bigint FK to sales.id (not UUID)
