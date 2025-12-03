# Form State Management

## Purpose

Document form state management patterns for Atomic CRM that derive defaults from Zod schemas, use React Admin components, and handle JSONB arrays correctly. Covers form initialization, validation, submission, and error display.

## Core Principle: Form State Derived from Truth

**Engineering Constitution #3:** React Hook Form `defaultValues` MUST use `zodSchema.partial().parse({})`.

**Why This Works:**
- ✅ Single source of truth (Zod schema)
- ✅ No drift between defaults and validation
- ✅ Type-safe form state
- ✅ Business logic in one place
- ✅ Easy to test and maintain


**Critical Rule:** If form defaults are hardcoded in components, it's WRONG.

## Pattern 1: Form Defaults from Schema

### Correct Pattern

**From `src/atomic-crm/opportunities/OpportunityCreate.tsx:17`:**

```typescript
import { CreateBase, Form, useGetIdentity } from 'ra-core';
import { opportunitySchema } from '../validation/opportunities';

const OpportunityCreate = () => {
  const { identity } = useGetIdentity();

  // Generate defaults from schema, then merge with identity-specific values
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (stage, priority, estimated_close_date)
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity?.id,
    account_manager_id: identity?.id,
    contact_ids: [], // Explicitly initialize for ReferenceArrayInput
    products_to_sync: [], // Explicitly initialize for ArrayInput
  };

  return (
    <CreateBase redirect="show">
      <div className="mt-2">
        <Form defaultValues={formDefaults}>
          <Card>
            <CardContent>
              <OpportunityInputs mode="create" />
              <FormToolbar>
                <div className="flex flex-row gap-2 justify-end">
                  <CancelButton />
                  <SaveButton label="Create Opportunity" />
                </div>
              </FormToolbar>
            </CardContent>
          </Card>
        </Form>
      </div>
    </CreateBase>
  );
};
```

**Schema with Defaults:**

```typescript
// src/atomic-crm/validation/opportunities.ts
const opportunityBaseSchema = z.object({
  // Fields with business logic defaults
  estimated_close_date: z
    .string()
    .min(1, "Expected closing date is required")
    .default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30); // Default to 30 days from now
      return date.toISOString().split("T")[0];
    }),

  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),

  // Array fields with defaults
  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});
```

**What Happens:**

```typescript
// 1. Schema defines defaults
opportunitySchema.partial().parse({})
// Result:
// {
//   estimated_close_date: "2025-12-13", // 30 days from now
//   stage: "new_lead",
//   priority: "medium",
//   contact_ids: [],
//   tags: []
// }

// 2. Merge with runtime values
const formDefaults = {
  ...opportunitySchema.partial().parse({}),
  opportunity_owner_id: identity?.id, // Current user
  account_manager_id: identity?.id,
};

// 3. Form uses these defaults
<Form defaultValues={formDefaults}>
```

### ❌ WRONG: Hardcoded Defaults

```typescript
// ❌ WRONG - Hardcoded in component
const OpportunityCreate = () => {
  const formDefaults = {
    stage: 'new_lead', // Out of sync with schema!
    priority: 'medium',
    estimated_close_date: '2025-12-31', // Wrong calculation
  };

  return <Form defaultValues={formDefaults}>...</Form>;
};

// ❌ WRONG - Using defaultValue prop
<SelectInput source="stage" defaultValue="new_lead" />

// ❌ WRONG - Initializing in useState
const [formData, setFormData] = useState({
  stage: 'new_lead',
  priority: 'medium',
});
```

**Why this is wrong:**
- Defaults duplicated in schema and component
- Changes to schema don't reflect in form
- Easy for defaults to drift over time
- No TypeScript type safety

## Pattern 2: JSONB Array Inputs

### Correct Pattern for ArrayInput

**From `src/atomic-crm/contacts/ContactInfoTab.tsx:35`:**

```typescript
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";

const personalInfoTypes = [{ id: "Work" }, { id: "Home" }, { id: "Other" }];

export const ContactInfoTab = () => {
  return (
    <div className="space-y-2">
      {/* Email array - NO defaultValue props */}
      <ArrayInput source="email" label="Email addresses" helperText={false}>
        <SimpleFormIterator inline disableReordering disableClear>
          <TextInput
            source="email"
            className="w-full"
            placeholder="Email (valid email required)"
            helperText={false}
            label={false}
          />
          <SelectInput
            source="type"
            choices={personalInfoTypes}
            optionText="id"
            helperText={false}
            label={false}
            className="w-24 min-w-24"
            {/* NO defaultValue - comes from Zod sub-schema */}
          />
        </SimpleFormIterator>
      </ArrayInput>

      {/* Phone array - same pattern */}
      <ArrayInput source="phone" label="Phone numbers" helperText={false}>
        <SimpleFormIterator inline disableReordering disableClear>
          <TextInput source="number" placeholder="Phone number" />
          <SelectInput source="type" choices={personalInfoTypes} />
        </SimpleFormIterator>
      </ArrayInput>
    </div>
  );
};
```

**Zod Sub-Schema:**

```typescript
// src/atomic-crm/validation/contacts.ts
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"), // Default in sub-schema
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"), // Default in sub-schema
});

const contactBaseSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

**Database Migration:**

```sql
-- JSONB arrays default to empty array
ALTER TABLE contacts
ADD COLUMN email JSONB DEFAULT '[]'::jsonb,
ADD COLUMN phone JSONB DEFAULT '[]'::jsonb;
```

**How It Works:**

```typescript
// 1. Form initialization
const formDefaults = contactSchema.partial().parse({});
// Result: { email: [], phone: [] }

// 2. User clicks "Add" button in ArrayInput
// SimpleFormIterator creates new item with sub-schema defaults:
{ email: "", type: "Work" } // From emailAndTypeSchema.default("Work")

// 3. User fills in email, type is already "Work"
// 4. On save, data is validated against schema
```

### ❌ WRONG: Defaults in Form Component

```typescript
// ❌ WRONG - defaultValue in SelectInput
<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" />
    <SelectInput source="type" choices={types} defaultValue="Work" />
    {/* ^^^ WRONG - default should be in Zod sub-schema */}
  </SimpleFormIterator>
</ArrayInput>

// ❌ WRONG - Hardcoded initial array in component
const [emails, setEmails] = useState([{ email: '', type: 'Work' }]);

// ❌ WRONG - Initializing array in useEffect
useEffect(() => {
  setValue('email', [{ email: '', type: 'Work' }]);
}, []);
```

## Pattern 3: Tabbed Forms

### Correct Pattern

**From `src/atomic-crm/contacts/ContactInputs.tsx:7`:**

```typescript
import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { ContactIdentityTab } from "./ContactIdentityTab";
import { ContactPositionTab } from "./ContactPositionTab";
import { ContactInfoTab } from "./ContactInfoTab";
import { ContactAccountTab } from "./ContactAccountTab";

export const ContactInputs = () => {
  const tabs = [
    {
      key: "identity",
      label: "Identity",
      fields: ["first_name", "last_name"], // For error tracking
      content: <ContactIdentityTab />,
    },
    {
      key: "position",
      label: "Position",
      fields: ["title", "department", "organization_id"],
      content: <ContactPositionTab />,
    },
    {
      key: "contact_info",
      label: "Contact Info",
      fields: ["email", "phone", "linkedin_url"],
      content: <ContactInfoTab />,
    },
    {
      key: "account",
      label: "Account",
      fields: ["sales_id", "notes"],
      content: <ContactAccountTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="identity" />;
};
```

**Tab Component Example:**

```typescript
// ContactIdentityTab.tsx
import { TextInput } from "@/components/admin/text-input";

export const ContactIdentityTab = () => {
  return (
    <div className="space-y-4">
      <TextInput source="first_name" label="First Name" required />
      <TextInput source="last_name" label="Last Name" required />
    </div>
  );
};
```

**TabbedFormInputs Component:**

```typescript
// Handles error tracking and tab navigation
export const TabbedFormInputs = ({ tabs, defaultTab }) => {
  const { formState } = useFormContext();

  // Count errors per tab
  const tabErrors = useMemo(() => {
    const errors: Record<string, number> = {};
    tabs.forEach(tab => {
      errors[tab.key] = tab.fields.filter(field => formState.errors[field]).length;
    });
    return errors;
  }, [tabs, formState.errors]);

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        {tabs.map(tab => (
          <TabTrigger key={tab.key} value={tab.key}>
            {tab.label}
            {tabErrors[tab.key] > 0 && (
              <Badge variant="destructive" className="ml-2">
                {tabErrors[tab.key]}
              </Badge>
            )}
          </TabTrigger>
        ))}
      </TabsList>

      {tabs.map(tab => (
        <TabContent key={tab.key} value={tab.key}>
          {tab.content}
        </TabContent>
      ))}
    </Tabs>
  );
};
```

**Benefits:**
- Error badges show validation issues per tab
- Consistent tab structure across all forms
- Fields array enables automatic error counting
- Lazy loading of tab content (performance)

## Pattern 4: Form Submission with Transformation

### Correct Pattern

**From `src/atomic-crm/contacts/ContactCreate.tsx:11`:**

```typescript
const ContactCreate = () => {
  const { identity } = useGetIdentity();

  // Transform data before submission
  const transformData = (data: Contact) => ({
    ...data,
    first_seen: new Date().toISOString(), // Add server-side timestamps
    last_seen: new Date().toISOString(),
    tags: [], // Initialize empty arrays
  });

  return (
    <CreateBase redirect="show" transform={transformData}>
      <Form defaultValues={{ sales_id: identity?.id }}>
        <Card>
          <CardContent>
            <ContactInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </CreateBase>
  );
};
```

**When to Use Transform:**
- Add server-side timestamps (`created_at`, `first_seen`)
- Initialize fields not in form (e.g., `tags: []`)
- Compute derived fields (e.g., `name` from `first_name` + `last_name`)
- Convert form data to API format

**Flow:**

```typescript
// 1. User fills form
{ first_name: "John", last_name: "Doe", email: [...] }

// 2. Transform function runs
transformData({ first_name: "John", last_name: "Doe", email: [...] })
// Result: { ..., first_seen: "2025-11-13T...", tags: [] }

// 3. Validation runs (at API boundary)
await validateCreateContact(transformedData)

// 4. Data provider creates record
await dataProvider.create('contacts', { data: validatedData })
```

## Pattern 5: Error Display

### Automatic Field-Level Errors

**React Admin automatically displays Zod validation errors:**

```typescript
// Zod validation error format
{
  message: "Validation failed",
  errors: {
    "first_name": "First name is required",
    "email.0.email": "Invalid email address",
    "contact_ids": "At least one contact is required"
  }
}

// React Admin displays inline:
<TextInput source="first_name" />
// Shows: "First name is required" in red below input

<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" />
  </SimpleFormIterator>
</ArrayInput>
// Shows: "email.0.email: Invalid email address" below first email input

<ReferenceArrayInput source="contact_ids">
  <SelectArrayInput />
</ReferenceArrayInput>
// Shows: "At least one contact is required" below dropdown
```

### Manual Error Handling (Edge Cases)

```typescript
import { useNotify } from 'ra-core';

const handleSubmit = async (data) => {
  const notify = useNotify();

  try {
    await dataProvider.create('contacts', { data });
    notify('Contact created successfully', { type: 'success' });
  } catch (error) {
    if (error.errors) {
      // React Admin handles field-level errors automatically
      // Just re-throw
      throw error;
    } else {
      // Handle non-validation errors
      notify('Failed to create contact', { type: 'error' });
      console.error(error);
    }
  }
};
```

## Pattern 6: Conditional Fields

### Show/Hide Based on Other Fields

```typescript
import { useWatch } from 'react-hook-form';

export const OpportunityDetailsTab = () => {
  const stage = useWatch({ name: 'stage' });

  return (
    <div className="space-y-4">
      <SelectInput source="stage" choices={stageChoices} />

      {/* Show close date only for closed stages */}
      {(stage === 'closed_won' || stage === 'closed_lost') && (
        <DateInput source="actual_close_date" label="Actual Close Date" />
      )}

      {/* Show loss reason only for closed_lost */}
      {stage === 'closed_lost' && (
        <TextInput source="loss_reason" label="Loss Reason" multiline />
      )}
    </div>
  );
};
```

### Dynamic Validation

```typescript
// In Zod schema - conditional validation
const opportunitySchema = z.object({
  stage: opportunityStageSchema,
  actual_close_date: z.string().optional(),
  loss_reason: z.string().optional(),
}).refine(
  (data) => {
    // Require actual_close_date when closed
    if ((data.stage === 'closed_won' || data.stage === 'closed_lost') && !data.actual_close_date) {
      return false;
    }
    return true;
  },
  {
    message: "Actual close date is required for closed opportunities",
    path: ["actual_close_date"],
  }
).refine(
  (data) => {
    // Require loss_reason when closed_lost
    if (data.stage === 'closed_lost' && !data.loss_reason) {
      return false;
    }
    return true;
  },
  {
    message: "Loss reason is required for lost opportunities",
    path: ["loss_reason"],
  }
);
```

## Pattern 7: Form Reset

### Reset to Defaults After Submit

```typescript
import { useFormContext } from 'react-hook-form';

const ContactCreate = () => {
  const { reset } = useFormContext();
  const { identity } = useGetIdentity();

  const onSuccess = () => {
    // Reset form to defaults after successful creation
    const formDefaults = {
      ...contactSchema.partial().parse({}),
      sales_id: identity?.id,
    };
    reset(formDefaults);
  };

  return (
    <CreateBase redirect="show" mutationOptions={{ onSuccess }}>
      <Form defaultValues={formDefaults}>
        <ContactInputs />
      </Form>
    </CreateBase>
  );
};
```

### Dirty Field Tracking

```typescript
const ContactEdit = () => {
  const { formState } = useFormContext();

  return (
    <>
      <ContactInputs />
      <FormToolbar>
        <SaveButton disabled={!formState.isDirty} />
        {/* Only enable save if form has changes */}
      </FormToolbar>
    </>
  );
};
```

## Pattern 8: Form State Debugging

### Development Helpers

```typescript
import { useFormContext } from 'react-hook-form';

export const FormDebugger = () => {
  const { watch, formState } = useFormContext();

  if (process.env.NODE_ENV !== 'development') return null;

  const values = watch();

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-gray-900 text-white p-4 overflow-auto max-h-96">
      <h3 className="font-bold mb-2">Form State</h3>
      <pre className="text-xs">{JSON.stringify(values, null, 2)}</pre>

      <h3 className="font-bold mt-4 mb-2">Errors</h3>
      <pre className="text-xs">{JSON.stringify(formState.errors, null, 2)}</pre>

      <h3 className="font-bold mt-4 mb-2">Dirty Fields</h3>
      <pre className="text-xs">{JSON.stringify(formState.dirtyFields, null, 2)}</pre>
    </div>
  );
};

// Use in forms during development
<Form defaultValues={formDefaults}>
  <ContactInputs />
  <FormDebugger />
</Form>
```

## Form State Decision Tree

```
Need form defaults?
│
├─ Where do they come from?
│  └─ ALWAYS: zodSchema.partial().parse({})
│     └─ NEVER: Hardcoded in component
│
├─ Runtime values needed? (e.g., current user ID)
│  └─ Merge with schema defaults:
│     { ...schema.partial().parse({}), user_id: identity.id }
│
├─ JSONB array field?
│  ├─ Define sub-schema with .default()
│  └─ Use ArrayInput + SimpleFormIterator
│     └─ NO defaultValue props
│
├─ Need to transform before save?
│  └─ Use transform prop on CreateBase/UpdateBase
│
└─ Validation errors?
   └─ React Admin displays automatically
      └─ Just throw formatted Zod errors
```

## Best Practices

### DO

✅ Use `zodSchema.partial().parse({})` for form defaults
✅ Merge schema defaults with runtime values (identity, etc.)
✅ Define array item defaults in Zod sub-schemas
✅ Use `ArrayInput` + `SimpleFormIterator` for JSONB arrays
✅ Transform data in `transform` prop, not in components
✅ Let React Admin display validation errors automatically
✅ Use `TabbedFormInputs` for complex forms
✅ Track dirty fields to enable/disable save button
✅ Reset form after successful submission
✅ Use `useWatch` for conditional fields

### DON'T

❌ Hardcode form defaults in components
❌ Use `defaultValue` prop on inputs (use schema)
❌ Initialize form state in `useState`
❌ Set array defaults in `useEffect`
❌ Duplicate validation in form components
❌ Transform data in form components (use transform prop)
❌ Manually display validation errors (React Admin handles it)
❌ Create custom tab components (use TabbedFormInputs)
❌ Skip form reset after submission
❌ Use `setValue` for initialization (use `defaultValues`)

## Testing Form State

### Unit Test Pattern

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { Form } from 'ra-core';
import { contactSchema } from './contacts';
import { ContactInputs } from './ContactInputs';

describe('ContactCreate Form', () => {
  it('initializes with schema defaults', () => {
    const formDefaults = contactSchema.partial().parse({});

    render(
      <Form defaultValues={formDefaults}>
        <ContactInputs />
      </Form>
    );

    // Check that array fields are initialized as empty
    expect(screen.queryByText('No items')).toBeInTheDocument();
  });

  it('applies default type to new email entry', async () => {
    const formDefaults = contactSchema.partial().parse({});

    render(
      <Form defaultValues={formDefaults}>
        <ContactInputs />
      </Form>
    );

    // Click "Add" button
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    // Check that type defaults to "Work"
    await waitFor(() => {
      expect(screen.getByDisplayValue('Work')).toBeInTheDocument();
    });
  });
});
```

## Related Resources

- [validation-patterns.md](validation-patterns.md) - Zod schemas and validation
- [error-handling.md](error-handling.md) - Error display patterns
- [testing-patterns.md](testing-patterns.md) - Testing forms
- [anti-patterns.md](anti-patterns.md) - What NOT to do

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
