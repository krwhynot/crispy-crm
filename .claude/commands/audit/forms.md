---
description: Architecture Audit: Forms & Validation Health
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), TodoWrite, Write
model: sonnet
---

# Forms & Validation Audit Command

You are performing a forms and validation audit for Crispy CRM. This command systematically checks for form anti-patterns, validation gaps, and performance issues with delta tracking against previous audits.

## Arguments

**$ARGUMENTS**

- `--quick` - Skip deep analysis, run only local rg patterns (faster)
- `--full` - Run all checks including complexity analysis (default)
- `src/path` - Limit scope to specific directory

---

## Phase 1: Mode Detection and Setup

### 1.1 Parse Arguments

```
MODE = "full" (default)
SCOPE = "src/atomic-crm/"

If $ARGUMENTS contains "--quick":
  MODE = "quick"

If $ARGUMENTS contains "--full":
  MODE = "full"

If $ARGUMENTS contains a path (e.g., "src/atomic-crm/contacts"):
  SCOPE = that path only
```

### 1.2 Get Current Date

```bash
date +%Y-%m-%d
```

Store as `AUDIT_DATE` for report naming.

---

## Phase 2: Local Form Checks (Always Run)

Run these `rg` patterns and collect findings. Each finding should include:
- File path and line number
- Code snippet (context)
- Severity level
- Risk description

### Critical Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| F001 | Banned onChange mode | `rg 'mode=["\']onChange["\']' --type tsx -n src/atomic-crm/` | Re-renders on every keystroke, destroys performance |
| F002 | watch() instead of useWatch() | `rg "(?<!use)watch\(" --type tsx -n src/atomic-crm/` | Full form re-render vs isolated field subscription |
| F003 | Raw watch() call | `rg "const.*=.*watch\(" --type tsx -n src/atomic-crm/` | Performance: entire form re-renders on any field change |
| F004 | Direct Supabase in forms | `rg "from ['\"]@supabase" --type tsx -n src/atomic-crm/` | Bypasses provider validation layer |

### High Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| F005 | Form-level validate prop | `rg "validate=\{" --type tsx -n src/atomic-crm/` | Validation should be at provider layer via Zod |
| F006 | zodResolver in forms | `rg "zodResolver" --type tsx -n src/atomic-crm/` | Form-level validation bypasses provider layer |
| F007 | Inline Zod schema | `rg "z\.object\(" --type tsx -n src/atomic-crm/` then filter NOT in validation/ | Schema drift - must use validation/ directory |
| F008 | Missing SimpleForm/TabbedForm | Forms without React Admin wrappers | Bypasses RA form context |
| F009 | Raw useForm without RA | `rg "useForm\(" --type tsx -n src/atomic-crm/ -A 2` then filter for react-hook-form | Should use RA's form system |

### Medium Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| F010 | Console.log in forms | `rg "console\.(log\|debug)" --type tsx -n src/atomic-crm/` in form files | Debug code in production |
| F011 | Hardcoded form values | `rg "defaultValue=['\"][^'\"]+['\"]" --type tsx -n src/atomic-crm/` | Should use record data or constants |
| F012 | Missing aria attributes | Form inputs without aria-label or aria-describedby | Accessibility gap |
| F013 | Non-standard input heights | Inputs without h-11 (44px touch target) | Touch accessibility |

---

## Phase 3: Form Inventory (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Discover All Forms

```bash
rg -l "SimpleForm|TabbedForm|useForm" --type tsx src/atomic-crm/
```

Record each form with:
- File path
- Form type (SimpleForm, TabbedForm, Custom)
- Estimated complexity (line count)

### 3.2 Analyze Top 5 Complex Forms

For each of the 5 largest form files:

1. **Security Check:** Search for `usePermissions` or `role` checks
   - If missing = Flag as VULNERABLE

2. **Validation Check:** Search for `z.object` imports
   - If inline = Flag as INLINE_VALIDATION
   - If imported from validation/ = COMPLIANT

3. **Performance Check:** Count re-render triggers
   - Each `watch()` call = +1 risk
   - Each inline onChange = +1 risk

4. **Composition Check:** Count total lines
   - >300 lines without sub-components = Flag as MONOLITHIC

### 3.3 Gold Standard Criteria

Evaluate forms against these criteria:

1. **Security (RBAC):** Forms use `usePermissions` or `CanAccess` to disable/hide fields for unauthorized roles
2. **Validation (Layer 3):** Validation schemas defined in `src/atomic-crm/validation/` using Zod
3. **Composition (Layer 1):** Complex forms (>200 lines) broken into sub-sections
4. **Data Logic (Layer 4):** Forms use custom hooks or React Admin providers, never raw fetch
5. **Accessibility:** Inputs use standard heights (h-11/44px) and have proper aria-label associations

---

## Phase 4: Delta Tracking

### 4.1 Load Previous Baseline

```
Read: docs/audits/.baseline/forms.json
```

Expected format:
```json
{
  "lastAuditDate": "2024-01-15",
  "findings": {
    "critical": 2,
    "high": 5,
    "medium": 10
  },
  "issues": [
    {
      "id": "F001-001",
      "severity": "critical",
      "check": "Banned onChange mode",
      "location": "src/atomic-crm/contacts/ContactCreate.tsx:45",
      "status": "open"
    }
  ]
}
```

If file doesn't exist or is empty, treat as first audit (no delta).

### 4.2 Compare Findings

For each current finding:
1. Check if it exists in baseline by location + check type
2. If NOT in baseline -> Mark as **NEW**
3. If in baseline -> Mark as **EXISTING**

For each baseline finding:
1. If NOT in current findings -> Mark as **FIXED**

---

## Phase 5: Generate Report

### 5.1 Create Markdown Report

Save to: `docs/audits/YYYY-MM-DD-forms.md`

```markdown
# Forms & Validation Audit Report

**Date:** [AUDIT_DATE]
**Mode:** [Quick/Full]
**Scope:** [SCOPE]
**Auditor:** Claude Code (automated)

---

## Executive Summary

| Severity | Previous | Current | Delta |
|----------|----------|---------|-------|
| Critical | X | Y | +Z/-W |
| High | X | Y | +Z/-W |
| Medium | X | Y | +Z/-W |
| **Total** | X | Y | +Z/-W |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Forms are slow, unresponsive, or crash. Users experience lag when typing, forms freeze, or data is lost. Performance issues directly harm productivity. |
| **High** | Validation inconsistencies lead to confusing errors. Users may submit invalid data that fails silently or see errors that don't help them fix the problem. |
| **Medium** | Forms work but have minor accessibility or maintainability issues. Power users or users with disabilities may struggle. |

**Status:** [PASS if 0 Critical, WARN if Critical exists]

---

## Delta from Last Audit

### New Issues (Introduced Since Last Audit)

| ID | Severity | Check | Location | Risk |
|----|----------|-------|----------|------|
| [ID] | [sev] | [check] | [file:line] | [risk] |

### Fixed Issues (Resolved Since Last Audit)

| ID | Severity | Check | Location | Resolution Date |
|----|----------|-------|----------|-----------------|
| [ID] | [sev] | [check] | [file:line] | [AUDIT_DATE] |

---

## Current Findings

### Critical (Blocks Deployment)

These issues MUST be fixed before any production deployment.

#### [F001] Banned onChange Mode - Performance Killer

**Files Affected:**
- `src/atomic-crm/[module]/[file].tsx:123` - `mode="onChange"`

**Risk:** Re-renders entire form on every keystroke. Destroys performance with complex forms.

**Fix:** Change to `mode="onSubmit"` or `mode="onBlur"`:
```tsx
// WRONG
<SimpleForm mode="onChange" />

// RIGHT
<SimpleForm mode="onSubmit" />
<SimpleForm mode="onBlur" />
```

---

#### [F002] watch() Instead of useWatch() - Full Re-render

**Files Affected:**
- `src/atomic-crm/[module]/[file].tsx:45` - `const value = watch("field")`

**Risk:** watch() triggers full form re-render on any change. useWatch() isolates to specific field.

**Fix:** Replace with useWatch():
```tsx
// WRONG - entire form re-renders
const value = watch("fieldName");

// RIGHT - only this component re-renders
const value = useWatch({ name: "fieldName" });
```

---

### High (Fix Before PR Merge)

#### [F005] Form-level validate Prop

**Files Affected:**
- `src/atomic-crm/[module]/[file].tsx:67` - `validate={...}`

**Risk:** Validation should happen at provider layer via ValidationService, not in forms.

**Fix:** Remove validate prop and ensure Zod schema is registered in ValidationService:
```tsx
// WRONG
<TextInput source="email" validate={[required(), email()]} />

// RIGHT - validation handled by provider
<TextInput source="email" />
// + register schema in src/atomic-crm/validation/[resource].ts
```

---

#### [F006] zodResolver in Forms

**Files Affected:**
- `src/atomic-crm/[module]/[file].tsx:89`

**Risk:** Form-level Zod validation bypasses provider layer. Validation should be centralized.

**Fix:** Move schema to validation/ directory and register with ValidationService.

---

### Medium (Fix When Convenient)

[List medium findings in similar format]

---

## Form Inventory

[Only if MODE = "full"]

### Discovered Forms

| File | Form Type | Lines | Security | Validation | Composition | Status |
|------|-----------|-------|----------|------------|-------------|--------|
| [file] | [type] | [LOC] | [OK/MISSING] | [centralized/inline] | [OK/MONOLITHIC] | [status] |

### Top 5 Complex Forms Analysis

#### 1. [FormName] - [FilePath]

**Metrics:**
- Lines of Code: X
- watch() calls: Y
- Inline validation: Z

**Security:** [usePermissions found / MISSING]
**Validation:** [Centralized / Inline]
**Composition:** [Well-structured / Monolithic]

**Recommendations:**
1. [Recommendation 1]
2. [Recommendation 2]

---

## Recommendations

### Immediate Actions (Critical)
1. [Action 1]
2. [Action 2]

### Short-Term (High)
1. [Action 1]

### Technical Debt (Medium)
1. [Action 1]

---

## Best Practice Template

Based on audit findings, this form handles validation correctly:

**Best Example:** [FormName] at [FilePath]

```tsx
// Pattern to follow:
// 1. No inline validation
// 2. Uses mode="onSubmit" or mode="onBlur"
// 3. Uses useWatch() for field subscriptions
// 4. Imports from validation/ directory
```

**Worst Example:** [FormName] at [FilePath] - Priority for refactor

---

## Appendix: Check Definitions

| ID | Check | Pattern | Severity |
|----|-------|---------|----------|
| F001 | Banned onChange mode | `mode="onChange"` | Critical |
| F002 | watch() instead of useWatch() | `watch(` without `use` prefix | Critical |
| F003 | Raw watch() call | `const x = watch(` | Critical |
| F004 | Direct Supabase in forms | `from "@supabase"` | Critical |
| F005 | Form-level validate prop | `validate={` | High |
| F006 | zodResolver in forms | `zodResolver` | High |
| F007 | Inline Zod schema | `z.object(` outside validation/ | High |
| F008 | Missing SimpleForm/TabbedForm | Custom form without RA | High |
| F009 | Raw useForm without RA | `useForm(` from react-hook-form | High |
| F010 | Console.log in forms | `console.log` | Medium |
| F011 | Hardcoded form values | `defaultValue="..."` | Medium |
| F012 | Missing aria attributes | No aria-label | Medium |
| F013 | Non-standard input heights | Missing h-11 | Medium |

---

*Generated by /audit/forms command*
*Report location: docs/audits/YYYY-MM-DD-forms.md*
```

### 5.2 Update Baseline JSON

Write to: `docs/audits/.baseline/forms.json`

```json
{
  "lastAuditDate": "[AUDIT_DATE]",
  "mode": "[MODE]",
  "scope": "[SCOPE]",
  "findings": {
    "critical": [count],
    "high": [count],
    "medium": [count]
  },
  "issues": [
    {
      "id": "[unique-id]",
      "severity": "[critical|high|medium]",
      "check": "[check name]",
      "location": "[file:line]",
      "firstSeen": "[date first detected]",
      "status": "open"
    }
  ]
}
```

---

## Phase 6: Create Action Items

### 6.1 TodoWrite for Critical/High Findings

Create todos for all Critical and High severity findings:

```typescript
TodoWrite([
  // Critical findings
  {
    content: "[Critical] Replace mode='onChange' with mode='onSubmit' in ContactCreate.tsx:45",
    status: "pending",
    activeForm: "Fixing form mode"
  },
  {
    content: "[Critical] Replace watch() with useWatch() in OpportunityEdit.tsx:78",
    status: "pending",
    activeForm: "Fixing watch pattern"
  },
  // High findings
  {
    content: "[High] Remove validate prop and use ValidationService in TaskCreate.tsx:34",
    status: "pending",
    activeForm: "Centralizing validation"
  },
  // ...
])
```

### 6.2 Summary Output

Display summary to user:

```markdown
## Forms & Validation Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Report:** docs/audits/[AUDIT_DATE]-forms.md
**Baseline:** docs/audits/.baseline/forms.json (updated)

### Results

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | X | BLOCKS DEPLOYMENT |
| High | Y | Fix before PR merge |
| Medium | Z | Fix when convenient |

### Delta Summary
- **New issues:** X
- **Fixed issues:** Y
- **Net change:** +/-Z

### Key Findings
- **Best validation example:** [FormName] - use as template
- **Worst validation example:** [FormName] - priority refactor

### Next Steps
[List recommended actions based on findings]
```

---

## Phase 7: Scorecard Generation (Full Mode Only)

**Skip this phase if MODE = "quick"**

Generate a comprehensive scorecard for audited forms:

```markdown
## Form Health Scorecard

| Form Name | Complexity | Validation Source | Security Check | Accessibility | Performance | Status |
|-----------|------------|-------------------|----------------|---------------|-------------|--------|
| ContactCreate | Low (150 LOC) | Centralized | usePermissions | h-11, aria | No watch() | COMPLIANT |
| OpportunityEdit | High (450 LOC) | Inline | MISSING | Mixed | 3x watch() | REFACTOR |
| TaskCreate | Medium (250 LOC) | Centralized | CanAccess | h-11, aria | useWatch() | COMPLIANT |

### Scoring Criteria

| Criterion | Compliant | Needs Work |
|-----------|-----------|------------|
| **Complexity** | <300 LOC or well-composed | >300 LOC monolithic |
| **Validation** | validation/ directory | Inline z.object or validate prop |
| **Security** | usePermissions/CanAccess | No role checks |
| **Accessibility** | h-11 + aria attributes | Missing standards |
| **Performance** | useWatch() or no subscriptions | watch() calls |
```

---

## Severity Definitions

| Level | Definition | Impact | Examples |
|-------|------------|--------|----------|
| **Critical** | Performance killer or data integrity risk | Blocks deployment | onChange mode, watch() abuse, direct Supabase |
| **High** | Validation or architecture violation | Fix before PR merge | Inline validation, zodResolver, missing RA forms |
| **Medium** | Maintainability or minor accessibility gap | Fix when convenient | Console.log, hardcoded values, missing aria |

---

## Quick Reference

### Run Full Audit
```
/audit/forms
/audit/forms --full
```

### Run Quick Audit (Local Only)
```
/audit/forms --quick
```

### Audit Specific Directory
```
/audit/forms src/atomic-crm/contacts/
/audit/forms --quick src/atomic-crm/opportunities/
```

---

## Related Commands

- `/audit/security` - Validation layer security (Zod schemas)
- `/audit/performance` - React Admin performance patterns
- `/audit/accessibility` - Full accessibility audit
- `/audit/architecture` - Provider and handler patterns
