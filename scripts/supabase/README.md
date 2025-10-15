# Supabase Scripts Documentation

## Table of Contents
- [Script Inventory](#script-inventory)
- [Common Workflows](#common-workflows)
  - [Daily Development Setup](#daily-development-setup)
  - [Pushing Local Data to Cloud](#pushing-local-data-to-cloud)
  - [Resetting Environments](#resetting-environments)
  - [Creating Test Users](#creating-test-users)
  - [Safe Migration Deployment](#safe-migration-deployment)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Environment Variables](#environment-variables)
- [CI/CD Pipeline](#cicd-pipeline)

## Script Inventory

| Script Name | Purpose | Usage | Location |
|------------|---------|-------|----------|
| **create-test-users.sh** | Creates 3 test users with role-specific data (admin, director, manager) | `./scripts/dev/create-test-users.sh [DB_URL]` | `scripts/dev/` |
| **sync-local-to-cloud.sh** | Synchronizes local development data to cloud Supabase instance | `./scripts/dev/sync-local-to-cloud.sh` | `scripts/dev/` |
| **verify-environment.sh** | Validates environment setup and data integrity | `./scripts/dev/verify-environment.sh [local\|cloud]` | `scripts/dev/` |
| **reset-environment.sh** | Resets database to clean state with fresh migrations | `npx supabase db reset` | Built-in command |
| **backup.sh** | Creates database backups before major operations | `./scripts/migration/backup.sh [environment]` | `scripts/migration/` |
| **deploy-safe.sh** | Deploys migrations with validation and rollback capability | `./scripts/migration/deploy-safe.sh` | `scripts/migration/` |

## Common Workflows

### Daily Development Setup

Start your local development environment with test data:

```bash
# 1. Start local Supabase
npm run supabase:local:start

# 2. Verify local environment is running
npm run supabase:local:status

# 3. Create test users with sample data
./scripts/dev/create-test-users.sh

# 4. Verify setup
./scripts/dev/verify-environment.sh local
```

**Expected Output:**
```
✓ Supabase local instance running on port 54321
✓ Created 3 test users with roles: admin, director, manager
✓ Environment verification passed: 15 contacts, 8 organizations, 10 opportunities
```

### Pushing Local Data to Cloud

Synchronize your local development data to the cloud instance:

```bash
# 1. Ensure .env.production is configured
cat .env.production | grep SUPABASE

# 2. Create backup of cloud data
./scripts/migration/backup.sh cloud

# 3. Sync local to cloud
./scripts/dev/sync-local-to-cloud.sh

# 4. Verify cloud environment
./scripts/dev/verify-environment.sh cloud
```

**Expected Output:**
```
✓ Backup created: backups/cloud_2025_01_26_143022.sql
✓ Syncing data from local to cloud...
✓ Users synced: 3
✓ Contacts synced: 15
✓ Organizations synced: 8
✓ Opportunities synced: 10
✓ Cloud environment verified successfully
```

### Resetting Environments

Reset your local database to a clean state:

```bash
# 1. Reset local database (migrations + seed data)
npx supabase db reset

# 2. Recreate test users
./scripts/dev/create-test-users.sh

# 3. Optional: Import specific test data
npm run seed:data
```

**Expected Output:**
```
Resetting database...
✓ Dropped all tables
✓ Applied 15 migrations
✓ Database reset complete
✓ Test users created
```

### Creating Test Users

Create test users with different permission levels:

```bash
# Using default configuration
./scripts/dev/create-test-users.sh

# With custom database URL
./scripts/dev/create-test-users.sh "postgresql://postgres:password@localhost:5432/mydb"

# With custom emails (via environment variables)
export TEST_ADMIN_EMAIL="custom-admin@example.com"
export TEST_DIRECTOR_EMAIL="custom-director@example.com"
export TEST_MANAGER_EMAIL="custom-manager@example.com"
export TEST_USER_PASSWORD="SecurePass456!"
./scripts/dev/create-test-users.sh
```

**Created Users:**
| Email | Role | Password | Data Volume |
|-------|------|----------|-------------|
| admin@test.local | Admin | TestPass123! | Full dataset (all contacts, orgs, opportunities) |
| director@test.local | Sales Director | TestPass123! | Read all, write own (moderate dataset) |
| manager@test.local | Account Manager | TestPass123! | Read/write own only (minimal dataset) |

### Safe Migration Deployment

Deploy migrations to production with validation:

```bash
# 1. Create backup before deployment
./scripts/migration/backup.sh production

# 2. Deploy with validation
./scripts/migration/deploy-safe.sh

# 3. If deployment fails, rollback
npx supabase db reset --db-url $DATABASE_URL
psql $DATABASE_URL < backups/production_latest.sql
```

**Expected Output:**
```
✓ Pre-deployment backup created
✓ Running migration validation...
✓ Applying migrations to production...
✓ Post-deployment verification:
  - Users table: 25 records
  - Contacts table: 150 records
  - No orphaned records detected
✓ Deployment successful
```

## Troubleshooting Guide

### Connection Errors

**Problem:** Cannot connect to Supabase instance
```
Error: connection to server at "localhost" (127.0.0.1), port 54322 failed
```

**Solution:**
```bash
# Check if local Supabase is running
docker ps | grep supabase

# Check .env.production for cloud connection
cat .env.production | grep SUPABASE_URL

# Verify service role key is set
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Sync Failures

**Problem:** Data sync fails with trigger errors
```
Error: trigger "sync_auth_users" does not exist
```

**Solution:**
```bash
# Restore missing triggers
npx supabase migration repair

# Verify triggers exist
psql $DATABASE_URL -c "SELECT tgname FROM pg_trigger WHERE tgname LIKE 'sync_%';"

# Rerun sync after fix
./scripts/dev/sync-local-to-cloud.sh
```

### Permission Errors

**Problem:** Operation fails with permission denied
```
Error: permission denied for table contacts
```

**Solution:**
```bash
# Verify service role key is being used
grep SERVICE_ROLE .env.production

# Check RLS policies
npx supabase inspect db --db-url $DATABASE_URL

# Use service role key for admin operations
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Count Mismatches

**Problem:** Verification shows unexpected record counts
```
Warning: Expected 15 contacts, found 12
```

**Solution:**
```bash
# Run detailed verification
./scripts/dev/verify-environment.sh local --verbose

# Check for orphaned records
psql $DATABASE_URL -c "
  SELECT c.id, c.name
  FROM contacts c
  LEFT JOIN organizations o ON c.organization_id = o.id
  WHERE c.organization_id IS NOT NULL AND o.id IS NULL;
"

# Clean orphaned data
npm run db:clean-orphans
```

## Environment Variables

### Required Variables

| Variable | Description | Where to Find | Example |
|----------|-------------|---------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anonymous/Public API key | Supabase Dashboard > Settings > API | `eyJhbGc...` |
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard > Settings > Database | `postgresql://postgres:password@db.xyzcompany.supabase.co:5432/postgres` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | None | `eyJhbGc...` |
| `TEST_ADMIN_EMAIL` | Admin test user email | `admin@test.local` | `admin@mycompany.com` |
| `TEST_DIRECTOR_EMAIL` | Director test user email | `director@test.local` | `director@mycompany.com` |
| `TEST_MANAGER_EMAIL` | Manager test user email | `manager@test.local` | `manager@mycompany.com` |
| `TEST_USER_PASSWORD` | Password for test users | `TestPass123!` | `MySecurePass456!` |
| `OPPORTUNITY_DEFAULT_STAGE` | Default opportunity stage | `new_lead` | `prospect` |

### Security Considerations

1. **Never commit `.env` files** to version control
2. **Service Role Key** should only be used in:
   - CI/CD pipelines
   - Admin scripts
   - Never in client-side code
3. **Use separate keys** for development and production
4. **Rotate keys regularly** (quarterly recommended)
5. **Store production secrets** in secure vaults (GitHub Secrets, Vault, etc.)

### Finding Your Supabase Values

1. **Navigate to Supabase Dashboard:**
   ```
   https://app.supabase.com/project/[your-project-id]
   ```

2. **Access Settings > API:**
   - `Project URL`: Your VITE_SUPABASE_URL
   - `anon/public`: Your VITE_SUPABASE_ANON_KEY
   - `service_role`: Your SUPABASE_SERVICE_ROLE_KEY (keep secret!)

3. **Access Settings > Database:**
   - Connection string: Your DATABASE_URL
   - Connection pooling: Use for production

## CI/CD Pipeline

### Triggering Manual Deployment

Deploy to production via GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      skip_validation:
        description: 'Skip pre-deployment validation'
        required: false
        default: false
        type: boolean

jobs:
  deploy:
    steps:
      - name: Validate Environment
        if: ${{ !inputs.skip_validation }}
        run: ./scripts/dev/verify-environment.sh production

      - name: Create Backup
        run: ./scripts/migration/backup.sh production

      - name: Deploy Migrations
        run: ./scripts/migration/deploy-safe.sh
```

**Trigger via GitHub UI:**
1. Go to Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Choose branch and options
5. Click "Run workflow" button

**Trigger via GitHub CLI:**
```bash
gh workflow run deploy.yml --ref main
```

### Reading Validation Reports

After deployment, check validation reports:

```bash
# Download artifacts from GitHub Actions
gh run download [run-id] --name validation-report

# View report
cat validation-report/deployment-validation.json | jq '.'
```

**Report Structure:**
```json
{
  "timestamp": "2025-01-26T14:30:00Z",
  "environment": "production",
  "status": "success",
  "checks": {
    "migrations": {
      "applied": 15,
      "pending": 0,
      "status": "✓"
    },
    "data_integrity": {
      "orphaned_records": 0,
      "invalid_references": 0,
      "status": "✓"
    },
    "record_counts": {
      "users": 25,
      "contacts": 150,
      "organizations": 50,
      "opportunities": 75
    },
    "triggers": {
      "active": ["sync_auth_users", "update_updated_at"],
      "missing": [],
      "status": "✓"
    }
  }
}
```

### Rollback Procedures

If deployment fails or causes issues:

#### Immediate Rollback (< 5 minutes)
```bash
# 1. Find latest backup
ls -la backups/production_*.sql | tail -1

# 2. Restore from backup
psql $DATABASE_URL < backups/production_2025_01_26_143022.sql

# 3. Verify restoration
./scripts/dev/verify-environment.sh production
```

#### Migration-Specific Rollback
```bash
# 1. List applied migrations
npx supabase migration list --db-url $DATABASE_URL

# 2. Create down migration
npx supabase migration new rollback_[migration_name]

# 3. Write rollback SQL
cat > supabase/migrations/[timestamp]_rollback_[migration_name].sql << EOF
-- Rollback changes from migration X
DROP TABLE IF EXISTS new_table;
ALTER TABLE existing_table DROP COLUMN new_column;
EOF

# 4. Apply rollback
npx supabase migration up --db-url $DATABASE_URL
```

#### Emergency Recovery
```bash
# If all else fails, contact Supabase support with:
echo "Project ID: $(cat .supabase/project-id)"
echo "Timestamp of issue: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Last successful backup: $(ls -la backups/ | grep production | tail -1)"

# Request point-in-time recovery from Supabase dashboard
```

### Monitoring Deployment Health

Post-deployment checks:

```bash
# 1. Check error logs
npx supabase logs --db-url $DATABASE_URL --since 1h

# 2. Monitor real-time metrics
watch -n 5 './scripts/dev/verify-environment.sh production --metrics'

# 3. Test critical user flows
npm run test:e2e:production

# 4. Check performance metrics
curl https://[your-project].supabase.co/rest/v1/ -H "apikey: $VITE_SUPABASE_ANON_KEY" -w "\nResponse time: %{time_total}s\n"
```

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [GitHub Actions Deployment](https://docs.github.com/en/actions/deployment/about-deployments)
- [Project Architecture Documentation](../../doc/developer/architecture-choices.md)
- [Testing Guide](../../.docs/testing/TESTING.md)