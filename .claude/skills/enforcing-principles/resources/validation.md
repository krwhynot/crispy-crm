# Validation

## Core Principle: Single Source of Truth

Zod schemas at API boundary (`src/atomic-crm/validation/`) ONLY. No validation in components or utils.

**Why:** No drift, type safety via `z.infer`, business logic in one place, easy to test, self-documenting.

## Pattern: Basic Schema with Defaults

```typescript
const opportunityBaseSchema = z.object({
  name: z.string().min(1, "Opportunity name is required"),
  customer_organization_id: z.union([z.string(), z.number()]),
  estimated_close_date: z.string().min(1, "Required").default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  }),
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
});

export type Opportunity = z.infer<typeof opportunitySchema>;
```

Key: `.default()` for business defaults, `.optional()` for truly optional, `.nullable()` for DB nulls, `z.infer` for types.

## Pattern: Enum Schemas

```typescript
export const opportunityStageSchema = z.enum([
  "new_lead", "initial_outreach", "sample_visit_offered",
  "awaiting_response", "feedback_logged", "demo_scheduled",
  "closed_won", "closed_lost",
]);

export type OpportunityStage = z.infer<typeof opportunityStageSchema>;
```

Type-safe enum values, validation at API boundary, UI dropdowns derived from schema.

## Pattern: JSONB Array Sub-Schemas

```typescript
export const emailAndTypeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: personalInfoTypeSchema.default("Work"),
});

const contactBaseSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
});
```

Sub-schema defines validation once. `.default("Work")` applies to new array items. Form uses `schema.partial().parse({})` for initialization.

## Pattern: Cross-Field Validation with superRefine

```typescript
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

Use superRefine for: cross-field validation, array item validation with dynamic errors, custom error paths.

## Pattern: Create vs Update Schemas

```typescript
// Create: strict, all required fields
export const createOpportunitySchema = opportunityBaseSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    contact_ids: z.array(z.union([z.string(), z.number()]))
      .min(1, "At least one contact is required"),
  });

// Update: flexible, partial updates
export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .required({ id: true });
```

## Pattern: Custom Validators

```typescript
const isLinkedinUrl = z.string()
  .refine((url) => {
    if (!url) return true;
    try {
      return new URL(url).href.match(/^https?:\/\/(www\.)?linkedin\.com\//) !== null;
    } catch { return false; }
  }, { message: "URL must be from linkedin.com" })
  .optional().nullable();
```

## Pattern: Transform Before Validate

```typescript
function transformContactData(data: Record<string, unknown>) {
  if (!data.name && (data.first_name || data.last_name)) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  }
  return data;
}

export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine(/* validate AFTER transformation */);
```

## Pattern: Import Schemas (Permissive)

```typescript
export const importContactSchema = z.object({
  first_name: z.string().optional().nullable(),
  organization_name: z.string().trim().min(1, "Required"),
  email_work: z.union([z.literal(""), z.literal(null), z.undefined(),
    z.string().trim().email()]).optional().nullable(),
  phone_work: z.union([z.literal(""), z.literal(null), z.undefined(),
    z.string(), z.number().transform(String)]).optional().nullable(),
});
```

CSV data is messy. Allow flexible input, normalize during transformation, validate format when value is present.

## Error Formatting for React Admin

```typescript
// Zod issues -> React Admin field errors
const fieldErrors: Record<string, string> = {};
for (const issue of error.issues) {
  const fieldPath = issue.path.join(".");
  fieldErrors[fieldPath || "_error"] = issue.message;
}
throw { message: "Validation failed", errors: fieldErrors };
```

## Validation Decision Tree

```
Need validation?
|
+- Where? --> ALWAYS: src/atomic-crm/validation/<resource>.ts
+- Schema type?
|  +- Standard CRUD --> Base + create/update schemas
|  +- CSV import --> Permissive import schema
|  +- Sub-resources --> Sub-schema for JSONB arrays
+- Rules?
|  +- Simple --> z.string().min(), z.enum()
|  +- Cross-field --> .superRefine()
|  +- Custom --> .refine()
|  +- Normalization --> .transform()
+- Error format? --> { message, errors: { field: message } }
```

## Testing Validation

```typescript
describe('opportunitySchema', () => {
  it('validates valid data', () => {
    expect(() => opportunitySchema.parse(validData)).not.toThrow();
  });
  it('rejects missing required fields', () => {
    expect(() => createOpportunitySchema.parse({})).toThrow();
  });
  it('applies defaults', () => {
    const result = opportunitySchema.parse(minimalData);
    expect(result.stage).toBe("new_lead");
    expect(result.priority).toBe("medium");
  });
});
```
