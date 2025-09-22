# RLS Policy Matrix

## Overview
This document details all Row-Level Security (RLS) policies implemented in the Atomic CRM database. All tables have RLS enabled with policies that restrict access to authenticated users only.

## Policy Summary Matrix

| Table | INSERT | SELECT | UPDATE | DELETE | Role Coverage |
|-------|--------|--------|--------|--------|---------------|
| `companies` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | authenticated |
| `contacts` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | authenticated |
| `deals` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | authenticated |
| `sales` | ✅ Auth | ✅ Auth | ✅ Auth | ❌ None | authenticated |
| `contactNotes` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | authenticated |
| `dealNotes` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | authenticated |
| `tasks` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | authenticated |
| `tags` | ✅ Auth | ✅ Auth | ✅ Auth | ✅ Auth | authenticated |

## Detailed Policy Breakdown

### `companies` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create companies
**Blocks**: Anonymous users
**Business Logic**: Open company creation for all team members

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all companies
**Blocks**: Anonymous users
**Business Logic**: Full visibility across team for collaboration

#### UPDATE Policy
```sql
Policy Name: "Enable update for authenticated users only"
Role: authenticated
Operation: UPDATE
Condition: USING (true) WITH CHECK (true)
```
**Allows**: Any authenticated user to modify any company
**Blocks**: Anonymous users
**Business Logic**: Collaborative editing model

#### DELETE Policy
```sql
Policy Name: "Company Delete Policy"
Role: authenticated
Operation: DELETE
Condition: USING (true)
```
**Allows**: Any authenticated user to delete companies
**Blocks**: Anonymous users
**Business Logic**: Shared data management responsibility

---

### `contacts` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create contacts
**Blocks**: Anonymous users

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all contacts
**Blocks**: Anonymous users

#### UPDATE Policy
```sql
Policy Name: "Enable update for authenticated users only"
Role: authenticated
Operation: UPDATE
Condition: USING (true) WITH CHECK (true)
```
**Allows**: Any authenticated user to modify any contact
**Blocks**: Anonymous users

#### DELETE Policy
```sql
Policy Name: "Contact Delete Policy"
Role: authenticated
Operation: DELETE
Condition: USING (true)
```
**Allows**: Any authenticated user to delete contacts
**Blocks**: Anonymous users

---

### `deals` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create deals
**Blocks**: Anonymous users

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all deals
**Blocks**: Anonymous users

#### UPDATE Policy
```sql
Policy Name: "Enable update for authenticated users only"
Role: authenticated
Operation: UPDATE
Condition: USING (true) WITH CHECK (true)
```
**Allows**: Any authenticated user to modify any deal
**Blocks**: Anonymous users

#### DELETE Policy
```sql
Policy Name: "Deals Delete Policy"
Role: authenticated
Operation: DELETE
Condition: USING (true)
```
**Allows**: Any authenticated user to delete deals
**Blocks**: Anonymous users

---

### `sales` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create sales records
**Blocks**: Anonymous users
**Note**: Typically handled by auth triggers, not direct inserts

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all sales team members
**Blocks**: Anonymous users

#### UPDATE Policy
```sql
Policy Name: "Enable update for authenticated users only"
Role: authenticated
Operation: UPDATE
Condition: USING (true) WITH CHECK (true)
```
**Allows**: Any authenticated user to modify sales records
**Blocks**: Anonymous users

#### DELETE Policy
**Status**: No DELETE policy defined
**Effect**: DELETE operations are blocked for all users
**Business Logic**: Sales records tied to auth system, should not be deleted

---

### `contactNotes` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create contact notes
**Blocks**: Anonymous users

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all contact notes
**Blocks**: Anonymous users

#### UPDATE Policy
```sql
Policy Name: "Contact Notes Update policy"
Role: authenticated
Operation: UPDATE
Condition: USING (true)
```
**Allows**: Any authenticated user to modify contact notes
**Blocks**: Anonymous users

#### DELETE Policy
```sql
Policy Name: "Contact Notes Delete Policy"
Role: authenticated
Operation: DELETE
Condition: USING (true)
```
**Allows**: Any authenticated user to delete contact notes
**Blocks**: Anonymous users

---

### `dealNotes` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create deal notes
**Blocks**: Anonymous users

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all deal notes
**Blocks**: Anonymous users

#### UPDATE Policy
```sql
Policy Name: "Deal Notes Update Policy"
Role: authenticated
Operation: UPDATE
Condition: USING (true)
```
**Allows**: Any authenticated user to modify deal notes
**Blocks**: Anonymous users

#### DELETE Policy
```sql
Policy Name: "Deal Notes Delete Policy"
Role: authenticated
Operation: DELETE
Condition: USING (true)
```
**Allows**: Any authenticated user to delete deal notes
**Blocks**: Anonymous users

---

### `tasks` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create tasks
**Blocks**: Anonymous users

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all tasks
**Blocks**: Anonymous users

#### UPDATE Policy
```sql
Policy Name: "Task Update Policy"
Role: authenticated
Operation: UPDATE
Condition: USING (true)
```
**Allows**: Any authenticated user to modify tasks
**Blocks**: Anonymous users

#### DELETE Policy
```sql
Policy Name: "Task Delete Policy"
Role: authenticated
Operation: DELETE
Condition: USING (true)
```
**Allows**: Any authenticated user to delete tasks
**Blocks**: Anonymous users

---

### `tags` Table Policies

#### INSERT Policy
```sql
Policy Name: "Enable insert for authenticated users only"
Role: authenticated
Operation: INSERT
Condition: WITH CHECK (true)
```
**Allows**: Any authenticated user to create tags
**Blocks**: Anonymous users

#### SELECT Policy
```sql
Policy Name: "Enable read access for authenticated users"
Role: authenticated
Operation: SELECT
Condition: USING (true)
```
**Allows**: Any authenticated user to view all tags
**Blocks**: Anonymous users

#### UPDATE Policy
```sql
Policy Name: "Enable update for authenticated users only"
Role: authenticated
Operation: UPDATE
Condition: USING (true)
```
**Allows**: Any authenticated user to modify tags
**Blocks**: Anonymous users

#### DELETE Policy
```sql
Policy Name: "Enable delete for authenticated users only"
Role: authenticated
Operation: DELETE
Condition: USING (true)
```
**Allows**: Any authenticated user to delete tags
**Blocks**: Anonymous users

## Storage Bucket Policies

### `attachments` Bucket

#### SELECT Policy
```sql
Policy Name: "Attachments 1mt4rzk_0"
Operation: SELECT
Role: authenticated
Condition: bucket_id = 'attachments'
```

#### INSERT Policy
```sql
Policy Name: "Attachments 1mt4rzk_1"
Operation: INSERT
Role: authenticated
Condition: bucket_id = 'attachments'
```

#### DELETE Policy
```sql
Policy Name: "Attachments 1mt4rzk_3"
Operation: DELETE
Role: authenticated
Condition: bucket_id = 'attachments'
```

## Security Model Analysis

### Current Approach: Collaborative Team Model
- **Philosophy**: Trust-based team collaboration
- **Access Level**: All authenticated users have equal access
- **Data Segregation**: None (intentional for small teams)
- **Audit Trail**: Tracked via `sales_id` foreign keys

### Example Access Scenarios

#### ✅ Allowed Operations
```sql
-- Sales Rep A can view/edit Sales Rep B's contacts
SELECT * FROM contacts WHERE sales_id = 2; -- Different sales rep

-- Any user can create companies
INSERT INTO companies (name, sector) VALUES ('New Corp', 'Tech');

-- Cross-team task management
UPDATE tasks SET done_date = NOW() WHERE sales_id != current_user_sales_id;
```

#### ❌ Blocked Operations
```sql
-- Anonymous access blocked
SELECT * FROM companies; -- Requires authentication

-- Direct sales record deletion blocked
DELETE FROM sales WHERE id = 1; -- No DELETE policy exists
```

### Role Hierarchy

#### `authenticated` Role
- **Scope**: All application users after login
- **Permissions**: Full CRUD on business data
- **Restrictions**: Cannot access other tenants (handled by app logic)

#### `service_role` Role
- **Scope**: Backend services and migrations
- **Permissions**: Unrestricted database access
- **Usage**: Admin operations, data import/export

#### `anon` Role
- **Scope**: Unauthenticated requests
- **Permissions**: None on business tables
- **Usage**: Login/signup endpoints only

## Future Security Considerations

### Potential Enhancements
1. **Row-level data segregation** by sales territory
2. **Role-based permissions** (admin vs sales rep)
3. **Time-based access restrictions**
4. **Data classification policies**

### Migration Path for Multi-tenancy
```sql
-- Example future policy for sales territory isolation
CREATE POLICY "sales_territory_isolation"
ON companies FOR ALL
TO authenticated
USING (
  sales_id = (
    SELECT id FROM sales
    WHERE user_id = auth.uid()
  )
);
```

## Troubleshooting RLS Issues

### Common Problems
1. **Policy not applying**: Check if RLS is enabled on table
2. **Access denied**: Verify user authentication status
3. **Wrong policy order**: Policies are OR-ed together
4. **View access**: Views inherit table policies

### Debug Queries
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Test current user context
SELECT auth.uid() as user_id, auth.role() as current_role;
```