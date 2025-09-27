# Migration Cleanup Plan with Rollback Procedures

**Project**: Atomic CRM
**Date**: 2025-01-27
**Current State**: 68 migrations in database, 10 files on disk
**Target State**: 1 consolidated migration

## Executive Summary

This plan consolidates 68 accumulated migrations into a single baseline migration, eliminating technical debt while preserving the exact current schema state. The consolidation removes duplicates, fixes, and obsolete migrations while maintaining data integrity.

## Pre-Execution Checklist

- [ ] **Environment Verification**
  - [ ] Confirm project ID: `aaqnanddcqvfiwhshndl`
  - [ ] Verify Supabase CLI installed
  - [ ] Ensure database access credentials set
  - [ ] Check disk space for backups (need ~50MB)

- [ ] **Team Communication**
  - [ ] Notify team of maintenance window
  - [ ] Schedule during low-traffic period
  - [ ] Prepare rollback communication plan
  - [ ] Assign emergency contact person

- [ ] **Testing Environment**
  - [ ] Create Supabase branch for testing
  - [ ] Run consolidation on branch first
  - [ ] Verify application functionality
  - [ ] Document any issues found

## Step-by-Step Execution Plan

### Phase 1: Preparation (15 minutes)

#### Step 1.1: Review Audit Results
```bash
# Review the migration audit
cat audit_results.md

# Verify 68 migrations identified
# Confirm 26 migrations to keep, 42 to archive
```

#### Step 1.2: Environment Setup
```bash
# Set environment variables
export PROJECT_ID="aaqnanddcqvfiwhshndl"
export BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Create working directory
mkdir -p migration_consolidation_${BACKUP_DATE}
cd migration_consolidation_${BACKUP_DATE}
```

### Phase 2: Backup (20 minutes)

#### Step 2.1: Run Backup Script
```bash
# Execute comprehensive backup
chmod +x backup.sh
./backup.sh

# Expected output:
# ✅ Migration files backed up
# ✅ Database schema exported
# ✅ Migration history saved
# ✅ Rollback plan created
```

#### Step 2.2: Verify Backup
```bash
# Check backup completeness
ls -la backups/${BACKUP_DATE}/

# Verify critical files exist:
# - migrations/           (filesystem migrations)
# - database/            (schema exports)
# - ROLLBACK_PLAN.md     (rollback instructions)
# - metadata.json        (backup metadata)
```

#### Step 2.3: Create Database Backup
```sql
-- Connect to database and run:
CREATE TABLE public.migration_history_backup_20250127 AS
SELECT * FROM supabase_migrations.schema_migrations;

-- Verify backup
SELECT COUNT(*) FROM public.migration_history_backup_20250127;
-- Should return: 68
```

### Phase 3: Archive Old Migrations (10 minutes)

#### Step 3.1: Run Archive Script
```bash
# Execute archive process
chmod +x archive_migrations.sh
./archive_migrations.sh

# When prompted: Type 'y' to confirm

# Expected output:
# ✅ 68 migrations archived
# ✅ Consolidated migration installed
# ✅ Archive manifest created
```

#### Step 3.2: Verify Archive
```bash
# Check archived files
ls -la supabase/migrations/_archived/

# Verify only consolidated migration remains
ls -la supabase/migrations/
# Should show: 20250127000000_consolidated_fresh_schema.sql
```

### Phase 4: Update Database (10 minutes)

#### Step 4.1: Clear Migration History
```sql
-- CRITICAL: Only run after confirming backup exists!
BEGIN;

-- Verify backup
SELECT COUNT(*) as backup_count
FROM public.migration_history_backup_20250127;

-- If backup_count = 68, proceed:
TRUNCATE TABLE supabase_migrations.schema_migrations;

-- Insert consolidated migration
INSERT INTO supabase_migrations.schema_migrations (version, name, executed_at)
VALUES ('20250127000000', 'consolidated_fresh_schema', now());

COMMIT;
```

#### Step 4.2: Verify Migration State
```sql
-- Check new migration state
SELECT * FROM supabase_migrations.schema_migrations;
-- Should show: 1 row with version 20250127000000

-- Compare with backup
SELECT
    'Original' as source, COUNT(*) as count
FROM public.migration_history_backup_20250127
UNION ALL
SELECT
    'Current' as source, COUNT(*) as count
FROM supabase_migrations.schema_migrations;
```

### Phase 5: Validation (15 minutes)

#### Step 5.1: Run Schema Validation
```bash
# Execute validation queries
psql $DATABASE_URL < validate_schema.sql

# Check results for:
# ✅ All 22 tables exist
# ✅ All foreign keys valid
# ✅ All indexes present
# ✅ RLS policies active
# ✅ Views accessible
```

#### Step 5.2: Application Testing
```bash
# Test critical paths:
1. User authentication
2. Create new organization
3. Add contact
4. Create opportunity
5. View reports/summaries

# Monitor for errors in:
- Supabase logs
- Application logs
- Browser console
```

#### Step 5.3: Performance Check
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM organizations_summary LIMIT 10;

EXPLAIN ANALYZE
SELECT * FROM contacts_summary LIMIT 10;

-- Should show index usage and reasonable execution time
```

### Phase 6: Finalization (5 minutes)

#### Step 6.1: Document Completion
```bash
# Create completion report
cat > consolidation_complete.md << EOF
# Migration Consolidation Complete
Date: $(date)
Original Migrations: 68
Consolidated To: 1
Status: SUCCESS

## Verification Results
- Tables: ✅ All present
- Indexes: ✅ All created
- RLS: ✅ Enabled
- Views: ✅ Accessible
- Application: ✅ Functional
EOF
```

#### Step 6.2: Commit Changes
```bash
# Commit the consolidated migration
git add supabase/migrations/20250127000000_consolidated_fresh_schema.sql
git commit -m "feat: consolidate 68 migrations into single baseline

- Reduced migration count from 68 to 1
- Eliminated duplicate and obsolete migrations
- Preserved complete schema state
- Improved migration system maintainability"
```

## Rollback Procedures

### Scenario 1: Immediate Rollback (During Execution)

If issues occur during consolidation:

```bash
# Stop all operations
echo "ROLLBACK INITIATED"

# Restore migration files
rm -rf supabase/migrations/*.sql
cp -r backups/${BACKUP_DATE}/migrations/* supabase/migrations/

# Restore database state
psql $DATABASE_URL << SQL
BEGIN;
TRUNCATE supabase_migrations.schema_migrations;
INSERT INTO supabase_migrations.schema_migrations
SELECT * FROM public.migration_history_backup_20250127;
COMMIT;
SQL

# Verify restoration
echo "Files restored: $(ls supabase/migrations/*.sql | wc -l)"
echo "Migrations in DB: $(psql $DATABASE_URL -c "SELECT COUNT(*) FROM supabase_migrations.schema_migrations")"
```

### Scenario 2: Post-Execution Rollback

If issues discovered after completion:

```bash
# 1. Restore from archive
cd supabase/migrations/_archived/${ARCHIVE_DATE}
cp -r filesystem/* ../../

# 2. Remove consolidated migration
rm ../../20250127000000_consolidated_fresh_schema.sql

# 3. Restore migration history
psql $DATABASE_URL << SQL
BEGIN;
-- Clear current
TRUNCATE supabase_migrations.schema_migrations;

-- Restore original
INSERT INTO supabase_migrations.schema_migrations
SELECT version, name, executed_at
FROM public.migration_history_backup_20250127;

-- Verify
SELECT COUNT(*) as restored_count
FROM supabase_migrations.schema_migrations;
COMMIT;
SQL
```

### Scenario 3: Data Corruption

If data corruption detected:

1. **Use Supabase Point-in-Time Recovery**:
   ```
   - Go to Supabase Dashboard
   - Settings → Backups
   - Select restore point before consolidation
   - Click "Restore"
   ```

2. **Manual Recovery**:
   ```sql
   -- Restore schema from backup
   psql $DATABASE_URL < backups/${BACKUP_DATE}/database/export_schema.sql
   ```

## Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Migration history corruption | Low | High | Complete backup before changes |
| Schema mismatch | Low | High | Validation queries post-consolidation |
| Application errors | Medium | Medium | Test on branch first |
| Performance degradation | Low | Low | Monitor query performance |
| RLS policy issues | Low | High | Verify all policies active |
| View compilation errors | Low | Medium | Test view accessibility |

## Success Criteria

✅ **Technical Success**:
- Single migration file in `supabase/migrations/`
- Single entry in `supabase_migrations.schema_migrations`
- All validation queries pass
- Application functions normally

✅ **Process Success**:
- No data loss
- No extended downtime
- Clear audit trail maintained
- Team informed throughout

## Post-Consolidation Maintenance

### Immediate Actions:
1. Monitor application logs for 24 hours
2. Check Supabase error rates
3. Review user feedback channels
4. Document any minor issues

### Long-term Improvements:
1. Implement migration naming convention: `YYYYMMDDHHMMSS_description`
2. Add pre-commit hooks for migration validation
3. Regular monthly migration reviews
4. Automated testing for migrations

### New Migration Process:
```bash
# Future migrations follow strict naming
supabase migration new "add_feature_x"
# Creates: 20250128093045_add_feature_x.sql

# Test in branch first
supabase branches create test-migration
supabase branches switch test-migration
supabase db push

# Validate before production
npm run test
psql $DATABASE_URL < validate_schema.sql
```

## Contact Information

**Primary Contact**: [Your Name]
- Email: [your.email@company.com]
- Phone: [Your Phone]

**Escalation Contact**: [Manager Name]
- Email: [manager.email@company.com]
- Phone: [Manager Phone]

**Supabase Support**:
- Dashboard: https://app.supabase.com
- Support: support.supabase.com
- Status: status.supabase.com

## Appendix: Command Reference

```bash
# Quick reference for common commands

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;"

# Count tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Verify RLS
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"

# Test views
psql $DATABASE_URL -c "SELECT COUNT(*) FROM organizations_summary;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM contacts_summary;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM opportunities_summary;"

# Check for errors
supabase logs --project-ref ${PROJECT_ID} --tail
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-27
**Status**: Ready for Execution