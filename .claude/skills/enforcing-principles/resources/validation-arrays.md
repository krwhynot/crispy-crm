# Validation: JSONB Arrays

## Purpose

Document validation patterns for JSONB arrays using Zod sub-schemas.

## Pattern: JSONB Array Validation

### Sub-Schemas for Array Items

**From `src/atomic-crm/validation/contacts.ts:8`:**

```typescript
// 1. Define sub-schema for array items
export const personalInfoTypeSchema = z.enum(["Work", "Home", "Other"]);

export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"), // Default in sub-schema
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});

// 2. Use sub-schemas in main schema
const contactBaseSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),

  // JSONB arrays with sub-schema validation
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

**Database Migration:**
```sql
ALTER TABLE contacts ADD COLUMN email JSONB DEFAULT '[]'::jsonb;
ALTER TABLE contacts ADD COLUMN phone JSONB DEFAULT '[]'::jsonb;
```

**Form Component:**
```typescript
// NO defaultValue prop - Zod provides defaults
<ArrayInput source="email" label="Email Addresses">
  <SimpleFormIterator inline>
    <TextInput source="email" placeholder="email@example.com" />
    <SelectInput source="type" choices={emailTypes} />
    {/* NO defaultValue here */}
  </SimpleFormIterator>
</ArrayInput>

// Form initialization
const formDefaults = contactSchema.partial().parse({});
// Results in: { email: [], phone: [] }
```

**Why This Works:**
- Sub-schema defines validation once
- `.default("Work")` applies to new array items
- Form uses `schema.partial().parse({})` for initialization

## Pattern: Cross-Field Validation with superRefine

**From `src/atomic-crm/validation/contacts.ts:144`:**

```typescript
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Cross-field validation
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Either name or first_name/last_name must be provided",
      });
    }

    // Array validation with dynamic errors
    if (data.email && Array.isArray(data.email)) {
      const emailValidator = z.string().email("Invalid email address");
      data.email.forEach((entry: any, index: number) => {
        if (entry.email && !emailValidator.safeParse(entry.email).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email", index, "email"],
            message: "Must be a valid email address",
          });
        }
      });
    }
  });
```

**When to Use superRefine:**
- Cross-field validation (one field depends on another)
- Array item validation with dynamic errors
- Business logic that can't be expressed with basic Zod methods
- Custom error paths

## WRONG: Defaults in Form Component

```typescript
// ❌ WRONG - defaultValue in SelectInput
<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" />
    <SelectInput source="type" choices={types} defaultValue="Work" />
    {/* ^^^ WRONG - default should be in Zod sub-schema */}
  </SimpleFormIterator>
</ArrayInput>

// ❌ WRONG - No sub-schema, inline validation
const contactSchema = z.object({
  email: z.array(
    z.object({
      email: z.string().email(),
      type: z.enum(["Work", "Home", "Other"]),
    })
  ),
});
// Misses .default() on type field
```

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Array defaults | Sub-schema with `.default()` | `defaultValue` prop |
| JSONB arrays | `ArrayInput` + `SimpleFormIterator` | Manual array state |
| Array validation | `.superRefine()` with indexed paths | Inline validation |

## Related Resources

- [validation-basics.md](validation-basics.md) - Core validation patterns
- [validation-schemas.md](validation-schemas.md) - Create/Update schemas
- [form-arrays.md](form-arrays.md) - Form ArrayInput patterns

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
