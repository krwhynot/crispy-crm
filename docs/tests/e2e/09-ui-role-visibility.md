# UI Role Visibility Manual Testing Checklist

Manual E2E testing checklist for verifying role-based UI element visibility. This is TEST 4 of a progressive 6-test RBAC suite.

## Prerequisites

**Required:** Tests 1-3 of the RBAC suite must pass before running these tests.

- [ ] Test 1: Authentication & Session passed
- [ ] Test 2: Route Access Control passed
- [ ] Test 3: Data Visibility passed

**Environment Setup:**
- **Browser:** Chrome, Firefox, or Safari
- **URL:** http://localhost:5173
- **DevTools:** Open Console tab (F12) to monitor for errors

**Test Users:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Manager | manager@mfbroker.com | password123 |
| Rep | rep@mfbroker.com | password123 |

---

## Section A: Navigation & Menus

### Test A1: Admin Sees "Team" Menu Item in Settings

**Objective:** Verify that admin users can see and access the Team management section in Settings.

**Preconditions:**
- User is logged out or in a fresh browser session
- Console is clear of errors

**Steps:**

1. Navigate to http://localhost:5173
2. Wait for the login page to fully load
3. Enter email: `admin@test.com`
4. Enter password: `password123`
5. Click the "Sign In" button
6. Wait for redirect to complete (dashboard should load)
7. Navigate to Settings by clicking the user avatar/menu in the header
8. Select "Settings" from the dropdown menu
9. Wait for the Settings page to fully load at `/#/settings`
10. Examine the left sidebar or tab navigation for available sections
11. Locate the "Team" tab/section (with Users icon)
12. Click on the "Team" tab/section
13. Wait for the redirect to `/#/sales` (Team management page)
14. Verify the Team management interface is displayed

**Expected Results:**

- [ ] Login completes successfully (no errors in console)
- [ ] Settings page loads at `/#/settings`
- [ ] "Team" tab/section is visible in the Settings navigation
- [ ] Team tab shows a Users icon (group of people)
- [ ] Clicking Team redirects to `/#/sales`
- [ ] Team management interface displays list of users
- [ ] No console errors during navigation

**Console Monitoring:**
- Watch for RLS errors: "permission denied", "policy violation"
- Watch for React errors: component rendering issues
- Watch for 401/403 status codes

---

### Test A2: Admin Sees "Activity Log" Menu Item in Settings

**Objective:** Verify that admin users can see and access the Activity Log (audit trail) section in Settings.

**Preconditions:**
- User is logged in as admin@test.com
- Currently on Settings page or navigating from dashboard

**Steps:**

1. Ensure you are logged in as admin@test.com
2. If not on Settings, click user avatar/menu in the header
3. Select "Settings" from the dropdown menu
4. Wait for the Settings page to fully load at `/#/settings`
5. Examine the left sidebar or tab navigation for available sections
6. Locate the "Activity Log" tab/section (with History/clock icon)
7. Click on the "Activity Log" tab/section
8. Wait for the Activity Log section content to load
9. Verify the Activity Log interface is displayed
10. Examine the audit entries displayed (recent changes with timestamps)
11. Verify entries show table name, field name, old value, and new value
12. Scroll through the activity log to confirm data loads

**Expected Results:**

- [ ] Settings page loads at `/#/settings`
- [ ] "Activity Log" tab/section is visible in the Settings navigation
- [ ] Activity Log tab shows a History icon (clock with arrow)
- [ ] Clicking Activity Log shows the audit trail content
- [ ] Activity Log displays recent database changes
- [ ] Each entry shows: table name badge, field name, timestamp, old/new values
- [ ] ScrollArea allows browsing through entries
- [ ] No console errors or RLS violations

**Console Monitoring:**
- Watch for "audit_trail" query errors
- Watch for permission denied on audit_trail table

---

### Test A3: Manager Does NOT See Team/Audit in Settings

**Objective:** Verify that manager-role users cannot see admin-only sections (Team, Activity Log) in Settings.

**Preconditions:**
- Fresh browser session or logged out from previous test
- Console is clear of errors

**Steps:**

1. Navigate to http://localhost:5173
2. If already logged in, log out by clicking user menu and "Sign Out"
3. Wait for the login page to fully load
4. Enter email: `manager@mfbroker.com`
5. Enter password: `password123`
6. Click the "Sign In" button
7. Wait for redirect to complete (dashboard should load)
8. Navigate to Settings by clicking the user avatar/menu in the header
9. Select "Settings" from the dropdown menu
10. Wait for the Settings page to fully load at `/#/settings`
11. Examine the left sidebar or tab navigation for available sections
12. Look for the presence of "Team" tab/section
13. Look for the presence of "Activity Log" tab/section
14. Verify only Personal, Notifications, and Security sections are visible
15. Attempt to directly navigate to `/#/sales` (Team management)
16. Document the result of direct navigation attempt

**Expected Results:**

- [ ] Login as manager completes successfully
- [ ] Settings page loads at `/#/settings`
- [ ] "Team" tab/section is NOT visible in the navigation
- [ ] "Activity Log" tab/section is NOT visible in the navigation
- [ ] Only visible sections: Personal, Notifications, Security
- [ ] No empty spaces or broken UI where admin sections would be
- [ ] Direct navigation to `/#/sales` shows team list (accessible route)
- [ ] No console errors indicating hidden elements or permission issues

**Notes:**
- The `/sales` route may still be accessible but Team SETTINGS tab should be hidden
- This test verifies UI visibility, not route protection (covered in Test 2)

---

### Test A4: Rep Does NOT See Team/Audit in Settings

**Objective:** Verify that rep-role users cannot see admin-only sections (Team, Activity Log) in Settings.

**Preconditions:**
- Fresh browser session or logged out from previous test
- Console is clear of errors

**Steps:**

1. Navigate to http://localhost:5173
2. If already logged in, log out by clicking user menu and "Sign Out"
3. Wait for the login page to fully load
4. Enter email: `rep@mfbroker.com`
5. Enter password: `password123`
6. Click the "Sign In" button
7. Wait for redirect to complete (dashboard should load)
8. Navigate to Settings by clicking the user avatar/menu in the header
9. Select "Settings" from the dropdown menu
10. Wait for the Settings page to fully load at `/#/settings`
11. Examine the left sidebar or tab navigation for available sections
12. Look for the presence of "Team" tab/section
13. Look for the presence of "Activity Log" tab/section
14. Count the total number of visible sections
15. Verify only Personal, Notifications, and Security sections are visible

**Expected Results:**

- [ ] Login as rep completes successfully
- [ ] Settings page loads at `/#/settings`
- [ ] "Team" tab/section is NOT visible in the navigation
- [ ] "Activity Log" tab/section is NOT visible in the navigation
- [ ] Exactly 3 sections visible: Personal, Notifications, Security
- [ ] Settings layout is clean with no gaps or placeholder elements
- [ ] No JavaScript errors about undefined role or permissions
- [ ] No console errors during navigation

---

## Section B: Action Buttons

### Test B1: Admin Sees Delete/Remove Button on Team Members

**Objective:** Verify that admin users can see the "Remove User" button when viewing other team members.

**Preconditions:**
- Logged in as admin@test.com
- At least one other user exists in the system (manager or rep)

**Steps:**

1. Ensure you are logged in as admin@test.com
2. Navigate to `/#/sales` (Team management page)
3. Wait for the team member list to load
4. Locate a team member that is NOT the current admin user (e.g., manager@mfbroker.com)
5. Click on that team member row to open the slide-over panel
6. Wait for the slide-over to fully load with user details
7. Navigate to the "Permissions" tab in the slide-over
8. Scroll down to the bottom of the Permissions tab content
9. Look for a "Danger Zone" section with red/destructive styling
10. Verify "Remove User" button is visible within the Danger Zone
11. Hover over the button to confirm it is interactive
12. Click the "Remove User" button to verify confirmation dialog appears
13. Click "Cancel" in the confirmation dialog to abort removal

**Expected Results:**

- [ ] Team list loads at `/#/sales`
- [ ] Clicking a team member opens the slide-over panel
- [ ] Permissions tab is visible and accessible
- [ ] "Danger Zone" section is visible at bottom of Permissions tab
- [ ] "Remove User" button is visible with destructive styling (red)
- [ ] Button has Trash icon next to text
- [ ] Clicking button opens AlertDialog confirmation
- [ ] Dialog shows user's name and email for confirmation
- [ ] Cancel button closes dialog without removing user
- [ ] No console errors during interaction

**Important Notes:**
- Admin should NOT see Remove button when viewing their own account
- The button sets `deleted_at` (soft delete), not permanent deletion

---

### Test B2: Manager Does NOT See Delete/Remove Button

**Objective:** Verify that manager-role users cannot see the "Remove User" button when viewing team members.

**Preconditions:**
- Logged in as manager@mfbroker.com
- Team member list is accessible

**Steps:**

1. Ensure you are logged in as manager@mfbroker.com
2. Navigate to `/#/sales` (Team management page)
3. Wait for the team member list to load
4. Locate any team member in the list (including admin or other reps)
5. Click on that team member row to open the slide-over panel
6. Wait for the slide-over to fully load with user details
7. Navigate to the "Permissions" tab in the slide-over
8. Scroll through the entire Permissions tab content
9. Look for any "Danger Zone" section
10. Look for any "Remove User" or "Delete" buttons
11. Verify no destructive actions are available on this tab
12. Check the slide-over footer for any delete actions

**Expected Results:**

- [ ] Team list loads at `/#/sales`
- [ ] Slide-over opens when clicking a team member
- [ ] Permissions tab content is visible
- [ ] NO "Danger Zone" section is present
- [ ] NO "Remove User" button is visible anywhere
- [ ] NO destructive action buttons appear in the panel
- [ ] Manager can only view, not modify permissions (role dropdown may be visible but disabled)
- [ ] No console errors or hidden element references

---

### Test B3: Rep Does NOT See Delete/Remove Button

**Objective:** Verify that rep-role users cannot see the "Remove User" button when viewing team members.

**Preconditions:**
- Logged in as rep@mfbroker.com
- Team member list is accessible

**Steps:**

1. Ensure you are logged in as rep@mfbroker.com
2. Navigate to `/#/sales` (Team management page)
3. Wait for the team member list to load
4. Locate any team member in the list (including admin or manager)
5. Click on that team member row to open the slide-over panel
6. Wait for the slide-over to fully load with user details
7. Navigate to the "Permissions" tab in the slide-over
8. Scroll through the entire Permissions tab content
9. Look for any "Danger Zone" section
10. Look for any "Remove User" or "Delete" buttons
11. Examine all tabs in the slide-over for destructive actions
12. Check the slide-over header and footer areas for delete options

**Expected Results:**

- [ ] Team list loads at `/#/sales`
- [ ] Slide-over opens when clicking a team member
- [ ] Permissions tab is visible (may be read-only)
- [ ] NO "Danger Zone" section is present
- [ ] NO "Remove User" button is visible anywhere
- [ ] NO "Delete" buttons in header, footer, or any tab
- [ ] Rep sees view-only permissions information
- [ ] No console errors during navigation

---

### Test B4: Admin Sees Bulk Action Options

**Objective:** Verify that admin users can see bulk action options when selecting multiple records in list views.

**Preconditions:**
- Logged in as admin@test.com
- Records exist in the Organizations or Contacts list

**Steps:**

1. Ensure you are logged in as admin@test.com
2. Navigate to `/#/organizations` (Organizations list)
3. Wait for the list to fully load with data
4. Locate the row selection checkboxes (leftmost column)
5. Click the checkbox on the first organization row
6. Wait for the bulk actions toolbar to appear at the bottom
7. Click the checkbox on a second organization row
8. Verify the toolbar shows count of selected items (e.g., "2 rows selected")
9. Examine the bulk actions toolbar for available options
10. Look for "Export" button/option
11. Look for "Delete" button/option (if implemented for admin)
12. Click the X button in the toolbar to deselect all
13. Verify toolbar disappears when no items are selected

**Expected Results:**

- [ ] Organizations list loads at `/#/organizations`
- [ ] Row checkboxes are visible in the leftmost column
- [ ] Selecting a row makes the bulk actions toolbar appear
- [ ] Toolbar shows selected count: "N rows selected"
- [ ] Export button is visible in the toolbar
- [ ] Delete button is visible (if role-restricted bulk delete is implemented)
- [ ] X button is visible to clear selection
- [ ] Clicking X deselects all and hides toolbar
- [ ] No console errors during bulk action interactions

**Notes:**
- Bulk delete may be admin-only or may not be implemented yet
- Focus is on verifying the toolbar appears and shows actions

---

## Section C: Form Fields

### Test C1: Admin Sees Editable Role Dropdown on Team Edit

**Objective:** Verify that admin users can see and interact with the Role dropdown when editing team members.

**Preconditions:**
- Logged in as admin@test.com
- At least one other user exists (not the admin's own account)

**Steps:**

1. Ensure you are logged in as admin@test.com
2. Navigate to `/#/sales` (Team management page)
3. Wait for the team member list to load
4. Locate a team member that is NOT the current admin (e.g., rep@mfbroker.com)
5. Click on that team member row to open the slide-over panel
6. Wait for the slide-over to fully load
7. Navigate to the "Permissions" tab
8. Click the "Edit" button in the slide-over header (if in view mode)
9. Wait for edit mode to activate
10. Locate the "Role" field with dropdown selector
11. Click on the Role dropdown to open it
12. Verify all three role options are visible: Rep, Manager, Admin
13. Select "Manager" from the dropdown (do not save)
14. Verify the selection is reflected in the dropdown value
15. Click "Cancel" or close the slide-over to discard changes

**Expected Results:**

- [ ] Team list loads at `/#/sales`
- [ ] Slide-over opens with user details
- [ ] Permissions tab shows Role field
- [ ] Edit mode is accessible (Edit button works)
- [ ] Role dropdown is visible and enabled (not disabled)
- [ ] Dropdown opens when clicked
- [ ] Three options displayed: Rep, Manager, Admin
- [ ] Role selection can be changed
- [ ] Dropdown is NOT greyed out or readonly
- [ ] No console errors when interacting with dropdown

**Additional Verification:**
- Role dropdown should be DISABLED when viewing own account
- Warning message should appear when editing own permissions

---

### Test C2: Non-Admin Sees Role Field Disabled/Hidden

**Objective:** Verify that non-admin users cannot modify role assignments.

**Preconditions:**
- Fresh browser session
- Logged in as manager@mfbroker.com

**Steps:**

1. Ensure you are logged in as manager@mfbroker.com
2. Navigate to `/#/sales` (Team management page)
3. Wait for the team member list to load
4. Click on any team member (including self) to open slide-over
5. Wait for the slide-over to fully load
6. Navigate to the "Permissions" tab
7. Look for the "Role" field display
8. Check if there is an "Edit" button in the slide-over header
9. If Edit button exists, click it to enter edit mode
10. Examine the Role field in edit mode
11. Check if Role dropdown is disabled (greyed out, not clickable)
12. Check if Role field is hidden entirely
13. Attempt to click on the Role field/dropdown
14. Document whether interaction is prevented

**Expected Results:**

- [ ] Slide-over opens with user details
- [ ] Permissions tab shows role information
- [ ] In view mode: Role is displayed as read-only badge
- [ ] In edit mode (if available): Role dropdown is DISABLED
- [ ] Manager cannot change role values
- [ ] No error messages about insufficient permissions
- [ ] UI clearly indicates role cannot be modified
- [ ] No console errors when attempting to interact

**Alternative Expected Behavior:**
- Edit button may not be visible for managers on Permissions tab
- Entire Permissions tab may be read-only for managers

---

### Test C3: Account Manager Dropdown Shows Only Active Users

**Objective:** Verify that Account Manager dropdowns in forms only show active (non-disabled) users.

**Preconditions:**
- Logged in as any user (admin, manager, or rep)
- At least one active user exists in the system
- Ideally, one disabled user exists to verify filtering

**Steps:**

1. Ensure you are logged in (any role)
2. Navigate to `/#/opportunities/create` (New Opportunity form)
3. Wait for the create form to fully load
4. Locate the "Account Manager" field (may be labeled "Sales Rep" or similar)
5. Click on the Account Manager dropdown/combobox to open it
6. Wait for the dropdown options to load
7. Scroll through all available options in the dropdown
8. Note the names of all users displayed
9. Look for any users that should be disabled
10. Verify no disabled users appear in the list
11. Select an active user from the dropdown
12. Verify the selection is applied correctly
13. Navigate to `/#/contacts/create` and repeat for Contact form
14. Verify Account Manager dropdown behaves the same way

**Expected Results:**

- [ ] Opportunity create form loads at `/#/opportunities/create`
- [ ] Account Manager field is visible with dropdown
- [ ] Dropdown opens and shows user options
- [ ] Only ACTIVE users are displayed in the dropdown
- [ ] NO disabled users appear (users with disabled=true)
- [ ] Selection works correctly
- [ ] Contact create form shows same behavior
- [ ] Dropdown displays user names clearly
- [ ] No console errors during dropdown interaction

**Verification Note:**
If no disabled users exist in test data, this test primarily verifies the dropdown functions correctly. To fully test filtering, seed a disabled user first.

**How to Verify a User is Disabled:**
1. Login as admin
2. Navigate to `/#/sales`
3. Find a user and check Permissions tab for "Account Status: Disabled"

---

## Pass Criteria

### Section A: Navigation & Menus
- [ ] A1: Admin sees Team menu item
- [ ] A2: Admin sees Activity Log menu item
- [ ] A3: Manager does NOT see Team/Audit
- [ ] A4: Rep does NOT see Team/Audit

### Section B: Action Buttons
- [ ] B1: Admin sees Delete/Remove button
- [ ] B2: Manager does NOT see Delete button
- [ ] B3: Rep does NOT see Delete button
- [ ] B4: Admin sees bulk action options

### Section C: Form Fields
- [ ] C1: Admin sees editable Role dropdown
- [ ] C2: Non-admin sees Role disabled/hidden
- [ ] C3: Account Manager shows only active users

**All 11 tests must pass** for UI Role Visibility tests to be considered successful.

---

## Failure Handling

If any test fails:

1. **Document the specific failure:**
   - Test ID (e.g., A1, B2, C3)
   - Expected behavior
   - Actual behavior observed
   - Screenshot of the UI state

2. **Capture debugging information:**
   - Console errors (copy full text)
   - Network requests (status codes, failed requests)
   - Current URL

3. **Check for common issues:**
   - Role not propagating after login (check identity cache)
   - Stale UI state (try hard refresh Ctrl+Shift+R)
   - RLS policy violations in console

4. **DO NOT proceed with subsequent RBAC tests** until all UI Role Visibility tests pass

---

## Key Routes Reference

| Route | Description |
|-------|-------------|
| `/#/settings` | Settings page with role-conditional sections |
| `/#/sales` | Team management list |
| `/#/contacts` | Contacts list |
| `/#/contacts/create` | Contact create form |
| `/#/organizations` | Organizations list |
| `/#/opportunities/create` | Opportunity create form |

---

## Role-Based UI Summary

| UI Element | Admin | Manager | Rep |
|------------|-------|---------|-----|
| Settings > Team | Visible | Hidden | Hidden |
| Settings > Activity Log | Visible | Hidden | Hidden |
| Remove User button | Visible (on others) | Hidden | Hidden |
| Role dropdown (edit) | Enabled | Disabled | Disabled |
| Bulk actions | Full access | Limited | Limited |
| Account Manager dropdown | Active users only | Active users only | Active users only |

---

## Notes

### Console Error Monitoring

For all tests, monitor browser console for:

**RLS (Row Level Security) Errors:**
- Pattern: Contains "policy", "RLS", or "permission denied"
- Indicates database security policy violations
- Should NOT appear in any visibility test

**React Errors:**
- Pattern: Red error messages, stack traces
- May indicate role-conditional rendering issues
- Should NOT appear during normal navigation

### Role Propagation

User role is fetched from identity on login. If role-based UI is not appearing correctly:

1. Check `identity.role` value in React DevTools
2. Try logging out and back in
3. Clear browser storage and retry

### Test Independence

Each test in this suite can be run independently, but:
- All tests assume seed data is present
- Tests A1-A4 can be run in any order
- Tests B1-B4 can be run in any order
- Tests C1-C3 can be run in any order
