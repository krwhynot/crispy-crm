# Edge Cases & Error Handling Manual Testing Checklist

Manual E2E testing checklist for edge cases, error handling, and data integrity scenarios. TEST 5 of the progressive 6-test RBAC suite.

## Prerequisites

**Before running these tests:**
- Tests 1-4 of the RBAC suite must pass
- Seed data loaded (`just seed-e2e`)
- Multiple browser windows/profiles available for concurrent testing

## Test Environment Setup

- **Browser 1:** Chrome (normal window)
- **Browser 2:** Chrome (incognito/private window) OR Firefox
- **URL:** http://localhost:5173
- **Test Credentials:**
  - Admin: admin@test.com / password123
  - Manager: manager@mfbroker.com / password123
  - Rep: rep@mfbroker.com / password123

## Important Notes

- These tests require multiple browser sessions running simultaneously
- Use incognito/private windows to avoid session conflicts
- Document any unexpected behavior carefully with screenshots
- Console errors should be captured for debugging

---

## Section A: Concurrent Modifications

### Test A1: Edit Conflict Detection (Two Users Edit Same Record)

**Objective:** Verify the application detects and handles when two users attempt to edit the same record simultaneously.

**Prerequisites:**
- Two browser windows open
- Browser 1: Logged in as admin@test.com
- Browser 2 (incognito): Logged in as manager@mfbroker.com

**Steps:**

1. **Browser 1:** Open browser DevTools (F12) and navigate to Console tab
2. **Browser 1:** Navigate to http://localhost:5173/#/contacts
3. **Browser 1:** Wait for contacts list to load completely
4. **Browser 1:** Click on any contact to open the edit view
5. **Browser 1:** Note the contact's current First Name value
6. **Browser 1:** Click into the First Name field but DO NOT save yet
7. **Browser 2:** Open browser DevTools (F12) and navigate to Console tab
8. **Browser 2:** Navigate to http://localhost:5173/#/contacts
9. **Browser 2:** Wait for contacts list to load completely
10. **Browser 2:** Click on the SAME contact that Browser 1 has open
11. **Browser 2:** Modify the First Name to a different value (e.g., "ConflictTest-B2-[timestamp]")
12. **Browser 2:** Click "Save" or "Save & Close"
13. **Browser 2:** Verify the save completes successfully
14. **Browser 1:** Modify the First Name to a different value (e.g., "ConflictTest-B1-[timestamp]")
15. **Browser 1:** Click "Save" or "Save & Close"
16. **Browser 1:** Observe the result

**Expected Results:**

- [ ] Browser 2's save completes successfully (they saved first)
- [ ] Browser 1 receives one of the following:
  - [ ] Error message indicating the record was modified by another user
  - [ ] Stale data warning with option to reload
  - [ ] Optimistic concurrency conflict notification
  - [ ] OR: Save succeeds but overwrites Browser 2's changes (document this behavior)
- [ ] No application crash or white screen
- [ ] No unhandled JavaScript errors in Console
- [ ] No RLS (Row-Level Security) errors in Console

**Console Monitoring:**
- Watch for: "conflict", "stale", "modified", "version", "etag"
- Watch for HTTP 409 (Conflict) status codes in Network tab
- Watch for any React error boundaries triggering

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior:
_______________________________________________
```

---

### Test A2: Delete While Another User Is Editing

**Objective:** Verify the application handles gracefully when a record is deleted while another user has it open for editing.

**Prerequisites:**
- Two browser windows open
- Browser 1: Logged in as admin@test.com
- Browser 2 (incognito): Logged in as admin@test.com (or another admin)
- A test user/contact exists that can be deleted

**Steps:**

1. **Browser 1:** Open browser DevTools (F12) and navigate to Console tab
2. **Browser 1:** Navigate to http://localhost:5173/#/sales
3. **Browser 1:** Wait for team members list to load completely
4. **Browser 1:** Locate a test team member that is safe to delete (not yourself)
5. **Browser 1:** Click on the team member to open the edit panel/form
6. **Browser 1:** Note the team member's name and current field values
7. **Browser 1:** Make a small change to a field (e.g., modify job title) but DO NOT save
8. **Browser 2:** Open browser DevTools (F12) and navigate to Console tab
9. **Browser 2:** Navigate to http://localhost:5173/#/sales
10. **Browser 2:** Wait for team members list to load completely
11. **Browser 2:** Locate the SAME team member that Browser 1 is editing
12. **Browser 2:** Click the delete action (trash icon or delete button)
13. **Browser 2:** Confirm the deletion if a confirmation dialog appears
14. **Browser 2:** Wait for deletion to complete (team member disappears from list)
15. **Browser 1:** Click "Save" or "Save & Close" to attempt saving changes
16. **Browser 1:** Observe the result

**Expected Results:**

- [ ] Browser 2's delete completes successfully
- [ ] Browser 1 receives one of the following:
  - [ ] Error message: "Record not found" or "Record has been deleted"
  - [ ] Redirect to list page with notification
  - [ ] 404 error handled gracefully with user-friendly message
  - [ ] Save fails with clear explanation
- [ ] No application crash or white screen in either browser
- [ ] No unhandled JavaScript errors in Console
- [ ] Form does not appear to succeed silently (no false positive)
- [ ] User is not left in a broken state (can navigate away)

**Console Monitoring:**
- Watch for: HTTP 404 status codes in Network tab
- Watch for: "not found", "deleted", "does not exist" messages
- Watch for React error boundaries or error overlays

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior:
_______________________________________________
```

---

## Section B: Role Changes Mid-Session

### Test B1: User Demoted During Session - Permissions Update

**Objective:** Verify that when a user's role is demoted by an admin, their permissions are updated on the next action or page refresh.

**Prerequisites:**
- Two browser windows open
- Browser 1: Logged in as admin@test.com
- Browser 2: Logged in as manager@mfbroker.com (the user to be demoted)
- Note the current permissions of manager@mfbroker.com

**Steps:**

1. **Browser 2:** Open browser DevTools (F12) and navigate to Console tab
2. **Browser 2:** Navigate to http://localhost:5173/#/sales
3. **Browser 2:** Verify you can see the team members list (manager permission)
4. **Browser 2:** Note what actions are available (edit buttons, delete buttons, etc.)
5. **Browser 2:** Leave this page open - do not navigate away yet
6. **Browser 1:** Open browser DevTools (F12) and navigate to Console tab
7. **Browser 1:** Navigate to http://localhost:5173/#/sales
8. **Browser 1:** Wait for team members list to load
9. **Browser 1:** Click on the manager@mfbroker.com user
10. **Browser 1:** Navigate to the "Permissions" tab in the edit panel
11. **Browser 1:** Change the role dropdown from "Manager" to "Rep"
12. **Browser 1:** Click "Save" or "Save & Close"
13. **Browser 1:** Verify the role change saved successfully
14. **Browser 2:** Refresh the page (F5 or Ctrl+R)
15. **Browser 2:** Wait for page to reload completely
16. **Browser 2:** Observe what permissions are now available
17. **Browser 2:** Attempt to access an admin-only feature (if any were visible before)

**Expected Results:**

- [ ] Browser 1 successfully changes the manager's role to rep
- [ ] Browser 2 after refresh shows reduced permissions:
  - [ ] May not see all team members (reps see own data only)
  - [ ] Edit/delete buttons may be hidden or disabled
  - [ ] Some menu items may disappear
- [ ] Browser 2 does NOT retain cached manager permissions
- [ ] No RLS policy errors in Console
- [ ] No authentication/authorization errors that crash the app
- [ ] User gets appropriate feedback if trying restricted actions

**Console Monitoring:**
- Watch for: "permission denied", "unauthorized", "403" status codes
- Watch for RLS policy violations
- Verify no cached permissions are being used

**Post-Test Cleanup:**
1. **Browser 1:** Navigate back to /#/sales
2. **Browser 1:** Find the demoted user
3. **Browser 1:** Restore their role to "Manager"
4. **Browser 1:** Save changes

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior:
_______________________________________________
```

---

### Test B2: User Promoted During Session - New Permissions Available

**Objective:** Verify that when a user's role is promoted by an admin, they gain new permissions after refreshing their session.

**Prerequisites:**
- Two browser windows open
- Browser 1: Logged in as admin@test.com
- Browser 2: Logged in as rep@mfbroker.com (the user to be promoted)
- Note the current limited permissions of rep@mfbroker.com

**Steps:**

1. **Browser 2:** Open browser DevTools (F12) and navigate to Console tab
2. **Browser 2:** Navigate to http://localhost:5173/#/sales
3. **Browser 2:** Observe current permissions (rep should have limited access)
4. **Browser 2:** Note what is visible/accessible:
   - [ ] Can see all team members or only self?
   - [ ] Are edit buttons visible?
   - [ ] Are delete buttons visible?
5. **Browser 2:** Leave this page open - do not navigate away yet
6. **Browser 1:** Open browser DevTools (F12) and navigate to Console tab
7. **Browser 1:** Navigate to http://localhost:5173/#/sales
8. **Browser 1:** Wait for team members list to load
9. **Browser 1:** Click on the rep@mfbroker.com user
10. **Browser 1:** Navigate to the "Permissions" tab in the edit panel
11. **Browser 1:** Change the role dropdown from "Rep" to "Manager"
12. **Browser 1:** Click "Save" or "Save & Close"
13. **Browser 1:** Verify the role change saved successfully
14. **Browser 2:** Refresh the page (F5 or Ctrl+R)
15. **Browser 2:** Wait for page to reload completely
16. **Browser 2:** Observe what new permissions are now available
17. **Browser 2:** Attempt to access a manager-level feature

**Expected Results:**

- [ ] Browser 1 successfully changes the rep's role to manager
- [ ] Browser 2 after refresh shows elevated permissions:
  - [ ] Can see more team members (all assigned or team-wide)
  - [ ] Edit buttons become visible/enabled
  - [ ] Delete buttons become visible/enabled
  - [ ] Additional menu items may appear
- [ ] New permissions work correctly (can actually perform actions)
- [ ] No RLS policy errors in Console
- [ ] No stale permission cache issues

**Console Monitoring:**
- Watch for successful API calls that were previously forbidden
- Verify no 403/401 errors on newly accessible features
- Check Network tab for proper permission-gated API responses

**Post-Test Cleanup:**
1. **Browser 1:** Navigate back to /#/sales
2. **Browser 1:** Find the promoted user
3. **Browser 1:** Restore their role to "Rep"
4. **Browser 1:** Save changes

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior:
_______________________________________________
```

---

## Section C: Self-Operations Prevention

### Test C1: Admin Cannot Disable Own Account

**Objective:** Verify that an admin cannot disable their own account, as this would lock them out of the system.

**Prerequisites:**
- Browser logged in as admin@test.com
- admin@test.com has admin role

**Steps:**

1. Open browser DevTools (F12) and navigate to Console tab
2. Navigate to http://localhost:5173/#/sales
3. Wait for team members list to load completely
4. Locate your own user account (admin@test.com) in the list
5. Click on your own account to open the edit panel
6. Navigate to the "Permissions" tab
7. Locate the "Disabled" toggle or checkbox field
8. Note the current state of the Disabled field (should be false/off)
9. Attempt to toggle the Disabled field to true/on
10. If the toggle is interactive, click it
11. Observe immediate UI feedback (if any)
12. If no immediate block, click "Save" or "Save & Close"
13. Observe the result

**Expected Results:**

- [ ] ONE of the following occurs:
  - [ ] The Disabled toggle is not visible for your own account
  - [ ] The Disabled toggle is visible but disabled/grayed out
  - [ ] Clicking the toggle shows an immediate warning/error
  - [ ] Saving is blocked with error: "Cannot disable your own account"
  - [ ] API returns error preventing self-disable
- [ ] Account remains enabled after all attempts
- [ ] No application crash
- [ ] User can continue using the application
- [ ] Clear user feedback explaining why the action is blocked

**Console Monitoring:**
- Watch for validation error messages
- Watch for API error responses with clear messages
- Verify no successful disable API call is made

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior:
_______________________________________________
```

---

### Test C2: Admin Self-Demotion Shows Warning Dialog

**Objective:** Verify that when an admin attempts to demote themselves to a lower role, a confirmation warning is shown to prevent accidental lockout.

**Prerequisites:**
- Browser logged in as admin@test.com
- admin@test.com has admin role
- At least one other admin exists (to prevent last admin scenarios)

**Steps:**

1. Open browser DevTools (F12) and navigate to Console tab
2. Navigate to http://localhost:5173/#/sales
3. Wait for team members list to load completely
4. Locate your own user account (admin@test.com) in the list
5. Click on your own account to open the edit panel
6. Navigate to the "Permissions" tab
7. Locate the "Role" dropdown field
8. Note the current role value (should be "Admin")
9. Click the Role dropdown to open options
10. Select "Rep" from the dropdown options
11. Observe immediate UI feedback (if any)
12. If no immediate block, click "Save" or "Save & Close"
13. Observe what happens next

**Expected Results:**

- [ ] ONE of the following occurs:
  - [ ] Role dropdown is disabled/not editable for own account
  - [ ] Selecting a lower role shows immediate warning message
  - [ ] Clicking Save triggers a confirmation dialog:
    - [ ] Dialog clearly warns about losing admin access
    - [ ] Dialog has "Cancel" and "Confirm" buttons
    - [ ] Cancel aborts the operation
    - [ ] Confirm allows the demotion (if other admins exist)
  - [ ] API prevents self-demotion with clear error message
- [ ] Warning message is clear: "You will lose admin access"
- [ ] User has opportunity to cancel before losing permissions
- [ ] No application crash during this flow

**Console Monitoring:**
- Watch for confirmation dialog events
- Watch for validation warnings
- Check for proper state management during dialog flow

**If Dialog Appears - Additional Steps:**
14. Click "Cancel" in the confirmation dialog
15. Verify the role reverts to "Admin"
16. Verify no changes were saved
17. Verify you still have admin access

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior:
_______________________________________________
```

---

### Test C3: Last Admin Cannot Be Demoted or Deleted

**Objective:** Verify that the last remaining admin account cannot be demoted or deleted, preventing complete admin lockout.

**Prerequisites:**
- Browser logged in as admin@test.com
- ONLY ONE admin exists in the system (may need to demote other admins first)
- Backup plan: Know how to restore admin via Supabase dashboard if needed

**Important Warning:**
This test could potentially lock you out of admin access if it fails. Ensure you have Supabase dashboard access to restore admin privileges if needed.

**Steps:**

1. **Verify Single Admin Status:**
   a. Open browser DevTools (F12) and navigate to Console tab
   b. Navigate to http://localhost:5173/#/sales
   c. Count how many users have "Admin" role
   d. If more than one admin exists, demote others first (document who)
   e. Confirm only admin@test.com has admin role

2. **Attempt Self-Demotion:**
   a. Click on admin@test.com in the team members list
   b. Navigate to the "Permissions" tab
   c. Attempt to change role from "Admin" to "Rep"
   d. Click "Save" if the UI allows

3. **Observe Result of Demotion Attempt:**
   a. Note any error messages or warnings
   b. Check if save was blocked or allowed

4. **Attempt Self-Deletion (if demotion blocked):**
   a. Navigate back to /#/sales list view
   b. Locate delete button/action for admin@test.com
   c. Attempt to delete your own account
   d. Confirm deletion if prompted

5. **Observe Result of Deletion Attempt:**
   a. Note any error messages or warnings
   b. Check if deletion was blocked or allowed

**Expected Results:**

- [ ] System detects this is the last admin account
- [ ] Demotion attempt is blocked with clear error:
  - [ ] "Cannot demote the last admin" or similar
  - [ ] Error appears BEFORE changes are saved
- [ ] Deletion attempt is blocked with clear error:
  - [ ] "Cannot delete the last admin" or similar
  - [ ] Confirmation dialog prevents completion OR API rejects
- [ ] No application crash
- [ ] Admin account remains intact with admin role
- [ ] User receives actionable guidance (e.g., "Promote another user to admin first")

**Console Monitoring:**
- Watch for: "last admin", "cannot demote", "cannot delete"
- Watch for API validation errors
- Verify no successful demotion/deletion API calls

**Post-Test Cleanup:**
1. If other admins were demoted, restore their admin role
2. Verify system has appropriate number of admins again

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior:
_______________________________________________
```

---

## Section D: Data Integrity

### Test D1: Delete User with Assigned Contacts - Graceful Handling

**Objective:** Verify that when a user with assigned contacts is deleted, the contacts are handled gracefully (not deleted, remain accessible).

**Prerequisites:**
- Browser logged in as admin@test.com
- Create or identify a test user with assigned contacts
- Document the contacts assigned to the test user

**Steps:**

1. **Setup - Identify Test User and Contacts:**
   a. Open browser DevTools (F12) and navigate to Console tab
   b. Navigate to http://localhost:5173/#/sales
   c. Identify a test user (not admin@test.com) - note their name
   d. Navigate to http://localhost:5173/#/contacts
   e. Filter or search for contacts assigned to the test user
   f. Document 2-3 contact names assigned to this user

2. **Verify Contacts Before Deletion:**
   a. Click on one of the documented contacts
   b. Verify the "Account Manager" field shows the test user's name
   c. Note the contact ID from the URL (/#/contacts/{id})
   d. Close the contact panel

3. **Delete the Test User:**
   a. Navigate to http://localhost:5173/#/sales
   b. Locate the test user in the team members list
   c. Click the delete button/action for this user
   d. If confirmation dialog appears, note its content
   e. Check if warning mentions assigned contacts
   f. Confirm the deletion

4. **Observe Deletion Result:**
   a. Note any success/error messages
   b. Verify the user is removed from the team list

5. **Verify Contacts After Deletion:**
   a. Navigate to http://localhost:5173/#/contacts
   b. Search for the contacts you documented earlier
   c. Click on each contact to verify they still exist
   d. Check the "Account Manager" field for each contact

**Expected Results:**

- [ ] User deletion completes successfully (or with appropriate warning)
- [ ] ONE of the following for orphaned contacts:
  - [ ] Contacts remain with Account Manager field cleared/null
  - [ ] Contacts remain with Account Manager showing "[Deleted User]"
  - [ ] Contacts are reassigned to a default user (document who)
  - [ ] Deletion is blocked until contacts are reassigned (with clear message)
- [ ] Contacts are NOT deleted along with the user
- [ ] Contacts remain accessible in the contacts list
- [ ] Contacts can still be edited
- [ ] No RLS errors when viewing orphaned contacts
- [ ] No application crash

**Console Monitoring:**
- Watch for foreign key constraint messages
- Watch for cascade behavior logs
- Verify no 500 errors during deletion

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior (Deletion):
_______________________________________________

Contact Status After Deletion:
_______________________________________________
```

---

### Test D2: Delete User with Assigned Opportunities - Graceful Handling

**Objective:** Verify that when a user with assigned opportunities is deleted, the opportunities are handled gracefully (not deleted, remain accessible).

**Prerequisites:**
- Browser logged in as admin@test.com
- Create or identify a test user with assigned opportunities
- Document the opportunities assigned to the test user

**Steps:**

1. **Setup - Identify Test User and Opportunities:**
   a. Open browser DevTools (F12) and navigate to Console tab
   b. Navigate to http://localhost:5173/#/sales
   c. Identify a test user (not admin@test.com) - note their name
   d. Navigate to http://localhost:5173/#/opportunities
   e. Filter or search for opportunities assigned to the test user
   f. Document 2-3 opportunity names assigned to this user

2. **Verify Opportunities Before Deletion:**
   a. Click on one of the documented opportunities
   b. Verify the "Account Manager" or "Owner" field shows the test user's name
   c. Note the opportunity ID from the URL (/#/opportunities/{id})
   d. Close the opportunity panel

3. **Delete the Test User:**
   a. Navigate to http://localhost:5173/#/sales
   b. Locate the test user in the team members list
   c. Click the delete button/action for this user
   d. If confirmation dialog appears, note its content
   e. Check if warning mentions assigned opportunities
   f. Confirm the deletion

4. **Observe Deletion Result:**
   a. Note any success/error messages
   b. Verify the user is removed from the team list

5. **Verify Opportunities After Deletion:**
   a. Navigate to http://localhost:5173/#/opportunities
   b. Search for the opportunities you documented earlier
   c. Click on each opportunity to verify they still exist
   d. Check the "Account Manager" or "Owner" field for each opportunity
   e. Verify opportunity stage and other data is intact

**Expected Results:**

- [ ] User deletion completes successfully (or with appropriate warning)
- [ ] ONE of the following for orphaned opportunities:
  - [ ] Opportunities remain with owner field cleared/null
  - [ ] Opportunities remain with owner showing "[Deleted User]"
  - [ ] Opportunities are reassigned to a default user (document who)
  - [ ] Deletion is blocked until opportunities are reassigned (with clear message)
- [ ] Opportunities are NOT deleted along with the user
- [ ] Opportunities remain accessible in the opportunities list
- [ ] Opportunities can still be edited and moved through pipeline stages
- [ ] No RLS errors when viewing orphaned opportunities
- [ ] No application crash

**Console Monitoring:**
- Watch for foreign key constraint messages
- Watch for cascade behavior logs
- Verify no 500 errors during deletion

**Notes:**
_Document actual behavior observed:_
```
Actual Behavior (Deletion):
_______________________________________________

Opportunity Status After Deletion:
_______________________________________________
```

---

### Test D3: Disabled User Removed from Account Manager Dropdown

**Objective:** Verify that when a user is disabled, they no longer appear as an option in the Account Manager dropdown when creating or editing records.

**Prerequisites:**
- Browser logged in as admin@test.com
- A test user exists who can be disabled (not admin@test.com)
- Note the test user's name for reference

**Steps:**

1. **Verify User Appears in Dropdown BEFORE Disabling:**
   a. Open browser DevTools (F12) and navigate to Console tab
   b. Navigate to http://localhost:5173/#/opportunities/create
   c. Wait for the create form to load completely
   d. Locate the "Account Manager" dropdown field
   e. Click to open the dropdown
   f. Scroll through options and verify the test user's name appears
   g. Close the dropdown without selecting
   h. Navigate away from create form (/#/opportunities)

2. **Disable the Test User:**
   a. Navigate to http://localhost:5173/#/sales
   b. Wait for team members list to load
   c. Click on the test user to open edit panel
   d. Navigate to the "Permissions" tab
   e. Locate the "Disabled" toggle/checkbox
   f. Toggle Disabled to true/on
   g. Click "Save" or "Save & Close"
   h. Verify the save completed successfully

3. **Verify User Does NOT Appear in Dropdown AFTER Disabling:**
   a. Navigate to http://localhost:5173/#/opportunities/create
   b. Wait for the create form to load completely
   c. Locate the "Account Manager" dropdown field
   d. Click to open the dropdown
   e. Search or scroll through ALL options
   f. Verify the disabled user's name does NOT appear

4. **Test Edit Form Dropdown Also:**
   a. Navigate to http://localhost:5173/#/opportunities
   b. Click on any existing opportunity to edit
   c. Locate the "Account Manager" dropdown field
   d. Click to open the dropdown
   e. Verify the disabled user does NOT appear in options

5. **Verify Contacts Dropdown Also:**
   a. Navigate to http://localhost:5173/#/contacts/create
   b. Locate the "Account Manager" dropdown field
   c. Click to open the dropdown
   d. Verify the disabled user does NOT appear in options

**Expected Results:**

- [ ] Test user appears in dropdown BEFORE being disabled
- [ ] Disabling the user succeeds
- [ ] AFTER disabling:
  - [ ] User does NOT appear in Opportunity create dropdown
  - [ ] User does NOT appear in Opportunity edit dropdown
  - [ ] User does NOT appear in Contact create dropdown
  - [ ] User does NOT appear in Contact edit dropdown
- [ ] Dropdown options load correctly (no errors)
- [ ] Existing records assigned to disabled user still show their name (read-only)
- [ ] No RLS errors when loading dropdowns
- [ ] No application crash

**Console Monitoring:**
- Watch for API calls to load dropdown options
- Verify response filters out disabled users
- Check for any caching issues (stale data)

**Post-Test Cleanup:**
1. Navigate to http://localhost:5173/#/sales
2. Click on the disabled test user
3. Navigate to "Permissions" tab
4. Toggle Disabled back to false/off
5. Save changes

**Notes:**
_Document actual behavior observed:_
```
Before Disabling - User in dropdown: [ ] Yes  [ ] No

After Disabling - User in dropdowns:
- Opportunity Create: [ ] Visible (BUG)  [ ] Hidden (CORRECT)
- Opportunity Edit:   [ ] Visible (BUG)  [ ] Hidden (CORRECT)
- Contact Create:     [ ] Visible (BUG)  [ ] Hidden (CORRECT)
- Contact Edit:       [ ] Visible (BUG)  [ ] Hidden (CORRECT)
```

---

## Summary Checklist

### Section A: Concurrent Modifications
- [ ] A1: Edit conflict detection - PASS / FAIL
- [ ] A2: Delete while editing - PASS / FAIL

### Section B: Role Changes Mid-Session
- [ ] B1: Demotion updates permissions - PASS / FAIL
- [ ] B2: Promotion grants new permissions - PASS / FAIL

### Section C: Self-Operations Prevention
- [ ] C1: Cannot disable own account - PASS / FAIL
- [ ] C2: Self-demotion shows warning - PASS / FAIL
- [ ] C3: Last admin protected - PASS / FAIL

### Section D: Data Integrity
- [ ] D1: User deletion preserves contacts - PASS / FAIL
- [ ] D2: User deletion preserves opportunities - PASS / FAIL
- [ ] D3: Disabled users hidden from dropdowns - PASS / FAIL

---

## Pass Criteria

**All 10 tests must pass** for edge cases testing to be considered successful.

If any test fails:
1. Note the specific failure and actual behavior
2. Capture console errors and network responses
3. Take screenshots of error states
4. Document the test data used
5. Report to development team

**Severity Classification:**
- **CRITICAL:** Data loss, security bypass, admin lockout
- **HIGH:** Orphaned data, broken relationships, stale permissions
- **MEDIUM:** Missing warnings, unclear error messages
- **LOW:** UX issues, minor visual glitches

---

## Notes

### Multi-Browser Testing Tips

**Browser Sessions:**
- Use Chrome normal window + Chrome Incognito for two separate sessions
- Alternatively: Chrome + Firefox for completely isolated sessions
- Each incognito window has its own session/cookies

**Session Management:**
- Do NOT copy auth tokens between browsers
- Each browser should login independently
- Close and reopen incognito to get a fresh session

### Timestamp Test Data

Always use timestamps in test data to ensure uniqueness:
- Format: `YYYY-MM-DD-HHmmss`
- Example: `ConflictTest-2025-12-26-143022`
- Prevents collision with previous test runs

### Recovery Procedures

**If Admin Access Is Lost:**
1. Access Supabase Dashboard directly
2. Navigate to Authentication > Users
3. Find the admin user
4. Update role to 'admin' in user metadata or custom claims
5. Alternatively, run SQL to restore:
   ```sql
   UPDATE sales SET role = 'admin' WHERE email = 'admin@test.com';
   ```

**If Data Is Corrupted:**
1. Run `just seed-e2e` to reset test data
2. Or restore from database backup
3. Document what caused the corruption

### Known Limitations

- Optimistic concurrency may not be implemented (document actual behavior)
- Real-time updates between browsers may not be implemented
- Some conflict detection may rely on server-side checks only
