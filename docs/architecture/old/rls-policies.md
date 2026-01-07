# Row Level Security Policies

> **Generated:** 2025-12-22
> **Database:** Crispy CRM (Supabase PostgreSQL 17)
> **Total Tables:** 26 (all RLS-enabled)
> **Total Policies:** 149
> **SECURITY DEFINER Functions:** 60

## Security Model

### Authentication Layer
- **Provider:** Supabase Auth (JWT-based)
- **User Mapping:** `auth.uid()` UUID maps to `sales.user_id`
- **Role Storage:** `sales.is_admin` boolean + helper functions

### Two-Layer Security (per Constitution)
```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: GRANT Statements                                   │
│ ─────────────────────────────────────────────────────────── │
│ Controls WHICH tables/operations a role can access          │
│ (authenticated, anon, service_role)                         │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: RLS Policies                                       │
│ ─────────────────────────────────────────────────────────── │
│ Controls WHICH rows within permitted tables                 │
│ (ownership, role-based, soft-delete filtering)              │
└─────────────────────────────────────────────────────────────┘
```

### Default Security Mode
- **Functions:** `SECURITY INVOKER` (executes with caller's privileges)
- **Views:** `SECURITY INVOKER` (fixed in migration `20251130010932`)
- **Critical Functions:** `SECURITY DEFINER` with `SET search_path = ''` to prevent hijacking

### Role-Based Access Control (3 Tiers)

| Role | SELECT | INSERT | UPDATE | DELETE | Description |
|------|--------|--------|--------|--------|-------------|
| **admin** | All | All | All | All | Full system access |
| **manager** | All | All | All | No | Team oversight |
| **rep** | All | Own | Own | No | Personal workspace |

---

## Policy Inventory

### Core CRM Tables

#### opportunities

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `select_opportunities` | SELECT | `deleted_at IS NULL` | - |
| `insert_opportunities` | INSERT | - | `account_manager_id = current_sales_id()` |
| `update_opportunities` | UPDATE | `is_manager_or_admin() OR account_manager_id = current_sales_id() OR opportunity_owner_id = current_sales_id() OR created_by = current_sales_id()` | Same as USING |
| `delete_opportunities` | DELETE | `is_admin()` | - |

**Full SQL:**
```sql
CREATE POLICY select_opportunities ON opportunities
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY insert_opportunities ON opportunities
  FOR INSERT TO authenticated
  WITH CHECK (account_manager_id = public.current_sales_id());

CREATE POLICY update_opportunities ON opportunities
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    account_manager_id = public.current_sales_id() OR
    opportunity_owner_id = public.current_sales_id() OR
    created_by = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    account_manager_id = public.current_sales_id() OR
    opportunity_owner_id = public.current_sales_id() OR
    created_by = public.current_sales_id()
  );

CREATE POLICY delete_opportunities ON opportunities
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**Security Model:** Shared read, ownership-based write (account_manager_id), admin-only delete

---

#### contacts

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `select_contacts` | SELECT | `deleted_at IS NULL` | - |
| `insert_contacts` | INSERT | - | `true` |
| `authenticated_update_contacts` | UPDATE | `is_admin() = true` | - |
| `delete_contacts` | DELETE | `is_admin()` | - |

**Full SQL:**
```sql
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY authenticated_update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true);

CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**Security Model:** Shared read/insert, admin-only update/delete

---

#### organizations

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `select_organizations` | SELECT | `deleted_at IS NULL` | - |
| `insert_organizations` | INSERT | - | `true` |
| `update_organizations` | UPDATE | `true` | `true` |
| `delete_organizations` | DELETE | `is_admin()` | - |

**Full SQL:**
```sql
CREATE POLICY select_organizations ON organizations
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY insert_organizations ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY update_organizations ON organizations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_organizations ON organizations
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**Security Model:** Shared read/insert/update, admin-only delete

---

#### activities

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `authenticated_select_activities` | SELECT | `deleted_at IS NULL` | - |
| `authenticated_insert_activities` | INSERT | - | `auth.uid() IS NOT NULL` |
| `authenticated_update_activities` | UPDATE | `auth.uid() IS NOT NULL` | `auth.uid() IS NOT NULL` |
| `authenticated_delete_activities` | DELETE | `auth.uid() IS NOT NULL` | - |

**Full SQL:**
```sql
CREATE POLICY authenticated_select_activities ON activities
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY authenticated_insert_activities ON activities
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY authenticated_update_activities ON activities
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY authenticated_delete_activities ON activities
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);
```

**Security Model:** Shared team access for all operations

---

#### tasks

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `tasks_select_policy` | SELECT | `deleted_at IS NULL AND (is_manager_or_admin() OR sales_id = current_sales_id() OR created_by = current_sales_id())` | - |
| `tasks_insert_policy` | INSERT | - | `sales_id = current_sales_id() OR is_manager_or_admin()` |
| `tasks_update_policy` | UPDATE | `is_manager_or_admin() OR sales_id = current_sales_id()` | Same as USING |
| `tasks_delete_policy` | DELETE | `is_admin()` | - |

**Full SQL:**
```sql
CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      public.is_manager_or_admin() OR
      sales_id = public.current_sales_id() OR
      created_by = public.current_sales_id()
    )
  );

CREATE POLICY tasks_insert_policy ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    sales_id = public.current_sales_id() OR
    public.is_manager_or_admin()
  );

CREATE POLICY tasks_update_policy ON tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

CREATE POLICY tasks_delete_policy ON tasks
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

**Security Model:** Personal + creator visibility, ownership-based write, admin-only delete

**Security History:** Critical fix in `20251127054700_fix_critical_rls_security_tasks.sql` - restored ownership-based policies after accidental `USING(true)` restoration

---

#### products

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `select_products` | SELECT | `deleted_at IS NULL` | - |
| `insert_products` | INSERT | - | `true` |
| `update_products` | UPDATE | `true` | `true` |
| `delete_products` | DELETE | `is_admin()` | - |

**Security Model:** Shared read/insert/update, admin-only delete

---

#### sales (User Management)

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `select_sales` | SELECT | `deleted_at IS NULL` | - |
| `insert_sales` | INSERT | - | `is_admin()` |
| `update_sales` | UPDATE | `is_admin() OR user_id = auth.uid()` | `is_admin() OR (user_id = auth.uid() AND role = (SELECT role FROM sales WHERE user_id = auth.uid()))` |
| `delete_sales` | DELETE | `is_admin()` | - |

**Security Model:** Shared read, admin creates users, self-edit profile (cannot change own role), admin-only delete

---

### Notes Tables

#### contact_notes

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `select_contactnotes` | SELECT | `deleted_at IS NULL` | - |
| `insert_contactNotes` | INSERT | - | `sales_id = current_sales_id()` |
| `update_contactNotes` | UPDATE | `is_manager_or_admin() OR sales_id = current_sales_id()` | Same as USING |
| `delete_contactNotes` | DELETE | `is_admin()` | - |

**Security Model:** Shared read, ownership-based write

---

#### opportunity_notes

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `select_opportunitynotes` | SELECT | `deleted_at IS NULL` | - |
| `insert_opportunityNotes` | INSERT | - | `sales_id = current_sales_id()` |
| `update_opportunityNotes` | UPDATE | `is_manager_or_admin() OR sales_id = current_sales_id()` | Same as USING |
| `delete_opportunityNotes` | DELETE | `is_admin()` | - |

**Security Model:** Shared read, ownership-based write

---

#### organization_notes

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `authenticated_select_organizationNotes` | SELECT | `deleted_at IS NULL AND auth.uid() IS NOT NULL` | - |
| `authenticated_insert_organizationNotes` | INSERT | - | `auth.uid() IS NOT NULL` |
| `authenticated_update_organizationNotes` | UPDATE | `auth.uid() IS NOT NULL AND sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid())` | Same as USING |
| `authenticated_delete_organizationNotes` | DELETE | Same as UPDATE | - |

**Security Model:** Shared read/insert, ownership-based update/delete

---

### Junction Tables

#### opportunity_contacts

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `Users can view opportunity contacts in their company` | SELECT | Complex EXISTS via opportunities join | - |
| Similar INSERT/UPDATE/DELETE | ALL | Company-scoped via opportunities | - |

**Security Model:** Company-scoped via opportunities relationship

---

#### opportunity_products

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `Users can view opportunity products in their company` | SELECT | `deleted_at IS NULL AND EXISTS (SELECT 1 FROM opportunities o JOIN sales s ON s.id = o.opportunity_owner_id WHERE o.id = opportunity_products.opportunity_id AND s.user_id = auth.uid())` | - |

**Security Model:** Company-scoped via opportunities

---

#### opportunity_participants

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `opportunity_participants_select_policy` | SELECT | `deleted_at IS NULL` | - |
| `opportunity_participants_insert_policy` | INSERT | - | `true` |
| `opportunity_participants_update_policy` | UPDATE | `created_by = current_sales_id() OR owns_opportunity(opportunity_id) OR is_manager_or_admin()` | Same as USING |
| `opportunity_participants_delete_policy` | DELETE | `is_admin()` | - |

**Security Model:** Shared read/insert, ownership-based update, admin-only delete

---

#### interaction_participants

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `interaction_participants_select_policy` | SELECT | `deleted_at IS NULL` | - |
| `interaction_participants_insert_policy` | INSERT | - | `true` |
| `interaction_participants_update_policy` | UPDATE | `created_by = current_sales_id() OR owns_activity(activity_id) OR is_manager_or_admin()` | Same as USING |
| `interaction_participants_delete_policy` | DELETE | `is_admin()` | - |

**Security Model:** Shared read/insert, ownership-based update, admin-only delete

---

### Reference Data Tables

#### product_distributors

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `Authenticated users can view product_distributors` | SELECT | `auth.uid() IS NOT NULL AND deleted_at IS NULL` | - |
| `Admins can insert product_distributors` | INSERT | - | `is_admin()` |
| `Admins can update product_distributors` | UPDATE | `is_admin()` | `is_admin()` |
| `Admins can delete product_distributors` | DELETE | `is_admin()` | - |

**Security Model:** Shared read, admin-only write (reference data)

**Security History:** Critical fix in `20251222011040_fix_product_distributors_rls.sql` - fixed `USING(true)` vulnerability allowing cross-tenant data leakage

---

#### distributor_principal_authorizations

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `authenticated_select_distributor_principal_authorizations` | SELECT | `deleted_at IS NULL AND auth.uid() IS NOT NULL` | - |
| `authenticated_insert_distributor_principal_authorizations` | INSERT | - | `auth.uid() IS NOT NULL` |
| `authenticated_update_distributor_principal_authorizations` | UPDATE | `auth.uid() IS NOT NULL` | `auth.uid() IS NOT NULL` |
| `authenticated_delete_distributor_principal_authorizations` | DELETE | `auth.uid() IS NOT NULL` | - |

**Security Model:** Shared team access for all operations

---

#### organization_distributors

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `authenticated_select_organization_distributors` | SELECT | `auth.uid() IS NOT NULL` | - |
| `authenticated_insert_organization_distributors` | INSERT | - | `auth.uid() IS NOT NULL` |
| `authenticated_update_organization_distributors` | UPDATE | `auth.uid() IS NOT NULL` | `auth.uid() IS NOT NULL` |
| `authenticated_delete_organization_distributors` | DELETE | `auth.uid() IS NOT NULL` | - |

**Security Model:** Shared team access for all operations

---

#### segments

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `Allow authenticated read access` | SELECT | `deleted_at IS NULL` | - |
| `Allow authenticated users to create` | INSERT | - | `true` |
| Standard UPDATE/DELETE | ALL | Authenticated policies | - |

**Security Model:** Shared team access

---

#### tags

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `authenticated_select_tags` | SELECT | `deleted_at IS NULL` | - |
| Standard INSERT/UPDATE/DELETE | ALL | Authenticated policies | - |

**Security Model:** Shared team access

---

### User-Scoped Tables

#### notifications

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `authenticated_select_own_notifications` | SELECT | `deleted_at IS NULL AND user_id = auth.uid()` | - |
| `service_insert_notifications` | INSERT (service_role) | - | `true` |
| `authenticated_update_own_notifications` | UPDATE | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `service_delete_old_notifications` | DELETE (service_role) | `true` | - |

**Security Model:** User-scoped (own notifications only), service_role for system CRUD

---

#### tutorial_progress

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `Users can view own tutorial progress` | SELECT | `sales_id = get_current_sales_id()` | - |
| `Users can insert own tutorial progress` | INSERT | - | `sales_id = get_current_sales_id()` |
| `Users can update own tutorial progress` | UPDATE | `sales_id = get_current_sales_id()` | `sales_id = get_current_sales_id()` |

**Security Model:** Strictly user-scoped (own progress only), no DELETE

---

#### dashboard_snapshots

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| `authenticated_select_dashboard_snapshots` | SELECT | `sales_id = current_sales_id() OR is_manager_or_admin()` | - |
| No INSERT/UPDATE/DELETE policies | - | Service role only (Edge Functions) | - |

**Security Model:** User-scoped SELECT + manager visibility, service_role writes

---

### System Tables

#### audit_trail

- **No user-facing RLS policies** - System table for audit logging only
- **Access:** `service_role` only
- **Purpose:** Immutable audit log for compliance

---

#### test_user_metadata

| Policy | Operation | USING Clause | WITH CHECK |
|--------|-----------|--------------|------------|
| Standard authenticated policies | ALL | `auth.uid() IS NOT NULL` | - |

**Security Model:** Test data management table

---

#### migration_history

- **RLS Enabled:** Yes
- **Access:** Limited to system operations
- **Purpose:** Track database migration state

---

## Helper Functions (SECURITY DEFINER)

These functions execute with elevated privileges to support RLS policies:

### Core Permission Functions

```sql
-- Returns current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN is_admin THEN 'admin'
    WHEN is_manager THEN 'manager'
    ELSE 'rep'
  END
  FROM public.sales
  WHERE user_id = auth.uid();
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.sales WHERE user_id = auth.uid()),
    false
  );
$$;

-- Check if user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_admin OR is_manager FROM public.sales WHERE user_id = auth.uid()),
    false
  );
$$;

-- Get current user's sales record ID
CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid();
$$;
```

### Ownership Check Functions

```sql
-- Check if user owns an opportunity
CREATE OR REPLACE FUNCTION public.owns_opportunity(opp_id BIGINT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE id = opp_id
    AND (
      account_manager_id = public.current_sales_id() OR
      opportunity_owner_id = public.current_sales_id() OR
      created_by = public.current_sales_id()
    )
  );
$$;

-- Check if user owns an activity
CREATE OR REPLACE FUNCTION public.owns_activity(act_id BIGINT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.activities
    WHERE id = act_id
    AND created_by = public.current_sales_id()
  );
$$;
```

**Source:** `20251111121526_add_role_based_permissions.sql`, `20251129170506_harden_participant_tables_rls_security.sql`

**Security Pattern:** All SECURITY DEFINER functions use `SET search_path = ''` to prevent function hijacking attacks (remediated in `20251130010932_security_invoker_and_search_path_remediation.sql`).

---

## Soft-Delete Pattern

17 tables implement soft-delete via `deleted_at TIMESTAMPTZ`:

| Table | Has deleted_at | SELECT filters deleted_at |
|-------|---------------|---------------------------|
| activities | Yes | Yes |
| contacts | Yes | Yes |
| contact_notes | Yes | Yes |
| interaction_participants | Yes | Yes |
| opportunities | Yes | Yes |
| opportunity_notes | Yes | Yes |
| opportunity_participants | Yes | Yes |
| opportunity_products | Yes | Yes |
| organizations | Yes | Yes |
| organization_notes | Yes | Yes |
| products | Yes | Yes |
| sales | Yes | Yes |
| segments | Yes | Yes |
| tags | Yes | Yes |
| tasks | Yes | Yes |
| distributor_principal_authorizations | Yes | Yes |
| product_distributor_authorizations | Yes | Yes |

**RLS Enforcement:** All SELECT policies include `deleted_at IS NULL` for defense-in-depth (migration `20251129180728_add_soft_delete_rls_filtering.sql`).

---

## Security Audit Checklist

### RLS Coverage

- [x] All 26 public tables have RLS enabled
- [x] All tables have SELECT policy
- [x] All tables have INSERT policy (where applicable)
- [x] All tables have UPDATE policy (where applicable)
- [x] All tables have DELETE policy (where applicable)
- [x] Soft-deleted records filtered in SELECT policies

### Function Security

- [x] No unprotected SECURITY DEFINER functions
- [x] All SECURITY DEFINER functions use `SET search_path = ''`
- [x] Views converted to SECURITY INVOKER (migration `20251130010932`)

### Permission Security

- [x] GRANT statements properly scoped to authenticated/service_role
- [ ] **ISSUE:** `anon` role has full permissions (should be revoked)
- [x] Sequence permissions granted for INSERT operations

### Role-Based Access

- [x] Admin-only DELETE on sensitive tables
- [x] Manager elevation for team oversight
- [x] Ownership checks for user data isolation
- [x] Service role separation for system operations

---

## Security Issues & Remediation History

### CRIT-01: product_distributors Permissive Policies (FIXED)
- **Migration:** `20251222011040_fix_product_distributors_rls.sql`
- **Issue:** All 4 policies used `USING(true)`, allowing cross-tenant data leakage
- **Fix:** Changed to shared read, admin-only write pattern

### SEC-01: Tasks Permissive USING(true) (FIXED)
- **Migration:** `20251127054700_fix_critical_rls_security_tasks.sql`
- **Issue:** Accidental `USING(true)` restoration allowed any user to access any task
- **Fix:** Restored ownership-based policies with manager/admin elevation

### SEC-02: Missing Soft-Delete Filtering (FIXED)
- **Migration:** `20251129180728_add_soft_delete_rls_filtering.sql`
- **Issue:** 17 tables did not filter soft-deleted records in SELECT
- **Fix:** Added `deleted_at IS NULL` to all SELECT policies

### SEC-03: Permissive Participant Tables (FIXED)
- **Migration:** `20251129170506_harden_participant_tables_rls_security.sql`
- **Issue:** `USING(true)` for UPDATE/DELETE on participant tables
- **Fix:** Ownership-based UPDATE, admin-only DELETE

### SEC-04: SECURITY DEFINER Views (FIXED)
- **Migration:** `20251130010932_security_invoker_and_search_path_remediation.sql`
- **Issue:** 11 views used SECURITY DEFINER, bypassing RLS
- **Fix:** Converted all views to SECURITY INVOKER

### OPEN: Anonymous User Permissions
- **Status:** Needs remediation
- **Issue:** `anon` role has DELETE, TRUNCATE, TRIGGER on all tables
- **Risk:** Defense-in-depth violation (RLS still protects, but violates least-privilege)
- **Recommended Fix:**
```sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
```

### OPEN: Duplicate RLS Policies
- **Status:** Cleanup recommended
- **Issue:** `contact_notes` and `opportunity_notes` have duplicate policy sets
- **Impact:** Performance degradation, maintenance confusion
- **Recommended Fix:** Remove deprecated `authenticated_*` pattern policies

---

## Data Classification by Security Model

### Shared Team Data (all users read/write, admin deletes)
- contacts, organizations, products
- segments, tags
- distributor_principal_authorizations, organization_distributors

### Ownership-Based Data (shared read, own write)
- opportunities (account_manager_id)
- contact_notes, opportunity_notes, organization_notes (sales_id)
- tasks (sales_id + created_by)

### Admin-Only Write (shared read, admin write)
- sales (user management)
- product_distributors (reference data)

### User-Scoped Data (own data only)
- notifications (user_id)
- tutorial_progress (sales_id)

### Service Role Only
- audit_trail (system logging)
- dashboard_snapshots (Edge Function writes)

### Junction Tables (company/ownership scoped)
- opportunity_contacts, opportunity_products (via opportunities)
- opportunity_participants, interaction_participants (ownership-based UPDATE/DELETE)

---

## Key Migration Files

| Migration | Purpose |
|-----------|---------|
| `20251018152315_cloud_schema_fresh.sql` | Initial schema with baseline RLS |
| `20251108213039_fix_rls_policies_role_based_access.sql` | Admin-only UPDATE/DELETE |
| `20251111121526_add_role_based_permissions.sql` | 3-tier role system |
| `20251116124147_fix_permissive_rls_policies.sql` | Fixed conflicting policies |
| `20251127054700_fix_critical_rls_security_tasks.sql` | Tasks security fix |
| `20251129170506_harden_participant_tables_rls_security.sql` | Participant table security |
| `20251129180728_add_soft_delete_rls_filtering.sql` | Soft-delete filtering |
| `20251130010932_security_invoker_and_search_path_remediation.sql` | SECURITY INVOKER views |
| `20251222011040_fix_product_distributors_rls.sql` | product_distributors fix |

---

## Appendix: GRANT Statement Summary

```sql
-- Standard authenticated user permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE <table> TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE <table>_id_seq TO authenticated;

-- Service role full access
GRANT ALL ON TABLE <table> TO service_role;

-- Read-only tables (dashboard_snapshots)
GRANT SELECT ON TABLE dashboard_snapshots TO authenticated;

-- User-scoped tables with restricted DELETE (notifications)
GRANT SELECT, INSERT, UPDATE ON TABLE notifications TO authenticated;
GRANT DELETE ON TABLE notifications TO service_role;
```
