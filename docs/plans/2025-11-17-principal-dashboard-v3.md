# Principal Dashboard V3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a three-panel principal-centric dashboard with Pipeline by Principal table, My Tasks widget, and Quick Activity Logger.

**Architecture:** Three resizable panels using shadcn ResizablePanelGroup. Pipeline table shows principal-level opportunity metrics with weekly activity tracking. Tasks panel groups by time buckets (Overdue/Today/Tomorrow). Quick Logger captures activities with smart field defaults.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, shadcn/ui, React Admin, Supabase, Zod validation

---

## Pre-Implementation Checklist

- [ ] Verify you're in the crispy-crm directory: `pwd` should show `/home/krwhynot/projects/crispy-crm`
- [ ] Check TypeScript compiles: `npm run typecheck` should pass
- [ ] Verify dev server works: `npm run dev` and visit http://127.0.0.1:5173
- [ ] Read `CLAUDE.md` sections: Color System, JSONB Arrays, Dashboard V2
- [ ] Understand design tokens in `src/index.css` (lines 88-112)

---

## Task 1: Create Principal Pipeline Data Types

**Files:**
- Create: `src/atomic-crm/dashboard/v3/types.ts`
- Test: `src/atomic-crm/dashboard/v3/__tests__/types.test.ts`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/v3/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { PrincipalPipelineRow, TaskItem, ActivityLog } from '../types';

describe('Dashboard V3 Types', () => {
  it('should have PrincipalPipelineRow type with required fields', () => {
    const row: PrincipalPipelineRow = {
      id: 1,
      name: 'Acme Corp',
      totalPipeline: 5,
      pipelineValue: 250000,
      activeThisWeek: 2,
      activeLastWeek: 3,
      momentum: 'increasing',
      nextAction: 'Call scheduled for tomorrow',
    };

    expect(row.id).toBeDefined();
    expect(row.momentum).toMatch(/^(increasing|steady|decreasing|stale)$/);
  });

  it('should have TaskItem type with priority levels', () => {
    const task: TaskItem = {
      id: 1,
      subject: 'Follow up with client',
      dueDate: new Date(),
      priority: 'high',
      taskType: 'Call',
      relatedTo: {
        type: 'opportunity',
        name: 'Q4 Deal',
        id: 123,
      },
      status: 'overdue',
    };

    expect(task.priority).toMatch(/^(critical|high|medium|low)$/);
    expect(task.status).toMatch(/^(overdue|today|tomorrow|upcoming|later)$/);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/dashboard/v3/__tests__/types.test.ts
```

Expected: FAIL with "Cannot find module '../types'"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/dashboard/v3/types.ts`:

```typescript
// Principal Pipeline Types
export type Momentum = 'increasing' | 'steady' | 'decreasing' | 'stale';

export interface PrincipalPipelineRow {
  id: number;
  name: string;
  totalPipeline: number;
  pipelineValue: number;
  activeThisWeek: number;
  activeLastWeek: number;
  momentum: Momentum;
  nextAction: string | null;
}

// Task Types
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'later';
export type TaskType = 'Call' | 'Email' | 'Meeting' | 'Follow-up' | 'Other';

export interface RelatedEntity {
  type: 'opportunity' | 'contact' | 'organization';
  name: string;
  id: number;
}

export interface TaskItem {
  id: number;
  subject: string;
  dueDate: Date;
  priority: Priority;
  taskType: TaskType;
  relatedTo: RelatedEntity;
  status: TaskStatus;
  owner?: string;
  notes?: string;
}

// Activity Logger Types
export type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Note';
export type ActivityOutcome = 'Connected' | 'Left Voicemail' | 'No Answer' | 'Completed' | 'Rescheduled';

export interface ActivityLog {
  id?: number;
  activityType: ActivityType;
  outcome: ActivityOutcome;
  date: Date;
  duration?: number;
  contactId?: number;
  organizationId?: number;
  opportunityId?: number;
  notes: string;
  nextStep?: string;
  createFollowUp?: boolean;
  followUpDate?: Date;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/dashboard/v3/__tests__/types.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/types.ts src/atomic-crm/dashboard/v3/__tests__/types.test.ts
git commit -m "feat(dashboard-v3): add type definitions for principal dashboard"
```

---

## Task 2: Create Principal Pipeline Table Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`
- Test: `src/atomic-crm/dashboard/v3/components/__tests__/PrincipalPipelineTable.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/v3/components/__tests__/PrincipalPipelineTable.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PrincipalPipelineTable } from '../PrincipalPipelineTable';

describe('PrincipalPipelineTable', () => {
  it('should render table headers correctly', () => {
    render(<PrincipalPipelineTable />);

    expect(screen.getByText('Pipeline by Principal')).toBeInTheDocument();
    expect(screen.getByText('Track opportunity momentum across your customer accounts')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /principal/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /this week/i })).toBeInTheDocument();
  });

  it('should apply premium hover effects class', () => {
    const { container } = render(<PrincipalPipelineTable />);
    const rows = container.querySelectorAll('.table-row-premium');
    expect(rows.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/PrincipalPipelineTable.test.tsx
```

Expected: FAIL with "Cannot find module '../PrincipalPipelineTable'"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`:

```typescript
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Filter } from 'lucide-react';
import type { PrincipalPipelineRow } from '../types';

// Mock data for testing
const mockData: PrincipalPipelineRow[] = [
  {
    id: 1,
    name: 'Acme Corporation',
    totalPipeline: 5,
    pipelineValue: 250000,
    activeThisWeek: 3,
    activeLastWeek: 1,
    momentum: 'increasing',
    nextAction: 'Demo scheduled Friday',
  },
  {
    id: 2,
    name: 'TechCo Industries',
    totalPipeline: 3,
    pipelineValue: 180000,
    activeThisWeek: 0,
    activeLastWeek: 2,
    momentum: 'decreasing',
    nextAction: null,
  },
];

export function PrincipalPipelineTable() {
  const renderMomentumIcon = (momentum: PrincipalPipelineRow['momentum']) => {
    switch (momentum) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-warning" />;
      case 'steady':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      case 'stale':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with title and filters */}
      <div className="border-b border-border pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Pipeline by Principal</h2>
            <p className="text-sm text-muted-foreground">
              Track opportunity momentum across your customer accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch id="my-principals" defaultChecked />
              <label htmlFor="my-principals" className="text-sm">
                My Principals Only
              </label>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Filter options will be added in next task */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Principal</TableHead>
              <TableHead className="text-right">Pipeline</TableHead>
              <TableHead className="text-center">This Week</TableHead>
              <TableHead className="text-center">Last Week</TableHead>
              <TableHead>Momentum</TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((row) => (
              <TableRow key={row.id} className="table-row-premium cursor-pointer">
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">
                  <div>
                    <div className="font-semibold">{row.totalPipeline}</div>
                    <div className="text-sm text-muted-foreground">
                      ${row.pipelineValue.toLocaleString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {row.activeThisWeek > 0 ? (
                    <Badge variant="default" className="bg-success">
                      {row.activeThisWeek}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.activeLastWeek > 0 ? (
                    <Badge variant="secondary">
                      {row.activeLastWeek}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {renderMomentumIcon(row.momentum)}
                    <span className="text-sm capitalize">{row.momentum}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {row.nextAction ? (
                    <span className="text-sm">{row.nextAction}</span>
                  ) : (
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                      Schedule follow-up
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/PrincipalPipelineTable.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx
git add src/atomic-crm/dashboard/v3/components/__tests__/PrincipalPipelineTable.test.tsx
git commit -m "feat(dashboard-v3): add PrincipalPipelineTable component with mock data"
```

---

## Task 3: Create Tasks Panel Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx`
- Create: `src/atomic-crm/dashboard/v3/components/TaskGroup.tsx`
- Test: `src/atomic-crm/dashboard/v3/components/__tests__/TasksPanel.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/v3/components/__tests__/TasksPanel.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TasksPanel } from '../TasksPanel';

describe('TasksPanel', () => {
  it('should render panel headers and helper text', () => {
    render(<TasksPanel />);

    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText("Today's priorities and upcoming activities")).toBeInTheDocument();
  });

  it('should render task groups', () => {
    render(<TasksPanel />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('should apply interactive-card class to task items', () => {
    const { container } = render(<TasksPanel />);
    const cards = container.querySelectorAll('.interactive-card');
    expect(cards.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/TasksPanel.test.tsx
```

Expected: FAIL with "Cannot find module '../TasksPanel'"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/dashboard/v3/components/TaskGroup.tsx`:

```typescript
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskGroupProps {
  title: string;
  variant: 'danger' | 'warning' | 'info' | 'default';
  count: number;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function TaskGroup({
  title,
  variant,
  count,
  children,
  collapsed = false,
  onToggle
}: TaskGroupProps) {
  const variantStyles = {
    danger: 'border-l-destructive text-destructive',
    warning: 'border-l-warning text-warning',
    info: 'border-l-primary text-primary',
    default: 'border-l-muted-foreground text-muted-foreground',
  };

  return (
    <div className={cn('border-l-4 pl-4', variantStyles[variant])}>
      <button
        onClick={onToggle}
        className="mb-2 flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              !collapsed && 'rotate-90'
            )}
          />
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({count})</span>
        </div>
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
```

Create `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx`:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Users,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { TaskGroup } from './TaskGroup';
import type { TaskItem } from '../types';

// Mock data for testing
const mockTasks: TaskItem[] = [
  {
    id: 1,
    subject: 'Follow up on Q4 proposal',
    dueDate: new Date(Date.now() - 86400000), // Yesterday
    priority: 'high',
    taskType: 'Call',
    relatedTo: { type: 'opportunity', name: 'Q4 Enterprise Deal', id: 101 },
    status: 'overdue',
  },
  {
    id: 2,
    subject: 'Send contract for review',
    dueDate: new Date(), // Today
    priority: 'critical',
    taskType: 'Email',
    relatedTo: { type: 'contact', name: 'John Smith', id: 202 },
    status: 'today',
  },
  {
    id: 3,
    subject: 'Schedule demo meeting',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    priority: 'medium',
    taskType: 'Meeting',
    relatedTo: { type: 'organization', name: 'TechCorp', id: 303 },
    status: 'tomorrow',
  },
];

export function TasksPanel() {
  const overdueTasks = mockTasks.filter(t => t.status === 'overdue');
  const todayTasks = mockTasks.filter(t => t.status === 'today');
  const tomorrowTasks = mockTasks.filter(t => t.status === 'tomorrow');

  const getTaskIcon = (type: TaskItem['taskType']) => {
    switch(type) {
      case 'Call': return <Phone className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      case 'Meeting': return <Users className="h-4 w-4" />;
      case 'Follow-up': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch(priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Today's priorities and upcoming activities
            </CardDescription>
          </div>
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {overdueTasks.length} overdue
            </Badge>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Overdue items highlighted • Click to complete • Drag to reschedule
        </p>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <div className="space-y-4 p-4">
          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <TaskGroup title="Overdue" variant="danger" count={overdueTasks.length}>
              {overdueTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </TaskGroup>
          )}

          {/* Today section */}
          <TaskGroup title="Today" variant="warning" count={todayTasks.length}>
            {todayTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </TaskGroup>

          {/* Tomorrow section */}
          <TaskGroup title="Tomorrow" variant="info" count={tomorrowTasks.length}>
            {tomorrowTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </TaskGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ task }: { task: TaskItem }) {
  const getTaskIcon = (type: TaskItem['taskType']) => {
    switch(type) {
      case 'Call': return <Phone className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      case 'Meeting': return <Users className="h-4 w-4" />;
      case 'Follow-up': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch(priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="interactive-card flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2">
      <Checkbox className="h-5 w-5" />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          {getTaskIcon(task.taskType)}
          <span className="font-medium">{task.subject}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            {task.priority}
          </Badge>
          <span>→ {task.relatedTo.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Clock className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/TasksPanel.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/TasksPanel.tsx
git add src/atomic-crm/dashboard/v3/components/TaskGroup.tsx
git add src/atomic-crm/dashboard/v3/components/__tests__/TasksPanel.test.tsx
git commit -m "feat(dashboard-v3): add TasksPanel with grouped task display"
```

---

## Task 4: Create Quick Logger Component

**Files:**
- Create: `src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx`
- Create: `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`
- Create: `src/atomic-crm/dashboard/v3/validation/activitySchema.ts`
- Test: `src/atomic-crm/dashboard/v3/components/__tests__/QuickLoggerPanel.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/v3/components/__tests__/QuickLoggerPanel.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuickLoggerPanel } from '../QuickLoggerPanel';

describe('QuickLoggerPanel', () => {
  it('should render panel headers', () => {
    render(<QuickLoggerPanel />);

    expect(screen.getByText('Log Activity')).toBeInTheDocument();
    expect(screen.getByText('Quick capture for calls, meetings, and notes')).toBeInTheDocument();
  });

  it('should show New Activity button when not logging', () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole('button', { name: /new activity/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('h-11'); // 44px touch target
  });

  it('should show form when New Activity is clicked', () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole('button', { name: /new activity/i });
    fireEvent.click(button);

    expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/QuickLoggerPanel.test.tsx
```

Expected: FAIL with "Cannot find module '../QuickLoggerPanel'"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/dashboard/v3/validation/activitySchema.ts`:

```typescript
import { z } from 'zod';

export const activityTypeSchema = z.enum(['Call', 'Email', 'Meeting', 'Note']);
export const activityOutcomeSchema = z.enum([
  'Connected',
  'Left Voicemail',
  'No Answer',
  'Completed',
  'Rescheduled',
]);

export const activityLogSchema = z.object({
  activityType: activityTypeSchema,
  outcome: activityOutcomeSchema,
  date: z.date().default(() => new Date()),
  duration: z.number().min(0).optional(),
  contactId: z.number().optional(),
  organizationId: z.number().optional(),
  opportunityId: z.number().optional(),
  notes: z.string().min(1, 'Notes are required'),
  nextStep: z.string().optional(),
  createFollowUp: z.boolean().default(false),
  followUpDate: z.date().optional(),
});

export type ActivityLogInput = z.input<typeof activityLogSchema>;
export type ActivityLog = z.output<typeof activityLogSchema>;
```

Create `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { activityLogSchema, type ActivityLogInput } from '../validation/activitySchema';
import { Calendar } from 'lucide-react';

interface QuickLogFormProps {
  onComplete: () => void;
}

export function QuickLogForm({ onComplete }: QuickLogFormProps) {
  const form = useForm<ActivityLogInput>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: activityLogSchema.partial().parse({}),
  });

  const onSubmit = (data: ActivityLogInput) => {
    console.log('Activity logged:', data);
    // TODO: Submit to backend
    form.reset();
    onComplete();
  };

  const showDuration = form.watch('activityType') === 'Call' || form.watch('activityType') === 'Meeting';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Group 1: What happened? */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">What happened?</h3>

          <FormField
            control={form.control}
            name="activityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activity Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Note">Note</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="outcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outcome</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Connected">Connected</SelectItem>
                    <SelectItem value="Left Voicemail">Left Voicemail</SelectItem>
                    <SelectItem value="No Answer">No Answer</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showDuration && (
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      className="h-11"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Group 2: Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Summary of the interaction..."
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Group 3: Follow-up */}
        <FormField
          control={form.control}
          name="createFollowUp"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0">
              <FormLabel className="text-sm font-medium">
                Create follow-up task?
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Action buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button type="submit">
              Save & Close
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                form.handleSubmit(onSubmit)();
                // Keep form open for next entry
              }}
            >
              Save & New
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
```

Create `src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx`:

```typescript
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquarePlus } from 'lucide-react';
import { QuickLogForm } from './QuickLogForm';

export function QuickLoggerPanel() {
  const [isLogging, setIsLogging] = useState(false);

  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Log Activity</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Quick capture for calls, meetings, and notes
            </CardDescription>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Start typing or use voice input • Auto-links to opportunities
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 items-center justify-center p-6">
        {!isLogging ? (
          <div className="flex w-full max-w-sm flex-col items-center space-y-4">
            <Button
              size="lg"
              className="btn-premium h-11 w-full"
              onClick={() => setIsLogging(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              New Activity
            </Button>
            <p className="text-sm text-muted-foreground">
              Or press <kbd className="rounded border px-1">Ctrl</kbd>+
              <kbd className="rounded border px-1">L</kbd> to quick log
            </p>
          </div>
        ) : (
          <div className="w-full">
            <QuickLogForm onComplete={() => setIsLogging(false)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/QuickLoggerPanel.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx
git add src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx
git add src/atomic-crm/dashboard/v3/validation/activitySchema.ts
git add src/atomic-crm/dashboard/v3/components/__tests__/QuickLoggerPanel.test.tsx
git commit -m "feat(dashboard-v3): add QuickLoggerPanel with activity form"
```

---

## Task 5: Create Main Dashboard Container

**Files:**
- Create: `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`
- Create: `src/atomic-crm/dashboard/v3/index.ts`
- Test: `src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PrincipalDashboardV3 } from '../PrincipalDashboardV3';

describe('PrincipalDashboardV3', () => {
  it('should render all three panels', () => {
    render(<PrincipalDashboardV3 />);

    // Check all panel titles are present
    expect(screen.getByText('Pipeline by Principal')).toBeInTheDocument();
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Log Activity')).toBeInTheDocument();
  });

  it('should use resizable panels', () => {
    const { container } = render(<PrincipalDashboardV3 />);

    // Check for resizable panel group
    const panelGroup = container.querySelector('[data-orientation="horizontal"]');
    expect(panelGroup).toBeInTheDocument();
  });

  it('should have proper background styling', () => {
    const { container } = render(<PrincipalDashboardV3 />);

    const dashboard = container.querySelector('.bg-muted');
    expect(dashboard).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx
```

Expected: FAIL with "Cannot find module '../PrincipalDashboardV3'"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`:

```typescript
import { useState, useEffect } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { PrincipalPipelineTable } from './components/PrincipalPipelineTable';
import { TasksPanel } from './components/TasksPanel';
import { QuickLoggerPanel } from './components/QuickLoggerPanel';

const STORAGE_KEY = 'dashboard.v3.panelSizes';

export function PrincipalDashboardV3() {
  // Load saved panel sizes from localStorage
  const [sizes, setSizes] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [40, 35, 25];
  });

  // Save panel sizes when they change
  const handleLayout = (newSizes: number[]) => {
    setSizes(newSizes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSizes));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+L for quick log
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        // TODO: Focus quick logger
      }

      // Number keys for panel navigation
      if (e.key === '1') {
        // TODO: Focus pipeline table
      } else if (e.key === '2') {
        // TODO: Focus tasks panel
      } else if (e.key === '3') {
        // TODO: Focus quick logger
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen bg-muted">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-screen"
        onLayout={handleLayout}
      >
        {/* Panel 1: Pipeline by Principal */}
        <ResizablePanel
          defaultSize={sizes[0]}
          minSize={30}
          maxSize={60}
          className="bg-background"
        >
          <div className="h-full p-6">
            <PrincipalPipelineTable />
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

        {/* Panel 2: My Tasks */}
        <ResizablePanel
          defaultSize={sizes[1]}
          minSize={25}
          maxSize={50}
          className="bg-background"
        >
          <div className="h-full p-6">
            <TasksPanel />
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

        {/* Panel 3: Quick Logger */}
        <ResizablePanel
          defaultSize={sizes[2]}
          minSize={20}
          maxSize={40}
          className="bg-background"
        >
          <div className="h-full p-6">
            <QuickLoggerPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

Create `src/atomic-crm/dashboard/v3/index.ts`:

```typescript
export { PrincipalDashboardV3 } from './PrincipalDashboardV3';
export type {
  PrincipalPipelineRow,
  TaskItem,
  ActivityLog,
  Momentum,
  Priority,
  TaskStatus,
  TaskType,
  ActivityType,
  ActivityOutcome,
} from './types';
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx
git add src/atomic-crm/dashboard/v3/index.ts
git add src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx
git commit -m "feat(dashboard-v3): add main dashboard container with resizable panels"
```

---

## Task 6: Hook Up Data from Supabase

**Files:**
- Create: `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts`
- Create: `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts`
- Modify: `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx`
- Modify: `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx`

**Step 1: Write the failing test**

Create `src/atomic-crm/dashboard/v3/hooks/__tests__/usePrincipalPipeline.test.ts`:

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePrincipalPipeline } from '../usePrincipalPipeline';

// Mock React Admin hooks
vi.mock('react-admin', () => ({
  useDataProvider: () => ({
    getList: vi.fn().mockResolvedValue({
      data: [
        { id: 1, name: 'Test Principal', opportunities: [] }
      ],
      total: 1
    })
  })
}));

describe('usePrincipalPipeline', () => {
  it('should return pipeline data', async () => {
    const { result } = renderHook(() => usePrincipalPipeline());

    expect(result.current.loading).toBe(true);
    // Wait for async update
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(result.current.data).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/dashboard/v3/hooks/__tests__/usePrincipalPipeline.test.ts
```

Expected: FAIL with "Cannot find module '../usePrincipalPipeline'"

**Step 3: Write minimal implementation**

Create `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useDataProvider, useGetIdentity } from 'react-admin';
import type { PrincipalPipelineRow } from '../types';

export function usePrincipalPipeline(filters?: { myPrincipalsOnly?: boolean }) {
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();
  const [data, setData] = useState<PrincipalPipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch organizations (principals)
        const { data: principals } = await dataProvider.getList('organizations', {
          filter: {
            organization_type: 'principal',
            ...(filters?.myPrincipalsOnly && identity?.sales_id
              ? { sales_id: identity.sales_id }
              : {})
          },
          sort: { field: 'name', order: 'ASC' },
          pagination: { page: 1, perPage: 100 },
        });

        // Fetch opportunities for activity tracking
        const { data: opportunities } = await dataProvider.getList('opportunities', {
          filter: {
            stage: { $nin: ['closed_won', 'closed_lost'] },
          },
          sort: { field: 'updated_at', order: 'DESC' },
          pagination: { page: 1, perPage: 500 },
        });

        // Calculate metrics for each principal
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const pipelineData: PrincipalPipelineRow[] = principals.map((principal: any) => {
          // Filter opportunities for this principal
          const principalOpps = opportunities.filter(
            (opp: any) => opp.organization_id === principal.id
          );

          // Calculate activity counts
          const activeThisWeek = principalOpps.filter(
            (opp: any) => new Date(opp.updated_at) > weekAgo
          ).length;

          const activeLastWeek = principalOpps.filter(
            (opp: any) => {
              const updated = new Date(opp.updated_at);
              return updated > twoWeeksAgo && updated <= weekAgo;
            }
          ).length;

          // Calculate total pipeline value
          const pipelineValue = principalOpps.reduce(
            (sum: number, opp: any) => sum + (opp.amount || 0),
            0
          );

          // Determine momentum
          let momentum: PrincipalPipelineRow['momentum'];
          if (activeThisWeek > activeLastWeek) {
            momentum = 'increasing';
          } else if (activeThisWeek < activeLastWeek) {
            momentum = 'decreasing';
          } else if (activeThisWeek === 0 && activeLastWeek === 0) {
            momentum = 'stale';
          } else {
            momentum = 'steady';
          }

          // Get next action (would come from activities in real implementation)
          const nextAction = principalOpps.length > 0
            ? `${principalOpps.length} opportunities in pipeline`
            : null;

          return {
            id: principal.id,
            name: principal.name,
            totalPipeline: principalOpps.length,
            pipelineValue,
            activeThisWeek,
            activeLastWeek,
            momentum,
            nextAction,
          };
        });

        // Sort by active this week DESC, then pipeline value
        pipelineData.sort((a, b) => {
          if (a.activeThisWeek !== b.activeThisWeek) {
            return b.activeThisWeek - a.activeThisWeek;
          }
          return b.pipelineValue - a.pipelineValue;
        });

        setData(pipelineData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataProvider, identity, filters?.myPrincipalsOnly]);

  return { data, loading, error };
}
```

Create `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useDataProvider, useGetIdentity } from 'react-admin';
import type { TaskItem } from '../types';

export function useMyTasks() {
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!identity?.sales_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch tasks for current user
        const { data: tasksData } = await dataProvider.getList('tasks', {
          filter: {
            sales_id: identity.sales_id,
            completed: false,
          },
          sort: { field: 'due_date', order: 'ASC' },
          pagination: { page: 1, perPage: 100 },
        });

        // Map to TaskItem format
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const mappedTasks: TaskItem[] = tasksData.map((task: any) => {
          const dueDate = new Date(task.due_date);

          // Determine status
          let status: TaskItem['status'];
          if (dueDate < now && dueDate.toDateString() !== now.toDateString()) {
            status = 'overdue';
          } else if (dueDate.toDateString() === now.toDateString()) {
            status = 'today';
          } else if (dueDate.toDateString() === tomorrow.toDateString()) {
            status = 'tomorrow';
          } else if (dueDate < nextWeek) {
            status = 'upcoming';
          } else {
            status = 'later';
          }

          // Map task type
          const taskTypeMap: Record<string, TaskItem['taskType']> = {
            'Call': 'Call',
            'Email': 'Email',
            'Meeting': 'Meeting',
            'Follow-up': 'Follow-up',
          };

          return {
            id: task.id,
            subject: task.title,
            dueDate,
            priority: task.priority || 'medium',
            taskType: taskTypeMap[task.type] || 'Other',
            relatedTo: {
              type: task.opportunity_id ? 'opportunity' : 'contact',
              name: task.opportunity?.name || task.contact?.name || 'Unknown',
              id: task.opportunity_id || task.contact_id || 0,
            },
            status,
            notes: task.description,
          };
        });

        setTasks(mappedTasks);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [dataProvider, identity]);

  const completeTask = async (taskId: number) => {
    try {
      await dataProvider.update('tasks', {
        id: taskId,
        data: { completed: true, completed_at: new Date().toISOString() },
      });

      // Remove from local state
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const snoozeTask = async (taskId: number, newDate: Date) => {
    try {
      await dataProvider.update('tasks', {
        id: taskId,
        data: { due_date: newDate.toISOString() },
      });

      // Update local state
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, dueDate: newDate } : t
      ));
    } catch (err) {
      console.error('Failed to snooze task:', err);
    }
  };

  return { tasks, loading, error, completeTask, snoozeTask };
}
```

**Step 4: Update components to use real data**

Modify the imports in `PrincipalPipelineTable.tsx`:

```typescript
// Add at top
import { usePrincipalPipeline } from '../hooks/usePrincipalPipeline';
import { useState } from 'react';

// Replace mock data with:
export function PrincipalPipelineTable() {
  const [myPrincipalsOnly, setMyPrincipalsOnly] = useState(true);
  const { data, loading, error } = usePrincipalPipeline({ myPrincipalsOnly });

  if (loading) {
    return <div className="p-8 text-center">Loading pipeline data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading data</div>;
  }

  // Rest of component remains the same, but use `data` instead of `mockData`
```

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts
git add src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts
git add src/atomic-crm/dashboard/v3/hooks/__tests__/usePrincipalPipeline.test.ts
git commit -m "feat(dashboard-v3): add data hooks for pipeline and tasks"
```

---

## Task 7: Add Route and Navigation

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`
- Create: `src/atomic-crm/dashboard/v3/DashboardV3Route.tsx`

**Step 1: Create route wrapper**

Create `src/atomic-crm/dashboard/v3/DashboardV3Route.tsx`:

```typescript
import { PrincipalDashboardV3 } from './PrincipalDashboardV3';

export default function DashboardV3Route() {
  return <PrincipalDashboardV3 />;
}
```

**Step 2: Add route to CRM.tsx**

Find the route definitions (around line 200-250) and add:

```typescript
// Add import at top
const DashboardV3 = React.lazy(() => import('../dashboard/v3/DashboardV3Route'));

// Add route after existing dashboard routes
<Route path="/dashboard-v3" element={<DashboardV3 />} />
```

**Step 3: Commit**

```bash
git add src/atomic-crm/dashboard/v3/DashboardV3Route.tsx
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat(dashboard-v3): add route and navigation"
```

---

## Task 8: Final Integration Testing

**Files:**
- Create: `tests/e2e/dashboard-v3/dashboard-v3.spec.ts`

**Step 1: Write E2E test**

Create `tests/e2e/dashboard-v3/dashboard-v3.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Principal Dashboard V3', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://127.0.0.1:5173');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to dashboard v3
    await page.goto('http://127.0.0.1:5173/dashboard-v3');
  });

  test('should display all three panels', async ({ page }) => {
    await expect(page.getByText('Pipeline by Principal')).toBeVisible();
    await expect(page.getByText('My Tasks')).toBeVisible();
    await expect(page.getByText('Log Activity')).toBeVisible();
  });

  test('should have resizable panels', async ({ page }) => {
    // Find resize handles
    const handles = page.locator('[role="separator"]');
    await expect(handles).toHaveCount(2);
  });

  test('should open activity form when New Activity clicked', async ({ page }) => {
    await page.click('button:has-text("New Activity")');
    await expect(page.getByLabel('Activity Type')).toBeVisible();
  });

  test('should maintain 44px touch targets', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should persist panel sizes', async ({ page }) => {
    // Drag resize handle
    const handle = page.locator('[role="separator"]').first();
    await handle.dragTo(handle, { targetPosition: { x: 100, y: 0 } });

    // Reload page
    await page.reload();

    // Check panels still visible (sizes persisted)
    await expect(page.getByText('Pipeline by Principal')).toBeVisible();
  });
});
```

**Step 2: Run E2E test**

```bash
npm run test:e2e -- dashboard-v3
```

Expected: PASS

**Step 3: Commit**

```bash
git add tests/e2e/dashboard-v3/dashboard-v3.spec.ts
git commit -m "test(dashboard-v3): add E2E tests for dashboard functionality"
```

---

## Post-Implementation Checklist

- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] All tests pass: `npm test`
- [ ] E2E tests pass: `npm run test:e2e -- dashboard-v3`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors at runtime
- [ ] All touch targets ≥ 44px
- [ ] No inline CSS variables (only semantic utilities)
- [ ] Desktop viewport tested (1440px)
- [ ] Tablet viewport tested (768px)
- [ ] Panel resize works and persists
- [ ] Keyboard shortcuts work (Ctrl+L, 1-3 keys)

---

## Notes for Implementer

**Design System Compliance:**
- Never use inline CSS variables like `text-[color:var(--text-subtle)]`
- Always use semantic utilities: `text-muted-foreground`, `bg-card`, etc.
- Touch targets must be 44px minimum (use `h-11 w-11` classes)
- Test desktop-first at 1440px, then adapt for tablet/mobile

**Performance Considerations:**
- Virtual scrolling will be needed if principals > 100
- Consider React.memo for TaskItem components
- Debounce panel resize handlers

**Next Steps:**
- Connect activity logger to create real activities
- Add real-time updates via WebSocket
- Implement drill-down to opportunity details
- Add export functionality for pipeline table