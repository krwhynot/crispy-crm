# Manual E2E Test Plan - Crispy CRM

**Generated:** 2026-01-23
**Stack:** React 19 + TypeScript + React Admin 5 + Supabase
**Framework:** Manual E2E Testing with optional Claude Chrome automation
**Confidence:** 92%

---

## Executive Summary

This document provides comprehensive manual E2E test suites covering all critical audit findings from the 2026-01-23 full codebase audit. Tests are organized by category with clear steps, expected results, and verification commands.

### Test Coverage Matrix

| Suite | Issues Covered | Priority | Est. Time |
|-------|---------------|----------|-----------|
| 1. Soft Delete Verification | DI-001, DI-002, DI-005 | Critical | 15 min |
| 2. RLS Policy Verification | DI-003 | Critical | 20 min |
| 3. Constraint Enforcement | WG-001, WG-002 | High | 15 min |
| 4. Error Handling | EH-001 | High | 10 min |
| 5. Type Safety | TS-001, TS-002, TS-003 | High | 15 min |
| 6. State Management | SS-001 to SS-005 | Critical | 20 min |
| 7. UI/Architecture | ARCH-001, Touch Targets | Medium | 15 min |
| 8. Security (XSS Prevention) | SEC-001 | High | 10 min |

**Total Estimated Time:** ~2 hours

---

## Prerequisites

### Environment Setup

```bash
# 1. Start Supabase local instance
supabase start

# 2. Reset and seed database with E2E data
just seed-e2e

# 3. Start development server
npm run dev

# 4. Verify environment
curl http://localhost:5173/health
```

### Test User Accounts

| User | Email | Role | Sales ID | Purpose |
|------|-------|------|----------|---------|
| Admin | admin@test.com | admin | 1 | Full access testing |
| Brent | brent@mfbroker.com | admin | 2 | Owner role testing |
| Michelle | michelle@mfbroker.com | manager | 3 | Manager role testing |
| Gary | gary@mfbroker.com | rep | 4 | Rep ownership testing |
| Dale | dale@mfbroker.com | rep | 5 | Cross-rep isolation |
| Sue | sue@mfbroker.com | rep | 6 | Cross-rep isolation |

### Browser Setup

1. Use Chrome DevTools with Network tab open
2. Enable "Preserve log" in Network tab
3. Open Console tab to monitor errors
4. Consider using incognito for each role switch

---

## Suite 1: Soft Delete Verification

**Related Issues:** DI-001, DI-002, DI-005
**Verifies:** DELETE operations use `deleted_at` instead of hard delete

### Test 1.1: Contact Soft Delete

**Steps:**
1. Login as Admin
2. Navigate to Contacts list
3. Note the total count of contacts
4. Select a contact and click "Delete"
5. Confirm the deletion dialog

**Expected Results:**
- [ ] Contact disappears from list
- [ ] Total count decreases by 1
- [ ] No hard DELETE query in Network tab (look for PATCH/UPDATE only)

**Verification Command:**
```sql
-- Run in Supabase SQL Editor
SELECT id, first_name, last_name, deleted_at
FROM contacts
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 5;
```

- [ ] Deleted contact appears with `deleted_at` timestamp (not NULL)

### Test 1.2: Opportunity Soft Delete

**Steps:**
1. Navigate to Opportunities list
2. Open an opportunity detail view
3. Click "Archive" or "Delete" button
4. Confirm the action

**Expected Results:**
- [ ] Opportunity removed from active list
- [ ] Network shows PATCH/UPDATE request (not DELETE)
- [ ] Browser console has no errors

**Verification Command:**
```sql
SELECT id, name, stage, deleted_at
FROM opportunities
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 5;
```

- [ ] Archived opportunity has `deleted_at` timestamp

### Test 1.3: Organization Soft Delete

**Steps:**
1. Navigate to Organizations list
2. Select an organization with no active opportunities
3. Click "Delete"
4. Confirm deletion

**Expected Results:**
- [ ] Organization removed from list
- [ ] Associated contacts still visible (not cascade hard-deleted)
- [ ] Network tab shows UPDATE, not DELETE

**Verification Command:**
```sql
-- Check organization soft deleted
SELECT id, name, deleted_at FROM organizations
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC LIMIT 5;

-- Verify contacts NOT cascade hard-deleted
SELECT c.id, c.first_name, c.organization_id, c.deleted_at
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
WHERE o.deleted_at IS NOT NULL
LIMIT 10;
```

- [ ] Organization shows deleted_at timestamp
- [ ] Related contacts still exist (deleted_at NULL for contacts)

### Test 1.4: Activity Soft Delete

**Steps:**
1. Navigate to an Opportunity detail
2. Go to Activities tab
3. Delete an activity
4. Verify disappears from list

**Verification Command:**
```sql
SELECT id, activity_type, deleted_at
FROM activities
WHERE deleted_at IS NOT NULL
LIMIT 5;
```

- [ ] Activity soft-deleted (has deleted_at, not removed from DB)

---

## Suite 2: RLS Policy Verification

**Related Issues:** DI-003
**Verifies:** Soft-deleted records are hidden by RLS, cross-user visibility correct

### Test 2.1: Deleted Records Hidden by RLS

**Steps:**
1. Login as Admin
2. Open Supabase SQL Editor (or Supabase Studio)
3. Run: `SELECT COUNT(*) FROM contacts;`
4. Run: `SELECT COUNT(*) FROM contacts WHERE deleted_at IS NOT NULL;`

**Expected Results:**
- [ ] First query returns only active contacts (RLS filters deleted)
- [ ] Second query returns 0 (RLS policy blocks deleted records)
- [ ] UI list count matches first query result

**Verification Command:**
```sql
-- As authenticated user, this should return 0
SELECT * FROM contacts WHERE deleted_at IS NOT NULL LIMIT 1;
```

- [ ] Query returns empty result (RLS working)

### Test 2.2: Rep Can Only See Own Records

**Steps:**
1. Logout and login as Gary (rep, sales_id=4)
2. Navigate to Organizations list
3. Note total count
4. Logout and login as Dale (rep, sales_id=5)
5. Navigate to Organizations list
6. Compare counts

**Expected Results:**
- [ ] Gary sees only organizations where sales_id=4
- [ ] Dale sees only organizations where sales_id=5
- [ ] Neither sees organizations owned by the other
- [ ] Neither sees Admin's test organizations

### Test 2.3: Manager Sees All Records

**Steps:**
1. Login as Michelle (manager)
2. Navigate to Contacts, Organizations, Opportunities lists
3. Compare counts to Admin's view

**Expected Results:**
- [ ] Michelle sees same record counts as Admin
- [ ] Can view records owned by any rep
- [ ] Cannot access Sales team management page

### Test 2.4: Cross-Ownership Update Blocked

**Steps:**
1. Login as Gary (rep, sales_id=4)
2. Attempt to find Dale's opportunity (if visible, which it shouldn't be)
3. If found, attempt to edit

**Expected Results:**
- [ ] Dale's opportunities not visible to Gary
- [ ] If manually navigating to URL `/opportunities/{dale's-id}`, should see error or redirect

**Verification Command:**
```bash
# From Gary's authenticated session, try to update Dale's record via API
# This should fail with RLS violation
```

- [ ] RLS policy blocks cross-user edits

---

## Suite 3: Constraint Enforcement

**Related Issues:** WG-001, WG-002
**Verifies:** Required FK constraints and closed stage requires reason

### Test 3.1: Opportunity Requires Principal

**Steps:**
1. Login as Admin
2. Create new opportunity
3. Attempt to save WITHOUT selecting a Principal organization
4. Check form validation

**Expected Results:**
- [ ] Form shows validation error for Principal field
- [ ] Cannot save without Principal selected
- [ ] Error message is user-friendly

### Test 3.2: Closed Won Requires Win Reason

**Steps:**
1. Navigate to an open opportunity
2. Change stage to "Closed Won"
3. Attempt to save WITHOUT selecting win reason
4. Check validation

**Expected Results:**
- [ ] Form displays validation message for win reason
- [ ] Save button blocked or shows error
- [ ] After selecting reason, save succeeds

**Verification Command:**
```sql
-- Should return 0 (no closed_won without reason)
SELECT COUNT(*)
FROM opportunities
WHERE stage = 'closed_won'
  AND win_reason IS NULL
  AND deleted_at IS NULL;
```

- [ ] Query returns 0 violations

### Test 3.3: Closed Lost Requires Loss Reason

**Steps:**
1. Navigate to an open opportunity
2. Change stage to "Closed Lost"
3. Attempt to save WITHOUT selecting loss reason
4. Check validation

**Expected Results:**
- [ ] Form displays validation message for loss reason
- [ ] Save blocked until reason provided
- [ ] After selecting reason, save succeeds

**Verification Command:**
```sql
-- Should return 0 (no closed_lost without reason)
SELECT COUNT(*)
FROM opportunities
WHERE stage = 'closed_lost'
  AND loss_reason IS NULL
  AND deleted_at IS NULL;
```

- [ ] Query returns 0 violations

### Test 3.4: Contact Requires Organization

**Steps:**
1. Create new contact
2. Attempt to save WITHOUT selecting organization
3. Check form validation

**Expected Results:**
- [ ] Organization field marked required
- [ ] Validation error displayed if empty
- [ ] Cannot save without organization

---

## Suite 4: Error Handling

**Related Issues:** EH-001
**Verifies:** Error visibility in console, network error handling

### Test 4.1: Console Error Visibility

**Steps:**
1. Open browser DevTools Console
2. Filter to "Error" level
3. Perform normal operations (navigate, load data)
4. Check for silent errors

**Expected Results:**
- [ ] No unexpected errors during normal operation
- [ ] Any errors are user-visible (toast/notification)
- [ ] No silent catches swallowing important errors

### Test 4.2: Network Error Handling

**Steps:**
1. Open Network tab in DevTools
2. Enable "Offline" mode
3. Attempt to save a form
4. Observe UI behavior

**Expected Results:**
- [ ] User-visible error message appears
- [ ] Form state preserved (data not lost)
- [ ] No silent failure

**Steps (retry behavior):**
1. Restore network connection
2. Retry the save operation
3. Verify success

**Expected Results:**
- [ ] Save succeeds after connection restored
- [ ] Success notification shown
- [ ] No duplicate records created

### Test 4.3: API Error Display

**Steps:**
1. Trigger a validation error (e.g., enter invalid email format)
2. Submit form
3. Check error display

**Expected Results:**
- [ ] Error message displayed near problematic field
- [ ] Message is human-readable (not raw Zod error)
- [ ] Error clears on valid input

### Test 4.4: Fire-and-Forget Operation Logging

**Steps:**
1. Delete an organization with associated files (avatar/logo)
2. Check Network tab for storage cleanup requests
3. Check Console for any errors

**Expected Results:**
- [ ] Storage cleanup operations visible in Network
- [ ] Any cleanup failures logged to console (not silent)
- [ ] Primary operation (soft delete) succeeds even if cleanup fails

---

## Suite 5: Type Safety

**Related Issues:** TS-001, TS-002, TS-003
**Verifies:** Form validation error display, handling of malformed data

### Test 5.1: Form Validation Error Display

**Steps:**
1. Navigate to Contact Create form
2. Enter invalid data:
   - Email: "not-an-email"
   - Phone: "abc123"
3. Submit form

**Expected Results:**
- [ ] Email field shows validation error
- [ ] Phone field shows format error (if validated)
- [ ] Errors are specific and helpful
- [ ] Form does not submit

### Test 5.2: Zod Schema Boundary Validation

**Steps:**
1. Open DevTools Network tab
2. Create a valid contact
3. Examine the request payload
4. Verify all required fields present

**Expected Results:**
- [ ] Request payload contains only valid schema fields
- [ ] No extra/unknown fields sent to API
- [ ] Response status 200/201 (not 400)

### Test 5.3: Handling Empty Required Fields

**Steps:**
1. Navigate to Opportunity Create
2. Fill only optional fields
3. Attempt to submit
4. Check validation

**Expected Results:**
- [ ] Required field indicators visible
- [ ] Validation errors for all required fields
- [ ] Error messages reference field names

### Test 5.4: API Response Type Safety

**Steps:**
1. Open Network tab
2. Load a list view (e.g., Contacts)
3. Examine response data structure
4. Verify matches expected schema

**Expected Results:**
- [ ] Response has expected fields
- [ ] Dates are ISO strings
- [ ] IDs are strings/UUIDs
- [ ] No unexpected null values in required fields

---

## Suite 6: State Management

**Related Issues:** SS-001 to SS-005
**Verifies:** Window focus refetch, optimistic update rollback, notification polling

### Test 6.1: Window Focus Refetch

**Steps:**
1. Open app in two browser windows
2. In Window A, edit a contact name
3. Save the change
4. Switch to Window B
5. Focus the window (click into it)

**Expected Results:**
- [ ] Window B automatically refreshes data
- [ ] Updated contact name visible after refetch
- [ ] No manual refresh required

**Verification:**
Check Network tab in Window B for automatic request on focus.

### Test 6.2: Task Count Staleness

**Steps:**
1. Open app showing task count badge
2. Open a second tab
3. In second tab, create a new task
4. Return to first tab

**Expected Results:**
- [ ] Task count updates within reasonable time (polling or refetch)
- [ ] If using `refetchOnWindowFocus`, updates on tab focus
- [ ] Count reflects actual task count

### Test 6.3: Optimistic Update Success

**Steps:**
1. Navigate to Favorites
2. Click to add a record to favorites
3. Observe immediate UI update

**Expected Results:**
- [ ] Star/favorite icon updates immediately (optimistic)
- [ ] Network request fires in background
- [ ] Final state matches optimistic state

### Test 6.4: Optimistic Update Rollback

**Steps:**
1. Open DevTools Network tab
2. Enable offline mode
3. Click to add a record to favorites
4. Observe UI behavior

**Expected Results:**
- [ ] Optimistic update shows immediately
- [ ] After network failure detected, update rolls back
- [ ] Error notification displayed
- [ ] State returns to previous value

### Test 6.5: Notification Polling Stability

**Steps:**
1. Open app with notification bell visible
2. Leave app open for 5+ minutes
3. Monitor Network tab for polling requests
4. Check Console for errors

**Expected Results:**
- [ ] Polling requests occur at expected intervals
- [ ] No memory leaks (stable memory usage)
- [ ] No duplicate requests stacking up
- [ ] Errors don't stop polling

### Test 6.6: Cache Invalidation After Mutation

**Steps:**
1. View Contact list
2. Edit a contact
3. Return to Contact list

**Expected Results:**
- [ ] List shows updated data
- [ ] No stale data visible
- [ ] Related lists (if any) also updated

---

## Suite 7: UI/Architecture

**Related Issues:** ARCH-001, Touch Targets
**Verifies:** Touch target sizes on tablet, component independence

### Test 7.1: Touch Target Compliance (44px minimum)

**Steps:**
1. Open DevTools
2. Toggle device toolbar (iPad view: 1024x768)
3. Navigate through app
4. Inspect button/input sizes

**Elements to Check:**
- [ ] Primary action buttons (Save, Create) >= 44px height
- [ ] Navigation menu items >= 44px touch area
- [ ] Form inputs >= 44px height
- [ ] Icon buttons (edit, delete) >= 44px tap area

**Verification:**
```css
/* Inspect element and verify */
height >= 44px OR min-height >= 44px
/* Tailwind: h-11 = 44px */
```

### Test 7.2: Component Independence

**Steps:**
1. Navigate to different feature modules
2. Verify consistent UI patterns
3. Check for cross-feature dependencies

**Expected Results:**
- [ ] Each feature (Contacts, Opportunities, Organizations) works independently
- [ ] No broken imports between feature modules
- [ ] Shared components in `src/components/` used consistently

### Test 7.3: Tier 1/Tier 2 Component Usage

**Steps:**
1. Inspect rendered component tree (React DevTools)
2. Verify shadcn components wrapped with RA adapters
3. Check for raw Tier 1 usage in features

**Expected Results:**
- [ ] Features use Tier 2 wrappers (SaveButton, TextInput)
- [ ] No direct shadcn imports in feature files
- [ ] Consistent styling across features

### Test 7.4: Responsive Layout (Desktop/iPad)

**Steps:**
1. Test at 1440px+ width (desktop)
2. Test at 1024px width (iPad landscape)
3. Test at 768px width (iPad portrait)

**Expected Results:**
- [ ] Layout adapts appropriately at each breakpoint
- [ ] No horizontal scrolling required
- [ ] Navigation remains usable
- [ ] Forms are fully visible and accessible

---

## Suite 8: Security (XSS Prevention)

**Related Issues:** SEC-001
**Verifies:** XSS in text fields, XSS in rich text areas

### Test 8.1: XSS in Text Input Fields

**Steps:**
1. Navigate to Contact Create
2. Enter in First Name: `<script>alert('XSS')</script>`
3. Enter in Last Name: `<img src=x onerror=alert('XSS')>`
4. Save the contact
5. View the contact detail

**Expected Results:**
- [ ] No alert dialogs appear
- [ ] Script tags rendered as text, not executed
- [ ] Image tag rendered safely (no onerror execution)
- [ ] Data displayed escaped: `&lt;script&gt;...`

### Test 8.2: XSS in Notes/Rich Text

**Steps:**
1. Navigate to a Contact detail
2. Add a new note with: `<script>alert('XSS')</script>`
3. Add another with: `<a href="javascript:alert('XSS')">click</a>`
4. Save and view notes

**Expected Results:**
- [ ] Script content displayed as text
- [ ] JavaScript URLs stripped or disabled
- [ ] No code execution on view

### Test 8.3: XSS in URL Fields

**Steps:**
1. Edit an organization
2. Enter in website: `javascript:alert('XSS')`
3. Enter in LinkedIn: `data:text/html,<script>alert('XSS')</script>`
4. Save and view organization detail

**Expected Results:**
- [ ] Links not clickable or sanitized
- [ ] No JavaScript execution
- [ ] URL validation shows error for invalid URLs

### Test 8.4: Stored XSS Verification

**Steps:**
1. Create record with XSS payload
2. Log out
3. Log in as different user
4. View the record

**Expected Results:**
- [ ] XSS payload still escaped
- [ ] No execution in different user's session
- [ ] Content renders safely

**Verification Command:**
```sql
-- Check for any suspicious stored content
SELECT id, first_name, last_name
FROM contacts
WHERE first_name LIKE '%<script%'
   OR last_name LIKE '%<script%'
LIMIT 10;
```

- [ ] If records exist, verify they display escaped in UI

---

## Final Verification Checklist

### Automated Checks (Run Before Manual Testing)

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. ESLint (allow warnings but no errors in production code)
npx eslint src/atomic-crm --max-warnings 100

# 3. Unit tests
npm run test

# 4. Search for remaining hard DELETEs in active code
rg "DELETE FROM" src/ --type ts

# 5. Search for 'as any' in production code
rg "as any" src/atomic-crm/ --type ts | grep -v ".test." | grep -v "__tests__"

# 6. Check for undersized touch targets
rg "h-8|h-9" src/components/ui/ --type tsx
```

### Database Health Checks

```sql
-- 1. Verify no orphaned opportunities
SELECT COUNT(*) FROM opportunities
WHERE principal_organization_id IS NULL
  AND deleted_at IS NULL;
-- Expected: 0

-- 2. Verify no closed opportunities without reason
SELECT COUNT(*) FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
  AND win_reason IS NULL
  AND loss_reason IS NULL
  AND deleted_at IS NULL;
-- Expected: 0

-- 3. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
-- Expected: Empty (all tables have RLS)

-- 4. Verify soft-delete column coverage
SELECT table_name FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = t.table_name
      AND c.column_name = 'deleted_at'
  );
-- Expected: Only system tables (task_id_mapping, test_user_metadata, etc.)
```

---

## Sign-Off Section

### Test Execution Log

| Suite | Tester | Date | Pass/Fail | Notes |
|-------|--------|------|-----------|-------|
| 1. Soft Delete | | | | |
| 2. RLS Policy | | | | |
| 3. Constraints | | | | |
| 4. Error Handling | | | | |
| 5. Type Safety | | | | |
| 6. State Management | | | | |
| 7. UI/Architecture | | | | |
| 8. Security (XSS) | | | | |

### Overall Assessment

- [ ] All suites passed
- [ ] Critical issues documented
- [ ] Ready for deployment

**Tested By:** _________________________

**Date:** _________________________

**Environment:**
- Browser: _________________________
- OS: _________________________
- Node Version: _________________________
- Supabase Version: _________________________

---

## Related Documentation

- [RBAC E2E Checklist](./testing/e2e-rbac-checklist.md) - Role-based access testing
- [Full Audit Report](./audits/2026-01-23-full-audit.md) - Latest codebase audit
- [Data Integrity Audit](./audits/2026-01-23-data-integrity.md) - Soft delete verification
- [Workflow Gaps Audit](./audits/2026-01-23-workflow-gaps.md) - Business rule validation

---

*Generated by Agent VERIFY-1 on 2026-01-23*
*Report location: docs/manual-e2e-tests.md*
