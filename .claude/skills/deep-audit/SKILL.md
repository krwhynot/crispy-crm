---
name: deep-audit
description: Comprehensive full-stack codebase audit for Crispy CRM. Triggers on audit, deep audit, codebase review, quality check, after refactoring, new feature complete. Phased approach (Critical > Improvements > Polish). Integrates engineering-constitution and ui-ux-design-principles skills. Generates markdown report and auto-creates todos.
---

# Deep Audit Skill

## Purpose

Perform comprehensive, phased audits of the Crispy CRM codebase covering security, data integrity, code quality, UI/UX compliance, performance, testing, and documentation.

## When to Use

**Explicit triggers:**
- "audit", "deep audit", "codebase audit"
- "quality check", "code review"
- "/audit" command

**Implicit triggers:**
- After completing new features
- After significant refactoring
- Before major releases
- When onboarding to unfamiliar code areas

## Audit Workflow

### Phased Approach (Full Report First)

Complete ALL phases before presenting findings. Do not pause between phases.

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: CRITICAL                                          │
│  Security + Data Integrity + Runtime Errors                 │
│  ───────────────────────────────────────────────────────── │
│  PHASE 2: IMPROVEMENTS                                      │
│  Code Quality + UI/UX + Performance                         │
│  ───────────────────────────────────────────────────────── │
│  PHASE 3: POLISH                                            │
│  Tests + Documentation + Developer Experience               │
└─────────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────────────────┐
              │  CONSOLIDATED REPORT  │
              │ docs/archive/audits/  │
              └───────────────────────┘
                          ↓
              ┌───────────────────────┐
              │  AUTO-CREATE TODOS    │
              │  All actionable items │
              └───────────────────────┘
```

---

## Phase 1: Critical Issues

**Priority:** MUST fix before shipping

### 1.1 Security Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| RLS Policies | Missing policies on tables with sensitive data | Critical |
| Auth Checks | Components accessing data without auth verification | Critical |
| Input Validation | User input not validated at API boundary (Zod) | Critical |
| SQL Injection | Raw SQL with string interpolation | Critical |
| XSS | Dangerously set HTML, unescaped user content | Critical |
| Secrets | Hardcoded API keys, tokens, passwords | Critical |

**Files to check:**
- `supabase/migrations/**/*.sql` - RLS policies
- `src/atomic-crm/providers/**/*.ts` - Data access
- `supabase/functions/**/*.ts` - Edge Functions

### 1.2 Data Integrity Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| Zod at Boundary | Validation happening in forms instead of provider | Critical |
| Direct Supabase | Imports from `@supabase/supabase-js` outside provider | Critical |
| Soft Deletes | Using hard deletes or `archived_at` instead of `deleted_at` | High |
| Junction Tables | Using deprecated `Contact.company_id` pattern | High |
| Type Safety | `any` types, missing interfaces | High |

**Key pattern to enforce:**
```typescript
// CORRECT: Zod validation at API boundary
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts
const validated = contactSchema.parse(data);

// WRONG: Validation in component
// src/atomic-crm/contacts/ContactCreate.tsx
const validated = contactSchema.parse(formData); // NO!
```

### 1.3 Runtime Error Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| Null/Undefined | Optional chaining hiding bugs (`?.`) | High |
| Error Boundaries | Missing boundaries around async components | High |
| Fail-Fast Violations | Retry logic, circuit breakers, graceful fallbacks | Critical |
| Type Mismatches | Runtime type errors from incorrect assumptions | High |

**Anti-patterns to flag:**
```typescript
// BLOCK THESE (fail-fast violations)
class CircuitBreaker { ... }
for (let i = 0; i < MAX_RETRIES; i++) { ... }
catch (e) { return cachedValue; }
```

---

## Phase 2: Improvements

**Priority:** Should fix for quality

### 2.1 Code Quality Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| DRY Violations | Duplicated logic across components | Medium |
| Component Structure | Missing feature structure (index, List, Create, Edit, SlideOver) | Medium |
| TypeScript Patterns | Using `type` where `interface` should be used | Low |
| Dead Code | Unused imports, functions, variables | Low |
| Naming | Inconsistent naming conventions | Low |

**Invoke skill:** `enforcing-principles` for detailed checks

### 2.2 UI/UX Compliance Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| Semantic Colors | Raw hex/oklch values instead of `text-muted-foreground`, `bg-primary` | High |
| Touch Targets | Buttons/links smaller than 44x44px (`h-11 w-11`) | High |
| Accessibility | Missing ARIA labels, poor contrast, no focus states | High |
| Design System | Components not following Crispy design patterns | Medium |
| Responsive | Missing tablet (iPad) considerations | Medium |

**Invoke skill:** `ui-ux-design-principles` for detailed checks

**Key pattern to enforce:**
```tsx
// CORRECT
<button className="h-11 w-11 bg-primary text-primary-foreground">

// WRONG
<button className="h-8 w-8 bg-green-600 text-white">
```

### 2.3 Performance Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| N+1 Queries | Fetching related data in loops | High |
| Unnecessary Re-renders | Missing useMemo, useCallback where needed | Medium |
| Bundle Size | Large imports that could be code-split | Medium |
| Image Optimization | Unoptimized images, missing lazy loading | Low |

---

## Phase 3: Polish

**Priority:** Nice to have

### 3.1 Test Coverage Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| Unit Test Gaps | Components/functions without tests | Medium |
| E2E Test Gaps | Critical user flows not covered | Medium |
| Test Quality | Tests that don't actually test behavior | Low |
| Mock Quality | Improper mocking in `src/tests/setup.ts` | Low |

**Files to check:**
- `src/**/__tests__/**/*.test.ts`
- `tests/e2e/**/*.spec.ts`
- `tests/e2e/support/poms/**/*.ts`

### 3.2 Documentation Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| Missing JSDoc | Public APIs without documentation | Low |
| Outdated Comments | Comments that don't match code | Low |
| README Gaps | Missing setup instructions, architecture docs | Low |

### 3.3 Developer Experience Audit

| Check | What to Look For | Severity |
|-------|------------------|----------|
| File Organization | Files in wrong directories | Low |
| Naming Consistency | Inconsistent file/function naming | Low |
| Dead Code | Unused exports, commented-out code | Low |
| TODO/FIXME | Unaddressed todo comments | Low |

---

## Output Format

### Report Structure

Generate report in `docs/archive/audits/YYYY-MM-DD-audit.md`:

```markdown
# Codebase Audit Report
**Date:** YYYY-MM-DD
**Scope:** [All features | Specific module]
**Auditor:** Claude Code

## Executive Summary
[2-3 sentence overview of findings]

## Findings by Priority

### Critical (Must Fix)
| # | Issue | Location | Suggested Fix |
|---|-------|----------|---------------|
| 1 | [Issue] | `path:line` | [Fix] |

### High (Should Fix)
...

### Medium (Consider)
...

### Low (Optional)
...

## Detailed Findings

### Phase 1: Critical Issues
[Narrative explanation of each critical finding]

### Phase 2: Improvements
[Narrative explanation of improvement opportunities]

### Phase 3: Polish
[Narrative explanation of polish items]

## Recommendations
1. [Prioritized recommendation]
2. ...

## Skills Invoked
- enforcing-principles
- ui-ux-design-principles
```

### TodoWrite Integration

Auto-create todos from ALL actionable findings:

```typescript
// Example todo structure
{
  content: "Fix RLS policy missing on opportunities table",
  status: "pending",
  activeForm: "Fixing RLS policy on opportunities table"
}
```

---

## Audit Scope Options

When user doesn't specify, audit ALL features:
- Contacts (`src/atomic-crm/contacts/`)
- Organizations (`src/atomic-crm/organizations/`)
- Opportunities (`src/atomic-crm/opportunities/`)
- Activities (`src/atomic-crm/activities/`)
- Tasks (`src/atomic-crm/tasks/`)
- Providers (`src/atomic-crm/providers/`)
- Validation (`src/atomic-crm/validation/`)
- Migrations (`supabase/migrations/`)
- Edge Functions (`supabase/functions/`)

---

## Integration with Other Skills

### Required Skills (Auto-Invoke)
- `enforcing-principles` - For code quality checks
- `ui-ux-design-principles` - For UI/UX compliance

### Verification
- `verification-before-completion` - After implementing fixes

---

## Quick Reference

### Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Security/data risks, fail-fast violations | Block release |
| **High** | Quality issues, UX problems | Fix before release |
| **Medium** | Code quality, minor issues | Fix when convenient |
| **Low** | Polish, preferences | Optional |

### Common Anti-Patterns to Flag

```typescript
// Security
import { createClient } from '@supabase/supabase-js' // Direct import!

// Fail-Fast Violations
class CircuitBreaker { ... }
for (let i = 0; i < MAX_RETRIES; i++) { ... }
catch (e) { return cachedValue; }

// Data Integrity
contact.company_id // Deprecated!
archived_at // Use deleted_at!

// UI/UX
className="bg-green-600" // Use bg-primary!
className="h-8 w-8" // Touch target too small!
```

---

## Related Files

- [AUDIT_CHECKLIST.md](resources/AUDIT_CHECKLIST.md) - Detailed checklist for each phase
- `.claude/skills/enforcing-principles/SKILL.md` - Engineering principles
- `.claude/skills/ui-ux-design-principles/SKILL.md` - Design system

---

**Skill Status:** ACTIVE
**Line Count:** < 500 (following 500-line rule)
**Last Updated:** 2025-12-03
