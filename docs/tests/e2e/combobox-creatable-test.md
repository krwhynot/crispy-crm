# Manual Test: Creatable Combobox Feature

**Feature:** Allow users to type custom values in Combobox when `creatable` prop is true
**Date:** 2026-01-05
**Tester:** _______________

## Prerequisites

1. Dev server running: `just dev`
2. Logged in as any user with opportunity creation permissions
3. At least one Principal exists in the database (for Quick Add form)

---

## Test 1: Standard Combobox (Non-Creatable) - No Regression

**Purpose:** Verify existing Combobox behavior is unchanged when `creatable` is NOT set

**Location:** Any Combobox WITHOUT `creatable` prop (e.g., Principal dropdown)

### Steps:
1. Navigate to Opportunities → Click "Quick Add" button (+ icon in header)
2. Click the "Principal" dropdown (Select component, not Combobox)
3. Type a value that doesn't exist: "ZZZZZ Fake Principal"
4. Observe behavior

### Expected Results:
- [ ] No "Create" option appears
- [ ] Only matching options are shown (or empty state)
- [ ] Typing filters existing options only

### Failure Indicators:
- ❌ "Create" option appears in non-creatable fields
- ❌ Freeform text can be submitted

---

## Test 2: City Combobox - Currently Broken (Before Fix)

**Purpose:** Document the current broken state before adding `creatable` prop

**Location:** Opportunities → Quick Add → City field

### Steps:
1. Click "Quick Add" button in Opportunities
2. Fill required fields (Principal, Org Name, Phone or Email)
3. Click the "City" Combobox field
4. Type "Crown Point" (a city NOT in the US_CITIES list)
5. Observe dropdown behavior

### Expected Results (CURRENT BROKEN STATE):
- [ ] "No option found" or "Type to search cities" message appears
- [ ] User CANNOT select "Crown Point"
- [ ] Form cannot be submitted with "Crown Point"

### Notes:
This test documents the bug. After adding `creatable` to the City Combobox, this behavior should change per Test 3.

---

## Test 3: Creatable Combobox - Create Option Appears

**Purpose:** Verify "Create" option appears when typing non-matching text

**Location:** Any Combobox WITH `creatable={true}` prop

### Steps:
1. Open a form with a creatable Combobox (City field after fix)
2. Click into the Combobox field
3. Type "Crown Point" (text NOT matching any option)
4. Observe the dropdown

### Expected Results:
- [ ] `Create "Crown Point"` option appears in dropdown
- [ ] Option is selectable via click
- [ ] Option is selectable via keyboard (arrow down + Enter)

### Failure Indicators:
- ❌ No "Create" option appears
- ❌ "Create" option appears but is not selectable
- ❌ Dropdown closes without showing option

---

## Test 4: Creatable Combobox - Selection Behavior

**Purpose:** Verify selecting the "Create" option works correctly

**Location:** Any Combobox WITH `creatable={true}` prop

### Steps:
1. Open Combobox, type "Crown Point"
2. Click on `Create "Crown Point"` option
3. Observe the Combobox state after selection

### Expected Results:
- [ ] Dropdown closes after selection
- [ ] Combobox button shows "Crown Point" as selected value
- [ ] Search input is cleared (not showing "Crown Point" in search)
- [ ] `onValueChange` was called with "Crown Point" (check React DevTools or form state)

### Failure Indicators:
- ❌ Dropdown stays open
- ❌ Selected value shows `__create__Crown Point` (internal prefix leaked)
- ❌ Search input still shows typed text

---

## Test 5: Creatable Combobox - Case-Insensitive Duplicate Prevention

**Purpose:** Verify "Create" option does NOT appear if option already exists (case-insensitive)

**Location:** Any Combobox WITH `creatable={true}` prop

### Steps:
1. Open City Combobox
2. Type "chicago" (lowercase, matches "Chicago" in US_CITIES)
3. Observe dropdown

### Expected Results:
- [ ] "Chicago" option appears in filtered results
- [ ] NO `Create "chicago"` option appears
- [ ] Existing "Chicago" option is selectable

### Steps (continued):
4. Clear input
5. Type "CHICAGO" (uppercase)
6. Observe dropdown

### Expected Results:
- [ ] "Chicago" option appears in filtered results
- [ ] NO `Create "CHICAGO"` option appears

### Failure Indicators:
- ❌ "Create" option appears for existing city (any case)
- ❌ Duplicate entries can be created

---

## Test 6: Creatable Combobox - Empty/Whitespace Input

**Purpose:** Verify "Create" option does NOT appear for empty or whitespace-only input

**Location:** Any Combobox WITH `creatable={true}` prop

### Steps:
1. Open Combobox
2. Type just spaces: "   "
3. Observe dropdown

### Expected Results:
- [ ] NO `Create "   "` option appears
- [ ] Standard empty state shows ("No option found" or similar)

### Steps (continued):
4. Clear input completely (empty string)
5. Observe dropdown

### Expected Results:
- [ ] NO "Create" option appears
- [ ] All options are shown (or initial state)

### Failure Indicators:
- ❌ Create option appears with empty/whitespace value
- ❌ Whitespace-only values can be created

---

## Test 7: Creatable Combobox - Keyboard Navigation

**Purpose:** Verify "Create" option works with keyboard navigation

**Location:** Any Combobox WITH `creatable={true}` prop

### Steps:
1. Open Combobox via keyboard (Tab to field, press Enter/Space)
2. Type "Crown Point"
3. Press Arrow Down to navigate to `Create "Crown Point"` option
4. Press Enter to select

### Expected Results:
- [ ] "Create" option is keyboard-focusable
- [ ] Focus highlight visible on "Create" option
- [ ] Enter key selects the option
- [ ] Dropdown closes, value is set

### Failure Indicators:
- ❌ Cannot reach "Create" option with keyboard
- ❌ Enter key doesn't select the option
- ❌ No visible focus indicator

---

## Test 8: End-to-End - Quick Add with Custom City

**Purpose:** Verify the full flow works with a custom city value

**Location:** Opportunities → Quick Add Dialog

### Prerequisites:
- `creatable` prop added to City Combobox in QuickAddForm.tsx

### Steps:
1. Open Quick Add dialog
2. Fill required fields:
   - Principal: Select any
   - Organization Name: "Test Org E2E"
   - Phone: "555-999-8888"
3. In City field, type "Crown Point"
4. Select `Create "Crown Point"` option
5. Verify State field (should be empty for custom cities)
6. Click "Save & Close"

### Expected Results:
- [ ] City shows "Crown Point" after selection
- [ ] State field is empty (cleared by handleCitySelect)
- [ ] Form submits successfully
- [ ] New opportunity is created
- [ ] Contact has city="Crown Point", state="" in database

### Verification Query:
```sql
SELECT c.first_name, c.last_name, c.city, c.state
FROM contacts c
WHERE c.city = 'Crown Point'
ORDER BY c.created_at DESC
LIMIT 1;
```

### Failure Indicators:
- ❌ Form validation fails
- ❌ City value not saved to database
- ❌ State has incorrect value

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Non-creatable (no regression) | ⬜ Pass / ⬜ Fail | |
| 2. City broken state (before fix) | ⬜ Pass / ⬜ Fail | |
| 3. Create option appears | ⬜ Pass / ⬜ Fail | |
| 4. Selection behavior | ⬜ Pass / ⬜ Fail | |
| 5. Case-insensitive duplicates | ⬜ Pass / ⬜ Fail | |
| 6. Empty/whitespace handling | ⬜ Pass / ⬜ Fail | |
| 7. Keyboard navigation | ⬜ Pass / ⬜ Fail | |
| 8. E2E Quick Add flow | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ PASS / ⬜ FAIL

**Tested By:** _______________
**Date:** _______________

---

## Implementation Checklist

Before running tests 3-8, ensure these code changes are made:

### 1. Combobox Component (DONE)
**File:** `src/components/ui/combobox.tsx`
- [x] `creatable?: boolean` prop added to interface (line 33)
- [x] Prop destructured with default `false` (line 46)
- [x] Create option rendered when conditions met (lines 97-113)

### 2. QuickAddForm (TODO)
**File:** `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx`
- [ ] Add `creatable` prop to City Combobox (around line 336)

```tsx
// Before:
<Combobox
  id="city"
  options={cityOptions}
  value={cityValue}
  onValueChange={(value) => handleCitySelect(value)}
  ...
/>

// After:
<Combobox
  id="city"
  options={cityOptions}
  value={cityValue}
  onValueChange={(value) => handleCitySelect(value)}
  creatable  // ← Add this prop
  ...
/>
```

---

## Debugging Tips

### If "Create" option doesn't appear:
1. Check browser console for errors
2. Verify `creatable={true}` prop is passed
3. Inspect component in React DevTools:
   - Look for `creatable` in props
   - Check `searchValue` state is updating

### If value shows `__create__` prefix:
- The `onSelect` handler is receiving the internal value instead of trimmed searchValue
- Check lines 105-108 in combobox.tsx

### If case-insensitive check fails:
```javascript
// In browser console, test the logic:
const options = [{label: 'Chicago'}, {label: 'New York'}];
const searchValue = 'chicago';
options.some(opt => opt.label.toLowerCase() === searchValue.trim().toLowerCase());
// Should return true
```

### If keyboard navigation doesn't work:
- cmdk library handles this automatically
- Check that CommandItem has a valid `value` prop
- Verify no `disabled` prop is set
