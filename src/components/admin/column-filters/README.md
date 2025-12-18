# Column Filters

Excel-style column header filters for React Admin datagrids. These components provide inline filtering directly from column headers, integrating seamlessly with React Admin's filter state management.

## Problem Solved

Users expect Excel-like filtering where clicking a column header reveals filter options. This pattern:
- Reduces clicks compared to sidebar filters
- Provides visual feedback on which columns have active filters
- Syncs automatically with FilterChipBar and sidebar filters

## Components

### FilterableColumnHeader

The main wrapper component that combines a label with an appropriate filter control.

```tsx
import { FilterableColumnHeader } from "@/components/admin/column-filters";

// Text filter for free-text search
<FilterableColumnHeader
  source="name"
  label="Name"
  filterType="text"
  placeholder="Search..."
  debounceMs={300}
/>

// Checkbox filter for enum/multi-select
<FilterableColumnHeader
  source="status"
  label="Status"
  filterType="checkbox"
  choices={[
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
  ]}
/>

// No filter (just renders label)
<FilterableColumnHeader
  source="computed_field"
  label="Count"
  filterType="none"
/>
```

### TextColumnFilter

Debounced text input for free-text search. Features:
- 300ms debounce by default (configurable)
- Clear button to remove filter
- Auto-focus when popover opens

```tsx
import { TextColumnFilter } from "@/components/admin/column-filters";

<TextColumnFilter
  source="name"
  placeholder="Search by name..."
  debounceMs={300}
/>
```

### CheckboxColumnFilter

Popover with multi-select checkboxes. Features:
- Popover UI with checkbox list
- "Select All" and "Clear" utility buttons
- Count badge showing active selections
- Touch targets meet 44px minimum

```tsx
import { CheckboxColumnFilter, type FilterChoice } from "@/components/admin/column-filters";

const STATUS_CHOICES: FilterChoice[] = [
  { id: "active", name: "Active" },
  { id: "pending", name: "Pending" },
  { id: "closed", name: "Closed" },
];

<CheckboxColumnFilter
  source="status"
  label="Status"
  choices={STATUS_CHOICES}
/>
```

## Props Reference

### FilterableColumnHeaderProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `source` | `string` | Yes | - | Field name to filter on |
| `label` | `string` | Yes | - | Column header label |
| `filterType` | `"text" \| "checkbox" \| "none"` | Yes | - | Type of filter to render |
| `choices` | `FilterChoice[]` | If checkbox | - | Options for checkbox filter |
| `placeholder` | `string` | No | Auto-generated | Input placeholder for text filter |
| `debounceMs` | `number` | No | `300` | Debounce delay for text filter |
| `className` | `string` | No | - | Additional CSS classes |

### FilterChoice

```tsx
interface FilterChoice {
  id: string;
  name: string;
}
```

## Integration with Datagrids

Use the FilterableColumnHeader as the `label` prop on React Admin field components:

```tsx
import { TextField, FunctionField } from "react-admin";
import { FilterableColumnHeader } from "@/components/admin/column-filters";
import { STATUS_CHOICES, TYPE_CHOICES } from "./constants";

// In your List component's Datagrid:
<TextField
  source="name"
  label={
    <FilterableColumnHeader
      source="name"
      label="Name"
      filterType="text"
    />
  }
  sortable
/>

<FunctionField
  label={
    <FilterableColumnHeader
      source="status"
      label="Status"
      filterType="checkbox"
      choices={STATUS_CHOICES}
    />
  }
  sortBy="status"
  render={(record) => <StatusBadge status={record.status} />}
/>
```

## Replicating to Other Lists

### Step 1: Create Header Components

Create a `[Feature]DatagridHeader.tsx` file:

```tsx
// src/atomic-crm/contacts/ContactDatagridHeader.tsx
import { FilterableColumnHeader } from "@/components/admin/column-filters";
import { CONTACT_TYPE_CHOICES } from "./constants";

export function ContactNameHeader() {
  return (
    <FilterableColumnHeader
      source="name"
      label="Contact Name"
      filterType="text"
    />
  );
}

export function ContactTypeHeader() {
  return (
    <FilterableColumnHeader
      source="contact_type"
      label="Type"
      filterType="checkbox"
      choices={[...CONTACT_TYPE_CHOICES]}
    />
  );
}
```

### Step 2: Use in List Component

```tsx
// src/atomic-crm/contacts/ContactList.tsx
import { ContactNameHeader, ContactTypeHeader } from "./ContactDatagridHeader";

<TextField
  source="name"
  label={<ContactNameHeader />}
  sortable
/>
```

### Step 3: Verify FilterChipBar Integration

No additional work needed! FilterChipBar automatically displays chips for any filter applied via column headers since both use the same `useListContext()` filter state.

## Architecture Notes

### State Management

All components use `useListContext()` from React Admin:
- `filterValues`: Current filter state (read)
- `setFilters()`: Update filter state (write)

This ensures:
- Single source of truth for filter state
- Automatic sync between column filters, sidebar filters, and FilterChipBar
- No prop drilling or custom state management

### Touch Targets

All interactive elements meet WCAG 2.1 AA requirements:
- Buttons: `h-11 w-11` (44x44px)
- Checkboxes: Parent container provides 44px touch target
- Input: `min-h-[48px]`

### Semantic Colors

Components use Tailwind v4 semantic tokens only:
- `text-muted-foreground` - Inactive filter icons
- `text-primary` - Active filter icons
- `bg-primary` - Active count badges
- `bg-popover` - Popover backgrounds

## Gotchas and Tips

1. **Choices must be spread**: When using `as const` arrays, spread them to avoid readonly type issues:
   ```tsx
   choices={[...ORGANIZATION_TYPE_CHOICES]}
   ```

2. **Sorting still works**: Using FilterableColumnHeader as a label doesn't interfere with React Admin's sort handling - sorting is managed at the Field level, not the label.

3. **FilterChipBar labels**: Filter values appear in FilterChipBar using the label from your `filterConfig` (not the column header label). Ensure your filter config has matching entries.

4. **No duplicate filters**: If you have both sidebar and column filters for the same field, they share state. Users can set/clear from either location.

5. **Reference fields**: Skip filters on ReferenceField columns - filtering by foreign keys requires special handling (autocomplete search).
