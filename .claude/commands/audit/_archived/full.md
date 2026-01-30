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

## Layer Architecture Model

Findings are grouped by architectural layer to show where fixes apply:

| Layer | Audits Mapped |
|-------|---------------|
| L1 - Database | db-hardening, data-integrity.soft_deletes |
| L2 - Domain | typescript, security.validation |
| L3 - Provider | architecture.handlers, error-handling, data-integrity.strangler_fig |
| L4 - UI Foundation | accessibility.systemic, performance.wrappers |
| L5 - Features | forms, code-quality, stale-state, workflow-gaps, accessibility.feature |

**Layer Status Indicators:**
- **OK** - No critical or high issues in this layer
- **WARN** - High issues exist but no criticals
- **CRITICAL** - Critical issues exist that block deployment

---

## Arguments

**$ARGUMENTS**

- `--quick` - Pass to all sub-audits (skip MCP checks, local rg only)
- `--exclude-tests` - Exclude `*.test.ts`, `*.spec.ts`, `__tests__/` from severity counts
- `--exclude-scripts` - Exclude `scripts/`, `supabase/functions/_shared/` from findings
- `--exclude-historical` - Exclude migrations before 2026-01-01 from Critical findings (mark as Historical)
- `--show-allowlist` - Show allowlisted items in report (hidden by default)
- Default: Full mode (all MCP checks enabled)

---

## Phase 0: Load Allowlist (False Positive Filtering)

Before dispatching any audit agents, load the centralized allowlist for known false positives.

### 0.1 Read Allowlist

```bash
cat docs/audits/.baseline/allowlist.json
```

**Expected structure:**
```json
{
  "version": 1,
  "entries": [
    {
      "id": "INTENTIONAL-001",
      "pattern": "USING(true)",
      "files": ["**/harden_participant_tables.sql"],
      "linePatterns": ["opportunity_participants"],
      "reason": "Intentional team collaboration design",
      "status": "VERIFIED_INTENTIONAL"
    }
  ]
}
```

### 0.2 Pass Allowlist to Sub-Agents

Include allowlist context in each agent's prompt:

```markdown
## Allowlist Context

The following patterns are known false positives and should be marked as `allowlisted` rather than `open`:

[List of relevant allowlist entries for this audit type]

For each finding:
1. Check if location matches any allowlist entry (file glob + pattern + linePatterns)
2. If matched: Mark as `status: "allowlisted"` and include `allowlistId: "[entry.id]"`
3. If NOT matched: Mark as `status: "open"`
```

### 0.3 Filtering by Status

**Status classifications:**
- `VERIFIED_INTENTIONAL` - Reviewed and confirmed as intentional design
- `HISTORICAL` - One-time migration, no longer active code
- `DOCUMENTATION` - Pattern in comments/docs, not executable
- `EXCLUDED_CONTEXT` - Pattern in ROLLBACK/comments, not active
- `TEST_FILE` - Pattern in test file with different risk profile

**Reporting behavior:**
- `open` → Counts toward severity totals
- `allowlisted` → Separate "Allowlisted Findings" section (hidden unless `--show-allowlist`)

---

## Phase 1: Mode Detection and Setup

### 1.1 Parse Arguments

```
MODE = "full" (default)
QUICK_FLAG = ""
EXCLUDE_TESTS = false
EXCLUDE_SCRIPTS = false
EXCLUDE_HISTORICAL = false
SHOW_ALLOWLIST = false

If $ARGUMENTS contains "--quick":
  MODE = "quick"
  QUICK_FLAG = "--quick"

If $ARGUMENTS contains "--exclude-tests":
  EXCLUDE_TESTS = true

If $ARGUMENTS contains "--exclude-scripts":
  EXCLUDE_SCRIPTS = true

If $ARGUMENTS contains "--exclude-historical":
  EXCLUDE_HISTORICAL = true

If $ARGUMENTS contains "--show-allowlist":
  SHOW_ALLOWLIST = true
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
      "fix": "...",
      "status": "open"
    },
    ...
  ]
}
```

### 3.3.1 Apply Allowlist Filtering

For each finding, check against allowlist entries:

```python
def apply_allowlist(finding, allowlist):
    for entry in allowlist["entries"]:
        # Check file pattern match (fnmatch glob)
        if not fnmatch(finding.location, entry["files"]):
            continue

        # Check pattern match
        if entry["pattern"] not in finding.line_content:
            continue

        # Check line patterns (if specified, ALL must match)
        if "linePatterns" in entry:
            if not all(lp in finding.line_content for lp in entry["linePatterns"]):
                continue

        # Match found - mark as allowlisted
        finding.status = "allowlisted"
        finding.allowlistId = entry["id"]
        finding.allowlistReason = entry["reason"]
        return finding

    # No match - keep as open
    finding.status = "open"
    return finding
```

### 3.3.2 Apply Historical Migration Filter

If `EXCLUDE_HISTORICAL = true`, apply date-based filtering for migration files:

```python
def apply_historical_filter(finding):
    # Check if finding is in a migration file
    if "supabase/migrations/" not in finding.location:
        return finding

    # Extract date from migration filename (format: YYYYMMDDHHMMSS_name.sql)
    filename = finding.location.split("/")[-1]
    date_prefix = filename[:8]  # First 8 chars = YYYYMMDD

    # If before 2026-01-01, mark as historical
    if date_prefix < "20260101":
        if finding.severity == "critical":
            finding.original_severity = "critical"
            finding.severity = "historical"
            finding.status = "historical"
            finding.note = "Historical migration (before 2026-01-01)"
        return finding

    return finding
```

**Report handling:**
- Historical findings appear in separate "Historical Migrations" section
- Do NOT count toward Critical/High totals

### 3.4 Classify Findings by Layer

For each finding, assign a `layer` field based on:
1. `source_audit` primary mapping
2. Check ID pattern matching for multi-layer audits

**Layer Classification Rules:**

| source_audit | Default Layer | Override Rules |
|--------------|---------------|----------------|
| db-hardening | L1 | Always L1 |
| data-integrity | L1 | Check contains "Strangler" → L3 |
| typescript | L2 | Always L2 |
| security | L2 | Check contains "RLS" → L1 |
| architecture | L3 | Check contains "Tier 1" → L4 |
| error-handling | L3 | Always L3 |
| accessibility | L4 | Location in `src/atomic-crm/` → L5 |
| performance | L4 | Check contains "form" → L5 |
| forms | L5 | Always L5 |
| code-quality | L5 | Always L5 |
| stale-state | L5 | Always L5 |
| workflow-gaps | L5 | Always L5 |

**Example Classifications:**
- `source_audit: "data-integrity", check: "Hard DELETE"` → L1
- `source_audit: "data-integrity", check: "Strangler Fig"` → L3
- `source_audit: "accessibility", location: "src/components/ui/button.tsx"` → L4
- `source_audit: "accessibility", location: "src/atomic-crm/contacts/ContactList.tsx"` → L5

```json
{
  "all_findings": [
    {
      "source_audit": "security",
      "id": "C1-001",
      "severity": "critical",
      "layer": "L1",
      "check": "Missing RLS",
      "location": "file:line",
      "description": "...",
      "fix": "..."
    }
  ]
}
```

### 3.5 Group Findings by Layer

After classification, group all findings:

```
L1_findings = all_findings.filter(f => f.layer === "L1")
L2_findings = all_findings.filter(f => f.layer === "L2")
L3_findings = all_findings.filter(f => f.layer === "L3")
L4_findings = all_findings.filter(f => f.layer === "L4")
L5_findings = all_findings.filter(f => f.layer === "L5")
```

Calculate layer totals:
```
LAYER_SUMMARY = {
  L1_database: { critical: count, high: count, status: determineStatus() },
  L2_domain: { critical: count, high: count, status: determineStatus() },
  L3_provider: { critical: count, high: count, status: determineStatus() },
  L4_ui_foundation: { critical: count, high: count, status: determineStatus() },
  L5_features: { critical: count, high: count, status: determineStatus() }
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
      "firstSeen": "2025-01-08",
      "status": "open"
    }
  ]
}
```

### Finding Status Values

| Status | Description | Counts in Totals? |
|--------|-------------|-------------------|
| `open` | Active finding requiring attention | Yes |
| `VERIFIED_INTENTIONAL` | Reviewed, confirmed as intentional design | No |
| `historical` | From migration before cutoff date (2026-01-01) | No |
| `allowlisted` | Matches entry in allowlist.json | No |
| `fixed` | Previously existed, now resolved | No |

**Verified Intentional Example:**
```json
{
  "source_audit": "security",
  "id": "C1-003",
  "severity": "critical",
  "location": "harden_participant_tables.sql:410",
  "check": "USING(true) RLS",
  "status": "VERIFIED_INTENTIONAL",
  "verificationNote": "Participant tables intentionally team-shared per RFC-123",
  "verifiedBy": "Task 3.6 RLS Verification",
  "verifiedDate": "2026-01-26",
  "reviewDue": "2026-04-26"
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

### Layer Health Overview

Findings grouped by architectural layer (fix from bottom up):

| Layer | Name | Critical | High | Status | Primary Concerns |
|-------|------|----------|------|--------|------------------|
| L1 | Database | X | Y | OK/WARN/CRITICAL | RLS, indexes, constraints |
| L2 | Domain | X | Y | OK/WARN/CRITICAL | Types, Zod schemas |
| L3 | Provider | X | Y | OK/WARN/CRITICAL | Handlers, services |
| L4 | UI Foundation | X | Y | OK/WARN/CRITICAL | Tier 1/2 components |
| L5 | Features | X | Y | OK/WARN/CRITICAL | Business modules |
| **TOTAL** | - | **X** | **Y** | - | - |

**Fix Order:** L1 → L2 → L3 → L4 → L5 (foundation issues cascade upward)

### Category Summary

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

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

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

## Findings by Layer

### L1 - Database Layer [STATUS]

**Scope:** RLS policies, indexes, constraints, soft delete enforcement
**Audits:** db-hardening, data-integrity (soft deletes)

| # | Severity | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | Critical | Missing RLS | table:users | No RLS policies | Add policies |
| ... | ... | ... | ... | ... | ... |

**L1 Issues:** X critical, Y high
**Status:** [OK/WARN/CRITICAL]

---

### L2 - Domain Layer [STATUS]

**Scope:** TypeScript types, Zod schemas, validation rules
**Audits:** typescript, security (validation)

| # | Severity | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | High | any usage | src/file.ts:23 | Parameter typed as any | Use proper type |
| ... | ... | ... | ... | ... | ... |

**L2 Issues:** X critical, Y high
**Status:** [OK/WARN/CRITICAL]

---

### L3 - Provider Layer [STATUS]

**Scope:** Data handlers, services, error transformation
**Audits:** architecture (handlers), error-handling, data-integrity (Strangler Fig)

| # | Severity | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | Critical | Direct Supabase | src/atomic-crm/file.ts:10 | Bypasses provider | Use useDataProvider |
| ... | ... | ... | ... | ... | ... |

**L3 Issues:** X critical, Y high
**Status:** [OK/WARN/CRITICAL]

---

### L4 - UI Foundation Layer [STATUS]

**Scope:** Tier 1/2 components, systemic accessibility
**Audits:** accessibility (systemic), performance (wrappers)

| # | Severity | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | Critical | Missing aria-invalid | src/components/ui/input.tsx:25 | Foundation violation | Add attribute |
| ... | ... | ... | ... | ... | ... |

**L4 Issues:** X critical, Y high
**Status:** [OK/WARN/CRITICAL]

---

### L5 - Features Layer [STATUS]

**Scope:** Business modules, feature-specific code
**Audits:** forms, code-quality, stale-state, workflow-gaps, accessibility (feature)

| # | Severity | Check | Location | Description | Fix |
|---|----------|-------|----------|-------------|-----|
| 1 | High | onChange mode | src/atomic-crm/contacts/ContactEdit.tsx:15 | Re-render on keystroke | Use onSubmit |
| ... | ... | ... | ... | ... | ... |

**L5 Issues:** X critical, Y high
**Status:** [OK/WARN/CRITICAL]

---

## All Critical Issues (Quick Reference)

**These MUST be fixed before deployment.**

| # | Layer | Category | Check | Location | Description | Fix |
|---|-------|----------|-------|----------|-------------|-----|
| 1 | L1 | security | Missing RLS | table:users | No RLS policies defined | Add SELECT/INSERT/UPDATE/DELETE policies |
| 2 | L1 | data-integrity | Hard DELETE | src/file.ts:42 | DELETE FROM statement | Use soft delete with deleted_at |
| 3 | L3 | error-handling | Retry Logic | src/lib/api.ts:15 | MAX_RETRIES = 3 | Remove retry logic, fail fast |
| ... | ... | ... | ... | ... | ... | ... |

---

## All High Issues (Quick Reference)

| # | Layer | Category | Check | Location | Description | Fix |
|---|-------|----------|-------|----------|-------------|-----|
| 1 | L2 | typescript | any usage | src/file.ts:23 | Parameter typed as any | Use proper type |
| 2 | L5 | accessibility | Hardcoded color | src/file.tsx:45 | #3B82F6 used | Use semantic token |
| ... | ... | ... | ... | ... | ... | ... |

---

## Historical Migrations (Informational)

**These findings are from migrations before 2026-01-01 and do NOT count toward severity totals.**

Historical migrations are one-time executions that have already run in production.

| # | Original Severity | Check | Location | Note |
|---|-------------------|-------|----------|------|
| 1 | Critical | Hard DELETE | phase2d_consolidate_duplicates.sql:88 | One-time duplicate consolidation |
| ... | ... | ... | ... | ... |

---

## Allowlisted Findings (Verified False Positives)

*(Hidden by default - use `--show-allowlist` to display)*

**These findings match entries in `docs/audits/.baseline/allowlist.json`.**

Items are allowlisted when:
- Pattern is intentional design (VERIFIED_INTENTIONAL)
- Code is in ROLLBACK/comment section (EXCLUDED_CONTEXT)
- Pattern is in documentation comments (DOCUMENTATION)
- Pattern is in test files (TEST_FILE)

| # | Allowlist ID | Check | Location | Reason |
|---|--------------|-------|----------|--------|
| 1 | INTENTIONAL-001 | USING(true) | harden_participant_tables.sql:410 | Team collaboration design |
| ... | ... | ... | ... | ... |

**Allowlist Review:** Review due dates are tracked. Entries past `reviewDue` should be re-verified.

---

## Appendix: Category Summaries (Legacy View)

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
    "medium": [TOTAL_MEDIUM],
    "historical": [TOTAL_HISTORICAL],
    "allowlisted": [TOTAL_ALLOWLISTED],
    "verified_intentional": [TOTAL_VERIFIED]
  },
  "by_layer": {
    "L1_database": {
      "critical": [X],
      "high": [Y],
      "status": "OK|WARN|CRITICAL"
    },
    "L2_domain": {
      "critical": [X],
      "high": [Y],
      "status": "OK|WARN|CRITICAL"
    },
    "L3_provider": {
      "critical": [X],
      "high": [Y],
      "status": "OK|WARN|CRITICAL"
    },
    "L4_ui_foundation": {
      "critical": [X],
      "high": [Y],
      "status": "OK|WARN|CRITICAL"
    },
    "L5_features": {
      "critical": [X],
      "high": [Y],
      "status": "OK|WARN|CRITICAL"
    }
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
      "severity": "[critical|high|medium|historical]",
      "layer": "[L1|L2|L3|L4|L5]",
      "check": "[check name]",
      "location": "[file:line]",
      "description": "[description]",
      "firstSeen": "[date]",
      "status": "open|VERIFIED_INTENTIONAL|historical|allowlisted",
      "allowlistId": "[if allowlisted, the entry ID]",
      "verificationNote": "[if VERIFIED_INTENTIONAL, why]",
      "verifiedBy": "[if VERIFIED_INTENTIONAL, who/what verified]",
      "verifiedDate": "[if VERIFIED_INTENTIONAL, when]",
      "reviewDue": "[if VERIFIED_INTENTIONAL, when to re-verify]"
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

### Results by Layer (Primary View)

| Layer | Name | Critical | High | Status |
|-------|------|----------|------|--------|
| L1 | Database | X | Y | OK/WARN/CRITICAL |
| L2 | Domain | X | Y | OK/WARN/CRITICAL |
| L3 | Provider | X | Y | OK/WARN/CRITICAL |
| L4 | UI Foundation | X | Y | OK/WARN/CRITICAL |
| L5 | Features | X | Y | OK/WARN/CRITICAL |
| **TOTAL** | - | **X** | **Y** | - |

**Fix Order:** L1 → L2 → L3 → L4 → L5

### Results by Category (Legacy View)

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
