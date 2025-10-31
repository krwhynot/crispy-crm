# React Admin Integration Patterns Research

React Admin integration patterns used throughout the Atomic CRM codebase, with specific focus on List components, input components, data provider architecture, and filter handling for multi-select functionality.

## Relevant Files

### Core List Components
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`: Primary example of List with multi-select filters and filter precedence logic
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx`: List with sidebar filters using ToggleFilterButton
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationList.tsx`: Minimal List implementation with grid display

### Input Components (Admin Layer)
- `/home/krwhynot/Projects/atomic/src/components/admin/multi-select-input.tsx`: Multi-select dropdown with checkboxes for top-bar filters
- `/home/krwhynot/Projects/atomic/src/components/admin/autocomplete-array-input.tsx`: Multi-select autocomplete with badges (for references)
- `/home/krwhynot/Projects/atomic/src/components/admin/reference-array-input.tsx`: Wrapper for ReferenceArrayInput with dataProvider integration
- `/home/krwhynot/Projects/atomic/src/components/admin/search-input.tsx`: Full-text search input component
- `/home/krwhynot/Projects/atomic/src/components/admin/toggle-filter-button.tsx`: Toggle button for sidebar filters, supports multiselect mode

### Data Provider Architecture
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Centralized data provider with validation and transformation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProviderUtils.ts`: Filter transformation logic for PostgREST
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/filterRegistry.ts`: Valid filterable fields registry for filter validation

### Filter System
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChipsPanel.tsx`: Active filter chips display with remove functionality
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useFilterManagement.ts`: Hook for managing filter state operations
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterFormatters.ts`: Utilities for formatting filter values to display labels
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/types.ts`: Type definitions for filter system
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts`: Custom hook for batch fetching organization names
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useSalesNames.ts`: Custom hook for batch fetching sales names
- `/home/krwhynot/Projects/atomic/src/components/admin/filter-form.tsx`: React Admin filter form implementation

### Filter Components (Sidebar)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactListFilter.tsx`: Example sidebar filter with FilterCategory and ToggleFilterButton

## Architectural Patterns

### List Component Structure
**Pattern**: List components follow a 3-layer architecture
```tsx
// Layer 1: Main List component with configuration
const OpportunityList = () => {
  return (
    <List
      perPage={100}
      filter={{ "deleted_at@is": null }}
      sort={{ field: "index", order: "DESC" }}
      filters={opportunityFilters}  // Filter inputs array
      actions={<OpportunityActions />}
    >
      <OpportunityLayout />  // Layer 2
    </List>
  );
};

// Layer 2: Layout uses useListContext to access data
const OpportunityLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  // Conditional rendering based on data/filters
};
```
**Location**: All `*List.tsx` files follow this pattern

### Multi-Select Input Implementation
**Pattern**: Two distinct approaches for multi-select filters

#### Approach 1: Top-bar MultiSelectInput (OpportunityList)
```tsx
const opportunityFilters = [
  <MultiSelectInput
    source="stage"
    emptyText="Stage"
    choices={OPPORTUNITY_STAGE_CHOICES}
    defaultValue={getInitialStageFilter()}  // Filter precedence logic
  />,
  <MultiSelectInput
    source="priority"
    emptyText="Priority"
    choices={[...]}
  />,
];
```
- Uses `useChoicesContext` for choice management
- Uses `useInput` hook for form integration
- Renders dropdown with checkboxes (`DropdownMenuCheckboxItem`)
- Displays selected count badge
- **Location**: `/src/components/admin/multi-select-input.tsx`

#### Approach 2: Sidebar ToggleFilterButton (ContactList)
```tsx
<FilterCategory label="Tags" icon={<Tag />}>
  {tags.map((record) => (
    <ToggleFilterButton
      multiselect={true}  // CRITICAL: enables array accumulation
      key={record.id}
      label={<Badge>{record.name}</Badge>}
      value={{ tags: record.id }}
    />
  ))}
</FilterCategory>
```
- Uses `useListContext` for filter state
- `multiselect=true` accumulates values into array
- Visual feedback with Check/CircleX icons
- **Location**: `/src/components/admin/toggle-filter-button.tsx`

### Reference Array Input Pattern
**Pattern**: ReferenceArrayInput wraps child input with ChoicesContext
```tsx
<ReferenceInput source="customer_organization_id" reference="organizations">
  <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
</ReferenceInput>
```
- `ReferenceArrayInput`: Fetches reference data via `useReferenceArrayInputController`
- `AutocompleteArrayInput`: Renders multi-select with badges
- Uses `setFilters` from ChoicesContext for search filtering
- Badge-based selection UI with X button removal
- **Locations**:
  - `/src/components/admin/reference-array-input.tsx`
  - `/src/components/admin/autocomplete-array-input.tsx`

### Data Provider Filter Transformation
**Pattern**: Array filters transformed to PostgREST operators
```typescript
// transformArrayFilters in dataProviderUtils.ts
// JSONB array fields (tags, email, phone) → @cs operator
{ tags: [1, 2, 3] } → { "tags@cs": "{1,2,3}" }

// Regular enum/text fields → @in operator
{ stage: ["lead", "qualified"] } → { "stage@in": "(lead,qualified)" }
```
- JSONB arrays use `@cs` (contains) operator with `{val1,val2}` format
- Regular fields use `@in` operator with `(val1,val2)` format
- Transformation happens in `applySearchParams` before database query
- **Critical**: Values are escaped via `escapeForPostgREST` with caching
- **Location**: `/src/atomic-crm/providers/supabase/dataProviderUtils.ts:91-142`

### Filter State Management
**Pattern**: useFilterManagement hook provides centralized filter operations
```typescript
const {
  filterValues,           // Current filter state
  addFilterValue,         // Add single or array value
  removeFilterValue,      // Remove from array or delete filter
  toggleFilterValue,      // Toggle in array
  clearFilter,            // Clear specific filter
  isFilterActive,         // Check if filter has value
  activeFilterCount,      // Count of active filters
} = useFilterManagement();
```
- Built on top of `useListContext().setFilters`
- Handles both single values and arrays
- Auto-removes empty arrays
- **Location**: `/src/atomic-crm/filters/useFilterManagement.ts`

### Filter Chips Display Pattern
**Pattern**: FilterChipsPanel shows removable chips for active filters
```tsx
<FilterChipsPanel className="mb-4" />
```
- Uses `flattenFilterValues` to convert arrays to individual chips
- Fetches display names via `useOrganizationNames` and `useSalesNames` hooks
- Each hook batches `dataProvider.getMany()` calls for efficiency
- Filters out internal keys (deleted_at, @operators, q)
- **Locations**:
  - `/src/atomic-crm/filters/FilterChipsPanel.tsx`
  - `/src/atomic-crm/filters/useOrganizationNames.ts`
  - `/src/atomic-crm/filters/useSalesNames.ts`

### Filter Precedence Pattern
**Pattern**: 3-level precedence for default filter values (OpportunityList)
```typescript
const getInitialStageFilter = (): string[] | undefined => {
  // 1. URL parameters (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  // 2. localStorage preferences
  const hiddenStages = JSON.parse(localStorage.getItem('...'));
  // 3. Hardcoded defaults (all except hidden)
  return OPPORTUNITY_STAGE_CHOICES.filter(stage => !hiddenStages.includes(stage));
};
```
- URL > localStorage > defaults
- `updateStagePreferences` persists user selections to localStorage
- **Location**: `/src/atomic-crm/opportunities/OpportunityList.tsx:29-66`

## React Admin Hooks

### Core List Hooks
**Hook**: `useListContext`
```typescript
const {
  data,              // Array of records from dataProvider
  isPending,         // Loading state
  filterValues,      // Current filter object
  setFilters,        // Update filters (merges with existing)
  displayedFilters,  // Which filters are shown in FilterForm
  showFilter,        // Show a filter in FilterForm
  hideFilter,        // Hide a filter from FilterForm
} = useListContext();
```
- **Primary use**: Accessing list state in child components
- **Found in**: OpportunityList, ContactList, FilterChipsPanel, ToggleFilterButton
- **Source**: `ra-core`

### Input Hooks
**Hook**: `useInput`
```typescript
const {
  field,             // { value, onChange, name, onBlur }
  fieldState,        // { error, isDirty, isTouched }
} = useInput({
  source: "stage",
  defaultValue: [],
  validate,
});
```
- **Primary use**: Form integration for custom inputs
- **Found in**: MultiSelectInput, all custom input components
- **Source**: `ra-core`

**Hook**: `useChoicesContext`
```typescript
const {
  allChoices,        // Available choice options
  source,            // Field name
  resource,          // Resource name
  isFromReference,   // Whether choices from reference
  setFilters,        // Update reference query filters
} = useChoicesContext({
  choices: choicesProp,
  resource,
  source,
});
```
- **Primary use**: Accessing choice data in inputs
- **Found in**: MultiSelectInput, AutocompleteArrayInput
- **Source**: `ra-core`

**Hook**: `useChoices`
```typescript
const {
  getChoiceText,     // Get display text for choice
  getChoiceValue,    // Get value for choice
} = useChoices({
  optionText: "name",
  optionValue: "id",
  translateChoice: true,
});
```
- **Primary use**: Choice formatting utilities
- **Found in**: AutocompleteArrayInput, SelectField
- **Source**: `ra-core`

### Reference Hooks
**Hook**: `useReferenceArrayInputController`
```typescript
// Used internally by ReferenceArrayInput
const controllerProps = useReferenceArrayInputController({
  reference: "organizations",
  source: "customer_organization_id",
  sort: { field: "name", order: "ASC" },
  filter: {},
});
```
- **Primary use**: Fetching reference data for array inputs
- **Returns**: ChoicesContext value
- **Found in**: ReferenceArrayInput wrapper
- **Source**: `ra-core`

### Data Provider Hook
**Hook**: `useDataProvider`
```typescript
const dataProvider = useDataProvider();

// Usage for custom data fetching
const { data } = await dataProvider.getMany('organizations', {
  ids: [1, 2, 3]
});
```
- **Primary use**: Direct dataProvider access for custom operations
- **Found in**: useOrganizationNames, useSalesNames hooks
- **Source**: `ra-core`

### Resource/Translation Hooks
**Hook**: `useResourceContext`
```typescript
const resource = useResourceContext();  // e.g., "opportunities"
```
- **Primary use**: Get current resource name
- **Found in**: All admin layer components

**Hook**: `useTranslate`
```typescript
const translate = useTranslate();
translate("ra.action.search", { _: "Search..." });
```
- **Primary use**: i18n translation with fallback
- **Found in**: All UI components

## Gotchas & Edge Cases

### Array Filter Transformation Edge Cases
**Issue**: JSONB array fields require different operator than regular arrays
```typescript
// CRITICAL: JSONB fields (tags, email, phone) use @cs operator
const jsonbArrayFields = ['tags', 'email', 'phone'];
if (jsonbArrayFields.includes(key)) {
  transformed[`${key}@cs`] = `{${value.join(',')}}`;  // @cs for JSONB
} else {
  transformed[`${key}@in`] = `(${value.join(',')})`;  // @in for regular
}
```
- **Why**: PostgreSQL JSONB arrays need "contains" (@cs) not "in" (@in) operator
- **Location**: `/src/atomic-crm/providers/supabase/dataProviderUtils.ts:99-129`

### PostgREST Value Escaping
**Issue**: PostgREST requires specific escaping for special characters
```typescript
// MUST escape backslashes FIRST, then quotes
let escaped = str.replace(/\\/g, '\\\\');  // Backslash → \\
escaped = escaped.replace(/"/g, '\\"');    // Quote → \"
result = `"${escaped}"`;
```
- **Why**: Order matters - escaping quotes first breaks backslash escaping
- **Performance**: Uses LRU-style cache (max 1000 entries, clears half when full)
- **Location**: `/src/atomic-crm/providers/supabase/dataProviderUtils.ts:43-74`

### Filter Registry Validation
**Issue**: Stale cached filters cause 400 errors for non-existent columns
```typescript
// filterRegistry.ts defines valid fields per resource
// ValidationService.validateFilters strips invalid fields
if (!isValidFilterField(resource, filterKey)) {
  // Skip invalid filter silently to prevent API errors
  continue;
}
```
- **Why**: localStorage/URL can contain filters for deleted/renamed columns
- **Solution**: `filterRegistry.ts` defines valid fields, `useFilterCleanup` hook removes stale filters
- **Locations**:
  - `/src/atomic-crm/providers/supabase/filterRegistry.ts`
  - `/src/atomic-crm/hooks/useFilterCleanup.ts` (referenced but not shown)

### MultiSelectInput vs ToggleFilterButton
**Issue**: Two different components for multi-select, easy to confuse

**MultiSelectInput** (top-bar):
- Uses `defaultValue` prop for initial state
- Single dropdown with all choices
- Better for 3-10 options
- Example: Priority, Stage filters

**ToggleFilterButton with `multiselect={true}`** (sidebar):
- Renders individual buttons per choice
- Visual selection state (Check icon)
- Better for dynamic/large choice sets (tags, categories)
- Example: Tag filters in ContactList

### Filter Chips Name Resolution
**Issue**: Filter chips need to fetch names for ID-based filters asynchronously
```typescript
// Extract IDs from filter values
const organizationIds = filterValues?.customer_organization_id
  ? Array.isArray(filterValues.customer_organization_id)
    ? filterValues.customer_organization_id.map(String)
    : [String(filterValues.customer_organization_id)]
  : undefined;

// Batch fetch names with caching
const { getOrganizationName } = useOrganizationNames(organizationIds);
```
- **Why**: Filter values are IDs, but chips need display names
- **Solution**: Custom hooks batch fetch via `dataProvider.getMany()` with internal caching
- **Location**: `/src/atomic-crm/filters/FilterChipsPanel.tsx:20-36`

### Default Values in alwaysOn Filters
**Issue**: Cannot combine `alwaysOn` and `defaultValue` on filter inputs
```typescript
// FilterFormBase throws error if detected
if (filter.props.alwaysOn && filter.props.defaultValue) {
  throw new Error("Cannot use alwaysOn and defaultValue...");
}
```
- **Why**: React Admin expects default filters on `<List filterDefaultValues>` prop instead
- **Solution**: Use `filter` prop on List component for permanent filters
- **Location**: `/src/components/admin/filter-form.tsx:74-79`

### Empty Array Filter Handling
**Issue**: Empty arrays must be removed from filter object
```typescript
// In useFilterManagement.removeFilterValue
if (newValue.length === 0) {
  const { [key]: _, ...rest } = filterValues;
  setFilters(rest);  // Remove filter entirely
}
```
- **Why**: Empty arrays sent to PostgREST cause syntax errors
- **Pattern**: All filter operations check array length before setting
- **Location**: `/src/atomic-crm/filters/useFilterManagement.ts:55-59`

### Summary Views and Soft Delete Filters
**Issue**: Adding `deleted_at@is: null` filter to views causes PostgREST errors
```typescript
// Check if using a view (already handles soft delete internally)
const isView = dbResource.includes("_summary") || dbResource.includes("_view");
const needsSoftDeleteFilter = supportsSoftDelete(resource) && !isView;
```
- **Why**: Summary views (contacts_summary, organizations_summary) filter deleted records internally
- **Solution**: Skip soft delete filter when querying views
- **Location**: `/src/atomic-crm/providers/supabase/dataProviderUtils.ts:216-225`

## Relevant Docs

### React Admin Official
- [useListContext](https://marmelab.com/react-admin/useListContext.html) - List state access
- [useInput](https://marmelab.com/react-admin/useInput.html) - Form integration for inputs
- [useChoicesContext](https://marmelab.com/react-admin/useChoicesContext.html) - Choice data access
- [ReferenceArrayInput](https://marmelab.com/react-admin/ReferenceArrayInput.html) - Reference array handling
- [FilterForm](https://marmelab.com/react-admin/FilterForm.html) - Filter form patterns

### PostgREST
- [Operators](https://postgrest.org/en/stable/references/api/tables_views.html#operators) - @cs, @in, @is operators
- [Reserved Characters](https://postgrest.org/en/stable/references/api/url_grammar.html#reserved-characters) - Escaping requirements

### Internal Documentation
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Engineering constitution, form state rules
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/` - Zod schemas at API boundary
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/types.ts` - Filter type definitions
