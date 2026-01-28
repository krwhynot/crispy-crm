# Filter System Documentation

## Overview

FilterChipBar displays active filters as removable chips with keyboard navigation and accessibility support. This system integrates with React Admin's list filtering to provide a visual representation of active filters above the data grid.

## Components

- **FilterChipBar**: Container component that renders all active filter chips
- **FilterChip**: Individual chip with label and remove button
- **useFilterChipBar**: Hook that transforms filter values into chip data

## Filter Configuration

### Basic Filter (Select)

The simplest filter type with predefined choices:

```typescript
{
  key: "status",
  label: "Status",
  type: "select",
  choices: [
    { id: "active", name: "Active" },
    { id: "disabled", name: "Disabled" }
  ]
}
```

### Reference Filter

Displays referenced resource names (e.g., organization names instead of IDs):

```typescript
{
  key: "organization_id",
  label: "Organization",
  type: "reference",
  reference: "organizations"  // Uses useOrganizationName hook for label resolution
}
```

**Supported references:**
- `organizations` - Resolved via `useOrganizationName`
- `sales` - Resolved via `useSalesName`
- `tags` - Resolved via `useTagName`
- `segments` - Resolved via `useSegmentName`
- `categories` - Resolved via `useCategoryName`

### Boolean Filter

For true/false values:

```typescript
{
  key: "disabled",
  label: "Status",
  type: "boolean",
  choices: [
    { id: "active", name: "Active" },     // false
    { id: "disabled", name: "Disabled" }   // true
  ]
}
```

**Mapping convention:** First choice = false, Second choice = true

### Removal Groups (Date Ranges)

Date ranges use two separate filters (`@gte` and `@lte`) but should display as a single chip:

```typescript
[
  {
    key: "created_at@gte",
    label: "Created After",
    type: "date-range",
    removalGroup: "created_range"  // Group identifier
  },
  {
    key: "created_at@lte",
    label: "Created Before",
    type: "date-range",
    removalGroup: "created_range"  // Same group identifier
  }
]
```

**Behavior:**
- Both filters are combined into a single chip: "Jan 1 – Jan 31"
- Removing the chip clears BOTH `@gte` and `@lte` filters
- Preset detection: Displays "This week", "Last month", etc. for common date ranges
- Custom ranges: Displays formatted dates "Jan 1 – Jan 31"

**Key Points:**
- `removalGroup` must be the same for all filters in the group
- The label automatically cleans up "After"/"Before"/"@gte"/"@lte" suffixes
- Chip removal clears ALL filters in the group (prevents orphaned range filters)

### Dynamic Choices (Context-Dependent)

Use callbacks for choices that depend on feature context:

```typescript
{
  key: "category",
  label: "Category",
  type: "select",
  choices: (context) => {
    // context is ConfigurationContext from feature
    return context.categories.map(cat => ({
      id: cat.id,
      name: cat.name
    }));
  }
}
```

**Usage:**
```tsx
<FilterChipBar
  filterConfig={MY_FILTER_CONFIG}
  context={configurationContext}  // Pass context for dynamic choices
/>
```

### Custom Label Formatting

Override the default label resolution:

```typescript
{
  key: "priority",
  label: "Priority",
  type: "select",
  choices: [
    { id: "high", name: "High" },
    { id: "medium", name: "Medium" },
    { id: "low", name: "Low" }
  ],
  formatLabel: (value) => {
    // Custom formatting logic
    return `Priority: ${value}`.toUpperCase();
  }
}
```

## Integration Example

```tsx
import { FilterChipBar } from "@/atomic-crm/filters/FilterChipBar";
import { ORGANIZATION_FILTER_CONFIG } from "./organizationFilterConfig";

export function OrganizationList() {
  return (
    <List>
      <FilterChipBar filterConfig={ORGANIZATION_FILTER_CONFIG} />
      <Datagrid>
        {/* columns */}
      </Datagrid>
    </List>
  );
}
```

## Architecture

### Performance Optimization

The `useFilterChipBar` hook uses a two-stage memoization strategy:

1. **Stage 1 (baseChips)**: Processes filter logic and stores IDs
   - Depends on: `filterValues`, `filterConfig`, `resolveChoices`
   - Recalculates when: Filters change or config updates

2. **Stage 2 (chips)**: Resolves reference names to display labels
   - Depends on: `baseChips`, name hooks (`useOrganizationName`, etc.)
   - Recalculates when: Name data changes (not on every filter change)

**Benefit:** Name resolution only runs when name data changes, not on every filter change. This reduces unnecessary API calls and re-renders.

### Type Safety

Generic type parameters provide type-safe context handling:

```typescript
interface MyContext {
  categories: Array<{ id: string; name: string }>;
}

<FilterChipBar<MyContext>
  filterConfig={config}
  context={myContext}  // Fully typed
/>
```

## Accessibility

FilterChipBar follows WCAG 2.1 AA standards:

- **ARIA roles**: `toolbar`, `list`, `listitem`
- **Keyboard navigation**:
  - `ArrowRight`: Focus next chip
  - `ArrowLeft`: Focus previous chip
  - `Home`: Focus first chip
  - `End`: Focus last chip
- **Touch targets**: 44px minimum (iPad requirement)
- **Screen reader labels**: "Remove [filter name] filter"
- **Data attributes**: `data-chip-button` for reliable selection

### Keyboard Navigation Details

All chip buttons support arrow key navigation with wrapping:
- Arrow keys wrap from last to first and vice versa
- Home/End keys jump to extremes
- Focus management uses type guards for safety

## System Filters (Hidden)

These filters are NOT displayed as chips:

- `page` - Pagination state
- `perPage` - Items per page
- `sort` - Sort field
- `order` - Sort direction
- `displayedFilters` - Filter panel visibility

Search filter (`q`) IS displayed with custom label: `Search: "query"`

## Testing

See `FilterChipBar.test.tsx` for comprehensive test coverage:

- Rendering with various filter types
- Keyboard navigation (ArrowRight, ArrowLeft, Home, End)
- Filter removal (individual and clear all)
- Accessibility (ARIA roles, data attributes)

**Run tests:**
```bash
just test-ci  # Run all tests
```

## Common Patterns

### Date Range with Sidebar Presets

```typescript
const DATE_FILTER_CONFIG: ChipFilterConfig[] = [
  {
    key: "created_at@gte",
    label: "Created After",
    type: "date-range",
    removalGroup: "created_range",
  },
  {
    key: "created_at@lte",
    label: "Created Before",
    type: "date-range",
    removalGroup: "created_range",
  },
];

// Sidebar filter component sets both values:
<DateRangeInput
  source="created_at"
  // Sets both created_at@gte and created_at@lte
/>

// FilterChipBar shows single chip:
// "This week" or "Jan 1 – Jan 31"
```

### Multi-Select Tags

```typescript
{
  key: "tags",
  label: "Tags",
  type: "reference",
  reference: "tags"
}

// FilterChipBar creates one chip per selected tag:
// [Tag: Marketing] [Tag: Sales] [Tag: Priority]
```

### Boolean with Custom Labels

```typescript
{
  key: "has_activity",
  label: "Activity Status",
  type: "boolean",
  choices: [
    { id: "inactive", name: "No Recent Activity" },  // false
    { id: "active", name: "Recently Active" }        // true
  ]
}
```

## Troubleshooting

### Chips not rendering

**Check:**
1. Is `FilterChipBar` inside a `<List>` component?
2. Does `filterConfig` include the filter key?
3. Is the filter value not `undefined` or `null`?

### Reference names showing IDs

**Check:**
1. Are name hooks imported correctly?
2. Is the reference type spelled correctly? (`organizations` not `organization`)
3. Does the referenced resource exist in the database?

### Date range showing separate chips

**Check:**
1. Do both configs have the same `removalGroup` value?
2. Are keys using `@gte` and `@lte` suffixes?
3. Are both filters active simultaneously?

## Related Files

- `src/atomic-crm/filters/FilterChip.tsx` - Individual chip component
- `src/atomic-crm/filters/FilterChipBar.tsx` - Container component
- `src/atomic-crm/filters/useFilterChipBar.ts` - Main hook
- `src/atomic-crm/filters/filterConfigSchema.ts` - TypeScript types
- `src/atomic-crm/filters/datePresetDetection.ts` - Date range preset detection
- `src/atomic-crm/filters/FilterChipBar.test.tsx` - Test suite
