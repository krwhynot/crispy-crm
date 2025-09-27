# Filter Architecture Research

Research into the current filter implementation architecture in the Atomic CRM codebase, focusing on opportunities, admin components, filter UI patterns, and React Admin integration.

## Relevant Files
- `/src/atomic-crm/opportunities/OpportunityList.tsx`: Main opportunity list with filter definitions
- `/src/components/admin/select-input.tsx`: Single-select input component with React Admin integration
- `/src/components/admin/multi-select-input.tsx`: Multi-select dropdown component (basic implementation)
- `/src/components/admin/toggle-filter-button.tsx`: Filter toggle button for sidebar filters
- `/src/atomic-crm/contacts/ContactListFilter.tsx`: Comprehensive sidebar filter implementation example
- `/src/atomic-crm/products/ProductListFilter.tsx`: Another sidebar filter example
- `/src/atomic-crm/filters/FilterCategory.tsx`: Filter category grouping component
- `/src/atomic-crm/tags/TagChip.tsx`: Tag chip component with remove functionality
- `/src/atomic-crm/contacts/TagsList.tsx`: ReferenceArrayField display component
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Data provider with filter processing

## Architectural Patterns

### Filter Implementation Approaches
- **Inline Filters**: Used in `OpportunityList` with `filters` prop on React Admin `<List>` component
- **Sidebar Filters**: Used in contacts/products with `FilterLiveForm` and `ToggleFilterButton` components
- **Search Filters**: Built using `SearchInput` component with `source="q"` for full-text search

### Filter Value Flow in React Admin
- **Definition**: Filters defined in `filters` prop array on `<List>` component
- **State Management**: React Admin manages filter state via `useListContext()` hook
- **Data Provider**: Filter values passed to data provider's `getList()` method as `params.filter`
- **Query Processing**: Unified data provider processes filters including soft delete, search, and custom filters

### Component Architecture Patterns
- **SelectInput**: Single-select with empty value support, create functionality, reset button
- **MultiSelectInput**: Basic dropdown with checkbox items, shows count in trigger button
- **ToggleFilterButton**: Sidebar filter button with active/inactive states and remove functionality
- **FilterCategory**: Grouping component with icon and collapsible sections

### Filter State Management
- **Filter Values**: Accessed via `const { filterValues, setFilters } = useListContext()`
- **Toggle Logic**: Uses lodash `matches()` and `pickBy()` for filter comparison and toggling
- **Filter Reset**: Supports individual filter removal via toggle or full filter reset

## Edge Cases & Gotchas

### Multi-Select Filter Query Format
- Tags filter uses PostgreSQL array contains syntax: `{ "tags@cs": "{tag_id}" }`
- The `@cs` operator is PostgREST syntax for "contains" on JSONB arrays
- Multiple tag selection would need to handle array concatenation or multiple contains queries

### Filter UI State Management
- Current `MultiSelectInput` is basic - no chips display, limited visual feedback
- No built-in support for filter chips in main content area
- React Admin's filter system is designed for form-based filters, not chip-based UX

### Data Provider Filter Processing
- Automatic soft delete filtering: `deleted_at: null` added unless `includeDeleted: true`
- Search query processing with `@or` operator for multiple field search
- Resource-specific search field configuration via `getSearchableFields()`

### SelectInput Gotchas
- Radix Select key workaround for controlled value changes (line 238 in SelectInput)
- Empty value handling - `emptyValue=""` by default, null not supported without custom parse
- Create functionality integrated but requires specific handler setup

### Form Integration Issues
- Filter components need to work both in React Admin filters array and standalone
- Validation and error handling differs between filter context and form context
- Filter form state doesn't use React Hook Form, has its own validation system

## Current Multi-Select Limitations

### Existing MultiSelectInput Component
- Basic dropdown interface with checkboxes
- No visual chip representation of selected items
- Limited to dropdown interaction pattern
- No integration with filter chip display patterns
- Missing keyboard navigation and accessibility features

### Filter Chip Display Gap
- No existing component for showing active filter chips in main content area
- Tags display components (`TagChip`, `TagsList`) are entity-specific, not filter-generic
- No standard pattern for filter chip removal and management

### React Admin Filter Integration
- Standard React Admin filters expect form-style inputs
- No built-in support for chip-based filter UX patterns
- Filter state management assumes traditional form interactions

## Relevant Docs
- [React Admin List Documentation](https://marmelab.com/react-admin/List.html) - Filter system overview
- [PostgREST Operators](https://postgrest.org/en/stable/references/api/resource_representation.html#operators) - Database query operators like `@cs`
- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select) - Base component for SelectInput
- [React Admin Filter Documentation](https://marmelab.com/react-admin/FilteringTutorial.html) - Filter implementation patterns