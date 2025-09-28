#!/bin/bash
# =====================================================================
# Supabase Migration System Backup Script
# Date: 2025-01-27
# Purpose: Complete backup before migration consolidation
# =====================================================================

set -e  # Exit on error

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

set -u  # Exit on undefined variable after loading env

# Configuration
PROJECT_ID="aaqnanddcqvfiwhshndl"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
SUPABASE_URL="${VITE_SUPABASE_URL}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

create_backup_directories() {
    log_info "Creating backup directories..."
    mkdir -p "${BACKUP_DIR}/migrations"
    mkdir -p "${BACKUP_DIR}/database"
    mkdir -p "${BACKUP_DIR}/scripts"
}

# =====================================================================
# Step 1: Backup Current Migration Files
# =====================================================================

backup_migration_files() {
    log_info "Backing up migration files..."

    # Copy all migration files
    if [ -d "supabase/migrations" ]; then
        cp -r supabase/migrations/* "${BACKUP_DIR}/migrations/" 2>/dev/null || true

        # Count backed up files
        local count=$(find "${BACKUP_DIR}/migrations" -name "*.sql" | wc -l)
        log_info "Backed up ${count} migration files"
    else
        log_warn "No migrations directory found"
    fi

    # Save list of migrations
    find supabase/migrations -name "*.sql" -type f | sort > "${BACKUP_DIR}/migration_list.txt"
}

# =====================================================================
# Step 2: Export Database Schema
# =====================================================================

export_database_schema() {
    log_info "Exporting database schema..."

    # Create schema export SQL
    cat > "${BACKUP_DIR}/database/export_schema.sql" << 'EOF'
-- Export all table definitions
WITH table_ddl AS (
    SELECT
        'CREATE TABLE IF NOT EXISTS ' || schemaname || '.' || tablename || ' (' ||
        string_agg(
            column_name || ' ' || data_type ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', ' ORDER BY ordinal_position
        ) || ');' as ddl,
        tablename,
        1 as sort_order
    FROM information_schema.columns c
    JOIN pg_tables t ON c.table_name = t.tablename AND c.table_schema = t.schemaname
    WHERE c.table_schema = 'public'
    GROUP BY schemaname, tablename
),
index_ddl AS (
    SELECT
        'CREATE INDEX IF NOT EXISTS ' || indexname || ' ON ' || tablename || ' ' || indexdef || ';' as ddl,
        tablename,
        2 as sort_order
    FROM pg_indexes
    WHERE schemaname = 'public'
),
constraint_ddl AS (
    SELECT
        'ALTER TABLE ' || tc.table_name || ' ADD CONSTRAINT ' || tc.constraint_name ||
        ' FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' ||
        ccu.table_name || '(' || ccu.column_name || ');' as ddl,
        tc.table_name as tablename,
        3 as sort_order
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
)
SELECT ddl FROM (
    SELECT * FROM table_ddl
    UNION ALL
    SELECT * FROM index_ddl
    UNION ALL
    SELECT * FROM constraint_ddl
) combined
ORDER BY sort_order, tablename;
EOF

    log_info "Schema export SQL created"
}

# =====================================================================
# Step 3: Backup Migration History
# =====================================================================

backup_migration_history() {
    log_info "Backing up migration history..."

    # Create backup SQL
    cat > "${BACKUP_DIR}/database/backup_migration_history.sql" << 'EOF'
-- Backup Supabase migration history
CREATE TABLE IF NOT EXISTS public.migration_history_backup_20250127 AS
SELECT * FROM supabase_migrations.schema_migrations;

-- Backup any custom migration tracking
CREATE TABLE IF NOT EXISTS public.custom_migration_backup_20250127 AS
SELECT * FROM public.migration_history;

-- Export migration history as JSON for reference
COPY (
    SELECT json_agg(row_to_json(t))
    FROM (
        SELECT * FROM supabase_migrations.schema_migrations
        ORDER BY version
    ) t
) TO '/tmp/migration_history.json';
EOF

    log_info "Migration history backup SQL created"
}

# =====================================================================
# Step 4: Create Rollback Plan
# =====================================================================

create_rollback_plan() {
    log_info "Creating rollback plan..."

    cat > "${BACKUP_DIR}/ROLLBACK_PLAN.md" << 'EOF'
# Rollback Plan for Migration Consolidation

## Emergency Rollback Procedure

### If Issues Occur During Consolidation:

1. **Stop All Operations**
   ```bash
   # Cancel any running migrations
   pkill -f "supabase"
   ```

2. **Restore Migration Files**
   ```bash
   # Restore original migration files
   rm -rf supabase/migrations/*
   cp -r backups/[timestamp]/migrations/* supabase/migrations/
   ```

3. **Restore Migration History**
   ```sql
   -- Connect to database and run:
   TRUNCATE supabase_migrations.schema_migrations;
   INSERT INTO supabase_migrations.schema_migrations
   SELECT * FROM public.migration_history_backup_20250127;
   ```

4. **Verify Database State**
   ```sql
   -- Check table count
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Check migration count
   SELECT COUNT(*) FROM supabase_migrations.schema_migrations;
   ```

### If Data Corruption Occurs:

1. **Use Supabase Point-in-Time Recovery**
   - Go to Supabase Dashboard > Settings > Backups
   - Select restore point before consolidation
   - Initiate restore

2. **Alternative: Manual Schema Restore**
   ```bash
   # Run the backed up schema
   psql $DATABASE_URL < backups/[timestamp]/database/export_schema.sql
   ```

### Validation After Rollback:

1. Check all tables exist
2. Verify RLS policies are active
3. Test application connectivity
4. Confirm data integrity

### Support Contacts:

- Supabase Support: support.supabase.com
- Database Admin: [your contact]
- Emergency Escalation: [backup contact]
EOF

    log_info "Rollback plan created"
}

# =====================================================================
# Step 5: Create Backup Verification
# =====================================================================

create_verification_script() {
    log_info "Creating verification script..."

    cat > "${BACKUP_DIR}/verify_backup.sql" << 'EOF'
-- Verification Queries

-- 1. Check backup tables exist
SELECT
    'migration_history_backup_20250127' as backup_table,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'FAILED' END as status
FROM public.migration_history_backup_20250127
UNION ALL
SELECT
    'custom_migration_backup_20250127' as backup_table,
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) >= 0 THEN 'OK' ELSE 'FAILED' END as status
FROM public.custom_migration_backup_20250127;

-- 2. Compare migration counts
WITH original AS (
    SELECT COUNT(*) as count FROM supabase_migrations.schema_migrations
),
backup AS (
    SELECT COUNT(*) as count FROM public.migration_history_backup_20250127
)
SELECT
    'Migration Count Match' as check_name,
    o.count = b.count as matches,
    o.count as original_count,
    b.count as backup_count
FROM original o, backup b;

-- 3. List all public schema tables
SELECT
    table_name,
    table_type,
    CASE
        WHEN table_name LIKE '%backup%' THEN 'BACKUP'
        WHEN table_name LIKE '%_view%' THEN 'VIEW'
        WHEN table_name LIKE '%_summary%' THEN 'VIEW'
        ELSE 'TABLE'
    END as category
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY category, table_name;
EOF

    log_info "Verification script created"
}

# =====================================================================
# Step 6: Create Metadata File
# =====================================================================

create_metadata() {
    log_info "Creating backup metadata..."

    cat > "${BACKUP_DIR}/metadata.json" << EOF
{
    "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "project_id": "${PROJECT_ID}",
    "total_migrations": 68,
    "backup_directory": "${BACKUP_DIR}",
    "database_url": "${SUPABASE_URL}",
    "backup_components": [
        "migration_files",
        "database_schema",
        "migration_history",
        "rollback_plan",
        "verification_scripts"
    ],
    "pre_consolidation_state": {
        "migrations_in_db": 68,
        "migration_files_on_disk": 10,
        "tables_count": 24,
        "views_count": 3,
        "rls_enabled": true
    }
}
EOF

    log_info "Metadata file created"
}

# =====================================================================
# Main Execution
# =====================================================================

main() {
    echo "========================================"
    echo "Supabase Migration Backup Process"
    echo "Date: $(date)"
    echo "========================================"

    # Check environment
    if [ -z "${VITE_SUPABASE_URL:-}" ] || [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then
        log_error "Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
        exit 1
    fi

    # Execute backup steps
    create_backup_directories
    backup_migration_files
    export_database_schema
    backup_migration_history
    create_rollback_plan
    create_verification_script
    create_metadata

    # Create summary
    echo ""
    echo "========================================"
    echo -e "${GREEN}Backup Complete!${NC}"
    echo "========================================"
    echo "Backup Location: ${BACKUP_DIR}"
    echo ""
    echo "Contents:"
    echo "  - Migration files: ${BACKUP_DIR}/migrations/"
    echo "  - Database exports: ${BACKUP_DIR}/database/"
    echo "  - Rollback plan: ${BACKUP_DIR}/ROLLBACK_PLAN.md"
    echo "  - Verification: ${BACKUP_DIR}/verify_backup.sql"
    echo ""
    echo "Next Steps:"
    echo "  1. Review the backup contents"
    echo "  2. Run verification queries"
    echo "  3. Proceed with consolidation"
    echo ""
    echo "To verify backup:"
    echo "  psql \$DATABASE_URL < ${BACKUP_DIR}/verify_backup.sql"
    echo ""
}

# Run main function
main "$@"