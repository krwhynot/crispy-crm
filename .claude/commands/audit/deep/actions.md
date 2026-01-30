---
description: Deep dive into delete, create, update, and bulk operation issues
argument-hint: [--from-scan <json-path>]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(jq:*), Write
model: sonnet
---

# Actions Deep Dive

You are performing a **deep dive into CRUD action issues** for Crispy CRM. This command analyzes delete operations, mutation error handling, create/update flows, and side-effect safety.

**Scope:** ACTION-B001 through ACTION-B010 from checks.json

---

## Phase 1: Load Context

### 1.1 Load Quick Scan Results (if available)

```
If $ARGUMENTS contains "--from-scan":
  Read JSON and extract ACTION findings
Else:
  Run ACTION checks from checks.json fresh
```

### 1.2 Load Inventories

Read inventory files:
1. `.claude/state/component-inventory/*.json` — action components
2. `.claude/state/hooks-inventory/*.json` — mutation hooks

Build lookup:
```
HANDLERS = { name → { file, has_soft_delete, has_error_logging, has_validation } }
MUTATIONS = { component → { file, uses_onError, uses_onSuccess, uses_loading_state } }
```

---

## Phase 2: Component-Level Analysis

### 2.1 Delete Operation Audit

For each handler in `src/atomic-crm/providers/supabase/handlers/`:
1. **Read the actual file**
2. Check: Does it use `withSkipDelete` for soft-delete conversion?
3. Check: Does it have `supportsSoftDelete: true` in callbacks?
4. Check: Is `withErrorLogging` the outermost wrapper?

### 2.2 Mutation Error Handling

For each component using `useMutation`, `useCreate`, `useUpdate`, `useDelete`:
1. Check: Is there an `onError` callback?
2. Check: Does `onError` show user feedback (toast, notification)?
3. Check: Is there an `onSuccess` callback with navigation/notification?
4. Check: Is the save button disabled during mutation (loading state)?

### 2.3 Side-Effect Safety

Scan for fire-and-forget async patterns:
1. Check: Are `void` calls followed by `.catch()` for error handling?
2. Check: Are non-critical side-effects separated from critical transaction paths?
3. Check: Are empty catch blocks present (silent error swallowing)?

### 2.4 Direct Supabase Import Check

Scan `src/atomic-crm/**/*.tsx` for direct Supabase imports:
1. Check: Any `import` from `@supabase` or `supabaseClient`
2. These bypass the data provider — no validation, no error handling, no cache update
3. This is a **hard blocker** — zero tolerance per PROVIDER_RULES.md

---

## Phase 3: Confidence Enrichment

For each ACTION finding from quick scan:
```
CONFIRM if handler/component analysis validates the issue
DISMISS if pattern matched a comment or test file
ADD NEW issues found during component reads
```

Write enriched JSON to `.claude/commands/audit/reports/deep-actions-{DATE}.json`.

---

## Phase 4: Console Summary

```
═══════════════════════════════════════════════
  ACTIONS DEEP DIVE — {DATE}
  Handlers: {count} | Mutation Components: {count}
═══════════════════════════════════════════════

  Delete Safety:
    ✅ Soft-delete:  {count} handlers
    🔴 Hard-delete:  {count} handlers

  Error Handling:
    ✅ With onError:  {count} mutations
    🔴 No feedback:   {count} mutations

  Side-Effects:
    ✅ Safe:     {count} (caught or awaited)
    🔴 Unsafe:   {count} (fire-and-forget)

  Provider Bypass:
    🔴 Direct imports: {count} files

  📁 Report: .claude/commands/audit/reports/deep-actions-{DATE}.json
═══════════════════════════════════════════════
```
