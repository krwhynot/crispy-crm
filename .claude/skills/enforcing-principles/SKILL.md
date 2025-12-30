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

### 3b. ZOD SECURITY PATTERNS (OWASP Compliant)

**Rule:** All Zod schemas at API boundary must follow security best practices.

**String Length Limits (Prevent DoS):**
```typescript
// ✅ CORRECT: Always set max length
const schema = z.object({
  name: z.string().max(100),           // Names
  title: z.string().max(200),          // Titles/labels
  description: z.string().max(2000),   // Long text
  url: z.string().url().max(2048),     // URLs (browser limit)
});

// ❌ WRONG: No length limit = DoS vulnerability
const schema = z.object({
  name: z.string(), // Attacker can send 10MB string
});
```

**Strict Objects at API Boundary (Prevent Mass Assignment):**
```typescript
// ✅ CORRECT: Reject unknown keys at API boundary
export const createContactSchema = z.strictObject({
  name: z.string().max(100),
  email: z.string().email(),
}); // Unknown keys throw error

// ⚠️ INTERNAL ONLY: z.object() for composition/partial updates
const contactBaseSchema = z.object({
  name: z.string().max(100),
}); // Can extend, allows unknown keys
```

**Coercion for Form Inputs:**
```typescript
// ✅ CORRECT: HTML inputs return strings, coerce to type
const schema = z.object({
  age: z.coerce.number().min(0).max(150),
  price: z.coerce.number().positive(),
  isActive: z.coerce.boolean(),
  dueDate: z.coerce.date(),
});

// ❌ WRONG: Will fail on form input "42" (string, not number)
const schema = z.object({
  age: z.number(), // z.number().parse("42") throws!
});
```

**Allowlist Validation (OWASP):**
```typescript
// ✅ CORRECT: Allowlist with z.enum()
const stageSchema = z.enum(['new_lead', 'closed_won', 'closed_lost']);
const roleSchema = z.enum(['admin', 'manager', 'rep']);

// ❌ WRONG: Denylist (easily bypassed)
const badSchema = z.string().refine(
  (val) => !val.includes('<script>'), // Attacker uses <SCRIPT>
  'Invalid input'
);
```

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

### 6. FORMS - USE REACT ADMIN COMPONENTS

**Rule:** Always use admin layer (`src/components/admin/`) for forms.

```typescript
// ✅ React Admin components
import { TextInput, SelectInput } from 'react-admin'

// ❌ Raw HTML
<input type="text" />
```

### 7. COLORS - SEMANTIC VARIABLES ONLY

**Rule:** Use semantic CSS variables, never hex codes or direct OKLCH.

```css
/* ✅ Semantic tokens */
color: var(--primary);
background: var(--brand-700);

/* ❌ Hex codes */
color: #7CB342;

/* ❌ Direct OKLCH */
color: oklch(65% 0.15 125);
```

**Note:** See `atomic-crm-ui-design` skill for complete color system guidance.

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
| Bulk operations | `Promise.allSettled()` | `Promise.all()` |
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
| **Validation mode** | `mode: 'onSubmit'` or `'onBlur'` | `mode: 'onChange'` (perf issue) |
| **Watch values** | `useWatch({ control, name })` | `watch()` (re-renders whole form) |
| **RHF + resolver** | `zodResolver(schema)` ONLY | Mix resolver + `register` validation |

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
│  └─ error-handling-basics.md → Fail fast (no retry)
│     error-handling-bulk.md → Promise.allSettled for bulk
│     error-handling-validation.md → Structured logging
│
├─ Adding validation?
│  └─ validation-basics.md → Zod at API boundary, core patterns
│     validation-arrays.md → JSONB arrays, sub-schemas
│     validation-schemas.md → Create/Update schemas
│     validation-advanced.md → Custom validators, transform
│     anti-patterns-validation.md → Avoid multiple sources
│
├─ Creating forms?
│  └─ form-defaults.md → Defaults from schema
│     form-arrays.md → JSONB array inputs
│     form-patterns.md → Tabbed forms, submission
│     form-advanced.md → Reset, debugging, conditional
│     anti-patterns-validation.md → Avoid hardcoded defaults
│
├─ Database changes?
│  └─ database-security.md → GRANT + RLS (two-layer)
│     database-migrations.md → Migration structure, enums
│     database-roles.md → Role-based permissions
│     database-advanced.md → Triggers, JSONB, views
│     database-reference.md → Decision tree, best practices
│     anti-patterns-database.md → Avoid common DB mistakes
│
├─ Security concerns?
│  └─ security-csv.md → CSV upload, formula injection
│     security-sql.md → SQL injection prevention
│     security-rls.md → RLS policies, authentication
│     security-xss.md → XSS prevention, URL validation
│
├─ Writing tests?
│  └─ testing-unit.md → Vitest, validation, components
│     testing-e2e.md → Playwright, critical journeys
│     testing-reference.md → Coverage, organization
│     anti-patterns-testing.md → Avoid testing implementation
│
└─ Unsure what to do?
   └─ anti-patterns-engineering.md → Avoid over-engineering
      error-handling-reference.md → Decision tree & rationalizations
```

## Resource Files

Comprehensive patterns with real code examples from Atomic CRM:

### Error Handling
- [error-handling-basics.md](resources/error-handling-basics.md) - Fail-fast core patterns, forbidden retry/circuit breaker
- [error-handling-bulk.md](resources/error-handling-bulk.md) - Promise.allSettled for bulk operations
- [error-handling-validation.md](resources/error-handling-validation.md) - Structured logging, Zod error formatting
- [error-handling-reference.md](resources/error-handling-reference.md) - Decision tree, rationalizations, testing

### Validation (Split for Focus)
- [validation-basics.md](resources/validation-basics.md) - Core principles, basic schema, enum schemas
- [validation-arrays.md](resources/validation-arrays.md) - JSONB arrays, sub-schemas, superRefine
- [validation-schemas.md](resources/validation-schemas.md) - Create/Update schemas, error formatting
- [validation-advanced.md](resources/validation-advanced.md) - Custom validators, transform, import schemas

### Form State Management (Split for Focus)
- [form-defaults.md](resources/form-defaults.md) - Core principle, defaults from schema
- [form-arrays.md](resources/form-arrays.md) - JSONB array inputs, SimpleFormIterator
- [form-patterns.md](resources/form-patterns.md) - Tabbed forms, submission, error display
- [form-advanced.md](resources/form-advanced.md) - Reset, debugging, conditional fields

### Database (Split for Focus)
- [database-security.md](resources/database-security.md) - GRANT + RLS two-layer security
- [database-migrations.md](resources/database-migrations.md) - Migration structure, enum types
- [database-roles.md](resources/database-roles.md) - Role-based permissions, helper functions
- [database-advanced.md](resources/database-advanced.md) - Triggers, JSONB, indexes, views
- [database-reference.md](resources/database-reference.md) - Decision tree, best practices

### Security (Split for Focus)
- [security-csv.md](resources/security-csv.md) - CSV upload validation, formula injection, binary detection
- [security-sql.md](resources/security-sql.md) - SQL injection prevention, parameterized queries
- [security-rls.md](resources/security-rls.md) - RLS policies, authentication, role-based access
- [security-xss.md](resources/security-xss.md) - XSS prevention, URL validation, React escaping

### Testing (Split for Focus)
- [testing-unit.md](resources/testing-unit.md) - Vitest, validation testing, component testing, mocking
- [testing-e2e.md](resources/testing-e2e.md) - Playwright, critical journeys, accessibility
- [testing-reference.md](resources/testing-reference.md) - Coverage, organization, database testing

### Anti-Patterns (Split by Domain)
- [anti-patterns-engineering.md](resources/anti-patterns-engineering.md) - Over-engineering, circuit breakers, Promise.all
- [anti-patterns-validation.md](resources/anti-patterns-validation.md) - Multiple validation sources, form defaults
- [anti-patterns-database.md](resources/anti-patterns-database.md) - RLS/GRANT, enums, migration verification
- [anti-patterns-testing.md](resources/anti-patterns-testing.md) - Testing implementation details, error context

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

### Zod Validation Rules (NEW - OWASP Compliant)

10. **STRING LIMITS** - All strings must have `.max()` constraint (100/200/2000 chars)
11. **STRICT OBJECTS** - Use `z.strictObject()` at API boundary (prevents mass assignment)
12. **COERCION** - Use `z.coerce` for all non-string form inputs (number, date, boolean)
13. **ALLOWLIST** - Use `z.enum()` for constrained values (never denylist regex)

### Form Performance Rules (NEW)

14. **VALIDATION MODE** - Use `onSubmit` or `onBlur` mode (never `onChange`)
15. **WATCH ISOLATION** - Use `useWatch()` for subscriptions (not `watch()`)
16. **RESOLVER ONLY** - Use `zodResolver(schema)` exclusively (don't mix with `register` validation)

### Tailwind v4 CSS Rules (NEW)

17. **NO @APPLY SELF-REFERENCE** - Custom utilities cannot `@apply` other custom utilities from same layer
18. **TOUCH EXPANSION VIA CALC()** - Use `calc((44px - 100%) / -2)` for centered touch expansion
19. **CSS CUSTOM PROPERTIES** - Define typography tokens as CSS vars, not Tailwind theme extensions

**Full details:** `docs/claude/engineering-constitution.md`

**Cross-Reference:** See `atomic-crm-ui-design` skill for UI design patterns (colors, spacing, accessibility)
