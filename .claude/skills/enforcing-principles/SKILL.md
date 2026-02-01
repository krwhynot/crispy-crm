---
name: enforcing-principles
description: Use when implementing features, handling errors, adding validation, creating forms, writing database migrations. Enforces fail-fast (NO retry logic, circuit breakers), single entry point (unified data provider, Zod at API boundary), form defaults from schema (zodSchema.partial().parse), TypeScript (interface vs type), React Admin patterns. NEW (2024-12): Zod security (z.strictObject, string .max() limits, z.coerce for forms, z.enum allowlist), form performance (onSubmit/onBlur mode, useWatch not watch). BLOCKS anti-patterns, SUGGESTS best practices.
---

# Atomic CRM Engineering Constitution

## Overview

Enforce Atomic CRM's Engineering Constitution principles to prevent over-engineering and maintain codebase velocity. Most critical: **fail fast** (no retry logic/circuit breakers) and **single composable entry point** (unified data provider delegating to resource modules, Zod validation at API boundary).

**Core principle:** Pre-launch phase prioritizes velocity over resilience. Simple solutions over clever ones.

## When to Use

Use this skill when:
- Handling errors or adding resilience
- Adding validation or data transforms
- Creating forms with default values
- Defining TypeScript types
- Editing existing files
- Creating database migrations

Do NOT use for:
- Reading documentation
- Analyzing existing code
- Non-implementation tasks

## Pre-Implementation Checklist

**Before writing code, verify:**

- [ ] Read `.claude/engineering-constitution.md` if unsure about any principle
- [ ] Error handling: Am I adding retry logic? (NO - fail fast)
- [ ] Validation: Am I validating outside Zod schemas? (NO - API boundary only)
- [ ] Form defaults: Am I hardcoding in component? (NO - use `zodSchema.partial().parse({})`)
- [ ] TypeScript: Using `interface` for objects, `type` for unions?
- [ ] Editing file: Am I fixing nearby issues? (YES - Boy Scout Rule)

## Critical Rules

### 1. NO OVER-ENGINEERING (Most Violated)

**Rule:** No circuit breakers, retry logic, or graceful fallbacks. Fail fast.

**Context:** Pre-launch phase = velocity over resilience. We want **loud failures**, not silent degradation.

**❌ FORBIDDEN PATTERNS:**
```typescript
// ❌ Circuit breaker
class CircuitBreaker {
  state: 'OPEN' | 'CLOSED' | 'HALF-OPEN'
}

// ❌ Retry logic with exponential backoff
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    return await operation()
  } catch (error) {
    await sleep(Math.pow(2, i) * 100)
  }
}

// ❌ Graceful fallbacks
try {
  return await fetchData()
} catch {
  return cachedData // Silent degradation
}

// ❌ Health monitoring
if (failureCount > threshold) {
  activateCircuitBreaker()
}
```

**✅ CORRECT PATTERN:**
```typescript
// ✅ Let it throw - operator sees error immediately
const data = await supabase.from('contacts').select()
// If 429 error occurs, it throws
// Operator investigates and fixes at source
```

**Why Fail Fast:**
- Complex error handling = maintenance burden
- No users yet = no one benefits from resilience
- Loud failures = immediate investigation
- Silent degradation = hidden problems

**Common Rationalizations to REJECT:**
- "This is for production" → We're **pre-launch**, velocity matters more
- "It needs to be resilient" → Resilience = fail loud, not graceful degradation
- "Users will see errors" → **No users yet**, operators need to see errors
- "Industry best practice" → Context matters, pre-launch has different needs

### 2. SINGLE COMPOSABLE ENTRY POINT

**Rule:** Have a single, composable entry point for data access (`unifiedDataProvider`), delegating to resource-specific modules. Validation via Zod schemas at API boundary (`src/atomic-crm/validation/`) ONLY.

**❌ WRONG - Multiple Competing Entry Points:**
```typescript
// ❌ Direct API calls bypassing provider
import { contactsApi } from './contactsApi'
await contactsApi.updateContact(id, data)

// ❌ Validation in component
const isValidEmail = (email: string) => /@/.test(email)

// ❌ Which is authoritative? Now two+ definitions can diverge!
```

**✅ CORRECT - Unified Entry Point with Delegation:**
```typescript
// Always use the unified provider
import { dataProvider } from '@/atomic-crm/providers/supabase/unifiedDataProvider'
await dataProvider.update('contacts', { id, data })
// Provider internally delegates to contacts-specific logic

// Validation: Zod at API boundary only
import { contactSchema } from '@/atomic-crm/validation/contacts'
```

**Key Insight:** This is the **Composite pattern** - one facade for the app to talk to, with resource-specific modules handling implementation details.

### 3. FORM STATE DERIVED FROM TRUTH

**Rule:** React Hook Form `defaultValues` MUST use `zodSchema.partial().parse({})`.

**❌ WRONG - Hardcoded Defaults:**
```typescript
// ❌ Hardcoded in component
const form = useForm({
  defaultValues: {
    stage: 'new_lead', // Out of sync with schema!
    priority: 'medium',
  }
})

// ❌ Using defaultValue prop
<SelectInput source="stage" defaultValue="new_lead" />
```

**✅ CORRECT - Schema-Derived Defaults:**
```typescript
// 1. Define defaults in Zod schema
export const opportunitySchema = z.object({
  stage: z.string().default('new_lead'),
  priority: z.string().default('medium'),
})

// 2. Extract defaults in component
const schemaDefaults = opportunitySchema.partial().parse({})
const form = useForm({
  defaultValues: {
    ...schemaDefaults,
    owner_id: identity.id, // Runtime values merged
  }
})

// 3. NO defaultValue props on inputs
<SelectInput source="stage" /> // Uses form default
```

**Why:** Prevents drift between validation and UI.

### 3b. Zod Security Patterns

> Canonical reference: `.claude/rules/DOMAIN_INTEGRITY.md` (always loaded)
> Key rules: `.strict()` for creates, `.passthrough()` for updates, `.max()` on strings, `z.coerce` for forms, `z.enum()` for allowlists.

### 4. BOY SCOUT RULE

**Rule:** Fix inconsistencies when editing files. Leave code better than you found it.

**Examples:**
- See unused import? Delete it
- See inconsistent spacing? Fix it
- See missing type? Add it
- See hardcoded value? Extract to constant

**Scope:** Only fix issues in files you're editing. Don't go on refactoring sprees.

### 5. TYPESCRIPT CONVENTIONS

**Rule:** `interface` for objects/classes, `type` for unions/intersections.

```typescript
// ✅ Interfaces for object shapes
interface Contact {
  id: string
  first_name: string
}

// ✅ Types for unions
type Status = 'active' | 'inactive'

// ✅ Types for intersections
type ContactWithMeta = Contact & { created_at: string }
```

**Exception:** Zod-derived types always use `type` since `z.infer` produces type aliases, not interfaces. This is the canonical pattern per DOMAIN_INTEGRITY.md: `export type Contact = z.infer<typeof contactSchema>`.

### 6. FORMS - USE REACT ADMIN COMPONENTS

**Rule:** Always use admin layer (`src/components/admin/`) for forms.

```typescript
// ✅ React Admin components
import { TextInput, SelectInput } from 'react-admin'

// ❌ Raw HTML
<input type="text" />
```

### 7. COLORS - SEMANTIC VARIABLES ONLY

> Color rules: See `.claude/rules/UI_STANDARDS.md` (always loaded). Use semantic Tailwind classes only.

### 8. MIGRATIONS - TIMESTAMP FORMAT

**Rule:** Use Supabase CLI to generate correctly timestamped migrations.

```bash
# ✅ Correct
npx supabase migration new add_contact_tags
# Generates: 20250126143000_add_contact_tags.sql

# ❌ Don't manually create
# 001_add_contact_tags.sql
```

### 9. TAILWIND V4 CSS PATTERNS

**9a. No @apply Self-Reference**

**Rule:** Custom utilities in `@layer utilities` cannot `@apply` other custom utilities from the same layer.

**Why:** Tailwind v4 JIT processes utilities independently; self-references create circular dependencies.

**❌ WRONG — fails in Tailwind v4:**
```css
@layer utilities {
  .touch-target-44 { /* ... */ }
  .data-cell {
    @apply touch-target-44; /* ERROR: Cannot resolve */
  }
}
```

**✅ CORRECT — inline the styles:**
```css
@layer utilities {
  .data-cell {
    position: relative;
    /* Inline the touch-target styles directly */
  }
  .data-cell::before {
    content: '';
    position: absolute;
    top: calc((44px - 100%) / -2);
    /* ... */
  }
}
```

**9b. Touch Expansion via calc()**

**Rule:** Use `calc((TARGET - 100%) / -2)` to center-expand touch targets.

**Why:** `100%` references parent height; dividing by `-2` distributes expansion equally top/bottom.

**Pattern:**
```css
.touch-target-44::before {
  top: calc((44px - 100%) / -2);    /* Expand upward */
  bottom: calc((44px - 100%) / -2); /* Expand downward */
}
/* Result: 32px element → 44px touch area (6px each direction) */
```

**9c. CSS Custom Properties for Typography Tokens**

**Rule:** Define font tokens as CSS custom properties, not Tailwind theme extensions.

**Why:** Tailwind v4 JIT only bundles used utilities; custom properties are always available.

**Pattern:**
```css
:root {
  --text-table: 0.8125rem;
  --text-table--line-height: 1.35;
}
/* Usage: text-[length:var(--text-table)] leading-[var(--text-table--line-height)] */
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "Add retry logic for production" | NO. Fail fast. Pre-launch = velocity over resilience. |
| "Circuit breaker for resilience" | NO. Let errors throw. Investigate and fix at source. |
| Validation in component/utils | Move to Zod schema in `src/atomic-crm/validation/` |
| Hardcoded form defaults | Use `zodSchema.partial().parse({})` |
| `type` for object shapes | Use `interface` for objects |
| Raw `<input>` elements | Use React Admin's `<TextInput>` |
| Leaving unused imports | Fix when editing file (Boy Scout Rule) |

## Implementation Workflow

**1. Check Context**
- Pre-launch = velocity over resilience
- Fail fast over graceful degradation
- Simple over clever

**2. Verify Patterns**
- Error handling: Let it throw
- Validation: Zod at API boundary only
- Forms: Defaults from schema
- Types: `interface` for objects

**3. Boy Scout Rule**
- Fix issues in files you edit
- Don't go on tangential refactors

**4. Commit**
- Verify no retry/circuit breaker code
- Verify no validation outside Zod
- Verify form defaults from schema

## Red Flags - STOP and Review

If you find yourself:
- Writing retry logic → Delete it, let errors throw
- Adding circuit breaker → Delete it, fail fast
- Creating "resilient" error handling → Pre-launch doesn't need it
- Validating outside Zod schemas → Move to API boundary
- Hardcoding form defaults → Use schema.partial().parse({})
- Using `<input>` directly → Use React Admin components
- Ignoring nearby issues → Fix them (Boy Scout Rule)

**All of these mean:** Review Engineering Constitution before proceeding.

## Real-World Impact

**Following Constitution:**
- Fast feature velocity (no over-engineering)
- Loud failures = quick fixes
- Consistent data access (single composable entry point)
- No drift between UI and validation
- Clean codebase (Boy Scout Rule)

**Violating Constitution:**
- 3,000+ lines of retry/circuit breaker code
- Hidden failures (silent degradation)
- Multiple competing data access paths (bypassing unified provider)
- Form defaults out of sync
- Technical debt accumulation

## Quick Reference Cards

### Error Handling

| Situation | DO | DON'T |
|-----------|-----|-------|
| Database error | Let it throw | Retry logic |
| Bulk mutations | `Promise.allSettled()` | `Promise.all()` |
| Parallel reads | `Promise.all()` | Sequential awaits |
| Validation error | Format for React Admin | Silent failure |
| User notification | Show specific message | Generic "Error" |

### Validation

| Situation | DO | DON'T |
|-----------|-----|-------|
| Where to validate | `src/atomic-crm/validation/` | Component/utils |
| Business defaults | `.default()` in Zod | Hardcode in component |
| Type inference | `z.infer<typeof schema>` | Manual type definition |
| Error format | `{ message, errors: {} }` | Throw raw Zod error |
| **String fields** | `.max(100)` on ALL strings | No length limit |
| **API boundary objects** | `z.strictObject()` | `z.object()` (allows unknown keys) |
| **Form number inputs** | `z.coerce.number()` | `z.number()` (fails on string "42") |
| **Form date inputs** | `z.coerce.date()` | `z.date()` (fails on ISO strings) |
| **Constrained values** | `z.enum(['a','b'])` (allowlist) | Regex denylist |

### Form State

| Situation | DO | DON'T |
|-----------|-----|-------|
| Form defaults | `schema.partial().parse({})` | Hardcode in component |
| Array defaults | Sub-schema with `.default()` | `defaultValue` prop |
| JSONB arrays | `ArrayInput` + `SimpleFormIterator` | Manual array state |
| Submit transform | `transform` prop on CreateBase | Transform in component |
| **RHF + resolver** | `createFormResolver(schema)` ONLY | Mix resolver + `register` validation |

> Form mode rules: See `.claude/rules/MODULE_CHECKLIST.md` (always loaded). Use `onSubmit`/`onBlur`, never `onChange`. Use `useWatch()`, not `watch()`.

### Database

| Situation | DO | DON'T |
|-----------|-----|-------|
| New table | GRANT + RLS | RLS only |
| Role check | Helper function (`is_admin()`) | Inline check |
| Enum values | Add only (can't remove) | Try to remove |
| Migrations | `npx supabase migration new` | Manual numbering |

### CSS/Tailwind v4

| Situation | DO | DON'T |
|-----------|-----|-------|
| Custom utility needs other utility | Inline the styles directly | `@apply other-utility` |
| Touch target expansion | `calc((44px - 100%) / -2)` | Fixed pixel offsets |
| Typography tokens | CSS custom properties | Tailwind theme extension |
| Arbitrary values | `text-[length:var(--token)]` | Hardcoded sizes |

## Decision Tree: When This Skill Triggers

```
Starting implementation task?
│
├─ Handling errors?
│  └─ error-handling.md → Fail fast, Promise.allSettled, structured logging
│
├─ Adding validation?
│  └─ validation.md → Zod at API boundary, schemas, arrays, transforms
│     anti-patterns.md → Avoid multiple sources
│
├─ Creating forms?
│  └─ forms.md → Defaults from schema, arrays, tabs, conditional fields
│     anti-patterns.md → Avoid hardcoded defaults
│
├─ Database changes?
│  └─ database.md → GRANT + RLS, migrations, roles, triggers, views
│     anti-patterns.md → Avoid common DB mistakes
│
├─ Security concerns?
│  └─ security.md → CSV validation, SQL injection, XSS, RLS
│
├─ Writing tests?
│  └─ testing.md → Vitest, Playwright, mocking, database testing
│     anti-patterns.md → Avoid testing implementation details
│
└─ Unsure what to do?
   └─ anti-patterns.md → Over-engineering, validation, database, testing
```

## Resource Files

Comprehensive patterns with real code examples from Atomic CRM:

- [error-handling.md](resources/error-handling.md) - Fail-fast patterns, Promise.allSettled, structured logging, error formatting
- [validation.md](resources/validation.md) - Zod at API boundary, schemas, JSONB arrays, transforms, imports
- [forms.md](resources/forms.md) - Schema-derived defaults, ArrayInput, tabbed forms, conditional fields
- [database.md](resources/database.md) - GRANT + RLS, migrations, roles, triggers, JSONB, views, indexes
- [security.md](resources/security.md) - CSV validation, SQL injection, XSS prevention, RLS authentication
- [testing.md](resources/testing.md) - Vitest unit tests, Playwright E2E, mocking, database testing
- [anti-patterns.md](resources/anti-patterns.md) - Engineering, validation, database, and testing anti-patterns

## Constitution Principles Summary

1. **NO OVER-ENGINEERING** - Fail fast, no retry/circuit breakers
2. **SINGLE COMPOSABLE ENTRY POINT** - Unified data provider delegating to resource modules, Zod at API boundary
3. **BOY SCOUT RULE** - Fix issues in files you edit
4. **VALIDATION** - API boundary only (`src/atomic-crm/validation/`)
5. **FORM STATE** - Derived from Zod schema (`.partial().parse({})`)
6. **TYPESCRIPT** - `interface` for objects, `type` for unions
7. **FORMS** - React Admin components only
8. **COLORS** - Semantic CSS variables only
9. **MIGRATIONS** - Timestamp format via Supabase CLI

### Zod Validation Rules (10-13)

> See `.claude/rules/DOMAIN_INTEGRITY.md` (always loaded) for full Zod security patterns.

### Form Performance Rules (14-16)

> See `.claude/rules/MODULE_CHECKLIST.md` (always loaded) for form mode and watch rules.
> Resolver rule: Use `createFormResolver(schema)` from `@/lib/zodErrorFormatting` exclusively.

### Tailwind v4 CSS Rules (NEW)

17. **NO @APPLY SELF-REFERENCE** - Custom utilities cannot `@apply` other custom utilities from same layer
18. **TOUCH EXPANSION VIA CALC()** - Use `calc((44px - 100%) / -2)` for centered touch expansion
19. **CSS CUSTOM PROPERTIES** - Define typography tokens as CSS vars, not Tailwind theme extensions

**Full details:** `docs/claude/engineering-constitution.md`

**Cross-Reference:** See `atomic-crm-ui-design` skill for UI design patterns (colors, spacing, accessibility)
