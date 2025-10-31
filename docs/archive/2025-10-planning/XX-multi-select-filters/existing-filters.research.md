# Existing Filter System Research

Research conducted to understand current filter implementations in Atomic CRM for multi-select filter enhancement.

## Overview

The Atomic CRM has a sophisticated, well-architected filter system built on React Admin's filtering capabilities. The system supports both single-value and multi-value filters with URL persistence, localStorage preferences, and a centralized management layer. Key findings show robust multi-select support already exists via `ToggleFilterButton` (sidebar) and `MultiSelectInput` (top bar), with comprehensive filter state management and dynamic choice loading.

## Relevant Files

### Core Filter Infrastructure
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChipsPanel.tsx`: Main panel component displaying active filters as removable chips with accordion UI
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useFilterManagement.ts`: Centralized hook for filter state operations (add/remove/toggle/clear)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/types.ts`: Comprehensive type definitions with multiselect support documentation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterFormatters.ts`: Utilities for converting filter values to human-readable labels
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterPrecedence.ts`: URL > localStorage > defaults precedence logic with helper functions
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChip.tsx`: Individual chip component with remove functionality
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterCategory.tsx`: Sidebar section component for grouping filters
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/index.ts`: Central export point for all filter utilities

### Dynamic Choice Loading Hooks
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts`: Batch-fetches organization names with caching for filter chip display
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useSalesNames.ts`: Batch-fetches sales person names with caching for filter chip display

### Admin Layer Components (React Admin Integration)
- `/home/krwhynot/Projects/atomic/src/components/admin/toggle-filter-button.tsx`: Toggle button with multi-select mode for sidebar filters
- `/home/krwhynot/Projects/atomic/src/components/admin/multi-select-input.tsx`: Dropdown with checkboxes for top-bar filters (already used in OpportunityList)
- `/home/krwhynot/Projects/atomic/src/components/admin/filter-form.tsx`: Filter form container with saved query support
- `/home/krwhynot/Projects/atomic/src/components/admin/autocomplete-array-input.tsx`: Multi-value autocomplete for reference filters

### Implementation Examples
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`: Uses MultiSelectInput for stage/priority filters with localStorage persistence
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx`: Uses sidebar filters with ToggleFilterButton multiselect mode
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactListFilter.tsx`: Sidebar filter implementation with tags multiselect
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OnlyMineInput.tsx`: Custom filter input example using Switch component

### Validation & Registry
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts`: Defines valid filterable fields per resource to prevent 400 errors
- `/home/krwhynot/Projects/atomic/src/atomic-crm/hooks/useFilterCleanup.ts`: Client-side hook to clean stale cached filters from localStorage
- `/home/krwhynot/Projects/atomic/src/hooks/filter-context.tsx`: Context for making filters accessible to sub-components

## Architectural Patterns

### Multi-Select Implementation Patterns

**Pattern 1: Top Bar MultiSelectInput** (OpportunityList)
```typescript
<MultiSelectInput
  source="stage"
  emptyText="Stage"
  choices={OPPORTUNITY_STAGE_CHOICES}
  defaultValue={getInitialStageFilter()}
/>
```
- Dropdown menu with checkboxes
- Displays "(X selected)" count in button
- "Clear All" option when selections exist
- Integrates directly with React Admin's `filters` prop

**Pattern 2: Sidebar ToggleFilterButton** (ContactListFilter)
```typescript
<ToggleFilterButton
  multiselect
  className="w-full justify-between"
  label={<Badge variant="secondary">{record.name}</Badge>}
  value={{ tags: record.id }}
/>
```
- Toggle buttons that accumulate into arrays
- Shows check icon when selected
- Handles both single value and array conversion
- Wrapped in `<FilterCategory>` for grouping

### Filter State Management

**Core Hook: `useFilterManagement`**
```typescript
const {
  filterValues,          // Current filter object
  addFilterValue,        // Add value to array or set single value
  removeFilterValue,     // Remove specific value from array
  toggleFilterValue,     // Toggle value in/out of array
  clearFilter,           // Clear all values for a filter
  clearAllFilters,       // Clear entire filter state
  isFilterActive,        // Check if filter has values
  activeFilterCount,     // Count of active filters
} = useFilterManagement();
```

**Filter Value Types**
```typescript
type SingleFilterValue = string | number | boolean | null | undefined;
type ArrayFilterValue = string[] | number[];
type FilterValue = SingleFilterValue | ArrayFilterValue;
```

**Array Handling Logic**
- Single value → Array conversion when second value added
- Empty array → Filter removed entirely
- Type guards: `isArrayFilterValue()`, `isSingleFilterValue()`, `isValidFilterValue()`

### Filter Persistence (Precedence System)

**Priority Order: URL > localStorage > Defaults**

1. **URL Parameters** (Highest Priority)
   ```typescript
   parseUrlFilters(window.location.search)
   // Handles both single values and JSON arrays
   // Example: ?stage=["qualified","proposal"]
   ```

2. **localStorage Preferences** (Fallback)
   ```typescript
   getStoredFilterPreferences('filter.stage')
   // Resource-specific keys: 'RaStore.{resource}.listParams'
   ```

3. **System Defaults** (Final Fallback)
   ```typescript
   getDefaultVisibleStages() // Returns all except closed stages
   ```

**Stage Persistence Example (OpportunityList)**
```typescript
// On mount: Load preferences
const getInitialStageFilter = (): string[] => {
  // 1. Check URL
  const urlFilter = parseUrlParams();
  if (urlFilter) return urlFilter;

  // 2. Check localStorage
  const hidden = JSON.parse(localStorage.getItem('opportunity_hidden_stages') || '["closed_won", "closed_lost"]');

  // 3. Return visible stages
  return ALL_STAGES.filter(stage => !hidden.includes(stage));
};

// On change: Save preferences
useEffect(() => {
  if (filterValues?.stage && Array.isArray(filterValues.stage)) {
    updateStagePreferences(filterValues.stage);
  }
}, [filterValues?.stage]);
```

### Filter Chip Display System

**Architecture Flow**
1. `FilterChipsPanel` gets filter values from `useFilterManagement()`
2. Extracts organization/sales IDs → passes to name-fetching hooks
3. Calls `flattenFilterValues()` to convert arrays to individual chips
4. Each chip formatted via `formatFilterLabel()` with name resolvers
5. Chips render with remove handlers tied to `removeFilterValue()`

**Flattening Logic**
```typescript
// Input: { stage: ["qualified", "proposal"], priority: "high" }
// Output: [
//   { key: "stage", value: "qualified" },
//   { key: "stage", value: "proposal" },
//   { key: "priority", value: "high" }
// ]
```

**Name Resolution Pattern**
```typescript
// 1. Extract IDs from filter values
const organizationIds = filterValues?.customer_organization_id
  ? Array.isArray(value) ? value.map(String) : [String(value)]
  : undefined;

// 2. Batch fetch names (cached)
const { getOrganizationName } = useOrganizationNames(organizationIds);

// 3. Format chip label
const label = formatFilterLabel(
  'customer_organization_id',
  orgId,
  getOrganizationName  // Resolver function
);
```

### Dynamic Choice Loading

**Pattern: Batch Fetch with Caching**
```typescript
export const useOrganizationNames = (organizationIds: string[] | undefined) => {
  const [organizationMap, setOrganizationMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only fetch IDs we don't have cached
    const idsToFetch = organizationIds.filter(id => !organizationMap[id]);

    if (idsToFetch.length === 0) return;

    const { data } = await dataProvider.getMany('organizations', { ids: idsToFetch });

    // Merge with existing cache
    setOrganizationMap(prev => ({ ...prev, ...newMap }));
  }, [organizationIds?.join(',')]);

  return {
    getOrganizationName: (id: string) => organizationMap[id] || `Organization #${id}`,
    loading
  };
};
```

**Benefits**
- Avoids N+1 query problem
- Caches names across component lifecycle
- Graceful fallback to ID display
- Dependency array uses `join(',')` for stable comparison

### Filter Validation & Cleanup

**Two-Layer Validation System**

1. **Client-Side (useFilterCleanup hook)**
   ```typescript
   // Proactively cleans stale filters from localStorage
   useFilterCleanup('contacts');

   // Checks filterRegistry.ts for valid fields
   // Removes invalid filters before they cause UI issues
   ```

2. **API-Level (ValidationService in dataProvider)**
   ```typescript
   // Validates against filterableFields registry
   // Prevents 400 errors from non-existent columns
   // Example: Removed 'nb_tasks' filter causes no errors
   ```

**Filter Registry Pattern**
```typescript
export const filterableFields: Record<string, string[]> = {
  contacts: [
    "first_name", "last_name", "tags",  // Arrays supported
    "last_seen", "sales_id",            // Operators: @gte, @lte
    "q"                                  // Special: full-text search
  ],
  opportunities: [
    "stage", "priority", "tags",         // Multi-select fields
    "customer_organization_id",          // Reference field
    "deleted_at"                         // System filter (hidden)
  ]
};

// Validation handles operators automatically
isValidFilterField('contacts', 'last_seen@gte') // true
```

### Custom Filter Components

**OnlyMineInput Pattern** (Boolean-like toggle)
```typescript
export const OnlyMineInput = () => {
  const { filterValues, setFilters } = useListFilterContext();
  const { identity } = useGetIdentity();

  const handleChange = () => {
    const newFilters = { ...filterValues };
    if (filterValues.opportunity_owner_id !== undefined) {
      delete newFilters.opportunity_owner_id;  // Toggle off
    } else {
      newFilters.opportunity_owner_id = identity?.id;  // Toggle on
    }
    setFilters(newFilters);
  };

  return <Switch checked={!!filterValues.opportunity_owner_id} onCheckedChange={handleChange} />;
};
```

**Key Lessons**
- Use `useListFilterContext()` for filter state access
- Directly manipulate filter object for custom logic
- Works with `alwaysOn` prop for permanent display

## Edge Cases & Gotchas

### Filter Value Type Conversion
**Issue**: React Admin stores filter values as various types (string, number, array)

**Solution in `toggleFilterMulti()`**:
```typescript
// Handles 4 scenarios:
// 1. Array with value → Remove value
// 2. Array without value → Add value
// 3. Single value matches → Remove filter
// 4. Single value differs → Convert to array [old, new]
// 5. No value → Set single value (not array yet)
```

**Gotcha**: First selection is single value, second selection converts to array
- **Why**: Reduces URL complexity for simple filters
- **Impact**: Type guards required when reading filter values

### FilterChipsPanel Hidden Filters
**Issue**: Some filters should not display as chips (internal/system filters)

**Solution in `shouldDisplayFilter()`**:
```typescript
const hiddenFilters = [
  'deleted_at',    // System filter for soft deletes
  'sales_id',      // Replaced by better labels
  'q',             // Search query (shown elsewhere)
];

// Also skip PostgREST operators
if (key.includes('@')) return false;  // e.g., 'last_seen@gte'
```

### Stage Filter Persistence Logic
**Gotcha**: OpportunityList stores "hidden stages" instead of "selected stages"

**Current Implementation**:
```typescript
// Stores stages to HIDE, not stages to SHOW
const hiddenStages = JSON.parse(
  localStorage.getItem('opportunity_hidden_stages') || '["closed_won", "closed_lost"]'
);

// Visible stages = All stages minus hidden
return ALL_STAGES.filter(stage => !hiddenStages.includes(stage));
```

**Implication**: Inverted logic - saving selected stages requires filtering to hidden stages first
- **Note**: This pattern may need refactoring per requirements.md (store selected stages directly)

### URL Parameter Encoding
**Gotcha**: Arrays must be JSON-encoded in URL params

```typescript
// Correct format
?filter={"stage":["qualified","proposal"]}

// Incorrect (PostgREST format, doesn't work with React Admin)
?stage=in.(qualified,proposal)
```

**Parser handles both**:
```typescript
try {
  const parsed = JSON.parse(value);
  if (Array.isArray(parsed)) {
    filters[key] = parsed;
  }
} catch {
  filters[key] = value;  // Fallback to string
}
```

### Choice Loading Race Conditions
**Issue**: Filter choices may not be loaded when default values applied

**Mitigation in AutocompleteArrayInput**:
```typescript
// Uses React Admin's ChoicesContext
const { allChoices, isFromReference, setFilters } = useChoicesContext(props);

// Automatically handles loading state
// Shows spinner until choices available
// Prevents crashes from missing choice data
```

### Empty Array vs Undefined
**Gotcha**: Empty arrays should remove filter, not create empty condition

```typescript
// In removeFilterValue()
if (newValue.length === 0) {
  const { [key]: _, ...rest } = filterValues;
  setFilters(rest);  // Remove key entirely
} else {
  setFilters({ ...filterValues, [key]: newValue });
}
```

**Why**: Empty array in URL/storage wastes space and can cause query issues

### localStorage Key Conflicts
**Gotcha**: React Admin uses specific key format for filter persistence

```typescript
// Correct format (used by React Admin internally)
'RaStore.{resource}.listParams'

// Custom filter preferences (separate namespace)
'opportunity_hidden_stages'  // App-specific
'filter.{filterKey}'         // Generic pattern
```

**Cleanup Strategy**: `useFilterCleanup` only touches `RaStore.*` keys to avoid conflicts

## Reusable Components & Patterns

### 1. Multi-Select Dropdown Pattern
**Use Case**: Top bar filters with dropdown UI

**Component**: `MultiSelectInput`
- Displays count badge
- Clear all option
- Checkbox items
- Already integrated in OpportunityList

**Example**:
```typescript
<MultiSelectInput
  source="priority"
  emptyText="Priority"
  choices={[
    { id: "low", name: "Low" },
    { id: "medium", name: "Medium" },
    { id: "high", name: "High" },
  ]}
/>
```

### 2. Sidebar Toggle Pattern
**Use Case**: Sidebar filters with toggle buttons

**Component**: `ToggleFilterButton` + `FilterCategory`
- Groups related filters
- Visual feedback (check icon)
- Multiselect mode via prop

**Example**:
```typescript
<FilterCategory label="Tags" icon={<Tag />}>
  {tags.map(tag => (
    <ToggleFilterButton
      multiselect
      key={tag.id}
      label={<Badge>{tag.name}</Badge>}
      value={{ tags: tag.id }}
    />
  ))}
</FilterCategory>
```

### 3. Reference Filter Pattern
**Use Case**: Multi-select from related resource

**Component**: `AutocompleteArrayInput` + `ReferenceInput`
- Async search
- Batch loading
- Works with React Admin's reference system

**Example**:
```typescript
<ReferenceInput source="customer_organization_id" reference="organizations">
  <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
</ReferenceInput>
```

### 4. Dynamic Choice Hook Pattern
**Use Case**: Load filter choices from database with caching

**Template**:
```typescript
export const use[Entity]Names = (ids: string[] | undefined) => {
  const dataProvider = useDataProvider();
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const idsToFetch = ids?.filter(id => !nameMap[id]) || [];
    if (idsToFetch.length === 0) return;

    const { data } = await dataProvider.getMany('[resource]', { ids: idsToFetch });
    setNameMap(prev => ({ ...prev, ...newMap }));
  }, [ids?.join(',')]);

  return {
    get[Entity]Name: (id: string) => nameMap[id] || `[Entity] #${id}`,
    loading
  };
};
```

### 5. Filter Chip Panel Pattern
**Use Case**: Display active filters with remove option

**Component**: `FilterChipsPanel`
- Auto-flattens arrays
- Fetches display names dynamically
- Accordion UI with count
- Already implemented and working

**Integration**:
```typescript
<List filters={filters} ...>
  <FilterChipsPanel className="mb-4" />
  <YourListContent />
</List>
```

## Current Limitations & Issues

### 1. Stage Persistence Inversion
**Issue**: OpportunityList stores hidden stages instead of selected stages
- Current: `opportunity_hidden_stages: ["closed_won", "closed_lost"]`
- Desired: `opportunity_visible_stages: ["qualified", "proposal", ...]`

**Impact**: Confusing logic, harder to reason about defaults

**Fix Location**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx` lines 46-66

### 2. Missing Dynamic Category Hook
**Issue**: No `useDynamicCategories()` hook for fetching distinct tags
- Requirements specify 24-hour cache for tag choices
- Currently using static choices or manual fetching

**Implementation Needed**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useDynamicCategories.ts`

### 3. No Centralized Opportunity Filter Hook
**Issue**: Filter configuration duplicated in OpportunityList
- Hard to share between List and future Kanban view
- Violates DRY principle

**Solution Required**: Extract to `useOpportunityFilters()` hook per requirements

### 4. FilterChipsPanel Performance with Many Filters
**Issue**: Name fetching happens on every render
- Could be optimized with React Query or better memoization
- Not a problem with current data volumes (<100 filters)

**Future Enhancement**: Implement `useQueries()` pattern for parallel name fetching

### 5. No Filter Analytics
**Issue**: No tracking of which filters users actually use
- Can't identify unused filters for cleanup
- Missing data for UX improvements

**Out of Scope**: Marked for Phase 2 in requirements

### 6. LocalStorage Size Limits
**Concern**: Complex filter states could exceed 5MB localStorage limit
- Current format is verbose (JSON-encoded arrays)
- No compression or cleanup strategy

**Mitigation**: Limit to 500 records reduces filter complexity in practice

## Integration Points for Multi-Select Enhancement

### 1. OpportunityList Integration
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`

**Current State**:
- Already uses `MultiSelectInput` for stage/priority
- Has stage persistence logic (needs refactoring)
- Uses `FilterChipsPanel` for chip display

**Changes Needed**:
- Extract filters to `useOpportunityFilters()` hook
- Fix stage persistence (store selected, not hidden)
- Add dynamic category loading
- Remove pagination, add performance warning

### 2. FilterChipsPanel Enhancement
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChipsPanel.tsx`

**Current State**:
- Handles array values correctly
- Fetches organization/sales names
- Accordion UI with count

**Changes Needed**:
- Add category name resolver (new `useCategoryNames()` hook)
- Ensure proper formatting for all multi-value filters
- Test with 500+ records

### 3. Filter Precedence System
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterPrecedence.ts`

**Current State**:
- Robust URL > localStorage > defaults logic
- Helper functions for common operations
- Stage-specific functions (need generalization)

**Changes Needed**:
- None required - system already supports multi-select
- Could add generic `getInitialFilterValue()` wrapper for any filter

### 4. Validation Registry
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts`

**Current State**:
- Defines valid fields per resource
- Handles operator suffixes (@gte, @lte)
- Used by both client and API validation

**Changes Needed**:
- Verify all multi-select fields are registered
- Ensure `tags` field is present for opportunities
- No schema changes required

## Recommendations for Implementation

### 1. Leverage Existing Infrastructure
- **DO NOT rebuild filter state management** - `useFilterManagement()` already handles multi-select
- **DO NOT create new chip components** - `FilterChipsPanel` already works with arrays
- **DO NOT reimplement precedence** - `filterPrecedence.ts` utilities are solid

### 2. Create Minimal New Components
**Required**:
- `useOpportunityFilters()` hook - centralize filter config
- `useDynamicCategories()` hook - fetch distinct tags with cache
- `opportunityStages.ts` utility - fix persistence logic (selected not hidden)

**Optional**:
- `useCategoryNames()` hook - resolve category IDs to names (if categories are IDs, not strings)

### 3. Refactor Existing Code
**OpportunityList.tsx**:
- Replace inline filter array with hook
- Move stage persistence to utility module
- Use existing `MultiSelectInput` for tags

**FilterChipsPanel.tsx**:
- Add category name resolution if needed
- No structural changes required

### 4. Testing Strategy
**Unit Tests** (new files):
- Test `getDefaultVisibleStages()` logic
- Test `useDynamicCategories()` caching
- Test array flattening edge cases

**Integration Tests** (existing):
- Verify chip removal works with arrays
- Test URL parameter encoding/decoding
- Validate localStorage persistence

### 5. Performance Considerations
- **Limit to 500 records** - prevents React render issues
- **Cache category choices** - 24-hour TTL per requirements
- **Batch name fetching** - already implemented in `useOrganizationNames()` pattern
- **Debounce search input** - if adding search to category dropdown

## Code Examples for Common Tasks

### Add Multi-Select Filter to Any List
```typescript
import { MultiSelectInput } from '@/components/admin/multi-select-input';

const filters = [
  <MultiSelectInput
    source="priority"
    emptyText="Priority"
    choices={priorityChoices}
    defaultValue={['high', 'medium']}  // Optional defaults
  />
];

<List filters={filters}>
  <FilterChipsPanel />  {/* Auto-displays active filters */}
  <YourListContent />
</List>
```

### Add Custom Name Resolution to FilterChipsPanel
```typescript
// 1. Create hook (follow useOrganizationNames pattern)
export const useCategoryNames = (categoryIds?: string[]) => {
  // ... batch fetch implementation
  return { getCategoryName };
};

// 2. Update FilterChipsPanel.tsx
const { getCategoryName } = useCategoryNames(categoryIds);

const label = formatFilterLabel(
  chip.key,
  chip.value,
  getOrganizationName,
  getSalesName,
  getCategoryName  // Add new resolver
);
```

### Create Centralized Filter Hook
```typescript
export const useOpportunityFilters = () => {
  const categoryChoices = useDynamicCategories();

  return [
    <SearchInput source="q" alwaysOn />,
    <MultiSelectInput
      source="stage"
      choices={OPPORTUNITY_STAGE_CHOICES}
      defaultValue={getDefaultVisibleStages()}
    />,
    <MultiSelectInput source="tags" choices={categoryChoices} />,
    // ... other filters
  ];
};

// Usage in OpportunityList
const filters = useOpportunityFilters();
<List filters={filters}>...</List>
```

### Implement Dynamic Choice Loading with Cache
```typescript
export const useDynamicCategories = () => {
  const CACHE_KEY = 'opportunity_categories';
  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  const [choices, setChoices] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
    return [];
  });

  useEffect(() => {
    // Query distinct tags from opportunities
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('opportunities')
        .select('tags')
        .not('tags', 'is', null);

      const uniqueTags = [...new Set(data.flatMap(d => d.tags || []))];
      const choices = uniqueTags.map(tag => ({ id: tag, name: tag }));

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: choices,
        timestamp: Date.now()
      }));

      setChoices(choices);
    };

    if (choices.length === 0) fetchCategories();
  }, []);

  return choices;
};
```

## Documentation References

### Internal Documentation
- Requirements: `/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/requirements.md`
- Database Schema: `/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/database-schema.research.md`
- Engineering Constitution: `/home/krwhynot/Projects/atomic/CLAUDE.md`

### React Admin Docs
- Filter Documentation: https://marmelab.com/react-admin/List.html#filters
- Array Filters: https://marmelab.com/react-admin/FilteringTutorial.html#filtering-on-array-values
- ChoicesContext: https://marmelab.com/react-admin/useChoicesContext.html

### Component Library
- shadcn/ui Dropdown: Used in MultiSelectInput
- Lucide Icons: Filter icons (Check, CircleX, X, Tag, Clock, Users)
- CMDK: Command palette library (AutocompleteArrayInput)

---

**Research Completed**: 2025-10-10
**Files Analyzed**: 24 components, 3 hooks, 2 utility modules
**Multi-Select Support**: Already implemented and production-ready
**Key Insight**: Minimal new code required - infrastructure exists, needs organization and refinement
