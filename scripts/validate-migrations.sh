#!/bin/bash
# =============================================================================
# MIGRATION VALIDATION SCRIPT
# =============================================================================
# Validates Supabase migration files for common issues before commit.
# Based on plan analysis (176 schema commits), this prevents common migration
# issues such as:
#   - Missing required columns in summary views
#   - Non-idempotent policy creation
#   - Hard DELETE statements (should use soft delete)
#   - Tables without foreign key indexes
#
# Usage:
#   ./scripts/validate-migrations.sh           # Check all migrations
#   ./scripts/validate-migrations.sh --staged  # Check only staged files
#   ./scripts/validate-migrations.sh file.sql  # Check specific file
# =============================================================================

set -e

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MIGRATIONS_DIR="supabase/migrations"
ERRORS=0
WARNINGS=0

# =============================================================================
# Helper Functions
# =============================================================================

log_error() {
    local file="$1"
    local line="$2"
    local message="$3"
    echo -e "${RED}ERROR${NC} [$(basename "$file"):${line}]: ${message}"
    ((ERRORS++)) || true
}

log_warning() {
    local file="$1"
    local line="$2"
    local message="$3"
    echo -e "${YELLOW}WARN${NC} [$(basename "$file"):${line}]: ${message}"
    ((WARNINGS++)) || true
}

log_info() {
    local message="$1"
    echo -e "${BLUE}INFO${NC}: ${message}"
}

log_success() {
    local message="$1"
    echo -e "${GREEN}OK${NC}: ${message}"
}

# =============================================================================
# Check 1: Summary View Required Columns
# =============================================================================
# All views ending in _summary must include: id, created_at, updated_at, deleted_at
# If user-owned data: must include sales_id

check_summary_view_columns() {
    local file="$1"

    # Use grep to find _summary view definitions with line numbers
    local view_matches
    view_matches=$(grep -niE 'CREATE[[:space:]]+(OR[[:space:]]+REPLACE[[:space:]]+)?VIEW[[:space:]]+[a-z_]*_summary' "$file" 2>/dev/null || true)

    if [ -z "$view_matches" ]; then
        return 0
    fi

    # Process each view definition found
    while IFS=: read -r line_num line_content; do
        [ -z "$line_num" ] && continue

        # Extract view name
        local view_name
        view_name=$(echo "$line_content" | grep -oiE '[a-z_]+_summary' | head -1)
        [ -z "$view_name" ] && continue

        # Extract the view definition (from CREATE VIEW to the next semicolon)
        local view_content
        view_content=$(sed -n "${line_num},/;/p" "$file" | tr '[:upper:]' '[:lower:]')

        # Required columns for all summary views
        local required_columns=("id" "created_at" "updated_at" "deleted_at")

        for col in "${required_columns[@]}"; do
            # Check if column is selected (handles p.id, c.created_at, o.*, etc.)
            if ! echo "$view_content" | grep -qE "([a-z]+\.\*|[^a-z_]${col}[^a-z_]|^${col}[^a-z_]|[a-z]+\.${col})"; then
                log_error "$file" "$line_num" "View '${view_name}' missing required column: ${col}"
            fi
        done

        # Check for sales_id if this appears to be user-owned data
        if echo "$view_name" | grep -qiE 'contacts|opportunities|tasks'; then
            if ! echo "$view_content" | grep -qE "([a-z]+\.\*|[^a-z_]sales_id[^a-z_]|^sales_id[^a-z_]|[a-z]+\.sales_id)"; then
                log_warning "$file" "$line_num" "View '${view_name}' may need sales_id column for user-owned data"
            fi
        fi
    done <<< "$view_matches"
}

# =============================================================================
# Check 2: Idempotent Policy Creation
# =============================================================================
# Check for DROP POLICY IF EXISTS before CREATE POLICY
# Flag any CREATE POLICY without preceding DROP or IF NOT EXISTS block

check_idempotent_policies() {
    local file="$1"

    # Find all CREATE POLICY statements with line numbers
    local create_policies
    create_policies=$(grep -niE '^[[:space:]]*CREATE[[:space:]]+POLICY' "$file" 2>/dev/null || true)

    if [ -z "$create_policies" ]; then
        return 0
    fi

    # Read the whole file once for context checking
    local file_content
    file_content=$(cat "$file")

    while IFS=: read -r line_num line_content; do
        [ -z "$line_num" ] && continue

        # Extract policy name (handle both quoted and unquoted)
        local policy_name
        policy_name=$(echo "$line_content" | sed -E 's/.*CREATE[[:space:]]+POLICY[[:space:]]+"?([^"[:space:]]+)"?.*/\1/i')

        # Check if there's a DROP POLICY IF EXISTS for this policy in the file
        local has_drop=false
        if echo "$file_content" | grep -qiE "DROP[[:space:]]+POLICY[[:space:]]+IF[[:space:]]+EXISTS[[:space:]]+\"?${policy_name}\"?"; then
            has_drop=true
        fi

        # Check if this CREATE POLICY is inside a DO $$ block with IF NOT EXISTS
        local in_do_block=false
        local check_start=$((line_num > 15 ? line_num - 15 : 1))
        local context_before
        context_before=$(sed -n "${check_start},${line_num}p" "$file")

        if echo "$context_before" | grep -qiE 'DO[[:space:]]+\$\$'; then
            if echo "$context_before" | grep -qiE 'IF[[:space:]]+NOT[[:space:]]+EXISTS'; then
                in_do_block=true
            fi
        fi

        if [ "$has_drop" = false ] && [ "$in_do_block" = false ]; then
            log_warning "$file" "$line_num" "CREATE POLICY without DROP POLICY IF EXISTS (policy: ${policy_name})"
        fi
    done <<< "$create_policies"
}

# =============================================================================
# Check 3: Soft Delete Enforcement
# =============================================================================
# Flag any DELETE FROM statements (should use UPDATE ... SET deleted_at)
# Exception: Allow DELETE in seed files or explicit cleanup scripts

check_soft_delete() {
    local file="$1"
    local filename
    filename=$(basename "$file")

    # Skip seed files and cleanup scripts
    if echo "$filename" | grep -qiE 'seed|cleanup|test|diagnostic|verify'; then
        return 0
    fi

    # Find DELETE FROM statements (excluding comments)
    local delete_matches
    delete_matches=$(grep -niE 'DELETE[[:space:]]+FROM' "$file" 2>/dev/null || true)

    if [ -z "$delete_matches" ]; then
        return 0
    fi

    while IFS=: read -r line_num line_content; do
        [ -z "$line_num" ] && continue

        # Skip if the line is a comment
        if echo "$line_content" | grep -qE '^[[:space:]]*--'; then
            continue
        fi

        # Skip if DELETE comes after a comment marker on the same line
        local before_delete
        before_delete=$(echo "$line_content" | sed -E 's/DELETE[[:space:]]+FROM.*//')
        if echo "$before_delete" | grep -q '--'; then
            continue
        fi

        log_error "$file" "$line_num" "Hard DELETE found. Use UPDATE ... SET deleted_at = NOW() for soft delete"
    done <<< "$delete_matches"
}

# =============================================================================
# Check 4: Foreign Key Index Validation
# =============================================================================
# Warn if creating a table without indexes on foreign keys

check_fk_indexes() {
    local file="$1"

    # Find CREATE TABLE statements
    local table_matches
    table_matches=$(grep -niE 'CREATE[[:space:]]+TABLE' "$file" 2>/dev/null || true)

    if [ -z "$table_matches" ]; then
        return 0
    fi

    local file_content
    file_content=$(cat "$file")

    while IFS=: read -r line_num line_content; do
        [ -z "$line_num" ] && continue

        # Extract table name
        local table_name
        table_name=$(echo "$line_content" | grep -oiE 'CREATE[[:space:]]+TABLE[[:space:]]+(IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+)?[a-z_]+' | awk '{print $NF}')
        [ -z "$table_name" ] && continue

        # Extract table definition block (from CREATE TABLE to closing );)
        local table_def
        table_def=$(sed -n "${line_num},/);/p" "$file")

        # Find REFERENCES columns in the table definition
        local fk_columns
        fk_columns=$(echo "$table_def" | grep -iE 'REFERENCES' | grep -oiE '^[[:space:]]*[a-z_]+' | tr -d '[:space:]' || true)

        if [ -z "$fk_columns" ]; then
            continue
        fi

        # Check each FK column for an index
        while IFS= read -r fk_col; do
            [ -z "$fk_col" ] && continue

            # Check if there's a CREATE INDEX for this column on this table
            if ! echo "$file_content" | grep -qiE "CREATE[[:space:]]+INDEX.*ON[[:space:]]+${table_name}[[:space:]]*\([[:space:]]*${fk_col}|CREATE[[:space:]]+INDEX[[:space:]]+[a-z_]*${fk_col}[a-z_]*[[:space:]]+ON[[:space:]]+${table_name}"; then
                log_warning "$file" "$line_num" "Table '${table_name}' has foreign key '${fk_col}' without index"
            fi
        done <<< "$fk_columns"
    done <<< "$table_matches"
}

# =============================================================================
# Main Execution
# =============================================================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Migration Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse arguments
migration_files=()

if [ "$1" = "--staged" ]; then
    log_info "Checking only staged migration files"
    staged_files=$(git diff --cached --name-only -- "${MIGRATIONS_DIR}/*.sql" 2>/dev/null || true)
    if [ -z "$staged_files" ]; then
        log_success "No staged migration files to check"
        exit 0
    fi
    while IFS= read -r f; do
        [ -f "$f" ] && migration_files+=("$f")
    done <<< "$staged_files"
elif [ -n "$1" ] && [ -f "$1" ]; then
    # Check specific file
    migration_files=("$1")
else
    # Check if migrations directory exists
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        echo -e "${RED}Error: Migrations directory not found: ${MIGRATIONS_DIR}${NC}"
        exit 1
    fi

    # Get list of all migration files
    for f in "$MIGRATIONS_DIR"/*.sql; do
        [ -f "$f" ] && migration_files+=("$f")
    done
fi

if [ ${#migration_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}No migration files found${NC}"
    exit 0
fi

log_info "Found ${#migration_files[@]} migration files"
echo ""

# Process each file
for file in "${migration_files[@]}"; do
    filename=$(basename "$file")
    echo -e "${BLUE}Checking:${NC} $filename"

    # Run all checks
    check_summary_view_columns "$file"
    check_idempotent_policies "$file"
    check_soft_delete "$file"
    check_fk_indexes "$file"
done

# =============================================================================
# Summary
# =============================================================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Files checked: ${#migration_files[@]}"
echo -e "Errors:        ${RED}${ERRORS}${NC}"
echo -e "Warnings:      ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Validation FAILED${NC}"
    echo ""
    echo "Fix the errors above before committing."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Validation passed with warnings${NC}"
    echo ""
    echo "Consider addressing the warnings above."
    exit 0
else
    echo -e "${GREEN}Validation PASSED${NC}"
    exit 0
fi
