# 04 – Pages: Complete Screens

Pages assemble organisms, molecules, and atoms into full screens. They:
- Define the overall layout
- Compose multiple organisms
- Handle routing and navigation
- Manage page-level state (if any)

> **Key insight:** This project uses **React Admin** which provides automatic CRUD pages for resources. Custom pages are in `src/atomic-crm/dashboard/`.

---

## The Root Component: CRM.tsx

**Location:** `src/atomic-crm/root/CRM.tsx`

**What it does:** The main application shell that configures React Admin, registers all resources, and defines routing.

### Key Responsibilities

**1. Provider Setup:**
```typescript
<Admin
  dataProvider={dataProvider}      // Supabase data layer
  authProvider={authProvider}      // Supabase authentication
  store={localStorageStore(...)}   // Persist user preferences
  layout={Layout}                  // App shell (sidebar, header)
  loginPage={StartPage}            // Login entry point
  i18nProvider={i18nProvider}      // Internationalization
  dashboard={() => <PrincipalDashboardV3 />}  // Default dashboard
  requireAuth
/>
```

**2. Custom Routes:**
```typescript
<CustomRoutes noLayout>
  {/* Public routes (no sidebar/header) */}
  <Route path="/set-password" element={<SetPasswordPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
</CustomRoutes>

<CustomRoutes>
  {/* Authenticated routes with layout */}
  <Route path="/dashboard" element={<PrincipalDashboard />} />
  <Route path="/dashboard-v2" element={<PrincipalDashboardV2 />} />
  <Route path="/dashboard-v3" element={<PrincipalDashboardV3 />} />
  <Route path="/settings" element={<SettingsPage />} />
  <Route path="/reports" element={<ReportsPage />} />
</CustomRoutes>
```

**3. Resource Registration:**
```typescript
<Resource name="opportunities" {...opportunities} />
<Resource name="contacts" {...contacts} />
<Resource name="organizations" {...organizations} />
<Resource name="products" {...products} />
<Resource name="tasks" {...tasks} />
<Resource name="sales" {...sales} />
<Resource name="activities" {...activities} />
<Resource name="notifications" {...notifications} />
```

**4. Legacy URL Redirects:**
```typescript
// Redirect old /contacts/:id/show to new ?view=:id pattern
const ContactShowRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/contacts?view=${id}`} replace />;
};
```

**5. Configuration via Props:**
```typescript
export interface CRMProps extends Partial<ConfigurationContextValue> {
  dataProvider?: DataProvider;
  authProvider?: AuthProvider;
  opportunityStages?: OpportunityStage[];
  contactGender?: ContactGender[];
  taskTypes?: string[];
  // ... more configuration
}
```

---

## Dashboard Pages

### `PrincipalDashboardV3` (DEFAULT) – src/atomic-crm/dashboard/v3/PrincipalDashboardV3.tsx

**Route:** `/` (default dashboard)

**What it does:** 3-column resizable layout displaying pipeline, tasks, and activity logger.

**Organisms composed:**
1. `PrincipalPipelineTable` – Left panel (40%)
2. `TasksPanel` – Center panel (30%)
3. `QuickLoggerPanel` – Right panel (30%)

**Layout structure:**
```tsx
<div className="flex h-screen flex-col">
  {/* Fixed header */}
  <header className="border-b bg-card">
    <div className="flex h-16 items-center px-6">
      <h1>Principal Dashboard</h1>
    </div>
  </header>

  {/* Main content with resizable panels */}
  <div className="flex-1 overflow-hidden p-4">
    <ResizablePanelGroup direction="horizontal" onLayout={handleLayoutChange}>
      <ResizablePanel defaultSize={sizes[0]} minSize={25}>
        <PrincipalPipelineTable />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={sizes[1]} minSize={20}>
        <TasksPanel />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={sizes[2]} minSize={20}>
        <QuickLoggerPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</div>
```

**State: Layout persistence**
```typescript
const STORAGE_KEY = 'principal-dashboard-v3-layout';

// Read saved layout (or use defaults)
const [sizes, setSizes] = useState<number[]>(() => {
  if (typeof window === 'undefined') return [40, 30, 30];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { /* use defaults */ }
  }
  return [40, 30, 30];
});

// Save layout on change
const handleLayoutChange = (newSizes: number[]) => {
  setSizes(newSizes);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSizes));
};
```

**Key patterns:**
1. **SSR-safe localStorage** – Checks `typeof window` before accessing
2. **Error boundary wrapper** – `DashboardErrorBoundary` catches render errors
3. **Lazy loading** – Dashboard is loaded on-demand (100KB chunk)

---

### `PrincipalDashboardV2` (Legacy) – src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx

**Route:** `/dashboard-v2`

**Layout:** Sidebar + 3-column resizable

**Organisms composed:**
- `FiltersSidebar` – Collapsible left sidebar
- `OpportunitiesHierarchy` – Tree view of opportunities
- `TasksPanel` – Task list with grouping modes
- `QuickLogger` – Activity logging
- `RightSlideOver` – Detail panel (40vw)

**Special features:**
- Keyboard shortcuts (/, 1-3, H, Esc)
- CSS Grid with sidebar collapse animation
- Filter state persistence via `usePrefs`

---

## Resource Pages (React Admin Generated)

React Admin automatically generates CRUD pages for each `<Resource>`. The resource modules export:

```typescript
// src/atomic-crm/contacts/index.ts
const List = React.lazy(() => import("./List"));
const Show = React.lazy(() => import("./Show"));
const Edit = React.lazy(() => import("./Edit"));
const Create = React.lazy(() => import("./Create"));

export default {
  list: List,
  show: Show,
  edit: Edit,
  create: Create,
  recordRepresentation: (record) => record.name,
};
```

### Resource Page Types

| Page | Route | Purpose |
|------|-------|---------|
| List | `/contacts` | Searchable table with filters |
| Show | `/contacts/:id/show` | Read-only detail view |
| Edit | `/contacts/:id` | Form to update record |
| Create | `/contacts/create` | Form to create new record |

### List Page Pattern

```tsx
export const ContactList = () => (
  <List filters={<ContactFilters />}>
    <Datagrid>
      <TextField source="name" />
      <EmailField source="email" />
      <ReferenceField source="organization_id" reference="organizations" />
      <DateField source="created_at" />
    </Datagrid>
  </List>
);
```

### Edit/Create Page Pattern

```tsx
export const ContactEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="email" type="email" />
      <ReferenceInput source="organization_id" reference="organizations" />
    </SimpleForm>
  </Edit>
);
```

---

## Authentication Pages

### `StartPage` – src/atomic-crm/login/StartPage.tsx

**What it does:** Entry point that renders the login page.

```typescript
export const StartPage = () => {
  return <LoginPage />;
};
```

The `LoginPage` component (from `src/components/admin/login-page.tsx`) handles:
- Email/password form
- "Forgot password" link
- Error display

### Other Auth Pages

| Page | Route | Purpose |
|------|-------|---------|
| `ForgotPasswordPage` | `/forgot-password` | Request password reset |
| `SetPasswordPage` | `/set-password` | Set new password (from email link) |

---

## Page Composition Patterns

### 1. Full-Height Layout

```tsx
<div className="flex h-screen flex-col">
  {/* Fixed header (auto height) */}
  <header className="border-b">Header</header>

  {/* Flexible content (takes remaining space) */}
  <div className="flex-1 overflow-hidden">
    Content
  </div>
</div>
```

### 2. Error Boundary Wrapper

```tsx
<DashboardErrorBoundary>
  <PrincipalDashboardV3 />
</DashboardErrorBoundary>
```

### 3. Lazy Loading with React.lazy

```tsx
const ReportsPage = React.lazy(() => import("../reports/ReportsPage"));

// Usage
<Route
  path="/reports"
  element={
    <Suspense fallback={<LoadingIndicator />}>
      <ReportsPage />
    </Suspense>
  }
/>
```

### 4. Configuration Context

Pages access app-wide configuration via context:

```typescript
const { opportunityStages, taskTypes } = useConfiguration();
```

---

## Routing Architecture

### Route Hierarchy

```
/                      → PrincipalDashboardV3 (default)
/dashboard             → PrincipalDashboard (legacy)
/dashboard-v2          → PrincipalDashboardV2 (legacy)
/dashboard-v3          → PrincipalDashboardV3
/contacts              → ContactList
/contacts/create       → ContactCreate
/contacts/:id          → ContactEdit
/contacts/:id/show     → Redirect to /contacts?view=:id
/opportunities         → OpportunityList (Kanban)
/tasks                 → TaskList
/reports               → ReportsPage
/settings              → SettingsPage
/login                 → StartPage
/forgot-password       → ForgotPasswordPage
/set-password          → SetPasswordPage
```

### Route Groups

| Group | Layout | Auth Required |
|-------|--------|---------------|
| Dashboard | Full layout | Yes |
| Resources | Full layout | Yes |
| Auth | No layout | No |

---

## Key Learnings

1. **React Admin handles resource pages** – You define List/Show/Edit/Create, it generates routes

2. **Custom pages use CustomRoutes** – Two variants: with layout (`<CustomRoutes>`) and without (`<CustomRoutes noLayout>`)

3. **Dashboard is composable** – Just a container that arranges organisms

4. **Layout persistence** – Use localStorage for user preferences (panel sizes, sidebar state)

5. **Lazy loading** – Use `React.lazy()` for code splitting

6. **Error boundaries** – Wrap complex components to prevent full-page crashes

---

## Study Checklist

- [x] `CRM.tsx` (root component)
- [x] `PrincipalDashboardV3.tsx`
- [x] React Admin resource page pattern
- [x] `StartPage.tsx`
- [ ] `PrincipalDashboardV2.tsx`
- [ ] `SettingsPage.tsx`
- [ ] `ReportsPage.tsx`
