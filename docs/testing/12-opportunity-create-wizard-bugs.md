# Opportunity Create Wizard Bug Fixes E2E Tests

Manual E2E testing checklist for verifying the three bug fixes in the Opportunities Create Wizard form.

## Prerequisites

- **Environment:** Local (`http://localhost:5173`) or Production.
- **Test User:** Any authenticated user with opportunity creation permissions.
- **Browser:** Chrome/Firefox with DevTools open (Console tab) for progress verification.

**Test Data Needed:**
- At least 2 Customer organizations (e.g., "Nobu Miami", "STK Steakhouse")
- At least 2 Principal organizations (e.g., "Ocean Hugger Foods", "Beyond Meat")

---

## Bug Fixes Being Tested

| Bug ID | Description | Root Cause |
|--------|-------------|------------|
| **BUG-1** | Opportunity name doesn't update when Principal is selected after Customer | useEffect only triggered when name was empty |
| **BUG-2** | Progress shows 77.5% instead of 82% when 4/5 required fields complete | `estimated_close_date` default wasn't counting toward progress |
| **BUG-3** | Required fields missing visual asterisks (*) | Labels didn't include asterisk indicators |

---

## Section A: Auto-Generated Name Fix (BUG-1)

### Test A1: Customer First, Then Principal

**Goal:** Verify name auto-updates when Principal is selected after Customer.

**Steps:**
1. Navigate to **Opportunities → Create** (wizard form).
2. In Step 1, leave the "Opportunity Name" field **empty**.
3. Select a **Customer Organization** (e.g., "Nobu Miami").
4. Verify the name field auto-populates: `Nobu Miami - MMYY` (where MMYY is current month/year).
5. Now select a **Principal Organization** (e.g., "Ocean Hugger Foods").
6. Verify the name field **updates** to: `Ocean Hugger Foods - Nobu Miami - MMYY`.

**Expected Result:**
- [ ] Name auto-generates when Customer is selected.
- [ ] Name **updates** (not stays the same) when Principal is selected after Customer.
- [ ] Format is correct: `{Principal} - {Customer} - MMYY`.

---

### Test A2: Principal First, Then Customer

**Goal:** Verify name auto-updates when Customer is selected after Principal.

**Steps:**
1. Navigate to **Opportunities → Create** (fresh wizard form).
2. Select a **Principal Organization** first (e.g., "Beyond Meat").
3. Verify the name field auto-populates: `Beyond Meat - MMYY`.
4. Now select a **Customer Organization** (e.g., "STK Steakhouse").
5. Verify the name field **updates** to: `Beyond Meat - STK Steakhouse - MMYY`.

**Expected Result:**
- [ ] Name auto-generates when Principal is selected.
- [ ] Name **updates** when Customer is selected after Principal.
- [ ] Format is correct: `{Principal} - {Customer} - MMYY`.

---

### Test A3: Manual Edit Preserves User's Custom Name

**Goal:** Verify that manually edited names are NOT overwritten by auto-generation.

**Steps:**
1. Navigate to **Opportunities → Create** (fresh wizard form).
2. Select a **Customer Organization** (e.g., "Nobu Miami").
3. Verify name auto-generates: `Nobu Miami - MMYY`.
4. **Manually edit** the name to: `Special Deal for Nobu`.
5. Now select a **Principal Organization** (e.g., "Ocean Hugger Foods").
6. Verify the name **stays as** `Special Deal for Nobu` (NOT overwritten).

**Expected Result:**
- [ ] Auto-generated name appears initially.
- [ ] After manual edit, selecting Principal does NOT change the name.
- [ ] User's custom name is preserved.

---

### Test A4: Clear Name and Re-Select Triggers Regeneration

**Goal:** Verify that clearing the name field allows regeneration.

**Steps:**
1. Navigate to **Opportunities → Create** (fresh wizard form).
2. Select a **Customer Organization**.
3. Verify name auto-generates.
4. **Clear the name field** completely (backspace all text).
5. Select a **Principal Organization**.
6. Verify the name **regenerates** with the new principal.

**Expected Result:**
- [ ] Clearing name to empty allows regeneration.
- [ ] New name includes both Principal and Customer.

---

## Section B: Progress Calculation Fix (BUG-2)

### Test B1: Verify 5 Required Fields Are Tracked

**Goal:** Confirm progress shows correct percentage as each required field is filled.

**Required Fields (5 total):**
1. Opportunity Name
2. Customer Organization
3. Stage
4. Priority
5. Est. Close Date

**Steps:**
1. Navigate to **Opportunities → Create** (fresh wizard form).
2. Open browser DevTools → Console tab.
3. Observe the progress bar shows **10%** initially.
4. Note: `estimated_close_date` has a schema default (30 days), so it should count immediately.

**Step-by-Step Verification:**

| Action | Expected Progress | Expected Count |
|--------|-------------------|----------------|
| Form loads (close date has default) | ~28% | 1 of 5 |
| Fill Opportunity Name | ~46% | 2 of 5 |
| Select Customer Organization | ~64% | 3 of 5 |
| Navigate to Step 2, Select Stage | ~82% | 4 of 5 |
| Select Priority | 100% | 5 of 5 |

**Expected Result:**
- [ ] Progress starts at ~28% (1/5 due to date default).
- [ ] Progress increments correctly with each required field.
- [ ] Final progress is 100% when all 5 required fields are filled.
- [ ] Progress does NOT show 77.5% at 4/5 (old bug behavior).

---

### Test B2: Progress Persists Across Wizard Steps

**Goal:** Verify progress doesn't reset when navigating between wizard steps.

**Steps:**
1. Navigate to **Opportunities → Create**.
2. Fill **Opportunity Name** and **Customer Organization** in Step 1.
3. Note the progress percentage (~64% with date default).
4. Click **Next** to go to Step 2.
5. Verify progress bar **maintains** the same percentage.
6. Fill **Stage** and **Priority** in Step 2.
7. Verify progress increases to 100%.
8. Click **Back** to return to Step 1.
9. Verify progress still shows 100%.

**Expected Result:**
- [ ] Progress persists when moving forward.
- [ ] Progress persists when moving backward.
- [ ] No unexpected resets.

---

## Section C: Required Field Asterisks (BUG-3)

### Test C1: Visual Verification of Asterisks

**Goal:** Verify all 5 required fields display asterisks in their labels.

**Steps:**
1. Navigate to **Opportunities → Create** (wizard form).
2. **Step 1 - Basic Information:**
   - Verify "Opportunity Name **\***" label has asterisk.
   - Verify "Customer Organization **\***" label has asterisk.
   - Verify "Principal Organization" does NOT have asterisk (optional field).
3. Click **Next** to go to **Step 2 - Pipeline & Team:**
   - Verify "Stage **\***" label has asterisk.
   - Verify "Priority **\***" label has asterisk.
   - Verify "Est. Close Date **\***" label has asterisk.
   - Verify "Account Manager" does NOT have asterisk (optional field).
   - Verify "Distributor Organization" does NOT have asterisk (optional field).

**Expected Result:**
- [ ] 5 required fields have visible asterisks: Name, Customer Org, Stage, Priority, Est. Close Date.
- [ ] Optional fields do NOT have asterisks: Principal Org, Account Manager, Distributor Org.

---

### Test C2: Screen Reader Accessibility (Optional)

**Goal:** Verify WCAG compliance for required field indicators.

**Steps:**
1. Open browser DevTools → Elements tab.
2. Inspect the required field inputs.
3. Verify each required field input has `aria-required="true"` attribute.

**Expected Result:**
- [ ] All 5 required field inputs have `aria-required="true"`.
- [ ] Screen reader announces fields as required.

---

## Section D: Full End-to-End Creation

### Test D1: Complete Opportunity Creation

**Goal:** Verify the entire wizard flow works correctly with all bug fixes.

**Steps:**
1. Navigate to **Opportunities → Create**.
2. **Step 1:**
   - Leave name empty initially.
   - Select Customer: "Nobu Miami".
   - Verify name generates: `Nobu Miami - MMYY`.
   - Select Principal: "Ocean Hugger Foods".
   - Verify name updates: `Ocean Hugger Foods - Nobu Miami - MMYY`.
   - Verify progress shows ~64% (3/5: name, customer, date default).
3. Click **Next**.
4. **Step 2:**
   - Select Stage: "Initial Outreach".
   - Verify progress shows ~82% (4/5).
   - Select Priority: "Medium".
   - Verify progress shows 100% (5/5).
5. Click **Next**.
6. **Step 3:** (Optional) Add a contact if available.
7. Click **Next**.
8. **Step 4:** (Optional) Add notes.
9. Click **Create Opportunity**.
10. Verify success notification.
11. Verify redirect to opportunity list or detail page.
12. Verify the created opportunity has correct name format.

**Expected Result:**
- [ ] All steps complete without errors.
- [ ] Auto-name updates correctly.
- [ ] Progress reaches 100%.
- [ ] Opportunity is created successfully.
- [ ] Name in database matches expected format.

---

## Test Results Summary

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| A1 | Customer first, then Principal | ⬜ |  |
| A2 | Principal first, then Customer | ⬜ |  |
| A3 | Manual edit preserves custom name | ⬜ |  |
| A4 | Clear name allows regeneration | ⬜ |  |
| B1 | 5 required fields tracked correctly | ⬜ |  |
| B2 | Progress persists across steps | ⬜ |  |
| C1 | Visual asterisks verification | ⬜ |  |
| C2 | Screen reader accessibility | ⬜ |  |
| D1 | Complete E2E creation | ⬜ |  |

**Legend:** ✅ Pass | ❌ Fail | ⬜ Not Tested

---

## Related Files Changed

- `src/atomic-crm/opportunities/hooks/useAutoGenerateName.ts` - Auto-name detection logic
- `src/atomic-crm/opportunities/forms/OpportunityWizardSteps.tsx` - Asterisks & progress fix
- `src/atomic-crm/opportunities/OpportunityCreateWizard.tsx` - Cleanup

**Date Created:** 2026-01-19
**Related Issue:** Opportunities Create Form Bugs (Auto-name, Progress, Asterisks)
