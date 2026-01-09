---
description: Data integrity audit (soft deletes, Strangler Fig, view/table) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), mcp__supabase__execute_sql, mcp__supabase__list_tables, TodoWrite, Write
model: sonnet
---

# Data Integrity Audit

Audit the codebase for data integrity violations including soft deletes, Strangler Fig pattern compliance, and view/table duality. Supports delta tracking against a baseline.

---

## Arguments

**$ARGUMENTS**

Parse the arguments:
- `--quick` - Skip MCP checks, local rg checks only
- `--full` - Full audit including MCP database checks (default)
- `src/path` - Scope audit to specific path

---

## Phase 1: Mode Detection

```
MODE = "full" (default)
SCOPE = "src/" (default)

If $ARGUMENTS contains "--quick":
  MODE = "quick"

If $ARGUMENTS contains a path (e.g., "src/atomic-crm/"):
  SCOPE = that path
```

---

## Phase 2: Local Code Checks (Always Run)

Execute these rg checks in parallel. Capture file:line for each finding.

### Critical Severity

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `C001` | Hard DELETE usage | `rg "DELETE FROM" --type ts -n $SCOPE` | Data loss |
| `C002` | Direct .delete() calls | `rg "\.delete\(\)" --type ts -n $SCOPE` | Data loss |
| `C003` | Writing to _summary views | `rg "\.insert\(.*_summary\|\.update\(.*_summary" --type ts -n $SCOPE` | Write fails |
| `C004` | Strangler Fig violation | See special check below | Architecture debt |

### High Severity

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `H001` | Missing soft delete filter | `rg "\.from\(['\"](?!.*_summary)[^'\"]+['\"]\)" --type ts -n $SCOPE` then check for missing deleted_at | Shows deleted records |
| `H002` | Deprecated company_id | `rg "company_id" --type ts -n src/atomic-crm/` | Schema violation |
| `H003` | Deprecated archived_at | `rg "archived_at" --type ts -n $SCOPE` | Use deleted_at |
| `H004` | Direct Supabase import | `rg "from ['\"]@supabase/supabase-js['\"]" --type ts -n src/atomic-crm/` | Bypass data provider |

### Medium Severity

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `M001` | View-only fields in mutations | Check for computed fields in update/insert payloads | Silent data loss |
| `M002` | Missing TransformService | Updates without stripping view fields | Data corruption |

### Special Check: Strangler Fig Violation (C004)

```bash
# Get current line count of unifiedDataProvider.ts
wc -l src/atomic-crm/providers/supabase/unifiedDataProvider.ts

# Get baseline from last audit
cat docs/audits/.baseline/data-integrity.json | jq '.unifiedProviderLines'
```

If current lines > baseline lines + 10: **CRITICAL violation**
If current lines > baseline lines: **WARNING - file grew**

---

## Phase 3: MCP Database Checks (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Verify View/Table Duality

```sql
-- Find tables with _summary views
SELECT
  t.table_name as base_table,
  v.table_name as summary_view,
  CASE WHEN v.table_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END as status
FROM information_schema.tables t
LEFT JOIN information_schema.views v
  ON v.table_name = t.table_name || '_summary'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE '_prisma%'
ORDER BY t.table_name;
```

### 3.2 Check for Orphaned Records

```sql
-- Foreign key violations (sample - adjust per schema)
SELECT 'opportunities' as table_name,
  COUNT(*) as orphan_count,
  'Missing principal' as issue
FROM opportunities o
WHERE o.principal_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM principals p WHERE p.id = o.principal_id);
```

### 3.3 Soft Delete Consistency

```sql
-- Tables without deleted_at column
SELECT table_name
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = t.table_name
      AND c.column_name = 'deleted_at'
  )
  AND table_name NOT IN ('schema_migrations', 'spatial_ref_sys')
ORDER BY table_name;
```

---

## Phase 4: Load Baseline

Read the baseline file if it exists:

```bash
cat docs/audits/.baseline/data-integrity.json
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
  "knownIssues": [
    {
      "id": "H002-1",
      "file": "src/atomic-crm/contacts/ContactShow.tsx",
      "line": 45,
      "check": "H002",
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

**File path:** `docs/audits/YYYY-MM-DD-data-integrity.md`

Use current date from:
```bash
date +%Y-%m-%d
```

### 5.2 Report Template

```markdown
# Data Integrity Audit Report

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

### New Issues
| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| C001-1 | Critical | src/foo.ts:42 | Hard DELETE found |

### Fixed Issues
| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| H002-3 | High | src/bar.ts:15 | company_id removed |

---

## Current Findings

### Critical
| ID | Check | Location | Evidence | Risk |
|----|-------|----------|----------|------|

### High
| ID | Check | Location | Evidence | Risk |
|----|-------|----------|----------|------|

### Medium
| ID | Check | Location | Evidence | Risk |
|----|-------|----------|----------|------|

---

## Strangler Fig Status

**unifiedDataProvider.ts:**
- Previous: X lines
- Current: Y lines
- Status: Growing / Stable / Shrinking

---

## MCP Database Checks

*(Skipped in quick mode)*

### View/Table Duality
| Base Table | Summary View | Status |
|------------|--------------|--------|

### Orphaned Records
| Table | Count | Issue |
|-------|-------|-------|

### Tables Missing deleted_at
| Table | Notes |
|-------|-------|

---

## Recommendations

1. **[Critical]** Fix X issues before merge
2. **[High]** Address Y issues in next sprint
3. **[Medium]** Technical debt - schedule cleanup

---

*Generated by /audit/data-integrity command*
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
  "knownIssues": [
    // Merge previous acknowledged issues + new findings
  ]
}
```

**File path:** `docs/audits/.baseline/data-integrity.json`

---

## Phase 7: Create TodoWrite Tasks

Create todos for Critical and High severity findings:

```typescript
TodoWrite([
  // Critical issues
  {
    content: "[Critical] C001: Remove hard DELETE in src/foo.ts:42",
    status: "pending",
    activeForm: "Removing hard DELETE statement"
  },
  // High issues
  {
    content: "[High] H002: Remove deprecated company_id in src/bar.ts:15",
    status: "pending",
    activeForm: "Removing deprecated company_id"
  }
])
```

**Rules:**
- Only create todos for Critical and High
- Include file:line in task
- Use actionable language ("Remove", "Replace", "Add")

---

## Output Summary

After completing all phases, display:

```markdown
## Audit Complete

**Report saved to:** docs/audits/YYYY-MM-DD-data-integrity.md
**Baseline updated:** docs/audits/.baseline/data-integrity.json

### Summary
| Severity | Count | Change |
|----------|-------|--------|
| Critical | X | +Y |
| High | X | -Y |
| Medium | X | -- |

### Action Items Created
- [X] todos created for Critical/High findings

### Next Steps
1. Review report at docs/audits/YYYY-MM-DD-data-integrity.md
2. Address Critical issues immediately
3. Schedule High issues for next sprint
```

---

## Check Definitions Reference

### Critical Checks
| ID | Name | Pattern | Why Critical |
|----|------|---------|--------------|
| C001 | Hard DELETE SQL | `DELETE FROM` | Permanent data loss, violates soft-delete rule |
| C002 | Direct .delete() | `.delete()` | Supabase delete bypasses soft-delete |
| C003 | View Writes | `insert/update.*_summary` | Views are read-only, will fail silently |
| C004 | Strangler Fig | Provider growth | Architecture regression, should shrink |

### High Checks
| ID | Name | Pattern | Why High |
|----|------|---------|----------|
| H001 | Missing Soft Delete Filter | `.from()` without `deleted_at` | Shows deleted records to users |
| H002 | Deprecated company_id | `company_id` | Use contact_organizations junction |
| H003 | Deprecated archived_at | `archived_at` | Use deleted_at instead |
| H004 | Direct Supabase | `@supabase/supabase-js` | Bypass data provider validation |

### Medium Checks
| ID | Name | Description | Why Medium |
|----|------|-------------|------------|
| M001 | View Fields in Writes | Computed fields in mutations | Data ignored, potential confusion |
| M002 | Missing Transform | No TransformService usage | View fields may leak to writes |

---

## Related Resources

- **Provider Rules:** `.claude/rules/PROVIDER_RULES.md`
- **RLS Audit:** `/audit/rls-table` (run separately)
- **Full Code Review:** `/code-review`
