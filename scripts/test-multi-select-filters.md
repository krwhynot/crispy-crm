# Multi-Select Filters Manual Testing Checklist

## Overview
Comprehensive manual testing checklist for multi-select filters implementation on the Opportunities List page. This covers all filter types (Stage, Priority, Category, Organization), default behaviors, UI interactions, and edge cases.

## Pre-Testing Setup
- [ ] Clear browser localStorage: `localStorage.clear()`
- [ ] Open Browser DevTools Network tab for query monitoring
- [ ] Ensure test data includes opportunities with various stages, priorities, categories, and organizations
- [ ] Test with organization names containing special characters: "Tech, Inc.", "O'Reilly & Co.", "Company (USA)"

---

## Test Group 1: Basic Multi-Selection Functionality

### Test Case 1.1: Stage Multi-Selection
**Objective**: Verify stage filter supports multiple selections

**Steps**:
1. Navigate to `/opportunities`
2. Click on Stage filter dropdown
3. Select "Qualified" (checkbox should be checked)
4. Select "Proposal" (checkbox should be checked)
5. Click outside dropdown to close

**Expected Results**:
- [ ] Both "Qualified" and "Proposal" checkboxes are checked
- [ ] Dropdown button shows "(2 selected)"
- [ ] Opportunities list shows only records with qualified OR proposal stages
- [ ] Filter chip panel appears showing "Stage: Qualified, Proposal"

**Network Validation**:
- [ ] Query uses format: `stage=in.(qualified,proposal)`
- [ ] No duplicate network requests

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 1.2: Priority Multi-Selection
**Objective**: Verify priority filter supports multiple selections

**Steps**:
1. Clear all existing filters
2. Click on Priority filter dropdown
3. Select "High" and "Critical"
4. Close dropdown

**Expected Results**:
- [ ] Both "High" and "Critical" checkboxes are checked
- [ ] Button shows "(2 selected)"
- [ ] List shows only high and critical priority opportunities
- [ ] Chips show "Priority: High, Critical"

**Network Validation**:
- [ ] Query uses format: `priority=in.(high,critical)`

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 1.3: Category Multi-Selection
**Objective**: Verify category filter with dynamic choices

**Steps**:
1. Clear all existing filters
2. Click on Category filter dropdown
3. Verify dropdown shows distinct categories from database
4. Select 2-3 different categories
5. Close dropdown

**Expected Results**:
- [ ] Dropdown populated with actual categories from opportunities
- [ ] Multiple categories can be selected
- [ ] List filters correctly for selected categories
- [ ] Chips display selected category names

**Network Validation**:
- [ ] Initial query fetches distinct categories
- [ ] Filter query uses format: `category=in.(category1,category2)`

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 1.4: Organization Multi-Selection
**Objective**: Verify organization reference filter supports multiple selections

**Steps**:
1. Clear all existing filters
2. Click on Customer Organization filter dropdown
3. Select 2-3 different organizations
4. Close dropdown

**Expected Results**:
- [ ] Multiple organizations can be selected
- [ ] List shows opportunities for selected organizations only
- [ ] Chips show organization names (not IDs)
- [ ] No N+1 query issues (single batch fetch for org names)

**Network Validation**:
- [ ] Query uses format: `customer_organization_id=in.(123,456,789)`
- [ ] Single getMany call for organization name resolution

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 2: Default Stage Behavior

### Test Case 2.1: Initial Default Stage Loading
**Objective**: Verify closed stages are hidden by default

**Steps**:
1. Clear browser localStorage
2. Navigate to `/opportunities`
3. Observe initial stage filter state
4. Check opportunities list content

**Expected Results**:
- [ ] Stage filter shows all stages EXCEPT "Closed Won" and "Closed Lost"
- [ ] List excludes closed opportunities by default
- [ ] No filter chips shown (this is the default state)
- [ ] Stage dropdown button shows appropriate count (e.g., "4 selected" if 6 total stages)

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 2.2: LocalStorage Persistence of Stage Preferences
**Objective**: Verify user preferences are saved and restored

**Steps**:
1. Clear localStorage
2. Load opportunities page (defaults applied)
3. Add "Closed Won" to stage selection
4. Navigate away to `/companies`
5. Return to `/opportunities`
6. Check localStorage content

**Expected Results**:
- [ ] localStorage contains `opportunity_hidden_stages: ["closed_lost"]`
- [ ] On return, only "Closed Lost" is hidden (user's preference)
- [ ] "Closed Won" remains selected and visible in list

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 2.3: Navigation Reset Behavior
**Objective**: Verify filters reset to defaults on navigation

**Steps**:
1. Apply various filters (priority, category, etc.)
2. Navigate to `/companies`
3. Return to `/opportunities`

**Expected Results**:
- [ ] All filters reset to defaults (not preserved from previous visit)
- [ ] Only stage preferences restored from localStorage
- [ ] Filter chips panel hidden (no active filters)

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 3: URL Parameter Precedence

### Test Case 3.1: URL Override of Defaults
**Objective**: Verify URL parameters take precedence over localStorage and defaults

**Steps**:
1. Set localStorage to hide "qualified": `localStorage.setItem('opportunity_hidden_stages', '["qualified", "closed_won", "closed_lost"]')`
2. Navigate to `/opportunities?filter={"stage":["qualified","proposal"],"priority":["high"]}`
3. Observe filter states

**Expected Results**:
- [ ] Stage filter shows "Qualified" and "Proposal" (URL overrides localStorage)
- [ ] Priority filter shows "High"
- [ ] Opportunities list reflects URL filter state
- [ ] Filter chips show both stage and priority selections

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 3.2: URL Parameter Sharing
**Objective**: Verify URLs can be shared to reproduce filter state

**Steps**:
1. Apply complex filters: multiple stages, priorities, categories
2. Copy URL from address bar
3. Open URL in new browser tab/window
4. Compare filter states

**Expected Results**:
- [ ] New tab shows identical filter selections
- [ ] Opportunities list shows same filtered results
- [ ] Filter chips match original state

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 4: Filter Chips Panel

### Test Case 4.1: Chip Panel Display Logic
**Objective**: Verify chips panel appears/hides appropriately

**Steps**:
1. Start with no filters (default state)
2. Add one filter
3. Add multiple filters
4. Remove all filters

**Expected Results**:
- [ ] No filters: Panel is hidden
- [ ] One filter: Panel appears with one chip
- [ ] Multiple filters: Panel shows all chips
- [ ] No filters again: Panel hides

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 4.2: Individual Chip Removal
**Objective**: Verify clicking chip 'x' removes only that filter value

**Steps**:
1. Apply multiple stage selections: "Qualified", "Proposal", "Negotiation"
2. Apply priority filter: "High"
3. Click 'x' on "Stage: Qualified" chip
4. Observe results

**Expected Results**:
- [ ] Only "Qualified" removed from stage filter
- [ ] "Proposal" and "Negotiation" remain in stage filter
- [ ] Priority filter unchanged
- [ ] Opportunities list updates to exclude qualified opportunities

**Network Validation**:
- [ ] New query excludes qualified: `stage=in.(proposal,negotiation)`

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 4.3: Collapsible Panel Behavior
**Objective**: Verify panel can be collapsed/expanded

**Steps**:
1. Apply filters to show chips panel
2. Click collapse button
3. Click expand button
4. Remove all filters

**Expected Results**:
- [ ] Panel collapses when clicked
- [ ] Panel expands when clicked
- [ ] Panel auto-expands when new filters applied
- [ ] Panel hides when no filters remain

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 5: Clear All Functionality

### Test Case 5.1: Clear All in Stage Dropdown
**Objective**: Verify "Clear all" removes all stage selections

**Steps**:
1. Select multiple stages
2. Open stage dropdown
3. Click "Clear all" option
4. Observe results

**Expected Results**:
- [ ] All stage checkboxes become unchecked
- [ ] Dropdown button shows default text (not "(X selected)")
- [ ] List shows all opportunities (no stage filtering)
- [ ] Stage filter chip disappears

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 5.2: Clear All in Multiple Dropdowns
**Objective**: Verify clear all works independently for each filter type

**Steps**:
1. Apply stage, priority, and category filters
2. Use "Clear all" in priority dropdown only
3. Verify other filters remain

**Expected Results**:
- [ ] Priority filter cleared
- [ ] Stage and category filters unchanged
- [ ] Priority chip disappears, other chips remain

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 6: Organization Name Display

### Test Case 6.1: Organization Name Resolution
**Objective**: Verify organization chips show names, not IDs

**Steps**:
1. Select multiple organizations in filter
2. Observe filter chips
3. Check Network tab for name resolution

**Expected Results**:
- [ ] Chips show organization names (e.g., "Customer: Acme Corp")
- [ ] No raw IDs visible in UI
- [ ] Single batch query for organization names
- [ ] Reasonable loading time for name resolution

**Network Validation**:
- [ ] getMany call with organization IDs
- [ ] Response contains name field
- [ ] No individual getOne calls

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 6.2: Organization Name Caching
**Objective**: Verify organization names are cached to prevent repeated queries

**Steps**:
1. Select organizations A, B, C
2. Clear organization filter
3. Select organizations A, B again (subset of previous)
4. Monitor Network tab

**Expected Results**:
- [ ] No new network requests for A, B (cached)
- [ ] Names display immediately
- [ ] No loading indicators for cached organizations

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 7: Special Characters and Edge Cases

### Test Case 7.1: Organizations with Special Characters
**Objective**: Verify proper handling of special characters in organization names

**Steps**:
1. Filter by organizations with names containing:
   - Commas: "Tech, Inc."
   - Quotes: "O'Reilly & Co."
   - Parentheses: "Company (USA)"
   - Backslashes: "C:\\Path" (if any exist)
2. Observe query format in Network tab

**Expected Results**:
- [ ] All organizations filter correctly
- [ ] No query errors in Network tab
- [ ] Proper escaping in PostgREST queries
- [ ] Names display correctly in chips

**Network Validation**:
- [ ] Commas: `customer_organization_id=in.(123,456)` (IDs, not names)
- [ ] Special characters properly escaped in display names
- [ ] No SQL errors or malformed queries

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 7.2: Empty and Null Category Handling
**Objective**: Verify proper handling of empty/null categories

**Steps**:
1. Ensure test data includes opportunities with null/empty categories
2. Open category dropdown
3. Observe available choices
4. Select empty/null category if available

**Expected Results**:
- [ ] Null categories handled gracefully (not shown or shown as "(No Category)")
- [ ] Empty string categories handled appropriately
- [ ] No JavaScript errors in console
- [ ] Category filter works correctly with null handling

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 7.3: Large Number of Selections
**Objective**: Verify performance with many selections

**Steps**:
1. Select a large number of organizations (10+)
2. Apply multiple other filters
3. Monitor performance and UI responsiveness

**Expected Results**:
- [ ] UI remains responsive
- [ ] Query response time < 2 seconds
- [ ] No browser slowdown
- [ ] Chips panel displays all selections without overflow issues

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 8: Interaction Between Multiple Filters

### Test Case 8.1: Combined Filter Logic
**Objective**: Verify multiple filters work together with AND logic

**Steps**:
1. Apply stage filter: ["qualified", "proposal"]
2. Apply priority filter: ["high"]
3. Apply organization filter: [specific organizations]
4. Verify results

**Expected Results**:
- [ ] Results show opportunities that match ALL criteria:
  - (Stage = qualified OR proposal) AND
  - (Priority = high) AND
  - (Organization = selected orgs)
- [ ] Chip panel shows all active filters
- [ ] Query uses multiple filter parameters

**Network Validation**:
- [ ] Single query with multiple parameters
- [ ] Correct PostgREST syntax for each filter type

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 8.2: Filter Removal Order Independence
**Objective**: Verify removing filters in any order works correctly

**Steps**:
1. Apply 4 different filters (stage, priority, category, organization)
2. Remove priority filter first
3. Remove organization filter
4. Remove stage filter
5. Remove category filter last

**Expected Results**:
- [ ] Each removal updates the list correctly
- [ ] Remaining filters continue to work
- [ ] No stale filter states
- [ ] Chips disappear in correct order

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 9: Performance Validation

### Test Case 9.1: Response Time Measurement
**Objective**: Verify filter operations complete within acceptable time

**Steps**:
1. Clear browser cache
2. Apply complex multi-filter combination
3. Measure time from filter application to list update
4. Repeat with different filter combinations

**Expected Results**:
- [ ] Initial filter application < 2 seconds
- [ ] Subsequent filter changes < 1 second
- [ ] No noticeable UI lag or blocking
- [ ] Smooth transitions between filter states

**Performance Metrics**:
- Filter application time: _____ ms
- List update time: _____ ms
- Network request time: _____ ms

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 9.2: Memory Usage Validation
**Objective**: Verify no memory leaks with repeated filter operations

**Steps**:
1. Open Browser DevTools Performance tab
2. Apply and clear filters repeatedly (20+ times)
3. Monitor memory usage
4. Check for JavaScript errors

**Expected Results**:
- [ ] Memory usage remains stable
- [ ] No console errors
- [ ] No hanging promises or unclosed connections
- [ ] UI remains responsive after many operations

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 10: Persistence Across Page Refreshes

### Test Case 10.1: URL State Persistence
**Objective**: Verify filters persist through page refresh when in URL

**Steps**:
1. Apply multiple filters
2. Verify filters are in URL
3. Refresh page (F5)
4. Observe filter states

**Expected Results**:
- [ ] All filters restored from URL
- [ ] List shows correct filtered results
- [ ] Filter chips display correctly
- [ ] No additional network requests for restoration

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 10.2: Default State After Refresh Without URL Filters
**Objective**: Verify default behavior when refreshing without URL filters

**Steps**:
1. Navigate to `/opportunities` (no URL filters)
2. Refresh page
3. Observe default filter state

**Expected Results**:
- [ ] Returns to default stage filtering (excluding closed stages)
- [ ] No other filters applied
- [ ] LocalStorage preferences respected for stages

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 11: Mobile Responsiveness (If Applicable)

### Test Case 11.1: Mobile Filter Interaction
**Objective**: Verify filters work correctly on mobile viewports

**Steps**:
1. Resize browser to mobile width (< 768px) or use device simulation
2. Test filter dropdown interactions
3. Test chip panel behavior
4. Verify touch interactions

**Expected Results**:
- [ ] Dropdowns open and close correctly on mobile
- [ ] Filter chips are readable and interactive
- [ ] No horizontal overflow
- [ ] Touch targets are appropriate size

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 12: Backward Compatibility

### Test Case 12.1: Legacy Single-Value URLs
**Objective**: Verify old single-value filter URLs still work

**Steps**:
1. Navigate to `/opportunities?filter={"stage":"qualified"}`
2. Observe filter state
3. Verify backward compatibility

**Expected Results**:
- [ ] Single stage value applied correctly
- [ ] Can add additional stage values
- [ ] No JavaScript errors
- [ ] Smooth transition to multi-select behavior

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Test Group 13: Error Handling

### Test Case 13.1: Network Failure Graceful Degradation
**Objective**: Verify graceful handling of network failures

**Steps**:
1. Apply filters successfully
2. Simulate network failure (DevTools offline mode)
3. Try to change filters
4. Restore network connection

**Expected Results**:
- [ ] Error message displayed appropriately
- [ ] Filter UI remains functional
- [ ] Previous filter state preserved
- [ ] Recovery when network restored

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

### Test Case 13.2: Invalid Filter Value Handling
**Objective**: Verify handling of invalid filter values from URL manipulation

**Steps**:
1. Navigate to URL with invalid filter: `/opportunities?filter={"stage":["invalid_stage"]}`
2. Observe behavior
3. Try valid filters after invalid ones

**Expected Results**:
- [ ] Invalid values ignored gracefully
- [ ] No JavaScript errors
- [ ] Valid filters can still be applied
- [ ] User can recover to normal operation

**Pass/Fail**: ☐ Pass ☐ Fail
**Notes**: ________________________________

---

## Testing Summary

### Overall Results
- **Total Test Cases**: 33
- **Passed**: _____
- **Failed**: _____
- **Skipped**: _____

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Performance Metrics
- **Average Filter Response Time**: _____ ms
- **Peak Memory Usage**: _____ MB
- **Network Requests per Filter Operation**: _____

### Browser Compatibility Tested
- [ ] Chrome (version: _____)
- [ ] Firefox (version: _____)
- [ ] Safari (version: _____)
- [ ] Edge (version: _____)

### Recommendations for Production Release
- [ ] All critical tests passing
- [ ] Performance within acceptable limits
- [ ] No console errors
- [ ] Accessibility requirements met
- [ ] Edge cases handled appropriately

### Notes for Development Team
________________________________
________________________________
________________________________

---

**Testing Completed By**: ________________
**Date**: ________________
**Browser/OS**: ________________
**Build Version**: ________________