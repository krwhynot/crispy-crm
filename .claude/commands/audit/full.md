---
description: Full codebase audit - runs all 11 audits in parallel with consolidated report
argument-hint: [--quick]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), Task, TodoWrite, Write, mcp__supabase__get_advisors, mcp__supabase__execute_sql
model: opus
---

# Full Codebase Audit (Meta-Command)

You are performing a **comprehensive codebase audit** for Crispy CRM by orchestrating all 11 individual audit commands in parallel. This meta-command dispatches audit agents in batches, collects all findings, and generates a consolidated report.

---

## Architecture Overview

```
+-------------------------------------------------------------------------+
|                    FULL CODEBASE AUDIT PIPELINE                           |
+-------------------------------------------------------------------------+
|                                                                         |
|   Phase 1: MODE DETECTION                                                |
|            - Parse $ARGUMENTS for --quick flag                           |
|            - Get current date for report naming                          |
|                                                                         |
|   Phase 2: PARALLEL DISPATCH (3 Batches)                                 |
|            +---------------------------------------------------------+   |
|            |  BATCH 1 (Critical)           BATCH 2 (High Priority)   |   |
|            |  security                     stale-state               |   |
|            |  data-integrity               workflow-gaps             |   |
|            |  error-handling               architecture              |   |
|            |  db-hardening                 typescript                |   |
|            +---------------------------------------------------------+   |
|            |  BATCH 3 (Standard)                                     |   |
|            |  accessibility                                          |   |
|            |  performance                                            |   |
|            |  code-quality                                           |   |
|            +---------------------------------------------------------+   |
|                                                                         |
|   Phase 3: COLLECT RESULTS                                               |
|            - Gather JSON findings from all 11 agents                     |
|            - Parse severity counts per category                          |
|                                                                         |
|   Phase 4: LOAD PREVIOUS BASELINE                                        |
|            - Read docs/audits/.baseline/full-audit.json                  |
|            - Calculate delta (new issues, fixed issues)                  |
|                                                                         |
|   Phase 5: GENERATE CONSOLIDATED REPORT                                  |
|            - Write to docs/audits/YYYY-MM-DD-full-audit.md               |
|            - Combined executive summary                                  |
|            - All critical/high issues in one table                       |
|                                                                         |
|   Phase 6: UPDATE FULL BASELINE                                          |
|            - Save combined findings to .baseline/full-audit.json         |
|                                                                         |
|   Phase 7: CREATE TODO TASKS                                             |
|            - All Critical findings                                       |
|            - Top 10 High findings                                        |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## Arguments

**$ARGUMENTS**

- `--quick` - Pass to all sub-audits (skip MCP checks, local rg only)
- Default: Full mode (all MCP checks enabled)

---

## Phase 1: Mode Detection and Setup

### 1.1 Parse Arguments

```
MODE = "full" (default)
QUICK_FLAG = ""

If $ARGUMENTS contains "--quick":
  MODE = "quick"
  QUICK_FLAG = "--quick"
```

### 1.2 Get Current Date and Start Time

```bash
date +%Y-%m-%d
date +%H:%M
```

Store as `AUDIT_DATE` and `START_TIME` for report.

---

## Phase 2: Parallel Dispatch (3 Batches)

Dispatch agents in batches to manage concurrent load. Each batch runs in parallel.

### Batch 1: Critical Audits (4 agents in parallel)

**DISPATCH ALL 4 AGENTS IN A SINGLE MESSAGE using Task tool:**

```
In a SINGLE message, invoke 4 Task tool calls:

Task 1: security audit
Task 2: data-integrity audit
Task 3: error-handling audit
Task 4: db-hardening audit
```

#### Task 1: Security Audit Agent

```markdown
TASK: Run security audit
GOAL: Find security vulnerabilities, validation gaps, auth issues

Run the /audit/security command with MODE=[quick/full]

SCOPE: Full codebase
CHECKS:
- RLS policy coverage
- Zod validation (.max(), strictObject)
- XSS vulnerabilities
- Direct Supabase imports
- Hardcoded secrets
- SQL injection patterns

OUTPUT FORMAT (JSON):
{
  "audit": "security",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [
    {
      "id": "C1-001",
      "severity": "critical|high|medium",
      "check": "Check name",
      "location": "file:line",
      "description": "Issue description",
      "fix": "Suggested fix"
    }
  ],
  "summary": "X critical, Y high, Z medium issues found"
}
```

#### Task 2: Data Integrity Audit Agent

```markdown
TASK: Run data-integrity audit
GOAL: Find soft delete violations, Strangler Fig compliance issues

Run the /audit/data-integrity command with MODE=[quick/full]

SCOPE: Full codebase
CHECKS:
- Hard DELETE statements
- Direct .delete() calls
- Writing to _summary views
- Strangler Fig violations (provider growth)
- Missing soft delete filters
- Deprecated company_id/archived_at

OUTPUT FORMAT (JSON):
{
  "audit": "data-integrity",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "strangler_fig": {
    "previous_lines": <count>,
    "current_lines": <count>,
    "status": "growing|stable|shrinking"
  },
  "findings": [...],
  "summary": "..."
}
```

#### Task 3: Error Handling Audit Agent

```markdown
TASK: Run error-handling audit
GOAL: Find fail-fast violations, silent error swallowing

Run the /audit/error-handling command with MODE=[quick/full]

SCOPE: Full codebase
CHECKS:
- Retry logic (MAX_RETRIES, exponentialBackoff)
- Circuit breakers
- Silent catch blocks (catch with no rethrow)
- Graceful fallbacks to cached/default values
- try/catch without error logging
- Empty catch blocks

OUTPUT FORMAT (JSON):
{
  "audit": "error-handling",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [...],
  "summary": "..."
}
```

#### Task 4: DB Hardening Audit Agent

```markdown
TASK: Run db-hardening audit
GOAL: Find database security and performance issues

Run the /audit/db-hardening command with MODE=[quick/full]

SCOPE: Database schema and migrations
CHECKS:
- Missing indexes on FK columns
- Tables without RLS policies
- Missing constraints
- Nullable columns that should be NOT NULL
- Missing deleted_at columns

OUTPUT FORMAT (JSON):
{
  "audit": "db-hardening",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [...],
  "summary": "..."
}
```

**Wait for Batch 1 to complete before starting Batch 2.**

---

### Batch 2: High Priority Audits (4 agents in parallel)

**DISPATCH ALL 4 AGENTS IN A SINGLE MESSAGE:**

```
Task 5: stale-state audit
Task 6: workflow-gaps audit
Task 7: architecture audit
Task 8: typescript audit
```

#### Task 5: Stale State Audit Agent

```markdown
TASK: Run stale-state audit
GOAL: Find cache invalidation and refetch issues

Run the /audit/stale-state command with MODE=[quick/full]

CHECKS:
- Missing refetchOnWindowFocus
- Stale cache patterns
- Optimistic updates without rollback
- Missing query invalidation on mutations

OUTPUT FORMAT (JSON):
{
  "audit": "stale-state",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [...],
  "summary": "..."
}
```

#### Task 6: Workflow Gaps Audit Agent

```markdown
TASK: Run workflow-gaps audit
GOAL: Find business logic holes and silent defaults

Run the /audit/workflow-gaps command with MODE=[quick/full]

CHECKS:
- Silent status defaults
- Required field fallbacks
- Nullable required FKs
- Hardcoded pipeline stages
- Missing activity logging
- Incomplete state transitions

OUTPUT FORMAT (JSON):
{
  "audit": "workflow-gaps",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "db_findings": {
    "orphaned_opportunities": <count>,
    "invalid_stages": <count>,
    "unlinked_contacts": <count>
  },
  "findings": [...],
  "summary": "..."
}
```

#### Task 7: Architecture Audit Agent

```markdown
TASK: Run architecture audit
GOAL: Find feature structure and pattern violations

Run the /audit/architecture command with MODE=[quick/full]

CHECKS:
- Direct Supabase imports
- Business logic in provider
- Validation in forms (should be API boundary)
- Feature structure compliance
- Missing handlers for new resources

OUTPUT FORMAT (JSON):
{
  "audit": "architecture",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "feature_compliance": {
    "compliant": <count>,
    "partial": <count>,
    "incomplete": <count>
  },
  "findings": [...],
  "summary": "..."
}
```

#### Task 8: TypeScript Audit Agent

```markdown
TASK: Run typescript audit
GOAL: Find type safety issues

Run the /audit/typescript command with MODE=[quick/full]

CHECKS:
- any usage
- as assertions
- @ts-ignore comments
- Missing return types
- Implicit any
- Type vs interface usage

OUTPUT FORMAT (JSON):
{
  "audit": "typescript",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [...],
  "summary": "..."
}
```

**Wait for Batch 2 to complete before starting Batch 3.**

---

### Batch 3: Standard Audits (3 agents in parallel)

**DISPATCH ALL 3 AGENTS IN A SINGLE MESSAGE:**

```
Task 9: accessibility audit
Task 10: performance audit
Task 11: code-quality audit
```

#### Task 9: Accessibility Audit Agent

```markdown
TASK: Run accessibility audit
GOAL: Find WCAG 2.1 AA violations and design system issues

Run the /audit/accessibility command with MODE=[quick/full]

CHECKS:
- Missing aria-invalid on error inputs
- Missing role="alert" on errors
- Missing aria-describedby
- Hardcoded hex colors
- Hardcoded Tailwind colors (not semantic)
- Small touch targets (< 44px)

OUTPUT FORMAT (JSON):
{
  "audit": "accessibility",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [...],
  "summary": "..."
}
```

#### Task 10: Performance Audit Agent

```markdown
TASK: Run performance audit
GOAL: Find re-render issues and inefficient queries

Run the /audit/performance command with MODE=[quick/full]

CHECKS:
- Unnecessary re-renders (missing memo, useMemo, useCallback)
- N+1 query patterns
- Large bundle imports
- Missing pagination
- watch() instead of useWatch()
- onChange form mode (should be onSubmit/onBlur)

OUTPUT FORMAT (JSON):
{
  "audit": "performance",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [...],
  "summary": "..."
}
```

#### Task 11: Code Quality Audit Agent

```markdown
TASK: Run code-quality audit
GOAL: Find DRY violations, complexity issues, dead code

Run the /audit/code-quality command with MODE=[quick/full]

CHECKS:
- DRY violations (duplicated code)
- High cyclomatic complexity
- Dead code (unused exports)
- Large files (> 500 lines)
- Deep nesting
- Magic numbers/strings

OUTPUT FORMAT (JSON):
{
  "audit": "code-quality",
  "mode": "quick|full",
  "critical": <count>,
  "high": <count>,
  "medium": <count>,
  "findings": [...],
  "summary": "..."
}
```

**Wait for Batch 3 to complete.**

---

## Phase 3: Collect Results

After all agents complete, collect the JSON results from each.

### 3.1 Parse Agent Results

For each of the 11 agents, extract:
- Audit name
- Critical count
- High count
- Medium count
- All findings array

### 3.2 Calculate Totals

```
TOTAL_CRITICAL = sum of all agent critical counts
TOTAL_HIGH = sum of all agent high counts
TOTAL_MEDIUM = sum of all agent medium counts
TOTAL_ISSUES = TOTAL_CRITICAL + TOTAL_HIGH + TOTAL_MEDIUM
```

### 3.3 Combine All Findings

Create a combined findings array, tagged with source audit:

```json
{
  "all_findings": [
    {
      "source_audit": "security",
      "id": "C1-001",
      "severity": "critical",
      "check": "Missing RLS",
      "location": "file:line",
      "description": "...",
      "fix": "..."
    },
    ...
  ]
}
```

---

## Phase 4: Load Previous Full Baseline

### 4.1 Read Baseline

```
Read: docs/audits/.baseline/full-audit.json
```

**Expected baseline structure:**

```json
{
  "lastAudit": "2025-01-08",
  "mode": "full",
  "duration_minutes": 15,
  "totals": {
    "critical": 5,
    "high": 20,
    "medium": 45
  },
  "by_category": {
    "security": { "critical": 2, "high": 5, "medium": 10 },
    "data-integrity": { "critical": 0, "high": 2, "medium": 5 },
    ...
  },
  "all_findings": [
    {
      "source_audit": "security",
      "id": "C1-001",
      "severity": "critical",
      "location": "file:line",
      "firstSeen": "2025-01-08"
    }
  ]
}
```

If baseline does not exist, treat as first audit (no delta).

### 4.2 Calculate Delta

For each current finding:
1. Check if exists in baseline by `source_audit + id` or `location + check`
2. If NOT in baseline -> Mark as **NEW**
3. If IN baseline -> Mark as **EXISTING**

For each baseline finding:
1. If NOT in current -> Mark as **FIXED**

---

## Phase 5: Generate Consolidated Report

### 5.1 Calculate Duration

```bash
# Get end time
date +%H:%M
```

Calculate duration in minutes from START_TIME to end time.

### 5.2 Create Report File

Save to: `docs/audits/YYYY-MM-DD-full-audit.md`

```markdown
# Full Codebase Audit Report

**Date:** [AUDIT_DATE] [END_TIME]
**Mode:** [Quick/Full]
**Duration:** [X] minutes

---

## Executive Summary

| Category | Critical | High | Medium | Total |
|----------|----------|------|--------|-------|
| Security | X | Y | Z | N |
| Data Integrity | X | Y | Z | N |
| Error Handling | X | Y | Z | N |
| DB Hardening | X | Y | Z | N |
| Stale State | X | Y | Z | N |
| Workflow Gaps | X | Y | Z | N |
| Architecture | X | Y | Z | N |
| TypeScript | X | Y | Z | N |
| Accessibility | X | Y | Z | N |
| Performance | X | Y | Z | N |
| Code Quality | X | Y | Z | N |
| **TOTAL** | **X** | **Y** | **Z** | **N** |

**Status:** [PASS if 0 Critical, CRITICAL if Critical > 0, WARN if only High]

---

## Delta from Last Full Audit

**Previous Audit:** [BASELINE_DATE] | **Current:** [AUDIT_DATE]

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Critical Issues | X | Y | +Z / -Z / -- |
| High Issues | X | Y | +Z / -Z / -- |
| Medium Issues | X | Y | +Z / -Z / -- |
| **Total Issues** | **X** | **Y** | **+Z / -Z / --** |

### New Issues (Since Last Audit)

| # | Category | Severity | Issue | Location |
|---|----------|----------|-------|----------|
| 1 | security | Critical | Missing RLS on users table | supabase/migrations/... |
| 2 | typescript | High | any usage in handler | src/providers/... |
| ... | ... | ... | ... | ... |

### Fixed Issues (Since Last Audit)

| # | Category | Severity | Issue | Location |
|---|----------|----------|-------|----------|
| 1 | security | Critical | XSS in ContactEdit | src/atomic-crm/contacts/... |
| ... | ... | ... | ... | ... |

---

## All Critical Issues

**These MUST be fixed before deployment.**

| # | Category | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | security | Missing RLS | table:users | No RLS policies defined | Add SELECT/INSERT/UPDATE/DELETE policies |
| 2 | data-integrity | Hard DELETE | src/file.ts:42 | DELETE FROM statement | Use soft delete with deleted_at |
| 3 | error-handling | Retry Logic | src/lib/api.ts:15 | MAX_RETRIES = 3 | Remove retry logic, fail fast |
| ... | ... | ... | ... | ... | ... |

---

## All High Issues

| # | Category | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | typescript | any usage | src/file.ts:23 | Parameter typed as any | Use proper type |
| 2 | accessibility | Hardcoded color | src/file.tsx:45 | #3B82F6 used | Use semantic token |
| ... | ... | ... | ... | ... | ... |

---

## Category Summaries

### 1. Security

**Issues:** X critical, Y high, Z medium

[Summary of security findings and key patterns identified]

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 2. Data Integrity

**Issues:** X critical, Y high, Z medium

**Strangler Fig Status:**
- Previous lines: X
- Current lines: Y
- Status: [Growing/Stable/Shrinking]

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 3. Error Handling

**Issues:** X critical, Y high, Z medium

**Fail-Fast Compliance:** [PASS/FAIL]

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 4. DB Hardening

**Issues:** X critical, Y high, Z medium

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 5. Stale State

**Issues:** X critical, Y high, Z medium

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 6. Workflow Gaps

**Issues:** X critical, Y high, Z medium

**Database Consistency:**
- Orphaned opportunities: X
- Invalid stages: Y
- Unlinked contacts: Z

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 7. Architecture

**Issues:** X critical, Y high, Z medium

**Feature Compliance:**
- Compliant: X features
- Partial: Y features
- Incomplete: Z features

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 8. TypeScript

**Issues:** X critical, Y high, Z medium

**Type Safety Score:** X%

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 9. Accessibility

**Issues:** X critical, Y high, Z medium

**WCAG 2.1 AA Status:** [PASS/FAIL]

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 10. Performance

**Issues:** X critical, Y high, Z medium

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

### 11. Code Quality

**Issues:** X critical, Y high, Z medium

**Key Findings:**
- [Finding 1]
- [Finding 2]

---

## Recommendations (Priority Order)

### Immediate (Critical - Blocks Deployment)

1. **[Category]** [Action item with file reference]
2. **[Category]** [Action item with file reference]
3. **[Category]** [Action item with file reference]

### Short-Term (High - Fix Before Next Release)

1. **[Category]** [Action item]
2. **[Category]** [Action item]
3. **[Category]** [Action item]

### Technical Debt (Medium - Schedule for Sprint)

1. **[Category]** [Action item]
2. **[Category]** [Action item]
3. **[Category]** [Action item]

---

## Individual Audit Reports

Detailed findings available in individual reports:

| Audit | Report Link |
|-------|-------------|
| Security | [YYYY-MM-DD-security.md](./YYYY-MM-DD-security.md) |
| Data Integrity | [YYYY-MM-DD-data-integrity.md](./YYYY-MM-DD-data-integrity.md) |
| Error Handling | [YYYY-MM-DD-error-handling.md](./YYYY-MM-DD-error-handling.md) |
| DB Hardening | [YYYY-MM-DD-db-hardening.md](./YYYY-MM-DD-db-hardening.md) |
| Stale State | [YYYY-MM-DD-stale-state.md](./YYYY-MM-DD-stale-state.md) |
| Workflow Gaps | [YYYY-MM-DD-workflow-gaps.md](./YYYY-MM-DD-workflow-gaps.md) |
| Architecture | [YYYY-MM-DD-architecture.md](./YYYY-MM-DD-architecture.md) |
| TypeScript | [YYYY-MM-DD-typescript.md](./YYYY-MM-DD-typescript.md) |
| Accessibility | [YYYY-MM-DD-accessibility.md](./YYYY-MM-DD-accessibility.md) |
| Performance | [YYYY-MM-DD-performance.md](./YYYY-MM-DD-performance.md) |
| Code Quality | [YYYY-MM-DD-code-quality.md](./YYYY-MM-DD-code-quality.md) |

---

## Audit Methodology

### Parallel Execution

Audits were executed in 3 batches:

1. **Batch 1 (Critical):** security, data-integrity, error-handling, db-hardening
2. **Batch 2 (High Priority):** stale-state, workflow-gaps, architecture, typescript
3. **Batch 3 (Standard):** accessibility, performance, code-quality

### Mode Details

- **Quick Mode:** Local rg patterns only, skip MCP database checks
- **Full Mode:** All checks including MCP advisors and SQL queries

---

*Generated by `/audit/full` command*
*Report location: docs/audits/YYYY-MM-DD-full-audit.md*
```

---

## Phase 6: Update Full Baseline

Write updated baseline to: `docs/audits/.baseline/full-audit.json`

```json
{
  "lastAudit": "[AUDIT_DATE]",
  "mode": "[MODE]",
  "duration_minutes": [DURATION],
  "totals": {
    "critical": [TOTAL_CRITICAL],
    "high": [TOTAL_HIGH],
    "medium": [TOTAL_MEDIUM]
  },
  "by_category": {
    "security": {
      "critical": [X],
      "high": [Y],
      "medium": [Z]
    },
    "data-integrity": { ... },
    "error-handling": { ... },
    "db-hardening": { ... },
    "stale-state": { ... },
    "workflow-gaps": { ... },
    "architecture": { ... },
    "typescript": { ... },
    "accessibility": { ... },
    "performance": { ... },
    "code-quality": { ... }
  },
  "all_findings": [
    {
      "source_audit": "[category]",
      "id": "[id]",
      "severity": "[critical|high|medium]",
      "check": "[check name]",
      "location": "[file:line]",
      "description": "[description]",
      "firstSeen": "[date]",
      "status": "open"
    }
  ]
}
```

---

## Phase 7: Create TodoWrite Tasks

### 7.1 Create Todos for All Critical Findings

```typescript
// All critical findings become todos
for (const finding of allFindings.filter(f => f.severity === 'critical')) {
  todos.push({
    content: `[CRITICAL][${finding.source_audit}] ${finding.check}: ${finding.description} - ${finding.location}`,
    status: "pending",
    activeForm: `Fixing ${finding.check} in ${finding.source_audit}`
  });
}
```

### 7.2 Create Todos for Top 10 High Findings

```typescript
// Top 10 high findings by priority category order:
// security > data-integrity > error-handling > db-hardening > architecture > typescript > accessibility

const priorityOrder = [
  'security',
  'data-integrity',
  'error-handling',
  'db-hardening',
  'architecture',
  'typescript',
  'accessibility',
  'stale-state',
  'workflow-gaps',
  'performance',
  'code-quality'
];

const highFindings = allFindings
  .filter(f => f.severity === 'high')
  .sort((a, b) => priorityOrder.indexOf(a.source_audit) - priorityOrder.indexOf(b.source_audit))
  .slice(0, 10);

for (const finding of highFindings) {
  todos.push({
    content: `[HIGH][${finding.source_audit}] ${finding.check}: ${finding.description} - ${finding.location}`,
    status: "pending",
    activeForm: `Fixing ${finding.check}`
  });
}
```

### 7.3 Execute TodoWrite

```typescript
TodoWrite(todos);
```

---

## Output Summary

After completing all phases, display:

```markdown
## Full Codebase Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Duration:** [X] minutes
**Report:** docs/audits/[AUDIT_DATE]-full-audit.md
**Baseline:** docs/audits/.baseline/full-audit.json (updated)

### Results by Category

| Category | Critical | High | Medium |
|----------|----------|------|--------|
| Security | X | Y | Z |
| Data Integrity | X | Y | Z |
| Error Handling | X | Y | Z |
| DB Hardening | X | Y | Z |
| Stale State | X | Y | Z |
| Workflow Gaps | X | Y | Z |
| Architecture | X | Y | Z |
| TypeScript | X | Y | Z |
| Accessibility | X | Y | Z |
| Performance | X | Y | Z |
| Code Quality | X | Y | Z |
| **TOTAL** | **X** | **Y** | **Z** |

### Delta from Last Audit

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Critical | X | Y | +/-Z |
| High | X | Y | +/-Z |
| Total | X | Y | +/-Z |

- **New issues:** X
- **Fixed issues:** Y
- **Net change:** +/-Z

### Action Items Created

- **Critical todos:** X (all critical findings)
- **High todos:** Y (top 10 by priority)

### Status

[CRITICAL: X critical issues block deployment]
[WARN: No critical, but Y high issues should be addressed]
[PASS: No critical or high issues]

### Next Steps

1. Review full report: docs/audits/YYYY-MM-DD-full-audit.md
2. Address all Critical issues immediately
3. Schedule High issues for current sprint
4. Re-run after fixes: `/audit/full`
```

---

## Quick Reference

### Run Full Audit (All Checks)

```
/audit/full
```

### Run Quick Audit (Local Patterns Only)

```
/audit/full --quick
```

---

## Related Commands

- `/audit/security` - Security patterns and validation
- `/audit/data-integrity` - Soft deletes, Strangler Fig
- `/audit/error-handling` - Fail-fast violations
- `/audit/db-hardening` - Database security
- `/audit/stale-state` - Cache invalidation
- `/audit/workflow-gaps` - Business logic gaps
- `/audit/architecture` - Feature structure
- `/audit/typescript` - Type safety
- `/audit/accessibility` - WCAG 2.1 AA
- `/audit/performance` - Re-renders, queries
- `/audit/code-quality` - DRY, complexity

---

## Notes on Missing Audits

If any of these audits are not yet implemented, skip them and note in report:

- `error-handling` - Create if missing
- `performance` - Create if missing
- `code-quality` - Create if missing

The consolidated report should still be generated with available audits.
