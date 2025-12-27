# Edge Cases & Error Handling Manual Testing Checklist

Manual E2E testing checklist for edge cases and error handling scenarios. This is TEST 5 of a progressive 6-test RBAC suite.

## Prerequisites

Before running these tests, ensure:

1. **Tests 1-4 have passed** - This test depends on previous RBAC test suites
2. **Local Development Server Running** - `http://127.0.0.1:5173`
3. **Supabase Local Instance Running** - `npx supabase status`
4. **Test Data Seeded** - `./scripts/seed-e2e-dashboard-v3.sh`
5. **Multiple Browsers Available** - Tests require simultaneous sessions

## Test Environment

- **Browser 1:** Chrome (primary session)
- **Browser 2:** Chrome Incognito or Firefox (secondary session)
- **URL:** http://127.0.0.1:5173

## Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Manager | manager@mfbroker.com | password123 |
| Rep | rep@mfbroker.com | password123 |

---

## Section A: Concurrent Modifications

These tests verify the system handles simultaneous edits gracefully when multiple users modify the same data.

---

### Test A1: Edit Conflict Detection (Two Users Edit Same Record)

**Objective:** Verify that when two users edit the same record simultaneously, the system detects the conflict and prevents data loss.

#### Steps

1. **Open Browser 1 (Chrome primary window)**
   - Navigate to `http://127.0.0.1:5173`
   - Open DevTools (F12) and switch to Console tab
   - Clear console to start fresh

2. **Login as Admin in Browser 1**
   - Enter email: `admin@test.com`
   - Enter password: `password123`
   - Click "Sign In" button
   - Wait for dashboard to load completely
   - Verify no console errors appear

3. **Navigate to a specific contact in Browser 1**
   - Click "Contacts" in the sidebar navigation
   - Wait for contacts list to load
   - Click on a contact record (e.g., first contact in the list)
   - Note the contact's current First Name and Last Name
   - Record the contact ID from the URL (e.g., `/#/contacts/123`)

4. **Open Browser 2 (Chrome Incognito or Firefox)**
   - Open a new incognito window (Ctrl+Shift+N) or Firefox
   - Navigate to `http://127.0.0.1:5173`
   - Open DevTools (F12) and switch to Console tab

5. **Login as Manager in Browser 2**
   - Enter email: `manager@mfbroker.com`
   - Enter password: `password123`
   - Click "Sign In" button
   - Wait for dashboard to load completely

6. **Navigate to the SAME contact in Browser 2**
   - Click "Contacts" in the sidebar navigation
   - Navigate to the exact same contact ID noted in Step 3
   - URL should match: `/#/contacts/[same-id]`
   - Verify both browsers now display the same contact

7. **Begin editing in Browser 1**
   - Click the "Edit" button in Browser 1
   - Wait for edit form to load
   - Change the First Name field to: `Conflict Test A`
   - DO NOT save yet - leave the form open

8. **Begin editing in Browser 2**
   - Click the "Edit" button in Browser 2
   - Wait for edit form to load
   - Change the First Name field to: `Conflict Test B`
   - DO NOT save yet

9. **Save changes in Browser 1 FIRST**
   - In Browser 1, click "Save" or "Save & Close"
   - Wait for save operation to complete
   - Verify success notification appears
   - Confirm the contact now shows First Name: `Conflict Test A`

10. **Attempt to save changes in Browser 2**
    - In Browser 2, click "Save" or "Save & Close"
    - Observe the system's response
    - Check console for any error messages
    - Note what happens to the form

11. **Verify final state**
    - Refresh Browser 1 and check the contact's First Name
    - Refresh Browser 2 and check the contact's First Name
    - Compare which value was saved

#### Expected Results

- [ ] Browser 1 saves successfully with First Name: `Conflict Test A`
- [ ] Browser 2 shows one of the following when attempting to save:
  - Error message indicating record was modified by another user
  - Stale data warning asking user to refresh
  - Optimistic concurrency error
  - Form refresh with new data and prompt to re-enter changes
- [ ] Final database state is consistent (one value, not corrupted)
- [ ] No JavaScript errors or crashes in either browser console
- [ ] User is not left with silently lost data

#### Pass/Fail

- [ ] **PASS** - Conflict detected and handled gracefully
- [ ] **FAIL** - Data silently overwritten or system crashed

#### Notes

_Record any unexpected behavior, error messages, or observations:_

---

### Test A2: Delete While Another User Is Editing

**Objective:** Verify that when one user deletes a record while another user is editing it, the system handles this gracefully without crashing.

#### Steps

1. **Create a temporary test record**
   - Login as Admin in Browser 1
   - Navigate to `/#/contacts/create`
   - Fill in First Name: `Delete Test`
   - Fill in Last Name: `Concurrent [Timestamp]`
   - Fill in Email: `delete-test@example.com`
   - Select an Organization from the dropdown
   - Select an Account Manager
   - Click "Save & Close"
   - Note the new contact's ID from the URL

2. **Open Browser 2 (Chrome Incognito or Firefox)**
   - Navigate to `http://127.0.0.1:5173`
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load

3. **Navigate to the test contact in Browser 2**
   - Click "Contacts" in the sidebar
   - Find and click on "Delete Test Concurrent" contact
   - Verify the contact loads correctly

4. **Begin editing in Browser 2**
   - Click the "Edit" button
   - Wait for edit form to load completely
   - Change the First Name to: `Should Not Save`
   - DO NOT save yet - keep the form open

5. **Switch to Browser 1**
   - Navigate to the Contacts list: `/#/contacts`
   - Find the "Delete Test Concurrent" contact
   - Prepare to delete this contact

6. **Delete the contact in Browser 1**
   - Click on the contact to open it
   - Look for a "Delete" button or action
   - If using soft delete: Click "Archive" or "Delete"
   - Confirm the deletion if prompted
   - Wait for deletion to complete
   - Verify the contact is no longer visible in the list

7. **Return to Browser 2 and attempt to save**
   - Browser 2 still has the edit form open
   - Click "Save" or "Save & Close"
   - Observe the system's response
   - Check the console for errors

8. **Verify error handling**
   - Check if an error message is displayed
   - Verify the form does not hang or freeze
   - Confirm no JavaScript exceptions in console

9. **Check navigation after error**
   - If redirected, note the destination
   - Try navigating to the contact list
   - Verify the deleted contact is not visible

10. **Verify database consistency**
    - Check that the contact remains deleted
    - Verify no duplicate or corrupted records exist
    - Confirm the edit from Browser 2 was not applied

#### Expected Results

- [ ] Browser 1 successfully deletes the contact
- [ ] Browser 2 shows a graceful error when attempting to save:
  - "Record not found" or similar message
  - "This contact has been deleted" notification
  - Redirect to contacts list with explanation
- [ ] No JavaScript errors or crashes
- [ ] No blank/frozen screen in Browser 2
- [ ] User is clearly informed the record no longer exists
- [ ] System remains functional after the error

#### Pass/Fail

- [ ] **PASS** - Deletion handled gracefully, clear user feedback
- [ ] **FAIL** - System crashed, hung, or gave no feedback

#### Notes

_Record error messages, console output, and behavior:_

---

## Section B: Role Changes Mid-Session

These tests verify that permission changes take effect appropriately when a user's role is modified during an active session.

---

### Test B1: User Demoted During Session - Permissions Update

**Objective:** Verify that when a user is demoted from Manager to Rep during an active session, their permissions are restricted on the next action.

#### Prerequisites

- Ensure the Manager user (`manager@mfbroker.com`) currently has Manager role
- Have access to role management functionality

#### Steps

1. **Open Browser 1 (Admin session)**
   - Navigate to `http://127.0.0.1:5173`
   - Open DevTools Console tab
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load

2. **Open Browser 2 (Manager session)**
   - Open incognito or different browser
   - Navigate to `http://127.0.0.1:5173`
   - Open DevTools Console tab
   - Login as Manager: `manager@mfbroker.com` / `password123`
   - Wait for dashboard to load

3. **Verify Manager's current permissions in Browser 2**
   - Navigate to `/#/sales` (Team Management)
   - Confirm the page loads and Manager can see team data
   - Take note of visible functionality (can see all users, etc.)
   - This confirms Manager role is active

4. **In Browser 2, navigate to a manager-only feature**
   - Stay on `/#/sales` page
   - Verify team members list is visible
   - Keep this tab open - do not navigate away

5. **Switch to Browser 1 (Admin)**
   - Navigate to `/#/sales`
   - Locate the Manager user in the team list
   - Click on the Manager user to open their profile

6. **Demote the Manager to Rep in Browser 1**
   - Click on the "Permissions" tab
   - Locate the role dropdown or selector
   - Change role from "Manager" to "Rep"
   - Click "Save" to apply changes
   - Wait for confirmation that save completed

7. **Verify demotion saved in Browser 1**
   - Refresh the page
   - Confirm the user now shows role: "Rep"
   - Document the timestamp of the change

8. **Return to Browser 2 (previously Manager, now Rep)**
   - DO NOT refresh yet
   - Try to perform a Manager-only action:
     - Click on another team member
     - Or try to access reports
     - Or try to view another user's data

9. **Observe immediate behavior**
   - Note if the action succeeds or fails
   - Check for permission denied messages
   - Look for console errors related to authorization

10. **Refresh Browser 2 and verify new permissions**
    - Press F5 to refresh the page
    - Observe what page loads (may redirect)
    - Try to navigate to `/#/sales` again
    - Verify Rep-level restrictions now apply

11. **Test Rep-only access**
    - Navigate to `/#/opportunities`
    - Confirm only own opportunities are visible
    - Verify Manager-level features are hidden/disabled

12. **Restore Manager role (cleanup)**
    - In Browser 1 (Admin), restore the user to Manager role
    - Save the changes

#### Expected Results

- [ ] Manager can access team data before demotion
- [ ] Admin can change Manager role to Rep successfully
- [ ] On next action in Browser 2, one of these occurs:
  - Permission denied error with clear message
  - Automatic redirect to allowed area
  - Session invalidation requiring re-login
- [ ] After refresh, Rep permissions are fully enforced
- [ ] User cannot access Manager-only features after demotion
- [ ] No security vulnerabilities (cached permissions allowing access)

#### Pass/Fail

- [ ] **PASS** - New permissions applied correctly after role change
- [ ] **FAIL** - User retained Manager permissions after demotion

#### Notes

_Document when permissions took effect and any lag observed:_

---

### Test B2: User Promoted During Session - New Permissions Available

**Objective:** Verify that when a user is promoted from Rep to Manager during an active session, they gain new permissions after refresh.

#### Prerequisites

- Ensure the Rep user (`rep@mfbroker.com`) currently has Rep role
- Admin user available for making role changes

#### Steps

1. **Open Browser 1 (Admin session)**
   - Navigate to `http://127.0.0.1:5173`
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load
   - Keep DevTools Console open

2. **Open Browser 2 (Rep session)**
   - Open incognito or different browser
   - Navigate to `http://127.0.0.1:5173`
   - Login as Rep: `rep@mfbroker.com` / `password123`
   - Wait for dashboard to load

3. **Verify Rep's current limited permissions in Browser 2**
   - Navigate to `/#/sales` (Team Management)
   - Observe what happens:
     - May see "Access Denied" or restricted view
     - May only see own profile
     - May be redirected away
   - Document current Rep-level access

4. **Attempt a Manager-only action in Browser 2**
   - Try to view another team member's details
   - Try to access team reports
   - Confirm these actions are blocked or hidden
   - This establishes the baseline restriction

5. **Switch to Browser 1 (Admin)**
   - Navigate to `/#/sales`
   - Find the Rep user (`rep@mfbroker.com`)
   - Click to open their profile

6. **Promote the Rep to Manager in Browser 1**
   - Click on the "Permissions" tab
   - Locate the role selector
   - Change role from "Rep" to "Manager"
   - Click "Save" to apply
   - Wait for save confirmation
   - Note the timestamp

7. **Verify promotion saved in Browser 1**
   - Refresh the team member's profile
   - Confirm role now shows "Manager"

8. **Return to Browser 2 (Rep being promoted)**
   - WITHOUT refreshing, try to access `/#/sales`
   - Note if permissions immediately changed or not
   - Document the behavior

9. **Refresh Browser 2**
   - Press F5 to force a full refresh
   - Observe the page reload

10. **Verify new Manager permissions in Browser 2**
    - Navigate to `/#/sales`
    - Confirm the team list is now visible
    - Click on different team members
    - Verify full Manager access is granted

11. **Test Manager-specific features**
    - Access team reports (if available)
    - View other users' opportunities
    - Confirm elevated permissions work correctly

12. **Restore Rep role (cleanup)**
    - In Browser 1 (Admin), change user back to Rep
    - Save the changes

#### Expected Results

- [ ] Rep has restricted access before promotion
- [ ] Admin can change Rep role to Manager successfully
- [ ] After refresh in Browser 2, new permissions are available
- [ ] User can now access Manager-only features:
  - Team management at `/#/sales`
  - Other users' data visibility
  - Reports access
- [ ] Navigation and UI reflect Manager role
- [ ] No errors during permission escalation

#### Pass/Fail

- [ ] **PASS** - New elevated permissions available after refresh
- [ ] **FAIL** - User still has Rep restrictions after promotion

#### Notes

_Document when new permissions became available:_

---

## Section C: Self-Operations Prevention

These tests verify that users cannot perform dangerous operations on their own accounts that could lock them out or break the system.

---

### Test C1: Admin Cannot Disable Own Account

**Objective:** Verify that an Admin user is prevented from disabling their own account, which would lock them out of the system.

#### Steps

1. **Login as Admin**
   - Navigate to `http://127.0.0.1:5173`
   - Open DevTools Console tab
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load completely

2. **Navigate to Team Management**
   - Click "Sales" or navigate to `/#/sales`
   - Wait for the team members list to load
   - Verify the Admin user is visible in the list

3. **Locate your own Admin account**
   - Find `admin@test.com` in the team members list
   - This is your currently logged-in account
   - Click to open your own profile

4. **Navigate to Permissions tab**
   - Look for a "Permissions" tab or section
   - Click to access permission settings
   - Wait for the permissions panel to load

5. **Locate the Disabled toggle/checkbox**
   - Look for a "Disabled" or "Active" toggle
   - Note its current state (should be unchecked/active)
   - This control deactivates user accounts

6. **Attempt to disable your own account**
   - Try to toggle "Disabled" to true/checked
   - Or try to uncheck "Active" if that's the control
   - Observe what happens immediately

7. **Check for prevention mechanism**
   - Look for one of the following:
     - Toggle is disabled/grayed out for own account
     - Warning message appears before action
     - Action is blocked with error message
     - Confirmation dialog with warning

8. **If toggle is clickable, attempt to save**
   - If the toggle can be changed, click it
   - Click "Save" to attempt to apply changes
   - Observe the system response

9. **Verify prevention works**
   - Check for error messages
   - Verify your account is NOT disabled
   - Confirm you are still logged in
   - Refresh the page to verify

10. **Test post-action state**
    - Navigate away and back to `/#/sales`
    - Open your own profile again
    - Verify "Disabled" is still false/unchecked
    - Confirm full functionality remains

#### Expected Results

- [ ] System prevents Admin from disabling own account via one of:
  - Toggle is disabled/hidden for own account
  - Warning dialog appears and blocks action
  - Server rejects the save with error message
  - UI hides self-disable option entirely
- [ ] Admin remains logged in after attempt
- [ ] Clear feedback explaining why action is prevented
- [ ] No console errors from the prevention
- [ ] Account status unchanged after any attempts

#### Pass/Fail

- [ ] **PASS** - Self-disable is prevented with clear feedback
- [ ] **FAIL** - Admin can disable own account

#### Notes

_Document the prevention mechanism used:_

---

### Test C2: Admin Self-Demotion Shows Warning Dialog

**Objective:** Verify that when an Admin attempts to demote themselves to a lower role, a warning dialog appears requiring confirmation.

#### Steps

1. **Login as Admin**
   - Navigate to `http://127.0.0.1:5173`
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load

2. **Navigate to Team Management**
   - Navigate to `/#/sales`
   - Wait for team list to load

3. **Open your own Admin profile**
   - Find and click on `admin@test.com`
   - Wait for profile to load
   - Verify you're viewing your own account

4. **Navigate to Permissions tab**
   - Click on "Permissions" tab
   - Wait for permissions form to load
   - Note the current role (should be "Admin")

5. **Locate the role dropdown**
   - Find the Role dropdown/selector
   - Note available options (Admin, Manager, Rep)
   - Current selection should be "Admin"

6. **Attempt to change role to Manager**
   - Click the Role dropdown
   - Select "Manager" option
   - Observe immediate UI response

7. **Check for inline warning**
   - Look for warning text near the dropdown
   - Check for yellow/orange warning indicators
   - Note any "you will lose admin access" messages

8. **Click Save to trigger confirmation**
   - With role changed to "Manager", click "Save"
   - Observe what happens before save completes
   - Look for confirmation dialog

9. **Verify warning dialog appears**
   - Check for modal/popup confirmation
   - Verify it warns about losing Admin privileges
   - Confirm it requires explicit confirmation
   - Look for "Cancel" and "Confirm" buttons

10. **Cancel the demotion**
    - Click "Cancel" or close the dialog
    - Verify the role reverts to "Admin"
    - Confirm no changes were saved

11. **Verify account unchanged**
    - Refresh the page
    - Navigate back to your profile
    - Confirm role is still "Admin"
    - Verify full Admin access remains

#### Expected Results

- [ ] Role dropdown allows selecting lower roles
- [ ] Warning indicator appears when self-demotion selected
- [ ] Clicking Save shows confirmation dialog with:
  - Clear warning about losing Admin access
  - Explanation of consequences
  - Option to cancel
  - Explicit confirm button
- [ ] Canceling the dialog prevents the change
- [ ] Admin role preserved if user cancels
- [ ] No accidental demotions possible

#### Pass/Fail

- [ ] **PASS** - Warning dialog appears with clear consequences
- [ ] **FAIL** - Admin can demote self without warning

#### Notes

_Document the warning dialog text and behavior:_

---

### Test C3: Last Admin Cannot Be Demoted or Deleted

**Objective:** Verify that the system prevents demoting or deleting the last remaining Admin user, which would leave the system without administrative access.

#### Prerequisites

- Verify only ONE admin exists in the system
- If multiple admins exist, temporarily demote others for this test

#### Steps

1. **Login as the only Admin**
   - Navigate to `http://127.0.0.1:5173`
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load

2. **Verify Admin count**
   - Navigate to `/#/sales`
   - Count users with Admin role
   - Confirm only ONE Admin exists
   - If multiple exist, this test requires setup

3. **Navigate to your own profile**
   - Find and click on `admin@test.com`
   - Wait for profile to load

4. **Go to Permissions tab**
   - Click on "Permissions" tab
   - Verify role shows "Admin"

5. **Attempt to demote to Manager**
   - Change Role dropdown to "Manager"
   - Click "Save"
   - Observe system response

6. **Check for last-admin protection**
   - Look for error message about "last admin"
   - Check for blocking dialog
   - Verify the save is rejected
   - Note the exact error message

7. **Attempt to demote to Rep**
   - Reset role to Admin if needed
   - Change Role dropdown to "Rep"
   - Click "Save"
   - Verify same protection applies

8. **Verify demotion blocked**
   - Refresh the page
   - Confirm role is still "Admin"
   - Verify you still have full access

9. **Attempt to delete own account**
   - Look for Delete button on profile
   - If visible, click to delete
   - Observe system response

10. **Verify deletion blocked**
    - Check for "last admin" error message
    - Verify account is NOT deleted
    - Confirm you remain logged in
    - Refresh to verify account exists

11. **Test with new admin (optional)**
    - Create a new admin user
    - Retry demotion of original admin
    - Should now succeed (not last admin)
    - Clean up by reverting changes

#### Expected Results

- [ ] System detects when demoting/deleting last Admin
- [ ] Action is blocked with clear error message:
  - "Cannot demote the last administrator"
  - "At least one admin required"
  - Or similar protective message
- [ ] Save/Delete button may be:
  - Disabled for last admin
  - Shows error on click
  - Blocked by server validation
- [ ] Admin account preserved after all attempts
- [ ] If another admin exists, demotion succeeds
- [ ] Clear explanation of why action is blocked

#### Pass/Fail

- [ ] **PASS** - Last admin protected from demotion/deletion
- [ ] **FAIL** - System allows removing last admin

#### Notes

_Document protection mechanism and error messages:_

---

## Section D: Data Integrity

These tests verify that user deletion and status changes are handled correctly regarding associated data.

---

### Test D1: Delete User with Assigned Contacts - Graceful Handling

**Objective:** Verify that when a user with assigned contacts is deleted, the system handles the orphaned contacts gracefully (either reassigning them or allowing them to remain with null assignment).

#### Steps

1. **Login as Admin**
   - Navigate to `http://127.0.0.1:5173`
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load

2. **Create a test user for deletion**
   - Navigate to `/#/sales` (Team Management)
   - Click "Add Team Member" or similar
   - Create user with:
     - Name: `Delete Test User`
     - Email: `deletetest@example.com`
     - Role: Rep
   - Save the new user
   - Note the user ID

3. **Create or assign contacts to this test user**
   - Navigate to `/#/contacts`
   - Click on an existing contact
   - Edit the contact
   - Set Account Manager to `Delete Test User`
   - Save the contact
   - Repeat for 2-3 contacts
   - Note the contact IDs assigned

4. **Verify assignments exist**
   - View each assigned contact
   - Confirm Account Manager shows `Delete Test User`
   - This establishes the relationship

5. **Navigate back to Team Management**
   - Go to `/#/sales`
   - Find `Delete Test User` in the list
   - Click to open their profile

6. **Initiate user deletion**
   - Look for Delete or Remove button
   - Click to initiate deletion
   - Observe any warning messages

7. **Check for reassignment options**
   - Look for prompt about assigned contacts
   - Check if system offers:
     - Reassign contacts to another user
     - Keep contacts with null assignment
     - Prevent deletion until reassigned
   - Document the options presented

8. **Proceed with deletion**
   - If prompted, choose an option
   - Confirm the deletion
   - Wait for completion

9. **Verify user is deleted**
   - Check that user no longer appears in team list
   - Try to access their profile directly
   - Confirm 404 or redirect

10. **Check the previously assigned contacts**
    - Navigate to `/#/contacts`
    - Find the contacts that were assigned to deleted user
    - Open each contact and check Account Manager field
    - Verify they were:
      - Reassigned to another user, OR
      - Set to null/unassigned, OR
      - Handled according to chosen option

11. **Verify contacts are still accessible**
    - Confirm contacts can still be viewed
    - Confirm contacts can still be edited
    - Verify no data was lost

#### Expected Results

- [ ] User deletion succeeds or fails gracefully
- [ ] If deletion succeeds:
  - Contacts are not deleted with the user
  - Contacts either reassigned or set to null
  - No foreign key constraint errors
- [ ] If deletion blocked:
  - Clear message about assigned contacts
  - Guidance on how to proceed
- [ ] All contacts remain intact and accessible
- [ ] No orphaned data or broken references
- [ ] No console errors during process

#### Pass/Fail

- [ ] **PASS** - Contacts handled gracefully, user deleted
- [ ] **FAIL** - Contacts lost, or system crashed

#### Notes

_Document how the system handled the assigned contacts:_

---

### Test D2: Delete User with Assigned Opportunities - Graceful Handling

**Objective:** Verify that when a user with assigned opportunities is deleted, the system handles the orphaned opportunities gracefully.

#### Steps

1. **Login as Admin**
   - Navigate to `http://127.0.0.1:5173`
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load

2. **Create or identify a test user**
   - Navigate to `/#/sales`
   - Either use `Delete Test User` from Test D1, or
   - Create new user: `Opp Delete Test` / `oppdel@example.com`
   - Save if creating new user

3. **Create or assign opportunities to this user**
   - Navigate to `/#/opportunities`
   - Create a new opportunity or edit existing
   - Set the Account Manager to the test user
   - Save the opportunity
   - Repeat for 2-3 opportunities
   - Note the opportunity IDs

4. **Verify opportunity assignments**
   - Open each assigned opportunity
   - Confirm Account Manager shows test user
   - Document the opportunities assigned

5. **Navigate to Team Management**
   - Go to `/#/sales`
   - Find the test user
   - Click to open their profile

6. **Initiate user deletion**
   - Click Delete or Remove button
   - Watch for warning about assigned opportunities

7. **Check for reassignment prompts**
   - Look for options regarding opportunities:
     - Reassign to another rep
     - Leave unassigned
     - Block deletion until handled
   - Document options presented

8. **Proceed with deletion**
   - Choose appropriate option if prompted
   - Confirm the deletion
   - Wait for completion

9. **Verify user is deleted**
   - Confirm user no longer in team list
   - Verify cannot access their profile

10. **Check the previously assigned opportunities**
    - Navigate to `/#/opportunities`
    - Find opportunities that were assigned to deleted user
    - Open each and check Account Manager field
    - Verify proper handling:
      - Reassigned to another user, OR
      - Set to null/unassigned, OR
      - Handled per chosen option

11. **Verify opportunities remain functional**
    - Confirm opportunities can still be viewed
    - Confirm opportunities can be edited
    - Verify pipeline stages still work
    - Check that no data was lost

#### Expected Results

- [ ] User deletion completes (or fails gracefully with guidance)
- [ ] If deletion succeeds:
  - Opportunities are NOT deleted
  - Opportunities either reassigned or nullified
  - No foreign key errors
- [ ] If deletion blocked:
  - Clear message about assigned opportunities
  - Instructions for proceeding
- [ ] All opportunities remain intact
- [ ] Pipeline and deal tracking still functional
- [ ] No console errors during process

#### Pass/Fail

- [ ] **PASS** - Opportunities handled gracefully
- [ ] **FAIL** - Opportunities lost or system crashed

#### Notes

_Document how opportunities were handled:_

---

### Test D3: Disabled User Removed from Account Manager Dropdown

**Objective:** Verify that when a user is disabled, they no longer appear in the Account Manager dropdown when creating or editing opportunities and contacts.

#### Steps

1. **Login as Admin**
   - Navigate to `http://127.0.0.1:5173`
   - Login as Admin: `admin@test.com` / `password123`
   - Wait for dashboard to load

2. **Create a test user to disable**
   - Navigate to `/#/sales`
   - Click "Add Team Member"
   - Create user:
     - Name: `Disable Dropdown Test`
     - Email: `disabletest@example.com`
     - Role: Rep
   - Save the new user
   - Note the exact display name

3. **Verify user appears in dropdowns BEFORE disabling**
   - Navigate to `/#/opportunities/create`
   - Wait for form to load
   - Click on Account Manager dropdown
   - Scroll/search for `Disable Dropdown Test`
   - Confirm the user IS visible in the list
   - Close the dropdown (press Escape)

4. **Also check contact form**
   - Navigate to `/#/contacts/create`
   - Click on Account Manager dropdown
   - Confirm `Disable Dropdown Test` appears
   - Close the dropdown

5. **Navigate back to Team Management**
   - Go to `/#/sales`
   - Find `Disable Dropdown Test`
   - Click to open their profile

6. **Disable the user**
   - Click on "Permissions" tab
   - Find the "Disabled" or "Active" toggle
   - Set to Disabled (toggle on) or Inactive (toggle off)
   - Click "Save"
   - Wait for save confirmation

7. **Verify user is disabled**
   - Refresh the page
   - Check user profile shows disabled status
   - User may appear grayed out in team list

8. **Check opportunity create form**
   - Navigate to `/#/opportunities/create`
   - Wait for form to load completely
   - Click on Account Manager dropdown
   - Search for `Disable Dropdown Test`

9. **Verify disabled user NOT in dropdown**
   - Confirm the disabled user does NOT appear
   - Or if visible, is marked as "disabled" and unselectable
   - Try typing their name in search
   - Verify they cannot be selected

10. **Check contact create form**
    - Navigate to `/#/contacts/create`
    - Click on Account Manager dropdown
    - Search for `Disable Dropdown Test`
    - Verify user NOT in dropdown

11. **Check opportunity edit form**
    - Navigate to `/#/opportunities`
    - Click on any existing opportunity
    - Click Edit
    - Open Account Manager dropdown
    - Verify disabled user NOT selectable

12. **Clean up: Re-enable the test user**
    - Go to `/#/sales`
    - Open `Disable Dropdown Test`
    - Re-enable the account
    - Save changes

#### Expected Results

- [ ] Before disabling: User appears in Account Manager dropdown
- [ ] Disabling user succeeds
- [ ] After disabling: User does NOT appear in:
  - Opportunity create form dropdown
  - Opportunity edit form dropdown
  - Contact create form dropdown
  - Contact edit form dropdown
- [ ] If disabled user appears, they are:
  - Marked as disabled/inactive, AND
  - Not selectable
- [ ] Existing assignments to this user remain (not auto-cleared)
- [ ] No console errors during form loading
- [ ] Dropdown performance not affected

#### Pass/Fail

- [ ] **PASS** - Disabled user removed from all dropdowns
- [ ] **FAIL** - Disabled user still selectable in forms

#### Notes

_Document dropdown behavior for disabled users:_

---

## Summary

### Test Results Overview

| Test | Status | Notes |
|------|--------|-------|
| A1: Edit conflict detection | [ ] Pass / [ ] Fail | |
| A2: Delete while editing | [ ] Pass / [ ] Fail | |
| B1: User demoted mid-session | [ ] Pass / [ ] Fail | |
| B2: User promoted mid-session | [ ] Pass / [ ] Fail | |
| C1: Admin cannot disable self | [ ] Pass / [ ] Fail | |
| C2: Admin self-demotion warning | [ ] Pass / [ ] Fail | |
| C3: Last admin protection | [ ] Pass / [ ] Fail | |
| D1: Delete user with contacts | [ ] Pass / [ ] Fail | |
| D2: Delete user with opportunities | [ ] Pass / [ ] Fail | |
| D3: Disabled user dropdown removal | [ ] Pass / [ ] Fail | |

### Pass Criteria

- **All 10 tests must pass** for edge cases testing to be considered successful
- Document all unexpected behaviors
- Report issues that block test completion

### Next Steps

If all tests pass:
- Proceed to Test 6 (final RBAC test in the suite)
- Document any edge cases discovered during testing

If any tests fail:
- Document the failure with screenshots
- Report to development team with reproduction steps
- Do NOT proceed to Test 6 until failures are resolved

---

## Testing Notes

### Browser Session Management

These tests require multiple simultaneous browser sessions:

1. **Primary Session:** Chrome browser, logged in as one user
2. **Secondary Session:** Chrome Incognito OR Firefox, logged in as different user

**Important:** Regular Chrome windows share session storage. Use Incognito or a different browser for the second session.

### Console Monitoring

For all tests, monitor browser DevTools Console for:

- **RLS Errors:** "permission denied", "policy", "42501"
- **React Errors:** Component errors, hook violations
- **Network Errors:** 500, 403, 401 status codes
- **JavaScript Exceptions:** Uncaught errors, promise rejections

### Timestamp Usage

When creating test records, include timestamps for uniqueness:
- Format: `[Test Name] YYYY-MM-DD HH:MM`
- Example: `Delete Test 2025-12-26 14:30`

### Cleanup

After completing tests:
1. Delete any test users created
2. Restore any demoted/promoted users to original roles
3. Clear test data if needed
4. Document which test data remains for future reference
