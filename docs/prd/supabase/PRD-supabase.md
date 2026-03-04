# PRD: Supabase Infrastructure Layer

**Feature ID:** feat-db-001
**Domain:** Supabase
**Status:** Reverse-Engineered
**Confidence:** 90%
**Generated:** 2026-03-03
**Last Updated:** 2026-03-03

---

## Linked Documents

- **BRD:** None — system-layer module. A lightweight architecture decision note capturing data-retention and tenant-isolation rationale is more appropriate than a full BRD.
- **ADRs:** [docs/adr/002-soft-delete-convention.md](../../adr/002-soft-delete-convention.md)
- **Module:** `supabase/`
- **Risk Level:** High (risk score 92/100)
- **Phase Assignment:** 3 — highest entry criteria required before modification

---

## Executive Summary

The Supabase infrastructure layer is the bottom of the dependency graph for Crispy CRM. It owns the production PostgreSQL 17 schema, all row-level security (RLS) policies, soft-delete triggers, summary SQL views, and seven Deno edge functions. Every other module in the codebase ultimately reads from and writes to this layer. Changes here have no rollback path once pushed to the cloud instance; every migration is permanent.

This PRD is reverse-engineered from `supabase/migrations/`, `supabase/functions/`, `supabase/README.md`, and `docs/adr/002-soft-delete-convention.md`. No BRD exists for this domain.

---

## Business Context

[INFERRED] The CRM manages long-lived sales relationships between a food-service broker (MFB), its principals (manufacturers), distributors, and restaurant operators. Business data — contacts, organizations, opportunities, activities, notes, tasks — must never be accidentally destroyed. Regulatory and pipeline audit requirements demand historical visibility. The database layer enforces these guarantees at the lowest level so that no application bug can bypass them.

---

## Goals

1. Guarantee tenant isolation: no authenticated user can read or write another user's data unless their role explicitly permits it.
2. Make accidental deletion recoverable: soft deletes preserve all rows and referential integrity; an admin can undo any deletion.
3. Provide pre-computed summary views so list queries remain fast regardless of row growth.
4. Run scheduled background jobs (digests, overdue-task notifications, dashboard snapshots) without blocking the application request path.
5. Keep the schema the single source of truth for all constraints, timestamps, and computed fields — not the application layer.

---

## Architectural Constraints

Priority levels: **P0** = must never be violated, **P1** = required for all new work, **P2** = strongly recommended.

### P0 — Safety Constraints

| ID | Constraint | Rule Ref | Source | Verified |
|----|-----------|----------|--------|----------|
| AC-001 | Every table must have RLS enabled. No table may exist without a policy. | DB-007, CORE-011 | `supabase/README.md` | Yes |
| AC-002 | `USING (true)` is banned except for approved service-role or public reference-data policies, which must be explicitly documented. | DB-007 | `supabase/README.md`, `.claude/rules/DATABASE_LAYER.md` | Yes |
| AC-003 | Hard deletes are banned for all user-facing tables. Deletion is always a `deleted_at = NOW()` update. | CORE-010, DB-003, DB-004 | `docs/adr/002-soft-delete-convention.md` | Yes |
| AC-004 | Migrations have no rollback path once pushed. Every migration must be dry-run with `npx supabase db push --dry-run` before being applied. | — | `supabase/README.md` | Yes |
| AC-005 | Edge functions that use `supabaseAdmin` (service role) execute with full RLS bypass. Any such function must validate caller identity and role before performing writes. | CORE-011 | `supabase/functions/_shared/supabaseAdmin.ts`, `supabase/functions/users/index.ts` | Yes |
| AC-006 | `SECURITY DEFINER` RPCs must document the bypass reason inline, restrict execution to `authenticated` or a named role, and have a pgTAP test before merge. | CORE-011 | `supabase/README.md` | Yes |

### P1 — Required for All New Work

| ID | Constraint | Rule Ref | Source | Verified |
|----|-----------|----------|--------|----------|
| AC-007 | `created_at` and `updated_at` are database-managed. Clients and application code cannot write these columns. | DB-010 | `supabase/README.md`, `.claude/rules/DATABASE_LAYER.md` | Yes |
| AC-008 | List/read workloads must use pre-computed SQL summary views. Raw table scans for list queries are not allowed when a summary view is configured. | DB-001 | `supabase/README.md` | Yes |
| AC-009 | Every new foreign key column must have a backing index to prevent full scans on JOINs and cascade operations. | DB-009 | `supabase/migrations/20260219000001_add_missing_fk_indexes.sql` | Yes |
| AC-010 | Junction table RLS policies must validate authorization for both linked FK records, not just one side. | DB-008 | `.claude/rules/DATABASE_LAYER.md` | Yes |
| AC-011 | RLS SELECT policies must include `deleted_at IS NULL` to hide soft-deleted rows from all non-admin reads. | DB-003 | `docs/adr/002-soft-delete-convention.md` | Yes |
| AC-012 | Cascade behavior for soft-delete resources must be enforced in SQL triggers, not filtered in application code. | DB-004 | `supabase/migrations/20260303100000_fix_user_delete_fk_violation.sql` | Yes |
| AC-013 | FK references to `auth.users(id)` for ownership/audit metadata use `ON DELETE SET NULL`. Immutable audit trail references use `ON DELETE NO ACTION`. | DB-012 | `supabase/migrations/20260303100000_fix_user_delete_fk_violation.sql` | Yes |
| AC-014 | Computed fields (aggregations, derived values) must use generated columns, views, or triggers — not frontend JavaScript mutation logic. | DB-011 | `.claude/rules/DATABASE_LAYER.md` | Yes |
| AC-015 | Input validation at edge function boundaries uses `z.strictObject()` (Zod) to prevent mass assignment and unknown key injection. | CORE-005 | `supabase/functions/users/index.ts` | Yes |
| AC-016 | The CORS origin allowlist in `functions/_shared/cors-config.ts` must not contain wildcard origins for functions that accept authenticated requests. | — | `supabase/README.md` (sec-008 reference) | Yes |

### P2 — Strongly Recommended

| ID | Constraint | Rule Ref | Source | Verified |
|----|-----------|----------|--------|----------|
| AC-017 | After any migration that adds or modifies RLS policies, run `CMD-006` (policy inventory audit) to verify no permissive gaps were introduced. | DB-013 | `supabase/README.md` | Yes |
| AC-018 | New migrations that add pg_cron jobs, summary views, and RLS policies in a single file should follow the pattern established in recent migrations. | — | `supabase/README.md` | Yes |
| AC-019 | Edge function secrets (service role JWT, env vars) must never be committed to version control. Store in `functions/.env` locally and in Supabase Vault for production. | — | `supabase/README.md` (sec-005 reference) | Yes |

---

## Non-Functional Requirements

| ID | Requirement | Source | Verified |
|----|-------------|--------|----------|
| NFR-001 | Migrations must apply cleanly on PostgreSQL 17. No PG14/15-only syntax. | `supabase/config.toml` | Yes |
| NFR-002 | RLS policy audit (`CMD-006`) must return zero `USING (true)` policies on user-data tables. | DB-007 | `supabase/README.md` | Yes |
| NFR-003 | All pgTAP tests in `supabase/tests/` must pass before a migration touching RLS is merged. | — | `supabase/README.md` | Yes |
| NFR-004 | Edge functions use the Deno runtime (`jsr:@supabase/functions-js`). Node.js or CommonJS modules are not supported. | — | `supabase/functions/daily-digest/index.ts` | Yes |
| NFR-005 | The `supabaseAdmin` lazy-init client must be accessed via `getSupabaseAdmin()`, not imported as a proxy object directly. | — | `supabase/README.md` | Yes |
| NFR-006 | Scheduled edge functions must use `Promise.allSettled` for per-user/per-record processing so one failure does not block the entire batch. | — | `supabase/functions/daily-digest/index.ts` | Yes |
| NFR-007 | Storage bucket access for private assets requires signed URLs. Raw `File` objects and unsigned bucket paths must not be exposed to clients. | DB-005, DB-006 | `.claude/rules/DATABASE_LAYER.md` | Yes [REQUIRES REVIEW — no storage migration verified in current migration set] |

---

## Schema / Migration Model

### Core Tables (from migration history and README)

| Table | Soft Delete | Summary View | Notes |
|-------|------------|-------------|-------|
| `contacts` | Yes (`deleted_at`) | Yes | Junction: `contact_organizations` |
| `organizations` | Yes (`deleted_at`) | Yes | Hierarchical via self-ref FK |
| `opportunities` | Yes (`deleted_at`) | Yes (`opportunities_summary`) | Stage enum; highest fan_in (19 dependents) |
| `activities` | Yes (`deleted_at`) | Yes (`activities_summary`) | Includes `principal_id`, `campaign`, `sample_status_sentiment` |
| `sales` | Yes (`deleted_at`) | No | Maps 1:1 with `auth.users`; role enum (admin/manager/rep) |
| `tasks` | Yes (`deleted_at`) | No | Overdue tasks trigger notifications |
| `notes` | Yes (`deleted_at`) | No | — |
| `products` | Yes (`deleted_at`) | No | FK to `organizations(id)` for `principal_id` |
| `product_distributors` | No (hard delete) | No | Junction table; documented hard-delete exception (ADR-002) |
| `product_features` | [REQUIRES REVIEW] | No | FK `created_by` → `sales(id)` |
| `segments` | [REQUIRES REVIEW] | No | FK `created_by` → `auth.users(id)` SET NULL |
| `notifications` | [REQUIRES REVIEW] | No | Written by `check-overdue-tasks` edge function |
| `dashboard_snapshots` | [REQUIRES REVIEW] | No | Written by `capture-dashboard-snapshots`; FK to `sales(id)` |

### Migration Naming Convention

```
YYYYMMDDHHMMSS_description_in_snake_case.sql
```

Files are applied in filename (timestamp) order. Never edit a previously-applied migration — create a new one to amend.

### Key Triggers

| Trigger | Table | Function | Purpose |
|---------|-------|----------|---------|
| `trg_soft_delete_sales_on_user_delete` | `auth.users` | `handle_auth_user_deletion()` | Soft-deletes the `sales` row before `auth.users` FK SET NULL fires |
| `handle_new_user` trigger | `auth.users` | `handle_new_user()` | Creates or restores a `sales` row on user invite/re-invite |

### Key SECURITY DEFINER RPCs

| RPC | Purpose | Caller Restriction |
|-----|---------|-------------------|
| `admin_restore_sale(uuid, text, text, text)` | Restore soft-deleted or create missing `sales` record | `authenticated` + admin role check |
| `admin_update_sale` | Admin-only sale updates | `authenticated` + admin role check |
| `get_sale_by_id` | Cross-tenant sale lookup | `authenticated` + admin role check [REQUIRES REVIEW] |
| `get_sale_by_user_id` | Cross-tenant sale lookup by user | `authenticated` + admin role check [REQUIRES REVIEW] |
| `admin_resolve_duplicate_sales(text, bigint)` | Resolve duplicate-email collisions on re-invite | `authenticated` + admin role check |

---

## Edge Functions

All edge functions are in `supabase/functions/` and run on the Deno runtime.

### Scheduled Functions (pg_cron)

| Function | Schedule | Purpose | Key Constraint |
|----------|----------|---------|----------------|
| `daily-digest` | `0 7 * * *` (07:00 UTC) | Per-user activity digest emails | Respects `digest_opt_in` preference; skips empty digests; per-user fail-fast via `Promise.allSettled` |
| `check-overdue-tasks` | `0 9 * * *` (09:00 UTC) | Writes overdue task notifications to `notifications` table | — |
| `capture-dashboard-snapshots` | `0 23 * * *` (23:00 UTC) | Persists KPI snapshots for dashboard trend views | — |

### HTTP-Triggered Functions

| Function | Purpose | Auth Pattern |
|----------|---------|-------------|
| `users/index.ts` | User invite, patch, disable, restore (Auth Admin API) | Bearer token + Zod `z.strictObject()` validation; CORS allowlist enforced |
| `updatepassword/index.ts` | Admin password reset flow | Bearer token |
| `digest-opt-out/index.ts` | Unsubscribe handler for digest emails | Token-based unsubscribe link |
| `health-check/index.ts` | Liveness probe for monitoring | Public |

### Shared Utilities

| File | Purpose |
|------|---------|
| `functions/_shared/supabaseAdmin.ts` | Lazy-init service role client; full RLS bypass |
| `functions/_shared/cors-config.ts` | Allowed origin list and CORS header factory |
| `functions/_shared/utils.ts` | `createErrorResponse` and shared helpers |

---

## Design Rules

These rules enforce the patterns described in Architectural Constraints and the referenced rule overlays.

| ID | Rule | Rule Ref |
|----|------|----------|
| DR-001 | Never import Supabase directly from feature components. All DB access routes through `composedDataProvider.ts`. | CORE-001 |
| DR-002 | Soft-delete resources are listed in `SOFT_DELETE_RESOURCES` in `src/atomic-crm/providers/supabase/resources.ts`. This is the single source of truth for which resources participate in soft delete. | ADR-002 |
| DR-003 | The `withSkipDelete` provider wrapper converts all `delete` calls for soft-delete resources into `UPDATE SET deleted_at = NOW()`. No direct DELETE SQL is issued by application code. | ADR-002 |
| DR-004 | RLS SELECT policies for soft-delete tables must include `AND deleted_at IS NULL` in the `USING` clause. Omitting this leaks deleted rows to all users. | DB-003 |
| DR-005 | `product_distributors` is the only approved hard-delete exception. Any future hard-delete exception requires a new ADR entry. | ADR-002 |
| DR-006 | Summary views are the read target for list queries. The provider's `RESOURCE_MAPPING` maps resource names to their summary view. Writes always target the base table. | DB-001, DB-002 |
| DR-007 | Storage paths follow the convention `/{tenant_id}/{resource}/{record_id}/{filename}`. DB rows store the path key, not signed URLs. | DB-006 |
| DR-008 | Private buckets are the default for all user-data storage. Public buckets require explicit justification. | DB-005 |
| DR-009 | All string inputs at edge function boundaries must have `.max()` constraints to prevent DoS via oversized payloads. | CORE-005 |
| DR-010 | `search_path` must be set explicitly (`SET search_path TO 'public'`) on all `SECURITY DEFINER` functions to prevent search-path injection. | — |

---

## Integration Points

### Internal

| Dependency | Direction | Notes |
|-----------|-----------|-------|
| `src/atomic-crm/providers/supabase/composedDataProvider.ts` | Consumer | The sole application-layer gateway to this DB layer |
| `src/atomic-crm/providers/supabase/authProvider.ts` | Consumer | Co-active with `users/index.ts` on auth/invite flows |
| `src/atomic-crm/providers/supabase/resources.ts` | Consumer | `SOFT_DELETE_RESOURCES` and `RESOURCE_MAPPING` drive provider behavior |

### External

| Service | Purpose | Notes |
|---------|---------|-------|
| Supabase Auth (`auth.users`) | User identity and session management | Triggers `handle_new_user` on INSERT/UPDATE |
| Supabase pg_cron | Scheduled job execution | Drives the three daily edge functions |
| Supabase pg_net | HTTP calls from within the DB | Used by pg_cron to invoke edge functions |
| Email provider (SMTP/Resend) [REQUIRES REVIEW] | Digest email delivery | Called from `daily-digest` edge function |

---

## Risk Assessment

| Factor | Value | Source |
|--------|-------|--------|
| Risk Level | High | `docs/audit/baseline/risk-assessment.json` |
| Risk Score | 92 / 100 | `docs/audit/baseline/risk-assessment.json` |
| Phase Assignment | 3 — highest entry criteria | `supabase/README.md` |
| Churn (30d) | 57 commits | `docs/audit/baseline/risk-assessment.json` |
| Churn (6mo) | 644 commits — highest in codebase | `docs/audit/baseline/risk-assessment.json` |
| Test Coverage | Partial (pgTAP for RLS; no automated edge function tests) | `supabase/README.md` |
| Uncommitted Work | `20260303110000_fix_admin_restore_sale_race.sql` and modified `users/index.ts` in working tree | `docs/audit/baseline/risk-assessment.json` |

### Security Observations

- **sec-005:** `functions/.env` contains ES256 service role JWT tokens. Must never be committed to version control.
- **sec-008:** CORS origin list in `_shared/cors-config.ts` is hardcoded to production domains. Changes require human review.
- `supabaseAdmin` bypasses RLS entirely. Every caller must enforce role checks before writes.
- `SECURITY DEFINER` RPCs execute as the table owner. Each must restrict to `authenticated` and verify caller role before any mutation.

### Guardrails (Human Review Required)

- `supabase/migrations/` — production schema; no rollback path once pushed
- `supabase/functions/users/index.ts` — Auth Admin API; 8 commits in 14 days as of last audit
- `supabase/functions/_shared/supabaseAdmin.ts` — service role client; full RLS bypass
- Any `SECURITY DEFINER` function — verify role restriction before push

---

## Acceptance Criteria

| # | Criteria | Current State |
|---|----------|---------------|
| AC-001 | Every table in the schema has RLS enabled and at least one policy | Met — README confirms 100% RLS coverage |
| AC-002 | Zero `USING (true)` policies on user-data tables (verified by `CMD-006`) | Unknown — requires running CMD-006 against current migration set |
| AC-003 | All soft-delete resources filter `deleted_at IS NULL` in their SELECT RLS policies | Met — ADR-002 and README confirm the pattern |
| AC-004 | Every FK column introduced in a migration has a backing index | Met — `20260219000001_add_missing_fk_indexes.sql` retroactively added missing indexes; pattern enforced going forward |
| AC-005 | pgTAP tests pass for all RLS policies | Partially Met — pgTAP tests exist in `supabase/tests/`; coverage not 100% |
| AC-006 | Edge function inputs validated with `z.strictObject()` at the boundary | Met — verified in `users/index.ts` |
| AC-007 | No edge function uses a wildcard CORS origin for authenticated routes | Met — `cors-config.ts` uses an explicit allowlist |
| AC-008 | `SECURITY DEFINER` RPCs include an inline bypass-reason comment and role check | Met — verified in `admin_restore_sale` and `admin_resolve_duplicate_sales` |
| AC-009 | Uncommitted migration `20260303110000_fix_admin_restore_sale_race.sql` is pushed and verified | Not Met — item is in working tree as of 2026-03-03 |
| AC-010 | Uncommitted changes to `users/index.ts` are committed and deployed | Not Met — item is in working tree as of 2026-03-03 |
| AC-011 | `handle_auth_user_deletion` trigger fires correctly on `auth.users` DELETE | Met — migration `20260303100000_fix_user_delete_fk_violation.sql` implements this |
| AC-012 | Storage RLS policies are enabled on all private buckets | Unknown — no storage migration found in current migration set [REQUIRES REVIEW] |

---

## Open Questions

1. **[REQUIRES REVIEW]** Which tables use hard deletes besides `product_distributors`? The ADR documents that junction tables with composite keys and no audit requirement are candidates, but no exhaustive list exists beyond `product_distributors`.

2. **[REQUIRES REVIEW]** What email provider does `daily-digest` use for delivery? The function calls an external HTTP endpoint but the provider identity (Resend, SMTP relay, etc.) is not confirmed from migration or function source alone.

3. **[REQUIRES REVIEW]** Storage RLS: no storage bucket creation or storage policy migrations were found in the current migration file list. Confirm whether storage bucket setup was done via the Supabase Studio UI (not tracked in migrations) or exists in an earlier migration not in this set.

4. **[REQUIRES REVIEW]** `get_sale_by_id` and `get_sale_by_user_id` RPCs are listed in README as SECURITY DEFINER but were not found in the migration files read during this audit. Confirm their role restriction and pgTAP coverage.

5. **[ASSUMPTION]** The `digest_opt_in` column is on the `sales` table, inferred from `daily-digest` edge function source. Verify the column name and table in the schema.

6. **[REQUIRES REVIEW]** The uncommitted migration `20260303110000_fix_admin_restore_sale_race.sql` is in the working tree. Its contents should be reviewed and the migration should be pushed before the next production deployment.

7. **[REQUIRES REVIEW]** pgTAP test coverage in `supabase/tests/` does not cover all tables per the README ("partial" coverage). Identify which tables lack RLS unit tests and create a backlog item.
