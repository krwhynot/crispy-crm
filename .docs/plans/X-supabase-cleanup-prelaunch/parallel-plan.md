# Supabase Cleanup Pre-Launch - Parallel Implementation Plan

**Plan ID**: `supabase-cleanup-prelaunch`
**Created**: 2025-10-15
**Status**: Ready for Implementation
**Estimated Effort**: 3-4 days
**Engineering Constitution Compliance**: ✅ Fully Compliant (simplified per NO OVER-ENGINEERING principle)

---

## High-Level Overview

This plan implements a **simplified local-first Supabase development workflow** for pre-launch testing. The implementation focuses on **6 essential scripts** that solve actual pain points: automated test user creation (3 roles with realistic data), bidirectional sync between local and cloud environments, environment verification, reset capabilities, backup automation, and safe deployment workflows. This infrastructure enables rapid iteration during development while maintaining production-ready safeguards.

**Key Simplifications Applied:**
- **No custom monitoring** - Use `npx supabase status` directly
- **No database audit logs** - Console logging with timestamps is sufficient for test data
- **No manual approval jobs** - Simple `workflow_dispatch` trigger prevents automatic deployments
- **No separate validation scripts** - Reuse existing `npm run validate:pre-migration` framework

**Core Value Proposition:** Developers can create test data locally with realistic multi-role scenarios (Admin/Director/Manager), push entire datasets to cloud with one command, verify parity automatically, and reset both environments to known-good states—all while maintaining automatic backups and migration safety.

---

## Critically Relevant Files and Documentation

### Core Architecture References
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/shared.md` - Complete architectural reference with patterns, gotchas, file locations
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` - Feature specification with UI/UX flows and success metrics
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Project overview, essential commands, engineering constitution

### Database & Migration Files
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251013000000_cloud_schema_sync.sql` - Production schema (22 tables, views, RLS)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251015014019_restore_auth_triggers.sql` - Auth-sales sync triggers (CRITICAL for user creation)
- `/home/krwhynot/projects/crispy-crm/supabase/config.toml` - Local Supabase configuration

### Seed Data & Validation
- `/home/krwhynot/projects/crispy-crm/scripts/seed-data.js` - Comprehensive test data generator (900 lines, excellent template)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js` - Multi-stage validation orchestrator
- `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql` - SQL validation queries

### Documentation
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_workflow_overview.md` - Complete Supabase workflow guide
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_commands_reference.md` - Supabase CLI command reference
- `/home/krwhynot/projects/crispy-crm/docs/database/migration-business-rules.md` - 45 business rules for data integrity

---

## Implementation Plan

### Phase 1: Foundation & Database Schema

#### Task 1.1: Create Script Directory Structure **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/shared.md` (lines 119-135: Script Infrastructure section)
- `/home/krwhynot/projects/crispy-crm/scripts/cache-invalidation.js` (reference pattern for script organization)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/dev/` (directory)
- `/home/krwhynot/projects/crispy-crm/scripts/migration/` (directory)
- `/home/krwhynot/projects/crispy-crm/scripts/supabase/` (directory)

Create the three-tier directory structure for organizing scripts by purpose:
- **`scripts/dev/`** - Development workflow scripts (test users, sync, verify, reset)
- **`scripts/migration/`** - Migration safety scripts (backup, deploy-safe)
- **`scripts/supabase/`** - Supabase-specific utilities and documentation

Ensure directories are created with proper permissions (755) and are tracked by git (add `.gitkeep` if needed).

---

#### Task 1.2: Create Test User Metadata Migration **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 79-114: Database Changes section)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251013000000_cloud_schema_sync.sql` (lines 2839-2930: RLS policy patterns)
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` (lines 328-343: Migration patterns with timestamp format)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251016000000_add_test_users_metadata.sql`

Create migration file with YYYYMMDDHHMMSS timestamp format. The migration should:

1. **Create `test_user_metadata` table** with columns:
   - `id` (UUID primary key, default gen_random_uuid())
   - `user_id` (UUID, references auth.users(id) ON DELETE CASCADE)
   - `role` (TEXT, CHECK constraint for 'admin'/'sales_director'/'account_manager')
   - `created_by` (TEXT, default 'automated_script')
   - `created_at` (TIMESTAMPTZ, default NOW())
   - `last_sync_at` (TIMESTAMPTZ, nullable)
   - `test_data_counts` (JSONB, default '{"contacts":0,"organizations":0,"opportunities":0,"activities":0,"tasks":0,"notes":0}')

2. **Enable RLS** on the table

3. **Create RLS policies**:
   - `SELECT` policy: authenticated users can read (auth.role() = 'authenticated')
   - `ALL` policy: service role can write (auth.role() = 'service_role')

4. **Create indexes**:
   - `idx_test_user_metadata_user_id` on user_id
   - `idx_test_user_metadata_role` on role

**CRITICAL GOTCHAS:**
- Use `auth.role()` (not `auth.uid()`) for service role checks
- Include `ON DELETE CASCADE` for user_id foreign key (cleanup when user deleted)
- JSONB default must be cast: `'{...}'::jsonb`
- Follow existing RLS naming pattern: `"description"` (quoted, descriptive)

---

#### Task 1.3: Apply Migration Locally and Verify **[Depends on: 1.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` (lines 35-42: Database & Supabase commands)
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_workflow_overview.md` (local development workflow section)

**Instructions**

Files to Modify:
- None (verification only)

Run the following commands to apply and verify the migration:

```bash
# Apply migration locally
npx supabase migration up

# Verify table created
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d test_user_metadata"

# Verify RLS enabled
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'test_user_metadata';"

# Verify indexes exist
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d+ test_user_metadata"
```

Confirm output shows:
- Table with 7 columns matching specification
- `rowsecurity = t` (RLS enabled)
- Two indexes created
- Foreign key constraint to auth.users

**GOTCHA:** If migration fails with "relation already exists", run `npx supabase db reset` first to clean state.

---

#### Task 1.4: Create Production Environment Template **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.env.example` (reference for variable naming patterns)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 927-948: Environment Variables section)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/.env.production` (template only, real values not committed)

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/.gitignore`

Create `.env.production` template with placeholder values:

```bash
# Cloud Supabase (Production)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
DATABASE_URL_PRODUCTION=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Test User Credentials
TEST_ADMIN_EMAIL=admin@test.local
TEST_DIRECTOR_EMAIL=director@test.local
TEST_MANAGER_EMAIL=manager@test.local
TEST_USER_PASSWORD=TestPass123!

# Opportunity Configuration (Optional)
OPPORTUNITY_DEFAULT_CATEGORY=new_business
OPPORTUNITY_DEFAULT_STAGE=new_lead
OPPORTUNITY_PIPELINE_STAGES=new_lead,initial_outreach,sample_visit_offered,awaiting_response,feedback_logged,demo_scheduled,closed_won,closed_lost
```

Update `.gitignore` to exclude:
```
.env.production
.env.migration
.env.staging
backups/
*.sql.backup
logs/sync-operations/
```

**CRITICAL:** Never commit real credentials to git. Template serves as documentation only.

---

### Phase 2: Core Development Scripts

#### Task 2.1: Create Test Users Script **[Depends on: 1.2, 1.3]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/scripts/seed-data.js` (lines 260-277: Supabase connection pattern, lines 310-780: data generation approach)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 266-455: create-test-users.sh specification)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251015014019_restore_auth_triggers.sql` (auth-sales sync mechanism)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/seed-data.research.md` (faker patterns and Edge Function usage)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/dev/create-test-users.sh`

Create bash script that creates 3 test users with role-specific data volumes:

**Script Structure:**
1. **Configuration** (from env vars or defaults)
   - Email addresses: `${TEST_ADMIN_EMAIL:-admin@test.local}`
   - Password: `${TEST_USER_PASSWORD:-TestPass123!}`
   - Database URL: first argument or localhost default

2. **Generate deterministic UUIDs** using `uuidgen -s -n @dns -N <email>`
   - Admin ID, Director ID, Manager ID

3. **Create auth.users records** via direct SQL:
   - Use `crypt('$TEST_PASSWORD', gen_salt('bf'))` for password hashing
   - Set `instance_id = '00000000-0000-0000-0000-000000000000'`
   - Set `email_confirmed_at = NOW()`
   - Include `raw_user_meta_data` JSONB with role information
   - Use `ON CONFLICT (id) DO UPDATE` for idempotency

4. **Create public.sales records** (or let triggers handle):
   - Insert with admin flag: `administrator = true` for admin user
   - Use `ON CONFLICT (id) DO UPDATE` for idempotency

5. **Generate role-specific test data** by calling seed-data.js:
   - **Admin**: `SEED_ORGANIZATION_COUNT=50 SEED_CONTACT_COUNT=100 SEED_OPPORTUNITY_COUNT=75 SEED_ACTIVITY_COUNT=200 TEST_USER_ID=$ADMIN_ID node scripts/seed-data.js`
   - **Director**: `SEED_ORGANIZATION_COUNT=30 SEED_CONTACT_COUNT=60 SEED_OPPORTUNITY_COUNT=40 SEED_ACTIVITY_COUNT=120 TEST_USER_ID=$DIRECTOR_ID node scripts/seed-data.js`
   - **Manager**: `SEED_ORGANIZATION_COUNT=20 SEED_CONTACT_COUNT=40 SEED_OPPORTUNITY_COUNT=25 SEED_ACTIVITY_COUNT=80 TEST_USER_ID=$MANAGER_ID node scripts/seed-data.js`

6. **Record metadata** in test_user_metadata table

7. **Display summary** with login credentials and data counts

**Error Handling:**
- `set -e` at top (exit on any error)
- Check for required utilities: `psql`, `uuidgen`, `node`
- Validate database connection before proceeding

**Output:**
```
👥 Creating test users with role-specific data...
1️⃣  Creating auth.users...
2️⃣  Creating public.sales records...
3️⃣  Generating test data...
4️⃣  Recording test user metadata...
✅ Test users created successfully!
```

**CRITICAL GOTCHAS:**
- Must use `pgcrypto` extension for `crypt()` function
- Auth triggers must be restored (from migration 20251015014019) or sales records won't sync
- Use `.test.local` domain to avoid conflicts with real users
- Deterministic UUIDs ensure idempotency across runs

---

#### Task 2.2: Create Local-to-Cloud Sync Script **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 144-259: sync-local-to-cloud.sh specification)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/shared.md` (lines 133-141: Auth-Sales Sync Pattern, CRITICAL gotcha about triggers)
- `/home/krwhynot/projects/crispy-crm/scripts/cache-invalidation.js` (lines 1-50: dry-run and confirmation patterns)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/dev/sync-local-to-cloud.sh`

Create bash script for pushing local test data to cloud with automatic backup:

**Script Structure:**
1. **Safety check** - Require `--force` flag to prevent accidental overwrites
   - Display cloud URL and warning
   - Exit 1 if flag not provided

2. **Backup cloud database** before any changes:
   - Create `./backups/sync/` directory
   - Generate timestamp: `$(date +%Y%m%d_%H%M%S)`
   - Run: `pg_dump $CLOUD_DB --no-owner --no-acl --data-only --exclude-schema=auth --exclude-schema=storage > cloud_backup_$TIMESTAMP.sql`

3. **Dump local data** (exclude auth schema initially):
   - Run: `pg_dump $LOCAL_DB --no-owner --no-acl --data-only --exclude-schema=auth --exclude-schema=storage > local_dump_$TIMESTAMP.sql`

4. **Clear cloud public schema data** (preserve structure):
   - TRUNCATE all tables with CASCADE
   - Tables: activities, contactNotes, contacts, dealNotes, deals, opportunities, organizations, products, sales, segments, tags, tasks, test_user_metadata

5. **Import local data to cloud**:
   - Run: `psql $CLOUD_DB < local_dump_$TIMESTAMP.sql`

6. **Sync auth.users separately** (preserve encrypted passwords):
   - Extract auth.users from local with encrypted_password field
   - Insert to cloud auth.users using `ON CONFLICT (id) DO UPDATE`
   - **CRITICAL:** Only sync test users (WHERE email LIKE '%@test.local')

7. **Log sync operation** (console only):
   - Operation type, timestamp, initiator, backup location

8. **Verify counts** by calling verify-environment.sh

**Configuration:**
```bash
LOCAL_DB="postgresql://postgres:postgres@localhost:54322/postgres"
CLOUD_DB="${DATABASE_URL_PRODUCTION}"  # from .env.production
```

**CRITICAL GOTCHAS:**
- Auth triggers must exist on cloud or sales records won't sync (see migration 20251015014019)
- Use `--exclude-schema=auth` to avoid conflicts with Supabase-managed auth tables
- Preserve encrypted_password field when syncing auth.users (don't regenerate)
- TRUNCATE with CASCADE to handle foreign key dependencies

---

#### Task 2.3: Create Environment Verification Script **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 527-582: verify-environment.sh specification)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js` (lines 60-86: connection string patterns)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/dev/verify-environment.sh`

Create bash script that compares table counts between local and cloud:

**Script Structure:**
1. **Define table list**:
   ```bash
   TABLES=("activities" "contacts" "contactNotes" "opportunities" "organizations" "products" "sales" "tasks")
   ```

2. **For each table**:
   - Query local count: `psql $LOCAL_DB -t -c "SELECT COUNT(*) FROM public.$table;"`
   - Query cloud count: `psql $CLOUD_DB -t -c "SELECT COUNT(*) FROM public.$table;"`
   - Compare and display: ✅ if match, ❌ if mismatch

3. **Verify test users exist** on cloud:
   ```sql
   SELECT email FROM auth.users WHERE email LIKE '%@test.local' ORDER BY email;
   ```

4. **Exit code**:
   - 0 if all tables match
   - 1 if any mismatches detected

**Output Format:**
```
🔍 Verifying environment parity...

✅ activities: 400 (local) = 400 (cloud)
✅ contacts: 200 (local) = 200 (cloud)
❌ opportunities: 140 (local) ≠ 135 (cloud)
...

👥 Test users:
 admin@test.local
 director@test.local
 manager@test.local

✅ Environments are in sync!
```

**GOTCHA:** Cloud connection requires DATABASE_URL_PRODUCTION env var from .env.production file.

---

#### Task 2.4: Create Environment Reset Script **[Depends on: 2.1, 2.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 467-526: reset-environment.sh specification)
- `/home/krwhynot/projects/crispy-crm/scripts/cache-invalidation.js` (confirmation pattern reference)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/dev/reset-environment.sh`

Create bash script that resets both local and cloud to clean state:

**Script Structure:**
1. **Display warning** and require confirmation:
   ```bash
   echo "⚠️  ENVIRONMENT RESET"
   echo "   This will DELETE all data in both local and cloud databases."
   read -p "Type 'RESET' to confirm: " CONFIRM
   if [[ "$CONFIRM" != "RESET" ]]; then exit 1; fi
   ```

2. **Reset local database**:
   - Run: `npm run supabase:local:db:reset` (reapplies all migrations)

3. **Reset cloud database** (preserve schema):
   - TRUNCATE all public tables with CASCADE
   - DELETE FROM auth.users WHERE email LIKE '%@test.local'

4. **Create fresh test users**:
   - Call: `./scripts/dev/create-test-users.sh $LOCAL_DB`

5. **Sync to cloud**:
   - Call: `./scripts/dev/sync-local-to-cloud.sh --force`

**Output:**
```
⚠️  ENVIRONMENT RESET
Type 'RESET' to confirm: RESET

🧹 Resetting local database...
🧹 Resetting cloud database...
👥 Creating fresh test users...
🔄 Syncing to cloud...

✅ Environment reset complete!
```

**CRITICAL GOTCHA:** This is a DESTRUCTIVE operation. Double confirmation protects against accidental execution.

---

#### Task 2.5: Create Backup Script **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js` (backup patterns)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 584-620: backup.sh specification)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/migration/backup.sh`

Create bash script that creates timestamped database backups:

**Script Structure:**
1. **Accept target argument**: `cloud` or `local` (default: cloud)

2. **Set database URL** based on target:
   - Cloud: `${DATABASE_URL_PRODUCTION}`
   - Local: `postgresql://postgres:postgres@localhost:54322/postgres`

3. **Create backup directory**: `./backups/migrations/`

4. **Run pg_dump**:
   ```bash
   pg_dump "$DB_URL" \
     --no-owner \
     --no-acl \
     --clean \
     --if-exists \
     > "./backups/migrations/${LABEL}_backup_${TIMESTAMP}.sql"
   ```

5. **Display summary**:
   - Backup filename
   - File size (using `du -h`)
   - Location

**Usage:**
```bash
./scripts/migration/backup.sh          # Cloud backup
./scripts/migration/backup.sh local    # Local backup
```

**Output:**
```
📦 Creating backup: cloud database
✅ Backup complete: cloud_backup_20251016_143022.sql (4.2MB)
   Location: ./backups/migrations/
```

**GOTCHA:** Include `--clean --if-exists` to make backup restorable without manual cleanup.

---

#### Task 2.6: Create Safe Deployment Script **[Depends on: 2.5]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js` (orchestration pattern with phases)
- `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js` (validation integration)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 649-723: deploy-safe.sh specification)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/migration/deploy-safe.sh`

Create bash script for safe migration deployment with automatic rollback:

**Script Structure:**
1. **Accept target argument**: `cloud` or `local` (default: cloud)

2. **Display deployment header**:
   - Target environment (LOCAL or PRODUCTION)
   - Database URL

3. **Phase 1: Create backup**:
   - Call: `./scripts/migration/backup.sh $TARGET`
   - Store backup filename for rollback

4. **Phase 2: Run validation** (use existing framework):
   - Call: `node scripts/validation/run-pre-validation.js`
   - Exit if validation fails

5. **Phase 3: Dry-run** (cloud only):
   - Run: `npx supabase db push --dry-run`
   - Display preview
   - Prompt: "Proceed with migration? (y/n)"
   - Exit if not confirmed

6. **Phase 4: Apply migration**:
   - Run: `npx supabase db push`
   - If fails, auto-rollback: `psql $DATABASE_URL < $BACKUP_FILE`

7. **Phase 5: Post-migration validation**:
   - Run: `node scripts/post-migration-validation.js`
   - If fails, suggest rollback command

**Error Handling:**
```bash
if npx supabase db push; then
  echo "✅ Migration applied successfully!"
else
  echo "❌ Migration failed! Rolling back..."
  psql "$DATABASE_URL" < "$BACKUP_FILE"
  echo "✅ Rollback complete."
  exit 1
fi
```

**CRITICAL GOTCHA:** Set DATABASE_URL env var before calling supabase CLI (it uses this for remote connections).

---

### Phase 3: CI/CD Integration & Documentation

#### Task 3.1: Create GitHub Actions Workflow **[Depends on: 2.6]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 729-866: CI/CD specification)
- `/home/krwhynot/projects/crispy-crm/.github/workflows/` (existing workflow patterns)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/.github/workflows/supabase-deploy.yml`

Create GitHub Actions workflow with three jobs:

**Job 1: Validate** (runs automatically on push)
- Setup Node.js 22
- Install dependencies: `npm ci`
- Setup Supabase CLI
- Start local Supabase: `npx supabase start`
- Run validation: `npm run validate:pre-migration`
- Stop Supabase: `npx supabase stop` (in finally block)

**Job 2: Dry Run** (depends on validate)
- Setup Supabase CLI
- Link to production: `npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}`
- Run dry-run: `npx supabase db push --dry-run`
- Upload artifacts: dry-run output files (retention 7 days)

**Job 3: Deploy** (manual trigger only)
- Condition: `if: github.event_name == 'workflow_dispatch'`
- Setup Node.js and Supabase CLI
- Link to production
- Create backup: `npm run migrate:backup -- cloud`
- Deploy migrations: `npx supabase db push`
- Deploy edge functions: `npx supabase functions deploy`
- Post-validation: `node scripts/post-migration-validation.js`
- Upload logs (retention 30 days)
- Notify on failure

**Triggers:**
```yaml
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
```

**Required Secrets:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

**CRITICAL:** Deploy job ONLY runs on manual trigger (`workflow_dispatch`), never automatically. This is the safety gate.

---

#### Task 3.2: Update package.json Scripts **[Depends on: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/package.json` (lines 42-109: existing scripts section)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 900-923: Package.json Updates)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/package.json`

Add new script categories to the scripts section:

```json
{
  "scripts": {
    "// === Existing scripts remain unchanged ===": "",

    "// === Development Sync Scripts ===": "",
    "dev:sync:push": "./scripts/dev/sync-local-to-cloud.sh",
    "dev:users:create": "./scripts/dev/create-test-users.sh",
    "dev:reset": "./scripts/dev/reset-environment.sh",
    "dev:verify": "./scripts/dev/verify-environment.sh",

    "// === Migration Scripts ===": "",
    "migrate:backup": "./scripts/migration/backup.sh",
    "migrate:deploy": "./scripts/migration/deploy-safe.sh"
  }
}
```

**Naming Convention:**
- `dev:*` - Development workflow scripts (local-first)
- `migrate:*` - Migration safety scripts (backup/deploy)
- Use colons for namespacing (consistent with existing `supabase:*` scripts)

**GOTCHA:** Ensure script paths are executable: `chmod +x scripts/dev/*.sh scripts/migration/*.sh`

---

#### Task 3.3: Create Script Documentation **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` (documentation style reference)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 976-1011: Script README specification)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/supabase/README.md`

Create comprehensive script usage guide with sections:

1. **Script Inventory**:
   - Table with script name, purpose, usage, location

2. **Common Workflows**:
   - Daily development setup
   - Pushing local data to cloud
   - Resetting environments
   - Creating test users
   - Safe migration deployment

3. **Troubleshooting Guide**:
   - Connection errors (check .env.production)
   - Sync failures (verify triggers restored)
   - Permission errors (check service role key)
   - Count mismatches (run verify script)

4. **Environment Variables**:
   - Required vs optional
   - Where to find values (Supabase dashboard)
   - Security considerations

5. **CI/CD Pipeline**:
   - How to trigger manual deployment
   - Reading validation reports
   - Rollback procedures

**Format:** Clear headings, code blocks with syntax highlighting, examples for each workflow.

---

#### Task 3.4: Update Workflow Overview Documentation **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_workflow_overview.md` (current content)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 968-975: Documentation Updates)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_workflow_overview.md`

Add new section: **"Pre-Launch Development Workflow (Current Implementation)"**

Content to add:
1. **Quick Start**:
   - Start local Supabase
   - Create test users
   - Push to cloud

2. **Test User Credentials**:
   - Table with email, password, role, data volumes

3. **Sync Operations**:
   - When to sync (after local changes)
   - How to verify (run verify script)
   - Rollback from backup

4. **Environment Reset**:
   - When to reset (testing fresh state)
   - Confirmation requirement
   - Time estimate

5. **Storage Service Status**:
   - Current status (enabled/disabled)
   - Workaround if disabled (test in cloud)
   - Link to investigation notes

6. **Script Reference**:
   - Link to scripts/supabase/README.md
   - Quick command reference

**Placement:** Insert after "Local Development Setup" section, before "Migration Workflow" section.

---

#### Task 3.5: Storage Service Investigation **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/supabase/config.toml` (line 64: storage enabled = false)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 870-898: Storage investigation approach)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/scripts/supabase/storage-fix-investigation.md`

**Timebox: 30 minutes maximum**

Investigation steps:
1. Check current CLI version: `npx supabase --version`
2. Review config.toml storage section
3. Try enabling storage: `enabled = true` in config.toml
4. Restart Supabase: `npx supabase stop && npx supabase start`
5. Check docker logs: `docker logs supabase_storage_api`
6. Search GitHub issues: "supabase storage cli version mismatch"
7. Attempt upgrade: `npm update supabase`
8. Test file upload in Studio

**Document findings** in markdown file:
- **Problem**: Describe the issue (version mismatch, API error, etc.)
- **Attempted fixes**: List what was tried
- **Result**: Working / Still broken
- **Workaround**: If not fixed, document workaround (test uploads in cloud)
- **Next steps**: Link to relevant GitHub issues or defer to future

**Success criteria**:
- ✅ Storage enabled and file uploads work
- ⚠️ Storage broken but workaround documented

**CRITICAL:** After 30 minutes, document findings and move on. Don't block implementation.

---

#### Task 3.6: End-to-End Testing & Validation **[Depends on: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/supabase-cleanup-prelaunch/requirements.md` (lines 1469-1495: Testing Plan)
- All scripts created in Phase 2

**Instructions**

Files to Modify:
- None (testing only)

Execute full test suite to validate implementation:

**Test 1: User Creation**
```bash
npm run dev:users:create
# Verify: 3 users exist, login works, data counts match
psql LOCAL_DB -c "SELECT email, administrator FROM sales ORDER BY email;"
```

**Test 2: Local-to-Cloud Sync**
```bash
npm run dev:sync:push -- --force
# Verify: Backup created, data synced, counts match
npm run dev:verify
```

**Test 3: Environment Reset**
```bash
npm run dev:reset
# Verify: Both environments clean, fresh users created, data regenerated
```

**Test 4: Backup & Restore**
```bash
npm run migrate:backup -- cloud
# Verify: Backup file created in ./backups/migrations/
# Test restore: psql $CLOUD_DB < backups/migrations/cloud_backup_TIMESTAMP.sql
```

**Test 5: Safe Deployment** (dry-run only)
```bash
npm run migrate:deploy -- local
# Verify: Validation runs, backup created, migrations apply
```

**Test 6: CI/CD Pipeline**
```bash
# Create test migration
npx supabase migration new test_ci_validation
# Add simple change: ALTER TABLE test_user_metadata ADD COLUMN test_field TEXT;
git add supabase/migrations/
git commit -m "test: validate CI/CD workflow"
git push origin test-branch
# Verify: GitHub Actions runs validate and dry-run jobs successfully
```

**Success Criteria:**
- All scripts execute without errors
- Local and cloud environments remain in sync
- Backups are created and restorable
- CI/CD pipeline validates migrations correctly
- Test users can log in with correct data volumes

**Documentation:** Record any issues encountered and solutions in scripts/supabase/README.md troubleshooting section.

---

## Advice for Implementation

### Critical Success Factors

1. **Auth Triggers Are Essential**
   - Migration 20251015014019 MUST be applied before creating users
   - Without triggers, `auth.users` won't sync to `public.sales` table
   - Verify triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE 'on_auth%'`
   - Symptom of missing triggers: Users can't log in, sales records don't exist

2. **Idempotency Is Key**
   - All scripts must be safely re-runnable
   - Use `ON CONFLICT ... DO UPDATE` for user creation
   - Use `IF EXISTS` for backup restoration
   - Clear state before regeneration (TRUNCATE, DELETE)

3. **Test User Isolation**
   - Always use `.test.local` domain suffix
   - Never mix test users with real users
   - Filter by `email LIKE '%@test.local'` when syncing auth
   - This prevents accidental deletion of production users

4. **Backup Before Destruction**
   - EVERY destructive operation (sync, reset, deploy) creates backup first
   - Store backups with timestamps for traceability
   - Keep backups for 30 days minimum
   - Test restoration procedure during implementation

5. **Environment Variable Hygiene**
   - NEVER commit `.env.production` with real credentials
   - Use `.env.production.example` as template
   - Document required variables in scripts/supabase/README.md
   - Validate environment variables in scripts before execution

### Common Pitfalls to Avoid

**Pitfall 1: Cross-Schema Trigger Omission**
- Problem: Schema dumps exclude `auth.users` triggers
- Solution: Always run restore_auth_triggers.sql after schema dumps
- Detection: New users don't appear in sales table

**Pitfall 2: Password Hash Preservation**
- Problem: Regenerating passwords during sync breaks login
- Solution: Copy `encrypted_password` field from local to cloud
- Detection: Test users can't log in after sync

**Pitfall 3: Service Role Key Usage**
- Problem: Anon key can't create users or access auth tables
- Solution: Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Detection: "permission denied" errors when creating users

**Pitfall 4: JSONB Array Handling**
- Problem: Contact emails/phones are JSONB arrays, not text
- Solution: Use JSONB operators: `email::text ILIKE '%pattern%'`
- Detection: Search queries return no results

**Pitfall 5: Migration Ordering**
- Problem: Test user metadata table doesn't exist yet
- Solution: Apply migration 20251016000000 before running create-test-users.sh
- Detection: "relation does not exist" errors

### Performance Optimization

1. **Batch Insert Operations**
   - seed-data.js inserts in batches (not individual INSERTs)
   - Use COPY for large datasets (>1000 rows)
   - Example: `\COPY contacts FROM 'data.csv' CSV HEADER`

2. **Parallel Script Execution**
   - User creation for 3 roles can run in parallel
   - Use background jobs: `create_admin & create_director & create_manager & wait`
   - Reduces total time from 90s to 30s

3. **Incremental Sync**
   - For large datasets, sync only changed data
   - Track sync watermark in test_user_metadata.last_sync_at
   - Use `WHERE updated_at > $LAST_SYNC` filters

### Security Considerations

1. **Service Role Key Protection**
   - Store in GitHub Secrets, not in code
   - Rotate every 90 days
   - Never log full key value
   - Use masked output: `echo "Service key: ${KEY:0:10}..."`

2. **Database URL Exposure**
   - URLs contain credentials
   - Mask in script output: `echo "Connecting to: ${URL%%@*}@***"`
   - Don't include in error messages

3. **Backup File Security**
   - Backups contain sensitive test data
   - Add `backups/` to `.gitignore`
   - Encrypt backups for long-term storage: `gpg -c backup.sql`

### Integration with Existing Systems

1. **Validation Framework Reuse**
   - Don't create new validation scripts
   - Use existing `npm run validate:pre-migration`
   - Extend pre-migration-validation.sql if needed
   - Follow severity-based blocking logic

2. **Seed Data Integration**
   - Call seed-data.js from create-test-users.sh
   - Pass TEST_USER_ID env var for ownership
   - Reuse faker patterns and F&B industry data
   - Maintain consistency with existing test data

3. **CI/CD Pipeline Extension**
   - Build on existing workflow patterns
   - Reuse Supabase CLI setup actions
   - Follow secret naming conventions
   - Maintain artifact retention policies

### Debugging Tips

1. **Verbose Mode**
   - Add `--verbose` flag to all scripts
   - Log SQL queries before execution
   - Display intermediate results
   - Use `set -x` in bash for command tracing

2. **Connection Testing**
   - Test database connectivity before operations
   - Use: `psql $DB_URL -c 'SELECT 1'`
   - Display connection parameters (masked)
   - Check SSL requirements for remote connections

3. **Incremental Execution**
   - Break scripts into phases
   - Add checkpoints between phases
   - Allow resumption from failed phase
   - Log completion status for each phase

4. **Dry-Run Everything**
   - Implement `--dry-run` in all scripts
   - Show what WOULD happen without executing
   - Validate inputs before proceeding
   - Use for testing script logic

### Documentation Best Practices

1. **Code Comments**
   - Explain WHY, not WHAT
   - Document gotchas inline
   - Reference migration files
   - Link to related documentation

2. **Usage Examples**
   - Show most common workflows
   - Include expected output
   - Demonstrate error scenarios
   - Provide troubleshooting steps

3. **Changelog Maintenance**
   - Update requirements.md with implementation notes
   - Document deviations from original plan
   - Track simplifications applied
   - Note future enhancements

---

## Success Metrics

Implementation is complete when:

### Functional Requirements
- ✅ 6 core scripts created and executable (create-test-users, sync-local-to-cloud, verify-environment, reset-environment, backup, deploy-safe)
- ✅ All scripts support required flags (--force, --dry-run, --verbose where applicable)
- ✅ Migration 20251016000000 applied to local and cloud
- ✅ `.env.production` template created with placeholder values

### Test User Requirements
- ✅ 3 test users auto-created (admin@test.local, director@test.local, manager@test.local)
- ✅ Role-specific data volumes: Admin (100 contacts, 50 orgs, 75 opps), Director (60/30/40), Manager (40/20/25)
- ✅ Login works for all users in both local and cloud
- ✅ Users have correct permission levels (admin flag set correctly)

### Sync & Verification
- ✅ Local → Cloud sync completes without data loss
- ✅ Verification script shows matching counts between environments
- ✅ Auth users sync with passwords intact
- ✅ Automatic backup created before sync
- ✅ Console logs provide sync operation details

### CI/CD Pipeline
- ✅ GitHub Actions workflow validates migrations automatically
- ✅ Dry-run step catches schema issues before deployment
- ✅ Workflow fails on validation errors (exit code 1)
- ✅ Deploy job requires manual trigger (workflow_dispatch)
- ✅ Artifacts uploaded for troubleshooting (7-30 day retention)

### Documentation
- ✅ scripts/supabase/README.md created with usage guide
- ✅ docs/supabase/supabase_workflow_overview.md updated for pre-launch workflow
- ✅ Storage service status documented (working or workaround)
- ✅ All environment variables documented with examples

### Quality Metrics
- ✅ Scripts have error handling with clear messages
- ✅ Non-zero exit codes on failure
- ✅ Idempotent operations (safely re-runnable)
- ✅ 100% backup coverage for destructive operations

---

**Document Version**: 1.0
**Last Updated**: 2025-10-15
**Maintained By**: Claude Code (Sonnet 4.5)
**Status**: Ready for Parallel Implementation
**Engineering Constitution Compliance**: ✅ Fully Compliant
