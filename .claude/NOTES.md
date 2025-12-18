# Column Header Filters - Exploration Notes

## Organizations Column Mapping

| Column | Field Name | Data Type | Filter Type | Choices Source |
|--------|------------|-----------|-------------|----------------|
| Organization Name | `name` | `string` | TextColumnFilter | N/A (free text, debounced) |
| Type | `organization_type` | `enum` | CheckboxColumnFilter | `ORGANIZATION_TYPE_CHOICES` from constants.ts |
| Priority | `priority` | `enum` | CheckboxColumnFilter | `PRIORITY_CHOICES` from constants.ts |
| Parent | `parent_organization_id` | `number \| null` | Skip (reference field) | Organizations resource |
| Contacts | `nb_contacts` | `number` (computed) | Skip (non-filterable) | N/A |
| Opportunities | `nb_opportunities` | `number` (computed) | Skip (non-filterable) | N/A |

**Enum Values:**
- `organization_type`: `"customer"`, `"prospect"`, `"principal"`, `"distributor"`
- `priority`: `"A"`, `"B"`, `"C"`, `"D"`

## Existing Patterns to Reuse

### useListContext Pattern
From FilterChipBar.tsx and filter-form.tsx:
```tsx
const { filterValues, setFilters } = useListContext();

// Read current filter
const currentValue = filterValues[source];

// Update filter
setFilters({ ...filterValues, [source]: newValue });

// Remove filter
const { [source]: _, ...rest } = filterValues;
setFilters(rest);
```

### ToggleFilterButton Pattern
From toggle-filter-button.tsx:
```tsx
interface ToggleFilterButtonProps {
  label: React.ReactElement | string;
  value: any;              // e.g., { organization_type: "customer" }
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  multiselect?: boolean;   // Accumulates into arrays
}

// Selected state via partial object matching
const isSelected = isMatch(filterValues, value);
```

### FilterChipBar Sync Pattern
- All components use same `useListContext()` instance
- FilterChipBar displays chips from `filterValues`
- Column filters update same `filterValues`
- Auto-sync without prop drilling

## shadcn/ui Components Available

### Input
- Touch target: `min-h-[48px]` (exceeds 44px requirement)
- Key props: `type`, `disabled`, `placeholder`
- Validation: `aria-invalid={!!error}`
- Semantic colors: `border-input`, `bg-background`, `placeholder:text-muted-foreground/70`

### Popover
- Components: `Popover`, `PopoverTrigger`, `PopoverContent`
- Key props: `align="start" | "center" | "end"`, `sideOffset={4}`
- Default width: `w-72` (288px)
- Semantic colors: `bg-popover`, `text-popover-foreground`

### Checkbox
- Visual size: `size-5` (20px) - parent provides 44px touch target
- State: `checked`, `onCheckedChange`
- Validation: `aria-invalid` supported
- Semantic colors: `bg-primary` when checked, `border-input` default

### Button
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default` (h-12), `sm` (h-12), `lg` (h-12), `icon` (size-12)
- All sizes meet 44px touch target requirement

## Semantic Color Tokens Found

| Token | Purpose |
|-------|---------|
| `bg-primary` / `text-primary-foreground` | Primary actions, selections |
| `bg-secondary` / `text-secondary-foreground` | Secondary buttons |
| `bg-popover` / `text-popover-foreground` | Filter dropdowns |
| `bg-muted` / `text-muted-foreground` | Filter chips, muted text |
| `bg-accent` / `text-accent-foreground` | Hover states, indicators |
| `border-input` | Form element borders |
| `bg-background` | Page/input backgrounds |
| `text-destructive` | Error states |

## Component API Design

```tsx
// Text filter with debounced search
interface TextColumnFilterProps {
  source: string;           // Field name (e.g., "name")
  label: string;            // Column header label
  placeholder?: string;     // Input placeholder
  debounceMs?: number;      // Default: 300ms
}

// Multi-select checkbox filter
interface CheckboxColumnFilterProps {
  source: string;           // Field name (e.g., "organization_type")
  label: string;            // Column header label
  choices: Array<{ id: string; name: string }>;
}

// Wrapper that renders filter icon + popover
interface FilterableColumnHeaderProps {
  source: string;
  label: string;
  sortable?: boolean;
  filterType: "text" | "checkbox";
  choices?: Array<{ id: string; name: string }>;  // Required if filterType="checkbox"
}
```

## Implementation Decisions

### Text Filter Behavior
1. Click column header icon → expand inline input
2. Debounce 300ms before updating filterValues
3. Clear button (X) removes filter
4. Enter key or blur commits immediately
5. Escape key cancels without saving

### Checkbox Filter Behavior
1. Click column header icon → open popover
2. Checkboxes for multi-select (array accumulation)
3. "Select All" / "Clear" utility buttons
4. Apply on popover close (no explicit Apply button)
5. Show count badge when filters active

### State Sync
- Use `useListContext` exclusively (no local state duplication)
- Column filters update same `filterValues` as sidebar
- FilterChipBar automatically reflects column filter changes

## Open Questions

1. **Column header styling** - Should filter icon appear on hover only, or always visible?
   - Recommendation: Always visible with muted color, primary on active

2. **Sort + Filter interaction** - Can same column be sorted AND filtered?
   - Existing Datagrid supports this via separate sort state

3. **FilterChipBar labels** - How should column filter chips be labeled?
   - Recommendation: Use column label (e.g., "Name: John" or "Type: Customer, Prospect")

## File Locations Reference

**Organizations Feature:**
- `src/atomic-crm/organizations/OrganizationList.tsx`
- `src/atomic-crm/organizations/organizationFilterConfig.ts`
- `src/atomic-crm/organizations/constants.ts` (choices)

**Filter Infrastructure:**
- `src/atomic-crm/filters/FilterChipBar.tsx`
- `src/atomic-crm/filters/useFilterChipBar.ts`
- `src/atomic-crm/filters/filterConfigSchema.ts`

**UI Components:**
- `src/components/ui/popover.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`

**New Components (to create):**
- `src/components/admin/column-filters/TextColumnFilter.tsx`
- `src/components/admin/column-filters/CheckboxColumnFilter.tsx`
- `src/components/admin/column-filters/FilterableColumnHeader.tsx`
- `src/components/admin/column-filters/index.ts`
