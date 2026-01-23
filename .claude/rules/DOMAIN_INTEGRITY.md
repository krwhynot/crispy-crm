# Domain Layer: Schemas & Types

Defines what entities (Contact, Opportunity, Task) actually are. If this layer is messy, TypeScript types lie and forms break silently.

## Schema Rules

DO:
- `src/atomic-crm/validation/[entity].ts` - one file per entity
- `export type Contact = z.infer<typeof contactSchema>` - derive types from schemas
- `contactSchema.strict()` - prevent illegal fields reaching Supabase
- `z.coerce.number()` - handle form inputs that return strings
- Match DB columns exactly (e.g., `linkedin_url` in schema if in DB)

DON'T:
- `export interface Contact { ... }` - manual interfaces drift from schemas
- Orphan schemas in `utils/` or component files
- Skip `.strict()` - allows invalid data through

## Constants

DO:
- `src/atomic-crm/[module]/constants.ts` - centralize magic strings
- `<SelectItem value={OPPORTUNITY_STAGES.WON}>` - use constants
- Define status colors in constants, not scattered CSS

DON'T:
- `<SelectItem value="closed_won">` - hardcoded strings

## Type Export Pattern

WRONG:
```typescript
export const contactSchema = z.object({ ... });
export interface Contact { id: string; name: string; ... }
```

RIGHT:
```typescript
export const contactSchema = z.object({ ... });
export type Contact = z.infer<typeof contactSchema>; // Single Source of Truth
```

Manual interfaces inevitably drift from schemas. Derive types to maintain sync.

## Checklist

- [ ] Every table in `supabase/migrations/` has matching `z.object` in `validation/`
- [ ] Exporting `z.infer<...>` types (not manual interfaces)
- [ ] Schemas use `.strict()` to block illegal fields
- [ ] Form inputs use `z.coerce` for type conversion
