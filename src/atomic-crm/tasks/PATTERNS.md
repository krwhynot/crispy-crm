# Task Component Patterns

Standard patterns for task management in Crispy CRM.

## Component Hierarchy

```
Task Lifecycle Flow:
+-------------------------------------------------------------------------+
|                           TASK LIFECYCLE                                 |
+-------------------------------------------------------------------------+
|                                                                          |
|  TaskCreate ----------> TaskList ----------> TaskSlideOver --> TaskEdit  |
|       |                    |                      |                |     |
|       v                    v                      v                v     |
|  TaskInputs          TaskDatagrid          Details Tab       TaskInputs |
|  TaskCompactForm     (PremiumDatagrid)     (view/edit)       (edit)     |
|  (Sectioned form)          |               single tab                   |
|       |                    v                      |                     |
|       v               Task.tsx                    v                     |
|  FormSection          (Row + Menu)         TaskHierarchy-               |
|  WithProgress              |               Breadcrumb                   |
|                            v                                            |
|                   TaskActionMenu                                        |
|                   (Snooze / Delete)                                      |
|                                                                          |
|  AddTask (Dialog) --- Quick-create from Contact/Opportunity views       |
|  TaskShow         --- Full-page read-only detail view                   |
|  TaskEmpty        --- Empty state for TaskList                          |
|  TaskListFilter   --- Sidebar filter panel (date, status, assigned)     |
|  resource.tsx     --- Lazy-loaded view wrappers + recordRepresentation  |
|  taskRoutes.ts    --- Slide-over URL helpers (hash-router navigation)   |
+-------------------------------------------------------------------------+

Data Flow:
+------------+    +----------------------+    +-----------------+
|   Forms    |--->| composedDataProvider |--->|    Supabase     |
|            |    |  (Zod validation)    |    |   (PostgreSQL)  |
+------------+    +----------------------+    +-----------------+
                          |
                          v
                 +------------------+
                 |  taskSchema.ts   |
                 |  (strictObject)  |
                 +------------------+
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

Checkbox toggle with ISO timestamps and inline cache invalidation.

```tsx
// Task.tsx - Completion toggle handler
const handleCheck = (checked: boolean) => {
  update("tasks", {
    id: task.id,
    data: {
      id: task.id, // Include ID to trigger partial update validation
      completed: checked,
      completed_at: checked ? new Date().toISOString() : null,
    },
    previousData: task,
  });
};

// useEffect for targeted cache invalidation after non-completion updates
useEffect(() => {
  // Skip invalidation for completion toggles (completed_at changes)
  if (isUpdatePending || !isSuccess || variables?.data?.completed_at != undefined) {
    return;
  }

  queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
}, [queryClient, isUpdatePending, isSuccess, variables]);
```

**When to use**: Task completion with cache-aware state management.

**Key concepts:**
- Timestamp completion with ISO string (`new Date().toISOString()`)
- `useEffect` guards: only invalidate caches for non-completion updates (e.g., postpone)
- Completion toggling relies on React Admin's optimistic update cycle (no manual invalidation)
- Include `id` in data for partial update validation (Zod strictObject)
- `previousData` enables optimistic updates with rollback

---

## Pattern C: Snoozing/Postponing

Smart date calculations for postponement actions. Two competing patterns exist:

### C.1: Due-Date Postponement (Task.tsx)

Modifies `due_date` directly. Used by the inline dropdown menu on task rows.

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

### C.2: Snooze-Until Postponement (TaskActionMenu.tsx)

Sets `snooze_until` instead of modifying `due_date`. Used by the reusable `TaskActionMenu`
component (Kanban, TaskList datagrid row actions).

```tsx
// TaskActionMenu.tsx - Snooze handler
const handlePostponeInternal = async (days: number) => {
  const newSnoozeDate = new Date();
  newSnoozeDate.setDate(newSnoozeDate.getDate() + days);
  newSnoozeDate.setHours(23, 59, 59, 999);

  await update(
    "tasks",
    {
      id: taskId,
      data: { snooze_until: newSnoozeDate.toISOString() },
      previousData: task,
    },
    { returnPromise: true }
  );

  queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
};
```

### C.3: Snooze Schema

```tsx
// Uses preprocess to handle empty string from forms -> null
snooze_until: z.preprocess(
  (val) => (val === "" ? null : val),
  z.coerce.date().nullable().optional()
), // NULL = active, future timestamp = snoozed
```

**When to use**: Postponing overdue tasks, implementing snooze functionality.

**Key concepts:**
- **C.1 (Task.tsx)**: Moves `due_date` forward, which changes the task's actual deadline
- **C.2 (TaskActionMenu.tsx)**: Sets `snooze_until`, which hides the task temporarily without changing `due_date`
- Spread existing task fields in update (required by Zod strictObject) for C.1 pattern
- C.2 sends only `snooze_until` (minimal payload) since `taskUpdateSchema` uses `.partial()`
- Format dates as `yyyy-MM-dd` (ISO string format for database)
- Conditional rendering in C.1: Only show options if task is already overdue
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
    removalGroup: "due_date_range",
  },
  {
    key: "due_date@lte",
    label: "Due before",
    type: "date-range",
    removalGroup: "due_date_range",
  },
  // Overdue filter (used by KPISummaryRow and TaskListFilter "Overdue" preset)
  {
    key: "due_date@lt",
    label: "Overdue",
    type: "boolean",
    formatLabel: () => "Overdue tasks",
  },
  // Task ID filter (used by TimelineEntry to link to specific task)
  {
    key: "id",
    label: "Task",
    type: "reference",
    reference: "tasks",
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

### D.1: Date Label Formatting (Planned Enhancement)

> **Note:** This helper function is not yet implemented. When added, it would provide
> human-readable labels for date filter chips (e.g., "Today", "This week").

```tsx
// PLANNED: Add to taskFilterConfig.ts when implementing date chip formatting
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
- `formatLabel()`: Custom formatting for chip display (optional per filter)
- `getTaskTypeChoices()`: Dynamic choices from ConfigurationContext
- Date filters use `@gte/@lte/@lt` operators for ranges and overdue detection
- `due_date@lt` filter is used by the "Overdue" preset in `TaskListFilter`
- `id` filter enables deep-linking from timeline entries to specific tasks

---

## Pattern E: Task Tabbed View

Slide-over with view/edit mode switching. The slide-over has a single "Details" tab.

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
              {record.completed_at && (
                <span className="text-xs text-muted-foreground">
                  on <DateField source="completed_at" options={{ dateStyle: "short" }} />
                </span>
              )}
            </label>
          </div>
        </SidepaneSection>

        {/* Schedule Section */}
        <SidepaneSection label="Schedule" showSeparator>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Due: </span>
              <DateField
                source="due_date"
                options={{ year: "numeric", month: "long", day: "numeric" }}
                className="font-medium"
              />
            </div>
            {record.reminder_date && (
              <div className="text-sm">
                <span className="text-muted-foreground">Reminder: </span>
                <DateField
                  source="reminder_date"
                  options={{ year: "numeric", month: "long", day: "numeric" }}
                  className="font-medium"
                />
              </div>
            )}
            {/* Snooze indicator - prominent icon indicator */}
            <SnoozeIndicator snoozeUntil={record.snooze_until} />
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
            {record.type && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge variant="outline">{record.type}</Badge>
              </div>
            )}
          </div>
        </SidepaneSection>

        {/* Assignment Section */}
        {record.sales_id && (
          <SidepaneSection label="Assigned To" showSeparator>
            <div className="text-sm">
              <ReferenceField source="sales_id" reference="sales">
                <SaleName />
              </ReferenceField>
            </div>
          </SidepaneSection>
        )}

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
            <TextInput source="title" label="Task Title" disabled={isLoading} />
            <TextInput source="description" label="Description" multiline rows={3}
              disabled={isLoading} />
            <DateInput source="due_date" label="Due Date" disabled={isLoading} />
            <DateInput source="reminder_date" label="Reminder Date" disabled={isLoading} />

            <SelectInput source="priority" label="Priority"
              choices={[
                { id: "low", name: "Low" },
                { id: "medium", name: "Medium" },
                { id: "high", name: "High" },
                { id: "critical", name: "Critical" },
              ]}
              disabled={isLoading}
            />

            <SelectInput source="type" label="Type"
              choices={taskTypes.map((type) => ({ id: type, name: type }))}
              disabled={isLoading}
            />

            <BooleanInput source="completed" label="Completed" disabled={isLoading} />

            <ReferenceInput source="sales_id" reference="sales"
              sort={{ field: "last_name", order: "ASC" }} disabled={isLoading}>
              <AutocompleteInput {...getQSearchAutocompleteProps()} label="Assigned To" />
            </ReferenceInput>

            <ReferenceInput source="contact_id" reference="contacts" disabled={isLoading}>
              <AutocompleteInput {...getQSearchAutocompleteProps()} label="Contact"
                optionText={contactOptionText} />
            </ReferenceInput>

            <ReferenceInput source="organization_id" reference="organizations"
              disabled={isLoading}>
              <AutocompleteInput {...getQSearchAutocompleteProps()} label="Organization"
                optionText="name" />
            </ReferenceInput>

            <ReferenceInput source="opportunity_id" reference="opportunities"
              disabled={isLoading}>
              <AutocompleteInput {...getQSearchAutocompleteProps()} label="Opportunity"
                optionText="name" />
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
    // PRE-VALIDATE before API call (passthrough preserves id, created_at, etc.)
    const result = taskUpdateSchema.safeParse({ ...data, id: record.id });

    if (!result.success) {
      const firstError = result.error.issues[0];
      notify(`${firstError.path.join(".")}: ${firstError.message}`, { type: "error" });
      logger.error("Task validation failed", result.error, {
        feature: "TaskSlideOverDetailsTab",
        taskId: record.id,
      });
      return;
    }

    await update(
      "tasks",
      {
        id: record.id,
        data: result.data,
        previousData: record,
      },
      { returnPromise: true }
    );
    await queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    await queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
    notify(notificationMessages.updated("Task"), { type: "success" });
    onModeToggle?.(); // Return to view mode after successful save
  } catch (error: unknown) {
    const message = extractProviderValidationMessage(error, {
      resource: "tasks",
      action: "update",
    });
    notify(message, { type: "error" });
    logger.error("Error updating task", error, {
      feature: "TaskSlideOverDetailsTab",
      taskId: record.id,
    });
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
- Pre-validation via `taskUpdateSchema.safeParse()` before API call
- `queryClient.invalidateQueries` for targeted cache invalidation
- `extractProviderValidationMessage` for user-friendly error messages
- View mode shows `completed_at`, `reminder_date`, `SnoozeIndicator`, `Type` badge, `Assigned To`
- Edit mode includes `DateInput`, `BooleanInput`, `organization_id`, `opportunity_id`

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
  });
```

### H.1: Zod Schema with strictObject

```tsx
export const taskSchema = z.strictObject({
  id: idSchema.optional(),
  title: z.string().trim().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(2000, "Description too long").nullable().optional(),
  due_date: z.preprocess(
    (val) => (val === null || val === undefined || val === "" ? undefined : val),
    z.coerce.date().optional()
  ),
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

  // Related task reference (links follow-up tasks to original completed task)
  related_task_id: idSchema.nullable().optional(),

  // Audit fields
  created_by: z.union([z.string().max(50), z.number()]).optional().nullable(),
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
- `due_date` uses `z.preprocess` to convert empty/null/undefined to `undefined`, then `z.coerce.date().optional()` -- the field is optional (no default in `getTaskDefaultValues`)
- `related_task_id`: Links follow-up tasks to their originating completed task

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
| Overdue | `boolean` | `@lt` | Today's date (via `due_date@lt`) |
| Task Reference | `reference` | `=` | `42` (task id, used by timeline deep-links) |
| Completion Status | `boolean` | `=` | `true` / `false` |
| Priority | `multiselect` | `in` | `["high", "critical"]` |
| Type | `multiselect` | `in` | `["Call", "Email"]` |
| Assigned To | `reference` | `=` | `123` (sales_id) |

### Postpone Approach Comparison

| Aspect | Task.tsx (C.1) | TaskActionMenu.tsx (C.2) |
|--------|----------------|--------------------------|
| Field modified | `due_date` | `snooze_until` |
| Effect | Changes actual deadline | Hides task temporarily |
| Payload | `...task` (full spread) | `{ snooze_until }` (minimal) |
| Used by | Inline row dropdown | Kanban card, datagrid row actions |
| Cache invalidation | Via `useEffect` guard | Explicit `queryClient.invalidateQueries` |

---

## Anti-Patterns

### 1. Orphaned Tasks (No Assignment)

```tsx
// WRONG: Task without sales_id
const badTask = {
  title: "Follow up with client",
  due_date: new Date(),
  // sales_id missing!
};

// CORRECT: Always include sales_id
const goodTask = {
  title: "Follow up with client",
  due_date: new Date(),
  sales_id: currentUser.id, // Required!
};
```

**Why**: `sales_id` is required in schema. Orphaned tasks break RLS policies and ownership queries.

### 2. Direct Supabase Access

```tsx
// WRONG: Direct Supabase client
import { supabase } from "@/lib/supabase";
const { data } = await supabase.from("tasks").select("*");

// CORRECT: Use React Admin hooks via data provider
import { useUpdate, useGetList } from "ra-core";
const [update] = useUpdate();
update("tasks", { id, data, previousData });
```

**Why**: Data provider centralizes validation, caching, and error handling.

### 3. Form-Level Validation

```tsx
// WRONG: Validation in form component
const validateTitle = (value: string) => {
  if (!value) return "Title required";
  if (value.length > 500) return "Too long";
};

// CORRECT: Zod at API boundary
// validation/task.ts
title: z.string().trim().min(1, "Title is required").max(500, "Title too long")
```

**Why**: Single source of truth. Schema validates on create/update, not per-form.

### 4. onChange Mode in Forms

```tsx
// WRONG: Validates on every keystroke
<Form mode="onChange">
  <TextInput source="title" />
</Form>

// CORRECT: Validate on blur or submit
<Form mode="onBlur">
  <TextInput source="title" />
</Form>
```

**Why**: `onChange` causes re-render storms. Use `onBlur` or `onSubmit` per Constitution.

### 5. Missing Touch Targets

```tsx
// WRONG: Small touch target
<AdminButton size="sm" className="h-6 w-6">
  <Icon className="h-3 w-3" />
</AdminButton>

// CORRECT: 44px minimum (WCAG AA)
<AdminButton size="icon" className="h-11 w-11">
  <Icon className="h-4 w-4" />
</AdminButton>
```

**Why**: iPad/touch users need 44x44px minimum targets.

### 6. Raw Color Values

```tsx
// WRONG: Hardcoded colors
<span className="text-gray-500">Due date</span>
<Badge className="bg-red-500">Overdue</Badge>

// CORRECT: Semantic tokens
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
  "Site Visit", // <-- Add here
  "Other",
]);
```

### 2. Add URL Type Mapping (Optional)

If creating tasks from URL params:

```tsx
// src/atomic-crm/tasks/TaskCreate.tsx
const URL_TYPE_MAP: Record<string, string> = {
  follow_up: "Follow-up",
  site_visit: "Site Visit", // <-- Add here
  // ...
};
```

### 3. Update ConfigurationContext

If types come from config:

```tsx
// src/atomic-crm/root/ConfigurationContext.tsx
const defaultTaskTypes = [
  "Call", "Email", "Meeting", "Follow-up",
  "Demo", "Proposal", "Site Visit", "Other" // <-- Add here
];
```

### 4. Add Icon Mapping (Optional, Not Yet Implemented)

If type-specific icons are needed, create a mapping component:

```tsx
// src/atomic-crm/tasks/TaskTypeIcon.tsx (create this file)
const TASK_TYPE_ICONS: Record<string, LucideIcon> = {
  Call: Phone,
  Email: Mail,
  "Site Visit": MapPin, // <-- Add here
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
| Date Calculations | `Task.tsx` | Postponement logic via `due_date` |
| Completion Toggle | `Task.tsx` | Checkbox + cache invalidation via `useEffect` |
| Postpone Menu | `Task.tsx` | Dropdown actions (modifies `due_date`) |
| Snooze Actions | `TaskActionMenu.tsx` | Reusable menu (modifies `snooze_until`) |
| Filter Config | `taskFilterConfig.ts` | FilterChipBar setup (8 filters) |
| Sidebar Filters | `TaskListFilter.tsx` | Collapsible filter panel (date, status, owner) |
| View/Edit Mode | `TaskSlideOverDetailsTab.tsx` | Slide-over content (single Details tab) |
| Slide-Over Shell | `TaskSlideOver.tsx` | Shell with breadcrumb + tab config |
| Hierarchy Breadcrumb | `TaskHierarchyBreadcrumb.tsx` | Parent entity navigation in slide-over header |
| Iterator Filter | `TasksIterator.tsx` | 5-minute completion window |
| Form Defaults | `validation/task.ts` | Schema-derived defaults |
| Zod Schema | `validation/task.ts` | strictObject validation |
| Form Inputs | `TaskInputs.tsx` | FormErrorSummary + TaskCompactForm wrapper |
| Compact Form | `TaskCompactForm.tsx` | Sectioned form (General + Details) |
| Full-page Create | `TaskCreate.tsx` | CreateBase + URL params + progress bar |
| Full-page Edit | `TaskEdit.tsx` | EditBase + dialog edit (standalone + inline) |
| Full-page Show | `TaskShow.tsx` | Read-only detail view (SectionCard) |
| Quick Add | `AddTask.tsx` | Dialog-based create from Contact views |
| List Page | `TaskList.tsx` | UnifiedListPageLayout + PremiumDatagrid |
| Empty State | `TaskEmpty.tsx` | EmptyState with Create button |
| Datagrid Headers | `TasksDatagridHeader.tsx` | Column label components |
| URL Helpers | `taskRoutes.ts` | Slide-over path builders + hash navigation |
| Resource Config | `resource.tsx` | Lazy-loaded views + recordRepresentation |
| Types | `types.ts` | Re-exports from `validation/task.ts` |
| Module Barrel | `index.tsx` | Re-exports from `resource.tsx` |

---

## File Reference

| File | Lines | Exports | Purpose |
|------|-------|---------|---------|
| `index.tsx` | 7 | Default resource config, named views | Module barrel re-exporting from `resource.tsx` |
| `resource.tsx` | 43 | `TaskListView`, `TaskEditView`, `TaskCreateView`, default config | Lazy-loaded view wrappers with `ResourceErrorBoundary` + `Suspense` |
| `types.ts` | 1 | `Task`, `TaskType`, `PriorityLevel` | Re-exports types from `validation/task.ts` |
| `Task.tsx` | 211 | `Task` (memo) | Single task row: checkbox, postpone menu, inline edit dialog |
| `TaskActionMenu.tsx` | 212 | `TaskActionMenu` | Reusable dropdown: view, edit, snooze, delete (Kanban + List) |
| `TaskList.tsx` | 426 | `TaskList` (default), `TaskDatagrid`, `CompletionCheckbox` | Full list page: `UnifiedListPageLayout` + `PremiumDatagrid` + CSV exporter |
| `TaskCreate.tsx` | 155 | `TaskCreate` (default) | Full-page create with URL pre-fill, progress bar, `createFormResolver` |
| `TaskEdit.tsx` | 68 | `TaskEdit` (default + named) | Full-page edit with `EditBase`, `createFormResolver(taskSchema)` |
| `TaskShow.tsx` | 99 | `TaskShow` (default) | Read-only detail: SectionCard with priority/type badges, references |
| `TaskSlideOver.tsx` | 65 | `TaskSlideOver` | Slide-over shell: single "Details" tab, breadcrumb, mode toggle |
| `TaskSlideOverDetailsTab.tsx` | 335 | `TaskSlideOverDetailsTab` | View/edit tab: pre-validation, cache invalidation, completion toggle |
| `TaskInputs.tsx` | 57 | `TaskInputs` | FormErrorSummary wrapper delegating to `TaskCompactForm` |
| `TaskCompactForm.tsx` | 158 | `TaskCompactForm` | Sectioned form: General (title, desc, dates) + Details (priority, type, refs) |
| `TasksIterator.tsx` | 38 | `TasksIterator` | Filtered list with 5-min completion undo window |
| `AddTask.tsx` | 207 | `AddTask` | Dialog-based quick-create from Contact/Opportunity context |
| `TaskListFilter.tsx` | 62 | `TaskListFilter` | Sidebar: Due Date (Today/This Week/Overdue), Status, Assigned To |
| `TaskEmpty.tsx` | 17 | `TaskEmpty` | Empty state with "New Task" `CreateButton` |
| `TaskHierarchyBreadcrumb.tsx` | 95 | `TaskHierarchyBreadcrumb` | Breadcrumb: Opportunity/Organization > Task (links to parent slide-over) |
| `taskFilterConfig.ts` | 99 | `TASK_FILTER_CONFIG` | 8 filter entries: due_date range/overdue, id, completed, priority, type, sales_id |
| `taskRoutes.ts` | 32 | `getTaskSlideOverPath`, `getTaskViewPath`, `getTaskEditPath`, `navigateToTaskSlideOver` | Hash-router URL builders for slide-over deep-linking |
| `TasksDatagridHeader.tsx` | 18 | `TaskTitleHeader`, `TaskPriorityHeader`, `TaskTypeHeader` | Column label components for datagrid |
| `hooks/index.ts` | 2 | (empty barrel) | Reserved for future task-specific hooks |
