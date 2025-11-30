# Manual Rollback Procedure Documentation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Document manual rollback procedures for when automatic rollback fails

**Architecture:** Operator guide with step-by-step instructions, verification checklists, troubleshooting

**Tech Stack:** Markdown documentation
**Effort:** 2 hours | **Priority:** LOW | **Status:** Automatic rollback 100%, manual procedure partially documented

---

## Implementation

### Task 1: Create Manual Rollback Guide (2 hours)

**File:** `docs/operations/manual-rollback-procedure.md`

```markdown
# Manual Rollback Procedure

**Purpose:** Manual database rollback when automatic rollback fails or is unavailable

**When to Use:**
- Automatic rollback in deploy-safe.sh fails
- Need to rollback without running full deployment script
- Emergency rollback required
- Rollback to non-immediate prior state

**Prerequisites:**
- Database backup file exists
- PostgreSQL client (psql) installed
- Database credentials available
- **CRITICAL:** Test on local first before production

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Pre-Rollback Checklist](#pre-rollback-checklist)
3. [Rollback Procedure](#rollback-procedure)
4. [Verification Steps](#verification-steps)
5. [Troubleshooting](#troubleshooting)
6. [Recovery Scenarios](#recovery-scenarios)

---

## Quick Reference

### Emergency Rollback (Production)

```bash
# 1. Create emergency backup FIRST
npm run db:cloud:backup -- emergency-$(date +%Y%m%d-%H%M%S)

# 2. Stop application (prevent new writes)
# [Stop deployment or set to maintenance mode]

# 3. Restore from backup
psql "$DATABASE_URL_PRODUCTION" < backups/migrations/cloud_backup_[TIMESTAMP].sql

# 4. Verify restoration
psql "$DATABASE_URL_PRODUCTION" -c "SELECT COUNT(*) FROM contacts;"
psql "$DATABASE_URL_PRODUCTION" -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# 5. Restart application
# [Resume deployment]
```

---

## Pre-Rollback Checklist

**Before executing rollback, verify:**

- [ ] **Backup exists** - Confirm backup file is available and valid
- [ ] **Emergency backup created** - ALWAYS create new backup before rollback
- [ ] **Application stopped** - Prevent data writes during rollback
- [ ] **Stakeholders notified** - Inform team of planned rollback
- [ ] **Tested locally first** - If possible, test rollback on local environment
- [ ] **Access verified** - Confirm database credentials work
- [ ] **Disk space checked** - Ensure sufficient space for restore operation
- [ ] **Timeline documented** - Record start time and expected duration

**⚠️ CRITICAL WARNING:**

Rollback will **DELETE ALL DATA** created after the backup timestamp.
- Any records created after backup will be lost
- Any updates made after backup will be reverted
- Ensure application is stopped to prevent new data creation

---

## Rollback Procedure

### Step 1: Verify Backup File

```bash
# Navigate to project root
cd /path/to/atomic-crm

# List available backups
ls -lh backups/migrations/

# Expected output:
# cloud_backup_20251104_143000.sql  (example)

# Verify backup file integrity
file backups/migrations/cloud_backup_[TIMESTAMP].sql

# Should show: "ASCII text" or "SQL script"

# Check backup size (should be >100KB typically)
du -h backups/migrations/cloud_backup_[TIMESTAMP].sql
```

**If backup file is missing or corrupted:**
- Check `backups/migrations/` directory
- Look for nearest valid backup
- Contact database administrator if no backups exist

---

### Step 2: Create Emergency Backup

**⚠️ NEVER SKIP THIS STEP**

Even if rollback is needed, create backup of current state first. This allows:
- Recovery if rollback fails
- Forensic analysis of what went wrong
- Ability to restore recent data if needed

```bash
# For production
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump "$DATABASE_URL_PRODUCTION" > "backups/migrations/emergency_${TIMESTAMP}.sql"

# Verify emergency backup created
ls -lh backups/migrations/emergency_*.sql
```

---

### Step 3: Stop Application

**Prevent new data writes during rollback.**

**Option A: Maintenance Mode (Preferred)**
```bash
# If application supports maintenance mode
# [Platform-specific command]
```

**Option B: Stop Services**
```bash
# Stop web server / containers
# [Platform-specific command]
```

**Option C: Database Read-Only (Emergency)**
```bash
# Set database to read-only temporarily
psql "$DATABASE_URL_PRODUCTION" <<EOF
ALTER DATABASE postgres SET default_transaction_read_only = ON;
EOF
```

---

### Step 4: Execute Rollback

**⚠️ POINT OF NO RETURN - Data created after backup will be lost**

```bash
# Set database URL (for production)
export DATABASE_URL="$DATABASE_URL_PRODUCTION"

# Execute rollback
psql "$DATABASE_URL" < backups/migrations/cloud_backup_[TIMESTAMP].sql

# Expected output:
# SET
# SET
# CREATE SCHEMA
# ALTER SCHEMA
# [Many SQL commands...]
# COMMIT
```

**Monitor for errors:**
- **Permission denied** → Check database credentials
- **Database does not exist** → Verify database name
- **Syntax error** → Backup file may be corrupted
- **Connection refused** → Check database is running

**If errors occur:**
- Stop rollback immediately (Ctrl+C)
- Review error messages
- Consult troubleshooting section below
- DO NOT RETRY without understanding error

---

### Step 5: Verify Rollback Success

**Run verification queries to confirm database state:**

```bash
# 1. Check record counts match backup timestamp expectations
psql "$DATABASE_URL" -c "SELECT
  (SELECT COUNT(*) FROM contacts) as contacts,
  (SELECT COUNT(*) FROM organizations) as organizations,
  (SELECT COUNT(*) FROM opportunities) as opportunities;"

# 2. Verify migration version
psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations
  ORDER BY version DESC LIMIT 5;"

# Compare against backup timestamp - migration version should match pre-rollback state

# 3. Check recent timestamps
psql "$DATABASE_URL" -c "SELECT
  'contacts' as table_name,
  MAX(created_at) as latest_created
FROM contacts
UNION ALL
SELECT
  'organizations',
  MAX(created_at)
FROM organizations
UNION ALL
SELECT
  'opportunities',
  MAX(created_at)
FROM opportunities;"

# Latest timestamps should be BEFORE backup timestamp

# 4. Spot check critical data
psql "$DATABASE_URL" -c "SELECT id, name, created_at FROM organizations
  WHERE is_principal = true
  ORDER BY created_at DESC LIMIT 5;"
```

**Verification Checklist:**
- [ ] Record counts reasonable (not zero, not excessive)
- [ ] Migration version matches expected state
- [ ] Latest timestamps are before backup timestamp
- [ ] Critical records exist (principals, test users)
- [ ] No obvious data corruption
- [ ] Foreign key constraints intact

---

### Step 6: Resume Application

```bash
# Remove read-only constraint if set
psql "$DATABASE_URL" <<EOF
ALTER DATABASE postgres SET default_transaction_read_only = OFF;
EOF

# Restart application services
# [Platform-specific command]

# Run health check
curl https://app.atomiccrm.com/health

# Expected: {"status": "ok"}
```

---

### Step 7: Post-Rollback Verification

**Test critical application paths:**

```bash
# Run smoke tests
npm run test:e2e -- --grep="critical-path"

# Or manual testing:
# 1. Login to application
# 2. View dashboard (should load)
# 3. List contacts (should display)
# 4. Create test record (should succeed)
# 5. Delete test record
```

**Monitor for issues:**
- Check error logs (Sentry)
- Watch database query performance
- Monitor user reports

---

## Verification Steps

### Quick Verification (2 minutes)

```bash
# Run validation suite
npm run db:validate:all

# Expected output:
# ✅ Referential integrity: PASS
# ✅ Required fields: PASS
# ✅ Unique constraints: PASS
# ✅ Data quality: PASS (85%+)
```

### Full Verification (10 minutes)

```bash
# Run full validation
cd scripts/validation
node run-pre-validation.js

# Review output for errors
# Should show: GO status or specific failures
```

---

## Troubleshooting

### Error: "permission denied for table X"

**Cause:** Backup file contains tables your user doesn't have access to

**Fix:**
```bash
# Connect as superuser
psql "$DATABASE_URL" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;"
psql "$DATABASE_URL" -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;"

# Retry rollback
```

---

### Error: "duplicate key value violates unique constraint"

**Cause:** Trying to restore over existing data without dropping first

**Fix:**
```bash
# Option 1: Drop and recreate database (DATA LOSS)
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE;"
psql "$DATABASE_URL" -c "CREATE SCHEMA public;"

# Then retry rollback

# Option 2: Restore to different database
psql "$DATABASE_URL" -c "CREATE DATABASE atomic_crm_restored;"
psql "postgresql://user@host/atomic_crm_restored" < backup.sql
```

---

### Error: "relation does not exist"

**Cause:** Backup references table that doesn't exist yet

**Fix:**
```bash
# Run migrations first, then restore data only
npx supabase migration up

# Extract data-only backup
pg_dump "$DATABASE_URL" --data-only > data-only.sql
psql "$DATABASE_URL" < data-only.sql
```

---

### Rollback Appears Successful But Data Missing

**Cause:** Wrong backup file used or backup incomplete

**Diagnosis:**
```bash
# Check backup timestamp
head -20 backups/migrations/cloud_backup_[TIMESTAMP].sql | grep "Dumped from"

# Compare to incident timeline
```

**Fix:**
- Identify correct backup file from timeline
- Re-run rollback with correct backup
- If no valid backup exists, restore from emergency backup

---

## Recovery Scenarios

### Scenario 1: Automatic Rollback Failed During Deployment

**Symptoms:**
- `deploy-safe.sh` exited with error
- Database in unknown state
- Application may be offline

**Recovery:**
```bash
# 1. Check last backup created by deploy-safe.sh
ls -lh backups/migrations/ | tail -1

# 2. Restore from that backup (manual procedure above)
psql "$DATABASE_URL" < backups/migrations/cloud_backup_[LATEST].sql

# 3. Run post-rollback verification
npm run db:validate:all
```

---

### Scenario 2: Need to Rollback to Older State (Not Immediate Prior)

**Symptoms:**
- Issue discovered hours/days after deployment
- Multiple backups since problematic deployment

**Recovery:**
```bash
# 1. Identify correct backup by timestamp
ls -lh backups/migrations/ | grep cloud_backup

# Look for backup BEFORE problematic deployment

# 2. Review backup contents (first 100 lines)
head -100 backups/migrations/cloud_backup_[TIMESTAMP].sql

# 3. Execute manual rollback (full procedure above)
# WARNING: Will lose ALL data between that backup and now
```

---

### Scenario 3: Corrupted Backup File

**Symptoms:**
- Backup restore fails with syntax errors
- Backup file size suspiciously small (<10KB)

**Recovery:**
```bash
# 1. Check backup file integrity
file backups/migrations/cloud_backup_[TIMESTAMP].sql
wc -l backups/migrations/cloud_backup_[TIMESTAMP].sql

# 2. Try previous backup
ls -lh backups/migrations/ | tail -5

# 3. If all backups corrupted, contact Supabase support
# They may have point-in-time recovery available
```

---

### Scenario 4: No Backups Available

**⚠️ CRITICAL SITUATION**

**Recovery:**
```bash
# 1. Check Supabase automatic backups
# Login to Supabase dashboard
# Navigate to Database > Backups
# Look for automatic daily backups

# 2. Request Supabase support assistance
# They have WAL archives for point-in-time recovery

# 3. Check local development database
# May have copy of data for reference

# 4. Review audit logs to understand data loss scope
psql "$DATABASE_URL" -c "SELECT * FROM audit_log
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC LIMIT 100;"
```

---

## Best Practices

1. **Always create emergency backup before rollback**
2. **Test rollback procedure on local environment first**
3. **Document rollback decision and timeline**
4. **Verify success with full validation suite**
5. **Monitor application closely after rollback**
6. **Schedule post-mortem within 48 hours**
7. **Update incident log with rollback details**

---

## Post-Rollback Checklist

- [ ] Rollback completed successfully
- [ ] Verification queries pass
- [ ] Application health check passes
- [ ] Smoke tests pass
- [ ] Stakeholders notified of completion
- [ ] Incident log updated
- [ ] Post-mortem scheduled
- [ ] Backup retention reviewed

---

## Related Documentation

- [Incident Response Playbook](./incident-response-playbook.md)
- [Production Deployment Guide](../../scripts/db/PRODUCTION-WARNING.md)
- [Database Backup Procedures](../../scripts/migration/backup.sh)
- [Supabase Workflow Guide](../supabase/WORKFLOW.md)

---

**Document Version:** 1.0
**Last Updated:** November 4, 2025
**Review Frequency:** After each rollback event
**Owner:** Database Administrator

**⚠️ IMPORTANT:** This procedure should be practiced in staging environment quarterly to ensure team familiarity.
```

---

### Task 2: Update README & Commit (10 minutes)

**File:** `README.md` (operations section)

```markdown
## Operations

**Deployment:**
- [Production Deployment Guide](scripts/db/PRODUCTION-WARNING.md) ⚠️
- [Safe Deployment Script](scripts/migration/deploy-safe.sh) (automatic rollback)

**Incident Response:**
- [Incident Response Playbook](docs/operations/incident-response-playbook.md) 🚨
- [Manual Rollback Procedure](docs/operations/manual-rollback-procedure.md)

**Database:**
- [Supabase Workflow](docs/supabase/WORKFLOW.md)
- [Migration Business Rules](docs/database/migration-business-rules.md)
```

**Commit:**
```bash
git add docs/operations/manual-rollback-procedure.md
git add README.md
git commit -m "docs: add manual rollback procedure for operators

- Create step-by-step manual rollback guide
- Add pre-rollback checklist (emergency backup, app stop)
- Document verification steps and queries
- Add troubleshooting for common rollback errors
- Document recovery scenarios (failed auto-rollback, corrupted backup, no backups)
- Include post-rollback verification checklist
- Add quick reference for emergency rollback

Complements automatic rollback in deploy-safe.sh

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Plan Status:** ✅ Ready | **Time:** 2 hours | **Impact:** LOW (Safety net for operations)

**Related:** Complements automatic rollback in `scripts/migration/deploy-safe.sh`
**Practice Frequency:** Quarterly rollback drills in staging environment
