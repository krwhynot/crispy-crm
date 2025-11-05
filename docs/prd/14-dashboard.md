---
**Part of:** Atomic CRM Product Requirements Document
**Feature Module:** Dashboard
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Dashboard data aggregation views
- 🎨 [Design System](./15-design-tokens.md) - Widget layouts and cards
- 🔗 [Tasks Widget](./08-tasks-widget.md) - Tasks component integration
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Principal tracking widget ⭐
- 🔗 [Activity Tracking](./10-activity-tracking.md) - Recent activities widget
- ⚙️ [Technical Stack](./18-tech-stack.md) - Dashboard refresh strategy
---

# 3.12 Dashboard

## Dashboard Design (Fixed Layout)

**Dashboard Approach:**
- **Fixed dashboard for all users** (consistency over customization)
- Same layout and widgets for everyone
- No role-based dashboards
- No drag-and-drop customization
- No user preferences for dashboard layout

**Dashboard Widgets (Fixed Grid):**

```
┌─────────────────────────────────────────────────────────────┐
│                         Dashboard                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │ My Open          │ │ Overdue Tasks   │ │ This Week's     ││
│ │ Opportunities    │ │                 │ │ Activities      ││
│ │ Count: 23        │ │ Count: 5        │ │ Count: 47       ││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Pipeline by Stage                                         ││
│ │ [Horizontal bar chart showing opportunities per stage]    ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Recent Activities (Last 10)                              ││
│ │ • John called Nobu Miami - 2 hours ago                   ││
│ │ • Jane sent email to Ballyhoo - 4 hours ago              ││
│ │ • Mike completed demo at Roka - Yesterday                ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Opportunities by Principal ⭐                             ││
│ │ Ocean Hugger: 12 active                                   ││
│ │ Fishpeople: 8 active                                      ││
│ │ Other: 3 active                                           ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Widget Details:**

1. **My Open Opportunities:**
   - Count of opportunities where user is owner
   - Status = active
   - Click to view filtered list

2. **Overdue Tasks:**
   - Count of tasks where next_action_date < today
   - Red text if count > 0
   - Click to view task list

3. **This Week's Activities:**
   - Count of activities logged this week
   - Monday to Sunday
   - Click to view activity report

4. **Pipeline by Stage:**
   - Horizontal bar chart
   - One bar per stage
   - Shows count in each stage
   - Click bar to filter opportunities

5. **Recent Activities:**
   - Last 10 activities across all users
   - Shows: User, Type, Description, Time
   - Click to view full activity feed

6. **Opportunities by Principal:**
   - List of principals with active opportunity count
   - ⭐ marked as most important widget
   - Click principal to filter opportunities

**Dashboard Behavior:**
- Auto-refresh every 5 minutes
- Manual refresh button (circular arrow icon)
- Loading states for each widget independently
- Error states show "Unable to load" with retry button
