# Activity Timeline E2E Test - Claude Chrome Prompt

Copy everything below the line and paste into a new Claude Code session.

---

## Prompt Start

Use Claude Chrome to run a comprehensive E2E test of the activity timeline on `https://crm.kjrcloud.com`.

**Your task:** Execute all phases below, creating real test data and verifying the timeline displays correctly. Take screenshots at key verification points.

### Reporting Instructions

**As you execute each phase, maintain a running findings log.** After EACH step, report:
- What you attempted
- What happened (pass/fail)
- Any issues, bugs, or unexpected behavior discovered
- Screenshots of problems

Use this format for findings:

```
[FINDING #X] Phase Y - Step Z
Severity: CRITICAL / HIGH / MEDIUM / LOW
Issue: [description]
Expected: [what should happen]
Actual: [what happened]
Screenshot: [if taken]
```

---

### Login First
1. Navigate to `https://crm.kjrcloud.com`
2. Login with admin credentials (I will provide if needed)
3. Confirm you're on the dashboard
4. **REPORT:** Login successful? Any issues?

---

### Phase 1: Create Test Organization

1. Go to `https://crm.kjrcloud.com/#/organizations`
2. Click "Create" button
3. Fill in:
   - Name: `Timeline Test Org`
   - Type: `Principal`
   - Status: `Active`
4. Save
5. **VERIFY:** Organization created, take screenshot
6. **REPORT:** Any issues with org creation? Form validation problems? UI glitches?

---

### Phase 2: Create Test Contacts

**Contact 1:**
1. Go to `https://crm.kjrcloud.com/#/contacts/create`
2. Fill in:
   - First Name: `Timeline`
   - Last Name: `Contact One`
   - Email: `timeline1@test.com`
   - Organization: `Timeline Test Org`
3. Save

**Contact 2:**
1. Go to `https://crm.kjrcloud.com/#/contacts/create`
2. Fill in:
   - First Name: `Timeline`
   - Last Name: `Contact Two`
   - Email: `timeline2@test.com`
   - Organization: `Timeline Test Org`
3. Save
4. **VERIFY:** Both contacts created
5. **REPORT:** Any issues? Did org dropdown populate correctly? Validation errors?

---

### Phase 3: Create Opportunity with Products

1. Go to `https://crm.kjrcloud.com/#/opportunities/create`
2. Complete wizard:
   - Name: `Timeline Test Opportunity`
   - Stage: `New Lead`
   - Priority: `High`
   - Customer Organization: `Timeline Test Org`
   - Primary Contact: `Timeline Contact One`
   - Add 2 products from the list
3. Create the opportunity
4. **VERIFY:** Opportunity created with products, take screenshot
5. **REPORT:** Wizard flow issues? Product selection working? Any steps confusing or broken?

---

### Phase 4: Create Activities (ALL Types)

Create one activity of each type. For each, go to `https://crm.kjrcloud.com/#/activities/create`:

| # | Type | Subject | Extra Fields |
|---|------|---------|--------------|

| 1 | Call | `Test Call Activity` | Contact: Timeline Contact One, Opportunity: Timeline Test Opportunity |
| 2 | Email | `Test Email Activity` | Contact: Timeline Contact One, Opportunity: Timeline Test Opportunity |
| 3 | Meeting | `Test Meeting Activity` | Contact: Timeline Contact Two, Opportunity: Timeline Test Opportunity |
| 4 | Demo | `Test Demo Activity` | Contact: Timeline Contact One, Opportunity: Timeline Test Opportunity |
| 5 | Proposal | `Test Proposal Activity` | Opportunity: Timeline Test Opportunity |
| 6 | Follow-up | `Test Follow-up Activity` | Follow-up Required: Yes, Follow-up Date: Tomorrow, Opportunity: Timeline Test Opportunity |
| 7 | Note | `Test Note Activity` | Description: "Test note for timeline", Opportunity: Timeline Test Opportunity |
| 8 | Sample | `Test Sample Activity` | Follow-up Required: YES (mandatory), Follow-up Date: Tomorrow, Opportunity: Timeline Test Opportunity |

**VERIFY:** All 8 activities created successfully

**REPORT after each activity:**
- Did the form save correctly?
- Were dropdowns populated (contacts, opportunities)?
- Sample activity: Did it enforce follow-up required validation?
- Any error messages or console errors?

---

### Phase 5: Create Tasks

**Uncompleted Tasks:**
1. Go to `https://crm.kjrcloud.com/#/tasks/create`
2. Create: Title: `Test Call Task (Uncompleted)`, Type: Call, Due: Tomorrow, Contact: Timeline Contact One, Opportunity: Timeline Test Opportunity
3. Create another: Title: `Test Email Task (Uncompleted)`, Type: Email, Due: Tomorrow, Contact: Timeline Contact Two, Opportunity: Timeline Test Opportunity

**Completed Tasks:**
4. Create: Title: `Test Meeting Task (To Complete)`, Type: Meeting, Due: Today, Opportunity: Timeline Test Opportunity
5. After saving, find this task and mark it as **completed**
6. Create: Title: `Test Demo Task (To Complete)`, Type: Demo, Due: Today, Opportunity: Timeline Test Opportunity
7. Mark this task as **completed** too

**VERIFY:** 2 pending tasks, 2 completed tasks

**REPORT:**
- Task creation working?
- Complete action working? (checkbox or button)
- Did completed tasks show checkmark/completed status?
- Any issues with task form fields?

---

### Phase 6: Trigger Stage Changes

1. Go to `https://crm.kjrcloud.com/#/opportunities`
2. Open `Timeline Test Opportunity`
3. Edit and change Stage from `New Lead` to `Initial Outreach`, save
4. Edit again, change Stage to `Demo Scheduled`, save
5. Edit again, change Stage to `Feedback Logged`, save

**VERIFY:** 3 stage changes made (these auto-create timeline entries)

**REPORT:**
- Did stage dropdown work correctly?
- Any validation blocking stage changes?
- Did the UI update to show new stage?

---

### Phase 7: Update Products

1. On the opportunity show page, go to Products tab
2. Click Edit
3. Add or remove one product
4. Save

**VERIFY:** Product change saved (creates "Product lineup updated" activity)

**REPORT:**
- Products tab loading correctly?
- Edit mode working?
- Save successful?

---

### Phase 8: Verify Timeline - CRITICAL

1. Go to the opportunity's Activity/Timeline tab
2. Take a **full screenshot** of the timeline
3. **Count and verify these entries exist:**

| Entry | Expected Text | Icon |
|-------|---------------|------|
| Call Activity | Test Call Activity | Phone |
| Email Activity | Test Email Activity | Mail |
| Meeting Activity | Test Meeting Activity | Users |
| Demo Activity | Test Demo Activity | - |
| Proposal Activity | Test Proposal Activity | - |
| Follow-up Activity | Test Follow-up Activity | Clock |
| Note Activity | Test Note Activity | FileText |
| Sample Activity | Test Sample Activity | - |
| Stage Change 1 | Stage changed from new_lead to initial_outreach | Arrow |
| Stage Change 2 | Stage changed from initial_outreach to demo_scheduled | Arrow |
| Stage Change 3 | Stage changed from demo_scheduled to feedback_logged | Arrow |
| Product Update | Product lineup updated | FileText |
| Task (Pending) | Test Call Task | Phone + Task badge |
| Task (Pending) | Test Email Task | Mail + Task badge |
| Task (Completed) | Test Meeting Task | Checkmark |
| Task (Completed) | Test Demo Task | Checkmark |

**REPORT - Create a detailed findings table:**

```
Timeline Entry Verification
===========================
| Entry Type | Found? | Icon Correct? | Issues |
|------------|--------|---------------|--------|
| Call Activity | YES/NO | YES/NO | |
| Email Activity | YES/NO | YES/NO | |
| Meeting Activity | YES/NO | YES/NO | |
| Demo Activity | YES/NO | YES/NO | |
| Proposal Activity | YES/NO | YES/NO | |
| Follow-up Activity | YES/NO | YES/NO | |
| Note Activity | YES/NO | YES/NO | |
| Sample Activity | YES/NO | YES/NO | |
| Stage Change 1 | YES/NO | YES/NO | |
| Stage Change 2 | YES/NO | YES/NO | |
| Stage Change 3 | YES/NO | YES/NO | |
| Product Update | YES/NO | YES/NO | |
| Pending Task 1 | YES/NO | YES/NO | |
| Pending Task 2 | YES/NO | YES/NO | |
| Completed Task 1 | YES/NO | YES/NO | |
| Completed Task 2 | YES/NO | YES/NO | |

Total: X/16 entries visible
Missing entries: [list any missing]
```

**Also check:**
- Are entries in chronological order (newest first)?
- Any duplicate entries (especially stage changes)?
- Any entries with wrong icons or missing data?
- Console errors while viewing timeline?

---

### Phase 9: Test Filters (if available)

1. Look for a "Stage changes only" toggle or filter
2. If found, enable it
3. **VERIFY:** Only stage change entries visible (should be 3)
4. Disable filter, confirm all entries return

**REPORT:**
- Filter UI present? Describe what filters are available
- Stage changes filter working correctly?
- Any filter bugs (wrong results, UI not updating)?

---

### Phase 10: Cross-Entity Check

**Organization Timeline:**
1. Go to `https://crm.kjrcloud.com/#/organizations`
2. Open `Timeline Test Org`
3. Go to Activity tab
4. **VERIFY:** Activities for this org appear

**Contact Timeline:**
1. Go to `https://crm.kjrcloud.com/#/contacts`
2. Open `Timeline Contact One`
3. Go to Activity tab
4. **VERIFY:** Activities for this contact appear

**REPORT:**
- Organization timeline showing expected entries?
- Contact timeline showing expected entries?
- Any entries missing that should appear?
- "Organization" badge visible on org-level entries when viewing contact?

---

### Phase 11: Cleanup (REQUIRED)

Delete all test data:
1. Delete `Timeline Test Opportunity`
2. Delete `Timeline Contact One` and `Timeline Contact Two`
3. Delete `Timeline Test Org`

**VERIFY:** All test data removed

---

### Final Report

After completing all phases, provide a comprehensive summary:

```
================================================================================
TIMELINE-001 E2E Test Results
================================================================================
Date: [today]
Environment: crm.kjrcloud.com
Tester: Claude Chrome

================================================================================
PHASE RESULTS
================================================================================
| Phase | Result | Notes |
|-------|--------|-------|
| 1. Create Org | PASS/FAIL | |
| 2. Create Contacts | PASS/FAIL | |
| 3. Create Opportunity | PASS/FAIL | |
| 4. Create Activities | PASS/FAIL | X/8 created |
| 5. Create Tasks | PASS/FAIL | X/4 created |
| 6. Stage Changes | PASS/FAIL | X/3 auto-created |
| 7. Product Update | PASS/FAIL | |
| 8. Timeline Display | PASS/FAIL | X/16 entries visible |
| 9. Filters | PASS/FAIL/SKIPPED | |
| 10. Cross-Entity | PASS/FAIL | |
| 11. Cleanup | PASS/FAIL | |

================================================================================
TIMELINE ENTRY VERIFICATION
================================================================================
| Entry Type | Found | Icon | Status |
|------------|-------|------|--------|
| Call Activity | | | |
| Email Activity | | | |
| Meeting Activity | | | |
| Demo Activity | | | |
| Proposal Activity | | | |
| Follow-up Activity | | | |
| Note Activity | | | |
| Sample Activity | | | |
| Stage Change 1 | | | |
| Stage Change 2 | | | |
| Stage Change 3 | | | |
| Product Update | | | |
| Pending Task (Call) | | | |
| Pending Task (Email) | | | |
| Completed Task (Meeting) | | | |
| Completed Task (Demo) | | | |

Total Entries: X/16

================================================================================
FINDINGS LOG (Issues Discovered During Testing)
================================================================================

[FINDING #1]
Phase: X
Severity: CRITICAL/HIGH/MEDIUM/LOW
Issue: [description]
Expected: [what should happen]
Actual: [what happened]
Screenshot: [yes/no]

[FINDING #2]
...

(If no findings: "No issues discovered during testing.")

================================================================================
CONSOLE ERRORS
================================================================================
[List any console errors observed, or "None"]

================================================================================
SCREENSHOTS TAKEN
================================================================================
1. [description]
2. [description]
...

================================================================================
OVERALL RESULT: PASS / FAIL
================================================================================

Summary:
[1-2 sentence summary of test results and any critical issues]
```

---

## Prompt End
