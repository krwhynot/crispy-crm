# Team Member Management - Manual E2E Testing Checklist

Manual E2E testing checklist for Team Member (Sales User) Management. This is **TEST 2** of the progressive 6-test RBAC suite.

## Prerequisites

**CRITICAL:** Test 1 (06-auth-foundation.md) MUST pass before running these tests. Authentication and role-based access control foundations are required for all tests in this file.

### Test Environment Setup

- **Browser:** Chrome, Firefox, or Safari
- **URL:** http://localhost:5173
- **Database:** Seeded with test data via `just seed-e2e`
- **Console Monitoring:** DevTools open to Console tab throughout all tests

### Test Users

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@test.com | password123 | Full access, user management, delete users |
| Manager | manager@mfbroker.com | password123 | Edit all user profiles (not roles) |
| Rep | rep@mfbroker.com | password123 | Edit own profile only |

### Test Data Conventions

- Use timestamps in test data for uniqueness: `TestUser-[YYYYMMDD-HHmmss]@example.com`
- Example: `TestUser-20251226-143022@example.com`
- Record IDs and names created during testing for cleanup reference

---

## Section A: Team Member List View (6 Tests)

Tests the Sales/Team list page functionality accessible at `/#/sales`.

### A1: Admin Sees All Team Members in List

**Objective:** Verify admin user can view the complete team member list.

**Prerequisites:**
- Logged in as admin@test.com
- Database seeded with at least 3 users (Admin, Manager, Rep)

**Steps:**

1. Log in as admin@test.com with password123
2. Wait for dashboard to load (verify no console errors)
3. Navigate to `/#/sales` via sidebar or direct URL
4. Wait for "Team" or "Sales" page header to be visible (timeout: 10s)
5. Observe the list loading state (skeleton or spinner)
6. Wait for list data to load completely
7. Count the number of visible rows in the datagrid
8. Verify at least 3 users are displayed (Admin, Manager, Rep from seed data)
9. Scroll through the list if pagination exists
10. Check browser console for any errors during page load
11. Verify URL is `/#/sales` (no query params initially)
12. Check that the search bar is visible with placeholder "Search team members..."

**Expected Results:**

- [ ] Page loads without console errors (red text)
- [ ] No RLS (Row Level Security) errors in console
- [ ] List displays all team members (minimum 3)
- [ ] Each row shows user data (name, email visible)
- [ ] No empty state shown when users exist
- [ ] Page title reflects team/sales context
- [ ] Search bar is present and functional

---

### A2: List Displays Correct Columns

**Objective:** Verify the datagrid displays all required columns with proper formatting.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales` with users visible

**Steps:**

1. Navigate to `/#/sales` if not already there
2. Wait for list to load completely
3. Inspect the datagrid header row
4. Identify "First Name" column header - verify it exists
5. Identify "Last Name" column header - verify it exists
6. Identify "Email" column header - verify it exists (may be hidden on mobile)
7. Identify "Role" column header - verify it exists
8. Identify "Status" column header - verify it exists (may be hidden on mobile)
9. Inspect a data row and verify:
   - First Name shows text (not empty or "undefined")
   - Last Name shows text (not empty or "undefined")
   - Email shows valid email format
   - Role shows colored badge (Admin/Manager/Rep)
   - Status shows badge (Active/Disabled)
10. Check Role badge colors:
    - Admin: primary/blue border and text
    - Manager: success/green border and text
    - Rep: muted border and text
11. Check Status badge colors:
    - Active: success/green border and text
    - Disabled: warning/amber border and text
12. Right-click a row and inspect element to verify semantic HTML

**Expected Results:**

- [ ] "First Name" column is visible and populated
- [ ] "Last Name" column is visible and populated
- [ ] "Email" column is visible on desktop (hidden on tablet/mobile)
- [ ] "Role" column displays colored Badge component
- [ ] "Status" column displays colored Badge component
- [ ] Role badges use semantic color classes (not hardcoded hex)
- [ ] Status badges use semantic color classes
- [ ] Column headers are sortable (cursor indicates clickable)

---

### A3: Sort Team List by Name Column

**Objective:** Verify the list can be sorted by first name and last name columns.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales` with multiple users visible

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load with at least 3 users
3. Note the current order of first names in the list
4. Click the "First Name" column header
5. Wait for list to re-render (may show loading state)
6. Verify sort direction indicator appears (arrow up or down)
7. Note the new order - should be alphabetically ascending
8. Click "First Name" header again to toggle sort direction
9. Wait for list to re-render
10. Verify sort indicator changes direction
11. Verify order is now alphabetically descending
12. Repeat steps 4-11 for "Last Name" column
13. Click "Email" column header (if visible on desktop)
14. Verify email column sorts correctly
15. Check URL for sort parameters (e.g., `?sort=first_name&order=ASC`)
16. Check console for any errors during sort operations

**Expected Results:**

- [ ] First Name column is sortable (clicking header changes order)
- [ ] Sort direction indicator is visible (arrow icon)
- [ ] Ascending sort shows A-Z order
- [ ] Descending sort shows Z-A order
- [ ] Last Name column is sortable
- [ ] Email column is sortable (on desktop)
- [ ] Sort parameters reflected in URL
- [ ] No console errors during sort operations
- [ ] List maintains sort after navigation away and back

---

### A4: Filter Team List by Role Dropdown

**Objective:** Verify the sidebar filter allows filtering by user role.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales` with multiple users of different roles

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load completely
3. Locate the sidebar filter panel on the left side
4. Find the "Role" filter section/dropdown
5. Note the current count of visible users
6. Click the Role filter dropdown/checkbox group
7. Select only "Admin" role
8. Wait for list to filter (may show loading state)
9. Verify only users with Admin role badge are visible
10. Count the filtered results
11. Clear Admin filter, select "Manager" role
12. Verify only users with Manager role badge are visible
13. Clear Manager filter, select "Rep" role
14. Verify only users with Rep role badge are visible
15. Select multiple roles (Admin + Manager)
16. Verify users with either role are visible
17. Clear all role filters
18. Verify full list is restored
19. Check URL for filter parameters (e.g., `?filter={"role":"admin"}`)

**Expected Results:**

- [ ] Role filter is visible in sidebar
- [ ] Selecting "Admin" shows only admin users
- [ ] Selecting "Manager" shows only manager users
- [ ] Selecting "Rep" shows only rep users
- [ ] Multi-select shows users matching any selected role
- [ ] Clearing filters restores full list
- [ ] Filter state reflected in URL
- [ ] No console errors during filtering
- [ ] Filter persists after page refresh (via URL)

---

### A5: Toggle "Show Disabled" Filter

**Objective:** Verify the filter to show/hide disabled user accounts.

**Prerequisites:**
- Logged in as admin@test.com
- Database has at least one disabled user account (or create via test B11/D1)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load completely
3. Verify the default filter shows only active users (disabled=false)
4. Locate the "Status" filter or "Show disabled" toggle in sidebar
5. Note the current count of visible users
6. Enable "Show disabled" filter or select "Disabled" status
7. Wait for list to update
8. Verify disabled users appear (if any exist) with "Disabled" badge
9. Count the new total of visible users (should include disabled)
10. Disable the filter (back to active only)
11. Verify disabled users are hidden again
12. Toggle to show ALL users (active + disabled)
13. Verify both badge types appear in list
14. Check filter state in URL
15. Reload page and verify filter state persists
16. Check console for errors during filter operations

**Expected Results:**

- [ ] Default filter shows only Active users (industry standard)
- [ ] Status filter is visible in sidebar
- [ ] Can toggle to show Disabled users
- [ ] Disabled users display "Disabled" badge when visible
- [ ] Can show All users (Active + Disabled)
- [ ] Filter state persists in URL
- [ ] Filter state survives page refresh
- [ ] No console errors during status filtering

**Notes:**

If no disabled users exist in seed data, run test D1 first to create one, then return to this test.

---

### A6: Search Team Members by Name or Email

**Objective:** Verify the search bar filters team members by text matching.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales` with multiple users visible

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load completely
3. Note the total count of visible users
4. Locate the search bar with placeholder "Search team members..."
5. Click into the search input field
6. Type the first name of a known user (e.g., "Admin")
7. Wait 300ms for debounce (search should trigger after typing stops)
8. Verify list filters to show only matching users
9. Clear the search input
10. Verify full list is restored
11. Type a last name of a known user
12. Verify list filters correctly
13. Clear the search input
14. Type a partial email address (e.g., "mfbroker")
15. Verify list filters to show users with matching email domain
16. Type a string that matches no users (e.g., "xyz123nonexistent")
17. Verify empty state or "No results" message appears
18. Clear search input
19. Verify list is restored to full view
20. Check URL for search query parameter (e.g., `?q=admin`)

**Expected Results:**

- [ ] Search bar is visible with placeholder text
- [ ] Typing triggers search after debounce delay (300ms)
- [ ] Search matches against first name
- [ ] Search matches against last name
- [ ] Search matches against email address
- [ ] No matches shows appropriate empty state
- [ ] Clearing search restores full list
- [ ] Search is case-insensitive
- [ ] Search state reflected in URL
- [ ] No console errors during search operations

---

## Section B: Create Team Member - Admin Only (11 Tests)

Tests the team member creation functionality restricted to Admin role only.

### B1: Admin Can Access Create Form via Button

**Objective:** Verify admin user can access the create team member form.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales` list page

**Steps:**

1. Log in as admin@test.com with password123
2. Navigate to `/#/sales`
3. Wait for list to load completely
4. Locate the "Create" or "+" button (FloatingCreateButton or toolbar button)
5. Note the button's position (likely bottom-right corner as FAB)
6. Click the Create button
7. Wait for navigation to `/#/sales/create`
8. Verify the create form page loads
9. Check for page title "Create a new user" or similar
10. Verify the form card is visible with CardHeader and CardContent
11. Check that form inputs are present:
    - First Name input
    - Last Name input
    - Email input
    - Role dropdown
12. Verify "Save" or "Create" button is present
13. Check browser console for any errors during navigation
14. Verify URL is exactly `/#/sales/create`

**Expected Results:**

- [ ] Create button is visible to admin user
- [ ] Clicking button navigates to `/#/sales/create`
- [ ] Create form page loads without errors
- [ ] Page title indicates "Create a new user"
- [ ] Form inputs are visible and enabled
- [ ] Role dropdown is present with options
- [ ] Submit button is present
- [ ] No console errors during page load
- [ ] No RLS errors in console

---

### B2: Manager Cannot Access /sales/create (Blocked/Redirected)

**Objective:** Verify manager users are blocked from the create form.

**Prerequisites:**
- Logged out from any previous session
- Test user manager@mfbroker.com exists

**Steps:**

1. Navigate to login page (http://localhost:5173 or `/#/login`)
2. Log in as manager@mfbroker.com with password123
3. Wait for dashboard to load successfully
4. Verify login was successful (dashboard content visible)
5. Navigate directly to `/#/sales/create` via URL bar
6. Wait for page response (timeout: 10s)
7. Observe what happens:
   - Option A: Redirect to another page (e.g., `/#/sales`)
   - Option B: Permission denied message/toast
   - Option C: 403 error page
8. Check browser URL - should NOT remain at `/#/sales/create`
9. Check for notification/toast message about permissions
10. Verify form inputs are NOT visible/accessible
11. Check console for any RBAC-related logs
12. Try navigating via sidebar to `/#/sales` then clicking Create button
13. Verify Create button is hidden or disabled for manager

**Expected Results:**

- [ ] Direct URL access to `/#/sales/create` is blocked
- [ ] User is redirected away from create page
- [ ] Warning notification appears: "You don't have permission to create team members"
- [ ] Create form is never rendered for manager
- [ ] Create button is hidden on list page for manager
- [ ] No console errors (warning log is acceptable)
- [ ] No unauthorized data exposure

---

### B3: Rep Cannot Access /sales/create (Blocked/Redirected)

**Objective:** Verify rep users are blocked from the create form.

**Prerequisites:**
- Logged out from any previous session
- Test user rep@mfbroker.com exists

**Steps:**

1. Navigate to login page
2. Log in as rep@mfbroker.com with password123
3. Wait for dashboard to load successfully
4. Verify login was successful
5. Navigate directly to `/#/sales/create` via URL bar
6. Wait for page response (timeout: 10s)
7. Observe what happens:
   - Option A: Redirect to another page
   - Option B: Permission denied message
   - Option C: 403 error page
8. Check browser URL - should NOT remain at `/#/sales/create`
9. Check for notification/toast message about permissions
10. Verify form inputs are NOT visible/accessible
11. Check console for any RBAC-related logs
12. Try navigating via sidebar to `/#/sales` list page
13. Verify Create button is hidden or disabled for rep
14. Check if rep can even access `/#/sales` list (may be blocked entirely)

**Expected Results:**

- [ ] Direct URL access to `/#/sales/create` is blocked
- [ ] User is redirected away from create page
- [ ] Warning notification appears about permissions
- [ ] Create form is never rendered for rep
- [ ] Create button is hidden on list page for rep
- [ ] Rep may not have access to sales list at all
- [ ] No console errors (warning log is acceptable)
- [ ] No unauthorized data exposure

---

### B4: Required Field Validation - first_name Empty

**Objective:** Verify first_name field validation prevents empty submission.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Locate the "First Name" input field
4. Leave the First Name field EMPTY
5. Fill in Last Name: "TestUser"
6. Fill in Email: "testuser-[timestamp]@example.com"
7. Select Role: "Rep" from dropdown
8. Click the "Save" or submit button
9. Wait for validation response
10. Check if form submits or shows error
11. Inspect First Name field for error styling:
    - Red border (border-destructive)
    - aria-invalid="true" attribute
12. Look for error message text near the field
13. Check FormErrorSummary at top of form (if implemented)
14. Verify form stays on create page (not redirected)
15. Verify no API request was made (check Network tab)
16. Fill in First Name with valid value
17. Verify error state clears

**Expected Results:**

- [ ] Form does NOT submit with empty first_name
- [ ] First Name field shows error styling (red border)
- [ ] Error message indicates field is required
- [ ] aria-invalid="true" on the input element
- [ ] Form remains on `/#/sales/create`
- [ ] No POST request made to API
- [ ] Error clears when valid value entered
- [ ] FormErrorSummary shows validation errors (if present)

---

### B5: Required Field Validation - last_name Empty

**Objective:** Verify last_name field validation prevents empty submission.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Fill in First Name: "Test"
4. Leave the Last Name field EMPTY
5. Fill in Email: "testuser-[timestamp]@example.com"
6. Select Role: "Rep" from dropdown
7. Click the "Save" or submit button
8. Wait for validation response
9. Check if form submits or shows error
10. Inspect Last Name field for error styling:
    - Red border (border-destructive)
    - aria-invalid="true" attribute
11. Look for error message text near the field
12. Verify form stays on create page
13. Verify no API request was made
14. Fill in Last Name with valid value
15. Verify error state clears

**Expected Results:**

- [ ] Form does NOT submit with empty last_name
- [ ] Last Name field shows error styling
- [ ] Error message indicates field is required
- [ ] aria-invalid="true" on the input element
- [ ] Form remains on `/#/sales/create`
- [ ] No POST request made to API
- [ ] Error clears when valid value entered

---

### B6: Required Field Validation - email Empty

**Objective:** Verify email field validation prevents empty submission.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Fill in First Name: "Test"
4. Fill in Last Name: "User"
5. Leave the Email field EMPTY
6. Select Role: "Rep" from dropdown
7. Click the "Save" or submit button
8. Wait for validation response
9. Check if form submits or shows error
10. Inspect Email field for error styling
11. Look for error message text near the field
12. Verify form stays on create page
13. Verify no API request was made
14. Fill in Email with valid value
15. Verify error state clears

**Expected Results:**

- [ ] Form does NOT submit with empty email
- [ ] Email field shows error styling
- [ ] Error message indicates field is required
- [ ] Form remains on `/#/sales/create`
- [ ] No POST request made to API
- [ ] Error clears when valid value entered

---

### B7: Email Format Validation - Invalid Email

**Objective:** Verify email format validation rejects invalid email addresses.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Fill in First Name: "Test"
4. Fill in Last Name: "User"
5. Fill in Email with INVALID format: "not-an-email"
6. Select Role: "Rep" from dropdown
7. Click the "Save" or submit button
8. Wait for validation response
9. Check if form submits or shows error
10. Inspect Email field for error styling
11. Look for error message about invalid email format
12. Clear email field and try: "missing@domain" (no TLD)
13. Submit again and verify rejection
14. Clear email field and try: "@nodomain.com" (no local part)
15. Submit again and verify rejection
16. Fill in valid email: "valid@example.com"
17. Verify error state clears

**Expected Results:**

- [ ] Form rejects "not-an-email" format
- [ ] Form rejects "missing@domain" (depending on validation strictness)
- [ ] Form rejects "@nodomain.com"
- [ ] Error message indicates invalid email format
- [ ] Email field shows error styling
- [ ] Valid email clears error state
- [ ] No API request made for invalid emails

---

### B8: Create User with Admin Role

**Objective:** Verify successful creation of a user with Admin role.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form
- Generate unique timestamp for test data

**Test Data:**
- First Name: `AdminTest`
- Last Name: `User-[timestamp]`
- Email: `admintest-[timestamp]@example.com`
- Role: Admin

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Fill in First Name: "AdminTest"
4. Fill in Last Name: "User-[timestamp]" (e.g., "User-20251226143022")
5. Fill in Email: "admintest-[timestamp]@example.com"
6. Click Role dropdown and select "Admin"
7. Verify all required fields are filled
8. Open Network tab in DevTools
9. Click the "Save" or submit button
10. Wait for API response (observe Network tab)
11. Verify POST/PATCH request returns 200/201 success
12. Wait for success notification to appear
13. Verify notification text: "User created. They will soon receive an email..."
14. Verify redirect to `/#/sales` list page
15. Search for newly created user in the list
16. Verify user appears with "Admin" role badge (primary color)
17. Verify user has "Active" status badge
18. Record the user's ID/name for cleanup

**Expected Results:**

- [ ] Form submits successfully
- [ ] API returns 200/201 status
- [ ] Success notification appears with email message
- [ ] Redirect to `/#/sales` list page
- [ ] New user visible in list
- [ ] User has correct Admin role badge (primary/blue)
- [ ] User has Active status badge (success/green)
- [ ] No console errors
- [ ] No RLS errors in console

---

### B9: Create User with Manager Role

**Objective:** Verify successful creation of a user with Manager role.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form
- Generate unique timestamp for test data

**Test Data:**
- First Name: `ManagerTest`
- Last Name: `User-[timestamp]`
- Email: `managertest-[timestamp]@example.com`
- Role: Manager

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Fill in First Name: "ManagerTest"
4. Fill in Last Name: "User-[timestamp]"
5. Fill in Email: "managertest-[timestamp]@example.com"
6. Click Role dropdown and select "Manager"
7. Verify all required fields are filled
8. Open Network tab in DevTools
9. Click the "Save" or submit button
10. Wait for API response
11. Verify POST/PATCH request returns success
12. Wait for success notification to appear
13. Verify redirect to `/#/sales` list page
14. Search for newly created user in the list
15. Verify user appears with "Manager" role badge (success/green)
16. Verify user has "Active" status badge
17. Record the user's ID/name for cleanup

**Expected Results:**

- [ ] Form submits successfully
- [ ] API returns success status
- [ ] Success notification appears
- [ ] Redirect to `/#/sales` list page
- [ ] New user visible in list
- [ ] User has correct Manager role badge (success/green)
- [ ] User has Active status badge
- [ ] No console errors

---

### B10: Create User with Rep Role

**Objective:** Verify successful creation of a user with Rep role.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form
- Generate unique timestamp for test data

**Test Data:**
- First Name: `RepTest`
- Last Name: `User-[timestamp]`
- Email: `reptest-[timestamp]@example.com`
- Role: Rep

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Fill in First Name: "RepTest"
4. Fill in Last Name: "User-[timestamp]"
5. Fill in Email: "reptest-[timestamp]@example.com"
6. Click Role dropdown and select "Rep"
7. Verify all required fields are filled
8. Open Network tab in DevTools
9. Click the "Save" or submit button
10. Wait for API response
11. Verify POST/PATCH request returns success
12. Wait for success notification to appear
13. Verify redirect to `/#/sales` list page
14. Search for newly created user in the list
15. Verify user appears with "Rep" role badge (muted)
16. Verify user has "Active" status badge
17. Record the user's ID/name for cleanup

**Expected Results:**

- [ ] Form submits successfully
- [ ] API returns success status
- [ ] Success notification appears
- [ ] Redirect to `/#/sales` list page
- [ ] New user visible in list
- [ ] User has correct Rep role badge (muted color)
- [ ] User has Active status badge
- [ ] No console errors

---

### B11: Duplicate Email Prevented with Error

**Objective:** Verify the system prevents creating users with duplicate email addresses.

**Prerequisites:**
- Logged in as admin@test.com
- At `/#/sales/create` form
- Know an existing user's email (e.g., admin@test.com)

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for form to load completely
3. Fill in First Name: "Duplicate"
4. Fill in Last Name: "EmailTest"
5. Fill in Email with an EXISTING email: "admin@test.com"
6. Select Role: "Rep" from dropdown
7. Open Network tab in DevTools
8. Click the "Save" or submit button
9. Wait for API response
10. Verify API returns error (400/409/422 status)
11. Wait for error notification to appear
12. Verify error message mentions duplicate/existing email
13. Verify form stays on `/#/sales/create` (not redirected)
14. Verify form inputs retain their values
15. Change email to unique value
16. Submit again to verify form still works
17. Check console for any unexpected errors

**Expected Results:**

- [ ] API rejects duplicate email with error status
- [ ] Error notification appears: "A user with this email already exists"
- [ ] Form remains on create page
- [ ] Form inputs retain entered values
- [ ] User is NOT created in database
- [ ] No console errors (error notification is expected)
- [ ] Form works after correcting the email

---

## Section C: Edit Team Member (6 Tests)

Tests the team member edit functionality with role-based access control.

### C1: Admin Can Edit Any User's Profile

**Objective:** Verify admin user can edit any team member's profile information.

**Prerequisites:**
- Logged in as admin@test.com
- At least one other user exists (Manager or Rep)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load completely
3. Find a user OTHER than the logged-in admin (e.g., manager@mfbroker.com)
4. Click on the user row to open slide-over panel
5. Wait for slide-over to open (slides in from right, 40vw width)
6. Verify slide-over shows user's name in header
7. Check that "Profile" tab is visible and selected
8. Look for "Edit" mode toggle button
9. Click Edit button or toggle to switch to edit mode
10. Verify form fields become editable:
    - First Name input enabled
    - Last Name input enabled
    - Email input (may be read-only)
    - Phone input enabled
11. Change the First Name to a new value (e.g., add " Updated")
12. Click "Save Changes" button
13. Wait for save operation to complete
14. Verify success notification appears
15. Verify slide-over switches back to view mode
16. Verify the updated name is displayed
17. Close slide-over and verify list shows updated name

**Expected Results:**

- [ ] Slide-over opens for any user
- [ ] Edit mode toggle is visible to admin
- [ ] Profile fields are editable in edit mode
- [ ] Save operation succeeds
- [ ] Success notification appears
- [ ] Updated data persists after save
- [ ] No console errors during edit operation
- [ ] No RLS errors in console

---

### C2: Admin Can Edit Any User's Role

**Objective:** Verify admin user can change any team member's role.

**Prerequisites:**
- Logged in as admin@test.com
- At least one other user exists with non-admin role

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load completely
3. Find a user with "Rep" role (not the logged-in admin)
4. Note the user's current role badge color
5. Click on the user row to open slide-over
6. Wait for slide-over to open
7. Click on "Permissions" tab (shield icon)
8. Verify current role is displayed as badge
9. Click Edit button to switch to edit mode
10. Locate the Role dropdown/select
11. Click the Role dropdown
12. Change from current role to "Manager"
13. Verify the dropdown value updates
14. Click "Save Changes" button
15. Wait for save operation to complete
16. Verify success notification: "Permissions updated successfully"
17. Verify slide-over shows new role badge
18. Close slide-over and verify list shows updated role badge (success/green for Manager)
19. Reopen slide-over and verify role persisted

**Expected Results:**

- [ ] Permissions tab is accessible
- [ ] Role dropdown is visible in edit mode
- [ ] Role can be changed from Rep to Manager
- [ ] Save operation succeeds
- [ ] Success notification appears
- [ ] Role badge updates in view mode
- [ ] Role badge updates in list view
- [ ] Change persists after re-opening slide-over
- [ ] No console errors

---

### C3: Manager Can Edit User Profiles (Not Roles)

**Objective:** Verify manager users can edit profile info but NOT roles.

**Prerequisites:**
- Logged out from admin session
- Test user manager@mfbroker.com exists

**Steps:**

1. Log in as manager@mfbroker.com with password123
2. Navigate to `/#/sales`
3. Wait for list to load
4. Find a user OTHER than self (e.g., a Rep user)
5. Click on the user row to open slide-over
6. Wait for slide-over to open
7. Click on "Profile" tab
8. Look for Edit mode toggle
9. If Edit button visible, click to enter edit mode
10. Verify Profile fields are editable (First Name, Last Name, Phone)
11. Click on "Permissions" tab
12. Look for Edit button or editable controls
13. Verify Role dropdown is DISABLED or hidden
14. Verify "disabled" toggle is DISABLED or hidden
15. Attempt to save any changes
16. Verify operation completes (for profile) or is blocked (for permissions)

**Expected Results:**

- [ ] Manager can access slide-over for other users
- [ ] Profile tab fields are editable by manager
- [ ] Permissions tab is read-only for manager
- [ ] Role dropdown is disabled/hidden for manager
- [ ] Disabled toggle is not editable by manager
- [ ] Profile changes can be saved
- [ ] Role changes are blocked
- [ ] No console errors

**Notes:**

If managers cannot access the sales list at all, document this as expected RBAC behavior.

---

### C4: Rep Can Edit Own Profile Only

**Objective:** Verify rep users can edit their own profile.

**Prerequisites:**
- Logged out from previous session
- Test user rep@mfbroker.com exists

**Steps:**

1. Log in as rep@mfbroker.com with password123
2. Navigate to `/#/sales` (may be blocked for reps)
3. If blocked, navigate to profile via user menu or account settings
4. Locate own user profile (rep@mfbroker.com)
5. Open profile view (slide-over or dedicated page)
6. Wait for profile to load
7. Verify own name and email are displayed
8. Look for Edit mode toggle
9. If Edit visible, click to enter edit mode
10. Verify Profile fields are editable (First Name, Last Name, Phone)
11. Attempt to change own first name
12. Click Save Changes
13. Verify save operation succeeds
14. Verify success notification appears
15. Verify Permissions tab is read-only (cannot change own role)
16. Verify "disabled" toggle is hidden (cannot disable self)

**Expected Results:**

- [ ] Rep can access own profile
- [ ] Own Profile fields are editable
- [ ] Profile changes save successfully
- [ ] Permissions tab is read-only for own profile
- [ ] Cannot change own role
- [ ] Cannot disable own account
- [ ] Self-edit warning may be shown
- [ ] No console errors

---

### C5: Rep Cannot Edit Another User's Profile

**Objective:** Verify rep users cannot access or edit other users' profiles.

**Prerequisites:**
- Logged in as rep@mfbroker.com
- Other users exist in the system

**Steps:**

1. Logged in as rep@mfbroker.com
2. Navigate to `/#/sales`
3. Observe whether sales list is accessible at all
4. If list is accessible, try to click on a user OTHER than self
5. If slide-over opens, check if Edit button is visible
6. If Edit button visible, click it
7. Verify form fields are disabled/read-only for other users
8. Try navigating directly to edit URL: `/#/sales/[other-user-id]`
9. Verify access is blocked or redirected
10. Check console for permission errors or warnings
11. Verify no unauthorized data is exposed

**Expected Results:**

- [ ] Rep cannot edit other users' profiles
- [ ] Edit button hidden or disabled for other users
- [ ] Direct URL access to other users is blocked
- [ ] Permission denied message shown (if access attempted)
- [ ] No unauthorized data exposure
- [ ] Rep can only access own profile data
- [ ] Console may show RBAC warnings (not errors)

---

### C6: Cancel Edit Discards Changes

**Objective:** Verify canceling edit mode discards unsaved changes.

**Prerequisites:**
- Logged in as admin@test.com
- A user exists to edit

**Steps:**

1. Navigate to `/#/sales`
2. Click on a user row to open slide-over
3. Wait for slide-over to open
4. Click Edit button to enter edit mode
5. Note the current First Name value
6. Change the First Name to a different value (e.g., "CHANGED")
7. Do NOT click Save
8. Look for Cancel button or "X" close button
9. Click Cancel or close the slide-over
10. If confirmation dialog appears, confirm discard
11. Reopen the same user's slide-over
12. Verify First Name is still the ORIGINAL value
13. Verify the "CHANGED" value was NOT saved
14. Check database/API to confirm no change was made
15. Verify no console errors during cancel operation

**Expected Results:**

- [ ] Cancel button is visible in edit mode
- [ ] Clicking Cancel discards unsaved changes
- [ ] Confirmation dialog may appear for unsaved changes
- [ ] Original values are preserved after cancel
- [ ] No API request made for unsaved changes
- [ ] Reopening shows original data
- [ ] No console errors

---

## Section D: Disable/Enable Team Member (4 Tests)

Tests the account disable/enable functionality.

### D1: Admin Can Disable User Account

**Objective:** Verify admin can disable another user's account.

**Prerequisites:**
- Logged in as admin@test.com
- At least one other active user exists (not admin)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load
3. Find an ACTIVE user OTHER than self (e.g., Rep user with "Active" badge)
4. Note the user's current status (should be "Active" badge)
5. Click on the user row to open slide-over
6. Wait for slide-over to open
7. Click on "Permissions" tab
8. Verify current status shows "Active" badge
9. Click Edit button to enter edit mode
10. Locate "Account Status" section with disabled toggle
11. Toggle the switch to ENABLE "disabled" (turn it ON)
12. Verify warning message appears about disabling account
13. Click "Save Changes" button
14. Wait for save operation to complete
15. Verify success notification: "Permissions updated successfully"
16. Verify status badge changes to "Disabled" (warning/amber color)
17. Close slide-over and verify list shows "Disabled" badge
18. Record the disabled user for test D4 (re-enable)

**Expected Results:**

- [ ] Disabled toggle is visible in edit mode
- [ ] Warning message appears when disabling
- [ ] Save operation succeeds
- [ ] Success notification appears
- [ ] Status badge changes to "Disabled"
- [ ] Disabled badge shows warning/amber color
- [ ] List view updates to show "Disabled" badge
- [ ] No console errors

---

### D2: Disabled User Badge Shows in List

**Objective:** Verify disabled users display correctly in the team list.

**Prerequisites:**
- A disabled user exists (from test D1)
- Logged in as admin@test.com
- "Show disabled" filter enabled (or disabled users visible by default)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load
3. Enable "Show disabled" filter in sidebar (if hidden by default)
4. Wait for list to update
5. Find the disabled user from test D1
6. Verify the user row is visible
7. Check the "Status" column for this user
8. Verify "Disabled" badge is displayed
9. Verify badge has warning/amber color styling:
    - border-warning class
    - text-warning class
10. Compare with an Active user's badge:
    - Active shows success/green color
11. Verify disabled user's row is not grayed out or hidden
12. Click on disabled user to verify slide-over opens
13. Verify slide-over shows "Disabled" badge on Permissions tab

**Expected Results:**

- [ ] Disabled users visible when filter allows
- [ ] "Disabled" badge clearly displayed in Status column
- [ ] Badge uses warning/amber color (not red/destructive)
- [ ] Badge is visually distinct from "Active" badge
- [ ] Disabled user row is fully functional (clickable)
- [ ] Slide-over shows disabled status correctly
- [ ] No console errors

---

### D3: Disabled User Cannot Login

**Objective:** Verify disabled users are blocked from logging in.

**Prerequisites:**
- A disabled user exists (from test D1)
- Know the disabled user's email and password
- Logged out from all sessions

**Steps:**

1. Log out of current session (if any)
2. Navigate to login page: http://localhost:5173
3. Wait for login form to load
4. Enter the disabled user's email in the Email field
5. Enter the disabled user's password in the Password field
6. Click "Sign In" button
7. Wait for authentication response (timeout: 10s)
8. Observe the result:
    - Option A: Error message appears on login form
    - Option B: Login succeeds but redirects to error page
    - Option C: Login succeeds but shows "Account disabled" message
9. Verify user is NOT logged into the application
10. Verify dashboard is NOT accessible
11. Check console for authentication errors
12. Verify error message is user-friendly (not technical)
13. Verify user cannot bypass by navigating directly to `/#/`

**Expected Results:**

- [ ] Disabled user cannot successfully log in
- [ ] Error message indicates account is disabled
- [ ] User is not redirected to dashboard
- [ ] Protected routes are not accessible
- [ ] Error message is user-friendly
- [ ] No sensitive error details exposed
- [ ] Console shows authentication failure (expected)

**Notes:**

If authentication is handled by Supabase, the behavior may be:
- Supabase may allow login but app blocks access
- Or Supabase may block login entirely if user is banned

---

### D4: Admin Can Re-enable Disabled User

**Objective:** Verify admin can re-enable a previously disabled account.

**Prerequisites:**
- A disabled user exists (from test D1)
- Logged in as admin@test.com

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load
3. Enable "Show disabled" filter to see disabled users
4. Find the disabled user from test D1
5. Verify user shows "Disabled" badge
6. Click on the user row to open slide-over
7. Wait for slide-over to open
8. Click on "Permissions" tab
9. Verify status shows "Disabled" badge
10. Click Edit button to enter edit mode
11. Locate "Account Status" section with disabled toggle
12. Toggle the switch to DISABLE "disabled" (turn it OFF)
13. Verify switch state changes to "Account Active"
14. Click "Save Changes" button
15. Wait for save operation to complete
16. Verify success notification appears
17. Verify status badge changes to "Active" (success/green)
18. Close slide-over and verify list shows "Active" badge
19. Test that user can now log in (optional - see D3 reverse)

**Expected Results:**

- [ ] Admin can access disabled user's slide-over
- [ ] Disabled toggle is visible in edit mode
- [ ] Toggle can be turned OFF to re-enable
- [ ] Save operation succeeds
- [ ] Success notification appears
- [ ] Status badge changes to "Active"
- [ ] Active badge shows success/green color
- [ ] List view updates to show "Active" badge
- [ ] User should be able to log in after re-enable
- [ ] No console errors

---

## Section E: Delete Team Member - Admin Only (4 Tests)

Tests the team member soft-delete functionality restricted to Admin role.

### E1: Admin Sees Delete Button on User Detail

**Objective:** Verify admin user sees the delete option for other users.

**Prerequisites:**
- Logged in as admin@test.com
- Other users exist in the system

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load
3. Find a user OTHER than self (cannot delete own account)
4. Click on the user row to open slide-over
5. Wait for slide-over to open
6. Click on "Permissions" tab
7. Scroll down to look for "Danger Zone" section
8. Verify "Danger Zone" section is visible
9. Check for red/destructive styling on Danger Zone border
10. Locate "Remove User" button within Danger Zone
11. Verify button has destructive styling (red)
12. Verify button shows trash icon
13. Note the button text: "Remove User"
14. Do NOT click the button yet (test E4 will test the action)
15. Close slide-over

**Expected Results:**

- [ ] "Danger Zone" section visible on Permissions tab
- [ ] Danger Zone has destructive/red border styling
- [ ] "Remove User" button is visible
- [ ] Button has destructive variant styling (red background)
- [ ] Button shows trash icon
- [ ] Button is enabled (not disabled)
- [ ] Only visible on OTHER users' profiles (not own)
- [ ] No console errors

---

### E2: Manager Does Not See Delete Button

**Objective:** Verify manager users do not see the delete option.

**Prerequisites:**
- Logged out from admin session
- Test user manager@mfbroker.com exists

**Steps:**

1. Log in as manager@mfbroker.com with password123
2. Navigate to `/#/sales`
3. Wait for list to load
4. Find any user OTHER than self
5. Click on the user row to open slide-over
6. Wait for slide-over to open
7. Click on "Permissions" tab
8. Scroll through entire tab content
9. Look for "Danger Zone" section - should NOT be visible
10. Look for "Remove User" button - should NOT be visible
11. Look for any delete-related controls
12. Verify no delete functionality is accessible
13. Inspect page source/elements to confirm no hidden delete buttons
14. Close slide-over

**Expected Results:**

- [ ] "Danger Zone" section is NOT visible to manager
- [ ] "Remove User" button is NOT visible to manager
- [ ] No delete-related controls visible
- [ ] Permissions tab shows only read-only info (or profile edit)
- [ ] Manager cannot delete users
- [ ] No hidden delete elements in DOM
- [ ] No console errors

---

### E3: Rep Does Not See Delete Button

**Objective:** Verify rep users do not see the delete option.

**Prerequisites:**
- Logged out from previous session
- Test user rep@mfbroker.com exists

**Steps:**

1. Log in as rep@mfbroker.com with password123
2. Navigate to `/#/sales` (may be blocked for reps)
3. If blocked, try accessing own profile
4. If sales list accessible, find any user
5. Attempt to open slide-over for any user
6. Look for "Permissions" tab
7. If accessible, scroll through entire tab
8. Look for "Danger Zone" section - should NOT be visible
9. Look for "Remove User" button - should NOT be visible
10. Even on own profile, delete button should NOT be visible
11. Verify no delete functionality is accessible to rep
12. Close any open slide-over

**Expected Results:**

- [ ] "Danger Zone" section is NOT visible to rep
- [ ] "Remove User" button is NOT visible to rep
- [ ] Rep cannot access delete functionality
- [ ] Rep may not have access to sales list at all
- [ ] Self-profile does not show delete option
- [ ] No console errors

---

### E4: Delete with Confirmation Dialog

**Objective:** Verify delete action shows confirmation and completes successfully.

**Prerequisites:**
- Logged in as admin@test.com
- A test user exists that can be deleted (from tests B8-B10)
- Note the test user's name and email for verification

**Steps:**

1. Navigate to `/#/sales`
2. Wait for list to load
3. Find the test user created earlier (e.g., "RepTest User-[timestamp]")
4. Note the user's name and email
5. Click on the user row to open slide-over
6. Wait for slide-over to open
7. Click on "Permissions" tab
8. Scroll to "Danger Zone" section
9. Click "Remove User" button
10. Wait for confirmation dialog to appear (AlertDialog)
11. Verify dialog title: "Remove User"
12. Verify dialog shows user's name and email in description
13. Verify "Cancel" button is visible
14. Verify "Remove User" action button is visible (destructive styling)
15. Click "Cancel" first to verify it closes dialog without deleting
16. Click "Remove User" button again
17. In the dialog, click "Remove User" action button
18. Wait for delete operation to complete
19. Verify success notification: "User removed successfully"
20. Verify slide-over closes
21. Verify redirect to `/#/sales` list
22. Search for the deleted user in the list
23. Verify user is NO LONGER visible in list (soft-deleted)
24. Enable "Show deleted" filter if available to confirm soft-delete

**Expected Results:**

- [ ] Confirmation dialog appears when clicking Remove User
- [ ] Dialog shows user's name and email
- [ ] Cancel button closes dialog without action
- [ ] Remove User button has destructive styling
- [ ] Delete operation completes successfully
- [ ] Success notification appears
- [ ] Slide-over closes after deletion
- [ ] User removed from visible list
- [ ] This is a SOFT delete (deleted_at set, not hard delete)
- [ ] No console errors
- [ ] No RLS errors in console

---

## Console Monitoring Guidelines

### Errors to Watch For

**RLS (Row Level Security) Errors:**
- Pattern: "policy", "RLS", "permission denied", "42501"
- Indicates database security policy violations
- Should NOT appear in successful operations

**React Errors:**
- Pattern: Red error messages, "Uncaught", stack traces
- Hooks violations, component lifecycle errors
- Should NOT appear during normal operations

**Network Errors:**
- 401: Unauthorized (authentication issue)
- 403: Forbidden (RBAC issue - may be expected for blocked access)
- 500: Server error (unexpected)

**RBAC Warning Logs:**
- Pattern: "permission", "access", "blocked", "redirect"
- May appear when testing blocked access (B2, B3, C5)
- These are EXPECTED when testing permission denials

### Console Check Procedure

1. Open DevTools Console tab before each test
2. Clear console at test start
3. Monitor during test execution
4. Note any red error messages
5. Differentiate between expected warnings and unexpected errors
6. Screenshot console if errors appear

---

## Reporting Test Results

### Pass Criteria

**Section A (List View):** All 6 tests must pass
**Section B (Create):** All 11 tests must pass
**Section C (Edit):** All 6 tests must pass
**Section D (Disable/Enable):** All 4 tests must pass
**Section E (Delete):** All 4 tests must pass

**Total: 31 tests**

### Failure Reporting

When reporting failures, include:

1. **Test ID:** e.g., "B7: Email Format Validation"
2. **Steps Completed:** Which steps were executed before failure
3. **Expected vs. Actual:** What should have happened vs. what did happen
4. **Console Errors:** Screenshot or copy/paste of console
5. **Screenshots:** UI state at time of failure
6. **Browser/Version:** e.g., "Chrome 120.0.6099.130"
7. **Test User:** Which account was used
8. **Timestamp:** When the test was run

### Example Failure Report

```
Test: B11 - Duplicate Email Prevented
Steps Completed: 1-8
Expected: API returns 400/409 error, form shows duplicate email message
Actual: Form submitted successfully, no error shown
Console: No errors
Screenshot: [attached]
Browser: Chrome 120.0.6099.130
Test User: admin@test.com
Timestamp: 2025-12-26 14:30:22 PST

Notes: Duplicate check may not be implemented in Edge Function.
Duplicate user was created in database.
```

---

## Test Data Cleanup

After completing all tests, clean up test data:

1. Log in as admin@test.com
2. Navigate to `/#/sales`
3. Search for test users created during testing:
   - AdminTest User-[timestamp]
   - ManagerTest User-[timestamp]
   - RepTest User-[timestamp]
4. Delete each test user using the Remove User function
5. Verify users are removed from list
6. Optionally, purge deleted records from database

**Cleanup SQL (if needed):**
```sql
-- View soft-deleted test users
SELECT * FROM sales
WHERE email LIKE '%test-%@example.com'
AND deleted_at IS NOT NULL;

-- Hard delete test users (use with caution)
DELETE FROM sales
WHERE email LIKE '%test-%@example.com';
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-26 | Claude Code | Initial creation |
