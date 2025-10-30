# Multi-Select Filters Architecture - Shared Documentation

The Atomic CRM filter system is built on a robust, multi-layered architecture centered around React Admin's List component with three key pillars: **filter state management** (URL → localStorage → defaults precedence), **PostgREST operator transformation** (array filters → `@in` or `@cs` operators), and **dynamic choice loading** (React Query caching + batch fetching). The existing infrastructure already supports multi-select via `MultiSelectInput` (top-bar dropdowns) and `ToggleFilterButton` (sidebar toggles), with comprehensive filter chip display, validation via `filterRegistry.ts`, and automatic cleanup of stale cached filters. The multi-select enhancement primarily involves extracting existing patterns into reusable hooks (`useOpportunityFilters`, `useDynamicCategories`) and extending the proven filter chip name resolution pattern to support category/tag display names.

## Relevant Files

### Core Filter Infrastructure
- `/src/atomic-crm/filters/FilterChipsPanel.tsx`: Main panel displaying active filters as removable chips with accordion UI and batch name resolution
- `/src/atomic-crm/filters/useFilterManagement.ts`: Centralized hook providing filter operations (add/remove/toggle/clear) with array handling
- `/src/atomic-crm/filters/filterPrecedence.ts`: Three-tier precedence logic (URL > localStorage > defaults) with helper utilities
- `/src/atomic-crm/filters/types.ts`: Comprehensive type definitions including multiselect support and filter value types
- `/src/atomic-crm/filters/filterFormatters.ts`: Utilities converting filter values to human-readable chip labels
- `/src/atomic-crm/filters/useOrganizationNames.ts`: Batch-fetch organization names with in-memory caching (pattern to replicate for categories)
- `/src/atomic-crm/filters/useSalesNames.ts`: Batch-fetch sales person names with in-memory caching

### Multi-Select Input Components
- `/src/components/admin/multi-select-input.tsx`: Dropdown with checkboxes, displays "(X selected)" count, already used in OpportunityList
- `/src/components/admin/toggle-filter-button.tsx`: Sidebar toggle button with `multiselect={true}` prop for array accumulation
- `/src/components/admin/autocomplete-array-input.tsx`: Multi-select autocomplete with badges for reference fields
- `/src/components/admin/reference-array-input.tsx`: Wrapper handling reference data loading via ChoicesContext

### Data Provider & Transformation
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Centralized data provider with Zod validation and transformation
- `/src/atomic-crm/providers/supabase/dataProviderUtils.ts`: Filter transformation logic (arrays → PostgREST `@in`/`@cs` operators)
- `/src/atomic-crm/providers/supabase/filterRegistry.ts`: Valid filterable fields per resource for validation

### Implementation Examples
- `/src/atomic-crm/opportunities/OpportunityList.tsx`: Production example with stage/priority MultiSelectInput and localStorage persistence
- `/src/atomic-crm/contacts/ContactListFilter.tsx`: Sidebar filter example with tags using ToggleFilterButton multiselect

### Validation Layer
- `/src/atomic-crm/validation/opportunities.ts`: Zod schemas for opportunity fields (stage, priority, status enums)
- `/src/atomic-crm/hooks/useFilterCleanup.ts`: Client-side cleanup removing stale cached filters on mount

## Relevant Tables

### opportunities
Primary table for multi-select filter implementation. Key filterable fields:
- **stage** (`opportunity_stage` enum, 8 values) - indexed (btree)
- **priority** (`priority_level` enum, 4 values) - indexed (btree)
- **status** (`opportunity_status` enum, 5 values) - indexed (btree), not yet in UI
- **tags** (`text[]` array) - indexed (gin), stores tag values directly (not foreign keys)
- **customer_organization_id** (bigint FK) - indexed (btree), already filterable via ReferenceInput
- **deleted_at** (timestamptz) - soft delete, auto-filtered via List filter prop

### organizations
Referenced by multiple opportunity foreign keys. Used in ReferenceInput filters:
- **id** (bigint PK) - referenced by customer_organization_id, principal_organization_id, distributor_organization_id
- **name** (text) - displayed in autocomplete and filter chips via `useOrganizationNames` hook

### tags
Standalone table for tag management (NOT used as junction table):
- **id** (bigint PK) - distinct tags available in system
- **name** (text) - tag display name
- **usage_count** (integer) - frequency tracking

**Critical Note**: The `opportunities.tags` field is `text[]` storing tag values directly, NOT foreign keys to tags.id

## Relevant Patterns

**Multi-Select Dropdown Pattern**: Use `<MultiSelectInput source="field" choices={array} />` for enum fields (stage, priority, status) with 3-10 options - renders dropdown with checkboxes, displays selected count badge, integrates directly with React Admin List filters. Example: `/src/atomic-crm/opportunities/OpportunityList.tsx:68-76`

**Sidebar Multi-Select Pattern**: Use `<ToggleFilterButton multiselect={true} value={{ field: value }} />` for dynamic choice sets (tags, categories) - individual toggle buttons with visual feedback (Check icon), wrapped in `<FilterCategory>` for grouping. Example: `/src/atomic-crm/contacts/ContactListFilter.tsx:25-33`

**Reference Array Filter Pattern**: Use `<ReferenceInput source="field_id" reference="resource"><AutocompleteArrayInput /></ReferenceInput>` for foreign key multi-select - automatically loads/searches referenced resource, batch fetches via `getMany()`, displays badges with remove buttons. Example: `/src/atomic-crm/opportunities/OpportunityList.tsx:77-79`

**PostgREST Operator Transformation**: Filter arrays auto-transform in `dataProviderUtils.ts:transformArrayFilters()` - enum/reference fields use `@in` operator with `(val1,val2)` format, JSONB/text array fields (tags, email, phone) use `@cs` (contains) operator with `{val1,val2}` format - transformation happens transparently before database query.

**Filter Precedence System**: Three-tier priority via `filterPrecedence.ts` utilities - URL parameters (highest), localStorage preferences (fallback), system defaults (final) - enables URL sharing while preserving user preferences across sessions. Example: `/src/atomic-crm/opportunities/OpportunityList.tsx:29-66`

**Batch Name Resolution Pattern**: Custom hooks like `useOrganizationNames(ids)` batch-fetch display names via `dataProvider.getMany()` with in-memory caching - prevents N+1 query problem, graceful fallback to "Entity #ID", stable dependency array using `ids?.join(',')`. Example: `/src/atomic-crm/filters/useOrganizationNames.ts`

**Filter Chip Display Pattern**: `FilterChipsPanel` uses `flattenFilterValues()` to convert arrays to individual chips (e.g., `{ stage: ["a", "b"] }` → two chips), fetches names via batch resolution hooks, formats labels via `formatFilterLabel()`, hides internal filters (deleted_at, @operators, q). Example: `/src/atomic-crm/filters/FilterChipsPanel.tsx:40-80`

**Dynamic Choice Loading Pattern**: Use `useGetList(resource, { pagination, sort })` for database-backed choices with appropriate perPage limits (10 for small sets, 100 for searchable) - React Admin handles loading state, React Query caches responses with `[resource, operation]` key format. Example: `/src/atomic-crm/contacts/ContactListFilter.tsx:19-23`

**Filter Validation Pattern**: Two-layer validation - `filterRegistry.ts` defines valid fields per resource, `useFilterCleanup(resource)` proactively removes stale cached filters on mount, API-level `ValidationService` strips invalid fields before query to prevent 400 errors from non-existent columns.

**Array Handling Logic**: Filter values transition single → array when second value added via `toggleFilterMulti()` - first selection stored as single value (simpler URLs), second selection converts to array, empty arrays removed entirely (not sent to API), type guards required when reading filter values.

## Relevant Docs

**existing-filters.research.md**: You _must_ read this when working on filter state management, chip display implementation, multi-select UI components, or filter persistence logic. Contains 24 analyzed files with patterns, edge cases (array handling, URL encoding, localStorage conflicts), and integration points.

**react-admin-patterns.research.md**: You _must_ read this when working on React Admin integration, List component structure, input component selection, or understanding dataProvider filter transformation. Documents 20+ files including core hooks (useListContext, useInput, useChoicesContext), gotchas (JSONB vs regular arrays, empty array handling, alwaysOn+defaultValue conflicts).

**database-schema.research.md**: You _must_ read this when working on query patterns, adding new filterable fields, understanding PostgREST operators, or validating filter implementations. Includes complete opportunities table schema, enum definitions, 14 indexes, operator transformation rules (`@in` vs `@cs`), and critical gotcha about tags storage (text[] not foreign keys).

**dynamic-data.research.md**: You _must_ read this when working on dynamic choice loading, caching strategies, performance optimization, or filter precedence implementation. Contains 48 analyzed files showing pagination limits by use case, React Query cache management, localStorage conventions, batch fetching patterns, and 7 production code examples.

**requirements.md**: You _must_ read this when understanding feature scope, success metrics, implementation steps, testing plan, or out-of-scope items. Defines MVP requirements (multi-select for stage/category/priority/organization), Phase 2 features (Kanban view, saved presets), technical debt, and trade-offs (500 record limit, no server persistence).
