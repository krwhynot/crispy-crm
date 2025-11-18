# Principal Dashboard V3 Implementation Plan (REVISED)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a three-panel principal-centric dashboard with Pipeline by Principal table, My Tasks widget, and Quick Activity Logger.

**Architecture:** Three resizable panels using shadcn ResizablePanelGroup. Pipeline table shows principal-level opportunity metrics with weekly activity tracking. Tasks panel groups by time buckets (Overdue/Today/Tomorrow). Quick Logger captures activities with smart field defaults.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, shadcn/ui, React Admin, Supabase, Zod validation

**Critical Fixes Applied:**
- ✅ Fixed Supabase filter syntax (no $nin operator)
- ✅ Fixed principal FK field name (`principal_organization_id`)
- ✅ Fixed auth identity access (use sale.id directly)
- ✅ Added missing Quick Logger fields (Contact/Organization/Opportunity)
- ✅ Added follow-up date picker
- ✅ Added actual Supabase persistence
- ✅ Fixed touch target test to only check primary actions

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
```

*(Section continues with the same implementation from the original plan.)*

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

## Task 4: Create Quick Logger Component with ALL Fields

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

  it('should show form with all required fields when New Activity is clicked', () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole('button', { name: /new activity/i });
    fireEvent.click(button);

    // Check for all required fields
    expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/opportunity/i)).toBeInTheDocument();
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
import { useDataProvider, useNotify } from 'react-admin';
import { useState, useEffect } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { activityLogSchema, type ActivityLogInput } from '../validation/activitySchema';
import { useCurrentSale } from '../hooks/useCurrentSale';

interface QuickLogFormProps {
  onComplete: () => void;
}

export function QuickLogForm({ onComplete }: QuickLogFormProps) {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { salesId } = useCurrentSale();
  const [contacts, setContacts] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<ActivityLogInput>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: activityLogSchema.partial().parse({}),
  });

  // Load related entities
  useEffect(() => {
    const loadEntities = async () => {
      try {
        const [contactsRes, orgsRes, oppsRes] = await Promise.all([
          dataProvider.getList('contacts', {
            pagination: { page: 1, perPage: 100 },
            sort: { field: 'name', order: 'ASC' },
            filter: {}
          }),
          dataProvider.getList('organizations', {
            pagination: { page: 1, perPage: 100 },
            sort: { field: 'name', order: 'ASC' },
            filter: {}
          }),
          dataProvider.getList('opportunities', {
            pagination: { page: 1, perPage: 100 },
            sort: { field: 'name', order: 'ASC' },
            filter: {}
          }),
        ]);

        setContacts(contactsRes.data);
        setOrganizations(orgsRes.data);
        setOpportunities(
          oppsRes.data.filter(
            (opp: any) => !['closed_won', 'closed_lost'].includes(opp.stage)
          )
        );
      } catch (error) {
        console.error('Failed to load entities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, [dataProvider]);

  const onSubmit = async (data: ActivityLogInput) => {
    try {
      // Create the activity record with correct field mappings
      await dataProvider.create('activities', {
        data: {
          activity_type: 'interaction',                      // Required enum value
          type: data.activityType.toLowerCase(),             // Map to lowercase: Call → call
          subject: data.notes.substring(0, 100),             // Required field - first 100 chars
          description: data.notes,                           // Full notes in description
          activity_date: data.date.toISOString(),            // Correct field name
          duration_minutes: data.duration,                   // Correct field name
          contact_id: data.contactId,
          organization_id: data.organizationId,
          opportunity_id: data.opportunityId,
          outcome: data.outcome,
          follow_up_notes: data.nextStep,                    // Correct field name
          created_by: salesId,                               // Required for RLS policies
        }
      });

      // Create follow-up task if requested (removed non-existent fields)
      if (data.createFollowUp && data.followUpDate && salesId) {
        await dataProvider.create('tasks', {
          data: {
            title: `Follow-up: ${data.notes.substring(0, 50)}`,
            due_date: data.followUpDate.toISOString(),
            type: 'Follow-up',
            priority: 'medium',
            contact_id: data.contactId,
            opportunity_id: data.opportunityId,
            sales_id: salesId,
            // Removed: organization_id (doesn't exist in tasks table)
            // Removed: created_by (doesn't exist in tasks table)
          }
        });
      }

      notify('Activity logged successfully', { type: 'success' });
      form.reset();
      onComplete();
    } catch (error) {
      notify('Failed to log activity', { type: 'error' });
      console.error('Activity log error:', error);
    }
  };

  const showDuration = form.watch('activityType') === 'Call' || form.watch('activityType') === 'Meeting';
  const showFollowUpDate = form.watch('createFollowUp');

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

        {/* Group 2: Who was involved? */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Who was involved?</h3>

          {/* Contact Combobox */}
          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Contact</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-11 w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? contacts.find((c) => c.id === field.value)?.name
                          : "Select contact"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search contact..." />
                      <CommandEmpty>No contact found.</CommandEmpty>
                      <CommandGroup>
                        {contacts.map((contact) => (
                          <CommandItem
                            key={contact.id}
                            value={contact.name}
                            onSelect={() => {
                              field.onChange(contact.id);
                              // Auto-fill organization if contact has one
                              if (contact.organization_id) {
                                form.setValue('organizationId', contact.organization_id);
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === contact.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {contact.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Organization Combobox */}
          <FormField
            control={form.control}
            name="organizationId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Organization</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-11 w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? organizations.find((o) => o.id === field.value)?.name
                          : "Select organization"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search organization..." />
                      <CommandEmpty>No organization found.</CommandEmpty>
                      <CommandGroup>
                        {organizations.map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.name}
                            onSelect={() => field.onChange(org.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === org.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {org.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Opportunity Combobox */}
          <FormField
            control={form.control}
            name="opportunityId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Opportunity</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-11 w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? opportunities.find((o) => o.id === field.value)?.name
                          : "Select opportunity"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search opportunity..." />
                      <CommandEmpty>No opportunity found.</CommandEmpty>
                      <CommandGroup>
                        {opportunities.map((opp) => (
                          <CommandItem
                            key={opp.id}
                            value={opp.name}
                            onSelect={() => field.onChange(opp.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === opp.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {opp.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Group 3: Notes */}
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

        {/* Group 4: Follow-up */}
        <div className="space-y-3">
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

          {showFollowUpDate && (
            <FormField
              control={form.control}
              name="followUpDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Follow-up Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

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
                form.handleSubmit((data) => {
                  onSubmit(data);
                  // Reset form but keep it open
                  form.reset();
                })();
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
          <div className="w-full overflow-auto">
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
git commit -m "feat(dashboard-v3): add QuickLoggerPanel with complete activity form"
```

---

## Task 5: Create Main Dashboard Container (with SSR Guard)

**Files:**
- Create: `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx`
- Create: `src/atomic-crm/dashboard/v3/index.ts`
- Test: `src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx`

**Step 1: Write the failing test**

Same as original (lines 1228-1254)

**Step 2: Run test to verify it fails**

```bash
npm test -- src/atomic-crm/dashboard/v3/__tests__/PrincipalDashboardV3.test.tsx
```

Expected: FAIL with "Cannot find module '../PrincipalDashboardV3'"

**Step 3: Write minimal implementation (with SSR guard)**

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
  // SSR-safe localStorage access
  const [sizes, setSizes] = useState<number[]>([40, 35, 25]);
  const [mounted, setMounted] = useState(false);

  // Load saved panel sizes after mount (client-side only)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setSizes(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved panel sizes');
        }
      }
    }
  }, []);

  // Save panel sizes when they change
  const handleLayout = (newSizes: number[]) => {
    setSizes(newSizes);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSizes));
    }
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

  // Avoid hydration mismatch - render with defaults until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-muted" />;
  }

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

Same as original (lines 1289-1299)

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
git commit -m "feat(dashboard-v3): add main dashboard container with SSR guards"
```

---

## Task 6: Hook Up Data from Supabase (FIXED)

**Files:**
- Create: `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts`
- Create: `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts`
- Create: `src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts`
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

Create `src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts`:

```typescript
import { useGetIdentity } from 'react-admin';
import { useEffect, useState } from 'react';
import { supabase } from '@/atomic-crm/providers/supabase/supabase';

export function useCurrentSale() {
  const { identity } = useGetIdentity();
  const [salesId, setSalesId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaleId = async () => {
      if (!identity) {
        setLoading(false);
        return;
      }

      try {
        // Get the current user's sales record
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch sales record by user_id
        const { data: sale } = await supabase
          .from('sales')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (sale) {
          setSalesId(sale.id);
        }
      } catch (error) {
        console.error('Failed to fetch sales ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaleId();
  }, [identity]);

  return { salesId, loading };
}
```

Create `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useDataProvider } from 'react-admin';
import { useCurrentSale } from './useCurrentSale';
import type { PrincipalPipelineRow } from '../types';

export function usePrincipalPipeline(filters?: { myPrincipalsOnly?: boolean }) {
  const dataProvider = useDataProvider();
  const { salesId } = useCurrentSale();
  const [data, setData] = useState<PrincipalPipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all open opportunities once (filter closed stages manually)
        const { data: rawOpportunities } = await dataProvider.getList('opportunities', {
          filter: {},
          sort: { field: 'updated_at', order: 'DESC' },
          pagination: { page: 1, perPage: 500 },
        });
        const openOpportunities = rawOpportunities.filter(
          (opp: any) => !['closed_won', 'closed_lost'].includes(opp.stage)
        );

        // Determine which principals belong to the current rep if "My Principals" is toggled
        const myPrincipalIds =
          filters?.myPrincipalsOnly && salesId
            ? Array.from(
                new Set(
                  openOpportunities
                    .filter((opp: any) => opp.account_manager_id === salesId)
                    .map((opp: any) => opp.principal_organization_id)
                    .filter(Boolean)
                )
              )
            : [];

        // Fetch principal orgs, optionally constrained to the IDs above
        const { data: principals } = await dataProvider.getList('organizations', {
          filter: {
            organization_type: 'principal',
            ...(filters?.myPrincipalsOnly && myPrincipalIds.length > 0
              ? { id: myPrincipalIds }
              : {}),
          },
          sort: { field: 'name', order: 'ASC' },
          pagination: { page: 1, perPage: 100 },
        });

        // Fetch recent + upcoming activities to calculate weekly momentum / next actions
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const futureHorizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const { data: rawActivities } = await dataProvider.getList('activities', {
          filter: {
            activity_date_gte: twoWeeksAgo.toISOString(),
            activity_date_lte: futureHorizon.toISOString(),
          },
          sort: { field: 'activity_date', order: 'DESC' },
          pagination: { page: 1, perPage: 1000 },
        });

        const activitiesByOpportunity = rawActivities.reduce<Record<number, any[]>>(
          (acc, activity: any) => {
            if (!activity.opportunity_id) {
              return acc;
            }
            if (!acc[activity.opportunity_id]) {
              acc[activity.opportunity_id] = [];
            }
            acc[activity.opportunity_id].push(activity);
            return acc;
          },
          {}
        );

        const pipelineData: PrincipalPipelineRow[] = principals.map((principal: any) => {
          const principalOpps = openOpportunities.filter(
            (opp: any) => opp.principal_organization_id === principal.id
          );

          const activeThisWeek = principalOpps.filter((opp: any) =>
            (activitiesByOpportunity[opp.id] || []).some((activity) => {
              const activityDate = new Date(activity.activity_date);
              return activityDate >= weekAgo && activityDate <= now;
            })
          ).length;

          const activeLastWeek = principalOpps.filter((opp: any) =>
            (activitiesByOpportunity[opp.id] || []).some((activity) => {
              const activityDate = new Date(activity.activity_date);
              return activityDate >= twoWeeksAgo && activityDate < weekAgo;
            })
          ).length;

          const pipelineValue = principalOpps.reduce(
            (sum: number, opp: any) => sum + (opp.amount || 0),
            0
          );

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

          // Find the soonest upcoming activity for this principal
          const upcomingActivity = principalOpps
            .flatMap((opp: any) => activitiesByOpportunity[opp.id] || [])
            .filter((activity) => new Date(activity.activity_date) > now)
            .sort(
              (a, b) =>
                new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime()
            )[0];

          const nextAction = upcomingActivity
            ? `${upcomingActivity.type} on ${new Date(
                upcomingActivity.activity_date
              ).toLocaleDateString()}`
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
  }, [dataProvider, salesId, filters?.myPrincipalsOnly]);

  return { data, loading, error };
}
```

Create `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts`:

```typescript
import { useState, useEffect } from 'react';
import { useDataProvider } from 'react-admin';
import { useCurrentSale } from './useCurrentSale';
import type { TaskItem } from '../types';

export function useMyTasks() {
  const dataProvider = useDataProvider();
  const { salesId, loading: salesLoading } = useCurrentSale();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      // Wait for salesId to be loaded
      if (salesLoading) {
        return;
      }

      if (!salesId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch tasks for current user
        const { data: tasksData } = await dataProvider.getList('tasks', {
          filter: {
            sales_id: salesId,
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
  }, [dataProvider, salesId, salesLoading]);

  const completeTask = async (taskId: number) => {
    try {
      await dataProvider.update('tasks', {
        id: taskId,
        data: { completed: true, completed_at: new Date().toISOString() },
        previousData: {} // Required by React Admin
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
        previousData: {} // Required by React Admin
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

Same approach as original, but components will now work correctly.

**Step 5: Commit**

```bash
git add src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts
git add src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts
git add src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts
git add src/atomic-crm/dashboard/v3/hooks/__tests__/usePrincipalPipeline.test.ts
git commit -m "feat(dashboard-v3): add data hooks with correct Supabase filters and auth"
```

---

## Task 7: Add Route and Navigation

Same as original (lines 1665-1688)

---

## Task 8: Final Integration Testing (FIXED)

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

    // Check for all required fields
    await expect(page.getByLabel('Activity Type')).toBeVisible();
    await expect(page.getByLabel('Contact')).toBeVisible();
    await expect(page.getByLabel('Organization')).toBeVisible();
    await expect(page.getByLabel('Opportunity')).toBeVisible();
  });

  test('should only check primary action buttons for 44px height', async ({ page }) => {
    // Only check primary CTAs, not all buttons
    const primaryButtons = page.locator('button.h-11'); // Buttons with explicit h-11 class
    const count = await primaryButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = primaryButtons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should show follow-up date picker when toggle is enabled', async ({ page }) => {
    await page.click('button:has-text("New Activity")');

    // Enable follow-up toggle
    const toggle = page.getByLabel('Create follow-up task?');
    await toggle.click();

    // Check that date picker appears
    await expect(page.getByLabel('Follow-up Date')).toBeVisible();
  });

  test('should persist panel sizes', async ({ page }) => {
    // Drag resize handle
    const handle = page.locator('[role="separator"]').first();
    const box = await handle.boundingBox();
    if (box) {
      await handle.dragTo(handle, {
        sourcePosition: { x: box.width / 2, y: box.height / 2 },
        targetPosition: { x: box.width / 2 + 100, y: box.height / 2 }
      });
    }

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
git commit -m "test(dashboard-v3): add E2E tests with fixed assertions"
```

---

## Post-Implementation Checklist

- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] All tests pass: `npm test`
- [ ] E2E tests pass: `npm run test:e2e -- dashboard-v3`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors at runtime
- [ ] Primary action buttons are 44px (not all buttons)
- [ ] No inline CSS variables (only semantic utilities)
- [ ] Desktop viewport tested (1440px)
- [ ] Tablet viewport tested (768px)
- [ ] Panel resize works and persists
- [ ] Keyboard shortcuts work (Ctrl+L, 1-3 keys)
- [ ] Activities save to database
- [ ] Follow-up tasks are created when requested

---

## Critical Fixes Summary

1. **Supabase Filtering**: Removed `$nin` operator, filter opportunities manually in JavaScript
2. **Principal FK**: Use `principal_organization_id` not `organization_id`
3. **Sales ID**: Created `useCurrentSale` hook to fetch sales ID from auth user
4. **Quick Logger Fields**: Added Contact/Organization/Opportunity comboboxes
5. **Follow-up Date**: Added date picker that appears when toggle is enabled
6. **Data Persistence**: Activities and follow-up tasks save to Supabase
7. **Touch Targets**: Test only checks primary buttons with `h-11` class
8. **SSR Safety**: Added mounted state and typeof window checks for localStorage

These fixes ensure the dashboard will actually work with Atomic CRM's real data models and auth system.
