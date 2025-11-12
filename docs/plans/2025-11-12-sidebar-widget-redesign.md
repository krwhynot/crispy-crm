# Sidebar Widget Redesign - Table-Style Implementation

**Date:** 2025-11-12
**Status:** Ready for Implementation
**Context:** Rebuild `MyTasksThisWeek` and `RecentActivityFeed` widgets from scratch to match principal table's visual style

## Design Overview

Both sidebar widgets adopt the **principal table's visual DNA** while remaining distinct as supporting widgets:

- **Visual Language**: Table-style headers, compact rows, hover states matching principal table
- **Container**: `DashboardWidget` wrapper (same as principal table)
- **Typography**: `text-xs uppercase tracking-wider` headers, `h-8` rows, `px-3 py-1` cell padding
- **Colors**: `hover:bg-muted/30`, semantic colors only (`--destructive`, `--primary`, `--muted-foreground`)
- **Interaction**: Single-action rows (no inline action buttons like principal table)

## Tasks

### Task 1: Create Shared Utility Functions

**Files to create:**
- `src/atomic-crm/utils/formatRelativeTime.ts`
- `src/atomic-crm/utils/getActivityIcon.tsx`

**Requirements:**

**formatRelativeTime:**
```typescript
export function formatRelativeTime(date: Date | string): string {
  // Returns: "2h ago", "1d ago", "3d ago"
  // Handle edge cases: invalid dates, future dates, very old dates
}
```

**getActivityIcon:**
```typescript
import { Phone, Mail, Calendar, FileText, LucideIcon } from 'lucide-react';

export function getActivityIcon(activityType: string): LucideIcon {
  // Maps activity type to Lucide icon component
  // Call → Phone, Email → Mail, Meeting → Calendar, Note → FileText
  // Default: FileText for unknown types
}
```

**Tests required:**
- `formatRelativeTime.test.ts`: Test hours, days, edge cases
- `getActivityIcon.test.tsx`: Test all activity types, unknown types

### Task 2: Rebuild MyTasksThisWeek Widget

**File to replace:**
- `src/atomic-crm/dashboard/MyTasksThisWeek.tsx`

**Requirements:**

**Data Fetching:**
```typescript
const { data: tasks } = useGetList('tasks', {
  filter: {
    completed: false,
    due_date_lte: endOfWeek,
    sales_id: currentUserId
  },
  sort: { field: 'due_date', order: 'ASC' },
  pagination: { page: 1, perPage: 50 }
});
```

**Table Structure:**
- Header: "MY TASKS THIS WEEK" with count badge
- Columns: [Checkbox] [Task Title] [Due Date Badge]
- Sub-headers for grouping: OVERDUE / TODAY / THIS WEEK
- Sub-header styling: `bg-muted/30 h-6 text-xs font-semibold`

**Task Row:**
- Height: `h-8`
- Hover: `hover:bg-muted/30`
- Checkbox: Triggers `QuickCompleteTaskModal` (import from existing)
- Row click: Navigate to `/tasks/${taskId}`
- Due date badge: Semantic colors (destructive for overdue, warning for today, muted for future)

**Footer:**
- Border: `border-t-2 border-border`
- Link: "View all tasks →" to `/tasks`

**States:**
- Loading: Skeleton rows with pulse animation
- Error: Red text "Failed to load tasks"
- Empty: "No tasks this week"

**Accessibility:**
- Checkboxes have labels (visually hidden)
- Interactive rows have proper `aria-label`
- Icons have `aria-hidden="true"`

### Task 3: Rebuild RecentActivityFeed Widget

**File to replace:**
- `src/atomic-crm/dashboard/RecentActivityFeed.tsx`

**Requirements:**

**Data Fetching:**
```typescript
const { data: activities } = useGetList('activities', {
  filter: {
    created_at_gte: sevenDaysAgo
  },
  sort: { field: 'created_at', order: 'DESC' },
  pagination: { page: 1, perPage: 7 }
});
```

**Table Structure:**
- Header: "RECENT ACTIVITY" with count badge
- Columns: [Type Icon] [Description] [Timestamp]
- No sub-headers (chronological order)

**Activity Row:**
- Height: `h-8`
- Hover: `hover:bg-muted/30`
- Icon: Use `getActivityIcon()` utility, `w-3 h-3 text-muted-foreground`
- Description: `{activity_type} with {contact_name} · {organization_name}`, truncate with ellipsis
- Timestamp: Use `formatRelativeTime()`, right-aligned, `text-xs text-muted-foreground`
- Row click: Navigate to `/activities/${activityId}`

**Footer:**
- Border: `border-t-2 border-border`
- Link: "View all activities →" to `/activities`

**States:**
- Loading: Skeleton rows with pulse animation
- Error: Red text "Failed to load activities"
- Empty: "No recent activity"

**Accessibility:**
- Interactive rows have proper `aria-label`
- Icons have `aria-hidden="true"`

### Task 4: Integration & Verification

**Requirements:**

1. Verify widgets render correctly in `PrincipalDashboard.tsx` (already wired up)
2. Test visual consistency with principal table:
   - Row height matches (`h-8`)
   - Hover state matches (`hover:bg-muted/30`)
   - Typography matches (headers, body text)
   - Spacing matches (padding, gaps)
3. Test interactions:
   - Task checkbox → QuickCompleteTaskModal opens
   - Task row click → Navigate to task detail
   - Activity row click → Navigate to activity detail
   - Footer links → Navigate to list views
4. Test responsive behavior (70/30 grid collapses on mobile)
5. Screenshot for documentation

**Acceptance Criteria:**
- All widgets match principal table visual style
- All interactions work as specified
- No console errors
- Passes accessibility audit (WCAG 2.1 AA)

## Technical Notes

**Dependencies:**
- `useGetList` from react-admin
- `useGetIdentity` from react-admin (for current user ID)
- `DashboardWidget` from `./DashboardWidget`
- `QuickCompleteTaskModal` from `../tasks/QuickCompleteTaskModal`
- Lucide icons: `Phone`, `Mail`, `Calendar`, `FileText`, `CheckSquare`
- Existing Checkbox component from shadcn/ui

**Date Utilities:**
```typescript
import { endOfWeek, subDays } from 'date-fns';

const endOfWeek = endOfWeek(new Date());
const sevenDaysAgo = subDays(new Date(), 7);
```

**Color System:**
- Use semantic CSS variables only
- Never hardcode hex/OKLCH values
- Destructive: `text-destructive`, `bg-destructive`
- Primary: `text-primary`, `bg-primary`
- Muted: `text-muted-foreground`, `bg-muted`

## Design Rationale

**Why table-style instead of cards:**
- Matches principal table (visual consistency)
- Higher information density (more content visible)
- Follows 2024-2025 CRM best practices (Attio, Linear, Close)
- Better for desktop-first workflow (primary use case)

**Why sub-headers in tasks widget:**
- Urgency grouping is critical for task prioritization
- Table structure accommodates sub-headers naturally
- Avoids nested tables (accessibility issue)

**Why single-action rows:**
- Sidebar widgets are information displays, not manipulation surfaces
- Reduces cognitive load (one clear action per row)
- Principal table has multi-action because it's the primary workspace

## QA Checklist

- [ ] All utilities have unit tests with 100% coverage
- [ ] Widgets match principal table row height
- [ ] Hover states match principal table exactly
- [ ] Task checkbox triggers modal (doesn't navigate)
- [ ] Row clicks navigate to detail pages
- [ ] Footer links navigate to list views
- [ ] Loading states show skeleton rows
- [ ] Error states show helpful messages
- [ ] Empty states show friendly messages
- [ ] No hardcoded colors (semantic vars only)
- [ ] Accessibility audit passes (keyboard nav, screen readers)
- [ ] Visual consistency verified via screenshot
