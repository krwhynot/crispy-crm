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
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
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
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";
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
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";

<ReferenceInput reference="organizations" source="org_id">
  <GenericSelectInput optionLabel="name" />
</ReferenceInput>
```

**When to use**: Options from database, dynamic data.

---

## Pattern D: Cascading Filters

For dependent dropdowns (contacts filtered by organization).

```tsx
import { ReferenceInput, useWatch } from "react-admin";
import { GenericSelectInput } from "@/components/ra-wrappers/generic-select-input";

function ContactPicker() {
  const orgId = useWatch({ name: "org_id" });

  return (
    <ReferenceInput
      reference="contacts"
      source="contact_id"
      filter={{ organization_id: orgId }}
    >
      <GenericSelectInput optionLabel="full_name" />
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
import { GenericSelectInput } from '@/components/ra-wrappers/generic-select-input';

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
import { GenericSelectInput } from '@/components/ra-wrappers/generic-select-input';
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

## Pattern G: List Filters

For filtering React Admin lists (NOT forms). Uses `useListContext()` instead of `useInput()`.

### Context: Form vs Filter vs Dashboard

| Context | Hook | State Management | Example Component |
|---------|------|------------------|-------------------|
| **Form** | `useInput()` | react-hook-form | `GenericSelectInput` |
| **Filter** | `useListContext()` | React Admin filterValues | `CheckboxColumnFilter` |
| **Dashboard** | `useState()` | Local component state | `EntityCombobox` |

### Column Filters (Existing Patterns)

**TextColumnFilter** — Debounced text input for free-text search:
```tsx
// src/components/admin/column-filters/TextColumnFilter.tsx
// Uses useListContext() for filterValues, setFilters
// Features: 300ms debounce, clear button, escape key support
```

**CheckboxColumnFilter** — Multi-select checkbox popover:
```tsx
// src/components/admin/column-filters/CheckboxColumnFilter.tsx
// Uses useListContext() for filterValues, setFilters
// Features: Select All, Clear, count badge, touch targets
```

### Compact Sidebar Filters (FilterSelectUI)

For sidebar or toolbar filters with many options, use `FilterSelectUI`:

```tsx
import { useListContext } from 'react-admin';
import { FilterSelectUI } from '@/components/ui/filter-select-ui';

const STAGE_OPTIONS = [
  { id: 'new_lead', label: 'New Lead' },
  { id: 'initial_outreach', label: 'Initial Outreach' },
  { id: 'closed_won', label: 'Closed Won' },
  // ...
];

export function StageFilter() {
  const { filterValues, setFilters } = useListContext();
  const currentValue = filterValues.stage || [];

  const handleChange = (newValue: string[]) => {
    const newFilters = { ...filterValues };
    if (newValue.length > 0) {
      newFilters.stage = newValue;
    } else {
      delete newFilters.stage;
    }
    setFilters(newFilters);
  };

  return (
    <FilterSelectUI
      options={STAGE_OPTIONS}
      value={Array.isArray(currentValue) ? currentValue : [currentValue]}
      onChange={handleChange}
      label="Stage"
    />
  );
}
```

### Role-Based Filters (Keep Separate)

**OwnerFilterDropdown** — Role-based owner filter:
```tsx
// src/components/admin/OwnerFilterDropdown.tsx
// KEPT SEPARATE by design - role-based UI logic should NOT be abstracted
// - Rep: Sees Switch toggle ("My Items" on/off)
// - Manager/Admin: Sees Select dropdown with team members
// Uses useListFilterContext() (includes displayedFilters)
```

**When to use**: Filtering React Admin lists, NOT form inputs.

---

## Pattern H: Dashboard Pickers

For entity selection OUTSIDE React Admin forms (dashboard widgets, quick actions).

### Key Differences from Form Selects

| Aspect | Form Select (Pattern A-F) | Dashboard Picker (Pattern H) |
|--------|--------------------------|------------------------------|
| **Context** | React Admin form | Standalone component |
| **State** | `useInput()` / react-hook-form | Local `useState()` |
| **Data** | `ReferenceInput` | `useGetList()` hook |
| **Submission** | Form submit | Direct API call |

### EntityCombobox Pattern

For selecting entities in dashboard contexts (QuickLogForm, activity logging):

```tsx
import { useState, useEffect } from 'react';
import { useGetList } from 'react-admin';
import { SelectUI } from '@/components/ui/select-ui';

interface EntityPickerProps {
  resource: 'contacts' | 'organizations' | 'opportunities';
  value: string | null;
  onChange: (id: string | null) => void;
  filter?: Record<string, unknown>;
  placeholder?: string;
}

export function EntityPicker({
  resource,
  value,
  onChange,
  filter,
  placeholder,
}: EntityPickerProps) {
  const { data, isLoading } = useGetList(resource, {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' },
    filter,
  });

  const options = (data || []).map((record) => ({
    id: String(record.id),
    label: record.name || record.full_name || `#${record.id}`,
  }));

  return (
    <SelectUI
      options={options}
      value={value ?? undefined}
      onChange={(newValue) => onChange(newValue as string)}
      placeholder={placeholder ?? `Select ${resource.slice(0, -1)}...`}
      isLoading={isLoading}
      searchable={options.length > 20}
    />
  );
}
```

### Cascading Dashboard Pickers

For dependent selections (contact depends on organization):

```tsx
function QuickLogForm() {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Reset contact when org changes
  useEffect(() => {
    setSelectedContact(null);
  }, [selectedOrg]);

  // Filter contacts by selected org
  const contactFilter = selectedOrg
    ? { organization_id: selectedOrg }
    : undefined;

  return (
    <div className="space-y-4">
      <EntityPicker
        resource="organizations"
        value={selectedOrg}
        onChange={setSelectedOrg}
        placeholder="Select organization"
      />

      <EntityPicker
        resource="contacts"
        value={selectedContact}
        onChange={setSelectedContact}
        filter={contactFilter}
        placeholder="Select contact"
      />

      <Button onClick={handleSubmit}>Log Activity</Button>
    </div>
  );
}
```

### Existing Implementation

**EntityCombobox** — Full-featured dashboard picker:
```tsx
// src/atomic-crm/dashboard/v3/components/EntityCombobox.tsx
// Features: hybrid search, fallback options, loading states, clear button
// Used in QuickLogForm for Contact/Organization/Opportunity selection
```

**ActivityNoteForm** — Cascading selection with react-hook-form:
```tsx
// src/atomic-crm/opportunities/ActivityNoteForm.tsx
// Pattern H: Contacts filtered by opportunity's organization

// 1. Fetch contacts filtered by organization
const { data: contacts, isPending: contactsLoading } = useGetList<Contact>(
  "contacts_summary",
  {
    filter: { organization_id: opportunity.customer_organization_id },
    pagination: { page: 1, perPage: 100 },
  }
);

// 2. Transform for SelectUI
const contactOptions = (contacts || []).map((contact) => ({
  id: String(contact.id),
  label: `${contact.first_name} ${contact.last_name}`,
}));

// 3. Use with react-hook-form Controller
<Controller
  name="contact_id"
  control={control}
  render={({ field }) => (
    <SelectUI
      options={contactOptions}
      value={field.value ? String(field.value) : undefined}
      onChange={(value) => field.onChange(value ? Number(value) : null)}
      placeholder="Select contact (optional)"
      isLoading={contactsLoading}
      isDisabled={!opportunity.customer_organization_id}
      clearable
    />
  )}
/>
```

**When to use**: Entity selection outside React Admin forms.

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
