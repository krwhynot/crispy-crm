# Campaign Activity Report - Design Document

**Date:** 2025-11-11
**Status:** Approved
**Owner:** Campaign Management

---

## Overview

A comprehensive activity tracking report for marketing campaigns that shows what engagement channels are being used, identifies stale leads, and provides drill-down details for each activity type.

**Primary Use Case:** Track activity volume and engagement patterns for the Grand Rapids Trade Show campaign (369 opportunities, 141+ activities).

---

## Goals

1. **Track engagement channels** - Understand which activity types (calls, emails, notes) are being used
2. **Identify stale leads** - Find opportunities with no recent activity that need follow-up
3. **Measure campaign coverage** - Show what % of leads have been contacted
4. **Enable drill-down** - Provide summary view with expandable details when needed

---

## Report Structure

### 1. Header Section

**Components:**
- Report title: "Campaign Activity Report"
- Campaign selector dropdown (switches between campaigns)
- Export to CSV button
- Filter panel (expandable on mobile)

### 2. Summary Dashboard (4 Cards)

Grid layout (1 column mobile, 4 columns desktop):

**Card 1: Total Activities**
- Count of all activities matching filters
- Example: "247 activities"

**Card 2: Organizations Contacted**
- Unique organizations with ≥1 activity
- Example: "119 organizations"

**Card 3: Coverage Rate**
- % of campaign opportunities contacted
- Formula: (Orgs with activity / Total campaign opps) × 100
- Example: "68% contacted"

**Card 4: Avg Activities per Lead**
- Total activities / total opportunities
- Example: "2.1 per lead"

### 3. Activity Type Breakdown

Expandable cards sorted by count (descending):

**Collapsed State:**
```
┌─────────────────────────────────────────────────┐
│ 📝 Note                          [ChevronRight] │
│ 141 activities • 119 unique orgs • 57%          │
│ Most active: 10 PIN ICE CREAM (3 notes)        │
└─────────────────────────────────────────────────┘
```

Shows:
- Activity type icon and name
- Total count for this type
- Unique organizations engaged
- Percentage of total activities
- Most active organization

**Expanded State:**

Table with columns:
1. **Organization** - Customer name (truncated ~30 chars)
2. **Contact** - Contact name (if linked)
3. **Date** - Activity date ("Nov 11" or "Nov 11, 2024" if different year)
4. **Rep** - Sales rep first name
5. **Subject** - Activity subject/notes (truncated ~50 chars)
6. **Action** - External link icon to opportunity detail

**Behavior:**
- Auto-expand top 3 activity types on load
- Click card header to toggle expand/collapse
- Activities sorted by date (most recent first)
- External link opens `/opportunities/{id}/show`

---

## Filters

### Campaign Selector (Primary)
- **Type:** Dropdown
- **Options:** All campaigns with opportunity counts
- **Example:** "Grand Rapids Trade Show (369 opportunities)"
- **Default:** Most recent campaign or URL parameter `?campaign=X`

### Date Range
- **Type:** Start/End date pickers
- **Filters:** Activities by `created_at` date
- **Default:** "All time" (no filter)
- **Quick Presets:** "Last 7 days", "Last 30 days", "This month"

### Activity Type
- **Type:** Multi-select checkboxes
- **Options:** Call, Email, Meeting, Note, Demo, Proposal, Follow-up, Trade Show, Site Visit, Contract Review, Check-in, Social
- **Default:** "All Types" (all checked)
- **Display:** Show counts next to each type

### Sales Rep
- **Type:** Autocomplete dropdown
- **Options:** Sales reps with activity counts
- **Default:** "All Reps"
- **Filter:** `activities.created_by = sales.id`

### "No Recent Activity" Toggle ⭐
- **Type:** Checkbox + number input
- **Label:** "Show only leads with no activity in last [X] days"
- **Default:** Unchecked, X = 7 days
- **Behavior:** When enabled, shows opportunities with NO activities in timeframe
- **Display:** Warning badge showing stale lead count ("⚠️ 23 leads need follow-up")
- **Result View:** List of stale opportunities (not activities)
  - Columns: Organization, Last Activity Date (or "Never"), Days Inactive, Action
  - Action button: "View Opportunity"

### Clear Filters
- **Display:** Appears when any filter is active (except campaign selector)
- **Action:** Resets all filters to defaults (keeps campaign selected)

---

## Data Fetching

### Primary Query

```typescript
const { data: activities } = useGetList<Activity>(
  "activities",
  {
    pagination: { page: 1, perPage: 10000 },
    filter: {
      // Join with opportunities to filter by campaign
      "opportunities.campaign": selectedCampaign,
      "opportunities.deleted_at@is": null,
      // Apply user filters
      ...(filters.startDate && { "created_at@gte": filters.startDate }),
      ...(filters.endDate && { "created_at@lte": filters.endDate }),
      ...(filters.activityTypes.length && { type: filters.activityTypes }),
      ...(filters.salesRep && { created_by: filters.salesRep }),
    },
    sort: { field: "created_at", order: "DESC" },
  }
);
```

### SQL Join Strategy

```sql
SELECT a.*,
       o.campaign,
       o.name as opportunity_name,
       o.stage,
       org.name as organization_name,
       c.name as contact_name
FROM activities a
JOIN opportunities o ON o.customer_organization_id = a.organization_id
LEFT JOIN organizations org ON org.id = a.organization_id
LEFT JOIN contacts c ON c.id = a.contact_id
WHERE o.campaign = 'Grand Rapids Trade Show'
  AND o.deleted_at IS NULL
  AND a.created_at >= '2025-11-01'  -- if date filter applied
ORDER BY a.created_at DESC
LIMIT 10000;
```

### Related Data

**Sales Reps:**
```typescript
const ownerIds = useMemo(
  () => Array.from(new Set((activities || []).map(a => a.created_by).filter(Boolean))),
  [activities]
);

const { data: salesReps } = useGetList<Sale>("sales", {
  filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
});

const salesMap = useMemo(
  () => new Map((salesReps || []).map(s => [s.id, `${s.first_name} ${s.last_name}`])),
  [salesReps]
);
```

### Client-Side Grouping

```typescript
const activityGroups = useMemo(() => {
  if (!activities) return [];

  // Group by activity type
  const grouped = new Map<string, ActivityGroup>();

  activities.forEach((activity) => {
    const type = activity.type || "Unknown";

    if (!grouped.has(type)) {
      grouped.set(type, {
        type,
        activities: [],
        totalCount: 0,
        uniqueOrgs: new Set(),
      });
    }

    const group = grouped.get(type)!;
    group.activities.push(activity);
    group.totalCount += 1;
    group.uniqueOrgs.add(activity.organization_id);
  });

  // Convert to array and sort by count
  return Array.from(grouped.values())
    .map(g => ({ ...g, uniqueOrgs: g.uniqueOrgs.size }))
    .sort((a, b) => b.totalCount - a.totalCount);
}, [activities]);
```

---

## CSV Export

### Export Functionality

**Button:** Top right, next to filters
**Filename:** `campaign-activity-{campaign-slug}-{date}.csv`
**Example:** `campaign-activity-grand-rapids-trade-show-2025-11-11.csv`

### CSV Columns

1. **campaign** - Campaign name
2. **activity_type** - Interaction type (call, email, note, etc.)
3. **activity_category** - Category (engagement, proposal, etc.)
4. **subject** - Activity subject/notes
5. **organization** - Customer organization name
6. **contact_name** - Contact name (if linked)
7. **date** - Activity date (YYYY-MM-DD format)
8. **sales_rep** - Rep name
9. **days_since_activity** - Days ago (calculated)
10. **opportunity_name** - Linked opportunity
11. **opportunity_stage** - Current stage

### Security

**CSV Sanitization:**
```typescript
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

const exportData = activityGroups.flatMap(group =>
  group.activities.map(activity => ({
    campaign: sanitizeCsvValue(selectedCampaign),
    activity_type: sanitizeCsvValue(activity.type),
    activity_category: sanitizeCsvValue(activity.activity_type),
    subject: sanitizeCsvValue(activity.subject),
    organization: sanitizeCsvValue(activity.organization_name),
    contact_name: sanitizeCsvValue(activity.contact_name || ""),
    date: format(new Date(activity.created_at), "yyyy-MM-dd"),
    sales_rep: sanitizeCsvValue(salesMap.get(activity.created_by!) || "Unassigned"),
    days_since_activity: Math.floor((Date.now() - new Date(activity.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    opportunity_name: sanitizeCsvValue(activity.opportunity_name || ""),
    opportunity_stage: sanitizeCsvValue(activity.opportunity_stage || ""),
  }))
);
```

**Prevents:** Formula injection, control character injection, binary uploads

---

## Edge Cases

### No Activities Found
- **Display:** Empty state message
- **Text:** "No activities found for this campaign"
- **Suggestion:** "Activities will appear here once your team starts engaging with leads"
- **Summary Cards:** Show zeros

### Campaign with No Opportunities
- **Display:** Empty state message
- **Text:** "This campaign has no opportunities yet"
- **Hide:** Activity type breakdown section

### "No Recent Activity" Filter Results
- **Display:** List of stale opportunities (not activities)
- **Columns:** Organization, Last Activity Date, Days Inactive, Action
- **Action:** "View Opportunity" button → `/opportunities/{id}/show`
- **Sort:** By days inactive (descending)

### Large Campaigns (1000+ activities)
- **Performance:** Client-side grouping/filtering with `useMemo`
- **Pagination:** Consider adding to expanded tables if needed (50 per page)
- **Alternative:** Virtual scrolling for very large datasets

### Filter Combinations
- **Date + Type + Rep:** Standard boolean AND logic
- **No Recent Activity + Other Filters:** No recent activity overrides other filters (shows stale opps only)
- **Empty Results:** Show "No activities match the current filters" with active filter badges

---

## UI & Accessibility

### Responsive Design

**Mobile (375px - 767px):**
- Stack filters vertically
- Summary cards: 1 column
- Activity cards: Full width
- Table: Horizontal scroll with sticky first column

**Tablet (768px - 1024px):**
- Filter panel: Collapsible sidebar on right
- Summary cards: 2x2 grid
- Activity cards: Full width
- Table: All columns visible

**Desktop (1440px+):**
- Filter panel: Fixed right sidebar
- Summary cards: 4 columns
- Activity cards: Max width 1200px
- Table: All columns with comfortable spacing

### Accessibility

**WCAG 2.1 AA Compliance:**
- ✅ Semantic HTML (Card, CardHeader, CardContent)
- ✅ Keyboard navigation (Tab, Enter, Space for expand/collapse)
- ✅ Screen reader labels (`aria-label`, `aria-expanded`)
- ✅ 44x44px minimum touch targets
- ✅ Color contrast ratios ≥4.5:1
- ✅ Focus indicators visible

**Screen Reader Announcements:**
- "Expandable section: Notes, 141 activities"
- "Expanded" / "Collapsed"
- "Filter by date range, from {date} to {date}"

### Visual Indicators

**Activity Type Icons:**
- 📞 Call
- ✉️ Email
- 🤝 Meeting
- 📝 Note
- 🎯 Demo
- 📋 Proposal
- 🔄 Follow-up
- 🎪 Trade Show
- 🏢 Site Visit
- 📄 Contract Review
- ✔️ Check-in
- 💬 Social

**Badges:**
- Warning: "⚠️ 23 leads need follow-up" (red/orange)
- Date: "Today", "Yesterday", or formatted date
- Stage: Opportunity stage badge (colored by stage)

**Loading States:**
- Skeleton cards for summary metrics
- Spinner for activity list
- "Loading campaign activities..." message

---

## Component Structure

```
CampaignActivityReport/
├── index.tsx                    # Main component
├── CampaignActivityReport.tsx   # Report container
├── ActivityTypeCard.tsx         # Expandable activity group card
├── ActivityTable.tsx            # Activity details table
├── StaleLeadsView.tsx           # "No recent activity" results
└── __tests__/
    └── CampaignActivityReport.test.tsx
```

### File Location

`src/atomic-crm/reports/CampaignActivityReport.tsx`

### Route

`/reports/campaign-activity` or `/reports/campaign-activity?campaign={id}`

---

## Implementation Checklist

**Phase 1: Core Report**
- [ ] Create report component with ReportLayout
- [ ] Implement summary dashboard (4 cards)
- [ ] Implement activity type grouping logic
- [ ] Create ActivityTypeCard component (collapsed/expanded)
- [ ] Create ActivityTable component with columns

**Phase 2: Filters**
- [ ] Campaign selector dropdown
- [ ] Date range pickers with presets
- [ ] Activity type multi-select
- [ ] Sales rep autocomplete
- [ ] Clear filters button

**Phase 3: Special Features**
- [ ] "No Recent Activity" toggle with stale leads view
- [ ] CSV export functionality
- [ ] Auto-expand top 3 activity types
- [ ] Click-through to opportunity details

**Phase 4: Polish**
- [ ] Loading states and skeletons
- [ ] Empty states for all scenarios
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Error handling and notifications

**Phase 5: Testing**
- [ ] Unit tests for grouping logic
- [ ] Unit tests for filter combinations
- [ ] E2E test for full workflow
- [ ] Test with Grand Rapids campaign data (369 opps)
- [ ] Performance test with 1000+ activities

---

## Success Criteria

✅ **Functional:**
- Shows all activities for selected campaign
- Groups activities by type with accurate counts
- Filters work independently and in combination
- "No recent activity" toggle identifies stale leads
- CSV export includes all filtered data
- Click-through navigates to opportunity details

✅ **Performance:**
- Initial load < 2 seconds for 500 activities
- Filter changes update UI < 500ms
- Smooth expand/collapse animations
- No jank on scroll or interaction

✅ **UX:**
- Users can quickly see which channels are being used
- Users can identify leads needing follow-up
- Users can drill down to activity details when needed
- Export provides data for external analysis

---

## Future Enhancements (Out of Scope)

- **Activity Timeline View:** Chronological visualization of all activities
- **Rep Performance Comparison:** Side-by-side rep activity stats
- **Campaign Comparison:** Compare activity patterns across multiple campaigns
- **Activity Goals:** Set and track activity targets per campaign
- **Bulk Actions:** Bulk create follow-up tasks from stale leads view
- **Integration:** Link to email/call systems for one-click outreach

---

## Related Documentation

- [Engineering Constitution](../claude/engineering-constitution.md) - Fail-fast error handling, Zod validation
- [Opportunities by Principal Report](../../src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx) - Reference implementation
- [Weekly Activity Summary](../../src/atomic-crm/reports/WeeklyActivitySummary.tsx) - Activity grouping patterns
- [CSV Upload Validator](../../src/atomic-crm/utils/csvUploadValidator.ts) - Security sanitization

---

**Design approved:** 2025-11-11
**Ready for implementation:** Yes ✅
