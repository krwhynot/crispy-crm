# Sidebar Widget Redesign Implementation Plan (Desktop-First)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `MyTasksThisWeek` and `RecentActivityFeed` sidebar widgets with desktop-first design, compact spacing (12px), inline hover actions, and keyboard shortcuts to match the desktop command center paradigm.

**Architecture:** Two sidebar widgets (MyTasksThisWeek, RecentActivityFeed) adopt desktop-first design using DashboardWidget wrapper, compact row heights (32px/h-8), inline hover actions hidden until hover, semantic colors only, utility functions for formatting and icons, and keyboard shortcut integration. No mobile/iPad fallbacks.

**Tech Stack:** React 19 + TypeScript + React Admin hooks (useGetList) + Tailwind CSS 4 (semantic utilities only) + Lucide icons + Vitest for testing + Keyboard shortcut manager

**Design Reference:** `docs/plans/2025-11-11-desktop-first-transformation.md` (Phase 1-3)

---

## Task 1: Create formatRelativeTime Utility with Tests

**Files:**
- Create: `src/atomic-crm/utils/formatRelativeTime.ts`
- Create: `src/atomic-crm/utils/__tests__/formatRelativeTime.test.ts`

**Step 1: Write failing tests**

Create `src/atomic-crm/utils/__tests__/formatRelativeTime.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatRelativeTime } from '../formatRelativeTime';

describe('formatRelativeTime', () => {
  let now: Date;

  beforeEach(() => {
    now = new Date('2025-11-13T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('recent times (hours)', () => {
    it('should return "now" for times within 1 minute', () => {
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo)).toBe('now');
    });

    it('should return "5m ago" for 5 minutes ago', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should return "1h ago" for 1 hour ago', () => {
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
    });

    it('should return "2h ago" for 2 hours ago', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });
  });

  describe('past days', () => {
    it('should return "1d ago" for 1 day ago', () => {
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('1d ago');
    });

    it('should return "3d ago" for 3 days ago', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });

    it('should return "7d ago" for 7 days ago', () => {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(sevenDaysAgo)).toBe('7d ago');
    });

    it('should return date string for times older than 7 days', () => {
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(eightDaysAgo)).toMatch(/Nov \d+/);
    });
  });

  describe('edge cases', () => {
    it('should handle ISO string input', () => {
      const isoString = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(isoString)).toBe('2h ago');
    });

    it('should handle invalid dates', () => {
      expect(formatRelativeTime('invalid-date')).toBe('unknown');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/utils/__tests__/formatRelativeTime.test.ts`

Expected: All tests fail with "formatRelativeTime is not defined"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/utils/formatRelativeTime.ts`:

```typescript
/**
 * Format a date as relative time (e.g., "2h ago", "3d ago")
 * Desktop-optimized: compact format suitable for table displays
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'unknown';

  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(targetDate.getTime())) {
      return 'unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Within 1 minute
    if (diffSec < 60) {
      return 'now';
    }

    // Within 1 hour: show minutes
    if (diffHour === 0) {
      return `${diffMin}m ago`;
    }

    // Within 7 days: show hours or days
    if (diffDay === 0) {
      return `${diffHour}h ago`;
    }

    if (diffDay <= 7) {
      return diffDay === 1 ? '1d ago' : `${diffDay}d ago`;
    }

    // Older than 7 days: show abbreviated date (e.g., "Nov 13")
    const month = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const day = targetDate.getDate();
    return `${month} ${day}`;
  } catch {
    return 'unknown';
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/utils/__tests__/formatRelativeTime.test.ts`

Expected: All tests pass ✓

**Step 5: Commit**

```bash
git add src/atomic-crm/utils/formatRelativeTime.ts src/atomic-crm/utils/__tests__/formatRelativeTime.test.ts
git commit -m "feat(utils): Add formatRelativeTime utility for compact timestamps

- Convert date to relative format (now, 5m ago, 2h ago, 3d ago, Nov 13)
- Desktop-optimized compact format for data tables
- Edge case handling: invalid dates, null values
- 100% test coverage"
```

---

## Task 2: Create getActivityIcon Utility with Tests

**Files:**
- Create: `src/atomic-crm/utils/getActivityIcon.tsx`
- Create: `src/atomic-crm/utils/__tests__/getActivityIcon.test.tsx`

**Step 1: Write failing tests**

Create `src/atomic-crm/utils/__tests__/getActivityIcon.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { getActivityIcon } from '../getActivityIcon';
import { Phone, Mail, Calendar, FileText } from 'lucide-react';

describe('getActivityIcon', () => {
  it('should return Phone icon for "Call" activity type', () => {
    const IconComponent = getActivityIcon('Call');
    expect(IconComponent).toBe(Phone);
  });

  it('should return Mail icon for "Email" activity type', () => {
    const IconComponent = getActivityIcon('Email');
    expect(IconComponent).toBe(Mail);
  });

  it('should return Calendar icon for "Meeting" activity type', () => {
    const IconComponent = getActivityIcon('Meeting');
    expect(IconComponent).toBe(Calendar);
  });

  it('should return FileText icon for "Note" activity type', () => {
    const IconComponent = getActivityIcon('Note');
    expect(IconComponent).toBe(FileText);
  });

  it('should return FileText icon for unknown activity types', () => {
    const IconComponent = getActivityIcon('Unknown');
    expect(IconComponent).toBe(FileText);
  });

  it('should be case-insensitive', () => {
    expect(getActivityIcon('call')).toBe(Phone);
    expect(getActivityIcon('CALL')).toBe(Phone);
    expect(getActivityIcon('email')).toBe(Mail);
  });

  it('should render correctly as React component', () => {
    const IconComponent = getActivityIcon('Call');
    render(<IconComponent className="w-3 h-3" data-testid="activity-icon" />);
    expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/utils/__tests__/getActivityIcon.test.tsx`

Expected: All tests fail with "getActivityIcon is not defined"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/utils/getActivityIcon.tsx`:

```typescript
import { Phone, Mail, Calendar, FileText, LucideIcon } from 'lucide-react';

/**
 * Get Lucide icon component for activity type
 * Desktop-optimized: compact 3-4px icons for table displays
 */
export function getActivityIcon(activityType: string): LucideIcon {
  const normalized = (activityType || '').toLowerCase().trim();

  switch (normalized) {
    case 'call':
      return Phone;
    case 'email':
      return Mail;
    case 'meeting':
      return Calendar;
    case 'note':
      return FileText;
    default:
      return FileText;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/utils/__tests__/getActivityIcon.test.tsx`

Expected: All tests pass ✓

**Step 5: Commit**

```bash
git add src/atomic-crm/utils/getActivityIcon.tsx src/atomic-crm/utils/__tests__/getActivityIcon.test.tsx
git commit -m "feat(utils): Add getActivityIcon utility for activity type icons

- Maps activity types to Lucide icons (Call→Phone, Email→Mail, etc.)
- Desktop-optimized for compact 3-4px display in tables
- Case-insensitive and handles unknown types gracefully
- 100% test coverage"
```

---

## Task 3: Rebuild MyTasksThisWeek Widget with Desktop-First Design

**Files:**
- Modify: `src/atomic-crm/dashboard/MyTasksThisWeek.tsx`
- Modify: `src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx`

**Step 1: Write test for component structure**

Update `src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyTasksThisWeek } from '../MyTasksThisWeek';
import { TestWrapper } from '@/test-utils';

vi.mock('ra-core', () => ({
  useGetList: vi.fn(),
  useGetIdentity: vi.fn(),
}));

describe('MyTasksThisWeek', () => {
  beforeEach(() => {
    const { useGetList, useGetIdentity } = require('ra-core');
    useGetList.mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
      error: null,
    });
    useGetIdentity.mockReturnValue({ identity: { id: 1, name: 'Test User' } });
  });

  it('should render widget title with count badge', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          title: 'Follow up call',
          due_date: new Date().toISOString().split('T')[0],
          status: 'Active',
        },
      ],
      total: 1,
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <MyTasksThisWeek />
      </TestWrapper>
    );

    expect(screen.getByText(/MY TASKS/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show loading skeleton', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [],
      total: 0,
      isPending: true,
      error: null,
    });

    render(
      <TestWrapper>
        <MyTasksThisWeek />
      </TestWrapper>
    );

    expect(screen.getByTestId('tasks-skeleton')).toBeInTheDocument();
  });

  it('should group tasks by urgency (OVERDUE, TODAY, THIS WEEK)', () => {
    const { useGetList } = require('ra-core');
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    useGetList.mockReturnValue({
      data: [
        { id: 1, title: 'Overdue', due_date: yesterday.toISOString().split('T')[0], status: 'Active' },
        { id: 2, title: 'Today', due_date: today.toISOString().split('T')[0], status: 'Active' },
      ],
      total: 2,
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <MyTasksThisWeek />
      </TestWrapper>
    );

    expect(screen.getByText(/OVERDUE/)).toBeInTheDocument();
    expect(screen.getByText(/TODAY/)).toBeInTheDocument();
  });

  it('should have compact row height (h-8)', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [
        { id: 1, title: 'Task 1', due_date: '2025-11-20', status: 'Active' },
      ],
      total: 1,
      isPending: false,
      error: null,
    });

    const { container } = render(
      <TestWrapper>
        <MyTasksThisWeek />
      </TestWrapper>
    );

    const taskRow = container.querySelector('[data-testid="task-row"]');
    expect(taskRow).toHaveClass('h-8');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx`

Expected: Multiple test failures - component needs rebuilding

**Step 3: Write the new component implementation**

Update `src/atomic-crm/dashboard/MyTasksThisWeek.tsx`:

```typescript
import React, { useMemo } from 'react';
import { useGetList, useGetIdentity } from 'ra-core';
import { useNavigate } from 'react-router-dom';
import { DashboardWidget } from './DashboardWidget';
import { formatRelativeTime } from '@/atomic-crm/utils/formatRelativeTime';

interface Task {
  id: number | string;
  title: string;
  due_date: string;
  status: string;
}

/**
 * MyTasksThisWeek - Desktop-first widget showing incomplete tasks due this week
 *
 * Design:
 * - Compact spacing: 12px padding, 32px (h-8) row height
 * - Header: uppercase "MY TASKS THIS WEEK" with count badge
 * - Grouping: OVERDUE → TODAY → THIS WEEK
 * - Inline hover actions (hidden until hover): checkbox, timestamp badge
 * - Semantic colors only (destructive, warning, muted-foreground)
 * - No responsive fallbacks (desktop-only)
 */
export const MyTasksThisWeek: React.FC = () => {
  const navigate = useNavigate();
  const { identity } = useGetIdentity();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  const { data: tasks = [], isPending, error } = useGetList('tasks', {
    filter: {
      completed: false,
      due_date_lte: endOfWeekStr,
      sales_id: identity?.id,
    },
    sort: { field: 'due_date', order: 'ASC' },
    pagination: { page: 1, perPage: 50 },
  });

  // Group tasks by urgency
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      OVERDUE: [],
      TODAY: [],
      'THIS WEEK': [],
    };

    (tasks as Task[]).forEach((task) => {
      if (task.due_date < todayStr) {
        groups.OVERDUE.push(task);
      } else if (task.due_date === todayStr) {
        groups.TODAY.push(task);
      } else {
        groups['THIS WEEK'].push(task);
      }
    });

    return groups;
  }, [tasks, todayStr]);

  if (isPending) {
    return (
      <DashboardWidget>
        <div className="flex items-center justify-between mb-2 h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            MY TASKS THIS WEEK
          </h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-muted rounded-full">
            -
          </span>
        </div>
        <div data-testid="tasks-skeleton" className="space-y-0.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </DashboardWidget>
    );
  }

  const hasNoTasks = Object.values(groupedTasks).every((group) => group.length === 0);
  const totalTasks = tasks.length;

  return (
    <DashboardWidget>
      {/* Header - Compact (h-6) */}
      <div className="flex items-center justify-between mb-2 h-6">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          MY TASKS THIS WEEK
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
          {totalTasks}
        </span>
      </div>

      {/* Empty State */}
      {hasNoTasks && (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">No tasks this week</p>
        </div>
      )}

      {/* Task Sections */}
      {!hasNoTasks && (
        <div className="space-y-0">
          {Object.entries(groupedTasks).map(([sectionTitle, sectionTasks]) =>
            sectionTasks.length > 0 ? (
              <div key={sectionTitle}>
                {/* Section Header - h-6 */}
                <div className="bg-muted/30 h-6 px-2 flex items-center border-b border-border/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {sectionTitle}
                  </span>
                </div>

                {/* Task Rows - h-8 desktop-compact */}
                {sectionTasks.map((task) => {
                  const isOverdue = sectionTitle === 'OVERDUE';
                  const isToday = sectionTitle === 'TODAY';

                  return (
                    <div
                      key={task.id}
                      data-testid="task-row"
                      className="h-8 border-b border-border/30 hover:bg-accent/5 flex items-center px-2 cursor-pointer group transition-colors desktop-hover-show"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      {/* Checkbox - Hidden until hover */}
                      <input
                        type="checkbox"
                        className="w-3 h-3 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Complete task: ${task.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Call API to mark task complete
                        }}
                      />

                      {/* Task Title */}
                      <span className="flex-1 text-xs text-foreground truncate">
                        {task.title}
                      </span>

                      {/* Due Date Badge - Semantic colors */}
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ml-1 ${
                          isOverdue
                            ? 'bg-destructive/10 text-destructive'
                            : isToday
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {isOverdue
                          ? 'OVERDUE'
                          : isToday
                            ? 'TODAY'
                            : formatRelativeTime(task.due_date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-xs text-destructive">
          Failed to load tasks
        </div>
      )}
    </DashboardWidget>
  );
};

export default MyTasksThisWeek;
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx`

Expected: All tests pass ✓

**Step 5: Build verification**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors ✓

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/MyTasksThisWeek.tsx src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx
git commit -m "refactor(dashboard): Rebuild MyTasksThisWeek widget with desktop-first design

- Compact spacing: 12px padding, 32px (h-8) rows, 6px header
- Desktop-only design: no mobile/tablet fallbacks
- Task grouping: OVERDUE → TODAY → THIS WEEK
- Semantic color badges: destructive/warning/muted
- Inline hover actions: checkbox visibility toggle
- Uppercase headers with tighter tracking
- 100% test coverage"
```

---

## Task 4: Rebuild RecentActivityFeed Widget with Desktop-First Design

**Files:**
- Modify: `src/atomic-crm/dashboard/RecentActivityFeed.tsx`
- Modify: `src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx`

**Step 1: Write test for component structure**

Update `src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecentActivityFeed } from '../RecentActivityFeed';
import { TestWrapper } from '@/test-utils';

vi.mock('ra-core', () => ({
  useGetList: vi.fn(),
}));

describe('RecentActivityFeed', () => {
  beforeEach(() => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
      error: null,
    });
  });

  it('should render widget title with count badge', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          type: 'Call',
          principal_name: 'Acme Corp',
          created_at: new Date().toISOString(),
          notes: 'Discussed pricing',
        },
      ],
      total: 1,
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <RecentActivityFeed />
      </TestWrapper>
    );

    expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show loading skeleton', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [],
      total: 0,
      isPending: true,
      error: null,
    });

    render(
      <TestWrapper>
        <RecentActivityFeed />
      </TestWrapper>
    );

    expect(screen.getByTestId('activity-skeleton')).toBeInTheDocument();
  });

  it('should display activities with icon and relative timestamp', () => {
    const { useGetList } = require('ra-core');
    const now = new Date();

    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          type: 'Call',
          principal_name: 'Acme Corp',
          created_at: now.toISOString(),
          notes: 'Discussed pricing',
        },
      ],
      total: 1,
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <RecentActivityFeed />
      </TestWrapper>
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('now')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx`

Expected: Multiple test failures - component needs rebuilding

**Step 3: Write the new component implementation**

Update `src/atomic-crm/dashboard/RecentActivityFeed.tsx`:

```typescript
import React, { useMemo } from 'react';
import { useGetList } from 'ra-core';
import { useNavigate } from 'react-router-dom';
import { DashboardWidget } from './DashboardWidget';
import { formatRelativeTime } from '@/atomic-crm/utils/formatRelativeTime';
import { getActivityIcon } from '@/atomic-crm/utils/getActivityIcon';

interface Activity {
  id: number | string;
  type: string;
  principal_name: string;
  created_at: string;
  notes?: string;
  [key: string]: any;
}

/**
 * RecentActivityFeed - Desktop-first widget showing last 7 activities
 *
 * Design:
 * - Compact spacing: 12px padding, 32px (h-8) row height
 * - Header: uppercase "RECENT ACTIVITY" with count badge
 * - Rows: Icon | Principal Name | Compact Timestamp
 * - Activity notes as single-line subtitle (truncated)
 * - Inline hover interactions (hidden until hover)
 * - Semantic colors only
 * - No responsive fallbacks (desktop-only)
 */
export const RecentActivityFeed: React.FC = () => {
  const navigate = useNavigate();

  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, []);

  const { data: activities = [], isPending, error } = useGetList('activities', {
    filter: {
      deleted_at: null,
      created_at_gte: sevenDaysAgo,
    },
    sort: { field: 'created_at', order: 'DESC' },
    pagination: { page: 1, perPage: 7 },
  });

  if (isPending) {
    return (
      <DashboardWidget>
        <div className="flex items-center justify-between mb-2 h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            RECENT ACTIVITY
          </h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-muted rounded-full">
            -
          </span>
        </div>
        <div data-testid="activity-skeleton" className="space-y-0.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </DashboardWidget>
    );
  }

  const hasNoActivities = activities.length === 0;

  return (
    <DashboardWidget>
      {/* Header - Compact (h-6) */}
      <div className="flex items-center justify-between mb-2 h-6">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          RECENT ACTIVITY
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
          {activities.length}
        </span>
      </div>

      {/* Empty State */}
      {hasNoActivities && (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">No recent activity</p>
        </div>
      )}

      {/* Activity Rows - h-8 desktop-compact */}
      {!hasNoActivities && (
        <div className="space-y-0">
          {(activities as Activity[]).map((activity) => {
            const IconComponent = getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="h-8 border-b border-border/30 hover:bg-accent/5 flex items-center px-2 cursor-pointer group transition-colors"
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                {/* Icon - Compact 3px */}
                <div className="flex-shrink-0 w-3 h-3 mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                  <IconComponent className="w-full h-full" aria-hidden="true" />
                </div>

                {/* Principal Name + Timestamp */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                  <span className="text-xs font-medium text-foreground truncate">
                    {activity.principal_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-xs text-destructive">
          Failed to load activities
        </div>
      )}
    </DashboardWidget>
  );
};

export default RecentActivityFeed;
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx`

Expected: All tests pass ✓

**Step 5: Build verification**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors ✓

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/RecentActivityFeed.tsx src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx
git commit -m "refactor(dashboard): Rebuild RecentActivityFeed widget with desktop-first design

- Compact spacing: 12px padding, 32px (h-8) rows, 6px header
- Desktop-only design: no mobile/tablet fallbacks
- Activity type icons (3px) with semantic color on hover
- Compact timestamp format (e.g., '2h ago')
- Single-line layout: icon | principal | timestamp
- Uppercase header with tighter tracking
- 100% test coverage"
```

---

## Task 5: Verify Dashboard Widget Integration

**Files:**
- Verify: `src/atomic-crm/dashboard/Dashboard.tsx` (existing)

**Step 1: Run all dashboard tests**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/`

Expected: All dashboard tests pass (including new widget tests)

**Step 2: Build verification**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors ✓

**Step 3: Desktop-specific visual verification**

1. Run: `npm run dev`
2. Open: `http://localhost:5173` and navigate to Dashboard
3. Verify on desktop viewport (1440px+):
   - MyTasksThisWeek: Compact header (6px), 8px rows, no mobile styles
   - RecentActivityFeed: Compact header (6px), 8px rows, 3px icons
   - Hover actions visible (checkboxes, icon color change)
   - No responsive breakpoints visible
   - All semantic colors (no #hex, no CSS vars)
   - Text is crisp and compact (no generous padding)

Expected: Desktop dashboard displays correctly with compact spacing ✓

**Step 4: Commit integration verification**

```bash
git add .
git commit -m "docs: Complete sidebar widget redesign with desktop-first design

✓ Semantic color migration complete (no gray-900, blue-100, etc.)
✓ Desktop-first design: 12px padding, 32px rows, 3px icons
✓ Compact spacing tokens (h-8, h-6, px-2, py-0.5)
✓ Inline hover actions (checkboxes, icon color changes)
✓ No mobile/tablet responsive fallbacks
✓ 100% test coverage (15+ new tests)
✓ Uppercase headers with semantic colors
✓ All dashboard components follow desktop-first paradigm"
```

---

## Testing Checklist

Before marking as complete, verify:

- [ ] All 15+ new unit tests pass (npm test)
- [ ] TypeScript compilation succeeds (npm run build)
- [ ] ESLint passes (npm run lint)
- [ ] Desktop viewport verification (1440px) shows compact spacing
- [ ] Hover states show/hide correctly
- [ ] All colors are semantic (no #hex, no var(...) syntax)
- [ ] Row heights are 32px (h-8) or 24px (h-6) for headers
- [ ] Icons are 3px (w-3 h-3) where used
- [ ] No console errors or warnings
- [ ] Git history clean with descriptive commits

---

## Key Differences from iPad-First

| iPad-First (OLD) | Desktop-First (NEW) |
|------------------|-------------------|
| 44px touch targets | Smaller targets OK (3-7px) |
| Generous padding (20px) | Compact padding (12px) |
| 40px rows (h-10) | Compact rows (32px / h-8) |
| Responsive fallbacks | Desktop-only design |
| Simple hover states | Inline hidden actions |
| Touch-first interaction | Keyboard+mouse priority |

---

## Next Steps After Completion

1. **Optional: Complete Desktop Transformation** → `docs/plans/2025-11-11-desktop-first-transformation.md`
   - Implement keyboard shortcuts and context menus
   - Add export scheduling
   - Implement quick action modals

2. **Optional: Dashboard Layout Optimization** → `docs/plans/2025-11-12-dashboard-compact-grid-layout.md`
   - Refactor to 3-column compact grid
   - Optimize all 5 widgets for desktop density
   - Add data visualization enhancements

3. **Deploy to Production** when ready
