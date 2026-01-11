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

*Generated for Workflow Gaps Audit verification*
*Report: docs/audits/2026-01-11-workflow-gaps.md*
