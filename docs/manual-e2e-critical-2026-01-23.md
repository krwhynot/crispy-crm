# Manual E2E Test Plan — Critical Fixes (2026-01-23 21:29)

**Scope:** 36 CRITICAL issues from full codebase audit
**Prerequisites:**
- Fresh `supabase db reset` completed
- App running locally (`npm run dev`)
- Logged in as test user (AM role)
- Browser DevTools open (Console + Network)

---

## Test Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@test.com | `password123` | admin |
| Manager | manager@mfbroker.com | `password123` | manager |
| Rep | rep@mfbroker.com | `password123` | rep |

---

## Test Suite 0: Build Verification

### Test 0.1: Application Loads
**Steps:**
1. Run `npm run build`
2. Run `npm run dev`
3. Navigate to http://localhost:5173

**Expected Result:**
- [ ] Build completes without errors
- [ ] Application loads without white screen
- [ ] No console errors on initial load

---

## Test Suite 1: RLS Security

### Test 1.1: product_distributors Isolation
**Steps:**
1. Log in as User A (company X)
2. In browser console:
```js
const { data } = await supabase
  .from('product_distributors')
  .select('*')
  .eq('id', '[ID_FROM_COMPANY_Y]');
console.log(data);
```

**Expected Result:**
- [ ] `data` is empty array `[]`
- [ ] Cross-company data inaccessible

### Test 1.2: opportunity_contacts Bidirectional Auth
**Steps:**
1. Attempt to link contact from User A to opportunity from User B

**Expected Result:**
- [ ] Insert fails with RLS violation

### Test 1.3: Soft-Deleted Records Hidden by RLS
**Steps:**
1. In Supabase Studio, set `deleted_at = NOW()` on a contact
2. Refresh Contacts list in app
3. In console: `await supabase.from('contacts').select('*').eq('id', '[DELETED_ID]')`

**Expected Result:**
- [ ] Deleted contact NOT visible in UI
- [ ] Query returns empty array (RLS enforces soft-delete)

---

## Test Suite 2: Data Integrity

### Test 2.1: Soft-Deleted Records Hidden in Lists
**Steps:**
1. Soft-delete a contact via Supabase Studio (`UPDATE contacts SET deleted_at = NOW() WHERE id = [ID]`)
2. Refresh Contacts list in app

**Expected Result:**
- [ ] Deleted contact NOT visible in UI list
- [ ] Total count correct (excludes deleted)

### Test 2.2: principal_organization_id Required
**Steps:**
1. Open Create Opportunity form
2. Leave Principal field empty
3. Fill other required fields
4. Submit

**Expected Result:**
- [ ] Form validation error on Principal field
- [ ] Cannot submit without Principal

### Test 2.3: Cascade Soft Delete
**Steps:**
1. Archive an organization with linked contacts
2. Check if contacts remain (soft-delete should NOT cascade by default)

**Expected Result:**
- [ ] Organization archived (deleted_at set)
- [ ] Linked contacts still visible (NOT deleted)

---

## Test Suite 3: Observability & Logging

### Test 3.1: Logger Output Format
**Steps:**
1. Create a scenario that triggers a warning (e.g., try to access non-existent record)
2. Check browser console

**Expected Result:**
- [ ] Errors show `[ERROR]` prefix with ISO timestamp
- [ ] Context object attached (if applicable)
- [ ] No raw `console.error` calls (should go through logger)

### Test 3.2: Avatar Utils Error Logging
**Steps:**
1. Create a contact with an invalid avatar URL
2. View the contact
3. Check console for errors

**Expected Result:**
- [ ] Error logged with context (not silent catch)
- [ ] Fallback avatar displayed gracefully

---

## Test Suite 4: Cache Invalidation

### Test 4.1: Tag Edit Refreshes List
**Steps:**
1. Navigate to Settings > Tags
2. Edit a tag name (e.g., "VIP" → "VIP Customer")
3. Save changes

**Expected Result:**
- [ ] New name appears immediately in tag list
- [ ] No manual page refresh needed
- [ ] Contacts using this tag reflect new name

### Test 4.2: Task Completion Updates Dashboard
**Steps:**
1. Note current task count on dashboard
2. Complete a task
3. Check dashboard counter

**Expected Result:**
- [ ] Counter decreased by 1 immediately
- [ ] No page refresh required

### Test 4.3: Contact Edit Reflects in List
**Steps:**
1. Open a contact via slide-over
2. Edit the name
3. Save and close slide-over

**Expected Result:**
- [ ] Updated name shows immediately in list
- [ ] No stale data visible

---

## Test Suite 5: Test Infrastructure

### Test 5.1: Faker is Dev-Only
**Steps:**
```bash
cat package.json | grep faker
```

**Expected Result:**
- [ ] faker in "devDependencies"
- [ ] faker NOT in "dependencies"

### Test 5.2: Pilot File Type-Safe
**Steps:**
```bash
rg "as any" src/atomic-crm/contacts/__tests__/ContactList.test.tsx
```

**Expected Result:**
- [ ] No output (zero `as any`)

### Test 5.3: Unit Tests Pass
**Steps:**
```bash
npm test -- ContactList.test.tsx --run
```

**Expected Result:**
- [ ] All tests pass
- [ ] No console errors in test output

---

## Test Suite 6: Form Validation

### Test 6.1: Email Format Validation
**Steps:**
1. Open Contact Create form
2. Enter invalid email: "not-an-email"
3. Submit form

**Expected Result:**
- [ ] Validation error on email field
- [ ] Form does not submit
- [ ] Error message is user-friendly

### Test 6.2: Phone Format Validation
**Steps:**
1. Open Contact Create form
2. Enter invalid phone (letters): "abc-def-ghij"
3. Submit form

**Expected Result:**
- [ ] Validation error on phone field
- [ ] Form does not submit

### Test 6.3: Required Field Validation
**Steps:**
1. Open Opportunity Create form
2. Leave all fields empty
3. Click Submit

**Expected Result:**
- [ ] Required field errors shown
- [ ] aria-invalid="true" on error fields
- [ ] Focus moves to first error field

---

## Test Suite 7: Accessibility (A11y)

### Test 7.1: Form Error ARIA
**Steps:**
1. Trigger a form validation error
2. Inspect error field with DevTools

**Expected Result:**
- [ ] `aria-invalid="true"` on input
- [ ] `aria-describedby` links to error message
- [ ] Error has `role="alert"`

### Test 7.2: Touch Targets
**Steps:**
1. Open Contacts list on tablet viewport (768px width)
2. Inspect button/link sizes

**Expected Result:**
- [ ] All interactive elements ≥ 44px touch target
- [ ] Buttons have `h-11` class (44px)

---

## Final Verification Commands

```bash
# Build
npm run build

# Tests
npm test

# Migrations
supabase db reset

# Security check - no permissive RLS
rg "USING \(true\)" supabase/migrations/ | grep -vE "service_role|TO service_role"

# Observability check - no raw console.error in production code
rg "console\.error" src/atomic-crm/ --type ts | grep -v test | grep -v logger | wc -l
# Expected: 0

# Cache check - invalidations exist
rg "invalidateQueries|refetch" src/features/ --type ts | wc -l
# Expected: > 0

# Test infrastructure check
cat package.json | jq '.devDependencies["@faker-js/faker"]'
# Expected: version string

rg "as any" src/atomic-crm/contacts/__tests__/ContactList.test.tsx
# Expected: no output
```

---

## Sign-Off

| Suite | Status | Notes |
|-------|--------|-------|
| 0. Build | ☐ Pass / ☐ Fail | |
| 1. RLS Security | ☐ Pass / ☐ Fail | |
| 2. Data Integrity | ☐ Pass / ☐ Fail | |
| 3. Observability | ☐ Pass / ☐ Fail | |
| 4. Cache Invalidation | ☐ Pass / ☐ Fail | |
| 5. Test Infrastructure | ☐ Pass / ☐ Fail | |
| 6. Form Validation | ☐ Pass / ☐ Fail | |
| 7. Accessibility | ☐ Pass / ☐ Fail | |

**Tested by:** _______________
**Date:** _______________
**Environment:** ☐ Local / ☐ Staging / ☐ Production
**Browser:** _______________
**Notes:**

---

## Issue Tracking

If tests fail, record issues here:

| Test ID | Issue Description | Severity | Ticket |
|---------|-------------------|----------|--------|
| | | | |
| | | | |
| | | | |
