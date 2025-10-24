#!/bin/bash
# Complete local database seeding script
# Seeds organizations and contacts from cleaned CSV files
# Run this after: npm run db:local:reset
#
# Engineering Constitution Compliance:
# - Single source of truth: Cleaned CSV files
# - Fail fast: Exit on any error
# - Boy Scout Rule: Clean seed data pattern

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🌱 Seeding Local Database with Complete Data"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Seed organizations
echo "📦 Step 1/2: Seeding organizations..."
if [ -f "$SCRIPT_DIR/seed-organizations-from-standardized.sh" ]; then
  bash "$SCRIPT_DIR/seed-organizations-from-standardized.sh"
else
  echo "⚠️  Warning: Organization seed script not found"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""

# Step 2: Seed contacts
echo "👥 Step 2/2: Seeding contacts..."
if [ -f "$SCRIPT_DIR/seed-contacts-from-cleaned.sh" ]; then
  bash "$SCRIPT_DIR/seed-contacts-from-cleaned.sh"
else
  echo "⚠️  Warning: Contact seed script not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✨ Complete Database Seeding Finished!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   • Organizations: Seeded from organizations_standardized.csv"
echo "   • Contacts: Seeded from contacts_db_ready.csv"
echo ""
echo "🚀 Next Steps:"
echo "   1. npm run dev              Start development server"
echo "   2. Login: admin@test.com / password123"
echo "   3. Navigate to Organizations or Contacts"
echo ""
