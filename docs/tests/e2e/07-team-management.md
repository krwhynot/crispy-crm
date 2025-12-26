# Team Member Management - Manual E2E Testing Checklist

Manual E2E testing checklist for Team Member Management functionality, including role-based access control (RBAC) for Admin, Manager, and Rep users.

**Test Suite:** RBAC Suite - Test 2 of 6
**Prerequisite:** Test 1 (06-auth-foundation.md) must pass before running these tests.

## Test Environment Setup

- **Browser:** Chrome, Firefox, or Safari (with DevTools open)
- **URL:** http://localhost:5173
- **Team Management Route:** `/#/sales`
- **Create Route:** `/#/sales/create`

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Manager | manager@mfbroker.com | password123 |
| Rep | rep@mfbroker.com | password123 |

### Test Data Naming Convention

Use timestamps for test data to ensure uniqueness:
- Email: `TestUser-[timestamp]@example.com` (e.g., `TestUser-1735225200@example.com`)
- Name: `Test[timestamp]` (e.g., `Test1735225200`)

---

## Section A: Team Member List View (6 Tests)

### Test A1: Admin Sees All Team Members in List

**Objective:** Verify that an Admin user can view all team members in the team list.

**Prerequisites:**
- Logged out from any previous session
- DevTools Console tab open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for the login page to load completely
3. Enter email: `admin@test.com`
4. Enter password: `password123`
5. Click the "Sign In" button
6. Wait for redirect to dashboard (URL should be `/#/`)
7. Verify no console errors appear during login
8. Locate the sidebar navigation on the left side of the screen
9. Click on "Team" or "Sales" menu item in the sidebar
10. Wait for the team list page to load (URL should be `/#/sales`)
11. Observe the list of team members displayed
12. Count the number of team members visible in the list

**Expected Results:**
- [ ] Login completes without errors
- [ ] Sidebar navigation contains "Team" or "Sales" menu item
- [ ] Team list page loads at `/#/sales`
- [ ] List displays multiple team members (at least 3: Admin, Manager, Rep test users)
- [ ] Each row shows a team member entry
- [ ] No console errors (red text in Console tab)
- [ ] No RLS (Row-Level Security) errors containing "permission denied", "42501", or "policy"
- [ ] No network errors (500, 403, 401 status codes)

**Pass:** [ ] **Fail:** [ ]

---

### Test A2: List Displays Required Columns

**Objective:** Verify that the team list displays Name, Email, Role badge, and Status badge columns.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)

**Steps:**

1. Observe the column headers in the team list table/grid
2. Locate the "Name" column header
3. Locate the "Email" column header
4. Locate the "Role" column header (or column containing role badges)
5. Locate the "Status" column header (or column containing status badges)
6. For a visible team member row, identify the Name value
7. For the same row, identify the Email value
8. For the same row, identify the Role badge (should show "Admin", "Manager", or "Rep")
9. For the same row, identify the Status badge (should show "Active", "Disabled", or similar)
10. Verify badges use semantic colors (not hardcoded hex values)
11. Open DevTools Elements tab and inspect a role badge
12. Verify the badge uses Tailwind semantic classes (e.g., `bg-primary`, `bg-secondary`)

**Expected Results:**
- [ ] "Name" column is visible and displays user names
- [ ] "Email" column is visible and displays email addresses
- [ ] "Role" column/badges are visible with role indicators
- [ ] "Status" column/badges are visible with status indicators
- [ ] Role badges show one of: Admin, Manager, Rep
- [ ] Status badges show one of: Active, Disabled (or equivalent)
- [ ] Badges use semantic color tokens (not hardcoded colors)
- [ ] Column layout is readable and properly aligned
- [ ] No console errors during page rendering

**Pass:** [ ] **Fail:** [ ]

---

### Test A3: Sort Team List by Name Column

**Objective:** Verify that clicking the Name column header sorts the team list alphabetically.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)
- At least 3 team members visible in the list

**Steps:**

1. Note the current order of team member names in the list
2. Write down the first three names in order
3. Locate the "Name" column header
4. Click on the "Name" column header
5. Wait for the list to re-sort (may see brief loading indicator)
6. Observe the new order of team member names
7. Verify the list is now sorted A-Z (ascending) by name
8. Click the "Name" column header again
9. Wait for the list to re-sort
10. Verify the list is now sorted Z-A (descending) by name
11. Check for a sort indicator icon (arrow up/down) on the column header
12. Verify no console errors occurred during sorting

**Expected Results:**
- [ ] First click on Name header sorts list A-Z (ascending)
- [ ] Second click on Name header sorts list Z-A (descending)
- [ ] Sort indicator (arrow icon) appears on the column header
- [ ] Sort indicator direction changes with each click
- [ ] List updates without full page reload
- [ ] No console errors during sort operation
- [ ] Sort persists after scrolling the list

**Pass:** [ ] **Fail:** [ ]

---

### Test A4: Filter Team List by Role Dropdown

**Objective:** Verify that the role dropdown filter shows only team members with the selected role.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)

**Steps:**

1. Note the total count of team members currently displayed
2. Locate the "Role" filter dropdown (may be in a filter bar or toolbar)
3. Click on the Role filter dropdown to open it
4. Observe the available role options (should include Admin, Manager, Rep)
5. Select "Manager" from the dropdown
6. Wait for the list to filter
7. Verify only users with "Manager" role are displayed
8. Note the count of filtered results
9. Click on the Role filter dropdown again
10. Select "Admin" from the dropdown
11. Verify only users with "Admin" role are displayed
12. Click on the Role filter dropdown again
13. Select "All" or clear the filter to reset
14. Verify the full list is displayed again

**Expected Results:**
- [ ] Role filter dropdown is visible and accessible
- [ ] Dropdown shows all role options: Admin, Manager, Rep
- [ ] Selecting "Manager" filters to only Manager users
- [ ] Selecting "Admin" filters to only Admin users
- [ ] Selecting "Rep" filters to only Rep users
- [ ] "All" or clear filter restores full list
- [ ] Filter updates list without page reload
- [ ] No console errors during filtering
- [ ] Filter state is visually indicated (selected option highlighted)

**Pass:** [ ] **Fail:** [ ]

---

### Test A5: Toggle "Show Disabled" Filter

**Objective:** Verify that the "Show disabled" toggle controls visibility of disabled user accounts.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)
- At least one disabled user exists in the system (create one if needed in Test D1)

**Steps:**

1. Locate the "Show disabled" toggle/checkbox in the filter bar
2. Verify the toggle is currently OFF (unchecked) by default
3. Note the current count of team members displayed
4. If all users are active, note that no disabled badge is visible
5. Click/toggle the "Show disabled" option to ON
6. Wait for the list to update
7. Observe if any additional users with "Disabled" status appear
8. Note the new count of team members (should be equal or greater)
9. Look for users with a "Disabled" badge or visual indicator
10. Click/toggle the "Show disabled" option back to OFF
11. Verify disabled users are hidden from the list again
12. Verify the count returns to the original number

**Expected Results:**
- [ ] "Show disabled" toggle is visible in filter bar
- [ ] Toggle defaults to OFF (active users only)
- [ ] Toggling ON shows disabled users in addition to active
- [ ] Disabled users are visually distinct (badge, grayed out, or indicator)
- [ ] Toggling OFF hides disabled users from view
- [ ] Toggle state is visually indicated (on/off appearance)
- [ ] No console errors during toggle operation
- [ ] Filter change updates list without page reload

**Pass:** [ ] **Fail:** [ ]

---

### Test A6: Search Team Members by Name/Email

**Objective:** Verify that the search functionality filters team members by name or email.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)
- Know the name/email of at least one team member

**Steps:**

1. Locate the search input field (may be in toolbar or filter bar)
2. Note the current count of team members displayed
3. Click into the search input field
4. Type the first few letters of a known team member's first name (e.g., "Adm" for Admin)
5. Wait for debounce (typically 300ms) and list to filter
6. Verify the list shows only matching team members
7. Clear the search input
8. Verify the full list is restored
9. Type part of a known email address (e.g., "admin@")
10. Wait for debounce and list to filter
11. Verify the list shows only team members with matching email
12. Type a non-existent name (e.g., "zzzznonexistent")
13. Verify the list shows empty state or "No results" message
14. Clear the search input to restore the full list

**Expected Results:**
- [ ] Search input field is visible and accessible
- [ ] Typing in search filters the list in real-time (after debounce)
- [ ] Search matches against team member names
- [ ] Search matches against team member emails
- [ ] Search is case-insensitive
- [ ] Clearing search restores full list
- [ ] Non-matching search shows empty state with appropriate message
- [ ] Debounce prevents excessive API calls (check Network tab)
- [ ] No console errors during search operation

**Pass:** [ ] **Fail:** [ ]

---

## Section B: Create Team Member - Admin Only (11 Tests)

### Test B1: Admin Can Access Create Form via Button

**Objective:** Verify that an Admin user can access the team member create form.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)

**Steps:**

1. Observe the team list page layout
2. Locate the "Create" or "Add" or "+" button (typically in toolbar or header)
3. Note the button text/icon and its position
4. Click the Create button
5. Wait for the create form to load
6. Verify the URL changes to `/#/sales/create`
7. Verify the create form is displayed
8. Locate the "First Name" input field
9. Locate the "Last Name" input field
10. Locate the "Email" input field
11. Locate the "Role" dropdown/select field
12. Verify the form has a "Save" or "Create" submit button

**Expected Results:**
- [ ] Create button is visible on the team list page
- [ ] Button has appropriate label ("Create", "Add", or "+" icon)
- [ ] Clicking button navigates to `/#/sales/create`
- [ ] Create form renders without errors
- [ ] Form contains First Name input field
- [ ] Form contains Last Name input field
- [ ] Form contains Email input field
- [ ] Form contains Role selection (dropdown or radio buttons)
- [ ] Form contains Save/Create submit button
- [ ] No console errors during navigation or form load

**Pass:** [ ] **Fail:** [ ]

---

### Test B2: Manager Cannot Access Create Route (Blocked/Redirected)

**Objective:** Verify that a Manager user cannot access the team member create route.

**Prerequisites:**
- Logged out from Admin session
- DevTools Console tab open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for the login page to load
3. Enter email: `manager@mfbroker.com`
4. Enter password: `password123`
5. Click the "Sign In" button
6. Wait for redirect to dashboard
7. Verify successful login (no longer on login page)
8. Manually navigate to `http://localhost:5173/#/sales/create` by entering URL
9. Wait for page to respond
10. Observe the result (redirect, error page, or blocked access)
11. Check the current URL after attempted access
12. Check the console for any error messages or access denied logs

**Expected Results:**
- [ ] Manager login succeeds
- [ ] Attempting to access `/#/sales/create` does NOT show create form
- [ ] User is redirected away from create page OR
- [ ] User sees an "Access Denied" or "Unauthorized" message OR
- [ ] Create form is not visible/functional
- [ ] URL does not remain at `/#/sales/create` (if redirected)
- [ ] No server errors (500) - should be client-side or 403 access control
- [ ] Console may show authorization-related log messages

**Pass:** [ ] **Fail:** [ ]

---

### Test B3: Rep Cannot Access Create Route (Blocked/Redirected)

**Objective:** Verify that a Rep user cannot access the team member create route.

**Prerequisites:**
- Logged out from previous session
- DevTools Console tab open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for the login page to load
3. Enter email: `rep@mfbroker.com`
4. Enter password: `password123`
5. Click the "Sign In" button
6. Wait for redirect to dashboard
7. Verify successful login (no longer on login page)
8. Manually navigate to `http://localhost:5173/#/sales/create` by entering URL
9. Wait for page to respond
10. Observe the result (redirect, error page, or blocked access)
11. Check the current URL after attempted access
12. Check the console for any error messages or access denied logs

**Expected Results:**
- [ ] Rep login succeeds
- [ ] Attempting to access `/#/sales/create` does NOT show create form
- [ ] User is redirected away from create page OR
- [ ] User sees an "Access Denied" or "Unauthorized" message OR
- [ ] Create form is not visible/functional
- [ ] URL does not remain at `/#/sales/create` (if redirected)
- [ ] No server errors (500) - should be client-side or 403 access control
- [ ] Console may show authorization-related log messages

**Pass:** [ ] **Fail:** [ ]

---

### Test B4: Required Field Validation - First Name Empty

**Objective:** Verify that the create form prevents submission when first_name is empty.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On create form page (`/#/sales/create`)

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for the form to load completely
3. Leave the "First Name" field empty
4. Fill in "Last Name" with: `TestLastName`
5. Fill in "Email" with: `test-b4-[timestamp]@example.com`
6. Select a role from the Role dropdown (e.g., "Rep")
7. Locate the Save/Create button
8. Observe if the Save button is disabled
9. If the button is enabled, click it
10. Wait for validation response
11. Observe if an error message appears for First Name
12. Verify the form was NOT submitted (URL still at `/#/sales/create`)

**Expected Results:**
- [ ] Form recognizes First Name as a required field
- [ ] Save button is disabled while First Name is empty OR
- [ ] Clicking Save shows validation error for First Name
- [ ] Error message clearly indicates First Name is required
- [ ] Error message has `role="alert"` for screen reader announcement
- [ ] Input field has `aria-invalid="true"` when error is shown
- [ ] Form does NOT submit with empty First Name
- [ ] No RLS or server errors in console
- [ ] URL remains at `/#/sales/create`

**Pass:** [ ] **Fail:** [ ]

---

### Test B5: Required Field Validation - Last Name Empty

**Objective:** Verify that the create form prevents submission when last_name is empty.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On create form page (`/#/sales/create`)

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for the form to load completely
3. Fill in "First Name" with: `TestFirstName`
4. Leave the "Last Name" field empty
5. Fill in "Email" with: `test-b5-[timestamp]@example.com`
6. Select a role from the Role dropdown (e.g., "Rep")
7. Locate the Save/Create button
8. Observe if the Save button is disabled
9. If the button is enabled, click it
10. Wait for validation response
11. Observe if an error message appears for Last Name
12. Verify the form was NOT submitted (URL still at `/#/sales/create`)

**Expected Results:**
- [ ] Form recognizes Last Name as a required field
- [ ] Save button is disabled while Last Name is empty OR
- [ ] Clicking Save shows validation error for Last Name
- [ ] Error message clearly indicates Last Name is required
- [ ] Error message has `role="alert"` for screen reader announcement
- [ ] Input field has `aria-invalid="true"` when error is shown
- [ ] Form does NOT submit with empty Last Name
- [ ] No RLS or server errors in console
- [ ] URL remains at `/#/sales/create`

**Pass:** [ ] **Fail:** [ ]

---

### Test B6: Required Field Validation - Email Empty

**Objective:** Verify that the create form prevents submission when email is empty.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On create form page (`/#/sales/create`)

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for the form to load completely
3. Fill in "First Name" with: `TestFirstName`
4. Fill in "Last Name" with: `TestLastName`
5. Leave the "Email" field empty
6. Select a role from the Role dropdown (e.g., "Rep")
7. Locate the Save/Create button
8. Observe if the Save button is disabled
9. If the button is enabled, click it
10. Wait for validation response
11. Observe if an error message appears for Email
12. Verify the form was NOT submitted (URL still at `/#/sales/create`)

**Expected Results:**
- [ ] Form recognizes Email as a required field
- [ ] Save button is disabled while Email is empty OR
- [ ] Clicking Save shows validation error for Email
- [ ] Error message clearly indicates Email is required
- [ ] Error message has `role="alert"` for screen reader announcement
- [ ] Input field has `aria-invalid="true"` when error is shown
- [ ] Form does NOT submit with empty Email
- [ ] No RLS or server errors in console
- [ ] URL remains at `/#/sales/create`

**Pass:** [ ] **Fail:** [ ]

---

### Test B7: Email Format Validation - Invalid Email

**Objective:** Verify that the create form validates email format and rejects invalid emails.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On create form page (`/#/sales/create`)

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for the form to load completely
3. Fill in "First Name" with: `TestFirstName`
4. Fill in "Last Name" with: `TestLastName`
5. Fill in "Email" with an invalid email: `notavalidemail`
6. Click outside the Email field (blur) to trigger validation
7. Observe if an error message appears for invalid email format
8. Clear the Email field
9. Enter another invalid format: `missing@domain`
10. Click outside the field to trigger validation
11. Observe the error message
12. Clear the Email field and enter valid email: `valid@test.com`
13. Verify the error message disappears

**Expected Results:**
- [ ] Email `notavalidemail` triggers format validation error
- [ ] Email `missing@domain` triggers format validation error (if strict)
- [ ] Error message indicates invalid email format
- [ ] Error appears after blur (not during typing)
- [ ] Valid email clears the error message
- [ ] Input field shows visual error state (red border, aria-invalid)
- [ ] Form prevents submission with invalid email
- [ ] No console errors during validation

**Pass:** [ ] **Fail:** [ ]

---

### Test B8: Create User with Admin Role

**Objective:** Verify that an Admin can successfully create a new user with Admin role.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On create form page (`/#/sales/create`)
- Generate a unique timestamp for test data

**Steps:**

1. Generate a timestamp: `Date.now()` (e.g., `1735225200000`)
2. Navigate to `/#/sales/create`
3. Wait for the form to load completely
4. Fill in "First Name" with: `AdminTest`
5. Fill in "Last Name" with: `User[timestamp]` (e.g., `User1735225200000`)
6. Fill in "Email" with: `admintest-[timestamp]@example.com`
7. Click on the Role dropdown/select
8. Select "Admin" from the role options
9. Verify all required fields are filled
10. Click the "Save" or "Create" button
11. Wait for form submission and redirect
12. Verify redirect to team list page (`/#/sales`) or detail page

**Expected Results:**
- [ ] Form accepts all valid input values
- [ ] Admin role is selectable in the dropdown
- [ ] Form submits successfully
- [ ] Redirects to team list page after creation
- [ ] Newly created user appears in the team list
- [ ] User shows "Admin" role badge
- [ ] User shows "Active" status badge
- [ ] No RLS errors in console
- [ ] No React errors in console
- [ ] Success notification/message may appear

**Pass:** [ ] **Fail:** [ ]

---

### Test B9: Create User with Manager Role

**Objective:** Verify that an Admin can successfully create a new user with Manager role.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On create form page (`/#/sales/create`)
- Generate a unique timestamp for test data

**Steps:**

1. Generate a timestamp: `Date.now()` (e.g., `1735225300000`)
2. Navigate to `/#/sales/create`
3. Wait for the form to load completely
4. Fill in "First Name" with: `ManagerTest`
5. Fill in "Last Name" with: `User[timestamp]` (e.g., `User1735225300000`)
6. Fill in "Email" with: `managertest-[timestamp]@example.com`
7. Click on the Role dropdown/select
8. Select "Manager" from the role options
9. Verify all required fields are filled
10. Click the "Save" or "Create" button
11. Wait for form submission and redirect
12. Verify redirect to team list page (`/#/sales`) or detail page

**Expected Results:**
- [ ] Form accepts all valid input values
- [ ] Manager role is selectable in the dropdown
- [ ] Form submits successfully
- [ ] Redirects to team list page after creation
- [ ] Newly created user appears in the team list
- [ ] User shows "Manager" role badge
- [ ] User shows "Active" status badge
- [ ] No RLS errors in console
- [ ] No React errors in console
- [ ] Success notification/message may appear

**Pass:** [ ] **Fail:** [ ]

---

### Test B10: Create User with Rep Role

**Objective:** Verify that an Admin can successfully create a new user with Rep role.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On create form page (`/#/sales/create`)
- Generate a unique timestamp for test data

**Steps:**

1. Generate a timestamp: `Date.now()` (e.g., `1735225400000`)
2. Navigate to `/#/sales/create`
3. Wait for the form to load completely
4. Fill in "First Name" with: `RepTest`
5. Fill in "Last Name" with: `User[timestamp]` (e.g., `User1735225400000`)
6. Fill in "Email" with: `reptest-[timestamp]@example.com`
7. Click on the Role dropdown/select
8. Select "Rep" from the role options
9. Verify all required fields are filled
10. Click the "Save" or "Create" button
11. Wait for form submission and redirect
12. Verify redirect to team list page (`/#/sales`) or detail page

**Expected Results:**
- [ ] Form accepts all valid input values
- [ ] Rep role is selectable in the dropdown
- [ ] Form submits successfully
- [ ] Redirects to team list page after creation
- [ ] Newly created user appears in the team list
- [ ] User shows "Rep" role badge
- [ ] User shows "Active" status badge
- [ ] No RLS errors in console
- [ ] No React errors in console
- [ ] Success notification/message may appear

**Pass:** [ ] **Fail:** [ ]

---

### Test B11: Duplicate Email Prevented with Error

**Objective:** Verify that creating a user with an existing email address is prevented.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- Know an existing user's email (e.g., `admin@test.com`)
- On create form page (`/#/sales/create`)

**Steps:**

1. Navigate to `/#/sales/create`
2. Wait for the form to load completely
3. Fill in "First Name" with: `Duplicate`
4. Fill in "Last Name" with: `Test`
5. Fill in "Email" with an existing email: `admin@test.com`
6. Select a role from the Role dropdown (e.g., "Rep")
7. Click the "Save" or "Create" button
8. Wait for server response
9. Observe the error message that appears
10. Verify the form did NOT submit successfully
11. Check the console for error details
12. Verify the URL remains at `/#/sales/create`

**Expected Results:**
- [ ] Form attempts to submit
- [ ] Server returns duplicate email error
- [ ] Error message indicates email already exists
- [ ] Error message is user-friendly (not raw database error)
- [ ] Form remains on create page
- [ ] User is NOT created
- [ ] No 500 server errors (should be handled gracefully)
- [ ] Error message is visible and accessible

**Pass:** [ ] **Fail:** [ ]

---

## Section C: Edit Team Member (6 Tests)

### Test C1: Admin Can Edit Any User's Profile

**Objective:** Verify that an Admin can edit any team member's profile fields.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)
- At least one other user exists (e.g., manager@mfbroker.com)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Locate a team member other than Admin (e.g., the Manager user)
4. Click on the team member row or "Edit" action
5. Wait for the edit form/slide-over to open (40vw panel from right)
6. Observe the URL changes to include user ID (e.g., `?view=123` or `/sales/123`)
7. Locate the "First Name" field and note the current value
8. Change the "First Name" value (append "-Edited")
9. Locate the "Last Name" field and note the current value
10. Change the "Last Name" value (append "-Edited")
11. Click the "Save" button
12. Wait for save to complete and verify success

**Expected Results:**
- [ ] Clicking team member opens edit form/slide-over
- [ ] Edit form displays current user data
- [ ] First Name field is editable
- [ ] Last Name field is editable
- [ ] Save button is clickable
- [ ] Save completes without errors
- [ ] Updated values are reflected in the list
- [ ] No RLS errors in console
- [ ] No console errors during edit operation
- [ ] Slide-over closes after successful save (if applicable)

**Pass:** [ ] **Fail:** [ ]

---

### Test C2: Admin Can Edit Any User's Role

**Objective:** Verify that an Admin can change another team member's role.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)
- At least one Rep user exists

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Locate a team member with "Rep" role
4. Note the user's current role badge (should be "Rep")
5. Click on the team member row or "Edit" action
6. Wait for the edit form/slide-over to open
7. Locate the "Role" dropdown/select field
8. Verify the current selection is "Rep"
9. Click the Role dropdown to open options
10. Select "Manager" from the options
11. Click the "Save" button
12. Wait for save to complete
13. Return to team list and verify the role badge changed to "Manager"

**Expected Results:**
- [ ] Role dropdown is visible and editable for Admin
- [ ] Current role is correctly displayed
- [ ] Role options include Admin, Manager, Rep
- [ ] Changing role to "Manager" is accepted
- [ ] Save completes without errors
- [ ] Updated role badge shows "Manager" in list
- [ ] No RLS errors in console
- [ ] Role change persists after page refresh

**Pass:** [ ] **Fail:** [ ]

---

### Test C3: Manager Can Edit User Profiles (Not Roles)

**Objective:** Verify that a Manager can edit user profiles but cannot change roles.

**Prerequisites:**
- Logged out from Admin session
- DevTools Console tab open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Log in as Manager: `manager@mfbroker.com` / `password123`
3. Wait for redirect to dashboard
4. Navigate to `/#/sales` (team list)
5. Locate a team member (e.g., a Rep user)
6. Click on the team member to open edit form
7. Wait for the edit form to load
8. Locate the "First Name" field and verify it is editable
9. Locate the "Role" field and observe its state
10. Verify the Role field is EITHER disabled, hidden, or read-only
11. Try to change the role (if visible) - should not be allowed
12. Make a change to First Name (append "-ManagerEdit")
13. Click Save and verify the profile change is saved

**Expected Results:**
- [ ] Manager can access the edit form
- [ ] First Name field is editable for Manager
- [ ] Last Name field is editable for Manager
- [ ] Role field is NOT editable (disabled, hidden, or read-only)
- [ ] Profile changes can be saved
- [ ] Role remains unchanged after save
- [ ] No unauthorized access errors
- [ ] No console errors

**Pass:** [ ] **Fail:** [ ]

---

### Test C4: Rep Can Edit Own Profile Only

**Objective:** Verify that a Rep user can edit their own profile.

**Prerequisites:**
- Logged out from previous session
- DevTools Console tab open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Log in as Rep: `rep@mfbroker.com` / `password123`
3. Wait for redirect to dashboard
4. Navigate to `/#/sales` (team list) OR locate profile/settings link
5. Find the current user's entry (the Rep user)
6. Click to open the edit form for the current user
7. Wait for the edit form to load
8. Locate the "First Name" field
9. Change the First Name (append "-SelfEdit")
10. Locate the "Role" field and verify it is NOT editable
11. Click Save button
12. Wait for save to complete
13. Verify the change is saved successfully

**Expected Results:**
- [ ] Rep can access their own profile for editing
- [ ] First Name field is editable
- [ ] Last Name field is editable
- [ ] Role field is NOT editable (disabled, hidden, or read-only)
- [ ] Save completes successfully
- [ ] Changes are reflected in the list/profile
- [ ] No RLS errors in console
- [ ] No unauthorized access errors

**Pass:** [ ] **Fail:** [ ]

---

### Test C5: Rep Cannot Edit Another User's Profile

**Objective:** Verify that a Rep user cannot edit another team member's profile.

**Prerequisites:**
- Logged in as Rep (rep@mfbroker.com)
- On team list page (`/#/sales`)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Locate a team member OTHER than the current Rep user (e.g., Admin or Manager)
4. Try to click on the team member row
5. Observe if an edit form opens OR if access is blocked
6. If a form opens, try to make changes
7. Try to save any changes
8. Observe the result (should be blocked or error)
9. Check console for any error messages
10. Verify the other user's data was NOT modified
11. If direct URL access is attempted (e.g., `/#/sales/[admin-id]`)
12. Verify access is denied or redirected

**Expected Results:**
- [ ] Rep cannot open edit form for other users OR
- [ ] Rep sees read-only view of other users OR
- [ ] Edit button/action is hidden for other users
- [ ] If form opens, Save is disabled OR returns error
- [ ] Attempting to save changes is rejected
- [ ] Other user's data remains unchanged
- [ ] No RLS bypass (check console for "permission denied")
- [ ] Appropriate access control message shown

**Pass:** [ ] **Fail:** [ ]

---

### Test C6: Cancel Edit Discards Changes

**Objective:** Verify that canceling an edit discards unsaved changes.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Note the current First Name of a team member
4. Click on the team member to open edit form
5. Wait for the edit form to load
6. Change the "First Name" field to a new value (e.g., "CancelTest")
7. Change the "Last Name" field to a new value (e.g., "ShouldNotSave")
8. Do NOT click Save
9. Locate the "Cancel" button or close/X button
10. Click Cancel to close the form
11. Observe the slide-over/form closes
12. Look at the team member in the list
13. Verify the original name values are still displayed

**Expected Results:**
- [ ] Cancel button is visible and clickable
- [ ] Clicking Cancel closes the edit form/slide-over
- [ ] No API call is made to save changes (check Network tab)
- [ ] Original First Name value remains in list
- [ ] Original Last Name value remains in list
- [ ] Changes are completely discarded
- [ ] No console errors
- [ ] No "unsaved changes" prompt (or if prompted, confirm discard works)

**Pass:** [ ] **Fail:** [ ]

---

## Section D: Disable/Enable Team Member (4 Tests)

### Test D1: Admin Can Disable User Account

**Objective:** Verify that an Admin can disable a team member's account.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)
- At least one active Rep or Manager user exists (not Admin self)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Locate a team member with "Active" status (e.g., a Rep user)
4. Note the user's email for later verification
5. Click on the team member to open detail/edit view
6. Locate the "Disable" button or "Status" toggle
7. If status toggle, switch from "Active" to "Disabled"
8. If "Disable" button, click it
9. Confirm the disable action if a confirmation dialog appears
10. Wait for the operation to complete
11. Observe the user's status badge changes to "Disabled"
12. Return to the team list and verify status badge is updated

**Expected Results:**
- [ ] Disable button/toggle is visible for Admin
- [ ] Clicking Disable shows confirmation (recommended) or processes directly
- [ ] Operation completes without errors
- [ ] User's status changes to "Disabled"
- [ ] Status badge in list reflects "Disabled"
- [ ] Disabled user is visually distinct (grayed out, different badge color)
- [ ] No RLS errors in console
- [ ] Success notification may appear

**Pass:** [ ] **Fail:** [ ]

---

### Test D2: Disabled User Badge Shows in List

**Objective:** Verify that disabled users are visually identifiable in the team list.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- At least one disabled user exists (from Test D1)
- "Show disabled" filter is enabled

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Enable "Show disabled" toggle/filter (from Test A5)
4. Locate the disabled user in the list
5. Observe the status badge for the disabled user
6. Compare visually with an active user's status badge
7. Inspect the disabled badge element in DevTools
8. Verify the badge uses semantic color classes
9. Verify the disabled row may have reduced opacity or grayed styling
10. Verify the badge text clearly says "Disabled" (or equivalent)
11. Check that the badge is accessible (has proper contrast)
12. Verify screen reader can identify the disabled status

**Expected Results:**
- [ ] Disabled user appears in list when filter is enabled
- [ ] Status badge clearly shows "Disabled" text
- [ ] Disabled badge uses different color than Active badge
- [ ] Badge uses semantic colors (e.g., `bg-muted`, `text-muted-foreground`)
- [ ] Disabled row may have visual distinction (opacity, background)
- [ ] Badge has sufficient color contrast for readability
- [ ] Badge is accessible (aria-label or visible text)
- [ ] No hardcoded hex colors on badges

**Pass:** [ ] **Fail:** [ ]

---

### Test D3: Disabled User Cannot Login

**Objective:** Verify that a disabled user account cannot successfully log in.

**Prerequisites:**
- A user account has been disabled (from Test D1)
- Know the disabled user's email and password
- Logged out from current session

**Steps:**

1. Log out from the current session (Admin)
2. Navigate to `http://localhost:5173`
3. Wait for the login page to load
4. Enter the disabled user's email address
5. Enter the disabled user's password
6. Click the "Sign In" button
7. Wait for authentication response
8. Observe the result (should NOT log in successfully)
9. Look for an error message indicating account is disabled
10. Verify the user remains on the login page
11. Check the console for authentication error details
12. Verify no session was created (check cookies/local storage)

**Expected Results:**
- [ ] Login attempt does NOT succeed
- [ ] Error message is displayed to user
- [ ] Error message indicates account is disabled or deactivated
- [ ] User is NOT redirected to dashboard
- [ ] User remains on login page
- [ ] No session token is created
- [ ] Console shows authentication failure (not 500 error)
- [ ] Error message is user-friendly (not technical error)

**Pass:** [ ] **Fail:** [ ]

---

### Test D4: Admin Can Re-enable Disabled User

**Objective:** Verify that an Admin can re-enable a previously disabled user account.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- At least one disabled user exists
- On team list page (`/#/sales`)
- "Show disabled" filter is enabled

**Steps:**

1. Navigate to `/#/sales`
2. Enable "Show disabled" filter to see disabled users
3. Locate the disabled user in the list
4. Verify their status badge shows "Disabled"
5. Click on the disabled user to open detail/edit view
6. Locate the "Enable" button or "Status" toggle
7. If status toggle, switch from "Disabled" to "Active"
8. If "Enable" button, click it
9. Confirm the enable action if a confirmation dialog appears
10. Wait for the operation to complete
11. Observe the user's status badge changes to "Active"
12. Return to the team list and verify status badge is updated

**Expected Results:**
- [ ] Enable button/toggle is visible for disabled users
- [ ] Clicking Enable processes the action
- [ ] Operation completes without errors
- [ ] User's status changes to "Active"
- [ ] Status badge in list reflects "Active"
- [ ] User is no longer visually distinguished as disabled
- [ ] No RLS errors in console
- [ ] Success notification may appear
- [ ] Re-enabled user can now log in (verify separately if needed)

**Pass:** [ ] **Fail:** [ ]

---

## Section E: Delete Team Member - Admin Only (4 Tests)

### Test E1: Admin Sees Delete Button on User Detail

**Objective:** Verify that an Admin user can see the delete button on user detail view.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- On team list page (`/#/sales`)
- At least one deletable user exists (not the Admin's own account)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Locate a team member other than the current Admin
4. Click on the team member to open detail/edit view
5. Wait for the detail view to load completely
6. Look for a "Delete" button in the form/panel
7. The button may be in a toolbar, footer, or "More Actions" menu
8. Verify the Delete button is visible
9. Verify the Delete button has appropriate styling (destructive/danger)
10. Hover over the Delete button to see tooltip (if any)
11. Do NOT click Delete yet (just verify visibility)
12. Close the detail view

**Expected Results:**
- [ ] Delete button is visible to Admin
- [ ] Delete button uses destructive styling (red/danger colors)
- [ ] Delete button has appropriate label ("Delete", "Remove", trash icon)
- [ ] Button may be in a "More Actions" dropdown menu
- [ ] Button has appropriate touch target size (44x44px minimum)
- [ ] Button is not visible when viewing own Admin account (recommended)
- [ ] No console errors

**Pass:** [ ] **Fail:** [ ]

---

### Test E2: Manager Does Not See Delete Button

**Objective:** Verify that a Manager user cannot see the delete button.

**Prerequisites:**
- Logged out from Admin session
- DevTools Console tab open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Log in as Manager: `manager@mfbroker.com` / `password123`
3. Wait for redirect to dashboard
4. Navigate to `/#/sales` (team list)
5. Locate any team member in the list
6. Click on the team member to open detail view
7. Wait for the detail view to load completely
8. Search for a "Delete" button in the form/panel
9. Check the toolbar area for Delete button
10. Check any "More Actions" dropdown menus
11. Verify Delete button is NOT visible or NOT accessible
12. Close the detail view

**Expected Results:**
- [ ] Manager can open detail view
- [ ] Delete button is NOT visible to Manager
- [ ] If "More Actions" menu exists, it does NOT contain Delete
- [ ] No way for Manager to delete users via UI
- [ ] No console errors indicating hidden delete functionality
- [ ] Access control is enforced at UI level

**Pass:** [ ] **Fail:** [ ]

---

### Test E3: Rep Does Not See Delete Button

**Objective:** Verify that a Rep user cannot see the delete button.

**Prerequisites:**
- Logged out from previous session
- DevTools Console tab open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Log in as Rep: `rep@mfbroker.com` / `password123`
3. Wait for redirect to dashboard
4. Navigate to `/#/sales` (team list)
5. Locate any team member in the list (including self)
6. Click on a team member to open detail view
7. Wait for the detail view to load completely
8. Search for a "Delete" button in the form/panel
9. Check the toolbar area for Delete button
10. Check any "More Actions" dropdown menus
11. Verify Delete button is NOT visible or NOT accessible
12. Close the detail view

**Expected Results:**
- [ ] Rep can open detail view (at least for their own profile)
- [ ] Delete button is NOT visible to Rep
- [ ] If "More Actions" menu exists, it does NOT contain Delete
- [ ] No way for Rep to delete users via UI
- [ ] No console errors indicating hidden delete functionality
- [ ] Access control is enforced at UI level

**Pass:** [ ] **Fail:** [ ]

---

### Test E4: Delete with Confirmation Dialog

**Objective:** Verify that deleting a user requires confirmation and completes successfully.

**Prerequisites:**
- Logged in as Admin (admin@test.com)
- A deletable test user exists (create one in Test B10 if needed)
- Know the test user's name/email for identification
- On team list page (`/#/sales`)

**Steps:**

1. Navigate to `/#/sales`
2. Wait for the team list to load
3. Count the current number of team members
4. Locate the test user created for deletion (e.g., from Test B10)
5. Note the user's name and email
6. Click on the user to open detail view
7. Locate and click the "Delete" button
8. Wait for a confirmation dialog to appear
9. Read the confirmation message (should include user's name or identifier)
10. Click "Confirm" or "Delete" in the dialog
11. Wait for deletion to complete
12. Verify the user is removed from the team list
13. Verify the team member count decreased by 1

**Expected Results:**
- [ ] Clicking Delete opens a confirmation dialog
- [ ] Confirmation dialog is modal (focus trapped inside)
- [ ] Dialog clearly states which user will be deleted
- [ ] Dialog has "Cancel" and "Confirm/Delete" buttons
- [ ] Clicking Cancel closes dialog without deleting
- [ ] Clicking Confirm/Delete proceeds with deletion
- [ ] User is removed from the team list after confirmation
- [ ] Success notification may appear
- [ ] No RLS errors in console
- [ ] Deletion is permanent (user does not reappear)

**Pass:** [ ] **Fail:** [ ]

---

## Test Summary

### Section A: Team Member List View
| Test | Description | Pass | Fail |
|------|-------------|------|------|
| A1 | Admin sees all team members | [ ] | [ ] |
| A2 | List displays required columns | [ ] | [ ] |
| A3 | Sort by name column | [ ] | [ ] |
| A4 | Filter by role dropdown | [ ] | [ ] |
| A5 | Toggle show disabled filter | [ ] | [ ] |
| A6 | Search by name/email | [ ] | [ ] |

### Section B: Create Team Member - Admin Only
| Test | Description | Pass | Fail |
|------|-------------|------|------|
| B1 | Admin can access create form | [ ] | [ ] |
| B2 | Manager cannot access create | [ ] | [ ] |
| B3 | Rep cannot access create | [ ] | [ ] |
| B4 | Required validation - first_name | [ ] | [ ] |
| B5 | Required validation - last_name | [ ] | [ ] |
| B6 | Required validation - email | [ ] | [ ] |
| B7 | Email format validation | [ ] | [ ] |
| B8 | Create with Admin role | [ ] | [ ] |
| B9 | Create with Manager role | [ ] | [ ] |
| B10 | Create with Rep role | [ ] | [ ] |
| B11 | Duplicate email prevented | [ ] | [ ] |

### Section C: Edit Team Member
| Test | Description | Pass | Fail |
|------|-------------|------|------|
| C1 | Admin edit any profile | [ ] | [ ] |
| C2 | Admin edit any role | [ ] | [ ] |
| C3 | Manager edit profiles not roles | [ ] | [ ] |
| C4 | Rep edit own profile | [ ] | [ ] |
| C5 | Rep cannot edit others | [ ] | [ ] |
| C6 | Cancel discards changes | [ ] | [ ] |

### Section D: Disable/Enable Team Member
| Test | Description | Pass | Fail |
|------|-------------|------|------|
| D1 | Admin disable user | [ ] | [ ] |
| D2 | Disabled badge in list | [ ] | [ ] |
| D3 | Disabled user cannot login | [ ] | [ ] |
| D4 | Admin re-enable user | [ ] | [ ] |

### Section E: Delete Team Member - Admin Only
| Test | Description | Pass | Fail |
|------|-------------|------|------|
| E1 | Admin sees delete button | [ ] | [ ] |
| E2 | Manager no delete button | [ ] | [ ] |
| E3 | Rep no delete button | [ ] | [ ] |
| E4 | Delete with confirmation | [ ] | [ ] |

---

## Pass Criteria

**All 31 tests must pass** for team management testing to be considered successful.

**Critical Tests (Must Pass):**
- B2, B3: Role-based access control for create
- C3, C4, C5: Role-based access control for edit
- D3: Disabled user login prevention
- E2, E3: Role-based access control for delete

If any critical test fails:
1. Stop testing immediately
2. Document the security vulnerability
3. Report to development team as high priority
4. DO NOT proceed with remaining RBAC tests

---

## Console Error Monitoring

For all tests, monitor browser console for:

**RLS (Row-Level Security) Errors:**
- Pattern: Contains "policy", "RLS", "permission denied", "42501"
- Indicates database security policy violations
- Should NOT appear during authorized operations
- SHOULD appear when unauthorized access is attempted

**React Errors:**
- Pattern: Red error messages, stack traces
- Includes warnings about hooks, lifecycle, or rendering
- Should NOT appear in any test

**Network Errors:**
- 401: Unauthorized (expected for blocked access)
- 403: Forbidden (expected for blocked access)
- 500: Server error (should NOT appear)

---

## Notes

### Test Data Cleanup

After completing all tests, consider cleaning up test data:
- Users created in B8, B9, B10 may be deleted in E4
- Users disabled in D1 should be re-enabled in D4
- Or leave test data for subsequent test runs

### Slide-Over Behavior

Team management uses slide-over panels (40vw from right):
- URL pattern: `?view=[user-id]`
- Escape key should close slide-over
- Click outside may close slide-over
- Focus should trap within slide-over

### Role Hierarchy

Role permissions follow this hierarchy:
- **Admin:** Full access (create, edit all, edit roles, disable, delete)
- **Manager:** Read all, edit profiles (not roles)
- **Rep:** Read all, edit own profile only

### Accessibility Requirements

All form fields and buttons should meet accessibility standards:
- Labels connected to inputs (`for`/`id` or nested)
- Error messages with `role="alert"`
- Invalid inputs with `aria-invalid="true"`
- Focus visible on all interactive elements
- Touch targets 44x44px minimum
