# Shared Team Access Security Model

Crispy CRM uses a **team-shared data model** where authenticated users can access all records. This is intentional for small-team CRMs.

## Rationale

- **Small team (<50 users)**: All sales team members benefit from seeing complete customer picture
- **Sales data is shared by design**: Collaboration requires visibility into all opportunities and interactions
- **Simplifies collaboration**: No permission boundaries between team members who work together

## RLS Pattern

Current security approach for shared-access tables:

```sql
-- SELECT: Authenticated users see all non-deleted records
CREATE POLICY "table_select_policy"
  ON table_name FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

-- INSERT/UPDATE: Additional validation via application layer
CREATE POLICY "table_insert_policy"
  ON table_name FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    -- Foreign key validation happens at application layer
  );

-- DELETE: Soft delete only (prevented by RLS)
-- Uses UPDATE deleted_at = NOW() instead of DELETE
```

## Security Layers

1. **Authentication boundary**: `auth.uid() IS NOT NULL` prevents anonymous access
2. **Soft delete filtering**: `deleted_at IS NULL` enforced at RLS level
3. **Application validation**: Zod schemas at provider boundary validate business rules
4. **Audit trail**: All changes logged with user attribution

## Tables Using This Pattern

- `activities` - Team members see all customer interactions
- `opportunities` - Full pipeline visibility for collaboration
- `contacts` - Shared contact database
- `organizations` - Shared customer/distributor records
- `tasks` - Team task visibility

## Future: Multi-Tenant Isolation

When scaling beyond single-team use (e.g., multiple independent sales teams), add `company_id` column and update RLS:

```sql
CREATE POLICY "multi_tenant_select_policy"
  ON table_name FOR SELECT
  USING (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    AND deleted_at IS NULL
  );
```

## Not Applicable To

Some tables have stricter access controls:

- **User management tables**: Role-based access (admin-only)
- **System configuration**: Service role only
- **Private user data**: Owner-only access via `user_id = auth.uid()`

## References

- [DATABASE_LAYER.md](../../.claude/rules/DATABASE_LAYER.md) - RLS policy patterns
- [PROVIDER_RULES.md](../../.claude/rules/PROVIDER_RULES.md) - Application-layer validation

---

**Last Updated:** 2026-01-25
**Status:** Current security model for v0.1.0
