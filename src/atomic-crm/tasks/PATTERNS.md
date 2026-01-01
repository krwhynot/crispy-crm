# Task Component Patterns

Standard patterns for task management in Crispy CRM.

## Component Hierarchy

```
Task Lifecycle Flow:
┌─────────────────────────────────────────────────────────────────────────┐
│                           TASK LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TaskCreate ──────► TaskList ──────► TaskSlideOver ──────► TaskEdit     │
│       │                 │                   │                   │        │
│       ▼                 ▼                   ▼                   ▼        │
│  TaskInputs        TasksIterator    ┌──────────────┐      TaskInputs    │
│  (Tabbed)          (Filtered)       │  Details Tab │      (Tabbed)      │
│       │                 │           │  Related Tab │           │        │
│       ▼                 ▼           └──────────────┘           ▼        │
│  TaskGeneralTab    Task.tsx                              TaskGeneralTab │
│  TaskDetailsTab    (Row + Menu)                          TaskDetailsTab │
│                         │                                               │
│                         ▼                                               │
│               QuickLogActivity                                          │
│               (Activity Logging)                                        │
└─────────────────────────────────────────────────────────────────────────┘

Data Flow:
┌────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Forms    │───►│ unifiedDataProvider │───►│    Supabase     │
│            │    │  (Zod validation)  │    │   (PostgreSQL)  │
└────────────┘    └──────────────────┘    └─────────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  taskSchema.ts   │
                 │  (strictObject)  │
                 └──────────────────┘
```

---

## Pattern A: Task State Management

Dropdown menu actions with date calculations for task management.

```tsx
// Task.tsx - Date calculations for postponement
import {
  addDays,
  addWeeks,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfToday,
  startOfWeek,
} from "date-fns";

const today = startOfToday();
const taskDueDate = parseDateSafely(task.due_date)
  ? startOfDay(parseDateSafely(task.due_date)!)
  : today;
const tomorrow = addDays(today, 1);

// Calculate next Monday (start of next week). weekStartsOn: 1 ensures Monday is the start.
const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

// Check if task can be postponed
const canPostponeTomorrow = !isAfter(taskDueDate, today);
const canPostponeNextWeek = isBefore(taskDueDate, nextMonday);

// Format dates for display using date-fns
const tomorrowFormatted = format(tomorrow, "EEE, MMM d");
const nextMondayFormatted = format(nextMonday, "EEE, MMM d");
```

**When to use**: Calculating smart postponement dates, determining menu visibility.

**Key concepts:**
- Use `date-fns` for all date math (no moment.js or manual calculations)
- `parseDateSafely()` handles null/undefined safely
- `startOfDay()` normalizes for comparisons
- `weekStartsOn: 1` enforces Monday as week start (business-friendly)

---

## Pattern B: Task Completion Flow

Checkbox toggle with ISO timestamps and activity logging workflow.

```tsx
// Task.tsx - Completion toggle handler
const handleCheck = (checked: boolean) => {
  update(
    "tasks",
    {
      id: task.id,
      data: {
        id: task.id, // Include ID to trigger partial update validation
        completed: checked,
        completed_at: checked ? new Date().toISOString() : null,
      },
      previousData: task,
    },
    {
      onSuccess: () => {
        // Only open activity dialog when task is being completed (not uncompleted)
        if (checked) {
          setOpenActivityDialog(true);
        }
      },
    }
  );
};

// Render activity dialog after completion
{openActivityDialog && (
  <QuickLogActivity
    open={openActivityDialog}
    onClose={handleCloseActivityDialog}
    task={task}
  />
)}
```

**When to use**: Task completion with follow-up workflows.

**Key concepts:**
- Timestamp completion with ISO string (`new Date().toISOString()`)
- Only show activity dialog on completion (not uncompleting)
- Include `id` in data for partial update validation (Zod strictObject)
- `previousData` enables optimistic updates with rollback

---

## Pattern C: Snoozing/Postponing

Smart date calculations for postponement actions.

### C.1: Dropdown Postponement

```tsx
{canPostponeTomorrow && (
  <DropdownMenuItem
    className="cursor-pointer"
    onClick={() => {
      update("tasks", {
        id: task.id,
        data: {
          ...task, // Include all existing task fields
          due_date: format(tomorrow, "yyyy-MM-dd"),
        },
        previousData: task,
      });
    }}
  >
    Postpone to tomorrow ({tomorrowFormatted})
  </DropdownMenuItem>
)}
{canPostponeNextWeek && (
  <DropdownMenuItem
    className="cursor-pointer"
    onClick={() => {
      update("tasks", {
        id: task.id,
        data: {
          ...task, // Include all existing task fields
          due_date: format(nextMonday, "yyyy-MM-dd"),
        },
        previousData: task,
      });
    }}
  >
    Postpone to next week ({nextMondayFormatted})
  </DropdownMenuItem>
)}
```

### C.2: Snooze Schema

```tsx
// Uses preprocess to handle empty string from forms → null
snooze_until: z.preprocess(
  (val) => (val === "" ? null : val),
  z.coerce.date().nullable().optional()
), // NULL = active, future timestamp = snoozed
```

**When to use**: Postponing overdue tasks, implementing snooze functionality.

**Key concepts:**
- Spread existing task fields in update (required by Zod strictObject)
- Format dates as `yyyy-MM-dd` (ISO string format for database)
- Conditional rendering: Only show options if task is already overdue
- `snooze_until = NULL` means task is active
- `snooze_until = future timestamp` means task is hidden until then

---

## Pattern D: Task Filtering

Multi-criteria filter configuration for FilterChipBar.

```tsx
// taskFilterConfig.ts
export const TASK_FILTER_CONFIG = validateFilterConfig([
  // PRIMARY FILTERS: Due date ranges first
  {
    key: "due_date@gte",
    label: "Due after",
    type: "date-range",
    formatLabel: formatDateLabel,
    removalGroup: "due_date_range",
  },
  {
    key: "due_date@lte",
    label: "Due before",
    type: "date-range",
    formatLabel: formatDateLabel,
    removalGroup: "due_date_range",
  },
  {
    key: "completed",
    label: "Status",
    type: "boolean",
    formatLabel: (value: unknown) => (value === true ? "Completed" : "Incomplete"),
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: PRIORITY_CHOICES,
  },
  {
    key: "type",
    label: "Type",
    type: "multiselect",
    // Dynamic choices from ConfigurationContext - callback pattern
    choices: getTaskTypeChoices,
  },
  {
    key: "sales_id",
    label: "Assigned To",
    type: "reference",
    reference: "sales",
  },
]);
```

### D.1: Date Label Formatting

```tsx
function formatDateLabel(value: unknown): string {
  if (!value || typeof value !== "string") return String(value);

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  if (isToday(date)) return "Today";
  if (isThisWeek(date)) return "This week";
  if (isThisMonth(date)) return "This month";
  return format(date, "MMM d, yyyy");
}
```

**When to use**: Configuring list filters, creating filter chips.

**Key concepts:**
- `removalGroup`: Removes conflicting filters (both date range filters together)
- `formatLabel()`: Custom formatting for chip display
- `getTaskTypeChoices()`: Dynamic choices from ConfigurationContext
- Date filters use `@gte/@lte` operators for ranges

---

## Pattern E: Task Tabbed View

Slide-over with view/edit mode switching.

### E.1: View Mode

```tsx
// View mode - display all task fields
return (
  <RecordContextProvider value={record}>
    <ScrollArea className="h-full">
      <div className="px-6 py-4">
        {/* Task Info Section */}
        <SidepaneSection label="Task">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{record.title}</h3>
            {record.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {record.description}
              </p>
            )}

            {/* Completion status - Interactive checkbox even in view mode */}
            {/* min-h-11 ensures 44px touch target for WCAG AA compliance */}
            <label className="flex items-center gap-2 pt-2 min-h-11 cursor-pointer">
              <input
                type="checkbox"
                checked={record.completed || false}
                onChange={(e) => handleCompletionToggle(e.target.checked)}
                className="h-4 w-4 rounded border-input"
                aria-label={
                  record.completed ? "Mark task as incomplete" : "Mark task as complete"
                }
              />
              <span className="text-sm font-medium">
                {record.completed ? "Completed" : "Mark as complete"}
              </span>
            </label>
          </div>
        </SidepaneSection>

        {/* Schedule Section */}
        <SidepaneSection label="Schedule" showSeparator>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Due: </span>
              <DateField source="due_date" className="font-medium" />
            </div>
          </div>
        </SidepaneSection>

        {/* Classification Section */}
        <SidepaneSection label="Classification" showSeparator>
          <div className="space-y-2">
            {record.priority && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <PriorityBadge priority={record.priority} />
              </div>
            )}
          </div>
        </SidepaneSection>

        <SidepaneMetadata createdAt={record.created_at} updatedAt={record.updated_at} />
      </div>
    </ScrollArea>
  </RecordContextProvider>
);
```

### E.2: Edit Mode

```tsx
if (mode === "edit") {
  return (
    <RecordContextProvider value={record}>
      <Form id="slide-over-edit-form" onSubmit={handleSave} record={record}>
        <DirtyStateTracker onDirtyChange={onDirtyChange} />
        <div className="space-y-6" role="form" aria-label="Edit task form">
          <div className="space-y-4">
            <TextInput source="title" label="Task Title" />
            <TextInput source="description" label="Description" multiline rows={3} />
            <TextInput source="due_date" label="Due Date" type="date" />

            <SelectInput
              source="priority"
              label="Priority"
              choices={[
                { id: "low", name: "Low" },
                { id: "medium", name: "Medium" },
                { id: "high", name: "High" },
                { id: "critical", name: "Critical" },
              ]}
            />

            <ReferenceInput source="sales_id" reference="sales">
              <AutocompleteInput label="Assigned To" />
            </ReferenceInput>
          </div>
        </div>
      </Form>
    </RecordContextProvider>
  );
}
```

### E.3: Save Handler

```tsx
const handleSave = async (data: Partial<Task>) => {
  try {
    await update("tasks", {
      id: record.id,
      data,
      previousData: record,
    });
    notify("Task updated successfully", { type: "success" });
    onModeToggle?.(); // Return to view mode after successful save
  } catch (error) {
    notify("Error updating task", { type: "error" });
    console.error("Save error:", error);
  }
};
```

**When to use**: Slide-over detail views with inline editing.

**Key concepts:**
- `DirtyStateTracker` monitors form changes for unsaved warning
- Interactive checkbox even in view mode (inline completion)
- `min-h-11` ensures 44px touch target
- `SidepaneSection` with `showSeparator` for visual structure
- Return to view mode on successful save

---

## Pattern F: Related Items Linking

Read-only tab showing associated entities.

```tsx
// TaskRelatedItemsTab.tsx
export function TaskRelatedItemsTab({ record }: TaskRelatedItemsTabProps) {
  const hasRelationships =
    record.organization_id || record.contact_id || record.opportunity_id || record.sales_id;

  return (
    <RecordContextProvider value={record}>
      <div className="space-y-6">
        {!hasRelationships && (
          <SidepaneEmptyState
            icon={Link}
            message="No related items. Add relationships in the Details tab."
          />
        )}

        {/* Related Organization */}
        {record.organization_id && (
          <SidepaneSection label="Related Organization">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-muted-foreground" />
                  <ReferenceField source="organization_id" reference="organizations" link="show">
                    <TextField source="name" className="font-medium" />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </SidepaneSection>
        )}

        {/* Related Contact */}
        {record.contact_id && (
          <SidepaneSection label="Related Contact">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserCircle className="size-5 text-muted-foreground" />
                  <ReferenceField source="contact_id" reference="contacts_summary" link="show">
                    <TextField source={contactOptionText} className="font-medium" />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </SidepaneSection>
        )}

        {/* Related Opportunity */}
        {record.opportunity_id && (
          <SidepaneSection label="Related Opportunity">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="size-5 text-muted-foreground" />
                  <ReferenceField source="opportunity_id" reference="opportunities" link="show">
                    <TextField source="title" className="font-medium" />
                  </ReferenceField>
                </div>
              </CardContent>
            </Card>
          </SidepaneSection>
        )}
      </div>
    </RecordContextProvider>
  );
}
```

**When to use**: Displaying associated entities in slide-overs.

**Key concepts:**
- Conditional rendering: Only show items that exist
- Empty state with icon and actionable message
- Icons from `lucide-react` for visual identification
- `link="show"` enables navigation to related records
- Cards with consistent padding for visual grouping

---

## Pattern G: Task Iterator Component

Filters completed tasks for undo UX.

```tsx
// TasksIterator.tsx
import { isAfter } from "date-fns";
import { useListContext } from "ra-core";
import { cn } from "@/lib/utils";
import { Task } from "./Task";
import { parseDateSafely } from "@/lib/date-utils";

export const TasksIterator = ({
  showContact,
  className,
}: {
  showContact?: boolean;
  className?: string;
}) => {
  const { data, error, isPending } = useListContext();
  if (isPending || error || data.length === 0) return null;

  // Filter: Show uncompleted tasks + recently completed (within 5 minutes)
  const tasks = data.filter((task) => {
    if (!task.completed_at) return true;
    const completedDate = parseDateSafely(task.completed_at);
    return completedDate ? isAfter(completedDate, new Date(Date.now() - 5 * 60 * 1000)) : true;
  });

  return (
    <div className={cn("space-y-2", className)}>
      {tasks.map((task) => (
        <Task task={task} showContact={showContact} key={task.id} />
      ))}
    </div>
  );
};
```

**When to use**: Rendering task lists with smart completion handling.

**Key concepts:**
- Reuses `Task` component for consistency
- 5-minute window: Recently completed tasks stay visible for undo
- Uses `useListContext` for data from parent `<List>`
- Optional `showContact` prop for context-aware display
- Early return on loading/error/empty

---

## Pattern H: Form Defaults

Schema-derived defaults following Engineering Constitution.

```tsx
// validation/task.ts
/**
 * Generate default values for task forms
 * Per Constitution: Form state from schema via .partial().parse({})
 */
export const getTaskDefaultValues = () =>
  taskSchema.partial().parse({
    completed: false,
    priority: "medium" as const,
    type: "Call" as const, // Meaningful default reduces cognitive load
    due_date: new Date(),
  });
```

### H.1: Zod Schema with strictObject

```tsx
export const taskSchema = z.strictObject({
  id: idSchema.optional(),
  title: z.string().trim().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(2000, "Description too long").nullable().optional(),
  due_date: z.coerce.date({ error: "Due date is required" }),
  reminder_date: z.coerce.date().nullable().optional(),
  completed: z.coerce.boolean().default(false),
  completed_at: z.string().max(50).nullable().optional(),
  priority: priorityLevelSchema.default("medium"),
  type: taskTypeSchema,
  contact_id: idSchema.nullable().optional(),
  opportunity_id: idSchema.nullable().optional(),
  organization_id: idSchema.nullable().optional(),
  sales_id: idSchema, // Required: task must be assigned

  // Snooze functionality
  snooze_until: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce.date().nullable().optional()
  ),

  // Audit fields
  created_by: z.union([z.string(), z.number()]).optional().nullable(),
  created_at: z.string().max(50).optional(),
  updated_at: z.string().max(50).optional(),
  deleted_at: z.string().max(50).optional().nullable(), // Soft-delete
});
```

### H.2: Derived Schemas

```tsx
// For creates: Omit system fields (auto-populated by DB)
export const taskCreateSchema = taskSchema.omit({
  id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

// For updates: Partial + passthrough for computed fields
export const taskUpdateSchema = taskSchema
  .partial()
  .passthrough() // Allow computed fields through - stripped by lifecycle callbacks
  .required({ id: true });
```

**When to use**: Form initialization, API validation.

**Key concepts:**
- `z.strictObject()`: Prevents mass assignment (security)
- `z.coerce`: Type coercion for form inputs
- `.max()` on all strings: DoS prevention
- `z.enum()`: Allowlist patterns (not denylist)
- `.partial().parse({})`: Derive defaults from schema
- Separate schemas: Create (omits system fields), Update (partial + passthrough)

---

## Comparison Tables

### Snooze Options vs Due Date Logic

| Action | Date Calculation | Condition to Show | Database Format |
|--------|------------------|-------------------|-----------------|
| Postpone Tomorrow | `addDays(today, 1)` | `taskDueDate <= today` | `yyyy-MM-dd` |
| Postpone Next Week | `startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })` | `taskDueDate < nextMonday` | `yyyy-MM-dd` |
| Snooze Until | Custom date picker | Always available | `TIMESTAMPTZ` |
| Clear Snooze | Set to `null` | When snoozed | `NULL` |

### Task View Modes

| Context | Component | State Management | Persistence |
|---------|-----------|------------------|-------------|
| List Row | `Task.tsx` | `useUpdate()` + inline | Immediate |
| Slide-over View | `TaskSlideOverDetailsTab` | Read-only + completion toggle | Immediate |
| Slide-over Edit | `TaskSlideOverDetailsTab` | `DirtyStateTracker` + Form | On submit |
| Full-page Edit | `TaskEdit.tsx` | `EditBase` + Form | On submit |
| Embedded Iterator | `TasksIterator.tsx` | Parent `<List>` context | Via `Task.tsx` |

### Filter Types

| Filter | Type | Operator | Example Value |
|--------|------|----------|---------------|
| Due Date Range | `date-range` | `@gte`, `@lte` | `2024-01-15` |
| Completion Status | `boolean` | `=` | `true` / `false` |
| Priority | `multiselect` | `in` | `["high", "critical"]` |
| Type | `multiselect` | `in` | `["Call", "Email"]` |
| Assigned To | `reference` | `=` | `123` (sales_id) |

---

## Anti-Patterns

### 1. Orphaned Tasks (No Assignment)

```tsx
// ❌ WRONG: Task without sales_id
const badTask = {
  title: "Follow up with client",
  due_date: new Date(),
  // sales_id missing!
};

// ✅ CORRECT: Always include sales_id
const goodTask = {
  title: "Follow up with client",
  due_date: new Date(),
  sales_id: currentUser.id, // Required!
};
```

**Why**: `sales_id` is required in schema. Orphaned tasks break RLS policies and ownership queries.

### 2. Missing Activity Logs

```tsx
// ❌ WRONG: Complete task without follow-up
const handleCheck = (checked: boolean) => {
  update("tasks", { id: task.id, data: { completed: checked } });
  // No activity dialog!
};

// ✅ CORRECT: Prompt for activity logging
const handleCheck = (checked: boolean) => {
  update("tasks", { ... }, {
    onSuccess: () => {
      if (checked) setOpenActivityDialog(true); // Prompt user
    },
  });
};
```

**Why**: Tasks often require follow-up activities. Prompting ensures activity tracking.

### 3. Direct Supabase Access

```tsx
// ❌ WRONG: Direct Supabase client
import { supabase } from "@/lib/supabase";
const { data } = await supabase.from("tasks").select("*");

// ✅ CORRECT: Use React Admin hooks via data provider
import { useUpdate, useGetList } from "ra-core";
const [update] = useUpdate();
update("tasks", { id, data, previousData });
```

**Why**: Data provider centralizes validation, caching, and error handling.

### 4. Form-Level Validation

```tsx
// ❌ WRONG: Validation in form component
const validateTitle = (value: string) => {
  if (!value) return "Title required";
  if (value.length > 500) return "Too long";
};

// ✅ CORRECT: Zod at API boundary
// validation/task.ts
title: z.string().trim().min(1, "Title is required").max(500, "Title too long")
```

**Why**: Single source of truth. Schema validates on create/update, not per-form.

### 5. onChange Mode in Forms

```tsx
// ❌ WRONG: Validates on every keystroke
<Form mode="onChange">
  <TextInput source="title" />
</Form>

// ✅ CORRECT: Validate on blur or submit
<Form mode="onBlur">
  <TextInput source="title" />
</Form>
```

**Why**: `onChange` causes re-render storms. Use `onBlur` or `onSubmit` per Constitution.

### 6. Missing Touch Targets

```tsx
// ❌ WRONG: Small touch target
<Button size="sm" className="h-6 w-6">
  <Icon className="h-3 w-3" />
</Button>

// ✅ CORRECT: 44px minimum (WCAG AA)
<Button size="icon" className="h-11 w-11">
  <Icon className="h-4 w-4" />
</Button>
```

**Why**: iPad/touch users need 44x44px minimum targets.

### 7. Raw Color Values

```tsx
// ❌ WRONG: Hardcoded colors
<span className="text-gray-500">Due date</span>
<Badge className="bg-red-500">Overdue</Badge>

// ✅ CORRECT: Semantic tokens
<span className="text-muted-foreground">Due date</span>
<Badge variant="destructive">Overdue</Badge>
```

**Why**: Semantic tokens ensure theme consistency and accessibility.

---

## Migration Checklist: Adding New Task Types

When adding a new task type (e.g., "Site Visit"):

### 1. Update Zod Enum

```tsx
// src/atomic-crm/validation/task.ts
export const taskTypeSchema = z.enum([
  "Call",
  "Email",
  "Meeting",
  "Follow-up",
  "Demo",
  "Proposal",
  "Site Visit", // ← Add here
  "Other",
]);
```

### 2. Add URL Type Mapping (Optional)

If creating tasks from URL params:

```tsx
// src/atomic-crm/tasks/TaskCreate.tsx
const URL_TYPE_MAP: Record<string, string> = {
  follow_up: "Follow-up",
  site_visit: "Site Visit", // ← Add here
  // ...
};
```

### 3. Update ConfigurationContext

If types come from config:

```tsx
// src/atomic-crm/root/ConfigurationContext.tsx
const defaultTaskTypes = [
  "Call", "Email", "Meeting", "Follow-up",
  "Demo", "Proposal", "Site Visit", "Other" // ← Add here
];
```

### 4. Add Icon Mapping (Optional)

If using type-specific icons:

```tsx
// src/atomic-crm/tasks/TaskTypeIcon.tsx
const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  Call: Phone,
  Email: Mail,
  "Site Visit": MapPin, // ← Add here
  // ...
};
```

### 5. Verify TypeScript

```bash
npx tsc --noEmit
```

### 6. Test Filter Dropdowns

1. Open TaskList
2. Click Type filter in column header
3. Verify new type appears in checkbox list
4. Create task with new type
5. Filter by new type

### 7. Update Documentation

Add to this PATTERNS.md if new type has special handling.

---

## Quick Reference

| Pattern | File | Purpose |
|---------|------|---------|
| Date Calculations | `Task.tsx` | Postponement logic |
| Completion Toggle | `Task.tsx` | Checkbox + activity dialog |
| Postpone Menu | `Task.tsx` | Dropdown actions |
| Filter Config | `taskFilterConfig.ts` | FilterChipBar setup |
| View/Edit Mode | `TaskSlideOverDetailsTab.tsx` | Slide-over content |
| Related Items | `TaskRelatedItemsTab.tsx` | Association display |
| Iterator Filter | `TasksIterator.tsx` | 5-minute completion window |
| Form Defaults | `validation/task.ts` | Schema-derived defaults |
| Zod Schema | `validation/task.ts` | strictObject validation |
