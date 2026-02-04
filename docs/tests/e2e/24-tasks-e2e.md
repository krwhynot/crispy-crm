# Tasks Module E2E Testing - Claude Chrome Prompts

Executable test prompts for Claude Chrome browser automation. Each section is a self-contained prompt.

**Architecture Note (STI):** Tasks are stored in the `activities` table with `activity_type = 'task'`. The `tasksHandler` virtualizes a "tasks" resource. All network traffic targets `/rest/v1/activities`, never `/rest/v1/tasks`. Field mapping: UI `title` = DB `subject`, UI task types (Title Case) = DB interaction types (snake_case).

---

## Environment

| Environment | Base URL | Credentials |
|-------------|----------|-------------|
| Local | http://localhost:5173 | admin@test.com / password123 |

**Seed data:** `just seed-e2e` (verify "Ryan Wabeke" opportunity and "Hancotte" contact exist)

---

## Section 1: CRUD Operations

### Test 1.1: Create Task - Minimal Required Fields

Navigate to `{BASE_URL}/#/tasks/create`. Wait for the form to load. Take a screenshot.

Verify the form structure:
- There are form tabs (e.g. "General" and "Details" or similar grouping)
- Title field is marked required (asterisk)
- Due Date field is marked required (asterisk)
- Type defaults to "Call"
- Priority defaults to "Medium"
- "Assigned To" is pre-filled with the current user (Admin)

Fill in:
- Title: `Test Task CRUD-1.1`
- Due Date: select tomorrow's date

Click "Save & Close". Wait for navigation.

Verify:
- Success notification appears
- Redirected to tasks list (`/#/tasks`)
- The new task "Test Task CRUD-1.1" appears in the list
- Read console messages and confirm no errors

Open the Network tab (use `read_network_requests` with pattern `/rest/v1/activities`). Verify:
- The POST request went to `/rest/v1/activities` (NOT `/rest/v1/tasks`)
- Request body contains `activity_type: "task"`
- Request body contains `subject: "Test Task CRUD-1.1"` (NOT `title`)

---

### Test 1.2: Create Task - All Fields Populated

Navigate to `{BASE_URL}/#/tasks/create`.

Fill in the General section:
- Title: `Full Task CRUD-1.2`
- Description: `Comprehensive test task with all fields`
- Due Date: 7 days from now
- Reminder Date: 5 days from now

Switch to the Details section/tab. Fill in:
- Priority: select "High"
- Type: select "Meeting"
- Organization: type in the autocomplete and select any result
- Opportunity: type "Ryan" and select "Ryan Wabeke"
- Contact: type "Hancotte" and select from dropdown
- Assigned To: leave as Admin

Click "Save & Close". Wait for navigation.

Verify:
- Success notification appears
- Task appears in list
- Click the new task row to open the slide-over
- All fields are displayed correctly: priority High, type Meeting, linked contact, linked opportunity
- Read console messages and confirm no errors

---

### Test 1.3: Task List Display

Navigate to `{BASE_URL}/#/tasks`. Wait for list to load. Take a screenshot.

Verify the datagrid columns (at 1440px desktop width):
- Done (checkbox column)
- Title
- Due Date
- Priority (colored badge)
- Type (outline badge)
- Assigned To
- Contact
- Opportunity
- Actions ("..." menu button)

Verify:
- Rows are sorted by Due Date ascending by default
- "Done" column shows a checkbox for each row
- Read console messages and confirm no errors

---

### Test 1.4: Task Slide-Over View

Navigate to `{BASE_URL}/#/tasks`. Click on any task row (NOT the checkbox, NOT the "..." menu). Wait for slide-over to open. Take a screenshot.

Verify:
- Slide-over opens from the right
- Task title appears in the header
- Task detail fields are visible (due date, priority, type, description)
- There is a View/Edit mode toggle (pencil icon or "Edit" button)
- URL updated to include `?view=[id]`

Press Escape. Verify the slide-over closes and URL returns to `/#/tasks`.

---

### Test 1.5: Edit Task via Slide-Over

Navigate to `{BASE_URL}/#/tasks`. Click on a task row to open the slide-over. Click the "Edit" button (pencil icon) to switch to edit mode. Take a screenshot.

Verify edit mode:
- Form fields are now editable
- There is a Save button and a Cancel button

Modify the Title field: append ` - EDITED` to the existing title. Change Priority to "Critical". Click Save. Wait for the save to complete.

Verify:
- Success notification appears
- Slide-over shows updated data (title with " - EDITED", priority "Critical")
- Close the slide-over and verify the list row reflects the changes
- Read console messages and confirm no errors

Check network requests with pattern `/rest/v1/activities`. Verify:
- The PATCH request went to `/rest/v1/activities` with the task's ID
- Request body uses `subject` field (not `title`)

---

### Test 1.6: Delete Task via Actions Menu

Navigate to `{BASE_URL}/#/tasks`. Find a test task (e.g. "Test Task CRUD-1.1"). Click the "..." actions menu on that row. Take a screenshot of the menu.

Verify:
- Menu contains a Delete option with destructive/red styling

Click "Delete". Wait for the operation to complete.

Verify:
- Task is removed from the list
- Success notification appears
- Read console messages and confirm no errors

Check network requests. Verify:
- The delete used a PATCH to `/rest/v1/activities` setting `deleted_at` (soft-delete, NOT an HTTP DELETE)

---

## Section 2: Completion Flow

### Test 2.1: Complete Task via List Checkbox

Navigate to `{BASE_URL}/#/tasks`. Find an incomplete task (unchecked checkbox in the "Done" column). Note the task title. Click the checkbox.

Verify:
- The checkbox click did NOT open the slide-over (stop propagation working)
- Task completion dialog appears with options: "Log Activity", "Create Follow-up", "Just Complete"
- Success notification appears after selecting an option
- The checkbox now shows as checked
- Read console messages and confirm no errors

Check network requests with pattern `/rest/v1/activities`. Verify:
- PATCH request includes `completed: true`
- Response includes a `completed_at` timestamp

---

### Test 2.2: Reopen Completed Task

Navigate to `{BASE_URL}/#/tasks`. Find a completed task (checked checkbox). Click the checkbox to uncheck it.

Verify:
- Success notification appears (e.g. "Task reopened")
- Checkbox shows as unchecked
- Read console messages and confirm no errors

Check network requests. Verify:
- PATCH request includes `completed: false`
- `completed_at` is set to `null`

---

### Test 2.3: Completion Dialog - Log Activity (Kanban)

Navigate to `{BASE_URL}/#/dashboard-v3` (Dashboard V3). Take a screenshot. Find a task card in the Kanban panel. Note the task title and type. Click the checkbox on the task card to complete it.

Verify the completion dialog:
- Dialog opens with title "Task Completed!" (or similar)
- Task subject is shown
- Three options visible: "Log Activity", "Create Follow-up", "Just Complete"

Click "Log Activity".

Verify:
- A QuickLogActivityDialog opens inline (does NOT navigate to `/activities/create`)
- Type is pre-filled, mapped from task type (e.g. Call -> call, Email -> email)
- Subject is pre-filled from the task title
- Contact/Opportunity IDs are carried over from the original task
- Date defaults to today

Submit the activity form. Wait for completion.

Verify:
- Dialog closes and returns to dashboard
- Read console messages and confirm no errors

Check network requests with pattern `/rest/v1/activities`. Verify:
- A POST created a new activity record with `activity_type` = `interaction` or `engagement` (NOT `task`)
- The new activity has `related_task_id` set to the completed task's ID

---

### Test 2.4: Completion Dialog - Create Follow-up

Navigate to `{BASE_URL}/#/dashboard-v3`. Complete a task via checkbox on a Kanban card to trigger the completion dialog. Click "Create Follow-up".

Verify:
- Navigates to `/#/tasks/create`
- Title is pre-filled as: `Follow-up: [original task subject]`
- Type is pre-filled as "Follow-up" (regardless of original type)
- Contact and Opportunity IDs are preserved from the original task
- The original task was marked completed before navigation

---

### Test 2.5: Completion Dialog - Just Complete

Navigate to `{BASE_URL}/#/dashboard-v3`. Complete a task via checkbox on a Kanban card to trigger the completion dialog. Click "Just Complete".

Verify:
- Dialog closes
- Task is marked as completed
- No navigation occurred (still on dashboard)
- Read console messages and confirm no errors

---

## Section 3: Snooze Functionality

### Test 3.1: Snooze Field - Null Transform

Navigate to `{BASE_URL}/#/tasks/create`. Fill required fields (Title: `Snooze Test 3.1`, Due Date: tomorrow). Do NOT set any snooze date. Submit the form.

Check network requests with pattern `/rest/v1/activities`. Verify:
- `snooze_until` is `null` in the request body (not empty string)
- Task saves successfully
- Task appears in the task list (not hidden)

---

### Test 3.2: Snooze Until Future Date

Navigate to `{BASE_URL}/#/tasks`. Click on an existing task to open the slide-over. Switch to edit mode. If a snooze_until field is visible, set it to 3 days from now. Save.

Verify:
- Task saves with the snooze date
- Check if the task is filtered from the list (behavior depends on list filters)
- Read console messages and confirm no errors

Note: If snooze_until is not exposed in the form UI, note this as a known limitation.

---

## Section 4: Postpone Tests

### Test 4.1: Postpone to Tomorrow

Navigate to `{BASE_URL}/#/tasks`. Find a task and note its current due date. Click the "..." actions menu on that row. Click "Postpone to Tomorrow".

Verify:
- Success notification appears (e.g. "Task postponed to tomorrow")
- Due date in the list updates to tomorrow's date
- Read console messages and confirm no errors

---

### Test 4.2: Postpone to Next Week

Navigate to `{BASE_URL}/#/tasks`. Find a task. Click the "..." actions menu. Click "Postpone to Next Week".

Verify:
- Success notification appears
- Due date updates to +7 days from current due date
- Read console messages and confirm no errors

---

### Test 4.3: Postpone Overdue Task

Navigate to `{BASE_URL}/#/tasks`. Find or create a task with a past due date. Click the "..." actions menu. Click "Postpone to Tomorrow".

Verify:
- New due date is tomorrow (based on current date, NOT original due date + 1)
- Read console messages and confirm no errors

---

## Section 5: Quick Actions Menu

### Test 5.1: Actions Menu - View

Navigate to `{BASE_URL}/#/tasks`. Click the "..." actions menu on any task row. Click "View".

Verify:
- Slide-over opens in VIEW mode (not edit)
- Task details are displayed
- Clicking "..." did NOT also trigger a row click (no double slide-over)

---

### Test 5.2: Actions Menu - Edit

Navigate to `{BASE_URL}/#/tasks`. Click the "..." actions menu on any task row. Click "Edit".

Verify:
- Slide-over opens in EDIT mode
- Form fields are editable
- Can modify and save changes

---

### Test 5.3: Actions Menu - Stop Propagation

Navigate to `{BASE_URL}/#/tasks`. Click the "..." button on a task row.

Verify:
- Clicking "..." does NOT open the slide-over (only the menu opens)
- Clicking a menu item performs only that action (no conflicting navigation)

---

### Test 5.4: Actions Menu - Loading State

Navigate to `{BASE_URL}/#/tasks`. Click the "..." actions menu. Click "Postpone to Tomorrow". Immediately take a screenshot.

Verify:
- Button or menu shows a loading indicator during the operation
- Menu is disabled during the operation
- Loading state clears after success

---

## Section 6: Task Type Tests (All 7 Types)

For each type below, navigate to `{BASE_URL}/#/tasks/create`, fill Title (`Type Test: [TYPE]`) and Due Date (tomorrow), go to Details section, select the type, and save.

### Test 6.1: Type "Call"
Create task with Type "Call". Verify it saves and shows "Call" badge in list.

### Test 6.2: Type "Email"
Create task with Type "Email". Verify it saves and shows "Email" badge in list.

### Test 6.3: Type "Meeting"
Create task with Type "Meeting". Verify it saves.

### Test 6.4: Type "Follow-up"
Create task with Type "Follow-up". Verify it saves (with hyphen).

### Test 6.5: Type "Demo"
Create task with Type "Demo". Verify it saves.

### Test 6.6: Type "Proposal"
Create task with Type "Proposal". Verify it saves.

### Test 6.7: Type "Other"
Create task with Type "Other". Verify it saves.

After creating all 7, check network requests for the last create. Verify:
- The `type` field in the POST body uses snake_case (e.g. `follow_up`, not `Follow-up`)
- The `activity_type` is `task` in every request

---

## Section 7: Entity Linking

### Test 7.1: Link Task to Contact

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title (`Linked Contact Test`) and Due Date. Go to Details section. In the Contact field, type "Hancotte". Select from the autocomplete dropdown. Save.

Verify:
- Contact name appears in the task list (desktop)
- Open the task slide-over and verify the contact link is displayed
- Read console messages and confirm no errors

---

### Test 7.2: Link Task to Opportunity

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title (`Linked Opp Test`) and Due Date. Go to Details section. In the Opportunity field, type "Ryan". Select "Ryan Wabeke". Save.

Verify:
- Opportunity title appears in the task list (desktop)
- Open the task slide-over and verify the opportunity link is displayed

---

### Test 7.3: Link Task to Organization

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title (`Linked Org Test`) and Due Date. Go to Details section. In the Organization field, search for any organization. Select it. Save.

Verify:
- Open the task slide-over and verify the organization link is displayed

---

### Test 7.4: Pre-filled Task from URL Parameters

Navigate to `{BASE_URL}/#/tasks/create?title=Follow-up%20Test&type=follow_up&contact_id=1`. Wait for form to load. Take a screenshot.

Verify:
- Title pre-filled: "Follow-up Test"
- Type pre-filled: "Follow-up" (mapped from URL "follow_up")
- Contact field pre-filled (if contact ID 1 exists)
- Form is ready to submit

---

### Test 7.5: QuickAddTaskButton from Contact Slide-Over

Navigate to `{BASE_URL}/#/contacts`. Click on a contact to open the slide-over. Look for an "Add Task" button in the header actions area. Click it.

Verify:
- Task creation form or dialog opens
- Contact ID is pre-filled from the contact context
- Can complete and save the task
- New task appears in the contact's right panel Tasks section

---

## Section 8: Validation Edge Cases

### Test 8.1: Empty Title

Navigate to `{BASE_URL}/#/tasks/create`. Leave Title empty. Fill Due Date. Try to submit.

Verify: Validation error appears, form does not submit, error styling on title input.

### Test 8.2: Title Max Length (500 chars)

Navigate to `{BASE_URL}/#/tasks/create`. Paste a 501+ character string in Title. Fill Due Date. Submit.

Verify: Validation error or input truncation at 500 characters. Form does not submit with oversized title.

### Test 8.3: Description Max Length (2000 chars)

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title and Due Date. Paste a 2001+ character string in Description. Submit.

Verify: Validation error or truncation at 2000 characters.

### Test 8.4: Due Date Required

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title. Clear Due Date field. Try to submit.

Verify: Validation error "Due date is required". Form does not submit.

### Test 8.5: Date Coercion

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title. Use the date picker to select a Due Date. Submit.

Verify: Date saves as ISO format. Read console messages and confirm no coercion errors.

### Test 8.6: Priority Enum

Navigate to `{BASE_URL}/#/tasks/create`. Fill required fields. Open the Priority dropdown.

Verify: Exactly 4 options: low, medium, high, critical. Each can be selected.

### Test 8.7: Assigned User Required

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title and Due Date. Clear the "Assigned To" field. Try to submit.

Verify: Validation error appears. `sales_id` cannot be empty.

---

## Section 9: Viewport Testing

### Test 9.1: Desktop (1440px+)

Resize browser to 1440px wide. Navigate to `{BASE_URL}/#/tasks`. Take a screenshot.

Verify all 9 columns visible: Done, Title, Due Date, Priority, Type, Assigned To, Contact, Opportunity, Actions. No horizontal scrolling needed.

### Test 9.2: iPad (1024px)

Resize browser to 1024px wide. Navigate to `{BASE_URL}/#/tasks`. Take a screenshot.

Verify:
- Essential columns visible: Done, Title, Due Date, Priority, Actions
- Desktop-only columns hidden: Type, Assigned To, Contact, Opportunity
- Touch targets are at least 44x44px

### Test 9.3: Slide-Over on iPad

At 1024px width, click a task to open the slide-over. Take a screenshot.

Verify: Content is not clipped. Close button is accessible. Edit mode is functional.

### Test 9.4: Form on iPad

At 1024px width, navigate to `{BASE_URL}/#/tasks/create`. Fill out and submit.

Verify: Form layout adapts. All inputs accessible. Tab navigation works. Submit buttons visible.

---

## Section 10: Console and Network Monitoring

Run these checks throughout all test sections.

### Console Checks

Read console messages after each major action. Look for:

**Fail the test if any of these appear:**
- RLS errors ("permission denied", "row-level security", "42501")
- React errors (red error messages)
- Unhandled promise rejections
- Zod validation failures (ZodError)
- 500/403/401 network errors

**Note but do not fail:**
- ResizeObserver errors (known browser quirk)
- React deprecation warnings

### Network Checks (STI-Aware)

Tasks use Single Table Inheritance. All task API traffic goes to the `activities` endpoint.

After any task create/update/delete, read network requests with pattern `/rest/v1/activities` and verify:

- Task reads: GET `/rest/v1/activities` with filter `activity_type=eq.task`
- Task creates: POST to `/rest/v1/activities` with `activity_type: "task"` in body
- Task updates: PATCH to `/rest/v1/activities?id=eq.[id]`
- Task deletes: PATCH to `/rest/v1/activities?id=eq.[id]` setting `deleted_at` (NOT HTTP DELETE)
- Auth token present in all request headers
- Field mapping: `subject` in payload (not `title`), snake_case types (not Title Case)

If any request targets `/rest/v1/tasks`, flag it as a regression.

---

## Section 11: Edge Cases

### Test 11.1: Create Then Immediate Edit

Navigate to `{BASE_URL}/#/tasks/create`. Create a task (Title: `Race Condition Test`, Due Date: tomorrow). After redirect to list, immediately click the new task row. Switch to edit mode. Append ` - EDITED` to the title. Save.

Verify: No stale data. Edit saves correctly. No "record not found" errors.

### Test 11.2: Bulk Selection

Navigate to `{BASE_URL}/#/tasks`. Select multiple task checkboxes (header checkbox for "select all" or individual row checkboxes).

Verify: A bulk actions toolbar appears. Bulk operations are available.

### Test 11.3: Empty State

Navigate to `{BASE_URL}/#/tasks`. Apply a filter that returns no results (or if no tasks exist).

Verify: An empty state component renders with a friendly message and a create button.

### Test 11.4: Filter Persistence

Navigate to `{BASE_URL}/#/tasks`. Apply a filter (e.g. Priority = High). Navigate to `{BASE_URL}/#/contacts`. Navigate back to `{BASE_URL}/#/tasks`.

Verify: Filter state either persists or is intentionally cleared. No stale filter causing empty results.

### Test 11.5: CSV Export

Navigate to `{BASE_URL}/#/tasks`. Look for an Export button in the toolbar. Click to export.

Verify: A CSV file downloads. It contains columns: id, subject (or title), description, type, priority, due_date, completed. Note: the CSV may use `subject` instead of `title` due to STI field mapping.

---

## Section 12: STI Data Integrity

These tests verify the Single Table Inheritance pattern works correctly end-to-end.

### Test 12.1: Task Create Network Payload

Navigate to `{BASE_URL}/#/tasks/create`. Fill Title: `STI Verify 12.1`, Due Date: tomorrow, Type: "Email". Save.

Immediately read network requests with pattern `/rest/v1/activities`.

Verify the POST request body contains:
- `activity_type`: `"task"` (discriminator set by handler)
- `subject`: `"STI Verify 12.1"` (title mapped to subject)
- `type`: `"email"` (Title Case "Email" mapped to snake_case "email")
- `completed`: `false`
- `due_date`: an ISO date string
- `sales_id`: a number (the assigned user)

Verify the POST target URL is `/rest/v1/activities` (NOT `/rest/v1/tasks`).

---

### Test 12.2: Task Update Field Mapping

Navigate to `{BASE_URL}/#/tasks`. Click on the "STI Verify 12.1" task. Switch to edit mode. Change the Title to `STI Updated 12.2`. Change the Type to "Meeting". Save.

Read network requests with pattern `/rest/v1/activities`.

Verify the PATCH request body contains:
- `subject`: `"STI Updated 12.2"` (not `title`)
- `type`: `"meeting"` (not `Meeting`)

---

### Test 12.3: Task Read Filters

Navigate to `{BASE_URL}/#/tasks`. Wait for the list to load.

Read network requests with pattern `/rest/v1/activities`.

Verify the GET request URL includes `activity_type=eq.task` as a query parameter. This confirms the handler filters to only show task records from the shared activities table.

---

## Section 13: Completion Activity Linkage

### Test 13.1: Logged Activity Links Back to Task

Navigate to `{BASE_URL}/#/dashboard-v3`. Find an incomplete task in the Kanban panel. Note the task title and its ID (check the URL or network requests). Complete the task by clicking its checkbox. When the completion dialog appears, click "Log Activity".

Fill in the QuickLogActivityDialog form (add a brief outcome or description if required). Submit.

Read network requests with pattern `/rest/v1/activities`.

Find the POST request that created the new activity (NOT the PATCH that completed the task). Verify:
- `activity_type` is `"interaction"` or `"engagement"` (NOT `"task"`)
- `related_task_id` is set to the completed task's ID
- `subject` is pre-filled from the original task's title
- `contact_id` and/or `opportunity_id` match the original task

---

### Test 13.2: Follow-up Task Links Back to Original

Navigate to `{BASE_URL}/#/dashboard-v3`. Complete a task via the Kanban checkbox. Click "Create Follow-up" in the completion dialog. Wait for navigation to `/#/tasks/create`.

Verify:
- Title is pre-filled as `Follow-up: [original task subject]`
- Type is "Follow-up"

Submit the follow-up task. Read network requests. Find the POST for the new task.

Verify: The new task's `related_task_id` references the original completed task's ID (if this field is set for follow-ups).

---

## Section 14: Priority Tasks View (Dashboard)

### Test 14.1: Incomplete Tasks in Dashboard Priority List

Navigate to `{BASE_URL}/#/dashboard-v3`. Take a screenshot. Look for a priority tasks panel or widget that shows upcoming/overdue tasks.

Verify:
- Incomplete tasks appear in the priority list
- Tasks are ordered by priority and/or due date
- Each task shows: title, due date, priority badge

Read network requests. Look for a request that uses the `priority_tasks` view or filters tasks by `completed=eq.false`.

---

### Test 14.2: Completed Task Disappears from Priority List

Note a task currently visible in the dashboard priority list. Complete it (via checkbox). Wait for the list to refresh.

Verify:
- The completed task disappears from the priority list
- Read console messages and confirm no errors

---

### Test 14.3: Snoozed Task Hidden from Priority List

If a snoozed task exists (or can be created via API), navigate to the dashboard.

Verify:
- Snoozed tasks (with `snooze_until` in the future) do NOT appear in the priority list
- Only active, unsnoozed, incomplete tasks are shown

---

## Section 15: Entity Timeline Integration

### Test 15.1: Task Appears in Contact Timeline

Navigate to `{BASE_URL}/#/tasks/create`. Create a task linked to a contact:
- Title: `Timeline Test 15.1`
- Due Date: today
- Contact: search and select "Hancotte"

Save. Then navigate to `{BASE_URL}/#/contacts`. Find and click on "Hancotte" to open the contact slide-over. Look at the Activities tab (left column).

Verify:
- The task "Timeline Test 15.1" appears in the unified activity timeline
- It is rendered with a task-specific style (different from regular activities)
- The entry shows as `entry_type = task` (check visually - task icon or label)

---

### Test 15.2: Logged Activity Appears in Timeline After Completion

Navigate to `{BASE_URL}/#/dashboard-v3`. Complete a task that is linked to a contact. Choose "Log Activity" in the completion dialog and submit.

Navigate to the contact's slide-over. Open the Activities tab.

Verify:
- Both the original task AND the logged activity appear in the timeline
- The activity shows as a regular activity entry (not a task)
- They are chronologically ordered

---

## Section 16: Cross-Entity Task Visibility

### Test 16.1: Tasks in Contact Slide-Over Right Panel

Navigate to `{BASE_URL}/#/contacts`. Click on a contact that has tasks linked to them. Wait for the slide-over to open. Scroll down in the right panel.

Verify:
- A "Tasks" section appears in the right panel
- Tasks are listed with their titles and due dates
- There is an "Add task" button at the bottom of the Tasks section
- Only tasks with matching `contact_id` are shown (filtered)

---

### Test 16.2: Create Task from Contact Slide-Over

In the contact slide-over right panel, click the "Add task" button (or "+ Add task"). Fill in the task details. Submit.

Verify:
- The new task appears in the contact's Tasks section
- The task is linked to this contact (contact_id is set)

---

### Test 16.3: nb_tasks Count Badge Update

Navigate to `{BASE_URL}/#/contacts`. Note the current task-related information for a contact. Open the contact slide-over. Count the tasks in the right panel.

Create a new task linked to this contact (either from the slide-over or from `/#/tasks/create`). Return to the contact slide-over.

Verify:
- The task count or task list in the right panel reflects the new task
- The Activities tab badge (`nb_activities`) also incremented (since tasks are activities)

---

### Test 16.4: Completed Task Behavior in Right Panel

Open a contact slide-over. Find a task in the right panel Tasks section. Complete it (if a checkbox is available).

Verify:
- Recently completed tasks remain visible briefly (within ~5 minutes)
- Older completed tasks are filtered out by `TasksIterator`
- Read console messages and confirm no errors

---

## Pass Criteria

### Minimum for Module Approval

- All Section 1 tests pass (CRUD Operations)
- All Section 2 tests pass (Completion Flow)
- All Section 4 tests pass (Postpone)
- All Section 8 tests pass (Validation)
- All Section 12 tests pass (STI Data Integrity)
- No critical console errors in any test

### Full Module Certification

- ALL sections pass (1-16)
- Both Desktop and iPad viewports tested (Section 9)
- All 7 task types verified (Section 6)
- Entity linking verified (Section 7)
- Snooze functionality verified (Section 3)
- Completion dialog all 3 flows verified (Section 2)
- STI field mapping verified at network level (Section 12)
- Activity linkage verified with `related_task_id` (Section 13)
- Dashboard priority tasks view verified (Section 14)
- Entity timeline integration verified (Section 15)
- Cross-entity task visibility verified (Section 16)

---

## Test Result Summary

**Last Updated:** February 3, 2026 | **Test Report:** `24-tasks-e2e-results.md`

| Section | Test Count | Passed | Failed | Skipped | Status |
|---------|------------|--------|--------|---------|--------|
| 1. CRUD Operations | 6 | 6 | 0 | 0 | :white_check_mark: 100% |
| 2. Completion Flow | 5 | 5 | 0 | 0 | :white_check_mark: 100% |
| 3. Snooze Functionality | 2 | 2 | 0 | 0 | :white_check_mark: 100% (3.2 = UI limitation) |
| 4. Postpone Tests | 3 | 3 | 0 | 0 | :white_check_mark: 100% |
| 5. Quick Actions Menu | 4 | 4 | 0 | 0 | :white_check_mark: 100% |
| 6. Task Type Tests | 7 | 7 | 0 | 0 | :white_check_mark: 100% |
| 7. Entity Linking | 5 | 4 | 1 | 0 | 🟡 80% (7.3 open issue) |
| 8. Validation Edge Cases | 7 | 7 | 0 | 0 | :white_check_mark: 100% |
| 9. Viewport Testing | 4 | 2 | 0 | 2 | 🟡 50% |
| 10. Console/Network Monitoring | 2 | 2 | 0 | 0 | :white_check_mark: 100% |
| 11. Edge Cases | 5 | 2 | 0 | 3 | 🟡 40% (11.1 observation, 11.2+11.5 pass) |
| 12. STI Data Integrity | 3 | 3 | 0 | 0 | :white_check_mark: 100% |
| 13. Completion Activity Linkage | 2 | 0 | 0 | 2 | ⚪ 0% |
| 14. Priority Tasks View | 3 | 0 | 0 | 3 | ⚪ 0% |
| 15. Entity Timeline | 2 | 0 | 0 | 2 | ⚪ 0% |
| 16. Cross-Entity Visibility | 4 | 0 | 0 | 4 | ⚪ 0% |
| **TOTAL** | **62** | **47** | **1** | **14** | **76%** |

**Module Status:** ✅ **APPROVED** - All blocking tests passed (Sections 1, 2, 4, 8, 12). ISSUE-1 open (non-blocking).

---

## Notes

### Architecture Reference

- **STI Pattern:** Tasks stored in `activities` table with `activity_type = 'task'`
- **Handler:** `tasksHandler.ts` wraps `activitiesHandler.ts` with auto-filter and field mapping
- **Field Mapping:** UI `title` = DB `subject`, UI types (Title Case) = DB types (snake_case)
- **Deprecated:** `tasks_deprecated` table exists but is not used by the app (scheduled for deletion 2026-03-21)

### Key Files

| Purpose | File |
|---------|------|
| Task Zod schema | `src/atomic-crm/validation/task.ts` |
| Activity schemas | `src/atomic-crm/validation/activities/schemas.ts` |
| Tasks handler (STI) | `src/atomic-crm/providers/supabase/handlers/tasksHandler.ts` |
| Activities callbacks | `src/atomic-crm/providers/supabase/callbacks/activitiesCallbacks.ts` |
| TasksIterator UI | `src/atomic-crm/tasks/TasksIterator.tsx` |
| Contact slide-over | `src/atomic-crm/contacts/ContactSlideOver.tsx` |
| Contact right panel | `src/atomic-crm/contacts/ContactRightPanel.tsx` |
| Entity timeline view | `supabase/migrations/20260121000003_create_entity_timeline_view.sql` |

### Known Limitations

1. **Snooze Field:** May not be exposed in standard create/edit forms - verify via slide-over or API
2. **Completion Dialog:** Only appears in Dashboard Kanban view, not in TaskList checkbox flow
3. **Postpone Visibility:** Currently shows for all tasks (visibility condition for overdue-only is a future enhancement)
4. **TasksIterator Filter:** Completed tasks older than ~5 minutes are hidden from the contact right panel

### Debugging Tips

1. Use `read_console_messages` with pattern "error" to find issues
2. Use `read_network_requests` with pattern `/rest/v1/activities` to inspect API payloads
3. Verify field mapping: `subject` in network (not `title`), snake_case types
4. Check localStorage for stale filter values if lists show unexpected results

---

## Production Safety

**Safe for Production:**
- Read/List operations (Sections 1.3, 1.4, 9, 10, 14.1)
- View operations (slide-over, details)
- Navigation tests
- Console monitoring

**Local Only (Skip in Production):**
- All create operations
- All update operations
- All delete operations
- Bulk operations
- Completion flow tests (modifies data)
