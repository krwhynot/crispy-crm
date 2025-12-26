# RBAC CRUD Operations - Manual E2E Testing Checklist

Comprehensive testing of Role-Based Access Control (RBAC) for Create, Read, Update, and Delete operations across all major entities.

## Prerequisites

**IMPORTANT:** This is TEST 3 of a progressive 6-test RBAC suite. Prerequisites: Tests 1-2 must pass.

### Test Environment

- **Browser:** Chrome, Firefox, or Safari with DevTools enabled
- **URL:** http://localhost:5173
- **DevTools:** Console tab open, filter set to show errors and warnings

### Test Users

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@test.com | password123 | Full access to all operations |
| Manager | manager@mfbroker.com | password123 | View all, edit all, no delete |
| Rep | rep@mfbroker.com | password123 | Own records only |

### Seed Data Requirements

Run `just seed-e2e` before testing to ensure:
- All test users exist with correct roles
- Sample contacts, organizations, opportunities, and tasks exist
- Rep user has at least one owned opportunity and task
- Records exist that are NOT owned by Rep user (for cross-user access tests)

### Session Management

Between role switches:
1. Navigate to user menu (top-right avatar/name)
2. Click "Sign Out" or "Logout"
3. Clear browser localStorage: `localStorage.clear()` in console
4. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
5. Log in with new test user credentials

---

## Section A: Contacts RBAC Matrix

### Test A1: Admin - View All Contacts

**Objective:** Verify Admin can view all contacts regardless of ownership.

**Steps:**

1. Open browser DevTools (F12) and navigate to Console tab
2. Navigate to http://localhost:5173
3. Log in as Admin (admin@test.com / password123)
4. Wait for dashboard to load completely
5. Navigate to Contacts list: `/#/contacts`
6. Wait for the DataGrid to fully render
7. Observe the total record count displayed (usually near pagination)
8. Scroll through the contact list to verify records are visible
9. Click on any contact row to view details
10. Verify the contact details panel/page loads without errors
11. Return to the contacts list
12. Use column filters or search to find a specific contact
13. Verify search results display correctly
14. Check Console for any RLS or permission errors

**Expected Results:**

- [ ] Contacts list loads without errors
- [ ] All contacts are visible (count matches database)
- [ ] Contact details are accessible
- [ ] Search/filter functionality works
- [ ] No "permission denied" errors in Console
- [ ] No RLS policy violations in Console
- [ ] No 403 or 401 HTTP responses in Network tab

**Pass:** [ ] **Fail:** [ ]

---

### Test A2: Admin - Create Contact

**Objective:** Verify Admin can create a new contact.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Contacts list: `/#/contacts`
3. Locate and click the "Create" or "+" button
4. Verify navigation to `/#/contacts/create`
5. Fill in required fields:
   - First Name: `RBAC Test Admin [Timestamp]`
   - Last Name: `Contact`
   - Email: `rbac.admin.[timestamp]@test.com`
6. Open Organization combobox
7. Type "MFB" to search
8. Select "MFB Consulting" from results
9. Select Account Manager (Admin)
10. Observe that "Save & Close" button is enabled
11. Click "Save & Close"
12. Monitor Console for any errors during submission
13. Verify redirect to contacts list or detail view
14. Search for the newly created contact to confirm it exists
15. Verify the contact appears in the list with correct data

**Expected Results:**

- [ ] Create form loads without errors
- [ ] All required fields are fillable
- [ ] Organization combobox works correctly
- [ ] Save button enables when form is valid
- [ ] Form submits successfully (no errors)
- [ ] No RLS errors in Console
- [ ] Contact is created and visible in list
- [ ] Contact data matches what was entered

**Pass:** [ ] **Fail:** [ ]

---

### Test A3: Admin - Edit Any Contact

**Objective:** Verify Admin can edit any contact, regardless of who created it.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Contacts list: `/#/contacts`
3. Wait for DataGrid to load completely
4. Find a contact NOT created by Admin (if possible, use seed data)
5. Click on the contact row to open details
6. Locate and click the "Edit" button
7. Verify navigation to `/#/contacts/[id]` or edit form loads
8. Modify the Last Name field: append " [Admin Edited]"
9. Observe that Save button remains enabled
10. Click "Save" or "Save & Close"
11. Monitor Console for any errors during save
12. Verify the edit was successful (no error messages)
13. Return to contact details or list
14. Verify the Last Name shows the updated value
15. Check Console for any permission or RLS errors

**Expected Results:**

- [ ] Edit button is visible and clickable
- [ ] Edit form loads without errors
- [ ] Fields are editable (not read-only)
- [ ] Save operation completes successfully
- [ ] No RLS errors in Console
- [ ] No "permission denied" messages
- [ ] Contact displays updated data

**Pass:** [ ] **Fail:** [ ]

---

### Test A4: Admin - Delete Contact

**Objective:** Verify Admin can delete any contact.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Contacts list: `/#/contacts`
3. Wait for DataGrid to load completely
4. Find a test contact to delete (preferably one created in Test A2)
5. Click on the contact row to open details
6. Look for a "Delete" button (may be in toolbar, menu, or bottom of form)
7. Verify Delete button is VISIBLE (not hidden)
8. Click the Delete button
9. If confirmation dialog appears, read the message
10. Confirm the deletion (click "Delete" or "Yes" in dialog)
11. Monitor Console for any errors during deletion
12. Verify success message or notification appears
13. Verify redirect to contacts list
14. Search for the deleted contact
15. Confirm the contact no longer appears in the list

**Expected Results:**

- [ ] Delete button is visible for Admin
- [ ] Delete button is clickable (not disabled)
- [ ] Confirmation dialog appears (if implemented)
- [ ] Deletion completes without errors
- [ ] No RLS errors in Console
- [ ] Success notification displayed
- [ ] Contact is removed from list
- [ ] Contact does not appear in search results

**Pass:** [ ] **Fail:** [ ]

---

### Test A5: Manager - Delete Contact (Blocked)

**Objective:** Verify Manager CANNOT delete contacts.

**Steps:**

1. Sign out from current session
2. Clear localStorage: `localStorage.clear()` in Console
3. Hard refresh the page (Ctrl+Shift+R)
4. Navigate to http://localhost:5173
5. Log in as Manager (manager@mfbroker.com / password123)
6. Wait for dashboard to load
7. Navigate to Contacts list: `/#/contacts`
8. Wait for DataGrid to load completely
9. Click on any contact row to open details
10. Carefully examine the interface for a Delete button
11. Check the toolbar area for Delete option
12. Check any "More Actions" or three-dot menu
13. Check the bottom of the detail panel/form
14. Verify the Delete button is NOT visible or is disabled
15. If a Delete button IS visible, click it and observe behavior

**Expected Results:**

- [ ] Delete button is NOT visible, OR
- [ ] Delete button is visible but disabled/grayed out, OR
- [ ] Clicking Delete shows permission denied error
- [ ] Manager cannot initiate delete action
- [ ] No successful deletion can occur
- [ ] Console may show permission warning if attempted
- [ ] Manager can still view and edit contacts

**Pass:** [ ] **Fail:** [ ]

---

### Test A6: Rep - Delete Contact (Blocked)

**Objective:** Verify Rep CANNOT delete contacts.

**Steps:**

1. Sign out from current session
2. Clear localStorage: `localStorage.clear()` in Console
3. Hard refresh the page (Ctrl+Shift+R)
4. Navigate to http://localhost:5173
5. Log in as Rep (rep@mfbroker.com / password123)
6. Wait for dashboard to load
7. Navigate to Contacts list: `/#/contacts`
8. Wait for DataGrid to load completely
9. Click on any visible contact row to open details
10. Carefully examine the interface for a Delete button
11. Check the toolbar area for Delete option
12. Check any "More Actions" or three-dot menu
13. Check the bottom of the detail panel/form
14. Verify the Delete button is NOT visible or is disabled
15. Document the exact UI state (hidden vs disabled)

**Expected Results:**

- [ ] Delete button is NOT visible, OR
- [ ] Delete button is visible but disabled/grayed out
- [ ] Rep cannot initiate delete action
- [ ] No successful deletion possible
- [ ] Rep can still view contacts they have access to
- [ ] No RLS errors for normal view operations

**Pass:** [ ] **Fail:** [ ]

---

## Section B: Opportunities RBAC Matrix

### Test B1: Admin - View All Opportunities

**Objective:** Verify Admin can view all opportunities regardless of assignment.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Opportunities: `/#/opportunities`
3. Wait for the Kanban board or list to load completely
4. Observe the total opportunity count
5. Verify opportunities from multiple users are visible
6. Check for opportunities assigned to different account managers
7. Click on any opportunity card/row to view details
8. Verify the opportunity details panel loads
9. Scroll through all pipeline stages/columns
10. Verify opportunities in all stages are visible
11. Use filters to view specific stages or assignees
12. Verify filter results display correctly
13. Return to unfiltered view
14. Check Console for any RLS or permission errors

**Expected Results:**

- [ ] Opportunities view loads without errors
- [ ] All opportunities are visible (all stages)
- [ ] Opportunities from all users are visible
- [ ] Opportunity details are accessible
- [ ] Filters work correctly
- [ ] No "permission denied" errors in Console
- [ ] No RLS policy violations
- [ ] Pipeline stages render correctly

**Pass:** [ ] **Fail:** [ ]

---

### Test B2: Admin - Create Opportunity (Any Assignment)

**Objective:** Verify Admin can create opportunities assigned to any user.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Opportunities: `/#/opportunities`
3. Locate and click the "Create" or "+" button
4. Verify navigation to opportunity create form
5. Fill in required fields:
   - Name/Title: `RBAC Test Opportunity [Timestamp]`
   - Select a Principal from dropdown
   - Select a Customer organization
6. Locate the Account Manager / Assigned To field
7. Open the dropdown and verify multiple users are selectable
8. Select "Rep" user (NOT Admin) as the assignee
9. Set pipeline stage to "New Lead"
10. Fill any other required fields
11. Click "Save" or "Create"
12. Monitor Console for any errors during submission
13. Verify the opportunity was created successfully
14. Navigate to the opportunity to confirm assignment
15. Verify the opportunity is assigned to Rep user

**Expected Results:**

- [ ] Create form loads without errors
- [ ] All account managers appear in assignee dropdown
- [ ] Admin can select any user as assignee
- [ ] Form submits successfully
- [ ] No RLS errors in Console
- [ ] Opportunity is created with correct assignment
- [ ] Opportunity appears in pipeline view

**Pass:** [ ] **Fail:** [ ]

---

### Test B3: Admin - Edit Any Opportunity

**Objective:** Verify Admin can edit any opportunity regardless of owner.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Opportunities: `/#/opportunities`
3. Wait for opportunities to load
4. Find an opportunity assigned to Rep or Manager (not Admin)
5. Click on the opportunity to open details
6. Locate and click the "Edit" button
7. Verify edit form loads without errors
8. Modify the opportunity name: append " [Admin Edited]"
9. Change the pipeline stage (e.g., New Lead -> Initial Outreach)
10. Observe that Save button is enabled
11. Click "Save"
12. Monitor Console for any errors
13. Verify the edit was successful
14. Return to opportunity details or list
15. Confirm the changes are persisted (name, stage)

**Expected Results:**

- [ ] Edit button is visible for all opportunities
- [ ] Edit form loads without permission errors
- [ ] All fields are editable
- [ ] Stage change is allowed
- [ ] Save operation completes successfully
- [ ] No RLS errors in Console
- [ ] Changes are persisted correctly

**Pass:** [ ] **Fail:** [ ]

---

### Test B4: Admin - Delete Opportunity

**Objective:** Verify Admin can delete any opportunity.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Opportunities: `/#/opportunities`
3. Find a test opportunity to delete (preferably from Test B2)
4. Click on the opportunity to open details
5. Look for a "Delete" button in the UI
6. Verify Delete button is VISIBLE
7. Click the Delete button
8. If confirmation dialog appears, read the warning message
9. Confirm the deletion
10. Monitor Console for any errors
11. Verify success notification appears
12. Verify redirect or return to opportunities view
13. Search or filter for the deleted opportunity
14. Confirm the opportunity no longer exists
15. Verify it doesn't appear in any pipeline stage

**Expected Results:**

- [ ] Delete button is visible for Admin
- [ ] Delete button is clickable
- [ ] Confirmation dialog appears (if implemented)
- [ ] Deletion completes without errors
- [ ] No RLS errors in Console
- [ ] Success notification displayed
- [ ] Opportunity is removed from all views
- [ ] Soft delete: opportunity has deleted_at timestamp

**Pass:** [ ] **Fail:** [ ]

---

### Test B5: Manager - Edit Any Opportunity

**Objective:** Verify Manager can edit any opportunity (cross-user editing).

**Steps:**

1. Sign out and log in as Manager (manager@mfbroker.com / password123)
2. Navigate to Opportunities: `/#/opportunities`
3. Wait for opportunities to load
4. Find an opportunity assigned to Rep user (not Manager)
5. Click on the opportunity to open details
6. Verify the opportunity shows Rep as the owner/assignee
7. Locate and click the "Edit" button
8. Verify edit form loads without permission errors
9. Modify the opportunity name: append " [Manager Edited]"
10. Optionally change notes or description field
11. Click "Save"
12. Monitor Console for any errors during save
13. Verify no RLS or permission errors
14. Return to opportunity details
15. Confirm the changes are persisted

**Expected Results:**

- [ ] Manager can view opportunities from all users
- [ ] Edit button is visible for Manager
- [ ] Edit form loads without errors
- [ ] Fields are editable (not read-only)
- [ ] Save operation completes successfully
- [ ] No RLS errors in Console
- [ ] Changes persist correctly
- [ ] Manager retains view of all opportunities

**Pass:** [ ] **Fail:** [ ]

---

### Test B6: Manager - Delete Opportunity (Blocked)

**Objective:** Verify Manager CANNOT delete opportunities.

**Steps:**

1. Ensure logged in as Manager (manager@mfbroker.com)
2. Navigate to Opportunities: `/#/opportunities`
3. Wait for opportunities to load
4. Click on any opportunity to open details
5. Carefully examine the interface for a Delete button
6. Check the toolbar area for Delete option
7. Check any "More Actions" or three-dot menu
8. Check the detail panel for Delete action
9. Check the bottom action bar if present
10. Document whether Delete button is hidden or disabled
11. If Delete button IS visible, attempt to click it
12. Observe the response (should be blocked or error)
13. Check Console for any permission-related messages
14. Verify the opportunity still exists after any attempt
15. Confirm Manager can still edit (but not delete)

**Expected Results:**

- [ ] Delete button is NOT visible, OR
- [ ] Delete button is visible but disabled, OR
- [ ] Clicking Delete shows permission denied error
- [ ] No successful deletion can occur
- [ ] Console shows permission warning if attempted via API
- [ ] Opportunity remains in the system
- [ ] Manager retains edit permissions

**Pass:** [ ] **Fail:** [ ]

---

### Test B7: Rep - Edit Own Opportunity

**Objective:** Verify Rep can edit opportunities assigned to them.

**Steps:**

1. Sign out and log in as Rep (rep@mfbroker.com / password123)
2. Navigate to Opportunities: `/#/opportunities`
3. Wait for opportunities to load
4. Find an opportunity assigned to Rep user (self)
5. Verify the assignee field shows Rep's name/email
6. Click on the opportunity to open details
7. Locate and click the "Edit" button
8. Verify edit form loads without errors
9. Modify the opportunity name: append " [Rep Edited]"
10. Change the pipeline stage to the next stage
11. Click "Save"
12. Monitor Console for any errors
13. Verify no RLS errors
14. Return to opportunity details
15. Confirm all changes are persisted

**Expected Results:**

- [ ] Rep can view their own opportunities
- [ ] Edit button is visible for own opportunities
- [ ] Edit form loads without errors
- [ ] All fields are editable
- [ ] Stage change is successful
- [ ] Save operation completes without errors
- [ ] No RLS errors in Console
- [ ] Changes persist correctly

**Pass:** [ ] **Fail:** [ ]

---

### Test B8: Rep - Edit Other's Opportunity (Blocked)

**Objective:** Verify Rep CANNOT edit opportunities assigned to others.

**Steps:**

1. Ensure logged in as Rep (rep@mfbroker.com)
2. Navigate to Opportunities: `/#/opportunities`
3. Observe which opportunities are visible to Rep
4. Attempt to find an opportunity assigned to Admin or Manager
5. Note: If RLS hides other users' opportunities completely, skip to step 10
6. If other opportunities are visible, click on one
7. Verify the assignee shows a different user (not Rep)
8. Look for an Edit button
9. If Edit button exists, click it
10. Observe the response:
    - Form loads but fields are read-only, OR
    - Error message appears, OR
    - Navigation is blocked, OR
    - RLS error in Console
11. If edit form loads, attempt to modify a field
12. If modifications allowed, attempt to Save
13. Monitor Console for RLS errors
14. Verify the edit does NOT persist (check original values)
15. Document the exact blocking mechanism observed

**Expected Results:**

- [ ] Rep cannot see other users' opportunities (RLS filter), OR
- [ ] Rep can see but cannot edit others' opportunities, OR
- [ ] Edit attempt shows permission denied error
- [ ] RLS error appears in Console if direct API call attempted
- [ ] No unauthorized edits are persisted
- [ ] Rep's own opportunities remain editable

**Blocking Mechanism Observed:**
- [ ] Opportunities hidden by RLS (not visible)
- [ ] Edit button hidden
- [ ] Edit button disabled
- [ ] Form loads read-only
- [ ] Save blocked with error message
- [ ] RLS error in Console

**Pass:** [ ] **Fail:** [ ]

---

## Section C: Tasks RBAC Matrix

### Test C1: Admin - Edit Any Task

**Objective:** Verify Admin can edit any task regardless of owner.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Tasks view: `/#/tasks` or open task panel
3. Wait for tasks to load
4. Identify a task owned by Rep or Manager (not Admin)
5. Click on the task to open details/edit panel
6. Verify the task shows a different owner
7. Locate edit functionality (inline or form)
8. Modify the task title: append " [Admin Edited]"
9. Change the due date if applicable
10. Modify the status (e.g., pending -> in progress)
11. Save the changes
12. Monitor Console for any errors
13. Verify no RLS errors appear
14. Confirm the task shows updated values
15. Verify changes persist after page refresh

**Expected Results:**

- [ ] Admin can view all tasks
- [ ] Admin can edit tasks from any owner
- [ ] Title change persists
- [ ] Status change persists
- [ ] Due date change persists
- [ ] No RLS errors in Console
- [ ] No permission denied messages
- [ ] Changes survive page refresh

**Pass:** [ ] **Fail:** [ ]

---

### Test C2: Admin - Delete Task

**Objective:** Verify Admin can delete any task.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Tasks view or panel
3. Find a test task to delete
4. Click on the task to select it
5. Look for Delete action (button, icon, or menu option)
6. Verify Delete option is VISIBLE
7. Click the Delete button/icon
8. If confirmation appears, confirm the deletion
9. Monitor Console for any errors
10. Verify success feedback (notification or visual update)
11. Verify the task disappears from the list
12. Refresh the page
13. Verify the task does not reappear
14. Check Console for any RLS errors
15. Document soft delete behavior (deleted_at vs hard delete)

**Expected Results:**

- [ ] Delete option is visible for Admin
- [ ] Delete action is clickable
- [ ] Confirmation dialog appears (if implemented)
- [ ] Deletion completes without errors
- [ ] No RLS errors in Console
- [ ] Task is removed from view
- [ ] Deletion persists after refresh
- [ ] Soft delete: task has deleted_at timestamp

**Pass:** [ ] **Fail:** [ ]

---

### Test C3: Manager - Edit Any Task

**Objective:** Verify Manager can edit tasks from any user.

**Steps:**

1. Sign out and log in as Manager (manager@mfbroker.com / password123)
2. Navigate to Tasks view or panel
3. Wait for tasks to load
4. Identify a task owned by Rep or Admin (not Manager)
5. Click on the task to open it
6. Verify the owner is NOT Manager
7. Locate edit functionality
8. Modify the task title: append " [Manager Edited]"
9. Change task status or priority if available
10. Save the changes
11. Monitor Console for any errors
12. Verify no RLS or permission errors
13. Confirm the changes appear in the UI
14. Refresh the page
15. Verify changes persist after refresh

**Expected Results:**

- [ ] Manager can view all tasks
- [ ] Manager can edit any task
- [ ] Edit functionality works correctly
- [ ] Changes save without errors
- [ ] No RLS errors in Console
- [ ] Changes persist after refresh
- [ ] Manager cannot delete (covered in C4)

**Pass:** [ ] **Fail:** [ ]

---

### Test C4: Manager - Delete Task (Blocked)

**Objective:** Verify Manager CANNOT delete tasks.

**Steps:**

1. Ensure logged in as Manager (manager@mfbroker.com)
2. Navigate to Tasks view or panel
3. Wait for tasks to load
4. Click on any task to select it
5. Carefully examine the UI for Delete functionality
6. Check toolbar for Delete button/icon
7. Check context menu (right-click) for Delete option
8. Check task detail panel for Delete action
9. Check any "More Actions" dropdown
10. Document whether Delete is hidden or disabled
11. If Delete option IS visible, attempt to click it
12. Observe the response (should be blocked)
13. Check Console for permission errors
14. Verify the task still exists
15. Confirm Manager retains edit capabilities

**Expected Results:**

- [ ] Delete option is NOT visible, OR
- [ ] Delete option is visible but disabled, OR
- [ ] Delete attempt shows permission denied error
- [ ] Task remains in the system after any attempt
- [ ] Console shows permission warning if API call attempted
- [ ] Manager can still view all tasks
- [ ] Manager can still edit tasks

**Pass:** [ ] **Fail:** [ ]

---

### Test C5: Rep - Edit Own Task

**Objective:** Verify Rep can edit tasks they own.

**Steps:**

1. Sign out and log in as Rep (rep@mfbroker.com / password123)
2. Navigate to Tasks view or panel
3. Wait for tasks to load
4. Find a task owned by Rep (self)
5. Verify the owner field shows Rep's name
6. Click on the task to open it
7. Locate edit functionality
8. Modify the task title: append " [Rep Edited]"
9. Change the task status
10. Update due date if applicable
11. Save the changes
12. Monitor Console for any errors
13. Verify no RLS errors
14. Confirm changes appear in the UI
15. Verify changes persist after refresh

**Expected Results:**

- [ ] Rep can view their own tasks
- [ ] Rep can edit their own tasks
- [ ] Title change saves successfully
- [ ] Status change saves successfully
- [ ] No RLS errors in Console
- [ ] Changes persist after refresh
- [ ] Rep cannot delete (no delete button)

**Pass:** [ ] **Fail:** [ ]

---

### Test C6: Rep - Edit Other's Task (Blocked)

**Objective:** Verify Rep CANNOT edit tasks owned by others.

**Steps:**

1. Ensure logged in as Rep (rep@mfbroker.com)
2. Navigate to Tasks view or panel
3. Observe which tasks are visible to Rep
4. Attempt to find a task owned by Admin or Manager
5. Note: If RLS hides other users' tasks, skip to step 10
6. If other tasks are visible, click on one
7. Verify the owner is NOT Rep
8. Look for edit functionality
9. Attempt to modify the task title
10. Observe the response:
    - Fields are read-only, OR
    - Edit button is hidden/disabled, OR
    - Error message appears
11. If edit seems allowed, attempt to save
12. Monitor Console for RLS errors
13. Verify the edit does NOT persist
14. Check the task's original values remain
15. Document the exact blocking mechanism

**Expected Results:**

- [ ] Rep cannot see other users' tasks (RLS), OR
- [ ] Rep can see but cannot edit others' tasks, OR
- [ ] Edit attempt shows permission denied error
- [ ] RLS error appears in Console if API call attempted
- [ ] No unauthorized edits persist
- [ ] Rep's own tasks remain editable

**Blocking Mechanism Observed:**
- [ ] Tasks hidden by RLS (not visible)
- [ ] Edit functionality hidden
- [ ] Edit functionality disabled
- [ ] Fields are read-only
- [ ] Save blocked with error
- [ ] RLS error in Console

**Pass:** [ ] **Fail:** [ ]

---

## Section D: Organizations RBAC Matrix

### Test D1: Admin - View All Organizations

**Objective:** Verify Admin can view all organizations.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Organizations: `/#/organizations`
3. Wait for the DataGrid/list to load completely
4. Observe the total organization count
5. Verify organizations of all types are visible (Principal, Distributor, Customer, etc.)
6. Scroll through the organization list
7. Click on any organization to view details
8. Verify the organization details panel loads
9. Use column filters to filter by organization type
10. Verify filter results display correctly
11. Clear filters and verify all orgs reappear
12. Use search to find a specific organization
13. Verify search results are accurate
14. Check Console for any RLS or permission errors
15. Verify no data is hidden from Admin

**Expected Results:**

- [ ] Organizations list loads without errors
- [ ] All organizations are visible
- [ ] All organization types are accessible
- [ ] Details panel loads correctly
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] No RLS errors in Console
- [ ] No permission denied messages

**Pass:** [ ] **Fail:** [ ]

---

### Test D2: Admin - Create Organization

**Objective:** Verify Admin can create new organizations.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Organizations: `/#/organizations`
3. Locate and click the "Create" button
4. Verify navigation to `/#/organizations/create`
5. Verify the create form loads without errors
6. Fill in required field:
   - Organization Name: `RBAC Test Organization [Timestamp]`
7. Select Organization Type: "Distributor"
8. Fill in optional fields if desired:
   - Website: `https://rbac-test.example.com`
9. Observe Save button is enabled
10. Click "Create Organization" or "Save"
11. Handle duplicate dialog if it appears (click "Proceed Anyway")
12. Monitor Console for any errors
13. Verify redirect to organization list or detail view
14. Search for the newly created organization
15. Confirm the organization exists with correct data

**Expected Results:**

- [ ] Create form loads without errors
- [ ] Required field (name) is fillable
- [ ] Organization type dropdown works
- [ ] Optional fields are fillable
- [ ] Save button enables when valid
- [ ] Form submits successfully
- [ ] No RLS errors in Console
- [ ] Organization is created and visible

**Pass:** [ ] **Fail:** [ ]

---

### Test D3: Admin - Delete Organization

**Objective:** Verify Admin can delete organizations.

**Steps:**

1. Ensure logged in as Admin (admin@test.com)
2. Navigate to Organizations: `/#/organizations`
3. Find a test organization to delete (preferably from Test D2)
4. Click on the organization to open details
5. Look for a "Delete" button in the UI
6. Check toolbar, detail panel, and action menus
7. Verify Delete button is VISIBLE
8. Click the Delete button
9. If confirmation dialog appears, read the warning
10. Confirm the deletion
11. Monitor Console for any errors
12. Verify success notification appears
13. Verify return to organizations list
14. Search for the deleted organization
15. Confirm the organization no longer appears

**Expected Results:**

- [ ] Delete button is visible for Admin
- [ ] Delete button is clickable
- [ ] Confirmation dialog appears (if implemented)
- [ ] Deletion completes without errors
- [ ] No RLS errors in Console
- [ ] Success notification displayed
- [ ] Organization is removed from list
- [ ] Soft delete: organization has deleted_at timestamp

**Pass:** [ ] **Fail:** [ ]

---

### Test D4: Manager - Delete Organization (Blocked)

**Objective:** Verify Manager CANNOT delete organizations.

**Steps:**

1. Sign out and log in as Manager (manager@mfbroker.com / password123)
2. Navigate to Organizations: `/#/organizations`
3. Wait for the list to load
4. Click on any organization to open details
5. Carefully examine the interface for Delete button
6. Check the toolbar area
7. Check any "More Actions" or three-dot menu
8. Check the detail panel
9. Check the bottom action bar if present
10. Document whether Delete is hidden or disabled
11. If Delete button IS visible, attempt to click it
12. Observe the response (should be blocked)
13. Check Console for permission errors
14. Verify the organization still exists
15. Confirm Manager can still edit organizations

**Expected Results:**

- [ ] Delete button is NOT visible, OR
- [ ] Delete button is visible but disabled, OR
- [ ] Delete attempt shows permission denied error
- [ ] Organization remains in the system
- [ ] Console shows permission warning if API attempted
- [ ] Manager can still view all organizations
- [ ] Manager can still edit organizations

**Pass:** [ ] **Fail:** [ ]

---

### Test D5: Rep - Edit Organization

**Objective:** Verify Rep can edit organizations (basic edit permission).

**Steps:**

1. Sign out and log in as Rep (rep@mfbroker.com / password123)
2. Navigate to Organizations: `/#/organizations`
3. Wait for the list to load
4. Observe which organizations are visible to Rep
5. Click on any visible organization
6. Look for Edit functionality
7. Locate and click the Edit button
8. Verify edit form loads without errors
9. Modify the organization name: append " [Rep Edited]"
10. Change organization type if allowed
11. Click Save
12. Monitor Console for any errors
13. Verify no RLS errors
14. Return to organization details
15. Confirm changes are persisted

**Expected Results:**

- [ ] Rep can view organizations
- [ ] Edit button is visible
- [ ] Edit form loads without errors
- [ ] Fields are editable
- [ ] Save operation succeeds
- [ ] No RLS errors in Console
- [ ] Changes persist correctly
- [ ] Rep cannot delete (no delete button)

**Pass:** [ ] **Fail:** [ ]

---

### Test D6: Rep - Delete Organization (Blocked)

**Objective:** Verify Rep CANNOT delete organizations.

**Steps:**

1. Ensure logged in as Rep (rep@mfbroker.com)
2. Navigate to Organizations: `/#/organizations`
3. Wait for the list to load
4. Click on any organization to open details
5. Carefully examine the interface for Delete button
6. Check the toolbar area
7. Check any "More Actions" or three-dot menu
8. Check the detail panel
9. Check the bottom action bar if present
10. Document whether Delete is hidden or disabled
11. If Delete button IS visible, attempt to click it
12. Observe the response (should be blocked)
13. Check Console for permission errors
14. Verify the organization still exists
15. Confirm Rep retains edit permissions

**Expected Results:**

- [ ] Delete button is NOT visible, OR
- [ ] Delete button is visible but disabled, OR
- [ ] Delete attempt shows permission denied error
- [ ] Organization remains in the system
- [ ] Console shows permission warning if API attempted
- [ ] Rep retains view permissions
- [ ] Rep retains edit permissions

**Pass:** [ ] **Fail:** [ ]

---

## Test Summary

### Results Matrix

| Test | Entity | Role | Operation | Expected | Result |
|------|--------|------|-----------|----------|--------|
| A1 | Contact | Admin | View All | Success | [ ] |
| A2 | Contact | Admin | Create | Success | [ ] |
| A3 | Contact | Admin | Edit Any | Success | [ ] |
| A4 | Contact | Admin | Delete | Success | [ ] |
| A5 | Contact | Manager | Delete | Blocked | [ ] |
| A6 | Contact | Rep | Delete | Blocked | [ ] |
| B1 | Opportunity | Admin | View All | Success | [ ] |
| B2 | Opportunity | Admin | Create (Any) | Success | [ ] |
| B3 | Opportunity | Admin | Edit Any | Success | [ ] |
| B4 | Opportunity | Admin | Delete | Success | [ ] |
| B5 | Opportunity | Manager | Edit Any | Success | [ ] |
| B6 | Opportunity | Manager | Delete | Blocked | [ ] |
| B7 | Opportunity | Rep | Edit Own | Success | [ ] |
| B8 | Opportunity | Rep | Edit Other's | Blocked | [ ] |
| C1 | Task | Admin | Edit Any | Success | [ ] |
| C2 | Task | Admin | Delete | Success | [ ] |
| C3 | Task | Manager | Edit Any | Success | [ ] |
| C4 | Task | Manager | Delete | Blocked | [ ] |
| C5 | Task | Rep | Edit Own | Success | [ ] |
| C6 | Task | Rep | Edit Other's | Blocked | [ ] |
| D1 | Organization | Admin | View All | Success | [ ] |
| D2 | Organization | Admin | Create | Success | [ ] |
| D3 | Organization | Admin | Delete | Success | [ ] |
| D4 | Organization | Manager | Delete | Blocked | [ ] |
| D5 | Organization | Rep | Edit | Success | [ ] |
| D6 | Organization | Rep | Delete | Blocked | [ ] |

### Pass Criteria

**All 26 tests must pass** for RBAC CRUD operations to be considered properly implemented.

- **Success tests:** Operation completes without errors
- **Blocked tests:** Operation is prevented (UI hidden, disabled, or error shown)

### Common Issues and Debugging

**RLS Errors:**
- Pattern: "permission denied for table", "row-level security", error code "42501"
- Cause: Database RLS policies are blocking the operation
- Debug: Check `supabase/migrations/` for RLS policy definitions

**Missing Delete Button:**
- Expected for Manager and Rep roles
- Verify role detection is working: check user profile in UI
- Check React Admin's resource permissions configuration

**Can See But Can't Edit:**
- Expected for Rep viewing other users' records (in some implementations)
- UI should show read-only state clearly
- Edit button may be hidden or form fields disabled

**Cross-User Access Issues:**
- Rep should ONLY see/edit their own records for Opportunities and Tasks
- Admin and Manager should see all records
- If Rep sees too much/too little, check RLS policies

### Console Error Reference

**Expected Errors (for blocked operations):**
- `permission denied` - RLS blocking database operation
- `403 Forbidden` - API blocking unauthorized request
- `unauthorized` - Authentication/authorization check failed

**Unexpected Errors (indicates bugs):**
- `Cannot read properties of undefined` - React component error
- `500 Internal Server Error` - Server-side bug
- `RLS policy violation` on operations that should succeed

---

## Notes

### Test Execution Order

Execute tests in order (A1 through D6) to ensure:
1. Data created in earlier tests exists for later tests
2. Role-switching is minimized (batch tests by role)

**Optimal execution order by role:**
1. Admin: A1, A2, A3, A4, B1, B2, B3, B4, C1, C2, D1, D2, D3
2. Manager: A5, B5, B6, C3, C4, D4
3. Rep: A6, B7, B8, C5, C6, D5, D6

### Clean Up

After testing:
1. Delete test records created during testing
2. Or run `just seed-e2e` to reset to known state

### Reporting Issues

If a test fails:
1. Note the exact test ID (e.g., "B8")
2. Capture Console errors (screenshot or copy/paste)
3. Note the blocking mechanism observed (hidden, disabled, error message)
4. Document expected vs actual behavior
5. Include browser and timestamp
