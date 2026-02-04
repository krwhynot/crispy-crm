# TypeScript Type Safety

## Core Convention

**Rule:** `interface` for objects/classes, `type` for unions/intersections.

```typescript
// ✅ Interfaces for object shapes
interface Contact {
  id: string
  first_name: string
  last_name: string
}

// ✅ Types for unions
type Status = 'active' | 'inactive' | 'archived'

// ✅ Types for intersections
type ContactWithMeta = Contact & { created_at: string; updated_at: string }
```

## Zod-Derived Types (Exception)

**Rule:** Zod-derived types ALWAYS use `type` (not `interface`).

**Why:** `z.infer<typeof schema>` produces type aliases, not interfaces. This is the canonical pattern per DOMAIN_INTEGRITY.md.

```typescript
// ✅ CORRECT - Zod inferred type
export const contactSchema = z.object({
  id: z.string(),
  first_name: z.string(),
})
export type Contact = z.infer<typeof contactSchema>

// ❌ WRONG - Manual interface drifts from schema
export interface Contact {
  id: string
  first_name: string
  // Forgot to add last_name when schema changed!
}
```

## Type vs Any (BANNED)

> See `.claude/rules/CODE_QUALITY.md` - Zero tolerance for `: any`

**Banned patterns:**
- `: any` - Disables type checking
- `as any` - Bypasses type safety
- `any[]` - Untyped arrays
- `Promise<any>` - Use `Promise<unknown>` or `Promise<T>`

**Type-safe alternatives:**

| Instead of | Use |
|------------|-----|
| `(props: any)` | Inline type: `({ children }: { children: React.ReactNode })` |
| `{...} as any` (RA hook mock) | Typed factory: `mockUseGetListReturn<T>()` |
| `(param: any)` in mock | `Record<string, unknown>` or specific interface |
| `let error: any` | `let error: unknown` with type narrowing |

## Type Inference

**Prefer inference over explicit types:**

```typescript
// ✅ GOOD - Type inferred from Zod schema
export type Contact = z.infer<typeof contactSchema>

// ✅ GOOD - Type inferred from function return
const contact = await dataProvider.getOne('contacts', { id })

// ❌ WRONG - Manually duplicating type
const contact: Contact = await dataProvider.getOne('contacts', { id })
```

## Generic Constraints

Use constraints to maintain type boundaries:

```typescript
// ✅ CORRECT - Constrains T to have an id
function updateRecord<T extends { id: number }>(record: T) {
  return { ...record, updated_at: new Date() }
}

// ❌ WRONG - No constraints, could be anything
function updateRecord<T>(record: T) {
  return { ...record, updated_at: new Date() }
}
```

## Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| Object shapes | `interface Contact { ... }` | `type Contact = { ... }` |
| Unions | `type Status = 'a' | 'b'` | `interface Status { ... }` |
| Zod types | `type T = z.infer<typeof schema>` | `interface T { ... }` |
| Unknown types | `unknown` with guards | `any` |
| Generic constraints | `<T extends RaRecord>` | `<T>` |

## Cross-References

- Zero `: any` rule: `.claude/rules/CODE_QUALITY.md`
- Zod type inference: `.claude/rules/DOMAIN_INTEGRITY.md`
- Test type safety: `src/tests/utils/typed-mocks.ts`
