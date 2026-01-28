# Organization Duplicate Detection - UI Test Guide

**Test Date:** `[Fill in when testing]`
**Tester:** `[Fill in name]`
**Environment:** Localhost only (http://localhost:5173)
**Database:** Local Supabase instance

---

## Prerequisites

### 1. Start Local Environment

```bash
# Terminal 1: Start Supabase (if not running)
just db-start

# Terminal 2: Start dev server on port 5173
just dev
```

**Verify:**
- [ ] Dev server running at http://localhost:5173
- [ ] Local Supabase running (check `just db-status`)
- [ ] No console errors in browser DevTools

### 2. Verify Database State

```bash
# Check for existing duplicates (should return 0)
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT LOWER(name), COUNT(*)
FROM organizations
WHERE deleted_at IS NULL
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;
"

# Check unique constraint exists
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'organizations'
  AND indexname = 'organizations_name_unique_idx';
"
```

**Expected:**
- Zero duplicates in database
- Unique constraint exists: `CREATE UNIQUE INDEX organizations_name_unique_idx ON public.organizations USING btree (lower(name)) WHERE (deleted_at IS NULL)`

---

## Test Suite

### Test 1: Create New Organization (Happy Path)

**Objective:** Verify normal organization creation works without duplicate warnings.

**Steps:**
1. Navigate to http://localhost:5173
2. Click **Organizations** in sidebar
3. Click **Create** button (top right)
4. Fill in form:
   - **Name:** `Test Org ${timestamp}` (e.g., "Test Org 2026-01-27 22:30")
   - **Type:** Select "Customer"
   - **Account Manager:** Select any sales rep
   - **Segment:** Select any segment
5. Click **Save**

**Expected Result:**
- ✅ Form submits successfully
- ✅ No duplicate warning dialog appears
- ✅ Redirected to organization list or show page
- ✅ New organization appears in list
- ✅ Success notification shown

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 2: Attempt Exact Duplicate (Case-Sensitive Match)

**Objective:** Verify duplicate detection triggers for exact name match.

**Steps:**
1. Navigate to Organizations → Create
2. Fill in form:
   - **Name:** `Sysco Corporation` (exact match to existing org)
   - **Type:** Select "Distributor"
   - **Account Manager:** Select any sales rep
   - **Segment:** Select any segment
3. Click **Save**
4. Observe modal dialog appearance

**Expected Result:**
- ✅ Modal dialog appears: "Potential Duplicate Organization"
- ✅ Dialog shows existing organization details:
  - Name: "Sysco Corporation"
  - Type shown
  - Contact count shown
- ✅ Three buttons visible:
  - "View Existing Organization"
  - "Change Name"
  - "Create Anyway"
- ✅ Form does NOT submit yet

**Screenshot Location:** `screenshots/test2-exact-duplicate-dialog.png`

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 3: Attempt Case-Insensitive Duplicate

**Objective:** Verify duplicate detection is case-insensitive.

**Steps:**
1. Navigate to Organizations → Create
2. Fill in form:
   - **Name:** `sysco CORPORATION` (different case, same name)
   - **Type:** Select "Distributor"
   - **Account Manager:** Select any sales rep
   - **Segment:** Select any segment
3. Click **Save**

**Expected Result:**
- ✅ Modal dialog appears (same as Test 2)
- ✅ Shows "Sysco Corporation" as matching organization
- ✅ Three action buttons available

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 4: Partial Match (No False Positive)

**Objective:** Verify partial matches do NOT trigger duplicate warning.

**Steps:**
1. Navigate to Organizations → Create
2. Fill in form:
   - **Name:** `Sysco Corporation West Coast Division`
   - **Type:** Select "Distributor"
   - **Account Manager:** Select any sales rep
   - **Segment:** Select any segment
3. Click **Save**

**Expected Result:**
- ✅ NO duplicate dialog appears
- ✅ Form submits successfully
- ✅ New organization created with full name

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 5: Duplicate Dialog - "View Existing Organization" Button

**Objective:** Verify "View Existing Organization" action works correctly.

**Steps:**
1. Navigate to Organizations → Create
2. Enter duplicate name: `US Foods`
3. Fill required fields and click **Save**
4. Wait for duplicate dialog to appear
5. Click **"View Existing Organization"** button

**Expected Result:**
- ✅ Dialog closes
- ✅ Navigated to existing organization's Show page
- ✅ URL changes to `/organizations/{id}/show`
- ✅ Correct organization details displayed
- ✅ Unsaved form data is lost (expected behavior)

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 6: Duplicate Dialog - "Change Name" Button

**Objective:** Verify "Change Name" action returns user to form.

**Steps:**
1. Navigate to Organizations → Create
2. Enter duplicate name: `Restaurant Depot`
3. Fill required fields and click **Save**
4. Wait for duplicate dialog to appear
5. Click **"Change Name"** button

**Expected Result:**
- ✅ Dialog closes
- ✅ Form remains visible (not submitted)
- ✅ All previously entered data preserved (Type, Account Manager, Segment still filled)
- ✅ User can edit Name field
- ✅ No navigation occurred (still on `/organizations/create`)

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 7: Duplicate Dialog - "Create Anyway" Button (Database Constraint Test)

**Objective:** Verify database constraint blocks true duplicates even when user overrides.

**Steps:**
1. Navigate to Organizations → Create
2. Enter duplicate name: `Sysco Corporation` (exact match)
3. Fill required fields and click **Save**
4. Wait for duplicate dialog to appear
5. Click **"Create Anyway"** button
6. Observe error message

**Expected Result:**
- ✅ Dialog closes
- ✅ Form submits to backend
- ✅ Database constraint blocks insert
- ✅ Error notification appears with message about unique constraint violation
- ✅ Form remains open (not navigated away)
- ✅ User can correct the name

**Database Error Expected:**
```
duplicate key value violates unique constraint "organizations_name_unique_idx"
Detail: Key (lower(name))=(sysco corporation) already exists.
```

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 8: Edit Existing Organization - No Duplicate Warning on Self

**Objective:** Verify editing an organization's own name doesn't trigger duplicate warning.

**Steps:**
1. Navigate to Organizations list
2. Click on any organization (e.g., "Sysco Corporation")
3. Click **Edit** button
4. Change some other field (e.g., Priority)
5. **Do NOT change Name field** (leave as "Sysco Corporation")
6. Click **Save**

**Expected Result:**
- ✅ NO duplicate warning dialog appears
- ✅ Form saves successfully
- ✅ Changes applied

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 9: Edit Organization - Duplicate Name Different Org

**Objective:** Verify editing to match another organization's name triggers duplicate detection.

**Steps:**
1. Navigate to Organizations list
2. Click on any organization (NOT "Sysco Corporation")
3. Click **Edit** button
4. Change **Name** field to `Sysco Corporation`
5. Click **Save**

**Expected Result:**
- ✅ Duplicate warning dialog appears
- ✅ Shows "Sysco Corporation" as existing organization
- ✅ Three action buttons available
- ✅ "Create Anyway" button should fail with database constraint error

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 10: Whitespace Handling

**Objective:** Verify leading/trailing whitespace is handled correctly.

**Steps:**
1. Navigate to Organizations → Create
2. Enter name with whitespace: `  Sysco Corporation  ` (spaces before/after)
3. Fill required fields and click **Save**

**Expected Result:**
- ✅ Duplicate warning dialog appears
- ✅ Recognizes as duplicate of "Sysco Corporation"
- ✅ Whitespace trimmed during comparison

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 11: Special Characters in Name

**Objective:** Verify special characters don't break duplicate detection.

**Steps:**
1. Navigate to Organizations → Create
2. Enter name: `O'Reilly's Café & Restaurant`
3. Fill required fields and click **Save**
4. If successful, try creating duplicate: `o'reilly's café & restaurant` (lowercase)

**Expected Result:**
- ✅ First submission succeeds (no existing match)
- ✅ Second submission triggers duplicate dialog
- ✅ Special characters handled correctly (apostrophes, ampersands, accents)

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 12: Parent Organization Dropdown (Original Issue)

**Objective:** Verify parent organization dropdown no longer shows duplicates.

**Steps:**
1. Navigate to Organizations → Create
2. Scroll to "Parent Organization" field
3. Click the dropdown
4. Observe list of organizations

**Expected Result:**
- ✅ "La Caretta" appears only ONCE in dropdown
- ✅ "test1-27 ORg" does NOT appear (was soft-deleted in migration)
- ✅ All organizations in dropdown have unique names
- ✅ No duplicate entries visible

**Screenshot Location:** `screenshots/test12-parent-dropdown.png`

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 13: Verify Database Constraint Directly

**Objective:** Verify database constraint works independent of UI.

**Steps:**
1. Open terminal
2. Run SQL directly:

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" << 'SQL'
-- This should FAIL with unique constraint error
INSERT INTO organizations (name, organization_type, segment_id, sales_id, company_id)
VALUES ('Sysco Corporation', 'distributor',
        (SELECT id FROM segments LIMIT 1),
        (SELECT id FROM sales LIMIT 1),
        1);
SQL
```

**Expected Result:**
```
ERROR:  duplicate key value violates unique constraint "organizations_name_unique_idx"
DETAIL:  Key (lower(name))=(sysco corporation) already exists.
```

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 14: Performance - Large List

**Objective:** Verify duplicate detection performs well with many organizations.

**Steps:**
1. Navigate to Organizations → Create
2. Enter a name that exists
3. Click **Save**
4. Measure time from submit to dialog appearance

**Expected Result:**
- ✅ Duplicate dialog appears within 500ms
- ✅ No UI freezing or lag
- ✅ Network tab shows single, fast query (< 100ms)

**Performance Metrics:**
- Time to dialog: `_____ ms`
- Query time (Network tab): `_____ ms`

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

## Edge Cases

### Test 15: Empty Name Field

**Steps:**
1. Try to create organization with empty name
2. Click **Save**

**Expected Result:**
- ✅ Browser validation prevents submit (required field)
- ✅ No duplicate check runs (fails early)

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

### Test 16: Name with Only Whitespace

**Steps:**
1. Enter name: `     ` (only spaces)
2. Click **Save**

**Expected Result:**
- ✅ Validation error shown (name cannot be blank)
- ✅ Form does not submit

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

## Regression Tests

### Test 17: Verify No Impact on Other Forms

**Objective:** Ensure changes didn't break unrelated functionality.

**Steps:**
1. Create a Contact (Organizations → Select Org → Contacts → Create)
2. Create an Opportunity (Opportunities → Create)
3. Create a Task (Tasks → Create)

**Expected Result:**
- ✅ All forms work normally
- ✅ No unexpected duplicate warnings
- ✅ No console errors

**Status:** [ ] Pass [ ] Fail
**Notes:**

---

## Summary

**Date Completed:** `________________`
**Total Tests:** 17
**Passed:** `____`
**Failed:** `____`
**Blocked:** `____`

### Critical Issues Found
`[List any P0/P1 issues here]`

### Non-Critical Issues Found
`[List any P2/P3 issues here]`

### Notes
`[Additional observations]`

---

## Cleanup (After Testing)

```bash
# Optional: Remove test organizations created during testing
psql "postgresql://postgres:postgres@localhost:54322/postgres" << 'SQL'
UPDATE organizations
SET deleted_at = NOW()
WHERE name LIKE 'Test Org %'
  OR name LIKE '%Division'
  OR name LIKE '%Café%';
SQL
```

---

## Screenshots Checklist

Capture these screenshots during testing:

- [ ] `screenshots/test2-exact-duplicate-dialog.png` - Duplicate warning modal
- [ ] `screenshots/test5-view-existing-navigation.png` - Show page after "View Existing"
- [ ] `screenshots/test6-change-name-form.png` - Form after "Change Name"
- [ ] `screenshots/test7-create-anyway-error.png` - Database constraint error
- [ ] `screenshots/test12-parent-dropdown.png` - Parent org dropdown (no duplicates)

---

## Reference: System Architecture

**Duplicate Detection Layers:**

1. **UI Layer (Soft Warning)**
   - File: `src/atomic-crm/organizations/useDuplicateOrgCheck.ts`
   - Triggers on form submission
   - Allows user override via "Create Anyway"

2. **Database Layer (Hard Constraint)**
   - Migration: `20260127210744_restore_organization_name_unique_constraint.sql`
   - Constraint: `organizations_name_unique_idx`
   - Cannot be bypassed by UI

**Data Flow:**
```
User submits form
  ↓
useDuplicateOrgCheck runs
  ↓
If duplicate found → Show dialog
  ↓
User chooses action:
  - View Existing → Navigate away
  - Change Name → Return to form
  - Create Anyway → Submit to backend
    ↓
    Backend validates
      ↓
      Database constraint checks
        ↓
        ✓ Unique → Insert succeeds
        ✗ Duplicate → Error returned to UI
```
