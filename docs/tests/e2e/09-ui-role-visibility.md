# UI Role Visibility Manual E2E Tests

Manual E2E testing checklist for UI role visibility and conditional rendering based on user roles. This is **TEST 4** of a progressive 6-test RBAC suite.

## Prerequisites

**CRITICAL: Tests 1-3 of the RBAC suite must pass before running these tests.**

- RBAC Test 1: Authentication & Session (must pass)
- RBAC Test 2: Route Access Control (must pass)
- RBAC Test 3: Data Filtering by Role (must pass)

If any prerequisite test fails, **DO NOT proceed** with UI Role Visibility tests until resolved.

---

## Test Environment Setup

- **Browser:** Chrome, Firefox, or Safari
- **URL:** http://localhost:5173
- **DevTools:** Console tab open to monitor for errors

### Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Manager | manager@mfbroker.com | password123 |
| Rep | rep@mfbroker.com | password123 |

### Key Routes

| Resource | Route |
|----------|-------|
| Settings | `/#/settings` |
| Team (Sales Reps) | `/#/sales` |
| Contacts | `/#/contacts` |
| Organizations | `/#/organizations` |
| Opportunities | `/#/opportunities` |

---

## Section A: Navigation & Menus

### Test A1: Admin Sees Settings > Team Menu Item

**Goal:** Verify that Admin users can see and access the Team management section in Settings.

**Prerequisites:**
- Clear browser cache and cookies
- Ensure no prior session exists
- DevTools Console open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for the login page to load completely
3. Verify email input field is visible and empty
4. Verify password input field is visible and empty
5. Enter email: `admin@test.com`
6. Enter password: `password123`
7. Click the "Sign In" button
8. Wait for authentication to complete (watch for redirect)
9. Verify redirect to dashboard (`/#/` or `/#/dashboard`)
10. Navigate to Settings by clicking Settings in sidebar or going to `/#/settings`
11. Wait for Settings page to load completely
12. Look for navigation tabs or menu items within Settings
13. Locate "Team" or "Sales Team" tab/section
14. Click on the Team tab/section
15. Verify Team management content loads

**Expected Results:**

- [ ] Login completes without errors
- [ ] Settings page loads without console errors
- [ ] "Team" tab/section is visible in Settings navigation
- [ ] Clicking Team tab shows team management content
- [ ] Team list shows user records (sales reps)
- [ ] No RLS or permission errors in console
- [ ] No "Access Denied" or "Unauthorized" messages

**Console Monitoring:**
Watch for errors containing:
- "permission denied"
- "RLS"
- "unauthorized"
- "42501" (PostgreSQL permission error)

---

### Test A2: Admin Sees Settings > Audit Log Menu Item

**Goal:** Verify that Admin users can see and access the Audit Log or Activity Log section in Settings.

**Prerequisites:**
- Logged in as Admin (from Test A1 or fresh login)
- DevTools Console open

**Steps:**

1. If not already logged in, navigate to `http://localhost:5173`
2. Clear any existing session (optional: open incognito window)
3. Enter email: `admin@test.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for dashboard to load
7. Navigate to Settings page (`/#/settings`)
8. Wait for Settings page to load completely
9. Examine all visible tabs, sections, or menu items in Settings
10. Look for any of these labels: "Activity Log", "Audit Log", "History", "Logs"
11. Note which audit-related options are visible
12. If found, click on the audit/activity log section
13. Verify audit log content loads
14. Check for list of activities, actions, or events
15. Verify no access errors in console

**Expected Results:**

- [ ] Settings page loads without errors
- [ ] Audit Log or Activity Log section is visible
- [ ] Section is clickable/navigable
- [ ] Audit content displays (if section exists)
- [ ] No permission errors in console
- [ ] No blank or error states in audit section

**Note:** If Audit Log is not implemented yet, document as "Not Implemented" rather than a failure.

---

### Test A3: Manager Does NOT See Team/Audit in Settings

**Goal:** Verify that Manager users cannot see Admin-only sections (Team, Audit Log) in Settings.

**Prerequisites:**
- Clear browser cache and cookies OR use incognito window
- No prior session
- DevTools Console open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for login page to load
3. Verify login form is displayed (not auto-logged in)
4. Enter email: `manager@mfbroker.com`
5. Enter password: `password123`
6. Click "Sign In" button
7. Wait for authentication to complete
8. Verify redirect to dashboard
9. Confirm user is logged in (check for user name or avatar in header)
10. Navigate to Settings page (`/#/settings`)
11. Wait for Settings page to load completely
12. Examine all visible tabs, sections, and menu items
13. Search for "Team" or "Sales Team" section
14. Search for "Audit Log" or "Activity Log" section
15. Document all sections that ARE visible to Manager

**Expected Results:**

- [ ] Login as Manager succeeds
- [ ] Settings page loads without errors
- [ ] "Team" section is NOT visible in Settings
- [ ] "Audit Log" / "Activity Log" section is NOT visible
- [ ] No navigation item leads to `/#/sales` from Settings
- [ ] Manager sees only profile/preference sections appropriate for their role
- [ ] No console errors indicating hidden sections exist

**Verify by Checking Navigation:**
- List all visible tabs/sections
- Compare to Admin's view from Test A1
- Team and Audit sections should be absent

**Additional Verification:**

1. Open DevTools > Network tab
2. Refresh the Settings page
3. Check that no API calls are made to `/sales` or `/audit` endpoints
4. Verify no hidden elements with Admin-only content loaded

---

### Test A4: Rep Does NOT See Team/Audit in Settings

**Goal:** Verify that Rep users cannot see Admin-only sections (Team, Audit Log) in Settings.

**Prerequisites:**
- Clear browser cache and cookies OR use incognito window
- No prior session
- DevTools Console open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for login page to load completely
3. Verify login form is displayed
4. Enter email: `rep@mfbroker.com`
5. Enter password: `password123`
6. Click "Sign In" button
7. Wait for authentication to complete
8. Verify redirect to dashboard (`/#/` or `/#/dashboard`)
9. Confirm user is logged in as Rep (check user identifier in UI)
10. Navigate to Settings page (`/#/settings`)
11. Wait for Settings page to load completely
12. Examine all visible tabs and navigation items within Settings
13. Search for "Team" or "Sales Team" option
14. Search for "Audit Log", "Activity Log", or "History" option
15. Document all sections visible to Rep role

**Expected Results:**

- [ ] Login as Rep succeeds
- [ ] Settings page loads without errors
- [ ] "Team" section is NOT visible
- [ ] "Audit Log" / "Activity Log" section is NOT visible
- [ ] Rep sees only personal profile sections
- [ ] No links or buttons navigate to Admin-only routes
- [ ] No console errors or permission warnings

**Cross-Reference:**

| Section | Admin (A1) | Manager (A3) | Rep (A4) |
|---------|------------|--------------|----------|
| Team | Visible | NOT Visible | NOT Visible |
| Audit Log | Visible* | NOT Visible | NOT Visible |
| Profile | Visible | Visible | Visible |

*If implemented

---

## Section B: Action Buttons

### Test B1: Admin Sees Delete Buttons on Records

**Goal:** Verify that Admin users can see Delete buttons/actions on records.

**Prerequisites:**
- Logged in as Admin OR fresh login
- At least one contact record exists in the system
- DevTools Console open

**Steps:**

1. If not logged in, navigate to `http://localhost:5173`
2. Enter email: `admin@test.com`
3. Enter password: `password123`
4. Click "Sign In" and wait for dashboard
5. Navigate to Contacts list page (`/#/contacts`)
6. Wait for contacts list to load completely
7. Verify at least one contact appears in the list
8. Click on the first contact row to open detail/edit view
9. Wait for contact detail panel or page to load
10. Look for action buttons in the toolbar or header area
11. Specifically search for "Delete" button or trash icon
12. Note the location and appearance of the Delete button
13. Verify Delete button is clickable (not disabled)
14. DO NOT click Delete (we're only verifying visibility)
15. Check for delete option in any "More Actions" or dropdown menu

**Expected Results:**

- [ ] Contacts list loads successfully
- [ ] Contact detail view opens
- [ ] "Delete" button OR delete icon is visible
- [ ] Delete action is in toolbar, header, or action menu
- [ ] Button is NOT grayed out or disabled
- [ ] Hovering over button shows "Delete" tooltip (if applicable)
- [ ] No console errors when viewing contact

**Visual Check:**
Look for:
- Red/destructive colored button with "Delete" text
- Trash can icon in action bar
- "Delete" option in dropdown menu (three dots / kebab menu)

---

### Test B2: Manager Does NOT See Delete Buttons

**Goal:** Verify that Manager users cannot see Delete buttons on records.

**Prerequisites:**
- Clear browser session OR use incognito window
- At least one contact record exists
- DevTools Console open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for login page to load
3. Enter email: `manager@mfbroker.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for dashboard to load
7. Verify logged in as Manager (check user identifier)
8. Navigate to Contacts list page (`/#/contacts`)
9. Wait for contacts list to load completely
10. Click on a contact row to open detail view
11. Wait for contact detail/edit panel to load
12. Examine all toolbar buttons and action areas
13. Search for any "Delete" button or trash icon
14. Check any "More Actions" or dropdown menus
15. Document all action buttons that ARE visible to Manager

**Expected Results:**

- [ ] Login as Manager succeeds
- [ ] Contacts list loads without errors
- [ ] Contact detail view opens
- [ ] "Delete" button is NOT visible in toolbar
- [ ] "Delete" option is NOT in any dropdown menu
- [ ] No trash icon visible in action areas
- [ ] Edit/Save buttons may still be visible (that's expected)
- [ ] No console errors or permission warnings

**Alternative Acceptable States:**
- Delete button exists but is disabled/grayed out with no hover action
- Delete button exists but shows "Permission denied" on click

Document which alternative applies if Delete button is visible but non-functional.

---

### Test B3: Rep Does NOT See Delete Buttons

**Goal:** Verify that Rep users cannot see Delete buttons on records.

**Prerequisites:**
- Clear browser session OR use incognito window
- Rep user must have access to at least one contact
- DevTools Console open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Wait for login page to load
3. Enter email: `rep@mfbroker.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for authentication and dashboard redirect
7. Verify logged in as Rep user
8. Navigate to Contacts list page (`/#/contacts`)
9. Wait for contacts list to load
10. Note: Rep may only see contacts they own - this is expected
11. Click on a contact to open detail view
12. Wait for detail panel to load completely
13. Examine toolbar and action button areas
14. Search for "Delete" button or trash icon
15. Check any dropdown or "More Actions" menus

**Expected Results:**

- [ ] Login as Rep succeeds
- [ ] Contacts list loads (possibly filtered to Rep's contacts only)
- [ ] Contact detail view opens
- [ ] "Delete" button is NOT visible
- [ ] "Delete" option is NOT in any menu
- [ ] No trash/delete icons in action areas
- [ ] Rep can still see Edit/View actions (if permitted)
- [ ] No console errors

**Comparison Table:**

| Action | Admin (B1) | Manager (B2) | Rep (B3) |
|--------|------------|--------------|----------|
| Delete Contact | Visible | NOT Visible | NOT Visible |
| Edit Contact | Visible | Visible | Visible* |
| View Contact | Visible | Visible | Visible* |

*May be limited to own records only

---

### Test B4: Admin Sees Bulk Action Options

**Goal:** Verify that Admin users can access bulk action functionality on list views.

**Prerequisites:**
- Logged in as Admin
- Multiple records exist in the system
- DevTools Console open

**Steps:**

1. If not logged in, login as `admin@test.com` / `password123`
2. Navigate to Contacts list page (`/#/contacts`)
3. Wait for the list to load completely
4. Look for row selection checkboxes in the list
5. If no checkboxes visible, look for multi-select mode button
6. Click the checkbox on the first row to select it
7. Click the checkbox on the second row (multi-select)
8. Observe the UI for bulk action toolbar or menu appearing
9. Look for bulk action options like: "Delete Selected", "Export", "Assign"
10. Note all available bulk actions
11. Check if "Delete" is among the bulk actions
12. DO NOT execute bulk delete (testing visibility only)
13. Deselect records by clicking checkboxes again
14. Verify bulk action toolbar disappears when nothing selected
15. Repeat on Organizations list (`/#/organizations`) if time permits

**Expected Results:**

- [ ] Row selection checkboxes are visible (or selection mode exists)
- [ ] Multiple rows can be selected simultaneously
- [ ] Bulk action toolbar/menu appears when records selected
- [ ] "Delete" or "Delete Selected" bulk action is visible
- [ ] Bulk actions include at least one of: Delete, Export, Assign
- [ ] Toolbar disappears when no records selected
- [ ] No console errors during selection

**Bulk Actions to Look For:**
- Delete Selected
- Export to CSV/Excel
- Assign to User
- Change Status
- Merge Records

---

## Section C: Form Fields

### Test C1: Admin Sees Editable Role Dropdown on Team Edit

**Goal:** Verify that Admin users can view and modify user roles in the Team management section.

**Prerequisites:**
- Logged in as Admin
- At least one team member exists besides Admin
- DevTools Console open

**Steps:**

1. If not logged in, login as `admin@test.com` / `password123`
2. Navigate to Team management page (`/#/sales`)
3. Wait for team list to load completely
4. Verify multiple team members are displayed
5. Click on a team member row (NOT the Admin user - select Manager or Rep)
6. Wait for team member detail/edit panel to open
7. Look for a "Permissions" tab or section
8. If tabs exist, click on "Permissions" tab
9. Wait for Permissions content to load
10. Look for "Role" field (dropdown/select)
11. Verify the Role field displays current role (e.g., "Manager" or "Rep")
12. Click on the Role dropdown to open options
13. Verify multiple role options appear (Admin, Manager, Rep)
14. Verify dropdown is interactive (not disabled)
15. DO NOT change the role (testing visibility only)
16. Click elsewhere to close dropdown without saving

**Expected Results:**

- [ ] Team list page loads at `/#/sales`
- [ ] Team member detail opens when clicked
- [ ] "Permissions" tab or section exists
- [ ] "Role" dropdown/select field is visible
- [ ] Role field shows current user role
- [ ] Dropdown opens and shows role options
- [ ] Dropdown is NOT disabled or grayed out
- [ ] Admin can interact with the dropdown
- [ ] Role options include: Admin, Manager, Rep (or similar)
- [ ] No console errors

**Note:** The exact UI may vary (dropdown, radio buttons, select). Document the actual implementation.

---

### Test C2: Non-Admin Sees Role Field Disabled/Hidden

**Goal:** Verify that non-Admin users cannot modify roles (field is disabled or hidden).

**Prerequisites:**
- Clear browser session
- DevTools Console open

**Steps:**

1. Navigate to `http://localhost:5173`
2. Login as Manager: `manager@mfbroker.com` / `password123`
3. Wait for dashboard to load
4. Attempt to access Team page directly by navigating to `/#/sales`
5. Document what happens:
   - If redirected: Note where you're redirected to
   - If access denied: Note the error message
   - If page loads: Continue to step 6
6. If Team page loads, click on your own user profile
7. Look for "Permissions" tab or section
8. If Permissions exists, examine the Role field
9. Check if Role field is:
   - Hidden entirely (not rendered)
   - Visible but disabled (grayed out, not clickable)
   - Visible but read-only (displays value, no edit control)
10. Attempt to interact with Role field (if visible)
11. Document the behavior

**Expected Results:**

One of these outcomes is acceptable:

**Option A - Route Blocked:**
- [ ] Navigating to `/#/sales` is blocked or redirected
- [ ] No Team page access for Manager role

**Option B - Field Hidden:**
- [ ] Team page loads but Role field is NOT visible
- [ ] No way to change role through UI

**Option C - Field Disabled:**
- [ ] Role field is visible but disabled/grayed out
- [ ] Clicking Role field has no effect
- [ ] Dropdown does not open
- [ ] Field is clearly marked as read-only

**Not Acceptable:**
- Manager can access AND modify role dropdown

---

### Test C3: Account Manager Dropdown Shows Only Active Users

**Goal:** Verify that the Account Manager dropdown on opportunities shows only active (non-disabled) users.

**Prerequisites:**
- Logged in as any user (Admin, Manager, or Rep)
- System should have both active and inactive/disabled users
- DevTools Console open

**Steps:**

1. Login with any test user (e.g., `admin@test.com` / `password123`)
2. Navigate to Opportunities list (`/#/opportunities`)
3. Wait for opportunities list to load
4. Click "Create" or "Add New" button to create a new opportunity
   - OR click on existing opportunity to edit
5. Wait for opportunity form to load completely
6. Locate the "Account Manager" field (dropdown/combobox)
7. Click on Account Manager field to open dropdown
8. Wait for user list to load in dropdown
9. Examine all options shown in the dropdown
10. Note down all visible user names
11. Verify that disabled or inactive users are NOT shown
12. Cross-reference with Admin's Team list (if you have access)
13. Close dropdown without selecting
14. Navigate back to list or cancel form

**Expected Results:**

- [ ] Account Manager dropdown is visible
- [ ] Dropdown opens and shows user options
- [ ] Only active users appear in the dropdown
- [ ] Disabled/deactivated users do NOT appear
- [ ] Users with `is_active = false` are filtered out
- [ ] Dropdown loads without errors
- [ ] No console errors during interaction

**Verification (Admin only):**
If logged in as Admin:
1. Navigate to `/#/sales` (Team page)
2. Note any disabled users (inactive status)
3. Return to opportunity form
4. Confirm disabled users are not in Account Manager dropdown

**Known Users for Cross-Reference:**

| User | Role | Expected in Dropdown |
|------|------|---------------------|
| Admin | Admin | Yes (if active) |
| Manager | Manager | Yes (if active) |
| Rep | Rep | Yes (if active) |
| [Disabled User] | Any | NO |

---

## Summary Checklist

### Section A: Navigation & Menus (4 tests)
- [ ] A1: Admin sees Settings > Team menu item
- [ ] A2: Admin sees Settings > Audit Log menu item
- [ ] A3: Manager does NOT see Team/Audit in Settings
- [ ] A4: Rep does NOT see Team/Audit in Settings

### Section B: Action Buttons (4 tests)
- [ ] B1: Admin sees Delete buttons on records
- [ ] B2: Manager does NOT see Delete buttons
- [ ] B3: Rep does NOT see Delete buttons
- [ ] B4: Admin sees bulk action options

### Section C: Form Fields (3 tests)
- [ ] C1: Admin sees editable Role dropdown on team edit
- [ ] C2: Non-admin sees Role field disabled/hidden
- [ ] C3: Account Manager dropdown shows only active users

---

## Pass Criteria

**All 11 tests must pass** for UI Role Visibility testing to be considered successful.

### Critical Failures
These failures BLOCK proceeding to RBAC Test 5:
- Admin cannot access Team management
- Non-admin users can see Delete buttons
- Non-admin users can modify user roles
- Inactive users appear in Account Manager dropdown

### Non-Critical Issues
Document but allow proceeding:
- UI inconsistencies (button placement, styling)
- Missing Audit Log (if not implemented yet)
- Minor visual differences between roles

---

## Console Error Monitoring

For all tests, watch browser console for:

**Permission Errors (Critical):**
- `"permission denied"`
- `"RLS"`
- `"42501"` (PostgreSQL permission error)
- `"unauthorized"`
- `"forbidden"`

**React Errors (Serious):**
- `"Uncaught Error"`
- `"Invalid hook call"`
- `"Cannot read property of undefined"`

**Network Errors (Note):**
- 401 Unauthorized
- 403 Forbidden
- 500 Internal Server Error

---

## Troubleshooting

### Problem: Cannot login with test users
**Solution:** Verify seed data is loaded. Run `just seed-e2e` to populate test users.

### Problem: Settings page has no tabs
**Solution:** Settings may use different navigation (sidebar, sections). Document actual layout.

### Problem: Delete button never appears for Admin
**Solution:**
1. Check if soft-delete is used (button may say "Archive")
2. Check if delete is in a dropdown menu
3. Verify Admin role is properly assigned

### Problem: Team page not found (`/#/sales`)
**Solution:**
1. Check sidebar navigation for actual Team link
2. Verify route exists in application
3. Document actual route if different

### Problem: Account Manager dropdown is empty
**Solution:**
1. Verify users exist in database
2. Check RLS policies on sales table
3. Verify API returns user data

---

## Notes

### Role Hierarchy
```
Admin > Manager > Rep
```
- Admin: Full access to all features and records
- Manager: Access to team data, no delete, no role management
- Rep: Access to own records only, limited actions

### Security Considerations
- UI hiding is NOT sufficient security - server-side checks are required
- These tests verify UI correctly reflects server permissions
- Actual permission enforcement is tested in RBAC Tests 1-3

### Test Data Dependencies
- Seed data must include all three test users
- At least one contact, organization, and opportunity must exist
- Users should have various active/inactive states for C3

---

## Reporting Issues

When reporting UI Role Visibility issues, include:

1. **Test ID:** (e.g., B2: Manager Delete Button)
2. **User Role:** Which user was logged in
3. **Expected:** What should have happened
4. **Actual:** What actually happened
5. **Screenshot:** Capture of the UI
6. **Console:** Any error messages
7. **Route:** Current URL

**Example Issue Report:**
```
Test: B2 - Manager does NOT see Delete buttons
Role: Manager (manager@mfbroker.com)
Expected: Delete button should be hidden or disabled
Actual: Delete button is visible and clickable
Screenshot: [attached]
Console: No errors
Route: /#/contacts/123

SEVERITY: HIGH - Security violation
ACTION: Investigate permission checking in ContactShow component
```
