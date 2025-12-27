# E2E Performance & UX Validation - Manual Testing Checklist

## TEST 6 (FINAL) - RBAC Suite Performance & UX Validation

Manual E2E testing checklist for Performance and User Experience validation. This is the final test in the 6-test RBAC suite and validates that the application meets response time requirements, provides appropriate UI feedback, and supports keyboard accessibility.

## Prerequisites

**CRITICAL:** Tests 1-5 of the RBAC suite must pass before running these tests.

- **Browser:** Chrome (required for DevTools Network Throttling and Performance tab)
- **URL:** http://localhost:5173
- **Test Users:**
  - Admin: admin@test.com / password123
  - Manager: manager@mfbroker.com / password123
  - Rep: rep@mfbroker.com / password123
- **Tools Required:**
  - Browser DevTools (F12)
  - Stopwatch/timer (browser extension or physical)
  - Optional: Performance tab in DevTools for precise timing

---

## A. Response Times

### Test A1: Team List Load Under 2 Seconds

**Objective:** Verify the team/sales list loads completely within 2 seconds under normal network conditions.

**Prerequisites:**
- User is logged out
- Browser cache is cleared
- Network is NOT throttled (normal conditions)

**Steps:**

1. Open Chrome browser and press F12 to open DevTools
2. Navigate to the **Network** tab in DevTools
3. Check the "Disable cache" checkbox at the top of the Network panel
4. Ensure no network throttling is applied (dropdown should show "No throttling")
5. Navigate to http://localhost:5173 in the address bar
6. Log in with admin credentials:
   - Email: admin@test.com
   - Password: password123
7. Wait for the login to complete and dashboard to load
8. Prepare your stopwatch/timer (or note the time in Performance tab)
9. Click on "Sales" or navigate directly to `/#/sales` in the URL bar
10. Start the timer immediately when you press Enter or click
11. Watch the page content area for the data grid/list to appear
12. Stop the timer when:
    - The data grid header row is visible
    - At least one data row is visible (or "No results" message)
    - Loading spinners/skeletons have disappeared
13. Record the measured time

**Expected Results:**

- [ ] Page navigation initiates immediately (no frozen UI)
- [ ] Loading indicator appears during data fetch
- [ ] Team list is fully rendered within 2 seconds
- [ ] No console errors during load (check Console tab)
- [ ] Network requests complete successfully (check Network tab for 200 status codes)

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Measured load time: _____ seconds
```

---

### Test A2: Create Form Opens Under 500ms

**Objective:** Verify the create form opens and renders within 500 milliseconds.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- User is on the `/#/sales` list page
- Page has finished loading completely

**Steps:**

1. Ensure you are on the `/#/sales` page with the team list visible
2. Verify no loading spinners are present (page is fully loaded)
3. Open DevTools (F12) and navigate to the **Performance** tab
4. Click the circular "Record" button in the Performance tab to start recording
5. Locate the "Create" button in the UI (typically top-right of the list)
6. Prepare your stopwatch/timer
7. Click the "Create" button and simultaneously start your timer
8. Watch for the create form to appear (either full page or slide-over)
9. Stop the timer when:
    - Form container is visible
    - Form fields (inputs, labels) are rendered
    - Submit buttons are visible ("Save", "Cancel", etc.)
10. Click "Stop" in the Performance tab to end recording
11. In the Performance recording, expand the "Timings" section
12. Look for "First Contentful Paint" or measure the gap between click and form render
13. Record both stopwatch time and Performance tab measurements

**Expected Results:**

- [ ] Form opens immediately with no perceptible delay
- [ ] Form container appears within 500ms of clicking "Create"
- [ ] All form fields are rendered and visible
- [ ] No loading spinner visible on form open (form is pre-ready)
- [ ] Focus moves to first form field or form container

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Stopwatch time: _____ ms
Performance tab timing: _____ ms
```

---

### Test A3: Save Operation Completes Under 2 Seconds

**Objective:** Verify that saving a new record completes within 2 seconds.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- Create form is open and ready for input

**Steps:**

1. If not already on create form, click "Create" from the `/#/sales` list
2. Fill in all required form fields with valid test data:
   - Name: "Performance Test User"
   - Email: Use a unique email like `perftest-${Date.now()}@example.com`
   - Role: Select any valid role (e.g., "Rep")
   - Fill any other required fields as needed
3. Verify all required fields are filled (no validation errors visible)
4. Open DevTools (F12) and navigate to the **Network** tab
5. Clear the Network log by clicking the clear button (circle with line)
6. Prepare your stopwatch/timer
7. Locate the "Save" or "Save & Close" button
8. Click the Save button and simultaneously start your timer
9. Watch for the save operation to complete, indicated by:
    - Form closes or redirects
    - Success toast/notification appears
    - List view shows new record
10. Stop the timer when the success state is confirmed
11. Check the Network tab for the POST/PUT request that saved the data
12. Note the request timing (hover over the request to see timing breakdown)
13. Record the total time from click to confirmation

**Expected Results:**

- [ ] Save button becomes disabled or shows loading state during save
- [ ] Network request completes with 200/201 status code
- [ ] Total save operation (click to confirmation) is under 2 seconds
- [ ] Success feedback is displayed (toast, notification, or redirect)
- [ ] No console errors during save operation
- [ ] New record appears in the list (if redirected to list)

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Measured save time: _____ seconds
Network request time: _____ ms
```

---

### Test A4: Role Change Reflects Immediately (No Stale Cache)

**Objective:** Verify that updates to user data are immediately reflected without stale cache issues.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- At least one team member exists with "Rep" role
- User is on the `/#/sales` list page

**Steps:**

1. Navigate to `/#/sales` to view the team list
2. Identify a team member with the role "Rep" (note their name for reference)
3. Click on the team member row to open the edit slide-over or edit page
4. Wait for the edit form to fully load
5. Locate the "Role" field in the form
6. Verify the current role is displayed as "Rep"
7. Change the role from "Rep" to "Manager" using the dropdown/select
8. Click the "Save" or "Save & Close" button
9. Wait for the save operation to complete (success feedback appears)
10. Close the edit slide-over or navigate back to the list if redirected
11. IMMEDIATELY (within 2 seconds) click on the same team member again
12. Wait for the edit form to load
13. Check the "Role" field value
14. Verify it shows "Manager" (the updated value), NOT "Rep" (stale cache)

**Expected Results:**

- [ ] Initial role is correctly displayed as "Rep"
- [ ] Role change saves successfully (success feedback shown)
- [ ] Slide-over/edit form closes or redirects after save
- [ ] Upon re-opening the same record, role shows "Manager"
- [ ] No stale data is displayed (not showing old "Rep" value)
- [ ] List view also reflects the updated role (if visible in list columns)
- [ ] No browser refresh was needed to see the update

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Original role: _____
New role: _____
Role displayed on re-open: _____
```

---

## B. UI Feedback

### Test B1: Loading Spinner/Skeleton During Data Loads

**Objective:** Verify that a loading indicator is displayed while data is being fetched.

**Prerequisites:**
- User is logged out
- Browser cache is cleared

**Steps:**

1. Open Chrome browser and press F12 to open DevTools
2. Navigate to the **Network** tab in DevTools
3. Check the "Disable cache" checkbox
4. Click the "Network conditions" icon (or "No throttling" dropdown)
5. Select "Slow 3G" to simulate a slow network connection
6. Navigate to http://localhost:5173
7. Log in with admin credentials:
   - Email: admin@test.com
   - Password: password123
8. Wait for login to complete
9. Navigate to `/#/sales` in the URL bar
10. Immediately observe the page content area
11. Look for one of the following loading indicators:
    - Spinning icon/loader
    - Skeleton placeholders (gray animated boxes)
    - "Loading..." text message
12. Note what type of loading indicator appears
13. Wait for data to fully load (may take 5-10 seconds on Slow 3G)
14. Verify the loading indicator disappears when data is ready
15. Reset network throttling to "No throttling" before next test

**Expected Results:**

- [ ] Loading indicator appears within 100ms of navigation
- [ ] Loading indicator is clearly visible (not too small or faint)
- [ ] Loading indicator persists while data is loading
- [ ] Loading indicator disappears when data is ready
- [ ] No blank/white screen during loading
- [ ] No error state shown while loading is in progress

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Type of loading indicator: [ ] Spinner [ ] Skeleton [ ] Text [ ] Other: _____
Loading indicator visible: [ ] Yes [ ] No
```

---

### Test B2: Success Toast Notification on Save

**Objective:** Verify that a success notification appears after successfully saving data.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- User is on the `/#/sales` list page
- Network throttling is OFF (No throttling)

**Steps:**

1. Ensure you are on the `/#/sales` list page
2. Click the "Create" button to open the create form
3. Fill in all required fields with valid test data:
   - Name: "Toast Test User"
   - Email: `toast-test-${Date.now()}@example.com`
   - Role: Select any valid role
4. Click the "Save" or "Save & Close" button
5. IMMEDIATELY observe the screen for a notification/toast:
   - Top-right corner (common toast location)
   - Bottom-right corner (alternative location)
   - Top-center (alert banner style)
   - Within the form area (inline success message)
6. Note the content of the success message
7. Note how long the notification remains visible
8. Check if the notification auto-dismisses or requires manual close
9. If editing an existing record, repeat the test:
   - Open an existing team member
   - Make a small change (e.g., update phone number)
   - Save and observe for success notification

**Expected Results:**

- [ ] Success notification/toast appears after save
- [ ] Notification is clearly visible (contrasting colors)
- [ ] Notification indicates success (green color, checkmark, or "Success" text)
- [ ] Notification message is meaningful (e.g., "User saved successfully")
- [ ] Notification appears within 1 second of save completing
- [ ] Notification either auto-dismisses (3-5 seconds) or has close button

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Notification location: [ ] Top-right [ ] Bottom-right [ ] Top-center [ ] Inline [ ] Other: _____
Notification text: "_____"
Auto-dismiss after: _____ seconds
```

---

### Test B3: Error Message Displayed Clearly on Failure

**Objective:** Verify that validation errors and server errors are displayed clearly to the user.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- At least one team member exists with a known email

**Steps:**

1. Navigate to `/#/sales` to view the team list
2. Note the email of an existing team member (e.g., "manager@mfbroker.com")
3. Click the "Create" button to open the create form
4. Fill in form fields but use the DUPLICATE email:
   - Name: "Duplicate Email Test"
   - Email: Use the existing email noted in step 2
   - Role: Select any valid role
5. Click the "Save" or "Save & Close" button
6. Observe the UI for error feedback:
   - Check for inline error message near email field
   - Check for toast/notification with error
   - Check for error banner at top of form
7. Note the exact error message text
8. Check DevTools Console for any console errors (F12 > Console)
9. Verify the error is user-friendly (not a stack trace or technical jargon)
10. Try another validation error: Clear the form and submit with empty required fields
11. Observe error messages for required field validation
12. Note which fields show error indicators (red border, error text)

**Expected Results:**

- [ ] Error message appears when duplicate email is submitted
- [ ] Error message is clearly visible (red color, warning icon, or error banner)
- [ ] Error message is descriptive (e.g., "Email already exists" not just "Error")
- [ ] Error is NOT only in the browser console (must be visible in UI)
- [ ] Required field errors show inline error messages
- [ ] Fields with errors have visual indicator (red border or icon)
- [ ] Error messages use `role="alert"` for accessibility (check in DevTools)

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Duplicate email error message: "_____"
Required field error message: "_____"
Error visibility: [ ] Toast [ ] Inline [ ] Banner [ ] Console only (FAIL)
```

---

### Test B4: Confirmation Dialog for Destructive Actions

**Objective:** Verify that destructive actions (like delete) require confirmation before executing.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- At least one team member exists that can be deleted (or use test data)

**Steps:**

1. Navigate to `/#/sales` to view the team list
2. Create a test record first (to safely delete):
   - Click "Create"
   - Fill in: Name: "Delete Test", Email: `delete-test-${Date.now()}@example.com`
   - Save the record
3. Navigate back to the list if not already there
4. Locate the newly created "Delete Test" record
5. Click on the record to open the edit slide-over or edit page
6. Locate the "Delete" button (may be in footer, header, or actions menu)
7. Click the "Delete" button
8. IMMEDIATELY observe the UI:
   - Check for confirmation dialog/modal
   - Check for confirmation prompt with Yes/No buttons
   - Check if the record was deleted immediately (NO confirmation = FAIL)
9. If a confirmation dialog appears:
   - Read the confirmation message
   - Note the button labels (e.g., "Cancel" / "Delete" or "No" / "Yes")
   - Click "Cancel" or "No" to abort the deletion
10. Verify the record still exists after canceling
11. Click "Delete" again and this time confirm the deletion
12. Verify the record is actually deleted

**Expected Results:**

- [ ] Confirmation dialog appears when Delete is clicked
- [ ] Confirmation dialog clearly states the action ("Delete this user?")
- [ ] Confirmation dialog has Cancel/Abort option
- [ ] Confirmation dialog has Confirm/Delete option
- [ ] Clicking Cancel does NOT delete the record
- [ ] Clicking Confirm DOES delete the record
- [ ] No accidental deletion without confirmation
- [ ] Confirmation uses clear, non-confusing button labels

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Confirmation dialog appeared: [ ] Yes [ ] No (FAIL)
Confirmation message: "_____"
Button labels: Cancel: "____" | Confirm: "____"
```

---

## C. Accessibility

### Test C1: Keyboard Navigation (Tab, Enter, Escape)

**Objective:** Verify that all interactive elements can be accessed and activated using only the keyboard.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- User is on the `/#/sales` list page
- MOUSE WILL NOT BE USED in this test (keyboard only)

**Steps:**

1. Navigate to `/#/sales` using the URL bar (you may use the mouse for this setup step only)
2. Click in an empty area of the page, then move hands to keyboard
3. From this point forward, DO NOT use the mouse
4. Press Tab key and observe which element receives focus
5. Continue pressing Tab and track each element that receives focus:
   - Navigation menu items
   - Create button
   - Search/filter inputs
   - Data grid rows or cells
   - Pagination controls (if present)
6. Count how many Tab presses it takes to reach the "Create" button
7. When "Create" button is focused, press Enter to activate it
8. Verify the create form opens
9. Inside the create form, press Tab to navigate through form fields:
   - Each input field should receive focus
   - Dropdown/select fields should be focusable
   - Save/Cancel buttons should be focusable
10. Press Escape key while in the form
11. Verify the form closes or the action is canceled
12. Verify focus returns to a logical element (trigger or list)
13. Navigate to the list and use Tab to focus a data row
14. Press Enter on the focused row to open edit slide-over
15. Press Escape to close the slide-over

**Expected Results:**

- [ ] Tab moves focus forward through interactive elements
- [ ] Shift+Tab moves focus backward through elements
- [ ] All buttons are focusable with Tab
- [ ] All form inputs are focusable with Tab
- [ ] Enter key activates focused buttons and links
- [ ] Escape key closes dialogs, slide-overs, and dropdowns
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] No keyboard traps (focus never gets stuck)
- [ ] Focus indicator (ring/outline) is visible on focused elements

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
Tab presses to reach Create button: _____
Elements NOT focusable: _____
Escape closes slide-over: [ ] Yes [ ] No
```

---

### Test C2: Focus Management After Modal Close

**Objective:** Verify that focus returns to the trigger element or a logical location after closing a modal or slide-over.

**Prerequisites:**
- User is logged in as admin (admin@test.com)
- User is on the `/#/sales` list page

**Steps:**

1. Navigate to `/#/sales` to view the team list
2. Use Tab key to navigate to the "Create" button
3. Verify the "Create" button has visible focus indicator (ring/outline)
4. Press Enter to open the create form/slide-over
5. Verify the form opens and focus moves into the form
6. Do NOT fill in any fields (keep form empty)
7. Press Escape key to close the form
8. IMMEDIATELY check which element has focus:
   - Press Tab once and observe where focus moves
   - This indicates where focus was after closing
9. Verify focus returned to the "Create" button (or nearby logical element)
10. Repeat the test with the edit slide-over:
    - Tab to a data row in the list
    - Press Enter to open the edit slide-over
    - Press Escape to close
    - Check which element now has focus
11. Document where focus lands after each close action

**Expected Results:**

- [ ] Create form opens when Enter is pressed on Create button
- [ ] Focus moves into the form when it opens
- [ ] Pressing Escape closes the form
- [ ] After closing create form, focus returns to Create button
- [ ] After closing edit slide-over, focus returns to the triggering row or nearby element
- [ ] Focus does NOT return to document body or get lost
- [ ] Focus indicator is immediately visible after close (no need to Tab first)

**Pass:** [ ] | **Fail:** [ ]

**Notes:**
```
After closing create form, focus on: "_____"
After closing edit slide-over, focus on: "_____"
Focus visible immediately: [ ] Yes [ ] No
```

---

## Pass Criteria

**All 10 tests must pass** for Performance & UX Validation to be considered successful.

### Summary Checklist

**A. Response Times:**
- [ ] A1: Team list loads in < 2 seconds
- [ ] A2: Create form opens in < 500ms
- [ ] A3: Save operation completes in < 2 seconds
- [ ] A4: Role change reflects immediately (no stale cache)

**B. UI Feedback:**
- [ ] B1: Loading spinner/skeleton visible during data loads
- [ ] B2: Success toast notification on save
- [ ] B3: Error message displayed clearly on failure
- [ ] B4: Confirmation dialog for destructive actions

**C. Accessibility:**
- [ ] C1: Keyboard navigation works (Tab, Enter, Escape)
- [ ] C2: Focus returns to trigger after modal close

---

## Troubleshooting

### Common Issues

**Test A1/A3 - Slow Response Times:**
- Check Network tab for slow API requests
- Look for N+1 query patterns (many small requests)
- Verify database has proper indexes
- Check for blocking JavaScript execution

**Test A4 - Stale Cache:**
- Check if React Query/SWR cache is properly invalidated
- Verify mutation hooks call `invalidateQueries` after save
- Look for manual cache management issues

**Test B1 - No Loading Indicator:**
- Check if `isLoading` state is properly used
- Verify loading component is not conditionally hidden
- Check for race conditions in state updates

**Test B3 - Error Only in Console:**
- Verify error boundary is catching errors
- Check if API error responses are properly handled
- Look for missing `.catch()` handlers on promises

**Test C1 - Keyboard Traps:**
- Check for improper `tabIndex` values
- Verify focus trap libraries are configured correctly
- Look for hidden elements receiving focus

---

## Tools Reference

**Performance Measurement:**
- Chrome DevTools Performance tab
- Lighthouse (built into Chrome DevTools)
- Network tab with timing breakdown

**Network Throttling:**
- DevTools > Network > Throttling dropdown
- Presets: Slow 3G, Fast 3G, Offline

**Accessibility Testing:**
- axe DevTools browser extension
- Tab key for focus testing
- Screen reader (optional): NVDA (Windows), VoiceOver (macOS)

---

## Test Completion

**Date:** _______________

**Tester:** _______________

**Environment:**
- Browser: Chrome Version _____
- OS: _____
- Screen Resolution: _____

**Overall Result:** [ ] PASS (10/10) | [ ] FAIL

**Failed Tests:**
```
List any failed tests and notes here
```

**Issues to File:**
```
List any bugs discovered during testing
```
