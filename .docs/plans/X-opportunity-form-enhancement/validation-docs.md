# Validation Layer Research

## Overview
All validation in Atomic CRM is handled by Zod schemas at the API boundary only (Engineering Constitution principle #5). Validation happens in `/src/atomic-crm/validation/` and is integrated via the `ValidationService` before any database operations.

## Current Opportunity Validation

### Schema Structure
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`

**Enum Schemas** (lines 10-34):
```typescript
// Stage enum
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

// Status enum
export const opportunityStatusSchema = z.enum([
  "active",
  "on_hold",
  "nurturing",
  "stalled",
  "expired",
]);

// Priority enum
export const opportunityPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

// Loss reason enum (for closed_lost)
export const lossReasonSchema = z.enum([
  "price",
  "product_fit",
  "competitor",
  "timing",
  "other",
]);
```

**Required Fields** (lines 86-115):
- `name`: string, min 1 character
- `contact_ids`: array of string/number, min 1 contact required
- `expected_closing_date`: string, required

**Optional Fields with Defaults**:
- `stage`: defaults to "new_lead"
- `priority`: defaults to "medium"
- `amount`: number (min 0), defaults to 0
- `probability`: number (0-100), defaults to 50

**Array Fields** (lines 134, 147-148):
```typescript
sampleProducts: z.array(z.string()).optional(),
attendees: z.array(z.string()).optional(),
demoProducts: z.array(z.string()).optional(),
```

**Conditional Validation** (lines 176-233):
Uses `.superRefine()` to add stage-specific validation rules:
- `demo_scheduled` requires `demoDate`
- `feedback_logged` requires `feedbackNotes`
- `closed_won` requires `finalAmount` and `actual_close_date`
- `closed_lost` requires `lossReason` and `actual_close_date`

**Validation Function** (lines 241-262):
```typescript
export async function validateOpportunityForm(data: any): Promise<void> {
  try {
    opportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
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

**Operation-Specific Schemas**:
- `createOpportunitySchema`: Omits id/timestamps, requires core fields (lines 265-276)
- `updateOpportunitySchema`: All fields partial except id (line 279-281)

## Other Validation Examples

### Contacts Validation
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts`

**Key Patterns**:
1. **Sub-object schemas** (lines 63-71):
```typescript
export const emailAndTypeSchema = z.object({
  email: emailSchema,
  type: personalInfoTypeSchema.default("Work"),
});

export const phoneNumberAndTypeSchema = z.object({
  number: z.string(),
  type: personalInfoTypeSchema.default("Work"),
});
```

2. **Array validation with defaults** (line 106):
```typescript
email: z.array(emailAndTypeSchema).default([]),
```

3. **Legacy field checking** (lines 137-169):
Uses `.refine()` to provide helpful error messages when deprecated fields are used

4. **Complex array validation in superRefine** (lines 171-234):
Validates array items, checks for primary status, ensures required fields

### Organizations Validation
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`

**Key Patterns**:
1. **URL validation with regex** (lines 33-55):
```typescript
const URL_REGEX = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;

const isValidUrl = z.string().refine((url) => !url || URL_REGEX.test(url), {
  message: "Must be a valid URL",
});
```

2. **Union types for flexible inputs** (line 77):
```typescript
annual_revenue: z.union([z.string(), z.number()]).optional(),
```

3. **Enum for limited values** (lines 24-30):
```typescript
export const companySizeSchema = z.union([
  z.literal(1),
  z.literal(10),
  z.literal(50),
  z.literal(250),
  z.literal(500),
]);
```

### Tasks Validation
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/tasks.ts`

**Key Patterns**:
1. **Type enum matching database** (lines 14-23):
```typescript
export const taskTypeEnum = z.enum([
  'Call',
  'Email',
  'Meeting',
  'Follow-up',
  'Proposal',
  'Discovery',
  'Administrative',
  'None'
]);
```

2. **Transform functions** (lines 122-126):
```typescript
export function transformTaskDate(date: string): string {
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate.toISOString();
}
```

### Products Validation
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/products.ts`

**Key Patterns**:
1. **Regex validation for constrained formats** (lines 42-43):
```typescript
export const currencyCodeSchema = z.string()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code like USD");
```

2. **Array fields for complex data** (lines 75-77):
```typescript
certifications: z.array(z.string()).optional(),
allergens: z.array(z.string()).optional(),
```

3. **Using safeParse for better error handling** (lines 88-104):
```typescript
export async function validateProductForm(data: any): Promise<void> {
  const result = productSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    throw {
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
}
```

### Notes Validation
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/notes.ts`

**Key Patterns**:
1. **Schema composition** (lines 24-42, 47-53):
```typescript
const baseNoteSchema = z.object({
  text: z.string().min(1, "Note text is required"),
  // ... common fields
});

export const contactNoteSchema = baseNoteSchema.extend({
  contact_id: z.union([...]),
  status: z.string().min(1, "Status is required"),
});
```

2. **Helper validation functions** (lines 211-222):
```typescript
export function validateAttachmentSize(
  sizeInBytes: number,
  maxSizeMB: number = 10
): string | undefined {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (sizeInBytes > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return undefined;
}
```

## Integration Pattern

### ValidationService
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/services/ValidationService.ts`

The `ValidationService` class (lines 64-160) acts as a registry for all validation functions:

```typescript
private validationRegistry: Record<string, ValidationHandlers<unknown>> = {
  opportunities: {
    create: async (data: unknown) => validateOpportunityForm(data),
    update: async (data: unknown) => validateOpportunityForm(data),
  },
  // ... other resources
};

async validate<K extends keyof ResourceTypeMap>(
  resource: K | string,
  method: DataProviderMethod,
  data: K extends keyof ResourceTypeMap ? Partial<ResourceTypeMap[K]> : unknown
): Promise<void> {
  const validator = this.validationRegistry[resource];

  if (!validator) {
    return; // No validation configured
  }

  if (method === "create" && validator.create) {
    await validator.create(data);
  } else if (method === "update" && validator.update) {
    await validator.update(data);
  }
}
```

### Data Provider Integration
**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

Validation is called before any database operations (lines 117-123):

```typescript
async function runValidation(
  resource: string,
  data: any,
  operation: "create" | "update" = "create",
): Promise<void> {
  try {
    await validationService.validate(resource, operation, data);
  } catch (error: any) {
    // Ensure errors are properly formatted for React Admin
    // ... error handling
  }
}
```

The service is instantiated once (line 54):
```typescript
const validationService = new ValidationService();
```

### Error Handling Pattern
All validation functions follow the same error format (from opportunities.ts lines 246-261):

```typescript
try {
  schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors: Record<string, string> = {};
    error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });

    throw {
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
  throw error;
}
```

This format is compatible with React Admin's error display system.

## Patterns for New Fields

### Adding a New Enum Field (e.g., opportunity_context)

**Step 1: Define the enum schema**
```typescript
export const opportunityContextSchema = z.enum([
  "new_business",
  "expansion",
  "renewal",
  "upsell",
  "cross_sell",
]);
```

**Step 2: Add to main schema**
```typescript
export const opportunitySchema = z.object({
  // ... existing fields
  opportunity_context: opportunityContextSchema.optional(),
  // ... rest of fields
});
```

**Step 3: Export type**
```typescript
export type OpportunityContext = z.infer<typeof opportunityContextSchema>;
```

**Pattern References**:
- Stage enum: opportunities.ts lines 10-19
- Priority enum: opportunities.ts lines 29-34
- Task type enum: tasks.ts lines 14-23
- Product category enum: products.ts lines 9-29

### Adding an Array Field (e.g., products)

**Step 1: Define array schema**
```typescript
// Simple string array
products: z.array(z.string()).optional(),

// OR array of IDs
product_ids: z.array(z.union([z.string(), z.number()])).optional(),

// OR array with default empty
products: z.array(z.string()).default([]),
```

**Step 2: Add validation if needed**
```typescript
// In superRefine if conditional validation required
.superRefine((data, ctx) => {
  if (data.products && data.products.length > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["products"],
      message: "Maximum 10 products allowed",
    });
  }
});
```

**Pattern References**:
- Simple string arrays: opportunities.ts lines 134, 147-148 (sampleProducts, attendees, demoProducts)
- ID arrays: opportunities.ts line 99-101 (contact_ids)
- With defaults: contacts.ts line 106 (email array)
- Sub-object arrays: contacts.ts line 126 (organizations)
- Complex array validation: contacts.ts lines 176-220 (organizations validation in superRefine)

### Adding Conditional Validation

**Pattern**: Use `.superRefine()` for complex conditional logic

```typescript
.superRefine((data, ctx) => {
  if (data.condition_field === "specific_value") {
    if (!data.required_field) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["required_field"],
        message: "This field is required when X",
      });
    }
  }
});
```

**Pattern References**:
- Stage-based validation: opportunities.ts lines 176-233
- Organization validation: contacts.ts lines 171-220
- Reminder validation: tasks.ts lines 66-76

## Error Message Patterns

### Standard Messages
- Required fields: `"{Field name} is required"`
- Min length: `"{Field name} must be at least {n} characters"`
- Range validation: `"{Field name} must be between {min} and {max}"`
- Type validation: `"Must be a valid {type}"`
- Format validation: `"{Field name} must be {format description}"`

### Custom Messages
- Conditional requirements: `"{Field} is required when {condition}"`
- Business rules: `"Only one {item} can be designated as {status}"`
- Legacy field warnings: `"Field '{field}' is no longer supported. Use {alternative} instead."`

**Pattern References**:
- opportunities.ts lines 89, 101, 107-111, 115, 184-186, 193-195, 204-206, 223-225
- contacts.ts lines 103-104, 119, 197-200, 201-207, 213-217
- organizations.ts lines 40-42, 54

## Test Examples

**File**: `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/__tests__/opportunities/integration.test.ts`

**Testing valid data** (lines 15-27):
```typescript
it("should validate and pass valid data", async () => {
  const validData = {
    name: "Test Opportunity",
    contact_ids: ["contact-1"],
    expected_closing_date: "2024-12-31",
    amount: 10000,
    probability: 75,
  };

  await expect(
    validateOpportunityForm(validData)
  ).resolves.toBeUndefined();
});
```

**Testing error formatting** (lines 29-56):
```typescript
it("should format errors for React Admin", async () => {
  const invalidData = {
    name: "",
    contact_ids: [],
    expected_closing_date: "",
    probability: 150,
    amount: -100,
  };

  try {
    await validateOpportunityForm(invalidData);
    expect.fail("Should have thrown validation error");
  } catch (error: any) {
    expect(error.message).toBe("Validation failed");
    expect(error.errors).toBeDefined();
    expect(error.errors.name).toBe("Opportunity name is required");
    // ... more assertions
  }
});
```

## Key Takeaways

1. **Single Source of Truth**: All validation happens in `/src/atomic-crm/validation/` - never in components or forms
2. **Enum Pattern**: Use `z.enum([...])` for fixed sets of values, export as separate schema for reuse
3. **Array Fields**: Use `z.array(z.string())` or `z.array(z.union([...]))` for ID arrays, make optional with `.optional()`
4. **Conditional Validation**: Use `.superRefine()` for stage-based or context-dependent rules
5. **Error Format**: Always format as `{ message: "Validation failed", errors: { field: "message" } }`
6. **Type Safety**: Export type with `z.infer<typeof schema>` for TypeScript integration
7. **Operation-Specific**: Create separate schemas for create/update if validation differs (use `.omit()` and `.partial()`)
8. **Integration**: Validation is called automatically by `ValidationService` before database operations
9. **No component validation**: Forms should NOT validate - validation happens at API boundary only
10. **Legacy field handling**: Use `.refine()` to catch and provide helpful messages for deprecated fields
