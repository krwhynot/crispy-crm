---
description: Deep dive into list filters, pagination, search, and empty state issues
argument-hint: [--from-scan <json-path>]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(jq:*), Write
model: sonnet
---

# Filters Deep Dive

You are performing a **deep dive into filter issues** for Crispy CRM. This command analyzes list filter components, debounce behavior, pagination configuration, and empty state handling.

**Scope:** FILTER-B001 through FILTER-B010 from checks.json

---

## Phase 1: Load Context

### 1.1 Load Quick Scan Results (if available)

```
If $ARGUMENTS contains "--from-scan":
  Read JSON and extract FILTER findings
Else:
  Run FILTER checks from checks.json fresh
```

### 1.2 Load Inventories

Read inventory files:
1. `.claude/state/component-inventory/*.json` — filter components
2. `.claude/state/hooks-inventory/*.json` — custom filter hooks

Build lookup:
```
FILTERS = { component_name → { file, type (text|select|checkbox|date), has_debounce } }
LIST_COMPONENTS = { name → { file, has_filters, has_sort, has_pagination, has_empty } }
```

---

## Phase 2: Component-Level Analysis

### 2.1 Filter Component Scan

Scan `src/components/admin/column-filters/` directory:

For each filter component:
1. **Read the actual file**
2. Check: Does text filter have debounce? (look for `useDebounce`, `debounce`, `setTimeout`)
3. Check: Does it use `useListContext()` for filter state?
4. Check: Does checkbox/select filter clear properly?
5. Check: Does filter have a "clear all" mechanism?

### 2.2 List View Analysis

For each `*List.tsx` component in `src/atomic-crm/`:
1. Check: Is there a `<List>` component with filters configured?
2. Check: Is `sort` or `defaultSort` set?
3. Check: Is pagination configured with sensible `perPage`?
4. Check: Is there an `empty` prop or empty state component?
5. Check: Does the list render a loading skeleton while data loads?

### 2.3 ReferenceInput Analysis

Find all `<ReferenceInput>` usages:
1. Check: Does each have a `filter` prop to limit results?
2. Check: For self-referential fields (parent_id), is the current record excluded?
3. Check: Is `perPage` set to prevent loading 1000+ dropdown items?

---

## Phase 3: Confidence Enrichment

For each FILTER finding from quick scan:
```
CONFIRM if component analysis validates the pattern match
DISMISS if it's a false positive (e.g., debounce exists but in a wrapper)
ADD NEW issues discovered during component analysis
```

Write enriched JSON to `.claude/commands/audit/reports/deep-filters-{DATE}.json` following the same schema as forms deep dive.

---

## Phase 4: Console Summary

```
═══════════════════════════════════════════════
  FILTERS DEEP DIVE — {DATE}
  Filter Components: {count} | List Views: {count}
═══════════════════════════════════════════════

  Filter Health:
    ✅ Debounced:     {count} text filters
    ⚠️ No debounce:   {count} text filters
    🔴 No empty state: {count} list views

  ReferenceInput:
    ✅ Filtered:     {count}
    🔴 Unfiltered:   {count} (may load 1000+ items)

  📁 Report: .claude/commands/audit/reports/deep-filters-{DATE}.json
═══════════════════════════════════════════════
```
