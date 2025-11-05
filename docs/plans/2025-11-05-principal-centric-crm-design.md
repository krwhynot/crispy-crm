# Principal-Centric CRM - Design Document

**Date:** November 5, 2025
**Status:** APPROVED - Ready for Implementation
**Estimated Effort:** 18-21 days
**Priority:** CRITICAL - Excel Replacement MVP
**Last Reviewed:** November 5, 2025 (stakeholder approval received)

---

## Key Design Decisions (From Review)

**Terminology:**
- UI: "Sales Rep" → "Account Manager" everywhere
- Database: Keep `sales` table as-is (no migration risk)
- Code: Add UI labels for "Account Manager" role

**Task Assignment Model:**
- Primary Account Manager (required)
- Secondary Account Manager (optional)
- Tertiary Account Manager (optional)
- Database fields: `primary_account_manager_id`, `secondary_account_manager_id`, `tertiary_account_manager_id`

**Report Priority:**
1. Opportunities by Principal (2 days) - CRITICAL, build first
2. Weekly Activity Summary (2 days) - CRITICAL, build second
3. Pipeline Status (2 days) - DEFERRED to post-launch

**Dashboard Layout:**
- **Table format** (not cards or grid)
- More compact, see all principals at once
- Better for desktop + iPad landscape

**Task Priority Field:**
- **Omitted** from MVP
- Use due date alone for sorting
- Can add later if Account Managers request it

**Testing Strategy:**
- Build all 3 features (18-21 days)
- Then test with Account Managers
- Iterate based on feedback

---

## Executive Summary

This design replaces the current dashboard-centric CRM with a principal-focused workflow. Sales reps represent food brands (principals) and sell to distributors (organizations). The #1 question reps ask is: "What must I do this week to move each principal forward?"

**Three features answer this question:**

1. **Principal Dashboard** - Shows all principals with task counts, overdue indicators, and activity summaries
2. **Reports Module** - Opportunities by Principal, Weekly Activity Summary (Pipeline Status deferred to Post-MVP)
3. **Tasks + Activities** - Full task management with principal grouping and activity tracking

**What changes:**
- Dashboard page: Delete all 13 existing widgets, build principal-centric view
- Reports: Add 3 report pages with principal filtering
- Tasks: Upgrade from embedded widget to full resource module with activity integration

**What we cut from original plan:**
- User adoption tracking (analytics)
- Global search bar (module search works)
- Offline mode (trade show capability)
- OAuth/2FA (enterprise security)
- vCard export (feature creep)
- Documentation tasks (ops materials)

**Result:** 60% time reduction (38-50 days → 18-21 days), laser focus on Excel replacement.

---

## Business Context

### The Principal Model

**Principals** = Food brands (Brand A, Brand B, Brand C)
**Organizations** = Distributors, restaurants, retailers who buy from principals
**Opportunities** = Potential sales of principal products to organizations
**Contacts** = Decision-makers at organizations

**Account Manager Workflow:**
1. Account Manager represents 3-5 principals
2. Account Manager has 15-20 active opportunities across multiple organizations
3. Account Manager must prioritize: "Which principal needs attention this week?"
4. Account Manager logs tasks (calls, demos, follow-ups) and activities (what actually happened)

**Note:** UI shows "Account Manager" but database uses `sales` table (existing schema)

### Success Criteria

**Excel Replacement in 30 Days:**
- Sales team abandons Excel spreadsheets
- All opportunity tracking happens in CRM
- Reps answer "What's my ONE thing for Principal X?" in 2 seconds

**Must-Have Features:**
- See all principals at a glance with priority indicators
- Group tasks and opportunities by principal
- Track activities to prove work is happening
- Export reports that match Excel pivot tables

---

## Feature 1: Principal-Centric Dashboard

**Replaces:** All 13 existing dashboard widgets
**Effort:** 5-7 days
**Priority:** HIGH

### User Story

> As an Account Manager, when I log in, I see my principals ranked by urgency so I know which one needs my focus today.

### Dashboard Layout

**Table Format (Compact, See All Principals at Once)**

```
My Principals - Week of Nov 4-10

┌──────────┬────────────────────┬────────────────────┬──────────────────────────────┬─────────────┐
│Principal │ Tasks              │ Activities         │ Top Opportunity              │ Actions     │
│          │ (Overdue)          │ This Week          │                              │             │
├──────────┼────────────────────┼────────────────────┼──────────────────────────────┼─────────────┤
│⚠️ Brand A│ 8 tasks (2 ⚠️)     │ 12 activities      │ Restaurant ABC               │[View Tasks] │
│          │ • Call pricing ⚠️  │ • Called Rest. ABC │ Negotiation - $5,000         │[View Opps]  │
│          │ • Send samples ⚠️  │ • Sent pricing XYZ │                              │             │
├──────────┼────────────────────┼────────────────────┼──────────────────────────────┼─────────────┤
│  Brand B │ 4 tasks            │ 5 activities       │ Cafe XYZ                     │[View Tasks] │
│          │ • Send pricing     │ • Demo product     │ Prospecting - $2,000         │[View Opps]  │
│          │ • Demo new item    │ • Sent email       │                              │             │
├──────────┼────────────────────┼────────────────────┼──────────────────────────────┼─────────────┤
│⚠️ Brand C│ 3 tasks (1 ⚠️)     │ 2 ⚠️ LOW ACTIVITY  │ Bistro 123                   │[View Tasks] │
│          │ • Check inventory⚠️│ • Called Market    │ Closed Won - $10,000         │[View Opps]  │
│          │                    │                    │                              │             │
└──────────┴────────────────────┴────────────────────┴──────────────────────────────┴─────────────┘

All elements clickable:
- Principal name → Filter all views to that principal
- Task name → Task detail modal
- Activity text → Organization detail page
- Opportunity name → Opportunity detail page
- [View Tasks] → Tasks page filtered to principal
- [View Opps] → Opportunities page filtered to principal
```

**Summary Stats Below Table:**

```
This Week: 15 tasks (3 overdue) | 19 activities logged | 18 opportunities
```

### Component Architecture

**File:** `src/atomic-crm/dashboard/PrincipalDashboard.tsx` (new, replaces Dashboard.tsx)

**Components:**

1. **PrincipalDashboard** (main container)
   - Fetches user's opportunities grouped by principal
   - Fetches user's tasks grouped by principal
   - Fetches user's recent activities
   - Renders principal cards sorted by priority

2. **PrincipalCard** (reusable card for each principal)
   - Props: `principal`, `tasks`, `opportunities`, `activities`
   - Shows task count, overdue indicator
   - Shows top opportunity (highest value or closest to closing)
   - Shows 2 overdue tasks OR next 2 upcoming tasks
   - Shows 2 most recent activities
   - Action buttons: "View All Tasks", "View Opportunities"

3. **PriorityIndicator** (visual badge)
   - Red ⚠️: Overdue tasks OR low activity (< 3 activities this week)
   - Yellow ⚡: Tasks due in next 2 days
   - Green ✅: All tasks on track, good activity

### Data Queries

**Query 1: User's Principals (via Opportunities)**
```typescript
// Get distinct principals from user's opportunities
const { data: principals } = useGetList('opportunities', {
  filter: {
    sales_id: currentUserId,
    status: 'Active'
  },
  sort: { field: 'principal_organization_id', order: 'ASC' }
});

// Group by principal_organization_id
const principalGroups = groupBy(principals, 'principal_organization_id');
```

**Query 2: Tasks by Principal**
```typescript
// Get tasks for each principal's opportunities
const { data: tasks } = useGetList('tasks', {
  filter: {
    opportunity_id: { in: principalOpportunityIds },
    status: { neq: 'Completed' }
  },
  sort: { field: 'due_date', order: 'ASC' }
});
```

**Query 3: Activities by Principal**
```typescript
// Get activities from last 7 days for principal's opportunities
const { data: activities } = useGetList('activities', {
  filter: {
    opportunity_id: { in: principalOpportunityIds },
    created_at: { gte: sevenDaysAgo }
  },
  sort: { field: 'created_at', order: 'DESC' }
});
```

### Business Logic

**Priority Calculation:**
```typescript
function calculatePrincipalPriority(principal: Principal): Priority {
  const overdueTasks = principal.tasks.filter(t => isPastDue(t.due_date));
  const activitiesThisWeek = principal.activities.filter(a => isThisWeek(a.created_at));

  if (overdueTasks.length > 0) return 'high'; // Red alert
  if (activitiesThisWeek.length < 3) return 'medium'; // Yellow warning
  if (hasTasksDueIn48Hours(principal.tasks)) return 'medium'; // Yellow
  return 'low'; // Green, all good
}
```

**Card Sorting:**
```typescript
// Sort principals: High priority first, then by task count
principals.sort((a, b) => {
  if (a.priority !== b.priority) {
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  }
  return b.tasks.length - a.tasks.length; // More tasks = higher
});
```

### Navigation

**Clickable Elements:**
- Principal name → Opportunities page filtered to that principal
- Opportunity name → Opportunity detail page
- Task name → Task detail modal
- Activity text → Organization detail page
- "View All Tasks" → Tasks page filtered to principal
- "View Opportunities" → Opportunities page filtered to principal

### User Preferences (Future)

Store user's dashboard preferences:
- Collapsed/expanded principal cards
- Sort order preference (priority vs. alphabetical)
- Hidden principals (if rep no longer works on that brand)

**Not building now** - Use default behavior (all expanded, priority sort)

---

## Feature 2: Reports Module

**Effort:** 5 days (3 reports)
**Priority:** CRITICAL

### Report 1: Opportunities by Principal (2 days)

**User Story:**
> As a sales manager, I want to see all opportunities grouped by principal so I can review pipeline distribution and ensure no principal is neglected.

**Page:** `/reports/opportunities-by-principal`

**Layout:**

```
Opportunities by Principal Report

Filters:
[Principal: All ▼] [Stage: All ▼] [Sales Rep: All ▼] [Date Range: All Time ▼]

[Export CSV]

Brand A (15 opportunities, $87,000 total value)
┌──────────────────────────────────────────────────────────┐
│ Opportunity        │ Organization  │ Stage        │ Value │
├────────────────────┼───────────────┼──────────────┼───────┤
│ Restaurant ABC     │ Restaurant ABC│ Negotiation  │$5,000 │ [Click → Opp]
│ Cafe XYZ           │ Cafe XYZ      │ Prospecting  │$2,000 │
│ [+ 13 more...]                                             │
└──────────────────────────────────────────────────────────┘

Brand B (10 opportunities, $45,000 total value)
┌──────────────────────────────────────────────────────────┐
│ [Similar table structure]                                │
└──────────────────────────────────────────────────────────┘
```

**Implementation:**

**File:** `src/atomic-crm/reports/OpportunitiesByPrincipal.tsx`

**Logic:**
```typescript
// Fetch all opportunities (with filters applied)
const { data: opportunities } = useGetList('opportunities', {
  filter: filterFromUI,
  sort: { field: 'expected_value', order: 'DESC' }
});

// Group by principal
const grouped = groupBy(opportunities, 'principal_organization_id');

// Calculate totals per principal
const principalSummaries = Object.entries(grouped).map(([principalId, opps]) => ({
  principalId,
  principalName: opps[0].principal_organization?.name,
  count: opps.length,
  totalValue: sum(opps.map(o => o.expected_value || 0)),
  opportunities: opps
}));

// Sort by total value descending
principalSummaries.sort((a, b) => b.totalValue - a.totalValue);
```

**CSV Export:**
```csv
Principal,Opportunity,Organization,Stage,Value,Close Date,Sales Rep
Brand A,Restaurant ABC,Restaurant ABC,Negotiation,5000,2025-12-01,Sarah
Brand A,Cafe XYZ,Cafe XYZ,Prospecting,2000,2025-11-15,Sarah
```

**Reuse:** This page reuses logic from the existing `OpportunitiesByPrincipal` dashboard widget but adds:
- Filtering (principal, stage, rep, date range)
- CSV export
- Full data table (not just summary)
- Click-through navigation

---

### Report 2: Pipeline Status (2 days)

**User Story:**
> As a sales rep, I want to see which opportunities are stuck in each stage and which are closing soon so I can prioritize follow-ups.

**Page:** `/reports/pipeline-status`

**Layout:**

```
Pipeline Status Report

Filters:
[Principal: All ▼] [Sales Rep: Me ▼] [Time Period: This Quarter ▼]

[Export CSV]

Stage: Prospecting (8 opportunities)
┌──────────────────────────────────────────────────────────┐
│ Opportunity        │ Principal │ Days in Stage │ Value   │
├────────────────────┼───────────┼───────────────┼─────────┤
│ Restaurant ABC     │ Brand A   │ 45 days ⚠️    │ $5,000  │ [Click → Opp]
│ Cafe XYZ           │ Brand B   │ 12 days       │ $2,000  │
└──────────────────────────────────────────────────────────┘

Stage: Negotiation (5 opportunities)
┌──────────────────────────────────────────────────────────┐
│ [Similar table]                                          │
└──────────────────────────────────────────────────────────┘

Closing This Month (3 opportunities)
┌──────────────────────────────────────────────────────────┐
│ Bistro 123         │ Brand C   │ Nov 15        │ $10,000 │
│ Market ABC         │ Brand A   │ Nov 20        │ $8,000  │
└──────────────────────────────────────────────────────────┘
```

**Implementation:**

**File:** `src/atomic-crm/reports/PipelineStatus.tsx`

**Logic:**
```typescript
// Group by stage
const byStage = groupBy(opportunities, 'stage');

// Calculate days in stage
const enriched = opportunities.map(opp => ({
  ...opp,
  daysInStage: differenceInDays(new Date(), opp.stage_changed_at || opp.created_at),
  isStuck: differenceInDays(new Date(), opp.stage_changed_at) > 30,
  isClosingSoon: opp.expected_close_date &&
                  differenceInDays(opp.expected_close_date, new Date()) <= 30
}));

// Highlight stuck (>30 days in stage)
const stuck = enriched.filter(o => o.isStuck);
```

**CSV Export:**
```csv
Stage,Opportunity,Principal,Days in Stage,Value,Close Date,Status
Prospecting,Restaurant ABC,Brand A,45,5000,2025-12-01,Stuck
```

---

### Report 3: Weekly Activity Summary (1 day)

**User Story:**
> As a sales manager, I want to see how many activities each rep logged this week, grouped by principal, so I can spot low activity and coach the team.

**Page:** `/reports/weekly-activity`

**Layout:**

```
Weekly Activity Summary - Nov 4-10, 2025

Filters:
[Sales Rep: All ▼] [Principal: All ▼]

[Export CSV]

Sarah (19 activities this week)
┌──────────────────────────────────────────────────────────┐
│ Principal   │ Calls │ Emails │ Meetings │ Notes │ Total  │
├─────────────┼───────┼────────┼──────────┼───────┼────────┤
│ Brand A     │ 5     │ 4      │ 2        │ 1     │ 12     │
│ Brand B     │ 2     │ 2      │ 0        │ 1     │ 5      │
│ Brand C     │ 1     │ 1      │ 0        │ 0     │ 2 ⚠️   │ Low!
└──────────────────────────────────────────────────────────┘

John (14 activities this week)
┌──────────────────────────────────────────────────────────┐
│ [Similar table]                                          │
└──────────────────────────────────────────────────────────┘
```

**Implementation:**

**File:** `src/atomic-crm/reports/WeeklyActivity.tsx`

**Logic:**
```typescript
// Get activities from last 7 days
const { data: activities } = useGetList('activities', {
  filter: {
    created_at: { gte: startOfWeek, lte: endOfWeek }
  }
});

// Group by user, then by principal
const byUser = groupBy(activities, 'user_id');

const userSummaries = Object.entries(byUser).map(([userId, userActivities]) => {
  const byPrincipal = groupBy(userActivities, 'opportunity.principal_organization_id');

  return {
    userId,
    userName: userActivities[0].user.name,
    total: userActivities.length,
    byPrincipal: Object.entries(byPrincipal).map(([principalId, acts]) => ({
      principalId,
      principalName: acts[0].opportunity?.principal_organization?.name,
      calls: acts.filter(a => a.type === 'Call').length,
      emails: acts.filter(a => a.type === 'Email').length,
      meetings: acts.filter(a => a.type === 'Meeting').length,
      notes: acts.filter(a => a.type === 'Note').length,
      total: acts.length
    }))
  };
});
```

**Warning Logic:**
- Flag principal if < 3 activities in a week
- Flag rep if total < 10 activities in a week

**CSV Export:**
```csv
Sales Rep,Principal,Calls,Emails,Meetings,Notes,Total
Sarah,Brand A,5,4,2,1,12
Sarah,Brand B,2,2,0,1,5
```

---

### Reports Navigation

**Add to main menu:**
```tsx
// src/atomic-crm/root/CRM.tsx

<Menu>
  <Menu.Item name="dashboard" to="/" />
  <Menu.Item name="opportunities" to="/opportunities" />
  <Menu.Item name="organizations" to="/organizations" />
  <Menu.Item name="contacts" to="/contacts" />
  <Menu.Item name="products" to="/products" />

  {/* NEW: Reports submenu */}
  <Menu.Item name="reports" to="/reports">
    <Menu.Item name="reports.opportunities-by-principal" to="/reports/opportunities-by-principal" />
    <Menu.Item name="reports.pipeline-status" to="/reports/pipeline-status" />
    <Menu.Item name="reports.weekly-activity" to="/reports/weekly-activity" />
  </Menu.Item>
</Menu>
```

**Route registration:**
```tsx
// src/atomic-crm/root/CRM.tsx

<Resource name="reports" />

<CustomRoutes>
  <Route path="/reports/opportunities-by-principal" element={<OpportunitiesByPrincipalReport />} />
  <Route path="/reports/pipeline-status" element={<PipelineStatusReport />} />
  <Route path="/reports/weekly-activity" element={<WeeklyActivityReport />} />
</CustomRoutes>
```

---

## Feature 3: Tasks Module + Activity Integration

**Effort:** 8-9 days
**Priority:** HIGH

### User Story

> As a sales rep, I want to see all my tasks grouped by principal, log activities when I complete tasks, and view activity history on organization pages so I can track what I've done and plan next steps.

### Part A: Tasks Full Resource Module (5 days)

**Current State:** Tasks exist as an embedded widget on opportunity pages (add/edit/delete)

**New State:** Tasks become a full resource with:
- Standalone List page (`/tasks`)
- Show page (task detail modal)
- Edit page (inline or modal)
- Create page (quick-add from anywhere)

#### Tasks List Page

**Route:** `/tasks`

**Layout:**

```
Tasks

Filters:
[Principal: All ▼] [Due Date: All ▼] [Status: Active ▼] [Assigned To: Me ▼]

Group by: [Principal ▼] [Due Date] [Opportunity]

Brand A (8 tasks, 2 overdue)
┌────────────────────────────────────────────────────────────┐
│☐│Due: Nov 6⚠️│Call about pricing         │Restaurant ABC │ [Click → Opp]
│☐│Due: Nov 6⚠️│Send samples                │Cafe XYZ       │
│☐│Due: Nov 7  │Follow up on order          │Bistro 123     │
│☐│Due: Nov 8  │Schedule tasting            │Hotel Rest.    │
└────────────────────────────────────────────────────────────┘

Brand B (4 tasks)
┌────────────────────────────────────────────────────────────┐
│☐│Due: Nov 7  │Send pricing sheet          │Diner 456      │
│☐│Due: Nov 9  │Demo new product            │Cafe 789       │
└────────────────────────────────────────────────────────────┘

[+ Add Task] button (floating action button)
```

**Implementation:**

**Files:**
```
src/atomic-crm/tasks/
  ├── index.ts               (export List, Show, Edit, Create)
  ├── List.tsx               (main tasks list page)
  ├── Show.tsx               (task detail modal)
  ├── Edit.tsx               (edit task form)
  ├── Create.tsx             (quick-add task form)
  ├── TaskRow.tsx            (reusable task row component)
  ├── TaskGrouping.tsx       (grouping logic component)
  └── __tests__/
      └── List.test.tsx
```

**List.tsx Structure:**
```typescript
export const TasksList = () => {
  const { data: tasks, isLoading } = useGetList('tasks', {
    filter: filterFromUI,
    sort: { field: 'due_date', order: 'ASC' }
  });

  const groupBy = useGroupBy(); // 'principal', 'due_date', 'opportunity'
  const grouped = groupTasksBy(tasks, groupBy);

  return (
    <List>
      <TaskFilters />
      <TaskGroupingSelector />

      {grouped.map(group => (
        <TaskGroup key={group.key} title={group.title} count={group.count}>
          {group.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onEdit={handleEdit}
            />
          ))}
        </TaskGroup>
      ))}

      <FloatingActionButton onClick={openCreateModal}>
        + Add Task
      </FloatingActionButton>
    </List>
  );
};
```

**TaskRow Component:**
```typescript
const TaskRow = ({ task, onComplete, onEdit }) => {
  const opportunity = task.opportunity; // Eager loaded via RLS join
  const principal = opportunity?.principal_organization;

  return (
    <tr className={task.is_overdue ? 'bg-red-50' : ''}>
      <td>
        <Checkbox checked={task.status === 'Completed'} onChange={() => onComplete(task)} />
      </td>
      <td>
        {task.is_overdue && <WarningIcon />}
        {formatDate(task.due_date)}
      </td>
      <td>
        <Link to={`/tasks/${task.id}`}>{task.title}</Link>
      </td>
      <td>
        <Link to={`/opportunities/${opportunity.id}`}>{opportunity.name}</Link>
      </td>
      <td>
        <Link to={`/organizations/${opportunity.organization_id}`}>
          {opportunity.organization?.name}
        </Link>
      </td>
      <td>
        <span className="badge">{principal?.name || 'No Principal'}</span>
      </td>
      <td>
        <EditButton onClick={() => onEdit(task)} />
      </td>
    </tr>
  );
};
```

**Grouping Logic:**
```typescript
function groupTasksBy(tasks: Task[], groupBy: 'principal' | 'due_date' | 'opportunity') {
  if (groupBy === 'principal') {
    const grouped = groupBy(tasks, t => t.opportunity?.principal_organization_id);

    return Object.entries(grouped).map(([principalId, tasks]) => ({
      key: principalId,
      title: tasks[0].opportunity?.principal_organization?.name || 'No Principal',
      count: tasks.length,
      overdueCount: tasks.filter(t => t.is_overdue).length,
      tasks: tasks.sort((a, b) => compareDate(a.due_date, b.due_date))
    }));
  }

  // Similar logic for due_date and opportunity grouping
}
```

#### Task Detail Modal

**Shows when clicking task name**

**Layout:**
```
Task: Call about pricing

Due Date: Nov 6, 2025 ⚠️ OVERDUE
Assigned To: Sarah
Status: Active

Related:
• Opportunity: Restaurant ABC - $5,000    [Click → Opp]
• Organization: Restaurant ABC             [Click → Org]
• Principal: Brand A                       [Click → Filter]

Description:
Follow up on pricing discussion from last week. Chef wants
quotes for 2 cases Brand A sauce.

Recent Activities for this task:
• Nov 4: Called, left voicemail
• Nov 3: Sent email with pricing

[Log Activity] [Mark Complete] [Edit Task] [Delete]
```

**Implementation:** React Admin `<Show>` component with custom layout

---

### Part B: Activity Tracking Integration (3-4 days)

**Goal:** Link tasks to activities, show activity timeline on Organization/Contact pages

#### Activity Logging from Tasks

**When user completes a task, prompt to log activity:**

```
✅ Task completed: "Call about pricing"

Log what happened? (optional)
┌─────────────────────────────────────────┐
│ Activity Type: [Call ▼]                │
│ Notes: Spoke with chef, needs 2 cases  │
│       by Friday. Sending quote.         │
│                                         │
│ [Save Activity] [Skip]                  │
└─────────────────────────────────────────┘
```

**Logic:**
```typescript
const handleCompleteTask = async (task: Task) => {
  // Mark task complete
  await updateTask(task.id, { status: 'Completed', completed_at: new Date() });

  // Prompt for activity
  const activity = await openActivityDialog({
    opportunityId: task.opportunity_id,
    organizationId: task.opportunity.organization_id,
    type: inferActivityType(task.title), // 'Call' if title contains 'call'
    notes: `Completed task: ${task.title}`
  });

  if (activity) {
    await createActivity({
      ...activity,
      related_task_id: task.id // Link to task
    });
  }
};
```

#### Activity Timeline on Organization Page

**Add new section to Organization detail page:**

```
Organization: Restaurant ABC

[Tabs: Overview | Opportunities | Contacts | Activities]

Activities Tab:
┌─────────────────────────────────────────────────────────┐
│ Nov 4, 2025 - Call (Sarah)                             │
│ Spoke with chef about Brand A pricing. Needs 2 cases   │
│ by Friday. Sending quote.                              │
│ Related: Call about pricing task ✅                     │ [Click → Task]
│ Related: Restaurant ABC - $5,000 opportunity           │ [Click → Opp]
│                                                         │
│ Nov 3, 2025 - Email (Sarah)                            │
│ Sent pricing sheet for Brand A sauce.                  │
│ Related: Send pricing task                             │
│                                                         │
│ [+ Log Activity] button                                │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

**File:** `src/atomic-crm/organizations/ActivitiesTab.tsx`

```typescript
const ActivitiesTab = ({ organizationId }) => {
  const { data: activities } = useGetList('activities', {
    filter: { organization_id: organizationId },
    sort: { field: 'created_at', order: 'DESC' }
  });

  return (
    <div>
      <Button onClick={openLogActivityDialog}>+ Log Activity</Button>

      <Timeline>
        {activities.map(activity => (
          <ActivityEntry key={activity.id} activity={activity} />
        ))}
      </Timeline>
    </div>
  );
};

const ActivityEntry = ({ activity }) => (
  <TimelineItem>
    <strong>{formatDate(activity.created_at)} - {activity.type}</strong> ({activity.user.name})
    <p>{activity.notes}</p>

    {activity.related_task && (
      <Link to={`/tasks/${activity.related_task.id}`}>
        Related: {activity.related_task.title} ✅
      </Link>
    )}

    {activity.opportunity && (
      <Link to={`/opportunities/${activity.opportunity.id}`}>
        Related: {activity.opportunity.name}
      </Link>
    )}
  </TimelineItem>
);
```

#### Quick Activity Logging Component

**Reusable component for logging activities from anywhere:**

```typescript
// src/atomic-crm/activities/QuickLogActivity.tsx

export const QuickLogActivity = ({ opportunityId, organizationId, onSave }) => {
  const [type, setType] = useState<'Call' | 'Email' | 'Meeting' | 'Note'>('Call');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    await createActivity({
      opportunity_id: opportunityId,
      organization_id: organizationId,
      type,
      notes,
      user_id: currentUserId,
      created_at: new Date()
    });

    onSave?.();
  };

  return (
    <Dialog>
      <Select value={type} onChange={setType}>
        <option value="Call">Call</option>
        <option value="Email">Email</option>
        <option value="Meeting">Meeting</option>
        <option value="Note">Note</option>
      </Select>

      <TextArea
        value={notes}
        onChange={setNotes}
        placeholder="What happened?"
      />

      <Button onClick={handleSave}>Save Activity</Button>
    </Dialog>
  );
};
```

**Use this component:**
- On task completion
- On opportunity detail page ("Log Activity" button)
- On organization detail page ("Log Activity" button)
- On contact detail page ("Log Activity" button)

---

### Database Schema Updates

**Current `tasks` table:**
```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT REFERENCES opportunities(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Add fields:**
```sql
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN assigned_to BIGINT REFERENCES sales(id);
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Medium'; -- Low, Medium, High
```

**Current `activities` table:**
```sql
CREATE TABLE activities (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  opportunity_id BIGINT REFERENCES opportunities(id),
  organization_id BIGINT REFERENCES organizations(id),
  type TEXT NOT NULL, -- Call, Email, Meeting, Note
  notes TEXT,
  user_id BIGINT REFERENCES sales(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Add fields:**
```sql
ALTER TABLE activities ADD COLUMN related_task_id BIGINT REFERENCES tasks(id);
ALTER TABLE activities ADD COLUMN contact_id BIGINT REFERENCES contacts(id);
```

**Migration file:** `supabase/migrations/20251105000000_tasks_activities_enhancement.sql`

---

## Implementation Plan

### Phase 1: Principal Dashboard (5-7 days)

**Day 1-2: Data Layer**
- Write queries to fetch user's principals (via opportunities)
- Write queries to fetch tasks grouped by principal
- Write queries to fetch activities grouped by principal
- Test data aggregation and grouping logic

**Day 3-4: UI Components**
- Build `PrincipalCard` component
- Build `PriorityIndicator` component
- Build `PrincipalDashboard` container
- Style with Tailwind (iPad-first responsive)

**Day 5: Integration & Testing**
- Replace current Dashboard.tsx with PrincipalDashboard.tsx
- Test click-through navigation
- Test filtering logic
- Write unit tests for priority calculation

**Day 6-7: Polish**
- Add loading states
- Add error handling
- Test with real data
- Optimize queries for performance

---

### Phase 2: Reports Module (5 days)

**Day 1-2: Opportunities by Principal Report**
- Build report page layout
- Implement grouping logic
- Add filtering (principal, stage, rep, date)
- Implement CSV export
- Test with large datasets

**Day 2-3: Pipeline Status Report**
- Build report page layout
- Calculate "days in stage"
- Implement "stuck" detection (>30 days)
- Implement "closing soon" detection (<30 days to close)
- Add CSV export
- Test calculations

**Day 3-4: Weekly Activity Summary**
- Build report page layout
- Implement user + principal grouping
- Calculate activity type counts
- Implement low activity warnings (<3 activities/week)
- Add CSV export
- Test edge cases (no activities, new reps)

**Day 5: Navigation & Polish**
- Add Reports menu to CRM.tsx
- Test all click-through navigation
- Style consistency check
- Write integration tests

---

### Phase 3: Tasks Module + Activities (8-9 days)

**Day 1-2: Tasks Resource Setup**
- Create tasks/ directory with List/Show/Edit/Create
- Register tasks resource in CRM.tsx
- Build TasksList component with grouping
- Build TaskRow component
- Build TaskFilters component

**Day 3-4: Task Detail & CRUD**
- Build task detail modal (Show.tsx)
- Build task edit form (Edit.tsx)
- Build quick-add task form (Create.tsx)
- Implement inline task completion (checkbox)
- Test create/update/delete flows

**Day 5-6: Activity Integration**
- Build QuickLogActivity component
- Implement "log activity on task completion" flow
- Add activity timeline to Organization detail page
- Add activity timeline to Contact detail page
- Test activity creation from multiple entry points

**Day 7: Database Migration**
- Write migration for tasks table updates (completed_at, assigned_to, priority)
- Write migration for activities table updates (related_task_id, contact_id)
- Run migration on local database
- Test RLS policies for new fields

**Day 8-9: Testing & Polish**
- Write unit tests for task grouping logic
- Write integration tests for activity logging flow
- Test task → activity linkage
- Test navigation from tasks to opportunities/organizations
- Style polish and responsive design check

---

## Success Criteria

### Must-Have (Launch Blockers)

✅ **Principal Dashboard**
- [ ] Shows all user's principals with task/activity counts
- [ ] Highlights overdue tasks and low activity principals
- [ ] All elements are clickable with correct navigation
- [ ] Updates in real-time when tasks/activities change

✅ **Reports**
- [ ] Opportunities by Principal: Groups, filters, exports CSV
- [ ] Pipeline Status: Shows stuck deals, closing soon, days in stage
- [ ] Weekly Activity: Shows activity counts by principal and user

✅ **Tasks + Activities**
- [ ] Tasks List page with principal grouping
- [ ] Can complete tasks and log activities in one flow
- [ ] Activity timeline shows on Organization/Contact pages
- [ ] All task/activity data links correctly to opportunities

### Nice-to-Have (Post-Launch)

- Dashboard user preferences (collapsed cards, sort order)
- Task reminders/notifications
- Activity auto-suggestions based on task type
- Report scheduling (email CSV weekly)
- Mobile app for activity logging

---

## What We're NOT Building

**Cut from original 15-task plan:**

1. ❌ User Adoption Tracking - Can add post-launch if needed
2. ❌ Global Search Bar - Module search is sufficient
3. ❌ Offline Mode - Trade show capability, not critical
4. ❌ OAuth Integration - Email/password works for small team
5. ❌ Activity Auto-Generation - Manual logging is fine
6. ❌ Products Import/Export - Products CRUD works without it
7. ❌ vCard Export - Not in original MVP, feature creep
8. ❌ Two-Factor Auth - Enterprise security, defer
9. ❌ Data Quality Widget - Monitoring, not workflow
10. ❌ Incident Response Playbook - Ops docs, not user-facing
11. ❌ Manual Rollback Docs - Ops docs, not user-facing
12. ❌ Fix vCard Export Docs - Feature removed, no docs needed

**Why cut these:**
- None directly help sales reps abandon Excel
- Analytics/monitoring can wait until we have real usage data
- Enterprise features (OAuth, 2FA) are overkill for small team
- Offline mode is a trade show edge case

**Can add later if needed** - But focus on Excel replacement first.

---

## Risk Assessment

### Technical Risks

**Risk 1: Performance with large datasets**
- **Problem:** Grouping 500+ opportunities by principal may be slow
- **Mitigation:** Use database-level grouping (SQL GROUP BY), not client-side
- **Mitigation:** Add pagination to reports
- **Mitigation:** Index principal_organization_id column

**Risk 2: Complex data queries**
- **Problem:** Dashboard needs 3+ queries (principals, tasks, activities)
- **Mitigation:** Use React Query for parallel fetching
- **Mitigation:** Cache query results (5 min stale time)
- **Mitigation:** Show loading skeletons for better UX

### User Adoption Risks

**Risk 1: Reps resist logging activities**
- **Problem:** Activity tracking feels like extra work
- **Mitigation:** Make activity logging 1-click from task completion
- **Mitigation:** Show value: "Your manager sees your hard work"
- **Mitigation:** Auto-fill activity notes from task title

**Risk 2: Principal grouping doesn't match mental model**
- **Problem:** Reps think by customer, not by principal
- **Mitigation:** Allow switching between "Group by Principal" and "Group by Organization"
- **Mitigation:** Show both views in dashboard settings

### Data Quality Risks

**Risk 1: Opportunities missing principal**
- **Problem:** Can't group if principal_organization_id is NULL
- **Mitigation:** Make principal a required field on opportunity creation
- **Mitigation:** Show "Unassigned" group for NULL principals
- **Mitigation:** Dashboard warning: "5 opportunities need principal assigned"

---

## Next Steps

1. **Review this design** - Share with stakeholders, get feedback
2. **Create implementation branch** - Use git worktree for isolation
3. **Build in phases** - Dashboard first (highest value), then reports, then tasks
4. **Test with real data** - Import current Excel data to test grouping
5. **Launch to 1-2 reps** - Get feedback before full rollout

---

## Appendix: Wireframes

### Principal Dashboard Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Atomic CRM                     [Sarah] [Logout]            │
├─────────────────────────────────────────────────────────────┤
│  My Principals - Week of Nov 4-10                           │
│                                                             │
│  ┌──── Brand A ─────────────────────────────────────────┐  │
│  │ 8 tasks (2 overdue ⚠️) | 12 activities               │  │
│  │                                                        │  │
│  │ Top Opportunity:                                      │  │
│  │ • Restaurant ABC - Negotiation - $5,000  [→]         │  │
│  │                                                        │  │
│  │ Action Needed:                                        │  │
│  │ • Call about pricing (Nov 6 ⚠️) [→]                   │  │
│  │ • Send samples (Nov 6 ⚠️) [→]                         │  │
│  │                                                        │  │
│  │ Recent Activity:                                      │  │
│  │ • Nov 4: Called Restaurant ABC [→]                    │  │
│  │ • Nov 3: Sent pricing to Cafe XYZ [→]                │  │
│  │                                                        │  │
│  │ [View All Tasks →] [View Opportunities →]            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──── Brand B ─────────────────────────────────────────┐  │
│  │ 4 tasks (0 overdue) | 5 activities                   │  │
│  │ [Collapsed - click to expand]                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──── Brand C ─────────────────────────────────────────┐  │
│  │ 3 tasks (1 overdue ⚠️) | 2 activities ⚠️             │  │
│  │ WARNING: Low activity this week                       │  │
│  │ [Collapsed - click to expand]                        │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tasks List Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Tasks                                                      │
│  ────────────────────────────────────────────────────────  │
│  Filters: [Principal: All▼] [Due: All▼] [Status: Active▼] │
│  Group by: [Principal ▼]                                   │
│                                                             │
│  Brand A (8 tasks, 2 overdue)                              │
│  ┌────┬──────────┬────────────────────┬──────────────────┐ │
│  │☐ │Nov 6 ⚠️ │Call about pricing  │Restaurant ABC[→]│ │
│  │☐ │Nov 6 ⚠️ │Send samples         │Cafe XYZ [→]     │ │
│  │☐ │Nov 7    │Follow up on order  │Bistro 123 [→]   │ │
│  └────┴──────────┴────────────────────┴──────────────────┘ │
│                                                             │
│  Brand B (4 tasks)                                         │
│  ┌────┬──────────┬────────────────────┬──────────────────┐ │
│  │☐ │Nov 7    │Send pricing         │Diner 456 [→]    │ │
│  │☐ │Nov 9    │Demo product         │Cafe 789 [→]     │ │
│  └────┴──────────┴────────────────────┴──────────────────┘ │
│                                                             │
│                                      [+ Add Task] (FAB)    │
└─────────────────────────────────────────────────────────────┘
```

---

**End of Design Document**

**Approval Required:** Product Owner, Engineering Lead
**Implementation Start:** Upon approval
**Target Completion:** 18-21 days from start
