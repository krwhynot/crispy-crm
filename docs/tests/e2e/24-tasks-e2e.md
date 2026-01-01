# Tasks Module E2E Manual Testing Checklist

Comprehensive manual E2E test checklist for the Tasks module. This module has limited automated test coverage (14 tests), so this checklist is designed to be extra thorough.

## Test Environment Setup

**Environment Selection:**
| Environment | Base URL | Credentials |
|-------------|----------|-------------|
| Local | http://localhost:5173 | admin@test.com / password123 |
| Production | https://crm.kjrcloud.com | [production credentials] |

**Claude Chrome Commands:**
- Local: "Run tasks tests against localhost:5173"
- Production: "Run tasks tests against crm.kjrcloud.com"

- **Browser:** Chrome (recommended for Claude Chrome testing)
- **Seed Data Required:** Run `just seed-e2e` before testing
- **Test Data Naming:** Use timestamps like `Test Task 2025-12-31-143022`

### Pre-Test Checklist

- [ ] Development server running (`npm run dev` or `just dev`)
- [ ] Browser DevTools open (F12), Console tab visible
- [ ] Seed data loaded (verify "Ryan Wabeke" opportunity exists)
- [ ] Logged in as admin@test.com

### Seed Data References

| Entity | Name | Purpose |
|--------|------|---------|
| Opportunity | Ryan Wabeke | For opportunity linking tests |
| Contact | Hancotte | For contact linking tests |
| User | Admin | Default assigned user |

---

## Section 1: CRUD Operations

### Test 1.1: Create Task - Minimal Required Fields

**Objective:** Verify task creation with only required fields.

**Steps:**

1. Navigate to `${BASE_URL}/#/tasks/create`
2. Wait for form to load completely
3. Fill in:
   - **Title:** `Test Task 2025-12-31-143022`
   - **Due Date:** Select tomorrow's date
   - **Type:** Leave as "Call" (default)
4. Verify "Assigned To" is pre-filled with current user
5. Click "Save & Close"

**Expected Results:**

- [ ] Form loads with 2 tabs: "General" and "Details"
- [ ] Title field shows asterisk (*) indicating required
- [ ] Due Date field shows asterisk (*) indicating required
- [ ] Type defaults to "Call"
- [ ] Priority defaults to "Medium"
- [ ] Assigned To pre-fills with logged-in user (Admin)
- [ ] Form submits successfully
- [ ] Redirects to tasks list (`/#/tasks`)
- [ ] New task appears in list
- [ ] No console errors

---

### Test 1.2: Create Task - All Fields Populated

**Objective:** Verify task creation with all optional fields.

**Test Data:**

- Title: `Full Task 2025-12-31-143022`
- Description: `This is a comprehensive test task with all fields`
- Due Date: 7 days from now
- Reminder Date: 5 days from now
- Priority: High
- Type: Meeting
- Organization: Search for any organization
- Opportunity: Search for "Ryan Wabeke"
- Contact: Search for "Hancotte"
- Assigned To: Admin

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill in General tab:
   - Title
   - Description (multi-line textarea)
   - Due Date
   - Reminder Date
3. Click "Details" tab
4. Fill in Details tab:
   - Priority: Select "High"
   - Type: Select "Meeting"
   - Organization: Use autocomplete, type organization name
   - Opportunity: Use autocomplete, type "Ryan"
   - Contact: Use autocomplete, type "Hancotte"
   - Assigned To: Leave as Admin
5. Click "Save & Close"

**Expected Results:**

- [ ] Tab navigation works between General and Details
- [ ] All autocomplete fields search and select correctly
- [ ] Form submits successfully
- [ ] All fields saved correctly (verify in slide-over)
- [ ] No console errors

---

### Test 1.3: Read - Task List Display

**Objective:** Verify task list displays all columns correctly.

**Steps:**

1. Navigate to `/#/tasks`
2. Observe the task list datagrid

**Expected Results:**

- [ ] List loads with skeleton during fetch
- [ ] Columns visible (desktop): Done, Title, Due Date, Priority, Type, Assigned To, Contact, Opportunity, Actions
- [ ] "Done" column shows checkbox for each row
- [ ] Priority displays as colored badge
- [ ] Type displays as outline badge
- [ ] Actions column shows "..." menu button
- [ ] Rows are sorted by Due Date ascending by default
- [ ] Keyboard navigation works (arrow keys)

---

### Test 1.4: Read - Task Slide-Over View

**Objective:** Verify slide-over displays task details correctly.

**Steps:**

1. Navigate to `/#/tasks`
2. Click on any task row (not the checkbox or menu)
3. Observe the slide-over panel

**Expected Results:**

- [ ] Slide-over opens from right (40vw width)
- [ ] Two tabs visible: "Details" and "Related Items"
- [ ] Task title appears in header
- [ ] Details tab shows all task fields
- [ ] Toggle between View/Edit mode works
- [ ] ESC key closes slide-over
- [ ] URL updates with `?view=[id]`

---

### Test 1.5: Update - Edit Task via Slide-Over

**Objective:** Verify task editing in slide-over edit mode.

**Steps:**

1. Navigate to `/#/tasks`
2. Click on a task to open slide-over
3. Click "Edit" button (pencil icon) to switch to edit mode
4. Modify Title: Append ` - EDITED`
5. Change Priority from current to "Critical"
6. Click "Save" button

**Expected Results:**

- [ ] Slide-over switches to edit mode
- [ ] Form fields become editable
- [ ] Changes save successfully
- [ ] Slide-over refreshes with new data
- [ ] List updates to reflect changes
- [ ] No console errors

---

### Test 1.6: Update - Edit Task via Standalone Page

**Objective:** Verify standalone edit page functionality.

**Steps:**

1. Navigate directly to `/#/tasks/[id]` (use existing task ID)
2. Or: From list, click Actions menu > "Edit"
3. Modify the description
4. Click "Save"

**Expected Results:**

- [ ] Edit page loads with card layout
- [ ] TaskInputs component renders (2 tabs)
- [ ] Changes save successfully
- [ ] Redirects to show page
- [ ] No console errors

---

### Test 1.7: Delete - Task via Actions Menu

**Objective:** Verify task deletion (soft-delete).

**Steps:**

1. Navigate to `/#/tasks`
2. Find a test task to delete
3. Click the "..." actions menu on that row
4. Click "Delete"
5. Observe result

**Expected Results:**

- [ ] Actions menu opens correctly
- [ ] Delete option appears with red/destructive styling
- [ ] Task is removed from list after delete
- [ ] Success notification appears: "Task deleted"
- [ ] No console errors
- [ ] Task uses soft-delete (deleted_at set, not hard deleted)

---

## Section 2: Completion Flow Tests

### Test 2.1: Complete Task via List Checkbox

**Objective:** Verify inline task completion from list view.

**Steps:**

1. Navigate to `/#/tasks`
2. Find an incomplete task
3. Click the checkbox in the "Done" column
4. Observe result

**Expected Results:**

- [ ] Checkbox click does NOT trigger row click (slide-over should not open)
- [ ] Task marked as completed immediately
- [ ] Success notification: "Task completed"
- [ ] Checkbox shows as checked
- [ ] completed_at timestamp is set

---

### Test 2.2: Reopen Completed Task

**Objective:** Verify task can be uncompleted.

**Steps:**

1. Navigate to `/#/tasks`
2. Find a completed task (checkbox checked)
3. Click the checkbox to uncheck

**Expected Results:**

- [ ] Task marked as incomplete
- [ ] Success notification: "Task reopened"
- [ ] Checkbox shows as unchecked
- [ ] completed_at is cleared (null)

---

### Test 2.3: Completion Dialog Flow - Log Activity

**Objective:** Verify completion triggers activity logging dialog.

**Note:** This test applies to the Dashboard Kanban view (TasksKanbanPanel) which shows the TaskCompletionDialog.

**Steps:**

1. Navigate to `/#/dashboard-v3` (Dashboard V3)
2. Find a task card in the Kanban panel
3. Complete the task (method depends on Kanban UI)
4. Observe the completion dialog

**Expected Results:**

- [ ] Completion dialog opens with title "Task Completed!"
- [ ] Task subject shown in dialog
- [ ] Three options visible:
  - [ ] "Log Activity" - primary button
  - [ ] "Create Follow-up" - primary button
  - [ ] "Just Complete" - outline button
- [ ] "Log Activity" navigates to `/activities/create` with pre-filled params
- [ ] Activity type is mapped from task type (Call->Call, Email->Email, etc.)
- [ ] Contact/Opportunity IDs passed in URL params

---

### Test 2.4: Completion Dialog Flow - Create Follow-up

**Objective:** Verify follow-up task creation from completion dialog.

**Steps:**

1. Complete a task to trigger completion dialog
2. Click "Create Follow-up"

**Expected Results:**

- [ ] Navigates to `/tasks/create`
- [ ] Title pre-filled as: `Follow-up: [original task subject]`
- [ ] Type pre-filled as "Follow-up"
- [ ] Contact/Opportunity IDs preserved from original task
- [ ] Task completes before navigation

---

### Test 2.5: Completion Dialog Flow - Just Complete

**Objective:** Verify simple completion without follow-up.

**Steps:**

1. Complete a task to trigger completion dialog
2. Click "Just Complete"

**Expected Results:**

- [ ] Dialog closes
- [ ] Task marked as completed
- [ ] No navigation occurs
- [ ] Returns to previous view

---

## Section 3: Snooze Functionality Tests

### Test 3.1: Snooze Field - Empty String to Null Transform

**Objective:** Verify snooze_until empty string is transformed to null.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill required fields (Title, Due Date)
3. Leave snooze_until empty (if visible in form)
4. Submit form
5. Check database or API response

**Expected Results:**

- [ ] Form accepts empty snooze field
- [ ] snooze_until saved as NULL (not empty string)
- [ ] Task is active (not hidden)
- [ ] No validation errors

---

### Test 3.2: Snooze Until Future Date

**Objective:** Verify snoozing a task hides it until specified date.

**Note:** This test requires snooze_until field to be editable. Check if exposed in form or only via API.

**Steps:**

1. Edit an existing task
2. Set snooze_until to a future date (e.g., 3 days from now)
3. Save the task
4. Return to task list

**Expected Results:**

- [ ] Task saves with snooze_until date
- [ ] Task behavior on list depends on filter (may be hidden)
- [ ] After snooze date passes, task reappears
- [ ] No console errors

---

## Section 4: Postpone Tests

### Test 4.1: Postpone to Tomorrow

**Objective:** Verify postponing a task by 1 day.

**Steps:**

1. Navigate to `/#/tasks`
2. Find a task (preferably with past due date)
3. Click Actions menu ("...")
4. Click "Postpone to Tomorrow"

**Expected Results:**

- [ ] Due date updates to tomorrow
- [ ] Success notification: "Task postponed to tomorrow"
- [ ] List refreshes with new date
- [ ] No console errors

---

### Test 4.2: Postpone to Next Week

**Objective:** Verify postponing a task by 7 days.

**Steps:**

1. Navigate to `/#/tasks`
2. Find a task
3. Click Actions menu ("...")
4. Click "Postpone to Next Week"

**Expected Results:**

- [ ] Due date updates to +7 days from current due date
- [ ] Success notification: "Task postponed to next week"
- [ ] List refreshes with new date
- [ ] No console errors

---

### Test 4.3: Postpone Overdue Task

**Objective:** Verify postpone calculates from current date, not original due date.

**Steps:**

1. Find or create a task with past due date
2. Postpone to Tomorrow
3. Verify new due date

**Expected Results:**

- [ ] New due date is tomorrow (not original date + 1 day)
- [ ] Date calculation uses current date as base
- [ ] No console errors

---

## Section 5: Quick Actions Menu Tests

### Test 5.1: Actions Menu - View Option

**Objective:** Verify View action opens slide-over in view mode.

**Steps:**

1. Navigate to `/#/tasks`
2. Click Actions menu on any task row
3. Click "View"

**Expected Results:**

- [ ] Slide-over opens
- [ ] Slide-over is in VIEW mode (not edit)
- [ ] Task details displayed
- [ ] Row click event not triggered (no double slide-over)

---

### Test 5.2: Actions Menu - Edit Option

**Objective:** Verify Edit action opens slide-over in edit mode.

**Steps:**

1. Navigate to `/#/tasks`
2. Click Actions menu on any task row
3. Click "Edit"

**Expected Results:**

- [ ] Slide-over opens in EDIT mode
- [ ] Form fields are editable
- [ ] Can modify and save changes

---

### Test 5.3: Actions Menu - Stop Propagation

**Objective:** Verify actions menu click does not trigger row click.

**Steps:**

1. Navigate to `/#/tasks`
2. Click the "..." button to open Actions menu
3. Click anywhere in the menu

**Expected Results:**

- [ ] Clicking "..." button does NOT open slide-over
- [ ] Clicking menu items performs only that action
- [ ] No double slide-over opening
- [ ] No conflicting navigation

---

### Test 5.4: Actions Menu - Loading State

**Objective:** Verify menu shows loading indicator during operations.

**Steps:**

1. Navigate to `/#/tasks`
2. Click Actions menu
3. Click "Postpone to Tomorrow"
4. Observe button during update

**Expected Results:**

- [ ] Button shows spinner/loading indicator
- [ ] Menu is disabled during operation
- [ ] Loading clears after success/failure

---

## Section 6: Task Type Tests (All 7 Types)

### Test 6.1: Create Task - Type: Call

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab, select Type: "Call"
4. Save

**Expected Results:**

- [ ] Type "Call" saves correctly
- [ ] Type badge shows "Call" in list

---

### Test 6.2: Create Task - Type: Email

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab, select Type: "Email"
4. Save

**Expected Results:**

- [ ] Type "Email" saves correctly
- [ ] Type badge shows "Email" in list

---

### Test 6.3: Create Task - Type: Meeting

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab, select Type: "Meeting"
4. Save

**Expected Results:**

- [ ] Type "Meeting" saves correctly

---

### Test 6.4: Create Task - Type: Follow-up

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab, select Type: "Follow-up"
4. Save

**Expected Results:**

- [ ] Type "Follow-up" saves correctly (with hyphen)

---

### Test 6.5: Create Task - Type: Demo

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab, select Type: "Demo"
4. Save

**Expected Results:**

- [ ] Type "Demo" saves correctly

---

### Test 6.6: Create Task - Type: Proposal

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab, select Type: "Proposal"
4. Save

**Expected Results:**

- [ ] Type "Proposal" saves correctly

---

### Test 6.7: Create Task - Type: Other

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab, select Type: "Other"
4. Save

**Expected Results:**

- [ ] Type "Other" saves correctly

---

## Section 7: Entity Linking Tests

### Test 7.1: Link Task to Contact

**Objective:** Verify task can be linked to a contact.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab
4. In Contact field, type "Hancotte"
5. Select from autocomplete dropdown
6. Save

**Expected Results:**

- [ ] Contact autocomplete searches contacts_summary
- [ ] Contact selection saves correctly
- [ ] Contact name appears in task list (desktop)
- [ ] Contact link appears in slide-over Related Items tab

---

### Test 7.2: Link Task to Opportunity

**Objective:** Verify task can be linked to an opportunity.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab
4. In Opportunity field, type "Ryan"
5. Select "Ryan Wabeke" from dropdown
6. Save

**Expected Results:**

- [ ] Opportunity autocomplete searches opportunities
- [ ] Opportunity selection saves correctly
- [ ] Opportunity title appears in task list (desktop)
- [ ] Opportunity link appears in slide-over Related Items tab

---

### Test 7.3: Link Task to Organization

**Objective:** Verify task can be linked to an organization.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Go to Details tab
4. In Organization field, search for any organization
5. Select from dropdown
6. Save

**Expected Results:**

- [ ] Organization autocomplete searches organizations
- [ ] Organization selection saves correctly
- [ ] Organization link appears in slide-over Related Items tab

---

### Test 7.4: Pre-filled Task from URL Parameters

**Objective:** Verify task create accepts URL params for pre-filling.

**Steps:**

1. Navigate to: `/#/tasks/create?title=Follow-up%20Test&type=follow_up&contact_id=1`
2. Observe form fields

**Expected Results:**

- [ ] Title pre-filled: "Follow-up Test"
- [ ] Type pre-filled: "Follow-up" (mapped from URL "follow_up")
- [ ] Contact ID pre-filled (if valid ID)
- [ ] Form is ready to submit with pre-filled data

---

### Test 7.5: QuickAddTaskButton from Opportunity Slide-Over

**Objective:** Verify creating a task from an opportunity context.

**Steps:**

1. Navigate to `/#/opportunities`
2. Click on an opportunity to open slide-over
3. Look for "Add Task" or similar quick action button
4. Click to create task
5. Observe pre-filled values

**Expected Results:**

- [ ] Navigates to task create form
- [ ] Opportunity ID pre-filled
- [ ] Can complete and save task
- [ ] Task appears linked to opportunity

---

## Section 8: Validation Edge Cases

### Test 8.1: Empty Title Validation

**Objective:** Verify title is required.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Leave Title empty
3. Fill Due Date
4. Attempt to submit (or blur title field)

**Expected Results:**

- [ ] Validation error shows: "Title is required"
- [ ] Form does not submit
- [ ] Error styling on title input

---

### Test 8.2: Title Max Length (500 chars)

**Objective:** Verify title max length enforcement.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Paste 501+ character string in Title
3. Fill Due Date
4. Submit

**Expected Results:**

- [ ] Validation error shows: "Title too long"
- [ ] Form does not submit
- [ ] Or: Input truncates at 500 characters

---

### Test 8.3: Description Max Length (2000 chars)

**Objective:** Verify description max length enforcement.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Paste 2001+ character string in Description
4. Submit

**Expected Results:**

- [ ] Validation error shows: "Description too long"
- [ ] Form does not submit
- [ ] Or: Input truncates at 2000 characters

---

### Test 8.4: Due Date Required Validation

**Objective:** Verify due_date is required.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title
3. Clear Due Date field (if pre-filled)
4. Attempt to submit

**Expected Results:**

- [ ] Validation error shows: "Due date is required"
- [ ] Form does not submit

---

### Test 8.5: Date Coercion - String to Date

**Objective:** Verify date fields accept various input formats.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title
3. Enter Due Date via date picker
4. Submit

**Expected Results:**

- [ ] Date picker works correctly
- [ ] Date saves as ISO format in database
- [ ] No coercion errors in console

---

### Test 8.6: Priority Enum Validation

**Objective:** Verify only valid priority values accepted.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill required fields
3. Select each priority option: low, medium, high, critical
4. Verify dropdown contains only these 4 options

**Expected Results:**

- [ ] Dropdown shows exactly 4 options
- [ ] Each option can be selected and saved
- [ ] No invalid priority values possible via UI

---

### Test 8.7: Assigned User (sales_id) Required

**Objective:** Verify sales_id cannot be empty.

**Steps:**

1. Navigate to `/#/tasks/create`
2. Fill Title and Due Date
3. Clear "Assigned To" field
4. Attempt to submit

**Expected Results:**

- [ ] sales_id is auto-filled with current user
- [ ] If manually cleared, validation error appears
- [ ] Form does not submit without assignee

---

## Section 9: Viewport Testing

### Test 9.1: Desktop View (1440px+)

**Objective:** Verify full column visibility on desktop.

**Steps:**

1. Set browser width to 1440px or wider
2. Navigate to `/#/tasks`
3. Observe all columns

**Expected Results:**

- [ ] All 9 columns visible
- [ ] Type column visible
- [ ] Assigned To column visible
- [ ] Contact column visible
- [ ] Opportunity column visible
- [ ] No horizontal scrolling needed

---

### Test 9.2: iPad View (1024px-1279px)

**Objective:** Verify responsive column hiding on tablet.

**Steps:**

1. Set browser width to 1024px
2. Navigate to `/#/tasks`
3. Observe column visibility

**Expected Results:**

- [ ] Essential columns visible: Done, Title, Due Date, Priority, Actions
- [ ] "Desktop only" columns hidden: Type, Assigned To, Contact, Opportunity
- [ ] Touch targets minimum 44x44px (h-11 w-11)
- [ ] Slide-over still usable

---

### Test 9.3: Slide-Over on iPad

**Objective:** Verify slide-over width on tablet viewport.

**Steps:**

1. Set browser width to 1024px
2. Navigate to `/#/tasks`
3. Click a task to open slide-over

**Expected Results:**

- [ ] Slide-over width is appropriate (40vw = ~410px)
- [ ] Content not clipped
- [ ] Close button accessible
- [ ] Edit mode functional

---

### Test 9.4: Form on iPad

**Objective:** Verify create/edit forms work on tablet.

**Steps:**

1. Set browser width to 1024px
2. Navigate to `/#/tasks/create`
3. Fill out form
4. Submit

**Expected Results:**

- [ ] Form layout adapts to width
- [ ] All inputs accessible
- [ ] Tab navigation works
- [ ] Submit buttons visible and functional

---

## Section 10: Console Monitoring Checklist

Monitor browser DevTools Console during all tests for these error patterns:

### Critical Errors (Test Failure)

- [ ] No RLS errors ("permission denied", "row-level security", "42501")
- [ ] No React errors (red error messages)
- [ ] No unhandled promise rejections
- [ ] No Zod validation failures (ZodError)
- [ ] No 500/403/401 network errors

### Warnings (Note But Not Failure)

- [ ] ResizeObserver errors (known browser quirk, can ignore)
- [ ] React deprecation warnings
- [ ] Third-party library warnings

### Network Tab Checks

- [ ] All API calls return 200/201
- [ ] No failed requests to `/rest/v1/tasks`
- [ ] Auth token present in headers

---

## Section 11: Edge Cases and Regression Tests

### Test 11.1: Create Task Then Immediate Edit

**Objective:** Verify no race conditions on create/edit sequence.

**Steps:**

1. Create a new task
2. Immediately click on it in list
3. Switch to edit mode
4. Make a change
5. Save

**Expected Results:**

- [ ] No stale data errors
- [ ] Edit saves correctly
- [ ] No "record not found" errors

---

### Test 11.2: Bulk Selection

**Objective:** Verify bulk actions toolbar appears.

**Steps:**

1. Navigate to `/#/tasks`
2. Select multiple tasks (method depends on UI)
3. Observe bulk actions toolbar

**Expected Results:**

- [ ] Bulk selection works
- [ ] BulkActionsToolbar appears
- [ ] Can perform bulk operations

---

### Test 11.3: Empty State

**Objective:** Verify empty list state displays correctly.

**Steps:**

1. Navigate to `/#/tasks`
2. Delete all tasks (or use filter that returns no results)
3. Observe empty state

**Expected Results:**

- [ ] TaskEmpty component renders
- [ ] Friendly message displayed
- [ ] Create button available
- [ ] No JavaScript errors

---

### Test 11.4: List Filter Persistence

**Objective:** Verify filter state survives navigation.

**Steps:**

1. Navigate to `/#/tasks`
2. Apply a filter (e.g., Priority = High)
3. Navigate away to `/#/contacts`
4. Navigate back to `/#/tasks`
5. Observe filter state

**Expected Results:**

- [ ] Filter persists (or intentionally cleared)
- [ ] useFilterCleanup removes stale filters
- [ ] No stale filter causing empty results

---

### Test 11.5: CSV Export

**Objective:** Verify task list can be exported to CSV.

**Steps:**

1. Navigate to `/#/tasks`
2. Look for Export button (if available in TopToolbar)
3. Click to export
4. Open downloaded CSV

**Expected Results:**

- [ ] CSV file downloads
- [ ] Contains columns: id, title, description, type, priority, due_date, completed, etc.
- [ ] Related data (principal name) included
- [ ] No console errors during export

---

## Pass Criteria

### Minimum for Module Approval

- [ ] All Section 1 tests pass (CRUD Operations)
- [ ] All Section 2 tests pass (Completion Flow)
- [ ] All Section 4 tests pass (Postpone)
- [ ] All Section 6 tests pass (Task Types)
- [ ] All Section 8 tests pass (Validation)
- [ ] No critical console errors in any test

### Full Module Certification

- [ ] ALL sections pass
- [ ] Both Desktop and iPad viewports tested
- [ ] All 7 task types verified
- [ ] Entity linking (contact, opportunity, organization) verified
- [ ] Snooze functionality verified
- [ ] Completion dialog flow verified

---

## Test Result Summary

| Section | Test Count | Passed | Failed | Skipped |
|---------|------------|--------|--------|---------|
| 1. CRUD Operations | 7 | [ ] | [ ] | [ ] |
| 2. Completion Flow | 5 | [ ] | [ ] | [ ] |
| 3. Snooze Functionality | 2 | [ ] | [ ] | [ ] |
| 4. Postpone Tests | 3 | [ ] | [ ] | [ ] |
| 5. Quick Actions Menu | 4 | [ ] | [ ] | [ ] |
| 6. Task Type Tests | 7 | [ ] | [ ] | [ ] |
| 7. Entity Linking | 5 | [ ] | [ ] | [ ] |
| 8. Validation Edge Cases | 7 | [ ] | [ ] | [ ] |
| 9. Viewport Testing | 4 | [ ] | [ ] | [ ] |
| 10. Console Monitoring | - | [ ] | [ ] | [ ] |
| 11. Edge Cases | 5 | [ ] | [ ] | [ ] |
| **TOTAL** | **49** | | | |

---

## Notes

### Known Limitations

1. **Snooze Field:** May not be exposed in standard create/edit forms - verify via slide-over or API
2. **Completion Dialog:** Only appears in Dashboard Kanban view, not in TaskList checkbox flow
3. **Postpone Visibility:** Currently shows for all tasks (visibility condition for overdue-only is a future enhancement)

### Debugging Tips

1. Use React DevTools to inspect component state
2. Check Network tab for API request/response payloads
3. Verify Zod schema matches database columns
4. Check localStorage for stale filter values

### Related Documentation

- Zod Schema: `src/atomic-crm/validation/task.ts`
- Task Types: Call, Email, Meeting, Follow-up, Demo, Proposal, Other
- Priority Levels: low, medium, high, critical
- Form Mode: `onBlur` validation (not onChange)

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
