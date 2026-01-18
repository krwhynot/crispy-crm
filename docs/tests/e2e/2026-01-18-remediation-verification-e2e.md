# E2E Test: Remediation Verification Protocol (UI-Only)

**Date:** 2026-01-18
**Tester:** _______________
**Environment:** Local / Staging / Production
**Build Version:** _______________

---

## Overview

This E2E test verifies three critical fixes through the CRM UI only (no direct database access required).

| Test | Fix | UI Workflow |
|------|-----|-------------|
| A | Soft-Delete Archive/Restore Cycle | Opportunity Archive → View Archived → Restore |
| B | Product Re-Link Fix | Products Tab Remove → Re-Add |
| C | Activity Partial Update Fix | Activity Edit Single Field |

---

## Prerequisites

- [ ] Logged in as user with Admin or Manager role
- [ ] At least 1 existing Opportunity (can be created fresh for testing)
- [ ] At least 1 existing Opportunity with products linked
- [ ] At least 1 existing Activity record with multiple fields populated

---

## Test A: Opportunity Archive/Restore Cycle

**Objective:** Verify opportunities can be archived (soft-deleted) and restored through the UI without data loss.

> **IMPORTANT:** The Archive button is on the **full-page Show view**, NOT the slide-over panel.
> Navigate to: `/opportunities/{id}/show` (via "View Details" action)

### Setup

1. Navigate to: **`/opportunities`**
2. Either select an existing opportunity OR create a new test opportunity

- [ ] Opportunities list/board loads
- [ ] Test Opportunity: _______________

### Test Steps

#### Step A.1: Navigate to Opportunity Show Page

1. Click on an opportunity card/row to open the **slide-over** panel
2. In the slide-over header, click the **three-dot menu (⋮)** or **"View Details"** action
3. This navigates to the **full-page Show view** at `/opportunities/{id}/show`

- [ ] Full-page Show view loads
- [ ] URL shows `/opportunities/{id}/show`

#### Step A.2: Document Opportunity Details

1. On the Show page, record the key details:

| Field | Value |
|-------|-------|
| Name | |
| Stage | |
| Principal | |
| Expected Close Date | |
| Products (if any) | |

- [ ] Details documented
- [ ] **Screenshot checkpoint:** Take screenshot of opportunity details

#### Step A.2: Archive the Opportunity

1. In the opportunity slide-over or show view, locate the **"Archive"** button
   - Button has an Archive icon (box with down arrow)
2. Click the **"Archive"** button

**Expected Result:**
- [ ] ✅ Notification appears: "Opportunity archived"
- [ ] ✅ Redirected to opportunities list
- [ ] ✅ Opportunity no longer visible in main list/board

#### Step A.3: View Archived Opportunities

1. On the opportunities page, look for **"View archived opportunities"** button
   - Located at the bottom of the list/board view
2. Click the button to open the archived opportunities dialog

**Expected Result:**
- [ ] ✅ Dialog opens with title "Archived Opportunities"
- [ ] ✅ Your archived opportunity appears in the list
- [ ] ✅ Shows archive date and stage information

- [ ] Test opportunity visible in archived list

#### Step A.4: Restore the Opportunity (THE FIX)

1. Click on the archived opportunity to open its detail view
2. Locate the **"Send back to the board"** button
   - Button has an ArchiveRestore icon (box with up arrow)
3. Click the restore button

**Expected Result (After Fix):**
- [ ] ✅ Notification appears: "Opportunity unarchived"
- [ ] ✅ Redirected back to opportunities list
- [ ] ✅ Opportunity now visible in main list/board again

**Failure Indicator (Before Fix):**
- ❌ Error notification on restore
- ❌ Opportunity remains in archived state
- ❌ Data corruption or missing fields after restore

#### Step A.5: Verify Data Integrity

1. Click on the restored opportunity to open slide-over
2. Compare all fields to values documented in Step A.1

| Field | Expected | Actual | Match? |
|-------|----------|--------|--------|
| Name | (from A.1) | | ☐ |
| Stage | (from A.1) | | ☐ |
| Principal | (from A.1) | | ☐ |
| Expected Close Date | (from A.1) | | ☐ |
| Products | (from A.1) | | ☐ |

- [ ] All fields match original values
- [ ] No data was lost during archive/restore cycle

### Test A Result

| Status | Notes |
|--------|-------|
| ☐ PASS | Archive/restore cycle works with no data loss |
| ☐ FAIL | Restore failed or data was corrupted |
| ☐ BLOCKED | Cannot access archive functionality |

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

1. Click on the opportunity row/card in the list or board
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

**Product(s) currently linked:** _______________

#### Step B.3: Remove a Product

1. In the Products section, locate the product autocomplete/chip area
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

1. Click the **"Edit"** button (pencil icon ✏️) in the slide-over header

- [ ] Form switches to edit mode
- [ ] All fields become editable
- [ ] Current values are pre-populated

#### Step C.4: Change Only Sentiment Field (THE FIX)

1. Locate the **"Sentiment"** dropdown field
2. Change the value:
   - If currently "Positive" → change to "Neutral"
   - If currently "Neutral" → change to "Negative"
   - If currently "Negative" → change to "Positive"
   - If empty → select "Positive"
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

1. Refresh the browser (F5 or Cmd+R)
2. Navigate back to **`/activities`**
3. Open the same activity slide-over

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
| A | Opportunity Archive/Restore Cycle | ☐ PASS ☐ FAIL ☐ BLOCKED | |
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

- [ ] Test A: Opportunity before archive, archived list, after restore
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

| Element | Location | How to Find |
|---------|----------|-------------|
| Opportunities List | `/opportunities` | Left nav → "Opportunities" |
| Activities List | `/activities` | Left nav → "Activities" |
| Opportunity Slide-Over | Opportunities page | Click any opportunity row/card |
| Activity Slide-Over | Activities page | Click any activity row |
| Products Tab | Opportunity slide-over | 3rd tab with 📦 Package icon |
| Archive Button | Opportunity detail | Button with box+down-arrow icon, label "Archive" |
| View Archived Button | Opportunities page footer | Ghost button "View archived opportunities" |
| Unarchive Button | Archived opportunity detail | Button "Send back to the board" |
| Edit Button | Slide-over header | Pencil icon ✏️ |
| Cancel Button | Slide-over header (edit mode) | "Cancel" text button |
| Save Changes Button | Slide-over footer (edit mode) | Primary button "Save Changes" |
| Sentiment Dropdown | Activity edit form | Field labeled "Sentiment" |
| Success Toast | Top-right corner | Green notification bar |
| Error Toast | Top-right corner | Red notification bar |
