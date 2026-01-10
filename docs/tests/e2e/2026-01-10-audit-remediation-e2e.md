# E2E Manual Test: Audit Remediation (2026-01-10)

**Purpose**: Verify the 11 completed audit remediation tasks work correctly in the browser.
**Prerequisites**:
- Dev server running (`just dev`)
- Logged in as a user with Manager or Admin role
- At least one organization, contact, and opportunity exist

---

## Test 1: WG-001 - Sample Follow-up Enforcement

**Goal**: Verify that sample activities require follow-up when status is active.

### Steps:
1. Navigate to any Contact or Opportunity
2. Click "Log Activity" or navigate to Activities → Create
3. Fill in required fields:
   - Subject: "Test Sample Activity"
   - Activity Date: Today
   - Contact: Select any contact
4. Set Activity Type to "Engagement"
5. Set Type to "Sample"
6. Set Sample Status to "sent" (an active status)
7. Set Follow-up Required to "No" (or leave unchecked)
8. Click Save

### Expected Result:
- ❌ Form should show validation error: "Sample activities require follow-up when status is active"
- The record should NOT be saved

### Verification (Positive Case):
1. Set Follow-up Required to "Yes"
2. Set Follow-up Date to a future date
3. Click Save
- ✅ Record should save successfully

---

## Test 2: WG-002 - Win/Loss Reason on Stage Close

**Goal**: Verify that closing an opportunity via Kanban requires win/loss reason.

### Steps:
1. Navigate to Opportunities list (Kanban view)
2. Find an opportunity in an active stage (e.g., "initial_outreach" or "demo_scheduled")
3. Drag the opportunity card to "Closed Won" column
4. In the dialog/form that appears, do NOT fill in Win Reason
5. Attempt to save/confirm

### Expected Result:
- ❌ Form should show validation error requiring win_reason
- The opportunity should NOT move to Closed Won

### Verification (Positive Case):
1. Fill in Win Reason (e.g., "relationship")
2. Save
- ✅ Opportunity should move to Closed Won column

### Repeat for Closed Lost:
1. Drag a different opportunity to "Closed Lost"
2. Verify loss_reason is required

---

## Test 3: SS-001 - Contact Details Cache Invalidation

**Goal**: Verify that editing a contact immediately reflects changes.

### Steps:
1. Navigate to Contacts → select any contact → Show view
2. Note the current values (e.g., job title, phone)
3. Click Edit or open the details slide-over
4. Change the job title to something unique (e.g., "Test Title 123")
5. Save the changes
6. Immediately check the Show view / list view

### Expected Result:
- ✅ The new job title should appear immediately without page refresh
- ✅ No stale data should be visible

---

## Test 4: SS-002 - Sales Edit Cache Invalidation

**Goal**: Verify that editing a sales user immediately reflects changes.

### Steps:
1. Navigate to Settings → Sales (or Users/Team)
2. Select a sales user to edit
3. Change a visible field (e.g., display name or role)
4. Save the changes

### Expected Result:
- ✅ The updated value should appear immediately in the list
- ✅ Redirected view should show the new data

---

## Test 5: PERF-001 - Batch Reassignment (Admin Only)

**Goal**: Verify bulk reassignment uses batching (check DevTools Network tab).

### Prerequisites:
- Logged in as Admin
- Have a sales user with multiple records (contacts/opportunities)

### Steps:
1. Navigate to Settings → Sales
2. Find a user with assigned records
3. Click "Disable" or "Reassign" action
4. Select another user to reassign records to
5. Open DevTools → Network tab
6. Confirm the reassignment

### Expected Result:
- ✅ Network tab should show multiple smaller requests (batches of ~50) instead of one massive request
- ✅ Progress should update incrementally if there's a progress indicator
- ✅ Operation should complete without timeout

---

## Test 6: PERF-002 - Contact Import Concurrency

**Goal**: Verify contact import doesn't flood the server with requests.

### Prerequisites:
- Have a CSV file with 20+ contacts

### Steps:
1. Navigate to Contacts → Import
2. Upload a CSV with 20+ rows
3. Open DevTools → Network tab
4. Start the import (preview first if available, then import)

### Expected Result:
- ✅ Network tab should show requests going out in waves (max ~10 concurrent)
- ✅ Import should complete without 429 errors or timeouts
- ✅ Progress indicator should update smoothly

---

## Test 7: ERR-002 - Authorization Removal Error Logging

**Goal**: Verify errors are logged when authorization removal fails.

### Steps:
1. Navigate to an Organization with Authorizations
2. Open DevTools → Console tab
3. (If possible) Simulate a network error or find an authorization that might fail to delete
4. Attempt to remove an authorization

### Expected Result:
- ✅ If the removal fails, Console should show: `[AuthorizationsTab] Failed to remove authorization: <error message>`
- ✅ User should see a notification about the failure

---

## Test 8: ERR-003 - Structured Error Handling in Dashboard

**Goal**: Verify the dashboard handles errors gracefully.

### Steps:
1. Navigate to Dashboard
2. Open DevTools → Console tab
3. Let the dashboard load completely
4. Check for any error messages

### Expected Result:
- ✅ No unhandled promise rejections
- ✅ If there are errors, they should be structured (not raw error strings)
- ✅ Dashboard should load without crashing even if some data fails

---

## Quick Smoke Test Checklist

Run through these quickly to verify nothing is broken:

| Area | Action | Pass? |
|------|--------|-------|
| Dashboard | Loads without errors | ☐ |
| Contacts | List loads, can create new | ☐ |
| Opportunities | Kanban loads, can drag cards | ☐ |
| Activities | Can log an activity | ☐ |
| Organizations | Can view and edit | ☐ |
| Sample Activity | Follow-up validation works | ☐ |
| Close Opportunity | Win/loss reason required | ☐ |

---

## Console Commands for Claude Code

If using Claude Code with browser automation, you can run these checks:

```javascript
// Check for console errors
console.log("Checking for errors...");
const errors = [];
const originalError = console.error;
console.error = (...args) => { errors.push(args); originalError(...args); };

// After testing
console.log(`Found ${errors.length} console errors`);
```

---

## Test Data Setup (if needed)

```sql
-- Create test opportunity for Kanban test
INSERT INTO opportunities (name, stage, principal_id, sales_id)
VALUES ('E2E Test Opportunity', 'initial_outreach', 1, 1);

-- Create test contact
INSERT INTO contacts (first_name, last_name, email, sales_id)
VALUES ('E2E', 'TestContact', 'e2e@test.local', 1);
```

---

## Results Log

| Test | Date | Tester | Result | Notes |
|------|------|--------|--------|-------|
| WG-001 | | | | |
| WG-002 | | | | |
| SS-001 | | | | |
| SS-002 | | | | |
| PERF-001 | | | | |
| PERF-002 | | | | |
| ERR-002 | | | | |
| ERR-003 | | | | |
