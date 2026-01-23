---
description: Security audit (RLS, validation, auth) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), mcp__supabase__get_advisors, mcp__supabase__execute_sql, TodoWrite, Write
model: sonnet
---

# Security Audit Command

You are performing a security audit for Crispy CRM. This command systematically checks for security vulnerabilities, validation gaps, and auth issues with delta tracking against previous audits.

## Arguments

**$ARGUMENTS**

- `--quick` - Skip MCP checks, run only local rg patterns (faster)
- `--full` - Run all checks including MCP advisors and SQL queries (default)
- `src/path` - Limit scope to specific directory

---

## Phase 1: Mode Detection and Setup

### 1.1 Parse Arguments

```
MODE = "full" (default)
SCOPE = "src/atomic-crm/ src/components/"

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

## Phase 2: Local Security Checks (Always Run)

Run these `rg` patterns and collect findings. Each finding should include:
- File path and line number
- Code snippet (context)
- Severity level
- Risk description

### Critical Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| C1 | Missing Zod .max() | `rg "z\.string\(\)" --type ts src/atomic-crm/validation/ -n` then filter lines without `.max(` | DoS via unbounded strings |
| C2 | Direct Supabase imports | `rg "from ['\"]@supabase/supabase-js['\"]" --type ts src/atomic-crm/ src/components/ -n` | Auth bypass risk |
| C3 | XSS vulnerabilities | `rg "dangerouslySetInnerHTML" --type tsx src/ -n` | XSS attack vector |
| C4 | z.object without .strict() | Step 1: `rg "z\.object\(" --type ts src/atomic-crm/validation/ -n` Step 2: Filter lines lacking `.strict()` method chain or `z.strictObject` | Mass assignment vulnerability |
| C5 | Hardcoded secrets | `rg "sk_live\|pk_live\|password\s*=\s*['\"][^'\"]+['\"]" --type ts src/ -n` | Credential leak |
| C6 | eval() usage | `rg "eval\(" --type ts src/ -n` | Code injection |
| C7 | Exposed API keys | `rg "api_key\s*=\s*['\"][^'\"]+['\"]" --type ts src/ -n` | Credential leak |
| C8 | z.any() escape hatch | `rg "z\.any\(\)" --type ts src/atomic-crm/ -n` | Type safety bypass |

### High Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| H1 | SQL injection patterns | `rg "\.rpc\([^)]*\$\{" --type ts src/ -n` | SQL injection |
| H2 | Template literal in SQL | `rg "supabase.*\`.*\$\{" --type ts src/ -n` | SQL injection |
| H3 | Missing auth hooks | `rg "export (default function\|const) \w+(Page\|View\|Panel)" --type tsx src/atomic-crm/` then check for useGetIdentity | Unauthorized access |
| H4 | Deprecated company_id | `rg "company_id" --type ts src/atomic-crm/ -n` | Data model violation |
| H5 | Deprecated archived_at | `rg "archived_at" --type ts src/atomic-crm/ -n` | Use deleted_at instead |
| H6 | Hard DELETE statements | `rg "DELETE FROM" --type ts src/ -n` | Soft delete violation |

### Medium Severity Checks

| ID | Check | Command | Risk |
|----|-------|---------|------|
| M1 | Console.log with data | `rg "console\.(log\|debug\|info)\(" --type ts src/atomic-crm/ -n` | Data leakage in logs |
| M2 | Missing z.coerce | `rg "z\.(number\|date\|boolean)\(\)" --type ts src/atomic-crm/validation/ -n` then filter lines without `.coerce` | Type coercion issues |
| M3 | Inline styles | `rg "style=\{\{" --type tsx src/ -n` | CSP bypass potential |

---

## Phase 3: MCP Security Checks (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Supabase Security Advisors

```
mcp__supabase__get_advisors type: "security"
```

Record all findings with:
- Advisory code
- Severity
- Description
- Remediation URL

### 3.2 RLS Policy Coverage

```sql
mcp__supabase__execute_sql query:
SELECT
  schemaname,
  tablename,
  CASE WHEN policyname IS NULL THEN 'NO RLS' ELSE 'Has RLS' END as rls_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE '_prisma%'
GROUP BY t.schemaname, t.tablename, p.policyname
HAVING policyname IS NULL;
```

Any table returned has NO RLS policies - this is Critical severity.

### 3.3 Auth Schema Integrity

```sql
mcp__supabase__execute_sql query:
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('created_by', 'updated_by', 'sales_id')
  AND table_name NOT IN ('sales', 'audit_log');
```

Verify FK columns exist for RLS enforcement.

---

## Phase 4: Delta Tracking

### 4.1 Load Previous Baseline

```
Read: docs/audits/.baseline/security.json
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
      "id": "C1-001",
      "severity": "critical",
      "check": "Missing Zod .max()",
      "location": "src/atomic-crm/validation/contacts.ts:45",
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

Save to: `docs/audits/YYYY-MM-DD-security.md`

```markdown
# Security Audit Report

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
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

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

#### [C1] Missing Zod .max() - DoS Risk

**Files Affected:**
- `src/atomic-crm/validation/file.ts:123` - `z.string()` without `.max()`

**Risk:** Unbounded string inputs can cause memory exhaustion (DoS).

**Fix:** Add `.max(N)` to all `z.string()` calls. Recommended limits:
- Names: 255 characters
- Descriptions: 5000 characters
- URLs: 2048 characters

---

### High (Fix Before PR Merge)

#### [H1] SQL Injection Pattern

**Files Affected:**
- `src/file.ts:45` - Template literal in RPC call

**Risk:** User input may be interpolated into SQL.

**Fix:** Use parameterized queries or Supabase filters.

---

### Medium (Fix When Convenient)

[List medium findings in similar format]

---

## MCP Advisory Findings

[Only if MODE = "full"]

### Supabase Security Advisors

| Code | Severity | Description | Remediation |
|------|----------|-------------|-------------|
| [code] | [sev] | [desc] | [URL] |

### Tables Without RLS

| Table | Status | Recommendation |
|-------|--------|----------------|
| [table] | NO RLS | Add SELECT/INSERT/UPDATE/DELETE policies |

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

## Appendix: Check Definitions

| ID | Check | Pattern | Severity |
|----|-------|---------|----------|
| C1 | Missing Zod .max() | `z.string()` without `.max(` | Critical |
| C2 | Direct Supabase imports | `from "@supabase/supabase-js"` | Critical |
| ... | ... | ... | ... |

---

*Generated by /audit/security command*
*Report location: docs/audits/YYYY-MM-DD-security.md*
```

### 5.2 Update Baseline JSON

Write to: `docs/audits/.baseline/security.json`

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
    content: "[Critical] Fix missing Zod .max() in contacts.ts:45",
    status: "pending",
    activeForm: "Fixing Zod validation"
  },
  {
    content: "[Critical] Remove direct Supabase import in api.ts:12",
    status: "pending",
    activeForm: "Removing direct Supabase import"
  },
  // High findings
  {
    content: "[High] Fix SQL injection pattern in rpc.ts:67",
    status: "pending",
    activeForm: "Fixing SQL injection"
  },
  // ...
])
```

### 6.2 Summary Output

Display summary to user:

```markdown
## Security Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Report:** docs/audits/[AUDIT_DATE]-security.md
**Baseline:** docs/audits/.baseline/security.json (updated)

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

### Next Steps
[List recommended actions based on findings]
```

---

## Severity Definitions

| Level | Definition | Impact | Examples |
|-------|------------|--------|----------|
| **Critical** | Security vulnerability that could lead to data breach, auth bypass, or system compromise | Blocks deployment | XSS, SQL injection, missing RLS, credential exposure |
| **High** | Security weakness that increases attack surface or violates security patterns | Fix before PR merge | Deprecated patterns, missing auth checks, hard deletes |
| **Medium** | Suboptimal security practice that should be addressed | Fix when convenient | Console logging, missing coercion, inline styles |

---

## Quick Reference

### Run Full Audit
```
/audit/security
/audit/security --full
```

### Run Quick Audit (Local Only)
```
/audit/security --quick
```

### Audit Specific Directory
```
/audit/security src/atomic-crm/validation/
/audit/security --quick src/atomic-crm/contacts/
```

---

## Related Commands

- `/audit/deep` - Full codebase audit (architecture + security + UI/UX)
- `/code-review` - Deep dive code review with parallel agents
- `/troubleshooting` - Debug specific issues with MCP diagnostics
