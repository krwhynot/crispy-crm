# Validation Basics

## Purpose

Document core validation patterns using Zod schemas at API boundary.

## Core Principle: Single Source of Truth

**Engineering Constitution #2:** Zod schemas at API boundary (`src/atomic-crm/validation/`) ONLY. No validation elsewhere.

**Why Centralized Validation:**
- No drift between validation rules
- Type safety via `z.infer<typeof schema>`
- Business logic defaults in one place
- Easy to test (pure functions)
- Self-documenting (schema = specification)

**Critical Rule:** If validation happens outside Zod schemas, it's WRONG.

## Pattern 1: Basic Schema with Defaults

**From `src/atomic-crm/validation/opportunities.ts:34`:**

```typescript
const opportunityBaseSchema = z.object({
  // Required fields
  name: z.string().min(1, "Opportunity name is required"),
  customer_organization_id: z.union([z.string(), z.number()]),

  // Fields with business logic defaults
  estimated_close_date: z
    .string()
    .min(1, "Expected closing date is required")
    .default(() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split("T")[0];
    }),

  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),

  // Optional fields
  description: z.string().optional().nullable(),

  // Array fields with defaults
  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

// Type inference
export type Opportunity = z.infer<typeof opportunitySchema>;
```

**Key Features:**
- `.default()` provides business logic defaults
- `.optional()` for truly optional fields
- `.nullable()` for fields that accept null from database
- `z.infer` generates TypeScript types from schema

## Pattern 2: Enum Schemas

**From `src/atomic-crm/validation/opportunities.ts:9`:**

```typescript
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

// Use in schema
const opportunityBaseSchema = z.object({
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
});

// Type inference for UI dropdowns
export type OpportunityStage = z.infer<typeof opportunityStageSchema>;
export type OpportunityPriority = z.infer<typeof opportunityPrioritySchema>;
```

**Benefits:**
- Type-safe enum values
- Validation at API boundary
- UI dropdown values derived from schema

## WRONG: Validation in Multiple Places

```typescript
// ❌ WRONG - Validation in component
function OpportunityForm() {
  const validateName = (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Opportunity name is required";
    }
  };
  return <TextInput source="name" validate={validateName} />;
}

// ❌ WRONG - Validation in utility function
function isValidOpportunity(data: any): boolean {
  if (!data.name) return false;
  return true;
}
```

**Why this is wrong:**
- Multiple validation definitions
- Rules can drift over time
- No TypeScript type safety

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Where to validate | `src/atomic-crm/validation/` | Component/utils |
| Business defaults | `.default()` in Zod | Hardcode in component |
| Type inference | `z.infer<typeof schema>` | Manual type definition |

## Related Resources

- [validation-arrays.md](validation-arrays.md) - JSONB array validation
- [validation-schemas.md](validation-schemas.md) - Create/Update schemas
- [validation-advanced.md](validation-advanced.md) - Custom validators

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
