# E2E Role-Based Access Control (RBAC) Verification Checklist

> Generated: 2026-01-18
> Framework: Manual E2E Testing
> Security Model: Database-level RLS with Frontend UI filtering

This checklist verifies the role-based access control implementation across all three user roles: Admin, Manager, and Rep.

---

## Pre-requisites

### Test User Setup

Roles are configured in the `sales` table via the `role` column. The following test users are available in the seed data:

| User | Email | Role | Sales ID | Notes |
|------|-------|------|----------|-------|
| Admin User | admin@test.com | admin | 1 | Full system access |
| Brent Gustafson | brent@mfbroker.com | admin | 2 | Owner/Admin |
| Michelle Gustafson | michelle@mfbroker.com | manager | 3 | Manager - all data access |
| Gary Thompson | gary@mfbroker.com | rep | 4 | Rep - own data only |
| Dale Anderson | dale@mfbroker.com | rep | 5 | Rep - own data only |
| Sue Martinez | sue@mfbroker.com | rep | 6 | Rep - own data only |

### Role Configuration Location

- **Database Table:** `public.sales`
- **Role Column:** `sales.role` (enum: `'admin'`, `'manager'`, `'rep'`)
- **Helper Functions:** `private.get_current_user_role()`, `private.can_access_by_role()`, `private.is_admin_or_manager()`
- **Migration:** `supabase/migrations/20260118140000_add_role_based_access_helpers.sql`
- **RLS Policies:** `supabase/migrations/20260118193604_update_rls_for_role_based_access.sql`

### Environment Setup

1. Run `just seed-e2e` to populate test data with proper ownership
2. Ensure Supabase local instance is running (`supabase start`)
3. Clear browser cache/cookies between role switches for clean sessions

---

## Test Cases by Role

### Admin User Tests

Login as: `admin@test.com` or `brent@mfbroker.com`

#### Organizations

- [ ] Can see all organizations (including those created by other users)
- [ ] Can edit any organization regardless of `sales_id` owner
- [ ] Can create new organizations
- [ ] Soft-deleted organizations are not visible in list

#### Contacts

- [ ] Can see all contacts (including those owned by other reps)
- [ ] Can edit any contact
- [ ] Can create new contacts

#### Opportunities

- [ ] Can see all opportunities (regardless of `opportunity_owner_id` or `account_manager_id`)
- [ ] Can edit any opportunity
- [ ] Can change ownership fields (`opportunity_owner_id`, `account_manager_id`)

#### Activities

- [ ] Can see all activities (regardless of `created_by`)
- [ ] Can create activities for any record

#### Notes

- [ ] Can see all contact notes, organization notes, and opportunity notes

#### UI Access

- [ ] Can see the Sales menu item in navigation
- [ ] Can access team management page (`/sales`)
- [ ] Can view and edit any sales team member profile

---

### Manager User Tests

Login as: `michelle@mfbroker.com`

#### Organizations

- [ ] Can see all organizations (same visibility as admin)
- [ ] Can edit any organization
- [ ] Can create new organizations

#### Contacts

- [ ] Can see all contacts
- [ ] Can edit any contact

#### Opportunities

- [ ] Can see all opportunities
- [ ] Can edit opportunities owned by any user
- [ ] Can reassign ownership to other reps

#### Activities

- [ ] Can see all activities
- [ ] Can create activities for any record

#### Notes

- [ ] Can see all notes across all entities

#### UI Access

- [ ] Cannot see the Sales menu item (or sees it disabled/hidden)
- [ ] Cannot access team management page directly (redirect or 403)
- [ ] Has full data visibility but no admin UI access

---

### Rep User Tests

Login as: `gary@mfbroker.com` (Sales ID: 4)

#### Organizations - Ownership Filtering

- [ ] Can only see organizations where:
  - `sales_id = 4` (owned by Gary), OR
  - `created_by = 4` (created by Gary)
- [ ] Cannot see organizations owned by Dale (Sales ID: 5) or Sue (Sales ID: 6)
- [ ] Can create new organizations (will be assigned to self)
- [ ] Can edit organizations they own
- [ ] Cannot edit organizations owned by other reps (verify RLS error)

#### Contacts - Ownership Filtering

- [ ] Can only see contacts where `sales_id = 4` OR `created_by = 4`
- [ ] Cannot see contacts owned by other reps
- [ ] Can edit their own contacts
- [ ] Cannot edit contacts owned by other reps

#### Opportunities - Dual Ownership

- [ ] Can see opportunities where `opportunity_owner_id = 4` (owner)
- [ ] Can see opportunities where `account_manager_id = 4` (account manager)
- [ ] Can edit opportunities they own (either ownership field)
- [ ] Cannot see opportunities where neither field matches their ID
- [ ] Cannot edit opportunities owned entirely by other reps

#### Activities - Created By Filtering

- [ ] Can only see activities where `created_by = 4`
- [ ] Cannot see activities created by other reps
- [ ] Can create new activities (will be assigned `created_by = 4`)

#### Notes - Ownership Filtering

- [ ] Can only see notes where `sales_id = 4` OR `created_by = 4`
- [ ] Cannot see notes created by other reps

#### UI Access

- [ ] Cannot see the Sales menu item
- [ ] Cannot access team management page
- [ ] Does not see "Assign to" dropdown with other reps in forms (if applicable)

---

## Cross-Cutting Tests

### Soft Delete Filtering

- [ ] Soft-deleted records (`deleted_at IS NOT NULL`) are not visible to any role
- [ ] Admin cannot see soft-deleted organizations
- [ ] Manager cannot see soft-deleted contacts
- [ ] Rep cannot see soft-deleted opportunities they own

### NULL Safety

- [ ] Activities without `sales_id` column are visible based on `created_by` only
- [ ] Records with `created_by = NULL` are only visible to Admin/Manager
- [ ] Records with `sales_id = NULL` fall back to `created_by` check for reps

### Dual Ownership on Opportunities

- [ ] Opportunity visible when user is `opportunity_owner_id` only
- [ ] Opportunity visible when user is `account_manager_id` only
- [ ] Opportunity visible when user is both owner and account manager
- [ ] Opportunity NOT visible when neither field matches (for rep)

### RLS Error Handling

- [ ] Attempting to edit unauthorized record shows appropriate error message
- [ ] Error message does not expose sensitive information
- [ ] User is not logged out on permission error

---

## How to Test

### Step-by-Step Testing Process

1. **Clear Session**
   - Open browser dev tools > Application > Clear site data
   - Or use incognito/private window for each role

2. **Login**
   - Navigate to application login
   - Enter test user credentials
   - Verify successful authentication

3. **Navigate to Resource List**
   - Go to Organizations, Contacts, Opportunities, etc.
   - Count visible records
   - Note any unexpected records (potential RLS leak)

4. **Verify Ownership Match**
   - Click into a record
   - Check `sales_id` or `owner_id` field value
   - Verify it matches expected ownership rules for current role

5. **Attempt Edit Operations**
   - Click Edit on owned record - should succeed
   - Click Edit on unowned record (for rep) - should fail or be hidden

6. **Check RLS Errors**
   - If attempting unauthorized action, verify error message appears
   - Error should be user-friendly (e.g., "You do not have permission")
   - Check browser console for actual RLS error (for debugging)

### Expected Record Counts (Example)

After running `just seed-e2e`, verify approximate counts:

| Resource | Admin Sees | Manager Sees | Gary (Rep) Sees |
|----------|------------|--------------|-----------------|
| Organizations | All (N) | All (N) | Subset (own only) |
| Contacts | All (N) | All (N) | Subset (own only) |
| Opportunities | All (N) | All (N) | Subset (owner OR account_manager) |
| Activities | All (N) | All (N) | Subset (created_by only) |

### Debugging RLS Issues

If tests fail, use these SQL queries to verify policy behavior:

```sql
-- Check current user's role
SELECT private.get_current_user_role();

-- Check if user is admin/manager
SELECT private.is_admin_or_manager();

-- Check specific record access (replace values)
SELECT private.can_access_by_role(
  record_sales_id := 4,
  record_created_by := 4
);

-- List all organizations visible to current user
SELECT id, name, sales_id, created_by
FROM organizations
WHERE deleted_at IS NULL;

-- Check policy definitions
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'organizations';
```

---

## Test Results Log

| Date | Tester | Role Tested | Pass/Fail | Notes |
|------|--------|-------------|-----------|-------|
| | | admin | | |
| | | manager | | |
| | | rep | | |

---

## Related Documentation

- [Test Authoring Guide](../tests/e2e/test-authoring-guide.md) - General test patterns
- [Test Architecture](../tests/e2e/test-architecture.md) - Testing philosophy
- Helper Functions Migration: `supabase/migrations/20260118140000_add_role_based_access_helpers.sql`
- RLS Policies Migration: `supabase/migrations/20260118193604_update_rls_for_role_based_access.sql`
- pgTAP Tests: `supabase/tests/database/070-role-based-rls.test.sql`
