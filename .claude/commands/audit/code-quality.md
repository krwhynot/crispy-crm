---
description: Code quality audit (DRY, complexity, cohesion) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), Bash(wc:*), TodoWrite, Write
model: sonnet
---

# Code Quality Audit Command

You are performing a code quality audit for Crispy CRM. This command systematically checks for maintainability issues, DRY violations, complexity hotspots, and technical debt with delta tracking against previous audits.

## Arguments

**$ARGUMENTS**

- `--quick` - Skip metrics collection, run only local rg patterns (faster)
- `--full` - Run all checks including file size analysis and metrics (default)
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

## Phase 2: Local Code Quality Checks (Always Run)

Run these patterns and collect findings. Each finding should include:
- File path and line number
- Code snippet (context)
- Severity level
- Risk description

### High Severity Checks (Maintainability Risk)

| ID | Check | Command | Risk |
|----|-------|---------|------|
| H1 | Large files (>500 lines) | `wc -l src/atomic-crm/**/*.ts src/atomic-crm/**/*.tsx src/components/**/*.ts src/components/**/*.tsx 2>/dev/null \| sort -rn \| head -20` | Maintainability - files too large to reason about |
| H2 | Deep nesting (>4 levels) | `rg "^(\s{16,})[^\s]" --type ts -n $SCOPE` | Readability - excessive indentation indicates complexity |
| H3 | Long functions (>50 lines) | Analyze functions with `rg "^(export )?(async )?(function\|const \w+ = (\([^)]*\) =>))" --type ts -n $SCOPE` then check function length | Single responsibility violation |
| H4 | Duplicated code blocks | Compare similar patterns across files in same feature | DRY violation - maintenance nightmare |
| H5 | God objects | Check for files with >10 exported functions/constants | Cohesion issue - module does too much |

### Medium Severity Checks (Technical Debt)

| ID | Check | Command | Risk |
|----|-------|---------|------|
| M1 | Magic numbers | `rg "[^0-9a-zA-Z_][0-9]{2,}[^0-9a-zA-Z_px%em]" --type ts -n $SCOPE` (exclude common values like 0, 1, 100, 1000) | Maintainability - unclear intent |
| M2 | TODO/FIXME comments | `rg "TODO\|FIXME\|HACK\|XXX\|OPTIMIZE" --type ts -n $SCOPE` | Technical debt markers |
| M3 | Commented-out code | `rg "^\s*//.*\b(function\|const\|let\|var\|return\|if\|for\|while)\b" --type ts -n $SCOPE` | Dead code |
| M4 | Empty catch blocks | `rg "catch\s*\([^)]*\)\s*\{\s*\}" --type ts -n $SCOPE` | Silent failures - violates fail-fast |
| M5 | Multiple returns in function | Functions with >3 return statements | Complexity indicator |
| M6 | Hardcoded strings | `rg '"\w{20,}"' --type ts -n $SCOPE` (long inline strings) | Should be constants |

### Low Severity Checks (Polish)

| ID | Check | Command | Risk |
|----|-------|---------|------|
| L1 | Inconsistent naming | Check for camelCase vs snake_case mix in same file | Convention violation |
| L2 | Missing JSDoc on exports | `rg "^export (const\|function\|class)" --type ts -n $SCOPE` then check for preceding JSDoc | Documentation gap |
| L3 | Console statements | `rg "console\.(log\|debug\|info\|warn)" --type ts -n $SCOPE` | Should use logger |
| L4 | Unused imports | Look for imports that appear only once (in import statement) | Bundle bloat |
| L5 | Long parameter lists | Functions with >4 parameters | Should use options object |

---

## Phase 3: Metrics Collection (Full Mode Only)

**Skip this phase if MODE = "quick"**

### 3.1 Line Count Metrics

```bash
# Total lines of code (excluding node_modules, dist, .git)
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1

# Files by size
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -30
```

Collect:
- Total lines of code
- Number of TypeScript/TSX files
- Average lines per file
- Median file size
- Files over 500 lines (count)
- Files over 300 lines (count)

### 3.2 Complexity Hotspots

Identify the top 10 most complex files based on:
1. Line count
2. Number of functions
3. Import count (dependencies)
4. Nesting depth

Calculate a simple complexity score:
```
score = (lines / 100) + (functions * 2) + (imports * 0.5) + (maxNesting * 3)
```

### 3.3 Technical Debt Metrics

Count occurrences:
```bash
# TODO/FIXME count
rg "TODO|FIXME|HACK|XXX" --type ts -c $SCOPE | awk -F: '{sum += $2} END {print sum}'

# Magic numbers (approximate)
rg "[^0-9a-zA-Z_][0-9]{3,}[^0-9a-zA-Z_px%em]" --type ts -c $SCOPE | awk -F: '{sum += $2} END {print sum}'

# Empty catch blocks
rg "catch\s*\([^)]*\)\s*\{\s*\}" --type ts -c $SCOPE | awk -F: '{sum += $2} END {print sum}'
```

---

## Phase 4: Delta Tracking

### 4.1 Load Previous Baseline

```
Read: docs/audits/.baseline/code-quality.json
```

Expected format:
```json
{
  "lastAuditDate": "2025-01-08",
  "mode": "full",
  "scope": "src/",
  "metrics": {
    "totalLOC": 15000,
    "fileCount": 120,
    "avgFileSize": 125,
    "filesOver500Lines": 3,
    "filesOver300Lines": 12,
    "todoCount": 25,
    "magicNumberCount": 15,
    "emptyCatchCount": 2
  },
  "findings": {
    "high": 5,
    "medium": 20,
    "low": 35
  },
  "issues": [
    {
      "id": "H1-001",
      "severity": "high",
      "check": "Large files",
      "location": "src/atomic-crm/providers/supabase/unifiedDataProvider.ts",
      "value": 650,
      "firstSeen": "2025-01-01",
      "status": "open"
    }
  ],
  "complexityHotspots": [
    {
      "file": "src/atomic-crm/providers/supabase/unifiedDataProvider.ts",
      "score": 45,
      "lines": 650,
      "functions": 15,
      "imports": 20
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

### 4.3 Compare Metrics

Calculate delta for each metric:
- totalLOC: current - previous
- filesOver500Lines: current - previous
- todoCount: current - previous
- etc.

---

## Phase 5: Generate Report

### 5.1 Create Markdown Report

Save to: `docs/audits/YYYY-MM-DD-code-quality.md`

```markdown
# Code Quality Audit Report

**Date:** [AUDIT_DATE]
**Mode:** [Quick/Full]
**Scope:** [SCOPE]
**Auditor:** Claude Code (automated)

---

## Metrics Summary

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Total LOC | X | Y | +/-Z |
| File Count | X | Y | +/-Z |
| Avg File Size | X | Y | +/-Z |
| Files > 500 lines | X | Y | +/-Z |
| Files > 300 lines | X | Y | +/-Z |
| TODO/FIXME count | X | Y | +/-Z |
| Magic Numbers | X | Y | +/-Z |
| Empty Catch Blocks | X | Y | +/-Z |

**Trend:** [IMPROVING / STABLE / DEGRADING]

---

## Executive Summary

| Severity | Previous | Current | Delta |
|----------|----------|---------|-------|
| High | X | Y | +Z/-W |
| Medium | X | Y | +Z/-W |
| Low | X | Y | +Z/-W |
| **Total** | X | Y | +Z/-W |

**Status:** [PASS if 0 High, WARN if High exists]

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

## Complexity Hotspots

*(Full mode only)*

Top 10 most complex files requiring attention:

| Rank | File | Lines | Functions | Imports | Score |
|------|------|-------|-----------|---------|-------|
| 1 | src/file.ts | 650 | 15 | 20 | 45 |
| 2 | src/file2.ts | 400 | 12 | 15 | 32 |
| ... | ... | ... | ... | ... | ... |

### Hotspot Analysis

#### #1: src/atomic-crm/providers/supabase/unifiedDataProvider.ts

**Metrics:**
- Lines: 650
- Functions: 15
- Imports: 20
- Complexity Score: 45

**Issues Found:**
- Exceeds 500 line limit by 150 lines
- Contains business logic that should be in Service layer
- High coupling (20 imports)

**Recommendation:** Consider splitting into domain-specific handlers per Strangler Fig pattern.

---

## Current Findings

### High (Maintainability Risk)

These issues significantly impact maintainability and SHOULD be addressed.

#### [H1] Large Files (>500 lines)

**Files Affected:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - 650 lines
- `src/atomic-crm/opportunities/OpportunityCreate.tsx` - 520 lines

**Risk:** Files this large are difficult to understand, test, and modify safely.

**Fix:** Split into smaller, focused modules. Consider:
- Extract utility functions
- Split by domain responsibility
- Create sub-components

---

#### [H2] Deep Nesting (>4 levels)

**Files Affected:**
- `src/file.ts:45` - 6 levels of indentation

**Risk:** Deep nesting indicates complex control flow that is hard to follow.

**Fix:** Extract nested logic into separate functions, use early returns.

```typescript
// WRONG: Deep nesting
if (condition1) {
  if (condition2) {
    if (condition3) {
      if (condition4) {
        // Logic buried 4 levels deep
      }
    }
  }
}

// CORRECT: Early returns
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
if (!condition4) return;
// Logic at top level
```

---

### Medium (Technical Debt)

#### [M1] Magic Numbers

**Files Affected:**
- `src/file.ts:23` - `setTimeout(() => {}, 3000)`
- `src/file2.ts:67` - `if (items.length > 50)`

**Risk:** Numbers without context are hard to understand and change.

**Fix:** Extract to named constants.

```typescript
// WRONG
setTimeout(() => {}, 3000);

// CORRECT
const DEBOUNCE_MS = 3000;
setTimeout(() => {}, DEBOUNCE_MS);
```

---

#### [M2] TODO/FIXME Comments

**Files Affected (count by priority):**
- TODO: X occurrences
- FIXME: Y occurrences
- HACK: Z occurrences

**Sample Locations:**
- `src/file.ts:12` - `// TODO: Add error handling`
- `src/file2.ts:34` - `// FIXME: This is a workaround`

**Risk:** Technical debt markers indicate incomplete or problematic code.

**Fix:** Address or create tickets for each TODO/FIXME.

---

#### [M4] Empty Catch Blocks

**Files Affected:**
- `src/file.ts:89` - `catch (error) { }`

**Risk:** Silent failures violate fail-fast principle. Errors are swallowed.

**Fix:** At minimum, log the error. Better: throw or handle explicitly.

```typescript
// WRONG: Silent failure
try {
  riskyOperation();
} catch (error) { }

// CORRECT: Fail fast
try {
  riskyOperation();
} catch (error) {
  throw new Error(`Operation failed: ${error}`);
}
```

---

### Low (Polish)

#### [L2] Missing JSDoc on Exports

**Files Affected:**
- `src/utils/file.ts` - 5 exports without JSDoc

**Risk:** Reduced developer experience, harder to understand API.

**Fix:** Add JSDoc to all public exports.

```typescript
/**
 * Formats a date for display in the UI.
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Jan 8, 2025")
 */
export function formatDate(date: Date): string { ... }
```

---

#### [L3] Console Statements

**Files Affected:**
- `src/file.ts:23` - `console.log("debug")`

**Risk:** Console output in production, potential data leakage.

**Fix:** Remove or replace with proper logger.

---

## Recommendations

### Immediate Actions (High)
1. **Split large files:** Start with unifiedDataProvider.ts using Strangler Fig pattern
2. **Flatten deep nesting:** Use early returns and extract functions
3. **Fix empty catch blocks:** Add error logging or re-throw

### Short-Term (Medium)
1. **Extract magic numbers:** Create constants file per feature
2. **Address TODO/FIXME backlog:** Create tickets or resolve
3. **Remove commented code:** If it's needed, uncomment; otherwise delete

### Technical Debt (Low)
1. **Add JSDoc to public APIs:** Start with most-used utilities
2. **Remove console statements:** Use structured logging
3. **Standardize naming conventions:** Pick camelCase consistently

---

## Code Health Trends

*(Full mode only)*

### LOC Trend

| Date | Total LOC | Files > 500 | TODO Count |
|------|-----------|-------------|------------|
| [Previous] | X | Y | Z |
| [Current] | X | Y | Z |
| **Trend** | +/-X | +/-Y | +/-Z |

### Health Score

```
Health Score = 100 - (high_issues * 10) - (medium_issues * 3) - (low_issues * 1) - (files_over_500 * 5)
```

**Previous Score:** X/100
**Current Score:** Y/100
**Change:** +/-Z

---

## Appendix: Check Definitions

| ID | Check | Pattern | Severity |
|----|-------|---------|----------|
| H1 | Large files | >500 lines | High |
| H2 | Deep nesting | >4 indentation levels | High |
| H3 | Long functions | >50 lines | High |
| H4 | Duplicated code | Similar patterns across files | High |
| H5 | God objects | >10 exports per file | High |
| M1 | Magic numbers | Inline numeric literals | Medium |
| M2 | TODO/FIXME | Debt markers in code | Medium |
| M3 | Commented code | `// function/const/return` | Medium |
| M4 | Empty catch | `catch { }` | Medium |
| M5 | Multiple returns | >3 returns per function | Medium |
| M6 | Hardcoded strings | Long inline strings | Medium |
| L1 | Inconsistent naming | Mixed conventions | Low |
| L2 | Missing JSDoc | Exports without docs | Low |
| L3 | Console statements | `console.log/debug/info` | Low |
| L4 | Unused imports | Imported but not used | Low |
| L5 | Long parameter lists | >4 parameters | Low |

---

*Generated by /audit/code-quality command*
*Report location: docs/audits/YYYY-MM-DD-code-quality.md*
```

### 5.2 Update Baseline JSON

Write to: `docs/audits/.baseline/code-quality.json`

```json
{
  "lastAuditDate": "[AUDIT_DATE]",
  "mode": "[MODE]",
  "scope": "[SCOPE]",
  "metrics": {
    "totalLOC": [count],
    "fileCount": [count],
    "avgFileSize": [count],
    "filesOver500Lines": [count],
    "filesOver300Lines": [count],
    "todoCount": [count],
    "magicNumberCount": [count],
    "emptyCatchCount": [count]
  },
  "findings": {
    "high": [count],
    "medium": [count],
    "low": [count]
  },
  "issues": [
    {
      "id": "[unique-id]",
      "severity": "[high|medium|low]",
      "check": "[check name]",
      "location": "[file:line]",
      "value": "[metric value if applicable]",
      "firstSeen": "[date first detected]",
      "status": "open"
    }
  ],
  "complexityHotspots": [
    {
      "file": "[file path]",
      "score": [complexity score],
      "lines": [line count],
      "functions": [function count],
      "imports": [import count]
    }
  ],
  "healthScore": [0-100]
}
```

---

## Phase 6: Create Action Items

### 6.1 TodoWrite for High Findings

Create todos for all High severity findings:

```typescript
TodoWrite([
  // High findings only (Medium/Low are optional)
  {
    content: "[High] Split large file: src/providers/unifiedDataProvider.ts (650 lines)",
    status: "pending",
    activeForm: "Splitting large file"
  },
  {
    content: "[High] Fix empty catch block in src/api.ts:89",
    status: "pending",
    activeForm: "Fixing empty catch block"
  },
  {
    content: "[High] Reduce nesting depth in src/utils.ts:45 (6 levels)",
    status: "pending",
    activeForm: "Reducing nesting depth"
  }
])
```

### 6.2 Summary Output

Display summary to user:

```markdown
## Code Quality Audit Complete

**Date:** [AUDIT_DATE]
**Mode:** [MODE]
**Report:** docs/audits/[AUDIT_DATE]-code-quality.md
**Baseline:** docs/audits/.baseline/code-quality.json (updated)

### Metrics Summary

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Total LOC | X | Y | +/-Z |
| Files > 500 lines | X | Y | +/-Z |
| TODO/FIXME count | X | Y | +/-Z |
| Health Score | X | Y | +/-Z |

### Results

| Severity | Count | Action Required |
|----------|-------|-----------------|
| High | X | SHOULD FIX - Maintainability at risk |
| Medium | Y | Schedule for cleanup |
| Low | Z | Address when convenient |

### Delta Summary
- **New issues:** X
- **Fixed issues:** Y
- **Net change:** +/-Z

### Complexity Hotspots
Top 3 files needing attention:
1. src/file1.ts (score: 45)
2. src/file2.ts (score: 32)
3. src/file3.ts (score: 28)

### Next Steps
[List recommended actions based on findings]
```

---

## Severity Definitions

| Level | Definition | Impact | Examples |
|-------|------------|--------|----------|
| **High** | Significant maintainability risk that makes code hard to understand, test, or modify | Blocks efficient development | Large files, deep nesting, long functions, empty catch |
| **Medium** | Technical debt that should be addressed but doesn't block development | Increases maintenance cost | Magic numbers, TODOs, commented code, hardcoded strings |
| **Low** | Polish issues that improve code quality but have minimal immediate impact | Reduces developer experience | Missing docs, console logs, naming inconsistency |

---

## Quick Reference

### Run Full Audit
```
/audit/code-quality
/audit/code-quality --full
```

### Run Quick Audit (Pattern Checks Only)
```
/audit/code-quality --quick
```

### Audit Specific Directory
```
/audit/code-quality src/atomic-crm/contacts/
/audit/code-quality --quick src/atomic-crm/providers/
```

---

## Related Commands

- `/audit/typescript` - TypeScript audit (any types, strict mode)
- `/audit/architecture` - Architecture audit (feature structure, patterns)
- `/audit/security` - Security audit (RLS, validation, auth)
- `/code-review` - Deep dive code review with parallel agents
