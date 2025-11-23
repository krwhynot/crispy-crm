# 05 – Flows: Multi-Step User Journeys

Flows describe how users move through multiple pages and components to accomplish goals. Understanding flows helps you see how atoms, molecules, organisms, and pages work together.

> **Key insight:** Each flow involves authentication, data fetching, user interaction, and data persistence.

---

## Flow 1: Login → Dashboard

**User goal:** Authenticate and reach the main dashboard.

### Steps

```
1. User visits http://localhost:5173/
   └── App.tsx → CRM.tsx → Admin (requireAuth)
       └── No session → Redirect to /login

2. User sees login form
   └── StartPage → LoginPage
       └── Email + password inputs
       └── "Forgot password?" link

3. User submits credentials
   └── authProvider.login(email, password)
       └── supabase.auth.signInWithPassword()
       └── On success: session stored in Supabase

4. Auth check passes
   └── authProvider.checkAuth()
       └── supabase.auth.getSession()
       └── Fetches sales record for user identity

5. Dashboard renders
   └── PrincipalDashboardV3
       └── Three organisms fetch their own data
```

### Key Files Involved

| Layer | File | Purpose |
|-------|------|---------|
| Page | `src/atomic-crm/login/StartPage.tsx` | Login entry point |
| Page | `src/components/admin/login-page.tsx` | Login form UI |
| Provider | `src/atomic-crm/providers/supabase/authProvider.ts` | Authentication logic |
| Provider | `src/atomic-crm/providers/supabase/supabase.ts` | Supabase client |
| Page | `src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx` | Dashboard |

### Authentication Flow Detail

```typescript
// authProvider.ts

// 1. Login
login: async (params) => {
  const result = await baseAuthProvider.login(params);
  cachedSale = undefined;  // Clear cache
  return result;
}

// 2. Check auth (validates session)
checkAuth: async (params) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    if (isPublicPath(window.location.pathname)) return;  // Allow public pages
    throw new Error("Not authenticated");
  }

  return baseAuthProvider.checkAuth(params);
}

// 3. Get identity (fetches sales record)
getIdentity: async () => {
  const sale = await getSaleFromCache();
  return {
    id: sale.id,
    fullName: `${sale.first_name} ${sale.last_name}`,
    avatar: sale.avatar_url,
    role: sale.role || 'rep',
  };
}
```

### What I Learned

- Authentication state is managed by Supabase, not React state
- The `sales` table connects Supabase users to CRM identity
- Public paths are whitelisted (login, forgot-password, set-password)
- Sales record is cached to avoid repeated DB queries

---

## Flow 2: Log Customer Activity

**User goal:** Record an interaction (call, email, meeting) with a customer.

### Steps

```
1. User clicks "New Activity" in QuickLoggerPanel
   └── setIsLogging(true)
   └── QuickLogForm renders

2. User fills form
   └── Select activity type (Call/Email/Meeting)
   └── Select contact (auto-fills organization)
   └── Optional: select opportunity
   └── Enter notes
   └── Optional: toggle "Create follow-up task"

3. User clicks "Save & Close" or "Save & New"
   └── Form validates via Zod schema
   └── onSubmit(data, closeAfterSave)

4. Activity record created
   └── dataProvider.create('activities', { data: {...} })
   └── INSERT into activities table

5. If follow-up requested: Task created
   └── dataProvider.create('tasks', { data: {...} })
   └── INSERT into tasks table

6. Form resets
   └── form.reset()
   └── If "Save & Close": setIsLogging(false)
   └── If "Save & New": form stays open for next entry
```

### Key Files Involved

| Layer | File | Purpose |
|-------|------|---------|
| Organism | `src/atomic-crm/dashboard/v3/components/QuickLoggerPanel.tsx` | Container with toggle |
| Molecule | `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx` | Form with validation |
| Validation | `src/atomic-crm/dashboard/v3/validation/activitySchema.ts` | Zod schema |
| Provider | `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Data operations |

### Form Validation with Zod

```typescript
// activitySchema.ts
export const activityLogSchema = z
  .object({
    activityType: z.enum(['Call', 'Email', 'Meeting', 'Follow-up', 'Note']),
    outcome: z.enum(['Connected', 'Left Voicemail', 'No Answer', 'Completed', 'Rescheduled']),
    date: z.date().default(() => new Date()),
    duration: z.number().min(0).optional(),
    contactId: z.number().optional(),
    organizationId: z.number().optional(),
    opportunityId: z.number().optional(),
    notes: z.string().min(1, 'Notes are required'),
    createFollowUp: z.boolean().default(false),
    followUpDate: z.date().optional(),
  })
  .refine((data) => data.contactId || data.organizationId, {
    message: 'Select a contact or organization before logging',
    path: ['contactId'],
  })
  .refine((data) => !data.createFollowUp || data.followUpDate, {
    message: 'Follow-up date is required when creating a follow-up task',
    path: ['followUpDate'],
  });

// Form setup
const form = useForm<ActivityLogInput>({
  resolver: zodResolver(activityLogSchema),
  defaultValues: activityLogSchema.partial().parse({}),  // Zod generates defaults!
});
```

### Data Created

**Activities table:**
```sql
INSERT INTO activities (
  activity_type,      -- 'engagement' or 'interaction'
  type,               -- 'call', 'email', 'meeting', etc.
  outcome,            -- 'Connected', 'Left Voicemail', etc.
  subject,            -- First 100 chars of notes
  description,        -- Full notes
  activity_date,
  duration_minutes,
  contact_id,
  organization_id,
  opportunity_id,
  follow_up_required,
  follow_up_date,      -- stored as YYYY-MM-DD string
  created_by          -- sales_id of current user
)
```

**Tasks table (if follow-up):**
```sql
INSERT INTO tasks (
  title,              -- "Follow-up: {first 50 chars}"
  due_date,           -- followUpDate
  type,               -- 'follow_up'
  priority,           -- 'medium'
  contact_id,
  opportunity_id,
  organization_id,
  sales_id,           -- Assigned to current user
  created_by
)
```

### What I Learned

- Zod refinements enforce "contact OR organization" and require notes > 0 chars
- `schema.partial().parse({})` still seeds default values for the form
- The "Save & New" pattern passes `closeAfterSave = false` to keep form open
- Activity logging creates two records when follow-up is enabled
- Contact selection auto-fills organization (smart UX)

---

## Flow 3: Complete a Task

**User goal:** Mark a task as done.

### Steps

```
1. TasksPanel loads user's tasks
   └── useMyTasks() hook
   └── Queries tasks WHERE sales_id = currentUser.salesId

2. Tasks filtered into time buckets
   └── overdueTasks = tasks.filter(t => t.status === 'overdue')
   └── todayTasks = tasks.filter(t => t.status === 'today')
   └── tomorrowTasks = tasks.filter(t => t.status === 'tomorrow')

3. User sees task with checkbox
   └── TaskItemComponent
       └── Checkbox, icon, priority badge, actions

4. User clicks checkbox
   └── onCheckedChange={(checked) => {
         if (checked) onComplete(task.id)
       }}

5. Task marked complete
   └── completeTask(taskId)
       └── UPDATE tasks SET
             completed = true,
             completed_at = now()
           WHERE id = taskId

6. UI updates
   └── Task removed from list (re-fetch or optimistic update)
```

### Key Files Involved

| Layer | File | Purpose |
|-------|------|---------|
| Organism | `src/atomic-crm/dashboard/v3/components/TasksPanel.tsx` | Task list container |
| Molecule | `TaskItemComponent` (in TasksPanel.tsx) | Individual task row |
| Hook | `src/atomic-crm/dashboard/v3/hooks/useMyTasks.ts` | Data fetching + mutations |

### Task Status Calculation

Tasks don't store `status` directly - it's calculated from `due_date`:

```typescript
// In useMyTasks hook (simplified)
const today = startOfDay(new Date());

const withStatus = tasks.map(task => {
  const dueDate = parseISO(task.due_date);

  let status: 'overdue' | 'today' | 'tomorrow' | 'later';
  if (isBefore(dueDate, today)) status = 'overdue';
  else if (isSameDay(dueDate, today)) status = 'today';
  else if (isSameDay(dueDate, addDays(today, 1))) status = 'tomorrow';
  else status = 'later';

  return { ...task, status };
});
```

### What I Learned

- Task status is **calculated**, not stored (single source of truth = due_date)
- date-fns provides timezone-safe date comparisons
- Checkbox `onCheckedChange` receives boolean, not event
- Tasks are filtered client-side (fast for small lists)

---

## Flow 4: View Pipeline → Drill into Opportunity

**User goal:** Understand pipeline health and take action on a specific opportunity.

### Steps

```
1. PrincipalPipelineTable loads
   └── usePrincipalPipeline({ myPrincipalsOnly })
   └── Queries principal_pipeline_summary view

2. User sees aggregated data
   └── Principal name
   └── Total pipeline value
   └── This week vs last week activity
   └── Momentum indicator (increasing/decreasing/steady/stale)

3. (Future enhancement) User clicks table row
   └── UI already uses `cursor-pointer`, but no handler is wired up yet
   └── Planned behavior: navigate to OpportunityList filtered by that principal
```

### Key Files Involved

| Layer | File | Purpose |
|-------|------|---------|
| Organism | `src/atomic-crm/dashboard/v3/components/PrincipalPipelineTable.tsx` | Table display |
| Hook | `src/atomic-crm/dashboard/v3/hooks/usePrincipalPipeline.ts` | Data fetching |
| Database | `principal_pipeline_summary` view | Pre-aggregated metrics |
| (Future) Page | `src/atomic-crm/opportunities/OpportunityList.tsx` | Target for row navigation |

### Database View

```sql
-- principal_pipeline_summary (simplified)
CREATE VIEW principal_pipeline_summary AS
SELECT
  p.id,
  p.name,
  COUNT(o.id) AS total_pipeline,
  COUNT(CASE WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS active_this_week,
  COUNT(CASE WHEN a.created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days' THEN 1 END) AS active_last_week,
  CASE
    WHEN this_week > last_week THEN 'increasing'
    WHEN this_week < last_week THEN 'decreasing'
    WHEN this_week = last_week AND this_week > 0 THEN 'steady'
    ELSE 'stale'
  END AS momentum
FROM organizations p
JOIN opportunities o ON o.principal_id = p.id
LEFT JOIN activities a ON a.opportunity_id = o.id
GROUP BY p.id;
```

### What I Learned

- Database views pre-aggregate complex metrics (faster than N+1 queries)
- Momentum is calculated by comparing 7-day windows
- Row navigation still needs wiring despite the clickable styling
- Principal → Customer → Opportunity is the key hierarchy in this CRM

---

## Flow Diagram Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOWS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Login]                                                         │
│     │                                                            │
│     ▼                                                            │
│  [Dashboard] ◄────────────────────────────────────────────────── │
│     │                                                            │
│     ├──► [View Pipeline] ──► [Click Row] ──► [Opportunity List] │
│     │                                                            │
│     ├──► [View Tasks] ──► [Click Checkbox] ──► [Task Complete]  │
│     │                                                            │
│     └──► [Log Activity] ──► [Fill Form] ──► [Save]              │
│                                      │                           │
│                                      └──► [Create Follow-up]     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cross-Cutting Concerns

### 1. Data Provider Pattern

All data operations go through React Admin's data provider:

```typescript
// Create
dataProvider.create('activities', { data: {...} })

// Read
dataProvider.getList('contacts', { pagination, sort, filter })

// Update
dataProvider.update('tasks', { id, data: {...} })

// Delete
dataProvider.delete('opportunities', { id })
```

### 2. Current User Context

```typescript
// Get current user's sales ID
const { salesId, loading } = useCurrentSale();

// Pattern: Always validate salesId before mutations
if (!salesId) {
  notify('Session expired. Please refresh.', { type: 'error' });
  return;
}
```

### 3. Optimistic Updates

React Admin handles optimistic updates automatically:
- UI updates immediately
- Server request happens in background
- On error: UI reverts + error notification

### 4. Toast Notifications

```typescript
const notify = useNotify();

// Success
notify('Activity logged successfully', { type: 'success' });

// Error
notify('Failed to load tasks', { type: 'error' });

// Warning
notify('Some items failed', { type: 'warning' });
```

---

## Key Learnings

1. **Flows reveal architecture** – Following a flow shows how layers connect

2. **Database views simplify queries** – Pre-aggregated data is faster and cleaner

3. **Calculated fields vs stored fields** – Task status is calculated from due_date

4. **Form defaults from Zod** – `schema.partial().parse({})` is the pattern

5. **Data provider abstraction** – All CRUD goes through React Admin's interface

6. **Current user is essential** – Most operations need the sales_id

---

## Study Checklist

- [x] Flow: Login → Dashboard
- [x] Flow: Log Activity
- [x] Flow: Complete Task
- [x] Flow: View Pipeline → Drill into Opportunity
- [ ] Flow: Create new contact from opportunity
- [ ] Flow: Import contacts from CSV
- [ ] Flow: Generate report and export
