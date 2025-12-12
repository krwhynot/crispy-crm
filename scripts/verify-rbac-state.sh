#!/bin/bash
# =============================================================================
# RBAC STATE VERIFICATION SCRIPT
# =============================================================================
# Compares RBAC state between LOCAL and CLOUD Supabase databases
# Generates a markdown comparison report in docs/
# =============================================================================

set -e

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output file
TIMESTAMP=$(date +%Y%m%d)
REPORT_FILE="docs/rbac-verification-${TIMESTAMP}.md"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RBAC State Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# =============================================================================
# 1. Load Environment Configuration
# =============================================================================

echo -e "${YELLOW}[1/7]${NC} Loading environment configuration..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    exit 1
fi

# Check if .env.cloud exists
if [ ! -f ".env.cloud" ]; then
    echo -e "${RED}❌ Error: .env.cloud not found${NC}"
    exit 1
fi

# Extract DATABASE_URL from .env.local (using grep to avoid bash interpretation issues)
LOCAL_DB=$(grep -E '^DATABASE_URL=' .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$LOCAL_DB" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not found in .env.local${NC}"
    exit 1
fi

# Extract CLOUD_DB from .env.cloud (using grep to avoid bash interpretation issues)
CLOUD_DB=$(grep -E '^CLOUD_DB=' .env.cloud | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$CLOUD_DB" ]; then
    echo -e "${RED}❌ Error: CLOUD_DB not found in .env.cloud${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration loaded${NC}"
echo "   Local:  ${LOCAL_DB%%@*}@[REDACTED]"
echo "   Cloud:  ${CLOUD_DB%%@*}@[REDACTED]"
echo ""

# =============================================================================
# 2. Check Local Supabase is Running
# =============================================================================

echo -e "${YELLOW}[2/7]${NC} Checking local Supabase status..."

# Check if port 54322 is listening
if command -v nc &> /dev/null; then
    if ! nc -z 127.0.0.1 54322 2>/dev/null; then
        echo -e "${RED}❌ Local Supabase not running. Run: npm run supabase:local:start${NC}"
        exit 1
    fi
elif command -v lsof &> /dev/null; then
    if ! lsof -i:54322 &> /dev/null; then
        echo -e "${RED}❌ Local Supabase not running. Run: npm run supabase:local:start${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Cannot verify if Supabase is running (nc/lsof not found)${NC}"
    echo -e "${YELLOW}   Attempting to connect anyway...${NC}"
fi

echo -e "${GREEN}✅ Local Supabase is running${NC}"
echo ""

# =============================================================================
# 3. Initialize Report File
# =============================================================================

echo -e "${YELLOW}[3/7]${NC} Initializing report file..."

cat > "$REPORT_FILE" <<'EOF'
# RBAC State Verification Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S %Z')

## Overview

This report compares RBAC state between LOCAL and CLOUD Supabase databases.

**Environments:**
- **LOCAL:** `127.0.0.1:54322/postgres` (Docker)
- **CLOUD:** `aaqnanddcqvfiwhshndl.supabase.co` (Supabase Cloud)

---

EOF

echo -e "${GREEN}✅ Report initialized: ${REPORT_FILE}${NC}"
echo ""

# =============================================================================
# Helper Functions
# =============================================================================

# Execute query on LOCAL database
query_local() {
    psql "$LOCAL_DB" -t -A -c "$1" 2>&1
}

# Execute query on CLOUD database
query_cloud() {
    psql "$CLOUD_DB" -t -A -c "$1" 2>&1
}

# Compare two outputs and mark with ✅ or ❌
compare_outputs() {
    local local_output="$1"
    local cloud_output="$2"

    if [ "$local_output" = "$cloud_output" ]; then
        echo "✅"
    else
        echo "❌"
    fi
}

# =============================================================================
# 4. Query 1 - Migration History (20251211+)
# =============================================================================

echo -e "${YELLOW}[4/7]${NC} Querying migration history (20251211+)..."

MIGRATION_QUERY="SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version >= '20251211000000'
ORDER BY version;"

LOCAL_MIGRATIONS=$(query_local "$MIGRATION_QUERY")
CLOUD_MIGRATIONS=$(query_cloud "$MIGRATION_QUERY")

MIGRATION_STATUS=$(compare_outputs "$LOCAL_MIGRATIONS" "$CLOUD_MIGRATIONS")

cat >> "$REPORT_FILE" <<EOF
## 1. Migration History (20251211+)

**Status:** $MIGRATION_STATUS

### LOCAL

\`\`\`
$LOCAL_MIGRATIONS
\`\`\`

### CLOUD

\`\`\`
$CLOUD_MIGRATIONS
\`\`\`

---

EOF

echo -e "${GREEN}✅ Migration history queried${NC}"
echo ""

# =============================================================================
# 5. Query 2 - Sales Table Schema
# =============================================================================

echo -e "${YELLOW}[5/7]${NC} Querying sales table schema..."

SALES_SCHEMA_QUERY="SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sales'
ORDER BY ordinal_position;"

LOCAL_SALES_SCHEMA=$(query_local "$SALES_SCHEMA_QUERY")
CLOUD_SALES_SCHEMA=$(query_cloud "$SALES_SCHEMA_QUERY")

SALES_SCHEMA_STATUS=$(compare_outputs "$LOCAL_SALES_SCHEMA" "$CLOUD_SALES_SCHEMA")

cat >> "$REPORT_FILE" <<EOF
## 2. Sales Table Schema

**Status:** $SALES_SCHEMA_STATUS

### LOCAL

\`\`\`
$LOCAL_SALES_SCHEMA
\`\`\`

### CLOUD

\`\`\`
$CLOUD_SALES_SCHEMA
\`\`\`

---

EOF

echo -e "${GREEN}✅ Sales table schema queried${NC}"
echo ""

# =============================================================================
# 6. Query 3 - RLS Policies on sales
# =============================================================================

echo -e "${YELLOW}[6/7]${NC} Querying RLS policies on sales table..."

RLS_POLICIES_QUERY="SELECT policyname, permissive, roles, cmd, qual::text, with_check::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'sales'
ORDER BY policyname;"

LOCAL_RLS=$(query_local "$RLS_POLICIES_QUERY")
CLOUD_RLS=$(query_cloud "$RLS_POLICIES_QUERY")

RLS_STATUS=$(compare_outputs "$LOCAL_RLS" "$CLOUD_RLS")

cat >> "$REPORT_FILE" <<EOF
## 3. RLS Policies on sales Table

**Status:** $RLS_STATUS

### LOCAL

\`\`\`
$LOCAL_RLS
\`\`\`

### CLOUD

\`\`\`
$CLOUD_RLS
\`\`\`

---

EOF

echo -e "${GREEN}✅ RLS policies queried${NC}"
echo ""

# =============================================================================
# 7. Query 4 - is_admin() Function
# =============================================================================

echo -e "${YELLOW}[7/7]${NC} Querying is_admin() function definition..."

IS_ADMIN_QUERY="SELECT pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');"

LOCAL_IS_ADMIN=$(query_local "$IS_ADMIN_QUERY")
CLOUD_IS_ADMIN=$(query_cloud "$IS_ADMIN_QUERY")

IS_ADMIN_STATUS=$(compare_outputs "$LOCAL_IS_ADMIN" "$CLOUD_IS_ADMIN")

cat >> "$REPORT_FILE" <<EOF
## 4. is_admin() Function Definition

**Status:** $IS_ADMIN_STATUS

### LOCAL

\`\`\`sql
$LOCAL_IS_ADMIN
\`\`\`

### CLOUD

\`\`\`sql
$CLOUD_IS_ADMIN
\`\`\`

---

EOF

echo -e "${GREEN}✅ is_admin() function queried${NC}"
echo ""

# =============================================================================
# 8. Generate Summary
# =============================================================================

echo -e "${YELLOW}Generating summary...${NC}"

# Count mismatches
ISSUES=0
[[ "$MIGRATION_STATUS" == "❌" ]] && ((ISSUES++))
[[ "$SALES_SCHEMA_STATUS" == "❌" ]] && ((ISSUES++))
[[ "$RLS_STATUS" == "❌" ]] && ((ISSUES++))
[[ "$IS_ADMIN_STATUS" == "❌" ]] && ((ISSUES++))

cat >> "$REPORT_FILE" <<EOF
## Summary

**Total Checks:** 4

**Issues Found:** $ISSUES

| Check | Status |
|-------|--------|
| Migration History (20251211+) | $MIGRATION_STATUS |
| Sales Table Schema | $SALES_SCHEMA_STATUS |
| RLS Policies on sales | $RLS_STATUS |
| is_admin() Function | $IS_ADMIN_STATUS |

EOF

if [ $ISSUES -eq 0 ]; then
    cat >> "$REPORT_FILE" <<EOF
### ✅ All Checks Passed

LOCAL and CLOUD databases are in sync for all RBAC components.

EOF
else
    cat >> "$REPORT_FILE" <<EOF
### ❌ Issues Detected

The following components have mismatches between LOCAL and CLOUD:

EOF

    [[ "$MIGRATION_STATUS" == "❌" ]] && echo "- **Migration History:** LOCAL and CLOUD have different migrations applied" >> "$REPORT_FILE"
    [[ "$SALES_SCHEMA_STATUS" == "❌" ]] && echo "- **Sales Table Schema:** Column definitions differ between environments" >> "$REPORT_FILE"
    [[ "$RLS_STATUS" == "❌" ]] && echo "- **RLS Policies:** Policy definitions are inconsistent" >> "$REPORT_FILE"
    [[ "$IS_ADMIN_STATUS" == "❌" ]] && echo "- **is_admin() Function:** Function definition differs between environments" >> "$REPORT_FILE"

    cat >> "$REPORT_FILE" <<EOF

**Recommended Actions:**

1. Review differences in the sections above
2. Determine which environment has the correct state
3. Apply missing migrations or manual fixes to sync environments
4. Re-run this script to verify synchronization

EOF
fi

cat >> "$REPORT_FILE" <<EOF
---

**Report generated by:** \`scripts/verify-rbac-state.sh\`
EOF

# =============================================================================
# 9. Final Output
# =============================================================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed${NC}"
    echo -e "${GREEN}   LOCAL and CLOUD databases are in sync${NC}"
else
    echo -e "${RED}❌ Found $ISSUES issue(s)${NC}"
    echo -e "${RED}   Review the report for details${NC}"
fi

echo ""
echo -e "${BLUE}📄 Report saved to:${NC}"
echo -e "${BLUE}   ${REPORT_FILE}${NC}"
echo ""

# Exit with error code if issues found
exit $ISSUES
