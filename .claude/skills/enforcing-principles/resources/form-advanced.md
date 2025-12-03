# Form: Advanced Patterns

## Purpose

Document advanced form patterns: reset, dirty tracking, and debugging.

## Pattern: Form Reset

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

## Pattern: Form State Debugging

### Development Helper

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

## Testing Form State

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

## Form State Decision Tree

```
Need form defaults?
│
├─ Where do they come from?
│  └─ ALWAYS: zodSchema.partial().parse({})
│
├─ Runtime values needed?
│  └─ Merge: { ...schema.partial().parse({}), user_id: identity.id }
│
├─ JSONB array field?
│  ├─ Define sub-schema with .default()
│  └─ Use ArrayInput + SimpleFormIterator
│
├─ Need to transform before save?
│  └─ Use transform prop on CreateBase/UpdateBase
│
└─ Validation errors?
   └─ React Admin displays automatically
```

## Best Practices Summary

### DO

- Use `zodSchema.partial().parse({})` for form defaults
- Merge schema defaults with runtime values
- Define array item defaults in Zod sub-schemas
- Use `ArrayInput` + `SimpleFormIterator` for JSONB arrays
- Transform data in `transform` prop
- Track dirty fields to enable/disable save button
- Reset form after successful submission
- Use `useWatch` for conditional fields

### DON'T

- Hardcode form defaults in components
- Use `defaultValue` prop on inputs
- Initialize form state in `useState`
- Set array defaults in `useEffect`
- Duplicate validation in form components
- Transform data in form components
- Manually display validation errors
- Use `setValue` for initialization

## Related Resources

- [form-defaults.md](form-defaults.md) - Core form defaults
- [form-arrays.md](form-arrays.md) - JSONB array inputs
- [form-patterns.md](form-patterns.md) - Tabbed forms, submission

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
