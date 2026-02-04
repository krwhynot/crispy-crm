# Zod Security Patterns

> Canonical reference: `.claude/rules/DOMAIN_INTEGRITY.md` (always loaded)
> Key rules: `.strict()` for creates, `.passthrough()` for updates, `.max()` on strings, `z.coerce` for forms, `z.enum()` for allowlists.

## Critical Security Rules

### String Length Limits
**Rule:** ALL string fields MUST have `.max()` limits to prevent DoS attacks.

```typescript
// ✅ CORRECT - Protected against memory exhaustion
export const contactSchema = z.object({
  first_name: z.string().max(100),
  email: z.string().email().max(255),
  notes: z.string().max(10000),
})

// ❌ WRONG - Attacker can send 100MB string
export const contactSchema = z.object({
  first_name: z.string(), // NO LIMIT!
})
```

### StrictObject for API Boundary
**Rule:** Use `z.strictObject()` at API boundaries to prevent mass-assignment attacks.

```typescript
// ✅ CORRECT - Rejects unknown keys
export const contactCreateSchema = contactSchema.strict()

// ❌ WRONG - Silently accepts extra keys (could be SQL injection vector)
export const contactCreateSchema = contactSchema // default is .passthrough()
```

### Coercion for Forms
**Rule:** Use `z.coerce` for form inputs that return strings.

```typescript
// ✅ CORRECT - Handles <input type="number"> returning "42"
export const opportunitySchema = z.object({
  value: z.coerce.number().positive(),
  close_date: z.coerce.date(),
})

// ❌ WRONG - Fails on string "42" from form input
export const opportunitySchema = z.object({
  value: z.number(), // Type error: "42" is not number
})
```

### Enum Allowlists
**Rule:** Use `z.enum()` for constrained values (allowlist approach).

```typescript
// ✅ CORRECT - Only allows specific values
export const opportunitySchema = z.object({
  stage: z.enum(['new_lead', 'contacted', 'qualified', 'closed_won', 'closed_lost']),
  priority: z.enum(['low', 'medium', 'high']),
})

// ❌ WRONG - Regex denylist (can be bypassed)
export const opportunitySchema = z.object({
  stage: z.string().regex(/^[a-z_]+$/), // Allows any snake_case string!
})
```

## Strict vs Passthrough

### Create Schema (Strict)
```typescript
// Reject unknown fields at API boundary
export const contactCreateSchema = contactSchema.strict()
```

### Update Schema (Passthrough)
```typescript
// Allow metadata fields (id, created_at, updated_at) but strip computed fields
export const contactUpdateSchema = contactSchema.passthrough()
// Computed fields stripped by withLifecycleCallbacks in provider
```

## Validation Quick Reference

| Situation | DO | DON'T |
|-----------|-----|-------|
| **String fields** | `.max(100)` on ALL strings | No length limit |
| **API boundary objects** | `z.strictObject()` | `z.object()` (allows unknown keys) |
| **Form number inputs** | `z.coerce.number()` | `z.number()` (fails on string "42") |
| **Form date inputs** | `z.coerce.date()` | `z.date()` (fails on ISO strings) |
| **Constrained values** | `z.enum(['a','b'])` (allowlist) | Regex denylist |

## Cross-References

- Full patterns: `.claude/rules/DOMAIN_INTEGRITY.md`
- Data integrity guards: `.claude/skills/data-integrity-guards/`
- Type inference: See `type-safety.md`
