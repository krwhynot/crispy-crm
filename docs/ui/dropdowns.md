# Dropdown Patterns

## When to Use Each

| Pattern | Component | Use Case | Dataset Size |
|---------|-----------|----------|--------------|
| Static choices | `SelectInput` | Enums, status, priority | < 20 items |
| Reference data | `ReferenceInput` + `SelectInput` | Foreign keys | < 100 items |
| Searchable | `ReferenceInput` + `AutocompleteInput` | Large datasets | > 100 items |
| Multi-select | `MultiSelectInput` | Tags, categories | Any |
| Creatable | `SelectInput onCreate={...}` | User can add new | Any |

## Style Inheritance

All dropdowns inherit from `src/components/ui/select.tsx`:

```
Trigger: border-input bg-background h-11
Content: bg-popover border shadow-md rounded-md
Items:   hover:bg-accent focus:bg-accent cursor-pointer
```

## Examples

### Simple Enum Select
```tsx
import { SelectInput } from "@/components/ra-wrappers/select-input";

const STATUS_CHOICES = [
  { id: "new", name: "New" },
  { id: "in_progress", name: "In Progress" },
  { id: "completed", name: "Completed" },
];

<SelectInput source="status" choices={STATUS_CHOICES} />
```

### Reference with Search
```tsx
import { ReferenceInput } from "react-admin";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";

// For large datasets (contacts, organizations)
<ReferenceInput source="contact_id" reference="contacts">
  <AutocompleteInput
    optionText="full_name"
    filterToQuery={(q) => ({ q })}  // Enable server-side search
  />
</ReferenceInput>
```

### Creatable Select
```tsx
import { SelectInput } from "@/components/ra-wrappers/select-input";

<SelectInput
  source="category"
  choices={categories}
  onCreate={(value) => {
    // Create new category
    return { id: value, name: value };
  }}
  createLabel="Add new category"
/>
```

### Multi-Select Tags
```tsx
import { MultiSelectInput } from "@/components/ra-wrappers/multi-select-input";

<MultiSelectInput
  source="tags"
  choices={tagChoices}
  optionText="name"
  optionValue="id"
/>
```

## Accessibility

All dropdowns include:
- `role="combobox"` on trigger
- `aria-expanded` state
- `aria-invalid` for errors
- Keyboard navigation (↑↓ Enter Escape)
- Focus management on open/close

## Performance

- **Debounced search**: 300ms delay for API calls
- **Minimum chars**: 2 characters before search triggers
- **Virtualization**: Consider for > 500 items
