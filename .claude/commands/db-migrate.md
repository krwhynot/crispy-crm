---
description: Create and validate new database migration
allowed-tools: Bash, Read, Write
argument-hint: <migration-name>
---

# Database Migration Command

Create, validate, and apply a new Supabase migration.

## Process

1. **Create migration file:**
   ```bash
   just db-migrate $ARGUMENTS
   ```

2. **Review generated SQL:**
   - Check for required columns (id, created_at, updated_at, deleted_at)
   - Verify RLS policies include `deleted_at IS NULL`
   - Ensure `DROP POLICY IF EXISTS` before `CREATE POLICY`

3. **Validate migration:**
   ```bash
   ./scripts/validate-migrations.sh <new-migration-file>
   ```

4. **Apply to local database:**
   ```bash
   just db-reset
   ```

5. **Regenerate TypeScript types:**
   ```bash
   just db-types
   ```

6. **Verify types compile:**
   ```bash
   just typecheck
   ```

## Migration Checklist

- [ ] All tables have required columns
- [ ] *_summary views include base table columns
- [ ] RLS policies filter soft-deleted records
- [ ] Policies are idempotent (DROP IF EXISTS)
- [ ] No hard DELETEs (use soft delete)
- [ ] Foreign keys have indexes

## Rules

- NEVER run migrations on production directly
- Always test locally first with `just db-reset`
- Regenerate types after schema changes
- Validate before committing
