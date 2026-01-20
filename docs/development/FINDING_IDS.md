# Finding ID Master Registry

**Purpose:** Central reference for all Finding ID prefixes used across Crispy CRM documentation.
**Last Updated:** 2026-01-18

---

## Overview

Crispy CRM uses **two distinct tracking systems** for technical issues:

| System | File | Purpose | ID Format |
|--------|------|---------|-----------|
| **Technical Debt Tracker** | `docs/technical-debt.md` | Long-term code quality issues from audits | `PREFIX-XX` (2-digit) |
| **Audit/TODOs Tracker** | `docs/TODOs.md` | Active remediation items from provider audit | `PREFIX-XXX` or `PREFIX-CXX` |

**Key Difference:**
- Technical Debt = Backlog items discovered during code audits (P0-P3 priority)
- Audit/TODOs = Active execution plan with phased rollout (Items 1-14)

---

## System 1: Technical Debt Tracker

**Source File:** `docs/technical-debt.md`
**ID Format:** `PREFIX-XX` (two-digit number)
**Origin:** Consolidated from 40+ audit reports (December 2025)

### Finding ID Prefixes

| Prefix | Category | Description | Example |
|--------|----------|-------------|---------|
| `UI-XX` | UI/UX Issues | Touch targets, focus management, z-index conflicts, accessibility | `UI-04` |
| `ASYNC-XX` | Async/State Issues | Race conditions, loading states, abort controllers, optimistic locking | `ASYNC-01` |
| `ERR-XX` | Error Handling | Silent catches, missing logging, error propagation | `ERR-01` |
| `IMP-XX` | Import Health | Deep imports, file extensions, path aliases | `IMP-01` |
| `DEAD-XX` | Dead Code | Unused exports, dead types, orphaned components | `DEAD-02` |
| `DB-XX` | Database Schema | Validation gaps, missing constraints, index issues | `DB-02` |
| `FORM-XX` | Form Issues | Touch targets, mobile-first breakpoints, validation | `FORM-02` |
| `EC-XX` | Edge Cases | i18n, RTL support, emoji handling, decimal separators | `EC-01` |
| `ORG-XX` | Organizations | Organization-specific issues (legacy, mostly resolved) | `ORG-01` |

### Priority Levels

| Priority | Meaning | Action |
|----------|---------|--------|
| **P0** | Critical - Must Fix Before Launch | Blocks deployment |
| **P1** | High - Fix This Sprint | Address within current sprint |
| **P2** | Medium - Tech Debt | Batch into cleanup sprints |
| **P3** | Low - Improvements | Nice-to-have, opportunistic fixes |

### Example Finding Entry

```markdown
| ID | Category | Issue | File(s) | Status |
|----|----------|-------|---------|--------|
| UI-04 | Focus Mgmt | ColumnsButton manual portal bypass breaks focus management | `src/components/admin/columns-button.tsx:85-87` | Open |
```

---

## System 2: Security/Workflow Findings (Historical)

**Status:** Consolidated into `docs/technical-debt.md` (January 2026)
**ID Format:** `PREFIX-CXX` (category + two-digit)
**Origin:** Provider System Deep Audit (January 2026)

**Note:** These findings have been resolved and integrated into the main technical debt tracker.

### Historical Finding ID Prefixes (Resolved)

| Prefix | Category | Description | Status | Example |
|--------|----------|-------------|--------|---------|
| `SF-CXX` | Security/Forms | Security issues, IDOR, RLS bypass, data leaks | All resolved Jan 2026 | `SF-C09` |
| `WF-CXX` | Workflow Gaps | Business logic holes, cascade deletes, orphaned records | All resolved Jan 2026 | `WF-C04` |

### SF (Security/Forms) Sub-Categories

| ID Range | Focus Area |
|----------|------------|
| `SF-C01` - `SF-C05` | RLS/Security (views, policies, auth) |
| `SF-C06` - `SF-C10` | Data Protection (storage, cleanup, IDOR) |
| `SF-C11` - `SF-C15` | Data Integrity (locking, constraints, validation) |

### WF (Workflow) Sub-Categories

| ID Range | Focus Area |
|----------|------------|
| `WF-C01` - `WF-C03` | Cascade Operations (delete, archive) |
| `WF-C04` - `WF-C06` | User Lifecycle (disable, reassign) |
| `WF-C07` - `WF-C10` | Data Relationships (cross-tenant, mismatched) |

### Example (Historical - Resolved)

```markdown
SF-C09: IDOR in getMany - Fixed 2026-01-08
Applied tenancy filter to getMany and getManyReference handlers.
Commit: fix(security): resolve SF-C09 IDOR in data provider
```

---

## Finding ID Lifecycle

### Creation

1. **Discovery:** Issue found during audit, code review, or bug report
2. **Classification:** Assign appropriate prefix based on category
3. **Numbering:** Use next available number in that prefix series
4. **Documentation:** Add to appropriate tracker file with:
   - File path(s) and line numbers
   - Clear description of the issue
   - Impact assessment
   - Suggested fix approach

### Tracking

**Technical Debt Tracker:**
- Status column: `Open` or `Resolved`
- Moved to "Resolved Items Summary" section when fixed

**Security/Workflow Findings:**
- All findings resolved and documented in git history
- Reference commits for implementation details

### Resolution

**Technical Debt:**
1. Fix the issue
2. Change status to `Resolved`
3. Add entry to "Resolved Items Summary" with date
4. Update summary counts table

**Security/Workflow (Historical):**
1. Fixed during January 2026 remediation
2. Documented in git history with Finding ID
3. See commit messages for implementation details

---

## Cross-File Navigation

### From Technical Debt to Source

```
UI-04 → docs/technical-debt.md → File: src/components/admin/columns-button.tsx:85-87
```

### From Finding to Resolution

```
SF-C09 → Git History → Commit: fix(security): resolve SF-C09
```

### Files Map

| Tracker | Archive Location | Status |
|---------|------------------|--------|
| `docs/technical-debt.md` | Recent audits in `docs/audits/` | Active |

---

## How to Close a Finding

### Technical Debt Tracker

1. **Verify the fix** by checking the file/line referenced
2. **Update the entry:**
   ```markdown
   | UI-04 | Focus Mgmt | ... | ... | Resolved |
   ```
3. **Move to Resolved section** (or add to existing batch)
4. **Update summary counts:**
   ```markdown
   | P0 - Critical | 0 | 13 |  <!-- Was 1, now 0 open -->
   ```

### Security/Workflow (Historical)

All security and workflow findings from the January 2026 audit have been resolved. See git history for implementation details:

```bash
git log --all --oneline --grep="SF-C"
git log --all --oneline --grep="WF-C"
```

---

## Quick Reference Card

### When to Use Each System

| Situation | Use This System |
|-----------|-----------------|
| Found during code audit | Technical Debt Tracker |
| Security/data integrity issue | Technical Debt Tracker |
| UI/UX polish item | Technical Debt Tracker |
| Active sprint work | Technical Debt Tracker |
| Long-term backlog | Technical Debt Tracker |

### ID Lookup

| Prefix | File |
|--------|------|
| `UI-`, `ASYNC-`, `ERR-`, `IMP-`, `DEAD-`, `DB-`, `FORM-`, `EC-` | `docs/technical-debt.md` |
| `SF-C`, `WF-C` (historical) | Git history (all resolved Jan 2026) |

---

## Maintenance

- **Technical Debt Tracker:** Run `/deep-audit` to regenerate full audit reports
- **Verification Reports:** Stored in `docs/_state/` for audit trail
- **Archived Audits:** Located in `docs/archive/audits/`

---

*This document is the authoritative reference for Finding ID conventions in Crispy CRM.*
