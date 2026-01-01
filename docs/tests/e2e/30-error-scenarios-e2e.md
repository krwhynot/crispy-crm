# Error Scenarios E2E Manual Testing Checklist

Comprehensive negative testing checklist for verifying error handling across all CRM modules. These tests intentionally trigger failures to confirm the system handles them gracefully.

## Test Environment Setup

- **Browser:** Chrome with DevTools open
- **URL:** http://localhost:5173
- **DevTools Tabs Required:**
  - Console (for error monitoring)
  - Network (for API error inspection)
- **Seed Data:** Run `./scripts/seed-e2e-dashboard-v3.sh`

### Test Users

| Role | Email | Password | Use For |
|------|-------|----------|---------|
| Admin | admin@test.com | password123 | Full access, baseline tests |
| Manager | manager@mfbroker.com | password123 | Role restriction tests |
| Rep | rep@mfbroker.com | password123 | Cross-org, permission tests |

---

## Section 1: Form Validation Error Tests

### 1.1 Required Field Errors

**Objective:** Verify required field validation messages appear correctly.

#### Test 1.1.1: Contact - Missing First Name

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill in Last Name: `Test User`
3. Select an Organization
4. Select Account Manager
5. Add email: `test@example.com`
6. Click "Save"

**Expected Results:**
- [ ] Save is prevented (button disabled or submission blocked)
- [ ] Error message appears: "First name is required" or similar
- [ ] First name field is visually marked as invalid
- [ ] No console errors (validation is client-side)

---

#### Test 1.1.2: Contact - Missing Organization

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill in First Name: `Test`
3. Fill in Last Name: `User`
4. Leave Organization empty
5. Select Account Manager
6. Add email: `test@example.com`
7. Attempt to save

**Expected Results:**
- [ ] Save is prevented
- [ ] Error message appears for Organization field
- [ ] Organization field is marked as invalid

---

#### Test 1.1.3: Organization - Missing Name

**Steps:**
1. Navigate to `/#/organizations/create`
2. Leave Name field empty
3. Fill optional fields (website, phone)
4. Click "Create Organization"

**Expected Results:**
- [ ] Form prevents submission
- [ ] Error message: "Name is required"
- [ ] Name input has error styling
- [ ] No RLS errors in console

---

#### Test 1.1.4: Opportunity - Missing Customer Organization

**Steps:**
1. Navigate to `/#/opportunities/create`
2. Fill in Opportunity Name: `Test Deal`
3. Leave Customer Organization empty
4. Complete wizard steps
5. Attempt to save

**Expected Results:**
- [ ] Wizard blocks progress or final save fails
- [ ] Error: "Customer organization is required"
- [ ] Customer org field highlighted

---

#### Test 1.1.5: Activity - Missing Subject

**Steps:**
1. Navigate to `/#/activities/create`
2. Leave Subject field empty
3. Select Activity Type: Call
4. Select a Contact or Organization
5. Click "Save"

**Expected Results:**
- [ ] Form prevents submission
- [ ] Error: "Subject is required"
- [ ] Subject field has error state

---

#### Test 1.1.6: Task - Missing Title

**Steps:**
1. Navigate to `/#/tasks/create`
2. Leave Title empty
3. Set Due Date to tomorrow
4. Select Type: Follow-up
5. Click "Save"

**Expected Results:**
- [ ] Save prevented
- [ ] Error: "Title is required"
- [ ] Title field marked invalid

---

#### Test 1.1.7: Task - Missing Due Date

**Steps:**
1. Navigate to `/#/tasks/create`
2. Fill Title: `Test Task`
3. Clear or leave Due Date empty
4. Click "Save"

**Expected Results:**
- [ ] Save prevented
- [ ] Error: "Due date is required"
- [ ] Due date field shows error

---

### 1.2 Format Validation Errors

**Objective:** Verify format validation for email, URL, and other formatted fields.

#### Test 1.2.1: Invalid Email Format

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill required fields (name, org)
3. In Email field, enter: `not-an-email`
4. Click "Save"

**Expected Results:**
- [ ] Submission prevented
- [ ] Error: "Invalid email format" or "Please enter a valid email"
- [ ] Email field shows error styling

---

#### Test 1.2.2: Email Missing Domain

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill required fields
3. Enter Email: `user@`
4. Blur the field or attempt save

**Expected Results:**
- [ ] Validation error shown
- [ ] Message indicates invalid email format

---

#### Test 1.2.3: Non-LinkedIn URL in LinkedIn Field

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill Name: `LinkedIn Test Org`
3. Navigate to More tab (if applicable)
4. In LinkedIn URL field, enter: `https://twitter.com/company/test`
5. Attempt to save

**Expected Results:**
- [ ] Validation error shown
- [ ] Error: "Must be a valid LinkedIn URL" or similar
- [ ] Field marked invalid

---

#### Test 1.2.4: Invalid Website URL

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill Name: `URL Test Org`
3. In Website field, enter: `not a valid url`
4. Attempt to save

**Expected Results:**
- [ ] Validation error for website field
- [ ] Error indicates invalid URL format

---

#### Test 1.2.5: Phone Number Too Long

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill required fields
3. In Phone field, enter 50+ characters
4. Attempt to save

**Expected Results:**
- [ ] Validation error shown
- [ ] Error: "Phone number too long" or max length message

---

#### Test 1.2.6: Founded Year Before 1800

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill Name: `Old Company`
3. In Founded Year, enter: `1799`
4. Attempt to save

**Expected Results:**
- [ ] Validation error
- [ ] Error: "Year must be 1800 or later"

---

#### Test 1.2.7: Founded Year in Future

**Steps:**
1. Navigate to `/#/organizations/create`
2. Fill Name: `Future Company`
3. In Founded Year, enter: `2030`
4. Attempt to save

**Expected Results:**
- [ ] Validation error
- [ ] Error: "Year cannot be in the future"

---

### 1.3 Length Limit Errors

**Objective:** Verify max length constraints are enforced.

#### Test 1.3.1: Contact First Name Exceeds 100 Characters

**Steps:**
1. Navigate to `/#/contacts/create`
2. Generate 101 "a" characters
3. Paste into First Name field
4. Complete other required fields
5. Attempt to save

**Expected Results:**
- [ ] Input truncated to 100 chars OR validation error shown
- [ ] Error message if exceeded: "First name too long" or max length indicator

---

#### Test 1.3.2: Email Exceeds 254 Characters

**Steps:**
1. Navigate to `/#/contacts/create`
2. Create email with 255+ characters (e.g., long local part)
3. Enter in email field
4. Attempt to save

**Expected Results:**
- [ ] Validation error or truncation
- [ ] Email field shows error

---

#### Test 1.3.3: Organization Name Exceeds 255 Characters

**Steps:**
1. Navigate to `/#/organizations/create`
2. Generate 256 "a" characters
3. Paste into Name field
4. Attempt to save

**Expected Results:**
- [ ] Validation error for name length
- [ ] Field shows error styling

---

#### Test 1.3.4: Opportunity Name Exceeds 255 Characters

**Steps:**
1. Navigate to `/#/opportunities/create`
2. Enter 256+ character name
3. Complete wizard
4. Attempt to save

**Expected Results:**
- [ ] Validation blocks save
- [ ] Error indicates name too long

---

#### Test 1.3.5: Activity Subject Exceeds 255 Characters

**Steps:**
1. Navigate to `/#/activities/create`
2. Enter 256+ characters in Subject
3. Complete other fields
4. Attempt to save

**Expected Results:**
- [ ] Validation error for subject length

---

#### Test 1.3.6: Activity Description Exceeds 5000 Characters

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill Subject and other required fields
3. In Description, paste 5001+ characters
4. Attempt to save

**Expected Results:**
- [ ] Validation error or truncation
- [ ] Error: "Description too long"

---

#### Test 1.3.7: Task Title Exceeds 500 Characters

**Steps:**
1. Navigate to `/#/tasks/create`
2. Enter 501+ characters in Title
3. Set Due Date
4. Attempt to save

**Expected Results:**
- [ ] Validation error for title length

---

#### Test 1.3.8: Notes Text Exceeds 10000 Characters

**Steps:**
1. Open any entity slide-over with Notes tab
2. Create new note with 10001+ characters
3. Attempt to save

**Expected Results:**
- [ ] Validation error
- [ ] Error: "Note text too long"

---

### 1.4 Conditional Validation Errors

**Objective:** Verify validation rules that depend on other field values.

#### Test 1.4.1: Opportunity Closed Won - Missing Win Reason

**Steps:**
1. Navigate to existing opportunity in Kanban view
2. Drag opportunity to "Closed Won" column
3. In the modal that appears, leave Win Reason empty
4. Click "Confirm" or "Save"

**Expected Results:**
- [ ] Modal prevents closing
- [ ] Error: "Win reason is required"
- [ ] Win reason dropdown highlighted

---

#### Test 1.4.2: Opportunity Closed Lost - Missing Loss Reason

**Steps:**
1. Navigate to existing opportunity in Kanban view
2. Drag opportunity to "Closed Lost" column
3. In the modal, leave Loss Reason empty
4. Attempt to confirm

**Expected Results:**
- [ ] Modal prevents closing
- [ ] Error: "Loss reason is required"
- [ ] Loss reason field highlighted

---

#### Test 1.4.3: Opportunity Reason "Other" - Missing Notes

**Steps:**
1. Drag opportunity to Closed Won or Closed Lost
2. Select Win/Loss Reason: "Other"
3. Leave "Reason Notes" field empty
4. Attempt to confirm

**Expected Results:**
- [ ] Validation error appears
- [ ] Error: "Please explain the reason" or "Notes required for 'Other'"
- [ ] Notes field highlighted

---

#### Test 1.4.4: Sample Activity - Missing Sample Status

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill Subject: `Sample Test`
3. Select Activity Type: `Sample`
4. Leave Sample Status field empty
5. Complete other required fields
6. Attempt to save

**Expected Results:**
- [ ] Validation error
- [ ] Error: "Sample status is required"
- [ ] Sample status field highlighted

---

#### Test 1.4.5: Follow-up Required - Missing Follow-up Date

**Steps:**
1. Navigate to `/#/activities/create`
2. Fill required fields
3. Toggle "Follow-up Required" to ON/true
4. Leave Follow-up Date empty
5. Attempt to save

**Expected Results:**
- [ ] Validation error
- [ ] Error: "Follow-up date is required"
- [ ] Date field highlighted

---

#### Test 1.4.6: Contact Manager Cannot Be Self

**Steps:**
1. Create a contact (Contact A)
2. Edit Contact A
3. In Manager field, search for and select Contact A (self)
4. Attempt to save

**Expected Results:**
- [ ] Validation error
- [ ] Error: "Contact cannot be their own manager"

---

### 1.5 Zod Boundary Tests (API-Level)

**Objective:** Verify API-level Zod validation catches malicious or malformed input.

#### Test 1.5.1: Mass Assignment Prevention

**Steps:**
1. Open DevTools Network tab
2. Submit a valid contact form
3. Intercept the request and add extra field: `"is_admin": true`
4. Replay the modified request

**Expected Results:**
- [ ] Extra field is ignored (not saved to database)
- [ ] No error (graceful handling via strictObject)
- [ ] Verify in database: is_admin not set

---

#### Test 1.5.2: Type Coercion Failure

**Steps:**
1. Open DevTools Network tab
2. Intercept activity create request
3. Modify `duration_minutes` to: `"abc"`
4. Submit modified request

**Expected Results:**
- [ ] API returns validation error
- [ ] Error in response body: type coercion failed
- [ ] HTTP 400 status

---

#### Test 1.5.3: Invalid Enum Value

**Steps:**
1. Open DevTools Network tab
2. Intercept opportunity update
3. Modify `stage` to: `"invalid_stage"`
4. Submit modified request

**Expected Results:**
- [ ] API returns validation error
- [ ] Error: "Invalid enum value"
- [ ] HTTP 400 status

---

#### Test 1.5.4: Array Overflow (Attendees)

**Steps:**
1. Create activity with meeting type
2. In DevTools, intercept request
3. Modify `attendees` array to 51 items
4. Submit modified request

**Expected Results:**
- [ ] API returns validation error
- [ ] Error: "Maximum 50 attendees" or array limit message

---

#### Test 1.5.5: Negative Number Rejection

**Steps:**
1. Create activity
2. In DevTools, intercept request
3. Modify `duration_minutes` to: `-5`
4. Submit modified request

**Expected Results:**
- [ ] API returns validation error
- [ ] Error: "Must be positive" or "Must be greater than 0"

---

## Section 2: RLS/Permission Error Tests

### 2.1 Cross-Organization Access (Multi-Tenant)

**Objective:** Verify RLS prevents access to other organizations' data.

#### Test 2.1.1: View Other Org's Contact by ID

**Prerequisites:** Note a contact ID from a different organization (Admin can query this).

**Steps:**
1. Log in as Rep user
2. Manually navigate to `/#/contacts/[other-org-contact-id]`
3. Observe result

**Expected Results:**
- [ ] Contact NOT displayed
- [ ] 404 page or empty record shown
- [ ] Console may show RLS error (expected)
- [ ] No sensitive data exposed

---

#### Test 2.1.2: Edit Other Org's Opportunity via API

**Steps:**
1. Log in as Rep user
2. Open DevTools Network tab
3. Find an opportunity update request structure
4. Modify request to use another org's opportunity ID
5. Submit modified request

**Expected Results:**
- [ ] RLS error in console
- [ ] API returns 403 or empty result
- [ ] Patterns in console: "permission denied" or "42501"

---

#### Test 2.1.3: List Returns Only Own Org's Data

**Steps:**
1. Log in as Rep user
2. Navigate to `/#/contacts`
3. Open DevTools Network tab
4. Inspect the API response for the list

**Expected Results:**
- [ ] Response contains ONLY current org's contacts
- [ ] No contacts from other organizations visible
- [ ] `organization_id` matches current user's org

---

### 2.2 Role-Based Restriction Tests

**Objective:** Verify role-based access controls are enforced.

#### Test 2.2.1: Rep Cannot Create Users

**Steps:**
1. Log in as Rep (rep@mfbroker.com)
2. Navigate to `/#/sales/create`
3. Observe result

**Expected Results:**
- [ ] Route blocked OR create button hidden
- [ ] If accessible, save fails with permission error
- [ ] No ability to add new team members

---

#### Test 2.2.2: Rep Cannot View Manager's Opportunities

**Steps:**
1. Log in as Rep
2. Navigate to `/#/opportunities`
3. Search for opportunities assigned to Manager user

**Expected Results:**
- [ ] Only Rep's own opportunities visible
- [ ] Manager's opportunities not in list
- [ ] Filter by owner shows only own records

---

#### Test 2.2.3: Rep Cannot Bulk Reassign

**Steps:**
1. Log in as Rep
2. Navigate to `/#/organizations`
3. Select multiple organizations
4. Look for "Reassign" button in bulk actions

**Expected Results:**
- [ ] Reassign button hidden OR disabled for Rep role
- [ ] If clicked, action fails with permission error

---

#### Test 2.2.4: Manager Cannot Access Admin Settings

**Steps:**
1. Log in as Manager (manager@mfbroker.com)
2. Navigate to `/#/settings` or admin area
3. Look for admin-only options

**Expected Results:**
- [ ] Admin-only settings hidden or disabled
- [ ] Cannot modify user roles
- [ ] Cannot change system configuration

---

### 2.3 Soft-Delete Policy Tests

**Objective:** Verify RLS enforces soft-delete (deleted_at) filtering.

#### Test 2.3.1: Deleted Contact Not Visible in List

**Steps:**
1. Log in as Admin
2. Delete a contact (soft delete)
3. Refresh contacts list
4. Search for deleted contact

**Expected Results:**
- [ ] Deleted contact NOT in list
- [ ] Search returns no results for deleted contact
- [ ] Only contacts with `deleted_at IS NULL` visible

---

#### Test 2.3.2: Cannot Edit Soft-Deleted Record via API

**Steps:**
1. Note a deleted record's ID
2. Open DevTools
3. Attempt API update to that record ID
4. Submit request

**Expected Results:**
- [ ] RLS blocks the update
- [ ] Console shows permission error
- [ ] Record remains unchanged

---

#### Test 2.3.3: Cascade Soft-Delete Behavior

**Steps:**
1. Log in as Admin
2. Create Organization with 2 Contacts
3. Delete the Organization
4. Check if Contacts are also soft-deleted

**Expected Results:**
- [ ] Organization deleted (soft)
- [ ] Associated contacts EITHER: also soft-deleted OR remain but orphaned
- [ ] Document observed behavior (implementation-dependent)

---

### 2.4 Console Patterns to Monitor

When running RLS tests, watch console for these patterns:

| Pattern | Meaning |
|---------|---------|
| `permission denied` | RLS policy blocked access |
| `row-level security` | RLS policy violation |
| `42501` | PostgreSQL permission error code |
| `new row violates row-level security` | Insert blocked by RLS |

**Expected Results:**
- [ ] RLS errors appear ONLY for unauthorized access attempts
- [ ] No RLS errors for normal operations
- [ ] Errors are logged but don't expose sensitive info to UI

---

## Section 3: Network/API Error Tests

### 3.1 Server Error Handling (5xx)

**Objective:** Verify graceful handling of server errors.

#### Test 3.1.1: 500 Internal Server Error

**How to Trigger:**
1. Stop Supabase local server: `supabase stop`
2. Attempt any data operation (e.g., load contacts list)

**Expected Results:**
- [ ] Error notification appears in UI
- [ ] Message is user-friendly (not raw stack trace)
- [ ] No application crash
- [ ] Console shows 500 error

---

#### Test 3.1.2: Simulated 502 Bad Gateway

**How to Trigger:**
1. In `.env.local`, temporarily misconfigure `VITE_SUPABASE_URL`
2. Refresh application
3. Attempt to load data

**Expected Results:**
- [ ] Connection error shown
- [ ] UI indicates service unavailable
- [ ] Application remains functional (degraded mode)

---

### 3.2 Authentication Errors (401/403)

**Objective:** Verify auth error handling and redirect to login.

#### Test 3.2.1: Expired Token

**Steps:**
1. Log in normally
2. Wait for session to expire (or manually set short expiry)
3. Attempt a data operation

**Expected Results:**
- [ ] 401 error in console
- [ ] Automatic redirect to login page
- [ ] Clear message: "Session expired, please log in again"

---

#### Test 3.2.2: Manually Clear Auth Token

**Steps:**
1. Log in normally
2. Open DevTools → Application → Local Storage
3. Delete `supabase.auth.token` or auth-related keys
4. Attempt any operation

**Expected Results:**
- [ ] 401 error occurs
- [ ] Redirect to login page
- [ ] No crash or frozen UI

---

#### Test 3.2.3: Invalid Token

**Steps:**
1. Open DevTools → Application → Local Storage
2. Modify auth token to invalid value
3. Attempt data operation

**Expected Results:**
- [ ] 401 in console
- [ ] Redirect to login
- [ ] Auth state cleared

---

### 3.3 Rate Limiting (429)

**Objective:** Verify rate limit handling.

#### Test 3.3.1: Rapid Form Submissions

**Steps:**
1. Navigate to `/#/contacts/create`
2. Fill valid contact data
3. Click Save rapidly 10+ times in succession

**Expected Results:**
- [ ] First submission succeeds
- [ ] Subsequent rapid clicks show loading or are debounced
- [ ] If 429 occurs, message: "Too many requests, please wait"

---

#### Test 3.3.2: Large CSV Import

**Steps:**
1. Navigate to Contacts or Organizations import
2. Upload CSV with 1000+ rows
3. Start import

**Expected Results:**
- [ ] Progress indicator shown
- [ ] If rate limited, queue message or batch processing indicator
- [ ] Clear feedback on import status

---

### 3.4 Network Failure

**Objective:** Verify offline and slow network handling.

#### Test 3.4.1: Offline Mode

**Steps:**
1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Attempt to load contacts list
4. Attempt to save a new contact

**Expected Results:**
- [ ] "No connection" indicator appears
- [ ] Data load fails gracefully
- [ ] Save shows network error (not silent fail)
- [ ] Previously cached data may still display

---

#### Test 3.4.2: Slow Network (3G Simulation)

**Steps:**
1. Open DevTools → Network tab
2. Select "Slow 3G" throttling
3. Navigate between pages
4. Submit a form

**Expected Results:**
- [ ] Loading spinners/skeletons visible
- [ ] No timeouts within reasonable period (30s+)
- [ ] UI remains responsive during load

---

#### Test 3.4.3: Request Timeout

**Steps:**
1. Set very slow throttling (custom: 1 Kbps)
2. Submit a form that requires API call
3. Wait for timeout (if implemented)

**Expected Results:**
- [ ] Timeout error shown after reasonable period
- [ ] User can retry action
- [ ] Form data preserved (not lost on timeout)

---

## Section 4: Error UX/Accessibility Tests

### 4.1 WCAG 3.3.1 Compliance

**Objective:** Verify accessible error messaging.

#### Test 4.1.1: aria-invalid Attribute

**Steps:**
1. Navigate to `/#/contacts/create`
2. Submit form with empty required fields
3. Inspect invalid field with DevTools Elements

**Expected Results:**
- [ ] Invalid fields have `aria-invalid="true"`
- [ ] Valid fields have `aria-invalid="false"` or no attribute
- [ ] Screen readers announce invalid state

---

#### Test 4.1.2: aria-describedby Linking

**Steps:**
1. Trigger validation error on any field
2. Inspect the field and error message elements
3. Check IDs match

**Expected Results:**
- [ ] Field has `aria-describedby="[error-id]"`
- [ ] Error message has matching `id="[error-id]"`
- [ ] Screen readers announce error when field focused

---

#### Test 4.1.3: role="alert" on Error Messages

**Steps:**
1. Trigger validation error
2. Inspect error message element

**Expected Results:**
- [ ] Error container has `role="alert"`
- [ ] Screen readers immediately announce error
- [ ] Live region properly configured

---

#### Test 4.1.4: Focus Management on Error

**Steps:**
1. Fill form with multiple errors
2. Submit form
3. Observe where focus moves

**Expected Results:**
- [ ] Focus moves to first error field
- [ ] User can tab through errors
- [ ] Error summary (if present) is focusable

---

### 4.2 Error Message Clarity

**Objective:** Verify error messages are clear and actionable.

#### Test 4.2.1: Validation Error Specificity

**Steps:**
1. Trigger various validation errors
2. Read each error message

**Expected Results:**
- [ ] Messages are specific (not generic "Invalid input")
- [ ] Messages say what's wrong AND how to fix
- [ ] Example: "Email format invalid. Use: name@domain.com"

---

#### Test 4.2.2: API Error User-Friendly

**Steps:**
1. Trigger a server error (stop Supabase)
2. Read error shown to user

**Expected Results:**
- [ ] Message is user-friendly (not raw JSON/stack trace)
- [ ] No technical jargon exposed
- [ ] Suggests retry or contact support

---

#### Test 4.2.3: RLS Error Not Exposed

**Steps:**
1. Attempt unauthorized action (access other org's data)
2. Read any error shown

**Expected Results:**
- [ ] No RLS policy details exposed to user
- [ ] Generic "Access denied" or "Not found"
- [ ] No database table names or column names shown

---

### 4.3 Form Error Recovery

**Objective:** Verify users can recover from errors without data loss.

#### Test 4.3.1: Fix Error and Resubmit

**Steps:**
1. Fill form with valid data except one field
2. Submit (validation fails)
3. Fix the error
4. Submit again

**Expected Results:**
- [ ] All valid data preserved after first error
- [ ] Only fixed field needed re-entry
- [ ] Second submission succeeds

---

#### Test 4.3.2: Draft Recovery After Tab Close

**Steps (Activities only - has draft persistence):**
1. Start filling Activity quick-log form
2. Close browser tab
3. Reopen and navigate to same form

**Expected Results:**
- [ ] Draft data restored (within 24 hours)
- [ ] User can continue from where they left off
- [ ] OR clear message that drafts are not saved

---

#### Test 4.3.3: Session Timeout During Form

**Steps:**
1. Start filling a long form
2. Wait for session timeout (or simulate)
3. Submit form

**Expected Results:**
- [ ] Prompt to re-authenticate
- [ ] Form data preserved during re-auth
- [ ] After login, can complete submission

---

## Console Monitoring Checklist

Run these checks throughout all test sections:

### Error Patterns to Watch

| Pattern | Severity | Action |
|---------|----------|--------|
| `Uncaught` | Critical | Report bug |
| `React error` | Critical | Report bug |
| `permission denied` | Expected (RLS test) | Verify expected |
| `42501` | Expected (RLS test) | Verify expected |
| `ResizeObserver loop` | Ignore | Browser quirk |
| `500` status | Critical | Check server |
| `401` status | Expected (auth test) | Verify redirect |
| `429` status | Expected (rate test) | Verify message |

### Final Console Check

After completing tests:
- [ ] No unexpected console errors
- [ ] All expected errors (RLS, auth) occurred in correct tests
- [ ] No memory leak warnings
- [ ] No performance warnings

---

## Pass Criteria

### Critical (Must Pass)

These tests MUST pass - failures are blockers:

- [ ] **1.1.x** - All required field validations work
- [ ] **1.4.1-1.4.3** - Win/loss reason conditional validation
- [ ] **2.1.x** - RLS prevents cross-org access
- [ ] **2.2.1** - Role restrictions enforced
- [ ] **3.2.x** - Auth errors redirect to login
- [ ] **4.1.x** - WCAG accessibility compliance

### Important (Should Pass)

Failures are high-priority bugs:

- [ ] **1.2.x** - Format validations (email, URL)
- [ ] **1.3.x** - Length limit validations
- [ ] **2.3.x** - Soft-delete policies
- [ ] **3.1.x** - Server error handling
- [ ] **4.2.x** - Error message clarity

### Nice to Have

Failures are improvements for later:

- [ ] **3.3.x** - Rate limiting UI
- [ ] **3.4.x** - Offline mode handling
- [ ] **4.3.x** - Form recovery features

---

## Summary

| Section | Tests | Focus |
|---------|-------|-------|
| 1. Validation | 25+ | Form errors, Zod boundaries |
| 2. RLS/Permissions | 12 | Multi-tenant, role access |
| 3. Network/API | 10 | Server errors, auth, offline |
| 4. Error UX | 10 | Accessibility, clarity, recovery |

**Total: ~60 error scenario tests**

---

## Notes

### Test Data Cleanup

After running error tests:
1. Delete any test records created
2. Reset modified test data
3. Verify no orphaned records

### Timestamp Convention

For test data created during error testing:
- Format: `Error Test [Entity] 2025-12-31-HHMMSS`
- Makes test data easy to identify and clean up

### Network Throttling Reset

After network tests:
1. DevTools → Network → No Throttling
2. Uncheck "Offline" checkbox
3. Verify normal connectivity before next test section

### Estimated Duration

- Section 1 (Validation): 45-60 minutes
- Section 2 (RLS): 30-45 minutes
- Section 3 (Network): 30-45 minutes
- Section 4 (UX): 20-30 minutes
- **Total: 2-3 hours**
