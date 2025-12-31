# MVP User Flows

Critical user journeys for Crispy CRM - designed for MFB's 6 account managers managing 9 principals.

---

## 1. Principal Pipeline Review

**Goal:** Answer "What is the ONE thing I need to do this week for [Principal]?" in under 2 seconds.

**Target Time:** < 2 seconds from dashboard to actionable insight

### Entry Points
- Dashboard principal filter dropdown
- Sidebar principal quick-select
- URL direct link: `/?principal={id}`

### Steps
1. **Select Principal** - Click principal filter or use keyboard shortcut
2. **View Filtered Pipeline** - Opportunities auto-filter to selected principal
3. **Scan Priority Indicators** - Overdue tasks, stale opportunities highlighted
4. **Identify Action** - Top priority surfaced via visual hierarchy

### Success Criteria
- [ ] Pipeline filters in < 500ms
- [ ] Overdue/stale items visually distinct (color + icon)
- [ ] Most urgent action appears above fold
- [ ] Filter persists across navigation
- [ ] Single click/tap to drill into opportunity

### UI Elements
- Principal filter: persistent in header/sidebar
- Priority badge: shows count of items needing attention
- Opportunity cards: show days since last activity

---

## 2. Quick Activity Logging

**Goal:** Log a call, email, or sample in under 30 seconds.

**Target Time:** < 30 seconds from intent to saved activity

### Entry Points
1. **FAB (Floating Action Button)** - Global, always visible
2. **Opportunity Card** - "Log Activity" quick action
3. **Contact Slide-Over** - Activity tab with "Add" button
4. **Keyboard Shortcut** - `Cmd/Ctrl + L` opens activity modal

### Steps
1. **Trigger Entry Point** - FAB, card action, or shortcut
2. **Select Activity Type** - Call / Email / Sample (3 buttons, no dropdown)
3. **Fill Minimal Fields:**
   - **Call:** Contact (auto-filled if context), Duration (quick-select), Notes (optional)
   - **Email:** Contact, Subject (optional), Notes (optional)
   - **Sample:** Contact, Product(s), Follow-up date (auto-suggest +7 days)
4. **Submit** - Single button, closes modal, shows success toast

### Success Criteria
- [ ] Modal opens in < 200ms
- [ ] Max 4 required fields per activity type
- [ ] Smart defaults reduce typing (auto-fill contact, suggest dates)
- [ ] Submit with Enter key supported
- [ ] Toast confirms save without blocking workflow
- [ ] Activity appears immediately in timeline (optimistic update)

### Field Optimization
| Activity Type | Required Fields | Optional Fields |
|---------------|-----------------|-----------------|
| Call          | Contact, Duration | Notes |
| Email         | Contact | Subject, Notes |
| Sample        | Contact, Product(s), Follow-up Date | Notes |

---

## 3. Sample Follow-up Workflow

**Goal:** Track samples from send to feedback with no dropped follow-ups.

**Target Time:** < 1 minute for initial sample creation

### Entry Points
- Quick Activity Log (Sample type)
- Opportunity detail page
- Contact slide-over

### Steps

#### Phase 1: Create Sample
1. **Select Sample Type** - From activity logger
2. **Specify Details:**
   - Contact (required)
   - Product(s) sent (multi-select from principal's products)
   - Quantity/size (optional)
   - Follow-up date (required, defaults to +7 days)
3. **Submit** - Creates sample record + auto-creates follow-up task

#### Phase 2: Follow-up Reminder
1. **Task Appears** - In task panel on follow-up date
2. **Rep Takes Action** - Call/email to check on sample
3. **Mark Task Complete** - Or snooze if needed

#### Phase 3: Log Feedback
1. **Open Sample Record** - From task or opportunity timeline
2. **Record Outcome:**
   - Feedback received (positive/negative/neutral)
   - Next steps (opportunity advancement, reorder, no interest)
   - Notes
3. **Update Opportunity Stage** - If feedback moves deal forward

### Success Criteria
- [ ] Follow-up task auto-created with sample
- [ ] Task shows sample context (product, contact, opportunity)
- [ ] Overdue follow-ups surfaced in daily digest
- [ ] Sample history visible on contact and opportunity records
- [ ] Feedback links back to sample for full audit trail

### Sample States
```
Created → Pending Follow-up → Feedback Logged → [Reordered | No Interest | Converted]
```

---

## 4. Opportunity Stage Progression

**Goal:** Move deals through pipeline with clear stage definitions and required actions.

### Pipeline Stages (7)

| Stage | Definition | Typical Duration | Exit Criteria |
|-------|------------|------------------|---------------|
| `new_lead` | New prospect identified | 1-3 days | Initial contact made |
| `initial_outreach` | First contact completed | 3-7 days | Interest confirmed |
| `sample_visit_offered` | Sample sent or visit scheduled | 7-14 days | Sample delivered or visit complete |
| `feedback_logged` | Customer feedback received | 3-7 days | Clear next step identified |
| `demo_scheduled` | Formal presentation/demo set | 7-14 days | Demo completed |
| `closed_won` | Deal won | - | Order placed |
| `closed_lost` | Deal lost | - | Loss reason captured |

### Entry Points
- Opportunity card drag-and-drop (Kanban view)
- Opportunity detail page stage selector
- Bulk actions from list view

### Steps
1. **Identify Ready Opportunity** - Visual indicators show stage-appropriate actions completed
2. **Advance Stage:**
   - Drag card to next column (Kanban), OR
   - Click stage selector in detail view
3. **Complete Required Fields** (if any):
   - `closed_won`: Expected revenue, close date
   - `closed_lost`: Loss reason (required), competitor (optional)
4. **Confirm** - Stage updates, timestamp recorded

### Success Criteria
- [ ] Drag-and-drop works on desktop and iPad
- [ ] Stage change triggers activity log entry
- [ ] Required fields enforced before stage change commits
- [ ] Opportunity age per stage tracked for reporting
- [ ] Backward movement allowed (deals can regress)

### Stage Transition Rules
- Any stage can move to `closed_lost`
- `closed_won` only reachable from `demo_scheduled` or `feedback_logged`
- No skipping more than 2 stages (warning shown)

---

## 5. Contact Quick-Create

**Goal:** Add a new contact without leaving current context.

**Target Time:** < 20 seconds for minimal contact

### Entry Points
1. **Opportunity Slide-Over** - "Add Contact" button in contacts section
2. **Organization Slide-Over** - "Add Contact" in contacts tab
3. **Global Search** - "Create new contact" option when no results
4. **Activity Logger** - "New contact" option in contact selector

### Steps
1. **Trigger Quick-Create** - Modal opens over current view
2. **Fill Minimal Fields:**
   - First name (required)
   - Last name (required)
   - Email OR Phone (at least one required)
   - Organization (auto-filled from context)
   - Role/Title (optional)
3. **Submit** - Contact created, modal closes
4. **Auto-Link** - Contact linked to opportunity/organization from context

### Success Criteria
- [ ] Modal does not navigate away from current page
- [ ] Organization pre-filled when creating from org context
- [ ] New contact immediately selectable in parent form
- [ ] Duplicate warning if email/phone matches existing contact
- [ ] "Create and add another" option for batch entry

### Field Requirements
| Field | Required | Auto-filled |
|-------|----------|-------------|
| First Name | Yes | No |
| Last Name | Yes | No |
| Email | One of Email/Phone | No |
| Phone | One of Email/Phone | No |
| Organization | No | Yes (from context) |
| Role/Title | No | No |

---

## Cross-Cutting Concerns

### Touch Targets (iPad Support)
- All interactive elements: minimum 44x44px
- Adequate spacing between tap targets
- Swipe gestures for common actions (archive, complete)

### Keyboard Navigation (Desktop Power Users)
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + L` | Open activity logger |
| `Cmd/Ctrl + K` | Global search |
| `Cmd/Ctrl + N` | New opportunity |
| `Escape` | Close modal/slide-over |
| `Tab` | Navigate form fields |
| `Enter` | Submit form |

### Error States
- Network errors: Show retry option, preserve form state
- Validation errors: Inline messages, focus first error field
- Conflict errors: Show diff, allow merge or overwrite

### Offline Considerations (Future)
- MVP: Online-only with clear offline indicator
- Future: Queue activities for sync when connection restored

---

## Metrics to Track

| Flow | Metric | Target |
|------|--------|--------|
| Principal Pipeline Review | Time to insight | < 2 seconds |
| Quick Activity Logging | Time to complete | < 30 seconds |
| Sample Follow-up | Follow-up completion rate | > 90% |
| Stage Progression | Average time in stage | Varies by stage |
| Contact Quick-Create | Time to create | < 20 seconds |
