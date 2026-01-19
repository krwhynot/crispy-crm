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

## System 2: Audit/TODOs Tracker

**Source File:** `docs/TODOs.md`
**Supporting File:** `docs/PROVIDER_AUDIT_REPORT.md`
**ID Format:** `PREFIX-XXX` (three-digit) or `PREFIX-CXX` (category + two-digit)
**Origin:** Provider System Deep Audit (January 2026)

### Finding ID Prefixes

| Prefix | Category | Description | Source | Example |
|--------|----------|-------------|--------|---------|
| `CRITICAL-XXX` | Highest Urgency | Active bugs causing data loss or security bypass | Full audit | `CRITICAL-001` |
| `SF-CXX` | Security/Forms | Security issues, IDOR, RLS bypass, data leaks | Provider audit | `SF-C09` |
| `WF-CXX` | Workflow Gaps | Business logic holes, cascade deletes, orphaned records | Workflow audit | `WF-C04` |
| `C-XXX` | Consistency | DRY violations, naming inconsistencies, code duplication | Provider audit | `C-001` |

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

### Example Finding Entry

```markdown
### Item 2: Fix IDOR in `getMany` [SF-C09]

- [x] **Complete** (Fixed in composedDataProvider.ts:179-211 - 2026-01-08)

#### The Context
The `getMany` method accepts an array of IDs and fetches them directly from Supabase.

#### The Silent Failure
It does **not** apply the Tenancy/Ownership filter. A user can fetch a competitor's Contact.
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

**Audit/TODOs Tracker:**
- Checkbox: `[ ]` (pending) or `[x]` (complete)
- Session log with date and implementation notes

### Resolution

**Technical Debt:**
1. Fix the issue
2. Change status to `Resolved`
3. Add entry to "Resolved Items Summary" with date
4. Update summary counts table

**Audit/TODOs:**
1. Fix the issue
2. Mark checkbox as `[x]`
3. Add verification notes under the item
4. Update Progress Tracking table
5. Add entry to Session Log

---

## Cross-File Navigation

### From Technical Debt to Source

```
UI-04 → docs/technical-debt.md → File: src/components/admin/columns-button.tsx:85-87
```

### From TODOs to Audit Report

```
SF-C09 → docs/TODOs.md (Item 2) → docs/PROVIDER_AUDIT_REPORT.md [SF-C09]
```

### Related Files Map

| Tracker | Detailed Report | Archive Location |
|---------|-----------------|------------------|
| `docs/technical-debt.md` | N/A (self-contained) | `docs/archive/audits/` |
| `docs/TODOs.md` | `docs/PROVIDER_AUDIT_REPORT.md` | N/A (active document) |

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

### Audit/TODOs Tracker

1. **Mark checkbox complete:**
   ```markdown
   - [x] **Complete** (Fixed in file.ts:XX-XX - YYYY-MM-DD)
   ```
2. **Add implementation notes** under the item
3. **Update Progress Tracking table:**
   ```markdown
   | Phase 1 | 4 | 4/4 | Complete |
   ```
4. **Add to Session Log:**
   ```markdown
   #### Session Log (YYYY-MM-DD)
   - Item 2 [SF-C09]: Fixed getMany IDOR - now applies view mapping
   ```

---

## Quick Reference Card

### When to Use Each System

| Situation | Use This System |
|-----------|-----------------|
| Found during code audit | Technical Debt Tracker |
| Security/data integrity issue | Audit/TODOs Tracker |
| UI/UX polish item | Technical Debt Tracker |
| Active sprint remediation | Audit/TODOs Tracker |
| Long-term backlog | Technical Debt Tracker |

### ID Lookup

| Prefix | File |
|--------|------|
| `UI-`, `ASYNC-`, `ERR-`, `IMP-`, `DEAD-`, `DB-`, `FORM-`, `EC-` | `docs/technical-debt.md` |
| `CRITICAL-`, `SF-C`, `WF-C`, `C-` | `docs/TODOs.md` + `docs/PROVIDER_AUDIT_REPORT.md` |

---

## Maintenance

- **Technical Debt Tracker:** Run `/deep-audit` to regenerate full audit reports
- **Verification Reports:** Stored in `docs/_state/` for audit trail
- **Archived Audits:** Located in `docs/archive/audits/`

---

*This document is the authoritative reference for Finding ID conventions in Crispy CRM.*
