---
description: Deep dive into stack-specific architecture risks — RLS, views, soft-delete, deprecated fields
argument-hint: [--from-scan <json-path>]
allowed-tools: Read, Grep, Glob, Bash(rg:*), Bash(jq:*), Write
model: sonnet
---

# Fault Lines Deep Dive

You are performing a **deep dive into architectural fault lines** for Crispy CRM. This command identifies stack-specific risks where React Admin + Supabase + Zod integration points can silently break.

**Scope:** ARCH-B001 through ARCH-B008 from checks.json

A "fault line" is where two stack layers meet and assumptions break:
- **React Admin ↔ Supabase:** View/table duality, RLS enforcement
- **Zod ↔ React Hook Form:** Schema ↔ resolver ↔ form field binding
- **Supabase ↔ DB:** Soft-delete cascades, computed views, RLS policies
- **Frontend ↔ Provider:** Deprecated fields, direct imports, handler bypass

---

## Phase 1: Load Context

### 1.1 Load Quick Scan Results (if available)

```
If $ARGUMENTS contains "--from-scan":
  Read JSON and extract ARCH findings
Else:
  Run ARCH checks from checks.json fresh
```

### 1.2 Load Sources

Read these files:
1. `supabase/migrations/*.sql` — all migration files (for RLS, views, constraints)
2. `package.json` — dependency versions for compatibility checks
3. `.claude/state/schemas-inventory/*.json` — Zod schema coverage

---

## Phase 2: Component-Level Analysis

### 2.1 RLS Policy Audit

For each migration file containing `CREATE POLICY`:
1. Check: Does any policy use `USING (true)` without `service_role`?
2. Check: Do SELECT policies enforce `deleted_at IS NULL`?
3. Check: Do junction table policies check BOTH foreign key sides?
4. Check: Are INSERT/UPDATE policies using `WITH CHECK` (not just `USING`)?

Classification:
- 🔴 **USING(true)** without service_role → Data breach risk
- 🔴 **Missing deleted_at filter** → Zombie data visible
- ⚠️ **Single-side junction auth** → Potential cross-tenant leak
- ✅ **Proper multi-tenant isolation** → Correct

### 2.2 View Security Audit

For each `CREATE VIEW` in migrations:
1. Check: Does the view filter `WHERE deleted_at IS NULL`?
2. Check: Are computed columns (counts, labels) properly defined?
3. Check: Does the view expose sensitive fields that should be restricted?

### 2.3 Deprecated Field Detection

Scan source code for banned patterns:
1. `Contact.company_id` → Must use `contact_organizations` junction
2. `Opportunity.archived_at` → Must use `deleted_at`
3. Any direct Supabase import in feature modules

### 2.4 Handler ↔ Schema Coverage

For each handler in `handlers/`:
1. Check: Is there a matching Zod schema in `validation/`?
2. Check: Is the schema registered in `ValidationService`?
3. Check: Is the handler registered in `composedDataProvider.ts`?
4. Check: Is `withErrorLogging` the outermost wrapper?

### 2.5 PremiumDatagrid Usage

Scan for raw Datagrid imports from react-admin:
1. Check: All Datagrid usage should go through `PremiumDatagrid` wrapper
2. Raw imports cause DOM prop leaking and console warnings
3. This is per UI_STANDARDS.md — zero tolerance

---

## Phase 3: Confidence Enrichment

For each ARCH finding from quick scan:
```
CONFIRM if migration/source analysis validates the issue
DISMISS if policy was superseded by a later migration
ADD NEW issues (missing handler registration, schema gaps)
```

Write enriched JSON to `.claude/commands/audit/reports/deep-fault-lines-{DATE}.json`.

---

## Phase 4: Console Summary

```
═══════════════════════════════════════════════
  FAULT LINES DEEP DIVE — {DATE}
  Migrations: {count} | Handlers: {count} | Schemas: {count}
═══════════════════════════════════════════════

  RLS Policies:
    ✅ Proper isolation: {count}
    🔴 USING(true):      {count} (data breach risk)
    🔴 No deleted_at:    {count} (zombie data)

  View Security:
    ✅ Filtered:    {count} views
    🔴 Unfiltered:  {count} views

  Deprecated Fields:
    🔴 company_id usage:  {count} files
    🔴 archived_at usage: {count} files

  Handler Coverage:
    ✅ Schema + Provider: {count} handlers
    🔴 No schema:         {count} handlers
    🔴 Not registered:    {count} handlers

  📁 Report: .claude/commands/audit/reports/deep-fault-lines-{DATE}.json
═══════════════════════════════════════════════
```
