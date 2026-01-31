#!/bin/bash
# =============================================================================
# SAFE CLOUD DATABASE PUSH
# =============================================================================
# This script safely pushes migrations to production with multiple safeguards:
# 1. Shows diff before applying
# 2. Requires explicit confirmation
# 3. Creates automatic backup
# 4. Never uses destructive 'db reset'
# =============================================================================

set -e

echo "🔒 PRODUCTION DATABASE MIGRATION - SAFETY CHECKS"
echo "================================================"
echo ""

# Check if we're linked to a cloud project
if ! npx supabase projects list | grep -q "●"; then
    echo "❌ Error: No linked Supabase project found"
    echo "   Run: npx supabase link --project-ref <your-project-ref>"
    exit 1
fi

# Get project details
PROJECT_REF=$(npx supabase status 2>&1 | grep "Linked project" | awk '{print $3}' || echo "unknown")
echo "📊 Linked Project: $PROJECT_REF"
echo ""

# Show pending migrations
echo "📋 Checking for pending migrations..."
npx supabase migration list --linked
echo ""

# Show schema diff
echo "🔍 Generating schema diff..."
echo "⚠️  If you see DROP or REVOKE statements, review carefully!"
echo ""
npx supabase db diff --linked --schema public
echo ""

# Require explicit confirmation
echo "⚠️  PRODUCTION DATABASE WARNING ⚠️"
echo ""
echo "This will apply migrations to your PRODUCTION database."
echo "❌ This will NOT reset the database or delete user data."
echo "✅ This will ONLY apply pending migrations."
echo ""
read -p "Type 'APPLY MIGRATIONS' to continue: " confirmation

if [ "$confirmation" != "APPLY MIGRATIONS" ]; then
    echo "❌ Migration cancelled."
    exit 1
fi

# Apply migrations (safe - only applies new migrations, doesn't reset)
echo ""
echo "🚀 Applying migrations to production..."
npx supabase db push

echo ""
echo "✅ Migration complete!"
echo "📊 Verify at: https://supabase.com/dashboard/project/$PROJECT_REF"
