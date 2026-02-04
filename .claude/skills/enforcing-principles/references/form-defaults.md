# Form Defaults from Schema

## Core Principle

**Rule:** React Hook Form `defaultValues` MUST use `zodSchema.partial().parse({})`.

## Why This Matters

Prevents drift between validation (Zod schema) and UI (form defaults). Single source of truth.

## Pattern

```typescript
// 1. Define defaults in Zod schema
export const opportunitySchema = z.object({
  stage: z.string().default('new_lead'),
  priority: z.string().default('medium'),
  value: z.coerce.number().default(0),
})

// 2. Extract defaults in component
const schemaDefaults = opportunitySchema.partial().parse({})
const form = useForm({
  defaultValues: {
    ...schemaDefaults, // Schema defaults
    owner_id: identity.id, // Runtime values merged
  }
})

// 3. NO defaultValue props on inputs
<SelectInput source="stage" /> // Uses form default
```

## Anti-Patterns

### ❌ WRONG - Hardcoded Defaults
```typescript
// Component
const form = useForm({
  defaultValues: {
    stage: 'new_lead', // Out of sync with schema!
    priority: 'medium',
  }
})

// What happens when schema changes?
// Schema: stage.default('qualified') ← Changed here
// Component: stage: 'new_lead' ← Forgot to update
// Result: Form shows wrong default
```

### ❌ WRONG - defaultValue Props
```typescript
<SelectInput source="stage" defaultValue="new_lead" />
// Duplicates schema default, can drift
```

## Array Defaults

For JSONB arrays, use sub-schema with `.default()`:

```typescript
export const taskSchema = z.object({
  title: z.string(),
  subtasks: z.array(z.object({
    title: z.string().default(''),
    completed: z.boolean().default(false),
  })).default([]),
})

// Form
const schemaDefaults = taskSchema.partial().parse({})
// schemaDefaults.subtasks === [] (from schema)
```

## Form Mode Rules

> See `.claude/rules/MODULE_CHECKLIST.md` (always loaded)

**Key rules:**
- Use `mode="onSubmit"` or `mode="onBlur"` - never `onChange`
- Use `useWatch()` for isolated field watching, not `watch()`
- Use `createFormResolver(schema)` exclusively (NOT `zodResolver` directly)

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Form defaults | `schema.partial().parse({})` | Hardcode in component |
| Array defaults | Sub-schema with `.default()` | `defaultValue` prop |
| JSONB arrays | `ArrayInput` + `SimpleFormIterator` | Manual array state |
| Submit transform | `transform` prop on CreateBase | Transform in component |
| **RHF + resolver** | `createFormResolver(schema)` ONLY | Mix resolver + `register` validation |

## Cross-References

- Full form patterns: `resources/forms.md`
- Zod security: `zod-patterns.md`
- Module checklist: `.claude/rules/MODULE_CHECKLIST.md`
