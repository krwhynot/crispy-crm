# Reports Page Redesign Wireframes

## Design Principles Applied

### 1. Summary First, Filters Second, Details on Demand
- KPI cards immediately visible at top of page
- Filters in header, non-intrusive
- Applied filters shown as dismissible chips below tabs
- Charts provide visual summary before detailed data tables

### 2. 5-9 Modules Maximum Per View
- Overview Tab: 4 KPI cards + 4 charts = 8 modules (within range)
- Each tab focused on specific reporting domain
- No module overload or cognitive fatigue

### 3. Principal-First Visibility
- "Top Principals" chart prominently displayed
- Opportunities tab grouped by Principal
- Weekly Activity tab shows Principal hierarchy
- Filters support single-principal drill-down

### 4. <2 Second Answer Time for Key Questions
- "What's my one thing per principal?" → Top Principals chart + Stale Deals KPI
- "Who needs follow-up?" → Stale Leads + Stale Deals KPIs
- "What did I do this week?" → Activities This Week KPI + Activity Trend chart
- Applied filter chips provide instant feedback on active filters

## Overview Tab Layout

### Desktop (≥1280px)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Reports                                    [Date Range ▾] [Rep ▾]         │
├────────────────────────────────────────────────────────────────────────────┤
│  [Overview] [Opportunities] [Weekly Activity] [Campaign]                   │
├────────────────────────────────────────────────────────────────────────────┤
│  Applied Filters: [This Week ×] [All Reps ×]          [Reset All]         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Total Opps  │  │ Activities  │  │ Stale Leads │  │ Stale Deals │     │
│  │             │  │ This Week   │  │             │  │             │     │
│  │     42      │  │     18      │  │      7      │  │      3      │     │
│  │             │  │             │  │             │  │             │     │
│  │  +12% MoM   │  │  +5% WoW    │  │  >30 days   │  │  >14 days   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                            │
│  ┌───────────────────────────┐  ┌───────────────────────────┐            │
│  │ Pipeline by Stage         │  │ Activity Trend            │            │
│  │                           │  │                           │            │
│  │  [Horizontal Bar Chart]   │  │  [Line Chart]             │            │
│  │                           │  │                           │            │
│  │  New Lead: ████████ 15    │  │  Week-over-week activity  │            │
│  │  Outreach: ██████ 10      │  │  volume by type           │            │
│  │  Sample:   ████ 8         │  │                           │            │
│  │  Feedback: ██ 5           │  │                           │            │
│  │  Demo:     █ 3            │  │                           │            │
│  │  Won:      █ 1            │  │                           │            │
│  │                           │  │                           │            │
│  └───────────────────────────┘  └───────────────────────────┘            │
│                                                                            │
│  ┌───────────────────────────┐  ┌───────────────────────────┐            │
│  │ Top Principals            │  │ Rep Performance           │            │
│  │                           │  │                           │            │
│  │  [Vertical Bar Chart]     │  │  [Grouped Bar Chart]      │            │
│  │                           │  │                           │            │
│  │  Shows top 5 principals   │  │  Activities vs Opps       │            │
│  │  by opportunity count     │  │  per rep                  │            │
│  │                           │  │                           │            │
│  │                           │  │                           │            │
│  │                           │  │                           │            │
│  │                           │  │                           │            │
│  └───────────────────────────┘  └───────────────────────────┘            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### iPad (768px - 1279px)

```
┌──────────────────────────────────────────┐
│  Reports                  [≡] Filters    │
├──────────────────────────────────────────┤
│  [Overview] [Opps] [Weekly] [Campaign]   │
├──────────────────────────────────────────┤
│  Filters: [This Week ×]      [Reset All] │
├──────────────────────────────────────────┤
│                                          │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Total Opps  │  │ Activities  │       │
│  │             │  │ This Week   │       │
│  │     42      │  │     18      │       │
│  │             │  │             │       │
│  │  +12% MoM   │  │  +5% WoW    │       │
│  └─────────────┘  └─────────────┘       │
│                                          │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Stale Leads │  │ Stale Deals │       │
│  │             │  │             │       │
│  │      7      │  │      3      │       │
│  │             │  │             │       │
│  │  >30 days   │  │  >14 days   │       │
│  └─────────────┘  └─────────────┘       │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ Pipeline by Stage              │     │
│  │                                │     │
│  │  [Horizontal Bar Chart]        │     │
│  │                                │     │
│  │  New Lead: ████████ 15         │     │
│  │  Outreach: ██████ 10           │     │
│  │  Sample:   ████ 8              │     │
│  │  Feedback: ██ 5                │     │
│  │  Demo:     █ 3                 │     │
│  │  Won:      █ 1                 │     │
│  │                                │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ Activity Trend                 │     │
│  │                                │     │
│  │  [Line Chart]                  │     │
│  │                                │     │
│  │  Week-over-week activity       │     │
│  │  volume by type                │     │
│  │                                │     │
│  │                                │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ Top Principals                 │     │
│  │                                │     │
│  │  [Vertical Bar Chart]          │     │
│  │                                │     │
│  │  Shows top 5 principals        │     │
│  │  by opportunity count          │     │
│  │                                │     │
│  │                                │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ Rep Performance                │     │
│  │                                │     │
│  │  [Grouped Bar Chart]           │     │
│  │                                │     │
│  │  Activities vs Opps per rep    │     │
│  │                                │     │
│  │                                │     │
│  │                                │     │
│  └────────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

## Key Changes from Current

### 1. Applied Filter Chips Row
**Added:** Horizontal row below tab navigation showing active filters as dismissible chips (e.g., "This Week ×", "All Reps ×")

**Behavior:**
- Only visible when filters are active
- Each chip has × button to remove individual filter
- Chips use semantic colors (bg-muted, text-muted-foreground)
- Touch targets meet 44px minimum

### 2. Reset All Button
**Added:** "Reset All" button aligned right in filter chips row

**Behavior:**
- Only visible when filters are active
- Clears all applied filters with one click
- Uses secondary button styling
- Positioned for easy thumb access on iPad

### 3. KPI Cards (No Changes)
**Kept:** Same 4 KPI cards with existing design
- Total Opportunities
- Activities This Week
- Stale Leads (>30 days no activity)
- Stale Deals (>14 days in stage)

**Design:** Card styling, metrics, and trend indicators unchanged

### 4. Chart Grid Layout (No Changes)
**Kept:** 2×2 grid layout on desktop, single column on iPad

**Charts:**
- Pipeline by Stage (horizontal bar chart)
- Activity Trend (line chart)
- Top Principals (vertical bar chart)
- Rep Performance (grouped bar chart)

**Note:** Chart designs remain unchanged - only filter UI additions

## Component Spacing

| Element | Spacing Token | Value | Usage |
|---------|--------------|-------|-------|
| Section gaps | gap-section | 24px | Between major page sections (KPIs → Charts) |
| Widget gaps | gap-widget | 16px | Between cards in same row, between chart modules |
| Content gaps | gap-content | 12px | Internal card spacing, text elements |
| Card padding | p-widget | 16px | All KPI cards, chart containers |
| Filter chip gap | gap-2 | 8px | Between individual filter chips |
| KPI card min-height | - | 120px | Consistent card height across row |
| Chart container height | - | 300px | Standard chart module height |
| Applied filter row padding | py-3 | 12px top/bottom | Filter chips row vertical spacing |

## Other Tabs

### Opportunities Tab

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [Principal ▾] [Stage ▾] [Owner ▾] [Date Range ▾]            │
├──────────────────────────────────────────────────────────────┤
│  Applied Filters: [Principal: Acme Foods ×]      [Reset All] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ▼ Acme Foods (12 opportunities)                            │
│    New Lead: 5 | Outreach: 3 | Sample: 2 | Feedback: 1 | …  │
│                                                              │
│    ┌────────────────────────────────────────────────────┐   │
│    │ Opportunity List Table                             │   │
│    │ Columns: Name | Contact | Stage | Days in Stage    │   │
│    │          Last Activity | Owner                     │   │
│    └────────────────────────────────────────────────────┘   │
│                                                              │
│  ▼ Beta Corp (8 opportunities)                              │
│    New Lead: 2 | Outreach: 3 | Sample: 1 | Demo: 1 | Won: 1 │
│    [Table…]                                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Principal grouping (collapsible)
- Stage breakdown counts per principal
- Sortable table within each principal group
- Filter by principal, stage, owner, date range

### Weekly Activity Tab

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [Week Selector: Dec 16-22, 2025 ◀ ▶]          [Export CSV]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ▼ Rep: John Doe (18 activities)                            │
│    ▼ Principal: Acme Foods (8 activities)                   │
│      Calls: 3 | Emails: 4 | Samples: 1                      │
│                                                              │
│      ┌──────────────────────────────────────────────────┐   │
│      │ Activity Log Table                               │   │
│      │ Columns: Date | Type | Contact | Notes           │   │
│      └──────────────────────────────────────────────────┘   │
│                                                              │
│    ▼ Principal: Beta Corp (6 activities)                    │
│      Calls: 2 | Emails: 3 | Samples: 1                      │
│      [Table…]                                                │
│                                                              │
│  ▼ Rep: Jane Smith (14 activities)                          │
│    [Principal groups…]                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Week selector navigation
- Rep → Principal → Activity Type hierarchy
- Collapsible groups at each level
- CSV export for entire week
- Activity type counts at each level

### Campaign Tab

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [Campaign: Holiday Promo ▾]                                 │
│  [Activity Type: All ▾] [Stale Leads Only ☐]                │
├──────────────────────────────────────────────────────────────┤
│  Applied Filters: [Holiday Promo ×]              [Reset All] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Total       │  │ Calls       │  │ Emails      │         │
│  │ Activities  │  │             │  │             │         │
│  │     24      │  │      8      │  │     12      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Campaign Activity Timeline (Line Chart)                │ │
│  │ Shows activity volume over campaign duration          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Activity Details Table                                 │ │
│  │ Columns: Date | Type | Contact | Rep | Notes           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Campaign dropdown selector
- Activity type filters (Calls, Emails, Samples)
- Stale leads toggle (no activity in 30+ days)
- Activity timeline chart
- Detailed activity log table

## Implementation Notes

### Responsive Behavior
- Desktop (≥1280px): 2-column chart grid, 4-column KPI row
- iPad (768-1279px): Single-column charts, 2×2 KPI grid
- Filter chips: Horizontal scroll on narrow viewports

### Accessibility
- Filter chips: `role="listitem"`, dismissible via keyboard
- Reset button: `aria-label="Clear all filters"`
- Charts: `aria-label` with summary data
- KPI cards: semantic HTML structure for screen readers

### Performance Considerations
- Charts lazy-load below fold
- Filter state persists in URL query params
- Debounce filter changes (300ms)
- CSV export streams data (no full dataset load)

### Design System Compliance
- All spacing uses Tailwind v4 semantic tokens
- Colors: `text-muted-foreground`, `bg-muted`, `bg-primary`
- Touch targets: 44×44px minimum (h-11 w-11)
- No raw hex values or OKLCH

## MVP Exclusions
- NO dollar amounts or volume tracking (per CLAUDE.md)
- NO revenue charts or financial metrics
- NO custom date range picker (use standard dropdowns)
- NO real-time data streaming (static snapshots acceptable)
