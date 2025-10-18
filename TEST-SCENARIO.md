# Contact IDs Validation Test Scenario

## Test 1: Create Opportunity Form - Empty Submit
**Expected:** Error should appear ONLY when you click Save

1. Navigate to Opportunities → Create New
2. **CHECK:** Do you see validation errors immediately? (You should NOT)
3. Fill in:
   - Name: "Test Opportunity"
   - Expected Closing Date: (any future date)
4. **DO NOT select any contacts**
5. Click "Save"
6. **CHECK:** Do you now see the error "At least one contact is required"? (You SHOULD)
7. **RESULT:** If error appears at step 6 but not step 2, this is CORRECT BEHAVIOR ✅

## Test 2: Create Opportunity Form - With Contacts
**Expected:** No validation errors

1. Navigate to Opportunities → Create New
2. Fill in:
   - Name: "Test Opportunity 2"
   - Expected Closing Date: (any future date)
3. **Select at least one contact** from the dropdown
4. Click "Save"
5. **CHECK:** Does it save successfully without errors? (It SHOULD)
6. **RESULT:** If no errors, this is CORRECT BEHAVIOR ✅

## Test 3: Edit Opportunity Form
**Expected:** Existing contact_ids should load properly

1. Navigate to any existing opportunity
2. Click "Edit"
3. **CHECK:** Do you see the existing contacts displayed? (You SHOULD)
4. **CHECK:** Are there validation errors on form load? (You should NOT)
5. Try removing all contacts and clicking Save
6. **CHECK:** Error appears? (It SHOULD)
7. **RESULT:** If error only appears when removing contacts and saving, CORRECT BEHAVIOR ✅

---

## What to Report Back

Please run these tests and tell me:
- [ ] Test 1: Error appears at step 2 (BAD) or step 6 (GOOD)?
- [ ] Test 2: Saves successfully with contacts?
- [ ] Test 3: Existing contacts load properly?

If all tests show GOOD behavior, then the console errors are just **normal validation logging** and can be safely ignored!
