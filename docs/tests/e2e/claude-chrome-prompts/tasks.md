# E2E Field Validation Test: Tasks

**URL:** http://localhost:5173/#/tasks
**Goal:** Verify all Task data fields display, accept input, validate, and persist correctly. Test snooze functionality and task completion workflows.

## Pre-Test Setup

1. Ensure dev server is running (`just dev`)
2. Confirm test data exists (`just seed-e2e` if needed)

---

## Test Sequence

### Phase 1: Task List Validation

- [ ] Navigate to http://localhost:5173/#/tasks
- [ ] Verify columns display: Done (checkbox), Title, Due Date, Priority, Type, Assigned To, Contact, Opportunity, Actions
- [ ] Check no "undefined", "null", or empty cells where data should exist
- [ ] Test text filter (search by title)
- [ ] Test type filter dropdown (7 values: Call, Email, Meeting, Follow-up, Demo, Proposal, Other)
- [ ] Test priority filter dropdown (4 values: low, medium, high, critical)
- [ ] Verify sorting on Due Date column
- [ ] Verify sorting on Priority column
- [ ] Test Done checkbox - clicking should trigger TaskCompletionDialog
- [ ] Confirm row click opens SlideOver or navigates to edit
- [ ] Test Actions menu dropdown:
  - [ ] View option
  - [ ] Edit option
  - [ ] Postpone to Tomorrow option
  - [ ] Postpone to Next Week option
  - [ ] Delete option
- [ ] Screenshot any display issues

### Phase 2: Create Task Form (Tabbed)

- [ ] Click "Create" button
- [ ] Verify tabbed form displays with General tab and Details tab

#### General Tab Fields:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Title | empty, whitespace-only, >500 chars | "Follow up on sample request" | Required error, max length enforced |
| Type | - | Select from dropdown | **REQUIRED** - dropdown shows 7 types (Call, Email, Meeting, Follow-up, Demo, Proposal, Other) |
| Priority | - | Select from dropdown | Dropdown shows 4 levels (low, medium, high, critical), defaults to "medium" |
| Due Date | empty | Select date | **REQUIRED** - date picker works |
| Reminder Date | - | Select date | Optional date picker |
| Assigned To (sales_id) | empty | Select from dropdown | **REQUIRED** - dropdown populates with sales reps |

#### Details Tab Fields:

| Field | Test Invalid | Test Valid | Expected Behavior |
|-------|-------------|------------|-------------------|
| Description | >2000 chars | "Discuss pricing options" | Max length enforced |
| Contact | - | Select from dropdown | Optional - dropdown populates |
| Opportunity | - | Select from dropdown | Optional - dropdown populates |
| Organization | - | Select from dropdown | Optional - dropdown populates |

- [ ] Submit empty form - verify all required errors show simultaneously
- [ ] Verify error styling: red border, error text visible
- [ ] Verify `aria-invalid="true"` on invalid fields
- [ ] Verify error messages have `role="alert"` or linked via `aria-describedby`
- [ ] Fill all fields correctly and submit
- [ ] Confirm redirect and new task appears in list

### Phase 3: Edit Task Form

- [ ] Open existing task from list
- [ ] Verify all fields pre-populated correctly across both tabs
- [ ] Test edit scenarios:
  - [ ] Change title -> Save -> Reload -> Verify persisted
  - [ ] Change type -> Save -> Verify persisted
  - [ ] Change priority -> Save -> Verify persisted
  - [ ] Change due date -> Save -> Verify persisted
  - [ ] Add/change contact association -> Save -> Verify persisted
  - [ ] Add/change opportunity association -> Save -> Verify persisted
  - [ ] Clear required field (title) -> Verify error appears on save
- [ ] Test Snooze functionality:
  - [ ] Use "Postpone to Tomorrow" -> Verify snooze_until set to tomorrow
  - [ ] Use "Postpone to Next Week" -> Verify snooze_until set to next week
  - [ ] Verify snoozed task appears with snooze indicator
- [ ] Test Cancel button doesn't save changes

### Phase 4: Task SlideOver/Detail View

- [ ] Click task row to open SlideOver (if applicable)
- [ ] Verify Details tab displays:
  - [ ] Title
  - [ ] Type badge
  - [ ] Priority badge (color-coded)
  - [ ] Due date
  - [ ] Reminder date (if set)
  - [ ] Description
  - [ ] Assigned To name
  - [ ] Completed status
- [ ] Verify Related Items tab displays:
  - [ ] Contact link (clickable)
  - [ ] Opportunity link (clickable)
  - [ ] Organization link (clickable)
- [ ] Verify Edit button opens edit form
- [ ] Verify Complete/Uncomplete toggle works

### Phase 5: Accessibility Audit

- [ ] Tab through form - all fields reachable across both tabs
- [ ] Focus states visible on all inputs, buttons, and tabs
- [ ] Buttons/clickable areas >= 44px tall (check with dev tools)
- [ ] Error messages readable (not just color-coded)
- [ ] Tab navigation works correctly (General <-> Details)
- [ ] Done checkbox in list is keyboard accessible
- [ ] Actions menu dropdown is keyboard navigable
- [ ] Priority badges have accessible color contrast
- [ ] TaskCompletionDialog is keyboard navigable

### Phase 6: Edge Cases

- [ ] Create task with minimum required fields only (title, type, due_date, sales_id)
- [ ] Create task with all fields filled
- [ ] Test TaskCompletionDialog workflow:
  - [ ] Click Done checkbox on incomplete task
  - [ ] Verify dialog shows options: Log Activity, Create Follow-up, Just Complete
  - [ ] Test "Log Activity" option - verify redirects to activity creation
  - [ ] Test "Create Follow-up" option - verify creates new task
  - [ ] Test "Just Complete" option - verify marks task complete
- [ ] Test postpone behavior:
  - [ ] Postpone to Tomorrow sets correct date
  - [ ] Postpone to Next Week sets correct date (7 days from today)
  - [ ] Snoozed tasks can be un-snoozed
- [ ] Test task with all associations (contact + opportunity + organization)
- [ ] Test task with only contact association
- [ ] Test task with only opportunity association
- [ ] Test task with critical priority - verify visual indicator
- [ ] Test overdue task (due_date in past) - verify visual indicator
- [ ] Search for task with special characters in title

---

## Expected Task Fields (from Zod Schema)

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| title | string | YES | min 1, max 500, trimmed |
| description | string | NO | max 2000, nullable |
| due_date | date | YES | coerced date |
| reminder_date | date | NO | coerced date, nullable |
| type | enum | YES | Call, Email, Meeting, Follow-up, Demo, Proposal, Other |
| priority | enum | NO | low, medium, high, critical (default: "medium") |
| sales_id | number | YES | positive integer (assigned to) |
| contact_id | number | NO | positive integer, nullable |
| opportunity_id | number | NO | positive integer, nullable |
| organization_id | number | NO | positive integer, nullable |
| snooze_until | date | NO | nullable (empty string transforms to null) |
| completed | boolean | NO | coerced boolean (default: false) |
| completed_at | string | NO | max 50, nullable |

---

## Report Issues As

```
**Field:** due_date
**Issue:** No validation error when leaving due date empty
**Expected:** Error message "Due date is required"
**Actual:** Form submits, then API returns 400
**Severity:** High - validation should be client-side
```

---

## Success Criteria

- [ ] All required fields enforce validation (title, type, due_date, sales_id)
- [ ] All 7 task types selectable and display correctly
- [ ] All 4 priority levels selectable with visual distinction
- [ ] Snooze functionality works (Postpone to Tomorrow/Next Week)
- [ ] TaskCompletionDialog workflow functions correctly
- [ ] Tabbed form navigation works (General/Details)
- [ ] All fields save and persist correctly
- [ ] List displays all data without errors (columns, filters, sorting)
- [ ] Accessibility requirements met (ARIA, touch targets, keyboard nav)
- [ ] No console errors during testing
