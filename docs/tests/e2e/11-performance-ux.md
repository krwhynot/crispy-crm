# Performance & UX Validation Manual Checklist

Manual E2E testing checklist for performance metrics and user experience validation. This is TEST 6 (FINAL) of the progressive 6-test RBAC suite.

## Prerequisites

**Required:** Tests 1-5 of the RBAC suite must pass before running these tests.

### Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | password123 |
| Manager | manager@mfbroker.com | password123 |
| Rep | rep@mfbroker.com | password123 |

### Environment Setup

- **Browser:** Chrome (recommended for DevTools Performance features)
- **URL:** http://localhost:5173
- **DevTools:** Open with F12 before starting tests
- **Network Tab:** Enable "Preserve log" checkbox
- **Performance Tab:** Familiar with recording and markers

### Tools Required

1. **Browser DevTools** - Network throttling, Performance tab, Console
2. **Stopwatch/Timer** - For manual timing (phone timer or DevTools Performance)
3. **Keyboard** - For accessibility testing (no mouse during keyboard tests)

---

## Section A: Response Times

Performance benchmarks for critical user flows. All timings measured from user action to UI completion.

---

### Test A1: Team List Load Time (< 2 seconds)

**Goal:** Verify the sales team list loads within 2 seconds from navigation.

**Timing Method:** DevTools Performance tab or manual stopwatch

#### Steps

1. Open browser and navigate to http://localhost:5173
2. Open DevTools (F12) and switch to Network tab
3. Click "Clear" button in Network tab to clear existing requests
4. Check "Disable cache" checkbox in Network tab toolbar
5. Log in as admin user:
   - Email: `admin@test.com`
   - Password: `password123`
6. Wait for dashboard to load completely (no loading spinners visible)
7. Open DevTools Performance tab
8. Click the "Record" button (circle icon) to start recording
9. Navigate to `/#/sales` using the sidebar or direct URL
10. Watch the page for the team member list to appear
11. Click "Stop" in Performance tab when list is fully rendered (names visible)
12. Check the total time in the Performance recording summary
13. Verify the time from navigation start to list render is under 2 seconds

#### Expected Results

- [ ] Navigation to `/#/sales` completes without errors
- [ ] Team member list renders with names visible
- [ ] Total load time is less than 2 seconds (2000ms)
- [ ] No console errors during load (check Console tab)
- [ ] Network requests complete with 200 status codes

#### Performance Recording Analysis

In the Performance tab recording:
- Look for "Navigation" event as the start point
- Look for "First Contentful Paint" and "Largest Contentful Paint" markers
- Total time from navigation to LCP should be < 2000ms

#### Pass/Fail

- [ ] **PASS** - Load time < 2 seconds, no errors
- [ ] **FAIL** - Load time >= 2 seconds OR errors present

---

### Test A2: Create Form Opens (< 500ms)

**Goal:** Verify the create form modal/page opens within 500 milliseconds.

**Timing Method:** DevTools Performance tab with precise markers

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to `/#/sales` (sales team list)
3. Wait for the list to fully load (team members visible)
4. Open DevTools Performance tab
5. Click "Record" to start a new recording
6. Locate the "Create" or "Add Team Member" button in the UI
7. Note the exact moment you click the button (this is time zero)
8. Click the "Create" button
9. Watch for the create form to appear and become interactive
10. Click "Stop" in Performance tab immediately when form is fully visible
11. In the Performance recording, measure time from click event to form render
12. Verify the elapsed time is under 500 milliseconds

#### Expected Results

- [ ] Create button is visible and clickable
- [ ] Form opens smoothly without jank or stutter
- [ ] Form is fully rendered within 500ms of click
- [ ] All form fields are visible and interactive
- [ ] No console errors during form open

#### DevTools Timing Analysis

In the Performance recording:
- Find the "Click" event in the Main thread
- Measure to the next "Paint" or "Composite Layers" event
- This duration should be < 500ms

#### Pass/Fail

- [ ] **PASS** - Form opens in < 500ms, fields interactive
- [ ] **FAIL** - Form takes >= 500ms OR form does not render correctly

---

### Test A3: Save Operation Completes (< 2 seconds)

**Goal:** Verify saving a team member record completes within 2 seconds.

**Timing Method:** Measure from Save click to redirect/success indication

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to `/#/sales` (sales team list)
3. Click "Create" to open the create form
4. Fill in valid test data for a new team member:
   - Name: `Performance Test User [Timestamp]`
   - Email: `perf.test.[timestamp]@example.com` (use unique timestamp)
   - Role: Select "Rep"
   - Fill any other required fields
5. Open DevTools Network tab
6. Click "Clear" to clear existing requests
7. Open DevTools Console tab in a split view
8. Prepare to start timing (have stopwatch ready or note the time)
9. Click the "Save" or "Save & Close" button
10. Start timer immediately on click
11. Watch for one of these success indicators:
    - Redirect to list page (`/#/sales`)
    - Success toast notification appears
    - Form closes and list updates
12. Stop timer when success indicator appears
13. Verify total time is under 2 seconds

#### Expected Results

- [ ] Save button is clickable and responds to click
- [ ] Network request to save endpoint is sent (visible in Network tab)
- [ ] Network request completes with 200/201 status
- [ ] Success indicator appears (redirect, toast, or list update)
- [ ] Total time from click to success is < 2 seconds
- [ ] No error messages in Console or UI

#### Network Request Analysis

In Network tab, find the POST/PUT request:
- Request should be to a Supabase endpoint or API route
- Response status should be 200 or 201
- Response time shown in "Time" column should be reasonable (< 1500ms)

#### Pass/Fail

- [ ] **PASS** - Save completes in < 2 seconds with success indication
- [ ] **FAIL** - Save takes >= 2 seconds OR errors occur

---

### Test A4: Role Change Reflects Immediately (No Stale Cache)

**Goal:** Verify that role changes are reflected immediately without stale data.

**Cache Verification:** Ensure UI shows updated data, not cached previous state

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to `/#/sales` (sales team list)
3. Identify a team member with "Rep" role (or create one if needed)
4. Note the team member's current role displayed in the list
5. Click on the team member row to open the edit slide-over/modal
6. Wait for the edit form to fully load
7. Locate the "Role" dropdown/select field
8. Change the role from "Rep" to "Manager" (or vice versa)
9. Click "Save" and wait for save to complete
10. Close the slide-over/modal (click X or outside the panel)
11. Verify the list updates immediately to show the new role
12. IMMEDIATELY (within 2 seconds) click on the same team member again
13. Wait for the edit form to open
14. Check the Role field in the form

#### Expected Results

- [ ] Initial role is displayed correctly (e.g., "Rep")
- [ ] Role dropdown allows changing the value
- [ ] Save operation completes successfully
- [ ] List view updates immediately to show new role ("Manager")
- [ ] Re-opening edit form shows the NEW role ("Manager"), not old role ("Rep")
- [ ] No flash of old data when re-opening the form
- [ ] Console shows no cache-related warnings

#### Cache Invalidation Verification

This test specifically checks:
- React Query cache is invalidated on mutation
- No stale data is served from client-side cache
- Server returns fresh data on refetch

#### Pass/Fail

- [ ] **PASS** - Role change persists immediately, no stale cache
- [ ] **FAIL** - Old role shown after re-opening (stale cache) OR save fails

---

## Section B: UI Feedback

User interface responsiveness and feedback during operations.

---

### Test B1: Loading Spinner/Skeleton During Data Loads

**Goal:** Verify visual loading indicators appear during slow network conditions.

**Setup:** Use DevTools Network throttling to simulate slow connection

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to dashboard (`/#/`) and wait for full load
3. Open DevTools (F12)
4. Switch to Network tab
5. Locate the throttling dropdown (usually shows "No throttling" or "Online")
6. Select "Slow 3G" from the throttling options
7. Verify throttling is active (icon may appear in DevTools toolbar)
8. Clear the browser cache:
   - DevTools > Application tab > Storage > "Clear site data"
   - OR check "Disable cache" in Network tab
9. Navigate to `/#/sales` (sales team list)
10. IMMEDIATELY watch the page for loading indicators
11. Look for one of these loading states:
    - Spinning loader icon
    - Skeleton placeholder elements (gray animated boxes)
    - "Loading..." text
    - Progress bar
12. Continue watching until data loads completely
13. Verify loading indicator was visible during the load

#### Expected Results

- [ ] Loading indicator appears within 100ms of navigation
- [ ] Loading indicator is clearly visible (not too small or faint)
- [ ] Loading indicator persists until data is ready
- [ ] Loading indicator disappears when data renders
- [ ] No blank/empty page shown during load (always shows feedback)
- [ ] Page does not appear "frozen" during load

#### Types of Acceptable Loading Indicators

- **Spinner:** Animated circular or linear loading icon
- **Skeleton:** Gray placeholder shapes that pulse/animate
- **Progress Bar:** Horizontal bar showing load progress
- **Text:** "Loading team members..." or similar message

#### Cleanup

After test completion:
1. Set Network throttling back to "No throttling" or "Online"
2. Re-enable cache if you disabled it

#### Pass/Fail

- [ ] **PASS** - Loading indicator visible during slow load
- [ ] **FAIL** - No loading indicator OR blank screen during load

---

### Test B2: Success Toast Notification on Save

**Goal:** Verify a success message appears after saving a record.

**Notification Types:** Toast, snackbar, banner, or inline message

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to `/#/sales` (sales team list)
3. Click "Create" to open the create form
4. Fill in valid test data:
   - Name: `Toast Test User [Timestamp]`
   - Email: `toast.test.[timestamp]@example.com`
   - Role: Select any role
   - Fill any other required fields
5. Position your eyes to see the entire screen (toasts often appear in corners)
6. Click the "Save" or "Save & Close" button
7. IMMEDIATELY watch all screen corners and the form area for:
   - Toast notification (usually top-right or bottom-right)
   - Snackbar (usually bottom-center)
   - Banner message (top of page)
   - Inline success message near the form
8. Note the content of the success message
9. Note how long the message stays visible
10. Check if message is dismissible (X button or click-to-close)

#### Expected Results

- [ ] Success notification appears after save completes
- [ ] Notification text indicates success (e.g., "Team member created", "Saved successfully")
- [ ] Notification is clearly visible (good contrast, readable text)
- [ ] Notification appears within 1 second of save completion
- [ ] Notification auto-dismisses OR has manual dismiss option
- [ ] Notification does not block important UI elements

#### Toast Notification Standards

Per UX best practices:
- **Duration:** 3-5 seconds before auto-dismiss
- **Position:** Consistent location (usually corner)
- **Color:** Green or neutral for success (not red)
- **Action:** Optional "Undo" or "View" action button

#### Pass/Fail

- [ ] **PASS** - Success toast/notification appears with clear message
- [ ] **FAIL** - No notification OR notification is unclear/invisible

---

### Test B3: Error Message Displayed Clearly on Failure

**Goal:** Verify error messages are displayed visibly when operations fail.

**Test Method:** Trigger a validation or server error and verify feedback

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to `/#/sales` (sales team list)
3. Note an existing team member's email address from the list
4. Click "Create" to open the create form
5. Fill in test data with a DUPLICATE email:
   - Name: `Duplicate Test User`
   - Email: [Use the email you noted in step 3 - this should cause duplicate error]
   - Role: Select any role
   - Fill any other required fields
6. Open DevTools Console tab to monitor for errors
7. Click the "Save" or "Save & Close" button
8. Watch for error feedback in the UI:
   - Inline error message near the email field
   - Toast/snackbar error notification
   - Form-level error banner
   - Modal/dialog with error message
9. Read the error message content
10. Check if the error message explains WHAT went wrong
11. Check if the error message suggests HOW to fix it
12. Verify the error is NOT only in the console (must be visible in UI)

#### Expected Results

- [ ] Error message appears in the UI (not just console)
- [ ] Error message is clearly visible (good contrast, readable)
- [ ] Error message explains the problem (e.g., "Email already exists")
- [ ] Error message appears near the relevant field OR in a prominent location
- [ ] Form does NOT close or redirect on error (stays open for correction)
- [ ] User can correct the error and retry

#### Error Message Standards

Good error message characteristics:
- **Specific:** Tells user exactly what's wrong
- **Actionable:** Suggests how to fix the issue
- **Visible:** Uses appropriate color (red/destructive) and positioning
- **Accessible:** Has `role="alert"` for screen readers

#### Alternative Test (If Duplicate Check Fails)

If duplicate email doesn't trigger error:
1. Try submitting with invalid email format (e.g., "not-an-email")
2. Try submitting with empty required fields
3. Try submitting with very long text (> 255 characters)

#### Pass/Fail

- [ ] **PASS** - Clear error message displayed in UI
- [ ] **FAIL** - Error only in console OR message unclear/invisible

---

### Test B4: Confirmation Dialog for Destructive Actions

**Goal:** Verify destructive actions (delete) require confirmation before executing.

**Safety Check:** Prevents accidental data deletion

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to `/#/sales` (sales team list)
3. Identify a team member that can be deleted (preferably a test user)
4. If no deletable user exists, create one first:
   - Click "Create"
   - Name: `Delete Test User [Timestamp]`
   - Email: `delete.test.[timestamp]@example.com`
   - Role: Any role
   - Save the user
5. Click on the team member row to open the edit slide-over/modal
6. Wait for the form to fully load
7. Locate the "Delete" button (often at bottom of form or in action menu)
8. Note the button's appearance (should indicate destructive action - red or warning style)
9. Click the "Delete" button
10. WATCH for a confirmation dialog/modal to appear
11. Read the confirmation dialog content
12. Check for these elements in the dialog:
    - Warning message explaining what will happen
    - Name of the item being deleted
    - "Cancel" or "No" button
    - "Confirm" or "Delete" button
13. Click "Cancel" to abort the deletion
14. Verify the user is NOT deleted (still in list)

#### Expected Results

- [ ] Delete button is visible and clickable
- [ ] Delete button has destructive styling (red or warning color)
- [ ] Clicking Delete shows confirmation dialog BEFORE deleting
- [ ] Confirmation dialog has clear warning message
- [ ] Confirmation dialog shows what will be deleted
- [ ] Cancel button aborts the deletion
- [ ] Confirm button is required to proceed with deletion
- [ ] User remains in list after clicking Cancel

#### Confirmation Dialog Standards

Good confirmation dialog includes:
- **Title:** "Delete Team Member?" or similar
- **Message:** "This action cannot be undone. Are you sure you want to delete [Name]?"
- **Cancel:** Primary/neutral button to abort
- **Confirm:** Destructive/red button to proceed
- **Focus:** Cancel button should be focused by default (safer)

#### Additional Verification (If Cancel Works)

Optionally, verify the Confirm path:
1. Click Delete again
2. Click "Confirm" or "Delete" in the dialog
3. Verify the user IS deleted from the list
4. Verify a success message appears

#### Pass/Fail

- [ ] **PASS** - Confirmation dialog appears, Cancel aborts deletion
- [ ] **FAIL** - No confirmation dialog OR immediate deletion without confirmation

---

## Section C: Accessibility

Keyboard navigation and focus management for accessibility compliance.

---

### Test C1: Keyboard Navigation (Tab, Enter, Escape)

**Goal:** Verify all critical actions can be performed using only the keyboard.

**Setup:** DO NOT use the mouse during this test

#### Steps

1. Open browser and navigate to http://localhost:5173
2. Log in using keyboard only:
   - Press Tab to focus email field
   - Type: `admin@test.com`
   - Press Tab to focus password field
   - Type: `password123`
   - Press Tab to focus Sign In button
   - Press Enter to submit
3. Wait for dashboard to load
4. Navigate to sales team list using keyboard:
   - Press Tab repeatedly until sidebar navigation is focused
   - Use Arrow keys to navigate sidebar items
   - Press Enter on "Sales" or "Team" item
   - OR press Tab until you can type in URL bar, type `/#/sales`, press Enter
5. Once on `/#/sales`, test Tab navigation:
   - Press Tab to move focus to first interactive element
   - Continue pressing Tab and count the elements that receive focus
   - Verify focus moves in a logical order (left-to-right, top-to-bottom)
6. Test Enter key activation:
   - Tab to the "Create" button
   - Press Enter to open create form
   - Verify form opens
7. Test Escape key for closing:
   - With create form/slide-over open
   - Press Escape key
   - Verify form/slide-over closes
8. Test form navigation:
   - Open create form again (Tab to Create, press Enter)
   - Press Tab to navigate through form fields
   - Verify all inputs can be reached
   - Press Enter while in a text field (should NOT submit if there are more fields)
9. Test combobox/dropdown navigation:
   - Tab to a dropdown/select field (e.g., Role)
   - Press Enter or Space to open dropdown
   - Use Arrow Up/Down to navigate options
   - Press Enter to select an option
   - Press Escape to close without selecting (if opened)

#### Expected Results

- [ ] Login form fully navigable with Tab/Enter
- [ ] Dashboard and sidebar navigable with keyboard
- [ ] Sales team list reachable via keyboard navigation
- [ ] All interactive elements receive visible focus
- [ ] Focus order is logical (not jumping around randomly)
- [ ] Enter key activates buttons and links
- [ ] Escape key closes modals, slide-overs, and dropdowns
- [ ] Form fields navigable with Tab
- [ ] Dropdowns/selects operable with Arrow keys and Enter
- [ ] No keyboard traps (focus never gets stuck)

#### Focus Visibility Check

At each focused element, verify:
- Clear focus ring/outline is visible
- Focus indicator has sufficient contrast
- Focused element is clear (not hidden behind other elements)

#### Pass/Fail

- [ ] **PASS** - All critical actions possible with keyboard only
- [ ] **FAIL** - Any critical action requires mouse OR keyboard trap exists

---

### Test C2: Focus Management After Modal Close

**Goal:** Verify focus returns to the appropriate element after closing modals/dialogs.

**Focus Return:** Essential for screen reader users to maintain context

#### Steps

1. Log in as admin user if not already logged in
2. Navigate to `/#/sales` (sales team list)
3. Using keyboard, Tab to the "Create" button
4. Note that the "Create" button has focus (visible focus ring)
5. Press Enter to open the create form/slide-over
6. Wait for the form to fully open
7. Verify focus moved INTO the modal/slide-over:
   - Focus should be on the first focusable element in the form
   - OR focus should be on the modal container itself
8. Press Escape to close the modal/slide-over
9. IMMEDIATELY check where focus is now:
   - Look for the visible focus ring
   - It should be on or near the "Create" button that triggered the modal
10. Repeat test with different trigger:
    - Tab to a team member row in the list
    - Press Enter to open the edit slide-over
    - Wait for slide-over to open
    - Press Escape to close
    - Verify focus returns to the row that was clicked

#### Expected Results

- [ ] Focus moves into modal when modal opens
- [ ] Modal has focus trap (Tab cycles within modal only)
- [ ] Pressing Escape closes the modal
- [ ] After Escape, focus returns to the trigger element (Create button or row)
- [ ] Focus does NOT go to the top of the page
- [ ] Focus does NOT go to document body (invisible/no focus ring)
- [ ] Focus return is immediate (no delay)

#### Focus Return Logic

Expected behavior:
- Create button opens modal -> Close modal -> Focus returns to Create button
- Table row opens slide-over -> Close slide-over -> Focus returns to that row
- Action menu item opens dialog -> Close dialog -> Focus returns to action menu

#### DevTools Verification

To verify focus programmatically:
1. Open DevTools Console
2. After closing modal, type: `document.activeElement`
3. Verify the returned element is the expected trigger

#### Pass/Fail

- [ ] **PASS** - Focus returns to trigger element after modal close
- [ ] **FAIL** - Focus lost OR goes to wrong element

---

## Important Notes

### Network Throttling Instructions

To enable Slow 3G throttling in Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Find the throttling dropdown (shows "No throttling" by default)
4. Select "Slow 3G" from the list
5. The icon will indicate throttling is active

**Remember to disable throttling after Test B1!**

### Performance Tab Usage

For precise timing measurements:
1. Open DevTools (F12)
2. Go to Performance tab
3. Click the record button (circle icon)
4. Perform the action you're measuring
5. Click stop when action completes
6. Use the timeline to measure duration
7. Look for "Summary" panel showing total time

### Keyboard-Only Testing Tips

- Remove your mouse from reach to avoid temptation
- Use Shift+Tab to navigate backwards
- Use Space for checkboxes and buttons
- Use Arrow keys for radio buttons and some dropdowns
- Tab key never activates - only moves focus

### Timestamp Format for Test Data

Use format: `YYYY-MM-DD-HHmmss`
Example: `2025-12-26-143022`

This ensures unique test data across multiple test runs.

---

## Pass Criteria

**All 10 tests must pass** for the Performance & UX Validation suite to be considered successful.

### Section A: Response Times (4 tests)
- [ ] A1: Team list load < 2 seconds
- [ ] A2: Create form opens < 500ms
- [ ] A3: Save operation completes < 2 seconds
- [ ] A4: Role change reflects immediately (no stale cache)

### Section B: UI Feedback (4 tests)
- [ ] B1: Loading spinner/skeleton during data loads
- [ ] B2: Success toast notification on save
- [ ] B3: Error message displayed clearly on failure
- [ ] B4: Confirmation dialog for destructive actions

### Section C: Accessibility (2 tests)
- [ ] C1: Keyboard navigation (Tab, Enter, Escape)
- [ ] C2: Focus management after modal close

---

## Troubleshooting

### Test A1 Fails (Slow Load)

If team list takes > 2 seconds:
1. Check Network tab for slow requests
2. Look for large payloads in response
3. Check if database query is optimized (indexes)
4. Verify no N+1 query problem
5. Check for unnecessary re-renders in React DevTools

### Test B1 Fails (No Loading State)

If no loading indicator appears:
1. Component may not have loading state implemented
2. Check if React Query/data fetching shows `isLoading` state
3. Look for Suspense boundaries in code
4. Verify skeleton components exist

### Test C1 Fails (Keyboard Trap)

If focus gets stuck:
1. Identify which element traps focus
2. Check for `tabindex="-1"` that shouldn't be there
3. Look for JavaScript focus handlers that prevent Tab
4. Check modal/dialog for proper focus management

### Test C2 Fails (Focus Not Returned)

If focus doesn't return to trigger:
1. Check if modal component tracks trigger element
2. Look for `returnFocus` or similar prop on modal
3. Verify focus is not explicitly set elsewhere on close
4. Check for focus trap library configuration

---

## Related Documentation

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Admin Data Provider Documentation](https://marmelab.com/react-admin/DataProviderIntroduction.html)
- [Chrome DevTools Performance Guide](https://developer.chrome.com/docs/devtools/performance/)
- Project Accessibility Tests: `05-accessibility-tests.md`
- Form Testing: `04-form-tests.md`

---

## Test Completion Checklist

Before marking RBAC suite as complete:

- [ ] All 10 Performance & UX tests pass
- [ ] Screenshots captured for any failures
- [ ] Issues filed for any bugs discovered
- [ ] Network throttling disabled after testing
- [ ] Test data cleaned up (optional)
- [ ] Results documented in test log
