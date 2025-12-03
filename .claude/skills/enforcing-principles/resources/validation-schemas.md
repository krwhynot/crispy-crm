# Validation: Create vs Update Schemas

## Purpose

Document patterns for separate Create and Update schemas with different validation rules.

## Pattern: Separate Schemas for Different Operations

**From `src/atomic-crm/validation/opportunities.ts:127`:**

```typescript
// Base schema - shared validation rules
const opportunityBaseSchema = z.object({
  name: z.string().min(1, "Opportunity name is required"),
  customer_organization_id: z.union([z.string(), z.number()]),
  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
});

// Create schema - stricter requirements
export const createOpportunitySchema = opportunityBaseSchema
  .omit({
    id: true, // No ID on create
    created_at: true,
    updated_at: true,
  })
  .extend({
    // Require at least one contact for NEW opportunities
    contact_ids: z
      .array(z.union([z.string(), z.number()]))
      .min(1, "At least one contact is required"),

    // Must be explicitly provided on create
    estimated_close_date: z.string().min(1, "Expected closing date is required"),
  })
  .required({
    name: true,
    estimated_close_date: true,
  });

// Update schema - more flexible
export const updateOpportunitySchema = opportunityBaseSchema
  .partial() // All fields optional for partial updates
  .required({
    id: true, // Except ID
  })
  .refine(
    (data) => {
      // Only validate contact_ids if provided
      if (data.contact_ids === undefined) return true;
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    { message: "At least one contact is required", path: ["contact_ids"] }
  );
```

**Why Separate Schemas:**
- Different business rules for create vs update
- Create: strict validation, all required fields
- Update: flexible validation, partial updates allowed

## Pattern: Validation Functions

```typescript
// Export validation functions
export async function validateCreateOpportunity(data: any): Promise<void> {
  try {
    createOpportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw formatZodError(error);
    }
    throw error;
  }
}

export async function validateUpdateOpportunity(data: any): Promise<void> {
  try {
    updateOpportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw formatZodError(error);
    }
    throw error;
  }
}
```

## Pattern: Error Formatting for React Admin

**From `src/atomic-crm/validation/contacts.ts:315`:**

```typescript
export async function validateContactForm(data: any): Promise<void> {
  try {
    contactSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};

      error.issues.forEach((err) => {
        const path = err.path.join("."); // Dot notation for nested
        formattedErrors[path] = err.message;
      });

      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}
```

**Error Format Transformation:**

```typescript
// Zod error (input)
{
  issues: [
    { path: ["first_name"], message: "First name is required" },
    { path: ["email", 0, "email"], message: "Invalid email address" }
  ]
}

// React Admin error format (output)
{
  message: "Validation failed",
  errors: {
    "first_name": "First name is required",
    "email.0.email": "Invalid email address"
  }
}
```

**Form Display:**
```typescript
<TextInput source="first_name" label="First Name" />
// Error shows inline: "First name is required"

<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" />
  </SimpleFormIterator>
</ArrayInput>
// Error shows inline: "email.0.email: Invalid email address"
```

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Create validation | Strict, all required | Use update schema |
| Update validation | `.partial()` + ID required | Require all fields |
| Error format | `{ message, errors: {} }` | Throw raw Zod error |
| Field paths | Dot notation for nested | Lose nested path info |

## Related Resources

- [validation-basics.md](validation-basics.md) - Core validation patterns
- [validation-arrays.md](validation-arrays.md) - JSONB array validation
- [error-handling-validation.md](error-handling-validation.md) - Error formatting

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
