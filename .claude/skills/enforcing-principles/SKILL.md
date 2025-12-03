---
name: enforcing-principles
description: Use when implementing features, handling errors, adding validation, creating forms, writing database migrations. Enforces fail-fast (NO retry logic, circuit breakers, exponential backoff), single entry point (unified data provider, Zod at API boundary), form defaults from schema (zodSchema.partial().parse), TypeScript (interface vs type), React Admin patterns. BLOCKS anti-patterns (CircuitBreaker, maxRetries), SUGGESTS best practices.
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

### Form State

| Situation | DO | DON'T |
|-----------|-----|-------|
| Form defaults | `schema.partial().parse({})` | Hardcode in component |
| Array defaults | Sub-schema with `.default()` | `defaultValue` prop |
| JSONB arrays | `ArrayInput` + `SimpleFormIterator` | Manual array state |
| Submit transform | `transform` prop on CreateBase | Transform in component |

### Database

| Situation | DO | DON'T |
|-----------|-----|-------|
| New table | GRANT + RLS | RLS only |
| Role check | Helper function (`is_admin()`) | Inline check |
| Enum values | Add only (can't remove) | Try to remove |
| Migrations | `npx supabase migration new` | Manual numbering |

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
│  └─ validation-patterns.md → Zod at API boundary only
│     anti-patterns-validation.md → Avoid multiple sources
│
├─ Creating forms?
│  └─ form-state-management.md → Defaults from schema
│     anti-patterns-validation.md → Avoid hardcoded defaults
│
├─ Database changes?
│  └─ database-patterns.md → GRANT + RLS, migrations
│     anti-patterns-database.md → Avoid common DB mistakes
│
├─ Security concerns?
│  └─ security-patterns.md → CSV validation, RLS policies
│
├─ Writing tests?
│  └─ testing-patterns.md → Unit/E2E patterns
│     anti-patterns-testing.md → Avoid testing implementation
│
└─ Unsure what to do?
   └─ anti-patterns-engineering.md → Avoid over-engineering
      error-handling-reference.md → Decision tree & rationalizations
```

## Resource Files

Comprehensive patterns with real code examples from Atomic CRM:

### Error Handling (Split for Focus)
- [error-handling-basics.md](resources/error-handling-basics.md) - Fail-fast core patterns, forbidden retry/circuit breaker
- [error-handling-bulk.md](resources/error-handling-bulk.md) - Promise.allSettled for bulk operations
- [error-handling-validation.md](resources/error-handling-validation.md) - Structured logging, Zod error formatting
- [error-handling-reference.md](resources/error-handling-reference.md) - Decision tree, rationalizations, testing

### Core Patterns
- [validation-patterns.md](resources/validation-patterns.md) - Zod schemas, centralized validation, error formatting
- [form-state-management.md](resources/form-state-management.md) - Schema-driven forms, ArrayInput, defaults
- [database-patterns.md](resources/database-patterns.md) - GRANT + RLS, migrations, helper functions

### Security & Testing
- [security-patterns.md](resources/security-patterns.md) - CSV validation, formula injection, RLS policies
- [testing-patterns.md](resources/testing-patterns.md) - Unit tests, E2E tests, coverage requirements

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

**Full details:** `docs/claude/engineering-constitution.md`

**Cross-Reference:** See `atomic-crm-ui-design` skill for UI design patterns (colors, spacing, accessibility)
