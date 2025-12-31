# ADR-002: Zod Validation at API Boundary

## Status

**Accepted**

## Date

Original: 2024-11 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Form validation in React applications is typically handled in two places:

1. **Client-side (forms)**: Immediate feedback on field blur/change
2. **Server-side (API)**: Security validation before database operations

This dual validation approach leads to several problems:

1. **Type Drift**: Database allowed 5 organization types, but Zod schema only validated 4. The "operator" type passed UI but failed at API boundary, discovered during Organizations Architecture Audit.

2. **Maintenance Burden**: Validation rules duplicated in forms AND data provider required updating both when business rules changed.

3. **Security Gaps**: Form validation can be bypassed. Without centralized API validation, malicious payloads could reach the database.

4. **Inconsistent Defaults**: Form defaults diverged from schema defaults, causing "required field" errors on submit for fields users never saw.

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Form-only validation** | Immediate feedback | Bypassable, no security |
| **Dual validation (form + API)** | Best UX + security | Maintenance burden, drift risk |
| **API-only validation** | Single source of truth, security | Errors only on submit |
| **Backend-only (database constraints)** | Ultimate security | Poor UX, no field-level errors |

---

## Decision

**Validate ONLY at the API boundary** (in `unifiedDataProvider.ts`), never in form components.

### Core Principles

1. **Single Source of Truth**: All validation rules live in `src/atomic-crm/validation/*.ts` Zod schemas
2. **Form Defaults from Schema**: `zodSchema.partial().parse({})` generates form defaults
3. **Security Patterns**: `z.strictObject()`, `.max()`, `z.coerce` for defense-in-depth

### Validation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Form Component                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Form defaults: zodSchema.partial().parse({})           │ │
│  │ NO validation logic - just collects user input         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ Raw form data
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              unifiedDataProvider.create()                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ValidationService.validate(resource, "create", data)   │ │
│  │ - Runs Zod schema                                       │ │
│  │ - Transforms Zod errors → React Admin format            │ │
│  │ - Throws { body: { errors: { field: message } } }       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ Validated data
                           ▼
                     Supabase Database
```

### Security Patterns

#### 1. `z.strictObject()` - Mass Assignment Prevention

Rejects any fields not explicitly defined in schema:

```typescript
// src/atomic-crm/validation/contacts.ts:86

export const contactBaseSchema = z.strictObject({
  id: z.coerce.number().optional(),
  first_name: z.string().max(100, "First name too long").optional().nullable(),
  last_name: z.string().max(100, "Last name too long").optional().nullable(),
  // ... only declared fields allowed
});

// Attack attempt:
// { first_name: "John", is_admin: true }  // REJECTED - is_admin not in schema
```

#### 2. `.max()` on All Strings - DoS Prevention

Every string field has a length limit:

```typescript
// src/atomic-crm/validation/opportunities.ts:93-99

name: z.string()
  .trim()
  .min(1, "Opportunity name is required")
  .max(255, "Opportunity name too long"),  // Prevents 10MB string payloads
description: z.string()
  .max(2000, "Description must be 2000 characters or less")
  .optional()
  .nullable(),
```

#### 3. `z.coerce` - Form Input Type Safety

HTML form inputs return strings. Coercion ensures correct types:

```typescript
// src/atomic-crm/validation/contacts.ts:88-89

id: z.coerce.number().optional(),           // "123" → 123
sales_id: z.coerce.number().nullish(),      // "456" → 456, "" → null

// src/atomic-crm/validation/opportunities.ts:100-109

estimated_close_date: z.coerce.date({       // "2025-01-15" → Date object
  error: "Expected closing date is required",
}).default(() => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}),
```

#### 4. `z.enum()` - Allowlist for Constrained Values

```typescript
// src/atomic-crm/validation/opportunities.ts:11-19

export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);
// "invalid_stage" → REJECTED, not in allowlist
```

### Form Default Generation

```typescript
// In form component - defaults from schema
import { contactBaseSchema } from "@/validation/contacts";

const defaultValues = contactBaseSchema.partial().parse({});
// Returns: { email: [], phone: [], tags: [], ... }
// All fields with .default() are populated
```

---

## Consequences

### Positive

- **Single Source of Truth**: No validation drift between form and API
- **Security by Default**: Mass assignment, DoS, and type coercion handled automatically
- **Schema-Driven Forms**: Defaults, enums, and constraints defined once
- **Maintainability**: Change validation in one place, affects entire stack

### Negative

- **Submit-Time Errors**: Users see validation errors on submit, not on field blur
- **Learning Curve**: Developers must understand Zod patterns and where validation lives

### Neutral

- **Acceptable UX Trade-off**: For a CRM with ~6 users, submit-time validation is acceptable for development velocity

---

## Code Examples

### Correct Pattern - Schema Definition

```typescript
// src/atomic-crm/validation/contacts.ts:86-168

export const contactBaseSchema = z.strictObject({
  // Primary key
  id: z.coerce.number().optional(),

  // Name fields - with .max() for DoS prevention
  first_name: z.string().max(100, "First name too long").optional().nullable(),
  last_name: z.string().max(100, "Last name too long").optional().nullable(),

  // JSONB arrays - with inner validation
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),

  // Sanitized text fields
  notes: z.string()
    .max(5000, "Notes too long")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
});
```

### Correct Pattern - Form Using Schema

```typescript
// In ContactCreate.tsx
import { contactBaseSchema } from "@/validation/contacts";

function ContactCreate() {
  // Defaults generated from schema
  const defaultValues = contactBaseSchema.partial().parse({});

  return (
    <Create>
      <SimpleForm defaultValues={defaultValues}>
        {/* NO resolver prop - no form validation */}
        <TextInput source="first_name" />
        <TextInput source="last_name" />
      </SimpleForm>
    </Create>
  );
}
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Duplicate validation in form
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/validation/contacts";

function ContactCreate() {
  return (
    <Create>
      {/* NEVER: Validation in form AND provider causes drift */}
      <SimpleForm resolver={zodResolver(contactSchema)}>
        <TextInput source="first_name" />
      </SimpleForm>
    </Create>
  );
}
```

```typescript
// WRONG: Missing .max() on string fields
const unsafeSchema = z.object({
  name: z.string(),  // NEVER: No length limit = DoS vulnerability
  description: z.string().optional(),  // NEVER: Allows 100MB strings
});
```

```typescript
// WRONG: Using z.object() instead of z.strictObject()
const unsafeSchema = z.object({
  name: z.string().max(100),
});
// Allows: { name: "John", is_admin: true } - mass assignment attack!
```

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](./ADR-001-unified-data-provider.md)** - The provider that executes validation
- **[ADR-009: Composed Data Provider Pattern](./ADR-009-composed-data-provider.md)** - How validation integrates into handler composition

---

## References

- ValidationService: `src/atomic-crm/providers/supabase/services/ValidationService.ts`
- withValidation wrapper: `src/atomic-crm/providers/supabase/wrappers/withValidation.ts`
- Example schemas: `src/atomic-crm/validation/contacts.ts`, `src/atomic-crm/validation/opportunities.ts`
- Zod documentation: https://zod.dev/
- Engineering Constitution: `CLAUDE.md` (Zod Validation section)
