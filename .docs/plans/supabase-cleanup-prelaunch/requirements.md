# Supabase Infrastructure Cleanup - Pre-Launch Edition (Simplified)

**Feature ID**: `supabase-cleanup-prelaunch`
**Created**: 2025-10-15
**Simplified**: 2025-10-15 (removed over-engineered monitoring/logging per Engineering Constitution)
**Status**: Requirements Complete - Simplified
**Estimated Effort**: 3-4 days (reduced from 5-7 via simplification)
**Type**: Infrastructure / DevOps
**Engineering Constitution Compliance**: ✅ Fully Compliant

---

## 1. Feature Summary

**Simplified approach to Supabase development infrastructure** for pre-launch workflow. Implements local-first development with automated test user creation (3 roles), simple sync script, and basic CI/CD validation. Focuses on **6 essential scripts** that solve actual pain points: test user creation, sync, verify, reset, backup, and deploy. Avoids over-engineering by using existing Supabase CLI tools instead of custom monitoring, console logging instead of database audit tables, and simple validation instead of manual approval gates.

---

## 2. User Stories

### Developer Experience

**US-1: Local-First Data Management**
- **As a** developer
- **I want to** create and test data locally, then push it to cloud with one command
- **So that** both environments stay in sync without manual Studio data entry

**US-2: Automated Test Users**
- **As a** developer
- **I want to** automatically create 3 test users (Admin, Sales Director, Account Manager) with realistic test data
- **So that** I can test role-based permissions and workflows without manual user setup

**US-3: Safe Deployments**
- **As a** developer
- **I want** CI/CD to validate migrations automatically with backups before deployment
- **So that** I catch schema issues before they reach production

**US-4: Clear Script Organization**
- **As a** developer
- **I want** scripts organized by purpose (dev/, migration/) with intuitive names
- **So that** I know exactly which script to run for each task

**US-5: Quick Environment Reset**
- **As a** developer
- **I want to** reset both local and cloud to a clean state with fresh test data
- **So that** I can start testing from a known baseline

### Maintainer Experience

**US-6: Documentation Accuracy**
- **As a** project maintainer
- **I want** documentation to reflect the actual pre-launch workflow implementation
- **So that** new contributors aren't confused by aspirational docs

**US-7: Storage Service Clarity**
- **As a** project maintainer
- **I want** clear documentation on whether local storage works or is disabled
- **So that** developers know whether to test file uploads locally or in cloud

**US-8: Migration Safety**
- **As a** project maintainer
- **I want** automated backups before every migration with rollback capability
- **So that** we can recover from failed migrations without data loss

---

## 3. Technical Approach

### 3.1 Frontend Components

**No frontend changes required** - this is pure infrastructure/tooling work.

### 3.2 API Endpoints

**No new API endpoints** - uses existing Supabase REST API and Edge Functions.

### 3.3 Database Changes

#### Migration: `20251016000000_add_test_users_metadata.sql`

```sql
-- Add metadata table to track test user creation
CREATE TABLE IF NOT EXISTS public.test_user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales_director', 'account_manager')),
  created_by TEXT DEFAULT 'automated_script',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  test_data_counts JSONB DEFAULT '{
    "contacts": 0,
    "organizations": 0,
    "opportunities": 0,
    "activities": 0,
    "tasks": 0,
    "notes": 0
  }'::jsonb
);

-- RLS policies
ALTER TABLE public.test_user_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Test metadata readable by authenticated users"
  ON public.test_user_metadata FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Test metadata writable by service role"
  ON public.test_user_metadata FOR ALL
  USING (auth.role() = 'service_role');

-- Index for quick lookups
CREATE INDEX idx_test_user_metadata_user_id ON public.test_user_metadata(user_id);
CREATE INDEX idx_test_user_metadata_role ON public.test_user_metadata(role);
```

**Note**: Original plan included `sync_operations_log` table for audit tracking. This was **removed as over-engineered** per Engineering Constitution. Console logging with timestamps is sufficient for pre-launch test data sync operations.

### 3.4 Script Structure (Simplified)

#### New Directory Organization

```
scripts/
├── dev/
│   ├── create-test-users.sh             # Create 3-role test users with data
│   ├── sync-local-to-cloud.sh           # Push local test data to cloud (with backup)
│   ├── verify-environment.sh            # Check local/cloud parity (simple count comparison)
│   └── reset-environment.sh             # Clean slate for both envs
├── migration/
│   ├── backup.sh                        # Simple pg_dump wrapper with timestamps
│   └── deploy-safe.sh                   # Backup + deploy + verify
└── supabase/
    ├── storage-fix-investigation.md     # Storage service fix attempts (30min timebox)
    └── README.md                        # Script usage guide
```

**Removed (Over-Engineered)**:
- ~~monitoring/~~ directory - Use `npx supabase status` directly
- ~~migration/validate.sh~~ - Use existing `npm run validate:pre-migration`
- ~~migration/rollback.sh~~ - Use `npx supabase db reset` for local, cloud has automated backups

#### Script Details

##### `scripts/dev/sync-local-to-cloud.sh`

**Purpose**: Push local PostgreSQL data to cloud Supabase
**Prerequisites**:
- Local Supabase running (`npm run supabase:local:start`)
- `.env.production` configured with cloud credentials

**Flow**:
```bash
#!/bin/bash
set -e

# Configuration
LOCAL_DB="postgresql://postgres:postgres@localhost:54322/postgres"
CLOUD_DB="${DATABASE_URL_PRODUCTION}"  # from .env.production
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/sync"

# Safety check - require --force flag
if [[ "$1" != "--force" ]]; then
  echo "⚠️  This will OVERWRITE cloud database with local data."
  echo "   Cloud URL: ${CLOUD_DB}"
  echo ""
  echo "   Run with --force to confirm:"
  echo "   npm run dev:sync:push -- --force"
  exit 1
fi

# Step 1: Backup cloud before overwrite
echo "📦 Backing up cloud database..."
mkdir -p "$BACKUP_DIR"
pg_dump "$CLOUD_DB" \
  --no-owner \
  --no-acl \
  --data-only \
  --exclude-schema=auth \
  --exclude-schema=storage \
  > "$BACKUP_DIR/cloud_backup_$TIMESTAMP.sql"

# Step 2: Dump local data (exclude auth - we'll handle separately)
echo "📤 Exporting local data..."
pg_dump "$LOCAL_DB" \
  --no-owner \
  --no-acl \
  --data-only \
  --exclude-schema=auth \
  --exclude-schema=storage \
  > "$BACKUP_DIR/local_dump_$TIMESTAMP.sql"

# Step 3: Clear cloud public schema data (preserve schema structure)
echo "🧹 Clearing cloud data..."
psql "$CLOUD_DB" << 'EOF'
TRUNCATE TABLE
  public.activities,
  public.contactNotes,
  public.contacts,
  public.dealNotes,
  public.deals,
  public.opportunities,
  public.organizations,
  public.products,
  public.sales,
  public.segments,
  public.tags,
  public.tasks,
  public.test_user_metadata
CASCADE;
EOF

# Step 4: Import local data to cloud
echo "📥 Importing local data to cloud..."
psql "$CLOUD_DB" < "$BACKUP_DIR/local_dump_$TIMESTAMP.sql"

# Step 5: Sync auth users separately (preserve passwords)
echo "👤 Syncing auth users..."
psql "$LOCAL_DB" -t -c "
  SELECT json_agg(json_build_object(
    'email', email,
    'encrypted_password', encrypted_password,
    'id', id,
    'raw_user_meta_data', raw_user_meta_data
  ))
  FROM auth.users
  WHERE email LIKE '%@test.local';
" | psql "$CLOUD_DB" -c "
  INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at)
  SELECT
    (value->>'id')::uuid,
    value->>'email',
    value->>'encrypted_password',
    (value->>'raw_user_meta_data')::jsonb,
    NOW(),
    NOW()
  FROM json_array_elements(:'user_json'::json)
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;
"

# Step 6: Log sync operation (console only, no database logging)
echo ""
echo "📋 Sync Summary:"
echo "   Operation: local_to_cloud"
echo "   Initiated by: $(whoami)"
echo "   Timestamp: $TIMESTAMP"
echo "   Backup: cloud_backup_$TIMESTAMP.sql"
echo ""

# Step 7: Verify counts
echo "✅ Sync complete! Verifying..."
./scripts/dev/verify-environment.sh

echo ""
echo "📊 Backup saved: $BACKUP_DIR/cloud_backup_$TIMESTAMP.sql"
echo "🔄 To rollback: psql \$CLOUD_DB < $BACKUP_DIR/cloud_backup_$TIMESTAMP.sql"
```

**Usage**:
```bash
npm run dev:sync:push -- --force
```

##### `scripts/dev/create-test-users.sh`

**Purpose**: Create 3 test users with role-specific test data
**Roles**:
- `admin@test.local` - Admin role (full access)
- `director@test.local` - Sales Director role (read-all, write-own)
- `manager@test.local` - Account Manager role (read/write-own only)

**Flow**:
```bash
#!/bin/bash
set -e

# Configuration from environment or defaults
ADMIN_EMAIL="${TEST_ADMIN_EMAIL:-admin@test.local}"
DIRECTOR_EMAIL="${TEST_DIRECTOR_EMAIL:-director@test.local}"
MANAGER_EMAIL="${TEST_MANAGER_EMAIL:-manager@test.local}"
TEST_PASSWORD="${TEST_USER_PASSWORD:-TestPass123!}"

DB_URL="${1:-postgresql://postgres:postgres@localhost:54322/postgres}"

echo "👥 Creating test users with role-specific data..."
echo "   Database: $DB_URL"
echo ""

# Generate user IDs deterministically (UUIDv5 from email)
ADMIN_ID=$(uuidgen -s -n @dns -N "$ADMIN_EMAIL")
DIRECTOR_ID=$(uuidgen -s -n @dns -N "$DIRECTOR_EMAIL")
MANAGER_ID=$(uuidgen -s -n @dns -N "$MANAGER_EMAIL")

# Step 1: Create auth users
echo "1️⃣  Creating auth.users..."
psql "$DB_URL" << EOF
-- Admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  '$ADMIN_ID'::uuid,
  '00000000-0000-0000-0000-000000000000',
  '$ADMIN_EMAIL',
  crypt('$TEST_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Sales Director user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  '$DIRECTOR_ID'::uuid,
  '00000000-0000-0000-0000-000000000000',
  '$DIRECTOR_EMAIL',
  crypt('$TEST_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Sales Director", "role": "sales_director"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Account Manager user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  '$MANAGER_ID'::uuid,
  '00000000-0000-0000-0000-000000000000',
  '$MANAGER_EMAIL',
  crypt('$TEST_PASSWORD', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Account Manager", "role": "account_manager"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;
EOF

# Step 2: Create sales records (triggers will sync from auth.users)
echo "2️⃣  Creating public.sales records..."
psql "$DB_URL" << EOF
INSERT INTO public.sales (
  id,
  first_name,
  last_name,
  email,
  administrator
) VALUES
  ('$ADMIN_ID'::uuid, 'Admin', 'User', '$ADMIN_EMAIL', true),
  ('$DIRECTOR_ID'::uuid, 'Sales', 'Director', '$DIRECTOR_EMAIL', false),
  ('$MANAGER_ID'::uuid, 'Account', 'Manager', '$MANAGER_EMAIL', false)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  administrator = EXCLUDED.administrator;
EOF

# Step 3: Generate role-specific test data
echo "3️⃣  Generating test data..."

# Admin gets most data (50 orgs, 100 contacts, 75 opps)
SEED_ORGANIZATION_COUNT=50 \
SEED_CONTACT_COUNT=100 \
SEED_OPPORTUNITY_COUNT=75 \
SEED_ACTIVITY_COUNT=200 \
SEED_PRODUCT_COUNT=100 \
TEST_USER_ID="$ADMIN_ID" \
node scripts/seed-data.js "$DB_URL"

# Director gets moderate data (30 orgs, 60 contacts, 40 opps)
SEED_ORGANIZATION_COUNT=30 \
SEED_CONTACT_COUNT=60 \
SEED_OPPORTUNITY_COUNT=40 \
SEED_ACTIVITY_COUNT=120 \
SEED_PRODUCT_COUNT=0 \
TEST_USER_ID="$DIRECTOR_ID" \
node scripts/seed-data.js "$DB_URL"

# Manager gets minimal data (20 orgs, 40 contacts, 25 opps)
SEED_ORGANIZATION_COUNT=20 \
SEED_CONTACT_COUNT=40 \
SEED_OPPORTUNITY_COUNT=25 \
SEED_ACTIVITY_COUNT=80 \
SEED_PRODUCT_COUNT=0 \
TEST_USER_ID="$MANAGER_ID" \
node scripts/seed-data.js "$DB_URL"

# Step 4: Track test user metadata
echo "4️⃣  Recording test user metadata..."
psql "$DB_URL" << EOF
INSERT INTO public.test_user_metadata (user_id, role, test_data_counts)
VALUES
  ('$ADMIN_ID'::uuid, 'admin', '{"contacts": 100, "organizations": 50, "opportunities": 75, "activities": 200}'::jsonb),
  ('$DIRECTOR_ID'::uuid, 'sales_director', '{"contacts": 60, "organizations": 30, "opportunities": 40, "activities": 120}'::jsonb),
  ('$MANAGER_ID'::uuid, 'account_manager', '{"contacts": 40, "organizations": 20, "opportunities": 25, "activities": 80}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET
  test_data_counts = EXCLUDED.test_data_counts,
  last_sync_at = NOW();
EOF

echo ""
echo "✅ Test users created successfully!"
echo ""
echo "📧 Login credentials:"
echo "   Admin:           $ADMIN_EMAIL / $TEST_PASSWORD"
echo "   Sales Director:  $DIRECTOR_EMAIL / $TEST_PASSWORD"
echo "   Account Manager: $MANAGER_EMAIL / $TEST_PASSWORD"
echo ""
echo "📊 Data summary:"
echo "   Admin:    100 contacts, 50 orgs, 75 opportunities"
echo "   Director:  60 contacts, 30 orgs, 40 opportunities"
echo "   Manager:   40 contacts, 20 orgs, 25 opportunities"
```

**Usage**:
```bash
# Local
npm run dev:users:create

# Cloud
npm run dev:users:create -- $CLOUD_DB_URL
```

##### `scripts/dev/reset-environment.sh`

**Purpose**: Reset both local and cloud to clean state
**Warning**: Destructive operation, requires confirmation

```bash
#!/bin/bash
set -e

echo "⚠️  ENVIRONMENT RESET"
echo "   This will DELETE all data in both local and cloud databases."
echo "   Schema structure will be preserved."
echo ""
read -p "Type 'RESET' to confirm: " CONFIRM

if [[ "$CONFIRM" != "RESET" ]]; then
  echo "❌ Cancelled"
  exit 1
fi

LOCAL_DB="postgresql://postgres:postgres@localhost:54322/postgres"
CLOUD_DB="${DATABASE_URL_PRODUCTION}"

# Step 1: Reset local
echo "🧹 Resetting local database..."
npm run supabase:local:db:reset

# Step 2: Reset cloud (preserve schema)
echo "🧹 Resetting cloud database..."
psql "$CLOUD_DB" << 'EOF'
TRUNCATE TABLE
  public.activities,
  public.contactNotes,
  public.contacts,
  public.dealNotes,
  public.deals,
  public.opportunities,
  public.organizations,
  public.products,
  public.sales,
  public.segments,
  public.tags,
  public.tasks,
  public.test_user_metadata
CASCADE;

DELETE FROM auth.users WHERE email LIKE '%@test.local';
EOF

# Step 3: Create fresh test users
echo "👥 Creating fresh test users..."
./scripts/dev/create-test-users.sh "$LOCAL_DB"

# Step 4: Sync to cloud
echo "🔄 Syncing to cloud..."
./scripts/dev/sync-local-to-cloud.sh --force

echo ""
echo "✅ Environment reset complete!"
echo "   Both local and cloud have fresh test data."
```

##### `scripts/dev/verify-environment.sh`

**Purpose**: Verify local and cloud have matching data

```bash
#!/bin/bash
set -e

LOCAL_DB="postgresql://postgres:postgres@localhost:54322/postgres"
CLOUD_DB="${DATABASE_URL_PRODUCTION}"

echo "🔍 Verifying environment parity..."
echo ""

# Compare table counts
TABLES=(
  "activities"
  "contacts"
  "contactNotes"
  "opportunities"
  "organizations"
  "products"
  "sales"
  "tasks"
)

MISMATCH=0

for table in "${TABLES[@]}"; do
  LOCAL_COUNT=$(psql "$LOCAL_DB" -t -c "SELECT COUNT(*) FROM public.$table;")
  CLOUD_COUNT=$(psql "$CLOUD_DB" -t -c "SELECT COUNT(*) FROM public.$table;")

  if [[ "$LOCAL_COUNT" -eq "$CLOUD_COUNT" ]]; then
    echo "✅ $table: $LOCAL_COUNT (local) = $CLOUD_COUNT (cloud)"
  else
    echo "❌ $table: $LOCAL_COUNT (local) ≠ $CLOUD_COUNT (cloud)"
    MISMATCH=1
  fi
done

# Verify test users exist
echo ""
echo "👥 Test users:"
psql "$CLOUD_DB" -t -c "SELECT email FROM auth.users WHERE email LIKE '%@test.local' ORDER BY email;"

if [[ $MISMATCH -eq 0 ]]; then
  echo ""
  echo "✅ Environments are in sync!"
  exit 0
else
  echo ""
  echo "⚠️  Mismatches detected. Run sync again if needed."
  exit 1
fi
```

##### `scripts/migration/backup.sh`

**Purpose**: Create timestamped backup before migrations

```bash
#!/bin/bash
set -e

TARGET="${1:-cloud}"  # cloud or local
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/migrations"

mkdir -p "$BACKUP_DIR"

if [[ "$TARGET" == "cloud" ]]; then
  DB_URL="${DATABASE_URL_PRODUCTION}"
  LABEL="cloud"
else
  DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
  LABEL="local"
fi

echo "📦 Creating backup: $LABEL database"
echo "   Target: $DB_URL"

pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$BACKUP_DIR/${LABEL}_backup_${TIMESTAMP}.sql"

FILESIZE=$(du -h "$BACKUP_DIR/${LABEL}_backup_${TIMESTAMP}.sql" | cut -f1)

echo "✅ Backup complete: ${LABEL}_backup_${TIMESTAMP}.sql ($FILESIZE)"
echo "   Location: $BACKUP_DIR/"
```

##### `scripts/migration/validate.sh`

**Purpose**: Run existing validation framework

```bash
#!/bin/bash
set -e

echo "🔍 Running pre-migration validation..."
echo ""

# Use existing validation framework
node scripts/validation/run-pre-validation.js

EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
  echo ""
  echo "✅ Validation passed! Safe to migrate."
  exit 0
else
  echo ""
  echo "❌ Validation failed. Fix issues before migrating."
  exit 1
fi
```

##### `scripts/migration/deploy-safe.sh`

**Purpose**: Deploy migrations with automatic rollback on failure

```bash
#!/bin/bash
set -e

TARGET="${1:-cloud}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [[ "$TARGET" == "cloud" ]]; then
  export DATABASE_URL="${DATABASE_URL_PRODUCTION}"
  LABEL="PRODUCTION"
else
  export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
  LABEL="LOCAL"
fi

echo "🚀 Safe Migration Deploy - $LABEL"
echo "   Database: $DATABASE_URL"
echo ""

# Step 1: Backup
echo "1️⃣  Creating backup..."
./scripts/migration/backup.sh "$TARGET"
BACKUP_FILE="./backups/migrations/${TARGET}_backup_${TIMESTAMP}.sql"

# Step 2: Validate
echo ""
echo "2️⃣  Running validation..."
./scripts/migration/validate.sh

# Step 3: Dry-run (if cloud)
if [[ "$TARGET" == "cloud" ]]; then
  echo ""
  echo "3️⃣  Dry-run migration..."
  npx supabase db push --dry-run

  echo ""
  read -p "Proceed with migration? (y/n): " CONFIRM
  if [[ "$CONFIRM" != "y" ]]; then
    echo "❌ Cancelled"
    exit 0
  fi
fi

# Step 4: Apply migration
echo ""
echo "4️⃣  Applying migration..."
if npx supabase db push; then
  echo "✅ Migration applied successfully!"
else
  echo ""
  echo "❌ Migration failed! Rolling back..."
  psql "$DATABASE_URL" < "$BACKUP_FILE"
  echo "✅ Rollback complete. Database restored."
  exit 1
fi

# Step 5: Post-migration validation
echo ""
echo "5️⃣  Post-migration validation..."
if node scripts/post-migration-validation.js; then
  echo ""
  echo "✅ All checks passed!"
  echo "📦 Backup retained: $BACKUP_FILE"
  exit 0
else
  echo ""
  echo "⚠️  Post-migration validation failed. Consider rollback:"
  echo "   psql \$DATABASE_URL < $BACKUP_FILE"
  exit 1
fi
```

**Note**: Original plan included `scripts/monitoring/health-check.sh` and `scripts/monitoring/status-report.sh`. These were **removed as over-engineered** per Engineering Constitution. Use `npx supabase status` for health checks and simple psql queries for status reporting.

### 3.5 CI/CD Pipeline (Simplified)

#### `.github/workflows/supabase-deploy.yml`

```yaml
name: Supabase Deploy

on:
  push:
    branches: [main]
    paths:
      - 'supabase/**'
      - 'scripts/migration/**'
      - '.github/workflows/supabase-deploy.yml'
  workflow_dispatch:
    inputs:
      skip_validation:
        description: 'Skip validation checks'
        required: false
        type: boolean
        default: false

concurrency:
  group: supabase-deploy-${{ github.ref }}
  cancel-in-progress: false  # Never cancel DB operations

jobs:
  validate:
    name: Validate Migrations
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start local Supabase
        run: npx supabase start

      - name: Run validation framework
        run: npm run migration:validate

      - name: Stop Supabase
        if: always()
        run: npx supabase stop

  dry-run:
    name: Migration Dry Run
    needs: validate
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Link to production
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}

      - name: Dry-run migration
        run: npx supabase db push --dry-run

      - name: Upload dry-run output
        uses: actions/upload-artifact@v4
        with:
          name: dry-run-output
          path: |
            *.log
            *.sql
          retention-days: 7

  deploy:
    name: Deploy to Production
    needs: dry-run
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'  # Only manual triggers

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Link to production
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}

      - name: Create backup
        run: npm run migration:backup -- cloud

      - name: Deploy migrations
        id: deploy
        run: npx supabase db push

      - name: Deploy edge functions
        run: npx supabase functions deploy

      - name: Post-deployment validation
        run: node scripts/post-migration-validation.js

      - name: Upload deployment logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: deployment-logs
          path: |
            logs/
            backups/
          retention-days: 30

      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Deployment failed!"
          echo "   Check logs and consider rollback if needed"
```

**Removed**: Manual approval job and post-deploy monitoring checks. Start simple - add manual approval via GitHub environment settings if needed later.

### 3.6 Storage Service Investigation

**Task**: Investigate CLI/Storage API version mismatch and document fix or workaround.

**Approach**:
1. Check current Supabase CLI version: `npx supabase --version`
2. Check `supabase/config.toml` storage configuration
3. Try upgrade path:
   ```bash
   npm update supabase
   npx supabase stop
   npx supabase start
   ```
4. If still broken, check error logs:
   ```bash
   docker logs supabase_storage
   ```
5. Check Supabase GitHub issues for known problems
6. **Timebox: 30 minutes**
7. If not fixed, document workaround in `scripts/supabase/storage-fix-investigation.md`

**Success Criteria**:
- ✅ Storage enabled in config.toml
- ✅ Can upload files via Studio
- ✅ Can query storage.objects table

**Fallback**:
Document that storage doesn't work locally, use cloud for file upload testing.

### 3.7 Package.json Updates (Simplified)

```json
{
  "scripts": {
    "// === Development Sync Scripts ===": "",
    "dev:sync:push": "./scripts/dev/sync-local-to-cloud.sh",
    "dev:users:create": "./scripts/dev/create-test-users.sh",
    "dev:reset": "./scripts/dev/reset-environment.sh",
    "dev:verify": "./scripts/dev/verify-environment.sh",

    "// === Migration Scripts ===": "",
    "migrate:backup": "./scripts/migration/backup.sh",
    "migrate:deploy": "./scripts/migration/deploy-safe.sh",

    "// === Legacy (keep for backward compatibility) ===": "",
    "supabase:deploy": "npx supabase db push && npx supabase functions deploy",
    "supabase:local:start": "npx supabase start",
    "supabase:local:stop": "npx supabase stop",
    "supabase:local:status": "npx supabase status"
  }
}
```

**Removed**: Monitoring scripts (use `npx supabase status` directly), validate/rollback scripts (use existing tools)

### 3.8 Environment Variables

#### `.env.production` (template)

```bash
# Cloud Supabase (Production)
VITE_SUPABASE_URL=https://aaqnanddcqvfiwhshndl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL_PRODUCTION=postgresql://postgres:[PASSWORD]@db.aaqnanddcqvfiwhshndl.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test user credentials
TEST_ADMIN_EMAIL=admin@test.local
TEST_DIRECTOR_EMAIL=director@test.local
TEST_MANAGER_EMAIL=manager@test.local
TEST_USER_PASSWORD=TestPass123!

# Opportunity Configuration
OPPORTUNITY_DEFAULT_CATEGORY=new_business
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost
OPPORTUNITY_MAX_AMOUNT=1000000
OPPORTUNITY_DEFAULT_PROBABILITY=50
```

#### `.gitignore` updates

```
# Environment files
.env.production
.env.migration
.env.staging

# Backup files
backups/
*.sql.backup

# Sync operation logs
logs/sync-operations/
```

### 3.9 Documentation Updates

#### `docs/supabase/supabase_workflow_overview.md` (update)

**Changes**:
- Add section: "Pre-Launch Workflow (Current Implementation)"
- Update commands to reference new npm scripts
- Add test user credentials section
- Note storage service status
- Link to script reference guide

#### `scripts/supabase/README.md` (new)

**Contents**:
- Script inventory with descriptions
- Common workflows (sync, reset, deploy)
- Troubleshooting guide
- Environment variable reference
- CI/CD pipeline overview

### 3.10 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRE-LAUNCH DATA FLOW                     │
└─────────────────────────────────────────────────────────────┘

    LOCAL DEVELOPMENT                      CLOUD PRODUCTION
┌──────────────────────────┐          ┌──────────────────────────┐
│   Docker Supabase        │          │   Supabase Cloud         │
│   :54321/:54322          │          │   aaqnanddcqvfiwhshndl   │
│                          │          │                          │
│  ┌────────────────────┐  │          │  ┌────────────────────┐  │
│  │  PostgreSQL        │  │          │  │  PostgreSQL        │  │
│  │  - auth.users      │  │          │  │  - auth.users      │  │
│  │  - public.* tables │  │◀────────▶│  │  - public.* tables │  │
│  │  - Test data       │  │   SYNC   │  │  - Test data       │  │
│  └────────────────────┘  │          │  └────────────────────┘  │
│                          │          │                          │
│  ┌────────────────────┐  │          │  ┌────────────────────┐  │
│  │  Edge Functions    │  │          │  │  Edge Functions    │  │
│  │  - users           │  │──DEPLOY─▶│  │  - users           │  │
│  │  - updatePassword  │  │          │  │  - updatePassword  │  │
│  └────────────────────┘  │          │  └────────────────────┘  │
└──────────────────────────┘          └──────────────────────────┘
             │                                     ▲
             │ CREATE                              │
             │ TEST DATA                           │ PUSH
             ▼                                     │
    ┌────────────────────┐            ┌───────────────────────┐
    │ create-test-users  │            │ sync-local-to-cloud   │
    │ - Admin            │            │ 1. Backup cloud       │
    │ - Director         │            │ 2. Dump local         │
    │ - Manager          │            │ 3. Clear cloud data   │
    │ + Test data        │            │ 4. Import to cloud    │
    └────────────────────┘            │ 5. Verify counts      │
                                      └───────────────────────┘
                                                  │
                                                  │ TRIGGER
                                                  ▼
                                      ┌───────────────────────┐
                                      │   GitHub Actions      │
                                      │   CI/CD Pipeline      │
                                      │                       │
                                      │ 1. Validate           │
                                      │ 2. Dry-run            │
                                      │ 3. Manual Approve     │
                                      │ 4. Deploy             │
                                      │ 5. Health Check       │
                                      └───────────────────────┘
```

---

## 4. UI/UX Flow (Terminal Interactions)

### 4.1 Daily Development Flow

**Developer starts their day:**

```bash
# Terminal 1: Start local Supabase
$ npm run supabase:local:start

Starting Supabase local development setup...
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio: http://localhost:54323
Status: Running

# Terminal 2: Start dev server
$ npm run dev:local

> crispy-crm@0.1.0 dev:local
> npx supabase db reset && vite --force

Resetting database...
✓ All migrations applied
✓ Seed data loaded
✓ Ready to develop!

  VITE v5.1.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**Developer creates test users:**

```bash
$ npm run dev:users:create

👥 Creating test users with role-specific data...
   Database: postgresql://postgres:postgres@localhost:54322/postgres

1️⃣  Creating auth.users...
2️⃣  Creating public.sales records...
3️⃣  Generating test data...
   → Admin data: 100 contacts, 50 orgs, 75 opportunities
   → Director data: 60 contacts, 30 orgs, 40 opportunities
   → Manager data: 40 contacts, 20 orgs, 25 opportunities
4️⃣  Recording test user metadata...

✅ Test users created successfully!

📧 Login credentials:
   Admin:           admin@test.local / TestPass123!
   Sales Director:  director@test.local / TestPass123!
   Account Manager: manager@test.local / TestPass123!

📊 Data summary:
   Admin:    100 contacts, 50 orgs, 75 opportunities
   Director:  60 contacts, 30 orgs, 40 opportunities
   Manager:   40 contacts, 20 orgs, 25 opportunities
```

**Developer pushes local data to cloud:**

```bash
$ npm run dev:sync:push

⚠️  This will OVERWRITE cloud database with local data.
   Cloud URL: postgresql://postgres:***@db.aaqnanddcqvfiwhshndl.supabase.co:5432/postgres

   Run with --force to confirm:
   npm run dev:sync:push -- --force

$ npm run dev:sync:push -- --force

📦 Backing up cloud database...
   ✓ Backup created: backups/sync/cloud_backup_20251016_143022.sql

📤 Exporting local data...
   ✓ Local dump created: backups/sync/local_dump_20251016_143022.sql

🧹 Clearing cloud data...
   ✓ Truncated 13 tables

📥 Importing local data to cloud...
   ✓ Imported 1,247 rows

👤 Syncing auth users...
   ✓ Synced 3 test users

✅ Sync complete! Verifying...

🔍 Verifying environment parity...

✅ activities: 400 (local) = 400 (cloud)
✅ contacts: 200 (local) = 200 (cloud)
✅ contactNotes: 150 (local) = 150 (cloud)
✅ opportunities: 140 (local) = 140 (cloud)
✅ organizations: 100 (local) = 100 (cloud)
✅ products: 100 (local) = 100 (cloud)
✅ sales: 3 (local) = 3 (cloud)
✅ tasks: 75 (local) = 75 (cloud)

👥 Test users:
 admin@test.local
 director@test.local
 manager@test.local

✅ Environments are in sync!

📊 Backup saved: backups/sync/cloud_backup_20251016_143022.sql
🔄 To rollback: psql $CLOUD_DB < backups/sync/cloud_backup_20251016_143022.sql
```

### 4.2 Migration Deployment Flow

**Developer creates new migration:**

```bash
$ npx supabase migration new add_tags_table

Created new migration at supabase/migrations/20251016143500_add_tags_table.sql

# Edit the migration file...
# Test locally:
$ npm run supabase:local:db:reset

✓ All migrations applied
✓ New tags table created
```

**Push to GitHub:**

```bash
$ git add supabase/migrations/
$ git commit -m "feat: add tags table for organizing contacts"
$ git push origin main
```

**GitHub Actions CI/CD runs:**

```
✓ Validate (30s)
  └─ Validation framework passed

✓ Dry Run (45s)
  └─ Migration preview generated

⏸️  Manual Approval (waiting)
  └─ Review required in GitHub UI
```

**Maintainer reviews and approves in GitHub:**

```
✓ Manual Approval (approved by @krwhynot)

✓ Deploy (2m 15s)
  └─ Backup created
  └─ Migrations applied
  └─ Edge functions deployed
  └─ Post-validation passed

✓ Post-Deploy Checks (30s)
  └─ Health check: PASS
  └─ Status report uploaded
```

### 4.3 Environment Reset Flow

**Developer needs fresh start:**

```bash
$ npm run dev:reset

⚠️  ENVIRONMENT RESET
   This will DELETE all data in both local and cloud databases.
   Schema structure will be preserved.

Type 'RESET' to confirm: RESET

🧹 Resetting local database...
   ✓ Local reset complete

🧹 Resetting cloud database...
   ✓ Cloud data cleared
   ✓ Test users removed

👥 Creating fresh test users...
   ✓ 3 users created

🔄 Syncing to cloud...
   ✓ Sync complete

✅ Environment reset complete!
   Both local and cloud have fresh test data.
```

### 4.4 Health Monitoring Flow

**Quick health check:**

```bash
$ npm run monitor:health

✅ local environment healthy

$ npm run monitor:health -- cloud

✅ cloud environment healthy
```

**Detailed status report:**

```bash
$ npm run monitor:status -- cloud

📊 CLOUD Environment Status Report
   Generated: 2025-10-16 14:45:32

🗄️  Database:
 database        | postgres_version           | size
─────────────────┼────────────────────────────┼─────────
 postgres        | PostgreSQL 15.1 on x86_64  | 47 MB

📋 Table Counts:
 table_name              | inserts | updates | deletes | current_rows
─────────────────────────┼─────────┼─────────┼─────────┼─────────────
 public.activities       |     400 |      12 |       0 |          400
 public.contacts         |     200 |      45 |       0 |          200
 public.opportunities    |     140 |      23 |       0 |          140
 public.organizations    |     100 |      10 |       0 |          100
 ...

👥 Auth Users:
 email                   | confirmed | created_at
─────────────────────────┼───────────┼─────────────────────
 admin@test.local        | t         | 2025-10-16 14:30:22
 director@test.local     | t         | 2025-10-16 14:30:23
 manager@test.local      | t         | 2025-10-16 14:30:24

🔄 Recent Sync Operations:
 operation_type   | direction | status    | started_at          | completed_at
──────────────────┼───────────┼───────────┼─────────────────────┼─────────────────────
 local_to_cloud   | push      | completed | 2025-10-16 14:30:15 | 2025-10-16 14:31:02
 local_to_cloud   | push      | completed | 2025-10-15 09:15:30 | 2025-10-15 09:16:12

🔗 Connections:
 datname  | active_connections | transactions | disk_reads | cache_hits | cache_hit_ratio
──────────┼────────────────────┼──────────────┼────────────┼────────────┼─────────────────
 postgres |                  5 |       12,453 |        234 |     98,766 |           99.76
```

---

## 5. Success Metrics (Simplified)

### 5.1 Implementation Complete When:

**Scripts** (6 total, down from 13):
- ✅ Core 6 scripts created and executable: create-test-users, sync-local-to-cloud, verify-environment, reset-environment, backup, deploy-safe
- ✅ All scripts have error handling and clear console output
- ✅ Scripts work on both local and cloud targets

**CI/CD** (Simple Validation):
- ✅ GitHub Actions workflow validates migrations automatically
- ✅ Dry-run step catches schema issues
- ✅ Workflow fails on validation errors

**Test Users**:
- ✅ 3 test users auto-created with role-specific data
- ✅ Login works in both local and cloud
- ✅ Each user has correct permission level (admin, director, manager)

**Sync**:
- ✅ Local → Cloud sync works without data loss
- ✅ Verification script shows matching counts
- ✅ Auth users sync with passwords intact
- ✅ Console logs provide sync operation details (no database logging)

**Documentation**:
- ✅ README.md explains all scripts
- ✅ workflow_overview.md updated for pre-launch
- ✅ Storage status documented (working or workaround)

### 5.2 Performance Targets

- **Sync operation**: < 2 minutes for typical test dataset (200 contacts, 100 orgs, 140 opps)
- **Test user creation**: < 30 seconds for all 3 users + data
- **Environment reset**: < 3 minutes for full reset both envs
- **CI/CD pipeline**: < 5 minutes from push to validation complete

### 5.3 Quality Metrics

- **Script reliability**: 100% success rate on clean environments
- **Error handling**: All scripts have clear error messages and non-zero exit codes on failure
- **Idempotency**: All scripts can be run multiple times safely
- **Backup coverage**: 100% of destructive operations create backups first (sync, reset, deploy)
- **Documentation coverage**: Every script documented with purpose, usage, and examples

**Removed Metrics** (Over-Engineered):
- ~~Manual approval gate working~~ - Removed manual approval
- ~~Health check performance~~ - Use `npx supabase status`
- ~~Status report accuracy~~ - No custom reports
- ~~Sync operation log tracking~~ - Console logging only

---

## 6. Out of Scope

### Explicitly NOT Included (Deferred to Post-Launch):

❌ **Staging Environment Setup**
- No separate staging Supabase project
- No staging-specific configurations
- Defer until real user data exists

❌ **Data Anonymization Workflows**
- No PII anonymization scripts
- No `anonymize_production.sql`
- No email/phone scrambling
- Only needed when copying real user data

❌ **Cloud → Local Sync Direction**
- No pull scripts (only push)
- Pre-launch doesn't need cloud-first data
- Would add complexity without value

❌ **Database Branching**
- No `supabase branches` implementation
- No preview environment per PR
- Linear development workflow sufficient

❌ **Advanced Monitoring**
- No Grafana/Datadog integration
- No real-time alerting
- Basic health checks sufficient

❌ **Storage Service Deep Debugging**
- 30-minute timebox only
- If not quick fix, document workaround
- Not blocking for CRM features

❌ **Multi-Region Setup**
- Single cloud instance only
- No geo-replication
- Not needed for pre-launch scale

❌ **Automated Testing in CI/CD**
- No E2E tests in pipeline (future enhancement)
- Only migration validation
- Manual testing sufficient for now

❌ **Rollback Automation**
- Manual rollback only (documented commands)
- No automated rollback triggers
- Manual approval provides safety

❌ **Secret Rotation**
- No automated credential rotation
- Static test user passwords acceptable
- Only matters with real users

---

## 7. Implementation Order

### Phase 1: Foundation (Day 1)
1. Create directory structure (`scripts/dev/`, `scripts/migration/`)
2. Create migration: `20251016000000_add_test_users_metadata.sql`
3. Apply migration locally and to cloud
4. Create `.env.production` template

### Phase 2: Core Scripts (Day 2-3)
1. `create-test-users.sh` - Test with local first
2. `sync-local-to-cloud.sh` - Test with small dataset
3. `verify-environment.sh` - Simple count comparison
4. `reset-environment.sh` - Test full cycle
5. `backup.sh` - Simple pg_dump wrapper
6. `deploy-safe.sh` - Backup + deploy + verify

### Phase 3: CI/CD & Documentation (Day 3-4)
1. `.github/workflows/supabase-deploy.yml` - Simple validation workflow
2. Update package.json with new npm scripts
3. Create `scripts/supabase/README.md`
4. Update docs/supabase/supabase_workflow_overview.md
5. Storage service investigation (30min timebox)
6. Test all scripts end-to-end

**Removed (Over-Engineered)**:
- ~~sync_operations_log migration~~ - Console logging sufficient
- ~~monitoring/ scripts~~ - Use `npx supabase status`
- ~~validate.sh, rollback.sh~~ - Use existing tools
- ~~Manual approval gates in CI/CD~~ - Start simple, add if needed

**Total Timeline**: 3-4 days (reduced from 5-7 days)

---

## 8. Dependencies & Prerequisites

### Required:
- Node.js 18+ (current: 22)
- PostgreSQL client tools (`psql`, `pg_dump`)
- Supabase CLI 2.45.5+ (current version)
- Docker Desktop (for local Supabase)
- Git
- Bash 4.0+ (for scripts)
- `uuidgen` utility (for deterministic user IDs)

### GitHub Secrets Required:
- `SUPABASE_ACCESS_TOKEN` - Supabase personal access token
- `SUPABASE_DB_PASSWORD` - Cloud database password
- `SUPABASE_PROJECT_ID` - Project ref (aaqnanddcqvfiwhshndl)
- `DATABASE_URL_PRODUCTION` - Full PostgreSQL connection string
- `VITE_SUPABASE_URL` - Cloud API URL
- `VITE_SUPABASE_ANON_KEY` - Cloud anon key

### GitHub Environment Setup:
- Create environment: `production-supabase`
- Add required reviewers (maintainers only)
- Enable environment protection rules

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Data loss during sync** | Medium | High | Automatic backups before every operation |
| **Broken CI/CD pipeline** | Low | Medium | Dry-run step catches issues before approval |
| **Storage fix takes too long** | High | Low | Timebox to 30min, document workaround |
| **Script compatibility issues** | Low | Medium | Test on clean Ubuntu/macOS environments |
| **GitHub secrets misconfigured** | Medium | High | Validation step in CI/CD checks connectivity |
| **Test users conflict with real users** | Low | High | Use `.test.local` domain (invalid TLD) |
| **Migration rollback fails** | Low | High | Test rollback procedure in Phase 2 |
| **Script execution permissions** | Medium | Low | Include `chmod +x` step in docs |

---

## 10. Testing Plan

### Manual Testing Checklist:

**Test User Creation:**
- [ ] Run locally, verify 3 users created
- [ ] Login as each user, check permissions
- [ ] Verify test data counts match expectations
- [ ] Check metadata table populated

**Sync Operations:**
- [ ] Sync with small dataset (10 records)
- [ ] Sync with large dataset (500 records)
- [ ] Verify data integrity after sync
- [ ] Test rollback from backup

**Environment Reset:**
- [ ] Reset local only
- [ ] Reset both local + cloud
- [ ] Verify fresh state after reset

**CI/CD Pipeline:**
- [ ] Push migration, verify validation runs
- [ ] Check dry-run output is readable
- [ ] Approve deployment, verify success
- [ ] Trigger failure scenario, verify rollback offer

---

## 11. Rollback Plan (Simplified)

If implementation causes issues:

**Database Changes:**
- `test_user_metadata` table can be dropped without affecting existing features
- No sync_operations_log table (removed as over-engineered)

**Scripts:**
- New scripts are additive, don't modify existing functionality
- Can be deleted without impact
- Old scripts remain functional

**CI/CD:**
- Workflow can be disabled by renaming file
- Manual deployments still work via CLI

**Environment Variables:**
- `.env.production` is new file, doesn't affect existing `.env.local`
- Can be removed if needed

**No Breaking Changes:**
- All existing npm scripts preserved
- Existing validation framework untouched
- Current deployment process unaffected

---

## 12. Future Enhancements (Post-Launch)

Once real users exist:

1. **Staging Environment** - Separate Supabase project with anonymized data
2. **Data Anonymization** - PII protection scripts for production dumps
3. **Cloud → Local Sync** - For debugging production issues locally
4. **Database Branching** - Preview environments per PR
5. **Advanced Monitoring** - Grafana dashboards, alerting
6. **E2E Tests in CI** - Automated testing before deployment
7. **Automated Rollback** - Trigger rollback on post-deploy validation failure
8. **Secret Rotation** - Automated credential updates
9. **Multi-Region** - Geo-replication for performance/redundancy
10. **Blue/Green Deployments** - Zero-downtime migrations

---

## Changelog

### v2.0 - Simplified (2025-10-15)
**Engineering Constitution Compliance Improvements**

**Removed Over-Engineered Elements:**
1. **`sync_operations_log` database table** - Console logging with timestamps is sufficient for pre-launch test data
2. **`scripts/monitoring/` directory** (3 scripts) - Use built-in `npx supabase status` instead
3. **Manual approval gates in CI/CD** - Start simple, add GitHub environment approval later if needed
4. **`migration/validate.sh`** - Use existing `npm run validate:pre-migration`
5. **`migration/rollback.sh`** - Use `npx supabase db reset` for local; cloud has automated backups

**Impact:**
- Scripts reduced from 13 → 6 (54% reduction)
- Timeline reduced from 5-7 days → 3-4 days (40% faster)
- Database migrations reduced from 2 → 1
- Implementation phases reduced from 5 → 3

**Core Simplifications:**
- CI/CD: Removed manual approval job, removed post-deploy monitoring checks
- Monitoring: Removed custom health-check.sh and status-report.sh scripts
- Validation: Reuse existing validation framework instead of duplicating
- Logging: Console output with timestamps instead of database audit trails
- Script organization: Removed `monitoring/` directory entirely

**Retained (Essential):**
- 6 core scripts solving real pain points: create-test-users, sync-local-to-cloud, verify-environment, reset-environment, backup, deploy-safe
- Simple CI/CD validation workflow (validate + dry-run + deploy)
- Test user automation with role-specific data volumes
- Local-to-cloud sync capability with backup
- Basic verification and reset functionality

### v1.0 - Initial (2025-10-15)
- Comprehensive infrastructure plan with monitoring, logging, and manual approval gates
- 13 scripts across 3 directories (dev/, migration/, monitoring/)
- 2 database migrations (test_user_metadata, sync_operations_log)
- 5-phase implementation timeline over 5-7 days

---

**END OF REQUIREMENTS DOCUMENT**
