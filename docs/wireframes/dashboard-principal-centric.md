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
- ⚠️ Table displays no data (database view needs data seeding)
- ⚠️ 10/24 E2E tests failing (table element not found - data issue)

---

## Evolution History - What Was Removed

The principal-centric dashboard represents a **complete redesign** from the previous widget-based layouts. Below is the evolution history showing what was removed at each phase.

### **Phase 1: Original Dashboard** (Pre-October 2025)

**Layout:** 3-column grid (`md:grid-cols-12`)
- **Column 1 (3/12):** HotContacts widget
- **Column 2 (6/12):** OpportunitiesChart + DashboardActivityLog
- **Column 3 (3/12):** TasksList widget

### **Phase 2: Action-First Redesign** (Commit `84a45ca` - Oct 11, 2025)

**Layout:** 2-column responsive grid (`md:grid-cols-2 lg:grid-cols-3`)
- **Left column (2/3):** TasksList + DashboardActivityLog (action zone)
- **Right column (1/3):** HotContacts + MiniPipeline + OpportunitiesChart (context zone)
- **Full-width row:** QuickAdd (quick action buttons)

**Components Added:**
- ✅ MiniPipeline.tsx - Grouped opportunity summary (Active/Won/Lost)
- ✅ QuickAdd.tsx - Quick create buttons for Contact/Opportunity
- ✅ MetricsCardGrid.tsx - iPad-optimized metrics cards

### **Phase 3: Financial Removal** (Commit `e480964` - Nov 2, 2025)

**Components Deleted:**
- ❌ **OpportunitiesChart.tsx** (234 lines) - Monthly revenue chart showing opportunity amounts
- ❌ **OpportunitiesPipeline.tsx** (94 lines) - Pipeline value visualization

**Reason:** Complete financial tracking removal per design doc `docs/plans/2025-11-02-complete-financial-tracking-removal-design.md`

### **Phase 4: Principal-Centric Redesign** (Current - Nov 6, 2025)

**Layout:** Single-table focused view
- **Only Component:** PrincipalDashboardTable (6-column principal table)
- **Header:** "My Principals" heading + Refresh button
- **Auto-refresh:** Every 5 minutes (configurable)

**Components Removed from Dashboard.tsx:**

All previous widgets were removed and replaced with the single principal table:

1. ❌ **DashboardActivityLog.tsx** - Recent activity feed widget
2. ❌ **HotContacts.tsx** - Recently active contacts widget
3. ❌ **TasksList.tsx** - Task management widget with filters
4. ❌ **MiniPipeline.tsx** - Opportunity pipeline summary (Active/Won/Lost)
5. ❌ **QuickAdd.tsx** - Quick action buttons for creating records
6. ❌ **MetricsCardGrid.tsx** - Top-level metrics cards (Contacts, Organizations, Activities)

### **Orphaned Components (Still in Codebase)**

These components exist in `src/atomic-crm/dashboard/` but are **NOT imported or used anywhere**:

```
DashboardActivityLog.tsx       # Activity feed widget
DashboardWidget.tsx             # Base widget wrapper component
HotContacts.tsx                 # Recently active contacts widget
LatestNotes.tsx                 # Recent notes feed (if exists)
MetricsCardGrid.tsx             # Top-level metrics display
MiniPipeline.tsx                # Pipeline summary widget
MyOpenOpportunities.tsx         # User's open opportunities widget
OpportunitiesByPrincipal.tsx    # Principal-grouped opportunities widget
OverdueTasks.tsx                # Overdue tasks widget
PipelineByStage.tsx             # Stage-based pipeline widget
QuickAdd.tsx                    # Quick create action buttons
RecentActivities.tsx            # Recent activity list widget
TasksList.tsx                   # Task list widget
TasksListEmpty.tsx              # Empty state for tasks widget
TasksListFilter.tsx             # Task filtering UI component
ThisWeeksActivities.tsx         # Weekly activity summary widget
```

**Status:** These files are **candidates for deletion** in a future cleanup, or could be repurposed for:
- Customizable dashboard widgets (future feature)
- Alternative dashboard views for different roles
- Standalone pages for specific workflows

### **Key Design Rationale**

**Why remove all widgets?**

1. **Focus over flexibility** - Account Managers need ONE clear view of their principals, not configurable widgets
2. **Principal-first workflow** - The core job is managing 3-5 principal relationships, not tracking 100+ metrics
3. **Reduce cognitive load** - Single table format eliminates decision paralysis from multiple dashboard sections
4. **Consistency** - Fixed layout ensures all users see critical information the same way
5. **iPad optimization** - Table format works better on tablets than widget grids

**What was lost?**

- Quick task management (TasksList) - moved to dedicated Tasks page
- Activity feed (DashboardActivityLog) - moved to Activity module
- Quick create buttons (QuickAdd) - replaced with navigation to create forms
- Metrics overview (MetricsCardGrid) - deprioritized in favor of action-oriented view

**What was gained?**

- Immediate visibility into all principals (no scrolling through widgets)
- Priority-sorted table surfaces most urgent principals first
- Stuck opportunity warnings prevent deals from going stale
- Consistent UX across all account managers

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
