# E2E Manual Testing Workflow: Dashboard Forms & Interactions

## Purpose
Step-by-step guide to manually test all interactive components on the Crispy CRM Dashboard: Activity Logging (Desktop FAB + Mobile Quick Actions), Task Management (Kanban board + Mobile completion), KPI Cards, Pipeline Table, and Tab Navigation. Use this to identify UX issues, verify form completion, and validate the complete dashboard experience.

**Scope:** All dashboard interactions across desktop (≥1024px) and mobile/tablet (<1024px) viewports.

---

## WHAT TO OBSERVE & NOTE WHILE TESTING

### Performance Notes
- [ ] How long does the dashboard take to load initially?
- [ ] How quickly do tabs switch content?
- [ ] Any lag when dragging tasks between Kanban columns?
- [ ] Does the FAB/Sheet animation feel smooth?
- [ ] Are entity combobox results loading quickly?
- [ ] Is there visible delay when filtering the Pipeline table?
- [ ] Does draft persistence cause any noticeable lag?

### UX Friction Points
- [ ] Was it clear how to log a new activity?
- [ ] Did you understand what each quick action button does?
- [ ] Were task priority colors intuitive?
- [ ] Did you get confused about Kanban column meanings?
- [ ] Were KPI card click targets obvious?
- [ ] Did you understand how entity cascading works?
- [ ] Was the mobile quick action bar discoverable?

### Form Behavior
- [ ] Did activity type defaults populate correctly?
- [ ] Did conditional fields (duration, sample status) show/hide appropriately?
- [ ] Did entity cascading work (Contact → auto-fills Organization)?
- [ ] Did draft persistence save and restore correctly?
- [ ] Did follow-up toggle reveal the date picker?
- [ ] Did form validation prevent invalid submissions?
- [ ] Did "Save & New" clear the form correctly?

### Accessibility
- [ ] Could you complete all forms with keyboard only?
- [ ] Were touch targets large enough (44x44px minimum)?
- [ ] Did focus states appear clearly on all interactive elements?
- [ ] Did modals/sheets trap focus appropriately?
- [ ] Were error messages announced by screen readers?
- [ ] Did drag-and-drop have keyboard alternatives?

---

## WORKFLOW A: ACTIVITY LOGGING (DESKTOP)

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Dashboard** (should be default landing page)
3. Ensure viewport width is **≥1024px** (desktop mode)
4. Verify **LogActivityFAB** is visible at bottom-right (56px circular button)

---

### STEP 1: FAB Visibility & Interaction

**Goal:** Verify the floating action button works correctly.

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Locate FAB | 56px circular button at bottom-right | Position fixed, always visible |
| Check draft indicator | No badge initially (no unsaved draft) | Badge appears only with draft |
| Click FAB | Sheet slides in from right | Animation should be smooth |
| Click outside sheet | Sheet closes | Backdrop dismisses sheet |
| Press Escape key | Sheet closes | Keyboard dismissal works |

---

### STEP 2: QuickLogForm - Activity Type Section

**Goal:** Test activity type selection and conditional fields.

| Field | Enter This Value | Required? | What to Note |
|-------|------------------|-----------|--------------|
| Activity Type | Call | YES | Grouped select: Communication / Meetings / Documentation |
| Outcome | Connected | YES | Options: Connected, Left Voicemail, No Answer, Completed, Rescheduled |
| Duration | 15 | NO | Only shows for Call, Meeting, Demo, Site Visit, Trade Show |
| Sample Status | - | NO | Only shows when Activity Type = Sample |

**Conditional Field Tests:**

| Activity Type | Duration Field? | Sample Status Field? |
|---------------|-----------------|----------------------|
| Call | YES | NO |
| Email | NO | NO |
| Meeting | YES | NO |
| Sample | NO | YES |
| Note | NO | NO |
| Check-In | NO | NO |

---

### STEP 3: Entity Selection (Cascading Behavior)

**Goal:** Test the cascading autocomplete behavior.

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Open Contact combobox | Shows searchable list | Debounced search |
| Search "John" | Filters to matching contacts | Response time |
| Select a contact | Organization auto-fills if contact has one | Cascading behavior |
| Open Organization combobox | Pre-filtered to contact's organization | Anchor filtering |
| Clear Contact selection | Organization remains selected | No cascade on clear |
| Open Opportunity combobox | Shows opportunities related to selected org | Filtered by org |
| Select with no Contact | All organizations available | No filtering |

---

### STEP 4: Notes & Follow-up Section

**Goal:** Test notes field and follow-up task creation.

| Field | Enter This Value | What to Note |
|-------|------------------|--------------|
| Notes | "Discussed Q1 product launch timeline and pricing strategy" | 500 char limit, multiline |
| Create Follow-up | Toggle ON | Reveals date picker |
| Follow-up Date | Tomorrow | Past dates should be disabled |

**Follow-up Behavior:**

| Toggle State | Expected |
|--------------|----------|
| OFF (default) | Date picker hidden |
| ON | Date picker visible |
| ON → Select date | Calendar popup |
| Select past date | Should be disabled |

---

### STEP 5: Submit Behavior

**Goal:** Test form submission modes.

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Click "Save & Close" | Activity created, sheet closes, draft cleared | Success toast |
| Click "Save & New" | Activity created, form resets, sheet stays open | Ready for next entry |
| Submit with missing required fields | Validation error shown | Error message clarity |
| Submit with network error | Error toast, form preserved | Data not lost |

---

### STEP 6: Draft Persistence

**Goal:** Test localStorage draft saving.

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Partially fill form | Draft saves automatically (500ms debounce) | No visible indicator during save |
| Close sheet without saving | Draft badge appears on FAB | Warning color with pulse |
| Reopen sheet | Draft restored | All fields repopulated |
| Submit successfully | Draft cleared | Badge disappears |
| Wait 24+ hours | Draft expires and clears | Expiry cleanup |

---

## WORKFLOW B: ACTIVITY LOGGING (MOBILE)

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Resize viewport to **<1024px** (mobile/tablet mode)
4. Verify **FAB is hidden** and **MobileQuickActionBar is visible** at bottom

---

### STEP 1: Quick Action Bar Visibility

**Goal:** Verify mobile action bar appears correctly.

| Check | Expected | What to Note |
|-------|----------|--------------|
| Bar location | Fixed at bottom of viewport | Sticky position |
| Button count | 6 action buttons | All visible without scrolling |
| Touch targets | Each button ≥44px | WCAG AA compliance |
| Safe area | Respects notch/home indicator | No overlap on iPhone |

---

### STEP 2: Quick Action Buttons

**Goal:** Test each quick action button's preset behavior.

| Button | Icon | Pre-fills Activity Type | What to Note |
|--------|------|-------------------------|--------------|
| Check-In | MapPin | `check_in` | Quick location check |
| Sample | Package | `sample` | Opens sample status field |
| Call | Phone | `call` | Opens duration field |
| Meeting | Calendar | `meeting` | Opens duration field |
| Note | FileText | `note` | Notes-only activity |
| Complete | CheckCircle | Opens TaskCompleteSheet | Different flow |

---

### STEP 3: Mobile Form Experience

**Goal:** Test QuickLogForm on mobile viewport.

| Check | Expected | What to Note |
|-------|----------|--------------|
| Sheet opens from bottom | Full-height slide-up | Different from desktop side sheet |
| Touch targets | All inputs ≥44px height | Easy to tap |
| Keyboard handling | Form scrolls when keyboard opens | No hidden inputs |
| Combobox dropdowns | Touch-friendly option selection | Easy to select |
| Submit buttons | Full-width, stacked | Thumb-reachable |

---

## WORKFLOW C: TASK KANBAN BOARD

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Click **"My Tasks"** tab
4. Ensure you have tasks in different due date states (overdue, today, this week)

---

### STEP 1: Column Layout

**Goal:** Verify Kanban columns display correctly.

| Column | Color Accent | Tasks Shown | What to Note |
|--------|--------------|-------------|--------------|
| Overdue | Destructive (red) | `due_date < today` | Past due tasks |
| Today | Primary | `due_date = today` | Today's tasks |
| This Week | Muted | `due_date` within 7 days | Upcoming tasks |

**Responsive Layout:**

| Viewport | Layout | What to Note |
|----------|--------|--------------|
| Desktop (≥1024px) | 3 columns horizontal | Side-by-side |
| Mobile (<1024px) | Stacked vertical | Scrollable |

---

### STEP 2: Drag-and-Drop

**Goal:** Test task rescheduling via drag.

| Action | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Drag task from Overdue to Today | Task moves, `due_date` updates to today | Optimistic UI |
| Drag task from Today to This Week | Task moves, `due_date` updates to end of week | Smooth animation |
| Drop on same column | Task stays, no changes | No API call |
| Drag and cancel | Task returns to original position | Escape or drop outside |
| Keyboard drag | Should work with focus + arrow keys | Accessibility |

---

### STEP 3: Task Card Interactions

**Goal:** Test individual task card actions.

| Element | Action | Expected |
|---------|--------|----------|
| Task title | Click | Opens task slide-over |
| Priority badge | Display only | Critical (red), High (orange), Medium (blue), Low (gray) |
| Due date | Display only | Shows relative date, red if overdue |
| Complete button | Click | Task removed from board, success feedback |
| Snooze button | Click | Opens SnoozePopover |
| Delete button | Click | Confirmation prompt, then removal |

---

### STEP 4: Snooze Popover

**Goal:** Test task snoozing functionality.

| Option | Expected Behavior | What to Note |
|--------|-------------------|--------------|
| Tomorrow | Sets `due_date` to tomorrow EOD | Quick option |
| Next Week | Sets `due_date` to next Monday | Quick option |
| Custom Date | Opens calendar picker | Full selection |
| Select past date | Should be disabled | Validation |
| Click outside | Closes popover | Dismissal |

---

### STEP 5: Empty States & Edge Cases

**Goal:** Test edge case scenarios.

| Scenario | Expected Display |
|----------|------------------|
| No tasks at all | "No tasks" message with "New Task" link |
| No overdue tasks | Empty Overdue column (collapsed or minimal) |
| All tasks completed | "All caught up!" message |
| "New Task" button | Navigates to `/tasks/create` |

---

## WORKFLOW D: TASK COMPLETION (MOBILE)

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Resize viewport to **<1024px** (mobile mode)
4. Ensure you have incomplete tasks

---

### STEP 1: Opening TaskCompleteSheet

**Goal:** Access mobile task completion flow.

| Action | Expected |
|--------|----------|
| Click "Complete" button in quick action bar | Sheet slides up from bottom |
| Sheet appearance | Shows list of incomplete tasks |
| Task sorting | Sorted by urgency: Overdue → Today → This Week |

---

### STEP 2: Task List Display

**Goal:** Verify task information display.

| Element | Expected | What to Note |
|---------|----------|--------------|
| Task title | Visible, truncated if long | Readability |
| Task type icon | Call, Email, Meeting, Follow-up, Demo, Proposal | Recognizable |
| Priority badge | Color-coded (Critical/High/Medium/Low) | Semantic colors |
| Due date | Shown, red styling if overdue | Urgency indicator |
| Complete button | ≥44px, tap-friendly | Easy to hit |

---

### STEP 3: Task Completion

**Goal:** Test one-tap completion.

| Action | Expected | What to Note |
|--------|----------|--------------|
| Tap Complete on a task | Task disappears, success feedback | Optimistic UI |
| Complete all tasks | Shows "All caught up!" empty state | Celebratory |
| Close sheet | Tap outside or swipe down | Easy dismiss |

---

## WORKFLOW E: KPI CARDS NAVIGATION

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Observe the **KPISummaryRow** at top of dashboard

---

### STEP 1: Card Layout

**Goal:** Verify responsive card layout.

| Viewport | Layout | What to Note |
|----------|--------|--------------|
| Desktop (≥1024px) | 4 cards horizontal row | Even spacing |
| Mobile (<1024px) | 2x2 grid | Stacked layout |

---

### STEP 2: KPI Card Content

**Goal:** Verify each card displays correctly.

| Card | Icon | Metric | Click Destination |
|------|------|--------|-------------------|
| Open Opportunities | Briefcase | Count of open opps | `/opportunities` (filtered) |
| Overdue Tasks | AlertCircle | Count of overdue tasks | `/tasks?filter=overdue` |
| Activities This Week | Activity | Count of activities | `/reports` |
| Stale Deals | AlertTriangle | Count of stale opportunities | `/opportunities?filter=stale` |

---

### STEP 3: Visual States

**Goal:** Test conditional styling.

| Condition | Expected Styling | What to Note |
|-----------|------------------|--------------|
| Overdue Tasks > 0 | Red/destructive accent on card | Visual urgency |
| Overdue Tasks = 0 | Default/muted styling | No alarm |
| Stale Deals > 0 | Amber/warning accent | Attention needed |
| Stale Deals = 0 | Default styling | Normal |

---

### STEP 4: Card Interactions

**Goal:** Test click-through navigation.

| Action | Expected | What to Note |
|--------|----------|--------------|
| Click "Open Opportunities" | Navigate to Opportunities list | Pre-filtered view |
| Click "Overdue Tasks" | Navigate to Tasks list with overdue filter | Correct filter applied |
| Click "Activities This Week" | Navigate to Reports page | Activity summary |
| Click "Stale Deals" | Navigate to Opportunities with stale filter | Correct filter |
| Touch target size | Each card ≥44px height | Accessible |
| Hover state | Visual feedback on hover | Desktop only |

---

## WORKFLOW F: PIPELINE TABLE

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Ensure **Pipeline** tab is active (default)
4. Have multiple principals with varying pipeline data

---

### STEP 1: Search Input

**Goal:** Test principal name search.

| Action | Expected | What to Note |
|--------|----------|--------------|
| Type "Acme" | Table filters to matching principals | Debounced (no flicker) |
| Clear search | All principals shown | Reset behavior |
| Search with no results | Empty state message | Helpful message |
| Rapid typing | No multiple requests firing | Debounce working |

---

### STEP 2: Momentum Filter

**Goal:** Test multi-select momentum filtering.

| Selection | Expected |
|-----------|----------|
| Select "Growing" | Only principals with growing momentum |
| Select "Stable" | Only principals with stable momentum |
| Select multiple | Combined filter (OR logic) |
| Clear all | All momentum levels shown |

---

### STEP 3: "My Principals Only" Toggle

**Goal:** Test principal ownership filter.

| State | Expected |
|-------|----------|
| OFF (default) | All principals visible |
| ON | Only principals assigned to you |
| Toggle ON with no matches | Empty state with message |

---

### STEP 4: Column Sorting

**Goal:** Test sortable columns.

| Column | First Click | Second Click | What to Note |
|--------|-------------|--------------|--------------|
| Principal Name | A → Z | Z → A | Alphabetical |
| Pipeline Count | Low → High | High → Low | Numeric |
| Weekly Activity | Low → High | High → Low | Numeric |
| Momentum | Enum order | Reverse enum | Categorical |

**Sort Indicator:**

| State | Visual |
|-------|--------|
| Sorted ascending | Arrow up icon |
| Sorted descending | Arrow down icon |
| Not sorted | No indicator |

---

### STEP 5: Row Drill-down

**Goal:** Test principal detail expansion.

| Action | Expected |
|--------|----------|
| Click any row | PipelineDrillDownSheet opens |
| Sheet content | Shows opportunities by stage |
| Click opportunity | Navigate to opportunity detail |
| Close sheet | Click outside or X button |

---

## WORKFLOW G: TAB NAVIGATION

### Pre-Requisites
1. Login to Crispy CRM
2. Navigate to **Dashboard**
3. Observe the 4-tab interface

---

### STEP 1: Tab Switching

**Goal:** Verify each tab loads correct content.

| Tab | Content Component | What to Note |
|-----|-------------------|--------------|
| Pipeline (default) | PrincipalPipelineTable | Active on load |
| My Tasks | TasksKanbanPanel | Task badge shows count |
| Performance | MyPerformanceWidget | Personal metrics |
| Team Activity | ActivityFeedPanel | Recent team activities |

---

### STEP 2: State Preservation

**Goal:** Test that tab state persists when switching.

| Test | Expected |
|------|----------|
| Apply filter on Pipeline tab | Filter value persisted |
| Switch to Tasks tab | Pipeline filter preserved in background |
| Return to Pipeline tab | Filter still applied |
| Scroll position | Preserved per tab |

---

### STEP 3: Badge Indicators

**Goal:** Test tab badges.

| Tab | Badge Shows |
|-----|-------------|
| My Tasks | Count of pending (incomplete) tasks |
| Others | No badge |

---

### STEP 4: Lazy Loading

**Goal:** Verify progressive content loading.

| Observation | Expected |
|-------------|----------|
| First tab load | Shows skeleton while loading |
| Subsequent visits | Instant render (cached) |
| Tab content size | Reasonable load times |

---

## WORKFLOW H: EDGE CASES & VALIDATION

### Pre-Requisites
1. Complete Workflows A-G first
2. Have Chrome DevTools open for network inspection

---

### STEP 1: Draft Persistence Edge Cases

| Test | Steps | Expected |
|------|-------|----------|
| Draft save timing | Fill form slowly, check localStorage | Saves after 500ms idle |
| Draft expiry | Set system clock forward 25 hours | Draft should be cleared |
| Multiple tabs | Open dashboard in 2 tabs, fill form in one | Draft isolated per tab |
| Browser close/reopen | Fill form, close browser, reopen | Draft restored (within 24h) |
| Successful submit | Complete activity, check localStorage | Draft key removed |

---

### STEP 2: Keyboard Navigation

| Context | Key | Expected |
|---------|-----|----------|
| FAB focused | Enter | Opens sheet |
| Sheet open | Escape | Closes sheet |
| Form fields | Tab | Moves to next field |
| Combobox | Arrow Down | Opens dropdown |
| Combobox open | Enter | Selects option |
| Kanban task | Tab | Moves through tasks |
| Modal open | Tab | Trapped within modal |

---

### STEP 3: Error States

| Scenario | How to Trigger | Expected |
|----------|----------------|----------|
| Network failure | Throttle to Offline in DevTools | Error toast, form preserved |
| Required field empty | Submit without activity type | Inline validation error |
| Server 500 error | Mock error response | Error toast with retry option |
| Concurrent edit | Edit same task in 2 tabs | Last write wins, no crash |

---

### STEP 4: Responsive Breakpoints

| Width | Expected Layout Changes |
|-------|-------------------------|
| ≥1440px | Full desktop, all columns visible |
| 1024-1439px | Desktop, may compress slightly |
| 768-1023px | Tablet, FAB hidden, Quick Action Bar visible |
| <768px | Mobile, stacked layouts, optimized touch |

---

### STEP 5: Accessibility Checks

| Check | How to Verify | Expected |
|-------|---------------|----------|
| Touch targets | Measure buttons | All ≥44px |
| Focus visibility | Tab through page | Clear focus rings |
| ARIA labels | Inspect elements | Descriptive labels |
| Screen reader | Enable VoiceOver/NVDA | Logical reading order |
| Color contrast | Use browser a11y tools | Meets WCAG AA |
| Keyboard-only | Unplug mouse | All features accessible |

---

## QUICK REFERENCE: ACTIVITY TYPES

| Type | Group | Duration Field? | Sample Field? |
|------|-------|-----------------|---------------|
| Call | Communication | YES | NO |
| Email | Communication | NO | NO |
| Check-In | Communication | NO | NO |
| Meeting | Meetings | YES | NO |
| Demo | Meetings | YES | NO |
| Site Visit | Meetings | YES | NO |
| Trade Show | Meetings | YES | NO |
| Sample | Documentation | NO | YES |
| Proposal | Documentation | NO | NO |
| Note | Documentation | NO | NO |

---

## QUICK REFERENCE: TASK PRIORITIES

| Priority | Color | Urgency |
|----------|-------|---------|
| Critical | Destructive (red) | Immediate attention |
| High | Warning (amber/orange) | Within 24 hours |
| Medium | Primary (blue/green) | This week |
| Low | Muted (gray) | When available |

---

## ISSUE REPORTING TEMPLATE

When you find an issue, document it with this format:

```markdown
### [Short Title]

**Location:** [Workflow + Step, e.g., "Workflow A, Step 3"]
**Severity:** Critical / High / Medium / Low
**Type:** Bug / UX Issue / Performance / Accessibility

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happens]

**Screenshot:** [Attach if applicable]

**Suggested Fix:** [Optional - your recommendation]
```

---

## UX IMPROVEMENT CHECKLIST

### High Priority
- [ ] Are all required fields clearly marked?
- [ ] Do error messages explain how to fix the issue?
- [ ] Are touch targets large enough for thumb use?
- [ ] Is draft persistence working reliably?
- [ ] Does entity cascading make sense to users?

### Medium Priority
- [ ] Are loading states clear and not jarring?
- [ ] Is tab switching instant (no visible delays)?
- [ ] Does drag-and-drop provide visual feedback?
- [ ] Are empty states helpful and actionable?

### Nice to Have
- [ ] Are animations smooth and not distracting?
- [ ] Does the mobile experience feel native?
- [ ] Are keyboard shortcuts discoverable?
- [ ] Is the color scheme consistent throughout?

---

## TESTING RESULTS TEMPLATE

| Workflow | Step | Input | Expected | Actual | Pass/Fail | Notes |
|----------|------|-------|----------|--------|-----------|-------|
| A | 1 | Click FAB | Sheet opens | | | |
| A | 2 | Select Call | Duration field shows | | | |
| A | 3 | Select Contact | Org auto-fills | | | |
| ... | ... | ... | ... | ... | ... | ... |

---

## COMPLETION CHECKLIST

- [ ] Workflow A: Activity Logging (Desktop) - All 6 steps
- [ ] Workflow B: Activity Logging (Mobile) - All 3 steps
- [ ] Workflow C: Task Kanban Board - All 5 steps
- [ ] Workflow D: Task Completion (Mobile) - All 3 steps
- [ ] Workflow E: KPI Cards Navigation - All 4 steps
- [ ] Workflow F: Pipeline Table - All 5 steps
- [ ] Workflow G: Tab Navigation - All 4 steps
- [ ] Workflow H: Edge Cases & Validation - All 5 steps
- [ ] Issues documented using template
- [ ] UX improvement notes compiled
- [ ] Test results recorded

---

**Document Version:** 1.0
**Last Updated:** 2025-12-22
**Author:** Claude Code

---

## APPENDIX: FILE REFERENCE

For developers investigating issues found during testing:

| Component | File Path |
|-----------|-----------|
| Dashboard Entry | `src/atomic-crm/dashboard/v3/index.tsx` |
| Main Layout | `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` |
| LogActivityFAB | `src/atomic-crm/dashboard/v3/components/LogActivityFAB.tsx` |
| QuickLogForm | `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` |
| ActivityTypeSection | `src/atomic-crm/dashboard/v3/components/ActivityTypeSection.tsx` |
| FollowUpSection | `src/atomic-crm/dashboard/v3/components/FollowUpSection.tsx` |
| EntityCombobox | `src/atomic-crm/dashboard/v3/components/EntityCombobox.tsx` |
| MobileQuickActionBar | `src/atomic-crm/dashboard/v3/components/MobileQuickActionBar.tsx` |
| TasksKanbanPanel | `src/atomic-crm/dashboard/v3/components/TasksKanbanPanel.tsx` |
| TaskKanbanCard | `src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx` |
| TaskCompleteSheet | `src/atomic-crm/dashboard/v3/components/TaskCompleteSheet.tsx` |
| SnoozePopover | `src/atomic-crm/dashboard/v3/components/SnoozePopover.tsx` |
| KPISummaryRow | `src/atomic-crm/dashboard/v3/components/KPISummaryRow.tsx` |
| KPICard | `src/atomic-crm/dashboard/v3/components/KPICard.tsx` |
| PrincipalPipelineTable | `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx` |
| PipelineDrillDownSheet | `src/atomic-crm/dashboard/v3/components/PipelineDrillDownSheet.tsx` |
| DashboardTabPanel | `src/atomic-crm/dashboard/v3/components/DashboardTabPanel.tsx` |
| MyPerformanceWidget | `src/atomic-crm/dashboard/v3/components/MyPerformanceWidget.tsx` |
| ActivityFeedPanel | `src/atomic-crm/dashboard/v3/components/ActivityFeedPanel.tsx` |
