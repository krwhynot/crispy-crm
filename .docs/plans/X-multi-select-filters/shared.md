# Multi-Select Filters Architecture

The multi-select filter implementation builds upon React Admin's filter system, the Supabase data provider's PostgREST query generation, and existing UI components. The architecture involves transforming array filter values through the unified data provider into PostgREST IN operators, while providing visual feedback via filter chips and dropdown multi-select components. The system leverages existing patterns for single-select filters and extends them with array value accumulation and chip-based UI display.

## Relevant Files

### Core Filter Implementation
- `/src/atomic-crm/opportunities/OpportunityList.tsx`: Current opportunity list with inline filter definitions and stage choices
- `/src/atomic-crm/opportunities/stageConstants.ts`: Stage definitions with colors, labels, and choice arrays
- `/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Form inputs with priority and category choice definitions

### UI Components
- `/src/components/admin/multi-select-input.tsx`: Existing multi-select dropdown component with checkbox items
- `/src/components/admin/select-input.tsx`: Single-select pattern to be replaced with multi-select
- `/src/components/admin/toggle-filter-button.tsx`: Filter toggle button pattern for sidebar filters
- `/src/atomic-crm/tags/TagChip.tsx`: Chip component with remove button - pattern for filter chips
- `/src/components/ui/badge.tsx`: Badge component with semantic color variants
- `/src/components/ui/accordion.tsx`: Collapsible panel component for filter chip container

### Data Provider & Filter Processing
- `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Main data provider with filter processing and search
- `/src/atomic-crm/providers/supabase/resources.ts`: Resource configuration and searchable field definitions
- `/src/atomic-crm/providers/commons/activity.ts`: Examples of PostgREST IN operator usage patterns
- `/node_modules/@raphiniert/ra-data-postgrest/esm/urlBuilder.js`: PostgREST filter parsing logic

### Type Definitions & Validation
- `/src/types/database.generated.ts`: Generated TypeScript types and enum constants from Supabase
- `/src/atomic-crm/validation/opportunities.ts`: Zod validation schemas for opportunity fields
- `/src/lib/color-types.ts`: Semantic color system and CSS variable definitions

## Relevant Tables

### opportunities
- `stage` (opportunity_stage enum): Pipeline stage with 8 defined values including closed states
- `priority` (priority_level enum): Four levels (low, medium, high, critical)
- `category` (text): Business category field for filtering
- `customer_organization_id` (bigint FK): Reference to customer organization
- `tags` (text[]): PostgreSQL array field for multi-tag categorization

### organizations
- `organization_type` (enum): Type categorization for organization filtering
- `priority` (varchar): A/B/C/D priority ranking
- `segment` (text): Business segment classification

## Relevant Patterns

**PostgREST IN Operator**: Format filter values as `"field@in": "(value1,value2,value3)"` with proper escaping for strings, example in `/src/atomic-crm/providers/commons/activity.ts:47`

**React Admin Filter State**: Access via `useListContext()` hook, filter values stored as object with key-value pairs, managed by React Admin's internal state

**Multi-Select Value Management**: Array values with spread operator for additions and filter() for removals, pattern in `/src/components/admin/multi-select-input.tsx:151-159`

**Filter Chip Display**: TagChip component pattern with remove button and hover states, uses semantic colors and stopPropagation, see `/src/atomic-crm/tags/TagChip.tsx`

**LocalStorage Preferences**: React Admin's `localStorageStore(undefined, "CRM")` automatically persists filter state, can extend for custom preferences

**Semantic Color System**: Use CSS variables (`--primary`, `--destructive`) never hex codes, all color definitions in `/src/index.css`

**Choice Array Format**: React Admin standard `{ id: string, name: string }[]` where id matches database enum values

**Soft Delete Filtering**: Unified data provider automatically adds `deleted_at: null` filter unless `includeDeleted: true` specified

## Relevant Docs

### Core Requirements & Planning
**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/requirements.md`**: You _must_ read this when working on implementation details, default behavior, and user experience requirements.

**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/implementation-gaps.md`**: You _must_ read this FIRST - addresses critical array-to-IN conversion issue and all identified gaps with solutions.

**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/implementation-strategy.md`**: You _must_ read this for step-by-step implementation phases, file modification locations, and code integration points.

### Research & Architecture
**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/filter-architecture.docs.md`**: You _must_ read this when working on filter component integration and React Admin filter patterns.

**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/data-provider-patterns.docs.md`**: You _must_ read this when working on PostgREST query generation and filter processing.

**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/ui-component-patterns.docs.md`**: You _must_ read this when working on UI components, chip displays, and user interactions.

**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/database-schema.docs.md`**: You _must_ read this when working on database queries, enum values, and type definitions.

### Testing & Validation
**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/testing-plan.md`**: You _must_ read this for test scenarios, performance benchmarks, and user acceptance criteria.

**`/home/krwhynot/Projects/atomic/.docs/plans/multi-select-filters/constitution-compliance-review.md`**: Reference this to ensure all implementation follows Engineering Constitution principles.