# Remove Financial Tracking, Add Activity Metrics Design

**Date:** 2025-11-02
**Status:** Design Complete - Ready for Implementation
**Context:** Architectural shift from sales-focused to relationship-focused CRM

## Overview

Transform Atomic CRM from sales-focused (revenue tracking) to relationship-focused (engagement tracking) by removing all financial metrics and replacing them with activity-based relationship metrics.

## Current State

**Dashboard Metrics (3 cards):**
1. Total Opportunities - Count of opportunities
2. Pipeline Revenue - Shows "$0" (references non-existent `opp.amount` field)
3. Win Rate - Percentage of won vs lost opportunities

**Issues:**
- "Pipeline Revenue" card is dead code (references `opp.amount` which doesn't exist in database schema)
- Focus on sales outcomes rather than relationship health
- Financial metrics (DollarSign icon, currency formatting) don't align with relationship tracking

## Target State

**Dashboard Metrics (3 cards):**
1. **Total Contacts** - Count of all non-deleted contacts
2. **Total Organizations** - Count of all non-deleted organizations
3. **Activities This Week** - Count of activities in last 7 days

**Benefits:**
- Focus on relationship inventory and engagement
- No financial references or assumptions
- Activity metric shows engagement momentum

## Scope

### In Scope
1. Dashboard metrics redesign
2. Remove dead code (`opp.amount` references)
3. Icon updates (remove DollarSign, add Users/Building2/Activity)
4. Update responsive grid for 3 cards

### Out of Scope
- Database schema changes (already lacks financial fields)
- New database fields or migrations
- Changes to opportunity stages or status tracking
- Modifying other dashboard components (charts, pipelines)

## Design Details

### Dashboard Metrics Redesign

**Card 1: Total Contacts**
- **Icon:** Users icon (lucide-react)
- **Value:** Count of all non-deleted contacts
- **Unit:** "contacts"
- **Purpose:** Core relationship inventory
- **Data Source:** `useGetList("contacts", { filter: { "deleted_at@is": null } })`

**Card 2: Total Organizations**
- **Icon:** Building2 icon (lucide-react)
- **Value:** Count of all non-deleted organizations
- **Unit:** "organizations"
- **Purpose:** Company/account relationship inventory
- **Data Source:** `useGetList("organizations", { filter: { "deleted_at@is": null } })`

**Card 3: Activities This Week**
- **Icon:** Activity icon (lucide-react)
- **Value:** Count of activities with `activity_date` in last 7 days
- **Unit:** "this week"
- **Purpose:** Recent engagement pulse
- **Data Source:** `useGetList("activities", { filter: { activity_date >= 7 days ago } })`

### Responsive Grid Layout

**iPad Portrait (sm):** 1 column (stacked cards)
**iPad Landscape (md):** 3 columns (single row)
**Desktop (lg+):** 3 columns with larger spacing

Maintains existing responsive behavior, just with 3 cards instead of attempting 4.

## Implementation Details

### Files to Modify

**`src/atomic-crm/dashboard/MetricsCardGrid.tsx`**

**Remove:**
- `useGetList` for opportunities
- Revenue calculation: `const totalRevenue = active.reduce((sum, opp) => sum + (opp.amount || 0), 0);`
- Win rate calculation: `const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0;`
- "Pipeline Revenue" card definition (lines 71-81)
- "Win Rate" card definition (lines 83-87)
- Icon imports: `DollarSign`, `TrendingUp`

**Add:**
- `useGetList` for contacts
- `useGetList` for organizations
- `useGetList` for activities with date filter
- Activity date filtering logic (last 7 days)
- Icon imports: `Users`, `Building2`, `Activity`
- New card definitions for contacts, organizations, activities

### Date Filtering Logic

```typescript
// Calculate 7 days ago
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

// Filter activities
const { data: activities } = useGetList("activities", {
  filter: {
    "deleted_at@is": null,
    "activity_date@gte": sevenDaysAgo,
  },
});
```

### Edge Cases

**Loading States:**
- Show 3 skeleton cards while data loads
- Maintain existing loading animation

**Empty States:**
- Show "0" for counts if no data exists
- Gracefully handle null/undefined values

**Date Filtering:**
- Use ISO date string comparison for timezone safety
- Handle case where activity_date might be null

## Code Changes Summary

**Removed:**
- Opportunity data fetching (dead code)
- Revenue calculation (`opp.amount` reference - field doesn't exist)
- Win rate calculation
- Currency formatting logic (`toLocaleString` with USD)
- Financial icons (DollarSign, TrendingUp)

**Added:**
- Contacts data fetching
- Organizations data fetching
- Activities data fetching with date filter
- Simple count aggregations
- Relationship-focused icons (Users, Building2, Activity)

## Testing Strategy

**Manual Testing:**
1. Verify 3 cards display correctly on iPad portrait
2. Verify 3 cards in single row on iPad landscape
3. Verify contact count matches actual non-deleted contacts
4. Verify organization count matches actual non-deleted organizations
5. Verify activity count only includes last 7 days
6. Test loading states show 3 skeleton cards
7. Test empty state shows "0" for all metrics

**Unit Testing:**
- Test activity date filtering logic
- Test count calculations with empty arrays
- Test loading state rendering
- Test metric card rendering with data

## Migration Notes

**No database migration required** - The schema already lacks financial fields:
- No `amount` field on opportunities table
- Previous pricing removal already completed in October 2025
- This is purely UI cleanup of dead code

## Success Criteria

✅ Dashboard shows 3 relationship-focused metric cards
✅ Zero references to revenue, amount, or financial metrics
✅ Activity count accurately reflects last 7 days
✅ All counts use non-deleted filter
✅ Loading states work correctly
✅ Responsive grid maintains iPad-first design
✅ Icons are relationship-appropriate (no DollarSign)
✅ All tests pass

## Related Documentation

- October 2025 Pricing Removal: `CLAUDE.md` lines 17-33
- Previous cleanup: `docs/plans/2025-11-02-pricing-cleanup-implementation.md`
- Dashboard component: `src/atomic-crm/dashboard/MetricsCardGrid.tsx`
- Engineering Constitution: Focus on relationship tracking over sales metrics
