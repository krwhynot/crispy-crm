# Remove Financial Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace financial metrics with relationship-focused activity metrics on the dashboard

**Architecture:** Single-file refactor of MetricsCardGrid component, replacing opportunity-based financial calculations with contact/organization counts and activity tracking

**Tech Stack:** React, React Admin (useGetList), TypeScript, lucide-react icons

---

## Task 1: Replace Financial Metrics with Relationship Metrics

**Files:**
- Modify: `src/atomic-crm/dashboard/MetricsCardGrid.tsx` (complete replacement)

**Context:**
The current dashboard shows:
1. Total Opportunities (keep concept, but different data source)
2. Pipeline Revenue (REMOVE - references non-existent `opp.amount` field)
3. Win Rate (REMOVE - sales-focused metric)

We're replacing with:
1. Total Contacts
2. Total Organizations
3. Activities This Week

**Step 1: Update imports**

In `src/atomic-crm/dashboard/MetricsCardGrid.tsx`, replace lines 1-5:

```typescript
// OLD (lines 1-5):
import { useGetList } from "ra-core";
import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import { useMemo } from "react";
import type { Opportunity } from "../types";

// NEW:
import { useGetList } from "ra-core";
import { Card } from "@/components/ui/card";
import { Users, Building2, Activity } from "lucide-react";
import { useMemo } from "react";
```

**Changes:**
- Remove: `TrendingUp`, `DollarSign`, `Target` icons
- Add: `Users`, `Building2`, `Activity` icons
- Remove: `Opportunity` type import (not needed)

**Step 2: Replace data fetching logic**

In `src/atomic-crm/dashboard/MetricsCardGrid.tsx`, replace lines 33-40 with three separate `useGetList` calls:

```typescript
// OLD (lines 33-40):
export const MetricsCardGrid = () => {
  const { data: opportunities, isPending } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: 1000 },
      filter: { "deleted_at@is": null },
    }
  );

// NEW:
export const MetricsCardGrid = () => {
  // Fetch contacts
  const { data: contacts, isPending: contactsPending } = useGetList(
    "contacts",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: { "deleted_at@is": null },
    }
  );

  // Fetch organizations
  const { data: organizations, isPending: organizationsPending } = useGetList(
    "organizations",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: { "deleted_at@is": null },
    }
  );

  // Calculate 7 days ago for activity filtering
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch activities from last 7 days
  const { data: activities, isPending: activitiesPending } = useGetList(
    "activities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "deleted_at@is": null,
        "activity_date@gte": sevenDaysAgo,
      },
    }
  );

  // Combined loading state
  const isPending = contactsPending || organizationsPending || activitiesPending;
```

**Changes:**
- Replace single opportunities fetch with three separate fetches
- Add date calculation for 7-day activity filter
- Use higher perPage limit (10000) to avoid pagination issues
- Combine loading states

**Step 3: Replace metrics calculation**

In `src/atomic-crm/dashboard/MetricsCardGrid.tsx`, replace lines 42-89 (entire `useMemo` block):

```typescript
// OLD (lines 42-89): [entire old metrics calculation]

// NEW:
  const metrics = useMemo((): MetricCard[] => {
    // Loading state - show zeros
    if (!contacts || !organizations || !activities) {
      return [
        { title: "Total Contacts", value: "0", icon: null, unit: "contacts" },
        { title: "Total Organizations", value: "0", icon: null, unit: "organizations" },
        { title: "Activities This Week", value: "0", icon: null, unit: "this week" },
      ];
    }

    // Calculate actual metrics
    return [
      {
        title: "Total Contacts",
        value: contacts.length,
        icon: <Users className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "contacts",
      },
      {
        title: "Total Organizations",
        value: organizations.length,
        icon: <Building2 className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "organizations",
      },
      {
        title: "Activities This Week",
        value: activities.length,
        icon: <Activity className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "this week",
      },
    ];
  }, [contacts, organizations, activities]);
```

**Changes:**
- Remove: `active`, `won`, `lost`, `closed` opportunity filtering
- Remove: `totalRevenue` calculation (references non-existent `opp.amount`)
- Remove: `winRate` calculation
- Remove: Currency formatting logic
- Add: Simple counts for contacts, organizations, activities
- Add: `aria-hidden="true"` to icons for accessibility
- Update: Dependencies array to `[contacts, organizations, activities]`

**Step 4: Verify changes don't affect loading skeleton or card rendering**

Lines 91-111 and 113-182 remain unchanged. They handle:
- Loading skeleton (3 cards)
- Grid layout (responsive)
- MetricCard component (works with new data structure)

No changes needed for these sections.

**Step 5: Run type check**

Run:
```bash
npm run typecheck
```

Expected: ✅ No TypeScript errors

**Step 6: Run tests**

Run:
```bash
npm test
```

Expected: ✅ All tests pass (660 tests)

**Step 7: Manual verification**

Start dev server and check dashboard:
```bash
npm run dev
```

Navigate to dashboard and verify:
- ✅ Three metric cards display
- ✅ "Total Contacts" shows count with Users icon
- ✅ "Total Organizations" shows count with Building2 icon
- ✅ "Activities This Week" shows count with Activity icon
- ✅ No financial symbols ($, %) displayed
- ✅ Loading skeletons show while data fetches
- ✅ Responsive grid works on different screen sizes

**Step 8: Commit changes**

```bash
git add src/atomic-crm/dashboard/MetricsCardGrid.tsx
git commit -m "refactor(dashboard): replace financial metrics with relationship metrics

Replace Pipeline Revenue and Win Rate with relationship-focused metrics:
- Add Total Contacts metric (Users icon)
- Add Total Organizations metric (Building2 icon)
- Add Activities This Week metric (Activity icon)
- Remove dead code referencing non-existent opp.amount field
- Remove currency formatting and DollarSign icon
- Focus on relationship inventory and engagement tracking

Related: docs/plans/2025-11-02-remove-financial-tracking-design.md"
```

---

## Complete File After Changes

**`src/atomic-crm/dashboard/MetricsCardGrid.tsx` (final state):**

```typescript
import { useGetList } from "ra-core";
import { Card } from "@/components/ui/card";
import { Users, Building2, Activity } from "lucide-react";
import { useMemo } from "react";

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  unit?: string;
  trend?: number;
  trendLabel?: string;
}

/**
 * MetricsCardGrid - iPad-first responsive dashboard metrics
 *
 * Design Strategy (iPad-First Responsive):
 * - iPad Portrait (sm): 1 column, full width cards
 * - iPad Landscape (md): 3 columns, optimal for field use
 * - Desktop (lg+): 3 columns with larger spacing
 *
 * Touch Targets: 44x44px minimum (Apple HIG compliant)
 * Card Heights: 160px (iPad portrait), 176px (iPad landscape), 192px (desktop)
 *
 * Color System: Uses semantic Tailwind utilities only
 * - No inline CSS variables (text-[color:var(--text-subtle)])
 * - All text colors via Tailwind: text-muted-foreground, text-foreground
 * - Borders via semantic: border-border
 * - Shadows via semantic: shadow-sm, shadow-md (mapped to elevation system)
 */
export const MetricsCardGrid = () => {
  // Fetch contacts
  const { data: contacts, isPending: contactsPending } = useGetList(
    "contacts",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: { "deleted_at@is": null },
    }
  );

  // Fetch organizations
  const { data: organizations, isPending: organizationsPending } = useGetList(
    "organizations",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: { "deleted_at@is": null },
    }
  );

  // Calculate 7 days ago for activity filtering
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch activities from last 7 days
  const { data: activities, isPending: activitiesPending } = useGetList(
    "activities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "deleted_at@is": null,
        "activity_date@gte": sevenDaysAgo,
      },
    }
  );

  // Combined loading state
  const isPending = contactsPending || organizationsPending || activitiesPending;

  const metrics = useMemo((): MetricCard[] => {
    // Loading state - show zeros
    if (!contacts || !organizations || !activities) {
      return [
        { title: "Total Contacts", value: "0", icon: null, unit: "contacts" },
        { title: "Total Organizations", value: "0", icon: null, unit: "organizations" },
        { title: "Activities This Week", value: "0", icon: null, unit: "this week" },
      ];
    }

    // Calculate actual metrics
    return [
      {
        title: "Total Contacts",
        value: contacts.length,
        icon: <Users className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "contacts",
      },
      {
        title: "Total Organizations",
        value: organizations.length,
        icon: <Building2 className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "organizations",
      },
      {
        title: "Activities This Week",
        value: activities.length,
        icon: <Activity className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" aria-hidden="true" />,
        unit: "this week",
      },
    ];
  }, [contacts, organizations, activities]);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6 w-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 md:h-44 lg:h-48 bg-card rounded-lg border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6 w-full">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} metric={metric} />
      ))}
    </div>
  );
};

/**
 * Individual metric card component
 *
 * iPad-First Responsive Sizing:
 * - Base (sm): 16px padding, compact text
 * - md (iPad landscape): 20px padding, balanced text
 * - lg+ (desktop): 24px padding, spacious layout
 *
 * Touch Targets:
 * - Icon container: 44x44px (sm), 48x48px (md), 52x52px (lg)
 * - All interactive areas meet 44px minimum
 *
 * Semantic Colors (NO inline CSS variables):
 * - Title: text-muted-foreground (warm gray)
 * - Value: text-foreground (darkest text)
 * - Unit: text-muted-foreground (secondary)
 * - Border: border-border (1px hairline)
 * - Shadow: shadow-sm (elevation-1), hover:shadow-md (elevation-2)
 */
interface MetricCardProps {
  metric: MetricCard;
}

const MetricCard = ({ metric }: MetricCardProps) => {
  return (
    <Card className="rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6 flex flex-col justify-between h-40 md:h-44 lg:h-48 transition-shadow duration-200 hover:shadow-md active:shadow-sm">
      {/* Header: Icon + Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs md:text-sm lg:text-base font-semibold text-muted-foreground tracking-wide uppercase">
            {metric.title}
          </h3>
        </div>

        {/* Icon Container - 44x44px minimum touch target (Apple HIG) */}
        <div className="flex-shrink-0 w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md flex items-center justify-center text-muted-foreground opacity-75 flex-center">
          {metric.icon}
        </div>
      </div>

      {/* Main Value - Large, prominent metric number */}
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums text-foreground leading-none">
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-xs md:text-sm lg:text-base text-muted-foreground font-normal ml-1">
            {metric.unit}
          </span>
        )}
      </div>

      {/* Optional trend indicator */}
      {metric.trend !== undefined && (
        <div
          className={`text-xs md:text-sm mt-2 font-medium ${
            metric.trend > 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {metric.trend > 0 ? "↑" : "↓"} {Math.abs(metric.trend)}%{" "}
          {metric.trendLabel && `(${metric.trendLabel})`}
        </div>
      )}
    </Card>
  );
};

export default MetricsCardGrid;
```

---

## Testing Checklist

After implementation, verify:

- [ ] TypeScript compiles with no errors (`npm run typecheck`)
- [ ] All tests pass (`npm test` - 660 tests)
- [ ] Dashboard displays 3 metric cards
- [ ] Total Contacts shows correct count with Users icon
- [ ] Total Organizations shows correct count with Building2 icon
- [ ] Activities This Week shows count from last 7 days with Activity icon
- [ ] No dollar signs ($) or percentage symbols (%) appear
- [ ] Loading state shows 3 skeleton cards
- [ ] Responsive grid works:
  - iPad Portrait: 1 column stacked
  - iPad Landscape: 3 columns single row
  - Desktop: 3 columns with spacing
- [ ] Icons render correctly at all breakpoints
- [ ] Card hover states work (shadow changes)

---

## Rollback Plan

If something goes wrong:

```bash
# Revert the commit
git revert HEAD

# Or restore from specific commit before changes
git checkout <commit-before-changes> -- src/atomic-crm/dashboard/MetricsCardGrid.tsx
```

---

## Notes for Implementer

**Why removing `opp.amount`:**
- The `amount` field doesn't exist in the opportunities table schema
- Current code shows "$0" because the field is undefined
- This is dead code that should have been removed during October 2025 pricing removal

**Date filtering:**
- Using `toISOString().split('T')[0]` for consistent date format
- Supabase `@gte` operator handles date comparison correctly
- 7 days = 168 hours, calculated from current date/time

**Performance:**
- Using `perPage: 10000` to avoid pagination issues
- Combined loading state ensures all data loads before displaying
- `useMemo` prevents unnecessary recalculations

**Accessibility:**
- Added `aria-hidden="true"` to decorative icons
- Card titles remain accessible via text
- Touch targets maintain 44px minimum (Apple HIG)
