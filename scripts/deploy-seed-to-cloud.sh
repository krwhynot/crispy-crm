#!/bin/bash
# =============================================================================
# DEPLOY SEED DATA TO PRODUCTION
# =============================================================================
# This script deploys seed.sql to production cloud database safely
# =============================================================================

set -e

echo "🚀 Production Seed Data Deployment"
echo "=================================="
echo ""

# Check if seed file exists
if [ ! -f "supabase/seed.sql" ]; then
    echo "❌ Error: supabase/seed.sql not found"
    exit 1
fi

echo "📊 Seed file stats:"
echo "  Lines: $(wc -l < supabase/seed.sql)"
echo "  Size: $(du -h supabase/seed.sql | cut -f1)"
echo ""

# Prompt for database URL
echo "📋 Please provide your database connection string:"
echo ""
echo "Get it from:"
echo "  https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/settings/database"
echo ""
echo "Copy the 'Connection string' (Session pooling or Transaction pooling)"
echo ""
read -p "Paste connection string here: " DB_URL

if [ -z "$DB_URL" ]; then
    echo "❌ No connection string provided"
    exit 1
fi

echo ""
echo "⚠️  FINAL CONFIRMATION"
echo "This will deploy 3,850+ records to PRODUCTION"
echo ""
read -p "Type 'DEPLOY' to continue: " confirmation

if [ "$confirmation" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Deploying seed data..."
echo ""

# Run seed via psql
psql "$DB_URL" -f supabase/seed.sql

RESULT=$?

echo ""
if [ $RESULT -eq 0 ]; then
    echo "✅ Seed data deployed successfully!"
    echo ""
    echo "📊 Verifying deployment..."
    psql "$DB_URL" -c "
    SELECT 'segments' as table, COUNT(*) as count FROM segments
    UNION ALL
    SELECT 'organizations', COUNT(*) FROM organizations
    UNION ALL
    SELECT 'contacts', COUNT(*) FROM contacts;
    "
else
    echo "❌ Deployment failed with exit code: $RESULT"
    echo "⚠️  Transaction wrapper should have rolled back any partial changes"
fi

exit $RESULT
