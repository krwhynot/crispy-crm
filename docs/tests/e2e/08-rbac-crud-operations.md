# RBAC CRUD Operations - Manual E2E Test Checklist

Manual E2E testing checklist for Role-Based Access Control (RBAC) verification across all CRUD operations. This is **TEST 3** of the progressive 6-test RBAC suite.

## Prerequisites

**CRITICAL: Tests 1-2 of the RBAC suite must pass before running these tests.**

### Environment Setup
- **Browser:** Chrome (recommended), Firefox, or Safari
- **URL:** http://localhost:5173
- **DevTools:** Open Console tab (F12) for error monitoring throughout all tests

### Test Users
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Manager | manager@mfbroker.com | password123 |
| Rep | rep@mfbroker.com | password123 |

### Seed Data Requirements
Run `just seed-e2e` to ensure test data exists:
- Multiple contacts across different account managers
- Multiple opportunities with various assignments
- Tasks assigned to different users
- Organizations of various types

### Console Error Patterns to Monitor
Throughout all tests, watch for these error patterns:
- **RLS Errors:** "permission denied", "row-level security", "42501", "policy"
- **React Errors:** "Uncaught", "React", stack traces
- **Network Errors:** 403, 401, 500 status codes
- **Blocked Actions:** "not authorized", "access denied"

---

## Section A: Contacts RBAC Matrix

### Test A1: Admin - View All Contacts

**Objective:** Verify Admin role can view all contacts regardless of account manager assignment.

**Prerequisites:**
- [ ] Logged out of any existing session
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to http://localhost:5173
2. Clear browser console (right-click > Clear console)
3. Enter email: `admin@test.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for dashboard to load completely
7. Navigate to Contacts list via sidebar or URL: `/#/contacts`
8. Wait for the Contacts list to load completely
9. Observe the total count of contacts displayed (check list header or pagination)
10. Scroll through the list to verify multiple contacts are visible
11. Verify contacts from different account managers are visible
12. Check console for any RLS or permission errors

**Expected Results:**
- [ ] Login succeeds without errors
- [ ] Contacts list loads without errors
- [ ] All contacts are visible (not filtered by account manager)
- [ ] Contact count matches expected seed data count
- [ ] No RLS errors in console
- [ ] No "permission denied" errors in console

**Pass/Fail:** [ ]

---

### Test A2: Admin - Create Contact

**Objective:** Verify Admin role can create new contacts.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/contacts`
2. Clear browser console
3. Locate and click the "Create" or "Add" button
4. Wait for the create form to load at `/#/contacts/create`
5. Fill in First Name: `RBAC Test [Timestamp]`
6. Fill in Last Name: `Admin Created`
7. Fill in Email: `rbac.admin.[timestamp]@test.com`
8. Select an Organization from the autocomplete (search for "MFB")
9. Select Account Manager from dropdown
10. Click "Save" or "Save & Close" button
11. Wait for form submission to complete
12. Verify redirect to contacts list or detail view
13. Search for the newly created contact to confirm it exists

**Expected Results:**
- [ ] Create form loads without errors
- [ ] All form fields are editable
- [ ] Form submits successfully
- [ ] Contact is created and visible in the list
- [ ] No RLS errors in console
- [ ] No validation errors preventing submission

**Pass/Fail:** [ ]

---

### Test A3: Admin - Edit Any Contact

**Objective:** Verify Admin role can edit contacts regardless of account manager assignment.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] At least one contact exists that is NOT assigned to Admin

**Steps:**
1. Navigate to `/#/contacts`
2. Clear browser console
3. Locate a contact that is assigned to a different account manager (e.g., Rep or Manager)
4. Click on the contact row to open the slide-over or detail view
5. Locate the "Edit" button and click it
6. Wait for the edit form to load
7. Modify the Last Name field: append " - Admin Edited"
8. Verify all form fields are editable (not read-only)
9. Click "Save" button
10. Wait for save operation to complete
11. Verify the changes are reflected in the contact details
12. Check console for any errors during the edit process

**Expected Results:**
- [ ] Edit button is visible and clickable
- [ ] Edit form loads all contact data
- [ ] All fields are editable (not disabled)
- [ ] Save operation succeeds
- [ ] Changes are persisted and visible
- [ ] No RLS errors in console
- [ ] No "not authorized" errors

**Pass/Fail:** [ ]

---

### Test A4: Admin - Delete Contact

**Objective:** Verify Admin role can delete contacts (soft delete).

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test contact exists that can be deleted (from Test A2 or seed data)

**Steps:**
1. Navigate to `/#/contacts`
2. Clear browser console
3. Locate the contact created in Test A2 (or another deletable contact)
4. Click on the contact row to open the slide-over or detail view
5. Locate the "Delete" button (may be in a menu or toolbar)
6. Click the Delete button
7. Wait for confirmation dialog to appear
8. Confirm the deletion by clicking "Delete" or "Confirm"
9. Wait for the delete operation to complete
10. Verify the contact is no longer visible in the list
11. Verify no error messages appear
12. Check console for successful deletion (no RLS errors)

**Expected Results:**
- [ ] Delete button is visible to Admin
- [ ] Confirmation dialog appears
- [ ] Delete operation succeeds
- [ ] Contact is removed from the visible list
- [ ] No RLS errors in console
- [ ] No "permission denied" errors

**Pass/Fail:** [ ]

---

### Test A5: Manager - Delete Contact (Blocked)

**Objective:** Verify Manager role CANNOT delete contacts.

**Prerequisites:**
- [ ] Logged out of Admin session
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to http://localhost:5173
2. Clear browser console
3. Enter email: `manager@mfbroker.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for dashboard to load
7. Navigate to `/#/contacts`
8. Wait for contacts list to load
9. Click on any contact to open the slide-over or detail view
10. Search for a "Delete" button in the toolbar, menu, or actions area
11. If Delete button is visible, attempt to click it
12. Observe the result - should be blocked or hidden

**Expected Results:**
- [ ] Login succeeds as Manager
- [ ] Contacts list loads successfully
- [ ] Delete button is NOT visible OR
- [ ] Delete button is visible but disabled OR
- [ ] Clicking Delete shows "not authorized" error
- [ ] If attempted, RLS error may appear in console
- [ ] Contact is NOT deleted

**Pass/Fail:** [ ]

---

### Test A6: Rep - Delete Contact (Blocked)

**Objective:** Verify Rep role CANNOT delete contacts.

**Prerequisites:**
- [ ] Logged out of Manager session
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to http://localhost:5173
2. Clear browser console
3. Enter email: `rep@mfbroker.com`
4. Enter password: `password123`
5. Click "Sign In" button
6. Wait for dashboard to load
7. Navigate to `/#/contacts`
8. Wait for contacts list to load
9. Click on any contact to open the slide-over or detail view
10. Search for a "Delete" button in the toolbar, menu, or actions area
11. If Delete button is visible, attempt to click it
12. Observe the result - should be blocked or hidden

**Expected Results:**
- [ ] Login succeeds as Rep
- [ ] Contacts list loads successfully
- [ ] Delete button is NOT visible OR
- [ ] Delete button is visible but disabled OR
- [ ] Clicking Delete shows "not authorized" error
- [ ] If attempted, RLS error may appear in console
- [ ] Contact is NOT deleted

**Pass/Fail:** [ ]

---

## Section B: Opportunities RBAC Matrix

### Test B1: Admin - View All Opportunities

**Objective:** Verify Admin role can view all opportunities regardless of assignment.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Wait for opportunities list to load completely
4. Observe the total count of opportunities displayed
5. Scroll through the list or use pagination to view all opportunities
6. Verify opportunities assigned to different account managers are visible
7. Check for opportunities in various pipeline stages
8. Click on several opportunities to verify detail views load
9. Check for RLS errors in console during navigation
10. Verify no opportunities appear to be hidden or filtered

**Expected Results:**
- [ ] Opportunities list loads without errors
- [ ] All opportunities are visible (not filtered by assignment)
- [ ] Opportunities from all account managers appear
- [ ] All pipeline stages are accessible
- [ ] Detail views load without RLS errors
- [ ] No "permission denied" errors in console

**Pass/Fail:** [ ]

---

### Test B2: Admin - Create Opportunity (Any Assignment)

**Objective:** Verify Admin role can create opportunities and assign them to any account manager.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Click the "Create" or "Add" button
4. Wait for create form to load at `/#/opportunities/create`
5. Fill in Opportunity Name: `RBAC Test Opp [Timestamp]`
6. Select a Customer Organization from the autocomplete
7. Select a Principal from the dropdown
8. Select Account Manager: Choose "Rep" (NOT Admin) to test cross-assignment
9. Set Expected Revenue if required
10. Set Expected Close Date if required
11. Click "Save" or "Save & Close"
12. Wait for submission to complete
13. Verify the opportunity appears in the list with correct assignment

**Expected Results:**
- [ ] Create form loads without errors
- [ ] All account managers are available in dropdown
- [ ] Can assign opportunity to any account manager (not just self)
- [ ] Form submits successfully
- [ ] Opportunity is created with correct assignment
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B3: Admin - Edit Any Opportunity

**Objective:** Verify Admin role can edit opportunities regardless of assignment.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] At least one opportunity exists assigned to Rep or Manager

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Locate an opportunity assigned to Rep (from Test B2 or seed data)
4. Click on the opportunity to open slide-over or detail view
5. Click the "Edit" button
6. Wait for edit form to load
7. Modify the Opportunity Name: append " - Admin Edit"
8. Verify Account Manager dropdown is editable
9. Optionally change the pipeline stage
10. Click "Save" button
11. Wait for save to complete
12. Verify changes are reflected in the detail view

**Expected Results:**
- [ ] Edit button is visible and clickable
- [ ] Edit form loads with all data
- [ ] All fields are editable including Account Manager
- [ ] Save operation succeeds
- [ ] Changes persist correctly
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B4: Admin - Delete Opportunity

**Objective:** Verify Admin role can delete opportunities (soft delete).

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test opportunity exists that can be deleted

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Locate the opportunity created in Test B2 (or another deletable opportunity)
4. Click on the opportunity to open slide-over or detail view
5. Locate the "Delete" button
6. Click the Delete button
7. Wait for confirmation dialog
8. Confirm the deletion
9. Wait for delete operation to complete
10. Verify the opportunity is no longer in the list
11. Check console for any errors

**Expected Results:**
- [ ] Delete button is visible to Admin
- [ ] Confirmation dialog appears
- [ ] Delete operation succeeds
- [ ] Opportunity is removed from visible list
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B5: Manager - Edit Any Opportunity

**Objective:** Verify Manager role can edit any opportunity.

**Prerequisites:**
- [ ] Logged in as manager@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Verify opportunities list shows opportunities from all account managers
4. Locate an opportunity assigned to Rep (not Manager)
5. Click on the opportunity to open slide-over or detail view
6. Click the "Edit" button
7. Wait for edit form to load
8. Modify a field (e.g., Notes or Expected Revenue)
9. Click "Save" button
10. Wait for save operation to complete
11. Verify changes are persisted
12. Check console for any permission errors

**Expected Results:**
- [ ] Manager can view all opportunities
- [ ] Edit button is visible for opportunities assigned to others
- [ ] Edit form loads successfully
- [ ] Save operation succeeds
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B6: Manager - Delete Opportunity (Blocked)

**Objective:** Verify Manager role CANNOT delete opportunities.

**Prerequisites:**
- [ ] Logged in as manager@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Click on any opportunity to open slide-over or detail view
4. Search for a "Delete" button in the toolbar, menu, or actions area
5. Note whether Delete button is visible
6. If visible, note whether it is enabled or disabled
7. If enabled, attempt to click it
8. Observe the result
9. Check console for any errors
10. Verify the opportunity still exists in the list

**Expected Results:**
- [ ] Delete button is NOT visible OR
- [ ] Delete button is visible but disabled OR
- [ ] Clicking Delete shows error or is blocked
- [ ] Opportunity is NOT deleted
- [ ] May see "not authorized" message or RLS error in console

**Pass/Fail:** [ ]

---

### Test B7: Rep - Edit Own Opportunity

**Objective:** Verify Rep role can edit opportunities assigned to themselves.

**Prerequisites:**
- [ ] Logged in as rep@mfbroker.com
- [ ] Console tab open and cleared
- [ ] At least one opportunity is assigned to Rep

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Observe the opportunities list - should show Rep's assigned opportunities
4. Locate an opportunity assigned to Rep
5. Click on the opportunity to open slide-over or detail view
6. Click the "Edit" button
7. Wait for edit form to load
8. Modify a field (e.g., Notes: "Rep edit test [timestamp]")
9. Click "Save" button
10. Wait for save operation to complete
11. Verify changes are persisted
12. Check console for any errors

**Expected Results:**
- [ ] Rep's assigned opportunities are visible
- [ ] Edit button is visible for own opportunities
- [ ] Edit form loads successfully
- [ ] Save operation succeeds
- [ ] Changes persist correctly
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test B8: Rep - Edit Other's Opportunity (Blocked)

**Objective:** Verify Rep role CANNOT edit opportunities assigned to others.

**Prerequisites:**
- [ ] Logged in as rep@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/opportunities`
2. Clear browser console
3. Check if opportunities assigned to Admin or Manager are visible in the list
4. If other users' opportunities are visible:
   - Click on an opportunity assigned to Admin or Manager
   - Look for an "Edit" button
   - Note whether Edit is visible/enabled
   - If visible and enabled, attempt to click it
5. If other users' opportunities are NOT visible:
   - This is expected RLS behavior - document that opportunities are properly filtered
6. If you can open an edit form, attempt to make changes and save
7. Observe the result - should fail with RLS error
8. Check console for permission errors

**Expected Results:**
- [ ] Other users' opportunities are not visible in list (RLS filtering) OR
- [ ] Other users' opportunities visible but Edit button hidden/disabled OR
- [ ] Edit attempt fails with RLS/permission error
- [ ] Console shows RLS error if edit was attempted
- [ ] No changes are persisted to other users' opportunities

**Pass/Fail:** [ ]

---

## Section C: Tasks RBAC Matrix

### Test C1: Admin - Edit Any Task

**Objective:** Verify Admin role can edit tasks regardless of assignment.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] Navigate to Tasks view (may be `/#/tasks` or a task panel)

**Steps:**
1. Navigate to the Tasks view or panel
2. Clear browser console
3. Locate tasks from different users (Admin, Manager, Rep)
4. Click on a task assigned to Rep or Manager
5. Look for an "Edit" button or inline edit capability
6. Click to edit the task
7. Modify the task description or due date
8. Save the changes
9. Verify changes are persisted
10. Repeat for a task assigned to a different user
11. Check console for any RLS errors

**Expected Results:**
- [ ] All users' tasks are visible to Admin
- [ ] Edit functionality is available for all tasks
- [ ] Changes save successfully
- [ ] No RLS errors in console
- [ ] Admin can edit tasks regardless of assignee

**Pass/Fail:** [ ]

---

### Test C2: Admin - Delete Task

**Objective:** Verify Admin role can delete tasks.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test task exists that can be deleted

**Steps:**
1. Navigate to the Tasks view or panel
2. Clear browser console
3. Locate a task that can be deleted
4. Look for a "Delete" button or action
5. Click the Delete button
6. Confirm the deletion if prompted
7. Wait for delete operation to complete
8. Verify the task is removed from the list
9. Check console for any errors
10. Verify no RLS errors occurred

**Expected Results:**
- [ ] Delete button is visible to Admin
- [ ] Delete confirmation works
- [ ] Task is removed from the list
- [ ] No RLS errors in console
- [ ] Delete operation completes successfully

**Pass/Fail:** [ ]

---

### Test C3: Manager - Edit Any Task

**Objective:** Verify Manager role can edit any task.

**Prerequisites:**
- [ ] Logged in as manager@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to the Tasks view or panel
2. Clear browser console
3. Check if tasks from all users are visible
4. Locate a task assigned to Rep (not Manager)
5. Click to edit the task
6. Modify the task description or status
7. Save the changes
8. Verify changes are persisted
9. Locate a task assigned to Admin
10. Attempt to edit that task as well
11. Check console for any RLS errors

**Expected Results:**
- [ ] Manager can view tasks from all users
- [ ] Edit functionality works for other users' tasks
- [ ] Changes save successfully
- [ ] No RLS errors in console
- [ ] Manager can edit any task

**Pass/Fail:** [ ]

---

### Test C4: Manager - Delete Task (Blocked)

**Objective:** Verify Manager role CANNOT delete tasks.

**Prerequisites:**
- [ ] Logged in as manager@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to the Tasks view or panel
2. Clear browser console
3. Click on any task to select or open it
4. Look for a "Delete" button or action
5. Note whether Delete is visible
6. If visible, note whether it is enabled
7. If enabled, attempt to click it
8. Observe the result
9. Check console for permission errors
10. Verify the task still exists

**Expected Results:**
- [ ] Delete button is NOT visible OR
- [ ] Delete button is visible but disabled OR
- [ ] Delete attempt is blocked with error
- [ ] Task is NOT deleted
- [ ] Console may show "not authorized" or RLS error

**Pass/Fail:** [ ]

---

### Test C5: Rep - Edit Own Task

**Objective:** Verify Rep role can edit tasks assigned to themselves.

**Prerequisites:**
- [ ] Logged in as rep@mfbroker.com
- [ ] Console tab open and cleared
- [ ] At least one task is assigned to Rep

**Steps:**
1. Navigate to the Tasks view or panel
2. Clear browser console
3. Observe which tasks are visible (may be filtered to own tasks)
4. Locate a task assigned to Rep
5. Click to edit the task
6. Modify the task description: "Rep edit test [timestamp]"
7. Change the status or due date if applicable
8. Save the changes
9. Verify changes are persisted
10. Check console for any errors

**Expected Results:**
- [ ] Rep's own tasks are visible
- [ ] Edit functionality works for own tasks
- [ ] Changes save successfully
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test C6: Rep - Edit Other's Task (Blocked)

**Objective:** Verify Rep role CANNOT edit tasks assigned to others.

**Prerequisites:**
- [ ] Logged in as rep@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to the Tasks view or panel
2. Clear browser console
3. Check if tasks assigned to Admin or Manager are visible
4. If other users' tasks are visible:
   - Click on a task assigned to Admin or Manager
   - Look for an "Edit" button or edit capability
   - Note whether Edit is available
   - If available, attempt to edit and save
5. If other users' tasks are NOT visible:
   - This is expected RLS behavior - document this
6. Observe the result of any edit attempt
7. Check console for permission or RLS errors
8. Verify no changes were persisted to other users' tasks

**Expected Results:**
- [ ] Other users' tasks are not visible (RLS filtering) OR
- [ ] Other users' tasks visible but Edit is blocked OR
- [ ] Edit attempt fails with RLS error
- [ ] Console shows permission error if edit was attempted
- [ ] No changes persisted to other users' tasks

**Pass/Fail:** [ ]

---

## Section D: Organizations RBAC Matrix

### Test D1: Admin - View All Organizations

**Objective:** Verify Admin role can view all organizations.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/organizations`
2. Clear browser console
3. Wait for organizations list to load completely
4. Observe the total count of organizations
5. Scroll through the list to view all organizations
6. Verify organizations of all types are visible (Principal, Distributor, Customer)
7. Click on several organizations to verify detail views load
8. Check for any filtering that might hide organizations
9. Verify no RLS errors in console
10. Compare count with expected seed data

**Expected Results:**
- [ ] Organizations list loads without errors
- [ ] All organization types are visible
- [ ] No organizations are hidden
- [ ] Detail views load correctly
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test D2: Admin - Create Organization

**Objective:** Verify Admin role can create new organizations.

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/organizations`
2. Clear browser console
3. Click the "Create" or "Add" button
4. Wait for create form to load at `/#/organizations/create`
5. Fill in Organization Name: `RBAC Test Org [Timestamp]`
6. Select Organization Type: "Customer"
7. Fill in Website: `https://rbac-test.example.com`
8. Add any other required fields
9. Click "Create Organization" or "Save" button
10. Handle duplicate dialog if shown (click "Proceed Anyway")
11. Verify redirect to organization list or detail view
12. Search for the newly created organization

**Expected Results:**
- [ ] Create form loads without errors
- [ ] All fields are editable
- [ ] Form submits successfully
- [ ] Organization is created and visible
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test D3: Admin - Delete Organization

**Objective:** Verify Admin role can delete organizations (soft delete).

**Prerequisites:**
- [ ] Logged in as admin@test.com
- [ ] Console tab open and cleared
- [ ] A test organization exists that can be deleted (from Test D2)

**Steps:**
1. Navigate to `/#/organizations`
2. Clear browser console
3. Locate the organization created in Test D2
4. Click on the organization to open slide-over or detail view
5. Locate the "Delete" button
6. Click the Delete button
7. Wait for confirmation dialog
8. Confirm the deletion
9. Wait for delete operation to complete
10. Verify the organization is no longer in the list
11. Check console for any errors

**Expected Results:**
- [ ] Delete button is visible to Admin
- [ ] Confirmation dialog appears
- [ ] Delete operation succeeds
- [ ] Organization is removed from visible list
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test D4: Manager - Delete Organization (Blocked)

**Objective:** Verify Manager role CANNOT delete organizations.

**Prerequisites:**
- [ ] Logged in as manager@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/organizations`
2. Clear browser console
3. Wait for organizations list to load
4. Click on any organization to open slide-over or detail view
5. Search for a "Delete" button in the toolbar, menu, or actions area
6. Note whether Delete button is visible
7. If visible, note whether it is enabled or disabled
8. If enabled, attempt to click it
9. Observe the result
10. Check console for any permission errors
11. Verify the organization still exists

**Expected Results:**
- [ ] Delete button is NOT visible OR
- [ ] Delete button is visible but disabled OR
- [ ] Delete attempt is blocked with error
- [ ] Organization is NOT deleted
- [ ] Console may show RLS or permission error

**Pass/Fail:** [ ]

---

### Test D5: Rep - Edit Organization

**Objective:** Verify Rep role can edit organizations.

**Prerequisites:**
- [ ] Logged in as rep@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/organizations`
2. Clear browser console
3. Wait for organizations list to load
4. Click on any organization to open slide-over or detail view
5. Locate and click the "Edit" button
6. Wait for edit form to load
7. Modify a field (e.g., Notes or Description)
8. Click "Save" button
9. Wait for save operation to complete
10. Verify changes are persisted
11. Check console for any errors

**Expected Results:**
- [ ] Edit button is visible for Rep
- [ ] Edit form loads successfully
- [ ] Save operation succeeds
- [ ] Changes persist correctly
- [ ] No RLS errors in console

**Pass/Fail:** [ ]

---

### Test D6: Rep - Delete Organization (Blocked)

**Objective:** Verify Rep role CANNOT delete organizations.

**Prerequisites:**
- [ ] Logged in as rep@mfbroker.com
- [ ] Console tab open and cleared

**Steps:**
1. Navigate to `/#/organizations`
2. Clear browser console
3. Click on any organization to open slide-over or detail view
4. Search for a "Delete" button in the toolbar, menu, or actions area
5. Note whether Delete button is visible
6. If visible, note whether it is enabled
7. If enabled, attempt to click it
8. Observe the result
9. Check console for any permission errors
10. Verify the organization still exists

**Expected Results:**
- [ ] Delete button is NOT visible OR
- [ ] Delete button is visible but disabled OR
- [ ] Delete attempt is blocked with error
- [ ] Organization is NOT deleted
- [ ] Console may show RLS or permission error

**Pass/Fail:** [ ]

---

## Summary: RBAC CRUD Matrix

### Contacts

| Test | Role | Operation | Expected | Pass/Fail |
|------|------|-----------|----------|-----------|
| A1 | Admin | View all contacts | Success - All visible | [ ] |
| A2 | Admin | Create contact | Success | [ ] |
| A3 | Admin | Edit any contact | Success | [ ] |
| A4 | Admin | Delete contact | Success | [ ] |
| A5 | Manager | Delete contact | Blocked | [ ] |
| A6 | Rep | Delete contact | Blocked | [ ] |

### Opportunities

| Test | Role | Operation | Expected | Pass/Fail |
|------|------|-----------|----------|-----------|
| B1 | Admin | View all opportunities | Success - All visible | [ ] |
| B2 | Admin | Create (any assignment) | Success | [ ] |
| B3 | Admin | Edit any opportunity | Success | [ ] |
| B4 | Admin | Delete opportunity | Success | [ ] |
| B5 | Manager | Edit any opportunity | Success | [ ] |
| B6 | Manager | Delete opportunity | Blocked | [ ] |
| B7 | Rep | Edit own opportunity | Success | [ ] |
| B8 | Rep | Edit other's opportunity | Blocked | [ ] |

### Tasks

| Test | Role | Operation | Expected | Pass/Fail |
|------|------|-----------|----------|-----------|
| C1 | Admin | Edit any task | Success | [ ] |
| C2 | Admin | Delete task | Success | [ ] |
| C3 | Manager | Edit any task | Success | [ ] |
| C4 | Manager | Delete task | Blocked | [ ] |
| C5 | Rep | Edit own task | Success | [ ] |
| C6 | Rep | Edit other's task | Blocked | [ ] |

### Organizations

| Test | Role | Operation | Expected | Pass/Fail |
|------|------|-----------|----------|-----------|
| D1 | Admin | View all organizations | Success - All visible | [ ] |
| D2 | Admin | Create organization | Success | [ ] |
| D3 | Admin | Delete organization | Success | [ ] |
| D4 | Manager | Delete organization | Blocked | [ ] |
| D5 | Rep | Edit organization | Success | [ ] |
| D6 | Rep | Delete organization | Blocked | [ ] |

---

## Pass Criteria

**All 26 tests must pass** for RBAC CRUD Operations to be considered successful.

### Critical Failures

The following failures indicate serious security issues:
- Any "Blocked" test that succeeds (permission bypass)
- RLS errors on operations that should succeed
- Users able to delete when they should not be able to

### Acceptable Results

- "Blocked" can manifest as: button hidden, button disabled, or action produces error
- RLS errors in console for blocked operations are acceptable (indicates RLS working)
- 403/401 HTTP errors for blocked operations are acceptable

---

## Troubleshooting

### If Login Fails
1. Verify seed data was loaded: `just seed-e2e`
2. Check Supabase is running: `just dev` or `supabase status`
3. Verify user credentials in seed data

### If RLS Errors Appear on Allowed Operations
1. Check user role assignment in `user_roles` table
2. Verify RLS policies are correctly configured
3. Check for stale authentication tokens (logout and re-login)

### If Delete Button Never Appears
1. Verify component renders delete action
2. Check if delete is behind a menu or dropdown
3. Review component code for role-based rendering

### If Blocked Operations Succeed
1. **CRITICAL SECURITY ISSUE** - Document immediately
2. Check RLS policy configuration
3. Verify role-based UI guards in component code
4. Review data provider access controls

---

## Notes

### Console Error Monitoring
For all tests, keep the browser console open and watch for:
- **RLS Errors:** "permission denied", "row-level security", "42501"
- **React Errors:** Red error messages, stack traces
- **Network Errors:** 403, 401, 500 status codes

### Test Data Cleanup
- Tests create data with "RBAC Test" prefix
- Clean up test data after completing the test suite
- Use `just seed-e2e` to reset to known state if needed

### Role Hierarchy
- **Admin:** Full access to all operations
- **Manager:** Can view/edit all, cannot delete
- **Rep:** Can only edit own data, cannot delete

### Blocked Operation Verification
When testing "Blocked" operations, verify by one of:
1. **Button Hidden:** Delete button not rendered
2. **Button Disabled:** Delete button visible but not clickable
3. **Error Response:** Clicking produces error message
4. **RLS Error:** Console shows database permission error
