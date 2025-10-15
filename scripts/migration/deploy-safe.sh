#!/bin/bash
# Safe Migration Deployment Script with Automatic Rollback
# Usage: ./deploy-safe.sh [cloud|local]
#
# This script orchestrates safe migration deployment with:
# - Automatic backups before deployment
# - Pre-migration validation
# - Dry-run preview (cloud only)
# - Automatic rollback on failure
# - Post-migration validation

set -e

# Configuration
TARGET="${1:-cloud}"  # Default to cloud if no argument provided
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Helper functions
print_header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

print_phase() {
    echo -e "\n${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Source environment files and set DATABASE_URL
if [[ "$TARGET" == "cloud" ]]; then
    # Source production environment
    if [[ -f "$PROJECT_ROOT/.env.production" ]]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env.production" | xargs)
        export DATABASE_URL="${DATABASE_URL_PRODUCTION}"
        LABEL="PRODUCTION"
    else
        print_error "Missing .env.production file"
        echo "Please create .env.production with DATABASE_URL_PRODUCTION"
        exit 1
    fi
else
    export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
    LABEL="LOCAL"
fi

# Display deployment header
print_header "🚀 SAFE MIGRATION DEPLOYMENT - $LABEL"
echo "Target Environment: $LABEL"
echo "Database URL: ${DATABASE_URL%%@*}@***"  # Mask password in output
echo "Timestamp: $TIMESTAMP"

# =============================================================================
# PHASE 1: CREATE BACKUP
# =============================================================================
print_phase "1️⃣  Phase 1: Creating backup..."

# Call backup script and capture the output
BACKUP_OUTPUT=$("$SCRIPT_DIR/backup.sh" "$TARGET" 2>&1)
echo "$BACKUP_OUTPUT"

# Extract backup filename from output
BACKUP_FILE="$PROJECT_ROOT/backups/migrations/${TARGET}_backup_${TIMESTAMP}.sql"

if [[ ! -f "$BACKUP_FILE" ]]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_success "Backup created successfully"

# =============================================================================
# PHASE 2: RUN PRE-MIGRATION VALIDATION
# =============================================================================
print_phase "2️⃣  Phase 2: Running pre-migration validation..."

# Change to project root for node scripts
cd "$PROJECT_ROOT"

if node scripts/validation/run-pre-validation.js; then
    print_success "Pre-migration validation passed"
else
    print_error "Pre-migration validation failed!"
    echo "Please fix validation errors before proceeding"
    exit 1
fi

# =============================================================================
# PHASE 3: DRY-RUN (CLOUD ONLY)
# =============================================================================
if [[ "$TARGET" == "cloud" ]]; then
    print_phase "3️⃣  Phase 3: Performing dry-run..."

    echo "Running migration dry-run to preview changes..."
    echo ""

    # Run dry-run and capture output
    if npx supabase db push --dry-run; then
        print_success "Dry-run completed successfully"
    else
        print_error "Dry-run failed!"
        exit 1
    fi

    # Prompt for confirmation
    echo ""
    read -p "Proceed with migration? (y/n): " -n 1 -r CONFIRM
    echo ""

    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_warning "Migration cancelled by user"
        exit 0
    fi
else
    echo "Skipping dry-run for local deployment"
fi

# =============================================================================
# PHASE 4: APPLY MIGRATION
# =============================================================================
print_phase "4️⃣  Phase 4: Applying migration..."

echo "Executing migration..."

# Apply migration with automatic rollback on failure
if npx supabase db push; then
    print_success "Migration applied successfully!"
else
    print_error "Migration failed! Rolling back..."

    # Perform rollback
    echo "Restoring database from backup..."

    if psql "$DATABASE_URL" < "$BACKUP_FILE"; then
        print_success "Rollback complete. Database restored."
    else
        print_error "CRITICAL: Rollback failed!"
        echo "Manual intervention required. Backup file: $BACKUP_FILE"
    fi

    exit 1
fi

# =============================================================================
# PHASE 5: POST-MIGRATION VALIDATION
# =============================================================================
print_phase "5️⃣  Phase 5: Running post-migration validation..."

# Run post-migration validation
if node scripts/post-migration-validation.js; then
    print_success "Post-migration validation passed"
else
    print_warning "Post-migration validation failed"
    echo ""
    echo "Consider rolling back the migration:"
    echo "  psql \$DATABASE_URL < $BACKUP_FILE"
    echo ""
    echo "Or manually restore using:"
    echo "  psql \"$DATABASE_URL\" < $BACKUP_FILE"
    exit 1
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
print_header "✨ DEPLOYMENT COMPLETE"

echo -e "${GREEN}All phases completed successfully!${NC}"
echo ""
echo "Summary:"
echo "  • Backup created: ${BACKUP_FILE##*/}"
echo "  • Pre-validation: ✅ Passed"
echo "  • Migration: ✅ Applied"
echo "  • Post-validation: ✅ Passed"
echo ""
echo "Backup retained at: $BACKUP_FILE"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. Test critical application features"
echo "  2. Monitor application logs for errors"
echo "  3. Keep backup for at least 48 hours"
echo ""

exit 0