---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 9 (Dashboard) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Feature Module:** Dashboard
**Category:** Features

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md) - Principal-focused queries
- 🎨 [Design System](./15-design-tokens.md) - Table layouts and priority indicators
- 🔗 [Tasks Module](./08-tasks-module.md) - Task integration for action items
- 🔗 [Opportunities Module](./06-opportunities-module.md) - Principal tracking
- 🔗 [Activity Tracking](./10-activity-tracking.md) - Recent activity logging
- ⚙️ [Technical Stack](./18-tech-stack.md) - Dashboard refresh strategy
---

## 📊 Implementation Status

**Last Updated:** November 5, 2025

| Metric | Status |
|--------|--------|
| **Completion** | 🚧 **50%** |
| **Confidence** | 🟡 **MEDIUM** - Requires principal-centric table redesign |
| **Files** | Legacy widget implementation exists, needs replacement |
| **Design** | ⚠️ Requires complete rewrite to principal-centric table view |

**Completed Requirements:**
- ✅ Dashboard infrastructure and routing
- ✅ OpportunitiesByPrincipal widget (reusable logic)
- ✅ Data queries for principal-based views

**Missing Requirements (50%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Replace widget layout with principal table | ❌ Missing | 🟢 HIGH | 3 days |
| Add "stuck" indicator logic (30+ days) | ❌ Missing | 🟢 HIGH | 1 day |
| Add priority warning indicators | ❌ Missing | 🟢 HIGH | 1 day |
| Implement current user filtering | ❌ Missing | 🟢 HIGH | 1 day |
| Manual refresh functionality | ✅ Complete | 🟢 HIGH | - |

**Total Estimate:** 6 days for principal-centric redesign

**Blockers:** None - Existing widget logic can be repurposed

---

# 3.12 Dashboard - Principal-Centric Table View

## Dashboard Philosophy

**Core Question:** "What is the ONE thing I have to do this week that will increase the likelihood of my distributor stocking the principal, adding a new item, or growing volume on a stocked item?"

**Design Principles:**
- **Principal-first:** Account Managers manage 3-5 principals, not hundreds of contacts
- **Table format:** See all principals at once (compact, scannable)
- **Action-oriented:** Focus on what needs attention TODAY
- **Filtered by default:** Show only current user's assigned work
- **No customization:** Fixed layout for all users (consistency over personalization)

---

## Dashboard Layout (Table View)

**Top-Level Structure:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Dashboard                       [Refresh]   │
├─────────────────────────────────────────────────────────────────────┤
│ My Principals - What needs attention?                               │
├──────────────┬─────────┬──────────────┬─────────────┬──────────────┤
│ Principal    │ Status  │ Next Action  │ Stuck?      │ Last Activity│
├──────────────┼─────────┼──────────────┼─────────────┼──────────────┤
│ Ocean Hugger │ 🟢 Good │ Follow up    │             │ 2 days ago   │
│              │ 3 opps  │ with Nobu    │             │ (Call)       │
├──────────────┼─────────┼──────────────┼─────────────┼──────────────┤
│ Fishpeople   │ 🟡 Warn │ Price quote  │ ⚠️ 35 days  │ 5 days ago   │
│              │ 2 opps  │ for Ballyhoo │             │ (Email)      │
├──────────────┼─────────┼──────────────┼─────────────┼──────────────┤
│ La Tourangelle│🔴 Urgent│ Demo at Roka │ ⚠️ 45 days │ 12 days ago  │
│              │ 1 opp   │              │             │ (Meeting)    │
└──────────────┴─────────┴──────────────┴─────────────┴──────────────┘
```

---

## Table Columns (6 columns)

### 1. Principal (Primary Column)
**Data:**
- Principal name (clickable link to filtered opportunities view)
- Opportunity count for this principal (e.g., "3 opps")

**Behavior:**
- Click principal name → navigates to Opportunities filtered by that principal
- Shows principals for opportunities where current user is primary account manager

### 2. Status Indicator
**Visual:**
- 🟢 Green circle = All good (at least 1 activity in last 7 days)
- 🟡 Yellow circle = Warning (no activity in 7-14 days)
- 🔴 Red circle = Urgent (no activity in 14+ days)

**Logic:**
```typescript
const getStatus = (lastActivityDate: Date) => {
  const daysSince = dateDiff(today, lastActivityDate);
  if (daysSince <= 7) return "Good";
  if (daysSince <= 14) return "Warning";
  return "Urgent";
};
```

### 3. Next Action
**Data:**
- Description from highest-priority incomplete task for this principal
- If no tasks: "No action items"
- Truncated to 30 characters

**Behavior:**
- Click → opens task detail modal
- Shows task title only (not full description)

### 4. Stuck? (Priority Warning)
**Data:**
- Shows "⚠️ X days" if ANY opportunity for this principal has been in same stage for 30+ days
- Blank if all opportunities moving normally

**Logic:**
```typescript
const isStuck = (opportunity) => {
  const daysInStage = dateDiff(today, opportunity.stage_changed_at);
  return daysInStage >= 30;
};
```

**Why 30 days?** Average sales cycle is 2-4 weeks. 30+ days = something's wrong.

### 5. Last Activity
**Data:**
- How long ago (relative time: "2 days ago", "3 weeks ago")
- Activity type in parentheses: (Call), (Email), (Meeting), (Note)

**Behavior:**
- Click → opens activity detail or full activity feed for this principal

---

## Dashboard Behavior

**Default Filtering:**
- ✅ Show only opportunities where `primary_account_manager_id = current_user.sales_id`
- ✅ Show only active opportunities (status != "Closed Won" and status != "Closed Lost")
- ✅ Group by principal automatically

**Sorting:**
- Default: By Status (🔴 Urgent → 🟡 Warning → 🟢 Good)
- Secondary: By "Stuck" days (longest stuck first)
- Tertiary: By Principal name (A-Z)

**Refresh:**
- Manual refresh button (top right)
- Auto-refresh every 5 minutes
- Loading state: Skeleton rows while fetching

**Empty State:**
- If user has no assigned opportunities:
  ```
  No principals assigned to you yet.
  Ask your manager to assign opportunities.
  ```

---

## What We're NOT Building (Dashboard)

**Excluded from MVP:**
- ❌ Customizable layouts (fixed table for everyone)
- ❌ Drag-and-drop widgets
- ❌ Role-based dashboards
- ❌ Card-based grid views
- ❌ Charts or visualizations (table only)
- ❌ Dashboard preferences
- ❌ Multiple dashboard pages
- ❌ Export dashboard to PDF/image

**Rationale:** Consistency over customization. Fixed layout ensures everyone sees critical information the same way.

---

## Technical Implementation Notes

**Data Sources:**
- `opportunities` table filtered by `primary_account_manager_id`
- `activities` table for last activity timestamp
- `tasks` table for next action items
- Join with `organizations` to get principal names

**Query Performance:**
- Use database view: `dashboard_principal_summary`
- Index on: `primary_account_manager_id`, `principal_id`, `status`
- Pre-calculate "days stuck" in view for faster sorting

**Responsive Design:**
- iPad-optimized (primary device)
- Mobile: Stack columns vertically (Principal → Status → Action)
- Desktop: Full 6-column table

---

## Success Metrics

**Primary Goal:** Account Manager can answer "What's my ONE thing for each principal?" in 2 seconds.

**Measurements:**
- Time to identify most urgent principal: < 2 seconds (visual scan)
- Click-through rate on "Next Action": > 60% (action-oriented)
- Daily dashboard views: 3-5 per user (morning, midday, EOD check-ins)

---

## Related Features

- **Tasks Module:** Next Action column links to full task management
- **Opportunities by Principal Report:** Detailed breakdown beyond dashboard summary
- **Activity Tracking:** Feeds the "Last Activity" column data

---

**Future Enhancements (Post-MVP):**
- Pipeline value totals per principal
- Win rate percentage indicators
- Activity goal tracking (e.g., "3 calls/week per principal")
- Historical trend sparklines
