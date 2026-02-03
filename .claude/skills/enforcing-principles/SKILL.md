---
name: enforcing-principles
description: Use when implementing features, handling errors, adding validation, creating forms, writing database migrations. Enforces fail-fast (NO retry logic, circuit breakers), single entry point (unified data provider, Zod at API boundary), form defaults from schema (zodSchema.partial().parse), TypeScript (interface vs type), React Admin patterns. NEW (2024-12): Zod security (z.strictObject, string .max() limits, z.coerce for forms, z.enum allowlist), form performance (onSubmit/onBlur mode, useWatch not watch). BLOCKS anti-patterns, SUGGESTS best practices.
---

# Atomic CRM Engineering Constitution

Enforce Atomic CRM's Engineering Constitution principles to prevent over-engineering and maintain codebase velocity. Most critical: **fail fast** (no retry logic/circuit breakers) and **single composable entry point** (unified data provider delegating to resource modules, Zod validation at API boundary).

**Core principle:** Pre-launch phase prioritizes velocity over resilience. Simple solutions over clever ones.

## When to Use

Use this skill when:
- Handling errors or adding resilience
- Adding validation or data transforms
- Creating forms with default values
- Defining TypeScript types or validating component props
- Editing existing files
- Creating database migrations

## Constitution Principles (Quick Reference)

Based on your task, I'll reference the appropriate pattern guide:

### 1. Error Handling & Resilience
**Pattern:** Fail fast - NO retry logic, circuit breakers, or graceful fallbacks.

**See:** [references/banned-patterns.md](references/banned-patterns.md) - Why fail fast, common rationalizations to reject

### 2. Validation & Type Safety
**Pattern:** Zod schemas at API boundary only (`src/atomic-crm/validation/`). Type inference from schemas.

**See:**
- [references/zod-patterns.md](references/zod-patterns.md) - Security patterns (`.strict()`, `.max()`, `z.coerce`, `z.enum`)
- [references/type-safety.md](references/type-safety.md) - `interface` vs `type`, Zod type inference, zero `: any`

### 3. Form Patterns
**Pattern:** React Hook Form `defaultValues` from `zodSchema.partial().parse({})`. Never hardcode defaults.

**See:** [references/form-defaults.md](references/form-defaults.md) - Schema-derived defaults, array defaults, form mode rules

### 4. Component Props Validation
**Pattern:** Zod schemas for high-churn components (SlideOvers, QuickLogForm, Lists).

**See:** [references/props-validation.md](references/props-validation.md) - When to use, core schemas, usage patterns

### 5. Anti-Patterns to Avoid
**See:** [references/banned-patterns.md](references/banned-patterns.md) - Over-engineering, multiple entry points, hardcoded defaults, raw inputs, hardcoded colors, manual migrations, Tailwind v4 anti-patterns

## Pre-Implementation Checklist

**Before writing code, verify:**

- [ ] Error handling: Am I adding retry logic? (NO - fail fast)
- [ ] Validation: Am I validating outside Zod schemas? (NO - API boundary only)
- [ ] Form defaults: Am I hardcoding in component? (NO - use `zodSchema.partial().parse({})`)
- [ ] TypeScript: Using `interface` for objects, `type` for unions?
- [ ] Props: High-churn component needs Zod props schema? (SlideOvers, Forms, Lists)
- [ ] Editing file: Am I fixing nearby issues? (YES - Boy Scout Rule)

## Quick Decision Tree

```
Starting implementation task?
│
├─ Handling errors?
│  └─ banned-patterns.md → Fail fast, no retry/circuit breakers
│
├─ Adding validation?
│  └─ zod-patterns.md → Zod at API boundary, security patterns
│     type-safety.md → Type inference, interface vs type
│
├─ Creating forms?
│  └─ form-defaults.md → Defaults from schema, arrays, form mode
│
├─ High-churn component props?
│  └─ props-validation.md → SlideOver/Form props schemas
│
└─ Unsure what to do?
   └─ banned-patterns.md → Common mistakes, red flags
```

## Core Rules Summary

1. **NO OVER-ENGINEERING** - Fail fast, no retry/circuit breakers (pre-launch velocity)
2. **SINGLE ENTRY POINT** - Unified data provider, Zod at API boundary
3. **FORM STATE FROM SCHEMA** - `zodSchema.partial().parse({})` for defaults
4. **BOY SCOUT RULE** - Fix issues in files you edit
5. **TYPE CONVENTIONS** - `interface` for objects, `type` for unions (except Zod types)
6. **ZOD SECURITY** - `.strict()` for creates, `.max()` on strings, `z.coerce` for forms, `z.enum()` for allowlists
7. **REACT ADMIN COMPONENTS** - Never raw `<input>` elements
8. **SEMANTIC COLORS** - Use CSS variables, not hex codes
9. **MIGRATIONS VIA CLI** - `npx supabase migration new` for timestamp format

## Red Flags - STOP and Review

If you find yourself:
- Writing retry logic → Delete it, let errors throw
- Adding circuit breaker → Delete it, fail fast
- Validating outside Zod schemas → Move to API boundary
- Hardcoding form defaults → Use schema.partial().parse({})
- Using `<input>` directly → Use React Admin components
- Using `: any` type → Use proper types or `unknown` with guards

**All of these mean:** Review reference docs before proceeding.

## Resource Files (Detailed Patterns)

Comprehensive patterns with real code examples:

- [banned-patterns.md](references/banned-patterns.md) - Over-engineering, anti-patterns, red flags
- [zod-patterns.md](references/zod-patterns.md) - Security patterns, validation rules
- [form-defaults.md](references/form-defaults.md) - Schema-derived defaults, array patterns
- [type-safety.md](references/type-safety.md) - TypeScript conventions, type inference
- [props-validation.md](references/props-validation.md) - Component props schemas

**Legacy resources** (pre-progressive disclosure):
- [resources/error-handling.md](resources/error-handling.md) - Fail-fast patterns, Promise.allSettled
- [resources/validation.md](resources/validation.md) - Zod comprehensive guide
- [resources/forms.md](resources/forms.md) - React Hook Form patterns
- [resources/database.md](resources/database.md) - Migrations, RLS, JSONB
- [resources/security.md](resources/security.md) - CSV validation, SQL injection, XSS
- [resources/testing.md](resources/testing.md) - Vitest, Playwright, mocking
- [resources/anti-patterns.md](resources/anti-patterns.md) - Engineering anti-patterns

## Cross-References

- Full constitution: `.claude/engineering-constitution.md`
- Domain integrity: `.claude/rules/DOMAIN_INTEGRITY.md` (always loaded)
- Module checklist: `.claude/rules/MODULE_CHECKLIST.md` (always loaded)
- Code quality: `.claude/rules/CODE_QUALITY.md` (always loaded)
- UI standards: `.claude/rules/UI_STANDARDS.md` (always loaded)

---

**Implementation:** I'll load the relevant reference based on your specific task and apply its patterns.
