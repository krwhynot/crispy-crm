# 02 – Molecules: Atoms Working Together

Molecules combine 2-5 atoms into reusable patterns. They have a single purpose but are more complex than atoms.

> **Key insight:** In this project, molecules often live inside organism files as internal components, or in dedicated files under `src/atomic-crm/dashboard/v3/components/`.

---

## Molecule Study Template

For each molecule:
1. Which atoms does it combine?
2. What's the data flow (props in → UI out)?
3. What's the layout pattern (flex, grid)?

---

## Key Molecules Studied

### `TaskGroup` – src/atomic-crm/dashboard/v3/components/TaskGroup.tsx

**What it does:** Collapsible section header for grouping tasks by time bucket (Overdue, Today, Tomorrow).

**Atoms used:**
- `ChevronRight` (Lucide icon) – Collapse indicator
- `cn()` utility – Class merging

**Props:**
```typescript
interface TaskGroupProps {
  title: string;           // "Overdue", "Today", "Tomorrow"
  variant: 'danger' | 'warning' | 'info' | 'default';
  count: number;           // Number of tasks in group
  children: React.ReactNode;  // The task items
  collapsed?: boolean;
  onToggle?: () => void;
}
```

**Variant styling (semantic colors):**
```typescript
const variantStyles = {
  danger: 'border-l-destructive text-destructive',   // Overdue
  warning: 'border-l-warning text-warning',          // Today
  info: 'border-l-primary text-primary',             // Tomorrow
  default: 'border-l-muted-foreground text-muted-foreground',
};
```

**Layout pattern:**
```tsx
<div className="border-l-4 pl-4">  {/* Left border indicates group */}
  <button className="flex items-center gap-2">
    <ChevronRight className={cn('rotate-90', collapsed && 'rotate-0')} />
    <h3>{title}</h3>
    <span>({count})</span>
  </button>
  {!collapsed && <div className="space-y-2">{children}</div>}
</div>
```

**Key technique:** Uses CSS transition on `rotate-90` for smooth collapse animation.

---

### `TaskItemComponent` – (inside TasksPanel.tsx:133-188)

**What it does:** Individual task row with completion checkbox, type icon, priority badge, and action buttons.

**Atoms used:**
- `Checkbox` – Task completion toggle
- `Badge` – Priority indicator
- `Button` – Action buttons (reschedule, more options)
- Lucide icons – Task type icons (Phone, Mail, Users, FileText)

**Props:**
```typescript
interface Props {
  task: TaskItem;
  onComplete: (taskId: number) => Promise<void>;
}
```

**Data flow:**
```
TaskItem data → Icon selection → Badge variant → Checkbox handler
     ↓              ↓                ↓              ↓
  task.taskType → getTaskIcon() → getPriorityColor() → onComplete()
```

**Layout pattern:**
```tsx
<div className="flex items-center gap-3 rounded-lg border px-3 py-2">
  {/* Left: Checkbox */}
  <Checkbox onCheckedChange={...} />

  {/* Center: Task info (flex-1 takes remaining space) */}
  <div className="flex-1">
    <div className="flex items-center gap-2">
      {getTaskIcon(task.taskType)}
      <span>{task.subject}</span>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant={...}>{task.priority}</Badge>
      <span>→ {task.relatedTo.name}</span>
    </div>
  </div>

  {/* Right: Action buttons */}
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="sm"><Clock /></Button>
    <Button variant="ghost" size="sm"><MoreHorizontal /></Button>
  </div>
</div>
```

**Key technique:** Uses `flex-1` on middle section to push action buttons to the right.

---

### `QuickLoggerPanel` – src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx

**What it does:** Container that toggles between empty state (CTA button) and form state.

**Atoms used:**
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Button`

**State management:**
```typescript
const [isLogging, setIsLogging] = useState(false);
```

**Conditional rendering pattern:**
```tsx
<CardContent>
  {!isLogging ? (
    // Empty state: Show CTA
    <div className="flex flex-col items-center py-8">
      <p>Capture your customer interactions...</p>
      <Button onClick={() => setIsLogging(true)}>
        <Plus /> New Activity
      </Button>
    </div>
  ) : (
    // Form state: Show QuickLogForm
    <QuickLogForm onComplete={() => setIsLogging(false)} />
  )}
</CardContent>
```

**Key technique:** The panel manages the toggle state, while `QuickLogForm` handles all form logic. Clean separation of concerns.

---

### Loading State Molecule Pattern

**Common across:** TasksPanel, PrincipalPipelineTable, QuickLogForm

**Pattern:**
```tsx
if (loading) {
  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader className="border-b">
        <Skeleton className="mb-2 h-6 w-32" />  {/* Title */}
        <Skeleton className="h-4 w-64" />        {/* Description */}
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Why this works:**
- Maintains same layout structure as loaded state
- Skeleton dimensions match expected content
- `[1,2,3].map()` creates realistic item placeholders

---

### Error State Molecule Pattern

**Common across:** TasksPanel, PrincipalPipelineTable

**Pattern:**
```tsx
if (error) {
  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load tasks</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Key technique:** Centers error message vertically using `flex items-center justify-center`.

---

## Molecule Composition Patterns

### 1. Icon Selection Function

```typescript
const getTaskIcon = (type: TaskItem['taskType']) => {
  switch(type) {
    case 'Call': return <Phone className="h-4 w-4" />;
    case 'Email': return <Mail className="h-4 w-4" />;
    case 'Meeting': return <Users className="h-4 w-4" />;
    case 'Follow-up': return <CheckCircle2 className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};
```

### 2. Variant Mapping Function

```typescript
const getPriorityColor = (priority: TaskItem['priority']) => {
  switch(priority) {
    case 'critical': return 'destructive';
    case 'high': return 'warning';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};
```

### 3. Trend Icon Rendering

```typescript
const renderMomentumIcon = (momentum: PrincipalPipelineRow['momentum']) => {
  switch (momentum) {
    case 'increasing': return <TrendingUp className="h-4 w-4 text-success" />;
    case 'decreasing': return <TrendingDown className="h-4 w-4 text-warning" />;
    case 'steady': return <Minus className="h-4 w-4 text-muted-foreground" />;
    case 'stale': return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
};
```

---

## Key Learnings

1. **Molecules often live inside organism files** – `TaskItemComponent` is defined in `TasksPanel.tsx`, not its own file

2. **Switch statements for variant selection** – Common pattern for icon/color mapping based on data

3. **Configuration objects** – Store related properties together (icon, color, label) for easy maintenance

4. **Loading/Error states** – Treat as first-class molecules, not afterthoughts

5. **Separation of concerns** – Container (manages state) vs. Presenter (displays data)

> Legacy molecules such as `PriorityIndicator`, `DashboardWidget`, and `PrincipalCardSkeleton` now live in `archive/dashboard` and are no longer part of the active V3 dashboard. Reference them only if you are studying the historical implementations.

---

## Study Checklist

- [x] `TaskGroup.tsx`
- [x] `TaskItemComponent` (in TasksPanel.tsx)
- [x] `QuickLoggerPanel.tsx`
- [x] Loading state pattern
- [x] Error state pattern
