# Validation Framework and Migration Patterns Research

Comprehensive analysis of validation framework, migration patterns, database schema management, and Supabase CLI integration in the Atomic CRM codebase.

## Overview

The Atomic CRM project has a **comprehensive, production-ready validation and migration framework** designed to ensure data integrity and safety during database migrations. The framework enforces a <1% data warning threshold (99% quality score required) and implements automated go/no-go decision logic. The system integrates validation at multiple stages: pre-migration checks, migration execution with state tracking, and post-migration verification.

**Key Findings:**
- Multi-stage validation framework with severity-based blocking logic (CRITICAL/HIGH/MEDIUM/LOW)
- SQL-based pre-migration validation with automatic backup creation
- JavaScript-based validation modules for complex data quality checks
- Production-grade migration orchestration with checkpoint/rollback capabilities
- Integration with Supabase CLI for schema management
- CI/CD foundation exists but migrations are not yet automated

## Relevant Files

### Pre-Migration Validation Scripts
- `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js` - Orchestrates pre-migration validation, executes SQL checks, generates JSON reports
- `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql` - SQL-based validation checks with 7 validation sections
- `/home/krwhynot/projects/crispy-crm/scripts/validation/capture-current-state.sql` - Database state capture for rollback safety
- `/home/krwhynot/projects/crispy-crm/scripts/validation/go-no-go.js` - Automated migration decision logic with confidence scoring
- `/home/krwhynot/projects/crispy-crm/scripts/validation/referential-integrity.js` - Foreign key validation with orphan detection
- `/home/krwhynot/projects/crispy-crm/scripts/validation/unique-constraints.js` - Duplicate detection and conflict resolution
- `/home/krwhynot/projects/crispy-crm/scripts/validation/required-fields.js` - Completeness checks for required fields
- `/home/krwhynot/projects/crispy-crm/scripts/validation/data-quality.js` - Data quality scoring with weighted metrics
- `/home/krwhynot/projects/crispy-crm/scripts/validation/test-validation-framework.js` - Test suite for validation framework

### Migration Execution & Orchestration
- `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js` - Production migration orchestrator with 10 phases, user confirmations, and state tracking
- `/home/krwhynot/projects/crispy-crm/scripts/post-migration-validation.js` - Post-migration verification with multiple validation phases
- `/home/krwhynot/projects/crispy-crm/scripts/validation/VALIDATION_FRAMEWORK_SUMMARY.md` - Documentation of validation framework implementation
- `/home/krwhynot/projects/crispy-crm/scripts/validation/TASK_5_1A_SUMMARY.md` - Task completion summary for validation framework

### Migration SQL Files
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251013000000_cloud_schema_sync.sql` - Large cloud schema sync migration (110KB)
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/20251015014019_restore_auth_triggers.sql` - Auth trigger restoration
- `/home/krwhynot/projects/crispy-crm/supabase/migrations/RECONCILIATION_SUMMARY.md` - Migration reconciliation documentation

### Business Rules & Documentation
- `/home/krwhynot/projects/crispy-crm/docs/database/migration-business-rules.md` - 45 business rules clarifying migration requirements
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_workflow_overview.md` - Complete Supabase workflow guide (local to cloud)
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_commands_reference.md` - Comprehensive Supabase CLI command reference
- `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_troubleshooting.md` - Supabase troubleshooting guide

### Configuration & CI/CD
- `/home/krwhynot/projects/crispy-crm/supabase/config.toml` - Local Supabase configuration (ports, auth, API settings)
- `/home/krwhynot/projects/crispy-crm/.github/workflows/check.yml` - Build check workflow (active)
- `/home/krwhynot/projects/crispy-crm/.github/workflows/supabase-deploy.yml.disabled` - Supabase deployment workflow (disabled)
- `/home/krwhynot/projects/crispy-crm/package.json` - NPM scripts for migration/validation operations
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Project overview with migration patterns

## Architectural Patterns

### 1. Multi-Stage Validation Architecture
**Pattern**: Validation separated into three distinct stages with different validation techniques
- **Pre-Migration SQL Validation**: Database-native checks using PostgreSQL queries (7 validation sections)
- **Pre-Migration JavaScript Validation**: Complex business logic validation with external API integration
- **Post-Migration Verification**: Comprehensive validation after migration execution

**Example at `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql`:**
```sql
-- 7 Validation Sections:
-- 1. Data Count Verification (entity counts)
-- 2. Orphaned Records Check (broken relationships)
-- 3. Foreign Key Integrity (contact/company references)
-- 4. Required Fields (sector, stage validation)
-- 5. Data Quality Assessment (duplicates, invalid formats)
-- 6. Disk Space Check (backup space requirements)
-- 7. Backup Creation (automatic pre-migration backups)
```

### 2. Severity-Based Blocking Logic
**Pattern**: Four-tier severity system with automated decision thresholds
- **CRITICAL**: Blocks migration immediately (e.g., broken foreign keys)
- **HIGH**: Blocks if count exceeds threshold (e.g., >5 unique constraint violations)
- **MEDIUM**: Warning only, migration can proceed with caution
- **LOW**: Informational, no impact on migration decision

**Implementation at `/home/krwhynot/projects/crispy-crm/scripts/validation/go-no-go.js`:**
```javascript
criticalBlockers: {
  referentialIntegrity: { maxCritical: 0, maxHigh: 0 },
  uniqueConstraints: { maxCritical: 0, maxHigh: 5 },
  requiredFields: { maxCritical: 0, maxHigh: 10 }
}
```

### 3. State Management & Checkpoint System
**Pattern**: Migration state tracked in JSON with phase-level checkpoints and rollback capability
- Tracks completed phases to allow resume after failure
- Records errors and warnings for audit trail
- Supports dry-run mode for testing without changes

**Example at `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js`:**
```javascript
state = {
  startedAt: timestamp,
  completedPhases: [{ id, completedAt }],
  currentPhase: "phase_1_1",
  lastCheckpoint: timestamp,
  errors: [{ timestamp, phase, error }],
  warnings: [{ timestamp, phase, warning }]
}
```

### 4. Validation Results Storage Pattern
**Pattern**: Database table for storing validation results with run ID tracking
```sql
CREATE TABLE migration_validation_results (
    id SERIAL PRIMARY KEY,
    validation_run_id UUID,
    check_type TEXT,
    entity_name TEXT,
    count_value BIGINT,
    percentage DECIMAL(5,2),
    status TEXT CHECK (status IN ('PASS', 'WARN', 'FAIL')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Backup-Before-Migration Pattern
**Pattern**: Automatic backup table creation as part of validation process
- Creates `backup_{table}_pre_migration` tables
- Validates backup creation success before proceeding
- Adds metadata column (`backup_created_at`) to backups

**Example at `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql:373-411`:**
```sql
CREATE TABLE backup_deals_pre_migration AS SELECT * FROM deals;
ALTER TABLE backup_deals_pre_migration
ADD COLUMN backup_created_at TIMESTAMPTZ DEFAULT NOW();
```

### 6. Migration Phase Orchestration
**Pattern**: 10-phase migration execution with critical flags and user confirmations
```javascript
MIGRATION_PHASES = [
  { id: "backup", critical: true, script: "migration-backup.js" },
  { id: "validation", critical: true, script: "migration-dry-run.js" },
  { id: "phase_1_1_fix", critical: true, file: "001_phase_1_1_foundation_setup_RLS_FIX.sql" },
  { id: "phase_1_1", critical: true, file: "001_phase_1_1_foundation_setup.sql" },
  // ... 6 more phases
]
```

### 7. Dual Validation Approach (SQL + JavaScript)
**Pattern**: SQL for database-native checks, JavaScript for complex business logic
- **SQL Validation**: Faster, closer to data, leverages PostgreSQL features
- **JavaScript Validation**: Complex calculations, external API integration, business rule enforcement

### 8. Supabase CLI Integration Pattern
**Pattern**: Use Supabase CLI for schema management, not runtime migrations
- Migrations stored in `/home/krwhynot/projects/crispy-crm/supabase/migrations/`
- Apply via `npx supabase db push` or `npx supabase db reset`
- Migration naming convention: `YYYYMMDDHHMMSS_descriptive_name.sql`

## Migration Workflow Details

### Step 1: Pre-Migration Validation
**Entry Point**: `npm run validate:pre-migration`
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js`

**Process Flow**:
1. Create database client connection
2. Execute SQL validation file (`pre-migration-validation.sql`)
3. Capture current database state (`capture-current-state.sql`)
4. Retrieve validation results from `migration_validation_results` table
5. Generate JSON report in `/home/krwhynot/projects/crispy-crm/logs/pre-migration-validation.json`
6. Display results with color-coded status (PASS/WARN/FAIL)
7. Exit with code 1 if any FAIL status detected

**Validation Sections**:
1. **Entity Counts**: Verify deals, contacts, companies exist
2. **Orphaned Records**: Check for contacts/deals without valid company references
3. **Foreign Key Integrity**: Validate broken contact references in deals, tag references
4. **Required Fields**: Ensure companies have sector, deals have stage
5. **Data Quality**: Check duplicate company names, invalid email formats
6. **Disk Space**: Verify sufficient space for backups (2x database size)
7. **Backup Creation**: Auto-create `backup_*_pre_migration` tables

**Go/No-Go Decision Logic**:
- **GO**: 0 failures, ≤2 warnings
- **CAUTION**: 0 failures, ≤5 warnings
- **NO-GO**: Any failures OR >5 warnings

### Step 2: Go/No-Go Assessment
**Entry Point**: Direct import or `node scripts/validation/go-no-go.js`
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/validation/go-no-go.js`

**Evaluation Criteria**:
- **Critical Blockers**: Max 0 critical violations for referential integrity
- **Warning Thresholds**: Data quality must be ≥99% (< 1% warnings)
- **System Readiness**: Database connection, disk space, backup status, migration scripts
- **Confidence Scoring**: 100 base score, reduced by violations (25 per blocker, 5 per warning)

**Decision Recommendations**:
- **GO**: No blockers, no warnings, confidence ≥80%
- **PROCEED_WITH_CAUTION**: No blockers, some warnings, confidence 60-80%
- **DELAY**: High-severity violations but no critical blockers
- **BLOCK**: Critical violations or system readiness failures

**Report Output**: JSON file in `/tmp/migration-go-no-go-{timestamp}.json`

### Step 3: Production Migration Execution
**Entry Point**: `npm run migrate:production`
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js`

**Execution Flow**:
1. Load previous state from `/home/krwhynot/projects/crispy-crm/logs/migration-state.json`
2. Display migration plan (10 phases with critical flags)
3. Request user confirmation with prerequisite checklist
4. Verify prerequisites (files exist, database connection)
5. Execute each phase sequentially (skipping completed phases)
6. Log all actions to `/home/krwhynot/projects/crispy-crm/logs/migration.log`
7. Update state file after each phase completion
8. Handle errors with automatic rollback recommendation

**Phase Types**:
- **Script Execution**: Run JavaScript file via Node.js (e.g., `migration-backup.js`)
- **SQL Execution**: Parse and execute SQL file statements (with basic transaction handling)

**Safety Mechanisms**:
- User confirmation required before execution
- State persistence allows resume after failure
- Critical phase failures trigger immediate halt
- Optional phase failures allow continuation

### Step 4: Post-Migration Validation
**Entry Point**: `npm run migrate:validate`
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/post-migration-validation.js`

**Validation Phases**:
1. **Opportunities Migration**: Verify opportunities table exists, count records, check new columns
2. **Contact-Organizations Migration**: Verify junction table, validate data migration
3. **Views Validation**: Check all summary views are accessible (opportunities_summary, deals_summary, etc.)
4. **RLS Policies**: Test authenticated access, verify opportunityNotes renamed
5. **Data Integrity**: Check for orphaned records, verify migration history table

**Report Output**: Console output with ✅/⚠️/❌ status indicators, exit code 0/1

### Step 5: Migration Naming & Conventions

**Migration File Naming**:
- Format: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Example: `20251013000000_cloud_schema_sync.sql`
- Timestamp ensures chronological ordering
- Descriptive name explains purpose (snake_case)

**Migration Content Conventions**:
- Always include comments explaining purpose
- Use transactions for related changes
- Add rollback instructions as comments
- Test locally before pushing to remote

## Edge Cases & Gotchas

### 1. SQL Statement Parsing Limitation
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js:293-349`

**Issue**: The JavaScript-based SQL executor splits statements by `;` and executes individually, which doesn't handle:
- Multi-line strings with semicolons
- Complex stored procedures
- Transaction blocks

**Workaround**: Production migrations should use Supabase CLI directly (`npx supabase db push`) rather than JavaScript executor

**Evidence**: Comments in code suggest using alternative approaches:
```javascript
// Note: For actual production use, you should use one of these approaches:
// 1. Supabase CLI: `supabase db push` or `supabase db execute`
// 2. Direct PostgreSQL connection with pg library
// 3. Create a stored procedure in Supabase with SECURITY DEFINER
```

### 2. Storage API Disabled in Local Config
**Location**: `/home/krwhynot/projects/crispy-crm/supabase/config.toml:64`

**Issue**: Storage API disabled due to CLI/Storage API version mismatch
```toml
[storage]
enabled = false  # Temporarily disabled due to CLI/Storage API version mismatch
```

**Impact**: File upload features won't work in local development
**Resolution**: Update Supabase CLI or use remote storage API

### 3. Migration State Persistence Gotcha
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/migrate-production.js:161-223`

**Issue**: Migration state stored in `/home/krwhynot/projects/crispy-crm/logs/migration-state.json` persists across runs
- If a phase is marked complete but actually failed, re-running will skip it
- Manual state file editing required to retry failed phases
- No automatic cleanup of stale state files

**Mitigation**: Always review state file before production migration, delete if starting fresh

### 4. Validation Run ID Session-Scoped
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql:23-29`

**Issue**: Validation run ID stored in PostgreSQL session config
```sql
PERFORM set_config('migration.validation_run_id', current_run_id::text, false);
```
**Gotcha**: If SQL file executed in separate transactions, run ID may be lost
**Impact**: Results may not be properly grouped by validation run

### 5. Email Validation Regex Too Strict
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql:325`

**Issue**: Email regex doesn't handle all valid RFC 5322 addresses
```sql
WHERE (email_obj->>'email') !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
```
**Limitation**: Rejects international domains, long TLDs, special characters in local part

### 6. Backup Table Metadata Column
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/validation/pre-migration-validation.sql:383-384`

**Gotcha**: `backup_created_at` column added to backup tables changes schema
```sql
ALTER TABLE backup_deals_pre_migration
ADD COLUMN backup_created_at TIMESTAMPTZ DEFAULT NOW();
```
**Impact**: Cannot do simple `SELECT * FROM backup_deals_pre_migration` to restore
**Workaround**: Exclude `backup_created_at` column when restoring:
```sql
INSERT INTO deals SELECT id, name, stage, ... FROM backup_deals_pre_migration;
```

### 7. CI/CD Workflows Disabled
**Location**: `/home/krwhynot/projects/crispy-crm/.github/workflows/supabase-deploy.yml.disabled`

**Issue**: Supabase deployment workflow exists but disabled (`.disabled` extension)
**Reason**: Likely requires secrets configuration or manual deployment preferred
**Impact**: Migrations must be deployed manually via CLI

### 8. JavaScript Validation Module Uses ES Modules
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/validation/go-no-go.js:8-13`

**Gotcha**: Validators use ES module imports but main orchestrator uses CommonJS
```javascript
import { createClient } from "@supabase/supabase-js";
import { ReferentialIntegrityValidator } from "./referential-integrity.js";
```
**Evidence**: Package.json has `"type": "module"` at root level
**Impact**: Mixed module system may cause import issues in some environments

### 9. Database Version Dependency
**Location**: `/home/krwhynot/projects/crispy-crm/supabase/config.toml:25`

**Critical**: Local database must match remote PostgreSQL version
```toml
major_version = 15
```
**Gotcha**: If remote upgraded to PG 16, migrations tested locally on PG 15 may behave differently
**Mitigation**: Always check remote version before migration: `SHOW server_version;`

### 10. Dry-Run Mode Limited Scope
**Location**: `/home/krwhynot/projects/crispy-crm/scripts/validation/run-pre-validation.js:112-114`

**Issue**: Dry-run mode skips SQL execution but doesn't simulate results
```javascript
if (this.isDryRun) {
  log.warning("DRY RUN - Would execute SQL file");
  return null;
}
```
**Limitation**: Cannot test validation logic without actually running queries
**Impact**: Less useful for testing than expected

## Post-Migration Validation

### Validation Categories
Located at `/home/krwhynot/projects/crispy-crm/scripts/post-migration-validation.js`:

1. **Opportunities Migration** (lines 69-132)
   - Verify opportunities table exists and is accessible
   - Count total opportunities
   - Validate new columns: stage, status, priority, probability, customer_organization_id
   - Check backward compatibility view (`deals` view still works)

2. **Contact-Organizations Migration** (lines 134-185)
   - Verify `contact_organizations` junction table exists
   - Confirm relationship data migrated from `contacts.company_id`
   - Validate backup columns exist (`company_id_backup`)
   - Check migration count matches source data

3. **Database Views** (lines 187-222)
   - Required views: opportunities_summary, deals_summary, companies_summary, contacts_summary
   - Optional views (Stage 1): contact_influence_profile, principal_advocacy_dashboard
   - View accessibility test with data retrieval

4. **RLS Policies** (lines 224-270)
   - Test authenticated access to opportunities table
   - Verify opportunityNotes table renamed from dealNotes
   - Check RLS not blocking legitimate access (42501 error code detection)

5. **Data Integrity** (lines 272-312)
   - Detect orphaned contact records (invalid company_id references)
   - Verify migration_history table populated
   - Check for data loss during migration

### Report Generation
- Console output with color-coded status (✅ PASS, ⚠️ WARNING, ❌ FAIL)
- Summary statistics: passed, warnings, failed counts
- Exit code 0 for success, 1 for failure
- External script integration: migration-verify.js, migration-report.js

## Integration Points with CI/CD

### Current CI/CD Status
**Active Workflows**:
- **Build Check** (`.github/workflows/check.yml`): Runs on push/PR to main branch
  - Installs dependencies
  - Runs TypeScript type check
  - Executes Vite build
  - No migration/validation integration

**Disabled Workflows**:
- **Supabase Deploy** (`.github/workflows/supabase-deploy.yml.disabled`): Complete deployment workflow exists but disabled
  - Requires secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`
  - Would deploy: migrations (`npx supabase db push`), edge functions, environment secrets
  - Includes validation warnings for missing secrets

### CI/CD Integration Opportunities

**1. Pre-Merge Validation**
Could add validation check to pull requests:
```yaml
- name: Run Pre-Migration Validation
  run: npm run validate:pre-migration:dry-run
```

**2. Automated Migration Deployment**
Enable `supabase-deploy.yml.disabled` workflow:
- Configure repository secrets
- Add staging environment deployment
- Implement approval gates for production

**3. Post-Deployment Verification**
Add post-deployment validation step:
```yaml
- name: Verify Migration Success
  run: npm run migrate:validate
```

**4. Migration Testing in CI**
Use local Supabase in CI:
```yaml
- name: Setup Supabase
  uses: supabase/setup-cli@v1
- name: Start Local Supabase
  run: npx supabase start
- name: Test Migrations
  run: npx supabase db reset
```

### Why CI/CD Not Currently Integrated
Based on disabled workflow and manual scripts:
1. **Secrets Not Configured**: Deployment workflow expects 3 secrets that may not be set
2. **Manual Control Preferred**: Production migrations require careful coordination
3. **State Management Complexity**: Migration state file not compatible with stateless CI
4. **Multi-Environment Strategy**: Workflow suggests staging/production split not fully implemented

## Supabase CLI Integration

### Core Commands Used in Project

**Migration Management** (from `package.json:24-34`):
```bash
npm run migrate:production      # Full production migration orchestration
npm run migrate:execute         # Execute migrations
npm run migrate:dry-run         # Test without changes
npm run migrate:backup          # Create backups
npm run migrate:rollback        # Rollback changes
npm run migrate:validate        # Post-migration validation
npm run migrate:verify          # Verification checks
npm run migrate:status          # Check migration status
```

**Supabase-Specific** (from `package.json:51-59`):
```bash
npm run supabase:local:start    # Start local Docker stack
npm run supabase:local:stop     # Stop local services
npm run supabase:local:restart  # Restart services
npm run supabase:local:status   # Check service status
npm run supabase:local:db:reset # Reset DB + apply migrations
npm run supabase:deploy         # Push migrations + deploy edge functions
```

### Migration Application Methods

**Method 1: Supabase CLI Direct** (Recommended for production)
```bash
npx supabase db push              # Push migrations to remote
npx supabase db push --dry-run    # Preview changes
npx supabase db reset             # Reset local DB
```

**Method 2: JavaScript Orchestration** (Used by `migrate-production.js`)
- Parses SQL files
- Executes statements via Supabase client
- Provides state management and checkpoints
- **Limitation**: Complex SQL may fail (see Edge Case #1)

**Method 3: Direct SQL Execution**
```bash
psql $DATABASE_URL -f migration.sql
```

### Configuration Files

**Supabase Config** (`supabase/config.toml`):
- **Project Settings**: project_id, ports (API: 54321, DB: 54322, Studio: 54323)
- **Database**: PostgreSQL 15, connection pooler (disabled), shadow DB for diffs
- **Auth**: JWT secret, email confirmations, site URL for redirects
- **API**: Max 1000 rows, schemas exposed (public, storage, graphql_public)
- **Storage**: Disabled due to CLI version mismatch
- **Realtime**: Enabled

**Key Configuration Details**:
```toml
[db]
port = 54322
major_version = 15  # Must match remote version

[auth]
site_url = "http://localhost:5173/"
jwt_secret = "sHbpum5..."  # From cloud project

[storage]
enabled = false  # Temporarily disabled
```

### Migration Workflow (Local to Cloud)

**Documented at** `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_workflow_overview.md`:

**Step 1: Local Development**
```bash
npx supabase start                          # Start local stack
npx supabase migration new my_migration     # Create migration file
# Edit supabase/migrations/TIMESTAMP_my_migration.sql
npx supabase db reset                       # Apply locally
```

**Step 2: Test & Validate**
```bash
npm run validate:pre-migration              # Run validation
npm run migrate:dry-run                     # Test migration
```

**Step 3: Deploy to Staging**
```bash
npx supabase link --project-ref staging-ref
npx supabase db push --dry-run
npx supabase db push
```

**Step 4: Deploy to Production**
```bash
npx supabase link --project-ref prod-ref
npx supabase db dump > backup.sql          # Backup first!
npx supabase db push
npm run migrate:validate                    # Verify
```

### Schema Diff & Pull Workflow

**Pull Remote Schema** (sync remote changes to local):
```bash
npx supabase db pull
# Creates migration files for existing remote schema
```

**Generate Migration from Diff**:
```bash
npx supabase db diff -f migration_name
# Compares local to remote, generates migration
```

**Handle Schema Conflicts**:
```bash
npx supabase db pull                        # Get remote changes
# Manually resolve conflicts in migration files
npx supabase db reset                       # Test locally
npx supabase db push                        # Deploy resolved version
```

## Validation Framework Architecture

### Validation Module Structure

**Core Validators** (all export classes):
1. **ReferentialIntegrityValidator** (`referential-integrity.js`)
   - Validates foreign key relationships
   - Detects orphaned records
   - Checks contact→company, deal→company, deal→contact references
   - Severity: CRITICAL for broken FKs, HIGH for orphans

2. **UniqueConstraintValidator** (`unique-constraints.js`)
   - Detects duplicate records
   - Case-insensitive company name matching
   - Email/phone uniqueness within organizations
   - Classifies as fixable vs non-fixable conflicts

3. **RequiredFieldsValidator** (`required-fields.js`)
   - Verifies required fields populated
   - Validates company sectors against allowed values
   - Checks deal stages, contact names
   - Ensures timestamps and metadata present

4. **DataQualityAssessor** (`data-quality.js`)
   - Calculates quality scores per entity
   - Metrics: completeness (40%), accuracy (30%), consistency (20%), validity (10%)
   - Generates weighted overall score
   - Must achieve ≥99% for migration approval

### Go/No-Go Decision Framework

**Implementation**: `/home/krwhynot/projects/crispy-crm/scripts/validation/go-no-go.js`

**Decision Logic**:
```javascript
class MigrationGoNoGoDecision {
  evaluateMigrationReadiness() {
    // 1. Run all validators
    // 2. Evaluate critical blockers
    // 3. Evaluate warning thresholds
    // 4. Check system readiness
    // 5. Calculate confidence score
    // 6. Generate recommendations
    // 7. Make final decision
  }
}
```

**Confidence Scoring Algorithm**:
```javascript
confidence = 100;
confidence -= blockers.length * 25;      // -25 per blocker
confidence -= warnings.length * 5;       // -5 per warning
if (dataQuality < 95) {
  confidence -= (95 - dataQuality) * 2;  // -2 per % below 95
}
confidence = Math.max(0, Math.min(100, confidence));
```

**Decision Thresholds**:
- **GO**: 0 blockers, 0 warnings, confidence ≥80%
- **PROCEED_WITH_CAUTION**: 0 blockers, some warnings, 60-80% confidence
- **DELAY**: High-severity issues, no critical blockers
- **BLOCK**: Any critical blockers or system failures

**Exit Codes**:
- 0: GO or PROCEED_WITH_CAUTION
- 1: DELAY
- 2: BLOCK
- 3: Evaluation error

### Validation Report Generation

**Report Structure**:
```javascript
{
  timestamp: "2025-10-15T...",
  executionTime: 12345,
  decision: "GO|PROCEED_WITH_CAUTION|DELAY|BLOCK",
  confidence: 85,
  summary: {
    totalBlockers: 0,
    totalWarnings: 2,
    totalFixes: 10,
    automatedFixes: 8
  },
  validationResults: {
    referentialIntegrity: { summary },
    uniqueConstraints: { summary },
    requiredFields: { summary },
    dataQuality: { overallScore: 99.2, qualityLevel: "EXCELLENT" }
  },
  blockers: [],
  warnings: [],
  recommendations: [],
  systemReadiness: {}
}
```

**Report Outputs**:
1. Console output with emoji indicators (✅⚠️🚫)
2. JSON file: `/tmp/migration-go-no-go-{timestamp}.json`
3. Summary table in migration log

## Business Rules Enforcement

**Documentation**: `/home/krwhynot/projects/crispy-crm/docs/database/migration-business-rules.md`

The validation framework enforces 45 business rules including:

**Company Role Rules** (enforced by unique constraint validator):
- Companies are EITHER customers OR distributors (never both)
- Principals can also be distributors
- Every company classified as Customer, Principal, Distributor, Prospect, or Unknown

**Contact Relationship Rules** (enforced by referential integrity validator):
- Contacts can belong to multiple organizations
- Contacts can advocate for multiple principals
- Not all contacts need advocacy relationships

**Opportunity Rules** (enforced by required fields validator):
- Strictly one principal per opportunity
- Must have exactly one customer organization
- Cannot exist without products
- Deals are opportunities with stage 'closed-won' or 'closed-lost'

**Data Integrity Rules** (enforced across validators):
- Company deletion cascades to contacts (soft delete)
- Orphaned records flagged but not auto-deleted
- Historical data preservation required

## Key Takeaways for Future Work

### Strengths of Current System
1. **Comprehensive Validation**: Multi-stage validation with SQL + JavaScript ensures thorough checks
2. **Automated Decision Logic**: Go/no-go framework reduces human error
3. **State Management**: Checkpoint system allows recovery from failures
4. **Safety First**: Automatic backup creation, rollback recommendations
5. **Well-Documented**: Business rules, workflow guides, troubleshooting docs all present

### Areas for Improvement
1. **CI/CD Integration**: Workflows exist but disabled, need secrets configuration and testing
2. **SQL Executor Limitations**: JavaScript SQL parser should be replaced with direct CLI or pg library
3. **Dry-Run Limitations**: Should simulate results, not just skip execution
4. **State File Cleanup**: No automatic cleanup of stale migration state
5. **Storage API Disabled**: Local development missing file upload capabilities
6. **Mixed Module System**: ES modules in validators, CommonJS in orchestrator may cause issues

### Recommended Next Steps
1. Enable `supabase-deploy.yml` workflow with proper secrets
2. Add pre-merge validation to pull request checks
3. Implement staging environment deployment with approval gates
4. Replace JavaScript SQL executor with `npx supabase db execute`
5. Add automated cleanup of old migration state files
6. Update Storage API version to enable local file uploads
7. Consider migration to pure ES modules throughout validation framework

## Relevant Documentation

### Internal Documentation
- Migration Business Rules: `/home/krwhynot/projects/crispy-crm/docs/database/migration-business-rules.md`
- Supabase Workflow: `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_workflow_overview.md`
- Supabase Commands: `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_commands_reference.md`
- Supabase Troubleshooting: `/home/krwhynot/projects/crispy-crm/docs/supabase/supabase_troubleshooting.md`
- Validation Framework Summary: `/home/krwhynot/projects/crispy-crm/scripts/validation/VALIDATION_FRAMEWORK_SUMMARY.md`
- Migration Reconciliation: `/home/krwhynot/projects/crispy-crm/supabase/migrations/RECONCILIATION_SUMMARY.md`

### External Documentation
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase GitHub Actions](https://github.com/supabase/setup-cli)

---

**Research Completed**: 2025-10-15
**Codebase Version**: main branch (commit 6f2db15)
**Research Scope**: Complete validation framework, migration patterns, Supabase CLI integration, and CI/CD analysis
