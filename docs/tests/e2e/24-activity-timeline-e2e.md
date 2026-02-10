# Activity Timeline Comprehensive E2E Test

> **Test ID:** TIMELINE-001
> **Priority:** Critical
> **Environment:** Production (crm.kjrcloud.com)
> **Estimated Time:** 25-30 minutes

## Purpose

Validate that the UnifiedTimeline component correctly displays ALL entry types:
- Activities (9 subtypes including stage_change)
- Tasks (completed and uncompleted)
- Product changes
- Cross-entity visibility (contact vs organization level)

---

## Prerequisites

- [ ] Logged in to `https://crm.kjrcloud.com` as admin user
- [ ] DevTools Console open (F12)
- [ ] Browser at 1440px+ width (desktop view)

> **IMPORTANT:** This test creates real data in production. Clean up test data after completion (Phase 11).

---

## Phase 1: Create Test Organization

### Step 1.1: Navigate to Organizations
1. Go to `https://crm.kjrcloud.com/#/organizations`
2. Click the **"Create"** button (top right)

### Step 1.2: Create Organization
1. Fill in:
   - Name: `Timeline Test Org`
   - Type: `Principal`
   - Status: `Active`
2. Click **"Save"**
3. **VERIFY:**
   - [ ] Redirected to organization show page
   - [ ] Organization name displays correctly
   - [ ] No console errors

---

## Phase 2: Create Test Contacts

### Step 2.1: Create First Contact
1. Go to `https://crm.kjrcloud.com/#/contacts/create`
2. Fill in:
   - First Name: `Timeline`
   - Last Name: `Contact One`
   - Email: `timeline1@test.com`
   - Organization: Select `Timeline Test Org`
3. Click **"Save"**
4. **VERIFY:**
   - [ ] Contact created successfully
   - [ ] Linked to Timeline Test Org

### Step 2.2: Create Second Contact
1. Go to `https://crm.kjrcloud.com/#/contacts/create`
2. Fill in:
   - First Name: `Timeline`
   - Last Name: `Contact Two`
   - Email: `timeline2@test.com`
   - Organization: Select `Timeline Test Org`
3. Click **"Save"**
4. **VERIFY:**
   - [ ] Contact created successfully
   - [ ] Linked to Timeline Test Org

---

## Phase 3: Create Test Opportunity with Products

### Step 3.1: Create Opportunity
1. Go to `https://crm.kjrcloud.com/#/opportunities/create`
2. Complete the wizard:
   - **Step 1 - Basic Info:**
     - Name: `Timeline Test Opportunity`
     - Stage: `New Lead`
     - Priority: `High`
   - **Step 2 - Organization:**
     - Customer Organization: Select `Timeline Test Org`
   - **Step 3 - Contacts:**
     - Primary Contact: Select `Timeline Contact One`
   - **Step 4 - Products:**
     - Add at least 2 products from the list
3. Click **"Create Opportunity"**
4. **VERIFY:**
   - [ ] Opportunity created successfully
   - [ ] Redirected to opportunity show page
   - [ ] Products tab shows selected products
   - [ ] Timeline tab visible

---

## Phase 4: Create Activities (All Types)

Navigate to the opportunity's Activity tab or use the global Activities menu.

### Step 4.1: Create Call Activity
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Call`
   - Subject: `Test Call Activity`
   - Activity Date: Today
   - Contact: `Timeline Contact One`
   - Organization: `Timeline Test Org`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Activity created, no errors

### Step 4.2: Create Email Activity
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Email`
   - Subject: `Test Email Activity`
   - Activity Date: Today
   - Contact: `Timeline Contact One`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Activity created, no errors

### Step 4.3: Create Meeting Activity
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Meeting`
   - Subject: `Test Meeting Activity`
   - Activity Date: Today
   - Contact: `Timeline Contact Two`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Activity created, no errors

### Step 4.4: Create Demo Activity
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Demo`
   - Subject: `Test Demo Activity`
   - Activity Date: Today
   - Contact: `Timeline Contact One`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Activity created, no errors

### Step 4.5: Create Proposal Activity
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Proposal`
   - Subject: `Test Proposal Activity`
   - Activity Date: Today
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Activity created, no errors

### Step 4.6: Create Follow-up Activity
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Follow-up`
   - Subject: `Test Follow-up Activity`
   - Activity Date: Today
   - Follow-up Required: Checked
   - Follow-up Date: Tomorrow
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Activity created, no errors

### Step 4.7: Create Note Activity
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Note`
   - Subject: `Test Note Activity`
   - Description: `This is a test note for the timeline`
   - Activity Date: Today
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Activity created, no errors

### Step 4.8: Create Sample Activity (Special Case)
1. Go to `https://crm.kjrcloud.com/#/activities/create`
2. Fill in:
   - Type: `Sample`
   - Subject: `Test Sample Activity`
   - Activity Date: Today
   - **Follow-up Required: MUST be checked** (validation rule)
   - Follow-up Date: Tomorrow
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:**
   - [ ] Activity created successfully
   - [ ] If Follow-up Required was unchecked, error should appear

---

## Phase 5: Create Tasks (Completed and Uncompleted)

### Step 5.1: Create Uncompleted Call Task
1. Go to `https://crm.kjrcloud.com/#/tasks/create`
2. Fill in:
   - Title: `Test Call Task (Uncompleted)`
   - Type: `Call`
   - Due Date: Tomorrow
   - Priority: `High`
   - Contact: `Timeline Contact One`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Task created, status is "pending"

### Step 5.2: Create Uncompleted Email Task
1. Go to `https://crm.kjrcloud.com/#/tasks/create`
2. Fill in:
   - Title: `Test Email Task (Uncompleted)`
   - Type: `Email`
   - Due Date: Tomorrow
   - Priority: `Medium`
   - Contact: `Timeline Contact Two`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. **VERIFY:** Task created, status is "pending"

### Step 5.3: Create and Complete Meeting Task
1. Go to `https://crm.kjrcloud.com/#/tasks/create`
2. Fill in:
   - Title: `Test Meeting Task (To Complete)`
   - Type: `Meeting`
   - Due Date: Today
   - Priority: `High`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. Navigate to the task in the task list
5. Click the **checkbox** or **"Complete"** action to mark it done
6. **VERIFY:**
   - [ ] Task status changed to "completed"
   - [ ] Completion timestamp recorded

### Step 5.4: Create and Complete Demo Task
1. Go to `https://crm.kjrcloud.com/#/tasks/create`
2. Fill in:
   - Title: `Test Demo Task (To Complete)`
   - Type: `Demo`
   - Due Date: Today
   - Priority: `Medium`
   - Opportunity: `Timeline Test Opportunity`
3. Click **"Save"**
4. Mark the task as **completed**
5. **VERIFY:** Task marked complete

---

## Phase 6: Trigger Stage Changes (Auto-Generated Activities)

### Step 6.1: Change Stage via Form
1. Go to `https://crm.kjrcloud.com/#/opportunities`
2. Click on `Timeline Test Opportunity` to open it
3. Click **"Edit"** button
4. Change Stage from `New Lead` to `Initial Outreach`
5. Click **"Save"**
6. **VERIFY:**
   - [ ] Opportunity updated
   - [ ] Stage change activity auto-created in timeline

### Step 6.2: Change Stage via Kanban (if available)
1. Go to `https://crm.kjrcloud.com/#/opportunities` (Kanban view)
2. Drag `Timeline Test Opportunity` from `Initial Outreach` to `Demo Scheduled`
3. **VERIFY:**
   - [ ] Stage updated
   - [ ] Stage change activity auto-created

### Step 6.3: Another Stage Change
1. Edit the opportunity again
2. Change Stage to `Feedback Logged`
3. Save
4. **VERIFY:** Third stage change activity created

---

## Phase 7: Test Product Changes in Timeline

### Step 7.1: Update Products
1. Go to the opportunity show page
2. Click on the **"Products"** tab
3. Click **"Edit Products"** (or edit mode)
4. Add or remove a product
5. Click **"Save"**
6. **VERIFY:**
   - [ ] Products updated
   - [ ] Activity appears: "Product lineup updated (N products)"
   - [ ] Activity visible in Timeline tab

---

## Phase 8: Verify Timeline Display

### Step 8.1: Check Opportunity Timeline
1. Go to `Timeline Test Opportunity` show page
2. Click on the **"Activity"** or **"Timeline"** tab
3. **VERIFY each entry type appears:**

| Entry Type | Subject Contains | Icon | Badge |
|------------|------------------|------|-------|
| Call Activity | `Test Call Activity` | Phone | - |
| Email Activity | `Test Email Activity` | Mail | - |
| Meeting Activity | `Test Meeting Activity` | Users | - |
| Demo Activity | `Test Demo Activity` | Demo | - |
| Proposal Activity | `Test Proposal Activity` | Proposal | - |
| Follow-up Activity | `Test Follow-up Activity` | Clock | - |
| Note Activity | `Test Note Activity` | FileText | - |
| Sample Activity | `Test Sample Activity` | FileText | - |
| Stage Change 1 | `Stage changed from new_lead to initial_outreach` | ArrowRightLeft | - |
| Stage Change 2 | `Stage changed from initial_outreach to demo_scheduled` | ArrowRightLeft | - |
| Stage Change 3 | `Stage changed from demo_scheduled to feedback_logged` | ArrowRightLeft | - |
| Product Update | `Product lineup updated` | FileText | - |
| Uncompleted Task 1 | `Test Call Task (Uncompleted)` | Phone | Task |
| Uncompleted Task 2 | `Test Email Task (Uncompleted)` | Mail | Task |
| Completed Task 1 | `Test Meeting Task (To Complete)` | Users | Completed |
| Completed Task 2 | `Test Demo Task (To Complete)` | Demo | Completed |

### Step 8.2: Verify Entry Count
1. Count total entries in timeline
2. **VERIFY:** At least 16 entries visible (8 activities + 4 tasks + 3 stage changes + 1 product update)

### Step 8.3: Verify Chronological Order
1. Check that entries are sorted by date (newest first)
2. **VERIFY:** Most recent entries appear at top

---

## Phase 9: Test Timeline Filters

### Step 9.1: Filter by Stage Changes Only
1. On the opportunity timeline, toggle **"Stage changes only"** filter (if available)
2. **VERIFY:**
   - [ ] Only stage change entries visible
   - [ ] Regular activities hidden
   - [ ] Count shows ~3 entries

### Step 9.2: Filter by Activity Type
1. If type filter available, select **"Call"**
2. **VERIFY:** Only call activities and call tasks visible

### Step 9.3: Clear Filters
1. Clear all filters
2. **VERIFY:** All entries visible again

---

## Phase 10: Cross-Entity Timeline Check

### Step 10.1: Check Organization Timeline
1. Go to `https://crm.kjrcloud.com/#/organizations`
2. Click on `Timeline Test Org`
3. Navigate to **"Activity"** tab
4. **VERIFY:**
   - [ ] Activities linked to this org appear
   - [ ] Stage changes for related opportunities appear
   - [ ] Organization-level activities visible

### Step 10.2: Check Contact Timeline
1. Go to `https://crm.kjrcloud.com/#/contacts`
2. Click on `Timeline Contact One`
3. Navigate to **"Activity"** tab
4. **VERIFY:**
   - [ ] Activities linked to this contact appear
   - [ ] Tasks assigned to this contact visible
   - [ ] "Organization" badge on org-level entries

---

## Console Monitoring

Throughout the entire test, watch for:

| Error Type | Pattern | Severity |
|------------|---------|----------|
| RLS | "permission denied", "42501" | CRITICAL |
| React | "Uncaught", "Error boundary" | CRITICAL |
| Network | 500, 403, 401 status codes | HIGH |
| Timeline | "unknown_subtype", "duplicate" | MEDIUM |
| Validation | "Zod", "validation failed" | MEDIUM |

**Safe to Ignore:**
- `ResizeObserver loop completed with undelivered notifications`
- Yellow warnings (unless testing them)

---

## Results Summary

Copy and complete this checklist:

```
## TIMELINE-001 Results

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** Production (crm.kjrcloud.com)

### Phase Results

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Create Org | PASS/FAIL | |
| 2. Create Contacts | PASS/FAIL | |
| 3. Create Opportunity | PASS/FAIL | |
| 4. Create Activities | PASS/FAIL | |
| 5. Create Tasks | PASS/FAIL | |
| 6. Stage Changes | PASS/FAIL | |
| 7. Product Changes | PASS/FAIL | |
| 8. Timeline Display | PASS/FAIL | |
| 9. Filters | PASS/FAIL | |
| 10. Cross-Entity | PASS/FAIL | |
| 11. Cleanup | PASS/FAIL | |

### Entry Type Verification

| Entry Type | Appears | Icon Correct | Notes |
|------------|---------|--------------|-------|
| Call | YES/NO | YES/NO | |
| Email | YES/NO | YES/NO | |
| Meeting | YES/NO | YES/NO | |
| Demo | YES/NO | YES/NO | |
| Proposal | YES/NO | YES/NO | |
| Follow-up | YES/NO | YES/NO | |
| Note | YES/NO | YES/NO | |
| Sample | YES/NO | YES/NO | |
| Stage Change | YES/NO | YES/NO | |
| Product Update | YES/NO | YES/NO | |
| Task (Pending) | YES/NO | YES/NO | |
| Task (Completed) | YES/NO | YES/NO | |

### Console Errors

[List any console errors observed]

### Overall Result: PASS / FAIL

### Notes

[Additional observations]
```

---

## On Failure

If any step fails:

1. **Screenshot** the current state
2. **Copy** console errors (red text)
3. **Note** the exact step number and URL
4. **Report** using this format:

```
TIMELINE-001: FAIL
Phase: [number]
Step: [number]
URL: [current URL]
Expected: [what should happen]
Actual: [what happened]
Console: [errors if any]
Screenshot: [description or path]
```

---

## Phase 11: Cleanup (REQUIRED for Production)

**IMPORTANT:** Delete all test data after testing to keep production clean.

### Step 11.1: Delete Opportunity
1. Go to `https://crm.kjrcloud.com/#/opportunities`
2. Find `Timeline Test Opportunity`
3. Click to open, then click **"Delete"** or archive

### Step 11.2: Delete Contacts
1. Go to `https://crm.kjrcloud.com/#/contacts`
2. Find and delete `Timeline Contact One`
3. Find and delete `Timeline Contact Two`

### Step 11.3: Delete Organization
1. Go to `https://crm.kjrcloud.com/#/organizations`
2. Find and delete `Timeline Test Org`

**VERIFY:** All test data removed from production.
