---
description: Stale state audit (cache invalidation, refetch patterns) with delta tracking - saves to docs/audits/
argument-hint: [--quick | --full | src/path]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(cat:*), Bash(date:*), TodoWrite, Write
model: sonnet
---

# Stale State Audit

Audit for stale state issues including cache invalidation, refetch patterns, and closure bugs. Tracks delta from previous audits and generates actionable todos.

> **SKILL ACTIVATION:** Using `stale-state` audit command for cache/state health check.

---

## Phase 0: Mode Detection

Parse `$ARGUMENTS` to determine audit mode:

| Argument | Mode | Description |
|----------|------|-------------|
| `--quick` | Quick | Local rg checks only, skip deep analysis |
| `--full` | Full | Deep analysis with mutation-query relationship tracing |
| `src/path` | Scoped | Audit specific directory only |
| *(empty)* | Full | Default to full audit |

```bash
# Get current date for report filename
date +%Y-%m-%d
```

---

## Phase 1: Local rg Checks (Always Run)

Run these checks in parallel using Grep tool:

### Critical Severity

#### 1.1 Missing invalidateQueries After Mutation
```bash
# Find useMutation with onSuccess that lacks invalidateQueries
rg "useMutation|onSuccess" --type tsx -A 10
```

**What to look for:**
- `onSuccess` callbacks without `invalidateQueries` or `refetch`
- Mutations that modify data but don't invalidate related queries

**Risk:** Stale lists after save - user sees old data until manual refresh

#### 1.2 Stale Closure in useEffect
```bash
# Find useEffect with empty deps that reference state
rg "useEffect\(\s*\(\)\s*=>" --type tsx -A 5
```

**What to look for:**
- `useEffect` with `[]` dependency array
- References to state variables inside the effect
- Event listeners that capture stale values

**Risk:** Captures outdated values, causing bugs

### High Severity

#### 1.3 Missing refetchOnWindowFocus
```bash
# Find queries without refetchOnWindowFocus
rg "useQuery|useGetList|useGetOne" --type tsx -A 10
```

**What to look for:**
- Queries that should refresh on window focus but don't set `refetchOnWindowFocus: true`
- Critical data displays that could become stale during tab switching

**Risk:** Stale data on tab switch - user sees outdated information

#### 1.4 Optimistic Update Without Rollback
```bash
# Find optimistic updates
rg "onMutate|optimistic" --type tsx -A 15
```

**What to look for:**
- `onMutate` that sets query data without storing previous value
- Missing `onError` rollback handler
- Optimistic updates without `context.previous` pattern

**Risk:** Failed mutation shows wrong data until refetch

#### 1.5 Hardcoded Query Keys (Layer 5 → Layer 3 Bypass)
```bash
# Find string literal query keys instead of constants
rg "useQuery\(\[['\"]" --type tsx -n src/atomic-crm/
```

**What to look for:**
- `useQuery(['contacts', id])` using string literals
- Query keys not imported from a central constants file
- Features defining their own query key patterns

**Risk:** Query key drift from Provider - if L3 Provider changes a key, L5 Feature won't know → stale data

### Medium Severity

#### 1.5 Long staleTime Values
```bash
# Find excessive staleTime (5+ digits = 100+ seconds)
rg "staleTime.*[0-9]{5,}" --type tsx
```

**What to look for:**
- `staleTime: 60000` or higher (1+ minutes)
- Queries for frequently-changing data with long stale times

**Risk:** Data freshness issues for time-sensitive information

#### 1.6 Manual State Sync (Anti-Pattern)
```bash
# Find useState + useEffect patterns that should use react-query
rg "useState.*useEffect" --type tsx
```

**What to look for:**
- `useState` initialized from props/context
- `useEffect` that syncs state with external data
- Should often be replaced with react-query or derived state

**Risk:** Complex state management, race conditions, sync bugs

#### 1.7 Direct Cache Manipulation (Layer 5 Cache Surgery)
```bash
# Find direct cache mutations instead of invalidation
rg "setQueryData\(" --type tsx -n src/atomic-crm/
```

**What to look for:**
- `queryClient.setQueryData()` calls outside of optimistic update patterns
- Manual cache surgery without corresponding `invalidateQueries`
- Features directly manipulating cache instead of letting Provider handle it

**Risk:** Cache/DB desync - manual cache changes create fragile state that drifts from Database (L1)

---

## Phase 2: Deep Analysis (Full Mode Only)

**Skip this phase if `--quick` mode is set.**

### 2.1 Mutation-Query Relationship Tracing

For each mutation found in Phase 1.1, trace:

1. **What data does this mutation modify?**
   - Table/resource being updated
   - Related entities that might be affected

2. **What queries display this data?**
   - Find `useQuery`/`useGetList` for the same resource
   - Check parent components that might cache this data

3. **Is invalidation complete?**
   - All related queries invalidated?
   - Parent/child resources invalidated?

### 2.2 Effect Dependency Analysis

For each suspicious `useEffect` found in Phase 1.2:

1. **Read the full component**
2. **Identify all state/props referenced inside effect**
3. **Check if dependencies are correctly listed**
4. **Flag missing dependencies or intentional omissions without eslint-disable**

### 2.3 React Admin Integration Check

```bash
# Check for React Admin data provider patterns
rg "dataProvider|useDataProvider|useCreate|useUpdate|useDelete" --type tsx
```

Verify:
- React Admin mutations properly refresh lists
- Custom hooks around data provider handle invalidation
- No manual state tracking for data that React Admin manages

---

## Phase 3: Load Baseline

Read previous audit baseline:

```
docs/audits/.baseline/stale-state.json
```

**Expected baseline structure:**
```json
{
  "lastAudit": "2025-01-08",
  "findings": {
    "critical": [
      {
        "id": "STALE-001",
        "check": "missing-invalidate",
        "file": "src/atomic-crm/contacts/ContactCreate.tsx",
        "line": 45,
        "description": "useMutation onSuccess lacks invalidateQueries"
      }
    ],
    "high": [],
    "medium": []
  },
  "totals": {
    "critical": 1,
    "high": 0,
    "medium": 0
  }
}
```

**If baseline doesn't exist:** Treat all findings as new.

---

## Phase 4: Generate Report

Save report to: `docs/audits/YYYY-MM-DD-stale-state.md`

### Report Template

```markdown
# Stale State Audit Report

**Date:** YYYY-MM-DD
**Mode:** Quick | Full | Scoped (path)
**Files Scanned:** N

---

## Delta from Last Audit

| Severity | Previous | Current | Change |
|----------|----------|---------|--------|
| Critical | X | Y | +Z / -Z |
| High | X | Y | +Z / -Z |
| Medium | X | Y | +Z / -Z |

### What This Means for Users

| Severity | User Impact |
|----------|-------------|
| **Critical** | Users may lose data, see incorrect information, or have their accounts compromised. The app may crash or behave unpredictably. These issues directly harm the user experience. |
| **High** | Users may encounter frustrating bugs, slow performance, or inconsistent behavior. Features may not work as expected, leading to confusion or wasted time. |
| **Medium** | Users won't notice these immediately, but they make the app harder to improve. Future features will take longer to build and may introduce new bugs. |

### New Issues
| ID | Severity | File | Issue |
|----|----------|------|-------|
| STALE-XXX | Critical | path/file.tsx:line | Description |

### Fixed Issues
| ID | Severity | File | Issue |
|----|----------|------|-------|
| STALE-XXX | High | path/file.tsx | Was: Description |

---

## Current Findings

### Critical (Data Correctness)

Issues that cause users to see incorrect data.

#### STALE-001: Missing invalidateQueries
**File:** `src/example/Component.tsx:45`
**Pattern Found:**
\`\`\`tsx
useMutation({
  onSuccess: () => {
    // No invalidateQueries call
    toast.success('Saved')
  }
})
\`\`\`
**Fix:**
\`\`\`tsx
onSuccess: () => {
  queryClient.invalidateQueries(['resourceName'])
  toast.success('Saved')
}
\`\`\`

### High (UX Impact)

Issues that degrade user experience with stale data.

#### STALE-XXX: Stale Closure
**File:** `src/example/Component.tsx:23`
**Pattern Found:**
\`\`\`tsx
useEffect(() => {
  window.addEventListener('resize', () => {
    console.log(count) // Captures initial value
  })
}, []) // Missing 'count' dependency
\`\`\`
**Fix:** Add dependency or use ref pattern.

### Medium (Performance/Patterns)

Issues that may cause subtle bugs or indicate anti-patterns.

---

## Correct Patterns Reference

### Cache Invalidation After Mutation
\`\`\`tsx
// CORRECT: Invalidate after mutation
const mutation = useMutation({
  mutationFn: updateContact,
  onSuccess: () => {
    queryClient.invalidateQueries(['contacts'])
    queryClient.invalidateQueries(['contact', id])
  }
})
\`\`\`

### Refetch on Window Focus
\`\`\`tsx
// CORRECT: Refetch on window focus
useQuery({
  queryKey: ['contacts'],
  queryFn: fetchContacts,
  refetchOnWindowFocus: true
})
\`\`\`

### Optimistic Update with Rollback
\`\`\`tsx
// CORRECT: Optimistic with rollback
const mutation = useMutation({
  mutationFn: updateContact,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['contact', id])
    const previous = queryClient.getQueryData(['contact', id])
    queryClient.setQueryData(['contact', id], newData)
    return { previous }
  },
  onError: (err, vars, context) => {
    if (context?.previous) {
      queryClient.setQueryData(['contact', id], context.previous)
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries(['contact', id])
  }
})
\`\`\`

### React Admin Pattern
\`\`\`tsx
// CORRECT: React Admin handles invalidation
const [update] = useUpdate()
// React Admin automatically refreshes list on success
\`\`\`

---

## Recommendations

1. **[Priority]** Fix all Critical issues before next release
2. **[High]** Address stale closure issues in effects
3. **[Medium]** Review long staleTime configurations

---

*Generated by stale-state audit command*
```

---

## Phase 5: Update Baseline

Write updated baseline to `docs/audits/.baseline/stale-state.json`:

```json
{
  "lastAudit": "YYYY-MM-DD",
  "findings": {
    "critical": [...current critical findings...],
    "high": [...current high findings...],
    "medium": [...current medium findings...]
  },
  "totals": {
    "critical": N,
    "high": N,
    "medium": N
  }
}
```

---

## Phase 6: Create TodoWrite Tasks

Create todos for Critical and High severity findings:

```typescript
TodoWrite([
  // Critical findings first
  {
    content: "[Critical] STALE-001: Add invalidateQueries in ContactCreate.tsx:45",
    status: "pending",
    activeForm: "Adding cache invalidation to ContactCreate"
  },
  // High findings next
  {
    content: "[High] STALE-002: Fix stale closure in useContactSearch.ts:23",
    status: "pending",
    activeForm: "Fixing stale closure in useContactSearch"
  }
  // Medium findings are NOT added to todos (fix when convenient)
])
```

---

## Output Summary

After all phases complete, display:

```markdown
## Stale State Audit Complete

**Report saved:** docs/audits/YYYY-MM-DD-stale-state.md
**Baseline updated:** docs/audits/.baseline/stale-state.json

### Summary
| Severity | Count | Delta |
|----------|-------|-------|
| Critical | X | +/-N |
| High | X | +/-N |
| Medium | X | +/-N |

### Todos Created
- X Critical issues added to todo list
- Y High issues added to todo list

### Next Steps
1. Review report at docs/audits/YYYY-MM-DD-stale-state.md
2. Work through todos in priority order
3. Re-run audit after fixes: `/audit/stale-state`
```

---

## Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | Data correctness issues - user sees wrong data | Missing invalidateQueries after mutation |
| **High** | UX impact - stale data causes confusion, layer violations | Missing refetchOnWindowFocus, hardcoded query keys (L5→L3 bypass) |
| **Medium** | Anti-patterns or subtle bugs | Manual state sync, direct cache manipulation (L5 cache surgery) |

---

## Quick Reference

### Run Full Audit
```
/audit/stale-state
```

### Run Quick Audit (rg checks only)
```
/audit/stale-state --quick
```

### Audit Specific Directory
```
/audit/stale-state src/atomic-crm/contacts
```

---

## Related Skills

- `data-integrity-guards` - Validation layer patterns
- `verification-before-completion` - Evidence-based completion claims
- `deep-audit` - Comprehensive full-stack audit
