# ADR-006: Form Validation Patterns

## Status
Accepted

## Context

Crispy CRM is a pre-launch product prioritizing development velocity and fast iteration. The application uses React Admin, React Hook Form, and Zod for form management and validation. We need a consistent, maintainable approach to form validation that:

1. Maintains a single source of truth for validation rules
2. Provides clear, actionable error messages to users
3. Prevents invalid data from reaching the database
4. Minimizes performance overhead during form interaction
5. Supports accessibility requirements (WCAG 2.1 AA)

Traditional approaches place validation at multiple layers (client-side form, API boundary, database). This creates:
- Duplication of validation logic across layers
- Synchronization challenges when rules change
- Unclear responsibility for which layer enforces which rules
- Performance overhead from multiple validation passes

## Decision

### 1. Single-Point Validation: API Boundary Only

All validation happens at the API boundary in `unifiedDataProvider.ts`, NOT at the form level.

**Implementation:**
- Forms submit raw user input without validation
- The data provider validates using Zod schemas in `src/atomic-crm/validation/`
- Validation errors are returned to forms in React Admin format for inline display

**Rationale:**
- Single source of truth: one validation schema per resource
- Fail-fast principle: invalid data is rejected before database operations
- Easier maintenance: update validation rules in one place
- Consistent enforcement: all data paths (UI, API, imports) use same rules

**Example from `unifiedDataProvider.ts` (lines 277-348):**
```typescript
async function validateData(
  resource: string,
  data: Record<string, unknown>,
  operation: "create" | "update" = "create"
): Promise<void> {
  try {
    await validationService.validate(resource, operation, dataToValidate);
  } catch (error: unknown) {
    // Parse Zod validation errors into React Admin format
    if (extendedError?.issues && Array.isArray(extendedError.issues)) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of extendedError.issues) {
        const fieldPath = issue.path.join(".");
        fieldErrors[fieldPath] = issue.message;
      }
      throw { message: "Validation failed", errors: fieldErrors };
    }
  }
}
```

### 2. Zod Schema Patterns

All validation schemas follow security-first patterns to prevent common vulnerabilities.

**String Fields:**
```typescript
// ALWAYS include .max() for DoS prevention
name: z.string().trim().max(255, "Name too long")

// HTML content gets sanitized
description: z.string()
  .max(2000, "Description too long")
  .transform((val) => (val ? sanitizeHtml(val) : val))
```

**Non-String Inputs:**
```typescript
// Use z.coerce for form inputs (dates, numbers, booleans)
estimated_close_date: z.coerce.date()
sales_id: z.coerce.number()
is_primary: z.coerce.boolean()
```

**Constrained Values:**
```typescript
// Use z.enum() for allowlist validation
stage: z.enum(["new_lead", "initial_outreach", "sample_visit_offered"])
type: z.enum(["work", "home", "other"])
```

**API Boundary Protection:**
```typescript
// Use z.strictObject() to prevent mass assignment attacks
export const contactBaseSchema = z.strictObject({
  id: z.coerce.number().optional(),
  name: z.string().max(255),
  // ... other fields
})
```

**Example from `contacts.ts` (lines 86-98):**
```typescript
export const contactBaseSchema = z.strictObject({
  id: z.coerce.number().optional(),
  name: z.string().max(255, "Name too long").optional(),
  first_name: z.string().max(100, "First name too long").optional().nullable(),
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
  sales_id: z.coerce.number().nullish(),
  // ... more fields with .max() constraints
});
```

### 3. Form Mode Selection

Forms use `mode="onBlur"` by default to balance validation feedback with performance.

**Available Modes:**
- `onSubmit` - Validates only when form is submitted (fastest, least feedback)
- `onBlur` - Validates when user leaves a field (balanced)
- `onChange` - Validates on every keystroke (NEVER USE: causes re-render storms)

**Implementation:**
```typescript
<Form defaultValues={formDefaults} mode="onBlur">
  <ContactInputs />
</Form>
```

**Example from `ContactCreate.tsx` (line 55):**
```typescript
<Form defaultValues={formDefaults} mode="onBlur">
  <ContactFormContent notify={notify} redirect={redirect} />
</Form>
```

**Rationale:**
- `onBlur` provides timely feedback without performance penalty
- `onChange` triggers validation on every keystroke, causing excessive re-renders
- Mode selection is consistent across all forms for predictable UX

### 4. Form State Initialization

Form default values are derived from Zod schemas using `.partial().parse({})`.

**Pattern:**
```typescript
const formDefaults = {
  ...contactBaseSchema.partial().parse({}),
  sales_id: defaults.sales_id, // Inject context-specific defaults
};
```

**Rationale:**
- Schema is single source of truth for both validation AND defaults
- `.partial()` makes all fields optional for parsing empty object
- `.parse({})` extracts default values defined in schema (e.g., `.default([])`)
- No duplication: change default in schema, it flows to all forms

**Example from `ContactCreate.tsx` (lines 44-47):**
```typescript
const formDefaults = {
  ...contactBaseSchema.partial().parse({}),
  sales_id: defaults.sales_id,
};
```

**Example from `opportunities.ts` (lines 108-111):**
```typescript
estimated_close_date: z.coerce
  .date()
  .default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }),
```

### 5. Form Watching for Dependent Fields

Use `useWatch()` from React Hook Form for field subscriptions, NOT `watch()`.

**Pattern:**
```typescript
// CORRECT: Isolated re-renders
const stage = useWatch({ name: "stage" });

// WRONG: Entire component re-renders
const { watch } = useFormContext();
const stage = watch("stage");
```

**Rationale:**
- `useWatch()` subscribes to specific fields, only re-rendering when they change
- `watch()` re-renders the entire component on ANY form change
- Pre-launch velocity prioritizes performance for field sales reps on tablets

### 6. Error Display Patterns (Accessibility)

Form inputs must implement WCAG 2.1 AA compliant error states.

**Required Attributes:**
```typescript
<Input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>

{error && (
  <span id={`${id}-error`} role="alert">
    {error.message}
  </span>
)}
```

**Rationale:**
- `aria-invalid` marks field as invalid for screen readers
- `aria-describedby` links input to error message for context
- `role="alert"` announces error messages to assistive technology
- Meets WCAG 2.1 AA 3.3.1 (Error Identification) and 4.1.3 (Status Messages)

## Consequences

### Benefits

1. **Single Source of Truth:** Validation rules live in one place per resource. Change once, applies everywhere.

2. **Fail-Fast Pre-Launch:** Invalid data is rejected immediately at API boundary before database operations. Maximizes development velocity by catching errors early.

3. **Security by Default:** `.max()` length limits prevent DoS attacks, `z.strictObject()` prevents mass assignment, `z.enum()` enforces allowlists.

4. **Consistent Error Messages:** All validation errors formatted identically for React Admin inline display.

5. **Performance:** `onBlur` mode and `useWatch()` minimize re-renders during form interaction.

6. **Accessibility:** ARIA attributes ensure screen reader users receive validation feedback.

7. **Type Safety:** Zod schemas generate TypeScript types, ensuring compile-time safety.

### Trade-offs

1. **No Client-Side Validation:** Users don't see validation errors until blur/submit. This is acceptable for pre-launch velocity but may frustrate power users. Consider progressive enhancement post-MVP.

2. **Server Round-Trip for Validation:** Every form submission validates at API boundary, requiring network round-trip. Acceptable given pre-launch status and single-tenant deployment model.

3. **Generic Zod Error Messages:** Zod's default messages (e.g., "Expected number, received string") can be cryptic. We mitigate with custom error messages in schemas (e.g., `.max(255, "Name too long")`).

4. **Form State Complexity:** Using `.partial().parse({})` for defaults requires understanding Zod's parsing behavior. Documented in schema files and this ADR.

5. **No Retry Logic:** Fail-fast means transient errors (network glitches) fail permanently. Acceptable pre-launch; will add retry post-MVP.

## Examples

### Complete Validation Flow

**1. Schema Definition (`src/atomic-crm/validation/contacts.ts`):**
```typescript
export const contactBaseSchema = z.strictObject({
  name: z.string().trim().max(255, "Name too long"),
  email: z.array(emailAndTypeSchema).default([]),
  sales_id: z.coerce.number(),
});

export const createContactSchema = contactBaseSchema
  .omit({ id: true })
  .superRefine((data, ctx) => {
    if (!data.email || data.email.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one email is required",
        path: ["email"],
      });
    }
  });
```

**2. Form Component (`src/atomic-crm/contacts/ContactCreate.tsx`):**
```typescript
const formDefaults = {
  ...contactBaseSchema.partial().parse({}),
  sales_id: defaults.sales_id,
};

<Form defaultValues={formDefaults} mode="onBlur">
  <ContactInputs />
</Form>
```

**3. API Validation (`src/atomic-crm/providers/supabase/unifiedDataProvider.ts`):**
```typescript
async create(resource, params) {
  // Validate at API boundary
  const processedData = await processForDatabase(resource, params.data, "create");

  // If validation fails, Zod errors are formatted for React Admin
  return baseDataProvider.create(resource, { data: processedData });
}
```

**4. Error Display (automatic via React Admin + ARIA attributes):**
```typescript
// React Admin automatically displays errors returned from data provider
// Components add ARIA attributes for accessibility
<Input
  {...field}
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
```

## Exceptions

### Idempotent Delete (Documented Exception)

The data provider violates fail-fast for delete operations when the resource is already deleted. This supports React Admin's optimistic UI:

```typescript
// From unifiedDataProvider.ts (lines 421-426)
if (
  method === "delete" &&
  extendedError?.message?.includes("Cannot coerce the result to a single JSON object")
) {
  return { data: params.previousData }; // Treat as success
}
```

This is the ONLY documented exception to fail-fast validation.

## References

- Engineering Constitution (CLAUDE.md): Fail-Fast, Single Source of Truth, Form State Derived From Truth
- Zod Security Patterns: DoS prevention (.max()), mass assignment (strictObject), allowlists (enum)
- WCAG 2.1 AA: 3.3.1 (Error Identification), 4.1.3 (Status Messages)
- React Hook Form Performance: `mode` selection, `useWatch()` vs `watch()`

## Revision History

- 2025-12-21: Initial version documenting validation patterns as implemented
