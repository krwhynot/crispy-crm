# ADR-012: Form Validation Mode

## Status

Accepted

## Date

2024-11

## Context

React-hook-form offers multiple validation modes that control when validation runs:

| Mode | When Validation Runs | Re-renders |
|------|---------------------|------------|
| `onChange` | Every keystroke | High (re-render storm) |
| `onBlur` | When field loses focus | Moderate |
| `onSubmit` | Only on form submit | Low |
| `onTouched` | After first blur, then on change | Moderate-High |
| `all` | On change and blur | Highest |

### The Problem with `onChange`

In complex forms (OrganizationCreate, OpportunityEdit), `onChange` mode causes **re-render storms**:

1. User types in a field
2. React-hook-form validates on every keystroke
3. Validation triggers form state update
4. Form state update re-renders all watched fields
5. With 10+ fields, this creates perceptible lag

### Trade-offs

| Concern | onChange | onBlur | onSubmit |
|---------|----------|--------|----------|
| **Immediate feedback** | Best | Good | None until submit |
| **Performance** | Worst | Good | Best |
| **UX for complex forms** | Poor (laggy) | Good | Acceptable |
| **UX for simple forms** | Overkill | Overkill | Best |

## Decision

Use **two validation modes** based on form complexity:

### 1. `onSubmit` - Simple Forms

For modal dialogs and quick entry forms (TagDialog, ConfirmDialog):

- Fewer than 5 fields
- No field interdependencies
- User expects quick interaction

### 2. `onBlur` - Complex Forms

For full-page forms with many fields (OrganizationCreate, OpportunityEdit):

- 5+ fields
- Field interdependencies (e.g., principal affects available distributors)
- Users benefit from feedback before submit

### NEVER Use `onChange`

The performance cost outweighs any UX benefit. Users typing in a text field should never experience input lag.

### Additional Requirements

1. **Use `useWatch()` for subscriptions, NOT `watch()`**
   - `watch()` triggers full form re-render on any field change
   - `useWatch()` isolates re-renders to consuming component only

2. **Form defaults from `schema.partial().parse({})`**
   - Ensures type safety and Zod default values
   - Single source of truth for initial form state

## Consequences

### Positive

- **No re-render storms**: Complex forms remain responsive during typing
- **Good UX balance**: `onBlur` gives feedback before submit without per-keystroke cost
- **Schema-derived defaults**: Type safety and consistency with validation rules
- **Predictable performance**: Clear guidelines prevent accidental performance regressions

### Negative

- **Delayed error feedback**: Users see validation errors on blur/submit, not while typing
- **Developer discipline required**: Must remember to use `useWatch()` in complex forms
- **Two patterns to maintain**: Simple vs complex forms have different configurations

### Neutral

- **Acceptable for CRM use case**: With ~6 users and form-heavy workflows, the slight delay in error feedback is acceptable for the performance gain

## Code Examples

### Simple Form with `onSubmit` (TagDialog.tsx)

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTagSchema, type CreateTagInput } from "@/validation/tags";

function TagDialog() {
  const form = useForm<CreateTagInput>({
    resolver: zodResolver(createTagSchema),
    defaultValues: createTagSchema.partial().parse({}),
    mode: "onSubmit", // Simple form - validate only on submit
  });

  // watch() is acceptable in onSubmit mode for simple UI updates
  const selectedColor = form.watch("color") as TagColorName;

  return (
    <Form {...form}>
      <FormField name="name" control={form.control} render={/* ... */} />
      <FormField name="color" control={form.control} render={/* ... */} />
    </Form>
  );
}
```

### Complex Form with `onBlur` (OrganizationCreate.tsx)

```tsx
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationSchema, type OrganizationFormValues } from "@/validation/organizations";

function OrganizationCreate() {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      ...organizationSchema.partial().parse({}),  // Extract Zod defaults
      sales_id: smartDefaults?.sales_id ?? null,  // Override with context
    },
    mode: "onBlur", // Complex form - validate when user leaves field
  });

  // Use useWatch() for performance in complex forms
  // Only this component re-renders when these fields change
  const [principalId, cityValue, phoneValue] = useWatch({
    control: form.control,
    name: ["principal_id", "city", "phone"],
  });

  // Derived state based on watched values
  const showDistributorField = principalId != null;

  return (
    <Form {...form}>
      <FormField name="name" control={form.control} render={/* ... */} />
      <FormField name="principal_id" control={form.control} render={/* ... */} />
      {showDistributorField && (
        <FormField name="distributor_id" control={form.control} render={/* ... */} />
      )}
      {/* ... 10+ more fields */}
    </Form>
  );
}
```

### Schema-Derived Defaults Pattern

```tsx
import { organizationSchema } from "@/validation/organizations";

// CORRECT: Defaults from schema ensure type safety
const formDefaults = {
  ...organizationSchema.partial().parse({}),  // Zod defaults: { type: "distributor", tags: [], ... }
  sales_id: currentUser?.id ?? null,          // Context-specific overrides
};

// The schema defines defaults:
// src/atomic-crm/validation/organizations.ts
export const organizationSchema = z.strictObject({
  name: z.string().max(255),
  type: z.enum(["principal", "distributor", "operator"]).default("distributor"),
  tags: z.array(z.string()).default([]),
  // ...
});
```

## Anti-Patterns

### 1. Using `mode: "onChange"` (Re-render Storm)

```tsx
// WRONG: Causes re-render on every keystroke
const form = useForm({
  resolver: zodResolver(schema),
  mode: "onChange", // NEVER use this
});
```

### 2. Using `watch()` in Complex Forms

```tsx
// WRONG: watch() triggers full form re-render
function ComplexForm() {
  const { watch, control } = useForm({ mode: "onBlur" });

  // Every change to ANY field re-renders this component
  const allValues = watch();
  const specificValue = watch("fieldName");

  // ...
}

// CORRECT: useWatch() isolates re-renders
function ComplexForm() {
  const { control } = useForm({ mode: "onBlur" });

  // Only re-renders when "fieldName" changes
  const specificValue = useWatch({ control, name: "fieldName" });

  // ...
}
```

### 3. Hardcoded Form Defaults

```tsx
// WRONG: Hardcoded defaults drift from schema
const form = useForm({
  defaultValues: {
    name: "",
    type: "distributor",  // What if schema default changes?
    tags: [],
  },
});

// CORRECT: Derive from schema
const form = useForm({
  defaultValues: organizationSchema.partial().parse({}),
});
```

### 4. Mixing Patterns Inconsistently

```tsx
// WRONG: onSubmit mode but using useWatch everywhere
const form = useForm({ mode: "onSubmit" });
const value = useWatch({ control, name: "field" }); // Unnecessary for simple form

// CORRECT: Match watching strategy to mode
// onSubmit + watch() = fine for simple forms
// onBlur + useWatch() = required for complex forms
```

## Decision Matrix

| Form Characteristics | Mode | Watch Strategy |
|---------------------|------|----------------|
| Modal dialog, < 5 fields | `onSubmit` | `watch()` acceptable |
| Quick entry form | `onSubmit` | `watch()` acceptable |
| Full-page form, 5+ fields | `onBlur` | `useWatch()` required |
| Form with field dependencies | `onBlur` | `useWatch()` required |
| Form with conditional fields | `onBlur` | `useWatch()` required |

## Related ADRs

- **[ADR-002: Zod Validation at API Boundary](./ADR-002-zod-api-boundary.md)** - Schema-derived defaults and API-level validation
- **[ADR-014: Fail-Fast Philosophy](./ADR-014-fail-fast-philosophy.md)** - Why validation errors throw rather than gracefully degrade
- **[ADR-013: WCAG Accessibility](./ADR-013-wcag-accessibility.md)** - Form error accessibility patterns
