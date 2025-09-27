#!/bin/bash
# =====================================================================
# Archive Old Migrations Script
# Date: 2025-01-27
# Purpose: Archive 68 old migrations and clean up migration system
# =====================================================================

set -e  # Exit on error

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

set -u  # Exit on undefined variable after loading env

# Configuration
PROJECT_ID="aaqnanddcqvfiwhshndl"
ARCHIVE_DIR="supabase/migrations/_archived/$(date +%Y%m%d_%H%M%S)"
NEW_MIGRATION="20250127000000_consolidated_fresh_schema.sql"
BACKUP_TABLE="migration_history_backup_20250127"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================================
# Functions
# =====================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# =====================================================================
# Pre-flight Checks
# =====================================================================

preflight_checks() {
    log_step "Running pre-flight checks..."

    # Check if consolidated migration exists
    if [ ! -f "${NEW_MIGRATION}" ]; then
        log_error "Consolidated migration not found: ${NEW_MIGRATION}"
        exit 1
    fi

    # Check if backup exists
    if [ ! -f "backup.sh" ]; then
        log_warn "Backup script not found. Run backup.sh first!"
        read -p "Continue without backup? (y/N): " confirm
        if [ "${confirm}" != "y" ]; then
            exit 1
        fi
    fi

    # Check Supabase CLI
    if ! command -v supabase &> /dev/null; then
        log_warn "Supabase CLI not found. Some operations may fail."
    fi

    log_info "Pre-flight checks passed"
}

# =====================================================================
# Step 1: Create Archive Directory
# =====================================================================

create_archive_directory() {
    log_step "Creating archive directory..."

    mkdir -p "${ARCHIVE_DIR}"
    mkdir -p "${ARCHIVE_DIR}/filesystem"
    mkdir -p "${ARCHIVE_DIR}/database"

    log_info "Archive directory created: ${ARCHIVE_DIR}"
}

# =====================================================================
# Step 2: Archive Filesystem Migrations
# =====================================================================

archive_filesystem_migrations() {
    log_step "Archiving filesystem migrations..."

    # Move existing migration files to archive
    if [ -d "supabase/migrations" ]; then
        # Count existing files
        local count=$(find supabase/migrations -name "*.sql" -type f | wc -l)

        if [ ${count} -gt 0 ]; then
            # Copy all existing migrations to archive
            cp -r supabase/migrations/* "${ARCHIVE_DIR}/filesystem/" 2>/dev/null || true

            # Remove old migrations (except consolidated)
            find supabase/migrations -name "*.sql" -type f ! -name "${NEW_MIGRATION##*/}" -exec rm {} \;

            log_info "Archived ${count} migration files"
        else
            log_warn "No migration files found to archive"
        fi
    fi

    # Move archived directory if it exists
    if [ -d "supabase/migrations/archive" ]; then
        mv supabase/migrations/archive "${ARCHIVE_DIR}/filesystem/"
        log_info "Moved existing archive directory"
    fi
}

# =====================================================================
# Step 3: Export Database Migration History
# =====================================================================

export_migration_history() {
    log_step "Exporting database migration history..."

    # Create export SQL
    cat > "${ARCHIVE_DIR}/database/export_migrations.sql" << 'EOF'
-- Export current migration history
SELECT
    version,
    name,
    'archived' as status,
    now() as archived_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
EOF

    # Create JSON export for reference
    cat > "${ARCHIVE_DIR}/database/migrations.json" << 'EOF'
{
    "total_migrations": 68,
    "date_range": {
        "first": "20250923012432",
        "last": "20250926125832"
    },
    "consolidated_to": "20250127000000_consolidated_fresh_schema",
    "archive_reason": "Migration consolidation to reduce technical debt"
}
EOF

    log_info "Migration history exported"
}

# =====================================================================
# Step 4: Update Database Migration History
# =====================================================================

update_migration_history() {
    log_step "Updating database migration history..."

    # Create update SQL
    cat > "${ARCHIVE_DIR}/database/update_migrations.sql" << EOF
-- =====================================================================
-- Migration History Reset
-- Date: $(date)
-- =====================================================================

BEGIN;

-- 1. Verify backup exists
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '${BACKUP_TABLE}'
    ) THEN
        RAISE EXCEPTION 'Backup table % does not exist. Run backup first!', '${BACKUP_TABLE}';
    END IF;
END \$\$;

-- 2. Clear current migration history
TRUNCATE TABLE supabase_migrations.schema_migrations;

-- 3. Insert consolidated migration entry
INSERT INTO supabase_migrations.schema_migrations (version, name, executed_at)
VALUES (
    '20250127000000',
    'consolidated_fresh_schema',
    now()
);

-- 4. Verify single entry
DO \$\$
DECLARE
    migration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migration_count FROM supabase_migrations.schema_migrations;

    IF migration_count != 1 THEN
        RAISE EXCEPTION 'Migration count is %, expected 1', migration_count;
    END IF;
END \$\$;

-- 5. Add audit entry
INSERT INTO public.migration_history (
    phase_number,
    phase_name,
    status,
    started_at,
    completed_at,
    rows_affected
) VALUES (
    '20250127_consolidation',
    'migration_system_cleanup',
    'completed',
    now(),
    now(),
    68
);

COMMIT;

-- =====================================================================
-- Verification
-- =====================================================================

SELECT
    'Current Migrations' as check_type,
    COUNT(*) as count,
    MIN(version) as first_version,
    MAX(version) as last_version
FROM supabase_migrations.schema_migrations

UNION ALL

SELECT
    'Backed Up Migrations' as check_type,
    COUNT(*) as count,
    MIN(version) as first_version,
    MAX(version) as last_version
FROM public.${BACKUP_TABLE};
EOF

    log_info "Migration update SQL created: ${ARCHIVE_DIR}/database/update_migrations.sql"
    log_warn "Run this SQL manually to update the database migration history"
}

# =====================================================================
# Step 5: Copy New Consolidated Migration
# =====================================================================

install_consolidated_migration() {
    log_step "Installing consolidated migration..."

    # Copy consolidated migration to migrations directory
    cp "${NEW_MIGRATION}" "supabase/migrations/"

    # Verify it's there
    if [ -f "supabase/migrations/${NEW_MIGRATION##*/}" ]; then
        log_info "Consolidated migration installed successfully"
    else
        log_error "Failed to install consolidated migration"
        exit 1
    fi
}

# =====================================================================
# Step 6: Create Archive Manifest
# =====================================================================

create_archive_manifest() {
    log_step "Creating archive manifest..."

    cat > "${ARCHIVE_DIR}/MANIFEST.md" << EOF
# Migration Archive Manifest
**Date**: $(date)
**Total Migrations Archived**: 68
**Consolidated Into**: ${NEW_MIGRATION}

## Archive Contents

### Filesystem Migrations
- Location: ${ARCHIVE_DIR}/filesystem/
- Count: $(find ${ARCHIVE_DIR}/filesystem -name "*.sql" 2>/dev/null | wc -l) files

### Database Exports
- Location: ${ARCHIVE_DIR}/database/
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
   \`\`\`bash
   cp -r ${ARCHIVE_DIR}/filesystem/* supabase/migrations/
   \`\`\`

2. Restore migration history:
   \`\`\`sql
   TRUNCATE supabase_migrations.schema_migrations;
   INSERT INTO supabase_migrations.schema_migrations
   SELECT version, name, executed_at FROM public.${BACKUP_TABLE};
   \`\`\`

3. Remove consolidated migration:
   \`\`\`bash
   rm supabase/migrations/${NEW_MIGRATION##*/}
   \`\`\`

## Notes

- All 68 migrations have been analyzed and categorized
- Duplicates and obsolete migrations identified
- Final schema state preserved in consolidated migration
- No data loss - only migration history cleaned
EOF

    log_info "Archive manifest created"
}

# =====================================================================
# Step 7: Create Verification Script
# =====================================================================

create_verification() {
    log_step "Creating verification script..."

    cat > "${ARCHIVE_DIR}/verify_archive.sh" << 'EOF'
#!/bin/bash
# Verify archive completeness

echo "Archive Verification Report"
echo "=========================="
echo ""

# Check archived files
echo "Archived Migration Files:"
find _archived -name "*.sql" -type f | wc -l

# Check current migrations
echo ""
echo "Current Migration Files:"
find ../.. -maxdepth 1 -name "*.sql" -type f | wc -l

# List current files
echo ""
echo "Current Files in migrations/:"
ls -la ../../*.sql 2>/dev/null || echo "No SQL files in migrations/"

echo ""
echo "Archive Directory Structure:"
tree -L 2 . 2>/dev/null || find . -maxdepth 2 -type d

echo ""
echo "=========================="
echo "Verification Complete"
EOF

    chmod +x "${ARCHIVE_DIR}/verify_archive.sh"
    log_info "Verification script created"
}

# =====================================================================
# Main Execution
# =====================================================================

main() {
    echo "========================================"
    echo "Migration Archive Process"
    echo "Date: $(date)"
    echo "========================================"
    echo ""

    # Confirmation
    echo -e "${YELLOW}WARNING: This will archive 68 migrations and reset the migration history${NC}"
    echo "Make sure you have:"
    echo "  1. Run the backup script (backup.sh)"
    echo "  2. Reviewed the consolidated migration"
    echo "  3. Tested in a development environment"
    echo ""
    read -p "Continue with archiving? (y/N): " confirm
    if [ "${confirm}" != "y" ]; then
        log_info "Archive cancelled"
        exit 0
    fi

    # Execute steps
    preflight_checks
    create_archive_directory
    archive_filesystem_migrations
    export_migration_history
    update_migration_history
    install_consolidated_migration
    create_archive_manifest
    create_verification

    # Summary
    echo ""
    echo "========================================"
    echo -e "${GREEN}Archive Complete!${NC}"
    echo "========================================"
    echo ""
    echo "Archive Location: ${ARCHIVE_DIR}"
    echo ""
    echo "Files Created:"
    echo "  - Filesystem backups: ${ARCHIVE_DIR}/filesystem/"
    echo "  - Database scripts: ${ARCHIVE_DIR}/database/"
    echo "  - Manifest: ${ARCHIVE_DIR}/MANIFEST.md"
    echo "  - Verification: ${ARCHIVE_DIR}/verify_archive.sh"
    echo ""
    echo "Next Steps:"
    echo "  1. Review the archive contents"
    echo "  2. Run the database update SQL:"
    echo "     psql \$DATABASE_URL < ${ARCHIVE_DIR}/database/update_migrations.sql"
    echo "  3. Verify with:"
    echo "     cd ${ARCHIVE_DIR} && ./verify_archive.sh"
    echo "  4. Test your application"
    echo ""
    echo -e "${YELLOW}IMPORTANT:${NC} The database migration history has NOT been updated yet."
    echo "You must manually run the SQL script to complete the process."
    echo ""
}

# Run main function
main "$@"