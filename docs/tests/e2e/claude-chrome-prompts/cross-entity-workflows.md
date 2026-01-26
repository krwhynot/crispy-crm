# E2E Cross-Entity Workflow Tests

**URLs:** Multiple (see each workflow)
**Goal:** Verify complete business workflows that span multiple entities function correctly end-to-end.

## Pre-Test Setup


3. Log in as a sales rep with appropriate permissions

---

## Workflow A: Lead-to-Opportunity Journey

**Business Context:** Test the complete sales pipeline from prospect identification to deal closure.

**URLs involved:**
- http://localhost:5173/#/organizations
- http://localhost:5173/#/contacts
- http://localhost:5173/#/opportunities
- http://localhost:5173/#/activities

### Pre-Test State

- [ ] No organizations exist with name "Test Workflow Org"
- [ ] Dashboard is accessible

---

### Step 1: Create Organization (Prospect)

**Given** I am on the Organizations page
**When** I create a new organization with type "prospect"
**Then** the organization should appear in the list

- [ ] Navigate to http://localhost:5173/#/organizations
- [ ] Click "Create" button
- [ ] Fill organization form:
  | Field | Value |
  |-------|-------|
  | Name | "Test Workflow Restaurant" |
  | Type | "prospect" (dropdown) |
  | Industry | "Restaurant" |
  | Website | "https://testworkflow.example.com" |
  | Phone | "555-100-0001" |
- [ ] Submit form
- [ ] Verify organization appears in list with type badge "prospect"

**Validation Checkpoint A1:**
- [ ] Organization ID is returned (note this for later steps)
- [ ] No console errors
- [ ] Type badge shows "prospect" color coding (not "customer" or "principal")

---

### Step 2: Create Contact Linked to Organization

**Given** the prospect organization exists
**When** I create a contact linked to this organization
**Then** the contact should show the organization relationship

- [ ] Navigate to http://localhost:5173/#/contacts
- [ ] Click "Create" button
- [ ] Fill contact form:
  | Field | Value |
  |-------|-------|
  | First Name | "John" |
  | Last Name | "Workflow" |
  | Email | "john@testworkflow.example.com" |
  | Title | "Purchasing Manager" |
  | Department Type | "purchasing" |
  | Organization | Select "Test Workflow Restaurant" |
  | Sales Rep | Select current user |
- [ ] Submit form
- [ ] Verify contact appears in list

**Validation Checkpoint A2:**
- [ ] Contact displays organization name in list
- [ ] Contact ID is returned (note this for later steps)
- [ ] Organization link is clickable from contact view
- [ ] Clicking organization link navigates to correct organization

---

### Step 3: Create Opportunity Linked to Contact + Organization

**Given** the contact and organization exist
**When** I create an opportunity linking both
**Then** the opportunity should appear in the Kanban as "new_lead"

- [ ] Navigate to http://localhost:5173/#/opportunities
- [ ] Click "Create" / "+" button
- [ ] Complete wizard Step 1 - Basic Info:
  | Field | Value |
  |-------|-------|
  | Name | "Q1 Beverage Deal - Test Workflow" |
  | Description | "Initial outreach for beverage line" |
  | Estimated Close Date | Select date 30 days from today |
- [ ] Complete wizard Step 2 - Classification:
  | Field | Value |
  |-------|-------|
  | Stage | "new_lead" |
  | Priority | "medium" |
  | Lead Source | "referral" |
- [ ] Complete wizard Step 3 - Organizations:
  | Field | Value |
  |-------|-------|
  | Customer Organization | "Test Workflow Restaurant" |
  | Principal Organization | Select any principal |
- [ ] Complete wizard Step 4 - Contacts:
  | Field | Value |
  |-------|-------|
  | Contacts | Select "John Workflow" |
- [ ] Submit form
- [ ] Verify opportunity appears in "new_lead" column

**Validation Checkpoint A3:**
- [ ] Opportunity card shows in correct Kanban column
- [ ] Card displays: Name, Customer org, Principal org, Priority badge
- [ ] Opportunity ID is returned (note this for later steps)
- [ ] No "undefined" or "null" values on card

---

### Step 4: Log Sample Activity on Opportunity

**Given** the opportunity exists
**When** I log a sample activity with status "sent"
**Then** the activity should appear in the opportunity timeline

- [ ] Click on the opportunity card to open SlideOver
- [ ] Navigate to "Activity" tab
- [ ] Click "Log Activity" or "+" button
- [ ] Fill activity form:
  | Field | Value |
  |-------|-------|
  | Type | "Sample" |
  | Subject | "Product samples sent to John" |
  | Activity Date | Today |
  | Sample Status | "sent" |
  | Notes | "Sent full beverage sample kit" |
  | Contact | "John Workflow" (should be pre-selected or available) |
- [ ] **Verify** follow-up is auto-required (sample activities require follow-up)
- [ ] Set follow-up date to 5 days from today
- [ ] Submit form

**Validation Checkpoint A4:**
- [ ] Activity appears in timeline
- [ ] Sample status badge shows "sent"
- [ ] Follow-up indicator visible
- [ ] `aria-invalid` not present on any fields after submission

---

### Step 5: Progress Sample Through Workflow

**Given** a sample activity exists with status "sent"
**When** I update the sample status through the workflow
**Then** each status change should be validated and persisted

#### Step 5a: Update to "received"
- [ ] Open the sample activity for editing
- [ ] Change sample_status to "received"
- [ ] Update notes: "Customer confirmed receipt"
- [ ] Verify follow-up still required
- [ ] Save changes

**Validation Checkpoint A5a:**
- [ ] Status badge updates to "received"
- [ ] Notes persisted correctly

#### Step 5b: Update to "feedback_pending"
- [ ] Edit activity again
- [ ] Change sample_status to "feedback_pending"
- [ ] Update notes: "Awaiting taste test results"
- [ ] Verify follow-up still required (active status)
- [ ] Save changes

**Validation Checkpoint A5b:**
- [ ] Status badge updates to "feedback_pending"
- [ ] Activity timeline shows chronological updates

#### Step 5c: Update to "feedback_received"
- [ ] Edit activity again
- [ ] Change sample_status to "feedback_received"
- [ ] Update notes: "Positive feedback on premium line"
- [ ] **Note:** Follow-up no longer required (workflow complete)
- [ ] Save changes

**Validation Checkpoint A5c:**
- [ ] Status badge updates to "feedback_received"
- [ ] Activity marked as workflow complete

---

### Step 6: Update Opportunity Stage Through Kanban

**Given** the opportunity has positive feedback
**When** I drag the opportunity card to a new stage
**Then** the stage should update and persist

- [ ] Navigate to http://localhost:5173/#/opportunities
- [ ] Locate the opportunity card in current column
- [ ] Drag card from "new_lead" to "initial_outreach"
- [ ] Verify card appears in new column
- [ ] Refresh page (F5)
- [ ] Verify card still in "initial_outreach" column

**Validation Checkpoint A6:**
- [ ] Drag-and-drop animation smooth
- [ ] Stage persists after refresh
- [ ] Card maintains all data (name, org, priority)

- [ ] Continue progressing: Drag to "sample_visit_offered"
- [ ] Drag to "feedback_logged"
- [ ] Drag to "demo_scheduled"
- [ ] Verify each transition persists

---

### Step 7: Close Opportunity (Won/Lost with Reason)

**Given** the opportunity is in "demo_scheduled" stage
**When** I close the opportunity
**Then** I must provide a win/loss reason

#### Scenario 7a: Close as Won
- [ ] Open opportunity SlideOver
- [ ] Click "Edit" or change stage dropdown
- [ ] Change stage to "closed_won"
- [ ] **Verify** win_reason field appears (required for closed_won)
- [ ] Select win_reason: "product_quality"
- [ ] Save changes
- [ ] Verify opportunity appears in "closed_won" column

**Validation Checkpoint A7a:**
- [ ] Win reason field is required (form doesn't submit without it)
- [ ] Win reason persists correctly
- [ ] Card shows in closed_won column with visual indicator

#### Scenario 7b: Close as Lost (test separately)
- [ ] Create a duplicate test opportunity
- [ ] Progress to any open stage
- [ ] Change stage to "closed_lost"
- [ ] **Verify** loss_reason field appears
- [ ] Select loss_reason: "competitor_relationship"
- [ ] Save changes

**Validation Checkpoint A7b:**
- [ ] Loss reason field is required
- [ ] If "other" selected, close_reason_notes field appears and is required
- [ ] Loss reason persists correctly

---

### Workflow A Success Criteria

- [ ] Complete lead-to-opportunity journey executed without errors
- [ ] All entity relationships maintain referential integrity
- [ ] Sample workflow progresses through all 4 statuses
- [ ] Kanban drag-and-drop updates persist
- [ ] Win/Loss reasons are enforced and persisted
- [ ] No console errors throughout workflow
- [ ] All transitions accessible via keyboard (a11y)

---

## Workflow B: Task Completion with Activity Logging

**Business Context:** When a sales rep completes a task, they should be prompted to log an activity or create a follow-up.

**URLs involved:**
- http://localhost:5173/#/dashboard
- http://localhost:5173/#/tasks
- http://localhost:5173/#/activities

### Pre-Test State

- [ ] At least one open task exists linked to a contact or opportunity
- [ ] Dashboard is accessible

---

### Step 1: Create Task Linked to Opportunity

**Given** an opportunity exists
**When** I create a task for that opportunity
**Then** the task should appear in the Dashboard Task Kanban

- [ ] Navigate to http://localhost:5173/#/tasks
- [ ] Click "Create" button
- [ ] Fill task form:
  | Field | Value |
  |-------|-------|
  | Title | "Follow up on Q1 Beverage proposal" |
  | Type | "Follow-up" |
  | Due Date | Tomorrow |
  | Priority | "high" |
  | Opportunity | Select an existing opportunity |
  | Assigned To | Current user |
- [ ] Submit form
- [ ] Navigate to http://localhost:5173/#/dashboard

**Validation Checkpoint B1:**
- [ ] Task appears in Dashboard task section
- [ ] Task shows priority badge (high = red/orange)
- [ ] Task shows due date
- [ ] Task ID noted for next steps

---

### Step 2: Complete Task via Dashboard Kanban Checkbox

**Given** the task exists in the Dashboard
**When** I click the completion checkbox
**Then** the TaskCompletionDialog should appear

- [ ] Locate the task card on Dashboard
- [ ] Click the completion checkbox on the task card
- [ ] **Verify** TaskCompletionDialog appears

**Validation Checkpoint B2:**
- [ ] Dialog displays task subject: "Follow up on Q1 Beverage proposal"
- [ ] Dialog shows three options:
  - "Log Activity" with FileText icon
  - "Create Follow-up" with CalendarPlus icon
  - "Just Complete" with CheckCircle icon
- [ ] Dialog has proper ARIA: `aria-describedby="task-completion-description"`
- [ ] All buttons have min-height 64px (touch target)

---

### Step 3: Select "Log Activity" Option

**Given** the TaskCompletionDialog is open
**When** I click "Log Activity"
**Then** I should be redirected to activity create with pre-filled data

- [ ] Click "Log Activity" button
- [ ] Verify navigation to `/activities/create?...`
- [ ] **Verify** URL contains pre-filled parameters:
  - `type=Follow-up` (mapped from task type)
  - `subject=Follow up on Q1 Beverage proposal`
  - `opportunity_id=[id]` (if task linked to opportunity)

**Type Parameter Mapping:**
- Task type "Follow-up" → activity URL param `type=follow_up` (snake_case)
- Task type "Call" → activity URL param `type=call`
- Task type "Email" → activity URL param `type=email`
- Task type "Meeting" → activity URL param `type=meeting`

**Validation Checkpoint B3:**
- [ ] Activity form opens with pre-filled data
- [ ] Type field shows "Follow-up"
- [ ] Subject field shows task title
- [ ] Opportunity field shows linked opportunity

---

### Step 4: Verify Activity Pre-filled with Task Context

**Given** the activity form is open with pre-filled data
**When** I review the form
**Then** all context from the task should be present

- [ ] Verify Type field is pre-selected: "Follow-up"
- [ ] Verify Subject field contains: "Follow up on Q1 Beverage proposal"
- [ ] Verify Opportunity field is pre-selected (if applicable)
- [ ] Verify Contact field is pre-selected (if task had contact)
- [ ] Fields should be editable (not locked)

**Validation Checkpoint B4:**
- [ ] Pre-filled values can be edited
- [ ] Required fields still validate
- [ ] No "undefined" values in pre-filled fields

---

### Step 5: Save Activity

**Given** the activity form has pre-filled context
**When** I complete and save the activity
**Then** the activity should be created and task marked complete

- [ ] Add/modify form fields:
  | Field | Value |
  |-------|-------|
  | Outcome | "Completed" |
  | Notes | "Discussed proposal terms, customer interested" |
  | Activity Date | Today |
- [ ] Click "Save" button
- [ ] Verify redirect (to activities list or previous page)

**Validation Checkpoint B5:**
- [ ] Activity saved successfully (toast notification)
- [ ] Activity appears in activities list
- [ ] No validation errors

---

### Step 6: Verify Task Marked Complete

**Given** the activity was saved after task completion
**When** I check the task status
**Then** the task should be marked as complete

- [ ] Navigate to http://localhost:5173/#/tasks
- [ ] Locate the completed task (may need to filter for completed)
- [ ] Verify task shows completed status
- [ ] Verify `completed_at` timestamp is set

**Validation Checkpoint B6:**
- [ ] Task no longer appears in "open" task views
- [ ] Task appears in "completed" filter if available
- [ ] Task has visual completed indicator (strikethrough, checkmark, etc.)

---

### Alternative Path: "Just Complete" Option

- [ ] Create a new test task
- [ ] Click completion checkbox
- [ ] In TaskCompletionDialog, click "Just Complete"
- [ ] Verify task is marked complete WITHOUT creating an activity
- [ ] Verify no navigation occurs (dialog just closes)

### Alternative Path: "Create Follow-up" Option

- [ ] Create a new test task
- [ ] Click completion checkbox
- [ ] In TaskCompletionDialog, click "Create Follow-up"
- [ ] Verify navigation to `/tasks/create?...`
- [ ] Verify URL contains:
  - `type=follow_up`
  - `title=Follow-up: [original task title]`
  - Related entity IDs

---

### Workflow B Success Criteria

- [ ] Task completion triggers dialog correctly
- [ ] "Log Activity" pre-fills form with task context
- [ ] Activity creation completes without errors
- [ ] Task marked complete after activity save
- [ ] "Just Complete" and "Create Follow-up" paths work
- [ ] All dialog options have proper touch targets (44px+)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] No console errors throughout workflow

---

## Workflow C: Quick Activity Multi-Entry

**Business Context:** Sales reps need to rapidly log multiple activities in succession using the Dashboard FAB.

**URLs involved:**
- http://localhost:5173/#/dashboard

### Pre-Test State

- [ ] At least one contact exists with a valid organization
- [ ] Dashboard FAB is visible and accessible

---

### Step 1: Open Dashboard

**Given** I am logged in
**When** I navigate to the Dashboard
**Then** I should see the Quick Action FAB

- [ ] Navigate to http://localhost:5173/#/dashboard
- [ ] Verify FAB (Floating Action Button) is visible
- [ ] FAB should be in fixed position (bottom-right typically)
- [ ] FAB should have proper touch target (44px minimum)

**Validation Checkpoint C1:**
- [ ] FAB has `aria-label` describing its action
- [ ] FAB has sufficient color contrast
- [ ] FAB is keyboard accessible (Tab navigation)

---

### Step 2: Click FAB to Open QuickLogActivityDialog

**Given** the Dashboard is loaded
**When** I click the FAB
**Then** the QuickLogActivityDialog should open

- [ ] Click the FAB button
- [ ] Verify QuickLogActivityDialog Sheet slides in from right
- [ ] Verify dialog has proper header: "Log Activity"
- [ ] Verify dialog shows description: "Quick capture for calls, meetings, and notes"

**Validation Checkpoint C2:**
- [ ] Sheet has proper ARIA labels (`aria-labelledby`, `aria-describedby`)
- [ ] Focus moves to dialog content
- [ ] ESC key closes dialog
- [ ] Clicking overlay closes dialog

---

### Step 3: Log Call Activity with Contact

**Given** the QuickLogActivityDialog is open
**When** I fill in a call activity
**Then** I should be able to save and continue

- [ ] Select Activity Type: "Call"
- [ ] Select Outcome: "Connected"
- [ ] Select or search for a Contact
- [ ] **Note:** If recently viewed contacts exist, they may be pre-suggested
- [ ] Enter Notes: "Discussed upcoming product launch"
- [ ] Date should default to today (verify)

**Validation Checkpoint C3:**
- [ ] Activity type grouping visible (Communication, Meetings, Documentation)
- [ ] Contact combobox supports search
- [ ] Notes field has proper minimum height
- [ ] "Save & New" button is visible

---

### Step 4: Click "Save & New"

**Given** the activity form is filled
**When** I click "Save & New"
**Then** the activity should save and form should reset for new entry

- [ ] Click "Save & New" button
- [ ] Verify success toast notification appears
- [ ] Verify form resets to empty/default state
- [ ] Verify dialog stays open for next entry
- [ ] **Verify** Contact field retains recently used value OR clears (document behavior)

**Validation Checkpoint C4:**
- [ ] Activity saved successfully
- [ ] Form fields reset appropriately
- [ ] Dialog remains open
- [ ] No console errors

---

### Step 5: Log Email Activity with Same Contact

**Given** the form has reset after "Save & New"
**When** I log a second activity
**Then** I should be able to complete it with "Save & Close"

- [ ] Select Activity Type: "Email"
- [ ] Select Outcome: "Completed"
- [ ] Select the same Contact as Step 3 (or re-select)
- [ ] Enter Notes: "Sent follow-up email with product specs"
- [ ] Optionally check "Create Follow-up" toggle
  - [ ] If checked, verify follow-up date field appears

**Validation Checkpoint C5:**
- [ ] Email activity type selectable
- [ ] Same contact can be selected again
- [ ] "Save & Close" button is visible

---

### Step 6: Click "Save & Close"

**Given** the second activity form is filled
**When** I click "Save & Close"
**Then** the activity should save and dialog should close

- [ ] Click "Save & Close" button
- [ ] Verify success toast notification appears
- [ ] Verify QuickLogActivityDialog closes
- [ ] Verify Dashboard is visible again

**Validation Checkpoint C6:**
- [ ] Dialog closes smoothly
- [ ] Focus returns to FAB or appropriate element
- [ ] No console errors

---

### Step 7: Verify Both Activities in Timeline

**Given** two activities were created
**When** I check the activity timeline
**Then** both activities should appear

- [ ] Navigate to http://localhost:5173/#/activities
- [ ] Or check Dashboard Activity Feed panel
- [ ] Verify Call activity appears with correct:
  - [ ] Type: "Call"
  - [ ] Notes: "Discussed upcoming product launch"
  - [ ] Contact name
  - [ ] Today's date
- [ ] Verify Email activity appears with correct:
  - [ ] Type: "Email"
  - [ ] Notes: "Sent follow-up email with product specs"
  - [ ] Contact name
  - [ ] Today's date

**Validation Checkpoint C7:**
- [ ] Both activities visible
- [ ] Correct type icons displayed
- [ ] Chronological ordering (most recent first or as configured)
- [ ] Contact/Organization relationships maintained

---

### Edge Cases for Quick Activity Entry

#### Draft Persistence
- [ ] Open QuickLogActivityDialog
- [ ] Fill some fields but don't save
- [ ] Close dialog (ESC or overlay click)
- [ ] Re-open dialog
- [ ] **Verify** draft is restored (if `enableDraftPersistence: true`)
- [ ] Verify "Draft" badge appears in header

#### Entity Context Pre-fill
- [ ] Navigate to a specific Contact's SlideOver
- [ ] Open activity log from Contact context
- [ ] **Verify** Contact field is pre-filled and locked
- [ ] Verify "Locked" badge appears on field
- [ ] Verify cannot change the pre-filled contact

#### Sample Activity Type
- [ ] In QuickLogActivityDialog, select Type: "Sample"
- [ ] **Verify** Sample Status field appears
- [ ] Verify sample_status is required
- [ ] Fill sample_status: "sent"
- [ ] **Verify** follow-up is auto-required
- [ ] Save and verify sample status persists

---

### Workflow C Success Criteria

- [ ] FAB opens QuickLogActivityDialog correctly
- [ ] "Save & New" saves and resets form
- [ ] "Save & Close" saves and closes dialog
- [ ] Multiple activities can be logged in succession
- [ ] All activities persist with correct data
- [ ] Draft persistence works when enabled
- [ ] Entity context pre-fill works from resource views
- [ ] Sample activities require sample_status
- [ ] Touch targets all >= 44px
- [ ] Keyboard navigation works throughout
- [ ] No console errors during multi-entry workflow

---

## Accessibility Checklist (All Workflows)

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Enter/Space activates buttons and checkboxes
- [ ] Escape closes dialogs/sheets
- [ ] Arrow keys navigate dropdowns/comboboxes
- [ ] Focus visible on all focused elements

### ARIA Attributes
- [ ] Dialogs have `aria-labelledby` and `aria-describedby`
- [ ] Invalid fields have `aria-invalid="true"`
- [ ] Error messages linked via `aria-describedby`
- [ ] Status badges have `aria-label` or visible text
- [ ] Kanban columns have proper ARIA landmarks

### Touch Targets
- [ ] All buttons minimum 44px height
- [ ] Checkboxes have adequate touch area
- [ ] Combobox triggers are easily tappable
- [ ] FAB is appropriately sized

### Color Contrast
- [ ] Text meets WCAG AA contrast ratios
- [ ] Error states not indicated by color alone
- [ ] Priority badges have sufficient contrast

---

## Report Issues As

```
**Workflow:** [A/B/C]
**Step:** [Step number]
**Issue:** [Description]
**Expected:** [Expected behavior]
**Actual:** [Actual behavior]
**Severity:** Critical | High | Medium | Low
**Screenshot:** [If applicable]
```

---

## Cross-Entity Workflow Success Summary

- [ ] **Workflow A (Lead-to-Opportunity):** All 7 steps pass
- [ ] **Workflow B (Task Completion):** All 6 steps pass
- [ ] **Workflow C (Quick Activity Multi-Entry):** All 7 steps pass
- [ ] **Accessibility:** All checks pass
- [ ] **No console errors** during any workflow
- [ ] **Data integrity** maintained across all entity relationships
