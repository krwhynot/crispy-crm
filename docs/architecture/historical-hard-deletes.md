# Historical Hard DELETE Migrations

## Purpose

This document explains the presence of hard DELETE statements in certain historical migrations that cannot be changed because they have already been applied in production environments.

## Policy

**Current Standard**: All data deletions MUST use soft deletes (`UPDATE deleted_at = NOW()`).

**Historical Exception**: Migrations listed below contain hard DELETE statements that were necessary for one-time data cleanup operations during Phase 2 consolidation.

## Affected Migrations

### Migration: `20251117123500_phase2d_consolidate_duplicates.sql`

**Purpose**: One-time data consolidation during Phase 2D migration to merge duplicate organization records and establish canonical relationships.

**Why Hard DELETE Was Necessary**:
1. **Data Integrity**: Duplicate organization records needed complete removal after relationship consolidation
2. **Foreign Key Constraints**: Proper cleanup of duplicate references before establishing new canonical relationships
3. **One-Time Operation**: This was a migration-time operation, not runtime behavior that would benefit from soft delete recovery

**Hard DELETE Statements**:
- Line 102: `DELETE FROM organizations WHERE id = ANY(duplicate_org_ids);`
  - Context: Removes duplicate organization records after consolidating all relationships to canonical organizations
  - Justification: Duplicates serve no purpose after consolidation; soft delete would leave orphaned data

**Migration Status**: ✅ Applied in production - cannot be modified

**Future Guidance**: Similar cleanup operations should:
1. Use soft deletes for runtime operations
2. Consider hard DELETE only for one-time migration cleanup of truly invalid data
3. Document the reasoning in migration comments
4. Get architectural review before execution

## Verification

To verify no new hard DELETEs are introduced:

```bash
# Search for DELETE statements in migrations (excluding historical exceptions)
grep -r "DELETE FROM" supabase/migrations/ \
  | grep -v "20251117123500" \
  | grep -v "soft.delete" \
  | grep -v "-- " \
  | grep -v "/\*"
```

Expected output: Only soft delete patterns (`UPDATE ... SET deleted_at`) or historical migrations.

## See Also

- `.claude/rules/DATABASE_LAYER.md` - Soft delete enforcement policy
- `.claude/rules/PROVIDER_RULES.md` - Data provider soft delete patterns
- `supabase/migrations/20251108051117_add_soft_delete_columns.sql` - Soft delete infrastructure

---

**Document Status**: Living document
**Last Updated**: 2026-01-26
**Maintained By**: Database Architecture Team
**Related Audit**: Critical Issues Resolution Plan 2026-01-26
