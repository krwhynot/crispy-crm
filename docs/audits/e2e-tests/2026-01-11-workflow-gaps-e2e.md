# Workflow Gaps Audit - Manual E2E Test Script

**Purpose:** Validate audit findings through runtime behavior testing
**Tool:** Claude Chrome (Browser Automation)
**Duration:** ~15-20 minutes
**Prerequisites:** Local dev server running (`npm run dev`), Supabase local running

---

## Instructions for Claude Chrome

Copy and paste the following test scenarios one at a time. After each test, share the results back so we can update the audit confidence.

---

## Test 1: Critical - Contact Creation with Empty Names (WF-C2-001/002)

### Objective
Verify if contacts can be created with empty first_name and last_name fields (should FAIL validation but might succeed due to `|| ""` fallback).

### Steps

```
MANUAL E2E TEST: Contact Creation Empty Names

1. Navigate to: http://localhost:5173/contacts

2. Click the "Create" or "+ New Contact" button

3. In the create form:
   - Leave "First Name" field EMPTY
   - Leave "Last Name" field EMPTY
   - Enter a valid email: "test-empty-name@example.com"
   - Select any organization from the dropdown

4. Click "Save" or "Create" button

5. OBSERVE and RECORD:
   - Did the form submit successfully? (YES/NO)
   - Was there a validation error? (YES/NO)
   - If error, what was the message?
   - If success, what name appears in the contact list?

6. If contact was created, check the database:
   - Open Supabase Studio: http://localhost:54323
   - Query: SELECT id, first_name, last_name, name, email FROM contacts WHERE email = 'test-empty-name@example.com';
   - Record the values of first_name, last_name, and name fields

7. CLEANUP: Delete the test contact if created

EXPECTED RESULT (if bug exists):
- Form submits successfully
- Contact created with empty strings for first_name, last_name
- name field = " " (single space) or empty string

EXPECTED RESULT (if fixed):
- Form shows validation error: "First name is required" or similar
- Contact NOT created
```

---

## Test 2: Critical - Quick Add Opportunity Missing Organization Name (WF-C2-005)

### Objective
Verify if opportunities can be created without a customer organization name being properly validated.

### Steps

```
MANUAL E2E TEST: Quick Add Opportunity Organization Name

1. Navigate to: http://localhost:5173/opportunities

2. Switch to Kanban view if not already

3. Find the "Quick Add" or "+ New Opportunity" button in any column

4. In the quick add form:
   - Enter name: "Test Opportunity No Org"
   - Do NOT select a customer (leave blank if possible)
   - Or select a customer and observe what happens

5. Click "Create" button

6. OBSERVE and RECORD:
   - Did the form require customer selection? (YES/NO)
   - If customer was required, is the organization name stored correctly?
   - Check the new opportunity card - does it show the customer name?

7. If opportunity was created, check the database:
   - Query: SELECT id, name, customer_organization_id, customer_organization_name FROM opportunities_summary WHERE name = 'Test Opportunity No Org';
   - Is customer_organization_name populated or empty?

8. CLEANUP: Delete the test opportunity

EXPECTED RESULT (if bug exists):
- Opportunity created with customer_organization_name = ""
- Card shows blank customer name

EXPECTED RESULT (if working correctly):
- Customer selection required (validation error if empty)
- customer_organization_name populated from selected organization
```

---

## Test 3: Critical - Workflow Fields Empty Defaults (WF-C2-006/007/008)

### Objective
Verify workflow fields (next_action, next_action_date, decision_criteria) behavior with empty values.

### Steps

```
MANUAL E2E TEST: Workflow Management Section Fields

1. Navigate to: http://localhost:5173/opportunities

2. Click on any existing opportunity to open the slide-over or details view

3. Find the "Workflow Management" section (should show Tags, Next Action, Next Action Date, Decision Criteria)

4. Test each field:

   A) NEXT ACTION FIELD:
   - Clear any existing value
   - Click away (blur) to trigger save
   - Refresh the page
   - Record: Is the field null, undefined, or empty string ""?

   B) NEXT ACTION DATE FIELD:
   - Clear any existing date
   - Click away (blur) to trigger save
   - Refresh the page
   - Record: Is the field null or empty string ""?

   C) DECISION CRITERIA FIELD:
   - Expand the collapsible section
   - Clear any existing value
   - Click away (blur) to trigger save
   - Refresh the page
   - Record: Is the field null or empty string ""?

5. Check the database after clearing each field:
   - Query: SELECT id, next_action, next_action_date, decision_criteria FROM opportunities WHERE id = [OPPORTUNITY_ID];
   - Record actual database values (null vs "")

EXPECTED RESULT (if bug exists):
- Fields saved as empty strings ""
- UI shows empty input instead of null placeholder

EXPECTED RESULT (if working correctly):
- Fields saved as NULL when cleared
- UI handles null gracefully (shows placeholder text)
```

---

## Test 4: High - Activity Logging on Opportunity Creation (WF-H2-001)

### Objective
Verify if creating an opportunity via Quick Add logs an activity record.

### Steps

```
MANUAL E2E TEST: Activity Logging - Opportunity Creation

1. Note the current count of activities:
   - Query: SELECT COUNT(*) FROM activities;
   - Record: Initial count = ___

2. Navigate to: http://localhost:5173/opportunities (Kanban view)

3. Use Quick Add to create a new opportunity:
   - Name: "Activity Log Test Opportunity"
   - Select any customer
   - Click Create

4. IMMEDIATELY after creation, check for new activity:
   - Query: SELECT * FROM activities ORDER BY created_at DESC LIMIT 5;
   - Look for an activity related to "Activity Log Test Opportunity"

5. Also check the opportunity's activity timeline (if visible in UI):
   - Open the new opportunity
   - Look for Activities tab or Recent Activity section
   - Is there a "Created" or "Opportunity created" activity?

6. RECORD:
   - Was an activity logged? (YES/NO)
   - If YES, what was the activity_type?
   - If NO, this confirms WF-H2-001 bug

7. CLEANUP: Delete the test opportunity

EXPECTED RESULT (if bug exists):
- NO new activity record created
- Activity timeline is empty for new opportunity

EXPECTED RESULT (if fixed):
- Activity record created with type "opportunity_created" or similar
- Activity shows in timeline
```

---

## Test 5: High - Activity Logging on Stage Change (Verification of Working Feature)

### Objective
Verify that stage changes ARE properly logged (this should PASS - confirms 45% coverage claim).

### Steps

```
MANUAL E2E TEST: Activity Logging - Stage Change (Should Work)

1. Navigate to: http://localhost:5173/opportunities (Kanban view)

2. Find an existing opportunity card

3. Drag the card from its current stage to a different stage (e.g., from "Initial Outreach" to "Sample Visit Offered")

4. IMMEDIATELY check for new activity:
   - Query: SELECT * FROM activities WHERE opportunity_id = [DRAGGED_OPP_ID] ORDER BY created_at DESC LIMIT 3;

5. RECORD:
   - Was a stage change activity logged? (YES/NO)
   - What is the activity_type?
   - What is the subject/description?

6. Move the opportunity back to original stage if needed

EXPECTED RESULT:
- Activity record created
- Subject contains "Stage changed from X to Y"
- activity_type = "engagement" or "note"

This test VALIDATES our finding that stage changes ARE logged (45% coverage working part).
```

---

## Test 6: High - Activity Logging on Contact Creation (WF-H2-004)

### Objective
Verify that contact creation does NOT log an activity (confirms 0% coverage).

### Steps

```
MANUAL E2E TEST: Activity Logging - Contact Creation

1. Note current activity count:
   - Query: SELECT COUNT(*) FROM activities;
   - Record: Initial count = ___

2. Navigate to: http://localhost:5173/contacts

3. Click "+ New Contact" or Create button

4. Fill in the form:
   - First Name: "Activity"
   - Last Name: "Test"
   - Email: "activity-test@example.com"
   - Select any organization

5. Save the contact

6. IMMEDIATELY check for new activity:
   - Query: SELECT COUNT(*) FROM activities;
   - New count = ___
   - Difference = ___

7. Also query for any contact-related activities:
   - Query: SELECT * FROM activities WHERE created_at > NOW() - INTERVAL '1 minute' ORDER BY created_at DESC;

8. RECORD:
   - Was a "contact_created" activity logged? (YES/NO)
   - Activity count change: ___

9. CLEANUP: Delete the test contact

EXPECTED RESULT (confirming bug):
- NO activity record created for contact creation
- Activity count unchanged
- This confirms WF-H2-004: Contacts module has 0% activity logging coverage
```

---

## Test 7: High - Activity Logging on Opportunity Archive (WF-H2-002)

### Objective
Verify that archiving an opportunity does NOT log an activity.

### Steps

```
MANUAL E2E TEST: Activity Logging - Opportunity Archive

1. Create a test opportunity (or use existing one)
   - Note its ID: ___

2. Note current activity count for this opportunity:
   - Query: SELECT COUNT(*) FROM activities WHERE opportunity_id = [ID];
   - Initial count = ___

3. Navigate to the opportunity in the UI

4. Find the Archive button/action (usually in a menu or action bar)

5. Archive the opportunity

6. Check for new activity:
   - Query: SELECT * FROM activities WHERE opportunity_id = [ID] ORDER BY created_at DESC LIMIT 3;

7. RECORD:
   - Was an "opportunity_archived" activity logged? (YES/NO)
   - Any new activity at all? (YES/NO)

8. CLEANUP: Unarchive and delete test opportunity if created

EXPECTED RESULT (confirming bug):
- NO activity record for archive action
- Confirms WF-H2-002: Archive operations leave no audit trail
```

---

## Test 8: High - Contact-Opportunity Linking Activity (WF-H2-005)

### Objective
Verify that linking a contact to an opportunity does NOT log an activity.

### Steps

```
MANUAL E2E TEST: Activity Logging - Contact-Opportunity Link

1. Navigate to any existing contact: http://localhost:5173/contacts/[ID]

2. Find the "Opportunities" tab or section

3. Note current activity count:
   - Query: SELECT COUNT(*) FROM activities;
   - Initial count = ___

4. Click "Link Opportunity" or similar button

5. Select an opportunity to link

6. Confirm the link

7. Check for new activity:
   - Query: SELECT * FROM activities ORDER BY created_at DESC LIMIT 5;
   - Look for "contact_linked_to_opportunity" or similar

8. RECORD:
   - Was a linking activity logged? (YES/NO)
   - Activity count change: ___

EXPECTED RESULT (confirming bug):
- NO activity record for linking action
- Confirms WF-H2-005: Contact-opportunity linking not logged
```

---

## Test 9: Database Validation - Soft Delete Filtering

### Objective
Verify soft deletes are properly filtered in list views.

### Steps

```
MANUAL E2E TEST: Soft Delete Filtering

1. Count active contacts in UI:
   - Navigate to: http://localhost:5173/contacts
   - Note the displayed count or count rows: ___

2. Count active contacts in database:
   - Query: SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL;
   - Database count: ___

3. Count total contacts (including soft deleted):
   - Query: SELECT COUNT(*) FROM contacts;
   - Total count: ___

4. COMPARE:
   - UI count matches "deleted_at IS NULL" count? (YES/NO)
   - Are soft-deleted contacts hidden from UI? (YES/NO)

5. Repeat for opportunities:
   - UI count: ___
   - Query: SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL;
   - Database active count: ___
   - Match? (YES/NO)

EXPECTED RESULT:
- UI counts match database counts with deleted_at IS NULL filter
- Soft-deleted records NOT visible in lists
```

---

## Test 10: Schema Validation - Required Fields

### Objective
Verify NOT NULL constraints are enforced at database level.

### Steps

```
MANUAL E2E TEST: Database Constraint Validation

1. Open Supabase SQL Editor: http://localhost:54323

2. Test opportunity without principal (should FAIL):
   - Query:
   INSERT INTO opportunities (name, stage, customer_organization_id)
   VALUES ('Test No Principal', 'new_lead', 1);

   - Record error message: ___

3. Test opportunity without customer (should FAIL):
   - Query:
   INSERT INTO opportunities (name, stage, principal_organization_id)
   VALUES ('Test No Customer', 'new_lead', 1);

   - Record error message: ___

4. Test contact without organization (should FAIL):
   - Query:
   INSERT INTO contacts (first_name, last_name, name)
   VALUES ('Test', 'NoOrg', 'Test NoOrg');

   - Record error message: ___

EXPECTED RESULT:
- All inserts should FAIL with NOT NULL violation errors
- This confirms database-level constraints are working
- Error messages should reference the missing column
```

---

## Results Template

After completing all tests, fill in this template and share:

```markdown
## E2E Test Results - Workflow Gaps Audit

**Tester:** Claude Chrome
**Date:** 2026-01-11
**Environment:** Local dev (localhost:5173 + Supabase localhost:54323)

### Test Results Summary

| Test | Finding | Result | Notes |
|------|---------|--------|-------|
| Test 1 | WF-C2-001/002 | PASS/FAIL | |
| Test 2 | WF-C2-005 | PASS/FAIL | |
| Test 3 | WF-C2-006/007/008 | PASS/FAIL | |
| Test 4 | WF-H2-001 | CONFIRMED/FIXED | |
| Test 5 | Stage logging works | PASS/FAIL | |
| Test 6 | WF-H2-004 | CONFIRMED/FIXED | |
| Test 7 | WF-H2-002 | CONFIRMED/FIXED | |
| Test 8 | WF-H2-005 | CONFIRMED/FIXED | |
| Test 9 | Soft delete filter | PASS/FAIL | |
| Test 10 | DB constraints | PASS/FAIL | |

### Detailed Observations

**Test 1 Notes:**
- Form submission result:
- Database values:

**Test 2 Notes:**
- Validation present:
- Organization name stored:

**Test 3 Notes:**
- next_action stored as:
- next_action_date stored as:
- decision_criteria stored as:

**Test 4 Notes:**
- Activity created: YES/NO
- Activity count before: ___ after: ___

**Test 5 Notes:**
- Stage change activity logged: YES/NO
- Activity type:

**Test 6 Notes:**
- Contact creation activity: YES/NO

**Test 7 Notes:**
- Archive activity: YES/NO

**Test 8 Notes:**
- Linking activity: YES/NO

**Test 9 Notes:**
- Counts match: YES/NO

**Test 10 Notes:**
- All constraints enforced: YES/NO

### Updated Confidence Assessment

Based on E2E testing:
- Critical findings confirmed: ___/9
- High findings confirmed: ___/10
- New findings discovered: ___
- False positives identified: ___

**Revised Overall Confidence:** ___%
```

---

## Quick Reference: SQL Queries

```sql
-- Count activities
SELECT COUNT(*) FROM activities;

-- Recent activities
SELECT * FROM activities ORDER BY created_at DESC LIMIT 10;

-- Activities for specific opportunity
SELECT * FROM activities WHERE opportunity_id = [ID] ORDER BY created_at DESC;

-- Contact with empty name test
SELECT id, first_name, last_name, name, email
FROM contacts
WHERE email = 'test-empty-name@example.com';

-- Opportunity summary check
SELECT id, name, customer_organization_id, customer_organization_name
FROM opportunities_summary
WHERE name LIKE 'Test%';

-- Workflow fields check
SELECT id, next_action, next_action_date, decision_criteria
FROM opportunities
WHERE id = [ID];

-- Soft delete counts
SELECT
  (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL) as active_contacts,
  (SELECT COUNT(*) FROM contacts) as total_contacts,
  (SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL) as active_opps,
  (SELECT COUNT(*) FROM opportunities) as total_opps;
```

---

# PART 2: Blind Spot Detection Tests

These tests validate the audit's "PASS" findings to ensure we didn't miss any gaps.

---

## Test 11: PASS Validation - Close Reason Required for Won/Lost (WF-M3)

### Objective
Verify that closing an opportunity as won/lost REQUIRES close_reason (audit said this PASSES).

### Steps

```
MANUAL E2E TEST: Close Reason Validation (Should PASS)

1. Navigate to: http://localhost:5173/opportunities (Kanban view)

2. Find an opportunity that is NOT closed (any active stage)

3. Try to move it directly to "Closed Won" column (drag and drop)

4. OBSERVE:
   - Does a modal/dialog appear asking for close reason?
   - Can you complete the move WITHOUT providing a reason?

5. If a modal appears:
   - Try clicking "Save" or "Confirm" WITHOUT selecting a reason
   - Does it show validation error?

6. Test via UI menu (if available):
   - Click on opportunity card menu (3 dots)
   - Look for "Mark as Won" or "Close Won" option
   - Try to complete WITHOUT providing close_reason

7. RECORD:
   - Close reason modal appeared? (YES/NO)
   - Could close without reason? (YES/NO)
   - Validation error shown? (YES/NO)

8. ALSO TEST "Closed Lost":
   - Same steps for closing as lost
   - Is loss_reason required?

EXPECTED RESULT (confirming audit PASS):
- Modal/dialog REQUIRES close_reason selection
- Cannot complete close transition without reason
- Validation error if attempted without reason

IF THIS FAILS:
- We have a BLIND SPOT in the audit
- WF-M3 should be marked as FAIL, not PASS
```

---

## Test 12: PASS Validation - Principal Required for Opportunity (WF-C3/Database)

### Objective
Verify opportunities REQUIRE principal_organization_id (audit showed 0 violations).

### Steps

```
MANUAL E2E TEST: Principal Requirement (Should PASS)

1. Navigate to: http://localhost:5173/opportunities

2. Go to full Create form (not Quick Add) if available
   - Or use Quick Add

3. Look for Principal selection field:
   - Is there a "Principal" dropdown/field?
   - Is it marked as required (*)?
   - Can you leave it empty?

4. Try to create opportunity WITHOUT selecting a principal:
   - Fill in name: "Test No Principal"
   - Select customer
   - DO NOT select principal (if field exists)
   - Click Create/Save

5. OBSERVE:
   - Does form submit?
   - Is there a validation error for principal?

6. IF NO PRINCIPAL FIELD VISIBLE:
   - This might be auto-assigned or derived
   - Check database after creation:
   Query: SELECT id, name, principal_organization_id FROM opportunities WHERE name = 'Test No Principal';
   - Is principal_organization_id NULL or populated?

7. RECORD:
   - Principal field visible in form? (YES/NO)
   - Principal field required? (YES/NO)
   - Could create without principal? (YES/NO)
   - Database value: ___

EXPECTED RESULT (confirming audit PASS):
- Principal either required in form OR auto-assigned
- Database has valid principal_organization_id (NOT NULL)
- Constraint enforced

IF THIS FAILS:
- BLIND SPOT: Opportunities can be created without principal
- Critical business rule violation
```

---

## Test 13: PASS Validation - Activity Type Required (WF-M4)

### Objective
Verify activities cannot be created without activity_type (audit showed concern but database has 0 nulls).

### Steps

```
MANUAL E2E TEST: Activity Type Validation

1. Navigate to an opportunity with activity creation UI

2. Find where you can log an activity (Activity tab, Quick Log, etc.)

3. Look at the activity form:
   - Is there an "Activity Type" dropdown?
   - Is it pre-selected with a default?
   - Can you clear it/set to empty?

4. Try to create activity WITHOUT type:
   - Fill in other fields (subject, notes)
   - If type field exists, try to submit without selection
   - Or clear the default if possible

5. OBSERVE:
   - Does form require activity type selection?
   - Is there a default value?
   - Can you submit with no type?

6. Check database:
   Query: SELECT id, activity_type, subject, created_at FROM activities ORDER BY created_at DESC LIMIT 5;
   - What activity_type values exist?
   - Are any NULL?

7. RECORD:
   - Activity type field visible? (YES/NO)
   - Has default value? (YES/NO)
   - Could submit without type? (YES/NO)
   - Database has NULLs? (YES/NO)

EXPECTED RESULT (confirming audit assessment):
- Activity type either required OR has sensible default
- Database shows all activities have type
- No way to create activity without type through UI

IF THIS FAILS:
- WF-M4 severity should increase
- Activity type constraint not enforced
```

---

## Test 14: PASS Validation - Won/Lost Activity IS Logged (Partial 45% Coverage)

### Objective
Verify that marking opportunity as won/lost DOES log activity (part of working 45%).

### Steps

```
MANUAL E2E TEST: Won/Lost Activity Logging (Should PASS)

1. Note initial activity count for an opportunity:
   - Pick any active opportunity, note ID: ___
   - Query: SELECT COUNT(*) FROM activities WHERE opportunity_id = [ID];
   - Initial count: ___

2. Navigate to that opportunity in UI

3. Mark it as "Closed Won":
   - Use card menu or drag to Closed Won column
   - Provide required close_reason
   - Confirm the action

4. IMMEDIATELY check for new activity:
   Query: SELECT * FROM activities WHERE opportunity_id = [ID] ORDER BY created_at DESC LIMIT 3;

5. RECORD:
   - New activity created? (YES/NO)
   - Activity type: ___
   - Activity subject/description: ___
   - Contains "won" or "closed"? (YES/NO)

6. ALSO TEST "Closed Lost":
   - Revert opportunity first (if possible)
   - Mark as Closed Lost
   - Check for activity

EXPECTED RESULT (confirming 45% coverage claim):
- Activity record created for won/lost transition
- Subject contains "won" or "lost" or "closed"
- This validates that closed transitions ARE logged

IF THIS FAILS:
- Critical gap in audit!
- We claimed stage transitions are logged but they're not
- 45% coverage claim would be WRONG
```

---

## Test 15: PASS Validation - RLS Filtering Works (Security)

### Objective
Verify Row Level Security is filtering data correctly.

### Steps

```
MANUAL E2E TEST: RLS Data Filtering

1. Check current user identity:
   - Look at logged-in user in UI header
   - Note user ID/email: ___

2. Query opportunities as service role (bypasses RLS):
   - In Supabase SQL Editor:
   SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL;
   - Total opportunities (all users): ___

3. Check what UI shows:
   - Navigate to opportunities list
   - Count total shown or check "Showing X of Y"
   - UI count: ___

4. COMPARE:
   - Do counts match?
   - If different, RLS is filtering (expected for non-admin users)
   - If same, user might be admin OR RLS might be broken

5. Test with different user (if possible):
   - Log out and log in as different user
   - Check opportunity count again
   - Different users should see different counts (unless all data is shared)

6. RECORD:
   - Service role count: ___
   - UI count: ___
   - Counts match: YES/NO
   - If different, RLS appears to be working

EXPECTED RESULT:
- Either counts match (user has full access) OR
- Counts differ (RLS correctly filtering)
- Key: verify soft-deleted records are NEVER shown
```

---

## Test 16: PASS Validation - Hardcoded Stage Values Work (WF-H1)

### Objective
Verify the pipeline stages displayed in UI match database values (no stage mismatch bugs).

### Steps

```
MANUAL E2E TEST: Pipeline Stage Consistency

1. Navigate to Kanban board: http://localhost:5173/opportunities

2. Note all visible columns/stages:
   - List them: ___

3. Query database for valid stages:
   Query: SELECT DISTINCT stage FROM opportunities WHERE deleted_at IS NULL;
   - Database stages: ___

4. Query for the stage enum definition:
   Query: SELECT enum_range(NULL::opportunity_stage);
   - OR check migration files for stage enum

5. COMPARE:
   - Do UI columns match database stage values?
   - Are there any stages in DB not shown in UI?
   - Are there any UI columns with no DB records?

6. Test stage value integrity:
   - Drag an opportunity between columns
   - Check database value after move:
   Query: SELECT id, stage FROM opportunities WHERE id = [MOVED_OPP_ID];
   - Does DB value match the column name?

7. RECORD:
   - All stages consistent? (YES/NO)
   - Mismatched stages found: ___
   - Stage values update correctly? (YES/NO)

EXPECTED RESULT (confirming audit PASS):
- UI columns match database stage enum
- Stage changes update correct string value in DB
- No orphaned/invalid stage values

IF THIS FAILS:
- WF-H1 should be reconsidered
- Hardcoded stage strings causing mismatches
```

---

## Test 17: PASS Validation - Organization Type Integrity

### Objective
Verify organizations are correctly typed (principal, distributor, customer).

### Steps

```
MANUAL E2E TEST: Organization Type Validation

1. Navigate to a Principal detail view (if accessible)
   - Or query: SELECT id, name, organization_type FROM organizations WHERE organization_type = 'principal' LIMIT 5;

2. Check if principals are used correctly:
   Query:
   SELECT o.id, o.name, org.organization_type
   FROM opportunities o
   JOIN organizations org ON o.principal_organization_id = org.id
   WHERE org.organization_type != 'principal'
   AND o.deleted_at IS NULL
   LIMIT 10;

   - Should return 0 rows (principals used as principals only)

3. Check if customers are valid types:
   Query:
   SELECT o.id, o.name, org.organization_type
   FROM opportunities o
   JOIN organizations org ON o.customer_organization_id = org.id
   WHERE org.organization_type = 'principal'
   AND o.deleted_at IS NULL
   LIMIT 10;

   - Should return 0 rows (principals not used as customers)

4. RECORD:
   - Principals used correctly? (YES/NO)
   - Customers are valid types? (YES/NO)
   - Organization type integrity maintained? (YES/NO)

EXPECTED RESULT:
- Principals only used as principal_organization_id
- Customers are prospect/customer/distributor types
- No type mismatches
```

---

## Test 18: Blind Spot Hunt - Hidden Validation Bypass

### Objective
Look for ways to bypass validation that the static audit couldn't detect.

### Steps

```
MANUAL E2E TEST: Validation Bypass Hunting

1. TEST BROWSER DEVTOOLS MANIPULATION:
   - Open Chrome DevTools (F12)
   - Find a "required" form field
   - Use Elements panel to remove "required" attribute
   - Try to submit form
   - Does server-side validation catch it?

2. TEST DIRECT API CALL:
   - Open Network tab in DevTools
   - Submit a valid form
   - Copy the API request as cURL
   - Modify the request to remove required fields
   - Execute modified request
   - Does backend reject it?

3. TEST RAPID DOUBLE-SUBMIT:
   - Fill out a create form
   - Click submit very rapidly (2-3 times)
   - Are duplicate records created?
   - Is there debounce/disable-on-submit?

4. TEST EMPTY STRING vs NULL:
   - In form, type a space " " in required field
   - Delete the space (field now has "" not null)
   - Submit form
   - Does validation catch empty strings?

5. RECORD any bypass found:
   - Bypass method: ___
   - Field affected: ___
   - Server rejected: YES/NO
   - New bug ID: ___

EXPECTED RESULT:
- All bypasses caught by server-side validation
- Zod schemas enforce rules regardless of client
- No duplicates from rapid submit

IF BYPASSES FOUND:
- These are BLIND SPOTS in the audit
- Need to add to critical findings
```

---

## Test 19: Edge Case - Unicode and Special Characters

### Objective
Test if validation handles edge cases the audit couldn't check statically.

### Steps

```
MANUAL E2E TEST: Special Character Handling

1. Test empty-looking but not empty values:
   - Create contact with first_name = "‎" (zero-width character)
   - Or first_name = " " (just spaces)
   - Does validation reject?

2. Test very long strings:
   - Try name with 10,000 characters
   - Does .max() validation in Zod catch it?
   - Or does it break the UI?

3. Test SQL injection attempt:
   - Try name: "Robert'); DROP TABLE contacts;--"
   - Does it save safely (escaped)?
   - Any errors?

4. Test XSS attempt:
   - Try name: "<script>alert('XSS')</script>"
   - Does it render safely in UI?
   - Any script execution?

5. RECORD:
   - Zero-width chars handled? (YES/NO)
   - Long strings validated? (YES/NO)
   - SQL injection safe? (YES/NO)
   - XSS safe? (YES/NO)

EXPECTED RESULT:
- All edge cases handled safely
- Zod .max() limits enforced
- No injection vulnerabilities
- Proper escaping in UI
```

---

## Test 20: Comprehensive - Full Create/Update/Delete Cycle

### Objective
Test complete lifecycle to catch any missed gaps.

### Steps

```
MANUAL E2E TEST: Full CUD Cycle

1. CREATE OPPORTUNITY:
   - Use Create Wizard (full form)
   - Fill ALL fields (name, customer, principal, stage, priority, etc.)
   - Save and note ID: ___
   - Verify all fields saved correctly

2. READ/VIEW:
   - Open the created opportunity
   - Verify all fields display correctly
   - Check computed fields (days_in_stage, names, etc.)

3. UPDATE MULTIPLE FIELDS:
   - Change name
   - Change priority
   - Add tags
   - Change next_action
   - Save each change
   - Verify database reflects changes

4. STAGE TRANSITION:
   - Move through multiple stages
   - Verify each transition logged (activity)
   - Check stage field updates

5. CLOSE AS WON:
   - Provide close_reason
   - Verify close_date set
   - Verify activity logged

6. ARCHIVE:
   - Archive the opportunity
   - Verify it disappears from list
   - Query: SELECT deleted_at FROM opportunities WHERE id = [ID];
   - Is deleted_at set?

7. CHECK FINAL STATE:
   Query: SELECT * FROM opportunities WHERE id = [ID];
   Query: SELECT COUNT(*) FROM activities WHERE opportunity_id = [ID];

   - All fields as expected?
   - Activities logged for: create? stage changes? close? archive?

8. RECORD summary of lifecycle test:
   - Create: OK/FAIL
   - Read: OK/FAIL
   - Update: OK/FAIL
   - Stage transitions: OK/FAIL
   - Close: OK/FAIL
   - Archive: OK/FAIL
   - Activity logging gaps found: ___

EXPECTED RESULT:
- Full lifecycle works
- Only expected gaps (quick create no activity, archive no activity)
- No new bugs discovered
```

---

# Updated Results Template (Including Blind Spot Tests)

After completing ALL tests (1-20), fill in this comprehensive template:

```markdown
## E2E Test Results - Workflow Gaps Audit (Full Verification)

**Tester:** Claude Chrome
**Date:** 2026-01-11
**Environment:** Local dev (localhost:5173 + Supabase localhost:54323)

---

### PART 1: Bug Confirmation Tests

| Test | Finding ID | Expected | Actual | Status |
|------|------------|----------|--------|--------|
| Test 1 | WF-C2-001/002 | Bug exists | | CONFIRMED/FIXED/FALSE_POSITIVE |
| Test 2 | WF-C2-005 | Bug exists | | CONFIRMED/FIXED/FALSE_POSITIVE |
| Test 3 | WF-C2-006/007/008 | Bug exists | | CONFIRMED/FIXED/FALSE_POSITIVE |
| Test 4 | WF-H2-001 | Bug exists | | CONFIRMED/FIXED/FALSE_POSITIVE |
| Test 5 | Stage logging | Works | | PASS/FAIL |
| Test 6 | WF-H2-004 | Bug exists | | CONFIRMED/FIXED/FALSE_POSITIVE |
| Test 7 | WF-H2-002 | Bug exists | | CONFIRMED/FIXED/FALSE_POSITIVE |
| Test 8 | WF-H2-005 | Bug exists | | CONFIRMED/FIXED/FALSE_POSITIVE |
| Test 9 | Soft delete | Works | | PASS/FAIL |
| Test 10 | DB constraints | Works | | PASS/FAIL |

---

### PART 2: Blind Spot Detection Tests

| Test | Audit Claim | Expected | Actual | Blind Spot? |
|------|-------------|----------|--------|-------------|
| Test 11 | WF-M3 PASS | Close reason required | | NO/YES |
| Test 12 | WF-C3 PASS | Principal required | | NO/YES |
| Test 13 | WF-M4 concern | Activity type enforced | | NO/YES |
| Test 14 | 45% coverage | Won/Lost logging works | | NO/YES |
| Test 15 | Security | RLS filtering works | | NO/YES |
| Test 16 | WF-H1 PASS | Stage values consistent | | NO/YES |
| Test 17 | DB integrity | Org types valid | | NO/YES |
| Test 18 | - | No validation bypass | | NO/YES |
| Test 19 | - | Special chars safe | | NO/YES |
| Test 20 | - | Full lifecycle OK | | NO/YES |

---

### Summary Metrics

**Bug Confirmation:**
- Bugs CONFIRMED: ___/9 critical, ___/10 high
- Bugs FIXED (false positives): ___
- Bugs WORSE than reported: ___

**Blind Spots Found:**
- New bugs discovered: ___
- Audit claims invalidated: ___
- Additional gaps: ___

**Audit Accuracy:**
- Original confidence: 98%
- Adjusted confidence: ___%
- Accuracy rating: EXCELLENT/GOOD/NEEDS_REVISION

---

### Detailed Findings

**New Bugs Discovered (Blind Spots):**
1. [Describe any new bugs found]

**False Positives (Reported bugs that aren't bugs):**
1. [Describe any findings that were wrong]

**Audit Claims Validated:**
1. Close reason enforcement: VALIDATED/INVALIDATED
2. Stage logging works: VALIDATED/INVALIDATED
3. RLS security: VALIDATED/INVALIDATED
4. DB constraints: VALIDATED/INVALIDATED

---

### Final Confidence Assessment

**Pre-E2E Confidence:** 98%

**Post-E2E Confidence:** ___%

**Calculation:**
- Critical confirmed: ___/9 (weight: 40%)
- High confirmed: ___/10 (weight: 30%)
- PASS claims validated: ___/10 (weight: 20%)
- No new blind spots: YES/NO (weight: 10%)

**Final Rating:**
- 95-100%: AUDIT HIGHLY ACCURATE
- 85-94%: AUDIT ACCURATE, MINOR ADJUSTMENTS
- 70-84%: AUDIT NEEDS REVISION
- <70%: AUDIT UNRELIABLE
```

---

*Generated for Workflow Gaps Audit verification*
*Report: docs/audits/2026-01-11-workflow-gaps.md*
