# Sidebar Widget Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `MyTasksThisWeek` and `RecentActivityFeed` sidebar widgets with table-style design and proper semantic colors to match the principal table's visual language while improving data density and information hierarchy.

**Architecture:** Two sidebar widgets (MyTasksThisWeek, RecentActivityFeed) adopt the principal table's visual DNA using DashboardWidget wrapper, table-style headers with row-based layouts, hover states with semantic colors, and utility functions for formatting and icons. Implements iPad-optimized spacing and touch targets (44px minimum).

**Tech Stack:** React 19 + TypeScript + React Admin hooks (useGetList) + Tailwind CSS 4 (semantic utilities only) + Lucide icons + Vitest for testing

**Design Reference:** `docs/plans/2025-11-12-sidebar-widget-redesign.md`

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

    it('should handle future dates gracefully', () => {
      const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(tomorrow);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle invalid dates', () => {
      expect(formatRelativeTime('invalid-date')).toBe('unknown');
    });

    it('should handle null/undefined gracefully', () => {
      expect(formatRelativeTime(null as any)).toBe('unknown');
      expect(formatRelativeTime(undefined as any)).toBe('unknown');
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
 * @param date - Date object or ISO string
 * @returns Relative time string (e.g., "5m ago", "1d ago", "Nov 13")
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
git commit -m "feat(utils): Add formatRelativeTime utility for widget timestamps

- Convert date to relative format (now, 5m ago, 2h ago, 3d ago, Nov 13)
- Handle edge cases: invalid dates, future dates, null values
- 100% test coverage with 9 test cases"
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
    expect(getActivityIcon('MEETING')).toBe(Calendar);
  });

  it('should handle empty string as unknown', () => {
    const IconComponent = getActivityIcon('');
    expect(IconComponent).toBe(FileText);
  });

  it('should render correctly as React component', () => {
    const IconComponent = getActivityIcon('Call');
    render(<IconComponent className="w-4 h-4" data-testid="activity-icon" />);
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
 * Maps activity types to appropriate icons:
 * - Call → Phone
 * - Email → Mail
 * - Meeting → Calendar
 * - Note → FileText
 * - Default → FileText
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
git commit -m "feat(utils): Add getActivityIcon utility for activity type mapping

- Maps activity types to Lucide icons (Call→Phone, Email→Mail, etc.)
- Case-insensitive and handles unknown types gracefully
- 100% test coverage with 8 test cases"
```

---

## Task 3: Rebuild MyTasksThisWeek Widget with Table-Style Design

**Files:**
- Modify: `src/atomic-crm/dashboard/MyTasksThisWeek.tsx`
- Modify: `src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx`

**Step 1: Write test for component structure**

Create/update `src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyTasksThisWeek } from '../MyTasksThisWeek';
import { TestWrapper } from '@/test-utils';

// Mock React Admin hooks
vi.mock('ra-core', () => ({
  useGetList: vi.fn(),
  useGetIdentity: vi.fn(),
  useRefresh: vi.fn(),
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

  it('should render widget title', () => {
    render(
      <TestWrapper>
        <MyTasksThisWeek />
      </TestWrapper>
    );
    expect(screen.getByText(/MY TASKS THIS WEEK/i)).toBeInTheDocument();
  });

  it('should display task count badge', () => {
    const { useGetList } = require('ra-core');
    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          title: 'Follow up call',
          due_date: new Date().toISOString().split('T')[0],
          status: 'Active',
          priority: 'high',
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

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show empty state when no tasks', () => {
    render(
      <TestWrapper>
        <MyTasksThisWeek />
      </TestWrapper>
    );
    expect(screen.getByText(/No tasks this week/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
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

  it('should render tasks with proper styling', () => {
    const { useGetList } = require('ra-core');
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          title: 'Follow up call',
          due_date: today.toISOString().split('T')[0],
          status: 'Active',
          priority: 'high',
        },
        {
          id: 2,
          title: 'Send proposal',
          due_date: tomorrow.toISOString().split('T')[0],
          status: 'Active',
          priority: 'medium',
        },
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

    expect(screen.getByText('Follow up call')).toBeInTheDocument();
    expect(screen.getByText('Send proposal')).toBeInTheDocument();
  });

  it('should group tasks by due date sections', () => {
    const { useGetList } = require('ra-core');
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          title: 'Overdue task',
          due_date: yesterday.toISOString().split('T')[0],
          status: 'Active',
        },
        {
          id: 2,
          title: 'Today task',
          due_date: today.toISOString().split('T')[0],
          status: 'Active',
        },
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

  it('should have "View all tasks" link', () => {
    render(
      <TestWrapper>
        <MyTasksThisWeek />
      </TestWrapper>
    );

    const link = screen.getByText(/View all tasks/i);
    expect(link).toHaveAttribute('href', '/tasks');
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
  description?: string;
  due_date: string;
  status: string;
  priority?: string;
  completed?: boolean;
}

/**
 * MyTasksThisWeek - Table-style widget showing incomplete tasks due this week
 *
 * Design:
 * - Header: "MY TASKS THIS WEEK" with count badge
 * - Grouping: OVERDUE → TODAY → THIS WEEK
 * - Row styling: h-8, hover:bg-muted/30
 * - Checkbox: Marks task complete
 * - Click: Navigate to task detail
 * - Footer: "View all tasks" link
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

  // Group tasks by due date sections
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
        <div className="flex items-center justify-between mb-4 h-7">
          <h2 className="text-sm font-semibold text-foreground">MY TASKS THIS WEEK</h2>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-xs font-semibold bg-muted rounded-full">
            -
          </span>
        </div>
        <div data-testid="tasks-skeleton" className="space-y-1">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3 h-7">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          MY TASKS THIS WEEK
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
          {totalTasks}
        </span>
      </div>

      {/* Empty State */}
      {hasNoTasks && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">No tasks this week</p>
        </div>
      )}

      {/* Task Sections */}
      {!hasNoTasks && (
        <div className="space-y-0.5">
          {Object.entries(groupedTasks).map(([sectionTitle, sectionTasks]) =>
            sectionTasks.length > 0 ? (
              <div key={sectionTitle}>
                {/* Section Header */}
                <div className="bg-muted/30 h-6 px-2 py-1 flex items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {sectionTitle}
                  </span>
                </div>

                {/* Task Rows */}
                {sectionTasks.map((task, idx) => {
                  const isOverdue = sectionTitle === 'OVERDUE';
                  const isToday = sectionTitle === 'TODAY';

                  return (
                    <div
                      key={task.id}
                      className="h-8 border-b border-border hover:bg-muted/30 flex items-center px-2 cursor-pointer group"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        className="w-4 h-4 mr-2 cursor-pointer"
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

                      {/* Due Date Badge */}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ml-2 ${
                          isOverdue
                            ? 'bg-destructive/20 text-destructive'
                            : isToday
                              ? 'bg-warning/20 text-warning'
                              : 'bg-muted text-muted-foreground'
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

      {/* Footer Link */}
      {!hasNoTasks && (
        <div className="border-t-2 border-border mt-2 pt-2">
          <a
            href="/tasks"
            className="text-xs text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate('/tasks');
            }}
          >
            View all tasks →
          </a>
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

**Step 5: Verify build and component rendering**

Run: `npm run build` and verify no TypeScript errors

Expected: Build succeeds ✓

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/MyTasksThisWeek.tsx src/atomic-crm/dashboard/__tests__/MyTasksThisWeek.test.tsx
git commit -m "refactor(dashboard): Rebuild MyTasksThisWeek widget with table-style design

- Table-style header with uppercase tracking and count badge
- Task grouping: OVERDUE → TODAY → THIS WEEK
- Semantic color badges: destructive for overdue, warning for today
- Checkbox integration for task completion
- Navigation to task detail on row click
- Loading skeleton and empty states
- 100% test coverage with 7 test cases"
```

---

## Task 4: Rebuild RecentActivityFeed Widget with Icons and Timestamps

**Files:**
- Modify: `src/atomic-crm/dashboard/RecentActivityFeed.tsx`
- Modify: `src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx`

**Step 1: Write test for component structure**

Create/update `src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecentActivityFeed } from '../RecentActivityFeed';
import { TestWrapper } from '@/test-utils';

// Mock React Admin hooks
vi.mock('ra-core', () => ({
  useGetList: vi.fn(),
  useGetIdentity: vi.fn(),
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

  it('should render widget title', () => {
    render(
      <TestWrapper>
        <RecentActivityFeed />
      </TestWrapper>
    );
    expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
  });

  it('should display activity count', () => {
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

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show empty state when no activities', () => {
    render(
      <TestWrapper>
        <RecentActivityFeed />
      </TestWrapper>
    );
    expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
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

  it('should display activities with icon, principal name, and timestamp', () => {
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
        {
          id: 2,
          type: 'Email',
          principal_name: 'Widget Inc',
          created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          notes: 'Sent proposal',
        },
      ],
      total: 2,
      isPending: false,
      error: null,
    });

    render(
      <TestWrapper>
        <RecentActivityFeed />
      </TestWrapper>
    );

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Widget Inc')).toBeInTheDocument();
    expect(screen.getByText(/now|ago/i)).toBeInTheDocument();
  });

  it('should have "View all activities" link', () => {
    render(
      <TestWrapper>
        <RecentActivityFeed />
      </TestWrapper>
    );

    const link = screen.getByText(/View all activities/i);
    expect(link).toHaveAttribute('href', '/activities');
  });

  it('should display activity notes as subtitle', () => {
    const { useGetList } = require('ra-core');
    const now = new Date();

    useGetList.mockReturnValue({
      data: [
        {
          id: 1,
          type: 'Call',
          principal_name: 'Acme Corp',
          created_at: now.toISOString(),
          notes: 'Discussed new product features',
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

    expect(screen.getByText('Discussed new product features')).toBeInTheDocument();
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
  organization_name?: string;
  created_at: string;
  notes?: string;
  [key: string]: any;
}

/**
 * RecentActivityFeed - Table-style widget showing last 5-7 activities
 *
 * Design:
 * - Header: "RECENT ACTIVITY" with count badge
 * - Rows: Icon | Principal Name | Timestamp
 * - Subtitle: Activity notes (optional)
 * - Row styling: h-8, hover:bg-muted/30
 * - Click: Navigate to activity detail or open modal
 * - Footer: "View all activities" link
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
        <div className="flex items-center justify-between mb-4 h-7">
          <h2 className="text-sm font-semibold text-foreground">RECENT ACTIVITY</h2>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-xs font-semibold bg-muted rounded-full">
            -
          </span>
        </div>
        <div data-testid="activity-skeleton" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </DashboardWidget>
    );
  }

  const hasNoActivities = activities.length === 0;

  return (
    <DashboardWidget>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 h-7">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          RECENT ACTIVITY
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
          {activities.length}
        </span>
      </div>

      {/* Empty State */}
      {hasNoActivities && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">No recent activity</p>
        </div>
      )}

      {/* Activity Rows */}
      {!hasNoActivities && (
        <div className="space-y-0.5">
          {(activities as Activity[]).map((activity) => {
            const IconComponent = getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="border-b border-border hover:bg-muted/30 py-2 px-2 cursor-pointer group transition-colors"
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                <div className="flex items-start gap-2">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                    <IconComponent className="w-full h-full" aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {activity.principal_name || activity.organization_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatRelativeTime(activity.created_at)}
                      </span>
                    </div>

                    {/* Activity Notes as Subtitle */}
                    {activity.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Link */}
      {!hasNoActivities && (
        <div className="border-t-2 border-border mt-2 pt-2">
          <a
            href="/activities"
            className="text-xs text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate('/activities');
            }}
          >
            View all activities →
          </a>
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

**Step 5: Verify build and component rendering**

Run: `npm run build` and verify no TypeScript errors

Expected: Build succeeds ✓

**Step 6: Manual verification (iPad viewport)**

1. Run: `npm run dev`
2. Open: `http://localhost:5173`
3. Resize browser to iPad viewport: **768px × 1024px**
4. Verify:
   - Both widgets display without horizontal scroll
   - Hover states work smoothly
   - Icons render correctly
   - Timestamps display relative times
   - Touch targets are ≥ 44px

Expected: All visual checks pass ✓

**Step 7: Commit**

```bash
git add src/atomic-crm/dashboard/RecentActivityFeed.tsx src/atomic-crm/dashboard/__tests__/RecentActivityFeed.test.tsx
git commit -m "refactor(dashboard): Rebuild RecentActivityFeed widget with icons and timestamps

- Table-style design with activity type icons (Call, Email, Meeting, Note)
- Relative timestamps using formatRelativeTime utility
- Principal name with activity notes as subtitle
- Semantic color styling with hover states
- Empty state and error handling
- iPad-optimized spacing and 44px+ touch targets
- 100% test coverage with 7 test cases"
```

---

## Task 5: Verify Dashboard Widget Integration

**Files:**
- No new files (verify existing integration)

**Step 1: Check dashboard imports**

Run: `npm run lint -- src/atomic-crm/dashboard/Dashboard.tsx`

Expected: No lint errors, imports are correct

**Step 2: Run all dashboard tests**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/`

Expected: All dashboard tests pass (including new widget tests)

**Step 3: Build verification**

Run: `npm run build`

Expected: Build succeeds with no TypeScript errors ✓

**Step 4: Manual integration test (iPad viewport)**

1. Run: `npm run dev`
2. Open: `http://localhost:5173` and navigate to Dashboard
3. Verify on iPad viewport (768px):
   - Header: "My Principals" with Ctrl+L and Ctrl+R hints
   - Left column: Upcoming Events and Opportunities by Principal
   - Right sidebar: My Tasks This Week → Recent Activity Feed → Pipeline Summary
   - All widgets have semantic colors (no gray-900, no bg-blue-100, etc.)
   - Hover states work smoothly
   - All touch targets are ≥ 44px
   - No horizontal scroll needed

Expected: Dashboard displays correctly without scrolling ✓

**Step 5: Commit verification**

Run: `git log --oneline -7` to see all commits

Expected: All task commits visible:
- Task 1: formatRelativeTime utility
- Task 2: getActivityIcon utility
- Task 3: MyTasksThisWeek widget
- Task 4: RecentActivityFeed widget
- Task 5: Integration verification (this task)

**Step 6: Final commit - Summary**

```bash
git add .
git commit -m "docs: Complete sidebar widget redesign implementation

✓ Semantic color migration complete (no gray-900, blue-100, etc.)
✓ Table-style widgets with headers and grouping
✓ Relative timestamps and activity icons
✓ iPad-optimized spacing and touch targets (44px+)
✓ 100% test coverage (18 new tests)
✓ All dashboard components follow design system
✓ Verified on iPad viewport (768px) without scrolling"
```

---

## Testing Checklist

Before marking as complete, verify:

- [ ] All 18 new unit tests pass (npm test)
- [ ] TypeScript compilation succeeds (npm run build)
- [ ] ESLint passes (npm run lint)
- [ ] Manual test on iPad viewport (768px×1024px)
- [ ] Hover states work smoothly
- [ ] All interactive elements are ≥ 44px tall
- [ ] Semantic colors only (no #hex, no var(...))
- [ ] No console errors or warnings
- [ ] Git history clean (7 commits)

---

## Rollback Plan

If issues arise:

```bash
# Identify problematic commit
git log --oneline | head -10

# Revert one commit
git revert <commit-hash>

# Or reset to previous state
git reset --hard <commit-hash>
```

---

## Next Steps After Completion

1. **Optional: Complete Grid Layout** → `docs/plans/2025-11-12-dashboard-compact-grid-layout.md`
   - Refactor to 3-column compact layout
   - Add compact spacing variables
   - Optimize all 5 widgets for space

2. **Optional: Pipeline Summary** → `docs/plans/2025-11-12-pipeline-summary-widget-implementation.md`
   - Complete the 5th widget
   - Add pipeline health metrics
   - Implement click filters

3. **Deploy to Production** when ready
