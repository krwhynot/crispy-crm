---
description: Deep dive into stale data, loading states, cache invalidation, and error handling
argument-hint: [--from-scan <json-path>]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(jq:*), Write
model: sonnet
---

# Data Flow Deep Dive

You are performing a **deep dive into data flow issues** for Crispy CRM. This command analyzes cache invalidation patterns, cross-resource staleness, loading states, and data layer type safety.

**Scope:** DATA-B001 through DATA-B010 from checks.json

---

## Phase 1: Load Context

### 1.1 Load Quick Scan Results (if available)

```
If $ARGUMENTS contains "--from-scan":
  Read JSON and extract DATA findings
Else:
  Run DATA checks from checks.json fresh
```

### 1.2 Load Inventories

Read inventory files:
1. `.claude/state/hooks-inventory/*.json` — data fetching hooks
2. `.claude/state/schemas-inventory/*.json` — Zod schemas for type safety

Build lookup:
```
QUERY_HOOKS = { component → { file, hook, queryKey_source, staleTime, refetchPolicy } }
HANDLERS = { resource → { file, reads_from, writes_to, invalidates } }
```

---

## Phase 2: Component-Level Analysis

### 2.1 Cache Invalidation Audit

Check for query key factory usage:
1. Read `src/atomic-crm/queryKeys.ts` (if exists)
2. For each mutation handler, trace what gets invalidated after create/update/delete
3. Check: Are cross-resource dependencies invalidated?
   - Org update → contact lists invalidated?
   - Contact reassign → both org details invalidated?
   - Opportunity stage change → dashboard invalidated?

### 2.2 View/Table Duality Check

For each handler:
1. Check: Does `getList` / `getOne` read from `_summary` view?
2. Check: Does `create` / `update` / `delete` write to base table?
3. Check: Are computed fields (from views) stripped before writes?
4. Check: Is `COMPUTED_FIELDS` array defined in callbacks?

### 2.3 Loading State Analysis

For components using `useGetList`, `useGetOne`:
1. Check: Is `isLoading` destructured and used?
2. Check: Is there a loading skeleton or spinner?
3. Check: Is there an error state handler?
4. Check: Does the component handle `undefined` data gracefully?

### 2.4 Stale Time Configuration

Check `staleTime` and `gcTime` settings:
1. Are dashboard widgets using `SHORT_STALE_TIME_MS` (30s)?
2. Are standard lists using `DEFAULT_STALE_TIME_MS` (5min)?
3. Are there `refetchOnWindowFocus: true` settings causing API storms?
4. Are there polling intervals without stale time guards?

### 2.5 Type Safety in Data Layer

Scan handler files for type safety:
1. Check: Any `: any` or `as any` in handler code?
2. Check: Are handler return types properly typed?
3. Check: Do Zod schemas match database column types?

---

## Phase 3: Confidence Enrichment

For each DATA finding from quick scan:
```
CONFIRM if data flow analysis validates the issue
DISMISS if the pattern matched a comment or dead code
ADD NEW issues (stale cross-references, missing loading states)
```

Write enriched JSON to `.claude/commands/audit/reports/deep-data-flow-{DATE}.json`.

---

## Phase 4: Console Summary

```
═══════════════════════════════════════════════
  DATA FLOW DEEP DIVE — {DATE}
  Handlers: {count} | Query Hooks: {count}
═══════════════════════════════════════════════

  Cache Invalidation:
    ✅ Factory keys:     {count} usages
    🔴 Hardcoded keys:   {count} usages
    🔴 Nuclear invalidation: {count}

  View/Table Duality:
    ✅ Correct reads:  {count} (from _summary views)
    🔴 Base table reads: {count}

  Loading States:
    ✅ Handled:  {count} components
    🔴 Missing:  {count} components

  Stale Time:
    ✅ Configured: {count}
    🔴 Aggressive:  {count} (refetchOnWindowFocus)

  📁 Report: .claude/commands/audit/reports/deep-data-flow-{DATE}.json
═══════════════════════════════════════════════
```
