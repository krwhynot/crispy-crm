#!/bin/bash
# Migration script for auth.users data from cloud to local
# This script preserves encrypted passwords

set -e  # Exit on error

# Load credentials
source .env.migration

CLOUD_DB_URL="postgresql://postgres:${CLOUD_DB_PASSWORD}@db.${CLOUD_PROJECT_REF}.supabase.co:5432/postgres"
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

echo "🔐 Exporting auth data from cloud database..."
echo "   Tables: users, identities, sessions, refresh_tokens"

# Export auth schema data (preserves password hashes)
docker run --rm \
  --network host \
  postgres:15-alpine \
  pg_dump "$CLOUD_DB_URL" \
  --data-only \
  --schema=auth \
  --table=auth.users \
  --table=auth.identities \
  --table=auth.sessions \
  --table=auth.refresh_tokens \
  > /tmp/auth_data_export.sql

echo "✅ Auth data exported to /tmp/auth_data_export.sql"
echo ""
echo "📥 Importing auth data to local database..."

# Import to local database
docker run --rm \
  --network host \
  -v /tmp/auth_data_export.sql:/auth_data_export.sql \
  postgres:15-alpine \
  psql "$LOCAL_DB_URL" \
  -f /auth_data_export.sql

echo "✅ Auth data imported successfully"
echo ""
echo "🔍 Verifying auth users..."

# Verify import
docker run --rm \
  --network host \
  postgres:15-alpine \
  psql "$LOCAL_DB_URL" \
  -c "SELECT id, email, created_at FROM auth.users;"

echo ""
echo "✅ Auth migration complete!"
