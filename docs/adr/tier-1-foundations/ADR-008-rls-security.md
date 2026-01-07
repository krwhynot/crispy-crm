# ADR-008: Row Level Security at Database Layer

## Status

**Accepted** - 2025-12-30

## Context

Crispy CRM requires a security model that protects data while enabling collaborative team workflows. The system serves MFB, a food distribution broker with:

- **6 account managers** who collaborate on shared customer data
- **Single organization** (not multi-tenant SaaS)
- **Shared CRM data** (contacts, opportunities, organizations) visible to all team members
- **Personal data** (tasks) restricted to creator only
- **Role-based access** (admin, manager, rep) for administrative actions

### Security Requirements

1. **Authentication boundary**: Only authenticated users can access any data
2. **Defense in depth**: Security enforced at database level, not just application layer
3. **Personal data isolation**: Tasks visible only to their creator
4. **Role-based operations**: Delete operations restricted to admins
5. **Audit compliance**: Soft-deleted records hidden at database level

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Database RLS (chosen)** | Defense in depth, can't bypass, PostgreSQL native, query planner integrated | More complex migrations, harder to debug policies |
| **Application middleware** | Easier to test, familiar patterns | Bypassable via direct DB access, easy to forget checks |
| **API gateway (e.g., OPA)** | Centralized policy, language-agnostic | External dependency, latency, operational complexity |
| **Supabase RLS + JS client** | Simpler policy syntax | Still database-level, JS client limitations |

### Decision Drivers

1. **Defense in Depth**: RLS catches bugs where application code forgets authorization checks
2. **Bypass Prevention**: Direct database access (admin tools, migrations) cannot circumvent security
3. **PostgreSQL Native**: No external dependencies, integrates with query planner for performance
4. **Future Multi-Tenant Path**: RLS architecture supports easy upgrade to multi-tenant SaaS

## Decision

Implement **Row Level Security (RLS) at the PostgreSQL database layer** with a deliberate **single-tenant trusted team model**.

### Security Model: Shared Team Access

All authenticated users are trusted team members of MFB. The primary security boundary is **authentication**, not data isolation between users.

```
+------------------+     +--------------------+     +------------------+
| Anonymous        | --> | Supabase Auth      | --> | Authenticated    |
| (anon role)      |     | (JWT validation)   |     | (team member)    |
| NO ACCESS        |     |                    |     | FULL TEAM ACCESS |
+------------------+     +--------------------+     +------------------+
```

### Core Components

**1. Helper Functions for User Context**

```sql
-- Get current user's sales record ID
CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

**2. Shared Data Policy Pattern (contacts, opportunities, organizations)**

All authenticated team members can access shared CRM data:

```sql
-- From 20251029024045_fix_rls_policies_company_isolation.sql
CREATE POLICY authenticated_select_opportunities ON opportunities
  FOR SELECT
  TO authenticated
  USING (
    -- SINGLE COMPANY MODEL: All authenticated users can see all opportunities
    -- FUTURE MULTI-TENANT: Replace with company_id check
    true
  );

CREATE POLICY authenticated_insert_opportunities ON opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY authenticated_update_opportunities ON opportunities
  FOR UPDATE
  TO authenticated
  USING (true);
```

**3. Personal Data Policy Pattern (tasks)**

Tasks are personal - only the creator and managers/admins can access:

```sql
-- From 20251127054700_fix_critical_rls_security_tasks.sql
CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT
  TO authenticated
  USING (
    -- Managers and admins can see all tasks
    public.is_manager_or_admin()
    OR
    -- Regular users see tasks assigned to them
    sales_id = public.current_sales_id()
    OR
    -- Or tasks they created (even if reassigned)
    created_by = public.current_sales_id()
  );

CREATE POLICY tasks_insert_policy ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sales_id = public.current_sales_id()
    OR
    public.is_manager_or_admin()
  );
```

**4. Soft Delete Integration (Defense in Depth)**

All SELECT policies include `deleted_at IS NULL` to hide soft-deleted records:

```sql
-- From 20251129180728_add_soft_delete_rls_filtering.sql
CREATE POLICY "select_contacts"
ON contacts
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Complex policies combine soft-delete with ownership
CREATE POLICY "tasks_select_policy"
ON tasks
FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL
    AND (
        is_manager_or_admin()
        OR sales_id = current_sales_id()
        OR created_by = current_sales_id()
    )
);
```

**5. Admin-Only Delete Pattern**

Hard deletes restricted to admin role across all tables:

```sql
CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY delete_tasks ON tasks
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**6. Future Multi-Tenant Upgrade Path**

Helper function and documentation prepared for SaaS expansion:

```sql
-- Placeholder for future multi-tenant expansion
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS BIGINT AS $$
  -- NOTE: Currently returns NULL - no company isolation implemented
  -- To enable company isolation:
  -- 1. Add sales.company_id column
  -- 2. Backfill with actual company assignments
  -- 3. Replace this query:
  --    SELECT company_id FROM public.sales WHERE user_id = auth.uid() LIMIT 1;
  SELECT NULL::BIGINT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- TO UPGRADE TO MULTI-TENANT:
-- 1. Add column: ALTER TABLE sales ADD COLUMN company_id BIGINT REFERENCES organizations(id);
-- 2. Backfill: UPDATE sales SET company_id = 1;
-- 3. Update get_current_user_company_id() to return actual company
-- 4. Replace all "USING (true)" with proper company_id checks
-- 5. Add NOT NULL constraint
```

### Permission Matrix

| Resource | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|
| **Shared** (contacts, orgs, products) | All team | All team | All team | Admin only |
| **Opportunities** | All team | All team | All team | Admin only |
| **Tasks** | Own + Managers/Admins | Own | Own + Managers/Admins | Admin only |
| **Notes** | All team | Own | Own + Managers/Admins | Admin only |
| **Sales (users)** | All team | Admin only | Own profile / Admin all | Admin only |

### Role Definitions

```sql
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

-- admin: Full CRUD on all resources
-- manager: View all + Edit all + No delete
-- rep: View all + Edit own only + No delete
```

## Consequences

### Positive

1. **Defense in Depth**: Application bugs cannot expose unauthorized data - RLS is the final security layer
2. **Bypass Prevention**: Direct database access (pgAdmin, migrations, Edge Functions) respects RLS
3. **Query Planner Integration**: PostgreSQL optimizes queries with RLS predicates for performance
4. **Soft Delete Enforcement**: Deleted records invisible at database level, even if app forgets to filter
5. **Future-Proofed**: Multi-tenant upgrade path documented without current implementation overhead
6. **Audit Trail**: Helper functions provide consistent user context across all operations

### Negative

1. **Debugging Complexity**: RLS policy violations surface as "no rows returned" rather than permission errors
2. **Migration Overhead**: Each table requires 4 policies (SELECT, INSERT, UPDATE, DELETE)
3. **Policy Conflicts**: Multiple policies can create unexpected behavior (OR logic by default)
4. **Testing Burden**: Tests must verify policies work correctly with different user contexts

### Neutral

1. **Documentation Requirement**: Policies must be documented or team will not understand security model
2. **Helper Function Dependency**: All policies rely on `current_sales_id()` and role-checking functions
3. **Single-Tenant Assumption**: Current model intentionally exposes all team data; must re-evaluate for SaaS

## Anti-Patterns

### Permissive Policies Without Documentation

```sql
-- WRONG: Undocumented USING (true) looks like a security hole
CREATE POLICY select_opportunities ON opportunities
  FOR SELECT TO authenticated
  USING (true);  -- Why is this open? Is it a bug?

-- RIGHT: Document intentional shared access
CREATE POLICY select_opportunities ON opportunities
  FOR SELECT TO authenticated
  USING (
    -- SINGLE COMPANY MODEL: All authenticated users can see all opportunities
    -- This assumes all users work for same company.
    -- FUTURE MULTI-TENANT: Replace with company_id check
    true
  );
```

### Forgetting Soft Delete in SELECT Policies

```sql
-- WRONG: Exposes soft-deleted records
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

-- RIGHT: Filter soft-deleted records at RLS level
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
```

### Using `anon` Role for Authenticated Data

```sql
-- WRONG: Anonymous role should never access CRM data
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO anon  -- SECURITY HOLE
  USING (true);

-- RIGHT: Restrict to authenticated role only
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
```

### Inline User Lookups Instead of Helper Functions

```sql
-- WRONG: Repeated subqueries, hard to maintain
CREATE POLICY tasks_select ON tasks
  FOR SELECT TO authenticated
  USING (
    created_by IN (SELECT id FROM sales WHERE user_id = auth.uid())
  );

-- RIGHT: Use SECURITY DEFINER helper function
CREATE POLICY tasks_select ON tasks
  FOR SELECT TO authenticated
  USING (created_by = public.current_sales_id());
```

### Bypassing Data Provider

```typescript
// WRONG: Direct Supabase access bypasses application validation
import { supabase } from "@/providers/supabase/supabase";
await supabase.from("contacts").insert(data);

// RIGHT: Use unified data provider (RLS still applies, but validation added)
await dataProvider.create("contacts", { data });
```

## Key Migrations

| Migration | Purpose |
|-----------|---------|
| `20251029024045_fix_rls_policies_company_isolation.sql` | Establishes shared team model with documented USING(true) |
| `20251111121526_add_role_based_permissions.sql` | Creates role enum, helper functions, and RBAC policies |
| `20251127054700_fix_critical_rls_security_tasks.sql` | Restores ownership-based task policies after accidental override |
| `20251129030715_add_is_manager_helper.sql` | Completes RBAC helper function set |
| `20251129180728_add_soft_delete_rls_filtering.sql` | Adds `deleted_at IS NULL` to all 17 SELECT policies |

## Related ADRs

- **ADR-001: Unified Data Provider** - Single entry point ensures RLS is always active
- **ADR-007: Soft Delete Pattern** - `deleted_at` filtering integrated into RLS policies
- **ADR-015: Edge Functions** - Edge Functions run with service role; must implement own authorization

## References

- Implementation: `supabase/migrations/20251029024045_fix_rls_policies_company_isolation.sql`
- Supabase RLS Documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
