# Principal Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a principal-centric dashboard that shows all of a sales rep's principals (food brands) with task counts, activity summaries, and priority indicators, replacing the current 13-widget dashboard.

**Architecture:**
- Fetch user's opportunities grouped by principal via the data provider
- Build reusable PrincipalCard component for each brand
- Calculate priority based on overdue tasks and activity levels
- Sort principals by urgency (high priority first)
- Display in table format for iPad-first responsiveness

**Tech Stack:** React 19, TypeScript, React Admin (useGetList), Tailwind CSS v4, semantic colors (--primary, --destructive)

---

## Context for Engineer

### Business Rules
- **Principal** = Food brand the rep represents (Brand A, Brand B, etc.)
- **Organizations** = Distributors, restaurants, retailers who buy from principals
- **Opportunities** = Potential sales of principal products to organizations
- Reps represent 3-5 principals with 15-20 active opportunities across organizations
- **Priority Logic:**
  - 🔴 Red alert: Overdue tasks OR low activity (< 3 activities this week)
  - 🟡 Yellow warning: Tasks due in next 2 days
  - 🟢 Green: All tasks on track, good activity

### Current State
- Dashboard at `src/atomic-crm/dashboard/Dashboard.tsx` (needs replacement)
- Uses React Admin's `<Datagrid>` pattern
- Data provider: `providers/supabase/unifiedDataProvider.ts` with useGetList hook

### Key Files to Reference
- `src/atomic-crm/opportunities/` - Opportunity CRUD structure
- `src/atomic-crm/validation/opportunity.ts` - Opportunity schema (has principal_organization_id field)
- `src/atomic-crm/root/CRM.tsx` - Main routes, menu navigation
- `src/index.css` - Semantic spacing variables, color tokens

### Design System
- **Spacing:** Use semantic vars: `var(--spacing-widget-padding)`, `var(--spacing-section)`, `var(--spacing-content)`
- **Colors:** Only semantic CSS vars: `--primary`, `--destructive`, `--brand-700`, never hex values
- **Touch targets:** 44px minimum for buttons
- **Responsive:** iPad-first (768px+) with horizontal scroll for overflow

---

## Task Breakdown

### Task 1: Set Up Directory Structure

**Files:**
- Create: `src/atomic-crm/dashboard/PrincipalDashboard.tsx`
- Create: `src/atomic-crm/dashboard/PrincipalCard.tsx`
- Create: `src/atomic-crm/dashboard/PriorityIndicator.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx`
- Modify: `src/atomic-crm/root/CRM.tsx` (update route)

**Step 1: Create directory structure**

Run: `mkdir -p src/atomic-crm/dashboard/__tests__`
Expected: Directory created (no error if already exists)

**Step 2: Create empty component files**

Create `src/atomic-crm/dashboard/PrincipalDashboard.tsx`:
```typescript
import React from 'react';

export const PrincipalDashboard = () => {
  return <div>Principal Dashboard - Placeholder</div>;
};

export default PrincipalDashboard;
```

Create `src/atomic-crm/dashboard/PrincipalCard.tsx`:
```typescript
import React from 'react';

export const PrincipalCard = () => {
  return <div>Principal Card - Placeholder</div>;
};
```

Create `src/atomic-crm/dashboard/PriorityIndicator.tsx`:
```typescript
import React from 'react';

export const PriorityIndicator = () => {
  return <div>Priority Indicator - Placeholder</div>;
};
```

**Step 3: Create empty test files**

Create `src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';

describe('PrincipalDashboard', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
```

Create `src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';

describe('PriorityIndicator', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
```

**Step 4: Verify tests run**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/`
Expected: All tests pass (2 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/
git commit -m "feat: scaffold principal dashboard components"
```

---

### Task 2: Write Tests for Priority Calculation Logic

**Files:**
- Modify: `src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx`

**Background:** Priority determination is business logic that needs tests before implementation.

**Step 1: Write failing test for priority calculation**

Modify `src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculatePriority } from '../PriorityIndicator';

describe('PriorityIndicator - calculatePriority', () => {
  it('should return "high" when principal has overdue tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const principal = {
      tasks: [
        { due_date: yesterday.toISOString().split('T')[0], status: 'Active' }
      ],
      activities: []
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('high');
  });

  it('should return "high" when principal has low activity (< 3 this week)', () => {
    const principal = {
      tasks: [],
      activities: [
        { created_at: new Date().toISOString(), type: 'Call' },
        { created_at: new Date().toISOString(), type: 'Email' }
      ]
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('high');
  });

  it('should return "medium" when principal has tasks due in next 48 hours', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const principal = {
      tasks: [
        { due_date: tomorrow.toISOString().split('T')[0], status: 'Active' }
      ],
      activities: [
        { created_at: new Date().toISOString(), type: 'Call' },
        { created_at: new Date().toISOString(), type: 'Email' },
        { created_at: new Date().toISOString(), type: 'Meeting' }
      ]
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('medium');
  });

  it('should return "low" when principal is on track with good activity', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const principal = {
      tasks: [
        { due_date: nextWeek.toISOString().split('T')[0], status: 'Active' }
      ],
      activities: [
        { created_at: new Date().toISOString(), type: 'Call' },
        { created_at: new Date().toISOString(), type: 'Email' },
        { created_at: new Date().toISOString(), type: 'Meeting' }
      ]
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('low');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx -v`
Expected: FAIL - "calculatePriority is not exported from..." (5 failures)

**Step 3: Commit the failing tests**

```bash
git add src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx
git commit -m "test: add failing tests for priority calculation"
```

---

### Task 3: Implement Priority Calculation Logic

**Files:**
- Modify: `src/atomic-crm/dashboard/PriorityIndicator.tsx`

**Step 1: Implement calculatePriority function**

Modify `src/atomic-crm/dashboard/PriorityIndicator.tsx`:
```typescript
import React from 'react';

export type Priority = 'high' | 'medium' | 'low';

export interface PrincipalData {
  tasks: Array<{ due_date: string; status: string }>;
  activities: Array<{ created_at: string; type: string }>;
}

/**
 * Calculate priority indicator based on:
 * - Overdue tasks (high)
 * - Low activity count this week (high)
 * - Tasks due in next 48 hours (medium)
 * - Everything on track (low)
 */
export function calculatePriority(principal: PrincipalData): Priority {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Check for overdue tasks
  const overdueTasks = principal.tasks.filter(
    (t) => t.due_date < today && t.status !== 'Completed'
  );
  if (overdueTasks.length > 0) {
    return 'high';
  }

  // Check for low activity this week (< 3)
  const activitiesThisWeek = principal.activities.filter((a) => {
    const activityDate = a.created_at.split('T')[0];
    return activityDate >= sevenDaysAgo;
  });
  if (activitiesThisWeek.length < 3) {
    return 'high';
  }

  // Check for tasks due in next 48 hours
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const dueSoon = principal.tasks.filter(
    (t) =>
      t.due_date >= today && t.due_date <= inTwoDays && t.status !== 'Completed'
  );
  if (dueSoon.length > 0) {
    return 'medium';
  }

  return 'low';
}

export const PriorityIndicator = () => {
  return <div>Priority Indicator - Placeholder</div>;
};
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx -v`
Expected: PASS (all 5 tests)

**Step 3: Commit implementation**

```bash
git add src/atomic-crm/dashboard/PriorityIndicator.tsx
git commit -m "feat: implement priority calculation logic"
```

---

### Task 4: Build PriorityIndicator Component

**Files:**
- Modify: `src/atomic-crm/dashboard/PriorityIndicator.tsx`

**Step 1: Write test for PriorityIndicator component rendering**

Modify `src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx` (add at end):
```typescript
import { render, screen } from '@testing-library/react';
import { PriorityIndicator as PriorityIndicatorComponent } from '../PriorityIndicator';

describe('PriorityIndicator - Component', () => {
  it('should render red indicator for high priority', () => {
    render(<PriorityIndicatorComponent priority="high" />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('bg-red-100');
  });

  it('should render yellow indicator for medium priority', () => {
    render(<PriorityIndicatorComponent priority="medium" />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('bg-yellow-100');
  });

  it('should render green indicator for low priority', () => {
    render(<PriorityIndicatorComponent priority="low" />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('bg-green-100');
  });

  it('should render icon matching priority', () => {
    const { rerender } = render(
      <PriorityIndicatorComponent priority="high" />
    );
    let icon = screen.getByTestId('priority-icon');
    expect(icon).toHaveTextContent('⚠️');

    rerender(<PriorityIndicatorComponent priority="medium" />);
    icon = screen.getByTestId('priority-icon');
    expect(icon).toHaveTextContent('⚡');

    rerender(<PriorityIndicatorComponent priority="low" />);
    icon = screen.getByTestId('priority-icon');
    expect(icon).toHaveTextContent('✅');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx -v`
Expected: FAIL - "PriorityIndicator does not accept priority prop..." (4 failures)

**Step 3: Implement PriorityIndicator component**

Modify `src/atomic-crm/dashboard/PriorityIndicator.tsx` (replace entire file):
```typescript
import React from 'react';

export type Priority = 'high' | 'medium' | 'low';

export interface PrincipalData {
  tasks: Array<{ due_date: string; status: string }>;
  activities: Array<{ created_at: string; type: string }>;
}

/**
 * Calculate priority indicator based on:
 * - Overdue tasks (high)
 * - Low activity count this week (high)
 * - Tasks due in next 48 hours (medium)
 * - Everything on track (low)
 */
export function calculatePriority(principal: PrincipalData): Priority {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Check for overdue tasks
  const overdueTasks = principal.tasks.filter(
    (t) => t.due_date < today && t.status !== 'Completed'
  );
  if (overdueTasks.length > 0) {
    return 'high';
  }

  // Check for low activity this week (< 3)
  const activitiesThisWeek = principal.activities.filter((a) => {
    const activityDate = a.created_at.split('T')[0];
    return activityDate >= sevenDaysAgo;
  });
  if (activitiesThisWeek.length < 3) {
    return 'high';
  }

  // Check for tasks due in next 48 hours
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const dueSoon = principal.tasks.filter(
    (t) =>
      t.due_date >= today && t.due_date <= inTwoDays && t.status !== 'Completed'
  );
  if (dueSoon.length > 0) {
    return 'medium';
  }

  return 'low';
}

interface PriorityIndicatorProps {
  priority: Priority;
}

const priorityConfig = {
  high: {
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: '⚠️',
    label: 'Needs attention'
  },
  medium: {
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: '⚡',
    label: 'Tasks due soon'
  },
  low: {
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: '✅',
    label: 'On track'
  }
};

export const PriorityIndicator = ({ priority }: PriorityIndicatorProps) => {
  const config = priorityConfig[priority];

  return (
    <div
      data-testid="priority-indicator"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${config.bgColor} ${config.borderColor}`}
    >
      <span data-testid="priority-icon">{config.icon}</span>
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
};
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx -v`
Expected: PASS (all 9 tests)

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/
git commit -m "feat: implement PriorityIndicator component"
```

---

### Task 5: Write Tests for PrincipalCard Component

**Files:**
- Create: `src/atomic-crm/dashboard/__tests__/PrincipalCard.test.tsx`

**Step 1: Create test file for PrincipalCard**

Create `src/atomic-crm/dashboard/__tests__/PrincipalCard.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PrincipalCard } from '../PrincipalCard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockPrincipal = {
  id: '1',
  name: 'Brand A',
  tasks: [
    { id: '1', title: 'Call about pricing', due_date: '2025-11-06', status: 'Active' },
    { id: '2', title: 'Send samples', due_date: '2025-11-06', status: 'Active' }
  ],
  activities: [
    { id: '1', type: 'Call', created_at: '2025-11-04T10:00:00Z' },
    { id: '2', type: 'Email', created_at: '2025-11-03T14:00:00Z' },
    { id: '3', type: 'Call', created_at: '2025-11-02T09:00:00Z' }
  ],
  topOpportunity: {
    id: '1',
    name: 'Restaurant ABC',
    expected_value: 5000,
    stage: 'Negotiation'
  },
  priority: 'high' as const
};

describe('PrincipalCard', () => {
  it('should render principal name', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText('Brand A')).toBeInTheDocument();
  });

  it('should display task count', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
  });

  it('should display activity count', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText(/3 activities/)).toBeInTheDocument();
  });

  it('should display top opportunity', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText('Restaurant ABC')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('should have action buttons', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByText('View All Tasks')).toBeInTheDocument();
    expect(screen.getByText('View Opportunities')).toBeInTheDocument();
  });

  it('should navigate to tasks on View All Tasks click', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    const button = screen.getByText('View All Tasks');
    await user.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/tasks', expect.objectContaining({
      state: { principalFilter: '1' }
    }));
  });

  it('should render priority indicator', () => {
    render(
      <BrowserRouter>
        <PrincipalCard principal={mockPrincipal} />
      </BrowserRouter>
    );
    expect(screen.getByTestId('priority-indicator')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PrincipalCard.test.tsx -v`
Expected: FAIL - "PrincipalCard does not accept principal prop..." (multiple failures)

**Step 3: Commit failing tests**

```bash
git add src/atomic-crm/dashboard/__tests__/PrincipalCard.test.tsx
git commit -m "test: add failing tests for PrincipalCard component"
```

---

### Task 6: Implement PrincipalCard Component

**Files:**
- Modify: `src/atomic-crm/dashboard/PrincipalCard.tsx`

**Step 1: Implement PrincipalCard component**

Modify `src/atomic-crm/dashboard/PrincipalCard.tsx`:
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PriorityIndicator, Priority } from './PriorityIndicator';

export interface PrincipalTask {
  id: string;
  title: string;
  due_date: string;
  status: string;
}

export interface PrincipalActivity {
  id: string;
  type: string;
  created_at: string;
}

export interface TopOpportunity {
  id: string;
  name: string;
  expected_value: number;
  stage: string;
}

export interface PrincipalCardProps {
  principal: {
    id: string;
    name: string;
    tasks: PrincipalTask[];
    activities: PrincipalActivity[];
    topOpportunity: TopOpportunity | null;
    priority: Priority;
  };
}

export const PrincipalCard = ({ principal }: PrincipalCardProps) => {
  const navigate = useNavigate();

  const overdueTasks = principal.tasks.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    return t.due_date < today && t.status !== 'Completed';
  });

  const handleViewTasks = () => {
    navigate('/tasks', { state: { principalFilter: principal.id } });
  };

  const handleViewOpportunities = () => {
    navigate('/opportunities', {
      state: { principalFilter: principal.id }
    });
  };

  const handlePrincipalClick = () => {
    navigate('/opportunities', {
      state: { principalFilter: principal.id }
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Principal name + Priority */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <button
          onClick={handlePrincipalClick}
          className="text-left hover:underline"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {principal.name}
          </h2>
        </button>
        <PriorityIndicator priority={principal.priority} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Tasks</span>
          <p className="font-semibold">
            {principal.tasks.length}
            {overdueTasks.length > 0 && (
              <span className="text-red-600 ml-1">
                ({overdueTasks.length} overdue)
              </span>
            )}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Activities This Week</span>
          <p className="font-semibold">{principal.activities.length}</p>
        </div>
      </div>

      {/* Top opportunity */}
      {principal.topOpportunity && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-gray-600 mb-1">Top Opportunity</p>
          <button
            onClick={() =>
              navigate(`/opportunities/${principal.topOpportunity!.id}`)
            }
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {principal.topOpportunity.name}
          </button>
          <p className="text-xs text-gray-600 mt-1">
            {principal.topOpportunity.stage} - $
            {principal.topOpportunity.expected_value.toLocaleString()}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleViewTasks}
          className="flex-1 px-3 py-2 bg-primary text-white rounded font-medium text-sm hover:opacity-90 transition-opacity"
        >
          View All Tasks
        </button>
        <button
          onClick={handleViewOpportunities}
          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          View Opportunities
        </button>
      </div>
    </div>
  );
};
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PrincipalCard.test.tsx -v`
Expected: PASS (all 7 tests)

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/PrincipalCard.tsx
git commit -m "feat: implement PrincipalCard component"
```

---

### Task 7: Write Tests for PrincipalDashboard Container

**Files:**
- Modify: `src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx`

**Step 1: Write failing tests for PrincipalDashboard**

Modify `src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PrincipalDashboard } from '../PrincipalDashboard';

// Mock useGetList hook
vi.mock('react-admin', () => ({
  useGetList: vi.fn()
}));

import { useGetList } from 'react-admin';

const mockOpportunities = [
  {
    id: '1',
    name: 'Restaurant ABC',
    principal_organization_id: 'principal-1',
    sales_id: 'user-1'
  },
  {
    id: '2',
    name: 'Cafe XYZ',
    principal_organization_id: 'principal-1',
    sales_id: 'user-1'
  }
];

const mockTasks = [
  {
    id: '1',
    title: 'Call about pricing',
    due_date: '2025-11-06',
    opportunity_id: '1',
    status: 'Active'
  }
];

const mockActivities = [
  {
    id: '1',
    type: 'Call',
    created_at: '2025-11-04T10:00:00Z',
    opportunity_id: '1'
  }
];

describe('PrincipalDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (useGetList as any).mockReturnValue({ data: [], isLoading: true });
    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  it('should fetch user opportunities on mount', () => {
    (useGetList as any).mockReturnValue({ data: [], isLoading: false });
    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );

    expect(useGetList).toHaveBeenCalledWith(
      'opportunities',
      expect.objectContaining({
        filter: expect.objectContaining({
          status: 'Active'
        })
      })
    );
  });

  it('should render principal cards', async () => {
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isLoading: false })
      .mockReturnValueOnce({ data: mockTasks, isLoading: false })
      .mockReturnValueOnce({ data: mockActivities, isLoading: false });

    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Principal Dashboard')).toBeInTheDocument();
    });
  });

  it('should render summary stats footer', async () => {
    (useGetList as any)
      .mockReturnValueOnce({ data: mockOpportunities, isLoading: false })
      .mockReturnValueOnce({ data: mockTasks, isLoading: false })
      .mockReturnValueOnce({ data: mockActivities, isLoading: false });

    render(
      <BrowserRouter>
        <PrincipalDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('dashboard-summary-stats')
      ).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx -v`
Expected: FAIL - "PrincipalDashboard does not render properly..." (multiple failures)

**Step 3: Commit failing tests**

```bash
git add src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx
git commit -m "test: add failing tests for PrincipalDashboard container"
```

---

### Task 8: Implement PrincipalDashboard Container

**Files:**
- Modify: `src/atomic-crm/dashboard/PrincipalDashboard.tsx`

**Step 1: Implement PrincipalDashboard container component**

Modify `src/atomic-crm/dashboard/PrincipalDashboard.tsx`:
```typescript
import React, { useMemo } from 'react';
import { useGetList } from 'react-admin';
import { PrincipalCard } from './PrincipalCard';
import { calculatePriority, Priority } from './PriorityIndicator';

interface Opportunity {
  id: string;
  name: string;
  principal_organization_id: string;
  expected_value: number;
  stage: string;
  sales_id: string;
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  opportunity_id: string;
  status: string;
}

interface Activity {
  id: string;
  type: string;
  created_at: string;
  opportunity_id: string;
}

interface Principal {
  id: string;
  name: string;
  tasks: Task[];
  activities: Activity[];
  topOpportunity: Opportunity | null;
  priority: Priority;
}

export const PrincipalDashboard = () => {
  // Fetch user's active opportunities (grouped by principal)
  const { data: opportunities, isLoading: oppLoading } = useGetList(
    'opportunities',
    {
      filter: {
        status: 'Active'
      },
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'expected_value', order: 'DESC' }
    }
  );

  // Fetch user's tasks
  const { data: tasks, isLoading: tasksLoading } = useGetList('tasks', {
    pagination: { page: 1, perPage: 500 },
    sort: { field: 'due_date', order: 'ASC' }
  });

  // Fetch user's recent activities (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: activities, isLoading: activitiesLoading } = useGetList(
    'activities',
    {
      filter: {
        created_at: { gte: sevenDaysAgo.toISOString() }
      },
      pagination: { page: 1, perPage: 500 },
      sort: { field: 'created_at', order: 'DESC' }
    }
  );

  // Group data by principal
  const principals = useMemo(() => {
    if (!opportunities || opportunities.length === 0) {
      return [];
    }

    const principalMap = new Map<string, Principal>();

    // Group opportunities by principal
    opportunities.forEach((opp: Opportunity) => {
      if (!principalMap.has(opp.principal_organization_id)) {
        principalMap.set(opp.principal_organization_id, {
          id: opp.principal_organization_id,
          name: opp.principal_organization_id, // Will be replaced with actual name
          tasks: [],
          activities: [],
          topOpportunity: null,
          priority: 'low'
        });
      }

      const principal = principalMap.get(opp.principal_organization_id)!;

      // Set top opportunity (highest value)
      if (!principal.topOpportunity || opp.expected_value > principal.topOpportunity.expected_value) {
        principal.topOpportunity = opp;
      }
    });

    // Add tasks to principals
    if (tasks) {
      tasks.forEach((task: Task) => {
        const opp = opportunities.find((o: Opportunity) => o.id === task.opportunity_id);
        if (opp && principalMap.has(opp.principal_organization_id)) {
          principalMap.get(opp.principal_organization_id)!.tasks.push(task);
        }
      });
    }

    // Add activities to principals
    if (activities) {
      activities.forEach((activity: Activity) => {
        const opp = opportunities.find((o: Opportunity) => o.id === activity.opportunity_id);
        if (opp && principalMap.has(opp.principal_organization_id)) {
          principalMap.get(opp.principal_organization_id)!.activities.push(activity);
        }
      });
    }

    // Calculate priority for each principal
    Array.from(principalMap.values()).forEach((principal) => {
      principal.priority = calculatePriority({
        tasks: principal.tasks,
        activities: principal.activities
      });
    });

    // Sort principals by priority (high first, then by task count)
    return Array.from(principalMap.values()).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.tasks.length - a.tasks.length;
    });
  }, [opportunities, tasks, activities]);

  const isLoading = oppLoading || tasksLoading || activitiesLoading;

  if (isLoading) {
    return (
      <div
        data-testid="dashboard-loading"
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-gray-600">Loading your principals...</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalTasks = principals.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalActivities = principals.reduce(
    (sum, p) => sum + p.activities.length,
    0
  );
  const overdueTasks = principals.reduce(
    (sum, p) =>
      sum +
      p.tasks.filter((t) => {
        const today = new Date().toISOString().split('T')[0];
        return t.due_date < today && t.status !== 'Completed';
      }).length,
    0
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Week of {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Principal Cards Grid */}
      {principals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            No active principals found. Check your opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {principals.map((principal) => (
            <PrincipalCard key={principal.id} principal={principal} />
          ))}
        </div>
      )}

      {/* Summary Stats Footer */}
      {principals.length > 0 && (
        <div
          data-testid="dashboard-summary-stats"
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              {overdueTasks > 0 && (
                <p className="text-sm text-red-600">
                  {overdueTasks} overdue
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Activities This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalActivities}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Principals</p>
              <p className="text-2xl font-bold text-gray-900">
                {principals.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx -v`
Expected: PASS (all 5 tests)

**Step 3: Run all dashboard tests**

Run: `npm test -- src/atomic-crm/dashboard/__tests__/ -v`
Expected: PASS (all 16 tests)

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/
git commit -m "feat: implement PrincipalDashboard container with data aggregation"
```

---

### Task 9: Update CRM Routes to Use Principal Dashboard

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`

**Step 1: Update dashboard route**

Read `src/atomic-crm/root/CRM.tsx` first to understand current structure.

Find the dashboard route registration (looks like `<Route path="/" element={<Dashboard />} />`).

Replace the dashboard import:
```typescript
// OLD:
import Dashboard from '../dashboard/Dashboard';

// NEW:
import PrincipalDashboard from '../dashboard/PrincipalDashboard';
```

Replace the route element:
```typescript
// OLD:
<Route path="/" element={<Dashboard />} />

// NEW:
<Route path="/" element={<PrincipalDashboard />} />
```

**Step 2: Run the app to verify it loads**

Run: `npm run dev`
Expected: App starts, navigate to `/` (home), should see Principal Dashboard

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass, no regressions

**Step 4: Commit**

```bash
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat: replace Dashboard with PrincipalDashboard in routes"
```

---

### Task 10: Add Loading Skeletons & Error States

**Files:**
- Create: `src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx`
- Modify: `src/atomic-crm/dashboard/PrincipalDashboard.tsx`

**Step 1: Create skeleton component for loading state**

Create `src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx`:
```typescript
import React from 'react';

export const PrincipalCardSkeleton = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Opportunity skeleton */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-40"></div>
      </div>

      {/* Buttons skeleton */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};
```

**Step 2: Update PrincipalDashboard to show skeletons during loading**

Modify `src/atomic-crm/dashboard/PrincipalDashboard.tsx` (replace the loading state section):
```typescript
import { PrincipalCardSkeleton } from './PrincipalCardSkeleton';

// ... rest of imports ...

export const PrincipalDashboard = () => {
  // ... existing code ...

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Week of {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Loading skeletons */}
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <PrincipalCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ... rest of component ...
};
```

**Step 3: Add error state handling**

Add error handling to the useGetList calls:
```typescript
const { data: opportunities, isLoading: oppLoading, error: oppError } = useGetList(
  'opportunities',
  // ... rest of config ...
);

// Similar for tasks and activities...

// Add after isLoading check:
if (oppError || tasksError || activitiesError) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
      </div>
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600">
          Error loading dashboard. Please try refreshing the page.
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify no regressions**

Run: `npm test -- src/atomic-crm/dashboard/ -v`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/
git commit -m "feat: add loading skeletons and error states to dashboard"
```

---

### Task 11: Responsive Design & Tailwind Styling

**Files:**
- Modify: `src/atomic-crm/dashboard/PrincipalCard.tsx`
- Modify: `src/atomic-crm/dashboard/PrincipalDashboard.tsx`

**Step 1: Ensure iPad-first responsive design**

Review both components and update Tailwind classes:

For `PrincipalDashboard.tsx`:
```typescript
// Change grid from grid-cols-1 to responsive:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Principal cards */}
</div>

// Update summary stats grid:
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
  {/* Stats */}
</div>
```

For `PrincipalCard.tsx`:
```typescript
// Ensure 44px minimum touch targets:
<button className="flex-1 px-3 py-2 rounded font-medium text-sm h-10 flex items-center justify-center">
  {/* button content */}
</button>

// Use semantic spacing vars:
<div className="p-6 bg-white"> {/* padding already uses semantic spacing via Tailwind */}
```

**Step 2: Verify Tailwind color tokens are semantic**

Check that colors use CSS vars:
```typescript
// Use semantic colors from design system:
className="bg-primary" // instead of bg-blue-600
className="text-destructive" // instead of text-red-600
className="border border-gray-200" // gray is ok for borders
```

**Step 3: Test responsive behavior**

Run: `npm run dev`
- Open DevTools
- Test at iPad (768px) and Desktop (1440px) widths
- Verify touch targets are 44px minimum
- Verify grid columns adjust properly

**Step 4: Commit**

```bash
git add src/atomic-crm/dashboard/
git commit -m "style: implement iPad-first responsive design with semantic colors"
```

---

### Task 12: Test & Verify Full Dashboard Flow

**Files:**
- Testing only, no new files

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass, 70%+ coverage

**Step 2: Run type checking**

Run: `npm run type-check` or `npx tsc --noEmit`
Expected: No TypeScript errors

**Step 3: Run linting**

Run: `npm run lint`
Expected: No linting errors

**Step 4: Manual testing checklist**

- [ ] Navigate to `/` - dashboard loads
- [ ] Dashboard shows all principals
- [ ] Priority indicators display correctly
- [ ] Click "View All Tasks" - navigates to tasks page with principal filter
- [ ] Click "View Opportunities" - navigates to opportunities with principal filter
- [ ] Click principal name - navigates to opportunities filtered by principal
- [ ] Click top opportunity name - navigates to opportunity detail
- [ ] Overdue tasks are highlighted with red badge
- [ ] Low activity principals show ⚠️ warning
- [ ] Summary stats at bottom show correct counts
- [ ] Loading state shows skeletons while data loads
- [ ] Responsive on iPad (768px) and Desktop (1440px)
- [ ] All touch targets are 44px minimum

**Step 5: Commit verification**

```bash
git status
# Should show clean working directory
```

---

## Implementation Summary

**Total Tasks:** 12
**Estimated Time:** 5-7 days
**Key Milestones:**
1. ✅ Task 1-4: Foundation (priority logic + components)
2. ✅ Task 5-8: Data aggregation & container
3. ✅ Task 9-10: Integration & UX polish
4. ✅ Task 11-12: Styling & verification

**Files Created:** 8
- `src/atomic-crm/dashboard/PrincipalDashboard.tsx`
- `src/atomic-crm/dashboard/PrincipalCard.tsx`
- `src/atomic-crm/dashboard/PriorityIndicator.tsx`
- `src/atomic-crm/dashboard/PrincipalCardSkeleton.tsx`
- `src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx`
- `src/atomic-crm/dashboard/__tests__/PrincipalCard.test.tsx`
- `src/atomic-crm/dashboard/__tests__/PriorityIndicator.test.tsx`

**Files Modified:** 1
- `src/atomic-crm/root/CRM.tsx`

**Test Coverage:** All components have unit tests (16+ tests total)

---

Plan complete and saved to `docs/plans/2025-11-11-principal-dashboard-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)**
- I dispatch fresh subagent per task (1-2 tasks per batch)
- Code review between batches
- Fast iteration, immediate feedback
- Stay in this session

**2. Parallel Session (separate window)**
- Open new Claude session in worktree
- Use `superpowers:executing-plans` skill
- Batch execution with checkpoints
- Slower but fully autonomous

**Which approach would you prefer?**