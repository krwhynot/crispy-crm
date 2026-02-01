# Forms

## Core Principle: Form State Derived from Schema

React Hook Form `defaultValues` MUST use `zodSchema.partial().parse({})`. No hardcoded defaults.

**Why:** Single source of truth, no drift, type-safe form state, business logic in one place.

## Pattern: Form Defaults from Schema

```typescript
const OpportunityCreate = () => {
  const { identity } = useGetIdentity();

  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity?.id,
    contact_ids: [],
  };

  return (
    <CreateBase redirect="show">
      <Form defaultValues={formDefaults}>
        <OpportunityInputs mode="create" />
      </Form>
    </CreateBase>
  );
};
```

`schema.partial().parse({})` extracts all `.default()` values. Merge with runtime values (current user ID).

## WRONG: Hardcoded Defaults

```typescript
// WRONG - defaults duplicated, can drift from schema
const formDefaults = { stage: 'new_lead', priority: 'medium' };

// WRONG - defaultValue prop bypasses schema
<SelectInput source="stage" defaultValue="new_lead" />

// WRONG - useState for form state
const [formData, setFormData] = useState({ stage: 'new_lead' });
```

## Pattern: ArrayInput for JSONB Arrays

```typescript
<ArrayInput source="email" label="Email addresses" helperText={false}>
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput source="value" placeholder="name@company.com" />
    <SelectInput source="type" choices={personalInfoTypes} />
    {/* NO defaultValue - comes from Zod sub-schema */}
  </SimpleFormIterator>
</ArrayInput>
```

Sub-schema provides defaults:
```typescript
export const emailAndTypeSchema = z.object({
  value: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("work"),
});
```

New items get `{ value: "", type: "work" }` automatically from sub-schema.

## Pattern: Tabbed Forms with Error Badges

```typescript
const tabs = [
  {
    key: "identity",
    label: "Identity",
    fields: ["first_name", "last_name"],
    content: <ContactIdentityTab />,
  },
  {
    key: "contact_info",
    label: "Contact Info",
    fields: ["email", "phone", "linkedin_url"],
    content: <ContactInfoTab />,
  },
];

return <TabbedFormInputs tabs={tabs} defaultTab="identity" />;
```

Track errors per tab using `fields` array. Display error count badges on tabs.

## Pattern: Form Submission with Transform

```typescript
const transformData = (data: Contact) => ({
  ...data,
  first_seen: new Date().toISOString(),
  last_seen: new Date().toISOString(),
  tags: [],
});

<CreateBase redirect="show" transform={transformData}>
  <Form defaultValues={formDefaults}>...</Form>
</CreateBase>
```

Use `transform` prop for: server-side timestamps, initializing fields not in form, converting form data to API format.

## Pattern: Conditional Fields

```typescript
import { useWatch } from 'react-hook-form';

const stage = useWatch({ name: 'stage' });

{(stage === 'closed_won' || stage === 'closed_lost') && (
  <DateInput source="actual_close_date" label="Actual Close Date" />
)}
```

Use `useWatch` (isolated re-renders), NOT `watch()` (re-renders whole form).

## Pattern: Form Reset After Submit

```typescript
const { reset } = useFormContext();

const onSuccess = () => {
  const formDefaults = {
    ...contactSchema.partial().parse({}),
    sales_id: identity?.id,
  };
  reset(formDefaults);
};
```

## Pattern: Dirty Field Tracking

```typescript
const { formState } = useFormContext();

<SaveButton disabled={!formState.isDirty} />
```

## Form State Decision Tree

```
Need form defaults?
|
+- Source? --> zodSchema.partial().parse({})
+- Runtime values? --> Merge: { ...schema.partial().parse({}), user_id: identity.id }
+- JSONB array? --> Sub-schema with .default(), ArrayInput + SimpleFormIterator
+- Transform before save? --> transform prop on CreateBase/UpdateBase
+- Validation errors? --> React Admin displays automatically
```

## DO / DON'T Summary

**DO:** schema.partial().parse({}), merge runtime values, sub-schema defaults, ArrayInput, transform prop, useWatch, dirty tracking, reset after submit.

**DON'T:** hardcode defaults, defaultValue props, useState, useEffect for init, validate in components, transform in components, manual error display, setValue for init.
