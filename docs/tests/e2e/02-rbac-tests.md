# E2E Manual Testing Guide: RBAC (Role-Based Access Control)

Manual test scenarios extracted from automated Playwright RBAC tests. Execute these tests to verify role-based permissions, user management, and access restrictions.

## Test Environment Setup

Before testing, ensure you have test accounts for each role:
- Admin: admin@test.com
- Manager: manager@test.com
- Rep: rep@test.com

## A. Admin Operations

Admin-only capabilities: create users, change roles, soft-delete, disable accounts.

### A1: Admin can access /sales team management
- **Prerequisites:** Login as Admin (admin@test.com)
- **Steps:**
  1. Navigate to the sales/team management page (/#/sales)
  2. Verify the user grid/list is visible
  3. Check browser console for RLS errors
- **Expected Results:**
  - User list displays successfully
  - No RLS (Row Level Security) errors in console
  - No React errors in console
- **Pass/Fail:** [ ]

### A2: Admin can create new user with manager role
- **Prerequisites:** Login as Admin
- **Steps:**
  1. Navigate to /#/sales
  2. Click the "Create" button
  3. Fill in the form:
     - First Name: NewManager-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: new-manager-[timestamp]@example.com
     - Role: Select "manager"
  4. Submit the form
  5. Wait for redirect back to list
  6. Verify the new user appears in the list (search by email)
- **Expected Results:**
  - Form submits successfully
  - Redirects to /#/sales
  - New user visible in list with correct email
  - No RLS or React errors in console
- **Pass/Fail:** [ ]

### A3: Admin can change user role from manager to rep
- **Prerequisites:** Login as Admin, have a manager user available
- **Steps:**
  1. Navigate to /#/sales
  2. Click "Create" and create a test manager user:
     - First Name: ChangeRole-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: change-role-[timestamp]@example.com
     - Role: manager
  3. Submit and wait for redirect
  4. Click on the newly created user to open slide-over
  5. Go to Permissions tab
  6. Change role dropdown to "rep"
  7. Save the changes
  8. Close slide-over (press Escape or click X)
  9. Refresh the list
  10. Verify the user's role badge now shows "rep"
- **Expected Results:**
  - Role change saves successfully
  - User now shows as "rep" role in list
  - No RLS errors in console
- **Pass/Fail:** [ ]

### A4: Admin can edit own profile (first_name)
- **Prerequisites:** Login as Admin
- **Steps:**
  1. Navigate to /#/sales
  2. Find and click on admin@test.com in the user list
  3. In the slide-over, update First Name to: AdminUpdated-[timestamp]
  4. Save the changes
- **Expected Results:**
  - First name updates successfully
  - No RLS or React errors in console
- **Pass/Fail:** [ ]

### A5: Admin can soft-delete user
- **Prerequisites:** Login as Admin
- **Steps:**
  1. Navigate to /#/sales
  2. Create a test user to delete:
     - First Name: DeleteMe-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: delete-me-[timestamp]@example.com
     - Role: rep
  3. Submit and wait for redirect
  4. Click on the newly created user to open slide-over
  5. Click the "Delete" button
  6. Confirm deletion in the dialog
  7. Wait for redirect/refresh
  8. Navigate back to /#/sales
  9. Search for the deleted user by first name
- **Expected Results:**
  - Delete dialog appears
  - After confirmation, user is removed from list
  - User no longer visible in list
  - No RLS errors in console
- **Pass/Fail:** [ ]

### A6: Admin can disable user account
- **Prerequisites:** Login as Admin
- **Steps:**
  1. Navigate to /#/sales
  2. Create a test user to disable:
     - First Name: DisableMe-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: disable-me-[timestamp]@example.com
     - Role: rep
  3. Submit and wait for redirect
  4. Click on the newly created user to open slide-over
  5. Go to Permissions tab
  6. Toggle "Disabled" to true/checked
  7. Save the changes
- **Expected Results:**
  - User account is disabled successfully
  - No RLS errors in console
- **Pass/Fail:** [ ]

---

## B. Manager Restrictions

Managers are blocked from /sales team management (admin-only resource).

### B1: Manager CANNOT access /sales team management
- **Prerequisites:** Login as Manager (manager@test.com)
- **Steps:**
  1. Navigate directly to /#/sales
  2. Wait for page to load (2 seconds)
  3. Observe the result
- **Expected Results:**
  - One of the following should occur:
    - Redirected away from /sales (e.g., to dashboard)
    - See "Access Denied" or "Not Authorized" message
    - See empty grid with "No Results" or "No Users"
  - Manager should NOT see team data
- **Pass/Fail:** [ ]

### B2: Manager cannot navigate to /sales/create
- **Prerequisites:** Login as Manager
- **Steps:**
  1. Navigate directly to /#/sales/create
  2. Wait for page to load (2 seconds)
  3. Observe the result
- **Expected Results:**
  - Redirected away from create page, OR
  - See "Access Denied" or "Not Authorized" message
  - Cannot create new users
- **Pass/Fail:** [ ]

### B3: Manager sidebar should not show Team/Sales link
- **Prerequisites:** Login as Manager
- **Steps:**
  1. Navigate to dashboard (/#/)
  2. Wait for page to fully load
  3. Check the sidebar/navigation menu
  4. Look for links labeled "Team", "Sales", or "Users"
- **Expected Results:**
  - No Team/Sales/Users link visible in navigation
  - Link is hidden for manager role
- **Pass/Fail:** [ ]

### B4: Manager can edit own profile
- **Prerequisites:** Login as Manager
- **Steps:**
  1. Navigate to dashboard
  2. Look for user menu dropdown (usually in header, labeled with username or "Account")
  3. Click user menu
  4. Look for "Profile" or "Settings" or "My Account" option
  5. Click profile/settings option
  6. Update First Name to: ManagerUpdated-[timestamp]
  7. Save changes
- **Expected Results:**
  - Profile form loads successfully
  - First name updates successfully
  - No RLS errors in console
- **Note:** If no user menu/profile link exists, this test is inconclusive
- **Pass/Fail:** [ ]

---

## C. Rep Restrictions

Reps can edit own profile only, cannot edit others or change roles.

### C1: Rep can edit own profile fields
- **Prerequisites:** Login as Rep (rep@test.com)
- **Steps:**
  1. Look for user menu dropdown in header
  2. Click user menu
  3. Click "Profile" or "Settings" option
  4. Update Phone to: 555-[last 4 digits of timestamp]
  5. Save changes
- **Expected Results:**
  - Profile form loads successfully
  - Phone number updates successfully
  - No RLS or React errors in console
- **Note:** If no user menu exists, test may need alternative approach
- **Pass/Fail:** [ ]

### C2: Rep cannot edit another user profile
- **Prerequisites:** Login as Rep
- **Steps:**
  1. Navigate directly to /#/sales
  2. Wait for page response (2 seconds)
  3. If on /sales page, look for admin@test.com in the list
  4. If admin user is visible, click on it
  5. Try to edit First Name to: HackerAttempt
  6. Attempt to save
- **Expected Results:**
  - One of the following should occur:
    - Rep is redirected away from /sales
    - Admin user is not visible in list (RLS filtering works)
    - Edit attempt produces error message
    - RLS error appears in console
  - Rep cannot modify other users
- **Pass/Fail:** [ ]

### C3: Rep cannot change own role
- **Prerequisites:** Login as Rep
- **Steps:**
  1. Access own profile via user menu > Profile/Settings
  2. Click on "Permissions" tab
  3. Look for role dropdown/selector
  4. Observe if role selector is visible and enabled
  5. If visible and enabled, try to select "admin" role
  6. Submit the change
- **Expected Results:**
  - One of the following should occur:
    - Role selector is not visible at all
    - Role selector is disabled/readonly
    - If editable, save produces error message or RLS error
  - Rep cannot change their own role
- **Pass/Fail:** [ ]

### C4: Rep cannot access /sales admin section
- **Prerequisites:** Login as Rep
- **Steps:**
  1. Navigate directly to /#/sales
  2. Wait for page to load (2 seconds)
  3. Observe the result
- **Expected Results:**
  - One of the following should occur:
    - Redirected away from /sales
    - See "Access Denied" or "Not Authorized" message
    - See empty view with "No Results" or "No Users"
  - Rep should not see team data
- **Pass/Fail:** [ ]

### C5: Rep sidebar should not show Team/Sales link
- **Prerequisites:** Login as Rep
- **Steps:**
  1. Navigate to dashboard (/#/)
  2. Wait for page to fully load
  3. Check the sidebar/navigation menu
  4. Look for links labeled "Team", "Sales", or "Users"
- **Expected Results:**
  - No Team/Sales/Users link visible in navigation
  - Link is hidden for rep role
- **Pass/Fail:** [ ]

---

## D. Edge Cases

Testing disabled users, soft-deleted users, admin self-demotion, and role change effects.

### D1: Disabled user cannot log in
- **Prerequisites:** Login as Admin first, then test disabled user login
- **Steps:**
  1. As Admin, navigate to /#/sales
  2. Create a test user:
     - First Name: Disabled-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: disabled-[timestamp]@example.com
     - Role: rep
  3. After creation, click on the user to open slide-over
  4. Go to Permissions tab
  5. Toggle "Disabled" to true/checked
  6. Save changes
  7. Log out (clear localStorage or use logout function)
  8. Navigate to /#/login
  9. Attempt to login as disabled user (requires password setup via Supabase)
- **Expected Results:**
  - Login fails with "Account disabled" or "Cannot log in" message
- **Note:** This test requires the user to have Supabase auth credentials set up
- **Pass/Fail:** [ ]

### D2: Soft-deleted user cannot log in
- **Prerequisites:** Login as Admin first, then test deleted user login
- **Steps:**
  1. As Admin, navigate to /#/sales
  2. Create a test user:
     - First Name: Deleted-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: deleted-[timestamp]@example.com
     - Role: rep
  3. After creation, click on the user to open slide-over
  4. Click "Delete" button
  5. Confirm deletion
  6. Log out
  7. Navigate to /#/login
  8. Attempt to login as deleted user (requires password setup via Supabase)
- **Expected Results:**
  - Login fails with "User not found" or "Cannot log in" message
- **Note:** This test requires the user to have Supabase auth credentials set up
- **Pass/Fail:** [ ]

### D3: Admin demoting self to rep shows warning dialog
- **Prerequisites:** Login as Admin (admin@test.com)
- **Steps:**
  1. Navigate to /#/sales
  2. Click on admin@test.com in the user list
  3. Go to Permissions tab
  4. Click the role dropdown
  5. Select "rep" option
  6. Click Save/Submit
  7. Wait for dialog to appear (500ms)
  8. Observe if confirmation dialog appears
  9. Click Cancel (do NOT confirm the demotion)
- **Expected Results:**
  - Confirmation/warning dialog appears
  - Dialog warns about self-demotion consequences
  - After canceling, admin remains as admin role
- **Pass/Fail:** [ ]

### D4: Admin self-demotion after confirmation changes role
- **Prerequisites:** Login as Admin
- **Steps:**
  1. Navigate to /#/sales
  2. Create a NEW admin user (don't use primary admin):
     - First Name: DemoteAdmin-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: demote-admin-[timestamp]@example.com
     - Role: admin
  3. After creation, click on the new admin user
  4. Go to Permissions tab
  5. Click role dropdown and select "rep"
  6. Submit the change
  7. Wait for confirmation dialog
  8. Click "Confirm" to accept the demotion
  9. Wait for change to process (1 second)
  10. Close slide-over
  11. Refresh the list
  12. Find the user and verify role badge shows "rep"
- **Expected Results:**
  - Confirmation dialog appears
  - After confirming, role changes from admin to rep
  - User now displays as "rep" in the list
  - No RLS errors in console
- **Pass/Fail:** [ ]

### D5: Role change takes effect immediately (no stale cache)
- **Prerequisites:** Login as Admin
- **Steps:**
  1. Navigate to /#/sales
  2. Create a test user:
     - First Name: CacheTest-[timestamp]
     - Last Name: Test-[timestamp]
     - Email: cache-test-[timestamp]@example.com
     - Role: rep
  3. After creation, click on the user to open slide-over
  4. Go to Permissions tab
  5. Change role from "rep" to "manager"
  6. Save changes
  7. Close slide-over (press Escape)
  8. Refresh the page (/#/sales)
  9. Click on the same user again to re-open slide-over
  10. Go to Permissions tab
  11. Verify the role dropdown shows "manager" (not cached "rep")
- **Expected Results:**
  - Role change saves successfully
  - After refresh and re-opening, role displays as "manager"
  - No stale data from cache
  - No RLS errors in console
- **Pass/Fail:** [ ]

---

## Test Execution Notes

1. Use unique timestamps for each test run to avoid data conflicts
2. Check browser console for RLS errors after each test
3. Some tests (D1, D2) require Supabase auth setup for full validation
4. Tests marked "inconclusive" should be noted but not failed
5. Clear browser cache between major test sections if needed
6. Document any unexpected behavior or UI differences

## Common Issues to Watch For

- RLS errors in console (indicates permission bypass attempt)
- React errors (indicates UI breaking due to access restrictions)
- Missing confirmation dialogs
- Stale cached data after role changes
- Navigation links visible when they should be hidden
- Access to restricted pages without proper redirects
