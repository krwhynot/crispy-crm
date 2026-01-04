# Manual Test: AutocompleteInput Debounce Optimization

**Feature:** Debounced live search in autocomplete inputs
**Date:** 2026-01-03
**Tester:** _______________

## Prerequisites

1. Dev server running: `just dev`
2. Browser DevTools open → Network tab
3. Filter Network by "Fetch/XHR" to see API calls
4. Have at least 2-3 contacts and organizations in the database

---

## Test 1: Debounce Verification (300ms delay)

**Location:** Tasks → Create New Task → Contact field

### Steps:
1. Open Network tab in DevTools
2. Clear network log
3. Click into the "Contact" autocomplete field
4. Type "jo" quickly (within 100ms)
5. Wait 500ms
6. Observe network requests

### Expected Results:
- [ ] **NO** API request while typing quickly
- [ ] **ONE** API request appears ~300ms after you stop typing
- [ ] Request URL contains `contacts` resource

### Failure Indicators:
- ❌ Multiple requests fire per keystroke
- ❌ Request fires immediately on first character

---

## Test 2: Minimum Character Threshold (2+ chars)

**Location:** Organizations → List → Parent Organization field (in edit mode)

### Steps:
1. Open any organization for editing
2. Clear network log
3. Click into "Parent Organization" field
4. Type "a" (single character)
5. Wait 500ms
6. Type "ab" (two characters)
7. Wait 500ms

### Expected Results:
- [ ] **NO** dropdown appears with just "a"
- [ ] **NO** API request with just "a"
- [ ] Dropdown appears after typing "ab"
- [ ] API request fires for "ab" search

### Failure Indicators:
- ❌ Dropdown opens with 1 character
- ❌ API request fires with 1 character

---

## Test 3: ILIKE Search Pattern

**Location:** Contacts → List → "Reports To" field (ContactManagerInput)

### Steps:
1. Edit any contact
2. Clear network log
3. Type "smi" in "Reports To" field
4. Wait for request to complete
5. Inspect the network request URL/payload

### Expected Results:
- [ ] Request contains ILIKE pattern: `%smi%`
- [ ] Search is case-insensitive (finds "Smith", "SMITH", "smith")
- [ ] Partial matches work (finds "Smithson" for "smi")

### Failure Indicators:
- ❌ Exact match only (no wildcards)
- ❌ Case-sensitive search

---

## Test 4: Empty Input Clears Suggestions

**Location:** Any autocomplete field

### Steps:
1. Type "test" in any autocomplete field
2. Wait for dropdown to appear
3. Clear the input (Ctrl+A, Delete)
4. Observe dropdown behavior

### Expected Results:
- [ ] Dropdown closes when input is cleared
- [ ] No "empty search" API request fires
- [ ] Field returns to initial state

---

## Test 5: Loading State Visibility

**Location:** Activities → Create Activity → Opportunity field

### Steps:
1. Open Network tab
2. Enable "Slow 3G" throttling (Network → Throttling dropdown)
3. Type "op" in Opportunity field
4. Observe the autocomplete during loading

### Expected Results:
- [ ] Loading indicator visible during fetch
- [ ] Results appear after loading completes
- [ ] No UI freeze or jank

### Cleanup:
- Disable network throttling when done

---

## Test 6: Quick Create Still Works

**Location:** Contacts → Any form with AutocompleteContactInput

### Steps:
1. Type a name that doesn't exist: "TestNewContact123"
2. Wait for search to complete
3. Look for "Create TestNewContact123" option

### Expected Results:
- [ ] "Create" option appears in dropdown
- [ ] Clicking it opens quick create popover
- [ ] Creating contact works as expected

---

## Test 7: Cross-Feature Consistency

Test that ALL autocomplete fields have consistent behavior:

| Location | Field | Debounce | 2-char min | ILIKE |
|----------|-------|----------|------------|-------|
| Tasks → Create | Contact | [ ] | [ ] | [ ] |
| Tasks → Create | Organization | [ ] | [ ] | [ ] |
| Tasks → Create | Opportunity | [ ] | [ ] | [ ] |
| Contacts → Edit | Reports To | [ ] | [ ] | [ ] |
| Contacts → Edit | Link Opportunity | [ ] | [ ] | [ ] |
| Organizations → Edit | Parent Org | [ ] | [ ] | [ ] |
| Activities → Create | Opportunity | [ ] | [ ] | [ ] |
| Activities → Create | Contact | [ ] | [ ] | [ ] |
| Activities → Create | Organization | [ ] | [ ] | [ ] |
| Product Distributors → Create | Product | [ ] | [ ] | [ ] |
| Product Distributors → Create | Distributor | [ ] | [ ] | [ ] |
| Opportunities → Contacts Tab | Contact array | [ ] | [ ] | [ ] |
| Opportunities → Products Tab | Product array | [ ] | [ ] | [ ] |

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Debounce (300ms) | ⬜ Pass / ⬜ Fail | |
| 2. Min chars (2+) | ⬜ Pass / ⬜ Fail | |
| 3. ILIKE pattern | ⬜ Pass / ⬜ Fail | |
| 4. Empty clears | ⬜ Pass / ⬜ Fail | |
| 5. Loading state | ⬜ Pass / ⬜ Fail | |
| 6. Quick create | ⬜ Pass / ⬜ Fail | |
| 7. Consistency | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ PASS / ⬜ FAIL

**Tested By:** _______________
**Date:** _______________

---

## Debugging Tips

### If debounce isn't working:
```javascript
// In browser console, check if debounce prop exists
document.querySelector('[class*="AutocompleteInput"]')?.__reactFiber$
```

### If requests show wrong filter:
1. Network tab → click request → Headers tab
2. Look for `filter` query parameter
3. Should contain `@ilike` or `q=` parameter

### If 2-char minimum isn't working:
- Check that `shouldRenderSuggestions` prop is present
- Verify it's a function, not a boolean
