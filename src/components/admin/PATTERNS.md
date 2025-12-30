# Select Input Patterns

Standard patterns for dropdown/select inputs in Crispy CRM.

## Component Hierarchy

```
SelectUI (presentation only)
    ↑
GenericSelectInput (React Admin connector, polymorphic)
    ↑
[Domain wrappers: TimeZoneSelect, StateComboboxInput, LeadSourceInput]
    ↑
[Usage in forms with ReferenceInput when needed]
```

---

## Pattern A: Static Choices (Form Mode)

For fixed option lists inside React Admin forms.

```tsx
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { LEAD_SOURCE_CHOICES } from "@/constants/choices";

// Inside a React Admin form (<SimpleForm>, <TabbedForm>, etc.)
<GenericSelectInput
  source="lead_source"
  choices={LEAD_SOURCE_CHOICES}
  placeholder="Select lead source..."
/>
```

**When to use**: Static options, inside React Admin form context.

---

## Pattern B: Static Choices (Controlled Mode)

For fixed options outside React Admin forms (settings pages, standalone components).

```tsx
import { GenericSelectInput } from "@/components/admin/generic-select-input";
import { US_TIMEZONES } from "@/constants/choices";

const [timezone, setTimezone] = useState("America/Chicago");

<GenericSelectInput
  value={timezone}
  onChange={(v) => setTimezone(v as string)}
  choices={[...US_TIMEZONES]}
  placeholder="Select timezone..."
/>
```

**When to use**: Static options, outside React Admin form context.

---

## Pattern C: Reference Data

For API-fetched options (organizations, contacts, principals).

```tsx
import { ReferenceInput } from "react-admin";
import { GenericSelectInput } from "@/components/admin/generic-select-input";

<ReferenceInput reference="organizations" source="org_id">
  <GenericSelectInput optionText="name" />
</ReferenceInput>
```

**When to use**: Options from database, dynamic data.

---

## Pattern D: Cascading Filters

For dependent dropdowns (contacts filtered by organization).

```tsx
import { ReferenceInput, useWatch } from "react-admin";
import { GenericSelectInput } from "@/components/admin/generic-select-input";

function ContactPicker() {
  const orgId = useWatch({ name: "org_id" });

  return (
    <ReferenceInput
      reference="contacts"
      source="contact_id"
      filter={{ organization_id: orgId }}
    >
      <GenericSelectInput optionText="full_name" />
    </ReferenceInput>
  );
}
```

**When to use**: Selection in one field filters options in another.

---

## Searchable Threshold

| Item Count | Recommendation |
|------------|----------------|
| < 20 items | `searchable={false}` |
| ≥ 20 items | `searchable={true}` |
| > 100 items | Server-side filtering via ReferenceInput |

---

## Migration Checklist

When replacing an old select component:

1. [ ] Identify choice source (static array or reference)
2. [ ] Move static choices to `src/constants/choices.ts`
3. [ ] Determine mode: Form (has `source`) or Controlled (has `value`/`onChange`)
4. [ ] Replace with appropriate GenericSelectInput pattern
5. [ ] Update imports in consuming files
6. [ ] Verify TypeScript compiles: `npx tsc --noEmit`
7. [ ] Test in browser for visual parity
