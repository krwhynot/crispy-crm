---
description: Find user-blocking issues that prevent task completion. Tiered scan.
argument-hint: [--quick | --deep | --category=forms,filters,actions,data,nav,arch]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(jq:*), Bash(cat:*), Bash(date:*), Write
model: sonnet
---

# UX Blockers Audit

You are performing a **UX blocker audit** for Crispy CRM. This command identifies issues that **prevent users from completing tasks** — broken forms, stale data, navigation traps, and architectural fault lines.

**Philosophy:** Only report what blocks users. Not style, not code quality, not performance unless it prevents task completion.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│               UX BLOCKERS PIPELINE                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Phase 1: SETUP                                     │
│           Load checks.json + output-schema.json     │
│           Parse arguments (--quick/--deep/--category)│
│           Check inventory staleness                 │
│                                                     │
│  Phase 2: QUICK SCAN (56 rg patterns)               │
│           Run all patterns against codebase         │
│           Calculate confidence per finding          │
│           Classify: blocker (≥0.95) / warning       │
│                                                     │
│  Phase 3: INVENTORY CROSS-REFERENCE                 │
│           Cross-check forms vs schemas              │
│           Verify handler coverage                   │
│           Adjust confidence up/down                 │
│                                                     │
│  Phase 4: REPORT                                    │
│           Write JSON to reports/                    │
│           Write markdown to docs/audits/            │
│           Print console summary (<50 lines)         │
│                                                     │
│  Phase 5: DEEP DIVES (if --deep)                    │
│           Dispatch category-specific deep dives     │
│           Sequential, only for categories with hits │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1: Setup & Configuration

### 1.1 Parse Arguments

```
MODE = "standard" (default)
CATEGORIES = ["FORM", "FILTER", "ACTION", "DATA", "NAV", "ARCH"] (all)

If $ARGUMENTS contains "--quick":
  MODE = "quick"
  → Skip Phase 3 (inventory cross-reference)
  → Skip Phase 5 (deep dives)

If $ARGUMENTS contains "--deep":
  MODE = "deep"
  → Run Phase 5 automatically for categories with findings

If $ARGUMENTS contains "--category=":
  CATEGORIES = parse comma-separated values after "="
  Map shortnames: forms→FORM, filters→FILTER, actions→ACTION, data→DATA, nav→NAV, arch→ARCH
```

### 1.2 Load Configuration

Read these files (REQUIRED — abort if missing):
1. `.claude/commands/audit/lib/checks.json` — 56 check definitions
2. `.claude/commands/audit/lib/output-schema.json` — output field caps

Parse checks.json and extract:
- All check objects grouped by category
- Confidence thresholds: blocker (≥0.95), warning (0.80-0.94)
- Max findings cap: 50

### 1.3 Check Inventory Staleness

Check modification dates of inventory files:
```bash
# Get age in days for each inventory source
for f in .claude/state/forms-inventory.json \
         .claude/state/component-inventory/*.json \
         .claude/state/hooks-inventory/*.json \
         .claude/state/schemas-inventory/*.json; do
  if [ -f "$f" ]; then
    age=$(( ($(date +%s) - $(date -r "$f" +%s)) / 86400 ))
    echo "$f: ${age}d"
  fi
done
```

Record staleness in output metadata. If ANY inventory is >7 days old, add warning:
> ⚠️ Inventory files are stale (>7 days). Run `just discover` for accurate results.

### 1.4 Get Timestamp

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_SLUG=$(date +"%Y-%m-%d")
```

---

## Phase 2: Quick Scan (56 rg Patterns)

### 2.1 Execute Check Patterns

For each check in the selected CATEGORIES from checks.json:

```
For each check:
  1. Build rg command from check.pattern + check.glob
  2. If check.exclude_glob exists, add --glob '!{exclude}'
  3. Run: rg -n --no-heading '{pattern}' --glob '{glob}' src/
  4. For ARCH checks with migrations glob: search supabase/migrations/ instead
  5. Capture: file, line number, matching text (truncate to 200 chars)
  6. Count matches
```

**IMPORTANT: Pattern execution rules:**
- Use `rg` (ripgrep) for ALL pattern matching — NOT grep
- Add `-n` for line numbers, `--no-heading` for parseable output
- Truncate evidence to 200 characters (output schema cap)
- Skip test files: add `--glob '!*.test.*' --glob '!__tests__/*'` to all commands
- Track execution time per category

### 2.2 Calculate Confidence

For each match found:

```
base_confidence = check.confidence_base (from checks.json)

Adjustments:
  +0.05 if file is in critical path (handlers/, validation/, *List.tsx, *Create.tsx, *Edit.tsx)
  +0.05 if check.stack_specific = true AND pattern is React Admin / Supabase specific
  -0.10 if check.needs_verification = true AND MODE = "quick"
  -0.05 if file is in _archived/ or deprecated/

final_confidence = clamp(base + adjustments, 0.60, 1.00)
```

### 2.3 Classify Findings

```
For each finding:
  If final_confidence >= 0.95 → BLOCKER
  If final_confidence >= 0.80 → WARNING (add verify_by field)
  If final_confidence < 0.80  → DISCARD (not reported)

Total findings MUST NOT exceed 50. If over:
  1. Keep all BLOCKERS
  2. Sort WARNINGS by confidence descending
  3. Trim WARNINGS to fit under 50 total
```

---

## Phase 3: Inventory Cross-Reference (Skip if --quick)

### 3.1 Forms vs Schemas Cross-Check

Read `.claude/state/forms-inventory.json` and `.claude/state/schemas-inventory/*.json`.

For each form component found:
- Check if a matching Zod schema exists in `validation/`
- Check if form has a resolver configured
- If form exists WITHOUT schema → upgrade FORM-B001 findings to +0.10 confidence

### 3.2 Handler Coverage Check

Read `.claude/state/hooks-inventory/*.json`.

For each handler in `src/atomic-crm/providers/supabase/handlers/`:
- Check if matching Zod schema exists in ValidationService
- If handler exists WITHOUT validation registration → upgrade ARCH-B006 to +0.10

### 3.3 View/Table Duality Check

For each resource with a handler:
- Check if a `_summary` view exists in migrations
- If handler reads from base table without view → upgrade DATA-B007 to +0.10

---

## Phase 4: Report Generation

### 4.1 Build Output JSON

Construct JSON matching output-schema.json:

```json
{
  "meta": {
    "timestamp": "$TIMESTAMP",
    "mode": "$MODE",
    "duration_ms": <calculated>,
    "checks_run": <count>,
    "files_scanned": <count>,
    "categories_scanned": [...],
    "inventory_staleness": { ... }
  },
  "summary": {
    "blockers": <count>,
    "warnings": <count>,
    "clean": <checks_run - blockers - warnings>
  },
  "blockers": [
    {
      "id": "CHECK-ID",
      "file": "relative/path.tsx",
      "line": 42,
      "check": "Check name (max 60 chars)",
      "evidence": "Matching code (max 200 chars)",
      "user_impact": "What user experiences (max 100 chars)",
      "confidence": 0.95,
      "category": "FORM"
    }
  ],
  "warnings": [
    {
      "id": "CHECK-ID",
      "file": "relative/path.tsx",
      "line": 99,
      "check": "Check name",
      "evidence": "Matching code (max 200 chars)",
      "user_impact": "What user experiences (max 100 chars)",
      "confidence": 0.85,
      "category": "FILTER",
      "verify_by": "How to manually verify (max 150 chars)"
    }
  ],
  "deep_dive_needed": ["forms", "filters"]
}
```

**CRITICAL: Enforce field length caps from output-schema.json:**
- `evidence`: max 200 characters — truncate with `...` if longer
- `user_impact`: max 100 characters — truncate with `...` if longer
- `check`: max 60 characters
- `verify_by`: max 150 characters
- `file`: max 120 characters

### 4.2 Write Report Files

Write JSON report:
```bash
# Write to reports directory (gitignored)
Write → .claude/commands/audit/reports/ux-blockers-${DATE_SLUG}.json
```

Write markdown summary to docs/audits/:
```markdown
# UX Blockers Audit — ${DATE_SLUG}

**Mode:** ${MODE} | **Checks:** ${checks_run}/56 | **Duration:** ${duration_ms}ms

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Blockers | ${blockers} |
| 🟡 Warnings | ${warnings} |
| ✅ Clean | ${clean} |

## Blockers

| # | Check | File | Line | Impact | Confidence |
|---|-------|------|------|--------|------------|
(one row per blocker)

## Warnings

| # | Check | File | Line | Impact | Confidence | Verify By |
|---|-------|------|------|--------|------------|-----------|
(one row per warning)

## Recommended Deep Dives

(list categories with findings, with command to run each)
```

### 4.3 Console Summary

Print to console — **MAX 50 lines total:**

```
═══════════════════════════════════════════════════
  UX BLOCKERS AUDIT — ${DATE_SLUG}
  Mode: ${MODE} | Checks: ${checks_run}/56
═══════════════════════════════════════════════════

  🔴 BLOCKERS: ${count}
  🟡 WARNINGS: ${count}
  ✅ CLEAN:    ${count}

  ─── Top Blockers ───
  1. [FORM-B002] zodResolver bypass in QuickAddForm.tsx:45
  2. [ACTION-B003] Direct Supabase import in ContactEdit.tsx:12
  ...

  ─── Warnings Needing Verification ───
  1. [FILTER-B001] Missing debounce in TextFilter.tsx:23
  ...

  📁 Full report: docs/audits/ux-blockers-${DATE_SLUG}.md
  📊 JSON data:   .claude/commands/audit/reports/ux-blockers-${DATE_SLUG}.json

  Deep dives recommended: forms, filters
  Run: /audit/deep/forms  |  /audit/deep/filters
═══════════════════════════════════════════════════
```

---

## Phase 5: Deep Dive Dispatch (Only if --deep)

If MODE = "deep", for each category in `deep_dive_needed`:

```
Map category to deep dive command:
  FORM   → Tell user: "Run /audit/deep/forms for detailed analysis"
  FILTER → Tell user: "Run /audit/deep/filters for detailed analysis"
  ACTION → Tell user: "Run /audit/deep/actions for detailed analysis"
  DATA   → Tell user: "Run /audit/deep/data-flow for detailed analysis"
  NAV    → Tell user: "Run /audit/deep/navigation for detailed analysis"
  ARCH   → Tell user: "Run /audit/deep/fault-lines for detailed analysis"
```

Provide a copy-pasteable list of recommended deep dive commands based on findings.

---

## Output Contract

1. **Max 50 findings** total (blockers + warnings)
2. **Evidence capped** at 200 characters per finding
3. **Console output** under 50 lines
4. **Three output files:** JSON report, markdown report, console summary
5. **No verbose explanations** — data-driven, pattern-matched findings only
6. **Confidence transparency** — every finding shows its confidence score and basis

---

## Error Handling

- If checks.json is missing or invalid: ABORT with "Run the audit setup first"
- If rg is not available: ABORT with "Install ripgrep: apt install ripgrep"
- If no findings: Report clean bill of health (still write reports)
- If >50 findings: Trim warnings (keep all blockers, sort remaining by confidence)
- If inventory files are missing: Continue with degraded confidence (note in output)
