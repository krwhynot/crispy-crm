# Task Card Redesign Implementation Plan

**Date:** 2025-12-05
**Design Reference:** `docs/designs/2025-12-05-task-card-redesign.md`
**Status:** Ready for Execution

---

## Overview

Implement the Contextual Ribbon Card layout with inline date picker for the My Tasks tab.

**Key Deliverables:**
1. Principal color ribbon on task cards (4px left border)
2. Inline date picker with Today/Tomorrow/Next Week shortcuts
3. Improved information hierarchy (Title → Metadata row)

**Execution Model:** Parallel groups with TDD strict

---

## Prerequisites Check

**Already verified:**
- ✅ `react-day-picker@9.11.1` is installed
- ✅ `updateTaskDueDate` already exists in `useMyTasks` hook
- ✅ Optimistic updates with rollback already implemented

---

## Task Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL GROUP 1 (Foundation)                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Task 1.1     │  │ Task 1.2     │  │ Task 1.3               │ │
│  │ Principal    │  │ InlineDate   │  │ Update useMyTasks      │ │
│  │ Colors       │  │ Picker       │  │ to fetch principal     │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL GROUP 2 (Integration)               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Task 2.1                                                  │   │
│  │ Refactor TaskKanbanCard with ribbon + inline date picker  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL GROUP 3 (Testing)                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │ Task 3.1                 │  │ Task 3.2                      │ │
│  │ Unit Tests               │  │ E2E Tests                     │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## PARALLEL GROUP 1: Foundation Components

### Task 1.1: Principal Colors Constant

**File:** `src/atomic-crm/dashboard/v3/constants/principalColors.ts` (NEW)

**TDD: Write failing test first**

```typescript
// src/atomic-crm/dashboard/v3/constants/__tests__/principalColors.test.ts

import { describe, it, expect } from 'vitest';
import { PRINCIPAL_COLORS, getPrincipalColor } from '../principalColors';

describe('principalColors', () => {
  describe('PRINCIPAL_COLORS', () => {
    it('contains at least 9 unique colors for principals', () => {
      const uniqueColors = new Set(Object.values(PRINCIPAL_COLORS));
      // 9 principals + 1 default = at least 9 unique (default may duplicate)
      expect(uniqueColors.size).toBeGreaterThanOrEqual(9);
    });

    it('has a default color', () => {
      expect(PRINCIPAL_COLORS.default).toBeDefined();
      expect(PRINCIPAL_COLORS.default).toContain('border-l-');
    });

    it('uses Tailwind border-l classes', () => {
      Object.values(PRINCIPAL_COLORS).forEach(color => {
        expect(color).toMatch(/^border-l-/);
      });
    });
  });

  describe('getPrincipalColor', () => {
    it('returns specific color for known principal ID', () => {
      // Test with a known principal ID
      const color = getPrincipalColor(1);
      expect(color).toContain('border-l-');
      expect(color).not.toBe(PRINCIPAL_COLORS.default);
    });

    it('returns default color for unknown principal ID', () => {
      const color = getPrincipalColor(999999);
      expect(color).toBe(PRINCIPAL_COLORS.default);
    });

    it('returns default color for null/undefined', () => {
      expect(getPrincipalColor(null)).toBe(PRINCIPAL_COLORS.default);
      expect(getPrincipalColor(undefined)).toBe(PRINCIPAL_COLORS.default);
    });
  });
});
```

**Run test (should fail):**
```bash
npm test -- src/atomic-crm/dashboard/v3/constants/__tests__/principalColors.test.ts
```

**Implementation:**

```typescript
// src/atomic-crm/dashboard/v3/constants/principalColors.ts

/**
 * Principal color mappings for task card ribbons
 *
 * Uses Tailwind v4 semantic border colors.
 * Colors chosen for maximum visual distinction across 9 principals.
 *
 * NOTE: Principal IDs are database IDs from the principals table.
 * Update this mapping when onboarding new principals.
 */
export const PRINCIPAL_COLORS: Record<number | 'default', string> = {
  // Map principal database IDs to colors
  // TODO: Update with actual principal IDs from database
  1: 'border-l-blue-500',      // Principal 1
  2: 'border-l-emerald-500',   // Principal 2
  3: 'border-l-amber-500',     // Principal 3
  4: 'border-l-violet-500',    // Principal 4
  5: 'border-l-rose-500',      // Principal 5
  6: 'border-l-cyan-500',      // Principal 6
  7: 'border-l-orange-500',    // Principal 7
  8: 'border-l-indigo-500',    // Principal 8
  9: 'border-l-pink-500',      // Principal 9
  default: 'border-l-muted-foreground',
} as const;

/**
 * Get the ribbon color class for a principal
 *
 * @param principalId - The principal's database ID (from opportunity.principal_id)
 * @returns Tailwind border-l-* class for the ribbon
 */
export function getPrincipalColor(principalId: number | null | undefined): string {
  if (principalId == null) {
    return PRINCIPAL_COLORS.default;
  }
  return PRINCIPAL_COLORS[principalId] ?? PRINCIPAL_COLORS.default;
}
```

**Run test (should pass):**
```bash
npm test -- src/atomic-crm/dashboard/v3/constants/__tests__/principalColors.test.ts
```

**Constitution Checklist:**
- [x] No retry logic
- [x] No direct Supabase import
- [x] Uses semantic Tailwind tokens
- [x] TypeScript interface for object shape

---

### Task 1.2: InlineDatePicker Component

**File:** `src/atomic-crm/dashboard/v3/components/InlineDatePicker.tsx` (NEW)

**TDD: Write failing test first**

```typescript
// src/atomic-crm/dashboard/v3/components/__tests__/InlineDatePicker.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, nextMonday, format } from 'date-fns';
import { InlineDatePicker } from '../InlineDatePicker';

describe('InlineDatePicker', () => {
  const mockOnChange = vi.fn();
  const testDate = new Date('2025-12-05');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(testDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays formatted date as button text', () => {
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);
    expect(screen.getByRole('button', { name: /dec 5/i })).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /dec 5/i }));

    expect(screen.getByRole('dialog', { name: /choose due date/i })).toBeInTheDocument();
  });

  it('shows quick action shortcuts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /dec 5/i }));

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tomorrow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Wk' })).toBeInTheDocument();
  });

  it('calls onChange with today when "Today" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnChange.mock.calls[0][0];
    expect(format(calledDate, 'yyyy-MM-dd')).toBe('2025-12-05');
  });

  it('calls onChange with tomorrow when "Tomorrow" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    await user.click(screen.getByRole('button', { name: 'Tomorrow' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnChange.mock.calls[0][0];
    expect(format(calledDate, 'yyyy-MM-dd')).toBe('2025-12-06');
  });

  it('calls onChange with next Monday when "Next Wk" clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    await user.click(screen.getByRole('button', { name: 'Next Wk' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnChange.mock.calls[0][0];
    // Dec 5, 2025 is Friday, next Monday is Dec 8
    expect(format(calledDate, 'yyyy-MM-dd')).toBe('2025-12-08');
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes dropdown after selecting date', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /dec 5/i }));
    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has accessible aria attributes', () => {
    render(<InlineDatePicker value={testDate} onChange={mockOnChange} />);

    const trigger = screen.getByRole('button', { name: /dec 5/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
```

**Run test (should fail):**
```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/InlineDatePicker.test.tsx
```

**Implementation:**

```typescript
// src/atomic-crm/dashboard/v3/components/InlineDatePicker.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { format, addDays, nextMonday, endOfDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import 'react-day-picker/dist/style.css';

interface InlineDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
  disabled?: boolean;
}

interface QuickOption {
  label: string;
  getValue: () => Date;
}

/**
 * InlineDatePicker - Click-to-edit date with quick shortcuts
 *
 * Features:
 * - Today/Tomorrow/Next Week quick buttons (covers 80% of reschedules)
 * - Full calendar for specific dates
 * - Accessible with keyboard navigation
 * - 44px touch targets for iPad
 *
 * @example
 * <InlineDatePicker
 *   value={task.dueDate}
 *   onChange={(newDate) => updateTaskDate(task.id, newDate)}
 * />
 */
export function InlineDatePicker({
  value,
  onChange,
  className = '',
  disabled = false,
}: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickOptions: QuickOption[] = [
    { label: 'Today', getValue: () => endOfDay(new Date()) },
    { label: 'Tomorrow', getValue: () => endOfDay(addDays(new Date(), 1)) },
    { label: 'Next Wk', getValue: () => endOfDay(nextMonday(new Date())) },
  ];

  const handleQuickSelect = useCallback((option: QuickOption) => {
    onChange(option.getValue());
    setIsOpen(false);
  }, [onChange]);

  const handleDaySelect = useCallback((day: Date | undefined) => {
    if (day) {
      onChange(endOfDay(day));
      setIsOpen(false);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`
            inline-flex items-center gap-1
            text-sm text-primary hover:text-primary/80
            min-h-[44px] px-2
            rounded-md hover:bg-muted/50
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`Due date: ${format(value, 'MMM d')}. Click to change.`}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        >
          {format(value, 'MMM d')}
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Choose due date"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick shortcuts */}
        <div className="flex gap-1 p-2 border-b border-border">
          {quickOptions.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              size="sm"
              className="flex-1 h-9"
              onClick={() => handleQuickSelect(option)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Calendar */}
        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleDaySelect}
          className="p-2"
          classNames={{
            day_selected: 'bg-primary text-primary-foreground',
            day_today: 'bg-accent text-accent-foreground',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
```

**Run test (should pass):**
```bash
npm test -- src/atomic-crm/dashboard/v3/components/__tests__/InlineDatePicker.test.tsx
```

**Constitution Checklist:**
- [x] No retry logic
- [x] No direct Supabase import
- [x] Uses semantic Tailwind tokens
- [x] 44px touch targets (min-h-[44px])
- [x] Accessible (aria-* attributes)

---

### Task 1.3: Update useMyTasks to Fetch Principal Data

**File:** `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` (MODIFY)

**TDD: Write failing test first**

```typescript
// Add to src/atomic-crm/dashboard/v3/hooks/__tests__/useMyTasks.test.ts

describe('useMyTasks - principal data', () => {
  it('includes principal info in task relatedTo when opportunity has principal', async () => {
    // Mock task with opportunity that has principal
    const mockTaskWithPrincipal = {
      id: 1,
      title: 'Follow up',
      due_date: '2025-12-05',
      priority: 'high',
      type: 'call',
      completed: false,
      opportunity_id: 100,
      opportunity: {
        id: 100,
        name: 'Test Opportunity',
        principal: {
          id: 1,
          name: 'US Foods',
        },
      },
    };

    // Setup mock to return this data
    // ... (mock setup depends on existing test patterns)

    const { result } = renderHook(() => useMyTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const task = result.current.tasks[0];
    expect(task.relatedTo.principal).toEqual({
      id: 1,
      name: 'US Foods',
    });
  });

  it('handles tasks without principal gracefully', async () => {
    // Mock personal task with no opportunity
    const mockPersonalTask = {
      id: 2,
      title: 'Personal reminder',
      due_date: '2025-12-05',
      priority: 'medium',
      type: 'other',
      completed: false,
    };

    // ... (mock setup)

    const { result } = renderHook(() => useMyTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const task = result.current.tasks[0];
    expect(task.relatedTo.principal).toBeUndefined();
  });
});
```

**Implementation changes to useMyTasks.ts:**

1. Update the query to expand principal through opportunity:

```typescript
// Line 26-43: Update useGetList meta.expand
const {
  data: rawTasks = [],
  isLoading: loading,
  error: fetchError,
  refetch: _refetch,
} = useGetList<TaskApiResponse>(
  "tasks",
  {
    filter: {
      sales_id: salesId,
      completed: false,
      "deleted_at@is": null,
    },
    sort: { field: "due_date", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
    meta: {
      // CHANGED: Added principal expansion through opportunity
      expand: ["opportunity.principal", "contact", "organization"],
    },
  },
  {
    enabled: !salesLoading && !!salesId,
    staleTime: 5 * 60 * 1000,
  }
);
```

2. Update the TaskApiResponse type in types.ts:

```typescript
// In src/atomic-crm/dashboard/v3/types.ts - Update TaskApiResponse
export interface TaskApiResponse {
  id: number;
  subject: string;
  due_date: string;
  priority: string;
  type: string;
  completed: boolean;
  notes?: string;
  sales_id: number;
  opportunity_id?: number;
  contact_id?: number;
  organization_id?: number;
  // CHANGED: Added principal to opportunity expansion
  opportunity?: {
    id: number;
    name: string;
    principal?: {
      id: number;
      name: string;
    };
  };
  contact?: { id: number; name: string };
  organization?: { id: number; name: string };
}
```

3. Update RelatedEntity type:

```typescript
// In src/atomic-crm/dashboard/v3/types.ts - Update RelatedEntity
export interface RelatedEntity {
  type: "opportunity" | "contact" | "organization" | "personal";
  name: string;
  id: number;
  principal?: {
    id: number;
    name: string;
  };
}
```

4. Update the task mapping in useMyTasks:

```typescript
// Line 82-106: Update return object to include principal
return {
  id: task.id,
  subject: task.title || "Untitled Task",
  dueDate,
  priority: (task.priority || "medium") as TaskItem["priority"],
  taskType: taskTypeMap[task.type?.toLowerCase()] || "Other",
  relatedTo: {
    type: task.opportunity_id
      ? "opportunity"
      : task.contact_id
        ? "contact"
        : task.organization_id
          ? "organization"
          : "personal",
    name:
      task.opportunity?.name ||
      task.contact?.name ||
      task.organization?.name ||
      "Personal Task",
    id: task.opportunity_id || task.contact_id || task.organization_id || 0,
    // ADDED: Include principal data when available
    principal: task.opportunity?.principal,
  },
  status,
  notes: task.description,
};
```

**Constitution Checklist:**
- [x] No retry logic
- [x] Data through unifiedDataProvider (via useGetList)
- [x] TypeScript interfaces for object shapes

---

## PARALLEL GROUP 2: Integration

### Task 2.1: Refactor TaskKanbanCard

**File:** `src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx` (MODIFY)

**TDD: Write failing test first**

```typescript
// Add to src/atomic-crm/dashboard/v3/components/__tests__/TaskKanbanCard.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { TaskKanbanCard } from '../TaskKanbanCard';
import type { TaskItem } from '../../types';

// Helper to render with DnD context
const renderWithDnD = (ui: React.ReactElement) => {
  return render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {ui}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

describe('TaskKanbanCard - Ribbon Layout', () => {
  const mockTask: TaskItem = {
    id: 1,
    subject: 'Follow up with Hilton',
    dueDate: new Date('2025-12-05'),
    priority: 'high',
    taskType: 'Call',
    status: 'today',
    relatedTo: {
      type: 'opportunity',
      name: 'Hilton Deal',
      id: 100,
      principal: {
        id: 1,
        name: 'US Foods',
      },
    },
  };

  const mockHandlers = {
    onComplete: vi.fn(),
    onSnooze: vi.fn(),
    onDelete: vi.fn(),
    onView: vi.fn(),
    onDateChange: vi.fn(),
  };

  it('displays principal color ribbon', () => {
    const { container } = renderWithDnD(
      <TaskKanbanCard task={mockTask} index={0} {...mockHandlers} />
    );

    const ribbon = container.querySelector('[data-testid="principal-ribbon"]');
    expect(ribbon).toBeInTheDocument();
    expect(ribbon).toHaveClass('border-l-4');
  });

  it('displays principal name in metadata row', () => {
    renderWithDnD(
      <TaskKanbanCard task={mockTask} index={0} {...mockHandlers} />
    );

    expect(screen.getByText('US Foods')).toBeInTheDocument();
  });

  it('shows inline date picker instead of static date', () => {
    renderWithDnD(
      <TaskKanbanCard task={mockTask} index={0} {...mockHandlers} />
    );

    // Should find a button with the date
    expect(screen.getByRole('button', { name: /dec 5/i })).toBeInTheDocument();
  });

  it('calls onDateChange when date is changed via picker', async () => {
    const user = userEvent.setup();
    renderWithDnD(
      <TaskKanbanCard task={mockTask} index={0} {...mockHandlers} />
    );

    // Click date to open picker
    await user.click(screen.getByRole('button', { name: /dec 5/i }));

    // Click "Tomorrow" quick action
    await user.click(screen.getByRole('button', { name: 'Tomorrow' }));

    expect(mockHandlers.onDateChange).toHaveBeenCalled();
  });

  it('displays task type icon and priority in metadata row', () => {
    renderWithDnD(
      <TaskKanbanCard task={mockTask} index={0} {...mockHandlers} />
    );

    // Check for metadata row with separator pattern
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('renders default ribbon for tasks without principal', () => {
    const personalTask: TaskItem = {
      ...mockTask,
      relatedTo: {
        type: 'personal',
        name: 'Personal Task',
        id: 0,
        // No principal
      },
    };

    const { container } = renderWithDnD(
      <TaskKanbanCard task={personalTask} index={0} {...mockHandlers} />
    );

    const ribbon = container.querySelector('[data-testid="principal-ribbon"]');
    expect(ribbon).toHaveClass('border-l-muted-foreground');
  });
});
```

**Implementation - Updated TaskKanbanCard.tsx:**

```typescript
// src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx

import React, { useState, memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { useNotify } from "react-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  Mail,
  Users,
  FileText,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  AlarmClock,
  Presentation,
  FileSignature,
} from "lucide-react";
import type { TaskItem } from "../types";
import { showFollowUpToast } from "../utils/showFollowUpToast";
import { InlineDatePicker } from "./InlineDatePicker";
import { getPrincipalColor } from "../constants/principalColors";

interface TaskKanbanCardProps {
  task: TaskItem;
  index: number;
  onComplete: (taskId: number) => Promise<void>;
  onSnooze: (taskId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onView: (taskId: number) => void;
  onDateChange: (taskId: number, newDate: Date) => Promise<void>;
}

/**
 * Priority color mappings using semantic Tailwind classes
 */
const priorityColors = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning/10 text-warning",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
} as const;

/**
 * Task type icon mapping
 */
const getTaskIcon = (type: TaskItem["taskType"]) => {
  const iconClass = "h-3.5 w-3.5 shrink-0";
  switch (type) {
    case "Call":
      return <Phone className={iconClass} />;
    case "Email":
      return <Mail className={iconClass} />;
    case "Meeting":
      return <Users className={iconClass} />;
    case "Follow-up":
      return <CheckCircle2 className={iconClass} />;
    case "Demo":
      return <Presentation className={iconClass} />;
    case "Proposal":
      return <FileSignature className={iconClass} />;
    case "Other":
    default:
      return <FileText className={iconClass} />;
  }
};

/**
 * Custom comparison function for React.memo optimization
 */
function arePropsEqual(prevProps: TaskKanbanCardProps, nextProps: TaskKanbanCardProps): boolean {
  if (prevProps.index !== nextProps.index) return false;
  if (prevProps.onComplete !== nextProps.onComplete) return false;
  if (prevProps.onSnooze !== nextProps.onSnooze) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  if (prevProps.onView !== nextProps.onView) return false;
  if (prevProps.onDateChange !== nextProps.onDateChange) return false;

  const prev = prevProps.task;
  const next = nextProps.task;

  return (
    prev.id === next.id &&
    prev.subject === next.subject &&
    prev.status === next.status &&
    prev.priority === next.priority &&
    prev.taskType === next.taskType &&
    prev.dueDate.getTime() === next.dueDate.getTime() &&
    prev.relatedTo.name === next.relatedTo.name &&
    prev.relatedTo.principal?.id === next.relatedTo.principal?.id
  );
}

/**
 * TaskKanbanCard - Draggable task card with Contextual Ribbon Layout
 *
 * Features:
 * - Principal color ribbon (4px left border)
 * - Inline date picker with quick shortcuts
 * - Information hierarchy: Title → Metadata (Principal · Type · Priority · Date)
 * - 44px minimum touch targets
 */
export const TaskKanbanCard = memo(function TaskKanbanCard({
  task,
  index,
  onComplete,
  onSnooze,
  onDelete,
  onView,
  onDateChange,
}: TaskKanbanCardProps) {
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const notify = useNotify();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-action-button]")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onView(task.id);
  };

  const handleSnooze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSnoozing(true);
    try {
      await onSnooze(task.id);
      notify("Task snoozed for tomorrow", { type: "success" });
    } catch {
      notify("Failed to snooze task", { type: "error" });
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      notify("Task deleted", { type: "success" });
    } catch {
      notify("Failed to delete task", { type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDateChange = async (newDate: Date) => {
    try {
      await onDateChange(task.id, newDate);
      notify("Due date updated", { type: "success" });
    } catch {
      notify("Failed to update due date", { type: "error" });
    }
  };

  const handleEdit = () => {
    window.location.href = `/#/tasks/${task.id}`;
  };

  const priorityClass =
    priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium;

  const ribbonColor = getPrincipalColor(task.relatedTo.principal?.id);
  const principalName = task.relatedTo.principal?.name;

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="article"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick(e as unknown as React.MouseEvent);
            }
          }}
          className={`
            relative
            bg-card rounded-lg border border-border
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            cursor-pointer
            ${snapshot.isDragging ? "opacity-60 rotate-1 shadow-lg" : "opacity-100"}
          `}
          data-testid="task-kanban-card"
        >
          {/* Principal Color Ribbon */}
          <div
            data-testid="principal-ribbon"
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg border-l-4 ${ribbonColor}`}
          />

          {/* Card Content with left padding for ribbon */}
          <div className="pl-4 pr-3 py-3">
            {/* Header: Checkbox + Subject + Actions */}
            <div className="flex items-start gap-2">
              {/* Checkbox - 44px touch target */}
              <div
                data-action-button
                className="flex h-11 w-11 shrink-0 items-center justify-center -ml-2 -mt-1"
              >
                <Checkbox
                  className="h-5 w-5"
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      try {
                        await onComplete(task.id);
                        showFollowUpToast({
                          task,
                          onCreateFollowUp: (completedTask) => {
                            const params = new URLSearchParams();
                            params.set("type", "follow_up");
                            params.set("title", `Follow-up: ${completedTask.subject}`);
                            if (completedTask.relatedTo.type === "opportunity") {
                              params.set("opportunity_id", String(completedTask.relatedTo.id));
                            } else if (completedTask.relatedTo.type === "contact") {
                              params.set("contact_id", String(completedTask.relatedTo.id));
                            }
                            window.location.href = `/#/tasks/create?${params.toString()}`;
                          },
                        });
                      } catch {
                        notify("Failed to complete task", { type: "error" });
                      }
                    }
                  }}
                  aria-label={`Complete task: ${task.subject}`}
                />
              </div>

              {/* Subject */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground line-clamp-2">
                  {task.subject}
                </h3>
              </div>

              {/* Actions */}
              <div data-action-button className="flex items-center gap-0.5 shrink-0 -mr-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 p-0"
                  onClick={handleSnooze}
                  disabled={isSnoozing}
                  title="Snooze task by 1 day"
                  aria-label={`Snooze "${task.subject}" by 1 day`}
                >
                  {isSnoozing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlarmClock className="h-4 w-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 p-0"
                      aria-label={`More actions for "${task.subject}"`}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(task.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Metadata Row: Principal · Type · Priority · Date */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground flex-wrap">
              {principalName && (
                <>
                  <span className="font-medium text-foreground/80">{principalName}</span>
                  <span className="text-border">·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1">
                {getTaskIcon(task.taskType)}
                {task.taskType}
              </span>
              <span className="text-border">·</span>
              <Badge className={`text-xs py-0 h-5 ${priorityClass}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
              <span className="text-border">·</span>
              <div data-action-button>
                <InlineDatePicker
                  value={task.dueDate}
                  onChange={handleDateChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}, arePropsEqual);
```

**Update TasksKanbanPanel to pass onDateChange:**

```typescript
// In src/atomic-crm/dashboard/v3/components/TasksKanbanPanel.tsx
// Add updateTaskDueDate to the useMyTasks destructure and pass to cards

const { tasks, loading, error, completeTask, snoozeTask, deleteTask, viewTask, updateTaskDueDate } = useMyTasks();

// Then in TaskKanbanCard usage:
<TaskKanbanCard
  key={task.id}
  task={task}
  index={index}
  onComplete={completeTask}
  onSnooze={snoozeTask}
  onDelete={deleteTask}
  onView={handleViewTask}
  onDateChange={updateTaskDueDate}  // ADD THIS
/>
```

**Constitution Checklist:**
- [x] No retry logic (errors throw to boundary)
- [x] No direct Supabase import
- [x] Uses semantic Tailwind tokens
- [x] 44px touch targets
- [x] Accessible (role="article", aria-labels)

---

## PARALLEL GROUP 3: Testing

### Task 3.1: Complete Unit Test Suite

Run all unit tests to verify implementation:

```bash
npm test -- --run src/atomic-crm/dashboard/v3/
```

Expected output:
- All principalColors tests pass
- All InlineDatePicker tests pass
- All TaskKanbanCard tests pass
- All useMyTasks tests pass

### Task 3.2: E2E Test

**File:** `tests/e2e/tasks/inline-date-picker.spec.ts` (NEW)

```typescript
// tests/e2e/tasks/inline-date-picker.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Task Inline Date Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    // Wait for dashboard to load
    await expect(page.getByRole('tab', { name: /my tasks/i })).toBeVisible();
    await page.getByRole('tab', { name: /my tasks/i }).click();
  });

  test('displays principal color ribbon on task cards', async ({ page }) => {
    // Wait for tasks to load
    const taskCard = page.getByRole('article').first();
    await expect(taskCard).toBeVisible();

    // Check ribbon exists
    const ribbon = taskCard.locator('[data-testid="principal-ribbon"]');
    await expect(ribbon).toBeVisible();
  });

  test('opens date picker on date click', async ({ page }) => {
    const taskCard = page.getByRole('article').first();
    await expect(taskCard).toBeVisible();

    // Find and click the date button
    const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });
    await dateButton.click();

    // Verify dialog opened
    await expect(page.getByRole('dialog', { name: /choose due date/i })).toBeVisible();
  });

  test('shows quick action shortcuts in date picker', async ({ page }) => {
    const taskCard = page.getByRole('article').first();
    const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });
    await dateButton.click();

    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tomorrow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Wk' })).toBeVisible();
  });

  test('reschedules task using quick action', async ({ page }) => {
    const taskCard = page.getByRole('article').first();
    const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });

    // Get initial date text
    const initialDate = await dateButton.textContent();

    // Open picker and click Tomorrow
    await dateButton.click();
    await page.getByRole('button', { name: 'Tomorrow' }).click();

    // Verify picker closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify success notification
    await expect(page.getByText(/due date updated/i)).toBeVisible();
  });

  test('closes date picker on Escape', async ({ page }) => {
    const taskCard = page.getByRole('article').first();
    const dateButton = taskCard.getByRole('button', { name: /\w{3} \d{1,2}/i });

    await dateButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('displays principal name in task metadata', async ({ page }) => {
    // Find a task card that should have a principal
    const taskCard = page.getByRole('article').first();
    await expect(taskCard).toBeVisible();

    // The metadata row should contain principal name, type, priority, date
    // Check for the dot separator pattern
    await expect(taskCard.locator('text=·')).toHaveCount({ minimum: 2 });
  });
});
```

**Run E2E tests:**
```bash
npx playwright test tests/e2e/tasks/inline-date-picker.spec.ts
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `npm run build` completes without errors
- [ ] `npm test` passes all tests
- [ ] `npx playwright test` passes E2E tests
- [ ] Manual verification in browser:
  - [ ] Task cards show colored left ribbon
  - [ ] Clicking date opens inline picker
  - [ ] Today/Tomorrow/Next Wk shortcuts work
  - [ ] Calendar date selection works
  - [ ] Principal name appears in metadata
  - [ ] Touch targets are 44px (test on iPad or Chrome DevTools)

---

## Rollback Plan

If issues arise:

1. Revert TaskKanbanCard.tsx to previous version
2. Remove new files:
   - `src/atomic-crm/dashboard/v3/constants/principalColors.ts`
   - `src/atomic-crm/dashboard/v3/components/InlineDatePicker.tsx`
3. Revert types.ts changes (remove principal from RelatedEntity)
4. Revert useMyTasks.ts expand change

---

## Files Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/atomic-crm/dashboard/v3/constants/principalColors.ts` | CREATE | ~40 |
| `src/atomic-crm/dashboard/v3/constants/__tests__/principalColors.test.ts` | CREATE | ~50 |
| `src/atomic-crm/dashboard/v3/components/InlineDatePicker.tsx` | CREATE | ~120 |
| `src/atomic-crm/dashboard/v3/components/__tests__/InlineDatePicker.test.tsx` | CREATE | ~100 |
| `src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx` | MODIFY | ~80 changed |
| `src/atomic-crm/dashboard/v3/components/__tests__/TaskKanbanCard.test.tsx` | MODIFY | ~60 added |
| `src/atomic-crm/dashboard/v3/types.ts` | MODIFY | ~10 changed |
| `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` | MODIFY | ~5 changed |
| `src/atomic-crm/dashboard/v3/components/TasksKanbanPanel.tsx` | MODIFY | ~3 changed |
| `tests/e2e/tasks/inline-date-picker.spec.ts` | CREATE | ~80 |

**Total Estimated Changes:** ~550 lines
