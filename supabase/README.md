# supabase/

PostgreSQL 17 schema, RLS policies, and Deno edge functions for Crispy CRM. This directory owns the production database layer: every migration runs directly against the cloud instance with no rollback path, and every edge function executes with `service_role` privileges that bypass RLS entirely. Developers working here are responsible for tenant isolation and data integrity for all users.

## Quick Reference

| Property | Value |
|----------|-------|
| Runtime | PostgreSQL 17 (cloud) + Deno (edge functions) |
| Risk Level | High (risk score 9/10) |
| Phase | 3 — highest entry criteria required |
| Churn | 57 commits/30d, 644 in 6 months — highest in codebase |
| Test Coverage | Partial (pgTAP for RLS, no automated edge function tests) |
| Dependents | 0 (this is the bottom of the dependency graph) |

## Directory Map

| Path | Purpose |
|------|---------|
| `migrations/` | Sequential SQL migration files; applied in filename order |
| `functions/_shared/supabaseAdmin.ts` | Lazy-init service role client; full RLS bypass |
| `functions/_shared/cors-config.ts` | Allowed origin list and CORS header factory |
| `functions/users/` | User invite, patch, disable, restore — Auth Admin API |
| `functions/daily-digest/` | Per-user activity digest emails (pg_cron 07:00 UTC) |
| `functions/check-overdue-tasks/` | Overdue task notifications (pg_cron 09:00 UTC) |
| `functions/capture-dashboard-snapshots/` | Dashboard KPI snapshots (pg_cron 23:00 UTC) |
| `functions/updatepassword/` | Admin password reset flow |
| `functions/digest-opt-out/` | Unsubscribe handler for digest emails |
| `functions/health-check/` | Liveness probe for monitoring |
| `tests/` | pgTAP RLS unit tests |
| `seed.sql` | Local development seed data |
| `config.toml` | Supabase CLI project config (project_id: crispy-crm, PG 17) |

## Scheduled Functions (pg_cron)

| Function | Schedule | Purpose |
|----------|----------|---------|
| `daily-digest` | 07:00 UTC daily | Activity digest emails; respects `digest_opt_in` preference |
| `check-overdue-tasks` | 09:00 UTC daily | Writes to `notifications` table for overdue tasks |
| `capture-dashboard-snapshots` | 23:00 UTC daily | Persists KPI snapshots for trend views |

## Security-Sensitive RPCs (SECURITY DEFINER)

These functions execute as the table owner, bypassing RLS. Changes require explicit review.

| RPC | Purpose |
|-----|---------|
| `admin_update_sale` | Admin-only sale record updates |
| `admin_restore_sale` | Restore a soft-deleted sale record |
| `get_sale_by_id` | Cross-tenant sale lookup for admin |
| `get_sale_by_user_id` | Cross-tenant sale lookup by user |

## Database Rules

- **RLS: 100%** — every table has row-level security enabled; `USING (true)` is banned except approved service/public reference-data cases (DB-007)
- **Soft deletes** — rows are never hard-deleted; `deleted_at` timestamps used throughout (DB-003, DB-004, CORE-010)
- **Read views** — list reads use precomputed SQL summary views, not raw tables (DB-001)
- **Timestamps** — `created_at` and `updated_at` are database-managed; clients cannot write them (DB-010)
- **Junction tables** — RLS policies validate authorization for both linked FK records; FK indexes required (DB-008, DB-009)

## Migration Workflow

```bash
# 1. Write SQL to supabase/migrations/<timestamp>_description.sql
# 2. Dry-run to verify
npx supabase db push --dry-run

# 3. Push to cloud (no rollback — verify the dry-run first)
npx supabase db push

# 4. Verify in Supabase Studio or via the app
```

Run the RLS policy audit after any migration touching access control:

```bash
# CMD-006: Policy inventory audit
rg "CREATE POLICY" supabase/migrations
```

## Common Modification Patterns

**Adding a migration:** Create a new file in `migrations/` with a timestamp prefix (`YYYYMMDDHHMMSS_description.sql`). Always dry-run before pushing. Migrations in this project frequently add RLS policies, summary views, and pg_cron job registrations in a single file — follow the same pattern as recent migrations.

**Modifying an edge function:** Functions import shared utilities from `functions/_shared/`. The `supabaseAdmin` client uses lazy initialization — call `getSupabaseAdmin()` rather than importing the proxy directly in new code. Input validation uses Zod `z.strictObject()` at the function boundary per CORE-005. Run manual staging verification after changes to `users/index.ts` since it has no automated test suite.

**Adding a SECURITY DEFINER RPC:** Document the bypass reason inline, restrict execution to `authenticated` or a named role, and add a pgTAP test in `tests/` before merging.

## Guardrails

These files and directories require human review before any change is merged:

- `supabase/migrations/` — production schema; no rollback path once pushed
- `supabase/functions/users/index.ts` — Auth Admin API; 8 commits in 14d as of last audit; uncommitted changes in working tree
- `supabase/functions/_shared/supabaseAdmin.ts` — service role client; full RLS bypass
- `functions/.env` — contains ES256 service role JWT tokens (sec-005); never commit to version control
- CORS origin list in `_shared/cors-config.ts` — hardcoded production domains (sec-008)
- Any `SECURITY DEFINER` function — RLS bypass; verify role restriction before push

**Caution Zone per CLAUDE.md:** `supabase/migrations/` and `supabase/functions/` are both listed as Caution Zones requiring confirmation before modification.

## Related

- Full audit report: `docs/audit/baseline/risk-assessment.json` (supabase module entry)
- Auth flow counterpart: `src/atomic-crm/providers/supabase/authProvider.ts` (co-active with `users/index.ts`)
- pgTAP tests: `supabase/tests/`
