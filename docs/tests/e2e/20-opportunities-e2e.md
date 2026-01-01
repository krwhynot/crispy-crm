# Opportunities Module - Manual E2E Test Checklist

Comprehensive manual testing checklist for the Opportunities module using Claude for Chrome. This document covers all views, forms, and features of the Opportunities resource.

## Test Environment Setup

**Environment Selection:**
| Environment | Base URL | Credentials |
|-------------|----------|-------------|
| Local | http://localhost:5173 | admin@test.com / password123 |
| Production | https://crm.kjrcloud.com | [production credentials] |

**Claude Chrome Commands:**
- Local: "Run opportunities tests against localhost:5173"
- Production: "Run opportunities tests against crm.kjrcloud.com"

### Viewports

| Device | Dimensions | Notes |
|--------|------------|-------|
| Desktop | 1440px+ width | Primary testing viewport |
| iPad Landscape | 1024x768 | Field sales use case |
| iPad Portrait | 768x1024 | Field sales use case |

### Test Data Naming Convention

Use timestamps for uniqueness: `Test Opportunity YYYY-MM-DD-HHmmss`
Example: `Test Opportunity 2025-12-31-143022`

### Seed Data References

- **Organization (Customer/Prospect):** MFB Consulting
- **Organization (Principal):** Any principal from dropdown
- **Opportunity Name Example:** Ryan Wabeke
- **Contact:** Hancotte (from seed data)
- **Account Manager:** Admin user

---

## Section 1: CRUD Operations

### Test 1.1: Create Opportunity - Wizard Happy Path

**Objective:** Verify the 4-step wizard creates an opportunity successfully.

**URL:** `${BASE_URL}/#/opportunities/create`

**Steps:**

1. Navigate to Opportunities list (`/#/opportunities`)
2. Click the Speed Dial FAB (bottom-right + button)
3. Click "Full Form" from the speed dial menu
4. Wait for the Create Opportunity wizard to load

**Step 1 - Basic Information:**
5. Enter Name: `Test Opportunity [timestamp]`
6. Select Customer Organization: Search for "MFB" and select
7. Select Principal Organization: Select any principal from dropdown
8. Click "Next" button

**Step 2 - Pipeline & Team:**
9. Verify Stage defaults to "New Lead"
10. Verify Priority defaults to "Medium"
11. Verify Est. Close Date defaults to 30 days from now
12. Select Account Manager: Admin
13. Click "Next" button

**Step 3 - Contacts & Products:**
14. Select at least one Contact from the dropdown
15. Optionally add Products (not required)
16. Click "Next" button

**Step 4 - Additional Details:**
17. Optionally fill in Campaign, Notes, Description
18. Click "Create Opportunity" button

**Expected Results:**

- [ ] Wizard loads with progress bar at top
- [ ] Step indicator shows 4 steps with labels
- [ ] Step 1: Name, Customer, Principal fields visible
- [ ] Step 2: Stage, Priority, Est. Close Date, Account Manager fields visible
- [ ] Step 3: Contacts and Products selectors visible
- [ ] Step 4: Campaign, Notes, Description fields visible
- [ ] Form submits successfully
- [ ] Redirects to opportunity show page
- [ ] Success notification appears: "Opportunity created successfully"
- [ ] No console errors (check DevTools)
- [ ] No RLS policy violations in console

---

### Test 1.2: Create Opportunity - Required Field Validation

**Objective:** Verify form validation prevents submission without required fields.

**Steps:**

1. Navigate to `/#/opportunities/create`
2. Leave Name field empty
3. Attempt to proceed to Step 2 (click "Next")
4. Observe validation behavior
5. Fill in Name, but leave Customer Organization empty
6. Attempt to proceed
7. Observe validation behavior

**Expected Results:**

- [ ] Form displays error message for empty Name field
- [ ] Form displays error message for empty Customer Organization
- [ ] Cannot proceed to next step without required fields
- [ ] Error messages are descriptive and clear
- [ ] Focus moves to first error field (WCAG 3.3.1)

---

### Test 1.3: Read/List - OpportunityList Views

**Objective:** Verify all 4 display modes render correctly.

**URL:** `${BASE_URL}/#/opportunities`

**Steps:**

1. Navigate to Opportunities list
2. Locate the View Switcher (top-right, 4 toggle buttons)
3. Click each view mode button and verify content:
   - Kanban (grid icon)
   - List (list icon)
   - Campaign (folder icon)
   - Principal (factory icon)

**Expected Results:**

- [ ] Kanban view: Shows pipeline columns with cards
- [ ] List view: Shows tabular data with rows
- [ ] Campaign view: Groups opportunities by campaign field
- [ ] Principal view: Groups opportunities by principal organization
- [ ] View preference persists after page refresh (localStorage)
- [ ] View switcher shows active state for current view
- [ ] Touch targets are 44x44px minimum

---

### Test 1.4: Update Opportunity - Edit Form

**Objective:** Verify opportunities can be edited via the Edit page.

**Steps:**

1. Navigate to `/#/opportunities`
2. Click on an existing opportunity card/row to open slide-over
3. Click "Edit" button in slide-over header
4. Modify the Name field: Append " - Updated"
5. Change Priority to "High"
6. Click "Save" button

**Expected Results:**

- [ ] Edit form loads with current opportunity data
- [ ] All fields are editable
- [ ] Save button submits the form
- [ ] Success notification appears
- [ ] Returns to view mode with updated data
- [ ] No console errors or RLS violations

---

### Test 1.5: Delete Opportunity

**Objective:** Verify opportunity soft-delete functionality.

**Steps:**

1. Navigate to `/#/opportunities`
2. Open an opportunity in the slide-over
3. Click "Edit" to enter edit mode
4. Locate and click the "Delete" button
5. Confirm deletion in the dialog

**Expected Results:**

- [ ] Delete confirmation dialog appears
- [ ] Opportunity is removed from list (soft-deleted)
- [ ] Slide-over closes automatically
- [ ] Success notification appears
- [ ] Opportunity does not appear in main list
- [ ] No console errors

---

## Section 2: Kanban Board Tests

### Test 2.1: Kanban Drag-Drop Stage Transition (Non-Close)

**Objective:** Verify drag-and-drop moves opportunities between stages.

**Prerequisites:** At least one opportunity in "New Lead" stage.

**Steps:**

1. Navigate to `/#/opportunities` (ensure Kanban view)
2. Locate an opportunity card in "New Lead" column
3. Click and hold the card (or use the drag handle)
4. Drag the card to "Initial Outreach" column
5. Release the card

**Expected Results:**

- [ ] Card visually lifts when dragging starts (DragOverlay)
- [ ] Columns highlight when card hovers over them
- [ ] Card drops into destination column
- [ ] Stage updates immediately (optimistic UI)
- [ ] Success notification: "Moved to Initial Outreach"
- [ ] No console errors

---

### Test 2.2: Kanban Drag-Drop to Closed Won (Modal Required)

**Objective:** Verify dropping to Closed Won triggers win reason modal.

**Steps:**

1. Locate an opportunity card in any non-closed stage
2. Drag the card to "Closed Won" column
3. Release the card
4. Observe the CloseOpportunityModal that appears
5. Select a win reason from dropdown (e.g., "Product Quality/Fit")
6. Click "Confirm" button

**Expected Results:**

- [ ] CloseOpportunityModal appears with win reason dropdown
- [ ] Modal title indicates "Closing as Won"
- [ ] Win reason dropdown shows all options
- [ ] Cannot confirm without selecting a reason
- [ ] Card moves to Closed Won after confirmation
- [ ] Success notification appears

---

### Test 2.3: Kanban Drag-Drop to Closed Lost (Modal Required)

**Objective:** Verify dropping to Closed Lost triggers loss reason modal.

**Steps:**

1. Locate an opportunity card in any non-closed stage
2. Drag the card to "Closed Lost" column
3. Release the card
4. Observe the CloseOpportunityModal that appears
5. Select a loss reason from dropdown (e.g., "Price Too High")
6. Click "Confirm" button

**Expected Results:**

- [ ] CloseOpportunityModal appears with loss reason dropdown
- [ ] Modal title indicates "Closing as Lost"
- [ ] Loss reason dropdown shows all options
- [ ] Cannot confirm without selecting a reason
- [ ] Card moves to Closed Lost after confirmation

---

### Test 2.4: Kanban Close Modal Cancel - Revert Position

**Objective:** Verify canceling the close modal reverts the card position.

**Steps:**

1. Locate an opportunity card
2. Drag the card to "Closed Won" column
3. When modal appears, click "Cancel" or press Escape
4. Observe card position

**Expected Results:**

- [ ] Card returns to original column
- [ ] No stage change persisted
- [ ] Toast notification: "Stage change cancelled"
- [ ] Modal closes cleanly

---

### Test 2.5: Kanban Close Modal - Other Reason Requires Notes

**Objective:** Verify "Other" reason requires close_reason_notes.

**Steps:**

1. Drag an opportunity to "Closed Won"
2. Select "Other (specify)" from win reason dropdown
3. Attempt to confirm without entering notes
4. Enter notes in the text field
5. Confirm

**Expected Results:**

- [ ] Error message appears: "Please specify the reason in notes when selecting 'Other'"
- [ ] Notes text field is visible when "Other" selected
- [ ] Cannot confirm without notes when "Other" is selected
- [ ] Submission succeeds after entering notes

---

### Test 2.6: Kanban Column Collapse/Expand

**Objective:** Verify stage columns can be collapsed.

**Steps:**

1. Navigate to Kanban view
2. Find the collapse button on a column header
3. Click to collapse
4. Verify column is collapsed
5. Click to expand
6. Verify column is expanded

**Expected Results:**

- [ ] Column collapses to show only header/count
- [ ] Column expands to show all cards
- [ ] Preference persists in localStorage
- [ ] Works for all columns

---

### Test 2.7: Kanban Column Visibility Settings

**Objective:** Verify column visibility can be customized.

**Steps:**

1. Navigate to Kanban view
2. Scroll right to find the Settings button (gear icon)
3. Click the Settings button
4. Toggle visibility of a stage column
5. Observe the board

**Expected Results:**

- [ ] Settings menu shows all 7 stages
- [ ] Toggle switches control column visibility
- [ ] Hidden columns disappear from board
- [ ] "Collapse All" and "Expand All" buttons work
- [ ] "Reset" restores default visibility

---

## Section 3: Quick Add Dialog Tests

### Test 3.1: Quick Add - Open Dialog via Speed Dial

**Objective:** Verify Quick Add dialog opens from Speed Dial FAB.

**Steps:**

1. Navigate to `/#/opportunities`
2. Click the Speed Dial FAB (+ button, bottom-right)
3. Click "Quick Add" option
4. Observe the dialog

**Expected Results:**

- [ ] Speed Dial menu fans out upward
- [ ] "Quick Add" and "Full Form" options visible
- [ ] Dialog opens with title "Quick Add Booth Visitor"
- [ ] Form has sections: Pre-filled, Contact Info, Organization, Optional Details

---

### Test 3.2: Quick Add - Minimal Valid Submission

**Objective:** Verify Quick Add creates opportunity with minimal required fields.

**Test Data:**
- First Name: `Test`
- Last Name: `User [timestamp]`
- Phone: `555-123-4567`
- Organization Name: `Test Org [timestamp]`
- City: `Chicago` (select from dropdown)
- Principal: Select any principal

**Steps:**

1. Open Quick Add dialog
2. Select a Principal from dropdown
3. Enter First Name
4. Enter Last Name
5. Enter Phone number
6. Enter Organization Name
7. Select City from dropdown (auto-fills State)
8. Click "Save & Close"

**Expected Results:**

- [ ] Form submits successfully
- [ ] Dialog closes
- [ ] Success notification appears
- [ ] New opportunity appears in Kanban board (New Lead column)
- [ ] Contact and Organization created automatically

---

### Test 3.3: Quick Add - Save and Add Another

**Objective:** Verify "Save & Add Another" keeps dialog open and resets form.

**Steps:**

1. Open Quick Add dialog
2. Fill in all required fields (Principal, Contact info, Org info)
3. Click "Save & Add Another" button
4. Observe form behavior

**Expected Results:**

- [ ] Form submits successfully
- [ ] Dialog remains open
- [ ] Form resets but keeps Campaign and Principal
- [ ] Focus moves to First Name field
- [ ] Success notification appears
- [ ] Can immediately enter another lead

---

### Test 3.4: Quick Add - Phone or Email Required

**Objective:** Verify at least one of Phone or Email is required.

**Steps:**

1. Open Quick Add dialog
2. Fill in all required fields EXCEPT Phone and Email
3. Click "Save & Close"
4. Observe validation

**Expected Results:**

- [ ] Form shows validation error
- [ ] Message: "Phone or Email required (at least one)"
- [ ] Form does not submit
- [ ] Adding either Phone OR Email allows submission

---

### Test 3.5: Quick Add - Product Filtering by Principal

**Objective:** Verify products dropdown filters by selected principal.

**Steps:**

1. Open Quick Add dialog
2. Select Principal A from dropdown
3. Observe available products
4. Change Principal to Principal B
5. Observe available products

**Expected Results:**

- [ ] Products dropdown shows message before principal selected
- [ ] Products populate after principal selected
- [ ] Products change when principal changes
- [ ] Products are specific to selected principal

---

## Section 4: View Mode Tests

### Test 4.1: View Switcher - All 4 Modes

**Objective:** Verify all 4 view modes work correctly.

**Steps:**

1. Navigate to `/#/opportunities`
2. Test each view mode:

**Kanban View:**
- [ ] Pipeline columns display (7 stages)
- [ ] Cards show principal, customer, days in stage
- [ ] Drag-drop enabled

**List View:**
- [ ] Tabular layout with sortable columns
- [ ] Row click opens slide-over
- [ ] Pagination at bottom

**Campaign View:**
- [ ] Grouped by campaign field
- [ ] Expandable/collapsible groups
- [ ] Opportunities with no campaign in "Uncategorized"

**Principal View:**
- [ ] Grouped by principal organization
- [ ] Expandable/collapsible groups
- [ ] Principal name as group header

**Expected Results:**

- [ ] All 4 views render without errors
- [ ] Data is consistent across views
- [ ] View switcher shows active state

---

### Test 4.2: View Preference Persistence

**Objective:** Verify view mode persists across page refresh.

**Steps:**

1. Navigate to `/#/opportunities`
2. Switch to List view
3. Refresh the page (F5 or Ctrl+R)
4. Observe which view loads

**Expected Results:**

- [ ] List view persists after refresh
- [ ] localStorage key: `opportunity.view.preference`
- [ ] Value is one of: kanban, list, campaign, principal

---

## Section 5: Slide-Over Tests

### Test 5.1: Open Slide-Over from List

**Objective:** Verify slide-over opens on opportunity click.

**Steps:**

1. Navigate to `/#/opportunities` (any view)
2. Click on an opportunity card/row
3. Observe the slide-over panel

**Expected Results:**

- [ ] Slide-over opens from right side (40vw width)
- [ ] URL updates with `?view=[id]` parameter
- [ ] Panel shows opportunity name in header
- [ ] 4 tabs visible: Details, Contacts, Products, Notes
- [ ] Edit and Close buttons in header

---

### Test 5.2: Slide-Over Details Tab - View Mode

**Objective:** Verify Details tab displays opportunity information.

**Steps:**

1. Open slide-over for an opportunity
2. Ensure Details tab is active
3. Review all displayed information

**Expected Results:**

- [ ] Overview section: Name, Description
- [ ] Status section: Stage badge, Priority badge
- [ ] Win/Loss reason shown for closed opportunities
- [ ] Timeline section: Lead Source, Est. Close Date
- [ ] Workflow section (if data exists): Campaign, Notes, Next Action
- [ ] Organizations section: Customer, Principal, Distributor cards
- [ ] Metadata: Created/Updated timestamps

---

### Test 5.3: Slide-Over Details Tab - Edit Mode

**Objective:** Verify Details tab edit functionality.

**Steps:**

1. Open slide-over for an opportunity
2. Click "Edit" button in header
3. Modify several fields
4. Click "Save" (submit button in footer)

**Expected Results:**

- [ ] Form fields become editable
- [ ] All fields have appropriate inputs (text, select, date)
- [ ] Organization dropdowns allow inline creation
- [ ] Save button submits changes
- [ ] Success notification appears
- [ ] Returns to view mode with updated data

---

### Test 5.4: Slide-Over Contacts Tab

**Objective:** Verify Contacts tab displays and manages contacts.

**Steps:**

1. Open slide-over for an opportunity
2. Click "Contacts" tab
3. Review displayed contacts
4. If in edit mode, add/remove a contact

**Expected Results:**

- [ ] Tab shows list of associated contacts
- [ ] Contact names are clickable (link to contact)
- [ ] Edit mode allows adding/removing contacts
- [ ] Contact count badge on tab (if applicable)

---

### Test 5.5: Slide-Over Products Tab

**Objective:** Verify Products tab displays and manages products.

**Steps:**

1. Open slide-over for an opportunity
2. Click "Products" tab
3. Review displayed products

**Expected Results:**

- [ ] Tab shows list of associated products
- [ ] Product names displayed
- [ ] Products linked to principal organization
- [ ] Edit mode allows managing products

---

### Test 5.6: Slide-Over Notes Tab

**Objective:** Verify Notes tab displays and allows note entry.

**Steps:**

1. Open slide-over for an opportunity
2. Click "Notes" tab
3. Review/add notes

**Expected Results:**

- [ ] Tab shows existing notes (if any)
- [ ] Note entry field visible
- [ ] Notes can be added in edit mode
- [ ] Notes persist after save

---

### Test 5.7: Slide-Over Close Button

**Objective:** Verify slide-over closes properly.

**Steps:**

1. Open slide-over for an opportunity
2. Click the X button in header
3. Alternatively, click outside the panel

**Expected Results:**

- [ ] Slide-over closes with animation
- [ ] URL updates to remove `?view=` parameter
- [ ] Main list remains visible
- [ ] No unsaved changes lost warning (if no edits)

---

## Section 6: Validation Edge Cases

### Test 6.1: Win Reason Required on Close Won

**Objective:** Verify win_reason is required when stage is closed_won.

**Steps:**

1. Open opportunity edit form (via slide-over or edit page)
2. Change Stage to "Closed Won"
3. Attempt to save without selecting win reason

**Expected Results:**

- [ ] CloseOpportunityModal appears (if via stage change)
- [ ] Or validation error for win_reason field
- [ ] Message: "Win reason is required when closing as won"
- [ ] Cannot save without win reason

---

### Test 6.2: Loss Reason Required on Close Lost

**Objective:** Verify loss_reason is required when stage is closed_lost.

**Steps:**

1. Open opportunity edit form
2. Change Stage to "Closed Lost"
3. Attempt to save without selecting loss reason

**Expected Results:**

- [ ] CloseOpportunityModal appears
- [ ] Or validation error for loss_reason field
- [ ] Message: "Loss reason is required when closing as lost"
- [ ] Cannot save without loss reason

---

### Test 6.3: Close Reason Notes Required for "Other"

**Objective:** Verify close_reason_notes is required when reason is "other".

**Steps:**

1. Close an opportunity with win_reason = "Other (specify)"
2. Leave close_reason_notes empty
3. Attempt to confirm

**Expected Results:**

- [ ] Validation error appears
- [ ] Message: "Please specify the reason in notes when selecting 'Other'"
- [ ] Cannot submit without notes

---

### Test 6.4: Contact IDs Skipped for Stage-Only Updates

**Objective:** Verify Kanban drag-drop does not require contact validation.

**Steps:**

1. Ensure an opportunity has contacts associated
2. Drag the opportunity to a different non-close stage
3. Observe the update behavior

**Expected Results:**

- [ ] Stage update succeeds without contact validation
- [ ] Contacts remain unchanged
- [ ] No "At least one contact is required" error

---

### Test 6.5: Duplicate Detection Warning

**Objective:** Verify warning for similar opportunities.

**Status:** SKIP - Fuzzy match detection is asynchronous and timing-sensitive for manual testing.

**Reason:** The SimilarOpportunitiesDialog uses Levenshtein distance (threshold: 3) which requires specific name patterns and timing to trigger reliably.

---

### Test 6.6: 30-Day Default Close Date

**Objective:** Verify estimated_close_date defaults to 30 days from now.

**Steps:**

1. Navigate to `/#/opportunities/create`
2. Proceed to Step 2 (Pipeline & Team)
3. Check the Est. Close Date field

**Expected Results:**

- [ ] Date is pre-filled
- [ ] Date is approximately 30 days from current date
- [ ] Field is editable

---

## Section 7: Viewport Testing

### Test 7.1: Desktop (1440px+)

**Steps:**

1. Set browser width to 1440px or wider
2. Navigate through all Opportunities views
3. Test create wizard, slide-over, Kanban

**Expected Results:**

- [ ] All layouts render correctly
- [ ] Slide-over is 40vw width
- [ ] Kanban columns are appropriately sized
- [ ] No horizontal overflow issues

---

### Test 7.2: iPad Landscape (1024x768)

**Steps:**

1. Use DevTools to set viewport to 1024x768
2. Navigate through all Opportunities views
3. Test touch interactions (simulated)

**Expected Results:**

- [ ] All views render correctly
- [ ] Touch targets are 44x44px minimum
- [ ] Slide-over is appropriately sized
- [ ] Kanban scrolls horizontally if needed

---

### Test 7.3: iPad Portrait (768x1024)

**Steps:**

1. Use DevTools to set viewport to 768x1024
2. Navigate through all Opportunities views
3. Test touch interactions

**Expected Results:**

- [ ] All views render correctly
- [ ] Views may stack or adjust layout
- [ ] Touch targets remain accessible
- [ ] Speed Dial FAB remains visible

---

## Section 8: Console Monitoring Checklist

For ALL tests, monitor the browser console for:

### Error Types to Watch

**RLS (Row Level Security) Errors:**
- Pattern: Contains "policy", "RLS", "permission denied", "42501"
- Severity: CRITICAL - indicates database access issues

**React Errors:**
- Pattern: Red console errors, stack traces
- Look for: "Uncaught", "React", hook violations

**Network Errors:**
- Pattern: 500, 403, 401 status codes in Network tab
- Check: API calls to Supabase

**TypeScript/Runtime Errors:**
- Pattern: "undefined is not a function", "Cannot read property"
- Severity: High - indicates code bugs

### Acceptable Console Output

- ResizeObserver loop errors (known browser quirk)
- React Admin development warnings
- Vite HMR messages

---

## Section 9: Pass Criteria

### Minimum Pass Requirements

All of the following must pass for the Opportunities module to be considered functional:

**Critical (Must Pass All):**
- [ ] Test 1.1: Create Opportunity - Wizard Happy Path
- [ ] Test 2.1: Kanban Drag-Drop Stage Transition (Non-Close)
- [ ] Test 2.2: Kanban Drag-Drop to Closed Won (Modal Required)
- [ ] Test 5.1: Open Slide-Over from List
- [ ] Test 5.2: Slide-Over Details Tab - View Mode
- [ ] Test 6.1: Win Reason Required on Close Won

**Important (Allow 1-2 failures):**
- [ ] Test 1.2: Required Field Validation
- [ ] Test 1.3: Read/List - OpportunityList Views
- [ ] Test 1.4: Update Opportunity - Edit Form
- [ ] Test 3.1-3.4: Quick Add Dialog Tests
- [ ] Test 4.1: View Switcher - All 4 Modes

**Nice to Have:**
- [ ] Test 2.6-2.7: Column Collapse/Visibility
- [ ] Test 7.1-7.3: Viewport Testing

### Failure Protocol

If any critical test fails:
1. Stop testing immediately
2. Document the exact failure with:
   - Steps that led to failure
   - Console errors (screenshot)
   - Network errors (if applicable)
   - Current URL
3. Report to development team
4. Do NOT proceed with remaining tests

---

## Notes

### Known Limitations

1. **Fuzzy Duplicate Detection:** The SimilarOpportunitiesDialog uses async Levenshtein matching which is unreliable for manual testing.

2. **Quick Add Product Filtering:** Requires principal selection before products load - this is by design, not a bug.

3. **Kanban Scroll:** May require horizontal scrolling on narrower viewports to see all 7 stage columns.

### Test Data Cleanup

After testing, consider cleaning up test data:
- Test opportunities can be soft-deleted via the Delete button
- Use naming convention prefix to identify test data

### Speed Dial Keyboard Navigation

The Speed Dial FAB supports:
- **Escape key:** Closes the menu
- **Tab:** Navigates between action buttons
- **Enter/Space:** Activates selected action

---

## Production Safety

**Safe for Production:**
- [ ] Read/List operations
- [ ] View operations (slide-over, details)
- [ ] Navigation tests
- [ ] Console monitoring

**Local Only (Skip in Production):**
- [ ] Create operations
- [ ] Update operations
- [ ] Delete operations
- [ ] Bulk operations
