# React Admin Integration: Kanban Board Architecture Research

**Research Date**: 2025-10-10
**Scope**: Document how the Kanban board integrates with React Admin architecture in Atomic CRM

## Executive Summary

The Atomic CRM Kanban board is built as a **custom list view** within React Admin's architecture. It leverages React Admin's data fetching, filtering, and state management while presenting opportunities in a column-based stage view instead of a traditional table. The implementation is **read-only** (no drag-and-drop) and relies on the `index` field for ordering within columns.

**Key Finding**: This is NOT a typical React Admin Datagrid - it's a custom visualization that consumes React Admin's `ListContext` to render opportunity data in a Kanban format.

---

## 1. Resource Registration

### Location
`/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` (line 143)

### Registration Pattern
```typescript
// Line 11: Import
import opportunities from "../opportunities";

// Line 143: Resource registration
<Resource name="opportunities" {...opportunities} />
```

### Spread Object Contents
From `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/index.ts`:

```typescript
const OpportunityList = React.lazy(() => import("./OpportunityList"));
const OpportunityCreate = React.lazy(() => import("./OpportunityCreate"));
const OpportunityEdit = React.lazy(() => import("./OpportunityEdit"));
const OpportunityShow = React.lazy(() => import("./OpportunityShow"));

export default {
  list: OpportunityList,
  create: OpportunityCreate,
  edit: OpportunityEdit,
  show: OpportunityShow,
};
```

### Resource Configuration Details

**Registered Props:**
- `name`: `"opportunities"` (used for routing, data fetching, cache keys)
- `list`: `OpportunityList` (Kanban view component)
- `create`: `OpportunityCreate`
- `edit`: `OpportunityEdit`
- `show`: `OpportunityShow`

**Performance Optimization:**
- All components are lazy-loaded using `React.lazy()`
- Benefits: Code splitting, improved initial bundle size

**Missing Configurations:**
- No `icon` prop
- No `options` prop (e.g., `{ label: 'Custom Label' }`)
- No `recordRepresentation` prop (defaults to showing `id` in references)
- No resource-level permissions (handled at authProvider or component level)

**Global Configuration:**
- `defaultOpportunityCategories` and `defaultOpportunityStages` are defined in `CRM.tsx` (lines 27-28)
- Passed via `ConfigurationProvider` - not as resource-level props

---

## 2. Data Provider Integration

### Data Fetching Architecture

**Component Hierarchy:**
```
OpportunityList (List wrapper)
  └─> List (React Admin component)
      └─> ListBase (internal controller)
          └─> useListController
              └─> useGetList (React Query hook)
                  └─> unifiedDataProvider.getList()
                      └─> ra-supabase-core baseDataProvider
                          └─> Supabase API
```

### List Component Configuration

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`

```typescript
<List
  perPage={100}                              // Fetch 100 opportunities per request
  filter={{ "deleted_at@is": null }}        // Static filter: exclude soft-deleted
  title={false}                              // Hide default title
  sort={{ field: "index", order: "DESC" }}  // Default sort (highest index first)
  filters={opportunityFilters}               // Dynamic filters from useOpportunityFilters
  actions={<OpportunityActions />}           // Custom action toolbar
  pagination={null}                          // Disable pagination UI (still fetches perPage items)
>
```

### Data Flow Through unifiedDataProvider

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Transform Pipeline:**

1. **Error Wrapping** (line 249)
   - `wrapMethod` provides centralized error logging and formatting
   - Ensures consistent error structure for React Admin

2. **Filter Validation** (line 256)
   ```typescript
   processedParams.filter = validationService.validateFilters(resource, processedParams.filter);
   ```
   - Cleans and validates filters
   - Prevents 400 errors from stale/invalid filter parameters
   - Critical for preventing bugs when filters change

3. **Search Parameter Application** (line 260)
   ```typescript
   const searchParams = applySearchParams(resource, processedParams);
   ```
   - Converts simple filters to Supabase query format
   - Handles full-text search, `ilike` operations, nested filters

4. **Resource Name Mapping** (line 263)
   ```typescript
   const dbResource = getDatabaseResource(resource, "list");
   ```
   - Maps React Admin resource name (`"opportunities"`) to database table/view
   - Allows abstraction between API names and database structure

5. **Base Provider Call** (line 266)
   ```typescript
   const result = await baseDataProvider.getList(dbResource, searchParams);
   ```
   - Delegates to `ra-supabase-core` for actual Supabase interaction

6. **Response Normalization** (line 271)
   ```typescript
   data: normalizeResponseData(resource, result.data)
   ```
   - Ensures JSONB fields are formatted as arrays
   - Standardizes data structure for React Admin components

### Parameters Passed to Data Provider

**From OpportunityList to getList:**
```typescript
{
  resource: "opportunities",
  pagination: { page: 1, perPage: 100 },
  sort: { field: "index", order: "DESC" },
  filter: {
    "deleted_at@is": null,
    // Plus any dynamic filters from useOpportunityFilters:
    stage?: string[],
    sales_id?: string,
    tags?: string[],
    // etc.
  }
}
```

### React Query Cache Management

**Cache Key Structure:**
```typescript
['opportunities', 'getList', {
  pagination: { page: 1, perPage: 100 },
  sort: { field: 'index', order: 'DESC' },
  filter: { "deleted_at@is": null, ...dynamicFilters }
}]
```

**Invalidation Pattern:**
- React Admin mutation hooks (`useCreate`, `useUpdate`, `useDelete`) automatically invalidate relevant cache entries
- When an opportunity is created/updated/deleted, the `['opportunities', 'getList']` cache key is invalidated
- Triggers automatic refetch to update the Kanban board
- Custom methods (RPC calls like `sync_opportunity_with_products`) must manually trigger invalidation

---

## 3. React Admin Patterns & Context Usage

### ListBase and Context Architecture

**Custom List Component**: `/home/krwhynot/Projects/atomic/src/components/admin/list.tsx`

```typescript
export const List = <RecordType extends RaRecord = RaRecord>(props: ListProps<RecordType>) => {
  return (
    <ListBase
      debounce={debounce}
      disableAuthentication={disableAuthentication}
      disableSyncWithLocation={disableSyncWithLocation}
      exporter={exporter}
      filter={filter}
      filterDefaultValues={filterDefaultValues}
      loading={loading}
      perPage={perPage}
      queryOptions={queryOptions}
      resource={resource}
      sort={sort}
      storeKey={storeKey}
    >
      <ListView {...rest} />
    </ListBase>
  );
};
```

**Key Pattern**: `ListBase` provides context, `ListView` renders UI

### useListContext Usage

**In OpportunityListContent** (`/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`):

```typescript
const {
  data: unorderedOpportunities,  // Raw opportunity data from React Query
  isPending,                      // Loading state
  filterValues,                   // Current active filters
} = useListContext<Opportunity>();
```

**Context Properties Available:**
- `data`: Fetched opportunities (array)
- `isPending`: Boolean loading state
- `filterValues`: Object with current filter key-value pairs
- `setFilters`: Function to update filters
- `sort`: Current sort configuration
- `page`, `perPage`: Pagination state (even if UI is hidden)
- `total`: Total count of records
- `refetch`: Function to manually refetch data

### Filter Integration

**Hook**: `useOpportunityFilters()` in `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOpportunityFilters.tsx`

**Filter Management Hook**: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useFilterManagement.ts`

```typescript
export const useFilterManagement = () => {
  const { filterValues, setFilters } = useListContext();

  return {
    filterValues: filterValues || {},
    addFilterValue,        // Add value to array filter
    removeFilterValue,     // Remove value from array filter
    toggleFilterValue,     // Toggle value in array filter
    clearFilter,           // Clear specific filter
    clearAllFilters,       // Clear all filters
    isFilterActive,        // Check if filter has values
    activeFilterCount,     // Count of active filters
  };
};
```

**Key Capabilities:**
- Multi-select filters (arrays)
- Single-value filters
- Automatic array conversion
- Empty array cleanup (removes filter entirely)
- Excludes internal filters (`@` operators, `deleted_at`) from active count

### Filter Chips Display

**Component**: `FilterChipsPanel` in `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChipsPanel.tsx`

- Renders active filters as removable chips
- Integrates with `useFilterManagement` for removal
- Shows filter count in UI
- Uses `FilterContext` from custom List component

### Sorting Behavior

**Default Sort**: `{ field: "index", order: "DESC" }`

**Impact on Kanban**:
- Opportunities are initially fetched sorted by `index` descending
- Within each stage column, opportunities are re-sorted by `index` ascending (see `stages.ts` line 36-42)
- The `index` field is used for manual ordering within columns (lower index = higher position)

**Note**: No drag-and-drop functionality exists in current implementation

---

## 4. Kanban View Rendering

### Component Structure

```
OpportunityList
  └─> List (React Admin wrapper)
      └─> OpportunityLayout
          └─> OpportunityListContent
              └─> OpportunityColumn (one per stage)
                  └─> OpportunityCard (one per opportunity)
```

### Data Transformation: List to Kanban

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts`

```typescript
export const getOpportunitiesByStage = (
  unorderedOpportunities: Opportunity[],
  opportunityStages?: { value: string; label: string }[],
) => {
  // 1. Initialize empty arrays for each stage
  const opportunitiesByStage: Record<string, Opportunity[]> =
    stages.reduce((obj, stage) => ({ ...obj, [stage.value]: [] }), {});

  // 2. Group opportunities by stage
  unorderedOpportunities.reduce((acc, opportunity) => {
    if (acc[opportunity.stage]) {
      acc[opportunity.stage].push(opportunity);
    }
    return acc;
  }, opportunitiesByStage);

  // 3. Sort each column by index (ascending)
  stages.forEach((stage) => {
    if (opportunitiesByStage[stage.value]) {
      opportunitiesByStage[stage.value] = opportunitiesByStage[stage.value].sort(
        (recordA, recordB) => recordA.index - recordB.index
      );
    }
  });

  return opportunitiesByStage;
};
```

**Key Behavior**:
- Creates empty array for ALL stages (even if no opportunities)
- Groups by `opportunity.stage` field
- Sorts within each stage by `index` field (ascending = top to bottom)

### Stage Filtering

**In OpportunityListContent** (lines 20-23):

```typescript
const visibleStages =
  filterValues?.stage && Array.isArray(filterValues.stage) && filterValues.stage.length > 0
    ? allOpportunityStages.filter((stage) => filterValues.stage.includes(stage.value))
    : allOpportunityStages;
```

**Behavior**:
- If stage filter is active, only show filtered columns
- If no stage filter, show all columns
- Stage filter is saved to localStorage via `saveStagePreferences` (lines 64-67 in OpportunityList.tsx)

### Stage Configuration

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

**Defined Stages**:
```typescript
export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  { value: "new_lead", label: "New Lead", color: "var(--info-subtle)", description: "..." },
  { value: "initial_outreach", label: "Initial Outreach", color: "var(--tag-teal-bg)", ... },
  { value: "sample_visit_offered", label: "Sample/Visit Offered", ... },
  { value: "awaiting_response", label: "Awaiting Response", ... },
  { value: "feedback_logged", label: "Feedback Logged", ... },
  { value: "demo_scheduled", label: "Demo Scheduled", ... },
  { value: "closed_won", label: "Closed - Won", ... },
  { value: "closed_lost", label: "Closed - Lost", ... },
];
```

**Helper Functions**:
- `getOpportunityStageLabel(stageValue)` - Get display label
- `getOpportunityStageColor(stageValue)` - Get semantic color variable
- `isActiveStage(stageValue)` - Check if not closed
- `isClosedStage(stageValue)` - Check if closed_won or closed_lost

**Format Variants**:
- `OPPORTUNITY_STAGES` - Full objects with color and description
- `OPPORTUNITY_STAGE_CHOICES` - React Admin SelectInput format (`{ id, name }`)
- `OPPORTUNITY_STAGES_LEGACY` - Backward compatibility format (`{ value, label }`)

### OpportunityColumn Component

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx`

```typescript
export const OpportunityColumn = ({
  stage,
  opportunities,
}: {
  stage: string;
  opportunities: Opportunity[];
}) => {
  return (
    <div className="flex-1 pb-8 min-w-[160px] max-w-[220px]">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {getOpportunityStageLabel(stage)}
        </h3>
      </div>
      <div className="flex flex-col rounded-2xl mt-2 gap-2">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    </div>
  );
};
```

**Styling**:
- Flex column with fixed width constraints
- Horizontal scrolling parent (in OpportunityListContent)
- Gap between cards for visual separation

### OpportunityCard Component

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`

**Key Features**:
- Click to navigate to show view (`/opportunities/:id/show`)
- Keyboard accessible (Enter/Space keys)
- Displays:
  - Organization avatar (via ReferenceField)
  - Opportunity name (truncated with `line-clamp-2`)
  - Priority badge (critical/high/medium/low with color variants)
  - Principal badge (if `principal_organization_id` exists)
- Hover effect (shadow change)
- No drag handles (drag-and-drop not implemented)

---

## 5. View Switching & State Management

### Current State: Single View Only

**Finding**: There is NO view switching mechanism in the current implementation.

**What Exists**:
- Single Kanban view for active opportunities (`OpportunityListContent`)
- Separate archived opportunities list (`OpportunityArchivedList`)
- No table/grid/card alternative views

**Empty State Handling**:
```typescript
if (isPending) return null;
if (!data?.length && !hasFilters) {
  return (
    <>
      <OpportunityEmpty>
        <OpportunityArchivedList />
      </OpportunityEmpty>
    </>
  );
}
return (
  <div className="w-full">
    <OpportunityListContent />
    <OpportunityArchivedList />
  </div>
);
```

### State Persistence Strategy

**Hybrid Approach**:

1. **URL Query Parameters (React Admin Default)**
   - Filters, sorting, pagination automatically synced to URL
   - Enables shareable links with filter state
   - Preserved when navigating away and returning

2. **localStorage for Stage Preferences**
   ```typescript
   useEffect(() => {
     if (filterValues?.stage && Array.isArray(filterValues.stage)) {
       saveStagePreferences(filterValues.stage);
     }
   }, [filterValues?.stage]);
   ```
   - File: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/opportunityStagePreferences.ts`
   - Persists stage filter across browser sessions
   - Independent of URL state
   - Loaded on component mount to restore user preferences

**Trade-offs**:
- **URL Persistence**: Great for shareability, direct linking, team collaboration
- **localStorage**: Better for persistent user preferences across sessions
- **Current Mix**: Pragmatic - stage filter is a common user preference, others are shareable

### React Query State Coordination

**How List Context Coordinates with React Query**:

1. `List` component props change (filter, sort, etc.)
2. React Admin's `useListController` detects change
3. Constructs new query parameters
4. React Query checks cache for matching key
5. If cache miss or stale, triggers `dataProvider.getList()`
6. `useListContext` provides `isPending: true` during fetch
7. React Query caches result with unique key
8. `useListContext` updates with `data` and `isPending: false`
9. Kanban board re-renders with new data

**Cache Invalidation Triggers**:
- Mutation operations (create, update, delete)
- Manual `refetch()` call from context
- React Query's `staleTime` expiration
- Optimistic update rollbacks

---

## 6. Gaps & Limitations

### Missing Features

1. **Drag-and-Drop Reordering**
   - No drag-and-drop library installed (`@dnd-kit`, `react-beautiful-dnd`, etc.)
   - `index` field exists for ordering but must be updated manually
   - No UI for reordering cards within columns
   - No UI for moving cards between stages

2. **View Switching**
   - No table/grid alternative to Kanban view
   - No view toggle UI component
   - All opportunities must be viewed in Kanban format

3. **Pagination**
   - Disabled (`pagination={null}`)
   - Fetches 100 opportunities per request
   - No "load more" or infinite scroll
   - Could cause performance issues with large datasets

4. **Column Customization**
   - No ability to collapse/expand columns
   - No ability to reorder columns
   - All stages always visible (unless filtered)

5. **Card Customization**
   - Fixed card layout (no detail level toggle)
   - No inline editing
   - No quick actions (archive, delete, duplicate)

### Performance Considerations

**Current Setup**:
- Fetches 100 opportunities at once (`perPage={100}`)
- No virtualization for long columns
- Re-renders entire board on any data change
- `isEqual` check in `OpportunityListContent` prevents unnecessary re-grouping

**Potential Issues**:
- Many opportunities in single stage could cause scroll performance issues
- No memoization on OpportunityCard components
- Full board re-render on filter change

### Architectural Strengths

1. **Clean Separation of Concerns**
   - Data fetching in React Admin layer
   - Presentation in Kanban components
   - State management in React Query + ListContext

2. **Type Safety**
   - TypeScript interfaces for all components
   - Zod validation at API boundaries
   - Proper type inference through generics

3. **Filter Reusability**
   - `useFilterManagement` hook can be used across resources
   - Filter UI components decoupled from data layer
   - Stage preferences saved for better UX

4. **Semantic Colors**
   - All stage colors use CSS variables
   - Consistent with Engineering Constitution
   - Easy theme customization

---

## 7. Integration Points for Future Enhancements

### Adding Drag-and-Drop

**Required Changes**:

1. **Install Library**
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable
   ```

2. **Wrap OpportunityListContent**
   ```typescript
   <DndContext onDragEnd={handleDragEnd}>
     <SortableContext items={opportunities}>
       {/* Existing columns */}
     </SortableContext>
   </DndContext>
   ```

3. **Update OpportunityCard**
   - Add `useSortable` hook
   - Add drag handle UI
   - Apply transform/transition styles

4. **Implement handleDragEnd**
   - Calculate new `index` values
   - Detect stage changes
   - Call `dataProvider.update()` or custom RPC
   - Optimistic update with React Query

5. **Update unifiedDataProvider**
   - Add `updateOrder` custom method
   - Batch update multiple opportunities
   - Return updated opportunities for cache invalidation

### Adding View Switching

**Required Changes**:

1. **Create ViewContext**
   ```typescript
   type ViewType = 'kanban' | 'table' | 'grid';
   const ViewContext = createContext<{ view: ViewType, setView: (v: ViewType) => void }>();
   ```

2. **Add View Toggle UI**
   ```typescript
   <ToggleGroup type="single" value={view} onValueChange={setView}>
     <ToggleGroupItem value="kanban">Kanban</ToggleGroupItem>
     <ToggleGroupItem value="table">Table</ToggleGroupItem>
   </ToggleGroup>
   ```

3. **Conditional Rendering in OpportunityLayout**
   ```typescript
   {view === 'kanban' && <OpportunityListContent />}
   {view === 'table' && <OpportunityDataGrid />}
   ```

4. **Persist View Preference**
   - Add to localStorage
   - Or use React Admin's `store` prop on `<List>`

### Adding Pagination/Infinite Scroll

**Required Changes**:

1. **Remove `pagination={null}`** from List component

2. **Add Infinite Scroll**
   ```bash
   npm install react-infinite-scroll-component
   ```

3. **Implement `useInfiniteGetList`** (React Admin v5)
   - Replace `useListContext` in OpportunityListContent
   - Handle page loading state
   - Append data instead of replacing

4. **Update OpportunityListContent**
   ```typescript
   <InfiniteScroll
     dataLength={opportunities.length}
     next={loadMore}
     hasMore={hasMore}
     loader={<Spinner />}
   >
     {/* Columns */}
   </InfiniteScroll>
   ```

---

## 8. Conclusion

### Summary

The Atomic CRM Kanban board is a **well-architected custom list view** that leverages React Admin's strengths while providing a domain-specific visualization. It follows the Engineering Constitution principles (semantic colors, TypeScript, single source of truth) and maintains clean separation between data and presentation layers.

### Key Takeaways

1. **Not a Standard Datagrid**: Custom visualization consuming ListContext
2. **Read-Only**: No drag-and-drop or inline editing
3. **Filter-Driven**: Rich filtering with localStorage preferences
4. **Performance**: Optimized for <100 opportunities per view
5. **Extensible**: Clear integration points for drag-and-drop, view switching, pagination

### Recommended Next Steps

**High Priority**:
1. Add drag-and-drop for reordering and stage changes
2. Implement infinite scroll for large datasets
3. Add performance monitoring for re-render tracking

**Medium Priority**:
1. Add table view alternative
2. Implement column collapse/expand
3. Add quick actions to OpportunityCard

**Low Priority**:
1. Add column reordering
2. Implement card detail level toggle
3. Add keyboard shortcuts for navigation

### Architecture Quality: 8/10

**Strengths**:
- Clean React Admin integration
- Type-safe throughout
- Follows project conventions
- Extensible design

**Areas for Improvement**:
- Missing drag-and-drop (core Kanban feature)
- No virtualization for performance
- Single view only (limits user choice)
- No pagination strategy

---

## Appendix: File Reference

### Core Files Analyzed

| File Path | Purpose |
|-----------|---------|
| `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` | Resource registration |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/index.ts` | Resource config export |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx` | List wrapper component |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx` | Kanban rendering |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityColumn.tsx` | Stage column component |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx` | Individual opportunity card |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stages.ts` | Data grouping logic |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts` | Stage configuration |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useFilterManagement.ts` | Filter state hook |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOpportunityFilters.tsx` | Opportunity-specific filters |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChipsPanel.tsx` | Filter chip display |
| `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` | Data provider |
| `/home/krwhynot/Projects/atomic/src/components/admin/list.tsx` | Custom List component |

### Related Documentation

- React Admin List Components: https://marmelab.com/react-admin/List.html
- React Admin useListContext: https://marmelab.com/react-admin/useListContext.html
- React Query Cache Management: https://tanstack.com/query/latest/docs/framework/react/guides/caching
- Supabase PostgREST Operators: https://postgrest.org/en/stable/references/api/resource_embedding.html

---

**Research Completed**: 2025-10-10
**Researcher**: Claude Code (Sonnet 4.5)
**Status**: Complete
