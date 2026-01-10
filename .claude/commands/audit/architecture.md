---
description: Architecture audit (feature structure, deprecated patterns, imports) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), Bash(find:*), TodoWrite, Write
model: sonnet
---

# Architecture Audit

Audit the codebase for architecture violations including feature structure compliance, deprecated patterns, and import violations. Supports delta tracking against a baseline.

---

## Arguments

**$ARGUMENTS**

Parse the arguments:
- `--quick` - Skip deep analysis, run local rg checks only
- `--full` - Full audit including feature structure analysis (default)
- `src/path` - Scope audit to specific path

---

## Phase 1: Mode Detection

```
MODE = "full" (default)
SCOPE = "src/atomic-crm/" (default)

If $ARGUMENTS contains "--quick":
  MODE = "quick"

If $ARGUMENTS contains a path (e.g., "src/atomic-crm/contacts"):
  SCOPE = that path
```

Get current date for report naming:
```bash
date +%Y-%m-%d
```

---

## Phase 2: Pattern Checks (Always Run)

Execute these rg checks. Capture file:line for each finding.

### Critical Severity (Architecture Violations)

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `C001` | Direct Supabase imports | `rg "from ['\"]@supabase/supabase-js['\"]" --type ts -n src/atomic-crm/ src/components/` | Bypasses data provider |
| `C002` | Business logic in provider | Read unifiedDataProvider.ts, check for complex conditionals, loops over 10 lines | Should be in Service layer |
| `C003` | Validation in forms | `rg "validate=" --type ts -n src/atomic-crm/` | Should be at API boundary only |
| `C004` | New code added to unifiedDataProvider | Check line count against baseline | Strangler Fig violation |

### High Severity (Pattern Violations)

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `H001` | Deprecated company_id | `rg "company_id" --type ts -n src/atomic-crm/` | Use contact_organizations |
| `H002` | Deprecated archived_at | `rg "archived_at" --type ts -n src/` | Use deleted_at |
| `H003` | Missing handlers for new resources | Check if new resources exist in unifiedDataProvider but not in handlers/ | Strangler Fig violation |
| `H004` | Direct Supabase in components | `rg "supabase\.from\|createClient" --type tsx -n src/atomic-crm/` | Bypass data provider |
| `H005` | Form-level schema validation | `rg "zodResolver|yupResolver" --type tsx -n src/atomic-crm/` | Validation at wrong boundary |

### Medium Severity (Structure Issues)

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `M001` | Missing error boundaries | Check features for ErrorBoundary usage | Poor error UX |
| `M002` | Large files (>500 lines) | `find src/atomic-crm -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20` | Maintainability |
| `M003` | Circular dependencies | Check import cycles in feature directories | Build/runtime issues |
| `M004` | Missing index exports | Features without index.tsx | Inconsistent structure |

---

## Phase 3: Feature Structure Analysis (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Identify Feature Directories

Features live in `src/atomic-crm/`. Each feature should have:

```
src/atomic-crm/{feature}/
├── index.tsx           # Entry + error boundaries
├── {Feature}List.tsx   # List view
├── {Feature}Create.tsx # Create form
├── {Feature}Edit.tsx   # Edit form
└── {Feature}SlideOver.tsx # Side panel (40vw, URL: ?view=123)
```

### 3.2 Check Each Feature

List feature directories:
```bash
find src/atomic-crm -maxdepth 1 -type d | grep -v "components\|hooks\|contexts\|providers\|validation\|filters\|layout\|login\|activity-log\|admin"
```

For each feature directory, check for:
- `index.tsx` - Entry point
- `*List.tsx` - List view
- `*Create.tsx` - Create form
- `*Edit.tsx` - Edit form
- `*SlideOver.tsx` - Side panel (optional but recommended)

### 3.3 Known Feature Directories

Expected feature directories to audit:
- `activities`
- `contacts`
- `dashboard`
- `notes`
- `notifications`
- `opportunities`
- `organizations`

---

## Phase 4: Load Baseline

Read the baseline file if it exists:

```bash
cat docs/audits/.baseline/architecture.json
```

**Baseline Schema:**
```json
{
  "lastAudit": "2025-01-08T00:00:00Z",
  "unifiedProviderLines": 1250,
  "findings": {
    "critical": 0,
    "high": 2,
    "medium": 5
  },
  "featureCompliance": {
    "contacts": { "index": true, "list": true, "create": true, "edit": true, "slideOver": true },
    "opportunities": { "index": true, "list": true, "create": true, "edit": true, "slideOver": false }
  },
  "knownIssues": [
    {
      "id": "H001-1",
      "file": "src/atomic-crm/contacts/ContactShow.tsx",
      "line": 45,
      "check": "H001",
      "status": "acknowledged"
    }
  ]
}
```

If baseline does not exist, create empty baseline with current date.

---

## Phase 5: Generate Report

Calculate deltas and generate markdown report.

### 5.1 Create Report File

**File path:** `docs/audits/YYYY-MM-DD-architecture.md`

### 5.2 Report Template

```markdown
# Architecture Audit Report

**Date:** YYYY-MM-DD
**Mode:** Quick/Full
**Scope:** $SCOPE

---

## Delta from Last Audit

| Severity | Previous | Current | Change |
|----------|----------|---------|--------|
| Critical | X | Y | +Z / -Z / -- |
| High | X | Y | +Z / -Z / -- |
| Medium | X | Y | +Z / -Z / -- |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

### New Issues
| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| C001-1 | Critical | src/foo.ts:42 | Direct Supabase import |

### Fixed Issues
| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| H002-3 | High | src/bar.ts:15 | company_id removed |

---

## Current Findings

### Critical (Architecture Violations)

Issues that violate core architecture patterns and MUST be fixed.

| ID | Check | Location | Evidence | Risk |
|----|-------|----------|----------|------|
| C001-1 | Direct Supabase imports | src/file.ts:42 | `import { createClient } from '@supabase/supabase-js'` | Bypasses data provider |

### High (Pattern Violations)

Issues that violate established patterns and should be fixed before PR merge.

| ID | Check | Location | Evidence | Risk |
|----|-------|----------|----------|------|
| H001-1 | Deprecated company_id | src/file.ts:15 | `contact.company_id` | Use contact_organizations |

### Medium (Structure Issues)

Issues that indicate technical debt or inconsistency.

| ID | Check | Location | Evidence | Risk |
|----|-------|----------|----------|------|
| M002-1 | Large file | src/file.ts | 650 lines | Maintainability |

---

## Strangler Fig Status

**unifiedDataProvider.ts:**
- Previous: X lines
- Current: Y lines
- Status: Growing / Stable / Shrinking

**Verdict:** [PASS if shrinking/stable, FAIL if growing by >10 lines]

---

## Feature Structure Compliance

*(Full mode only)*

| Feature | index | List | Create | Edit | SlideOver | Status |
|---------|-------|------|--------|------|-----------|--------|
| contacts | Y | Y | Y | Y | Y | COMPLIANT |
| opportunities | Y | Y | Y | Y | N | PARTIAL |
| organizations | Y | Y | Y | N | N | INCOMPLETE |

### Legend
- **COMPLIANT:** All required files present (index, List, Create, Edit)
- **PARTIAL:** Missing optional files (SlideOver)
- **INCOMPLETE:** Missing required files

### Details

#### contacts
- `index.tsx` - Present
- `ContactList.tsx` - Present
- `ContactCreate.tsx` - Present
- `ContactEdit.tsx` - Present
- `ContactSlideOver.tsx` - Present

[Repeat for each feature]

---

## Recommendations

### Critical (Fix Immediately)
1. **C001:** Remove direct Supabase imports - use unifiedDataProvider
2. **C003:** Move form validation to Zod schemas in validation/

### High (Fix Before PR Merge)
1. **H001:** Replace company_id with contact_organizations junction
2. **H002:** Replace archived_at with deleted_at

### Medium (Technical Debt)
1. **M002:** Split large files into smaller modules
2. **M004:** Add index.tsx to features missing entry points

---

## Check Definitions Reference

### Critical Checks
| ID | Name | Pattern | Why Critical |
|----|------|---------|--------------|
| C001 | Direct Supabase imports | `@supabase/supabase-js` | Bypasses data provider, no validation |
| C002 | Business logic in provider | Complex logic in unifiedDataProvider | Should be in Service layer |
| C003 | Validation in forms | `validate=` prop | Should be at API boundary |
| C004 | Strangler Fig violation | Provider growth | Architecture regression |

### High Checks
| ID | Name | Pattern | Why High |
|----|------|---------|----------|
| H001 | Deprecated company_id | `company_id` | Use contact_organizations |
| H002 | Deprecated archived_at | `archived_at` | Use deleted_at |
| H003 | Missing handlers | New resources in provider | Strangler Fig pattern |
| H004 | Direct Supabase in components | `supabase.from` | Bypass data provider |
| H005 | Form-level validation | `zodResolver` | Wrong validation boundary |

### Medium Checks
| ID | Name | Description | Why Medium |
|----|------|-------------|------------|
| M001 | Missing error boundaries | No ErrorBoundary in feature | Poor error UX |
| M002 | Large files | >500 lines | Maintainability |
| M003 | Circular dependencies | Import cycles | Build issues |
| M004 | Missing index exports | No index.tsx | Inconsistent structure |

---

*Generated by /audit/architecture command*
```

---

## Phase 6: Update Baseline

Write updated baseline JSON:

```json
{
  "lastAudit": "YYYY-MM-DDTHH:MM:SSZ",
  "unifiedProviderLines": CURRENT_LINES,
  "findings": {
    "critical": X,
    "high": Y,
    "medium": Z
  },
  "featureCompliance": {
    "contacts": { "index": true, "list": true, "create": true, "edit": true, "slideOver": true }
  },
  "knownIssues": [
    // Merge previous acknowledged issues + new findings
  ]
}
```

**File path:** `docs/audits/.baseline/architecture.json`

---

## Phase 7: Create TodoWrite Tasks

Create todos for Critical and High severity findings:

```typescript
TodoWrite([
  // Critical issues
  {
    content: "[Critical] C001: Remove direct Supabase import in src/foo.ts:42",
    status: "pending",
    activeForm: "Removing direct Supabase import"
  },
  // High issues
  {
    content: "[High] H001: Remove deprecated company_id in src/bar.ts:15",
    status: "pending",
    activeForm: "Removing deprecated company_id"
  }
])
```

**Rules:**
- Only create todos for Critical and High
- Include file:line in task
- Use actionable language ("Remove", "Replace", "Add", "Move")

---

## Output Summary

After completing all phases, display:

```markdown
## Architecture Audit Complete

**Report saved to:** docs/audits/YYYY-MM-DD-architecture.md
**Baseline updated:** docs/audits/.baseline/architecture.json

### Summary
| Severity | Count | Change |
|----------|-------|--------|
| Critical | X | +Y |
| High | X | -Y |
| Medium | X | -- |

### Strangler Fig Status
unifiedDataProvider.ts: X lines (previous: Y, delta: +/-Z)

### Feature Compliance
| Status | Count |
|--------|-------|
| COMPLIANT | X |
| PARTIAL | Y |
| INCOMPLETE | Z |

### Action Items Created
- [X] todos created for Critical/High findings

### Next Steps
1. Review report at docs/audits/YYYY-MM-DD-architecture.md
2. Address Critical issues immediately
3. Schedule High issues for next sprint
```

---

## Quick Reference

### Run Full Audit
```
/audit/architecture
/audit/architecture --full
```

### Run Quick Audit (Pattern Checks Only)
```
/audit/architecture --quick
```

### Audit Specific Directory
```
/audit/architecture src/atomic-crm/contacts
```

---

## Related Commands

- `/audit/data-integrity` - Data integrity audit (soft deletes, Strangler Fig)
- `/audit/security` - Security audit (RLS, validation, auth)
- `/audit/stale-state` - Stale state audit (cache, refetch patterns)
- `/code-review` - Deep dive code review with parallel agents
