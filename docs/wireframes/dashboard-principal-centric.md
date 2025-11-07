# Dashboard Wireframe - Principal-Centric View

## Document References

**Primary PRD:** [docs/prd/14-dashboard.md](../prd/14-dashboard.md)

**Related PRD Documents:**
- [02-data-architecture.md](../prd/02-data-architecture.md) - Database views and CTE structure
- [04-organizations-module.md](../prd/04-organizations-module.md) - Principal organization management
- [06-opportunities-module.md](../prd/06-opportunities-module.md) - Opportunity tracking and stages
- [16-design-components.md](../prd/16-design-components.md) - UI component patterns (tables, status indicators)
- [17-design-layout.md](../prd/17-design-layout.md) - Responsive layout patterns (desktop/iPad/mobile)

**Design Doc:** [docs/plans/2025-11-05-principal-centric-crm-design.md](../plans/2025-11-05-principal-centric-crm-design.md)

**Implementation:**
- `src/atomic-crm/dashboard/Dashboard.tsx` - Main container
- `src/atomic-crm/dashboard/PrincipalDashboardTable.tsx` - Table component

---

## Desktop View (1280px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MFB Logo          Dashboard  Contacts  Organizations  Opportunities  🌙 🔔 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  My Principals                                            [🔄 Refresh]      │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Principal          │ # Opps │ Status  │ Last Activity  │ Stuck │ Next │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ Acme Foods Inc.    │   12   │ 🔴 Urgent│ 18 days ago   │  3    │ ...  │ │
│  │ Brand Co.          │    8   │ 🟡 Warning│ 9 days ago   │  1    │ ...  │ │
│  │ Global Snacks LLC  │   15   │ 🟢 Good  │ 3 days ago    │  -    │ ...  │ │
│  │ Premier Beverages  │    6   │ 🟢 Good  │ Yesterday     │  -    │ ...  │ │
│  │ Quality Produce    │   10   │ 🟡 Warning│ 11 days ago  │  2    │ ...  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## iPad Portrait (768px)

```
┌──────────────────────────────────────────────────┐
│ MFB    Dashboard  Contacts  Orgs  Opps  🌙 🔔   │
├──────────────────────────────────────────────────┤
│                                                  │
│  My Principals                  [🔄 Refresh]     │
│  ══════════════════════════════════════════════  │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Principal        │ Opps │ Status │ Stuck  │ │
│  ├────────────────────────────────────────────┤ │
│  │ Acme Foods       │  12  │ 🔴     │   3    │ │
│  │ Brand Co.        │   8  │ 🟡     │   1    │ │
│  │ Global Snacks    │  15  │ 🟢     │   -    │ │
│  │ Premier Bevs     │   6  │ 🟢     │   -    │ │
│  │ Quality Produce  │  10  │ 🟡     │   2    │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ⚠️ Less columns shown on tablet                 │
│  (Last Activity & Next Action columns hidden)   │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Mobile Portrait (375px)

```
┌────────────────────────────────┐
│ ☰  Dashboard         🌙 🔔 ⚙  │
├────────────────────────────────┤
│                                │
│  My Principals                 │
│               [🔄]             │
│  ═══════════════════════════   │
│                                │
│  ┌──────────────────────────┐ │
│  │ Acme Foods Inc.          │ │
│  │ 12 opps · 🔴 Urgent      │ │
│  │ 3 stuck · 18d ago        │ │
│  ├──────────────────────────┤ │
│  │ Brand Co.                │ │
│  │ 8 opps · 🟡 Warning      │ │
│  │ 1 stuck · 9d ago         │ │
│  ├──────────────────────────┤ │
│  │ Global Snacks LLC        │ │
│  │ 15 opps · 🟢 Good        │ │
│  │ 3d ago                   │ │
│  └──────────────────────────┘ │
│                                │
│  📱 Card-based layout          │
│  (stacked vertical)            │
│                                │
└────────────────────────────────┘
```

---

## Column Definitions

### Full Desktop (All 6 Columns)

| Column | Width | Description | Sortable |
|--------|-------|-------------|----------|
| **Principal** | 25% | Principal organization name (brand/manufacturer) | ✅ Yes |
| **# Opps** | 10% | Total opportunity count for this principal | ✅ Yes |
| **Status** | 15% | Color-coded health indicator (Good/Warning/Urgent) | ✅ Yes |
| **Last Activity** | 20% | Days since last activity on any opportunity | ✅ Yes |
| **Stuck** | 15% | Count of opportunities stuck 30+ days in same stage | ✅ Yes |
| **Next Action** | 15% | Upcoming action or task from most urgent opportunity | ❌ No |

### Tablet (4 Columns)

Columns shown: **Principal**, **# Opps**, **Status**, **Stuck**

Columns hidden: Last Activity, Next Action

### Mobile (Card View)

No column structure - each principal shows as a card with:
- Principal name (bold, large)
- Opp count + Status indicator (inline)
- Stuck count + Last activity (secondary line)

---

## Status Indicator Logic

```
🟢 Good (Green)
├─ Last activity ≤ 7 days ago
└─ Most opportunities progressing

🟡 Warning (Amber)
├─ Last activity 7-14 days ago
└─ Some stuck opportunities

🔴 Urgent (Red)
├─ Last activity 14+ days ago
└─ Multiple stuck opportunities
```

---

## "Stuck" Indicator Logic

An opportunity is **stuck** when:
- It has remained in the same `stage` for **30+ days**
- Calculated via `MAX(days_in_stage)` from database view

Display rules:
- Show count if > 0: `"3 stuck"`, `"1 stuck"`
- Show dash if = 0: `"-"`
- Color: Always red when count > 0

---

## Interactions

### Desktop
- **Click Principal name**: Navigate to opportunities filtered by principal
- **Click # Opps**: Same as clicking principal name
- **Refresh button**: Manual data refresh (also auto-refreshes every 5 minutes)
- **Sort any column**: Click column header to sort ascending/descending

### Tablet
- Same as desktop, with fewer columns visible
- Touch-friendly targets (44x44px minimum)

### Mobile
- **Tap card**: Navigate to principal opportunities
- **Pull to refresh**: Native gesture for data refresh
- **Swipe**: No swipe gestures (potential future enhancement)

---

## Data Source

**Database View:** `dashboard_principal_summary`

**Query Logic:**
```sql
-- 3-level CTE structure:
-- 1. Base opportunities with days calculation
-- 2. Aggregation by principal
-- 3. Status indicator calculation

SELECT
  principal_organization_id,
  principal_name,
  account_manager_id,
  opportunity_count,
  last_activity_date,
  days_since_last_activity,
  max_days_in_stage,
  COUNT(*) FILTER (WHERE days_in_stage >= 30) as stuck_count,
  CASE
    WHEN days_since_last_activity <= 7 THEN 'good'
    WHEN days_since_last_activity <= 14 THEN 'warning'
    ELSE 'urgent'
  END as status_indicator
FROM opportunities_with_activity
GROUP BY principal_organization_id
ORDER BY priority_score DESC
```

**Filtering:**
- Automatically filtered by `account_manager_id = current_user.sales_id`
- Only shows principals where user is the account manager

---

## Auto-Refresh Behavior

```javascript
// Auto-refresh every 5 minutes
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

useEffect(() => {
  const intervalId = setInterval(() => {
    refresh();
  }, AUTO_REFRESH_INTERVAL);

  return () => clearInterval(intervalId);
}, [refresh]);
```

**Manual refresh:**
- Shows spinning icon for 500ms minimum
- Provides user feedback that refresh occurred

---

## Empty State

When no principals are assigned to current user:

```
┌─────────────────────────────────────────┐
│                                         │
│  My Principals           [🔄 Refresh]   │
│  ══════════════════════════════════════ │
│                                         │
│           📋                            │
│     No Principals Assigned              │
│                                         │
│  You don't have any principal           │
│  organizations assigned yet.            │
│                                         │
│  Contact your manager to get            │
│  assigned to principals.                │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Scenarios

### E2E Tests (tests/e2e/dashboard-layout.spec.ts)

✅ **Core Elements:**
- "My Principals" heading visible
- Refresh button present and functional
- Auto-refresh working (5 min interval)

✅ **Table Structure:**
- All 6 column headers visible (desktop)
- Table renders with data rows
- Proper styling and positioning

✅ **Responsive Behavior:**
- Desktop (1280px): No horizontal scroll, all columns visible
- iPad (768px): 4 columns visible, touch-friendly targets
- Mobile (375px): Card layout, vertical scroll

✅ **Interactions:**
- Table rows clickable
- Refresh button updates data
- Sort columns working

---

## Implementation Status

**Component Files:**
- ✅ `src/atomic-crm/dashboard/Dashboard.tsx` - Main container
- ✅ `src/atomic-crm/dashboard/PrincipalDashboardTable.tsx` - Table component
- ✅ `src/atomic-crm/providers/supabase/resources.ts` - Resource registration
- ✅ `src/atomic-crm/providers/supabase/filterRegistry.ts` - Filter fields
- ✅ `tests/e2e/dashboard-layout.spec.ts` - E2E tests

**Configuration:**
- ✅ React Admin resource registered: `dashboard_principal_summary`
- ✅ Playwright tests configured (port 5173)
- ✅ Dependencies installed: `react-admin@5.10.0`

**Known Issues:**
- ⚠️ Responsive column hiding not implemented (all 6 columns shown on tablet/mobile)
- ⚠️ Mobile card view not implemented (uses table layout on all screen sizes)
- ⚠️ Custom empty state not implemented (uses React Admin default)
- ⚠️ Activity and task data incomplete (last_activity_date and next_action showing NULL in view)

---

## What Was Removed (Past 48 Hours)

**Commit:** `9ac6a5a` - Nov 6, 2025 at 13:27:58 CST
**Change:** Principal-centric redesign - replaced widget-based dashboard with single table view

### **12 Widget Components Removed from Dashboard.tsx:**

All previous widgets were removed and replaced with `PrincipalDashboardTable`:

1. ❌ **DashboardActivityLog** - Recent activity feed widget
2. ❌ **HotContacts** - Recently active contacts widget
3. ❌ **TasksList** - Task management widget with filters
4. ❌ **MiniPipeline** - Opportunity pipeline summary (Active/Won/Lost)
5. ❌ **QuickAdd** - Quick action buttons for creating records
6. ❌ **MetricsCardGrid** - Top-level metrics cards (Contacts, Orgs, Activities)
7. ❌ **MyOpenOpportunities** - User's open opportunities widget
8. ❌ **OverdueTasks** - Overdue tasks widget
9. ❌ **ThisWeeksActivities** - Weekly activity summary widget
10. ❌ **OpportunitiesByPrincipal** - Principal-grouped opportunities widget
11. ❌ **PipelineByStage** - Stage-based pipeline widget
12. ❌ **RecentActivities** - Recent activity list widget

### **What Replaced Them:**

✅ **PrincipalDashboardTable** - Single 6-column table showing all principals with:
- Principal name (clickable)
- Opportunity count
- Status indicator (🟢 Good / 🟡 Warning / 🔴 Urgent)
- Last activity date + type
- Stuck indicator (⚠️ 30+ days in stage)
- Next action (upcoming task)

### **Files Now Orphaned (not imported anywhere):**

These component files still exist in `src/atomic-crm/dashboard/` but are **NOT used**:

```
DashboardActivityLog.tsx       HotContacts.tsx              OverdueTasks.tsx
DashboardWidget.tsx             LatestNotes.tsx              PipelineByStage.tsx
MetricsCardGrid.tsx             MyOpenOpportunities.tsx      QuickAdd.tsx
MiniPipeline.tsx                OpportunitiesByPrincipal.tsx RecentActivities.tsx
TasksList.tsx                   TasksListEmpty.tsx           TasksListFilter.tsx
ThisWeeksActivities.tsx
```

**Cleanup Action:** These 16 orphaned components can be safely deleted or archived.

---

## Next Steps

1. **Seed Test Data**: Create opportunities with assigned account managers
2. **Verify Database View**: Confirm `dashboard_principal_summary` returns rows
3. **Run E2E Tests**: Validate all 24 tests pass with data present
4. **Manual QA**: Test on actual devices (desktop/iPad/mobile)
5. **Production Readiness**: Load test with 100+ principals per user
6. **Cleanup Decision**: Archive or delete orphaned widget components

---

**Last Updated:** 2025-11-07
**Implementation Phase:** Code Complete, Data Seeding Required
**Evolution Phase:** Principal-Centric v2.0 (All widgets removed)
