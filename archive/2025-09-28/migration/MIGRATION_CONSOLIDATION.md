# Migration Consolidation

**Date:** 2025-01-27
**Action:** Consolidated 68 historical migrations into single baseline
**File:** `20250127000000_consolidated_fresh_schema.sql`

## Status
- Database cleaned of all migration artifacts
- Single migration entry in migration_history table
- All legacy "deals" references removed
- Fresh baseline established

## Future Migrations
- **Never modify** the consolidated baseline migration
- Use timestamp format: `YYYYMMDDHHMMSS_description.sql`
- All changes as incremental migrations
- Follow Engineering Constitution: No over-engineering, fail fast

## Notes
- This is a development environment, never deployed to production
- All data is test data
- No backward compatibility needed per Engineering Constitution