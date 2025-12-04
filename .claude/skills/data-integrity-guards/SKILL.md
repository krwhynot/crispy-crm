---
name: data-integrity-guards
description: Defense-in-depth validation pattern for Crispy CRM. Validates data at EVERY layer - API boundary (Zod with strictObject, .max() limits, coercion), form state (schema defaults, useWatch), database (RLS/soft-delete). Triggers on validation, data flow, integrity, security, guards, layers, Zod, RLS, form defaults, strictObject, string limits, coerce, allowlist, mass assignment, DoS.
---

# Data Integrity Guards

## Core Concept

**Validate at EVERY layer data passes through. Make bugs structurally impossible.**

This pattern addresses data corruption and validation gaps by implementing checks across multiple system layers rather than relying on a single checkpoint.

## The Four-Layer Framework for Crispy CRM

### Layer 1: API Boundary (Zod Validation)

**Where:** `unifiedDataProvider.ts` via `ValidationService`
**Purpose:** Reject invalid input before database operations; prevent security vulnerabilities

```typescript
// ✓ CORRECT: Validation at API boundary only
// src/atomic-crm/providers/supabase/services/ValidationService.ts
export class ValidationService {
  async validate(resource: string, method: string, data: unknown): Promise<void> {
    const validator = this.validationRegistry[resource];
    if (method === "create" && validator.create) {
      await validator.create(data);  // Zod validation HERE
    }
  }
}

// ✗ WRONG: Validation in form component
const ContactCreate = () => {
  const validate = (values) => { /* DON'T DO THIS */ };
  return <SimpleForm validate={validate}>...</SimpleForm>;
};
```

**Security Requirements (OWASP Compliant):**

| Requirement | Implementation | Risk if Missing |
|-------------|---------------|-----------------|
| **String limits** | `.max(100)` on ALL strings | DoS via 10MB payloads |
| **Strict objects** | `z.strictObject()` for create/update | Mass assignment attacks |
| **Coercion** | `z.coerce.number()` for form inputs | Type validation failures |
| **Allowlist** | `z.enum(['a','b'])` for options | Denylist bypass |

```typescript
// ✓ CORRECT: Secure schema at API boundary
export const createContactSchema = z.strictObject({
  name: z.string().min(1).max(100),        // Length limit
  email: z.string().email().max(254),       // Email limit
  age: z.coerce.number().min(0).max(150),   // Coerced from form
  role: z.enum(['admin', 'user', 'guest']), // Allowlist
}); // strictObject rejects unknown keys

// ✗ WRONG: Vulnerable schema
const badSchema = z.object({
  name: z.string(),  // No max = DoS risk
  role: z.string(),  // No enum = injection risk
}); // object allows unknown keys = mass assignment
```

**Key Files:**
- `src/atomic-crm/validation/*.ts` - Zod schemas per resource
- `src/atomic-crm/providers/supabase/services/ValidationService.ts` - Central validation

### Layer 2: Form State Defaults (Schema-Derived)

**Where:** Form components using `zodSchema.partial().parse({})`
**Purpose:** Ensure form state starts valid, preventing null pointer errors

```typescript
// ✓ CORRECT: Form defaults from Zod schema
import { contactBaseSchema } from '../validation/contacts';

const ContactCreate = () => {
  const defaultValues = contactBaseSchema.partial().parse({});
  return (
    <Create>
      <SimpleForm defaultValues={defaultValues}>
        <TextInput source="first_name" />
      </SimpleForm>
    </Create>
  );
};

// ✗ WRONG: Hardcoded defaults that can drift from schema
const ContactCreate = () => {
  const defaultValues = {
    first_name: '',
    email: []  // May not match schema structure!
  };
};
```

**Pattern:** Base schemas are EXPORTED specifically for form default generation:
```typescript
// src/atomic-crm/validation/contacts.ts
// EXPORTED: Enables form default generation via contactBaseSchema.partial().parse({})
// per Engineering Constitution #5: FORM STATE DERIVED FROM TRUTH
export const contactBaseSchema = z.object({...});
```

### Layer 3: Database Guards (RLS + Soft Deletes)

**Where:** Supabase RLS policies, migration files
**Purpose:** Prevent unauthorized access and preserve data for audit

```sql
-- RLS Policy: Users can only see their organization's data
CREATE POLICY "Users can view own org contacts"
  ON contacts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));

-- Soft delete: Never truly delete, preserve for audit
-- ✓ CORRECT: Use deleted_at column
UPDATE contacts SET deleted_at = NOW() WHERE id = $1;

-- ✗ WRONG: Hard delete loses audit trail
DELETE FROM contacts WHERE id = $1;
```

**Key Patterns:**
- All tables have `deleted_at` column for soft deletes
- `supportsSoftDelete()` utility checks if resource uses soft delete
- RLS policies enforce multi-tenant isolation

### Layer 4: Debug Instrumentation (Logging)

**Where:** `src/lib/logger.ts`, `src/lib/devLogger.ts`
**Purpose:** Capture forensic context when other layers fail

```typescript
// Structured logging for production (Sentry integration)
import { logger } from "@/lib/logger";

try {
  await validateContactForm(data);
} catch (error) {
  logger.error("Contact validation failed", {
    context: {
      resource: "contacts",
      method: "create",
      data: sanitize(data)  // Remove PII
    },
    error
  });
  throw error;  // Still fail fast!
}

// Development logging (stripped in production)
import { devLog, DEV } from "@/lib/devLogger";

if (DEV) {
  devLog("Validating contact", data);
}
```

## When to Apply This Pattern

### Checklist Before Writing Data Operations

1. **API Boundary** - Is there a Zod schema in `validation/*.ts`?
2. **Form Defaults** - Does the form use `schema.partial().parse({})`?
3. **Database Layer** - Are RLS policies in place? Soft delete configured?
4. **Logging** - Will failures be captured for debugging?

### Red Flags (Validation Gaps)

| Red Flag | Fix |
|----------|-----|
| `validate={}` prop on form | Remove, use API boundary validation |
| `defaultValue="..."` hardcoded | Use `schema.partial().parse({})` |
| `DELETE FROM table` | Use `UPDATE SET deleted_at = NOW()` |
| No RLS policy on table | Add policy in migration |
| Silent catch block | Add logger.error() before re-throw |
| **`z.string()` without `.max()`** | Add `.max(100)` for names, `.max(2000)` for text |
| **`z.object()` at API boundary** | Use `z.strictObject()` for create/update schemas |
| **`z.number()` for form input** | Use `z.coerce.number()` (forms return strings) |
| **`z.string().refine(!includes)` denylist** | Use `z.enum([...])` allowlist instead |
| **`mode: 'onChange'` in useForm** | Use `mode: 'onSubmit'` or `'onBlur'` (performance) |
| **`watch()` at form root** | Use `useWatch({ name })` for isolated re-renders |

## Real Examples from Crispy CRM

### Contact Validation (All 4 Layers)

**Layer 1 - API Boundary:**
```typescript
// src/atomic-crm/validation/contacts.ts
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Either name or first_name/last_name must be provided",
      });
    }
  });
```

**Layer 2 - Form Defaults:**
```typescript
// Form component using schema-derived defaults
const defaultValues = contactBaseSchema.partial().parse({});
// Returns: { email: [], phone: [], ... } with correct structure
```

**Layer 3 - Database:**
```sql
-- Migration: 20251129030358_contact_organization_id_not_null.sql
-- Enforces business rule: Contacts must belong to organization
ALTER TABLE contacts
  ALTER COLUMN organization_id SET NOT NULL;
```

**Layer 4 - Logging:**
```typescript
// unifiedDataProvider.ts
logger.error("Create operation failed", {
  context: { resource, data: params.data },
  error
});
```

## Integration with Engineering Constitution

This skill reinforces these Constitution principles:

| Principle | How Data Integrity Guards Help |
|-----------|--------------------------------|
| **Fail Fast** | Validation throws immediately, no silent failures |
| **Single Source of Truth** | Zod schemas define validation once |
| **Form State from Schema** | `schema.partial().parse({})` pattern |
| **No Retry Logic** | Validation errors fail immediately |

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA INTEGRITY LAYERS                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: API BOUNDARY                                      │
│  └─ ValidationService.validate() → Zod schemas              │
│                                                             │
│  Layer 2: FORM STATE                                        │
│  └─ schema.partial().parse({}) → Safe defaults              │
│                                                             │
│  Layer 3: DATABASE                                          │
│  └─ RLS policies + deleted_at → Security + Audit            │
│                                                             │
│  Layer 4: INSTRUMENTATION                                   │
│  └─ logger.error() → Forensic context                       │
└─────────────────────────────────────────────────────────────┘
```

## See Also

- `src/atomic-crm/validation/` - All Zod schemas
- `src/atomic-crm/providers/supabase/services/ValidationService.ts` - Central validation
- `supabase/migrations/` - RLS policies and schema constraints
- `src/lib/logger.ts` - Structured logging
