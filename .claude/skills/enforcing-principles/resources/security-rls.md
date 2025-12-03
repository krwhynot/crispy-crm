# Security: RLS & Authentication

## Purpose

Document RLS policy patterns, authentication, and role-based access control.

## Pattern: User Authentication Check

```sql
-- Get current authenticated user's ID
auth.uid()

-- Example: Only allow users to update their own profile
CREATE POLICY update_own_profile ON sales
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Pattern: Role-Based Access Control

```sql
-- Helper function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM sales WHERE user_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Policy: Only admins can delete contacts
CREATE POLICY delete_contacts ON contacts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Policy: Reps can only edit their own tasks
CREATE POLICY update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_manager_or_admin() OR
    sales_id = public.current_sales_id()
  );
```

## Pattern: Prevent Data Leakage

```sql
-- ❌ WRONG - Leaks all rows
CREATE POLICY select_all ON contacts
  FOR SELECT TO authenticated
  USING (true);

-- ✅ CORRECT - Filters by company/team
CREATE POLICY select_team_contacts ON contacts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM sales
      WHERE user_id = auth.uid()
    )
  );
```

## Pattern: JWT Token Validation

```typescript
// Supabase client automatically validates JWT tokens
const { data: { session }, error } = await supabase.auth.getSession();

if (!session) {
  navigate('/login');
  return;
}

// Session contains:
// - session.user.id (UUID)
// - session.user.email
// - session.access_token (JWT)
// - session.expires_at
```

## Pattern: Protected Routes

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: { session }, isPending } = useGetIdentity();

  if (isPending) return <Loading />;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usage
<Route path="/contacts" element={
  <ProtectedRoute>
    <ContactList />
  </ProtectedRoute>
} />
```

## Pattern: Admin-Only Actions

```typescript
const { identity } = useGetIdentity();

const canDelete = identity?.role === 'admin';

return (
  <DeleteButton
    disabled={!canDelete}
    confirmTitle="Delete Contact"
    confirmContent="This action cannot be undone"
  />
);
```

## Quick Reference

| Action | Policy |
|--------|--------|
| User's own data | `USING (user_id = auth.uid())` |
| Admin only | `USING (public.is_admin())` |
| Manager+ | `USING (public.is_manager_or_admin())` |
| Owner or manager | `USING (is_manager_or_admin() OR owner_id = current_sales_id())` |

## Related Resources

- [database-security.md](database-security.md) - GRANT + RLS
- [database-roles.md](database-roles.md) - Role-based permissions
- [security-sql.md](security-sql.md) - SQL injection prevention

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
