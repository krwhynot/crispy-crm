---
description: Database hardening audit (indexes, constraints, triggers) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), mcp__supabase__execute_sql, mcp__supabase__list_tables, mcp__supabase__get_advisors, TodoWrite, Write
model: sonnet
---

# Database Hardening Audit

Comprehensive audit of database integrity, constraints, indexes, and security measures. Detects drift from last audit and generates actionable findings.

> **SKILL ACTIVATION:** Using `db-hardening` audit command with delta tracking.

---

## Architecture

```
+---------------------------------------------------------------------+
|                    DATABASE HARDENING AUDIT                          |
+---------------------------------------------------------------------+
|                                                                     |
|   Phase 1: MODE DETECTION                                           |
|            └── Parse $ARGUMENTS for --quick or --full               |
|                                                                     |
|   Phase 2: MIGRATION FILE CHECKS (Always Run)                       |
|            └── rg patterns in supabase/migrations/                  |
|                                                                     |
|   Phase 3: LIVE DB CHECKS (Skip in Quick Mode)                      |
|            └── mcp__supabase__execute_sql queries                   |
|            └── mcp__supabase__get_advisors                          |
|                                                                     |
|   Phase 4: BASELINE COMPARISON                                      |
|            └── Load docs/audits/.baseline/db-hardening.json         |
|            └── Calculate delta (new issues, fixed issues)           |
|                                                                     |
|   Phase 5: REPORT GENERATION                                        |
|            └── Write to docs/audits/YYYY-MM-DD-db-hardening.md      |
|                                                                     |
|   Phase 6: BASELINE UPDATE                                          |
|            └── Update docs/audits/.baseline/db-hardening.json       |
|                                                                     |
|   Phase 7: TODO CREATION                                            |
|            └── Create TodoWrite tasks for Critical/High findings    |
|                                                                     |
+---------------------------------------------------------------------+
```

---

## Phase 1: Mode Detection

**Parse `$ARGUMENTS` to determine audit mode:**

```
IF $ARGUMENTS contains "--quick":
  mode = "quick"
  skip_live_db_checks = true
ELSE:
  mode = "full"
  skip_live_db_checks = false
```

**Mode Comparison:**

| Check | Quick Mode | Full Mode |
|-------|------------|-----------|
| Migration file patterns | Yes | Yes |
| Live DB queries (MCP) | No | Yes |
| Supabase advisors | No | Yes |
| Baseline comparison | Yes | Yes |

---

## Phase 2: Migration File Checks (Always Run)

**Run these searches in parallel:**

### 2.1 Foreign Key CASCADE Patterns
```bash
rg "REFERENCES.*ON DELETE" supabase/migrations/ --type sql
rg "ON DELETE RESTRICT" supabase/migrations/ --type sql
rg "ON DELETE SET NULL" supabase/migrations/ --type sql
rg "ON DELETE CASCADE" supabase/migrations/ --type sql
```

**Analysis:**
- Count FK definitions by delete behavior
- Flag any FKs without CASCADE (potential orphaned records)

### 2.2 RLS Patterns
```bash
rg "ENABLE ROW LEVEL SECURITY" supabase/migrations/ --type sql -c
rg "CREATE POLICY" supabase/migrations/ --type sql -c
rg "DROP POLICY" supabase/migrations/ --type sql -c
```

**Analysis:**
- Tables with RLS enabled
- Policy coverage (CRUD operations)

### 2.3 Index Patterns
```bash
rg "CREATE INDEX" supabase/migrations/ --type sql
rg "CREATE UNIQUE INDEX" supabase/migrations/ --type sql
```

### 2.4 Constraint Patterns
```bash
rg "NOT NULL" supabase/migrations/ --type sql -c
rg "CHECK\s*\(" supabase/migrations/ --type sql
rg "UNIQUE\s*\(" supabase/migrations/ --type sql
```

### 2.5 Trigger Patterns
```bash
rg "CREATE TRIGGER" supabase/migrations/ --type sql
rg "updated_at" supabase/migrations/ --type sql
```

### 2.6 String Length Limits
```bash
rg "VARCHAR\(\d+\)" supabase/migrations/ --type sql
rg "TEXT" supabase/migrations/ --type sql
```

### 2.7 View Duality Code Patterns

**Verify feature code reads from `*_summary` views, not base tables:**

| Check ID | Description | Command | Severity |
|----------|-------------|---------|----------|
| `VIEW-001` | Read from base contacts table | `rg "\.from\(['\"]contacts['\"]" --type ts -n src/atomic-crm/ --glob '!**/providers/**'` | High |
| `VIEW-002` | Read from base opportunities table | `rg "\.from\(['\"]opportunities['\"]" --type ts -n src/atomic-crm/ --glob '!**/providers/**'` | High |
| `VIEW-003` | Read from base organizations table | `rg "\.from\(['\"]organizations['\"]" --type ts -n src/atomic-crm/ --glob '!**/providers/**'` | High |

**Rationale:** Reads should use `*_summary` views for pre-calculated fields (computed stats, denormalized joins). Provider handlers are excluded since they correctly route reads to views and writes to base tables.

**Severity:** High
**Risk:** Missing computed fields, inconsistent data representation, N+1 query patterns

---

## Phase 3: Live DB Checks (Full Mode Only)

**Skip this phase if mode == "quick"**

### 3.1 Tables Without RLS
```sql
-- mcp__supabase__execute_sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
);
```

**Severity:** Critical
**Risk:** Data exposure without row-level security

### 3.2 Foreign Keys Without CASCADE
```sql
-- mcp__supabase__execute_sql
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  CASE confdeltype
    WHEN 'c' THEN 'CASCADE'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    WHEN 'a' THEN 'NO ACTION'
  END AS on_delete
FROM pg_constraint
WHERE contype = 'f'
AND confdeltype != 'c'
ORDER BY conrelid::regclass::text;
```

**Severity:** Critical
**Risk:** Orphaned records on delete

### 3.3 Missing Indexes on Foreign Keys
```sql
-- mcp__supabase__execute_sql
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND NOT EXISTS (
  SELECT 1 FROM pg_indexes pi
  WHERE pi.tablename = tc.table_name
  AND pi.indexdef LIKE '%' || kcu.column_name || '%'
);
```

**Severity:** High
**Risk:** Slow join performance

**Performance Note:** Junction tables with dual EXISTS checks in RLS policies MUST have indexes on both foreign keys. Without indexes, INSERT operations will perform full table scans and severely degrade write performance.

Required indexes pattern:
```sql
CREATE INDEX idx_contact_organizations_contact_id
  ON contact_organizations (contact_id)
  WHERE (deleted_at IS NULL);

CREATE INDEX idx_contact_organizations_organization_id
  ON contact_organizations (organization_id)
  WHERE (deleted_at IS NULL);
```

### 3.4 Junction Table Policies Missing Dual Authorization
```sql
-- mcp__supabase__execute_sql
SELECT
  p.tablename,
  p.policyname,
  p.qual
FROM pg_policies p
WHERE p.tablename LIKE '%\_%'  -- Junction tables (have underscore)
  AND p.cmd = 'INSERT'
  AND (p.qual NOT LIKE '%EXISTS%' OR p.qual NOT LIKE '%SELECT%');
```

**Severity:** Critical
**Risk:** Users can link unauthorized records across tenants. Junction tables require EXISTS checks on BOTH foreign keys to verify user owns both sides of the relationship.

**Rationale:** A junction table policy like this is WRONG:
```sql
CREATE POLICY "Allow contact_organizations inserts"
  ON contact_organizations FOR INSERT
  USING (true);  -- Missing authorization!
```

Should verify BOTH sides:
```sql
CREATE POLICY "Users can link own company contacts and orgs"
  ON contact_organizations FOR INSERT
  WITH CHECK (
    -- User must own the contact
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = contact_organizations.contact_id
      AND company_id = (auth.jwt() ->> 'company_id')::int
    )
    AND
    -- User must own the organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = contact_organizations.organization_id
      AND company_id = (auth.jwt() ->> 'company_id')::int
    )
  );
```

### 3.5 Unbounded String Columns
```sql
-- mcp__supabase__execute_sql
SELECT
  table_name,
  column_name,
  data_type,
  CASE
    WHEN character_maximum_length IS NULL THEN 'UNBOUNDED'
    ELSE character_maximum_length::text
  END AS max_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type IN ('text', 'character varying')
AND character_maximum_length IS NULL
ORDER BY table_name, column_name;
```

**Severity:** High
**Risk:** Unbounded storage, potential DoS

### 3.5 Tables Without Soft Delete
```sql
-- mcp__supabase__execute_sql
SELECT table_name
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND NOT EXISTS (
  SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = t.table_schema
  AND c.table_name = t.table_name
  AND c.column_name = 'deleted_at'
);
```

**Severity:** Medium
**Risk:** Data safety (hard deletes)

### 3.6 Tables Without Updated_at Trigger
```sql
-- mcp__supabase__execute_sql
SELECT t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND EXISTS (
  SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = t.table_schema
  AND c.table_name = t.table_name
  AND c.column_name = 'updated_at'
)
AND NOT EXISTS (
  SELECT 1 FROM pg_trigger tr
  JOIN pg_class pc ON tr.tgrelid = pc.oid
  JOIN pg_namespace pn ON pc.relnamespace = pn.oid
  WHERE pn.nspname = 'public'
  AND pc.relname = t.table_name
  AND tr.tgname LIKE '%updated_at%'
);
```

**Severity:** Medium
**Risk:** Audit trail gaps

### 3.7 Supabase Advisors
```
-- mcp__supabase__get_advisors with type: "security"
-- mcp__supabase__get_advisors with type: "performance"
```

**Severity:** Varies (based on advisor output)
**Risk:** Security vulnerabilities, performance issues

---

## Phase 4: Baseline Comparison

### 4.1 Load Previous Baseline
```
Read: docs/audits/.baseline/db-hardening.json
```

**Expected structure:**
```json
{
  "lastAuditDate": "2025-01-07",
  "lastAuditMode": "full",
  "findings": {
    "critical": [
      {"id": "no-rls-table-x", "table": "table_x", "issue": "No RLS policies"}
    ],
    "high": [],
    "medium": []
  },
  "counts": {
    "critical": 1,
    "high": 0,
    "medium": 0
  }
}
```

### 4.2 Calculate Delta

For each finding in current audit:
1. Check if it exists in baseline by matching `id` field
2. If NOT in baseline: mark as `new`
3. If IN baseline: mark as `existing`

For each finding in baseline:
1. Check if it exists in current audit
2. If NOT in current: mark as `fixed`

**Delta output:**
```json
{
  "newIssues": [...],
  "fixedIssues": [...],
  "existingIssues": [...]
}
```

---

## Phase 5: Report Generation

**Generate report and save to:** `docs/audits/YYYY-MM-DD-db-hardening.md`

```bash
date=$(date +%Y-%m-%d)
# Write to: docs/audits/${date}-db-hardening.md
```

### Report Template

```markdown
# Database Hardening Audit Report

**Date:** [YYYY-MM-DD]
**Mode:** [Quick/Full]
**Previous Audit:** [YYYY-MM-DD or "First audit"]

---

## Executive Summary

| Severity | Previous | Current | Delta |
|----------|----------|---------|-------|
| Critical | X | Y | +/-Z |
| High | X | Y | +/-Z |
| Medium | X | Y | +/-Z |
| **Total** | X | Y | +/-Z |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

---

## Delta from Last Audit

### New Issues Since Last Audit
| Severity | Issue | Table/Object | Risk |
|----------|-------|--------------|------|
| [severity] | [description] | [table] | [risk] |

### Fixed Issues Since Last Audit
| Severity | Issue | Table/Object |
|----------|-------|--------------|
| [severity] | [description] | [table] |

---

## Current Findings

### Critical (Data Safety)

#### No RLS Policies
| Table | Status | Risk |
|-------|--------|------|
| [table] | Missing RLS | Data exposure |

#### Foreign Keys Without CASCADE
| Constraint | Table | Referenced Table | Current Behavior |
|------------|-------|------------------|------------------|
| [name] | [table] | [ref_table] | [RESTRICT/NO ACTION] |

---

### High (Performance/Integrity)

#### Missing Indexes on Foreign Keys
| Table | Column | Impact |
|-------|--------|--------|
| [table] | [fk_column] | Slow joins |

#### Unbounded String Columns
| Table | Column | Type |
|-------|--------|------|
| [table] | [column] | text/varchar |

---

### Medium (Best Practices)

#### Tables Without Soft Delete
| Table | Impact |
|-------|--------|
| [table] | Hard deletes possible |

#### Tables Without Updated_at Trigger
| Table | Impact |
|-------|--------|
| [table] | Audit trail gaps |

---

## Supabase Advisor Findings

### Security Advisors
[List from mcp__supabase__get_advisors]

### Performance Advisors
[List from mcp__supabase__get_advisors]

---

## Recommendations

### Immediate Actions (Critical)
1. [Action 1]
2. [Action 2]

### Short-term Actions (High)
1. [Action 1]
2. [Action 2]

### Best Practice Improvements (Medium)
1. [Action 1]
2. [Action 2]

---

## Appendix: Migration File Analysis

### FK Delete Behaviors
- CASCADE: [count]
- RESTRICT: [count]
- SET NULL: [count]
- NO ACTION: [count]

### RLS Coverage
- Tables with RLS: [count]
- Policies created: [count]

### Index Coverage
- Standard indexes: [count]
- Unique indexes: [count]

---

*Generated by `/audit/db-hardening` command*
```

---

## Phase 6: Baseline Update

**Update baseline file:** `docs/audits/.baseline/db-hardening.json`

```json
{
  "lastAuditDate": "YYYY-MM-DD",
  "lastAuditMode": "quick|full",
  "findings": {
    "critical": [
      {
        "id": "no-rls-{table}",
        "table": "table_name",
        "issue": "No RLS policies",
        "firstSeen": "YYYY-MM-DD"
      }
    ],
    "high": [
      {
        "id": "no-fk-index-{table}-{column}",
        "table": "table_name",
        "column": "column_name",
        "issue": "Missing FK index",
        "firstSeen": "YYYY-MM-DD"
      }
    ],
    "medium": [
      {
        "id": "no-soft-delete-{table}",
        "table": "table_name",
        "issue": "No deleted_at column",
        "firstSeen": "YYYY-MM-DD"
      }
    ]
  },
  "counts": {
    "critical": 0,
    "high": 0,
    "medium": 0
  }
}
```

**ID Generation Rules:**
- `no-rls-{table}` - Table without RLS
- `fk-no-cascade-{constraint}` - FK without CASCADE
- `no-fk-index-{table}-{column}` - Missing FK index
- `unbounded-string-{table}-{column}` - Unbounded string
- `no-soft-delete-{table}` - No deleted_at
- `no-updated-trigger-{table}` - No updated_at trigger

---

## Phase 7: TodoWrite Creation

**Create todos for Critical and High findings only:**

```typescript
// Only create todos for NEW issues (not existing ones)
const todos = [];

for (const issue of delta.newIssues) {
  if (issue.severity === 'critical' || issue.severity === 'high') {
    todos.push({
      content: `[${issue.severity.toUpperCase()}] ${issue.issue} - ${issue.table}`,
      status: "pending",
      activeForm: `Fixing ${issue.issue}`
    });
  }
}

TodoWrite(todos);
```

**Example todos:**
```typescript
[
  {
    content: "[CRITICAL] Add RLS policies to user_settings table",
    status: "pending",
    activeForm: "Adding RLS policies to user_settings"
  },
  {
    content: "[HIGH] Add index on opportunities.principal_id FK",
    status: "pending",
    activeForm: "Adding index on opportunities.principal_id"
  }
]
```

---

## Severity Definitions

| Severity | Definition | Examples | Action Required |
|----------|------------|----------|-----------------|
| **Critical** | Data safety/security risk | Missing RLS, orphan-risk FKs | Immediate fix |
| **High** | Performance or integrity | Missing FK indexes, unbounded strings | Fix within sprint |
| **Medium** | Best practices | No soft delete, missing triggers | Plan for future |

---

## Quick Reference

### Run Full Audit
```
/audit/db-hardening --full
```

### Run Quick Audit (Migration Files Only)
```
/audit/db-hardening --quick
```

### Default (Full Mode)
```
/audit/db-hardening
```

---

## Output Files

| File | Purpose |
|------|---------|
| `docs/audits/YYYY-MM-DD-db-hardening.md` | Human-readable report |
| `docs/audits/.baseline/db-hardening.json` | Machine-readable baseline for delta tracking |

---

## Related Commands

- `/rls-table` - RLS permissions matrix
- `/audit/deep-audit` - Full codebase audit (includes DB)
- `mcp__supabase__get_advisors` - Supabase security/performance advisors
