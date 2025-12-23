# E2E Manual Testing Workflow: Task Forms

## Purpose
Step-by-step guide to manually test all task form touchpoints in Crispy CRM: Create, Quick Add, Edit, SlideOver, List, Dashboard Kanban, and Completion Flow. Use this to identify UX issues, verify form completion, validate task lifecycle, and ensure the completion-to-activity logging flow works correctly.

**Scope:** All 7 task types (Call, Email, Meeting, Follow-up, Demo, Proposal, Other) with 4 priority levels and completion workflows.

---

## WHAT TO OBSERVE & NOTE WHILE TESTING

### Performance Notes
- [ ] How long does each dropdown/autocomplete take to load?
- [ ] Any lag when toggling the completion checkbox?
- [ ] Does the SlideOver open smoothly?
- [ ] Are list filters responsive?
- [ ] Does kanban drag-drop update feel instant?
- [ ] Does the QuickLogActivity dialog open without delay after completion?

### UX Friction Points
- [ ] Were any required fields not clearly marked?
- [ ] Did you get confused about what to enter in any field?
- [ ] Were error messages helpful or cryptic?
- [ ] Did tab order make sense (keyboard navigation)?
- [ ] Did any field lack placeholder text that would help?
- [ ] Was task type selection intuitive?
- [ ] Was the difference between "snooze" and "postpone" clear?

### Form Behavior
- [ ] Did defaults populate correctly (Priority: medium, Sales: you)?
- [ ] Did due_date default to today on create?
- [ ] Did completion checkbox trigger `completed_at` timestamp?
- [ ] Did QuickLogActivity dialog appear after completion?
- [ ] Did activity type auto-infer from task type?
- [ ] Did postpone options appear contextually (Tomorrow if overdue)?

### Accessibility
- [ ] Could you complete the form with keyboard only?
- [ ] Were touch targets large enough (44x44px minimum)?
- [ ] Did focus states appear clearly?
- [ ] Did error messages have proper ARIA attributes?
- [ ] Did completion checkbox have proper label?

---

## WORKFLOW A: FULL TASK CREATE FORM

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Tasks** in sidebar
3. Click **"Create"** button (top right)

---

### STEP 1: General Tab (Default)

**Goal:** Enter core task information.

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Title** | "Call John about Q1 proposal" | YES | Was it auto-focused? Max 500 chars. |
| **Description** | "Discuss pricing and timeline for Q1 launch" | NO | Max 2000 chars. Multiline textarea? |
| **Due Date** | Select tomorrow | YES | Date picker UX? Default to today? |
| **Reminder Date** | Select day before due date | NO | Can be before or after due date? |

**Date Picker Behavior:**
- Does clicking input open calendar?
- Can you type date directly?
- Is today highlighted/selectable?
- Clear button available?

---

### STEP 2: Details Tab

**Goal:** Set classification and assignment fields.

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| **Priority** | Select "high" | NO (default: medium) | Badge styling for each level? |
| **Type** | Select "Call" | YES | All 7 types visible? |
| **Assigned To** | Your name | YES | Pre-selected to current user? |
| **Contact** | Search and select any contact | NO | Autocomplete responsive? |
| **Opportunity** | Search and select any opportunity | NO | Shows opportunity name + stage? |
| **Organization** | Leave empty (inherits from contact) | NO | Auto-fills from contact? |

**Task Type Options to Test:**
| Type | Icon | When to Use |
|------|------|-------------|
| Call | Phone icon | Phone conversations |
| Email | Mail icon | Email correspondence |
| Meeting | Calendar icon | In-person or virtual meetings |
| Follow-up | RotateCcw icon | Continuing previous conversation |
| Demo | Presentation icon | Product demonstrations |
| Proposal | FileText icon | Sending proposals/quotes |
| Other | MoreHorizontal icon | Miscellaneous tasks |

**Priority Badge Styling:**
| Priority | Color | Visual |
|----------|-------|--------|
| low | Muted/gray | Low contrast |
| medium | Default | Standard styling |
| high | Warning/amber | Attention-getting |
| critical | Destructive/red | Urgent styling |

---

### STEP 3: Save the Task

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save & Close"** button | Button location clear? Primary styling? |
| 2. Watch for validation errors | Which fields (if any) failed? Helpful messages? |
| 3. If successful, note redirect | Goes to task list? |

**Alternative Save Options:**
| Button | Behavior |
|--------|----------|
| **Cancel** | Prompts if unsaved changes, returns to list |
| **Save & Close** | Saves and navigates to task list |
| **Save & Add Another** | Saves and clears form for next task |

**After Save:**
- [ ] Does task appear in list?
- [ ] Is all entered data visible in SlideOver?
- [ ] Is assigned sales rep shown correctly?
- [ ] Is priority badge displayed?

---

## WORKFLOW B: QUICK ADD TASK DIALOG

### Pre-Requisites
1. Navigate to a **Contact** detail view (SlideOver or full page)
2. Find the **"Add Task"** chip button in the sidebar

---

### STEP 1: Open Quick Add Dialog (From Contact)

| Action | What to Note |
|--------|--------------|
| 1. Click the "Add Task" chip | Does dialog open smoothly? |
| 2. Check pre-filled fields | Is contact_id pre-filled? |
| 3. Check sales_id | Is current user pre-selected? |

**Pre-filled Values Expected:**
| Field | Expected Value |
|-------|----------------|
| Contact | Current contact (pre-selected) |
| Assigned To | Current user (you) |
| Due Date | Today (default) |

---

### STEP 2: Complete Minimal Form

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| **Title** | "Follow up on meeting" | Required field |
| **Due Date** | Leave as today or change | Required field |
| **Type** | Select "Follow-up" | Required field |
| **Description** | Optional - leave empty | Not required |

---

### STEP 3: Save and Verify

| Action | What to Note |
|--------|--------------|
| 1. Click **"Save"** button | Dialog closes? |
| 2. Check contact's task list | New task appears? |
| 3. Check contact's `last_seen` | Updated timestamp? |

**Post-Save Verification:**
- [ ] Task created with correct contact link
- [ ] Task appears in main task list
- [ ] Contact's `last_seen` timestamp updated
- [ ] Notification/toast shown?

---

### STEP 4: Quick Add from Opportunity Context

Repeat the above from an **Opportunity** view:
1. Navigate to any Opportunity
2. Find task creation entry point
3. Verify opportunity context is captured

---

## WORKFLOW C: TASK SLIDE-OVER PANEL

### Pre-Requisites
1. Navigate to **Tasks** list
2. Click on any task row
3. SlideOver should open (40vw right panel, URL: `?view={id}`)

---

### STEP 1: Details Tab (Default - View Mode)

| Check | What to Note |
|-------|--------------|
| Tab is active by default? | "Details" should be selected |
| View mode vs Edit mode? | Is there a pencil/edit toggle icon? |
| All fields displayed? | Title, description, dates, priority, type |

**View Mode Field Display:**

| Section | Fields Shown |
|---------|--------------|
| **Header** | Title, completion checkbox (always active) |
| **Card** | Description (if any) |
| **Schedule** | Due Date, Reminder Date |
| **Classification** | Priority badge, Type badge |
| **Assignment** | Assigned To (sales rep name) |
| **Timeline** | Created at, Updated at |

---

### STEP 2: Inline Completion Checkbox

**CRITICAL TEST:** Completion checkbox works even in view mode.

| Action | Expected Behavior |
|--------|-------------------|
| 1. Find checkbox in header | Should be 44x44px touch target |
| 2. Click to mark complete | Checkbox fills, completed_at set |
| 3. Check strikethrough styling | Title gets strikethrough? |
| 4. QuickLogActivity dialog | Should open automatically |
| 5. Skip or log activity | Dialog closes appropriately |
| 6. Uncheck to mark incomplete | Checkbox clears, completed_at nulled |

---

### STEP 3: Edit Mode Toggle

| Action | What to Note |
|--------|--------------|
| 1. Click edit/pencil icon | Mode switches to edit |
| 2. Form inputs appear | TextInputs, DateInputs, SelectInputs |
| 3. Modify any field | Real-time typing works? |
| 4. Save changes | Persists correctly? |
| 5. Cancel edit | Reverts changes? |

**Edit Mode Fields:**
| Field | Input Type |
|-------|------------|
| Title | TextInput |
| Description | TextInput (multiline) |
| Due Date | DateInput |
| Reminder Date | DateInput |
| Priority | SelectInput (4 options) |
| Type | SelectInput (7 options) |
| Completed | BooleanInput |
| Assigned To | ReferenceInput (sales) |
| Contact | ReferenceInput |
| Opportunity | ReferenceInput |

---

### STEP 4: Related Items Tab

| Check | What to Note |
|-------|--------------|
| Tab label | "Related Items" with link icon? |
| Organization link | If linked, shows org name with Building2 icon |
| Contact link | If linked, shows contact name with UserCircle icon |
| Opportunity link | If linked, shows opp name with Target icon |
| Sales Rep | Shows assignee with User icon |
| Click navigation | Links open respective detail views? |

**Empty State:**
| Scenario | Expected |
|----------|----------|
| No organization linked | Shows placeholder or empty |
| No contact linked | Shows placeholder or empty |
| No opportunity linked | Shows placeholder or empty |

---

### STEP 5: Close Behaviors

| Action | Expected |
|--------|----------|
| Press ESC key | SlideOver closes |
| Click outside panel | SlideOver closes |
| Click X button | SlideOver closes |
| Check URL | `?view=` param removed |

---

## WORKFLOW D: TASK EDIT & POSTPONE

### Pre-Requisites
1. Navigate to **Tasks** list or Dashboard
2. Find a task with the dropdown menu (three dots or more icon)

---

### STEP 1: Edit from Dropdown Menu

| Action | What to Note |
|--------|--------------|
| 1. Click dropdown menu on task | Menu opens? |
| 2. Click "Edit" option | Edit dialog opens? |
| 3. Modify title | Change works? |
| 4. Save changes | Dialog closes, task updated? |

---

### STEP 2: Postpone to Tomorrow

**Condition:** Only appears if task due date is today or earlier (overdue).

| Action | What to Note |
|--------|--------------|
| 1. Find overdue task | Due date ≤ today |
| 2. Open dropdown menu | "Postpone to tomorrow" visible? |
| 3. Click postpone option | Due date updates to tomorrow? |
| 4. Check list refresh | Task moves to correct position? |

---

### STEP 3: Postpone to Next Week

**Condition:** Only appears if task due date is before next Monday.

| Action | What to Note |
|--------|--------------|
| 1. Find task due before next Monday | |
| 2. Open dropdown menu | "Postpone to next week" visible? |
| 3. Click postpone option | Due date updates to next Monday? |

**Postpone Logic:**
| Current Due Date | Tomorrow Option | Next Week Option |
|------------------|-----------------|------------------|
| Yesterday (overdue) | Shows | Shows |
| Today | Shows | Shows |
| Tomorrow | Hidden | Shows |
| Next Monday | Hidden | Hidden |
| Next Tuesday+ | Hidden | Hidden |

---

### STEP 4: Delete with Undo

| Action | What to Note |
|--------|--------------|
| 1. Click "Delete" in dropdown | Confirmation? Or immediate? |
| 2. Task removed from list | Soft delete (deleted_at set) |
| 3. Undo notification appears | Duration (~5 seconds)? |
| 4. Click "Undo" | Task restored? |
| 5. Let undo expire | Task remains deleted |

---

## WORKFLOW E: DASHBOARD KANBAN

### Pre-Requisites
1. Navigate to **Dashboard**
2. Find the Tasks Kanban Panel
3. Ensure you have tasks with various due dates

---

### STEP 1: Column Structure

| Column | Due Date Range | Accent Color |
|--------|----------------|--------------|
| **Overdue** | Before today | Destructive (red) |
| **Today** | Today | Primary |
| **This Week** | Tomorrow through +7 days | Muted |

**Column Verification:**
| Check | What to Note |
|-------|--------------|
| Column headers visible? | Title + task count badge |
| Empty state messages? | "No overdue tasks" etc. |
| Task cards in correct columns? | Based on due_date |

---

### STEP 2: Task Card Display

| Element | What to Note |
|---------|--------------|
| Drag handle | GripVertical icon, cursor-grab |
| Completion checkbox | 44px, CheckCircle2 icon |
| Task title | Truncated if long? |
| Type icon | Matches task type |
| Related entity | Shows "→ Contact Name" format |
| Priority badge | Bottom-left, colored by priority |
| Due date label | Bottom-right |

---

### STEP 3: Drag-Drop Due Date Update

| Action | Expected Behavior |
|--------|-------------------|
| 1. Grab task from "Overdue" column | Cursor changes to grabbing |
| 2. Drag to "Today" column | Visual drop indicator |
| 3. Release in "Today" column | Task stays in Today |
| 4. Check task's due_date | Updated to today |
| 5. Drag from "Today" to "This Week" | Due date updates to tomorrow |

**Drag-Drop Column Mapping:**
| Drop Target | New Due Date |
|-------------|--------------|
| Overdue | Yesterday (unusual case) |
| Today | Today |
| This Week | Tomorrow |

---

### STEP 4: Inline Card Actions

| Action | Expected |
|--------|----------|
| Click checkbox | Marks complete, shows follow-up toast |
| Click snooze button (AlarmClock) | Opens snooze options? |
| Click more menu | View, Edit, Delete options |
| Click "View" | Opens task SlideOver |
| Click "Edit" | Opens edit dialog |
| Click "Delete" | Deletes with undo |

---

### STEP 5: Mobile Layout (< 1024px)

| Check | What to Note |
|-------|--------------|
| Columns stack vertically | Not side-by-side |
| Touch targets still 44px+ | Usable on tablet |
| Drag-drop still works | May be different gesture |

---

## WORKFLOW F: TASK COMPLETION FLOW

### Pre-Requisites
1. Have an incomplete task ready
2. Know the task's type (for activity inference)

---

### STEP 1: Toggle Completion Checkbox

| Location | Action | What to Note |
|----------|--------|--------------|
| Task List | Click checkbox in "Done" column | Row updates? |
| SlideOver | Click checkbox in header | View updates? |
| Dashboard Kanban | Click checkbox on card | Card updates? |

---

### STEP 2: Verify completed_at Timestamp

| Check | Expected |
|-------|----------|
| completed field | Set to `true` |
| completed_at field | ISO timestamp of completion time |
| Visual indicator | Strikethrough on title? |

**Timestamp Format:** ISO 8601 (e.g., "2024-12-22T15:30:00.000Z")

---

### STEP 3: QuickLogActivity Dialog

**Dialog appears automatically after marking task complete.**

| Element | What to Note |
|---------|--------------|
| Dialog title | "Log Activity" or similar? |
| Activity type grid | 13 types in groups? |
| Pre-selected type | Inferred from task type? |
| Notes pre-filled | "Completed task: {title}"? |
| Skip button | Closes without logging? |
| Save button | Creates activity record? |

**Activity Type Inference:**
| Task Type | Inferred Activity |
|-----------|-------------------|
| Call | call |
| Email | email |
| Meeting | meeting |
| Demo | demo |
| Proposal | proposal |
| Follow-up | check_in |
| Other | check_in |

---

### STEP 4: Activity Type Groups

**Communication:**
- Call, Email, Check-in, Social

**Meetings:**
- Meeting, Demo, Site Visit, Trade Show

**Documentation:**
- Proposal, Contract Review, Follow-up, Note, Sample

---

### STEP 5: Skip vs Log Activity

| Choice | Expected Result |
|--------|-----------------|
| Click "Skip" | Dialog closes, no activity created |
| Select type + "Save" | Activity created, linked to task |
| Close dialog (X) | Same as Skip |

**Activity Created Fields:**
| Field | Value |
|-------|-------|
| activity_type | "interaction" |
| type | Selected activity type |
| subject | "Completed: {task.title}" |
| related_task_id | Task ID |
| organization_id | From linked opportunity |
| follow_up_required | false |

---

### STEP 6: Uncomplete Task

| Action | Expected |
|--------|----------|
| Uncheck completed checkbox | completed = false |
| completed_at cleared | Set to null |
| Strikethrough removed | Title normal again |
| QuickLogActivity | Does NOT appear on uncomplete |

---

## WORKFLOW G: TASK LIST & FILTERS

### Pre-Requisites
1. Navigate to **Tasks** in sidebar
2. Have multiple tasks with varying statuses, priorities, types

---

### STEP 1: List Columns

| Column | Sortable? | Filter? | Visibility |
|--------|-----------|---------|------------|
| Done | No | No | Always |
| Title | Yes | Text (debounced) | Always |
| Due Date | Yes | No (use sidebar) | Always |
| Priority | Yes | Multi-select | Always |
| Type | Yes | Multi-select | Desktop only |
| Assigned To | Yes | Reference | Desktop only |
| Contact | No | No | Desktop only |
| Opportunity | No | No | Desktop only |

---

### STEP 2: Sidebar Filters

| Filter Category | Options | What to Note |
|-----------------|---------|--------------|
| **Due Date** | Today, This Week, Overdue | ToggleFilterButton style |
| **Status** | Incomplete, Completed | ToggleFilterButton style |
| **Assigned To** | Sales rep dropdown | OwnerFilterDropdown |

**Due Date Filter Logic:**
| Option | Date Range |
|--------|------------|
| Today | startOfToday → endOfToday |
| This Week | startOfToday → +7 days |
| Overdue | Before today AND completed=false |

---

### STEP 3: Column Filters

| Column | Filter Type | Behavior |
|--------|-------------|----------|
| Title | Text input | Debounced 300ms, expands on click |
| Priority | Checkbox popover | Multi-select: low, medium, high, critical |
| Type | Checkbox popover | Multi-select: Call, Email, Meeting, etc. |

**Test Filter Combinations:**
| Scenario | Expected |
|----------|----------|
| Overdue + High Priority | Shows only overdue high-priority tasks |
| Incomplete + Type: Call | Shows incomplete call tasks only |
| Today + Assigned To: You | Your tasks due today |

---

### STEP 4: Search Bar

| Action | What to Note |
|--------|--------------|
| Type in search | Searches title and description |
| Search "proposal" | Returns tasks with "proposal" in title/description |
| Clear search | Returns to filtered list |
| Search non-existent | "No tasks found" empty state |

---

### STEP 5: CSV Export

| Action | What to Note |
|--------|--------------|
| 1. Click Export button | Triggers download |
| 2. Check filename | tasks.csv or similar |
| 3. Open CSV | Columns match expected? |

**CSV Export Columns:**
| Column | Data |
|--------|------|
| id | Task ID |
| title | Task title |
| description | Task description |
| type | Task type |
| priority | Priority level |
| due_date | ISO date |
| completed | "Yes" or "No" |
| completed_at | Timestamp if completed |
| principal | Organization name (via opportunity) |
| opportunity_id | Linked opportunity |
| contact_id | Linked contact |
| created_at | Creation timestamp |

---

### STEP 6: Keyboard Navigation

| Key | Expected Behavior |
|-----|-------------------|
| ArrowDown | Move to next row |
| ArrowUp | Move to previous row |
| Enter | Open selected task in SlideOver |

---

## WORKFLOW H: VALIDATION EDGE CASES

### TEXT FIELD LIMITS

| Field | Max Length | Test This | Expected Result |
|-------|------------|-----------|-----------------|
| Title | 500 chars | Paste 600+ characters | Truncate or error before save |
| Description | 2000 chars | Paste 2500+ characters | Truncate or error before save |

---

### REQUIRED FIELD VALIDATION

| Scenario | Expected Error | What to Note |
|----------|----------------|--------------|
| Submit with empty Title | "Title is required" | Error near field? |
| Submit with whitespace-only Title | Should trim and error | Whitespace handling? |
| Submit without Due Date | "Due date is required" | Date picker error state? |
| Submit without Type | "Type is required" | Select shows error? |
| Submit without Assigned To | Should error (sales_id required) | Reference field error? |

---

### DATE VALIDATION

| Scenario | Expected Behavior |
|----------|-------------------|
| Due date in past | Allowed (creates overdue task) |
| Reminder date without due date | N/A (due date required first) |
| Reminder after due date | Allowed (warning?) |
| Clear due date on edit | Should error on save |

---

### SPECIAL CHARACTERS & INJECTION

| Test | Input | Expected |
|------|-------|----------|
| HTML in Title | `<script>alert('xss')</script>` | Sanitize, not execute |
| HTML in Description | `<b>Bold</b><script>bad</script>` | Sanitize script |
| SQL-like in Title | `'; DROP TABLE tasks; --` | Save as literal text |
| Unicode in Title | "Café Açaí 日本語" | Save correctly |
| Emoji in Title | "📞 Call client 🎯" | Save correctly |
| Very long word | "aaaa...(500 a's)" | Handle without UI break |

---

### REFERENCE FIELD EDGE CASES

| Scenario | Expected Behavior |
|----------|-------------------|
| Select deleted contact | Should not be selectable |
| Select deleted opportunity | Should not be selectable |
| Contact without organization | No organization auto-filled |
| Remove contact after selection | organization_id remains or clears? |

---

### COMPLETION EDGE CASES

| Scenario | Expected |
|----------|----------|
| Complete task with no contact | QuickLogActivity still opens |
| Complete task, skip activity, uncomplete | No orphan activity created |
| Complete same task twice rapidly | Idempotent (one completed_at) |
| Complete in offline mode | Queued and synced? Or error? |

---

## ISSUE REPORTING TEMPLATE

Use this format to report issues found:

```
### Issue: [Short Title]

**Location:** [Form name / Section / Field]
**Severity:** Critical | High | Medium | Low
**Type:** Bug | UX Issue | Missing Feature | Accessibility

**Steps to Reproduce:**
1. ...
2. ...

**Expected:** What should happen
**Actual:** What actually happened

**Screenshot:** (if applicable)

**Suggested Fix:** (optional)
```

---

## UX IMPROVEMENT CHECKLIST

After completing the workflows, evaluate:

### Form Design
- [ ] Required fields clearly marked with asterisk (*)?
- [ ] Optional fields clearly distinguishable?
- [ ] Logical grouping of related fields (General vs Details tabs)?
- [ ] Tab headers descriptive?
- [ ] Date pickers intuitive?
- [ ] Task type selection prominent and clear?

### Guidance & Help
- [ ] Placeholder text in empty fields?
- [ ] Tooltips or help icons for complex fields?
- [ ] Example text shown (e.g., task title examples)?
- [ ] Character limits visible before hitting them?
- [ ] Type explanations (what is Call vs Meeting)?

### Completion Flow
- [ ] QuickLogActivity dialog timing appropriate?
- [ ] Activity type inference accurate?
- [ ] Skip option clearly visible?
- [ ] Strikethrough styling clear but readable?
- [ ] Undo available for accidental completions?

### Error Handling
- [ ] Errors appear near the problematic field?
- [ ] Error messages explain HOW to fix (not just what's wrong)?
- [ ] Form doesn't lose data on validation failure?
- [ ] Can dismiss/retry without full re-entry?

### SlideOver Experience
- [ ] Tabs clearly labeled?
- [ ] Smooth transition between tabs?
- [ ] Edit mode obvious and easy to toggle?
- [ ] Inline completion checkbox accessible?
- [ ] Close button accessible (X or click outside)?
- [ ] URL updates when opening/closing?

### Kanban Experience
- [ ] Columns clearly distinguished by color?
- [ ] Drag handles obvious?
- [ ] Drop zones clearly indicated during drag?
- [ ] Task counts accurate?
- [ ] Empty state messages helpful?

### Performance
- [ ] Autocompletes load < 1 second?
- [ ] Form submits < 2 seconds?
- [ ] Completion toggle feels instant?
- [ ] Kanban drag-drop smooth?
- [ ] SlideOver opens smoothly?

### Accessibility
- [ ] All fields keyboard accessible?
- [ ] Tab order follows visual order?
- [ ] Focus visible on all interactive elements?
- [ ] Touch targets minimum 44x44px?
- [ ] Screen reader announces errors (role="alert")?
- [ ] aria-invalid on fields with errors?
- [ ] aria-describedby linking inputs to error messages?
- [ ] Completion checkbox properly labeled?

---

## SUGGESTED UX IMPROVEMENTS (Based on Form Analysis)

### High Priority

1. **Task Type Clarity**
   - 7 types may confuse new users
   - **Suggestion:** Add tooltip or icon + description for each type

2. **Snooze vs Postpone Confusion**
   - "Snooze" and "Postpone" may seem similar
   - **Suggestion:** Clarify: Postpone changes due date, Snooze temporarily hides

3. **QuickLogActivity Timing**
   - Dialog appears immediately on completion
   - **Suggestion:** Brief delay or animation to orient user

### Medium Priority

4. **Keyboard Shortcuts**
   - No shortcuts for common actions
   - **Suggestion:** `C` to complete, `E` to edit, `D` to delete

5. **Bulk Task Creation**
   - "Save & Add Another" exists but hidden
   - **Suggestion:** Make more prominent for batch entry

6. **Due Date Relative Labels**
   - Shows absolute dates (Dec 22, 2024)
   - **Suggestion:** Add relative labels (Today, Tomorrow, Next Monday)

### Nice to Have

7. **Recurring Tasks**
   - No recurrence support
   - **Suggestion:** Add repeat options (daily, weekly, monthly)

8. **Task Templates**
   - Common tasks require re-entry
   - **Suggestion:** Save frequently-used task configurations

---

## TESTING RESULTS TEMPLATE

```
### Field: [Field Name]
**Form:** [Create / Edit / SlideOver / Quick Add]
**Test Type:** [Max Length / Required / Format / Special Chars]

| Input | Expected | Actual | Pass/Fail |
|-------|----------|--------|-----------|
| (test value) | (expected behavior) | (what happened) | ✅ / ❌ |

**Notes:** Additional observations
```

---

## COMPLETION CHECKLIST

- [ ] Workflow A completed (Full Create Form - both tabs)
- [ ] Workflow B completed (Quick Add - from Contact and Opportunity)
- [ ] Workflow C completed (SlideOver - Details and Related Items tabs)
- [ ] Workflow D completed (Edit & Postpone - all postpone scenarios)
- [ ] Workflow E completed (Dashboard Kanban - drag-drop tested)
- [ ] Workflow F completed (Completion Flow - with and without activity logging)
- [ ] Workflow G completed (List & Filters - all filter combinations)
- [ ] Workflow H completed (Validation Edge Cases)
- [ ] All 7 task types tested (Call, Email, Meeting, Follow-up, Demo, Proposal, Other)
- [ ] All 4 priority levels tested (low, medium, high, critical)
- [ ] All issues documented using template
- [ ] UX improvement suggestions noted
- [ ] Performance observations recorded
- [ ] Accessibility items checked
- [ ] Completion flow verified (checkbox → completed_at → QuickLogActivity)
- [ ] Kanban drag-drop verified (due_date updates by column)
