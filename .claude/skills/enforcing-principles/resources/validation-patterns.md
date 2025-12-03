# Validation Patterns

## Purpose

Document validation patterns for Atomic CRM using Zod schemas at API boundary. Covers Zod schema design, business logic defaults, JSONB array validation, custom validators, and error formatting for React Admin.

## Core Principle: Composable Entry Point (Validation Layer)

**Engineering Constitution #2:** Have a single, composable entry point for data access, delegating to resource-specific modules. For validation, this means Zod schemas at API boundary (`src/atomic-crm/validation/`) ONLY. No validation elsewhere.

**Why Centralized Validation:**
- ✅ No drift between validation rules
- ✅ Type safety via `z.infer<typeof schema>`
- ✅ Business logic defaults in one place
- ✅ Easy to test (pure functions)
- ✅ Self-documenting (schema = specification)

**Critical Rule:** If validation happens outside Zod schemas, it's WRONG. The data provider delegates to these schemas at the API boundary.

## Pattern 1: Basic Schema with Defaults

### Correct Pattern

**From `src/atomic-crm/validation/opportunities.ts:34`:**

```typescript
const opportunityBaseSchema = z.object({
  // Required fields
  name: z.string().min(1, "Opportunity name is required"),
  customer_organization_id: z.union([z.string(), z.number()]),
  principal_organization_id: z.union([z.string(), z.number()]),

  // Fields with business logic defaults
  estimated_close_date: z
    .string()
    .min(1, "Expected closing date is required")
    .default(() => {
      // Default to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split("T")[0];
    }),

  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),

  // Optional fields
  description: z.string().optional().nullable(),
  account_manager_id: z.union([z.string(), z.number()]).optional().nullable(),

  // Array fields with defaults
  contact_ids: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .default([]),
  tags: z.array(z.string()).optional().default([]),
});

export const opportunitySchema = opportunityBaseSchema;

// Type inference - derived from the schema (composable entry point)
export type Opportunity = z.infer<typeof opportunitySchema>;
```

**Key Features:**
- `.default()` provides business logic defaults
- `.optional()` for truly optional fields
- `.nullable()` for fields that accept null from database
- `z.infer` generates TypeScript types from schema
- Enum schemas for constrained values

### ❌ WRONG: Validation in Multiple Places

```typescript
// ❌ WRONG - Validation in component
function OpportunityForm() {
  const validateName = (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Opportunity name is required";
    }
    return undefined;
  };

  return <TextInput source="name" validate={validateName} />;
}

// ❌ WRONG - Validation in utility function
function isValidOpportunity(data: any): boolean {
  if (!data.name) return false;
  if (!data.customer_organization_id) return false;
  return true;
}

// ❌ WRONG - Validation in data provider
async function createOpportunity(data: any) {
  if (!data.name?.trim()) {
    throw new Error("Name is required");
  }
  // ...
}
```

**Why this is wrong:**
- Three different validation definitions
- Rules can drift over time
- No TypeScript type safety
- Harder to test
- Duplication

## Pattern 2: Enum Schemas

### Correct Pattern

**From `src/atomic-crm/validation/opportunities.ts:9`:**

```typescript
// Define enum schemas
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "awaiting_response",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

export const opportunityPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const leadSourceSchema = z.enum([
  "referral",
  "trade_show",
  "website",
  "cold_call",
  "email_campaign",
  "social_media",
  "partner",
  "existing_customer",
]);

// Use in schema
const opportunityBaseSchema = z.object({
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  lead_source: leadSourceSchema.optional().nullable(),
});

// Type inference for UI dropdowns
export type OpportunityStage = z.infer<typeof opportunityStageSchema>;
export type OpportunityPriority = z.infer<typeof opportunityPrioritySchema>;
export type LeadSource = z.infer<typeof leadSourceSchema>;

// Use in UI
const stageChoices = [
  { id: "new_lead", name: "New Lead" },
  { id: "initial_outreach", name: "Initial Outreach" },
  // ... derived from schema
];

<SelectInput
  source="stage"
  choices={stageChoices}
/>;
```

**Benefits:**
- Type-safe enum values
- Validation at API boundary
- UI dropdown values derived from schema
- Add new enum value in one place

## Pattern 3: JSONB Array Validation

### Correct Pattern for Sub-Schemas

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

export const contactSchema = contactBaseSchema;
```

**Database Migration:**
```sql
-- JSONB arrays default to empty array
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
// Results in: { email: [], phone: [] } from .default([])
```

**Why This Works:**
- Sub-schema defines validation once
- `.default("Work")` in sub-schema applies to new array items
- Form uses `schema.partial().parse({})` for initialization
- No duplication between form and validation

### ❌ WRONG: Defaults in Form

```typescript
// ❌ WRONG - Default in form component
<ArrayInput source="email" label="Email Addresses">
  <SimpleFormIterator inline>
    <TextInput source="email" />
    <SelectInput source="type" choices={emailTypes} defaultValue="Work" />
    {/* ^^^ WRONG - default should be in Zod schema */}
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

## Pattern 4: Custom Validation with superRefine

### Correct Pattern

**From `src/atomic-crm/validation/contacts.ts:144`:**

```typescript
export const contactSchema = contactBaseSchema
  .transform(transformContactData) // Transform before validation
  .superRefine((data, ctx) => {
    // Cross-field validation: require at least name or first_name/last_name
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Either name or first_name/last_name must be provided",
      });
    }

    // Array validation: validate each email entry
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

**Example: Update Schema with Conditional Validation**

**From `src/atomic-crm/validation/opportunities.ts:167`:**

```typescript
export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .extend({
    contact_ids: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .required({
    id: true, // ID always required for updates
  })
  .refine(
    (data) => {
      // Only validate contact_ids if it's actually being updated
      if (data.contact_ids === undefined) {
        return true; // Partial update of other fields - allow it
      }

      // If contact_ids IS provided, it must not be empty
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    {
      message: "At least one contact is required",
      path: ["contact_ids"],
    }
  );
```

**Why This Works:**
- Handles partial updates (React Admin sends all form fields)
- Only validates `contact_ids` if user is actually updating it
- Prevents accidental removal of all contacts

## Pattern 5: Create vs Update Schemas

### Separate Schemas for Different Operations

**From `src/atomic-crm/validation/opportunities.ts:127`:**

```typescript
// Base schema - shared validation rules
const opportunityBaseSchema = z.object({
  name: z.string().min(1, "Opportunity name is required"),
  customer_organization_id: z.union([z.string(), z.number()]),
  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
  // ... other fields
});

// Create schema - stricter requirements
export const createOpportunitySchema = opportunityBaseSchema
  .omit({
    id: true, // No ID on create
    created_at: true,
    updated_at: true,
    deleted_at: true,
  })
  .extend({
    // Require at least one contact for NEW opportunities
    contact_ids: z
      .array(z.union([z.string(), z.number()]))
      .min(1, "At least one contact is required"),

    // Remove default - must be explicitly provided on create
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
      // Conditional validation for contact_ids
      if (data.contact_ids === undefined) return true;
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    { message: "At least one contact is required", path: ["contact_ids"] }
  );

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

**Why Separate Schemas:**
- Different business rules for create vs update
- Create: strict validation, all required fields
- Update: flexible validation, partial updates allowed
- Explicit about requirements

## Pattern 6: Error Formatting for React Admin

### Zod to React Admin Format

**From `src/atomic-crm/validation/contacts.ts:315`:**

```typescript
export async function validateContactForm(data: any): Promise<void> {
  try {
    contactSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};

      error.issues.forEach((err) => {
        const path = err.path.join("."); // Dot notation for nested fields
        formattedErrors[path] = err.message;
      });

      // Throw error in React Admin expected format
      throw {
        message: "Validation failed",
        errors: formattedErrors, // Or body: { errors: ... }
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
    { path: ["email", 0, "email"], message: "Invalid email address" },
    { path: ["contact_ids"], message: "At least one contact is required" }
  ]
}

// React Admin error format (output)
{
  message: "Validation failed",
  errors: {
    "first_name": "First name is required",
    "email.0.email": "Invalid email address",
    "contact_ids": "At least one contact is required"
  }
}
```

**Form Display:**
```typescript
// React Admin automatically shows field-level errors
<TextInput source="first_name" label="First Name" />
// Error shows inline: "First name is required"

<ArrayInput source="email">
  <SimpleFormIterator>
    <TextInput source="email" />
  </SimpleFormIterator>
</ArrayInput>
// Error shows inline: "email.0.email: Invalid email address"
```

## Pattern 7: Custom Validators

### URL Validation

**From `src/atomic-crm/validation/contacts.ts:12`:**

```typescript
const LINKEDIN_URL_REGEX = /^http(?:s)?:\/\/(?:www\.)?linkedin\.com\//;

const isLinkedinUrl = z
  .string()
  .refine(
    (url) => {
      if (!url) return true; // Optional field
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.href.match(LINKEDIN_URL_REGEX) !== null;
      } catch {
        return false; // Invalid URL format
      }
    },
    { message: "URL must be from linkedin.com" }
  )
  .optional()
  .nullable();

// Use in schema
const contactBaseSchema = z.object({
  linkedin_url: isLinkedinUrl,
});
```

**Pattern:**
1. Define regex pattern
2. Use `.refine()` with custom logic
3. Handle edge cases (empty, null, invalid format)
4. Provide clear error message
5. Make reusable

### Date Validation

```typescript
const isFutureDate = z
  .string()
  .refine(
    (dateString) => {
      if (!dateString) return true; // Optional
      const date = new Date(dateString);
      return date > new Date();
    },
    { message: "Date must be in the future" }
  )
  .optional()
  .nullable();

const opportunitySchema = z.object({
  estimated_close_date: isFutureDate,
});
```

## Pattern 8: Transform Before Validate

### Data Normalization

**From `src/atomic-crm/validation/contacts.ts:119`:**

```typescript
// Transform function
function transformContactData(data: any) {
  // Compute name from first + last if not provided
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown";
  }

  // Ensure first_name and last_name are set if name is provided
  if (data.name && !data.first_name && !data.last_name) {
    const parts = data.name.split(" ");
    if (parts.length >= 2) {
      data.first_name = parts[0];
      data.last_name = parts.slice(1).join(" ");
    } else {
      data.first_name = data.name;
      data.last_name = "";
    }
  }

  return data;
}

// Apply transform before validation
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    // Validate AFTER transformation
    if (!data.name && !data.first_name && !data.last_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Either name or first_name/last_name must be provided",
      });
    }
  });
```

**When to Transform:**
- Normalize data (trim, lowercase, etc.)
- Compute derived fields
- Split/merge fields
- Handle legacy data formats

## Pattern 9: Import Schemas (Permissive Validation)

### CSV Import Validation

**From `src/atomic-crm/validation/contacts.ts:172`:**

```typescript
// More permissive than main schema for real-world CSV data
export const importContactSchema = z
  .object({
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    organization_name: z
      .string({ required_error: "Organization name is required" })
      .trim()
      .min(1, { message: "Organization name is required" }),

    // Email fields - validate format but allow empty/null
    email_work: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string().trim().email({ message: "Invalid email address" }),
      ])
      .optional()
      .nullable(),

    // Phone fields - allow string or number (PapaParse converts)
    phone_work: z
      .union([
        z.literal(""),
        z.literal(null),
        z.undefined(),
        z.string(),
        z.number().transform(String), // Convert numbers to strings
      ])
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    // Require at least first name or last name
    if (!data.first_name?.trim() && !data.last_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["first_name"],
        message: "Either first name or last name must be provided",
      });
    }
  });
```

**Why Permissive:**
- CSV data is messy (empty strings, nulls, wrong types)
- Allow flexible input, normalize during transformation
- Validate format when value is present
- Clear error messages for fixable issues

## Validation Decision Tree

```
Need validation?
│
├─ Where should it go?
│  └─ ALWAYS: src/atomic-crm/validation/<resource>.ts
│     └─ NEVER: Component, utils, data provider
│
├─ What schema type?
│  ├─ Standard CRUD → Base schema + create/update schemas
│  ├─ CSV import → Separate permissive import schema
│  └─ Sub-resources → Sub-schema (for JSONB arrays)
│
├─ What validation rules?
│  ├─ Simple constraints → z.string().min(), z.enum(), etc.
│  ├─ Cross-field logic → .superRefine()
│  ├─ Custom validators → .refine()
│  └─ Data normalization → .transform()
│
└─ How to format errors?
   └─ Zod error → React Admin format
      └─ { message, errors: { field: message } }
```

## Best Practices

### DO

✅ Define all validation in `src/atomic-crm/validation/<resource>.ts`
✅ Use `.default()` for business logic defaults
✅ Create separate schemas for create vs update
✅ Use sub-schemas for JSONB arrays
✅ Format errors for React Admin (`{ message, errors }`)
✅ Export type with `z.infer<typeof schema>`
✅ Use `.transform()` for data normalization
✅ Use `.superRefine()` for cross-field validation
✅ Make import schemas permissive (handle messy CSV data)
✅ Export validation functions (`validateCreateX`, `validateUpdateX`)

### DON'T

❌ Validate in components (use schema only)
❌ Validate in utility functions (use centralized schemas only)
❌ Validate in data provider (schemas at API boundary)
❌ Put `defaultValue` in form components (use schema)
❌ Duplicate validation rules across files
❌ Use `Promise.all()` for bulk validation (use `Promise.allSettled()`)
❌ Create schemas without `.default()` for optional fields
❌ Skip error formatting (React Admin needs specific format)

## Testing Validation

### Unit Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { opportunitySchema, createOpportunitySchema } from './opportunities';

describe('opportunitySchema', () => {
  it('validates valid opportunity', () => {
    const validData = {
      name: "Test Opportunity",
      customer_organization_id: 1,
      principal_organization_id: 2,
      estimated_close_date: "2025-12-31",
    };

    expect(() => opportunitySchema.parse(validData)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    const invalidData = {
      name: "", // Empty name
      customer_organization_id: 1,
    };

    expect(() => createOpportunitySchema.parse(invalidData)).toThrow();
  });

  it('applies defaults', () => {
    const data = { name: "Test", customer_organization_id: 1, principal_organization_id: 2 };
    const result = opportunitySchema.parse(data);

    expect(result.stage).toBe("new_lead"); // Default applied
    expect(result.priority).toBe("medium"); // Default applied
    expect(result.contact_ids).toEqual([]); // Default applied
  });
});
```

## Related Resources

- [form-state-management.md](form-state-management.md) - Using schemas in forms
- [error-handling.md](error-handling.md) - Error formatting patterns
- [testing-patterns.md](testing-patterns.md) - Testing validation
- [anti-patterns.md](anti-patterns.md) - What NOT to do

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
