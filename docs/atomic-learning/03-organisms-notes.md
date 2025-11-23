# 03 – Organisms: Full Sections of UI

Organisms are larger sections composed of multiple molecules and atoms. They are **self-contained UI regions** that often:
- Have their own data fetching (hooks)
- Handle their own loading/error states
- Manage local UI state

> **Key pattern:** In this project, organisms live in `src/atomic-crm/dashboard/v3/components/` and connect to data via custom hooks.

---

## Dashboard V3 Organisms

### `PrincipalPipelineTable` – src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx

**What it does:** Displays aggregated pipeline data grouped by Principal (parent organization), with momentum indicators showing activity trends.

**Components used:**
| Type | Components |
|------|------------|
| Atoms | Table, TableHeader, TableRow, TableCell, Badge, Button, Switch, Skeleton |
| Molecules | DropdownMenu (filter controls), Momentum icon renderer |

**Data source:**
```typescript
const { data, loading, error } = usePrincipalPipeline({ myPrincipalsOnly });
```

→ Queries `principal_pipeline_summary` database view

**Props:** None (self-contained, fetches own data)

**State management:**
```typescript
const [myPrincipalsOnly, setMyPrincipalsOnly] = useState(false);
```

**Structure:**
```tsx
<div className="flex h-full flex-col">
  {/* Header with title and filter toggle */}
  <div className="border-b pb-4">
    <h2>Pipeline by Principal</h2>
    <Switch checked={myPrincipalsOnly} onCheckedChange={setMyPrincipalsOnly} />
    <DropdownMenu>{/* Filter options */}</DropdownMenu>
  </div>

  {/* Scrollable table */}
  <div className="flex-1 overflow-auto">
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          <TableHead>Principal</TableHead>
          <TableHead>Pipeline</TableHead>
          <TableHead>This Week</TableHead>
          <TableHead>Last Week</TableHead>
          <TableHead>Momentum</TableHead>
          <TableHead>Next Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow key={row.id} className="table-row-premium cursor-pointer">
            {/* ... cells */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
```

**Key features:**
1. **Sticky header** – `sticky top-0 bg-background` keeps columns visible while scrolling
2. **Momentum visualization** – Icons (TrendingUp/Down/Minus/AlertCircle) with semantic colors
3. **Activity badges** – Show week-over-week comparison with Badge components
4. **Conditional rendering** – "Schedule follow-up" link when no next action

**Momentum icon rendering:**
```typescript
const renderMomentumIcon = (momentum: 'increasing' | 'decreasing' | 'steady' | 'stale') => {
  switch (momentum) {
    case 'increasing': return <TrendingUp className="text-success" />;
    case 'decreasing': return <TrendingDown className="text-warning" />;
    case 'steady': return <Minus className="text-muted-foreground" />;
    case 'stale': return <AlertCircle className="text-destructive" />;
  }
};
```

---

### `TasksPanel` – src/atomic-crm/dashboard/v3/components/TasksPanel.tsx

**What it does:** Displays the current user's tasks organized by time bucket (Overdue → Today → Tomorrow).

**Components used:**
| Type | Components |
|------|------------|
| Atoms | Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Checkbox, Button, Skeleton |
| Molecules | TaskGroup, TaskItemComponent (defined in same file) |

**Data source:**
```typescript
const { tasks, loading, error, completeTask } = useMyTasks();
```

→ Queries `tasks` table filtered by current user's `sales_id`

**Task filtering logic:**
```typescript
const overdueTasks = tasks.filter(t => t.status === 'overdue');
const todayTasks = tasks.filter(t => t.status === 'today');
const tomorrowTasks = tasks.filter(t => t.status === 'tomorrow');
```

**Structure:**
```tsx
<Card className="card-container flex h-full flex-col">
  <CardHeader className="border-b pb-3">
    <div className="flex items-start justify-between">
      <div>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>Today's priorities and upcoming activities</CardDescription>
      </div>
      {overdueTasks.length > 0 && (
        <Badge variant="destructive">{overdueTasks.length} overdue</Badge>
      )}
    </div>
  </CardHeader>

  <CardContent className="flex-1 overflow-auto p-0">
    <div className="space-y-4 p-4">
      {/* Overdue section - only shows if there are overdue tasks */}
      {overdueTasks.length > 0 && (
        <TaskGroup title="Overdue" variant="danger" count={overdueTasks.length}>
          {overdueTasks.map(task => <TaskItemComponent key={task.id} task={task} />)}
        </TaskGroup>
      )}

      {/* Today section - always shows */}
      <TaskGroup title="Today" variant="warning" count={todayTasks.length}>
        {todayTasks.map(task => <TaskItemComponent key={task.id} task={task} />)}
      </TaskGroup>

      {/* Tomorrow section */}
      <TaskGroup title="Tomorrow" variant="info" count={tomorrowTasks.length}>
        {tomorrowTasks.map(task => <TaskItemComponent key={task.id} task={task} />)}
      </TaskGroup>
    </div>
  </CardContent>
</Card>
```

**Key features:**
1. **Conditional overdue badge** – Header shows count only when there are overdue tasks
2. **Time-bucket grouping** – Clear visual separation with colored borders
3. **Checkbox completion** – `onComplete` callback updates task in database
4. **Overflow scrolling** – `flex-1 overflow-auto` enables scrolling within panel

---

### `QuickLogForm` – src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx

**What it does:** Multi-field form for logging customer interactions (calls, emails, meetings) with optional follow-up task creation.

**Components used:**
| Type | Components |
|------|------------|
| Atoms | Button, Input, Textarea, Select, Switch, Calendar |
| Molecules | Form (react-hook-form wrapper), Combobox (searchable dropdown), Popover |

**Data sources:**
```typescript
const dataProvider = useDataProvider();  // React Admin data provider
const notify = useNotify();              // Toast notifications
const { salesId } = useCurrentSale();    // Current user's sales ID

// Load related entities for comboboxes
const [contacts, setContacts] = useState([]);
const [organizations, setOrganizations] = useState([]);
const [opportunities, setOpportunities] = useState([]);
```

**Form setup with Zod validation:**
```typescript
const form = useForm<ActivityLogInput>({
  resolver: zodResolver(activityLogSchema),
  defaultValues: activityLogSchema.partial().parse({}),  // ← Zod generates defaults
});
```

**Form sections:**
1. **What happened?** – Activity type (Call/Email/Meeting), Outcome, Duration
2. **Who was involved?** – Contact, Organization, Opportunity (comboboxes)
3. **Notes** – Free-text description
4. **Follow-up** – Toggle + date picker for optional task creation

**Key features:**

**1. Auto-fill organization when contact selected:**
```typescript
onSelect={() => {
  field.onChange(contact.id);
  if (contact.organization_id) {
    form.setValue('organizationId', contact.organization_id);
  }
}}
```

**2. Conditional duration field:**
```typescript
const showDuration = form.watch('activityType') === 'Call' ||
                     form.watch('activityType') === 'Meeting';
```

**3. Save & New pattern:**
```typescript
const onSubmit = async (data: ActivityLogInput, closeAfterSave = true) => {
  // Create activity record
  await dataProvider.create('activities', { data: {...} });

  // Create follow-up task if requested
  if (data.createFollowUp && data.followUpDate) {
    await dataProvider.create('tasks', { data: {...} });
  }

  form.reset();
  if (closeAfterSave) onComplete();  // Close form
};

// Two submit buttons:
<Button type="submit">Save & Close</Button>
<Button onClick={() => form.handleSubmit(data => onSubmit(data, false))()}>
  Save & New
</Button>
```

**4. Combobox with searchable dropdown:**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox">
      {selectedValue || "Select contact"}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Search contact..." />
      <CommandEmpty>No contact found.</CommandEmpty>
      <CommandGroup>
        {contacts.map(contact => (
          <CommandItem value={contact.name} onSelect={() => {...}}>
            {contact.name}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  </PopoverContent>
</Popover>
```

---

## Dashboard V2 Organisms (Legacy)

> These components were removed from the active bundle when Dashboard V3 shipped. Copies live under `archive/dashboard/v2/` if you need to review historical patterns.

### `FiltersSidebar` – src/atomic-crm/dashboard/v2/components/FiltersSidebar.tsx

**What it does:** Collapsible filter sidebar for opportunities with health, stage, assignee, and last-touch filters.

**Key features:**
- Collapses to 0px width with rail toggle
- Filter state persisted via `usePrefs('pd.filters')`
- Active filter count badge

### `OpportunitiesHierarchy` – src/atomic-crm/dashboard/v2/components/OpportunitiesHierarchy.tsx

**What it does:** ARIA-compliant tree view showing Principal → Customer → Opportunity hierarchy.

**Key features:**
- Keyboard navigation (arrow keys)
- Expandable/collapsible nodes
- Selection state management

### `RightSlideOver` – src/atomic-crm/dashboard/v2/components/RightSlideOver.tsx

**What it does:** Detail panel that slides in from the right (40vw width, 480-720px).

**Key features:**
- Three tabs: Details, History, Files
- Keyboard shortcut: `Esc` to close, `H` for History tab

---

## Organism Patterns

### 1. Self-Contained Data Fetching

Each organism manages its own data:
```typescript
export function TasksPanel() {
  const { tasks, loading, error, completeTask } = useMyTasks();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <DataState data={tasks} />;
}
```

### 2. Three-State Rendering

Every data-fetching organism handles:
1. **Loading** – Skeleton placeholders
2. **Error** – Error message with details
3. **Success** – Normal render

### 3. Flex Column Layout

Standard panel structure:
```tsx
<div className="flex h-full flex-col">
  {/* Fixed header */}
  <div className="border-b pb-4">Header</div>

  {/* Scrollable content (flex-1 + overflow-auto) */}
  <div className="flex-1 overflow-auto">Content</div>
</div>
```

### 4. Card Container Pattern

```tsx
<Card className="card-container flex h-full flex-col">
  <CardHeader className="border-b">
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent className="flex-1 overflow-auto p-0">
    {/* Content */}
  </CardContent>
</Card>
```

---

## Key Learnings

1. **Organisms own their data** – Custom hooks encapsulate data fetching and mutations

2. **Three-state rendering** – Always handle loading, error, and success states

3. **Sticky headers** – Use `sticky top-0` for headers in scrollable regions

4. **Form validation with Zod** – `zodResolver(schema)` + `defaultValues: schema.partial().parse({})`

5. **Save & New pattern** – Pass `closeAfterSave` boolean to control form behavior

6. **Combobox = Popover + Command** – searchable dropdown built from shadcn primitives

---

## Study Checklist

- [x] `PrincipalPipelineTable.tsx`
- [x] `TasksPanel.tsx`
- [x] `QuickLogForm.tsx`
- [x] `QuickLoggerPanel.tsx`
- [ ] (Optional) Review archived V2 organisms in `archive/dashboard/v2/` for historical context
