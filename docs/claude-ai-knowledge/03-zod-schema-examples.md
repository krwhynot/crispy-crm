# Crispy CRM Zod Schema Examples

> **Purpose:** Reference document for Claude.ai Project Knowledge. Shows validation patterns at API boundary.

---

## Golden Rules

1. **Validation at API boundary ONLY** — Never in forms
2. **z.strictObject()** — Prevents mass assignment attacks
3. **All strings have .max()** — DoS prevention
4. **z.coerce for form inputs** — Handles string→type conversion
5. **z.enum() for constrained values** — Allowlist, not denylist
6. **Form defaults from schema** — `schema.partial().parse({})`

---

## Basic Schema Pattern

```typescript
// src/atomic-crm/validation/example.ts
import { z } from "zod";

export const exampleSchema = z.strictObject({
  // System fields (optional on create)
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),

  // Required fields
  name: z.string()
    .min(1, "Name is required")
    .max(255, "Name too long"),

  // Optional fields
  description: z.string()
    .max(2000, "Description too long")
    .optional()
    .nullable(),

  // Enum fields (allowlist)
  status: z.enum(["active", "inactive", "pending"]).default("active"),

  // Foreign keys
  organization_id: z.union([z.string(), z.number()]),

  // Arrays
  tags: z.array(z.string().max(50))
    .max(20, "Maximum 20 tags")
    .optional()
    .default([]),

  // Dates (coerce string → Date)
  due_date: z.coerce.date().optional().nullable(),
});

// Type inference
export type Example = z.infer<typeof exampleSchema>;
export type ExampleInput = z.input<typeof exampleSchema>;
```

---

## Enum Definition Pattern

```typescript
// Define enum schema
export const opportunityStageSchema = z.enum([
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
]);

// Export type
export type OpportunityStage = z.infer<typeof opportunityStageSchema>;

// UI dropdown options
export const STAGE_OPTIONS = [
  { id: "new_lead", name: "New Lead" },
  { id: "initial_outreach", name: "Initial Outreach" },
  { id: "sample_visit_offered", name: "Sample/Visit Offered" },
  { id: "feedback_logged", name: "Feedback Logged" },
  { id: "demo_scheduled", name: "Demo Scheduled" },
  { id: "closed_won", name: "Closed Won" },
  { id: "closed_lost", name: "Closed Lost" },
] as const;
```

---

## Create vs Update Schemas

```typescript
// Base schema with all fields
const baseSchema = z.strictObject({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1).max(255),
  status: z.enum(["active", "inactive"]).default("active"),
  organization_id: z.union([z.string(), z.number()]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Create schema: remove system fields, require business fields
export const createSchema = baseSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .required({
    name: true,
    organization_id: true,
  });

// Update schema: partial fields, require ID
export const updateSchema = baseSchema
  .partial()
  .required({
    id: true,
  });
```

---

## Conditional Validation with .refine()

```typescript
// Win/loss reason required based on stage
export const closeOpportunitySchema = z.strictObject({
  id: z.union([z.string(), z.number()]),
  stage: z.enum(["closed_won", "closed_lost"]),
  win_reason: z.enum(["relationship", "product_quality", "price", "timing", "other"])
    .optional().nullable(),
  loss_reason: z.enum(["price_too_high", "no_authorization", "competitor", "other"])
    .optional().nullable(),
  close_reason_notes: z.string().max(500).optional().nullable(),
})
.refine(
  (data) => {
    if (data.stage === "closed_won") {
      return !!data.win_reason;
    }
    return true;
  },
  {
    message: "Win reason is required when closing as won",
    path: ["win_reason"],
  }
)
.refine(
  (data) => {
    if (data.stage === "closed_lost") {
      return !!data.loss_reason;
    }
    return true;
  },
  {
    message: "Loss reason is required when closing as lost",
    path: ["loss_reason"],
  }
);
```

---

## Complex Validation with .superRefine()

```typescript
// Activities: different rules based on activity_type
export const activitiesSchema = baseActivitiesSchema.superRefine((data, ctx) => {
  // If interaction, opportunity_id is required
  if (data.activity_type === "interaction" && !data.opportunity_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opportunity_id"],
      message: "Opportunity is required for interaction activities",
    });
  }

  // If engagement, opportunity_id should NOT be set
  if (data.activity_type === "engagement" && data.opportunity_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["opportunity_id"],
      message: "Opportunity should not be set for engagement activities",
    });
  }

  // At least one entity required
  if (!data.contact_id && !data.organization_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contact_id"],
      message: "Either contact or organization is required",
    });
  }

  // Sample tracking: sample_status required when type = 'sample'
  if (data.type === "sample" && !data.sample_status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sample_status"],
      message: "Sample status is required for sample activities",
    });
  }
});
```

---

## Validation Function Pattern

```typescript
// Validation function for unifiedDataProvider
export async function validateOpportunityForm(data: unknown): Promise<void> {
  try {
    opportunitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors for React Admin
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      // React Admin expects errors at body.errors
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error; // Re-throw non-Zod errors
  }
}
```

---

## Form Defaults from Schema

```typescript
// In your form component:
import { opportunitySchema } from '@/atomic-crm/validation/opportunities';

// Get defaults from schema (Constitution principle)
const defaultValues = opportunitySchema.partial().parse({});
// Result: { stage: "new_lead", priority: "medium", contact_ids: [], ... }

// Use in React Admin form
<SimpleForm defaultValues={defaultValues}>
  {/* inputs */}
</SimpleForm>
```

---

## Anti-Patterns (NEVER DO)

```typescript
// ❌ WRONG: z.object (allows unknown keys)
const schema = z.object({ name: z.string() });

// ✅ CORRECT: z.strictObject (rejects unknown keys)
const schema = z.strictObject({ name: z.string() });

// ❌ WRONG: No .max() on string (DoS risk)
const schema = z.strictObject({ name: z.string() });

// ✅ CORRECT: Always have .max()
const schema = z.strictObject({ name: z.string().max(255) });

// ❌ WRONG: Validation in form component
<TextInput source="name" validate={required()} />

// ✅ CORRECT: No validation in form - only at API boundary
<TextInput source="name" />

// ❌ WRONG: Hardcoded defaults
<SimpleForm defaultValues={{ stage: "new_lead" }}>

// ✅ CORRECT: Defaults from schema
<SimpleForm defaultValues={schema.partial().parse({})}>
```

---

## Real Example: Opportunity Schema

```typescript
// src/atomic-crm/validation/opportunities.ts (simplified)
import { z } from "zod";

export const opportunityStageSchema = z.enum([
  "new_lead", "initial_outreach", "sample_visit_offered",
  "feedback_logged", "demo_scheduled", "closed_won", "closed_lost",
]);

export const opportunityPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const opportunitySchema = z.strictObject({
  id: z.union([z.string(), z.number()]).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),

  name: z.string().min(1, "Required").max(255, "Too long"),
  description: z.string().max(2000).optional().nullable(),

  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),

  customer_organization_id: z.union([z.string(), z.number()]),
  principal_organization_id: z.union([z.string(), z.number()]),
  distributor_organization_id: z.union([z.string(), z.number()]).optional().nullable(),

  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),

  estimated_close_date: z.coerce.date().default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }),

  notes: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

export type Opportunity = z.infer<typeof opportunitySchema>;
```

---

## File Locations

```
src/atomic-crm/validation/
├── activities.ts        # Activity schemas
├── contacts.ts          # Contact schemas
├── opportunities.ts     # Opportunity schemas
├── organizations.ts     # Organization schemas
├── operatorSegments.ts  # Operator segment schemas
├── distributorAuthorizations.ts
├── products.ts
├── sales.ts
└── index.ts             # Re-exports all schemas
```
