#!/bin/bash
# Database Backup Script for CRM Migration
# Creates timestamped backups of local or cloud Supabase databases
# Usage: ./backup.sh [cloud|local]

set -e

# Configuration
TARGET="${1:-cloud}"  # Default to cloud if no argument provided
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/migrations"

# Check for pg_dump utility
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump utility not found"
    echo "   Please install PostgreSQL client tools:"
    echo "   - Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   - macOS: brew install postgresql"
    echo "   - RHEL/CentOS: sudo yum install postgresql"
    exit 1
fi

# Source production environment if it exists
if [[ "$TARGET" == "cloud" ]] && [[ -f ".env.production" ]]; then
    # Export environment variables from .env.production
    export $(grep -E '^DATABASE_URL_PRODUCTION=' .env.production | xargs)
elif [[ "$TARGET" == "cloud" ]] && [[ -f ".env.migration" ]]; then
    # Fallback to .env.migration if .env.production doesn't exist
    export $(grep -E '^CLOUD_DB_URL=' .env.migration | xargs)
    DATABASE_URL_PRODUCTION="${CLOUD_DB_URL}"
fi

# Set database URL based on target
if [[ "$TARGET" == "cloud" ]]; then
    DB_URL="${DATABASE_URL_PRODUCTION}"
    LABEL="cloud"

    if [[ -z "$DB_URL" ]]; then
        echo "❌ Error: DATABASE_URL_PRODUCTION not found"
        echo "   Please ensure .env.production exists with DATABASE_URL_PRODUCTION set"
        exit 1
    fi
else
    DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
    LABEL="local"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Display backup information
echo "📦 Creating backup: $LABEL database"
echo "   Timestamp: $TIMESTAMP"
echo "   Target: ${DB_URL%%@*}@***" # Hide password in output

# Create the backup
BACKUP_FILE="$BACKUP_DIR/${LABEL}_backup_${TIMESTAMP}.sql"

pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$BACKUP_FILE"

# Check if backup was successful
if [[ $? -eq 0 ]] && [[ -f "$BACKUP_FILE" ]]; then
    # Get file size
    FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    # Display success message
    echo "✅ Backup complete: ${LABEL}_backup_${TIMESTAMP}.sql (${FILESIZE})"
    echo "   Location: $BACKUP_DIR/"
else
    echo "❌ Error: Backup failed"
    exit 1
fi