# Form Validation Error Messages - Claude Chrome E2E Test

> **Test ID:** CRUD-VAL-001
> **Priority:** High
> **Environment:** Local
> **Feature:** Form validation error message transformation
> **Duration:** ~15-20 minutes

## Prerequisites

- [ ] Dev server running (`npm run dev` or `just dev`)
- [ ] Logged in as `admin@test.com` (or any valid user)
- [ ] DevTools Console open (F12 → Console tab)
- [ ] Browser: Chrome/Edge (recommended for DevTools compatibility)

## Test Context

This test verifies that form validation errors now display user-friendly messages instead of technical Zod errors. The `createFormResolver` function was updated to intercept Zod validation errors and transform them using `getFriendlyErrorMessage()` utility.

**What Changed:**
- ❌ **Before**: "Invalid input: expected string, received undefined"
- ✅ **After**: "This field is required."

**Impact:** Affects all forms using Zod schemas (Organizations, Contacts, Tasks, Opportunities, Activities)

---

## Test Strategy

We'll test 4 forms with focus on:
1. **Required field validation** (missing values)
2. **Format validation** (invalid email, dates)
3. **Enum validation** (dropdowns, select fields)
4. **Regression testing** (Opportunities form already working)

---

## Steps

### Step 1: Organizations Create - Missing Required Name

1. Navigate to `http://localhost:5173/#/organizations/create`
2. **VERIFY:** Page loads with "Create Organization" header
3. **VERIFY:** Form fields visible (Name, Segment, etc.)
4. Locate the "Name" field - **DO NOT** enter any text
5. If a "Segment" dropdown exists, select any valid option
6. Click the **"Save"** button
7. **VERIFY:** Error message appears below Name field
8. **VERIFY:** Error text is user-friendly:
   - ✅ PASS if: "This field is required." OR "Name is required"
   - ❌ FAIL if: "Invalid input" OR "expected string, received undefined"
9. **VERIFY:** Form does NOT submit (stays on create page)
10. **VERIFY:** Console shows no red errors (yellow warnings OK)

---

### Step 2: Organizations Create - Missing Required Segment

1. Stay on the same form (or refresh if you navigated away)
2. Enter "Test Organization" in the **Name** field
3. Locate the "Segment" dropdown
4. **DO NOT** select any segment (leave it blank/placeholder)
5. Click the **"Save"** button
6. **VERIFY:** Error message appears below Segment field
7. **VERIFY:** Error text is user-friendly:
   - ✅ PASS if: "Please select a segment" OR "This field is required."
   - ❌ FAIL if: "Invalid option" OR "expected one of..."
8. **VERIFY:** Form does NOT submit

---

### Step 3: Organizations Create - Valid Submission

1. Stay on the same form
2. Ensure "Test Organization" is still in Name field
3. Select a valid segment from dropdown (e.g., "Operators", "Distributors")
4. Click the **"Save"** button
5. **VERIFY:** No error messages appear
6. **VERIFY:** Success notification appears (green toast/banner)
7. **VERIFY:** Navigates away to organization detail or list page
8. **VERIFY:** Console shows no red errors

---

### Step 4: Contacts Create - Missing Required First Name

1. Navigate to `http://localhost:5173/#/contacts/create`
2. **VERIFY:** Page loads with "Create Contact" header
3. Locate "First Name" field - **DO NOT** enter any text
4. Enter "Doe" in the **Last Name** field
5. Enter "test@example.com" in the **Email** field
6. Click the **"Save"** button
7. **VERIFY:** Error message appears below First Name field
8. **VERIFY:** Error text is user-friendly:
   - ✅ PASS if: "This field is required." OR "First name is required"
   - ❌ FAIL if: "Invalid input: expected string, received undefined"
9. **VERIFY:** Form does NOT submit

---

### Step 5: Contacts Create - Invalid Email Format

1. Stay on the same form (or refresh)
2. Enter "John" in the **First Name** field
3. Enter "Doe" in the **Last Name** field
4. Enter "not-an-email" in the **Email** field (no @ symbol)
5. Tab away from Email field OR click "Save" button
6. **VERIFY:** Error message appears below Email field
7. **VERIFY:** Error text is user-friendly:
   - ✅ PASS if: "Please enter a valid email address." OR "Invalid email format"
   - ❌ FAIL if: "Invalid email" (raw Zod message)
8. **VERIFY:** Form does NOT submit (if Save was clicked)

---

### Step 6: Contacts Create - Valid Submission

1. Stay on the same form
2. Ensure "John" is in First Name field
3. Ensure "Doe" is in Last Name field
4. Change Email field to "john.doe@example.com" (valid email)
5. Click the **"Save"** button
6. **VERIFY:** No error messages appear
7. **VERIFY:** Success notification appears
8. **VERIFY:** Navigates away to contact detail or list page
9. **VERIFY:** Console shows no red errors

---

### Step 7: Tasks Create - Missing Required Title

1. Navigate to `http://localhost:5173/#/tasks/create`
2. **VERIFY:** Page loads with "Create Task" header
3. Locate "Title" field - **DO NOT** enter any text
4. If "Task Type" dropdown exists, select any valid option
5. If "Due Date" exists, select today's date
6. Click the **"Save"** button
7. **VERIFY:** Error message appears below Title field
8. **VERIFY:** Error text is user-friendly:
   - ✅ PASS if: "This field is required." OR "Title is required"
   - ❌ FAIL if: "Invalid input: expected string, received undefined"
9. **VERIFY:** Form does NOT submit

---

### Step 8: Tasks Create - Missing Required Task Type

1. Stay on the same form (or refresh)
2. Enter "Follow up with client" in the **Title** field
3. Locate "Task Type" dropdown - **DO NOT** select any option
4. Click the **"Save"** button
5. **VERIFY:** Error message appears below Task Type field
6. **VERIFY:** Error text is user-friendly:
   - ✅ PASS if: "Please select a valid option." OR "This field is required."
   - ❌ FAIL if: "Invalid input" OR "expected one of..."
7. **VERIFY:** Form does NOT submit

---

### Step 9: Tasks Create - Valid Submission

1. Stay on the same form
2. Ensure "Follow up with client" is in Title field
3. Select a valid task type from dropdown
4. Fill any other required fields (due date, assignee, etc.)
5. Click the **"Save"** button
6. **VERIFY:** No error messages appear
7. **VERIFY:** Success notification appears
8. **VERIFY:** Navigates away to task detail or list page
9. **VERIFY:** Console shows no red errors

---

### Step 10: Opportunities Create - Regression Test (Name Required)

1. Navigate to `http://localhost:5173/#/opportunities/create`
2. **VERIFY:** Page loads with "Create Opportunity" header
3. Locate "Name" field - **DO NOT** enter any text
4. Click the **"Save"** button
5. **VERIFY:** Error message appears below Name field
6. **VERIFY:** Error text is user-friendly (same quality as before the fix):
   - ✅ PASS if: "Name is required" OR "This field is required."
   - ❌ FAIL if: Technical error OR different message format than before
7. **VERIFY:** Form does NOT submit
8. **Note:** This form was already working - we're checking for regressions

---

### Step 11: Opportunities Create - Valid Submission (Regression)

1. Stay on the same form
2. Enter "Big Deal" in the **Name** field
3. Fill any other required fields (stage, amount, organization, etc.)
4. Click the **"Save"** button
5. **VERIFY:** No error messages appear
6. **VERIFY:** Success notification appears
7. **VERIFY:** Navigates away to opportunity detail or list page
8. **VERIFY:** Console shows no red errors
9. **VERIFY:** Behavior is identical to before the fix (no regressions)

---

## Console Monitoring

Keep DevTools Console open (F12) throughout testing.

**Watch for these error patterns:**

| Error Type | Patterns | Severity |
|------------|----------|----------|
| **React Errors** | "Uncaught", "Error boundary", "Cannot read property" | ❌ CRITICAL - Test fails |
| **Validation Errors** | "Zod", "validation failed" (in console, not UI) | ❌ CRITICAL - Should be caught by resolver |
| **Network Errors** | 500, 403, 401, "Failed to fetch" | ❌ CRITICAL - Backend issue |
| **Type Errors** | "undefined is not an object", "null is not a function" | ❌ CRITICAL - Type safety broken |

**Safe to ignore:**
- `ResizeObserver loop` (browser quirk)
- Yellow warnings (unless specifically about validation)
- `DevTools failed to load source map` (dev build artifact)

---

## On Failure

If any step fails:

1. **Screenshot** the current state (especially error messages)
2. **Copy** console errors (all red text)
3. **Note** the current URL
4. **Record** the step number and what went wrong
5. **Report** in this format:

```
CRUD-VAL-001: FAIL
Step: [number] - [description]
Expected: [what should happen]
Actual: [what happened]
Error Message Shown: "[exact text from UI]"
Console Errors: [paste red errors]
Screenshot: [describe what's visible]
Browser: [Chrome/Edge/Firefox + version]
```

**Example failure report:**
```
CRUD-VAL-001: FAIL
Step: 4 - Contacts Create missing first name
Expected: "This field is required."
Actual: "Invalid input: expected string, received undefined"
Error Message Shown: "Invalid input: expected string, received undefined"
Console Errors: None
Screenshot: Form with technical Zod error below First Name field
Browser: Chrome 131.0.6778.139
```

---

## Pass Criteria

**ALL of the following must be true for PASS:**

- ✅ All error messages are user-friendly (no "Invalid input", "expected X, received Y")
- ✅ All forms block submission when validation fails
- ✅ All forms submit successfully when data is valid
- ✅ No red console errors during any step
- ✅ Opportunities form shows no regressions (works as before)

**Partial Pass:**
- If 1-2 forms fail but others pass, report as "PARTIAL PASS" with details

**Fail:**
- If 3+ forms show technical errors, report as "FAIL"
- If any console errors occur, report as "FAIL"
- If valid data fails to submit, report as "FAIL"

---

## Report Format

After completing all steps, report results using this template:

```
# CRUD-VAL-001 Test Results

**Date:** [YYYY-MM-DD HH:MM]
**Tester:** Claude Chrome
**Browser:** [Chrome/Edge version]
**Environment:** Local (http://localhost:5173)

## Summary
- Organizations Create: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
- Contacts Create: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
- Tasks Create: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
- Opportunities Create: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

## Overall Result
✅ PASS - All forms show friendly error messages
⚠️ PARTIAL PASS - [describe which forms failed]
❌ FAIL - [describe issues]

## Error Messages Observed
[For each form, list the actual error messages seen]

Organizations Name: "[exact message]"
Organizations Segment: "[exact message]"
Contacts First Name: "[exact message]"
Contacts Email: "[exact message]"
Tasks Title: "[exact message]"
Tasks Type: "[exact message]"

## Console Errors
[None] OR [list errors]

## Notes
[Any additional observations, unexpected behavior, or edge cases discovered]
```

---

## Quick Version (if time is limited)

Test just these critical scenarios:

1. **Organizations Create** - Leave Name blank, click Save
   - ✅ Should show: "This field is required."
   - ❌ Should NOT show: "Invalid input: expected string, received undefined"

2. **Contacts Create** - Enter "invalid-email" without @, click Save
   - ✅ Should show: "Please enter a valid email address."
   - ❌ Should NOT show: Technical Zod error

3. **Opportunities Create** - Leave Name blank, click Save
   - ✅ Should show same friendly error as before (regression check)

---

## Test Maintenance

**When to re-run:**
- After any changes to `src/lib/zodErrorFormatting.ts`
- After schema updates in `src/atomic-crm/validation/*.ts`
- After React Admin form component updates
- Before merging validation-related PRs

**Update frequency:** Run once per sprint or after validation changes

---

## Related Documentation

- **Implementation Plan:** `/tmp/validation-error-ux-plan.md`
- **Unit Tests:** `src/lib/__tests__/zodErrorFormatting.test.ts`
- **Manual Testing Guide:** (the guide provided earlier in this conversation)
- **Form Resolver Code:** `src/lib/zodErrorFormatting.ts` (lines 183-204)

---

**Last Updated:** 2026-01-30
**Version:** 1.0.0
**Author:** Claude Code (Crispy CRM)
