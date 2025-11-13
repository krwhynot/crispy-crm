# Row Level Security (RLS) Policies

## Purpose

RLS policies enforce data access control at the database level, ensuring users can only access data they're authorized to see. For Crispy-CRM, we use a **shared team collaboration model** where all authenticated users can access shared resources.

## Core Pattern

### Enable RLS + Create Policies

```sql
-- Step 1: Enable RLS on table
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies for each operation
CREATE POLICY <policy_name> ON <table_name>
  FOR <operation>
  TO <role>
  USING (<condition>)        -- For SELECT, UPDATE, DELETE
  WITH CHECK (<condition>);  -- For INSERT, UPDATE
```

## Crispy-CRM Access Model

**Shared Team Collaboration:**
- All authenticated users can read/write shared resources
- Soft deletes handled by application (`deleted_at IS NULL` in queries)
- Service role has full access for Edge Functions
- Anon role has no access (must be authenticated)

### Standard Policy Template

```sql
-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can SELECT
CREATE POLICY authenticated_select_<table_name> ON <table_name>
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Policy: Authenticated users can INSERT
CREATE POLICY authenticated_insert_<table_name> ON <table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE their records
CREATE POLICY authenticated_update_<table_name> ON <table_name>
  FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

-- Policy: Authenticated users can DELETE (soft delete)
CREATE POLICY authenticated_delete_<table_name> ON <table_name>
  FOR DELETE
  TO authenticated
  USING (deleted_at IS NULL);

-- Policy: Service role has full access (for Edge Functions)
CREATE POLICY service_full_access_<table_name> ON <table_name>
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Real-World Example: Notifications Table

**From Crispy-CRM migration:**

```sql
-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT only their own notifications
CREATE POLICY authenticated_select_own_notifications ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: System/service role can INSERT notifications for any user
-- (Edge Functions will use service role to create notifications)
CREATE POLICY service_insert_notifications ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Users can UPDATE only their own notifications (mark as read)
CREATE POLICY authenticated_update_own_notifications ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Only service role can DELETE (users cannot delete their own notifications)
-- Cleanup is handled by auto-delete trigger
CREATE POLICY service_delete_old_notifications ON notifications
  FOR DELETE
  TO service_role
  USING (true);
```

**Why this pattern:**
- Users can only see their own notifications
- Edge Functions (service role) can create notifications for any user
- Users can mark their own notifications as read
- Only automated cleanup can delete (prevents user mistakes)

## Policy Patterns by Use Case

### Pattern 1: Shared Team Resources (Organizations, Contacts)

```sql
-- Everyone on the team can access all records
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY authenticated_insert_organizations ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY authenticated_update_organizations ON organizations
  FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

CREATE POLICY authenticated_delete_organizations ON organizations
  FOR DELETE
  TO authenticated
  USING (deleted_at IS NULL);
```

### Pattern 2: User-Owned Resources (Notifications)

```sql
-- Users can only access their own records
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_select_own_notifications ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY authenticated_update_own_notifications ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Pattern 3: Service-Only Operations (System Tables)

```sql
-- Only Edge Functions can modify these records
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_insert_audit_logs ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY authenticated_select_audit_logs ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);  -- Can read, but not modify
```

### Pattern 4: Hierarchical Access (Multi-Tenant)

```sql
-- Users can only access records in their tenant
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_select_organizations ON organizations
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id 
      FROM sales 
      WHERE id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Note: For Crispy-CRM, we're not using multi-tenant yet,
-- but this pattern is here for future reference
```

## Performance Optimization

### ⚠️ DON'T Put `deleted_at IS NULL` in Policies

```sql
-- ❌ BAD: Slows down every query
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);  -- ← This checks on EVERY row

-- ✅ GOOD: Handle in application queries
CREATE POLICY authenticated_select_organizations ON organizations
  FOR SELECT
  TO authenticated
  USING (true);  -- Simple policy

-- Then in queries:
-- SELECT * FROM organizations WHERE deleted_at IS NULL;
```

**Why:** 
- Policy runs on every row scan
- `deleted_at IS NULL` index can't be used efficiently
- Better to filter in the query with indexed column

**Exception:** If you must enforce at policy level for security, use it, but add an index:
```sql
CREATE INDEX idx_organizations_not_deleted ON organizations(id) WHERE deleted_at IS NULL;
```

### Index Policy Columns

```sql
-- If policy uses user_id
CREATE POLICY user_owned_records ON table_name
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- MUST have index on user_id
CREATE INDEX idx_table_name_user_id ON table_name(user_id);
```

### Keep Policies Simple

```sql
-- ❌ BAD: Complex logic in policy (slow)
CREATE POLICY complex_policy ON opportunities
  FOR SELECT
  TO authenticated
  USING (
    (stage = 'open' AND assigned_to = auth.uid())
    OR 
    (stage IN ('won', 'lost') AND created_by = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_id = opportunities.team_id 
      AND user_id = auth.uid()
    )
  );

-- ✅ GOOD: Simple policy, complex logic in Edge Function
CREATE POLICY simple_policy ON opportunities
  FOR SELECT
  TO authenticated
  USING (true);

-- Then use Edge Function for complex authorization
```

## Testing RLS Policies

### Test in SQL Editor

```sql
-- Switch to authenticated role
SET ROLE authenticated;

-- Set current user (simulate logged-in user)
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try SELECT (should only see allowed records)
SELECT * FROM organizations;

-- Reset role
RESET ROLE;
```

### Test with Service Layer

```typescript
// In your test file
describe('Organization RLS', () => {
  it('should only return records for authenticated user', async () => {
    // Create test user and authenticate
    const { user } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    });

    // Query organizations
    const { data, error } = await supabase
      .from('organizations')
      .select('*');

    // Should succeed if RLS policy allows
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should prevent access for anonymous users', async () => {
    // Sign out to become anonymous
    await supabase.auth.signOut();

    // Try to query
    const { data, error } = await supabase
      .from('organizations')
      .select('*');

    // Should fail due to RLS
    expect(error).toBeDefined();
    expect(error?.code).toBe('PGRST301'); // Supabase RLS error
  });
});
```

## Common Issues & Solutions

### Issue: "permission denied for table"

**Cause:** RLS is enabled but no policies grant access

**Solution:** Create appropriate policies for all operations
```sql
-- Add policies for SELECT, INSERT, UPDATE, DELETE
CREATE POLICY authenticated_select_table ON table_name
  FOR SELECT TO authenticated USING (true);
```

### Issue: Policies work in SQL but not in code

**Cause:** User not authenticated or JWT not set

**Solution:** Verify authentication
```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  throw new Error('Not authenticated');
}
```

### Issue: Service role policies not working

**Cause:** Using wrong API key

**Solution:** Use service role key for Edge Functions
```typescript
// ❌ BAD: Using anon key in Edge Function
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!  // ← Wrong key
);

// ✅ GOOD: Using service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // ← Correct key
);
```

## Migration Template

**Complete RLS setup in migration:**

```sql
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_entity_rls.sql

-- =====================================================
-- Enable Row Level Security
-- =====================================================

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies for authenticated users
-- =====================================================

-- SELECT: Can view all non-deleted records
CREATE POLICY authenticated_select_entities ON entities
  FOR SELECT
  TO authenticated
  USING (true);  -- Filtered by deleted_at in queries

-- INSERT: Can create new records
CREATE POLICY authenticated_insert_entities ON entities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()  -- Track creator
  );

-- UPDATE: Can modify any record
CREATE POLICY authenticated_update_entities ON entities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    updated_by = auth.uid()  -- Track updater
  );

-- DELETE: Can soft delete any record
CREATE POLICY authenticated_delete_entities ON entities
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- Policies for service role (Edge Functions)
-- =====================================================

CREATE POLICY service_full_access_entities ON entities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Supporting Indexes
-- =====================================================

-- Index for created_by queries (if needed)
CREATE INDEX idx_entities_created_by ON entities(created_by);

-- Index for updated_by queries (if needed)
CREATE INDEX idx_entities_updated_by ON entities(updated_by);
```

## Best Practices

### DO
✅ Enable RLS on all user-facing tables
✅ Create policies for all CRUD operations
✅ Use service_role for Edge Functions
✅ Index columns used in policies
✅ Keep policies simple for performance
✅ Test policies with different roles
✅ Document why each policy exists

### DON'T
❌ Disable RLS in production
❌ Use complex logic in policies (use Edge Functions)
❌ Put `deleted_at IS NULL` in policies (filter in queries)
❌ Grant broad permissions to anon role
❌ Skip testing policies before deployment
❌ Use service role key in client-side code
❌ Create policies without matching indexes

## Related Resources

- [Service Layer](service-layer.md) - DataProvider abstraction
- [Edge Functions](edge-functions.md) - Service role operations
- [Migrations](migrations.md) - Adding RLS to new tables
- [Testing](testing.md) - Testing RLS policies
