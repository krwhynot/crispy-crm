# Data Consolidation History

Historical record of one-time data cleanup operations that used hard DELETE statements.

## Purpose

This document exists to acknowledge that certain migrations contain hard DELETE operations that violate the current "soft delete only" engineering principle. These are **historical exceptions** from initial data import cleanup, not ongoing patterns.

## One-Time Migrations (Already Executed)

### Phase 2D: Consolidate Duplicates
**Migration:** `20251117123500_phase2d_consolidate_duplicates.sql`
**Date:** 2025-11-17
**Reason:** Remove duplicate records created during initial data import

**Tables affected:**
- Duplicate contact records merged into canonical versions
- Orphaned relationship records cleaned up
- Staging table data removed after successful import

**Justification:** These were one-time operations during initial data migration before production launch. The duplicates were artifacts of the import process, not legitimate deleted records that needed audit trails.

## Engineering Constitution Compliance

**Current Rule (Effective Post-Launch):**
> All DELETE operations MUST use soft delete: `UPDATE ... SET deleted_at = NOW()`

**Why Historical Deletes Don't Violate This:**
1. Executed during pre-production data migration phase
2. No audit trail needed for import artifacts
3. User-generated data was never hard-deleted
4. System moved to soft-delete-only before first production use

## Future Data Cleanup

If similar bulk cleanup is needed in the future:

### Preferred Approach
```sql
-- Soft delete duplicates for audit trail
UPDATE contacts
SET deleted_at = NOW(),
    deleted_reason = 'Duplicate of contact_id: ' || canonical_id
WHERE id IN (SELECT duplicate_id FROM duplicates_to_remove);
```

### Exception Process
If hard DELETE is genuinely required:

1. **Document justification** in migration comments
2. **Get approval** from tech lead
3. **Create backup** of affected records
4. **Log operation** in this file with:
   - Migration filename and date
   - Tables/record count affected
   - Business justification
   - Rollback procedure

## Audit Trail

| Date | Migration | Tables | Records | Reason |
|------|-----------|--------|---------|---------|
| 2025-11-17 | `20251117123500_phase2d_consolidate_duplicates.sql` | contacts, relationships | ~150 | Import deduplication |

## Verification

To verify no ongoing hard deletes exist:

```bash
# Search for DELETE statements in recent migrations (last 30 days)
find supabase/migrations -name "*.sql" -mtime -30 -exec grep -l "DELETE FROM" {} \;

# Should return empty (or only service/staging tables)
```

## References

- [DATABASE_LAYER.md](../.claude/rules/DATABASE_LAYER.md) - Soft delete rules
- [PROVIDER_RULES.md](../.claude/rules/PROVIDER_RULES.md) - Provider-layer soft delete enforcement

---

**Last Updated:** 2026-01-25
**Status:** Historical record - no ongoing hard deletes permitted
