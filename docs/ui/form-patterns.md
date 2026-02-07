# Form Patterns

## Canonical Form Control Baseline

All form controls MUST use these Tailwind classes (enforced by CI):

| Property | Class | Token |
|----------|-------|-------|
| Background | `bg-background` | `--background` |
| Border | `border-input` | `--input` (oklch 84.3%) |
| Focus | `focus-visible:border-ring focus-visible:ring-ring/50` | `--ring` |
| Error | `aria-invalid:border-destructive` | `--destructive` |
| Height | `h-11` minimum | 44px touch target |

## Approved Component Stack

| Use Case | Component | Import Path |
|----------|-----------|-------------|
| Text input | `TextInput` | `@/components/ra-wrappers/text-input` |
| Textarea | `TextInput multiline` | `@/components/ra-wrappers/text-input` |
| Single select | `SelectInput` | `@/components/ra-wrappers/select-input` |
| Autocomplete | `AutocompleteInput` | `@/components/ra-wrappers/autocomplete-input` |
| Date picker | `DateInput` | `@/components/ra-wrappers/date-input` |
| Number | `NumberInput` | `@/components/ra-wrappers/number-input` |
| Boolean | `BooleanInput` | `@/components/ra-wrappers/boolean-input` |
| Multi-select | `MultiSelectInput` | `@/components/ra-wrappers/multi-select-input` |
| File upload | `FileInput` | `@/components/ra-wrappers/file-input` |

## BANNED in Feature Code

These patterns are blocked by ESLint and CI:

- **Direct react-admin imports**: `import { TextInput } from "react-admin"` - Use wrappers
- **Native elements**: `<select>`, `<input type="checkbox">` - Use components
- **Raw shadcn in features**: Import from ra-wrappers, not ui/
- **Hardcoded colors**: `border-neutral-*`, `bg-gray-*`, hex codes

## Usage Examples

### Text Input
```tsx
import { TextInput } from "@/components/ra-wrappers/text-input";

<TextInput source="name" label="Name" />
<TextInput source="description" multiline rows={3} />
```

### Select with Choices
```tsx
import { SelectInput } from "@/components/ra-wrappers/select-input";

<SelectInput
  source="status"
  choices={[
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
  ]}
/>
```

### Reference Select
```tsx
import { ReferenceInput } from "react-admin";
import { SelectInput } from "@/components/ra-wrappers/select-input";

<ReferenceInput source="organization_id" reference="organizations">
  <SelectInput optionText="name" />
</ReferenceInput>
```

### Searchable Autocomplete
```tsx
import { ReferenceInput } from "react-admin";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";

<ReferenceInput source="contact_id" reference="contacts">
  <AutocompleteInput optionText="full_name" />
</ReferenceInput>
```

## Validation

Static checks run in CI:
```bash
# No direct RA input imports
grep -rE "import.*TextInput.*from.*react-admin" src/atomic-crm/

# No hardcoded colors
grep -rE "border-neutral-|border-gray-" src/

# No native selects
grep -r "<select" src/atomic-crm/
```
