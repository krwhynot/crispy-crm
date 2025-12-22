# Data & State Management: Industry Standards and Best Practices

> **Crispy CRM Technology Stack Report**
> Generated: December 2024
> Based on official documentation and industry standards

---

## Overview

| Technology        | Version | Purpose                      |
|-------------------|---------|------------------------------|
| TanStack Query    | 5.85.9  | Server state / caching       |
| ra-core           | 5.10.0  | React Admin data layer       |
| @hello-pangea/dnd | 18.0.1  | Drag-and-drop (Kanban board) |

---

## 1. TanStack Query v5

### 1.1 Core Principles

TanStack Query is designed specifically for **server state** management, which fundamentally differs from client state:

- **Persisted remotely** in locations you don't control
- **Requires async APIs** for fetching and updating
- **Shared ownership** - can be changed by others without your knowledge
- **Can become stale** if not managed carefully

#### MUST-FOLLOW: Server State vs Client State Separation

```typescript
// ✅ CORRECT: Use TanStack Query for server state
const { data: opportunities } = useQuery({
  queryKey: ['opportunities', filters],
  queryFn: () => dataProvider.getList('opportunities', { filter: filters })
});

// ✅ CORRECT: Use React state for client/UI state
const [selectedTab, setSelectedTab] = useState('pipeline');
const [isDrawerOpen, setIsDrawerOpen] = useState(false);

// ❌ WRONG: Using useState for server data
const [opportunities, setOpportunities] = useState([]);
```

### 1.2 Query Keys Best Practices

Query keys are the foundation of TanStack Query's caching and invalidation system.

#### MUST-FOLLOW: Structured Query Keys

```typescript
// ✅ CORRECT: Use arrays with hierarchical structure
const queryKey = ['opportunities', 'list', { filters, pagination, sort }];
const queryKey = ['opportunities', 'detail', opportunityId];

// ❌ WRONG: String-only keys (not granular enough)
const queryKey = 'opportunities';

// ❌ WRONG: Inconsistent key structure
const queryKey = [opportunityId, 'opportunity'];
```

#### RECOMMENDED: Query Key Factory Pattern

Use a centralized query key factory for type-safety and consistency:

```typescript
// src/queries/queryKeys.ts
export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters: OpportunityFilters) => [...opportunityKeys.lists(), filters] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: string) => [...opportunityKeys.details(), id] as const,
};

// Usage
const { data } = useQuery({
  queryKey: opportunityKeys.list({ stage: 'new_lead' }),
  queryFn: fetchOpportunities
});

// Invalidation
queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
```

### 1.3 Stale Time and Cache Configuration

#### MUST-FOLLOW: Configure Appropriate Stale Times

```typescript
// For data that changes frequently (e.g., real-time dashboard)
const { data } = useQuery({
  queryKey: ['activities', 'recent'],
  queryFn: fetchRecentActivities,
  staleTime: 30 * 1000, // 30 seconds
});

// For data that changes less frequently (e.g., user preferences)
const { data } = useQuery({
  queryKey: ['user', 'settings'],
  queryFn: fetchUserSettings,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// For static reference data (e.g., pipeline stages)
const { data } = useQuery({
  queryKey: ['pipeline', 'stages'],
  queryFn: fetchPipelineStages,
  staleTime: Infinity, // Never consider stale
});
```

### 1.4 Structural Sharing

TanStack Query uses **structural sharing** to preserve referential identity of unchanged data, preventing unnecessary re-renders.

#### MUST-KNOW: How It Works

- When data is refetched, TanStack Query compares old and new data
- Unchanged nested objects keep their original references
- Only changed parts get new references
- Works automatically with JSON-compatible data

```typescript
// The `data` property is structurally shared
const { data } = useQuery({
  queryKey: ['opportunities'],
  queryFn: fetchOpportunities,
  // Disable only if using non-JSON data (rare)
  structuralSharing: true, // default
});
```

### 1.5 Window Focus Refetching

TanStack Query refetches stale queries when the window regains focus.

#### SHOULD-CONFIGURE: Based on Use Case

```typescript
// Global configuration in QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus for real-time data needs
      refetchOnWindowFocus: true, // default

      // Or disable for slower-changing data
      refetchOnWindowFocus: false,
    },
  },
});

// Per-query override
const { data } = useQuery({
  queryKey: ['static-config'],
  queryFn: fetchConfig,
  refetchOnWindowFocus: false, // Static data doesn't need refetch
});
```

### 1.6 Mutations and Optimistic Updates

#### MUST-FOLLOW: Mutation Best Practices

```typescript
const mutation = useMutation({
  mutationFn: updateOpportunity,

  // ✅ Simplified optimistic updates in v5 using variables
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['opportunities', newData.id] });

    // Snapshot previous value
    const previousData = queryClient.getQueryData(['opportunities', newData.id]);

    // Optimistically update
    queryClient.setQueryData(['opportunities', newData.id], newData);

    return { previousData };
  },

  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['opportunities', newData.id], context?.previousData);
  },

  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  },
});
```

#### SHOULD-KNOW: Mutation Retry Behavior

```typescript
// Mutations do NOT retry by default (unlike queries)
const mutation = useMutation({
  mutationFn: createOpportunity,
  retry: 3, // Enable retry if needed
});
```

### 1.7 v5 Key Features to Leverage

| Feature | Benefit | Usage |
|---------|---------|-------|
| `useSuspenseQuery` | First-class Suspense support | Loading states via React Suspense |
| `useMutationState` | Shared mutation state across components | Track mutations globally |
| `queryOptions` helper | Type-safe query definitions | Share between hooks and prefetch |
| Fine-grained persistence | Per-query persistence | Mobile/offline support |

---

## 2. React Admin (ra-core) v5

### 2.1 Provider Architecture

React Admin uses a **provider-based architecture** that abstracts data fetching, authentication, and i18n.

#### MUST-FOLLOW: Single Data Provider Entry Point

```typescript
// ✅ CORRECT: All data access through the data provider
import { useGetList, useUpdate, useCreate } from 'react-admin';

const MyComponent = () => {
  const { data, isPending, error } = useGetList('opportunities', {
    pagination: { page: 1, perPage: 25 },
    sort: { field: 'created_at', order: 'DESC' },
  });
};

// ❌ WRONG: Direct API calls bypassing data provider
const MyComponent = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/opportunities').then(/* ... */); // NO!
  }, []);
};
```

### 2.2 Data Provider Hooks

#### MUST-USE: React Admin Hooks (Not Direct Fetch)

| Hook | Purpose | When to Use |
|------|---------|-------------|
| `useGetList` | Fetch paginated list | List views, selects |
| `useGetOne` | Fetch single record | Detail views, edit forms |
| `useGetMany` | Fetch multiple by IDs | Reference fields |
| `useCreate` | Create new record | Create forms |
| `useUpdate` | Update existing record | Edit forms |
| `useDelete` | Soft/hard delete | Delete buttons |
| `useDataProvider` | Direct provider access | Custom operations |

```typescript
// Using useGetList with all options
const { data, total, isPending, error, refetch } = useGetList(
  'opportunities',
  {
    pagination: { page: 1, perPage: 10 },
    sort: { field: 'created_at', order: 'DESC' },
    filter: { stage: 'new_lead' },
    meta: { include: ['principal', 'activities'] }, // Custom metadata
  },
  {
    // TanStack Query options passthrough
    staleTime: 30000,
    refetchOnWindowFocus: true,
  }
);
```

### 2.3 Caching Strategies

React Admin implements three caching strategies automatically:

#### 1. Stale-While-Revalidate (Default)

```
First visit: Empty → Fetch → Display data
Return visit: Display cached → Fetch → Update if different
```

#### 2. Optimistic Rendering

`getList` results automatically populate `getOne` cache:

```typescript
// When user clicks from list to detail:
// 1. Detail displays immediately from list cache
// 2. getOne fetch happens in background
// 3. Only re-renders if server data differs
```

#### 3. Optimistic Updates

Mutations update local cache before server confirmation:

```typescript
// User clicks "Save":
// 1. Local cache updated immediately
// 2. UI reflects change instantly
// 3. Server request sent
// 4. On error: cache rolled back
```

### 2.4 Mutation Modes

#### MUST-UNDERSTAND: Three Mutation Modes

| Mode | Server Call | Local Update | Undo Support | Use Case |
|------|-------------|--------------|--------------|----------|
| `pessimistic` | Immediate | On response | No | Critical operations |
| `optimistic` | Immediate | Immediate | No | Most CRUD operations |
| `undoable` | Delayed (5s) | Immediate | Yes | Destructive actions |

```typescript
// Using undoable mode for delete operations
const [deleteOne] = useDelete(
  'opportunities',
  { id: record.id },
  {
    mutationMode: 'undoable',
    onSuccess: () => {
      notify('Opportunity deleted', { undoable: true });
    },
  }
);

// Using pessimistic for critical operations
const [create] = useCreate(
  'opportunities',
  { data: formData },
  {
    mutationMode: 'pessimistic', // Wait for server confirmation
    onSuccess: (data) => {
      redirect(`/opportunities/${data.id}`);
    },
  }
);
```

### 2.5 Query Key Structure

React Admin automatically generates query keys following this pattern:

```typescript
// getList query key
[resource, 'getList', { pagination, sort, filter, meta }]

// getOne query key
[resource, 'getOne', { id, meta }]

// getMany query key
[resource, 'getMany', { ids, meta }]
```

#### SHOULD-USE: For Manual Cache Manipulation

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate all opportunity lists
queryClient.invalidateQueries({
  queryKey: ['opportunities', 'getList']
});

// Update specific record in cache
queryClient.setQueryData(
  ['opportunities', 'getOne', { id: '123' }],
  updatedOpportunity
);
```

### 2.6 Error Handling

#### MUST-FOLLOW: Let Errors Propagate (Fail-Fast)

```typescript
// ✅ CORRECT: Let errors surface to error boundaries
const { data, error } = useGetList('opportunities');

if (error) {
  throw error; // Let error boundary handle it
}

// ❌ WRONG: Swallowing errors silently
const { data, error } = useGetList('opportunities');

if (error) {
  console.log('Error occurred'); // User never knows!
  return null;
}
```

### 2.7 Authentication Integration

#### MUST-FOLLOW: Auth Through authProvider

```typescript
// Data provider should read auth from storage
const dataProvider = {
  getList: async (resource, params) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/${resource}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // ...
  },
};

// Auth errors trigger authProvider.checkError
const authProvider = {
  checkError: (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('auth_token');
      return Promise.reject();
    }
    return Promise.resolve();
  },
};
```

---

## 3. @hello-pangea/dnd v18

### 3.1 Core Requirements

#### MUST-FOLLOW: Environment Requirements

- **React 18.0.0+** required
- Forked from `react-beautiful-dnd` with React 18 support
- Full keyboard and screen reader accessibility built-in

### 3.2 Performance Principles

@hello-pangea/dnd is designed for **extreme performance** with minimal updates.

#### MUST-READ: Performance Resources

- [Rethinking drag and drop](https://medium.com/@alexandereardon/rethinking-drag-and-drop-d9f5770b4e6b)
- [Dragging React performance forward](https://medium.com/@alexandereardon/dragging-react-performance-forward-688b30d40a33)

### 3.3 Common Setup Issues

#### MUST-AVOID: Setup Mistakes

```typescript
// ❌ WRONG: Duplicate IDs
<Draggable draggableId="item-1" /> // In list A
<Draggable draggableId="item-1" /> // In list B - DUPLICATE!

// ✅ CORRECT: Globally unique IDs
<Draggable draggableId="listA-item-1" />
<Draggable draggableId="listB-item-1" />
```

```typescript
// ❌ WRONG: Non-consecutive indexes
items.map((item, index) => (
  <Draggable index={item.sortOrder} /> // [1, 5, 8] - gaps!
))

// ✅ CORRECT: Consecutive indexes
items.map((item, index) => (
  <Draggable index={index} /> // [0, 1, 2] - consecutive
))
```

```typescript
// ❌ WRONG: Missing key prop
items.map((item, index) => (
  <Draggable draggableId={item.id} index={index}>
    {/* content */}
  </Draggable>
))

// ✅ CORRECT: Key prop required
items.map((item, index) => (
  <Draggable key={item.id} draggableId={item.id} index={index}>
    {/* content */}
  </Draggable>
))
```

#### MUST-AVOID: Margin Collapsing

```css
/* ❌ WRONG: Margin collapsing between draggables */
.draggable-item {
  margin-top: 8px;
  margin-bottom: 8px; /* Collapsing margins cause measurement issues */
}

/* ✅ CORRECT: Use gap on parent or single-direction margins */
.droppable-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* OR */
.draggable-item {
  margin-bottom: 8px; /* Single direction only */
}
```

### 3.4 Keyboard Accessibility

#### MUST-SUPPORT: Built-in Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between draggables |
| `Space` | Lift/drop draggable |
| `Escape` | Cancel drag |
| `Arrow keys` | Move within/between lists |

```typescript
// Keyboard support is automatic when using proper API
<Draggable draggableId={id} index={index}>
  {(provided) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps} // Includes keyboard handlers
    >
      {content}
    </div>
  )}
</Draggable>
```

### 3.5 Virtual Lists (500+ Items)

#### SHOULD-USE: For Large Datasets

When list size exceeds ~500 items, use virtualization:

```typescript
import { FixedSizeList } from 'react-window';

<Droppable
  droppableId="kanban-column"
  mode="virtual" // Required for virtual lists
  renderClone={(provided, snapshot, rubric) => (
    // Clone rendered during drag for virtualized items
    <DraggableCard
      provided={provided}
      item={items[rubric.source.index]}
    />
  )}
>
  {(provided, snapshot) => {
    const itemCount = snapshot.isUsingPlaceholder
      ? items.length + 1  // Extra space for placeholder
      : items.length;

    return (
      <FixedSizeList
        height={500}
        itemCount={itemCount}
        itemSize={80}
        outerRef={provided.innerRef}
      >
        {Row}
      </FixedSizeList>
    );
  }}
</Droppable>
```

#### MUST-ENABLE: Overscanning

```typescript
// react-window example
<FixedSizeList
  overscanCount={5} // Render 5 extra items outside viewport
  // ... other props
>
  {Row}
</FixedSizeList>
```

### 3.6 Empty List Handling

#### SHOULD-DO: Minimum Dimensions for Empty Lists

```typescript
<Droppable droppableId="column">
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      style={{
        minHeight: 100, // Visible drop target when empty
        minWidth: 200,
        backgroundColor: snapshot.isDraggingOver ? 'lightblue' : 'transparent',
      }}
    >
      {items.map(/* ... */)}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

### 3.7 Error Detection

#### MUST-CHECK: Console in Development

@hello-pangea/dnd logs setup issues to the console in development mode:

```typescript
// Setup errors are logged, not thrown (to prevent infinite loops)
// Always check console during development

// To disable warnings (development only):
window['__@hello-pangea/dnd-disable-dev-warnings'] = true;
```

### 3.8 Kanban Board Best Practices

For Crispy CRM's Kanban board specifically:

```typescript
// Recommended structure for pipeline Kanban
<DragDropContext onDragEnd={handleDragEnd}>
  <div className="flex gap-4 overflow-x-auto">
    {PIPELINE_STAGES.map((stage) => (
      <Droppable key={stage.id} droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-w-[300px] min-h-[200px] p-4 rounded-lg",
              snapshot.isDraggingOver && "bg-primary/10"
            )}
          >
            <h3>{stage.label}</h3>
            {opportunities
              .filter(opp => opp.stage === stage.id)
              .map((opp, index) => (
                <Draggable
                  key={opp.id}
                  draggableId={opp.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <OpportunityCard
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      opportunity={opp}
                      isDragging={snapshot.isDragging}
                    />
                  )}
                </Draggable>
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    ))}
  </div>
</DragDropContext>
```

---

## 4. Integration Patterns

### 4.1 TanStack Query + React Admin

React Admin v5 uses TanStack Query internally. Leverage both:

```typescript
// React Admin hooks use TanStack Query under the hood
const { data } = useGetList('opportunities'); // Uses useQuery internally

// Direct TanStack Query for custom scenarios
const { data } = useQuery({
  queryKey: ['custom', 'aggregation'],
  queryFn: fetchCustomAggregation,
});
```

### 4.2 Drag-and-Drop with Mutations

```typescript
const handleDragEnd = async (result: DropResult) => {
  if (!result.destination) return;

  const { draggableId, source, destination } = result;

  // Optimistic update
  const previousOpportunities = queryClient.getQueryData(['opportunities']);

  // Update local state immediately
  queryClient.setQueryData(['opportunities'], (old) =>
    reorderOpportunities(old, source, destination)
  );

  try {
    // Persist to server
    await updateOpportunityStage({
      id: draggableId,
      stage: destination.droppableId,
      sortOrder: destination.index,
    });
  } catch (error) {
    // Rollback on error
    queryClient.setQueryData(['opportunities'], previousOpportunities);
    notify('Failed to update opportunity', { type: 'error' });
  }
};
```

---

## 5. Summary: Critical Rules

### TanStack Query

| Priority | Rule |
|----------|------|
| MUST | Separate server state from client state |
| MUST | Use structured, hierarchical query keys |
| MUST | Configure appropriate stale times per data type |
| SHOULD | Use query key factories for type safety |
| SHOULD | Leverage structural sharing (default on) |

### React Admin (ra-core)

| Priority | Rule |
|----------|------|
| MUST | All data access through data provider hooks |
| MUST | Never bypass data provider with direct fetch |
| MUST | Let errors propagate (fail-fast) |
| SHOULD | Use appropriate mutation modes |
| SHOULD | Leverage automatic cache optimization |

### @hello-pangea/dnd

| Priority | Rule |
|----------|------|
| MUST | Use React 18.0.0+ |
| MUST | Ensure globally unique draggableIds |
| MUST | Use consecutive indexes (no gaps) |
| MUST | Include key prop on Draggables |
| MUST | Avoid margin collapsing |
| SHOULD | Use virtual lists for 500+ items |
| SHOULD | Set min dimensions for empty droppables |

---

## References

- [TanStack Query v5 Documentation](https://tanstack.com/query/v5/docs)
- [React Admin Documentation](https://marmelab.com/react-admin/documentation.html)
- [@hello-pangea/dnd Documentation](https://github.com/hello-pangea/dnd)
- [Query Key Factory Library](https://github.com/lukemorales/query-key-factory)
