hav e# UI/UX Consistency Manual Test Checklist

> **Created:** 2026-01-08
> **Purpose:** Manual verification of UI/UX consistency fixes via Claude Chrome
> **Scope:** Phase 1-3 fixes from ui-ux-consistency-audit.md

---

## Pre-Test Setup

1. Start the dev server: `just dev`
2. Open browser to `http://localhost:5173`
3. Log in with test credentials
4. Have DevTools open (F12) to inspect elements if needed

---

## Phase 1: Create Form Tests

### Test 1.1: Activity Create Form
**URL:** `/activities/create`

- [ ] **Progress Bar**: Form shows progress bar at top (below header)
- [ ] **Section Headers**: Verify Title Case (not ALL CAPS):
  - [ ] "Activity Details" (not "ACTIVITY DETAILS")
  - [ ] "Relationships" (not "RELATIONSHIPS")
  - [ ] "Follow-up" (not "FOLLOW-UP")
  - [ ] "Outcome" (not "OUTCOME")
- [ ] **Section Icons**: Each section with required fields shows circle icon (unfilled when incomplete)
- [ ] **Required Fields**: Fill in required fields and verify:
  - [ ] Interaction Type dropdown works
  - [ ] Subject field accepts input
  - [ ] Date field works
- [ ] **Progress Updates**: As required fields are filled, progress bar updates
- [ ] **Footer Buttons**: Verify three buttons at bottom:
  - [ ] "Cancel" button (outline style - has border, no fill)
  - [ ] "Save & Close" button (primary style - filled)
  - [ ] "Save & Add Another" button (primary style - filled)
- [ ] **Cancel Navigation**: Click Cancel - returns to `/activities` list

### Test 1.2: Opportunity Create Form
**URL:** `/opportunities/create`

- [ ] **Progress Bar**: Form shows progress bar at top
- [ ] **Footer Buttons**: Verify three buttons:
  - [ ] "Cancel" (outline variant)
  - [ ] "Save & Close" (primary)
  - [ ] "Save & Add Another" (primary)
- [ ] **Duplicate Check**: Enter a name similar to existing opportunity
  - [ ] Warning dialog appears if similar opportunity exists
  - [ ] Can proceed anyway or go back to edit
- [ ] **Save & Add Another**:
  - [ ] Create an opportunity
  - [ ] Click "Save & Add Another"
  - [ ] Form resets but preserves customer_organization_id and principal_id

### Test 1.3: Organization Create Form
**URL:** `/organizations/create`

- [ ] **Progress Bar**: Form shows progress bar
- [ ] **Footer Buttons**: Three buttons present
  - [ ] Cancel (outline)
  - [ ] Save & Close (primary)
  - [ ] Save & Add Another (primary)
- [ ] **Duplicate Check**: Enter name of existing organization
  - [ ] Warning dialog appears
  - [ ] Options: Cancel, View Existing, Create Anyway
- [ ] **Save & Add Another**: Preserves parent_organization_id, organization_type, segment_id

### Test 1.4: Contact Create Form (Reference)
**URL:** `/contacts/create`

- [ ] **Verify Reference Implementation** - This is the gold standard:
  - [ ] Progress bar present
  - [ ] FormSectionWithProgress sections
  - [ ] CreateFormFooter with 3 buttons
  - [ ] Compare other forms match this pattern

### Test 1.5: Task Create Form
**URL:** `/tasks/create`

- [ ] **Progress Indicator**: Shows accurate count (e.g., "1 of 4 required")
  - [ ] NOT "0 of 0 required"
- [ ] **Required Fields**: Verify single asterisk (not double **):
  - [ ] "Title *" (one asterisk)
  - [ ] "Due Date *" (one asterisk)
- [ ] **Footer**: Three buttons present

---

## Phase 2: List View Tests

### Test 2.1: Task List
**URL:** `/tasks`

- [ ] **TopToolbar**: Contains action buttons (not empty)
- [ ] **Sort Button**: Present and functional
  - [ ] Click to see sort options: title, due_date, priority, type
  - [ ] Sorting changes list order
- [ ] **Export Button**: Present
  - [ ] Click triggers CSV download
- [ ] **perPage**: List shows up to 100 items (intentional design)

### Test 2.2: Product List
**URL:** `/products`

- [ ] **Sort Button**: Present with options: name, category, status, created_at
- [ ] **Export Button**: Present and functional

### Test 2.3: Activity List
**URL:** `/activities`

- [ ] **Sort Button**: Present with options: type, subject, activity_date, created_at
- [ ] **Export Button**: Present and functional

### Test 2.4: Opportunity List
**URL:** `/opportunities`

- [ ] **Toolbar Visible**: NOT hidden (actions={false} removed)
- [ ] **Sort Button**: Present with options: name, stage, priority, estimated_close_date
- [ ] **Export Button**: Present
- [ ] **Works in All Views**: Test in kanban, list, campaign views

### Test 2.5: Filter Chip Display
**URL:** Any list with filters applied

- [ ] **No Literal "true"**: Filter chips don't show raw "true" text
- [ ] **No Literal "null"**: Filter chips don't show raw "null" text
- [ ] **Human Readable**: Filter values show readable labels

---

## Phase 3: Slide-Over Tests

### Test 3.1: Opportunity Slide-Over (NEW)
**URL:** `/opportunities` then click any opportunity row

- [ ] **FavoriteToggleButton**: Star icon present in header
  - [ ] Click toggles favorite state
  - [ ] Star fills when favorited
  - [ ] Star is empty when not favorited
- [ ] **QuickAddTaskButton**: "Add Task" chip present
  - [ ] Click opens task creation dialog
  - [ ] Pre-fills opportunity_id
- [ ] **Button Order**: Star appears BEFORE Add Task

### Test 3.2: Organization Slide-Over
**URL:** `/organizations` then click any organization row

- [ ] **FavoriteToggleButton**: Star icon present
- [ ] **QuickAddTaskButton**: "Add Task" present
- [ ] **Both Visible**: Neither button hidden or cut off

### Test 3.3: Contact Slide-Over (Reference)
**URL:** `/contacts` then click any contact row

- [ ] **Reference Implementation**: Verify both buttons present
- [ ] Compare other slide-overs match this pattern

### Test 3.4: Task Slide-Over
**URL:** `/tasks` then click any task row

- [ ] **QuickAddTaskButton**: Present (for follow-up task creation)
- [ ] **No FavoriteToggleButton**: Tasks don't support favorites (by design)

### Test 3.5: Button Layout
**All Slide-Overs**

- [ ] **No Text Wrap**: "Add Task" displays on single line
- [ ] **Proper Spacing**: Buttons have consistent gap between them
- [ ] **Touch Target**: Buttons are at least 44x44px (check in DevTools)

---

## Visual Consistency Checks

### Typography
- [ ] All section headers use Title Case (not ALL CAPS)
- [ ] Required field indicators: single asterisk only

### Button Variants
- [ ] Cancel buttons: `variant="outline"` (border, no fill)
- [ ] Primary actions: `variant="default"` (filled)

### Touch Targets
- [ ] All buttons at least 44x44px (`h-11 w-11` = 44px)
- [ ] Especially check slide-over header action buttons

---

## Test Results

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| 1.1 Activity Create | | |
| 1.2 Opportunity Create | | |
| 1.3 Organization Create | | |
| 1.4 Contact Create (ref) | | |
| 1.5 Task Create | | |
| 2.1 Task List | | |
| 2.2 Product List | | |
| 2.3 Activity List | | |
| 2.4 Opportunity List | | |
| 2.5 Filter Chips | | |
| 3.1 Opportunity Slide-Over | | |
| 3.2 Organization Slide-Over | | |
| 3.3 Contact Slide-Over (ref) | | |
| 3.4 Task Slide-Over | | |
| 3.5 Button Layout | | |

---

## Known Issues / Exceptions

1. **Tasks perPage=100**: Intentional design decision, not a bug
2. **Task FavoriteToggleButton**: Not supported (tasks not in FAVORITE_ENTITY_TYPES)
3. **Phase 4 items deferred**: Badge styling and typography consistency are Minor severity

---

## Completion Criteria

All Phase 1-3 tests must pass for UI/UX consistency audit to be considered complete.
Phase 4 (Minor) items are documented but not blocking.
