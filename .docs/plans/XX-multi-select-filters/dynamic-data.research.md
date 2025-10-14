# Dynamic Data Loading & Caching Patterns Research

Research conducted on 2025-10-10 to identify patterns for loading dynamic choices and caching strategies in Atomic CRM.

## Overview

The Atomic CRM uses a multi-layered approach to dynamic data loading with strong patterns around React Admin's data provider, React Query for caching, and localStorage for user preferences. Key findings:

- **Data Fetching**: Primarily uses React Admin's `useDataProvider`, `useGetList`, and `useGetMany` hooks
- **Caching Strategy**: React Query handles API-level caching; localStorage for user preferences and filter state
- **Performance**: Batch fetching patterns, in-memory caching in custom hooks, pagination limits (10-100 items)
- **No Debouncing**: Search inputs use React Admin's default behavior without explicit debouncing (handled internally)

## Relevant Files

### Core Data Fetching Hooks
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts`: Custom hook for batch-fetching organization names with in-memory cache
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useSalesNames.ts`: Custom hook for batch-fetching sales person names with in-memory cache
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useFilterManagement.ts`: Centralized filter state management utilities

### Caching & Persistence
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterPrecedence.ts`: localStorage utilities for filter preferences with precedence logic
- `/home/krwhynot/Projects/atomic/src/atomic-crm/hooks/useFilterCleanup.ts`: Automatic cleanup of stale filters from localStorage
- `/home/krwhynot/Projects/atomic/src/hooks/saved-queries.tsx`: React Admin store integration for saved queries

### Input Components with Dynamic Loading
- `/home/krwhynot/Projects/atomic/src/components/admin/autocomplete-input.tsx`: Combobox with search and create support
- `/home/krwhynot/Projects/atomic/src/components/admin/autocomplete-array-input.tsx`: Multi-select combobox with badges
- `/home/krwhynot/Projects/atomic/src/components/admin/select-input.tsx`: Dropdown select with dynamic choices
- `/home/krwhynot/Projects/atomic/src/components/admin/reference-array-input.tsx`: Wrapper for loading referenced resources
- `/home/krwhynot/Projects/atomic/src/components/admin/SegmentComboboxInput.tsx`: Example of inline creation with dynamic loading

### Examples in Production
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactListFilter.tsx`: Tags loaded with `useGetList` (perPage: 10)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`: Stage filter with localStorage preferences
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`: React Query usage for cache management

### Validation & Registry
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts`: Centralized registry of valid filter fields per resource

## Architectural Patterns

### 1. Dynamic Choice Loading Pattern

**Standard Pattern - useGetList**:
```typescript
// Load choices from database using React Admin hooks
const { data: segments, isLoading } = useGetList("segments", {
  pagination: { page: 1, perPage: 100 },
  sort: { field: "name", order: "ASC" },
});

// Use in component
<SelectInput
  source="segment_id"
  choices={segments}
  isLoading={isLoading}
/>
```

**Location**: `/home/krwhynot/Projects/atomic/src/components/admin/SegmentComboboxInput.tsx:32-35`

---

**Batch Fetching Pattern - useGetMany**:
```typescript
// Fetch only IDs we don't have cached
const idsToFetch = organizationIds.filter(id => !organizationMap[id]);

const { data } = await dataProvider.getMany('organizations', {
  ids: idsToFetch,
});

// Build lookup map
const newMap = data.reduce((acc, org) => {
  acc[String(org.id)] = org.name;
  return acc;
}, {});

// Merge with existing cache
setOrganizationMap(prev => ({ ...prev, ...newMap }));
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts:18-37`

**Rationale**: Prevents redundant API calls when batch-loading display names for filter chips.

---

**ReferenceInput Pattern**:
```typescript
// Automatically loads and filters referenced resource
<ReferenceInput
  source="customer_organization_id"
  reference="organizations"
  perPage={25}  // Default limit
  filter={{ is_active: true }}
>
  <AutocompleteArrayInput label={false} />
</ReferenceInput>
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx:77-79`

**Details**:
- `ReferenceInput` uses `useReferenceArrayInputController` internally
- Fetches choices via `dataProvider.getList()`
- Provides `ChoicesContextProvider` to child inputs
- Child input can call `setFilters()` to search/filter choices

---

### 2. Caching Strategies

**React Query Cache (API-level)**:
```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Update cache after mutation
queryClient.setQueriesData<GetListResult | undefined>(
  { queryKey: ["opportunities", "getList"] },
  (res) => {
    if (!res) return res;
    return {
      ...res,
      data: res.data.map((o) => opportunitiesById[o.id] || o),
    };
  },
  { updatedAt: Date.now() }
);
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx:63-75`

**Cache Key Convention**: `[resource, operation]` (e.g., `["opportunities", "getList"]`)

---

**In-Memory Component Cache**:
```typescript
const [organizationMap, setOrganizationMap] = useState<Record<string, string>>({});

useEffect(() => {
  // Only fetch IDs we don't already have cached
  const idsToFetch = organizationIds.filter(id => !organizationMap[id]);

  if (idsToFetch.length === 0) return;  // All cached

  // Fetch and merge...
}, [organizationIds?.join(',')]);

// Getter with fallback
const getOrganizationName = (id: string): string => {
  return organizationMap[id] || `Organization #${id}`;
};
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts:10-53`

**Pattern**: Store frequently-accessed lookup data in component state to avoid re-fetching.

---

**localStorage for User Preferences**:
```typescript
// Save filter preferences
export const saveFilterPreferences = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save filter preferences:', error);
  }
};

// Retrieve with fallback
export const getStoredFilterPreferences = (key: string): any => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterPrecedence.ts:49-67`

**Key Convention**:
- Filter-specific: `filter.{filterKey}` (e.g., `filter.stage`)
- Resource-specific: `{resource}_hidden_stages` (e.g., `opportunity_hidden_stages`)
- React Admin internal: `RaStore.{resource}.listParams`

---

**React Admin Store (useStore)**:
```typescript
import { useStore } from "ra-core";

// Saved queries stored per resource
export const useSavedQueries = (resource: string) => {
  return useStore<SavedQuery[]>(`${resource}.savedQueries`, []);
};
```

**Location**: `/home/krwhynot/Projects/atomic/src/hooks/saved-queries.tsx:7-9`

**Pattern**: React Admin provides a global store for sharing state across components.

---

### 3. Performance Patterns

**Pagination Limits by Use Case**:

| Use Case | perPage | Location | Rationale |
|----------|---------|----------|-----------|
| Small lookup lists (tags) | 10 | ContactListFilter.tsx:19 | Few total items, always visible |
| Medium lists (segments) | 100 | SegmentComboboxInput.tsx:33 | Searchable dropdown, reasonable limit |
| Large datasets (opportunities) | 100 | OpportunityList.tsx:101 | Main list view with filters |
| Reference inputs (default) | 25 | ReferenceArrayInput.tsx:38 | Balance between UX and performance |
| Batch operations | 1000 | OpportunityCreate.tsx:29 | Index management, all items needed |

**Warning Pattern**: No explicit warnings found in UI for pagination limits. React Admin shows "Load more" button when hasNextPage is true.

---

**Lazy Loading via useEffect Dependencies**:
```typescript
useEffect(() => {
  if (!organizationIds || organizationIds.length === 0) {
    return;  // Skip if no IDs
  }

  // Check cache first
  const idsToFetch = organizationIds.filter(id => !organizationMap[id]);
  if (idsToFetch.length === 0) return;  // All cached

  fetchOrganizationNames();
}, [organizationIds?.join(',')]);  // Re-run when IDs change
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts:13-45`

**Pattern**: Dependency array uses `.join(',')` to create stable reference for array comparison.

---

**Search Input Integration**:
```typescript
// No debouncing needed - React Admin handles it
<SearchInput source="q" placeholder="Search name, company..." />

// Internally uses TextInput with alwaysOn behavior
export const SearchInput = (props: SearchInputProps) => {
  return (
    <div className="flex flex-grow relative">
      <TextInput
        label={false}
        helperText={false}
        placeholder={translate("ra.action.search")}
        {...props}
      />
      <Search className="..." />
    </div>
  );
};
```

**Location**: `/home/krwhynot/Projects/atomic/src/components/admin/search-input.tsx:16-26`

**Note**: React Admin's TextInput has built-in debouncing (default 500ms). No explicit `debounce` or `throttle` utilities found in codebase.

---

**Filter Cleanup on Mount**:
```typescript
export const useFilterCleanup = (resource: string) => {
  const [, storeApi] = useStore();

  useEffect(() => {
    const key = `RaStore.${resource}.listParams`;
    const storedParams = localStorage.getItem(key);

    // Parse and validate filters
    const cleanedFilter: Record<string, any> = {};
    for (const filterKey in params.filter) {
      if (isValidFilterField(resource, filterKey)) {
        cleanedFilter[filterKey] = params.filter[filterKey];
      } else {
        console.warn(`Removing stale filter "${filterKey}"`);
        modified = true;
      }
    }

    // Update both localStorage and React Admin store
    if (modified) {
      localStorage.setItem(key, JSON.stringify(params));
      storeApi.setItem(key, params);
    }
  }, [resource, storeApi]);
};
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/hooks/useFilterCleanup.ts:29-87`

**Pattern**: Validates cached filters against `filterRegistry.ts` schema on component mount.

---

### 4. Filter Precedence System

**Three-Tier Precedence** (URL → localStorage → defaults):

```typescript
export const getInitialFilterValue = (
  filterKey: string,
  urlValue?: any,
  defaultValue?: any
): any => {
  // 1. URL has highest priority
  if (urlValue !== undefined && urlValue !== null && urlValue !== '') {
    return urlValue;
  }

  // 2. localStorage preferences
  const storedValue = getStoredFilterPreferences(`filter.${filterKey}`);
  if (storedValue !== undefined && storedValue !== null) {
    return storedValue;
  }

  // 3. Default value
  return defaultValue;
};
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterPrecedence.ts:95-113`

**Usage Example**:
```typescript
// In OpportunityList.tsx
const getInitialStageFilter = (): string[] | undefined => {
  // 1. Check URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get('filter');
  if (urlFilter) {
    const parsed = JSON.parse(urlFilter);
    if (parsed.stage) return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
  }

  // 2. Check localStorage
  const hiddenStages = JSON.parse(
    localStorage.getItem('opportunity_hidden_stages') || '["closed_won", "closed_lost"]'
  );

  // 3. Return visible stages (default excludes closed)
  return OPPORTUNITY_STAGE_CHOICES
    .map(choice => choice.id)
    .filter(stage => !hiddenStages.includes(stage));
};
```

**Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx:29-55`

---

### 5. Choice Loading Contexts

**ChoicesContext Pattern** (React Admin):
```typescript
// ReferenceInput provides choices to child
<ReferenceInput source="tags" reference="tags">
  <AutocompleteArrayInput />  {/* Receives choices via context */}
</ReferenceInput>

// Inside AutocompleteArrayInput:
const {
  allChoices = [],
  source,
  resource,
  isFromReference,
  setFilters,
} = useChoicesContext(props);

// Child can filter choices
if (isFromReference) {
  setFilters(filterToQuery(searchText));
}
```

**Location**: `/home/krwhynot/Projects/atomic/src/components/admin/autocomplete-array-input.tsx:45-51`

**Pattern**: Parent provides data via context, child handles UI and filtering.

---

## Related Hooks

### Custom Data Fetching Hooks
1. **useOrganizationNames** (`/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts`)
   - Batch-loads organization names by IDs
   - In-memory caching to prevent redundant fetches
   - Returns `{ organizationMap, getOrganizationName, loading }`

2. **useSalesNames** (`/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useSalesNames.ts`)
   - Batch-loads sales person names by IDs
   - Pattern identical to useOrganizationNames
   - Returns `{ salesMap, getSalesName, loading }`

### Filter Management Hooks
3. **useFilterManagement** (`/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useFilterManagement.ts`)
   - Centralized filter operations (add, remove, toggle, clear)
   - Handles both single and multi-value filters
   - Returns `{ filterValues, addFilterValue, removeFilterValue, toggleFilterValue, clearFilter, clearAllFilters, isFilterActive, activeFilterCount }`

4. **useFilterCleanup** (`/home/krwhynot/Projects/atomic/src/atomic-crm/hooks/useFilterCleanup.ts`)
   - Validates and cleans stale filters on mount
   - Prevents UI errors from outdated localStorage
   - Called in List components: `useFilterCleanup('contacts')`

### React Admin Store Hooks
5. **useSavedQueries** (`/home/krwhynot/Projects/atomic/src/hooks/saved-queries.tsx`)
   - Accesses React Admin's global store
   - Stores saved filter/sort configurations per resource
   - Key format: `{resource}.savedQueries`

### General Hooks
6. **useBulkExport** (`/home/krwhynot/Projects/atomic/src/hooks/useBulkExport.tsx`)
   - Uses `useDataProvider` for bulk operations
   - Not specific to filters but shows dataProvider usage pattern

7. **useContactImport** (`/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/useContactImport.tsx`)
   - CSV import with validation
   - Uses `useDataProvider` for batch creation

## Code Examples: Current Patterns

### Example 1: Simple Dynamic Select (Static Choices)
```typescript
// Location: OpportunityList.tsx
<MultiSelectInput
  source="priority"
  emptyText="Priority"
  choices={[
    { id: "low", name: "Low" },
    { id: "medium", name: "Medium" },
    { id: "high", name: "High" },
    { id: "critical", name: "Critical" },
  ]}
/>
```

### Example 2: Dynamic Select from Database
```typescript
// Location: ContactListFilter.tsx
export const ContactListFilter = () => {
  const { data } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });

  return (
    <FilterCategory label="Tags">
      {data && data.map((record) => (
        <ToggleFilterButton
          multiselect
          key={record.id}
          label={<Badge>{record.name}</Badge>}
          value={{ tags: record.id }}
        />
      ))}
    </FilterCategory>
  );
};
```

### Example 3: Reference Input with Search
```typescript
// Location: OpportunityList.tsx
<ReferenceInput
  source="customer_organization_id"
  reference="organizations"
>
  <AutocompleteArrayInput
    label={false}
    placeholder="Customer Organization"
  />
</ReferenceInput>

// AutocompleteArrayInput automatically:
// - Loads choices via ChoicesContext from ReferenceInput
// - Filters choices on search input
// - Calls setFilters(filterToQuery(searchText)) when isFromReference=true
```

### Example 4: Inline Creation + Dynamic Loading
```typescript
// Location: SegmentComboboxInput.tsx
export const SegmentComboboxInput = (props) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Load choices
  const { data: segments, isLoading } = useGetList("segments", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Create handler
  const [create] = useCreate("segments");
  const handleCreateSegment = async (name: string) => {
    const newSegment = await create(
      "segments",
      { data: { name } },
      { returnPromise: true }
    );
    field.onChange(newSegment.id);  // Auto-select
  };

  // Filter locally
  const filteredSegments = segments?.filter((segment) =>
    segment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Command shouldFilter={false}>  {/* Client-side filtering */}
      <CommandInput
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      {filteredSegments.map((segment) => (
        <CommandItem key={segment.id} onSelect={() => field.onChange(segment.id)}>
          {segment.name}
        </CommandItem>
      ))}
      {showCreateOption && (
        <CommandItem onSelect={() => handleCreateSegment(searchQuery)}>
          Create "{searchQuery}"
        </CommandItem>
      )}
    </Command>
  );
};
```

### Example 5: Filter Persistence with Precedence
```typescript
// Location: OpportunityList.tsx + filterPrecedence.ts

// 1. Get initial filter value with precedence
const getInitialStageFilter = (): string[] | undefined => {
  // URL > localStorage > defaults
  const urlFilter = new URLSearchParams(window.location.search).get('filter');
  if (urlFilter) {
    const parsed = JSON.parse(urlFilter);
    if (parsed.stage) return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
  }

  const hiddenStages = JSON.parse(
    localStorage.getItem('opportunity_hidden_stages') || '["closed_won", "closed_lost"]'
  );

  return OPPORTUNITY_STAGE_CHOICES.map(c => c.id).filter(s => !hiddenStages.includes(s));
};

// 2. Apply to filter
<MultiSelectInput
  source="stage"
  emptyText="Stage"
  choices={OPPORTUNITY_STAGE_CHOICES}
  defaultValue={getInitialStageFilter()}
/>

// 3. Monitor changes and update localStorage
const OpportunityLayout = () => {
  const { filterValues } = useListContext();

  useEffect(() => {
    if (filterValues?.stage && Array.isArray(filterValues.stage)) {
      updateStagePreferences(filterValues.stage);  // Save to localStorage
    }
  }, [filterValues?.stage]);
};
```

### Example 6: Batch Loading for Display Names
```typescript
// Location: useOrganizationNames.ts
export const useOrganizationNames = (organizationIds: string[] | undefined) => {
  const dataProvider = useDataProvider();
  const [organizationMap, setOrganizationMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationIds || organizationIds.length === 0) return;

    // Only fetch IDs we don't have cached
    const idsToFetch = organizationIds.filter(id => !organizationMap[id]);
    if (idsToFetch.length === 0) return;

    setLoading(true);
    const fetchNames = async () => {
      const { data } = await dataProvider.getMany('organizations', {
        ids: idsToFetch,
      });

      const newMap = data.reduce((acc, org) => {
        acc[String(org.id)] = org.name;
        return acc;
      }, {});

      setOrganizationMap(prev => ({ ...prev, ...newMap }));
    };

    fetchNames().finally(() => setLoading(false));
  }, [organizationIds?.join(',')]);

  return {
    organizationMap,
    getOrganizationName: (id: string) => organizationMap[id] || `Organization #${id}`,
    loading,
  };
};

// Usage in FilterChip:
const { getOrganizationName } = useOrganizationNames([filteredValue]);
return <Chip label={getOrganizationName(filteredValue)} />;
```

### Example 7: React Query Cache Management
```typescript
// Location: OpportunityCreate.tsx
import { useQueryClient } from "@tanstack/react-query";

const OpportunityCreate = () => {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider();

  const onSuccess = async (opportunity: Opportunity) => {
    // 1. Update indexes in database
    await Promise.all(
      opportunities.map((o) =>
        dataProvider.update("opportunities", {
          id: o.id,
          data: { index: o.index + 1 },
          previousData: o,
        })
      )
    );

    // 2. Update React Query cache to reflect changes
    const opportunitiesById = opportunities.reduce((acc, o) => ({
      ...acc,
      [o.id]: { ...o, index: o.index + 1 },
    }), {});

    queryClient.setQueriesData<GetListResult | undefined>(
      { queryKey: ["opportunities", "getList"] },
      (res) => {
        if (!res) return res;
        return {
          ...res,
          data: res.data.map((o) => opportunitiesById[o.id] || o),
        };
      },
      { updatedAt: Date.now() }
    );
  };

  return <CreateBase mutationOptions={{ onSuccess }}>...</CreateBase>;
};
```

## Key Takeaways for Multi-Select Filters

1. **Use ReferenceInput for database-backed choices**: Automatically handles loading, searching, and filtering
2. **Leverage ChoicesContext**: Parent components provide data, children handle UI
3. **Cache Display Names**: Use custom hooks like `useOrganizationNames` for batch-loading lookup values
4. **Pagination Limits**: Set `perPage` based on expected dataset size (10 for small, 25-100 for searchable)
5. **Filter Precedence**: URL → localStorage → defaults (use `filterPrecedence.ts` utilities)
6. **Validation**: Register filterable fields in `filterRegistry.ts` to prevent stale filter errors
7. **No Debouncing Needed**: React Admin's TextInput handles it internally (500ms default)
8. **React Query Cache**: Use `queryClient.setQueriesData()` to update cache after mutations
9. **Filter Cleanup**: Call `useFilterCleanup(resource)` in List components to validate cached filters on mount
10. **localStorage Key Convention**: Use `filter.{filterKey}` for preferences, `RaStore.{resource}.listParams` for React Admin state

## Relevant Documentation

### Internal Documentation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts` - Valid filter fields registry
- `/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/database-schema.research.md` - Database schema analysis
- `/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/requirements.md` - Multi-select filter requirements

### External References
- [React Admin DataProvider Docs](https://marmelab.com/react-admin/DataProviders.html) - useGetList, useGetMany, useDataProvider
- [React Admin Inputs](https://marmelab.com/react-admin/Inputs.html) - ReferenceInput, AutocompleteInput patterns
- [React Query](https://tanstack.com/query/latest/docs/framework/react/overview) - Cache management with `useQueryClient`
- [shadcn/ui Command](https://ui.shadcn.com/docs/components/command) - Combobox component used in AutocompleteInput
