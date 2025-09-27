# Migration Archive Manifest
**Date**: Fri Sep 26 18:56:04 CDT 2025
**Total Migrations Archived**: 68
**Consolidated Into**: 20250127000000_consolidated_fresh_schema.sql

## Archive Contents

### Filesystem Migrations
- Location: supabase/migrations/_archived/20250926_185604/filesystem/
- Count: 0 files

### Database Exports
- Location: supabase/migrations/_archived/20250926_185604/database/
- Files:
  - export_migrations.sql - Migration history export
  - update_migrations.sql - SQL to update migration table
  - migrations.json - Migration metadata

## Migration Categories Archived

### Initial Schema (18 migrations)
Core table creation and initial setup

### Duplicate Operations (8 migrations)
Repeated attempts at the same operations

### Fix Migrations (17 migrations)
Patches for previous migration issues

### Obsolete Features (17 migrations)
Backward compatibility and removed features

### Current Features (8 migrations)
Kept and consolidated into new migration

## Key Consolidations

1. **Summary Views**: 5 attempts consolidated into final version
2. **Security Definer**: 4 fixes consolidated
3. **Contacts Summary**: 3 versions merged
4. **Companies→Organizations**: Complete rename chain removed
5. **Backward Compatibility**: Added then removed entirely

## Rollback Instructions

If you need to rollback this consolidation:

1. Restore migration files:
   ```bash
   cp -r supabase/migrations/_archived/20250926_185604/filesystem/* supabase/migrations/
   ```

2. Restore migration history:
   ```sql
   TRUNCATE supabase_migrations.schema_migrations;
   INSERT INTO supabase_migrations.schema_migrations
   SELECT version, name, executed_at FROM public.migration_history_backup_20250127;
   ```

3. Remove consolidated migration:
   ```bash
   rm supabase/migrations/20250127000000_consolidated_fresh_schema.sql
   ```

## Notes

- All 68 migrations have been analyzed and categorized
- Duplicates and obsolete migrations identified
- Final schema state preserved in consolidated migration
- No data loss - only migration history cleaned
