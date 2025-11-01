---
description: Full audit of codebase for Engineering Constitution violations - retry logic, validation drift, hardcoded defaults, color violations
argument-hint: [focus-area]
---

# Engineering Constitution Compliance Audit

## Audit Configuration
- Constitution Reference: `.claude/skills/engineering-constitution/SKILL.md`
- Audit Focus: ${ARGUMENTS:-entire-codebase}
- Timestamp: !`date "+%Y-%m-%d %H:%M:%S"`
- Git Branch: !`git branch --show-current`
- Last Commit: !`git log -1 --oneline`

## Project Context
@.claude/skills/engineering-constitution/SKILL.md
@.claude/engineering-constitution.md

---

## Constitution Rules - Violation Detection

You are auditing the Atomic CRM codebase for violations of the Engineering Constitution. The constitution has 9 core rules. Your task is to search the codebase systematically and report ALL violations.

### Rule 1: NO OVER-ENGINEERING ⚠️ CRITICAL
**Forbidden Patterns:**
- Circuit breakers
- Retry logic with exponential backoff
- Graceful fallbacks returning cached data
- Health monitoring for circuit activation

**Detection Strategy:**
1. Search for retry loops and backoff patterns
2. Find circuit breaker implementations
3. Identify silent error swallowing with fallbacks
4. Look for health check/threshold monitoring

**Search Commands:**
- Retry patterns: `grep -rn "for.*MAX_RETRIES\|while.*retry\|attempt.*<\|backoff" --include="*.ts" --include="*.tsx" src/`
- Circuit breakers: `grep -rn "CircuitBreaker\|HALF_OPEN\|circuit.*state" --include="*.ts" --include="*.tsx" src/`
- Fallback patterns: `grep -rn "catch.*return.*cached\|fallback.*data\|degraded.*mode" --include="*.ts" --include="*.tsx" src/`
- Health monitoring: `grep -rn "health.*check\|failure.*count\|threshold.*exceeded" --include="*.ts" --include="*.tsx" src/`

### Rule 2: SINGLE SOURCE OF TRUTH
**Forbidden Patterns:**
- Validation logic outside `src/atomic-crm/validation/`
- Multiple email regex patterns
- Inline validation in components or utils

**Detection Strategy:**
1. Find `.parse()`, `.safeParse()` calls outside validation directory
2. Locate regex patterns for email/phone validation
3. Identify inline validation functions in components

**Search Commands:**
- Scattered validation: `grep -rn "\.parse\|\.safeParse\|z\.object" --include="*.tsx" --include="*.ts" src/ | grep -v "src/atomic-crm/validation/"`
- Email validation: `grep -rn "@.*test\|email.*regex\|validate.*email" --include="*.ts" --include="*.tsx" src/ | grep -v "src/atomic-crm/validation/"`
- Inline validation: `grep -rn "const.*validate\|function.*validate\|isValid" --include="*.tsx" src/components/`

### Rule 3: FORM STATE DERIVED FROM TRUTH
**Forbidden Patterns:**
- Hardcoded `defaultValues` in `useForm()`
- `defaultValue` props on form inputs
- Missing `zodSchema.partial().parse({})`

**Detection Strategy:**
1. Find `useForm` with hardcoded defaultValues objects
2. Locate `defaultValue` props in form components
3. Identify forms not using schema-derived defaults

**Search Commands:**
- Hardcoded defaults: `grep -rn "useForm.*defaultValues.*{" -A 5 --include="*.tsx" src/ | grep -v "partial().parse"`
- DefaultValue props: `grep -rn "defaultValue=" --include="*.tsx" src/`
- Form initialization: `grep -rn "useForm" -A 10 --include="*.tsx" src/ | grep -v "zodSchema\|schema.*parse"`

### Rule 4: BOY SCOUT RULE
**Detection (code smell indicators):**
- Unused imports
- Commented-out code
- Inconsistent formatting
- TODO/FIXME comments

**Search Commands:**
- Unused imports: `grep -rn "^import.*from" --include="*.tsx" --include="*.ts" src/ | wc -l` (manual review needed)
- Dead code: `grep -rn "^[[:space:]]*//.*[a-z]" --include="*.tsx" --include="*.ts" src/ | grep -v "///" | wc -l`
- TODOs: `grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.tsx" --include="*.ts" src/`

### Rule 5: TYPESCRIPT CONVENTIONS
**Forbidden Patterns:**
- `type` used for object shapes
- `interface` used for unions/intersections

**Detection Strategy:**
1. Find `type X = { ... }` (should be interface)
2. Locate `interface X = A | B` (should be type)

**Search Commands:**
- Type for objects: `grep -rn "^export type.*= {" --include="*.ts" --include="*.tsx" src/`
- Interface for unions: `grep -rn "^export interface.*=.*|" --include="*.ts" --include="*.tsx" src/`

### Rule 6: FORMS - USE REACT ADMIN COMPONENTS
**Forbidden Patterns:**
- Raw `<input>`, `<select>`, `<textarea>` elements
- HTML form elements instead of React Admin

**Search Commands:**
- Raw inputs: `grep -rn "<input\|<select\|<textarea\|<form" --include="*.tsx" src/ | grep -v "TextInput\|SelectInput\|ArrayInput"`
- Non-admin forms: `grep -rn "<form" --include="*.tsx" src/ | grep -v "import.*react-admin"`

### Rule 7: COLORS - SEMANTIC VARIABLES ONLY
**Forbidden Patterns:**
- Hex codes (`#FF6600`, `#FEFEF9`)
- Direct OKLCH (`oklch(65% 0.15 125)`)
- Inline CSS variable syntax (`text-[color:var(--...)]`)

**Search Commands:**
- Hex codes: `grep -rn "#[0-9a-fA-F]\{3,6\}" --include="*.tsx" --include="*.css" --include="*.ts" src/`
- Direct OKLCH: `grep -rn "oklch(" --include="*.tsx" --include="*.css" src/`
- Inline variables: `grep -rn "\\[color:var\|\\[var(--\|bg-\\[var\|text-\\[color" --include="*.tsx" src/`

### Rule 8: MIGRATIONS - TIMESTAMP FORMAT
**Forbidden Patterns:**
- Manually created migration files
- Non-standard naming (001_*, migration_*)

**Search Commands:**
- List migrations: `ls -la supabase/migrations/`
- Check format: `find supabase/migrations -name "*.sql" ! -name "[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*.sql"`

### Rule 9: DATABASE - TWO-LAYER SECURITY
**Forbidden Patterns:**
- Tables with RLS but no GRANT permissions
- Missing RLS policies on authenticated tables
- Inconsistent policy patterns

**Search Commands:**
- Find tables: `grep -rn "CREATE TABLE" supabase/migrations/*.sql`
- Check RLS: `grep -rn "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql`
- Check GRANT: `grep -rn "GRANT.*TO authenticated" supabase/migrations/*.sql`

---

## Audit Execution Instructions

### Phase 1: Automated Detection
Run ALL search commands above and collect results. For each rule:
1. Execute the detection commands
2. Count total violations
3. Capture file locations and line numbers
4. Extract code snippets showing violations

### Phase 2: Manual Review
For violations requiring context:
1. Read the actual file content
2. Determine if it's a true violation or false positive
3. Assess severity (Critical/High/Medium/Low)
4. Identify root cause

### Phase 3: Impact Assessment
For each violation category:
- **Blast Radius:** How many files affected?
- **Technical Debt:** Lines of code to refactor?
- **Risk Level:** What breaks if this continues?
- **Effort to Fix:** Hours/days to remediate?

---

## Required Output Format

Generate a comprehensive audit report with this structure:

# Engineering Constitution Audit Report
**Generated:** [timestamp]
**Branch:** [branch name]
**Focus Area:** [scope]

## Executive Summary
- **Total Violations:** [number]
- **Critical Issues:** [count of Rule 1 violations]
- **High Priority:** [count of Rules 2-3 violations]
- **Medium Priority:** [count of Rules 4-7 violations]
- **Low Priority:** [count of Rules 8-9 violations]

## Constitution Compliance Score
- **Overall:** [percentage]% compliant
- **Rule 1 (No Over-Engineering):** [%]
- **Rule 2 (Single Source of Truth):** [%]
- **Rule 3 (Form State Derived):** [%]
- **Rule 4 (Boy Scout Rule):** [%]
- **Rule 5 (TypeScript Conventions):** [%]
- **Rule 6 (React Admin Forms):** [%]
- **Rule 7 (Semantic Colors):** [%]
- **Rule 8 (Migration Format):** [%]
- **Rule 9 (Two-Layer Security):** [%]

## Detailed Violations by Rule

### ⚠️ Rule 1: NO OVER-ENGINEERING
**Status:** [PASS/FAIL]
**Violations Found:** [count]

#### Violation 1.1: [Description]
**File:** `[path]:[line]`
**Severity:** [Critical/High/Medium/Low]
**Code Snippet:**
```typescript
[actual violating code]
```
**Why This Violates:**
[Explanation]

**Recommended Fix:**
```typescript
[corrected code]
```
**Effort:** [S/M/L/XL]

[Repeat for all Rule 1 violations]

### Rule 2: SINGLE SOURCE OF TRUTH
[Same structure as Rule 1]

### Rule 3: FORM STATE DERIVED FROM TRUTH
[Same structure]

### Rule 4: BOY SCOUT RULE
[Same structure]

### Rule 5: TYPESCRIPT CONVENTIONS
[Same structure]

### Rule 6: REACT ADMIN FORMS
[Same structure]

### Rule 7: SEMANTIC COLORS ONLY
[Same structure]

### Rule 8: MIGRATIONS TIMESTAMP FORMAT
[Same structure]

### Rule 9: TWO-LAYER SECURITY
[Same structure]

## Prioritized Remediation Plan

### 🔴 Critical (Fix This Week)
1. [Violation description] - [File] - [Effort]
2. [...]

### 🟡 High Priority (Fix This Sprint)
1. [...]

### 🟢 Medium Priority (Fix This Quarter)
1. [...]

### ⚪ Low Priority (Backlog)
1. [...]

## Remediation Effort Estimates
- **Total Files to Modify:** [count]
- **Total Lines to Refactor:** [estimate]
- **Estimated Developer Hours:** [range]
- **Recommended Team Size:** [1-3 developers]
- **Timeline:** [1-4 weeks]

## Risk Assessment
**What Happens if We Don't Fix:**
- [Risk 1: e.g., validation drift leads to data corruption]
- [Risk 2: e.g., silent failures hide production issues]
- [Risk 3: e.g., tech debt compounds velocity loss]

## Constitution Health Trends
- **Violations per 1000 LOC:** [ratio]
- **Most Violated Rule:** [rule name]
- **Best Compliance:** [rule name]
- **Hotspot Files:** [files with 3+ violations]

## Recommendations

### Immediate Actions
1. [Action with specific owner and deadline]
2. [...]

### Process Improvements
1. Add pre-commit hook to catch color violations
2. Enable ESLint rule for interface/type usage
3. Add constitution checklist to PR template

### Long-term Strategy
1. [Strategic recommendation]
2. [...]

---

## Appendix: Full Violation Inventory
[Complete list with file paths, line numbers, and violation codes]

---

**Execute the audit now. Be thorough. Report ALL violations found.**
