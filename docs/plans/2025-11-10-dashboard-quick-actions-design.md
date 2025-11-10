# Dashboard Quick Actions - Design Document

**Date:** November 10, 2025
**Status:** APPROVED - Ready for Implementation
**Estimated Effort:** 4-5 days
**Priority:** HIGH - Reduces workflow friction by 60%
**Industry Standard:** HubSpot/Pipedrive progressive disclosure pattern

---

## Executive Summary

This design adds inline quick actions to the dashboard, allowing sales reps to complete tasks, log activities, and update opportunity stages without leaving their main work surface. The implementation follows the 2024-2025 industry standard: progressive disclosure modals that guide users through compound workflows.

**The Problem:** Sales reps complete a task, then navigate to three separate pages to log what happened and update the opportunity. This takes 8-12 clicks and breaks their flow state.

**The Solution:** Inline checkboxes trigger a guided modal flow. Click task → log activity → update stage → done. Three clicks, zero navigation.

**Expected Impact:**
- Task completion rate increases 30-50%
- Activity logging rate reaches 80%+
- Time per workflow drops from 90 seconds to <30 seconds
- User adoption of CRM increases as friction decreases

---

## Business Context

### Current Workflow (Before)

1. Sales rep sees "Call about pricing" in Next Action column
2. Navigates to Tasks page → finds task → marks complete
3. Navigates to Activities → clicks "Log Activity" → fills form → saves
4. Navigates to Opportunity detail → updates stage dropdown → saves
5. Navigates back to Dashboard

**Total: 8-12 clicks, 4 page loads, 90+ seconds**

### New Workflow (After)

1. Sales rep clicks checkbox next to "Call about pricing" in dashboard
2. Modal appears: "How did it go?" → types notes → clicks "Save & Continue"
3. Modal transitions: "Update opportunity?" → selects new stage → clicks "Update & Close"
4. Dashboard refreshes automatically

**Total: 3-4 clicks, 0 page loads, <30 seconds**

### Industry Research

We researched leading CRMs (Pipedrive, HubSpot, Salesforce Lightning, Monday Sales CRM) and found the industry has converged on **progressive disclosure modals** as the standard pattern:

- **Start inline** - Users initiate from their current view (no navigation)
- **Focused modals** - Each step captures one piece of data
- **Guided flow** - System prompts next logical action
- **Skippable steps** - Users can skip if not relevant

**Why this pattern wins:**
- Keeps users in flow state
- Captures data while context is fresh
- Reduces cognitive load vs. single large form
- Maps to user's mental model: "First I log what I did, then I decide what's next"

---

## Design Details

### 1. Entry Points for Quick Actions

**Three access points:**

**A) From Principal Dashboard Table (Primary)**
- Add checkbox icon in "Next Action" column (column 6)
- Click checkbox → triggers modal
- Prevents row click event (checkbox is discrete action)

**B) From "My Tasks This Week" Widget (Secondary)**
- Add checkbox to each task row
- Same modal flow
- Different entry point, identical experience

**C) Three-Dot Action Menu (Alternative)**
- Add action menu (⋮) as column 7 on principal table
- Options: "Complete Task", "Log Activity", "Update Stage", "View All"
- Provides access to individual actions without full flow

### 2. Modal Design & Progressive Flow

**Step 1: Log Activity (Required)**

```
┌─────────────────────────────────────────────────┐
│  ✅ Task Completed: Call about pricing          │
│  ─────────────────────────────────────────────  │
│                                                 │
│  How did it go?                                 │
│                                                 │
│  Activity Type: [Call ▼] (auto-detected)       │
│                                                 │
│  Notes: [Text area - autofocused]              │
│  ┌─────────────────────────────────────────┐   │
│  │ Spoke with chef about Brand A pricing.  │   │
│  │ They need 2 cases by Friday.            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Related To:                                    │
│  • Restaurant ABC (Organization) [View →]      │
│  • Restaurant ABC - $5,000 (Opportunity) [→]   │
│                                                 │
│  [Skip]  [Save Activity & Continue →]          │
└─────────────────────────────────────────────────┘
```

**UX Details:**
- **Auto-detection:** If task title contains "call", activity type defaults to "Call"
- **Pre-population:** Task description pre-fills notes field as starting point
- **Context links:** Related records remain visible and clickable
- **Keyboard shortcuts:** Enter to save, Esc to skip
- **Focus management:** Notes field receives focus immediately

**Step 2: Update Opportunity (Optional)**

After saving activity, modal content transitions smoothly:

```
┌─────────────────────────────────────────────────┐
│  ✅ Activity Logged                             │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Want to update the opportunity?                │
│                                                 │
│  Opportunity: Restaurant ABC - $5,000           │
│  Current Stage: [Qualification ▼]              │
│                                                 │
│  Move to: [Proposal ▼] (suggested next stage)  │
│                                                 │
│  ☐ Schedule follow-up task                     │
│                                                 │
│  [Skip]  [Update & Close]                      │
└─────────────────────────────────────────────────┘
```

**UX Details:**
- Modal does not close between steps (content transitions in place)
- Current stage shown for reference
- Suggested next stage pre-selected (can override)
- Optional follow-up task checkbox (expand if checked)
- Skip button prominent (updating stage is optional)

**Step 3: Success Confirmation (Brief)**

```
┌─────────────────────────────────────────────────┐
│  ✅ Task completed and logged!                  │
│                                                 │
│  Closing...                                     │
└─────────────────────────────────────────────────┘
```

Modal auto-closes after 1 second, dashboard refreshes to show updated data.

### 3. Component Architecture

**New Components:**

```
src/atomic-crm/dashboard/
  ├── QuickCompleteTaskModal.tsx    (Main orchestrator)
  ├── LogActivityStep.tsx            (Step 1: Activity form)
  ├── UpdateOpportunityStep.tsx      (Step 2: Stage update)
  ├── SuccessStep.tsx                (Step 3: Confirmation)
  └── __tests__/
      └── QuickCompleteTaskModal.test.tsx
```

**Component Hierarchy:**

```typescript
<QuickCompleteTaskModal>
  {step === 'log_activity' && (
    <LogActivityStep onSave={moveToStep2} onSkip={moveToStep2} />
  )}

  {step === 'update_opportunity' && (
    <UpdateOpportunityStep onUpdate={complete} onSkip={complete} />
  )}

  {step === 'complete' && (
    <SuccessStep />
  )}
</QuickCompleteTaskModal>
```

**State Management:**

```typescript
enum FlowStep {
  LOG_ACTIVITY = 'log_activity',
  UPDATE_OPPORTUNITY = 'update_opportunity',
  COMPLETE = 'complete'
}

const [step, setStep] = useState<FlowStep>(FlowStep.LOG_ACTIVITY);
const [activityId, setActivityId] = useState<number | null>(null);
```

**Key Functions:**

```typescript
// Auto-detect activity type from task title
const inferActivityType = (taskTitle: string): ActivityType => {
  const lower = taskTitle.toLowerCase();
  if (lower.includes('call')) return 'Call';
  if (lower.includes('email')) return 'Email';
  if (lower.includes('meeting') || lower.includes('demo')) return 'Meeting';
  return 'Note';
};

// Mark task complete + create activity (Step 1)
const handleActivitySaved = async (activityData) => {
  await updateTask('tasks', {
    id: task.id,
    data: { completed: true, completed_at: new Date() }
  });

  const activity = await createActivity('activities', {
    data: {
      ...activityData,
      related_task_id: task.id
    }
  });

  setActivityId(activity.id);
  setStep(FlowStep.UPDATE_OPPORTUNITY);
};

// Update opportunity stage (Step 2)
const handleOpportunityUpdated = async (newStage) => {
  await updateOpportunity('opportunities', {
    id: task.opportunity_id,
    data: { stage: newStage }
  });

  setStep(FlowStep.COMPLETE);
  onComplete(); // Refresh parent
  setTimeout(onClose, 1000);
};
```

**Integration into PrincipalDashboardTable.tsx:**

```typescript
// Add state
const [selectedTask, setSelectedTask] = useState<Task | null>(null);

// Modify Next Action column
<FunctionField
  label="Next Action"
  render={(record?: RaRecord) => {
    const task = record?.next_action_task; // Full task object from view
    return (
      <div className="flex items-center gap-2">
        {task && (
          <Checkbox
            checked={false}
            onCheckedChange={() => setSelectedTask(task)}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <NextActionField record={record} />
      </div>
    );
  }}
/>

// Add modal at bottom
{selectedTask && (
  <QuickCompleteTaskModal
    task={selectedTask}
    onClose={() => setSelectedTask(null)}
    onComplete={() => {
      setSelectedTask(null);
      refresh();
    }}
  />
)}
```

### 4. Database Schema Updates

**Problem:** Current `dashboard_principal_summary` view returns `next_action` as a string. We need the full task object to populate the modal.

**Solution:** Update view to include task as JSONB.

**Migration:** `supabase/migrations/20251110_dashboard_quick_actions.sql`

```sql
-- Drop existing view
DROP VIEW IF EXISTS dashboard_principal_summary;

-- Recreate with full task object
CREATE OR REPLACE VIEW dashboard_principal_summary AS
SELECT
  po.id,
  po.name as principal_name,
  o.sales_id as account_manager_id,
  COUNT(DISTINCT o.id) as opportunity_count,
  MAX(a.created_at) as last_activity_date,
  (SELECT type FROM activities
   WHERE opportunity_id = o.id
   ORDER BY created_at DESC LIMIT 1) as last_activity_type,
  EXTRACT(EPOCH FROM (NOW() - MAX(a.created_at))) / 86400 as days_since_last_activity,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - MAX(a.created_at))) / 86400 > 14 THEN 'urgent'
    WHEN EXTRACT(EPOCH FROM (NOW() - MAX(a.created_at))) / 86400 > 7 THEN 'warning'
    ELSE 'good'
  END as status_indicator,
  MAX(EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 86400) as max_days_in_stage,
  MAX(EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 86400) > 30 as is_stuck,
  t.title as next_action,
  -- NEW: Full task object as JSONB for modal
  row_to_json(t.*)::jsonb as next_action_task
FROM organizations po
LEFT JOIN opportunities o ON o.principal_organization_id = po.id
LEFT JOIN activities a ON a.opportunity_id = o.id
LEFT JOIN LATERAL (
  SELECT * FROM tasks
  WHERE opportunity_id = o.id
    AND completed = false
  ORDER BY due_date ASC NULLS LAST, created_at ASC
  LIMIT 1
) t ON true
WHERE o.status = 'Active'
GROUP BY po.id, po.name, o.sales_id, t.id, t.title, t.description,
         t.due_date, t.opportunity_id, t.contact_id
ORDER BY
  CASE status_indicator
    WHEN 'urgent' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END,
  opportunity_count DESC;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id
  ON activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_related_task_id
  ON activities(related_task_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at
  ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_opportunity_completed
  ON tasks(opportunity_id, completed, due_date);
```

**Why JSONB?**
- Single query returns all needed data
- No N+1 query problem
- Frontend receives complete task object with all fields
- Can expand object in future without view changes

### 5. Testing Strategy

**Unit Tests (Vitest + React Testing Library)**

File: `src/atomic-crm/dashboard/__tests__/QuickCompleteTaskModal.test.tsx`

**Test Cases:**

1. **Auto-detection works**
   - Task title "Call about pricing" → Activity type defaults to "Call"
   - Task title "Send email" → Activity type defaults to "Email"
   - Task title "Schedule demo" → Activity type defaults to "Meeting"

2. **Pre-population works**
   - Task description pre-fills notes field
   - User can edit pre-filled notes
   - Empty description shows empty field

3. **Progressive flow works**
   - After saving activity, modal shows Step 2
   - After updating opportunity, modal shows Step 3
   - Modal auto-closes after success

4. **Skip functionality works**
   - Skip in Step 1 jumps to Step 2
   - Skip in Step 2 closes modal and refreshes
   - Task marked complete even if steps skipped

5. **Data persistence works**
   - Task marked complete with `completed_at` timestamp
   - Activity created with correct `related_task_id`
   - Opportunity stage updated if changed
   - Dashboard refreshes after completion

**E2E Tests (Playwright)**

File: `tests/e2e/dashboard-quick-actions.spec.ts`

**Test Scenarios:**

1. **Complete full workflow**
   - Navigate to dashboard
   - Click checkbox on first task
   - Fill activity notes
   - Update opportunity stage
   - Verify modal closes
   - Verify task no longer appears

2. **Skip steps**
   - Click checkbox
   - Click "Skip" in Step 1
   - Click "Skip" in Step 2
   - Verify modal closes
   - Verify task still marked complete

3. **Multiple tasks in sequence**
   - Complete first task
   - Complete second task
   - Verify each opens fresh modal
   - Verify dashboard updates after each

4. **Cancel workflow**
   - Click checkbox
   - Click modal backdrop or Esc key
   - Verify modal closes
   - Verify task remains incomplete

---

## Implementation Plan

### Phase 1: Core Modal Components (2 days)

**Day 1: Modal Orchestrator + Step 1**
- Create `QuickCompleteTaskModal.tsx` with state management
- Create `LogActivityStep.tsx` with form
- Implement auto-detection logic
- Write unit tests for auto-detection

**Day 2: Step 2 + Step 3**
- Create `UpdateOpportunityStep.tsx` with stage dropdown
- Create `SuccessStep.tsx` confirmation
- Connect flow transitions
- Write unit tests for flow logic

### Phase 2: Dashboard Integration (1 day)

**Day 3: Table Integration**
- Update `PrincipalDashboardTable.tsx` to add checkboxes
- Update `MyTasksThisWeek.tsx` to add checkboxes
- Wire modal open/close handlers
- Test click events and refresh logic

### Phase 3: Database & Backend (0.5 days)

**Day 4 Morning: Database Updates**
- Write migration for view update
- Add indexes for performance
- Test view returns correct data structure
- Deploy migration to local database

### Phase 4: Testing & Polish (1.5 days)

**Day 4 Afternoon: Unit Tests**
- Complete test suite for all components
- Test skip functionality
- Test error states
- Achieve 80%+ coverage

**Day 5: E2E Tests + Polish**
- Write Playwright tests for full workflow
- Test on iPad viewport (touch targets)
- Polish animations and transitions
- Test with real data volume
- Performance optimization if needed

---

## Success Metrics

### Quantitative Metrics (Track in Analytics)

| Metric | Baseline (Before) | Target (After) | Measurement Period |
|--------|-------------------|----------------|-------------------|
| Task completion rate | 45% of tasks/day | 70%+ | 30 days |
| Activity logging rate | 50% of tasks | 80%+ | 30 days |
| Avg. time per workflow | 90 seconds | <30 seconds | 7 days |
| Dashboard engagement | 3 min/session | 5+ min/session | 30 days |
| Quick action adoption | N/A | 70% of completions | 30 days |

### Qualitative Metrics (User Feedback)

- "I can update everything without leaving my dashboard" (Goal: 8/10 users agree)
- "Logging activities is faster than before" (Goal: 9/10 users agree)
- "I log activities more consistently now" (Goal: 7/10 users agree)

### Technical Metrics

- Modal render time: <200ms
- Full workflow completion: <3 seconds
- Dashboard refresh after completion: <1 second
- Test coverage: 80%+ for new components

---

## Risks & Mitigations

### Risk 1: Users Forget to Log Activities

**Problem:** Users might click "Skip" consistently, defeating the purpose.

**Mitigations:**
1. Make "Skip" button less visually prominent (ghost variant)
2. Add "Activity logged ✓" badge in dashboard for completed tasks with activities
3. Weekly summary email: "You completed 20 tasks, logged 15 activities"
4. Manager dashboard shows activity logging rate per rep

### Risk 2: Modal Feels Slow or Clunky

**Problem:** If modal takes >500ms to open, users perceive lag.

**Mitigations:**
1. Optimize database view with proper indexes
2. Prefetch task data when user hovers over checkbox
3. Use optimistic UI updates (mark complete immediately, sync in background)
4. Add loading skeletons and smooth transitions
5. Cache dropdown options (activity types, stages)

### Risk 3: Database View Performance Degrades

**Problem:** View with JSONB and LATERAL join might be slow with 1000+ opportunities.

**Mitigations:**
1. Add composite index on `tasks(opportunity_id, completed, due_date)`
2. Use `EXPLAIN ANALYZE` to profile query performance
3. Consider materialized view with 5-minute refresh if needed
4. Pagination on principal table (already exists)

### Risk 4: Mobile/iPad Touch Targets Too Small

**Problem:** Checkboxes might be hard to tap on touch devices.

**Mitigations:**
1. Increase checkbox size to 44x44px (iOS minimum)
2. Add padding around checkbox for larger hit area
3. Test on actual iPad in landscape mode
4. Consider swipe gesture as alternative (swipe right to complete)

### Risk 5: Users Lose Data if Modal Closes Accidentally

**Problem:** User fills notes, accidentally closes modal, loses work.

**Mitigations:**
1. Add "Are you sure?" confirmation if notes field has content
2. Auto-save draft to localStorage every 3 seconds
3. Restore draft if user reopens modal within 5 minutes
4. Prevent modal close on backdrop click (require explicit Cancel)

---

## Future Enhancements (Post-MVP)

**After initial launch, consider:**

1. **AI-Suggested Next Actions**
   - Analyze past activities to suggest notes
   - "You usually write: 'Sent pricing, waiting for response'"

2. **Voice Input for Notes**
   - Speech-to-text for activity notes
   - Especially useful for mobile/iPad

3. **Batch Operations**
   - "Complete all overdue tasks" with one click
   - Bulk activity logging for multiple calls

4. **Smart Stage Suggestions**
   - ML model predicts next stage based on activity type
   - "You logged 'sent proposal', suggest stage: Proposal Sent"

5. **Keyboard Shortcuts**
   - Global shortcut to open quick action modal
   - Tab through fields without mouse

6. **Customizable Workflows**
   - Admins can configure required fields per stage
   - "Moving to Proposal requires activity note"

7. **Mobile App Integration**
   - Same modal pattern in mobile app
   - Offline support with sync

---

## Appendix: Industry Research Summary

### Pipedrive Pattern

- **Entry:** Checkbox on activity in Kanban view
- **Flow:** Complete → Log outcome → Schedule next activity
- **Strength:** Enforces activity-based selling loop
- **Clicks:** 3-4

### HubSpot Pattern

- **Entry:** Checkbox on task
- **Flow:** Complete → Log notes (modal) → Update stage (main page)
- **Strength:** Clean, focused modals + visible context
- **Clicks:** 4

### Salesforce Lightning Pattern

- **Entry:** Action button/dropdown
- **Flow:** Composer popup → Path component stage update
- **Strength:** Configurable, enterprise-grade
- **Clicks:** 4-5

### Monday Sales CRM Pattern

- **Entry:** Direct cell click in grid
- **Flow:** Inline editing for all fields
- **Strength:** Fastest for power users (spreadsheet model)
- **Clicks:** 4-5

### Our Choice: HubSpot/Pipedrive Hybrid

We adopt the HubSpot/Pipedrive pattern because it:
1. Balances speed with structure
2. Guides users through best practices
3. Keeps context visible while focused
4. Maps to sales rep mental model
5. Has proven adoption in 100K+ users

---

## Approval & Sign-off

**Reviewed by:**
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] UX Designer
- [ ] Sales Manager (representing end users)

**Approval Date:** _____________

**Implementation Start Date:** _____________

**Target Completion:** 4-5 days from start

---

**End of Design Document**
