# State Management

## Purpose

Document state management patterns for Atomic CRM including local component state, React Context for shared state, server state with React Admin hooks, URL state for filters, localStorage persistence, and form state management that provides predictable, type-safe state across desktop and tablet devices.

## Core Principle: Right Tool for the Job

State management should **match the scope and lifecycle of the data**. Don't use global state for local UI toggles, and don't prop-drill server data through 5 components. Choose the appropriate state strategy based on where the data lives and who needs it.

**State Types:**
1. **Local State** (`useState`) - Component-specific UI state (toggles, modals, form inputs)
2. **Context State** (`useContext`) - Shared UI state across component tree (theme, global filters)
3. **Server State** (React Admin hooks) - Data from API (entities, lists, mutations)
4. **URL State** (query params) - Shareable filters and pagination
5. **Persistent State** (`localStorage`) - User preferences that survive page refresh
6. **Form State** (React Hook Form) - Complex form validation and submission

## Local Component State with useState

Use `useState` for component-specific UI state that doesn't need to be shared.

### Pattern 1: UI Toggles

**From `src/atomic-crm/dashboard/CompactGridDashboard.tsx`:**

```typescript
export const CompactGridDashboard: React.FC = () => {
  // Modal open/close state
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string | null>(null);

  return (
    <div>
      <button onClick={() => setQuickLogOpen(true)}>Quick Log</button>

      {quickLogOpen && (
        <QuickLogActivity
          open={quickLogOpen}
          onClose={() => setQuickLogOpen(false)}
          principalId={selectedPrincipalId}
        />
      )}
    </div>
  );
};
```

**Why this works:**
- State scoped to component (doesn't pollute global state)
- Simple boolean toggle for modal visibility
- Cleanup handled automatically when component unmounts

### Pattern 2: Form Input State

```typescript
function ContactQuickAdd() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [create, { isLoading }] = useCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create("contacts", { data: { name, email } });
      setName("");
      setEmail("");
    } catch (error) {
      console.error("Create failed", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

**When to use `useState`:**
- ✅ Modal open/close state
- ✅ Dropdown expanded/collapsed
- ✅ Simple form inputs
- ✅ UI-only state (selected tab, hover state)
- ✅ Component-specific filters

**When NOT to use `useState`:**
- ❌ Data shared across multiple routes
- ❌ User preferences (use localStorage)
- ❌ Server data (use React Admin hooks)
- ❌ Complex forms (use React Hook Form)

## Shared State with React Context

Use Context to share state across components without prop drilling.

### Pattern 1: Global Filter Context

**From `src/atomic-crm/reports/contexts/GlobalFilterContext.tsx`:**

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { subDays } from 'date-fns';

export interface GlobalFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  salesRepId: number | null;
}

interface GlobalFilterContextValue {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  resetFilters: () => void;
}

const defaultFilters: GlobalFilters = {
  dateRange: {
    start: subDays(new Date(), 30),
    end: new Date(),
  },
  salesRepId: null,
};

// Create Context
const GlobalFilterContext = createContext<GlobalFilterContextValue | undefined>(undefined);

const STORAGE_KEY = 'reports.globalFilters';

// Provider Component
export function GlobalFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          dateRange: {
            start: new Date(parsed.dateRange.start),
            end: new Date(parsed.dateRange.end),
          },
        };
      } catch {
        return defaultFilters;
      }
    }
    return defaultFilters;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const setFilters = (newFilters: GlobalFilters) => {
    setFiltersState(newFilters);
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <GlobalFilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

// Custom Hook for consuming context
export function useGlobalFilters() {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within GlobalFilterProvider');
  }
  return context;
}
```

**Usage:**

```typescript
// Wrap app with provider
function App() {
  return (
    <GlobalFilterProvider>
      <ReportsPage />
    </GlobalFilterProvider>
  );
}

// Consume in any child component
function OverviewTab() {
  const { filters, setFilters, resetFilters } = useGlobalFilters();

  return (
    <div>
      <p>Date Range: {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}</p>
      <button onClick={resetFilters}>Reset Filters</button>
    </div>
  );
}
```

**Why this works:**
- Filters shared across all report tabs
- Persists to localStorage automatically
- Type-safe with TypeScript
- Custom hook provides ergonomic API
- Guards against using outside provider

**When to use Context:**
- ✅ Theme state (light/dark mode)
- ✅ User preferences
- ✅ Global filters across sections
- ✅ Multi-step wizard shared state
- ✅ Feature flags

**When NOT to use Context:**
- ❌ Server data (use React Admin hooks)
- ❌ Frequently changing values (performance cost)
- ❌ Local component state
- ❌ State that should sync with URL

## Server State with React Admin Hooks

React Admin provides hooks for managing server state (CRUD operations, caching, optimistic updates).

### Pattern 1: Fetch List Data

```typescript
import { useGetList } from 'react-admin';

function OrganizationList() {
  const { data, isPending, error, refetch } = useGetList('organizations', {
    pagination: { page: 1, perPage: 25 },
    sort: { field: 'name', order: 'ASC' },
    filter: { deleted_at: null },
  });

  if (isPending) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {data?.map(org => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </div>
  );
}
```

**Key Features:**
- Automatic caching (same query = cached result)
- Loading and error states
- Refetch on demand
- Pagination support

### Pattern 2: Fetch Single Record

```typescript
import { useGetOne } from 'react-admin';

function OrganizationShow({ id }: { id: number }) {
  const { data, isPending, error } = useGetOne('organizations', { id });

  if (isPending) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{data.organization_type}</p>
      </CardContent>
    </Card>
  );
}
```

### Pattern 3: Create Record

```typescript
import { useCreate, useNotify, useNavigate } from 'react-admin';

function OrganizationCreate() {
  const [create, { isPending }] = useCreate();
  const notify = useNotify();
  const navigate = useNavigate();

  const handleSubmit = async (data: Partial<Organization>) => {
    try {
      const { data: newOrg } = await create('organizations', { data });
      notify('Organization created successfully', { type: 'success' });
      navigate(`/organizations/${newOrg.id}`);
    } catch (error) {
      notify('Failed to create organization', { type: 'error' });
    }
  };

  return <OrganizationForm onSubmit={handleSubmit} isLoading={isPending} />;
}
```

### Pattern 4: Update Record

```typescript
import { useUpdate, useNotify } from 'react-admin';

function OrganizationEdit({ id }: { id: number }) {
  const [update, { isPending }] = useUpdate();
  const notify = useNotify();

  const handleSubmit = async (data: Partial<Organization>) => {
    try {
      await update('organizations', {
        id,
        data,
        previousData: organization, // For optimistic updates
      });
      notify('Organization updated successfully', { type: 'success' });
    } catch (error) {
      notify('Failed to update organization', { type: 'error' });
    }
  };

  return <OrganizationForm onSubmit={handleSubmit} isLoading={isPending} />;
}
```

### Pattern 5: Delete Record

```typescript
import { useDelete, useNotify, useNavigate } from 'react-admin';

function OrganizationActions({ id }: { id: number }) {
  const [deleteOne, { isPending }] = useDelete();
  const notify = useNotify();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      await deleteOne('organizations', { id, previousData: organization });
      notify('Organization deleted successfully', { type: 'success' });
      navigate('/organizations');
    } catch (error) {
      notify('Failed to delete organization', { type: 'error' });
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

### Pattern 6: Optimistic Updates

```typescript
import { useUpdate } from 'react-admin';

function ToggleStatus({ contact }: { contact: Contact }) {
  const [update] = useUpdate();

  const handleToggle = async () => {
    // Optimistic update: UI changes immediately
    await update('contacts', {
      id: contact.id,
      data: { status: contact.status === 'active' ? 'inactive' : 'active' },
      previousData: contact, // Used for rollback if mutation fails
    });
    // UI automatically reverts if mutation fails
  };

  return (
    <button onClick={handleToggle}>
      {contact.status === 'active' ? 'Deactivate' : 'Activate'}
    </button>
  );
}
```

**React Admin Hook Reference:**

| Hook | Purpose | Returns |
|------|---------|---------|
| `useGetList` | Fetch list with pagination/sort/filter | `{ data, total, isPending, error, refetch }` |
| `useGetOne` | Fetch single record | `{ data, isPending, error, refetch }` |
| `useGetMany` | Fetch multiple records by IDs | `{ data, isPending, error }` |
| `useCreate` | Create new record | `[create, { isPending, error }]` |
| `useUpdate` | Update existing record | `[update, { isPending, error }]` |
| `useDelete` | Delete record | `[deleteOne, { isPending, error }]` |

## URL State for Filters

Store filters and pagination in URL query parameters to enable sharing and bookmarking.

### Pattern 1: Filter from URL

```typescript
import { useSearchParams, useNavigate } from 'react-router-dom';

function OpportunitiesList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse filter from URL
  const filter = useMemo(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      try {
        return JSON.parse(decodeURIComponent(filterParam));
      } catch {
        return {};
      }
    }
    return {};
  }, [searchParams]);

  // Update URL when filter changes
  const handleFilterChange = (newFilter: Record<string, any>) => {
    const filterParam = encodeURIComponent(JSON.stringify(newFilter));
    navigate(`?filter=${filterParam}`);
  };

  const { data } = useGetList('opportunities', {
    pagination: { page: 1, perPage: 25 },
    filter,
  });

  return (
    <div>
      <OpportunityFilters value={filter} onChange={handleFilterChange} />
      <OpportunityTable data={data} />
    </div>
  );
}
```

**Why URL state:**
- Shareable links (send filter to colleague)
- Bookmarkable (save specific view)
- Browser back/forward works
- Persists across page refresh

### Pattern 2: Navigate with Filter

```typescript
function OrganizationCard({ org }: { org: Organization }) {
  const navigate = useNavigate();

  const handleViewOpportunities = () => {
    const filter = JSON.stringify({
      principal_organization_id: org.id
    });
    navigate(`/opportunities?filter=${encodeURIComponent(filter)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{org.name}</CardTitle>
      </CardHeader>
      <CardFooter>
        <button onClick={handleViewOpportunities}>
          View Opportunities
        </button>
      </CardFooter>
    </Card>
  );
}
```

## localStorage Persistence

Persist user preferences that should survive page refresh.

### Pattern 1: Persist Preferences

```typescript
// Save to localStorage
function savePreference(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage', error);
  }
}

// Load from localStorage
function loadPreference<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage', error);
    return defaultValue;
  }
}

// Usage
function KanbanBoard() {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    return new Set(loadPreference('kanban.collapsed', []));
  });

  useEffect(() => {
    savePreference('kanban.collapsed', Array.from(collapsed));
  }, [collapsed]);

  return <div>{/* Kanban board */}</div>;
}
```

### Pattern 2: Custom Hook for Persistence

```typescript
function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage', error);
    }
  }, [key, value]);

  return [value, setValue];
}

// Usage
function UserPreferences() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [density, setDensity] = useLocalStorage('table.density', 'comfortable');

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <select value={density} onChange={(e) => setDensity(e.target.value)}>
        <option value="compact">Compact</option>
        <option value="comfortable">Comfortable</option>
      </select>
    </div>
  );
}
```

**What to persist:**
- ✅ Theme (light/dark mode)
- ✅ Table density (compact/comfortable)
- ✅ Column visibility
- ✅ Collapsed sections
- ✅ Recent searches

**What NOT to persist:**
- ❌ Sensitive data (passwords, tokens)
- ❌ Large datasets (> 5MB limit)
- ❌ Server data (use API cache)

## Form State with React Hook Form

Complex forms require validation, error handling, and submission state. Use React Hook Form for this.

### Pattern 1: Basic Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { opportunitySchema } from '@/atomic-crm/validation/opportunities';

function OpportunityForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunitySchema.partial().parse({}), // Get defaults from Zod
  });

  const onSubmit = async (data: Opportunity) => {
    try {
      await createOpportunity(data);
      notify('Opportunity created', { type: 'success' });
    } catch (error) {
      notify('Failed to create opportunity', { type: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Name</label>
        <input {...register('name')} id="name" />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="stage">Stage</label>
        <select {...register('stage')} id="stage">
          <option value="new_lead">New Lead</option>
          <option value="initial_outreach">Initial Outreach</option>
          {/* ... */}
        </select>
        {errors.stage && <p className="text-destructive text-sm">{errors.stage.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Opportunity'}
      </button>
    </form>
  );
}
```

**Key Features:**
- Zod schema validation
- Default values from schema
- Type-safe form data
- Built-in error handling
- Optimized re-renders

## State Management Best Practices

### DO

✅ Use `useState` for local UI state
✅ Use Context for shared UI state across routes
✅ Use React Admin hooks for server data
✅ Use URL params for shareable filters
✅ Use `localStorage` for user preferences
✅ Use React Hook Form for complex forms
✅ Type all state with TypeScript
✅ Initialize state with sensible defaults
✅ Clean up side effects in `useEffect` cleanup

### DON'T

❌ Use global state for local toggles
❌ Prop-drill data through 5+ components (use Context)
❌ Store server data in local state (use React Admin hooks)
❌ Forget to handle loading and error states
❌ Store sensitive data in localStorage
❌ Use Context for frequently changing values (performance)
❌ Mix state management strategies in one component

## Common Issues & Solutions

### Issue: State not updating immediately

**Solution:** State updates are asynchronous

```typescript
// ❌ BAD: Assumes state updated immediately
const handleClick = () => {
  setCount(count + 1);
  console.log(count); // Still old value
};

// ✅ GOOD: Use functional setState or useEffect
const handleClick = () => {
  setCount(prev => {
    console.log(prev + 1); // Correct value
    return prev + 1;
  });
};
```

### Issue: Infinite re-render loop

**Solution:** Proper dependencies in useEffect

```typescript
// ❌ BAD: Missing dependency causes stale closure
useEffect(() => {
  fetchData(userId);
}, []); // userId not in deps

// ✅ GOOD: Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Issue: Context causing unnecessary re-renders

**Solution:** Split context or use useMemo

```typescript
// ❌ BAD: Entire context value recreated on every render
<MyContext.Provider value={{ state, setState, computedValue }}>

// ✅ GOOD: Memoize context value
const value = useMemo(() => ({ state, setState, computedValue }), [state, computedValue]);
<MyContext.Provider value={value}>
```

### Issue: localStorage quota exceeded

**Solution:** Clear old data or use IndexedDB for large datasets

```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Clear old data
    localStorage.clear();
    // Or use IndexedDB for large data
  }
}
```

## Related Resources

- [React Performance](react-performance.md) - Performance optimization patterns
- [TypeScript Patterns](typescript-patterns.md) - Type-safe state management
- [Form Patterns](form-patterns.md) - React Hook Form integration
- [React Admin Data Provider](https://marmelab.com/react-admin/DataProviders.html) - Server state management
- [React Hook Form](https://react-hook-form.com/) - Form state library

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
