# E2E Test: Remediation Verification Protocol

**Date:** 2026-01-18
**Tester:** _______________
**Environment:** Local / Staging / Production
**Build Version:** _______________

---

## Overview

This E2E test verifies three critical fixes from the January 2026 remediation cycle:

| Test | Fix | Migration/File |
|------|-----|----------------|
| A | Zombie Segment Fix (soft-delete name reuse) | `20260118000001_fix_segments_indexes.sql` |
| B | Product Re-Link Fix | `OpportunityProductsTab.tsx` |
| C | Activity Partial Update Fix | `ActivityDetailsTab.tsx` |

---

## Prerequisites

- [ ] Logged in as user with Admin or Manager role
- [ ] Database migration `20260118000001_fix_segments_indexes.sql` applied
- [ ] At least 1 existing Opportunity with products
- [ ] At least 1 existing Activity record

---

## Test A: Zombie Segment Soft-Delete Verification

**Objective:** Verify that soft-deleted segment names can be reused for new segments.

> **Note:** Segments are fixed Playbook categories in Crispy CRM (not user-creatable via UI). This test requires SQL execution.

### Setup (SQL Console)

```sql
-- 1. Check current active segments
SELECT id, name, segment_type, deleted_at
FROM segments
WHERE deleted_at IS NULL
ORDER BY name;
```

- [ ] Query executes successfully
- [ ] Note segment count: ___

### Test Steps

#### Step A.1: Create a test segment

```sql
-- Create test segment
INSERT INTO segments (name, segment_type, color, created_at, updated_at)
VALUES ('E2E-Test-Segment-2026', 'industry', '#FF5733', NOW(), NOW())
RETURNING id, name;
```

- [ ] Insert succeeds
- [ ] Record ID: ___

#### Step A.2: Soft-delete the segment

```sql
-- Soft delete the segment
UPDATE segments
SET deleted_at = NOW(), updated_at = NOW()
WHERE name = 'E2E-Test-Segment-2026';
```

- [ ] Update affects 1 row
- [ ] Segment is soft-deleted (deleted_at is NOT NULL)

#### Step A.3: Verify reuse (THE FIX)

```sql
-- Attempt to create a new segment with the SAME name
INSERT INTO segments (name, segment_type, color, created_at, updated_at)
VALUES ('E2E-Test-Segment-2026', 'industry', '#33FF57', NOW(), NOW())
RETURNING id, name;
```

**Expected Result (After Fix):**
- [ ] ✅ Insert succeeds (NEW id returned)
- [ ] Two segments exist with same name (one active, one soft-deleted)

**Failure Indicator (Before Fix):**
- ❌ Error: `duplicate key value violates unique constraint`

#### Step A.4: Verify index behavior

```sql
-- Verify both records exist
SELECT id, name, segment_type, deleted_at,
       CASE WHEN deleted_at IS NULL THEN 'ACTIVE' ELSE 'DELETED' END as status
FROM segments
WHERE LOWER(name) = 'e2e-test-segment-2026'
ORDER BY created_at;
```

- [ ] Returns 2 rows
- [ ] 1 row has status = 'ACTIVE'
- [ ] 1 row has status = 'DELETED'

### Cleanup

```sql
-- Permanent cleanup for test data
DELETE FROM segments WHERE name = 'E2E-Test-Segment-2026';
```

- [ ] Cleanup complete

### Test A Result

| Status | Notes |
|--------|-------|
| ☐ PASS | Soft-deleted names can be reused |
| ☐ FAIL | Unique constraint error occurred |
| ☐ BLOCKED | Migration not applied |

---

## Test B: Opportunity Products Re-Link Verification

**Objective:** Verify products can be removed and re-added to an opportunity without errors.

### Setup

1. Navigate to: **`/opportunities`**
2. Select an opportunity that has at least one product linked

- [ ] Opportunities list loads
- [ ] Test Opportunity selected: _______________

### Test Steps

#### Step B.1: Open Opportunity Slide-Over

1. Click on the opportunity row in the list
2. Wait for slide-over panel to open

- [ ] Slide-over opens
- [ ] Header shows opportunity name

#### Step B.2: Navigate to Products Tab

1. Locate the tab bar in the slide-over
2. Click the **"Products"** tab (3rd tab, has 📦 Package icon)

- [ ] Products tab is visible
- [ ] Products tab becomes active when clicked
- [ ] Current products list displays

**Screenshot checkpoint:** Take screenshot of current products state

#### Step B.3: Remove a Product

1. In the Products section, locate the product autocomplete field
2. Click the **"X"** button next to an existing product to remove it
3. Click **"Save Changes"** button

- [ ] Product removed from the selection
- [ ] Save button clicked
- [ ] Success notification appears: "Products updated"

**Product removed:** _______________

#### Step B.4: Re-Add the Same Product (THE FIX)

1. In the Products autocomplete field, start typing the name of the removed product
2. Select the product from the dropdown
3. Click **"Save Changes"** button

**Expected Result (After Fix):**
- [ ] ✅ Product appears in autocomplete dropdown
- [ ] ✅ Product can be selected
- [ ] ✅ Save succeeds
- [ ] ✅ Success notification: "Products updated"

**Failure Indicator (Before Fix):**
- ❌ Product not available in dropdown
- ❌ Error on save: "Product already exists" or foreign key error
- ❌ Console error about duplicate records

#### Step B.5: Verify Persistence

1. Close the slide-over (click X or click outside)
2. Re-open the same opportunity
3. Navigate to Products tab

- [ ] Re-added product is still present
- [ ] No duplicate entries

### Test B Result

| Status | Notes |
|--------|-------|
| ☐ PASS | Products can be removed and re-added |
| ☐ FAIL | Re-add failed with error |
| ☐ BLOCKED | No opportunity with products available |

---

## Test C: Activity Partial Update Verification

**Objective:** Verify editing a single field on an activity doesn't clear other fields.

### Setup

1. Navigate to: **`/activities`**
2. Identify an activity with multiple fields populated (especially Sentiment)

- [ ] Activities list loads
- [ ] Test Activity selected: _______________

### Test Steps

#### Step C.1: Open Activity Slide-Over

1. Click on an activity row in the list
2. Wait for slide-over panel to open

- [ ] Slide-over opens in **View mode**
- [ ] Activity details display

#### Step C.2: Document Current State

Record the current values before editing:

| Field | Current Value |
|-------|---------------|
| Subject | |
| Activity Type | |
| Interaction Type | |
| Sentiment | |
| Description | |
| Outcome | |
| Location | |

- [ ] All visible fields documented

**Screenshot checkpoint:** Take screenshot of view mode

#### Step C.3: Enter Edit Mode

1. Click the **"Edit"** button (pencil icon) in the slide-over header

- [ ] Form switches to edit mode
- [ ] All fields become editable
- [ ] Current values are pre-populated

#### Step C.4: Change Only Sentiment Field (THE FIX)

1. Locate the **"Sentiment"** dropdown field
2. Change the value:
   - If currently "Positive" → change to "Neutral"
   - If currently "Neutral" → change to "Negative"
   - If currently "Negative" → change to "Positive"
3. **DO NOT** modify any other fields
4. Click **"Save Changes"** button in the slide-over footer

- [ ] Only Sentiment field was modified
- [ ] Save button clicked

**New Sentiment value:** _______________

**Expected Result (After Fix):**
- [ ] ✅ Success notification: "Activity updated successfully"
- [ ] ✅ Slide-over returns to view mode
- [ ] ✅ Sentiment shows new value
- [ ] ✅ ALL other fields retain their original values

**Failure Indicator (Before Fix):**
- ❌ Error notification on save
- ❌ Other fields cleared/reset to null
- ❌ Console error about validation or missing fields

#### Step C.5: Verify Field Preservation

Compare current values to documented values from Step C.2:

| Field | Expected | Actual | Match? |
|-------|----------|--------|--------|
| Subject | (from C.2) | | ☐ |
| Activity Type | (from C.2) | | ☐ |
| Interaction Type | (from C.2) | | ☐ |
| Sentiment | (new value) | | ☐ |
| Description | (from C.2) | | ☐ |
| Outcome | (from C.2) | | ☐ |
| Location | (from C.2) | | ☐ |

- [ ] All fields except Sentiment match original values
- [ ] Sentiment shows new value

#### Step C.6: Verify Database Persistence

1. Refresh the page (F5)
2. Navigate back to the same activity
3. Open the slide-over

- [ ] Changes persisted after refresh
- [ ] No data loss

### Test C Result

| Status | Notes |
|--------|-------|
| ☐ PASS | Single-field edit preserves other fields |
| ☐ FAIL | Other fields were cleared/modified |
| ☐ BLOCKED | No suitable activity available |

---

## Summary

### Test Results

| Test | Description | Status | Tester Initials |
|------|-------------|--------|-----------------|
| A | Zombie Segment Soft-Delete | ☐ PASS ☐ FAIL ☐ BLOCKED | |
| B | Product Re-Link | ☐ PASS ☐ FAIL ☐ BLOCKED | |
| C | Activity Partial Update | ☐ PASS ☐ FAIL ☐ BLOCKED | |

### Overall Assessment

- [ ] **ALL TESTS PASS** - Remediation verified, ready for deployment
- [ ] **PARTIAL PASS** - Some tests failed, see notes below
- [ ] **BLOCKED** - Could not complete testing

### Notes & Observations

```
(Add any additional notes, edge cases discovered, or issues here)




```

### Screenshots Collected

- [ ] Test A: N/A (SQL-based)
- [ ] Test B: Products tab before/after
- [ ] Test C: Activity view mode before edit

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Tester | | | |
| Developer | | | |
| Product Owner | | | |

---

## Appendix: UI Element Reference

| Element | Location | Selector/Label |
|---------|----------|----------------|
| Opportunities List | `/opportunities` | Left nav "Opportunities" |
| Activities List | `/activities` | Left nav "Activities" |
| Slide-Over Edit Button | Header right | Pencil icon |
| Slide-Over Save Button | Footer | "Save Changes" |
| Products Tab | Opportunity slide-over | 3rd tab, Package icon |
| Sentiment Dropdown | Activity edit form | "Sentiment" label |
| Success Toast | Top-right | Green notification |
| Error Toast | Top-right | Red notification |
