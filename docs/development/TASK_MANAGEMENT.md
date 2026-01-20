# Task Management Workflow

**Purpose:** This guide explains how to track, prioritize, and complete technical debt in Crispy CRM.

**Key Files:**
- `docs/technical-debt.md` - Master tracker for all technical debt (UI, ASYNC, ERR, security, workflow)

---

## Finding ID Systems Explained

Crispy CRM uses **two complementary ID systems** for tracking work:

### 1. Technical Debt IDs (Categorical)

Found in `docs/technical-debt.md`. These use **category prefixes** to identify the type of issue:

| Prefix | Category | Example |
|--------|----------|---------|
| `UI-XX` | User Interface | `UI-04` Focus management bug |
| `ASYNC-XX` | Async/State Issues | `ASYNC-01` Race condition |
| `ERR-XX` | Error Handling | `ERR-01` Silent catch |
| `IMP-XX` | Import Health | `IMP-02` Deep imports |
| `DEAD-XX` | Dead Code | `DEAD-02` Unused hook |
| `DB-XX` | Database Schema | `DB-02` Validation gap |
| `FORM-XX` | Form Issues | `FORM-02` Touch target |
| `EC-XX` | Edge Cases | `EC-01` i18n support |

**Priority Levels:**
- `P0` - Critical (blocks launch)
- `P1` - High (fix this sprint)
- `P2` - Medium (tech debt)
- `P3` - Low (improvements)

### 2. Audit/Execution Plan IDs (Functional)

Found in `docs/TODOs.md`. These use **domain prefixes** for security and workflow issues:

| Prefix | Category | Example |
|--------|----------|---------|
| `CRITICAL-XXX` | Critical Bugs | `CRITICAL-001` Validation bypass |
| `SF-CXX` | Security Findings | `SF-C09` IDOR vulnerability |
| `WF-CXX` | Workflow Findings | `WF-C06` Missing delete warning |

**Numbering Convention:**
- `C` indicates "Critical" severity within the category
- Numbers are sequential within each prefix

---

## How Findings Link Across Files

```
PROVIDER_AUDIT_REPORT.md          TODOs.md                    technical-debt.md
(Source Findings)                 (Execution Plan)            (Tracking)
        |                               |                          |
        v                               v                          v
  SF-C09: IDOR Bug    ─────>    Item 2 [SF-C09]    ─────>    (tracked via
  detected in audit              Fix IDOR in                 commit history)
                                 getMany
```

The flow is:
1. **Audits** generate findings with `SF-`/`WF-` IDs
2. **TODOs.md** organizes them into an execution plan
3. **technical-debt.md** tracks categorical issues (UI, ASYNC, etc.)
4. **Commits** reference Finding IDs for traceability

---

## Daily Workflow

### Step 1: Check Session Startup Output

When you start a Claude Code session, the `daily_briefing.py` hook displays:

```
Welcome, Architect.
   Kaizen Score: 15 | Streak: 3 days
   Checkpoints: 12 | Intentional: 8

   Churn Watch (14 days):
      src/components/admin/forms.tsx (10 edits)
      src/atomic-crm/opportunities/OpportunityList.tsx (7 edits)
      src/providers/supabase/handlers/contactsHandler.ts (5 edits)

   "Small, invisible improvements compound into cathedrals."
```

**What to look for:**
- **Kaizen Score** - Track your commit quality (higher = better)
- **Churn Watch** - Files with many edits may need refactoring or stabilization

### Step 2: Review Ready Tasks

Open `docs/technical-debt.md` and find tasks that are:
- **P0 or P1 priority** (most urgent)
- **Status: Open** (not blocked or in progress)

Quick grep to find P0 Open items:
```bash
grep -A2 "^| UI-\|^| ASYNC-\|^| ERR-" docs/technical-debt.md | grep "Open"
```

### Step 3: Start Work (Update Status)

Before starting, edit `technical-debt.md` to change status:

```markdown
# Before
| UI-04 | Focus Mgmt | ColumnsButton portal issue | `columns-button.tsx` | Open |

# After
| UI-04 | Focus Mgmt | ColumnsButton portal issue | `columns-button.tsx` | In Progress |
```

### Step 4: Implement the Fix

Work on the issue. Follow the recommended fix in the technical-debt.md entry.

### Step 5: Commit with Finding ID

Reference the Finding ID in your commit message:

```bash
# For technical-debt.md items
git commit -m "fix(a11y): resolve UI-04 portal focus management

Refactor ColumnsSelector to be direct child of PopoverContent
instead of using manual portal pattern.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# For TODOs.md security items
git commit -m "fix(security): resolve SF-C09 IDOR in getMany

Apply tenancy filter to getMany and getManyReference handlers
to prevent unauthorized data access.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### Step 6: Mark as Resolved

Update the status and move to Resolved section if applicable:

```markdown
| UI-04 | Focus Mgmt | ColumnsButton portal issue | `columns-button.tsx` | Resolved |
```

---

## Finding ID Cheat Sheet

### Technical Debt Prefixes (technical-debt.md)

| Prefix | Full Name | Description |
|--------|-----------|-------------|
| `UI-` | User Interface | A11y, focus, layout, z-index, touch targets |
| `ASYNC-` | Async/State | Race conditions, loading states, unsaved changes |
| `ERR-` | Error Handling | Silent catches, missing logs, error propagation |
| `IMP-` | Import Health | Deep imports, missing aliases, extensions |
| `DEAD-` | Dead Code | Unused exports, types, constants, components |
| `DB-` | Database | Schema gaps, missing constraints, indexes |
| `FORM-` | Forms | Touch targets, validation, breakpoints |
| `EC-` | Edge Cases | i18n, RTL, decimal handling, Unicode |

### Audit/Security Prefixes (TODOs.md)

| Prefix | Full Name | Description |
|--------|-----------|-------------|
| `CRITICAL-` | Critical Bug | Validation bypasses, data corruption |
| `SF-C` | Security Finding (Critical) | IDOR, RLS bypass, storage leaks |
| `WF-C` | Workflow Finding (Critical) | Cascade deletes, user disable, orphans |

### Commit Type Mapping

| Finding Type | Conventional Commit Type |
|--------------|-------------------------|
| `UI-` | `fix(a11y)` or `fix(ui)` |
| `ASYNC-` | `fix(async)` or `fix(state)` |
| `ERR-` | `fix(errors)` |
| `SF-` | `fix(security)` or `fix(rls)` |
| `WF-` | `fix(workflow)` or `feat(workflow)` |
| `DB-` | `fix(db)` or `chore(db)` |
| `DEAD-` | `chore(cleanup)` |

---

## Cross-Reference Map

```
+---------------------------+
|   PROVIDER_AUDIT_REPORT   |  <-- Source findings (SF-C01, WF-C01, etc.)
+------------+--------------+
             |
             | Generates execution plan
             v
+---------------------------+
|       TODOs.md            |  <-- Phase-ordered tasks with dependencies
|  - Phase 1: Security      |      (Items 1-11 with Finding IDs)
|  - Phase 2: Integrity     |
|  - Phase 3: Structural    |
+------------+--------------+
             |
             | Parallel tracking for categorical issues
             v
+---------------------------+
|   technical-debt.md       |  <-- UI-XX, ASYNC-XX, ERR-XX categories
|  - P0: Critical           |      (Status: Open/In Progress/Resolved)
|  - P1: High               |
|  - P2/P3: Lower           |
+------------+--------------+
             |
             | Commits reference Finding IDs
             v
+---------------------------+
|      Git History          |  <-- fix(security): resolve SF-C09 IDOR
|                           |      fix(a11y): resolve UI-04 focus
+---------------------------+
```

### Linkage Examples

| Audit Finding | TODOs.md Item | Related Tech Debt | Commit |
|---------------|---------------|-------------------|--------|
| SF-C01 | Item 3 | (security views) | `fix(security): resolve SF-C01` |
| WF-C06 | Item 8 | UI-related | `fix(workflow): resolve WF-C06` |
| -- | -- | UI-04 | `fix(a11y): resolve UI-04` |

---

## Querying Tasks

### Find P0 (Critical) Items

```bash
# In technical-debt.md
grep -A5 "## P0" docs/technical-debt.md

# Count open P0 items
grep "Open" docs/technical-debt.md | head -20
```

### Find Open Items by Category

```bash
# All open UI issues
grep "UI-[0-9]" docs/technical-debt.md | grep "Open"

# All open async/state issues
grep "ASYNC-[0-9]" docs/technical-debt.md | grep "Open"

# All open error handling issues
grep "ERR-[0-9]" docs/technical-debt.md | grep "Open"
```

### Find Blocked Items

```bash
# Items marked as blocked (if using that status)
grep -i "blocked\|dependency" docs/technical-debt.md
grep -i "blocked\|dependency" docs/TODOs.md
```

### Find Items by File

```bash
# What issues affect a specific file?
grep "columns-button" docs/technical-debt.md
grep "opportunitiesHandler" docs/TODOs.md
```

### TODOs.md Queries

```bash
# Find incomplete items
grep "\[ \]" docs/TODOs.md

# Find completed items
grep "\[x\]" docs/TODOs.md

# Find items by Finding ID
grep "SF-C" docs/TODOs.md
grep "WF-C" docs/TODOs.md
grep "CRITICAL-" docs/TODOs.md
```

### Quick Win Candidates

```bash
# Find quick wins section
grep -A20 "Quick Wins" docs/technical-debt.md
```

---

## Status Transitions

```
     +-------+
     | Open  |
     +---+---+
         |
         | Start work (update technical-debt.md)
         v
   +-----------+
   |In Progress|
   +-----+-----+
         |
    +----+----+
    |         |
    v         v
+--------+ +--------+
|Resolved| |Blocked |
+--------+ +--------+
               |
               | Unblock
               v
         +-----------+
         |In Progress|
         +-----------+
```

**Status Definitions:**
- **Open** - Ready to work, no blockers
- **In Progress** - Actively being worked on
- **Resolved** - Fix verified and committed
- **Blocked** - Waiting on dependency (document what)

---

## Quick Reference: Workflow Summary

1. **Session Start** - Check Kaizen score and churn warnings
2. **Pick Task** - Find P0/P1 Open items in technical-debt.md
3. **Start** - Change status to "In Progress"
4. **Implement** - Follow recommended fix
5. **Commit** - Use Finding ID: `fix(scope): resolve XX-NN description`
6. **Update** - Change status to "Resolved"
7. **Repeat** - Pick next task

---

## Related Documentation

- `docs/technical-debt.md` - The categorical issue tracker
- `docs/TODOs.md` - The execution plan with phases
- `docs/PROVIDER_AUDIT_REPORT.md` - Source audit findings
- `.claude/hooks/kaizen_gate.py` - Commit message enforcement
- `.claude/hooks/daily_briefing.py` - Session startup display
