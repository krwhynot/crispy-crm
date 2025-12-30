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

## Pattern E: Simple Quick-Create (emptyAction)

For creating simple records inline when no match is found.

**Use when:**
- Record has only 1-2 fields (name, label, title)
- No complex validation required
- User types a value, it doesn't exist, they want to create it immediately

**Mechanism:**
- `emptyAction` prop on GenericSelectInput
- Shows "Create {searchTerm}" button when no results match
- Uses `useCreate` hook for the API call
- `refresh()` triggers ReferenceInput to refetch

```tsx
import { useState } from 'react';
import { ReferenceInput, useCreate, useNotify, useRefresh } from 'react-admin';
import { GenericSelectInput } from '@/components/admin/generic-select-input';

export function TagQuickInput({ source, label }: { source: string; label?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [create, { isLoading: isCreating }] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleQuickCreate = async (name: string) => {
    if (!name.trim()) return;
    try {
      await create('tags', { data: { name: name.trim(), color: 'warm' } }, {
        onSuccess: () => { notify('Tag created', { type: 'success' }); refresh(); },
        onError: (error) => { notify(`Error: ${error.message}`, { type: 'error' }); },
      });
    } catch (error) { throw error; } // Fail-fast
  };

  return (
    <ReferenceInput reference="tags" source={source}>
      <GenericSelectInput
        label={label}
        optionLabel="name"
        onSearchChange={setSearchTerm}
        emptyAction={{
          label: `Create "${searchTerm}"`,
          onClick: () => handleQuickCreate(searchTerm),
        }}
        isLoading={isCreating}
        searchable
      />
    </ReferenceInput>
  );
}
```

**Key points:**
- `onSearchChange` captures what user typed
- `emptyAction.label` shows dynamic text with search term
- `refresh()` makes ReferenceInput refetch (new item appears)
- Error handling uses `notify()` — no silent failures

**Example:** `src/atomic-crm/tags/TagQuickInput.tsx`

---

## Pattern F: Complex Quick-Create (Dialog)

For creating records that require multiple fields or complex forms.

**Use when:**
- Record has many fields (organization, contact, product)
- Complex validation or multi-step flow
- Need to show a full form, not just a text input

**Mechanism:**
- `footer` slot renders a "Create new..." button (always visible)
- Button opens a Dialog with full create form
- On success, `refresh()` triggers ReferenceInput to refetch
- Dialog closes, new item available in dropdown

```tsx
import { useState } from 'react';
import { ReferenceInput, useCreate, useNotify, useRefresh } from 'react-admin';
import { GenericSelectInput } from '@/components/admin/generic-select-input';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { TagDialog } from './TagDialog';
import type { Tag } from '../types';

export function TagSelectWithCreate({ source, label }: { source: string; label?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultName, setDefaultName] = useState('');
  const [create] = useCreate();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleCreateTag = async (data: Pick<Tag, 'name' | 'color'>) => {
    await create('tags', { data }, {
      onSuccess: () => { notify('Tag created', { type: 'success' }); setDialogOpen(false); refresh(); },
      onError: (error) => { notify(`Error: ${error.message}`, { type: 'error' }); },
    });
  };

  const footer = (
    <Button type="button" variant="ghost" className="h-11 w-full justify-start text-sm"
      onClick={() => setDialogOpen(true)}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Create new tag
    </Button>
  );

  return (
    <>
      <ReferenceInput reference="tags" source={source}>
        <GenericSelectInput label={label} optionLabel="name" onSearchChange={setDefaultName}
          footer={footer} searchable />
      </ReferenceInput>
      <TagDialog open={dialogOpen} title="Create a new tag"
        tag={{ name: defaultName, color: 'warm' }}
        onSubmit={handleCreateTag} onClose={() => setDialogOpen(false)} />
    </>
  );
}
```

**Key points:**
- `footer` stays visible (sticky) even when filtering
- `onSearchChange` pre-fills the dialog's name field
- Create form is a SEPARATE component (separation of concerns)
- ReferenceInput stays explicit — not hidden in a wrapper

**Example:** `src/atomic-crm/tags/TagSelectWithCreate.tsx`

---

## Pattern Comparison

| Aspect | Pattern E (Simple) | Pattern F (Complex) |
|--------|-------------------|---------------------|
| **Trigger** | emptyAction (no results) | footer button (always visible) |
| **Fields** | 1-2 (name only) | Many (full form) |
| **UI** | Inline in dropdown | Dialog overlay |
| **Use case** | Categories, tags, labels | Orgs, contacts, products |
| **Creation** | useCreate directly | Separate form component |

---

## Auto-Selecting Newly Created Records

After creating a record, you may want to automatically select it:

```tsx
import { useFormContext } from 'react-hook-form';

const form = useFormContext();

const handleCreated = (newRecord: { id: string }) => {
  form.setValue(source, newRecord.id); // Set the field value
  setDialogOpen(false);
  refresh();
};
```

Note: Requires the create API to return the new record's ID.

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
