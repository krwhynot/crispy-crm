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

---

### Group 1: Database Integrity (Layer 1)

Checks for data persistence violations that affect the database layer directly.

#### Critical Severity

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `DB-C001` | Hard DELETE usage | `rg "DELETE FROM" --type ts -n $SCOPE` | Data loss |
| `DB-C002` | Direct .delete() calls | `rg "\.delete\(\)" --type ts -n $SCOPE` | Data loss |
| `DB-C003` | Writing to _summary views | `rg "\.insert\(.*_summary\|\.update\(.*_summary" --type ts -n $SCOPE` | Write fails |

#### High Severity

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `DB-H001` | Missing soft delete filter | `rg "\.from\(['\"](?!.*_summary)[^'\"]+['\"]\)" --type ts -n $SCOPE` then check for missing deleted_at | Shows deleted records |

---

### Group 2: Architecture Integrity (Layer 3)

Checks for provider-layer violations that affect system architecture.

#### Critical Severity

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `ARCH-C001` | Strangler Fig violation | See special check below | Architecture debt |

#### High Severity

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `ARCH-H001` | Deprecated company_id | `rg "company_id" --type ts -n src/atomic-crm/` | Schema violation |
| `ARCH-H002` | Direct Supabase import | `rg "from ['\"]@supabase/supabase-js['\"]" --type ts -n src/atomic-crm/` | Bypass data provider |

---

### Medium Severity (Cross-Layer)

| Check ID | Description | Command | Risk |
|----------|-------------|---------|------|
| `M001` | View-only fields in mutations | Check for computed fields in update/insert payloads | Silent data loss |
| `M002` | Missing TransformService | Updates without stripping view fields | Data corruption |

### Special Check: Strangler Fig Violation (ARCH-C001)

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
      "id": "ARCH-H001-1",
      "file": "src/atomic-crm/contacts/ContactShow.tsx",
      "line": 45,
      "check": "ARCH-H001",
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

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

### New Issues
| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| DB-C001-1 | Critical | src/foo.ts:42 | Hard DELETE found |

### Fixed Issues
| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| ARCH-H001-3 | High | src/bar.ts:15 | company_id removed |

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
  // Database Integrity (Layer 1) Critical issues
  {
    content: "[Critical] DB-C001: Remove hard DELETE in src/foo.ts:42",
    status: "pending",
    activeForm: "Removing hard DELETE statement"
  },
  // Architecture Integrity (Layer 3) High issues
  {
    content: "[High] ARCH-H001: Remove deprecated company_id in src/bar.ts:15",
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

### Database Integrity Checks (Layer 1)

#### Critical
| ID | Name | Pattern | Why Critical |
|----|------|---------|--------------|
| DB-C001 | Hard DELETE SQL | `DELETE FROM` | Permanent data loss, violates soft-delete rule |
| DB-C002 | Direct .delete() | `.delete()` | Supabase delete bypasses soft-delete |
| DB-C003 | View Writes | `insert/update.*_summary` | Views are read-only, will fail silently |

#### High
| ID | Name | Pattern | Why High |
|----|------|---------|----------|
| DB-H001 | Missing Soft Delete Filter | `.from()` without `deleted_at` | Shows deleted records to users |

### Architecture Integrity Checks (Layer 3)

#### Critical
| ID | Name | Pattern | Why Critical |
|----|------|---------|--------------|
| ARCH-C001 | Strangler Fig | Provider growth | Architecture regression, should shrink |

#### High
| ID | Name | Pattern | Why High |
|----|------|---------|----------|
| ARCH-H001 | Deprecated company_id | `company_id` | Use contact_organizations junction |
| ARCH-H002 | Direct Supabase | `@supabase/supabase-js` | Bypass data provider validation |

### Medium Checks (Cross-Layer)
| ID | Name | Description | Why Medium |
|----|------|-------------|------------|
| M001 | View Fields in Writes | Computed fields in mutations | Data ignored, potential confusion |
| M002 | Missing Transform | No TransformService usage | View fields may leak to writes |

---

## Related Resources

- **Provider Rules:** `.claude/rules/PROVIDER_RULES.md`
- **RLS Audit:** `/audit/rls-table` (run separately)
- **Full Code Review:** `/code-review`
