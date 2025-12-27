# Manual E2E Test: Organization Hierarchy & Branches

**Feature:** Organization parent-child relationships, scope classification, and branch management
**Priority:** High
**User Role:** Admin (`admin@test.com`)
**Estimated Time:** 20-30 minutes

---

## Prerequisites

- [ ] Local dev server running (`npm run dev`)
- [ ] Logged in as Admin user
- [ ] Clean test environment (no pre-existing "Test Parent Corp" organizations)

**Test Environment:**
- [ ] Local Development
- [ ] Staging
- [ ] Production (read-only verification)

---

## Test Data to Create

| Organization | Type | Parent | Scope | Operating Entity |
|-------------|------|--------|-------|-----------------|
| Test Parent Corp | distributor | (none) | National | OFF |
| Test Branch Chicago | distributor | Test Parent Corp | Local | ON |
| Test Branch Detroit | distributor | Test Parent Corp | Local | ON |
| Test Branch Milwaukee | distributor | Test Parent Corp | Local | ON |
| Test Branch Atlanta | distributor | Test Parent Corp | Regional | ON |

---

## Section 1: Create Parent Organization

### 1.1 Navigate to Create Form
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 1.1.1 | Navigate to Organizations list (`/#/organizations`) | List view displays with Create button | [ ] | [ ] | |
| 1.1.2 | Click "Create" button | Create form opens in new page | [ ] | [ ] | |

### 1.2 Fill Organization Hierarchy Section
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 1.2.1 | Expand "Organization Hierarchy" collapsible section | Section expands showing Parent, Scope, Operating Entity fields | [ ] | [ ] | |
| 1.2.2 | Leave "Parent Organization" field empty | Field shows placeholder text | [ ] | [ ] | |
| 1.2.3 | Click "Scope" dropdown | Shows options: National, Regional, Local | [ ] | [ ] | |
| 1.2.4 | Select "National" | Dropdown shows "National" selected | [ ] | [ ] | |
| 1.2.5 | Verify "This location processes orders" checkbox | Checkbox visible with helper text about ON/OFF | [ ] | [ ] | |
| 1.2.6 | Uncheck "This location processes orders" | Checkbox is OFF (corporate HQ pattern) | [ ] | [ ] | |

### 1.3 Complete Parent Organization
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 1.3.1 | Fill Name: "Test Parent Corp" | Name field populated | [ ] | [ ] | |
| 1.3.2 | Select Organization Type: "Distributor" | Type dropdown shows Distributor | [ ] | [ ] | |
| 1.3.3 | Fill City: "Corporate HQ" | City field populated | [ ] | [ ] | |
| 1.3.4 | Click "Create Organization" button | Form submits, redirects to edit view | [ ] | [ ] | |
| 1.3.5 | Verify success notification | Toast shows "Organization created" | [ ] | [ ] | |

### 1.4 Verify No Hierarchy Sections Yet
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 1.4.1 | Check sidebar for "Organization Hierarchy" card | Card should NOT appear (no parent) | [ ] | [ ] | |
| 1.4.2 | Check sidebar for "Branch Locations" card | Card should NOT appear (no branches yet) | [ ] | [ ] | |

---

## Section 2: Create Branch Organizations

### 2.1 Create First Branch via "Add Branch" Button
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 2.1.1 | Open "Test Parent Corp" in edit view | Edit form displays | [ ] | [ ] | |
| 2.1.2 | **WAIT** - After first branch exists, look for "Branch Locations" card | For now, navigate manually to create | [ ] | [ ] | |
| 2.1.3 | Click "Create" from Organizations list | Create form opens | [ ] | [ ] | |
| 2.1.4 | Expand "Organization Hierarchy" section | Section expands | [ ] | [ ] | |
| 2.1.5 | Click "Parent Organization" autocomplete | Autocomplete dropdown opens | [ ] | [ ] | |
| 2.1.6 | Type "Test Parent" in search | "Test Parent Corp" appears in results | [ ] | [ ] | |
| 2.1.7 | Select "Test Parent Corp" | Parent organization selected | [ ] | [ ] | |
| 2.1.8 | Select Scope: "Local" | Scope set to Local | [ ] | [ ] | |
| 2.1.9 | Check "This location processes orders" | Checkbox is ON | [ ] | [ ] | |
| 2.1.10 | Fill Name: "Test Branch Chicago" | Name populated | [ ] | [ ] | |
| 2.1.11 | Fill City: "Chicago", State: "IL" | Location populated | [ ] | [ ] | |
| 2.1.12 | Select Organization Type: "Distributor" | Type matches parent | [ ] | [ ] | |
| 2.1.13 | Click "Create Organization" | Form submits successfully | [ ] | [ ] | |

### 2.2 Use "Add Branch" Button for Remaining Branches
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 2.2.1 | Navigate to "Test Parent Corp" edit view | Edit view opens | [ ] | [ ] | |
| 2.2.2 | Look for "Branch Locations" card in sidebar | Card appears with "1 Branch" badge | [ ] | [ ] | |
| 2.2.3 | Click "Add Branch" button in card header | Create form opens | [ ] | [ ] | |
| 2.2.4 | Verify Parent Organization pre-filled | Shows "Test Parent Corp" already selected | [ ] | [ ] | |
| 2.2.5 | Verify Organization Type pre-filled | Shows "Distributor" already selected | [ ] | [ ] | |
| 2.2.6 | Fill Name: "Test Branch Detroit", City: "Detroit", State: "MI" | Fields populated | [ ] | [ ] | |
| 2.2.7 | Select Scope: "Local", check "processes orders" | Hierarchy fields set | [ ] | [ ] | |
| 2.2.8 | Click "Create Organization" | Form submits successfully | [ ] | [ ] | |
| 2.2.9 | Repeat steps 2.2.2-2.2.8 for "Test Branch Milwaukee" (Milwaukee, WI) | Third branch created | [ ] | [ ] | |
| 2.2.10 | Repeat for "Test Branch Atlanta" (Atlanta, GA) with Scope: "Regional" | Fourth branch created | [ ] | [ ] | |

---

## Section 3: Hierarchy Display - Parent View

### 3.1 Branch Locations Section
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 3.1.1 | Navigate to "Test Parent Corp" edit view | Edit view loads | [ ] | [ ] | |
| 3.1.2 | Locate "Branch Locations" card in sidebar | Card visible with Store icon | [ ] | [ ] | |
| 3.1.3 | Verify badge shows "4 Branches" | Badge displays correct count | [ ] | [ ] | |
| 3.1.4 | Verify first 3 branches visible | Chicago, Detroit, Milwaukee visible (alpha order) | [ ] | [ ] | |
| 3.1.5 | Verify each branch shows city/state | Location info displayed (e.g., "Chicago, IL") | [ ] | [ ] | |
| 3.1.6 | Verify organization type badge on each | "distributor" badge visible | [ ] | [ ] | |
| 3.1.7 | Click "Show all 4 branches" link | All 4 branches now visible including Atlanta | [ ] | [ ] | |
| 3.1.8 | Click "Show less" link | Returns to showing 3 branches | [ ] | [ ] | |

### 3.2 Branch Navigation Links
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 3.2.1 | Click "Test Branch Chicago" link | Navigates to Chicago branch edit view | [ ] | [ ] | |
| 3.2.2 | Verify URL changed | URL shows `/organizations/{id}` for Chicago branch | [ ] | [ ] | |
| 3.2.3 | Navigate back to "Test Parent Corp" | Parent org edit view loads | [ ] | [ ] | |

---

## Section 4: Hierarchy Display - Branch View

### 4.1 Parent Organization Section
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 4.1.1 | Navigate to "Test Branch Chicago" edit view | Edit view loads | [ ] | [ ] | |
| 4.1.2 | Locate "Organization Hierarchy" card in sidebar | Card visible with Building2 icon | [ ] | [ ] | |
| 4.1.3 | Verify "Parent Organization" label | Label displays | [ ] | [ ] | |
| 4.1.4 | Verify "Test Parent Corp" link visible | Parent name displayed as clickable link | [ ] | [ ] | |
| 4.1.5 | Click "Test Parent Corp" link | Navigates to parent org edit view | [ ] | [ ] | |
| 4.1.6 | Navigate back to "Test Branch Chicago" | Branch edit view loads | [ ] | [ ] | |

### 4.2 Sister Branches Section
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 4.2.1 | Locate "Sister Branches" section in hierarchy card | Section visible below parent | [ ] | [ ] | |
| 4.2.2 | Verify badge shows "3" (3 siblings) | Badge displays correct sibling count | [ ] | [ ] | |
| 4.2.3 | Verify siblings listed: Detroit, Milwaukee, Atlanta | All 3 sister branches visible | [ ] | [ ] | |
| 4.2.4 | Verify city/state shown for each sister | Location info displayed | [ ] | [ ] | |
| 4.2.5 | Click "Test Branch Detroit" link | Navigates to Detroit branch edit view | [ ] | [ ] | |
| 4.2.6 | Verify Detroit shows Chicago as sister | Reciprocal relationship confirmed | [ ] | [ ] | |

### 4.3 Sister Branch Expansion (if > 3 sisters)
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 4.3.1 | Note: With 4 branches, one sibling may be hidden | If hidden, "Show all" link appears | [ ] | [ ] | |
| 4.3.2 | If present, click "Show all X sister branches" | All siblings visible | [ ] | [ ] | |
| 4.3.3 | Click "Show less" | Returns to truncated view | [ ] | [ ] | |

---

## Section 5: Org Scope & Operating Entity Fields

### 5.1 Scope Dropdown Functionality
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 5.1.1 | Open "Test Branch Chicago" edit view | Edit view loads | [ ] | [ ] | |
| 5.1.2 | Expand "Organization Hierarchy" section in form | Section expands | [ ] | [ ] | |
| 5.1.3 | Click Scope dropdown | Dropdown opens | [ ] | [ ] | |
| 5.1.4 | Verify 3 options available | National, Regional, Local visible | [ ] | [ ] | |
| 5.1.5 | Select "Regional" | Dropdown shows Regional | [ ] | [ ] | |
| 5.1.6 | Verify helper text | "National = brand/HQ, Regional = operating company" | [ ] | [ ] | |
| 5.1.7 | Click Save | Changes saved successfully | [ ] | [ ] | |
| 5.1.8 | Refresh page | Scope still shows "Regional" | [ ] | [ ] | |
| 5.1.9 | Change back to "Local" and save | Restore original value | [ ] | [ ] | |

### 5.2 Operating Entity Toggle
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 5.2.1 | Locate "This location processes orders" checkbox | Checkbox visible in hierarchy section | [ ] | [ ] | |
| 5.2.2 | Verify helper text below checkbox | ON/OFF explanation visible | [ ] | [ ] | |
| 5.2.3 | Uncheck the checkbox | Checkbox becomes unchecked (OFF) | [ ] | [ ] | |
| 5.2.4 | Save changes | Form saves successfully | [ ] | [ ] | |
| 5.2.5 | Refresh page | Checkbox still unchecked | [ ] | [ ] | |
| 5.2.6 | Re-check the checkbox and save | Restore original value | [ ] | [ ] | |

---

## Section 6: Edge Cases - Self-Reference Prevention

### 6.1 Cannot Set Organization as Its Own Parent
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 6.1.1 | Open "Test Branch Chicago" edit view | Edit view loads | [ ] | [ ] | |
| 6.1.2 | Expand "Organization Hierarchy" section | Section expands | [ ] | [ ] | |
| 6.1.3 | Click Parent Organization autocomplete | Autocomplete opens | [ ] | [ ] | |
| 6.1.4 | Type "Test Branch Chicago" | Search for current org | [ ] | [ ] | |
| 6.1.5 | Verify current org NOT in dropdown | Self should be excluded from options | [ ] | [ ] | |

**Expected Behavior:** The ParentOrganizationInput component filters out the current organization from the autocomplete results using `id@neq` filter.

---

## Section 7: Edge Cases - Cycle Prevention

### 7.1 Cannot Create Circular Reference
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 7.1.1 | Open "Test Parent Corp" edit view | Edit view loads | [ ] | [ ] | |
| 7.1.2 | Expand "Organization Hierarchy" section | Section expands | [ ] | [ ] | |
| 7.1.3 | Click Parent Organization autocomplete | Autocomplete opens | [ ] | [ ] | |
| 7.1.4 | Select "Test Branch Chicago" as parent | Chicago selected (attempting A→B→A cycle) | [ ] | [ ] | |
| 7.1.5 | Click Save | Should show error | [ ] | [ ] | |
| 7.1.6 | Verify error message about circular reference | Database trigger prevents save | [ ] | [ ] | |

**Expected Behavior:** The `check_organization_cycle()` database trigger detects the cycle and raises an exception with message "Circular reference detected in organization hierarchy".

---

## Section 8: Edge Cases - Parent Deletion Protection

### 8.1 Cannot Delete Parent with Active Branches
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 8.1.1 | Navigate to "Test Parent Corp" edit view | Edit view loads | [ ] | [ ] | |
| 8.1.2 | Look for Delete button | Delete action visible | [ ] | [ ] | |
| 8.1.3 | Click Delete | Confirmation dialog appears | [ ] | [ ] | |
| 8.1.4 | Confirm deletion | Should show error | [ ] | [ ] | |
| 8.1.5 | Verify error message | "Cannot delete organization with active branches" | [ ] | [ ] | |

**Expected Behavior:** The `prevent_parent_organization_deletion()` trigger blocks deletion when `child_branch_count > 0` in the organizations_summary view.

---

## Section 9: List View Verification

### 9.1 Parent Column Display
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 9.1.1 | Navigate to Organizations list | List view loads | [ ] | [ ] | |
| 9.1.2 | Locate "Parent" column header (4th column) | Column visible on desktop | [ ] | [ ] | |
| 9.1.3 | Find "Test Branch Chicago" row | Row visible in list | [ ] | [ ] | |
| 9.1.4 | Verify Parent column shows "Test Parent Corp" | Parent name displayed | [ ] | [ ] | |
| 9.1.5 | Click "Test Parent Corp" in Parent column | Navigates to parent org | [ ] | [ ] | |

### 9.2 Tablet View
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 9.2.1 | Resize browser to iPad width (768px) | Viewport changes | [ ] | [ ] | |
| 9.2.2 | Check if Parent column hidden | Column may be hidden on tablet | [ ] | [ ] | Acceptable behavior |

---

## Section 10: Cleanup

### 10.1 Delete Test Data
| Step | Action | Expected Result | Pass | Fail | Notes |
|------|--------|-----------------|------|------|-------|
| 10.1.1 | Navigate to "Test Branch Chicago" | Edit view loads | [ ] | [ ] | |
| 10.1.2 | Delete "Test Branch Chicago" | Deletion succeeds | [ ] | [ ] | |
| 10.1.3 | Delete "Test Branch Detroit" | Deletion succeeds | [ ] | [ ] | |
| 10.1.4 | Delete "Test Branch Milwaukee" | Deletion succeeds | [ ] | [ ] | |
| 10.1.5 | Delete "Test Branch Atlanta" | Deletion succeeds | [ ] | [ ] | |
| 10.1.6 | Delete "Test Parent Corp" | Now succeeds (no children) | [ ] | [ ] | |
| 10.1.7 | Verify all test orgs removed from list | Clean state restored | [ ] | [ ] | |

---

## Test Summary

| Section | Tests Passed | Tests Failed | Notes |
|---------|-------------|--------------|-------|
| 1. Create Parent | ___ / 10 | | |
| 2. Create Branches | ___ / 20 | | |
| 3. Parent View | ___ / 11 | | |
| 4. Branch View | ___ / 12 | | |
| 5. Scope/Entity | ___ / 12 | | |
| 6. Self-Reference | ___ / 5 | | |
| 7. Cycle Prevention | ___ / 6 | | |
| 8. Deletion Protection | ___ / 5 | | |
| 9. List View | ___ / 7 | | |
| 10. Cleanup | ___ / 7 | | |
| **TOTAL** | ___ / 95 | | |

---

## UI Element Reference (for debugging)

| Element | Semantic Selector |
|---------|------------------|
| Create button | `getByRole('button', { name: /create/i })` |
| Parent Organization input | `getByLabel(/parent organization/i)` |
| Scope dropdown | `getByLabel(/scope/i)` |
| Operating entity checkbox | `getByLabel(/this location processes orders/i)` |
| Name input | `getByLabel(/name/i)` |
| Branch Locations card | `getByText('Branch Locations')` |
| Organization Hierarchy card | `getByText('Organization Hierarchy')` |
| Show all link | `getByText(/show all/i)` |
| Add Branch button | `getByRole('button', { name: /add branch/i })` |

---

## Known Issues / Limitations

1. **Tablet viewport:** Parent column may be hidden on iPad - this is expected behavior
2. **Cycle detection:** Error message comes from database trigger, may appear as generic API error
3. **Deletion protection:** Same as above - trigger error surfaces through API

---

**Tester Name:** ___________________
**Date Tested:** ___________________
**Environment:** ___________________
**Build/Version:** ___________________
