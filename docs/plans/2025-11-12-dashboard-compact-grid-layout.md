# Dashboard Compact Grid Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform dashboard to a 3-column compact grid layout where all 5 widgets are visible without scrolling.

**Architecture:** Refactor PrincipalDashboard to use CSS Grid with 40/30/30 column split, reduce spacing throughout, and implement progressive disclosure for data density.

**Tech Stack:** React, Tailwind CSS 4, TypeScript, Vitest for testing

---

## Task 1: Update Spacing Variables in CSS

**Files:**
- Modify: `src/index.css:72-96`
- Test: Manual visual verification

**Step 1: Add compact spacing variables**

In `src/index.css`, add new compact spacing variables:

```css
/* Compact Dashboard Spacing */
--spacing-dashboard-header: 32px;
--spacing-dashboard-widget-header: 28px;
--spacing-dashboard-widget-padding: 12px;
--spacing-dashboard-gap: 16px;
--spacing-dashboard-row-height: 36px;
```

**Step 2: Verify CSS loads**

Run: `npm run dev`
Open: http://localhost:5173
Expected: App loads without CSS errors

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add compact dashboard spacing variables"
```

---

## Task 2: Create Compact Dashboard Header Component

**Files:**
- Create: `src/atomic-crm/dashboard/CompactDashboardHeader.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/CompactDashboardHeader.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/__tests__/CompactDashboardHeader.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CompactDashboardHeader } from '../CompactDashboardHeader';

describe('CompactDashboardHeader', () => {
  it('displays title and date on single line', () => {
    render(<CompactDashboardHeader />);

    expect(screen.getByText(/Principal Dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Week of/)).toBeInTheDocument();
  });

  it('has compact height styling', () => {
    const { container } = render(<CompactDashboardHeader />);
    const header = container.firstChild;

    expect(header).toHaveClass('h-8');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test CompactDashboardHeader`
Expected: FAIL with "Cannot find module '../CompactDashboardHeader'"

**Step 3: Create minimal implementation**

Create `src/atomic-crm/dashboard/CompactDashboardHeader.tsx`:

```typescript
import React from 'react';

export const CompactDashboardHeader: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="h-8 flex items-center justify-between px-3 bg-white border-b">
      <h1 className="text-xl font-semibold text-gray-900">
        Principal Dashboard - Week of {currentDate}
      </h1>
      <div className="flex gap-2">
        <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
          Refresh
        </button>
        <button className="px-3 py-1 text-sm bg-primary text-white hover:bg-primary-dark rounded">
          Quick Log
        </button>
      </div>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `npm test CompactDashboardHeader`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/CompactDashboardHeader.tsx
git add src/atomic-crm/dashboard/__tests__/CompactDashboardHeader.test.tsx
git commit -m "feat: add compact dashboard header component"
```

---

## Task 3: Create Compact Grid Layout Container

**Files:**
- Create: `src/atomic-crm/dashboard/CompactGridDashboard.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/CompactGridDashboard.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/__tests__/CompactGridDashboard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CompactGridDashboard } from '../CompactGridDashboard';

describe('CompactGridDashboard', () => {
  it('renders with 3-column grid layout', () => {
    const { container } = render(<CompactGridDashboard />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('lg:grid-cols-[40%_30%_30%]');
  });

  it('uses compact spacing', () => {
    const { container } = render(<CompactGridDashboard />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('gap-4');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test CompactGridDashboard`
Expected: FAIL with "Cannot find module '../CompactGridDashboard'"

**Step 3: Create minimal implementation**

Create `src/atomic-crm/dashboard/CompactGridDashboard.tsx`:

```typescript
import React from 'react';
import { CompactDashboardHeader } from './CompactDashboardHeader';

export const CompactGridDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <CompactDashboardHeader />
      <div className="p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_30%_30%] gap-4">
          {/* Left Column - Principal Table */}
          <div className="bg-white rounded-lg p-3">
            <div className="h-[260px]">Principal Table Placeholder</div>
          </div>

          {/* Middle Column - Upcoming & Tasks */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Upcoming Events Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="h-[180px]">My Tasks Placeholder</div>
            </div>
          </div>

          {/* Right Column - Activity & Pipeline */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Recent Activity Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="h-[180px]">Pipeline Summary Placeholder</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `npm test CompactGridDashboard`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/CompactGridDashboard.tsx
git add src/atomic-crm/dashboard/__tests__/CompactGridDashboard.test.tsx
git commit -m "feat: add compact grid dashboard container"
```

---

## Task 4: Create Compact Principal Table Widget

**Files:**
- Create: `src/atomic-crm/dashboard/CompactPrincipalTable.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/CompactPrincipalTable.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/__tests__/CompactPrincipalTable.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CompactPrincipalTable } from '../CompactPrincipalTable';

describe('CompactPrincipalTable', () => {
  it('shows maximum 5 rows initially', () => {
    const mockData = Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Principal ${i}`,
      activity: `${i * 2}/${i * 3}`
    }));

    render(<CompactPrincipalTable data={mockData} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6); // 5 data + 1 header
  });

  it('shows expand link when more than 5 rows', () => {
    const mockData = Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Principal ${i}`,
      activity: `${i * 2}/${i * 3}`
    }));

    render(<CompactPrincipalTable data={mockData} />);

    expect(screen.getByText('Show all 10 principals')).toBeInTheDocument();
  });

  it('uses compact row height', () => {
    const mockData = [{id: 1, name: 'Test', activity: '1/2'}];

    const { container } = render(<CompactPrincipalTable data={mockData} />);
    const row = container.querySelector('tbody tr');

    expect(row).toHaveClass('h-9');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test CompactPrincipalTable`
Expected: FAIL with "Cannot find module '../CompactPrincipalTable'"

**Step 3: Create implementation**

Create `src/atomic-crm/dashboard/CompactPrincipalTable.tsx`:

```typescript
import React, { useState } from 'react';

interface Principal {
  id: number;
  name: string;
  activity: string;
}

interface Props {
  data: Principal[];
}

export const CompactPrincipalTable: React.FC<Props> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const displayData = expanded ? data : data.slice(0, 5);
  const hasMore = data.length > 5;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-2 h-7">
        <h2 className="text-sm font-semibold text-gray-900">My Principals</h2>
        <span className="text-xs text-gray-500">{data.length} total</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-600 border-b">
            <th className="pb-1">Principal</th>
            <th className="pb-1 text-center">Activity</th>
            <th className="pb-1 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {displayData.map(principal => (
            <tr key={principal.id} className="h-9 border-b hover:bg-gray-50">
              <td className="py-1">{principal.name}</td>
              <td className="py-1 text-center text-xs">{principal.activity}</td>
              <td className="py-1">
                <button className="text-gray-400 hover:text-gray-600">→</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          Show all {data.length} principals
        </button>
      )}
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `npm test CompactPrincipalTable`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/CompactPrincipalTable.tsx
git add src/atomic-crm/dashboard/__tests__/CompactPrincipalTable.test.tsx
git commit -m "feat: add compact principal table widget"
```

---

## Task 5: Create Compact Tasks Widget

**Files:**
- Create: `src/atomic-crm/dashboard/CompactTasksWidget.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/CompactTasksWidget.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/__tests__/CompactTasksWidget.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CompactTasksWidget } from '../CompactTasksWidget';

describe('CompactTasksWidget', () => {
  it('shows maximum 4 tasks', () => {
    const mockTasks = Array(10).fill(null).map((_, i) => ({
      id: i,
      title: `Task ${i}`,
      priority: i % 2 === 0 ? 'high' : 'normal'
    }));

    render(<CompactTasksWidget tasks={mockTasks} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
  });

  it('shows total count in header', () => {
    const mockTasks = Array(8).fill(null).map((_, i) => ({
      id: i,
      title: `Task ${i}`,
      priority: 'normal'
    }));

    render(<CompactTasksWidget tasks={mockTasks} />);

    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test CompactTasksWidget`
Expected: FAIL

**Step 3: Create implementation**

Create `src/atomic-crm/dashboard/CompactTasksWidget.tsx`:

```typescript
import React from 'react';

interface Task {
  id: number;
  title: string;
  priority: 'high' | 'normal' | 'low';
}

interface Props {
  tasks: Task[];
}

export const CompactTasksWidget: React.FC<Props> = ({ tasks }) => {
  const displayTasks = tasks.slice(0, 4);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-2 h-7">
        <h2 className="text-sm font-semibold text-gray-900">My Tasks This Week</h2>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {displayTasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded"
              aria-label={`Complete ${task.title}`}
            />
            <span className="text-sm truncate flex-1">{task.title}</span>
            {task.priority === 'high' && (
              <span className="text-xs text-red-600">!</span>
            )}
          </div>
        ))}
      </div>

      {tasks.length > 4 && (
        <a href="/tasks" className="text-xs text-blue-600 hover:underline mt-2 block">
          View all tasks →
        </a>
      )}
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `npm test CompactTasksWidget`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/CompactTasksWidget.tsx
git add src/atomic-crm/dashboard/__tests__/CompactTasksWidget.test.tsx
git commit -m "feat: add compact tasks widget"
```

---

## Task 6: Wire Up Components in Main Dashboard

**Files:**
- Modify: `src/atomic-crm/dashboard/CompactGridDashboard.tsx`
- Modify: `src/atomic-crm/dashboard/__tests__/CompactGridDashboard.test.tsx`

**Step 1: Update test to verify real components**

Modify `src/atomic-crm/dashboard/__tests__/CompactGridDashboard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { CompactGridDashboard } from '../CompactGridDashboard';

// Mock the individual widgets
jest.mock('../CompactPrincipalTable', () => ({
  CompactPrincipalTable: () => <div>Principal Table</div>
}));
jest.mock('../CompactTasksWidget', () => ({
  CompactTasksWidget: () => <div>Tasks Widget</div>
}));

describe('CompactGridDashboard', () => {
  it('renders all widget components', () => {
    render(<CompactGridDashboard />);

    expect(screen.getByText('Principal Table')).toBeInTheDocument();
    expect(screen.getByText('Tasks Widget')).toBeInTheDocument();
  });

  it('renders with 3-column grid layout', () => {
    const { container } = render(<CompactGridDashboard />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('lg:grid-cols-[40%_30%_30%]');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test CompactGridDashboard`
Expected: FAIL - components not imported

**Step 3: Import and use real components**

Update `src/atomic-crm/dashboard/CompactGridDashboard.tsx`:

```typescript
import React from 'react';
import { CompactDashboardHeader } from './CompactDashboardHeader';
import { CompactPrincipalTable } from './CompactPrincipalTable';
import { CompactTasksWidget } from './CompactTasksWidget';

export const CompactGridDashboard: React.FC = () => {
  // Mock data - in real implementation, fetch from API
  const principals = Array(8).fill(null).map((_, i) => ({
    id: i,
    name: `Principal ${i + 1}`,
    activity: `${i * 2}/${i * 3}`
  }));

  const tasks = Array(6).fill(null).map((_, i) => ({
    id: i,
    title: `Task ${i + 1}`,
    priority: i % 3 === 0 ? 'high' : 'normal' as const
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <CompactDashboardHeader />
      <div className="p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_30%_30%] gap-4">
          {/* Left Column - Principal Table */}
          <div className="bg-white rounded-lg p-3">
            <CompactPrincipalTable data={principals} />
          </div>

          {/* Middle Column - Upcoming & Tasks */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Upcoming Events Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <CompactTasksWidget tasks={tasks} />
            </div>
          </div>

          {/* Right Column - Activity & Pipeline */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Recent Activity Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="h-[180px]">Pipeline Summary Placeholder</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `npm test CompactGridDashboard`
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/CompactGridDashboard.tsx
git add src/atomic-crm/dashboard/__tests__/CompactGridDashboard.test.tsx
git commit -m "feat: wire up compact widgets in dashboard"
```

---

## Task 7: Add Responsive Breakpoints

**Files:**
- Modify: `src/atomic-crm/dashboard/CompactGridDashboard.tsx`

**Step 1: Add responsive grid classes**

Update the grid classes in `CompactGridDashboard.tsx`:

```typescript
// Change this line:
<div className="grid grid-cols-1 lg:grid-cols-[40%_30%_30%] gap-4">

// To this:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_30%_30%] gap-4">
```

**Step 2: Add responsive padding**

Update padding classes:

```typescript
// Change:
<div className="p-3">

// To:
<div className="p-2 md:p-3 lg:p-4">
```

**Step 3: Test responsive behavior**

Run: `npm run dev`
Open browser dev tools, test at:
- 375px (mobile)
- 768px (iPad portrait)
- 1024px (iPad landscape)
- 1440px (desktop)

Expected: Layout adapts at each breakpoint

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/CompactGridDashboard.tsx
git commit -m "feat: add responsive breakpoints to compact dashboard"
```

---

## Task 8: Integration Test for Complete Dashboard

**Files:**
- Create: `tests/e2e/compact-dashboard.spec.ts`

**Step 1: Write E2E test**

Create `tests/e2e/compact-dashboard.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Compact Dashboard Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    // Login if needed
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForSelector('text=Principal Dashboard');
  });

  test('all 5 widgets visible without scrolling at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Check all widgets are visible
    const widgets = [
      'My Principals',
      'Upcoming Events',
      'My Tasks This Week',
      'Recent Activity',
      'Pipeline Summary'
    ];

    for (const widget of widgets) {
      const element = page.getByText(widget);
      await expect(element).toBeVisible();

      // Verify no scrolling needed
      const box = await element.boundingBox();
      expect(box?.y).toBeLessThan(900);
    }
  });

  test('responsive layout at iPad portrait', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Should stack to single column
    const grid = page.locator('.grid').first();
    const classes = await grid.getAttribute('class');
    expect(classes).toContain('grid-cols-1');
  });
});
```

**Step 2: Run E2E test**

Run: `npm run test:e2e compact-dashboard.spec.ts`
Expected: Tests pass

**Step 3: Commit**

```bash
git add tests/e2e/compact-dashboard.spec.ts
git commit -m "test: add E2E tests for compact dashboard layout"
```

---

## Task 9: Replace Current Dashboard

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`
- Modify: `src/atomic-crm/dashboard/index.ts`

**Step 1: Export new dashboard from index**

Modify `src/atomic-crm/dashboard/index.ts`:

```typescript
// Add export
export { CompactGridDashboard } from './CompactGridDashboard';

// Change default export
export { CompactGridDashboard as default } from './CompactGridDashboard';
```

**Step 2: Update CRM.tsx to use new dashboard**

In `src/atomic-crm/root/CRM.tsx`, verify dashboard import uses the new component.

**Step 3: Test full app**

Run: `npm run dev`
Navigate to dashboard
Expected: New compact layout displays

**Step 4: Run all tests**

Run: `npm test`
Expected: All pass

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/index.ts
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat: replace dashboard with compact grid layout"
```

---

## Validation Checklist

- [ ] All widgets visible at 1440x900 without scrolling
- [ ] Principal table shows 5 rows with expander
- [ ] Tasks widget shows 4 priority tasks
- [ ] Header is single line with date
- [ ] Responsive breakpoints work correctly
- [ ] All existing dashboard functionality preserved
- [ ] Tests pass (unit and E2E)

---

## Next Steps

After implementation:
1. Update widget content components with real data fetching
2. Add loading states and error boundaries
3. Implement refresh functionality
4. Add keyboard navigation support
5. Performance optimize with React.memo where needed