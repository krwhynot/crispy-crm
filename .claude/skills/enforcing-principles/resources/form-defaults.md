# Form: Defaults from Schema

## Purpose

Document form state management patterns that derive defaults from Zod schemas.

## Core Principle: Form State Derived from Truth

**Engineering Constitution #3:** React Hook Form `defaultValues` MUST use `zodSchema.partial().parse({})`.

**Why This Works:**
- Single source of truth (Zod schema)
- No drift between defaults and validation
- Type-safe form state
- Business logic in one place

**Critical Rule:** If form defaults are hardcoded in components, it's WRONG.

## Pattern: Form Defaults from Schema

**From `src/atomic-crm/opportunities/OpportunityCreate.tsx:17`:**

```typescript
import { CreateBase, Form, useGetIdentity } from 'ra-core';
import { opportunitySchema } from '../validation/opportunities';

const OpportunityCreate = () => {
  const { identity } = useGetIdentity();

  // Generate defaults from schema, then merge with runtime values
  const formDefaults = {
    ...opportunitySchema.partial().parse({}),
    opportunity_owner_id: identity?.id,
    account_manager_id: identity?.id,
    contact_ids: [], // Explicitly initialize for ReferenceArrayInput
    products_to_sync: [], // Explicitly initialize for ArrayInput
  };

  return (
    <CreateBase redirect="show">
      <Form defaultValues={formDefaults}>
        <Card>
          <CardContent>
            <OpportunityInputs mode="create" />
            <FormToolbar>
              <SaveButton label="Create Opportunity" />
            </FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </CreateBase>
  );
};
```

**Schema with Defaults:**

```typescript
// src/atomic-crm/validation/opportunities.ts
const opportunityBaseSchema = z.object({
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
  contact_ids: z.array(z.union([z.string(), z.number()])).optional().default([]),
});
```

**What Happens:**

```typescript
// 1. Schema defines defaults
opportunitySchema.partial().parse({})
// Result:
// {
//   estimated_close_date: "2025-12-13", // 30 days from now
//   stage: "new_lead",
//   priority: "medium",
//   contact_ids: []
// }

// 2. Merge with runtime values
const formDefaults = {
  ...opportunitySchema.partial().parse({}),
  opportunity_owner_id: identity?.id, // Current user
};

// 3. Form uses these defaults
<Form defaultValues={formDefaults}>
```

## WRONG: Hardcoded Defaults

```typescript
// ❌ WRONG - Hardcoded in component
const OpportunityCreate = () => {
  const formDefaults = {
    stage: 'new_lead', // Out of sync with schema!
    priority: 'medium',
    estimated_close_date: '2025-12-31', // Wrong calculation
  };

  return <Form defaultValues={formDefaults}>...</Form>;
};

// ❌ WRONG - Using defaultValue prop
<SelectInput source="stage" defaultValue="new_lead" />

// ❌ WRONG - Initializing in useState
const [formData, setFormData] = useState({
  stage: 'new_lead',
  priority: 'medium',
});
```

**Why this is wrong:**
- Defaults duplicated in schema and component
- Changes to schema don't reflect in form
- No TypeScript type safety

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Form defaults | `schema.partial().parse({})` | Hardcode in component |
| Runtime values | Merge with schema defaults | Set independently |
| Array fields | Initialize as `[]` | Leave undefined |

## Related Resources

- [form-arrays.md](form-arrays.md) - JSONB array inputs
- [form-patterns.md](form-patterns.md) - Tabbed forms, submission
- [validation-basics.md](validation-basics.md) - Zod schema patterns

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
