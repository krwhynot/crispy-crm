---
description: Workflow gaps audit (business logic holes, silent defaults) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), mcp__supabase__execute_sql, TodoWrite, Write
model: sonnet
---

# Workflow Gaps Audit

Audit the codebase for workflow gaps including business logic holes, silent defaults, orphaned states, and missing validations. Tracks delta from previous audits and generates actionable todos.

> **SKILL ACTIVATION:** Using `workflow-gaps` audit command for business logic health check.

---

## Architecture

```
+---------------------------------------------------------------------+
|                    WORKFLOW GAPS AUDIT                               |
+---------------------------------------------------------------------+
|                                                                     |
|   Phase 1: MODE DETECTION                                           |
|            - Parse $ARGUMENTS for --quick or --full                 |
|                                                                     |
|   Phase 2: LOCAL CODE CHECKS (Always Run)                           |
|            - rg patterns for silent defaults, magic values          |
|            - Hardcoded status values, missing validations           |
|                                                                     |
|   Phase 3: DATABASE CHECKS (Skip in Quick Mode)                     |
|            - mcp__supabase__execute_sql queries                     |
|            - Orphaned records, invalid states                       |
|                                                                     |
|   Phase 4: BASELINE COMPARISON                                      |
|            - Load docs/audits/.baseline/workflow-gaps.json          |
|            - Calculate delta (new issues, fixed issues)             |
|                                                                     |
|   Phase 5: REPORT GENERATION                                        |
|            - Write to docs/audits/YYYY-MM-DD-workflow-gaps.md       |
|                                                                     |
|   Phase 6: BASELINE UPDATE                                          |
|            - Update docs/audits/.baseline/workflow-gaps.json        |
|                                                                     |
|   Phase 7: TODO CREATION                                            |
|            - Create TodoWrite tasks for Critical/High findings      |
|                                                                     |
+---------------------------------------------------------------------+
```

---

## Phase 1: Mode Detection

**Parse `$ARGUMENTS` to determine audit mode:**

```
IF $ARGUMENTS contains "--quick":
  MODE = "quick"
  SKIP_DB_CHECKS = true
ELSE IF $ARGUMENTS contains "--full":
  MODE = "full"
  SKIP_DB_CHECKS = false
ELSE:
  MODE = "full" (default)
  SKIP_DB_CHECKS = false

IF $ARGUMENTS contains a path (e.g., "src/atomic-crm/"):
  SCOPE = that path
ELSE:
  SCOPE = "src/"
```

**Mode Comparison:**

| Check | Quick Mode | Full Mode |
|-------|------------|-----------|
| Local rg patterns | Yes | Yes |
| Database consistency (MCP) | No | Yes |
| Orphaned state detection | No | Yes |
| Baseline comparison | Yes | Yes |

**Get current date:**
```bash
date +%Y-%m-%d
```

Store as `AUDIT_DATE` for report naming.

---

## Phase 2: Local Code Checks (Always Run)

Run these `rg` patterns and collect findings. Each finding should include:
- File path and line number
- Code snippet (context)
- Severity level
- Risk description

### Critical Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| WF-C1 | Silent status defaults | `rg "status.*=.*['\"]new['\"]|status.*\?\?.*['\"]new['\"]" --type ts -n $SCOPE` | Data inconsistency - records created with implicit status |
| WF-C2 | Required field fallbacks | `rg "\|\|.*['\"]['\"]|\|\|.*null|\?\?.*['\"]['\"]" --type ts -n $SCOPE` | Missing data accepted silently |
| WF-C3 | Nullable required FK | `rg "principal_id.*null|principal_id\?" --type ts -n src/atomic-crm/` | Opportunities without principal violate business rules |

**Critical Check Details:**

#### WF-C1: Silent Status Defaults
Look for patterns where status is defaulted without explicit user action:
```bash
rg "status.*=.*['\"]new['\"]" --type ts -n $SCOPE
rg "status.*\?\?.*['\"]" --type ts -n $SCOPE
rg "stage.*=.*['\"]new_lead['\"]" --type ts -n $SCOPE
```

**What to look for:**
- Default status values without validation
- Implicit state initialization
- Missing state machine enforcement

#### WF-C2: Required Field Fallbacks
Look for empty string or null fallbacks on required fields:
```bash
rg "\|\|.*['\"]['\"]" --type ts -n $SCOPE
rg "\?\?.*['\"]['\"]" --type ts -n $SCOPE
rg "\.name\s*\|\|" --type ts -n $SCOPE
```

**What to look for:**
- Required fields falling back to empty string
- Null coalescing on mandatory data
- Silent data loss patterns

### High Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| WF-H1 | Hardcoded stage values | `rg "['\"]new_lead['\"]|['\"]closed_won['\"]|['\"]closed_lost['\"]" --type ts -n $SCOPE` | Maintenance debt, typo risk |
| WF-H2 | Missing activity logging | `rg "useCreate|useUpdate|useDelete" --type tsx -n src/atomic-crm/` then check for activity creation | Audit trail gaps |
| WF-H3 | Incomplete state transitions | `rg "setStage|updateStage|stage\s*=" --type ts -n $SCOPE` | Status changes without required fields |
| WF-H4 | Missing required relationships | `rg "opportunity.*create|createOpportunity" --type ts -n $SCOPE` | Opportunities created without principal |

**High Check Details:**

#### WF-H1: Hardcoded Pipeline Stages
All pipeline stage values should come from constants:
```bash
# Find hardcoded stage literals
rg "['\"]new_lead['\"]" --type ts -n $SCOPE
rg "['\"]initial_outreach['\"]" --type ts -n $SCOPE
rg "['\"]sample_visit_offered['\"]" --type ts -n $SCOPE
rg "['\"]feedback_logged['\"]" --type ts -n $SCOPE
rg "['\"]demo_scheduled['\"]" --type ts -n $SCOPE
rg "['\"]closed_won['\"]" --type ts -n $SCOPE
rg "['\"]closed_lost['\"]" --type ts -n $SCOPE
```

**Exception:** Schema definitions and enum type definitions are acceptable.

#### WF-H2: Missing Activity Logging
CUD operations should create activity records:
```bash
rg "useCreate|useUpdate" --type tsx -n src/atomic-crm/opportunities
rg "useCreate|useUpdate" --type tsx -n src/atomic-crm/contacts
```

Check if these operations log to activities table.

### Medium Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| WF-M1 | Inconsistent date handling | `rg "new Date\(\)|Date\.now\(\)" --type ts -n $SCOPE` | Timezone inconsistencies |
| WF-M2 | Direct status assignments | `rg "\.stage\s*=" --type ts -n $SCOPE` | Bypasses state machine |
| WF-M3 | Missing close reasons | `rg "closed_won|closed_lost" --type ts -n $SCOPE` then check for reason field | Lost context on why deals closed |
| WF-M4 | Optional activity type | `rg "activity_type.*\?" --type ts -n $SCOPE` | Activity records without type |

---

## Phase 3: Database Consistency Checks (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Opportunities Without Principal

```sql
-- mcp__supabase__execute_sql
SELECT id, name, stage, created_at
FROM opportunities
WHERE principal_id IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

**Severity:** Critical
**Risk:** Violates core business rule - every opportunity must belong to a principal

### 3.2 Orphaned Pipeline Stages

```sql
-- mcp__supabase__execute_sql
SELECT stage, COUNT(*) as count
FROM opportunities
WHERE stage NOT IN (
  'new_lead',
  'initial_outreach',
  'sample_visit_offered',
  'feedback_logged',
  'demo_scheduled',
  'closed_won',
  'closed_lost'
)
AND deleted_at IS NULL
GROUP BY stage
ORDER BY count DESC;
```

**Severity:** Critical
**Risk:** Records stuck in invalid/deleted pipeline stages

### 3.3 Contacts Without Organization

```sql
-- mcp__supabase__execute_sql
SELECT c.id, c.first_name, c.last_name, c.created_at
FROM contacts c
WHERE c.deleted_at IS NULL
AND NOT EXISTS (
  SELECT 1 FROM contact_organizations co
  WHERE co.contact_id = c.id
)
ORDER BY c.created_at DESC
LIMIT 20;
```

**Severity:** High
**Risk:** Contacts not linked to any organization may be orphaned data

### 3.4 Closed Opportunities Without Reason

```sql
-- mcp__supabase__execute_sql
SELECT id, name, stage, closed_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND close_reason IS NULL
AND deleted_at IS NULL
ORDER BY closed_at DESC
LIMIT 20;
```

**Severity:** Medium
**Risk:** Missing context on why deals were won/lost

### 3.5 Activities Without Type

```sql
-- mcp__supabase__execute_sql
SELECT id, created_at, opportunity_id
FROM activities
WHERE activity_type IS NULL
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

**Severity:** Medium
**Risk:** Activity records without classification

### 3.6 State Transition Anomalies

```sql
-- mcp__supabase__execute_sql
-- Find opportunities that jumped from new_lead directly to closed
SELECT id, name, stage, created_at, updated_at
FROM opportunities
WHERE stage IN ('closed_won', 'closed_lost')
AND created_at = updated_at
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Severity:** Medium
**Risk:** Skipped pipeline stages may indicate data quality issues

---

## Phase 4: Load Baseline

Read previous audit baseline:

```
Read: docs/audits/.baseline/workflow-gaps.json
```

**Expected baseline structure:**
```json
{
  "lastAudit": "2025-01-08",
  "lastMode": "full",
  "scope": "src/",
  "findings": {
    "critical": [
      {
        "id": "WF-C1-001",
        "check": "WF-C1",
        "type": "silent-status-default",
        "location": "src/atomic-crm/opportunities/OpportunityCreate.tsx:45",
        "description": "Status defaults to 'new_lead' without explicit selection",
        "firstSeen": "2025-01-08"
      }
    ],
    "high": [],
    "medium": []
  },
  "dbFindings": {
    "orphanedOpportunities": 0,
    "invalidStages": 0,
    "unlinkedContacts": 0
  },
  "counts": {
    "critical": 1,
    "high": 0,
    "medium": 0
  }
}
```

**If baseline doesn't exist:** Treat all findings as new (first audit).

### Calculate Delta

For each current finding:
1. Check if it exists in baseline by `id` or `location + check`
2. If NOT in baseline: mark as **NEW**
3. If IN baseline: mark as **EXISTING**

For each baseline finding:
1. Check if it exists in current findings
2. If NOT in current: mark as **FIXED**

---

## Phase 5: Generate Report

**Generate report and save to:** `docs/audits/YYYY-MM-DD-workflow-gaps.md`

```bash
date=$(date +%Y-%m-%d)
# Write to: docs/audits/${date}-workflow-gaps.md
```

### Report Template

```markdown
# Workflow Gaps Audit Report

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

### Critical (Business Rule Violations)

These issues violate core business rules and must be fixed immediately.

#### [WF-C1] Silent Status Defaults

**Files Affected:**
- `src/path/file.tsx:123` - `status = 'new_lead'` without user selection

**Risk:** Records created with implicit status bypass workflow validation.

**Fix:** Require explicit status selection or use Zod schema defaults with `z.enum()`.

---

#### [WF-C2] Required Field Fallbacks

**Files Affected:**
- `src/path/file.tsx:45` - `name || ''` allows empty names

**Risk:** Missing required data accepted silently.

**Fix:** Remove fallbacks; let Zod validation enforce required fields.

---

### High (Process Gaps)

#### [WF-H1] Hardcoded Pipeline Stages

**Files Affected:**
- `src/path/file.tsx:67` - `'closed_won'` literal

**Risk:** Typos, maintenance burden, refactoring difficulty.

**Fix:** Use `PIPELINE_STAGES` constant from `src/atomic-crm/constants.ts`.

---

#### [WF-H2] Missing Activity Logging

**Files Affected:**
- `src/atomic-crm/opportunities/OpportunityEdit.tsx` - No activity on update

**Risk:** Audit trail gaps, lost context on changes.

**Fix:** Add activity creation in mutation `onSuccess` callback.

---

### Medium (Technical Debt)

#### [WF-M1] Inconsistent Date Handling

**Files Affected:**
- `src/path/file.tsx:89` - `new Date()` without timezone consideration

**Risk:** Date inconsistencies across timezones.

**Fix:** Use consistent date utility (e.g., `date-fns` with UTC).

---

## Database Consistency Checks

*(Skipped in quick mode)*

### Opportunities Without Principal

| ID | Name | Stage | Created At |
|----|------|-------|------------|
| [uuid] | [name] | [stage] | [date] |

**Count:** X records violating business rules

### Orphaned Pipeline Stages

| Stage | Count |
|-------|-------|
| [invalid_stage] | X |

**Impact:** Records stuck in deleted/renamed stages

### Contacts Without Organization

| ID | Name | Created At |
|----|------|------------|
| [uuid] | [name] | [date] |

**Count:** X unlinked contacts

### Closed Opportunities Without Reason

| ID | Name | Stage | Closed At |
|----|------|-------|-----------|
| [uuid] | [name] | [stage] | [date] |

**Count:** X opportunities missing close reason

---

## Pipeline Stage Reference

Valid pipeline stages for Crispy CRM:

| Stage | Display Name | Description |
|-------|--------------|-------------|
| `new_lead` | New Lead | Initial opportunity entry |
| `initial_outreach` | Initial Outreach | First contact made |
| `sample_visit_offered` | Sample/Visit Offered | Product samples or visit scheduled |
| `feedback_logged` | Feedback Logged | Customer feedback received |
| `demo_scheduled` | Demo Scheduled | Product demonstration scheduled |
| `closed_won` | Closed Won | Deal successfully closed |
| `closed_lost` | Closed Lost | Deal lost |

---

## Recommendations

### Immediate Actions (Critical)
1. Fix silent status defaults - require explicit selection
2. Remove required field fallbacks - enforce at validation layer
3. Investigate orphaned records in database

### Short-Term (High)
1. Replace hardcoded stage literals with constants
2. Add activity logging to CUD operations
3. Link orphaned contacts to organizations

### Technical Debt (Medium)
1. Standardize date handling across codebase
2. Add close reason enforcement for closed opportunities
3. Add activity type validation

---

## Appendix: Check Definitions

### Critical Checks

| ID | Name | Pattern | Why Critical |
|----|------|---------|--------------|
| WF-C1 | Silent Status Defaults | `status = 'new'` | Bypasses workflow validation |
| WF-C2 | Required Field Fallbacks | `\|\| ''` on required | Accepts missing data |
| WF-C3 | Nullable Required FK | `principal_id?` | Breaks business rules |

### High Checks

| ID | Name | Pattern | Why High |
|----|------|---------|----------|
| WF-H1 | Hardcoded Stages | `'closed_won'` literal | Maintenance burden |
| WF-H2 | Missing Activity Log | CUD without activity | Audit trail gaps |
| WF-H3 | Incomplete Transitions | State change without validation | Process gaps |
| WF-H4 | Missing Relationships | Create without required FK | Orphaned records |

### Medium Checks

| ID | Name | Pattern | Why Medium |
|----|------|---------|------------|
| WF-M1 | Date Handling | `new Date()` inconsistent | Timezone issues |
| WF-M2 | Direct Assignments | `.stage =` | Bypasses state machine |
| WF-M3 | Missing Close Reason | Closed without reason | Lost context |
| WF-M4 | Optional Activity Type | `activity_type?` | Classification gaps |

---

*Generated by `/audit/workflow-gaps` command*
*Report location: docs/audits/YYYY-MM-DD-workflow-gaps.md*
```

---

## Phase 6: Update Baseline

**Update baseline file:** `docs/audits/.baseline/workflow-gaps.json`

```json
{
  "lastAudit": "YYYY-MM-DD",
  "lastMode": "quick|full",
  "scope": "src/",
  "findings": {
    "critical": [
      {
        "id": "WF-C1-001",
        "check": "WF-C1",
        "type": "silent-status-default",
        "location": "src/path/file.tsx:45",
        "description": "Status defaults to 'new_lead' without explicit selection",
        "firstSeen": "YYYY-MM-DD"
      }
    ],
    "high": [...],
    "medium": [...]
  },
  "dbFindings": {
    "orphanedOpportunities": 0,
    "invalidStages": 0,
    "unlinkedContacts": 0,
    "missingCloseReasons": 0
  },
  "counts": {
    "critical": 0,
    "high": 0,
    "medium": 0
  }
}
```

**ID Generation Rules:**
- `WF-C1-{seq}` - Silent status default
- `WF-C2-{seq}` - Required field fallback
- `WF-C3-{seq}` - Nullable required FK
- `WF-H1-{seq}` - Hardcoded stage value
- `WF-H2-{seq}` - Missing activity log
- `WF-H3-{seq}` - Incomplete state transition
- `WF-H4-{seq}` - Missing required relationship
- `WF-M1-{seq}` - Inconsistent date handling
- `WF-M2-{seq}` - Direct status assignment
- `WF-M3-{seq}` - Missing close reason
- `WF-M4-{seq}` - Optional activity type

---

## Phase 7: Create TodoWrite Tasks

**Create todos for Critical and High findings only:**

```typescript
// Only create todos for NEW issues (not existing ones)
const todos = [];

for (const issue of delta.newIssues) {
  if (issue.severity === 'critical' || issue.severity === 'high') {
    todos.push({
      content: `[${issue.severity.toUpperCase()}] ${issue.check}: ${issue.description} - ${issue.location}`,
      status: "pending",
      activeForm: `Fixing ${issue.description}`
    });
  }
}

TodoWrite(todos);
```

**Example todos:**
```typescript
[
  {
    content: "[CRITICAL] WF-C1: Remove silent status default in OpportunityCreate.tsx:45",
    status: "pending",
    activeForm: "Removing silent status default in OpportunityCreate"
  },
  {
    content: "[HIGH] WF-H1: Replace hardcoded 'closed_won' with constant in Pipeline.tsx:67",
    status: "pending",
    activeForm: "Replacing hardcoded stage value"
  }
]
```

---

## Severity Definitions

| Level | Definition | Impact | Examples |
|-------|------------|--------|----------|
| **Critical** | Business rule violation - data created in invalid state | Blocks correct workflow | Opportunities without principal, silent status defaults |
| **High** | Process gap - workflow incomplete or error-prone | Degrades data quality | Missing activity logging, hardcoded stages |
| **Medium** | Technical debt - suboptimal patterns | Maintenance burden | Inconsistent dates, optional required fields |

---

## Quick Reference

### Run Full Audit
```
/audit/workflow-gaps
/audit/workflow-gaps --full
```

### Run Quick Audit (Local Only)
```
/audit/workflow-gaps --quick
```

### Audit Specific Directory
```
/audit/workflow-gaps src/atomic-crm/opportunities/
/audit/workflow-gaps --quick src/atomic-crm/contacts/
```

---

## Output Summary

After completing all phases, display:

```markdown
## Workflow Gaps Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Report:** docs/audits/[AUDIT_DATE]-workflow-gaps.md
**Baseline:** docs/audits/.baseline/workflow-gaps.json (updated)

### Results

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | X | BLOCKS DEPLOYMENT |
| High | Y | Fix before PR merge |
| Medium | Z | Fix when convenient |

### Database Findings (Full Mode)

| Check | Count | Status |
|-------|-------|--------|
| Opportunities without principal | X | [OK/WARN] |
| Orphaned pipeline stages | X | [OK/WARN] |
| Contacts without organization | X | [OK/WARN] |
| Closed without reason | X | [OK/WARN] |

### Delta Summary
- **New issues:** X
- **Fixed issues:** Y
- **Net change:** +/-Z

### Todos Created
- X Critical issues added to todo list
- Y High issues added to todo list

### Next Steps
1. Review report at docs/audits/YYYY-MM-DD-workflow-gaps.md
2. Address Critical issues immediately
3. Schedule High issues for current sprint
4. Re-run audit after fixes: `/audit/workflow-gaps`
```

---

## Related Commands

- `/audit/data-integrity` - Soft deletes, Strangler Fig, view/table duality
- `/audit/security` - RLS, validation, auth
- `/audit/stale-state` - Cache invalidation, refetch patterns
- `/audit/db-hardening` - Indexes, constraints, triggers
- `/troubleshooting` - Debug specific workflow issues
