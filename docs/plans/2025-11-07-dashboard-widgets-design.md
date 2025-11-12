# Dashboard Widgets Design - Principal-Centric Enhancement

**Created:** 2025-11-07
**Status:** Design Complete - Ready for Implementation
**Design Goal:** Add supporting widgets to help account managers identify their ONE priority action each week

---

## Overview

Enhance the existing principal-centric dashboard table with supporting widgets that provide context for weekly action prioritization. Based on industry research and food distribution best practices, add 4 new widgets while keeping the principal table as the primary focus.

### Core Question Answered

> "What is the ONE thing I have to do this week that will increase the likelihood of my distributor stocking the principal, adding a new item, or growing volume on a stocked item?"

### Design Principles

1. **Keep principal table primary** - Supporting widgets provide context, not distraction
2. **Industry standard compliance** - 5 widgets total (within 6-8 optimal range) - ✅ COMPLETE
3. **iPad-first responsive** - Grid layout for landscape, stack for portrait
4. **No financial tracking** - Aligns with financial removal initiative
5. **YAGNI ruthlessly** - Only essential widgets, no "nice to have" features

---

## Research Findings

### Industry Standards (Salesforce, HubSpot, Dynamics, Pipedrive)

**Key Findings:**
- **Optimal widget count:** 6-8 widgets maximum before cognitive overload
- **Most common widgets:** Pipeline, Tasks, Activity Feed, Quota (removed), Recent Activity
- **Layout pattern:** 70% main content + 30% sidebar for supporting metrics
- **Prime real estate:** Top-left/center for critical metrics

### Food Distribution Industry Specifics

**Essential dashboard elements for managing 3-5 principal brands:**
1. ✅ Relationship health scoring (have: status indicators)
2. ✅ Deal pipeline by brand (have: opportunity count)
3. ✅ Task & activity management (adding)
4. ✅ Upcoming events/deadlines (adding)
5. ❌ Quota tracking (removed - no financial tracking)
6. ❌ Promotions/inventory (out of scope)

**What helps answer "What's my ONE priority?"**
1. Relationship health score → ✅ Principal table status
2. Pipeline review → ✅ Principal table opportunity count
3. Task list → 🆕 Adding
4. Upcoming events → 🆕 Adding
5. Recent activity context → 🆕 Adding

---

## Dashboard Layout

### Grid Layout (Option B - Approved)

**Desktop/iPad Landscape (1024px+):**
```
┌──────────────────────────────────┬─────────────────────┐
│ LEFT COLUMN (70%)                │ SIDEBAR (30%)       │
├──────────────────────────────────┼─────────────────────┤
│ 1. Upcoming Events by Principal  │ 3. My Tasks         │
│                                  │    This Week        │
├──────────────────────────────────┤                     │
│ 2. Principal Table (MAIN)        ├─────────────────────┤
│    [Existing - No Changes]       │ 4. Recent Activity  │
│                                  │    Feed             │
│                                  │                     │
│                                  ├─────────────────────┤
│                                  │ 5. Pipeline Summary │
└──────────────────────────────────┴─────────────────────┘
```

**iPad Portrait/Mobile (768px and below):**
```
┌──────────────────────────────────┐
│ 1. Upcoming Events (full width)  │
├──────────────────────────────────┤
│ 2. Principal Table (full width)  │
├──────────────────────────────────┤
│ 3. My Tasks (full width)         │
├──────────────────────────────────┤
│ 4. Recent Activity (full width)  │
├──────────────────────────────────┤
│ 5. Pipeline Summary (full width) │
└──────────────────────────────────┘
```

**Responsive CSS:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
  <div className="space-y-6">{/* Left column */}</div>
  <div className="space-y-6">{/* Right sidebar */}</div>
</div>
```

**Why Grid Layout:**
- iPad Landscape: Everything visible at once, no scrolling
- iPad Portrait: Auto-stacks to single column via responsive CSS
- Touch-friendly: Large widgets, no small accordion arrows
- Industry standard: Matches Salesforce, HubSpot patterns

---

## Widget Specifications

### Widget 1: Upcoming Events by Principal

**Purpose:** Show this week's scheduled activities grouped by principal

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ UPCOMING BY PRINCIPAL                   │
├─────────────────────────────────────────┤
│ 🔴 Fishpeople (2 events)                │
│   • Today 2:00pm - Call Ballyhoo        │
│     (re: pricing quote)                 │
│   • Fri 11/9 - Proposal deadline        │
│                                         │
│ 🟡 Ocean Hugger (1 event)               │
│   • Fri 3:00pm - Follow-up call Nobu    │
│                                         │
│ 🟢 La Tourangelle (1 event)             │
│   • Thu 10:00am - Demo at Roka          │
└─────────────────────────────────────────┘
```

**Data Source:**
- `tasks` table: `completed = false` AND `due_date BETWEEN today AND today+7`
- `activities` table: Scheduled meetings/calls with future dates
- Join with `organizations` for principal names
- Group by `principal_organization_id`
- Sort by principal status (🔴 → 🟡 → 🟢), then by date

**Interactions:**
- Click event → Opens task/activity detail modal
- Click principal name → Filters principal table to that principal
- Empty state: "No scheduled events this week"

**Size:**
- Desktop/Landscape: Full width of left column (~70%)
- Height: Auto (max 300px with scroll if >5 principals)
- Portrait/Mobile: Full width

**Component:**
```tsx
// src/atomic-crm/dashboard/UpcomingEventsByPrincipal.tsx
export const UpcomingEventsByPrincipal = () => {
  const { data: tasks } = useGetList('tasks', {
    filter: {
      completed: false,
      due_date_gte: formatISO(new Date()),
      due_date_lte: formatISO(addDays(new Date(), 7))
    }
  });

  // Group by principal, sort by status + date
  const eventsByPrincipal = groupAndSortEvents(tasks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming by Principal</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[300px] overflow-y-auto">
        {eventsByPrincipal.map(principal => (
          <PrincipalEventGroup key={principal.id} {...principal} />
        ))}
      </CardContent>
    </Card>
  );
};
```

---

### Widget 2: Principal Table (MAIN)

**Status:** ✅ Already implemented in `PrincipalDashboardTable.tsx`

**No changes needed** - Existing implementation already provides:
- 6 columns: Principal, # Opps, Status, Last Activity, Stuck, Next Action
- Priority sorting (urgency algorithm)
- Color-coded status indicators
- Auto-refresh every 5 minutes
- Responsive column hiding

**Placement:** Center of left column, largest widget on page

---

### Widget 3: My Tasks This Week

**Purpose:** Show incomplete tasks due this week, prioritized by urgency

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ MY TASKS THIS WEEK                      │
├─────────────────────────────────────────┤
│ ⚠️ OVERDUE (2)                          │
│   ☐ Send proposal to Ballyhoo           │
│      2 days late → Fishpeople           │
│   ☐ Follow-up quote                     │
│      1 day late → Ocean Hugger          │
│                                         │
│ 📅 DUE TODAY (1)                        │
│   ☐ Call with Nobu at 3pm               │
│      → Ocean Hugger                     │
│                                         │
│ 📆 THIS WEEK (3)                        │
│   ☐ Demo prep for Roka (Thu)            │
│      → La Tourangelle                   │
│   ☐ Price update Whole Foods (Fri)      │
│      → Rapid Rasoi                      │
│   ☐ Monthly check-in (Fri)              │
│      → Better Balance                   │
│                                         │
│ [View All Tasks →]                      │
└─────────────────────────────────────────┘
```

**Data Source:**
- `tasks` table WHERE:
  - `assigned_to = current_user.sales_id`
  - `completed = false`
  - `(due_date <= today + 7 days) OR (due_date < today)`
- Group by urgency: Overdue → Today → This Week
- Sort within groups: `due_date ASC`, then `priority DESC`

**Interactions:**
- Click task checkbox → Mark complete (inline via `useUpdate`)
- Click task text → Opens task detail modal for editing
- Click "→ Principal" link → Filters principal table
- Click "View All Tasks" → Navigate to `/tasks`

**Size:**
- Sidebar widget (30% width on desktop/landscape)
- Height: Max 350px with internal scroll
- Shows ~6-8 tasks before scrolling

**Empty State:**
- "No tasks due this week 🎉"

**Component:**
```tsx
// src/atomic-crm/dashboard/MyTasksThisWeek.tsx
export const MyTasksThisWeek = () => {
  const { identity } = useGetIdentity();
  const { data: tasks } = useGetList('tasks', {
    filter: {
      assigned_to: identity?.id,
      completed: false,
      due_date_lte: formatISO(addDays(new Date(), 7))
    },
    sort: { field: 'due_date', order: 'ASC' }
  });

  const grouped = groupTasksByUrgency(tasks);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks This Week</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[350px] overflow-y-auto">
        {grouped.overdue.length > 0 && (
          <TaskGroup title="⚠️ OVERDUE" tasks={grouped.overdue} />
        )}
        {grouped.today.length > 0 && (
          <TaskGroup title="📅 DUE TODAY" tasks={grouped.today} />
        )}
        {grouped.thisWeek.length > 0 && (
          <TaskGroup title="📆 THIS WEEK" tasks={grouped.thisWeek} />
        )}
      </CardContent>
      <CardFooter>
        <Link to="/tasks">View All Tasks →</Link>
      </CardFooter>
    </Card>
  );
};
```

---

### Widget 4: Recent Activity Feed

**Purpose:** Show last 5-7 activities to provide context and jog memory

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ RECENT ACTIVITY                         │
├─────────────────────────────────────────┤
│ 2 hours ago                             │
│ 📞 Call - Ballyhoo pricing discussion   │
│    → Fishpeople                         │
│                                         │
│ Yesterday 3:15pm                        │
│ 📧 Email - Sent proposal to Nobu        │
│    → Ocean Hugger                       │
│                                         │
│ Nov 5, 2:30pm                           │
│ 🤝 Meeting - Demo at Whole Foods        │
│    → Rapid Rasoi                        │
│                                         │
│ Nov 5, 11:00am                          │
│ 📝 Note - Follow-up needed on quote     │
│    → Better Balance                     │
│                                         │
│ Nov 4, 4:00pm                           │
│ 📞 Call - Contract renewal discussion   │
│    → Annasea                            │
│                                         │
│ [View All Activity →]                   │
└─────────────────────────────────────────┘
```

**Data Source:**
- `activities` table WHERE:
  - `sales_id = current_user.sales_id`
  - `deleted_at IS NULL`
- Sort by `activity_date DESC`
- Limit to 7 most recent

**Activity Type Icons:**
```typescript
const activityIcons = {
  Call: '📞',
  Email: '📧',
  Meeting: '🤝',
  Note: '📝',
};
```

**Interactions:**
- Click activity → Opens activity detail modal
- Click "→ Principal" → Filters principal table
- Click "View All Activity" → Navigate to `/activities`
- Auto-refreshes when new activity logged

**Size:**
- Sidebar widget (30% width)
- Height: ~280px with scroll
- Shows 5-7 activities

**Empty State:**
- "No recent activity logged"

**Component:**
```tsx
// src/atomic-crm/dashboard/RecentActivityFeed.tsx
export const RecentActivityFeed = () => {
  const { identity } = useGetIdentity();
  const { data: activities } = useGetList('activities', {
    filter: { sales_id: identity?.id },
    sort: { field: 'activity_date', order: 'DESC' },
    pagination: { page: 1, perPage: 7 }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[280px] overflow-y-auto">
        {activities?.map(activity => (
          <ActivityItem key={activity.id} {...activity} />
        ))}
      </CardContent>
      <CardFooter>
        <Link to="/activities">View All Activity →</Link>
      </CardFooter>
    </Card>
  );
};
```

---

### Widget 5: Pipeline Summary

**Purpose:** High-level pipeline health across all principals

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ PIPELINE SUMMARY                        │
├─────────────────────────────────────────┤
│ Total Opportunities: 12                 │
│                                         │
│ By Stage:                               │
│ Prospecting:     3 opps                 │
│ Qualification:   2 opps                 │
│ Proposal:        4 opps ⚠️ (2 stuck)    │
│ Negotiation:     1 opp                  │
│ Closed Won:      2 opps                 │
│                                         │
│ By Status:                              │
│ 🟢 Active:       10 opps                │
│ ⚠️ Stuck (30+d): 3 opps                 │
│ 🔴 At Risk:      2 opps                 │
│                                         │
│ Pipeline Health: 🟡 Fair                │
│ (2 deals stuck, 1 urgent principal)     │
└─────────────────────────────────────────┘
```

**Data Source:**
- `opportunities` table WHERE:
  - `primary_account_manager_id = current_user.sales_id`
  - `status = 'active'`
  - `deleted_at IS NULL`
- Aggregate counts by `stage`
- Calculate stuck: `days_in_stage >= 30`
- Calculate at-risk: Count principals with status = 'urgent'

**Pipeline Health Logic:**
```typescript
const calculatePipelineHealth = (
  stuckDeals: number,
  urgentPrincipals: number
) => {
  if (stuckDeals > 3 || urgentPrincipals > 1) {
    return { icon: '🔴', label: 'Needs Attention' };
  }
  if (stuckDeals > 1 || urgentPrincipals > 0) {
    return { icon: '🟡', label: 'Fair' };
  }
  return { icon: '🟢', label: 'Healthy' };
};
```

**Interactions:**
- Click stage name → Navigate to `/opportunities?filter=stage:{stage}`
- Click "Stuck" → Navigate to `/opportunities?filter=stuck:true`
- Click "At Risk" → Navigate to urgent principals' opportunities

**Size:**
- Sidebar widget (30% width)
- Height: ~300px
- Compact metrics display

**Empty State:**
- "No active opportunities"

**Component:**
```tsx
// src/atomic-crm/dashboard/PipelineSummary.tsx
export const PipelineSummary = () => {
  const { identity } = useGetIdentity();
  const { data: opportunities } = useGetList('opportunities', {
    filter: {
      primary_account_manager_id: identity?.id,
      status: 'active'
    }
  });

  const metrics = calculatePipelineMetrics(opportunities);
  const health = calculatePipelineHealth(
    metrics.stuckDeals,
    metrics.urgentPrincipals
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <MetricRow label="Total Opportunities" value={metrics.total} />

          <div>
            <h4 className="font-semibold mb-2">By Stage:</h4>
            {metrics.byStage.map(stage => (
              <StageRow key={stage.name} {...stage} />
            ))}
          </div>

          <div>
            <h4 className="font-semibold mb-2">By Status:</h4>
            <StatusRow icon="🟢" label="Active" count={metrics.active} />
            <StatusRow icon="⚠️" label="Stuck (30+d)" count={metrics.stuck} />
            <StatusRow icon="🔴" label="At Risk" count={metrics.atRisk} />
          </div>

          <div className="pt-2 border-t">
            <span className="font-semibold">Pipeline Health: </span>
            <span className="text-lg">{health.icon} {health.label}</span>
            <p className="text-sm text-muted-foreground mt-1">
              ({metrics.stuck} deals stuck, {metrics.urgentPrincipals} urgent principal)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## Technical Implementation

### Component Structure

```
src/atomic-crm/dashboard/
├── Dashboard.tsx                    (✅ EXISTS - MODIFY)
├── PrincipalDashboardTable.tsx      (✅ EXISTS - NO CHANGES)
├── UpcomingEventsByPrincipal.tsx    (🆕 NEW)
├── MyTasksThisWeek.tsx              (🆕 NEW)
├── RecentActivityFeed.tsx           (🆕 NEW)
└── PipelineSummary.tsx              (🆕 NEW)
```

### Updated Dashboard.tsx

```tsx
import { useRefresh } from "ra-core";
import { useEffect } from "react";
import { PrincipalDashboardTable } from "./PrincipalDashboardTable";
import { UpcomingEventsByPrincipal } from "./UpcomingEventsByPrincipal";
import { MyTasksThisWeek } from "./MyTasksThisWeek";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { PipelineSummary } from "./PipelineSummary";

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Principal-Centric Dashboard with Supporting Widgets
 *
 * Layout: Grid with 70% main content (left) + 30% sidebar (right)
 * Responsive: Stacks to single column on iPad portrait and mobile
 *
 * Widgets (5 total - ✅ COMPLETE):
 * 1. Upcoming Events by Principal - This week's scheduled activities ✅
 * 2. Principal Table - Main priority-sorted relationship view ✅
 * 3. My Tasks This Week - Task management with urgency grouping ✅
 * 4. Recent Activity Feed - Last 7 activities for context ✅
 * 5. Pipeline Summary - High-level pipeline health metrics ✅
 *
 * PRD: docs/prd/14-dashboard.md
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md
 */
export const Dashboard = () => {
  const refresh = useRefresh();

  // Auto-refresh all widgets every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refresh]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
      {/* Left Column - Main Focus */}
      <div className="space-y-6">
        <UpcomingEventsByPrincipal />
        <PrincipalDashboardTable />
      </div>

      {/* Right Sidebar - Supporting Context */}
      <div className="space-y-6">
        <MyTasksThisWeek />
        <RecentActivityFeed />
        <PipelineSummary />
      </div>
    </div>
  );
};

export default Dashboard;
```

### Data Fetching Strategy

**React Admin Hooks Used:**
- `useGetList` - Fetch lists of resources (tasks, activities, opportunities)
- `useRefresh` - Manual refresh trigger for all widgets
- `useGetIdentity` - Get current user context for filtering
- `useUpdate` - Mark tasks complete inline (checkbox)

**Query Optimization:**
- Each widget fetches independently (parallel requests)
- Use React Admin's built-in caching
- Auto-refresh interval: 5 minutes for all widgets
- Pagination limits: 7 for activity feed, none for others (small datasets)

### Error Handling

**Strategy: Fail Gracefully**
```tsx
export const MyTasksThisWeek = () => {
  const { data: tasks, error, isPending } = useGetList('tasks', {...});

  if (isPending) {
    return <WidgetSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-destructive">
            Unable to load tasks. Please refresh.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <TaskContent tasks={tasks} />;
};
```

**Per Engineering Constitution:**
- No retry logic (fail fast)
- Show error message in widget
- Other widgets continue to work (isolated failures)
- User can refresh manually

### Styling

**Use Semantic Tailwind Utilities:**
```tsx
// Card background
className="bg-card border-border"

// Text colors
className="text-foreground text-muted-foreground"

// Status colors
className="text-destructive text-warning text-success"

// Spacing
className="space-y-6 gap-6"
```

**Touch Targets:**
- Minimum 44x44px for all interactive elements (Apple HIG)
- Task checkboxes: 24px (within larger 44px touch area)
- Links and buttons: Adequate padding for touch

---

## Testing Strategy

### Unit Tests

**Test each widget component:**
```typescript
// src/atomic-crm/dashboard/MyTasksThisWeek.test.tsx
describe('MyTasksThisWeek', () => {
  it('groups tasks by urgency (overdue, today, week)', () => {
    const tasks = [
      { id: 1, due_date: '2025-11-05', title: 'Overdue' },
      { id: 2, due_date: '2025-11-07', title: 'Today' },
      { id: 3, due_date: '2025-11-10', title: 'This week' },
    ];

    const grouped = groupTasksByUrgency(tasks);

    expect(grouped.overdue).toHaveLength(1);
    expect(grouped.today).toHaveLength(1);
    expect(grouped.thisWeek).toHaveLength(1);
  });

  it('shows empty state when no tasks', () => {
    render(<MyTasksThisWeek />, { wrapper: TestWrapper });
    expect(screen.getByText('No tasks due this week 🎉')).toBeInTheDocument();
  });
});
```

### E2E Tests

**Extend existing dashboard-layout.spec.ts:**
```typescript
// tests/e2e/dashboard-layout.spec.ts

test.describe('Dashboard Widgets', () => {
  test('shows all 5 widgets on desktop', async ({ page }) => {
    await page.goto('/');

    // Left column
    await expect(page.getByText('Upcoming by Principal')).toBeVisible();
    await expect(page.getByText('My Principals')).toBeVisible();

    // Right sidebar
    await expect(page.getByText('My Tasks This Week')).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Pipeline Summary')).toBeVisible();
  });

  test('stacks to single column on iPad portrait', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // All widgets should be full width (stacked)
    const upcomingEvents = page.locator('[data-widget="upcoming-events"]');
    const boundingBox = await upcomingEvents.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(700); // Nearly full width
  });

  test('task checkbox marks task complete', async ({ page }) => {
    await page.goto('/');
    const firstTask = page.locator('.task-item').first();
    const checkbox = firstTask.locator('input[type="checkbox"]');

    await checkbox.check();

    // Task should be removed from list (re-query)
    await page.waitForTimeout(500);
    await expect(firstTask).not.toBeVisible();
  });
});
```

### Manual QA Checklist

- [ ] Desktop (1280px): Grid layout, all widgets visible
- [ ] iPad Landscape (1024px): Grid layout, 70/30 split
- [ ] iPad Portrait (768px): Single column stack
- [ ] Mobile (375px): Single column stack
- [ ] Auto-refresh works (wait 5+ minutes)
- [ ] Manual refresh button updates all widgets
- [ ] Empty states show for widgets with no data
- [ ] Error states show gracefully (disconnect DB)
- [ ] Task checkbox marks complete
- [ ] Links navigate correctly
- [ ] Principal table still works as before

---

## Success Metrics

### Primary Goal

**Account managers can answer "What's my ONE thing this week?" in < 10 seconds by:**
1. Scanning principal table for 🔴 urgent principals
2. Checking "Upcoming Events" for this week's commitments
3. Checking "My Tasks" for overdue items

### Measurements

**Adoption:**
- Dashboard views per day per user: Target 3-5 (morning, midday, EOD)
- Time spent on dashboard: Target 30-60 seconds (quick scan, not deep dive)

**Engagement:**
- Task completion rate from dashboard: >40%
- Click-through on "View All" links: >20%
- Filter usage on principal table: Stable or increased

**Performance:**
- Page load time: <2 seconds
- Auto-refresh impact: No visible lag
- Widget data fetch: <500ms per widget

---

## Migration Notes

### Orphaned Components

The following 16 widget components are currently orphaned and can be archived/deleted after this implementation:

```
src/atomic-crm/dashboard/
├── DashboardActivityLog.tsx       (replaced by RecentActivityFeed)
├── DashboardWidget.tsx            (unused wrapper)
├── HotContacts.tsx                (functionality absorbed)
├── LatestNotes.tsx                (if exists)
├── MetricsCardGrid.tsx            (removed)
├── MiniPipeline.tsx               (replaced by PipelineSummary)
├── MyOpenOpportunities.tsx        (absorbed into principal table)
├── OpportunitiesByPrincipal.tsx   (absorbed into principal table)
├── OverdueTasks.tsx               (absorbed into MyTasksThisWeek)
├── PipelineByStage.tsx            (replaced by PipelineSummary)
├── QuickAdd.tsx                   (removed)
├── RecentActivities.tsx           (replaced by RecentActivityFeed)
├── TasksList.tsx                  (replaced by MyTasksThisWeek)
├── TasksListEmpty.tsx             (replaced)
├── TasksListFilter.tsx            (replaced)
└── ThisWeeksActivities.tsx        (replaced by UpcomingEventsByPrincipal)
```

**Cleanup Action:**
- Move to `src/atomic-crm/dashboard/_archived/` after new widgets deployed
- Delete after 30 days if no issues reported

### Database Changes

**No database changes required** - All new widgets use existing tables:
- `tasks` table (already exists)
- `activities` table (already exists)
- `opportunities` table (already exists)
- `dashboard_principal_summary` view (already exists)

---

## Implementation Checklist

### Phase 1: Core Widgets (2-3 days)
- [ ] Create `UpcomingEventsByPrincipal.tsx`
- [ ] Create `MyTasksThisWeek.tsx`
- [ ] Create `RecentActivityFeed.tsx`
- [ ] Create `PipelineSummary.tsx`
- [ ] Update `Dashboard.tsx` with grid layout

### Phase 2: Testing (1 day)
- [ ] Write unit tests for each widget
- [ ] Update E2E tests for new layout
- [ ] Manual QA on iPad (landscape + portrait)
- [ ] Manual QA on mobile
- [ ] Test error states and empty states

### Phase 3: Polish (1 day)
- [ ] Add loading skeletons
- [ ] Verify semantic color usage
- [ ] Verify touch target sizes (44px min)
- [ ] Test auto-refresh behavior
- [ ] Accessibility audit (keyboard nav, screen reader)

### Phase 4: Deployment & Cleanup (1 day)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Archive orphaned components
- [ ] Update documentation

**Total Estimate:** 5-6 days

---

## Future Enhancements (Post-MVP)

**Not included in initial implementation:**

1. **Customizable widget visibility**
   - User preferences to show/hide widgets
   - Drag-and-drop widget reordering

2. **Advanced filters**
   - Filter tasks by principal
   - Filter activities by type

3. **Notifications**
   - Browser notifications for overdue tasks
   - Email digest of weekly priorities

4. **Performance optimizations**
   - Widget lazy loading
   - Incremental refresh (only changed data)

5. **Analytics**
   - Track which widgets users interact with most
   - A/B test widget arrangements

---

**Design Status:** ✅ Complete - Ready for Implementation
**Next Steps:** Create implementation plan with bite-sized tasks using `/superpowers:write-plan`
