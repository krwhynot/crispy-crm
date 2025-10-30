# Filtering, React Admin Patterns, and Data Fetching Architecture

**Research conducted:** 2025-10-23
**Purpose:** Understand filtering system, React Admin patterns, and data fetching architecture for opportunity redesign

## Overview

This codebase uses React Admin with a heavily customized filtering system, Supabase data provider with PostgREST query translation, and React Query for caching. Key architectural decisions include:
- **Filter Registry Pattern**: Centralized whitelist prevents 400 errors from stale cached filters
- **Multi-layer Data Provider**: Unified provider consolidates validation, transformation, and PostgREST query building
- **localStorage Filter Persistence**: User preferences (like opportunity stage selections) persist across sessions
- **No Realtime Subscriptions**: Currently uses manual query invalidation (queryClient.invalidateQueries)

## Relevant Files

### Core Architecture
- `/home/krwhynot/projects/crispy-crm/src/components/admin/list.tsx`: Custom List component wrapping React Admin's ListBase
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Single data provider layer (validation, transformation, query execution)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/dataProviderUtils.ts`: PostgREST query utilities and filter transformation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/filterRegistry.ts`: Whitelist of valid filterable fields per resource

### Filter Components
- `/home/krwhynot/projects/crispy-crm/src/components/admin/filter-form.tsx`: FilterButton and FilterForm (dropdown-based filter UI)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/FilterChipsPanel.tsx`: Displays active filters as removable chips
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/useFilterManagement.ts`: Hook for filter state operations (add, remove, toggle)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/useOpportunityFilters.tsx`: Centralized filter configuration for opportunities

### Filter Persistence
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/opportunityStagePreferences.ts`: localStorage persistence for stage filter
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/hooks/useFilterCleanup.ts`: Cleans stale filters on mount (references filterRegistry)

### Reference Fields
- `/home/krwhynot/projects/crispy-crm/src/components/admin/reference-field.tsx`: Single reference fetching with React Query
- `/home/krwhynot/projects/crispy-crm/src/components/admin/reference-many-field.tsx`: One-to-many reference fetching

### List Implementations
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityList.tsx`: Opportunities list with filter chips and localStorage sync
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactList.tsx`: Contacts list with sidebar filters
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactListFilter.tsx`: Example of sidebar filter UI

## Architectural Patterns

### 1. List Component Pattern

**Structure:**
```tsx
// Top-level List component
<List
  perPage={25}
  sort={{ field: "last_seen", order: "DESC" }}
  filter={{ "deleted_at@is": null }}  // Permanent filter
  filterDefaultValues={{ stage: [...] }}  // Initial filter values
  filters={filterInputs}  // Array of React Admin filter inputs
>
  <LayoutComponent />  // Custom layout that uses useListContext
</List>
```

**Key Props:**
- `perPage`: Number of records per page (default: 10)
- `sort`: Initial sort configuration `{ field: string, order: "ASC" | "DESC" }`
- `filter`: Permanent filters (not removable by user)
- `filterDefaultValues`: Initial values for toggleable filters
- `filters`: Array of filter input components (SearchInput, ReferenceInput, etc.)

**List Component Hierarchy:**
1. `List` (custom wrapper) → renders `ListBase` from React Admin
2. `ListBase` → provides `ListContext` with data, filters, pagination
3. Custom layout component uses `useListContext()` to access data

**Example from `/src/atomic-crm/opportunities/OpportunityList.tsx`:**
```tsx
const OpportunityList = () => {
  const opportunityFilters = useOpportunityFilters();

  return (
    <List
      perPage={100}
      filter={{ "deleted_at@is": null }}  // Always exclude soft-deleted
      sort={{ field: "index", order: "DESC" }}
      filters={opportunityFilters}
      pagination={null}  // Disable pagination (load all)
    >
      <OpportunityLayout />  {/* Custom layout using useListContext */}
    </List>
  );
};
```

### 2. Filter System Architecture

**Filter Registry (Validation Layer)**

Location: `/src/atomic-crm/providers/supabase/filterRegistry.ts`

Purpose: Prevents 400 errors from stale localStorage filters referencing non-existent database columns.

```typescript
export const filterableFields: Record<string, string[]> = {
  opportunities: [
    "id",
    "name",
    "stage",
    "status",
    "priority",
    "customer_organization_id",
    "opportunity_owner_id",
    "tags",  // Array field
    "created_at",
    "q",  // Special: full-text search
  ],
  // ... other resources
};

// Helper validates filter keys (strips operators like @gte, @in)
export function isValidFilterField(resource: string, filterKey: string): boolean {
  const baseField = filterKey.split('@')[0];
  return allowedFields.includes(baseField) || allowedFields.includes(filterKey);
}
```

**Filter Input Pattern**

Filters are defined as an array of React Admin input components:

```tsx
// From /src/atomic-crm/filters/useOpportunityFilters.tsx
export const useOpportunityFilters = () => {
  return [
    <SearchInput source="q" alwaysOn />,  // Always visible
    <ReferenceInput source="customer_organization_id" reference="organizations">
      <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
    </ReferenceInput>,
    <MultiSelectInput
      source="stage"
      emptyText="Stage"
      choices={OPPORTUNITY_STAGE_CHOICES}
      defaultValue={getInitialStageFilter()}  // From localStorage
    />,
    <OnlyMineInput source="opportunity_owner_id" alwaysOn />,
  ];
};
```

**Filter State Management**

React Admin manages filter state via `useListContext()`:

```tsx
const { filterValues, setFilters } = useListContext();
// filterValues: Record<string, any>
// Example: { stage: ["lead", "qualified"], priority: ["high"] }
```

Custom hook for common operations:

```typescript
// From /src/atomic-crm/filters/useFilterManagement.ts
export const useFilterManagement = () => {
  const { filterValues, setFilters } = useListContext();

  // Add value to array filter or set single value
  const addFilterValue = (key: string, value: any) => { ... };

  // Remove value from array filter
  const removeFilterValue = (key: string, valueToRemove: any) => { ... };

  // Toggle value in array filter
  const toggleFilterValue = (key: string, value: any) => { ... };

  return { filterValues, addFilterValue, removeFilterValue, toggleFilterValue };
};
```

### 3. Data Provider Query Translation

**Filter Transformation Pipeline:**

```
User Filter Input → Array Transformation → PostgREST Operators → Supabase Query
```

**Step 1: Array Filter Transformation**

Location: `/src/atomic-crm/providers/supabase/dataProviderUtils.ts`

```typescript
// Transforms React Admin array filters to PostgREST syntax
export function transformArrayFilters(filter: FilterRecord): FilterRecord {
  const jsonbArrayFields = ['tags', 'email', 'phone'];  // JSONB array columns

  for (const [key, value] of Object.entries(filter)) {
    if (Array.isArray(value)) {
      if (jsonbArrayFields.includes(key)) {
        // JSONB array contains: tags@cs={1,2,3}
        transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
      } else {
        // Regular IN operator: stage@in=(lead,qualified)
        transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
      }
    }
  }
}
```

**PostgREST Filter Operators:**
- `@in`: Field IN (val1, val2, val3) - for regular columns
- `@cs`: Contains (for JSONB arrays) - checks if array contains any of the values
- `@gte`, `@lte`: Greater/less than or equal (for dates, numbers)
- `@ilike`: Case-insensitive LIKE (for text search)
- `@is`: IS NULL / IS NOT NULL
- `@or`: Logical OR for combining conditions

**Example Filter Transformations:**

```javascript
// Input (React Admin filter)
{
  stage: ["lead", "qualified", "proposal"],
  priority: ["high"],
  "deleted_at@is": null
}

// Output (PostgREST query parameters)
{
  "stage@in": "(lead,qualified,proposal)",
  "priority@in": "(high)",
  "deleted_at@is": null
}
```

**Step 2: Full-Text Search**

```typescript
// From dataProviderUtils.ts - converts 'q' parameter to @or conditions
export function applyFullTextSearch(columns: readonly string[], shouldAddSoftDeleteFilter: boolean = true) {
  return (params: GetListParams): GetListParams => {
    const { q, ...filter } = params.filter;

    return {
      ...params,
      filter: {
        ...filter,
        "deleted_at@is": null,  // Soft delete filter
        "@or": columns.reduce((acc, column) => ({
          ...acc,
          [`${column}@ilike`]: q,  // Search across multiple columns
        }), {}),
      },
    };
  };
}
```

Example transformation:
```javascript
// Input
{ q: "acme corp" }

// Output (for opportunities resource)
{
  "deleted_at@is": null,
  "@or": {
    "name@ilike": "acme corp",
    "customer_organization_name@ilike": "acme corp",
    "principal_organization_name@ilike": "acme corp"
  }
}
```

### 4. React Query Integration

**Data Fetching Pattern:**

React Admin's `useListController` uses `useGetList` hook, which wraps React Query's `useQuery`:

```typescript
// From node_modules/ra-core/src/controller/list/useListController.ts
const {
  data,
  pageInfo,
  total,
  error,
  isLoading,
  isFetching,
  isPending,
  refetch,
} = useGetList<RecordType>(
  resource,
  {
    pagination: { page: query.page, perPage: query.perPage },
    sort: { field: query.sort, order: query.order },
    filter: { ...query.filter, ...filter },
    meta,
  },
  {
    placeholderData: previousData => previousData,  // Keep old data while refetching
    retry: false,
    onError: error => notify(error.message),
  }
);
```

**Query Key Structure:**

React Admin uses resource-based query keys:
```typescript
// Query key format: [resource, 'getList', params]
["opportunities", "getList", {
  pagination: { page: 1, perPage: 100 },
  sort: { field: "index", order: "DESC" },
  filter: { stage: ["lead"], "deleted_at@is": null }
}]
```

**Optimistic Updates & Cache Invalidation:**

Example from `/src/atomic-crm/opportunities/OpportunityEdit.tsx`:

```typescript
const OpportunityEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      mutationOptions={{
        onSuccess: () => {
          // Invalidate ALL opportunities queries
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        },
      }}
    >
      <OpportunityEditForm />
    </EditBase>
  );
};
```

**No Realtime Subscriptions (Yet):**

Current implementation does NOT use Supabase Realtime. Updates are reflected via:
1. Manual query invalidation after mutations
2. Automatic refetch on window focus (React Query default)
3. `placeholderData` to show stale data during refetch

### 5. Reference Field Patterns

**ReferenceField (Single Reference)**

Pattern: Fetches a single related record and displays it as a link.

```tsx
// From /src/atomic-crm/opportunities/OpportunityEdit.tsx
<ReferenceField
  source="customer_organization_id"  // Foreign key in current record
  reference="organizations"          // Target resource
  link="show"                        // Generates link to /organizations/:id/show
>
  <OrganizationAvatar />             // Custom component to display
</ReferenceField>
```

**Implementation (from `/src/components/admin/reference-field.tsx`):**
- Uses `useReferenceFieldContext()` from React Admin
- Fetches related record via `useQuery` automatically
- Provides `referenceRecord`, `isPending`, `error` to children
- Generates link using `useGetPathForRecordCallback`

**ReferenceManyField (One-to-Many)**

Pattern: Fetches multiple related records and provides ListContext to children.

```tsx
<ReferenceManyField
  target="opportunity_id"    // Foreign key in related resource
  reference="opportunityNotes"  // Related resource
  sort={{ field: "created_at", order: "DESC" }}
>
  <NotesIterator reference="opportunities" />  {/* Uses useListContext */}
</ReferenceManyField>
```

**Implementation:**
- Uses `useGetList` with `filter: { [target]: recordId }`
- Provides full ListContext (data, isPending, total, pagination)
- Children can use `useListContext()` to access data

**Performance Consideration:**
- Reference fields trigger separate queries
- Multiple ReferenceFields on same resource = multiple queries
- Consider using joins/views for heavy list pages

### 6. Filter Persistence (localStorage)

**Pattern: Save filter preferences across sessions**

Example from `/src/atomic-crm/filters/opportunityStagePreferences.ts`:

```typescript
const STORAGE_KEY = 'filter.opportunity_stages';

// Get stored preferences or defaults
export const getStoredStagePreferences = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_VISIBLE_STAGES;
};

// Save preferences when filter changes
export const saveStagePreferences = (selectedStages: string[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStages));
};

// Priority: URL params > localStorage > defaults
export const getInitialStageFilter = (): string[] | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get('filter');
  if (urlFilter) {
    const parsed = JSON.parse(urlFilter);
    if (parsed.stage) return parsed.stage;
  }
  return getStoredStagePreferences();
};
```

**Usage in List Component:**

```tsx
const OpportunityLayout = () => {
  const { filterValues } = useListContext();

  // Monitor stage filter changes and save to localStorage
  useEffect(() => {
    if (filterValues?.stage && Array.isArray(filterValues.stage)) {
      saveStagePreferences(filterValues.stage);
    }
  }, [filterValues?.stage]);

  return <OpportunityListContent />;
};
```

**Filter Cleanup Hook:**

```typescript
// From /src/atomic-crm/hooks/useFilterCleanup.ts
export const useFilterCleanup = (resource: string) => {
  const { filterValues, setFilters } = useListContext();

  useEffect(() => {
    // Remove invalid filters on mount
    const validFilters = Object.entries(filterValues || {})
      .filter(([key]) => isValidFilterField(resource, key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    if (Object.keys(validFilters).length !== Object.keys(filterValues || {}).length) {
      setFilters(validFilters);
    }
  }, []);
};
```

## Code Examples

### Example 1: Sidebar Filter UI (ContactListFilter)

Location: `/src/atomic-crm/contacts/ContactListFilter.tsx`

```tsx
export const ContactListFilter = () => {
  const { identity } = useGetIdentity();
  const { data: tags } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });

  return (
    <Card className="w-52">
      {/* Search - Always visible */}
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search contacts..." />
      </FilterLiveForm>

      {/* Active Filters Display */}
      <SidebarActiveFilters />

      {/* Collapsible Filter Sections */}
      <FilterCategory label="Last activity" icon={<Clock />}>
        <ToggleFilterButton
          label="This week"
          value={{
            "last_seen@gte": startOfWeek(new Date()).toISOString(),
          }}
        />
        <ToggleFilterButton
          label="Before this month"
          value={{
            "last_seen@lte": startOfMonth(new Date()).toISOString(),
          }}
        />
      </FilterCategory>

      <FilterCategory label="Tags" icon={<Tag />}>
        {tags?.map((tag) => (
          <ToggleFilterButton
            multiselect  // Allows multiple tags
            key={tag.id}
            label={<Badge>{tag.name}</Badge>}
            value={{ tags: tag.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory label="Account Manager" icon={<Users />}>
        <ToggleFilterButton
          label="Me"
          value={{ sales_id: identity?.id }}
        />
      </FilterCategory>
    </Card>
  );
};
```

**ToggleFilterButton Implementation:**

```tsx
// From /src/components/admin/toggle-filter-button.tsx
export const ToggleFilterButton = ({
  label,
  value,  // { filterKey: filterValue }
  multiselect = false
}) => {
  const { filterValues, addFilterValue, removeFilterValue, toggleFilterValue } = useFilterManagement();

  const isActive = useMemo(() => {
    const [key, val] = Object.entries(value)[0];
    const currentValue = filterValues[key];

    if (multiselect && Array.isArray(currentValue)) {
      return currentValue.includes(val);
    }
    return isEqual(currentValue, val);
  }, [filterValues, value, multiselect]);

  const handleClick = () => {
    const [key, val] = Object.entries(value)[0];

    if (multiselect) {
      toggleFilterValue(key, val);  // Add or remove from array
    } else {
      isActive ? removeFilterValue(key, val) : addFilterValue(key, val);
    }
  };

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
};
```

### Example 2: Dropdown Filter Button (FilterButton)

Location: `/src/components/admin/filter-form.tsx`

```tsx
export const FilterButton = (props: FilterButtonProps) => {
  const { filters } = props;
  const { displayedFilters, filterValues, showFilter, hideFilter, setFilters } = useListContext();

  const allTogglableFilters = filters.filter(
    (filterElement) => !filterElement.props.alwaysOn
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          Add filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* Show/hide individual filters */}
        {allTogglableFilters.map((filterElement) => (
          <FilterButtonMenuItem
            key={filterElement.props.source}
            filter={filterElement}
            displayed={!!displayedFilters[filterElement.props.source]}
            onShow={({ source, defaultValue }) => showFilter(source, defaultValue)}
            onHide={({ source }) => hideFilter(source)}
          />
        ))}

        {/* Save current query */}
        {hasFilterValues && !hasSavedCurrentQuery && (
          <DropdownMenuItem onClick={showAddSavedQueryDialog}>
            <BookmarkPlus />
            Save current query...
          </DropdownMenuItem>
        )}

        {/* Clear all filters */}
        {hasFilterValues && (
          <DropdownMenuItem onClick={() => setFilters({}, {})}>
            <X />
            Remove all filters
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### Example 3: Filter Chips Panel (Active Filters Display)

Location: `/src/atomic-crm/filters/FilterChipsPanel.tsx`

```tsx
export const FilterChipsPanel = ({ className }: FilterChipsPanelProps) => {
  const { filterValues, removeFilterValue } = useFilterManagement();

  // Fetch display names for IDs
  const { getOrganizationName } = useOrganizationNames(organizationIds);
  const { getSalesName } = useSalesNames(salesIds);
  const { getTagName } = useTagNames(tagIds);

  // Flatten filters into individual chips
  const filterChips = flattenFilterValues(filterValues || {});
  // Example: { stage: ["lead", "qualified"] } → [
  //   { key: "stage", value: "lead" },
  //   { key: "stage", value: "qualified" }
  // ]

  if (filterChips.length === 0) return null;

  return (
    <Accordion type="single" collapsible defaultValue="filters">
      <AccordionItem value="filters">
        <AccordionTrigger>
          Active Filters ({filterChips.length} filter{filterChips.length !== 1 ? 's' : ''})
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip, index) => {
              const label = formatFilterLabel(
                chip.key,
                chip.value,
                getOrganizationName,
                getSalesName,
                getTagName
              );

              return (
                <FilterChip
                  key={`${chip.key}-${chip.value}-${index}`}
                  label={label}
                  onRemove={() => removeFilterValue(chip.key, chip.value)}
                />
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
```

### Example 4: Custom List Layout (OpportunityListContent)

Location: `/src/atomic-crm/opportunities/OpportunityListContent.tsx`

```tsx
export const OpportunityListContent = () => {
  const { data: opportunities, isPending, filterValues } = useListContext<Opportunity>();

  // Filter stages based on active filter
  const visibleStages = filterValues?.stage && Array.isArray(filterValues.stage)
    ? OPPORTUNITY_STAGES.filter((stage) => filterValues.stage.includes(stage.value))
    : OPPORTUNITY_STAGES;

  // Group opportunities by stage
  const [opportunitiesByStage, setOpportunitiesByStage] = useState<OpportunitiesByStage>(
    getOpportunitiesByStage([], OPPORTUNITY_STAGES)
  );

  useEffect(() => {
    if (opportunities) {
      const newOpportunitiesByStage = getOpportunitiesByStage(
        opportunities,
        OPPORTUNITY_STAGES
      );
      if (!isEqual(newOpportunitiesByStage, opportunitiesByStage)) {
        setOpportunitiesByStage(newOpportunitiesByStage);
      }
    }
  }, [opportunities]);

  if (isPending) return null;

  return (
    <div className="flex gap-4 overflow-x-auto">
      {visibleStages.map((stage) => (
        <OpportunityColumn
          stage={stage.value}
          opportunities={opportunitiesByStage[stage.value]}
          key={stage.value}
        />
      ))}
    </div>
  );
};
```

## Best Practices

### Adding New Filters

**1. Update Filter Registry**

Add new filterable fields to `/src/atomic-crm/providers/supabase/filterRegistry.ts`:

```typescript
export const filterableFields: Record<string, string[]> = {
  opportunities: [
    // ... existing fields
    "new_field",  // Add your new field
  ],
};
```

**2. Add Filter Input to useOpportunityFilters**

```typescript
export const useOpportunityFilters = () => {
  return [
    // ... existing filters
    <MultiSelectInput
      source="new_field"
      emptyText="New Filter"
      choices={[
        { id: "option1", name: "Option 1" },
        { id: "option2", name: "Option 2" },
      ]}
    />,
  ];
};
```

**3. Handle Special Operators (Optional)**

If your filter uses date ranges or custom operators, update `dataProviderUtils.ts`:

```typescript
// Example: Date range filter
export function applySearchParams(resource: string, params: GetListParams) {
  // ... existing logic

  // Transform custom date range filter
  if (params.filter?.created_date_range) {
    const { start, end } = params.filter.created_date_range;
    delete params.filter.created_date_range;
    params.filter["created_at@gte"] = start;
    params.filter["created_at@lte"] = end;
  }

  return params;
}
```

### Filter Performance Optimization

**1. Use Summary Views for List Operations**

```typescript
// From dataProviderUtils.ts
export function getDatabaseResource(resource: string, operation: "list" | "one") {
  if (operation === "list" && resource === "contacts") {
    return "contacts_summary";  // Use view with pre-computed joins
  }
  return resource;
}
```

**2. Avoid N+1 Queries with ReferenceFields**

Instead of multiple ReferenceFields:
```tsx
{/* BAD: Each triggers separate query */}
{opportunities.map(opp => (
  <ReferenceField source="customer_organization_id" reference="organizations">
    <TextField source="name" />
  </ReferenceField>
))}
```

Use fetchRelatedRecords in exporter or custom query:
```typescript
const organizations = await fetchRelatedRecords<Organization>(
  opportunities,
  "customer_organization_id",
  "organizations"
);
```

**3. Limit perPage for Large Datasets**

```tsx
<List
  perPage={25}  // Default is 10, increase cautiously
  pagination={<ListPagination />}  // Enable pagination
>
```

### Data Fetching Patterns

**1. Custom Queries with React Query**

```typescript
import { useQuery } from "@tanstack/react-query";
import { unifiedDataProvider } from "@/atomic-crm/providers/supabase/unifiedDataProvider";

const { data, isPending } = useQuery({
  queryKey: ["custom", "myQuery", filters],
  queryFn: async () => {
    return await unifiedDataProvider.rpc("my_custom_function", { filters });
  },
});
```

**2. Optimistic Updates**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => {
    return await unifiedDataProvider.update("opportunities", { id, data });
  },
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["opportunities"] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(["opportunities"]);

    // Optimistically update
    queryClient.setQueryData(["opportunities"], (old) => ({
      ...old,
      data: old.data.map((item) =>
        item.id === id ? { ...item, ...newData } : item
      ),
    }));

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(["opportunities"], context.previous);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  },
});
```

**3. Realtime Subscriptions (Future)**

Pattern for adding Supabase realtime (not yet implemented):

```typescript
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

useEffect(() => {
  const channel = supabase
    .channel('opportunities-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'opportunities' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [queryClient]);
```

### Filter Validation & Error Handling

**1. Validate Filters at Data Provider Level**

From `unifiedDataProvider.ts`:

```typescript
async getList(resource: string, params: GetListParams) {
  return wrapMethod("getList", resource, params, async () => {
    // Validate and clean filters BEFORE applying search parameters
    if (params.filter) {
      params.filter = validationService.validateFilters(resource, params.filter);
    }

    const searchParams = applySearchParams(resource, params);
    const result = await baseDataProvider.getList(resource, searchParams);

    return result;
  });
}
```

**2. Handle Invalid Filter Values**

```typescript
// From ValidationService
export function validateFilters(resource: string, filters: FilterRecord): FilterRecord {
  return Object.entries(filters)
    .filter(([key]) => isValidFilterField(resource, key))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}
```

## Gotchas & Edge Cases

### 1. PostgREST Escaping

**Issue:** Special characters in filter values must be properly escaped.

```typescript
// From dataProviderUtils.ts
export function escapeForPostgREST(value: string): string {
  const needsQuoting = /[,."':() ]/.test(value);
  if (!needsQuoting) return value;

  // CRITICAL: Escape backslashes first, then quotes
  let escaped = value.replace(/\\/g, '\\\\');
  escaped = escaped.replace(/"/g, '\\"');
  return `"${escaped}"`;
}
```

**Example:**
```javascript
escapeForPostgREST("O'Brien & Sons")  // Output: "O\\'Brien & Sons"
```

### 2. JSONB Array Filters

**Issue:** JSONB array fields (tags, email, phone) use different operator than regular fields.

```typescript
// Regular field (status)
{ status: ["active", "pending"] } → { "status@in": "(active,pending)" }

// JSONB array field (tags)
{ tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" }
```

**Operator reference:**
- `@in`: Field value is IN the list (regular columns)
- `@cs`: Array CONTAINS any of the values (JSONB arrays)

### 3. Soft Delete Filtering

**Issue:** Summary views handle soft delete internally, base tables don't.

```typescript
// From dataProviderUtils.ts
const needsSoftDeleteFilter =
  supportsSoftDelete(resource) &&
  !params.filter?.includeDeleted &&
  !isView;  // Don't add for views (causes PostgREST error)
```

**Always add to base table queries:**
```typescript
filter: { "deleted_at@is": null }
```

**Never add to view queries** (views already filter soft-deleted records).

### 4. Filter State Persistence

**Issue:** URL params, localStorage, and defaultValues can conflict.

**Priority order (from `opportunityStagePreferences.ts`):**
1. URL parameters (highest)
2. localStorage preferences
3. Component defaultValues (lowest)

```typescript
export const getInitialStageFilter = (): string[] | undefined => {
  // 1. Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('filter')) { /* return URL value */ }

  // 2. Check localStorage
  return getStoredStagePreferences();
};
```

### 5. React Query Stale Data

**Issue:** `placeholderData` keeps old data during refetch, which can show outdated information.

```typescript
// From useListController
useGetList(resource, params, {
  placeholderData: previousData => previousData,  // Shows stale data
});
```

**Workaround:** Check `isFetching` to show loading indicator:
```tsx
const { data, isFetching } = useListContext();

return (
  <div className={isFetching ? "opacity-50" : ""}>
    {/* List content */}
  </div>
);
```

### 6. Filter Cleanup Timing

**Issue:** `useFilterCleanup` runs on mount, which can cause flash of unfiltered data.

```typescript
// From useFilterCleanup.ts
useEffect(() => {
  // Runs AFTER initial render
  const validFilters = validateFilters(resource, filterValues);
  if (hasInvalidFilters) {
    setFilters(validFilters);  // Triggers refetch
  }
}, []);  // Empty deps = runs once on mount
```

**Better approach:** Validate in filter registry before query execution (already implemented in `unifiedDataProvider`).

## Relevant Documentation

### Internal Documentation
- [Engineering Constitution](/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md) - Core principles (NO OVER-ENGINEERING, SINGLE SOURCE OF TRUTH)
- [Architecture Essentials](/home/krwhynot/projects/crispy-crm/docs/claude/architecture-essentials.md) - Module pattern, data layer, path aliases
- [Supabase Workflow](/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md) - Database development workflow

### External Documentation
- [React Admin List Documentation](https://marmelab.com/react-admin/List.html)
- [React Admin useListController](https://marmelab.com/react-admin/useListController.html)
- [PostgREST Filtering](https://postgrest.org/en/stable/references/api/tables_views.html#horizontal-filtering)
- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Supabase PostgREST Client](https://supabase.com/docs/reference/javascript/select)
