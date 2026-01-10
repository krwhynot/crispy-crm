---
name: validate:props
description: Enforce Zod props validation for UI components. Use when creating forms, SlideOvers, or high-churn components. Triggers on props, validation, component props, SlideOver, form props, interface, type definition.
---

# Props Validation Patterns

## When to Use Props Validation

Use Zod schemas for component props when:
1. Component has 3+ props
2. Component is reused across features
3. Props include complex types (functions, nested objects)
4. Component is in the "high-churn" list (SlideOvers, QuickLogForm, Lists)

## Schema Location

All UI props schemas live in: `src/atomic-crm/validation/ui-props.ts`

## Core Schemas Available

### slideOverPropsSchema
Base schema for all SlideOver components:
- `recordId: number | null`
- `isOpen: boolean`
- `onClose: () => void`
- `mode: "view" | "edit"`
- `onModeToggle: () => void`

### slideOverPropsWithCanEditSchema
Extends base with `canEdit?: boolean`

### tabComponentPropsSchema
For SlideOver tab content components

### quickLogFormPropsSchema
For dashboard quick log forms

## Usage Pattern

```typescript
import { slideOverPropsSchema } from "@/atomic-crm/validation/ui-props";

interface ContactSlideOverProps extends z.infer<typeof slideOverPropsSchema> {}

export function ContactSlideOver(props: ContactSlideOverProps) {
  // Runtime validation (optional but recommended for external data)
  const validated = slideOverPropsSchema.parse(props);
  // ...
}
```

## Anti-Patterns

- Don't define inline prop types without schemas
- Don't use `any` for function props
- Don't skip validation for reusable components

## Reference

- Engineering Constitution: Zod at API boundary
- High-churn files: ResourceSlideOver, QuickLogForm, ContactList
