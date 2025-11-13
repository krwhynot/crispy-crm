# Principal-Focused Dashboard MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a principal-focused dashboard with opportunity pipeline, task priorities, and quick activity logging

**Architecture:** Desktop-optimized (1440px+ primary target) with three main widgets using React Admin components, Supabase views for data aggregation, semantic spacing utilities from design system. Maintains 44px minimum touch targets across all screen sizes. Mobile-first Tailwind syntax (`lg:` breakpoint) with desktop-first design thinking. Quick 2-3 tap activity logging.

**Tech Stack:** React 19, TypeScript, React Admin, Supabase, Tailwind CSS v4, shadcn/ui

---

## Task 0.5: Define Semantic Spacing Utilities

**Files:**
- Modify: `src/index.css`

**Step 1: Add semantic spacing utilities to Tailwind**

After line 99 (end of spacing CSS variables), add:

```css
@layer utilities {
  /* Vertical Spacing Utilities */
  .space-y-section > * + * {
    margin-top: var(--spacing-section);
  }
  .space-y-widget > * + * {
    margin-top: var(--spacing-widget);
  }
  .space-y-content > * + * {
    margin-top: var(--spacing-content);
  }
  .space-y-compact > * + * {
    margin-top: var(--spacing-compact);
  }

  /* Gap Utilities */
  .gap-section {
    gap: var(--spacing-section);
  }
  .gap-widget {
    gap: var(--spacing-widget);
  }
  .gap-content {
    gap: var(--spacing-content);
  }
  .gap-compact {
    gap: var(--spacing-compact);
  }

  /* Padding Utilities */
  .p-widget {
    padding: var(--spacing-widget-padding);
  }
  .p-content {
    padding: var(--spacing-content);
  }
  .p-compact {
    padding: var(--spacing-compact);
  }
  .px-content {
    padding-left: var(--spacing-content);
    padding-right: var(--spacing-content);
  }
  .py-content {
    padding-top: var(--spacing-content);
    padding-bottom: var(--spacing-content);
  }
  .pl-content {
    padding-left: var(--spacing-content);
  }

  /* Margin Bottom Utilities */
  .mb-section {
    margin-bottom: var(--spacing-section);
  }
  .mb-widget {
    margin-bottom: var(--spacing-widget);
  }
}
```

**Step 2: Verify utilities are available**

```bash
npm run dev
```
Expected: Dev server compiles without errors

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(design-system): Add semantic spacing Tailwind utilities"
```

**Why This Task is Critical:**
All widget components in Tasks 4-7 reference these utilities (`.space-y-section`, `.gap-compact`, `.p-content`, etc.). Without this task, the code will compile but spacing will be broken. This must be completed BEFORE implementing any widgets.

---

## Task 1: Database View for Principal Opportunities

**Files:**
- Create: `supabase/migrations/20251113000001_principal_opportunities_view.sql`

**Step 1: Write the migration file**

```sql
-- supabase/migrations/20251113000001_principal_opportunities_view.sql
CREATE OR REPLACE VIEW principal_opportunities AS
SELECT
  o.id as opportunity_id,
  o.name as opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.updated_at as last_activity,
  o.organization_id,
  org.name as customer_name,
  p.id as principal_id,
  p.name as principal_name,
  -- Calculate days since last activity
  EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 as days_since_activity,
  -- Status indicator based on activity recency
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 7 THEN 'active'
    WHEN EXTRACT(EPOCH FROM (NOW() - o.updated_at)) / 86400 < 14 THEN 'cooling'
    ELSE 'at_risk'
  END as health_status
FROM opportunities o
LEFT JOIN organizations org ON o.organization_id = org.id
LEFT JOIN organizations p ON o.principal_id = p.id
WHERE o.deleted_at IS NULL
  AND o.stage != 'Closed Lost'
  AND p.org_type = 'principal'
ORDER BY p.name, o.stage;

-- Grant access
GRANT SELECT ON principal_opportunities TO authenticated;
```

**Step 2: Run migration locally**

```bash
npx supabase db push
```
Expected: Migration applied successfully

**Step 3: Verify view creation**

```bash
npx supabase db diff
```
Expected: Shows new view `principal_opportunities`

**Step 4: Commit**

```bash
git add supabase/migrations/20251113000001_principal_opportunities_view.sql
git commit -m "feat(db): Add principal_opportunities view for dashboard"
```

---

## Task 2: Database View for Priority Tasks

**Files:**
- Create: `supabase/migrations/20251113000002_priority_tasks_view.sql`

**Step 1: Write the migration file**

```sql
-- supabase/migrations/20251113000002_priority_tasks_view.sql
CREATE OR REPLACE VIEW priority_tasks AS
SELECT
  t.id as task_id,
  t.title,
  t.description,
  t.due_date,
  t.completed,
  t.priority,
  t.type as task_type,
  t.contact_id,
  t.opportunity_id,
  t.sales_id,
  c.name as customer_name,
  p.name as principal_name,
  o.name as opportunity_name,
  -- Calculate if overdue
  CASE
    WHEN t.completed = false AND t.due_date < CURRENT_DATE THEN true
    ELSE false
  END as is_overdue,
  -- Days overdue (negative if not overdue)
  CASE
    WHEN t.completed = false AND t.due_date < CURRENT_DATE
    THEN CURRENT_DATE - t.due_date
    ELSE 0
  END as days_overdue
FROM tasks t
LEFT JOIN contacts c ON t.contact_id = c.id
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations p ON o.principal_id = p.id
WHERE t.deleted_at IS NULL
  AND (t.completed = false OR t.completed_at >= CURRENT_DATE)
ORDER BY
  is_overdue DESC,
  days_overdue DESC,
  t.due_date ASC,
  t.priority DESC;

-- Grant access
GRANT SELECT ON priority_tasks TO authenticated;
```

**Step 2: Run migration**

```bash
npx supabase db push
```
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20251113000002_priority_tasks_view.sql
git commit -m "feat(db): Add priority_tasks view for dashboard"
```

---

## Task 3: Quick Activity Type Definitions

**Files:**
- Create: `src/atomic-crm/dashboard/types.ts`
- Create: `src/atomic-crm/dashboard/__tests__/types.test.ts`

**Step 1: Write the test file**

```typescript
// src/atomic-crm/dashboard/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  PrincipalOpportunity,
  PriorityTask,
  QuickActivity,
  ActivityType
} from '../types';

describe('Dashboard Types', () => {
  it('should have correct PrincipalOpportunity shape', () => {
    const opp: PrincipalOpportunity = {
      opportunity_id: 1,
      opportunity_name: 'Test Opp',
      stage: 'Proposal',
      estimated_close_date: '2025-01-01',
      last_activity: '2025-01-01T00:00:00',
      organization_id: 1,
      customer_name: 'ABC Restaurant',
      principal_id: 2,
      principal_name: 'Principal A',
      days_since_activity: 5,
      health_status: 'active'
    };
    expect(opp.health_status).toBe('active');
  });

  it('should have correct PriorityTask shape', () => {
    const task: PriorityTask = {
      task_id: 1,
      title: 'Call customer',
      description: 'Follow up on order',
      due_date: '2025-01-01',
      completed: false,
      priority: 'high',
      task_type: 'Call',
      customer_name: 'ABC Restaurant',
      principal_name: 'Principal A',
      is_overdue: true,
      days_overdue: 2
    };
    expect(task.is_overdue).toBe(true);
  });

  it('should have correct ActivityType values', () => {
    const types: ActivityType[] = ['visit', 'call', 'email'];
    expect(types).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- types.test.ts
```
Expected: FAIL - types not defined

**Step 3: Write the types file**

```typescript
// src/atomic-crm/dashboard/types.ts

export interface PrincipalOpportunity {
  opportunity_id: number;
  opportunity_name: string;
  stage: string;
  estimated_close_date: string | null;
  last_activity: string;
  organization_id: number;
  customer_name: string;
  principal_id: number;
  principal_name: string;
  days_since_activity: number;
  health_status: 'active' | 'cooling' | 'at_risk';
}

export interface PriorityTask {
  task_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  task_type: string;
  contact_id?: number;
  opportunity_id?: number;
  sales_id?: number;
  customer_name?: string;
  principal_name?: string;
  opportunity_name?: string;
  is_overdue: boolean;
  days_overdue: number;
}

export type ActivityType = 'visit' | 'call' | 'email';

export interface QuickActivity {
  customer_id: number;
  principal_id: number;
  activity_type: ActivityType;
  notes?: string;
  photo_url?: string;
  created_at?: string;
}

export type HealthStatus = 'active' | 'cooling' | 'at_risk';

export interface DashboardFilters {
  principal_id?: number;
  customer_type?: string;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- types.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/types.ts src/atomic-crm/dashboard/__tests__/types.test.ts
git commit -m "feat(dashboard): Add type definitions for dashboard widgets"
```

---

## Task 4: Principal Opportunities Widget Component

**Files:**
- Create: `src/atomic-crm/dashboard/widgets/PrincipalOpportunitiesWidget.tsx`
- Create: `src/atomic-crm/dashboard/widgets/__tests__/PrincipalOpportunitiesWidget.test.tsx`

**Step 1: Write the test**

```tsx
// src/atomic-crm/dashboard/widgets/__tests__/PrincipalOpportunitiesWidget.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrincipalOpportunitiesWidget } from '../PrincipalOpportunitiesWidget';
import { TestWrapper } from '@/test-utils';

vi.mock('react-admin', () => ({
  useGetList: vi.fn(() => ({
    data: [
      {
        opportunity_id: 1,
        opportunity_name: 'Test Opp',
        stage: 'Proposal',
        principal_name: 'Principal A',
        customer_name: 'ABC Restaurant',
        health_status: 'active',
        days_since_activity: 2
      }
    ],
    isLoading: false,
    error: null
  }))
}));

describe('PrincipalOpportunitiesWidget', () => {
  it('should render opportunities grouped by principal', () => {
    render(
      <TestWrapper>
        <PrincipalOpportunitiesWidget />
      </TestWrapper>
    );

    expect(screen.getByText('Opportunities by Principal')).toBeInTheDocument();
    expect(screen.getByText('Principal A')).toBeInTheDocument();
    expect(screen.getByText('ABC Restaurant - Proposal Stage')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- PrincipalOpportunitiesWidget.test.tsx
```
Expected: FAIL - Component not found

**Step 3: Write the component**

```tsx
// src/atomic-crm/dashboard/widgets/PrincipalOpportunitiesWidget.tsx
import React from 'react';
import { useGetList } from 'react-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import type { PrincipalOpportunity } from '../types';

export const PrincipalOpportunitiesWidget: React.FC = () => {
  const { data, isLoading, error } = useGetList<PrincipalOpportunity>('principal_opportunities', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'principal_name', order: 'ASC' }
  });

  // Group opportunities by principal
  const groupedOpps = data?.reduce((acc, opp) => {
    if (!acc[opp.principal_name]) {
      acc[opp.principal_name] = [];
    }
    acc[opp.principal_name].push(opp);
    return acc;
  }, {} as Record<string, PrincipalOpportunity[]>) || {};

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'cooling': return '🟡';
      case 'at_risk': return '🔴';
      default: return '';
    }
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active (touched within 7 days)';
      case 'cooling': return 'Cooling (7-14 days since touch)';
      case 'at_risk': return 'At risk (over 14 days since touch)';
      default: return '';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Opportunities by Principal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-section">
        {isLoading ? (
          <div className="space-y-section">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : error ? (
          <div className="text-destructive">Error loading opportunities</div>
        ) : (
          Object.entries(groupedOpps).map(([principal, opps]) => (
            <div key={principal} className="space-y-compact">
              <div className="font-semibold text-foreground">
                {principal} ({opps.length})
              </div>
              <div className="space-y-compact pl-content">
                {opps.map((opp) => (
                  <div
                    key={opp.opportunity_id}
                    className="flex items-center justify-between min-h-11 p-compact hover:bg-muted rounded cursor-pointer"
                  >
                    <div className="flex items-center gap-compact">
                      <span aria-label={getHealthLabel(opp.health_status)}>
                        {getHealthIcon(opp.health_status)}
                      </span>
                      <span className="text-sm">
                        {opp.customer_name} - {opp.stage} Stage
                      </span>
                      {opp.days_since_activity > 14 && (
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(opp.days_since_activity)} days
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- PrincipalOpportunitiesWidget.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/widgets/PrincipalOpportunitiesWidget.tsx
git add src/atomic-crm/dashboard/widgets/__tests__/PrincipalOpportunitiesWidget.test.tsx
git commit -m "feat(dashboard): Add PrincipalOpportunitiesWidget component"
```

---

## Task 5: Priority Tasks Widget Component

**Files:**
- Create: `src/atomic-crm/dashboard/widgets/PriorityTasksWidget.tsx`
- Create: `src/atomic-crm/dashboard/widgets/__tests__/PriorityTasksWidget.test.tsx`

**Step 1: Write the test**

```tsx
// src/atomic-crm/dashboard/widgets/__tests__/PriorityTasksWidget.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityTasksWidget } from '../PriorityTasksWidget';
import { TestWrapper } from '@/test-utils';

vi.mock('react-admin', () => ({
  useGetList: vi.fn(() => ({
    data: [
      {
        task_id: 1,
        title: 'Visit ABC Restaurant',
        customer_name: 'ABC Restaurant',
        principal_name: 'Principal A',
        description: 'Follow up on tasting',
        is_overdue: true,
        days_overdue: 2,
        completed: false
      },
      {
        task_id: 2,
        title: 'Email DEF Cafe',
        customer_name: 'DEF Cafe',
        principal_name: 'Principal B',
        description: 'Send samples',
        is_overdue: false,
        days_overdue: 0,
        completed: false
      }
    ],
    isLoading: false,
    error: null
  })),
  useUpdate: vi.fn(() => [vi.fn(), { isLoading: false }])
}));

describe('PriorityTasksWidget', () => {
  it('should render tasks with overdue section', () => {
    render(
      <TestWrapper>
        <PriorityTasksWidget />
      </TestWrapper>
    );

    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.getByText('⚠️ OVERDUE (1)')).toBeInTheDocument();
    expect(screen.getByText(/Visit ABC Restaurant/)).toBeInTheDocument();
    expect(screen.getByText(/Follow up on tasting/)).toBeInTheDocument();
    expect(screen.getByText('(2 days late)')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- PriorityTasksWidget.test.tsx
```
Expected: FAIL - Component not found

**Step 3: Write the component**

```tsx
// src/atomic-crm/dashboard/widgets/PriorityTasksWidget.tsx
import React from 'react';
import { useGetList, useUpdate } from 'react-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriorityTask } from '../types';

export const PriorityTasksWidget: React.FC = () => {
  const { data, isLoading, error, refetch } = useGetList<PriorityTask>('priority_tasks', {
    pagination: { page: 1, perPage: 20 },
    filter: { sales_id: localStorage.getItem('sales_id') }
  });

  const [update, { isLoading: isUpdating }] = useUpdate();

  const overdueTasks = data?.filter(t => t.is_overdue) || [];
  const todayTasks = data?.filter(t => !t.is_overdue && !t.completed) || [];
  const completedTasks = data?.filter(t => t.completed) || [];

  const handleTaskToggle = async (task: PriorityTask) => {
    await update('tasks', {
      id: task.task_id,
      data: { completed: !task.completed, completed_at: new Date().toISOString() }
    });
    refetch();
  };

  const formatTaskLine = (task: PriorityTask) => {
    const parts = [];
    if (task.customer_name) parts.push(task.customer_name);
    if (task.principal_name) parts.push(`Principal ${task.principal_name}`);
    if (task.description) parts.push(task.description);
    return parts.join(' - ');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Today's Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-section">
        {isLoading ? (
          <div className="space-y-section">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : error ? (
          <div className="text-destructive">Error loading tasks</div>
        ) : (
          <>
            {/* Overdue Section */}
            {overdueTasks.length > 0 && (
              <div className="space-y-compact">
                <div className="font-semibold text-warning">
                  <span aria-label="Warning: Overdue tasks">⚠️</span> OVERDUE ({overdueTasks.length})
                </div>
                {overdueTasks.map((task) => (
                  <div
                    key={task.task_id}
                    className="flex items-start gap-compact min-h-11 p-compact"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(task)}
                      disabled={isUpdating}
                      className="mt-1 h-5 w-5"
                      aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                    <div className="flex-1">
                      <div className="text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTaskLine(task)}
                        {task.days_overdue > 0 && (
                          <span className="text-warning ml-compact">
                            ({task.days_overdue} days late)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Today Section */}
            {todayTasks.length > 0 && (
              <div className="space-y-compact">
                <div className="font-semibold">TODAY</div>
                {todayTasks.map((task) => (
                  <div
                    key={task.task_id}
                    className="flex items-start gap-compact min-h-11 p-compact"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(task)}
                      disabled={isUpdating}
                      className="mt-1 h-5 w-5"
                      aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                    <div className="flex-1">
                      <div className="text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTaskLine(task)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Section */}
            {completedTasks.length > 0 && (
              <div className="space-y-compact opacity-60">
                {completedTasks.map((task) => (
                  <div
                    key={task.task_id}
                    className="flex items-start gap-compact min-h-11 p-compact"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(task)}
                      disabled={isUpdating}
                      className="mt-1 h-5 w-5"
                      aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                    <div className="flex-1 line-through">
                      <div className="text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTaskLine(task)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- PriorityTasksWidget.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/widgets/PriorityTasksWidget.tsx
git add src/atomic-crm/dashboard/widgets/__tests__/PriorityTasksWidget.test.tsx
git commit -m "feat(dashboard): Add PriorityTasksWidget with overdue handling"
```

---

## Task 6: Quick Activity Logger Widget

**Files:**
- Create: `src/atomic-crm/dashboard/widgets/QuickActivityLogger.tsx`
- Create: `src/atomic-crm/dashboard/widgets/__tests__/QuickActivityLogger.test.tsx`

**Step 1: Write the test**

```tsx
// src/atomic-crm/dashboard/widgets/__tests__/QuickActivityLogger.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActivityLogger } from '../QuickActivityLogger';
import { TestWrapper } from '@/test-utils';

vi.mock('react-admin', () => ({
  useGetList: vi.fn(() => ({
    data: [
      { id: 1, name: 'ABC Restaurant' },
      { id: 2, name: 'Principal A' }
    ],
    isLoading: false
  })),
  useCreate: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useRedirect: vi.fn(() => vi.fn())
}));

describe('QuickActivityLogger', () => {
  it('should render quick log buttons', () => {
    render(
      <TestWrapper>
        <QuickActivityLogger />
      </TestWrapper>
    );

    expect(screen.getByText('Quick Log Activity')).toBeInTheDocument();
    expect(screen.getByText('✓ Visited')).toBeInTheDocument();
    expect(screen.getByText('📞 Called')).toBeInTheDocument();
    expect(screen.getByText('✉️ Emailed')).toBeInTheDocument();
    expect(screen.getByText('+ Full Form')).toBeInTheDocument();
  });

  it('should have customer and principal selects', () => {
    render(
      <TestWrapper>
        <QuickActivityLogger />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Select Customer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Principal')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- QuickActivityLogger.test.tsx
```
Expected: FAIL - Component not found

**Step 3: Write the component**

```tsx
// src/atomic-crm/dashboard/widgets/QuickActivityLogger.tsx
import React, { useState } from 'react';
import { useGetList, useCreate, useRedirect } from 'react-admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Mic } from 'lucide-react';
import type { ActivityType } from '../types';

export const QuickActivityLogger: React.FC = () => {
  const redirect = useRedirect();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');

  const { data: customers, isLoading: loadingCustomers } = useGetList('organizations', {
    pagination: { page: 1, perPage: 100 },
    filter: { org_type: 'customer' },
    sort: { field: 'name', order: 'ASC' }
  });

  const { data: principals, isLoading: loadingPrincipals } = useGetList('organizations', {
    pagination: { page: 1, perPage: 100 },
    filter: { org_type: 'principal' },
    sort: { field: 'name', order: 'ASC' }
  });

  const [create, { isLoading: isSaving }] = useCreate();

  const handleQuickLog = async (activityType: ActivityType) => {
    if (!selectedCustomer || !selectedPrincipal) {
      alert('Please select both customer and principal');
      return;
    }

    await create('activities', {
      data: {
        customer_id: selectedCustomer,
        principal_id: selectedPrincipal,
        activity_type: activityType,
        created_at: new Date().toISOString(),
        sales_id: localStorage.getItem('sales_id')
      }
    });

    // Reset selections
    setSelectedCustomer('');
    setSelectedPrincipal('');
  };

  const handleFullForm = () => {
    const params = new URLSearchParams();
    if (selectedCustomer) params.set('customer_id', selectedCustomer);
    if (selectedPrincipal) params.set('principal_id', selectedPrincipal);
    redirect(`/activities/create?${params.toString()}`);
  };

  return (
    <Card className="sticky bottom-0 z-10 border-t-2">
      <CardContent className="p-content">
        <div className="space-y-compact">
          <div className="font-semibold">Quick Log Activity</div>

          <div className="flex gap-compact">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="flex-1 min-h-11">
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPrincipal} onValueChange={setSelectedPrincipal}>
              <SelectTrigger className="flex-1 min-h-11">
                <SelectValue placeholder="Select Principal" />
              </SelectTrigger>
              <SelectContent>
                {principals?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-compact flex-wrap">
            <Button
              onClick={() => handleQuickLog('visit')}
              disabled={isSaving || !selectedCustomer || !selectedPrincipal}
              className="min-h-11"
              variant="secondary"
            >
              ✓ Visited
            </Button>
            <Button
              onClick={() => handleQuickLog('call')}
              disabled={isSaving || !selectedCustomer || !selectedPrincipal}
              className="min-h-11"
              variant="secondary"
            >
              📞 Called
            </Button>
            <Button
              onClick={() => handleQuickLog('email')}
              disabled={isSaving || !selectedCustomer || !selectedPrincipal}
              className="min-h-11"
              variant="secondary"
            >
              ✉️ Emailed
            </Button>

            <div className="flex-1" />

            <Button
              onClick={handleFullForm}
              className="min-h-11"
              variant="outline"
            >
              + Full Form
            </Button>
            <Button
              className="h-11 w-11 p-0"
              variant="ghost"
              disabled
              aria-label="Add photo (coming soon)"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              className="h-11 w-11 p-0"
              variant="ghost"
              disabled
              aria-label="Add voice note (coming soon)"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- QuickActivityLogger.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/widgets/QuickActivityLogger.tsx
git add src/atomic-crm/dashboard/widgets/__tests__/QuickActivityLogger.test.tsx
git commit -m "feat(dashboard): Add QuickActivityLogger with 2-3 tap logging"
```

---

## Task 7: Main Dashboard Layout Component

**Files:**
- Create: `src/atomic-crm/dashboard/PrincipalDashboard.tsx`
- Create: `src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx`
- Create: `src/atomic-crm/dashboard/widgets/index.ts`

**Step 1: Write widget exports**

```typescript
// src/atomic-crm/dashboard/widgets/index.ts
export { PrincipalOpportunitiesWidget } from './PrincipalOpportunitiesWidget';
export { PriorityTasksWidget } from './PriorityTasksWidget';
export { QuickActivityLogger } from './QuickActivityLogger';
```

**Step 2: Write the test**

```tsx
// src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrincipalDashboard } from '../PrincipalDashboard';
import { TestWrapper } from '@/test-utils';

describe('PrincipalDashboard', () => {
  it('should render all three main widgets', () => {
    render(
      <TestWrapper>
        <PrincipalDashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Opportunities by Principal')).toBeInTheDocument();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.getByText('Quick Log Activity')).toBeInTheDocument();
  });

  it('should have desktop-first responsive grid layout', () => {
    const { container } = render(
      <TestWrapper>
        <PrincipalDashboard />
      </TestWrapper>
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-2');
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npm test -- PrincipalDashboard.test.tsx
```
Expected: FAIL - Component not found

**Step 4: Write the dashboard component**

```tsx
// src/atomic-crm/dashboard/PrincipalDashboard.tsx
import React, { useState } from 'react';
import { Title } from 'react-admin';
import {
  PrincipalOpportunitiesWidget,
  PriorityTasksWidget,
  QuickActivityLogger
} from './widgets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useGetList } from 'react-admin';

export const PrincipalDashboard: React.FC = () => {
  const [principalFilter, setPrincipalFilter] = useState<string>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');

  const { data: principals } = useGetList('organizations', {
    pagination: { page: 1, perPage: 100 },
    filter: { org_type: 'principal' },
    sort: { field: 'name', order: 'ASC' }
  });

  return (
    <div className="p-content lg:p-widget">
      <Title title="Dashboard" />

      {/* Filter Bar */}
      <div className="flex gap-compact mb-section">
        <Select value={principalFilter} onValueChange={setPrincipalFilter}>
          <SelectTrigger className="w-[180px] min-h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Principals</SelectItem>
            {principals?.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
          <SelectTrigger className="w-[180px] min-h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="restaurant">Restaurants</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="View activity history"
        >
          <Clock className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Grid Layout - Desktop: 2 columns, Mobile/Tablet: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section mb-48">
        <PrincipalOpportunitiesWidget />
        <PriorityTasksWidget />
      </div>

      {/* Sticky Quick Logger */}
      <QuickActivityLogger />
    </div>
  );
};

export default PrincipalDashboard;
```

**Step 5: Run test to verify it passes**

```bash
npm test -- PrincipalDashboard.test.tsx
```
Expected: PASS

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/PrincipalDashboard.tsx
git add src/atomic-crm/dashboard/__tests__/PrincipalDashboard.test.tsx
git add src/atomic-crm/dashboard/widgets/index.ts
git commit -m "feat(dashboard): Add main PrincipalDashboard layout with filters"
```

---

## Task 8: Register Dashboard in CRM Routes

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`

**Step 1: Import and add dashboard route**

At line ~50 (after other lazy imports), add:
```typescript
const PrincipalDashboard = React.lazy(() => import('../dashboard/PrincipalDashboard'));
```

At line ~150 (in customRoutes array), add:
```typescript
<Route path="/dashboard" element={<PrincipalDashboard />} />
```

**Step 2: Test the route**

```bash
npm run dev
```
Navigate to: http://localhost:5173/dashboard
Expected: Dashboard displays with three widgets

**Step 3: Commit**

```bash
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat(dashboard): Register PrincipalDashboard route in CRM"
```

---

## Task 9: Add Dashboard to Navigation Menu

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`

**Step 1: Add dashboard menu item**

At line ~180 (in Menu component), add after Dashboard:
```tsx
<Menu.DashboardItem to="/dashboard" primaryText="Principal Dashboard" />
```

**Step 2: Test navigation**

```bash
npm run dev
```
Expected: "Principal Dashboard" appears in sidebar menu

**Step 3: Commit**

```bash
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat(dashboard): Add Principal Dashboard to navigation menu"
```

---

## Task 10: Activity History Component (One-Tap Access)

**Files:**
- Create: `src/atomic-crm/dashboard/dialogs/ActivityHistoryDialog.tsx`
- Create: `src/atomic-crm/dashboard/dialogs/__tests__/ActivityHistoryDialog.test.tsx`

**Step 1: Write the test**

```tsx
// src/atomic-crm/dashboard/dialogs/__tests__/ActivityHistoryDialog.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityHistoryDialog } from '../ActivityHistoryDialog';
import { TestWrapper } from '@/test-utils';

describe('ActivityHistoryDialog', () => {
  it('should render when open', () => {
    render(
      <TestWrapper>
        <ActivityHistoryDialog open={true} onOpenChange={() => {}} />
      </TestWrapper>
    );

    expect(screen.getByText('Recent Activities')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <TestWrapper>
        <ActivityHistoryDialog open={false} onOpenChange={() => {}} />
      </TestWrapper>
    );

    expect(screen.queryByText('Recent Activities')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- ActivityHistoryDialog.test.tsx
```
Expected: FAIL - Component not found

**Step 3: Write the dialog component**

```tsx
// src/atomic-crm/dashboard/dialogs/ActivityHistoryDialog.tsx
import React from 'react';
import { useGetList } from 'react-admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface ActivityHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  principalFilter?: string;
  customerFilter?: string;
}

export const ActivityHistoryDialog: React.FC<ActivityHistoryDialogProps> = ({
  open,
  onOpenChange,
  principalFilter,
  customerFilter
}) => {
  const { data: activities, isLoading } = useGetList('activities', {
    pagination: { page: 1, perPage: 50 },
    sort: { field: 'created_at', order: 'DESC' },
    filter: {
      ...(principalFilter && principalFilter !== 'all' && { principal_id: principalFilter }),
      ...(customerFilter && customerFilter !== 'all' && { customer_id: customerFilter })
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recent Activities</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-compact">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-compact">
              {activities?.map((activity: any) => (
                <div key={activity.id} className="border-b pb-compact">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {activity.activity_type === 'visit' && (
                        <span aria-label="Visited">✓ Visited</span>
                      )}
                      {activity.activity_type === 'call' && (
                        <span aria-label="Called">📞 Called</span>
                      )}
                      {activity.activity_type === 'email' && (
                        <span aria-label="Emailed">✉️ Emailed</span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.customer_name} - {activity.principal_name}
                  </div>
                  {activity.notes && (
                    <div className="text-sm mt-compact">{activity.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
```

**Step 4: Run test to verify it passes**

```bash
npm test -- ActivityHistoryDialog.test.tsx
```
Expected: PASS

**Step 5: Update PrincipalDashboard to use dialog**

Add import at top:
```tsx
import { ActivityHistoryDialog } from './dialogs/ActivityHistoryDialog';
```

Add state:
```tsx
const [showHistory, setShowHistory] = useState(false);
```

Update Clock button onClick:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="min-h-[44px] min-w-[44px]"
  onClick={() => setShowHistory(true)}
>
  <Clock className="h-5 w-5" />
</Button>
```

Add dialog before closing div:
```tsx
<ActivityHistoryDialog
  open={showHistory}
  onOpenChange={setShowHistory}
  principalFilter={principalFilter}
  customerFilter={customerTypeFilter}
/>
```

**Step 6: Commit**

```bash
git add src/atomic-crm/dashboard/dialogs/ActivityHistoryDialog.tsx
git add src/atomic-crm/dashboard/dialogs/__tests__/ActivityHistoryDialog.test.tsx
git add src/atomic-crm/dashboard/PrincipalDashboard.tsx
git commit -m "feat(dashboard): Add ActivityHistoryDialog for one-tap access"
```

---

## Testing Instructions

### Manual Testing Checklist

**CRITICAL:** Test on desktop (1440px+) FIRST, then verify mobile/tablet adaptations.

1. **Database Views**
   - Run `npx supabase db reset` to apply migrations
   - Check Supabase Studio for `principal_opportunities` and `priority_tasks` views
   - Verify data appears correctly

2. **Desktop Display (1440px+ - PRIMARY)**
   - Navigate to `/dashboard`
   - Verify 2-column grid layout (opportunities left, tasks right)
   - Check widgets fill available space
   - Verify opportunities grouped by principal
   - Check overdue tasks appear at top
   - Confirm quick logger is sticky at bottom
   - Verify all spacing uses semantic tokens (no hardcoded pixels)

3. **Touch Targets (All Screen Sizes)**
   - Open browser DevTools → Responsive mode
   - Test Desktop (1440px), Tablet (768px), Mobile (375px)
   - Verify all buttons/checkboxes are 44px minimum (h-11 = 44px)
   - Icon buttons should be h-11 w-11 (44x44px clickable area)
   - Test tap targets work properly across all sizes

4. **Responsive Breakpoints**
   - Desktop (1024px+): 2-column grid, larger padding
   - Tablet/Mobile (<1024px): Stacked layout, compact padding
   - Verify layout adapts smoothly at breakpoint
   - Check no horizontal scroll at any size

5. **Quick Logging**
   - Select customer and principal
   - Tap activity button
   - Verify activity saves (check in Activities list)
   - Confirm selections reset after save
   - Test on desktop and mobile

6. **Filters**
   - Test principal filter
   - Test customer type filter
   - Verify widgets update accordingly
   - Check filters are accessible on mobile

7. **Activity History**
   - Click clock icon
   - Verify recent activities display
   - Check chronological order
   - Verify Skeleton loading states appear

### Automated Testing

```bash
# Run all dashboard tests
npm test -- dashboard

# Run with coverage
npm test -- dashboard --coverage

# Run E2E test (if implemented)
npm run test:e2e -- dashboard.spec.ts
```

### Performance Verification

1. Open Network tab in DevTools
2. Navigate to dashboard
3. Verify:
   - Principal opportunities view loads in < 200ms
   - Priority tasks view loads in < 200ms
   - No N+1 queries (check Supabase logs)

---

## Documentation to Review

- `docs/architecture/design-system.md` - For spacing tokens and color system
- `docs/development/common-tasks.md#adding-resources` - Resource patterns
- `docs/supabase/WORKFLOW.md` - Database migration workflow
- `src/atomic-crm/validation/` - Example validation patterns
- `tailwind.config.ts` - Available semantic utilities

---

## Commit Summary

After completing all tasks, you should have these commits:
1. Database view for principal opportunities
2. Database view for priority tasks
3. Type definitions for dashboard
4. PrincipalOpportunitiesWidget component
5. PriorityTasksWidget with overdue handling
6. QuickActivityLogger with 2-3 tap logging
7. Main PrincipalDashboard layout
8. Dashboard route registration
9. Navigation menu item
10. ActivityHistoryDialog for one-tap access

Total implementation time: ~90-120 minutes for experienced developer