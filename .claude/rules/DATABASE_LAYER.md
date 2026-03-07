---
globs: ["supabase/**"]
---

# Database Layer Overlay

Scope: RLS, SQL view strategy, soft-delete enforcement, FK/index conventions, and storage-table security.

## Applies

- `CORE-008`, `CORE-010`, `CORE-011`, `CORE-019`, `CORE-020`

## Database Rules

- [DB-001] List/read workloads must use summary SQL views with precomputed fields where configured.
- [DB-002] Do not implement view-computable aggregations in application JavaScript when SQL can calculate them.
- [DB-003] Read policies must enforce soft-delete visibility (`deleted_at` hidden) plus authenticated tenant/ownership filters.
- [DB-004] Soft-delete cascade behavior must be enforced in SQL policies/triggers, not only in frontend filters.
- [DB-005] `storage.objects` must have RLS enabled; private buckets are default for tenant/user data.
- [DB-006] Storage paths must follow `/{tenant_id}/{resource}/{record_id}/{filename}` and DB rows store path keys, not signed URLs.
- [DB-007] `USING (true)` is banned except explicit `service_role` or approved public reference-data policies.
- [DB-008] Junction-table policies must validate authorization for both linked foreign-key records.
- [DB-009] Junction-table authorization queries must be backed by FK indexes to avoid full scans.
- [DB-010] `created_at` and `updated_at` are database-managed fields; clients cannot own timestamp writes.
- [DB-011] Computed fields must use generated columns/views/triggers instead of frontend mutation logic.
- [DB-012] New FKs to `sales` follow convention: ownership/audit metadata uses `SET NULL`; immutable audit trail references may use `NO ACTION`.
- [DB-013] Policy audits must run with `CMD-006` when changing migrations or RLS rules.

## Canonical Risk Stub (Permissive Policy)

```sql
-- Disallowed except approved service/public cases
CREATE POLICY "bad_select" ON product_distributors FOR SELECT USING (true);
```

## Checklist IDs

- `DB-001`
- `DB-002`
- `DB-003`
- `DB-004`
- `DB-005`
- `DB-006`
- `DB-007`
- `DB-008`
- `DB-009`
- `DB-010`
- `DB-011`
- `DB-012`
- `DB-013`
