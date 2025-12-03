# Database: Role-Based Permissions

## Purpose

Document role-based permission patterns using helper functions and RLS policies.

## Pattern: Helper Functions

**From `20251111121526_add_role_based_permissions.sql:51`:**

```sql
-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_role() IS 'Returns the role of the currently authenticated user';

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user has admin role';

-- Check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get current user's sales_id
CREATE OR REPLACE FUNCTION public.current_sales_id()
RETURNS BIGINT AS $$
  SELECT id FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

**Why SECURITY DEFINER:**
- Runs with definer's privileges (bypasses RLS)
- Needed to query sales table from RLS context
- Stable for performance (result cacheable)

## Pattern: Personal Ownership (Tasks)

```sql
-- SELECT: All authenticated users can view all tasks
CREATE POLICY select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Users can only create tasks assigned to themselves
CREATE POLICY insert_tasks ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (sales_id = public.current_sales_id());

-- UPDATE: Reps can only update their own, managers/admins can update all
CREATE POLICY update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  )
  WITH CHECK (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );

-- DELETE: Only admins can delete tasks
CREATE POLICY delete_tasks ON tasks
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

## Pattern: Shared Resources (Contacts, Organizations)

```sql
-- All can view and edit, only admins can delete
CREATE POLICY select_contacts ON contacts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY insert_contacts ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY update_contacts ON contacts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

## Permission Matrix

| Resource | Admin | Manager | Rep |
|----------|-------|---------|-----|
| **Shared (Contacts/Orgs/Products)** |
| View | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit | ✅ All | ✅ All | ✅ All |
| Delete | ✅ | ❌ | ❌ |
| **Personal (Tasks/Notes)** |
| View | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit | ✅ All | ✅ All | ✅ Own |
| Delete | ✅ | ❌ | ❌ |
| **Opportunities** |
| View | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ (assigned to self) |
| Edit | ✅ All | ✅ All | ✅ Own |
| Delete | ✅ | ❌ | ❌ |

## Quick Reference

| Helper Function | Returns | Use Case |
|-----------------|---------|----------|
| `public.user_role()` | `user_role` enum | Get current user's role |
| `public.is_admin()` | `BOOLEAN` | Admin-only operations |
| `public.is_manager_or_admin()` | `BOOLEAN` | Manager+ operations |
| `public.current_sales_id()` | `BIGINT` | Ownership checks |

## Related Resources

- [database-security.md](database-security.md) - GRANT + RLS basics
- [database-advanced.md](database-advanced.md) - Triggers, views
- [database-reference.md](database-reference.md) - Decision tree

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
